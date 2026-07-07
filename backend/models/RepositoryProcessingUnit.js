const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryProcessingUnitSchema = new Schema(
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
    syncId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySync',
      required: true,
      index: true
    },
    snapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot'
    },
    path: {
      type: String,
      required: true
    },
    contentHash: {
      type: String
    },
    unitType: {
      type: String,
      enum: ['FILE_DISCOVERY', 'FILE_CLASSIFICATION', 'FILE_PARSE', 'FILE_DELETE', 'SNAPSHOT_FINALIZATION', 'INDEX_FINALIZATION'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'QUEUED', 'CLAIMED', 'RUNNING', 'SUCCEEDED', 'RETRY_SCHEDULED', 'FAILED', 'DEAD_LETTERED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    priority: {
      type: Number,
      default: 0
    },
    attemptCount: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    leaseOwner: {
      type: String
    },
    leaseToken: {
      type: String
    },
    leaseExpiresAt: {
      type: Date,
      index: true
    },
    availableAt: {
      type: Date,
      default: Date.now,
      index: true
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
    },
    traceId: {
      type: String
    }
  },
  { timestamps: true }
);

RepositoryProcessingUnitSchema.index({ syncId: 1, status: 1 });
RepositoryProcessingUnitSchema.index({ leaseExpiresAt: 1, status: 1 });

module.exports = mongoose.model('RepositoryProcessingUnit', RepositoryProcessingUnitSchema);
