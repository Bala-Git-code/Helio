const mongoose = require('mongoose');
const crypto = require('crypto');

// Models
const Repository = require('../../models/Repository');
const RepositorySnapshot = require('../../models/RepositorySnapshot');
const RepositoryRetrievalIndex = require('../../models/RepositoryRetrievalIndex');
const RepositoryStructuralIndex = require('../../models/RepositoryStructuralIndex');
const RepositoryConversation = require('../../models/RepositoryConversation');
const RepositoryConversationMessage = require('../../models/RepositoryConversationMessage');
const RepositoryAIExecution = require('../../models/RepositoryAIExecution');

// Services
const RepositoryRetrievalService = require('./RepositoryRetrievalService');
const RetrievedContentSecurityAnalyzer = require('./RetrievedContentSecurityAnalyzer');
const PromptTemplateRegistry = require('./PromptTemplateRegistry');
const CitationValidationService = require('./CitationValidationService');
const GroundingVerifier = require('./GroundingVerifier');
const AiExecutionEngine = require('../ai/AiExecutionEngine');
const TokenEstimator = require('../ai/TokenEstimator');
const { baseLogger, generateTraceId } = require('../medication/observability');

class RepositoryAIService {
  constructor() {
    this.logger = baseLogger.child({ service: 'helio-ai-orchestration' });
    this.orchestrationVersion = '1.0.0';
  }

  async askRepository(request) {
    return this._orchestrateExecution(request, 'REPOSITORY_QUESTION');
  }

  async explainSymbol(request) {
    const { symbolId } = request;
    if (!symbolId) throw new Error('AI_INVALID_REQUEST: symbolId is required.');
    
    const CodeSymbol = require('../../models/CodeSymbol');
    const symbol = await CodeSymbol.findById(symbolId).lean();
    if (!symbol) throw new Error(`AI_INVALID_REQUEST: Symbol ${symbolId} not found.`);

    return this._orchestrateExecution({
      ...request,
      query: `Explain the symbol ${symbol.name} of type ${symbol.symbolType} in file ${symbol.filePath}.`,
      filters: { filePath: symbol.filePath }
    }, 'SYMBOL_EXPLANATION');
  }

  async explainFile(request) {
    const { filePath } = request;
    if (!filePath) throw new Error('AI_INVALID_REQUEST: filePath is required.');

    return this._orchestrateExecution({
      ...request,
      query: `Explain the architecture and functionality of file ${filePath}.`,
      filters: { filePath }
    }, 'FILE_EXPLANATION');
  }

  async answerArchitectureQuestion(request) {
    return this._orchestrateExecution(request, 'ARCHITECTURE_QUESTION');
  }

  async answerDependencyQuestion(request) {
    return this._orchestrateExecution(request, 'DEPENDENCY_QUESTION');
  }

  async answerChangeImpactQuestion(request) {
    return this._orchestrateExecution(request, 'CHANGE_IMPACT_QUESTION');
  }

  // --- CORE ORCHESTRATION CYCLE ---

