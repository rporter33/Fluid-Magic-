// Replay log events (docs/04-battle.md, "Replay log"). The resolver arrives in Phase 4; these
// types fix the shape of BattleRecord.replay now so saves and the replay viewer agree.
import type { UnitTypeId } from '../../content';
import type { Element } from '../../content/types';
import type { CommanderId } from '../ids';

export type BattleSide = 'attacker' | 'defender';

/** A combatant in a battle: a commander id, a squad id, or a battle-local summon id. */
export type BattleUnitRef = string;

export type BattleEvent =
  | { kind: 'roundStart'; round: number }
  | { kind: 'cast'; caster: CommanderId; spellId: string; targets: BattleUnitRef[] }
  | { kind: 'volley'; squad: BattleUnitRef; target: BattleUnitRef; hits: number; kills: number }
  | { kind: 'melee'; squad: BattleUnitRef; target: BattleUnitRef; hits: number; kills: number }
  | { kind: 'damage'; target: BattleUnitRef; amount: number; element: Element }
  | { kind: 'rout'; squad: BattleUnitRef }
  | { kind: 'death'; commander: CommanderId }
  | {
      kind: 'summon';
      side: BattleSide;
      unit: UnitTypeId;
      count: number;
      squad: BattleUnitRef;
    }
  | { kind: 'buff'; target: BattleUnitRef; stat: string; delta: number; source: string }
  | { kind: 'battleEnd'; winner: BattleSide | null; rounds: number };
