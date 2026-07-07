process.env.NODE_ENV = 'test';
require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const Repository = require('../models/Repository');
const RepositoryConnection = require('../models/RepositoryConnection');
const RepositorySync = require('../models/RepositorySync');
const RepositorySnapshot = require('../models/RepositorySnapshot');
const RepositorySnapshotFile = require('../models/RepositorySnapshotFile');
const RepositoryChangeSet = require('../models/RepositoryChangeSet');
const RepositoryFileChange = require('../models/RepositoryFileChange');
const RepositoryProcessingUnit = require('../models/RepositoryProcessingUnit');
const RepositoryParseResult = require('../models/RepositoryParseResult');
const RepositoryWebhookReceipt = require('../models/RepositoryWebhookReceipt');

const { FileClassifier } = require('../services/repository/FileClassifier');
const IngestionPipelineOrchestrator = require('../services/repository/IngestionPipelineOrchestrator');
const GitHubProviderAdapter = require('../services/repository/GitHubProviderAdapter');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/helio';

async function runTests() {
  console.log('=== STARTING HELIO REPOSITORY INGESTION TEST SUITE ===');

  // Connect to database
  await mongoose.connect(MONGODB_URI);
  console.log('[DB] Connected to MongoDB fallback successfully.');

  const tenantId = new mongoose.Types.ObjectId().toString();

  // Setup dynamic mock git repository
  const mockRepoPath = path.join(__dirname, 'mock-repo-src');
  if (fs.existsSync(mockRepoPath)) {
    fs.rmSync(mockRepoPath, { recursive: true, force: true });
  }
  fs.mkdirSync(mockRepoPath, { recursive: true });

  // Initialize Git repo
  execSync('git init', { cwd: mockRepoPath });
  execSync('git config user.email "test@helio.ai"', { cwd: mockRepoPath });
  execSync('git config user.name "Helio Builder"', { cwd: mockRepoPath });

  // Add first commit files
  fs.writeFileSync(path.join(mockRepoPath, 'file1.js'), `
    // Sample JS file
    import os from 'os';
    const express = require('express');

    class ClinicalScanner {
      scanRecord(recordId) {
        console.log("scanning record", recordId);
      }
    }

    function getPatientDose(patientId) {
      return 100;
    }

    module.exports = { ClinicalScanner, getPatientDose };
  `);

  fs.writeFileSync(path.join(mockRepoPath, 'file2.md'), `
    # Patient Intake Guidelines
    Welcome to the hospital intake procedure.
    
    ## Requirements
    - Check insurance [Insurance Link](https://helio.ai/insurance)
    - Assign ward
  `);

  fs.writeFileSync(path.join(mockRepoPath, 'binary.bin'), Buffer.from([0, 1, 2, 0, 3, 4, 5, 0]));

  const nodeModulesDir = path.join(mockRepoPath, 'node_modules');
  fs.mkdirSync(nodeModulesDir);
  fs.writeFileSync(path.join(nodeModulesDir, 'package.json'), '{"name": "temp"}');

  execSync('git add .', { cwd: mockRepoPath });
  execSync('git commit -m "initial commit"', { cwd: mockRepoPath });
  try {
    execSync('git branch -M main', { cwd: mockRepoPath });
  } catch (e) {
    // ignore branch name rename failure
  }

  // Create Connection Record
  const connection = await RepositoryConnection.create({
    tenantId,
    providerId: 'github',
    installationId: 'test_inst_123',
    credentialReference: mockRepoPath
  });

  try {
    // Test 1: Safe path traversal checking
    console.log('[Test 1] Verifying Path Safety & Traversal checks...');
    assert.strictEqual(FileClassifier.isSafePath('src/components/button.js'), true);
    assert.strictEqual(FileClassifier.isSafePath('../../etc/passwd'), false);
    assert.strictEqual(FileClassifier.isSafePath('src/../components/button.js'), false);
    console.log('  -> Path safety checks passed.');

    // Test 2: Binary & Ignored detection
    console.log('[Test 2] Verifying Binary & Ignored detection rules...');
    const binFilePath = path.join(mockRepoPath, 'binary.bin');
    assert.strictEqual(FileClassifier.isBinary(binFilePath), true);

    const jsFilePath = path.join(mockRepoPath, 'file1.js');
    assert.strictEqual(FileClassifier.isBinary(jsFilePath), false);

    assert.strictEqual(FileClassifier.isIgnored('node_modules/package.json'), true);
    assert.strictEqual(FileClassifier.isIgnored('src/components/button.js'), false);
    console.log('  -> Binary/ignore detection passed.');

    // Test 3: FULL Sync run
    console.log('[Test 3] Testing initial FULL repository synchronization pipeline...');
    const repo = await Repository.create({
      tenantId,
      connectionId: connection._id,
      providerId: 'github',
      sourceRepositoryId: 'gh_test_mock',
      owner: 'testowner',
      name: 'mock-repo',
      fullName: 'testowner/mock-repo',
      status: 'REGISTERING'
    });

    const sync = await RepositorySync.create({
      tenantId,
      repositoryId: repo._id,
      triggerType: 'INITIAL',
      requestedRevision: 'main',
      status: 'QUEUED'
    });

    await IngestionPipelineOrchestrator.runSyncPipeline(sync._id);

    const updatedRepo = await Repository.findById(repo._id);
    assert.strictEqual(updatedRepo.status, 'READY');
    assert.strictEqual(updatedRepo.syncStatus, 'SUCCESS');
    assert.strictEqual(updatedRepo.indexStatus, 'SUCCESS');
    assert.ok(updatedRepo.latestSnapshotId);

    const snapshotFiles = await RepositorySnapshotFile.find({ snapshotId: updatedRepo.latestSnapshotId });
    assert.strictEqual(snapshotFiles.length, 3);

    const file1 = snapshotFiles.find(f => f.path === 'file1.js');
    assert.strictEqual(file1.language, 'javascript');
    assert.strictEqual(file1.binary, false);

    const binaryFile = snapshotFiles.find(f => f.path === 'binary.bin');
    assert.strictEqual(binaryFile.binary, true);

    const parseResult = await RepositoryParseResult.findOne({
      snapshotId: updatedRepo.latestSnapshotId,
      path: 'file1.js'
    });
    assert.strictEqual(parseResult.status, 'SUCCESS');
    assert.strictEqual(parseResult.artifactReference.classes[0].name, 'ClinicalScanner');
    assert.strictEqual(parseResult.artifactReference.functions[0].name, 'getPatientDose');

    const mdParseResult = await RepositoryParseResult.findOne({
      snapshotId: updatedRepo.latestSnapshotId,
      path: 'file2.md'
    });
    assert.strictEqual(mdParseResult.status, 'SUCCESS');
    assert.strictEqual(mdParseResult.artifactReference.headers[0].text, 'Patient Intake Guidelines');
    console.log('  -> FULL sync pipeline passed.');

    // Test 4: INCREMENTAL Sync
    console.log('[Test 4] Testing INCREMENTAL repository sync (added, modified, deleted)...');
    fs.writeFileSync(path.join(mockRepoPath, 'file1.js'), `
      import os from 'os';
      const express = require('express');

      class ClinicalScanner {
        scanRecord(recordId) {
          console.log("scanning record", recordId);
        }
      }

      function getPatientDose(patientId) {
        return 100;
      }
      
      function newAuditFunction() {
        return true;
      }

      module.exports = { ClinicalScanner, getPatientDose, newAuditFunction };
    `);

    fs.writeFileSync(path.join(mockRepoPath, 'file3.js'), `
      // Newly added file
      const x = 42;
    `);

    fs.rmSync(path.join(mockRepoPath, 'file2.md'));

    execSync('git add .', { cwd: mockRepoPath });
    execSync('git commit -m "incremental changes"', { cwd: mockRepoPath });

    const syncInc = await RepositorySync.create({
      tenantId,
      repositoryId: repo._id,
      triggerType: 'MANUAL',
      requestedRevision: 'main',
      status: 'QUEUED'
    });

    await IngestionPipelineOrchestrator.runSyncPipeline(syncInc._id);

    const updatedSyncInc = await RepositorySync.findById(syncInc._id);
    const changeSet = await RepositoryChangeSet.findOne({ targetSnapshotId: updatedSyncInc.targetSnapshotId });
    assert.strictEqual(changeSet.addedCount, 1);
    assert.strictEqual(changeSet.modifiedCount, 1);
    assert.strictEqual(changeSet.deletedCount, 1);

    const addedChange = await RepositoryFileChange.findOne({ changeSetId: changeSet._id, changeType: 'ADDED' });
    assert.strictEqual(addedChange.newPath, 'file3.js');

    const deletedChange = await RepositoryFileChange.findOne({ changeSetId: changeSet._id, changeType: 'DELETED' });
    assert.strictEqual(deletedChange.oldPath, 'file2.md');
    console.log('  -> INCREMENTAL sync pipeline passed.');

    // Test 5: Webhooks verification & receipts deduplication
    console.log('[Test 5] Verifying Webhook signatures & receipt replay checks...');
    const adapter = new GitHubProviderAdapter();
    const mockPayload = {
      ref: 'refs/heads/main',
      after: 'f1c50ceb1234567890abcdef1234567890abcdef',
      repository: {
        id: 12345,
        name: 'mock-repo',
        owner: { login: 'testowner' }
      }
    };
    
    const bodyStr = JSON.stringify(mockPayload);
    const secret = 'webhook_secret';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(bodyStr);
    const signature = 'sha256=' + hmac.digest('hex');

    const reqMock = {
      headers: {
        'x-hub-signature-256': signature,
        'x-github-event': 'push',
        'x-github-delivery': 'unique-uuid-12345'
      },
      rawBody: bodyStr,
      body: mockPayload
    };

    assert.strictEqual(await adapter.verifyWebhook(reqMock, secret), true);

    const invalidReqMock = {
      headers: {
        'x-hub-signature-256': 'sha256=invalidhashvalue1234',
        'x-github-event': 'push',
        'x-github-delivery': 'unique-uuid-12345'
      },
      rawBody: bodyStr,
      body: mockPayload
    };
    assert.strictEqual(await adapter.verifyWebhook(invalidReqMock, secret), false);

    // Deduplication test
    const deliveryId = 'delivery-dedup-999';
    await RepositoryWebhookReceipt.create({
      providerId: 'github',
      deliveryId,
      eventType: 'push',
      status: 'PENDING'
    });

    await assert.rejects(
      async () => {
        await RepositoryWebhookReceipt.create({
          providerId: 'github',
          deliveryId,
          eventType: 'push',
          status: 'PENDING'
        });
      },
      err => err.code === 11000
    );
    console.log('  -> Webhook signatures & replay check passed.');

    console.log('\n*** ALL HELIO REPOSITORY INGESTION TESTS PASSED 100% ***');
  } catch (err) {
    console.error('Test Execution Failed:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup Mongoose collections
    await Repository.deleteMany({ tenantId });
    await RepositoryConnection.deleteMany({ tenantId });
    await RepositorySync.deleteMany({ tenantId });
    await RepositorySnapshot.deleteMany({ tenantId });
    await RepositorySnapshotFile.deleteMany({ tenantId });
    await RepositoryChangeSet.deleteMany({ tenantId });
    await RepositoryFileChange.deleteMany({});
    await RepositoryParseResult.deleteMany({ tenantId });
    await RepositoryProcessingUnit.deleteMany({ tenantId });
    await RepositoryWebhookReceipt.deleteMany({ tenantId });

    await mongoose.connection.close();

    // Clean local mock git folder
    if (fs.existsSync(mockRepoPath)) {
      fs.rmSync(mockRepoPath, { recursive: true, force: true });
    }
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
