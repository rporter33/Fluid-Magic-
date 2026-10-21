// The army pass's sieges and War's first targets (docs/08-ai.md priorities 6 and 7; Phase 7
// design "5. Army pass" b, e): storm odds and holding a siege, the keyed pillage draw (leaders
// only, once per leader and fort) and no pillage anywhere else; sieges reinforced while short of
// the storm odds, and Wellspring denial past the aggression gate but not before warFromMonth.
// The odds gate, marches, and new targets live in war.targets.
import { describe, expect, it } from 'vitest';
import { AI } from '../../src/content/ai';
import { adjacencyRoute, createArmyPass } from '../../src/ai/army';
import { armyPower, defenderPower } from '../../src/ai/assess';
import { planArmies } from '../../src/ai/military';
import { createPlan } from '../../src/ai/plan';
import { keyedRng } from '../../src/ai/rng';
import { holdSieges, makeWar } from '../../src/ai/war';
import { createCommander, removeCommander } from '../../src/sim/commanders';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { NationId } from '../../src/sim/ids';
import { findPathFor } from '../../src/sim/movement';
import { chance, createRng } from '../../src/sim/rng';
import { nationDefOf } from '../../src/sim/state';
import type { GameState } from '../../src/sim/types';
import { addArmy, annex, besiege, redField } from '../sim/fixtures';
import { moveCmd, P, setTroops, warriorsFor } from './armyFixtures';

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
    // More than the defenders, but short of the storm odds.
    setTroops(first, warriorsFor(1.1 * defenders));
    expect(armyPower([first])).toBeGreaterThan(defenders);
    expect(armyPower([first])).toBeLessThan(AI.stormRatio * defenders);
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

  it('draws each besieging leader its pillage once per fort, at the nation personality', () => {
    const { state, red, green, fort, first } = siegeField();
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
    // At another fort the same leaders draw anew: about 2 x 0.6 x 0.4 of them differ.
    const other = annex(state, green, P('p45')).id;
    addArmy(state, green, other, 'cinderWarrior', 5, 'wardenCaptain');
    state.provinces[fort]!.siege = null;
    state.provinces[other]!.siege = { attacker: red, wallHp: 300, storm: false };
    for (const c of [first, ...leaders]) {
      c.location = other;
      c.order = { kind: 'idle' };
    }
    const there = new Set(pillagers(sieges(state, red).plan.out));
    const differ = [first, ...leaders].filter((c) => drawn.includes(c.id) !== there.has(c.id));
    expect(differ.length / (leaders.length + 1)).toBeGreaterThan(0.4);
  });

  it('draws a pillage for besieging leaders only', () => {
    const { state, red, fort } = siegeField();
    const others = [
      ...Array.from({ length: 6 }, () => createCommander(state, 'salamander', red, fort)),
      ...Array.from({ length: 6 }, () => createCommander(state, 'emberAdept', red, fort)),
    ];
    // Some of them would draw Pillage, were they leaders.
    const odds = nationDefOf(state, red).ai.pillage;
    expect(others.some((c) => chance(keyedRng(state, red, c.id, fort), odds))).toBe(true);
    const ordered = sieges(state, red).plan.out.map((c) =>
      c.type === 'setOrder' ? c.commander : null,
    );
    for (const c of others) expect(ordered).not.toContain(c.id);
  });

  it('stops the pillage of besiegers that storm', () => {
    const { state, red, green, fort, first } = siegeField();
    // A leader whose draw at this fort is Pillage keeps it while the siege is only held.
    let pillager = first;
    const odds = nationDefOf(state, red).ai.pillage;
    while (!chance(keyedRng(state, red, pillager.id, fort), odds)) {
      pillager = createCommander(state, 'ashChieftain', red, fort);
    }
    pillager.order = { kind: 'pillage' };
    expect(sieges(state, red).plan.out).toEqual([]);
    // Storming the emptied fort, it stops: a won storm makes the province Red's own.
    for (const c of Object.values(state.commanders)) {
      if (c.owner === green && c.location === fort && c.id !== state.provinces[fort]!.garrison) {
        removeCommander(state, c.id);
      }
    }
    expect(sieges(state, red).plan.out).toEqual([
      { type: 'storm', nation: red, province: fort },
      { type: 'setOrder', nation: red, commander: pillager.id, order: 'idle' },
    ]);
  });

  it('ends a pillage held anywhere but at a siege, even where Defense holds the army', () => {
    // The fort the army pillaged fell: it stands pillaging its own province, p50, with a small
    // Green army next door, so Defense keeps it there.
    const { state, red, green, army } = redField();
    annex(state, red, P('p50'));
    annex(state, green, P('p45'));
    army.location = P('p50');
    army.order = { kind: 'pillage' };
    addArmy(state, green, P('p45'), 'cinderWarrior', 5, 'wardenCaptain');
    const idle: Command = { type: 'setOrder', nation: red, commander: army.id, order: 'idle' };
    expect(sieges(state, red).plan.out).toEqual([idle]);
    const plan = createPlan(state, red);
    planArmies(plan);
    expect(plan.out.filter((c) => JSON.stringify(c).includes(army.id))).toEqual([idle]);
    expect(plan.assigned.has(army.id)).toBe(true);
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

  it('counts the armies on the way there toward the storm odds', () => {
    // Red besieges Green's p45 with a small army, and a second marches there from p50 that
    // brings the siege past the storm odds; Red's army in p50 cannot take p45 by itself.
    const { state, red, green, army } = redField();
    annex(state, red, P('p50'));
    annex(state, green, P('p45'));
    addArmy(state, green, P('p45'), 'cinderWarrior', 30, 'wardenCaptain');
    const besieger = besiege(state, red, P('p45'));
    const defenders = defenderPower(state, P('p45'));
    const marcher = addArmy(state, red, P('p50'), 'cinderWarrior', 40);
    expect(applyCommand(state, moveCmd(red, [marcher], [P('p45')]))).toEqual({ ok: true });
    army.location = P('p50');
    expect(armyPower([besieger])).toBeLessThan(AI.stormRatio * defenders);
    expect(armyPower([besieger, marcher])).toBeGreaterThanOrEqual(AI.stormRatio * defenders);
    expect(armyPower([army])).toBeLessThan(AI.warRatio * defenders);
    expect(war(state, red)).toEqual([]);
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
