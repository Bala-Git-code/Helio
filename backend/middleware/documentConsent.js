const MedicalDocument = require('../models/MedicalDocument');
const AccessPermission = require('../models/AccessPermission');

exports.verifyDocumentConsent = async (req, res, next) => {
  const docId = req.params.id;
  if (!docId) {
    return res.status(400).json({ success: false, message: 'Document ID is required.' });
  }

  try {
    const doc = await MedicalDocument.findById(docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // 1. Patient is owner -> Allow
    if (doc.patientId.toString() === req.user._id.toString()) {
      return next();
    }

    // 2. Doctor access -> Check active clinical consent permission
    if (req.user.role === 'doctor') {
      const permission = await AccessPermission.findOne({
        patientId: doc.patientId,
        doctorId: req.user._id,
        status: 'approved'
      });

      if (permission) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied: You do not have permissions or patient consent to read this document.'
    });
  } catch (error) {
    next(error);
  }
};
