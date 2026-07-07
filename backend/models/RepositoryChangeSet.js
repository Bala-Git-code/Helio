const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryChangeSetSchema = new Schema(
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
    baseSnapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot'
    },
    targetSnapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot',
      required: true
    },
    addedCount: {
      type: Number,
      default: 0
    },
    modifiedCount: {
      type: Number,
      default: 0
    },
    deletedCount: {
      type: Number,
      default: 0
    },
    renamedCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

RepositoryChangeSetSchema.index({ targetSnapshotId: 1 });

module.exports = mongoose.model('RepositoryChangeSet', RepositoryChangeSetSchema);
