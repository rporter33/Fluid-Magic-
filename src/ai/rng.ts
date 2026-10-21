// An AI's own random streams (docs/08-ai.md decisions). An AI never draws from state.rng, so a
// game replays from its command log without the AI.
import type { NationId } from '../sim/ids';
import { createRng, type RngState } from '../sim/rng';
import type { GameState } from '../sim/types';

/** The nation's slot: its place in the game's nation order. */
function slotOf(state: GameState, nation: NationId): number {
  return Object.keys(state.nations).indexOf(nation);
}

/** murmur3's 32-bit finalizer: every input bit reaches every output bit. */
function fmix32(x: number): number {
  let h = x >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** A fresh stream for one planning call, from the game's seed, the day, and the nation's slot. */
export function aiRng(state: GameState, nation: NationId): RngState {
  const slot = slotOf(state, nation);
  const mixed =
    (Math.trunc(state.seed) ^
      Math.imul(state.day + 1, 0x9e3779b1) ^
      Math.imul(slot + 1, 0x85ebca6b)) >>>
    0;
  return createRng(mixed);
}

/**
 * A stream fixed by the game's seed, the nation's slot, and the keys alone, whatever the day or
 * the rest of the state holds: the same keys always give the same draws, so a choice drawn on it
 * (the pillage draw of one besieging leader at one fort, docs/08 decisions) is made once and
 * does not compound over planning calls.
 */
export function keyedRng(state: GameState, nation: NationId, ...keys: string[]): RngState {
  let h = fmix32(Math.trunc(state.seed) ^ Math.imul(slotOf(state, nation) + 1, 0x9e3779b1));
  for (const key of keys) {
    for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
    // Closing each key with its length keeps ('ab', 'c') apart from ('a', 'bc').
    h = fmix32(h ^ key.length);
  }
  return createRng(h);
}
