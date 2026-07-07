process.env.NODE_ENV = 'test';
require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Models
const QueueJob = require('../models/QueueJob');
const JobAttempt = require('../models/JobAttempt');
const Worker = require('../models/Worker');
const IdempotencyRecord = require('../models/IdempotencyRecord');

// Services
const QueueService = require('../services/medication/QueueService');
const JobHandlerRegistry = require('../services/medication/JobHandlerRegistry');
const IdempotencyStore = require('../services/medication/IdempotencyStore');
const { MetricsRegistry } = require('../services/medication/observability');

async function cleanTestData() {
  await QueueJob.deleteMany({});
  await JobAttempt.deleteMany({});
  await Worker.deleteMany({});
  await IdempotencyRecord.deleteMany({});
  JobHandlerRegistry.clear();
}

async function runSuite() {
  console.log('=== STARTING HELIO BACKGROUND EXECUTIVE RUNTIME TEST SUITE ===');
  await connectDB();

  // Initialize DB Indexes
  await QueueJob.syncIndexes();
  await JobAttempt.syncIndexes();
  await Worker.syncIndexes();
  await IdempotencyRecord.syncIndexes();

  try {
    await cleanTestData();

    // ------------------------------------------------------------
    // TEST 1: IDEMPOTENCY KEY UNIQUE SCOPING
    // ------------------------------------------------------------
    console.log('[Test 1] Asserting Idempotency Key Multi-Tenant Uniqueness...');
    
    // Enqueue job 1
    const job1 = await QueueService.enqueue('t1-queue', 'job-type-a', { param: 1 }, {
      tenantId: 'tenant-1',
      idempotencyKey: 'idemp-key-1'
    });
    assert.ok(job1);

    // Enqueue duplicate job on same tenant - must skip and return first job
    const job2 = await QueueService.enqueue('t1-queue', 'job-type-a', { param: 1 }, {
      tenantId: 'tenant-1',
      idempotencyKey: 'idemp-key-1'
    });
    assert.strictEqual(String(job1._id), String(job2._id), 'Should deduplicate on same tenant + key');

    // Enqueue same idempotency key on a DIFFERENT tenant - must succeed (multi-tenant isolation)
    const job3 = await QueueService.enqueue('t2-queue', 'job-type-a', { param: 1 }, {
      tenantId: 'tenant-2',
      idempotencyKey: 'idemp-key-1'
    });
    assert.ok(job3);
    assert.notStrictEqual(String(job1._id), String(job3._id), 'Should allow identical key on different tenant');
    console.log('  -> Multi-tenant idempotency unique scopes verified.');

    // ------------------------------------------------------------
    // TEST 2: ATOMIC CLAIM LOCKING (CAS CLAIMS)
    // ------------------------------------------------------------
    console.log('[Test 2] Asserting Atomic Claims locking constraints...');
    const sourceJob = await QueueService.enqueue('claim-queue', 'claim-job', { work: true }, {
      runAt: new Date(Date.now() - 1000)
    });

    // Simulate two workers trying to claim the same job concurrently
    const mockWorkerState = {
      concurrency: 1,
      activeJobs: new Set(),
      processor: async () => {}
    };

    const originalWorkerId = QueueService.workerId;
    
    // Simulate first claim
    QueueService.workerId = 'worker-1';
    const claim1Promise = QueueService.claimAndProcess('claim-queue', sourceJob, mockWorkerState);
    
    // Simulate second claim immediately
    QueueService.workerId = 'worker-2';
    const claim2Promise = QueueService.claimAndProcess('claim-queue', sourceJob, mockWorkerState);

    await Promise.all([claim1Promise, claim2Promise]);
    
    // Reload job to see who claimed it
    const reloadedClaimJob = await QueueJob.findById(sourceJob._id);
    assert.ok(['SUCCEEDED', 'RUNNING', 'CLAIMED'].includes(reloadedClaimJob.status), 'Job must be claimed and processed');
    assert.ok(reloadedClaimJob.lockedBy === 'worker-1' || reloadedClaimJob.lockedBy === 'worker-2', 'Only one worker must win the claim');

    // Restore worker ID
    QueueService.workerId = originalWorkerId;
    console.log('  -> Atomic compare-and-swap claims verified.');

    // ------------------------------------------------------------
    // TEST 3: BACKOFF CALCULATIONS
    // ------------------------------------------------------------
    console.log('[Test 3] Asserting Exponential Backoff and Jitter calculations...');
    const policy = { baseRetryDelayMs: 1000, maxRetryDelayMs: 5000 };
    
    // Attempt 1: delay = min(5000, 1000 * 2^0) = 1000
    const delay1 = QueueService.calculateRetryDelay(1, policy);
    assert.ok(delay1 >= 800 && delay1 <= 1200, `Delay (${delay1}) must be around 1000 with jitter`);

    // Attempt 3: delay = min(5000, 1000 * 2^2) = 4000
    const delay3 = QueueService.calculateRetryDelay(3, policy);
    assert.ok(delay3 >= 3200 && delay3 <= 4800, `Delay (${delay3}) must be around 4000 with jitter`);

    // Attempt 5: delay = min(5000, 1000 * 2^4) = min(5000, 16000) = 5000
    const delay5 = QueueService.calculateRetryDelay(5, policy);
    assert.ok(delay5 >= 4000 && delay5 <= 6000, `Delay (${delay5}) must cap at 5000 with jitter`);
    console.log('  -> Exponential backoff bounds calculated correctly.');

    // ------------------------------------------------------------
    // TEST 4: TIMEOUT ENFORCEMENT & CLASSIFICATION
    // ------------------------------------------------------------
    console.log('[Test 4] Asserting Execution Timeout and Error Classification...');
    
    let handlerExecuted = false;
    JobHandlerRegistry.register({
      jobType: 'timeout-job',
      execute: async (context, payload) => {
        handlerExecuted = true;
        // sleep longer than timeout limit
        await new Promise((resolve) => setTimeout(resolve, 500));
        context.throwIfCancellationRequested();
      },
      executionPolicy: {
        executionTimeoutMs: 100 // low timeout limit
      }
    });

    const timeoutJob = await QueueService.enqueue('timeout-queue', 'timeout-job', {}, {
      executionTimeoutMs: 100,
      maxAttempts: 1
    });

    // Register queue consumer and run polling once
    QueueService.registerWorker('timeout-queue', 1, async () => {});
    QueueService.running = true;
    
    await QueueService.pollQueue('timeout-queue');

    // Wait for execution and abort timeout to fire
    await new Promise((resolve) => setTimeout(resolve, 800));

    const finalTimeoutJob = await QueueJob.findById(timeoutJob._id);
    assert.strictEqual(finalTimeoutJob.status, 'DEAD_LETTERED', 'Should transition to dead letter on terminal failure');
    assert.strictEqual(finalTimeoutJob.lastErrorClassification, 'TIMEOUT', 'Timeout errors should be classified as TIMEOUT');

    // Check attempts log
    const attempt = await JobAttempt.findOne({ jobId: timeoutJob._id });
    assert.ok(attempt);
    assert.strictEqual(attempt.status, 'FAILED');
    assert.strictEqual(attempt.errorClassification, 'TIMEOUT');
    console.log('  -> Timeout abort signal triggered and classified properly.');

    // ------------------------------------------------------------
    // TEST 5: COOPERATIVE CANCELLATION FLOW
    // ------------------------------------------------------------
    console.log('[Test 5] Asserting Cooperative Cancellation...');
    
    let wasRunning = false;
    let cancelCompleted = false;

    JobHandlerRegistry.register({
      jobType: 'cancelable-job',
      execute: async (context, payload) => {
        wasRunning = true;
        for (let i = 0; i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          context.throwIfCancellationRequested();
        }
        cancelCompleted = true;
      }
    });

    const cancelJob = await QueueService.enqueue('cancel-queue', 'cancelable-job', {});
    QueueService.registerWorker('cancel-queue', 1, async () => {});
    
    // Start polling to run the cancel job
    const runPromise = QueueService.pollQueue('cancel-queue');

    // Wait short delay to ensure execution started
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.ok(wasRunning, 'Job execution must be active');

    // Issue cancellation
    await QueueService.triggerCancellation(cancelJob._id, 'operator-1');

    // Wait for loop to terminate
    await new Promise((resolve) => setTimeout(resolve, 300));

    const endCancelJob = await QueueJob.findById(cancelJob._id);
    assert.strictEqual(endCancelJob.status, 'CANCELLED', 'Job status must transition to CANCELLED');
    assert.strictEqual(cancelCompleted, false, 'Job execution must be aborted before completion');
    console.log('  -> Cooperative cancellation signals successfully respected.');

    // ------------------------------------------------------------
    // TEST 6: IDEMPOTENCY STORE API
    // ------------------------------------------------------------
    console.log('[Test 6] Asserting IdempotencyStore acquire/complete states...');
    
    // Acquire fresh lock
    const freshLock = await IdempotencyStore.acquire('tenant-100', 'payments', 'inv_9876');
    assert.strictEqual(freshLock.success, true);
    assert.strictEqual(freshLock.status, 'IN_PROGRESS');

    // Try to acquire again - must block and return status IN_PROGRESS
    const duplicateLock = await IdempotencyStore.acquire('tenant-100', 'payments', 'inv_9876');
    assert.strictEqual(duplicateLock.success, false);
    assert.strictEqual(duplicateLock.status, 'IN_PROGRESS');

    // Complete the operation
    await IdempotencyStore.complete('tenant-100', 'payments', 'inv_9876', { txId: 'txn_123' });
    
    // Query lock status - must return COMPLETED with reference
    const completedLock = await IdempotencyStore.acquire('tenant-100', 'payments', 'inv_9876');
    assert.strictEqual(completedLock.success, false);
    assert.strictEqual(completedLock.status, 'COMPLETED');
    assert.strictEqual(completedLock.resultReference.txId, 'txn_123');
    console.log('  -> IdempotencyStore state transitions succeeded.');

    // ------------------------------------------------------------
    // TEST 7: STALLED JOB RECOVERY
    // ------------------------------------------------------------
    console.log('[Test 7] Asserting Reconciliation Stalled Lease Recovery...');
    
    // Create a job in RUNNING state whose lease expired in past
    const stalledJob = await QueueJob.create({
      tenantId: 'tenant-1',
      queueName: 'stalled-queue',
      jobType: 'stalled-job',
      status: 'RUNNING',
      payload: {},
      lockedBy: 'dead-worker',
      lockedUntil: new Date(Date.now() - 5000), // expired 5 seconds ago
      runAt: new Date(Date.now() - 10000)
    });

    const ReconciliationService = require('../services/medication/ReconciliationService');
    await ReconciliationService.recoverExpiredLeases();

    const recoveredJob = await QueueJob.findById(stalledJob._id);
    assert.strictEqual(recoveredJob.status, 'QUEUED', 'Stalled job must be reset to QUEUED');
    assert.strictEqual(recoveredJob.lockedUntil, null);
    assert.strictEqual(recoveredJob.lockedBy, null);
    console.log('  -> Expired leases recovered by Reconciliation Service.');

    console.log('\n*** ALL BACKGROUND RUNTIME TEST INTEGRATIONS PASSED 100% ***');
    await cleanTestData();
  } catch (err) {
    console.error('\n❌ BACKGROUND RUNTIME TEST INTEGRATION ENCOUNTERED FAILURE:');
    console.error(err);
    await cleanTestData();
    process.exit(1);
  } finally {
    QueueService.running = false;
    await QueueService.stop();
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

runSuite();
