// Seeded 2D simplex noise (after Stefan Gustavson's reference) and fractal sums of it.
// The permutation table comes from the rng, so the same rng state gives the same field.
import { shuffle, type RngState } from '../sim/rng';

export type Noise2D = (x: number, y: number) => number;

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const GRADIENTS: readonly (readonly [number, number])[] = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Simplex noise in [-1, 1] with a permutation drawn from `rng`. */
export function createSimplex2D(rng: RngState): Noise2D {
  const order = shuffle(
    rng,
    Array.from({ length: 256 }, (_, i) => i),
  );
  const perm = (k: number): number => order[k & 255] ?? 0;

  const corner = (gi: number, x: number, y: number): number => {
    const t = 0.5 - x * x - y * y;
    if (t < 0) return 0;
    const [gx, gy] = GRADIENTS[gi % GRADIENTS.length] ?? [0, 0];
    return t * t * t * t * (gx * x + gy * y);
  };

  return (xin, yin) => {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const n0 = corner(perm(i + perm(j)), x0, y0);
    const n1 = corner(perm(i + i1 + perm(j + j1)), x1, y1);
    const n2 = corner(perm(i + 1 + perm(j + 1)), x2, y2);
    return Math.max(-1, Math.min(1, 70 * (n0 + n1 + n2)));
  };
}

/** Fractal sum of `octaves` layers, each at double frequency and half amplitude; in [-1, 1]. */
export function fractal(noise: Noise2D, x: number, y: number, octaves: number): number {
  let sum = 0;
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amplitude * noise(x * frequency, y * frequency);
    total += amplitude;
    amplitude /= 2;
    frequency *= 2;
  }
  return total > 0 ? sum / total : 0;
}
