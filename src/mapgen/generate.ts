// seed + size + capitals -> MapData. Pure and deterministic: the same params always give
// the same map. Each attempt draws from the same rng stream, so retries are deterministic
// too. Attempts that fail validation are discarded; among valid maps the first whose capital
// neighborhoods are balanced wins, else the most balanced of MAPGEN.balanceCandidates.
// With params.wilds (Phase 1b) an attempt also plans wild ranges, makes cells for them beyond
// the province count, places them after the capitals and the noise, and builds the provinces
// from the cells that remain (wilds.ts). Without it every step and draw is as before.
// No placement loop spins (docs/10 Phase 1): each has a fixed cap from MAPGEN or WILDS and takes
// a shortfall, and a shortfall outside the tolerance (the exact province count, every rule of
// validateMap) fails the attempt with its reason; if no attempt in MAPGEN.maxAttempts succeeds,
// generateMap throws with the last one's reasons.
import { isColor } from '../content/colors';
import { MAP_SIZES, MAPGEN } from '../content/mapgen';
import { isTerrainId, type TerrainId } from '../content/terrain';
import { newId, type ProvinceId } from '../sim/ids';
import { createRng, type RngState } from '../sim/rng';
import { centroid, roundedRect, touchesOutline } from './geometry';
import { bfsDistances, isConnected } from './graph';
import { nameProvinces } from './names';
import {
  capitalBalance,
  independentStrength,
  placeCapitals,
  placeSprings,
  placeWellsprings,
  startPopulation,
  wellspringSteps,
} from './placement';
import { mapDimensions, provinceCount, wellspringCount } from './size';
import { assignTerrain, terrainFields } from './terrain';
import type { MapData, MapGenParams, MapProvince, Point } from './types';
import { validateMap } from './validate';
import { buildWilds, nameWilds, placeWilds, planWilds, type WildPlan } from './wilds';
import {
  adjacency,
  adjustCount,
  lloydRelax,
  poissonDisc,
  voronoiCells,
  type Bounds,
} from './voronoi';

type Attempt = { ok: true; map: MapData; balance: number } | { ok: false; problems: string[] };

function checkParams(params: MapGenParams): void {
  if (!Number.isFinite(params.seed)) throw new RangeError(`seed must be finite`);
  if (!Object.hasOwn(MAP_SIZES, params.size)) {
    throw new RangeError(`unknown map size ${params.size}`);
  }
  const nations = params.capitals.length;
  if (nations < MAPGEN.minNations || nations > MAPGEN.maxNations) {
    throw new RangeError(
      `need ${MAPGEN.minNations} to ${MAPGEN.maxNations} nations, got ${nations}`,
    );
  }
  for (const spec of params.capitals) {
    if (!isColor(spec.color) || !isTerrainId(spec.terrain) || spec.name.length === 0) {
      throw new RangeError(`bad capital spec ${JSON.stringify(spec)}`);
    }
  }
}

/** The map rectangle for `cells` cells and its rounded outline. */
interface Frame {
  bounds: Bounds;
  outline: Point[];
}

