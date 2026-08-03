import mongoose from 'mongoose';

const queueJobSchema = new mongoose.Schema({
  jobType: {
    type: String,
    required: true,
    index: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRY'],
    default: 'PENDING',
    index: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 5,
  },
  lastError: {
    type: String,
    default: null,
  },
  lockedAt: {
    type: Date,
    default: null,
  },
  lockTimeout: {
    type: Date,
    default: null,
  },
  runAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

queueJobSchema.index({ status: 1, runAt: 1, lockedAt: 1 });

export const QueueJob = mongoose.model('QueueJob', queueJobSchema);
export default QueueJob;
