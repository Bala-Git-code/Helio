import Redis from 'ioredis';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Redis Client & Cache Infrastructure (config/redis.js)
 * ============================================================================
 * 
 * Architectural Purpose:
 * High-performance stateful in-memory data store providing:
 * 1. Express session store backing (connect-redis) - Zero-JWT / Zero-Password.
 * 2. 24-hour cryptographic clinical pairing code storage (HL-XXXX-XXXX).
 * 3. Physician brute-force lockout rate limiting (5 failed attempts / 30-minute lockout).
 * 
 * Reliability & Fail-Safe Architecture:
 * - Exponential backoff retry strategy with circuit prevention.
 * - Non-blocking asynchronous bootstrap connection.
 * - Resilient dev-mode in-memory TTL cache fallback to ensure local developer
 *   continuity and CI test execution when a local Redis service is unreachable.
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const NODE_ENV = process.env.NODE_ENV || 'development';

let isRedisConnected = false;

// Initialize ioredis instance with resilient enterprise connection settings
export const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy(times) {
    if (NODE_ENV !== 'production' && times > 3) {
      // In local development without an active Redis service, suppress continuous reconnect logs
      return null;
    }
    // Exponential backoff capped at 3000ms
    const delay = Math.min(times * 500, 3000);
    return delay;
  },
});

// Event Listeners for Operational Telemetry
redisClient.on('connect', () => {
  isRedisConnected = true;
  console.log(`[HELIO REDIS] Connected to Redis cluster at ${REDIS_URL}`);
});

redisClient.on('ready', () => {
  isRedisConnected = true;
  console.log('[HELIO REDIS] Client ready for session and pairing operations.');
});

redisClient.on('error', (err) => {
  isRedisConnected = false;
  if (NODE_ENV !== 'production') {
    console.warn(`[HELIO REDIS WARN] Service unreachable: ${err.message}. Dev in-memory fallback active.`);
  } else {
    console.error(`[HELIO REDIS ERROR] Production Redis failure: ${err.message}`);
  }
});

redisClient.on('close', () => {
  isRedisConnected = false;
});

redisClient.on('reconnecting', (delay) => {
  if (NODE_ENV === 'production') {
    console.warn(`[HELIO REDIS] Reconnecting to cluster in ${delay}ms...`);
  }
});

// Non-blocking connection bootstrap
redisClient.connect().catch((err) => {
  if (NODE_ENV === 'production') {
    console.error('[HELIO REDIS FATAL] Critical: Failed to establish initial Redis cluster connection:', err);
  }
});

/**
 * Resilient In-Memory Fallback Adapter
 * Guarantees that pairing code generation, TTL validation, and rate-limiting
 * execute reliably during local development or offline containerized builds.
 */
class MemoryRedisStore {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  _isExpired(key) {
    const expiry = this.ttls.get(key);
    if (expiry && Date.now() > expiry) {
      this.store.delete(key);
      this.ttls.delete(key);
      return true;
    }
    return false;
  }

  async get(key) {
    if (this._isExpired(key)) return null;
    return this.store.get(key) || null;
  }

  async set(key, value) {
    this.store.set(key, String(value));
    this.ttls.delete(key);
    return 'OK';
  }

  async setex(key, seconds, value) {
    this.store.set(key, String(value));
    this.ttls.set(key, Date.now() + seconds * 1000);
    return 'OK';
  }

  async del(key) {
    const existed = this.store.delete(key);
    this.ttls.delete(key);
    return existed ? 1 : 0;
  }

  async ttl(key) {
    if (!this.store.has(key) || this._isExpired(key)) return -2;
    const expiry = this.ttls.get(key);
    if (!expiry) return -1;
    return Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
  }

  async incr(key) {
    if (this._isExpired(key)) {
      this.store.set(key, '1');
      return 1;
    }
    const cur = parseInt(this.store.get(key) || '0', 10);
    const next = cur + 1;
    this.store.set(key, String(next));
    return next;
  }

  async expire(key, seconds) {
    if (!this.store.has(key) || this._isExpired(key)) return 0;
    this.ttls.set(key, Date.now() + seconds * 1000);
    return 1;
  }

  async exists(key) {
    if (this._isExpired(key)) return 0;
    return this.store.has(key) ? 1 : 0;
  }
}

const fallbackStore = new MemoryRedisStore();

/**
 * Standard TTL & Cache Methods Facade
 * Dispatches to live ioredis instance when reachable, or gracefully falls back.
 */
export const redisService = {
  isLive: () => isRedisConnected,

  async get(key) {
    if (isRedisConnected) {
      try {
        return await redisClient.get(key);
      } catch {
        return await fallbackStore.get(key);
      }
    }
    return await fallbackStore.get(key);
  },

  async set(key, value) {
    if (isRedisConnected) {
      try {
        return await redisClient.set(key, value);
      } catch {
        return await fallbackStore.set(key, value);
      }
    }
    return await fallbackStore.set(key, value);
  },

  async setex(key, seconds, value) {
    if (isRedisConnected) {
      try {
        return await redisClient.setex(key, seconds, value);
      } catch {
        return await fallbackStore.setex(key, seconds, value);
      }
    }
    return await fallbackStore.setex(key, seconds, value);
  },

  async del(key) {
    if (isRedisConnected) {
      try {
        return await redisClient.del(key);
      } catch {
        return await fallbackStore.del(key);
      }
    }
    return await fallbackStore.del(key);
  },

  async ttl(key) {
    if (isRedisConnected) {
      try {
        return await redisClient.ttl(key);
      } catch {
        return await fallbackStore.ttl(key);
      }
    }
    return await fallbackStore.ttl(key);
  },

  async incr(key) {
    if (isRedisConnected) {
      try {
        return await redisClient.incr(key);
      } catch {
        return await fallbackStore.incr(key);
      }
    }
    return await fallbackStore.incr(key);
  },

  async expire(key, seconds) {
    if (isRedisConnected) {
      try {
        return await redisClient.expire(key, seconds);
      } catch {
        return await fallbackStore.expire(key, seconds);
      }
    }
    return await fallbackStore.expire(key, seconds);
  },

  async exists(key) {
    if (isRedisConnected) {
      try {
        return await redisClient.exists(key);
      } catch {
        return await fallbackStore.exists(key);
      }
    }
    return await fallbackStore.exists(key);
  },
};

// Export individual methods for direct standard TTL imports
export const get = (key) => redisService.get(key);
export const set = (key, value) => redisService.set(key, value);
export const setex = (key, seconds, value) => redisService.setex(key, seconds, value);
export const del = (key) => redisService.del(key);
export const ttl = (key) => redisService.ttl(key);
export const incr = (key) => redisService.incr(key);
export const expire = (key, seconds) => redisService.expire(key, seconds);
export const exists = (key) => redisService.exists(key);

export default redisClient;
