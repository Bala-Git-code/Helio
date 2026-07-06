const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/auth');
const { verifyPatientConsent } = require('../middleware/consent');
const doctorController = require('../controllers/doctorController');
const { 
  validateObjectId, 
  validateConsultationPayload, 
  validateLinkPayload 
} = require('../validators/doctorValidator');

// Apply doctor auth protection globally to all endpoints mounted on this router
router.use(protect);
router.use(checkRole(['doctor']));

// 1. DASHBOARD & NOTIFICATIONS
router.get('/dashboard', doctorController.getDashboard);
router.get('/notifications', doctorController.getNotifications);
router.get('/analytics', doctorController.getAnalytics);

// 2. PATIENTS DIRECTORY
router.get('/patients', doctorController.getPatients);
router.get('/medications/attention', doctorController.getMedicationsAttention);

// 3. PATIENT DETAIL PROFILE (Protected by consent)
router.get('/patients/:id', validateObjectId('id'), verifyPatientConsent, doctorController.getPatientById);
router.get('/patients/:id/medications', validateObjectId('id'), verifyPatientConsent, doctorController.getPatientMedications);

// 4. CONSENT & LINKING
router.post('/consent/request', validateLinkPayload, doctorController.requestConsent);
router.get('/consent/check/:id', validateObjectId('id'), doctorController.checkConsent);

// 5. CONSULTATIONS (Protected by consent validation where patientId is supplied)
router.post('/consultations', validateConsultationPayload, verifyPatientConsent, doctorController.saveConsultation);
router.put('/consultations', validateConsultationPayload, verifyPatientConsent, doctorController.finalizeConsultation);
router.get('/consultations/:patientId', validateObjectId('patientId'), verifyPatientConsent, doctorController.getPatientConsultations);

// 6. CLINICAL TIMELINE (Protected by consent)
router.get('/timeline/:patientId', validateObjectId('patientId'), verifyPatientConsent, doctorController.getTimeline);

// 7. AI GATEWAY ROUTER
router.post('/ai/consultation-summary', doctorController.postAISummary);
router.post('/ai/interaction-check', doctorController.postAIInteraction);

module.exports = router;