// Blow-by-blow detail of a battle (docs/04-battle.md, "Replay detail"; docs/12-battle-
// presentation.md, S1.3): every attack roll, spell hit, burn, drain, and morale roll, for the
// replay viewer. The resolver fills a detail array only when one is passed, and filling it
// never changes a draw or the result. Detail is never saved: the viewer re-runs the battle
// from its record to get it, so its shape can change freely.
import type { Element } from '../../content/types';
import type { Formation } from '../types';
import type { BattlePhase, BattleSide, BattleUnitRef } from './events';

/** rolled = max(0, base + attackDrn - armor - armorDrn); attackDrn is drawn first. */
export interface DamageRoll {
  base: number;
  /** The target's protection; armor is what counts of it after piercing or negating. */
  prot: number;
  armor: number;
  attackDrn: number;
  armorDrn: number;
  rolled: number;
}

/** hpBefore 0 means the troop had already fallen this phase. dealt = min(rolled, hpBefore). */
export interface Landing {
  hpBefore: number;
  dealt: number;
  killed: boolean;
}

/** broke = morale + moraleDrn < target + targetDrn + pressure; moraleDrn is drawn first. */
export interface MoraleRoll {
  morale: number;
  moraleDrn: number;
  target: number;
  targetDrn: number;
  /** Side, commander-death, and shock pressure together. */
  pressure: number;
  broke: boolean;
}

interface DetailBase {
  /** Stored events logged before this one: it sits between replay[at - 1] and replay[at]. */
  at: number;
  round: number;
  phase: BattlePhase;
}

export type DetailEvent =
  /** Who stands where as a ranged or melee phase begins; contact is in setup order. */
  | (DetailBase & {
      kind: 'engage';
      fronts: Record<BattleSide, Formation | null>;
      contact: BattleUnitRef[];
    })
  | (DetailBase & {
      kind: 'strike';
      attacker: BattleUnitRef;
      attackerMember: number;
      /** Index into the attacker's stats.weapons; -1 for an unarmed blow. */
      weapon: number;
      target: BattleUnitRef;
      targetMember: number;
      /**
       * Melee: hit when attack + attackDrn > defense + defenseDrn. Ranged: attack is the prec and
       * defense the to-hit number, and a tie hits.
       */
      attack: number;
      attackDrn: number;
      defense: number;
      defenseDrn: number;
      hit: boolean;
      /** A melee blow by a raging troop (berserk below half HP), so the rage bonus counted. */
      berserk: boolean;
      /** A melee blow in the group's first melee round, when first-round bonuses apply. */
      firstRound: boolean;
      damage: DamageRoll | null;
      landing: Landing | null;
    })
  | (DetailBase & {
      kind: 'spellHit';
      caster: BattleUnitRef;
      spell: string;
      /** Index into the spell's effects. */
      effect: number;
      element: Element;
      target: BattleUnitRef;
      targetMember: number;
      damage: DamageRoll;
      landing: Landing;
    })
  /** A fire shield burned a striker; shield is the largest contributor to what it owed. */
  | (DetailBase & {
      kind: 'burn';
      unit: BattleUnitRef;
      member: number;
      shield: BattleUnitRef;
      owed: number;
      landing: Landing;
    })
  | (DetailBase & { kind: 'drain'; unit: BattleUnitRef; member: number; gained: number })
  /** A morale roll; 'shock' when a shock spell alone made the group roll. */
  | (DetailBase & {
      kind: 'morale';
      group: BattleUnitRef;
      cause: 'losses' | 'shock' | 'commanderDeath';
      roll: MoraleRoll;
    });
