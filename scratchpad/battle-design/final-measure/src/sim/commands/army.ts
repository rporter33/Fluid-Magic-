// Commands to commanders: movement, orders, scripts, formations, squads, and building.
import { buildingDef, isBuildingId, unitDef } from '../../content';
import { SCRIPT_SLOTS } from '../../content/rules';
import { isSpellId, spellDef } from '../../content/spells';
import { constructionCost, startConstruction } from '../buildings';
import { newId } from '../ids';
import { addSquad, isGarrisonHolder, troopCount } from '../commanders';
import { canMove, commanderMapSpeed, hostileProvinces, startLeg } from '../movement';
import { meetsRequirement } from '../pips';
import { canResearch, inOwnLab } from '../research';
import { getCommander, getMapProvince, getNation } from '../state';
import {
  FORMATIONS,
  SCRIPT_KINDS,
  type CommanderState,
  type GameState,
  type Transit,
} from '../types';
import { isIntegerIn, ownCommander, ownProvince } from './check';
import type { CommandOf } from './types';

const NOT_YOURS = 'That commander is not yours';
/** The garrison holder only keeps troops; it takes no orders, scripts, or builds. */
const NO_ORDERS = 'The garrison takes no orders';

function sameTransit(a: Transit | null, b: Transit | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.from === b.from && a.to === b.to && a.progress === b.progress && a.totalDays === b.totalDays
  );
}

// ---------------------------------------------------------------- move

export function validateMove(state: GameState, cmd: CommandOf<'move'>): string | null {
  if (cmd.commanders.length === 0) return 'No commander selected';
  if (new Set(cmd.commanders).size !== cmd.commanders.length) return 'A commander is listed twice';
  const group: CommanderState[] = [];
  for (const id of cmd.commanders) {
    const c = ownCommander(state, cmd.nation, id);
    if (!c) return NOT_YOURS;
    if (!canMove(c)) return `${c.name} cannot move`;
    group.push(c);
  }
  const lead = group[0];
  if (!lead) return 'No commander selected';
  if (!group.every((c) => c.location === lead.location && sameTransit(c.transit, lead.transit))) {
    return 'The commanders are not together';
  }
  if (cmd.path.length === 0) return 'The path is empty';
  if (cmd.path.length > Object.keys(state.map.provinces).length) return 'The path is too long';
  // A move ends at the first hostile province, so only the last may be one.
  const hostile = hostileProvinces(state, cmd.nation);
  let at = lead.transit ? lead.transit.to : lead.location;
  if (lead.transit && hostile.has(at)) return `${lead.name} will stop at the end of this leg`;
  for (const [i, next] of cmd.path.entries()) {
    if (!Object.hasOwn(state.map.provinces, next)) return 'The path leaves the map';
    if (!getMapProvince(state, at).neighbors.includes(next)) return 'The path is not connected';
    if (i < cmd.path.length - 1 && hostile.has(next)) {
      return `The path crosses ${getMapProvince(state, next).name}, which is hostile`;
    }
    at = next;
  }
  return null;
}

/** The group keeps one pace: the slowest commander's speed, frozen in every order. */
export function applyMove(state: GameState, cmd: CommandOf<'move'>): void {
  const group = cmd.commanders.map((id) => getCommander(state, id));
  const mapSpeed = Math.min(...group.map(commanderMapSpeed));
  const [first, ...rest] = cmd.path;
  if (first === undefined) return;
  for (const c of group) {
    if (c.transit) {
      // The current leg finishes first; the new path starts where it ends.
      c.order = { kind: 'move', path: [...cmd.path], mapSpeed };
    } else {
      c.order = { kind: 'move', path: [...rest], mapSpeed };
      startLeg(state, c, first, mapSpeed);
    }
  }
}

// ---------------------------------------------------------------- reverse

export function validateReverse(state: GameState, cmd: CommandOf<'reverse'>): string | null {
  const c = ownCommander(state, cmd.nation, cmd.commander);
  if (!c) return NOT_YOURS;
  if (!c.transit) return `${c.name} is not moving`;
  return null;
}

/**
 * Turns a commander around on its leg (docs/01 section 6: from and to swap and progress
 * becomes totalDays - progress). It never reached the far end, so its location stays the
 * province it left. With nothing travelled the leg is simply dropped. Either way it stops
 * once back.
 */
export function applyReverse(state: GameState, cmd: CommandOf<'reverse'>): void {
  const c = getCommander(state, cmd.commander);
  const t = c.transit;
  if (!t) return;
  if (t.progress === 0) {
    c.transit = null;
    if (c.order.kind === 'move') c.order = { kind: 'idle' };
    return;
  }
  if (c.order.kind === 'move') c.order = { ...c.order, path: [] };
  c.transit = {
    from: t.to,
    to: t.from,
    progress: t.totalDays - t.progress,
    totalDays: t.totalDays,
  };
}

// ---------------------------------------------------------------- orders

export function validateSetOrder(state: GameState, cmd: CommandOf<'setOrder'>): string | null {
  const c = ownCommander(state, cmd.nation, cmd.commander);
  if (!c) return NOT_YOURS;
  if (isGarrisonHolder(c)) return NO_ORDERS;
  switch (cmd.order) {
    case 'idle':
    case 'pillage':
    case 'patrol':
      return null;
    case 'preach':
      return c.holy > 0 ? null : `${c.name} is not a priest`;
    case 'research':
      if (!canResearch(c)) return `${c.name} is not a mage`;
      if (c.transit) return `${c.name} is on the move`;
      return inOwnLab(state, c) ? null : 'Research needs a lab in a province you own';
    default:
      return 'That order is not available';
  }
}

