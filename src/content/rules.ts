// Rule numbers the sim reads (docs/01-core-rules.md). Values the docs do not give are
// recorded in docs/09-balance.md.

export const TIME = {
  daysPerMonth: 30,
} as const;

export const TAX_RATE_IDS = ['low', 'normal', 'high'] as const;
export type TaxRate = (typeof TAX_RATE_IDS)[number];

/** Tax rate of every province at game start and when a province is taken. */
export const DEFAULT_TAX_RATE: TaxRate = 'normal';

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
  /** Supply a troop eats per day; units of bigUnitSize or larger eat bigUnitSupply. */
  troopSupply: 1,
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
  /** Messages kept per nation; each nation's oldest are dropped first. */
  keep: 300,
} as const;

/** docs/01-core-rules.md section 6, Movement. */
export const MOVEMENT = {
  /** Leg days = terrain move days * speedFactor[map speed], rounded, at least minLegDays. */
  speedFactor: { 1: 1.5, 2: 1, 3: 0.7 } as Readonly<Record<number, number>>,
  minLegDays: 1,
} as const;

/** docs/01-core-rules.md section 8. */
export const RECRUITMENT = {
  /** Troops per batch for the batch time: days = recruitDays * ceil(count / batchSize). */
  batchSize: 10,
  maxBatch: 50,
  minDays: 1,
} as const;

/** Provincial defense (docs/01-core-rules.md section 8). */
export const PD = {
  maxLevel: 30,
  /** Raising PD from level L costs (L + 1) * goldPerLevel. */
  goldPerLevel: 15,
  militiaPerLevel: 2,
  /** One archer-grade defender per this many levels. */
  levelsPerArcher: 5,
} as const;

/** docs/01-core-rules.md section 14. */
export const VISION = {
  /** Graph distance seen from owned provinces and from commanders without their own sight. */
  baseSight: 1,
  /** Independents' exact strength shows within this distance of one of the nation's scouts. */
  scoutExactRange: 1,
} as const;

/** docs/04-battle.md and docs/01-core-rules.md section 10. */
export const BATTLE = {
  /** Safety cap; the attacker retreats at attackerRetreatRound if nothing is decided. */
  maxRounds: 75,
  attackerRetreatRound: 50,
  /** Round from which a unit attacks in melee, by map speed; flying units use speed 3. */
  closingRound: { 1: 4, 2: 3, 3: 2 } as Readonly<Record<number, number>>,
  /** Ranged weapons of at least this range reach the rear row; shorter ones reach the middle. */
  rearReach: 5,
  /** The base both rolls are compared with: prec + DRN >= toHit + DRN, mor + DRN >= ... */
  ranged: { toHit: 10 },
  morale: {
    base: 10,
    /** Squads check when losses since the start exceed this share, or this round's exceed the other. */
    totalLossShare: 0.2,
    roundLossShare: 0.1,
    /** Units with this morale or more never check. */
    fearless: 50,
    /** Added when the side has lost more than halfLost of its starting troops. */
    halfLostShare: 0.5,
    halfLostPressure: 2,
    /** Added for squads whose commander died this round. */
    commanderDeathPressure: 4,
  },
  /** docs/03-nations.md: berserk troops gain att and str below this share of their max HP. */
  berserk: { att: 2, str: 2, belowHpShare: 0.5 },
  /** Population lost: popLossPer100 of the province's people per 100 casualties. */
  popLossPer100: 0.005,
  /** Unrest when the province owner loses a battle there. */
  lostBattleUnrest: 10,
  /** Battle records kept, newest last. */
  keep: 20,
} as const;

/** docs/01-core-rules.md section 11. */
export const SIEGE = {
  wallHp: 300,
  /** Daily wall damage = attackers' total str / attackDivisor; repair = defenders' / repairDivisor. */
  attackDivisor: 10,
  repairDivisor: 20,
} as const;

/** Storm bonuses for the fort's defenders. */
export const STORM = {
  morale: 2,
  /** Protection once the walls are down, and while they stand. */
  breachedProt: 3,
  wallsProt: 6,
} as const;

/** docs/05-pretender.md, "Prophet": a new prophet may be named this long after one dies. */
export const PROPHET = {
  cooldownDays: 24 * 30,
} as const;

/** docs/04-battle.md, "Scripts": script slots per commander. */
export const SCRIPT_SLOTS = 5;

export const CONSTRUCTION = {
  /** No construction finishes in fewer days, however fast the scales make it. */
  minDays: 1,
} as const;

/** Cumulative research points to reach each level, 0 to 6 (docs/02-magic.md section 4). */
export const RESEARCH_LEVEL_POINTS: readonly number[] = [0, 60, 150, 300, 500, 750, 1050];
