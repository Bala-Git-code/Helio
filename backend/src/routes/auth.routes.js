import express from 'express';
import passport from 'passport';
import { requireAuth } from '../middleware/security.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Google OAuth 2.0 & Redis Stateful Session Routes (routes/auth.routes.js)
 * ============================================================================
 * 
 * Architecture Rules:
 * - Zero-JWT & Zero-Password: Google OAuth 2.0 is the sole authentication provider.
 * - Stateful Sessions: Tied exclusively to 'helio.sid' session cookie in Redis.
 * - Dynamic Role Handshake: Ingests clinical role via OAuth state parameter.
 */

const router = express.Router();
const FRONTEND_URL = process.env.CORS_ORIGIN || 'http://localhost:5173';

/**
 * Initiate Google OAuth 2.0 Handshake
 * GET /api/auth/google?role=patient|doctor
 */
router.get('/google', (req, res, next) => {
  const preferredRole = req.query.role === 'doctor' ? 'doctor' : 'patient';
  const statePayload = JSON.stringify({ role: preferredRole });

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: statePayload,
    prompt: 'select_account',
  })(req, res, next);
});

/**
 * Google OAuth 2.0 Callback
 * GET /api/auth/google/callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}/login?error=oauth_rejected`,
  }),
  (req, res) => {
    // Redirect to respective portal based on role
    const userRole = req.user?.role || 'patient';
    const redirectPath = userRole === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';

    return res.redirect(`${FRONTEND_URL}${redirectPath}`);
  }
);

/**
 * Session Status & Profile Introspection
 * GET /api/auth/me
 */
router.get('/me', (req, res) => {
  const isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : Boolean(req.user);

  if (!isAuthenticated || !req.user) {
    return res.status(200).json({
      authenticated: false,
      user: null,
      role: null,
    });
  }

  const user = req.user;

  return res.status(200).json({
    authenticated: true,
    user: {
      id: user._id ? user._id.toString() : (user.id || user.userId),
      name: user.name || 'Helio User',
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      condition: user.condition,
      specialty: user.specialty,
      adherenceRate: user.adherenceRate ?? 94,
      streakDays: user.streakDays ?? 14,
      assignedDoctors: user.assignedDoctors || [],
      assignedPatients: user.assignedPatients || [],
    },
    role: user.role,
  });
});

/**
 * Terminate Stateful Session & Invalidate Cookie
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, async (req, res, next) => {
  const userId = req.user?._id || req.user?.id || req.user?.userId;
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const userAgent = req.get('user-agent') || 'Unknown Client';

  // HIPAA audit record for logout event
  try {
    await AuditLog.create({
      action: 'USER_LOGOUT',
      userId,
      ip,
      userAgent,
      status: 'SUCCESS',
      details: { timestamp: new Date().toISOString() },
    });
  } catch (auditErr) {
    console.warn('[HELIO AUDIT WARN] Failed to log user logout:', auditErr.message);
  }

  req.logout((logoutErr) => {
    if (logoutErr) {
      return next(logoutErr);
    }

    if (req.session) {
      req.session.destroy((sessionErr) => {
        res.clearCookie('helio.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });

        if (sessionErr) {
          return res.status(500).json({
            success: false,
            error: 'Failed to destroy Redis session token.',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Clinical session successfully terminated.',
        });
      });
    } else {
      res.clearCookie('helio.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      return res.status(200).json({
        success: true,
        message: 'Clinical session successfully terminated.',
      });
    }
  });
});

export default router;
