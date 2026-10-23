// The army pass's shared tools (docs/08-ai.md priorities 4 to 7; Phase 7 design "Groups and
// free armies", "5. Army pass"): which groups a step may take, how far a group is from a
// province, what defends a province without its armies, and sending a group as one move (one
// pace, one arrival) or holding it where it stands.
import { unitDef } from '../content';
import { AI } from '../content/ai';
import { troopCount } from '../sim/commanders';
import type { CommanderId, ProvinceId } from '../sim/ids';
import { pdForce } from '../sim/pd';
import { getMapProvince, getProvince, nationDefOf } from '../sim/state';
import type { CommanderOrder, CommanderState, GameState } from '../sim/types';
import {
  armyPower,
  commanderPower,
  destinationOf,
  groups,
  isBesieging,
  isMoving,
  troopPower,
  type Group,
} from './assess';
import { fewestDays, type Plan } from './plan';

/** What the steps of one army pass share. */
export interface ArmyPass {
  readonly plan: Plan;
  /**
   * Groups holding an escorted Wellspring: War, Expansion, and Return leave them be; relief and
   * Defense may take them.
   */
  readonly escorts: Set<CommanderId>;
  /** Where groups gather to relieve the capital while it is besieged (set by relief). */
  gather: ProvinceId | null;
  /** Provinces hostile to the nation: who stands where and who owns what hold for the call. */
  readonly hostile: ReadonlySet<ProvinceId>;
}

export function createArmyPass(plan: Plan): ArmyPass {
  return {
    plan,
    escorts: new Set(),
    gather: null,
    hostile: plan.hostile(),
  };
}

/** Orders a group may hold and still be given a task. */
const FREE_ORDERS: ReadonlySet<CommanderOrder['kind']> = new Set(['idle', 'pillage', 'patrol']);

/** A member of the group has been given a task this call. */
export function isAssigned(plan: Plan, group: Group): boolean {
  return group.members.some((m) => plan.assigned.has(m.id));
}

/** A member of the group holds an escorted Wellspring. */
function isEscort(pass: ArmyPass, group: Group): boolean {
  return group.members.some((m) => pass.escorts.has(m.id));
}

/** Gives commanders their task for this call where they are: no later step takes them. */
export function hold(plan: Plan, members: readonly CommanderState[]): void {
  for (const m of members) plan.assigned.add(m.id);
}

/** What the members bring to a fight together. */
export function power(group: Group): number {
  return armyPower(group.members);
}

/** Strongest first; Array sort is stable, so equals keep their order. */
export function strongestFirst(list: readonly Group[]): Group[] {
  return [...list].sort((a, b) => power(b) - power(a));
}

/** Who else a step may take, beyond standing field armies. */
export interface Eligible {
  /** Groups leading fewer than AI.fieldArmyTroops (relief and Return take any size). */
  readonly anySize?: boolean;
  /** Groups on the move whose leg does not end among hostiles, to be re-pathed. */
  readonly moving?: boolean;
  /** Groups holding an escorted Wellspring. */
  readonly escorts?: boolean;
}

/**
 * The leader-led groups a step may take, never one already assigned this call: standing under
 * a free order (idle, pillage, patrol), not besieging, leading at least AI.fieldArmyTroops
 * unless `anySize`; with `moving`, also groups on the move that can be re-pathed; escorts only
 * with `escorts`.
 */
export function eligibleGroups(pass: ArmyPass, options: Eligible = {}): Group[] {
  const { plan } = pass;
  return groups(plan).filter((g) => {
    if (g.lone || isAssigned(plan, g)) return false;
    if (!options.escorts && isEscort(pass, g)) return false;
    if (!options.anySize && troopCount(g.leader) < AI.fieldArmyTroops) return false;
    if (isMoving(g.leader)) return options.moving === true && canRepath(plan, g);
    return FREE_ORDERS.has(g.leader.order.kind) && !isBesieging(plan, g.province);
  });
}

/** A group on the move that may be given a new path: its leg does not end among hostiles. */
function canRepath(plan: Plan, group: Group): boolean {
  const lead = group.leader;
  const end = lead.transit ? lead.transit.to : lead.location;
  return plan.paths(group.members).days(end) !== undefined;
}

/**
 * Days until commanders could stand in a province if sent now: what is left of their leg, then
 * the path from the leg's end; undefined when they cannot get there.
 */
export function daysTo(
  plan: Plan,
  members: readonly CommanderState[],
  to: ProvinceId,
): number | undefined {
  const lead = members[0];
  if (!lead) return undefined;
  if (!lead.transit && lead.location === to) return 0;
  const leg = lead.transit ? lead.transit.totalDays - lead.transit.progress : 0;
  const days = plan.paths(members).days(to);
  return days === undefined ? undefined : leg + days;
}

/**
 * The nearest of some groups to a province by days, ties to the earlier group, among those
 * `accept` takes; null when none gets there.
 */
export function nearest(
  plan: Plan,
  list: readonly Group[],
  to: ProvinceId,
  accept: (g: Group) => boolean = () => true,
): Group | null {
  return fewestDays(list, (g) => (accept(g) ? daysTo(plan, g.members, to) : undefined));
}

