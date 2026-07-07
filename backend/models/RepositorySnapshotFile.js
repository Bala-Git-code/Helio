const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositorySnapshotFileSchema = new Schema(
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
    sizeBytes: {
      type: Number,
      required: true
    },
    fileMode: {
      type: String
    },
    fileType: {
      type: String,
      enum: ['file', 'directory', 'symlink', 'submodule'],
      default: 'file'
    },
    language: {
      type: String
    },
    binary: {
      type: Boolean,
      default: false
    },
    generated: {
      type: Boolean,
      default: false
    },
    ignored: {
      type: Boolean,
      default: false
    },
    symlink: {
      type: Boolean,
      default: false
    },
    lfsPointer: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Compound index for querying a file's state in a snapshot
RepositorySnapshotFileSchema.index({ snapshotId: 1, path: 1 }, { unique: true });
RepositorySnapshotFileSchema.index({ repositoryId: 1, path: 1 });

module.exports = mongoose.model('RepositorySnapshotFile', RepositorySnapshotFileSchema);
