import { describe, expect, it } from 'vitest';
import {
  bfsDistances,
  connectedWithout,
  cutVertices,
  isConnected,
  maxPairDistance,
} from '../../src/mapgen/graph';
import { gridGraph } from './fixtures';

describe('bfsDistances', () => {
  it('gives Manhattan distance on a grid', () => {
    const adj = gridGraph(5, 4);
    const dist = bfsDistances(adj, [0]);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) expect(dist[y * 5 + x]).toBe(x + y);
  });

  it('measures from the nearest of several sources', () => {
    const adj = gridGraph(7, 1);
    expect(bfsDistances(adj, [0, 6])).toEqual([0, 1, 2, 3, 2, 1, 0]);
  });

  it('marks unreachable nodes as Infinity', () => {
    const adj = [[1], [0], []];
    expect(bfsDistances(adj, [0])).toEqual([0, 1, Number.POSITIVE_INFINITY]);
  });
});

describe('isConnected', () => {
  it('detects connected and disconnected graphs', () => {
    expect(isConnected(gridGraph(4, 4))).toBe(true);
    expect(isConnected([[1], [0], [3], [2]])).toBe(false);
    expect(isConnected([])).toBe(true);
  });
});

/** Cut vertices by brute force: remove each node and see whether the rest stays connected. */
function bruteCuts(adj: number[][]): number[] {
  return adj.flatMap((_, v) => {
    const rest = adj.map((_, i) => i).filter((i) => i !== v);
    if (rest.length === 0) return [];
    const seen = new Set([rest[0]!]);
    for (const c of seen) for (const n of adj[c]!) if (n !== v) seen.add(n);
    return seen.size < rest.length ? [v] : [];
  });
}

describe('blocked nodes (Phase 1b)', () => {
  it('bfsDistances walks around them', () => {
    const adj = gridGraph(3, 3);
    // Blocking the center makes the far corner 4 steps either way, as before.
    expect(bfsDistances(adj, [0], new Set([4]))[8]).toBe(4);
    // Blocking the middle column cuts the grid in two.
    const dist = bfsDistances(adj, [0], new Set([1, 4, 7]));
    expect(dist[2]).toBe(Number.POSITIVE_INFINITY);
    expect(dist[4]).toBe(Number.POSITIVE_INFINITY);
    expect(bfsDistances(adj, [4], new Set([4]))).toEqual(new Array(9).fill(Infinity));
  });

  it('connectedWithout ignores blocked nodes and sees the cuts they make', () => {
    const adj = gridGraph(3, 3);
    expect(connectedWithout(adj, new Set([4]))).toBe(true);
    expect(connectedWithout(adj, new Set([1, 4, 7]))).toBe(false);
    expect(connectedWithout([[1], [0], []], new Set([2]))).toBe(true);
    expect(connectedWithout(adj, new Set(adj.map((_, i) => i)))).toBe(true);
  });
});

describe('cutVertices', () => {
  it('finds the inner nodes of a path, none on a cycle, the joint of two triangles', () => {
    expect(cutVertices(gridGraph(5, 1))).toEqual([1, 2, 3]);
    const cycle = Array.from({ length: 6 }, (_, i) => [(i + 5) % 6, (i + 1) % 6]);
    expect(cutVertices(cycle)).toEqual([]);
    const bowtie = [
      [1, 2],
      [0, 2],
      [0, 1, 3, 4],
      [2, 4],
      [2, 3],
    ];
    expect(cutVertices(bowtie)).toEqual([2]);
    expect(cutVertices(gridGraph(4, 4))).toEqual([]);
  });

  it('judges the graph without blocked nodes', () => {
    // A 3 x 3 grid without its center is a ring: no cut; without two opposite edges' middles,
    // the corners between them become cuts.
    const adj = gridGraph(3, 3);
    expect(cutVertices(adj, new Set([4]))).toEqual([]);
    expect(cutVertices(adj, new Set([4, 1]))).toEqual([3, 5, 6, 7, 8]);
  });

  it('matches a brute-force search on random graphs', () => {
    let seed = 12345;
    const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let k = 0; k < 200; k++) {
      const n = 3 + Math.floor(next() * 10);
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (next() < 0.3) {
            adj[i]!.push(j);
            adj[j]!.push(i);
          }
        }
      }
      if (!isConnected(adj)) continue;
      expect(cutVertices(adj)).toEqual(bruteCuts(adj));
    }
  });
});

describe('maxPairDistance', () => {
  it('is the largest distance between two of the nodes, around blocked ones', () => {
    const adj = gridGraph(5, 5);
    expect(maxPairDistance(adj, [0, 4, 24])).toBe(8);
    expect(maxPairDistance(adj, [7])).toBe(0);
    expect(maxPairDistance(adj, [])).toBe(0);
    // Around a wall in the middle column with one gap at the bottom.
    expect(maxPairDistance(adj, [11, 13])).toBe(2);
    expect(maxPairDistance(adj, [11, 13], new Set([2, 7, 12, 17]))).toBe(6);
    expect(maxPairDistance(adj, [11, 13], new Set([2, 7, 12, 17, 22]))).toBe(Infinity);
  });
});
