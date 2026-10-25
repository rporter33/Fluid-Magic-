import { describe, expect, it } from 'vitest';
import { drn, openD6 } from '../../src/sim/drn';
import { createRng } from '../../src/sim/rng';

const N = 200_000;

describe('openD6', () => {
  it('never returns a multiple of 6, since a 6 always rolls again', () => {
    const rng = createRng(1);
    for (let i = 0; i < 20_000; i++) expect(openD6(rng) % 6).not.toBe(0);
  });

  it('shows each face 1 to 5 about 1/6 of the time and explodes 1/6 of the time', () => {
    const rng = createRng(2);
    const counts = new Map<number, number>();
    let exploded = 0;
    for (let i = 0; i < N; i++) {
      const v = openD6(rng);
      if (v > 6) exploded++;
      else counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    for (let face = 1; face <= 5; face++) {
      expect((counts.get(face) ?? 0) / N).toBeCloseTo(1 / 6, 2);
    }
    expect(exploded / N).toBeCloseTo(1 / 6, 2);
  });

  it('has mean 4.2', () => {
    const rng = createRng(3);
    let sum = 0;
    for (let i = 0; i < N; i++) sum += openD6(rng);
    expect(sum / N).toBeCloseTo(4.2, 1);
  });
});

describe('drn', () => {
  it('has mean near 8.4 and minimum 2', () => {
    const rng = createRng(4);
    let sum = 0;
    let min = Number.POSITIVE_INFINITY;
    let above12 = 0;
    for (let i = 0; i < N; i++) {
      const v = drn(rng);
      sum += v;
      min = Math.min(min, v);
      if (v > 12) above12++;
    }
    // Standard deviation is about 4.2, so the standard error is about 0.01.
    expect(Math.abs(sum / N - 8.4)).toBeLessThan(0.05);
    expect(min).toBe(2);
    expect(above12).toBeGreaterThan(0);
  });

  it('rolls snake eyes about 1/36 of the time', () => {
    const rng = createRng(5);
    let twos = 0;
    for (let i = 0; i < N; i++) if (drn(rng) === 2) twos++;
    expect(twos / N).toBeCloseTo(1 / 36, 2);
  });

  it('is deterministic per seed', () => {
    const roll = (seed: number) => {
      const rng = createRng(seed);
      return Array.from({ length: 50 }, () => drn(rng));
    };
    expect(roll(77)).toEqual(roll(77));
  });

  it('wins a contested roll between equal skills about half the time', () => {
    // att + DRN > def + DRN with att = def: ties go to the defender, so slightly under 0.5.
    const rng = createRng(6);
    let wins = 0;
    let ties = 0;
    for (let i = 0; i < N; i++) {
      const a = drn(rng);
      const d = drn(rng);
      if (a > d) wins++;
      else if (a === d) ties++;
    }
    expect(wins / N).toBeCloseTo((1 - ties / N) / 2, 2);
  });
});
