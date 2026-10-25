// AI difficulty levels (docs/08-ai.md, "Difficulty") and every number the AI plays by
// (docs/08-ai.md; values the docs do not give are recorded in docs/09-balance.md).
export type Difficulty = 'easy' | 'normal';

export interface DifficultyDef {
  /** Multiplier on the AI nation's gold income. */
  incomeFactor: number;
  /** Days between AI planning calls. */
  planEveryDays: number;
  /** The War step is skipped before this month. */
  warFromMonth: number;
}

export const DIFFICULTIES: Readonly<Record<Difficulty, DifficultyDef>> = {
  easy: { incomeFactor: 0.8, planEveryDays: 10, warFromMonth: 12 },
  normal: { incomeFactor: 1, planEveryDays: 5, warFromMonth: 0 },
};

export interface AiNumbers {
  /** A recruitable commander with no pips, holy 0, not stealthy, leading this many, leads. */
  readonly leaderLeadership: number;
  /** Troops per recruit order: large when affordable, else small, never fewer. */
  readonly batch: { readonly large: number; readonly small: number };
  /** The capital's recruitment queue is kept between min and max items deep. */
  readonly queue: { readonly min: number; readonly max: number };
  /** One leader more than baseLeaders per this many provinces owned (rounded down). */
  readonly provincesPerLeader: number;
  /** Leaders wanted before any province is counted. */
  readonly baseLeaders: number;
  /** One mage per this many provinces owned (rounded down), at least minMages. */
  readonly provincesPerMage: number;
  /** Mages always wanted. */
  readonly minMages: number;
  /** One priest per this many provinces owned (rounded down). */
  readonly provincesPerPriest: number;
  /** Scouts kept; a lost one is replaced. */
  readonly scouts: number;
  /** Melee troops wanted per ranged troop, by troop count. */
  readonly meleeRangedRatio: number;
  /** A group is a field army once its leader leads this many troops. */
  readonly fieldArmyTroops: number;
  /** Attack an independent province with more than this many times its defenders' power. */
  readonly expansionRatio: number;
  /** War odds and attacks on an enemy province need this many times the enemy's power. */
  readonly warRatio: number;
  /** A group relieves a besieged own fort with this many times the besiegers' power. */
  readonly reliefRatio: number;
  /** Besiegers storm breached walls with this many times the defenders' power. */
  readonly stormRatio: number;
  /** Capital garrison troops kept back from the leaders standing there. */
  readonly capitalGarrison: number;
  /** Enemy groups within this many hops of an own province threaten it. */
  readonly threatHops: number;
  /** Enemy commanders within this many hops of a new War target count against its odds. */
  readonly warHops: number;
  /** An independent province holding more troops than this calls for border PD. */
  readonly independentStrength: number;
  /** Extra power share of a unit with a ranged weapon. */
  readonly rangedBonus: number;
  /** Expansion score weights: population per point, per spring, for a Wellspring. */
  readonly score: { readonly popPer: number; readonly spring: number; readonly wellspring: number };
  /** Expansion score loss per path day, scaled by (1 - expansion personality). */
  readonly distancePenalty: number;
  /** PD levels bought on the border (enemy or strong independent) and next to an enemy nation. */
  readonly pd: { readonly border: number; readonly enemy: number };
  /** PD level bought in an owned Wellspring province. */
  readonly wellspringPd: number;
  /** Gold kept for recruitment: PD and buildings spend only what lies above it. */
  readonly goldReserve: number;
  /** Gold above which a second Lab is built. */
  readonly labGold: number;
  /** Gold above which a Temple is built. */
  readonly templeGold: number;
  /** Population above which a province gets a Temple. */
  readonly templePop: number;
  /** The capital's tax goes High while gold is below this and unrest below taxHighMaxUnrest. */
  readonly taxHighBelowGold: number;
  /** The capital's tax goes High only while its unrest is below this. */
  readonly taxHighMaxUnrest: number;
  /** A ritual is cast only with this many times its cost in the pools it draws on. */
  readonly ritualCostFactor: number;
  /** A fighter pretender stays in the capital until this day, then rides with an army. */
  readonly pretenderJoinDay: number;
  /** Battle mages riding with one army, at most. */
  readonly battleMagesPerArmy: number;
  /** Mana a battle mage carries in total, at most. */
  readonly carriedMana: number;
  /** A temple province of the nation's own dominion at this strength keeps it from Godless. */
  readonly godlessAlarm: number;
}

/** The AI's numbers: src/ai holds no game-number literals of its own. */
export const AI: AiNumbers = {
  leaderLeadership: 60,
  batch: { large: 20, small: 10 },
  queue: { min: 1, max: 2 },
  provincesPerLeader: 6,
  baseLeaders: 2,
  provincesPerMage: 4,
  minMages: 2,
  provincesPerPriest: 5,
  scouts: 1,
  meleeRangedRatio: 2,
  fieldArmyTroops: 15,
  expansionRatio: 1.5,
  warRatio: 1.2,
  reliefRatio: 1.2,
  stormRatio: 1.3,
  capitalGarrison: 20,
  threatHops: 1,
  warHops: 2,
  independentStrength: 20,
  rangedBonus: 0.1,
  score: { popPer: 1000, spring: 3, wellspring: 10 },
  distancePenalty: 0.05,
  pd: { border: 5, enemy: 10 },
  wellspringPd: 10,
  goldReserve: 150,
  labGold: 500,
  templeGold: 300,
  templePop: 8000,
  taxHighBelowGold: 50,
  taxHighMaxUnrest: 20,
  ritualCostFactor: 2,
  pretenderJoinDay: 90,
  battleMagesPerArmy: 1,
  carriedMana: 2,
  godlessAlarm: 2,
};
