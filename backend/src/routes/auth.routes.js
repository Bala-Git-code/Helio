import express from 'express';
import passport from 'passport';
import { requireAuth } from '../middleware/security.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Pure Google OAuth & Session Routes (routes/auth.routes.js)
 * ============================================================================
 * 
 * Architectural Highlights:
 * - Zero-JWT & Zero-Password: No credentials or tokens transmitted in headers.
 * - Stateful Redis Session: Maintained via 'helio.sid' rolling httpOnly cookie.
 * - Dynamic Role Provisioning: Captures target role ('patient' | 'doctor') via OAuth state.
 */

const router = express.Router();
const FRONTEND_URL = process.env.CORS_ORIGIN || 'http://localhost:5173';

/**
 * Initiate Google OAuth 2.0 Flow
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
    // Determine redirect destination based on authenticated user's role
    const userRole = req.user?.role || 'patient';
    const destination = userRole === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';

    return res.redirect(`${FRONTEND_URL}${destination}`);
  }
);

/**
 * Current Session Status & Profile Introspection
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
      id: user._id ? user._id.toString() : user.id,
      name: user.name,
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
 * Session Termination & Cookie Revocation
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, async (req, res, next) => {
  const userId = req.user?.id || req.user?._id;
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const userAgent = req.get('user-agent') || 'Unknown';

  try {
    await AuditLog.create({
      action: 'USER_LOGOUT',
      userId,
      ip,
      userAgent,
      status: 'SUCCESS',
      details: { timestamp: new Date().toISOString() },
    });
  } catch {}

  req.logout((err) => {
    if (err) {
      return next(err);
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
            error: 'Failed to fully purge server session.',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Clinical session successfully terminated.',
        });
      });
    } else {
      res.clearCookie('helio.sid');
      return res.status(200).json({
        success: true,
        message: 'Clinical session successfully terminated.',
      });
    }
  });
});

export default router;
