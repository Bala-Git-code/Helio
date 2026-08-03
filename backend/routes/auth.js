import express from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { User } from '../models/User.js';
import { generateToken, authenticateJwt } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, phone, specialty, licenseNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email address already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'PATIENT',
      phone: phone || '',
      specialty: specialty || '',
      licenseNumber: licenseNumber || '',
    });

    const token = generateToken(newUser);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        specialty: newUser.specialty,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        specialty: user.specialty,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/google
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(501).json({ success: false, error: 'Google OAuth not configured in environment variables.' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// GET /api/v1/auth/google/callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?error=OAuthFailed`);
    }
    const token = generateToken(user);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?token=${token}`);
  })(req, res, next);
});

// GET /api/v1/auth/me
router.get('/me', authenticateJwt, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

export default router;