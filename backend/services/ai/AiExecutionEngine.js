const AiExecution = require('../../models/AiExecution');
const TaskRegistry = require('./TaskRegistry');
const { ModelRegistry } = require('./ModelRegistry');
const RoutingEngine = require('./RoutingEngine');
const TenantPolicyManager = require('./TenantPolicyManager');
const TokenEstimator = require('./TokenEstimator');
const AiExecutionCache = require('./AiExecutionCache');
const StructuredOutputService = require('./StructuredOutputService');
const { ToolRegistry } = require('./ToolRegistry');
const GeminiProviderAdapter = require('./GeminiProviderAdapter');
const IdempotencyStore = require('../medication/IdempotencyStore');
const { MetricsRegistry, baseLogger, generateTraceId } = require('../medication/observability');

// Map of provider adapters
const adapters = {
  gemini: new GeminiProviderAdapter()
};

// Initialize adapters
(async () => {
  for (const adapter of Object.values(adapters)) {
    await adapter.initialize();
  }
})();

class AiExecutionEngine {
  constructor() {
    this.logger = baseLogger.child({ service: 'helio-ai-engine' });
  }

  async execute(request) {
    const {
      tenantId,
      userId,
      taskType,
      messages,
      executionMode = 'NON_STREAMING',
      maxOutputTokens,
      temperature,
      promptId,
      promptVersion,
      idempotencyKey,
      correlationId = generateTraceId(),
      causationId,
      authorizedModelOverride,
      tools = [],
      structuredOutput
    } = request;

    const startedAt = new Date();

    // 1. Resolve task definitions
    const task = TaskRegistry.getTask(taskType);
    if (!task) {
      throw new Error(`AI_INVALID_REQUEST: Task type ${taskType} is not registered.`);
    }

    // 2. Resolve tenant policies
    const tenantPolicy = await TenantPolicyManager.resolvePolicy(tenantId);

    // Validate permitted tasks
    if (tenantPolicy.allowedTaskTypes && !tenantPolicy.allowedTaskTypes.includes(taskType)) {
      throw new Error(`AI_QUOTA_EXCEEDED: Task type ${taskType} is not permitted by tenant policy.`);
    }

    // 3. Token & Cost Estimation
    const estInput = TokenEstimator.estimateInputTokens(messages);
    const estOutput = TokenEstimator.estimateOutputTokens(maxOutputTokens || task.defaultMaxOutputTokens);

    // Resolve route to get model costs
    const route = await RoutingEngine.resolveRoute({
      tenantId,
      taskType,
      executionMode,
      estimatedInputTokens: estInput,
      requestedOutputTokens: estOutput,
      authorizedModelOverride,
      tenantPolicy
    });

    const estCost = TokenEstimator.calculateCost(estInput, estOutput, route.modelId);

    // 4. Budget check and reservation
    await TenantPolicyManager.reserveBudget(tenantId, correlationId, estCost);

    // 5. Caching lookup (only for non-streaming requests with caching enabled)
    const cacheKey = AiExecutionCache.generateCacheKey(tenantId, taskType, promptVersion, messages, {
      temperature,
      maxTokens: maxOutputTokens,
      structuredOutput
    });

    if (executionMode === 'NON_STREAMING' && task.cachePolicy?.enabled && tenantPolicy.cachePolicy?.enabled) {
      try {
        const cachedResponse = await AiExecutionCache.get(cacheKey);
        if (cachedResponse) {
          // Release reservation (no actual provider cost)
          await TenantPolicyManager.releaseReservation(correlationId);

          // Save cached execution record
          await AiExecution.create({
            tenantId,
            userId,
            taskType,
            promptId,
            promptVersion,
            providerId: route.providerId,
            modelId: route.modelId,
            status: 'SUCCEEDED',
            executionMode,
            idempotencyKey,
            requestFingerprint: cacheKey,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            estimatedCost: estCost,
            actualCost: 0,
            cacheHit: true,
            tokensAvoidedEstimate: estInput + estOutput,
            costAvoidedEstimate: estCost,
            startedAt,
            completedAt: new Date(),
            traceId: correlationId,
            correlationId
          });

          this.logger.info('ai.execution.cache_hit', 'AI response fetched from cache', {
            tenantId,
            taskType,
            modelId: route.modelId,
            correlationId
          });

          return cachedResponse;
        }
      } catch (err) {
        this.logger.warn('ai.cache.error', `Cache retrieval failed: ${err.message}`);
      }
    }

    // 6. Idempotency handling
    if (idempotencyKey) {
      const idemp = await IdempotencyStore.acquire(tenantId, `ai:${taskType}`, idempotencyKey);
      if (!idemp.success) {
        // Release reservation
        await TenantPolicyManager.releaseReservation(correlationId);

        if (idemp.status === 'IN_PROGRESS') {
          throw new Error('AI_INVALID_REQUEST: A matching idempotent operation is currently in progress.');
        }

        // Return previous cached result if available
        if (idemp.resultReference) {
          return idemp.resultReference;
        }
        
        throw new Error('AI_INVALID_REQUEST: Idempotent operation failed previously.');
      }
    }

    // 7. Persist execution record in PENDING state
    const execution = await AiExecution.create({
      tenantId,
      userId,
      taskType,
      promptId,
      promptVersion,
      providerId: route.providerId,
      modelId: route.modelId,
      routingPolicyVersion: route.resolvedPolicyVersion,
      status: 'PENDING',
      executionMode,
      idempotencyKey,
      requestFingerprint: cacheKey,
      inputTokenEstimate: estInput,
      estimatedCost: estCost,
      startedAt,
      traceId: correlationId,
      correlationId,
      causationId
    });

    const adapter = adapters[route.providerId];
    if (!adapter) {
      throw new Error(`AI_MODEL_UNAVAILABLE: Provider ${route.providerId} adapter is not initialized.`);
    }

    // Initialize execution variables
    execution.status = 'RUNNING';
    await execution.save();

    this.logger.info('ai.execution.started', 'Started AI provider request', {
      executionId: execution._id,
      tenantId,
      taskType,
      modelId: route.modelId,
      correlationId
    });

    // 8. Execute Provider request
    if (executionMode === 'STREAMING') {
      return this._handleStreaming(adapter, request, execution, estCost, cacheKey);
    } else {
      return this._handleNonStreaming(adapter, request, execution, estCost, cacheKey);
    }
  }

