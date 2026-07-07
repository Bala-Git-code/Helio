const roleCapabilities = {
  admin: [
    'jobs:read',
    'jobs:read:any-tenant',
    'jobs:retry',
    'jobs:cancel',
    'workers:read',
    'ai:execute',
    'ai:execute:task',
    'ai:override-model',
    'ai:executions:read',
    'ai:executions:read:any-tenant',
    'ai:usage:read',
    'ai:budgets:read',
    'ai:providers:read',
    'ai:models:read',
    'ai:circuits:read',
    'ai:tools:execute-privileged'
  ],
  doctor: [
    'jobs:read',
    'workers:read',
    'ai:execute',
    'ai:executions:read',
    'ai:usage:read',
    'ai:models:read',
    'ai:tools:execute-privileged'
  ],
  patient: [
    'ai:execute',
    'ai:executions:read',
    'ai:usage:read'
  ]
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
