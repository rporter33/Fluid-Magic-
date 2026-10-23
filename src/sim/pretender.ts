// The pretender (docs/05-pretender.md): which chassis a nation may take, what a design costs,
// whether it is valid, and when the pretender stands on the map. Prices take the nation's
// definition, so the pretender screen can use them before a game exists.
import { unitDef, type UnitTypeId } from '../content';
import { COLORS, isColor, type Color } from '../content/colors';
import { BOONS, isBoonId } from '../content/pretenders/boons';
import { CHASSIS, chassisDef, isChassisId, type ChassisDef } from '../content/pretenders/chassis';
import { AWAKENING, PRETENDER_COSTS } from '../content/pretenders/costs';
import {
  SCALE_AXES,
  SCALE_DEFS,
  SCALE_MAX,
  SCALE_MIN,
  type ScaleAxis,
} from '../content/pretenders/scales';
import { AWAKENINGS, type Awakening, type PretenderDesign } from '../content/pretenders/types';
import { DOMINION, MAX_PIPS, PRETENDER_NAME, TIME } from '../content/rules';
import type { NationDef } from '../content/types';
import { blessingProblem } from './bless';
import {
  addSquad,
  createCommander,
  createSquad,
  defaultScript,
  isGarrisonHolder,
  removeCommander,
  troopCount,
} from './commanders';
import type { NationId } from './ids';
import { postMessage } from './messages';
import { getMapProvince, getNation, getProvince } from './state';
import type { GameState, Pips } from './types';

/** D1: a chassis is offered to every nation (generic) or to nations of its realm's color. */
export function offersChassis(def: NationDef, chassis: ChassisDef): boolean {
  return chassis.realm === 'generic' || def.colors.includes(chassis.realm);
}

/** The chassis a nation may take: the generic ones and those of its colors, in content order. */
export function availableChassis(def: NationDef): ChassisDef[] {
  const all: ChassisDef[] = Object.values(CHASSIS);
  return all.filter((c) => offersChassis(def, c));
}

/** The pips a chassis gives for free, for this nation. */
export function basePips(def: NationDef, chassis: ChassisDef): Pips {
  const base = chassis.basePips;
  if (!base) return {};
  return { [base.color === 'nation' ? def.colors[0] : base.color]: base.count };
}

/**
 * Design points for reaching pip `level` (1 to MAX_PIPS) in a color. The first pip of a color
 * outside the nation's identity costs the chassis's new-color price (D2); the chassis's
 * discount comes off every step.
 */
export function pipStepCost(
  def: NationDef,
  chassis: ChassisDef,
  color: Color,
  level: number,
): number {
  const listed = PRETENDER_COSTS.pipLevel[level - 1] ?? Infinity;
  const first = level === 1 && !def.colors.includes(color) ? chassis.newColorFirstPip : listed;
  return first - chassis.pipDiscount;
}

/**
 * Design points for one scale step toward a pole: cheap toward the nation's own colors and
 * toward a pole the chassis is attuned to (D3).
 */
export function scaleStepCost(
  def: NationDef,
  chassis: ChassisDef,
  axis: ScaleAxis,
  toward: 'positive' | 'negative',
): number {
  const pole = SCALE_DEFS[axis][toward];
  const attuned = (chassis.attunement ?? []).some((a) => a.axis === axis && a.toward === toward);
  return attuned || def.colors.includes(pole.color)
    ? PRETENDER_COSTS.scaleStep.own
    : PRETENDER_COSTS.scaleStep.other;
}

/** What a design's boons cost in points; an unknown boon costs Infinity. */
function boonsCost(design: PretenderDesign): number {
  let total = 0;
  for (const boon of design.boons ?? [])
    total += isBoonId(boon.id) ? BOONS[boon.id].cost : Infinity;
  return total;
}

/**
 * What a design costs in points: chassis, pips beyond the base, dominion above it, scales, and
 * boons. Blessings cost bless points, not design points.
 */
