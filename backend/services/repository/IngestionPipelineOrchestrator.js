const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Repository = require('../../models/Repository');
const RepositorySync = require('../../models/RepositorySync');
const RepositorySnapshot = require('../../models/RepositorySnapshot');
const RepositorySnapshotFile = require('../../models/RepositorySnapshotFile');
const RepositoryChangeSet = require('../../models/RepositoryChangeSet');
const RepositoryFileChange = require('../../models/RepositoryFileChange');
const RepositoryProcessingUnit = require('../../models/RepositoryProcessingUnit');
const RepositoryParseResult = require('../../models/RepositoryParseResult');
const GitService = require('./GitService');
const { FileClassifier, Classifications } = require('./FileClassifier');
const { LanguageParserRegistry } = require('./LanguageParser');
const { baseLogger } = require('../medication/observability');

class IngestionPipelineOrchestrator {
  constructor() {
    this.logger = baseLogger.child({ service: 'helio-repository-orchestrator' });
  }

  async runSyncPipeline(syncId, jobContext = {}) {
    const sync = await RepositorySync.findById(syncId);
    if (!sync) {
      throw new Error(`Sync record ${syncId} not found.`);
    }

    const repo = await Repository.findById(sync.repositoryId);
    if (!repo) {
      throw new Error(`Repository record ${sync.repositoryId} not found.`);
    }

    // Load connection
    const RepositoryConnection = require('../../models/RepositoryConnection');
    const connection = await RepositoryConnection.findById(repo.connectionId);
    if (!connection) {
      throw new Error(`Connection ${repo.connectionId} not found.`);
    }

    const startedAt = new Date();
    sync.status = 'RUNNING';
    sync.startedAt = startedAt;
    await sync.save();

    repo.status = 'SYNCING';
    repo.syncStatus = 'PENDING';
    await repo.save();

    let workspacePath = null;

    try {
      // 1. Setup isolated workspace
      workspacePath = GitService.createTempWorkspace(sync.tenantId, repo.name);

      // 2. Clone repository revision safely
      // Use credentialReference URL or path. For tests, support local paths.
      const sourceUrl = connection.credentialReference; 
      const revision = sync.requestedRevision || repo.defaultBranch || 'main';

      await GitService.clone(sourceUrl, workspacePath, revision);

      // Resolve actual commit SHA
      const commitSha = await GitService.getLatestCommit(workspacePath);
      sync.resolvedRevision = commitSha;
      await sync.save();

      // 3. File discovery & manifest building
      const fileList = [];
      this._discoverFilesRecursive(workspacePath, workspacePath, fileList);

      // Limits check
      const maxFiles = Number(process.env.REPOSITORY_MAX_FILE_COUNT) || 1000;
      const maxBytes = Number(process.env.REPOSITORY_MAX_BYTES) || 100 * 1024 * 1024; // 100MB
      
      let totalBytes = 0;
      fileList.forEach(f => totalBytes += f.sizeBytes);

      if (fileList.length > maxFiles) {
        throw new Error(`AI_LIMIT_EXCEEDED: Repository file count ${fileList.length} exceeds limit of ${maxFiles}.`);
      }
      if (totalBytes > maxBytes) {
        throw new Error(`AI_LIMIT_EXCEEDED: Repository size ${(totalBytes / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(maxBytes / 1024 / 1024).toFixed(2)}MB.`);
      }

      // Create Snapshot record
      const snapshotType = repo.latestIndexedSnapshotId ? 'INCREMENTAL' : 'FULL';
      
      const snapshot = await RepositorySnapshot.create({
        tenantId: sync.tenantId,
        repositoryId: repo._id,
        sourceRevision: commitSha,
        sourceRef: revision,
        parentSnapshotId: repo.latestIndexedSnapshotId,
        snapshotType,
        status: 'RUNNING',
        fileCount: fileList.length,
        totalBytes
      });

      // Save files to manifest DB collection
      const filesWithMeta = [];
      let processableBytes = 0;
      let processableCount = 0;

      for (const file of fileList) {
        const isBin = FileClassifier.isBinary(file.absPath);
        const isIgn = FileClassifier.isIgnored(file.relPath);
        const lang = FileClassifier.detectLanguage(file.relPath);
        const classif = FileClassifier.classify(file.relPath, isBin, isIgn);

        let contentHash = 'none';
        if (!isBin && !isIgn) {
          contentHash = this._calculateFileHash(file.absPath);
          processableBytes += file.sizeBytes;
          processableCount++;
        }

        const snapshotFile = await RepositorySnapshotFile.create({
          tenantId: sync.tenantId,
          repositoryId: repo._id,
          snapshotId: snapshot._id,
          path: file.relPath,
          contentHash,
          sizeBytes: file.sizeBytes,
          fileType: 'file',
          language: lang,
          binary: isBin,
          ignored: isIgn,
          generated: isIgn // default generated mapping
        });

        filesWithMeta.push(snapshotFile);
      }

      // Update snapshot stats
      snapshot.processableFileCount = processableCount;
      snapshot.processableBytes = processableBytes;
      snapshot.manifestHash = crypto.createHash('sha256').update(JSON.stringify(fileList.map(f => f.relPath))).digest('hex');
      await snapshot.save();

      sync.targetSnapshotId = snapshot._id;
      sync.baseSnapshotId = repo.latestIndexedSnapshotId;
      await sync.save();

      // 4. Compute Incremental changeset
      let added = [];
      let modified = [];
      let deleted = [];
      let renamed = [];

      if (snapshotType === 'INCREMENTAL') {
        const baseFiles = await RepositorySnapshotFile.find({ snapshotId: repo.latestIndexedSnapshotId }).lean();
        const baseMap = new Map(baseFiles.map(bf => [bf.path, bf]));

        const targetFilesMap = new Map(filesWithMeta.map(tf => [tf.path, tf]));

        // Detect added & modified
        for (const tf of filesWithMeta) {
          const bf = baseMap.get(tf.path);
          if (!bf) {
            added.push(tf);
          } else if (bf.contentHash !== tf.contentHash) {
            modified.push(tf);
          }
        }

        // Detect deleted
        for (const bf of baseFiles) {
          if (!targetFilesMap.has(bf.path)) {
            deleted.push(bf);
          }
        }

        // Simple Rename heuristic (match deleted & added files by contentHash)
        const deletedMapByHash = new Map(deleted.map(d => [d.contentHash, d]));
        const stillAdded = [];

        for (const a of added) {
          const matchedDeleted = deletedMapByHash.get(a.contentHash);
          if (matchedDeleted && a.contentHash !== 'none') {
            renamed.push({
              oldPath: matchedDeleted.path,
              newPath: a.path,
              contentHash: a.contentHash,
              sizeBytes: a.sizeBytes
            });
            // remove from deleted list
            deleted = deleted.filter(d => d.path !== matchedDeleted.path);
            deletedMapByHash.delete(a.contentHash);
          } else {
            stillAdded.push(a);
          }
        }
        added = stillAdded;
      } else {
        // FULL sync: everything is added
        added = filesWithMeta.filter(f => !f.ignored && !f.binary);
      }

      // Save ChangeSet records
      const changeSet = await RepositoryChangeSet.create({
        tenantId: sync.tenantId,
        repositoryId: repo._id,
        baseSnapshotId: repo.latestIndexedSnapshotId,
        targetSnapshotId: snapshot._id,
        addedCount: added.length,
        modifiedCount: modified.length,
        deletedCount: deleted.length,
        renamedCount: renamed.length
      });

      for (const a of added) {
        await RepositoryFileChange.create({
          changeSetId: changeSet._id,
          changeType: 'ADDED',
          newPath: a.path,
          newContentHash: a.contentHash,
          sizeDelta: a.sizeBytes
        });
      }
      for (const m of modified) {
        await RepositoryFileChange.create({
          changeSetId: changeSet._id,
          changeType: 'MODIFIED',
          newPath: m.path,
          oldPath: m.path,
          newContentHash: m.contentHash,
          sizeDelta: m.sizeBytes
        });
      }
      for (const d of deleted) {
        await RepositoryFileChange.create({
          changeSetId: changeSet._id,
          changeType: 'DELETED',
          oldPath: d.path,
          oldContentHash: d.contentHash,
          sizeDelta: -d.sizeBytes
        });
      }
      for (const r of renamed) {
        await RepositoryFileChange.create({
          changeSetId: changeSet._id,
          changeType: 'RENAMED',
          oldPath: r.oldPath,
          newPath: r.newPath,
          newContentHash: r.contentHash,
          oldContentHash: r.contentHash
        });
      }

      // 5. Generate processing units for files
      const units = [];
      
      // Parse added & modified files
      for (const a of added) {
        units.push({ path: a.path, hash: a.contentHash, type: 'FILE_PARSE' });
      }
      for (const m of modified) {
        units.push({ path: m.path, hash: m.contentHash, type: 'FILE_PARSE' });
      }
      for (const r of renamed) {
        // Rename reuses parsing result, but we add a small unit to register the rename mapping
        units.push({ path: r.newPath, hash: r.contentHash, type: 'FILE_PARSE' });
      }
      for (const d of deleted) {
        units.push({ path: d.path, hash: d.oldContentHash, type: 'FILE_DELETE' });
      }

      // Create Mongoose processing units
      for (const u of units) {
        await RepositoryProcessingUnit.create({
          tenantId: sync.tenantId,
          repositoryId: repo._id,
          syncId: sync._id,
          snapshotId: snapshot._id,
          path: u.path,
          contentHash: u.hash,
          unitType: u.type,
          status: 'PENDING'
        });
      }

      // Execute file units synchronously or dispatch (we will process sequentially within worker loop to keep logic robust)
      repo.status = 'PROCESSING';
      await repo.save();

      const pendingUnits = await RepositoryProcessingUnit.find({ syncId: sync._id, status: 'PENDING' });
      
      for (const unit of pendingUnits) {
        unit.status = 'RUNNING';
        unit.startedAt = new Date();
        await unit.save();

        try {
          if (unit.unitType === 'FILE_PARSE') {
            // Check Parse Result Cache reuse (content-addressable lookup)
            const resolvedParser = LanguageParserRegistry.resolveParser(FileClassifier.detectLanguage(unit.path));
            
            const reusableResult = await RepositoryParseResult.findOne({
              contentHash: unit.contentHash,
              parserId: resolvedParser.parserId,
              parserVersion: resolvedParser.parserVersion
            });

            if (reusableResult) {
              // Copy parse result (reuse)
              await RepositoryParseResult.create({
                tenantId: sync.tenantId,
                repositoryId: repo._id,
                snapshotId: snapshot._id,
                path: unit.path,
                contentHash: unit.contentHash,
                language: reusableResult.language,
                parserId: reusableResult.parserId,
                parserVersion: reusableResult.parserVersion,
                status: 'SUCCESS',
                diagnosticCount: reusableResult.diagnosticCount,
                artifactReference: reusableResult.artifactReference,
                startedAt: new Date(),
                completedAt: new Date()
              });
              this.logger.info('repository.parse.reused', `Reused parse result for ${unit.path}`);
            } else {
              // Parse actual file
              const fileAbsPath = path.join(workspacePath, unit.path);
              
              // Validate safety before reading
              if (!FileClassifier.isSafePath(unit.path)) {
                throw new Error('Path traversal attempt rejected.');
              }

              const content = fs.readFileSync(fileAbsPath, 'utf8');
              const parseOutcome = await resolvedParser.parse(fileAbsPath, content);

              await RepositoryParseResult.create({
                tenantId: sync.tenantId,
                repositoryId: repo._id,
                snapshotId: snapshot._id,
                path: unit.path,
                contentHash: unit.contentHash,
                language: parseOutcome.language,
                parserId: parseOutcome.parserId,
                parserVersion: parseOutcome.parserVersion,
                status: parseOutcome.status,
                diagnosticCount: parseOutcome.diagnostics.length,
                artifactReference: parseOutcome.extractedMetadata,
                startedAt: unit.startedAt,
                completedAt: new Date()
              });
            }
          } else if (unit.unitType === 'FILE_DELETE') {
            // Log file deletion (index finalizer handles tombstones)
            this.logger.info('repository.file.deleted', `Removed file index metadata for ${unit.path}`);
          }

          unit.status = 'SUCCEEDED';
          unit.completedAt = new Date();
          await unit.save();
        } catch (unitErr) {
          unit.status = 'FAILED';
          unit.failedAt = new Date();
          unit.errorCode = unitErr.message;
          await unit.save();
          this.logger.error('repository.unit.failed', `Failed parsing unit ${unit.path}: ${unitErr.message}`);
        }
      }

      // Finalize sync lifecycle
      snapshot.status = 'SUCCEEDED';
      snapshot.completedAt = new Date();
      await snapshot.save();

      // Trigger structural indexing
      const StructuralIntelligenceEngine = require('./StructuralIntelligenceEngine');
      try {
        await StructuralIntelligenceEngine.buildIndex(sync.tenantId, repo._id, snapshot._id, workspacePath);
      } catch (structErr) {
        this.logger.error('repository.structure.failed', `Structural indexing failed: ${structErr.message}`);
      }

      repo.status = 'READY';
      repo.syncStatus = 'SUCCESS';
      repo.indexStatus = 'SUCCESS';
      repo.latestSnapshotId = snapshot._id;
      repo.latestIndexedSnapshotId = snapshot._id;
      repo.lastSyncCompletedAt = new Date();
      repo.lastIndexCompletedAt = new Date();
      await repo.save();

      sync.status = 'SUCCEEDED';
      sync.completedAt = new Date();
      await sync.save();

      this.logger.info('repository.sync.succeeded', `Sync completed successfully for repository: ${repo.fullName}`);
    } catch (err) {
      // Revert status on failure
      const failDate = new Date();
      sync.status = 'FAILED';
      sync.failedAt = failDate;
      sync.errorCode = err.name || 'AI_INGESTION_ERROR';
      await sync.save();

      repo.status = 'DEGRADED';
      repo.syncStatus = 'FAILED';
      repo.indexStatus = 'FAILED';
      repo.lastErrorCode = err.name || 'AI_INGESTION_ERROR';
      repo.lastErrorStage = 'INGESTION_PIPELINE';
      await repo.save();

      this.logger.error('repository.sync.failed', `Sync pipeline execution error: ${err.message}`, {
        syncId,
        error: err.message
      });
      throw err;
    } finally {
      // 6. Safeguard workspace cleanup
      if (workspacePath) {
        await GitService.cleanupWorkspace(workspacePath);
      }
    }
  }

  _discoverFilesRecursive(baseDir, currentDir, fileList) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    const maxDepth = Number(process.env.REPOSITORY_MAX_DIRECTORY_DEPTH) || 16;
    
    for (const item of items) {
      const absPath = path.join(currentDir, item.name);
      const relPath = path.relative(baseDir, absPath);

      // Verify directory depth limit
      const depth = relPath.split(path.sep).length;
      if (depth > maxDepth) continue;

      if (item.isDirectory()) {
        if (FileClassifier.isIgnored(relPath)) continue;
        this._discoverFilesRecursive(baseDir, absPath, fileList);
      } else if (item.isFile()) {
        const stats = fs.statSync(absPath);
        fileList.push({
          relPath: relPath.replace(/\\/g, '/'), // canonical forward slash separator
          absPath,
          sizeBytes: stats.size
        });
      }
    }
  }

  _calculateFileHash(filePath) {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}

module.exports = new IngestionPipelineOrchestrator();
