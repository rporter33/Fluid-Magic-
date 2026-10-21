// Content registry: lookups by id and a validation pass over every record
// (docs/06-architecture.md, "Content validation").
import { BUILDINGS, CAPITAL_BUILDINGS, isBuildingId } from './buildings';
import { isColor } from './colors';
import { isNationDefId, NATIONS, type NationDefId } from './nations';
import { isTerrainId } from './terrain';
import type { BuildingDef, BuildingId, NationDef, UnitDef } from './types';
import { UNIT_TAGS } from './types';
import { isUnitTypeId, UNITS, type UnitTypeId } from './units';

export { isBuildingId, isNationDefId, isUnitTypeId, type NationDefId, type UnitTypeId };

export function unitDef(id: UnitTypeId): UnitDef {
  return UNITS[id];
}

export function nationDef(id: NationDefId): NationDef {
  return NATIONS[id];
}

export function buildingDef(id: BuildingId): BuildingDef {
  return BUILDINGS[id];
}

/** Requirements a capital meets on day 1. */
const CAPITAL_PROVIDES = new Set<string>([...CAPITAL_BUILDINGS, 'capital']);

function validateUnit(key: string, u: UnitDef): string[] {
  const problems: string[] = [];
  const where = `unit ${key}`;
  if (u.id !== key) problems.push(`${where} has id ${u.id}`);
  for (const stat of ['hp', 'str', 'att', 'def', 'mr', 'mor', 'prec'] as const) {
    if (!(u[stat] > 0)) problems.push(`${where} ${stat} must be positive`);
  }
  if (u.prot < 0) problems.push(`${where} prot is negative`);
  if (!Number.isInteger(u.size) || u.size < 1 || u.size > 6) problems.push(`${where} bad size`);
  if (![0, 1, 2, 3].includes(u.mapSpeed)) problems.push(`${where} bad map speed`);
  for (const tag of u.tags) {
    if (!UNIT_TAGS.includes(tag)) problems.push(`${where} unknown tag ${tag}`);
  }
  for (const w of u.weapons) {
    const ranged = w.range !== undefined;
    if (ranged !== (w.ammo !== undefined)) problems.push(`${where} ${w.name} range without ammo`);
    if (w.dmg < 0) problems.push(`${where} ${w.name} negative damage`);
  }
  if (u.cost !== null) {
    if (u.recruitDays <= 0) problems.push(`${where} is recruitable but takes no time`);
    if (!u.requires.includes('fort')) problems.push(`${where} is recruitable without a fort`);
  } else if (u.recruitDays !== 0 || u.requires.length > 0) {
    problems.push(`${where} is not recruitable but has recruit data`);
  }
  if (u.commander) {
    if (!(u.commander.leadership >= 0)) problems.push(`${where} bad leadership`);
    for (const [color, pips] of Object.entries(u.commander.pips)) {
      if (!isColor(color) || !Number.isInteger(pips) || pips < 1 || pips > 6) {
        problems.push(`${where} bad pips ${color}${String(pips)}`);
      }
    }
    if (u.commander.holy < 0 || u.commander.holy > 3) problems.push(`${where} bad holy`);
  }
  return problems;
}

function validateNation(key: string, n: NationDef): string[] {
  const problems: string[] = [];
  const where = `nation ${key}`;
  if (n.id !== key) problems.push(`${where} has id ${n.id}`);
  if (!n.colors.every(isColor) || new Set(n.colors).size !== n.colors.length) {
    problems.push(`${where} bad color identity`);
  }
  if (n.homeTerrain && (!isTerrainId(n.homeTerrain.terrain) || n.homeTerrain.def < 0)) {
    problems.push(`${where} bad home terrain`);
  }
  if (!isTerrainId(n.capitalTerrain)) problems.push(`${where} bad capital terrain`);
  const unit = (id: string): UnitDef | undefined => (isUnitTypeId(id) ? UNITS[id] : undefined);
  for (const id of n.troops) {
    const u = unit(id);
    if (!u) problems.push(`${where} troop ${id} does not exist`);
    else if (u.commander || u.cost === null) problems.push(`${where} troop ${id} not a troop`);
    else if (u.requires.some((r) => !CAPITAL_PROVIDES.has(r))) {
      problems.push(`${where} troop ${id} cannot be recruited on day 1`);
    }
  }
  for (const id of n.commanders) {
    const u = unit(id);
    if (!u?.commander || u.cost === null) problems.push(`${where} commander ${id} invalid`);
    else if (u.requires.some((r) => !CAPITAL_PROVIDES.has(r))) {
      problems.push(`${where} commander ${id} cannot be recruited on day 1`);
    }
  }
  for (const id of [n.pd.militia, n.pd.archer]) {
    if (!n.troops.includes(id)) problems.push(`${where} PD unit ${id} is not one of its troops`);
  }
  for (const start of n.startingArmy) {
    const leader = unit(start.commander);
    if (!leader?.commander) problems.push(`${where} starting commander ${start.commander}`);
    const troops = start.squads.reduce((sum, s) => sum + s.count, 0);
    if (leader?.commander && troops > leader.commander.leadership) {
      problems.push(`${where} ${start.commander} leads more than its leadership`);
    }
    for (const s of start.squads) {
      if (!unit(s.unit) || unit(s.unit)?.commander) problems.push(`${where} squad ${s.unit}`);
      if (!Number.isInteger(s.count) || s.count < 1) problems.push(`${where} squad count`);
    }
  }
  const { color, level } = n.startingResearch;
  if (!isColor(color) || !Number.isInteger(level) || level < 0 || level > 6) {
    problems.push(`${where} bad starting research`);
  }
  for (const [k, v] of Object.entries(n.ai)) {
    if (!(v >= 0 && v <= 1)) problems.push(`${where} AI ${k} outside 0..1`);
  }
  return problems;
}

/** Every problem found in the content; empty when all records are consistent. */
export function validateContent(): string[] {
  const problems: string[] = [];
  for (const [key, u] of Object.entries(UNITS)) problems.push(...validateUnit(key, u));
  for (const [key, n] of Object.entries(NATIONS)) {
    if (!isNationDefId(key)) problems.push(`nation key ${key}`);
    problems.push(...validateNation(key, n));
  }
  for (const [key, b] of Object.entries(BUILDINGS)) {
    if (b.id !== key) problems.push(`building ${key} has id ${b.id}`);
    if (b.gold < 0 || b.materials < 0 || b.days < 1) problems.push(`building ${key} bad cost`);
  }
  return problems;
}
