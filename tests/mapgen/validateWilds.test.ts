// validateMap's wild checks (Phase 1b; war-table design 1.5 and 1.9) must reject every rule a
// wild range can break: each case breaks one rule on a valid map generated with wilds.
import { describe, expect, it } from 'vitest';
import { generateMap } from '../../src/mapgen/generate';
import type { MapData, MapGenParams, Point } from '../../src/mapgen/types';
import { validateMap } from '../../src/mapgen/validate';
import type { ProvinceId } from '../../src/sim/ids';
import { TWO_CAPITALS, hopsFrom, indexAdjacency, indexOf } from './fixtures';

const params: MapGenParams = { seed: 5, size: 'medium', capitals: TWO_CAPITALS, wilds: true };
const base = generateMap(params);

const shift = (cell: Point[], dx: number, dy: number) => {
  for (const v of cell) {
    v.x += dx;
    v.y += dy;
  }
};
const plain = (map: MapData) =>
  Object.values(map.provinces).filter(
    (p) => p.capitalSlot === undefined && p.wellspring === undefined,
  );

/**
 * A province whose largest hop distance to w0's borders is exactly `steps`, so adding it to the
 * borders makes the way around w0 exactly `steps` long (the generated way around is at most 6).
 */
function farFromW0(map: MapData, steps: number): ProvinceId {
  const adjacency = indexAdjacency(map);
  const from = map.wilds[0]!.borders.map((b) => hopsFrom(adjacency, indexOf(map, b)));
  const far = adjacency.findIndex((_, i) => Math.max(...from.map((d) => d[i]!)) === steps);
  expect(far).toBeGreaterThanOrEqual(0);
  return `p${far}` as ProvinceId;
}

