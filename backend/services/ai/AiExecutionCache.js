const crypto = require('crypto');

class AiExecutionCache {
  constructor() {
    this.cacheStore = new Map();
  }

  generateCacheKey(tenantId, taskType, promptVersion, messages, requestOptions = {}) {
    // Generate deterministic signature from messages
    const contentsStr = JSON.stringify(messages);
    const optionsStr = JSON.stringify({
      temperature: requestOptions.temperature,
      maxTokens: requestOptions.maxTokens,
      structuredOutput: requestOptions.structuredOutput
    });

    const hash = crypto.createHash('sha256')
      .update(contentsStr + optionsStr)
      .digest('hex');

    // Tenant isolated cache key format
    return `tenant:${tenantId}:task:${taskType}:pv:${promptVersion || 'none'}:hash:${hash}`;
  }

  async get(key) {
    const entry = this.cacheStore.get(key);
    if (!entry) return null;

    if (entry.expiresAt < Date.now()) {
      this.cacheStore.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key, value, ttlSeconds = 3600) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cacheStore.set(key, {
      value,
      expiresAt
    });
  }

  async delete(key) {
    this.cacheStore.delete(key);
  }

  async invalidateTenantScope(tenantId) {
    const prefix = `tenant:${tenantId}:`;
    for (const key of this.cacheStore.keys()) {
      if (key.startsWith(prefix)) {
        this.cacheStore.delete(key);
      }
    }
  }

  async clear() {
    this.cacheStore.clear();
  }
}

module.exports = new AiExecutionCache();
