const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RefillLedgerEventSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    medicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Medication',
      required: true,
      index: true
    },
    quantityDelta: {
      type: Number,
      required: true
    },
    action: {
      type: String,
      enum: ['INITIAL_SUPPLY', 'REFILL_ADDED', 'DOSE_CONSUMED_CONFIRMED', 'MANUAL_ADJUSTMENT', 'MEDICINE_LOST'],
      required: true
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: String,
    idempotencyKey: {
      type: String,
      unique: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RefillLedgerEvent', RefillLedgerEventSchema);
