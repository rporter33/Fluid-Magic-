// Daily accrual of gold, mana, upkeep, and fort materials (docs/01-core-rules.md section 4).
import { COLORS } from '../content/colors';
import { ECONOMY, TIME } from '../content/rules';
import type { ProvinceId } from './ids';
import { allNationEconomies, fortMaterials, type ProvinceEconomy } from './selectors';
import type { GameState } from './types';

const PER_DAY = 1 / TIME.daysPerMonth;

/** Highest unpaidDays: one below the next penalty point, so recovery runs at the loss rate. */
export const UNPAID_DAYS_CAP = (ECONOMY.unpaidMoraleCap + 1) * ECONOMY.unpaidDaysPerMorale - 1;

/**
 * Pays each nation a day of income and mana, then a day of upkeep. Upkeep is paid as far as
 * the treasury allows and gold is never driven below zero by it. A short day adds its unpaid
 * fraction to unpaidDays; a fully paid day takes one off, so morale recovers at the rate it
 * was lost.
 */
export function accrueGoldAndMana(
  state: GameState,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy>,
): void {
  const totals = allNationEconomies(state, economies);
  for (const nation of Object.values(state.nations)) {
    const e = totals.get(nation.id);
    if (nation.eliminated || !e) continue;
    nation.gold += e.gold * PER_DAY;
    for (const color of COLORS) nation.mana[color] += e.mana[color] * PER_DAY;
    const due = e.upkeep * PER_DAY;
    const paid = Math.max(0, Math.min(nation.gold, due));
    nation.gold -= paid;
    nation.unpaidDays =
      paid >= due
        ? Math.max(0, nation.unpaidDays - 1)
        : Math.min(UNPAID_DAYS_CAP, nation.unpaidDays + (due - paid) / due);
  }
}

/**
 * Adds a day of collected materials to every owned fort's pool, up to its cap. The cap only
 * stops growth: a pool already above it (a siege, a population drop) keeps what it has.
 */
export function accrueMaterials(
  state: GameState,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy>,
): void {
  for (const p of Object.values(state.provinces)) {
    if (p.owner === null || !p.buildings.includes('fort')) continue;
    const { perMonth, cap } = fortMaterials(state, p.id, economies);
    if (p.materials < cap) p.materials = Math.min(cap, p.materials + perMonth * PER_DAY);
  }
}
