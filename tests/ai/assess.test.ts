// How the AI sizes up armies and provinces (docs/08-ai.md "Expansion": armyPower = sum over
// troops of (hp + att + def + prot) / 4 * (1 + 0.1 * hasRanged); Phase 7 design "Power",
// "Groups and free armies"): troop and army power worked by hand, a province's defenders, the
// threat around it, groups and free armies, and the borders.
import { describe, expect, it } from 'vitest';
import { unitDef } from '../../src/content';
import { AI } from '../../src/content/ai';
import {
  armyPower,
  borders,
  commanderPower,
  defenderPower,
  destinationOf,
  escortedSprings,
  freeArmies,
  groups,
  isEnemyProvince,
  threat,
  troopPower,
  type Group,
} from '../../src/ai/assess';
import { createPlan } from '../../src/ai/plan';
import { createCommander, createSquad, removeCommander } from '../../src/sim/commanders';
import type { CommanderId, NationId, ProvinceId } from '../../src/sim/ids';
import { independentCount } from '../../src/sim/independents';
import type { CommanderState, GameState } from '../../src/sim/types';
import { addArmy, annex, besiege, commandersIn, move, neighbors, redField } from '../sim/fixtures';

/** Ash Militia: (10 + 9 + 8 + 1) / 4. */
const MILITIA = 7;
/** Flame Archer, ranged: (10 + 9 + 9 + 2) / 4 * 1.1. */
const ARCHER = 8.25;
/** Cinder Warrior: (11 + 11 + 9 + 3) / 4. */
const WARRIOR = 8.5;
/** Ash Chieftain: (14 + 10 + 10 + 4) / 4. */
const CHIEFTAIN = 9.5;

/** Red's starting army: an Ash Chieftain with 20 Cinder Warriors and 10 Flame Archers. */
const RED_ARMY = CHIEFTAIN + 20 * WARRIOR + 10 * ARCHER;

describe('troopPower', () => {
  it('is the mean of hp, att, def, and prot, ranged units a tenth more', () => {
    expect(troopPower(unitDef('ashMilitia'))).toBe(MILITIA);
    expect(troopPower(unitDef('flameArcher'))).toBeCloseTo(ARCHER, 10);
    expect(troopPower(unitDef('cinderWarrior'))).toBe(WARRIOR);
    expect(troopPower(unitDef('ashChieftain'))).toBe(CHIEFTAIN);
    expect(AI.rangedBonus).toBe(0.1);
  });
});

describe('armyPower', () => {
  it('sums troops and counts each commander as one troop of its unit, scaled by HP left', () => {
    const { state, red, capital, army } = redField();
    expect(armyPower([army])).toBeCloseTo(RED_ARMY, 10);
    // Half the warriors' HP gone: they count half.
    army.squads[0]!.hp /= 2;
    expect(armyPower([army])).toBeCloseTo(RED_ARMY - 10 * WARRIOR, 10);
    army.hp = unitDef('ashChieftain').hp / 2;
    expect(commanderPower(army)).toBeCloseTo(RED_ARMY - 10 * WARRIOR - CHIEFTAIN / 2, 10);
    const second = addArmy(state, red, capital, 'ashMilitia', 10);
    expect(armyPower([army, second])).toBeCloseTo(
      commanderPower(army) + CHIEFTAIN + 10 * MILITIA,
      10,
    );
  });

  it('counts a hidden commander as nothing and a garrison holder as its troops alone', () => {
    const { state, capital } = redField();
    const scout = commandersIn(state, capital).find((c) => c.unit === 'cinderScout')!;
    expect(commanderPower(scout)).toBe(0);
    // Leading troops that are not stealthy, it shows and fights.
    scout.squads.push(createSquad(state, 'ashMilitia', 2));
    expect(commanderPower(scout)).toBeCloseTo((10 + 10 + 10 + 1) / 4 + 2 * MILITIA, 10);
    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    expect(commanderPower(holder)).toBe(0);
    holder.squads.push(createSquad(state, 'ashMilitia', 20));
    expect(commanderPower(holder)).toBe(20 * MILITIA);
  });
});

