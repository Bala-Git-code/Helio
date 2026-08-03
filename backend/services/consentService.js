import { DoctorPatientLink } from '../models/DoctorPatientLink.js';

export const verifyDoctorConsent = async (doctorId, patientId) => {
  if (!doctorId || !patientId) return false;

  const link = await DoctorPatientLink.findOne({
    doctorId,
    patientId,
    status: 'ACTIVE',
  });

  if (!link) return false;

  if (link.expiresAt && new Date() > link.expiresAt) {
    link.status = 'REVOKED';
    await link.save();
    return false;
  }

  return true;
};

export const doctorConsentMiddleware = async (req, res, next) => {
  try {
    if (req.user?.role !== 'DOCTOR') {
      return res.status(403).json({ success: false, error: 'Access denied. Doctor privileges required.' });
    }

    const patientId = req.params.patientId || req.body.patientId || req.query.patientId;
    if (!patientId) {
      return res.status(400).json({ success: false, error: 'Patient ID is required for verification.' });
    }

    const hasConsent = await verifyDoctorConsent(req.user._id, patientId);
    if (!hasConsent) {
      return res.status(403).json({
        success: false,
        error: 'Consent-Based Access Security: Active consent link required to view or edit patient medical records.',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

export default {
  verifyDoctorConsent,
  doctorConsentMiddleware,
};
