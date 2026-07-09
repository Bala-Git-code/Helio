const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CodeImportSchema = new Schema(
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
    sourceFilePath: {
      type: String,
      required: true,
      index: true
    },
    importKind: {
      type: String,
      required: true
    },
    rawSpecifier: {
      type: String,
      required: true
    },
    normalizedSpecifier: {
      type: String
    },
    importedName: {
      type: String
    },
    localName: {
      type: String
    },
    startLine: {
      type: Number
    },
    endLine: {
      type: Number
    },
    resolutionStatus: {
      type: String,
      enum: ['RESOLVED', 'AMBIGUOUS', 'EXTERNAL', 'UNRESOLVED', 'DYNAMIC'],
      default: 'UNRESOLVED',
      index: true
    },
    resolvedTargetId: {
      type: Schema.Types.Mixed // Could be Object ID of a file or symbol, or string if external package
    }
  },
  { timestamps: true }
);

CodeImportSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, sourceFilePath: 1 });

module.exports = mongoose.model('CodeImport', CodeImportSchema);
