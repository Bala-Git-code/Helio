import passport from 'passport';
import jwt from 'jsonwebtoken';

export const authenticateJwt = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized access. Valid JWT token required.',
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden. Role '${req.user.role}' is not authorized for this resource.`,
      });
    }
    next();
  };
};

export const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_key_for_helio_platform_123!', {
    expiresIn: '7d',
  });
};

export default {
  authenticateJwt,
  requireRoles,
  generateToken,
};
