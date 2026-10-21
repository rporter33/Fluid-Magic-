// Checks a generated map against the rules it must satisfy. generateMap retries until this
// returns no problems; tests use it as a broad property check across many seeds.
import { COLORS } from '../content/colors';
import { MAPGEN } from '../content/mapgen';
import { TERRAIN } from '../content/terrain';
import type { ProvinceId } from '../sim/ids';
import { signedArea } from './geometry';
import { bfsDistances, isConnected } from './graph';
import { independentStrength } from './placement';
import { provinceCount, wellspringCount } from './size';
import type { MapData, MapGenParams, MapProvince } from './types';

/** Problems found in `map`, as readable strings; empty when the map is valid. */
export function validateMap(map: MapData, params: MapGenParams): string[] {
  const problems: string[] = [];
  const provinces = Object.values(map.provinces);
  const index = new Map<ProvinceId, number>(provinces.map((p, i) => [p.id, i]));
  const at = (id: ProvinceId): MapProvince | undefined => map.provinces[id];

  const expected = provinceCount(params.size, params.capitals.length);
  if (provinces.length !== expected) {
    problems.push(`expected ${expected} provinces, got ${provinces.length}`);
  }
  provinces.forEach((p, i) => {
    if (p.id !== `p${i}`) problems.push(`province ${i} has id ${p.id}`);
    if (p.polygon.length < 3 || signedArea(p.polygon) <= 0) {
      problems.push(`${p.id} has a degenerate polygon`);
    }
    if (p.name.length === 0) problems.push(`${p.id} has no name`);
    const { min, max } = TERRAIN[p.terrain].startPop;
    if (p.capitalSlot === undefined && (p.startPop < min || p.startPop > max)) {
      problems.push(`${p.id} pop ${p.startPop} outside ${p.terrain} range`);
    }
    if (p.springs.length > MAPGEN.springCountWeights.length - 1 && p.capitalSlot === undefined) {
      problems.push(`${p.id} has ${p.springs.length} springs`);
    }
  });

  // Adjacency: symmetric, no self-loops or duplicates, enough neighbors, connected.
  const adjacency = provinces.map((p) => {
    if (new Set(p.neighbors).size !== p.neighbors.length) {
      problems.push(`${p.id} lists a neighbor twice`);
    }
    if (p.neighbors.length < MAPGEN.minNeighbors) {
      problems.push(`${p.id} has ${p.neighbors.length} neighbors`);
    }
    return p.neighbors.flatMap((n) => {
      const other = at(n);
      if (n === p.id || other === undefined) {
        problems.push(`${p.id} has bad neighbor ${n}`);
        return [];
      }
      if (!other.neighbors.includes(p.id)) problems.push(`${p.id}-${n} is one-way`);
      return [index.get(n) ?? 0];
    });
  });
  if (!isConnected(adjacency)) problems.push('province graph is not connected');

  // Capitals.
  const capitalIndices = map.capitals.map((id) => index.get(id) ?? -1);
  if (map.capitals.length !== params.capitals.length) {
    problems.push(`expected ${params.capitals.length} capitals, got ${map.capitals.length}`);
  }
  map.capitals.forEach((id, slot) => {
    const p = at(id);
    const spec = params.capitals[slot];
    if (p === undefined || spec === undefined) {
      problems.push(`capital slot ${slot} is invalid`);
      return;
    }
    if (p.capitalSlot !== slot) problems.push(`${id} capitalSlot is ${p.capitalSlot}`);
    if (p.terrain !== spec.terrain) problems.push(`${id} capital terrain is ${p.terrain}`);
    if (p.startPop !== MAPGEN.capitalPop) problems.push(`${id} capital pop is ${p.startPop}`);
    const own = p.springs.filter((c) => c === spec.color).length;
    if (own !== MAPGEN.capitalSprings || p.springs.length !== own) {
      problems.push(`${id} capital springs are ${p.springs.join('')}`);
    }
    const dist = bfsDistances(adjacency, [index.get(id) ?? 0]);
    for (const other of capitalIndices) {
      if (other !== index.get(id) && (dist[other] ?? 0) < MAPGEN.capitalMinDistance) {
        problems.push(`capitals ${id} and p${other} are ${dist[other]} apart`);
      }
    }
  });
  const slotted = provinces.filter((p) => p.capitalSlot !== undefined).length;
  if (slotted !== map.capitals.length) problems.push(`${slotted} provinces claim a capital slot`);

  // Distances, independents, and Wellsprings.
  const nearest = bfsDistances(adjacency, capitalIndices);
  const perCapital = capitalIndices.map((c) => bfsDistances(adjacency, [c]));
  const wells = new Set(map.wellsprings);
  if (map.wellsprings.length !== wellspringCount(params.capitals.length)) {
    problems.push(`expected ${wellspringCount(params.capitals.length)} Wellsprings`);
  }
  provinces.forEach((p, i) => {
    const isCapital = p.capitalSlot !== undefined;
    const isWell = wells.has(p.id);
    if (p.capitalDistance !== nearest[i]) problems.push(`${p.id} capitalDistance is wrong`);
    if (p.independentStrength !== independentStrength(p.capitalDistance, isCapital, isWell)) {
      problems.push(`${p.id} independent strength is ${p.independentStrength}`);
    }
    if (isWell !== (p.wellspring !== undefined)) problems.push(`${p.id} Wellspring flag mismatch`);
    if (isWell) {
      if (isCapital) problems.push(`${p.id} is both a capital and a Wellspring`);
      if (p.springs.length > 0) problems.push(`${p.id} Wellspring has springs`);
      for (const d of perCapital) {
        if ((d[i] ?? 0) < MAPGEN.wellspringMinCapitalDistance) {
          problems.push(`Wellspring ${p.id} is ${d[i]} from a capital`);
        }
      }
    }
  });

  // Springs: every color appears often enough outside the capitals.
  for (const color of COLORS) {
    const count = provinces
      .filter((p) => p.capitalSlot === undefined)
      .reduce((n, p) => n + p.springs.filter((c) => c === color).length, 0);
    if (count < MAPGEN.minSpringsPerColor) problems.push(`only ${count} ${color} springs`);
  }

  const names = new Set(provinces.map((p) => p.name));
  if (names.size !== provinces.length) problems.push('province names repeat');

  return problems;
}
