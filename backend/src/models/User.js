import mongoose from 'mongoose';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * User Schema & Identity Model (models/User.js)
 * ============================================================================
 * 
 * Strict Zero-Password Identity Architecture:
 * - Google OAuth 2.0 is the sole authentication provider.
 * - Zero stored passwords, zero JWT tokens.
 * - Enforces role-based clinical authorization: 'patient' vs. 'doctor'.
 * - Manages bidirectional clinical pairing:
 *     - Patients maintain references to verified `assignedDoctors`.
 *     - Physicians maintain references to active `assignedPatients`.
 */

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: [true, 'Google ID is mandatory for federated authentication'],
      unique: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid clinical email address'],
    },
    name: {
      type: String,
      required: [true, 'Full legal or display name is required'],
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['patient', 'doctor'],
        message: '{VALUE} is not an authorized HELIO clinical role',
      },
      default: 'patient',
      required: true,
      index: true,
    },

    // ------------------------------------------------------------------------
    // Patient Profile & Clinical Telemetry
    // ------------------------------------------------------------------------
    condition: {
      type: String,
      default: 'Type 2 Diabetes & Hypertension',
      trim: true,
    },
    adherenceRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 94,
    },
    streakDays: {
      type: Number,
      min: 0,
      default: 14,
    },
    assignedDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // ------------------------------------------------------------------------
    // Physician Credentials & Cohort
    // ------------------------------------------------------------------------
    specialty: {
      type: String,
      default: 'Clinical Pharmacotherapy & Cardiology',
      trim: true,
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

    // ------------------------------------------------------------------------
    // Telemetry & Security Auditing
    // ------------------------------------------------------------------------
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual property for active patient count on physician documents
userSchema.virtual('activePatientsCount').get(function () {
  return Array.isArray(this.assignedPatients) ? this.assignedPatients.length : 0;
});

// JSON formatting transform to clean internal MongoDB properties
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
