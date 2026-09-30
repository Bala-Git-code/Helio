import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { redisClient } from './redis.js';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Session Engine Configuration (config/session.js)
 * ============================================================================
 * 
 * Strict Zero-JWT / Zero-Password Specifications:
 * - Stateful identity managed purely through Redis session tokens.
 * - In-memory Redis Store using connect-redis with 'helio_sess:' prefix.
 * - Enforces HIPAA-compliant, defense-in-depth cookie controls:
 *     1. httpOnly: true (Precludes client-side JavaScript / XSS exfiltration)
 *     2. secure: true in production (Restricts transmission strictly to TLS/HTTPS)
 *     3. sameSite: 'lax' (Hardens against Cross-Site Request Forgery)
 *     4. maxAge: 7 days (604,800,000 ms sliding expiration window)
 *     5. rolling: true (Extends active sessions automatically upon clinical actions)
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_SECRET = process.env.SESSION_SECRET || 'helio_stateful_enterprise_session_secret_change_in_production';

// Initialize Redis session store
export const redisStore = new RedisStore({
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

export default sessionMiddleware;
