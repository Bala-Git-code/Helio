# HELIO Enterprise AI Execution Platform Guide

## 1. Platform Architecture

HELIO's AI Execution Platform separates application-layer code from external AI provider SDK details. 

```
APPLICATION SERVICE (e.g. geminiService, aiGatewayService)
        │
        ▼
   [AI EXECUTION REQUEST]
        │
        ▼
   AiExecutionEngine (Main Orchestrator)
        │
        ├─► TaskRegistry & ModelRegistry (Configuration)
        ├─► TenantPolicyManager (Daily/Monthly budget, atomic reservation check)
        ├─► RoutingEngine & CircuitBreaker (Health, capability model matching)
        ├─► AiExecutionCache (Tenant-isolated caching lookup)
        ├─► ToolRegistry & Secure Tool Execution boundary
        └─► StructuredOutputService & JSON validation / repair
        │
        ▼
  AiProviderAdapter Interface
        │
        ▼
  GeminiProviderAdapter (Adapts inputs/outputs to Google Generative AI SDK)
```

No feature code imports `@google/generative-ai` or calls model endpoints directly. Instead, features query registered tasks from the `TaskRegistry` and request execution from `AiExecutionEngine`.

---

## 2. AI Execution Lifecycle

1. **Request Reception:** An application request containing a registered `taskType` (e.g. `CLINICAL_SUMMARY`), input variables, messages, and security metadata is validated.
2. **Policy Verification:** The `TenantPolicyManager` resolves the tenant-specific limits, checking if:
   - The task type is allowed.
   - The estimated cost does not exceed the remaining daily or monthly tenant budget.
3. **Atomic Budget Reservation:** Before sending any external requests, an atomic reservation is written to the database to prevent double-spending in concurrent executions.
4. **Optimal Route Selection:** The `RoutingEngine` filters models supporting the task's required capabilities (e.g. `VISION`, `STRUCTURED_OUTPUT`). It checks if the route circuit is `CLOSED` and selects the most cost-effective candidate.
5. **Cache Evaluation:** If cache is enabled for the task, the engine computes a tenant-isolated cache key. On hit, it returns immediately and cancels the budget reservation.
6. **Provider Execution:** The request is transformed to provider specifications and run.
7. **Streaming/Non-Streaming Generation:**
   - **Streaming:** Tokens are normalized and yielded chunk-by-chunk. Actual tokens and costs are updated on complete.
   - **Non-Streaming:**
     - **Tools:** If the model requests a function call, execution goes through the `ToolRegistry` where arguments are validated, capability permissions checked, and side-effects logged.
     - **Structured Output:** Response JSON syntax and schema constraints are validated. If invalid, the engine runs a bounded self-repair request pointing out the parsing error to the model.
8. **Finalization:** The `AiExecution` record is written to the database with actual token counts, cost, durations, and status (`SUCCEEDED` or `FAILED`). The budget reservation is reconciled, and audit events and metrics are emitted.

---

## 3. Registries

### 3.1 Model Registry (`services/ai/ModelRegistry.js`)
Lists available models, display names, capabilities (e.g. `TEXT_GENERATION`, `VISION`, `STRUCTURED_OUTPUT`, `TOOLS`, `STREAMING`), context limits, and token pricing rates.

### 3.2 Task Registry (`services/ai/TaskRegistry.js`)
Configures HELIO AI business tasks (e.g. `CLINICAL_SUMMARY`, `CHAT_ASSISTANCE`, `PRESCRIPTION_OCR`) and sets default timeouts, temperatures, maximum tokens, and retry/fallback definitions.

### 3.3 Prompt Registry (`services/ai/PromptRegistry.js`)
Maintains versioned prompt templates in database collections (`AiPromptDefinition`), supporting input schema validation and dynamic mustache-template compiling.

### 3.4 Tool Registry (`services/ai/ToolRegistry.js`)
Houses custom functions (e.g., `getPatientMedications`, `getPatientAppointments`) that models can call, checking caller capabilities (e.g., `ai:tools:execute-privileged`) and running functions inside isolated wrappers with execution timeouts.

---

## 4. Operational Runbooks

### Runbook 4.1: AI Provider Unavailable / High Error Rates
- **Symptoms:** High error counts classified as `AI_PROVIDER_UNAVAILABLE` or `AI_UNKNOWN_PROVIDER_ERROR`. Latency spikes.
- **Likely Causes:** Provider outages, server degradation, or bad credentials.
- **Diagnostic Steps:**
  1. Check endpoint health metrics in admin panel `GET /api/internal/ai/usage`.
  2. Inspect trace logs for specific raw error codes returned by the provider adapter.
- **Safe Mitigation:**
  - The circuit breaker for the failing model route will transition to `OPEN` automatically after 5 failures within the window, routing subsequent executions to healthy fallback candidates.
  - If a permanent adapter error is identified, set `enabled: false` on the model in `ModelRegistry.js` or through database config overrides.

### Runbook 4.2: Tenant Budget Exhausted
- **Symptoms:** User receives `403 Forbidden` with the error `AI_BUDGET_EXCEEDED`.
- **Likely Causes:** High traffic volume, cost spike, or a low tenant budget limit.
- **Diagnostic Steps:**
  1. Query tenant policy spent stats using `GET /api/internal/ai/usage?tenantId=<id>`.
  2. Check for active or duplicate budget reservations under `AiBudgetReservation`.
- **Safe Mitigation:**
  - Increase the tenant's daily or monthly budget limits in `AiTenantPolicy` if authorized.
  - Reset cached data to increase the cache hit rate and decrease billable executions.

### Runbook 4.3: Circuit Breaker Open
- **Symptoms:** Requests fail immediately with `CircuitBreaker "<route>" is OPEN`.
- **Likely Causes:** Persistent API failures or timeout spikes.
- **Diagnostic Steps:**
  1. Inspect `ai_executions` logs for failure reasons of the route.
  2. Verify that network access is functional and the API keys are valid.
- **Safe Mitigation:**
  - The circuit breaker cooldown is 30 seconds. It will automatically enter `HALF_OPEN` state after the cooldown period to test endpoint health.
  - If keys are corrupted, trigger credentials rotation.
