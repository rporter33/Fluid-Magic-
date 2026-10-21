// seed + size + capitals -> MapData. Pure and deterministic: the same params always give
// the same map. A failed attempt (too few neighbors, capitals too close) retries with the
// rng's next values, so retries are deterministic too.
import { isColor } from '../content/colors';
import { MAP_SIZES, MAPGEN } from '../content/mapgen';
import { isTerrainId } from '../content/terrain';
import { newId, type ProvinceId } from '../sim/ids';
import { createRng, type RngState } from '../sim/rng';
import { centroid, roundedRect } from './geometry';
import { bfsDistances, isConnected } from './graph';
import { nameProvinces } from './names';
import { createSimplex2D, fractal } from './noise';
import {
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

type Attempt = { ok: true; map: MapData } | { ok: false; problems: string[] };

/** Coordinates are stored to 0.01 map units. */
function roundPoint(p: Point): Point {
  return { x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 };
}

function checkParams(params: MapGenParams): void {
  if (!Number.isFinite(params.seed)) throw new RangeError(`seed must be finite`);
  if (!Object.hasOwn(MAP_SIZES, params.size))
    throw new RangeError(`unknown map size ${params.size}`);
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

  // Geometry: sites, relaxation, cells, adjacency.
  const sampled = poissonDisc(
    rng,
    outline,
    bounds,
    MAPGEN.poissonRadius * scale,
    MAPGEN.poissonTries,
  );
  const sites = lloydRelax(
    adjustCount(rng, sampled, count, outline, bounds, MAPGEN.poissonTries),
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

  // Terrain from noise sampled at the sites.
  const elevationNoise = createSimplex2D(rng);
  const moistureNoise = createSimplex2D(rng);
  const frequency = MAPGEN.noiseFeatures / Math.max(bounds.width, bounds.height);
  const sample = (noise: typeof elevationNoise) =>
    sites.map((p) => fractal(noise, p.x * frequency, p.y * frequency, MAPGEN.noiseOctaves));
  const terrains = assignTerrain(sample(elevationNoise), sample(moistureNoise));

  // Capitals take their nation's terrain.
  const capitals = placeCapitals(rng, adj, params.capitals.length, MAPGEN.capitalMinDistance);
  if (capitals === null) return { ok: false, problems: ['capitals too close'] };
  capitals.forEach((index, slot) => {
    terrains[index] = params.capitals[slot]?.terrain ?? terrains[index] ?? 'plains';
  });
  const wells = placeWellsprings(
    rng,
    adj,
    capitals,
    wellspringCount(params.capitals.length),
    MAPGEN.wellspringMinCapitalDistance,
    MAPGEN.wellspringMinSeparation,
  );
  if (wells === null) return { ok: false, problems: ['no room for Wellsprings'] };
  const steps = wellspringSteps(rng, wells.length);

  const springs = placeSprings(
    rng,
    terrains,
    capitals.map((index, slot) => ({ index, color: params.capitals[slot]?.color ?? 'W' })),
    wells,
  );
  const names = nameProvinces(
    rng,
    terrains,
    capitals.map((index, slot) => [index, params.capitals[slot]?.name ?? ''] as const),
  );
  const nearest = bfsDistances(adj, capitals);

  // Assemble.
  const counter = { nextId: 0 };
  const ids: ProvinceId[] = sites.map(() => newId(counter, 'province'));
  const provinces = {} as Record<ProvinceId, MapProvince>;
  sites.forEach((site, i) => {
    const id = ids[i] as ProvinceId;
    const terrain = terrains[i] ?? 'plains';
    const slot = capitals.indexOf(i);
    const well = wells.indexOf(i);
    const polygon = cells.polygons[i] ?? [];
    const capitalDistance = nearest[i] ?? 0;
    const province: MapProvince = {
      id,
      name: names[i] ?? id,
      terrain,
      site: roundPoint(site),
      center: roundPoint(centroid(polygon)),
      polygon: polygon.map(roundPoint),
      neighbors: (adj[i] ?? []).map((j) => ids[j] as ProvinceId),
      capitalDistance,
      startPop: startPopulation(rng, terrain, slot >= 0),
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
    map: {
      seed: params.seed,
      size: params.size,
      width: Math.round(bounds.width * 100) / 100,
      height: Math.round(bounds.height * 100) / 100,
      outline: outline.map(roundPoint),
      provinces,
      capitals: capitals.map((i) => ids[i] as ProvinceId),
      wellsprings: wells.map((i) => ids[i] as ProvinceId),
    },
  };
}

/** Generates the map for `params`. Throws if no valid map is found in MAPGEN.maxAttempts. */
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
  let problems: string[] = [];
  for (let i = 0; i < MAPGEN.maxAttempts; i++) {
    const result = attempt(rng, params, count, bounds, outline);
    problems = result.ok ? validateMap(result.map, params) : result.problems;
    if (result.ok && problems.length === 0) return result.map;
  }
  throw new Error(`no valid map for seed ${params.seed}: ${problems.join('; ')}`);
}
