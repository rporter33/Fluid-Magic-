// How the AI sizes up armies and provinces (docs/08-ai.md "Expansion", "Defense", "War"; Phase
// 7 design "Power", "Groups and free armies"): troop and army power from content stats, what a
// province would field against an attack, the threat around it, the groups that move together,
// the armies free for a task, and the borders. The AI reads every commander and province (no
// fog for the AI in M1).
import { unitDef } from '../content';
import { AI } from '../content/ai';
import type { UnitDef } from '../content/types';
import { isGarrisonHolder, isStealthy, takesPart, troopCount } from '../sim/commanders';
import { ownerForces } from '../sim/conflict';
import type { CommanderId, NationId, ProvinceId } from '../sim/ids';
import { independentCount } from '../sim/independents';
import { pdForce } from '../sim/pd';
import { withinHops } from '../sim/rituals';
import { getMapProvince, getProvince } from '../sim/state';
import type { CommanderOrder, CommanderState, GameState } from '../sim/types';
import type { Plan } from './plan';
import { pretenderRole, splitMages } from './roles';

/** One troop of a unit: the mean of hp, att, def, and prot; a ranged unit AI.rangedBonus more. */
export function troopPower(def: UnitDef): number {
  const stats = [def.hp, def.att, def.def, def.prot];
  const mean = stats.reduce((sum, s) => sum + s, 0) / stats.length;
  return def.weapons.some((w) => w.range !== undefined) ? mean * (1 + AI.rangedBonus) : mean;
}

/**
 * What a commander brings to a fight: each squad its troops' power scaled by the HP they have
 * left, and the commander itself as one troop of its unit, scaled the same way. A garrison
 * holder brings only its troops; a hidden commander nothing, as it takes no part in battles.
 */
export function commanderPower(commander: CommanderState): number {
  if (isStealthy(commander)) return 0;
  let power = 0;
  for (const squad of commander.squads) {
    const def = unitDef(squad.unit);
    power += troopPower(def) * (squad.hp / def.hp);
  }
  if (!isGarrisonHolder(commander)) {
    const def = unitDef(commander.unit);
    power += troopPower(def) * (commander.hp / def.hp);
  }
  return power;
}

/** The power of commanders fighting together: exactly the ones listed. */
export function armyPower(commanders: readonly CommanderState[]): number {
  return commanders.reduce((sum, c) => sum + commanderPower(c), 0);
}

/**
 * The power a province fields against an attack now: its independents, or its owner's
 * commanders there with the fort's garrison troops and the PD force. Walls are not counted.
 */
export function defenderPower(state: GameState, province: ProvinceId): number {
  const forces = ownerForces(state, province);
  let power = armyPower(forces.commanders);
  if (forces.garrison) power += commanderPower(forces.garrison);
  if (forces.pd) {
    for (const { unit, count } of pdForce(state, province))
      power += count * troopPower(unitDef(unit));
  }
  return power;
}

/**
 * The summed power of other nations' commanders within AI.threatHops of a province, the
 * province itself included; hidden commanders and garrisons count nothing.
 */
export function threat(state: GameState, nation: NationId, province: ProvinceId): number {
  const near = withinHops(state, province, AI.threatHops);
  let power = 0;
  for (const c of Object.values(state.commanders)) {
    if (c.owner === null || c.owner === nation || !near.has(c.location) || !takesPart(c)) continue;
    power += commanderPower(c);
  }
  return power;
}

/** Where a commander's march ends: the last province of its move, else where it stands. */
export function destinationOf(commander: CommanderState): ProvinceId {
  const last = commander.order.kind === 'move' ? commander.order.path.at(-1) : undefined;
  return last ?? commander.transit?.to ?? commander.location;
}

/** A Wellspring province the nation owns and has not claimed. */
export function isOwnUnclaimedSpring(plan: Plan, province: ProvinceId): boolean {
  const p = getProvince(plan.copy, province);
  return (
    getMapProvince(plan.copy, province).wellspring !== undefined &&
    p.owner === plan.nation &&
    p.wellspringClaimedBy !== plan.nation
  );
}

