const mongoose = require('mongoose');

const PatientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    displayName: String,
    dateOfBirth: Date,
    phone: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    bloodType: String,
    allergies: [String],
    conditions: [String],
    familyMembers: [
      {
        name: String,
        relationship: String,
        phone: String,
      },
    ],
    doctorAccess: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    accessCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    vitals: {
      weight: Number,
      height: Number,
      heartRate: Number,
      bloodPressure: String,
      temperature: Number,
      oxygenSaturation: Number,
    },
    healthScore: {
      type: Number,
      default: 84,
      min: 0,
      max: 100,
    },
    carePlan: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('PatientProfile', PatientProfileSchema);
