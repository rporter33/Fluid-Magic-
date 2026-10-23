// The AI's planning copy and context (docs/08-ai.md decisions; Phase 7 design "Planning copy",
// "Paths", "Roles"): the copy deep-copies what commands write and shares the rest; issued
// commands apply on the copy only, make the ids the real state makes for the same commands, and
// keep off guarded commanders; paths are searched once per start and pace, against hostile
// provinces found once per call; one commander walks by the plan's paths.
import { describe, expect, it } from 'vitest';
import { createArmyPass } from '../../src/ai/army';
import { createPlan, fewestDays, isGuarded, planningCopy, walk } from '../../src/ai/plan';
import { createCommander, createSquad } from '../../src/sim/commanders';
import { applyCommand, type Command } from '../../src/sim/commands';
import { stateHash } from '../../src/sim/hash';
import type { ProvinceId } from '../../src/sim/ids';
import { hostileProvinces, pathsFrom } from '../../src/sim/movement';
import { cloneRng } from '../../src/sim/rng';
import { annex, commandersIn, neighbors, redField } from '../sim/fixtures';

/** Red with a rich treasury, troops in its capital garrison, and a free neighbor province. */
function rich() {
  const field = redField();
  const { state, red, capital } = field;
  state.nations[red]!.gold = 5000;
  state.provinces[capital]!.materials = 5000;
  const holder = state.commanders[state.provinces[capital]!.garrison!]!;
  holder.squads.push(createSquad(state, 'ashMilitia', 30));
  const next = annex(state, red, neighbors(state, capital)[0]!).id;
  return { ...field, holder, next };
}

describe('planningCopy', () => {
  it('copies provinces, nations, and commanders and shares everything else', () => {
    const { state } = rich();
    const copy = planningCopy(state);
    expect(stateHash(copy)).toBe(stateHash(state));
    for (const key of ['provinces', 'nations', 'commanders'] as const) {
      expect(copy[key]).toEqual(state[key]);
      expect(copy[key]).not.toBe(state[key]);
    }
    const [id] = Object.keys(state.commanders) as (keyof typeof state.commanders)[];
    expect(copy.commanders[id!]).not.toBe(state.commanders[id!]);
    for (const key of ['map', 'rng', 'provinceEffects', 'battles', 'messages'] as const) {
      expect(copy[key]).toBe(state[key]);
    }
    expect([copy.nextId, copy.day, copy.seed, copy.result]).toEqual([
      state.nextId,
      state.day,
      state.seed,
      state.result,
    ]);
  });
});

