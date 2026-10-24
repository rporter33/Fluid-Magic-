// Province cells: Poisson disc sites, Voronoi via d3-delaunay, Lloyd relaxation, clipping
// to the rounded map outline, and adjacency from shared borders. Every random placement has a
// fixed cap (docs/10 Phase 1): a point drawn inside the outline gives up after `pointTries`
// draws, Bridson's sample gives each active point `tries` candidates, and a missing site the best
// of `tries`; a placement that runs out returns fewer points, and the caller reports the shortfall.
import { Delaunay } from 'd3-delaunay';
import { nextFloat, randBelow, type RngState } from '../sim/rng';
import { centroid, clipConvex, distance, insideConvex, orientPositive } from './geometry';
import type { Point } from './types';

export interface Bounds {
  width: number;
  height: number;
}

/**
 * A uniformly random point inside the convex outline (rejection sampling), or null when none of
 * `pointTries` draws lands inside it.
 */
function randomPointInside(
  rng: RngState,
  outline: readonly Point[],
  bounds: Bounds,
  pointTries: number,
): Point | null {
  for (let k = 0; k < pointTries; k++) {
    const p = { x: nextFloat(rng) * bounds.width, y: nextFloat(rng) * bounds.height };
    if (insideConvex(outline, p)) return p;
  }
  return null;
}

/**
 * Bridson's Poisson disc sampling inside the convex outline: no two points closer than
 * `radius`. Runs to saturation, so the count depends on the radius and the area. Each round
 * either adds a point or retires an active one after `tries` candidates, and points at least
 * `radius` apart inside the outline are finitely many, so it ends; with no first point inside
 * the outline (`pointTries` draws) it returns none.
 */
export function poissonDisc(
  rng: RngState,
  outline: readonly Point[],
  bounds: Bounds,
  radius: number,
  tries: number,
  pointTries: number,
): Point[] {
  const cell = radius / Math.SQRT2;
  const cols = Math.ceil(bounds.width / cell);
  const rows = Math.ceil(bounds.height / cell);
  const grid = new Array<number>(cols * rows).fill(-1);
  const points: Point[] = [];
  const active: number[] = [];

  const gridIndex = (p: Point) =>
    Math.min(rows - 1, Math.floor(p.y / cell)) * cols + Math.min(cols - 1, Math.floor(p.x / cell));

  const fits = (p: Point): boolean => {
    if (!insideConvex(outline, p)) return false;
    const gx = Math.floor(p.x / cell);
    const gy = Math.floor(p.y / cell);
    for (let y = Math.max(0, gy - 2); y <= Math.min(rows - 1, gy + 2); y++) {
      for (let x = Math.max(0, gx - 2); x <= Math.min(cols - 1, gx + 2); x++) {
        const other = points[grid[y * cols + x] ?? -1];
        if (other !== undefined && distance(other, p) < radius) return false;
      }
    }
    return true;
  };

  const add = (p: Point) => {
    grid[gridIndex(p)] = points.length;
    active.push(points.length);
    points.push(p);
  };

  const first = randomPointInside(rng, outline, bounds, pointTries);
  if (first === null) return points;
  add(first);
  while (active.length > 0) {
    const slot = randBelow(rng, active.length);
    const origin = points[active[slot] ?? 0] as Point;
    let placed = false;
    for (let k = 0; k < tries; k++) {
      const angle = nextFloat(rng) * 2 * Math.PI;
      // Uniform by area over the annulus [radius, 2 * radius].
      const dist = radius * Math.sqrt(1 + 3 * nextFloat(rng));
      const candidate = {
        x: origin.x + dist * Math.cos(angle),
        y: origin.y + dist * Math.sin(angle),
      };
      if (fits(candidate)) {
        add(candidate);
        placed = true;
        break;
      }
    }
    if (!placed) {
      active[slot] = active[active.length - 1] ?? 0;
      active.pop();
    }
  }
  return points;
}

/** Index of the point whose nearest neighbor is closest; lowest index on ties. */
function mostCrowded(points: readonly Point[]): number {
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i++) {
    let nearest = Number.POSITIVE_INFINITY;
    for (let j = 0; j < points.length; j++) {
      if (i !== j) nearest = Math.min(nearest, distance(points[i] as Point, points[j] as Point));
    }
    if (nearest < bestDist) {
      bestDist = nearest;
      best = i;
    }
  }
  return best;
}

