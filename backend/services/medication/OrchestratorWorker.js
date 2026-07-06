const JobState = require('../../models/JobState');
const doseInstanceEngine = require('./DoseInstanceEngine');
const reminderPlanningEngine = require('./ReminderPlanningEngine');
const deliveryOrchestrator = require('./DeliveryOrchestrator');
const followUpEngine = require('./FollowUpEngine');

class OrchestratorWorker {
  constructor() {
    this.workerId = `worker_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.running = false;
    this.timer = null;
    this.intervals = {
      'generate-instances': 3 * 60 * 1000,   // every 3 minutes
      'plan-reminders': 1 * 60 * 1000,       // every 1 minute
      'dispatch-reminders': 30 * 1000,       // every 30 seconds
      'process-followups': 45 * 1000         // every 45 seconds
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    console.log(`[OrchestratorWorker] Started background daemon worker. ID: ${this.workerId}`);
    
    // Seed job entries inside collection
    this.seedJobs();

    // Start evaluation loop
    this.timer = setInterval(() => this.tick(), 15 * 1000); // tick every 15 seconds
  }

  stop() {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    console.log(`[OrchestratorWorker] Daemon worker stopped.`);
  }

  async seedJobs() {
    for (const [name, interval] of Object.entries(this.intervals)) {
      try {
        await JobState.findOneAndUpdate(
          { name },
          { $setOnInsert: { name, nextRunAt: new Date() } },
          { upsert: true }
        );
      } catch (err) {
        // safe to ignore if concurrent seed occurs
      }
    }
  }

  async acquireLock(jobName, intervalMs) {
    const now = new Date();
    const leaseTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes lease

    try {
      const job = await JobState.findOneAndUpdate(
        {
          name: jobName,
          $or: [
            { nextRunAt: { $lte: now } },
            { lockedUntil: { $lte: now } } // lease expired
          ]
        },
        {
          $set: {
            lockedUntil: leaseTime,
            lockedBy: this.workerId,
            nextRunAt: new Date(Date.now() + intervalMs)
          }
        },
        { new: true }
      );
      return job;
    } catch (err) {
      console.error(`[OrchestratorWorker] Lock acquisition error for job ${jobName}`, err);
      return null;
    }
  }

  async releaseLock(jobName, status = 'success') {
    try {
      await JobState.findOneAndUpdate(
        { name: jobName, lockedBy: this.workerId },
        { 
          $set: { 
            lockedUntil: null, 
            lockedBy: null,
            lastStatus: status 
          } 
        }
      );
    } catch (err) {
      console.error(`[OrchestratorWorker] Lock release error for job ${jobName}`, err);
    }
  }

  async tick() {
    if (!this.running) return;

    // 1. Generation horizon
    let job = await this.acquireLock('generate-instances', this.intervals['generate-instances']);
    if (job) {
      try {
        await doseInstanceEngine.generateRollingInstances();
        await this.releaseLock('generate-instances', 'success');
      } catch (err) {
        console.error('[OrchestratorWorker] generate-instances job failed', err);
        await this.releaseLock('generate-instances', 'failed');
      }
    }

    // 2. Planning reminders
    job = await this.acquireLock('plan-reminders', this.intervals['plan-reminders']);
    if (job) {
      try {
        await reminderPlanningEngine.planReminders();
        await this.releaseLock('plan-reminders', 'success');
      } catch (err) {
        console.error('[OrchestratorWorker] plan-reminders job failed', err);
        await this.releaseLock('plan-reminders', 'failed');
      }
    }

    // 3. Dispatching reminders
    job = await this.acquireLock('dispatch-reminders', this.intervals['dispatch-reminders']);
    if (job) {
      try {
        await deliveryOrchestrator.processDueReminders();
        await this.releaseLock('dispatch-reminders', 'success');
      } catch (err) {
        console.error('[OrchestratorWorker] dispatch-reminders job failed', err);
        await this.releaseLock('dispatch-reminders', 'failed');
      }
    }

    // 4. Processing followups
    job = await this.acquireLock('process-followups', this.intervals['process-followups']);
    if (job) {
      try {
        await followUpEngine.processFollowUps();
        await this.releaseLock('process-followups', 'success');
      } catch (err) {
        console.error('[OrchestratorWorker] process-followups job failed', err);
        await this.releaseLock('process-followups', 'failed');
      }
    }
  }
}

module.exports = new OrchestratorWorker();
