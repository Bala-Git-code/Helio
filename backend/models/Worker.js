const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WorkerSchema = new Schema(
  {
    workerId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    instanceId: {
      type: String,
      required: true
    },
    hostname: {
      type: String,
      required: true
    },
    processId: {
      type: Number,
      required: true
    },
    runtimeVersion: {
      type: String,
      required: true
    },
    applicationVersion: {
      type: String,
      required: true
    },
    supportedJobTypes: [
      {
        type: String
      }
    ],
    concurrency: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['STARTING', 'HEALTHY', 'DRAINING', 'UNHEALTHY', 'STOPPED'],
      default: 'STARTING',
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    lastHeartbeatAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    shutdownAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Worker', WorkerSchema);
