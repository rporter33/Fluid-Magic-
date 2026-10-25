// validateMap must reject every rule violation: each case breaks one rule on a valid map.
import { describe, expect, it } from 'vitest';
import { MAPGEN } from '../../src/content/mapgen';
import { generateMap } from '../../src/mapgen/generate';
import type { MapData, MapGenParams, MapProvince } from '../../src/mapgen/types';
import { validateMap } from '../../src/mapgen/validate';
import type { ProvinceId } from '../../src/sim/ids';
import { DEEPMOSS, KHARNATH } from './fixtures';

const params: MapGenParams = { seed: 5, size: 'medium', capitals: [KHARNATH, DEEPMOSS] };
const base = generateMap(params);
const prov = (map: MapData, id: ProvinceId): MapProvince => map.provinces[id]!;
const plain = (map: MapData) =>
  Object.values(map.provinces).filter(
    (p) => p.capitalSlot === undefined && p.wellspring === undefined,
  );

/** Moves the Wellspring at `slot` onto province `to`, carrying its flags with it. */
function moveWellspring(map: MapData, slot: number, to: ProvinceId): void {
  const from = prov(map, map.wellsprings[slot]!);
  const target = prov(map, to);
  target.wellspring = from.wellspring!;
  target.independentStrength = MAPGEN.wellspringStrength;
  target.springs = [];
  delete from.wellspring;
  from.independentStrength =
    MAPGEN.independentBase + MAPGEN.independentPerDistance * from.capitalDistance;
  map.wellsprings[slot] = to;
}

const cases: [string, (map: MapData) => void, RegExp][] = [
  [
    'a one-way neighbor',
    (map) => {
      const p = plain(map)[0]!;
      const n = prov(map, p.neighbors[0]!);
      n.neighbors = n.neighbors.filter((x) => x !== p.id);
    },
    /one-way/,
  ],
  [
    'a disconnected province',
    (map) => {
      const p = plain(map)[0]!;
      for (const n of p.neighbors) {
        prov(map, n).neighbors = prov(map, n).neighbors.filter((x) => x !== p.id);
      }
      p.neighbors = [];
    },
    /not connected/,
  ],
  [
    'capitals too close',
    (map) => {
      const old = prov(map, map.capitals[1]!);
      const near = prov(map, prov(map, map.capitals[0]!).neighbors[0]!);
      Object.assign(near, {
        capitalSlot: 1,
        terrain: old.terrain,
        startPop: old.startPop,
        springs: old.springs,
        independentStrength: 0,
      });
      delete old.capitalSlot;
      map.capitals[1] = near.id;
    },
    /capitals .* apart/,
  ],
  [
    'a wrong capital terrain',
    (map) => {
      prov(map, map.capitals[0]!).terrain = 'swamp';
    },
    /capital terrain/,
  ],
  [
    'a wrong capitalDistance',
    (map) => {
      plain(map)[0]!.capitalDistance += 1;
    },
    /capitalDistance is wrong/,
  ],
  [
    'a Wellspring next to a capital',
    (map) => {
      moveWellspring(map, 0, prov(map, map.capitals[0]!).neighbors[0]!);
    },
    /from a capital/,
  ],
  [
    'adjacent Wellsprings',
    (map) => {
      moveWellspring(map, 1, prov(map, map.wellsprings[0]!).neighbors[0]!);
    },
    /Wellsprings .* apart/,
  ],
  [
    'a Wellspring with springs',
    (map) => {
      prov(map, map.wellsprings[0]!).springs = ['W'];
    },
    /Wellspring has springs/,
  ],
  [
    'a repeated scale axis',
    (map) => {
      const first = prov(map, map.wellsprings[0]!).wellspring!;
      prov(map, map.wellsprings[1]!).wellspring = { ...first };
    },
    /repeat a scale axis/,
  ],
  [
    'an invalid scale step',
    (map) => {
      prov(map, map.wellsprings[0]!).wellspring = { axis: 'order', step: 2 as 1 };
    },
    /invalid scale step/,
  ],
  [
    'a missing spring color',
    (map) => {
      for (const p of plain(map)) p.springs = p.springs.filter((c) => c !== 'U');
    },
    /U springs/,
  ],
  [
    'a duplicate name',
    (map) => {
      const [a, b] = plain(map);
      b!.name = a!.name;
    },
    /names repeat/,
  ],
  [
    'a zero-length polygon edge',
    (map) => {
      const p = plain(map)[0]!;
      p.polygon.splice(1, 0, { ...p.polygon[1]! });
    },
    /zero-length edge/,
  ],
  [
    'a pop outside the terrain range',
    (map) => {
      plain(map)[0]!.startPop = 1;
    },
    /outside .* range/,
  ],
];

describe('validateMap', () => {
  it('accepts the generated map', () => {
    expect(validateMap(base, params)).toEqual([]);
  });

  it.each(cases)('rejects %s', (_, mutate, problem) => {
    const map = structuredClone(base);
    mutate(map);
    expect(validateMap(map, params).join('; ')).toMatch(problem);
  });
});