  async _handleNonStreaming(adapter, request, execution, estCost, cacheKey) {
    const startedAt = execution.startedAt;
    const task = TaskRegistry.getTask(request.taskType);

    try {
      // Execute call
      const response = await adapter.generate({
        modelId: execution.modelId,
        messages: request.messages,
        tools: request.tools,
        structuredOutput: request.structuredOutput,
        temperature: request.temperature || task.defaultTemperature,
        maxTokens: request.maxOutputTokens || task.defaultMaxOutputTokens,
        taskType: request.taskType
      });

      execution.providerRequestId = response.providerRequestId;
      execution.inputTokens = response.usage.inputTokens;
      execution.outputTokens = response.usage.outputTokens;
      execution.totalTokens = response.usage.totalTokens;
      
      const actualCost = TokenEstimator.calculateCost(response.usage.inputTokens, response.usage.outputTokens, execution.modelId);
      execution.actualCost = actualCost;

      // Handle tool calls loop (up to max rounds limit)
      if (response.toolCalls && response.toolCalls.length > 0) {
        execution.status = 'WAITING_FOR_TOOL';
        await execution.save();

        const toolRoundsLimit = request.maxToolRounds || 5;
        let currentRound = 1;
        let toolResults = [];

        let currentResponse = response;

        while (currentResponse.toolCalls && currentResponse.toolCalls.length > 0 && currentRound <= toolRoundsLimit) {
          this.logger.info('ai.tool.requested', `Executing ${currentResponse.toolCalls.length} tool calls in round ${currentRound}`, {
            executionId: execution._id,
            round: currentRound
          });

          // Run tool executions
          const toolMessages = [];
          for (const tc of currentResponse.toolCalls) {
            const toolStartedAt = new Date();
            const toolExecLog = {
              toolName: tc.name,
              toolArgs: tc.args,
              status: 'PENDING',
              startedAt: toolStartedAt
            };
            execution.toolCalls.push(toolExecLog);
            await execution.save();

            const loggedCall = execution.toolCalls[execution.toolCalls.length - 1];

            try {
              const res = await ToolRegistry.executeTool({
                tenantId: execution.tenantId,
                toolName: tc.name,
                args: tc.args,
                user: request.user
              });

              loggedCall.status = 'SUCCESS';
              loggedCall.result = res;
              loggedCall.completedAt = new Date();

              toolMessages.push({
                role: 'user',
                parts: [{ toolResult: { name: tc.name, result: res } }]
              });
            } catch (toolErr) {
              loggedCall.status = 'FAILED';
              loggedCall.error = toolErr.message;
              loggedCall.completedAt = new Date();

              toolMessages.push({
                role: 'user',
                parts: [{ toolResult: { name: tc.name, result: { error: toolErr.message } } }]
              });
            }
          }

          // Build loop messages list
          const nextMessages = [
            ...request.messages,
            { role: 'model', parts: currentResponse.toolCalls.map(tc => ({ toolCall: tc })) },
            ...toolMessages
          ];

          // Run next inference round
          currentResponse = await adapter.generate({
            modelId: execution.modelId,
            messages: nextMessages,
            temperature: request.temperature || task.defaultTemperature,
            maxTokens: request.maxOutputTokens || task.defaultMaxOutputTokens
          });

          execution.inputTokens += currentResponse.usage.inputTokens;
          execution.outputTokens += currentResponse.usage.outputTokens;
          execution.totalTokens += currentResponse.usage.totalTokens;
          execution.actualCost += TokenEstimator.calculateCost(currentResponse.usage.inputTokens, currentResponse.usage.outputTokens, execution.modelId);

          currentRound++;
        }

        // Final payload text
        response.text = currentResponse.text;
      }

      // Handle structured output validation and self repair
      if (request.structuredOutput && request.structuredOutput.schema) {
        let parsedData = null;
        let parseError = null;

        try {
          parsedData = JSON.parse(response.text);
        } catch (pe) {
          parseError = `Invalid JSON parser syntax: ${pe.message}`;
        }

        if (parseError) {
          execution.structuredValidationStatus = 'INVALID';
          await execution.save();

          // Try self-repair
          const repairedResult = await StructuredOutputService.repair({
            engine: this,
            request,
            providerId: execution.providerId,
            modelId: execution.modelId,
            originalText: response.text,
            validationErrors: [parseError],
            schema: request.structuredOutput.schema,
            currentAttempt: 1,
            maxAttempts: request.maxStructuredRepairAttempts || 2
          });

          return repairedResult;
        } else {
          // Schema structure validation
          const { valid, errors } = StructuredOutputService.validate(parsedData, request.structuredOutput.schema);
          if (!valid) {
            execution.structuredValidationStatus = 'INVALID';
            await execution.save();

            // Try self-repair
            const repairedResult = await StructuredOutputService.repair({
              engine: this,
              request,
              providerId: execution.providerId,
              modelId: execution.modelId,
              originalText: response.text,
              validationErrors: errors,
              schema: request.structuredOutput.schema,
              currentAttempt: 1,
              maxAttempts: request.maxStructuredRepairAttempts || 2
            });

            return repairedResult;
          } else {
            execution.structuredValidationStatus = 'VALID';
          }
        }
      }

      // Finalize database record
      const completedAt = new Date();
      execution.status = 'SUCCEEDED';
      execution.completedAt = completedAt;
      execution.durationMs = completedAt.getTime() - startedAt.getTime();
      await execution.save();

      // Reconcile cost budget
      await TenantPolicyManager.reconcileReservation(execution.correlationId, execution.actualCost);

      // Complete idempotency record
      if (execution.idempotencyKey) {
        await IdempotencyStore.complete(execution.tenantId, `ai:${execution.taskType}`, execution.idempotencyKey, response.text);
      }

      // Cache the successful response
      if (task.cachePolicy?.enabled) {
        await AiExecutionCache.set(cacheKey, response.text, task.cachePolicy.ttlSeconds);
      }

      this.logger.info('ai.execution.succeeded', 'AI execution completed successfully', {
        executionId: execution._id,
        durationMs: execution.durationMs,
        cost: execution.actualCost,
        tokens: execution.totalTokens
      });

      return response.text;
    } catch (err) {
      const completedAt = new Date();
      execution.status = 'FAILED';
      execution.failedAt = completedAt;
      execution.durationMs = completedAt.getTime() - startedAt.getTime();
      execution.errorCode = err.name;
      execution.errorClassification = err.message.startsWith('AI_') ? err.message.split(':')[0] : 'AI_UNKNOWN_PROVIDER_ERROR';
      await execution.save();

      // Release reservation
      await TenantPolicyManager.releaseReservation(execution.correlationId);

      // Fail idempotency
      if (execution.idempotencyKey) {
        await IdempotencyStore.fail(execution.tenantId, `ai:${execution.taskType}`, execution.idempotencyKey, { message: err.message });
      }

      this.logger.error('ai.execution.failed', `AI execution failed: ${err.message}`, {
        executionId: execution._id,
        classification: execution.errorClassification
      });

      throw err;
    }
  }

