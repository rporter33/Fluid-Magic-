import { describe, expect, it } from 'vitest';
import { MAPGEN } from '../../src/content/mapgen';
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
import { createRng, nextU32 } from '../../src/sim/rng';

/** Draws for one point inside the outline, as the generator allows. */
const TRIES = MAPGEN.pointTries;

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
    const points = poissonDisc(createRng(1), outline, bounds, 30, 30, TRIES);
    expect(points.length).toBeGreaterThan(40);
    expect(minPairDistance(points)).toBeGreaterThanOrEqual(30);
    for (const p of points) expect(insideOrOn(p)).toBe(true);
  });

  it('is deterministic per rng state', () => {
    expect(poissonDisc(createRng(9), outline, bounds, 30, 30, TRIES)).toEqual(
      poissonDisc(createRng(9), outline, bounds, 30, 30, TRIES),
    );
  });

  it('saturates: no gap is left that could fit another point far from all others', () => {
    const points = poissonDisc(createRng(2), outline, bounds, 30, 30, TRIES);
    // A maximal sample leaves no point of the area farther than 2r from every sample.
    for (let x = 45; x < 360; x += 15) {
      for (let y = 45; y < 210; y += 15) {
        const nearest = Math.min(...points.map((p) => Math.hypot(p.x - x, p.y - y)));
        expect(nearest).toBeLessThan(60);
      }
    }
  });
});

/** An outline beyond the bounds: no draw inside the bounds can land in it. */
const unreachable: Point[] = [
  { x: 500, y: 10 },
  { x: 520, y: 10 },
  { x: 510, y: 30 },
];

/** The rng after `n` draws from `seed`. */
function drawn(seed: number, n: number) {
  const rng = createRng(seed);
  for (let i = 0; i < n; i++) nextU32(rng);
  return rng;
}

describe('the cap on drawing a point inside the outline', () => {
  it('gives up after MAPGEN.pointTries draws: an outline no draw lands in yields no points', () => {
    const rng = createRng(4);
    expect(poissonDisc(rng, unreachable, bounds, 30, 30, TRIES)).toEqual([]);
    // Two floats a draw, and not one more: the sample stopped instead of spinning.
    expect(rng).toEqual(drawn(4, 2 * TRIES));
  });

  it('lets adjustCount return the shortfall instead of a missing point', () => {
    const points = [
      { x: 100, y: 100 },
      { x: 300, y: 150 },
    ];
    const rng = createRng(5);
    expect(adjustCount(rng, points, 5, unreachable, bounds, 30, TRIES)).toEqual(points);
    // The first candidate of the first missing point found nothing, which ends the fill.
    expect(rng).toEqual(drawn(5, 2 * TRIES));
    // Trimming draws nothing, whatever the outline.
    const trimmer = createRng(6);
    expect(adjustCount(trimmer, points, 1, unreachable, bounds, 30, TRIES)).toHaveLength(1);
    expect(trimmer).toEqual(createRng(6));
  });

  it('is far above what a rounded outline needs: fewer than one draw in ten misses it', () => {
    let draws = 0;
    let points = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const rng = createRng(seed);
      const before = { ...rng };
      const sample = adjustCount(rng, [], 40, outline, bounds, 1, TRIES);
      expect(sample).toHaveLength(40);
      points += sample.length;
      // Count the draws taken by replaying the stream to the same state.
      const replay = { ...before };
      let n = 0;
      while (JSON.stringify(replay) !== JSON.stringify(rng)) {
        nextU32(replay);
        n++;
      }
      draws += n / 2;
    }
    expect(draws / points).toBeLessThan(1.1);
    expect(draws / points).toBeGreaterThan(1);
  });
});

describe('adjustCount', () => {
  it('trims the most crowded points first', () => {
    // The crowded pair comes first, so trimming from either end would keep both.
    const points = [
      { x: 100, y: 100 },
      { x: 101, y: 100 },
      { x: 300, y: 60 },
      { x: 60, y: 190 },
      { x: 320, y: 200 },
    ];
    const trimmed = adjustCount(createRng(1), points, 4, outline, bounds, 30, TRIES);
    expect(trimmed).toHaveLength(4);
    expect(trimmed).toEqual(expect.arrayContaining(points.slice(2)));
    expect(minPairDistance(trimmed)).toBeGreaterThan(50);
  });

  it('removes an endpoint of the closest pair at each step', () => {
    const points = poissonDisc(createRng(3), outline, bounds, 30, 30, TRIES);
    const trimmed = adjustCount(
      createRng(3),
      points,
      points.length - 1,
      outline,
      bounds,
      30,
      TRIES,
    );
    const removed = points.find((p) => !trimmed.includes(p))!;
    const nearest = (p: Point) =>
      Math.min(...points.filter((q) => q !== p).map((q) => Math.hypot(p.x - q.x, p.y - q.y)));
    expect(nearest(removed)).toBe(minPairDistance(points));
  });

  it('fills the emptiest area with the farthest of its candidates', () => {
    const cluster = [
      { x: 60, y: 60 },
      { x: 70, y: 60 },
      { x: 60, y: 70 },
    ];
    for (let seed = 1; seed <= 10; seed++) {
      const filled = adjustCount(createRng(seed), cluster, 4, outline, bounds, 30, TRIES);
      expect(filled).toHaveLength(4);
      const added = filled[3]!;
      expect(insideOrOn(added)).toBe(true);
      // The farthest of 30 candidates lands well across the map from the corner cluster.
      expect(
        Math.min(...cluster.map((c) => Math.hypot(c.x - added.x, c.y - added.y))),
      ).toBeGreaterThan(200);
    }
  });
});

describe('cells', () => {
  const sites = lloydRelax(
    adjustCount(
      createRng(5),
      poissonDisc(createRng(5), outline, bounds, 30, 30, TRIES),
      50,
      outline,
      bounds,
      30,
      TRIES,
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
    const raw = poissonDisc(createRng(5), outline, bounds, 30, 30, TRIES);
    const before = voronoiCells(
      adjustCount(createRng(5), raw, 50, outline, bounds, 30, TRIES),
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
