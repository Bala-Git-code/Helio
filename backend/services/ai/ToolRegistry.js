const { checkCapability } = require('../../middleware/authorization');

const SideEffects = {
  READ_ONLY: 'READ_ONLY',
  REVERSIBLE_WRITE: 'REVERSIBLE_WRITE',
  IRREVERSIBLE_WRITE: 'IRREVERSIBLE_WRITE',
  EXTERNAL_SIDE_EFFECT: 'EXTERNAL_SIDE_EFFECT',
  PRIVILEGED_OPERATION: 'PRIVILEGED_OPERATION'
};

const registeredTools = new Map();

class ToolRegistry {
  register(toolDef) {
    if (registeredTools.has(toolDef.name)) {
      throw new Error(`Duplicate tool registration rejected: ${toolDef.name}`);
    }
    if (!toolDef.name || !toolDef.description || !toolDef.execute) {
      throw new Error(`Invalid tool registration structure for tool: ${toolDef.name || 'unnamed'}`);
    }
    registeredTools.set(toolDef.name, toolDef);
  }

  getTool(name) {
    return registeredTools.get(name) || null;
  }

  listTools() {
    return Array.from(registeredTools.values());
  }

  async executeTool(params) {
    const { tenantId, toolName, args, user } = params;

    const tool = this.getTool(toolName);
    if (!tool) {
      throw new Error(`AI_TOOL_EXECUTION_FAILED: Tool "${toolName}" is not registered.`);
    }

    // 1. Authorization checks
    if (tool.authorizationPolicy) {
      if (!user) {
        throw new Error(`AI_TOOL_EXECUTION_FAILED: Tool "${toolName}" requires authorization context.`);
      }
      
      // If tool requires a specific capability, check it
      if (tool.authorizationPolicy.requiredCapability) {
        const roleCapabilities = {
          admin: ['jobs:read', 'jobs:read:any-tenant', 'jobs:retry', 'jobs:cancel', 'workers:read', 'ai:tools:execute-privileged'],
          doctor: ['jobs:read', 'workers:read', 'ai:tools:execute-privileged'],
          patient: []
        };
        const caps = roleCapabilities[user.role] || [];
        if (!caps.includes(tool.authorizationPolicy.requiredCapability)) {
          throw new Error(`AI_TOOL_EXECUTION_FAILED: User lacks required capability "${tool.authorizationPolicy.requiredCapability}" for tool "${toolName}".`);
        }
      }
    }

    // 2. Validate input schema
    if (tool.inputSchema) {
      const validator = require('./StructuredOutputService');
      const { valid, errors } = validator.validate(args, tool.inputSchema);
      if (!valid) {
        throw new Error(`AI_TOOL_EXECUTION_FAILED: Arguments do not match schema: ${errors.join(', ')}`);
      }
    }

    // 3. Side effect policy check
    if (tool.sideEffectClassification === SideEffects.PRIVILEGED_OPERATION) {
      // High risk operation check
      console.log(`[ToolRegistry] Running privileged operation: ${toolName}`);
    }

    // 4. Execution with timeout boundary
    const timeoutMs = tool.executionTimeout || 5000;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`AI_TOOL_EXECUTION_FAILED: Tool "${toolName}" timed out after ${timeoutMs}ms.`));
      }, timeoutMs);

      Promise.resolve(tool.execute(args, { tenantId, user }))
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timeout);
          reject(new Error(`AI_TOOL_EXECUTION_FAILED: Tool execution error: ${err.message}`));
        });
    });
  }
}

module.exports = {
  ToolRegistry: new ToolRegistry(),
  SideEffects
};
