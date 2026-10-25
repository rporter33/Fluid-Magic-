// Independent defenders (docs/01-core-rules.md section 9, docs/03-nations.md Independents).
// Every non-capital province starts with one Independent Captain leading its generated
// strength in troops from a terrain pool. Farmland and wasteland have no pool in the docs and
// use the plains pool (docs/09-balance.md).
import type { TerrainId } from './terrain';
import type { UnitTypeId } from './units';

export interface IndependentPool {
  /** Troop types and their relative shares of the force. */
  troops: readonly { unit: UnitTypeId; weight: number }[];
  /** A unit added once, counted in the strength, from this distance to the nearest capital. */
  champion?: { unit: UnitTypeId; minCapitalDistance: number };
}

const PLAINS: IndependentPool = {
  troops: [
    { unit: 'lightInfantry', weight: 2 },
    { unit: 'archer', weight: 1 },
  ],
};

export const INDEPENDENT_POOLS: Readonly<Record<TerrainId, IndependentPool>> = {
  plains: PLAINS,
  farmland: PLAINS,
  wasteland: PLAINS,
  forest: {
    troops: [
      { unit: 'wolf', weight: 2 },
      { unit: 'archer', weight: 1 },
    ],
  },
  hills: { troops: [{ unit: 'heavyInfantry', weight: 1 }] },
  mountains: {
    troops: [{ unit: 'heavyInfantry', weight: 1 }],
    champion: { unit: 'giant', minCapitalDistance: 3 },
  },
  swamp: { troops: [{ unit: 'swampFighter', weight: 1 }] },
};

export const INDEPENDENT_COMMANDER: UnitTypeId = 'independentCaptain';

/** docs/01-core-rules.md section 14: how fogged independent strength reads, by troop count. */
export const STRENGTH_WORDS = [
  { word: 'weak', below: 16 },
  { word: 'moderate', below: 24 },
  { word: 'strong', below: 30 },
  { word: 'fortress', below: Infinity },
] as const;

export type StrengthWord = (typeof STRENGTH_WORDS)[number]['word'];
