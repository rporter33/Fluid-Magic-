// End-to-end map generation: the Phase 1 tests from docs/10-milestone-1.md (connectivity,
// capital distance, province count, neighbors, springs coverage) and acceptance criterion 3,
// checked with helpers independent of src/mapgen, plus determinism.
import { describe, expect, it } from 'vitest';
import { COLORS } from '../../src/content/colors';
import { MAPGEN, TERRAIN_SHARES, type MapSizeId } from '../../src/content/mapgen';
import { SCALE_AXES } from '../../src/content/pretenders/scales';
import { TERRAIN_IDS } from '../../src/content/terrain';
import { generateMap } from '../../src/mapgen/generate';
import { insideConvex } from '../../src/mapgen/geometry';
import { provinceCount } from '../../src/mapgen/size';
import { apportion } from '../../src/mapgen/terrain';
import type { CapitalSpec, MapData, MapGenParams } from '../../src/mapgen/types';
import { validateMap } from '../../src/mapgen/validate';
import { DEEPMOSS, KHARNATH, hopsFrom, indexAdjacency, indexOf, touchingLength } from './fixtures';

const medium = (seed: number): MapGenParams => ({
  seed,
  size: 'medium',
  capitals: [KHARNATH, DEEPMOSS],
});

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);
const MAPS = SEEDS.map((seed) => generateMap(medium(seed)));

/** Every rule a playable map must satisfy, checked without src/mapgen's own helpers. */
function expectPlayable(map: MapData, params: MapGenParams): void {
  const provinces = Object.values(map.provinces);
  const adj = indexAdjacency(map);
  const n = provinceCount(params.size, params.capitals.length);
  const capitals = map.capitals.map((id) => indexOf(map, id));
  const wells = map.wellsprings.map((id) => indexOf(map, id));

  // Size, connectivity, neighbors.
  expect(provinces).toHaveLength(n);
  expect(hopsFrom(adj, 0).every(Number.isFinite)).toBe(true);
  provinces.forEach((p, i) => {
    expect(p.neighbors.length).toBeGreaterThanOrEqual(MAPGEN.minNeighbors);
    for (const j of adj[i]!) expect(adj[j]).toContain(i);
  });

  // Capitals: spaced, built from their specs in slot order.
  expect(capitals).toHaveLength(params.capitals.length);
  for (const a of capitals) {
    const dist = hopsFrom(adj, a);
    for (const b of capitals) if (a !== b) expect(dist[b]).toBeGreaterThanOrEqual(6);
  }
  map.capitals.forEach((id, slot) => {
    const p = map.provinces[id]!;
    const spec = params.capitals[slot]!;
    expect(p.capitalSlot).toBe(slot);
    expect(p.terrain).toBe(spec.terrain);
    expect(p.name.startsWith(spec.name)).toBe(true);
    expect(p.springs).toEqual(new Array(MAPGEN.capitalSprings).fill(spec.color));
    expect(p.startPop).toBe(MAPGEN.capitalPop);
  });

  // Wellsprings: counted, far from capitals, never adjacent, guarded, distinct axes.
  expect(wells).toHaveLength(params.capitals.length <= 2 ? 3 : 5);
  for (const w of wells) {
    const dist = hopsFrom(adj, w);
    for (const c of capitals) expect(dist[c]).toBeGreaterThanOrEqual(3);
    for (const v of wells) if (v !== w) expect(dist[v]).toBeGreaterThanOrEqual(2);
    expect(provinces[w]!.independentStrength).toBe(30);
    expect(provinces[w]!.springs).toEqual([]);
  }
  const steps = wells.map((w) => provinces[w]!.wellspring!);
  expect(new Set(steps.map((s) => s.axis)).size).toBe(Math.min(steps.length, SCALE_AXES.length));
  for (const s of steps) expect([1, -1]).toContain(s.step);

  // Springs: every color at least twice outside capitals, and evenly dealt.
  const springs = provinces.filter((p) => p.capitalSlot === undefined).flatMap((p) => p.springs);
  const perColor = COLORS.map((c) => springs.filter((x) => x === c).length);
  expect(Math.min(...perColor)).toBeGreaterThanOrEqual(2);
  expect(Math.max(...perColor) - Math.min(...perColor)).toBeLessThanOrEqual(1);

  // Terrain shares are exact, capitals included.
  const want = apportion(TERRAIN_SHARES, n);
  for (const t of TERRAIN_IDS) {
    expect(provinces.filter((p) => p.terrain === t)).toHaveLength(want[t]);
  }

  // Geometry: no zero-length edges, inside the outline, and the drawn borders are the graph.
  const grown = map.outline.map((p) => ({
    x: (p.x - map.width / 2) * 1.0001 + map.width / 2,
    y: (p.y - map.height / 2) * 1.0001 + map.height / 2,
  }));
  provinces.forEach((p, i) => {
    p.polygon.forEach((v, k) => {
      const next = p.polygon[(k + 1) % p.polygon.length]!;
      expect(v.x !== next.x || v.y !== next.y).toBe(true);
      expect(insideConvex(grown, v)).toBe(true);
    });
    for (let j = i + 1; j < provinces.length; j++) {
      const border = touchingLength(p.polygon, provinces[j]!.polygon);
      if (adj[i]!.includes(j)) expect(border).toBeGreaterThan(0);
      else expect(border).toBeLessThan(0.1);
    }
  });

  expect(validateMap(map, params)).toEqual([]);
}