/**
 * Brings `points` to `count`: removes the most crowded point while there are too many, and adds
 * the best of `tries` random candidates (farthest from all points) while there are too few. A
 * candidate the outline takes no draw for (`pointTries`) ends the candidates; when a missing
 * point has none, the shortfall is returned and the caller reports it.
 */
export function adjustCount(
  rng: RngState,
  points: readonly Point[],
  count: number,
  outline: readonly Point[],
  bounds: Bounds,
  tries: number,
  pointTries: number,
): Point[] {
  const out = [...points];
  while (out.length > count) out.splice(mostCrowded(out), 1);
  while (out.length < count) {
    let best: Point | null = null;
    let bestDist = Number.NEGATIVE_INFINITY;
    for (let k = 0; k < tries; k++) {
      const candidate = randomPointInside(rng, outline, bounds, pointTries);
      if (candidate === null) break;
      const d = Math.min(...out.map((p) => distance(p, candidate)));
      if (d > bestDist) {
        best = candidate;
        bestDist = d;
      }
    }
    if (best === null) break;
    out.push(best);
  }
  return out;
}

export interface Cells {
  sites: Point[];
  /** Cell outline per site, clipped to the map outline; empty if the cell vanished. */
  polygons: Point[][];
  /** Delaunay neighbors per site, before the shared-border filter. */
  candidates: number[][];
}

/** Voronoi cells of `sites`, clipped to the convex `outline`. */
export function voronoiCells(
  sites: readonly Point[],
  outline: readonly Point[],
  bounds: Bounds,
): Cells {
  const delaunay = Delaunay.from(
    sites,
    (p) => p.x,
    (p) => p.y,
  );
  const voronoi = delaunay.voronoi([0, 0, bounds.width, bounds.height]);
  const polygons: Point[][] = [];
  const candidates: number[][] = [];
  for (let i = 0; i < sites.length; i++) {
    const raw = voronoi.cellPolygon(i) as [number, number][] | null;
    if (raw === null) {
      polygons.push([]);
    } else {
      // d3 closes the ring by repeating the first vertex.
      const ring = raw.slice(0, -1).map(([x, y]) => ({ x, y }));
      polygons.push(clipConvex(orientPositive(ring), outline));
    }
    candidates.push([...delaunay.neighbors(i)]);
  }
  return { sites: [...sites], polygons, candidates };
}

/** Moves every site to its cell's centroid, `rounds` times. */
export function lloydRelax(
  sites: readonly Point[],
  outline: readonly Point[],
  bounds: Bounds,
  rounds: number,
): Point[] {
  let current = [...sites];
  for (let r = 0; r < rounds; r++) {
    const { polygons } = voronoiCells(current, outline, bounds);
    current = current.map((site, i) => {
      const polygon = polygons[i] ?? [];
      return polygon.length >= 3 ? centroid(polygon) : site;
    });
  }
  return current;
}

/**
 * Length of the border between cell i and cell j: the edges of i's polygon that lie on
 * the perpendicular bisector of the two sites.
 */
export function sharedBorder(
  polygon: readonly Point[],
  siteI: Point,
  siteJ: Point,
  tolerance: number,
): number {
  const onBisector = (p: Point) => Math.abs(distance(p, siteI) - distance(p, siteJ)) <= tolerance;
  let length = 0;
  for (let k = 0; k < polygon.length; k++) {
    const p = polygon[k] as Point;
    const q = polygon[(k + 1) % polygon.length] as Point;
    if (onBisector(p) && onBisector(q)) length += distance(p, q);
  }
  return length;
}

/**
 * Adjacency lists: cells are neighbors when their shared border is at least `minBorder`
 * long. Lists are sorted and symmetric.
 */
export function adjacency(cells: Cells, minBorder: number, tolerance: number): number[][] {
  const lists: number[][] = cells.sites.map(() => []);
  cells.candidates.forEach((js, i) => {
    for (const j of js) {
      if (j <= i) continue;
      const border = sharedBorder(
        cells.polygons[i] ?? [],
        cells.sites[i] as Point,
        cells.sites[j] as Point,
        tolerance,
      );
      if (border >= minBorder) {
        lists[i]?.push(j);
        lists[j]?.push(i);
      }
    }
  });
  return lists.map((list) => list.sort((a, b) => a - b));
}
