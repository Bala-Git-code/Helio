import Redis from 'ioredis';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Redis Client & Cache Infrastructure (config/redis.js)
 * ============================================================================
 * 
 * Architectural Purpose:
 * Provides low-latency, stateful in-memory storage for:
 * 1. Express session store (connect-redis)
 * 2. 24-hour cryptographic patient-doctor pairing codes (HL-XXXX-XXXX)
 * 3. Doctor brute-force lockout rate limiting (5 attempts / 30-min lockout)
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const NODE_ENV = process.env.NODE_ENV || 'development';

let isRedisConnected = false;

// Create ioredis instance
const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy(times) {
    if (NODE_ENV !== 'production' && times > 2) {
      // In local dev without active redis daemon, don't spam reconnect logs
      return null;
    }
    const delay = Math.min(times * 500, 3000);
    return delay;
  },
});

redisClient.on('connect', () => {
  isRedisConnected = true;
  console.log('[HELIO REDIS] Connected to Redis cluster at', REDIS_URL);
});

redisClient.on('ready', () => {
  isRedisConnected = true;
  console.log('[HELIO REDIS] Redis client ready to accept commands.');
});

redisClient.on('error', (err) => {
  isRedisConnected = false;
  if (NODE_ENV !== 'production') {
    console.warn(`[HELIO REDIS WARN] Redis offline or unreachable: ${err.message}. Using resilient memory layer in dev mode.`);
  } else {
    console.error(`[HELIO REDIS ERROR] Production Redis failure: ${err.message}`);
  }
});

redisClient.on('close', () => {
  isRedisConnected = false;
});

// Attempt initial connection without blocking server boot
redisClient.connect().catch((err) => {
  if (NODE_ENV === 'production') {
    console.error('[HELIO REDIS FATAL] Could not establish initial connection to Redis cluster:', err);
  }
});

/**
 * In-Memory Fallback Adapter
 * Ensures local development and automated CI tests continue smoothly
 * even if a local Redis server is not currently running.
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
}

const memoryStore = new MemoryRedisStore();

/**
 * Unified Redis Operations Facade
 * Automatically delegates to ioredis when live, or fallback memory in dev.
 */
export const redisService = {
  isLive: () => isRedisConnected,

  async get(key) {
    if (isRedisConnected) {
      try {
        return await redisClient.get(key);
      } catch {
        return await memoryStore.get(key);
      }
    }
    return await memoryStore.get(key);
  },

  async setex(key, seconds, value) {
    if (isRedisConnected) {
      try {
        return await redisClient.setex(key, seconds, value);
      } catch {
        return await memoryStore.setex(key, seconds, value);
      }
    }
    return await memoryStore.setex(key, seconds, value);
  },

  async del(key) {
    if (isRedisConnected) {
      try {
        return await redisClient.del(key);
      } catch {
        return await memoryStore.del(key);
      }
    }
    return await memoryStore.del(key);
  },

  async ttl(key) {
    if (isRedisConnected) {
      try {
        return await redisClient.ttl(key);
      } catch {
        return await memoryStore.ttl(key);
      }
    }
    return await memoryStore.ttl(key);
  },

  async incr(key) {
    if (isRedisConnected) {
      try {
        return await redisClient.incr(key);
      } catch {
        return await memoryStore.incr(key);
      }
    }
    return await memoryStore.incr(key);
  },

  async expire(key, seconds) {
    if (isRedisConnected) {
      try {
        return await redisClient.expire(key, seconds);
      } catch {
        return await memoryStore.expire(key, seconds);
      }
    }
    return await memoryStore.expire(key, seconds);
  },
};

export { redisClient };
export default redisClient;
