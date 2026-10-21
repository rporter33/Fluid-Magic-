// What happens when a nation's commanders arrive among hostiles (docs/01-core-rules.md
// sections 6, 9, 10, 11): battles, sieges, capture, and the losers' retreat. Tick step 2b.
import { applyBattle } from './battle/apply';
import { resolveBattle } from './battle/resolve';
import { buildBattle, type SideForces, type StormState } from './battle/setup';
import type { BattleSide } from './battle/events';
import { captureProvince } from './capture';
import { commanderDies, isGarrisonHolder, isStealthy } from './commanders';
import type { NationId, ProvinceId } from './ids';
import { isHostile, type Arrival } from './movement';
import { pdForce } from './pd';
import { pick } from './rng';
import { getMapProvince, getProvince } from './state';
import { SIEGE } from '../content/rules';
import type { CommanderState, GameState } from './types';

/** A nation's commanders in a province that can fight there (garrison holders never do). */
function fightersOf(
  state: GameState,
  provinceId: ProvinceId,
  nation: NationId | null,
  hidden: boolean,
): CommanderState[] {
  return Object.values(state.commanders).filter(
    (c) =>
      c.location === provinceId &&
      c.owner === nation &&
      !isGarrisonHolder(c) &&
      (hidden || !isStealthy(c)),
  );
}

/** The forces a nation brings when it moves in. Its stealthy commanders fight too. */
export function attackersAt(
  state: GameState,
  provinceId: ProvinceId,
  nation: NationId,
): SideForces {
  return {
    nation,
    commanders: fightersOf(state, provinceId, nation, true),
    garrison: null,
    pd: false,
  };
}

/**
 * The province owner's defenders: its commanders there (hidden ones stay hidden), the fort's
 * garrison troops, and provincial defense; for an independent province, the independents.
 */
export function ownerForces(state: GameState, provinceId: ProvinceId): SideForces {
  const p = getProvince(state, provinceId);
  const holder = p.garrison === null ? undefined : state.commanders[p.garrison];
  const garrison = holder && holder.owner === p.owner && holder.squads.length > 0 ? holder : null;
  return {
    nation: p.owner,
    commanders: fightersOf(state, provinceId, p.owner, false),
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

/** Friendly to a nation: owned by it and with no foreign army present. */
function friendly(state: GameState, nation: NationId, provinceId: ProvinceId): boolean {
  return getProvince(state, provinceId).owner === nation && !isHostile(state, nation, provinceId);
}

/**
 * Losers leave: a losing attacker goes back where it came from if that is still friendly; any
 * other loser goes to a random adjacent friendly province. With nowhere to go, or with no
 * nation (Independents), it is destroyed. Garrison troops of a losing fort are lost.
 */
function retreat(
  state: GameState,
  provinceId: ProvinceId,
  side: BattleSide,
  forces: SideForces,
): void {
  if (forces.garrison) forces.garrison.squads = [];
  for (const c of forces.commanders) {
    if (!state.commanders[c.id]) continue;
    const nation = forces.nation;
    let to: ProvinceId | undefined;
    if (nation !== null) {
      if (side === 'attacker' && c.cameFrom !== null && friendly(state, nation, c.cameFrom)) {
        to = c.cameFrom;
      } else {
        const options = getMapProvince(state, provinceId).neighbors.filter((n) =>
          friendly(state, nation, n),
        );
        if (options.length > 0) to = pick(state.rng, options);
      }
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
): BattleSide | null {
  const setup = buildBattle(state, provinceId, attacker, defender, storm);
  const result = resolveBattle(setup, state.rng);
  applyBattle(state, provinceId, attacker, defender, result);
  if (result.winner === 'attacker') retreat(state, provinceId, 'defender', defender);
  else retreat(state, provinceId, 'attacker', attacker);
  return result.winner;
}

/**
 * A nation that has moved into a province among hostiles: it first fights any third nation's
 * army there, then deals with the owner. No owner's forces: it takes the province. A fort
 * with defenders: it lays siege. Otherwise a battle, and the province if it wins.
 */
export function engage(state: GameState, nation: NationId, provinceId: ProvinceId): void {
  for (let guard = 0; guard <= Object.keys(state.nations).length; guard++) {
    const attackers = attackersAt(state, provinceId, nation);
    if (attackers.commanders.length === 0) return;
    const p = getProvince(state, provinceId);
    const third = (Object.keys(state.nations) as NationId[]).find(
      (n) => n !== nation && n !== p.owner && fightersOf(state, provinceId, n, false).length > 0,
    );
    if (third !== undefined) {
      const defender: SideForces = {
        nation: third,
        commanders: fightersOf(state, provinceId, third, false),
        garrison: null,
        pd: false,
      };
      if (fight(state, provinceId, attackers, defender) !== 'attacker') return;
      continue;
    }
    if (p.owner === nation) return;
    const defender = ownerForces(state, provinceId);
    if (!hasForces(state, provinceId, defender)) {
      captureProvince(state, provinceId, nation);
      return;
    }
    if (p.owner !== null && p.buildings.includes('fort')) {
      // Reinforcements join a siege as it stands; a new besieger inherits battered walls.
      if (!p.siege) p.siege = { attacker: nation, wallHp: SIEGE.wallHp, storm: false };
      else if (p.siege.attacker !== nation)
        p.siege = { ...p.siege, attacker: nation, storm: false };
      return;
    }
    if (fight(state, provinceId, attackers, defender) === 'attacker') {
      captureProvince(state, provinceId, nation);
    }
    return;
  }
}

/**
 * Tick step 2b: arrivals among hostiles end their moves there, then fight, besiege, or take
 * the province, in order of arrival.
 */
export function resolveArrivals(state: GameState, arrivals: readonly Arrival[]): void {
  for (const arrival of arrivals) {
    if (!isHostile(state, arrival.nation, arrival.province)) continue;
    for (const c of arrival.commanders) {
      if (c.order.kind === 'move') c.order = { kind: 'idle' };
    }
    engage(state, arrival.nation, arrival.province);
  }
}