/** Owned unclaimed Wellsprings an own priest is walking to or claiming. */
export function escortedSprings(plan: Plan): Set<ProvinceId> {
  const springs = new Set<ProvinceId>();
  for (const priest of plan.withRole('priest')) {
    const kind = priest.order.kind;
    if (kind !== 'move' && kind !== 'claimWellspring') continue;
    const to = kind === 'move' ? destinationOf(priest) : priest.location;
    if (isOwnUnclaimedSpring(plan, to)) springs.add(to);
  }
  return springs;
}

/** Commanders that move together: a leader and those riding with it, listed in one move. */
export interface Group {
  /** The leader; in a lone group, its strongest member. */
  readonly leader: CommanderState;
  /** Everyone in the group, the leader first: a move lists them all, so they keep one pace. */
  readonly members: readonly CommanderState[];
  /** Where it stands, or the province it is leaving while on the move. */
  readonly province: ProvinceId;
  /** No leader: riders left on their own, which act as a group only to walk home. */
  readonly lone: boolean;
}

/** Adds a value to the list kept under a key. */
function addTo<K, V>(lists: Map<K, V[]>, key: K, value: V): void {
  const list = lists.get(key);
  if (list) list.push(value);
  else lists.set(key, [value]);
}

/** Strongest first; Array sort is stable, so equals stay oldest first. */
function byPower(commanders: readonly CommanderState[]): CommanderState[] {
  return [...commanders].sort((a, b) => commanderPower(b) - commanderPower(a));
}

function moving(c: CommanderState): boolean {
  return c.transit !== null || c.order.kind === 'move';
}

function idleStanding(c: CommanderState): boolean {
  return c.transit === null && c.order.kind === 'idle';
}

/** Same leg and the same orders: given one move together. */
function movesWith(c: CommanderState, leader: CommanderState): boolean {
  return (
    c.location === leader.location &&
    JSON.stringify(c.transit) === JSON.stringify(leader.transit) &&
    JSON.stringify(c.order) === JSON.stringify(leader.order)
  );
}

/**
 * The nation's groups (Phase 7 design "Groups"). A leader on the move keeps the riders moving
 * with it. Standing leaders take the riders standing idle in their province, the strongest
 * leader first: summoned commanders and the fighter pretender (from AI.pretenderJoinDay) go to
 * the strongest, battle mages AI.battleMagesPerArmy to a leader. Riders standing idle where no
 * leader stands form one lone group per province. Groups come in leader order, oldest first;
 * the lone ones last.
 */
export function groups(plan: Plan): Group[] {
  const battleMages = new Set(splitMages(plan.copy, plan.nation).battleMages.map((c) => c.id));
  const rides = (c: CommanderState): boolean => {
    const role = plan.role(c);
    if (role === 'summoned') return true;
    if (role === 'mage') return battleMages.has(c.id);
    return role === 'pretender' && pretenderRole(c) === 'fighter';
  };
  const joins = (c: CommanderState): boolean =>
    plan.role(c) !== 'pretender' || plan.copy.day >= AI.pretenderJoinDay;
  const leaders = plan.withRole('leader');
  const riders = plan.own().filter(rides);
  const members = new Map<CommanderId, CommanderState[]>(leaders.map((l) => [l.id, [l]]));
  const taken = new Set<CommanderId>();
  const take = (leader: CommanderState, c: CommanderState) => {
    members.get(leader.id)?.push(c);
    taken.add(c.id);
  };
  for (const leader of leaders.filter(moving)) {
    for (const c of riders) if (!taken.has(c.id) && movesWith(c, leader)) take(leader, c);
  }
  const standing = new Map<ProvinceId, CommanderState[]>();
  for (const leader of leaders) if (!moving(leader)) addTo(standing, leader.location, leader);
  for (const [province, here] of standing) {
    const strongest = byPower(here);
    const [first] = strongest;
    for (const c of riders) {
      if (taken.has(c.id) || c.location !== province || !idleStanding(c) || !joins(c)) continue;
      if (plan.role(c) !== 'mage') {
        if (first) take(first, c);
        continue;
      }
      const seat = strongest.find(
        (l) =>
          (members.get(l.id)?.filter((m) => plan.role(m) === 'mage').length ?? 0) <
          AI.battleMagesPerArmy,
      );
      if (seat) take(seat, c);
    }
  }
  const result: Group[] = leaders.map((leader) => ({
    leader,
    members: members.get(leader.id) ?? [leader],
    province: leader.location,
    lone: false,
  }));
  const lone = new Map<ProvinceId, CommanderState[]>();
  for (const c of riders) {
    if (!taken.has(c.id) && idleStanding(c) && !standing.has(c.location))
      addTo(lone, c.location, c);
  }
  for (const [province, here] of lone) {
    const ordered = byPower(here);
    const [leader] = ordered;
    if (leader) result.push({ leader, members: ordered, province, lone: true });
  }
  return result;
}

