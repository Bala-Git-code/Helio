const IdempotencyRecord = require('../../models/IdempotencyRecord');

class IdempotencyStore {
  /**
   * Attempts to acquire an idempotency lock.
   * If already acquired, return state.
   */
  async acquire(tenantId, scope, key, durationMs = 24 * 60 * 60 * 1000) {
    const expiresAt = new Date(Date.now() + durationMs);
    const now = new Date();

    try {
      // Try to create the idempotency record. This is atomic.
      const record = await IdempotencyRecord.create({
        tenantId,
        scope,
        key,
        status: 'IN_PROGRESS',
        expiresAt
      });
      return { success: true, status: 'IN_PROGRESS', record };
    } catch (err) {
      if (err.code === 11000) {
        // Record exists, fetch it
        const record = await IdempotencyRecord.findOne({ tenantId, scope, key });
        if (!record) {
          // fallback if race/deletion occurred
          return { success: false, status: 'UNKNOWN' };
        }

        // Check if expired
        if (record.expiresAt < now) {
          // Re-acquire the lock
          const updated = await IdempotencyRecord.findOneAndUpdate(
            {
              tenantId,
              scope,
              key,
              $or: [{ status: { $ne: 'IN_PROGRESS' } }, { expiresAt: { $lt: now } }]
            },
            {
              $set: {
                status: 'IN_PROGRESS',
                expiresAt,
                resultReference: null,
                failureMetadata: null
              }
            },
            { new: true }
          );
          if (updated) {
            return { success: true, status: 'IN_PROGRESS', record: updated };
          }
        }

        return {
          success: false,
          status: record.status,
          resultReference: record.resultReference,
          failureMetadata: record.failureMetadata
        };
      }
      throw err;
    }
  }

  async complete(tenantId, scope, key, resultReference = null) {
    return IdempotencyRecord.findOneAndUpdate(
      { tenantId, scope, key },
      { $set: { status: 'COMPLETED', resultReference } },
      { new: true }
    );
  }

  async fail(tenantId, scope, key, failureMetadata = null) {
    return IdempotencyRecord.findOneAndUpdate(
      { tenantId, scope, key },
      { $set: { status: 'FAILED', failureMetadata } },
      { new: true }
    );
  }

  async get(tenantId, scope, key) {
    return IdempotencyRecord.findOne({ tenantId, scope, key });
  }

  async cleanupExpired() {
    const now = new Date();
    return IdempotencyRecord.deleteMany({ expiresAt: { $lte: now } });
  }
}

module.exports = new IdempotencyStore();
