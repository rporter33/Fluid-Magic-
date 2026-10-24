// Spell effects as data (docs/09-art-direction.md, "Spell effects"; docs/02-magic.md section 5):
// the effect families, each a fixed lifecycle of spawn, sustain and fade with a particle budget;
// the scale rule; and the motion grammar per color. A battle spell names its family and scale in
// its `fx` record; the replay viewer (Phase 10: render/effects/ and docs/12's presentation looks)
// reads this file and tunes nothing in render code. The sim never reads `fx`: the battle rules
// fingerprint leaves it out (spellRules) and tests/sim/fx.guard.test.ts keeps src/sim, src/ai and
// src/mapgen from naming it. Readings where docs/09 is silent are at the end of docs/09.
import type { Color } from './colors';

export const FX_FAMILIES = [
  'strike',
  'projectile',
  'burst',
  'field',
  'aura',
  'summon',
  'shock',
] as const;
export type FxFamily = (typeof FX_FAMILIES)[number];

export function isFxFamily(value: unknown): value is FxFamily {
  return typeof value === 'string' && (FX_FAMILIES as readonly string[]).includes(value);
}

export const FX_SCALES = [1, 2, 3] as const;
export type FxScale = (typeof FX_SCALES)[number];

/**
 * A battle spell's presentation (docs/02-magic.md section 5). The color is the spell's own (the
 * Radiance palette for holy spells). Rituals have none: the map shows a province ring instead.
 */
export interface SpellFx {
  family: FxFamily;
  /** 1 when absent. */
  scale?: FxScale;
  /**
   * The full form's length in ms: docs/12 S2.10's for the eleven M1 battle spells, whose beats,
   * lengths and particle counts win over the family's (owner decision 2026-10-24). Absent: the
   * family's own lifecycle at the spell's scale.
   */
  duration?: number;
}

/** Where a family's spawn appears. */
export type FxAnchor = 'target' | 'caster' | 'center' | 'area' | 'spawnPoint';
/** What the spawn draws. */
export type FxSpawnForm = 'flash' | 'sprite' | 'ring' | 'fill' | 'column' | 'pull';

export interface FxFamilyDef {
  id: FxFamily;
  /** What the family is for. */
  use: string;
  /** At scale 1. */
  spawn: { form: FxSpawnForm; at: FxAnchor; ms: number };
  /**
   * At scale 1: a fixed hold; the projectile's flight to its target; or a linger that lasts as
   * long as the effect does (a field until it ends; an aura pulsing on each target every
   * `pulseMs`), running under later cues.
   */
  sustain:
    | { kind: 'hold'; ms: number }
    | { kind: 'travel'; ms: number }
    | { kind: 'linger'; pulseMs: number | null };
  /** At scale 1: a fade in ms, or another family played on arrival (the projectile's burst). */
  fade: { kind: 'fade'; ms: number } | { kind: 'family'; family: FxFamily; scale: FxScale };
  /** At scale 1: per effect, per target (aura), or in the trail (projectile). */
  particles: { min: number; max: number; per: 'effect' | 'target' | 'trail'; drift?: 'slow' };
}

