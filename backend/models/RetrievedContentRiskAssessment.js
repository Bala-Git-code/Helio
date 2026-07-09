const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RetrievedContentRiskAssessmentSchema = new Schema(
  {
    executionId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryAIExecution',
      required: true,
      index: true
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'RepositoryRetrievalDocument',
      required: true
    },
    riskLevel: {
      type: String,
      enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
      index: true
    },
    signals: [
      {
        type: String
      }
    ],
    policyAction: {
      type: String,
      enum: ['ALLOW_AS_UNTRUSTED_EVIDENCE', 'ALLOW_WITH_STRONG_DELIMITERS', 'EXCLUDE_DOCUMENT', 'REDUCE_CONTENT_TO_SAFE_EXCERPT', 'FAIL_REQUEST'],
      required: true
    },
    securityVersion: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RetrievedContentRiskAssessment', RetrievedContentRiskAssessmentSchema);
