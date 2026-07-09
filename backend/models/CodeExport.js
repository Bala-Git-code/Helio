const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CodeExportSchema = new Schema(
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
    exportKind: {
      type: String,
      required: true
    },
    exportedName: {
      type: String
    },
    localSymbolId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeSymbol'
    },
    reExportSpecifier: {
      type: String
    },
    resolvedTargetId: {
      type: Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

CodeExportSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, sourceFilePath: 1 });

module.exports = mongoose.model('CodeExport', CodeExportSchema);