describe.each(SEEDS.map((seed, i) => [seed, MAPS[i]!] as const))(
  'medium map, seed %i',
  (_, map) => {
    it('has 60 provinces (within 5%)', () => {
      expect(Math.abs(Object.keys(map.provinces).length - 60)).toBeLessThanOrEqual(3);
    });

    it('is playable', () => {
      expectPlayable(map, medium(map.seed));
    });

    it('keeps Wellsprings at least 3 apart', () => {
      const adj = indexAdjacency(map);
      const wells = map.wellsprings.map((id) => indexOf(map, id));
      for (const w of wells) {
        const dist = hopsFrom(adj, w);
        for (const v of wells) if (v !== w) expect(dist[v]).toBeGreaterThanOrEqual(3);
      }
    });
  },
);

/** Richest over poorest starting population within 2 hops of each capital. */
function ringRatio(map: MapData): number {
  const adj = indexAdjacency(map);
  const pops = Object.values(map.provinces).map((p) => p.startPop);
  const rings = map.capitals.map((id) => {
    const c = indexOf(map, id);
    const dist = hopsFrom(adj, c);
    return pops.reduce((s, pop, i) => (i !== c && dist[i]! <= 2 ? s + pop : s), 0);
  });
  return Math.max(...rings) / Math.min(...rings);
}

describe('across medium maps', () => {
  it('balances capital neighborhoods on nearly every map', () => {
    // A map outside the ratio is only taken when several valid maps all miss it.
    const balanced = MAPS.filter((m) => ringRatio(m) <= MAPGEN.capitalBalanceRatio).length;
    expect(balanced).toBeGreaterThanOrEqual(18);
  });

  it('clusters terrain more than chance', () => {
    // Random assignment would give about sum(share^2) = 0.17 same-terrain neighbor pairs.
    let same = 0;
    let total = 0;
    for (const map of MAPS) {
      for (const p of Object.values(map.provinces)) {
        for (const n of p.neighbors) {
          total++;
          if (map.provinces[n]!.terrain === p.terrain) same++;
        }
      }
    }
    expect(same / total).toBeGreaterThan(0.22);
  });

  it('varies Wellspring axes and poles between maps', () => {
    const steps = MAPS.flatMap((m) => m.wellsprings.map((w) => m.provinces[w]!.wellspring!));
    expect(new Set(steps.map((s) => s.step))).toEqual(new Set([1, -1]));
    const axisSets = MAPS.map((m) =>
      m.wellsprings
        .map((w) => m.provinces[w]!.wellspring!.axis)
        .sort()
        .join(),
    );
    expect(new Set(axisSets).size).toBeGreaterThan(1);
  });

  it('gives each nation slot both ends of the map over many seeds', () => {
    const kharnathLeft = MAPS.filter((m) => {
      const [k, d] = m.capitals.map((id) => m.provinces[id]!.center.x);
      return k! < d!;
    }).length;
    expect(kharnathLeft).toBeGreaterThan(3);
    expect(kharnathLeft).toBeLessThan(17);
  });
});

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

  it.each(cases)('%s with %#: playable across seeds', (size, capitals) => {
    for (let seed = 1; seed <= 5; seed++) {
      const params = { seed, size, capitals };
      expectPlayable(generateMap(params), params);
    }
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
    expect(MAPS[0]!.provinces).not.toEqual(MAPS[1]!.provinces);
  });

  it('survives a JSON round trip unchanged', () => {
    const map = MAPS[6]!;
    expect(JSON.parse(JSON.stringify(map)) as MapData).toEqual(map);
  });

  it('stores ids in order with neighbor lists sorted', () => {
    Object.values(MAPS[0]!.provinces).forEach((p, i) => {
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
    expect(() => generateMap(medium(Number.NaN))).toThrow(RangeError);
    expect(() =>
      generateMap({ ...medium(1), capitals: [KHARNATH, { ...DEEPMOSS, name: '' }] }),
    ).toThrow(RangeError);
  });
});
