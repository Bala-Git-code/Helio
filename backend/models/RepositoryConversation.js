const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryConversationSchema = new Schema(
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
    title: {
      type: String,
      default: 'New Conversation'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    defaultSnapshotPolicy: {
      type: String,
      enum: ['PINNED', 'LATEST_READY_PER_REQUEST', 'FOLLOW_LATEST_WITH_CHANGE_NOTICE'],
      default: 'LATEST_READY_PER_REQUEST'
    },
    pinnedSnapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot'
    },
    summary: {
      type: String
    },
    summaryVersion: {
      type: String,
      default: '1.0.0'
    },
    summaryThroughMessageId: {
      type: Schema.Types.ObjectId
    },
    createdBy: {
      type: String,
      required: true
    },
    archivedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

RepositoryConversationSchema.index({ tenantId: 1, repositoryId: 1, createdAt: -1 });

module.exports = mongoose.model('RepositoryConversation', RepositoryConversationSchema);
