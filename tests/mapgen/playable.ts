// The rules every playable map satisfies (docs/10-milestone-1.md Phase 1 tests and acceptance
// criterion 3), checked with helpers independent of src/mapgen. Shared by the generator tests
// and the wild-map sweeps (Phase 1b).
import { expect } from 'vitest';
import { COLORS } from '../../src/content/colors';
import { MAPGEN, TERRAIN_SHARES } from '../../src/content/mapgen';
import { SCALE_AXES } from '../../src/content/pretenders/scales';
import { TERRAIN_IDS } from '../../src/content/terrain';
import { insideConvex } from '../../src/mapgen/geometry';
import { provinceCount } from '../../src/mapgen/size';
import { apportion } from '../../src/mapgen/terrain';
import type { MapData, MapGenParams } from '../../src/mapgen/types';
import { validateMap } from '../../src/mapgen/validate';
import { hopsFrom, indexAdjacency, indexOf, touchingLength } from './fixtures';

/** Every rule a playable map must satisfy, checked without src/mapgen's own helpers. */
export function expectPlayable(map: MapData, params: MapGenParams): void {
  const provinces = Object.values(map.provinces);
  const adj = indexAdjacency(map);
  const n = provinceCount(params.size, params.capitals.length);
  const capitals = map.capitals.map((id) => indexOf(map, id));
  const wells = map.wellsprings.map((id) => indexOf(map, id));

  // Size, connectivity, neighbors.
  expect(provinces).toHaveLength(n);
  expect(hopsFrom(adj, 0).every(Number.isFinite)).toBe(true);
  provinces.forEach((p, i) => {
    expect(p.neighbors.length).toBeGreaterThanOrEqual(MAPGEN.minNeighbors);
    for (const j of adj[i]!) expect(adj[j]).toContain(i);
  });

  // Capitals: spaced, built from their specs in slot order.
  expect(capitals).toHaveLength(params.capitals.length);
  for (const a of capitals) {
    const dist = hopsFrom(adj, a);
    for (const b of capitals) if (a !== b) expect(dist[b]).toBeGreaterThanOrEqual(6);
  }
  map.capitals.forEach((id, slot) => {
    const p = map.provinces[id]!;
    const spec = params.capitals[slot]!;
    expect(p.capitalSlot).toBe(slot);
    expect(p.terrain).toBe(spec.terrain);
    expect(p.name.startsWith(spec.name)).toBe(true);
    expect(p.springs).toEqual(new Array(MAPGEN.capitalSprings).fill(spec.color));
    expect(p.startPop).toBe(MAPGEN.capitalPop);
  });

  // Wellsprings: counted, far from capitals, never adjacent, guarded, distinct axes.
  expect(wells).toHaveLength(params.capitals.length <= 2 ? 3 : 5);
  for (const w of wells) {
    const dist = hopsFrom(adj, w);
    for (const c of capitals) expect(dist[c]).toBeGreaterThanOrEqual(3);
    for (const v of wells) if (v !== w) expect(dist[v]).toBeGreaterThanOrEqual(2);
    expect(provinces[w]!.independentStrength).toBe(30);
    expect(provinces[w]!.springs).toEqual([]);
  }
  const steps = wells.map((w) => provinces[w]!.wellspring!);
  expect(new Set(steps.map((s) => s.axis)).size).toBe(Math.min(steps.length, SCALE_AXES.length));
  for (const s of steps) expect([1, -1]).toContain(s.step);

  // Springs: every color at least twice outside capitals, and evenly dealt.
  const springs = provinces.filter((p) => p.capitalSlot === undefined).flatMap((p) => p.springs);
  const perColor = COLORS.map((c) => springs.filter((x) => x === c).length);
  expect(Math.min(...perColor)).toBeGreaterThanOrEqual(2);
  expect(Math.max(...perColor) - Math.min(...perColor)).toBeLessThanOrEqual(1);

  // Terrain shares are exact, capitals included.
  const want = apportion(TERRAIN_SHARES, n);
  for (const t of TERRAIN_IDS) {
    expect(provinces.filter((p) => p.terrain === t)).toHaveLength(want[t]);
  }

  // Geometry: no zero-length edges, inside the outline, and the drawn borders are the graph.
  const grown = map.outline.map((p) => ({
    x: (p.x - map.width / 2) * 1.0001 + map.width / 2,
    y: (p.y - map.height / 2) * 1.0001 + map.height / 2,
  }));
  provinces.forEach((p, i) => {
    p.polygon.forEach((v, k) => {
      const next = p.polygon[(k + 1) % p.polygon.length]!;
      expect(v.x !== next.x || v.y !== next.y).toBe(true);
      expect(insideConvex(grown, v)).toBe(true);
    });
    for (let j = i + 1; j < provinces.length; j++) {
      const border = touchingLength(p.polygon, provinces[j]!.polygon);
      if (adj[i]!.includes(j)) expect(border).toBeGreaterThan(0);
      else expect(border).toBeLessThan(0.1);
    }
  });

  expect(validateMap(map, params)).toEqual([]);
}
