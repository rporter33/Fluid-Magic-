// Movement along the province graph (docs/01-core-rules.md section 6, Movement). A commander
// in transit walks one leg at a time; each leg takes whole days. Tick step 2 runs in three
// parts, so Phase 4 can fight at arrivals before anyone marches on: advanceTransits,
// resolveArrivals, continueMoves. Paths and ETAs are selectors shared by the UI and the AI.
import { unitDef } from '../content';
import { MOVEMENT } from '../content/rules';
import { TERRAIN } from '../content/terrain';
import { isGarrisonHolder, isStealthy } from './commanders';
import type { NationId, ProvinceId } from './ids';
import { getMapProvince, getProvince } from './state';
import type { CommanderState, GameState } from './types';

/** A commander's map speed: the slowest of its own unit and its squads'. 0 cannot move. */
export function commanderMapSpeed(commander: CommanderState): number {
  let speed = unitDef(commander.unit).mapSpeed;
  for (const squad of commander.squads) speed = Math.min(speed, unitDef(squad.unit).mapSpeed);
  return speed;
}

export function canMove(commander: CommanderState): boolean {
  return MOVEMENT.speedFactor[commanderMapSpeed(commander)] !== undefined;
}

/** Whole days to enter a province at a map speed. Throws for a speed that cannot move. */
export function legDays(state: GameState, to: ProvinceId, mapSpeed: number): number {
  const factor = MOVEMENT.speedFactor[mapSpeed];
  if (factor === undefined) throw new RangeError(`map speed ${mapSpeed} cannot move`);
  const days = Math.round(TERRAIN[getMapProvince(state, to).terrain].moveDays * factor);
  return Math.max(MOVEMENT.minLegDays, days);
}

/** Total days to walk a path (the provinces entered, in order) at a map speed. */
export function pathDays(state: GameState, path: readonly ProvinceId[], mapSpeed: number): number {
  return path.reduce((sum, p) => sum + legDays(state, p, mapSpeed), 0);
}

/**
 * Fastest path for a nation from one province to another by leg days, as the provinces to
 * enter (the start excluded). Only the last province may be hostile, since a move ends at the
 * first hostile one. Ties go to the lower province index, so the result is deterministic.
 * Null when the target is the start or cannot be reached. Throws for a speed that cannot move.
 */
export function findPath(
  state: GameState,
  nation: NationId,
  from: ProvinceId,
  to: ProvinceId,
  mapSpeed: number,
): ProvinceId[] | null {
  if (from === to) return null;
  const hostile = hostileProvinces(state, nation);
  const ids = Object.keys(state.map.provinces) as ProvinceId[];
  const dist = new Map<ProvinceId, number>([[from, 0]]);
  const prev = new Map<ProvinceId, ProvinceId>();
  const done = new Set<ProvinceId>();
  for (;;) {
    // Scanning in index order takes the lowest index among equally near provinces.
    let best: ProvinceId | null = null;
    let bestDist = Infinity;
    for (const id of ids) {
      const d = dist.get(id);
      if (d !== undefined && d < bestDist && !done.has(id)) {
        best = id;
        bestDist = d;
      }
    }
    if (best === null) return null;
    if (best === to) break;
    done.add(best);
    // A move ends at the first hostile province, so a path may only end in one.
    if (hostile.has(best) && best !== from) continue;
    for (const n of getMapProvince(state, best).neighbors) {
      const d = bestDist + legDays(state, n, mapSpeed);
      const known = dist.get(n);
      if (!done.has(n) && (known === undefined || d < known)) {
        dist.set(n, d);
        prev.set(n, best);
      }
    }
  }
  const path: ProvinceId[] = [];
  for (let at: ProvinceId | undefined = to; at !== undefined && at !== from; at = prev.get(at)) {
    path.push(at);
  }
  return path.reverse();
}

/**
 * The path a group would be given to `to` right now, exactly as move validation sees it: from
 * where the current leg ends (or where the group stands), at the slowest member's speed. Null
 * when there is none, including for a group whose leg ends among hostiles, since it stops
 * there. The group is assumed to stand together, as a move requires.
 */
export function findPathFor(
  state: GameState,
  commanders: readonly CommanderState[],
  to: ProvinceId,
): ProvinceId[] | null {
  const lead = commanders[0];
  if (!lead || lead.owner === null || !commanders.every(canMove)) return null;
  const start = lead.transit ? lead.transit.to : lead.location;
  if (lead.transit && isHostile(state, lead.owner, start)) return null;
  return findPath(state, lead.owner, start, to, Math.min(...commanders.map(commanderMapSpeed)));
}

/** Days until a commander finishes its current move; 0 when it is not moving. */
export function etaDays(state: GameState, commander: CommanderState): number {
  const leg = commander.transit ? commander.transit.totalDays - commander.transit.progress : 0;
  const rest = commander.order.kind === 'move' ? commander.order.path : [];
  const speed = commander.order.kind === 'move' ? commander.order.mapSpeed : 0;
  return leg + (rest.length > 0 ? pathDays(state, rest, speed) : 0);
}

/**
 * Days a group would take to walk a path if ordered now: what is left of a leg under way, then
 * the path at the group's slowest speed. For showing an ETA before the command is sent; null
 * when the group cannot move.
 */
