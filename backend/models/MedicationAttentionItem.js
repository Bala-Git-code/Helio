const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedicationAttentionItemSchema = new Schema(
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
    reason: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['High', 'Moderate'],
      default: 'Moderate'
    },
    evidence: String,
    status: {
      type: String,
      enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'],
      default: 'OPEN',
      index: true
    },
    cooldownUntil: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicationAttentionItem', MedicationAttentionItemSchema);