export function applySetOrder(state: GameState, cmd: CommandOf<'setOrder'>): void {
  getCommander(state, cmd.commander).order = { kind: cmd.order };
}

// ---------------------------------------------------------------- script and formation

export function validateSetScript(state: GameState, cmd: CommandOf<'setScript'>): string | null {
  const c = ownCommander(state, cmd.nation, cmd.commander);
  if (!c) return NOT_YOURS;
  if (isGarrisonHolder(c)) return NO_ORDERS;
  if (cmd.slots.length !== SCRIPT_SLOTS) return `A script has ${SCRIPT_SLOTS} slots`;
  for (const slot of cmd.slots) {
    if (!SCRIPT_KINDS.includes(slot.kind)) return 'Unknown script action';
    if (slot.kind !== 'cast' || slot.spellId === null) continue;
    // A named battle spell the commander's pips can meet. Research is checked in battle,
    // where a spell not yet researched falls back to the best castable one.
    if (!isSpellId(slot.spellId)) return 'Unknown spell';
    const spell = spellDef(slot.spellId);
    if (spell.kind !== 'battle') return `${spell.name} is a ritual`;
    if (!meetsRequirement(c.pips, c.holy, spell)) return `${c.name} cannot cast ${spell.name}`;
  }
  return null;
}

export function applySetScript(state: GameState, cmd: CommandOf<'setScript'>): void {
  getCommander(state, cmd.commander).script = cmd.slots.map((s) => ({ ...s }));
}

export function validateSetFormation(
  state: GameState,
  cmd: CommandOf<'setFormation'>,
): string | null {
  const c = ownCommander(state, cmd.nation, cmd.commander);
  if (!c) return NOT_YOURS;
  if (!c.squads.some((s) => s.id === cmd.squad)) return 'That squad is not under this commander';
  if (!FORMATIONS.includes(cmd.formation)) return 'Unknown formation';
  return null;
}

export function applySetFormation(state: GameState, cmd: CommandOf<'setFormation'>): void {
  const c = getCommander(state, cmd.commander);
  const squad = c.squads.find((s) => s.id === cmd.squad);
  if (!squad) return;
  squad.formation = cmd.formation;
  // Moving into a row that already holds this unit merges into the squad there.
  if (
    c.squads.some((s) => s !== squad && s.unit === squad.unit && s.formation === squad.formation)
  ) {
    c.squads = c.squads.filter((s) => s !== squad);
    addSquad(c, squad);
  }
}

// ---------------------------------------------------------------- squads

export function validateTransferSquad(
  state: GameState,
  cmd: CommandOf<'transferSquad'>,
): string | null {
  const from = ownCommander(state, cmd.nation, cmd.from);
  const to = ownCommander(state, cmd.nation, cmd.to);
  if (!from || !to) return NOT_YOURS;
  if (from === to) return 'Choose another commander';
  if (from.transit || to.transit) return 'Squads cannot change hands on the move';
  if (from.location !== to.location) return 'The commanders are not together';
  const squad = from.squads.find((s) => s.id === cmd.squad);
  if (!squad) return 'That squad is not under this commander';
  const count = cmd.count ?? squad.count;
  if (!isIntegerIn(count, 1, squad.count)) return 'Bad troop count';
  const leadership = unitDef(to.unit).commander?.leadership ?? 0;
  if (troopCount(to) + count > leadership) return `${to.name} can lead only ${leadership} troops`;
  return null;
}

/**
 * Moves a whole squad, or splits off `count` troops with their share of the HP pool. The troops
 * join a squad of the same unit in the same row if the receiver has one.
 */
export function applyTransferSquad(state: GameState, cmd: CommandOf<'transferSquad'>): void {
  const from = getCommander(state, cmd.from);
  const to = getCommander(state, cmd.to);
  const index = from.squads.findIndex((s) => s.id === cmd.squad);
  const squad = from.squads[index];
  if (!squad) return;
  const count = cmd.count ?? squad.count;
  if (count >= squad.count) {
    from.squads.splice(index, 1);
    addSquad(to, squad);
    return;
  }
  const hp = (squad.hp * count) / squad.count;
  squad.count -= count;
  squad.hp -= hp;
  addSquad(to, { ...squad, id: newId(state, 'squad'), count, hp });
}

// ---------------------------------------------------------------- build

export function validateBuild(state: GameState, cmd: CommandOf<'build'>): string | null {
  const c = ownCommander(state, cmd.nation, cmd.commander);
  if (!c) return NOT_YOURS;
  if (isGarrisonHolder(c)) return NO_ORDERS;
  const p = ownProvince(state, cmd.nation, cmd.province);
  if (!p) return 'That province is not yours';
  if (c.transit || c.location !== p.id) return `${c.name} must stand in the province`;
  if (!isBuildingId(cmd.building)) return 'Unknown building';
  const def = buildingDef(cmd.building);
  if (!def.buildable) return `${def.name}s cannot be built yet`;
  if (p.buildings.includes(cmd.building)) return `There is already a ${def.name.toLowerCase()}`;
  if (p.construction) return 'Something is already being built here';
  if (getNation(state, cmd.nation).gold < constructionCost(state, p.id, cmd.building)) {
    return 'Not enough gold';
  }
  return null;
}

export function applyBuild(state: GameState, cmd: CommandOf<'build'>): void {
  getCommander(state, cmd.commander).order = {
    kind: 'build',
    building: cmd.building,
    province: cmd.province,
  };
  startConstruction(state, cmd.province, cmd.building, cmd.nation, cmd.commander);
}
