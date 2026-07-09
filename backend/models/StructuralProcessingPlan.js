const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StructuralProcessingPlanSchema = new Schema(
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
    snapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot',
      required: true,
      index: true
    },
    baseSnapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositorySnapshot'
    },
    processingMode: {
      type: String,
      enum: ['FULL', 'INCREMENTAL'],
      required: true
    },
    changedFiles: [{ type: String }],
    deletedFiles: [{ type: String }],
    renamedFiles: [
      {
        oldPath: { type: String },
        newPath: { type: String }
      }
    ],
    reusableFiles: [{ type: String }],
    directlyInvalidatedFiles: [{ type: String }],
    transitivelyInvalidatedFiles: [{ type: String }],
    pipelineVersions: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

StructuralProcessingPlanSchema.index({ tenantId: 1, repositoryId: 1, snapshotId: 1 });

module.exports = mongoose.model('StructuralProcessingPlan', StructuralProcessingPlanSchema);
