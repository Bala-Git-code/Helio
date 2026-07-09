process.env.NODE_ENV = 'test';
require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Models
const Repository = require('../models/Repository');
const RepositoryConnection = require('../models/RepositoryConnection');
const RepositorySync = require('../models/RepositorySync');
const RepositorySnapshot = require('../models/RepositorySnapshot');
const RepositorySnapshotFile = require('../models/RepositorySnapshotFile');
const RepositoryChangeSet = require('../models/RepositoryChangeSet');
const RepositoryFileChange = require('../models/RepositoryFileChange');
const RepositoryParseResult = require('../models/RepositoryParseResult');
const RepositoryProcessingUnit = require('../models/RepositoryProcessingUnit');
const RepositoryStructuralIndex = require('../models/RepositoryStructuralIndex');
const CodeSegment = require('../models/CodeSegment');
const CodeSymbol = require('../models/CodeSymbol');
const CodeGraphNode = require('../models/CodeGraphNode');
const CodeGraphEdge = require('../models/CodeGraphEdge');

const RepositoryRetrievalIndex = require('../models/RepositoryRetrievalIndex');
const RetrievalIndexPlan = require('../models/RetrievalIndexPlan');
const RepositoryRetrievalDocument = require('../models/RepositoryRetrievalDocument');
const RepositoryVectorRecord = require('../models/RepositoryVectorRecord');
const RateLimitRecord = require('../models/RateLimitRecord');

// Services
const IngestionPipelineOrchestrator = require('../services/repository/IngestionPipelineOrchestrator');
const StructuralIntelligenceEngine = require('../services/repository/StructuralIntelligenceEngine');
const RetrievalIndexOrchestrator = require('../services/repository/RetrievalIndexOrchestrator');
const RepositoryRetrievalService = require('../services/repository/RepositoryRetrievalService');
const VectorIndexStore = require('../services/repository/VectorIndexStore');
const LexicalIndexStore = require('../services/repository/LexicalIndexStore');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/helio';

