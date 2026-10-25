// What happens when a nation's commanders arrive among hostiles (docs/01-core-rules.md
// sections 6, 9, 10, 11): battles, sieges, capture, and the losers' retreat. Tick step 2b.
// Hidden commanders (stealthy, leading only stealthy troops) take no part in any of it: they
// never fight, besiege, or take a province, on either side. Each step of an arrival reads who
// stands in the province once.
import { SIEGE } from '../content/rules';
import { applyBattle } from './battle/apply';
import type { BattleSide } from './battle/events';
import { resolveBattle } from './battle/resolve';
import { buildBattle, type SideForces, type StormState } from './battle/setup';
import { captureProvince } from './capture';
import { commanderDies, takesPart } from './commanders';
import type { NationId, ProvinceId } from './ids';
import { canMove, hostileWith, presence, type Arrival, type Presence } from './movement';
import { pdForce } from './pd';
import { cloneRng, pick } from './rng';
import { getMapProvince, getProvince } from './state';
import type { CommanderState, GameState } from './types';

/** The commanders in a province that take part in conflict there, by owner, in state order. */
export type Fighters = Map<NationId | null, CommanderState[]>;

export function fightersIn(state: GameState, provinceId: ProvinceId): Fighters {
  const pool: Fighters = new Map();
  for (const c of Object.values(state.commanders)) {
    if (c.location !== provinceId || !takesPart(c)) continue;
    const list = pool.get(c.owner);
    if (list) list.push(c);
    else pool.set(c.owner, [c]);
  }
  return pool;
}

/** The forces a nation brings to a fight or a siege in a province. */
export function attackersAt(
  state: GameState,
  provinceId: ProvinceId,
  nation: NationId,
  pool: Fighters = fightersIn(state, provinceId),
): SideForces {
  return { nation, commanders: pool.get(nation) ?? [], garrison: null, pd: false };
}

/**
 * The province owner's defenders: its commanders there, the fort's garrison holder (whose
 * troops fight and who takes in a fallen commander's troops), and provincial defense; for an
 * independent province, the independents.
 */
export function ownerForces(
  state: GameState,
  provinceId: ProvinceId,
  pool: Fighters = fightersIn(state, provinceId),
): SideForces {
  const p = getProvince(state, provinceId);
  const holder = p.garrison === null ? undefined : state.commanders[p.garrison];
  return {
    nation: p.owner,
    commanders: pool.get(p.owner) ?? [],
    garrison: holder && holder.owner === p.owner ? holder : null,
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
  // Built on first use: losers without a nation or commanders never need it.
  let present: Presence | null = null;
  const nation = forces.nation;
  const friendly = (p: ProvinceId) =>
    nation !== null &&
    getProvince(state, p).owner === nation &&
    !hostileWith(state, (present ??= presence(state)), nation, p);
  for (const c of forces.commanders) {
    if (!state.commanders[c.id]) continue;
    // A commander that cannot move (the Living Monolith) cannot flee either.
    if (!canMove(c)) {
      commanderDies(state, c.id);
      continue;
    }
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

/**
 * Fights a battle in a province and sends the losers away; returns the winner. The rng state
 * from before the battle goes with the setup into the record (four numbers; it draws nothing).
 */
export function fight(
  state: GameState,
  provinceId: ProvinceId,
  attacker: SideForces,
  defender: SideForces,
  storm: StormState | null = null,
): BattleSide {
  const setup = buildBattle(state, provinceId, attacker, defender, storm);
  const rng = cloneRng(state.rng);
  const result = resolveBattle(setup, state.rng);
  (globalThis as unknown as { __battles?: unknown[] }).__battles?.push({ day: state.day, terrain: getMapProvince(state, provinceId).terrain, storm, setup, rounds: result.rounds, winner: result.winner });
  applyBattle(state, provinceId, attacker, defender, result, { setup, rng, storm });
  retreat(state, provinceId, result.winner === 'attacker' ? defender : attacker);
  return result.winner;
}

/** The winners take the province only with one of their commanders still standing there. */
export function captureIfHeld(state: GameState, provinceId: ProvinceId, winners: SideForces): void {
  if (winners.nation === null) return;
  const held = winners.commanders.some(
    (c) => state.commanders[c.id] === c && c.location === provinceId,
  );
  if (held) captureProvince(state, provinceId, winners.nation);
}

/**
 * A nation that has moved into a province among hostiles: it first fights any third nation's
 * army there, then deals with the owner. A nation's fort is besieged, defended or not; any
 * other province is taken if undefended, or fought for. Returns whether anything happened.
 */
export function engage(state: GameState, nation: NationId, provinceId: ProvinceId): boolean {
  let acted = false;
  // The besiegers of this fort were beaten here, so their siege passes on with its walls.
  let beatBesiegers = false;
  const nations = Object.keys(state.nations) as NationId[];
  for (let guard = 0; guard <= nations.length; guard++) {
    const pool = fightersIn(state, provinceId);
    const attackers = attackersAt(state, provinceId, nation, pool);
    if (attackers.commanders.length === 0) return acted;
    const p = getProvince(state, provinceId);
    const third = nations.find(
      (n) => n !== nation && n !== p.owner && (pool.get(n)?.length ?? 0) > 0,
    );
    if (third !== undefined) {
      acted = true;
      const defender = attackersAt(state, provinceId, third, pool);
      if (fight(state, provinceId, attackers, defender) !== 'attacker') return acted;
      if (p.siege?.attacker === third) beatBesiegers = true;
      continue;
    }
    if (p.owner === nation) return acted;
    acted = true;
    if (p.owner !== null && p.buildings.includes('fort')) {
      // Reinforcements join a siege as it stands; a nation that beat the besiegers here takes
      // over their battered walls; anyone else starts afresh.
      if (p.siege?.attacker === nation) return acted;
      p.siege =
        p.siege && beatBesiegers
          ? { ...p.siege, attacker: nation, storm: false }
          : { attacker: nation, wallHp: SIEGE.wallHp, storm: false };
      return acted;
    }
    const defender = ownerForces(state, provinceId, pool);
    if (!hasForces(state, provinceId, defender)) {
      captureProvince(state, provinceId, nation);
      return acted;
    }
    if (fight(state, provinceId, attackers, defender) === 'attacker') {
      captureIfHeld(state, provinceId, attackers);
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
