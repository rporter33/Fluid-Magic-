// What every map generated with wilds must satisfy (Phase 1b; war-table design 1.5 and 1.9),
// measured from the drawn polygons with helpers independent of src/mapgen: the province graph
// plus the wild cells, joined where their drawn borders meet, is the full cell graph.
import { expect } from 'vitest';
import { MAPGEN, WILDS } from '../../src/content/mapgen';
import { WILD_NAME_PARTS } from '../../src/content/names';
import { generateMap } from '../../src/mapgen/generate';
import { wildOutline } from '../../src/mapgen/geometry';
import type { MapData, MapGenParams, Point } from '../../src/mapgen/types';
import { hopsFrom, indexAdjacency, indexOf, touchingLength } from './fixtures';
import { expectPlayable } from './playable';

const SCALE = Math.sqrt(MAPGEN.provinceArea);
/** The generator's shortest border that makes two cells neighbors. */
const MIN_BORDER = MAPGEN.minSharedEdge * SCALE;

function area(polygon: readonly Point[]): number {
  let sum = 0;
  polygon.forEach((p, i) => {
    const q = polygon[(i + 1) % polygon.length]!;
    sum += p.x * q.y - q.x * p.y;
  });
  return sum / 2;
}

function areaCentroid(polygon: readonly Point[]): Point {
  let cx = 0;
  let cy = 0;
  polygon.forEach((p, i) => {
    const q = polygon[(i + 1) % polygon.length]!;
    const cross = p.x * q.y - q.x * p.y;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  });
  const a = area(polygon);
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

function pointSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

function onOutline(map: MapData, p: Point): boolean {
  return map.outline.some(
    (a, k) => pointSegment(p, a, map.outline[(k + 1) % map.outline.length]!) < 1e-6 * SCALE,
  );
}

/** Per province in id order: true when no vertex of its polygon lies on the map outline. */
export function interiorProvinces(map: MapData): boolean[] {
  return Object.values(map.provinces).map((p) => !p.polygon.some((v) => onOutline(map, v)));
}

/** True when `p` lies inside the counterclockwise convex `polygon`, edges included. */
function insidePolygon(polygon: readonly Point[], p: Point): boolean {
  return polygon.every((a, k) => {
    const b = polygon[(k + 1) % polygon.length]!;
    return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) >= -1e-9 * SCALE * SCALE;
  });
}

/** The full cell graph: provinces 0..n-1 in id order, then every wild cell, range by range. */
export function cellGraph(map: MapData): { adj: number[][]; rangeOf: number[] } {
  const provinces = Object.values(map.provinces);
  const adj = indexAdjacency(map);
  const rangeOf = provinces.map(() => -1);
  const cells: Point[][] = [];
  map.wilds.forEach((w, r) => {
    for (const cell of w.cells) {
      cells.push(cell);
      rangeOf.push(r);
      adj.push([]);
    }
  });
  cells.forEach((cell, k) => {
    const i = provinces.length + k;
    provinces.forEach((p, j) => {
      if (touchingLength(cell, p.polygon) >= MIN_BORDER) {
        adj[i]!.push(j);
        adj[j]!.push(i);
      }
    });
    cells.forEach((other, m) => {
      if (m > k && touchingLength(cell, other) >= MIN_BORDER) {
        adj[i]!.push(provinces.length + m);
        adj[provinces.length + m]!.push(i);
      }
    });
  });
  return { adj, rangeOf };
}

