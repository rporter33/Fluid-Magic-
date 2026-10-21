// Creating commanders and squads, and per-unit numbers the economy needs.
import { unitDef, type UnitTypeId } from '../content';
import { ECONOMY, SCRIPT_SLOTS, SUPPLY } from '../content/rules';
import type { UnitDef } from '../content/types';
import { newId, type NationId, type ProvinceId } from './ids';
import { chance } from './rng';
import type { CommanderState, Formation, GameState, ScriptSlot, Squad } from './types';

/** Squads with a ranged weapon stand in the middle row, everyone else in front. */
export function defaultFormation(def: UnitDef): Formation {
  return def.weapons.some((w) => w.range !== undefined) ? 'middle' : 'front';
}

/** docs/04-battle.md: mages and priests cast (their best castable spell), others hold. */
export function defaultScript(def: UnitDef): ScriptSlot[] {
  const caster =
    Object.keys(def.commander?.pips ?? {}).length > 0 || (def.commander?.holy ?? 0) > 0;
  const slot: ScriptSlot = caster ? { kind: 'cast', spellId: null } : { kind: 'hold' };
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
    script: defaultScript(def),
    pips,
    holy: def.commander.holy,
    carriedMana: {},
    starvedDays: 0,
  };
  state.commanders[commander.id] = commander;
  return commander;
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
