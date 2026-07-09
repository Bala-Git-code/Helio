const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryVectorRecordSchema = new Schema(
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
    retrievalIndexId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryRetrievalIndex',
      required: true,
      index: true
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryRetrievalDocument',
      required: true,
      index: true
    },
    logicalDocumentId: {
      type: String,
      required: true,
      index: true
    },
    providerId: {
      type: String,
      required: true
    },
    modelId: {
      type: String,
      required: true
    },
    modelVersion: {
      type: String
    },
    dimensions: {
      type: Number,
      required: true
    },
    embeddingInputHash: {
      type: String,
      required: true,
      index: true
    },
    vector: {
      type: [Number],
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

RepositoryVectorRecordSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, retrievalIndexId: 1 });
RepositoryVectorRecordSchema.index({ embeddingInputHash: 1, modelId: 1 });

module.exports = mongoose.model('RepositoryVectorRecord', RepositoryVectorRecordSchema);
