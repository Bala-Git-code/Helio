const mongoose = require('mongoose');

// Models
const RepositoryStructuralIndex = require('../../models/RepositoryStructuralIndex');
const CodeSegment = require('../../models/CodeSegment');
const CodeSymbol = require('../../models/CodeSymbol');
const CodeScope = require('../../models/CodeScope');
const CodeImport = require('../../models/CodeImport');
const CodeExport = require('../../models/CodeExport');
const CodeReference = require('../../models/CodeReference');
const CodeGraphNode = require('../../models/CodeGraphNode');
const CodeGraphEdge = require('../../models/CodeGraphEdge');

class StructuralQueryService {
  async getStructuralIndexStatus(tenantId, repositoryId, snapshotId) {
    return await RepositoryStructuralIndex.findOne({ tenantId, repositoryId, snapshotId });
  }

  async getFileStructure(tenantId, repositoryId, snapshotId, filePath) {
    const segments = await CodeSegment.find({ tenantId, repositoryId, snapshotId, filePath }).sort({ startLine: 1 });
    const symbols = await CodeSymbol.find({ tenantId, repositoryId, snapshotId, filePath }).sort({ startLine: 1 });
    const scopes = await CodeScope.find({ tenantId, repositoryId, snapshotId, filePath }).sort({ startLine: 1 });
    const imports = await CodeImport.find({ tenantId, repositoryId, snapshotId, sourceFilePath: filePath }).sort({ startLine: 1 });
    const exports = await CodeExport.find({ tenantId, repositoryId, snapshotId, sourceFilePath: filePath }).sort({ startLine: 1 });

    return { segments, symbols, scopes, imports, exports };
  }

  async getSymbol(tenantId, repositoryId, snapshotId, symbolId) {
    const symbol = await CodeSymbol.findOne({ tenantId, repositoryId, snapshotId, _id: symbolId }).lean();
    if (!symbol) return null;

    const scope = symbol.scopeId ? await CodeScope.findOne({ tenantId, repositoryId, snapshotId, _id: symbol.scopeId }) : null;
    const parentSymbol = symbol.parentSymbolId ? await CodeSymbol.findOne({ tenantId, repositoryId, snapshotId, _id: symbol.parentSymbolId }) : null;
    const children = await CodeSymbol.find({ tenantId, repositoryId, snapshotId, parentSymbolId: symbolId });

    // References count
    const refCount = await CodeReference.countDocuments({ tenantId, repositoryId, snapshotId, resolvedSymbolId: symbolId });

    return {
      symbol,
      scope,
      parentSymbol,
      children,
      referenceCount: refCount
    };
  }

