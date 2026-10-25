// Read-only derived data for the UI, the AI, and the tick. Every economic rate is computed
// here; tick.ts applies these same rates a day at a time, so what the UI shows is what happens.
import { DIFFICULTIES } from '../content/ai';
import { COLORS } from '../content/colors';
import {
  DOMINION,
  ECONOMY,
  MANA,
  MATERIALS,
  POPULATION,
  SUPPLY,
  TAX_RATES,
  UNREST,
} from '../content/rules';
import { TERRAIN } from '../content/terrain';
import { commanderSupply, commanderUpkeep } from './commanders';
import type { NationId, ProvinceId } from './ids';
import { provinceScales, scaleEffect } from './scales';
import { getMapProvince, getNation, getProvince } from './state';
import type { ColorAmounts, CommanderState, GameState } from './types';

export function zeroMana(): ColorAmounts {
  return { W: 0, U: 0, B: 0, R: 0, G: 0 };
}

/** Rates for one province. Monthly unless marked per day. */
export interface ProvinceEconomy {
  /** Gold to the owner, before the owner's difficulty factor. */
  gold: number;
  /** Materials produced, before a fort collects them. */
  materials: number;
  /** Supply available per day. */
  supply: number;
  /** Supply eaten per day by every commander and troop standing here. */
  supplyUsed: number;
  /** Mana to the owner. */
  mana: ColorAmounts;
  /** Population change. */
  growth: number;
  /** Unrest change. */
  unrest: number;
}

/** Commanders by the province they stand in (or left, while in transit). */
export function commandersByProvince(state: GameState): Map<ProvinceId, CommanderState[]> {
  const byProvince = new Map<ProvinceId, CommanderState[]>();
  for (const c of Object.values(state.commanders)) {
    const list = byProvince.get(c.location);
    if (list) list.push(c);
    else byProvince.set(c.location, [c]);
  }
  return byProvince;
}

export function provinceEconomy(
  state: GameState,
  id: ProvinceId,
  present: readonly CommanderState[] = commandersByProvince(state).get(id) ?? [],
): ProvinceEconomy {
  const p = getProvince(state, id);
  const terrain = TERRAIN[getMapProvince(state, id).terrain];
  const scales = provinceScales(state, id);
  const effects = state.provinceEffects.filter((e) => e.province === id);
  const besieged = p.siege !== null;

  let gold = 0;
  if (p.owner !== null && !besieged) {
    gold =
      (p.pop / ECONOMY.popPerGold) *
      TAX_RATES[p.taxRate].rate *
      (1 + scaleEffect(scales, 'goldPct')) *
      (1 - p.unrest / ECONOMY.unrestGoldDivisor);
  }

  let materials = 0;
  if (!besieged) {
    const bonus = effects.reduce((sum, e) => sum + (e.kind === 'materials' ? e.delta : 0), 0);
    materials =
      (terrain.materialsBase + p.pop / MATERIALS.popDivisor) *
        Math.max(0, 1 + scaleEffect(scales, 'materialsPct')) +
      bonus;
  }

  const supplyPct = effects.reduce((sum, e) => sum + (e.kind === 'supply' ? e.deltaPct : 0), 0);
  const supply =
    (terrain.supplyBase + p.pop / SUPPLY.popDivisor) *
    Math.max(0, 1 + scaleEffect(scales, 'supplyPct') + supplyPct) *
    (besieged ? SUPPLY.besiegedFactor : 1);
  const supplyUsed = present.reduce((sum, c) => sum + commanderSupply(c), 0);

  const mana = zeroMana();
  if (p.owner !== null) {
    const mapProvince = getMapProvince(state, id);
    for (const color of mapProvince.springs) mana[color] += MANA.perSpring;
    if (mapProvince.wellspring) for (const color of COLORS) mana[color] += MANA.wellspringPerColor;
    if (p.dominion.nation === p.owner && p.dominion.strength > 0) {
      mana[getNation(state, p.owner).color] += Math.floor(
        p.dominion.strength / MANA.tintStrengthPerMana,
      );
      mana.B += scaleEffect(scales, 'tintManaB');
    }
  }

  const growth = p.pop * (POPULATION.baseGrowth + scaleEffect(scales, 'popGrowth'));

  let unrest = scaleEffect(scales, 'unrestPerMonth') - UNREST.decayPerMonth;
  if (p.owner !== null) {
    unrest += TAX_RATES[p.taxRate].unrestPerMonth;
    const priests = present.filter((c) => c.owner === p.owner && c.holy > 0 && !c.transit);
    unrest -= priests.length * UNREST.priestDecayPerMonth;
    if (p.dominion.nation !== null && p.dominion.nation !== p.owner) {
      unrest += Math.floor(p.dominion.strength / UNREST.enemyDominionStrengthPerPoint);
      unrest += scaleEffect(scales, 'enemyUnrestPerMonth');
    }
  }

  return { gold, materials, supply, supplyUsed, mana, growth, unrest };
}

