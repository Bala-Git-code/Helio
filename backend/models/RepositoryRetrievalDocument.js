const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryRetrievalDocumentSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    repositoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      index: true
    },
    snapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot',
      required: true,
      index: true
    },
    structuralIndexId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryStructuralIndex',
      required: true,
      index: true
    },
    retrievalIndexId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryRetrievalIndex',
      required: true,
      index: true
    },
    logicalDocumentId: {
      type: String,
      required: true,
      index: true
    },
    segmentId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeSegment'
    },
    symbolId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeSymbol'
    },
    filePath: {
      type: String,
      required: true,
      index: true
    },
    language: {
      type: String
    },
    fileClassification: {
      type: String
    },
    segmentType: {
      type: String
    },
    title: {
      type: String
    },
    qualifiedName: {
      type: String
    },
    contentReference: {
      type: Schema.Types.Mixed
    },
    contentHash: {
      type: String,
      required: true,
      index: true
    },
    semanticFingerprint: {
      type: String,
      required: true,
      index: true
    },
    embeddingInputHash: {
      type: String,
      required: true,
      index: true
    },
    tokenEstimate: {
      type: Number,
      default: 0
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    enrichmentVersion: {
      type: String
    },
    documentVersion: {
      type: String
    },
    content: {
      type: String
    }
  },
  { timestamps: true, language_override: 'dummyLanguageOverrideField' }
);

RepositoryRetrievalDocumentSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, logicalDocumentId: 1 });
RepositoryRetrievalDocumentSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, filePath: 1 });
RepositoryRetrievalDocumentSchema.index({ contentHash: 1 });

// Lexical text search index
RepositoryRetrievalDocumentSchema.index(
  {
    qualifiedName: 'text',
    title: 'text',
    content: 'text',
    filePath: 'text'
  },
  {
    name: 'RetrievalDocTextIndex',
    language_override: 'dummyLanguageOverrideField',
    weights: {
      qualifiedName: 10,
      title: 5,
      content: 2,
      filePath: 1
    }
  }
);

module.exports = mongoose.model('RepositoryRetrievalDocument', RepositoryRetrievalDocumentSchema);
