// The AI's rituals and carried mana (docs/08-ai.md priority 8; docs/02-magic.md sections 3, 6,
// 7; Phase 7 design "6. Rituals and carried mana"): which ritual the casters in the capital lab
// begin, at war and at peace, and the mana battle mages carry to battle. Rituals are named by
// content id; whether one can be cast, and where, comes from the sim's ritualTargets.
import { AI } from '../content/ai';
import { COLORS, type Color } from '../content/colors';
import { spellDef, type SpellId } from '../content/spells';
import type { RitualSpellDef } from '../content/spells/types';
import { knownSpells } from '../sim/battle/setup';
import { takesPart } from '../sim/commanders';
import type { ProvinceId } from '../sim/ids';
import { inOwnLab, researchRate } from '../sim/research';
import { ritualPayment, ritualTargets, withinHops } from '../sim/rituals';
import { getMapProvince } from '../sim/state';
import type { CommanderState } from '../sim/types';
import { isEnemyProvince } from './assess';
import { isGuarded, type Plan } from './plan';
import { pretenderRole, splitMages } from './roles';

/** Summons cast at war: troops that join the caster, then new commanders. */
const WAR_SUMMONS: readonly SpellId[] = [
  'callFireSprites',
  'callOfTheWild',
  'bindSalamander',
  'awakenTreant',
];
/** Rituals cast at war on an enemy province next to the front. */
const WAR_STRIKES: readonly SpellId[] = ['burnTheFields', 'ashRain'];
/** Cast at peace on the caster's fort, the capital. */
const FORGE: SpellId = 'forgeOfCinders';
/** Cast at peace on the capital, where fort materials count. */
const BOUNTY: SpellId = 'bountyOfTheLoam';
/** Cast at peace on the best own province in reach. */
const FERTILE: SpellId = 'fertileSeason';

/**
 * Step 6: one ritual at a time for the nation. While none is under way, the first caster with a
 * useful ritual the pools afford begins the cheapest one.
 */
export function planRituals(plan: Plan): void {
  if (plan.own().some((c) => c.order.kind === 'castRitual')) return;
  const casters = ritualCasters(plan);
  if (casters.length === 0) return;
  const war = atWar(plan);
  for (const caster of casters) {
    const best = cheapest(ritualOptions(plan, caster, war));
    if (!best) continue;
    const begun = plan.issue({
      type: 'castRitual',
      nation: plan.nation,
      commander: caster.id,
      spell: best.spell.id,
      target: best.target,
    });
    if (begun) return;
  }
}

/**
 * Gives each battle mage standing in an own lab province the carried mana its known battle
 * spells use, colors in WUBRG order, up to AI.carriedMana carried in all. A gift takes at most
 * 1 / AI.ritualCostFactor of the pool (half), the share a ritual may take, so the pool never
 * drops below half for it. Called from the research step, before the army pass can march a
 * battle mage out of the lab in the same call.
 */
export function planCarriedMana(plan: Plan, battleMages: readonly CommanderState[]): void {
  const mana = plan.nationState.mana;
  for (const mage of battleMages) {
    if (!inOwnLab(plan.copy, mage)) continue;
    let room = AI.carriedMana - carriedTotal(mage);
    for (const color of carriedColors(plan, mage)) {
      if (room <= 0) break;
      const amount = Math.min(room, Math.floor(mana[color] / AI.ritualCostFactor));
      if (amount < 1) continue;
      const given = plan.issue({
        type: 'giveMana',
        nation: plan.nation,
        commander: mage.id,
        color,
        amount,
      });
      if (given) room -= amount;
    }
  }
}

// ---------------------------------------------------------------- carried mana

function carriedTotal(commander: CommanderState): number {
  return Object.values(commander.carriedMana).reduce((sum, n) => sum + n, 0);
}

/** Colors of carried mana the commander's known battle spells use, in WUBRG order. */
export function carriedColors(plan: Plan, commander: CommanderState): Color[] {
  const spells = knownSpells(plan.copy, plan.nation, commander.pips, commander.holy);
  return COLORS.filter((c) => spells.some((s) => (s.carriedMana[c] ?? 0) > 0));
}

// ---------------------------------------------------------------- rituals

/** A ritual a caster could begin now, where, and its total mana cost. */
interface RitualOption {
  readonly spell: RitualSpellDef;
  readonly target: ProvinceId | null;
  readonly cost: number;
}

/**
 * Who may begin a ritual, in turn: an immobile (Living Monolith) pretender, which does nothing
 * else, then the researchers, the one studying least first (research rate, then age), but only
 * while another researcher stays in the lab, so research never stops. Each stands in the
 * capital while it is an own lab province and is not busy with a guarded order.
 */
export function ritualCasters(plan: Plan): CommanderState[] {
  const ready = (c: CommanderState) =>
    c.transit === null && c.location === plan.capital.id && !isGuarded(c) && inOwnLab(plan.copy, c);
  const pretender = plan
    .withRole('pretender')
    .filter((c) => pretenderRole(c) === 'ritualist' && ready(c));
  const researchers = splitMages(plan).researchers.filter(ready);
  if (researchers.length <= 1) return pretender;
  const rate = (c: CommanderState) => researchRate(plan.copy, c);
  return [...pretender, ...researchers.sort((a, b) => rate(a) - rate(b))];
}

