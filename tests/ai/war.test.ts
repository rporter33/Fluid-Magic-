// The army pass's steps against other nations (docs/08-ai.md priorities 6 and 7; Phase 7 design
// "5. Army pass" b, e): storm odds and holding a siege, the keyed pillage draw, and War's target
// order (sieges, Wellspring denial past the aggression gate but not before warFromMonth, marches,
// then new targets behind the odds gate), combining only armies standing together.
import { describe, expect, it } from 'vitest';
import { AI } from '../../src/content/ai';
import { adjacencyRoute, createArmyPass } from '../../src/ai/army';
import { armyPower, defenderPower } from '../../src/ai/assess';
import { createPlan } from '../../src/ai/plan';
import { holdSieges, makeWar } from '../../src/ai/war';
import { createCommander, removeCommander } from '../../src/sim/commanders';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { findPathFor } from '../../src/sim/movement';
import { createRng } from '../../src/sim/rng';
import type { CommanderState, GameState } from '../../src/sim/types';
import { addArmy, annex, besiege, redField } from '../sim/fixtures';

const P = (id: string) => id as ProvinceId;

function sieges(state: GameState, red: NationId) {
  const pass = createArmyPass(createPlan(state, red));
  holdSieges(pass);
  return pass;
}

function war(state: GameState, red: NationId): Command[] {
  const pass = createArmyPass(createPlan(state, red));
  makeWar(pass);
  return pass.plan.out;
}

function moveCmd(red: NationId, members: readonly CommanderState[], path: ProvinceId[]): Command {
  return { type: 'move', nation: red, commanders: members.map((m) => m.id), path };
}

/** Troops of Cinder Warriors (8.5 each) that bring an Ash Chieftain (9.5) to at least `power`. */
function warriorsFor(power: number): number {
  return Math.max(0, Math.ceil((power - 9.5) / 8.5));
}

describe('holdSieges', () => {
  /** Red besieges Green's capital, p59, with walls at full strength. */
  function siegeField() {
    const f = redField();
    const fort = f.state.nations[f.green]!.capital;
    const first = besiege(f.state, f.red, fort);
    return { ...f, fort, first, defenders: defenderPower(f.state, fort) };
  }

  it('storms breached walls only with AI.stormRatio times the defenders, else holds', () => {
    const { state, red, fort, first, defenders } = siegeField();
    first.squads[0]!.count = warriorsFor(defenders / 2);
    first.squads[0]!.hp = first.squads[0]!.count * 11;
    state.provinces[fort]!.siege!.wallHp = 0;
    let pass = sieges(state, red);
    expect(pass.plan.out.filter((c) => c.type === 'storm')).toEqual([]);
    expect(pass.plan.assigned.has(first.id)).toBe(true);
    // A second army there brings the odds up.
    const second = addArmy(
      state,
      red,
      fort,
      'cinderWarrior',
      warriorsFor(AI.stormRatio * defenders),
    );
    expect(armyPower([first, second])).toBeGreaterThanOrEqual(AI.stormRatio * defenders);
    pass = sieges(state, red);
    expect(pass.plan.out.filter((c) => c.type === 'storm')).toEqual([
      { type: 'storm', nation: red, province: fort },
    ]);
    // Walls still standing: no storm, whatever the odds; nor twice.
    state.provinces[fort]!.siege!.wallHp = 300;
    expect(sieges(state, red).plan.out.filter((c) => c.type === 'storm')).toEqual([]);
    state.provinces[fort]!.siege = { attacker: red, wallHp: 0, storm: true };
    expect(sieges(state, red).plan.out.filter((c) => c.type === 'storm')).toEqual([]);
  });

  it('storms a fort with no defenders at once, walls or not', () => {
    const { state, red, green, fort } = siegeField();
    for (const c of Object.values(state.commanders)) {
      if (c.owner === green && c.location === fort && c.id !== state.provinces[fort]!.garrison) {
        removeCommander(state, c.id);
      }
    }
    expect(defenderPower(state, fort)).toBe(0);
    expect(sieges(state, red).plan.out).toContainEqual({
      type: 'storm',
      nation: red,
      province: fort,
    });
  });

  it('draws each besieging leader its pillage once, at the nation personality over many', () => {
    const { state, red, fort, first } = siegeField();
    const leaders = Array.from({ length: 1000 }, () =>
      createCommander(state, 'ashChieftain', red, fort),
    );
    const pillagers = (out: Command[]) =>
      out
        .filter((c) => c.type === 'setOrder' && c.order === 'pillage')
        .map((c) => (c.type === 'setOrder' ? c.commander : null));
    const drawn = pillagers(sieges(state, red).plan.out);
    // Cinder Horde pillages at 0.6.
    expect(drawn.length / (leaders.length + 1)).toBeGreaterThan(0.55);
    expect(drawn.length / (leaders.length + 1)).toBeLessThan(0.65);
    // Another day, another stream: the same pairs draw the same.
    state.day += 37;
    state.rng = createRng(99);
    expect(pillagers(sieges(state, red).plan.out)).toEqual(drawn);
    // With the orders given, nothing more is issued; a losing draw under Pillage goes idle.
    for (const id of drawn) if (id) state.commanders[id]!.order = { kind: 'pillage' };
    expect(sieges(state, red).plan.out.filter((c) => c.type === 'setOrder')).toEqual([]);
    const loser = [first, ...leaders].find((c) => !drawn.includes(c.id))!;
    loser.order = { kind: 'pillage' };
    expect(sieges(state, red).plan.out.filter((c) => c.type === 'setOrder')).toEqual([
      { type: 'setOrder', nation: red, commander: loser.id, order: 'idle' },
    ]);
  });
});

