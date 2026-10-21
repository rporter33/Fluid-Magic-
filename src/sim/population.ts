// Daily population growth (docs/01-core-rules.md section 3).
import { TIME } from '../content/rules';
import type { ProvinceId } from './ids';
import type { ProvinceEconomy } from './selectors';
import type { GameState } from './types';

export function growPopulation(
  state: GameState,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy>,
): void {
  for (const p of Object.values(state.provinces)) {
    const growth = economies.get(p.id)?.growth ?? 0;
    p.pop = Math.max(0, p.pop + growth / TIME.daysPerMonth);
  }
}
