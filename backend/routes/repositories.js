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

const StructuralQueryService = require('../services/repository/StructuralQueryService');
const StructuralIntelligenceEngine = require('../services/repository/StructuralIntelligenceEngine');
const AuditLog = require('../models/AuditLog');

/**
 * Get file structure for a repository snapshot
 */
router.get(
  '/:id/structure',
  protect,
  checkCapability('repository-structure:read'),
  async (req, res, next) => {
    try {
      const tenantId = String(req.user._id);
      const repo = await Repository.findOne({ _id: req.params.id, tenantId });
      if (!repo) return res.status(404).json({ success: false, message: 'Repository not found.' });

      const snapshotId = req.query.snapshotId || repo.latestIndexedSnapshotId;
      if (!snapshotId) return res.status(400).json({ success: false, message: 'No snapshot available.' });

      const filePath = req.query.filePath;
      if (!filePath) return res.status(400).json({ success: false, message: 'Missing filePath parameter.' });

      const data = await StructuralQueryService.getFileStructure(tenantId, repo._id, snapshotId, filePath);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Search and list symbols in a repository
 */
router.get(
  '/:id/symbols',
  protect,
  checkCapability('repository-symbols:read'),
  async (req, res, next) => {
    try {
      const tenantId = String(req.user._id);
      const repo = await Repository.findOne({ _id: req.params.id, tenantId });
      if (!repo) return res.status(404).json({ success: false, message: 'Repository not found.' });

      const snapshotId = req.query.snapshotId || repo.latestIndexedSnapshotId;
      if (!snapshotId) return res.status(400).json({ success: false, message: 'No snapshot available.' });

      const { name, qualifiedName, symbolKind, filePath, page = 1, limit = 20 } = req.query;
      const filters = { name, qualifiedName, symbolKind, filePath };

      const data = await StructuralQueryService.findSymbols(
        tenantId,
        repo._id,
        snapshotId,
        filters,
        Number(page),
        Number(limit)
      );
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Get detailed symbol information
 */
router.get(
  '/:id/symbols/:symbolId',
  protect,
  checkCapability('repository-symbols:read'),
  async (req, res, next) => {
    try {
      const tenantId = String(req.user._id);
      const repo = await Repository.findOne({ _id: req.params.id, tenantId });
      if (!repo) return res.status(404).json({ success: false, message: 'Repository not found.' });

      const snapshotId = req.query.snapshotId || repo.latestIndexedSnapshotId;
      if (!snapshotId) return res.status(400).json({ success: false, message: 'No snapshot available.' });

      const data = await StructuralQueryService.getSymbol(tenantId, repo._id, snapshotId, req.params.symbolId);
      if (!data) return res.status(404).json({ success: false, message: 'Symbol not found.' });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Get references to a specific symbol
 */
router.get(
  '/:id/symbols/:symbolId/references',
  protect,
  checkCapability('repository-references:read'),
  async (req, res, next) => {
    try {
      const tenantId = String(req.user._id);
      const repo = await Repository.findOne({ _id: req.params.id, tenantId });
      if (!repo) return res.status(404).json({ success: false, message: 'Repository not found.' });

      const snapshotId = req.query.snapshotId || repo.latestIndexedSnapshotId;
      if (!snapshotId) return res.status(400).json({ success: false, message: 'No snapshot available.' });

      const { page = 1, limit = 20 } = req.query;
      const data = await StructuralQueryService.getSymbolReferences(
        tenantId,
        repo._id,
        snapshotId,
        req.params.symbolId,
        Number(page),
        Number(limit)
      );
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Get incoming/outgoing relationships of a specific symbol
 */
router.get(
  '/:id/symbols/:symbolId/relationships',
  protect,
  checkCapability('repository-graph:read'),
  async (req, res, next) => {
    try {
      const tenantId = String(req.user._id);
      const repo = await Repository.findOne({ _id: req.params.id, tenantId });
      if (!repo) return res.status(404).json({ success: false, message: 'Repository not found.' });

      const snapshotId = req.query.snapshotId || repo.latestIndexedSnapshotId;
      if (!snapshotId) return res.status(400).json({ success: false, message: 'No snapshot available.' });

      const { direction = 'BOTH', edgeType, maxDepth = 3 } = req.query;
      const data = await StructuralQueryService.getSymbolRelationships(
        tenantId,
        repo._id,
        snapshotId,
        req.params.symbolId,
        direction,
        edgeType,
        { maxDepth: Number(maxDepth) }
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Get module dependency graph
 */
router.get(
  '/:id/dependencies',
  protect,
  checkCapability('repository-dependencies:read'),
  async (req, res, next) => {
    try {
      const tenantId = String(req.user._id);
      const repo = await Repository.findOne({ _id: req.params.id, tenantId });
      if (!repo) return res.status(404).json({ success: false, message: 'Repository not found.' });

      const snapshotId = req.query.snapshotId || repo.latestIndexedSnapshotId;
      if (!snapshotId) return res.status(400).json({ success: false, message: 'No snapshot available.' });

      const data = await StructuralQueryService.getModuleDependencies(tenantId, repo._id, snapshotId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Get module dependency cycles
 */
router.get(
  '/:id/dependencies/cycles',
  protect,
  checkCapability('repository-dependencies:read'),
  async (req, res, next) => {
    try {
      const tenantId = String(req.user._id);
      const repo = await Repository.findOne({ _id: req.params.id, tenantId });
      if (!repo) return res.status(404).json({ success: false, message: 'Repository not found.' });

      const snapshotId = req.query.snapshotId || repo.latestIndexedSnapshotId;
      if (!snapshotId) return res.status(400).json({ success: false, message: 'No snapshot available.' });

      const data = await StructuralQueryService.getDependencyCycles(tenantId, repo._id, snapshotId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Administrative manual structural index rebuild
 */
router.post(
  '/internal/:id/structural-index/rebuild',
  protect,
  checkCapability('repository-structure:rebuild'),
  async (req, res, next) => {
    try {
      const tenantId = String(req.user._id);
      const repo = await Repository.findOne({ _id: req.params.id, tenantId });
      if (!repo) return res.status(404).json({ success: false, message: 'Repository not found.' });

      const snapshotId = req.body.snapshotId || repo.latestIndexedSnapshotId;
      if (!snapshotId) return res.status(400).json({ success: false, message: 'No snapshot available to rebuild.' });

      // Enqueue structural build task
      await QueueService.enqueue(
        'repository-ingestion',
        'build-structural-index-job',
        {
          repositoryId: repo._id,
          tenantId,
          snapshotId
        },
        {
          tenantId,
          idempotencyKey: `structural_rebuild_${repo._id}_${snapshotId}_${Date.now()}`,
          maxAttempts: 3
        }
      );

      // Audit log entry
      await AuditLog.create({
        actorId: req.user._id,
        action: 'STRUCTURAL_INDEX_REBUILD_REQUESTED',
        details: { repositoryId: repo._id, snapshotId }
      });

      res.status(202).json({
        success: true,
        message: 'Structural index rebuild task successfully enqueued.'
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Search repository chunks
 */
router.post(
  '/:repositoryId/search',
  protect,
  checkCapability('repository-search:execute'),
  async (req, res, next) => {
    try {
      const tenantId = String(req.user._id);
      const { repositoryId } = req.params;
      const { query, snapshotSelector = {}, filters = {}, topK = 10, retrievalMode = 'HYBRID', includeExplanations = true } = req.body;

      const repo = await Repository.findOne({ _id: repositoryId, tenantId });
      if (!repo) {
        return res.status(404).json({ success: false, message: 'Repository not found.' });
      }

      const RepositoryRetrievalService = require('../services/repository/RepositoryRetrievalService');
      const results = await RepositoryRetrievalService.search({
        tenantId,
        repositoryId,
        snapshotSelector,
        queryText: query,
        filters,
        topK,
        retrievalMode,
        includeExplanations
      });

      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Retrieve token-budgeted context package
 */
router.post(
  '/:repositoryId/context',
  protect,
  checkCapability('repository-context:retrieve'),
  async (req, res, next) => {
    try {
      const tenantId = String(req.user._id);
      const { repositoryId } = req.params;
      const { query, snapshotSelector = {}, filters = {}, contextTokenBudget = 2000, retrievalPolicy = {}, includeProvenance = true } = req.body;

      const repo = await Repository.findOne({ _id: repositoryId, tenantId });
      if (!repo) {
        return res.status(404).json({ success: false, message: 'Repository not found.' });
      }

      const RepositoryRetrievalService = require('../services/repository/RepositoryRetrievalService');
      const result = await RepositoryRetrievalService.retrieveContext({
        tenantId,
        repositoryId,
        snapshotSelector,
        queryText: query,
        filters,
        contextTokenBudget,
        retrievalPolicy,
        includeProvenance
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Retrieve similar code snippets
 */
router.post(
  '/:repositoryId/similar-code',
  protect,
  checkCapability('repository-similar-code:execute'),
  async (req, res, next) => {
    try {
      const tenantId = String(req.user._id);
      const { repositoryId } = req.params;
      const { documentId, snapshotSelector = {}, limit = 5 } = req.body;

      const repo = await Repository.findOne({ _id: repositoryId, tenantId });
      if (!repo) {
        return res.status(404).json({ success: false, message: 'Repository not found.' });
      }

      const RepositoryRetrievalService = require('../services/repository/RepositoryRetrievalService');
      const results = await RepositoryRetrievalService.findSimilarCode({
        tenantId,
        repositoryId,
        snapshotSelector,
        documentId,
        limit
      });

      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
