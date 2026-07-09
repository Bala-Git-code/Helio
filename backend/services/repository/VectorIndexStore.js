const RepositoryVectorRecord = require('../../models/RepositoryVectorRecord');
const { baseLogger } = require('../medication/observability');

class VectorIndexStore {
  constructor() {
    this.logger = baseLogger.child({ service: 'helio-vector-store' });
  }

  async upsertVectors(records) {
    if (!records || records.length === 0) return;

    this.logger.info('vector.store.upsert', `Upserting ${records.length} vectors.`);
    
    // Perform bulk write for efficiency
    const operations = records.map(rec => ({
      updateOne: {
        filter: {
          tenantId: rec.tenantId,
          repositoryId: rec.repositoryId,
          snapshotId: rec.snapshotId,
          retrievalIndexId: rec.retrievalIndexId,
          logicalDocumentId: rec.logicalDocumentId
        },
        update: { $set: rec },
        upsert: true
      }
    }));

    await RepositoryVectorRecord.bulkWrite(operations);
  }

  async deleteVectors(tenantId, repositoryId, snapshotId, retrievalIndexId, filter = {}) {
    const query = { tenantId, repositoryId, snapshotId, retrievalIndexId, ...filter };
    this.logger.info('vector.store.delete', `Deleting vectors matching query.`, { query: { ...query, vector: undefined } });
    await RepositoryVectorRecord.deleteMany(query);
  }

  async queryNearest(tenantId, repositoryId, snapshotId, retrievalIndexId, queryVector, limit = 20, filters = {}) {
    // 1. Fetch vector candidates scoped to tenant, repo, snapshot, and index
    const query = { tenantId, repositoryId, snapshotId, retrievalIndexId };
    
    // Apply optional filter rules (like file path, language, segment type) inside vector records metadata if stored
    if (filters.filePath) {
      query['metadata.filePath'] = filters.filePath;
    }
    if (filters.language) {
      query['metadata.language'] = filters.language;
    }
    if (filters.segmentType) {
      query['metadata.segmentType'] = filters.segmentType;
    }

    const candidates = await RepositoryVectorRecord.find(query).lean();
    if (candidates.length === 0) return [];

    // 2. Perform in-memory dot product similarity calculation (vectors are normalized, so dot product = cosine similarity)
    const results = candidates.map(cand => {
      const score = this._dotProduct(queryVector, cand.vector);
      return {
        documentId: cand.documentId,
        logicalDocumentId: cand.logicalDocumentId,
        score: score, // Cosine similarity: -1 to 1 range (typically 0 to 1 for text embeddings)
        metadata: cand.metadata || {}
      };
    });

    // 3. Sort by score descending and take top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  async validateIndex(tenantId, repositoryId, snapshotId, retrievalIndexId) {
    const errors = [];
    const query = { tenantId, repositoryId, snapshotId, retrievalIndexId };

    const records = await RepositoryVectorRecord.find(query).select('dimensions logicalDocumentId documentId').lean();
    if (records.length === 0) {
      return { valid: true, errors: [] }; // Empty repo index is technically valid if no code exists
    }

    const firstDim = records[0].dimensions;
    const seenLogicalIds = new Set();
    const seenDocumentIds = new Set();

    for (const rec of records) {
      if (rec.dimensions !== firstDim) {
        errors.push(`Dimension mismatch: expected ${firstDim}, found ${rec.dimensions} for document ${rec.logicalDocumentId}`);
      }
      if (seenLogicalIds.has(rec.logicalDocumentId)) {
        errors.push(`Duplicate logicalDocumentId found: ${rec.logicalDocumentId}`);
      }
      seenLogicalIds.add(rec.logicalDocumentId);
      seenDocumentIds.add(String(rec.documentId));
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async countVectors(query) {
    return await RepositoryVectorRecord.countDocuments(query);
  }

  _dotProduct(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return dot;
  }
}

module.exports = new VectorIndexStore();
