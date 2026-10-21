// The AI's recruitment step (docs/08-ai.md priority 2; Phase 7 design "2. Recruitment and
// transfers"): the capital queue, commander quotas, the troop mix, and garrison transfers. A
// mage or the pretender holding troops (summons) hands them to the garrison holder, and the
// capital garrison's troops above AI.capitalGarrison go to the leaders standing there.
import { unitDef, type UnitTypeId } from '../content';
import { AI } from '../content/ai';
import type { NationDef } from '../content/types';
import { troopCount } from '../sim/commanders';
import { validateCommand, type Command } from '../sim/commands';
import { recruitBlock, recruitGold, recruitRequirementError } from '../sim/recruitment';
import { weightedIndex } from '../sim/rng';
import { nationDefOf } from '../sim/state';
import type { CommanderState, RecruitOrder } from '../sim/types';
import { isRanged } from './assess';
import type { Plan } from './plan';
import { isAdeptTier, unitRole, type Role } from './roles';

/** Step 2: hands summons to the garrison, keeps the capital queue filled, and arms leaders. */
export function planRecruitment(plan: Plan): void {
  handOffSquads(plan);
  fillQueue(plan);
  armLeaders(plan);
}

type RecruitCommand = Extract<Command, { type: 'recruit' }>;

function recruitOf(plan: Plan, unit: UnitTypeId, count: number): RecruitCommand {
  return { type: 'recruit', nation: plan.nation, province: plan.capital.id, unit, count };
}

/** The copy would take this recruitment now: the fort, its block, requirements, gold, materials. */
function payable(plan: Plan, cmd: RecruitCommand): boolean {
  return validateCommand(plan.copy, cmd) === null;
}

/** The nation may recruit the unit in its capital, costs aside. */
function recruitable(plan: Plan, unit: UnitTypeId): boolean {
  return recruitRequirementError(plan.copy, plan.nation, plan.capital.id, unit) === null;
}

/** The nation's items in every fort's queue. */
function queued(plan: Plan): RecruitOrder[] {
  return Object.values(plan.copy.provinces).flatMap((p) =>
    p.recruitQueue.filter((item) => item.nation === plan.nation),
  );
}

// ---------------------------------------------------------------- the queue

/**
 * Tops the capital queue up to AI.queue.max items while anything fits. Each item is the first
 * of: a quota commander, unless the queue already holds a commander; the wanted troops; the
 * cheapest troop, only while the queue holds fewer than AI.queue.min items (so the fort always
 * has work, but a further place waits for what is wanted); a quota commander after all, as
 * commanders cost little of the materials troops wait for.
 */
function fillQueue(plan: Plan): void {
  const capital = plan.capital;
  if (capital.owner !== plan.nation || recruitBlock(capital) !== null) return;
  for (;;) {
    const queue = capital.recruitQueue.filter((item) => item.nation === plan.nation);
    if (queue.length >= AI.queue.max) return;
    const item = nextItem(plan, queue);
    if (!item || !plan.issue(item)) return;
  }
}

function nextItem(plan: Plan, queue: readonly RecruitOrder[]): RecruitCommand | null {
  const holdsCommander = queue.some((item) => unitDef(item.unit).commander !== undefined);
  if (!holdsCommander) {
    const commander = wantedCommander(plan);
    if (commander) return commander;
  }
  const troops = wantedTroops(plan);
  if (troops) return troops;
  const cheap = queue.length < AI.queue.min ? cheapestTroops(plan) : null;
  return cheap ?? wantedCommander(plan);
}

// ---------------------------------------------------------------- commanders

/** Roles kept at a quota, in the order a short one is recruited. */
const QUOTA_ROLES: readonly Role[] = ['leader', 'mage', 'priest', 'scout'];

/**
 * How many commanders of a role the nation keeps (rounding down): leaders AI.baseLeaders plus
 * one per AI.provincesPerLeader provinces; mages one per AI.provincesPerMage, at least
 * AI.minMages; priests one per AI.provincesPerPriest; AI.scouts scouts.
 */
export function quota(plan: Plan, role: Role): number {
  const provinces = plan.owned().length;
  switch (role) {
    case 'leader':
      return AI.baseLeaders + Math.floor(provinces / AI.provincesPerLeader);
    case 'mage':
      return Math.max(AI.minMages, Math.floor(provinces / AI.provincesPerMage));
    case 'priest':
      return Math.floor(provinces / AI.provincesPerPriest);
    case 'scout':
      return AI.scouts;
    default:
      return 0;
  }
}

