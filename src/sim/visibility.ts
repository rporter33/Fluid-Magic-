// Fog of war (docs/01-core-rules.md section 14). Everyone sees terrain and ownership. A
// nation sees other nations' armies near its provinces and armies, and farther with scouts;
// population and springs are known once a province has been owned or scouted. Only the
// explored list is stored; the rest is computed on demand. The AI ignores fog in M1.
import { unitDef } from '../content';
import type { StrengthWord } from '../content/independents';
import { VISION } from '../content/rules';
import { isGarrisonHolder, isStealthy } from './commanders';
import type { NationId, ProvinceId } from './ids';
import { independentCount, strengthWord } from './independents';
import { postMessage } from './messages';
import { getMapProvince, getNation } from './state';
import type { CommanderState, GameState } from './types';

/** Provinces within `radius` steps of `origin`, origin included, added to `into`. */
function addWithin(
  state: GameState,
  origin: ProvinceId,
  radius: number,
  into: Set<ProvinceId>,
): void {
  into.add(origin);
  if (radius <= 0) return;
  // Sights of 1 and 2 (every commander and scout in M1) expand directly; `into` dedupes.
  if (radius <= 2) {
    for (const n of getMapProvince(state, origin).neighbors) {
      into.add(n);
      if (radius === 2) for (const m of getMapProvince(state, n).neighbors) into.add(m);
    }
    return;
  }
  let frontier = [origin];
  const seen = new Set<ProvinceId>([origin]);
  for (let step = 0; step < radius; step++) {
    const next: ProvinceId[] = [];
    for (const p of frontier) {
      for (const n of getMapProvince(state, p).neighbors) {
        if (seen.has(n)) continue;
        seen.add(n);
        into.add(n);
        next.push(n);
      }
    }
    frontier = next;
  }
}

/** Scouts carry their own sight; everyone else sees adjacent provinces. */
export function commanderSight(commander: CommanderState): number {
  return unitDef(commander.unit).commander?.sight ?? VISION.baseSight;
}

export function isScout(commander: CommanderState): boolean {
  return unitDef(commander.unit).commander?.sight !== undefined;
}

/**
 * Every nation's vision: the provinces where it sees other nations' armies. Each place a
 * nation looks from is expanded once, at the widest sight anyone has there.
 */
export function allVision(state: GameState): Map<NationId, Set<ProvinceId>> {
  const origins = new Map<NationId, Map<ProvinceId, number>>();
  for (const id of Object.keys(state.nations) as NationId[]) origins.set(id, new Map());
  const look = (nation: NationId | null, from: ProvinceId, sight: number) => {
    const mine = nation === null ? undefined : origins.get(nation);
    if (mine && (mine.get(from) ?? -1) < sight) mine.set(from, sight);
  };
  for (const p of Object.values(state.provinces)) look(p.owner, p.id, VISION.baseSight);
  // A garrison holder only stands in its own fort, which the owner already sees from.
  for (const c of Object.values(state.commanders)) {
    if (!isGarrisonHolder(c)) look(c.owner, c.location, commanderSight(c));
  }
  const result = new Map<NationId, Set<ProvinceId>>();
  for (const [nation, from] of origins) {
    const vision = new Set<ProvinceId>();
    for (const [origin, sight] of from) addWithin(state, origin, sight, vision);
    result.set(nation, vision);
  }
  return result;
}

export function visionOf(state: GameState, nation: NationId): Set<ProvinceId> {
  return allVision(state).get(nation) ?? new Set();
}

/** Whether other nations can see a commander in their vision: not stealthy, and a garrison
 * holder only while it keeps troops. */
function showable(c: CommanderState): boolean {
  return c.owner !== null && !isStealthy(c) && (!isGarrisonHolder(c) || c.squads.length > 0);
}

/** Every nation's visible enemy commanders, from one pass over vision and commanders. */
function allVisible(state: GameState): Map<NationId, CommanderState[]> {
  const byProvince = new Map<ProvinceId, CommanderState[]>();
  for (const c of Object.values(state.commanders)) {
    if (!showable(c)) continue;
    const list = byProvince.get(c.location);
    if (list) list.push(c);
    else byProvince.set(c.location, [c]);
  }
  const result = new Map<NationId, CommanderState[]>();
  for (const [nation, vision] of allVision(state)) {
    const seen: CommanderState[] = [];
    for (const p of vision) {
      for (const c of byProvince.get(p) ?? []) if (c.owner !== nation) seen.push(c);
    }
    result.set(nation, seen);
  }
  return result;
}

/** Other nations' commanders this nation can see. */
export function visibleCommanders(state: GameState, nation: NationId): CommanderState[] {
  return allVisible(state).get(nation) ?? [];
}

/**
 * Adds every province each nation owns or its scouts see to its explored list (tick step 6,
 * and once at game start). New provinces are appended, so the list keeps discovery order.
 */
export function updateExplored(state: GameState): void {
  const seen = new Map<NationId, Set<ProvinceId>>();
  for (const nation of Object.values(state.nations)) {
    if (!nation.eliminated) seen.set(nation.id, new Set());
  }
  for (const p of Object.values(state.provinces)) {
    if (p.owner !== null) seen.get(p.owner)?.add(p.id);
  }
  for (const c of Object.values(state.commanders)) {
    const set = c.owner === null ? undefined : seen.get(c.owner);
    if (set && isScout(c)) addWithin(state, c.location, commanderSight(c), set);
  }
  for (const [id, set] of seen) {
    const nation = getNation(state, id);
    const known = new Set(nation.explored);
    for (const p of set) {
      if (!known.has(p)) nation.explored.push(p);
    }
  }
}

export function isExplored(state: GameState, nation: NationId, province: ProvinceId): boolean {
  return getNation(state, nation).explored.includes(province);
}

/**
 * What a nation knows of a province's independent defenders: a strength word everywhere, the
 * exact troop count where one of its scouts is in or next to the province.
 */
export function independentStrengthView(
  state: GameState,
  nation: NationId,
  province: ProvinceId,
): { word: StrengthWord; exact: number | null } {
  const count = independentCount(state, province);
  const near = new Set<ProvinceId>();
  for (const c of Object.values(state.commanders)) {
    if (c.owner === nation && isScout(c))
      addWithin(state, c.location, VISION.scoutExactRange, near);
  }
  return { word: strengthWord(count), exact: near.has(province) ? count : null };
}

/**
 * Tick step 6, part 2: each nation's enemy armies in sight now replace those it saw at the end
 * of the last day, and every army newly in sight posts a 'sighted' message, one per province
 * and enemy nation.
 */
export function updateSightings(state: GameState): void {
  const now = allVisible(state);
  for (const nation of Object.values(state.nations)) {
    if (nation.eliminated) continue;
    const visible = now.get(nation.id) ?? [];
    const before = new Set(nation.inSight);
    const reported = new Set<string>();
    for (const c of visible) {
      if (before.has(c.id) || c.owner === null) continue;
      const key = `${c.location} ${c.owner}`;
      if (reported.has(key)) continue;
      reported.add(key);
      const where = getMapProvince(state, c.location).name;
      const who = getNation(state, c.owner).name;
      postMessage(state, nation.id, 'sighted', `${who} army sighted in ${where}.`, c.location);
    }
    nation.inSight = visible.map((c) => c.id);
  }
}