/** The family table of docs/09, "Families". */
export const FX_FAMILY_DEFS: Readonly<Record<FxFamily, FxFamilyDef>> = {
  strike: {
    id: 'strike',
    use: 'single-target damage',
    spawn: { form: 'flash', at: 'target', ms: 80 },
    sustain: { kind: 'hold', ms: 0 },
    fade: { kind: 'fade', ms: 150 },
    particles: { min: 6, max: 10, per: 'effect' },
  },
  projectile: {
    id: 'projectile',
    use: 'ranged damage with travel',
    spawn: { form: 'sprite', at: 'caster', ms: 0 },
    sustain: { kind: 'travel', ms: 300 },
    fade: { kind: 'family', family: 'burst', scale: 1 },
    particles: { min: 8, max: 8, per: 'trail' },
  },
  burst: {
    id: 'burst',
    use: 'area damage',
    spawn: { form: 'ring', at: 'center', ms: 120 },
    sustain: { kind: 'hold', ms: 150 },
    fade: { kind: 'fade', ms: 250 },
    particles: { min: 12, max: 40, per: 'effect' },
  },
  field: {
    id: 'field',
    use: 'fieldEffect, lingering area debuff',
    spawn: { form: 'fill', at: 'area', ms: 300 },
    sustain: { kind: 'linger', pulseMs: null },
    fade: { kind: 'fade', ms: 400 },
    particles: { min: 20, max: 20, per: 'effect', drift: 'slow' },
  },
  aura: {
    id: 'aura',
    use: 'buffs, heals, blessings on friendlies',
    spawn: { form: 'ring', at: 'caster', ms: 200 },
    sustain: { kind: 'linger', pulseMs: 500 },
    fade: { kind: 'fade', ms: 300 },
    particles: { min: 8, max: 8, per: 'target' },
  },
  summon: {
    id: 'summon',
    use: 'summon',
    spawn: { form: 'column', at: 'spawnPoint', ms: 400 },
    sustain: { kind: 'hold', ms: 0 },
    fade: { kind: 'fade', ms: 300 },
    particles: { min: 16, max: 16, per: 'effect' },
  },
  shock: {
    id: 'shock',
    use: 'moraleShock, debuff on enemies',
    spawn: { form: 'pull', at: 'target', ms: 100 },
    sustain: { kind: 'hold', ms: 200 },
    fade: { kind: 'fade', ms: 200 },
    particles: { min: 10, max: 10, per: 'effect' },
  },
};

/** Scale 2 and 3 multiply particle count and radius by 1.5 and 2 and add 100 ms to sustain. */
export const FX_SCALE_RULE: Readonly<
  Record<FxScale, { particles: number; radius: number; sustainMs: number }>
> = {
  1: { particles: 1, radius: 1, sustainMs: 0 },
  2: { particles: 1.5, radius: 1.5, sustainMs: 100 },
  3: { particles: 2, radius: 2, sustainMs: 100 },
};

/** docs/09's limits on effects ("Families", "Glow", "Readability rules"). */
export const FX_LIMITS = {
  /** A family's spawn, fixed sustain and fade at scale 1 fit one replay round at 1x (1.5 s). */
  familyMaxMs: 900,
  /** Burst and field effects playing at once; later casts in the round queue in event order. */
  concurrentBig: 3,
  /** Above this playback speed every effect skips its sustain; a storyboard plays its short form. */
  skipSustainAboveSpeed: 2,
  /** The families whose container gets a one-step blur, at this scale only. */
  blur: { families: ['burst', 'aura'], scale: 3 },
} as const satisfies {
  familyMaxMs: number;
  concurrentBig: number;
  skipSustainAboveSpeed: number;
  blur: { families: readonly FxFamily[]; scale: FxScale };
};

/**
 * A family's one-shot length in ms at `scale`: spawn, a fixed hold or travel with the scale's
 * extra sustain, and fade (the projectile's fade is its arrival burst). A lingering sustain lasts
 * as long as its effect and runs under later cues, so it is not counted.
 */
export function familyLengthMs(family: FxFamily, scale: FxScale): number {
  const def = FX_FAMILY_DEFS[family];
  const sustain =
    def.sustain.kind === 'linger' ? 0 : def.sustain.ms + FX_SCALE_RULE[scale].sustainMs;
  const fade =
    def.fade.kind === 'fade' ? def.fade.ms : familyLengthMs(def.fade.family, def.fade.scale);
  return def.spawn.ms + sustain + fade;
}

/** Palette use in every family: 70% of particles primary, 30% accent; secondary fills a field. */
export const FX_PALETTE_USE = {
  primary: 0.7,
  accent: 0.3,
  secondaryFill: 'field',
} as const satisfies { primary: number; accent: number; secondaryFill: FxFamily };

