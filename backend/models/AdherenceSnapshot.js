const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdherenceSnapshotSchema = new Schema(
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
      index: true
    },
    adherenceScore: {
      type: Number,
      required: true
    },
    takenCount: {
      type: Number,
      default: 0
    },
    targetCount: {
      type: Number,
      default: 0
    },
    calculationRuleVersion: {
      type: Number,
      default: 1
    },
    snapshotDate: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

AdherenceSnapshotSchema.index({ patientId: 1, snapshotDate: -1 });

module.exports = mongoose.model('AdherenceSnapshot', AdherenceSnapshotSchema);
