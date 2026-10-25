// Temples, labs, and forts (docs/01-core-rules.md section 7). Starting a construction is a
// command (Phase 3); this module prices it and advances it a day at a time.
import { buildingDef } from '../content';
import type { BuildingId } from '../content/types';
import type { NationId, ProvinceId } from './ids';
import { postMessage } from './messages';
import { provinceScales, scaleEffect } from './scales';
import { getMapProvince, getNation, getProvince } from './state';
import type { GameState } from './types';

/** Days to build here: the building's days scaled by the province's build-time scale effect. */
export function constructionDays(
  state: GameState,
  provinceId: ProvinceId,
  building: BuildingId,
): number {
  const pct = scaleEffect(provinceScales(state, provinceId), 'buildTimePct');
  return Math.max(1, Math.ceil(buildingDef(building).days * Math.max(0, 1 + pct)));
}

/** Gold to build here; temples get cheaper with the province's Sanctity. */
export function constructionCost(
  state: GameState,
  provinceId: ProvinceId,
  building: BuildingId,
): number {
  const def = buildingDef(building);
  if (building !== 'temple') return def.gold;
  const pct = scaleEffect(provinceScales(state, provinceId), 'templeCostPct');
  return Math.round(def.gold * Math.max(0, 1 + pct));
}

/** Pays for and starts a construction. Validation is the caller's job (commands.ts). */
export function startConstruction(
  state: GameState,
  provinceId: ProvinceId,
  building: BuildingId,
  nation: NationId,
): void {
  getNation(state, nation).gold -= constructionCost(state, provinceId, building);
  getProvince(state, provinceId).construction = {
    building,
    daysLeft: constructionDays(state, provinceId, building),
    nation,
  };
}

/**
 * Advances every construction a day. A construction finishes even if its commander left,
 * and is abandoned if the province changes hands.
 */
export function progressConstruction(state: GameState): void {
  for (const p of Object.values(state.provinces)) {
    const job = p.construction;
    if (!job) continue;
    if (p.owner !== job.nation) {
      p.construction = null;
      continue;
    }
    job.daysLeft -= 1;
    if (job.daysLeft > 0) continue;
    p.construction = null;
    if (!p.buildings.includes(job.building)) p.buildings.push(job.building);
    const text = `${buildingDef(job.building).name} completed in ${getMapProvince(state, p.id).name}.`;
    postMessage(state, job.nation, 'built', text, p.id);
  }
}
