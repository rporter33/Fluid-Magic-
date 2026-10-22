// Replay records (docs/04-battle.md, "Replay log"): the shape of BattleRecord that saves and
// the replay viewer share. A replay is the starting roster plus the event log: the viewer
// needs nothing else. The blow-by-blow detail is not stored: see detail.ts and rerun.ts.
import type { UnitTypeId } from '../../content';
import type { FieldEffectKind, SpellStat } from '../../content/spells/types';
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
export type StatKey = SpellStat;

/** Round steps in resolver order (docs/04-battle.md, "Round structure"). */
export type BattlePhase = 'scripts' | 'ranged' | 'melee' | 'morale' | 'end';

/**
 * One attacking group against one target group in one ranged or melee phase. Every attack is
 * rolled against the field as the phase began, so a later blow can land on a troop an
 * earlier blow already felled. wounds = hits - blocked - onFallen - kills, never negative.
 */
export interface AttackTally {
  squad: BattleUnitRef;
  target: BattleUnitRef;
  /** Attack rolls, misses included. */
  attacks: number;
  /** Rolls that hit. */
  hits: number;
  /** Hits on a living troop that rolled 0 damage: the armor held. */
  blocked: number;
  /** Hits on a troop already felled earlier in this phase. */
  onFallen: number;
  kills: number;
  /** HP removed: each blow capped at its target's HP before the blow. */
  dmg: number;
}

/**
 * The replay log. With the roster it is enough to replay the fight: every move between rows,
 * every hit, kill, and departure is in it (see replay.ts, which folds it into each unit's
 * state).
 */
export type BattleEvent =
  | { kind: 'roundStart'; round: number }
  /**
   * A1. Opens the round step that logged the events after it. Logged only when the step
   * logged something. A step's span includes the commander deaths checked right after it,
   * and 'end' includes the round-50 departures.
   */
  | { kind: 'phase'; phase: BattlePhase }
  /** A4: fatigue is the caster's fatigue after paying for this cast. */
  | {
      kind: 'cast';
      caster: BattleUnitRef;
      spellId: string;
      targets: BattleUnitRef[];
      fatigue: number;
    }
  | ({ kind: 'volley' } & AttackTally) // A2
  | ({ kind: 'melee' } & AttackTally) // A2
  /**
   * N1: a commander's battle-start ability fired, with the union of the groups its effects
   * planned; its effects' events follow. No fatigue, mana or spell power.
   */
  | { kind: 'ability'; unit: BattleUnitRef; ability: string; targets: BattleUnitRef[] }
  /**
   * Damage to one unit (a commander) or, from spells, to a squad; kills it caused. A3: by is
   * the striking group, set for weapon hits on commanders. For retaliation-shield burns, one
   * event per burned group and element (N4), by is the shield's group that contributed most of
   * that element. Spell and ability damage leaves it out: the cast or ability before it names
   * the caster.
   */
  | {
      kind: 'damage';
      target: BattleUnitRef;
      amount: number;
      element: Element;
      kills: number;
      by?: BattleUnitRef;
    }
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
      /** The summoned squad's starting HP pool. */
      hp: number;
      squad: BattleUnitRef;
      row: Formation;
      /** The caster leading the summoned squad, if any. */
      commander: BattleUnitRef | null;
    }
  /**
   * A stat change from a spell, lasting through untilRound (null: the whole battle). Debuffs
   * come from enemy spells. Field effects' changes are not logged: see 'field'.
   */
  | {
      kind: 'buff';
      target: BattleUnitRef;
      stat: StatKey;
      delta: number;
      source: string;
      untilRound: number | null;
      debuff: boolean;
    }
  /** A group's changes from one source, each logged by a 'buff', ran out or were removed. */
  | { kind: 'expire'; target: BattleUnitRef; source: string }
  /**
   * A field effect began; it lasts through untilRound. Its stat changes (FIELD_EFFECTS) fall
   * on every unit present now and end with its 'fieldEnd'.
   */
  | { kind: 'field'; effect: FieldEffectKind; caster: BattleUnitRef; untilRound: number }
  | { kind: 'fieldEnd'; effect: FieldEffectKind }
  /** Fatigue forced on a caster by an enemy spell. */
  | { kind: 'fatigue'; unit: BattleUnitRef; amount: number }
  | { kind: 'battleEnd'; winner: BattleSide; rounds: number };
