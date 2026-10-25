import { describe, expect, it } from 'vitest';
import {
  chance,
  cloneRng,
  createRng,
  isRngState,
  nextFloat,
  nextU32,
  pick,
  randBelow,
  randInt,
  shuffle,
  weightedIndex,
  type RngState,
} from '../../src/sim/rng';

function draws(rng: RngState, n: number): number[] {
  return Array.from({ length: n }, () => nextU32(rng));
}

describe('xoshiro128** core', () => {
  it('matches the reference implementation from state [1, 2, 3, 4]', () => {
    // Output of the reference C code (prng.di.unimi.it/xoshiro128starstar.c).
    const rng: RngState = { a: 1, b: 2, c: 3, d: 4 };
    expect(draws(rng, 8)).toEqual([
      11520, 0, 5927040, 70819200, 2031721883, 1637235492, 1287239034, 3734860849,
    ]);
  });
});

describe('createRng', () => {
  it('is deterministic per seed', () => {
    expect(draws(createRng(42), 100)).toEqual(draws(createRng(42), 100));
  });

  it('gives different streams for different seeds', () => {
    expect(draws(createRng(1), 10)).not.toEqual(draws(createRng(2), 10));
    expect(draws(createRng(0), 10)).not.toEqual(draws(createRng(1), 10));
  });

  it('pins the seeded stream so saves stay valid across refactors', () => {
    // If this changes, every saved game and recorded seed changes meaning.
    // Values cross-checked against a C build of splitmix32 + xoshiro128**.
    const rng = createRng(1);
    expect(rng).toEqual({ a: 2527132011, b: 314344336, c: 2535364964, d: 2041432039 });
    expect(draws(rng, 4)).toEqual([2442144158, 3238099751, 3819917871, 2104621829]);
  });

  it('reduces seeds to 32 bits', () => {
    expect(createRng(2 ** 32 + 7)).toEqual(createRng(7));
    expect(createRng(-1)).toEqual(createRng(2 ** 32 - 1));
    expect(createRng(7.9)).toEqual(createRng(7));
  });

  it('rejects non-finite seeds', () => {
    expect(() => createRng(Number.NaN)).toThrow(RangeError);
    expect(() => createRng(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it('only produces uint32 state words', () => {
    const rng = createRng(123);
    for (let i = 0; i < 1000; i++) {
      nextU32(rng);
      expect(isRngState(rng)).toBe(true);
    }
  });
});

describe('serialization', () => {
  it('continues identically after a JSON round trip', () => {
    const rng = createRng(2024);
    draws(rng, 37);
    const restored: unknown = JSON.parse(JSON.stringify(rng));
    expect(isRngState(restored)).toBe(true);
    if (!isRngState(restored)) return;
    expect(draws(restored, 200)).toEqual(draws(rng, 200));
  });

  it('round-trips when embedded in a larger state object', () => {
    const state = { day: 3, rng: createRng(9) };
    nextFloat(state.rng);
    const copy = JSON.parse(JSON.stringify(state)) as typeof state;
    expect(nextFloat(copy.rng)).toBe(nextFloat(state.rng));
  });

  it('cloneRng forks an independent copy', () => {
    const rng = createRng(5);
    const copy = cloneRng(rng);
    expect(draws(copy, 10)).toEqual(draws(rng, 10));
    nextU32(copy);
    expect(copy).not.toEqual(rng);
  });

  it('isRngState rejects malformed values', () => {
    expect(isRngState(null)).toBe(false);
    expect(isRngState({ a: 1, b: 2, c: 3 })).toBe(false);
    expect(isRngState({ a: 0, b: 0, c: 0, d: 0 })).toBe(false);
    expect(isRngState({ a: -1, b: 2, c: 3, d: 4 })).toBe(false);
    expect(isRngState({ a: 2 ** 32, b: 2, c: 3, d: 4 })).toBe(false);
    expect(isRngState({ a: 1.5, b: 2, c: 3, d: 4 })).toBe(false);
    expect(isRngState({ a: '1', b: 2, c: 3, d: 4 })).toBe(false);
    expect(isRngState({ a: 1, b: 2, c: 3, d: 4 })).toBe(true);
  });
});

describe('distribution sanity', () => {
  const N = 100_000;

  it('nextFloat is in [0, 1) with mean near 0.5', () => {
    const rng = createRng(11);
    let sum = 0;
    let min = 1;
    let max = 0;
    for (let i = 0; i < N; i++) {
      const x = nextFloat(rng);
      sum += x;
      min = Math.min(min, x);
      max = Math.max(max, x);
    }
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThan(1);
    // Standard error of the mean is 0.29 / sqrt(N) ~ 0.0009.
    expect(sum / N).toBeCloseTo(0.5, 2);
  });

  it('randInt covers its range uniformly (chi-square)', () => {
    const rng = createRng(12);
    const sides = 10;
    const counts = new Array<number>(sides).fill(0);
    for (let i = 0; i < N; i++) {
      const v = randInt(rng, 1, sides);
      counts[v - 1] = (counts[v - 1] ?? 0) + 1;
    }
    const expected = N / sides;
    const chi2 = counts.reduce((acc, c) => acc + (c - expected) ** 2 / expected, 0);
    // 9 degrees of freedom; p = 0.001 critical value is 27.88.
    expect(chi2).toBeLessThan(27.88);
    expect(counts.every((c) => c > 0)).toBe(true);
  });

  it('chance matches its probability', () => {
    const rng = createRng(13);
    let hits = 0;
    for (let i = 0; i < N; i++) if (chance(rng, 0.3)) hits++;
    expect(hits / N).toBeCloseTo(0.3, 2);
    expect(chance(rng, 0)).toBe(false);
    expect(chance(rng, 1)).toBe(true);
  });

  it('bits are balanced', () => {
    const rng = createRng(14);
    const ones = new Array<number>(32).fill(0);
    for (let i = 0; i < N; i++) {
      const x = nextU32(rng);
      for (let bit = 0; bit < 32; bit++) if ((x >>> bit) & 1) ones[bit] = (ones[bit] ?? 0) + 1;
    }
    for (const count of ones) expect(count / N).toBeCloseTo(0.5, 1);
  });
});

describe('helpers', () => {
  it('randBelow and randInt validate their bounds', () => {
    const rng = createRng(1);
    expect(() => randBelow(rng, 0)).toThrow(RangeError);
    expect(() => randBelow(rng, 1.5)).toThrow(RangeError);
    expect(() => randBelow(rng, 2 ** 32 + 1)).toThrow(RangeError);
    expect(() => randInt(rng, 5, 4)).toThrow(RangeError);
    expect(randInt(rng, 7, 7)).toBe(7);
    expect(randBelow(rng, 1)).toBe(0);
    const big = randBelow(rng, 2 ** 32);
    expect(big).toBeGreaterThanOrEqual(0);
    expect(big).toBeLessThan(2 ** 32);
  });

  it('randInt handles negative ranges', () => {
    const rng = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(randInt(rng, -3, 3));
    expect([...seen].sort((x, y) => x - y)).toEqual([-3, -2, -1, 0, 1, 2, 3]);
  });

  it('pick returns members and throws on empty input', () => {
    const rng = createRng(4);
    const items = ['a', 'b', 'c'] as const;
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(pick(rng, items));
    expect([...seen].sort()).toEqual(['a', 'b', 'c']);
    expect(() => pick(rng, [])).toThrow(RangeError);
  });

  it('weightedIndex follows the weights and skips zero weights', () => {
    const rng = createRng(31);
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 60_000; i++) {
      const k = weightedIndex(rng, [50, 0, 35, 15]);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    expect(counts[1]).toBe(0);
    const expected = [0.5, 0.35, 0.15].map((p) => p * 60_000);
    const observed = [counts[0]!, counts[2]!, counts[3]!];
    const chi2 = observed.reduce((acc, o, i) => acc + (o - expected[i]!) ** 2 / expected[i]!, 0);
    // 2 degrees of freedom; p = 0.001 critical value is 13.82.
    expect(chi2).toBeLessThan(13.82);
  });

  it('weightedIndex rejects bad weights', () => {
    const rng = createRng(32);
    expect(() => weightedIndex(rng, [])).toThrow(RangeError);
    expect(() => weightedIndex(rng, [0, 0])).toThrow(RangeError);
    expect(() => weightedIndex(rng, [1, -1])).toThrow(RangeError);
    expect(() => weightedIndex(rng, [1, Number.NaN])).toThrow(RangeError);
    expect(weightedIndex(rng, [0, 0, 3])).toBe(2);
  });

  it('shuffle permutes in place and is deterministic', () => {
    const a = shuffle(createRng(8), [1, 2, 3, 4, 5, 6, 7, 8]);
    const b = shuffle(createRng(8), [1, 2, 3, 4, 5, 6, 7, 8]);
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(a).not.toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('shuffle produces every permutation of 3 items', () => {
    const rng = createRng(21);
    const seen = new Set<string>();
    for (let i = 0; i < 600; i++) seen.add(shuffle(rng, [1, 2, 3]).join(''));
    expect(seen.size).toBe(6);
  });
});