/**
 * Sends commanders standing or marching together to a province as one group and assigns them:
 * nothing to issue when they already stand or march there, a stop when their leg ends there,
 * else one move listing them all, so they keep one pace and arrive together (any move ends a
 * pillage). False when no path leads there or the copy refuses it.
 */
export function send(pass: ArmyPass, members: readonly CommanderState[], to: ProvinceId): boolean {
  const { plan } = pass;
  const lead = members[0];
  if (!lead) return false;
  if (members.every((m) => destinationOf(m) === to)) {
    hold(plan, members);
    return true;
  }
  if (lead.transit?.to === to) {
    const stopped = members.every(
      (m) =>
        m.order.kind === 'idle' ||
        plan.issue({ type: 'setOrder', nation: plan.nation, commander: m.id, order: 'idle' }),
    );
    if (stopped) hold(plan, members);
    return stopped;
  }
  const path = plan.paths(members).pathTo(to);
  return path !== null && sendAlong(pass, members, path);
}

/** Gives commanders one move along a path and assigns them; false if the copy refuses it. */
export function sendAlong(
  pass: ArmyPass,
  members: readonly CommanderState[],
  path: ProvinceId[],
): boolean {
  const { plan } = pass;
  const moved = plan.issue({
    type: 'move',
    nation: plan.nation,
    commanders: members.map((m) => m.id),
    path,
  });
  if (moved) hold(plan, members);
  return moved;
}

/** Every member of some groups, in order: they move as one when they stand together. */
export function membersOf(list: readonly Group[]): CommanderState[] {
  return list.flatMap((g) => g.members);
}

/** Standing groups by the province they stand in, provinces in the order first seen. */
export function byProvince(list: readonly Group[]): Map<ProvinceId, Group[]> {
  const out = new Map<ProvinceId, Group[]>();
  for (const g of list) {
    if (isMoving(g.leader)) continue;
    const here = out.get(g.province);
    if (here) here.push(g);
    else out.set(g.province, [g]);
  }
  return out;
}

/** What defends a province without any commander: the fort's garrison troops and the PD force. */
export function fixedDefense(state: GameState, province: ProvinceId): number {
  const p = getProvince(state, province);
  const holder = p.garrison === null ? undefined : state.commanders[p.garrison];
  let total = holder && holder.owner === p.owner ? commanderPower(holder) : 0;
  for (const { unit, count } of pdForce(state, province)) {
    total += count * troopPower(unitDef(unit));
  }
  return total;
}

/**
 * What a province is worth taking (docs/08-ai.md "Expansion" score's numerator): its people,
 * its springs, and a Wellspring.
 */
export function provinceValue(state: GameState, province: ProvinceId): number {
  const map = getMapProvince(state, province);
  return (
    getProvince(state, province).pop / AI.score.popPer +
    map.springs.length * AI.score.spring +
    (map.wellspring !== undefined ? AI.score.wellspring : 0)
  );
}

/** How much a target loses to the days it lies away, less for an expansive nation. */
export function distanceFactor(plan: Plan, days: number): number {
  const expansion = nationDefOf(plan.copy, plan.nation).ai.expansion;
  return 1 / (1 + AI.distancePenalty * (1 - expansion) * days);
}

/** Map hops from the nearest of some provinces to every province connected to them. */
export function hopsFrom(state: GameState, from: readonly ProvinceId[]): Map<ProvinceId, number> {
  const hops = new Map<ProvinceId, number>(from.map((p) => [p, 0]));
  let frontier: ProvinceId[] = [...from];
  for (let d = 1; frontier.length > 0; d++) {
    const next: ProvinceId[] = [];
    for (const p of frontier) {
      for (const n of getMapProvince(state, p).neighbors) {
        if (hops.has(n)) continue;
        hops.set(n, d);
        next.push(n);
      }
    }
    frontier = next;
  }
  return hops;
}

/**
 * The shortest route by map adjacency from any of some provinces to another, ignoring who owns
 * what, as the provinces entered (the start excluded); ties go to the lower province index, the
 * starts searched in the order given. Empty when the target is a start or not connected.
 */
export function adjacencyRoute(
  state: GameState,
  from: readonly ProvinceId[],
  to: ProvinceId,
): ProvinceId[] {
  const prev = new Map<ProvinceId, ProvinceId>();
  const seen = new Set<ProvinceId>(from);
  let frontier: ProvinceId[] = [...from];
  while (frontier.length > 0 && !seen.has(to)) {
    const next: ProvinceId[] = [];
    for (const p of frontier) {
      for (const n of getMapProvince(state, p).neighbors) {
        if (seen.has(n)) continue;
        seen.add(n);
        prev.set(n, p);
        next.push(n);
      }
    }
    frontier = next;
  }
  if (from.includes(to) || !seen.has(to)) return [];
  const route: ProvinceId[] = [];
  for (let at: ProvinceId | undefined = to; at !== undefined; at = prev.get(at)) {
    if (from.includes(at)) break;
    route.push(at);
  }
  return route.reverse();
}
