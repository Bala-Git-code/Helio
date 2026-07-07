const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AiPricingDefinitionSchema = new Schema(
  {
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
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    effectiveTo: {
      type: Date
    },
    inputTokenPrice: {
      type: Number, // Price per 1 token (e.g. 0.00000015 for $0.15/M)
      required: true
    },
    outputTokenPrice: {
      type: Number, // Price per 1 token
      required: true
    },
    cachedInputTokenPrice: {
      type: Number, // Price per 1 cached token
      default: 0
    },
    reasoningTokenPrice: {
      type: Number, // Price per 1 reasoning token
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  { timestamps: true }
);

AiPricingDefinitionSchema.index({ providerId: 1, modelId: 1, effectiveFrom: -1 });

module.exports = mongoose.model('AiPricingDefinition', AiPricingDefinitionSchema);