export function pathEta(
  state: GameState,
  commanders: readonly CommanderState[],
  path: readonly ProvinceId[],
): number | null {
  const lead = commanders[0];
  if (!lead || !commanders.every(canMove)) return null;
  const speed = Math.min(...commanders.map(commanderMapSpeed));
  const leg = lead.transit ? lead.transit.totalDays - lead.transit.progress : 0;
  return leg + pathDays(state, path, speed);
}

/** Starts a commander on its next leg toward `to`. */
export function startLeg(
  state: GameState,
  commander: CommanderState,
  to: ProvinceId,
  mapSpeed: number,
): void {
  commander.transit = {
    from: commander.location,
    to,
    progress: 0,
    totalDays: legDays(state, to, mapSpeed),
  };
}

/** Commanders of one nation that arrived in one province on the same day. */
export interface Arrival {
  province: ProvinceId;
  nation: NationId;
  commanders: CommanderState[];
}

/** The owners of the commanders present in each province, as far as hostility goes. */
type Presence = Map<ProvinceId, Set<NationId | null>>;

/**
 * Who is present where for hostility. A commander is present at its location in transit or
 * not. Garrison holders never fight, and a stealthy commander is hidden: counting it would
 * give it away through refused paths.
 */
function presence(state: GameState): Presence {
  const present: Presence = new Map();
  for (const c of Object.values(state.commanders)) {
    if (isGarrisonHolder(c) || isStealthy(c)) continue;
    const owners = present.get(c.location);
    if (owners) owners.add(c.owner);
    else present.set(c.location, new Set([c.owner]));
  }
  return present;
}

function hostileWith(
  state: GameState,
  present: Presence,
  nation: NationId,
  province: ProvinceId,
): boolean {
  if (getProvince(state, province).owner !== nation) return true;
  for (const owner of present.get(province) ?? []) if (owner !== nation) return true;
  return false;
}

/**
 * Provinces where a nation's commanders meet hostiles on arrival: every province it does not
 * own, and its own provinces where another owner's commander is present (a besieged fort is
 * one, through its besiegers). Phase 4 fights, besieges, or captures there.
 */
export function hostileProvinces(state: GameState, nation: NationId): Set<ProvinceId> {
  const present = presence(state);
  const ids = Object.keys(state.provinces) as ProvinceId[];
  return new Set(ids.filter((p) => hostileWith(state, present, nation, p)));
}

export function isHostile(state: GameState, nation: NationId, province: ProvinceId): boolean {
  return hostileWith(state, presence(state), nation, province);
}

/**
 * Tick step 2a: every commander in transit walks one day. Arrivals take the commander into
 * the province (a commander back from a reversed leg never left, so its cameFrom stays) and
 * are returned grouped by province, in order of first arrival, then by nation.
 */
export function advanceTransits(state: GameState): Arrival[] {
  const arrivals: Arrival[] = [];
  for (const commander of Object.values(state.commanders)) {
    const transit = commander.transit;
    if (!transit) continue;
    transit.progress += 1;
    if (transit.progress < transit.totalDays) continue;
    if (commander.location !== transit.to) {
      commander.cameFrom = commander.location;
      commander.location = transit.to;
    }
    commander.transit = null;
    const nation = commander.owner;
    if (nation === null) continue;
    const group = arrivals.find((a) => a.province === transit.to && a.nation === nation);
    if (group) group.commanders.push(commander);
    else arrivals.push({ province: transit.to, nation, commanders: [commander] });
  }
  const firstSeen = new Map<ProvinceId, number>();
  arrivals.forEach((a, i) => {
    if (!firstSeen.has(a.province)) firstSeen.set(a.province, i);
  });
  // Array sort is stable, so each province's groups keep their arrival order.
  return arrivals.sort(
    (a, b) => (firstSeen.get(a.province) ?? 0) - (firstSeen.get(b.province) ?? 0),
  );
}

/**
 * Tick step 2b: an arrival among hostiles ends the move there. Phase 4 puts battles,
 * sieges, and captures here. Orders other than move (set while marching) stay.
 */
export function resolveArrivals(state: GameState, arrivals: readonly Arrival[]): void {
  if (arrivals.length === 0) return;
  const present = presence(state);
  for (const arrival of arrivals) {
    if (!hostileWith(state, present, arrival.nation, arrival.province)) continue;
    for (const c of arrival.commanders) {
      if (c.order.kind === 'move') c.order = { kind: 'idle' };
    }
  }
}

/**
 * Tick step 2c: commanders standing with a move order start their next leg the same day, at
 * the order's frozen speed; with no path left the order ends. Running after the arrivals are
 * resolved means passing commanders stood in the province while Phase 4 fights there.
 */
export function continueMoves(state: GameState): void {
  for (const c of Object.values(state.commanders)) {
    const order = c.order;
    if (c.transit || order.kind !== 'move') continue;
    const [next, ...rest] = order.path;
    if (next === undefined) {
      c.order = { kind: 'idle' };
      continue;
    }
    order.path = rest;
    startLeg(state, c, next, order.mapSpeed);
  }
}
