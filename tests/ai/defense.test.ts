// The army pass's defensive steps (docs/08-ai.md priorities 5 and 9; Phase 7 design "5. Army
// pass" a, c, d): relief of a besieged capital within bounded days, gathering against a strong
// besieger, escorts for Wellspring claims, and Defense by the nearest covering group, re-pathed
// when on the move, else one PD level.
import { describe, expect, it } from 'vitest';
import { AI } from '../../src/content/ai';
import { createArmyPass } from '../../src/ai/army';
import { armyPower } from '../../src/ai/assess';
import { defendProvinces, escortClaims, relieveForts } from '../../src/ai/defense';
import { planPretender, planPriests } from '../../src/ai/faith';
import { planArmies } from '../../src/ai/military';
import { createPlan } from '../../src/ai/plan';
import { createCommander } from '../../src/sim/commanders';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { findPathFor } from '../../src/sim/movement';
import { pdCost } from '../../src/sim/pd';
import { advance } from '../../src/sim/tick';
import type { CommanderState, GameState } from '../../src/sim/types';
import { addArmy, annex, commandersIn, redField } from '../sim/fixtures';

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

function moveCmd(red: NationId, members: readonly CommanderState[], path: ProvinceId[]): Command {
  return { type: 'move', nation: red, commanders: members.map((m) => m.id), path };
}

/**
 * Seed 1: Red's capital p48 with its neighbors p17, p50, and p57 annexed; p50 and p57 are
 * apart (through p17 or the capital).
 */
function home() {
  const f = redField();
  for (const p of ['p17', 'p50', 'p57'] as ProvinceId[]) annex(f.state, f.red, p);
  expect(f.capital).toBe('p48');
  return f;
}

/** Green lays siege to Red's capital with these besiegers. */
function besiegeCapital(state: GameState, green: NationId, capital: ProvinceId, troops: number) {
  const besieger =
    troops > 0
      ? addArmy(state, green, capital, 'cinderWarrior', troops, 'wardenCaptain')
      : createCommander(state, 'wardenCaptain', green, capital);
  state.provinces[capital]!.siege = { attacker: green, wallHp: 300, storm: false };
  return besieger;
}

describe('relief', () => {
  it('attacks a lone besieger of the capital within bounded days', () => {
    const { state, red, green, capital, army } = home();
    army.location = 'p50' as ProvinceId;
    const besieger = besiegeCapital(state, green, capital, 0);
    const days = play(state, red, 30, () => state.provinces[capital]!.siege === null);
    expect(days).toBeLessThanOrEqual(10);
    expect(state.commanders[besieger.id]?.location).not.toBe(capital);
    expect(state.provinces[capital]!.owner).toBe(red);
  });

  it('sallies from inside the fort through an exit when strong enough', () => {
    const { state, red, green, capital, army } = home();
    besiegeCapital(state, green, capital, 0);
    const pass = createArmyPass(createPlan(state, red));
    relieveForts(pass);
    expect(pass.plan.out).toEqual([moveCmd(red, [army], ['p17' as ProvinceId, capital])]);
  });

  it('gathers armies too weak alone next to the fort, then goes in as one', () => {
    const { state, red, green, capital, army } = home();
    army.location = 'p50' as ProvinceId;
    const strong = addArmy(state, red, 'p57' as ProvinceId, 'cinderWarrior', 30);
    const besieger = besiegeCapital(state, green, capital, 40);
    const need = AI.reliefRatio * armyPower([besieger]);
    expect(armyPower([army])).toBeLessThan(need);
    expect(armyPower([strong])).toBeLessThan(need);
    expect(armyPower([army, strong])).toBeGreaterThanOrEqual(need);
    // The gather point is the exit nearest the strongest group: where it stands.
    let pass = createArmyPass(createPlan(state, red));
    relieveForts(pass);
    expect(pass.gather).toBe('p57');
    expect(pass.plan.out).toEqual([moveCmd(red, [army], ['p17', 'p57'] as ProvinceId[])]);
    // Once together they go in with one move.
    army.location = 'p57' as ProvinceId;
    pass = createArmyPass(createPlan(state, red));
    relieveForts(pass);
    expect(pass.plan.out).toEqual([moveCmd(red, [army, strong], [capital])]);
  });

  it('holds the groups inside and sends the rest home to the gather point', () => {
    const { state, red, green, capital, army } = home();
    const inside = addArmy(state, red, capital, 'ashMilitia', 5);
    const besieger = besiegeCapital(state, green, capital, 60);
    expect(armyPower([army, inside])).toBeLessThan(AI.reliefRatio * armyPower([besieger]));
    const far = annex(state, red, 'p45' as ProvinceId).id;
    const small = addArmy(state, red, far, 'ashMilitia', 5);
    const plan = createPlan(state, red);
    planArmies(plan);
    const moves = plan.out.filter((c) => c.type === 'move');
    // The exit nearest p45 by days is p50, on the plains.
    expect(moves).toEqual([moveCmd(red, [small], ['p50' as ProvinceId])]);
    expect(plan.assigned.has(army.id) && plan.assigned.has(inside.id)).toBe(true);
  });
});

