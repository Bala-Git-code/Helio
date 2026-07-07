const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryParseResultSchema = new Schema(
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
    path: {
      type: String,
      required: true,
      index: true
    },
    contentHash: {
      type: String,
      required: true,
      index: true
    },
    language: {
      type: String
    },
    parserId: {
      type: String,
      required: true
    },
    parserVersion: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: true,
      index: true
    },
    diagnosticCount: {
      type: Number,
      default: 0
    },
    artifactReference: {
      type: Schema.Types.Mixed // reference to files in object/local storage
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    durationMs: {
      type: Number,
      default: 0
    },
    errorCode: {
      type: String
    }
  },
  { timestamps: true }
);

RepositoryParseResultSchema.index({ repositoryId: 1, path: 1, contentHash: 1 });
RepositoryParseResultSchema.index({ contentHash: 1, parserId: 1, parserVersion: 1 });

module.exports = mongoose.model('RepositoryParseResult', RepositoryParseResultSchema);
