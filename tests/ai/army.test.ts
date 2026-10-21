// The army pass's shared tools (Phase 7 design "Groups and free armies", "5. Army pass"): which
// groups a step may take, days to a province including a leg under way, sending a group as one
// move, the adjacency route, and what defends a province without commanders.
import { describe, expect, it } from 'vitest';
import { unitDef } from '../../src/content';
import { AI } from '../../src/content/ai';
import {
  adjacencyRoute,
  createArmyPass,
  daysTo,
  distanceFactor,
  eligibleGroups,
  fixedDefense,
  provinceValue,
  send,
} from '../../src/ai/army';
import { troopPower } from '../../src/ai/assess';
import { createPlan } from '../../src/ai/plan';
import { createCommander, createSquad } from '../../src/sim/commanders';
import type { ProvinceId } from '../../src/sim/ids';
import { findPathFor, pathDays } from '../../src/sim/movement';
import { addArmy, annex, besiege, move, neighbors, redField } from '../sim/fixtures';

/** Red's field with its capital's first two neighbors annexed. */
function field() {
  const f = redField();
  const [near, other] = neighbors(f.state, f.capital) as [ProvinceId, ProvinceId];
  annex(f.state, f.red, near);
  annex(f.state, f.red, other);
  return { ...f, near, other };
}

/** The leaders of the groups a fresh pass finds eligible with these options. */
function eligible(f: ReturnType<typeof field>, options: Parameters<typeof eligibleGroups>[1]) {
  return eligibleGroups(createArmyPass(createPlan(f.state, f.red)), options).map(
    (g) => g.leader.id,
  );
}

describe('eligibleGroups', () => {
  it('takes standing field armies; smaller ones, movers, and escorts only when asked', () => {
    const f = field();
    const { state, red, capital, army, near, other } = f;
    const small = addArmy(state, red, capital, 'ashMilitia', AI.fieldArmyTroops - 1);
    const marching = addArmy(state, red, capital, 'ashMilitia', AI.fieldArmyTroops);
    move(state, red, [marching], [near]);
    expect(eligible(f, {})).toEqual([army.id]);
    expect(eligible(f, { anySize: true })).toEqual([army.id, small.id]);
    expect(eligible(f, { moving: true })).toEqual([army.id, marching.id]);
    // A leg ending among hostiles cannot be re-pathed.
    const hostile = neighbors(state, near).find((n) => state.provinces[n]!.owner === null)!;
    marching.transit = { from: near, to: hostile, progress: 0, totalDays: 3 };
    marching.location = near;
    expect(eligible(f, { moving: true })).toEqual([army.id]);
    // Besiegers and assigned groups never.
    const siege = besiege(state, red, other);
    siege.squads.push(createSquad(state, 'cinderWarrior', 20));
    state.provinces[other]!.owner = f.green;
    expect(eligible(f, { anySize: true })).toEqual([army.id, small.id]);
    const pass = createArmyPass(createPlan(state, red));
    pass.plan.assigned.add(army.id);
    expect(eligibleGroups(pass).map((g) => g.leader.id)).toEqual([]);
    pass.escorts.add(small.id);
    expect(eligibleGroups(pass, { anySize: true }).map((g) => g.leader.id)).toEqual([]);
    expect(eligibleGroups(pass, { anySize: true, escorts: true }).map((g) => g.leader.id)).toEqual([
      small.id,
    ]);
  });
});

describe('daysTo', () => {
  it('counts nothing where a group stands, else the leg left plus the path from its end', () => {
    const { state, red, capital, army, near } = field();
    const plan = createPlan(state, red);
    expect(daysTo(plan, [army], capital)).toBe(0);
    const far = neighbors(state, near).find((n) => n !== capital)!;
    const path = findPathFor(state, [army], far)!;
    expect(daysTo(plan, [army], far)).toBe(pathDays(state, path, 2));
    move(state, red, [army], [near]);
    army.transit!.progress = 1;
    const moving = createPlan(state, red);
    const legLeft = army.transit!.totalDays - 1;
    expect(daysTo(moving, [army], near)).toBe(legLeft);
    expect(daysTo(moving, [army], capital)).toBe(legLeft + pathDays(state, [capital], 2));
  });
});

