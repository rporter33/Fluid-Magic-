// Provincial defense (docs/01-core-rules.md section 8). PD is a level bought with gold; the
// defenders it stands for exist only in battle (Phase 4), generated from the level.
import { nationDef, type UnitTypeId } from '../content';
import { PD } from '../content/rules';
import type { ProvinceId } from './ids';
import { getNation, getProvince } from './state';
import type { GameState } from './types';

/** Gold to raise PD by `levels` from `level`: each step from L to L + 1 costs (L + 1) * 15. */
export function pdCost(level: number, levels: number): number {
  let gold = 0;
  for (let l = level; l < level + levels; l++) gold += (l + 1) * PD.goldPerLevel;
  return gold;
}

/** The defenders a province's PD fields: 2 militia per level and 1 archer per 5 levels. */
export function pdForce(
  state: GameState,
  provinceId: ProvinceId,
): { unit: UnitTypeId; count: number }[] {
  const p = getProvince(state, provinceId);
  if (p.owner === null || p.pd <= 0) return [];
  const units = nationDef(getNation(state, p.owner).def).pd;
  const force = [{ unit: units.militia, count: p.pd * PD.militiaPerLevel }];
  const archers = Math.floor(p.pd / PD.levelsPerArcher);
  if (archers > 0) force.push({ unit: units.archer, count: archers });
  return force;
}
