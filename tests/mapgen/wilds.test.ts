// Impassable wild ranges (Phase 1b; war-table design 1.4 and 1.9): the plan, names, and the
// records; then Small maps with 2, 3 and 4 nations over seeds 1 to 30 with wilds on.
// wilds.place.test.ts tests placement, wilds.medium.test.ts and wilds.large.test.ts sweep the
// other sizes, and wilds.pins.test.ts pins a few wild maps.
import { describe, expect, it } from 'vitest';
import type { WildKind } from '../../src/content/mapgen';
import { WILD_NAME_PARTS } from '../../src/content/names';
import { createRng } from '../../src/sim/rng';
import { generateMap } from '../../src/mapgen/generate';
import {
  buildWilds,
  nameWilds,
  planWilds,
  wildName,
  wildRangeCount,
  type WildPlan,
} from '../../src/mapgen/wilds';
import type { ProvinceId } from '../../src/sim/ids';
import { FOUR_CAPITALS } from './fixtures';
import { expectWilds } from './wildChecks';

describe('planWilds', () => {
  it('plans round(provinces / 20) ranges: Small 2, Medium 3, Large 4, more with more nations', () => {
    expect([40, 60, 80, 85, 90, 110, 130].map(wildRangeCount)).toEqual([2, 3, 4, 4, 5, 6, 7]);
  });

  it('cycles peaks, mere, peaks and draws sizes within each kind', () => {
    const rng = createRng(7);
    const sizes: Record<WildKind, Set<number>> = { peaks: new Set(), mere: new Set() };
    for (let k = 0; k < 200; k++) {
      const plan = planWilds(rng, 110);
      expect(plan.map((w) => w.kind)).toEqual(['peaks', 'mere', 'peaks', 'peaks', 'mere', 'peaks']);
      for (const w of plan) sizes[w.kind].add(w.cells);
    }
    expect([...sizes.peaks].sort()).toEqual([1, 2, 3]);
    expect([...sizes.mere].sort()).toEqual([1, 2]);
  });

  it('draws the same plan from the same stream', () => {
    expect(planWilds(createRng(3), 60)).toEqual(planWilds(createRng(3), 60));
  });
});

/** Every name a range of `kind` can draw. */
function allNames(kind: WildKind): string[] {
  const { onsets, suffixes } = WILD_NAME_PARTS[kind];
  return onsets.flatMap((o) => suffixes.map((s) => o + s));
}

describe('names', () => {
  it('joins a first part and an ending of the kind', () => {
    const rng = createRng(1);
    for (const kind of ['peaks', 'mere'] as const) {
      const { onsets, suffixes } = WILD_NAME_PARTS[kind];
      for (let k = 0; k < 50; k++) {
        const name = wildName(rng, kind);
        expect(onsets.some((o) => suffixes.some((s) => o + s === name))).toBe(true);
      }
    }
  });

  it('never repeats a province name or another wild name', () => {
    const taken = new Set(allNames('peaks'));
    const names = nameWilds(createRng(2), ['peaks', 'peaks', 'mere'], taken);
    expect(new Set(names).size).toBe(3);
    for (const name of names) expect(taken.has(name)).toBe(false);
    expect(names[0]).toMatch(/ II$/);
  });

  it('redraws a taken name before it numbers one', () => {
    // Half the names are taken, so a free one turns up within the redraws.
    const taken = new Set(allNames('peaks').filter((_, i) => i % 2 === 0));
    expect(taken.size).toBe(allNames('peaks').length / 2);
    for (let seed = 1; seed <= 20; seed++) {
      for (const name of nameWilds(createRng(seed), ['peaks', 'peaks', 'peaks'], taken)) {
        expect(name).not.toMatch(/ II$/);
        expect(taken.has(name)).toBe(false);
      }
    }
  });

  it('never gives two ranges one name, even when every name is taken', () => {
    const taken = new Set(allNames('peaks'));
    for (let seed = 1; seed <= 50; seed++) {
      const names = nameWilds(createRng(seed), ['peaks', 'peaks', 'peaks', 'peaks'], taken);
      expect(new Set(names).size).toBe(4);
      for (const name of names) expect(taken.has(name)).toBe(false);
    }
  });
});

describe('buildWilds', () => {
  it('makes the records: ids from 0, the cells, the largest cell centroid, the borders', () => {
    const square = (x: number, s: number) => [
      { x, y: 0 },
      { x: x + s, y: 0 },
      { x: x + s, y: s },
      { x, y: s },
    ];
    const polygons = [square(0, 1), square(1, 2), square(3, 1), square(4, 1)];
    const adjacency = [[1], [0, 2], [1, 3], [2]];
    const provinceOf = new Map<number, ProvinceId>([
      [0, 'p0' as ProvinceId],
      [3, 'p1' as ProvinceId],
    ]);
    const plan: WildPlan[] = [{ kind: 'mere', cells: 2 }];
    const [wild] = buildWilds(plan, [[1, 2]], ['Still Mere'], polygons, adjacency, provinceOf);
    expect(wild).toEqual({
      id: 'w0',
      kind: 'mere',
      name: 'Still Mere',
      cells: [polygons[1], polygons[2]],
      center: { x: 2, y: 1 },
      borders: ['p0', 'p1'],
    });
  });
});

describe('Small maps with wilds', () => {
  const cases = [2, 3, 4].flatMap((nations) =>
    Array.from({ length: 30 }, (_, i) => ({ nations, seed: i + 1 })),
  );
  it.each(cases)('$nations nations, seed $seed', ({ nations, seed }) => {
    const params = {
      seed,
      size: 'small' as const,
      capitals: FOUR_CAPITALS.slice(0, nations),
      wilds: true,
    };
    expectWilds(generateMap(params), params, seed <= 2);
  });
});
