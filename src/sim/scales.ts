// Scales of a nation and of a province (docs/01-core-rules.md section 12, docs/05-pretender.md).
import { DOMINION } from '../content/rules';
import {
  NEUTRAL_SCALES,
  SCALE_AXES,
  SCALE_DEFS,
  SCALE_MAX,
  SCALE_MIN,
  type ScaleEffectKey,
  type Scales,
} from '../content/pretenders/scales';
import type { NationId, ProvinceId } from './ids';
import { getMapProvince, getNation, getProvince } from './state';
import type { GameState } from './types';

function clampScale(value: number): number {
  return Math.max(SCALE_MIN, Math.min(SCALE_MAX, value));
}

/** Rounds halves away from zero, so both poles of an axis round alike. Never returns -0. */
export function roundHalfAway(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value)) || 0;
}

/** The pretender's scales plus one step per Wellspring province the nation owns, clamped. */
export function nationScales(state: GameState, nationId: NationId): Scales {
  const scales = { ...getNation(state, nationId).pretender.scales };
  for (const id of state.map.wellsprings) {
    const step = getMapProvince(state, id).wellspring;
    if (step && getProvince(state, id).owner === nationId) scales[step.axis] += step.step;
  }
  for (const axis of SCALE_AXES) scales[axis] = clampScale(scales[axis]);
  return scales;
}

/**
 * Scales in force in a province: the dominating nation's, scaled by dominion strength and
 * rounded, plus timed growth effects from rituals. Without dominion every axis is 0.
 */
export function provinceScales(state: GameState, provinceId: ProvinceId): Scales {
  const { dominion } = getProvince(state, provinceId);
  const scales = { ...NEUTRAL_SCALES };
  if (dominion.nation !== null && dominion.strength > 0) {
    const national = nationScales(state, dominion.nation);
    for (const axis of SCALE_AXES) {
      scales[axis] = roundHalfAway((national[axis] * dominion.strength) / DOMINION.max);
    }
  }
  for (const effect of state.provinceEffects) {
    if (effect.province === provinceId && effect.kind === 'growth') {
      scales.growth += effect.deltaScale;
    }
  }
  for (const axis of SCALE_AXES) scales[axis] = clampScale(scales[axis]);
  return scales;
}

/** One effect summed over all axes: steps toward a pole times that pole's per-step value. */
export function scaleEffect(scales: Scales, key: ScaleEffectKey): number {
  let total = 0;
  for (const axis of SCALE_AXES) {
    const value = scales[axis];
    const pole = value > 0 ? SCALE_DEFS[axis].positive : SCALE_DEFS[axis].negative;
    total += Math.abs(value) * (pole.effects[key] ?? 0);
  }
  return total;
}
