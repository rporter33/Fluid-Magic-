import { describe, expect, it } from 'vitest';
import { COLORS, type Color } from '../../src/content/colors';
import { MAPGEN, TERRAIN_SPRING_COLORS } from '../../src/content/mapgen';
import { SCALE_AXES } from '../../src/content/pretenders/scales';
import { TERRAIN, TERRAIN_IDS, type TerrainId } from '../../src/content/terrain';
import {
  capitalBalance,
  independentStrength,
  placeCapitals,
  placeSprings,
  placeWellsprings,
  startPopulation,
  wellspringSteps,
  wellspringsToWin,
} from '../../src/mapgen/placement';
import { createRng } from '../../src/sim/rng';
import { gridGraph, hops } from './fixtures';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

describe('placeCapitals', () => {
  const grid = gridGraph(12, 8);

  it('puts two capitals near opposite ends of the graph', () => {
    for (const seed of SEEDS) {
      const [a, b] = placeCapitals(createRng(seed), grid, 2)!;
      expect(hops(grid, a!, b!)).toBeGreaterThanOrEqual(16);
    }
  });

  it('keeps four capitals pairwise at least the minimum apart', () => {
    for (const seed of SEEDS) {
      const capitals = placeCapitals(createRng(seed), grid, 4)!;
      expect(new Set(capitals).size).toBe(4);
      for (const a of capitals) {
        for (const b of capitals) {
          if (a !== b) expect(hops(grid, a, b)).toBeGreaterThanOrEqual(MAPGEN.capitalMinDistance);
        }
      }
    }
  });

  it('shuffles capitals into slots instead of giving slots 0 and 1 the far ends', () => {
    // Farthest-point order always starts with the farthest pair; slots must not inherit it.
    let farthestFirst = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const caps = placeCapitals(createRng(seed), grid, 4)!;
      const pairs = caps.flatMap((a, i) => caps.slice(i + 1).map((b) => hops(grid, a, b)));
      if (hops(grid, caps[0]!, caps[1]!) === Math.max(...pairs)) farthestFirst++;
    }
    expect(farthestFirst).toBeLessThan(30);
  });

  it('returns null when the graph is too small', () => {
    expect(placeCapitals(createRng(1), gridGraph(3, 3), 2)).toBeNull();
  });
});

describe('capitalBalance', () => {
  // A path 0-1-2-3-4-5-6 with capitals at the ends: rings are {1, 2} and {4, 5}.
  const path = gridGraph(7, 1);

  it('divides the richest ring population by the poorest', () => {
    const pops = [999, 10, 20, 500, 30, 10, 999];
    expect(capitalBalance(path, [0, 6], pops)).toBeCloseTo(40 / 30);
    expect(capitalBalance(path, [6, 0], pops)).toBeCloseTo(40 / 30);
  });

  it('is 1 for equal rings and Infinity for an empty one', () => {
    expect(capitalBalance(path, [0, 6], [0, 5, 5, 0, 5, 5, 0])).toBe(1);
    expect(capitalBalance(path, [0, 6], [0, 0, 0, 9, 5, 5, 0])).toBe(Number.POSITIVE_INFINITY);
  });
});

/** Each capital's summed distance to the Wellsprings it needs to win. */
function reach(grid: number[][], capitals: number[], wells: number[]): number[] {
  return capitals.map((c) =>
    wells
      .map((w) => hops(grid, c, w))
      .sort((a, b) => a - b)
      .slice(0, wellspringsToWin(wells.length))
      .reduce((s, d) => s + d, 0),
  );
}

function closestPair(grid: number[][], wells: number[]): number {
  return Math.min(
    ...wells.flatMap((a) => wells.filter((b) => b !== a).map((b) => hops(grid, a, b))),
  );
}

describe('placeWellsprings', () => {
  const grid = gridGraph(13, 9);
  const capitals = [4 * 13, 4 * 13 + 12]; // middle of the left and right edges

  it('respects capital distance and separation, and is fair to both capitals', () => {
    for (const seed of SEEDS) {
      const wells = placeWellsprings(createRng(seed), grid, capitals, 3)!;
      expect(new Set(wells).size).toBe(3);
      for (const w of wells) {
        for (const c of capitals) {
          expect(hops(grid, w, c)).toBeGreaterThanOrEqual(MAPGEN.wellspringMinCapitalDistance);
        }
      }
      expect(closestPair(grid, wells)).toBeGreaterThanOrEqual(MAPGEN.wellspringMinSeparation);
      const [a, b] = reach(grid, capitals, wells);
      expect(a).toBe(b);
    }
  });

  it('spreads Wellsprings as far apart as fairness allows', () => {
    for (const seed of SEEDS) {
      const wells = placeWellsprings(createRng(seed), grid, capitals, 3)!;
      expect(closestPair(grid, wells)).toBeGreaterThanOrEqual(6);
    }
  });

  it('stays fair for four nations', () => {
    const big = gridGraph(15, 11);
    const corners = [16, 15 + 13, 9 * 15 + 1, 9 * 15 + 13];
    for (const seed of SEEDS) {
      const wells = placeWellsprings(createRng(seed), big, corners, 5)!;
      const r = reach(big, corners, wells);
      expect(Math.max(...r) - Math.min(...r)).toBeLessThanOrEqual(1);
    }
  });

  it('returns null without enough candidates', () => {
    expect(placeWellsprings(createRng(1), gridGraph(5, 1), [0, 4], 3)).toBeNull();
  });

  it('wellspringsToWin is a majority', () => {
    expect(wellspringsToWin(3)).toBe(2);
    expect(wellspringsToWin(5)).toBe(3);
  });
});