/** Provinces whose removal disconnects the rest, found by removing each in turn. */
function cutProvinces(adj: readonly (readonly number[])[]): number[] {
  return adj.flatMap((_, v) => {
    const start = v === 0 ? 1 : 0;
    const seen = new Set([start, v]);
    const queue = [start];
    while (queue.length > 0) {
      for (const n of adj[queue.shift()!]!) {
        if (!seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    return seen.size < adj.length ? [v] : [];
  });
}

/** Every rule of a map with wilds, then the same params again give the same map. */
export function expectWilds(map: MapData, params: MapGenParams, again = false): void {
  expect(params.wilds).toBe(true);
  expectPlayable(map, params);

  const provinces = Object.values(map.provinces);
  const n = provinces.length;
  // Each province keeps its own cell's Voronoi site, which lies inside its own polygon.
  for (const p of provinces) expect(insidePolygon(p.polygon, p.site)).toBe(true);
  const ranges = Math.round(n / WILDS.provincesPerRange);
  expect(map.wilds).toHaveLength(ranges);
  const wildIds = new Set<string>(map.wilds.map((w) => w.id));
  for (const p of provinces) for (const id of p.neighbors) expect(wildIds.has(id)).toBe(false);

  // Kinds, sizes, names; cells cover their share of the map, which grew to keep province area.
  const provinceNames = new Set(provinces.map((p) => p.name));
  const wildNames = new Set<string>();
  let wildCells = 0;
  let covered = provinces.reduce((sum, p) => sum + area(p.polygon), 0);
  map.wilds.forEach((w, r) => {
    expect(w.id).toBe(`w${r}`);
    expect(w.kind).toBe(WILDS.kindCycle[r % WILDS.kindCycle.length]);
    expect(w.cells.length).toBeGreaterThanOrEqual(1);
    expect(w.cells.length).toBeLessThanOrEqual(WILDS.cellWeights[w.kind].length);
    const { onsets, suffixes } = WILD_NAME_PARTS[w.kind];
    const base = w.name.replace(/ (II|III|IV|V|VI|VII|VIII|IX|X|\d+)$/, '');
    expect(onsets.some((o) => suffixes.some((s) => o + s === base))).toBe(true);
    expect(provinceNames.has(w.name)).toBe(false);
    expect(wildNames.has(w.name)).toBe(false);
    wildNames.add(w.name);
    for (const cell of w.cells) {
      expect(area(cell)).toBeGreaterThan(0);
      covered += area(cell);
      wildCells++;
      // Interior: no vertex on the map's edge.
      for (const v of cell) expect(onOutline(map, v)).toBe(false);
    }
    const largest = [...w.cells].sort((a, b) => area(b) - area(a))[0]!;
    const c = areaCentroid(largest);
    expect(Math.hypot(w.center.x - c.x, w.center.y - c.y)).toBeLessThan(1e-9 * SCALE);
    // One loop around the range, enclosing exactly its cells.
    const loops = wildOutline(w);
    expect(loops).toHaveLength(1);
    const enclosed = loops.reduce((s, loop) => s + area(loop), 0);
    const cellArea = w.cells.reduce((s, c) => s + area(c), 0);
    expect(Math.abs(enclosed - cellArea)).toBeLessThan(1e-6 * cellArea);
  });
  expect(Math.abs(covered - area(map.outline))).toBeLessThan(1e-6 * covered);
  expect(map.width * map.height).toBeCloseTo((n + wildCells) * MAPGEN.provinceArea, 3);

  // The full cell graph: borders, guards, rings.
  const { adj, rangeOf } = cellGraph(map);
  const capitals = map.capitals.map((id) => indexOf(map, id));
  const bordered = new Map<number, number>();
  map.wilds.forEach((w, r) => {
    const cells = rangeOf.flatMap((x, i) => (x === r ? [i] : []));
    // Cells of one range touch each other; borders are the provinces their drawn edges meet.
    const joined = new Set([cells[0]!]);
    for (const c of joined) for (const m of adj[c]!) if (rangeOf[m] === r) joined.add(m);
    expect(joined.size).toBe(cells.length);
    const touching = new Set(cells.flatMap((c) => adj[c]!.filter((j) => j < n)));
    expect(w.borders).toEqual([...touching].sort((a, b) => a - b).map((i) => `p${i}`));
    for (const b of touching) {
      expect(bordered.has(b)).toBe(false);
      bordered.set(b, r);
    }
    // At least 3 cell hops from every capital and from every other range.
    for (const c of cells) {
      const dist = hopsFrom(adj, c);
      for (const cap of capitals) expect(dist[cap]).toBeGreaterThanOrEqual(WILDS.minCapitalCells);
      rangeOf.forEach((x, i) => {
        if (x >= 0 && x !== r) expect(dist[i]).toBeGreaterThanOrEqual(WILDS.separation);
      });
    }
    // The way around: the provinces bordering the range are at most 6 steps apart.
    const provinceAdj = indexAdjacency(map);
    for (const a of touching) {
      const dist = hopsFrom(provinceAdj, a);
      for (const b of touching) expect(dist[b]).toBeLessThanOrEqual(WILDS.maxDetour);
    }
  });
  expect(cutProvinces(indexAdjacency(map))).toEqual([]);
  // Each capital's 2-hop ring has the same members on the cell and the province graphs.
  for (const cap of capitals) {
    const ring = (graph: number[][]) =>
      hopsFrom(graph, cap).flatMap((d, i) => (d <= MAPGEN.capitalRingRadius ? [i] : []));
    expect(ring(adj)).toEqual(ring(indexAdjacency(map)));
  }

  if (again) expect(generateMap(params)).toEqual(map);
}