  async findSymbols(tenantId, repositoryId, snapshotId, filters = {}, page = 1, limit = 20) {
    const query = { tenantId, repositoryId, snapshotId };
    
    if (filters.name) {
      query.name = new RegExp(filters.name, 'i');
    }
    if (filters.qualifiedName) {
      query.qualifiedName = new RegExp(filters.qualifiedName, 'i');
    }
    if (filters.symbolKind) {
      query.symbolKind = filters.symbolKind;
    }
    if (filters.filePath) {
      query.filePath = filters.filePath;
    }
    if (filters.visibility) {
      query.visibility = filters.visibility;
    }

    const total = await CodeSymbol.countDocuments(query);
    const items = await CodeSymbol.find(query)
      .sort({ qualifiedName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getSymbolReferences(tenantId, repositoryId, snapshotId, symbolId, page = 1, limit = 20) {
    const query = { tenantId, repositoryId, snapshotId, resolvedSymbolId: symbolId };
    const total = await CodeReference.countDocuments(query);
    const items = await CodeReference.find(query)
      .sort({ filePath: 1, startLine: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getSymbolRelationships(tenantId, repositoryId, snapshotId, symbolId, direction = 'BOTH', edgeType = null, options = {}) {
    const { maxDepth = 3, maxNodes = 100, maxEdges = 200 } = options;

    const symbol = await CodeSymbol.findOne({ tenantId, repositoryId, snapshotId, _id: symbolId }).lean();
    if (!symbol) return { nodes: [], edges: [] };

    const symbolNodeId = `node:${tenantId}:${repositoryId}:SYMBOL:${symbol.logicalSymbolId}`;

    const nodesSet = new Set();
    const edgesSet = new Set();

    const nodesList = [];
    const edgesList = [];

    const queue = [{ nodeId: symbolNodeId, depth: 0 }];
    nodesSet.add(symbolNodeId);

    // Fetch initial node definition
    const startNodeDoc = await CodeGraphNode.findOne({ tenantId, repositoryId, snapshotId, logicalNodeId: symbolNodeId }).lean();
    if (startNodeDoc) nodesList.push(startNodeDoc);

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift();
      if (depth >= maxDepth || nodesList.length >= maxNodes || edgesList.length >= maxEdges) continue;

      const queryEdges = [];
      
      if (direction === 'OUTGOING' || direction === 'BOTH') {
        const outQuery = { tenantId, repositoryId, snapshotId, sourceNodeId: nodeId };
        if (edgeType) outQuery.edgeType = edgeType;
        const outEdges = await CodeGraphEdge.find(outQuery).limit(maxEdges - edgesList.length).lean();
        queryEdges.push(...outEdges);
      }

      if (direction === 'INCOMING' || direction === 'BOTH') {
        const inQuery = { tenantId, repositoryId, snapshotId, targetNodeId: nodeId };
        if (edgeType) inQuery.edgeType = edgeType;
        const inEdges = await CodeGraphEdge.find(inQuery).limit(maxEdges - edgesList.length).lean();
        queryEdges.push(...inEdges);
      }

      for (const edge of queryEdges) {
        if (!edgesSet.has(edge.logicalEdgeId)) {
          edgesSet.add(edge.logicalEdgeId);
          edgesList.push(edge);

          const neighborNodeId = edge.sourceNodeId === nodeId ? edge.targetNodeId : edge.sourceNodeId;
          if (!nodesSet.has(neighborNodeId) && nodesList.length < maxNodes) {
            nodesSet.add(neighborNodeId);
            const nodeDoc = await CodeGraphNode.findOne({ tenantId, repositoryId, snapshotId, logicalNodeId: neighborNodeId }).lean();
            if (nodeDoc) {
              nodesList.push(nodeDoc);
              queue.push({ nodeId: neighborNodeId, depth: depth + 1 });
            }
          }
        }
      }
    }

    return { nodes: nodesList, edges: edgesList };
  }

  async getModuleDependencies(tenantId, repositoryId, snapshotId, options = {}) {
    const { maxEdges = 500 } = options;
    const edges = await CodeGraphEdge.find({
      tenantId,
      repositoryId,
      snapshotId,
      edgeType: 'DEPENDS_ON'
    }).limit(maxEdges).lean();

    const nodeIds = new Set();
    edges.forEach(e => {
      nodeIds.add(e.sourceNodeId);
      nodeIds.add(e.targetNodeId);
    });

    const nodes = await CodeGraphNode.find({
      tenantId,
      repositoryId,
      snapshotId,
      logicalNodeId: { $in: Array.from(nodeIds) }
    }).lean();

    return { nodes, edges };
  }

  async getReverseDependencies(tenantId, repositoryId, snapshotId, filePath) {
    const fileNodeId = `node:${tenantId}:${repositoryId}:FILE:${filePath}`;
    const edges = await CodeGraphEdge.find({
      tenantId,
      repositoryId,
      snapshotId,
      edgeType: 'DEPENDS_ON',
      targetNodeId: fileNodeId
    }).lean();

    const sourceNodeIds = edges.map(e => e.sourceNodeId);
    const nodes = await CodeGraphNode.find({
      tenantId,
      repositoryId,
      snapshotId,
      logicalNodeId: { $in: sourceNodeIds }
    }).lean();

    return nodes;
  }

  async getCallers(tenantId, repositoryId, snapshotId, symbolId, options = {}) {
    const symbol = await CodeSymbol.findOne({ tenantId, repositoryId, snapshotId, _id: symbolId }).lean();
    if (!symbol) return [];

    const symbolNodeId = `node:${tenantId}:${repositoryId}:SYMBOL:${symbol.logicalSymbolId}`;
    const edges = await CodeGraphEdge.find({
      tenantId,
      repositoryId,
      snapshotId,
      edgeType: 'CALLS',
      targetNodeId: symbolNodeId
    }).lean();

    const callerNodeIds = edges.map(e => e.sourceNodeId);
    return await CodeGraphNode.find({
      tenantId,
      repositoryId,
      snapshotId,
      logicalNodeId: { $in: callerNodeIds }
    }).lean();
  }

  async getCallees(tenantId, repositoryId, snapshotId, symbolId, options = {}) {
    const symbol = await CodeSymbol.findOne({ tenantId, repositoryId, snapshotId, _id: symbolId }).lean();
    if (!symbol) return [];

    const symbolNodeId = `node:${tenantId}:${repositoryId}:SYMBOL:${symbol.logicalSymbolId}`;
    const edges = await CodeGraphEdge.find({
      tenantId,
      repositoryId,
      snapshotId,
      edgeType: 'CALLS',
      sourceNodeId: symbolNodeId
    }).lean();

    const calleeNodeIds = edges.map(e => e.targetNodeId);
    return await CodeGraphNode.find({
      tenantId,
      repositoryId,
      snapshotId,
      logicalNodeId: { $in: calleeNodeIds }
    }).lean();
  }

  async getInheritanceHierarchy(tenantId, repositoryId, snapshotId, symbolId) {
    const symbol = await CodeSymbol.findOne({ tenantId, repositoryId, snapshotId, _id: symbolId }).lean();
    if (!symbol) return { parents: [], children: [] };

    const symbolNodeId = `node:${tenantId}:${repositoryId}:SYMBOL:${symbol.logicalSymbolId}`;

    const parentEdges = await CodeGraphEdge.find({
      tenantId,
      repositoryId,
      snapshotId,
      edgeType: 'INHERITS',
      sourceNodeId: symbolNodeId
    }).lean();

    const childEdges = await CodeGraphEdge.find({
      tenantId,
      repositoryId,
      snapshotId,
      edgeType: 'INHERITS',
      targetNodeId: symbolNodeId
    }).lean();

    const parentNodeIds = parentEdges.map(e => e.targetNodeId);
    const childNodeIds = childEdges.map(e => e.sourceNodeId);

    const parents = await CodeGraphNode.find({
      tenantId,
      repositoryId,
      snapshotId,
      logicalNodeId: { $in: parentNodeIds }
    }).lean();

    const children = await CodeGraphNode.find({
      tenantId,
      repositoryId,
      snapshotId,
      logicalNodeId: { $in: childNodeIds }
    }).lean();

    return { parents, children };
  }

  async getDependencyCycles(tenantId, repositoryId, snapshotId) {
    const fileNodes = await CodeGraphNode.find({ tenantId, repositoryId, snapshotId, nodeType: 'FILE' }).lean();
    const fileMap = new Map(fileNodes.map(n => [n.logicalNodeId, n.label]));

    const edges = await CodeGraphEdge.find({
      tenantId,
      repositoryId,
      snapshotId,
      edgeType: 'DEPENDS_ON'
    }).lean();

    const adj = new Map();
    fileNodes.forEach(n => adj.set(n.logicalNodeId, []));
    edges.forEach(e => {
      if (adj.has(e.sourceNodeId) && adj.has(e.targetNodeId)) {
        adj.get(e.sourceNodeId).push(e.targetNodeId);
      }
    });

    const cycles = [];
    const visited = new Set();
    const path = [];
    const pathSet = new Set();

    const dfs = (u) => {
      visited.add(u);
      path.push(u);
      pathSet.add(u);

      const neighbors = adj.get(u) || [];
      for (const v of neighbors) {
        if (pathSet.has(v)) {
          const cycleIdx = path.indexOf(v);
          const cyclePath = path.slice(cycleIdx).map(id => fileMap.get(id) || id);
          cycles.push(cyclePath);
        } else if (!visited.has(v)) {
          dfs(v);
        }
      }

      pathSet.delete(u);
      path.pop();
    };

    for (const n of fileNodes) {
      if (!visited.has(n.logicalNodeId)) {
        dfs(n.logicalNodeId);
      }
    }

    return cycles;
  }
}

module.exports = new StructuralQueryService();