export type FxShape = 'line' | 'arc' | 'softCircle' | 'circle' | 'leaf';
/**
 * radiate: straight outward, no gravity; ripple: rings outward; sink: downward and inward; rise:
 * upward; spread: outward along the ground, hugging the row line; descend: rays from above.
 */
export type FxMotion = 'radiate' | 'ripple' | 'sink' | 'rise' | 'spread' | 'descend';
export type FxEasing = 'easeOut' | 'easeIn' | 'sineInOut';
export type FxPace = 'slow' | 'normal' | 'fast';
export type FxBlend = 'add' | 'normal' | 'multiply';

/** The color's motion grammar: the family says what happens, the color how it moves. */
export interface FxGrammarDef {
  /** The palette the particles take (holy spells take Radiance's). */
  palette: Color;
  shape: FxShape;
  /** Particle size in px where docs/09 gives one; null: set with the effects gallery (Phase 10). */
  sizePx: number | null;
  /** Random size spread as a share of the size. */
  sizeJitter: number;
  motion: FxMotion;
  pace: FxPace;
  easing: FxEasing;
  blend: FxBlend;
  alpha: number;
  /** Umbra's accent particles draw additive over its multiplied body; null: as the body. */
  accentBlend: FxBlend | null;
  /** Delay between successive rings (Tide). */
  staggerMs: number;
  /**
   * Tide's slight horizontal sway; Ember's x flicker, a hash of the particle's index and story
   * time, never the sim's rng and never a per-frame stream, so a scrubbed frame looks the same.
   */
  wobble: 'none' | 'sway' | 'flicker';
}

/**
 * The motion grammar per color (docs/09 "Motion grammar per color"), and holy spells (Bless):
 * rays from above in the Radiance palette (docs/12 S2.10's color grammar).
 */
export const FX_GRAMMAR: Readonly<Record<Color | 'holy', FxGrammarDef>> = {
  W: {
    palette: 'W',
    shape: 'line',
    sizePx: 2,
    sizeJitter: 0,
    motion: 'radiate',
    pace: 'normal',
    easing: 'easeOut',
    blend: 'add',
    alpha: 1,
    accentBlend: null,
    staggerMs: 0,
    wobble: 'none',
  },
  U: {
    palette: 'U',
    shape: 'arc',
    sizePx: null,
    sizeJitter: 0,
    motion: 'ripple',
    pace: 'normal',
    easing: 'sineInOut',
    blend: 'normal',
    alpha: 0.7,
    accentBlend: null,
    staggerMs: 60,
    wobble: 'sway',
  },
  B: {
    palette: 'B',
    shape: 'softCircle',
    sizePx: null,
    sizeJitter: 0,
    motion: 'sink',
    pace: 'slow',
    easing: 'easeIn',
    blend: 'multiply',
    alpha: 1,
    accentBlend: 'add',
    staggerMs: 0,
    wobble: 'none',
  },
  R: {
    palette: 'R',
    shape: 'circle',
    sizePx: 3,
    sizeJitter: 0.5,
    motion: 'rise',
    pace: 'fast',
    easing: 'easeOut',
    blend: 'add',
    alpha: 1,
    accentBlend: null,
    staggerMs: 0,
    wobble: 'flicker',
  },
  G: {
    palette: 'G',
    shape: 'leaf',
    sizePx: 4,
    sizeJitter: 0,
    motion: 'spread',
    pace: 'slow',
    easing: 'easeOut',
    blend: 'normal',
    alpha: 1,
    accentBlend: null,
    staggerMs: 0,
    wobble: 'none',
  },
  holy: {
    palette: 'W',
    shape: 'line',
    sizePx: 2,
    sizeJitter: 0,
    motion: 'descend',
    pace: 'normal',
    easing: 'easeOut',
    blend: 'add',
    alpha: 1,
    accentBlend: null,
    staggerMs: 0,
    wobble: 'none',
  },
};
