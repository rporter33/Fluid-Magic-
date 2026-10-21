// The blessing menu (docs/05-pretender.md Step 6, docs/02-magic.md section 8), after Dominions
// 6. Each color's pips give bless points that buy that color's blessings; the standard and
// greater blessings are the fixed bless of Phase 5 and the default picks. Full menus for White,
// Blue and Black come with their nations in M2. Thornhide (Green, a nature shield) waits for
// shields by element (Phase 6b.2, N4).
import type { Color } from '../colors';
import type { Element, Shield } from '../types';
import type { ScalePoleRef } from './chassis';

/** What a blessing does to each blessed unit, folded in at battle setup. */
export interface BlessingEffect {
  att?: number;
  str?: number;
  def?: number;
  prot?: number;
  mor?: number;
  prec?: number;
  /** Share of max HP regained per round. */
  regeneration?: number;
  /** HP regained per damaging hit. */
  lifeDrain?: number;
  /** A retaliation shield (fire only until Phase 6b.2). */
  shield?: Shield;
  /** Every melee weapon gains this much damage, and the element and armor piercing if given. */
  melee?: { dmg: number; element?: Element; armorPiercing?: true };
  /** Every melee weapon gains this much damage in the unit's first melee round. */
  firstRoundBonus?: number;
  berserk?: true;
}

export interface BlessingDef {
  id: string;
  name: string;
  color: Color;
  /** Pips needed in `color`, 2 to 6. */
  requires: number;
  /** Bless points of `color`: max(1, requires - 1), which content validation checks. */
  cost: number;
  /** `${color}.${stat}`; a design chooses at most one blessing per group. */
  group: string;
  /** Works only while the god is on the map (not before it arrives, recalled, or dead). */
  incarnate: boolean;
  /** A scale step the design must also have, as Dominions asks for some blessings. */
  requiresScale?: ScalePoleRef & { steps: number };
  /** The default picks: the fixed bless at 4 pips ('standard') and its doubled form at 6. */
  tier?: 'standard' | 'greater';
  effect: BlessingEffect;
}

