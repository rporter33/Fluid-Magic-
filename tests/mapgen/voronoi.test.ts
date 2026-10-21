import { describe, expect, it } from 'vitest';
import { roundedRect, signedArea } from '../../src/mapgen/geometry';
import type { Point } from '../../src/mapgen/types';
import {
  adjacency,
  adjustCount,
  lloydRelax,
  poissonDisc,
  sharedBorder,
  voronoiCells,
} from '../../src/mapgen/voronoi';
import { createRng } from '../../src/sim/rng';

const bounds = { width: 400, height: 250 };
const outline = roundedRect(bounds.width, bounds.height, 40, 8);
const insideOrOn = (p: Point) =>
  p.x >= 0 && p.x <= bounds.width && p.y >= 0 && p.y <= bounds.height;

function minPairDistance(points: readonly Point[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      min = Math.min(min, Math.hypot(points[i]!.x - points[j]!.x, points[i]!.y - points[j]!.y));
    }
  }
  return min;
}

describe('poissonDisc', () => {
  it('keeps every pair at least the radius apart, inside the outline', () => {
    const points = poissonDisc(createRng(1), outline, bounds, 30, 30);
    expect(points.length).toBeGreaterThan(40);
    expect(minPairDistance(points)).toBeGreaterThanOrEqual(30);
    for (const p of points) expect(insideOrOn(p)).toBe(true);
  });

  it('is deterministic per rng state', () => {
    expect(poissonDisc(createRng(9), outline, bounds, 30, 30)).toEqual(
      poissonDisc(createRng(9), outline, bounds, 30, 30),
    );
  });

  it('saturates: no gap is left that could fit another point far from all others', () => {
    const points = poissonDisc(createRng(2), outline, bounds, 30, 30);
    // A maximal sample leaves no point of the area farther than 2r from every sample.
    for (let x = 45; x < 360; x += 15) {
      for (let y = 45; y < 210; y += 15) {
        const nearest = Math.min(...points.map((p) => Math.hypot(p.x - x, p.y - y)));
        expect(nearest).toBeLessThan(60);
      }
    }
  });
});

describe('adjustCount', () => {
  it('trims to the count by removing the most crowded points', () => {
    const points = poissonDisc(createRng(3), outline, bounds, 30, 30);
    const trimmed = adjustCount(createRng(3), points, 40, outline, bounds, 30);
    expect(trimmed).toHaveLength(40);
    expect(minPairDistance(trimmed)).toBeGreaterThanOrEqual(minPairDistance(points));
  });

  it('fills up to the count inside the outline', () => {
    const points = poissonDisc(createRng(4), outline, bounds, 60, 30);
    const filled = adjustCount(createRng(4), points, points.length + 10, outline, bounds, 30);
    expect(filled).toHaveLength(points.length + 10);
    for (const p of filled) expect(insideOrOn(p)).toBe(true);
  });
});

describe('cells', () => {
  const sites = lloydRelax(
    adjustCount(
      createRng(5),
      poissonDisc(createRng(5), outline, bounds, 30, 30),
      50,
      outline,
      bounds,
      30,
    ),
    outline,
    bounds,
    2,
  );
  const cells = voronoiCells(sites, outline, bounds);

  it('tiles the outline exactly: cell areas sum to the outline area', () => {
    const total = cells.polygons.reduce((sum, p) => sum + signedArea(p), 0);
    expect(total).toBeCloseTo(signedArea(outline), 6);
    for (const p of cells.polygons) expect(signedArea(p)).toBeGreaterThan(0);
  });

  it('Lloyd relaxation evens out cell areas', () => {
    const raw = poissonDisc(createRng(5), outline, bounds, 30, 30);
    const before = voronoiCells(
      adjustCount(createRng(5), raw, 50, outline, bounds, 30),
      outline,
      bounds,
    );
    const spread = (polys: Point[][]) => {
      const areas = polys.map(signedArea);
      const mean = areas.reduce((s, a) => s + a, 0) / areas.length;
      return Math.sqrt(areas.reduce((s, a) => s + (a - mean) ** 2, 0) / areas.length) / mean;
    };
    expect(spread(cells.polygons)).toBeLessThan(spread(before.polygons));
  });

  it('adjacency is symmetric, irreflexive, and matches shared borders', () => {
    const adj = adjacency(cells, 2, 1e-6);
    adj.forEach((list, i) => {
      expect(list).not.toContain(i);
      expect([...list].sort((a, b) => a - b)).toEqual(list);
      for (const j of list) {
        expect(adj[j]).toContain(i);
        const fromI = sharedBorder(cells.polygons[i]!, sites[i]!, sites[j]!, 1e-6);
        const fromJ = sharedBorder(cells.polygons[j]!, sites[j]!, sites[i]!, 1e-6);
        expect(fromI).toBeGreaterThanOrEqual(2);
        expect(fromI).toBeCloseTo(fromJ, 6);
      }
    });
  });

  it('a larger minimum border drops short contacts only', () => {
    const loose = adjacency(cells, 0.001, 1e-6);
    const strict = adjacency(cells, 10, 1e-6);
    strict.forEach((list, i) => {
      for (const j of list) expect(loose[i]).toContain(j);
    });
    expect(strict.flat().length).toBeLessThanOrEqual(loose.flat().length);
  });
});

describe('sharedBorder', () => {
  it('measures the edge on the bisector of two sites', () => {
    // Two unit squares side by side; the shared edge is x = 1 from y = 0 to y = 1.
    const left = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    expect(sharedBorder(left, { x: 0.5, y: 0.5 }, { x: 1.5, y: 0.5 }, 1e-9)).toBeCloseTo(1);
    expect(sharedBorder(left, { x: 0.5, y: 0.5 }, { x: 0.5, y: 1.5 }, 1e-9)).toBeCloseTo(1);
    expect(sharedBorder(left, { x: 0.5, y: 0.5 }, { x: 5, y: 5 }, 1e-9)).toBe(0);
  });
});
