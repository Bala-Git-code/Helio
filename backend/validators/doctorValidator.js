const mongoose = require('mongoose');

exports.validateObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName] || req.body[paramName];
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: `Invalid parameters: '${paramName}' must be a valid Mongo ID.` });
  }
  next();
};

exports.validateConsultationPayload = (req, res, next) => {
  const { patientId, clinicalNotes, hospital, prescriptions, followUp } = req.body;
  
  if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({ success: false, message: 'Invalid or missing patient ID.' });
  }
  if (!clinicalNotes || clinicalNotes.trim().length < 5) {
    return res.status(400).json({ success: false, message: 'Clinical Notes must be at least 5 characters long.' });
  }
  if (!hospital || hospital.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Hospital identification is required.' });
  }

  if (prescriptions && Array.isArray(prescriptions)) {
    for (const rx of prescriptions) {
      if (!rx.name || rx.name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Prescription medication name is required.' });
      }
    }
  }

  if (followUp && followUp.date) {
    const d = new Date(followUp.date);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ success: false, message: 'Follow-up date must be a valid calendar date.' });
    }
  }

  next();
};

exports.validateLinkPayload = (req, res, next) => {
  const { accessCode } = req.body;
  if (!accessCode || typeof accessCode !== 'string' || accessCode.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Patient access link code is required.' });
  }
  next();
};
