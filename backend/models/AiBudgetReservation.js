const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AiBudgetReservationSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    executionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    reservedAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['RESERVED', 'RECONCILED', 'EXPIRED'],
      default: 'RESERVED',
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AiBudgetReservation', AiBudgetReservationSchema);
