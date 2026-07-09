const fs = require('fs');

class JavaScriptIntelligenceAdapter {
  constructor() {
    this.adapterId = 'javascript-intel-adapter';
    this.adapterVersion = '1.0.0';
    this.supportedLanguages = ['javascript'];
  }

  supports(language) {
    return this.supportedLanguages.includes(language);
  }

  _findBraceBoundaries(lines, startLine) {
    let balance = 0;
    let hasOpened = false;
    let endLine = startLine;

    for (let i = startLine - 1; i < lines.length; i++) {
      const line = lines[i];
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '{') {
          if (!hasOpened) {
            hasOpened = true;
            balance = 1;
          } else {
            balance++;
          }
        } else if (char === '}') {
          if (hasOpened) {
            balance--;
            if (balance === 0) {
              endLine = i + 1;
              return endLine;
            }
          }
        }
      }
    }
    return lines.length; // fallback to EOF
  }

  _parseImportClause(clause) {
    clause = clause.trim();
    if (clause.startsWith('{') && clause.endsWith('}')) {
      const parts = clause.slice(1, -1).split(',');
      const results = [];
      parts.forEach(part => {
        part = part.trim();
        if (!part) return;
        if (part.includes(' as ')) {
          const [importedName, localName] = part.split(' as ').map(s => s.trim());
          results.push({ importedName, localName });
        } else if (part.includes(':')) {
          const [importedName, localName] = part.split(':').map(s => s.trim());
          results.push({ importedName, localName });
        } else {
          results.push({ importedName: part, localName: part });
        }
      });
      return results;
    } else if (clause.startsWith('*')) {
      const match = clause.match(/\*\s+as\s+([a-zA-Z0-9_$]+)/);
      if (match) {
        return [{ importedName: '*', localName: match[1] }];
      }
    } else if (clause.includes(',')) {
      const firstComma = clause.indexOf(',');
      const defaultExport = clause.substring(0, firstComma).trim();
      const destructured = clause.substring(firstComma + 1).trim();
      const results = [{ importedName: 'default', localName: defaultExport }];
      results.push(...this._parseImportClause(destructured));
      return results;
    } else {
      return [{ importedName: 'default', localName: clause }];
    }
    return [];
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

    // Detect classes and functions
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // Class segment
      const classMatch = line.match(/class\s+([a-zA-Z0-9_$]+)/);
      if (classMatch) {
        const startLine = lineNum;
        const endLine = this._findBraceBoundaries(lines, startLine);
        segments.push({
          segmentType: 'CLASS',
          name: classMatch[1],
          qualifiedName: classMatch[1],
          startLine,
          endLine,
          startByte: 0,
          endByte: 0 // Byte counting can be estimated/skipped for regex AST
        });
      }

      // Function segment
      const funcMatch = line.match(/function\s+([a-zA-Z0-9_$]+)\s*\(/);
      if (funcMatch) {
        const startLine = lineNum;
        const endLine = this._findBraceBoundaries(lines, startLine);
        segments.push({
          segmentType: 'FUNCTION',
          name: funcMatch[1],
          qualifiedName: funcMatch[1],
          startLine,
          endLine,
          startByte: 0,
          endByte: 0
        });
      }

      // Arrow function assignment segment
      const arrowMatch = line.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/);
      if (arrowMatch) {
        const startLine = lineNum;
        const endLine = this._findBraceBoundaries(lines, startLine);
        segments.push({
          segmentType: 'FUNCTION',
          name: arrowMatch[1],
          qualifiedName: arrowMatch[1],
          startLine,
          endLine,
          startByte: 0,
          endByte: 0
        });
      }

      // ES6 class method match
      const methodMatch = line.match(/^\s*(async\s+)?([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/);
      if (methodMatch) {
        const methodName = methodMatch[2];
        const keywords = ['if', 'for', 'while', 'switch', 'catch', 'function', 'class', 'with'];
        if (!keywords.includes(methodName)) {
          const startLine = lineNum;
          const endLine = this._findBraceBoundaries(lines, startLine);
          segments.push({
            segmentType: 'FUNCTION',
            name: methodName,
            qualifiedName: methodName,
            startLine,
            endLine,
            startByte: 0,
            endByte: 0
          });
        }
      }
    });

    // Determine parent-child nesting
    segments.forEach(seg => {
      if (seg.segmentType === 'FILE') return;

      // Find smallest enclosing segment
      let parent = null;
      segments.forEach(candidate => {
        if (candidate === seg) return;
        if (candidate.startLine <= seg.startLine && candidate.endLine >= seg.endLine) {
          if (!parent || (candidate.endLine - candidate.startLine < parent.endLine - parent.startLine)) {
            parent = candidate;
          }
        }
      });

      if (parent) {
        seg.parentSegmentName = parent.name;
        // If parent is a CLASS, then this is a METHOD
        if (parent.segmentType === 'CLASS' && seg.segmentType === 'FUNCTION') {
          seg.segmentType = 'METHOD';
          seg.qualifiedName = `${parent.name}.${seg.name}`;
        }
      }
    });

    return segments;
  }

  async extractSymbols(filePath, content, segments) {
    const text = content || fs.readFileSync(filePath, 'utf8');
    const symbols = [];

    segments.forEach(seg => {
      if (seg.segmentType === 'FILE') return;

      let signature = '';
      if (seg.segmentType === 'CLASS') {
        signature = `class ${seg.name}`;
      } else if (seg.segmentType === 'FUNCTION' || seg.segmentType === 'METHOD') {
        signature = `function ${seg.name}(...)`;
      }

      symbols.push({
        filePath,
        language: 'javascript',
        symbolKind: seg.segmentType,
        name: seg.name,
        qualifiedName: seg.qualifiedName,
        signature,
        visibility: 'public',
        startLine: seg.startLine,
        endLine: seg.endLine,
        contentHash: 'none', // computed at DB level or adapter level if needed
        adapterId: this.adapterId,
        adapterVersion: this.adapterVersion
      });
    });

    // Map parent symbol relationships
    symbols.forEach(sym => {
      const seg = segments.find(s => s.name === sym.name && s.startLine === sym.startLine);
      if (seg && seg.parentSegmentName) {
        const parentSym = symbols.find(s => s.name === seg.parentSegmentName);
        if (parentSym) {
          sym.parentSymbolName = parentSym.name;
        }
      }
    });

    return symbols;
  }

  async extractScopes(filePath, content, segments) {
    const scopes = [];

    // GLOBAL scope
    const fileSeg = segments.find(s => s.segmentType === 'FILE');
    scopes.push({
      filePath,
      scopeKind: 'GLOBAL',
      name: 'global',
      startLine: 1,
      endLine: fileSeg ? fileSeg.endLine : 1,
      depth: 0
    });

    segments.forEach(seg => {
      if (seg.segmentType === 'FILE') return;

      scopes.push({
        filePath,
        scopeKind: seg.segmentType,
        name: seg.name,
        startLine: seg.startLine,
        endLine: seg.endLine,
        depth: 0 // calculated after constructing hierarchy
      });
    });

    // Establish parent hierarchy and depths
    scopes.forEach(scope => {
      if (scope.scopeKind === 'GLOBAL') return;

      // Find parent scope (smallest enclosing scope)
      let parent = null;
      scopes.forEach(candidate => {
        if (candidate === scope) return;
        if (candidate.startLine <= scope.startLine && candidate.endLine >= scope.endLine) {
          if (!parent || (candidate.endLine - candidate.startLine < parent.endLine - parent.startLine)) {
            parent = candidate;
          }
        }
      });

      if (parent) {
        scope.parentScopeName = parent.name;
      }
    });

    // Calculate depths
    const calcDepth = (sc) => {
      if (!sc.parentScopeName || sc.parentScopeName === 'global') return 1;
      const parent = scopes.find(s => s.name === sc.parentScopeName);
      return parent ? calcDepth(parent) + 1 : 1;
    };

    scopes.forEach(scope => {
      if (scope.scopeKind !== 'GLOBAL') {
        scope.depth = calcDepth(scope);
      }
    });

    return scopes;
  }

  async extractImports(filePath, content) {
    const text = content || fs.readFileSync(filePath, 'utf8');
    const lines = text.split('\n');
    const imports = [];

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      let match;

      // ES6 imports
      const importRegex = /import\s+([\s\S]+?)\s+from\s+['"]([^'"]+)['"]/g;
      while ((match = importRegex.exec(line)) !== null) {
        const importClause = match[1].trim();
        const specifier = match[2].trim();
        const parsed = this._parseImportClause(importClause);
        parsed.forEach(p => {
          imports.push({
            sourceFilePath: filePath,
            importKind: specifier.startsWith('.') ? 'RELATIVE' : 'EXTERNAL',
            rawSpecifier: specifier,
            normalizedSpecifier: specifier,
            importedName: p.importedName,
            localName: p.localName,
            startLine: lineNum,
            endLine: lineNum
          });
        });
      }

      // CommonJS require
      const requireRegex = /(?:const|let|var)\s+([\s\S]+?)\s*=\s*require\(['"]([^'"]+)['"]\)/g;
      while ((match = requireRegex.exec(line)) !== null) {
        const importClause = match[1].trim();
        const specifier = match[2].trim();
        const parsed = this._parseImportClause(importClause);
        parsed.forEach(p => {
          imports.push({
            sourceFilePath: filePath,
            importKind: specifier.startsWith('.') ? 'RELATIVE' : 'EXTERNAL',
            rawSpecifier: specifier,
            normalizedSpecifier: specifier,
            importedName: p.importedName,
            localName: p.localName,
            startLine: lineNum,
            endLine: lineNum
          });
        });
      }
    });

    return imports;
  }

  async extractExports(filePath, content) {
    const text = content || fs.readFileSync(filePath, 'utf8');
    const lines = text.split('\n');
    const exportsList = [];

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      let match;

      // export default SymbolName
      match = line.match(/export\s+default\s+(?:class|function)?\s*([a-zA-Z0-9_$]+)/);
      if (match) {
        exportsList.push({
          sourceFilePath: filePath,
          exportKind: 'DEFAULT',
          exportedName: 'default',
          localSymbolName: match[1],
          startLine: lineNum,
          endLine: lineNum
        });
        return;
      }

      // export const/let/var SymbolName = ...
      match = line.match(/export\s+(?:const|let|var|class|function)\s+([a-zA-Z0-9_$]+)/);
      if (match) {
        exportsList.push({
          sourceFilePath: filePath,
          exportKind: 'NAMED',
          exportedName: match[1],
          localSymbolName: match[1],
          startLine: lineNum,
          endLine: lineNum
        });
        return;
      }

      // module.exports = { a, b }
      match = line.match(/module\.exports\s*=\s*\{\s*([a-zA-Z0-9_$,\s]+)\s*\}/);
      if (match) {
        const parts = match[1].split(',').map(s => s.trim());
        parts.forEach(part => {
          if (!part) return;
          exportsList.push({
            sourceFilePath: filePath,
            exportKind: 'NAMED',
            exportedName: part,
            localSymbolName: part,
            startLine: lineNum,
            endLine: lineNum
          });
        });
        return;
      }

      // module.exports = SymbolName
      match = line.match(/module\.exports\s*=\s*([a-zA-Z0-9_$]+)/);
      if (match) {
        exportsList.push({
          sourceFilePath: filePath,
          exportKind: 'DEFAULT',
          exportedName: 'default',
          localSymbolName: match[1],
          startLine: lineNum,
          endLine: lineNum
        });
      }
    });

    return exportsList;
  }

  async extractReferences(filePath, content, symbols, imports, scopes) {
    const text = content || fs.readFileSync(filePath, 'utf8');
    const lines = text.split('\n');
    const references = [];

    // Collect candidate identifier names we care about
    const localSymbolNames = symbols.map(s => s.name);
    const importedNames = imports.map(i => i.localName);
    const candidates = Array.from(new Set([...localSymbolNames, ...importedNames]));

    if (candidates.length === 0) return [];

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      // Skip lines that are declarations or imports to avoid self-referencing
      if (
        trimmed.startsWith('import ') ||
        trimmed.startsWith('const ') && trimmed.includes('require(') ||
        trimmed.startsWith('let ') && trimmed.includes('require(') ||
        trimmed.startsWith('var ') && trimmed.includes('require(')
      ) {
        return;
      }

      candidates.forEach(name => {
        // Match name as a word boundary
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        let match;
        while ((match = regex.exec(line)) !== null) {
          // Double check to make sure it's not the declaration of the class/function
          if (
            trimmed.startsWith(`class ${name}`) ||
            trimmed.startsWith(`function ${name}`) ||
            trimmed.startsWith(`export default class ${name}`) ||
            trimmed.startsWith(`export default function ${name}`) ||
            trimmed.startsWith(`export const ${name}`)
          ) {
            continue;
          }

          // Determine reference kind
          const nextChar = line[match.index + name.length];
          const isCall = nextChar === '(' || (nextChar === ' ' && line[match.index + name.length + 1] === '(');
          const kind = isCall ? 'CALL' : 'READ';

          // Find innermost enclosing scope
          let innermostScope = null;
          scopes.forEach(sc => {
            if (sc.startLine <= lineNum && sc.endLine >= lineNum) {
              if (!innermostScope || (sc.endLine - sc.startLine < innermostScope.endLine - innermostScope.startLine)) {
                innermostScope = sc;
              }
            }
          });

          references.push({
            filePath,
            referencedName: name,
            referenceKind: kind,
            startLine: lineNum,
            endLine: lineNum,
            sourceScopeName: innermostScope ? innermostScope.name : 'global'
          });
        }
      });
    });

    return references;
  }

  async extractRelationships(filePath, content, symbols, imports, references) {
    const relationships = [];

    // Extract INHERITS relationships: class A extends B
    const text = content || fs.readFileSync(filePath, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const match = line.match(/class\s+([a-zA-Z0-9_$]+)\s+extends\s+([a-zA-Z0-9_$]+)/);
      if (match) {
        relationships.push({
          sourceSymbolName: match[1],
          relationshipType: 'INHERITS',
          targetSymbolName: match[2],
          startLine: lineNum,
          endLine: lineNum
        });
      }
    });

    // CALL relationships from CALL references
    references.forEach(ref => {
      if (ref.referenceKind === 'CALL') {
        relationships.push({
          sourceSymbolName: ref.sourceSymbolName || ref.sourceScopeName,
          relationshipType: 'CALLS',
          targetSymbolName: ref.referencedName,
          startLine: ref.startLine,
          endLine: ref.endLine
        });
      }
    });

    return relationships;
  }
}

module.exports = JavaScriptIntelligenceAdapter;
