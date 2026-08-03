/**
 * Circuit Breaker pattern implementation to wrap external API integrations (e.g. WhatsApp Cloud API).
 */
export class CircuitBreaker {
  constructor({ failureThreshold = 5, recoveryTimeoutMs = 30000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeoutMs = recoveryTimeoutMs;
    this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(action) {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit Breaker is OPEN. Request blocked to prevent cascade failure.');
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      throw err;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure(err) {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeoutMs;
      console.warn(`[CircuitBreaker] Circuit opened! Tripped by ${this.failureCount} consecutive failures. Will retry after ${this.recoveryTimeoutMs}ms.`);
    }
  }
}

export default CircuitBreaker;
