const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AiTenantPolicySchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    enabledProviders: {
      type: [String],
      default: ['gemini']
    },
    enabledModels: {
      type: [String],
      default: ['gemini-1.5-flash', 'gemini-1.5-pro']
    },
    disabledModels: {
      type: [String],
      default: []
    },
    allowedTaskTypes: {
      type: [String],
      default: ['CLINICAL_SUMMARY', 'DRUG_INTERACTION', 'CHAT_ASSISTANCE', 'PRESCRIPTION_OCR']
    },
    monthlyBudget: {
      type: Number,
      default: 50.00 // USD default
    },
    dailyBudget: {
      type: Number,
      default: 5.00
    },
    monthlySpent: {
      type: Number,
      default: 0
    },
    dailySpent: {
      type: Number,
      default: 0
    },
    lastSpentResetDaily: {
      type: Date,
      default: Date.now
    },
    lastSpentResetMonthly: {
      type: Date,
      default: Date.now
    },
    perRequestCostLimit: {
      type: Number,
      default: 0.50
    },
    inputTokenLimit: {
      type: Number,
      default: 1000000
    },
    outputTokenLimit: {
      type: Number,
      default: 8192
    },
    requestsPerMinute: {
      type: Number,
      default: 60
    },
    tokensPerMinute: {
      type: Number,
      default: 1000000
    },
    concurrentExecutionLimit: {
      type: Number,
      default: 10
    },
    dataRetentionPolicy: {
      type: Schema.Types.Mixed,
      default: {
        retainFullExecutionDays: 30,
        retainMetadataDays: 365
      }
    },
    promptLoggingPolicy: {
      type: String,
      enum: ['NONE', 'METADATA_ONLY', 'FULL'],
      default: 'METADATA_ONLY'
    },
    responseLoggingPolicy: {
      type: String,
      enum: ['NONE', 'METADATA_ONLY', 'FULL'],
      default: 'METADATA_ONLY'
    },
    cachePolicy: {
      type: Schema.Types.Mixed,
      default: {
        enabled: true,
        defaultTtlSeconds: 3600
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AiTenantPolicy', AiTenantPolicySchema);