const cases: [string, (map: MapData) => void, RegExp][] = [
  [
    'a wild touching a capital neighbor',
    (map) => {
      const near = map.provinces[map.capitals[0]!]!.neighbors[0]!;
      map.wilds[0]!.borders.push(near);
    },
    /w0 is within 2 of a capital/,
  ],
  [
    'a wild bordering a capital itself',
    (map) => {
      map.wilds[0]!.borders = [map.capitals[0]!];
    },
    new RegExp(`w0 is within 2 of a capital at ${base.capitals[0]!}(;|$)`),
  ],
  [
    'a wild cell on the map edge',
    (map) => {
      const cell = map.wilds[0]!.cells[0]!;
      const corner = map.outline[0]!;
      shift(cell, corner.x - cell[0]!.x, corner.y - cell[0]!.y);
    },
    /w0 touches the map edge/,
  ],
  [
    'two ranges sharing a bordering province',
    (map) => {
      map.wilds[1]!.borders.push(map.wilds[0]!.borders[0]!);
    },
    /borders both w0 and w1/,
  ],
  [
    'a cut province',
    (map) => {
      // Two plain neighbors x and y with a common neighbor v keep only each other and v.
      for (const x of plain(map)) {
        for (const y of x.neighbors) {
          const v = x.neighbors.find((n) => n !== y && map.provinces[y]!.neighbors.includes(n));
          if (v === undefined) continue;
          for (const [p, keep] of [
            [x.id, [y, v]],
            [y, [x.id, v]],
          ] as const) {
            for (const n of map.provinces[p]!.neighbors) {
              if (!keep.includes(n)) {
                const other = map.provinces[n]!;
                other.neighbors = other.neighbors.filter((m) => m !== p);
              }
            }
            map.provinces[p]!.neighbors = [...keep].sort(
              (a, b) => Number(a.slice(1)) - Number(b.slice(1)),
            );
          }
          return;
        }
      }
    },
    /cut provinces/,
  ],
  [
    'a way around of exactly 7',
    (map) => {
      map.wilds[0]!.borders.push(farFromW0(map, 7));
    },
    /the way around w0 takes 7 steps/,
  ],
  [
    'a wild named like a province',
    (map) => {
      map.wilds[0]!.name = Object.values(map.provinces)[0]!.name;
    },
    /w0 repeats the name/,
  ],
  [
    'two wilds with one name',
    (map) => {
      map.wilds[2]!.name = map.wilds[0]!.name;
    },
    /w2 repeats the name/,
  ],
  [
    'a missing range',
    (map) => {
      map.wilds.pop();
    },
    /expected 3 wild ranges, got 2/,
  ],
  [
    'an extra range',
    (map) => {
      map.wilds.push(structuredClone(map.wilds[0]!));
    },
    /expected 3 wild ranges, got 4/,
  ],
  [
    'an unknown kind',
    (map) => {
      (map.wilds[0] as { kind: string }).kind = 'chasm';
    },
    /w0 has kind chasm/,
  ],
  [
    'a wrong id',
    (map) => {
      map.wilds[1]!.id = 'w7' as (typeof map.wilds)[1]['id'];
    },
    /wild 1 has id w7/,
  ],
  [
    'too many cells',
    (map) => {
      const w = map.wilds[0]!;
      while (w.cells.length < 4) w.cells.push(structuredClone(w.cells[0]!));
    },
    /w0 has 4 cells/,
  ],
  [
    'a mere of 3 cells',
    (map) => {
      const mere = map.wilds[1]!;
      while (mere.cells.length < 3) mere.cells.push(structuredClone(mere.cells[0]!));
    },
    /w1 has 3 cells/,
  ],
  [
    'a range with no cells',
    (map) => {
      map.wilds[0]!.cells = [];
    },
    /w0 has 0 cells/,
  ],
  [
    'a degenerate cell',
    (map) => {
      map.wilds[0]!.cells[0] = map.wilds[0]!.cells[0]!.slice(0, 2);
    },
    /w0 has a degenerate cell/,
  ],
  [
    'a clockwise cell',
    (map) => {
      map.wilds[0]!.cells[0]!.reverse();
    },
    /w0 has a degenerate cell/,
  ],
  [
    'a cell with a repeated vertex',
    (map) => {
      const cell = map.wilds[0]!.cells[0]!;
      cell.splice(1, 0, { ...cell[1]! });
    },
    /w0 has a degenerate cell/,
  ],
  [
    'cells that do not share a border',
    (map) => {
      const w = map.wilds.find((x) => x.cells.length > 1)!;
      shift(w.cells[1]!, 0.5, 0.5);
    },
    /cells do not share borders/,
  ],
  [
    'borders that do not match the cells',
    (map) => {
      map.wilds[0]!.borders.pop();
    },
    /w0 borders .* but its cells touch/,
  ],
  [
    'a border swapped for a province the cells do not touch',
    (map) => {
      const w = map.wilds[0]!;
      const other = Object.values(map.provinces).find((p) => !w.borders.includes(p.id))!;
      w.borders[0] = other.id;
      w.borders.sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    },
    /w0 borders .* but its cells touch/,
  ],
  [
    'a moved label anchor',
    (map) => {
      map.wilds[0]!.center = { x: 0, y: 0 };
    },
    /w0 center is not its largest cell's centroid/,
  ],
  [
    'an empty name',
    (map) => {
      map.wilds[0]!.name = '';
    },
    /w0 has no name/,
  ],
];

describe('validateMap with wilds', () => {
  it('accepts the generated map, which has wilds of both kinds', () => {
    expect(validateMap(base, params)).toEqual([]);
    expect(base.wilds.map((w) => w.kind)).toEqual(['peaks', 'mere', 'peaks']);
    expect(base.wilds.some((w) => w.cells.length > 1)).toBe(true);
  });

  it.each(cases)('rejects %s', (_, mutate, problem) => {
    const map = structuredClone(base);
    mutate(map);
    expect(validateMap(map, params).join('; ')).toMatch(problem);
  });

  it('accepts a way around of exactly 6', () => {
    const map = structuredClone(base);
    map.wilds[0]!.borders.push(farFromW0(map, 6));
    const problems = validateMap(map, params).join('; ');
    // Only the borders check notices: the cells do not touch the added province.
    expect(problems).toMatch(/w0 borders .* but its cells touch/);
    expect(problems).not.toMatch(/the way around/);
  });

  it('rejects wilds on a map generated without them', () => {
    expect(validateMap(base, { ...params, wilds: false }).join('; ')).toMatch(
      /wilds on a map generated without them/,
    );
    const without = generateMap({ ...params, wilds: false });
    expect(without.wilds).toEqual([]);
    expect(validateMap(without, { ...params, wilds: false })).toEqual([]);
  });
});
