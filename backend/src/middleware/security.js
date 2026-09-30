/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Security & Access Control Middleware (middleware/security.js)
 * ============================================================================
 * 
 * Defense-in-Depth Specifications:
 * 1. CSRF Defense: Header-based Origin and Referer validation on all state-changing
 *    HTTP methods (POST, PUT, PATCH, DELETE) to thwart Cross-Site Request Forgery.
 * 2. Session Authentication: Validates that an incoming request possesses an active,
 *    rehydrated Redis session without relying on client-side JWTs.
 * 3. Role-Based Access Control (RBAC): Strictly enforces separation of clinical
 *    privileges between 'patient' and 'doctor' actors.
 */

const NODE_ENV = process.env.NODE_ENV || 'development';

const defaultAllowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];

/**
 * Header-based CSRF Validation Middleware
 * Enforces Origin / Referer integrity for all state-mutating HTTP requests.
 */
export const validateOriginCsrf = (req, res, next) => {
  const stateMutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!stateMutatingMethods.includes(req.method)) {
    return next();
  }

  // Exempt external OAuth callbacks
  if (req.path.startsWith('/api/auth/google/callback')) {
    return next();
  }

  const originHeader = req.get('origin');
  const refererHeader = req.get('referer');

  let candidateOrigin = null;
  if (originHeader) {
    candidateOrigin = originHeader;
  } else if (refererHeader) {
    try {
      candidateOrigin = new URL(refererHeader).origin;
    } catch {
      candidateOrigin = null;
    }
  }

  // If both Origin and Referer headers are absent
  if (!candidateOrigin) {
    // In local development or automated testing, allow CLI/curl tooling
    if (NODE_ENV !== 'production') {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'CSRF validation rejected: Missing Origin or Referer header on state-changing request.',
      code: 'CSRF_HEADER_MISSING',
    });
  }

  // Verify candidate origin against allowed origins whitelist
  const isAllowed = defaultAllowedOrigins.some((allowed) => {
    try {
      return candidateOrigin === new URL(allowed).origin;
    } catch {
      return candidateOrigin === allowed;
    }
  });

  if (!isAllowed) {
    console.warn(`[HELIO CSRF ALERT] Blocked request from untrusted origin: ${candidateOrigin}`);
    return res.status(403).json({
      success: false,
      error: 'CSRF validation failed: Request origin is not permitted.',
      code: 'CSRF_FORBIDDEN_ORIGIN',
    });
  }

  next();
};

/**
 * Stateful Session Authentication Guard
 * Ensures the incoming request holds a valid Redis session rehydrated by Passport.
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

  // Guarantee req.user is consistently accessible
  if (!req.user && req.session?.passport?.user) {
    req.user = req.session.passport.user;
  }

  next();
};

/**
 * Role Authorization Guard
 * Enforces clinical role segregation (e.g. 'patient' vs 'doctor').
 * 
 * @param {string|string[]} allowedRoles
 */
export const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to determine clinical authorization role.',
        code: 'AUTH_ROLE_UNKNOWN',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Endpoint requires one of [${roles.join(', ')}] role credentials. Current role: '${req.user.role}'.`,
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