describe('makeWar: the odds gate', () => {
  /** Seed 1: Red's army in p50, next to Green's undefended p45; a Green army in p3 beyond. */
  function gate() {
    const f = redField();
    annex(f.state, f.red, P('p50'));
    annex(f.state, f.green, P('p45'));
    annex(f.state, f.green, P('p3'));
    f.army.location = P('p50');
    const enemy = addArmy(f.state, f.green, P('p3'), 'cinderWarrior', 40, 'wardenCaptain');
    return { ...f, enemy };
  }

  it('picks a new target only when aggression * own power > AI.warRatio * enemy power near', () => {
    const { state, red, army, enemy } = gate();
    // 0.8 * 262 against 1.2 * 350.25: shut.
    expect(0.8 * armyPower([army])).toBeLessThan(AI.warRatio * armyPower([enemy]));
    expect(war(state, red)).toEqual([]);
    removeCommander(state, enemy.id);
    expect(war(state, red)).toEqual([moveCmd(red, [army], [P('p45')])]);
  });

  it('joins a march on an enemy province past the gate when it can take it', () => {
    const { state, red, army } = gate();
    const marcher = addArmy(state, red, P('p50'), 'cinderWarrior', 20);
    expect(applyCommand(state, moveCmd(red, [marcher], [P('p45')]))).toEqual({ ok: true });
    expect(war(state, red)).toEqual([moveCmd(red, [army], [P('p45')])]);
  });

  it('combines armies standing together, never armies apart', () => {
    const { state, red, green, army, enemy } = gate();
    removeCommander(state, enemy.id);
    army.squads = [];
    const defender = addArmy(state, green, P('p45'), 'cinderWarrior', 30, 'wardenCaptain');
    const e = armyPower([defender]);
    const n = warriorsFor(0.9 * e);
    const a = addArmy(state, red, P('p50'), 'cinderWarrior', n);
    const b = addArmy(state, red, P('p17'), 'cinderWarrior', n);
    annex(state, red, P('p17'));
    expect(armyPower([a])).toBeLessThan(AI.warRatio * e);
    expect(armyPower([a, b])).toBeGreaterThanOrEqual(AI.warRatio * e);
    expect(war(state, red)).toEqual([]);
    b.location = P('p50');
    // The emptied army is no field army: it stays out of it.
    expect(war(state, red)).toEqual([moveCmd(red, [a, b], [P('p45')])]);
    expect(army.squads).toEqual([]);
  });
});

describe('makeWar: sieges first', () => {
  it('reinforces a siege short of the storm odds, without odds of its own', () => {
    const f = redField();
    const fort = f.state.nations[f.green]!.capital;
    annex(f.state, f.red, P('p33'));
    besiege(f.state, f.red, fort);
    f.army.location = P('p33');
    const defenders = defenderPower(f.state, fort);
    expect(armyPower([f.army])).toBeLessThan(AI.warRatio * defenders);
    expect(war(f.state, f.red)).toEqual([moveCmd(f.red, [f.army], [fort])]);
    // Enough there already: no more join.
    addArmy(f.state, f.red, fort, 'cinderWarrior', warriorsFor(AI.stormRatio * defenders));
    expect(war(f.state, f.red)).toEqual([]);
  });
});

