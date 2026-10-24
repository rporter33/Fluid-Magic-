// Spell effect data (src/content/fx.ts) against docs/09-art-direction.md, "Spell effects": the
// family table, the scale rule, the limits, palette use and the motion grammar per color. The
// spells' own fx records are checked in spells.test.ts.
import { describe, expect, it } from 'vitest';
import { COLORS } from '../../src/content/colors';
import {
  familyLengthMs,
  FX_FAMILIES,
  FX_FAMILY_DEFS,
  FX_GRAMMAR,
  FX_LIMITS,
  FX_PALETTE_USE,
  FX_SCALE_RULE,
  FX_SCALES,
  isFxFamily,
  type FxFamily,
} from '../../src/content/fx';

/** docs/09's family table: spawn ms, sustain, fade, particles [min, max]. */
const TABLE: Record<FxFamily, readonly [number, string, string, number, number]> = {
  strike: [80, 'hold 0', 'fade 150', 6, 10],
  projectile: [0, 'travel 300', 'burst at 1', 8, 8],
  burst: [120, 'hold 150', 'fade 250', 12, 40],
  field: [300, 'linger', 'fade 400', 20, 20],
  aura: [200, 'linger, pulse 500', 'fade 300', 8, 8],
  summon: [400, 'hold 0', 'fade 300', 16, 16],
  shock: [100, 'hold 200', 'fade 200', 10, 10],
};

function row(family: FxFamily): readonly [number, string, string, number, number] {
  const { spawn, sustain, fade, particles } = FX_FAMILY_DEFS[family];
  const held =
    sustain.kind === 'linger'
      ? `linger${sustain.pulseMs === null ? '' : `, pulse ${String(sustain.pulseMs)}`}`
      : `${sustain.kind} ${String(sustain.ms)}`;
  const faded =
    fade.kind === 'fade' ? `fade ${String(fade.ms)}` : `${fade.family} at ${String(fade.scale)}`;
  return [spawn.ms, held, faded, particles.min, particles.max];
}

describe('effect families', () => {
  it('are the seven of docs/09, each keyed by its own id', () => {
    expect(FX_FAMILIES).toEqual([
      'strike',
      'projectile',
      'burst',
      'field',
      'aura',
      'summon',
      'shock',
    ]);
    expect(Object.keys(FX_FAMILY_DEFS)).toEqual([...FX_FAMILIES]);
    for (const f of FX_FAMILIES) {
      expect(FX_FAMILY_DEFS[f].id).toBe(f);
      expect(isFxFamily(f)).toBe(true);
    }
    for (const bad of ['Strike', 'beam', '', null, 3]) expect(isFxFamily(bad)).toBe(false);
  });

  it('match the family table: spawn, sustain, fade and particles at scale 1', () => {
    for (const f of FX_FAMILIES) expect(row(f), f).toEqual(TABLE[f]);
  });

  it('spawn where the table says, with the particle budget per effect, target or trail', () => {
    const where = FX_FAMILIES.map((f) => {
      const { spawn, particles } = FX_FAMILY_DEFS[f];
      return `${f}: ${spawn.form} at ${spawn.at}, per ${particles.per}`;
    });
    expect(where).toEqual([
      'strike: flash at target, per effect',
      'projectile: sprite at caster, per trail',
      'burst: ring at center, per effect',
      'field: fill at area, per effect',
      'aura: ring at caster, per target',
      'summon: column at spawnPoint, per effect',
      'shock: pull at target, per effect',
    ]);
    expect(FX_FAMILIES.filter((f) => FX_FAMILY_DEFS[f].particles.drift === 'slow')).toEqual([
      'field',
    ]);
  });

  it('scale 2 and 3 multiply particles and radius by 1.5 and 2 and add 100 ms of sustain', () => {
    expect(FX_SCALES).toEqual([1, 2, 3]);
    expect(FX_SCALE_RULE).toEqual({
      1: { particles: 1, radius: 1, sustainMs: 0 },
      2: { particles: 1.5, radius: 1.5, sustainMs: 100 },
      3: { particles: 2, radius: 2, sustainMs: 100 },
    });
  });

  it('finish within one replay round at scale 1, lingering sustains aside', () => {
    const lengths = FX_FAMILIES.map((f) => familyLengthMs(f, 1));
    // The projectile flies 300 ms and bursts on arrival at scale 1 (120 + 150 + 250).
    expect(lengths).toEqual([230, 820, 520, 700, 500, 700, 500]);
    for (const ms of lengths) expect(ms).toBeLessThanOrEqual(FX_LIMITS.familyMaxMs);
    expect(familyLengthMs('burst', 2)).toBe(620);
    expect(familyLengthMs('burst', 3)).toBe(620);
    // A linger lasts as long as its effect, so the scale adds nothing to it.
    expect(familyLengthMs('aura', 3)).toBe(500);
    expect(familyLengthMs('projectile', 3)).toBe(920);
  });

  it('keep the limits of docs/09: 900 ms, 3 big effects, no sustain above 2x, blur at scale 3', () => {
    expect(FX_LIMITS).toEqual({
      familyMaxMs: 900,
      concurrentBig: 3,
      skipSustainAboveSpeed: 2,
      blur: { families: ['burst', 'aura'], scale: 3 },
    });
  });
});

