const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryConversationMessageSchema = new Schema(
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
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryConversation',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'model', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    contentReference: {
      type: Schema.Types.Mixed
    },
    contentHash: {
      type: String
    },
    estimatedTokens: {
      type: Number,
      default: 0
    },
    snapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot'
    },
    aiExecutionId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryAIExecution'
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

RepositoryConversationMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('RepositoryConversationMessage', RepositoryConversationMessageSchema);
