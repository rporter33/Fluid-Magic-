// Replay records (docs/04-battle.md, "Replay log"). The resolver arrives in Phase 4; these
// types fix the shape of BattleRecord now so saves and the replay viewer agree. A replay is
// the starting roster plus the event log: the viewer needs nothing else.
import type { UnitTypeId } from '../../content';
import type { Element } from '../../content/types';
import type { CommanderId, NationId } from '../ids';
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

export type BattleEvent =
  | { kind: 'roundStart'; round: number }
  | { kind: 'cast'; caster: CommanderId; spellId: string; targets: BattleUnitRef[] }
  | { kind: 'volley'; squad: BattleUnitRef; target: BattleUnitRef; hits: number; kills: number }
  | { kind: 'melee'; squad: BattleUnitRef; target: BattleUnitRef; hits: number; kills: number }
  | { kind: 'damage'; target: BattleUnitRef; amount: number; element: Element }
  | { kind: 'heal'; target: BattleUnitRef; amount: number }
  | { kind: 'rout'; squad: BattleUnitRef }
  | { kind: 'death'; commander: CommanderId }
  | {
      kind: 'summon';
      side: BattleSide;
      unit: UnitTypeId;
      count: number;
      squad: BattleUnitRef;
      row: Formation;
    }
  | { kind: 'buff'; target: BattleUnitRef; stat: string; delta: number; source: string }
  | { kind: 'battleEnd'; winner: BattleSide | null; rounds: number };
