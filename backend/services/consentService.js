const consentRepository = require('../repositories/consentRepository');
const PatientProfile = require('../models/PatientProfile');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

class ConsentService {
  async verifyDoctorAccess(doctorId, patientId) {
    const isApproved = await consentRepository.checkApproved(patientId, doctorId);
    
    // Log audit for every access check
    await AuditLog.create({
      actorId: doctorId,
      action: 'CONSENT_ACCESS_VERIFY',
      details: { patientId, result: isApproved ? 'GRANTED' : 'DENIED' }
    });

    return isApproved;
  }

  async requestClinicalLink(doctorId, accessCode, doctorName) {
    const profile = await PatientProfile.findOne({ accessCode: accessCode.trim() });
    if (!profile) {
      throw new Error('No patient record found matching this access code.');
    }

    const patientUser = await User.findById(profile.userId);
    if (!patientUser) {
      throw new Error('Patient account details not found.');
    }

    // Save pending permission
    const permission = await consentRepository.savePermission(profile.userId, doctorId, 'pending');

    // Notify patient
    await Notification.create({
      userId: profile.userId,
      category: 'doctor',
      title: 'Clinician Access Request',
      message: `Doctor ${doctorName || 'Clinician'} is requesting clinical timeline permissions. Check the support options tab.`,
      priority: 'high'
    });

    await AuditLog.create({
      actorId: doctorId,
      action: 'LINK_REQUEST_INIT',
      details: { patientId: profile.userId }
    });

    return {
      permission,
      patient: { id: profile.userId, name: patientUser.name, accessCode: profile.accessCode }
    };
  }

  async revokeAccess(doctorId, patientId) {
    const permission = await consentRepository.savePermission(patientId, doctorId, 'revoked');
    
    await AuditLog.create({
      actorId: doctorId,
      action: 'CONSENT_REVOKED',
      details: { patientId }
    });

    return permission;
  }
}

module.exports = new ConsentService();
