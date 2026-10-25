// The pretender (docs/05-pretender.md): what a design costs, whether it is valid, and when the
// pretender stands on the map. Prices take the nation's definition, so the pretender screen can
// use them before a game exists.
import { unitDef } from '../content';
import { COLORS, isColor, type Color } from '../content/colors';
import { CHASSIS, isChassisId, type ChassisDef } from '../content/pretenders/chassis';
import { AWAKENING, PRETENDER_COSTS } from '../content/pretenders/costs';
import {
  SCALE_AXES,
  SCALE_DEFS,
  SCALE_MAX,
  SCALE_MIN,
  type ScaleAxis,
} from '../content/pretenders/scales';
import { AWAKENINGS, type Awakening, type PretenderDesign } from '../content/pretenders/types';
import { DOMINION, MAX_PIPS } from '../content/rules';
import type { NationDef } from '../content/types';
import {
  addSquad,
  createCommander,
  defaultScript,
  isGarrisonHolder,
  removeCommander,
} from './commanders';
import type { NationId } from './ids';
import { postMessage } from './messages';
import { getMapProvince, getNation, getProvince } from './state';
import type { GameState, Pips } from './types';

/** The pips a chassis gives for free, for this nation. */
export function basePips(def: NationDef, chassis: ChassisDef): Pips {
  const base = chassis.basePips;
  if (!base) return {};
  return { [base.color === 'nation' ? def.colors[0] : base.color]: base.count };
}

/** Design points for reaching pip `level` (1 to MAX_PIPS) in a color. */
export function pipStepCost(
  def: NationDef,
  chassis: ChassisDef,
  color: Color,
  level: number,
): number {
  const listed = PRETENDER_COSTS.pipLevel[level - 1] ?? Infinity;
  const first =
    level === 1 && !def.colors.includes(color) ? PRETENDER_COSTS.newColorFirstPip : listed;
  return first - chassis.pipDiscount;
}

/** Design points for one scale step toward a pole: cheap toward the nation's own colors. */
export function scaleStepCost(
  def: NationDef,
  axis: ScaleAxis,
  toward: 'positive' | 'negative',
): number {
  const pole = SCALE_DEFS[axis][toward];
  return def.colors.includes(pole.color)
    ? PRETENDER_COSTS.scaleStep.own
    : PRETENDER_COSTS.scaleStep.other;
}

/** What a design costs in points: chassis, pips beyond the base, dominion above it, scales. */
export function designCost(def: NationDef, design: PretenderDesign): number {
  if (!isChassisId(design.chassis)) return Infinity;
  const chassis = CHASSIS[design.chassis];
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
    total += Math.abs(steps) * scaleStepCost(def, axis, toward);
  }
  return total;
}

/** Points a design may spend: the budget plus the awakening refund. */
export function designBudget(awakening: Awakening): number {
  return PRETENDER_COSTS.budget + AWAKENING[awakening].refund;
}

/** Why a design is not allowed for this nation, or null. */
export function validatePretender(def: NationDef, design: PretenderDesign): string | null {
  if (!isChassisId(design.chassis)) return `Unknown chassis ${design.chassis}`;
  const chassis = CHASSIS[design.chassis];
  if (!AWAKENINGS.includes(design.awakening)) return 'Unknown awakening';
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
  const cost = designCost(def, design);
  const budget = designBudget(design.awakening);
  if (cost > budget) return `The design costs ${String(cost)} of ${String(budget)} points`;
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
 * capital; it leaves the map while the nation is Godless; a dead pretender never returns.
 */
export function settlePretender(state: GameState, nationId: NationId): void {
  const nation = getNation(state, nationId);
  if (nation.eliminated || nation.pretenderDead) return;
  if (nation.godless) {
    if (nation.pretenderId !== null) recall(state, nationId);
    return;
  }
  if (nation.pretenderId !== null) return;
  const design = nation.pretender;
  if (state.day < AWAKENING[design.awakening].arrivalDay) return;
  if (getProvince(state, nation.capital).owner !== nationId || !isChassisId(design.chassis)) return;
  const body = CHASSIS[design.chassis].body;
  const pretender = createCommander(state, body, nationId, nation.capital);
  pretender.pips = { ...design.pips };
  pretender.script = defaultScript(unitDef(body), pretender.pips, pretender.holy);
  nation.pretenderId = pretender.id;
  const where = getMapProvince(state, nation.capital).name;
  postMessage(state, nationId, 'info', `${pretender.name} stands in ${where}.`, nation.capital);
}

/** The chassis of a nation's pretender. */
export function chassisOf(state: GameState, nationId: NationId): ChassisDef | null {
  const id = getNation(state, nationId).pretender.chassis;
  return isChassisId(id) ? CHASSIS[id] : null;
}
