const mongoose = require('mongoose');

const DoctorNoteSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, default: 'care-plan' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorNote', DoctorNoteSchema);