function frameFor(cells: number): Frame {
  const bounds = mapDimensions(cells);
  const outline = roundedRect(
    bounds.width,
    bounds.height,
    MAPGEN.cornerRadius * Math.min(bounds.width, bounds.height),
    MAPGEN.cornerSegments,
  );
  return { bounds, outline };
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function attempt(rng: RngState, params: MapGenParams, count: number, frame: Frame): Attempt {
  const scale = Math.sqrt(MAPGEN.provinceArea);
  const specs = params.capitals;

  // Wilds are planned first: their cells come on top of the provinces, and the map grows so
  // every province keeps its mean area.
  const plan: WildPlan[] = params.wilds === true ? planWilds(rng, count) : [];
  const total = count + plan.reduce((sum, w) => sum + w.cells, 0);
  const { bounds, outline } = plan.length > 0 ? frameFor(total) : frame;

  // Geometry: sites, relaxation, cells, adjacency.
  const sampled = poissonDisc(
    rng,
    outline,
    bounds,
    MAPGEN.poissonRadius * scale,
    MAPGEN.poissonTries,
    MAPGEN.pointTries,
  );
  const placed = adjustCount(
    rng,
    sampled,
    total,
    outline,
    bounds,
    MAPGEN.fillCandidates,
    MAPGEN.pointTries,
  );
  if (placed.length < total) {
    const missing = `${String(total - placed.length)} of ${String(total)} sites`;
    return { ok: false, problems: [`${missing} found no point inside the outline`] };
  }
  const sites = lloydRelax(placed, outline, bounds, MAPGEN.lloydRounds);
  const cells = voronoiCells(sites, outline, bounds);
  const adj = adjacency(cells, MAPGEN.minSharedEdge * scale, 1e-6 * scale);
  const sparse = adj.findIndex((list) => list.length < MAPGEN.minNeighbors);
  if (cells.polygons.some((p) => p.length < 3)) return { ok: false, problems: ['empty cell'] };
  if (sparse >= 0) return { ok: false, problems: [`cell ${sparse} has too few neighbors`] };
  if (!isConnected(adj)) return { ok: false, problems: ['graph not connected'] };

  // Capitals first, on every cell, so terrain shares can count their fixed terrain.
  const capitalCells = placeCapitals(rng, adj, specs.length);
  if (capitalCells === null) return { ok: false, problems: ['capitals too close'] };

  // Noise sampled at every site.
  const { elevation, moisture } = terrainFields(rng, sites, bounds);

  // Wilds, then provinces from the cells that remain, re-indexed in site order.
  let ranges: number[][] = [];
  if (plan.length > 0) {
    const tolerance = 1e-6 * scale;
    const interior = cells.polygons.map((p) => !touchesOutline(p, outline, tolerance));
    const placed = placeWilds(plan, {
      adjacency: adj,
      capitals: capitalCells,
      interior,
      elevation,
      moisture,
    });
    if (placed === null) return { ok: false, problems: ['no room for wilds'] };
    ranges = placed;
  }
  const isWild = new Set(ranges.flat());
  const cellOf = range(total).filter((c) => !isWild.has(c));
  const indexOfCell = new Map(cellOf.map((c, i) => [c, i]));
  const graph = cellOf.map((c) =>
    (adj[c] ?? []).flatMap((n) => {
      const i = indexOfCell.get(n);
      return i === undefined ? [] : [i];
    }),
  );
  const capitals = capitalCells.map((c) => indexOfCell.get(c) ?? 0);
  const capitalTerrain = new Map<number, TerrainId>(
    capitals.map((index, slot) => [index, specs[slot]?.terrain ?? 'plains']),
  );
  const terrains = assignTerrain(
    cellOf.map((c) => elevation[c] ?? 0),
    cellOf.map((c) => moisture[c] ?? 0),
    capitalTerrain,
  );

  const wells = placeWellsprings(rng, graph, capitals, wellspringCount(specs.length));
  if (wells === null) return { ok: false, problems: ['no room for Wellsprings'] };
  const steps = wellspringSteps(rng, wells.length);
  const springs = placeSprings(
    rng,
    terrains,
    capitals.map((index, slot) => ({ index, color: specs[slot]?.color ?? 'W' })),
    wells,
  );
  const names = nameProvinces(
    rng,
    terrains,
    capitals.map((index, slot) => [index, specs[slot]?.name ?? ''] as const),
  );
  const wildNames = nameWilds(
    rng,
    plan.map((w) => w.kind),
    new Set(names),
  );
  const pops = terrains.map((terrain, i) => startPopulation(rng, terrain, capitals.includes(i)));
  const nearest = bfsDistances(graph, capitals);

  // Assemble. Coordinates keep full precision so shared vertices stay identical.
  const counter = { nextId: 0 };
  const ids: ProvinceId[] = cellOf.map(() => newId(counter, 'province'));
  const provinces = {} as Record<ProvinceId, MapProvince>;
  cellOf.forEach((cell, i) => {
    const id = ids[i] as ProvinceId;
    const slot = capitals.indexOf(i);
    const well = wells.indexOf(i);
    const polygon = cells.polygons[cell] ?? [];
    const capitalDistance = nearest[i] ?? 0;
    const province: MapProvince = {
      id,
      name: names[i] ?? id,
      terrain: terrains[i] ?? 'plains',
      site: sites[cell] ?? centroid(polygon),
      center: centroid(polygon),
      polygon,
      neighbors: (graph[i] ?? []).map((j) => ids[j] as ProvinceId),
      capitalDistance,
      startPop: pops[i] ?? 0,
      springs: springs[i] ?? [],
      independentStrength: independentStrength(capitalDistance, slot >= 0, well >= 0),
    };
    if (slot >= 0) province.capitalSlot = slot;
    const step = steps[well];
    if (step !== undefined) province.wellspring = step;
    provinces[id] = province;
  });

  const provinceOfCell = new Map(cellOf.map((c, i) => [c, ids[i] as ProvinceId]));
  return {
    ok: true,
    balance: capitalBalance(graph, capitals, pops),
    map: {
      seed: params.seed,
      size: params.size,
      width: bounds.width,
      height: bounds.height,
      outline: [...outline],
      provinces,
      capitals: capitals.map((i) => ids[i] as ProvinceId),
      wellsprings: wells.map((i) => ids[i] as ProvinceId),
      // Last, where the migration to STATE_VERSION 4 appends it.
      wilds: buildWilds(plan, ranges, wildNames, cells.polygons, adj, provinceOfCell),
    },
  };
}

/**
 * Generates the map for `params`. Throws if no valid map is found within
 * MAPGEN.maxAttempts attempts.
 */
export function generateMap(params: MapGenParams): MapData {
  checkParams(params);
  const rng = createRng(params.seed);
  const count = provinceCount(params.size, params.capitals.length);
  const frame = frameFor(count);
  let best: { map: MapData; balance: number } | null = null;
  let valid = 0;
  let problems: string[] = [];
  for (let i = 0; i < MAPGEN.maxAttempts && valid < MAPGEN.balanceCandidates; i++) {
    const result = attempt(rng, params, count, frame);
    problems = result.ok ? validateMap(result.map, params) : result.problems;
    if (!result.ok || problems.length > 0) continue;
    valid++;
    if (best === null || result.balance < best.balance) best = result;
    if (result.balance <= MAPGEN.capitalBalanceRatio) break;
  }
  if (best === null) {
    throw new Error(`no valid map for seed ${params.seed}: ${problems.join('; ')}`);
  }
  return best.map;
}
