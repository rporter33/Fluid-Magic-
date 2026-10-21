// Checked lookups into GameState. Records are keyed by branded ids, so a missing entry is a
// bug; these throw instead of returning undefined.
import type { CommanderId, NationId, ProvinceId } from './ids';
import type {
  CommanderState,
  GameState,
  NationState,
  ProvinceEffect,
  ProvinceState,
} from './types';
import type { MapProvince } from '../mapgen/types';

export function getProvince(state: GameState, id: ProvinceId): ProvinceState {
  const p = state.provinces[id];
  if (!p) throw new Error(`no province ${id}`);
  return p;
}

export function getMapProvince(state: GameState, id: ProvinceId): MapProvince {
  const p = state.map.provinces[id];
  if (!p) throw new Error(`no map province ${id}`);
  return p;
}

export function getNation(state: GameState, id: NationId): NationState {
  const n = state.nations[id];
  if (!n) throw new Error(`no nation ${id}`);
  return n;
}

export function getCommander(state: GameState, id: CommanderId): CommanderState {
  const c = state.commanders[id];
  if (!c) throw new Error(`no commander ${id}`);
  return c;
}

/** Province effects in force today: a stored effect may have ended but not yet been dropped. */
export function activeEffects(state: GameState, provinceId: ProvinceId): ProvinceEffect[] {
  return state.provinceEffects.filter((e) => e.province === provinceId && e.untilDay > state.day);
}

/**
 * Rounds up to a whole number, ignoring floating-point noise: 50 * 1.1 is
 * 55.00000000000001 in binary floating point and must come out as 55, not 56.
 */
export function roundUp(x: number): number {
  return Math.ceil(x - 1e-9);
}

/** A day count rounded up to whole days. */
export const wholeDays = roundUp;
