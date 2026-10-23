// The pretender chassis (docs/05-pretender.md, Step 1), in the order of its table: the generic
// chassis, then the Red realm, then the Green. Phase 6b.1 gave the six of Phase 6 their realm,
// role, new-color price and AI power; Phase 6b.2 added the monthly summon's type, which bound
// squads read in battle; Phase 6b.3 brought the ten new chassis of the 2026-10-21 pretender build
// spec (A.2, A.4), at the owner's direction ("good options for pretenders like Dominions has").
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
  /**
   * N7: troops that join the pretender on the first day of each month while it stands in its
   * nation's dominion; cap counts the nation's whole stock of the unit. A squad of this unit led
   * by the pretender is bound in battle (N5), whatever its source.
   */
  monthlySummon?: { unit: UnitTypeId; count: number; cap: number };
  /** N8: it reforms at the capital this many days after dying in its nation's dominion. */
  reform?: { days: number };
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
  ascendedHero: {
    id: 'ascendedHero',
    name: 'Ascended Hero',
    cost: 100,
    basePips: { color: 'nation', count: 1 },
    baseDominion: 1,
    body: 'ascendedHero',
    pipDiscount: 0,
    dominionFactor: 1,
    notes: 'A cheap, fast general with Avatar built in: it fights blessed in its own dominion.',
    realm: 'generic',
    role: 'leader',
    newColorFirstPip: 50,
    avatar: true,
    aiPower: 80,
  },
  primordial: {
    id: 'primordial',
    name: 'Primordial',
    cost: 220,
    basePips: { color: 'nation', count: 2 },
    baseDominion: 3,
    body: 'primordial',
    pipDiscount: 0,
    dominionFactor: 1,
    notes: 'Must start dormant or imprisoned. Fear at battle start; tramples small bodies.',
    realm: 'generic',
    role: 'monster',
    newColorFirstPip: 80,
    minAwakening: 'dormant',
    aiPower: 218,
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
  ashPhoenix: {
    id: 'ashPhoenix',
    name: 'Ash Phoenix',
    cost: 120,
    basePips: { color: 'R', count: 1 },
    baseDominion: 2,
    body: 'ashPhoenix',
    pipDiscount: 0,
    dominionFactor: 1,
    notes:
      'Flying raider with a fire shield. Reforms at the capital 90 days after dying in its own dominion.',
    realm: 'R',
    role: 'raider',
    newColorFirstPip: 80,
    attunement: [{ axis: 'growth', toward: 'positive' }],
    reform: { days: 90 },
    aiPower: 138,
  },
  pyreLord: {
    id: 'pyreLord',
    name: 'Pyre Lord',
    cost: 140,
    basePips: { color: 'R', count: 2 },
    baseDominion: 2,
    body: 'pyreLord',
    pipDiscount: 0,
    dominionFactor: 1,
    notes: 'Kindle the Host: 6 Fire Sprites join it at battle start.',
    realm: 'R',
    role: 'summoner',
    newColorFirstPip: 60,
    aiPower: 189,
  },
  cinderIdol: {
    id: 'cinderIdol',
    name: 'Cinder Idol',
    cost: 110,
    basePips: { color: 'R', count: 2 },
    baseDominion: 4,
    body: 'cinderIdol',
    pipDiscount: 0,
    dominionFactor: 1,
    notes:
      'Cannot move. 2 Fire Sprites join it each month in its dominion, up to 20 in the nation.',
    realm: 'R',
    role: 'idol',
    newColorFirstPip: 50,
    attunement: [{ axis: 'sanctity', toward: 'negative' }],
    monthlySummon: { unit: 'fireSprite', count: 2, cap: 20 },
    aiPower: 305,
  },
  emberHierophant: {
    id: 'emberHierophant',
    name: 'Ember Hierophant',
    cost: 60,
    basePips: { color: 'R', count: 2 },
    baseDominion: 1,
    body: 'emberHierophant',
    pipDiscount: 0,
    dominionFactor: 1,
    notes: 'Battle mage: spell power 3. Does not research.',
    realm: 'R',
    role: 'mage',
    newColorFirstPip: 40,
    aiPower: 0,
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
  worldTree: {
    id: 'worldTree',
    name: 'World Tree',
    cost: 150,
    basePips: { color: 'G', count: 2 },
    baseDominion: 4,
    body: 'worldTree',
    pipDiscount: 0,
    dominionFactor: 1,
    notes: 'Cannot move. One more Green spring at the capital.',
    realm: 'G',
    role: 'idol',
    newColorFirstPip: 50,
    attunement: [{ axis: 'sanctity', toward: 'positive' }],
    startSprings: { color: 'G', count: 1 },
    aiPower: 645,
  },
  hornedHunter: {
    id: 'hornedHunter',
    name: 'Horned Hunter',
    cost: 140,
    basePips: { color: 'G', count: 2 },
    baseDominion: 2,
    body: 'hornedHunter',
    pipDiscount: 0,
    dominionFactor: 1,
    notes: 'Call the Hunt: 8 Wolves join it at battle start.',
    realm: 'G',
    role: 'summoner',
    newColorFirstPip: 60,
    attunement: [{ axis: 'lore', toward: 'negative' }],
    aiPower: 210,
  },
  elderWyrm: {
    id: 'elderWyrm',
    name: 'Elder Wyrm',
    cost: 190,
    basePips: { color: 'G', count: 1 },
    baseDominion: 2,
    body: 'elderWyrm',
    pipDiscount: 0,
    dominionFactor: 1,
    notes: 'Wingless regenerating monster that tramples small bodies.',
    realm: 'G',
    role: 'monster',
    newColorFirstPip: 80,
    aiPower: 210,
  },
  motherOfBeasts: {
    id: 'motherOfBeasts',
    name: 'Mother of Beasts',
    cost: 130,
    basePips: { color: 'G', count: 1 },
    baseDominion: 2,
    body: 'motherOfBeasts',
    pipDiscount: 0,
    dominionFactor: 1,
    notes:
      '2 Wolves join her each month in her dominion, up to 24 in the nation; they never drag her into a rout.',
    realm: 'G',
    role: 'summoner',
    newColorFirstPip: 60,
    monthlySummon: { unit: 'wolf', count: 2, cap: 24 },
    aiPower: 65,
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
