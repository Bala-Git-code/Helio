import mongoose from 'mongoose';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Audit Log Model (models/AuditLog.js)
 * ============================================================================
 * 
 * HIPAA Compliance & Regulatory Purpose:
 * Strictly immutable audit ledger recording all patient pairing code lifecycles,
 * physician clinical access delegations, authentication events, and brute-force
 * lockout triggers.
 * 
 * Required Compliance Fields:
 * - action: Standardized audit action enum.
 * - userId: Initiating actor ID (patient, doctor, or system).
 * - targetUserId: Target entity ID affected by the delegation or action.
 * - code: Cryptographic pairing code reference (or masked code).
 * - status: Outcome status ('SUCCESS', 'FAILURE', 'BLOCKED').
 * - timestamp: Immutable ISO-8601 epoch timestamp.
 * 
 * Immutability Guarantee:
 * Pre-hooks reject any update, modification, or deletion operations once recorded.
 */

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Audit action identifier is required'],
      enum: {
        values: [
          'CODE_GENERATED',
          'REDEMPTION_SUCCESS',
          'REDEMPTION_FAILED',
          'REDEMPTION_LOCKED',
          'ACCESS_REVOKED',
          'USER_LOGIN',
          'USER_LOGOUT',
        ],
        message: '{VALUE} is not an authorized audit action',
      },
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Initiating user ID is required for audit provenance'],
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    code: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Audit status result is required'],
      enum: {
        values: ['SUCCESS', 'FAILURE', 'BLOCKED'],
        message: '{VALUE} is not a valid audit status',
      },
      index: true,
    },
    ip: {
      type: String,
      default: '127.0.0.1',
      trim: true,
    },
    userAgent: {
      type: String,
      default: 'Unknown Client',
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Enforce strict document immutability on Save
auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('[HELIO AUDIT FATAL] AuditLog records are strictly immutable. Modifications are rejected.'));
  }
  next();
});

// Reject all document update operations
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'findByIdAndUpdate'], function (next) {
  return next(new Error('[HELIO AUDIT FATAL] AuditLog records are strictly immutable. Updates are rejected.'));
});

// Reject all document delete operations to maintain unbroken regulatory chain-of-custody
auditLogSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete', 'findByIdAndDelete'], function (next) {
  return next(new Error('[HELIO AUDIT FATAL] AuditLog records cannot be deleted. Retention is enforced.'));
});

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
