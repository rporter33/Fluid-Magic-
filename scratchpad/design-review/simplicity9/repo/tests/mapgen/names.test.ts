import { describe, expect, it } from 'vitest';
import { NAME_SYLLABLES } from '../../src/content/names';
import { TERRAIN_IDS, type TerrainId } from '../../src/content/terrain';
import { nameProvinces, numbered, provinceName } from '../../src/mapgen/names';
import { createRng } from '../../src/sim/rng';

describe('provinceName', () => {
  it('builds a capitalized name ending in a suffix of its terrain', () => {
    const rng = createRng(1);
    for (const terrain of TERRAIN_IDS) {
      for (let k = 0; k < 20; k++) {
        const name = provinceName(rng, terrain);
        expect(name).toMatch(/^[A-Z][a-z]+$/);
        expect(NAME_SYLLABLES[terrain].suffixes.some((s) => name.endsWith(s))).toBe(true);
      }
    }
  });
});

describe('numbered', () => {
  it('adds numerals until the name is free', () => {
    expect(numbered('Kharnath', new Set())).toBe('Kharnath');
    expect(numbered('Kharnath', new Set(['Kharnath']))).toBe('Kharnath II');
    expect(numbered('Kharnath', new Set(['Kharnath', 'Kharnath II']))).toBe('Kharnath III');
    const taken = new Set([
      'A',
      ...['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map((n) => `A ${n}`),
    ]);
    expect(numbered('A', taken)).toBe('A 11');
  });
});

describe('nameProvinces', () => {
  const terrains: TerrainId[] = Array.from({ length: 120 }, (_, i) => TERRAIN_IDS[i % 7]!);

  it('gives every province a unique name and keeps fixed names in order', () => {
    const names = nameProvinces(createRng(2), terrains, [
      [5, 'Kharnath'],
      [40, 'Kharnath'],
      [80, 'Deepmoss'],
    ]);
    expect(new Set(names).size).toBe(terrains.length);
    expect(names[5]).toBe('Kharnath');
    expect(names[40]).toBe('Kharnath II');
    expect(names[80]).toBe('Deepmoss');
    expect(names.every((n) => n.length > 0)).toBe(true);
  });

  it('stays unique when one terrain has more provinces than plain combinations', () => {
    const swamp: TerrainId[] = new Array<TerrainId>(400).fill('swamp');
    const names = nameProvinces(createRng(3), swamp, []);
    expect(new Set(names).size).toBe(400);
  });

  it('is deterministic per rng state', () => {
    expect(nameProvinces(createRng(4), terrains, [])).toEqual(
      nameProvinces(createRng(4), terrains, []),
    );
  });
});
