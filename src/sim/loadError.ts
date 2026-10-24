// Why a save could not be loaded (docs/06-architecture.md, "Save and load"): the UI shows the
// message in place of the game, which stays as it was.

export const LOAD_FAILURES = [
  /** Not JSON, or not a saved game. */
  'unreadable',
  /** Saved by a newer version of the game: never guessed at. */
  'newer',
  /** A version this build has no migration from. */
  'version',
  /** An older save whose migration failed. */
  'migration',
  /** A required key missing, or no record or list where one belongs. */
  'shape',
  /** An id naming nothing in the save, or nothing in this build's content. */
  'reference',
  /** A color key or value outside W U B R G. */
  'color',
] as const;
export type LoadFailure = (typeof LOAD_FAILURES)[number];

export class LoadError extends Error {
  override readonly name = 'LoadError';
  readonly kind: LoadFailure;
  /** Every problem found, for a details view; the message names the first few. */
  readonly problems: readonly string[];

  constructor(kind: LoadFailure, message: string, problems: readonly string[] = []) {
    super(message);
    this.kind = kind;
    this.problems = problems;
  }
}
