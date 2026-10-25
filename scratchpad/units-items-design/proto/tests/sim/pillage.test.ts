// The Pillage order (docs/01-core-rules.md section 3).
import { describe, expect, it } from 'vitest';
import type { NationId } from '../../src/sim/ids';
import { nationEconomy, provinceEconomy } from '../../src/sim/selectors';
import type { GameState } from '../../src/sim/types';
import { addArmy, independentProvince, nationIds, runDays, twoNationGame } from './fixtures';

/** A nation's gold after one day without plunder: income in, upkeep out. */
function plainDay(state: GameState, nation: NationId): number {
  const e = nationEconomy(state, nation);
  return state.nations[nation]!.gold + e.gold / 30 - e.upkeep / 30;
}

describe('pillage', () => {
  it('takes 2% of the people a day for 1 gold per 20 lost, and adds 5 unrest', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const p = independentProvince(state);
    addArmy(state, red, p.id, 'cinderWarrior', 10).order = { kind: 'pillage' };
    const pop = p.pop;
    const gold = plainDay(state, red);
    runDays(state, 1);
    const lost = pop * 0.02;
    // Growth comes from the day's starting population, added after the pillage.
    expect(p.pop).toBeCloseTo(pop - lost + (pop * 0.002) / 30, 9);
    expect(state.nations[red]!.gold).toBeCloseTo(gold + lost / 20, 9);
    expect(p.unrest).toBeCloseTo(5 - 2 / 30, 9);
  });

  it('shows in the selectors as it will be applied', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const p = independentProvince(state);
    expect(provinceEconomy(state, p.id).pillage).toBeNull();
    expect(nationEconomy(state, red).plunderPerDay).toBe(0);
    addArmy(state, red, p.id, 'cinderWarrior', 10).order = { kind: 'pillage' };
    const lost = p.pop * 0.02;
    expect(provinceEconomy(state, p.id).pillage).toEqual({
      taker: red,
      popPerDay: lost,
      goldPerDay: lost / 20,
      unrestPerDay: 5,
    });
    expect(nationEconomy(state, red).plunderPerDay).toBeCloseTo(lost / 20, 12);
  });

  it('does not stack, and the first nation in order takes the gold', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state) as [NationId, NationId];
    const p = independentProvince(state);
    for (const owner of [red, red, green]) {
      addArmy(state, owner, p.id, 'cinderWarrior', 5).order = { kind: 'pillage' };
    }
    const pop = p.pop;
    const redGold = plainDay(state, red);
    const greenGold = plainDay(state, green);
    runDays(state, 1);
    expect(p.pop).toBeCloseTo(pop * 0.98 + (pop * 0.002) / 30, 9);
    expect(state.nations[red]!.gold).toBeCloseTo(redGold + (pop * 0.02) / 20, 9);
    expect(state.nations[green]!.gold).toBeCloseTo(greenGold, 9);
  });

  it('needs troops, and nobody pillages while marching', () => {
    const state = twoNationGame();
    const red = nationIds(state)[0]!;
    const p = independentProvince(state);
    const lone = addArmy(state, red, p.id, 'cinderWarrior', 1);
    lone.squads = [];
    lone.order = { kind: 'pillage' };
    const marching = addArmy(state, red, p.id, 'cinderWarrior', 5);
    marching.order = { kind: 'pillage' };
    marching.transit = { from: p.id, to: p.id, progress: 0, totalDays: 4 };
    const pop = p.pop;
    runDays(state, 1);
    expect(p.pop).toBeCloseTo(pop + (pop * 0.002) / 30, 9);
  });
});
