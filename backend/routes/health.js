const express = require('express');
const healthController = require('../controllers/healthController');
const { protect, checkRole } = require('../middleware/auth');

const router = express.Router();

// --- PATIENT HEALTH DASHBOARD ---
router.get('/dashboard', protect, checkRole(['patient']), healthController.getPatientDashboard);

// --- PROFILE EDIT & VITALS ---
router.post('/profile', protect, checkRole(['patient']), healthController.postProfile);
router.post('/profile/vitals', protect, checkRole(['patient']), healthController.postVitals);

// --- MEDICATION MANAGEMENT ---
router.post('/medications', protect, checkRole(['patient']), healthController.postMedications);
router.delete('/medications/:id', protect, checkRole(['patient']), healthController.deleteMedications);
router.post('/medications/:id/take', protect, checkRole(['patient']), healthController.postTakeDose);
router.post('/medications/:id/refill', protect, checkRole(['patient']), healthController.postRefillMed);

// --- APPOINTMENT MANAGEMENT ---
router.post('/appointments', protect, checkRole(['patient']), healthController.postAppointments);
router.delete('/appointments/:id', protect, checkRole(['patient']), healthController.deleteAppointments);
router.put('/appointments/:id/status', protect, checkRole(['doctor']), healthController.putAppointmentStatus);

// --- DIGITAL RECORDS ---
router.post('/records', protect, checkRole(['patient']), healthController.postRecords);
router.delete('/records/:id', protect, checkRole(['patient']), healthController.deleteRecords);

// --- AI COMPANION & OCR prescrip ---
router.post('/ai-chat', protect, checkRole(['patient']), healthController.postAIChat);
router.post('/ocr', protect, checkRole(['patient']), healthController.postOCR);

// --- EMERGENCY SOS DISPATCH ---
router.post('/sos', protect, checkRole(['patient']), healthController.postSOS);

// --- DOCTOR LINKING & ACCESS ---
router.post('/doctor/link-patient', protect, checkRole(['doctor']), healthController.postDoctorLinkPatient);
router.get('/doctor-dashboard', protect, checkRole(['doctor']), healthController.getDoctorDashboard);
router.get('/doctor/patient-details/:id', protect, checkRole(['doctor']), healthController.getDoctorPatientDetails);
router.post('/doctor/notes', protect, checkRole(['doctor']), healthController.postDoctorNotes);

// --- CONSENT ACCESS CONTROL ---
router.get('/consent-requests', protect, checkRole(['patient']), healthController.getConsentRequests);
router.post('/consent-approve', protect, checkRole(['patient']), healthController.postApproveConsent);
router.post('/consent-revoke', protect, checkRole(['patient']), healthController.postRevokeConsent);

module.exports = router;
