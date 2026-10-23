// Relief of own besieged forts (docs/08-ai.md priority 5 "Relief"; Phase 7 design "5. Army
// pass" a): a lone besieger driven off within bounded days, a sally through an exit, the
// AI.reliefRatio rule, groups gathering next to the fort (the exit nearest the strongest group,
// ties by index) and going in as one, groups on the move re-pathed, and the march home to the
// gather point while the capital is besieged.
import { describe, expect, it } from 'vitest';
import { AI } from '../../src/content/ai';
import { createArmyPass, daysTo } from '../../src/ai/army';
import { armyPower } from '../../src/ai/assess';
import { relieveForts } from '../../src/ai/defense';
import { planPretender, planPriests } from '../../src/ai/faith';
import { planArmies } from '../../src/ai/military';
import { createPlan } from '../../src/ai/plan';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { NationId } from '../../src/sim/ids';
import { findPathFor } from '../../src/sim/movement';
import { advance } from '../../src/sim/tick';
import type { GameState } from '../../src/sim/types';
import { addArmy, annex, neighbors } from '../sim/fixtures';
import { besiegeCapital, home, moveCmd, P } from './armyFixtures';

/** This lane's steps as a player: priests, the army pass, and the pretender. */
function lane(state: GameState, nation: NationId): Command[] {
  const plan = createPlan(state, nation);
  planPriests(plan);
  planArmies(plan);
  planPretender(plan);
  return plan.out;
}

/** Plays days with Red planning every 5 days through `lane`, every command accepted. */
function play(state: GameState, red: NationId, days: number, until: () => boolean): number {
  for (let d = 0; d < days; d++) {
    if (state.day % 5 === 0) {
      for (const cmd of lane(state, red)) expect(applyCommand(state, cmd)).toEqual({ ok: true });
    }
    if (until()) return d;
    advance(state);
  }
  return days;
}

function relief(state: GameState, red: NationId) {
  const pass = createArmyPass(createPlan(state, red));
  relieveForts(pass);
  return pass;
}

