import { describe, expect, it } from 'vitest';
import { COLORS } from '../../src/content/colors';
import { MAPGEN } from '../../src/content/mapgen';
import { SCALE_AXES } from '../../src/content/pretenders/scales';
import { TERRAIN, type TerrainId } from '../../src/content/terrain';
import {
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

describe('placeCapitals', () => {
  const grid = gridGraph(12, 8);

  it('puts two capitals near opposite ends of the graph', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const capitals = placeCapitals(createRng(seed), grid, 2, 6);
      expect(capitals).not.toBeNull();
      const [a, b] = capitals!;
      expect(hops(grid, a!, b!)).toBeGreaterThanOrEqual(16);
    }
  });

  it('keeps four capitals pairwise at least the minimum apart', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const capitals = placeCapitals(createRng(seed), grid, 4, 6)!;
      expect(new Set(capitals).size).toBe(4);
      for (const a of capitals) {
        for (const b of capitals) if (a !== b) expect(hops(grid, a, b)).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it('returns null when the graph is too small', () => {
    expect(placeCapitals(createRng(1), gridGraph(3, 3), 2, 6)).toBeNull();
  });
});

describe('placeWellsprings', () => {
  const grid = gridGraph(13, 9);
  const capitals = [4 * 13, 4 * 13 + 12]; // middle of the left and right edges

  it('respects capital distance and separation, and is fair to both capitals', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const wells = placeWellsprings(createRng(seed), grid, capitals, 3, 3, 2)!;
      expect(wells).toHaveLength(3);
      expect(new Set(wells).size).toBe(3);
      for (const w of wells) {
        for (const c of capitals) expect(hops(grid, w, c)).toBeGreaterThanOrEqual(3);
        for (const v of wells) if (v !== w) expect(hops(grid, w, v)).toBeGreaterThanOrEqual(2);
      }
      const reach = capitals.map((c) =>
        wells
          .map((w) => hops(grid, c, w))
          .sort((a, b) => a - b)
          .slice(0, wellspringsToWin(3))
          .reduce((s, d) => s + d, 0),
      );
      expect(reach[0]).toBe(reach[1]);
    }
  });

  it('spreads Wellsprings out when there is room', () => {
    const wells = placeWellsprings(createRng(1), grid, capitals, 3, 3, 2)!;
    const closest = Math.min(
      ...wells.flatMap((a) => wells.filter((b) => b !== a).map((b) => hops(grid, a, b))),
    );
    expect(closest).toBeGreaterThanOrEqual(4);
  });

  it('returns null without enough candidates', () => {
    expect(placeWellsprings(createRng(1), gridGraph(5, 1), [0, 4], 3, 3, 2)).toBeNull();
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
});

describe('placeSprings', () => {
  it('gives capitals their color, Wellsprings none, and others 0 to 2', () => {
    const terrains: TerrainId[] = new Array<TerrainId>(30).fill('plains');
    const springs = placeSprings(createRng(1), terrains, [{ index: 0, color: 'R' }], [5]);
    expect(springs[0]).toEqual(new Array(MAPGEN.capitalSprings).fill('R'));
    expect(springs[5]).toEqual([]);
    for (const s of springs.slice(1)) expect(s.length).toBeLessThanOrEqual(2);
  });

  it('adds every color at least twice even where no terrain favors it', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const terrains: TerrainId[] = new Array<TerrainId>(20).fill('forest');
      const springs = placeSprings(createRng(seed), terrains, [{ index: 0, color: 'G' }], []);
      for (const color of COLORS) {
        const count = springs
          .slice(1)
          .flat()
          .filter((c) => c === color).length;
        expect(count).toBeGreaterThanOrEqual(MAPGEN.minSpringsPerColor);
      }
    }
  });

  it('rolls springs from the terrain colors', () => {
    const terrains: TerrainId[] = new Array<TerrainId>(200).fill('swamp');
    const springs = placeSprings(createRng(2), terrains, [], []);
    const swampy = springs.flat().filter((c) => c === 'B' || c === 'U').length;
    expect(swampy / springs.flat().length).toBeGreaterThan(0.9);
  });
});

describe('startPopulation and independentStrength', () => {
  it('capitals start at the capital population', () => {
    expect(startPopulation(createRng(1), 'forest', true)).toBe(MAPGEN.capitalPop);
  });

  it('others start inside their terrain range in steps of the rounding', () => {
    const rng = createRng(2);
    for (const terrain of Object.keys(TERRAIN) as TerrainId[]) {
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
