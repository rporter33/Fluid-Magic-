// Checked lookups into GameState. Records are keyed by branded ids, so a missing entry is a
// bug; these throw instead of returning undefined.
import type { CommanderId, NationId, ProvinceId } from './ids';
import type { CommanderState, GameState, NationState, ProvinceState } from './types';
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
