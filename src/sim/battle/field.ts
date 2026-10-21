// The battlefield inside the resolver: every squad split into single troops, every commander
// a group of one, arranged in three rows per side. Setup stats are read-only bases; anything
// that changes during the battle is a timed modifier on the group, so the caller's setup is
// never touched. Nothing here outlives a battle.
import { BATTLE } from '../../content/rules';
import type { Formation, ScriptSlot } from '../types';
import type { BattleSide, BattleUnitRef, StatKey } from './events';
import type { BattleSetup, BattleSideSetup, CombatStats } from './types';

export const ROWS: readonly Formation[] = ['front', 'middle', 'rear'];
export const SIDES: readonly BattleSide[] = ['attacker', 'defender'];
export const OTHER: Record<BattleSide, BattleSide> = { attacker: 'defender', defender: 'attacker' };

/** One troop or one commander on the field. */
export interface Fighter {
  group: Group;
  hp: number;
  maxHp: number;
  alive: boolean;
}

/** A change to a group's stat for the battle or for some rounds (Phase 5 spells). */
export interface StatMod {
  stat: StatKey;
  delta: number;
  source: string;
  /** Last round it holds, or null for the whole battle. */
  untilRound: number | null;
  debuff: boolean;
}

/** A squad, or a commander standing alone. */
export interface Group {
  ref: BattleUnitRef;
  side: BattleSide;
  /** The commander leading this squad; null for commanders and provincial defense. */
  leader: BattleUnitRef | null;
  isCommander: boolean;
  /** Joined mid-battle (Phase 5 summons): not counted in the side's starting troops. */
  summoned: boolean;
  base: Readonly<CombatStats>;
  mods: StatMod[];
  row: Formation;
  members: Fighter[];
  startCount: number;
  /** Ammunition left, by index into base.weapons. */
  ammo: number[];
  /** Round the group began routing, or null. A routing group leaves at the end of the next round. */
  routingSince: number | null;
  /** It has left the field, alive or not. */
  gone: boolean;
  /** Round of its first melee attack, for first-round weapon bonuses. */
  firstMelee: number | null;
  deathsThisRound: number;
  /** It rolled morale this round. */
  checked: boolean;
  /** Commanders only. */
  script: readonly ScriptSlot[];
}

export interface Field {
  sides: Record<BattleSide, Group[]>;
  startTroops: Record<BattleSide, number>;
}

function group(
  side: BattleSide,
  ref: BattleUnitRef,
  leader: BattleUnitRef | null,
  stats: CombatStats,
  row: Formation,
  count: number,
  hp: number,
  script: readonly ScriptSlot[],
  isCommander: boolean,
): Group {
  const g: Group = {
    ref,
    side,
    leader,
    isCommander,
    summoned: false,
    base: stats,
    mods: [],
    row,
    members: [],
    startCount: count,
    ammo: stats.weapons.map((w) => w.ammo ?? 0),
    routingSince: null,
    gone: false,
    firstMelee: null,
    deathsThisRound: 0,
    checked: false,
    script,
  };
  // docs/01 section 6: the HP pool is split into per-unit HP inside the resolver; evenly.
  const each = count > 0 ? hp / count : 0;
  for (let i = 0; i < count; i++) {
    g.members.push({ group: g, hp: each, maxHp: stats.hp, alive: each > 0 });
  }
  return g;
}

function sideGroups(side: BattleSide, setup: BattleSideSetup): Group[] {
  const squads = setup.squads.map((s) =>
    group(side, s.ref, s.commander, s.stats, s.row, s.count, s.hp, [], false),
  );
  const commanders = setup.commanders.map((c) =>
    group(side, c.ref, null, c.stats, c.row, 1, c.hp, c.script, true),
  );
  return [...squads, ...commanders];
}

export function buildField(setup: BattleSetup): Field {
  const sides = {
    attacker: sideGroups('attacker', setup.attacker),
    defender: sideGroups('defender', setup.defender),
  };
  const troops = (gs: Group[]) => gs.reduce((n, g) => n + (g.isCommander ? 0 : g.startCount), 0);
  return {
    sides,
    startTroops: { attacker: troops(sides.attacker), defender: troops(sides.defender) },
  };
}

/** A numeric stat with every modifier, for one fighter (berserk depends on the troop's HP). */
export function statOf(f: Fighter, key: StatKey): number {
  const g = f.group;
  let value = groupStat(g, key);
  if (
    (key === 'att' || key === 'str') &&
    g.base.tags.includes('berserk') &&
    f.hp < f.maxHp * BATTLE.berserk.belowHpShare
  ) {
    value += BATTLE.berserk[key];
  }
  return value;
}

/** A group-wide stat (morale, precision) with its modifiers. */
export function groupStat(g: Group, key: StatKey): number {
  let value = g.base[key];
  for (const m of g.mods) if (m.stat === key) value += m.delta;
  return value;
}

export function living(g: Group): number {
  let n = 0;
  for (const m of g.members) if (m.alive) n++;
  return n;
}

/** On the field: not gone and someone alive. Routing groups are present until they leave. */
export function present(g: Group): boolean {
  return !g.gone && g.members.some((m) => m.alive);
}

/** Present and not routing: able to act and to keep its side in the battle. */
export function active(g: Group): boolean {
  return present(g) && g.routingSince === null;
}

/** A side's front: its first row holding an active unit, or null when it has none. */
export function frontRow(field: Field, side: BattleSide): Formation | null {
  for (const row of ROWS) {
    if (field.sides[side].some((g) => g.row === row && active(g))) return row;
  }
  return null;
}

/**
 * Everyone alive in a side's front row and any row before it: routing stragglers left in
 * front can still be cut down or shot in their exit round. In setup order.
 */
export function targetsUpTo(field: Field, side: BattleSide, row: Formation): Fighter[] {
  const depth = ROWS.indexOf(row);
  const out: Fighter[] = [];
  for (const g of field.sides[side]) {
    if (ROWS.indexOf(g.row) > depth || !present(g)) continue;
    for (const m of g.members) if (m.alive) out.push(m);
  }
  return out;
}

/** First round a unit attacks in melee: by map speed, flyers as the fastest. */
export function closingRound(stats: Readonly<CombatStats>): number {
  const speed = stats.tags.includes('flying') ? BATTLE.flyingSpeed : stats.mapSpeed;
  const round = BATTLE.closingRound[speed];
  if (round === undefined) throw new RangeError(`no closing round for map speed ${speed}`);
  return round;
}

/**
 * Troops a side has lost: killed or fled, out of the troops it began with (summoned troops and
 * commanders aside).
 */
export function troopsLost(field: Field, side: BattleSide): number {
  let standing = 0;
  for (const g of field.sides[side]) {
    if (!g.isCommander && !g.summoned && !g.gone) standing += living(g);
  }
  return field.startTroops[side] - standing;
}

export function anyActive(field: Field, side: BattleSide): boolean {
  return field.sides[side].some(active);
}
