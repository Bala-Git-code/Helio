const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Models
const Repository = require('../../models/Repository');
const RepositorySnapshot = require('../../models/RepositorySnapshot');
const RepositorySnapshotFile = require('../../models/RepositorySnapshotFile');
const RepositoryChangeSet = require('../../models/RepositoryChangeSet');
const RepositoryFileChange = require('../../models/RepositoryFileChange');
const RepositoryStructuralIndex = require('../../models/RepositoryStructuralIndex');
const CodeSegment = require('../../models/CodeSegment');
const CodeSymbol = require('../../models/CodeSymbol');

const RepositoryRetrievalIndex = require('../../models/RepositoryRetrievalIndex');
const RetrievalIndexPlan = require('../../models/RetrievalIndexPlan');
const RepositoryRetrievalDocument = require('../../models/RepositoryRetrievalDocument');
const RepositoryVectorRecord = require('../../models/RepositoryVectorRecord');

// Infrastructure / Services
const GitService = require('./GitService');
const VectorIndexStore = require('./VectorIndexStore');
const LexicalIndexStore = require('./LexicalIndexStore');
const AiExecutionEngine = require('../ai/AiExecutionEngine');
const { ModelRegistry } = require('../ai/ModelRegistry');
const { baseLogger, generateTraceId } = require('../medication/observability');

class RetrievalIndexOrchestrator {
  constructor() {
    this.logger = baseLogger.child({ service: 'helio-retrieval-orchestrator' });
  }

