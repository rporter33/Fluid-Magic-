// placeWilds called directly (Phase 1b; war-table design 1.4, step 5), with no validateMap behind
// it: generateMap throws away any attempt validateMap rejects and tries again, so the map sweeps
// only ever see placements that passed and cannot catch a broken guard. Each case here pins one
// rule on a small hand-built graph (scores, ties, order, the guards, the fallback to the next
// neighbor and to the next seed, WILDS.seedTries); the last checks every guard by plain BFS on
// real province graphs.
import { describe, expect, it } from 'vitest';
import { MAPGEN, WILDS } from '../../src/content/mapgen';
import { generateMap } from '../../src/mapgen/generate';
import { placeWilds, planWilds, type WildPlan } from '../../src/mapgen/wilds';
import { createRng, nextFloat } from '../../src/sim/rng';
import {
  FOUR_CAPITALS,
  TWO_CAPITALS,
  gridGraph,
  hopsFrom,
  indexAdjacency,
  indexOf,
} from './fixtures';
import { interiorProvinces } from './wildChecks';

/** WildTerrain with arrays a test may change. */
interface Terrain {
  adjacency: number[][];
  capitals: number[];
  interior: boolean[];
  elevation: number[];
  moisture: number[];
}

const PEAKS_1: WildPlan = { kind: 'peaks', cells: 1 };
const PEAKS_2: WildPlan = { kind: 'peaks', cells: 2 };
const MERE_1: WildPlan = { kind: 'mere', cells: 1 };

/** Cell (x, y) of a grid `w` wide. */
const at = (x: number, y: number, w = 9) => y * w + x;

function link(adjacency: number[][], a: number, b: number): void {
  adjacency[a]!.push(b);
  adjacency[b]!.push(a);
}

function unlink(adjacency: number[][], a: number, b: number): void {
  adjacency[a] = adjacency[a]!.filter((n) => n !== b);
  adjacency[b] = adjacency[b]!.filter((n) => n !== a);
}

/** A 9 x 9 grid: interior off the border, capitals at two corners, elevation rising east. */
function grid(): Terrain {
  const adjacency = gridGraph(9, 9);
  const xy = (i: number) => [i % 9, Math.floor(i / 9)] as const;
  return {
    adjacency,
    capitals: [0, 80],
    interior: adjacency.map((_, i) => {
      const [x, y] = xy(i);
      return x > 0 && y > 0 && x < 8 && y < 8;
    }),
    elevation: adjacency.map((_, i) => xy(i)[0] + xy(i)[1] / 100),
    moisture: adjacency.map((_, i) => 10 - xy(i)[0]),
  };
}

/** Every guard of design 1.4, step 5, checked by plain BFS on the graph that remains. */
function guardProblems(
  terrain: Terrain,
  plan: readonly WildPlan[],
  ranges: readonly number[][],
): string[] {
  const out: string[] = [];
  const { adjacency } = terrain;
  const wild = new Set(ranges.flat());
  const left = adjacency.map((list, i) => (wild.has(i) ? [] : list.filter((n) => !wild.has(n))));
  const cells = adjacency.flatMap((_, i) => (wild.has(i) ? [] : [i]));
  for (const c of cells) if (left[c]!.length < MAPGEN.minNeighbors) out.push(`cell ${c} has few`);
  for (const cut of [-1, ...cells]) {
    const rest = cells.filter((c) => c !== cut);
    const seen = new Set([rest[0]!]);
    for (const c of seen) for (const n of left[c]!) if (n !== cut) seen.add(n);
    if (seen.size !== rest.length) out.push(cut < 0 ? 'disconnected' : `cut cell ${cut}`);
  }
  ranges.forEach((range, r) => {
    if (range.length !== plan[r]!.cells) out.push(`range ${r} has ${range.length} cells`);
    for (const c of range) {
      if (terrain.interior[c] !== true) out.push(`range ${r} cell ${c} is on the edge`);
      const dist = hopsFrom(adjacency, c);
      for (const cap of terrain.capitals) {
        if (dist[cap]! < WILDS.minCapitalCells) out.push(`range ${r} is near capital ${cap}`);
      }
      ranges.forEach((other, o) => {
        for (const x of o === r ? [] : other) {
          if (dist[x]! < WILDS.separation) out.push(`ranges ${r} and ${o} are close`);
        }
      });
    }
    const bordering = new Set(range.flatMap((c) => adjacency[c]!.filter((n) => !wild.has(n))));
    for (const a of bordering) {
      const dist = hopsFrom(left, a);
      for (const b of bordering) {
        if (dist[b]! > WILDS.maxDetour) out.push(`range ${r} way around ${dist[b]}`);
      }
    }
  });
  return out;
}

