// Wellspring claims (docs/01-core-rules.md section 13): a priest in an owned Wellspring province
// spends 10 uninterrupted days claiming it. Claims are public, like ownership.
import { isGarrisonHolder } from './commanders';
import type { NationId } from './ids';
import { postMessage } from './messages';
import { getMapProvince, getNation, getProvince } from './state';
import type { CommanderState, GameState } from './types';

/** Why this commander cannot claim the Wellspring where it stands, or null. */
export function claimBlocker(state: GameState, c: CommanderState): string | null {
  if (c.owner === null || isGarrisonHolder(c)) return `${c.name} cannot claim a Wellspring`;
  if (c.holy <= 0) return `${c.name} is not a priest`;
  if (c.transit) return `${c.name} is on the move`;
  const p = getProvince(state, c.location);
  if (getMapProvince(state, p.id).wellspring === undefined) return 'There is no Wellspring here';
  if (p.owner !== c.owner) return 'Claim a Wellspring in a province you own';
  if (p.wellspringClaimedBy === c.owner) return 'This Wellspring is already yours';
  return null;
}

/** Wellsprings a nation has claimed, in provinces it still owns. */
export function claimedBy(state: GameState, nation: NationId): number {
  return state.map.wellsprings.filter((id) => {
    const p = getProvince(state, id);
    return p.owner === nation && p.wellspringClaimedBy === nation;
  }).length;
}

/**
 * Tick step 3: each claim under way comes a day closer while the priest still may claim; at the
 * end the Wellspring is the nation's and every nation hears of it.
 */
export function progressClaims(state: GameState): void {
  for (const c of Object.values(state.commanders)) {
    const order = c.order;
    if (order.kind !== 'claimWellspring' || c.owner === null) continue;
    if (claimBlocker(state, c) !== null) {
      c.order = { kind: 'idle' };
      continue;
    }
    order.daysLeft -= 1;
    if (order.daysLeft > 0) continue;
    c.order = { kind: 'idle' };
    const p = getProvince(state, c.location);
    p.wellspringClaimedBy = c.owner;
    const text = `${getNation(state, c.owner).name} has claimed the Wellspring of ${getMapProvince(state, p.id).name}.`;
    for (const n of Object.values(state.nations)) {
      if (!n.eliminated) postMessage(state, n.id, 'wellspring', text, p.id);
    }
  }
}
