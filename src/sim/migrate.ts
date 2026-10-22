// Lifting older saves to STATE_VERSION (docs/06-architecture.md, "Save and load"). Each entry of
// the migration map takes a parsed save from its version to the next; serialize.ts (Phase 9)
// runs them on load. No save exists before Phase 9, so for now they run only on test fixtures.
import type { MapData } from '../mapgen/types';
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
  // 2 to 3 (Phase 6b.1): nations gained the god's name and a reform day, provinces the springs
  // added in play. Older games named no god, reformed none, and added no springs.
  2: (state) => {
    for (const n of Object.values(state.nations)) {
      n.pretenderName = null;
      n.pretenderReturnDay = null;
    }
    for (const p of Object.values(state.provinces)) p.extraSprings = [];
  },
  // 3 to 4 (Phase 1b): the map gained its impassable wild ranges. An older map has none; the
  // key goes last, where the generator puts it, so a lifted save hashes like a new one.
  3: (state) => {
    const map: Omit<MapData, 'wilds'> & Partial<Pick<MapData, 'wilds'>> = state.map;
    map.wilds ??= [];
  },
};

/**
 * Lifts a parsed save to STATE_VERSION in place and returns it. A version this build cannot
 * read (missing, not a whole number, older than the first, or newer than STATE_VERSION) throws,
 * so the loader can tell the player instead of the game failing later. Loading is lenient about
 * replays: a malformed re-run setup, or one recorded under other battle rules, loads as null
 * rather than failing the save; the battle then replays from its log alone.
 */
export function migrateState(state: GameState): GameState {
  const version: unknown = state.version;
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    throw new Error(`no migration from save version ${String(version)}`);
  }
  if (version > STATE_VERSION) {
    throw new Error(`save version ${version} is newer than this build (${STATE_VERSION})`);
  }
  while (state.version < STATE_VERSION) {
    const step = Object.hasOwn(MIGRATIONS, state.version) ? MIGRATIONS[state.version] : undefined;
    if (!step) throw new Error(`no migration from save version ${String(state.version)}`);
    step(state);
    state.version += 1;
  }
  for (const b of state.battles) {
    if (!validRerun(b.rerun) || !rerunCurrent(b.rerun)) b.rerun = null;
  }
  return state;
}
