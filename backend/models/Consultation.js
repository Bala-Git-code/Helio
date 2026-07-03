const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    hospital: {
      type: String,
      required: true
    },
    diagnosis: {
      type: String,
      default: ''
    },
    clinicalNotes: {
      type: String,
      required: true
    },
    recommendations: {
      type: String,
      default: ''
    },
    prescriptions: [
      {
        name: { type: String, required: true },
        dosage: { type: String },
        frequency: { type: String },
        times: [{ type: String }],
        duration: { type: String },
        intakeTiming: { type: String },
        notes: { type: String }
      }
    ],
    followUp: {
      date: { type: Date },
      reason: { type: String }
    },
    aiSummary: {
      type: String,
      default: ''
    },
    attachments: [
      {
        name: { type: String },
        url: { type: String }
      }
    ],
    status: {
      type: String,
      enum: ['draft', 'completed'],
      default: 'draft',
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consultation', ConsultationSchema);
