const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryStructuralIndexSchema = new Schema(
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
    status: {
      type: String,
      enum: [
        'PENDING',
        'PLANNING',
        'SEGMENTING',
        'EXTRACTING',
        'RESOLVING_MODULES',
        'RESOLVING_REFERENCES',
        'BUILDING_GRAPH',
        'VALIDATING',
        'READY',
        'FAILED'
      ],
      default: 'PENDING',
      index: true
    },
    segmentCount: {
      type: Number,
      default: 0
    },
    symbolCount: {
      type: Number,
      default: 0
    },
    scopeCount: {
      type: Number,
      default: 0
    },
    referenceCount: {
      type: Number,
      default: 0
    },
    resolvedReferenceCount: {
      type: Number,
      default: 0
    },
    unresolvedReferenceCount: {
      type: Number,
      default: 0
    },
    graphNodeCount: {
      type: Number,
      default: 0
    },
    graphEdgeCount: {
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

RepositoryStructuralIndexSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1 });

module.exports = mongoose.model('RepositoryStructuralIndex', RepositoryStructuralIndexSchema);
