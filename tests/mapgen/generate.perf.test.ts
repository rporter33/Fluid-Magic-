// Generation time with wilds on (Phase 1b; war-table design 1.9 and R30): the median over seeds
// 1 to 10 stays under 150 ms on Medium with 2 nations and under 1,000 ms with 4. The design
// measured means of 26 and 420 ms with the balance search at 10 candidates; the test runs at
// MAPGEN.balanceCandidates (6 until the owner's decision commit makes it 10). A timing test: on
// a loaded machine run this file alone.
import { describe, expect, it } from 'vitest';
import { generateMap } from '../../src/mapgen/generate';
import type { CapitalSpec } from '../../src/mapgen/types';
import { FOUR_CAPITALS, TWO_CAPITALS } from './fixtures';

function medianMs(capitals: readonly CapitalSpec[]): number {
  const times = Array.from({ length: 10 }, (_, i) => {
    const start = performance.now();
    generateMap({ seed: i + 1, size: 'medium', capitals, wilds: true });
    return performance.now() - start;
  }).sort((a, b) => a - b);
  return (times[4]! + times[5]!) / 2;
}

describe('generation time with wilds', () => {
  it('takes under 150 ms on Medium with 2 nations (median of 10 seeds)', () => {
    generateMap({ seed: 99, size: 'medium', capitals: TWO_CAPITALS, wilds: true });
    expect(medianMs(TWO_CAPITALS)).toBeLessThan(150);
  });

  it('takes under 1,000 ms on Medium with 4 nations (median of 10 seeds)', () => {
    expect(medianMs(FOUR_CAPITALS)).toBeLessThan(1000);
  }, 30_000);
});
