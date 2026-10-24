import { describe, expect, it } from 'vitest';
import { MAPGEN, TERRAIN_SHARES } from '../../src/content/mapgen';
import { TERRAIN_IDS } from '../../src/content/terrain';
import { createSimplex2D, fractal } from '../../src/mapgen/noise';
import { mapDimensions, provinceCount } from '../../src/mapgen/size';
import { apportion, assignTerrain, terrainFields } from '../../src/mapgen/terrain';
import type { Point } from '../../src/mapgen/types';
import { createRng } from '../../src/sim/rng';

describe('apportion', () => {
  it('sums to the total for every size', () => {
    for (let n = 0; n <= 200; n++) {
      const counts = apportion(TERRAIN_SHARES, n);
      expect(TERRAIN_IDS.reduce((s, id) => s + counts[id], 0)).toBe(n);
    }
  });

  it('stays within one of the exact share', () => {
    const counts = apportion(TERRAIN_SHARES, 60);
    for (const id of TERRAIN_IDS) {
      expect(Math.abs(counts[id] - TERRAIN_SHARES[id] * 60)).toBeLessThan(1);
    }
  });
});

describe('assignTerrain', () => {
  const n = 100;
  // Elevation rises with index; moisture alternates high and low.
  const elevation = Array.from({ length: n }, (_, i) => i / n);
  const moisture = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 0.9 : 0.1) - i / 1000);
  const terrains = assignTerrain(elevation, moisture);

  it('hands out exactly the apportioned count of each terrain', () => {
    const counts = apportion(TERRAIN_SHARES, n);
    for (const id of TERRAIN_IDS) {
      expect(terrains.filter((t) => t === id)).toHaveLength(counts[id]);
    }
  });

  it('puts mountains on the highest ground, then hills', () => {
    const { mountains, hills } = apportion(TERRAIN_SHARES, n);
    for (let i = n - mountains; i < n; i++) expect(terrains[i]).toBe('mountains');
    for (let i = n - mountains - hills; i < n - mountains; i++) expect(terrains[i]).toBe('hills');
  });

  it('puts forest and swamp on wet ground and wasteland on dry ground', () => {
    terrains.forEach((t, i) => {
      if (t === 'forest' || t === 'swamp') expect(i % 2).toBe(0);
      if (t === 'wasteland') expect(i % 2).toBe(1);
    });
  });

  it('keeps fixed terrain and counts it against the shares', () => {
    const fixed = new Map([
      [99, 'forest'],
      [0, 'mountains'],
    ] as const);
    const withFixed = assignTerrain(elevation, moisture, fixed);
    expect(withFixed[99]).toBe('forest');
    expect(withFixed[0]).toBe('mountains');
    const counts = apportion(TERRAIN_SHARES, n);
    for (const id of TERRAIN_IDS) {
      expect(withFixed.filter((t) => t === id)).toHaveLength(counts[id]);
    }
  });

  it('is a pure function of its inputs', () => {
    expect(assignTerrain(elevation, moisture)).toEqual(terrains);
  });
});

const mean = (xs: readonly number[]) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
const spread = (xs: readonly number[]) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));

function pearson(a: readonly number[], b: readonly number[]): number {
  const ma = mean(a);
  const mb = mean(b);
  let ab = 0;
  let aa = 0;
  let bb = 0;
  a.forEach((x, i) => {
    const y = b[i]!;
    ab += (x - ma) * (y - mb);
    aa += (x - ma) ** 2;
    bb += (y - mb) ** 2;
  });
  return ab / Math.sqrt(aa * bb);
}

describe('terrainFields', () => {
  // A 16 x 10 grid over the Medium map, sampled at the frequency the generator uses there.
  const bounds = mapDimensions(provinceCount('medium', 2));
  const grid: Point[] = [];
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 10; j++) {
      grid.push({ x: ((i + 0.5) * bounds.width) / 16, y: ((j + 0.5) * bounds.height) / 10 });
    }
  }

  it('draws a permutation per field, elevation first, and samples both at every site', () => {
    const rng = createRng(1);
    const fields = terrainFields(rng, grid, bounds);
    const byHand = createRng(1);
    const elevation = createSimplex2D(byHand);
    const moisture = createSimplex2D(byHand);
    const f = MAPGEN.noiseFeatures / Math.max(bounds.width, bounds.height);
    const at = (noise: typeof elevation) =>
      grid.map((p) => fractal(noise, p.x * f, p.y * f, MAPGEN.noiseOctaves));
    expect(fields).toEqual({ elevation: at(elevation), moisture: at(moisture) });
    expect(rng).toEqual(byHand);
  });

  it('gives each seed two fields that vary and that are uncorrelated across seeds', () => {
    const rs: number[] = [];
    for (let seed = 1; seed <= 100; seed++) {
      const { elevation, moisture } = terrainFields(createRng(seed), grid, bounds);
      // Neither field is dead (the smallest spread on these seeds is about 0.19).
      expect(spread(elevation), String(seed)).toBeGreaterThan(0.1);
      expect(spread(moisture), String(seed)).toBeGreaterThan(0.1);
      rs.push(pearson(elevation, moisture));
    }
    // Independent fields: r averages 0 (-0.004 with a standard error of 0.005 over 5,000 seeds;
    // -0.069 over these 100, whose error is 0.03). About 1.5 noise features span the map, so one
    // map's r is large (|r| 0.27 on average here, 0.70 at most), while one field read twice for
    // both, the banding Phase 1 warns of, gives r = 1 on every map.
    expect(Math.abs(mean(rs))).toBeLessThan(0.15);
    expect(mean(rs.map(Math.abs))).toBeLessThan(0.4);
  });
});
