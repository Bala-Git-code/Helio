const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Strict rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 authentication requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login or registration attempts. Please try again after 15 minutes.'
  }
});

// NoSQL Injection protection middleware wrapper
const sanitizeQuery = (req, res, next) => {
  mongoSanitize()(req, res, next);
};

module.exports = {
  apiLimiter,
  authLimiter,
  sanitizeQuery
};
