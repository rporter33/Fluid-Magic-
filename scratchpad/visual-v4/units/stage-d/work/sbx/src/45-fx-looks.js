'use strict';
// ---- the effects data table (stage D magic pilot; the future content/fx.ts of docs/06) ----
// Every effect timing, particle count and colour-grammar value lives here; the timeline (33-fx-timeline.js) and the
// effects layer (46 to 49) only read it. Sources: docs/12 S2.10 (the owner-directed spectacle: five beats, full and short
// durations, particle budgets), the art plan's storyboards (units/art-plan.md 7.3), the pretender-and-magic design's C.1
// and C.3, and docs/09's effect families, colour grammar and readability rules (commit 8056fa7). Where docs/09 and docs/12
// disagree (docs/09 caps an effect at 900 ms at scale 1 and 12 to 40 particles), docs/12 holds for now: change a spell's
// `fx.duration` here and its storyboard beats scale to it (fxBeats, 33-fx-timeline.js).

/** docs/02 fx records: family, scale and the full form's duration in ms (docs/12). Spells without one keep the old look. */
const FX_SPELLS = {
  emberDart: { family: 'projectile', scale: 1 }, fireball: { family: 'burst', scale: 2, duration: 1900, durationShort: 1300 },
  warcry: { family: 'aura', scale: 2 }, bloodFury: { family: 'aura', scale: 1 }, pyreStorm: { family: 'burst', scale: 3 },
  thornSpray: { family: 'burst', scale: 1 }, barkSkin: { family: 'aura', scale: 1 }, entangle: { family: 'shock', scale: 2, duration: 1400, durationShort: 975 },
  swarm: { family: 'summon', scale: 2 }, regrowth: { family: 'aura', scale: 3 },
};
/** docs/09 families at scale 1 (ms; particles). Scales 2 and 3 multiply particles and radius by 1.5 and 2, sustain +100 ms. */
const FX_FAMILIES = {
  strike: { spawn: 80, sustain: 0, fade: 150, particles: [6, 10] }, projectile: { spawn: 0, sustain: 300, fade: 0, particles: [8, 8] },
  burst: { spawn: 120, sustain: 150, fade: 250, particles: [12, 40], concurrent: true }, field: { spawn: 300, sustain: Infinity, fade: 400, particles: [20, 20], concurrent: true },
  aura: { spawn: 200, sustain: 500, fade: 300, particles: [8, 8] }, summon: { spawn: 400, sustain: 0, fade: 300, particles: [16, 16] },
  shock: { spawn: 100, sustain: 200, fade: 200, particles: [10, 10] },
};
const FX_SCALE = { 1: { n: 1, r: 1, sustain: 0 }, 2: { n: 1.5, r: 1.5, sustain: 100 }, 3: { n: 2, r: 2, sustain: 100 } };
/**
 * docs/09 colour grammar and palette (primary 70% of particles, accent 30%, secondary only for a field fill). px is the
 * particle's size at play zoom (a man of `FX_RULES.playManPx` px); jitter its size spread; flicker the per-frame x jitter
 * (wu) and brightness spread, drawn from a hash of the particle and the story frame, never from a random stream.
 */
const FX_GRAMMAR = {
  R: { name: 'Ember', shape: 'circle', frame: 'dot2', core: 0.36, px: 3, jitter: 0.5, motion: 'rise', ease: 'outFast', blend: 'add', flicker: { x: 0.9, a: 0.35 },
    primary: 0xd9442b, secondary: 0x7a1e12, accent: 0xffb347 },
  G: { name: 'Loam', shape: 'leaf', px: 4, jitter: 0.25, motion: 'spreadGround', ease: 'outSlow', blend: 'normal', hug: 2.5, across: 6,
    // the painted leaves (L4) nearest the primary and the accent by their mean colour; tinted a quarter toward it
    leavesPrimary: [1, 2, 4, 7, 11, 12], leavesAccent: [8, 9], tint: 0.25,
    primary: 0x3f8f3a, secondary: 0x244f22, accent: 0xa6d96a },
  split: 0.7,
};
/** Rules: at most 3 burst or field effects at once (later casts queue, in event order); short form and no linger above 2x. */
const FX_RULES = { maxConcurrent: 3, fastSpeed: 2, playManPx: 34 };

/**
 * Per spell: beats per form in story seconds [charge, release, travel, impact, linger] (full and short are docs/12's
 * storyboards, brief is S2.7's 0.5 s form, rushed its 0.3 s cast past 5.0 s), then each beat's counts, sizes (wu) and
 * timings (s). Lingering effects keep running under the next cues whatever the form.
 */
