const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QueueJobSchema = new Schema(
  {
    queueName: {
      type: String,
      required: true,
      index: true
    },
    jobType: {
      type: String,
      required: true
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
      enum: ['pending', 'processing', 'completed', 'failed', 'dead-letter'],
      default: 'pending',
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
    lockedBy: {
      type: String
    },
    lockedUntil: {
      type: Date,
      index: true
    },
    lastError: {
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
      unique: true,
      sparse: true,
      index: true
    }
  },
  { timestamps: true }
);

QueueJobSchema.index({ queueName: 1, status: 1, runAt: 1, priority: -1 });

module.exports = mongoose.model('QueueJob', QueueJobSchema);
