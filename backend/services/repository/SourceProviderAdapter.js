class SourceProviderAdapter {
  constructor(providerId) {
    this.providerId = providerId;
  }

  async validateConnection(connection) {
    throw new Error('validateConnection() must be implemented');
  }

  async getRepository(connection, owner, name) {
    throw new Error('getRepository() must be implemented');
  }

  async getDefaultBranch(connection, owner, name) {
    throw new Error('getDefaultBranch() must be implemented');
  }

  async resolveRef(connection, owner, name, ref) {
    throw new Error('resolveRef() must be implemented');
  }

  async getCommit(connection, owner, name, commitSha) {
    throw new Error('getCommit() must be implemented');
  }

  async verifyWebhook(req, secret) {
    throw new Error('verifyWebhook() must be implemented');
  }

  async parseWebhookEvent(headers, body) {
    throw new Error('parseWebhookEvent() must be implemented');
  }
}

module.exports = SourceProviderAdapter;
