// Content registry: lookups by id and a validation pass over every record
// (docs/06-architecture.md, "Content validation").
import { ABILITIES, type AbilityDef } from './abilities';
import { AI, DIFFICULTIES } from './ai';
import { BUILDINGS, CAPITAL_BUILDINGS, isBuildingId } from './buildings';
import { isColor } from './colors';
import { isNationDefId, NATIONS, type NationDefId } from './nations';
import { BLESSINGS } from './pretenders/blessings';
import { CHASSIS, isChassisId } from './pretenders/chassis';
import { PRETENDER_COSTS } from './pretenders/costs';
import { PRESETS } from './pretenders/presets';
import {
  validateBlessing,
  validateBlessingTiers,
  validateBoons,
  validateChassis,
} from './pretenders/validate';
import { DOMINION, MAX_PIPS, PD, RECRUITMENT, UNREST } from './rules';
import { isSpellId, SPELLS } from './spells';
import { validateSpell } from './spells/validate';
import { isTerrainId } from './terrain';
import { unitAbilityProblems, validateAbility, validateCatalog } from './validateAbilities';
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

/** N2: the most swings a multi-strike weapon makes per troop per melee phase. */
const MAX_STRIKES = 4;

const whole = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;

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
    // N2: strikes and a size limit belong to melee weapons only.
    if (w.strikes !== undefined && (ranged || !whole(w.strikes, 1, MAX_STRIKES))) {
      problems.push(`${where} ${w.name} bad strikes`);
    }
    if (w.maxTargetSize !== undefined && (ranged || !whole(w.maxTargetSize, 1, 6))) {
      problems.push(`${where} ${w.name} bad target size limit`);
    }
  }
  if (u.fireShield !== undefined && !whole(u.fireShield, 1, Infinity)) {
    problems.push(`${where} bad fire shield`);
  }
  if (u.spellPower !== undefined && (!u.commander || !whole(u.spellPower, 0, Infinity))) {
    problems.push(`${where} spell power belongs to commanders, as a whole number`);
  }
  problems.push(...unitAbilityProblems(where, u));
  if (u.cost !== null) {
    if (u.recruitDays <= 0) problems.push(`${where} is recruitable but takes no time`);
    if (!u.requires.includes('fort')) problems.push(`${where} is recruitable without a fort`);
  } else if (u.recruitDays !== 0 || u.requires.length > 0) {
    problems.push(`${where} is not recruitable but has recruit data`);
  }
  if (u.commander) {
    if (!(u.commander.leadership >= 0)) problems.push(`${where} bad leadership`);
    for (const [color, pips] of Object.entries(u.commander.pips)) {
      if (!isColor(color) || !Number.isInteger(pips) || pips < 1 || pips > MAX_PIPS) {
        problems.push(`${where} bad pips ${color}${String(pips)}`);
      }
    }
    if (u.commander.holy < 0 || u.commander.holy > 3) problems.push(`${where} bad holy`);
    const spell = u.commander.defaultSpell;
    if (spell !== undefined && (!isSpellId(spell) || SPELLS[spell].kind !== 'battle')) {
      problems.push(`${where} default spell ${spell} is not a battle spell`);
    }
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
  if (!n.chassis.every(isChassisId) || n.chassis[0] === n.chassis[1]) {
    problems.push(`${where} needs two different chassis`);
  }
  for (const id of n.chassis) {
    const realm = isChassisId(id) ? CHASSIS[id].realm : 'generic';
    if (realm !== 'generic' && !n.colors.includes(realm)) {
      problems.push(`${where} fits chassis ${id} outside its realm`);
    }
  }
  if (PRESETS.filter((p) => p.nation === key).length !== 3) {
    problems.push(`${where} needs three presets`);
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

/** Every number of a record of numbers, nested records flattened to dotted keys. */
function numberLeaves(record: object, prefix = ''): [string, unknown][] {
  return Object.entries(record as Record<string, unknown>).flatMap(
    ([key, value]): [string, unknown][] =>
      typeof value === 'object' && value !== null
        ? numberLeaves(value, `${prefix}${key}.`)
        : [[`${prefix}${key}`, value]],
  );
}

/** AI numbers that count things (troops, levels, days, hops, commanders) are whole. */
const WHOLE_AI_NUMBERS: ReadonlySet<string> = new Set([
  'leaderLeadership',
  'batch.large',
  'batch.small',
  'queue.min',
  'queue.max',
  'provincesPerLeader',
  'baseLeaders',
  'provincesPerMage',
  'minMages',
  'provincesPerPriest',
  'scouts',
  'fieldArmyTroops',
  'capitalGarrison',
  'threatHops',
  'warHops',
  'independentStrength',
  'pd.border',
  'pd.enemy',
  'wellspringPd',
  'pretenderJoinDay',
  'battleMagesPerArmy',
  'carriedMana',
  'godlessAlarm',
]);

/** The AI's numbers and difficulty levels (docs/08-ai.md): positive, and sane together. */
function validateAi(): string[] {
  const problems: string[] = [];
  for (const [key, value] of numberLeaves(AI)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      problems.push(`AI ${key} must be a positive number`);
    } else if (WHOLE_AI_NUMBERS.has(key) && !Number.isInteger(value)) {
      problems.push(`AI ${key} must be whole`);
    }
  }
  if (AI.batch.small > AI.batch.large || AI.batch.large > RECRUITMENT.maxBatch) {
    problems.push('AI batches must be small <= large <= the largest recruit order');
  }
  if (AI.queue.min > AI.queue.max) problems.push('AI queue min must not exceed max');
  if (AI.fieldArmyTroops > AI.leaderLeadership) {
    problems.push('AI field armies must fit under one leader');
  }
  for (const key of ['expansionRatio', 'warRatio', 'reliefRatio', 'stormRatio'] as const) {
    if (AI[key] < 1) problems.push(`AI ${key} must be at least 1`);
  }
  if (AI.ritualCostFactor < 1) problems.push('AI ritualCostFactor must be at least 1');
  if (AI.rangedBonus >= 1 || AI.distancePenalty >= 1) {
    problems.push('AI rangedBonus and distancePenalty must be below 1');
  }
  if (AI.pd.border > AI.pd.enemy || Math.max(AI.pd.enemy, AI.wellspringPd) > PD.maxLevel) {
    problems.push('AI PD levels must be border <= enemy, all within the PD maximum');
  }
  if (AI.godlessAlarm < DOMINION.min || AI.godlessAlarm > DOMINION.max) {
    problems.push('AI godlessAlarm must be a dominion strength');
  }
  if (AI.taxHighMaxUnrest > UNREST.max) problems.push('AI taxHighMaxUnrest above the unrest cap');
  for (const [key, d] of Object.entries(DIFFICULTIES)) {
    if (!(d.incomeFactor > 0) || !Number.isInteger(d.planEveryDays) || d.planEveryDays < 1) {
      problems.push(`difficulty ${key} bad income or planning interval`);
    }
    if (!Number.isInteger(d.warFromMonth) || d.warFromMonth < 0) {
      problems.push(`difficulty ${key} bad war month`);
    }
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
  for (const [key, spell] of Object.entries(SPELLS)) problems.push(...validateSpell(key, spell));
  const abilities: [string, AbilityDef][] = Object.entries(ABILITIES);
  for (const [key, a] of abilities) problems.push(...validateAbility(key, a));
  problems.push(...validateCatalog());
  for (const [key, c] of Object.entries(CHASSIS)) problems.push(...validateChassis(key, c));
  for (const [key, bl] of Object.entries(BLESSINGS)) problems.push(...validateBlessing(key, bl));
  problems.push(...validateBlessingTiers(), ...validateBoons());
  if (PRETENDER_COSTS.pipLevel.length !== MAX_PIPS) {
    problems.push(`pip level costs must price levels 1 to ${String(MAX_PIPS)}`);
  }
  for (const preset of PRESETS) {
    if (!isNationDefId(preset.nation)) problems.push(`preset ${preset.id} nation`);
    if (!isChassisId(preset.design.chassis)) problems.push(`preset ${preset.id} chassis`);
  }
  if (new Set(PRESETS.map((p) => p.id)).size !== PRESETS.length) problems.push('preset ids repeat');
  problems.push(...validateAi());
  return problems;
}
