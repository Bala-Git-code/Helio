class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5; // failures to trigger OPEN
    this.cooldownPeriodMs = options.cooldownPeriodMs || 30000; // time in OPEN before attempting HALF_OPEN
    
    this.state = 'CLOSED'; // 'CLOSED', 'OPEN', 'HALF_OPEN'
    this.failureCount = 0;
    this.lastStateChange = Date.now();
    this.lastFailureTime = null;
  }

  async execute(action) {
    this.checkState();

    if (this.state === 'OPEN') {
      throw new Error(`CircuitBreaker "${this.name}" is OPEN. Request blocked.`);
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

  checkState() {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastStateChange > this.cooldownPeriodMs) {
        this.transitionTo('HALF_OPEN');
      }
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.transitionTo('CLOSED');
    }
  }

  onFailure(err) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.warn(`[CircuitBreaker - ${this.name}] Failure registered (#${this.failureCount}): ${err.message}`);

    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this.transitionTo('OPEN');
    } else if (this.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN resets the breaker back to OPEN
      this.transitionTo('OPEN');
    }
  }

  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    console.log(`[CircuitBreaker - ${this.name}] State transition: ${oldState} -> ${newState}`);
  }
}

// In-memory cache of circuit instances to avoid recreating them
const breakers = new Map();

function getCircuitBreaker(name, options = {}) {
  if (!breakers.has(name)) {
    breakers.set(name, new CircuitBreaker(name, options));
  }
  return breakers.get(name);
}

module.exports = {
  CircuitBreaker,
  getCircuitBreaker
};
