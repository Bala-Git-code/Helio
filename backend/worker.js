require('dotenv').config();
const { validateEnv } = require('./config/envValidator');
validateEnv();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const QueueService = require('./services/medication/QueueService');
const OutboxService = require('./services/medication/OutboxService');
const ReconciliationService = require('./services/medication/ReconciliationService');
const JobHandlerRegistry = require('./services/medication/JobHandlerRegistry');
const Worker = require('./models/Worker');
const os = require('os');

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
// REGISTER JOB HANDLERS IN TYPED REGISTRY
// ------------------------------------------------------------

JobHandlerRegistry.register({
  jobType: 'sync-repository-job',
  execute: async (context, payload) => {
    const { syncId } = payload;
    const IngestionPipelineOrchestrator = require('./services/repository/IngestionPipelineOrchestrator');
    await IngestionPipelineOrchestrator.runSyncPipeline(syncId, context);
  }
});

JobHandlerRegistry.register({
  jobType: 'build-structural-index-job',
  execute: async (context, payload) => {
    const { tenantId, repositoryId, snapshotId } = payload;
    const StructuralIntelligenceEngine = require('./services/repository/StructuralIntelligenceEngine');
    await StructuralIntelligenceEngine.buildIndex(tenantId, repositoryId, snapshotId);
  }
});

JobHandlerRegistry.register({
  jobType: 'build-retrieval-index-job',
  execute: async (context, payload) => {
    const { tenantId, repositoryId, snapshotId } = payload;
    const RetrievalIndexOrchestrator = require('./services/repository/RetrievalIndexOrchestrator');
    await RetrievalIndexOrchestrator.buildIndex(tenantId, repositoryId, snapshotId);
  }
});


JobHandlerRegistry.register({
  jobType: 'trigger-rolling-generation',
  execute: async (context, payload) => {
    const { patientId, horizonDays = 7 } = payload;
    await doseInstanceEngine.generateRollingInstances(patientId, horizonDays);
  }
});

JobHandlerRegistry.register({
  jobType: 'trigger-reminder-scan',
  execute: async (context, payload) => {
    await reminderPlanningEngine.planReminders();
    await deliveryOrchestrator.processDueReminders();
    await followUpEngine.processFollowUps();
  }
});

JobHandlerRegistry.register({
  jobType: 'send-whatsapp-message',
  execute: async (context, payload) => {
    const { phone, templateName, components } = payload;
    await whatsappAdapter.sendTemplateMessage(phone, templateName, components);
  }
});

JobHandlerRegistry.register({
  jobType: 'send-inapp-message',
  execute: async (context, payload) => {
    const { patientId, title, message, priority } = payload;
    await Notification.create({
      userId: patientId,
      category: 'reminder',
      title,
      message,
      priority: priority || 'high'
    });
  }
});

JobHandlerRegistry.register({
  jobType: 'webhook-processing',
  execute: async (context, payload) => {
    const body = payload;
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
  }
});

JobHandlerRegistry.register({
  jobType: 'calculate-adherence',
  execute: async (context, payload) => {
    const { patientId } = payload;
    await runIdempotentInbox('adherence-projection', context.correlationId, async () => {
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

      await AdherenceSnapshot.create({
        patientId,
        adherenceScore: score,
        takenCount,
        targetCount: totalEligible,
        snapshotDate: new Date()
      });

      const profile = await PatientProfile.findOne({ userId: patientId });
      if (profile) {
        profile.healthScore = score;
        await profile.save();
      }
    });
  }
});

JobHandlerRegistry.register({
  jobType: 'forecast-refill',
  execute: async (context, payload) => {
    const { medicationId, patientId } = payload;
    await runIdempotentInbox('refill-projection', context.correlationId, async () => {
      const med = await Medication.findById(medicationId);
      if (!med) return;

      const dailyUsage = med.times?.length || 1;
      const estimatedDepletionDate = new Date(Date.now() + (med.quantity / dailyUsage) * 24 * 60 * 60 * 1000);
      const refillReminderDate = new Date(estimatedDepletionDate.getTime() - 5 * 24 * 60 * 60 * 1000);

      await RefillForecast.findOneAndUpdate(
        { patientId, medicationId },
        {
          currentSpread: med.quantity,
          dailyUsage,
          estimatedDepletionDate,
          refillReminderDate
        },
        { upsert: true, new: true }
      );
    });
  }
});

