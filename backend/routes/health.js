const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/auth');
const PatientProfile = require('../models/PatientProfile');
const Medication = require('../models/Medication');
const Appointment = require('../models/Appointment');
const HealthRecord = require('../models/HealthRecord');
const DoctorNote = require('../models/DoctorNote');

router.get('/dashboard', protect, checkRole(['patient']), async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ userId: req.user._id }).lean();
    const medications = await Medication.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    const appointments = await Appointment.find({ userId: req.user._id }).sort({ date: 1 }).lean();
    const records = await HealthRecord.find({ userId: req.user._id }).sort({ date: -1 }).lean();
    const notes = await DoctorNote.find({ patientId: req.user._id }).sort({ createdAt: -1 }).lean();

    res.json({
      profile: profile || {},
      medications,
      appointments,
      records,
      notes,
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load care dashboard.' });
  }
});

router.post('/profile', protect, checkRole(['patient']), async (req, res) => {
  try {
    const update = {
      userId: req.user._id,
      ...req.body,
    };
    const profile = await PatientProfile.findOneAndUpdate({ userId: req.user._id }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Unable to save profile.' });
  }
});

router.post('/medications', protect, checkRole(['patient']), async (req, res) => {
  try {
    const medication = await Medication.create({ userId: req.user._id, ...req.body });
    res.status(201).json(medication);
  } catch (error) {
    res.status(500).json({ message: 'Unable to save medication.' });
  }
});

router.post('/appointments', protect, checkRole(['patient']), async (req, res) => {
  try {
    const appointment = await Appointment.create({ userId: req.user._id, ...req.body });
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Unable to save appointment.' });
  }
});

router.post('/records', protect, checkRole(['patient']), async (req, res) => {
  try {
    const record = await HealthRecord.create({ userId: req.user._id, ...req.body });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Unable to save health record.' });
  }
});

router.get('/doctor-dashboard', protect, checkRole(['doctor']), async (req, res) => {
  try {
    const patients = await PatientProfile.find({ doctorAccess: req.user._id }).lean();
    res.json({ patients });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load doctor dashboard.' });
  }
});

module.exports = router;
