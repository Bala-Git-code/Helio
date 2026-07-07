const AiExecutionEngine = require('./ai/AiExecutionEngine');
const PromptRegistry = require('./ai/PromptRegistry');

class AIGatewayService {
  async generateConsultationSummary(patientContext, notesBody) {
    const patientId = String(patientContext.userId || patientContext._id || 'unknown-patient');

    const { text: promptText, promptDef } = await PromptRegistry.renderPrompt('clinical-summary-v1', '1.0.0', {
      patientName: patientContext.name,
      allergies: patientContext.allergies?.join(', ') || 'None',
      conditions: patientContext.conditions?.join(', ') || 'None',
      notesBody
    });

    const messages = [
      {
        role: 'user',
        parts: [{ text: promptText }]
      }
    ];

    try {
      const summary = await AiExecutionEngine.execute({
        tenantId: patientId,
        userId: patientId,
        taskType: 'CLINICAL_SUMMARY',
        messages,
        promptId: promptDef.promptId,
        promptVersion: promptDef.version,
        executionMode: 'NON_STREAMING',
        maxOutputTokens: 2048,
        temperature: 0.2
      });

      return summary;
    } catch (err) {
      console.error('[AIGatewayService] generateConsultationSummary failed:', err);
      throw err;
    }
  }

  async auditInteraction(drugA, drugB) {
    const { text: promptText, promptDef } = await PromptRegistry.renderPrompt('drug-interaction-v1', '1.0.0', {
      drugA,
      drugB
    });

    const messages = [
      {
        role: 'user',
        parts: [{ text: promptText }]
      }
    ];

    try {
      const audit = await AiExecutionEngine.execute({
        tenantId: 'system',
        userId: 'system',
        taskType: 'DRUG_INTERACTION',
        messages,
        promptId: promptDef.promptId,
        promptVersion: promptDef.version,
        executionMode: 'NON_STREAMING',
        maxOutputTokens: 1024,
        temperature: 0.1
      });

      return audit;
    } catch (err) {
      console.error('[AIGatewayService] auditInteraction failed:', err);
      throw err;
    }
  }
}

module.exports = new AIGatewayService();