JobHandlerRegistry.register({
  jobType: 'evaluate-attention',
  execute: async (context, payload) => {
    const { doseInstanceId } = payload;
    await runIdempotentInbox('doctor-attention', context.correlationId, async () => {
      const dose = await DoseInstance.findById(doseInstanceId);
      if (!dose) return;
      await escalationEngine.evaluateEscalations(dose);
    });
  }
});

JobHandlerRegistry.register({
  jobType: 'sync-timeline',
  execute: async (context, payload) => {
    const { doseInstanceId, payload: innerPayload } = payload;
    await runIdempotentInbox('timeline-projection', context.correlationId, async () => {
      const dose = await DoseInstance.findById(doseInstanceId);
      if (!dose) return;

      const med = await Medication.findById(dose.medicationId);
      if (!med) return;

      await HealthRecord.create({
        userId: dose.patientId,
        type: 'prescription',
        title: `${med.name} Intake Status: ${innerPayload.toState}`,
        summary: `Dose of ${med.name} expected at ${dose.localTime} was marked ${innerPayload.toState}. Note: ${innerPayload.note || 'None'}.`,
        date: new Date()
      });
    });
  }
});

JobHandlerRegistry.register({
  jobType: 'send-status-notification',
  execute: async (context, payload) => {
    const { doseInstanceId, payload: innerPayload } = payload;
    await runIdempotentInbox('notification-projection', context.correlationId, async () => {
      const dose = await DoseInstance.findById(doseInstanceId);
      if (!dose) return;

      const med = await Medication.findById(dose.medicationId);
      if (!med) return;

      await Notification.create({
        userId: dose.patientId,
        category: 'medicine',
        title: `Medication Logged: ${med.name}`,
        message: `Intake status for scheduled dose of ${med.name} updated to ${innerPayload.toState}.`,
        priority: 'low'
      });
    });
  }
});

JobHandlerRegistry.register({
  jobType: 'record-audit-log',
  execute: async (context, payload) => {
    const { action, aggregateId, aggregateType, payload: innerPayload } = payload;
    await AuditLog.create({
      actorId: innerPayload.actorId || aggregateId,
      action: action,
      details: { aggregateId, aggregateType, state: innerPayload.toState }
    });
  }
});

JobHandlerRegistry.register({
  jobType: 'trigger-system-reconciliation',
  execute: async (context, payload) => {
    await ReconciliationService.reconcileAll();
  }
});

// ------------------------------------------------------------
// REGISTER QUEUE WORKER DELEGATOR COMPATIBILITIES
// ------------------------------------------------------------

QueueService.registerWorker('medication-scheduling', 2, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('trigger-rolling-generation');
  await handler.execute(context, job.payload);
});

QueueService.registerWorker('reminder-orchestration', 2, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('trigger-reminder-scan');
  await handler.execute(context, job.payload);
});

QueueService.registerWorker('channel-delivery-whatsapp', 5, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('send-whatsapp-message');
  await handler.execute(context, job.payload);
});

QueueService.registerWorker('channel-delivery-email', 5, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('send-inapp-message');
  await handler.execute(context, job.payload);
});

QueueService.registerWorker('webhook-processing', 4, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('webhook-processing');
  await handler.execute(context, job.payload);
});

QueueService.registerWorker('adherence-projection', 2, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('calculate-adherence');
  await handler.execute(context, job.payload);
});

QueueService.registerWorker('refill-projection', 2, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('forecast-refill');
  await handler.execute(context, job.payload);
});

QueueService.registerWorker('doctor-attention', 2, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('evaluate-attention');
  await handler.execute(context, job.payload);
});

QueueService.registerWorker('timeline-projection', 2, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('sync-timeline');
  await handler.execute(context, job.payload);
});

QueueService.registerWorker('repository-ingestion', 2, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('sync-repository-job');
  await handler.execute(context, job.payload);
});

QueueService.registerWorker('notification-projection', 2, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('send-status-notification');
  await handler.execute(context, job.payload);
});

QueueService.registerWorker('audit-processing', 2, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('record-audit-log');
  await handler.execute(context, job.payload);
});

QueueService.registerWorker('reconciliation', 1, async (job, context) => {
  const handler = JobHandlerRegistry.getHandler('trigger-system-reconciliation');
  await handler.execute(context, job.payload);
});

// ------------------------------------------------------------
// DAEMON SCHEDULER & HEARTBEATS
// ------------------------------------------------------------
let schedulerInterval = null;
let workerHeartbeatInterval = null;

