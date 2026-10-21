// The AI's army pass (docs/08-ai.md priorities 4 to 7; Phase 7 design "5. Army pass"): relief,
// sieges and pillage, escorts, defense, war, expansion, and the march home, in that priority
// order, each group assigned at most once per call. Groups move as one: a leader with the
// fighter pretender, summoned commanders, and at most AI.battleMagesPerArmy battle mage riding
// with it (assess.ts groups). Expansion and the march home live here; the other steps in
// defense.ts and war.ts.
import { AI } from '../content/ai';
import type { ProvinceId } from '../sim/ids';
import type { CommanderState } from '../sim/types';
import { armyPower, defenderPower, destinationOf, groups } from './assess';
import {
  byProvince,
  createArmyPass,
  distanceFactor,
  eligibleGroups,
  isAssigned,
  isMoving,
  membersOf,
  provinceValue,
  send,
  type ArmyPass,
} from './army';
import { defendProvinces, escortClaims, relieveForts } from './defense';
import type { Plan } from './plan';
import { holdSieges, makeWar } from './war';

/**
 * The independent province commanders standing together would attack, if any: of every one
 * their paths reach, the best by (pop / AI.score.popPer + springs * AI.score.spring +
 * wellspring * AI.score.wellspring) / max(defenders, 1), discounted by path days (distanceFactor),
 * among those whose defenders they outmatch AI.expansionRatio times over and no own move already
 * ends at.
 */
export function expansionTarget(
  plan: Plan,
  members: readonly CommanderState[],
  taken: ReadonlySet<ProvinceId>,
): ProvinceId | null {
  const strength = armyPower(members);
  const paths = plan.paths(members);
  let best: ProvinceId | null = null;
  let bestScore = -Infinity;
  for (const p of paths.reached) {
    if (plan.copy.provinces[p]?.owner !== null || taken.has(p)) continue;
    const defenders = defenderPower(plan.copy, p);
    if (strength <= AI.expansionRatio * defenders) continue;
    const score =
      (provinceValue(plan.copy, p) / Math.max(defenders, 1)) *
      distanceFactor(plan, paths.days(p) ?? 0);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Step f: each free field army attacks its best independent target alone; armies standing
 * together that none takes alone try once more as one group. Two moves never end in the same
 * province.
 */
function expand(pass: ArmyPass): void {
  const { plan } = pass;
  const taken = new Set<ProvinceId>(plan.own().filter(isMoving).map(destinationOf));
  const go = (members: readonly CommanderState[]): void => {
    const to = expansionTarget(plan, members, taken);
    if (to !== null && send(pass, members, to)) taken.add(to);
  };
  for (const here of byProvince(eligibleGroups(pass)).values()) {
    for (const g of here) go(g.members);
    const left = here.filter((g) => !isAssigned(plan, g));
    if (left.length > 1) go(membersOf(left));
  }
}

/**
 * Step g: every group standing outside the capital that no step took walks home to refill,
 * whatever it leads, and so do riders left there without a leader; to the gather point while
 * the capital is besieged.
 */
function returnHome(pass: ArmyPass): void {
  const { plan } = pass;
  const capital = plan.capital;
  const besieged = capital.siege !== null && capital.siege.attacker !== plan.nation;
  const home = besieged ? pass.gather : capital.owner === plan.nation ? capital.id : null;
  if (home === null) return;
  const lone = groups(plan).filter((g) => g.lone && !isAssigned(plan, g));
  for (const g of [...eligibleGroups(pass, { anySize: true }), ...lone]) {
    if (g.province !== capital.id && g.province !== home) send(pass, g.members, home);
  }
}

/** Step 5: gives every group at most one task, in the army pass's priority order. */
export function planArmies(plan: Plan): void {
  const pass = createArmyPass(plan);
  relieveForts(pass);
  holdSieges(pass);
  escortClaims(pass);
  defendProvinces(pass);
  makeWar(pass);
  expand(pass);
  returnHome(pass);
}