describe('the march home while the capital is besieged', () => {
  it('goes to the gather point, not into the capital', () => {
    const { state, red, green, capital, army } = home();
    const besieger = besiegeCapital(state, green, capital, 10);
    const far = annex(state, red, 'p45' as ProvinceId).id;
    const small = addArmy(state, red, far, 'ashMilitia', 5);
    expect(armyPower([small])).toBeLessThan(AI.reliefRatio * armyPower([besieger]));
    const plan = createPlan(state, red);
    planArmies(plan);
    // The army inside sallies; the small one, which relief did not take, gathers at p50.
    expect(plan.out.filter((c) => c.type === 'move')).toEqual([
      moveCmd(red, [army], ['p17' as ProvinceId, capital]),
      moveCmd(red, [small], ['p50' as ProvinceId]),
    ]);
  });
});

describe('escortClaims', () => {
  /** Seed 1: Red owns the Wellspring p51 and its neighbor p42, where its priest walks from. */
  function springField() {
    const f = redField();
    const spring = annex(f.state, f.red, 'p51' as ProvinceId).id;
    const next = annex(f.state, f.red, 'p42' as ProvinceId).id;
    const priest = commandersIn(f.state, f.capital).find((c) => c.unit === 'pyrePriest')!;
    priest.location = next;
    expect(applyCommand(f.state, moveCmd(f.red, [priest], [spring]))).toEqual({ ok: true });
    return { ...f, spring, next, priest };
  }

  it('sends the nearest free army to stand with a priest walking to claim', () => {
    const { state, red, army, spring, next } = springField();
    const far = addArmy(state, red, army.location, 'cinderWarrior', 30);
    army.location = next;
    const pass = createArmyPass(createPlan(state, red));
    escortClaims(pass);
    expect(pass.plan.out).toEqual([moveCmd(red, [army], [spring])]);
    expect(pass.plan.assigned.has(far.id)).toBe(false);
  });

  it('keeps an army already there as the escort, whatever else could take it', () => {
    const { state, red, army, spring } = springField();
    army.location = spring;
    const plan = createPlan(state, red);
    planArmies(plan);
    expect(plan.out.filter((c) => c.type === 'move')).toEqual([]);
  });

  it('lets the priest go alone with no free army', () => {
    const { state, red, army } = springField();
    army.squads = [];
    const pass = createArmyPass(createPlan(state, red));
    escortClaims(pass);
    expect(pass.plan.out).toEqual([]);
  });
});

describe('defendProvinces', () => {
  /**
   * Seed 1: Red owns p45 next to Green's p3, where a Green army stands, and p50 and p17 next to
   * p45; p3 touches no other Red province, so only p45 is threatened.
   */
  function frontier() {
    const f = redField();
    for (const p of ['p17', 'p50', 'p45'] as ProvinceId[]) annex(f.state, f.red, p);
    annex(f.state, f.green, 'p3' as ProvinceId);
    const enemy = addArmy(
      f.state,
      f.green,
      'p3' as ProvinceId,
      'cinderWarrior',
      40,
      'wardenCaptain',
    );
    f.state.nations[f.red]!.gold = 0;
    return { ...f, enemy, front: 'p45' as ProvinceId };
  }

  it('sends the nearest group whose power covers the threat', () => {
    const { state, red, capital, army, enemy, front } = frontier();
    const weak = addArmy(state, red, 'p17' as ProvinceId, 'ashMilitia', 20);
    const near = addArmy(state, red, 'p50' as ProvinceId, 'cinderWarrior', 45);
    const far = addArmy(state, red, capital, 'cinderWarrior', 60);
    const threat = armyPower([enemy]);
    expect(armyPower([weak])).toBeLessThan(threat);
    expect(armyPower([army])).toBeLessThan(threat);
    expect(armyPower([near])).toBeGreaterThan(threat);
    expect(armyPower([far])).toBeGreaterThan(threat);
    const pass = createArmyPass(createPlan(state, red));
    defendProvinces(pass);
    expect(pass.plan.out).toEqual([moveCmd(red, [near], [front])]);
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

  it('re-paths a group on the move, or stops it where its leg ends', () => {
    const { state, red, capital, front } = frontier();
    const walker = addArmy(state, red, capital, 'cinderWarrior', 45);
    expect(applyCommand(state, moveCmd(red, [walker], ['p17' as ProvinceId]))).toEqual({
      ok: true,
    });
    let pass = createArmyPass(createPlan(state, red));
    defendProvinces(pass);
    expect(pass.plan.out).toEqual([moveCmd(red, [walker], [front])]);
    walker.transit = { from: 'p17' as ProvinceId, to: front, progress: 1, totalDays: 3 };
    walker.location = 'p17' as ProvinceId;
    walker.order = { kind: 'move', path: ['p50' as ProvinceId], mapSpeed: 2 };
    pass = createArmyPass(createPlan(state, red));
    defendProvinces(pass);
    expect(pass.plan.out).toEqual([
      { type: 'setOrder', nation: red, commander: walker.id, order: 'idle' },
    ]);
  });

  it('buys one PD level with no covering group, from gold above the reserve', () => {
    const { state, red, front } = frontier();
    const cost = pdCost(0, 1);
    state.nations[red]!.gold = AI.goldReserve + cost - 1;
    let pass = createArmyPass(createPlan(state, red));
    defendProvinces(pass);
    expect(pass.plan.out).toEqual([]);
    state.nations[red]!.gold = AI.goldReserve + cost;
    pass = createArmyPass(createPlan(state, red));
    defendProvinces(pass);
    expect(pass.plan.out).toEqual([{ type: 'buyPd', nation: red, province: front, levels: 1 }]);
  });
});
