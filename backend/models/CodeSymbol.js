const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CodeSymbolSchema = new Schema(
  {
    logicalSymbolId: {
      type: String,
      required: true,
      index: true
    },
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
    language: {
      type: String
    },
    symbolKind: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    qualifiedName: {
      type: String,
      index: true
    },
    signature: {
      type: String
    },
    visibility: {
      type: String,
      default: 'public'
    },
    declarationSegmentId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeSegment'
    },
    scopeId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeScope'
    },
    parentSymbolId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeSymbol'
    },
    startLine: {
      type: Number
    },
    endLine: {
      type: Number
    },
    contentHash: {
      type: String
    },
    adapterId: {
      type: String
    },
    adapterVersion: {
      type: String
    }
  },
  { timestamps: true }
);

CodeSymbolSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, logicalSymbolId: 1 });
CodeSymbolSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, qualifiedName: 1 });

module.exports = mongoose.model('CodeSymbol', CodeSymbolSchema);
