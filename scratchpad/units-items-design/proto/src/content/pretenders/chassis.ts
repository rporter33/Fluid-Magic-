// The six pretender chassis (docs/05-pretender.md, Step 1).
import type { Color } from '../colors';
import type { UnitTypeId } from '../units';

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
  },
} satisfies Record<string, ChassisDef>;

export type ChassisId = keyof typeof CHASSIS;

export function isChassisId(value: unknown): value is ChassisId {
  return typeof value === 'string' && Object.hasOwn(CHASSIS, value);
}
