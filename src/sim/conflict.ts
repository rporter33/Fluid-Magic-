// What happens when a nation's commanders arrive among hostiles (docs/01-core-rules.md
// sections 6, 9, 10, 11): battles, sieges, capture, and the losers' retreat. Tick step 2b.
// Hidden commanders (stealthy, leading only stealthy troops) take no part in any of it: they
// never fight, besiege, or take a province, on either side.
import { SIEGE } from '../content/rules';
import { applyBattle } from './battle/apply';
import type { BattleSide } from './battle/events';
import { resolveBattle } from './battle/resolve';
import { buildBattle, type SideForces, type StormState } from './battle/setup';
import { captureProvince } from './capture';
import { commanderDies, isGarrisonHolder, isStealthy } from './commanders';
import type { NationId, ProvinceId } from './ids';
import { hostileWith, presence, type Arrival, type Presence } from './movement';
import { pdForce } from './pd';
import { pick } from './rng';
import { getMapProvince, getProvince } from './state';
import type { CommanderState, GameState } from './types';

/** A nation's commanders in a province that take part in conflict there. */
function fightersOf(
  state: GameState,
  provinceId: ProvinceId,
  nation: NationId | null,
): CommanderState[] {
  return Object.values(state.commanders).filter(
    (c) =>
      c.location === provinceId && c.owner === nation && !isGarrisonHolder(c) && !isStealthy(c),
  );
}

/** The forces a nation brings to a fight or a siege in a province. */
export function attackersAt(
  state: GameState,
  provinceId: ProvinceId,
  nation: NationId,
): SideForces {
  return { nation, commanders: fightersOf(state, provinceId, nation), garrison: null, pd: false };
}

/**
 * The province owner's defenders: its commanders there, the fort's garrison troops, and
 * provincial defense; for an independent province, the independents.
 */
export function ownerForces(state: GameState, provinceId: ProvinceId): SideForces {
  const p = getProvince(state, provinceId);
  const holder = p.garrison === null ? undefined : state.commanders[p.garrison];
  const garrison = holder && holder.owner === p.owner && holder.squads.length > 0 ? holder : null;
  return {
    nation: p.owner,
    commanders: fightersOf(state, provinceId, p.owner),
    garrison,
    pd: p.owner !== null && p.pd > 0,
  };
}

/** Anyone left to fight on a side. */
export function hasForces(state: GameState, provinceId: ProvinceId, forces: SideForces): boolean {
  return (
    forces.commanders.length > 0 ||
    (forces.garrison?.squads.length ?? 0) > 0 ||
    (forces.pd && pdForce(state, provinceId).length > 0)
  );
}

/**
 * Losers leave: back to the province they came from if it is still friendly (owned and with
 * no foreign army), else to a random adjacent friendly province, else they die. Independents
 * have nowhere to go. Garrison troops of a losing fort are lost.
 */
function retreat(state: GameState, provinceId: ProvinceId, forces: SideForces): void {
  if (forces.garrison) forces.garrison.squads = [];
  const present: Presence = presence(state);
  const nation = forces.nation;
  const friendly = (p: ProvinceId) =>
    nation !== null &&
    getProvince(state, p).owner === nation &&
    !hostileWith(state, present, nation, p);
  for (const c of forces.commanders) {
    if (!state.commanders[c.id]) continue;
    let to: ProvinceId | undefined;
    if (c.cameFrom !== null && c.cameFrom !== provinceId && friendly(c.cameFrom)) {
      to = c.cameFrom;
    } else {
      const options = getMapProvince(state, provinceId).neighbors.filter(friendly);
      if (options.length > 0) to = pick(state.rng, options);
    }
    if (to === undefined) {
      commanderDies(state, c.id);
      continue;
    }
    c.cameFrom = provinceId;
    c.location = to;
    c.transit = null;
    c.order = { kind: 'idle' };
  }
}

/** Fights a battle in a province and sends the losers away; returns the winner. */
export function fight(
  state: GameState,
  provinceId: ProvinceId,
  attacker: SideForces,
  defender: SideForces,
  storm: StormState | null = null,
): BattleSide {
  const setup = buildBattle(state, provinceId, attacker, defender, storm);
  const result = resolveBattle(setup, state.rng);
  applyBattle(state, provinceId, attacker, defender, result);
  retreat(state, provinceId, result.winner === 'attacker' ? defender : attacker);
  return result.winner;
}

/** A nation takes a province only with someone of its own still standing there. */
export function captureIfHeld(state: GameState, provinceId: ProvinceId, nation: NationId): void {
  if (fightersOf(state, provinceId, nation).length > 0) captureProvince(state, provinceId, nation);
}

/**
 * A nation that has moved into a province among hostiles: it first fights any third nation's
 * army there, then deals with the owner. A nation's fort is besieged, defended or not; any
 * other province is taken if undefended, or fought for. Returns whether anything happened.
 */
export function engage(state: GameState, nation: NationId, provinceId: ProvinceId): boolean {
  let acted = false;
  for (let guard = 0; guard <= Object.keys(state.nations).length; guard++) {
    const attackers = attackersAt(state, provinceId, nation);
    if (attackers.commanders.length === 0) return acted;
    const p = getProvince(state, provinceId);
    const third = (Object.keys(state.nations) as NationId[]).find(
      (n) => n !== nation && n !== p.owner && fightersOf(state, provinceId, n).length > 0,
    );
    if (third !== undefined) {
      acted = true;
      const defender = attackersAt(state, provinceId, third);
      if (fight(state, provinceId, attackers, defender) !== 'attacker') return acted;
      continue;
    }
    if (p.owner === nation) return acted;
    acted = true;
    if (p.owner !== null && p.buildings.includes('fort')) {
      // Reinforcements join a siege as it stands; a new besieger inherits battered walls.
      if (!p.siege) p.siege = { attacker: nation, wallHp: SIEGE.wallHp, storm: false };
      else if (p.siege.attacker !== nation)
        p.siege = { ...p.siege, attacker: nation, storm: false };
      return acted;
    }
    const defender = ownerForces(state, provinceId);
    if (!hasForces(state, provinceId, defender)) {
      captureProvince(state, provinceId, nation);
      return acted;
    }
    if (fight(state, provinceId, attackers, defender) === 'attacker') {
      captureIfHeld(state, provinceId, nation);
    }
    return acted;
  }
  return acted;
}

/**
 * Tick step 2b: arrivals among hostiles end their moves there, then fight, besiege, or take
 * the province, in order of arrival. Hostility is read from one presence index, rebuilt only
 * after an arrival changed something.
 */
export function resolveArrivals(state: GameState, arrivals: readonly Arrival[]): void {
  if (arrivals.length === 0) return;
  let present = presence(state);
  for (const arrival of arrivals) {
    if (!hostileWith(state, present, arrival.nation, arrival.province)) continue;
    for (const c of arrival.commanders) {
      if (c.order.kind === 'move') c.order = { kind: 'idle' };
    }
    if (engage(state, arrival.nation, arrival.province)) present = presence(state);
  }
}
