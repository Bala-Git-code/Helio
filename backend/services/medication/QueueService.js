const QueueJob = require('../../models/QueueJob');

class QueueService {
  constructor() {
    this.workerId = `worker_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.workers = new Map(); // queueName -> { processor, concurrency, activeJobs: Set }
    this.running = false;
    this.pollIntervals = new Map(); // queueName -> timer
  }

  /**
   * Enqueues a job into a specific persistent queue.
   */
  async enqueue(queueName, jobType, payload, options = {}) {
    const {
      runAt = new Date(),
      priority = 0,
      maxAttempts = 3,
      idempotencyKey = null,
      correlationId = null,
      causationId = null,
      schemaVersion = 1
    } = options;

    const jobData = {
      queueName,
      jobType,
      schemaVersion,
      payload,
      priority,
      status: 'pending',
      attempts: 0,
      maxAttempts,
      runAt,
      correlationId,
      causationId,
      idempotencyKey
    };

    try {
      const job = await QueueJob.create(jobData);
      console.log(`[QueueService] Enqueued job ${job._id} [${jobType}] into queue: ${queueName}`);
      return job;
    } catch (err) {
      // 11000 is mongoose duplicate key error (idempotency key constraint)
      if (err.code === 11000 && idempotencyKey) {
        console.log(`[QueueService] Duplicate job skipped via idempotency key: ${idempotencyKey}`);
        return await QueueJob.findOne({ idempotencyKey });
      }
      throw err;
    }
  }

  /**
   * Register a processor and start polling loop for a specific queue.
   */
  registerWorker(queueName, concurrency, processor) {
    if (this.workers.has(queueName)) {
      throw new Error(`Worker already registered for queue: ${queueName}`);
    }

    this.workers.set(queueName, {
      processor,
      concurrency,
      activeJobs: new Set()
    });

    console.log(`[QueueService] Registered worker for queue "${queueName}" with concurrency ${concurrency}`);

    // If queue polling is already active, start this queue immediately
    if (this.running) {
      this.startQueuePolling(queueName);
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    console.log(`[QueueService] Starting background queue processing for worker: ${this.workerId}`);
    for (const queueName of this.workers.keys()) {
      this.startQueuePolling(queueName);
    }
  }

  async stop(timeoutMs = 15000) {
    this.running = false;
    console.log(`[QueueService] Stopping workers and initiating graceful shutdown (timeout: ${timeoutMs}ms)...`);

    // Stop all polling loops
    for (const [queueName, timer] of this.pollIntervals.entries()) {
      clearInterval(timer);
      this.pollIntervals.delete(queueName);
    }

    // Wait for active tasks
    const activePromises = [];
    for (const [queueName, workerState] of this.workers.entries()) {
      if (workerState.activeJobs.size > 0) {
        console.log(`[QueueService] Waiting for ${workerState.activeJobs.size} active jobs in queue "${queueName}"...`);
        for (const jobPromise of workerState.activeJobs) {
          activePromises.push(jobPromise);
        }
      }
    }

    if (activePromises.length > 0) {
      const shutdownTimeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
      await Promise.race([Promise.all(activePromises), shutdownTimeout]);
      console.log(`[QueueService] Graceful shutdown timeout or completion reached.`);
    }

    // Release leases of currently processing jobs back to pending
    for (const workerState of this.workers.values()) {
      for (const job of workerState.activeJobs) {
        try {
          await QueueJob.findByIdAndUpdate(job.jobId, {
            $set: { status: 'pending', lockedUntil: null, lockedBy: null }
          });
        } catch (err) {
          // ignore lock release errors during exit
        }
      }
    }
    console.log(`[QueueService] All queue processing stopped.`);
  }

  startQueuePolling(queueName) {
    // Poll every 5 seconds for tasks
    const timer = setInterval(() => {
      this.pollQueue(queueName).catch((err) => {
        console.error(`[QueueService] Poll error on queue "${queueName}":`, err);
      });
    }, 5000);

    this.pollIntervals.set(queueName, timer);
    // Trigger immediate check
    setImmediate(() => this.pollQueue(queueName));
  }

  async pollQueue(queueName) {
    if (!this.running) return;

    const workerState = this.workers.get(queueName);
    if (!workerState) return;

    // Check concurrency capacity limit
    const availableSlots = workerState.concurrency - workerState.activeJobs.size;
    if (availableSlots <= 0) return;

    const now = new Date();

    // Find claimable candidate jobs
    const candidates = await QueueJob.find({
      queueName,
      status: { $in: ['pending', 'failed'] },
      runAt: { $lte: now },
      $or: [
        { lockedUntil: null },
        { lockedUntil: { $lte: now } } // lock expired (stalled worker recovery)
      ]
    })
      .sort({ priority: -1, runAt: 1 })
      .limit(availableSlots)
      .lean();

    for (const candidate of candidates) {
      if (!this.running) break;
      const jobPromise = this.claimAndProcess(queueName, candidate, workerState);
      workerState.activeJobs.add(jobPromise);
      jobPromise.finally(() => {
        workerState.activeJobs.delete(jobPromise);
        // Immediately poll again for new work
        setImmediate(() => this.pollQueue(queueName));
      });
    }
  }

  async claimAndProcess(queueName, candidate, workerState) {
    const leaseDurationMs = 5 * 60 * 1000; // 5 minute execution lock
    const now = new Date();

    // Atomic compare-and-set claim
    const job = await QueueJob.findOneAndUpdate(
      {
        _id: candidate._id,
        status: candidate.status,
        $or: [
          { lockedUntil: null },
          { lockedUntil: candidate.lockedUntil }
        ]
      },
      {
        $set: {
          status: 'processing',
          lockedBy: this.workerId,
          lockedUntil: new Date(Date.now() + leaseDurationMs)
        },
        $inc: { attempts: 1 }
      },
      { new: true }
    );

    if (!job) {
      // Acquired by another worker instance concurrently
      return;
    }

    // Embed job ID on target promise to release lease on abort/timeout exit
    const currentPromise = (async () => {
      console.log(`[QueueService] Processing job ${job._id} [${job.jobType}] (Attempt #${job.attempts})`);
      try {
        await workerState.processor(job);
        
        // Complete job
        await QueueJob.findByIdAndUpdate(job._id, {
          $set: {
            status: 'completed',
            lockedUntil: null,
            lockedBy: null
          }
        });
        console.log(`[QueueService] Completed job ${job._id} successfully.`);
      } catch (err) {
        console.error(`[QueueService] Job ${job._id} execution failed:`, err.message);
        
        // Calculate retry / exponential backoff
        if (job.attempts >= job.maxAttempts) {
          await QueueJob.findByIdAndUpdate(job._id, {
            $set: {
              status: 'dead-letter',
              lockedUntil: null,
              lockedBy: null,
              lastError: err.message
            }
          });
          console.error(`[QueueService] Job ${job._id} transitioned to Dead Letter queue (Retries exhausted).`);
        } else {
          // Exponential backoff: 2 ^ attempts * 10 seconds
          const backoffSeconds = Math.pow(2, job.attempts) * 10;
          await QueueJob.findByIdAndUpdate(job._id, {
            $set: {
              status: 'failed',
              runAt: new Date(Date.now() + backoffSeconds * 1000),
              lockedUntil: null,
              lockedBy: null,
              lastError: err.message
            }
          });
          console.log(`[QueueService] Rescheduled job ${job._id} for retry in ${backoffSeconds}s.`);
        }
      }
    })();

    currentPromise.jobId = job._id;
    return currentPromise;
  }
}

module.exports = new QueueService();