describe('defenderPower', () => {
  it("counts the owner's commanders there, the garrison troops, and the PD force", () => {
    const { state, red, green, capital, army } = redField();
    const p = annex(state, red, neighbors(state, capital)[0]!);
    expect(defenderPower(state, p.id)).toBe(0);
    // PD 5: 10 militia and 1 archer.
    p.pd = 5;
    expect(defenderPower(state, p.id)).toBeCloseTo(10 * MILITIA + ARCHER, 10);
    addArmy(state, red, p.id, 'ashMilitia', 10);
    // Another nation's army and a hidden scout of the owner add nothing.
    addArmy(state, green, p.id, 'thornMilitia', 10, 'wardenCaptain');
    createCommander(state, 'cinderScout', red, p.id);
    expect(defenderPower(state, p.id)).toBeCloseTo(20 * MILITIA + ARCHER + CHIEFTAIN, 10);

    const holder = state.commanders[state.provinces[capital]!.garrison!]!;
    holder.squads.push(createSquad(state, 'ashMilitia', 20));
    state.provinces[capital]!.pd = 0;
    // The capital: the garrison troops, the army, the priest (8) and the adept (7.75); the
    // walls do not count.
    expect(defenderPower(state, capital)).toBeCloseTo(
      20 * MILITIA + armyPower([army]) + 8 + 7.75,
      10,
    );
  });

  it('counts the independents in an independent province', () => {
    const { state } = redField();
    const p = Object.values(state.provinces).find(
      (q) => q.owner === null && independentCount(state, q.id) > 0,
    )!;
    const defenders = Object.values(state.commanders).filter(
      (c) => c.owner === null && c.location === p.id,
    );
    expect(defenders.length).toBeGreaterThan(0);
    expect(defenderPower(state, p.id)).toBeCloseTo(armyPower(defenders), 10);
    expect(defenderPower(state, p.id)).toBeGreaterThan(independentCount(state, p.id) * 5);
  });
});

describe('threat', () => {
  it("sums other nations' commanders within AI.threatHops, the province itself included", () => {
    const { state, red, green, capital } = redField();
    const p = annex(state, red, neighbors(state, capital)[0]!).id;
    const near = neighbors(state, p).find((q) => q !== capital)!;
    const far = neighbors(state, near).find((q) => q !== p && !neighbors(state, p).includes(q))!;
    expect(threat(state, red, p)).toBe(0);
    // A Warden Captain (10.25) with 10 Thorn Militia (7.5 each).
    addArmy(state, green, near, 'thornMilitia', 10, 'wardenCaptain');
    expect(threat(state, red, p)).toBeCloseTo(85.25, 10);
    addArmy(state, green, p, 'thornMilitia', 10, 'wardenCaptain');
    expect(threat(state, red, p)).toBeCloseTo(2 * 85.25, 10);
    // Beyond one hop, hidden, independent, or Red's own: none of it counts.
    addArmy(state, green, far, 'thornMilitia', 10, 'wardenCaptain');
    createCommander(state, 'thornScout', green, near);
    addArmy(state, null, near, 'lightInfantry', 30, 'independentCaptain');
    addArmy(state, red, near, 'ashMilitia', 30);
    expect(threat(state, red, p)).toBeCloseTo(2 * 85.25, 10);
    expect(AI.threatHops).toBe(1);
  });
});

/** The ids of a group's members. */
function memberIds(g: Group | undefined): CommanderId[] {
  return (g?.members ?? []).map((m) => m.id);
}

/** The group a commander leads. */
function led(all: readonly Group[], c: CommanderState): Group | undefined {
  return all.find((g) => g.leader.id === c.id);
}

