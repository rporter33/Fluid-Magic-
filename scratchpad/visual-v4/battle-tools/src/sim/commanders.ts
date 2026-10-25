// Creating commanders and squads, and per-unit numbers the economy needs.
import { unitDef, type UnitTypeId } from '../content';
import { chassisDef, isChassisId } from '../content/pretenders/chassis';
import { ECONOMY, PROPHET, SCRIPT_SLOTS, SUPPLY } from '../content/rules';
import type { UnitDef } from '../content/types';
import { newId, type CommanderId, type NationId, type ProvinceId } from './ids';
import { postMessage } from './messages';
import { hasPips } from './pips';
import { chance } from './rng';
import type {
  CommanderState,
  Formation,
  GameState,
  NationState,
  Pips,
  ScriptSlot,
  Squad,
} from './types';

/** Squads with a ranged weapon stand in the middle row, everyone else in front. */
export function defaultFormation(def: UnitDef): Formation {
  return def.weapons.some((w) => w.range !== undefined) ? 'middle' : 'front';
}

/**
 * docs/04-battle.md: a commander with color or holy pips casts (its unit's default spell, else
 * its best castable one); others hold. Priests default to Bless (docs/08-ai.md).
 */
export function defaultScript(def: UnitDef, pips: Pips, holy: number): ScriptSlot[] {
  const spellId = def.commander?.defaultSpell ?? null;
  const slot: ScriptSlot = hasPips(pips, holy) ? { kind: 'cast', spellId } : { kind: 'hold' };
  return Array.from({ length: SCRIPT_SLOTS }, () => ({ ...slot }));
}

export function createSquad(state: GameState, unit: UnitTypeId, count: number): Squad {
  const def = unitDef(unit);
  if (def.commander) throw new Error(`${unit} is a commander, not a troop`);
  return {
    id: newId(state, 'squad'),
    unit,
    count,
    hp: count * def.hp,
    formation: defaultFormation(def),
    starvedDays: 0,
  };
}

/**
 * Gives a squad to a commander, which holds at most one squad per unit type and row: troops
 * joining a matching squad add their count and HP to it (it keeps its id), and the hungrier
 * starvation counter stays. Keeps troops from being split into many tiny squads.
 */
export function addSquad(commander: CommanderState, squad: Squad): void {
  const match = commander.squads.find(
    (s) => s !== squad && s.unit === squad.unit && s.formation === squad.formation,
  );
  if (!match) {
    commander.squads.push(squad);
    return;
  }
  match.count += squad.count;
  match.hp += squad.hp;
  match.starvedDays = Math.max(match.starvedDays, squad.starvedDays);
}

/**
 * Takes a commander out of the game. Deleting the key keeps the record's identity and the
 * order of the other commanders, so saves and hashes stay stable. For deaths use
 * commanderDies, which also settles the nation's prophet and pretender.
 */
export function removeCommander(state: GameState, id: CommanderId): void {
  Reflect.deleteProperty(state.commanders, id);
}

/**
 * N8: the days until a dying pretender reforms, or null when it dies for good: its chassis must
 * reform (the Ash Phoenix), and the province it dies in must hold its nation's dominion at
 * strength 1 or more.
 */
function reformDays(state: GameState, nation: NationState, c: CommanderState): number | null {
  const id = nation.pretender.chassis;
  const reform = isChassisId(id) ? chassisDef(id).reform : undefined;
  const dominion = state.provinces[c.location]?.dominion;
  if (!reform || dominion?.nation !== nation.id || dominion.strength < 1) return null;
  return reform.days;
}

/**
 * A commander dies, wherever it happens (battle, a retreat with nowhere to go, elimination). A
 * dead prophet frees the post after the cooldown; a dead pretender is gone for good, unless its
 * chassis reforms and it died in its own dominion (N8): then it returns to the capital on
 * `pretenderReturnDay` (settlePretender).
 */
