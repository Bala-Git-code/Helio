import express from 'express';
import crypto from 'crypto';
import { authenticateJwt, requireRoles } from '../middleware/authMiddleware.js';
import { DoctorPatientLink } from '../models/DoctorPatientLink.js';
import { Prescription } from '../models/Prescription.js';
import { User } from '../models/User.js';
import { AdherenceLog } from '../models/AdherenceLog.js';
import { Medication } from '../models/Medication.js';
import { OutboxEvent } from '../models/OutboxEvent.js';
import { doctorConsentMiddleware } from '../services/consentService.js';
import { checkDrugInteractions } from '../services/geminiService.js';

const router = express.Router();

router.use(authenticateJwt);
router.use(requireRoles('DOCTOR', 'ADMIN'));

// GET /api/v1/doctor/patients - Patient roster with consent status
router.get('/patients', async (req, res, next) => {
  try {
    const links = await DoctorPatientLink.find({ doctorId: req.user._id }).populate('patientId', 'name email phone avatar dateOfBirth caregiverContact');

    const patientRoster = links.map((link) => ({
      linkId: link._id,
      patient: link.patientId,
      status: link.status,
      grantedAt: link.grantedAt,
      expiresAt: link.expiresAt,
    }));

    res.json({ success: true, count: patientRoster.length, data: patientRoster });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/doctor/consent/invite - Generate patient consent link code
router.post('/consent/invite', async (req, res, next) => {
  try {
    const { patientEmail } = req.body;

    if (!patientEmail) {
      return res.status(400).json({ success: false, error: 'Patient email address is required.' });
    }

    const patient = await User.findOne({ email: patientEmail.toLowerCase(), role: 'PATIENT' });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Registered patient not found with this email.' });
    }

    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days validity

    const link = await DoctorPatientLink.findOneAndUpdate(
      { doctorId: req.user._id, patientId: patient._id },
      {
        doctorId: req.user._id,
        patientId: patient._id,
        status: 'ACTIVE',
        inviteCode,
        grantedAt: new Date(),
        expiresAt,
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Consent link generated and active.',
      data: link,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/doctor/prescriptions - Doctor's prescription management list
router.get('/prescriptions', async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.user._id })
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/doctor/prescriptions - Issue new prescription with safety check & Transactional Outbox event
router.post('/prescriptions', doctorConsentMiddleware, async (req, res, next) => {
  try {
    const { patientId, medicationName, dosage, frequency, durationDays, instructions, bypassSafetyCheck } = req.body;

    if (!patientId || !medicationName || !dosage || !frequency || !durationDays) {
      return res.status(400).json({ success: false, error: 'Missing required prescription fields.' });
    }

    // Safety check against existing patient medications
    const existingMeds = await Medication.find({ patientId, status: 'ACTIVE' });
    let safetyCheck = null;

    if (!bypassSafetyCheck && existingMeds.length > 0) {
      safetyCheck = await checkDrugInteractions({
        newMedication: { name: medicationName, dosage },
        existingMedications: existingMeds,
      });

      if (safetyCheck.hasInteraction && safetyCheck.severity === 'HIGH') {
        return res.status(409).json({
          success: false,
          error: 'HIGH RISK DRUG INTERACTION CONTRAINDICATION',
          safetyCheck,
        });
      }
    }

    const prescription = await Prescription.create({
      doctorId: req.user._id,
      patientId,
      medicationName,
      dosage,
      frequency,
      durationDays,
      instructions: instructions || '',
      status: 'ACTIVE',
      auditTrail: [
        {
          action: 'PRESCRIPTION_CREATED',
          performedBy: req.user._id,
          notes: `Prescription created for ${medicationName} ${dosage}${safetyCheck?.warning ? ` (Safety warning noted: ${safetyCheck.warning})` : ''}`,
        },
      ],
    });

    // Auto-create Patient Medication entry
    await Medication.create({
      patientId,
      doctorId: req.user._id,
      name: medicationName,
      dosage,
      frequency,
      timesPerDay: frequency === 'TWICE_DAILY' ? 2 : frequency === 'THREE_TIMES_DAILY' ? 3 : 1,
      totalQuantity: durationDays * (frequency === 'TWICE_DAILY' ? 2 : 1),
      remainingQuantity: durationDays * (frequency === 'TWICE_DAILY' ? 2 : 1),
      instructions: instructions || '',
      prescribedBy: req.user._id,
    });

    // Emit Outbox Event for Notification dispatch
    const patientUser = await User.findById(patientId);
    await OutboxEvent.create({
      eventType: 'PRESCRIPTION_ISSUED',
      payload: {
        doctorId: req.user._id,
        patientId,
        phone: patientUser?.phone,
        medicationName,
        dosage,
        message: `[HELIO Doctor Alert] Dr. ${req.user.name} issued a new prescription for ${medicationName} (${dosage}).`,
      },
    });

    res.status(201).json({ success: true, data: prescription, safetyCheck });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/doctor/adherence-dashboard - Doctor portal adherence monitor & Caregiver Escalation alerts
router.get('/adherence-dashboard', async (req, res, next) => {
  try {
    const links = await DoctorPatientLink.find({ doctorId: req.user._id, status: 'ACTIVE' }).populate('patientId');

    const result = [];

    for (const link of links) {
      const patient = link.patientId;
      if (!patient) continue;

      const logs = await AdherenceLog.find({ patientId: patient._id })
        .sort({ scheduledTime: -1 })
        .limit(20);

      const total = logs.length;
      const taken = logs.filter((l) => l.status === 'TAKEN').length;
      const score = total > 0 ? Math.round((taken / total) * 100) : 100;

      // Check for > 2 consecutive missed doses
      let consecutiveMissed = 0;
      let hasAttentionFlag = false;

      for (const log of logs) {
        if (log.status === 'MISSED') {
          consecutiveMissed++;
          if (consecutiveMissed > 2) {
            hasAttentionFlag = true;
            break;
          }
        } else {
          break;
        }
      }

      // Trigger Caregiver Escalation Outbox Event if attention flag raised
      if (hasAttentionFlag) {
        const existingOutbox = await OutboxEvent.findOne({
          eventType: 'CAREGIVER_ESCALATION',
          'payload.patientId': patient._id,
          status: 'PENDING',
        });

        if (!existingOutbox) {
          await OutboxEvent.create({
            eventType: 'CAREGIVER_ESCALATION',
            payload: {
              patientId: patient._id,
              patientName: patient.name,
              caregiver: patient.caregiverContact,
              phone: patient.caregiverContact?.phone || patient.phone,
              consecutiveMissed,
              message: `[HELIO Safety Escalation Alert] Patient ${patient.name} has missed ${consecutiveMissed} consecutive medication doses. Caregiver contact notified.`,
            },
          });
        }
      }

      result.push({
        patient: {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          caregiverContact: patient.caregiverContact,
        },
        complianceScore: score,
        consecutiveMissed,
        hasAttentionFlag,
        attentionReason: hasAttentionFlag ? `Critical Safety Alert: ${consecutiveMissed} consecutive missed doses (Caregiver Escalated)` : null,
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
