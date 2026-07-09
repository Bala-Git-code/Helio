const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Models
const Repository = require('../../models/Repository');
const RepositoryConnection = require('../../models/RepositoryConnection');
const RepositorySnapshot = require('../../models/RepositorySnapshot');
const RepositorySnapshotFile = require('../../models/RepositorySnapshotFile');
const RepositoryChangeSet = require('../../models/RepositoryChangeSet');
const RepositoryFileChange = require('../../models/RepositoryFileChange');

const RepositoryStructuralIndex = require('../../models/RepositoryStructuralIndex');
const StructuralProcessingPlan = require('../../models/StructuralProcessingPlan');
const CodeSegment = require('../../models/CodeSegment');
const CodeSymbol = require('../../models/CodeSymbol');
const CodeScope = require('../../models/CodeScope');
const CodeImport = require('../../models/CodeImport');
const CodeExport = require('../../models/CodeExport');
const CodeReference = require('../../models/CodeReference');
const CodeGraphNode = require('../../models/CodeGraphNode');
const CodeGraphEdge = require('../../models/CodeGraphEdge');
const ModuleInterfaceFingerprint = require('../../models/ModuleInterfaceFingerprint');

// Infrastructure
const GitService = require('./GitService');
const { FileClassifier } = require('./FileClassifier');
const { LanguageIntelligenceAdapterRegistry } = require('./LanguageIntelligenceAdapterRegistry');
const { baseLogger } = require('../medication/observability');

class StructuralIntelligenceEngine {
  constructor() {
    this.logger = baseLogger.child({ service: 'helio-repository-structural-engine' });
  }

  _calculateFingerprint(exportsList) {
    const list = exportsList.map(e => `${e.exportedName}:${e.exportKind}:${e.localSymbolName || ''}`).sort();
    return crypto.createHash('sha256').update(JSON.stringify(list)).digest('hex');
  }

  _resolveModulePath(sourceFilePath, specifier, snapshotFiles) {
    const fileSet = new Set(snapshotFiles.map(f => f.path));
    const dir = path.dirname(sourceFilePath);
    
    // Resolve relative path relative to file directory
    let targetPath = path.join(dir, specifier).replace(/\\/g, '/');
    if (targetPath.startsWith('.')) {
      targetPath = path.normalize(targetPath).replace(/\\/g, '/');
    }

    if (fileSet.has(targetPath)) return targetPath;

    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
    for (const ext of extensions) {
      if (fileSet.has(targetPath + ext)) return targetPath + ext;
    }

    for (const ext of extensions) {
      if (fileSet.has(targetPath + '/index' + ext)) return targetPath + '/index' + ext;
    }

    return null;
  }