describe('wellspringSteps', () => {
  it('uses distinct axes while they last and steps of one', () => {
    const steps = wellspringSteps(createRng(1), 5);
    expect(new Set(steps.map((s) => s.axis)).size).toBe(5);
    for (const s of steps) {
      expect(SCALE_AXES).toContain(s.axis);
      expect([1, -1]).toContain(s.step);
    }
  });

  it('varies poles and axis order between seeds', () => {
    const runs = Array.from({ length: 50 }, (_, k) => wellspringSteps(createRng(k), 3));
    const poles = new Set(runs.flat().map((s) => s.step));
    const firstAxes = new Set(runs.map((r) => r[0]!.axis));
    expect(poles).toEqual(new Set([1, -1]));
    expect(firstAxes.size).toBeGreaterThan(2);
  });
});

function colorCounts(springs: readonly Color[][]): number[] {
  const flat = springs.flat();
  return COLORS.map((c) => flat.filter((x) => x === c).length);
}

describe('placeSprings', () => {
  it('gives capitals their color, Wellsprings none, and others 0 to 2', () => {
    const terrains: TerrainId[] = new Array<TerrainId>(30).fill('plains');
    const springs = placeSprings(createRng(1), terrains, [{ index: 0, color: 'R' }], [5]);
    expect(springs[0]).toEqual(new Array(MAPGEN.capitalSprings).fill('R'));
    expect(springs[5]).toEqual([]);
    for (const s of springs.slice(1)) expect(s.length).toBeLessThanOrEqual(2);
  });

  it('rolls spring counts by the content weights', () => {
    const springs = placeSprings(createRng(3), new Array<TerrainId>(3000).fill('plains'), [], []);
    const total = MAPGEN.springCountWeights.reduce((s, w) => s + w, 0);
    MAPGEN.springCountWeights.forEach((w, k) => {
      const share = springs.filter((s) => s.length === k).length / springs.length;
      // Standard error is under 0.01 at this size.
      expect(Math.abs(share - w / total)).toBeLessThan(0.03);
    });
  });

  it('deals every color equally often, give or take one', () => {
    for (const seed of SEEDS) {
      const terrains = Array.from({ length: 70 }, (_, i) => TERRAIN_IDS[(i * seed) % 7]!);
      const counts = colorCounts(placeSprings(createRng(seed), terrains, [], []));
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
  });

  it('adds springs until every color appears at least twice, even on a tiny map', () => {
    for (const seed of SEEDS) {
      const springs = placeSprings(createRng(seed), new Array<TerrainId>(6).fill('forest'), [], []);
      for (const n of colorCounts(springs)) {
        expect(n).toBeGreaterThanOrEqual(MAPGEN.minSpringsPerColor);
      }
    }
  });

  it('puts most springs on terrain that suits their color', () => {
    const terrains = Array.from({ length: 140 }, (_, i) => TERRAIN_IDS[i % 7]!);
    let suited = 0;
    let total = 0;
    for (const seed of SEEDS) {
      placeSprings(createRng(seed), terrains, [], []).forEach((list, i) => {
        for (const c of list) {
          total++;
          if (TERRAIN_SPRING_COLORS[terrains[i]!].includes(c)) suited++;
        }
      });
    }
    expect(suited / total).toBeGreaterThan(0.85);
  });
});

describe('startPopulation and independentStrength', () => {
  it('capitals start at the capital population', () => {
    expect(startPopulation(createRng(1), 'forest', true)).toBe(MAPGEN.capitalPop);
  });

  it('others start inside their terrain range in steps of the rounding', () => {
    const rng = createRng(2);
    for (const terrain of TERRAIN_IDS) {
      for (let k = 0; k < 50; k++) {
        const pop = startPopulation(rng, terrain, false);
        expect(pop).toBeGreaterThanOrEqual(TERRAIN[terrain].startPop.min);
        expect(pop).toBeLessThanOrEqual(TERRAIN[terrain].startPop.max);
        expect(pop % MAPGEN.popRounding).toBe(0);
      }
    }
  });

  it('follows 8 + 4d, 30 on Wellsprings, 0 in capitals', () => {
    expect(independentStrength(1, false, false)).toBe(12);
    expect(independentStrength(5, false, false)).toBe(28);
    expect(independentStrength(4, false, true)).toBe(30);
    expect(independentStrength(0, true, false)).toBe(0);
  });
});
