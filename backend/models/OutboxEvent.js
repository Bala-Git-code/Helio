import mongoose from 'mongoose';

const outboxEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    index: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PUBLISHED', 'FAILED'],
    default: 'PENDING',
    index: true,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  lastError: {
    type: String,
    default: null,
  },
  processedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// High-frequency query compound index
outboxEventSchema.index({ status: 1, createdAt: 1 });

export const OutboxEvent = mongoose.model('OutboxEvent', outboxEventSchema);
export default OutboxEvent;
