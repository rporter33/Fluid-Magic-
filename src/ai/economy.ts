// The AI's economy and research steps (docs/08-ai.md priorities 1 and 3; Phase 7 design
// "1. Economy", "3. Research"): taxes, provincial defense, buildings, and who studies where.
// Defenses and buildings spend only the gold above AI.goldReserve, which recruitment keeps.
import { AI } from '../content/ai';
import type { TaxRate } from '../content/rules';
import type { BuildingId } from '../content/types';
import { constructionCost } from '../sim/buildings';
import type { ProvinceId } from '../sim/ids';
import { pdCost } from '../sim/pd';
import { isResearching } from '../sim/research';
import { getMapProvince } from '../sim/state';
import type { CommanderState, ProvinceState } from '../sim/types';
import { borders, destinationOf } from './assess';
import { planCarriedMana } from './magic';
import { isGuarded, type Plan } from './plan';
import { splitMages } from './roles';

/** Step 1: sets taxes, buys provincial defense, and starts buildings. */
export function planEconomy(plan: Plan): void {
  setTaxes(plan);
  buyDefenses(plan);
  startBuilding(plan);
}

/**
 * Step 3: research goes to the nation's color; the researchers study in the home lab, and the
 * battle mages stand ready to ride (no Research order), taking their carried mana before the
 * army pass can march them off this call.
 */
export function planResearch(plan: Plan): void {
  const color = plan.nationState.colors[0];
  if (plan.nationState.research.color !== color) {
    plan.issue({ type: 'setResearchColor', nation: plan.nation, color });
  }
  const { researchers, battleMages } = splitMages(plan.copy, plan.nation);
  for (const researcher of researchers) study(plan, researcher);
  for (const mage of battleMages) {
    if (mage.order.kind !== 'research') continue;
    plan.issue({ type: 'setOrder', nation: plan.nation, commander: mage.id, order: 'idle' });
  }
  planCarriedMana(plan, battleMages);
}

// ---------------------------------------------------------------- tax

/** High in the capital while the treasury is low and its people calm; Normal everywhere else. */
function wantedTax(plan: Plan, province: ProvinceState): TaxRate {
  const high =
    province.id === plan.capital.id &&
    plan.nationState.gold < AI.taxHighBelowGold &&
    province.unrest < AI.taxHighMaxUnrest;
  return high ? 'high' : 'normal';
}

/** Sets each owned province's tax, issuing a command only where it changes. */
function setTaxes(plan: Plan): void {
  for (const p of plan.owned()) {
    const rate = wantedTax(plan, p);
    if (p.taxRate !== rate)
      plan.issue({ type: 'setTax', nation: plan.nation, province: p.id, rate });
  }
}

// ---------------------------------------------------------------- provincial defense

/** Gold free for defenses and buildings: what lies above the recruitment reserve. */
function spareGold(plan: Plan): number {
  return plan.nationState.gold - AI.goldReserve;
}

/** A province and the PD level wanted there. */
export type DefenseTarget = readonly [province: ProvinceId, level: number];

/**
 * Where PD is wanted and to what level, in the order the budget pays for it: provinces next to
 * an enemy nation, then owned Wellsprings, then provinces next to a strong independent (those
 * next to an enemy are already listed, at their higher level). Each part is in province order.
 */
export function defenseTargets(plan: Plan): DefenseTarget[] {
  const near = borders(plan.copy, plan.nation);
  const springs = plan
    .owned()
    .filter((p) => getMapProvince(plan.copy, p.id).wellspring !== undefined);
  return [
    ...[...near.enemy].map((id): DefenseTarget => [id, AI.pd.enemy]),
    ...springs.map((p): DefenseTarget => [p.id, AI.wellspringPd]),
    ...[...near.strongIndependent].map((id): DefenseTarget => [id, AI.pd.border]),
  ];
}

/**
 * Buys one PD level a call in each province below its wanted level, in budget order. The first
 * level the spare gold cannot pay ends the buying, so a later province never takes gold an
 * earlier one is waiting for. A besieged province cannot raise defenses and is passed over.
 */
function buyDefenses(plan: Plan): void {
  const raised = new Set<ProvinceId>();
  for (const [id, level] of defenseTargets(plan)) {
    const p = plan.copy.provinces[id];
    if (!p || raised.has(id) || p.pd >= level || p.siege !== null) continue;
    if (pdCost(p.pd, 1) > spareGold(plan)) return;
    if (plan.issue({ type: 'buyPd', nation: plan.nation, province: id, levels: 1 })) raised.add(id);
  }
}

// ---------------------------------------------------------------- buildings

