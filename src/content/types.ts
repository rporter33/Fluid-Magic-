// Shapes of content records. Content is plain typed data; the sim reads it through the
// registry in content/index.ts.
import type { Color } from './colors';
import type { TerrainId } from './terrain';

/** Damage elements. Physical is the default for weapons without one. */
export const ELEMENTS = ['physical', 'fire', 'nature', 'cold', 'holy', 'decay'] as const;
export type Element = (typeof ELEMENTS)[number];

export interface WeaponDef {
  name: string;
  /** Added to strength for melee damage, or the whole damage roll base for ranged. */
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
  /** Provinces seen beyond the commander's own (scouts). */
  sight?: number;
  /** A fort's garrison holder: free, immobile, never fights itself. */
  garrison?: boolean;
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
  /** Null for units that cannot be recruited (summons, independents). */
  cost: UnitCost | null;
  /** Troops: days per batch of 10. Commanders: days per unit. 0 when not recruitable. */
  recruitDays: number;
  requires: readonly RecruitRequirement[];
  /** Present on commanders. */
  commander?: CommanderTraits;
}

export interface StartingCommander {
  commander: string;
  squads: readonly { unit: string; count: number }[];
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
  color: Color;
  motto: string;
  description: string;
  capitalName: string;
  capitalTerrain: TerrainId;
  /** Recruitable troops, by unit id. */
  troops: readonly string[];
  /** Recruitable commanders, by unit id. */
  commanders: readonly string[];
  /** Provincial defense: militia-grade and archer-grade unit ids. */
  pd: { militia: string; archer: string };
  startingArmy: readonly StartingCommander[];
  startingResearch: { color: Color; level: number };
  ai: AiPersonality;
}

export type BuildingId = 'temple' | 'lab' | 'fort';

export interface BuildingDef {
  id: BuildingId;
  name: string;
  gold: number;
  materials: number;
  days: number;
  /** False for buildings that exist but cannot be built in this milestone (forts in M1). */
  buildable: boolean;
}
