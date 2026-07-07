const QueueJob = require('../../models/QueueJob');
const JobAttempt = require('../../models/JobAttempt');
const JobHandlerRegistry = require('./JobHandlerRegistry');
const { MetricsRegistry, baseLogger, generateTraceId } = require('./observability');
const crypto = require('crypto');

class QueueService {
  constructor() {
    this.workerId = `worker_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.workers = new Map(); // queueName -> { processor, concurrency, activeJobs: Set }
    this.running = false;
    this.pollIntervals = new Map(); // queueName -> timer
    this.activeJobAbortControllers = new Map(); // jobIdString -> AbortController
    this.lastProgressUpdates = new Map(); // jobIdString -> timestamp
  }

  /**
   * Enqueues a job into a specific persistent queue.
   */
  async enqueue(queueName, jobType, payload, options = {}) {
    const {
      tenantId = null,
      runAt = new Date(),
      priority = 0,
      maxAttempts = 3,
      idempotencyKey = null,
      correlationId = null,
      causationId = null,
      schemaVersion = 1,
      executionTimeoutMs = 30000,
      createdBy = null
    } = options;

    const traceId = options.traceId || generateTraceId();

    const jobData = {
      tenantId: tenantId ? String(tenantId) : null,
      queueName,
      jobType,
      schemaVersion,
      payload,
      priority,
      status: runAt <= new Date() ? 'QUEUED' : 'PENDING',
      attempts: 0,
      maxAttempts,
      runAt,
      executionTimeoutMs,
      correlationId,
      causationId,
      traceId,
      idempotencyKey,
      createdBy
    };

    try {
      const job = await QueueJob.create(jobData);
      baseLogger.info('job.created', `Enqueued job ${job._id} [${jobType}] into queue ${queueName}`, {
        jobId: job._id,
        jobType,
        tenantId,
        queueName,
        traceId
      });
      MetricsRegistry.incrementCreated(jobType);
      return job;
    } catch (err) {
      // mongoose duplicate key error (idempotency key constraint)
      if (err.code === 11000 && idempotencyKey) {
        const query = { idempotencyKey };
        if (tenantId) query.tenantId = String(tenantId);
        if (jobType) query.jobType = jobType;
        const existingJob = await QueueJob.findOne(query);
        if (existingJob) {
          baseLogger.info('job.duplicate_skipped', `Duplicate job skipped via idempotency key: ${idempotencyKey}`, {
            jobId: existingJob._id,
            jobType,
            tenantId,
            idempotencyKey
          });
          return existingJob;
        }
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

    baseLogger.info('worker.registered', `Registered worker for queue "${queueName}" with concurrency ${concurrency}`, {
      queueName,
      concurrency
    });

    if (this.running) {
      this.startQueuePolling(queueName);
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    baseLogger.info('worker.started', `Starting background queue processing for worker: ${this.workerId}`, {
      workerId: this.workerId
    });
    for (const queueName of this.workers.keys()) {
      this.startQueuePolling(queueName);
    }
  }

  async stop(timeoutMs = 15000) {
    this.running = false;
    baseLogger.info('worker.draining', `Stopping workers and initiating graceful shutdown (timeout: ${timeoutMs}ms)...`, {
      workerId: this.workerId
    });

    // Stop all polling loops
    for (const [queueName, timer] of this.pollIntervals.entries()) {
      clearInterval(timer);
      this.pollIntervals.delete(queueName);
    }

    // Wait for active tasks
    const activePromises = [];
    for (const [queueName, workerState] of this.workers.entries()) {
      if (workerState.activeJobs.size > 0) {
        baseLogger.info('worker.drain_wait', `Waiting for ${workerState.activeJobs.size} active jobs in queue "${queueName}"...`, {
          queueName,
          activeCount: workerState.activeJobs.size
        });
        for (const jobPromise of workerState.activeJobs) {
          activePromises.push(jobPromise);
        }
      }
    }

    if (activePromises.length > 0) {
      const shutdownTimeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
      await Promise.race([Promise.all(activePromises), shutdownTimeout]);
      baseLogger.info('worker.drain_complete', 'Graceful shutdown timeout or completion reached.');
    }

    // Abort remaining active jobs and release leases
    for (const [jobIdStr, abortController] of this.activeJobAbortControllers.entries()) {
      try {
        baseLogger.warn('worker.abort_job', `Aborting active job ${jobIdStr} due to worker shutdown.`, { jobId: jobIdStr });
        abortController.abort();
        
        await QueueJob.findByIdAndUpdate(jobIdStr, {
          $set: {
            status: 'QUEUED',
            lockedUntil: null,
            lockedBy: null,
            leaseToken: null
          }
        });
      } catch (err) {
        // ignore lease release errors during exit
      }
    }
    this.activeJobAbortControllers.clear();
    this.lastProgressUpdates.clear();

    baseLogger.info('worker.stopped', 'All queue processing stopped.', { workerId: this.workerId });
  }

  startQueuePolling(queueName) {
    const timer = setInterval(() => {
      this.pollQueue(queueName).catch((err) => {
        baseLogger.error('worker.poll_error', `Poll error on queue "${queueName}": ${err.message}`, {
          queueName,
          error: err.message
        });
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

    const availableSlots = workerState.concurrency - workerState.activeJobs.size;
    if (availableSlots <= 0) return;

    const now = new Date();

    // Find claimable candidate jobs
    const candidates = await QueueJob.find({
      queueName,
      status: { $in: ['PENDING', 'QUEUED', 'RETRY_SCHEDULED', 'FAILED'] },
      runAt: { $lte: now },
      $or: [
        { lockedUntil: null },
        { lockedUntil: { $lte: now } } // lease expired
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
    const leaseToken = crypto.randomBytes(16).toString('hex');
    // lease duration resolved from policy, fallback to global default 5 minutes
    const handler = JobHandlerRegistry.getHandler(candidate.jobType);
    const policy = (handler && handler.executionPolicy) || {};
    const leaseDurationMs = policy.leaseDurationMs || Number(process.env.JOB_DEFAULT_LEASE_DURATION_MS) || 5 * 60 * 1000;
    const executionTimeoutMs = candidate.executionTimeoutMs || policy.executionTimeoutMs || Number(process.env.JOB_DEFAULT_EXECUTION_TIMEOUT_MS) || 30000;
    const now = new Date();

    // Atomic claim via findOneAndUpdate
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
          status: 'CLAIMED',
          lockedBy: this.workerId,
          leaseToken: leaseToken,
          lockedUntil: new Date(Date.now() + leaseDurationMs),
          claimedAt: now
        },
        $inc: { attempts: 1 }
      },
      { new: true }
    );

    if (!job) {
      // Acquired by another worker instance concurrently
      return;
    }

    const currentPromise = (async () => {
      const startTime = Date.now();
      const attemptNumber = job.attempts;
      
      const jobLogger = baseLogger.child({
        jobId: job._id,
        jobType: job.jobType,
        tenantId: job.tenantId,
        attemptNumber,
        workerId: this.workerId,
        traceId: job.traceId,
        correlationId: job.correlationId
      });

      jobLogger.info('job.claimed', `Claimed job ${job._id} (Attempt #${attemptNumber})`);
      MetricsRegistry.incrementStarted(job.jobType);
      MetricsRegistry.recordQueueWait(job.jobType, Date.now() - new Date(job.runAt).getTime());

      // Transition to RUNNING
      await QueueJob.findByIdAndUpdate(job._id, {
        $set: { status: 'RUNNING', startedAt: new Date() }
      });

      const abortController = new AbortController();
      this.activeJobAbortControllers.set(String(job._id), abortController);

      // Execution context
      const context = {
        jobId: job._id,
        tenantId: job.tenantId,
        attemptNumber,
        traceId: job.traceId,
        correlationId: job.correlationId,
        causationId: job.causationId,
        logger: jobLogger,
        abortSignal: abortController.signal,
        heartbeat: async () => {
          await this.heartbeatJob(job._id, this.workerId, leaseToken, leaseDurationMs);
        },
        reportProgress: async (percentage, stage = '', message = '') => {
          await this.reportProgress(job._id, this.workerId, leaseToken, percentage, stage, message);
        },
        throwIfCancellationRequested: () => {
          if (abortController.signal.aborted) {
            const err = new Error('Job execution was cancelled.');
            err.classification = 'CANCELLED';
            throw err;
          }
        }
      };

      // Set timeout
      let timeoutTriggered = false;
      const timeoutTimer = setTimeout(() => {
        timeoutTriggered = true;
        jobLogger.warn('job.timeout_triggered', `Job ${job._id} exceeded execution timeout of ${executionTimeoutMs}ms. Aborting.`);
        abortController.abort();
      }, executionTimeoutMs);

      try {
        let result;
        if (handler) {
          // Explicit registration handler
          if (handler.validatePayload) {
            handler.validatePayload(job.payload);
          }
          result = await handler.execute(context, job.payload);
        } else {
          // Queue-level processor fallback
          result = await workerState.processor(job, context);
        }

        clearTimeout(timeoutTimer);

        // Verification check of cancellation status
        context.throwIfCancellationRequested();

        // Complete job
        const durationMs = Date.now() - startTime;
        await QueueJob.findOneAndUpdate(
          { _id: job._id, lockedBy: this.workerId, leaseToken },
          {
            $set: {
              status: 'SUCCEEDED',
              completedAt: new Date(),
              lockedUntil: null,
              lockedBy: null,
              leaseToken: null,
              result
            }
          }
        );

        // Save Attempt log
        await JobAttempt.create({
          jobId: job._id,
          tenantId: job.tenantId,
          attemptNumber,
          workerId: this.workerId,
          leaseTokenHash: crypto.createHash('sha256').update(leaseToken).digest('hex'),
          status: 'SUCCEEDED',
          startedAt: now,
          completedAt: new Date(),
          durationMs,
          traceId: job.traceId
        });

        jobLogger.info('job.succeeded', `Completed job ${job._id} successfully in ${durationMs}ms.`);
        MetricsRegistry.incrementSucceeded(job.jobType, durationMs);

      } catch (err) {
        clearTimeout(timeoutTimer);
        const durationMs = Date.now() - startTime;

        // Classify the failure
        const classification = this.classifyError(err, abortController.signal.aborted, timeoutTriggered);
        jobLogger.error('job.failed', `Execution failed: ${err.message}`, {
          error: err.message,
          stack: err.stack,
          classification
        });

        // Save Attempt log
        await JobAttempt.create({
          jobId: job._id,
          tenantId: job.tenantId,
          attemptNumber,
          workerId: this.workerId,
          leaseTokenHash: crypto.createHash('sha256').update(leaseToken).digest('hex'),
          status: 'FAILED',
          startedAt: now,
          completedAt: new Date(),
          durationMs,
          errorCode: err.code || null,
          errorClassification: classification,
          sanitizedErrorMessage: err.message,
          traceId: job.traceId
        });

        MetricsRegistry.incrementFailed(job.jobType, classification, durationMs);

        // Determine if terminal
        const isTerminal =
          attemptNumber >= job.maxAttempts ||
          ['VALIDATION_FAILURE', 'AUTHORIZATION_FAILURE', 'NON_RETRYABLE', 'CANCELLED'].includes(classification);

        if (isTerminal) {
          const finalStatus = classification === 'CANCELLED' ? 'CANCELLED' : 'DEAD_LETTERED';
          const updateData = {
            status: finalStatus,
            lockedUntil: null,
            lockedBy: null,
            leaseToken: null,
            lastError: err.message,
            lastErrorCode: err.code || null,
            lastErrorClassification: classification
          };

          if (finalStatus === 'CANCELLED') {
            updateData.cancelledAt = new Date();
            MetricsRegistry.incrementCancelled(job.jobType);
          } else {
            updateData.deadLetteredAt = new Date();
            MetricsRegistry.incrementDeadLettered(job.jobType);
          }

          await QueueJob.findOneAndUpdate(
            { _id: job._id, lockedBy: this.workerId, leaseToken },
            { $set: updateData }
          );

          jobLogger.warn('job.terminal_failure', `Job ${job._id} transitioned to terminal status: ${finalStatus} (Attempts: ${attemptNumber}/${job.maxAttempts}).`);
        } else {
          // Exponential backoff
          const backoffPolicy = handler?.executionPolicy || {};
          const backoffDelayMs = this.calculateRetryDelay(attemptNumber, backoffPolicy);
          const nextRunAt = new Date(Date.now() + backoffDelayMs);

          await QueueJob.findOneAndUpdate(
            { _id: job._id, lockedBy: this.workerId, leaseToken },
            {
              $set: {
                status: 'RETRY_SCHEDULED',
                runAt: nextRunAt,
                lockedUntil: null,
                lockedBy: null,
                leaseToken: null,
                lastError: err.message,
                lastErrorCode: err.code || null,
                lastErrorClassification: classification
              }
            }
          );

          MetricsRegistry.incrementRetried(job.jobType);
          jobLogger.info('job.retry_scheduled', `Job ${job._id} rescheduled for attempt #${attemptNumber + 1} at ${nextRunAt.toISOString()}`);
        }
      } finally {
        this.activeJobAbortControllers.delete(String(job._id));
        this.lastProgressUpdates.delete(String(job._id));
      }
    })();

