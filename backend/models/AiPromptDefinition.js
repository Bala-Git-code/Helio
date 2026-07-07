const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AiPromptDefinitionSchema = new Schema(
  {
    promptId: {
      type: String,
      required: true,
      index: true
    },
    version: {
      type: String,
      required: true,
      index: true
    },
    taskType: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String
    },
    template: {
      type: String, // E.g. "You are clinical assistant. Patient name: {{name}}..."
      required: true
    },
    inputSchema: {
      type: Schema.Types.Mixed // JSON Schema to validate inputs passed to the prompt builder
    },
    outputSchema: {
      type: Schema.Types.Mixed // Target JSON Schema if structured generation is required
    },
    deprecatedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Unique constraint on promptId + version
AiPromptDefinitionSchema.index({ promptId: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('AiPromptDefinition', AiPromptDefinitionSchema);
