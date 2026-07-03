const mongoose = require('mongoose');

const MedicalDocumentSchema = new mongoose.Schema(
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
      index: true
    },
    hospital: {
      type: String,
      default: 'Helio Clinic'
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation'
    },
    documentType: {
      type: String,
      enum: ['prescription', 'lab', 'scan', 'discharge', 'note', 'other'],
      required: true,
      index: true
    },
    category: {
      type: String,
      index: true
    },
    originalFile: {
      path: String,
      name: String,
      mimeType: String
    },
    processedFile: {
      path: String,
      name: String
    },
    preview: {
      type: String
    },
    ocrStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    aiStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    extractionStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    summary: {
      type: String,
      default: ''
    },
    tags: [
      {
        type: String,
        index: true
      }
    ],
    timelineReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthRecord'
    },
    consentStatus: {
      type: String,
      enum: ['approved', 'pending', 'revoked'],
      default: 'approved',
      index: true
    },
    visibility: {
      type: String,
      enum: ['patient-only', 'doctor-only', 'shared'],
      default: 'shared',
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    currentVersion: {
      type: Number,
      default: 1
    },
    versions: [
      {
        version: { type: Number },
        title: { type: String },
        summary: { type: String },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
        changes: { type: String }
      }
    ]
  },
  { timestamps: true }
);

// Compound index for optimized sharing checks and consent checks
MedicalDocumentSchema.index({ patientId: 1, visibility: 1, isDeleted: 1 });

module.exports = mongoose.model('MedicalDocument', MedicalDocumentSchema);
