// The pretender chassis (docs/05-pretender.md, Step 1). Phase 6b.1 gave the six of Phase 6
// their realm, role, new-color price and AI power; the ten new chassis arrive in Phase 6b.3.
import type { Color } from '../colors';
import type { UnitTypeId } from '../units';
import type { ScaleAxis } from './scales';
import type { Awakening } from './types';

/** What a body is for: the AI and the pretender screen read it, never a rule (D8). */
export const CHASSIS_ROLES = [
  'mage',
  'leader',
  'fighter',
  'monster',
  'raider',
  'summoner',
  'idol',
] as const;
export type ChassisRole = (typeof CHASSIS_ROLES)[number];

/** A scale pole, by axis and direction. */
export interface ScalePoleRef {
  axis: ScaleAxis;
  toward: 'positive' | 'negative';
}

export interface ChassisDef {
  id: string;
  name: string;
  /** Design points. */
  cost: number;
  /** Free pips: in the nation's primary color, or in a fixed color. */
  basePips: { color: Color | 'nation'; count: number } | null;
  baseDominion: number;
  /** The commander unit the pretender walks the map as. */
  body: UnitTypeId;
  /** Design points off every pip (the Oracle's "pips cost 10 less each"). */
  pipDiscount: number;
  /** The pretender's own dominion checks are multiplied by this (the Monolith's "x2"). */
  dominionFactor: number;
  notes: string;
  /** D1: offered to every nation ('generic') or only to nations with this color. */
  realm: 'generic' | Color;
  /** D8. */
  role: ChassisRole;
  /** D2: design points for the first pip of a color outside the nation's identity, before the discount. */
  newColorFirstPip: number;
  /** D3: a step toward one of these poles costs the own-color price, whatever the pole's color. */
  attunement?: readonly ScalePoleRef[];
  /** D4: designs must start at least this deeply asleep. */
  minAwakening?: Exclude<Awakening, 'awake'>;
  /** D5: springs added to the capital at game creation ('nation': the nation's primary color). */
  startSprings?: { color: Color | 'nation'; count: number };
  /** The Avatar boon (boons.ts) is built in. */
  avatar?: true;
  /** A.11: Light Infantry equivalent of the body and its battle-start summons, for armyPower. */
  aiPower: number;
}

export const CHASSIS = {
  oracle: {
    id: 'oracle',
    name: 'Oracle of the Flux',
    cost: 20,
    basePips: null,
    baseDominion: 1,
    body: 'oracle',
    pipDiscount: 10,
    dominionFactor: 1,
    notes: 'Cheapest body. Pips cost 10 less each. Can research (RP as a mage).',
    realm: 'generic',
    role: 'mage',
    newColorFirstPip: 40,
    aiPower: 0,
  },
  titan: {
    id: 'titan',
    name: 'Titan',
    cost: 120,
    basePips: { color: 'nation', count: 1 },
    baseDominion: 2,
    body: 'titan',
    pipDiscount: 0,
    dominionFactor: 1,
    notes: 'Strong fighter.',
    realm: 'generic',
    role: 'leader',
    newColorFirstPip: 60,
    aiPower: 94,
  },
  greatWyrm: {
    id: 'greatWyrm',
    name: 'Great Wyrm',
    cost: 220,
    basePips: { color: 'nation', count: 2 },
    baseDominion: 2,
    body: 'greatWyrm',
    pipDiscount: 0,
    dominionFactor: 1,
    notes: 'The monster. Dormant start recommended.',
    realm: 'generic',
    role: 'monster',
    newColorFirstPip: 80,
    aiPower: 247,
  },
  livingMonolith: {
    id: 'livingMonolith',
    name: 'Living Monolith',
    cost: 60,
    basePips: null,
    baseDominion: 4,
    body: 'livingMonolith',
    pipDiscount: 0,
    dominionFactor: 2,
    notes: 'Cannot move. Dominion checks x2. Casts rituals in the capital.',
    realm: 'generic',
    role: 'idol',
    newColorFirstPip: 50,
    aiPower: 595,
  },
  wildSpirit: {
    id: 'wildSpirit',
    name: 'Wild Spirit',
    cost: 80,
    basePips: { color: 'G', count: 1 },
    baseDominion: 2,
    body: 'wildSpirit',
    pipDiscount: 0,
    dominionFactor: 1,
    notes: 'Hard to catch.',
    realm: 'G',
    role: 'raider',
    newColorFirstPip: 80,
    aiPower: 65,
  },
  ashColossus: {
    id: 'ashColossus',
    name: 'Ash Colossus',
    cost: 100,
    basePips: { color: 'R', count: 1 },
    baseDominion: 1,
    body: 'ashColossus',
    pipDiscount: 0,
    dominionFactor: 1,
    notes: 'Red flavor body. Fire shield: 5 fire damage to melee attackers.',
    realm: 'R',
    role: 'fighter',
    newColorFirstPip: 60,
    aiPower: 160,
  },
} satisfies Record<string, ChassisDef>;

export type ChassisId = keyof typeof CHASSIS;

export function isChassisId(value: unknown): value is ChassisId {
  return typeof value === 'string' && Object.hasOwn(CHASSIS, value);
}

/** A chassis record with every optional field visible. */
export function chassisDef(id: ChassisId): ChassisDef {
  return CHASSIS[id];
}
