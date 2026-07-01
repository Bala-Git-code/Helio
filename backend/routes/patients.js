const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/auth');

router.get('/me', protect, checkRole(['patient']), (req, res) => {
  res.json({
    message: 'Welcome to your patient dashboard!',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;