// Saves (docs/06-architecture.md, "Save and load"): a save is the state's JSON text. Loading
// parses it, lifts it to STATE_VERSION (migrate.ts, which refuses a newer or unknown version and
// loads a malformed re-run as null), then checks it (validateSave.ts) before anything uses it. A
// save that fails throws a LoadError with the reason to show; the caller's game is never touched,
// as everything is built from the text. Gzip, IndexedDB and the autosave keys are the UI's.
import { LoadError } from './loadError';
import { migrateState } from './migrate';
import type { GameState } from './types';
import { saveProblems } from './validateSave';

/** Problems a failed load's message names; the rest are counted, and all are in `problems`. */
const NAMED = 3;

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

/** The game in a save, lifted and checked; throws LoadError when it cannot be loaded. */
export function deserialize(json: string): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    parsed = undefined;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new LoadError('unreadable', 'This save cannot be read: it holds no saved game.');
  }
  const state = migrateState(parsed as GameState);
  const problems = saveProblems(state);
  const first = problems[0];
  if (first !== undefined) {
    const named = problems.slice(0, NAMED).map((p) => p.text);
    const more = problems.length > NAMED ? ` (and ${String(problems.length - NAMED)} more)` : '';
    throw new LoadError(
      first.kind,
      `This save is damaged: ${named.join('; ')}${more}.`,
      problems.map((p) => p.text),
    );
  }
  return state;
}
