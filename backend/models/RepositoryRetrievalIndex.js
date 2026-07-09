const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryRetrievalIndexSchema = new Schema(
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
    status: {
      type: String,
      enum: [
        'PENDING',
        'PLANNING',
        'ENRICHING',
        'EMBEDDING',
        'INDEXING_VECTORS',
        'INDEXING_LEXICAL',
        'VALIDATING',
        'READY',
        'DEGRADED',
        'FAILED',
        'CANCELLED'
      ],
      default: 'PENDING',
      index: true
    },
    processingMode: {
      type: String,
      enum: ['FULL', 'INCREMENTAL'],
      default: 'FULL'
    },
    baseRetrievalIndexId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryRetrievalIndex'
    },
    embeddingProviderId: {
      type: String,
      required: true
    },
    embeddingModelId: {
      type: String,
      required: true
    },
    embeddingDimensions: {
      type: Number,
      required: true
    },
    documentCount: {
      type: Number,
      default: 0
    },
    embeddedDocumentCount: {
      type: Number,
      default: 0
    },
    reusedEmbeddingCount: {
      type: Number,
      default: 0
    },
    vectorCount: {
      type: Number,
      default: 0
    },
    lexicalDocumentCount: {
      type: Number,
      default: 0
    },
    failedDocumentCount: {
      type: Number,
      default: 0
    },
    pipelineVersions: {
      type: Schema.Types.Mixed,
      default: {}
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    failedAt: {
      type: Date
    },
    errorCode: {
      type: String
    }
  },
  { timestamps: true }
);

RepositoryRetrievalIndexSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1 });
RepositoryRetrievalIndexSchema.index({ repositoryId: 1, status: 1 });

module.exports = mongoose.model('RepositoryRetrievalIndex', RepositoryRetrievalIndexSchema);
