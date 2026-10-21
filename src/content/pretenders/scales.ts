// The five Scales (docs/05-pretender.md step 4). Each axis runs from -3 to +3 between two
// enemy colors; the positive pole is listed first. Costs and effects join in Phase 6.
import type { Color } from '../colors';

export const SCALE_AXES = ['order', 'lore', 'growth', 'wild', 'sanctity'] as const;
export type ScaleAxis = (typeof SCALE_AXES)[number];

export interface ScalePole {
  name: string;
  color: Color;
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
    positive: { name: 'Order', color: 'W' },
    negative: { name: 'Turmoil', color: 'R' },
  },
  lore: {
    id: 'lore',
    positive: { name: 'Lore', color: 'U' },
    negative: { name: 'Fury', color: 'R' },
  },
  growth: {
    id: 'growth',
    positive: { name: 'Growth', color: 'G' },
    negative: { name: 'Rot', color: 'B' },
  },
  wild: {
    id: 'wild',
    positive: { name: 'Wild', color: 'G' },
    negative: { name: 'Artifice', color: 'U' },
  },
  sanctity: {
    id: 'sanctity',
    positive: { name: 'Sanctity', color: 'W' },
    negative: { name: 'Dread', color: 'B' },
  },
};

/** A one-step push on one axis: +1 toward the positive pole, -1 toward the negative. */
export interface ScaleStep {
  axis: ScaleAxis;
  step: 1 | -1;
}