describe('placeWilds', () => {
  it('seeds a peak range at the highest eligible cell and grows it uphill', () => {
    const terrain = grid();
    const [range] = placeWilds([PEAKS_2], terrain)!;
    // Column 8 is the map's edge and (7, 7) is 2 hops from the capital at (8, 8).
    expect(range).toEqual([at(7, 6), at(7, 5)]);
  });

  it('places meres by wetness and keeps ranges apart and away from capitals', () => {
    const terrain = grid();
    const ranges = placeWilds([PEAKS_1, { kind: 'mere', cells: 2 }], terrain)!;
    expect(ranges.map((r) => r.length)).toEqual([1, 2]);
    const [peak, mere] = ranges as [number[], number[]];
    // The mere sits in the wet west.
    for (const c of mere) expect(c % 9).toBeLessThanOrEqual(2);
    const fromCapitals = hopsFrom(terrain.adjacency, 0).map((d, i) =>
      Math.min(d, hopsFrom(terrain.adjacency, 80)[i]!),
    );
    for (const c of [...peak, ...mere]) {
      expect(fromCapitals[c]).toBeGreaterThanOrEqual(WILDS.minCapitalCells);
      expect(terrain.interior[c]).toBe(true);
    }
    const fromPeak = hopsFrom(terrain.adjacency, peak[0]!);
    for (const c of mere) expect(fromPeak[c]).toBeGreaterThanOrEqual(WILDS.separation);
  });

  it('scores a mere by moisture minus elevation, not by moisture alone', () => {
    const terrain = grid();
    // The wettest cells are high in the east; moisture minus elevation is best low in the west.
    terrain.elevation = terrain.adjacency.map((_, i) => i % 9);
    terrain.moisture = terrain.adjacency.map((_, i) => 0.5 * (i % 9) + 0.01 * Math.floor(i / 9));
    expect(placeWilds([MERE_1], terrain)).toEqual([[at(1, 7)]]);
  });

  it('breaks score ties toward the lower cell index', () => {
    const terrain = grid();
    terrain.elevation = terrain.adjacency.map(() => 0);
    // (1, 1) is 2 hops from the capital at (0, 0); (2, 1) is the first eligible cell.
    expect(placeWilds([PEAKS_1], terrain)).toEqual([[at(2, 1)]]);
  });

  it('places peaks before meres whatever the plan order, and answers in plan order', () => {
    const terrain = grid();
    // Moisture is three times elevation, so the mere wants the very cell the peaks want.
    terrain.moisture = terrain.elevation.map((e) => 3 * e);
    expect(placeWilds([MERE_1, PEAKS_1], terrain)).toEqual([[at(7, 3)], [at(7, 6)]]);
  });
});

