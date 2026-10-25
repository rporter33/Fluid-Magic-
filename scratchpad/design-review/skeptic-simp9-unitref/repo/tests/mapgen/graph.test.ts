import { describe, expect, it } from 'vitest';
import { bfsDistances, isConnected } from '../../src/mapgen/graph';
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
