const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    dosage: String,
    frequency: String,
    times: [String],
    startDate: Date,
    endDate: Date,
    ingredients: String,
    notes: String,
    active: { type: Boolean, default: true },
    quantity: { type: Number, default: 30 },
    refillThreshold: { type: Number, default: 5 },
    adherenceLogs: [
      {
        takenAt: { type: Date, default: Date.now },
        timeSlot: String
      }
    ],
    adherence: {
      taken: { type: Number, default: 0 },
      target: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medication', MedicationSchema);
