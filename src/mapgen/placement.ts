// Placement on the province graph: capitals, Wellsprings, springs, starting population,
// and independent defender strength (docs/01-core-rules.md sections 2, 4, 9, 13).
import { COLORS, type Color } from '../content/colors';
import { MAPGEN, TERRAIN_SPRING_COLORS } from '../content/mapgen';
import { SCALE_AXES, type ScaleStep } from '../content/pretenders/scales';
import { TERRAIN, type TerrainId } from '../content/terrain';
import {
  chance,
  pick,
  randBelow,
  randInt,
  shuffle,
  weightedIndex,
  type RngState,
} from '../sim/rng';
import { bfsDistances } from './graph';

type Adjacency = readonly (readonly number[])[];

/** One of the highest-scoring indices, chosen uniformly among ties. */
function bestOf(rng: RngState, indices: readonly number[], score: (i: number) => number): number {
  let best = Number.NEGATIVE_INFINITY;
  let ties: number[] = [];
  for (const i of indices) {
    const s = score(i);
    if (s > best) {
      best = s;
      ties = [i];
    } else if (s === best) {
      ties.push(i);
    }
  }
  return pick(rng, ties);
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/**
 * Farthest-point sampling on the graph: the first capital is the province farthest from a
 * random start, each next one the province farthest from all chosen. Returns null when
 * the capitals cannot all be `minDistance` apart.
 */
export function placeCapitals(
  rng: RngState,
  adjacency: Adjacency,
  count: number,
  minDistance: number,
): number[] | null {
  const all = range(adjacency.length);
  const fromStart = bfsDistances(adjacency, [randBelow(rng, adjacency.length)]);
  const capitals = [bestOf(rng, all, (i) => fromStart[i] ?? 0)];
  while (capitals.length < count) {
    const dist = bfsDistances(adjacency, capitals);
    const next = bestOf(rng, all, (i) => dist[i] ?? 0);
    if ((dist[next] ?? 0) < minDistance) return null;
    capitals.push(next);
  }
  return capitals;
}

/** Wellsprings a nation must claim to win: a majority (2 of 3, 3 of 5). */
export function wellspringsToWin(count: number): number {
  return Math.floor(count / 2) + 1;
}

/**
 * Wellsprings go in provinces at least `minDistance` from every capital and at least
 * `minSeparation` from each other. A greedy farthest-point pick seeds the set; then single
 * swaps are taken while they lower the cost: unfairness (the spread between nations in
 * total distance to the Wellsprings each needs to win) weighted by
 * `wellspringFairnessWeight`, minus the closest pair's separation. Returns null when the
 * constraints cannot be met.
 */
export function placeWellsprings(
  rng: RngState,
  adjacency: Adjacency,
  capitals: readonly number[],
  count: number,
  minDistance: number,
  minSeparation: number,
): number[] | null {
  const perCapital = capitals.map((c) => bfsDistances(adjacency, [c]));
  const candidates = shuffle(
    rng,
    range(adjacency.length).filter(
      (i) => !capitals.includes(i) && perCapital.every((d) => (d[i] ?? 0) >= minDistance),
    ),
  );
  if (candidates.length < count) return null;

  const fromCandidate = new Map(candidates.map((c) => [c, bfsDistances(adjacency, [c])]));
  const gap = (a: number, b: number) => fromCandidate.get(a)?.[b] ?? 0;
  const closestPair = (set: readonly number[]) => {
    let closest = Number.POSITIVE_INFINITY;
    for (let a = 0; a < set.length; a++) {
      for (let b = a + 1; b < set.length; b++) {
        closest = Math.min(closest, gap(set[a] ?? 0, set[b] ?? 0));
      }
    }
    return closest;
  };
  const need = wellspringsToWin(count);
  const cost = (set: readonly number[]) => {
    const reach = perCapital.map((d) =>
      set
        .map((w) => d[w] ?? 0)
        .sort((a, b) => a - b)
        .slice(0, need)
        .reduce((sum, x) => sum + x, 0),
    );
    const unfairness = Math.max(...reach) - Math.min(...reach);
    return MAPGEN.wellspringFairnessWeight * unfairness - closestPair(set);
  };

  const chosen = [candidates[0] ?? 0];
  while (chosen.length < count) {
    const open = candidates.filter(
      (c) => !chosen.includes(c) && chosen.every((w) => gap(w, c) >= minSeparation),
    );
    if (open.length === 0) return null;
    chosen.push(bestOf(rng, open, (c) => Math.min(...chosen.map((w) => gap(w, c)))));
  }

  let current = cost(chosen);
  let improved = true;
  for (let pass = 0; improved && pass < MAPGEN.wellspringSearchPasses; pass++) {
    improved = false;
    for (let k = 0; k < chosen.length; k++) {
      for (const c of candidates) {
        if (chosen.includes(c)) continue;
        const trial = chosen.with(k, c);
        if (closestPair(trial) < minSeparation) continue;
        const trialCost = cost(trial);
        if (trialCost < current) {
          chosen[k] = c;
          current = trialCost;
          improved = true;
        }
      }
    }
  }
  return chosen;
}

/** The scale step each Wellspring grants: distinct axes while they last, random poles. */
export function wellspringSteps(rng: RngState, count: number): ScaleStep[] {
  const axes = shuffle(rng, [...SCALE_AXES]);
  return range(count).map((k) => ({
    axis: axes[k % axes.length] ?? 'order',
    step: chance(rng, 0.5) ? 1 : -1,
  }));
}

/**
 * Springs per province. Capitals hold `capitalSprings` of their nation's color and
 * Wellsprings hold none (they yield every color by rule). Other provinces roll 0 to 2
 * springs in their terrain's colors, then colors short of `minSpringsPerColor` are added
 * where a province has room, preferring terrain that suits the color.
 */
export function placeSprings(
  rng: RngState,
  terrains: readonly TerrainId[],
  capitals: readonly { index: number; color: Color }[],
  wellsprings: readonly number[],
): Color[][] {
  const springs: Color[][] = terrains.map(() => []);
  const reserved = new Set([...capitals.map((c) => c.index), ...wellsprings]);
  for (const { index, color } of capitals) {
    springs[index] = new Array<Color>(MAPGEN.capitalSprings).fill(color);
  }

  const open = range(terrains.length).filter((i) => !reserved.has(i));
  const maxPerProvince = MAPGEN.springCountWeights.length - 1;
  const colorsFor = (i: number) => TERRAIN_SPRING_COLORS[terrains[i] ?? 'plains'];
  for (const i of open) {
    const count = weightedIndex(rng, MAPGEN.springCountWeights);
    for (let k = 0; k < count; k++) springs[i]?.push(pick(rng, colorsFor(i)));
  }

  for (const color of COLORS) {
    let have = open.reduce((n, i) => n + (springs[i]?.filter((c) => c === color).length ?? 0), 0);
    while (have < MAPGEN.minSpringsPerColor) {
      const roomy = open.filter((i) => (springs[i]?.length ?? 0) < maxPerProvince);
      if (roomy.length === 0) break;
      const suited = roomy.filter((i) => colorsFor(i).includes(color));
      springs[pick(rng, suited.length > 0 ? suited : roomy)]?.push(color);
      have++;
    }
  }
  return springs;
}

/** Starting population: the capital value, or uniform in the terrain's range, rounded. */
export function startPopulation(rng: RngState, terrain: TerrainId, isCapital: boolean): number {
  if (isCapital) return MAPGEN.capitalPop;
  const { min, max } = TERRAIN[terrain].startPop;
  const step = MAPGEN.popRounding;
  return randInt(rng, Math.ceil(min / step), Math.floor(max / step)) * step;
}

/** Independent defenders at game start: none in capitals, a fixed guard on Wellsprings. */
export function independentStrength(
  capitalDistance: number,
  isCapital: boolean,
  isWellspring: boolean,
): number {
  if (isCapital) return 0;
  if (isWellspring) return MAPGEN.wellspringStrength;
  return MAPGEN.independentBase + MAPGEN.independentPerDistance * capitalDistance;
}
