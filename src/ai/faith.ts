// The AI's priests and pretender (docs/08-ai.md priorities 9 and 10; Phase 7 design "4.
// Priests", "Roles"): Godless defense, Wellspring claims (one priest per Wellspring), the
// prophet, and the work of a pretender that does not fight. Escorts for the claims come from
// the army pass, which runs after the priests.
import { AI } from '../content/ai';
import type { ProvinceId } from '../sim/ids';
import { canResearch, inOwnLab } from '../sim/research';
import type { CommanderState } from '../sim/types';
import { destinationOf, isOwnUnclaimedSpring } from './assess';
import { fewestDays, walk, type Plan } from './plan';
import { pretenderRole } from './roles';

/**
 * Godless danger: no province anchoring the faith (the capital, or a province with a temple)
 * that the nation owns holds its own dominion at AI.godlessAlarm or more.
 */
export function godlessDanger(plan: Plan): boolean {
  return !plan
    .owned()
    .some(
      (p) =>
        (p.id === plan.nationState.capital || p.buildings.includes('temple')) &&
        p.dominion.nation === plan.nation &&
        p.dominion.strength >= AI.godlessAlarm,
    );
}

/** The capital is the nation's, with no other nation's siege: a priest may walk in. */
function capitalOpen(plan: Plan): boolean {
  return plan.capital.owner === plan.nation && plan.capital.siege === null;
}

/** Gives a simple order unless the commander already holds it. */
function order(plan: Plan, c: CommanderState, kind: 'preach' | 'research'): void {
  if (c.order.kind !== kind) {
    plan.issue({ type: 'setOrder', nation: plan.nation, commander: c.id, order: kind });
  }
}

/**
 * A priest preaches in the capital: there, it preaches; elsewhere it walks home, unless the
 * capital is besieged or lost, when it preaches where it stands.
 */
function preachHome(plan: Plan, c: CommanderState): void {
  if (c.transit === null && (c.location === plan.capital.id || !capitalOpen(plan))) {
    order(plan, c, 'preach');
  } else if (capitalOpen(plan)) {
    walk(plan, c, plan.capital.id);
  }
}

/** In Godless danger, every priest that is idle or preaching, and the prophet, preach at home. */
function guardFaith(plan: Plan): void {
  const prophet = plan.nationState.prophetId;
  for (const c of plan.own()) {
    const kind = c.order.kind;
    const priest = plan.role(c) === 'priest' && (kind === 'idle' || kind === 'preach');
    if (priest || c.id === prophet) preachHome(plan, c);
  }
}

/**
 * Wellspring claims: a priest standing in an owned unclaimed Wellspring claims it; free priests
 * (idle, preaching, or walking anywhere but a Wellspring of their own) walk to the nearest one
 * no other priest is claiming or walking to; the rest preach in the capital.
 */
function claimSprings(plan: Plan): void {
  const priests = plan.withRole('priest');
  const taken = new Set<ProvinceId>();
  for (const c of priests) if (c.order.kind === 'claimWellspring') taken.add(c.location);
  const free: CommanderState[] = [];
  for (const c of priests) {
    if (c.order.kind === 'claimWellspring') continue;
    const here = c.transit === null && isOwnUnclaimedSpring(plan, c.location);
    if (here && !taken.has(c.location)) {
      taken.add(c.location);
      plan.issue({ type: 'claimWellspring', nation: plan.nation, commander: c.id });
      continue;
    }
    const to = destinationOf(c);
    if (c.order.kind === 'move' && isOwnUnclaimedSpring(plan, to) && !taken.has(to)) {
      taken.add(to);
      continue;
    }
    const kind = c.order.kind;
    if (kind === 'idle' || kind === 'preach' || kind === 'move') free.push(c);
  }
  const springs = plan
    .owned()
    .filter((p) => isOwnUnclaimedSpring(plan, p.id))
    .map((p) => p.id);
  for (const c of free) {
    const paths = plan.paths([c]);
    const best = fewestDays(springs, (s) => (taken.has(s) ? undefined : paths.days(s)));
    if (best !== null) {
      taken.add(best);
      walk(plan, c, best);
    } else {
      preachHome(plan, c);
    }
  }
}

/** Names the oldest priest prophet whenever the nation may name one. */
function nameProphet(plan: Plan): void {
  const nation = plan.nationState;
  if (nation.prophetId !== null || plan.copy.day < nation.prophetAvailableDay) return;
  const [oldest] = plan.withRole('priest');
  if (oldest) plan.issue({ type: 'makeProphet', nation: plan.nation, commander: oldest.id });
}

/**
 * Step 4: in Godless danger the priests preach at home; otherwise they claim Wellsprings, one
 * priest to each, and preach in the capital when none is left; then a prophet is named.
 */
export function planPriests(plan: Plan): void {
  if (godlessDanger(plan)) guardFaith(plan);
  else claimSprings(plan);
  nameProphet(plan);
}

/**
 * Step 7 (docs/08 step 10, by the chassis's role): a pretender that does not ride goes to its
 * work in the capital: a researcher studies there (and stands idle when it has no color pip to
 * research with); a hidden one, or a rider before AI.pretenderJoinDay, stays there. An idol
 * casts rituals where it stands (magic.ts); after AI.pretenderJoinDay a rider rides with an
 * army.
 */
export function planPretender(plan: Plan): void {
  const id = plan.nationState.pretenderId;
  const pretender = id === null ? undefined : plan.copy.commanders[id];
  if (!pretender) return;
  const role = pretenderRole(plan.copy, pretender);
  if (role === 'ritualist') return;
  if (role === 'rider' && plan.copy.day >= AI.pretenderJoinDay) return;
  if (pretender.transit !== null || pretender.location !== plan.capital.id) {
    if (capitalOpen(plan) && pretender.order.kind === 'idle')
      walk(plan, pretender, plan.capital.id);
    return;
  }
  if (role === 'researcher' && canResearch(pretender) && inOwnLab(plan.copy, pretender)) {
    order(plan, pretender, 'research');
  }
}