export function commanderDies(state: GameState, id: CommanderId): void {
  const c = state.commanders[id];
  const nation = c?.owner === null || c === undefined ? undefined : state.nations[c.owner];
  if (nation?.prophetId === id) {
    nation.prophetId = null;
    nation.prophetAvailableDay = state.day + PROPHET.cooldownDays;
  }
  if (c && nation?.pretenderId === id) {
    nation.pretenderId = null;
    const days = reformDays(state, nation, c);
    if (days === null) {
      nation.pretenderDead = true;
    } else {
      nation.pretenderReturnDay = state.day + days;
      postMessage(state, nation.id, 'info', `${c.name} will rise again in ${days} days.`);
    }
  }
  removeCommander(state, id);
}

/** Adds a commander to the game; adept-tier mages roll their extra pip here. */
export function createCommander(
  state: GameState,
  unit: UnitTypeId,
  owner: NationId | null,
  location: ProvinceId,
): CommanderState {
  const def = unitDef(unit);
  if (!def.commander) throw new Error(`${unit} is not a commander`);
  const pips = { ...def.commander.pips };
  const extra = def.commander.extraPip;
  if (extra && chance(state.rng, extra.chance)) pips[extra.color] = (pips[extra.color] ?? 0) + 1;
  const commander: CommanderState = {
    id: newId(state, 'commander'),
    unit,
    owner,
    name: def.name,
    location,
    transit: null,
    cameFrom: null,
    hp: def.hp,
    squads: [],
    order: { kind: 'idle' },
    script: defaultScript(def, pips, def.commander.holy),
    pips,
    holy: def.commander.holy,
    carriedMana: {},
    starvedDays: 0,
  };
  state.commanders[commander.id] = commander;
  return commander;
}

/** Troops a commander leads, counted against its leadership. */
export function troopCount(commander: CommanderState): number {
  return commander.squads.reduce((sum, s) => sum + s.count, 0);
}

/** A fort's garrison holder: keeps the fort's troops, never moves, fights, or eats itself. */
export function isGarrisonHolder(commander: CommanderState): boolean {
  return unitDef(commander.unit).commander?.garrison === true;
}

/**
 * Takes part in conflict and counts for hostility: not a garrison holder (which never fights)
 * and not hidden (counting it would give it away).
 */
export function takesPart(commander: CommanderState): boolean {
  return !isGarrisonHolder(commander) && !isStealthy(commander);
}

/** Hidden from other nations: a stealthy commander leading only stealthy troops. */
export function isStealthy(commander: CommanderState): boolean {
  if (!unitDef(commander.unit).tags.includes('stealthy')) return false;
  for (const s of commander.squads) {
    if (!unitDef(s.unit).tags.includes('stealthy')) return false;
  }
  return true;
}

/** Monthly gold upkeep of one unit: goldCost / 15, half for sacred units, 0 without a cost. */
export function unitUpkeep(def: UnitDef): number {
  if (!def.cost) return 0;
  const sacred = def.tags.includes('sacred') ? ECONOMY.sacredUpkeepFactor : 1;
  return (def.cost.gold / ECONOMY.upkeepDivisor) * sacred;
}

/** Monthly upkeep of a commander and all its troops. */
export function commanderUpkeep(commander: CommanderState): number {
  let total = unitUpkeep(unitDef(commander.unit));
  for (const squad of commander.squads) total += squad.count * unitUpkeep(unitDef(squad.unit));
  return total;
}

/** Daily supply one troop eats: 3 for size 3 and up, 0 for undead and constructs, else 1. */
export function troopSupply(def: UnitDef): number {
  if (def.tags.includes('undead') || def.tags.includes('construct')) return 0;
  return def.size >= SUPPLY.bigUnitSize ? SUPPLY.bigUnitSupply : SUPPLY.troopSupply;
}

/** Daily supply a commander and its troops eat. The garrison holder eats nothing itself. */
export function commanderSupply(commander: CommanderState): number {
  const def = unitDef(commander.unit);
  let total = def.commander?.garrison ? 0 : SUPPLY.commanderSupply;
  for (const squad of commander.squads) total += squad.count * troopSupply(unitDef(squad.unit));
  return total;
}

export function commanderMaxHp(commander: CommanderState): number {
  return unitDef(commander.unit).hp;
}
