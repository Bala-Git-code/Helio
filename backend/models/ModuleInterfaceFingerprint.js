const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ModuleInterfaceFingerprintSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    repositoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      index: true
    },
    snapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot',
      required: true,
      index: true
    },
    filePath: {
      type: String,
      required: true,
      index: true
    },
    fingerprint: {
      type: String,
      required: true
    },
    pipelineVersion: {
      type: String
    }
  },
  { timestamps: true }
);

ModuleInterfaceFingerprintSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, filePath: 1 });

module.exports = mongoose.model('ModuleInterfaceFingerprint', ModuleInterfaceFingerprintSchema);
