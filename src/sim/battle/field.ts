// The battlefield inside the resolver: every squad split into single troops, every commander
// a group of one, arranged in three rows per side. Setup stats are read-only bases; anything
// that changes during the battle is a timed modifier on the group, so the caller's setup is
// never touched. Nothing here outlives a battle. The field also carries the optional detail
// sink and the round and step being resolved, which detail events record.
import type { UnitTypeId } from '../../content';
import type { UnitAbility } from '../../content/abilities';
import { BATTLE, CASTING } from '../../content/rules';
import type { BattleSpellDef, FieldEffectKind } from '../../content/spells/types';
import type { Formation, Pips, ScriptSlot } from '../types';
import type { DetailEvent } from './detail';
import type { BattleEvent, BattlePhase, BattleSide, BattleUnitRef, StatKey } from './events';
import type { BattleSetup, BattleSideSetup, CombatStats } from './types';

export const ROWS: readonly Formation[] = ['front', 'middle', 'rear'];
export const SIDES: readonly BattleSide[] = ['attacker', 'defender'];
export const OTHER: Record<BattleSide, BattleSide> = { attacker: 'defender', defender: 'attacker' };

/** One troop or one commander on the field. */
export interface Fighter {
  group: Group;
  /** Its fixed slot in group.members, which detail events name it by. */
  index: number;
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
  /**
   * Announced by a 'buff' event, so its end is logged too. A field effect's changes are not:
   * its 'field' and 'fieldEnd' events report them.
   */
  logged: boolean;
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
  /** N5: when it breaks it never drags its commander into a rout (summons, bound squads). */
  bound: boolean;
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
  /** Extra morale pressure from shock spells this round; it must check while above 0. */
  shock: number;
  /**
   * Commanders only: script, pips, the spells it can cast, its battle-start abilities, fatigue,
   * and mana carried.
   */
  script: readonly ScriptSlot[];
  pips: Pips;
  holy: number;
  spells: readonly BattleSpellDef[];
  abilities: readonly UnitAbility[];
  fatigue: number;
  carriedMana: Pips;
}

/** A field effect in force (wall, fog, storm) until the end of untilRound. */
export interface FieldEffect {
  kind: FieldEffectKind;
  untilRound: number;
}

export interface Field {
  sides: Record<BattleSide, Group[]>;
  startTroops: Record<BattleSide, number>;
  effects: FieldEffect[];
  /** Stats for units each side's spells summon, and the next summon ref number. */
  summons: Record<BattleSide, Partial<Record<UnitTypeId, CombatStats>>>;
  nextSummon: number;
  /** The detail sink, or null: detail objects are built only when it is set. */
  detail: DetailEvent[] | null;
  /** The round and the round step being resolved, for detail events. */
  round: number;
  phase: BattlePhase;
}

/** What only commanders bring to a group. */
interface CommanderParts {
  script: readonly ScriptSlot[];
  pips: Pips;
  holy: number;
  spells: readonly BattleSpellDef[];
  abilities: readonly UnitAbility[];
  carriedMana: Pips;
}

const TROOPS: CommanderParts = {
  script: [],
  pips: {},
  holy: 0,
  spells: [],
  abilities: [],
  carriedMana: {},
};

export function group(
  side: BattleSide,
  ref: BattleUnitRef,
  leader: BattleUnitRef | null,
  stats: CombatStats,
  row: Formation,
  count: number,
  hp: number,
  commander: CommanderParts | null,
): Group {
  const parts = commander ?? TROOPS;
  const g: Group = {
    ref,
    side,
    leader,
    isCommander: commander !== null,
    summoned: false,
    bound: false,
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
    shock: 0,
    script: parts.script,
    pips: parts.pips,
    holy: parts.holy,
    spells: parts.spells,
    abilities: parts.abilities,
    fatigue: 0,
    carriedMana: { ...parts.carriedMana },
  };
  // docs/01 section 6: the HP pool is split into per-unit HP inside the resolver; evenly.
  const each = count > 0 ? hp / count : 0;
  for (let i = 0; i < count; i++) {
    g.members.push({ group: g, index: i, hp: each, maxHp: stats.hp, alive: each > 0 });
  }
  return g;
}

function sideGroups(side: BattleSide, setup: BattleSideSetup): Group[] {
  const squads = setup.squads.map((s) => {
    const g = group(side, s.ref, s.commander, s.stats, s.row, s.count, s.hp, null);
    g.bound = s.bound === true;
    return g;
  });
  const commanders = setup.commanders.map((c) =>
    group(side, c.ref, null, c.stats, c.row, 1, c.hp, {
      script: c.script,
      pips: c.pips,
      holy: c.holy,
      spells: c.spells,
      abilities: c.abilities,
      carriedMana: c.carriedMana,
    }),
  );
  return [...squads, ...commanders];
}

export function buildField(setup: BattleSetup, detail: DetailEvent[] | null = null): Field {
  const sides = {
    attacker: sideGroups('attacker', setup.attacker),
    defender: sideGroups('defender', setup.defender),
  };
  const troops = (gs: Group[]) => gs.reduce((n, g) => n + (g.isCommander ? 0 : g.startCount), 0);
  return {
    sides,
    startTroops: { attacker: troops(sides.attacker), defender: troops(sides.defender) },
    effects: [],
    summons: { attacker: setup.attacker.summons, defender: setup.defender.summons },
    nextSummon: 0,
    detail,
    round: 0,
    phase: 'scripts',
  };
}

/** Commanders in caster order: attacker 0, defender 0, attacker 1, ... */
export function interleaved(field: Field): Group[] {
  const a = field.sides.attacker.filter((g) => g.isCommander);
  const d = field.sides.defender.filter((g) => g.isCommander);
  const out: Group[] = [];
  for (let i = 0; i < Math.max(a.length, d.length); i++) {
    const x = a[i];
    const y = d[i];
    if (x) out.push(x);
    if (y) out.push(y);
  }
  return out;
}

/** Where a detail event emitted now sits: after every stored event logged so far. */
export function detailAt(
  field: Field,
  log: readonly BattleEvent[],
): { at: number; round: number; phase: BattlePhase } {
  return { at: log.length, round: field.round, phase: field.phase };
}

/** Too tired to act: no spells, no script moves, no attacks (docs/02-magic.md section 3). */
export function exhausted(g: Group): boolean {
  return g.fatigue >= CASTING.exhaustedAt;
}

/** A field effect of this kind is in force. */
export function fieldHas(field: Field, test: (e: FieldEffect) => boolean): boolean {
  return field.effects.some(test);
}

/** A berserk troop below half its HP rages: more attack and strength (docs/03-nations.md). */
export function raging(f: Fighter): boolean {
  return f.group.base.tags.includes('berserk') && f.hp < f.maxHp * BATTLE.berserk.belowHpShare;
}

/** A numeric stat with every modifier, for one fighter (berserk depends on the troop's HP). */
export function statOf(f: Fighter, key: StatKey): number {
  let value = groupStat(f.group, key);
  if ((key === 'att' || key === 'str') && raging(f)) value += BATTLE.berserk[key];
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