describe('motion grammar', () => {
  it('covers W U B R G and holy, each color in its own palette and holy in Radiance', () => {
    expect(Object.keys(FX_GRAMMAR).sort()).toEqual([...COLORS, 'holy'].sort());
    for (const c of COLORS) expect(FX_GRAMMAR[c].palette).toBe(c);
    expect(FX_GRAMMAR.holy.palette).toBe('W');
  });

  it('matches the grammar table: shape, motion, easing and blend per color', () => {
    const lines = [...COLORS, 'holy' as const].map((c) => {
      const g = FX_GRAMMAR[c];
      const size = g.sizePx === null ? '' : `${String(g.sizePx)} px `;
      return `${c}: ${size}${g.shape}, ${g.motion} ${g.pace}, ${g.easing}, ${g.blend}`;
    });
    expect(lines).toEqual([
      'W: 2 px line, radiate normal, easeOut, add',
      'U: arc, ripple normal, sineInOut, normal',
      'B: softCircle, sink slow, easeIn, multiply',
      'R: 3 px circle, rise fast, easeOut, add',
      'G: 4 px leaf, spread slow, easeOut, normal',
      'holy: 2 px line, descend normal, easeOut, add',
    ]);
  });

  it('gives Tide its stagger, sway and alpha, Umbra its additive accent, Ember its jitter', () => {
    expect(FX_GRAMMAR.U).toMatchObject({ staggerMs: 60, wobble: 'sway', alpha: 0.7 });
    expect(FX_GRAMMAR.B.accentBlend).toBe('add');
    expect(FX_GRAMMAR.R).toMatchObject({ sizeJitter: 0.5, wobble: 'flicker' });
    for (const c of ['W', 'B', 'R', 'G', 'holy'] as const) {
      expect(FX_GRAMMAR[c].staggerMs, c).toBe(0);
      expect(FX_GRAMMAR[c].alpha, c).toBe(1);
    }
    for (const c of ['W', 'U', 'R', 'G', 'holy'] as const) {
      expect(FX_GRAMMAR[c].accentBlend, c).toBeNull();
    }
  });

  it('uses the palette 70% primary and 30% accent, secondary only for a field fill', () => {
    expect(FX_PALETTE_USE.primary + FX_PALETTE_USE.accent).toBeCloseTo(1, 12);
    expect(FX_PALETTE_USE).toEqual({ primary: 0.7, accent: 0.3, secondaryFill: 'field' });
  });
});
