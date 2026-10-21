// Derived lookups that have no other home.
import { describe, expect, it } from 'vitest';
import { dominionScore, isPretender, isProphet } from '../../src/sim/selectors';
import { commandersIn, nationIds, redGame, twoNationGame } from './fixtures';

describe('prophet and pretender', () => {
  it('are read from the nation ids alone', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const [first, second] = commandersIn(state, state.nations[red]!.capital).filter(
      (c) => c.unit !== 'garrison',
    );
    expect(isProphet(state, first!)).toBe(false);
    state.nations[red]!.prophetId = first!.id;
    state.nations[red]!.pretenderId = second!.id;
    expect(isProphet(state, first!)).toBe(true);
    expect(isProphet(state, second!)).toBe(false);
    expect(isPretender(state, second!)).toBe(true);
  });
});

describe('dominionScore', () => {
  it('adds one per claimed Wellspring and stops at 10', () => {
    const state = redGame(8);
    const red = nationIds(state)[0]!;
    expect(dominionScore(state, red)).toBe(8);
    const [a, b, c] = state.map.wellsprings;
    state.provinces[a!]!.wellspringClaimedBy = red;
    expect(dominionScore(state, red)).toBe(9);
    state.provinces[b!]!.wellspringClaimedBy = red;
    state.provinces[c!]!.wellspringClaimedBy = red;
    expect(dominionScore(state, red)).toBe(10);
  });
});
