class JobHandlerRegistry {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Registers a job handler.
   * @param {Object} handlerConfig
   * @param {string} handlerConfig.jobType
   * @param {Function} handlerConfig.execute
   * @param {Function} [handlerConfig.validatePayload]
   * @param {Object} [handlerConfig.executionPolicy]
   */
  register(handlerConfig) {
    if (!handlerConfig.jobType) {
      throw new Error('Handler registration must specify a jobType.');
    }
    if (typeof handlerConfig.execute !== 'function') {
      throw new Error(`Handler execute must be a function for job type: ${handlerConfig.jobType}`);
    }
    if (this.handlers.has(handlerConfig.jobType)) {
      throw new Error(`Duplicate job handler registration for job type: ${handlerConfig.jobType}`);
    }

    // Validate execution policy if provided
    if (handlerConfig.executionPolicy) {
      const policy = handlerConfig.executionPolicy;
      if (policy.maxAttempts !== undefined && policy.maxAttempts <= 0) {
        throw new Error(`Invalid maxAttempts (${policy.maxAttempts}) for job type: ${handlerConfig.jobType}`);
      }
      if (policy.heartbeatIntervalMs !== undefined && policy.leaseDurationMs !== undefined) {
        if (policy.heartbeatIntervalMs >= policy.leaseDurationMs) {
          throw new Error(
            `heartbeatIntervalMs (${policy.heartbeatIntervalMs}) must be strictly less than leaseDurationMs (${policy.leaseDurationMs}) for job type: ${handlerConfig.jobType}`
          );
        }
      }
    }

    this.handlers.set(handlerConfig.jobType, handlerConfig);
    console.log(`[JobHandlerRegistry] Registered handler for job type: "${handlerConfig.jobType}"`);
  }

  getHandler(jobType) {
    return this.handlers.get(jobType);
  }

  hasHandler(jobType) {
    return this.handlers.has(jobType);
  }

  clear() {
    this.handlers.clear();
  }
}

module.exports = new JobHandlerRegistry();
