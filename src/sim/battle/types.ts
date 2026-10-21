// What the battle resolver takes and gives (docs/04-battle.md). A setup is plain data with
// every modifier already folded into each unit's stats, so the resolver needs nothing but
// the setup and the rng, and tests can stage any fight.
import type { UnitTypeId } from '../../content';
import type { Color } from '../../content/colors';
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
  /** Mana carried for spells that consume it (Phase 5); written back after the battle. */
  carriedMana: Pips;
}

export interface BattleSideSetup {
  /** Null for Independents. */
  nation: NationId | null;
  /** Research level per color, which gates battle spells (Phase 5); empty for Independents. */
  research: Partial<Record<Color, number>>;
  commanders: BattleCommanderSetup[];
  squads: BattleSquadSetup[];
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
