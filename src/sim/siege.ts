// Sieges (docs/01-core-rules.md section 11). An army that enters an enemy nation's fort
// province lays siege, defended or not: each day it batters the walls and the defenders, if
// any, repair them. An undefended fort falls once its walls are down, or at once to a storm.
// The besieger may storm at any time; walls still standing make it much harder. Tick step 2,
// after arrivals.
import { unitDef } from '../content';
import { SIEGE } from '../content/rules';
import { captureProvince } from './capture';
import { attackersAt, captureIfHeld, fight, fightersIn, hasForces, ownerForces } from './conflict';
import type { ProvinceId } from './ids';
import { pdForce } from './pd';
import { wholeDays } from './state';
import type { SideForces, StormState } from './battle/setup';
import type { GameState, SiegeState } from './types';

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

/** The walls count as down below 1 HP, which the UI shows as 0. */
export function wallsDown(wallHp: number): boolean {
  return wallHp < SIEGE.wallsDownBelow;
}

/** What a storm of this siege faces: walls still standing, or breached. */
export function stormState(siege: SiegeState): StormState {
  return { wallsStanding: !wallsDown(siege.wallHp) };
}

/** Wall damage and repair a day from two sides' forces, and days until the walls are down. */
function rates(
  state: GameState,
  provinceId: ProvinceId,
  wallHp: number,
  attackers: SideForces,
  defenders: SideForces,
): { damage: number; repair: number; daysToBreach: number | null } {
  const damage = strength(state, provinceId, attackers) / SIEGE.attackDivisor;
  const repair = strength(state, provinceId, defenders) / SIEGE.repairDivisor;
  const net = damage - repair;
  const left = wallHp - SIEGE.wallsDownBelow;
  const daysToBreach = wallsDown(wallHp) ? 0 : net > 0 ? wholeDays(left / net) : null;
  return { damage, repair, daysToBreach };
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
  const pool = fightersIn(state, provinceId);
  return rates(
    state,
    provinceId,
    siege.wallHp,
    attackersAt(state, provinceId, siege.attacker, pool),
    ownerForces(state, provinceId, pool),
  );
}

/**
 * Tick step 2, after arrivals. A siege ends when the besiegers are gone. An empty fort falls
 * once its walls are down (nobody repairs them); a storm takes it at once. A storm of a held
 * fort is a battle, with the walls helping while they stand.
 */
export function progressSieges(state: GameState): void {
  for (const p of Object.values(state.provinces)) {
    const siege = p.siege;
    if (!siege) continue;
    const pool = fightersIn(state, p.id);
    const attackers = attackersAt(state, p.id, siege.attacker, pool);
    if (attackers.commanders.length === 0) {
      p.siege = null;
      continue;
    }
    const defenders = ownerForces(state, p.id, pool);
    const held = hasForces(state, p.id, defenders);
    if (siege.storm) {
      siege.storm = false;
      if (!held) {
        captureProvince(state, p.id, siege.attacker);
        continue;
      }
      const won = fight(state, p.id, attackers, defenders, stormState(siege)) === 'attacker';
      // A storm ends the siege either way: the fort falls, or the besiegers are beaten or gone.
      p.siege = null;
      if (won) captureIfHeld(state, p.id, attackers);
      continue;
    }
    const { damage, repair } = rates(state, p.id, siege.wallHp, attackers, defenders);
    siege.wallHp = Math.min(SIEGE.wallHp, Math.max(0, siege.wallHp - damage + repair));
    if (!held && wallsDown(siege.wallHp)) captureProvince(state, p.id, siege.attacker);
  }
}
