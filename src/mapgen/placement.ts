// Placement on the province graph: capitals, Wellsprings, springs, starting population,
// and independent defender strength (docs/01-core-rules.md sections 2, 4, 9, 13).
// Every threshold and weight comes from MAPGEN in content/mapgen.ts.
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

/**
 * One of the highest-scoring indices, chosen uniformly among ties, or the first of them when
 * `rng` is null (which draws nothing from the stream).
 */
function bestOf(
  rng: RngState | null,
  indices: readonly number[],
  score: (i: number) => number,
): number {
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
  return rng === null ? (ties[0] ?? -1) : pick(rng, ties);
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/**
 * Farthest-point sampling on the graph: the first capital is the province farthest from a
 * random start, each next one the province farthest from all chosen. The list is then
 * shuffled, so no nation slot always gets the far ends of the map. Returns null when the
 * capitals cannot all be MAPGEN.capitalMinDistance apart.
 */
export function placeCapitals(rng: RngState, adjacency: Adjacency, count: number): number[] | null {
  const all = range(adjacency.length);
  const fromStart = bfsDistances(adjacency, [randBelow(rng, adjacency.length)]);
  const capitals = [bestOf(rng, all, (i) => fromStart[i] ?? 0)];
  while (capitals.length < count) {
    const dist = bfsDistances(adjacency, capitals);
    const next = bestOf(rng, all, (i) => dist[i] ?? 0);
    if ((dist[next] ?? 0) < MAPGEN.capitalMinDistance) return null;
    capitals.push(next);
  }
  return shuffle(rng, capitals);
}

/**
 * How uneven the capitals' starting neighborhoods are: the largest total starting
 * population within MAPGEN.capitalRingRadius hops of a capital (the capital excluded)
 * divided by the smallest. 1 is perfectly even.
 */
export function capitalBalance(
  adjacency: Adjacency,
  capitals: readonly number[],
  pops: readonly number[],
): number {
  const totals = capitals.map((c) => {
    const dist = bfsDistances(adjacency, [c]);
    return pops.reduce(
      (sum, pop, i) => (i !== c && (dist[i] ?? 0) <= MAPGEN.capitalRingRadius ? sum + pop : sum),
      0,
    );
  });
  const poorest = Math.min(...totals);
  return poorest > 0 ? Math.max(...totals) / poorest : Number.POSITIVE_INFINITY;
}

/** Wellsprings a nation must claim to win: a majority (2 of 3, 3 of 5). */
export function wellspringsToWin(count: number): number {
  return Math.floor(count / 2) + 1;
}

/**
 * Wellsprings go in provinces at least MAPGEN.wellspringMinCapitalDistance from every
 * capital and MAPGEN.wellspringMinSeparation from each other. From each of
 * MAPGEN.wellspringSearchStarts random starts, a greedy farthest-point pick seeds a set and
 * single swaps are taken while they lower the cost: unfairness (the spread between nations
 * in total distance to the Wellsprings each needs to win) times
 * MAPGEN.wellspringFairnessWeight, minus the closest pair's separation. The cheapest set
 * wins. When it is still unfair, the same search runs again from every candidate, ties going
 * to the first, so a local optimum of the random starts is not kept (QA sweep map-1). That
 * retry draws nothing from the rng, so maps whose first result is fair are unchanged.
 * Returns null when the constraints cannot be met.
 */
export function placeWellsprings(
  rng: RngState,
  adjacency: Adjacency,
  capitals: readonly number[],
  count: number,
): number[] | null {
  const minSeparation = MAPGEN.wellspringMinSeparation;
  const perCapital = capitals.map((c) => bfsDistances(adjacency, [c]));
  const candidates = shuffle(
    rng,
    range(adjacency.length).filter(
      (i) =>
        !capitals.includes(i) &&
        perCapital.every((d) => (d[i] ?? 0) >= MAPGEN.wellspringMinCapitalDistance),
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
  const unfairness = (set: readonly number[]) => {
    const reach = perCapital.map((d) =>
      set
        .map((w) => d[w] ?? 0)
        .sort((a, b) => a - b)
        .slice(0, need)
        .reduce((sum, x) => sum + x, 0),
    );
    return Math.max(...reach) - Math.min(...reach);
  };
  const cost = (set: readonly number[]) =>
    MAPGEN.wellspringFairnessWeight * unfairness(set) - closestPair(set);

  const search = (start: number, ties: RngState | null): number[] | null => {
    const chosen = [start];
    while (chosen.length < count) {
      const open = candidates.filter(
        (c) => !chosen.includes(c) && chosen.every((w) => gap(w, c) >= minSeparation),
      );
      if (open.length === 0) return null;
      chosen.push(bestOf(ties, open, (c) => Math.min(...chosen.map((w) => gap(w, c)))));
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
  };

  type Found = { set: number[]; cost: number } | null;
  const cheapest = (best: Found, starts: readonly number[], ties: RngState | null): Found => {
    for (const start of starts) {
      const set = search(start, ties);
      if (set === null) continue;
      const setCost = cost(set);
      if (best === null || setCost < best.cost) best = { set, cost: setCost };
    }
    return best;
  };
  const found = cheapest(null, candidates.slice(0, MAPGEN.wellspringSearchStarts), rng);
  if (found === null || unfairness(found.set) === 0) return found?.set ?? null;
  return cheapest(found, candidates, null)?.set ?? null;
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
 * Springs per province. Capitals hold MAPGEN.capitalSprings of their nation's color and
 * Wellsprings hold none (they yield every color by rule). Every other province rolls 0 to 2
 * springs by MAPGEN.springCountWeights, topped up until every color can appear
 * MAPGEN.minSpringsPerColor times. Colors are dealt from a deck holding every color equally
 * often (the remainder to random colors), so no color is short on any map. Slots are dealt
 * in random order; each takes the color its terrain suits (TERRAIN_SPRING_COLORS) with the
 * most copies left, or failing that the color with the most copies left.
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
  const counts = open.map(() => weightedIndex(rng, MAPGEN.springCountWeights));
  let total = counts.reduce((sum, c) => sum + c, 0);
  while (total < COLORS.length * MAPGEN.minSpringsPerColor) {
    const roomy = range(open.length).filter((k) => (counts[k] ?? 0) < maxPerProvince);
    if (roomy.length === 0) break;
    const k = pick(rng, roomy);
    counts[k] = (counts[k] ?? 0) + 1;
    total++;
  }

  const left = new Map<Color, number>();
  shuffle(rng, [...COLORS]).forEach((color, k) => {
    const extra = k < total % COLORS.length ? 1 : 0;
    left.set(color, Math.floor(total / COLORS.length) + extra);
  });
  const mostLeft = (colors: readonly Color[]): Color | undefined => {
    let best: Color | undefined;
    for (const c of colors) {
      if ((left.get(c) ?? 0) > (best === undefined ? 0 : (left.get(best) ?? 0))) best = c;
    }
    return best;
  };

  const slots = shuffle(
    rng,
    open.flatMap((i, k) => new Array<number>(counts[k] ?? 0).fill(i)),
  );
  for (const i of slots) {
    const color = mostLeft(TERRAIN_SPRING_COLORS[terrains[i] ?? 'plains']) ?? mostLeft(COLORS);
    if (color === undefined) break;
    springs[i]?.push(color);
    left.set(color, (left.get(color) ?? 0) - 1);
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
