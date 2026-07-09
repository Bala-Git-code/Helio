const fs = require('fs');

class MarkdownIntelligenceAdapter {
  constructor() {
    this.adapterId = 'markdown-intel-adapter';
    this.adapterVersion = '1.0.0';
    this.supportedLanguages = ['markdown'];
  }

  supports(language) {
    return this.supportedLanguages.includes(language);
  }

  async segment(filePath, content) {
    const text = content || fs.readFileSync(filePath, 'utf8');
    const lines = text.split('\n');
    const segments = [];

    // FILE segment
    segments.push({
      segmentType: 'FILE',
      name: filePath.split('/').pop(),
      qualifiedName: filePath,
      startLine: 1,
      endLine: lines.length,
      startByte: 0,
      endByte: text.length
    });

    const headers = [];
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const match = line.trim().match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        headers.push({
          level: match[1].length,
          text: match[2].trim(),
          lineNumber: lineNum
        });
      }
    });

    headers.forEach((h, idx) => {
      const startLine = h.lineNumber;
      // Determine end line: find next header with level <= current header's level
      let endLine = lines.length;
      for (let i = idx + 1; i < headers.length; i++) {
        if (headers[i].level <= h.level) {
          endLine = headers[i].lineNumber - 1;
          break;
        }
      }

      segments.push({
        segmentType: 'DOCUMENTATION_SECTION',
        name: h.text,
        qualifiedName: h.text,
        startLine,
        endLine,
        startByte: 0,
        endByte: 0
      });
    });

    // Establish parent nesting
    segments.forEach(seg => {
      if (seg.segmentType === 'FILE') return;

      let parent = null;
      segments.forEach(candidate => {
        if (candidate === seg || candidate.segmentType === 'FILE') return;
        if (candidate.startLine < seg.startLine && candidate.endLine >= seg.endLine) {
          if (!parent || (candidate.startLine > parent.startLine)) {
            parent = candidate;
          }
        }
      });

      if (parent) {
        seg.parentSegmentName = parent.name;
      }
    });

    return segments;
  }

  async extractSymbols(filePath, content, segments) {
    return [];
  }

  async extractScopes(filePath, content, segments) {
    return [];
  }

  async extractImports(filePath, content) {
    return [];
  }

  async extractExports(filePath, content) {
    return [];
  }

  async extractReferences(filePath, content, symbols, imports, scopes) {
    return [];
  }

  async extractRelationships(filePath, content, symbols, imports, references) {
    return [];
  }
}

module.exports = MarkdownIntelligenceAdapter;
