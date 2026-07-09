const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RateLimitRecordSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    count: {
      type: Number,
      default: 0
    },
    tokens: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index in MongoDB
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RateLimitRecord', RateLimitRecordSchema);
