const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CodeSegmentSchema = new Schema(
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
    segmentType: {
      type: String,
      required: true
    },
    name: {
      type: String
    },
    qualifiedName: {
      type: String
    },
    parentSegmentId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeSegment'
    },
    symbolId: {
      type: Schema.Types.ObjectId,
      ref: 'CodeSymbol'
    },
    startLine: {
      type: Number
    },
    endLine: {
      type: Number
    },
    startByte: {
      type: Number
    },
    endByte: {
      type: Number
    },
    contentHash: {
      type: String
    },
    tokenEstimate: {
      type: Number,
      default: 0
    },
    segmentationVersion: {
      type: String
    }
  },
  { timestamps: true }
);

CodeSegmentSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1, filePath: 1 });

module.exports = mongoose.model('CodeSegment', CodeSegmentSchema);