export function designCost(def: NationDef, design: PretenderDesign): number {
  if (!isChassisId(design.chassis)) return Infinity;
  const chassis = chassisDef(design.chassis);
  const free = basePips(def, chassis);
  let total = chassis.cost;
  for (const color of COLORS) {
    for (let level = (free[color] ?? 0) + 1; level <= (design.pips[color] ?? 0); level++) {
      total += pipStepCost(def, chassis, color, level);
    }
  }
  total += Math.max(0, design.dominion - chassis.baseDominion) * PRETENDER_COSTS.dominionPoint;
  for (const axis of SCALE_AXES) {
    const steps = design.scales[axis];
    const toward = steps > 0 ? 'positive' : 'negative';
    total += Math.abs(steps) * scaleStepCost(def, chassis, axis, toward);
  }
  return total + boonsCost(design);
}

/** Points a design may spend: the budget plus the awakening refund. */
export function designBudget(awakening: Awakening): number {
  return PRETENDER_COSTS.budget + AWAKENING[awakening].refund;
}

/** The god fights blessed in its own dominion: the Avatar boon, or a chassis with it built in. */
export function hasAvatar(design: PretenderDesign): boolean {
  const builtIn = isChassisId(design.chassis) && chassisDef(design.chassis).avatar === true;
  return builtIn || (design.boons ?? []).some((b) => b.id === 'avatar');
}

/**
 * The springs a design adds to its capital at game creation (D5): the chassis's, then each
 * Sacred Spring's.
 */
export function startingSprings(def: NationDef, design: PretenderDesign): Color[] {
  const springs: Color[] = [];
  const own = isChassisId(design.chassis) ? chassisDef(design.chassis).startSprings : undefined;
  if (own) {
    const color = own.color === 'nation' ? def.colors[0] : own.color;
    for (let i = 0; i < own.count; i++) springs.push(color);
  }
  for (const boon of design.boons ?? []) {
    if (boon.id === 'sacredSpring') springs.push(boon.color);
  }
  return springs;
}

/** Why the design's boons are not allowed, or null. */
function boonProblem(chassis: ChassisDef, design: PretenderDesign): string | null {
  const seen = new Set<string>();
  for (const boon of design.boons ?? []) {
    if (!isBoonId(boon.id)) return `Unknown boon ${String(boon.id)}`;
    const name = BOONS[boon.id].name;
    if (seen.has(boon.id)) return `${name} is chosen twice`;
    seen.add(boon.id);
    if (
      boon.id === 'sacredSpring' &&
      (!isColor(boon.color) || (design.pips[boon.color] ?? 0) < 1)
    ) {
      return 'A Sacred Spring needs a pip in its color';
    }
    if (boon.id === 'avatar' && chassis.avatar) return `${chassis.name} already has Avatar`;
  }
  return null;
}

/** Why a design is not allowed for this nation, or null; the first problem only. */
export function validatePretender(def: NationDef, design: PretenderDesign): string | null {
  if (!isChassisId(design.chassis)) return `Unknown chassis ${design.chassis}`;
  const chassis = chassisDef(design.chassis);
  if (!offersChassis(def, chassis)) return `${chassis.name} is not offered to ${def.name}`;
  if (!AWAKENINGS.includes(design.awakening)) return 'Unknown awakening';
  const least = chassis.minAwakening;
  if (least && AWAKENINGS.indexOf(design.awakening) < AWAKENINGS.indexOf(least)) {
    return `${chassis.name} must start at least ${least}`;
  }
  const free = basePips(def, chassis);
  for (const [color, count] of Object.entries(design.pips)) {
    if (!isColor(color) || !Number.isInteger(count) || count < 0 || count > MAX_PIPS) {
      return `Pips must be 0 to ${String(MAX_PIPS)} per color`;
    }
  }
  for (const color of COLORS) {
    if ((design.pips[color] ?? 0) < (free[color] ?? 0)) {
      return `${chassis.name} comes with ${String(free[color])} ${color} pips`;
    }
  }
  const d = design.dominion;
  if (!Number.isInteger(d) || d < chassis.baseDominion || d > DOMINION.max) {
    return `Dominion must be ${String(chassis.baseDominion)} to ${String(DOMINION.max)}`;
  }
  for (const axis of SCALE_AXES) {
    const v = design.scales[axis];
    if (!Number.isInteger(v) || v < SCALE_MIN || v > SCALE_MAX) {
      return `Scales run from ${String(SCALE_MIN)} to ${String(SCALE_MAX)}`;
    }
  }
  const problem = blessingProblem(design) ?? boonProblem(chassis, design);
  if (problem !== null) return problem;
  const cost = designCost(def, design);
  const budget = designBudget(design.awakening);
  if (cost > budget) return `The design costs ${String(cost)} of ${String(budget)} points`;
  return null;
}

