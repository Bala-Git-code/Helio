const express = require('express');
const router = express.Router();
const AiExecution = require('../models/AiExecution');
const { protect } = require('../middleware/auth');
const { checkCapability } = require('../middleware/authorization');
const { ModelRegistry } = require('../services/ai/ModelRegistry');

// Helper to check tenant access for administrative safety
async function verifyTenantAccess(user, tenantId) {
  if (!tenantId) return true;
  if (user.role === 'admin') return true;
  if (String(user._id) === String(tenantId)) return true;
  return false;
}

// Redact prompt outputs and parameters for safety
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

/**
 * List all executions (with pagination, bounded date ranges)
 */
router.get(
  '/executions',
  protect,
  checkCapability('ai:executions:read'),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const skip = (page - 1) * limit;

      const query = {};
      
      // Tenant-isolation boundary
      if (req.user.role !== 'admin') {
        query.tenantId = String(req.user._id);
      } else if (req.query.tenantId) {
        query.tenantId = req.query.tenantId;
      }

      if (req.query.taskType) {
        query.taskType = req.query.taskType;
      }

      // Default date bounds to prevent unbounded db lookups
      const start = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = req.query.endDate ? new Date(req.query.endDate) : new Date();
      query.createdAt = { $gte: start, $lte: end };

      const total = await AiExecution.countDocuments(query);
      const list = await AiExecution.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      res.json({
        success: true,
        data: redactSensitiveData(list),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Get individual execution details
 */
router.get(
  '/executions/:id',
  protect,
  checkCapability('ai:executions:read'),
  async (req, res, next) => {
    try {
      const execution = await AiExecution.findById(req.params.id).lean();
      if (!execution) {
        return res.status(404).json({ success: false, message: 'Execution record not found.' });
      }

      const hasAccess = await verifyTenantAccess(req.user, execution.tenantId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access to this execution is denied.' });
      }

      res.json({
        success: true,
        data: redactSensitiveData(execution)
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Get usage aggregates and billing metrics
 */
router.get(
  '/usage',
  protect,
  checkCapability('ai:usage:read'),
  async (req, res, next) => {
    try {
      const query = {};
      if (req.user.role !== 'admin') {
        query.tenantId = String(req.user._id);
      } else if (req.query.tenantId) {
        query.tenantId = req.query.tenantId;
      }

      const start = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = req.query.endDate ? new Date(req.query.endDate) : new Date();
      query.createdAt = { $gte: start, $lte: end };

      const executions = await AiExecution.find(query).lean();

      let totalTokens = 0;
      let totalCost = 0;
      let successCount = 0;
      let failureCount = 0;
      let cacheHits = 0;

      for (const e of executions) {
        if (e.status === 'SUCCEEDED') {
          successCount++;
          totalTokens += e.totalTokens || 0;
          totalCost += e.actualCost || 0;
          if (e.cacheHit) cacheHits++;
        } else if (e.status === 'FAILED') {
          failureCount++;
        }
      }

      res.json({
        success: true,
        summary: {
          totalRequests: executions.length,
          successCount,
          failureCount,
          totalTokens,
          totalCost,
          cacheHits,
          cacheHitRate: executions.length > 0 ? (cacheHits / executions.length) * 100 : 0
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * List models inside the registry
 */
router.get(
  '/models',
  protect,
  checkCapability('ai:models:read'),
  (req, res) => {
    res.json({
      success: true,
      data: ModelRegistry.listModels()
    });
  }
);

module.exports = router;
