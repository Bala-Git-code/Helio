const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReminderAttemptSchema = new Schema(
  {
    reminderPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'ReminderPlan',
      required: true,
      index: true
    },
    channel: {
      type: String,
      required: true
    },
    providerMessageId: {
      type: String,
      index: true
    },
    deliveryStatus: {
      type: String,
      enum: ['QUEUED', 'SUBMITTED', 'ACCEPTED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'UNKNOWN'],
      default: 'QUEUED',
      index: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    error: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReminderAttempt', ReminderAttemptSchema);
