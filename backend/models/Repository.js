const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositorySchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryConnection',
      required: true
    },
    providerId: {
      type: String,
      required: true
    },
    sourceRepositoryId: {
      type: String,
      required: true,
      index: true
    },
    owner: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    defaultBranch: {
      type: String,
      default: 'main'
    },
    webUrl: {
      type: String
    },
    status: {
      type: String,
      enum: ['REGISTERING', 'ACTIVE', 'SYNCING', 'PROCESSING', 'READY', 'DEGRADED', 'DISCONNECTED', 'ARCHIVED', 'DELETING', 'DELETED'],
      default: 'REGISTERING',
      index: true
    },
    syncStatus: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING'
    },
    indexStatus: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING'
    },
    latestRemoteRevision: {
      type: String
    },
    latestSnapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot'
    },
    latestIndexedSnapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot'
    },
    lastSyncRequestedAt: {
      type: Date
    },
    lastSyncStartedAt: {
      type: Date
    },
    lastSyncCompletedAt: {
      type: Date
    },
    lastIndexCompletedAt: {
      type: Date
    },
    lastErrorCode: {
      type: String
    },
    lastErrorStage: {
      type: String
    },
    createdBy: {
      type: String
    }
  },
  { timestamps: true }
);

// Compound unique boundary for registry check
RepositorySchema.index({ tenantId: 1, providerId: 1, sourceRepositoryId: 1 }, { unique: true });
RepositorySchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('Repository', RepositorySchema);
