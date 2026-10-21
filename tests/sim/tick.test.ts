// advance(): day counting, effect expiry, and determinism (acceptance criterion 4).
import { describe, expect, it } from 'vitest';
import { advance } from '../../src/sim/tick';
import type { GameState } from '../../src/sim/types';
import { capitalOf, nationIds, runDays, twoNationGame } from './fixtures';

describe('advance', () => {
  it('moves one day at a time', () => {
    const state = twoNationGame();
    advance(state);
    advance(state);
    expect(state.day).toBe(2);
  });

  it('expires province effects on their until day', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    state.provinceEffects.push({
      id: 'fx99' as never,
      province: capitalOf(state, red).id,
      nation: red,
      source: 'test',
      untilDay: 3,
      kind: 'supply',
      deltaPct: 1,
    });
    runDays(state, 3);
    expect(state.provinceEffects).toHaveLength(1);
    runDays(state, 1);
    expect(state.provinceEffects).toHaveLength(0);
  });

  it('stops once the game has a result', () => {
    const state = twoNationGame();
    state.result = { day: 0, winner: null, reason: 'playerDefeated' };
    advance(state);
    expect(state.day).toBe(0);
  });

  it('is deterministic: the same seed gives the same state after 365 days', () => {
    const a = twoNationGame(11);
    const b = twoNationGame(11);
    runDays(a, 365);
    runDays(b, 365);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('continues identically after a save and load', () => {
    const a = twoNationGame(12);
    runDays(a, 100);
    const b = JSON.parse(JSON.stringify(a)) as GameState;
    runDays(a, 100);
    runDays(b, 100);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });
});