export const BLESSINGS = {
  // White (Radiance): minors, then the fixed bless.
  resolve: b('resolve', 'Resolve', 'W', 2, 1, 'W.mor', { mor: 1 }),
  warding: b('warding', 'Warding', 'W', 2, 1, 'W.prot', { prot: 1 }),
  steadfast: b('steadfast', 'Steadfast', 'W', 4, 3, 'W.std', { mor: 2, prot: 1 }, 'standard'),
  greaterSteadfast: b(
    'greaterSteadfast',
    'Greater Steadfast',
    'W',
    6,
    5,
    'W.std',
    { mor: 4, prot: 2 },
    'greater',
  ),
  // Blue (Tide).
  keenEye: b('keenEye', 'Keen Eye', 'U', 2, 1, 'U.prec', { prec: 1 }),
  wariness: b('wariness', 'Wariness', 'U', 2, 1, 'U.def', { def: 1 }),
  clearSight: b('clearSight', 'Clear Sight', 'U', 4, 3, 'U.std', { def: 2, prec: 2 }, 'standard'),
  greaterClearSight: b(
    'greaterClearSight',
    'Greater Clear Sight',
    'U',
    6,
    5,
    'U.std',
    { def: 4, prec: 4 },
    'greater',
  ),
  // Black (Umbra).
  cruelty: b('cruelty', 'Cruelty', 'B', 2, 1, 'B.att', { att: 1 }),
  grimResolve: b('grimResolve', 'Grim Resolve', 'B', 2, 1, 'B.mor', { mor: 1 }),
  bloodThirst: b(
    'bloodThirst',
    'Blood Thirst',
    'B',
    4,
    3,
    'B.std',
    { lifeDrain: 2, att: 1 },
    'standard',
  ),
  greaterBloodThirst: b(
    'greaterBloodThirst',
    'Greater Blood Thirst',
    'B',
    6,
    5,
    'B.std',
    { lifeDrain: 4, att: 2 },
    'greater',
  ),
  // Red (Ember).
  fervor: b('fervor', 'Fervor', 'R', 2, 1, 'R.mor', { mor: 1 }),
  keenEdge: b('keenEdge', 'Keen Edge', 'R', 2, 1, 'R.att', { att: 1 }),
  emberMight: b('emberMight', 'Ember Might', 'R', 3, 2, 'R.str', { str: 2 }),
  emberWrath: b('emberWrath', 'Ember Wrath', 'R', 4, 3, 'R.wrath', { att: 2, str: 2 }, 'standard'),
  cinderSkin: b('cinderSkin', 'Cinder Skin', 'R', 4, 3, 'R.shield', {
    shield: { element: 'fire', amount: 3 },
  }),
  blazingCharge: b('blazingCharge', 'Blazing Charge', 'R', 4, 3, 'R.charge', {
    firstRoundBonus: 5,
    mor: 1,
  }),
  furyUnbound: {
    ...b('furyUnbound', 'Fury Unbound', 'R', 5, 4, 'R.berserk', { berserk: true, att: 1 }),
    incarnate: true,
    requiresScale: { axis: 'lore', toward: 'negative', steps: 1 },
  },
  flamingWeapons: {
    ...b('flamingWeapons', 'Flaming Weapons', 'R', 5, 4, 'R.weapon', {
      melee: { dmg: 3, element: 'fire', armorPiercing: true },
    }),
    incarnate: true,
  },
  greaterEmberWrath: b(
    'greaterEmberWrath',
    'Greater Ember Wrath',
    'R',
    6,
    5,
    'R.wrath',
    { att: 4, str: 4 },
    'greater',
  ),
  livingPyre: {
    ...b('livingPyre', 'Living Pyre', 'R', 6, 5, 'R.shield', {
      shield: { element: 'fire', amount: 5 },
      att: 2,
    }),
    incarnate: true,
  },
  // Green (Loam).
  thickSkin: b('thickSkin', 'Thick Skin', 'G', 2, 1, 'G.prot', { prot: 1 }),
  vigor: b('vigor', 'Vigor', 'G', 2, 1, 'G.regen', { regeneration: 0.05 }),
  strengthOfEarth: b('strengthOfEarth', 'Strength of the Earth', 'G', 3, 2, 'G.str', { str: 2 }),
  evergreen: b(
    'evergreen',
    'Evergreen',
    'G',
    4,
    3,
    'G.regen',
    { regeneration: 0.1, prot: 1 },
    'standard',
  ),
  oakhide: b('oakhide', 'Oakhide', 'G', 4, 3, 'G.prot', { prot: 3 }),
  deepRoots: b('deepRoots', 'Deep Roots', 'G', 4, 3, 'G.mor', { mor: 3, prot: 1 }),
  wildVigor: {
    ...b('wildVigor', 'Wild Vigor', 'G', 5, 4, 'G.regen', { regeneration: 0.2, str: 1 }),
    incarnate: true,
    requiresScale: { axis: 'growth', toward: 'positive', steps: 1 },
  },
  greaterEvergreen: b(
    'greaterEvergreen',
    'Greater Evergreen',
    'G',
    6,
    5,
    'G.regen',
    { regeneration: 0.2, prot: 2 },
    'greater',
  ),
  ironbark: {
    ...b('ironbark', 'Ironbark', 'G', 6, 5, 'G.prot', { prot: 5, str: 2 }),
    incarnate: true,
  },
} satisfies Record<string, BlessingDef>;

export type BlessingId = keyof typeof BLESSINGS;

/** Every blessing in content order: by color in COLORS order, then by requirement. */
export const BLESSING_LIST: readonly BlessingDef[] = Object.values(BLESSINGS);

export function isBlessingId(value: unknown): value is BlessingId {
  return typeof value === 'string' && Object.hasOwn(BLESSINGS, value);
}

/** A blessing that is not incarnate; the incarnate ones override the flag. */
function b(
  id: string,
  name: string,
  color: Color,
  requires: number,
  cost: number,
  group: string,
  effect: BlessingEffect,
  tier?: 'standard' | 'greater',
): BlessingDef {
  const def: BlessingDef = { id, name, color, requires, cost, group, incarnate: false, effect };
  if (tier) def.tier = tier;
  return def;
}
