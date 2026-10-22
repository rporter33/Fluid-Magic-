// The rules and the AI read adjacency only through MapProvince.neighbors (Phase 1b; war-table
// design 1.7): a wild is never a neighbor, so nothing reaches across one as long as no code in
// src/sim or src/ai measures the map's geometry or walks its wilds. A source scan, like
// purity.test.ts; the saves' migration may give an old map its empty wilds.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const DIRS = ['src/sim', 'src/ai'];

const FORBIDDEN: readonly [RegExp, string][] = [
  [/\.\s*(polygon|site|center|outline|cells)\b|\b(polygon|outline)\b/, 'map geometry'],
  [/\bmap\s*\.\s*(wilds|width|height)\b/, 'map wilds or size'],
  [/\bmapgen\/(geometry|voronoi|wilds|graph)\b/, 'a mapgen geometry or graph module'],
];

/** Files allowed one reach into the map: the migration that adds an old map's wilds. */
const ALLOWED: Readonly<Record<string, string>> = { 'src/sim/migrate.ts': 'map wilds or size' };

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.ts$/.test(name) ? [path] : [];
  });
}

function reaches(file: string, source: string): string[] {
  const code = stripComments(source);
  return FORBIDDEN.filter(([pattern, name]) => pattern.test(code) && ALLOWED[file] !== name).map(
    ([, name]) => name,
  );
}

describe('adjacency only through neighbors', () => {
  const files = DIRS.flatMap((d) => sourceFiles(join(ROOT, d))).map((f) => relative(ROOT, f));

  it('finds the sim and AI sources', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('reads no map geometry and no wilds in any of them', () => {
    const found = files.flatMap((file) =>
      reaches(file, readFileSync(join(ROOT, file), 'utf8')).map((name) => `${file}: ${name}`),
    );
    expect(found).toEqual([]);
  });

  it('flags geometry, wilds and the geometry modules, but not comments', () => {
    const f = 'src/ai/example.ts';
    expect(reaches(f, 'const c = getMapProvince(state, p).center;')).toEqual(['map geometry']);
    expect(reaches(f, 'const { polygon } = mp;')).toEqual(['map geometry']);
    expect(reaches(f, 'for (const w of state.map.wilds) {}')).toEqual(['map wilds or size']);
    expect(reaches(f, "import { distance } from '../mapgen/geometry';")).toEqual([
      'a mapgen geometry or graph module',
    ]);
    expect(reaches(f, '// the polygon and map.wilds are drawn by render')).toEqual([]);
    expect(reaches(f, 'const n = getMapProvince(state, p).neighbors;')).toEqual([]);
    expect(reaches('src/sim/migrate.ts', 'map.wilds ??= [];')).toEqual([]);
  });
});
