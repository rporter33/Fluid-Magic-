// End-to-end map generation: the Phase 1 tests from docs/10-milestone-1.md (connectivity,
// capital distance, province count, neighbors, springs coverage) plus determinism.
import { describe, expect, it } from 'vitest';
import { COLORS } from '../../src/content/colors';
import { MAPGEN, type MapSizeId } from '../../src/content/mapgen';
import { generateMap } from '../../src/mapgen/generate';
import { insideConvex } from '../../src/mapgen/geometry';
import { provinceCount } from '../../src/mapgen/size';
import type { CapitalSpec, MapData, MapGenParams } from '../../src/mapgen/types';
import { validateMap } from '../../src/mapgen/validate';
import { DEEPMOSS, KHARNATH, hops, indexAdjacency, indexOf } from './fixtures';

const medium = (seed: number): MapGenParams => ({
  seed,
  size: 'medium',
  capitals: [KHARNATH, DEEPMOSS],
});

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);
const MAPS = SEEDS.map((seed) => generateMap(medium(seed)));

describe.each(SEEDS.map((seed, i) => [seed, MAPS[i]!] as const))(
  'medium map, seed %i',
  (_, map) => {
    const adj = indexAdjacency(map);
    const provinces = Object.values(map.provinces);

    it('has 60 provinces (within 5%)', () => {
      expect(Math.abs(provinces.length - 60)).toBeLessThanOrEqual(3);
      expect(provinces).toHaveLength(60);
    });

    it('is connected', () => {
      for (let i = 1; i < adj.length; i++) expect(hops(adj, 0, i)).toBeLessThan(Infinity);
    });

    it('gives every province at least 2 neighbors', () => {
      for (const p of provinces) expect(p.neighbors.length).toBeGreaterThanOrEqual(2);
    });

    it('places capitals at least 6 apart', () => {
      const [a, b] = map.capitals.map((id) => indexOf(map, id));
      expect(hops(adj, a!, b!)).toBeGreaterThanOrEqual(6);
    });

    it('places 3 Wellsprings at least 3 from every capital', () => {
      expect(map.wellsprings).toHaveLength(3);
      for (const w of map.wellsprings) {
        for (const c of map.capitals) {
          expect(hops(adj, indexOf(map, w), indexOf(map, c))).toBeGreaterThanOrEqual(3);
        }
        expect(map.provinces[w]!.independentStrength).toBe(30);
      }
    });

    it("shows every color's springs at least twice outside the capitals", () => {
      const springs = provinces
        .filter((p) => p.capitalSlot === undefined)
        .flatMap((p) => p.springs);
      for (const color of COLORS) {
        expect(springs.filter((c) => c === color).length).toBeGreaterThanOrEqual(2);
      }
    });

    it('builds capitals from their specs', () => {
      const [kharnath, deepmoss] = map.capitals.map((id) => map.provinces[id]);
      expect(kharnath).toMatchObject({ name: 'Kharnath', terrain: 'plains', capitalSlot: 0 });
      expect(deepmoss).toMatchObject({ name: 'Deepmoss', terrain: 'forest', capitalSlot: 1 });
      expect(kharnath!.springs).toEqual(['R', 'R', 'R', 'R']);
      expect(deepmoss!.springs).toEqual(['G', 'G', 'G', 'G']);
    });

    it('keeps geometry inside the map outline', () => {
      const grown = map.outline.map((p) => ({
        x: (p.x - map.width / 2) * 1.001 + map.width / 2,
        y: (p.y - map.height / 2) * 1.001 + map.height / 2,
      }));
      for (const p of provinces) {
        expect(insideConvex(grown, p.center)).toBe(true);
        for (const v of p.polygon) expect(insideConvex(grown, v)).toBe(true);
      }
    });

    it('passes the full validator', () => {
      expect(validateMap(map, medium(map.seed))).toEqual([]);
    });
  },
);

