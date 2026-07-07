const crypto = require('crypto');
const SourceProviderAdapter = require('./SourceProviderAdapter');

class GitHubProviderAdapter extends SourceProviderAdapter {
  constructor() {
    super('github');
  }

  async validateConnection(connection) {
    // Simulate GitHub App authorization token verification
    if (!connection.credentialReference) {
      throw new Error('Missing credential credentials Reference.');
    }
    return true;
  }

  async getRepository(connection, owner, name) {
    return {
      sourceRepositoryId: `gh_${owner}_${name}`,
      owner,
      name,
      fullName: `${owner}/${name}`,
      visibility: 'public',
      defaultBranch: 'main',
      webUrl: `https://github.com/${owner}/${name}`
    };
  }

  async getDefaultBranch(connection, owner, name) {
    return 'main';
  }

  async resolveRef(connection, owner, name, ref) {
    // Mock branch ref commit resolution
    if (ref === 'main' || ref === 'refs/heads/main') {
      return 'f1c50ceb1234567890abcdef1234567890abcdef';
    }
    if (ref === 'master' || ref === 'refs/heads/master') {
      return 'a1b2c3d4e5f678901234567890abcdef12345678';
    }
    // Assume input ref is already a SHA or resolve it
    if (/^[0-9a-f]{40}$/i.test(ref)) {
      return ref;
    }
    return 'f1c50ceb1234567890abcdef1234567890abcdef';
  }

  async getCommit(connection, owner, name, commitSha) {
    return {
      commitSha,
      author: 'Helio Developer',
      message: 'Initial workspace commit',
      committedAt: new Date()
    };
  }

  /**
   * Verify signature using constant-time comparison
   */
  async verifyWebhook(req, secret) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return false;

    // GitHub signature is in 'sha256=...' format
    const parts = signature.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') return false;

    const actualSig = parts[1];
    
    // Calculate expected HMAC SHA-256 signature
    const hmac = crypto.createHmac('sha256', secret);
    
    // We assume rawBody is preserved in request object by a middleware
    const rawBody = req.rawBody || JSON.stringify(req.body);
    hmac.update(rawBody);
    const expectedSig = hmac.digest('hex');

    // Constant-time comparison
    try {
      const a = Buffer.from(actualSig, 'hex');
      const b = Buffer.from(expectedSig, 'hex');
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch (err) {
      return false;
    }
  }

  async parseWebhookEvent(headers, body) {
    const eventType = headers['x-github-event'];
    const deliveryId = headers['x-github-delivery'];

    if (!eventType || !deliveryId) {
      throw new Error('Missing event type or delivery ID headers.');
    }

    let resolvedRevision = null;
    let ref = null;
    let repoName = null;
    let repoOwner = null;
    let sourceRepositoryId = null;

    if (eventType === 'push') {
      ref = body.ref;
      resolvedRevision = body.after;
      repoName = body.repository?.name;
      repoOwner = body.repository?.owner?.login || body.repository?.owner?.name;
      sourceRepositoryId = body.repository?.id ? String(body.repository.id) : `gh_${repoOwner}_${repoName}`;
    }

    return {
      deliveryId,
      eventType,
      sourceRepositoryId,
      repoName,
      repoOwner,
      ref,
      resolvedRevision,
      payloadHash: crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')
    };
  }
}

module.exports = GitHubProviderAdapter;
