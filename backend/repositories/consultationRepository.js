const Consultation = require('../models/Consultation');

class ConsultationRepository {
  async save(consultationData) {
    if (consultationData.id || consultationData._id) {
      const id = consultationData.id || consultationData._id;
      return Consultation.findByIdAndUpdate(id, consultationData, { new: true, upsert: true });
    }
    return Consultation.create(consultationData);
  }

  async findById(id) {
    return Consultation.findById(id);
  }

  async findByPatient(patientId) {
    return Consultation.find({ patientId }).sort({ createdAt: -1 });
  }

  async findByDoctor(doctorId) {
    return Consultation.find({ doctorId }).sort({ createdAt: -1 });
  }
}

module.exports = new ConsultationRepository();
