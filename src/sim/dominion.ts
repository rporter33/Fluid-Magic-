// Dominion pushes (docs/01-core-rules.md section 12). One step is what a successful spread check
// does; rituals push several steps at once. Phase 6's monthly spread uses the same function.
import type { NationId, ProvinceId } from './ids';
import { dominionScore } from './selectors';
import { getProvince } from './state';
import type { GameState } from './types';

/**
 * Pushes a province's dominion `steps` times toward a nation. Each step: an empty or own
 * province gains 1, up to the nation's dominion score (never lowered by it); another nation's
 * dominion loses 1 and the province is left without dominion at 0, so later steps build the
 * pusher's.
 */
export function pushDominion(
  state: GameState,
  provinceId: ProvinceId,
  nation: NationId,
  steps: number,
): void {
  const dominion = getProvince(state, provinceId).dominion;
  const cap = dominionScore(state, nation);
  for (let i = 0; i < steps; i++) {
    if (dominion.nation === null || dominion.nation === nation || dominion.strength <= 0) {
      dominion.nation = nation;
      if (dominion.strength < cap) dominion.strength += 1;
      continue;
    }
    dominion.strength -= 1;
    if (dominion.strength <= 0) {
      dominion.nation = null;
      dominion.strength = 0;
    }
  }
}
