const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RefillForecastSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    medicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Medication',
      required: true,
      index: true
    },
    currentStock: {
      type: Number,
      required: true
    },
    dailyUsage: {
      type: Number,
      default: 1
    },
    estimatedDepletionDate: {
      type: Date
    },
    refillReminderDate: {
      type: Date
    },
    refillAlgorithmVersion: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

RefillForecastSchema.index({ patientId: 1, medicationId: 1 }, { unique: true });

module.exports = mongoose.model('RefillForecast', RefillForecastSchema);
