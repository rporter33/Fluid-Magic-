// Impassable wild ranges (Phase 1b; war-table design section 1.4; docs/01 "Wilds"): named
// mountain massifs (peaks) and dark lakes (meres) that are map cells but not provinces. The
// generator plans the ranges before the geometry, places them after the capitals and the noise,
// and makes provinces of the cells that remain. Every number comes from WILDS in
// content/mapgen.ts; every random draw from the generator's rng.
import { MAPGEN, WILDS, type WildKind } from '../content/mapgen';
import { WILD_NAME_PARTS } from '../content/names';
import { newId, type ProvinceId } from '../sim/ids';
import { pick, weightedIndex, type RngState } from '../sim/rng';
import { centroid, signedArea } from './geometry';
import { bfsDistances, connectedWithout, cutVertices, maxPairDistance } from './graph';
import { numbered } from './names';
import type { MapWild, Point } from './types';

type Adjacency = readonly (readonly number[])[];

/** One planned range: its kind and how many cells it takes. */
export interface WildPlan {
  kind: WildKind;
  cells: number;
}

/** Wild ranges on a map of `provinces` provinces: round(provinces / provincesPerRange). */
export function wildRangeCount(provinces: number): number {
  return Math.round(provinces / WILDS.provincesPerRange);
}

/** The ranges of one attempt, in id order: kinds cycle, sizes are drawn by kind. */
export function planWilds(rng: RngState, provinces: number): WildPlan[] {
  return Array.from({ length: wildRangeCount(provinces) }, (_, r) => {
    const kind = WILDS.kindCycle[r % WILDS.kindCycle.length] ?? 'peaks';
    return { kind, cells: 1 + weightedIndex(rng, WILDS.cellWeights[kind]) };
  });
}

/** What placement reads about the cells, all on the full cell graph. */
export interface WildTerrain {
  adjacency: Adjacency;
  /** Capital cells. */
  capitals: readonly number[];
  /** Cells with no vertex on the map outline. */
  interior: readonly boolean[];
  elevation: readonly number[];
  moisture: readonly number[];
}

/** Where a range of `kind` wants to be: high ground for peaks, wet lowland for meres. */
function scorer(kind: WildKind, terrain: WildTerrain): (i: number) => number {
  const elev = (i: number) => terrain.elevation[i] ?? 0;
  const wet = (i: number) => terrain.moisture[i] ?? 0;
  return kind === 'peaks' ? elev : (i) => wet(i) - elev(i);
}

/**
 * True when the cells outside `blocked` still make a good province graph: the cells around
 * `cell` keep MAPGEN.minNeighbors neighbors, the rest stay connected with no cut vertex, and
 * the cells bordering each range (`ranges`) stay within WILDS.maxDetour steps of each other.
 */
function keepsMapWhole(
  adjacency: Adjacency,
  blocked: ReadonlySet<number>,
  cell: number,
  ranges: readonly (readonly number[])[],
): boolean {
  // While MAPGEN.minNeighbors is 2 this first check changes nothing: a cell left with one
  // neighbor makes that neighbor a cut vertex and a cell left with none is cut off, and the
  // tests after it refuse both. It matters only if minNeighbors rises.
  for (const n of adjacency[cell] ?? []) {
    if (blocked.has(n)) continue;
    const left = (adjacency[n] ?? []).filter((m) => !blocked.has(m)).length;
    if (left < MAPGEN.minNeighbors) return false;
  }
  if (!connectedWithout(adjacency, blocked)) return false;
  if (cutVertices(adjacency, blocked).length > 0) return false;
  return ranges.every(
    (cells) =>
      maxPairDistance(adjacency, borderingCells(adjacency, cells, blocked), blocked) <=
      WILDS.maxDetour,
  );
}

/** The cells outside `blocked` next to any of `cells`, sorted. */
function borderingCells(
  adjacency: Adjacency,
  cells: readonly number[],
  blocked: ReadonlySet<number>,
): number[] {
  const out = new Set<number>();
  for (const c of cells) for (const n of adjacency[c] ?? []) if (!blocked.has(n)) out.add(n);
  return [...out].sort((a, b) => a - b);
}

/**
 * Places every planned range (war-table design 1.4, step 5): peaks first, then meres, each in
 * plan order. A range seeds at its best eligible cell and grows into the best eligible
 * neighbor of its cells; one that cannot reach its size gives its cells back and tries the
 * next eligible seed, up to WILDS.seedTries. A cell is eligible when it is interior, at least
 * WILDS.minCapitalCells from every capital and WILDS.separation from every other range, and
 * the map stays whole without it (keepsMapWhole). Ties go to the lower cell index, so no draw
 * is needed. Returns each range's cells in plan order, seed first, or null when a range finds
 * no room.
 */
