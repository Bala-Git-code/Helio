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
    genericName: { type: String, default: '' },
    form: { type: String, default: 'tablet' },
    dosage: String,
    purpose: { type: String, default: '' },
    frequency: String,
    times: [String],
    startDate: Date,
    endDate: Date,
    ingredients: String,
    foodInstruction: { type: String, default: 'none' },
    specialInstructions: { type: String, default: '' },
    notes: String,
    active: { type: Boolean, default: true },
    quantity: { type: Number, default: 30 },
    refillThreshold: { type: Number, default: 5 },
    refillReminderEnabled: { type: Boolean, default: true },
    prescribingDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sourcePrescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation'
    },
    reminderPreferences: {
      channels: { type: [String], default: ['app'] },
      leadTimeMinutes: { type: Number, default: 0 },
      quietHoursStart: { type: String, default: '' },
      quietHoursEnd: { type: String, default: '' },
      followUpTimingMinutes: { type: Number, default: 15 },
      maxFollowUpAttempts: { type: Number, default: 3 }
    },
    scheduleVersion: { type: Number, default: 1 },
    scheduleHistory: [
      {
        version: Number,
        frequency: String,
        times: [String],
        changedAt: { type: Date, default: Date.now }
      }
    ],
    snoozedUntil: Date,
    snoozeDuration: Number,
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
