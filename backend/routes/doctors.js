
const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/auth');
router.get('/dashboard', protect, checkRole(['doctor']), (req, res) => {
  res.json({
    message: 'Welcome to the secure doctor dashboard!',
    doctor: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
    patientList: [
      { id: 'p001', name: 'John Doe' },
      { id: 'p002', name: 'Jane Smith' },
    ],
  });
});

module.exports = router;