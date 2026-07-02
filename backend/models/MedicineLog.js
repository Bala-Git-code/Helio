const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedicineLogSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      required: true,
      index: true
    },
    timeSlot: {
      type: String,
      required: true
    },
    takenAt: {
      type: Date,
      default: Date.now
    },
    delayMinutes: {
      type: Number,
      default: 0
    },
    skipped: {
      type: Boolean,
      default: false
    },
    reason: {
      type: String
    },
    source: {
      type: String,
      enum: ['manual', 'voice', 'reminder', 'doctor'],
      default: 'manual'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicineLog', MedicineLogSchema);
