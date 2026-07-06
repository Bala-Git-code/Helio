process.env.NODE_ENV = 'test';
require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Models
const QueueJob = require('../models/QueueJob');
const OutboxEvent = require('../models/OutboxEvent');
const InboxRecord = require('../models/InboxRecord');

// Services
const QueueService = require('../services/medication/QueueService');
const OutboxService = require('../services/medication/OutboxService');

async function cleanTestData() {
  await QueueJob.deleteMany({});
  await OutboxEvent.deleteMany({});
  await InboxRecord.deleteMany({});
}

async function runSuite() {
  console.log('=== STARTING TRANSACTIONAL OUTBOX & PERSISTENT QUEUE TEST SUITE ===');
  await connectDB();

  // Ensure unique indexes are initialized in MongoDB
  await QueueJob.syncIndexes();
  await OutboxEvent.syncIndexes();
  await InboxRecord.syncIndexes();

  try {
    await cleanTestData();

    // ------------------------------------------------------------
    // TEST 1: PERSISTENT QUEUE ENQUEUE
    // ------------------------------------------------------------
    console.log('[Test 1] Asserting QueueService job enqueue...');
    const job = await QueueService.enqueue(
      'test-queue',
      'test-job-type',
      { data: 'sample-payload' },
      { priority: 10, idempotencyKey: 'test_key_123' }
    );

    assert.ok(job);
    assert.strictEqual(job.queueName, 'test-queue');
    assert.strictEqual(job.jobType, 'test-job-type');
    assert.strictEqual(job.status, 'pending');
    assert.strictEqual(job.priority, 10);
    console.log('  -> Enqueue operations completed successfully.');

    // Test Idempotency key constraint
    const duplicateJob = await QueueService.enqueue(
      'test-queue',
      'test-job-type',
      { data: 'sample-payload' },
      { priority: 10, idempotencyKey: 'test_key_123' }
    );
    assert.strictEqual(String(duplicateJob._id), String(job._id), 'Duplicate job enqueues must return the original job');
    console.log('  -> Idempotency constraint verified successfully.');

    // ------------------------------------------------------------
    // TEST 2: WORKER ACQUISITION & EXECUTION
    // ------------------------------------------------------------
    console.log('[Test 2] Asserting QueueService worker claiming and processing...');
    let processed = false;
    let payloadValue = '';

    QueueService.registerWorker('test-queue', 1, async (workerJob) => {
      processed = true;
      payloadValue = workerJob.payload.data;
    });

    QueueService.start();

    // Wait for the job poller loop to run and execute
    await new Promise((resolve) => setTimeout(resolve, 6000));

    assert.ok(processed, 'Worker handler must execute enqueued job');
    assert.strictEqual(payloadValue, 'sample-payload');
    
    const reloadedJob = await QueueJob.findById(job._id);
    assert.strictEqual(reloadedJob.status, 'completed', 'Completed job must transition to completed status');
    console.log('  -> Worker claimed and completed the persistent job.');

    // ------------------------------------------------------------
    // TEST 3: TRANSACTIONAL OUTBOX PUBLISHING
    // ------------------------------------------------------------
    console.log('[Test 3] Asserting OutboxService persistence and polling...');
    const outboxEvent = await OutboxService.publishEvent(
      'test.event',
      'TestAggregate',
      'agg_999',
      'patient_888',
      { content: 'event-message' }
    );

    assert.ok(outboxEvent);
    assert.strictEqual(outboxEvent.eventType, 'test.event');
    assert.strictEqual(outboxEvent.processingState, 'pending');
    
    // Start outbox poller
    OutboxService.start();
    
    // Wait for the outbox poller to trigger and complete
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const reloadedEvent = await OutboxEvent.findById(outboxEvent._id);
    assert.strictEqual(reloadedEvent.processingState, 'completed', 'Processed event must transition to completed state');
    console.log('  -> Outbox event successfully routed and completed.');

    // ------------------------------------------------------------
    // TEST 4: INBOX DEDUPLICATION (EFFECTIVELY ONCE OUTCOMES)
    // ------------------------------------------------------------
    console.log('[Test 4] Asserting Inbox Record duplicate event execution suppression... ');
    
    const inboxFn = require('../worker');
    
    // We want to test runIdempotentInbox from worker.js or duplicate the logic here for validation
    let runCount = 0;
    const testIdempotentCall = async (eventId) => {
      try {
        await InboxRecord.create({
          consumerName: 'test-consumer',
          eventId,
          processedAt: new Date()
        });
        runCount++;
      } catch (err) {
        if (err.code === 11000) {
          // duplicate detected, skip
          return;
        }
        throw err;
      }
    };

    await testIdempotentCall('evt_123');
    await testIdempotentCall('evt_123'); // Duplicate, should be suppressed

    assert.strictEqual(runCount, 1, 'Duplicate inbox records must suppress secondary processing attempts');
    console.log('  -> Inbox deduplication verified successfully.');

    console.log('\n*** OUTBOX & QUEUE TESTS COMPLETED 100% SUCCESSFULLY ***');
    await cleanTestData();
  } catch (err) {
    console.error('\n❌ OUTBOX & QUEUE TEST SUITE ENCOUNTERED A FAILURE:');
    console.error(err);
    await cleanTestData();
    process.exit(1);
  } finally {
    await QueueService.stop();
    OutboxService.stop();
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

runSuite();