describe('placeWilds guards', () => {
  it('fails when a range finds no room: no interior cell, or every removal cuts the map', () => {
    const terrain = grid();
    expect(placeWilds([PEAKS_1], { ...terrain, interior: [] })).toBeNull();
    // On a ring, taking any cell leaves its two neighbors with one neighbor each.
    const ring = Array.from({ length: 12 }, (_, i) => [(i + 11) % 12, (i + 1) % 12]);
    expect(placeWilds([PEAKS_1], { ...terrain, adjacency: ring, capitals: [] })).toBeNull();
    // Two grids joined through one cell already have a cut vertex, which no wild may leave.
    const a = gridGraph(4, 4);
    const b = gridGraph(4, 4).map((list) => list.map((n) => n + 16));
    const dumbbell = [...a, ...b, [3, 16]];
    dumbbell[3]!.push(32);
    dumbbell[16]!.push(32);
    expect(placeWilds([PEAKS_1], { ...terrain, adjacency: dumbbell, capitals: [] })).toBeNull();
  });

  it('refuses every cell of a graph that is already in two parts', () => {
    // generateMap only places wilds on a connected graph; the guard keeps the contract anyway.
    const a = gridGraph(5, 5);
    const adjacency = [...a, ...a.map((list) => list.map((n) => n + 25))];
    const terrain: Terrain = {
      adjacency,
      capitals: [],
      interior: adjacency.map(() => true),
      elevation: adjacency.map((_, i) => i),
      moisture: adjacency.map(() => 0),
    };
    expect(placeWilds([PEAKS_1], terrain)).toBeNull();
  });

  it('leaves the rest of the grid connected, two neighbors each, with no cut cell', () => {
    const terrain = grid();
    const plan: WildPlan[] = [
      { kind: 'peaks', cells: 3 },
      { kind: 'mere', cells: 2 },
    ];
    const ranges = placeWilds(plan, terrain)!;
    expect(new Set(ranges.flat()).size).toBe(5);
    expect(guardProblems(terrain, plan, ranges)).toEqual([]);
  });

  it('refuses a later range that would stretch an earlier range past WILDS.maxDetour', () => {
    // A (0) has neighbors b1 (1) and b2 (2). The short way around A is b1 c1 c2 c3 b2 (1, 3, 4,
    // 5, 2); the other two, b1 c1 f1-f4 c3 b2 and b1 d1-d6 b2, are both 7 steps.
    const edges = [
      [0, 1],
      [0, 2],
      [1, 3],
      [3, 4],
      [4, 5],
      [5, 2],
      [3, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 5],
      [1, 10],
      [10, 11],
      [11, 12],
      [12, 13],
      [13, 14],
      [14, 15],
      [15, 2],
    ] as const;
    const adjacency: number[][] = Array.from({ length: 16 }, () => []);
    for (const [a, b] of edges) link(adjacency, a, b);
    const terrain: Terrain = {
      adjacency,
      capitals: [],
      interior: adjacency.map(() => true),
      elevation: adjacency.map((_, i) => (i === 0 ? 10 : i === 4 ? 9 : 0)),
      moisture: adjacency.map(() => 0),
    };
    expect(WILDS.maxDetour).toBe(6);
    expect(placeWilds([PEAKS_1], terrain)).toEqual([[0]]);
    // c2 is 3 hops from A and its own way around (c1 f1-f4 c3) is 5 steps, but taking it would
    // make A's way around 7: the second range has no room.
    expect(placeWilds([PEAKS_1, PEAKS_1], terrain)).toBeNull();
  });
});

