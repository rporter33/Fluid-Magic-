// The termination sweep (docs/10-milestone-1.md Phase 1: "termination within tolerance for 100
// consecutive seeds"), run per size by generate.termination.*.test.ts. HEAVY: each sweep generates
// 100 maps, and the three files hold 600 (wilds off and on, 2 nations): 1.3 s to 5.6 s a sweep run
// alone at a load average near 8 on 4 cores, 3.3 s to 7.8 s with the three files in parallel at
// 11. Every seed must give a map, before the vitest timeout, with the exact province count (the
// generator's tolerance; docs/10 allows 5%) that passes validateMap. Work caps are checked by
// generate.test.ts and voronoi.test.ts; this timeout is only a scheduling watchdog, not a
// performance target. A synchronous infinite loop cannot be interrupted by Vitest's timer;
// the outer CI job deadline remains necessary. A shortfall throws with its reasons.
import { expect } from 'vitest';
import type { MapSizeId } from '../../src/content/mapgen';
import { generateMap } from '../../src/mapgen/generate';
import { provinceCount } from '../../src/mapgen/size';
import { validateMap } from '../../src/mapgen/validate';
import { TWO_CAPITALS } from './fixtures';

export const SWEEP_SEEDS = 100;

/** Scheduling watchdog only: >2x the loaded full-suite sweep measurements in docs/qa/task3-results.md. */
export const SWEEP_TIMEOUT = 60_000;

/** Generates seeds 1 to SWEEP_SEEDS and expects every one to give a map within tolerance. */
export function expectSweep(size: MapSizeId, wilds: boolean): void {
  const expected = provinceCount(size, TWO_CAPITALS.length);
  const failures: string[] = [];
  for (let seed = 1; seed <= SWEEP_SEEDS; seed++) {
    const params = { seed, size, capitals: TWO_CAPITALS, wilds };
    try {
      const map = generateMap(params);
      const count = Object.keys(map.provinces).length;
      if (count !== expected) failures.push(`seed ${String(seed)}: ${String(count)} provinces`);
      const problems = validateMap(map, params);
      if (problems.length > 0) failures.push(`seed ${String(seed)}: ${problems.join('; ')}`);
    } catch (e) {
      failures.push(`seed ${String(seed)}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  expect(failures).toEqual([]);
}
