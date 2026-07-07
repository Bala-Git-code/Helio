const express = require('express');
const router = express.Router();
const Repository = require('../models/Repository');
const RepositoryConnection = require('../models/RepositoryConnection');
const RepositorySync = require('../models/RepositorySync');
const RepositorySnapshot = require('../models/RepositorySnapshot');
const QueueService = require('../services/medication/QueueService');
const { protect } = require('../middleware/auth');
const { checkCapability } = require('../middleware/authorization');
const GitHubProviderAdapter = require('../services/repository/GitHubProviderAdapter');
const { generateTraceId } = require('../services/medication/observability');

const adapters = {
  github: new GitHubProviderAdapter()
};

/**
 * Register a new repository
 */
router.post(
  '/',
  protect,
  checkCapability('ai:execute'), // generic execution permission reuse or repos capabilities
  async (req, res, next) => {
    const { providerId, owner, name, credentialReference } = req.body;
    
    if (!providerId || !owner || !name || !credentialReference) {
      return res.status(400).json({ success: false, message: 'Missing required parameters.' });
    }

    const tenantId = String(req.user._id);

    try {
      // 1. Uniqueness check
      const duplicate = await Repository.findOne({ tenantId, providerId, name });
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'Repository already registered under this tenant.' });
      }

      // 2. Validate connection on provider adapter
      const adapter = adapters[providerId];
      if (!adapter) {
        return res.status(400).json({ success: false, message: `Unsupported provider: ${providerId}` });
      }

      const connection = await RepositoryConnection.create({
        tenantId,
        providerId,
        installationId: `inst_${Date.now()}`,
        credentialReference
      });

      const repoDetail = await adapter.getRepository(connection, owner, name);

      const repo = await Repository.create({
        tenantId,
        connectionId: connection._id,
        providerId,
        sourceRepositoryId: repoDetail.sourceRepositoryId,
        owner,
        name,
        fullName: repoDetail.fullName,
        visibility: repoDetail.visibility,
        defaultBranch: repoDetail.defaultBranch,
        webUrl: repoDetail.webUrl,
        status: 'REGISTERING',
        syncStatus: 'PENDING',
        indexStatus: 'PENDING',
        createdBy: tenantId
      });

      // 3. Create initial sync request
      const syncId = new req.body.syncId ? req.body.syncId : null; // support test override
      const correlationId = generateTraceId();

      const sync = await RepositorySync.create({
        tenantId,
        repositoryId: repo._id,
        triggerType: 'INITIAL',
        requestedRevision: repo.defaultBranch,
        status: 'QUEUED',
        requestedBy: tenantId,
        correlationId,
        traceId: correlationId
      });

      // 4. Enqueue in persistent background worker
      await QueueService.enqueue(
        'repository-ingestion',
        'sync-repository-job',
        { syncId: sync._id },
        {
          tenantId,
          correlationId,
          idempotencyKey: `sync_init_${repo._id}`,
          maxAttempts: 3
        }
      );

      res.status(202).json({
        success: true,
        message: 'Repository registration accepted. Initial synchronization queued.',
        repositoryId: repo._id,
        syncId: sync._id
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * List registered repositories (tenant-scoped)
 */
router.get(
  '/',
  protect,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const skip = (page - 1) * limit;

      const query = { tenantId: String(req.user._id) };

      const total = await Repository.countDocuments(query);
      const list = await Repository.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: list,
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
 * Get details & status projection of a repository
 */
router.get(
  '/:id',
  protect,
  async (req, res, next) => {
    try {
      const repo = await Repository.findOne({ _id: req.params.id, tenantId: String(req.user._id) });
      if (!repo) {
        return res.status(404).json({ success: false, message: 'Repository not found.' });
      }

      res.json({
        success: true,
        data: repo
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Trigger manual sync
 */
router.post(
  '/:id/sync',
  protect,
  async (req, res, next) => {
    const tenantId = String(req.user._id);

    try {
      const repo = await Repository.findOne({ _id: req.params.id, tenantId });
      if (!repo) {
        return res.status(404).json({ success: false, message: 'Repository not found.' });
      }

      if (['SYNCING', 'PROCESSING'].includes(repo.status)) {
        return res.status(409).json({ success: false, message: 'A synchronization is currently active.' });
      }

      const revision = req.body.revision || repo.defaultBranch || 'main';
      const correlationId = generateTraceId();

      const sync = await RepositorySync.create({
        tenantId,
        repositoryId: repo._id,
        triggerType: 'MANUAL',
        requestedRevision: revision,
        status: 'QUEUED',
        requestedBy: tenantId,
        correlationId,
        traceId: correlationId
      });

      await QueueService.enqueue(
        'repository-ingestion',
        'sync-repository-job',
        { syncId: sync._id },
        {
          tenantId,
          correlationId,
          idempotencyKey: `sync_manual_${repo._id}_${Date.now()}`,
          maxAttempts: 3
        }
      );

      res.status(202).json({
        success: true,
        message: 'Manual sync triggered and queued.',
        syncId: sync._id
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Get sync logs history
 */
router.get(
  '/:id/syncs',
  protect,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const skip = (page - 1) * limit;

      const query = { repositoryId: req.params.id, tenantId: String(req.user._id) };

      const total = await RepositorySync.countDocuments(query);
      const list = await RepositorySync.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: list,
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
 * Get snapshots history
 */
router.get(
  '/:id/snapshots',
  protect,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const skip = (page - 1) * limit;

      const query = { repositoryId: req.params.id, tenantId: String(req.user._id) };

      const total = await RepositorySnapshot.countDocuments(query);
      const list = await RepositorySnapshot.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: list,
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

module.exports = router;
