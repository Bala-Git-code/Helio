const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PromptTemplateDefinitionSchema = new Schema(
  {
    templateId: {
      type: String,
      required: true,
      index: true
    },
    templateVersion: {
      type: String,
      required: true,
      index: true
    },
    supportedIntents: [
      {
        type: String
      }
    ],
    requiredVariables: [
      {
        type: String
      }
    ],
    outputSchema: {
      type: Schema.Types.Mixed
    },
    modelRequirements: {
      type: Schema.Types.Mixed,
      default: {}
    },
    maximumContextPolicy: {
      type: Schema.Types.Mixed,
      default: {}
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true
    },
    content: {
      type: String,
      required: true
    },
    deprecatedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

PromptTemplateDefinitionSchema.index({ templateId: 1, templateVersion: 1 }, { unique: true });

module.exports = mongoose.model('PromptTemplateDefinition', PromptTemplateDefinitionSchema);
