// The golden pin of the named battles (docs/12-battle-presentation.md, S1.9). The hashes were
// written by `npm run golden:battle` before the detail refactor; with the replay additions A1 to
// A5 stripped, every log, outcome, and final rng state must still match them. A mismatch means a
// draw moved: regenerate golden.json only for a deliberate rule or content change.
import { describe, expect, it } from 'vitest';
import { goldenEntries, type GoldenEntry } from './fixtures/golden';
import golden from './golden.json';

describe('the named battles', () => {
  it('fight exactly as pinned, 30 fixtures on 5 seeds each', () => {
    const pinned = golden as GoldenEntry[];
    expect(pinned).toHaveLength(150);
    expect(new Set(pinned.map((g) => g.fixture)).size).toBe(30);
    expect(goldenEntries()).toEqual(pinned);
  });
});
