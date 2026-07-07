const crypto = require('crypto');

// In-Memory metrics storage to support prometheus-like monitoring in local setups
const metrics = {
  helio_jobs_created_total: new Map(),
  helio_jobs_started_total: new Map(),
  helio_jobs_succeeded_total: new Map(),
  helio_jobs_failed_total: new Map(),
  helio_jobs_retried_total: new Map(),
  helio_jobs_dead_lettered_total: new Map(),
  helio_jobs_cancelled_total: new Map(),
  helio_job_execution_duration: [], // list of durations
  helio_job_queue_wait_duration: [], // list of durations
  helio_active_jobs: new Map(), // jobType -> count
  helio_stalled_jobs_recovered_total: 0,
  helio_worker_heartbeat_failures_total: 0,
  helio_worker_active_count: 0
};

// Simple helper to increment metric map keys
function incrementKey(map, key, amt = 1) {
  const current = map.get(key) || 0;
  map.set(key, current + amt);
}

const MetricsRegistry = {
  incrementCreated(jobType) {
    incrementKey(metrics.helio_jobs_created_total, jobType);
  },
  incrementStarted(jobType) {
    incrementKey(metrics.helio_jobs_started_total, jobType);
    incrementKey(metrics.helio_active_jobs, jobType);
  },
  incrementSucceeded(jobType, durationMs) {
    incrementKey(metrics.helio_jobs_succeeded_total, jobType);
    metrics.helio_job_execution_duration.push({ jobType, val: durationMs });
    
    const active = metrics.helio_active_jobs.get(jobType) || 1;
    metrics.helio_active_jobs.set(jobType, Math.max(0, active - 1));
  },
  incrementFailed(jobType, errorClassification, durationMs) {
    incrementKey(metrics.helio_jobs_failed_total, `${jobType}:${errorClassification}`);
    if (durationMs !== undefined) {
      metrics.helio_job_execution_duration.push({ jobType, val: durationMs });
    }
    
    const active = metrics.helio_active_jobs.get(jobType) || 1;
    metrics.helio_active_jobs.set(jobType, Math.max(0, active - 1));
  },
  incrementRetried(jobType) {
    incrementKey(metrics.helio_jobs_retried_total, jobType);
  },
  incrementDeadLettered(jobType) {
    incrementKey(metrics.helio_jobs_dead_lettered_total, jobType);
  },
  incrementCancelled(jobType) {
    incrementKey(metrics.helio_jobs_cancelled_total, jobType);
  },
  recordQueueWait(jobType, waitMs) {
    metrics.helio_job_queue_wait_duration.push({ jobType, val: waitMs });
  },
  incrementStalledRecovered() {
    metrics.helio_stalled_jobs_recovered_total += 1;
  },
  incrementWorkerHeartbeatFailure() {
    metrics.helio_worker_heartbeat_failures_total += 1;
  },
  setWorkerActiveCount(count) {
    metrics.helio_worker_active_count = count;
  },
  getMetricsSnapshot() {
    return {
      helio_jobs_created_total: Object.fromEntries(metrics.helio_jobs_created_total),
      helio_jobs_started_total: Object.fromEntries(metrics.helio_jobs_started_total),
      helio_jobs_succeeded_total: Object.fromEntries(metrics.helio_jobs_succeeded_total),
      helio_jobs_failed_total: Object.fromEntries(metrics.helio_jobs_failed_total),
      helio_jobs_retried_total: Object.fromEntries(metrics.helio_jobs_retried_total),
      helio_jobs_dead_lettered_total: Object.fromEntries(metrics.helio_jobs_dead_lettered_total),
      helio_jobs_cancelled_total: Object.fromEntries(metrics.helio_jobs_cancelled_total),
      helio_active_jobs: Object.fromEntries(metrics.helio_active_jobs),
      helio_stalled_jobs_recovered_total: metrics.helio_stalled_jobs_recovered_total,
      helio_worker_heartbeat_failures_total: metrics.helio_worker_heartbeat_failures_total,
      helio_worker_active_count: metrics.helio_worker_active_count,
      avg_execution_duration_ms: metrics.helio_job_execution_duration.length > 0 
        ? Math.round(metrics.helio_job_execution_duration.reduce((a, b) => a + b.val, 0) / metrics.helio_job_execution_duration.length)
        : 0,
      avg_queue_wait_duration_ms: metrics.helio_job_queue_wait_duration.length > 0 
        ? Math.round(metrics.helio_job_queue_wait_duration.reduce((a, b) => a + b.val, 0) / metrics.helio_job_queue_wait_duration.length)
        : 0
    };
  }
};

class StructuredLogger {
  constructor(context = {}) {
    this.context = context;
  }

  child(newContext) {
    return new StructuredLogger({ ...this.context, ...newContext });
  }

  log(level, event, message, meta = {}) {
    const logObj = {
      timestamp: new Date().toISOString(),
      level,
      event,
      message,
      ...this.context,
      ...meta
    };
    // Format payload nicely in dev mode, keep it single-line JSON structured in test/production
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${logObj.timestamp}] [${level.toUpperCase()}] [${event}]: ${message}`, meta);
    } else {
      console.log(JSON.stringify(logObj));
    }
  }

  info(event, message, meta) {
    this.log('info', event, message, meta);
  }

  warn(event, message, meta) {
    this.log('warn', event, message, meta);
  }

  error(event, message, meta) {
    this.log('error', event, message, meta);
  }
}

const baseLogger = new StructuredLogger({ service: 'helio-worker' });

function generateTraceId() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = {
  MetricsRegistry,
  baseLogger,
  generateTraceId,
  StructuredLogger
};
