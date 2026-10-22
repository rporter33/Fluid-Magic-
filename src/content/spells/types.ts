// Shapes of spell records (docs/02-magic.md sections 3 and 5). A spell is data: its costs and
// a list of effect primitives, the only effects the battle resolver and the ritual code know.
import type { Color } from '../colors';
import type { Element } from '../types';
import type { UnitTypeId } from '../units';

/** Mana by color, as spell costs and carried mana count it. */
export type ManaAmounts = Partial<Record<Color, number>>;

/** Stats a spell can raise or lower in battle. */
export const SPELL_STATS = ['str', 'att', 'def', 'prot', 'mor', 'prec'] as const;
export type SpellStat = (typeof SPELL_STATS)[number];

export type Duration = { kind: 'battle' } | { kind: 'rounds'; rounds: number };

/**
 * Damage reaches one troop, every troop of one group, or `count` troops at random in the
 * target group's row (the only area shape in M1).
 */
export type DamageTarget = { kind: 'single' } | { kind: 'squad' } | { kind: 'area'; count: number };
/** allFriendly includes commanders; allFriendlySquads does not. */
export type FriendlyTarget =
  | { kind: 'self' }
  | { kind: 'friendlySquad' }
  | { kind: 'allFriendly' }
  | { kind: 'allFriendlySquads' };
export type EnemyTarget =
  { kind: 'enemySquad' } | { kind: 'allEnemy' } | { kind: 'area'; count: number };
/** Targets for effects on whole groups or casters, which have no area form. */
export type EnemyGroupTarget = { kind: 'enemySquad' } | { kind: 'allEnemy' };

export const FIELD_EFFECT_KINDS = ['wall', 'fog', 'storm'] as const;
export type FieldEffectKind = (typeof FIELD_EFFECT_KINDS)[number];

/** Battle effect primitives (docs/02-magic.md section 5). */
export type BattleEffect =
  | {
      kind: 'damage';
      amount: number;
      element: Element;
      targets: DamageTarget;
      armorPiercing?: boolean;
      armorNegating?: boolean;
    }
  | { kind: 'buff'; stat: SpellStat; delta: number; duration: Duration; targets: FriendlyTarget }
  | { kind: 'debuff'; stat: SpellStat; delta: number; duration: Duration; targets: EnemyTarget }
  | { kind: 'summon'; unit: UnitTypeId; count: number; side: 'friendly' }
  /** Heals each troop by amount; removeDebuffs also lifts that many debuff spells per group. */
  | { kind: 'heal'; amount: number; targets: FriendlyTarget; removeDebuffs?: number }
  | { kind: 'fatigueDrain'; amount: number; targets: EnemyGroupTarget }
  /** A negative morale check modifier: the targets must check this round, harder by amount. */
  | { kind: 'moraleShock'; amount: number; targets: EnemyGroupTarget }
  | { kind: 'fieldEffect'; effect: FieldEffectKind; rounds: number };

/** Where a ritual lands: the caster's own province, or a province within some hops of it. */
export type RitualTarget =
  | { kind: 'caster' }
  /** The caster's province, which must hold a fort. */
  | { kind: 'casterFort' }
  | { kind: 'any'; hops: number }
  /** A province the caster's nation owns. */
  | { kind: 'owned'; hops: number };

/** Ritual effect primitives (docs/02-magic.md section 5), applied to the target province. */
export type RitualEffect =
  /** As a new commander (count 1), or as troops joining the caster. */
  | { kind: 'summonToProvince'; unit: UnitTypeId; count: number; commander: boolean }
  | { kind: 'provincePop'; deltaPct: number }
  | { kind: 'provinceUnrest'; delta: number }
  | { kind: 'provinceGrowth'; deltaScale: number; months: number }
  | { kind: 'provinceSupply'; deltaPct: number; months: number }
  /** Materials per month. */
  | { kind: 'provinceMaterials'; delta: number; months: number }
  | { kind: 'provinceDefenseBuff'; prot: number; def: number; months: number }
  /** Every troop in the province takes `dice` d6. */
  | { kind: 'remoteDamage'; dice: number; element: Element }
  | { kind: 'scry' }
  | { kind: 'dominionPush'; strength: number }
  /** The nation's whole `from` pool becomes `to`, `ratio` to one. */
  | { kind: 'manaConvert'; from: Color; to: Color; ratio: number };

interface SpellBase {
  id: string;
  name: string;
  /** The primary color, whose research level the spell needs; null for holy spells. */
  color: Color | null;
  /** Research level in the spell's color; 0 for holy spells, which need none. */
  level: number;
  /**
   * Color pips, in docs notation: one letter per pip, a slash joining the letters of a pip
   * either color can fill ('RR', 'R/G'). Empty for holy spells.
   */
  requirement: string;
  /** Holy pips needed. */
  holy: number;
  description: string;
}

export interface BattleSpellDef extends SpellBase {
  kind: 'battle';
  /** Fatigue added per cast, before the extra-pip reduction. */
  fatigue: number;
  /** Mana the caster must carry, consumed by each cast. */
  carriedMana: ManaAmounts;
  effects: readonly BattleEffect[];
}

export interface RitualSpellDef extends SpellBase {
  kind: 'ritual';
  /** Mana from the national pool: by color, plus generic mana of any colors. */
  cost: { mana: ManaAmounts; generic: number };
  castDays: number;
  target: RitualTarget;
  effects: readonly RitualEffect[];
}

export type SpellDef = BattleSpellDef | RitualSpellDef;

/**
 * What target planning and effect application read from a spell or an ability (N1): its id,
 * which is the source of the stat changes it makes, and its effects. BattleSpellDef has both.
 */
export interface EffectSource {
  id: string;
  effects: readonly BattleEffect[];
}
