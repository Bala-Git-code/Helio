const AiPromptDefinition = require('../../models/AiPromptDefinition');
const StructuredOutputService = require('./StructuredOutputService');

class PromptRegistry {
  constructor() {
    this.localCache = new Map();
  }

  async getPrompt(promptId, version) {
    const cacheKey = `${promptId}:${version}`;
    if (this.localCache.has(cacheKey)) {
      return this.localCache.get(cacheKey);
    }

    const definition = await AiPromptDefinition.findOne({ promptId, version });
    if (definition) {
      this.localCache.set(cacheKey, definition);
    }
    return definition;
  }

  async registerPrompt(def) {
    // Upsert database record
    await AiPromptDefinition.findOneAndUpdate(
      { promptId: def.promptId, version: def.version },
      { $set: def },
      { upsert: true, new: true }
    );
    this.localCache.delete(`${def.promptId}:${def.version}`);
  }

  async renderPrompt(promptId, version, inputs) {
    const promptDef = await this.getPrompt(promptId, version);
    if (!promptDef) {
      throw new Error(`AI_INVALID_REQUEST: Prompt template "${promptId}" (v${version}) is not registered.`);
    }

    // 1. Validate inputs against prompt's inputSchema
    if (promptDef.inputSchema) {
      const { valid, errors } = StructuredOutputService.validate(inputs, promptDef.inputSchema);
      if (!valid) {
        throw new Error(`AI_INVALID_REQUEST: Prompt inputs fail validation: ${errors.join(', ')}`);
      }
    }

    // 2. Render simple Mustache templates (e.g. {{name}})
    let rendered = promptDef.template;
    for (const [k, v] of Object.entries(inputs)) {
      const val = Array.isArray(v) ? v.join(', ') : String(v);
      rendered = rendered.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), val);
    }

    return {
      text: rendered,
      promptDef
    };
  }

  /**
   * Seeds default system prompts if not present
   */
  async seedDefaults() {
    const defaults = [
      {
        promptId: 'clinical-summary-v1',
        version: '1.0.0',
        taskType: 'CLINICAL_SUMMARY',
        description: 'Template for generating doctor consultation summaries.',
        template: `You are HELIO AI Clinical Copilot. Summarize the following consultation notes for the patient profile:
Patient Name: {{patientName}}
Allergies: {{allergies}}
Conditions: {{conditions}}

Consultation observations:
{{notesBody}}

Provide a clean, bulleted medical abstract summary, listing active symptoms and recommended care plans.
Do not make definitive diagnoses. Always append this warning exactly:
"DISCLAIMER: This clinical abstract is generated to augment workflows and must be audited by the primary physician before diagnostic actions."`,
        inputSchema: {
          type: 'object',
          properties: {
            patientName: { type: 'string' },
            allergies: { type: 'string' },
            conditions: { type: 'string' },
            notesBody: { type: 'string' }
          },
          required: ['patientName', 'notesBody']
        }
      },
      {
        promptId: 'drug-interaction-v1',
        version: '1.0.0',
        taskType: 'DRUG_INTERACTION',
        description: 'Checks clinical drug-drug interactions.',
        template: `Analyze potential drug-drug interaction warning between substance A: "{{drugA}}" and substance B: "{{drugB}}".
If they have a known clinical conflict (like Aspirin + Warfarin bleeding hazard), explain the mechanism and severity in a short clinical assessment.
If safe, note that no severe interactions are recorded.`,
        inputSchema: {
          type: 'object',
          properties: {
            drugA: { type: 'string' },
            drugB: { type: 'string' }
          },
          required: ['drugA', 'drugB']
        }
      }
    ];

    for (const d of defaults) {
      await this.registerPrompt(d);
    }
  }
}

module.exports = new PromptRegistry();