describe('groups', () => {
  it('give each standing leader the riders idle beside it, strongest leader first', () => {
    const { state, red, capital, army } = redField();
    const small = addArmy(state, red, capital, 'ashMilitia', 5);
    // Red researches at 0.4: of four mages the oldest two study, the newest two ride.
    createCommander(state, 'cinderMagus', red, capital);
    const rider1 = createCommander(state, 'emberAdept', red, capital);
    const rider2 = createCommander(state, 'emberAdept', red, capital);
    const salamander = createCommander(state, 'salamander', red, capital);
    let all = groups(createPlan(state, red));
    // One battle mage per army: the strongest takes the first, the next the second.
    expect(memberIds(led(all, army))).toEqual([army.id, rider1.id, salamander.id]);
    expect(memberIds(led(all, small))).toEqual([small.id, rider2.id]);
    expect(all.map((g) => g.lone)).toEqual([false, false]);
    expect(all.every((g) => g.province === capital)).toBe(true);
    // A rider under another order stays out.
    rider1.order = { kind: 'research' };
    all = groups(createPlan(state, red));
    expect(memberIds(led(all, army))).toEqual([army.id, rider2.id, salamander.id]);
    expect(memberIds(led(all, small))).toEqual([small.id]);
  });

  it('take a fighter pretender along from AI.pretenderJoinDay', () => {
    const { state, red, capital, army } = redField();
    const titan = createCommander(state, 'titan', red, capital);
    state.nations[red]!.pretenderId = titan.id;
    state.day = AI.pretenderJoinDay - 1;
    let all = groups(createPlan(state, red));
    expect(memberIds(led(all, army))).toEqual([army.id]);
    state.day = AI.pretenderJoinDay;
    all = groups(createPlan(state, red));
    expect(memberIds(led(all, army))).toEqual([army.id, titan.id]);
    // A body that does not fight never rides.
    removeCommander(state, titan.id);
    const spirit = createCommander(state, 'wildSpirit', red, capital);
    state.nations[red]!.pretenderId = spirit.id;
    all = groups(createPlan(state, red));
    expect(memberIds(led(all, army))).toEqual([army.id]);
  });

  it('keep a marching leader with the riders marching beside it', () => {
    const { state, red, capital, army } = redField();
    const salamander = createCommander(state, 'salamander', red, capital);
    const next = annex(state, red, neighbors(state, capital)[0]!).id;
    expect(move(state, red, [army, salamander], [next])).toEqual({ ok: true });
    const all = groups(createPlan(state, red));
    expect(memberIds(led(all, army))).toEqual([army.id, salamander.id]);
    expect(led(all, army)?.province).toBe(capital);
  });

  it('gather riders standing where no leader stands into one lone group', () => {
    const { state, red, capital } = redField();
    const out = annex(state, red, neighbors(state, capital)[0]!).id;
    createCommander(state, 'cinderMagus', red, capital);
    const rider = createCommander(state, 'emberAdept', red, capital);
    const salamander = createCommander(state, 'salamander', red, capital);
    rider.location = out;
    salamander.location = out;
    const lone = groups(createPlan(state, red)).filter((g) => g.lone);
    // The strongest leads it.
    expect(lone.map((g) => [g.province, g.leader.id])).toEqual([[out, salamander.id]]);
    expect(memberIds(lone[0])).toEqual([salamander.id, rider.id]);
  });
});

