const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const IdempotencyRecordSchema = new Schema(
  {
    tenantId: {
      type: String,
      index: true
    },
    scope: {
      type: String,
      required: true,
      index: true
    },
    key: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED'],
      default: 'IN_PROGRESS',
      index: true
    },
    resultReference: {
      type: Schema.Types.Mixed
    },
    failureMetadata: {
      type: Schema.Types.Mixed
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

// Unique index per tenant scope and key
IdempotencyRecordSchema.index({ tenantId: 1, scope: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('IdempotencyRecord', IdempotencyRecordSchema);
