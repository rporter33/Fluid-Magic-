// Sieges (docs/01-core-rules.md section 11). An army that enters a fort province with
// defenders lays siege: each day it batters the walls and the defenders repair them. The
// besieger may storm at any time; walls still standing make it much harder. Tick step 2,
// after arrivals.
import { unitDef } from '../content';
import { SIEGE } from '../content/rules';
import { captureProvince } from './capture';
import { attackersAt, fight, hasForces, ownerForces } from './conflict';
import type { ProvinceId } from './ids';
import { pdForce } from './pd';
import type { GameState } from './types';
import type { SideForces } from './battle/setup';

/** Total strength of a side: every troop's and commander's str. */
function strength(state: GameState, provinceId: ProvinceId, forces: SideForces): number {
  let total = 0;
  for (const c of forces.commanders) {
    total += unitDef(c.unit).str;
    for (const s of c.squads) total += s.count * unitDef(s.unit).str;
  }
  for (const s of forces.garrison?.squads ?? []) total += s.count * unitDef(s.unit).str;
  if (forces.pd) {
    for (const { unit, count } of pdForce(state, provinceId)) total += count * unitDef(unit).str;
  }
  return total;
}

/**
 * A siege's daily numbers, for the tick, the UI, and the AI: wall damage, repair, and days until
 * the walls are down at this rate (null if they never will be).
 */
export function siegeRates(
  state: GameState,
  provinceId: ProvinceId,
): { damage: number; repair: number; daysToBreach: number | null } {
  const siege = state.provinces[provinceId]?.siege;
  if (!siege) return { damage: 0, repair: 0, daysToBreach: null };
  const damage =
    strength(state, provinceId, attackersAt(state, provinceId, siege.attacker)) /
    SIEGE.attackDivisor;
  const repair = strength(state, provinceId, ownerForces(state, provinceId)) / SIEGE.repairDivisor;
  const net = damage - repair;
  const daysToBreach = siege.wallHp <= 0 ? 0 : net > 0 ? Math.ceil(siege.wallHp / net) : null;
  return { damage, repair, daysToBreach };
}

export function progressSieges(state: GameState): void {
  for (const p of Object.values(state.provinces)) {
    const siege = p.siege;
    if (!siege) continue;
    const attackers = attackersAt(state, p.id, siege.attacker);
    if (attackers.commanders.length === 0) {
      p.siege = null;
      continue;
    }
    const defenders = ownerForces(state, p.id);
    if (!hasForces(state, p.id, defenders)) {
      captureProvince(state, p.id, siege.attacker);
      continue;
    }
    if (siege.storm) {
      const winner = fight(state, p.id, attackers, defenders, { wallsStanding: siege.wallHp > 0 });
      if (winner === 'attacker') captureProvince(state, p.id, siege.attacker);
      else p.siege = null;
      continue;
    }
    const { damage, repair } = siegeRates(state, p.id);
    siege.wallHp = Math.min(SIEGE.wallHp, Math.max(0, siege.wallHp - damage + repair));
  }
}
