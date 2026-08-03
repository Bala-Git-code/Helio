import { QueueJob } from '../models/QueueJob.js';
import { sendWhatsAppNotification } from './whatsappService.js';

/**
 * Atomic claim and process background queue jobs with exponential backoff
 */
export const processNextQueueJob = async () => {
  const lockTimeoutMs = 60000; // 1 minute lock
  const now = new Date();
  const lockExpirationThreshold = new Date(now.getTime() - lockTimeoutMs);

  try {
    const job = await QueueJob.findOneAndUpdate(
      {
        status: { $in: ['PENDING', 'RETRY'] },
        runAt: { $lte: now },
        $or: [
          { lockedAt: null },
          { lockedAt: { $lt: lockExpirationThreshold } },
        ],
      },
      {
        $set: {
          status: 'PROCESSING',
          lockedAt: now,
          lockTimeout: new Date(now.getTime() + lockTimeoutMs),
        },
        $inc: { attempts: 1 },
      },
      { sort: { runAt: 1 }, new: true }
    );

    if (!job) return; // No jobs ready

    try {
      // Execute job based on jobType
      switch (job.jobType) {
        case 'MEDICATION_REMINDER_DUE':
        case 'REFILL_ALERT':
        case 'PRESCRIPTION_ISSUED':
          if (job.payload?.phone) {
            await sendWhatsAppNotification({
              toPhone: job.payload.phone,
              messageText: job.payload.message || `[HELIO Notification] Event ${job.jobType} processed for ${job.payload.medicationName || 'medication'}.`,
            });
          }
          break;
        default:
          console.log(`[QueueWorker] Executing job ${job._id} of type ${job.jobType}`);
          break;
      }

      job.status = 'COMPLETED';
      job.lockedAt = null;
      await job.save();
    } catch (jobErr) {
      console.error(`[QueueWorker] Job ${job._id} execution failed:`, jobErr.message);
      job.lastError = jobErr.message;
      if (job.attempts >= job.maxAttempts) {
        job.status = 'FAILED';
      } else {
        job.status = 'RETRY';
        // Exponential backoff: 2^attempts * 10 seconds
        const backoffDelayMs = Math.pow(2, job.attempts) * 10000;
        job.runAt = new Date(now.getTime() + backoffDelayMs);
      }
      job.lockedAt = null;
      await job.save();
    }
  } catch (err) {
    console.error('[QueueWorker] Lock & process error:', err.message);
  }
};

let workerInterval = null;

export const startQueueWorker = (intervalMs = 3000) => {
  if (workerInterval) return;
  console.log('[Queue Worker] Started background worker polling process...');
  workerInterval = setInterval(processNextQueueJob, intervalMs);
};

export const stopQueueWorker = () => {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[Queue Worker] Stopped background queue worker.');
  }
};

export default {
  processNextQueueJob,
  startQueueWorker,
  stopQueueWorker,
};
