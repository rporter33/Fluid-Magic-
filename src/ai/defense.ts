// The army pass's defensive steps (docs/08-ai.md priorities 5 "Defense" and 9 "escort"; Phase 7
// design "5. Army pass" a, c, d): relief of own besieged forts, with groups gathering next to
// the fort when none is strong enough alone; an escort for each Wellspring a priest walks to or
// claims; and Defense of threatened provinces, the capital first, by the nearest group that
// covers the threat, else one more PD level.
import { AI } from '../content/ai';
import { PD } from '../content/rules';
import type { ProvinceId } from '../sim/ids';
import { commanderMapSpeed, pathDays } from '../sim/movement';
import { pdCost } from '../sim/pd';
import { getMapProvince } from '../sim/state';
import type { CommanderState, ProvinceState } from '../sim/types';
import { armyPower, destinationOf, escortedSprings, groups, threat, type Group } from './assess';
import {
  byProvince,
  daysTo,
  eligibleGroups,
  fixedDefense,
  hold,
  isAssigned,
  isMoving,
  membersOf,
  nearest,
  power,
  send,
  sendAlong,
  strongestFirst,
  type ArmyPass,
} from './army';
import type { Plan } from './plan';

/** The own forts under another nation's siege: the capital first, then by province index. */
function besiegedForts(plan: Plan): ProvinceState[] {
  const isCapital = (p: ProvinceState) => Number(p.id === plan.capital.id);
  return plan
    .owned()
    .filter((p) => p.siege !== null && p.siege.attacker !== plan.nation)
    .sort((a, b) => isCapital(b) - isCapital(a));
}

/** A fort's own neighbors that no other nation's commanders stand in: the ways out and in. */
function exitsOf(pass: ArmyPass, fort: ProvinceId): ProvinceId[] {
  return getMapProvince(pass.plan.copy, fort).neighbors.filter((n) => !pass.hostile.has(n));
}

/** How commanders would reach the fort, and the days it takes: from inside, out and back in. */
interface RouteIn {
  readonly days: number;
  readonly go: () => boolean;
}

function routeIn(
  pass: ArmyPass,
  members: readonly CommanderState[],
  fort: ProvinceId,
): RouteIn | null {
  const lead = members[0];
  if (!lead) return null;
  if (!lead.transit && lead.location === fort) {
    const [exit] = exitsOf(pass, fort);
    if (exit === undefined) return null;
    const path = [exit, fort];
    const pace = Math.min(...members.map(commanderMapSpeed));
    return {
      days: pathDays(pass.plan.copy, path, pace),
      go: () => sendAlong(pass, members, path),
    };
  }
  const days = daysTo(pass.plan, members, fort);
  return days === undefined ? null : { days, go: () => send(pass, members, fort) };
}

/**
 * The gather point: the fort's exit nearest by path days to the strongest group outside it,
 * ties by province index; the first exit when that group reaches none or there is none; null
 * with no exit.
 */
function gatherPoint(pass: ArmyPass, fort: ProvinceId, outside: readonly Group[]) {
  const exits = exitsOf(pass, fort);
  const [strongest] = strongestFirst(outside);
  let best: ProvinceId | null = null;
  let bestDays = Infinity;
  for (const exit of strongest ? exits : []) {
    const days = daysTo(pass.plan, strongest?.members ?? [], exit);
    if (days !== undefined && days < bestDays) {
      best = exit;
      bestDays = days;
    }
  }
  return best ?? exits[0] ?? null;
}

/**
 * Relief of one besieged fort, whatever the besiegers' strength: the nearest group of any size
 * strong enough alone (AI.reliefRatio times the besiegers) goes in; else groups standing
 * together that are strong enough go in as one; else the groups outside walk to the gather
 * point, from where they go in together once they are strong enough, and those inside hold it.
 */
function relieve(pass: ArmyPass, fort: ProvinceState): void {
  const { plan } = pass;
  const siege = fort.siege;
  if (!siege) return;
  const need =
    AI.reliefRatio * armyPower(plan.at(fort.id).filter((c) => c.owner === siege.attacker));
  const candidates = eligibleGroups(pass, { anySize: true, moving: true, escorts: true });
  const inside = candidates.filter((g) => !isMoving(g.leader) && g.province === fort.id);
  const outside = candidates.filter((g) => !inside.includes(g));
  const gather = gatherPoint(pass, fort.id, outside);
  if (fort.id === plan.capital.id) pass.gather = gather;

  // Alone, or else standing together: the nearest that is strong enough goes in.
  let routes = candidates
    .filter((g) => power(g) >= need)
    .map((g) => routeIn(pass, g.members, fort.id));
  if (!routes.some((r) => r !== null)) {
    routes = [...byProvince(candidates).values()]
      .filter((here) => here.length > 1 && armyPower(membersOf(here)) >= need)
      .map((here) => routeIn(pass, membersOf(here), fort.id));
  }
  const best = routes.reduce<RouteIn | null>(
    (a, b) => (b !== null && (a === null || b.days < a.days) ? b : a),
    null,
  );
  if (best) {
    best.go();
    return;
  }
  for (const g of inside) hold(plan, g.members);
  if (gather === null) return;
  for (const g of outside) send(pass, g.members, gather);
}

