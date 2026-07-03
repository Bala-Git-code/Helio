const patientRepository = require('../repositories/patientRepository');
const doctorRepository = require('../repositories/doctorRepository');
const AuditLog = require('../models/AuditLog');

class PatientService {
  async getPatientsList(doctorId, search = '', filters = {}, sortBy = 'name-asc') {
    const patientIds = await doctorRepository.findAssignedPatientIds(doctorId);
    return patientRepository.findPatientsByDirectory(patientIds, search, filters, sortBy);
  }

  async getPatientCompleteProfile(doctorId, patientId) {
    const details = await patientRepository.getPatientCompleteDetails(patientId);
    
    // Evaluate vital abnormalities
    const vitals = details.patient.vitals || {};
    const abnormalities = [];
    if (vitals.heartRate > 100) abnormalities.push('Tachycardia Warning (HR > 100)');
    if (vitals.heartRate < 55) abnormalities.push('Bradycardia Warning (HR < 55)');
    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 95) abnormalities.push('Hypoxia Warning (SpO2 < 95%)');
    if (vitals.temperature > 37.8) abnormalities.push('Fever Hyperthermia Warning');

    if (vitals.bloodPressure) {
      const systolic = parseInt(vitals.bloodPressure.split('/')[0], 10);
      const diastolic = parseInt(vitals.bloodPressure.split('/')[1], 10);
      if (systolic >= 140 || diastolic >= 90) {
        abnormalities.push('Hypertension Flag (BP >= 140/90)');
      }
    }

    // Build timeline events list chronologically
    const timeline = [];

    // Add notes to timeline
    details.notes.forEach(note => {
      timeline.push({
        type: 'consultation-note',
        date: note.createdAt,
        title: `Clinical Note: ${note.title}`,
        description: `Category: ${note.category} | Obs: ${note.content.substring(0, 150)}...`,
        source: 'doctor'
      });
    });

    // Add medications to timeline
    details.medications.forEach(med => {
      timeline.push({
        type: 'medication',
        date: med.createdAt,
        title: `Medication Added: ${med.name}`,
        description: `Dosage: ${med.dosage} | Frequency: ${med.frequency} | Status: ${med.active ? 'Active' : 'Paused'}`,
        source: 'prescription'
      });
    });

    // Add records to timeline
    details.records.forEach(rec => {
      timeline.push({
        type: 'medical-record',
        date: rec.date || rec.createdAt,
        title: `Document Uploaded: ${rec.title}`,
        description: `${rec.type.toUpperCase()} - Summary: ${rec.summary || 'None'}`,
        source: 'record'
      });
    });

    // Add appointments to timeline
    details.appointments.forEach(apt => {
      timeline.push({
        type: 'appointment',
        date: apt.date,
        title: `Appointment with ${apt.doctorName}`,
        description: `Status: ${apt.status} | Reason: ${apt.notes || 'None'}`,
        source: 'schedule'
      });
    });

    // Sort timeline chronologically descending
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Audit trace logging
    await AuditLog.create({
      actorId: doctorId,
      action: 'PATIENT_RECORD_READ',
      details: { patientId }
    });

    return {
      ...details,
      vitalAbnormalities: abnormalities,
      timeline
    };
  }
}

module.exports = new PatientService();
