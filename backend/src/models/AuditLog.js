import mongoose from 'mongoose';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Audit Log Model (models/AuditLog.js)
 * ============================================================================
 * 
 * Compliance & Regulatory Purpose:
 * Strictly immutable audit ledger recording all patient pairing code lifecycles,
 * physician clinical access delegations, authentication events, and brute-force
 * lockout triggers.
 */

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'CODE_GENERATED',
        'REDEMPTION_SUCCESS',
        'REDEMPTION_FAILED',
        'REDEMPTION_LOCKED',
        'ACCESS_REVOKED',
        'USER_LOGIN',
        'USER_LOGOUT',
      ],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    codeMasked: {
      type: String,
      default: null,
      trim: true,
    },
    ip: {
      type: String,
      required: true,
      trim: true,
    },
    userAgent: {
      type: String,
      default: 'Unknown',
    },
    status: {
      type: String,
      required: true,
      enum: ['SUCCESS', 'FAILURE', 'BLOCKED'],
      index: true,
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

// Prevent updates to maintain immutability
auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('[HELIO AUDIT] AuditLog records are strictly immutable. Modifications are rejected.'));
  }
  next();
});

auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function (next) {
  return next(new Error('[HELIO AUDIT] AuditLog records are strictly immutable. Updates are rejected.'));
});

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
