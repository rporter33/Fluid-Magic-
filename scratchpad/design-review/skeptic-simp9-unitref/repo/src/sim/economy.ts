// Daily accrual of gold, mana, upkeep, and fort materials (docs/01-core-rules.md section 4).
import { COLORS } from '../content/colors';
import { TIME } from '../content/rules';
import type { ProvinceId } from './ids';
import { fortMaterials, nationEconomy, type ProvinceEconomy } from './selectors';
import type { GameState } from './types';

const PER_DAY = 1 / TIME.daysPerMonth;

/**
 * Pays each nation a day of income and mana, then a day of upkeep. Upkeep is paid as far as
 * the treasury allows; a shortfall adds the unpaid fraction of the day to unpaidDays, and a
 * fully paid day clears it. Gold never goes negative.
 */
export function accrueGoldAndMana(
  state: GameState,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy>,
): void {
  for (const nation of Object.values(state.nations)) {
    if (nation.eliminated) continue;
    const e = nationEconomy(state, nation.id, economies);
    nation.gold += e.gold * PER_DAY;
    for (const color of COLORS) nation.mana[color] += e.mana[color] * PER_DAY;
    const due = e.upkeep * PER_DAY;
    const paid = Math.min(nation.gold, due);
    nation.gold -= paid;
    nation.unpaidDays = paid >= due ? 0 : nation.unpaidDays + (due - paid) / due;
  }
}

/** Adds a day of collected materials to every owned fort's pool, up to its cap. */
export function accrueMaterials(
  state: GameState,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy>,
): void {
  for (const p of Object.values(state.provinces)) {
    if (p.owner === null || !p.buildings.includes('fort')) continue;
    const { perMonth, cap } = fortMaterials(state, p.id, economies);
    p.materials = Math.min(cap, p.materials + perMonth * PER_DAY);
  }
}
