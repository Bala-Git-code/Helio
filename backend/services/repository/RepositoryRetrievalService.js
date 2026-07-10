const mongoose = require('mongoose');
const crypto = require('crypto');

// Models
const RepositoryRetrievalIndex = require('../../models/RepositoryRetrievalIndex');
const RepositoryRetrievalDocument = require('../../models/RepositoryRetrievalDocument');
const RepositoryVectorRecord = require('../../models/RepositoryVectorRecord');
const CodeSymbol = require('../../models/CodeSymbol');
const CodeSegment = require('../../models/CodeSegment');
const CodeGraphNode = require('../../models/CodeGraphNode');
const CodeGraphEdge = require('../../models/CodeGraphEdge');

// Services
const VectorIndexStore = require('./VectorIndexStore');
const LexicalIndexStore = require('./LexicalIndexStore');
const AiExecutionEngine = require('../ai/AiExecutionEngine');
const { baseLogger } = require('../medication/observability');

class RepositoryRetrievalService {
  constructor() {
    this.logger = baseLogger.child({ service: 'helio-retrieval-service' });
    this.cache = new Map(); // Simple TTL-based in-memory query cache
  }

  async search(request) {
    const {
      tenantId,
      repositoryId,
      snapshotSelector = {},
      queryText,
      filters = {},
      topK = 20,
      retrievalMode = 'HYBRID',
      includeExplanations = false
    } = request;

    this.logger.info('retrieval.query.started', 'Query started.', {
      tenantId,
      repositoryId,
      queryText,
      retrievalMode
    });

    // 1. Resolve Retrieval Index
    const retrievalIndex = await this._resolveRetrievalIndex(tenantId, repositoryId, snapshotSelector);
    if (!retrievalIndex) {
      throw new Error('AI_INVALID_REQUEST: No READY retrieval index found for this repository/snapshot.');
    }

    // 2. Cache Lookup
    const cacheKey = this._buildCacheKey({
      tenantId,
      repositoryId,
      retrievalIndexId: retrievalIndex._id,
      queryText,
      filters,
      retrievalMode
    });
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() < cached.expiresAt) {
        return cached.result;
      }
      this.cache.delete(cacheKey);
    }

    // 3. Query Understanding
    const queryMeta = this._understandQuery(queryText);

    // 4. Parallel Candidate Retrieval Channels
    const vectorCandidatesPromise = (retrievalMode === 'SEMANTIC' || retrievalMode === 'HYBRID')
      ? this._retrieveVectorCandidates(tenantId, repositoryId, retrievalIndex, queryText, topK * 2, filters)
      : Promise.resolve([]);

    const lexicalCandidatesPromise = (retrievalMode === 'LEXICAL' || retrievalMode === 'HYBRID')
      ? this._retrieveLexicalCandidates(tenantId, repositoryId, retrievalIndex, queryText, topK * 2, filters)
      : Promise.resolve([]);

    const symbolCandidatesPromise = (retrievalMode === 'SYMBOL' || retrievalMode === 'HYBRID')
      ? this._retrieveSymbolCandidates(tenantId, repositoryId, retrievalIndex, queryMeta, topK, filters)
      : Promise.resolve([]);

    const [vectorCandidates, lexicalCandidates, symbolCandidates] = await Promise.all([
      vectorCandidatesPromise,
      lexicalCandidatesPromise,
      symbolCandidatesPromise
    ]);

    // 5. Graph Expansion Channel (from vector/lexical seed symbol candidates)
    let graphCandidates = [];
    if (retrievalMode === 'GRAPH_AUGMENTED' || retrievalMode === 'HYBRID') {
      const seeds = [...vectorCandidates.slice(0, 5), ...lexicalCandidates.slice(0, 5)]
        .filter(c => c.metadata && c.metadata.symbolId)
        .map(c => c.metadata.symbolId);
      
      if (seeds.length > 0) {
        graphCandidates = await this._expandGraph(tenantId, repositoryId, retrievalIndex, seeds);
      }
    }

    // 6. Score Normalization & Fusion
    const mergedCandidates = this._fuseCandidates({
      vectorCandidates,
      lexicalCandidates,
      symbolCandidates,
      graphCandidates,
      topK,
      includeExplanations
    });

    // 7. Deduplication & Finalization
    const finalCandidates = this._deduplicateCandidates(mergedCandidates);

    // Cache the result (TTL 60s)
    this.cache.set(cacheKey, {
      result: finalCandidates,
      expiresAt: Date.now() + 60 * 1000
    });

    return finalCandidates;
  }

  async retrieveContext(request) {
    const {
      tenantId,
      repositoryId,
      snapshotSelector = {},
      queryText,
      filters = {},
      contextTokenBudget = 2000,
      retrievalPolicy = { retrievalMode: 'HYBRID', includeExplanations: true, maxChunksPerFile: 2 },
      includeProvenance = true
    } = request;

    const candidates = await this.search({
      tenantId,
      repositoryId,
      snapshotSelector,
      queryText,
      filters,
      topK: 40,
      retrievalMode: retrievalPolicy.retrievalMode,
      includeExplanations: retrievalPolicy.includeExplanations
    });

    // Enforce Tenant Budgets and Max token parameters
    const maxBudgetTokens = Math.min(contextTokenBudget, 8000);

    // 8. Diversification & Selection
    const diversified = this._diversifyCandidates(candidates, retrievalPolicy.maxChunksPerFile || 2);

    // 9. Context Neighbor Expansion & Budgeted Context Assembly
    const assembledContext = await this._assembleContext(tenantId, diversified, maxBudgetTokens, includeProvenance);

    return assembledContext;
  }

  async findSimilarCode(request) {
    const { tenantId, repositoryId, snapshotSelector = {}, documentId, limit = 5 } = request;

    const retrievalIndex = await this._resolveRetrievalIndex(tenantId, repositoryId, snapshotSelector);
    if (!retrievalIndex) throw new Error('READY retrieval index not found.');

    const targetVectorRec = await RepositoryVectorRecord.findOne({
      tenantId,
      repositoryId,
      retrievalIndexId: retrievalIndex._id,
      documentId
    }).lean();

    if (!targetVectorRec) {
      throw new Error(`Embedding vector not found for document: ${documentId}`);
    }

    const nearest = await VectorIndexStore.queryNearest(
      tenantId,
      repositoryId,
      retrievalIndex.snapshotId,
      retrievalIndex._id,
      targetVectorRec.vector,
      limit + 1
    );

    // Exclude the input document itself
    const filtered = nearest.filter(n => String(n.documentId) !== String(documentId)).slice(0, limit);

    // Populate documents
    const docIds = filtered.map(f => f.documentId);
    const docs = await RepositoryRetrievalDocument.find({ _id: { $in: docIds } }).lean();

    return filtered.map(f => {
      const doc = docs.find(d => String(d._id) === String(f.documentId));
      return {
        documentId: f.documentId,
        score: f.score,
        document: doc
      };
    });
  }

  async retrieveForSymbol(tenantId, repositoryId, snapshotSelector, symbolId, contextTokenBudget) {
    const symbol = await CodeSymbol.findById(symbolId).lean();
    if (!symbol) throw new Error(`Symbol ${symbolId} not found.`);
    return this.retrieveContext({
      tenantId,
      repositoryId,
      snapshotSelector,
      queryText: symbol.name,
      filters: { segmentType: 'METHOD' }, // prefer declarations/methods
      contextTokenBudget
    });
  }

  async retrieveForFile(tenantId, repositoryId, snapshotSelector, filePath, contextTokenBudget) {
    return this.retrieveContext({
      tenantId,
      repositoryId,
      snapshotSelector,
      queryText: filePath,
      filters: { filePath },
      contextTokenBudget
    });
  }

  async retrieveForArchitectureAnalysis(tenantId, repositoryId, snapshotSelector, contextTokenBudget) {
    return this.retrieveContext({
      tenantId,
      repositoryId,
      snapshotSelector,
      queryText: 'architecture configuration module interface dependencies',
      contextTokenBudget
    });
  }

  // --- INTERNAL HELPER METHODS ---

  async _resolveRetrievalIndex(tenantId, repositoryId, selector) {
    const query = { tenantId, repositoryId, status: 'READY' };
    if (selector.snapshotId) {
      query.snapshotId = selector.snapshotId;
    }
    const index = await RepositoryRetrievalIndex.findOne(query).sort({ createdAt: -1 });
    return index;
  }

  _buildCacheKey(params) {
    return crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex');
  }

  _understandQuery(queryText) {
    const meta = {
      isPath: false,
      symbolTokens: [],
      raw: queryText
    };

    if (!queryText) return meta;

    // Check path characteristics
    if (queryText.includes('/') || queryText.includes('\\') || queryText.includes('.')) {
      meta.isPath = true;
    }

    // Extract camelCase, PascalCase, or snake_case symbols
    const tokens = queryText.split(/\s+/);
    for (const tok of tokens) {
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tok) && tok.length > 2) {
        meta.symbolTokens.push(tok);
      }
    }

    return meta;
  }

  async _retrieveVectorCandidates(tenantId, repositoryId, index, queryText, limit, filters) {
    // Generate query embedding
    const embedRes = await AiExecutionEngine.embed({
      tenantId,
      text: queryText,
      modelId: index.embeddingModelId
    });

    const nearest = await VectorIndexStore.queryNearest(
      tenantId,
      repositoryId,
      index.snapshotId,
      index._id,
      embedRes.vector,
      limit,
      filters
    );

    // Populate document metadata
    const docIds = nearest.map(n => n.documentId);
    const docs = await RepositoryRetrievalDocument.find({ _id: { $in: docIds } }).lean();

    return nearest.map(n => {
      const doc = docs.find(d => String(d._id) === String(n.documentId));
      return {
        documentId: n.documentId,
        logicalDocumentId: n.logicalDocumentId,
        score: n.score,
        channel: 'VECTOR',
        metadata: doc
      };
    });
  }

  async _retrieveLexicalCandidates(tenantId, repositoryId, index, queryText, limit, filters) {
    const results = await LexicalIndexStore.search(
      tenantId,
      repositoryId,
      index.snapshotId,
      index._id,
      queryText,
      limit,
      filters
    );

    return results.map(r => ({
      documentId: r.documentId,
      logicalDocumentId: r.logicalDocumentId,
      score: r.score,
      channel: 'LEXICAL',
      metadata: r.document
    }));
  }

  async _retrieveSymbolCandidates(tenantId, repositoryId, index, queryMeta, limit, filters) {
    if (queryMeta.symbolTokens.length === 0) return [];

    const query = {
      tenantId,
      repositoryId,
      snapshotId: index.snapshotId,
      name: { $in: queryMeta.symbolTokens.map(tok => new RegExp(`^${tok}`, 'i')) }
    };

    if (filters.language) query.language = filters.language;

    const symbols = await CodeSymbol.find(query).limit(limit).lean();
    if (symbols.length === 0) return [];

    // Find documents associated with these symbols
    const symIds = symbols.map(s => s._id);
    const docs = await RepositoryRetrievalDocument.find({
      retrievalIndexId: index._id,
      symbolId: { $in: symIds }
    }).lean();

    return docs.map(doc => {
      const matchedSymbol = symbols.find(s => String(s._id) === String(doc.symbolId));
      return {
        documentId: doc._id,
        logicalDocumentId: doc.logicalDocumentId,
        score: matchedSymbol && matchedSymbol.name.toLowerCase() === queryMeta.raw.toLowerCase() ? 1.0 : 0.8,
        channel: 'SYMBOL',
        metadata: doc
      };
    });
  }

  async _expandGraph(tenantId, repositoryId, index, symbolIds) {
    const graphCandidates = [];
    const maxDepth = Number(process.env.RETRIEVAL_GRAPH_MAX_DEPTH) || 2;
    const maxNodes = Number(process.env.RETRIEVAL_GRAPH_MAX_NODES) || 50;

    // Resolve nodes corresponding to seed symbols
    const nodeIds = symbolIds.map(sid => `node:${tenantId}:${repositoryId}:SYMBOL:${sid}`);
    const resolvedNodes = await CodeGraphNode.find({
      tenantId,
      repositoryId,
      snapshotId: index.snapshotId,
      logicalNodeId: { $in: nodeIds }
    }).lean();

    if (resolvedNodes.length === 0) return [];

    const queue = resolvedNodes.map(n => ({ nodeId: n.logicalNodeId, depth: 0 }));
    const visited = new Set(nodeIds);
    const expandedNodes = [];

    while (queue.length > 0 && expandedNodes.length < maxNodes) {
      const { nodeId, depth } = queue.shift();
      if (depth >= maxDepth) continue;

      // outgoing edges/relations
      const edges = await CodeGraphEdge.find({
        tenantId,
        repositoryId,
        snapshotId: index.snapshotId,
        sourceNodeId: nodeId
      }).limit(maxNodes).lean();

      for (const edge of edges) {
        if (!visited.has(edge.targetNodeId)) {
          visited.add(edge.targetNodeId);
          queue.push({ nodeId: edge.targetNodeId, depth: depth + 1 });

          // Find if target node corresponds to a document
          const targetNodeDoc = await CodeGraphNode.findOne({
            tenantId,
            repositoryId,
            snapshotId: index.snapshotId,
            logicalNodeId: edge.targetNodeId
          }).lean();

          if (targetNodeDoc && targetNodeDoc.nodeType === 'SYMBOL') {
            expandedNodes.push({ node: targetNodeDoc, distance: depth + 1 });
          }
        }
      }
    }

    if (expandedNodes.length === 0) return [];

    // Find documents associated with expanded symbols
    const symIds = expandedNodes.map(e => e.node.entityId);
    const docs = await RepositoryRetrievalDocument.find({
      retrievalIndexId: index._id,
      symbolId: { $in: symIds }
    }).lean();

    return docs.map(doc => {
      const exp = expandedNodes.find(e => String(e.node.entityId) === String(doc.symbolId));
      return {
        documentId: doc._id,
        logicalDocumentId: doc.logicalDocumentId,
        score: 0.5 / (exp ? exp.distance : 1),
        channel: 'GRAPH',
        metadata: doc
      };
    });
  }

  _fuseCandidates({ vectorCandidates, lexicalCandidates, symbolCandidates, graphCandidates, topK, includeExplanations }) {
    const candidateMap = new Map(); // logicalDocumentId -> Candidate

    // Normalization factors
    const maxLexicalScore = lexicalCandidates.length > 0 ? Math.max(...lexicalCandidates.map(c => c.score)) : 1;

    const ingest = (candidates, weight, channelName) => {
      for (const cand of candidates) {
        const key = cand.logicalDocumentId;
        if (!candidateMap.has(key)) {
          candidateMap.set(key, {
            documentId: cand.documentId,
            logicalDocumentId: cand.logicalDocumentId,
            filePath: cand.metadata?.filePath,
            channelScores: {},
            normalizedScores: {},
            metadata: cand.metadata,
            fusedScore: 0
          });
        }

        const entry = candidateMap.get(key);
        let normalizedScore = cand.score;

        if (channelName === 'LEXICAL') {
          // Normalize BM25/textScore
          normalizedScore = cand.score / (maxLexicalScore + 0.1);
        } else if (channelName === 'VECTOR') {
          // Cosine similarity is already normalized 0 to 1 for positive text spaces
          normalizedScore = Math.max(0, Math.min(1.0, cand.score));
        }

        entry.channelScores[channelName] = cand.score;
        entry.normalizedScores[channelName] = normalizedScore;
        entry.fusedScore += normalizedScore * weight;
      }
    };

    // Fuse scores with weights: vector (0.5), lexical (0.3), symbol (0.1), graph (0.1)
    ingest(vectorCandidates, 0.5, 'VECTOR');
    ingest(lexicalCandidates, 0.3, 'LEXICAL');
    ingest(symbolCandidates, 0.1, 'SYMBOL');
    ingest(graphCandidates, 0.1, 'GRAPH');

    const fused = Array.from(candidateMap.values());
    fused.sort((a, b) => b.fusedScore - a.fusedScore);

    return fused.slice(0, topK).map(item => {
      if (includeExplanations) {
        item.explanation = `Retrieved via: ${Object.keys(item.channelScores).join(', ')}. Weighted Fused Score: ${item.fusedScore.toFixed(4)}`;
      }
      return item;
    });
  }

  _deduplicateCandidates(candidates) {
    const seenHashes = new Set();
    const deduped = [];

    for (const cand of candidates) {
      const hash = cand.metadata?.contentHash || cand.logicalDocumentId;
      if (!seenHashes.has(hash)) {
        seenHashes.add(hash);
        deduped.push(cand);
      }
    }

    return deduped;
  }

  _diversifyCandidates(candidates, maxChunksPerFile) {
    const fileCounts = new Map();
    const diversified = [];

    for (const cand of candidates) {
      const file = cand.filePath || 'unknown';
      const count = fileCounts.get(file) || 0;
      
      if (count < maxChunksPerFile) {
        fileCounts.set(file, count + 1);
        diversified.push(cand);
      }
    }

    return diversified;
  }

  async _assembleContext(tenantId, candidates, maxBudgetTokens, includeProvenance) {
    let currentTokens = 0;
    const selectedItems = [];
    const provenanceManifest = [];

    for (const cand of candidates) {
      if (currentTokens >= maxBudgetTokens) break;

      const doc = cand.metadata;
      if (!doc) continue;

      // Token estimation
      let itemTokens = doc.tokenEstimate || Math.ceil(doc.content.length / 4);

      if (currentTokens + itemTokens > maxBudgetTokens) {
        // Truncate segment content gracefully if budget is partially exceeded
        const remainingBudget = maxBudgetTokens - currentTokens;
        if (remainingBudget > 50) { // Only append if meaningful space remains
          const excerptLines = doc.content.split('\n').slice(0, Math.floor(remainingBudget / 5));
          const excerptText = excerptLines.join('\n') + '\n... [EXCERPTED DUE TO TOKEN BUDGET]';
          const truncatedTokens = Math.ceil(excerptText.length / 4);

          selectedItems.push({
            documentId: doc._id,
            logicalDocumentId: doc.logicalDocumentId,
            filePath: doc.filePath,
            language: doc.language,
            segmentType: doc.segmentType,
            content: excerptText,
            fusedScore: cand.fusedScore,
            explanation: cand.explanation,
            excerpted: true
          });

          if (includeProvenance) {
            const prov = this._buildProvenanceEntry(tenantId, doc, excerptLines.length);
            selectedItems[selectedItems.length - 1].provenanceId = prov.provenanceId;
            provenanceManifest.push(prov);
          }

          currentTokens += truncatedTokens;
        }
        break;
      }

      selectedItems.push({
        documentId: doc._id,
        logicalDocumentId: doc.logicalDocumentId,
        filePath: doc.filePath,
        language: doc.language,
        segmentType: doc.segmentType,
        content: doc.content,
        fusedScore: cand.fusedScore,
        explanation: cand.explanation,
        excerpted: false
      });

      if (includeProvenance) {
        const prov = this._buildProvenanceEntry(tenantId, doc);
        selectedItems[selectedItems.length - 1].provenanceId = prov.provenanceId;
        provenanceManifest.push(prov);
      }

      currentTokens += itemTokens;
    }

    return {
      repositoryId: candidates.length > 0 ? candidates[0].metadata?.repositoryId : null,
      snapshotId: candidates.length > 0 ? candidates[0].metadata?.snapshotId : null,
      items: selectedItems,
      totalEstimatedTokens: currentTokens,
      provenanceManifest
    };
  }

  _buildProvenanceEntry(tenantId, doc, maxLines = null) {
    const ref = doc.contentReference || {};
    const endLine = maxLines ? ref.startLine + maxLines - 1 : ref.endLine;

    return {
      provenanceId: `prov_${crypto.randomBytes(8).toString('hex')}`,
      tenantId,
      repositoryId: doc.repositoryId,
      snapshotId: doc.snapshotId,
      filePath: doc.filePath,
      startLine: ref.startLine || 1,
      endLine: endLine || 1,
      startByte: ref.startByte || 0,
      endByte: ref.endByte || 0,
      contentHash: doc.contentHash,
      segmentId: doc.segmentId,
      symbolId: doc.symbolId,
      retrievalDocumentId: doc._id
    };
  }
}

module.exports = new RepositoryRetrievalService();
