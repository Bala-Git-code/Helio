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
    vitalsHistory: [
      {
        weight: Number,
        height: Number,
        heartRate: Number,
        bloodPressure: String,
        temperature: Number,
        oxygenSaturation: Number,
        loggedAt: {
          type: Date,
          default: Date.now,
        },
      }
    ],
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

// Pre-save hook to generate unique accessCode if not present
PatientProfileSchema.pre('save', async function (next) {
  if (!this.accessCode) {
    let unique = false;
    let code = '';
    while (!unique) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `H-${randomPart}`;
      
      // Check uniqueness
      const existing = await this.constructor.findOne({ accessCode: code });
      if (!existing) {
        unique = true;
      }
    }
    this.accessCode = code;
  }
  next();
});

module.exports = mongoose.model('PatientProfile', PatientProfileSchema);