  async buildIndex(tenantId, repositoryId, snapshotId, optionalWorkspacePath = null) {
    const startedAt = new Date();
    const correlationId = generateTraceId();

    this.logger.info('retrieval.index.started', 'Starting retrieval index building flow.', {
      tenantId,
      repositoryId,
      snapshotId
    });

    // 1. Resolve structural index and eligibility
    const structIndex = await RepositoryStructuralIndex.findOne({ tenantId, repositoryId, snapshotId });
    if (!structIndex || structIndex.status !== 'READY') {
      throw new Error(`AI_INVALID_REQUEST: Eligible READY structural index not found for snapshot: ${snapshotId}`);
    }

    const repo = await Repository.findById(repositoryId);
    if (!repo) throw new Error(`Repository not found: ${repositoryId}`);

    // Resolve embedding model & details
    const modelId = process.env.RETRIEVAL_EMBEDDING_MODEL || 'text-embedding-004';
    const model = ModelRegistry.getModel(modelId);
    if (!model) throw new Error(`Embedding model not registered: ${modelId}`);

    // Create Retrieval Index record
    let retrievalIndex = await RepositoryRetrievalIndex.findOne({ tenantId, repositoryId, snapshotId });
    if (!retrievalIndex) {
      retrievalIndex = await RepositoryRetrievalIndex.create({
        tenantId,
        repositoryId,
        snapshotId,
        structuralIndexId: structIndex._id,
        status: 'PENDING',
        embeddingProviderId: model.providerId,
        embeddingModelId: modelId,
        embeddingDimensions: model.dimensions,
        pipelineVersions: {
          enrichmentVersion: '1.0.0',
          documentVersion: '1.0.0',
          embeddingPolicyVersion: '1.0.0',
          vectorSchemaVersion: '1.0.0',
          lexicalIndexVersion: '1.0.0',
          retrievalIndexVersion: '1.0.0'
        }
      });
    }

    retrievalIndex.status = 'PLANNING';
    retrievalIndex.startedAt = startedAt;
    await retrievalIndex.save();

    let workspacePath = optionalWorkspacePath;
    let cleanWorkspace = false;

    try {
      if (!workspacePath) {
        const snapshot = await RepositorySnapshot.findById(snapshotId);
        if (!snapshot) throw new Error(`Snapshot not found: ${snapshotId}`);
        const connection = await mongoose.model('RepositoryConnection').findById(repo.connectionId);
        workspacePath = GitService.createTempWorkspace(tenantId, repo.name);
        await GitService.clone(connection.credentialReference, workspacePath, snapshot.sourceRevision);
        cleanWorkspace = true;
      }

      // 2. INCREMENTAL PLANNING
      let baseRetrievalIndexId = repo.latestRetrievalIndexId;
      let baseRetrievalIndex = null;
      if (baseRetrievalIndexId) {
        baseRetrievalIndex = await RepositoryRetrievalIndex.findById(baseRetrievalIndexId);
      }

      // Self-reference safety
      if (baseRetrievalIndex && String(baseRetrievalIndex.snapshotId) === String(snapshotId)) {
        baseRetrievalIndex = null;
        baseRetrievalIndexId = null;
      }

      let processingMode = baseRetrievalIndex ? 'INCREMENTAL' : 'FULL';
      let added = [];
      let modified = [];
      let deleted = [];
      let renamed = [];

      if (baseRetrievalIndex) {
        const changeSet = await RepositoryChangeSet.findOne({ targetSnapshotId: snapshotId }).lean();
        if (changeSet) {
          const fileChanges = await RepositoryFileChange.find({ changeSetId: changeSet._id }).lean();
          fileChanges.forEach(fc => {
            if (fc.changeType === 'ADDED') added.push(fc.newPath);
            else if (fc.changeType === 'MODIFIED') modified.push(fc.newPath);
            else if (fc.changeType === 'DELETED') deleted.push(fc.oldPath);
            else if (fc.changeType === 'RENAMED') renamed.push({ oldPath: fc.oldPath, newPath: fc.newPath });
          });
        }
      } else {
        const files = await RepositorySnapshotFile.find({ snapshotId, ignored: false, binary: false }).lean();
        added = files.map(f => f.path);
      }

      const newDocumentsPaths = [...added, ...modified, ...renamed.map(r => r.newPath)];
      const deletedDocumentsPaths = [...deleted, ...renamed.map(r => r.oldPath)];

      // Reusable documents from base index
      let reusableDocumentsPaths = [];
      if (baseRetrievalIndex) {
        const allBasePaths = await RepositoryRetrievalDocument.find({ retrievalIndexId: baseRetrievalIndexId }).distinct('filePath');
        reusableDocumentsPaths = allBasePaths.filter(p => !newDocumentsPaths.includes(p) && !deletedDocumentsPaths.includes(p));
      }

      // Persist plan
      const plan = await RetrievalIndexPlan.create({
        tenantId,
        repositoryId,
        snapshotId,
        structuralIndexId: structIndex._id,
        retrievalIndexId: retrievalIndex._id,
        baseRetrievalIndexId: baseRetrievalIndexId || null,
        processingMode,
        newDocuments: newDocumentsPaths,
        changedDocuments: modified,
        deletedDocuments: deletedDocumentsPaths,
        reusableDocuments: reusableDocumentsPaths,
        reason: `Retrieval index plan for revision ${snapshotId}`,
        pipelineVersions: retrievalIndex.pipelineVersions
      });

      retrievalIndex.processingMode = processingMode;
      retrievalIndex.baseRetrievalIndexId = baseRetrievalIndexId || null;
      await retrievalIndex.save();

      this.logger.info('retrieval.plan.created', `Plan created: ${processingMode} mode.`, {
        planId: plan._id,
        newCount: newDocumentsPaths.length,
        deletedCount: deletedDocumentsPaths.length,
        reusedCount: reusableDocumentsPaths.length
      });

      // 3. SEMANTIC ENRICHMENT & RETRIEVAL DOCUMENT CONSTRUCTION
      retrievalIndex.status = 'ENRICHING';
      await retrievalIndex.save();

      const documentsToSave = [];
      
      for (const filePath of newDocumentsPaths) {
        // Eligibility
        const snapFile = await RepositorySnapshotFile.findOne({ snapshotId, path: filePath });
        if (!snapFile || snapFile.ignored || snapFile.binary || snapFile.generated) {
          continue; // skip ineligible files
        }

        // Fetch segments
        const segments = await CodeSegment.find({ tenantId, repositoryId, snapshotId, filePath }).lean();
        const fileContent = fs.readFileSync(path.join(workspacePath, filePath), 'utf8');

        if (segments.length === 0) {
          // Fallback: Index the whole file as a single default chunk/segment
          const chunkText = fileContent;
          const logicalDocumentId = this._buildLogicalId(repositoryId, filePath, 'file', 'FILE');
          const docData = this._enrichDocument({
            tenantId,
            repositoryId,
            snapshotId,
            structuralIndexId: structIndex._id,
            retrievalIndexId: retrievalIndex._id,
            logicalDocumentId,
            filePath,
            language: snapFile.language,
            fileClassification: 'SOURCE_CODE',
            segmentType: 'FILE',
            title: path.basename(filePath),
            content: chunkText,
            contentReference: { startLine: 1, endLine: fileContent.split('\n').length || 1 }
          });
          documentsToSave.push(...docData);
        } else {
          for (const seg of segments) {
            let chunkText = '';
            if (seg.startByte !== undefined && seg.endByte !== undefined) {
              chunkText = fileContent.substring(seg.startByte, seg.endByte);
            } else {
              const lines = fileContent.split('\n');
              chunkText = lines.slice(seg.startLine - 1, seg.endLine).join('\n');
            }

            const symbols = await CodeSymbol.find({ tenantId, repositoryId, snapshotId, filePath, declarationSegmentId: seg._id }).lean();
            const qualifiedName = symbols.length > 0 ? symbols[0].qualifiedName : seg.qualifiedName;

            const logicalDocumentId = this._buildLogicalId(repositoryId, filePath, seg._id, seg.segmentType);
            const docData = this._enrichDocument({
              tenantId,
              repositoryId,
              snapshotId,
              structuralIndexId: structIndex._id,
              retrievalIndexId: retrievalIndex._id,
              logicalDocumentId,
              segmentId: seg._id,
              symbolId: symbols.length > 0 ? symbols[0]._id : null,
              filePath,
              language: snapFile.language,
              fileClassification: 'SOURCE_CODE',
              segmentType: seg.segmentType,
              title: seg.name || path.basename(filePath),
              qualifiedName,
              content: chunkText,
              contentReference: { startLine: seg.startLine, endLine: seg.endLine, startByte: seg.startByte, endByte: seg.endByte }
            });
            documentsToSave.push(...docData);
          }
        }
      }

      // Copy-on-write reusable documents from base index
      if (baseRetrievalIndexId && reusableDocumentsPaths.length > 0) {
        const reusableDocs = await RepositoryRetrievalDocument.find({
          retrievalIndexId: baseRetrievalIndexId,
          filePath: { $in: reusableDocumentsPaths }
        }).lean();

        this.logger.info('retrieval.document.reused', `Copying ${reusableDocs.length} reusable documents.`);
        
        for (const rDoc of reusableDocs) {
          // Clone with new snapshot and retrieval index association
          const clonedDoc = {
            ...rDoc,
            _id: new mongoose.Types.ObjectId(),
            snapshotId,
            retrievalIndexId: retrievalIndex._id,
            structuralIndexId: structIndex._id,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          documentsToSave.push(clonedDoc);
        }
      }

      // Save documents to database
      await RepositoryRetrievalDocument.insertMany(documentsToSave);

      // 4. EMBEDDING POLICY RESOLUTION & GENERATION
      retrievalIndex.status = 'EMBEDDING';
      await retrievalIndex.save();

      // Find documents requiring embeddings (new or modified documents that are not copies)
      const docsNeedingEmbed = documentsToSave.filter(d => !d.createdAt || String(d.snapshotId) === String(snapshotId));
      
      const vectorsToUpsert = [];
      const batchDocs = [];

      for (const doc of docsNeedingEmbed) {
        // Embedding reuse lookup (tenant isolated, same input hash & model properties)
        const existingVector = await RepositoryVectorRecord.findOne({
          tenantId,
          embeddingInputHash: doc.embeddingInputHash,
          modelId
        }).lean();

        if (existingVector) {
          // Reuse vector record
          vectorsToUpsert.push({
            tenantId,
            repositoryId,
            snapshotId,
            retrievalIndexId: retrievalIndex._id,
            documentId: doc._id,
            logicalDocumentId: doc.logicalDocumentId,
            providerId: model.providerId,
            modelId,
            dimensions: model.dimensions,
            embeddingInputHash: doc.embeddingInputHash,
            vector: existingVector.vector,
            metadata: {
              filePath: doc.filePath,
              language: doc.language,
              segmentType: doc.segmentType
            }
          });
          retrievalIndex.reusedEmbeddingCount++;
        } else {
          // Add to pending batch embedding list
          batchDocs.push(doc);
        }
      }

      // Generate in batches
      const maxBatchSize = model.maximumBatchSize || 100;
      for (let i = 0; i < batchDocs.length; i += maxBatchSize) {
        const currentBatch = batchDocs.slice(i, i + maxBatchSize);
        const texts = currentBatch.map(d => d.content); // Use raw contents or built embedding input
        
        // Execute batch embedding via execution platform
        const responses = await AiExecutionEngine.embedBatch({
          tenantId,
          texts,
          modelId,
          correlationId
        });

        responses.forEach((res, indexInBatch) => {
          const doc = currentBatch[indexInBatch];
          vectorsToUpsert.push({
            tenantId,
            repositoryId,
            snapshotId,
            retrievalIndexId: retrievalIndex._id,
            documentId: doc._id,
            logicalDocumentId: doc.logicalDocumentId,
            providerId: model.providerId,
            modelId,
            dimensions: model.dimensions,
            embeddingInputHash: doc.embeddingInputHash,
            vector: res.vector,
            metadata: {
              filePath: doc.filePath,
              language: doc.language,
              segmentType: doc.segmentType
            }
          });
          retrievalIndex.embeddedDocumentCount++;
        });
      }

      // Copy-on-write reusable vectors
      if (baseRetrievalIndexId && reusableDocumentsPaths.length > 0) {
        const reusableVectors = await RepositoryVectorRecord.find({
          retrievalIndexId: baseRetrievalIndexId,
          'metadata.filePath': { $in: reusableDocumentsPaths }
        }).lean();

        for (const rVec of reusableVectors) {
          // Find matching document copy we created above
          const mappedDoc = documentsToSave.find(d => d.logicalDocumentId === rVec.logicalDocumentId && String(d.retrievalIndexId) === String(retrievalIndex._id));
          if (mappedDoc) {
            vectorsToUpsert.push({
              tenantId,
              repositoryId,
              snapshotId,
              retrievalIndexId: retrievalIndex._id,
              documentId: mappedDoc._id,
              logicalDocumentId: rVec.logicalDocumentId,
              providerId: rVec.providerId,
              modelId: rVec.modelId,
              dimensions: rVec.dimensions,
              embeddingInputHash: rVec.embeddingInputHash,
              vector: rVec.vector,
              metadata: rVec.metadata
            });
            retrievalIndex.reusedEmbeddingCount++;
          }
        }
      }

      // 5. VECTOR INDEXING
      retrievalIndex.status = 'INDEXING_VECTORS';
      await retrievalIndex.save();

      await VectorIndexStore.upsertVectors(vectorsToUpsert);

      // 6. LEXICAL INDEXING (MongoDB handles automatically, but we validate and verify)
      retrievalIndex.status = 'INDEXING_LEXICAL';
      await retrievalIndex.save();

      // We ensure the documents are searchable and count matches
      const lexicalCount = await LexicalIndexStore.countDocuments({ retrievalIndexId: retrievalIndex._id });

      // 7. RETRIEVAL INDEX VALIDATION
      retrievalIndex.status = 'VALIDATING';
      await retrievalIndex.save();

      const vectorValidation = await VectorIndexStore.validateIndex(tenantId, repositoryId, snapshotId, retrievalIndex._id);
      if (!vectorValidation.valid) {
        throw new Error(`Index validation failed: ${vectorValidation.errors.join('; ')}`);
      }

      // 8. READY
      retrievalIndex.documentCount = documentsToSave.length;
      retrievalIndex.vectorCount = vectorsToUpsert.length;
      retrievalIndex.lexicalDocumentCount = lexicalCount;
      retrievalIndex.status = 'READY';
      retrievalIndex.completedAt = new Date();
      await retrievalIndex.save();

      // Update repository pointer
      repo.latestRetrievalIndexId = retrievalIndex._id;
      await repo.save();

      this.logger.info('retrieval.index.ready', 'Retrieval Index created successfully.', {
        retrievalIndexId: retrievalIndex._id,
        documentCount: retrievalIndex.documentCount,
        reusedEmbeddingCount: retrievalIndex.reusedEmbeddingCount,
        embeddedDocumentCount: retrievalIndex.embeddedDocumentCount
      });

    } catch (err) {
      retrievalIndex.status = 'FAILED';
      retrievalIndex.failedAt = new Date();
      retrievalIndex.errorCode = err.message;
      await retrievalIndex.save();

      this.logger.error('retrieval.index.validation_failed', `Retrieval Index build failed: ${err.message}`, {
        snapshotId,
        error: err.message
      });
      throw err;
    } finally {
      if (cleanWorkspace && workspacePath) {
        await GitService.cleanupWorkspace(workspacePath);
      }
    }
  }

  _buildLogicalId(repositoryId, filePath, segmentId, segmentType) {
    return crypto.createHash('sha256').update(`${repositoryId}:${filePath}:${segmentId || 'file'}:${segmentType}`).digest('hex');
  }

  _enrichDocument(params) {
    const { content, qualifiedName, filePath, segmentType, language } = params;

    // Check token estimate
    const embeddingInput = `File: ${filePath}\nLanguage: ${language}\nSegment Type: ${segmentType}\nQualified Name: ${qualifiedName || 'none'}\n\n${content}`;
    const embeddingInputHash = crypto.createHash('sha256').update(embeddingInput).digest('hex');
    const tokenEstimate = Math.ceil(embeddingInput.length / 4);

    // Limit threshold: Subdivide if too large
    const maxTokensThreshold = 1000;
    if (tokenEstimate > maxTokensThreshold) {
      // Semantic subdivision policy: split text into overlapping lines
      const lines = content.split('\n');
      const children = [];
      let currentLines = [];
      let currentTokens = 0;
      let childIndex = 0;

      for (const line of lines) {
        const lineTokens = Math.ceil(line.length / 4);
        if (currentTokens + lineTokens > maxTokensThreshold && currentLines.length > 0) {
          // Save child chunk
          const chunkText = currentLines.join('\n');
          const childLogicalId = `${params.logicalDocumentId}-child-${childIndex}`;
          const childInput = `File: ${filePath}\nLanguage: ${language}\nSegment Type: ${segmentType}\nQualified Name: ${qualifiedName || 'none'}\n\n${chunkText}`;
          const childInputHash = crypto.createHash('sha256').update(childInput).digest('hex');

          children.push({
            ...params,
            _id: new mongoose.Types.ObjectId(),
            logicalDocumentId: childLogicalId,
            content: chunkText,
            contentHash: crypto.createHash('sha256').update(chunkText).digest('hex'),
            semanticFingerprint: crypto.createHash('sha256').update(`${chunkText}:${qualifiedName || ''}:${segmentType}`).digest('hex'),
            embeddingInputHash: childInputHash,
            tokenEstimate: Math.ceil(childInput.length / 4),
            metadata: {
              ...params.metadata,
              parentLogicalId: params.logicalDocumentId,
              childIndex
            }
          });

          childIndex++;
          // Overlap: keep last 3 lines
          currentLines = currentLines.slice(-3);
          currentTokens = Math.ceil(currentLines.join('\n').length / 4);
        }

        currentLines.push(line);
        currentTokens += lineTokens;
      }

      if (currentLines.length > 0) {
        const chunkText = currentLines.join('\n');
        const childLogicalId = `${params.logicalDocumentId}-child-${childIndex}`;
        const childInput = `File: ${filePath}\nLanguage: ${language}\nSegment Type: ${segmentType}\nQualified Name: ${qualifiedName || 'none'}\n\n${chunkText}`;
        const childInputHash = crypto.createHash('sha256').update(childInput).digest('hex');

        children.push({
          ...params,
          _id: new mongoose.Types.ObjectId(),
          logicalDocumentId: childLogicalId,
          content: chunkText,
          contentHash: crypto.createHash('sha256').update(chunkText).digest('hex'),
          semanticFingerprint: crypto.createHash('sha256').update(`${chunkText}:${qualifiedName || ''}:${segmentType}`).digest('hex'),
          embeddingInputHash: childInputHash,
          tokenEstimate: Math.ceil(childInput.length / 4),
          metadata: {
            ...params.metadata,
            parentLogicalId: params.logicalDocumentId,
            childIndex
          }
        });
      }

      return children;
    }

    // Default mapping (single document)
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const semanticFingerprint = crypto.createHash('sha256').update(`${content}:${qualifiedName || ''}:${segmentType}`).digest('hex');
    
    return [{
      ...params,
      _id: new mongoose.Types.ObjectId(),
      contentHash,
      semanticFingerprint,
      embeddingInputHash,
      tokenEstimate
    }];
  }
}

module.exports = new RetrievalIndexOrchestrator();
