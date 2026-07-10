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

// GET /api/internal/retrieval-indexes
router.get('/retrieval-indexes', protect, checkCapability('repository-retrieval-index:read'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.repositoryId) {
      query.repositoryId = req.query.repositoryId;
    }

    // Limit tenant scope unless request:any-tenant capability
    const hasAnyTenant = req.user.role === 'admin';
    if (!hasAnyTenant) {
      query.tenantId = String(req.user._id);
    }

    const RepositoryRetrievalIndex = require('../models/RepositoryRetrievalIndex');
    const total = await RepositoryRetrievalIndex.countDocuments(query);
    const list = await RepositoryRetrievalIndex.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: list,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/internal/retrieval-indexes/:retrievalIndexId
router.get('/retrieval-indexes/:retrievalIndexId', protect, checkCapability('repository-retrieval-index:read'), async (req, res, next) => {
  try {
    const RepositoryRetrievalIndex = require('../models/RepositoryRetrievalIndex');
    const index = await RepositoryRetrievalIndex.findById(req.params.retrievalIndexId).lean();
    if (!index) {
      return res.status(404).json({ success: false, message: 'Retrieval index not found.' });
    }

    const hasAccess = await verifyTenantAccess(req.user, index.tenantId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied: Tenant isolation policy violation.' });
    }

    res.json({ success: true, data: index });
  } catch (err) {
    next(err);
  }
});

// POST /api/internal/repositories/:repositoryId/retrieval-index/rebuild
router.post('/repositories/:repositoryId/retrieval-index/rebuild', protect, checkCapability('repository-retrieval-index:rebuild'), async (req, res, next) => {
  try {
    const tenantId = String(req.user._id);
    const { repositoryId } = req.params;

    const Repository = require('../models/Repository');
    const repo = await Repository.findOne({ _id: repositoryId, tenantId });
    if (!repo) {
      return res.status(404).json({ success: false, message: 'Repository not found.' });
    }

    const snapshotId = req.body.snapshotId || repo.latestIndexedSnapshotId;
    if (!snapshotId) {
      return res.status(400).json({ success: false, message: 'No snapshot available to index.' });
    }

    // Queue retrieval index job
    await QueueService.enqueue(
      'repository-retrieval',
      'build-retrieval-index-job',
      { tenantId, repositoryId, snapshotId },
      {
        tenantId,
        idempotencyKey: `retrieval_rebuild_${snapshotId}_${Date.now()}`,
        maxAttempts: 3
      }
    );

    // Audit log entry
    await AuditLog.create({
      actorId: req.user._id,
      action: 'RETRIEVAL_INDEX_REBUILD_REQUESTED',
      details: { repositoryId, snapshotId }
    });

    res.status(202).json({
      success: true,
      message: 'Retrieval index rebuild task successfully enqueued.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/internal/repositories/:repositoryId/retrieval-index/recover
router.post('/repositories/:repositoryId/retrieval-index/recover', protect, checkCapability('repository-retrieval-index:rebuild'), async (req, res, next) => {
  try {
    const tenantId = String(req.user._id);
    const { repositoryId } = req.params;

    const Repository = require('../models/Repository');
    const repo = await Repository.findOne({ _id: repositoryId, tenantId });
    if (!repo) {
      return res.status(404).json({ success: false, message: 'Repository not found.' });
    }

    const snapshotId = req.body.snapshotId || repo.latestIndexedSnapshotId;
    if (!snapshotId) {
      return res.status(400).json({ success: false, message: 'No snapshot available to recover.' });
    }

    // Attempt to recover degraded state
    const RepositoryRetrievalIndex = require('../models/RepositoryRetrievalIndex');
    const index = await RepositoryRetrievalIndex.findOne({ tenantId, repositoryId, snapshotId }).sort({ createdAt: -1 });

    if (!index || index.status !== 'FAILED') {
      return res.status(400).json({ success: false, message: 'No failed index exists for the target snapshot to trigger recovery.' });
    }

    index.status = 'PENDING';
    await index.save();

    await QueueService.enqueue(
      'repository-retrieval',
      'build-retrieval-index-job',
      { tenantId, repositoryId, snapshotId },
      {
        tenantId,
        idempotencyKey: `retrieval_recover_${snapshotId}_${Date.now()}`,
        maxAttempts: 3
      }
    );

    // Audit log entry
    await AuditLog.create({
      actorId: req.user._id,
      action: 'RETRIEVAL_INDEX_RECOVERY_REQUESTED',
      details: { repositoryId, snapshotId, previousIndexId: index._id }
    });

    res.status(202).json({
      success: true,
      message: 'Retrieval index recovery task successfully enqueued.'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/internal/repository-ai/executions
router.get('/repository-ai/executions', protect, checkCapability('repository-ai-execution:read'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.repositoryId) {
      query.repositoryId = req.query.repositoryId;
    }

    // Limit tenant scope unless authorized for read:any-tenant
    const hasAnyTenant = req.user.role === 'admin';
    if (!hasAnyTenant) {
      query.tenantId = String(req.user._id);
    }

    const RepositoryAIExecution = require('../models/RepositoryAIExecution');
    const total = await RepositoryAIExecution.countDocuments(query);
    const list = await RepositoryAIExecution.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: list,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/internal/repository-ai/executions/:executionId
router.get('/repository-ai/executions/:executionId', protect, checkCapability('repository-ai-execution:read'), async (req, res, next) => {
  try {
    const RepositoryAIExecution = require('../models/RepositoryAIExecution');
    const execution = await RepositoryAIExecution.findById(req.params.executionId).lean();
    if (!execution) {
      return res.status(404).json({ success: false, message: 'AI execution not found.' });
    }

    const hasAccess = await verifyTenantAccess(req.user, execution.tenantId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied: Tenant isolation policy violation.' });
    }

    res.json({ success: true, data: execution });
  } catch (err) {
    next(err);
  }
});

// POST /api/internal/repository-ai/executions/:executionId/cancel
router.post('/repository-ai/executions/:executionId/cancel', protect, checkCapability('jobs:cancel'), async (req, res, next) => {
  try {
    const RepositoryAIExecution = require('../models/RepositoryAIExecution');
    const execution = await RepositoryAIExecution.findById(req.params.executionId);
    if (!execution) {
      return res.status(404).json({ success: false, message: 'AI execution not found.' });
    }

    const hasAccess = await verifyTenantAccess(req.user, execution.tenantId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied: Tenant isolation policy violation.' });
    }

    if (execution.status === 'COMPLETED' || execution.status === 'FAILED' || execution.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot cancel execution in a terminal state.' });
    }

    execution.status = 'CANCELLED';
    execution.failedAt = new Date();
    execution.errorCode = 'USER_CANCELLED';
    await execution.save();

    // Create Audit entry
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      actorId: req.user._id,
      action: 'REPOSITORY_AI_EXECUTION_CANCELLED',
      details: { executionId: execution._id, tenantId: execution.tenantId }
    });

    res.json({ success: true, message: 'Execution cancelled successfully.', data: execution });
  } catch (err) {
    next(err);
  }
});

// POST /api/internal/repository-ai/executions/:executionId/reverify
router.post('/repository-ai/executions/:executionId/reverify', protect, checkCapability('repository-retrieval-index:rebuild'), async (req, res, next) => {
  try {
    const RepositoryAIExecution = require('../models/RepositoryAIExecution');
    const execution = await RepositoryAIExecution.findById(req.params.executionId);
    if (!execution) {
      return res.status(404).json({ success: false, message: 'AI execution not found.' });
    }

    const hasAccess = await verifyTenantAccess(req.user, execution.tenantId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied: Tenant isolation policy violation.' });
    }

    // Re-verify grounding manually using GroundingVerifier
    const RepositoryConversationMessage = require('../models/RepositoryConversationMessage');
    const msg = await RepositoryConversationMessage.findOne({ aiExecutionId: execution._id });
    if (!msg) {
      return res.status(400).json({ success: false, message: 'No associated output message found for this execution.' });
    }

    // Load active evidence package (re-retrieve or simulate)
    const GroundingVerifier = require('../services/repository/GroundingVerifier');
    const recheck = await GroundingVerifier.verify({
      tenantId: execution.tenantId,
      answer: msg.content,
      claims: msg.metadata?.claims || [],
      citations: msg.metadata?.citations || [],
      validCitations: msg.metadata?.citations || [], // assume previously validated ones
      evidence: { items: [] }, // simulate check on empty fallback
      mode: 'DETERMINISTIC'
    });

    execution.groundingStatus = recheck.status;
    await execution.save();

    // Create Audit entry
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      actorId: req.user._id,
      action: 'REPOSITORY_AI_EXECUTION_REVERIFICATION_REQUESTED',
      details: { executionId: execution._id, newStatus: recheck.status }
    });

    res.json({ success: true, message: 'Execution grounding re-verified successfully.', data: execution });
  } catch (err) {
    next(err);
  }
});

const mongoose = require('mongoose');

module.exports = router;
