// The five Scales (docs/05-pretender.md step 4). Each axis runs from -3 to +3 between two
// enemy colors; the positive pole is listed first. Each pole lists its effect per step toward
// it. Effects named by docs/01-core-rules.md formulas apply in both directions: Turmoil
// lowers gold as the gold formula's (1 + 0.07 * order) says, Wild lowers materials as the
// materials rule says. Design-point costs join in Phase 6.
import type { Color } from '../colors';

export const SCALE_AXES = ['order', 'lore', 'growth', 'wild', 'sanctity'] as const;
export type ScaleAxis = (typeof SCALE_AXES)[number];

/** Effects of one step toward a pole. Percentages are fractions (0.07 = 7%). */
export interface ScaleEffects {
  /** Province gold income. */
  goldPct?: number;
  /** Province unrest per month. */
  unrestPerMonth?: number;
  recruitTimePct?: number;
  /** Random events are M2; stored but unused. */
  eventChancePct?: number;
  researchPct?: number;
  /** Battle: precision, attack, and morale of the dominating nation's units. */
  precision?: number;
  attack?: number;
  morale?: number;
  /** Province population growth per month, as a fraction of population. */
  popGrowth?: number;
  supplyPct?: number;
  /** Extra Black mana per month from dominion tint. */
  tintManaB?: number;
  beastCostPct?: number;
  buildTimePct?: number;
  materialsPct?: number;
  templeChecks?: number;
  sacredMorale?: number;
  templeCostPct?: number;
  /** Unrest per month in other nations' provinces your dominion touches. */
  enemyUnrestPerMonth?: number;
  undeadUpkeepPct?: number;
  /**
   * Battle: morale of your enemies in a province you dominate, per step of the province's
   * effective scale, which already grows with your dominion strength there.
   */
  enemyMorale?: number;
}
export type ScaleEffectKey = keyof ScaleEffects;

export interface ScalePole {
  name: string;
  color: Color;
  effects: ScaleEffects;
}

export interface ScaleAxisDef {
  id: ScaleAxis;
  /** The +3 pole. */
  positive: ScalePole;
  /** The -3 pole. */
  negative: ScalePole;
}

export const SCALE_MIN = -3;
export const SCALE_MAX = 3;

export const SCALE_DEFS: Readonly<Record<ScaleAxis, ScaleAxisDef>> = {
  order: {
    id: 'order',
    positive: {
      name: 'Order',
      color: 'W',
      effects: { goldPct: 0.07, unrestPerMonth: -2, recruitTimePct: 0.05 },
    },
    negative: {
      name: 'Turmoil',
      color: 'R',
      effects: { goldPct: -0.07, unrestPerMonth: 2, recruitTimePct: -0.1, eventChancePct: 0.05 },
    },
  },
  lore: {
    id: 'lore',
    positive: { name: 'Lore', color: 'U', effects: { researchPct: 0.1, precision: 1 } },
    negative: {
      name: 'Fury',
      color: 'R',
      effects: { attack: 1, morale: 1, researchPct: -0.1 },
    },
  },
  growth: {
    id: 'growth',
    positive: { name: 'Growth', color: 'G', effects: { popGrowth: 0.003, supplyPct: 0.1 } },
    negative: {
      name: 'Rot',
      color: 'B',
      effects: { popGrowth: -0.003, supplyPct: -0.1, tintManaB: 1 },
    },
  },
  wild: {
    id: 'wild',
    positive: {
      name: 'Wild',
      color: 'G',
      effects: { supplyPct: 0.15, beastCostPct: -0.1, buildTimePct: 0.15, materialsPct: -0.1 },
    },
    negative: {
      name: 'Artifice',
      color: 'U',
      effects: { materialsPct: 0.1, buildTimePct: -0.15, supplyPct: -0.1 },
    },
  },
  sanctity: {
    id: 'sanctity',
    positive: {
      name: 'Sanctity',
      color: 'W',
      effects: { templeChecks: 1, sacredMorale: 1, templeCostPct: -0.25 },
    },
    negative: {
      name: 'Dread',
      color: 'B',
      effects: { enemyUnrestPerMonth: 2, undeadUpkeepPct: -0.25, enemyMorale: -1 },
    },
  },
};

/** A value per axis, -3 to +3. */
export type Scales = Record<ScaleAxis, number>;

export const NEUTRAL_SCALES: Readonly<Scales> = {
  order: 0,
  lore: 0,
  growth: 0,
  wild: 0,
  sanctity: 0,
};

/** A one-step push on one axis: +1 toward the positive pole, -1 toward the negative. */
export interface ScaleStep {
  axis: ScaleAxis;
  step: 1 | -1;
}
