// Derived lookups that have no other home.
import { describe, expect, it } from 'vitest';
import { captureProvince } from '../../src/sim/capture';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { MANA } from '../../src/content/rules';
import {
  dominionScore,
  isPretender,
  isProphet,
  nationEconomy,
  provinceEconomy,
  provinceSprings,
} from '../../src/sim/selectors';
import { claimedBy } from '../../src/sim/wellsprings';
import { annex, commandersIn, nationIds, pretender, redGame, twoNationGame } from './fixtures';

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

describe('springs added in play (D5)', () => {
  it('list after the map’s and pay mana like them, also after the province changes hands', () => {
    const state = twoNationGame(1, {
      pretender: pretender({
        chassis: 'titan',
        pips: { R: 4, G: 1 },
        dominion: 2,
        awakening: 'awake',
        boons: [{ id: 'sacredSpring', color: 'G' }],
      }),
    });
    const [red, green] = nationIds(state) as [NationId, NationId];
    const capital = state.nations[red]!.capital;
    // A spring color the map's springs lack, so the order shows: the map's first.
    const map = state.map.provinces[capital]!.springs;
    expect(map.length).toBeGreaterThan(0);
    expect(map.every((c) => c === 'R')).toBe(true);
    expect(provinceSprings(state, capital)).toEqual([...map, 'G']);
    const withExtra = provinceEconomy(state, capital).mana;
    state.provinces[capital]!.extraSprings = [];
    const without = provinceEconomy(state, capital).mana;
    expect(withExtra.G - without.G).toBe(MANA.perSpring);
    expect({ ...withExtra, G: without.G }).toEqual(without);
    // Two of a color pay twice.
    state.provinces[capital]!.extraSprings = ['G', 'G'];
    expect(provinceEconomy(state, capital).mana.G - without.G).toBe(2 * MANA.perSpring);
    // Taken by Green, the springs stay and pay their new owner.
    captureProvince(state, capital, green);
    expect(state.provinces[capital]!.extraSprings).toEqual(['G', 'G']);
    state.provinces[capital]!.dominion = { nation: null, strength: 0 };
    const taken = provinceEconomy(state, capital).mana;
    state.provinces[capital]!.extraSprings = [];
    expect(taken.G - provinceEconomy(state, capital).mana.G).toBe(2 * MANA.perSpring);
    // The nation's income counts them too.
    const plain = nationEconomy(state, green).mana.G;
    state.provinces[capital]!.extraSprings = ['G', 'G'];
    expect(nationEconomy(state, green).mana.G - plain).toBe(2 * MANA.perSpring);
  });

  it('pay nothing in a province nobody owns', () => {
    const state = twoNationGame(1);
    const wild = Object.values(state.provinces).find((p) => p.owner === null)!;
    wild.extraSprings = ['R', 'R'];
    expect(provinceEconomy(state, wild.id).mana.R).toBe(0);
  });
});
