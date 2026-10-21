// Lifting older saves to STATE_VERSION (docs/06-architecture.md, "Save and load"). Each entry of
// the migration map takes a parsed save from its version to the next; serialize.ts (Phase 9)
// runs them on load. No save exists before Phase 9, so for now they run only on test fixtures.
import { rerunCurrent, validRerun } from './battle/rerun';
import { getMapProvince } from './state';
import { STATE_VERSION, type GameState } from './types';

/** A save parsed from JSON, typed as the current state but possibly of an older version. */
type Migration = (state: GameState) => void;

export const MIGRATIONS: Readonly<Record<number, Migration>> = {
  // 1 to 2 (Phase 10 S1): battle records gained their scene and a re-run setup, which older
  // records never had.
  1: (state) => {
    for (const b of state.battles) {
      b.scene = { terrain: getMapProvince(state, b.province).terrain, storm: null };
      b.rerun = null;
    }
  },
};

/**
 * Lifts a parsed save to STATE_VERSION in place and returns it. Loading is lenient about
 * replays: a malformed re-run setup, or one recorded under other battle rules, loads as null
 * rather than failing the save; the battle then replays from its log alone.
 */
export function migrateState(state: GameState): GameState {
  while (state.version < STATE_VERSION) {
    const step = MIGRATIONS[state.version];
    if (!step) throw new Error(`no migration from save version ${String(state.version)}`);
    step(state);
    state.version += 1;
  }
  for (const b of state.battles) {
    if (!validRerun(b.rerun) || !rerunCurrent(b.rerun)) b.rerun = null;
  }
  return state;
}
