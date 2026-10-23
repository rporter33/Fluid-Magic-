// The AI's recruitment step (docs/08-ai.md priority 2; Phase 7 design "2. Recruitment and
// transfers"): quotas rounded down, the capital queue kept 1 to 2 deep with one commander at a
// time, the 2:1 troop mix, batches of 20 or 10 and the fallbacks, personality weights, the
// garrison reserve from day 0, and summons handed to the garrison.
import { describe, expect, it } from 'vitest';
import { nationDef, type UnitTypeId } from '../../src/content';
import { AI } from '../../src/content/ai';
import { createPlan, type Plan } from '../../src/ai/plan';
import { quota, roleCount, troopMix, troopWeight, wantsRanged } from '../../src/ai/recruit';
import { unitRole } from '../../src/ai/roles';
import { unitDef } from '../../src/content';
import { createCommander, createSquad, removeCommander } from '../../src/sim/commanders';
import { applyCommand, type Command } from '../../src/sim/commands';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import type { GameState } from '../../src/sim/types';
import { annex, redField } from '../sim/fixtures';
import { applyAll, holderOf, ofType, planned } from './recruitFixtures';

function recruits(plan: Plan): [UnitTypeId, number][] {
  return ofType(plan, 'recruit').map((c) => [c.unit, c.count]);
}

const isRanged = (u: UnitTypeId) => unitDef(u).weapons.some((w) => w.range !== undefined);

/** Red with gold and materials to spare. */
function richRed() {
  const field = redField();
  field.state.nations[field.red]!.gold = 5000;
  field.state.provinces[field.capital]!.materials = 5000;
  return field;
}

/** Red's commander quotas met: a second leader and a second mage in the capital. */
function quotasMet(state: GameState, red: NationId, capital: ProvinceId): void {
  createCommander(state, 'ashChieftain', red, capital);
  createCommander(state, 'emberAdept', red, capital);
}

describe('quotas', () => {
  it('round every per-province count down and count queued commanders', () => {
    const { state, red, capital } = redField();
    const free = (Object.keys(state.provinces) as ProvinceId[]).filter(
      (id) => state.provinces[id]!.owner === null,
    );
    const expected: [number, number, number, number][] = [
      // provinces, leaders, mages, priests
      [1, 2, 2, 0],
      [5, 2, 2, 1],
      [6, 3, 2, 1],
      [8, 3, 2, 1],
      [10, 3, 2, 2],
      [12, 4, 3, 2],
    ];
    let owned = 1;
    for (const [provinces, leaders, mages, priests] of expected) {
      while (owned < provinces) annex(state, red, free[owned++ - 1]!);
      const plan = createPlan(state, red);
      expect(plan.owned()).toHaveLength(provinces);
      expect([quota(plan, 'leader'), quota(plan, 'mage'), quota(plan, 'priest')]).toEqual([
        leaders,
        mages,
        priests,
      ]);
      expect(quota(plan, 'scout')).toBe(AI.scouts);
    }
    expect(roleCount(createPlan(state, red), 'leader')).toBe(1);
    state.nations[red]!.gold = 1000;
    state.provinces[capital]!.materials = 100;
    expect(
      applyCommand(state, {
        type: 'recruit',
        nation: red,
        province: capital,
        unit: 'ashChieftain',
        count: 1,
      }),
    ).toEqual({ ok: true });
    expect(roleCount(createPlan(state, red), 'leader')).toBe(2);
  });
});

describe('the queue', () => {
  it('fills to two items, a short commander first and then troops, one commander at a time', () => {
    const { state, red, capital } = richRed();
    let plan = planned(state, red);
    // Leaders and mages are both short, but only the leader goes in beside the troops.
    const items = recruits(plan);
    expect(items).toHaveLength(AI.queue.max);
    expect(items[0]).toEqual(['ashChieftain', 1]);
    const [unit, count] = items[1]!;
    expect(unitRole(unitDef(unit))).toBeNull();
    expect(isRanged(unit)).toBe(false);
    expect(count).toBe(AI.batch.large);
    applyAll(state, plan);
    expect(planned(state, red).out).toEqual([]);
    // The leader done, the mage comes next, ahead of more troops.
    state.provinces[capital]!.recruitQueue.shift();
    createCommander(state, 'ashChieftain', red, capital);
    plan = planned(state, red);
    expect(recruits(plan)).toEqual([['cinderMagus', 1]]);
  });

  it('takes the cheapest troop only to keep the fort working, then a wanted commander', () => {
    const { state, red, capital } = richRed();
    createCommander(state, 'ashChieftain', red, capital);
    const mage = createCommander(state, 'emberAdept', red, capital);
    // Melee is wanted, but 35 materials pay only for 10 Ash Militia, the cheapest troop.
    state.provinces[capital]!.materials = 35;
    const plan = planned(state, red);
    expect(recruits(plan)).toEqual([['ashMilitia', AI.batch.small]]);
    // With an item already queued the second place waits for what is wanted.
    applyAll(state, plan);
    state.provinces[capital]!.materials = 35;
    expect(planned(state, red).out).toEqual([]);
    // Never fewer than a small batch: 29 materials buy nothing, not 9 militia.
    state.provinces[capital]!.recruitQueue = [];
    state.provinces[capital]!.materials = 3 * AI.batch.small - 1;
    expect(planned(state, red).out).toEqual([]);
    // A mage short while the queue holds a commander: with no troops to pay, it comes next.
    removeCommander(state, mage.id);
    state.provinces[capital]!.materials = 50;
    const leader: Command = {
      type: 'recruit',
      nation: red,
      province: capital,
      unit: 'ashChieftain',
      count: 1,
    };
    expect(applyCommand(state, leader)).toEqual({ ok: true });
    state.provinces[capital]!.materials = 5;
    expect(recruits(planned(state, red))).toEqual([['cinderMagus', 1]]);
  });

  it('recruits the adept tier only when the gold after it covers the reserve', () => {
    const { state, red, capital } = richRed();
    createCommander(state, 'ashChieftain', red, capital);
    state.provinces[capital]!.materials = 5;
    state.nations[red]!.gold = unitDef('cinderMagus').cost!.gold + AI.goldReserve;
    expect(recruits(planned(state, red))).toEqual([['cinderMagus', 1]]);
    state.nations[red]!.gold -= 1;
    expect(recruits(planned(state, red))).toEqual([['emberAdept', 1]]);
  });

  it('recruits nothing while the fort is besieged', () => {
    const { state, red, green, capital } = richRed();
    state.provinces[capital]!.siege = { attacker: green, wallHp: 300, storm: false };
    expect(ofType(planned(state, red), 'recruit')).toEqual([]);
  });
});

