// seed + size + capitals -> MapData. Pure and deterministic: the same params always give
// the same map. Each attempt draws from the same rng stream, so retries are deterministic
// too. Attempts that fail validation are discarded; among valid maps the first whose capital
// neighborhoods are balanced wins, else the most balanced of MAPGEN.balanceCandidates.
import { isColor } from '../content/colors';
import { MAP_SIZES, MAPGEN } from '../content/mapgen';
import { isTerrainId, type TerrainId } from '../content/terrain';
import { newId, type ProvinceId } from '../sim/ids';
import { createRng, type RngState } from '../sim/rng';
import { centroid, roundedRect } from './geometry';
import { bfsDistances, isConnected } from './graph';
import { nameProvinces } from './names';
import { createSimplex2D, fractal, type Noise2D } from './noise';
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
import { assignTerrain } from './terrain';
import type { MapData, MapGenParams, MapProvince, Point } from './types';
import { validateMap } from './validate';
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

function attempt(
  rng: RngState,
  params: MapGenParams,
  count: number,
  bounds: Bounds,
  outline: readonly Point[],
): Attempt {
  const scale = Math.sqrt(MAPGEN.provinceArea);
  const specs = params.capitals;

  // Geometry: sites, relaxation, cells, adjacency.
  const sampled = poissonDisc(
    rng,
    outline,
    bounds,
    MAPGEN.poissonRadius * scale,
    MAPGEN.poissonTries,
  );
  const sites = lloydRelax(
    adjustCount(rng, sampled, count, outline, bounds, MAPGEN.fillCandidates),
    outline,
    bounds,
    MAPGEN.lloydRounds,
  );
  const cells = voronoiCells(sites, outline, bounds);
  const adj = adjacency(cells, MAPGEN.minSharedEdge * scale, 1e-6 * scale);
  const sparse = adj.findIndex((list) => list.length < MAPGEN.minNeighbors);
  if (cells.polygons.some((p) => p.length < 3)) return { ok: false, problems: ['empty cell'] };
  if (sparse >= 0) return { ok: false, problems: [`cell ${sparse} has too few neighbors`] };
  if (!isConnected(adj)) return { ok: false, problems: ['graph not connected'] };

  // Capitals first, so terrain shares can count their fixed terrain.
  const capitals = placeCapitals(rng, adj, specs.length);
  if (capitals === null) return { ok: false, problems: ['capitals too close'] };
  const capitalTerrain = new Map<number, TerrainId>(
    capitals.map((index, slot) => [index, specs[slot]?.terrain ?? 'plains']),
  );

  // Terrain from noise sampled at the sites.
  const elevationNoise = createSimplex2D(rng);
  const moistureNoise = createSimplex2D(rng);
  const frequency = MAPGEN.noiseFeatures / Math.max(bounds.width, bounds.height);
  const sample = (noise: Noise2D) =>
    sites.map((p) => fractal(noise, p.x * frequency, p.y * frequency, MAPGEN.noiseOctaves));
  const terrains = assignTerrain(sample(elevationNoise), sample(moistureNoise), capitalTerrain);

  const wells = placeWellsprings(rng, adj, capitals, wellspringCount(specs.length));
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
  const pops = terrains.map((terrain, i) => startPopulation(rng, terrain, capitals.includes(i)));
  const nearest = bfsDistances(adj, capitals);

  // Assemble. Coordinates keep full precision so shared vertices stay identical.
  const counter = { nextId: 0 };
  const ids: ProvinceId[] = sites.map(() => newId(counter, 'province'));
  const provinces = {} as Record<ProvinceId, MapProvince>;
  sites.forEach((site, i) => {
    const id = ids[i] as ProvinceId;
    const slot = capitals.indexOf(i);
    const well = wells.indexOf(i);
    const polygon = cells.polygons[i] ?? [];
    const capitalDistance = nearest[i] ?? 0;
    const province: MapProvince = {
      id,
      name: names[i] ?? id,
      terrain: terrains[i] ?? 'plains',
      site,
      center: centroid(polygon),
      polygon,
      neighbors: (adj[i] ?? []).map((j) => ids[j] as ProvinceId),
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

  return {
    ok: true,
    balance: capitalBalance(adj, capitals, pops),
    map: {
      seed: params.seed,
      size: params.size,
      width: bounds.width,
      height: bounds.height,
      outline: [...outline],
      provinces,
      capitals: capitals.map((i) => ids[i] as ProvinceId),
      wellsprings: wells.map((i) => ids[i] as ProvinceId),
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
  const bounds = mapDimensions(count);
  const outline = roundedRect(
    bounds.width,
    bounds.height,
    MAPGEN.cornerRadius * Math.min(bounds.width, bounds.height),
    MAPGEN.cornerSegments,
  );
  let best: { map: MapData; balance: number } | null = null;
  let valid = 0;
  let problems: string[] = [];
  for (let i = 0; i < MAPGEN.maxAttempts && valid < MAPGEN.balanceCandidates; i++) {
    const result = attempt(rng, params, count, bounds, outline);
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
