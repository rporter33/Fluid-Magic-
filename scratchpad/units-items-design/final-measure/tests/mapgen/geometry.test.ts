import { describe, expect, it } from 'vitest';
import {
  centroid,
  clipConvex,
  dedupeVertices,
  insideConvex,
  orientPositive,
  roundedRect,
  signedArea,
} from '../../src/mapgen/geometry';
import type { Point } from '../../src/mapgen/types';

const square = (x: number, y: number, s: number): Point[] => [
  { x, y },
  { x: x + s, y },
  { x: x + s, y: y + s },
  { x, y: y + s },
];

describe('area and orientation', () => {
  it('computes signed area by orientation', () => {
    expect(signedArea(square(0, 0, 2))).toBe(4);
    expect(signedArea([...square(0, 0, 2)].reverse())).toBe(-4);
  });

  it('orientPositive flips only negative polygons', () => {
    const cw = [...square(0, 0, 1)].reverse();
    expect(signedArea(orientPositive(cw))).toBe(1);
    expect(orientPositive(square(0, 0, 1))).toEqual(square(0, 0, 1));
  });

  it('centroid of a square and a triangle', () => {
    expect(centroid(square(2, 4, 2))).toEqual({ x: 3, y: 5 });
    const c = centroid([
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 0, y: 3 },
    ]);
    expect(c.x).toBeCloseTo(1);
    expect(c.y).toBeCloseTo(1);
  });

  it('centroid of a degenerate polygon is the vertex mean', () => {
    expect(
      centroid([
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 4, y: 0 },
      ]),
    ).toEqual({ x: 2, y: 0 });
  });
});

describe('roundedRect', () => {
  it('has positive orientation and the rounded-rectangle area', () => {
    const w = 200;
    const h = 100;
    const r = 20;
    const outline = roundedRect(w, h, r, 64);
    expect(signedArea(outline)).toBeGreaterThan(0);
    const exact = w * h - (4 - Math.PI) * r * r;
    expect(signedArea(outline)).toBeCloseTo(exact, -1);
  });

  it('stays inside the rectangle and touches all four sides', () => {
    const outline = roundedRect(300, 120, 30, 8);
    for (const p of outline) {
      expect(p.x).toBeGreaterThanOrEqual(-1e-9);
      expect(p.x).toBeLessThanOrEqual(300 + 1e-9);
      expect(p.y).toBeGreaterThanOrEqual(-1e-9);
      expect(p.y).toBeLessThanOrEqual(120 + 1e-9);
    }
    expect(Math.min(...outline.map((p) => p.x))).toBeCloseTo(0);
    expect(Math.max(...outline.map((p) => p.y))).toBeCloseTo(120);
  });

  it('is convex', () => {
    const outline = roundedRect(300, 120, 30, 8);
    for (const p of outline) expect(insideConvex(outline, p)).toBe(true);
    expect(insideConvex(outline, { x: 1, y: 1 })).toBe(false);
    expect(insideConvex(outline, { x: 150, y: 60 })).toBe(true);
  });
});

describe('clipConvex', () => {
  it('intersects overlapping squares', () => {
    const clipped = clipConvex(square(0, 0, 2), square(1, 1, 2));
    expect(signedArea(clipped)).toBeCloseTo(1);
    expect(centroid(clipped)).toEqual({ x: 1.5, y: 1.5 });
  });

  it('returns the subject when it lies inside the clip', () => {
    expect(signedArea(clipConvex(square(1, 1, 1), square(0, 0, 4)))).toBeCloseTo(1);
  });

  it('returns nothing for disjoint polygons', () => {
    expect(clipConvex(square(0, 0, 1), square(5, 5, 1))).toEqual([]);
  });

  it('clips a cell against a rounded corner', () => {
    const outline = roundedRect(100, 100, 30, 16);
    const clipped = clipConvex(square(0, 0, 20), outline);
    expect(signedArea(clipped)).toBeGreaterThan(0);
    expect(signedArea(clipped)).toBeLessThan(400);
    // Intersection points land on the outline, so allow rounding error.
    for (const p of clipped) expect(outsideBy(outline, p)).toBeLessThan(1e-9);
  });
});

/** How far `p` lies outside the convex polygon, as the worst edge violation. */
function outsideBy(polygon: readonly Point[], p: Point): number {
  let worst = 0;
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length]!;
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    worst = Math.max(worst, -cross / Math.hypot(b.x - a.x, b.y - a.y));
  });
  return worst;
}

describe('dedupeVertices', () => {
  it('drops repeated and wrap-around vertices', () => {
    const p = { x: 0, y: 0 };
    const q = { x: 1, y: 0 };
    const r = { x: 1, y: 1 };
    expect(dedupeVertices([p, q, q, r, { x: 0, y: 0 }])).toEqual([p, q, r]);
  });
});
