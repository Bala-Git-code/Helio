const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const Medication = require('../models/Medication');
const Appointment = require('../models/Appointment');
const HealthRecord = require('../models/HealthRecord');
const DoctorNote = require('../models/DoctorNote');
const AccessPermission = require('../models/AccessPermission');
const AuditLog = require('../models/AuditLog');
const geminiService = require('../services/geminiService');
const whatsappService = require('../services/whatsappService');

// --- PATIENT HEALTH DASHBOARD ---
exports.getPatientDashboard = async (req, res, next) => {
  try {
    let profile = await PatientProfile.findOne({ userId: req.user._id }).lean();
    if (!profile) {
      const newProfile = new PatientProfile({
        userId: req.user._id,
        displayName: req.user.name,
      });
      profile = await newProfile.save();
      profile = profile.toObject();
    }
    
    const medications = await Medication.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    const appointments = await Appointment.find({ userId: req.user._id }).sort({ date: 1 }).lean();
    const records = await HealthRecord.find({ userId: req.user._id }).sort({ date: -1 }).lean();
    const notes = await DoctorNote.find({ patientId: req.user._id }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      profile: profile || {},
      medications,
      appointments,
      records,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// --- PROFILE EDIT ---
exports.postProfile = async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (update._id) delete update._id;
    if (update.userId) delete update.userId;

    const profile = await PatientProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

// --- VITALS TRACKING ---
exports.postVitals = async (req, res, next) => {
  const { weight, height, heartRate, bloodPressure, temperature, oxygenSaturation } = req.body;
  try {
    const profile = await PatientProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const newVitals = {
      weight: Number(weight) || profile.vitals?.weight,
      height: Number(height) || profile.vitals?.height,
      heartRate: Number(heartRate) || profile.vitals?.heartRate,
      bloodPressure: bloodPressure || profile.vitals?.bloodPressure,
      temperature: Number(temperature) || profile.vitals?.temperature,
      oxygenSaturation: Number(oxygenSaturation) || profile.vitals?.oxygenSaturation,
    };

    profile.vitals = newVitals;
    profile.vitalsHistory.push({
      ...newVitals,
      loggedAt: new Date()
    });

    // Dyn score adjustments
    let scoreDelta = 0;
    if (newVitals.heartRate >= 60 && newVitals.heartRate <= 100) scoreDelta += 1;
    if (newVitals.oxygenSaturation >= 95) scoreDelta += 1;
    if (scoreDelta > 0 && profile.healthScore < 100) {
      profile.healthScore = Math.min(profile.healthScore + scoreDelta, 100);
    }

    await profile.save();
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

// --- MEDICATION MANAGEMENT ---
exports.postMedications = async (req, res, next) => {
  try {
    const medication = await Medication.create({ userId: req.user._id, ...req.body });
    res.status(201).json(medication);
  } catch (error) {
    next(error);
  }
};

exports.deleteMedications = async (req, res, next) => {
  try {
    await Medication.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Medication removed successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.postTakeDose = async (req, res, next) => {
  const { timeSlot } = req.body;
  try {
    const medication = await Medication.findOne({ _id: req.params.id, userId: req.user._id });
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication reminder not found.' });
    }

    medication.adherence.taken += 1;
    medication.adherence.target += 1;
    if (medication.quantity > 0) {
      medication.quantity -= 1;
    }
    medication.adherenceLogs.push({
      takenAt: new Date(),
      timeSlot: timeSlot || 'daily'
    });
    await medication.save();

    const profile = await PatientProfile.findOne({ userId: req.user._id });
    if (profile && profile.healthScore < 100) {
      profile.healthScore = Math.min(profile.healthScore + 2, 100);
      await profile.save();
    }

    // simulated Meta WhatsApp alert
    await whatsappService.sendMessage(
      profile?.phone || 'Patient Phone',
      `Helio Care: Intake of ${medication.name} registered. Remaining pill stock: ${medication.quantity}.`
    );

    // Audit Log
    await AuditLog.create({
      actorId: req.user._id,
      action: 'MED_TAKE',
      details: { medicationId: medication._id, name: medication.name, quantity: medication.quantity },
      ipAddress: req.ip
    });

    res.json(medication);
  } catch (error) {
    next(error);
  }
};

exports.postRefillMed = async (req, res, next) => {
  const { refillAmount } = req.body;
  try {
    const medication = await Medication.findOne({ _id: req.params.id, userId: req.user._id });
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    medication.quantity = (medication.quantity || 0) + (Number(refillAmount) || 30);
    await medication.save();
    res.json(medication);
  } catch (error) {
    next(error);
  }
};

// --- APPOINTMENT MANAGEMENT ---
exports.postAppointments = async (req, res, next) => {
  try {
    const appointment = await Appointment.create({ userId: req.user._id, ...req.body });
    const profile = await PatientProfile.findOne({ userId: req.user._id });
    if (profile && profile.phone) {
      await whatsappService.sendMessage(
        profile.phone,
        `Helio Appointment: Scheduled with ${appointment.doctorName} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}.`,
        'appointment'
      );
    }
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

exports.deleteAppointments = async (req, res, next) => {
  try {
    await Appointment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Appointment cancelled successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.putAppointmentStatus = async (req, res, next) => {
  const { status } = req.body;
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const patientProfile = await PatientProfile.findOne({ userId: appointment.userId });
    if (!patientProfile || !patientProfile.doctorAccess.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Doctor has no clinical link to this patient.' });
    }

    appointment.status = status;
    await appointment.save();

    if (patientProfile.phone) {
      await whatsappService.sendMessage(
        patientProfile.phone,
        `Helio Alert: Dr. ${req.user.name} has updated your appointment status to: ${status.toUpperCase()}.`,
        'appointment'
      );
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

// --- DIGITAL RECORDS ---
exports.postRecords = async (req, res, next) => {
  try {
    const record = await HealthRecord.create({ userId: req.user._id, ...req.body });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

exports.deleteRecords = async (req, res, next) => {
  try {
    await HealthRecord.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Health record deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// --- AI COMPANION (GEMINI CHAT) ---
exports.postAIChat = async (req, res, next) => {
  const { message, history } = req.body;
  try {
    const profile = await PatientProfile.findOne({ userId: req.user._id }).lean();
    const medications = await Medication.find({ userId: req.user._id, active: true }).lean();
    const appointments = await Appointment.find({ userId: req.user._id, status: 'scheduled' }).lean();
    const notes = await DoctorNote.find({ patientId: req.user._id }).sort({ createdAt: -1 }).limit(3).lean();

    const patientContext = {
      name: req.user.name,
      age: profile?.vitals?.age || 'Not specified',
      gender: profile?.gender || 'Not specified',
      allergies: profile?.allergies || [],
      conditions: profile?.conditions || [],
      medications,
      appointments,
      notes
    };

    const reply = await geminiService.chatWithContext(patientContext, history || [], message);
    res.json({ reply });
  } catch (error) {
    next(error);
  }
};

// --- PRESCRIPTION SCANNER (GEMINI OCR) ---
exports.postOCR = async (req, res, next) => {
  const { base64Image, mimeType } = req.body;
  if (!base64Image) {
    return res.status(400).json({ success: false, message: 'Missing base64Image payload.' });
  }
  try {
    const medicines = await geminiService.parsePrescriptionImage(base64Image, mimeType);
    res.json({ medicines });
  } catch (error) {
    next(error);
  }
};

// --- EMERGENCY SOS DISPATCH ---
exports.postSOS = async (req, res, next) => {
  const { latitude, longitude } = req.body;
  try {
    const profile = await PatientProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    const emergencyContact = profile.emergencyContact;
    if (!emergencyContact || !emergencyContact.phone) {
      return res.status(400).json({ success: false, message: 'No emergency contacts registered.' });
    }

    const locationLink = (latitude && longitude)
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : 'Location details unavailable';

    const emergencyMessage = `🚨 HELIO SMART EMERGENCY ALERT 🚨
Patient: ${req.user.name} has triggered an SOS panic signal.
Current Location: ${locationLink}
Critical conditions & allergy logs available on profile.`;

    await whatsappService.sendMessage(emergencyContact.phone, emergencyMessage, 'emergency');

    await HealthRecord.create({
      userId: req.user._id,
      type: 'summary',
      title: '🚨 Smart SOS Triggered',
      summary: `SOS Panic alert sent to emergency contact ${emergencyContact.name}. Location registered: ${latitude || 'N/A'}, ${longitude || 'N/A'}.`,
    });

    // Audit Log
    await AuditLog.create({
      actorId: req.user._id,
      action: 'SOS_TRIGGER',
      details: { latitude, longitude },
      ipAddress: req.ip
    });

    res.json({ success: true, contactName: emergencyContact.name });
  } catch (error) {
    next(error);
  }
};

// --- DOCTOR PATIENT LINKING & VIEW ---
exports.postDoctorLinkPatient = async (req, res, next) => {
  const { accessCode } = req.body;
  if (!accessCode) {
    return res.status(400).json({ success: false, message: 'Access Code is required.' });
  }

  try {
    const profile = await PatientProfile.findOne({ accessCode: accessCode.trim() });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'No patient record found matching this access code.' });
    }

    const patientUser = await User.findById(profile.userId);
    if (!patientUser) {
      return res.status(404).json({ success: false, message: 'Patient account details not found.' });
    }

    // Check if permission already exists
    let permission = await AccessPermission.findOne({
      patientId: profile.userId,
      doctorId: req.user._id
    });

    if (permission) {
      if (permission.status === 'approved') {
        return res.status(400).json({ success: false, message: 'Patient is already linked and approved in your clinical directory.' });
      }
      if (permission.status === 'pending') {
        return res.status(200).json({
          success: true,
          message: 'Clinical link request is already pending patient approval.',
          patient: { id: profile.userId, name: patientUser.name, accessCode: profile.accessCode }
        });
      }
      // If previously revoked, reset to pending
      permission.status = 'pending';
      permission.history.push({ status: 'pending', changedAt: new Date() });
      await permission.save();
    } else {
      // Create a new pending linkage request
      permission = new AccessPermission({
        patientId: profile.userId,
        doctorId: req.user._id,
        status: 'pending',
        history: [{ status: 'pending', changedAt: new Date() }]
      });
      await permission.save();
    }

    // Audit Log
    await AuditLog.create({
      actorId: req.user._id,
      action: 'LINK_REQUEST',
      details: { patientId: profile.userId },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Clinical access request dispatched. Pending patient approval consent.',
      patient: {
        id: profile.userId,
        name: patientUser.name,
        accessCode: profile.accessCode,
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDoctorDashboard = async (req, res, next) => {
  try {
    // Return all patients that have APPROVED clinical links to this doctor
    const permissions = await AccessPermission.find({
      doctorId: req.user._id,
      status: 'approved'
    });

    const patientIds = permissions.map(p => p.patientId);
    const patientProfiles = await PatientProfile.find({ userId: { $in: patientIds } });
    const users = await User.find({ _id: { $in: patientIds } });

    const patientsList = patientProfiles.map(profile => {
      const u = users.find(userObj => userObj._id.toString() === profile.userId.toString());
      return {
        id: profile.userId,
        name: u?.name || 'Linked Patient',
        accessCode: profile.accessCode,
      };
    });

    res.json({ success: true, patients: patientsList });
  } catch (error) {
    next(error);
  }
};

exports.getDoctorPatientDetails = async (req, res, next) => {
  const { id } = req.params;
  try {
    // Verify active approved access permission
    const permission = await AccessPermission.findOne({
      patientId: id,
      doctorId: req.user._id,
      status: 'approved'
    });

    if (!permission) {
      return res.status(403).json({ success: false, message: 'Access denied: No active approved clinical link found.' });
    }

    const patient = await User.findById(id).select('-password');
    const profile = await PatientProfile.findOne({ userId: id });
    const medications = await Medication.find({ userId: id }).sort({ createdAt: -1 });
    const appointments = await Appointment.find({ userId: id }).sort({ date: 1 });
    const records = await HealthRecord.find({ userId: id }).sort({ date: -1 });
    const notes = await DoctorNote.find({ patientId: id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        accessCode: profile?.accessCode,
        healthScore: profile?.healthScore,
        allergies: profile?.allergies,
        vitals: profile?.vitals
      },
      medications,
      appointments,
      records,
      notes
    });
  } catch (error) {
    next(error);
  }
};

exports.postDoctorNotes = async (req, res, next) => {
  const { patientId, title, content, category } = req.body;
  if (!patientId || !title || !content) {
    return res.status(400).json({ success: false, message: 'Missing note details.' });
  }

  try {
    // Verify link status
    const permission = await AccessPermission.findOne({
      patientId,
      doctorId: req.user._id,
      status: 'approved'
    });

    if (!permission) {
      return res.status(403).json({ success: false, message: 'Access denied: Link is not approved.' });
    }

    const note = await DoctorNote.create({
      patientId,
      doctorId: req.user._id,
      title,
      content,
      category
    });

    const patientProfile = await PatientProfile.findOne({ userId: patientId });
    if (patientProfile && patientProfile.phone) {
      await whatsappService.sendMessage(
        patientProfile.phone,
        `Helio Alert: Dr. ${req.user.name} published a new clinical note in your timeline: "${title}".`
      );
    }

    // Audit Log
    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADD_NOTE',
      details: { patientId, noteId: note._id },
      ipAddress: req.ip
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

// --- CONSENT ACCESS FLOW ---
exports.getConsentRequests = async (req, res, next) => {
  try {
    const permissions = await AccessPermission.find({
      patientId: req.user.id
    }).populate('doctorId', 'name specialty department');
    res.json({ success: true, requests: permissions });
  } catch (error) {
    next(error);
  }
};

exports.postApproveConsent = async (req, res, next) => {
  const { permissionId } = req.body;
  try {
    const permission = await AccessPermission.findOne({
      _id: permissionId,
      patientId: req.user.id
    });

    if (!permission) {
      return res.status(404).json({ success: false, message: 'Access linkage request not found.' });
    }

    permission.status = 'approved';
    permission.history.push({ status: 'approved', changedAt: new Date() });
    await permission.save();

    // Link doctor to profile
    const profile = await PatientProfile.findOne({ userId: req.user.id });
    if (profile && !profile.doctorAccess.includes(permission.doctorId)) {
      profile.doctorAccess.push(permission.doctorId);
      await profile.save();
    }

    // Audit Log
    await AuditLog.create({
      actorId: req.user.id,
      action: 'APPROVE_CONSENT',
      details: { doctorId: permission.doctorId },
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Clinical access approved successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.postRevokeConsent = async (req, res, next) => {
  const { permissionId } = req.body;
  try {
    const permission = await AccessPermission.findOne({
      _id: permissionId,
      patientId: req.user.id
    });

    if (!permission) {
      return res.status(404).json({ success: false, message: 'Access linkage request not found.' });
    }

    permission.status = 'revoked';
    permission.history.push({ status: 'revoked', changedAt: new Date() });
    await permission.save();

    // Unlink doctor from profile
    const profile = await PatientProfile.findOne({ userId: req.user.id });
    if (profile) {
      profile.doctorAccess = profile.doctorAccess.filter(id => id.toString() !== permission.doctorId.toString());
      await profile.save();
    }

    // Audit Log
    await AuditLog.create({
      actorId: req.user.id,
      action: 'REVOKE_CONSENT',
      details: { doctorId: permission.doctorId },
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Clinical access revoked successfully.' });
  } catch (error) {
    next(error);
  }
};
