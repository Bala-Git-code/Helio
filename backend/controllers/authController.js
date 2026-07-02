const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const AuditLog = require('../models/AuditLog');

// Helper to sign access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { user: { id: user.id, role: user.role } },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Helper to sign refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { user: { id: user.id } },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
  }

  // Public registration is only allowed for patients
  if (role && role !== 'patient') {
    return res.status(403).json({ success: false, message: 'Only patient accounts can self-register.' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists.' });
    }

    user = new User({ name, email, password, role: 'patient' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Create Patient Profile
    const profile = new PatientProfile({
      userId: user._id,
      displayName: name,
    });
    await profile.save();

    // Audit Log
    await AuditLog.create({
      actorId: user._id,
      action: 'REGISTER',
      details: { role: 'patient' },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, message: 'User registered successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user array
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    // Keep maximum 5 refresh tokens to prevent array bloat
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    // Audit Log
    await AuditLog.create({
      actorId: user._id,
      action: 'LOGIN',
      details: { userAgent: req.headers['user-agent'] },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id);
    
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const newAccessToken = generateAccessToken(user);
    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid refresh session.' });
  }
};

exports.logout = async (req, res, next) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      if (decoded && decoded.user?.id) {
        const user = await User.findById(decoded.user.id);
        if (user) {
          user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
          await user.save();
          
          await AuditLog.create({
            actorId: user._id,
            action: 'LOGOUT',
            details: {},
            ipAddress: req.ip
          });
        }
      }
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.registerDoctor = async (req, res, next) => {
  const { name, email, password, specialty, licenseNumber, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please supply doctor name, email, and password.' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'Doctor email is already registered.' });
    }

    user = new User({
      name,
      email,
      password,
      role: 'doctor',
      specialty,
      licenseNumber,
      department
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Audit Log
    await AuditLog.create({
      actorId: req.user.id, // The Admin creator
      action: 'CREATE_DOCTOR',
      details: { doctorId: user._id, email: user.email },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Doctor account created successfully.',
      doctor: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    next(err);
  }
};
