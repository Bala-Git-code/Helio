require('dotenv').config();
const { validateEnv } = require('./config/envValidator');
validateEnv();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const QueueService = require('./services/medication/QueueService');
const OutboxService = require('./services/medication/OutboxService');
const ReconciliationService = require('./services/medication/ReconciliationService');

// Models
const DoseInstance = require('./models/DoseInstance');
const Medication = require('./models/Medication');
const PatientProfile = require('./models/PatientProfile');
const ReminderPlan = require('./models/ReminderPlan');
const ReminderAttempt = require('./models/ReminderAttempt');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');
const HealthRecord = require('./models/HealthRecord');
const RefillForecast = require('./models/RefillForecast');
const AdherenceSnapshot = require('./models/AdherenceSnapshot');
const InboxRecord = require('./models/InboxRecord');

// Core Engines
const doseInstanceEngine = require('./services/medication/DoseInstanceEngine');
const reminderPlanningEngine = require('./services/medication/ReminderPlanningEngine');
const deliveryOrchestrator = require('./services/medication/DeliveryOrchestrator');
const followUpEngine = require('./services/medication/FollowUpEngine');
const responseProcessingEngine = require('./services/medication/ResponseProcessingEngine');
const voiceIntentEngine = require('./services/medication/VoiceIntentEngine');
const escalationEngine = require('./services/medication/EscalationPolicyEngine');
const whatsappAdapter = require('./services/medication/WhatsAppProviderAdapter');

/**
 * Idempotent Inbox consumer wrapping to prevent processing duplicate events.
 */
async function runIdempotentInbox(consumerName, eventId, fn) {
  try {
    await InboxRecord.create({
      consumerName,
      eventId,
      processedAt: new Date()
    });
  } catch (err) {
    if (err.code === 11000) {
      console.log(`[Inbox] Event ${eventId} already processed by ${consumerName}. Deduplicated.`);
      return;
    }
    throw err;
  }
  return await fn();
}

// ------------------------------------------------------------
// REGISTER QUEUE WORKER HANDLERS
// ------------------------------------------------------------

// 1. Medication Scheduling Worker
QueueService.registerWorker('medication-scheduling', 2, async (job) => {
  const { patientId, horizonDays = 7 } = job.payload;
  await doseInstanceEngine.generateRollingInstances(patientId, horizonDays);
});

// 2. Reminder Orchestration Worker
QueueService.registerWorker('reminder-orchestration', 2, async (job) => {
  await reminderPlanningEngine.planReminders();
  await deliveryOrchestrator.processDueReminders();
  await followUpEngine.processFollowUps();
});

// 3. WhatsApp Delivery Worker
QueueService.registerWorker('channel-delivery-whatsapp', 5, async (job) => {
  const { phone, templateName, components } = job.payload;
  await whatsappAdapter.sendTemplateMessage(phone, templateName, components);
});

// 4. In-App Notification / Email Delivery Worker
QueueService.registerWorker('channel-delivery-email', 5, async (job) => {
  const { patientId, title, message, priority } = job.payload;
  await Notification.create({
    userId: patientId,
    category: 'reminder',
    title,
    message,
    priority: priority || 'high'
  });
});

// 5. Inbound Webhook Processing Worker
QueueService.registerWorker('webhook-processing', 4, async (job) => {
  const body = job.payload;
  const entry = body.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  const message = change?.messages?.[0];

  if (!message) return;

  const fromPhone = message.from;
  const profile = await PatientProfile.findOne({
    phone: new RegExp(fromPhone.replace('+', ''), 'i')
  });

  if (!profile) {
    console.warn(`[Webhook Worker] Unmatched patient profile for phone: ${fromPhone}`);
    return;
  }

  const patientId = profile.userId;

  if (message.type === 'interactive' && message.interactive?.button_reply) {
    const buttonId = message.interactive.button_reply.id;
    const match = buttonId.match(/^(TAKEN|SKIP|SNOOZE)_([a-fA-F0-9]{24})$/);

    if (match) {
      const [_, intent, doseInstanceId] = match;
      await responseProcessingEngine.processResponse({
        patientId,
        doseInstanceId,
        intent,
        source: 'whatsapp'
      });
    }
  } else if (message.type === 'text' && message.text?.body) {
    const text = message.text.body;
    const interpretation = await voiceIntentEngine.interpretTranscript(patientId, text);
    
    if (interpretation.success && interpretation.command) {
      await responseProcessingEngine.processResponse({
        patientId,
        doseInstanceId: interpretation.command.doseInstanceId,
        intent: interpretation.command.intent,
        source: 'whatsapp',
        reason: interpretation.command.reason,
        durationMinutes: interpretation.command.snoozeMinutes
      });
    }
  }
});

