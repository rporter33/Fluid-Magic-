// Design point costs (docs/05-pretender.md, Steps 2 to 5). The first pip of a new color is
// priced per chassis (ChassisDef.newColorFirstPip, Phase 6b.1), and boons in boons.ts.
import { TIME } from '../rules';
import type { Awakening } from './types';

export const PRETENDER_COSTS = {
  budget: 400,
  /** Cost of reaching pip level 1 to 6 in a color. */
  pipLevel: [40, 20, 25, 30, 35, 40] as readonly number[],
  /** Each dominion point above the chassis's base. */
  dominionPoint: 30,
  /**
   * Each scale step toward a pole whose color is, or is not, in the nation's identity. A step
   * toward a pole the chassis is attuned to costs `own` too.
   */
  scaleStep: { own: 20, other: 40 },
} as const;

/** Awakening: points refunded, and the day the pretender arrives (Month 12 begins on day 330). */
export const AWAKENING: Readonly<Record<Awakening, { refund: number; arrivalDay: number }>> = {
  awake: { refund: 0, arrivalDay: 0 },
  dormant: { refund: 150, arrivalDay: 11 * TIME.daysPerMonth },
  imprisoned: { refund: 350, arrivalDay: 35 * TIME.daysPerMonth },
};
