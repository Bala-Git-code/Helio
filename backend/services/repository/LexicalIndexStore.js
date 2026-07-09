const RepositoryRetrievalDocument = require('../../models/RepositoryRetrievalDocument');
const { baseLogger } = require('../medication/observability');

class LexicalIndexStore {
  constructor() {
    this.logger = baseLogger.child({ service: 'helio-lexical-store' });
  }

  preprocessQueryText(text) {
    if (!text) return '';
    
    // Split text into whitespace separated tokens
    const tokens = text.split(/\s+/);
    const enriched = [];

    for (const token of tokens) {
      enriched.push(token);

      // Split camelCase/PascalCase
      const camelParts = token.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^a-zA-Z0-9]/);
      // Split snake_case/kebab-case/namespaces
      const symbolParts = token.split(/[^a-zA-Z0-9]/);

      const allParts = [...camelParts, ...symbolParts];
      for (const part of allParts) {
        if (part && part.length > 1 && !enriched.includes(part)) {
          enriched.push(part);
        }
      }
    }

    return enriched.join(' ');
  }

  async indexDocuments(documents) {
    if (!documents || documents.length === 0) return;

    this.logger.info('lexical.store.index', `Indexing ${documents.length} documents.`);

    const operations = documents.map(doc => ({
      updateOne: {
        filter: {
          tenantId: doc.tenantId,
          repositoryId: doc.repositoryId,
          snapshotId: doc.snapshotId,
          retrievalIndexId: doc.retrievalIndexId,
          logicalDocumentId: doc.logicalDocumentId
        },
        update: { $set: doc },
        upsert: true
      }
    }));

    await RepositoryRetrievalDocument.bulkWrite(operations);
  }

  async deleteDocuments(tenantId, repositoryId, snapshotId, retrievalIndexId, filter = {}) {
    const query = { tenantId, repositoryId, snapshotId, retrievalIndexId, ...filter };
    this.logger.info('lexical.store.delete', `Deleting documents matching query.`, { query });
    await RepositoryRetrievalDocument.deleteMany(query);
  }

  async search(tenantId, repositoryId, snapshotId, retrievalIndexId, queryText, limit = 20, filters = {}) {
    if (!queryText) return [];

    const enrichedQuery = this.preprocessQueryText(queryText);
    const query = {
      tenantId,
      repositoryId,
      snapshotId,
      retrievalIndexId,
      $text: { $search: enrichedQuery }
    };

    if (filters.filePath) {
      query.filePath = filters.filePath;
    }
    if (filters.language) {
      query.language = filters.language;
    }
    if (filters.segmentType) {
      query.segmentType = filters.segmentType;
    }

    // Retrieve documents sorted by MongoDB's metadata textScore
    const results = await RepositoryRetrievalDocument.find(
      query,
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();

    return results.map(doc => ({
      documentId: doc._id,
      logicalDocumentId: doc.logicalDocumentId,
      score: doc.score || 1.0, // textScore
      document: doc
    }));
  }

  async countDocuments(query) {
    return await RepositoryRetrievalDocument.countDocuments(query);
  }

  async validateIndex(tenantId, repositoryId, snapshotId, retrievalIndexId) {
    const errors = [];
    const query = { tenantId, repositoryId, snapshotId, retrievalIndexId };

    const count = await RepositoryRetrievalDocument.countDocuments(query);
    const docs = await RepositoryRetrievalDocument.find(query).select('logicalDocumentId').lean();

    const seenLogicalIds = new Set();
    for (const doc of docs) {
      if (seenLogicalIds.has(doc.logicalDocumentId)) {
        errors.push(`Duplicate logicalDocumentId found in lexical index: ${doc.logicalDocumentId}`);
      }
      seenLogicalIds.add(doc.logicalDocumentId);
    }

    return {
      valid: errors.length === 0,
      errors,
      count
    };
  }
}

module.exports = new LexicalIndexStore();