// 6. Adherence Projection Worker (Idempotent updates)
QueueService.registerWorker('adherence-projection', 2, async (job) => {
  const { patientId } = job.payload;
  await runIdempotentInbox('adherence-projection', job.correlationId, async () => {
    // Sync patient adherence scores
    const rangeStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const doseInstances = await DoseInstance.find({
      patientId,
      expectedTime: { $gte: rangeStart },
      status: { $ne: 'CANCELLED' }
    });

    if (doseInstances.length === 0) return;

    const asNeededMeds = await Medication.find({
      userId: patientId,
      frequency: { $in: ['as-needed', 'As Needed'] }
    }).select('_id').lean();
    
    const asNeededIds = new Set(asNeededMeds.map(m => m._id.toString()));
    const regularInstances = doseInstances.filter(dose => !asNeededIds.has(dose.medicationId.toString()));

    if (regularInstances.length === 0) return;

    const takenCount = regularInstances.filter(dose => 
      dose.status === 'TAKEN_ON_TIME' || dose.status === 'TAKEN_LATE'
    ).length;

    const totalEligible = regularInstances.length;
    const score = Math.round((takenCount / totalEligible) * 100);

    // Save snapshot
    await AdherenceSnapshot.create({
      patientId,
      adherenceScore: score,
      takenCount,
      targetCount: totalEligible,
      snapshotDate: new Date()
    });

    // Update patient profile
    const profile = await PatientProfile.findOne({ userId: patientId });
    if (profile) {
      profile.healthScore = score;
      await profile.save();
    }
  });
});

// 7. Refill Projection Worker
QueueService.registerWorker('refill-projection', 2, async (job) => {
  const { medicationId, patientId } = job.payload;
  await runIdempotentInbox('refill-projection', job.correlationId, async () => {
    const med = await Medication.findById(medicationId);
    if (!med) return;

    const dailyUsage = med.times?.length || 1;
    const estimatedDepletionDate = new Date(Date.now() + (med.quantity / dailyUsage) * 24 * 60 * 60 * 1000);
    const refillReminderDate = new Date(estimatedDepletionDate.getTime() - 5 * 24 * 60 * 60 * 1000); // 5-day buffer

    await RefillForecast.findOneAndUpdate(
      { patientId, medicationId },
      {
        currentStock: med.quantity,
        dailyUsage,
        estimatedDepletionDate,
        refillReminderDate
      },
      { upsert: true, new: true }
    );
  });
});

// 8. Doctor Attention Worker
QueueService.registerWorker('doctor-attention', 2, async (job) => {
  const { doseInstanceId } = job.payload;
  await runIdempotentInbox('doctor-attention', job.correlationId, async () => {
    const dose = await DoseInstance.findById(doseInstanceId);
    if (!dose) return;
    await escalationEngine.evaluateEscalations(dose);
  });
});

// 9. Timeline Projection Worker
QueueService.registerWorker('timeline-projection', 2, async (job) => {
  const { doseInstanceId, payload } = job.payload;
  await runIdempotentInbox('timeline-projection', job.correlationId, async () => {
    const dose = await DoseInstance.findById(doseInstanceId);
    if (!dose) return;

    const med = await Medication.findById(dose.medicationId);
    if (!med) return;

    await HealthRecord.create({
      userId: dose.patientId,
      type: 'prescription',
      title: `${med.name} Intake Status: ${payload.toState}`,
      summary: `Dose of ${med.name} expected at ${dose.localTime} was marked ${payload.toState}. Note: ${payload.note || 'None'}.`,
      date: new Date()
    });
  });
});

