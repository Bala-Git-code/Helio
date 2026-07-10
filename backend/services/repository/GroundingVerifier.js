const AiExecutionEngine = require('../ai/AiExecutionEngine');
const { baseLogger } = require('../medication/observability');

class GroundingVerifier {
  constructor() {
    this.logger = baseLogger.child({ service: 'helio-grounding-verifier' });
    this.verifierVersion = '1.0.0';
  }

  async verify(params) {
    const {
      tenantId,
      answer,
      claims = [],
      citations = [],
      validCitations = [],
      evidence,
      mode = 'DETERMINISTIC'
    } = params;

    this.logger.info('grounding.verification.started', 'Running grounding checks.', {
      tenantId,
      claimsCount: claims.length,
      mode
    });

    // 1. Deterministic Checks
    const { status: detStatus, coverage, checkedClaims } = this._runDeterministic(claims, citations, validCitations, evidence);

    if (mode === 'DETERMINISTIC' || claims.length === 0) {
      return {
        status: detStatus,
        citationCoverage: coverage,
        claims: checkedClaims
      };
    }

    // 2. Model-Assisted Grounding Verification
    try {
      const result = await this._runModelAssisted(tenantId, answer, checkedClaims, evidence);
      return {
        status: result.status,
        citationCoverage: coverage,
        claims: result.claims
      };
    } catch (err) {
      this.logger.warn('grounding.verification.model_failed', `Model grounding verification failed: ${err.message}. Falling back to deterministic results.`);
      return {
        status: detStatus,
        citationCoverage: coverage,
        claims: checkedClaims
      };
    }
  }

  _runDeterministic(claims, citations, validCitations, evidence) {
    let supportedCount = 0;
    let unsupportedCount = 0;

    const validProvenanceIds = new Set(validCitations.map(vc => vc.provenanceId));

    const checkedClaims = claims.map(c => {
      // Map claim to its citations
      const claimCits = citations.filter(cit => cit.claimIds && cit.claimIds.includes(c.claimId));
      const hasValidCitation = claimCits.some(cit => validProvenanceIds.has(cit.provenanceId));

      let supportStatus = 'UNSUPPORTED';
      if (c.claimType === 'INFERENCE' || c.claimType === 'RECOMMENDATION') {
        supportStatus = 'SUPPORTED'; // Inference or recommendations do not strictly require code provenance
      } else if (hasValidCitation) {
        supportStatus = 'SUPPORTED';
      }

      if (supportStatus === 'SUPPORTED') {
        supportedCount++;
      } else {
        unsupportedCount++;
      }

      return {
        ...c,
        supportStatus
      };
    });

    const totalClaims = claims.length;
    const coverage = totalClaims > 0 ? (supportedCount / totalClaims) : 1.0;

    let status = 'VERIFIED';
    if (totalClaims === 0) {
      status = 'INSUFFICIENT_EVIDENCE';
    } else if (unsupportedCount === totalClaims) {
      status = 'UNSUPPORTED';
    } else if (unsupportedCount > 0) {
      status = 'PARTIALLY_SUPPORTED';
    }

    return {
      status,
      coverage,
      checkedClaims
    };
  }

  async _runModelAssisted(tenantId, answer, claims, evidence) {
    // Collect raw context texts
    const evidenceTexts = (evidence.items || []).map(item => `[Doc ID: ${item.logicalDocumentId} (${item.filePath})]\n${item.content}`).join('\n\n');

    const prompt = `
You are a rigorous Grounding Verification Agent.
You must verify if each of the following claims is supported by the repository evidence supplied.
Evidence:
${evidenceTexts}

Proposed Answer:
${answer}

Claims to Verify:
${JSON.stringify(claims.map(c => ({ claimId: c.claimId, text: c.text })), null, 2)}

Output JSON format matching this schema:
{
  "claims": [
    {
      "claimId": "string",
      "supportStatus": "SUPPORTED" | "PARTIALLY_SUPPORTED" | "UNSUPPORTED",
      "verificationReason": "string"
    }
  ]
}
Do not include markdown packaging.
`;

    const responseText = await AiExecutionEngine.execute({
      tenantId,
      userId: 'system',
      taskType: 'REPOSITORY_QA',
      messages: [{ role: 'user', parts: [{ text: prompt }] }],
      maxOutputTokens: 2000,
      structuredOutput: {
        schema: {
          type: 'object',
          properties: {
            claims: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  claimId: { type: 'string' },
                  supportStatus: { type: 'string', enum: ['SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNSUPPORTED'] },
                  verificationReason: { type: 'string' }
                },
                required: ['claimId', 'supportStatus', 'verificationReason']
              }
            }
          },
          required: ['claims']
        }
      }
    });

    const parsed = JSON.parse(responseText);
    let unsupported = 0;

    const mergedClaims = claims.map(c => {
      const verification = (parsed.claims || []).find(v => v.claimId === c.claimId);
      if (verification) {
        if (verification.supportStatus !== 'SUPPORTED') {
          unsupported++;
        }
        return {
          ...c,
          supportStatus: verification.supportStatus,
          verificationReason: verification.verificationReason
        };
      }
      return c;
    });

    let status = 'VERIFIED';
    if (unsupported === claims.length) status = 'UNSUPPORTED';
    else if (unsupported > 0) status = 'PARTIALLY_SUPPORTED';

    return {
      status,
      claims: mergedClaims
    };
  }
}

module.exports = new GroundingVerifier();
