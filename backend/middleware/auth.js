const passport = require('passport');

exports.protect = passport.authenticate('jwt', { session: false });

exports.checkRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: No user found' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Forbidden: User role '${req.user.role}' is not authorized` });
  }
  
  next();
};