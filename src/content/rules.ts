// Rule numbers the sim reads (docs/01-core-rules.md). Values the docs do not give are
// recorded in docs/09-balance.md.

export const TIME = {
  daysPerMonth: 30,
} as const;

export const TAX_RATE_IDS = ['low', 'normal', 'high'] as const;
export type TaxRate = (typeof TAX_RATE_IDS)[number];

/** Section 4, Gold: tax multiplier and its unrest per month. */
export const TAX_RATES: Readonly<Record<TaxRate, { rate: number; unrestPerMonth: number }>> = {
  low: { rate: 0.5, unrestPerMonth: -2 },
  normal: { rate: 1, unrestPerMonth: 0 },
  high: { rate: 1.5, unrestPerMonth: 4 },
};

export const ECONOMY = {
  /** Gold per month = pop / popPerGold * tax * order factor * unrest factor. */
  popPerGold: 100,
  /** Unrest factor = 1 - unrest / unrestGoldDivisor. */
  unrestGoldDivisor: 200,
  /** Monthly upkeep = goldCost / upkeepDivisor, for troops and commanders alike. */
  upkeepDivisor: 15,
  sacredUpkeepFactor: 0.5,
  /** Gold in the treasury at game start. */
  startGold: 300,
  /** Days of unpaid upkeep per point of troop morale lost, and the most that can be lost. */
  unpaidDaysPerMorale: 30,
  unpaidMoraleCap: 3,
} as const;

/** docs/01-core-rules.md section 3: the Pillage order, per pillaged province per day. */
export const PILLAGE = {
  /** Share of the population removed. */
  popFraction: 0.02,
  /** Gold to the pillager per this many people lost. */
  popPerGold: 20,
  unrestPerDay: 5,
} as const;

export const MATERIALS = {
  /** Materials per month = terrain base + pop / popDivisor. */
  popDivisor: 500,
  /** A fort's pool holds at most this many months of its production. */
  capMonths: 6,
  /** Share of an adjacent fortless friendly province's materials a fort collects. */
  neighborShare: 0.5,
} as const;

export const SUPPLY = {
  /** Supply per day = terrain base + pop / popDivisor. */
  popDivisor: 50,
  /** Units of this size or larger eat bigUnitSupply per day; others eat 1. */
  bigUnitSize: 3,
  bigUnitSupply: 3,
  commanderSupply: 1,
  /** A besieged fort province's supply is multiplied by this. */
  besiegedFactor: 0.5,
  /** Fraction of max HP lost per starving day, and regained per fed day. */
  starvationHpPerDay: 0.02,
  healHpPerDay: 0.02,
  /** Starving days per point of morale lost, and the most that can be lost. */
  starvationDaysPerMorale: 5,
  starvationMoraleCap: 3,
} as const;

export const POPULATION = {
  /** Monthly growth fraction before scales: pop * (base + growth scale effects). */
  baseGrowth: 0.002,
} as const;

export const UNREST = {
  max: 100,
  /** Monthly decay before scales. */
  decayPerMonth: 2,
  /** Monthly decay per priest of the owner in the province. */
  priestDecayPerMonth: 5,
  /** Monthly unrest per this much enemy dominion strength. */
  enemyDominionStrengthPerPoint: 3,
  /** Recruitment is blocked above this unrest. */
  recruitBlockAbove: 50,
} as const;

export const MANA = {
  perSpring: 1,
  /** Per color, per month, to a Wellspring's owner. */
  wellspringPerColor: 2,
  /** Dominion tint: floor(strength / tintStrengthPerMana) mana of the dominator's color. */
  tintStrengthPerMana: 3,
} as const;

export const DOMINION = {
  min: 1,
  max: 10,
} as const;

export const MESSAGES = {
  /** Messages kept in the log; older ones are dropped. */
  keep: 300,
} as const;

/** Cumulative research points to reach each level, 0 to 6 (docs/02-magic.md section 4). */
export const RESEARCH_LEVEL_POINTS: readonly number[] = [0, 60, 150, 300, 500, 750, 1050];
