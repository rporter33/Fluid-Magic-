// Unrest (docs/01-core-rules.md section 5).
import { describe, expect, it } from 'vitest';
import { provinceEconomy } from '../../src/sim/selectors';
import type { NationId } from '../../src/sim/ids';
import {
  addArmy,
  capitalOf,
  commandersIn,
  nationIds,
  redGame,
  runDays,
  twoNationGame,
} from './fixtures';

describe('unrest', () => {
  it('decays 2 a month, 5 more per priest of the owner present', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red);
    // The starting Pyre Priest stands in the capital.
    const priests = commandersIn(state, capital.id).filter((c) => c.holy > 0);
    expect(priests).toHaveLength(1);
    expect(provinceEconomy(state, capital.id).unrest).toBe(-2 - 5);
    capital.unrest = 50;
    runDays(state, 30);
    expect(capital.unrest).toBeCloseTo(43, 9);
  });

  it('rises 4 a month at high tax and falls 2 more at low tax', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red);
    for (const c of commandersIn(state, capital.id)) c.holy = 0;
    capital.taxRate = 'high';
    expect(provinceEconomy(state, capital.id).unrest).toBe(4 - 2);
    capital.taxRate = 'low';
    expect(provinceEconomy(state, capital.id).unrest).toBe(-2 - 2);
  });

  it('rises with Turmoil and falls with Order', () => {
    const turmoil = redGame(10, { order: -3 });
    const red = nationIds(turmoil)[0]!;
    for (const c of commandersIn(turmoil, capitalOf(turmoil, red).id)) c.holy = 0;
    expect(provinceEconomy(turmoil, capitalOf(turmoil, red).id).unrest).toBe(6 - 2);
    const order = redGame(10, { order: 3 });
    for (const c of commandersIn(order, capitalOf(order, red).id)) c.holy = 0;
    expect(provinceEconomy(order, capitalOf(order, red).id).unrest).toBe(-6 - 2);
  });

  it('rises 1 per 3 strength of enemy dominion, plus Dread', () => {
    const state = redGame(10, { sanctity: -3 });
    const [red, green] = nationIds(state) as [NationId, NationId];
    const greenCapital = capitalOf(state, green);
    for (const c of commandersIn(state, greenCapital.id)) c.holy = 0;
    greenCapital.dominion = { nation: red, strength: 7 };
    // floor(7 / 3) = 2, and Dread round(-3 * 0.7) = -2 steps adds 2 * 2.
    expect(provinceEconomy(state, greenCapital.id).unrest).toBe(-2 + 2 + 4);
  });

  it('stays within 0 to 100', () => {
    const state = redGame(10, { order: -3 });
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red);
    for (const c of commandersIn(state, capital.id)) c.holy = 0;
    capital.taxRate = 'high';
    capital.unrest = 99.9;
    runDays(state, 30);
    expect(capital.unrest).toBe(100);
    capital.taxRate = 'low';
    addArmy(state, red, capital.id, 'cinderWarrior', 1, 'pyrePriest');
    capital.unrest = 0.1;
    runDays(state, 5);
    expect(capital.unrest).toBe(0);
  });
});
