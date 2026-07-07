const { ModelRegistry } = require('./ModelRegistry');

class TokenEstimator {
  estimateInputTokens(messages) {
    let charCount = 0;
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        if (msg.parts && Array.isArray(msg.parts)) {
          for (const part of msg.parts) {
            if (part.text) charCount += part.text.length;
          }
        }
      }
    }
    return Math.ceil(charCount / 4);
  }

  estimateOutputTokens(maxOutputTokens, modelId) {
    const model = ModelRegistry.getModel(modelId);
    if (!model) return 1024;
    return maxOutputTokens || model.maxOutputTokens || 1024;
  }

  calculateCost(inputTokens, outputTokens, modelId, isCached = false) {
    const model = ModelRegistry.getModel(modelId);
    if (!model) return 0;

    const inputPrice = isCached ? model.cachedInputTokenCost : model.inputTokenCost;
    const outputPrice = model.outputTokenCost;

    return (inputTokens * inputPrice) + (outputTokens * outputPrice);
  }
}

module.exports = new TokenEstimator();