/** Commanders of a role the nation has, counting those in its queues. */
export function roleCount(plan: Plan, role: Role): number {
  const waiting = queued(plan).filter((item) => unitRole(unitDef(item.unit)) === role);
  return plan.withRole(role).length + waiting.length;
}

/**
 * The nation's commander units for a role, in its list order. Mages put the adept tier first
 * while the gold left after it covers AI.goldReserve, and leave it out otherwise.
 */
function roleUnits(plan: Plan, role: Role): UnitTypeId[] {
  const units = nationDefOf(plan.copy, plan.nation).commanders.filter(
    (u) => unitRole(unitDef(u)) === role,
  );
  if (role !== 'mage') return units;
  const gold = plan.nationState.gold;
  const adepts = units.filter(
    (u) =>
      isAdeptTier(unitDef(u)) &&
      gold - recruitGold(plan.copy, plan.capital.id, u, 1) >= AI.goldReserve,
  );
  return [...adepts, ...units.filter((u) => !isAdeptTier(unitDef(u)))];
}

/** The first role below its quota that can be recruited now, as its recruit command. */
function wantedCommander(plan: Plan): RecruitCommand | null {
  for (const role of QUOTA_ROLES) {
    if (roleCount(plan, role) >= quota(plan, role)) continue;
    for (const unit of roleUnits(plan, role)) {
      const cmd = recruitOf(plan, unit, 1);
      if (payable(plan, cmd)) return cmd;
    }
  }
  return null;
}

// ---------------------------------------------------------------- troops

/** Troops by kind: every own squad (field armies and garrisons) and every queued troop item. */
export function troopMix(plan: Plan): { melee: number; ranged: number } {
  const mix = { melee: 0, ranged: 0 };
  const add = (unit: UnitTypeId, count: number) => {
    if (isRanged(unitDef(unit))) mix.ranged += count;
    else mix.melee += count;
  };
  for (const c of plan.own()) for (const s of c.squads) add(s.unit, s.count);
  for (const item of queued(plan)) if (!unitDef(item.unit).commander) add(item.unit, item.count);
  return mix;
}

/** Ranged troops are wanted once melee troops outnumber them more than AI.meleeRangedRatio. */
export function wantsRanged(plan: Plan): boolean {
  const { melee, ranged } = troopMix(plan);
  return melee > AI.meleeRangedRatio * ranged;
}

/**
 * How strongly the nation's personality favors a troop: 1, plus aggression times its gold cost
 * against the nation's dearest troop, plus pillage when it is faster than the nation's slowest
 * troop.
 */
export function troopWeight(nation: NationDef, unit: UnitTypeId): number {
  const troops = nation.troops.map(unitDef);
  const dearest = Math.max(...troops.map((d) => d.cost?.gold ?? 0));
  const slowest = Math.min(...troops.map((d) => d.mapSpeed));
  const def = unitDef(unit);
  const cost = dearest > 0 ? (def.cost?.gold ?? 0) / dearest : 0;
  return 1 + nation.ai.aggression * cost + (def.mapSpeed > slowest ? nation.ai.pillage : 0);
}

/**
 * The wanted troops: a unit of the wanted kind, drawn by personality weight among those whose
 * small batch the treasury can pay, in a batch of AI.batch.large when gold and materials allow,
 * else AI.batch.small, never fewer. Null when no such unit is drawn or its small batch cannot
 * be paid.
 */
function wantedTroops(plan: Plan): RecruitCommand | null {
  const ranged = wantsRanged(plan);
  const gold = plan.nationState.gold;
  const nation = nationDefOf(plan.copy, plan.nation);
  const options = nation.troops.filter(
    (u) =>
      isRanged(unitDef(u)) === ranged &&
      recruitable(plan, u) &&
      recruitGold(plan.copy, plan.capital.id, u, AI.batch.small) <= gold,
  );
  if (options.length === 0) return null;
  const weights = options.map((u) => troopWeight(nation, u));
  const unit = options[weightedIndex(plan.rng, weights)];
  if (unit === undefined) return null;
  for (const count of [AI.batch.large, AI.batch.small]) {
    const cmd = recruitOf(plan, unit, count);
    if (payable(plan, cmd)) return cmd;
  }
  return null;
}

