import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
  },
  googleId: {
    type: String,
  },
  role: {
    type: String,
    enum: ['PATIENT', 'DOCTOR', 'ADMIN'],
    default: 'PATIENT',
    required: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  specialty: {
    type: String,
    default: '',
  },
  licenseNumber: {
    type: String,
    default: '',
  },
  dateOfBirth: {
    type: Date,
  },
  caregiverContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    relationship: { type: String, default: '' },
  },
  medicalHistory: [{
    condition: String,
    diagnosedYear: Number,
  }],
}, {
  timestamps: true,
});

export const User = mongoose.model('User', userSchema);
export default User;