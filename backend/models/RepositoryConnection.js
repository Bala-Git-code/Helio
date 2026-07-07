const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryConnectionSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    providerId: {
      type: String,
      enum: ['github', 'gitlab', 'bitbucket'],
      required: true
    },
    installationId: {
      type: String,
      required: true
    },
    externalAccountId: {
      type: String
    },
    status: {
      type: String,
      enum: ['CONNECTED', 'DEGRADED', 'DISCONNECTED'],
      default: 'CONNECTED',
      index: true
    },
    credentialReference: {
      // Store reference to secure secret loader, e.g. token name in env or secret manager ID
      type: String,
      required: true
    },
    webhookRegistrationId: {
      type: String
    },
    webhookStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'FAILED'],
      default: 'ACTIVE'
    },
    lastValidatedAt: {
      type: Date,
      default: Date.now
    },
    lastSuccessfulSyncAt: {
      type: Date
    },
    lastFailedSyncAt: {
      type: Date
    },
    lastErrorCode: {
      type: String
    },
    createdBy: {
      type: String
    }
  },
  { timestamps: true }
);

RepositoryConnectionSchema.index({ tenantId: 1, providerId: 1 });

module.exports = mongoose.model('RepositoryConnection', RepositoryConnectionSchema);