/** A small batch of the nation's cheapest troop (gold, then materials, then list order). */
function cheapestTroops(plan: Plan): RecruitCommand | null {
  const price = (u: UnitTypeId) => recruitGold(plan.copy, plan.capital.id, u, AI.batch.small);
  const materials = (u: UnitTypeId) => unitDef(u).cost?.materials ?? 0;
  const [unit] = nationDefOf(plan.copy, plan.nation)
    .troops.filter((u) => recruitable(plan, u))
    .sort((a, b) => price(a) - price(b) || materials(a) - materials(b));
  if (unit === undefined) return null;
  const cmd = recruitOf(plan, unit, AI.batch.small);
  return payable(plan, cmd) ? cmd : null;
}

// ---------------------------------------------------------------- transfers

/** The garrison holder standing with a commander in an own fort, or null. */
function holderWith(plan: Plan, commander: CommanderState): CommanderState | null {
  const p = plan.copy.provinces[commander.location];
  if (!p || p.owner !== plan.nation || p.garrison === null) return null;
  const holder = plan.copy.commanders[p.garrison];
  return holder && holder.location === commander.location ? holder : null;
}

/**
 * Mages and the pretender lead no troops: one standing with its nation's garrison holder gives
 * it every squad (summons), which then counts toward the reserve and flows to leaders.
 */
function handOffSquads(plan: Plan): void {
  for (const c of plan.own()) {
    const role = plan.role(c);
    if ((role !== 'mage' && role !== 'pretender') || c.transit || c.squads.length === 0) continue;
    const holder = holderWith(plan, c);
    if (!holder) continue;
    for (const squad of [...c.squads]) {
      plan.issue({
        type: 'transferSquad',
        nation: plan.nation,
        from: c.id,
        to: holder.id,
        squad: squad.id,
      });
    }
  }
}

/**
 * Splits `take` troops over squads in proportion to their counts, by largest remainder (the
 * earlier squad among equal remainders), so each share is whole and the shares add up to take.
 */
export function shareOut(take: number, counts: readonly number[]): number[] {
  const total = counts.reduce((sum, n) => sum + n, 0);
  if (total <= 0 || take <= 0) return counts.map(() => 0);
  const whole = Math.min(take, total);
  const exact = counts.map((n) => (whole * n) / total);
  const shares = exact.map((x) => Math.floor(x));
  let left = whole - shares.reduce((sum, n) => sum + n, 0);
  const byRemainder = exact
    .map((x, i) => ({ i, rest: x - Math.floor(x) }))
    .sort((a, b) => b.rest - a.rest);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    const share = shares[i] ?? 0;
    if (share < (counts[i] ?? 0)) {
      shares[i] = share + 1;
      left--;
    }
  }
  return shares;
}

/**
 * The capital garrison's troops above AI.capitalGarrison go to the leaders standing in the
 * capital, each up to its leadership, the one leading most first (it reaches field strength
 * soonest), the oldest among equals. Each leader takes a share of every garrison squad, so the
 * troop mix carries over. The reserve holds from day 0.
 */
function armLeaders(plan: Plan): void {
  const capital = plan.capital;
  if (capital.owner !== plan.nation || capital.garrison === null) return;
  const holder = plan.copy.commanders[capital.garrison];
  if (!holder) return;
  const leaders = plan
    .withRole('leader')
    .filter((c) => c.location === capital.id && c.transit === null)
    .sort((a, b) => troopCount(b) - troopCount(a));
  for (const leader of leaders) {
    const spare = troopCount(holder) - AI.capitalGarrison;
    const room = (unitDef(leader.unit).commander?.leadership ?? 0) - troopCount(leader);
    if (spare <= 0) return;
    if (room <= 0) continue;
    const squads = [...holder.squads];
    const shares = shareOut(
      Math.min(spare, room),
      squads.map((s) => s.count),
    );
    squads.forEach((squad, i) => {
      const count = shares[i] ?? 0;
      if (count <= 0) return;
      plan.issue({
        type: 'transferSquad',
        nation: plan.nation,
        from: holder.id,
        to: leader.id,
        squad: squad.id,
        count,
      });
    });
  }
}