export function placeWilds(plan: readonly WildPlan[], terrain: WildTerrain): number[][] | null {
  const { adjacency } = terrain;
  const cellCount = adjacency.length;
  const fromCapital = bfsDistances(adjacency, terrain.capitals);
  const wild = new Set<number>();
  const ranges: number[][] = plan.map(() => []);
  const order = [
    ...plan.flatMap((w, r) => (w.kind === 'peaks' ? [r] : [])),
    ...plan.flatMap((w, r) => (w.kind === 'peaks' ? [] : [r])),
  ];
  for (const r of order) {
    const { kind, cells: size } = plan[r] as WildPlan;
    const score = scorer(kind, terrain);
    const fromOthers = bfsDistances(adjacency, [...wild]);
    const allowed = (i: number) =>
      !wild.has(i) &&
      terrain.interior[i] === true &&
      (fromCapital[i] ?? 0) >= WILDS.minCapitalCells &&
      (fromOthers[i] ?? 0) >= WILDS.separation;
    const best = (cells: readonly number[]) =>
      cells.filter(allowed).sort((a, b) => score(b) - score(a) || a - b);
    const placed = ranges.filter((cells) => cells.length > 0);
    /** Takes `cell` into `range` if the map stays whole; gives it back otherwise. */
    const take = (range: number[], cell: number): boolean => {
      wild.add(cell);
      range.push(cell);
      if (keepsMapWhole(adjacency, wild, cell, [...placed, range])) return true;
      wild.delete(cell);
      range.pop();
      return false;
    };
    let tries = 0;
    for (const seed of best(Array.from({ length: cellCount }, (_, i) => i))) {
      if (tries >= WILDS.seedTries) break;
      const range: number[] = [];
      if (!take(range, seed)) continue;
      tries++;
      while (range.length < size) {
        const around = borderingCells(adjacency, range, wild);
        if (!best(around).some((cell) => take(range, cell))) break;
      }
      if (range.length === size) {
        ranges[r] = range;
        break;
      }
      for (const cell of range) wild.delete(cell);
    }
    if ((ranges[r] ?? []).length !== size) return null;
  }
  return ranges;
}

/** Random draws before a repeated wild name falls back to a numbered variant. */
const MAX_DRAWS = 50;

/** A name for a range of `kind`: a first part and an ending (content/names.ts). */
export function wildName(rng: RngState, kind: WildKind): string {
  const { onsets, suffixes } = WILD_NAME_PARTS[kind];
  return pick(rng, onsets) + pick(rng, suffixes);
}

/** Names each range, unique against `taken` (every province name) and each other. */
export function nameWilds(
  rng: RngState,
  kinds: readonly WildKind[],
  taken: ReadonlySet<string>,
): string[] {
  const used = new Set(taken);
  return kinds.map((kind) => {
    let name = wildName(rng, kind);
    for (let draw = 1; draw < MAX_DRAWS && used.has(name); draw++) name = wildName(rng, kind);
    const unique = numbered(name, used);
    used.add(unique);
    return unique;
  });
}

/**
 * The MapWild records: ids w0, w1, ... from a scratch counter in plan order, the cells'
 * polygons, the largest cell's centroid, and the provinces bordering any cell.
 */
export function buildWilds(
  plan: readonly WildPlan[],
  ranges: readonly (readonly number[])[],
  names: readonly string[],
  polygons: readonly Point[][],
  adjacency: Adjacency,
  provinceOf: ReadonlyMap<number, ProvinceId>,
): MapWild[] {
  const counter = { nextId: 0 };
  return plan.map((w, r) => {
    const cells = ranges[r] ?? [];
    const shapes = cells.map((c) => polygons[c] ?? []);
    let largest = shapes[0] ?? [];
    for (const shape of shapes) if (signedArea(shape) > signedArea(largest)) largest = shape;
    const borders = new Set<ProvinceId>();
    for (const c of cells) {
      for (const n of adjacency[c] ?? []) {
        const id = provinceOf.get(n);
        if (id !== undefined) borders.add(id);
      }
    }
    return {
      id: newId(counter, 'wild'),
      kind: w.kind,
      name: names[r] ?? '',
      cells: shapes,
      center: centroid(largest),
      borders: [...borders].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))),
    };
  });
}
