// Recruitment at forts (docs/01-core-rules.md section 8). Gold and materials are paid when an
// item is queued, population when it completes. One item is worked on at a time per fort.
// Completed troops join the fort's garrison holder; completed commanders stand in the fort.
import { nationDef, unitDef, type UnitTypeId } from '../content';
import { RECRUITMENT, UNREST } from '../content/rules';
import { addSquad, createCommander, createSquad, removeCommander } from './commanders';
import type { NationId, ProvinceId } from './ids';
import { postMessage } from './messages';
import { provinceScales, scaleEffect } from './scales';
import { getMapProvince, getNation, getProvince, wholeDays } from './state';
import type { CommanderState, GameState, ProvinceState } from './types';

/** Gold for a batch here; beasts get cheaper with the province's Wild scale. */
export function recruitGold(
  state: GameState,
  provinceId: ProvinceId,
  unit: UnitTypeId,
  count: number,
): number {
  const def = unitDef(unit);
  if (!def.cost) return 0;
  const beast = def.tags.includes('beast')
    ? Math.max(0, 1 + scaleEffect(provinceScales(state, provinceId), 'beastCostPct'))
    : 1;
  return def.cost.gold * count * beast;
}

export function recruitMaterials(unit: UnitTypeId, count: number): number {
  return (unitDef(unit).cost?.materials ?? 0) * count;
}

export function recruitPop(unit: UnitTypeId, count: number): number {
  return (unitDef(unit).cost?.pop ?? 0) * count;
}

/**
 * Days for a batch here: troops take recruitDays per started 10, commanders recruitDays;
 * scaled by the province's recruit and build time effects (Order and Wild slower, Turmoil
 * and Artifice faster).
 */
export function recruitDays(
  state: GameState,
  provinceId: ProvinceId,
  unit: UnitTypeId,
  count: number,
): number {
  const def = unitDef(unit);
  const batches = def.commander ? 1 : Math.ceil(count / RECRUITMENT.batchSize);
  const scales = provinceScales(state, provinceId);
  // docs/01 section 8 calls recruit time "build time", so Wild and Artifice apply too.
  const pct = scaleEffect(scales, 'recruitTimePct') + scaleEffect(scales, 'buildTimePct');
  const days = wholeDays(def.recruitDays * batches * Math.max(0, 1 + pct));
  return Math.max(RECRUITMENT.minDays, days);
}

/** Why a fort cannot recruit or progress its queue right now, or null. */
export function recruitBlock(province: ProvinceState): string | null {
  if (province.siege !== null) return 'the fort is besieged';
  if (province.unrest > UNREST.recruitBlockAbove) {
    return `unrest is above ${UNREST.recruitBlockAbove}`;
  }
  return null;
}

/** Whether a nation may recruit a unit type here, ignoring costs; null when it may. */
export function recruitRequirementError(
  state: GameState,
  nation: NationId,
  provinceId: ProvinceId,
  unit: UnitTypeId,
): string | null {
  const n = getNation(state, nation);
  const def = nationDef(n.def);
  const u = unitDef(unit);
  if (!u.cost || !(def.troops.includes(unit) || def.commanders.includes(unit))) {
    return `${n.name} cannot recruit ${u.name}`;
  }
  const p = getProvince(state, provinceId);
  for (const need of u.requires) {
    const met = need === 'capital' ? provinceId === n.capital : p.buildings.includes(need);
    if (!met) return `${u.name} needs ${need === 'capital' ? 'the capital' : `a ${need}`}`;
  }
  return null;
}

/**
 * The fort's garrison holder. Every fort has exactly one, owned by the fort's owner and
 * standing there (createGame sets this up; replaceGarrison keeps it when a fort changes
 * hands), so a missing or foreign holder is a bug and throws.
 */
export function garrisonOf(state: GameState, provinceId: ProvinceId): CommanderState {
  const p = getProvince(state, provinceId);
  const holder = p.garrison === null ? undefined : state.commanders[p.garrison];
  if (!holder || holder.owner !== p.owner || holder.location !== p.id) {
    throw new Error(`fort ${provinceId} has no garrison holder of its owner`);
  }
  return holder;
}

/**
 * Gives a fort that changed hands (Phase 4 captures) a holder for its new owner. The old
 * holder is removed with any troops it still keeps.
 */
export function replaceGarrison(state: GameState, provinceId: ProvinceId): void {
  const p = getProvince(state, provinceId);
  if (p.garrison !== null) removeCommander(state, p.garrison);
  p.garrison =
    p.owner !== null && p.buildings.includes('fort')
      ? createCommander(state, 'garrison', p.owner, provinceId).id
      : null;
}

/** Turns a finished queue item into troops or a commander. */
function complete(
  state: GameState,
  p: ProvinceState,
  owner: NationId,
  unit: UnitTypeId,
  count: number,
): void {
  const def = unitDef(unit);
  p.pop -= recruitPop(unit, count);
  if (def.commander) {
    createCommander(state, unit, owner, p.id);
  } else {
    addSquad(garrisonOf(state, p.id), createSquad(state, unit, count));
  }
  const what = def.commander ? def.name : `${count} ${def.name}`;
  postMessage(
    state,
    owner,
    'recruited',
    `${what} recruited in ${getMapProvince(state, p.id).name}.`,
    p.id,
  );
}

/**
 * Advances every fort's queue a day (tick step 3). Items queued by a nation that no longer
 * owns the fort are dropped. A blocked fort (siege, unrest) makes no progress. The head item
 * counts down and, at zero, completes once the province has its population.
 */
export function progressRecruitment(state: GameState): void {
  for (const p of Object.values(state.provinces)) {
    if (p.recruitQueue.length === 0) continue;
    const owner = p.owner;
    p.recruitQueue = p.recruitQueue.filter((item) => item.nation === owner);
    const head = p.recruitQueue[0];
    if (!head || owner === null || recruitBlock(p) !== null) continue;
    head.daysLeft = Math.max(0, head.daysLeft - 1);
    if (head.daysLeft > 0 || p.pop < recruitPop(head.unit, head.count)) continue;
    p.recruitQueue.shift();
    complete(state, p, owner, head.unit, head.count);
  }
}
