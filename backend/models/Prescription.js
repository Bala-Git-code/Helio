import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
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
  medicationName: {
    type: String,
    required: true,
  },
  dosage: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    required: true,
  },
  durationDays: {
    type: Number,
    required: true,
  },
  instructions: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'FULFILLED', 'CANCELLED'],
    default: 'ACTIVE',
  },
  auditTrail: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  }],
}, {
  timestamps: true,
});

export const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
