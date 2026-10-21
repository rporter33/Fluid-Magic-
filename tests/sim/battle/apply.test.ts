// Writing a battle back (docs/04-battle.md; docs/01-core-rules.md sections 3 and 5).
import { describe, expect, it } from 'vitest';
import { applyBattle } from '../../../src/sim/battle/apply';
import { removeCommander } from '../../../src/sim/commanders';
import { ownerForces } from '../../../src/sim/conflict';
import type { SideForces } from '../../../src/sim/battle/setup';
import type { BattleResult } from '../../../src/sim/battle/types';
import type { CommanderState } from '../../../src/sim/types';
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
    // The owner lost a battle it started there.
    applyBattle(state, p.id, owner, none, result({ winner: 'defender' }));
    expect(p.unrest).toBe(25);
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

  it('hands a dead commander’s troops to a beaten side’s heir, the fort’s garrison, or nobody', () => {
    const { state, red, capital } = redField();
    const dead = (...cs: CommanderState[]) =>
      new Map(cs.map((c) => [c.id, { hp: 0, dead: true, routed: false, carriedMana: {} }]));
    const nobody: SideForces = { nation: null, commanders: [], garrison: null, pd: false };
    const p = independentProvince(state);
    const fallen = addArmy(state, red, p.id, 'ashMilitia', 6);
    const heir = addArmy(state, red, p.id, 'cinderWarrior', 1);
    heir.squads = [];
    const beaten: SideForces = {
      nation: red,
      commanders: [fallen, heir],
      garrison: null,
      pd: false,
    };
    applyBattle(
      state,
      p.id,
      beaten,
      nobody,
      result({ winner: 'defender', commanders: dead(fallen) }),
    );
    expect(heir.squads.map((s) => [s.unit, s.count])).toEqual([['ashMilitia', 6]]);

    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    const guard = addArmy(state, red, capital, 'ashMilitia', 4);
    const held = holder.squads.reduce((n, s) => n + (s.unit === 'ashMilitia' ? s.count : 0), 0);
    const fort: SideForces = { nation: red, commanders: [guard], garrison: holder, pd: false };
    applyBattle(
      state,
      capital,
      nobody,
      fort,
      result({ winner: 'defender', commanders: dead(guard) }),
    );
    expect(holder.squads.find((s) => s.unit === 'ashMilitia')?.count).toBe(held + 4);

    const lone = addArmy(state, red, p.id, 'cinderWarrior', 3);
    const squad = lone.squads[0]!.id;
    const alone: SideForces = { nation: red, commanders: [lone], garrison: null, pd: false };
    applyBattle(state, p.id, alone, nobody, result({ winner: 'defender', commanders: dead(lone) }));
    const all = Object.values(state.commanders).flatMap((c) => c.squads.map((s) => s.id));
    expect(all).not.toContain(squad);
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

  it('sets PD from the militia that held: ceil(militia / 2), archers aside', () => {
    const { state, green } = redField();
    const p = state.provinces[state.nations[green]!.capital]!;
    p.pd = 20;
    const owner: SideForces = { nation: green, commanders: [], garrison: null, pd: true };
    const nobody: SideForces = { nation: null, commanders: [], garrison: null, pd: false };
    applyBattle(
      state,
      p.id,
      nobody,
      owner,
      result({
        winner: 'defender',
        squads: new Map([
          ['pd0', { count: 5, hp: 50, routed: false }],
          ['pd1', { count: 4, hp: 40, routed: false }],
        ]),
      }),
    );
    expect(p.pd).toBe(3);
  });

  it('hands a fallen commander’s troops to the first living commander before the garrison', () => {
    const { state, green } = redField();
    const capital = state.nations[green]!.capital;
    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    const fallen = addArmy(state, green, capital, 'thornMilitia', 6, 'wardenCaptain');
    const first = addArmy(state, green, capital, 'warden', 1, 'wardenCaptain');
    const second = addArmy(state, green, capital, 'warden', 1, 'wardenCaptain');
    applyBattle(
      state,
      capital,
      { nation: null, commanders: [], garrison: null, pd: false },
      { nation: green, commanders: [fallen, first, second], garrison: holder, pd: false },
      result({
        winner: 'defender',
        commanders: new Map([[fallen.id, { hp: 0, dead: true, routed: false, carriedMana: {} }]]),
      }),
    );
    expect(first.squads.map((s) => s.unit)).toEqual(['warden', 'thornMilitia']);
    expect(second.squads.map((s) => s.unit)).toEqual(['warden']);
  });

  it('lets an empty garrison take in a fallen defender’s troops at its fort', () => {
    const { state, green } = redField();
    const capital = state.nations[green]!.capital;
    for (const c of Object.values(state.commanders)) {
      if (c.location === capital && c.owner === green && c.unit !== 'garrison') {
        removeCommander(state, c.id);
      }
    }
    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    expect(holder.squads).toEqual([]);
    const guard = addArmy(state, green, capital, 'thornMilitia', 4, 'wardenCaptain');
    applyBattle(
      state,
      capital,
      { nation: null, commanders: [], garrison: null, pd: false },
      ownerForces(state, capital),
      result({
        winner: 'defender',
        commanders: new Map([[guard.id, { hp: 0, dead: true, routed: false, carriedMana: {} }]]),
      }),
    );
    expect(holder.squads.map((s) => [s.unit, s.count])).toEqual([['thornMilitia', 4]]);
  });

  it('clears the pretender when it dies', () => {
    const { state, red, army } = redField();
    state.nations[red]!.pretenderId = army.id;
    applyBattle(
      state,
      army.location,
      { nation: red, commanders: [army], garrison: null, pd: false },
      { nation: null, commanders: [], garrison: null, pd: false },
      result({
        winner: 'defender',
        commanders: new Map([[army.id, { hp: 0, dead: true, routed: false, carriedMana: {} }]]),
      }),
    );
    expect(state.nations[red]!.pretenderId).toBeNull();
  });
});
