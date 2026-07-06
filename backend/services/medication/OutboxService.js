const OutboxEvent = require('../../models/OutboxEvent');
const QueueService = require('./QueueService');
const crypto = require('crypto');

class OutboxService {
  constructor() {
    this.publisherId = `outbox_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.running = false;
    this.timer = null;
    this.batchSize = 50;
  }

  /**
   * Helper to write an event to the outbox. Can accept a Mongoose Transaction Session.
   */
  async publishEvent(eventType, aggregateType, aggregateId, patientScope, payload, session = null) {
    const correlationId = payload.correlationId || this.generateId();
    const causationId = payload.causationId || this.generateId();
    
    // Construct a deterministic idempotency key to prevent duplication
    const randomSalt = crypto.randomBytes(8).toString('hex');
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${eventType}_${aggregateId}_${Date.now()}_${randomSalt}`)
      .digest('hex');

    const eventData = {
      eventType,
      aggregateType,
      aggregateId,
      patientScope,
      payload,
      correlationId,
      causationId,
      idempotencyKey,
      processingState: 'pending',
      attemptCount: 0
    };

    const options = session ? { session } : {};
    const [event] = await OutboxEvent.create([eventData], options);
    console.log(`[OutboxService] Event ${event._id} [${eventType}] persisted to Transactional Outbox.`);
    return event;
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  start() {
    if (this.running) return;
    this.running = true;
    console.log(`[OutboxService] Started outbox poller daemon: ${this.publisherId}`);
    
    this.timer = setInterval(() => {
      this.tick().catch((err) => {
        console.error(`[OutboxService] Poller execution error:`, err);
      });
    }, 3000); // scan outbox every 3 seconds
  }

  stop() {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    console.log(`[OutboxService] Outbox poller daemon stopped.`);
  }

  async tick() {
    if (!this.running) return;
    const now = new Date();

    // Fetch pending and expired leased events
    const candidates = await OutboxEvent.find({
      status: { $ne: 'completed' }, // avoid querying completed ones
      processingState: { $in: ['pending', 'failed'] },
      availableAt: { $lte: now },
      $or: [
        { leaseExpiration: null },
        { leaseExpiration: { $lte: now } }
      ]
    })
      .sort({ createdAt: 1 })
      .limit(this.batchSize)
      .lean();

    for (const candidate of candidates) {
      if (!this.running) break;

      // Lock event atomically
      const lockedEvent = await OutboxEvent.findOneAndUpdate(
        {
          _id: candidate._id,
          processingState: candidate.processingState,
          $or: [
            { leaseExpiration: null },
            { leaseExpiration: candidate.leaseExpiration }
          ]
        },
        {
          $set: {
            processingState: 'processing',
            leaseOwner: this.publisherId,
            leaseExpiration: new Date(Date.now() + 1 * 60 * 1000) // 1 minute processing lease
          },
          $inc: { attemptCount: 1 }
        },
        { new: true }
      );

      if (!lockedEvent) continue; // locked concurrently by another worker

      try {
        await this.routeEvent(lockedEvent);

        // Mark as completed
        await OutboxEvent.findByIdAndUpdate(lockedEvent._id, {
          $set: {
            processingState: 'completed',
            processedAt: new Date(),
            leaseExpiration: null,
            leaseOwner: null
          }
        });
      } catch (err) {
        console.error(`[OutboxService] Failed to publish/route event ${lockedEvent._id}:`, err.message);

        if (lockedEvent.attemptCount >= 5) {
          // Dead-letter outbox event
          await OutboxEvent.findByIdAndUpdate(lockedEvent._id, {
            $set: {
              processingState: 'dead-letter',
              leaseExpiration: null,
              leaseOwner: null,
              lastError: err.message
            }
          });
        } else {
          // Exponential backoff retry for outbox poller (delay 10s, 20s, 40s...)
          const backoffDelaySecs = Math.pow(2, lockedEvent.attemptCount) * 5;
          await OutboxEvent.findByIdAndUpdate(lockedEvent._id, {
            $set: {
              processingState: 'failed',
              availableAt: new Date(Date.now() + backoffDelaySecs * 1000),
              leaseExpiration: null,
              leaseOwner: null,
              lastError: err.message
            }
          });
        }
      }
    }
  }

  /**
   * Router to translate outbox events into physical queue jobs.
   */
  async routeEvent(event) {
    const { eventType, aggregateType, aggregateId, patientScope, payload, correlationId, causationId } = event;
    const opts = { correlationId, causationId, idempotencyKey: `outbox_job_${event._id}` };

    switch (eventType) {
      case 'dose.state.changed':
        // Decouple dose updates into respective async projection and notification tasks
        await QueueService.enqueue('adherence-projection', 'calculate-adherence', { patientId: patientScope }, opts);
        await QueueService.enqueue('doctor-attention', 'evaluate-attention', { doseInstanceId: aggregateId }, opts);
        await QueueService.enqueue('timeline-projection', 'sync-timeline', { doseInstanceId: aggregateId, payload }, opts);
        await QueueService.enqueue('notification-projection', 'send-status-notification', { doseInstanceId: aggregateId, payload }, opts);
        await QueueService.enqueue('audit-processing', 'record-audit-log', { action: 'DOSE_STATE_TRANSITION', aggregateId, aggregateType, payload }, opts);
        break;

      case 'refill.attention.created':
        await QueueService.enqueue('refill-projection', 'forecast-refill', { medicationId: aggregateId, patientId: patientScope }, opts);
        break;

      case 'reminder.dispatch.requested':
        // Map dispatch reminders to channel pools
        const channel = payload.channel || 'app';
        if (channel === 'whatsapp') {
          await QueueService.enqueue('channel-delivery-whatsapp', 'send-whatsapp-message', payload, opts);
        } else {
          await QueueService.enqueue('channel-delivery-email', 'send-inapp-message', payload, opts);
        }
        break;

      default:
        console.warn(`[OutboxService] Unhandled event routing key: ${eventType}. Dropping.`);
    }
  }
}

module.exports = new OutboxService();
