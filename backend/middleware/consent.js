const consentService = require('../services/consentService');

exports.verifyPatientConsent = async (req, res, next) => {
  // Extract patientId from standard identifiers
  const patientId = req.params.patientId || req.params.id || req.body.patientId;
  if (!patientId) {
    return res.status(400).json({ success: false, message: 'Patient ID identifier is required for consent verification.' });
  }

  try {
    const isGranted = await consentService.verifyDoctorAccess(req.user._id, patientId);
    if (!isGranted) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No active approved clinical consent link found for this patient file.'
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};
