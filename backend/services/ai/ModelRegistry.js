const capabilities = {
  TEXT_GENERATION: 'TEXT_GENERATION',
  STREAMING: 'STREAMING',
  STRUCTURED_OUTPUT: 'STRUCTURED_OUTPUT',
  TOOLS: 'TOOLS',
  VISION: 'VISION',
  REASONING: 'REASONING',
  LONG_CONTEXT: 'LONG_CONTEXT',
  EMBEDDINGS: 'EMBEDDINGS'
};

const models = {
  'gemini-1.5-flash': {
    providerId: 'gemini',
    modelId: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    enabled: true,
    capabilities: [
      capabilities.TEXT_GENERATION,
      capabilities.STREAMING,
      capabilities.STRUCTURED_OUTPUT,
      capabilities.TOOLS,
      capabilities.VISION,
      capabilities.LONG_CONTEXT
    ],
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsTools: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsReasoning: false,
    inputTokenCost: 0.000000075, // $0.075 per 1M tokens
    outputTokenCost: 0.00000030, // $0.30 per 1M tokens
    cachedInputTokenCost: 0.00000001875, // $0.01875 per 1M tokens
    reasoningTokenCost: 0,
    currency: 'USD',
    latencyClass: 'LOW',
    qualityClass: 'STANDARD'
  },
  'gemini-1.5-pro': {
    providerId: 'gemini',
    modelId: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    enabled: true,
    capabilities: [
      capabilities.TEXT_GENERATION,
      capabilities.STREAMING,
      capabilities.STRUCTURED_OUTPUT,
      capabilities.TOOLS,
      capabilities.VISION,
      capabilities.LONG_CONTEXT,
      capabilities.REASONING
    ],
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsTools: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsReasoning: true,
    inputTokenCost: 0.00000125, // $1.25 per 1M tokens
    outputTokenCost: 0.000005, // $5.00 per 1M tokens
    cachedInputTokenCost: 0.0000003125,
    reasoningTokenCost: 0.000005,
    currency: 'USD',
    latencyClass: 'MEDIUM',
    qualityClass: 'HIGH'
  }
};

class ModelRegistry {
  getModel(modelId) {
    return models[modelId] || null;
  }

  listModels() {
    return Object.values(models);
  }

  isSupported(modelId, capability) {
    const model = this.getModel(modelId);
    if (!model || !model.enabled) return false;
    return model.capabilities.includes(capability);
  }
}

module.exports = {
  ModelRegistry: new ModelRegistry(),
  Capabilities: capabilities
};
