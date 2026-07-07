# HELIO Background Job Execution & Durable Worker Runtime Guide

This guide describes HELIO's durable background execution runtime, lifecycle transitions, idempotency constraints, administrative controls, and troubleshooting runbooks.

---

## 1. Architecture Overview

HELIO uses a **database-authoritative, queue-decoupled** runtime architecture:

```
[ Domain Logic ] ──> [ QueueService.enqueue() ] ──> [ Database (QueueJobs) ]
                                                            │
                                                     (Poller Claim & Lease)
                                                            │
                                                            ▼
[ JobAttempt Log ] <── [ Handler Execution Context ] <── [ Worker Runtime ]
```

### Key Components

1. **Durable Persistence (`QueueJob`)**: Authoritative record of jobs independent of queue transport state.
2. **Atomic compare-and-swap claims**: Workers claim jobs by atomically updating the status from queued to claimed.
3. **Execution leases**: Leases specify a `lockedUntil` timestamp. Running workers must extend leases periodically via heartbeats.
4. **Failure classification**: Errors are categorized (e.g. `TIMEOUT`, `VALIDATION_FAILURE`, `DEPENDENCY_UNAVAILABLE`) to trigger retry or dead-letter states.

---

## 2. Job Lifecycle State Transitions

Jobs follow an explicit, validated transition graph:

```
   PENDING ──> QUEUED ──> CLAIMED ──> RUNNING ──> SUCCEEDED
      │          │           │          │
      │          ▼           ▼          ▼
      └────> CANCELLED <── CANCELLATION_REQUESTED <── FAILED
                                 │                      │
                                 ▼                      ▼
                           (Cooperative)        RETRY_SCHEDULED / DEAD_LETTERED
```

---

## 3. Creating a Job Handler

Create a job type configuration and register it at worker startup inside `JobHandlerRegistry`:

```javascript
const JobHandlerRegistry = require('./services/medication/JobHandlerRegistry');

JobHandlerRegistry.register({
  jobType: 'send-reminder-email',
  execute: async (context, payload) => {
    // 1. Check cancellation before heavy work
    context.throwIfCancellationRequested();
    
    // 2. Perform execution
    await emailSender.send(payload.email, payload.subject, payload.body);
    
    // 3. Heartbeat on long operations
    await context.heartbeat();
    
    // 4. Report progress
    await context.reportProgress(100, 'DISPATCHED', 'Email sent successfully');
  },
  executionPolicy: {
    maxAttempts: 3,
    executionTimeoutMs: 60000,
    leaseDurationMs: 120000,
    heartbeatIntervalMs: 30000
  }
});
```

---

## 4. Idempotency Store API

Prevent duplicate side-effects using the multi-tenant `IdempotencyStore`:

```javascript
const IdempotencyStore = require('./services/medication/IdempotencyStore');

async function processPayment(tenantId, paymentId, amount) {
  const lock = await IdempotencyStore.acquire(tenantId, 'payment-processing', paymentId);
  
  if (!lock.success) {
    if (lock.status === 'COMPLETED') return lock.resultReference;
    throw new Error('Operation already in progress.');
  }

  try {
    const tx = await stripe.charge(amount);
    await IdempotencyStore.complete(tenantId, 'payment-processing', paymentId, tx);
    return tx;
  } catch (err) {
    await IdempotencyStore.fail(tenantId, 'payment-processing', paymentId, err.message);
    throw err;
  }
}
```

---

## 5. Administrative Operational REST APIs

All routes require standard JWT protection (`protect`) and capability authorization.

- **`GET /api/internal/jobs`**
  - Scope: `jobs:read`
  - Filters: `tenant`, `jobType`, `status`, `workerId`, `correlationId`, `errorClassification`
  - Note: Excludes `payload` and `result` from listing for performance.

- **`GET /api/internal/jobs/:jobId`**
  - Scope: `jobs:read`
  - Note: Validates tenant context and consent linking, redacting sensitive details.

- **`POST /api/internal/jobs/:jobId/retry`**
  - Scope: `jobs:retry`
  - Action: Resets attempt count and schedules job immediately. Creates audit trail.

- **`POST /api/internal/jobs/:jobId/cancel`**
  - Scope: `jobs:cancel`
  - Action: Marks job cancelled or signals abort controller if running.

---

## 6. Operational Runbooks

### Runbook 6.1: Job Stuck in RUNNING State
- **Symptoms**: Job has been in `RUNNING` status for over an hour.
- **Causes**: Worker process crashed during execution or suffered network partition.
- **Diagnostic Steps**:
  1. Inspect `lockedUntil` timestamp. If `lockedUntil < now`, the lease is expired.
  2. Locate the owner worker via `lockedBy` in `GET /api/internal/workers`.
- **Mitigation**:
  1. Running `ReconciliationService` will automatically detect and recover expired leases within 2 minutes.
  2. To manually trigger lease recovery, invoke `/api/internal/jobs/:jobId/retry`.

### Runbook 6.2: Large Dead-Letter Backlog
- **Symptoms**: High count of jobs in `DEAD_LETTERED` status.
- **Causes**: Bug in execution handlers, external dependency downtime, or database timeouts.
- **Diagnostic Steps**:
  1. Inspect failure classifications: `GET /api/internal/jobs?status=DEAD_LETTERED`.
  2. Read error messages in attempts: `GET /api/internal/jobs/:jobId/attempts`.
- **Mitigation**:
  1. If due to dependency outage, issue paged manual retries via `POST /api/internal/jobs/:jobId/retry` once the service resolves.
  2. If due to code defect, deploy hotfix first, then trigger retries.

### Runbook 6.3: Worker Disappeared / Heartbeat Fails
- **Symptoms**: Worker status becomes `UNHEALTHY` or disappears from registry.
- **Causes**: Node memory exhaustion, container eviction, or thread pool exhaustion.
- **Diagnostic Steps**:
  1. Run `GET /api/internal/workers` to check worker node's `lastHeartbeatAt`.
  2. Check host logs for out-of-memory (OOM) events.
- **Mitigation**:
  1. Replace worker instances and let the new workers pick up the workload.
  2. Active jobs from crashed workers will be recovered cleanly via expired leases.
