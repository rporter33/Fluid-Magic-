// Lookups shared by command validators. Each returns null when the thing is missing or not
// the issuing nation's, so validators can reject instead of throwing.
import type { CommanderId, NationId, ProvinceId } from '../ids';
import type { CommanderState, GameState, ProvinceState } from '../types';

export function ownCommander(
  state: GameState,
  nation: NationId,
  id: CommanderId,
): CommanderState | null {
  const c = state.commanders[id];
  return c && c.owner === nation ? c : null;
}

export function ownProvince(
  state: GameState,
  nation: NationId,
  id: ProvinceId,
): ProvinceState | null {
  const p = state.provinces[id];
  return p && p.owner === nation ? p : null;
}

export function isIntegerIn(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function troopCount(commander: CommanderState): number {
  return commander.squads.reduce((sum, s) => sum + s.count, 0);
}
