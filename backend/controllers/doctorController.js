const doctorService = require('../services/doctorService');
const patientService = require('../services/patientService');
const consultationService = require('../services/consultationService');
const consentService = require('../services/consentService');
const aiGatewayService = require('../services/aiGatewayService');
const auditService = require('../services/auditService');

class DoctorController {
  async getDashboard(req, res, next) {
    try {
      const data = await doctorService.getDoctorDashboardData(req.user._id);
      res.json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }

  async getPatients(req, res, next) {
    try {
      const search = req.query.search || '';
      const filters = {
        bloodType: req.query.bloodType,
        riskLevel: req.query.riskLevel,
        condition: req.query.condition
      };
      const sortBy = req.query.sortBy || 'name-asc';

      const list = await patientService.getPatientsList(req.user._id, search, filters, sortBy);
      res.json({ success: true, patients: list });
    } catch (error) {
      next(error);
    }
  }

  async getPatientById(req, res, next) {
    try {
      const profile = await patientService.getPatientCompleteProfile(req.user._id, req.params.id);
      res.json({ success: true, ...profile });
    } catch (error) {
      next(error);
    }
  }

  async requestConsent(req, res, next) {
    try {
      const result = await consentService.requestClinicalLink(req.user._id, req.body.accessCode, req.user.name);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async checkConsent(req, res, next) {
    try {
      const isApproved = await consentService.verifyDoctorAccess(req.user._id, req.params.id);
      res.json({ success: true, approved: isApproved });
    } catch (error) {
      next(error);
    }
  }

  async saveConsultation(req, res, next) {
    try {
      const result = await consultationService.saveDraftConsultation(req.user._id, req.body.patientId, req.body);
      res.json({ success: true, consultation: result });
    } catch (error) {
      next(error);
    }
  }

  async finalizeConsultation(req, res, next) {
    try {
      const result = await consultationService.finalizeConsultation(req.user._id, req.body.patientId, req.body);
      res.json({ success: true, consultation: result });
    } catch (error) {
      next(error);
    }
  }

  async getPatientConsultations(req, res, next) {
    try {
      const list = await consultationService.getPatientConsultations(req.params.patientId);
      res.json({ success: true, consultations: list });
    } catch (error) {
      next(error);
    }
  }

  async getTimeline(req, res, next) {
    try {
      const profile = await patientService.getPatientCompleteProfile(req.user._id, req.params.patientId);
      res.json({ success: true, timeline: profile.timeline });
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req, res, next) {
    try {
      const data = await doctorService.getDoctorDashboardData(req.user._id);
      res.json({ success: true, notifications: data.notifications });
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      // Simulating metrics outcomes indexes
      res.json({
        success: true,
        indices: [
          { label: 'Diabetic Target Met', value: '78%' },
          { label: 'BP Targets Met', value: '85%' },
          { label: 'Medication Adherence Avg', value: '88%' }
        ]
      });
    } catch (error) {
      next(error);
    }
  }

  async postAISummary(req, res, next) {
    try {
      const details = await patientService.getPatientCompleteProfile(req.user._id, req.body.patientId);
      const summary = await aiGatewayService.generateConsultationSummary(details.patient, req.body.notes);
      res.json({ success: true, summary });
    } catch (error) {
      next(error);
    }
  }

  async postAIInteraction(req, res, next) {
    try {
      const result = await aiGatewayService.auditInteraction(req.body.drugA, req.body.drugB);
      res.json({ success: true, result });
    } catch (error) {
      next(error);
    }
  }

  async getPatientMedications(req, res, next) {
    try {
      const Medication = require('../models/Medication');
      const MedicineLog = require('../models/MedicineLog');
      
      const patientId = req.params.id;
      const medications = await Medication.find({ userId: patientId }).sort({ createdAt: -1 }).lean();
      const logs = await MedicineLog.find({ userId: patientId }).sort({ createdAt: -1 }).limit(100).lean();
      
      res.json({
        success: true,
        medications,
        logs
      });
    } catch (error) {
      next(error);
    }
  }

  async getMedicationsAttention(req, res, next) {
    try {
      const Medication = require('../models/Medication');
      const PatientProfile = require('../models/PatientProfile');
      const User = require('../models/User');
      const doctorId = req.user._id;

      const patientIds = await require('../repositories/doctorRepository').findAssignedPatientIds(doctorId);

      const attentionItems = [];

      for (const pId of patientIds) {
        const patient = await User.findById(pId).select('name email').lean();
        const profile = await PatientProfile.findOne({ userId: pId }).lean();
        const medications = await Medication.find({ userId: pId, active: true }).lean();

        if (!patient) continue;

        medications.forEach(med => {
          if (med.quantity !== undefined && med.quantity <= med.refillThreshold) {
            attentionItems.push({
              id: `${med._id}_refill`,
              patientId: pId,
              patientName: patient.name,
              medicine: med.name,
              reason: 'Refill Overdue / Low Stock',
              severity: med.quantity === 0 ? 'High' : 'Moderate',
              timeWindow: 'Supply critical',
              evidence: `Only ${med.quantity} pills remaining. Threshold: ${med.refillThreshold}.`,
              recommendedAction: 'Approve prescription renewal or notify patient to refill stock.',
              status: 'pending'
            });
          }

          if (profile && profile.healthScore < 80) {
            const exists = attentionItems.some(item => item.patientId.toString() === pId.toString() && item.reason === 'Sustained Non-Adherence');
            if (!exists) {
              attentionItems.push({
                id: `${pId}_adherence`,
                patientId: pId,
                patientName: patient.name,
                medicine: med.name,
                reason: 'Sustained Non-Adherence',
                severity: profile.healthScore < 70 ? 'High' : 'Moderate',
                timeWindow: 'Last 7 Days',
                evidence: `Patient health/adherence score has dropped to ${profile.healthScore}%.`,
                recommendedAction: 'Schedule a review consultation to assess adherence barriers.',
                status: 'pending'
              });
            }
          }
        });
      }

      res.json({ success: true, attentionList: attentionItems });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DoctorController();