const FX_LOOKS = {
  fireball: {
    fx: FX_SPELLS.fireball, color: 'R', level: 2, tier: 2, template: 'burst', element: 'fire', budget: 150,
    beats: { full: [0.70, 0.06, 0.55, 0.14, 0.45], short: [0.35, 0.06, 0.55, 0.14, 0.20], brief: [0.10, 0.04, 0.22, 0.14, 0.00], rushed: [0.08, 0.03, 0.14, 0.05, 0.00] },
    orb: { r0: 4, r1: 14, apex: 120, apexBrief: 60, trail: 90, trailSparks: 20, sparkLife: 0.25, embers: 60, emberLife: [0.3, 0.42], spiral: [26, 54], glow: 54 },
    release: { ring: 60, recoil: 6, ringLife: 0.32, ringGrow: 0.12 },
    impact: { ring: 140, ringLife: 0.42, burst: 120, embers: 40, emberLife: [1.0, 1.5], emberSpread: [20, 60], emberRise: [30, 60], emberBurst: 0.35,
      sparks: 30, sparkLife: [0.12, 0.25], smoke: 20, smokeBorn: [0.05, 0.4], flip: 0.46, core: 2 / 60, pool: 66, poolLife: 0.45, glowAfter: [0.3, 1.8] },
    linger: { smoke: 2.0, scorch: 120, scorchAt: 0.03, scorchGrow: 0.25, scorchAlpha: 0.8, killScorch: 14 },
    light: { color: 0xffb347, charge: 46, travel: 70, impact: 140, impactLife: 0.6, tint: 0.35, shadow: 0.3 },
    footprint: { lead: 0.25, r: 7, out: 0.12 },
    trauma: 0.30, traumaLife: 0.55, link: 150, thrown: [16, 40], thrownFall: 0.7,
    fragment: { apex: 50, ring: 60, burst: 56, embers: 12, sparks: 10, smoke: 6, scorch: 34, flip: 0.36, launch: 0.03, fly: [0.18, 0.42], speed: 1100 },
    burnOut: { char: 0x3a3029, embers: 12, emberLife: 0.7, emberWindow: 0.9, smoke: 3.0 },
    // sound hooks (pretender-and-magic C.3): [cue, beat, offset s, gain dB]; 'hit' fires per struck troop at its hit
    sound: [['spell.R.charge', 'charge', 0, 0], ['spell.R.release', 'release', 0, -3], ['spell.R.travel', 'travel', 0, 0], ['spell.R.burst', 'impact', 0, 0], ['hit.burn', 'hit', 0, 0], ['spell.R.linger', 'linger', 0, 0]],
  },
  entangle: {
    fx: FX_SPELLS.entangle, color: 'G', level: 3, tier: 2, template: 'curse', element: 'nature', budget: 40,
    beats: { full: [0.45, 0.06, 0.29, 0.30, 0.30], short: [0.225, 0.06, 0.29, 0.30, 0.10] },
    flash: { color: 0xa6d96a, alpha: 0.15, dur: 0.06 },
    charge: { cracks: 5, len: [26, 48], split: 64 },
    release: { ring: 54, ringLife: 0.3, ringGrow: 0.1 },
    crack: { width: 16, wobble: 0.04 },
    impact: { erupt: 0.12, grow: 0.2, dirt: 22, dirtLife: [0.45, 0.65], leaves: 14, leafLife: [1.1, 1.5], leafSpread: [10, 26], runner: 5, runnerGrow: 0.15, thorns: 34, split: 52, splitGrow: 0.12, settle: 0.2, ringIn: 0.2 },
    hold: { coil: 14, thorns: 26, ring: 0xa6d96a, ringR: 26 },
    wither: 0.6, witherTint: 0xb08a60, scar: 16, scarAt: 0.3,
    footprint: { lead: 0.25, r: 7, out: 0.12 },
    sound: [['spell.G.charge', 'charge', 0, 0], ['roots.burst', 'impact', 0, 0], ['vox.effort', 'impact', 0.35, -6], ['vox.effort', 'impact', 1.1, -6], ['expire.soft', 'wither', 0, 0], ['spell.G.curse', 'wither', 0.05, -10]],
  },
};
/** Materials that are not the spell's colour: smoke and dirt keep their own tints (the palette split is for colour particles). */
const FX_COLORS = { emberLight: 0xffb347, emberBody: 0xfd6533, emberDark: 0x7a1e12, loamBody: 0x00674b, loamDark: 0x244f22, loamLight: 0xa6d96a, char: 0x2e2620, smoke: 0x3b3530, dirt: 0x3e3022, key: 0x1c1a17 };
/**
 * The staff head of each painted caster's charge pose (actA), in world units from the feet at scale 1, x toward screen
 * right on the unmirrored frame: measured on the tier S and H frames (units/stage-d/work/casters/tips.json).
 */
const FX_STAFF_TIPS = {
  'cinderMagus-03': { back: [4.4, -38.5], front: [-6.9, -44.5] },
  'elderDruid-08': { back: [4.4, -38.2], front: [-5.8, -41.9] },
  procedural: { back: [7, -33], front: [-7, -33] },
};
/** Particle and draw budgets checked by 97-pilot-checks.js (C.1 tier budgets; skills audit stage D item 11). */
const FX_BUDGET = { particles: { fireball: 150, entangle: 40 }, extraDraws: 6, decals: 8000, updateMs: 1.0 };
