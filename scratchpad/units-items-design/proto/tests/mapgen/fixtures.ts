// Shared helpers for mapgen tests. They measure maps independently of src/mapgen, so a bug
// there cannot hide itself.
import type { CapitalSpec, MapData, Point } from '../../src/mapgen/types';
import type { ProvinceId } from '../../src/sim/ids';

export const KHARNATH: CapitalSpec = { color: 'R', terrain: 'plains', name: 'Kharnath' };
export const DEEPMOSS: CapitalSpec = { color: 'G', terrain: 'forest', name: 'Deepmoss' };

/** Index adjacency lists for a generated map, in province order. */
export function indexAdjacency(map: MapData): number[][] {
  const provinces = Object.values(map.provinces);
  const index = new Map<ProvinceId, number>(provinces.map((p, i) => [p.id, i]));
  return provinces.map((p) => p.neighbors.map((n) => index.get(n)!));
}

export function indexOf(map: MapData, id: ProvinceId): number {
  return Object.keys(map.provinces).indexOf(id);
}

/** A w x h grid where each cell touches its 4 orthogonal neighbors. */
export function gridGraph(w: number, h: number): number[][] {
  const adj: number[][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const list: number[] = [];
      if (y > 0) list.push((y - 1) * w + x);
      if (x > 0) list.push(y * w + x - 1);
      if (x < w - 1) list.push(y * w + x + 1);
      if (y < h - 1) list.push((y + 1) * w + x);
      adj.push(list);
    }
  }
  return adj;
}

/** Hop distances from `from` by plain BFS; Infinity when unreachable. */
export function hopsFrom(adj: readonly (readonly number[])[], from: number): number[] {
  const dist = adj.map(() => Number.POSITIVE_INFINITY);
  dist[from] = 0;
  const queue = [from];
  while (queue.length > 0) {
    const node = queue.shift()!;
    for (const n of adj[node]!) {
      if (dist[n] === Number.POSITIVE_INFINITY) {
        dist[n] = dist[node]! + 1;
        queue.push(n);
      }
    }
  }
  return dist;
}

export function hops(adj: readonly (readonly number[])[], from: number, to: number): number {
  return hopsFrom(adj, from)[to]!;
}

/**
 * Length of boundary two polygons share: the overlap of their collinear edges. Measures the
 * drawn border directly, without the bisector test src/mapgen/voronoi.ts uses.
 */
export function touchingLength(a: readonly Point[], b: readonly Point[], tol = 1e-6): number {
  let total = 0;
  a.forEach((p, i) => {
    const q = a[(i + 1) % a.length]!;
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    if (len === 0) return;
    const ux = (q.x - p.x) / len;
    const uy = (q.y - p.y) / len;
    const offLine = (r: Point) => Math.abs((r.x - p.x) * uy - (r.y - p.y) * ux);
    const along = (r: Point) => (r.x - p.x) * ux + (r.y - p.y) * uy;
    b.forEach((r, j) => {
      const s = b[(j + 1) % b.length]!;
      if (offLine(r) > tol || offLine(s) > tol) return;
      const lo = Math.max(0, Math.min(along(r), along(s)));
      const hi = Math.min(len, Math.max(along(r), along(s)));
      if (hi > lo) total += hi - lo;
    });
  });
  return total;
}
