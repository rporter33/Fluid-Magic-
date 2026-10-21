// Writing a battle back (docs/04-battle.md; docs/01-core-rules.md sections 3 and 5).
import { describe, expect, it } from 'vitest';
import { applyBattle } from '../../../src/sim/battle/apply';
import type { SideForces } from '../../../src/sim/battle/setup';
import type { BattleResult } from '../../../src/sim/battle/types';
import { addArmy, annex, independentProvince, redField } from '../fixtures';

function result(overrides: Partial<BattleResult> = {}): BattleResult {
  return {
    winner: 'attacker',
    rounds: 3,
    casualties: 0,
    squads: new Map(),
    commanders: new Map(),
    roster: {
      attacker: { nation: null, commanders: [], squads: [] },
      defender: { nation: null, commanders: [], squads: [] },
    },
    replay: [],
    ...overrides,
  };
}

describe('applyBattle', () => {
  it('costs 0.5% of the people per 100 casualties and +10 unrest when the owner loses', () => {
    const { state, red, green } = redField();
    const p = annex(state, green, independentProvince(state).id);
    p.pop = 10_000;
    p.unrest = 5;
    const none: SideForces = { nation: red, commanders: [], garrison: null, pd: false };
    const owner: SideForces = { nation: green, commanders: [], garrison: null, pd: false };
    applyBattle(state, p.id, none, owner, result({ casualties: 300 }));
    expect(p.pop).toBeCloseTo(10_000 * (1 - 0.015), 9);
    expect(p.unrest).toBe(15);
    applyBattle(state, p.id, none, owner, result({ winner: 'defender' }));
    expect(p.unrest).toBe(15);
  });

  it('writes survivors and wounds back, and hands a dead commander’s troops to a living one', () => {
    const { state, red } = redField();
    const p = independentProvince(state);
    const a = addArmy(state, red, p.id, 'cinderWarrior', 10);
    const b = addArmy(state, red, p.id, 'cinderWarrior', 5);
    a.order = { kind: 'move', path: [], mapSpeed: 2 };
    a.transit = { from: p.id, to: p.id, progress: 1, totalDays: 4 };
    const forces: SideForces = { nation: red, commanders: [b, a], garrison: null, pd: false };
    applyBattle(
      state,
      p.id,
      forces,
      { nation: null, commanders: [], garrison: null, pd: false },
      result({
        squads: new Map([
          [a.squads[0]!.id, { count: 7, hp: 60, routed: false }],
          [b.squads[0]!.id, { count: 2, hp: 15, routed: true }],
        ]),
        commanders: new Map([
          [a.id, { hp: 9, dead: false, routed: false, carriedMana: { R: 2 } }],
          [b.id, { hp: 0, dead: true, routed: false, carriedMana: {} }],
        ]),
      }),
    );
    expect(state.commanders[b.id]).toBeUndefined();
    expect(a).toMatchObject({ hp: 9, transit: null, carriedMana: { R: 2 } });
    expect(a.squads.map((s) => [s.count, s.hp])).toEqual([[9, 75]]);
  });

  it('keeps the last 20 battle records and tells each nation', () => {
    const { state, red, green } = redField();
    const p = independentProvince(state);
    const a: SideForces = { nation: red, commanders: [], garrison: null, pd: false };
    const d: SideForces = { nation: green, commanders: [], garrison: null, pd: false };
    const ids = Array.from({ length: 25 }, () => applyBattle(state, p.id, a, d, result()));
    expect(state.battles.map((b) => b.id)).toEqual(ids.slice(5));
    const last = state.messages.filter((m) => m.battle === ids[24]);
    expect(last.map((m) => [m.nation, m.text])).toEqual([
      [red, `Battle won at ${state.map.provinces[p.id]!.name}.`],
      [green, `Battle lost at ${state.map.provinces[p.id]!.name}.`],
    ]);
    expect(state.nations[red]!.stats.battlesWon).toBe(25);
    expect(state.nations[green]!.stats.battlesLost).toBe(25);
  });

  it('starts the prophet cooldown when a prophet dies', () => {
    const { state, red, army } = redField();
    state.nations[red]!.prophetId = army.id;
    state.day = 100;
    applyBattle(
      state,
      army.location,
      { nation: red, commanders: [army], garrison: null, pd: false },
      { nation: null, commanders: [], garrison: null, pd: false },
      result({
        commanders: new Map([[army.id, { hp: 0, dead: true, routed: false, carriedMana: {} }]]),
      }),
    );
    expect(state.nations[red]).toMatchObject({ prophetId: null, prophetAvailableDay: 100 + 720 });
  });
});
