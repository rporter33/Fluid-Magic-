// The pre-game pretender design (docs/05-pretender.md). Content holds the shape so presets
// can be data; the sim validates and prices it (src/sim/pretender.ts).
import type { Color } from '../colors';
import type { BoonChoice } from './boons';
import type { Scales } from './scales';

export const AWAKENINGS = ['awake', 'dormant', 'imprisoned'] as const;
export type Awakening = (typeof AWAKENINGS)[number];

export interface PretenderDesign {
  /** A chassis id (content/pretenders/chassis.ts). */
  chassis: string;
  /** The whole pip set, the chassis's base pips included ("Titan R4" means R = 4). */
  pips: Partial<Record<Color, number>>;
  /** Dominion score, the chassis's base to 10, before Wellspring bonuses. */
  dominion: number;
  scales: Scales;
  awakening: Awakening;
  /**
   * Chosen blessing ids (content/pretenders/blessings.ts). Absent: the default picks, each
   * color's standard blessing at 4 or 5 pips and its greater one at 6 (the fixed bless of
   * Phase 5). An empty list chooses none.
   */
  blessings?: readonly string[];
  /** Boons bought with design points (content/pretenders/boons.ts); absent: none. */
  boons?: readonly BoonChoice[];
}
