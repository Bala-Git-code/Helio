const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RepositoryAIExecutionSchema = new Schema(
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
      index: true
    },
    userMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryConversationMessage',
      index: true
    },
    snapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot',
      required: true,
      index: true
    },
    structuralIndexId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryStructuralIndex',
      required: true
    },
    retrievalIndexId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryRetrievalIndex',
      required: true
    },
    sourceRevision: {
      type: String,
      required: true
    },
    intent: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'VALIDATING',
        'RESOLVING_POLICY',
        'RESOLVING_SNAPSHOT',
        'CLASSIFYING_INTENT',
        'PLANNING_CONTEXT',
        'RETRIEVING',
        'SECURITY_FILTERING',
        'ASSEMBLING_PROMPT',
        'EXECUTING_MODEL',
        'VALIDATING_OUTPUT',
        'VALIDATING_CITATIONS',
        'VERIFYING_GROUNDING',
        'REPAIRING',
        'COMPLETED',
        'DEGRADED',
        'FAILED',
        'CANCELLED'
      ],
      default: 'PENDING',
      index: true
    },
    providerId: {
      type: String
    },
    modelId: {
      type: String
    },
    retrievalPolicyId: {
      type: String
    },
    promptTemplateVersion: {
      type: String
    },
    orchestrationVersion: {
      type: String,
      default: '1.0.0'
    },
    inputTokenEstimate: {
      type: Number,
      default: 0
    },
    retrievedContextTokens: {
      type: Number,
      default: 0
    },
    conversationContextTokens: {
      type: Number,
      default: 0
    },
    actualInputTokens: {
      type: Number,
      default: 0
    },
    actualOutputTokens: {
      type: Number,
      default: 0
    },
    estimatedCost: {
      type: Number,
      default: 0
    },
    actualCost: {
      type: Number,
      default: 0
    },
    citationCount: {
      type: Number,
      default: 0
    },
    validatedCitationCount: {
      type: Number,
      default: 0
    },
    groundingStatus: {
      type: String,
      enum: ['VERIFIED', 'PARTIALLY_SUPPORTED', 'INSUFFICIENT_EVIDENCE', 'CONFLICTING_EVIDENCE', 'UNSUPPORTED', 'VERIFICATION_FAILED'],
      index: true
    },
    qualityStatus: {
      type: String
    },
    repairAttempts: {
      type: Number,
      default: 0
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    failedAt: {
      type: Date
    },
    errorCode: {
      type: String
    },
    traceId: {
      type: String,
      index: true
    },
    correlationId: {
      type: String,
      index: true
    }
  },
  { timestamps: true }
);

RepositoryAIExecutionSchema.index({ repositoryId: 1, status: 1 });
RepositoryAIExecutionSchema.index({ tenantId: 1, conversationId: 1 });

module.exports = mongoose.model('RepositoryAIExecution', RepositoryAIExecutionSchema);
