// Large maps with impassable wild ranges (Phase 1b; war-table design 1.9): 2, 3 and 4 nations
// over seeds 1 to 30 with wilds on, checked by wildChecks.ts. A file per size, so the sweeps run
// side by side.
import { describe, it } from 'vitest';
import { generateMap } from '../../src/mapgen/generate';
import { FOUR_CAPITALS } from './fixtures';
import { expectWilds } from './wildChecks';

describe('Large maps with wilds', () => {
  const cases = [2, 3, 4].flatMap((nations) =>
    Array.from({ length: 30 }, (_, i) => ({ nations, seed: i + 1 })),
  );

  // The slowest cases (4 nations, seeds 1 and 2) take 1.9 to 2.3 s alone and have timed out at
  // vitest's 5 s default in loaded full runs: 10 s is about 4x their time alone (QA sweep H1).
  it.each(cases)(
    '$nations nations, seed $seed',
    ({ nations, seed }) => {
      const params = {
        seed,
        size: 'large' as const,
        capitals: FOUR_CAPITALS.slice(0, nations),
        wilds: true,
      };
      expectWilds(generateMap(params), params, seed <= 2);
    },
    10_000,
  );
});
