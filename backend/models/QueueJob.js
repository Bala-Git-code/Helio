const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QueueJobSchema = new Schema(
  {
    tenantId: {
      type: String,
      index: true
    },
    queueName: {
      type: String,
      required: true,
      index: true
    },
    jobType: {
      type: String,
      required: true,
      index: true
    },
    schemaVersion: {
      type: Number,
      default: 1
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true
    },
    priority: {
      type: Number,
      default: 0,
      index: true
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'QUEUED',
        'CLAIMED',
        'RUNNING',
        'RETRY_SCHEDULED',
        'SUCCEEDED',
        'FAILED',
        'DEAD_LETTERED',
        'CANCELLATION_REQUESTED',
        'CANCELLED'
      ],
      default: 'PENDING',
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    runAt: {
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
    cancelledAt: {
      type: Date
    },
    deadLetteredAt: {
      type: Date
    },
    executionTimeoutMs: {
      type: Number,
      default: 30000
    },
    lockedBy: {
      type: String,
      index: true
    },
    lockedUntil: {
      type: Date,
      index: true
    },
    leaseToken: {
      type: String
    },
    lastHeartbeatAt: {
      type: Date
    },
    lastError: {
      type: String
    },
    lastErrorCode: {
      type: String
    },
    lastErrorClassification: {
      type: String
    },
    correlationId: {
      type: String
    },
    causationId: {
      type: String
    },
    idempotencyKey: {
      type: String,
      index: true
    },
    createdBy: {
      type: String
    },
    result: {
      type: Schema.Types.Mixed
    },
    resultVersion: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

// Compound indexes for fast recovery and scheduling
QueueJobSchema.index({ queueName: 1, status: 1, runAt: 1, priority: -1 });

// Compound unique sparse index for tenant-scoped idempotency
QueueJobSchema.index(
  { tenantId: 1, jobType: 1, idempotencyKey: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('QueueJob', QueueJobSchema);