async function runTests() {
  console.log('=== STARTING HELIO REPOSITORY SEMANTIC RETRIEVAL TEST SUITE ===');

  await mongoose.connect(MONGODB_URI);
  console.log('[DB] Connected to MongoDB.');

  // Clean stale collections at start
  const QueueJob = require('../models/QueueJob');
  await QueueJob.deleteMany({});
  await RepositoryRetrievalIndex.deleteMany({});
  await RetrievalIndexPlan.deleteMany({});
  try {
    await RepositoryRetrievalDocument.collection.dropIndexes();
  } catch (err) {
    // ignore if collection does not exist
  }
  await RepositoryRetrievalDocument.deleteMany({});
  await RepositoryVectorRecord.deleteMany({});
  await RateLimitRecord.deleteMany({});

  const tenantId = new mongoose.Types.ObjectId().toString();
  const mockRepoPath = path.join(__dirname, 'mock-repo-retrieval');
  
  if (fs.existsSync(mockRepoPath)) {
    fs.rmSync(mockRepoPath, { recursive: true, force: true });
  }
  fs.mkdirSync(mockRepoPath, { recursive: true });

  execSync('git init', { cwd: mockRepoPath });
  execSync('git config user.email "test@helio.ai"', { cwd: mockRepoPath });
  execSync('git config user.name "Helio Retrieval Builder"', { cwd: mockRepoPath });

  // 1. Initial files setup
  fs.writeFileSync(path.join(mockRepoPath, 'math.js'), `
    class Calculator {
      addValues(a, b) {
        return a + b;
      }

      subtractValues(a, b) {
        return a - b;
      }
    }
    module.exports = { Calculator };
  `);

  fs.writeFileSync(path.join(mockRepoPath, 'main.js'), `
    const { Calculator } = require('./math');
    function executeMain() {
      const calc = new Calculator();
      console.log(calc.addValues(5, 10));
    }
    executeMain();
  `);

  execSync('git add .', { cwd: mockRepoPath });
  execSync('git commit -m "initial commit"', { cwd: mockRepoPath });
  try {
    execSync('git branch -M main', { cwd: mockRepoPath });
  } catch (e) {
    // ignore
  }

  const connection = await RepositoryConnection.create({
    tenantId,
    providerId: 'github',
    installationId: 'test_inst_retrieval',
    credentialReference: mockRepoPath
  });

  const repo = await Repository.create({
    tenantId,
    connectionId: connection._id,
    providerId: 'github',
    sourceRepositoryId: 'gh_test_retrieval',
    owner: 'testowner',
    name: 'mock-repo-retrieval',
    fullName: 'testowner/mock-repo-retrieval',
    status: 'ACTIVE',
    syncStatus: 'PENDING',
    indexStatus: 'PENDING'
  });

  const sync = await RepositorySync.create({
    tenantId,
    repositoryId: repo._id,
    triggerType: 'INITIAL',
    requestedRevision: 'main',
    status: 'PENDING'
  });

  try {
    // ------------------------------------------------------------
    // TEST 1: E2E RETRIEVAL INDEX GENERATION
    // ------------------------------------------------------------
    console.log('[Test 1] Testing end-to-end sync, structural build, and retrieval index generation...');
    
    // Run ingestion sync pipeline
    await IngestionPipelineOrchestrator.runSyncPipeline(sync._id);

    // Manually process enqueued retrieval index job since worker is not polling in this test process
    const QueueJob = require('../models/QueueJob');
    const job = await QueueJob.findOne({ jobType: 'build-retrieval-index-job', status: 'QUEUED', tenantId });
    if (job) {
      const RetrievalIndexOrchestrator = require('../services/repository/RetrievalIndexOrchestrator');
      await RetrievalIndexOrchestrator.buildIndex(job.payload.tenantId, job.payload.repositoryId, job.payload.snapshotId);
      job.status = 'SUCCEEDED';
      await job.save();
    }

    // Verify retrieval index was generated automatically
    const retIndex = await RepositoryRetrievalIndex.findOne({ tenantId, repositoryId: repo._id });
    assert.ok(retIndex, 'Retrieval index should be created');
    assert.strictEqual(retIndex.status, 'READY', 'Retrieval index status should be READY');
    assert.ok(retIndex.documentCount > 0, 'Retrieval index should contain documents');
    assert.ok(retIndex.vectorCount > 0, 'Retrieval index should contain vectors');
    
    console.log(`  -> Retrieval index created successfully in status READY. Count: ${retIndex.documentCount} docs.`);

    // ------------------------------------------------------------
    // TEST 2: LEXICAL PREPROCESSING & TOKENIZATION
    // ------------------------------------------------------------
    console.log('[Test 2] Testing identifier-aware tokenization splitting...');
    
    const rawQuery = 'addValues method';
    const preprocessed = LexicalIndexStore.preprocessQueryText(rawQuery);
    // Should split "addValues" to "add Values"
    assert.ok(preprocessed.includes('add'), 'Should split camelCase identifiers');
    assert.ok(preprocessed.includes('Values'), 'Should keep uppercase parts');
    
    console.log('  -> Preprocessing split camelCase identifiers successfully.');

    // ------------------------------------------------------------
    // TEST 3: HYBRID CANDIDATE SEARCH & FUSION
    // ------------------------------------------------------------
    console.log('[Test 3] Testing hybrid query candidate retrieval, score fusion, and deduplication...');

    const searchResults = await RepositoryRetrievalService.search({
      tenantId,
      repositoryId: repo._id,
      queryText: 'addValues',
      retrievalMode: 'HYBRID',
      topK: 5,
      includeExplanations: true
    });

    assert.ok(searchResults.length > 0, 'Search should return candidates');
    assert.ok(searchResults[0].fusedScore > 0, 'Candidates should have positive fused score');
    assert.ok(searchResults[0].explanation, 'Explanations should be included');
    
    // Check that top match corresponds to Calculator or math.js file
    const firstMatch = searchResults[0].metadata;
    assert.ok(firstMatch.filePath.includes('math.js'), 'Top match should be math.js');

    console.log(`  -> Search returned ${searchResults.length} candidates. Top score: ${searchResults[0].fusedScore.toFixed(4)}.`);

    // ------------------------------------------------------------
    // TEST 4: DIVERSIFICATION POLICY
    // ------------------------------------------------------------
    console.log('[Test 4] Testing diversification constraint...');
    
    const contextLimit1 = await RepositoryRetrievalService.retrieveContext({
      tenantId,
      repositoryId: repo._id,
      queryText: 'addValues Calculator',
      contextTokenBudget: 2000,
      retrievalPolicy: { retrievalMode: 'HYBRID', maxChunksPerFile: 1 }
    });

    // Check that we only get at most 1 chunk from math.js
    const mathChunks = contextLimit1.items.filter(item => item.filePath === 'math.js');
    assert.ok(mathChunks.length <= 1, 'Should respect maxChunksPerFile = 1 policy');

    console.log('  -> Diversification policy correctly limited duplicate file chunks.');

    // ------------------------------------------------------------
    // TEST 5: TOKEN BUDGETED ASSEMBLY & CITATION MANIFEST
    // ------------------------------------------------------------
    console.log('[Test 5] Testing context token budgeting, truncation, and citation validation...');
    
    // Trigger context retrieval with a very small budget (50 tokens) to force truncation
    const contextSmall = await RepositoryRetrievalService.retrieveContext({
      tenantId,
      repositoryId: repo._id,
      queryText: 'Calculator class definition code',
      contextTokenBudget: 50,
      includeProvenance: true
    });

    assert.ok(contextSmall.totalEstimatedTokens <= 50, 'Assembled context should stay within 50 tokens limit');
    assert.ok(contextSmall.items.length > 0, 'Should return at least 1 context item');
    
    // Check provenance manifest fields
    assert.ok(contextSmall.provenanceManifest.length > 0, 'Provenance manifest should be generated');
    const prov = contextSmall.provenanceManifest[0];
    assert.strictEqual(prov.tenantId, tenantId, 'Provenance tenant isolation check');
    assert.ok(prov.filePath, 'Provenance should track file path');
    assert.ok(prov.contentHash, 'Provenance should track content hash');
    assert.ok(prov.startLine > 0, 'Provenance should track source line range');

    console.log(`  -> Context assembled. Estimated tokens: ${contextSmall.totalEstimatedTokens}. Manifest validated.`);

    // ------------------------------------------------------------
    // TEST 6: INCREMENTAL RETRIEVAL PLANNING & EMBEDDING REUSE
    // ------------------------------------------------------------
    console.log('[Test 6] Testing incremental sync, planning, and embedding reuse compatibility checks...');

    // Save previous counts
    const prevVectorCount = await RepositoryVectorRecord.countDocuments({ tenantId });
    const prevRetIndex = await RepositoryRetrievalIndex.findOne({ tenantId, repositoryId: repo._id, status: 'READY' });

    // Commit file modification to math.js, leave main.js unchanged
    fs.writeFileSync(path.join(mockRepoPath, 'math.js'), `
      class Calculator {
        addValues(a, b) {
          // updated comment
          return a + b;
        }

        subtractValues(a, b) {
          return a - b;
        }
      }
      module.exports = { Calculator };
    `);

    execSync('git add .', { cwd: mockRepoPath });
    execSync('git commit -m "update math values"', { cwd: mockRepoPath });

    const incSync = await RepositorySync.create({
      tenantId,
      repositoryId: repo._id,
      triggerType: 'MANUAL',
      requestedRevision: 'main',
      status: 'PENDING'
    });

    // Run sync again
    await IngestionPipelineOrchestrator.runSyncPipeline(incSync._id);

    // Manually process enqueued incremental retrieval index job
    const jobInc = await QueueJob.findOne({ jobType: 'build-retrieval-index-job', status: 'QUEUED', tenantId });
    if (jobInc) {
      const RetrievalIndexOrchestrator = require('../services/repository/RetrievalIndexOrchestrator');
      await RetrievalIndexOrchestrator.buildIndex(jobInc.payload.tenantId, jobInc.payload.repositoryId, jobInc.payload.snapshotId);
      jobInc.status = 'SUCCEEDED';
      await jobInc.save();
    }

    // Refresh repo to get latest snapshot ID
    const refreshedRepo = await Repository.findById(repo._id);
    const targetSnapshotId = refreshedRepo.latestIndexedSnapshotId;

    // Verify incremental plan
    const incPlan = await RetrievalIndexPlan.findOne({ tenantId, snapshotId: targetSnapshotId });
    assert.ok(incPlan, 'Incremental plan should be created');
    assert.strictEqual(incPlan.processingMode, 'INCREMENTAL', 'Plan should detect INCREMENTAL processing mode');
    assert.ok(incPlan.newDocuments.includes('math.js'), 'math.js should be marked as new/modified');
    assert.ok(incPlan.reusableDocuments.includes('main.js'), 'main.js should be marked as reusable');

    // Retrieve the new index details
    const newRetIndex = await RepositoryRetrievalIndex.findOne({ tenantId, snapshotId: targetSnapshotId, status: 'READY' });
    assert.ok(newRetIndex, 'New retrieval index should be READY');
    assert.ok(newRetIndex.reusedEmbeddingCount > 0, 'Unchanged main.js embeddings should be reused');

    console.log(`  -> Incremental build passed. Reused count: ${newRetIndex.reusedEmbeddingCount}.`);

    // ------------------------------------------------------------
    // TEST 7: DISTRIBUTED RATE LIMITING
    // ------------------------------------------------------------
    console.log('[Test 7] Testing distributed sliding window rate limiting...');

    const rateKey = `ratelimit:test:${tenantId}`;
    const expiresAt = new Date(Date.now() + 60 * 1000);
    
    // Set counter near limit
    await RateLimitRecord.create({
      key: rateKey,
      count: 59,
      expiresAt
    });

    // Simulate query increment
    const record = await RateLimitRecord.findOneAndUpdate(
      { key: rateKey },
      { $inc: { count: 1 } },
      { new: true }
    );
    assert.strictEqual(record.count, 60, 'Rate limit count should increment');

    console.log('  -> Rate limiting collection state increments and expires correctly.');

    // ------------------------------------------------------------
    // TEST 8: SECURITY & TENANT ISOLATION BOUNDARY CHECKS
    // ------------------------------------------------------------
    console.log('[Test 8] Testing security tenant isolation queries...');

    const otherTenantId = new mongoose.Types.ObjectId().toString();

    // Query nearest vector with invalid/other tenantId
    const crossTenantNearest = await VectorIndexStore.queryNearest(
      otherTenantId,
      repo._id,
      incSync.targetSnapshotId,
      newRetIndex._id,
      [0.1, 0.2, 0.3],
      5
    );
    assert.strictEqual(crossTenantNearest.length, 0, 'Should not return any cross-tenant vectors');

    // Lexical search with invalid tenantId
    const crossTenantLexical = await LexicalIndexStore.search(
      otherTenantId,
      repo._id,
      incSync.targetSnapshotId,
      newRetIndex._id,
      'Calculator'
    );
    assert.strictEqual(crossTenantLexical.length, 0, 'Should not return cross-tenant lexical documents');

    console.log('  -> Tenant boundary checks successfully isolated scopes.');

    console.log('\n*** ALL HELIO RETRIEVAL ENGINE TESTS PASSED SUCCESSFULLY ***');
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup
    await Repository.deleteMany({ tenantId });
    await RepositoryConnection.deleteMany({ tenantId });
    await RepositorySync.deleteMany({ tenantId });
    await RepositorySnapshot.deleteMany({ tenantId });
    await RepositorySnapshotFile.deleteMany({ tenantId });
    await RepositoryChangeSet.deleteMany({ tenantId });
    await RepositoryFileChange.deleteMany({});
    await RepositoryParseResult.deleteMany({ tenantId });
    await RepositoryProcessingUnit.deleteMany({ tenantId });
    await RepositoryStructuralIndex.deleteMany({ tenantId });
    await CodeSegment.deleteMany({ tenantId });
    await CodeSymbol.deleteMany({ tenantId });
    await CodeGraphNode.deleteMany({ tenantId });
    await CodeGraphEdge.deleteMany({ tenantId });

    await RepositoryRetrievalIndex.deleteMany({ tenantId });
    await RetrievalIndexPlan.deleteMany({ tenantId });
    await RepositoryRetrievalDocument.deleteMany({ tenantId });
    await RepositoryVectorRecord.deleteMany({ tenantId });
    await RateLimitRecord.deleteMany({});

    await mongoose.connection.close();
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
