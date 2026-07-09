const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RetrievalIndexPlanSchema = new Schema(
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
    baseRetrievalIndexId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryRetrievalIndex'
    },
    processingMode: {
      type: String,
      enum: ['FULL', 'INCREMENTAL'],
      default: 'FULL'
    },
    newDocuments: {
      type: [String],
      default: []
    },
    changedDocuments: {
      type: [String],
      default: []
    },
    deletedDocuments: {
      type: [String],
      default: []
    },
    reusableDocuments: {
      type: [String],
      default: []
    },
    embeddingsToGenerate: {
      type: Number,
      default: 0
    },
    embeddingsToReuse: {
      type: Number,
      default: 0
    },
    vectorsToDelete: {
      type: Number,
      default: 0
    },
    lexicalDocumentsToIndex: {
      type: Number,
      default: 0
    },
    lexicalDocumentsToDelete: {
      type: Number,
      default: 0
    },
    reason: {
      type: String
    },
    pipelineVersions: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

RetrievalIndexPlanSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1 });

module.exports = mongoose.model('RetrievalIndexPlan', RetrievalIndexPlanSchema);
