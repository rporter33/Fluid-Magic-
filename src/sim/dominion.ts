// Dominion (docs/01-core-rules.md section 12): pushes, the monthly spread, and Godless. One step
// is what a successful spread check does; rituals push several steps at once.
import { DOMINION } from '../content/rules';
import type { NationId, ProvinceId } from './ids';
import { postMessage } from './messages';
import { chassisOf } from './pretender';
import { chance, pick, randInt, shuffle } from './rng';
import { nationScales, scaleEffect } from './scales';
import { dominionScore } from './selectors';
import { getMapProvince, getNation, getProvince } from './state';
import type { GameState, ProvinceState } from './types';

/**
 * Pushes a province's dominion `steps` times toward a nation. Each step: an empty or own
 * province gains 1, up to the nation's dominion score (never lowered by it); another nation's
 * dominion loses 1 and the province is left without dominion at 0, so later steps build the
 * pusher's.
 */
export function pushDominion(
  state: GameState,
  provinceId: ProvinceId,
  nation: NationId,
  steps: number,
  cap = dominionScore(state, nation),
): void {
  const dominion = getProvince(state, provinceId).dominion;
  for (let i = 0; i < steps; i++) {
    if (dominion.nation === null || dominion.nation === nation || dominion.strength <= 0) {
      dominion.nation = nation;
      if (dominion.strength < cap) dominion.strength += 1;
      continue;
    }
    dominion.strength -= 1;
    if (dominion.strength <= 0) {
      dominion.nation = null;
      dominion.strength = 0;
    }
  }
}

/** One spread check of a nation, from a province. */
interface Check {
  nation: NationId;
  from: ProvinceId;
}

/**
 * Every check a nation makes this month, source by source: its capital, its temples (more with
 * Sanctity), its pretender (twice as many for the Monolith), its prophet, and its preaching
 * priests (one per holy pip, one more in its own temple's province).
 */
export function dominionChecks(state: GameState, nationId: NationId): Check[] {
  const nation = getNation(state, nationId);
  const out: Check[] = [];
  const add = (from: ProvinceId, n: number) => {
    for (let i = 0; i < n; i++) out.push({ nation: nationId, from });
  };
  if (getProvince(state, nation.capital).owner === nationId) {
    add(nation.capital, DOMINION.capitalChecks);
  }
  const perTemple =
    DOMINION.templeChecks + scaleEffect(nationScales(state, nationId), 'templeChecks');
  for (const id of Object.keys(state.map.provinces) as ProvinceId[]) {
    const p = getProvince(state, id);
    if (p.owner === nationId && p.buildings.includes('temple')) add(id, perTemple);
  }
  const pretender = nation.pretenderId === null ? undefined : state.commanders[nation.pretenderId];
  if (pretender) {
    const factor = chassisOf(state, nationId)?.dominionFactor ?? 1;
    add(pretender.location, DOMINION.pretenderChecks * factor);
  }
  const prophet = nation.prophetId === null ? undefined : state.commanders[nation.prophetId];
  if (prophet) add(prophet.location, DOMINION.prophetChecks);
  for (const c of Object.values(state.commanders)) {
    if (c.owner !== nationId || c.order.kind !== 'preach' || c.transit || c.holy <= 0) continue;
    const p = getProvince(state, c.location);
    const temple = p.owner === nationId && p.buildings.includes('temple');
    add(c.location, c.holy + (temple ? DOMINION.templePreachBonus : 0));
  }
  return out;
}

/**
 * Tick step 5, last day of the month: every nation's checks, shuffled together so no nation
 * always pushes last. A check lands on its own province (40%) or a random neighbor, and pushes
 * one step if 1d10 is at most the nation's dominion score. Owners hear of provinces whose
 * dominating nation changed.
 */
export function spreadDominion(state: GameState): void {
  const nations = Object.values(state.nations).filter((n) => !n.eliminated);
  const before = new Map(
    Object.values(state.provinces).map((p) => [p.id, p.dominion.nation] as const),
  );
  const scores = new Map(nations.map((n) => [n.id, dominionScore(state, n.id)] as const));
  const checks = shuffle(
    state.rng,
    nations.flatMap((n) => dominionChecks(state, n.id)),
  );
  for (const { nation, from } of checks) {
    const target = chance(state.rng, DOMINION.sameProvinceChance)
      ? from
      : pick(state.rng, getMapProvince(state, from).neighbors);
    const score = scores.get(nation) ?? 0;
    if (randInt(state.rng, 1, DOMINION.checkDie) <= score) {
      pushDominion(state, target, nation, 1, score);
    }
  }
  for (const p of Object.values(state.provinces)) {
    const was = before.get(p.id) ?? null;
    if (p.owner === null || p.dominion.nation === was) continue;
    const now = p.dominion.nation === null ? 'no one' : getNation(state, p.dominion.nation).name;
    const name = getMapProvince(state, p.id).name;
    postMessage(state, p.owner, 'dominion', `${name} is now under the dominion of ${now}.`, p.id);
  }
}

/**
 * Godless (docs/01 section 12): the nation's capital is not under its own dominion, and no
 * temple it owns is either. A temple standing under another nation's dominion keeps no faith.
 */
export function isGodless(state: GameState, nationId: NationId): boolean {
  const own = (p: ProvinceState) => p.dominion.nation === nationId && p.dominion.strength > 0;
  if (own(getProvince(state, getNation(state, nationId).capital))) return false;
  return !Object.values(state.provinces).some(
    (p) => p.owner === nationId && p.buildings.includes('temple') && own(p),
  );
}

/** Tick step 5, after the spread: each nation's Godless state, with a message when it changes. */
export function updateGodless(state: GameState): void {
  for (const nation of Object.values(state.nations)) {
    if (nation.eliminated) continue;
    const godless = isGodless(state, nation.id);
    if (godless === nation.godless) continue;
    nation.godless = godless;
    postMessage(
      state,
      nation.id,
      'dominion',
      godless
        ? `${nation.name} is godless: no rituals, and the pretender is recalled.`
        : `${nation.name} has its faith again.`,
    );
  }
}
