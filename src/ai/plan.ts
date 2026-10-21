// The AI's planning context (docs/08-ai.md decisions; Phase 7 design "Planning copy"): one call
// plans on a copy of the state that deep-copies only what commands write and shares the rest.
// Each command is applied on the copy as it is issued, so later steps see its effect, and only
// commands the copy accepted are returned.
import { applyCommand, type Command } from '../sim/commands';
import type { CommanderId, NationId, ProvinceId } from '../sim/ids';
import {
  canMove,
  commanderMapSpeed,
  hostileProvinces,
  pathsFrom,
  pathsWith,
  type Paths,
} from '../sim/movement';
import type { RngState } from '../sim/rng';
import { commandersByProvince } from '../sim/selectors';
import { getNation, getProvince } from '../sim/state';
import type { CommanderState, GameState, NationState, ProvinceState } from '../sim/types';
import { destinationOf } from './assess';
import { roleOf, type Role } from './roles';
import { aiRng } from './rng';

function jsonCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * The planning copy: provinces, nations, and commanders round-tripped through JSON, since
 * commands write them; the map, rng, province effects, battles, messages, and result shared by
 * reference, since no command writes them (a step that did would show in the real state). nextId
 * and day carry over, so ids made on the copy are the ids the real state makes when it receives
 * the same commands in the same order.
 */
export function planningCopy(state: GameState): GameState {
  return {
    ...state,
    provinces: jsonCopy(state.provinces),
    nations: jsonCopy(state.nations),
    commanders: jsonCopy(state.commanders),
  };
}

/**
 * Commanders busy with something an order would end: a ritual, a Wellspring claim, a building.
 * No step gives them an order or a move (the order guard).
 */
export function isGuarded(commander: CommanderState): boolean {
  const kind = commander.order.kind;
  return kind === 'castRitual' || kind === 'claimWellspring' || kind === 'build';
}

/** The commanders a command gives an order or a move to. */
function orderedBy(cmd: Command): readonly CommanderId[] {
  switch (cmd.type) {
    case 'move':
      return cmd.commanders;
    case 'reverse':
    case 'setOrder':
    case 'build':
    case 'castRitual':
    case 'claimWellspring':
      return [cmd.commander];
    default:
      return [];
  }
}

/** One planning call for one nation: the copy, the call's stream, and what it has issued. */
export interface Plan {
  /** The planning copy: every step reads and writes it, never the real state. */
  readonly copy: GameState;
  readonly nation: NationId;
  /** The nation on the copy. */
  readonly nationState: NationState;
  /** The nation's capital on the copy (it may be in enemy hands). */
  readonly capital: ProvinceState;
  /** This call's random stream (aiRng). */
  readonly rng: RngState;
  /** The commands issued so far, in order, each already applied on the copy. */
  readonly out: Command[];
  /** Commanders given a task this call: the army pass assigns each group at most once. */
  readonly assigned: Set<CommanderId>;
  /**
   * Applies a command on the copy and records it; false, recording nothing, when the copy
   * refuses it or it would give an order or a move to a guarded commander (isGuarded).
   */
  issue(cmd: Command): boolean;
  /** Every path a group could be given now (pathsFrom), searched once per start and pace. */
  paths(group: readonly CommanderState[]): Paths;
  /** Provinces hostile to the nation (hostileProvinces on the copy), found once per call. */
  hostile(): ReadonlySet<ProvinceId>;
  /** The nation's commanders on the copy, oldest first. */
  own(): readonly CommanderState[];
  /** The nation's commanders with a role, oldest first. */
  withRole(role: Role): readonly CommanderState[];
  /** A commander's role (roleOf on the copy). */
  role(commander: CommanderState): Role;
  /** Every commander standing in a province (or leaving it), any owner, oldest first. */
  at(province: ProvinceId): readonly CommanderState[];
  /** The provinces the nation owns, in province order. */
  owned(): readonly ProvinceState[];
}

/** One step of a planning call: it reads the copy and issues commands through the plan. */
export type Step = (plan: Plan) => void;

/**
 * Starts a planning call. Commands never move a commander, create or remove one, or change a
 * province's owner, so who stands where, who exists, roles, ownership, and so the hostile
 * provinces hold for the whole call and are read once; a group's paths depend only on where it
 * starts and its pace.
 */
export function createPlan(state: GameState, nation: NationId): Plan {
  const copy = planningCopy(state);
  const nationState = getNation(copy, nation);
  const out: Command[] = [];
  const byProvince = commandersByProvince(copy);
  const own = Object.values(copy.commanders).filter((c) => c.owner === nation);
  const roles = new Map<CommanderId, Role>();
  const role = (c: CommanderState): Role => {
    let r = roles.get(c.id);
    if (r === undefined) {
      r = roleOf(copy, c);
      roles.set(c.id, r);
    }
    return r;
  };
  const owned = Object.values(copy.provinces).filter((p) => p.owner === nation);
  const searches = new Map<string, Paths>();
  let hostile: ReadonlySet<ProvinceId> | null = null;
  const hostileSet = (): ReadonlySet<ProvinceId> => {
    hostile ??= hostileProvinces(copy, nation);
    return hostile;
  };
  return {
    copy,
    nation,
    nationState,
    capital: getProvince(copy, nationState.capital),
    rng: aiRng(state, nation),
    out,
    assigned: new Set(),
    issue(cmd) {
      const guarded = orderedBy(cmd).some((id) => {
        const c = copy.commanders[id];
        return c !== undefined && isGuarded(c);
      });
      if (guarded) return false;
      if (!applyCommand(copy, cmd).ok) return false;
      out.push(cmd);
      return true;
    },
    paths(group) {
      const lead = group[0];
      if (!lead || lead.owner !== nation || !group.every(canMove)) return pathsFrom(copy, group);
      const start = lead.transit ? lead.transit.to : lead.location;
      const pace = Math.min(...group.map(commanderMapSpeed));
      const key = `${start} ${String(pace)} ${lead.transit ? 'leg' : 'standing'}`;
      let found = searches.get(key);
      if (!found) {
        found = pathsWith(copy, group, hostileSet());
        searches.set(key, found);
      }
      return found;
    },
    hostile: hostileSet,
    own: () => own,
    withRole: (r) => own.filter((c) => role(c) === r),
    role,
    at: (province) => byProvince.get(province) ?? [],
    owned: () => owned,
  };
}

/** Walks one commander to a province unless it stands there or already walks there. */
export function walk(plan: Plan, commander: CommanderState, to: ProvinceId): void {
  if (destinationOf(commander) === to) return;
  const path = plan.paths([commander]).pathTo(to);
  if (path) plan.issue({ type: 'move', nation: plan.nation, commanders: [commander.id], path });
}

/** The item with the fewest days, the first of equals; null when none has a number of days. */
export function fewestDays<T>(items: Iterable<T>, days: (item: T) => number | undefined): T | null {
  let best: T | null = null;
  let bestDays = Infinity;
  for (const item of items) {
    const d = days(item);
    if (d !== undefined && d < bestDays) {
      best = item;
      bestDays = d;
    }
  }
  return best;
}
