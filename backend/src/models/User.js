import mongoose from 'mongoose';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * User Schema & Identity Model (models/User.js)
 * ============================================================================
 * 
 * Strict Identity Rules:
 * - Google OAuth 2.0 is the sole identity provider.
 * - Zero passwords, zero JWT tokens stored.
 * - Enforces role separation: 'patient' vs 'doctor'.
 * - Tracks clinical access delegations (assignedDoctors <-> assignedPatients).
 */

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor'],
      default: 'patient',
      index: true,
    },
    // Patient-specific clinical fields
    condition: {
      type: String,
      default: 'Type 2 Diabetes & Hypertension',
    },
    adherenceRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 94,
    },
    streakDays: {
      type: Number,
      default: 14,
    },
    assignedDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Doctor-specific clinical fields
    specialty: {
      type: String,
      default: 'Clinical Pharmacotherapy & Cardiology',
    },
    npi: {
      type: String,
      default: null,
      trim: true,
    },
    assignedPatients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for active patients count on doctor documents
userSchema.virtual('activePatientsCount').get(function () {
  return this.assignedPatients ? this.assignedPatients.length : 0;
});

// JSON serialization formatting
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
