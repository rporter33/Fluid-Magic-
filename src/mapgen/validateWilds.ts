// validateMap's checks on wild ranges (Phase 1b; war-table design 1.5). With wilds off a map
// has none. With wilds on: the range count, ids, kinds and cell counts; whole cells that share
// borders within a range and keep off the map's edge; borders that match the drawn geometry;
// no capital within 2 cell hops of a wild; no province bordering two ranges; no cut province;
// the provinces around each range within WILDS.maxDetour steps; unique names.
import { MAPGEN, WILD_KINDS, WILDS } from '../content/mapgen';
import type { ProvinceId, WildId } from '../sim/ids';
import { centroid, distance, sharedEdgeLength, signedArea, touchesOutline } from './geometry';
import { cutVertices, isConnected, maxPairDistance } from './graph';
import { provinceCount } from './size';
import type { MapData, MapGenParams, MapWild, Point } from './types';
import { wildRangeCount } from './wilds';

type Adjacency = readonly (readonly number[])[];

/** True when the polygon has 3 or more vertices, positive area and no zero-length edge. */
function wholeCell(cell: readonly Point[]): boolean {
  if (cell.length < 3 || signedArea(cell) <= 0) return false;
  return cell.every((v, k) => distance(v, cell[(k + 1) % cell.length] ?? v) > 0);
}

/** The provinces whose polygons share a border segment with a cell of `wild`, by id number. */
function drawnBorders(map: MapData, wild: MapWild, minBorder: number, tolerance: number) {
  const out: ProvinceId[] = [];
  for (const p of Object.values(map.provinces)) {
    const touches = wild.cells.some(
      (cell) => sharedEdgeLength(p.polygon, cell, tolerance) >= minBorder,
    );
    if (touches) out.push(p.id);
  }
  return out;
}

/** Problems with one range on its own: shape, cells, edge, borders, center. */
function rangeProblems(
  map: MapData,
  wild: MapWild,
  slot: number,
  minBorder: number,
  tolerance: number,
): string[] {
  const problems: string[] = [];
  if (wild.id !== `w${String(slot)}`) problems.push(`wild ${String(slot)} has id ${wild.id}`);
  if (!WILD_KINDS.includes(wild.kind)) return [...problems, `${wild.id} has kind ${wild.kind}`];
  const most = WILDS.cellWeights[wild.kind].length;
  if (wild.cells.length < 1 || wild.cells.length > most) {
    problems.push(`${wild.id} has ${String(wild.cells.length)} cells`);
  }
  if (!wild.cells.every(wholeCell)) return [...problems, `${wild.id} has a degenerate cell`];
  const touching = wild.cells.map((a, i) =>
    wild.cells.flatMap((b, j) =>
      i !== j && sharedEdgeLength(a, b, tolerance) >= minBorder ? [j] : [],
    ),
  );
  if (!isConnected(touching)) problems.push(`${wild.id} cells do not share borders`);
  if (wild.cells.some((cell) => touchesOutline(cell, map.outline, tolerance))) {
    problems.push(`${wild.id} touches the map edge`);
  }
  const drawn = drawnBorders(map, wild, minBorder, tolerance);
  if (drawn.join() !== wild.borders.join()) {
    problems.push(
      `${wild.id} borders ${wild.borders.join(',')} but its cells touch ${drawn.join(',')}`,
    );
  }
  let largest = wild.cells[0] ?? [];
  for (const cell of wild.cells) if (signedArea(cell) > signedArea(largest)) largest = cell;
  if (distance(centroid(largest), wild.center) > tolerance) {
    problems.push(`${wild.id} center is not its largest cell's centroid`);
  }
  if (wild.name.length === 0) problems.push(`${wild.id} has no name`);
  return problems;
}

/**
 * Problems with `map.wilds`, as readable strings. `adjacency` is the province graph by index
 * (province i is `p{i}`), as validateMap builds it.
 */
export function wildProblems(map: MapData, params: MapGenParams, adjacency: Adjacency): string[] {
  if (params.wilds !== true) {
    return map.wilds.length > 0 ? ['wilds on a map generated without them'] : [];
  }
  const problems: string[] = [];
  const scale = Math.sqrt(MAPGEN.provinceArea);
  const minBorder = MAPGEN.minSharedEdge * scale;
  const tolerance = 1e-6 * scale;
  const expected = wildRangeCount(provinceCount(params.size, params.capitals.length));
  if (map.wilds.length !== expected) {
    problems.push(`expected ${String(expected)} wild ranges, got ${String(map.wilds.length)}`);
  }
  const index = new Map(Object.keys(map.provinces).map((id, i) => [id, i]));
  const nearCapital = new Set<string>(map.capitals);
  for (const c of map.capitals) {
    for (const n of map.provinces[c]?.neighbors ?? []) nearCapital.add(n);
  }
  const borderedBy = new Map<ProvinceId, WildId>();
  const names = new Set(Object.values(map.provinces).map((p) => p.name));
  map.wilds.forEach((wild, slot) => {
    problems.push(...rangeProblems(map, wild, slot, minBorder, tolerance));
    const close = wild.borders.filter((p) => nearCapital.has(p));
    if (close.length > 0) {
      problems.push(`${wild.id} is within 2 of a capital at ${close.join(',')}`);
    }
    for (const p of wild.borders) {
      const other = borderedBy.get(p);
      if (other !== undefined) problems.push(`${p} borders both ${other} and ${wild.id}`);
      borderedBy.set(p, wild.id);
    }
    const around = wild.borders.flatMap((p) => {
      const i = index.get(p);
      return i === undefined ? [] : [i];
    });
    const detour = maxPairDistance(adjacency, around);
    if (detour > WILDS.maxDetour) {
      problems.push(`the way around ${wild.id} takes ${String(detour)} steps`);
    }
    if (names.has(wild.name)) problems.push(`${wild.id} repeats the name ${wild.name}`);
    names.add(wild.name);
  });
  const cut = cutVertices(adjacency);
  if (cut.length > 0) problems.push(`cut provinces ${cut.map((i) => `p${String(i)}`).join(',')}`);
  return problems;
}
