// Gold, upkeep, mana, and materials (docs/01-core-rules.md section 4). Expected values are
// computed here from the doc formulas, not from src/sim/selectors.ts.
import { describe, expect, it } from 'vitest';
import { MAPGEN } from '../../src/content/mapgen';
import { ECONOMY } from '../../src/content/rules';
import { fortMaterials, nationEconomy, provinceEconomy } from '../../src/sim/selectors';
import {
  addArmy,
  capitalOf,
  independentProvince,
  nationIds,
  redGame,
  runDays,
  twoNationGame,
} from './fixtures';

/** Starting army upkeep per month from the docs/03 gold costs: commanders plus troops, / 15. */
const CINDER_UPKEEP = (40 + 20 + 70 + 60 + 20 * 12 + 10 * 13) / 15;
const THORNWOOD_UPKEEP = (45 + 20 + 70 + 60 + 20 * 14 + 10 * 14) / 15;

describe('gold', () => {
  it('capital income on day 30 matches the formula', () => {
    const state = twoNationGame();
    const [red] = nationIds(state);
    let pop = MAPGEN.capitalPop;
    let gold = ECONOMY.startGold;
    for (let day = 0; day < 30; day++) {
      gold += pop / 100 / 30; // pop / 100 * tax 1 * order 1 * (1 - unrest 0 / 200), per day
      gold -= CINDER_UPKEEP / 30;
      pop += (pop * 0.002) / 30; // growth 0.2% a month at Growth 0
    }
    runDays(state, 30);
    expect(state.day).toBe(30);
    expect(state.nations[red!]!.gold).toBeCloseTo(gold, 6);
    expect(capitalOf(state, red!).pop).toBeCloseTo(pop, 6);
    expect(state.nations[red!]!.unpaidDays).toBe(0);
  });

  it('reports the same rates the tick applies', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state);
    expect(nationEconomy(state, red!).gold).toBeCloseTo(250, 9);
    expect(nationEconomy(state, red!).upkeep).toBeCloseTo(CINDER_UPKEEP, 9);
    expect(nationEconomy(state, green!).upkeep).toBeCloseTo(THORNWOOD_UPKEEP, 9);
  });

  it('scales with tax rate, unrest, and the Order scale', () => {
    const state = twoNationGame();
    const [red] = nationIds(state);
    const capital = capitalOf(state, red!);
    capital.taxRate = 'high';
    capital.unrest = 40;
    expect(provinceEconomy(state, capital.id).gold).toBeCloseTo(250 * 1.5 * (1 - 40 / 200), 9);
    const ordered = redGame(10, { order: 3 });
    expect(provinceEconomy(ordered, capitalOf(ordered, red!).id).gold).toBeCloseTo(250 * 1.21, 9);
  });

  it('rounds province scales half away from zero, alike for both poles', () => {
    // Order 3 at dominion strength 5 is 1.5 steps: +2 for Order, -2 for Turmoil.
    const gold = (order: number) => {
      const s = redGame(5, { order });
      return provinceEconomy(s, capitalOf(s, nationIds(s)[0]!).id).gold;
    };
    expect(gold(3)).toBeCloseTo(250 * 1.14, 9);
    expect(gold(-3)).toBeCloseTo(250 * 0.86, 9);
  });

  it('gives easy AI nations 80% of their income', () => {
    const state = twoNationGame(1, {}, { ai: { difficulty: 'easy' } });
    const [, green] = nationIds(state);
    expect(nationEconomy(state, green!).gold).toBeCloseTo(250 * 0.8, 9);
  });

  it('pays no gold from a besieged province', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state);
    const capital = capitalOf(state, red!);
    capital.siege = { attacker: green!, wallHp: 300 };
    expect(provinceEconomy(state, capital.id).gold).toBe(0);
    expect(provinceEconomy(state, capital.id).materials).toBe(0);
  });
});

