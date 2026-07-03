const User = require('../models/User');
const AccessPermission = require('../models/AccessPermission');
const Notification = require('../models/Notification');

class DoctorRepository {
  async findById(id) {
    return User.findById(id).select('-password');
  }

  async findAssignedPatientIds(doctorId) {
    const permissions = await AccessPermission.find({
      doctorId,
      status: 'approved'
    });
    return permissions.map(p => p.patientId);
  }

  async getUnreadAlertsCount(doctorId) {
    return Notification.countDocuments({
      userId: doctorId,
      read: false
    });
  }

  async getNotifications(doctorId) {
    return Notification.find({
      userId: doctorId
    }).sort({ createdAt: -1 });
  }
}

module.exports = new DoctorRepository();
