const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryWebhookReceiptSchema = new Schema(
  {
    providerId: {
      type: String,
      required: true,
      index: true
    },
    deliveryId: {
      type: String,
      required: true,
      index: true
    },
    tenantId: {
      type: String,
      index: true
    },
    repositoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Repository',
      index: true
    },
    eventType: {
      type: String,
      required: true
    },
    signatureValidated: {
      type: Boolean,
      default: false
    },
    payloadHash: {
      type: String
    },
    receivedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
      index: true
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

// Unique compound index for provider + delivery ID deduplication
RepositoryWebhookReceiptSchema.index({ providerId: 1, deliveryId: 1 }, { unique: true });

module.exports = mongoose.model('RepositoryWebhookReceipt', RepositoryWebhookReceiptSchema);
