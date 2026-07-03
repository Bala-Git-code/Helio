const AccessPermission = require('../models/AccessPermission');

class ConsentRepository {
  async findPermission(patientId, doctorId) {
    return AccessPermission.findOne({ patientId, doctorId });
  }

  async checkApproved(patientId, doctorId) {
    const permission = await AccessPermission.findOne({ patientId, doctorId, status: 'approved' });
    return !!permission;
  }

  async savePermission(patientId, doctorId, status) {
    let permission = await AccessPermission.findOne({ patientId, doctorId });
    if (permission) {
      permission.status = status;
      permission.history.push({ status, changedAt: new Date() });
      return permission.save();
    }
    
    permission = new AccessPermission({
      patientId,
      doctorId,
      status,
      history: [{ status, changedAt: new Date() }]
    });
    return permission.save();
  }
}

module.exports = new ConsentRepository();