function startSchedulerTicks() {
  console.log(`[Worker Daemon] Starting Scheduler Dispatcher Loop...`);
  
  schedulerInterval = setInterval(async () => {
    try {
      await QueueService.enqueue(
        'medication-scheduling',
        'trigger-rolling-generation',
        { horizonDays: 7 },
        { idempotencyKey: `sched_gen_${Math.floor(Date.now() / 180000)}` }
      );

      await QueueService.enqueue(
        'reminder-orchestration',
        'trigger-reminder-scan',
        {},
        { idempotencyKey: `sched_rem_${Math.floor(Date.now() / 60000)}` }
      );

      await QueueService.enqueue(
        'reconciliation',
        'trigger-system-reconciliation',
        {},
        { idempotencyKey: `sched_reconcile_${Math.floor(Date.now() / 120000)}` }
      );
    } catch (err) {
      console.error(`[Worker Daemon] Scheduler tick enqueue fail:`, err.message);
    }
  }, 30000);
}

async function registerWorkerInstance() {
  const supportedJobTypes = Array.from(JobHandlerRegistry.handlers.keys());
  let totalConcurrency = 0;
  for (const w of QueueService.workers.values()) {
    totalConcurrency += w.concurrency;
  }

  await Worker.findOneAndUpdate(
    { workerId: QueueService.workerId },
    {
      $set: {
        instanceId: `inst_${crypto.randomBytes(4).toString('hex')}`,
        hostname: os.hostname(),
        processId: process.pid,
        runtimeVersion: process.version,
        applicationVersion: '1.0.0',
        supportedJobTypes,
        concurrency: totalConcurrency,
        status: 'HEALTHY',
        startedAt: new Date(),
        lastHeartbeatAt: new Date()
      }
    },
    { upsert: true, new: true }
  );

  console.log(`[Worker Boot] Registered worker instance: ${QueueService.workerId}`);
}

function startWorkerHeartbeats() {
  const intervalMs = Number(process.env.WORKER_HEARTBEAT_INTERVAL_MS) || 10000;
  const { MetricsRegistry } = require('./services/medication/observability');

  workerHeartbeatInterval = setInterval(async () => {
    try {
      await Worker.findOneAndUpdate(
        { workerId: QueueService.workerId },
        { $set: { lastHeartbeatAt: new Date(), status: 'HEALTHY' } }
      );
    } catch (err) {
      console.error(`[Worker Heartbeat] Heartbeat write failed:`, err.message);
      MetricsRegistry.incrementWorkerHeartbeatFailure();
    }
  }, intervalMs);
}

// ------------------------------------------------------------
// PROCESS CONFIGURATION BOOTSTRAP
// ------------------------------------------------------------

async function bootstrap() {
  await connectDB();

  // Force index creation
  await Worker.syncIndexes();
  await QueueJob.syncIndexes();

  const type = process.env.PROCESS_TYPE || 'all';
  console.log(`[Worker Boot] Starting process layout: ${type}`);

  if (type === 'all' || type === 'worker') {
    // Register worker and heartbeats in DB
    await registerWorkerInstance();
    startWorkerHeartbeats();
    
    QueueService.start();
  }

  if (type === 'all' || type === 'outbox-publisher') {
    OutboxService.start();
  }

  if (type === 'all' || type === 'scheduler') {
    startSchedulerTicks();
  }
}

const crypto = require('crypto');

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error(`[Worker Boot] Uncaught daemon process crash:`, err);
    process.exit(1);
  });

  const shutdown = async (signal) => {
    console.log(`[Worker Boot] Received signal ${signal}. Shutting down safely...`);
    
    if (schedulerInterval) clearInterval(schedulerInterval);
    if (workerHeartbeatInterval) clearInterval(workerHeartbeatInterval);
    
    OutboxService.stop();
    ReconciliationService.stop();
    
    try {
      // Transition worker status in database
      await Worker.findOneAndUpdate(
        { workerId: QueueService.workerId },
        { $set: { status: 'DRAINING', shutdownAt: new Date() } }
      );

      const shutdownGraceMs = Number(process.env.WORKER_SHUTDOWN_GRACE_PERIOD_MS) || 10000;
      await QueueService.stop(shutdownGraceMs);

      await Worker.findOneAndUpdate(
        { workerId: QueueService.workerId },
        { $set: { status: 'STOPPED' } }
      );

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
