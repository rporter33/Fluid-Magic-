// Map generation parameters (docs/01-core-rules.md sections 2, 4, 9, 13 and docs/07-ui.md
// New Game). Values the docs do not give are recorded in docs/09-balance.md.
import type { Color } from './colors';
import type { TerrainId } from './terrain';

export const MAP_SIZE_IDS = ['small', 'medium', 'large'] as const;
export type MapSizeId = (typeof MAP_SIZE_IDS)[number];

export interface MapSizeDef {
  id: MapSizeId;
  name: string;
  /** Province count for MAPGEN.baseNations nations. */
  provinces: number;
}

export const MAP_SIZES: Readonly<Record<MapSizeId, MapSizeDef>> = {
  small: { id: 'small', name: 'Small', provinces: 40 },
  medium: { id: 'medium', name: 'Medium', provinces: 60 },
  large: { id: 'large', name: 'Large', provinces: 80 },
};

export const MAPGEN = {
  minNations: 2,
  maxNations: 4,
  /** Nation count that MAP_SIZES and wellspringsBase are defined for. */
  baseNations: 2,
  /** Provinces added per nation beyond baseNations. */
  provincesPerExtraNation: 25,

  // Geometry, in abstract map units. The renderer scales to the screen.
  /** Mean province area; sets the map's overall size. */
  provinceArea: 6400,
  /** Width / height of the map rectangle. */
  aspect: 1.6,
  /** Corner radius of the rounded rectangle, as a fraction of the shorter side. */
  cornerRadius: 0.15,
  /** Line segments per rounded corner. */
  cornerSegments: 8,
  /** Poisson disc radius as a fraction of sqrt(provinceArea); dense enough to overshoot. */
  poissonRadius: 0.75,
  /** Candidate tries per active point in Bridson's algorithm. */
  poissonTries: 30,
  /** Random candidates compared when a missing site is added (the farthest one wins). */
  fillCandidates: 30,
  lloydRounds: 2,
  /**
   * Shared borders shorter than this fraction of sqrt(provinceArea) do not make provinces
   * adjacent. Kept tiny so only point contacts are dropped and the graph matches the drawing.
   */
  minSharedEdge: 0.001,
  minNeighbors: 2,

  // Terrain noise: fractal simplex noise sampled at each province site.
  /** Noise features across the map's longer side at the base octave. */
  noiseFeatures: 1.5,
  noiseOctaves: 3,

  // Capitals.
  capitalMinDistance: 6,
  capitalPop: 25000,
  capitalSprings: 4,
  /** Hops around a capital counted as its starting neighborhood. */
  capitalRingRadius: 2,
  /** A map is balanced when the richest neighborhood's population is at most this times the poorest's. */
  capitalBalanceRatio: 1.5,
  /** Valid maps generated in search of a balanced one before the most balanced is taken. */
  balanceCandidates: 6,

  // Wellsprings.
  /** Wellsprings with up to baseNations nations. */
  wellspringsBase: 3,
  /** Wellsprings with more than baseNations nations. */
  wellspringsAboveBase: 5,
  wellspringMinCapitalDistance: 3,
  /** Minimum graph distance between two Wellsprings (2 = never adjacent). */
  wellspringMinSeparation: 2,
  /** Cost of one hop of unfairness against one hop of separation when placing them. */
  wellspringFairnessWeight: 3,
  /** Starting points of the Wellspring search; the lowest-cost result wins. */
  wellspringSearchStarts: 8,
  /** Upper bound on improvement passes per start of the Wellspring swap search. */
  wellspringSearchPasses: 20,
  wellspringStrength: 30,

  // Independents: strength = base + perDistance * graph distance to the nearest capital.
  independentBase: 8,
  independentPerDistance: 4,

  // Springs in non-capital, non-Wellspring provinces.
  /** Relative weights for 0, 1, and 2 springs. */
  springCountWeights: [50, 35, 15],
  minSpringsPerColor: 2,

  /** Starting population is rounded to this step. */
  popRounding: 100,
  /** Generation retries with fresh randomness when a map fails validation. */
  maxAttempts: 25,
} as const;

/**
 * Impassable terrain (Phase 1b, war-table design section 1; owner direction 2026-10-21: "i want
 * to make sure the maps have some impassible terrain that is noticeable"). A wild is a map cell
 * that is not a province: named mountain massifs (peaks) and dark lakes (meres). Chasms arrive
 * in M2.
 */
export const WILD_KINDS = ['peaks', 'mere'] as const;
export type WildKind = (typeof WILD_KINDS)[number];

export const WILDS = {
  /** Ranges per map: round(provinces / provincesPerRange). Medium 3, Small 2, Large 4. */
  provincesPerRange: 20,
  /** Range r has kind kindCycle[r % kindCycle.length]: Medium gets peaks, a mere, peaks. */
  kindCycle: ['peaks', 'mere', 'peaks'],
  /** Weights for a range of 1, 2 or 3 cells, by kind. */
  cellWeights: { peaks: [25, 50, 25], mere: [60, 40] },
  /** Cell hops from every capital, on the full cell graph. */
  minCapitalCells: 3,
  /** Cell hops between cells of two different ranges, so no province borders two. */
  separation: 3,
  /** The provinces bordering one range stay this many passable steps apart. */
  maxDetour: 6,
  /** Seeds tried per range before the attempt fails. */
  seedTries: 12,
} as const satisfies {
  provincesPerRange: number;
  kindCycle: readonly WildKind[];
  cellWeights: Readonly<Record<WildKind, readonly number[]>>;
  minCapitalCells: number;
  separation: number;
  maxDetour: number;
  seedTries: number;
};

/**
 * Share of provinces per terrain, assigned by rank: highest elevation becomes mountains
 * then hills; wet lowlands swamp; the wettest of the rest forest, the driest wasteland;
 * then farmland; plains take what remains. Shares sum to 1.
 */
export const TERRAIN_SHARES: Readonly<Record<TerrainId, number>> = {
  mountains: 0.08,
  hills: 0.14,
  swamp: 0.08,
  forest: 0.22,
  wasteland: 0.1,
  farmland: 0.14,
  plains: 0.24,
};

/**
 * Spring colors each terrain suits. Every color gets an equal number of springs per map;
 * these lists decide where each color lands when there is a choice.
 */
export const TERRAIN_SPRING_COLORS: Readonly<Record<TerrainId, readonly Color[]>> = {
  plains: ['W', 'U'],
  farmland: ['G', 'W'],
  forest: ['G', 'B'],
  hills: ['R', 'W'],
  mountains: ['R', 'U'],
  swamp: ['B', 'U'],
  wasteland: ['R', 'B'],
};
