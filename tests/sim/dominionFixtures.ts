// Spread checks, far provinces, and preaching priests shared by the dominion tests.
import { expect } from 'vitest';
import { dominionChecks } from '../../src/sim/dominion';
import type { NationId } from '../../src/sim/ids';
import type { CommanderState, GameState, ProvinceState } from '../../src/sim/types';

/** Every check a nation makes, counted per province it is made from. */
export function checksBy(state: GameState, nation: NationId): Record<string, number> {
  const out: Record<string, number> = {};
  for (const check of dominionChecks(state, nation)) {
    expect(check.nation).toBe(nation);
    out[check.from] = (out[check.from] ?? 0) + 1;
  }
  return out;
}

/** An independent province whose neighbors are no capital's neighbors. */
export function farProvince(state: GameState): ProvinceState {
  const found = Object.values(state.provinces).find(
    (p) => p.owner === null && state.map.provinces[p.id]!.capitalDistance >= 3,
  );
  if (!found) throw new Error('no far province');
  return found;
}

export function preach(c: CommanderState): CommanderState {
  c.order = { kind: 'preach' };
  return c;
}
