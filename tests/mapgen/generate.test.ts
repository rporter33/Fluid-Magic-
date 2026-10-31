// End-to-end map generation: the Phase 1 tests from docs/10-milestone-1.md (connectivity,
// capital distance, province count, neighbors, springs coverage) and acceptance criterion 3,
// checked with helpers independent of src/mapgen (playable.ts), plus determinism.
import { describe, expect, it, vi } from 'vitest';
import * as voronoi from '../../src/mapgen/voronoi';
import { MAPGEN, type MapSizeId } from '../../src/content/mapgen';
import { generateMap } from '../../src/mapgen/generate';
import type { CapitalSpec, MapData, MapGenParams } from '../../src/mapgen/types';
import { DEEPMOSS, KHARNATH, hopsFrom, indexAdjacency, indexOf } from './fixtures';
import { patched } from '../content/patched';
import { expectPlayable } from './playable';

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

  // The Medium sweep with 4 nations ("medium with 3") takes 2.3 to 2.9 s alone and has timed
  // out at vitest's 5 s default in loaded full runs: 12 s is about 4x its time alone (QA sweep H1).
  it.each(cases)(
    '%s with %#: playable across seeds',
    (size, capitals) => {
      for (let seed = 1; seed <= 5; seed++) {
        const params = { seed, size, capitals };
        expectPlayable(generateMap(params), params);
      }
    },
    12_000,
  );

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

describe('a shortfall', () => {
  it('fails the attempt with its reason, and the map with the last reasons, never spinning', () => {
    // With no draw allowed, no site finds a point inside the outline: every attempt runs short.
    const attempts = vi.spyOn(voronoi, 'poissonDisc');
    try {
      patched(MAPGEN as { pointTries: number }, 'pointTries', 0, () => {
        expect(() => generateMap(medium(1))).toThrow(
          'no valid map for seed 1: 60 of 60 sites found no point inside the outline',
        );
        // A shortfall exhausts exactly the documented attempt cap, regardless of scheduling.
        expect(attempts).toHaveBeenCalledTimes(MAPGEN.maxAttempts);
      });
    } finally {
      attempts.mockRestore();
    }
    expect(generateMap(medium(1))).toEqual(MAPS[0]);
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
