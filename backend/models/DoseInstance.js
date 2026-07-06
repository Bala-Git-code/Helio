const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DoseInstanceSchema = new Schema(
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
    scheduleVersion: {
      type: Number,
      default: 1
    },
    expectedTime: {
      type: Date,
      required: true,
      index: true
    },
    localTime: {
      type: String,
      required: true
    },
    timezone: {
      type: String,
      required: true
    },
    dosage: String,
    form: String,
    status: {
      type: String,
      enum: [
        'SCHEDULED',
        'UPCOMING',
        'DUE',
        'REMINDER_SENT',
        'PENDING_CONFIRMATION',
        'SNOOZED',
        'TAKEN_ON_TIME',
        'TAKEN_LATE',
        'SKIPPED',
        'MISSED',
        'CANCELLED',
        'SCHEDULE_CHANGED',
        'PROCESSING_ERROR'
      ],
      default: 'SCHEDULED',
      index: true
    },
    takenAt: Date,
    delayMinutes: {
      type: Number,
      default: 0
    },
    skipReason: String,
    notes: String,
    idempotencyKey: {
      type: String,
      unique: true,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoseInstance', DoseInstanceSchema);
