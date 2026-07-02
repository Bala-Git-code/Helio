const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const { protect, checkRole } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

const router = express.Router();

// Public auth endpoints under rate limits
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Admin-only creation route
router.post('/register-doctor', protect, checkRole(['admin']), authController.registerDoctor);

// Google Sign-in dispatches
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5000'}/login`, session: false }),
  async (req, res, next) => {
    try {
      const jwt = require('jsonwebtoken');
      const AuditLog = require('../models/AuditLog');

      const payload = { user: { id: req.user.id, role: req.user.role } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' });

      await AuditLog.create({
        actorId: req.user._id,
        action: 'GOOGLE_LOGIN',
        details: {},
        ipAddress: req.ip
      });

      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/auth-redirect?token=${token}`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;