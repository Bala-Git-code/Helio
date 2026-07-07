class StructuredOutputService {
  /**
   * Validates parsed JSON data against a JSON Schema structure
   */
  validate(data, schema) {
    const errors = [];
    this._validateNode(data, schema, '', errors);
    return {
      valid: errors.length === 0,
      errors
    };
  }

  _validateNode(data, schema, path, errors) {
    if (!schema) return;

    const type = schema.type;
    const currentPath = path || 'root';

    if (type === 'object') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        errors.push(`Path "${currentPath}" must be an object.`);
        return;
      }

      // Check required properties
      if (Array.isArray(schema.required)) {
        for (const req of schema.required) {
          if (data[req] === undefined) {
            errors.push(`Property "${req}" is required at "${currentPath}".`);
          }
        }
      }

      // Validate properties
      if (schema.properties) {
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          if (data[propName] !== undefined) {
            this._validateNode(data[propName], propSchema, `${currentPath}.${propName}`, errors);
          }
        }
      }
    } else if (type === 'array') {
      if (!Array.isArray(data)) {
        errors.push(`Path "${currentPath}" must be an array.`);
        return;
      }

      if (schema.items) {
        data.forEach((item, idx) => {
          this._validateNode(item, schema.items, `${currentPath}[${idx}]`, errors);
        });
      }
    } else if (type === 'string') {
      if (typeof data !== 'string') {
        errors.push(`Path "${currentPath}" must be a string.`);
      }
    } else if (type === 'number' || type === 'integer') {
      if (typeof data !== 'number') {
        errors.push(`Path "${currentPath}" must be a number.`);
      }
    } else if (type === 'boolean') {
      if (typeof data !== 'boolean') {
        errors.push(`Path "${currentPath}" must be a boolean.`);
      }
    }
  }

  /**
   * Bounded repair attempt
   */
  async repair(params) {
    const {
      engine, // reference to AiExecutionEngine
      request,
      providerId,
      modelId,
      originalText,
      validationErrors,
      schema,
      currentAttempt,
      maxAttempts = 2
    } = params;

    if (currentAttempt > maxAttempts) {
      throw new Error(`AI_INVALID_STRUCTURED_OUTPUT: Structured output repair failed after ${maxAttempts} attempts.`);
    }

    console.log(`[StructuredOutputService] Attempting repair #${currentAttempt} for model: ${modelId}`);

    // Create a repair prompt
    const repairPrompt = `
You returned a response that failed JSON Schema validation.
Target Schema:
${JSON.stringify(schema, null, 2)}

Validation Errors:
${validationErrors.map(e => `- ${e}`).join('\n')}

Original Output:
${originalText}

Please correct the output. Return ONLY a valid raw JSON string matching the schema. Do not include markdown formatting like \`\`\`json.
`;

    // Duplicate original request but construct messages for correction
    const repairMessages = [
      ...request.messages,
      { role: 'model', parts: [{ text: originalText }] },
      { role: 'user', parts: [{ text: repairPrompt }] }
    ];

    const repairRequest = {
      ...request,
      messages: repairMessages,
      // Temporarily disable structured schema config to allow model to output correction directly
      structuredOutput: null
    };

    // Execute via engine (so it routes, logs, counts costs, updates database etc.)
    const execution = await engine.execute({
      ...repairRequest,
      correlationId: request.correlationId || request.executionId,
      metadata: { ...request.metadata, isRepairAttempt: true, originalExecutionId: request.executionId }
    });

    return execution;
  }
}

module.exports = new StructuredOutputService();