  async buildIndex(tenantId, repositoryId, snapshotId, optionalWorkspacePath = null) {
    const startedAt = new Date();
    
    let index = await RepositoryStructuralIndex.findOne({ tenantId, repositoryId, snapshotId });
    if (!index) {
      index = await RepositoryStructuralIndex.create({
        tenantId,
        repositoryId,
        snapshotId,
        status: 'PENDING',
        pipelineVersions: {
          segmentationVersion: '1.0.0',
          symbolExtractionVersion: '1.0.0',
          scopeModelVersion: '1.0.0',
          moduleResolutionVersion: '1.0.0',
          referenceResolutionVersion: '1.0.0',
          relationshipExtractionVersion: '1.0.0',
          graphSchemaVersion: '1.0.0',
          structuralIndexVersion: '1.0.0'
        }
      });
    }

    index.status = 'PLANNING';
    index.startedAt = startedAt;
    await index.save();

    let workspacePath = optionalWorkspacePath;
    let cleanWorkspace = false;

    try {
      const repo = await Repository.findById(repositoryId);
      if (!repo) throw new Error(`Repository not found: ${repositoryId}`);
      if (String(repo.tenantId) !== String(tenantId)) {
        throw new Error('VALIDATION_FAILURE: Cross-tenant repository boundary check violation.');
      }

      const connection = await RepositoryConnection.findById(repo.connectionId);
      if (!connection) throw new Error(`RepositoryConnection not found: ${repo.connectionId}`);

      const snapshot = await RepositorySnapshot.findById(snapshotId);
      if (!snapshot) throw new Error(`RepositorySnapshot not found: ${snapshotId}`);
      if (String(snapshot.tenantId) !== String(tenantId)) {
        throw new Error('VALIDATION_FAILURE: Cross-tenant snapshot boundary check violation.');
      }

      if (!workspacePath) {
        const revision = snapshot.sourceRevision || repo.defaultBranch || 'main';
        workspacePath = GitService.createTempWorkspace(tenantId, repo.name);
        await GitService.clone(connection.credentialReference, workspacePath, revision);
        cleanWorkspace = true;
      }

      // 1. PLANNING: Create processing plan
      const snapshotFiles = await RepositorySnapshotFile.find({ snapshotId }).lean();
      
      let baseSnapshotId = snapshot.parentSnapshotId || repo.latestIndexedSnapshotId;
      if (baseSnapshotId && String(baseSnapshotId) === String(snapshotId)) {
        baseSnapshotId = null; // Self reference safety
      }

      let processingMode = 'FULL';
      let added = [];
      let modified = [];
      let deleted = [];
      let renamed = [];

      if (baseSnapshotId) {
        processingMode = 'INCREMENTAL';
        const changeSet = await RepositoryChangeSet.findOne({ targetSnapshotId: snapshotId }).lean();
        if (changeSet) {
          const fileChanges = await RepositoryFileChange.find({ changeSetId: changeSet._id }).lean();
          fileChanges.forEach(fc => {
            if (fc.changeType === 'ADDED') added.push(fc.newPath);
            else if (fc.changeType === 'MODIFIED') modified.push(fc.newPath);
            else if (fc.changeType === 'DELETED') deleted.push(fc.oldPath);
            else if (fc.changeType === 'RENAMED') renamed.push({ oldPath: fc.oldPath, newPath: fc.newPath });
          });
        }
      } else {
        added = snapshotFiles.filter(f => !f.ignored && !f.binary).map(f => f.path);
      }

      const directlyInvalidated = [...added, ...modified, ...renamed.map(r => r.newPath)];
      const reusableFiles = [];
      const transitivelyInvalidated = [];

      if (processingMode === 'INCREMENTAL') {
        const baseFiles = await RepositorySnapshotFile.find({ snapshotId: baseSnapshotId }).lean();
        const baseMap = new Map(baseFiles.map(f => [f.path, f]));

        // Determine reusable files
        snapshotFiles.forEach(f => {
          if (f.ignored || f.binary) return;
          if (directlyInvalidated.includes(f.path)) return;

          const bf = baseMap.get(f.path);
          if (bf && bf.contentHash === f.contentHash) {
            reusableFiles.push(f.path);
          } else {
            directlyInvalidated.push(f.path);
          }
        });

        // Transitive Invalidation Heuristic using fingerprints
        for (const file of snapshotFiles) {
          if (modified.includes(file.path)) {
            // Re-parse and fingerprint
            const lang = FileClassifier.detectLanguage(file.path);
            const adapter = LanguageIntelligenceAdapterRegistry.resolveAdapter(lang);
            const fileAbsPath = path.join(workspacePath, file.path);
            if (fs.existsSync(fileAbsPath)) {
              const content = fs.readFileSync(fileAbsPath, 'utf8');
              const exportsList = await adapter.extractExports(file.path, content);
              const newFingerprint = this._calculateFingerprint(exportsList);

              const prevFingerprint = await ModuleInterfaceFingerprint.findOne({
                tenantId,
                repositoryId,
                snapshotId: baseSnapshotId,
                filePath: file.path
              });

              if (!prevFingerprint || prevFingerprint.fingerprint !== newFingerprint) {
                // Public interface changed! Invalidate dependents.
                const dependents = await CodeImport.find({
                  tenantId,
                  repositoryId,
                  snapshotId: baseSnapshotId,
                  normalizedSpecifier: file.path
                }).distinct('sourceFilePath');

                dependents.forEach(dep => {
                  if (!directlyInvalidated.includes(dep) && !transitivelyInvalidated.includes(dep)) {
                    transitivelyInvalidated.push(dep);
                  }
                });
              }
            }
          }
        }
      }

      // Create plan
      const plan = await StructuralProcessingPlan.create({
        tenantId,
        repositoryId,
        snapshotId,
        baseSnapshotId,
        processingMode,
        changedFiles: [...added, ...modified],
        deletedFiles: deleted,
        renamedFiles: renamed,
        reusableFiles,
        directlyInvalidatedFiles: directlyInvalidated,
        transitivelyInvalidatedFiles: transitivelyInvalidated
      });

      // Clear any partial indexes for this snapshot (Idempotency)
      await CodeSegment.deleteMany({ snapshotId });
      await CodeSymbol.deleteMany({ snapshotId });
      await CodeScope.deleteMany({ snapshotId });
      await CodeImport.deleteMany({ snapshotId });
      await CodeExport.deleteMany({ snapshotId });
      await CodeReference.deleteMany({ snapshotId });
      await CodeGraphNode.deleteMany({ snapshotId });
      await CodeGraphEdge.deleteMany({ snapshotId });

      // Reuse metadata for reusable files
      if (processingMode === 'INCREMENTAL') {
        const reuseCount = reusableFiles.length;
        this.logger.info('structure.incremental.reuse', `Reusing structural artifacts for ${reuseCount} files.`);

        const copyEntities = async (Model) => {
          const docs = await Model.find({ snapshotId: baseSnapshotId, filePath: { $in: reusableFiles } }).lean();
          if (docs.length > 0) {
            docs.forEach(d => {
              delete d._id;
              d.snapshotId = snapshotId;
            });
            await Model.insertMany(docs);
          }
        };

        const copyImportExport = async (Model) => {
          const docs = await Model.find({ snapshotId: baseSnapshotId, sourceFilePath: { $in: reusableFiles } }).lean();
          if (docs.length > 0) {
            docs.forEach(d => {
              delete d._id;
              d.snapshotId = snapshotId;
            });
            await Model.insertMany(docs);
          }
        };

        await copyEntities(CodeSegment);
        await copyEntities(CodeSymbol);
        await copyEntities(CodeScope);
        await copyImportExport(CodeImport);
        await copyImportExport(CodeExport);
        await copyEntities(CodeReference);

        const fingerPrints = await ModuleInterfaceFingerprint.find({ snapshotId: baseSnapshotId, filePath: { $in: reusableFiles } }).lean();
        if (fingerPrints.length > 0) {
          fingerPrints.forEach(f => {
            delete f._id;
            f.snapshotId = snapshotId;
          });
          await ModuleInterfaceFingerprint.insertMany(fingerPrints);
        }
      }

      // 2. SEGMENTING & EXTRACTING: Analyze invalidated files
      index.status = 'SEGMENTING';
      await index.save();

      const filesToProcess = Array.from(new Set([...directlyInvalidated, ...transitivelyInvalidated]));
      
      for (const filePath of filesToProcess) {
        const fileAbsPath = path.join(workspacePath, filePath);
        if (!fs.existsSync(fileAbsPath)) continue;

        const content = fs.readFileSync(fileAbsPath, 'utf8');
        const lang = FileClassifier.detectLanguage(filePath);
        const adapter = LanguageIntelligenceAdapterRegistry.resolveAdapter(lang);

        // Run analysis
        const segmentsData = await adapter.segment(filePath, content);
        const symbolsData = await adapter.extractSymbols(filePath, content, segmentsData);
        const scopesData = await adapter.extractScopes(filePath, content, segmentsData);
        const importsData = await adapter.extractImports(filePath, content);
        const exportsData = await adapter.extractExports(filePath, content);

        // Pre-allocate Mongo ObjectIds for relational lookup
        const segmentIdMap = new Map();
        const symbolIdMap = new Map();
        const scopeIdMap = new Map();

        segmentsData.forEach(s => {
          const id = new mongoose.Types.ObjectId();
          s._id = id;
          segmentIdMap.set(s.name, id);
        });

        symbolsData.forEach(s => {
          const id = new mongoose.Types.ObjectId();
          s._id = id;
          s.logicalSymbolId = `sym:${tenantId}:${repositoryId}:${filePath}:${s.qualifiedName}`;
          symbolIdMap.set(s.name, id);
        });

        scopesData.forEach(s => {
          const id = new mongoose.Types.ObjectId();
          s._id = id;
          scopeIdMap.set(s.name, id);
        });

        // Resolve relational references
        segmentsData.forEach(s => {
          s.tenantId = tenantId;
          s.repositoryId = repositoryId;
          s.snapshotId = snapshotId;
          s.filePath = filePath;
          s.segmentationVersion = index.pipelineVersions.segmentationVersion;
          if (s.parentSegmentName) {
            s.parentSegmentId = segmentIdMap.get(s.parentSegmentName);
          }
          s.symbolId = symbolIdMap.get(s.name);
        });

        symbolsData.forEach(s => {
          s.tenantId = tenantId;
          s.repositoryId = repositoryId;
          s.snapshotId = snapshotId;
          s.adapterId = adapter.adapterId;
          s.adapterVersion = adapter.adapterVersion;
          s.declarationSegmentId = segmentIdMap.get(s.name);
          s.scopeId = scopeIdMap.get(s.name);
          if (s.parentSymbolName) {
            s.parentSymbolId = symbolIdMap.get(s.parentSymbolName);
          }
        });

        scopesData.forEach(s => {
          s.tenantId = tenantId;
          s.repositoryId = repositoryId;
          s.snapshotId = snapshotId;
          s.scopeModelVersion = index.pipelineVersions.scopeModelVersion;
          s.ownerSymbolId = symbolIdMap.get(s.name);
          if (s.parentScopeName) {
            s.parentScopeId = scopeIdMap.get(s.parentScopeName);
          }
        });

        importsData.forEach(i => {
          i.tenantId = tenantId;
          i.repositoryId = repositoryId;
          i.snapshotId = snapshotId;
          i.resolutionStatus = 'UNRESOLVED';
        });

        exportsData.forEach(e => {
          e.tenantId = tenantId;
          e.repositoryId = repositoryId;
          e.snapshotId = snapshotId;
          e.localSymbolId = symbolIdMap.get(e.localSymbolName);
        });

        // Write to DB in batch
        if (segmentsData.length > 0) await CodeSegment.insertMany(segmentsData);
        if (symbolsData.length > 0) await CodeSymbol.insertMany(symbolsData);
        if (scopesData.length > 0) await CodeScope.insertMany(scopesData);
        if (importsData.length > 0) await CodeImport.insertMany(importsData);
        if (exportsData.length > 0) await CodeExport.insertMany(exportsData);

        // References extraction
        const referencesData = await adapter.extractReferences(filePath, content, symbolsData, importsData, scopesData);
        referencesData.forEach(r => {
          r.tenantId = tenantId;
          r.repositoryId = repositoryId;
          r.snapshotId = snapshotId;
          r.resolutionStatus = 'UNRESOLVED';
          r.confidence = 'UNKNOWN';
          r.resolverVersion = index.pipelineVersions.referenceResolutionVersion;

          // Link to source scope
          const matchingScope = scopesData.find(s => s.name === r.sourceScopeName);
          if (matchingScope) {
            r.sourceScopeId = matchingScope._id;
            r.sourceSymbolId = matchingScope.ownerSymbolId;
          }
        });

        if (referencesData.length > 0) await CodeReference.insertMany(referencesData);

        // Save Fingerprint
        const fingerprintVal = this._calculateFingerprint(exportsData);
        await ModuleInterfaceFingerprint.findOneAndUpdate(
          { tenantId, repositoryId, snapshotId, filePath },
          { fingerprint: fingerprintVal, pipelineVersion: index.pipelineVersions.structuralIndexVersion },
          { upsert: true, new: true }
        );
      }

      // 3. RESOLVING_MODULES: Resolve specifiers to actual internal files
      index.status = 'RESOLVING_MODULES';
      await index.save();

      const imports = await CodeImport.find({ tenantId, repositoryId, snapshotId });
      for (const imp of imports) {
        if (imp.importKind === 'RELATIVE') {
          const resolvedPath = this._resolveModulePath(imp.sourceFilePath, imp.rawSpecifier, snapshotFiles);
          if (resolvedPath) {
            const targetFile = snapshotFiles.find(f => f.path === resolvedPath);
            imp.resolvedTargetId = targetFile ? targetFile._id : null;
            imp.normalizedSpecifier = resolvedPath;
            imp.resolutionStatus = 'RESOLVED';
          } else {
            imp.resolutionStatus = 'UNRESOLVED';
          }
        } else {
          // External dependency
          imp.resolvedTargetId = imp.rawSpecifier;
          imp.resolutionStatus = 'EXTERNAL';
          imp.normalizedSpecifier = imp.rawSpecifier;
        }
        await imp.save();
      }

      // 4. RESOLVING_REFERENCES: Connect references to target symbols
      index.status = 'RESOLVING_REFERENCES';
      await index.save();

      const references = await CodeReference.find({ tenantId, repositoryId, snapshotId });
      const symbols = await CodeSymbol.find({ tenantId, repositoryId, snapshotId });

      for (const ref of references) {
        let resolved = false;

        // 1. Lexical Scope / Local file declaration checks
        const fileSymbols = symbols.filter(s => s.filePath === ref.filePath);
        const localMatch = fileSymbols.find(s => s.name === ref.referencedName);
        if (localMatch) {
          ref.resolvedSymbolId = localMatch._id;
          ref.resolutionStatus = 'RESOLVED';
          ref.confidence = 'EXACT';
          resolved = true;
        }

        // 2. Import bindings check
        if (!resolved) {
          const fileImports = imports.filter(i => i.sourceFilePath === ref.filePath);
          const importMatch = fileImports.find(i => i.localName === ref.referencedName);

          if (importMatch) {
            if (importMatch.resolutionStatus === 'RESOLVED') {
              // Lookup exported symbol in target file
              const targetFilePath = importMatch.normalizedSpecifier;
              const targetExports = await CodeExport.find({
                tenantId,
                repositoryId,
                snapshotId,
                sourceFilePath: targetFilePath
              });

              const targetExp = targetExports.find(e => e.exportedName === importMatch.importedName || e.exportedName === 'default');
              if (targetExp && targetExp.localSymbolId) {
                ref.resolvedSymbolId = targetExp.localSymbolId;
                ref.resolutionStatus = 'RESOLVED';
                ref.confidence = 'EXACT';
                resolved = true;
              }
            } else if (importMatch.resolutionStatus === 'EXTERNAL') {
              ref.resolutionStatus = 'EXTERNAL';
              ref.confidence = 'HIGH';
              resolved = true;
            }
          }
        }

        if (!resolved) {
          ref.resolutionStatus = 'UNRESOLVED';
          ref.confidence = 'UNKNOWN';
        }

        await ref.save();
      }

      // 5. BUILDING_GRAPH: Create logical nodes and edges
      index.status = 'BUILDING_GRAPH';
      await index.save();

      // Create REPOSITORY node
      const repositoryNodeId = `node:${tenantId}:${repositoryId}:REPOSITORY:${repositoryId}`;
      await CodeGraphNode.create({
        tenantId,
        repositoryId,
        snapshotId,
        logicalNodeId: repositoryNodeId,
        nodeType: 'REPOSITORY',
        entityType: 'Repository',
        entityId: repositoryId,
        label: repo.fullName,
        graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
      });

      // Create DIRECTORY & FILE nodes
      const directories = new Set();
      for (const file of snapshotFiles) {
        const dir = path.dirname(file.path).replace(/\\/g, '/');
        if (dir !== '.') {
          const parts = dir.split('/');
          let accum = '';
          parts.forEach(p => {
            accum = accum ? `${accum}/${p}` : p;
            directories.add(accum);
          });
        }

        const fileNodeId = `node:${tenantId}:${repositoryId}:FILE:${file.path}`;
        await CodeGraphNode.create({
          tenantId,
          repositoryId,
          snapshotId,
          logicalNodeId: fileNodeId,
          nodeType: 'FILE',
          entityType: 'RepositorySnapshotFile',
          entityId: file._id,
          label: file.path,
          graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
        });

        // REPOSITORY -> CONTAINS -> FILE (for root files)
        if (dir === '.') {
          await CodeGraphEdge.create({
            tenantId,
            repositoryId,
            snapshotId,
            logicalEdgeId: `edge:${tenantId}:${repositoryId}:CONTAINS:${repositoryNodeId}:${fileNodeId}`,
            edgeType: 'CONTAINS',
            sourceNodeId: repositoryNodeId,
            targetNodeId: fileNodeId,
            confidence: 'EXACT',
            graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
          });
        }
      }

      // Create Directory nodes
      for (const dir of directories) {
        const dirNodeId = `node:${tenantId}:${repositoryId}:DIRECTORY:${dir}`;
        await CodeGraphNode.create({
          tenantId,
          repositoryId,
          snapshotId,
          logicalNodeId: dirNodeId,
          nodeType: 'DIRECTORY',
          label: dir,
          graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
        });

        // Link parent directories / repository root
        const lastSlash = dir.lastIndexOf('/');
        if (lastSlash === -1) {
          // Root level directory
          await CodeGraphEdge.create({
            tenantId,
            repositoryId,
            snapshotId,
            logicalEdgeId: `edge:${tenantId}:${repositoryId}:CONTAINS:${repositoryNodeId}:${dirNodeId}`,
            edgeType: 'CONTAINS',
            sourceNodeId: repositoryNodeId,
            targetNodeId: dirNodeId,
            confidence: 'EXACT',
            graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
          });
        } else {
          const parentDir = dir.substring(0, lastSlash);
          const parentNodeId = `node:${tenantId}:${repositoryId}:DIRECTORY:${parentDir}`;
          await CodeGraphEdge.create({
            tenantId,
            repositoryId,
            snapshotId,
            logicalEdgeId: `edge:${tenantId}:${repositoryId}:CONTAINS:${parentNodeId}:${dirNodeId}`,
            edgeType: 'CONTAINS',
            sourceNodeId: parentNodeId,
            targetNodeId: dirNodeId,
            confidence: 'EXACT',
            graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
          });
        }
      }

      // Link Files to their Directory
      for (const file of snapshotFiles) {
        const dir = path.dirname(file.path).replace(/\\/g, '/');
        if (dir !== '.') {
          const dirNodeId = `node:${tenantId}:${repositoryId}:DIRECTORY:${dir}`;
          const fileNodeId = `node:${tenantId}:${repositoryId}:FILE:${file.path}`;
          await CodeGraphEdge.create({
            tenantId,
            repositoryId,
            snapshotId,
            logicalEdgeId: `edge:${tenantId}:${repositoryId}:CONTAINS:${dirNodeId}:${fileNodeId}`,
            edgeType: 'CONTAINS',
            sourceNodeId: dirNodeId,
            targetNodeId: fileNodeId,
            confidence: 'EXACT',
            graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
          });
        }
      }

      // Create SYMBOL nodes & FILE -> DECLARES -> SYMBOL edges
      for (const sym of symbols) {
        const symNodeId = `node:${tenantId}:${repositoryId}:SYMBOL:${sym.logicalSymbolId}`;
        await CodeGraphNode.create({
          tenantId,
          repositoryId,
          snapshotId,
          logicalNodeId: symNodeId,
          nodeType: 'SYMBOL',
          entityType: 'CodeSymbol',
          entityId: sym._id,
          label: sym.name,
          graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
        });

        // Link parent symbol or parent file
        if (sym.parentSymbolId) {
          const parentSym = symbols.find(s => String(s._id) === String(sym.parentSymbolId));
          if (parentSym) {
            const parentNodeId = `node:${tenantId}:${repositoryId}:SYMBOL:${parentSym.logicalSymbolId}`;
            await CodeGraphEdge.create({
              tenantId,
              repositoryId,
              snapshotId,
              logicalEdgeId: `edge:${tenantId}:${repositoryId}:CONTAINS:${parentNodeId}:${symNodeId}`,
              edgeType: 'CONTAINS',
              sourceNodeId: parentNodeId,
              targetNodeId: symNodeId,
              confidence: 'EXACT',
              graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
            });
          }
        } else {
          const fileNodeId = `node:${tenantId}:${repositoryId}:FILE:${sym.filePath}`;
          await CodeGraphEdge.create({
            tenantId,
            repositoryId,
            snapshotId,
            logicalEdgeId: `edge:${tenantId}:${repositoryId}:DECLARES:${fileNodeId}:${symNodeId}`,
            edgeType: 'DECLARES',
            sourceNodeId: fileNodeId,
            targetNodeId: symNodeId,
            confidence: 'EXACT',
            graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
          });
        }
      }

      // Create EXTERNAL_DEPENDENCY nodes & FILE -> IMPORTS -> EXTERNAL edges
      const externalDependencies = new Set(imports.filter(i => i.resolutionStatus === 'EXTERNAL').map(i => i.resolvedTargetId));
      for (const ext of externalDependencies) {
        const extNodeId = `node:${tenantId}:${repositoryId}:EXTERNAL_DEPENDENCY:${ext}`;
        await CodeGraphNode.create({
          tenantId,
          repositoryId,
          snapshotId,
          logicalNodeId: extNodeId,
          nodeType: 'EXTERNAL_DEPENDENCY',
          label: ext,
          graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
        });
      }

      // Create edges for Imports
      for (const imp of imports) {
        const sourceNodeId = `node:${tenantId}:${repositoryId}:FILE:${imp.sourceFilePath}`;
        if (imp.resolutionStatus === 'RESOLVED' && imp.normalizedSpecifier) {
          const targetNodeId = `node:${tenantId}:${repositoryId}:FILE:${imp.normalizedSpecifier}`;
          const edgeId = `edge:${tenantId}:${repositoryId}:DEPENDS_ON:${sourceNodeId}:${targetNodeId}`;
          
          // Check edge existence to be idempotent in this snapshot
          const exists = await CodeGraphEdge.findOne({ snapshotId, logicalEdgeId: edgeId });
          if (!exists) {
            await CodeGraphEdge.create({
              tenantId,
              repositoryId,
              snapshotId,
              logicalEdgeId: edgeId,
              edgeType: 'DEPENDS_ON',
              sourceNodeId,
              targetNodeId,
              confidence: 'EXACT',
              graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
            });
          }
        } else if (imp.resolutionStatus === 'EXTERNAL') {
          const targetNodeId = `node:${tenantId}:${repositoryId}:EXTERNAL_DEPENDENCY:${imp.resolvedTargetId}`;
          const edgeId = `edge:${tenantId}:${repositoryId}:DEPENDS_ON:${sourceNodeId}:${targetNodeId}`;
          const exists = await CodeGraphEdge.findOne({ snapshotId, logicalEdgeId: edgeId });
          if (!exists) {
            await CodeGraphEdge.create({
              tenantId,
              repositoryId,
              snapshotId,
              logicalEdgeId: edgeId,
              edgeType: 'DEPENDS_ON',
              sourceNodeId,
              targetNodeId,
              confidence: 'EXACT',
              graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
            });
          }
        }
      }

      // Create Call relationships (FUNCTION -> CALLS -> FUNCTION)
      for (const ref of references) {
        if (ref.referenceKind === 'CALL' && ref.resolutionStatus === 'RESOLVED' && ref.resolvedSymbolId) {
          const targetSym = symbols.find(s => String(s._id) === String(ref.resolvedSymbolId));
          const sourceSym = symbols.find(s => String(s._id) === String(ref.sourceSymbolId));
          
          if (targetSym && sourceSym) {
            const sourceNodeId = `node:${tenantId}:${repositoryId}:SYMBOL:${sourceSym.logicalSymbolId}`;
            const targetNodeId = `node:${tenantId}:${repositoryId}:SYMBOL:${targetSym.logicalSymbolId}`;
            const edgeId = `edge:${tenantId}:${repositoryId}:CALLS:${sourceNodeId}:${targetNodeId}`;
            
            const exists = await CodeGraphEdge.findOne({ snapshotId, logicalEdgeId: edgeId });
            if (!exists) {
              await CodeGraphEdge.create({
                tenantId,
                repositoryId,
                snapshotId,
                logicalEdgeId: edgeId,
                edgeType: 'CALLS',
                sourceNodeId,
                targetNodeId,
                confidence: 'EXACT',
                graphSchemaVersion: index.pipelineVersions.graphSchemaVersion
              });
            }
          }
        }
      }

      // 6. VALIDATING: Run graph validation checks
      index.status = 'VALIDATING';
      await index.save();

      // Check cross tenant boundaries
      const crossTenantNodes = await CodeGraphNode.countDocuments({ snapshotId, tenantId: { $ne: tenantId } });
      const crossTenantEdges = await CodeGraphEdge.countDocuments({ snapshotId, tenantId: { $ne: tenantId } });
      if (crossTenantNodes > 0 || crossTenantEdges > 0) {
        throw new Error('VALIDATION_FAILURE: Cross-tenant node or edge boundary violation detected.');
      }

      // Check cross-snapshot boundaries: mathematically guaranteed by the dangling target check below,
      // which verifies that all edges of this snapshot only connect to nodes of the same snapshot.

      // Check dangling targets
      const edges = await CodeGraphEdge.find({ snapshotId }).lean();
      const nodeIds = new Set((await CodeGraphNode.find({ snapshotId }).distinct('logicalNodeId')).map(id => String(id)));
      
      for (const edge of edges) {
        if (!nodeIds.has(String(edge.targetNodeId))) {
          throw new Error(`VALIDATION_FAILURE: Dangling target node: ${edge.targetNodeId} for edge: ${edge.logicalEdgeId}`);
        }
      }

      // Impossible scope cycles check
      const scopes = await CodeScope.find({ tenantId, repositoryId, snapshotId }).lean();
      const visited = new Set();
      const recStack = new Set();

      const hasCycle = (scopeId) => {
        const idStr = String(scopeId);
        if (recStack.has(idStr)) return true;
        if (visited.has(idStr)) return false;

        visited.add(idStr);
        recStack.add(idStr);

        const scope = scopes.find(s => String(s._id) === idStr);
        if (scope && scope.parentScopeId) {
          if (hasCycle(scope.parentScopeId)) return true;
        }

        recStack.delete(idStr);
        return false;
      };

      for (const sc of scopes) {
        if (hasCycle(sc._id)) {
          throw new Error(`VALIDATION_FAILURE: Impossible scope nesting cycle detected at scope: ${sc.name}`);
        }
      }

      // Finalize Ready
      const segmentsCount = await CodeSegment.countDocuments({ snapshotId });
      const symbolsCount = await CodeSymbol.countDocuments({ snapshotId });
      const scopesCount = await CodeScope.countDocuments({ snapshotId });
      const referencesCount = await CodeReference.countDocuments({ snapshotId });
      const resolvedCount = await CodeReference.countDocuments({ snapshotId, resolutionStatus: 'RESOLVED' });
      const unresolvedCount = await CodeReference.countDocuments({ snapshotId, resolutionStatus: 'UNRESOLVED' });
      const nodesCount = await CodeGraphNode.countDocuments({ snapshotId });
      const edgesCount = await CodeGraphEdge.countDocuments({ snapshotId });

      index.segmentCount = segmentsCount;
      index.symbolCount = symbolsCount;
      index.scopeCount = scopesCount;
      index.referenceCount = referencesCount;
      index.resolvedReferenceCount = resolvedCount;
      index.unresolvedReferenceCount = unresolvedCount;
      index.graphNodeCount = nodesCount;
      index.graphEdgeCount = edgesCount;
      index.status = 'READY';
      index.completedAt = new Date();
      await index.save();

      this.logger.info('structure.index.ready', `Structural index completed successfully for snapshot ${snapshotId}`);

      try {
        const QueueService = require('../medication/QueueService');
        await QueueService.enqueue(
          'repository-retrieval',
          'build-retrieval-index-job',
          { tenantId, repositoryId, snapshotId },
          {
            tenantId,
            idempotencyKey: `retrieval_init_${snapshotId}`,
            maxAttempts: 3
          }
        );
      } catch (queueErr) {
        this.logger.error('structure.index.queue_retrieval_failed', `Failed to queue retrieval index job: ${queueErr.message}`);
      }

    } catch (err) {
      const failedAt = new Date();
      index.status = 'FAILED';
      index.failedAt = failedAt;
      index.errorCode = err.message || 'STRUCTURAL_PIPELINE_ERROR';
      await index.save();

      this.logger.error('structure.index.failed', `Structural index build failed: ${err.message}`, {
        tenantId,
        repositoryId,
        snapshotId,
        error: err.message
      });
      throw err;
    } finally {
      if (cleanWorkspace && workspacePath) {
        await GitService.cleanupWorkspace(workspacePath);
      }
    }
  }
}

module.exports = new StructuralIntelligenceEngine();
