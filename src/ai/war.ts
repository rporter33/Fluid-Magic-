// The army pass's offensive steps against other nations (docs/08-ai.md priorities 6 "War" and
// 7 "Pillage"; Phase 7 design "5. Army pass" b, e): the sieges this nation lays, stormed when
// the odds allow and otherwise held, with each besieging leader's keyed pillage draw; and War,
// whose targets come in order: sieges to reinforce, an enemy's Wellsprings when it nears a
// Wellspring win (past the aggression gate), the enemy provinces own armies march on, and a new
// target only when the nation-wide odds pass.
import { AI, DIFFICULTIES } from '../content/ai';
import { TIME } from '../content/rules';
import { wellspringsToWin } from '../mapgen/placement';
import { takesPart } from '../sim/commanders';
import type { NationId, ProvinceId } from '../sim/ids';
import { withinHops } from '../sim/rituals';
import { chance } from '../sim/rng';
import { wallsDown } from '../sim/siege';
import { getMapProvince, getProvince, nationDefOf } from '../sim/state';
import type { CommanderState, ProvinceState } from '../sim/types';
import {
  armyPower,
  commanderPower,
  defenderPower,
  destinationOf,
  groups,
  isEnemyProvince,
} from './assess';
import {
  adjacencyRoute,
  byProvince,
  distanceFactor,
  eligibleGroups,
  fixedDefense,
  hopsFrom,
  hold,
  isAssigned,
  isMoving,
  membersOf,
  provinceValue,
  send,
  type ArmyPass,
} from './army';
import type { Plan } from './plan';
import { keyedRng } from './rng';

/** The provinces whose siege this nation lays, by province index. */
function ownSieges(plan: Plan): ProvinceState[] {
  return Object.values(plan.copy.provinces).filter((p) => p.siege?.attacker === plan.nation);
}

/**
 * Each besieging leader's pillage, drawn once per (leader, province) pair from a keyed stream,
 * with the nation's pillage personality as the chance: the same pair always draws the same, so
 * the chance does not compound over calls. Orders change only when the draw differs from them.
 */
function drawPillage(plan: Plan, province: ProvinceId, own: readonly CommanderState[]): void {
  const odds = nationDefOf(plan.copy, plan.nation).ai.pillage;
  for (const c of own) {
    if (plan.role(c) !== 'leader' || c.transit !== null) continue;
    if (c.order.kind !== 'idle' && c.order.kind !== 'pillage') continue;
    const want = chance(keyedRng(plan.copy, plan.nation, c.id, province), odds)
      ? 'pillage'
      : 'idle';
    if (c.order.kind !== want) {
      plan.issue({ type: 'setOrder', nation: plan.nation, commander: c.id, order: want });
    }
  }
}

/**
 * Step b: every siege this nation lays is stormed when the fort has no defenders left, or when
 * its walls are down and every own commander there together has AI.stormRatio times the
 * defenders' power; otherwise it is held. Either way the besiegers are held from other steps.
 */
export function holdSieges(pass: ArmyPass): void {
  const { plan } = pass;
  for (const p of ownSieges(plan)) {
    const siege = p.siege;
    if (!siege) continue;
    const own = plan.at(p.id).filter((c) => c.owner === plan.nation);
    const defenders = defenderPower(plan.copy, p.id);
    const storm =
      defenders <= 0 || (wallsDown(siege.wallHp) && armyPower(own) >= AI.stormRatio * defenders);
    if (storm && !siege.storm) plan.issue({ type: 'storm', nation: plan.nation, province: p.id });
    hold(plan, own);
    drawPillage(plan, p.id, own);
  }
}

/** War's targets this call, each list in its order. */
interface Targets {
  /** Sieges this nation lays, to reinforce. */
  readonly sieges: readonly ProvinceState[];
  /** An enemy's owned Wellsprings once it owns enough of them to win. */
  readonly denial: readonly ProvinceId[];
  /**
   * The first hostile province on the shortest adjacency route from the nation's land (its
   * provinces no other nation's commanders stand in) to the first denial target: where armies
   * that reach no Wellspring attack. One step for every army, so a march keeps its aim.
   */
  readonly denialStep: ProvinceId | null;
  /** Map hops from each province to the nearest denial target. */
  readonly denialHops: ReadonlyMap<ProvinceId, number>;
  /** Enemy provinces an own group marches on. */
  readonly marches: readonly ProvinceId[];
  /** The nation-wide odds allow a new target. */
  readonly open: boolean;
}

