const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositorySnapshotSchema = new Schema(
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
    sourceRevision: {
      type: String, // commit SHA
      required: true,
      index: true
    },
    sourceRef: {
      type: String
    },
    parentSnapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot'
    },
    snapshotType: {
      type: String,
      enum: ['FULL', 'INCREMENTAL'],
      default: 'FULL'
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    fileCount: {
      type: Number,
      default: 0
    },
    processableFileCount: {
      type: Number,
      default: 0
    },
    totalBytes: {
      type: Number,
      default: 0
    },
    processableBytes: {
      type: Number,
      default: 0
    },
    manifestHash: {
      type: String
    },
    pipelineVersion: {
      type: String,
      default: '1.0.0'
    },
    completedAt: {
      type: Date
    },
    failedAt: {
      type: Date
    },
    errorCode: {
      type: String
    }
  },
  { timestamps: true }
);

RepositorySnapshotSchema.index({ repositoryId: 1, sourceRevision: 1 }, { unique: true });

module.exports = mongoose.model('RepositorySnapshot', RepositorySnapshotSchema);
