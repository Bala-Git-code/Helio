const mongoose = require('mongoose');

exports.validateDocumentUpload = (req, res, next) => {
  const { documentType } = req.body;
  
  if (!documentType) {
    return res.status(400).json({ success: false, message: 'Document Type is required.' });
  }

  const validTypes = ['prescription', 'lab', 'scan', 'discharge', 'note', 'other'];
  if (!validTypes.includes(documentType)) {
    return res.status(400).json({ success: false, message: `Invalid Document Type. Allowed: ${validTypes.join(', ')}` });
  }

  next();
};

exports.validateShareConfig = (req, res, next) => {
  const { duration, type } = req.body;

  if (!duration || !type) {
    return res.status(400).json({ success: false, message: 'Share configuration duration and access type are required.' });
  }

  next();
};
