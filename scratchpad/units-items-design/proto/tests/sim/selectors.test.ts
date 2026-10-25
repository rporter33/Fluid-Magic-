// Derived lookups that have no other home.
import { describe, expect, it } from 'vitest';
import { captureProvince } from '../../src/sim/capture';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { dominionScore, isPretender, isProphet } from '../../src/sim/selectors';
import { claimedBy } from '../../src/sim/wellsprings';
import { annex, commandersIn, nationIds, redGame, twoNationGame } from './fixtures';

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
    annex(state, red, a!).wellspringClaimedBy = red;
    expect(dominionScore(state, red)).toBe(9);
    annex(state, red, b!).wellspringClaimedBy = red;
    annex(state, red, c!).wellspringClaimedBy = red;
    expect(dominionScore(state, red)).toBe(10);
  });

  it('drops a Wellspring’s +1 with its province, and never counts one the nation does not own', () => {
    const state = redGame(5);
    const [red, green] = nationIds(state) as [NationId, NationId];
    const [a, b] = state.map.wellsprings as [ProvinceId, ProvinceId];
    const won = annex(state, red, a);
    won.wellspringClaimedBy = red;
    expect(claimedBy(state, red)).toBe(1);
    expect(dominionScore(state, red)).toBe(6);
    // Taken by Green, the Wellspring's claim and its +1 are gone.
    captureProvince(state, won.id, green);
    expect(won.wellspringClaimedBy).toBeNull();
    expect(dominionScore(state, red)).toBe(5);
    expect(dominionScore(state, green)).toBe(5);
    // A claim on a province Red does not own grants nothing, whoever owns it.
    state.provinces[b]!.wellspringClaimedBy = red;
    expect(claimedBy(state, red)).toBe(0);
    expect(dominionScore(state, red)).toBe(5);
  });
});
