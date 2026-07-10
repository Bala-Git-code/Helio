const RetrievedContentRiskAssessment = require('../../models/RetrievedContentRiskAssessment');
const { baseLogger } = require('../medication/observability');

class RetrievedContentSecurityAnalyzer {
  constructor() {
    this.logger = baseLogger.child({ service: 'helio-security-analyzer' });
    this.securityVersion = '1.0.0';

    this.patterns = [
      {
        name: 'IGNORE_INSTRUCTIONS',
        regex: /ignore\s+previous\s+instructions/i,
        risk: 'HIGH',
        action: 'EXCLUDE_DOCUMENT'
      },
      {
        name: 'IGNORE_SYSTEM',
        regex: /ignore\s+system\s+(instructions|prompt|rules)/i,
        risk: 'HIGH',
        action: 'EXCLUDE_DOCUMENT'
      },
      {
        name: 'OVERRIDE_SYSTEM',
        regex: /override\s+system\s+(instructions|prompt|rules)/i,
        risk: 'HIGH',
        action: 'EXCLUDE_DOCUMENT'
      },
      {
        name: 'ROLEPLAY_ADMIN',
        regex: /you\s+are\s+now\s+a\s+(system|administrator|root)/i,
        risk: 'MEDIUM',
        action: 'ALLOW_WITH_STRONG_DELIMITERS'
      },
      {
        name: 'EXPOSE_SECRETS',
        regex: /reveal\s+secrets|print\s+(environment|env\b|secrets)|expose\s+keys/i,
        risk: 'CRITICAL',
        action: 'FAIL_REQUEST'
      },
      {
        name: 'SHELL_EXECUTION',
        regex: /execute\s+shell|run\s+command|spawn\s+process/i,
        risk: 'MEDIUM',
        action: 'ALLOW_WITH_STRONG_DELIMITERS'
      },
      {
        name: 'FABRICATE_CITATIONS',
        regex: /fabricate\s+citations|fake\s+citations/i,
        risk: 'HIGH',
        action: 'EXCLUDE_DOCUMENT'
      }
    ];
  }

  async analyze(executionId, documents) {
    this.logger.info('retrieval.security.analyzing', 'Starting retrieved content risk assessment.', { executionId });

    const assessments = [];
    let overallAction = 'ALLOW_AS_UNTRUSTED_EVIDENCE';

    for (const doc of documents) {
      const content = doc.content || '';
      const signals = [];
      let riskLevel = 'NONE';
      let policyAction = 'ALLOW_AS_UNTRUSTED_EVIDENCE';

      for (const pattern of this.patterns) {
        if (pattern.regex.test(content)) {
          signals.push(pattern.name);
          
          // Elevate risk level
          if (pattern.risk === 'CRITICAL') riskLevel = 'CRITICAL';
          else if (pattern.risk === 'HIGH' && riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
          else if (pattern.risk === 'MEDIUM' && riskLevel !== 'CRITICAL' && riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
          else if (pattern.risk === 'LOW' && riskLevel === 'NONE') riskLevel = 'LOW';

          // Elevate action
          if (pattern.action === 'FAIL_REQUEST') policyAction = 'FAIL_REQUEST';
          else if (pattern.action === 'EXCLUDE_DOCUMENT' && policyAction !== 'FAIL_REQUEST') policyAction = 'EXCLUDE_DOCUMENT';
          else if (pattern.action === 'ALLOW_WITH_STRONG_DELIMITERS' && policyAction !== 'FAIL_REQUEST' && policyAction !== 'EXCLUDE_DOCUMENT') policyAction = 'ALLOW_WITH_STRONG_DELIMITERS';
        }
      }

      // Save assessment to database
      const assessment = await RetrievedContentRiskAssessment.create({
        executionId,
        documentId: doc.documentId || doc._id,
        riskLevel,
        signals,
        policyAction,
        securityVersion: this.securityVersion
      });

      assessments.push(assessment);

      if (policyAction === 'FAIL_REQUEST') {
        overallAction = 'FAIL_REQUEST';
      } else if (policyAction === 'EXCLUDE_DOCUMENT' && overallAction !== 'FAIL_REQUEST') {
        overallAction = 'EXCLUDE_DOCUMENT';
      } else if (policyAction === 'ALLOW_WITH_STRONG_DELIMITERS' && overallAction !== 'FAIL_REQUEST' && overallAction !== 'EXCLUDE_DOCUMENT') {
        overallAction = 'ALLOW_WITH_STRONG_DELIMITERS';
      }
    }

    this.logger.info('retrieval.security.completed', 'Security assessment completed.', {
      executionId,
      overallAction,
      criticalCount: assessments.filter(a => a.riskLevel === 'CRITICAL').length
    });

    return {
      assessments,
      overallAction
    };
  }

  escapeEvidence(content) {
    if (!content) return '';
    // Escape XML tag boundaries to prevent prompt escaping
    return content
      .replace(/<\/repository_evidence>/g, '&lt;/repository_evidence&gt;')
      .replace(/<repository_evidence[^>]*>/g, '&lt;repository_evidence&gt;');
  }
}

module.exports = new RetrievedContentSecurityAnalyzer();
