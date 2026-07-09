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
    'ai:tools:execute-privileged',
    'repository-structure:read',
    'repository-symbols:read',
    'repository-references:read',
    'repository-dependencies:read',
    'repository-graph:read',
    'repository-structure:rebuild',
    'repository-structure:read:any-tenant',
    'repository-search:execute',
    'repository-context:retrieve',
    'repository-similar-code:execute',
    'repository-retrieval-index:read',
    'repository-retrieval-index:rebuild',
    'repository-retrieval-index:read:any-tenant'
  ],
  doctor: [
    'jobs:read',
    'workers:read',
    'ai:execute',
    'ai:executions:read',
    'ai:usage:read',
    'ai:models:read',
    'ai:tools:execute-privileged',
    'repository-structure:read',
    'repository-symbols:read',
    'repository-references:read',
    'repository-dependencies:read',
    'repository-graph:read',
    'repository-search:execute',
    'repository-context:retrieve',
    'repository-similar-code:execute',
    'repository-retrieval-index:read'
  ],
  patient: [
    'ai:execute',
    'ai:executions:read',
    'ai:usage:read',
    'repository-search:execute',
    'repository-context:retrieve',
    'repository-similar-code:execute'
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