describe('other sizes and nation counts', () => {
  const R2: CapitalSpec = { ...KHARNATH };
  const G2: CapitalSpec = { ...DEEPMOSS };
  const cases: [MapSizeId, CapitalSpec[]][] = [
    ['small', [KHARNATH, DEEPMOSS]],
    ['large', [KHARNATH, DEEPMOSS]],
    ['medium', [KHARNATH, DEEPMOSS, R2]],
    ['medium', [KHARNATH, DEEPMOSS, R2, G2]],
    ['small', [KHARNATH, DEEPMOSS, R2, G2]],
  ];

  it.each(cases)('%s with %#: valid across seeds', (size, capitals) => {
    for (let seed = 1; seed <= 5; seed++) {
      const params = { seed, size, capitals };
      const map = generateMap(params);
      expect(Object.keys(map.provinces)).toHaveLength(provinceCount(size, capitals.length));
      expect(map.wellsprings).toHaveLength(capitals.length === 2 ? 3 : 5);
      expect(validateMap(map, params)).toEqual([]);
    }
  });

  it('scales province count with nations', () => {
    expect(provinceCount('medium', 2)).toBe(60);
    expect(provinceCount('medium', 3)).toBe(85);
    expect(provinceCount('small', 4)).toBe(90);
  });

  it('numbers repeated capital names', () => {
    const map = generateMap({ seed: 3, size: 'medium', capitals: [KHARNATH, KHARNATH] });
    expect(map.capitals.map((id) => map.provinces[id]!.name)).toEqual(['Kharnath', 'Kharnath II']);
  });
});

describe('determinism', () => {
  it('the same params give the same map', () => {
    expect(generateMap(medium(42))).toEqual(generateMap(medium(42)));
  });

  it('different seeds give different maps', () => {
    const a = generateMap(medium(1));
    const b = generateMap(medium(2));
    expect(a.provinces).not.toEqual(b.provinces);
  });

  it('survives a JSON round trip unchanged', () => {
    const map = generateMap(medium(7));
    expect(JSON.parse(JSON.stringify(map)) as MapData).toEqual(map);
  });

  it('stores ids in order with neighbor lists sorted', () => {
    const map = MAPS[0]!;
    Object.values(map.provinces).forEach((p, i) => {
      expect(p.id).toBe(`p${i}`);
      const order = p.neighbors.map((n) => Number(n.slice(1)));
      expect([...order].sort((x, y) => x - y)).toEqual(order);
    });
  });
});

describe('parameters', () => {
  it('rejects bad nation counts, sizes, seeds, and specs', () => {
    expect(() => generateMap({ ...medium(1), capitals: [KHARNATH] })).toThrow(RangeError);
    expect(() =>
      generateMap({ ...medium(1), capitals: [KHARNATH, KHARNATH, KHARNATH, KHARNATH, KHARNATH] }),
    ).toThrow(RangeError);
    expect(() => generateMap({ ...medium(1), size: 'huge' as MapSizeId })).toThrow(RangeError);
    expect(() => generateMap({ ...medium(1), size: 'toString' as MapSizeId })).toThrow(RangeError);
    expect(() => generateMap({ ...medium(Number.NaN) })).toThrow(RangeError);
    expect(() =>
      generateMap({ ...medium(1), capitals: [KHARNATH, { ...DEEPMOSS, name: '' }] }),
    ).toThrow(RangeError);
  });
});

describe('validateMap', () => {
  const params = medium(5);
  const fresh = () => structuredClone(generateMap(params));

  it('catches a one-way neighbor', () => {
    const map = fresh();
    const p = Object.values(map.provinces)[10]!;
    const n = p.neighbors[0]!;
    map.provinces[n]!.neighbors = map.provinces[n]!.neighbors.filter((x) => x !== p.id);
    expect(validateMap(map, params).join()).toMatch(/one-way/);
  });

  it('catches a Wellspring next to a capital', () => {
    const map = fresh();
    const capital = map.provinces[map.capitals[0]!]!;
    const near = map.provinces[capital.neighbors[0]!]!;
    near.wellspring = { axis: 'order', step: 1 };
    near.independentStrength = MAPGEN.wellspringStrength;
    near.springs = [];
    map.wellsprings[0] = near.id;
    expect(validateMap(map, params).join()).toMatch(/from a capital/);
  });

  it('catches missing spring colors and duplicate names', () => {
    const map = fresh();
    for (const p of Object.values(map.provinces)) {
      if (p.capitalSlot === undefined) p.springs = p.springs.filter((c) => c !== 'U');
    }
    const [a, b] = Object.values(map.provinces);
    b!.name = a!.name;
    const problems = validateMap(map, params).join();
    expect(problems).toMatch(/U springs/);
    expect(problems).toMatch(/names repeat/);
  });
});