/**
 * Wellspring denial: every enemy nation owning (claimed or not) at least wellspringsToWin
 * Wellsprings has them all as targets, a claim under way first, then unclaimed, then claimed,
 * then by province index.
 */
function denialTargets(plan: Plan): ProvinceId[] {
  const { copy } = plan;
  const need = wellspringsToWin(copy.map.wellsprings.length);
  const springs = Object.values(copy.provinces).filter(
    (p) =>
      getMapProvince(copy, p.id).wellspring !== undefined &&
      isEnemyProvince(copy, plan.nation, p.id),
  );
  const owners = new Map<NationId, number>();
  for (const p of springs) if (p.owner) owners.set(p.owner, (owners.get(p.owner) ?? 0) + 1);
  const rank = (p: ProvinceState): number => {
    const claiming = plan
      .at(p.id)
      .some((c) => c.owner === p.owner && c.order.kind === 'claimWellspring');
    if (claiming) return 0;
    return p.wellspringClaimedBy === p.owner ? 2 : 1;
  };
  return springs
    .filter((p) => p.owner !== null && (owners.get(p.owner) ?? 0) >= need)
    .sort((a, b) => rank(a) - rank(b))
    .map((p) => p.id);
}

/**
 * The enemy power near the nation: other nations' commanders within AI.warHops of an own
 * province, and the garrisons and PD of enemy provinces on its border.
 */
function enemyPowerNearby(plan: Plan): number {
  const { copy } = plan;
  const near = new Set<ProvinceId>();
  const border = new Set<ProvinceId>();
  for (const p of plan.owned()) {
    for (const q of withinHops(copy, p.id, AI.warHops)) near.add(q);
    for (const n of getMapProvince(copy, p.id).neighbors) {
      if (isEnemyProvince(copy, plan.nation, n)) border.add(n);
    }
  }
  let total = 0;
  for (const c of Object.values(copy.commanders)) {
    if (c.owner === null || c.owner === plan.nation || !takesPart(c)) continue;
    if (near.has(c.location)) total += commanderPower(c);
  }
  for (const p of border) total += fixedDefense(copy, p);
  return total;
}

function warTargets(pass: ArmyPass): Targets {
  const { plan } = pass;
  const marches = new Set<ProvinceId>();
  for (const g of groups(plan)) {
    const to = destinationOf(g.leader);
    if (!g.lone && isMoving(g.leader) && isEnemyProvince(plan.copy, plan.nation, to)) {
      marches.add(to);
    }
  }
  const fieldPower = groups(plan)
    .filter((g) => !g.lone)
    .reduce((sum, g) => sum + armyPower(g.members), 0);
  const aggression = nationDefOf(plan.copy, plan.nation).ai.aggression;
  const denial = denialTargets(plan);
  const land = plan
    .owned()
    .map((p) => p.id)
    .filter((p) => !pass.hostile.has(p));
  const [first] = denial;
  return {
    sieges: ownSieges(plan),
    denial,
    denialStep: first === undefined ? null : (adjacencyRoute(plan.copy, land, first)[0] ?? null),
    denialHops: hopsFrom(plan.copy, denial),
    marches: (Object.keys(plan.copy.map.provinces) as ProvinceId[]).filter((p) => marches.has(p)),
    open: aggression * fieldPower > AI.warRatio * enemyPowerNearby(plan),
  };
}

/** Strong enough for an enemy province: AI.warRatio times its defenders. */
function canTake(plan: Plan, strength: number, province: ProvinceId): boolean {
  return strength >= AI.warRatio * defenderPower(plan.copy, province);
}

/** An enemy nation's capital. */
function isEnemyCapital(plan: Plan, province: ProvinceId): boolean {
  const owner = getProvince(plan.copy, province).owner;
  return owner !== null && owner !== plan.nation && plan.copy.nations[owner]?.capital === province;
}

/**
 * An enemy Wellspring the commanders can take, in denial order; when they reach none at all,
 * the denial step (the first hostile province on the shortest adjacency route from the
 * nation's land to the first one), if they can take it. Commanders already marching on a
 * hostile province nearer the denial targets than their leg's end keep their aim.
 */
