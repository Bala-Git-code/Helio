const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const Medication = require('../models/Medication');
const Appointment = require('../models/Appointment');
const HealthRecord = require('../models/HealthRecord');
const DoctorNote = require('../models/DoctorNote');
const AccessPermission = require('../models/AccessPermission');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const MedicineLog = require('../models/MedicineLog');
const geminiService = require('../services/geminiService');
const whatsappService = require('../services/whatsappService');
const DoseInstance = require('../models/DoseInstance');
const doseInstanceEngine = require('../services/medication/DoseInstanceEngine');
const responseProcessingEngine = require('../services/medication/ResponseProcessingEngine');
const refillEngine = require('../services/medication/RefillEngine');
const voiceIntentEngine = require('../services/medication/VoiceIntentEngine');

// --- PATIENT HEALTH DASHBOARD AGGREGATION ---
exports.getPatientDashboard = async (req, res, next) => {
  try {
    let profile = await PatientProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new PatientProfile({
        userId: req.user._id,
        displayName: req.user.name,
      });
      await profile.save();
    }
    
    const medications = await Medication.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const appointments = await Appointment.find({ userId: req.user._id }).sort({ date: 1 });
    const records = await HealthRecord.find({ userId: req.user._id }).sort({ date: -1 });
    const notes = await DoctorNote.find({ patientId: req.user._id }).sort({ createdAt: -1 });
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30);

    // --- DYNAMIC HEALTH SCORE CALCULATION ENGINE ---
    // 1. Dosing Adherence percentage
    let totalTaken = 0;
    let totalTarget = 0;
    medications.forEach(m => {
      if (m.adherence) {
        totalTaken += (m.adherence.taken || 0);
        totalTarget += (m.adherence.target || 0);
      }
    });
    let adherenceScore = totalTarget > 0 ? Math.round((totalTaken / totalTarget) * 100) : 100;

    // 2. Vitals bonus: +10 if they logged vitals in the past 7 days
    let vitalsBonus = 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const hasRecentVitals = profile.vitalsHistory && profile.vitalsHistory.some(vh => new Date(vh.loggedAt) >= sevenDaysAgo);
    if (hasRecentVitals) {
      vitalsBonus = 10;
    }

    // 3. Emergency SOS penalty: -20 per SOS trigger in the last 7 days
    const recentSosCount = await AuditLog.countDocuments({
      actorId: req.user._id,
      action: 'SOS_TRIGGER',
      createdAt: { $gte: sevenDaysAgo }
    });
    const sosPenalty = recentSosCount * 20;

    // 4. Calculate Final score
    let calculatedScore = Math.max(0, Math.min(100, adherenceScore + vitalsBonus - sosPenalty));

    // Save calculation update to profile if changed
    if (profile.healthScore !== calculatedScore) {
      profile.healthScore = calculatedScore;
      await profile.save();
    }

    res.json({
      success: true,
      profile: profile.toObject(),
      medications,
      appointments,
      records,
      notes,
      notifications,
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

    let scoreDelta = 0;
    if (newVitals.heartRate >= 60 && newVitals.heartRate <= 100) scoreDelta += 1;
    if (newVitals.oxygenSaturation >= 95) scoreDelta += 1;
    if (scoreDelta > 0 && profile.healthScore < 100) {
      profile.healthScore = Math.min(profile.healthScore + scoreDelta, 100);
    }

    await profile.save();

    // Trigger Notification
    await Notification.create({
      userId: req.user._id,
      category: 'system',
      title: 'Vitals Recorded',
      message: `Vitals logged: Heart Rate ${newVitals.heartRate || 'N/A'} bpm, SpO2 ${newVitals.oxygenSaturation || 'N/A'}%.`,
      priority: 'low'
    });

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

// --- MEDICATION MANAGEMENT ---
exports.postMedications = async (req, res, next) => {
  try {
    const medication = await Medication.create({ userId: req.user._id, ...req.body });
    
    await Notification.create({
      userId: req.user._id,
      category: 'medicine',
      title: 'Medication Schedule Added',
      message: `A new routine for ${medication.name} (${medication.dosage}) has been added to your care timeline.`,
      priority: 'medium'
    });

    res.status(201).json(medication);
  } catch (error) {
    next(error);
  }
};

exports.deleteMedications = async (req, res, next) => {
  try {
    const medication = await Medication.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (medication) {
      await Notification.create({
        userId: req.user._id,
        category: 'medicine',
        title: 'Medication Deleted',
        message: `Medication schedule for ${medication.name} has been removed.`,
        priority: 'low'
      });
    }
    res.json({ success: true, message: 'Medication removed successfully.' });
  } catch (error) {
    next(error);
  }
};

// Pause / Resume Medication status
exports.patchMedicationStatus = async (req, res, next) => {
  const { active } = req.body;
  try {
    const medication = await Medication.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { active } },
      { new: true }
    );
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    await Notification.create({
      userId: req.user._id,
      category: 'medicine',
      title: active ? 'Medication Resumed' : 'Medication Paused',
      message: `Medication schedule for ${medication.name} was ${active ? 'resumed' : 'paused'}.`,
      priority: 'low'
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

    await Notification.create({
      userId: req.user._id,
      category: 'medicine',
      title: 'Medication Refilled',
      message: `Pill stock refilled for ${medication.name}. Remaining: ${medication.quantity}.`,
      priority: 'low'
    });

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

    await Notification.create({
      userId: req.user._id,
      category: 'appointment',
      title: 'Consultation Scheduled',
      message: `Appointment scheduled with ${appointment.doctorName} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}.`,
      priority: 'medium'
    });

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

exports.deleteAppointments = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (appointment) {
      await Notification.create({
        userId: req.user._id,
        category: 'appointment',
        title: 'Consultation Cancelled',
        message: `Appointment with ${appointment.doctorName} has been cancelled.`,
        priority: 'low'
      });
    }
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

    // Trigger Notification to patient
    await Notification.create({
      userId: appointment.userId,
      category: 'appointment',
      title: 'Consultation Status Updated',
      message: `Dr. ${req.user.name} updated status of appointment to ${status.toUpperCase()}.`,
      priority: 'medium'
    });

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

// --- DIGITAL RECORDS ---
exports.postRecords = async (req, res, next) => {
  try {
    const record = await HealthRecord.create({ userId: req.user._id, ...req.body });
    
    await Notification.create({
      userId: req.user._id,
      category: 'system',
      title: 'Medical Record Uploaded',
      message: `A new clinical record "${record.title}" has been saved to your health vault.`,
      priority: 'low'
    });

    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

exports.deleteRecords = async (req, res, next) => {
  try {
    const record = await HealthRecord.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (record) {
      await Notification.create({
        userId: req.user._id,
        category: 'system',
        title: 'Medical Record Removed',
        message: `Clinical record "${record.title}" has been deleted from your health vault.`,
        priority: 'low'
      });
    }
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

    // Create Notification
    await Notification.create({
      userId: req.user._id,
      category: 'emergency',
      title: '🚨 Emergency SOS Dispatched',
      message: `SOS Panic alert dispatched to emergency contact Jordan. Location registered: ${latitude ? 'Coordinates active' : 'N/A'}.`,
      priority: 'high'
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
      permission.status = 'pending';
      permission.history.push({ status: 'pending', changedAt: new Date() });
      await permission.save();
    } else {
      permission = new AccessPermission({
        patientId: profile.userId,
        doctorId: req.user._id,
        status: 'pending',
        history: [{ status: 'pending', changedAt: new Date() }]
      });
      await permission.save();
    }

    // Trigger Notification to patient
    await Notification.create({
      userId: profile.userId,
      category: 'doctor',
      title: 'Clinician Access Request',
      message: `Doctor ${req.user.name} is requesting clinical timeline permissions. Check the support options tab.`,
      priority: 'high'
    });

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

    // Trigger Notification to patient
    await Notification.create({
      userId: patientId,
      category: 'doctor',
      title: `Clinical Bulletin: ${title}`,
      message: `Dr. ${req.user.name} added a note: "${content.substring(0, 60)}..."`,
      priority: 'high'
    });

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

    const profile = await PatientProfile.findOne({ userId: req.user.id });
    if (profile && !profile.doctorAccess.includes(permission.doctorId)) {
      profile.doctorAccess.push(permission.doctorId);
      await profile.save();
    }

    // Trigger system notification
    const docUser = await User.findById(permission.doctorId);
    await Notification.create({
      userId: req.user.id,
      category: 'doctor',
      title: 'Clinician Connected',
      message: `Clinical access granted to Dr. ${docUser?.name || 'Practitioner'}.`,
      priority: 'medium'
    });

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

    const profile = await PatientProfile.findOne({ userId: req.user.id });
    if (profile) {
      profile.doctorAccess = profile.doctorAccess.filter(id => id.toString() !== permission.doctorId.toString());
      await profile.save();
    }

    // Trigger system notification
    const docUser = await User.findById(permission.doctorId);
    await Notification.create({
      userId: req.user.id,
      category: 'doctor',
      title: 'Clinician Connection Revoked',
      message: `Access revoked for Dr. ${docUser?.name || 'Practitioner'}.`,
      priority: 'medium'
    });

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

// --- NOTIFICATION HANDLERS ---
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

exports.patchMarkNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification alert not found.' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Notification removed.' });
  } catch (error) {
    next(error);
  }
};

// --- NEW MEDICATION CARE METHODS ---

exports.getTodayMedications = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Dynamic self-healing: if no instances generated for today, generate them first!
    let doses = await DoseInstance.find({
      patientId: req.user._id,
      expectedTime: { $gte: today, $lt: tomorrow }
    }).populate('medicationId').lean();

    if (doses.length === 0) {
      await doseInstanceEngine.generateRollingInstances(req.user._id);
      doses = await DoseInstance.find({
        patientId: req.user._id,
        expectedTime: { $gte: today, $lt: tomorrow }
      }).populate('medicationId').lean();
    }

    const doseInstances = doses.map(dose => ({
      id: dose._id,
      medicationId: dose.medicationId?._id,
      name: dose.medicationId?.name || dose.dosage || 'Medication',
      genericName: dose.medicationId?.genericName || '',
      form: dose.form || 'tablet',
      dosage: dose.dosage,
      purpose: dose.medicationId?.purpose || '',
      foodInstruction: dose.medicationId?.foodInstruction || 'none',
      specialInstructions: dose.medicationId?.specialInstructions || '',
      timeSlot: dose.localTime,
      scheduledTime: dose.localTime,
      status: dose.status,
      takenAt: dose.takenAt,
      reason: dose.skipReason || '',
      note: dose.notes || '',
      isAsNeeded: dose.medicationId?.frequency === 'As Needed'
    }));

    res.json({ success: true, date: today, doseInstances });
  } catch (error) {
    next(error);
  }
};

exports.getHistoryMedications = async (req, res, next) => {
  const { startDate, endDate, status, medicineId } = req.query;
  try {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const filter = {
      patientId: req.user._id,
      expectedTime: { $gte: start, $lte: end }
    };
    if (medicineId) {
      filter.medicationId = medicineId;
    }
    if (status) {
      filter.status = status;
    }

    const doses = await DoseInstance.find(filter).populate('medicationId').sort({ expectedTime: -1 }).lean();
    
    // Map to logs for compatibility with old interface
    const logs = doses.map(d => ({
      _id: d._id,
      medicationId: d.medicationId,
      timeSlot: d.localTime,
      scheduledTime: d.localTime,
      scheduledDate: d.expectedTime,
      status: d.status,
      takenAt: d.takenAt,
      delayMinutes: d.delayMinutes,
      skipped: d.status === 'SKIPPED',
      reason: d.skipReason,
      note: d.notes,
      createdAt: d.createdAt
    }));

    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

exports.getAdherenceMetrics = async (req, res, next) => {
  const { range = 30 } = req.query;
  try {
    const rangeDays = Number(range) || 30;
    const start = new Date();
    start.setDate(start.getDate() - rangeDays);
    start.setHours(0, 0, 0, 0);

    const medications = await Medication.find({ userId: req.user._id }).lean();
    const doses = await DoseInstance.find({
      patientId: req.user._id,
      expectedTime: { $gte: start },
      status: { $ne: 'CANCELLED' }
    }).lean();

    let totalExpected = 0;
    let totalTaken = 0;
    let totalSkipped = 0;
    let totalMissed = 0;

    const asNeededIds = new Set(
      medications.filter(m => m.frequency === 'As Needed' || m.frequency === 'as-needed').map(m => m._id.toString())
    );

    const breakdown = medications.map(med => {
      const medDoses = doses.filter(d => d.medicationId.toString() === med._id.toString());
      const isAsNeeded = asNeededIds.has(med._id.toString());

      const medExpected = isAsNeeded ? 0 : medDoses.length;
      const taken = medDoses.filter(d => d.status === 'TAKEN_ON_TIME' || d.status === 'TAKEN_LATE').length;
      const skipped = medDoses.filter(d => d.status === 'SKIPPED').length;
      const missed = medDoses.filter(d => d.status === 'MISSED').length;

      if (!isAsNeeded) {
        totalExpected += medExpected;
        totalTaken += taken;
        totalSkipped += skipped;
        totalMissed += missed;
      }

      const adherenceRate = medExpected > 0 ? Math.round((taken / medExpected) * 100) : 100;

      return {
        medicineId: med._id,
        name: med.name,
        expected: medExpected,
        taken,
        skipped,
        missed,
        adherenceRate
      };
    });

    const overallAdherence = totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 100;

    res.json({
      success: true,
      overallAdherence,
      totalExpected,
      totalTaken,
      totalSkipped,
      totalMissed,
      breakdown
    });
  } catch (error) {
    next(error);
  }
};

exports.getRefillStatus = async (req, res, next) => {
  try {
    const medications = await Medication.find({ userId: req.user._id }).lean();
    const refillData = medications.map(med => {
      const qty = med.quantity || 0;
      const threshold = med.refillThreshold || 5;
      const timesPerDay = med.times?.length || 1;
      
      let daysRemaining = 'N/A';
      let runOutDate = 'N/A';
      let confidence = 'Low (No schedule)';

      if (med.frequency !== 'As Needed' && med.frequency !== 'as-needed' && timesPerDay > 0) {
        daysRemaining = Math.max(0, Math.floor(qty / timesPerDay));
        const runOut = new Date();
        runOut.setDate(runOut.getDate() + daysRemaining);
        runOutDate = runOut.toISOString().split('T')[0];
        confidence = qty > 10 ? 'High' : 'Moderate';
      }

      return {
        medicineId: med._id,
        name: med.name,
        quantity: qty,
        refillThreshold: threshold,
        refillReminderEnabled: med.refillReminderEnabled !== false,
        daysRemaining,
        runOutDate,
        confidence,
        isLowStock: qty <= threshold
      };
    });

    res.json({ success: true, refillData });
  } catch (error) {
    next(error);
  }
};

exports.postTakeDose = async (req, res, next) => {
  const { timeSlot, note } = req.body;
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    let dose = await DoseInstance.findOne({
      patientId: req.user._id,
      medicationId: req.params.id,
      localTime: timeSlot || '08:00',
      expectedTime: { $gte: todayStart, $lt: todayEnd }
    });

    if (!dose) {
      // Dynamic generation for As Needed or custom unscheduled takes
      const med = await Medication.findById(req.params.id);
      if (!med) {
        return res.status(404).json({ success: false, message: 'Medication not found.' });
      }

      dose = await DoseInstance.create({
        patientId: req.user._id,
        medicationId: med._id,
        scheduleVersion: med.scheduleVersion || 1,
        expectedTime: new Date(),
        localTime: timeSlot || 'As Needed',
        timezone: 'UTC',
        dosage: med.dosage,
        form: med.form || 'tablet',
        status: 'SCHEDULED',
        idempotencyKey: `asneeded_${req.user._id}_${med._id}_${Date.now()}`
      });
    }

    const updatedDose = await responseProcessingEngine.processResponse({
      patientId: req.user._id,
      doseInstanceId: dose._id,
      intent: 'TAKEN',
      source: 'manual',
      note
    });

    res.json(updatedDose);
  } catch (error) {
    next(error);
  }
};

exports.postSkipDose = async (req, res, next) => {
  const { timeSlot, reason, note } = req.body;
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const dose = await DoseInstance.findOne({
      patientId: req.user._id,
      medicationId: req.params.id,
      localTime: timeSlot || '08:00',
      expectedTime: { $gte: todayStart, $lt: todayEnd }
    });

    if (!dose) {
      return res.status(404).json({ success: false, message: 'Scheduled dose instance not found to skip.' });
    }

    const updatedDose = await responseProcessingEngine.processResponse({
      patientId: req.user._id,
      doseInstanceId: dose._id,
      intent: 'SKIP',
      source: 'manual',
      reason,
      note
    });

    res.json({ success: true, log: updatedDose });
  } catch (error) {
    next(error);
  }
};

exports.postSnoozeDose = async (req, res, next) => {
  const { durationMinutes = 15, timeSlot } = req.body;
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const query = {
      patientId: req.user._id,
      medicationId: req.params.id,
      expectedTime: { $gte: todayStart, $lt: todayEnd }
    };
    if (timeSlot) {
      query.localTime = timeSlot;
    }

    const dose = await DoseInstance.findOne(query);

    if (!dose) {
      return res.status(404).json({ success: false, message: 'Dose instance not found to snooze.' });
    }

    const updatedDose = await responseProcessingEngine.processResponse({
      patientId: req.user._id,
      doseInstanceId: dose._id,
      intent: 'SNOOZE',
      source: 'manual',
      durationMinutes
    });

    res.json({ success: true, medication: updatedDose });
  } catch (error) {
    next(error);
  }
};

exports.postRefillAdjust = async (req, res, next) => {
  const { quantity, refillThreshold, refillReminderEnabled } = req.body;
  try {
    const medication = await Medication.findOne({ _id: req.params.id, userId: req.user._id });
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    if (quantity !== undefined) {
      // ledger audit update
      const diff = Number(quantity) - (medication.quantity || 0);
      await refillEngine.recordRefill(req.user._id, medication._id, diff, {
        actorId: req.user._id,
        reason: 'Manual adjustment override'
      });
    }
    if (refillThreshold !== undefined) medication.refillThreshold = Number(refillThreshold);
    if (refillReminderEnabled !== undefined) medication.refillReminderEnabled = !!refillReminderEnabled;

    await medication.save();

    res.json({ success: true, medication });
  } catch (error) {
    next(error);
  }
};

exports.patchPreferences = async (req, res, next) => {
  const { channels, leadTimeMinutes, quietHoursStart, quietHoursEnd, version } = req.body;
  try {
    const medication = await Medication.findOne({ _id: req.params.id, userId: req.user._id });
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    // Optimistic Concurrency Control check
    const clientVersion = req.headers['if-match'] || version;
    if (clientVersion !== undefined && medication.__v !== Number(clientVersion)) {
      return res.status(409).json({ 
        success: false, 
        message: 'Conflict: The medication document has been modified by another process. Please reload.' 
      });
    }

    medication.reminderPreferences = {
      ...medication.reminderPreferences,
      ...(channels !== undefined && { channels }),
      ...(leadTimeMinutes !== undefined && { leadTimeMinutes }),
      ...(quietHoursStart !== undefined && { quietHoursStart }),
      ...(quietHoursEnd !== undefined && { quietHoursEnd })
    };

    await medication.save();

    res.json({ success: true, medication });
  } catch (error) {
    next(error);
  }
};

exports.patchSchedule = async (req, res, next) => {
  const { times, frequency, version } = req.body;
  try {
    const medication = await Medication.findOne({ _id: req.params.id, userId: req.user._id });
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    // Optimistic Concurrency Control check
    const clientVersion = req.headers['if-match'] || version;
    if (clientVersion !== undefined && medication.__v !== Number(clientVersion)) {
      return res.status(409).json({ 
        success: false, 
        message: 'Conflict: The medication document has been modified by another process. Please reload.' 
      });
    }

    medication.scheduleHistory = medication.scheduleHistory || [];
    medication.scheduleHistory.push({
      version: medication.scheduleVersion || 1,
      frequency: medication.frequency,
      times: medication.times,
      changedAt: new Date()
    });

    medication.scheduleVersion = (medication.scheduleVersion || 1) + 1;
    if (times) medication.times = times;
    if (frequency) medication.frequency = frequency;

    await medication.save();

    // Invalidate future dose instances for this schedule and regenerate them!
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await DoseInstance.deleteMany({
      patientId: req.user._id,
      medicationId: medication._id,
      expectedTime: { $gte: today },
      status: 'SCHEDULED'
    });
    await doseInstanceEngine.generateRollingInstances(req.user._id);

    await Notification.create({
      userId: req.user._id,
      category: 'medicine',
      title: 'Medication Schedule Changed',
      message: `Your dosing schedule for ${medication.name} has been updated to version ${medication.scheduleVersion}.`,
      priority: 'medium'
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'MED_SCHEDULE_CHANGE',
      details: { medicationId: medication._id, version: medication.scheduleVersion, frequency, times },
      ipAddress: req.ip
    });

    res.json({ success: true, medication });
  } catch (error) {
    next(error);
  }
};

// Voice recognition commands interpret and confirm endpoints
exports.postVoiceInterpret = async (req, res, next) => {
  const { transcript } = req.body;
  try {
    const interpretation = await voiceIntentEngine.interpretTranscript(req.user._id, transcript);
    res.json(interpretation);
  } catch (error) {
    next(error);
  }
};

exports.postVoiceConfirm = async (req, res, next) => {
  const { command } = req.body;
  try {
    const dose = await responseProcessingEngine.processResponse(command);
    res.json({ success: true, dose });
  } catch (error) {
    next(error);
  }
};