describe('freeArmies', () => {
  /** The ids of the leaders of the nation's free armies. */
  function free(state: GameState, red: NationId, assign: CommanderId[] = []) {
    const plan = createPlan(state, red);
    for (const id of assign) plan.assigned.add(id);
    return freeArmies(plan).map((g) => g.leader.id);
  }

  it('are standing leaders with enough troops under a free order, not yet assigned', () => {
    const { state, red, capital, army } = redField();
    const small = addArmy(state, red, capital, 'ashMilitia', AI.fieldArmyTroops - 1);
    const enough = addArmy(state, red, capital, 'ashMilitia', AI.fieldArmyTroops);
    expect(free(state, red)).toEqual([army.id, enough.id]);
    expect(free(state, red, [army.id])).toEqual([enough.id]);
    enough.order = { kind: 'patrol' };
    army.order = { kind: 'pillage' };
    expect(free(state, red)).toEqual([army.id, enough.id]);
    const next = annex(state, red, neighbors(state, capital)[0]!).id;
    move(state, red, [enough], [next]);
    expect(free(state, red)).toEqual([army.id]);
    expect(small.order.kind).toBe('idle');
  });

  it('leave out besiegers and escorts of a Wellspring claim', () => {
    const { state, red, green, capital, army } = redField();
    const siege = besiege(state, red, state.nations[green]!.capital);
    siege.squads.push(createSquad(state, 'cinderWarrior', 20));
    expect(free(state, red)).toEqual([army.id]);
    const spring = annex(state, red, state.map.wellsprings[0]!).id;
    army.location = spring;
    expect(free(state, red)).toEqual([army.id]);
    const priest = commandersIn(state, capital).find((c) => c.unit === 'pyrePriest')!;
    priest.location = spring;
    priest.order = { kind: 'claimWellspring', daysLeft: 5 };
    expect(free(state, red)).toEqual([]);
    state.provinces[spring]!.wellspringClaimedBy = red;
    expect(free(state, red)).toEqual([army.id]);
  });
});

describe('escortedSprings and destinationOf', () => {
  it('find the owned unclaimed Wellsprings a priest is walking to or claiming', () => {
    const { state, red, capital } = redField();
    const priest = commandersIn(state, capital).find((c) => c.unit === 'pyrePriest')!;
    const [first, second] = state.map.wellsprings as [ProvinceId, ProvinceId];
    annex(state, red, first);
    annex(state, red, second);
    expect([...escortedSprings(createPlan(state, red))]).toEqual([]);
    priest.order = { kind: 'move', path: [second], mapSpeed: 3 };
    priest.transit = { from: capital, to: first, progress: 1, totalDays: 4 };
    expect(destinationOf(priest)).toBe(second);
    expect([...escortedSprings(createPlan(state, red))]).toEqual([second]);
    priest.order = { kind: 'move', path: [], mapSpeed: 3 };
    expect(destinationOf(priest)).toBe(first);
    priest.transit = null;
    priest.order = { kind: 'claimWellspring', daysLeft: 3 };
    priest.location = first;
    expect(destinationOf(priest)).toBe(first);
    expect([...escortedSprings(createPlan(state, red))]).toEqual([first]);
    state.provinces[first]!.wellspringClaimedBy = red;
    expect([...escortedSprings(createPlan(state, red))]).toEqual([]);
  });
});

describe('borders', () => {
  it('find own provinces next to another nation and next to independents', () => {
    const { state, red, green, capital } = redField();
    const strong = neighbors(state, capital).some(
      (n) => independentCount(state, n) > AI.independentStrength,
    );
    let b = borders(state, red);
    expect([...b.enemy]).toEqual([]);
    expect([...b.independent]).toEqual([capital]);
    expect([...b.strongIndependent]).toEqual(strong ? [capital] : []);
    const [a, c] = neighbors(state, capital) as [ProvinceId, ProvinceId];
    annex(state, green, a);
    annex(state, red, c);
    expect(isEnemyProvince(state, red, a)).toBe(true);
    expect(isEnemyProvince(state, red, c)).toBe(false);
    b = borders(state, red);
    expect(b.enemy.has(capital)).toBe(true);
    expect(b.enemy.has(c)).toBe(neighbors(state, c).includes(a));
    for (const p of [capital, c]) {
      const hasIndependent = neighbors(state, p).some((n) => state.provinces[n]!.owner === null);
      expect(b.independent.has(p)).toBe(hasIndependent);
    }
  });
});