  async *_handleStreaming(adapter, request, execution, estCost, cacheKey) {
    const startedAt = execution.startedAt;
    let firstTokenAt = null;
    let accumulatedText = '';

    try {
      execution.status = 'STREAMING';
      await execution.save();

      const streamGenerator = adapter.stream({
        modelId: execution.modelId,
        messages: request.messages,
        temperature: request.temperature,
        maxTokens: request.maxOutputTokens
      });

      for await (const chunk of streamGenerator) {
        if (!firstTokenAt) {
          firstTokenAt = new Date();
          execution.firstTokenAt = firstTokenAt;
          execution.timeToFirstTokenMs = firstTokenAt.getTime() - startedAt.getTime();
          await execution.save();
        }

        accumulatedText += chunk.text;
        yield chunk;
      }

      // Complete stream
      const completedAt = new Date();
      execution.status = 'SUCCEEDED';
      execution.completedAt = completedAt;
      execution.durationMs = completedAt.getTime() - startedAt.getTime();
      
      // Estimate final stream token lengths
      const promptTokens = TokenEstimator.estimateInputTokens(request.messages);
      const completionTokens = Math.ceil(accumulatedText.length / 4);
      execution.inputTokens = promptTokens;
      execution.outputTokens = completionTokens;
      execution.totalTokens = promptTokens + completionTokens;
      execution.actualCost = TokenEstimator.calculateCost(promptTokens, completionTokens, execution.modelId);
      await execution.save();

      // Reconcile budget
      await TenantPolicyManager.reconcileReservation(execution.correlationId, execution.actualCost);

      if (execution.idempotencyKey) {
        await IdempotencyStore.complete(execution.tenantId, `ai:${execution.taskType}`, execution.idempotencyKey, accumulatedText);
      }

      this.logger.info('ai.execution.succeeded', 'AI stream execution completed successfully', {
        executionId: execution._id,
        durationMs: execution.durationMs,
        cost: execution.actualCost
      });
    } catch (err) {
      const completedAt = new Date();
      execution.status = 'FAILED';
      execution.failedAt = completedAt;
      execution.durationMs = completedAt.getTime() - startedAt.getTime();
      execution.errorCode = err.name;
      execution.errorClassification = err.message.startsWith('AI_') ? err.message.split(':')[0] : 'AI_UNKNOWN_PROVIDER_ERROR';
      await execution.save();

      // Release reservation
      await TenantPolicyManager.releaseReservation(execution.correlationId);

      if (execution.idempotencyKey) {
        await IdempotencyStore.fail(execution.tenantId, `ai:${execution.taskType}`, execution.idempotencyKey, { message: err.message });
      }

      this.logger.error('ai.execution.failed', `AI streaming failed: ${err.message}`, {
        executionId: execution._id,
        classification: execution.errorClassification
      });

      throw err;
    }
  }

