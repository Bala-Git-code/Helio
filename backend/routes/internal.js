const express = require('express');
const router = express.Router();
const QueueJob = require('../models/QueueJob');
const JobAttempt = require('../models/JobAttempt');
const Worker = require('../models/Worker');
const QueueService = require('../services/medication/QueueService');
const consentService = require('../services/consentService');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { checkCapability } = require('../middleware/authorization');
const { MetricsRegistry } = require('../services/medication/observability');

// Helper to check tenant-scoped isolation
async function verifyTenantAccess(user, tenantId) {
  if (!tenantId) return true; // global/system jobs are accessible
  if (user.role === 'admin') return true;
  if (String(user._id) === String(tenantId)) return true;
  if (user.role === 'doctor') {
    // Check approved clinical consent
    const isGranted = await consentService.verifyDoctorAccess(user._id, tenantId);
    return !!isGranted;
  }
  return false;
}

// Redaction utility to secure payload & result outputs
function redactSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'apiKey', 'access_token', 'private'];
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item));
  }
  
  const redacted = {};
  for (const [k, v] of Object.entries(obj)) {
    if (sensitiveKeys.some(sk => k.toLowerCase().includes(sk))) {
      redacted[k] = '[REDACTED]';
    } else if (typeof v === 'object') {
      redacted[k] = redactSensitiveData(v);
    } else {
      redacted[k] = v;
    }
  }
  return redacted;
}

// GET /api/internal/jobs (List with pagination and filters)
router.get('/jobs', protect, checkCapability('jobs:read'), async (req, res, next) => {
  try {
    const {
      tenant,
      jobType,
      status,
      workerId,
      createdFrom,
      createdTo,
      scheduledFrom,
      scheduledTo,
      errorClassification,
      correlationId,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Tenancy isolation enforcement
    if (req.user.role !== 'admin') {
      if (req.user.role === 'patient') {
        query.tenantId = String(req.user._id);
      } else if (req.user.role === 'doctor') {
        // Fetch all patients linked to the doctor
        const permissions = await mongoose.model('AccessPermission').find({
          doctorId: req.user._id,
          status: 'approved'
        }).lean();
        const patientIds = permissions.map(p => String(p.patientId));
        query.tenantId = { $in: patientIds };
      }
    } else if (tenant) {
      query.tenantId = String(tenant);
    }

    if (jobType) query.jobType = jobType;
    if (status) query.status = status;
    if (workerId) query.lockedBy = workerId;
    if (correlationId) query.correlationId = correlationId;
    if (errorClassification) query.lastErrorClassification = errorClassification;

    if (createdFrom || createdTo) {
      query.createdAt = {};
      if (createdFrom) query.createdAt.$gte = new Date(createdFrom);
      if (createdTo) query.createdAt.$lte = new Date(createdTo);
    }

    if (scheduledFrom || scheduledTo) {
      query.runAt = {};
      if (scheduledFrom) query.runAt.$gte = new Date(scheduledFrom);
      if (scheduledTo) query.runAt.$lte = new Date(scheduledTo);
    }

    const total = await QueueJob.countDocuments(query);
    
    // Omit full payloads and results from list view for security/performance
    const items = await QueueJob.find(query)
      .select('-payload -result')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/internal/jobs/:jobId (Detailed inspection)
router.get('/jobs/:jobId', protect, checkCapability('jobs:read'), async (req, res, next) => {
  try {
    const job = await QueueJob.findById(req.params.jobId).lean();
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const hasAccess = await verifyTenantAccess(req.user, job.tenantId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied: Tenant isolation policy violation.' });
    }

    // Redact sensitive details in payload and result
    const responseJob = { ...job };
    if (responseJob.payload) responseJob.payload = redactSensitiveData(responseJob.payload);
    if (responseJob.result) responseJob.result = redactSensitiveData(responseJob.result);

    res.json({ success: true, data: responseJob });
  } catch (err) {
    next(err);
  }
});

// GET /api/internal/jobs/:jobId/attempts (Attempt history)
router.get('/jobs/:jobId/attempts', protect, checkCapability('jobs:read'), async (req, res, next) => {
  try {
    const job = await QueueJob.findById(req.params.jobId).lean();
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const hasAccess = await verifyTenantAccess(req.user, job.tenantId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied: Tenant isolation policy violation.' });
    }

    const attempts = await JobAttempt.find({ jobId: req.params.jobId })
      .sort({ attemptNumber: 1 })
      .lean();

    res.json({ success: true, data: redactSensitiveData(attempts) });
  } catch (err) {
    next(err);
  }
});

// POST /api/internal/jobs/:jobId/retry (Manual retry)
router.post('/jobs/:jobId/retry', protect, checkCapability('jobs:retry'), async (req, res, next) => {
  try {
    const job = await QueueJob.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const hasAccess = await verifyTenantAccess(req.user, job.tenantId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied: Tenant isolation policy violation.' });
    }

    const retriedJob = await QueueService.triggerManualRetry(req.params.jobId, req.user._id);

    // Create Audit entry
    await AuditLog.create({
      actorId: req.user._id,
      action: 'BACKGROUND_JOB_RETRY',
      details: { jobId: job._id, tenantId: job.tenantId, jobType: job.jobType }
    });

    res.json({ success: true, message: 'Job scheduled for manual retry successfully.', data: retriedJob });
  } catch (err) {
    next(err);
  }
});

// POST /api/internal/jobs/:jobId/cancel (Manual cancel)
router.post('/jobs/:jobId/cancel', protect, checkCapability('jobs:cancel'), async (req, res, next) => {
  try {
    const job = await QueueJob.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const hasAccess = await verifyTenantAccess(req.user, job.tenantId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied: Tenant isolation policy violation.' });
    }

    const cancelledJob = await QueueService.triggerCancellation(req.params.jobId, req.user._id);

    // Create Audit entry
    await AuditLog.create({
      actorId: req.user._id,
      action: 'BACKGROUND_JOB_CANCEL',
      details: { jobId: job._id, tenantId: job.tenantId, jobType: job.jobType }
    });

    res.json({ success: true, message: 'Job cancelled successfully.', data: cancelledJob });
  } catch (err) {
    next(err);
  }
});

// GET /api/internal/workers (List worker node heartbeats)
router.get('/workers', protect, checkCapability('workers:read'), async (req, res, next) => {
  try {
    const workers = await Worker.find().sort({ lastHeartbeatAt: -1 }).lean();
    res.json({ success: true, data: workers });
  } catch (err) {
    next(err);
  }
});

// GET /api/internal/workers/:workerId (Inspect worker)
router.get('/workers/:workerId', protect, checkCapability('workers:read'), async (req, res, next) => {
  try {
    const worker = await Worker.findOne({ workerId: req.params.workerId }).lean();
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }
    res.json({ success: true, data: worker });
  } catch (err) {
    next(err);
  }
});

// GET /api/internal/metrics (Expose observability metrics)
router.get('/metrics', protect, checkCapability('workers:read'), async (req, res, next) => {
  try {
    const snapshot = MetricsRegistry.getMetricsSnapshot();
    res.json({ success: true, data: snapshot });
  } catch (err) {
    next(err);
  }
});

const mongoose = require('mongoose');

module.exports = router;