/**
 * At war: a province another nation owns, or a non-hidden commander of another nation, in or
 * next to one of the nation's provinces.
 */
export function atWar(plan: Plan): boolean {
  const foreign = (c: CommanderState) =>
    c.owner !== null && c.owner !== plan.nation && takesPart(c);
  return plan
    .owned()
    .some((p) =>
      [p.id, ...getMapProvince(plan.copy, p.id).neighbors].some(
        (q) => isEnemyProvince(plan.copy, plan.nation, q) || plan.at(q).some(foreign),
      ),
    );
}

function ritualOf(id: SpellId): RitualSpellDef | null {
  const spell = spellDef(id);
  return spell.kind === 'ritual' ? spell : null;
}

/**
 * The ritual's total cost when every pool it draws on (by the default split) holds at least
 * AI.ritualCostFactor times what it takes; null otherwise.
 */
function affordableCost(plan: Plan, spell: RitualSpellDef): number | null {
  const pool = plan.nationState.mana;
  const pay = ritualPayment(pool, spell);
  if (typeof pay === 'string') return null;
  let total = 0;
  for (const c of COLORS) {
    if (pay[c] > 0 && pool[c] < AI.ritualCostFactor * pay[c]) return null;
    total += pay[c];
  }
  return total;
}

/** Each province's place in the map's province order. */
function provinceIndex(plan: Plan): Map<ProvinceId, number> {
  const index = new Map<ProvinceId, number>();
  for (const id of Object.keys(plan.copy.map.provinces) as ProvinceId[]) {
    index.set(id, index.size);
  }
  return index;
}

/** The most populous of some provinces, ties by province order; undefined for none. */
function mostPopulous(plan: Plan, provinces: Iterable<ProvinceId>): ProvinceId | undefined {
  const index = provinceIndex(plan);
  let best: ProvinceId | undefined;
  for (const id of provinces) {
    const pop = plan.copy.provinces[id]?.pop ?? 0;
    const bestPop = best === undefined ? -Infinity : (plan.copy.provinces[best]?.pop ?? 0);
    const earlier = best !== undefined && (index.get(id) ?? 0) < (index.get(best) ?? 0);
    if (pop > bestPop || (pop === bestPop && earlier)) best = id;
  }
  return best;
}

/**
 * Where a strike lands: the most populous enemy nation's province among the targets that lies
 * next to an own province (on the war front) and holds no own commander.
 */
function strikeTarget(plan: Plan, targets: readonly (ProvinceId | null)[]): ProvinceId | undefined {
  const front = (q: ProvinceId) =>
    getMapProvince(plan.copy, q).neighbors.some(
      (n) => plan.copy.provinces[n]?.owner === plan.nation,
    );
  const fit = targets.filter(
    (q): q is ProvinceId =>
      q !== null &&
      isEnemyProvince(plan.copy, plan.nation, q) &&
      front(q) &&
      !plan.at(q).some((c) => c.owner === plan.nation),
  );
  return mostPopulous(plan, fit);
}

/** The best own province a ritual reaches from the caster: the most populous. */
function bestOwnProvince(
  plan: Plan,
  caster: CommanderState,
  spell: RitualSpellDef,
): ProvinceId | undefined {
  const t = spell.target;
  if (t.kind !== 'owned' && t.kind !== 'any') return undefined;
  const reach = [...withinHops(plan.copy, caster.location, t.hops)].filter(
    (q) => plan.copy.provinces[q]?.owner === plan.nation,
  );
  return mostPopulous(plan, reach);
}

/** Where a ritual would go given the targets it may take: null on the caster, undefined none. */
type Aim = (
  spell: RitualSpellDef,
  targets: readonly (ProvinceId | null)[],
) => ProvinceId | null | undefined;

/**
 * The rituals worth casting now, each with its one target. At war: the summons, then a strike
 * on the front. At peace: Forge of Cinders on the capital's fort, Bounty of the Loam on the
 * capital, and Fertile Season on the best own province in reach (useful only there; while it
 * grows, the others get their turn). Only rituals the caster can begin there now (ritualTargets)
 * and the pools can afford by AI.ritualCostFactor are listed.
 */
function ritualOptions(plan: Plan, caster: CommanderState, war: boolean): RitualOption[] {
  const options: RitualOption[] = [];
  const consider = (id: SpellId, aim: Aim) => {
    const spell = ritualOf(id);
    const cost = spell ? affordableCost(plan, spell) : null;
    if (!spell || cost === null) return;
    const targets = ritualTargets(plan.copy, caster, spell);
    const target = aim(spell, targets);
    if (target !== undefined && targets.includes(target)) options.push({ spell, target, cost });
  };
  const onCaster: Aim = () => null;
  if (war) {
    for (const id of WAR_SUMMONS) consider(id, onCaster);
    for (const id of WAR_STRIKES) consider(id, (_, targets) => strikeTarget(plan, targets));
  } else {
    consider(FORGE, onCaster);
    consider(BOUNTY, () => plan.capital.id);
    consider(FERTILE, (spell) => bestOwnProvince(plan, caster, spell));
  }
  return options;
}

/** The cheapest option, the first listed among equals. */
function cheapest(options: readonly RitualOption[]): RitualOption | null {
  let best: RitualOption | null = null;
  for (const o of options) if (!best || o.cost < best.cost) best = o;
  return best;
}