// 10. Notification Projection Worker
QueueService.registerWorker('notification-projection', 2, async (job) => {
  const { doseInstanceId, payload } = job.payload;
  await runIdempotentInbox('notification-projection', job.correlationId, async () => {
    const dose = await DoseInstance.findById(doseInstanceId);
    if (!dose) return;

    const med = await Medication.findById(dose.medicationId);
    if (!med) return;

    await Notification.create({
      userId: dose.patientId,
      category: 'medicine',
      title: `Medication Logged: ${med.name}`,
      message: `Intake status for scheduled dose of ${med.name} updated to ${payload.toState}.`,
      priority: 'low'
    });
  });
});

// 11. Audit Processing Worker
QueueService.registerWorker('audit-processing', 2, async (job) => {
  const { action, aggregateId, aggregateType, payload } = job.payload;
  await AuditLog.create({
    actorId: payload.actorId || aggregateId,
    action: action,
    details: { aggregateId, aggregateType, state: payload.toState }
  });
});

// 12. Reconciliation Worker
QueueService.registerWorker('reconciliation', 1, async () => {
  await ReconciliationService.reconcileAll();
});

// ------------------------------------------------------------
// DAEMON SCHEDULER (EMITS SCHEDULING TICK TRiggers)
// ------------------------------------------------------------
let schedulerInterval = null;

function startSchedulerTicks() {
  console.log(`[Worker Daemon] Starting Scheduler Dispatcher Loop...`);
  
  schedulerInterval = setInterval(async () => {
    try {
      // 1. Doses schedule generation window
      await QueueService.enqueue(
        'medication-scheduling',
        'trigger-rolling-generation',
        { horizonDays: 7 },
        { idempotencyKey: `sched_gen_${Math.floor(Date.now() / 180000)}` } // every 3 mins limit
      );

      // 2. Scan and plan reminders
      await QueueService.enqueue(
        'reminder-orchestration',
        'trigger-reminder-scan',
        {},
        { idempotencyKey: `sched_rem_${Math.floor(Date.now() / 60000)}` } // every 1 min limit
      );

      // 3. Trigger reconciliation tasks
      await QueueService.enqueue(
        'reconciliation',
        'trigger-system-reconciliation',
        {},
        { idempotencyKey: `sched_reconcile_${Math.floor(Date.now() / 120000)}` } // every 2 mins limit
      );
    } catch (err) {
      console.error(`[Worker Daemon] Scheduler tick enqueue fail:`, err.message);
    }
  }, 30000); // Check and dispatch scheduler ticks every 30 seconds
}

// ------------------------------------------------------------
// PROCESS CONFIGURATION BOOTSTRAP
// ------------------------------------------------------------

async function bootstrap() {
  await connectDB();

  const type = process.env.PROCESS_TYPE || 'all';
  console.log(`[Worker Boot] Starting process layout: ${type}`);

  if (type === 'all' || type === 'worker') {
    QueueService.start();
  }

  if (type === 'all' || type === 'outbox-publisher') {
    OutboxService.start();
  }

  if (type === 'all' || type === 'scheduler') {
    startSchedulerTicks();
  }
}

// Support executing directly if called via Node
if (require.main === module) {
  bootstrap().catch((err) => {
    console.error(`[Worker Boot] Uncaught daemon process crash:`, err);
    process.exit(1);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`[Worker Boot] Received signal ${signal}. Shutting down safely...`);
    
    if (schedulerInterval) clearInterval(schedulerInterval);
    
    OutboxService.stop();
    ReconciliationService.stop();
    
    try {
      await QueueService.stop(10000);
      await mongoose.connection.close();
      console.log(`[Worker Boot] Database closed cleanly. Exit.`);
      process.exit(0);
    } catch (err) {
      console.error(`[Worker Boot] Error during graceful exit:`, err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = {
  bootstrap,
  QueueService,
  OutboxService
};
