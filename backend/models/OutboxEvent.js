const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OutboxEventSchema = new Schema(
  {
    eventType: { 
      type: String, 
      required: true 
    },
    schemaVersion: { 
      type: Number, 
      default: 1 
    },
    aggregateType: { 
      type: String, 
      required: true 
    },
    aggregateId: { 
      type: String, 
      required: true 
    },
    patientScope: { 
      type: String, 
      index: true 
    },
    payload: { 
      type: Schema.Types.Mixed, 
      required: true 
    },
    correlationId: { 
      type: String, 
      required: true 
    },
    causationId: { 
      type: String, 
      required: true 
    },
    idempotencyKey: { 
      type: String, 
      unique: true, 
      required: true,
      index: true
    },
    availableAt: { 
      type: Date, 
      default: Date.now, 
      index: true 
    },
    processingState: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'dead-letter'],
      default: 'pending',
      index: true
    },
    attemptCount: { 
      type: Number, 
      default: 0 
    },
    leaseOwner: { 
      type: String 
    },
    leaseExpiration: { 
      type: Date 
    },
    processedAt: { 
      type: Date 
    },
    lastError: { 
      type: String 
    }
  },
  { timestamps: true }
);

OutboxEventSchema.index({ processingState: 1, availableAt: 1 });

module.exports = mongoose.model('OutboxEvent', OutboxEventSchema);
