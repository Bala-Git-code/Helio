const path = require('path');
const fs = require('fs');

const Classifications = {
  SOURCE_CODE: 'SOURCE_CODE',
  DOCUMENTATION: 'DOCUMENTATION',
  BINARY: 'BINARY',
  GENERATED: 'GENERATED',
  VENDOR: 'VENDOR',
  UNKNOWN: 'UNKNOWN'
};

const DefaultExclusions = [
  'node_modules',
  'vendor',
  'dist',
  'build',
  'coverage',
  '.git',
  '.next',
  '.cache',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

class FileClassifier {
  constructor() {
    this.maxSingleFileBytes = Number(process.env.REPOSITORY_MAX_SINGLE_FILE_BYTES) || 1 * 1024 * 1024; // 1MB default
  }

  isIgnored(repoRelativePath) {
    const parts = repoRelativePath.split(/[\\\/]/);
    return DefaultExclusions.some(exc => parts.includes(exc));
  }

  /**
   * Detects binary files by inspecting first 512 bytes for NUL characters
   */
  isBinary(filePath) {
    try {
      const buffer = Buffer.alloc(512);
      const fd = fs.openSync(filePath, 'r');
      const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
      fs.closeSync(fd);

      for (let i = 0; i < bytesRead; i++) {
        // NUL byte indicates binary
        if (buffer[i] === 0) {
          return true;
        }
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  isMinified(filePath, contentSample) {
    // Check line lengths
    const sample = contentSample || '';
    const lines = sample.split('\n');
    for (const line of lines) {
      if (line.length > 500) return true; // typical of minified javascript
    }
    return false;
  }

  detectLanguage(repoRelativePath) {
    const ext = path.extname(repoRelativePath).toLowerCase();
    switch (ext) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        return 'javascript';
      case '.md':
      case '.markdown':
        return 'markdown';
      case '.txt':
        return 'plaintext';
      case '.json':
        return 'json';
      default:
        return 'unknown';
    }
  }

  classify(repoRelativePath, isBin, isGen) {
    if (isBin) return Classifications.BINARY;
    if (isGen || this.isIgnored(repoRelativePath)) return Classifications.GENERATED;
    
    const lang = this.detectLanguage(repoRelativePath);
    if (lang === 'markdown') return Classifications.DOCUMENTATION;
    if (lang === 'javascript') return Classifications.SOURCE_CODE;

    return Classifications.UNKNOWN;
  }

  /**
   * Enforces path traversal and symlink safety
   */
  isSafePath(repoRelativePath) {
    // Reject absolute paths, parent directory access, and NULL bytes
    if (path.isAbsolute(repoRelativePath)) return false;
    if (repoRelativePath.includes('\0')) return false;
    if (repoRelativePath.split(/[\\\/]/).includes('..')) return false;
    
    const normalized = path.normalize(repoRelativePath);
    if (normalized.startsWith('..') || normalized.includes('..')) {
      return false; // escapes repo root
    }

    return true;
  }
}

module.exports = {
  FileClassifier: new FileClassifier(),
  Classifications
};
