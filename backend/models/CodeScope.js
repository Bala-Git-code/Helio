const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CodeScopeSchema = new Schema(
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
    scopeKind: {
      type: String,
      required: true
    },
    name: {
      type: String
    },
    parentScopeId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeScope'
    },
    ownerSymbolId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeSymbol'
    },
    startLine: {
      type: Number
    },
    endLine: {
      type: Number
    },
    depth: {
      type: Number,
      default: 0
    },
    scopeModelVersion: {
      type: String
    }
  },
  { timestamps: true }
);

CodeScopeSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, filePath: 1 });

module.exports = mongoose.model('CodeScope', CodeScopeSchema);
