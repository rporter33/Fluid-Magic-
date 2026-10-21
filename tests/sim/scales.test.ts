// Nation and province scales (docs/01-core-rules.md section 12, docs/05-pretender.md).
import { describe, expect, it } from 'vitest';
import { NEUTRAL_SCALES } from '../../src/content/pretenders/scales';
import { nationScales, provinceScales, roundHalfAway, scaleEffect } from '../../src/sim/scales';
import type { NationId, ProvinceId } from '../../src/sim/ids';
import { capitalOf, independentProvince, nationIds, redGame } from './fixtures';

describe('roundHalfAway', () => {
  it('rounds halves away from zero and never returns -0', () => {
    expect(roundHalfAway(1.5)).toBe(2);
    expect(roundHalfAway(-1.5)).toBe(-2);
    expect(roundHalfAway(2.4)).toBe(2);
    expect(roundHalfAway(-2.4)).toBe(-2);
    expect(Object.is(roundHalfAway(-0.4), 0)).toBe(true);
  });
});

describe('nationScales', () => {
  it('adds one step per owned Wellspring and clamps to -3..3', () => {
    const state = redGame(5, { order: 3, lore: -3 });
    const red = nationIds(state)[0]!;
    expect(nationScales(state, red)).toEqual({ ...NEUTRAL_SCALES, order: 3, lore: -3 });
    for (const id of state.map.wellsprings) state.provinces[id]!.owner = red;
    const scales = nationScales(state, red);
    const expected = { ...NEUTRAL_SCALES, order: 3, lore: -3 };
    for (const id of state.map.wellsprings) {
      const { axis, step } = state.map.provinces[id]!.wellspring!;
      expected[axis] = Math.max(-3, Math.min(3, expected[axis] + step));
    }
    expect(scales).toEqual(expected);
  });
});

describe('nationScales clamp', () => {
  it('stops at 3 and -3 and moves free axes', () => {
    const state = redGame(5, { order: 3, lore: -3 });
    const red = nationIds(state)[0]!;
    const [a, b, c] = state.map.wellsprings as [ProvinceId, ProvinceId, ProvinceId];
    state.map.provinces[a]!.wellspring = { axis: 'order', step: 1 };
    state.map.provinces[b]!.wellspring = { axis: 'lore', step: -1 };
    state.map.provinces[c]!.wellspring = { axis: 'growth', step: -1 };
    for (const id of [a, b, c]) state.provinces[id]!.owner = red;
    expect(nationScales(state, red)).toEqual({
      order: 3,
      lore: -3,
      growth: -1,
      wild: 0,
      sanctity: 0,
    });
  });
});

describe('provinceScales', () => {
  it("is the dominating nation's scales times strength / 10, rounded", () => {
    const state = redGame(5, { order: 3, growth: -2, wild: 1 });
    const red = nationIds(state)[0]!;
    // Strength 5: 1.5 -> 2, -1 -> -1, 0.5 -> 1.
    expect(provinceScales(state, capitalOf(state, red).id)).toEqual({
      ...NEUTRAL_SCALES,
      order: 2,
      growth: -1,
      wild: 1,
    });
  });

  it('is neutral without dominion and follows whoever dominates', () => {
    const state = redGame(10, { order: 3 });
    const [red, green] = nationIds(state) as [NationId, NationId];
    const p = independentProvince(state);
    expect(provinceScales(state, p.id)).toEqual(NEUTRAL_SCALES);
    p.dominion = { nation: red, strength: 10 };
    expect(provinceScales(state, p.id).order).toBe(3);
    p.dominion = { nation: green, strength: 10 };
    expect(provinceScales(state, p.id).order).toBe(0);
  });

  it('adds timed growth effects and clamps', () => {
    const state = redGame(10, { growth: 2 });
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red);
    state.provinceEffects.push({
      id: 'fx99' as never,
      province: capital.id,
      nation: red,
      source: 'fertileSeason',
      untilDay: 180,
      kind: 'growth',
      deltaScale: 2,
    });
    expect(provinceScales(state, capital.id).growth).toBe(3);
  });

  it('applies a growth effect only in its own province', () => {
    const state = redGame(10, { growth: 1 });
    const red = nationIds(state)[0]!;
    const capital = capitalOf(state, red);
    const other = independentProvince(state);
    other.dominion = { nation: red, strength: 10 };
    state.provinceEffects.push({
      id: 'fx99' as never,
      province: capital.id,
      nation: red,
      source: 'fertileSeason',
      untilDay: 180,
      kind: 'growth',
      deltaScale: 1,
    });
    expect(provinceScales(state, capital.id).growth).toBe(2);
    expect(provinceScales(state, other.id).growth).toBe(1);
  });
});

describe('scaleEffect', () => {
  it("uses each pole's own per-step value", () => {
    // Wild +15% supply per step, Artifice -10% per step.
    expect(scaleEffect({ ...NEUTRAL_SCALES, wild: 2 }, 'supplyPct')).toBeCloseTo(0.3, 12);
    expect(scaleEffect({ ...NEUTRAL_SCALES, wild: -2 }, 'supplyPct')).toBeCloseTo(-0.2, 12);
    // Growth +10% per step and Rot -10%, summed with Wild.
    expect(scaleEffect({ ...NEUTRAL_SCALES, wild: 1, growth: -3 }, 'supplyPct')).toBeCloseTo(
      0.15 - 0.3,
      12,
    );
  });

  it('applies formula effects in both directions', () => {
    // Gold: (1 + 0.07 * order); materials: -10% per Wild step, +10% per Artifice step.
    expect(scaleEffect({ ...NEUTRAL_SCALES, order: -3 }, 'goldPct')).toBeCloseTo(-0.21, 12);
    expect(scaleEffect({ ...NEUTRAL_SCALES, wild: 3 }, 'materialsPct')).toBeCloseTo(-0.3, 12);
    expect(scaleEffect({ ...NEUTRAL_SCALES, wild: -3 }, 'materialsPct')).toBeCloseTo(0.3, 12);
  });

  it('is zero for neutral scales', () => {
    expect(scaleEffect(NEUTRAL_SCALES, 'goldPct')).toBe(0);
  });
});
