import express from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { User } from '../models/User.js';
import { Medication } from '../models/Medication.js';
import { AdherenceLog } from '../models/AdherenceLog.js';
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/demo-login
// Fail-safe demo login: auto-upserts the demo user and seeds data if missing.
// NEVER fails due to an unseeded database.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/demo-login', async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !['patient', 'doctor'].includes(role.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'Role must be "patient" or "doctor".' });
    }

    const isPatient = role.toLowerCase() === 'patient';
    const demoEmail = isPatient ? 'patient@helio.health' : 'doctor@helio.health';
    const demoName = isPatient ? 'Sarah Jenkins (Demo Patient)' : 'Dr. Marcus Reid (Demo Doctor)';
    const demoRole = isPatient ? 'PATIENT' : 'DOCTOR';
    const demoPasswordHash = await bcrypt.hash('HelioDemo2026!', 10);

    // Auto-upsert: find or create the demo user atomically
    let user = await User.findOneAndUpdate(
      { email: demoEmail },
      {
        $setOnInsert: {
          name: demoName,
          email: demoEmail,
          passwordHash: demoPasswordHash,
          role: demoRole,
          phone: isPatient ? '+1-555-0192' : '+1-555-0847',
          specialty: isPatient ? '' : 'Endocrinology & Metabolic Medicine',
          licenseNumber: isPatient ? '' : 'MD-88421',
          caregiverContact: isPatient
            ? { name: 'James Jenkins', phone: '+1-555-0193', email: 'james.jenkins@example.com', relationship: 'Spouse' }
            : { name: '', phone: '', email: '', relationship: '' },
          medicalHistory: isPatient
            ? [
                { condition: 'Type 2 Diabetes Mellitus', diagnosedYear: 2019 },
                { condition: 'Hypertension', diagnosedYear: 2021 },
              ]
            : [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Seed demo medications for a fresh patient account (if none exist)
    if (isPatient) {
      const existingMeds = await Medication.countDocuments({ patientId: user._id });

      if (existingMeds === 0) {
        const demoMeds = await Medication.insertMany([
          {
            patientId: user._id,
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'TWICE_DAILY',
            timesPerDay: 2,
            scheduleTimes: ['08:00', '20:00'],
            totalQuantity: 60,
            remainingQuantity: 43,
            refillThreshold: 10,
            instructions: 'Take with meals to reduce GI side effects.',
            status: 'ACTIVE',
          },
          {
            patientId: user._id,
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'ONCE_DAILY',
            timesPerDay: 1,
            scheduleTimes: ['08:00'],
            totalQuantity: 30,
            remainingQuantity: 18,
            refillThreshold: 7,
            instructions: 'Take in the morning. Monitor blood pressure weekly.',
            status: 'ACTIVE',
          },
          {
            patientId: user._id,
            name: 'Atorvastatin',
            dosage: '20mg',
            frequency: 'ONCE_DAILY',
            timesPerDay: 1,
            scheduleTimes: ['21:00'],
            totalQuantity: 30,
            remainingQuantity: 6,
            refillThreshold: 7,
            instructions: 'Take in the evening. Avoid grapefruit juice.',
            status: 'ACTIVE',
          },
        ]);

        // Seed 14 days of adherence history for realistic dashboard data
        const now = new Date();
        const adherenceSeedData = [];
        for (const med of demoMeds) {
          for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
            const timesPerDay = med.timesPerDay || 1;
            for (let dose = 0; dose < timesPerDay; dose++) {
              const scheduledTime = new Date(now);
              scheduledTime.setDate(now.getDate() - daysAgo);
              scheduledTime.setHours(dose === 0 ? 8 : 20, 0, 0, 0);

              // 87% adherence rate for demo — realistic but not perfect
              const isTaken = Math.random() > 0.13;
              adherenceSeedData.push({
                patientId: user._id,
                medicationId: med._id,
                scheduledTime,
                takenAt: isTaken ? scheduledTime : null,
                status: isTaken ? 'TAKEN' : 'MISSED',
                confirmationChannel: ['APP', 'WHATSAPP', 'VOICE'][Math.floor(Math.random() * 3)],
                notes: '',
                voiceLogged: false,
              });
            }
          }
        }
        if (adherenceSeedData.length > 0) {
          await AdherenceLog.insertMany(adherenceSeedData);
        }
      }
    }

    const token = generateToken(user);
    console.log(`[HELIO Demo Login] Auto-provisioned demo ${demoRole}: ${demoEmail}`);

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
    console.warn('[HELIO Demo Login Warning] Database operation failed or timed out. Falling back to local mock authentication mode:', err.message);

    const { role } = req.body || {};
    const isPatient = (role || 'patient').toLowerCase() === 'patient';
    const mockUser = {
      _id: isPatient ? '64f8a1b2c3d4e5f607890123' : '64f8a1b2c3d4e5f607890456',
      id: isPatient ? '64f8a1b2c3d4e5f607890123' : '64f8a1b2c3d4e5f607890456',
      name: isPatient ? 'Sarah Jenkins (Demo Patient)' : 'Dr. Marcus Reid (Demo Doctor)',
      email: isPatient ? 'patient@helio.health' : 'doctor@helio.health',
      role: isPatient ? 'PATIENT' : 'DOCTOR',
      phone: isPatient ? '+1-555-0192' : '+1-555-0847',
      specialty: isPatient ? '' : 'Endocrinology & Metabolic Medicine',
    };

    const token = generateToken(mockUser);

    return res.json({
      success: true,
      token,
      user: {
        id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        phone: mockUser.phone,
        specialty: mockUser.specialty,
      },
    });
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