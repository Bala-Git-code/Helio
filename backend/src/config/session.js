import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { redisClient } from './redis.js';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Session Engine Configuration (config/session.js)
 * ============================================================================
 * 
 * Compliance & Security Specifications:
 * - Zero-JWT & Zero-Password: All identity is tied to server-managed stateful sessions.
 * - In-Memory Redis Store: Uses connect-redis with redis prefix 'helio_sess:'.
 * - Strict Cookie Attributes:
 *     httpOnly: true (mitigates XSS exfiltration)
 *     secure: true in production (HTTPS-only)
 *     sameSite: 'lax' (mitigates CSRF on top-level navigations)
 *     maxAge: 7 days (604,800,000 ms)
 *     rolling: true (resets expiration window on active client interactions)
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_SECRET = process.env.SESSION_SECRET || 'helio_stateful_enterprise_session_secret_change_in_production';

// Initialize Redis session store
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'helio_sess:',
  disableTouch: false,
});

export const sessionMiddleware = session({
  name: 'helio.sid',
  store: redisStore,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    domain: NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
  },
});

export { redisStore };
export default sessionMiddleware;
