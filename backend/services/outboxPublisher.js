import { OutboxEvent } from '../models/OutboxEvent.js';
import { QueueJob } from '../models/QueueJob.js';

/**
 * Polls Transactional Outbox events and safely dispatches jobs to persistent queue
 */
export const publishOutboxEvents = async () => {
  try {
    const pendingEvents = await OutboxEvent.find({ status: 'PENDING' })
      .sort({ createdAt: 1 })
      .limit(20);

    for (const event of pendingEvents) {
      try {
        await QueueJob.create({
          jobType: event.eventType,
          payload: event.payload,
          status: 'PENDING',
          runAt: new Date(),
        });

        event.status = 'PUBLISHED';
        event.processedAt = new Date();
        await event.save();
      } catch (err) {
        event.retryCount += 1;
        event.lastError = err.message;
        if (event.retryCount >= 5) {
          event.status = 'FAILED';
        }
        await event.save();
      }
    }
  } catch (err) {
    console.error('[Outbox Publisher] Polling error:', err.message);
  }
};

let publisherInterval = null;

export const startOutboxPublisher = (intervalMs = 5000) => {
  if (publisherInterval) return;
  console.log('[Outbox Publisher] Started polling background process...');
  publisherInterval = setInterval(publishOutboxEvents, intervalMs);
};

export const stopOutboxPublisher = () => {
  if (publisherInterval) {
    clearInterval(publisherInterval);
    publisherInterval = null;
    console.log('[Outbox Publisher] Stopped background process.');
  }
};

export default {
  publishOutboxEvents,
  startOutboxPublisher,
  stopOutboxPublisher,
};
