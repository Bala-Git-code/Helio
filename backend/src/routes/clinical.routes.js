import express from 'express';
import { requireAuth, requireRole } from '../middleware/security.js';
import {
  handleGeneratePairingCode,
  handleGetPairingCodeStatus,
  handleClaimPatient,
  handleRevokeDoctorAccess,
  handleGetLinkedPatients,
  handleGetAuditLogs,
} from '../controllers/pairingController.js';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Clinical Protocol & Delegation Routes (routes/clinical.routes.js)
 * ============================================================================
 * 
 * Strict Role Guarding:
 * - Patient routes require 'patient' role.
 * - Doctor routes require 'doctor' role.
 * - All state-changing methods are guarded by CSRF Origin checks.
 */

const router = express.Router();

// ---------------------------------------------------------------------------
// Patient Delegation Endpoints
// ---------------------------------------------------------------------------

/**
 * Generate 24-hour alphanumeric pairing code
 * POST /api/patient/pairing-code
 */
router.post(
  '/patient/pairing-code',
  requireAuth,
  requireRole('patient'),
  handleGeneratePairingCode
);

/**
 * Query active pairing code and remaining countdown
 * GET /api/patient/pairing-code
 */
router.get(
  '/patient/pairing-code',
  requireAuth,
  requireRole('patient'),
  handleGetPairingCodeStatus
);

/**
 * Revoke specific doctor access
 * POST /api/patient/revoke-doctor
 */
router.post(
  '/patient/revoke-doctor',
  requireAuth,
  requireRole('patient'),
  handleRevokeDoctorAccess
);

// ---------------------------------------------------------------------------
// Doctor Clinical Delegation & Cohort Endpoints
// ---------------------------------------------------------------------------

/**
 * Redeem patient pairing code (5-attempt rate-limit lockout enforced)
 * POST /api/doctor/claim-patient
 */
router.post(
  '/doctor/claim-patient',
  requireAuth,
  requireRole('doctor'),
  handleClaimPatient
);

/**
 * Query linked patient cohort
 * GET /api/doctor/patients
 */
router.get(
  '/doctor/patients',
  requireAuth,
  requireRole('doctor'),
  handleGetLinkedPatients
);

// ---------------------------------------------------------------------------
// Compliance & Audit Trail Endpoints
// ---------------------------------------------------------------------------

/**
 * Inspection of immutable audit logs
 * GET /api/audit/logs
 */
router.get(
  '/audit/logs',
  requireAuth,
  handleGetAuditLogs
);

export default router;
