// The Pillage order (docs/01-core-rules.md section 3), applied from the day's snapshot of
// rates (selectors.ts): the province loses its people, the taker gets the gold, unrest rises.
import { UNREST } from '../content/rules';
import type { ProvinceId } from './ids';
import type { ProvinceEconomy } from './selectors';
import { getNation, getProvince } from './state';
import type { GameState } from './types';

export function applyPillage(
  state: GameState,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy>,
): void {
  for (const [provinceId, e] of economies) {
    if (!e.pillage) continue;
    const p = getProvince(state, provinceId);
    p.pop = Math.max(0, p.pop - e.pillage.popPerDay);
    getNation(state, e.pillage.taker).gold += e.pillage.goldPerDay;
    p.unrest = Math.min(UNREST.max, p.unrest + e.pillage.unrestPerDay);
  }
}