/** Every province's economy, sharing one pass over the commanders. */
export function allProvinceEconomies(state: GameState): Map<ProvinceId, ProvinceEconomy> {
  const byProvince = commandersByProvince(state);
  const result = new Map<ProvinceId, ProvinceEconomy>();
  for (const id of Object.keys(state.provinces) as ProvinceId[]) {
    result.set(id, provinceEconomy(state, id, byProvince.get(id) ?? []));
  }
  return result;
}

/**
 * A fort's monthly materials: its own production plus a share of each adjacent, owned,
 * fortless province's. The pool holds at most MATERIALS.capMonths of this.
 */
export function fortMaterials(
  state: GameState,
  fortId: ProvinceId,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy> = allProvinceEconomies(state),
): { perMonth: number; cap: number } {
  const fort = getProvince(state, fortId);
  if (!fort.buildings.includes('fort') || fort.owner === null) return { perMonth: 0, cap: 0 };
  let perMonth = economies.get(fortId)?.materials ?? 0;
  for (const n of getMapProvince(state, fortId).neighbors) {
    const neighbor = getProvince(state, n);
    if (neighbor.owner === fort.owner && !neighbor.buildings.includes('fort')) {
      perMonth += (economies.get(n)?.materials ?? 0) * MATERIALS.neighborShare;
    }
  }
  return { perMonth, cap: perMonth * MATERIALS.capMonths };
}

/** Monthly totals for a nation. */
export interface NationEconomy {
  /** Gold income after the difficulty factor. */
  gold: number;
  upkeep: number;
  mana: ColorAmounts;
}

export function nationEconomy(
  state: GameState,
  nationId: NationId,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy> = allProvinceEconomies(state),
): NationEconomy {
  const nation = getNation(state, nationId);
  const factor = nation.ai ? DIFFICULTIES[nation.ai.difficulty].incomeFactor : 1;
  let gold = 0;
  const mana = zeroMana();
  for (const p of Object.values(state.provinces)) {
    if (p.owner !== nationId) continue;
    const e = economies.get(p.id);
    if (!e) continue;
    gold += e.gold;
    for (const color of COLORS) mana[color] += e.mana[color];
  }
  let upkeep = 0;
  for (const c of Object.values(state.commanders)) {
    if (c.owner === nationId) upkeep += commanderUpkeep(c);
  }
  return { gold: gold * factor, upkeep, mana };
}

/** Dominion score: the pretender's, plus one per claimed Wellspring, at most DOMINION.max. */
export function dominionScore(state: GameState, nationId: NationId): number {
  const claimed = Object.values(state.provinces).filter(
    (p) => p.wellspringClaimedBy === nationId,
  ).length;
  return Math.min(DOMINION.max, getNation(state, nationId).pretender.dominion + claimed);
}

/** Troop morale lost to unpaid upkeep: one point per month unpaid. */
export function unpaidMoralePenalty(unpaidDays: number): number {
  return Math.floor(unpaidDays / ECONOMY.unpaidDaysPerMorale);
}

/** Troop morale lost to starvation: one point per 5 starving days, at most 3. */
export function starvationMoralePenalty(starvedDays: number): number {
  return Math.min(
    SUPPLY.starvationMoraleCap,
    Math.floor(starvedDays / SUPPLY.starvationDaysPerMorale),
  );
}
