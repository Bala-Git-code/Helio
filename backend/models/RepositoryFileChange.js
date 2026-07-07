const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryFileChangeSchema = new Schema(
  {
    changeSetId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryChangeSet',
      required: true,
      index: true
    },
    changeType: {
      type: String,
      enum: ['ADDED', 'MODIFIED', 'DELETED', 'RENAMED'],
      required: true,
      index: true
    },
    oldPath: {
      type: String
    },
    newPath: {
      type: String
    },
    oldContentHash: {
      type: String
    },
    newContentHash: {
      type: String
    },
    sizeDelta: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

RepositoryFileChangeSchema.index({ changeSetId: 1, changeType: 1 });

module.exports = mongoose.model('RepositoryFileChange', RepositoryFileChangeSchema);