/**
 * Why a name cannot be the god's (D7), or null: 1 to 24 symbols of the identity alphabet
 * (Latin letters, space, apostrophe, hyphen, period), starting with a letter, not ending in a
 * space, and with no two spaces in a row.
 */
export function validatePretenderName(name: string): string | null {
  const { maxLength, symbols } = PRETENDER_NAME;
  // The alphabet first: every symbol it holds is one UTF-16 unit, so after it name.length
  // counts symbols, and a name in another script is told so rather than its length.
  for (const ch of name) {
    if (!symbols.includes(ch)) {
      return "A god's name may use only Latin letters, spaces, apostrophes, hyphens and periods";
    }
  }
  if (name.length < 1 || name.length > maxLength) {
    const what = 'symbols (letters, spaces, apostrophes, hyphens, periods)';
    return `A god's name has 1 to ${String(maxLength)} ${what}`;
  }
  // Only Latin letters pass the alphabet and change case.
  const first = name.charAt(0);
  if (first.toLowerCase() === first.toUpperCase()) return "A god's name must start with a letter";
  if (name.endsWith(' ')) return "A god's name may not end with a space";
  if (name.includes('  ')) return "A god's name may not hold two spaces in a row";
  return null;
}

/**
 * Takes the pretender off the map (Godless recall): its troops join another of its nation's
 * commanders there, else the fort's garrison holder, else they are lost.
 */
function recall(state: GameState, nationId: NationId): void {
  const nation = getNation(state, nationId);
  const id = nation.pretenderId;
  const pretender = id === null ? undefined : state.commanders[id];
  nation.pretenderId = null;
  if (!pretender) return;
  const heir =
    Object.values(state.commanders).find(
      (c) =>
        c !== pretender &&
        c.owner === nationId &&
        c.location === pretender.location &&
        !isGarrisonHolder(c),
    ) ??
    Object.values(state.commanders).find(
      (c) => c.location === pretender.location && c.owner === nationId && isGarrisonHolder(c),
    );
  if (heir) for (const s of pretender.squads) addSquad(heir, s);
  removeCommander(state, pretender.id);
  postMessage(state, nationId, 'info', `${pretender.name} is recalled: the nation is godless.`);
}

/**
 * Puts the pretender where it belongs today (tick step 3, and createGame): it arrives at the
 * capital on its awakening day and returns there after Godless ends, if the nation holds its
 * capital; it leaves the map while the nation is Godless; a dead pretender never returns. A
 * reforming one (N8) waits until its return day, then rises at the capital by the same rules:
 * a fresh commander with full HP, the design's pips, the default script and the god's name.
 */
