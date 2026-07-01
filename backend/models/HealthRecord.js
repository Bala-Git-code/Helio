const mongoose = require('mongoose');

const HealthRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['lab', 'note', 'vitals', 'summary', 'prescription'],
      required: true,
    },
    title: { type: String, required: true },
    summary: String,
    date: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model('HealthRecord', HealthRecordSchema);
