const AuditLog = require('../models/AuditLog');

class AuditService {
  async log(actorId, action, details = {}, ipAddress = '') {
    return AuditLog.create({
      actorId,
      action,
      details,
      ipAddress
    });
  }
}

module.exports = new AuditService();
