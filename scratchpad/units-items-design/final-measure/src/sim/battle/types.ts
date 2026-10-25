// What the battle resolver takes and gives (docs/04-battle.md). A setup is plain data with
// every modifier already folded into each unit's stats, so the resolver needs nothing but
// the setup and the rng, and tests can stage any fight.
import type { UnitTypeId } from '../../content';
import type { BattleSpellDef } from '../../content/spells/types';
import type { UnitTag, WeaponDef } from '../../content/types';
import type { NationId, ProvinceId } from '../ids';
import type { Formation, Pips, ScriptSlot } from '../types';
import type { BattleEvent, BattleRoster, BattleSide, BattleUnitRef } from './events';

/** A unit's fighting numbers in this battle, modifiers included. */
export interface CombatStats {
  hp: number;
  str: number;
  att: number;
  def: number;
  prot: number;
  mor: number;
  prec: number;
  mapSpeed: number;
  weapons: readonly WeaponDef[];
  tags: readonly UnitTag[];
  /** Fraction of max HP regained per round. */
  regeneration: number;
  /** HP a troop regains per damaging hit it lands (the Black bless). */
  lifeDrain: number;
  /** Fire damage each melee hit on it deals back to the striker. */
  fireShield: number;
  size?: number;
  shieldDef?: number;
  resist?: Partial<Record<string, number>>;
}

export interface BattleSquadSetup {
  ref: BattleUnitRef;
  /** The leading commander, or null for provincial defense. */
  commander: BattleUnitRef | null;
  unit: UnitTypeId;
  count: number;
  /** HP pool, split evenly among the troops. */
  hp: number;
  row: Formation;
  stats: CombatStats;
}

export interface BattleCommanderSetup {
  ref: BattleUnitRef;
  unit: UnitTypeId;
  name: string;
  hp: number;
  row: Formation;
  stats: CombatStats;
  script: readonly ScriptSlot[];
  pips: Pips;
  holy: number;
  /** Mana carried for spells that consume it; what is left is written back after the battle. */
  carriedMana: Pips;
  /**
   * The battle spells it knows: its pips meet them and its nation has researched them (holy
   * spells need no research). The resolver casts only these.
   */
  spells: readonly BattleSpellDef[];
}

export interface BattleSideSetup {
  /** Null for Independents. */
  nation: NationId | null;
  commanders: BattleCommanderSetup[];
  squads: BattleSquadSetup[];
  /** Stats, with this side's modifiers, of every unit its commanders' spells can summon. */
  summons: Partial<Record<UnitTypeId, CombatStats>>;
}

export interface BattleSetup {
  province: ProvinceId;
  attacker: BattleSideSetup;
  defender: BattleSideSetup;
}

export interface SquadOutcome {
  count: number;
  hp: number;
  /** It was routing or had left the field when the battle ended. */
  routed: boolean;
}

export interface CommanderOutcome {
  hp: number;
  dead: boolean;
  routed: boolean;
  carriedMana: Pips;
}

export interface BattleResult {
  winner: BattleSide;
  rounds: number;
  /** Troops and commanders killed, both sides. */
  casualties: number;
  squads: Map<BattleUnitRef, SquadOutcome>;
  commanders: Map<BattleUnitRef, CommanderOutcome>;
  roster: Record<BattleSide, BattleRoster>;
  replay: BattleEvent[];
}