/** Orders a field army may hold and still take a task. */
const FREE_ORDERS: ReadonlySet<CommanderOrder['kind']> = new Set(['idle', 'pillage', 'patrol']);

/** Standing in a province whose siege this nation is laying. */
export function isBesieging(plan: Plan, province: ProvinceId): boolean {
  return getProvince(plan.copy, province).siege?.attacker === plan.nation;
}

/**
 * Free field armies (Phase 7 design "Free field army"): leader-led groups standing still under
 * a free order, leading at least AI.fieldArmyTroops, neither besieging nor escorting a priest's
 * Wellspring claim, and not yet assigned this call.
 */
export function freeArmies(plan: Plan): Group[] {
  const escorted = escortedSprings(plan);
  return groups(plan).filter(
    (g) =>
      !g.lone &&
      g.leader.transit === null &&
      FREE_ORDERS.has(g.leader.order.kind) &&
      troopCount(g.leader) >= AI.fieldArmyTroops &&
      !isBesieging(plan, g.province) &&
      !escorted.has(g.province) &&
      !g.members.some((m) => plan.assigned.has(m.id)),
  );
}

/** Where a nation meets others: its provinces next to another nation's or an independent one. */
export interface Borders {
  /** Own provinces next to a province another nation owns. */
  readonly enemy: ReadonlySet<ProvinceId>;
  /** Own provinces next to an independent province. */
  readonly independent: ReadonlySet<ProvinceId>;
  /** Own provinces next to an independent province holding more than AI.independentStrength. */
  readonly strongIndependent: ReadonlySet<ProvinceId>;
}

/** A province another nation owns. */
export function isEnemyProvince(state: GameState, nation: NationId, province: ProvinceId): boolean {
  const owner = getProvince(state, province).owner;
  return owner !== null && owner !== nation;
}

/** The nation's border provinces, each set in province order. */
export function borders(state: GameState, nation: NationId): Borders {
  const enemy = new Set<ProvinceId>();
  const independent = new Set<ProvinceId>();
  const strongIndependent = new Set<ProvinceId>();
  const strong = new Map<ProvinceId, boolean>();
  const isStrong = (p: ProvinceId): boolean => {
    let s = strong.get(p);
    if (s === undefined) {
      s = independentCount(state, p) > AI.independentStrength;
      strong.set(p, s);
    }
    return s;
  };
  for (const p of Object.values(state.provinces)) {
    if (p.owner !== nation) continue;
    for (const n of getMapProvince(state, p.id).neighbors) {
      const owner = getProvince(state, n).owner;
      if (owner !== null && owner !== nation) enemy.add(p.id);
      if (owner !== null) continue;
      independent.add(p.id);
      if (isStrong(n)) strongIndependent.add(p.id);
    }
  }
  return { enemy, independent, strongIndependent };
}
