const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobAttemptSchema = new Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueJob',
      required: true,
      index: true
    },
    tenantId: {
      type: String,
      index: true
    },
    attemptNumber: {
      type: Number,
      required: true
    },
    workerId: {
      type: String,
      index: true
    },
    leaseTokenHash: {
      type: String
    },
    status: {
      type: String,
      required: true,
      index: true
    },
    startedAt: {
      type: Date,
      required: true
    },
    completedAt: {
      type: Date
    },
    durationMs: {
      type: Number
    },
    errorCode: {
      type: String
    },
    errorClassification: {
      type: String,
      index: true
    },
    sanitizedErrorMessage: {
      type: String
    },
    traceId: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobAttempt', JobAttemptSchema);
