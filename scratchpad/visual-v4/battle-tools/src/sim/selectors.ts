// Read-only derived data for the UI, the AI, and the tick. Every economic rate is computed
// here, pillage included; tick.ts applies these same rates a day at a time, so what the UI
// shows is what happens. Scales come from scales.ts.
import { DIFFICULTIES } from '../content/ai';
import { COLORS, type Color } from '../content/colors';
import type { Scales } from '../content/pretenders/scales';
import {
  DOMINION,
  ECONOMY,
  MANA,
  MATERIALS,
  PILLAGE,
  POPULATION,
  SUPPLY,
  TAX_RATES,
  UNREST,
} from '../content/rules';
import { TERRAIN } from '../content/terrain';
import { commanderSupply, commanderUpkeep } from './commanders';
import type { NationId, ProvinceId } from './ids';
import { nationScales, provinceScales, scaleEffect } from './scales';
import { activeEffects, getMapProvince, getNation, getProvince } from './state';
import { claimedBy } from './wellsprings';
import type { ColorAmounts, CommanderState, GameState } from './types';

export function zeroMana(): ColorAmounts {
  return { W: 0, U: 0, B: 0, R: 0, G: 0 };
}

/** A province being pillaged today. Per-day values, unlike the monthly rates around it. */
export interface Pillage {
  /** The first pillaging nation in nation order; it takes the gold. */
  taker: NationId;
  popPerDay: number;
  goldPerDay: number;
  unrestPerDay: number;
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
  /** Population change, before pillage. */
  growth: number;
  /** Unrest change, before pillage. */
  unrest: number;
  pillage: Pillage | null;
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

/** Every nation's scales, computed once for a day's worth of province reads. */
function allNationScales(state: GameState): Map<NationId, Scales> {
  const result = new Map<NationId, Scales>();
  for (const id of Object.keys(state.nations) as NationId[]) {
    result.set(id, nationScales(state, id));
  }
  return result;
}

function pillageOf(
  state: GameState,
  pop: number,
  present: readonly CommanderState[],
): Pillage | null {
  const pillagers = new Set<NationId>();
  for (const c of present) {
    if (c.order.kind === 'pillage' && !c.transit && c.owner !== null && c.squads.length > 0) {
      pillagers.add(c.owner);
    }
  }
  if (pillagers.size === 0) return null;
  const taker = (Object.keys(state.nations) as NationId[]).find((n) => pillagers.has(n));
  if (taker === undefined) return null;
  const popPerDay = pop * PILLAGE.popFraction;
  return {
    taker,
    popPerDay,
    goldPerDay: popPerDay / PILLAGE.popPerGold,
    unrestPerDay: PILLAGE.unrestPerDay,
  };
}

/** A province's springs: the map's, then those added in play (D5), in that order. */
export function provinceSprings(state: GameState, id: ProvinceId): Color[] {
  return [...getMapProvince(state, id).springs, ...getProvince(state, id).extraSprings];
}

export function provinceEconomy(
  state: GameState,
  id: ProvinceId,
  present: readonly CommanderState[] = commandersByProvince(state).get(id) ?? [],
  national?: ReadonlyMap<NationId, Scales>,
): ProvinceEconomy {
  const p = getProvince(state, id);
  const mapProvince = getMapProvince(state, id);
  const terrain = TERRAIN[mapProvince.terrain];
  const scales = provinceScales(state, id, national);
  const effects = activeEffects(state, id);
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

  // Ritual supply changes are their own factor: Burn the Fields halves whatever the scales give.
  const ritualPct = effects.reduce((sum, e) => sum + (e.kind === 'supply' ? e.deltaPct : 0), 0);
  const supply =
    (terrain.supplyBase + p.pop / SUPPLY.popDivisor) *
    Math.max(0, 1 + scaleEffect(scales, 'supplyPct')) *
    Math.max(0, 1 + ritualPct) *
    (besieged ? SUPPLY.besiegedFactor : 1);
  // Independents never eat (they are always fed); everyone else shares the province.
  const supplyUsed = present.reduce(
    (sum, c) => sum + (c.owner === null ? 0 : commanderSupply(c)),
    0,
  );

  const mana = zeroMana();
  if (p.owner !== null) {
    // The map's springs and those added in play (provinceSprings), without a new list each day.
    for (const color of mapProvince.springs) mana[color] += MANA.perSpring;
    for (const color of p.extraSprings) mana[color] += MANA.perSpring;
    if (mapProvince.wellspring) for (const color of COLORS) mana[color] += MANA.wellspringPerColor;
    if (p.dominion.nation === p.owner && p.dominion.strength > 0) {
      mana[getNation(state, p.owner).colors[0]] += Math.floor(
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

  const pillage = pillageOf(state, p.pop, present);
  return { gold, materials, supply, supplyUsed, mana, growth, unrest, pillage };
}

/** Every province's economy, sharing one pass over the commanders and the nation scales. */
export function allProvinceEconomies(state: GameState): Map<ProvinceId, ProvinceEconomy> {
  const byProvince = commandersByProvince(state);
  const national = allNationScales(state);
  const result = new Map<ProvinceId, ProvinceEconomy>();
  for (const id of Object.keys(state.provinces) as ProvinceId[]) {
    result.set(id, provinceEconomy(state, id, byProvince.get(id) ?? [], national));
  }
  return result;
}

/**
 * A fort's monthly materials: its own production plus a share of each adjacent, owned,
 * fortless province's. Nothing while besieged. The pool holds at most MATERIALS.capMonths
 * of this.
 */
export function fortMaterials(
  state: GameState,
  fortId: ProvinceId,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy> = allProvinceEconomies(state),
): { perMonth: number; cap: number } {
  const fort = getProvince(state, fortId);
  if (!fort.buildings.includes('fort') || fort.owner === null || fort.siege !== null) {
    return { perMonth: 0, cap: 0 };
  }
  let perMonth = economies.get(fortId)?.materials ?? 0;
  for (const n of getMapProvince(state, fortId).neighbors) {
    const neighbor = getProvince(state, n);
    if (neighbor.owner === fort.owner && !neighbor.buildings.includes('fort')) {
      perMonth += (economies.get(n)?.materials ?? 0) * MATERIALS.neighborShare;
    }
  }
  return { perMonth, cap: perMonth * MATERIALS.capMonths };
}

/** Totals for a nation. Monthly, except plunder. */
export interface NationEconomy {
  /** Gold income after the difficulty factor. */
  gold: number;
  upkeep: number;
  mana: ColorAmounts;
  /** Gold per day from pillage. */
  plunderPerDay: number;
}

/** Every nation's totals in one pass over provinces and one over commanders. */
export function allNationEconomies(
  state: GameState,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy> = allProvinceEconomies(state),
): Map<NationId, NationEconomy> {
  const result = new Map<NationId, NationEconomy>();
  for (const id of Object.keys(state.nations) as NationId[]) {
    result.set(id, { gold: 0, upkeep: 0, mana: zeroMana(), plunderPerDay: 0 });
  }
  for (const p of Object.values(state.provinces)) {
    const e = economies.get(p.id);
    if (!e) continue;
    const owner = p.owner === null ? undefined : result.get(p.owner);
    if (owner) {
      owner.gold += e.gold;
      for (const color of COLORS) owner.mana[color] += e.mana[color];
    }
    const taker = e.pillage ? result.get(e.pillage.taker) : undefined;
    if (taker && e.pillage) taker.plunderPerDay += e.pillage.goldPerDay;
  }
  for (const c of Object.values(state.commanders)) {
    const owner = c.owner === null ? undefined : result.get(c.owner);
    if (owner) owner.upkeep += commanderUpkeep(c);
  }
  for (const [id, totals] of result) {
    const ai = getNation(state, id).ai;
    totals.gold *= ai ? DIFFICULTIES[ai.difficulty].incomeFactor : 1;
  }
  return result;
}

export function nationEconomy(
  state: GameState,
  nationId: NationId,
  economies: ReadonlyMap<ProvinceId, ProvinceEconomy> = allProvinceEconomies(state),
): NationEconomy {
  const totals = allNationEconomies(state, economies).get(nationId);
  if (!totals) throw new Error(`no nation ${nationId}`);
  return totals;
}

/**
 * Dominion score: the pretender's, plus one per Wellspring claimed in a province the nation
 * still owns, at most DOMINION.max.
 */
export function dominionScore(state: GameState, nationId: NationId): number {
  const claimed = claimedBy(state, nationId);
  return Math.min(DOMINION.max, getNation(state, nationId).pretender.dominion + claimed);
}

/** Troop morale lost to unpaid upkeep: one point per month unpaid, at most 3. */
export function unpaidMoralePenalty(unpaidDays: number): number {
  return Math.min(ECONOMY.unpaidMoraleCap, Math.floor(unpaidDays / ECONOMY.unpaidDaysPerMorale));
}

/** Troop morale lost to starvation: one point per 5 starving days, at most 3. */
export function starvationMoralePenalty(starvedDays: number): number {
  return Math.min(
    SUPPLY.starvationMoraleCap,
    Math.floor(starvedDays / SUPPLY.starvationDaysPerMorale),
  );
}

/** Prophet and pretender identity lives only in NationState. */
export function isProphet(state: GameState, commander: CommanderState): boolean {
  return commander.owner !== null && getNation(state, commander.owner).prophetId === commander.id;
}

export function isPretender(state: GameState, commander: CommanderState): boolean {
  return commander.owner !== null && getNation(state, commander.owner).pretenderId === commander.id;
}

/** A nation's standing, for the victory screen and the headless runner (docs/07). */
export interface NationSummary {
  nation: NationId;
  name: string;
  provinces: number;
  population: number;
  battlesWon: number;
  battlesLost: number;
  provincesTaken: number;
  /** Mana spent per color over the game (docs/07 victory screen). */
  manaSpent: ColorAmounts;
  wellsprings: number;
  eliminated: boolean;
}

export function nationSummary(state: GameState, nationId: NationId): NationSummary {
  const nation = getNation(state, nationId);
  const owned = Object.values(state.provinces).filter((p) => p.owner === nationId);
  return {
    nation: nationId,
    name: nation.name,
    provinces: owned.length,
    population: owned.reduce((n, p) => n + p.pop, 0),
    battlesWon: nation.stats.battlesWon,
    battlesLost: nation.stats.battlesLost,
    provincesTaken: nation.stats.provincesTaken,
    manaSpent: { ...nation.stats.manaSpent },
    wellsprings: claimedBy(state, nationId),
    eliminated: nation.eliminated,
  };
}
