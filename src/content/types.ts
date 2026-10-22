// Shapes of content records. Content is plain typed data; the sim reads it through the
// registry in content/index.ts.
import type { TriggerAbilityId } from './abilities';
import type { BuildingId } from './buildings';
import type { Color } from './colors';
import type { TerrainId } from './terrain';
import type { UnitTypeId } from './units';

/** Damage elements. Physical is the default for weapons without one. */
export const ELEMENTS = ['physical', 'fire', 'nature', 'cold', 'holy', 'decay'] as const;
export type Element = (typeof ELEMENTS)[number];

/**
 * A retaliation shield: each melee hit that deals damage to its bearer deals `amount` back to
 * the striker in `element`, ignoring protection, once the phase's hits have landed (N4).
 * Shields of one element add; each element burns and is logged on its own.
 */
export interface Shield {
  element: Element;
  amount: number;
}

export interface WeaponDef {
  name: string;
  /** Damage base: added to the wielder's strength in melee, alone for ranged shots. */
  dmg: number;
  /** Ranged weapons only: 5 or more reaches the rear row. */
  range?: number;
  /** Ranged weapons only: volleys per battle. */
  ammo?: number;
  element?: Element;
  /** Halves the target's protection. */
  armorPiercing?: boolean;
  /** Ignores the target's protection. */
  armorNegating?: boolean;
  /** Extra damage in the unit's first melee round (lances). */
  firstRoundBonus?: number;
  /** Melee weapons only (N2): swings per troop per melee phase with it, 1 to 4; default 1. */
  strikes?: number;
  /**
   * Melee weapons only (N2, trample): it strikes only targets of this size or smaller, 1 to 6.
   * "Trample hits only bodies of size {m} or less"; with none in reach it swings at nothing.
   */
  maxTargetSize?: number;
}

export const UNIT_TAGS = [
  'sacred',
  'undead',
  'beast',
  'flying',
  'construct',
  'mounted',
  'mindless',
  'berserk',
  'stealthy',
  'immobile',
  'swampwalker',
] as const;
export type UnitTag = (typeof UNIT_TAGS)[number];

export interface UnitCost {
  gold: number;
  materials: number;
  /** Population removed from the province when the unit completes. */
  pop: number;
}

/** What a province needs before a unit can be recruited there. */
export type RecruitRequirement = 'fort' | 'temple' | 'lab' | 'capital';

export interface CommanderTraits {
  /** Maximum troops led. */
  leadership: number;
  pips: Partial<Record<Color, number>>;
  holy: number;
  /** Chance of one extra pip in a color when recruited (adept-tier mages). */
  extraPip?: { color: Color; chance: number };
  /** Graph distance this commander sees, marking it a scout; others see VISION.baseSight. */
  sight?: number;
  /** A fort's garrison holder: free, immobile, never fights itself. */
  garrison?: boolean;
  /** The battle spell its default script casts (a spell id); else its best castable spell. */
  defaultSpell?: string;
  /** False for bodies that may not research despite their pips (pretenders but the Oracle). */
  research?: false;
}

export interface UnitDef {
  id: string;
  name: string;
  hp: number;
  str: number;
  att: number;
  def: number;
  prot: number;
  /** Magic resistance. */
  mr: number;
  mor: number;
  /** Precision for ranged attacks. */
  prec: number;
  /** 1 to 6; size 3 and up eats 3 supply. */
  size: number;
  /** 1 slow, 2 normal, 3 fast; 0 cannot move. */
  mapSpeed: number;
  weapons: readonly WeaponDef[];
  tags: readonly UnitTag[];
  /** Fraction of max HP regained per battle round. */
  regeneration?: number;
  /** Fire damage dealt to each melee striker per hit landed on this unit (Ash Colossus). */
  fireShield?: number;
  /** N3: added to the amount of every damage and heal effect its spells land (not abilities). */
  spellPower?: number;
  /** N1: battle-start abilities, by catalog id (trigger entries only; commander units only). */
  abilities?: readonly TriggerAbilityId[];
  /** Null for units that cannot be recruited (summons, independents). */
  cost: UnitCost | null;
  /** Troops: days per batch of 10. Commanders: days per unit. 0 when not recruitable. */
  recruitDays: number;
  requires: readonly RecruitRequirement[];
  /** Present on commanders. */
  commander?: CommanderTraits;
}

export interface StartingCommander {
  commander: UnitTypeId;
  squads: readonly { unit: UnitTypeId; count: number }[];
}

export interface AiPersonality {
  aggression: number;
  expansion: number;
  research: number;
  pillage: number;
}

export interface NationDef {
  id: string;
  name: string;
  /** Color identity, primary first. M1 nations have one color; the format holds more. */
  colors: readonly [Color, ...Color[]];
  motto: string;
  description: string;
  capitalName: string;
  capitalTerrain: TerrainId;
  /** Recruitable troops. */
  troops: readonly UnitTypeId[];
  /** Recruitable commanders. */
  commanders: readonly UnitTypeId[];
  /** Provincial defense: militia-grade and archer-grade units. */
  pd: { militia: UnitTypeId; archer: UnitTypeId };
  /** Battle defense bonus for the nation's units on a home terrain, on either side. */
  homeTerrain: { terrain: TerrainId; def: number } | null;
  startingArmy: readonly StartingCommander[];
  startingResearch: { color: Color; level: number };
  /** The two chassis that fit the nation, highlighted on the pretender screen (docs/05). */
  chassis: readonly [string, string];
  ai: AiPersonality;
}

export type { BuildingId };

export interface BuildingDef {
  id: BuildingId;
  name: string;
  gold: number;
  materials: number;
  days: number;
  /** False for buildings that exist but cannot be built in this milestone (forts in M1). */
  buildable: boolean;
}
