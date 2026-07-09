process.env.NODE_ENV = 'test';
require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
const StructuralProcessingPlan = require('../models/StructuralProcessingPlan');
const CodeSegment = require('../models/CodeSegment');
const CodeSymbol = require('../models/CodeSymbol');
const CodeScope = require('../models/CodeScope');
const CodeImport = require('../models/CodeImport');
const CodeExport = require('../models/CodeExport');
const CodeReference = require('../models/CodeReference');
const CodeGraphNode = require('../models/CodeGraphNode');
const CodeGraphEdge = require('../models/CodeGraphEdge');
const ModuleInterfaceFingerprint = require('../models/ModuleInterfaceFingerprint');

const IngestionPipelineOrchestrator = require('../services/repository/IngestionPipelineOrchestrator');
const StructuralQueryService = require('../services/repository/StructuralQueryService');
const StructuralIntelligenceEngine = require('../services/repository/StructuralIntelligenceEngine');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/helio';

async function runTests() {
  console.log('=== STARTING HELIO REPOSITORY STRUCTURAL INTELLIGENCE TEST SUITE ===');

  await mongoose.connect(MONGODB_URI);
  console.log('[DB] Connected to MongoDB.');

  const tenantId = new mongoose.Types.ObjectId().toString();

  // Setup mock repository
  const mockRepoPath = path.join(__dirname, 'mock-repo-structural');
  if (fs.existsSync(mockRepoPath)) {
    fs.rmSync(mockRepoPath, { recursive: true, force: true });
  }
  fs.mkdirSync(mockRepoPath, { recursive: true });

  execSync('git init', { cwd: mockRepoPath });
  execSync('git config user.email "test@helio.ai"', { cwd: mockRepoPath });
  execSync('git config user.name "Helio Builder"', { cwd: mockRepoPath });

  // 1. Initial files setup
  fs.writeFileSync(path.join(mockRepoPath, 'scanner.js'), `
    class BaseScanner {}

    class DeviceScanner extends BaseScanner {
      scan() {
        console.log("Scanning...");
      }
    }

    module.exports = { DeviceScanner };
  `);

  fs.writeFileSync(path.join(mockRepoPath, 'controller.js'), `
    const { DeviceScanner } = require('./scanner');

    function runDiagnostic() {
      const scanner = new DeviceScanner();
      scanner.scan();
    }

    module.exports = runDiagnostic;
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
    installationId: 'test_inst_structural',
    credentialReference: mockRepoPath
  });

  const repo = await Repository.create({
    tenantId,
    connectionId: connection._id,
    providerId: 'github',
    sourceRepositoryId: 'gh_test_structural',
    owner: 'testowner',
    name: 'mock-repo-structural',
    fullName: 'testowner/mock-repo-structural',
    status: 'REGISTERING'
  });

  try {
    // TEST 1: Synchronous sync and structural indexing run
    console.log('[Test 1] Testing initial sync and automatic structural indexing...');
    const sync = await RepositorySync.create({
      tenantId,
      repositoryId: repo._id,
      triggerType: 'INITIAL',
      requestedRevision: 'main',
      status: 'QUEUED'
    });

    await IngestionPipelineOrchestrator.runSyncPipeline(sync._id);

    const updatedSync = await RepositorySync.findById(sync._id);
    const targetSnapshotId = updatedSync.targetSnapshotId;

    const index = await RepositoryStructuralIndex.findOne({
      tenantId,
      repositoryId: repo._id,
      snapshotId: targetSnapshotId
    });

    assert.ok(index);
    assert.strictEqual(index.status, 'READY');
    assert.ok(index.segmentCount > 0);
    assert.ok(index.symbolCount > 0);
    assert.ok(index.graphNodeCount > 0);
    console.log('  -> Structural Index created successfully with status READY.');

    // TEST 2: Verify Segments & Nesting
    console.log('[Test 2] Verifying segments and parent-child nesting...');
    const segments = await CodeSegment.find({ snapshotId: targetSnapshotId, filePath: 'scanner.js' });
    const fileSeg = segments.find(s => s.segmentType === 'FILE');
    const classSeg = segments.find(s => s.segmentType === 'CLASS' && s.name === 'DeviceScanner');
    const methodSeg = segments.find(s => s.segmentType === 'METHOD' && s.name === 'scan');

    assert.ok(fileSeg);
    assert.ok(classSeg);
    assert.ok(methodSeg);
    assert.strictEqual(String(methodSeg.parentSegmentId), String(classSeg._id));
    console.log('  -> Segments nested correctly (scan is METHOD inside class DeviceScanner).');

    // TEST 3: Verify scopes and depth
    console.log('[Test 3] Verifying scope hierarchy depth...');
    const scopes = await CodeScope.find({ snapshotId: targetSnapshotId, filePath: 'scanner.js' });
    const globalScope = scopes.find(s => s.scopeKind === 'GLOBAL');
    const classScope = scopes.find(s => s.scopeKind === 'CLASS' && s.name === 'DeviceScanner');
    const methodScope = scopes.find(s => s.scopeKind === 'METHOD' && s.name === 'scan');

    assert.strictEqual(globalScope.depth, 0);
    assert.strictEqual(classScope.depth, 1);
    assert.strictEqual(methodScope.depth, 2);
    console.log('  -> Scopes depth checked successfully.');

    // TEST 4: Verify imports, exports, and staged reference resolution
    console.log('[Test 4] Verifying imports, exports, and reference resolution...');
    const imports = await CodeImport.find({ snapshotId: targetSnapshotId, sourceFilePath: 'controller.js' });
    const deviceScannerImport = imports.find(i => i.localName === 'DeviceScanner');
    assert.ok(deviceScannerImport);
    assert.strictEqual(deviceScannerImport.resolutionStatus, 'RESOLVED');
    assert.strictEqual(deviceScannerImport.normalizedSpecifier, 'scanner.js');

    const refs = await CodeReference.find({ snapshotId: targetSnapshotId, filePath: 'controller.js' });
    const classRef = refs.find(r => r.referencedName === 'DeviceScanner');
    assert.ok(classRef);
    assert.strictEqual(classRef.resolutionStatus, 'RESOLVED');
    assert.strictEqual(classRef.confidence, 'EXACT');
    console.log('  -> Imports resolved and reference to DeviceScanner connected successfully.');

    // TEST 5: Verify Graph construction
    console.log('[Test 5] Verifying dependency graph nodes and edges...');
    const nodes = await CodeGraphNode.find({ snapshotId: targetSnapshotId });
    const edges = await CodeGraphEdge.find({ snapshotId: targetSnapshotId });

    const fileNode = nodes.find(n => n.nodeType === 'FILE' && n.label === 'controller.js');
    const targetFileNode = nodes.find(n => n.nodeType === 'FILE' && n.label === 'scanner.js');
    assert.ok(fileNode);
    assert.ok(targetFileNode);

    const dependsEdge = edges.find(e => 
      e.edgeType === 'DEPENDS_ON' && 
      e.sourceNodeId === fileNode.logicalNodeId && 
      e.targetNodeId === targetFileNode.logicalNodeId
    );
    assert.ok(dependsEdge);
    console.log('  -> Node & Edges verified successfully (controller.js depends on scanner.js).');

    // TEST 6: Cycle detection
    console.log('[Test 6] Verifying dependency cycle detection...');
    const cyclesBefore = await StructuralQueryService.getDependencyCycles(tenantId, repo._id, targetSnapshotId);
    assert.strictEqual(cyclesBefore.length, 0);

    // Create a cycle: scanner imports controller
    fs.writeFileSync(path.join(mockRepoPath, 'scanner.js'), `
      const runDiagnostic = require('./controller');
      class BaseScanner {}
      class DeviceScanner extends BaseScanner {
        scan() {
          runDiagnostic();
        }
      }
      module.exports = { DeviceScanner };
    `);

    execSync('git add .', { cwd: mockRepoPath });
    execSync('git commit -m "introduce cycle"', { cwd: mockRepoPath });

    const syncCycle = await RepositorySync.create({
      tenantId,
      repositoryId: repo._id,
      triggerType: 'MANUAL',
      requestedRevision: 'main',
      status: 'QUEUED'
    });

    await IngestionPipelineOrchestrator.runSyncPipeline(syncCycle._id);

    const updatedSyncCycle = await RepositorySync.findById(syncCycle._id);
    const cycleSnapshotId = updatedSyncCycle.targetSnapshotId;

    const cyclesAfter = await StructuralQueryService.getDependencyCycles(tenantId, repo._id, cycleSnapshotId);
    assert.ok(cyclesAfter.length > 0);
    console.log('  -> Cycle detected correctly:', JSON.stringify(cyclesAfter));

    // TEST 7: Incremental processing and reuse validation
    console.log('[Test 7] Testing incremental reuse of unchanged files...');
    // We add a new file 'unused.js' but do not modify others.
    fs.writeFileSync(path.join(mockRepoPath, 'unused.js'), `
      const x = 100;
    `);

    execSync('git add .', { cwd: mockRepoPath });
    execSync('git commit -m "add unused.js"', { cwd: mockRepoPath });

    const syncInc = await RepositorySync.create({
      tenantId,
      repositoryId: repo._id,
      triggerType: 'MANUAL',
      requestedRevision: 'main',
      status: 'QUEUED'
    });

    await IngestionPipelineOrchestrator.runSyncPipeline(syncInc._id);

    const updatedSyncInc = await RepositorySync.findById(syncInc._id);
    const incSnapshotId = updatedSyncInc.targetSnapshotId;

    const plan = await StructuralProcessingPlan.findOne({ snapshotId: incSnapshotId });
    assert.ok(plan);
    assert.ok(plan.reusableFiles.includes('controller.js'));
    assert.ok(plan.directlyInvalidatedFiles.includes('unused.js'));
    console.log('  -> Incremental plan successfully reused controller.js.');

    // TEST 8: Graph validation checks (failure injection)
    console.log('[Test 8] Testing cross-tenant boundary validation check...');
    // Try to trigger build index with mismatched tenantId and verify it throws
    await assert.rejects(
      async () => {
        await StructuralIntelligenceEngine.buildIndex(
          'wrong-tenant-id',
          repo._id,
          incSnapshotId
        );
      },
      err => err.message.includes('cross-tenant') || err.message.includes('VALIDATION_FAILURE')
    );
    console.log('  -> Cross-tenant boundary check correctly failed validation.');

    console.log('\n*** ALL REPOSITORY STRUCTURAL INTELLIGENCE TESTS PASSED ***');
  } catch (err) {
    console.error('Test Execution Failed:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup MongoDB documents
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
    await StructuralProcessingPlan.deleteMany({ tenantId });
    await CodeSegment.deleteMany({ tenantId });
    await CodeSymbol.deleteMany({ tenantId });
    await CodeScope.deleteMany({ tenantId });
    await CodeImport.deleteMany({ tenantId });
    await CodeExport.deleteMany({ tenantId });
    await CodeReference.deleteMany({ tenantId });
    await CodeGraphNode.deleteMany({ tenantId });
    await CodeGraphEdge.deleteMany({ tenantId });
    await ModuleInterfaceFingerprint.deleteMany({ tenantId });

    await mongoose.connection.close();

    // Clean mock git folder
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
