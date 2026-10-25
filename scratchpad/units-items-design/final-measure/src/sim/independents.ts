// Independent defender forces (docs/01-core-rules.md section 9). Independents never move,
// recruit, or eat; each force is one Independent Captain and its troops.
import { INDEPENDENT_COMMANDER, INDEPENDENT_POOLS, STRENGTH_WORDS } from '../content/independents';
import type { StrengthWord } from '../content/independents';
import type { UnitTypeId } from '../content';
import { createCommander, createSquad } from './commanders';
import type { ProvinceId } from './ids';
import { getMapProvince } from './state';
import type { GameState } from './types';

/**
 * Splits `total` by weight with the largest-remainder method: shares sum exactly to total and
 * ties go to the earlier entry.
 */
export function splitByWeight(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (total * w) / sum);
  const shares = exact.map(Math.floor);
  let left = total - shares.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((x, i) => ({ i, r: x - Math.floor(x) }))
    .sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    shares[i] = (shares[i] ?? 0) + 1;
    left -= 1;
  }
  return shares;
}

/** The troops a province's independent force starts with. */
export function independentTroops(
  state: GameState,
  provinceId: ProvinceId,
): { unit: UnitTypeId; count: number }[] {
  const mp = getMapProvince(state, provinceId);
  const pool = INDEPENDENT_POOLS[mp.terrain];
  let total = mp.independentStrength;
  const troops: { unit: UnitTypeId; count: number }[] = [];
  const champion = pool.champion;
  if (champion && total > 0 && mp.capitalDistance >= champion.minCapitalDistance) {
    troops.push({ unit: champion.unit, count: 1 });
    total -= 1;
  }
  const shares = splitByWeight(
    total,
    pool.troops.map((t) => t.weight),
  );
  pool.troops.forEach((t, i) => {
    const count = shares[i] ?? 0;
    if (count > 0) troops.push({ unit: t.unit, count });
  });
  return troops;
}

/** Places every non-capital province's independent force (createGame). */
export function placeIndependents(state: GameState): void {
  for (const mp of Object.values(state.map.provinces)) {
    if (mp.capitalSlot !== undefined || mp.independentStrength <= 0) continue;
    const captain = createCommander(state, INDEPENDENT_COMMANDER, null, mp.id);
    for (const { unit, count } of independentTroops(state, mp.id)) {
      captain.squads.push(createSquad(state, unit, count));
    }
  }
}

/** Independent troops standing in a province now. */
export function independentCount(state: GameState, provinceId: ProvinceId): number {
  let count = 0;
  for (const c of Object.values(state.commanders)) {
    if (c.owner !== null || c.location !== provinceId) continue;
    for (const s of c.squads) count += s.count;
  }
  return count;
}

export function strengthWord(count: number): StrengthWord {
  const entry = STRENGTH_WORDS.find((w) => count < w.below);
  return entry ? entry.word : 'fortress';
}
