const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InboxRecordSchema = new Schema(
  {
    consumerName: {
      type: String,
      required: true
    },
    eventId: {
      type: String,
      required: true
    },
    processedAt: {
      type: Date,
      default: Date.now
    },
    outcome: {
      type: String
    },
    retryable: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

InboxRecordSchema.index({ consumerName: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('InboxRecord', InboxRecordSchema);
