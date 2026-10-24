// HEAVY SWEEP (200 maps): generation terminates within tolerance on Medium maps for seeds 1 to
// 100, with wilds off and on (docs/10-milestone-1.md Phase 1; termination.ts has the rule and the
// timings). The other sizes are in generate.termination.*.test.ts, so the sweeps run in parallel.
import { describe, it } from 'vitest';
import { expectSweep, SWEEP_SEEDS, SWEEP_TIMEOUT } from './termination';

describe('medium maps for ' + String(SWEEP_SEEDS) + ' consecutive seeds', () => {
  it(
    'terminate within tolerance without wilds',
    () => {
      expectSweep('medium', false);
    },
    SWEEP_TIMEOUT,
  );
  it(
    'terminate within tolerance with wilds',
    () => {
      expectSweep('medium', true);
    },
    SWEEP_TIMEOUT,
  );
});
