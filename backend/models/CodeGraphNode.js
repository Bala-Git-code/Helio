const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CodeGraphNodeSchema = new Schema(
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
    logicalNodeId: {
      type: String,
      required: true,
      index: true
    },
    nodeType: {
      type: String,
      enum: ['REPOSITORY', 'DIRECTORY', 'FILE', 'MODULE', 'SYMBOL', 'EXTERNAL_DEPENDENCY'],
      required: true
    },
    entityType: {
      type: String,
      enum: ['Repository', 'RepositorySnapshotFile', 'CodeSymbol', 'ExternalDependencyNode']
    },
    entityId: {
      type: Schema.Types.Mixed
    },
    label: {
      type: String
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

CodeGraphNodeSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, logicalNodeId: 1 });

module.exports = mongoose.model('CodeGraphNode', CodeGraphNodeSchema);
