const consultationRepository = require('../repositories/consultationRepository');
const Medication = require('../models/Medication');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const PatientProfile = require('../models/PatientProfile');

class ConsultationService {
  async saveDraftConsultation(doctorId, patientId, data) {
    const consultation = await consultationRepository.save({
      doctorId,
      patientId,
      hospital: data.hospital || 'Helio General Hospital',
      diagnosis: data.diagnosis,
      clinicalNotes: data.clinicalNotes,
      recommendations: data.recommendations,
      prescriptions: data.prescriptions || [],
      followUp: data.followUp,
      status: 'draft'
    });

    await AuditLog.create({
      actorId: doctorId,
      action: 'CONSULTATION_DRAFT_SAVE',
      details: { consultationId: consultation._id, patientId }
    });

    return consultation;
  }

  async finalizeConsultation(doctorId, patientId, data) {
    if (!data.signature) {
      throw new Error('Physician digital signature verification is required to finalize consultation.');
    }

    // 1. Create completed consultation log
    const consultation = await consultationRepository.save({
      doctorId,
      patientId,
      hospital: data.hospital || 'Helio General Hospital',
      diagnosis: data.diagnosis,
      clinicalNotes: data.clinicalNotes,
      recommendations: data.recommendations,
      prescriptions: data.prescriptions || [],
      followUp: data.followUp,
      aiSummary: data.aiSummary || 'AI abstract compiled successfully.',
      status: 'completed'
    });

    // 2. Synchronize prescriptions to Patient's Medication schedules
    if (data.prescriptions && data.prescriptions.length > 0) {
      for (const rx of data.prescriptions) {
        // Double medicine validation / duplicate assessment
        const duplicate = await Medication.findOne({
          userId: patientId,
          name: new RegExp(rx.name, 'i'),
          active: true
        });

        if (!duplicate) {
          await Medication.create({
            userId: patientId,
            name: rx.name,
            dosage: rx.dosage,
            frequency: rx.frequency,
            times: rx.times || ['08:00'],
            startDate: new Date(),
            endDate: data.followUp?.date ? new Date(data.followUp.date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            ingredients: rx.name,
            notes: `Prescribed by Doctor on ${new Date().toLocaleDateString()}. Instructions: ${rx.notes || 'Take after meals'}`,
            active: true
          });
        }
      }
    }

    // 3. Dispatch patient notifications
    await Notification.create({
      userId: patientId,
      category: 'doctor',
      title: 'Consultation Complete & Signed',
      message: `Your medical file has been updated by Dr. Gregory House. Active prescription schedule is synced.`,
      priority: 'high'
    });

    // 4. Log compliance audits
    await AuditLog.create({
      actorId: doctorId,
      action: 'CONSULTATION_FINALIZE',
      details: { consultationId: consultation._id, patientId, signature: data.signature }
    });

    return consultation;
  }

  async getPatientConsultations(patientId) {
    return consultationRepository.findByPatient(patientId);
  }
}

module.exports = new ConsultationService();