describe('createPlan', () => {
  it('applies issued commands on the copy only, recording the accepted ones in order', () => {
    const { state, red, green, capital, army, next } = rich();
    const hash = stateHash(state);
    const rng = cloneRng(state.rng);
    const messages = state.messages.length;
    const plan = createPlan(state, red);
    const tax: Command = { type: 'setTax', nation: red, province: capital, rate: 'high' };
    const march: Command = { type: 'move', nation: red, commanders: [army.id], path: [next] };
    const foreign: Command = {
      type: 'setTax',
      nation: red,
      province: state.nations[green]!.capital,
      rate: 'high',
    };
    expect(plan.issue(tax)).toBe(true);
    expect(plan.issue(foreign)).toBe(false);
    expect(plan.issue(march)).toBe(true);
    // On the copy the army's leg now ends in the neighbor, which does not border itself.
    expect(plan.issue(march)).toBe(false);
    expect(plan.out).toEqual([tax, march]);
    expect(plan.copy.provinces[capital]!.taxRate).toBe('high');
    expect(plan.copy.commanders[army.id]!.transit?.to).toBe(next);
    expect(stateHash(state)).toBe(hash);
    expect(state.rng).toEqual(rng);
    expect(state.messages).toHaveLength(messages);
    expect(army.transit).toBeNull();
  });

  it('makes the ids the real state makes for the same commands', () => {
    const { state, red, capital, army, holder } = rich();
    const plan = createPlan(state, red);
    const squad = holder.squads[0]!;
    const commands: Command[] = [
      { type: 'recruit', nation: red, province: capital, unit: 'ashMilitia', count: 20 },
      // Part of a squad: the rest stays behind under a new squad id.
      {
        type: 'transferSquad',
        nation: red,
        from: holder.id,
        to: army.id,
        squad: squad.id,
        count: 7,
      },
      { type: 'recruit', nation: red, province: capital, unit: 'ashChieftain', count: 1 },
      {
        type: 'transferSquad',
        nation: red,
        from: holder.id,
        to: army.id,
        squad: squad.id,
        count: 5,
      },
    ];
    for (const c of commands) expect(plan.issue(c)).toBe(true);
    expect(plan.copy.nextId).toBeGreaterThan(state.nextId);
    for (const c of plan.out) expect(applyCommand(state, c)).toEqual({ ok: true });
    expect(state.provinces[capital]!.recruitQueue.map((r) => r.id)).toEqual(
      plan.copy.provinces[capital]!.recruitQueue.map((r) => r.id),
    );
    expect(state.commanders[army.id]!.squads.map((s) => s.id)).toEqual(
      plan.copy.commanders[army.id]!.squads.map((s) => s.id),
    );
    expect(stateHash(state)).toBe(stateHash(plan.copy));
  });

  it('gives no order or move to a commander casting, claiming, or building', () => {
    const { state, red, capital, army, next } = rich();
    const priest = commandersIn(state, capital).find((c) => c.unit === 'pyrePriest')!;
    const scout = commandersIn(state, capital).find((c) => c.unit === 'cinderScout')!;
    priest.order = { kind: 'claimWellspring', daysLeft: 4 };
    scout.order = { kind: 'build', building: 'temple', province: capital };
    const plan = createPlan(state, red);
    expect(isGuarded(plan.copy.commanders[priest.id]!)).toBe(true);
    expect(isGuarded(plan.copy.commanders[army.id]!)).toBe(false);
    const refused: Command[] = [
      { type: 'setOrder', nation: red, commander: priest.id, order: 'preach' },
      { type: 'move', nation: red, commanders: [priest.id], path: [next] },
      { type: 'move', nation: red, commanders: [army.id, scout.id], path: [next] },
    ];
    for (const c of refused) {
      // The sim takes each of them; the plan does not.
      expect(applyCommand(planningCopy(state), c)).toEqual({ ok: true });
      expect(plan.issue(c)).toBe(false);
    }
    const allowed: Command = { type: 'setOrder', nation: red, commander: army.id, order: 'patrol' };
    expect(plan.issue(allowed)).toBe(true);
    expect(plan.out).toEqual([allowed]);
  });

  it('searches paths once per start and pace, from where each group would set out', () => {
    const { state, red, capital, army, next } = rich();
    const second = createCommander(state, 'ashChieftain', red, capital);
    second.squads.push(createSquad(state, 'cinderWarrior', 10));
    const scout = commandersIn(state, capital).find((c) => c.unit === 'cinderScout')!;
    const plan = createPlan(state, red);
    const [a, b, s] = [army, second, scout].map((c) => plan.copy.commanders[c.id]!);
    const ids = Object.keys(state.map.provinces) as ProvinceId[];
    // Both armies march at speed 2 from the capital; the scout alone at speed 3.
    expect(plan.paths([a!])).toBe(plan.paths([b!]));
    expect(plan.paths([s!])).not.toBe(plan.paths([a!]));
    for (const group of [[a!], [s!], [a!, s!]]) {
      const fresh = pathsFrom(plan.copy, group);
      for (const to of ids) expect(plan.paths(group).pathTo(to)).toEqual(fresh.pathTo(to));
    }
    expect(plan.issue({ type: 'move', nation: red, commanders: [a!.id], path: [next] })).toBe(true);
    const onward = neighbors(state, next).find((p) => p !== capital)!;
    expect(plan.paths([a!]).days(next)).toBe(0);
    expect(plan.paths([a!]).pathTo(onward)).toEqual(pathsFrom(plan.copy, [a!]).pathTo(onward));
    expect(plan.paths([b!]).days(capital)).toBe(0);
    // The hostile provinces are found once a call, and the army pass reads the same set.
    expect(plan.hostile()).toEqual(hostileProvinces(state, red));
    expect(plan.hostile()).toBe(plan.hostile());
    expect(createArmyPass(plan).hostile).toBe(plan.hostile());
  });

  it('walks one commander by the plan, unless it stands or already walks there', () => {
    const { state, red, capital, next } = rich();
    const scout = commandersIn(state, capital).find((c) => c.unit === 'cinderScout')!;
    let plan = createPlan(state, red);
    walk(plan, plan.copy.commanders[scout.id]!, capital);
    expect(plan.out).toEqual([]);
    walk(plan, plan.copy.commanders[scout.id]!, next);
    const moved: Command = { type: 'move', nation: red, commanders: [scout.id], path: [next] };
    expect(plan.out).toEqual([moved]);
    expect(applyCommand(state, moved)).toEqual({ ok: true });
    plan = createPlan(state, red);
    walk(plan, plan.copy.commanders[scout.id]!, next);
    expect(plan.out).toEqual([]);
  });

  it('picks the item with the fewest days, the first of equals', () => {
    const days = new Map([
      ['a', 4],
      ['b', 2],
      ['c', 2],
    ]);
    expect(fewestDays(['a', 'b', 'c', 'd'], (x) => days.get(x))).toBe('b');
    expect(fewestDays(['d'], (x) => days.get(x))).toBeNull();
  });

  it('reads the nation, its capital, commanders, roles, and provinces on the copy', () => {
    const { state, red, capital, army, holder, next } = rich();
    const plan = createPlan(state, red);
    expect(plan.nation).toBe(red);
    expect(plan.nationState).toBe(plan.copy.nations[red]);
    expect(plan.capital).toBe(plan.copy.provinces[capital]);
    const own = Object.values(plan.copy.commanders).filter((c) => c.owner === red);
    expect(plan.own()).toEqual(own);
    expect(plan.own().every((c) => plan.copy.commanders[c.id] === c)).toBe(true);
    expect(plan.withRole('leader').map((c) => c.id)).toEqual([army.id]);
    expect(plan.withRole('garrison').map((c) => c.id)).toEqual([holder.id]);
    expect(plan.role(plan.copy.commanders[army.id]!)).toBe('leader');
    expect(plan.at(capital)).toEqual(
      Object.values(plan.copy.commanders).filter((c) => c.location === capital),
    );
    expect(plan.at(capital).every((c) => plan.copy.commanders[c.id] === c)).toBe(true);
    expect(plan.owned()).toEqual(Object.values(plan.copy.provinces).filter((p) => p.owner === red));
    expect(plan.owned().map((p) => p.id)).toEqual(expect.arrayContaining([capital, next]));
    expect(plan.owned()).toHaveLength(2);
    expect(plan.owned().find((p) => p.id === capital)).toBe(plan.copy.provinces[capital]);
    expect(plan.assigned.size).toBe(0);
  });
});