describe('the troop mix', () => {
  it('counts field armies, garrisons, and the queue, and wants ranged past 2:1', () => {
    const { state, red, capital } = redField();
    let plan = createPlan(state, red);
    expect(troopMix(plan)).toEqual({ melee: 20, ranged: 10 });
    expect(wantsRanged(plan)).toBe(false);
    holderOf(state, capital).squads.push(createSquad(state, 'ashMilitia', 1));
    plan = createPlan(state, red);
    expect(troopMix(plan)).toEqual({ melee: 21, ranged: 10 });
    expect(wantsRanged(plan)).toBe(true);
    state.nations[red]!.gold = 1000;
    state.provinces[capital]!.materials = 1000;
    applyCommand(state, {
      type: 'recruit',
      nation: red,
      province: capital,
      unit: 'flameArcher',
      count: 10,
    });
    plan = createPlan(state, red);
    expect(troopMix(plan)).toEqual({ melee: 21, ranged: 20 });
    expect(wantsRanged(plan)).toBe(false);
  });

  it('batches 20 when gold and materials allow, else 10', () => {
    const { state, red, capital, army } = richRed();
    quotasMet(state, red, capital);
    army.squads[0]!.count += 40;
    // One place left: a commander holds the other, so only one troop item goes in.
    applyCommand(state, {
      type: 'recruit',
      nation: red,
      province: capital,
      unit: 'cinderScout',
      count: 1,
    });
    let [item] = recruits(planned(state, red));
    expect(isRanged(item![0])).toBe(true);
    expect(item![1]).toBe(AI.batch.large);
    // 70 materials pay for 10 of either ranged troop and 20 of neither.
    state.provinces[capital]!.materials = 70;
    [item] = recruits(planned(state, red));
    expect(isRanged(item![0])).toBe(true);
    expect(item![1]).toBe(AI.batch.small);
  });

  it('weights units by aggression over gold cost and pillage for speed', () => {
    const cinder = nationDef('cinderHorde');
    const thorn = nationDef('thornwood');
    // Cinder's dearest troop costs 32 gold and its slowest moves at 2.
    expect(troopWeight(cinder, 'ashMilitia')).toBeCloseTo(1 + 0.8 * (8 / 32), 10);
    expect(troopWeight(cinder, 'ashRider')).toBeCloseTo(1 + 0.8 * (28 / 32) + 0.6, 10);
    expect(troopWeight(cinder, 'flamebrand')).toBeCloseTo(1 + 0.8, 10);
    // Thornwood's slowest troops move at 1, so its militia counts as fast.
    expect(troopWeight(thorn, 'warden')).toBeCloseTo(1 + 0.4 * (14 / 36), 10);
    expect(troopWeight(thorn, 'thornMilitia')).toBeCloseTo(1 + 0.4 * (8 / 36) + 0.1, 10);
  });

  it('draws the wanted unit in proportion to its weight', () => {
    const { state, red, capital } = richRed();
    quotasMet(state, red, capital);
    const melee = nationDef('cinderHorde').troops.filter((u) => !isRanged(u));
    const weights = melee.map((u) => troopWeight(nationDef('cinderHorde'), u));
    const total = weights.reduce((a, b) => a + b, 0);
    const seen = new Map<UnitTypeId, number>();
    const days = 600;
    for (let day = 0; day < days; day++) {
      state.day = day;
      const [first] = recruits(planned(state, red));
      seen.set(first![0], (seen.get(first![0]) ?? 0) + 1);
    }
    melee.forEach((u, i) => {
      expect((seen.get(u) ?? 0) / days).toBeCloseTo(weights[i]! / total, 1);
    });
  });
});