describe('upkeep', () => {
  it('pays what it can and counts the unpaid fraction of each day', () => {
    const state = twoNationGame();
    const [red] = nationIds(state);
    const nation = state.nations[red!]!;
    // 300 more Cinder Warriors: upkeep 240 more a month, well over the 250 income.
    addArmy(state, red!, nation.capital, 'cinderWarrior', 80);
    addArmy(state, red!, nation.capital, 'cinderWarrior', 80);
    addArmy(state, red!, nation.capital, 'cinderWarrior', 80);
    addArmy(state, red!, nation.capital, 'cinderWarrior', 60);
    nation.gold = 0;
    const upkeep = nationEconomy(state, red!).upkeep;
    const income = nationEconomy(state, red!).gold;
    runDays(state, 30);
    expect(nation.gold).toBeGreaterThanOrEqual(0);
    expect(nation.gold).toBeLessThan(1e-9);
    // Income keeps rising with population, so the shortfall shrinks a little each day.
    expect(nation.unpaidDays).toBeCloseTo(30 * (1 - income / upkeep), 1);
  });

  it('clears the unpaid count on a fully paid day', () => {
    const state = twoNationGame();
    const [red] = nationIds(state);
    const nation = state.nations[red!]!;
    nation.unpaidDays = 45;
    runDays(state, 1);
    expect(nation.unpaidDays).toBe(0);
  });
});

describe('mana', () => {
  it('pays springs and dominion tint from the capital', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state);
    // 4 springs of the nation color, plus floor(dominion 5 / 3) = 1 from tint.
    expect(nationEconomy(state, red!).mana).toEqual({ W: 0, U: 0, B: 0, R: 5, G: 0 });
    expect(nationEconomy(state, green!).mana).toEqual({ W: 0, U: 0, B: 0, R: 0, G: 5 });
    runDays(state, 30);
    expect(state.nations[red!]!.mana.R).toBeCloseTo(5, 9);
  });

  it('pays 2 of every color from an owned Wellspring and its springs elsewhere', () => {
    const state = twoNationGame();
    const [red] = nationIds(state);
    const well = state.map.wellsprings[0]!;
    state.provinces[well]!.owner = red!;
    const mana = provinceEconomy(state, well).mana;
    expect(mana).toEqual({ W: 2, U: 2, B: 2, R: 2, G: 2 });
  });

  it('adds Black tint mana per Rot step where the owner dominates', () => {
    // Rot 3 at strength 9 is round(2.7) = 3 steps; tint is floor(9 / 3) = 3 Red.
    const state = redGame(9, { growth: -3 });
    const mana = provinceEconomy(state, capitalOf(state, nationIds(state)[0]!).id).mana;
    expect(mana.R).toBe(4 + 3);
    expect(mana.B).toBe(3);
  });
});

describe('materials', () => {
  it('produces terrain base plus pop / 500 a month', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state);
    // Kharnath is Plains (base 10), Deepmoss is Forest (base 20).
    expect(provinceEconomy(state, capitalOf(state, red!).id).materials).toBeCloseTo(10 + 50, 9);
    expect(provinceEconomy(state, capitalOf(state, green!).id).materials).toBeCloseTo(20 + 50, 9);
  });

  it('collects half of each adjacent owned fortless province', () => {
    const state = twoNationGame();
    const [red] = nationIds(state);
    const capital = capitalOf(state, red!);
    const neighbor = state.map.provinces[capital.id]!.neighbors[0]!;
    const own = provinceEconomy(state, capital.id).materials;
    const theirs = provinceEconomy(state, neighbor).materials;
    expect(fortMaterials(state, capital.id).perMonth).toBeCloseTo(own, 9);
    state.provinces[neighbor]!.owner = red!;
    expect(fortMaterials(state, capital.id).perMonth).toBeCloseTo(own + theirs / 2, 9);
  });

  it('caps the fort pool at 6 months of collection', () => {
    const state = twoNationGame();
    const [red] = nationIds(state);
    const capital = capitalOf(state, red!);
    runDays(state, 60);
    const twoMonths = capital.materials;
    expect(twoMonths).toBeGreaterThan(2 * 60 * 0.99);
    expect(twoMonths).toBeLessThan(2 * 62);
    runDays(state, 180);
    // The pool pins to the cap of the day's snapshot, taken before that day's growth.
    const { cap } = fortMaterials(state, capital.id);
    expect(capital.materials).toBeCloseTo(cap, 1);
    expect(capital.materials).toBeLessThanOrEqual(cap);
    expect(cap).toBeCloseTo(6 * provinceEconomy(state, capital.id).materials, 6);
    runDays(state, 30);
    expect(capital.materials).toBeLessThanOrEqual(fortMaterials(state, capital.id).cap + 1e-9);
  });

  it('collects nothing for an unowned province or one without a fort', () => {
    const state = twoNationGame();
    const p = independentProvince(state);
    expect(fortMaterials(state, p.id)).toEqual({ perMonth: 0, cap: 0 });
  });
});
