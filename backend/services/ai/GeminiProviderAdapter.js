const { GoogleGenerativeAI } = require('@google/generative-ai');
const AiProviderAdapter = require('./AiProviderAdapter');
const { ModelRegistry } = require('./ModelRegistry');

class GeminiProviderAdapter extends AiProviderAdapter {
  constructor() {
    super('gemini');
    this.genAI = null;
  }

  async initialize() {
    if (process.env.NODE_ENV === 'test') {
      this.genAI = null;
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
      } catch (error) {
        console.error('[GeminiProviderAdapter] Failed to initialize GoogleGenerativeAI:', error);
      }
    }
  }

  async healthCheck() {
    if (!this.genAI) {
      return 'DEGRADED'; // Configured but key might be absent or invalid
    }
    return 'READY';
  }

  async listModels() {
    return ModelRegistry.listModels().filter(m => m.providerId === 'gemini');
  }

  /**
   * Translates incoming messages format to Gemini format
   */
  _translateMessages(messages) {
    const contents = [];
    let systemInstruction = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Concatenate system instruction strings
        const textParts = msg.parts.map(p => p.text).filter(Boolean);
        systemInstruction += (systemInstruction ? '\n' : '') + textParts.join('\n');
        continue;
      }

      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      const parts = [];

      for (const part of msg.parts) {
        if (part.text) {
          parts.push({ text: part.text });
        } else if (part.inlineData) {
          parts.push({
            inlineData: {
              data: part.inlineData.data,
              mimeType: part.inlineData.mimeType
            }
          });
        } else if (part.toolCall) {
          parts.push({
            functionCall: {
              name: part.toolCall.name,
              args: part.toolCall.args
            }
          });
        } else if (part.toolResult) {
          parts.push({
            functionResponse: {
              name: part.toolResult.name,
              response: part.toolResult.result
            }
          });
        }
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    return { contents, systemInstruction };
  }

  _translateTools(tools) {
    if (!tools || tools.length === 0) return undefined;
    return [
      {
        functionDeclarations: tools.map(t => ({
          name: t.name || t.toolName,
          description: t.description,
          parameters: t.inputSchema || t.parameters
        }))
      }
    ];
  }

  async generate(request) {
    const { modelId, messages, tools, structuredOutput, temperature, maxTokens } = request;

    if (!this.genAI) {
      return this._simulateGenerate(request);
    }

    try {
      const { contents, systemInstruction } = this._translateMessages(messages);
      const geminiTools = this._translateTools(tools);

      const options = { model: modelId };
      if (systemInstruction) {
        options.systemInstruction = systemInstruction;
      }

      const config = {};
      if (temperature !== undefined) config.temperature = temperature;
      if (maxTokens !== undefined) config.maxOutputTokens = maxTokens;
      if (geminiTools) config.tools = geminiTools;

      if (structuredOutput && structuredOutput.schema) {
        config.responseMimeType = 'application/json';
        // Note: Gemini SDK accepts schema. We can pass it if wanted:
        // config.responseSchema = structuredOutput.schema;
      }

      const model = this.genAI.getGenerativeModel(options);
      
      const result = await model.generateContent({
        contents,
        generationConfig: config
      });

      const response = await result.response;
      
      // Parse output content
      let text = response.text() || '';
      
      // Parse function calls (tool calls)
      const functionCalls = response.functionCalls();
      const toolCalls = functionCalls ? functionCalls.map(fc => ({
        name: fc.name,
        args: fc.args
      })) : [];

      // Calculate usage metrics
      // Note: If metadata is not available, we estimate it
      const usageMetadata = response.usageMetadata || {};
      const inputTokens = usageMetadata.promptTokenCount || 0;
      const outputTokens = usageMetadata.candidatesTokenCount || 0;

      return {
        text: text.trim(),
        toolCalls,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens
        },
        providerRequestId: response.id || `gemini-req-${Date.now()}`
      };
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async *stream(request) {
    const { modelId, messages, temperature, maxTokens } = request;

    if (!this.genAI) {
      yield* this._simulateStream(request);
      return;
    }

    try {
      const { contents, systemInstruction } = this._translateMessages(messages);

      const options = { model: modelId };
      if (systemInstruction) {
        options.systemInstruction = systemInstruction;
      }

      const config = {};
      if (temperature !== undefined) config.temperature = temperature;
      if (maxTokens !== undefined) config.maxOutputTokens = maxTokens;

      const model = this.genAI.getGenerativeModel(options);
      const result = await model.generateContentStream({
        contents,
        generationConfig: config
      });

      for await (const chunk of result.stream) {
        const text = chunk.text() || '';
        yield {
          text,
          finishReason: chunk.candidates?.[0]?.finishReason || null
        };
      }
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async estimateTokens(messages, modelId) {
    if (!this.genAI) {
      // Standard conservative estimate
      let charCount = 0;
      for (const msg of messages) {
        for (const part of msg.parts) {
          if (part.text) charCount += part.text.length;
        }
      }
      return Math.ceil(charCount / 4);
    }

    try {
      const { contents } = this._translateMessages(messages);
      const model = this.genAI.getGenerativeModel({ model: modelId });
      const countResult = await model.countTokens({ contents });
      return countResult.totalTokens || 0;
    } catch (err) {
      // Fallback
      return 100;
    }
  }

  normalizeError(error) {
    const msg = error.message || '';
    const errCode = error.code || '';

    if (msg.includes('API key') || msg.includes('unauthorized') || errCode === 401) {
      return new Error('AI_AUTHENTICATION_ERROR: Invalid or unauthorized API key.');
    }
    if (msg.includes('rate limit') || msg.includes('quota') || errCode === 429) {
      return new Error('AI_RATE_LIMITED: Gemini rate limit exceeded.');
    }
    if (msg.includes('not found') || msg.includes('model') || errCode === 404) {
      return new Error('AI_MODEL_UNAVAILABLE: Model was not found or is unavailable.');
    }
    if (msg.includes('context') || msg.includes('max tokens')) {
      return new Error('AI_CONTEXT_LIMIT_EXCEEDED: Input size exceeds model context window.');
    }
    if (msg.includes('safety') || msg.includes('blocked') || msg.includes('content')) {
      return new Error('AI_CONTENT_REJECTED: Output was blocked by safety policies.');
    }

    return new Error(`AI_UNKNOWN_PROVIDER_ERROR: ${msg}`);
  }

  // --- LOCAL TEST SIMULATORS ---
  _simulateGenerate(request) {
    const textLower = JSON.stringify(request.messages).toLowerCase();
    
    // OCR Simulation
    if (request.taskType === 'PRESCRIPTION_OCR' || textLower.includes('prescription')) {
      return {
        text: JSON.stringify([
          {
            name: "Amoxicillin",
            dosage: "500mg",
            frequency: "three-times-daily",
            times: ["08:00", "14:00", "20:00"],
            ingredients: "Amoxicillin",
            notes: "Finish the full course. Take with meals."
          },
          {
            name: "Ibuprofen",
            dosage: "400mg",
            frequency: "as-needed",
            times: ["12:00"],
            ingredients: "Ibuprofen",
            notes: "Take after food for pain relief."
          }
        ]),
        toolCalls: [],
        usage: { inputTokens: 50, outputTokens: 60, totalTokens: 110 },
        providerRequestId: `sim-ocr-${Date.now()}`
      };
    }

    // Drug audit simulation
    if (textLower.includes('warfarin') && (textLower.includes('aspirin') || textLower.includes('ibuprofen'))) {
      return {
        text: "CRITICAL INTERACTION ASSESSMENT (HIGH SEVERITY):\nConcomitant use increases bleeding risk. Aspirin inhibits platelet aggregation, compounding Warfarins anticoagulant effect. Monitor INR closely or suggest alternative antiplatelet therapy.\nDISCLAIMER: This clinical abstract is generated to augment workflows and must be audited by the primary physician.",
        toolCalls: [],
        usage: { inputTokens: 40, outputTokens: 50, totalTokens: 90 },
        providerRequestId: `sim-audit-${Date.now()}`
      };
    }

    // Standard clinical summary simulation
    if (request.taskType === 'CLINICAL_SUMMARY' || textLower.includes('summary')) {
      return {
        text: "HELIO AI Clinical Summary:\n• Patients blood pressure logs indicate regular control under Lisinopril therapy.\n• Active care plan remains aligned with standard hypertension guidelines.\nDISCLAIMER: This clinical abstract is generated to augment workflows and must be audited by the primary physician before diagnostic actions.",
        toolCalls: [],
        usage: { inputTokens: 30, outputTokens: 40, totalTokens: 70 },
        providerRequestId: `sim-summary-${Date.now()}`
      };
    }

    // Default chat
    return {
      text: "Hello! As your Helio Health Assistant, I'm here to analyze your queries and active care timeline.",
      toolCalls: [],
      usage: { inputTokens: 20, outputTokens: 25, totalTokens: 45 },
      providerRequestId: `sim-chat-${Date.now()}`
    };
  }

  async *_simulateStream(request) {
    const text = "Hello! As your Helio Health Assistant, I'm here to analyze your queries and active care timeline.";
    const chunks = text.split(' ');
    for (let i = 0; i < chunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      yield {
        text: chunks[i] + (i === chunks.length - 1 ? '' : ' '),
        finishReason: i === chunks.length - 1 ? 'STOP' : null
      };
    }
  }

  async embed(request) {
    if (!this.genAI) {
      return this._simulateEmbed(request);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: request.modelId });
      const result = await model.embedContent(request.text);
      if (!result || !result.embedding || !result.embedding.values) {
        throw new Error('Invalid embedding response from provider.');
      }
      const inputTokens = Math.ceil(request.text.length / 4);
      return {
        vector: result.embedding.values,
        usage: {
          inputTokens,
          totalTokens: inputTokens
        },
        providerRequestId: `gemini-embed-${Date.now()}`
      };
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async embedBatch(request) {
    if (!this.genAI) {
      return this._simulateEmbedBatch(request);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: request.modelId });
      const results = await Promise.all(
        request.texts.map(text => model.embedContent(text))
      );
      return results.map((res, i) => {
        if (!res || !res.embedding || !res.embedding.values) {
          throw new Error(`Invalid embedding response at index ${i} from provider.`);
        }
        const inputTokens = Math.ceil(request.texts[i].length / 4);
        return {
          vector: res.embedding.values,
          usage: {
            inputTokens,
            totalTokens: inputTokens
          }
        };
      });
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  _simulateEmbed(request) {
    const text = request.text || '';
    const dimensions = request.dimensions || 768;
    const vector = this._generateDeterministicMockVector(text, dimensions);
    const inputTokens = Math.ceil(text.length / 4);
    return {
      vector,
      usage: { inputTokens, totalTokens: inputTokens },
      providerRequestId: `sim-embed-${Date.now()}`
    };
  }

  _simulateEmbedBatch(request) {
    const texts = request.texts || [];
    const dimensions = request.dimensions || 768;
    return texts.map(text => {
      const vector = this._generateDeterministicMockVector(text, dimensions);
      const inputTokens = Math.ceil(text.length / 4);
      return {
        vector,
        usage: { inputTokens, totalTokens: inputTokens }
      };
    });
  }

  _generateDeterministicMockVector(text, dimensions) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(text).digest();
    const vector = [];
    for (let i = 0; i < dimensions; i++) {
      const val1 = hash[i % hash.length];
      const val2 = hash[(i + 1) % hash.length];
      const factor = (val1 * 256 + val2) / 65535;
      vector.push(factor * 2 - 1);
    }
    let sumSq = 0;
    for (const v of vector) sumSq += v * v;
    const norm = Math.sqrt(sumSq) || 1;
    return vector.map(v => v / norm);
  }
}

module.exports = GeminiProviderAdapter;
