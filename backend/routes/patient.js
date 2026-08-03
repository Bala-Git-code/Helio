import express from 'express';
import { authenticateJwt } from '../middleware/authMiddleware.js';
import { Medication } from '../models/Medication.js';
import { AdherenceLog } from '../models/AdherenceLog.js';
import { Prescription } from '../models/Prescription.js';
import { OutboxEvent } from '../models/OutboxEvent.js';
import { checkDrugInteractions } from '../services/geminiService.js';

const router = express.Router();

router.use(authenticateJwt);

// GET /api/v1/patient/medications - List medications with projected fields and lean queries
router.get('/medications', async (req, res, next) => {
  try {
    const patientId = req.user.role === 'DOCTOR' ? req.query.patientId : req.user._id;
    if (!patientId) {
      return res.status(400).json({ success: false, error: 'Patient ID is required.' });
    }

    const medications = await Medication.find({ patientId })
      .select('name dosage frequency timesPerDay scheduleTimes totalQuantity remainingQuantity refillThreshold instructions status')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: medications.length, data: medications });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/patient/check-interactions - Drug Interaction Safety Check
router.post('/check-interactions', async (req, res, next) => {
  try {
    const { newMedication } = req.body;
    if (!newMedication || !newMedication.name) {
      return res.status(400).json({ success: false, error: 'Medication name is required for safety analysis.' });
    }

    const existingMedications = await Medication.find({ patientId: req.user._id, status: 'ACTIVE' })
      .select('name dosage frequency')
      .lean();

    const analysis = await checkDrugInteractions({ newMedication, existingMedications });
    res.json({ success: true, data: analysis });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/patient/medications - Add new medication
router.post('/medications', async (req, res, next) => {
  try {
    const { name, dosage, frequency, timesPerDay, scheduleTimes, totalQuantity, remainingQuantity, refillThreshold, instructions, skipInteractionCheck } = req.body;

    if (!name || !dosage) {
      return res.status(400).json({ success: false, error: 'Medication name and dosage are required.' });
    }

    const existingMeds = await Medication.find({ patientId: req.user._id, status: 'ACTIVE' }).select('name dosage').lean();
    if (!skipInteractionCheck && existingMeds.length > 0) {
      const safetyCheck = await checkDrugInteractions({ newMedication: { name, dosage }, existingMedications: existingMeds });
      if (safetyCheck.hasInteraction && safetyCheck.severity === 'HIGH') {
        return res.status(409).json({
          success: false,
          error: 'HIGH RISK DRUG INTERACTION DETECTED',
          safetyCheck,
        });
      }
    }

    const med = await Medication.create({
      patientId: req.user._id,
      name,
      dosage,
      frequency: frequency || 'ONCE_DAILY',
      timesPerDay: timesPerDay || 1,
      scheduleTimes: scheduleTimes || ['08:00'],
      dailyTimings: scheduleTimes || ['08:00'],
      totalQuantity: totalQuantity || 30,
      remainingQuantity: remainingQuantity ?? totalQuantity ?? 30,
      refillThreshold: refillThreshold || 7,
      instructions: instructions || '',
      status: 'ACTIVE',
    });

    res.status(201).json({ success: true, data: med });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/patient/medications/:id - Update medication
router.put('/medications/:id', async (req, res, next) => {
  try {
    const med = await Medication.findOne({ _id: req.params.id, patientId: req.user._id });
    if (!med) {
      return res.status(404).json({ success: false, error: 'Medication not found.' });
    }

    Object.assign(med, req.body);
    await med.save();
    res.json({ success: true, data: med });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/patient/medications/:id - Delete medication
router.delete('/medications/:id', async (req, res, next) => {
  try {
    const med = await Medication.findOneAndDelete({ _id: req.params.id, patientId: req.user._id });
    if (!med) {
      return res.status(404).json({ success: false, error: 'Medication not found.' });
    }
    res.json({ success: true, message: 'Medication deleted.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/patient/adherence - Log dose taken/missed/skipped
router.post('/adherence', async (req, res, next) => {
  try {
    const { medicationId, scheduledTime, status, notes, voiceLogged, confirmationChannel } = req.body;

    if (!medicationId || !status) {
      return res.status(400).json({ success: false, error: 'Medication ID and status are required.' });
    }

    const med = await Medication.findById(medicationId);
    if (!med) {
      return res.status(404).json({ success: false, error: 'Medication record not found.' });
    }

    const log = await AdherenceLog.create({
      patientId: req.user._id,
      medicationId,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
      takenAt: status === 'TAKEN' ? new Date() : null,
      status,
      confirmationChannel: confirmationChannel || (voiceLogged ? 'VOICE' : 'APP'),
      notes: notes || '',
      voiceLogged: !!voiceLogged,
    });

    if (status === 'TAKEN' && med.remainingQuantity > 0) {
      med.remainingQuantity -= 1;
      await med.save();

      if (med.remainingQuantity <= med.refillThreshold) {
        await OutboxEvent.create({
          eventType: 'REFILL_ALERT',
          payload: {
            patientId: req.user._id,
            phone: req.user.phone,
            medicationName: med.name,
            remainingQuantity: med.remainingQuantity,
            message: `[HELIO Refill Alert] Your supply for ${med.name} is down to ${med.remainingQuantity} pills. Please request a refill.`,
          },
        });
      }
    }

    res.status(201).json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/patient/adherence/stats - Calculate compliance & streak using lean projected query
router.get('/adherence/stats', async (req, res, next) => {
  try {
    const patientId = req.query.patientId || req.user._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const logs = await AdherenceLog.find({
      patientId,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select('status scheduledTime createdAt')
      .sort({ scheduledTime: -1 })
      .lean();

    const totalDoses = logs.length;
    const takenDoses = logs.filter((l) => l.status === 'TAKEN').length;
    const missedDoses = logs.filter((l) => l.status === 'MISSED').length;
    const skippedDoses = logs.filter((l) => l.status === 'SKIPPED').length;

    const complianceScore = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    let currentStreak = 0;
    for (const l of logs) {
      if (l.status === 'TAKEN') {
        currentStreak++;
      } else if (l.status === 'MISSED') {
        break;
      }
    }

    res.json({
      success: true,
      data: {
        totalDoses,
        takenDoses,
        missedDoses,
        skippedDoses,
        complianceScore,
        currentStreak,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/patient/timeline - Lean aggregate timeline feed
router.get('/timeline', async (req, res, next) => {
  try {
    const patientId = req.query.patientId || req.user._id;

    const [adherenceLogs, prescriptions] = await Promise.all([
      AdherenceLog.find({ patientId })
        .populate('medicationId', 'name dosage')
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Prescription.find({ patientId })
        .populate('doctorId', 'name specialty')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const timelineEvents = [
      ...adherenceLogs.map((log) => ({
        type: 'DOSE_LOG',
        title: `Dose ${log.status}: ${log.medicationId?.name || 'Medication'} (${log.medicationId?.dosage || ''})`,
        timestamp: log.createdAt,
        status: log.status,
        channel: log.confirmationChannel || 'APP',
        details: log.notes || (log.voiceLogged ? 'Logged via Voice Assistant' : ''),
      })),
      ...prescriptions.map((p) => ({
        type: 'PRESCRIPTION_ADDED',
        title: `Prescription Issued: ${p.medicationName} ${p.dosage}`,
        timestamp: p.createdAt,
        status: p.status,
        details: `Issued by Dr. ${p.doctorId?.name || 'Physician'}. ${p.instructions}`,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ success: true, count: timelineEvents.length, data: timelineEvents });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/patient/refill-forecast - Lean refill supply decay calculation
router.get('/refill-forecast', async (req, res, next) => {
  try {
    const patientId = req.query.patientId || req.user._id;
    const medications = await Medication.find({ patientId, status: 'ACTIVE' })
      .select('name dosage remainingQuantity refillThreshold timesPerDay')
      .lean();

    const forecasts = medications.map((med) => {
      const dailyConsumption = med.timesPerDay || 1;
      const daysRemaining = dailyConsumption > 0 ? Math.floor(med.remainingQuantity / dailyConsumption) : 0;
      const predictedRefillDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
      const isUrgent = daysRemaining <= (med.refillThreshold || 7);

      return {
        medicationId: med._id,
        name: med.name,
        dosage: med.dosage,
        remainingQuantity: med.remainingQuantity,
        refillThreshold: med.refillThreshold,
        dailyConsumption,
        daysRemaining,
        predictedRefillDate,
        isUrgent,
      };
    });

    res.json({ success: true, data: forecasts });
  } catch (err) {
    next(err);
  }
});

export default router;
