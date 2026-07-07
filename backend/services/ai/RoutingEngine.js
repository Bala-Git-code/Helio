const { ModelRegistry } = require('./ModelRegistry');
const TaskRegistry = require('./TaskRegistry');
const { getCircuitBreaker } = require('../medication/CircuitBreaker');

class RoutingEngine {
  async resolveRoute(params) {
    const {
      tenantId,
      taskType,
      requiredCapabilities = [],
      executionMode = 'NON_STREAMING',
      estimatedInputTokens = 0,
      requestedOutputTokens = 0,
      latencyPreference = 'LOW',
      costPreference = 'LOW',
      authorizedModelOverride = null,
      tenantPolicy = null
    } = params;

    // 1. Resolve task definition
    const task = TaskRegistry.getTask(taskType);
    if (!task) {
      throw new Error(`AI_INVALID_REQUEST: Task type ${taskType} is not registered.`);
    }

    // Merge required capabilities
    const mergedCapabilities = Array.from(new Set([
      ...task.requiredCapabilities,
      ...requiredCapabilities
    ]));

    // 2. Fetch all models
    let availableModels = ModelRegistry.listModels().filter(m => m.enabled);

    // 3. Apply tenant policy restrictions
    if (tenantPolicy) {
      if (tenantPolicy.enabledProviders && tenantPolicy.enabledProviders.length > 0) {
        availableModels = availableModels.filter(m => tenantPolicy.enabledProviders.includes(m.providerId));
      }
      if (tenantPolicy.enabledModels && tenantPolicy.enabledModels.length > 0) {
        availableModels = availableModels.filter(m => tenantPolicy.enabledModels.includes(m.modelId));
      }
      if (tenantPolicy.disabledModels && tenantPolicy.disabledModels.length > 0) {
        availableModels = availableModels.filter(m => !tenantPolicy.disabledModels.includes(m.modelId));
      }
      if (tenantPolicy.allowedTaskTypes && tenantPolicy.allowedTaskTypes.length > 0) {
        if (!tenantPolicy.allowedTaskTypes.includes(taskType)) {
          throw new Error(`AI_QUOTA_EXCEEDED: Task type ${taskType} is not permitted by tenant policy.`);
        }
      }
    }

    // 4. Filter by capability and constraints
    let candidates = availableModels.filter(model => {
      // Check capabilities
      const hasCaps = mergedCapabilities.every(cap => model.capabilities.includes(cap));
      if (!hasCaps) return false;

      // Check streaming
      if (executionMode === 'STREAMING' && !model.supportsStreaming) return false;

      // Check context window limits
      const totalTokens = estimatedInputTokens + (requestedOutputTokens || model.maxOutputTokens);
      if (totalTokens > model.contextWindow) return false;

      return true;
    });

    if (candidates.length === 0) {
      throw new Error('AI_MODEL_UNAVAILABLE: No enabled model satisfies the capability and context limits.');
    }

    // 5. If model override is authorized
    if (authorizedModelOverride) {
      const overrideModel = candidates.find(m => m.modelId === authorizedModelOverride);
      if (overrideModel) {
        const breaker = getCircuitBreaker(`${overrideModel.providerId}:${overrideModel.modelId}`);
        if (breaker.state !== 'OPEN') {
          return {
            providerId: overrideModel.providerId,
            modelId: overrideModel.modelId,
            routingReason: 'AUTHORIZED_OVERRIDE',
            fallbackCandidates: candidates.filter(m => m.modelId !== authorizedModelOverride).map(m => m.modelId),
            resolvedPolicyVersion: tenantPolicy ? String(tenantPolicy.updatedAt || tenantPolicy.createdAt || '1') : '1'
          };
        }
      }
    }

    // 6. Filter candidate models whose circuits are OPEN
    const healthyCandidates = [];
    const openCircuitCandidates = [];

    for (const candidate of candidates) {
      const breaker = getCircuitBreaker(`${candidate.providerId}:${candidate.modelId}`);
      if (breaker.state === 'OPEN') {
        openCircuitCandidates.push(candidate);
      } else {
        healthyCandidates.push(candidate);
      }
    }

    // Fallback if all candidates have open circuits
    const activeCandidates = healthyCandidates.length > 0 ? healthyCandidates : candidates;

    // 7. Sort/Rank based on preference (default: prefer lower cost)
    activeCandidates.sort((a, b) => {
      const costA = a.inputTokenCost + a.outputTokenCost;
      const costB = b.inputTokenCost + b.outputTokenCost;
      return costA - costB;
    });

    const selected = activeCandidates[0];
    const fallbacks = candidates.filter(m => m.modelId !== selected.modelId).map(m => m.modelId);

    return {
      providerId: selected.providerId,
      modelId: selected.modelId,
      routingReason: healthyCandidates.length > 0 ? 'OPTIMAL_COST_ROUTE' : 'CIRCUIT_FAILOVER_DEGRADED',
      fallbackCandidates: fallbacks,
      resolvedPolicyVersion: tenantPolicy ? String(tenantPolicy.updatedAt || tenantPolicy.createdAt || '1') : '1'
    };
  }
}

module.exports = new RoutingEngine();
