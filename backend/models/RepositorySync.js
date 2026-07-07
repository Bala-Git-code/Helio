const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositorySyncSchema = new Schema(
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
    triggerType: {
      type: String,
      enum: ['INITIAL', 'MANUAL', 'WEBHOOK', 'SCHEDULED_RECONCILIATION', 'RECOVERY', 'ADMINISTRATIVE'],
      required: true
    },
    requestedRevision: {
      type: String // ref name or commit sha
    },
    resolvedRevision: {
      type: String // resolved commit sha
    },
    baseSnapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot'
    },
    targetSnapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot'
    },
    status: {
      type: String,
      enum: ['PENDING', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    jobId: {
      type: String
    },
    idempotencyKey: {
      type: String,
      index: true
    },
    requestedBy: {
      type: String
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
    errorClassification: {
      type: String
    },
    traceId: {
      type: String
    },
    correlationId: {
      type: String
    }
  },
  { timestamps: true }
);

RepositorySyncSchema.index({ repositoryId: 1, createdAt: -1 });

module.exports = mongoose.model('RepositorySync', RepositorySyncSchema);
