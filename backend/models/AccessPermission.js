const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AccessPermissionSchema = new Schema(
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
    status: {
      type: String,
      enum: ['pending', 'approved', 'revoked'],
      default: 'pending',
      required: true,
      index: true
    },
    history: [
      {
        status: {
          type: String,
          enum: ['pending', 'approved', 'revoked'],
          required: true
        },
        changedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('AccessPermission', AccessPermissionSchema);
