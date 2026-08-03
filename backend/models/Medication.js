import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  dosage: {
    type: String,
    required: true,
    trim: true,
  },
  frequency: {
    type: String,
    enum: ['ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'EVERY_OTHER_DAY', 'AS_NEEDED'],
    default: 'ONCE_DAILY',
  },
  timesPerDay: {
    type: Number,
    default: 1,
  },
  dailyTimings: [{
    type: String,
  }],
  scheduleTimes: [{
    type: String,
  }],
  totalQuantity: {
    type: Number,
    required: true,
    default: 30,
  },
  remainingQuantity: {
    type: Number,
    required: true,
    default: 30,
  },
  pillCount: {
    type: Number,
    default: 30,
  },
  refillThreshold: {
    type: Number,
    default: 7,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  instructions: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'DISCONTINUED', 'COMPLETED'],
    default: 'ACTIVE',
  },
  prescribedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// High-frequency query compound index
medicationSchema.index({ patientId: 1, status: 1 });

export const Medication = mongoose.model('Medication', medicationSchema);
export default Medication;
