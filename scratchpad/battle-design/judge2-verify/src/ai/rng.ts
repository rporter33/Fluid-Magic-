// An AI's own random stream (docs/08-ai.md decisions). An AI never draws from state.rng, so a
// game replays from its command log without the AI.
import type { NationId } from '../sim/ids';
import { createRng, type RngState } from '../sim/rng';
import type { GameState } from '../sim/types';

/** A fresh stream for one planning call, from the game's seed, the day, and the nation's slot. */
export function aiRng(state: GameState, nation: NationId): RngState {
  const slot = Object.keys(state.nations).indexOf(nation);
  const mixed =
    (Math.trunc(state.seed) ^
      Math.imul(state.day + 1, 0x9e3779b1) ^
      Math.imul(slot + 1, 0x85ebca6b)) >>>
    0;
  return createRng(mixed);
}
