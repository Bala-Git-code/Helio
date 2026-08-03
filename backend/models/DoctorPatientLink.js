import mongoose from 'mongoose';

const doctorPatientLinkSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'REVOKED'],
    default: 'PENDING',
    required: true,
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  expiresAt: {
    type: Date,
  },
  grantedAt: {
    type: Date,
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// High-frequency query compound index
doctorPatientLinkSchema.index({ doctorId: 1, patientId: 1, status: 1 });

export const DoctorPatientLink = mongoose.model('DoctorPatientLink', doctorPatientLinkSchema);
export default DoctorPatientLink;
