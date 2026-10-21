// Guards the CLAUDE.md non-negotiables with a source scan: sim, mapgen, and content never
// touch host randomness or time and never import rendering or UI code. ESLint enforces the
// same rules in the editor; this test makes them part of `npm test`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const PURE_DIRS = ['src/sim', 'src/mapgen', 'src/content', 'src/ai'];
const FORBIDDEN_DIRS = ['src/render', 'src/ui'].map((d) => join(ROOT, d));
const FORBIDDEN_PACKAGES = ['react', 'react-dom', 'pixi.js', 'zustand', 'idb-keyval'];

const FORBIDDEN_CODE: readonly [RegExp, string][] = [
  [/\bMath\s*\.\s*random\b/, 'Math.random'],
  [/\bnew\s+Date\b|\bDate\s*\.\s*\w+|\bDate\s*\(/, 'Date'],
  [/\bperformance\s*\.\s*now\b/, 'performance.now'],
  [/\bcrypto\s*\./, 'crypto'],
];

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function importSpecifiers(source: string): string[] {
  const specs: string[] = [];
  const patterns = [
    /\b(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) if (match[1]) specs.push(match[1]);
  }
  return specs;
}

/** Returns the rule violations found in one file's source. */
function violations(file: string, source: string): string[] {
  const code = stripComments(source);
  const found: string[] = [];
  for (const [pattern, name] of FORBIDDEN_CODE) if (pattern.test(code)) found.push(name);
  for (const spec of importSpecifiers(code)) {
    const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
    if (pkg !== undefined && FORBIDDEN_PACKAGES.includes(pkg)) found.push(`import ${spec}`);
    if (spec.startsWith('.')) {
      const target = resolve(dirname(file), spec);
      if (FORBIDDEN_DIRS.some((d) => target === d || target.startsWith(d + sep))) {
        found.push(`import ${spec}`);
      }
    }
  }
  return found;
}

function sourceFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|js|mjs)$/.test(name) ? [path] : [];
  });
}

describe('pure modules', () => {
  const files = PURE_DIRS.flatMap((d) => sourceFiles(join(ROOT, d)));

  it('finds the pure source files', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [relative(ROOT, f), f]))('%s is deterministic and host-free', (_, f) => {
    expect(violations(f, readFileSync(f, 'utf8'))).toEqual([]);
  });
});

describe('purity scanner', () => {
  const file = join(ROOT, 'src/sim/example.ts');

  it('flags host randomness and time', () => {
    expect(violations(file, 'const x = Math.random();')).toEqual(['Math.random']);
    expect(violations(file, 'const t = Date.now();')).toEqual(['Date']);
    expect(violations(file, 'const t = new Date();')).toEqual(['Date']);
    expect(violations(file, 'performance.now()')).toEqual(['performance.now']);
    expect(violations(file, 'crypto.getRandomValues(buf)')).toEqual(['crypto']);
  });

  it('flags render, ui, and framework imports', () => {
    expect(violations(file, "import { Application } from 'pixi.js';")).toEqual(['import pixi.js']);
    expect(violations(file, "import React from 'react';")).toEqual(['import react']);
    expect(violations(file, "import { x } from '../render/MapRenderer';")).toEqual([
      'import ../render/MapRenderer',
    ]);
    expect(violations(file, "export { y } from '../ui/store';")).toEqual(['import ../ui/store']);
    expect(violations(file, "const m = import('../ui');")).toEqual(['import ../ui']);
  });

  it('ignores comments and allowed imports', () => {
    expect(violations(file, '// never call Math.random or new Date() here')).toEqual([]);
    expect(violations(file, "import { Delaunay } from 'd3-delaunay';")).toEqual([]);
    expect(violations(file, "import { drn } from './drn';")).toEqual([]);
    expect(violations(file, "import type { Color } from '../content/colors';")).toEqual([]);
    expect(violations(file, 'const day = state.day; // Date is state.day')).toEqual([]);
  });
});
