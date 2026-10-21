// Seeded PRNG: xoshiro128** with a splitmix32 seeder. The state is a plain object of four
// uint32 words so it lives inside GameState and survives JSON round trips unchanged.
// Every random decision in the sim and mapgen goes through these functions.

export interface RngState {
  a: number;
  b: number;
  c: number;
  d: number;
}

const TWO_POW_32 = 0x1_0000_0000;

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

/** One splitmix32 step: advances `x` and returns the mixed output alongside it. */
function splitmix32(x: number): { next: number; out: number } {
  const next = (x + 0x9e3779b9) >>> 0;
  let z = next;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
  return { next, out: (z ^ (z >>> 16)) >>> 0 };
}

/** Builds a generator from a seed. Seeds are reduced to 32 bits (ToUint32). */
export function createRng(seed: number): RngState {
  if (!Number.isFinite(seed)) throw new RangeError(`rng seed must be finite, got ${seed}`);
  let x = Math.trunc(seed) >>> 0;
  const words: number[] = [];
  for (let i = 0; i < 4; i++) {
    const step = splitmix32(x);
    x = step.next;
    words.push(step.out);
  }
  const [a = 0, b = 0, c = 0, d = 0] = words;
  // xoshiro must never hold the all-zero state.
  return a === 0 && b === 0 && c === 0 && d === 0 ? { a: 1, b, c, d } : { a, b, c, d };
}

export function cloneRng(rng: RngState): RngState {
  return { a: rng.a, b: rng.b, c: rng.c, d: rng.d };
}

/** Type guard for deserialized state: four uint32 words, not all zero. */
export function isRngState(value: unknown): value is RngState {
  if (typeof value !== 'object' || value === null) return false;
  const words = [
    (value as Record<string, unknown>).a,
    (value as Record<string, unknown>).b,
    (value as Record<string, unknown>).c,
    (value as Record<string, unknown>).d,
  ];
  const valid = words.every(
    (w) => typeof w === 'number' && Number.isInteger(w) && w >= 0 && w < TWO_POW_32,
  );
  return valid && words.some((w) => w !== 0);
}

/** Next raw output as a uint32. Mutates `rng`. */
export function nextU32(rng: RngState): number {
  const result = Math.imul(rotl(Math.imul(rng.b, 5) >>> 0, 7), 9) >>> 0;
  const t = (rng.b << 9) >>> 0;
  rng.c = (rng.c ^ rng.a) >>> 0;
  rng.d = (rng.d ^ rng.b) >>> 0;
  rng.b = (rng.b ^ rng.c) >>> 0;
  rng.a = (rng.a ^ rng.d) >>> 0;
  rng.c = (rng.c ^ t) >>> 0;
  rng.d = rotl(rng.d, 11);
  return result;
}

/** Uniform float in [0, 1). */
export function nextFloat(rng: RngState): number {
  return nextU32(rng) / TWO_POW_32;
}

/** Uniform integer in [0, n), unbiased. `n` must be an integer in 1..2^32. */
export function randBelow(rng: RngState, n: number): number {
  if (!Number.isInteger(n) || n < 1 || n > TWO_POW_32) {
    throw new RangeError(`randBelow bound must be an integer in 1..2^32, got ${n}`);
  }
  const limit = TWO_POW_32 - (TWO_POW_32 % n);
  let x = nextU32(rng);
  while (x >= limit) x = nextU32(rng);
  return x % n;
}

/** Uniform integer in [min, max], both inclusive. */
export function randInt(rng: RngState, min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new RangeError(`randInt needs integers with min <= max, got ${min}..${max}`);
  }
  return min + randBelow(rng, max - min + 1);
}

/** True with probability `p` (clamped to [0, 1]). Always consumes one draw. */
export function chance(rng: RngState, p: number): boolean {
  return nextFloat(rng) < p;
}

/** Uniformly chosen element. Throws on an empty list. */
export function pick<T>(rng: RngState, items: readonly T[]): T {
  if (items.length === 0) throw new RangeError('pick from an empty list');
  return items[randBelow(rng, items.length)] as T;
}

/** Fisher-Yates shuffle in place; returns the same array. */
export function shuffle<T>(rng: RngState, items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randBelow(rng, i + 1);
    const tmp = items[i] as T;
    items[i] = items[j] as T;
    items[j] = tmp;
  }
  return items;
}
