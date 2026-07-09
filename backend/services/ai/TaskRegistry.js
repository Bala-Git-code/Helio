const { Capabilities } = require('./ModelRegistry');

const tasks = {
  CLINICAL_SUMMARY: {
    taskType: 'CLINICAL_SUMMARY',
    description: 'Summarizes raw doctor notes and clinical logs into clinical abstracts.',
    requiredCapabilities: [Capabilities.TEXT_GENERATION],
    allowedExecutionModes: ['NON_STREAMING'],
    defaultTimeout: 15000,
    defaultMaxOutputTokens: 2048,
    defaultTemperature: 0.2,
    cachePolicy: { enabled: true, ttlSeconds: 7200 },
    retryPolicy: { maxAttempts: 3, backoffFactor: 2 },
    fallbackPolicy: { fallbackModelId: 'gemini-1.5-pro' }
  },
  DRUG_INTERACTION: {
    taskType: 'DRUG_INTERACTION',
    description: 'Audits interactions between multiple drugs.',
    requiredCapabilities: [Capabilities.TEXT_GENERATION],
    allowedExecutionModes: ['NON_STREAMING'],
    defaultTimeout: 10000,
    defaultMaxOutputTokens: 1024,
    defaultTemperature: 0.1,
    cachePolicy: { enabled: true, ttlSeconds: 86400 },
    retryPolicy: { maxAttempts: 3, backoffFactor: 2 },
    fallbackPolicy: { fallbackModelId: 'gemini-1.5-pro' }
  },
  CHAT_ASSISTANCE: {
    taskType: 'CHAT_ASSISTANCE',
    description: 'Empathetic healthcare conversational assistant.',
    requiredCapabilities: [Capabilities.TEXT_GENERATION, Capabilities.STREAMING],
    allowedExecutionModes: ['NON_STREAMING', 'STREAMING'],
    defaultTimeout: 30000,
    defaultMaxOutputTokens: 2048,
    defaultTemperature: 0.7,
    cachePolicy: { enabled: false }, // Chat responses shouldn't be cached due to transient dynamic context
    retryPolicy: { maxAttempts: 2, backoffFactor: 1.5 }
  },
  PRESCRIPTION_OCR: {
    taskType: 'PRESCRIPTION_OCR',
    description: 'Extracts medication items from scanned prescription images.',
    requiredCapabilities: [Capabilities.TEXT_GENERATION, Capabilities.VISION, Capabilities.STRUCTURED_OUTPUT],
    allowedExecutionModes: ['NON_STREAMING'],
    defaultTimeout: 20000,
    defaultMaxOutputTokens: 4096,
    defaultTemperature: 0.1,
    cachePolicy: { enabled: true, ttlSeconds: 86400 },
    retryPolicy: { maxAttempts: 3, backoffFactor: 2 }
  },
  EMBEDDINGS: {
    taskType: 'EMBEDDINGS',
    description: 'Generates vector representations of text snippets.',
    requiredCapabilities: [Capabilities.EMBEDDINGS],
    allowedExecutionModes: ['NON_STREAMING'],
    defaultTimeout: 10000,
    defaultMaxOutputTokens: 0,
    defaultTemperature: 0.0,
    cachePolicy: { enabled: true, ttlSeconds: 86400 },
    retryPolicy: { maxAttempts: 3, backoffFactor: 2 }
  }
};

class TaskRegistry {
  getTask(taskType) {
    return tasks[taskType] || null;
  }

  listTasks() {
    return Object.values(tasks);
  }

  registerTask(taskDefinition) {
    if (tasks[taskDefinition.taskType]) {
      throw new Error(`Duplicate task registration rejected: ${taskDefinition.taskType}`);
    }
    // Validation
    if (!taskDefinition.taskType || !taskDefinition.requiredCapabilities) {
      throw new Error(`Invalid task definition structure for ${taskDefinition.taskType}`);
    }
    tasks[taskDefinition.taskType] = taskDefinition;
  }
}

module.exports = new TaskRegistry();
