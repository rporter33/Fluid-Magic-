// Daily unrest change (docs/01-core-rules.md section 5).
import { TIME, UNREST } from '../content/rules';
import type { ProvinceId } from './ids';
import type { ProvinceEconomy } from './selectors';
import type { GameState } from './types';

export function updateUnrest(
  state: GameState,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy>,
): void {
  for (const p of Object.values(state.provinces)) {
    const delta = (economies.get(p.id)?.unrest ?? 0) / TIME.daysPerMonth;
    p.unrest = Math.max(0, Math.min(UNREST.max, p.unrest + delta));
  }
}
