import mongoose from 'mongoose';

const adherenceLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true,
    index: true,
  },
  scheduledTime: {
    type: Date,
    required: true,
  },
  takenAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['TAKEN', 'MISSED', 'SKIPPED'],
    required: true,
  },
  confirmationChannel: {
    type: String,
    enum: ['APP', 'WHATSAPP', 'VOICE'],
    default: 'APP',
  },
  notes: {
    type: String,
    default: '',
  },
  voiceLogged: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// High-frequency query compound index
adherenceLogSchema.index({ patientId: 1, scheduledTime: -1 });

export const AdherenceLog = mongoose.model('AdherenceLog', adherenceLogSchema);
export default AdherenceLog;
