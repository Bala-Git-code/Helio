class AiProviderAdapter {
  constructor(providerId) {
    this.providerId = providerId;
  }

  async initialize() {
    throw new Error('initialize() must be implemented');
  }

  async healthCheck() {
    throw new Error('healthCheck() must be implemented');
  }

  async listModels() {
    throw new Error('listModels() must be implemented');
  }

  /**
   * Non-streaming text/structured generation
   */
  async generate(request) {
    throw new Error('generate() must be implemented');
  }

  /**
   * Streaming text/structured generation returns an EventEmitter or AsyncIterator
   */
  async stream(request) {
    throw new Error('stream() must be implemented');
  }

  /**
   * Estimates token usage for request parameters
   */
  async estimateTokens(messages, modelId) {
    throw new Error('estimateTokens() must be implemented');
  }

  /**
   * Normalizes raw SDK exceptions to HELIO AI errors
   */
  normalizeError(error) {
    throw new Error('normalizeError() must be implemented');
  }

  async shutdown() {
    // Graceful cleanup
  }
}

module.exports = AiProviderAdapter;
