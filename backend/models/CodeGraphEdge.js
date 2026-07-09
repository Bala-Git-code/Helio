const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CodeGraphEdgeSchema = new Schema(
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
    logicalEdgeId: {
      type: String,
      required: true,
      index: true
    },
    edgeType: {
      type: String,
      required: true,
      index: true
    },
    sourceNodeId: {
      type: String,
      required: true,
      index: true
    },
    targetNodeId: {
      type: String,
      required: true,
      index: true
    },
    confidence: {
      type: String,
      enum: ['EXACT', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    graphSchemaVersion: {
      type: String
    }
  },
  { timestamps: true }
);

CodeGraphEdgeSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, logicalEdgeId: 1 });
CodeGraphEdgeSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, sourceNodeId: 1, edgeType: 1 });
CodeGraphEdgeSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, targetNodeId: 1, edgeType: 1 });

module.exports = mongoose.model('CodeGraphEdge', CodeGraphEdgeSchema);
