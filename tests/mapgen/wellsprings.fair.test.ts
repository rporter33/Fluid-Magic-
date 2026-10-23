// Wellspring fairness on generated maps (docs/01-core-rules.md, "Wellsprings": every nation
// equally far, in total, from the Wellsprings it needs to win). QA sweep map-1: the 8-start
// search stopped at 2 hops of unfairness on Small 4-nation maps where fair sets existed (seed 6
// with wilds, seed 16 without); it now searches again from every candidate while unfair.
import { describe, expect, it } from 'vitest';
import { nationDef, type NationDefId } from '../../src/content';
import { generateMap } from '../../src/mapgen/generate';
import { bfsDistances } from '../../src/mapgen/graph';
import { wellspringsToWin } from '../../src/mapgen/placement';
import type { CapitalSpec, MapData } from '../../src/mapgen/types';
import { indexAdjacency } from './fixtures';

/** The capitals createGame asks for, nation by nation. */
function capitals(nations: readonly NationDefId[]): CapitalSpec[] {
  return nations.map((id) => {
    const d = nationDef(id);
    return { color: d.colors[0], terrain: d.capitalTerrain, name: d.capitalName };
  });
}

/** The spread between nations in total distance to the Wellsprings each needs to win. */
function unfairness(map: MapData): number {
  const adjacency = indexAdjacency(map);
  const ids = Object.keys(map.provinces);
  const wells = map.wellsprings.map((w) => ids.indexOf(w));
  const reach = map.capitals.map((c) => {
    const d = bfsDistances(adjacency, [ids.indexOf(c)]);
    return wells
      .map((w) => d[w] ?? 0)
      .sort((a, b) => a - b)
      .slice(0, wellspringsToWin(wells.length))
      .reduce((s, x) => s + x, 0);
  });
  return Math.max(...reach) - Math.min(...reach);
}

const FOUR = capitals(['cinderHorde', 'thornwood', 'cinderHorde', 'thornwood']);
const TWO = capitals(['cinderHorde', 'thornwood']);

describe('Wellspring fairness on generated maps', () => {
  it.each([
    { seed: 6, wilds: true },
    { seed: 16, wilds: false },
  ])('is within 1 hop on Small with 4 nations where it was 2: seed $seed, wilds $wilds', (p) => {
    const map = generateMap({ seed: p.seed, size: 'small', capitals: FOUR, wilds: p.wilds });
    expect(unfairness(map)).toBeLessThanOrEqual(1);
  });

  it('is exact with 2 nations', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const map = generateMap({ seed, size: 'medium', capitals: TWO, wilds: true });
      expect(unfairness(map), `seed ${String(seed)}`).toBe(0);
    }
  });
});