  async embed(request) {
    const {
      tenantId,
      userId = 'system',
      text,
      modelId = 'text-embedding-004',
      correlationId = generateTraceId()
    } = request;

    const startedAt = new Date();
    const model = ModelRegistry.getModel(modelId);
    if (!model) {
      throw new Error(`AI_MODEL_UNAVAILABLE: Model ${modelId} is not registered.`);
    }

    const providerId = model.providerId;
    const adapter = adapters[providerId];
    if (!adapter) {
      throw new Error(`AI_MODEL_UNAVAILABLE: Provider ${providerId} adapter is not initialized.`);
    }

    const estInput = Math.ceil(text.length / 4);
    const estCost = TokenEstimator.calculateCost(estInput, 0, modelId);

    // 1. Policy & Budget checks
    const tenantPolicy = await TenantPolicyManager.resolvePolicy(tenantId);
    await TenantPolicyManager.reserveBudget(tenantId, correlationId, estCost);

    // 2. Track AI execution
    const execution = await AiExecution.create({
      tenantId,
      userId,
      taskType: 'EMBEDDINGS',
      providerId,
      modelId,
      status: 'PENDING',
      executionMode: 'NON_STREAMING',
      inputTokenEstimate: estInput,
      estimatedCost: estCost,
      startedAt,
      traceId: correlationId,
      correlationId
    });

    try {
      execution.status = 'RUNNING';
      await execution.save();

      const response = await adapter.embed({
        modelId,
        text,
        dimensions: model.dimensions
      });

      execution.providerRequestId = response.providerRequestId;
      execution.inputTokens = response.usage.inputTokens;
      execution.outputTokens = 0;
      execution.totalTokens = response.usage.inputTokens;

      const actualCost = TokenEstimator.calculateCost(response.usage.inputTokens, 0, modelId);
      execution.actualCost = actualCost;
      execution.status = 'SUCCEEDED';
      execution.completedAt = new Date();
      execution.durationMs = Date.now() - startedAt.getTime();
      await execution.save();

      await TenantPolicyManager.reconcileReservation(correlationId, actualCost);

      return response;
    } catch (err) {
      execution.status = 'FAILED';
      execution.failedAt = new Date();
      execution.errorCode = err.name || 'AI_UNKNOWN_PROVIDER_ERROR';
      execution.errorClassification = adapter.normalizeError ? adapter.normalizeError(err).message : 'AI_UNKNOWN_PROVIDER_ERROR';
      await execution.save();

      await TenantPolicyManager.releaseReservation(correlationId);
      throw err;
    }
  }

