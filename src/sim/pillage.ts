// The Pillage order (docs/01-core-rules.md section 3). Each day, every province where an army
// (a commander with troops, not in transit) holds the Pillage order loses 2% of its people;
// the pillaging nation gets 1 gold per 20 lost and the province 5 unrest. Several pillaging
// armies do not stack; with several nations, the first in nation order takes the gold.
import { PILLAGE, UNREST } from '../content/rules';
import type { NationId, ProvinceId } from './ids';
import { getNation, getProvince } from './state';
import type { GameState } from './types';

export function applyPillage(state: GameState): void {
  const pillagers = new Map<ProvinceId, Set<NationId>>();
  for (const c of Object.values(state.commanders)) {
    if (c.order.kind !== 'pillage' || c.transit || c.owner === null || c.squads.length === 0) {
      continue;
    }
    const set = pillagers.get(c.location) ?? new Set<NationId>();
    set.add(c.owner);
    pillagers.set(c.location, set);
  }
  const nationOrder = Object.keys(state.nations) as NationId[];
  for (const [provinceId, nations] of pillagers) {
    const taker = nationOrder.find((n) => nations.has(n));
    if (taker === undefined) continue;
    const p = getProvince(state, provinceId);
    const lost = p.pop * PILLAGE.popFraction;
    p.pop -= lost;
    getNation(state, taker).gold += lost / PILLAGE.popPerGold;
    p.unrest = Math.min(UNREST.max, p.unrest + PILLAGE.unrestPerDay);
  }
}