function denialTarget(
  pass: ArmyPass,
  members: readonly CommanderState[],
  targets: Targets,
): ProvinceId | null {
  const { plan } = pass;
  const strength = armyPower(members);
  const lead = members[0];
  if (lead && isMoving(lead)) {
    const to = destinationOf(lead);
    const toHops = targets.denialHops.get(to);
    const endHops = targets.denialHops.get(lead.transit ? lead.transit.to : lead.location);
    const nearer = toHops !== undefined && endHops !== undefined && toHops < endHops;
    if (nearer && pass.hostile.has(to) && canTake(plan, strength, to)) return to;
  }
  const paths = plan.paths(members);
  const reachable = targets.denial.filter((p) => paths.pathTo(p) !== null);
  const found = reachable.find((p) => canTake(plan, strength, p));
  if (found !== undefined) return found;
  const step = targets.denialStep;
  if (reachable.length > 0 || step === null || paths.pathTo(step) === null) return null;
  return canTake(plan, strength, step) ? step : null;
}

/**
 * With the odds open, the best enemy province the commanders can reach and take: an enemy
 * capital first (its defenders are then weak enough), else by Expansion's value discounted by
 * path days.
 */
function newTarget(plan: Plan, members: readonly CommanderState[]): ProvinceId | null {
  const strength = armyPower(members);
  const paths = plan.paths(members);
  const options = paths.reached.filter(
    (p) => isEnemyProvince(plan.copy, plan.nation, p) && canTake(plan, strength, p),
  );
  const capital = options.find((p) => isEnemyCapital(plan, p));
  if (capital !== undefined) return capital;
  let best: ProvinceId | null = null;
  let bestWorth = -Infinity;
  for (const p of options) {
    const w = provinceValue(plan.copy, p) * distanceFactor(plan, paths.days(p) ?? 0);
    if (w > bestWorth) {
      best = p;
      bestWorth = w;
    }
  }
  return best;
}

/**
 * Where commanders standing together go to war, if anywhere, in target order: a siege the own
 * commanders there and marching there still hold short of the storm odds (joining needs no
 * odds of its own); an enemy Wellspring (denialTarget); an enemy province an own army marches
 * on that they can take; with the odds open, a new target.
 */
function chooseTarget(
  pass: ArmyPass,
  members: readonly CommanderState[],
  targets: Targets,
): ProvinceId | null {
  const { plan } = pass;
  const strength = armyPower(members);
  const paths = plan.paths(members);
  const reach = (p: ProvinceId) => paths.pathTo(p) !== null;
  for (const siege of targets.sieges) {
    // Every own commander there or marching there, those sent this call included.
    const there = armyPower(plan.own().filter((c) => destinationOf(c) === siege.id));
    const short = there < AI.stormRatio * defenderPower(plan.copy, siege.id);
    if (short && reach(siege.id)) return siege.id;
  }
  const denied = denialTarget(pass, members, targets);
  if (denied !== null) return denied;
  const march = targets.marches.find((p) => reach(p) && canTake(plan, strength, p));
  if (march !== undefined) return march;
  return targets.open ? newTarget(plan, members) : null;
}

/** War runs from DIFFICULTIES.warFromMonth on (months counted from 1). */
function warAllowed(plan: Plan): boolean {
  const difficulty = plan.nationState.ai?.difficulty ?? 'normal';
  const month = Math.floor(plan.copy.day / TIME.daysPerMonth) + 1;
  return month >= DIFFICULTIES[difficulty].warFromMonth;
}

/**
 * Step e: each free field army goes to its war target alone; armies standing together that no
 * target takes alone try once more as one group. Joining a siege needs no odds; any other
 * target needs AI.warRatio times its defenders. While an enemy nears a Wellspring win, field
 * armies on the move that can be re-pathed are turned to deny it too.
 */
export function makeWar(pass: ArmyPass): void {
  const { plan } = pass;
  if (!warAllowed(plan)) return;
  const targets = warTargets(pass);
  const go = (members: readonly CommanderState[]): void => {
    const to = chooseTarget(pass, members, targets);
    if (to !== null) send(pass, members, to);
  };
  for (const here of byProvince(eligibleGroups(pass)).values()) {
    for (const g of here) go(g.members);
    const left = here.filter((g) => !isAssigned(plan, g));
    if (left.length > 1) go(membersOf(left));
  }
  if (targets.denial.length === 0) return;
  for (const g of eligibleGroups(pass, { moving: true })) {
    if (!isMoving(g.leader)) continue;
    const to = denialTarget(pass, g.members, targets);
    if (to !== null) send(pass, g.members, to);
  }
}