  async _orchestrateExecution(request, defaultIntent) {
    const {
      tenantId,
      repositoryId,
      conversationId: reqConversationId,
      query,
      snapshotSelector = {},
      retrievalPolicy = {},
      traceId = generateTraceId(),
      correlationId = traceId
    } = request;

    this.logger.info('ai.orchestration.started', 'Orchestration execution started.', { tenantId, repositoryId, query, defaultIntent });

    // Ensure prompt templates are registered/initialized
    await PromptTemplateRegistry.initialize();

    // 1. Resolve or Create Conversation
    let conversation = null;
    let isNewConversation = false;
    if (reqConversationId) {
      conversation = await RepositoryConversation.findOne({ _id: reqConversationId, tenantId, repositoryId });
      if (!conversation) throw new Error('AI_INVALID_REQUEST: Conversation not found.');
    } else {
      conversation = await RepositoryConversation.create({
        tenantId,
        repositoryId,
        title: query ? query.substring(0, 40) + '...' : 'New AI Session',
        defaultSnapshotPolicy: 'LATEST_READY_PER_REQUEST',
        createdBy: 'user',
        status: 'ACTIVE'
      });
      isNewConversation = true;
    }

    // 2. Resolve Snapshot & Indices
    const repo = await Repository.findOne({ _id: repositoryId, tenantId });
    if (!repo) throw new Error('AI_INVALID_REQUEST: Repository not found.');

    let resolvedSnapshotId = snapshotSelector.snapshotId || conversation.pinnedSnapshotId || repo.latestIndexedSnapshotId;
    if (!resolvedSnapshotId) {
      throw new Error('AI_INVALID_REQUEST: No indexed snapshot is available for this repository.');
    }

    const snapshot = await RepositorySnapshot.findOne({ _id: resolvedSnapshotId, repositoryId });
    if (!snapshot) throw new Error('AI_INVALID_REQUEST: Snapshot not found.');

    const structIndex = await RepositoryStructuralIndex.findOne({ tenantId, repositoryId, snapshotId: resolvedSnapshotId, status: 'READY' });
    const retrievalIndex = await RepositoryRetrievalIndex.findOne({ tenantId, repositoryId, snapshotId: resolvedSnapshotId, status: 'READY' });

    if (!structIndex || !retrievalIndex) {
      throw new Error('AI_INVALID_REQUEST: Eligible structural or retrieval index not ready for target snapshot.');
    }

    // 3. Persist User Message
    const userMessage = await RepositoryConversationMessage.create({
      tenantId,
      repositoryId,
      conversationId: conversation._id,
      role: 'user',
      content: query,
      contentHash: crypto.createHash('sha256').update(query).digest('hex'),
      estimatedTokens: Math.ceil(query.length / 4),
      snapshotId: resolvedSnapshotId
    });

    // 4. Create AI Execution Record in PENDING
    const execution = await RepositoryAIExecution.create({
      tenantId,
      repositoryId,
      conversationId: conversation._id,
      userMessageId: userMessage._id,
      snapshotId: resolvedSnapshotId,
      structuralIndexId: structIndex._id,
      retrievalIndexId: retrievalIndex._id,
      sourceRevision: snapshot.sourceRevision,
      intent: defaultIntent,
      status: 'PENDING',
      orchestrationVersion: this.orchestrationVersion,
      startedAt: new Date(),
      traceId,
      correlationId
    });

    try {
      // Transition to RESOLVING_SNAPSHOT
      await this._transitionState(execution, 'RESOLVING_SNAPSHOT');

      // 5. Context Window & Recent Conversation Messages Planning
      await this._transitionState(execution, 'PLANNING_CONTEXT');
      const { recentMessages, recentTokens } = await this._planConversationHistory(conversation, execution);
      execution.conversationContextTokens = recentTokens;

      // 6. Retrieval Planning & Execution
      await this._transitionState(execution, 'RETRIEVING');
      const contextTokenBudget = 2500; // configurable budget
      const retrievedContext = await RepositoryRetrievalService.retrieveContext({
        tenantId,
        repositoryId,
        snapshotSelector: { snapshotId: resolvedSnapshotId },
        queryText: query,
        filters: request.filters || {},
        contextTokenBudget,
        retrievalPolicy: {
          retrievalMode: retrievalPolicy.retrievalMode || 'HYBRID',
          maxChunksPerFile: retrievalPolicy.maxChunksPerFile || 2,
          includeExplanations: true
        },
        includeProvenance: true
      });

      execution.retrievedContextTokens = retrievedContext.totalEstimatedTokens;
      await execution.save();

      // 7. Retrieved Content Security Analyzer Checks
      await this._transitionState(execution, 'SECURITY_FILTERING');
      const securityResults = await RetrievedContentSecurityAnalyzer.analyze(execution._id, retrievedContext.items);

      if (securityResults.overallAction === 'FAIL_REQUEST') {
        throw new Error('AI_SECURITY_VIOLATION: Security threat or prompt injection detected in retrieved content.');
      }

      // Filter excluded documents from evidence context
      const allowedItems = [];
      const allowedProvenance = [];
      
      retrievedContext.items.forEach((item, idx) => {
        const assessment = securityResults.assessments.find(a => String(a.documentId) === String(item.documentId));
        if (assessment && assessment.policyAction === 'EXCLUDE_DOCUMENT') {
          this.logger.warn('security.document_excluded', `Document ${item.filePath} excluded due to high risk signal.`);
          return;
        }

        // Escape evidence tag bounds safely
        const escapedContent = RetrievedContentSecurityAnalyzer.escapeEvidence(item.content);
        allowedItems.push({
          ...item,
          content: escapedContent
        });

        if (retrievedContext.provenanceManifest[idx]) {
          allowedProvenance.push(retrievedContext.provenanceManifest[idx]);
        }
      });

      const sanitizedContext = {
        items: allowedItems,
        totalEstimatedTokens: allowedItems.reduce((acc, it) => acc + (it.tokenEstimate || Math.ceil(it.content.length / 4)), 0),
        provenanceManifest: allowedProvenance
      };

      // 8. Grounded Prompt Assembly & Delimiters
      await this._transitionState(execution, 'ASSEMBLING_PROMPT');
      const template = await PromptTemplateRegistry.getTemplate('helio-repo-qa', '1.0.0');

      // Assemble untrusted repository evidence inside delimiters
      let evidencePrompt = '';
      sanitizedContext.items.forEach(item => {
        evidencePrompt += `<repository_evidence provenance_id="${item.provenanceId || 'unknown'}">\nFile: ${item.filePath}\nLanguage: ${item.language}\nContent:\n${item.content}\n</repository_evidence>\n\n`;
      });

      const variableRender = {
        systemInstruction: 'You are HELIO, a secure and grounded AI repository engineering assistant.',
        intentInstruction: `Provide details matching intent: ${defaultIntent}.`,
        recentContext: recentMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n'),
        userQuery: query,
        evidence: evidencePrompt || 'No matching evidence found.',
        outputSchema: JSON.stringify(template.outputSchema, null, 2)
      };

      const finalPrompt = PromptTemplateRegistry.render(template, variableRender);
      execution.promptTemplateVersion = template.templateVersion;

      // 9. AI Model Execution
      await this._transitionState(execution, 'EXECUTING_MODEL');
      const modelId = 'gemini-1.5-flash';
      execution.modelId = modelId;
      execution.providerId = 'gemini';
      await execution.save();

      const runExecute = async (promptContent) => {
        return AiExecutionEngine.execute({
          tenantId,
          userId: 'system',
          taskType: 'REPOSITORY_QA',
          messages: [{ role: 'user', parts: [{ text: promptContent }] }],
          maxOutputTokens: 2000,
          temperature: 0.1,
          structuredOutput: {
            schema: template.outputSchema
          },
          correlationId
        });
      };

      let rawResponse = await runExecute(finalPrompt);

      // 10. Structured Output Parsing & Citation validation
      await this._transitionState(execution, 'VALIDATING_OUTPUT');
      let parsedAnswer = JSON.parse(rawResponse);

      // Perform Citation checks
      await this._transitionState(execution, 'VALIDATING_CITATIONS');
      const citationValidation = CitationValidationService.validate(
        parsedAnswer.citations || [],
        sanitizedContext,
        { tenantId, repositoryId, snapshotId: resolvedSnapshotId, retrievalIndexId: retrievalIndex._id }
      );

      execution.citationCount = (parsedAnswer.citations || []).length;
      execution.validatedCitationCount = citationValidation.validCitations.length;
      await execution.save();

      // 11. Grounding Checks & Self-Repair Loops
      await this._transitionState(execution, 'VERIFYING_GROUNDING');
      let grounding = await GroundingVerifier.verify({
        tenantId,
        answer: parsedAnswer.answer,
        claims: parsedAnswer.claims || [],
        citations: parsedAnswer.citations || [],
        validCitations: citationValidation.validCitations,
        evidence: sanitizedContext,
        mode: 'DETERMINISTIC'
      });

      // Self Repair loop if verification status fails
      let attempts = 0;
      const maxAttempts = 2;

      while (grounding.status !== 'VERIFIED' && attempts < maxAttempts) {
        attempts++;
        await this._transitionState(execution, 'REPAIRING');
        execution.repairAttempts = attempts;
        await execution.save();

        this.logger.info('ai.orchestration.repair', `Grounding failed with status: ${grounding.status}. Repair attempt #${attempts}`);

        // Construct repair query feedback
        const repairPrompt = `
Your previous response contained claims that were not supported by the evidence, or references to fabricated citations.
Citations must strictly map to provided provenance IDs (e.g. prov_xxxx).
Please correct your response to ensure all factual claims are fully grounded in the repository evidence.
Failed claims details:
${JSON.stringify(grounding.claims.filter(c => c.supportStatus !== 'SUPPORTED'), null, 2)}
`;

        const repairPromptMessages = [
          { role: 'user', parts: [{ text: finalPrompt }] },
          { role: 'model', parts: [{ text: rawResponse }] },
          { role: 'user', parts: [{ text: repairPrompt }] }
        ];

        rawResponse = await AiExecutionEngine.execute({
          tenantId,
          userId: 'system',
          taskType: 'REPOSITORY_QA',
          messages: repairPromptMessages,
          maxOutputTokens: 2000,
          structuredOutput: {
            schema: template.outputSchema
          },
          correlationId: `${correlationId}_repair_${attempts}`
        });

        parsedAnswer = JSON.parse(rawResponse);
        
        // Re-validate citations and grounding
        const reCitVal = CitationValidationService.validate(
          parsedAnswer.citations || [],
          sanitizedContext,
          { tenantId, repositoryId, snapshotId: resolvedSnapshotId, retrievalIndexId: retrievalIndex._id }
        );

        execution.citationCount = (parsedAnswer.citations || []).length;
        execution.validatedCitationCount = reCitVal.validCitations.length;

        grounding = await GroundingVerifier.verify({
          tenantId,
          answer: parsedAnswer.answer,
          claims: parsedAnswer.claims || [],
          citations: parsedAnswer.citations || [],
          validCitations: reCitVal.validCitations,
          evidence: sanitizedContext,
          mode: 'DETERMINISTIC'
        });
      }

      // Finalize execution
      execution.status = grounding.status === 'VERIFIED' ? 'COMPLETED' : 'DEGRADED';
      execution.groundingStatus = grounding.status;
      execution.completedAt = new Date();
      await execution.save();

      // 12. Save Assistant Message
      const assistantMessage = await RepositoryConversationMessage.create({
        tenantId,
        repositoryId,
        conversationId: conversation._id,
        role: 'model',
        content: parsedAnswer.answer,
        estimatedTokens: Math.ceil(parsedAnswer.answer.length / 4),
        snapshotId: resolvedSnapshotId,
        aiExecutionId: execution._id,
        metadata: {
          citations: citationValidation.validCitations,
          claims: grounding.claims
        }
      });

      return {
        success: true,
        data: {
          executionId: execution._id,
          conversationId: conversation._id,
          messageId: assistantMessage._id,
          repositoryId,
          snapshotId: resolvedSnapshotId,
          sourceRevision: snapshot.sourceRevision,
          intent: defaultIntent,
          answer: parsedAnswer.answer,
          claims: grounding.claims,
          citations: citationValidation.validCitations,
          groundingStatus: grounding.status,
          citationCoverage: grounding.citationCoverage,
          uncertainties: parsedAnswer.uncertainties || [],
          insufficientEvidence: parsedAnswer.insufficientEvidence || false,
          conflictingEvidence: parsedAnswer.conflictingEvidence || false,
          usage: {
            retrievedContextTokens: execution.retrievedContextTokens,
            conversationContextTokens: execution.conversationContextTokens
          }
        }
      };
    } catch (err) {
      execution.status = 'FAILED';
      execution.failedAt = new Date();
      execution.errorCode = err.name || 'AI_ORCHESTRATION_ERROR';
      await execution.save();

      this.logger.error('ai.orchestration.failed', `Orchestration loop failed: ${err.message}`, {
        executionId: execution._id,
        error: err.message
      });

      throw err;
    }
  }

  // --- HELPER OPERATIONS ---

  async _transitionState(execution, status) {
    execution.status = status;
    await execution.save();
    this.logger.info('ai.orchestration.state_changed', `State transitioned to ${status}`, { executionId: execution._id });
  }

  async _planConversationHistory(conversation, execution) {
    const maxRecentMessages = 10;
    const maxRecentTokens = 2000;

    const messages = await RepositoryConversationMessage.find({
      conversationId: conversation._id,
      _id: { $ne: execution.userMessageId } // exclude current user message
    })
      .sort({ createdAt: -1 })
      .limit(maxRecentMessages)
      .lean();

    // Reverse to retain sequential timeline
    messages.reverse();

    let recentTokens = 0;
    const recentMessages = [];

    for (const msg of messages) {
      const tokens = msg.estimatedTokens || Math.ceil(msg.content.length / 4);
      if (recentTokens + tokens > maxRecentTokens) break;
      recentTokens += tokens;
      recentMessages.push(msg);
    }

    return {
      recentMessages,
      recentTokens
    };
  }
}

module.exports = new RepositoryAIService();
