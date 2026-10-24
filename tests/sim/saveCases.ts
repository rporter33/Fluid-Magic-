// One break at a time in a copy of a save holding every kind of record, for the save check's
// tests (validateSave.keys.test.ts and validateSave.refs.test.ts), with the ids it names.
import type { CommanderId, NationId, ProvinceId } from '../../src/sim/ids';
import type { GameState } from '../../src/sim/types';
import { saveProblems, type SaveProblem } from '../../src/sim/validateSave';
import { richSave, type RichIds } from './saveFixtures';

export type Rec = Record<string, unknown>;
export const rec = (value: object): Rec => value as Rec;

const BASE = richSave();
export const I: RichIds = BASE.ids;

/** A copy of the rich save; it holds only JSON values, so it is what a save brings back. */
export function fresh(): GameState {
  return structuredClone(BASE.save);
}

/** The problems with `change` made to a fresh save. */
export function problemsWith(change: (s: GameState) => void): SaveProblem[] {
  const save = fresh();
  change(save);
  return saveProblems(save);
}

export const order = (s: GameState, id: CommanderId) => rec(s.commanders[id]!.order);
export const queue = (s: GameState) => s.provinces[I.capital]!.recruitQueue;
/** The recruit order richSave queued, the capital's last. */
export const last = queue(BASE.save).length - 1;
export const well = BASE.save.map.wellsprings[0]!;
export const P = 'p999' as ProvinceId;
export const N = 'n9' as NationId;
export const C = 'c99999' as CommanderId;