describe('send', () => {
  it('issues one move listing the whole group, and assigns it', () => {
    const { state, red, capital, army, near } = field();
    const rider = createCommander(state, 'salamander', red, capital);
    const pass = createArmyPass(createPlan(state, red));
    const far = neighbors(state, near).find((n) => n !== capital)!;
    expect(send(pass, [army, rider], far)).toBe(true);
    expect(pass.plan.out).toEqual([
      {
        type: 'move',
        nation: red,
        commanders: [army.id, rider.id],
        path: findPathFor(state, [army, rider], far),
      },
    ]);
    expect([...pass.plan.assigned]).toEqual([army.id, rider.id]);
  });

  it('issues nothing for a group standing or marching there, and stops a leg ending there', () => {
    const { state, red, capital, army, near } = field();
    let pass = createArmyPass(createPlan(state, red));
    expect(send(pass, [army], capital)).toBe(true);
    expect(pass.plan.out).toEqual([]);
    expect(pass.plan.assigned.has(army.id)).toBe(true);
    const far = neighbors(state, near).find((n) => n !== capital)!;
    move(state, red, [army], findPathFor(state, [army], far)!);
    pass = createArmyPass(createPlan(state, red));
    expect(send(pass, [army], far)).toBe(true);
    expect(pass.plan.out).toEqual([]);
    // Its leg ends next door: it stops there.
    pass = createArmyPass(createPlan(state, red));
    expect(send(pass, [army], army.transit!.to)).toBe(true);
    expect(pass.plan.out).toEqual([
      { type: 'setOrder', nation: red, commander: army.id, order: 'idle' },
    ]);
    expect(pass.plan.copy.commanders[army.id]!.transit?.to).toBe(army.transit!.to);
  });

  it('is false, issuing and assigning nothing, where no path leads', () => {
    const { state, red, army, green } = field();
    const pass = createArmyPass(createPlan(state, red));
    // Beyond the first hostile province no path leads.
    const deep = state.nations[green]!.capital;
    expect(send(pass, [army], deep)).toBe(false);
    expect(pass.plan.out).toEqual([]);
    expect(pass.plan.assigned.size).toBe(0);
  });
});

describe('adjacencyRoute', () => {
  it('is the fewest hops from the nearest start, whoever owns the provinces', () => {
    const { state, red, capital, green } = field();
    const plan = createPlan(state, red);
    const to = state.nations[green]!.capital;
    const route = adjacencyRoute(plan.copy, [capital], to);
    expect(route.at(-1)).toBe(to);
    let at = capital;
    for (const p of route) {
      expect(neighbors(state, at)).toContain(p);
      at = p;
    }
    // No shorter route: a breadth-first count of hops agrees.
    const hops = new Map<ProvinceId, number>([[capital, 0]]);
    const queue = [capital];
    while (queue.length > 0) {
      const p = queue.shift()!;
      for (const n of neighbors(state, p)) {
        if (!hops.has(n)) {
          hops.set(n, hops.get(p)! + 1);
          queue.push(n);
        }
      }
    }
    expect(route.length).toBe(hops.get(to));
    expect(adjacencyRoute(plan.copy, [capital], capital)).toEqual([]);
    // From several starts, the route leaves from the nearest.
    const [start, ...rest] = route;
    expect(adjacencyRoute(plan.copy, [to, capital], start!)).toEqual([start]);
    expect(adjacencyRoute(plan.copy, [to, start!], start!)).toEqual([]);
    expect(adjacencyRoute(plan.copy, [capital, start!], to)).toEqual(rest);
  });
});

describe('fixedDefense, provinceValue, distanceFactor', () => {
  it('count the garrison troops and the PD force, the value of a province, and its distance', () => {
    const { state, red, capital, near } = field();
    expect(fixedDefense(state, near)).toBe(0);
    state.provinces[near]!.pd = 5;
    // PD 5: 10 Ash Militia and 1 Flame Archer.
    const militia = troopPower(unitDef('ashMilitia'));
    const archer = troopPower(unitDef('flameArcher'));
    expect(fixedDefense(state, near)).toBeCloseTo(10 * militia + archer, 10);
    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    holder.squads.push(createSquad(state, 'ashMilitia', 20));
    expect(fixedDefense(state, capital)).toBeCloseTo(20 * militia, 10);

    const map = state.map.provinces[near]!;
    expect(provinceValue(state, near)).toBeCloseTo(
      state.provinces[near]!.pop / AI.score.popPer + map.springs.length * AI.score.spring,
      10,
    );
    const spring = state.map.wellsprings[0]!;
    expect(provinceValue(state, spring)).toBeCloseTo(
      state.provinces[spring]!.pop / AI.score.popPer +
        state.map.provinces[spring]!.springs.length * AI.score.spring +
        AI.score.wellspring,
      10,
    );
    // Cinder Horde's expansion is 0.8: a fifth of the penalty per day.
    const plan = createPlan(state, red);
    expect(distanceFactor(plan, 0)).toBe(1);
    expect(distanceFactor(plan, 10)).toBeCloseTo(1 / (1 + AI.distancePenalty * 0.2 * 10), 10);
  });
});
