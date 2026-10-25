// Dice used by contested rolls (docs/04-battle.md, "Dice").
import { randInt, type RngState } from './rng';

/** One open-ended d6: a 6 is rerolled and the new value added, repeatedly. Mean 4.2. */
export function openD6(rng: RngState): number {
  let total = 0;
  let roll: number;
  do {
    roll = randInt(rng, 1, 6);
    total += roll;
  } while (roll === 6);
  return total;
}

/** DRN: two open-ended d6 summed. Minimum 2, unbounded above, mean 8.4. */
export function drn(rng: RngState): number {
  return openD6(rng) + openD6(rng);
}
