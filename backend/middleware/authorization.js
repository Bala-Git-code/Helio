const roleCapabilities = {
  admin: [
    'jobs:read',
    'jobs:read:any-tenant',
    'jobs:retry',
    'jobs:cancel',
    'workers:read'
  ],
  doctor: [
    'jobs:read',
    'workers:read'
  ],
  patient: []
};

exports.checkCapability = (capability) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No user session found.' });
  }

  const capabilities = roleCapabilities[req.user.role] || [];
  
  if (!capabilities.includes(capability)) {
    return res.status(403).json({
      success: false,
      message: `Forbidden: User role '${req.user.role}' lacks capability '${capability}'.`
    });
  }

  next();
};
