const fs = require('fs');

class PlainTextParser {
  constructor() {
    this.parserId = 'plaintext-fallback';
    this.parserVersion = '1.0.0';
    this.supportedLanguages = ['plaintext', 'unknown'];
  }

  supports(language) {
    return this.supportedLanguages.includes(language);
  }

  async parse(filePath, content) {
    const text = content || fs.readFileSync(filePath, 'utf8');
    const lines = text.split('\n');
    return {
      status: 'SUCCESS',
      language: 'plaintext',
      parserId: this.parserId,
      parserVersion: this.parserVersion,
      syntaxTreeMetadata: {
        lineCount: lines.length,
        charCount: text.length
      },
      diagnostics: [],
      extractedMetadata: {
        summary: `Plain text file containing ${lines.length} lines.`
      }
    };
  }
}

class MarkdownParser {
  constructor() {
    this.parserId = 'markdown-parser';
    this.parserVersion = '1.0.0';
    this.supportedLanguages = ['markdown'];
  }

  supports(language) {
    return this.supportedLanguages.includes(language);
  }

  async parse(filePath, content) {
    const text = content || fs.readFileSync(filePath, 'utf8');
    const lines = text.split('\n');
    
    // Extract headers and links
    const headers = [];
    const links = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // Find headers (e.g. # Header, ## Subheader)
      const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        headers.push({
          level: headerMatch[1].length,
          text: headerMatch[2].trim(),
          lineNumber: idx + 1
        });
      }

      // Find links (e.g. [text](url))
      const linkMatches = line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
      for (const match of linkMatches) {
        links.push({
          text: match[1],
          url: match[2],
          lineNumber: idx + 1
        });
      }
    });

    return {
      status: 'SUCCESS',
      language: 'markdown',
      parserId: this.parserId,
      parserVersion: this.parserVersion,
      syntaxTreeMetadata: {
        lineCount: lines.length,
        headerCount: headers.length,
        linkCount: links.length
      },
      diagnostics: [],
      extractedMetadata: {
        headers,
        links
      }
    };
  }
}

class JavaScriptParser {
  constructor() {
    this.parserId = 'javascript-parser';
    this.parserVersion = '1.0.0';
    this.supportedLanguages = ['javascript'];
  }

  supports(language) {
    return this.supportedLanguages.includes(language);
  }

  async parse(filePath, content) {
    const text = content || fs.readFileSync(filePath, 'utf8');
    const lines = text.split('\n');

    const classes = [];
    const functions = [];
    const imports = [];
    const exportsList = [];

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // Extract class names: class Foo {
      const classMatch = line.match(/class\s+([a-zA-Z0-9_$]+)/);
      if (classMatch) {
        classes.push({ name: classMatch[1], lineNumber: lineNum });
      }

      // Extract function definitions: function bar(...) {
      const funcMatch = line.match(/function\s+([a-zA-Z0-9_$]+)\s*\(/);
      if (funcMatch) {
        functions.push({ name: funcMatch[1], type: 'declaration', lineNumber: lineNum });
      }

      // Extract arrow function assignments: const baz = (...) => {
      const arrowMatch = line.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/);
      if (arrowMatch) {
        functions.push({ name: arrowMatch[1], type: 'arrow', lineNumber: lineNum });
      }

      // Extract imports: import foo from 'bar' or require('bar')
      const importMatch = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        imports.push({ path: importMatch[1], lineNumber: lineNum });
      }
      const requireMatch = line.match(/require\(['"]([^'"]+)['"]\)/);
      if (requireMatch) {
        imports.push({ path: requireMatch[1], lineNumber: lineNum });
      }

      // Extract exports: export default or module.exports =
      if (line.includes('export default') || line.includes('export const') || line.includes('module.exports')) {
        exportsList.push({ content: line.trim(), lineNumber: lineNum });
      }
    });

    return {
      status: 'SUCCESS',
      language: 'javascript',
      parserId: this.parserId,
      parserVersion: this.parserVersion,
      syntaxTreeMetadata: {
        lineCount: lines.length,
        classCount: classes.length,
        functionCount: functions.length
      },
      diagnostics: [],
      extractedMetadata: {
        classes,
        functions,
        imports,
        exports: exportsList
      }
    };
  }
}

class LanguageParserRegistry {
  constructor() {
    this.parsers = [
      new JavaScriptParser(),
      new MarkdownParser(),
      new PlainTextParser() // fallback must be registered last
    ];
  }

  resolveParser(language) {
    const parser = this.parsers.find(p => p.supports(language));
    return parser || this.parsers[this.parsers.length - 1]; // return fallback text parser
  }
}

module.exports = {
  LanguageParserRegistry: new LanguageParserRegistry(),
  JavaScriptParser,
  MarkdownParser,
  PlainTextParser
};
