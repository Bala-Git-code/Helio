/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Security Middleware (middleware/security.js)
 * ============================================================================
 * 
 * Defense Specifications:
 * 1. CSRF Defense: Header-based Origin/Referer verification on state-changing requests
 *    (POST, PUT, PATCH, DELETE) ensuring browser requests originate from verified Helio domains.
 * 2. Session Authentication: Validates stateful session rehydration from Redis.
 * 3. Clinical Role Isolation: Restricts endpoints to authorized clinical roles ('patient', 'doctor').
 */

const NODE_ENV = process.env.NODE_ENV || 'development';

const defaultAllowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];

/**
 * CSRF Defense Middleware
 * Enforces Origin / Referer integrity on all state-changing HTTP verbs.
 */
export const validateOriginCsrf = (req, res, next) => {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  // Exempt specific OAuth callbacks or health probes if needed
  if (req.path.startsWith('/api/auth/google/callback')) {
    return next();
  }

  const originHeader = req.get('origin');
  const refererHeader = req.get('referer');

  const candidate = originHeader || (refererHeader ? new URL(refererHeader).origin : null);

  if (!candidate) {
    // In development mode, allow non-browser API test tools (curl, postman) without origin header
    if (NODE_ENV !== 'production') {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'CSRF validation rejected: Missing Origin or Referer header on state-changing transaction.',
      code: 'CSRF_HEADER_MISSING',
    });
  }

  // Verify against whitelist
  const isAllowed = defaultAllowedOrigins.some((allowed) => {
    try {
      const allowedOrigin = new URL(allowed).origin;
      return candidate === allowedOrigin;
    } catch {
      return candidate === allowed;
    }
  });

  if (!isAllowed) {
    console.warn(`[HELIO CSRF BLOCK] Blocked request from unauthorized origin: ${candidate}`);
    return res.status(403).json({
      success: false,
      error: 'CSRF validation failed: Request origin is not permitted.',
      code: 'CSRF_FORBIDDEN_ORIGIN',
    });
  }

  next();
};

/**
 * Session Verification Middleware
 * Ensures the client holds an active, rehydrated session from Redis.
 */
export const requireAuth = (req, res, next) => {
  const isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : Boolean(req.user || req.session?.passport?.user);

  if (!isAuthenticated || (!req.user && !req.session?.passport?.user)) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No active clinical session detected.',
      code: 'AUTH_SESSION_REQUIRED',
    });
  }

  // Ensure req.user is uniformly populated
  if (!req.user && req.session?.passport?.user) {
    req.user = req.session.passport.user;
  }

  next();
};

/**
 * Role Guard Middleware
 * Enforces segregation of clinical permissions (e.g., patient vs doctor workspace).
 * 
 * @param {string|string[]} allowedRoles
 */
export const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to evaluate role permissions.',
        code: 'AUTH_ROLE_UNKNOWN',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of [${roles.join(', ')}] role credentials. Current role: '${req.user.role}'.`,
        code: 'FORBIDDEN_ROLE_INSUFFICIENT',
      });
    }

    next();
  };
};

export default {
  validateOriginCsrf,
  requireAuth,
  requireRole,
};