  async embedBatch(request) {
    const {
      tenantId,
      userId = 'system',
      texts,
      modelId = 'text-embedding-004',
      correlationId = generateTraceId()
    } = request;

    const startedAt = new Date();
    const model = ModelRegistry.getModel(modelId);
    if (!model) {
      throw new Error(`AI_MODEL_UNAVAILABLE: Model ${modelId} is not registered.`);
    }

    const providerId = model.providerId;
    const adapter = adapters[providerId];
    if (!adapter) {
      throw new Error(`AI_MODEL_UNAVAILABLE: Provider ${providerId} adapter is not initialized.`);
    }

    let estInput = 0;
    texts.forEach(t => estInput += Math.ceil(t.length / 4));
    const estCost = TokenEstimator.calculateCost(estInput, 0, modelId);

    // 1. Policy & Budget checks
    const tenantPolicy = await TenantPolicyManager.resolvePolicy(tenantId);
    await TenantPolicyManager.reserveBudget(tenantId, correlationId, estCost);

    // 2. Track AI execution
    const execution = await AiExecution.create({
      tenantId,
      userId,
      taskType: 'EMBEDDINGS',
      providerId,
      modelId,
      status: 'PENDING',
      executionMode: 'NON_STREAMING',
      inputTokenEstimate: estInput,
      estimatedCost: estCost,
      startedAt,
      traceId: correlationId,
      correlationId
    });

    try {
      execution.status = 'RUNNING';
      await execution.save();

      const responses = await adapter.embedBatch({
        modelId,
        texts,
        dimensions: model.dimensions
      });

      let actualInputTokens = 0;
      responses.forEach(res => actualInputTokens += res.usage.inputTokens);

      execution.inputTokens = actualInputTokens;
      execution.outputTokens = 0;
      execution.totalTokens = actualInputTokens;

      const actualCost = TokenEstimator.calculateCost(actualInputTokens, 0, modelId);
      execution.actualCost = actualCost;
      execution.status = 'SUCCEEDED';
      execution.completedAt = new Date();
      execution.durationMs = Date.now() - startedAt.getTime();
      await execution.save();

      await TenantPolicyManager.reconcileReservation(correlationId, actualCost);

      return responses;
    } catch (err) {
      execution.status = 'FAILED';
      execution.failedAt = new Date();
      execution.errorCode = err.name || 'AI_UNKNOWN_PROVIDER_ERROR';
      execution.errorClassification = adapter.normalizeError ? adapter.normalizeError(err).message : 'AI_UNKNOWN_PROVIDER_ERROR';
      await execution.save();

      await TenantPolicyManager.releaseReservation(correlationId);
      throw err;
    }
  }
}

module.exports = new AiExecutionEngine();
