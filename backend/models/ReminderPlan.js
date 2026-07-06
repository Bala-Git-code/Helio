const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReminderPlanSchema = new Schema(
  {
    doseInstanceId: {
      type: Schema.Types.ObjectId,
      ref: 'DoseInstance',
      required: true,
      unique: true,
      index: true
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    scheduledTime: {
      type: Date,
      required: true
    },
    nextActionAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PRIMARY_SENT', 'FOLLOWUP_SENT', 'COMPLETED', 'FAILED', 'SNOOZED'],
      default: 'PENDING',
      index: true
    },
    primaryChannel: {
      type: String,
      default: 'app'
    },
    attemptsCount: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    quietHoursApplied: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReminderPlan', ReminderPlanSchema);
