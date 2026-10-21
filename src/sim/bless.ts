// The bless of a nation's sacred units (docs/02-magic.md section 8). It follows from the
// pretender's pips in its design, which never change, so it is computed when needed rather
// than stored.
import { COLORS } from '../content/colors';
import { BLESS } from '../content/rules';
import type { Pips } from './types';

export interface Bless {
  att: number;
  str: number;
  def: number;
  prot: number;
  mor: number;
  prec: number;
  /** Share of max HP regained per round. */
  regeneration: number;
  /** HP regained per damaging hit. */
  lifeDrain: number;
}

export const NO_BLESS: Readonly<Bless> = {
  att: 0,
  str: 0,
  def: 0,
  prot: 0,
  mor: 0,
  prec: 0,
  regeneration: 0,
  lifeDrain: 0,
};

/** Every color with at least BLESS.minPips gives its bless, doubled at BLESS.doubleAt. */
export function blessOf(pips: Pips): Bless {
  const bless = { ...NO_BLESS };
  for (const color of COLORS) {
    const n = pips[color] ?? 0;
    if (n < BLESS.minPips) continue;
    const factor = n >= BLESS.doubleAt ? 2 : 1;
    for (const [key, value] of Object.entries(BLESS[color])) {
      bless[key as keyof Bless] += value * factor;
    }
  }
  return bless;
}
