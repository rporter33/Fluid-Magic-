// Defense of threatened provinces (docs/08-ai.md priority 5 "Defense"; Phase 7 design "5. Army
// pass" d): the capital first; the groups standing there kept as far as they are needed; else
// the nearest group (free, an escort, or re-pathed on the move) that covers the threat with the
// local defense, the groups there staying with it; else one PD level. Besieged forts are
// relief's. Relief and escorts live in defense.relief and defense.escort.
import { describe, expect, it } from 'vitest';
import { AI } from '../../src/content/ai';
import { createArmyPass, fixedDefense } from '../../src/ai/army';
import { armyPower, threat } from '../../src/ai/assess';
import { defendProvinces, escortClaims, relieveForts } from '../../src/ai/defense';
import { expansionTarget, planArmies } from '../../src/ai/military';
import { createPlan } from '../../src/ai/plan';
import { removeCommander } from '../../src/sim/commanders';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { NationId } from '../../src/sim/ids';
import { findPathFor } from '../../src/sim/movement';
import { pdCost } from '../../src/sim/pd';
import type { GameState } from '../../src/sim/types';
import { addArmy, annex, neighbors, redField } from '../sim/fixtures';
import { besiegeCapital, frontier, home, moveCmd, P, springField } from './armyFixtures';

function defense(state: GameState, red: NationId) {
  const pass = createArmyPass(createPlan(state, red));
  defendProvinces(pass);
  return pass;
}

