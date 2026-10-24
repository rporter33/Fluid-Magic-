// Lifting older saves to STATE_VERSION (docs/06-architecture.md, "Save and load"). Each entry of
// the migration map takes a parsed save from its version to the next; deserialize (serialize.ts)
// runs them on load, then checks the lifted state (validateSave.ts). Every refusal is a LoadError
// naming its reason, so the loader can tell the player instead of the game failing later.
import type { MapData } from '../mapgen/types';
import { rerunCurrent, validRerun } from './battle/rerun';
import { LoadError } from './loadError';
import { getMapProvince } from './state';
import { STATE_VERSION, type GameState } from './types';

/** The version of the first saved shape; every later one has a step here. */
const FIRST_VERSION = 1;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A record of records: provinces, nations. */
function isTable(value: unknown): boolean {
  return isRecord(value) && Object.values(value).every(isRecord);
}

/**
 * What the steps and the re-run check walk, which saves of every version hold: the map's
 * provinces, the provinces, the nations and the battle records. Null when it is all there.
 */
function unwalkable(save: unknown): string | null {
  if (!isRecord(save)) return 'it is not a record';
  if (!isRecord(save.map) || !isTable(save.map.provinces)) return 'its map has no provinces';
  if (!isTable(save.provinces)) return 'it has no provinces';
  if (!isTable(save.nations)) return 'it has no nations';
  if (!Array.isArray(save.battles) || !save.battles.every(isRecord)) {
    return 'it has no battle records';
  }
  return null;
}

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * Lifts a parsed save to STATE_VERSION in place and returns it. It refuses, with a LoadError, a
 * version it cannot read (missing, not a whole number, older than the first, or newer than
 * STATE_VERSION: "saved by a newer version", never guessed at), a save without what the steps
 * walk, and a step that fails. Loading is lenient about replays: a malformed re-run setup, or one
 * recorded under other battle rules, loads as null rather than failing the save; the battle then
 * replays from its log alone.
 */
export function migrateState(state: GameState): GameState {
  const version: unknown = state.version;
  const refuse = (v: unknown) =>
    new LoadError(
      'version',
      `This save cannot be loaded: no migration from save version ${String(v)}.`,
    );
  if (typeof version !== 'number' || !Number.isInteger(version) || version < FIRST_VERSION) {
    throw refuse(version);
  }
  if (version > STATE_VERSION) {
    throw new LoadError(
      'newer',
      `This save cannot be loaded: it was saved by a newer version of the game (save version ${version} is newer than this build, ${STATE_VERSION}).`,
    );
  }
  for (let v = version; v < STATE_VERSION; v++) if (!Object.hasOwn(MIGRATIONS, v)) throw refuse(v);
  const missing = unwalkable(state);
  if (missing !== null) throw new LoadError('shape', `This save is damaged: ${missing}.`);
  while (state.version < STATE_VERSION) {
    const from = state.version;
    try {
      MIGRATIONS[from]?.(state);
    } catch (e) {
      throw new LoadError(
        'migration',
        `This save cannot be loaded: lifting it from version ${from} to ${from + 1} failed (${message(e)}).`,
      );
    }
    state.version += 1;
  }
  for (const b of state.battles) {
    if (!validRerun(b.rerun) || !rerunCurrent(b.rerun)) b.rerun = null;
  }
  return state;
}
