// Shared helpers for mapgen tests.
import type { ProvinceId } from '../../src/sim/ids';
import type { CapitalSpec, MapData } from '../../src/mapgen/types';

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

/** Plain BFS used to check graph code independently of src/mapgen/graph.ts. */
export function hops(adj: readonly (readonly number[])[], from: number, to: number): number {
  const seen = new Map<number, number>([[from, 0]]);
  const queue = [from];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node === to) return seen.get(node)!;
    for (const n of adj[node]!) {
      if (!seen.has(n)) {
        seen.set(n, seen.get(node)! + 1);
        queue.push(n);
      }
    }
  }
  return Number.POSITIVE_INFINITY;
}
