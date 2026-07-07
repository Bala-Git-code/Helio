const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AiExecutionSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    taskType: {
      type: String,
      required: true,
      index: true
    },
    promptId: {
      type: String,
      index: true
    },
    promptVersion: {
      type: String
    },
    providerId: {
      type: String,
      required: true,
      index: true
    },
    modelId: {
      type: String,
      required: true,
      index: true
    },
    routingPolicyVersion: {
      type: String
    },
    status: {
      type: String,
      enum: ['PENDING', 'ROUTING', 'RATE_LIMITED', 'RUNNING', 'STREAMING', 'WAITING_FOR_TOOL', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'TIMED_OUT'],
      default: 'PENDING',
      index: true
    },
    executionMode: {
      type: String,
      enum: ['NON_STREAMING', 'STREAMING'],
      required: true
    },
    idempotencyKey: {
      type: String,
      index: true
    },
    requestFingerprint: {
      type: String,
      index: true
    },
    inputTokenEstimate: {
      type: Number,
      default: 0
    },
    inputTokens: {
      type: Number,
      default: 0
    },
    outputTokens: {
      type: Number,
      default: 0
    },
    cachedInputTokens: {
      type: Number,
      default: 0
    },
    reasoningTokens: {
      type: Number,
      default: 0
    },
    totalTokens: {
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
    currency: {
      type: String,
      default: 'USD'
    },
    startedAt: {
      type: Date
    },
    firstTokenAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    failedAt: {
      type: Date
    },
    durationMs: {
      type: Number,
      default: 0
    },
    timeToFirstTokenMs: {
      type: Number,
      default: 0
    },
    finishReason: {
      type: String
    },
    errorCode: {
      type: String
    },
    errorClassification: {
      type: String,
      index: true
    },
    providerRequestId: {
      type: String
    },
    traceId: {
      type: String,
      index: true
    },
    correlationId: {
      type: String,
      index: true
    },
    causationId: {
      type: String
    },
    toolCalls: [
      {
        toolName: { type: String, required: true },
        toolArgs: { type: Schema.Types.Mixed },
        result: { type: Schema.Types.Mixed },
        status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
        error: { type: String },
        startedAt: { type: Date },
        completedAt: { type: Date }
      }
    ],
    structuredValidationStatus: {
      type: String,
      enum: ['PENDING', 'VALID', 'INVALID', 'REPAIRED', 'FAILED'],
      default: 'PENDING'
    },
    repairAttempts: {
      type: Number,
      default: 0
    },
    cacheHit: {
      type: Boolean,
      default: false
    },
    tokensAvoidedEstimate: {
      type: Number,
      default: 0
    },
    costAvoidedEstimate: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Indexes for performance/query requirements
AiExecutionSchema.index({ tenantId: 1, createdAt: -1 });
AiExecutionSchema.index({ taskType: 1, createdAt: -1 });
AiExecutionSchema.index({ providerId: 1, modelId: 1, createdAt: -1 });
AiExecutionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('AiExecution', AiExecutionSchema);
