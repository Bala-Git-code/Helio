const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CodeReferenceSchema = new Schema(
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
    sourceSymbolId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeSymbol'
    },
    sourceScopeId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeScope'
    },
    referenceKind: {
      type: String,
      required: true
    },
    referencedName: {
      type: String,
      required: true
    },
    startLine: {
      type: Number
    },
    endLine: {
      type: Number
    },
    resolutionStatus: {
      type: String,
      enum: ['RESOLVED', 'AMBIGUOUS', 'EXTERNAL', 'UNRESOLVED', 'DYNAMIC', 'UNSUPPORTED'],
      default: 'UNRESOLVED',
      index: true
    },
    resolvedSymbolId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeSymbol'
    },
    confidence: {
      type: String,
      enum: ['EXACT', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    resolverVersion: {
      type: String
    }
  },
  { timestamps: true }
);

CodeReferenceSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, filePath: 1 });
CodeReferenceSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, resolvedSymbolId: 1 });

module.exports = mongoose.model('CodeReference', CodeReferenceSchema);