/** A construction of this nation under way anywhere: the AI runs one at a time. */
function isBuilding(plan: Plan): boolean {
  return Object.values(plan.copy.provinces).some((p) => p.construction?.nation === plan.nation);
}

/** Most people first; equals keep province order (the sort is stable). */
function byPopulation(provinces: readonly ProvinceState[]): ProvinceState[] {
  return [...provinces].sort((a, b) => b.pop - a.pop);
}

/** What to build next, and where: the best site first. */
export interface BuildChoice {
  readonly building: BuildingId;
  readonly sites: readonly ProvinceState[];
}

/**
 * The next building: a second Lab in the most populous owned province but the capital, once
 * gold is above AI.labGold while the capital holds the nation's only lab; else a Temple in each
 * owned province of more than AI.templePop people while gold is above AI.templeGold, the most
 * populous first. Null when neither is wanted.
 */
export function buildChoice(plan: Plan): BuildChoice | null {
  const gold = plan.nationState.gold;
  const owned = plan.owned();
  const labs = owned.filter((p) => p.buildings.includes('lab'));
  if (gold > AI.labGold && labs.length === 1 && labs[0]?.id === plan.capital.id) {
    const sites = byPopulation(owned.filter((p) => p.id !== plan.capital.id));
    if (sites.length > 0) return { building: 'lab', sites };
  }
  if (gold > AI.templeGold) {
    const sites = owned.filter((p) => p.pop > AI.templePop && !p.buildings.includes('temple'));
    if (sites.length > 0) return { building: 'temple', sites: byPopulation(sites) };
  }
  return null;
}

/**
 * Starts the next building with the scout, the only builder: it builds when it stands on the
 * site, else walks there. The site is the best one, unless the scout is already walking to
 * another site of the same building, which it keeps. With no scout the building waits for the
 * replacement recruitment queues. The construction is paid only from the spare gold; the walk
 * needs only the gold threshold.
 */
function startBuilding(plan: Plan): void {
  if (isBuilding(plan)) return;
  const scout = plan.withRole('scout').find((c) => !isGuarded(c));
  const choice = scout ? buildChoice(plan) : null;
  if (!scout || !choice) return;
  const walkingTo = scout.order.kind === 'move' ? destinationOf(scout) : null;
  const site = choice.sites.find((p) => p.id === walkingTo) ?? choice.sites[0];
  if (!site) return;
  if (scout.transit === null && scout.location === site.id) {
    if (constructionCost(plan.copy, site.id, choice.building) > spareGold(plan)) return;
    plan.issue({
      type: 'build',
      nation: plan.nation,
      province: site.id,
      commander: scout.id,
      building: choice.building,
    });
    return;
  }
  if (walkingTo === site.id) return;
  const path = plan.paths([scout]).pathTo(site.id);
  if (path) plan.issue({ type: 'move', nation: plan.nation, commanders: [scout.id], path });
}

// ---------------------------------------------------------------- research

/**
 * Where a commander studies: the capital while it is an own lab province, else the own lab
 * province nearest by path days (the one it stands in first), ties by province order.
 */
export function homeLab(plan: Plan, commander: CommanderState): ProvinceId | null {
  const capital = plan.capital;
  if (capital.owner === plan.nation && capital.buildings.includes('lab')) return capital.id;
  const labs = plan.owned().filter((p) => p.buildings.includes('lab'));
  const standing = commander.transit === null ? commander.location : null;
  if (labs.some((p) => p.id === standing)) return standing;
  const paths = plan.paths([commander]);
  let best: ProvinceId | null = null;
  let bestDays = Infinity;
  for (const p of labs) {
    const days = paths.days(p.id);
    if (days !== undefined && days < bestDays) {
      best = p.id;
      bestDays = days;
    }
  }
  return best;
}

/**
 * A researcher studies in its home lab: Research where it stands there, else a walk home. One
 * casting, claiming, or building is left alone (the order guard), as is one already studying
 * there or walking there.
 */
function study(plan: Plan, researcher: CommanderState): void {
  if (isGuarded(researcher)) return;
  const lab = homeLab(plan, researcher);
  if (lab === null) return;
  if (researcher.transit === null && researcher.location === lab) {
    if (isResearching(plan.copy, researcher)) return;
    plan.issue({
      type: 'setOrder',
      nation: plan.nation,
      commander: researcher.id,
      order: 'research',
    });
    return;
  }
  if (destinationOf(researcher) === lab) return;
  const path = plan.paths([researcher]).pathTo(lab);
  if (path) plan.issue({ type: 'move', nation: plan.nation, commanders: [researcher.id], path });
}