describe('makeWar: Wellspring denial', () => {
  /**
   * Red owns every province but Green's capital and the Wellsprings p51 and p55, which Green
   * owns: two of three, enough to win once claimed. A Green army at home shuts the odds gate.
   */
  function denial() {
    const f = redField();
    const { state, red, green } = f;
    for (const p of Object.values(state.provinces)) if (p.owner === null) annex(state, red, p.id);
    annex(state, green, P('p51'));
    annex(state, green, P('p55'));
    addArmy(state, green, state.nations[green]!.capital, 'warden', 60, 'wardenCaptain');
    const priest = createCommander(state, 'grovePriest', green, P('p55'));
    return { ...f, priest };
  }

  it('targets the enemy Wellsprings past the gate, a claim under way first', () => {
    const { state, red, army, priest } = denial();
    priest.order = { kind: 'claimWellspring', daysLeft: 5 };
    expect(war(state, red)).toEqual([moveCmd(red, [army], findPathFor(state, [army], P('p55'))!)]);
    // No claim: unclaimed before claimed.
    priest.order = { kind: 'idle' };
    state.provinces[P('p55')]!.wellspringClaimedBy = state.provinces[P('p55')]!.owner;
    expect(war(state, red)).toEqual([moveCmd(red, [army], findPathFor(state, [army], P('p51'))!)]);
  });

  it('turns a field army on the move to deny the Wellspring', () => {
    const { state, red, army, capital } = denial();
    const elsewhere = findPathFor(state, [army], P('p28'))!;
    expect(applyCommand(state, moveCmd(red, [army], elsewhere))).toEqual({ ok: true });
    const legEnd = army.transit!.to;
    const out = war(state, red);
    expect(out).toEqual([moveCmd(red, [army], findPathFor(state, [army], P('p51'))!)]);
    expect(legEnd).not.toBe(capital);
  });

  it('waits for warFromMonth on Easy', () => {
    const { state, red, army } = denial();
    state.nations[red]!.ai = { difficulty: 'easy', memory: { target: null, lastPlanDay: 0 } };
    expect(war(state, red)).toEqual([]);
    // Month 12 begins on day 330.
    state.day = 11 * 30;
    expect(war(state, red)).toEqual([moveCmd(red, [army], findPathFor(state, [army], P('p51'))!)]);
  });

  it('attacks the first hostile province on the way when no Wellspring is in reach', () => {
    const f = redField();
    const { state, red, green, army, capital } = f;
    annex(state, green, P('p51'));
    annex(state, green, P('p55'));
    // From Red's land (its capital alone), the route toward the first Wellspring.
    const [first] = adjacencyRoute(state, [capital], P('p51'));
    expect(state.provinces[first!]!.owner).toBeNull();
    expect(war(state, red)).toEqual([moveCmd(red, [army], findPathFor(state, [army], first!)!)]);
    // The step is the nation's, not the army's: marching there, the army keeps its aim.
    expect(applyCommand(state, moveCmd(red, [army], findPathFor(state, [army], first!)!))).toEqual({
      ok: true,
    });
    expect(war(state, red)).toEqual([]);
  });
});

describe('makeWar: new targets', () => {
  it('takes the enemy capital when its defenders are weak, before richer provinces', () => {
    const f = redField();
    const { state, red, green } = f;
    const fort = state.nations[green]!.capital;
    for (const c of Object.values(state.commanders)) {
      if (c.owner === green && c.id !== state.provinces[fort]!.garrison)
        removeCommander(state, c.id);
    }
    annex(state, red, P('p33'));
    annex(state, green, P('p40')).pop = 50_000;
    state.provinces[fort]!.pop = 100;
    f.army.location = P('p33');
    expect(war(state, red)).toEqual([moveCmd(red, [f.army], [fort])]);
    // Out of reach of the capital, the richer province.
    state.provinces[fort]!.owner = null;
    expect(war(state, red)).toEqual([moveCmd(red, [f.army], [P('p40')])]);
  });
});
