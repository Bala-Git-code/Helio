const { baseLogger } = require('../medication/observability');

class CitationValidationService {
  constructor() {
    this.logger = baseLogger.child({ service: 'helio-citation-validator' });
    this.citationValidationVersion = '1.0.0';
  }

  validate(citations, evidence, activeContext) {
    const { tenantId, repositoryId, snapshotId, retrievalIndexId } = activeContext;

    this.logger.info('citation.validation.started', 'Validating citations against supplied evidence context.', {
      tenantId,
      repositoryId,
      snapshotId,
      citationCount: citations.length
    });

    const validCitations = [];
    const invalidCitations = [];

    // Create lookup map of supplied provenance IDs from the evidence manifest
    const suppliedProvenanceMap = new Map();
    if (evidence && evidence.provenanceManifest) {
      evidence.provenanceManifest.forEach(prov => {
        suppliedProvenanceMap.set(prov.provenanceId, prov);
      });
    }

    for (const cit of citations) {
      const { citationId, provenanceId, claimIds = [] } = cit;

      if (!provenanceId) {
        invalidCitations.push({
          citation: cit,
          reason: 'MISSING_PROVENANCE_ID'
        });
        continue;
      }

      // Check if provenanceId exists in supplied context
      const suppliedProv = suppliedProvenanceMap.get(provenanceId);
      if (!suppliedProv) {
        invalidCitations.push({
          citation: cit,
          reason: 'UNSUPPLIED_PROVENANCE_ID'
        });
        continue;
      }

      // Tenant boundary check
      if (String(suppliedProv.tenantId) !== String(tenantId)) {
        invalidCitations.push({
          citation: cit,
          reason: 'CROSS_TENANT_VIOLATION'
        });
        continue;
      }

      // Repository boundary check
      if (String(suppliedProv.repositoryId) !== String(repositoryId)) {
        invalidCitations.push({
          citation: cit,
          reason: 'CROSS_REPOSITORY_VIOLATION'
        });
        continue;
      }

      // Snapshot boundary check
      if (String(suppliedProv.snapshotId) !== String(snapshotId)) {
        invalidCitations.push({
          citation: cit,
          reason: 'CROSS_SNAPSHOT_VIOLATION'
        });
        continue;
      }

      // All checks pass
      validCitations.push({
        citationId,
        provenanceId,
        claimIds,
        provenance: suppliedProv
      });
    }

    this.logger.info('citation.validation.completed', 'Citation validation completed.', {
      total: citations.length,
      valid: validCitations.length,
      invalid: invalidCitations.length
    });

    return {
      validCitations,
      invalidCitations
    };
  }
}

module.exports = new CitationValidationService();
