// Province capture (docs/01-core-rules.md sections 9, 11, 13).
import { DEFAULT_TAX_RATE } from '../content/rules';
import type { NationId, ProvinceId } from './ids';
import { postMessage } from './messages';
import { replaceGarrison } from './recruitment';
import { getMapProvince, getNation, getProvince } from './state';
import type { GameState } from './types';

/**
 * A nation takes a province: the tax rate returns to the default, PD falls to 0, a siege ends, a claimed Wellspring is unclaimed,
 * and a fort gets a garrison holder for its new owner (the old one goes with any troops it
 * still kept). The old owner's queue and construction lapse by their own rules. Dominion
 * stays as it is.
 */
export function captureProvince(state: GameState, provinceId: ProvinceId, nation: NationId): void {
  const p = getProvince(state, provinceId);
  const previous = p.owner;
  p.owner = nation;
  p.taxRate = DEFAULT_TAX_RATE;
  p.pd = 0;
  p.siege = null;
  p.wellspringClaimedBy = null;
  if (p.buildings.includes('fort')) replaceGarrison(state, provinceId);
  const taker = getNation(state, nation);
  taker.stats.provincesTaken += 1;
  const name = getMapProvince(state, provinceId).name;
  postMessage(state, nation, 'captured', `${name} taken.`, provinceId);
  if (previous !== null) {
    postMessage(state, previous, 'lost', `${name} lost to ${taker.name}.`, provinceId);
  }
}
