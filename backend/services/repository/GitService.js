const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class GitService {
  constructor() {
    this.gitPath = process.env.GIT_PATH || 'git';
    this.workspaceRoot = process.env.REPOSITORY_WORKSPACE_ROOT || path.join(os.tmpdir(), 'helio-workspaces');
    
    // Ensure workspace root directory exists
    if (!fs.existsSync(this.workspaceRoot)) {
      fs.mkdirSync(this.workspaceRoot, { recursive: true });
    }
  }

  /**
   * Helper to create a non-predictable tenant workspace path
   */
  createTempWorkspace(tenantId, repoName) {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const folder = `tenant-${tenantId}-${repoName || 'repo'}-${randomHex}`;
    const workspacePath = path.join(this.workspaceRoot, folder);
    fs.mkdirSync(workspacePath, { recursive: true });
    return workspacePath;
  }

  /**
   * Safe execution wrapper utilizing child_process.execFile (prevents shell interpolation)
   */
  async executeGitCommand(args, cwd, timeoutMs = 30000, maxOutputBytes = 10 * 1024 * 1024) {
    // Redact tokens/passwords from arguments before logging
    const redactArgs = args.map(arg => {
      if (arg.includes('http://') || arg.includes('https://')) {
        return arg.replace(/\/\/.*@/, '//[REDACTED]@');
      }
      return arg;
    });

    console.log(`[GitService] Running: git ${redactArgs.join(' ')} (Cwd: ${cwd || 'N/A'})`);

    return new Promise((resolve, reject) => {
      const processOptions = {
        cwd,
        timeout: timeoutMs,
        maxBuffer: maxOutputBytes,
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0', // disable interactive credential prompts
          GIT_ASKPASS: 'true'
        }
      };

      execFile(this.gitPath, args, processOptions, (err, stdout, stderr) => {
        if (err) {
          const errMsg = err.message || '';
          // Redact errors
          const cleanErrMsg = errMsg.replace(/https:\/\/.*@/g, 'https://[REDACTED]@');
          reject(new Error(`Git execution failed: ${cleanErrMsg}`));
          return;
        }

        resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString()
        });
      });
    });
  }

  async clone(cloneUrl, targetDir, revision = 'main') {
    // Basic argument validation to prevent path injection
    if (!/^[a-zA-Z0-9_\-\/]+$/.test(revision)) {
      throw new Error(`Invalid revision name: ${revision}`);
    }

    try {
      // Clone only the default/requested branch with depth 1 to save disk space
      await this.executeGitCommand(['clone', '--depth', '1', '--branch', revision, cloneUrl, '.'], targetDir);
    } catch (err) {
      // Fallback: If clone fails (e.g. branch is actually a commit SHA which depth 1 branch clone doesn't support directly),
      // we do standard clone and check out
      try {
        await this.executeGitCommand(['clone', cloneUrl, '.'], targetDir);
        await this.executeGitCommand(['checkout', revision], targetDir);
      } catch (innerErr) {
        throw new Error(`Git clone failed: ${innerErr.message}`);
      }
    }
  }

  async getLatestCommit(targetDir) {
    const res = await this.executeGitCommand(['rev-parse', 'HEAD'], targetDir);
    return res.stdout.trim();
  }

  async cleanupWorkspace(workspacePath) {
    if (!workspacePath.startsWith(this.workspaceRoot)) {
      throw new Error(`Security validation fail: Attempted to clean directory outside HELIO workspace: ${workspacePath}`);
    }

    try {
      if (fs.existsSync(workspacePath)) {
        fs.rmSync(workspacePath, { recursive: true, force: true });
        console.log(`[GitService] Cleaned workspace folder: ${workspacePath}`);
      }
    } catch (err) {
      console.error(`[GitService] Failed cleaning workspace folder ${workspacePath}:`, err.message);
    }
  }
}

module.exports = new GitService();
