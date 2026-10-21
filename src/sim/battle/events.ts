// Replay records (docs/04-battle.md, "Replay log"): the shape of BattleRecord that saves and
// the replay viewer share. A replay is the starting roster plus the event log: the viewer
// needs nothing else.
import type { UnitTypeId } from '../../content';
import type { Element } from '../../content/types';
import type { NationId } from '../ids';
import type { Formation } from '../types';

export type BattleSide = 'attacker' | 'defender';

/**
 * A combatant in a battle: a commander or squad id for units that exist in GameState, or a
 * battle-local id for units that do not (provincial defense `pd0`, `pd1`, ...; summons
 * `su0`, `su1`, ...). Refs resolve through the roster or a summon event.
 */
export type BattleUnitRef = string;

export interface RosterCommander {
  ref: BattleUnitRef;
  unit: UnitTypeId;
  name: string;
  row: Formation;
  hp: number;
}

export interface RosterSquad {
  ref: BattleUnitRef;
  /** The leading commander, or null for provincial defense. */
  commander: BattleUnitRef | null;
  unit: UnitTypeId;
  count: number;
  hp: number;
  row: Formation;
}

/** One side as the battle began. */
export interface BattleRoster {
  /** Null for Independents. */
  nation: NationId | null;
  commanders: RosterCommander[];
  squads: RosterSquad[];
}

/** The stats spells and conditions can change in battle. */
export type StatKey = 'str' | 'att' | 'def' | 'prot' | 'mor' | 'prec';

/**
 * The replay log. With the roster it is enough to replay the fight: every move between rows,
 * every hit, kill, and departure is in it (see replay.ts, which folds it into each unit's
 * state).
 */
export type BattleEvent =
  | { kind: 'roundStart'; round: number }
  | { kind: 'cast'; caster: BattleUnitRef; spellId: string; targets: BattleUnitRef[] }
  | { kind: 'volley'; squad: BattleUnitRef; target: BattleUnitRef; hits: number; kills: number }
  | { kind: 'melee'; squad: BattleUnitRef; target: BattleUnitRef; hits: number; kills: number }
  /** Damage to one unit (a commander) or, from spells, to a squad; kills it caused. */
  | { kind: 'damage'; target: BattleUnitRef; amount: number; element: Element; kills: number }
  | { kind: 'heal'; target: BattleUnitRef; amount: number }
  | { kind: 'rout'; squad: BattleUnitRef }
  /** A unit left the field: its exit round after a rout or retreat, or the round-50 retreat. */
  | { kind: 'leave'; unit: BattleUnitRef }
  /** A commander moved to another row (an Attack script slot). */
  | { kind: 'advance'; unit: BattleUnitRef; row: Formation }
  /** A commander killed; summoned commanders have battle-local refs. */
  | { kind: 'death'; commander: BattleUnitRef }
  | {
      kind: 'summon';
      side: BattleSide;
      unit: UnitTypeId;
      count: number;
      squad: BattleUnitRef;
      row: Formation;
      /** The caster leading the summoned squad, if any. */
      commander: BattleUnitRef | null;
    }
  /** A stat change; rounds null lasts the whole battle. */
  | {
      kind: 'buff';
      target: BattleUnitRef;
      stat: StatKey;
      delta: number;
      source: string;
      rounds: number | null;
    }
  /** A timed change ran out or was removed. */
  | { kind: 'expire'; target: BattleUnitRef; source: string }
  | { kind: 'battleEnd'; winner: BattleSide; rounds: number };
