const JavaScriptIntelligenceAdapter = require('./JavaScriptIntelligenceAdapter');
const MarkdownIntelligenceAdapter = require('./MarkdownIntelligenceAdapter');

class FallbackIntelligenceAdapter {
  constructor() {
    this.adapterId = 'fallback-intel-adapter';
    this.adapterVersion = '1.0.0';
    this.supportedLanguages = ['plaintext', 'unknown'];
  }

  supports(language) {
    return true;
  }

  async segment(filePath, content) {
    const text = content || '';
    const lines = text.split('\n');
    return [{
      segmentType: 'FILE',
      name: filePath.split('/').pop(),
      qualifiedName: filePath,
      startLine: 1,
      endLine: lines.length,
      startByte: 0,
      endByte: text.length
    }];
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

class LanguageIntelligenceAdapterRegistry {
  constructor() {
    this.adapters = [
      new JavaScriptIntelligenceAdapter(),
      new MarkdownIntelligenceAdapter(),
      new FallbackIntelligenceAdapter()
    ];
  }

  resolveAdapter(language) {
    const adapter = this.adapters.find(a => a.supports(language));
    return adapter || this.adapters[this.adapters.length - 1];
  }
}

module.exports = {
  LanguageIntelligenceAdapterRegistry: new LanguageIntelligenceAdapterRegistry(),
  JavaScriptIntelligenceAdapter,
  MarkdownIntelligenceAdapter,
  FallbackIntelligenceAdapter
};