describe('relief', () => {
  it('attacks a lone besieger of the capital within bounded days', () => {
    const { state, red, green, capital, army } = home();
    army.location = P('p15');
    const besieger = besiegeCapital(state, green, capital, 0);
    const days = play(state, red, 30, () => state.provinces[capital]!.siege === null);
    expect(days).toBeLessThanOrEqual(10);
    expect(state.commanders[besieger.id]?.location).not.toBe(capital);
    expect(state.provinces[capital]!.owner).toBe(red);
  });

  it('sallies from inside the fort through an exit when strong enough', () => {
    const { state, red, green, capital, army } = home();
    besiegeCapital(state, green, capital, 0);
    // Out through the first exit and back in.
    expect(relief(state, red).plan.out).toEqual([moveCmd(red, [army], [P('p15'), capital])]);
  });

  it(`goes in only with ${String(AI.reliefRatio)} times the besiegers, not merely more`, () => {
    const { state, red, green, capital, army } = home();
    army.location = P('p15');
    const besieger = besiegeCapital(state, green, capital, 25);
    expect(armyPower([army])).toBeGreaterThan(armyPower([besieger]));
    expect(armyPower([army])).toBeLessThan(AI.reliefRatio * armyPower([besieger]));
    // It is the strongest group outside, so it waits where it stands: the gather point.
    const pass = relief(state, red);
    expect(pass.gather).toBe('p15');
    expect(pass.plan.out).toEqual([]);
    expect(pass.plan.assigned.has(army.id)).toBe(true);
  });

  it("re-paths a group on the move from its leg's end", () => {
    const { state, red, green, capital, army } = home();
    army.location = P('p15');
    expect(applyCommand(state, moveCmd(red, [army], [P('p19'), P('p29')]))).toEqual({ ok: true });
    expect(army.transit?.to).toBe('p19');
    besiegeCapital(state, green, capital, 0);
    expect(relief(state, red).plan.out).toEqual([moveCmd(red, [army], [capital])]);
  });

  it('gathers armies too weak alone next to the fort, then goes in as one', () => {
    const { state, red, green, capital, army } = home();
    army.location = P('p15');
    const strong = addArmy(state, red, P('p29'), 'cinderWarrior', 30);
    const besieger = besiegeCapital(state, green, capital, 40);
    const need = AI.reliefRatio * armyPower([besieger]);
    expect(armyPower([army])).toBeLessThan(need);
    expect(armyPower([strong])).toBeLessThan(need);
    expect(armyPower([army, strong])).toBeGreaterThanOrEqual(need);
    // The gather point is the exit nearest the strongest group: where it stands.
    let pass = relief(state, red);
    expect(pass.gather).toBe('p29');
    expect(pass.plan.out).toEqual([moveCmd(red, [army], [P('p19'), P('p29')])]);
    // Once together they go in with one move.
    army.location = P('p29');
    pass = relief(state, red);
    expect(pass.plan.out).toEqual([moveCmd(red, [army, strong], [capital])]);
  });

  it('gathers at the exit of lower index when two are as near the strongest group', () => {
    // Seed 1: with Red owning all but Green's capital and its neighbors, p6 is 21 days from both
    // p15 and p19 (and 26 from p29); no province within 2 hops of the capital ties.
    const { state, red, green, capital, army } = home();
    const enemy = state.nations[green]!.capital;
    const near = new Set([enemy, ...neighbors(state, enemy)]);
    for (const p of Object.values(state.provinces)) {
      if (p.owner === null && !near.has(p.id)) annex(state, red, p.id);
    }
    army.location = P('p6');
    besiegeCapital(state, green, capital, 200);
    const plan = createPlan(state, red);
    expect(daysTo(plan, [army], P('p15'))).toBe(daysTo(plan, [army], P('p19')));
    expect(daysTo(plan, [army], P('p15'))).toBeLessThan(daysTo(plan, [army], P('p29'))!);
    const pass = relief(state, red);
    expect(pass.gather).toBe('p15');
    expect(pass.plan.out).toEqual([moveCmd(red, [army], findPathFor(state, [army], P('p15'))!)]);
  });

  it('holds the groups inside and sends the rest home to the gather point', () => {
    const { state, red, green, capital, army } = home();
    const inside = addArmy(state, red, capital, 'ashMilitia', 5);
    const besieger = besiegeCapital(state, green, capital, 60);
    expect(armyPower([army, inside])).toBeLessThan(AI.reliefRatio * armyPower([besieger]));
    const far = annex(state, red, P('p10')).id;
    const small = addArmy(state, red, far, 'ashMilitia', 5);
    const plan = createPlan(state, red);
    planArmies(plan);
    const moves = plan.out.filter((c) => c.type === 'move');
    // The exit nearest p10 by days is p15, on the plains (p19 is wasteland).
    expect(moves).toEqual([moveCmd(red, [small], [P('p15')])]);
    expect(plan.assigned.has(army.id) && plan.assigned.has(inside.id)).toBe(true);
  });
});

describe('the march home while the capital is besieged', () => {
  it('goes to the gather point, not into the capital', () => {
    const { state, red, green, capital, army } = home();
    const besieger = besiegeCapital(state, green, capital, 10);
    const far = annex(state, red, P('p10')).id;
    const small = addArmy(state, red, far, 'ashMilitia', 5);
    expect(armyPower([small])).toBeLessThan(AI.reliefRatio * armyPower([besieger]));
    const plan = createPlan(state, red);
    planArmies(plan);
    // The army inside sallies; the small one, which relief did not take, gathers at p15.
    expect(plan.out.filter((c) => c.type === 'move')).toEqual([
      moveCmd(red, [army], [P('p15'), capital]),
      moveCmd(red, [small], [P('p15')]),
    ]);
  });
});
