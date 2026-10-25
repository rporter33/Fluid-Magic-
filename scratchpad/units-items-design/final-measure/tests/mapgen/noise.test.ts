import { describe, expect, it } from 'vitest';
import { createSimplex2D, fractal } from '../../src/mapgen/noise';
import { createRng } from '../../src/sim/rng';

const samples = (noise: (x: number, y: number) => number) => {
  const out: number[] = [];
  for (let x = -5; x < 5; x += 0.37) for (let y = -5; y < 5; y += 0.41) out.push(noise(x, y));
  return out;
};

describe('simplex noise', () => {
  it('is deterministic per rng state and differs between states', () => {
    expect(samples(createSimplex2D(createRng(1)))).toEqual(samples(createSimplex2D(createRng(1))));
    expect(samples(createSimplex2D(createRng(1)))).not.toEqual(
      samples(createSimplex2D(createRng(2))),
    );
  });

  it('stays in [-1, 1] and uses a good part of the range', () => {
    const values = samples(createSimplex2D(createRng(3)));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...values)).toBeLessThanOrEqual(1);
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(1);
  });

  it('is continuous: nearby points have nearby values', () => {
    const noise = createSimplex2D(createRng(4));
    for (let x = 0; x < 3; x += 0.13) {
      for (let y = 0; y < 3; y += 0.17) {
        expect(Math.abs(noise(x, y) - noise(x + 0.001, y + 0.001))).toBeLessThan(0.02);
      }
    }
  });

  it('is zero at lattice corners and varies between them', () => {
    const noise = createSimplex2D(createRng(5));
    expect(noise(0, 0)).toBe(0);
    expect(new Set(samples(noise).map((v) => v.toFixed(3))).size).toBeGreaterThan(50);
  });
});

describe('fractal', () => {
  it('averages octaves into [-1, 1]', () => {
    const noise = createSimplex2D(createRng(6));
    for (let x = 0; x < 4; x += 0.29) {
      const v = fractal(noise, x, x / 2, 4);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('with one octave equals the base noise', () => {
    const noise = createSimplex2D(createRng(7));
    expect(fractal(noise, 1.3, 2.7, 1)).toBe(noise(1.3, 2.7));
  });
});