    currentPromise.jobId = job._id;
    return currentPromise;
  }

  classifyError(err, isAborted, timeoutTriggered) {
    if (timeoutTriggered) {
      return 'TIMEOUT';
    }
    if (isAborted || err.classification === 'CANCELLED') {
      return 'CANCELLED';
    }
    if (err.name === 'ValidationError' || err.code === 11000) {
      return 'VALIDATION_FAILURE';
    }
    if (err.message && err.message.toLowerCase().includes('timeout')) {
      return 'TIMEOUT';
    }
    if (err.message && (err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('forbidden'))) {
      return 'AUTHORIZATION_FAILURE';
    }
    if (err.message && (err.message.toLowerCase().includes('connection') || err.message.toLowerCase().includes('network') || err.message.toLowerCase().includes('mongodb'))) {
      return 'DEPENDENCY_UNAVAILABLE';
    }
    if (err.message && err.message.toLowerCase().includes('rate limit')) {
      return 'RATE_LIMITED';
    }
    return err.classification || 'UNKNOWN';
  }

  calculateRetryDelay(attemptNumber, policy) {
    const baseDelay = policy.baseRetryDelayMs || Number(process.env.JOB_RETRY_BASE_DELAY_MS) || 10000;
    const maxDelay = policy.maxRetryDelayMs || Number(process.env.JOB_RETRY_MAX_DELAY_MS) || 300000;
    const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attemptNumber - 1));
    
    const jitterMin = Number(process.env.JOB_RETRY_JITTER_MIN) || 0.8;
    const jitterMax = Number(process.env.JOB_RETRY_JITTER_MAX) || 1.2;
    const jitter = jitterMin + Math.random() * (jitterMax - jitterMin);
    
    return Math.round(delay * jitter);
  }

  async heartbeatJob(jobId, workerId, leaseToken, leaseDurationMs) {
    const now = new Date();
    const newLockExpiration = new Date(Date.now() + leaseDurationMs);

    const updated = await QueueJob.findOneAndUpdate(
      {
        _id: jobId,
        lockedBy: workerId,
        leaseToken,
        status: 'RUNNING'
      },
      {
        $set: {
          lockedUntil: newLockExpiration,
          lastHeartbeatAt: now
        }
      },
      { new: true }
    );

    if (!updated) {
      const err = new Error('Heartbeat failed: Job lease ownership lost or incorrect status.');
      err.classification = 'LEASE_LOST';
      throw err;
    }
  }

  async reportProgress(jobId, workerId, leaseToken, percentage, stage, message) {
    const jobIdStr = String(jobId);
    const now = Date.now();
    const minIntervalMs = Number(process.env.JOB_PROGRESS_UPDATE_MIN_INTERVAL_MS) || 1000;
    const lastUpdate = this.lastProgressUpdates.get(jobIdStr) || 0;

    // Throttle progress updates except for 100% or terminal updates
    if (percentage < 100 && now - lastUpdate < minIntervalMs) {
      return;
    }

    const updated = await QueueJob.findOneAndUpdate(
      {
        _id: jobId,
        lockedBy: workerId,
        leaseToken,
        status: 'RUNNING'
      },
      {
        $set: {
          'result.progressPercentage': percentage,
          'result.progressStage': stage,
          'result.progressMessage': message,
          'result.progressUpdatedAt': new Date()
        }
      }
    );

    if (updated) {
      this.lastProgressUpdates.set(jobIdStr, now);
    }
  }

  async triggerCancellation(jobId, operatorUserId) {
    const job = await QueueJob.findById(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (['SUCCEEDED', 'FAILED', 'CANCELLED', 'DEAD_LETTERED'].includes(job.status)) {
      throw new Error(`Job is already in terminal state: ${job.status}`);
    }

    // If job is running, transition to CANCELLATION_REQUESTED
    if (job.status === 'RUNNING') {
      const updated = await QueueJob.findOneAndUpdate(
        { _id: jobId, status: 'RUNNING' },
        {
          $set: { status: 'CANCELLATION_REQUESTED' }
        },
        { new: true }
      );
      if (updated) {
        // Find if running locally and cancel it
        const localController = this.activeJobAbortControllers.get(String(jobId));
        if (localController) {
          localController.abort();
        }
        baseLogger.info('job.cancellation_requested', `Requested cancellation for running job ${jobId} by ${operatorUserId}`);
        return updated;
      }
    }

    // If not running, cancel directly
    const cancelledJob = await QueueJob.findOneAndUpdate(
      {
        _id: jobId,
        status: { $in: ['PENDING', 'QUEUED', 'CLAIMED', 'RETRY_SCHEDULED', 'CANCELLATION_REQUESTED'] }
      },
      {
        $set: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          lockedUntil: null,
          lockedBy: null,
          leaseToken: null
        }
      },
      { new: true }
    );

    if (cancelledJob) {
      MetricsRegistry.incrementCancelled(cancelledJob.jobType);
      baseLogger.info('job.cancelled', `Cancelled job ${jobId} by ${operatorUserId}`);
      return cancelledJob;
    }
    
    throw new Error('Failed to transition job to CANCELLED state.');
  }

  async triggerManualRetry(jobId, operatorUserId) {
    const job = await QueueJob.findById(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (!['FAILED', 'DEAD_LETTERED', 'CANCELLED'].includes(job.status)) {
      throw new Error(`Job is not in a retryable terminal state: ${job.status}`);
    }

    // Reset execution properties, preserve history attempts
    const updatedJob = await QueueJob.findByIdAndUpdate(
      jobId,
      {
        $set: {
          status: 'QUEUED',
          runAt: new Date(),
          lockedUntil: null,
          lockedBy: null,
          leaseToken: null,
          startedAt: null,
          completedAt: null,
          failedAt: null,
          cancelledAt: null,
          deadLetteredAt: null,
          attempts: 0 // Reset attempt counter for manual retry (fresh execution cycle)
        }
      },
      { new: true }
    );

    baseLogger.info('job.manual_retry_requested', `Manual retry requested for job ${jobId} by user ${operatorUserId}`, {
      jobId,
      operatorUserId
    });
    MetricsRegistry.incrementCreated(job.jobType);

    return updatedJob;
  }
}

module.exports = new QueueService();
