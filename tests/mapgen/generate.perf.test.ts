// Phase 1b, war-table design 1.9/R30: retain 150 / 1,000 ms, ten seeds, Medium, wilds on,
// and MAPGEN.balanceCandidates. CPU medians exclude scheduling delays; test:perf ALSO enforces
// wall medians on a quiet runner. No additional budget headroom. See docs/qa/timing.md.
import { describe, it } from 'vitest';
import { generateMap } from '../../src/mapgen/generate';
import type { CapitalSpec } from '../../src/mapgen/types';
import { expectPerformance, measure } from '../helpers/performance';
import { FOUR_CAPITALS, TWO_CAPITALS } from './fixtures';

function checkGeneration(capitals: readonly CapitalSpec[], budgetMs: number): void {
  generateMap({ seed: 99, size: 'medium', capitals, wilds: true });
  const samples = Array.from({ length: 10 }, (_, i) =>
    measure(() => generateMap({ seed: i + 1, size: 'medium', capitals, wilds: true })),
  );
  expectPerformance(`Medium map, ${capitals.length} nations`, samples, budgetMs);
}

describe('generation time with wilds', () => {
  it('takes under 150 ms on Medium with 2 nations (median of 10 seeds)', () => {
    checkGeneration(TWO_CAPITALS, 150);
  });

  it('takes under 1,000 ms on Medium with 4 nations (median of 10 seeds)', () => {
    checkGeneration(FOUR_CAPITALS, 1000);
  }, 30_000);
});