describe('defendProvinces', () => {
  it('sends the nearest group whose power covers the threat', () => {
    const { state, red, capital, army, enemy, front } = frontier();
    const weak = addArmy(state, red, P('p17'), 'ashMilitia', 20);
    const near = addArmy(state, red, P('p50'), 'cinderWarrior', 45);
    const far = addArmy(state, red, capital, 'cinderWarrior', 60);
    const danger = armyPower([enemy]);
    expect(armyPower([weak])).toBeLessThan(danger);
    expect(armyPower([army])).toBeLessThan(danger);
    expect(armyPower([near])).toBeGreaterThan(danger);
    expect(armyPower([far])).toBeGreaterThan(danger);
    expect(defense(state, red).plan.out).toEqual([moveCmd(red, [near], [front])]);
  });

  it('defends the capital first', () => {
    // A Green army in p57 threatens the capital and p17 as well; Red's one field army, in p50,
    // borders all three.
    const { state, red, green, capital, army } = frontier();
    annex(state, green, P('p57'));
    addArmy(state, green, P('p57'), 'cinderWarrior', 40, 'wardenCaptain');
    army.squads = [];
    const helper = addArmy(state, red, P('p50'), 'cinderWarrior', 60);
    for (const p of [capital, P('p17'), P('p45')]) expect(threat(state, red, p)).toBeGreaterThan(0);
    expect(defense(state, red).plan.out).toEqual([moveCmd(red, [helper], [capital])]);
  });

  it('counts the PD toward the cover: a group weaker than the threat may cover it', () => {
    const { state, red, army, front } = frontier();
    army.squads = [];
    state.provinces[front]!.pd = 10;
    const helper = addArmy(state, red, P('p50'), 'cinderWarrior', 22);
    const danger = threat(state, red, front);
    expect(armyPower([helper])).toBeLessThan(danger);
    expect(armyPower([helper]) + fixedDefense(state, front)).toBeGreaterThan(danger);
    expect(defense(state, red).plan.out).toEqual([moveCmd(red, [helper], [front])]);
  });

  it('keeps a covering group standing there, and lets one that cannot cover go', () => {
    const { state, red, army, front } = frontier();
    const guard = addArmy(state, red, front, 'cinderWarrior', 45);
    const movesOf = (out: Command[]) =>
      out.filter((c) => c.type === 'move' && c.commanders.includes(guard.id));
    let plan = createPlan(state, red);
    planArmies(plan);
    expect(movesOf(plan.out)).toEqual([]);
    expect(plan.assigned.has(guard.id)).toBe(true);
    // Too weak, with no help in reach (the army at home has no troops), it is free: it walks
    // home to refill.
    guard.squads[0]!.count = 15;
    guard.squads[0]!.hp = 15 * 11;
    army.squads = [];
    plan = createPlan(state, red);
    planArmies(plan);
    expect(movesOf(plan.out)).toEqual([
      moveCmd(red, [guard], findPathFor(state, [guard], plan.capital.id)!),
    ]);
  });

  it('holds only the groups standing there that the threat needs, the strongest first', () => {
    const { state, red, enemy, front } = frontier();
    const strong = addArmy(state, red, front, 'cinderWarrior', 45);
    const spare = addArmy(state, red, front, 'cinderWarrior', 30);
    expect(armyPower([strong])).toBeGreaterThan(armyPower([enemy]));
    const pass = defense(state, red);
    expect(pass.plan.out).toEqual([]);
    expect(pass.plan.assigned.has(strong.id)).toBe(true);
    expect(pass.plan.assigned.has(spare.id)).toBe(false);
  });

  it('sends no help where the groups there match the threat exactly', () => {
    const { state, red, enemy, front } = frontier();
    const guard = addArmy(state, red, front, 'cinderWarrior', 40, 'wardenCaptain');
    const second = addArmy(state, red, P('p50'), 'cinderWarrior', 40);
    expect(armyPower([guard])).toBe(armyPower([enemy]));
    expect(fixedDefense(state, front) + armyPower([guard])).toBe(threat(state, red, front));
    const pass = defense(state, red);
    expect(pass.plan.out).toEqual([]);
    expect(pass.plan.assigned.has(guard.id)).toBe(true);
    expect(pass.plan.assigned.has(second.id)).toBe(false);
  });

  it('keeps the groups standing there when it sends help', () => {
    const { state, red, army, front } = frontier();
    army.squads = [];
    const there = addArmy(state, red, front, 'ashMilitia', 20);
    const helper = addArmy(state, red, P('p50'), 'cinderWarrior', 45);
    const pass = defense(state, red);
    expect(pass.plan.out).toEqual([moveCmd(red, [helper], [front])]);
    expect(pass.plan.assigned.has(there.id)).toBe(true);
  });

  it('re-paths a group on the move, or stops it where its leg ends', () => {
    const { state, red, capital, front } = frontier();
    const walker = addArmy(state, red, capital, 'cinderWarrior', 45);
    expect(applyCommand(state, moveCmd(red, [walker], [P('p17')]))).toEqual({ ok: true });
    expect(defense(state, red).plan.out).toEqual([moveCmd(red, [walker], [front])]);
    walker.transit = { from: P('p17'), to: front, progress: 1, totalDays: 3 };
    walker.location = P('p17');
    walker.order = { kind: 'move', path: [P('p50')], mapSpeed: 2 };
    expect(defense(state, red).plan.out).toEqual([
      { type: 'setOrder', nation: red, commander: walker.id, order: 'idle' },
    ]);
  });

  it("counts a group sent there earlier this call, such as a Wellspring's escort", () => {
    // A small Green army next to the Wellspring threatens it and p42; the escort sent from p42
    // covers the spring, so Red's other army defends p42.
    const { state, red, green, army, spring, next } = springField();
    const escort = addArmy(state, red, next, 'cinderWarrior', 30);
    const enemyAt = neighbors(state, spring).find((p) => state.provinces[p]!.owner === null)!;
    expect(neighbors(state, next)).toContain(enemyAt);
    annex(state, green, enemyAt);
    addArmy(state, green, enemyAt, 'cinderWarrior', 10, 'wardenCaptain');
    state.nations[red]!.gold = 0;
    const pass = createArmyPass(createPlan(state, red));
    escortClaims(pass);
    expect(pass.plan.out).toEqual([moveCmd(red, [escort], [spring])]);
    defendProvinces(pass);
    const ends = pass.plan.out.map((c) => (c.type === 'move' ? c.path.at(-1) : null));
    expect(ends).toEqual([spring, next]);
    expect(pass.plan.assigned.has(army.id)).toBe(true);
  });

  it('may take an escort when it is the only group that covers the threat', () => {
    const { state, red, green, army, capital, spring } = springField();
    const escort = addArmy(state, red, spring, 'cinderWarrior', 60);
    army.squads = [];
    annex(state, green, P('p50'));
    addArmy(state, green, P('p50'), 'cinderWarrior', 40, 'wardenCaptain');
    state.nations[red]!.gold = 0;
    const pass = createArmyPass(createPlan(state, red));
    escortClaims(pass);
    expect(pass.escorts.has(escort.id)).toBe(true);
    defendProvinces(pass);
    expect(pass.plan.out).toEqual([moveCmd(red, [escort], findPathFor(state, [escort], capital)!)]);
  });

  it('leaves a besieged fort to relief, whatever its PD would cover', () => {
    // Green besieges the capital (PD 10) and stands in Red's p17. The army in p50 is short of
    // relief's odds and cannot reach the gather point, p57; with the fort's PD it would cover
    // the threat there.
    const { state, red, green, capital, army } = home();
    army.location = P('p50');
    addArmy(state, red, P('p57'), 'cinderWarrior', 40);
    const besieger = besiegeCapital(state, green, capital, 40);
    addArmy(state, green, P('p17'), 'cinderWarrior', 5, 'wardenCaptain');
    state.provinces[capital]!.pd = 10;
    state.nations[red]!.gold = 0;
    expect(armyPower([army])).toBeLessThan(AI.reliefRatio * armyPower([besieger]));
    const danger = threat(state, red, capital);
    expect(armyPower([army]) + fixedDefense(state, capital)).toBeGreaterThan(danger);
    const pass = createArmyPass(createPlan(state, red));
    relieveForts(pass);
    expect(pass.gather).toBe('p57');
    expect(pass.plan.assigned.has(army.id)).toBe(false);
    const before = pass.plan.out.length;
    defendProvinces(pass);
    expect(pass.plan.out.slice(before)).toEqual([]);
  });

  it('keeps an outmatched capital its army when no group covers the threat', () => {
    // Seed 1: Green's 70 Cinder Warriors stand in p17, next to Red's capital; Red's one army is
    // home, and the independent p50 is a target Expansion would take it to.
    const { state, red, green, capital, army } = redField();
    annex(state, green, P('p17'));
    const enemy = addArmy(state, green, P('p17'), 'cinderWarrior', 70, 'wardenCaptain');
    state.nations[red]!.gold = 0;
    expect(armyPower([enemy])).toBeGreaterThan(armyPower([army]) + fixedDefense(state, capital));
    let plan = createPlan(state, red);
    expect(expansionTarget(plan, [army], new Set())).toBe('p50');
    planArmies(plan);
    expect(plan.out.filter((c) => c.type === 'move')).toEqual([]);
    expect(plan.assigned.has(army.id)).toBe(true);
    // With the threat gone, the army goes: War takes it to the empty p17.
    removeCommander(state, enemy.id);
    plan = createPlan(state, red);
    planArmies(plan);
    expect(plan.out.filter((c) => c.type === 'move')).toEqual([moveCmd(red, [army], [P('p17')])]);
  });

  it('buys one PD level with no covering group, from gold above the reserve', () => {
    const { state, red, front } = frontier();
    const cost = pdCost(0, 1);
    state.nations[red]!.gold = AI.goldReserve + cost - 1;
    expect(defense(state, red).plan.out).toEqual([]);
    state.nations[red]!.gold = AI.goldReserve + cost;
    expect(defense(state, red).plan.out).toEqual([
      { type: 'buyPd', nation: red, province: front, levels: 1 },
    ]);
  });
});
