const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobStateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    nextRunAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    lockedUntil: {
      type: Date
    },
    lockedBy: {
      type: String
    },
    lastStatus: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobState', JobStateSchema);