/** Step a: relieves every own fort under siege, the capital first. */
export function relieveForts(pass: ArmyPass): void {
  for (const fort of besiegedForts(pass.plan)) relieve(pass, fort);
}

/**
 * Step c: one army for each owned unclaimed Wellspring an own priest walks to or claims. A
 * group standing or marching there is the escort; else the nearest free army is sent. With no
 * free army the priest goes alone.
 */
export function escortClaims(pass: ArmyPass): void {
  const { plan } = pass;
  const escorted = escortedSprings(plan);
  const springs = (Object.keys(plan.copy.map.provinces) as ProvinceId[]).filter((id) =>
    escorted.has(id),
  );
  for (const spring of springs) {
    const there = groups(plan).find(
      (g) => !g.lone && !isAssigned(plan, g) && destinationOf(g.leader) === spring,
    );
    if (there) {
      for (const m of there.members) pass.escorts.add(m.id);
      continue;
    }
    const free = eligibleGroups(pass).filter((g) => !isMoving(g.leader));
    const g = nearest(plan, free, spring);
    if (g) send(pass, g.members, spring);
  }
}

/** Defense's order: the capital, then owned Wellsprings, then the other owned provinces. */
function defenseOrder(plan: Plan): ProvinceState[] {
  const rank = (p: ProvinceState): number => {
    if (p.id === plan.capital.id) return 0;
    return getMapProvince(plan.copy, p.id).wellspring !== undefined ? 1 : 2;
  };
  return [...plan.owned()].sort((a, b) => rank(a) - rank(b));
}

/**
 * One more PD level where gold above the recruitment reserve pays for it (no PD while
 * besieged, nor past the cap).
 */
function buyPd(plan: Plan, p: ProvinceState): void {
  if (p.pd >= PD.maxLevel) return;
  if (plan.nationState.gold - pdCost(p.pd, 1) < AI.goldReserve) return;
  plan.issue({ type: 'buyPd', nation: plan.nation, province: p.id, levels: 1 });
}

/**
 * Defends one province. Its local defense is its PD and garrison troops, the own commanders
 * standing there, and those sent there earlier this call. While the threat around it is no
 * greater, the groups standing there stay, the strongest first, as far as it needs them.
 * Otherwise the nearest group by path days whose power covers the rest is sent and the groups
 * there stay with it; with none, one PD level is bought and the groups there are free to go.
 */
function defendProvince(pass: ArmyPass, p: ProvinceState): void {
  const { plan } = pass;
  const danger = threat(plan.copy, plan.nation, p.id);
  if (danger <= 0) return;
  const standing = plan.at(p.id).filter((c) => c.owner === plan.nation && c.transit === null);
  const coming = plan
    .own()
    .filter((c) => plan.assigned.has(c.id) && isMoving(c) && destinationOf(c) === p.id);
  const local =
    fixedDefense(plan.copy, p.id) +
    armyPower(standing.filter((c) => c.id !== p.garrison)) +
    armyPower(coming);
  const here = strongestFirst(
    groups(plan).filter(
      (g) => !g.lone && !isAssigned(plan, g) && !isMoving(g.leader) && g.province === p.id,
    ),
  );
  if (danger <= local) {
    let spare = here.reduce((sum, g) => sum + power(g), 0);
    for (const g of here) {
      if (local - spare >= danger) break;
      spare -= power(g);
      hold(plan, g.members);
    }
    return;
  }
  const candidates = eligibleGroups(pass, { moving: true, escorts: true }).filter(
    (g) => isMoving(g.leader) || g.province !== p.id,
  );
  const helper = nearest(plan, candidates, p.id, (g) => power(g) + local > danger);
  if (helper && send(pass, helper.members, p.id)) {
    for (const g of here) hold(plan, g.members);
    return;
  }
  buyPd(plan, p);
}

/** Step d: defends the capital, then owned Wellsprings, then the other provinces by index. */
export function defendProvinces(pass: ArmyPass): void {
  for (const p of defenseOrder(pass.plan)) {
    if (p.siege === null) defendProvince(pass, p);
  }
}