export function settlePretender(state: GameState, nationId: NationId): void {
  const nation = getNation(state, nationId);
  if (nation.eliminated || nation.pretenderDead) return;
  if (nation.godless) {
    if (nation.pretenderId !== null) recall(state, nationId);
    return;
  }
  if (nation.pretenderId !== null) return;
  const returning = nation.pretenderReturnDay;
  if (returning !== null && state.day < returning) return;
  const design = nation.pretender;
  if (state.day < AWAKENING[design.awakening].arrivalDay) return;
  if (getProvince(state, nation.capital).owner !== nationId || !isChassisId(design.chassis)) return;
  const body = CHASSIS[design.chassis].body;
  const pretender = createCommander(state, body, nationId, nation.capital);
  if (nation.pretenderName !== null) pretender.name = nation.pretenderName;
  pretender.pips = { ...design.pips };
  pretender.script = defaultScript(unitDef(body), pretender.pips, pretender.holy);
  nation.pretenderId = pretender.id;
  const where = getMapProvince(state, nation.capital).name;
  if (returning === null) {
    postMessage(state, nationId, 'info', `${pretender.name} stands in ${where}.`, nation.capital);
    return;
  }
  nation.pretenderReturnDay = null;
  postMessage(
    state,
    nationId,
    'info',
    `${pretender.name} rises again in ${where}.`,
    nation.capital,
  );
}

/** The nation's living troops of a unit, under every commander it owns, garrisons included. */
export function nationStock(state: GameState, nationId: NationId, unit: UnitTypeId): number {
  let stock = 0;
  for (const c of Object.values(state.commanders)) {
    if (c.owner !== nationId) continue;
    for (const s of c.squads) if (s.unit === unit) stock += s.count;
  }
  return stock;
}

/** What one troop of a unit is called in a message about more than one. */
function pluralName(unit: UnitTypeId): string {
  const def = unitDef(unit);
  return def.plural ?? `${def.name}s`;
}

/**
 * N7, tick step 3 on the first day of each month (day 30, 60, ...; never day 0): a pretender
 * whose chassis summons monthly gains its troops, in nation id order. It must stand (not in
 * transit) in a province its nation dominates at strength 1 or more. The count is bounded by the
 * nation's cap less its living troops of the unit from every source, and by the pretender's free
 * leadership. No rng is drawn: createSquad draws only an id.
 */
export function monthlySummons(state: GameState): void {
  if (state.day === 0 || state.day % TIME.daysPerMonth !== 0) return;
  for (const nationId of Object.keys(state.nations) as NationId[]) {
    const nation = getNation(state, nationId);
    const id = nation.pretenderId;
    const p = id === null ? undefined : state.commanders[id];
    const summon = chassisOf(state, nationId)?.monthlySummon;
    if (nation.eliminated || !p || !summon || p.transit !== null) continue;
    const dominion = getProvince(state, p.location).dominion;
    if (dominion.nation !== nationId || dominion.strength < 1) continue;
    const leadership = unitDef(p.unit).commander?.leadership ?? 0;
    const n = Math.min(
      summon.count,
      summon.cap - nationStock(state, nationId, summon.unit),
      leadership - troopCount(p),
    );
    if (n <= 0) continue;
    addSquad(p, createSquad(state, summon.unit, n));
    const what = n === 1 ? unitDef(summon.unit).name : pluralName(summon.unit);
    const verb = n === 1 ? 'joins' : 'join';
    postMessage(state, nationId, 'info', `${n} ${what} ${verb} ${p.name}.`, p.location);
  }
}

/** The chassis of a nation's pretender. */
export function chassisOf(state: GameState, nationId: NationId): ChassisDef | null {
  const id = getNation(state, nationId).pretender.chassis;
  return isChassisId(id) ? chassisDef(id) : null;
}

/**
 * What a nation's god is called while no commander carries the name (reforming, or gone): the
 * name its player gave it (D7), else its chassis body's, as settlePretender names it.
 */
export function godName(state: GameState, nationId: NationId): string {
  const nation = getNation(state, nationId);
  const chassis = chassisOf(state, nationId);
  return nation.pretenderName ?? (chassis ? unitDef(chassis.body).name : nation.pretender.chassis);
}