describe('placeWilds fallbacks', () => {
  it('gives back a range that cannot grow, grows from the next seed, and frees the cell', () => {
    const terrain = grid();
    // (2, 2) is the highest cell, but none of its neighbors is interior, so it cannot grow.
    terrain.elevation[at(2, 2)] = 20;
    for (const n of terrain.adjacency[at(2, 2)]!) terrain.interior[n] = false;
    terrain.elevation[at(6, 4)] = 19;
    // Range 0 gives up on (2, 2) and grows at (6, 4) into (7, 4); range 1 then takes (2, 2).
    expect(placeWilds([PEAKS_2, PEAKS_1], terrain)).toEqual([[at(6, 4), at(7, 4)], [at(2, 2)]]);
  });

  it('gives back a refused growth cell and tries the next neighbor', () => {
    const terrain = grid();
    const [s, c, n] = [at(4, 4), at(5, 4), at(4, 5)];
    // n touches only s, c and (5, 5), so s and c together would leave it one neighbor.
    unlink(terrain.adjacency, n, at(3, 5));
    unlink(terrain.adjacency, n, at(4, 6));
    link(terrain.adjacency, n, c);
    for (const cell of [at(4, 3), at(3, 4), n]) terrain.interior[cell] = false;
    terrain.elevation[s] = 20;
    terrain.elevation[c] = 19;
    terrain.elevation[at(2, 4)] = 18;
    // s can grow only into c, which is refused, so s is given back. The seed c is refused s
    // and grows into (6, 4). (2, 4), 2 hops from s but 3 from c, is then free for range 1.
    expect(placeWilds([PEAKS_2, PEAKS_1], terrain)).toEqual([[c, at(6, 4)], [at(2, 4)]]);
  });

  /**
   * 15 x 15, with the interior a checkerboard, so no interior cell has an interior neighbor,
   * except p = (7, 7), which can grow into q = (8, 7). The first `spikes` checkerboard cells more
   * than 2 hops from p rank above p and fail to grow; each `refused` seed ranks above them all,
   * but taking it would leave its east neighbor one neighbor.
   */
  function board(spikes: number, refused = 0) {
    const w = 15;
    const adjacency = gridGraph(w, w);
    const [p, q] = [at(7, 7, w), at(8, 7, w)];
    const interior = adjacency.map((_, i) => {
      const [x, y] = [i % w, Math.floor(i / w)];
      return x > 0 && y > 0 && x < w - 1 && y < w - 1 && ((x + y) % 2 === 0 || i === q);
    });
    const elevation = adjacency.map(() => 0);
    elevation[p] = 50;
    const fromP = hopsFrom(adjacency, p);
    const even = adjacency.flatMap((_, i) => (interior[i] && fromP[i]! > 2 ? [i] : []));
    even.slice(0, spikes).forEach((cell, k) => (elevation[cell] = 100 - k));
    [at(2, 12, w), at(6, 12, w), at(10, 12, w)].slice(0, refused).forEach((seed, k) => {
      expect(elevation[seed]).toBe(0);
      elevation[seed] = 200 - k;
      unlink(adjacency, seed + 1, seed + 1 - w);
      unlink(adjacency, seed + 1, seed + 1 + w);
    });
    const terrain: Terrain = { adjacency, capitals: [], interior, elevation, moisture: [] };
    return { terrain, p, q };
  }

  it('tries WILDS.seedTries seeds and no more', () => {
    const fits = board(WILDS.seedTries - 1);
    expect(placeWilds([PEAKS_2], fits.terrain)).toEqual([[fits.p, fits.q]]);
    expect(placeWilds([PEAKS_2], board(WILDS.seedTries).terrain)).toBeNull();
  });

  it('does not count the seeds the map cannot spare toward WILDS.seedTries', () => {
    const { terrain, p, q } = board(WILDS.seedTries - 1, 3);
    expect(placeWilds([PEAKS_2], terrain)).toEqual([[p, q]]);
  });
});

describe('placeWilds on real province graphs', () => {
  const cases = [TWO_CAPITALS, FOUR_CAPITALS].flatMap((capitals) =>
    [1, 2, 3, 4, 5, 6].map((seed) => ({ nations: capitals.length, capitals, seed })),
  );

  // The province graph of a Medium map without wilds, random elevation and moisture, and a plan
  // drawn as the generator draws one: 15 placements per map, of which most find room.
  it.each(cases)(
    'meets every guard on Medium with $nations nations, seed $seed',
    ({ capitals, seed }) => {
      const map = generateMap({ seed, size: 'medium', capitals });
      const adjacency = indexAdjacency(map);
      const rng = createRng(seed);
      let placed = 0;
      for (let run = 0; run < 15; run++) {
        const plan = planWilds(rng, adjacency.length);
        const terrain: Terrain = {
          adjacency,
          capitals: map.capitals.map((id) => indexOf(map, id)),
          interior: interiorProvinces(map),
          elevation: adjacency.map(() => nextFloat(rng)),
          moisture: adjacency.map(() => nextFloat(rng)),
        };
        const ranges = placeWilds(plan, terrain);
        if (ranges === null) continue;
        placed++;
        expect(guardProblems(terrain, plan, ranges)).toEqual([]);
      }
      expect(placed).toBeGreaterThanOrEqual(5);
    },
  );
});
