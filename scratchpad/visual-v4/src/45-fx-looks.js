'use strict';
// ---- the effects data table (stage D magic pilot; the future content/fx.ts of docs/06) ----
// Every effect timing, particle count and colour-grammar value lives here; the timeline (33-fx-timeline.js) and the
// effects layer (46 to 49) only read it. Sources: docs/12 S2.10 (the owner-directed spectacle: five beats, full and short
// durations, particle budgets), the art plan's storyboards (units/art-plan.md 7.3), the pretender-and-magic design's C.1
// and C.3, and docs/09's effect families, colour grammar and readability rules. Durations and particle counts: docs/12
// S2.10, the owner's choice of 2026-10-24 ("Keep the flashier timing", docs/design/battle-overhead.owner-answers.md);
// change a spell's `fx.duration` here and its storyboard beats scale to it (fxBeats, 33-fx-timeline.js). The art
// director's critique of the pilot (units/stage-d/critique.md, fixes 1 to 12) set the numbers marked 'critique'.

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
// The primaries are docs/09's (#FD6533 Ember, #00674B Loam): the pilot first used #D9442B and #3F8F3A, the palette docs/09
// replaced because Red and Green differed by only 6.9 under deuteranopia (critique fix 12: back to docs/09's values).
const FX_GRAMMAR = {
  R: { name: 'Ember', shape: 'circle', frame: 'dot2', core: 0.36, px: 3, jitter: 0.5, motion: 'rise', ease: 'outFast', blend: 'add', flicker: { x: 0.9, a: 0.35 },
    primary: 0xfd6533, secondary: 0x7a1e12, accent: 0xffb347, glyph: 'glyphR', glyphRing: 'glyphRingR' },
  G: { name: 'Loam', shape: 'leaf', px: 4, jitter: 0.25, motion: 'spreadGround', ease: 'outSlow', blend: 'normal', hug: 2.5, across: 6,
    // the painted leaves (L4) nearest the primary and the accent by their mean colour; tinted a quarter toward it
    leavesPrimary: [1, 2, 4, 7, 11, 12], leavesAccent: [8, 9], tint: 0.25,
    primary: 0x00674b, secondary: 0x244f22, accent: 0xa6d96a, glyph: 'glyphG', glyphRing: 'glyphRingG' },
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
    orb: { r0: 4, r1: 14, apex: 120, apexBrief: 60, trail: 90, trailSparks: 20, sparkLife: 0.25, embers: 60, emberLife: [0.3, 0.42], spiral: [26, 54], glow: 54,
      // the travel's light on light ground (critique fix 9): a normal-blend warm pool under a half-size added core, and a
      // shadow 20 wu wide that stays at the apex. Deviation: both parts fall off as (1 - h/260)^falloff, close to a real
      // light's inverse square, not as (1 - h/260): at that rate the pool still read as a tan disc far below the orb at the
      // apex (the very complaint), its rust rim darker than the plains. Now only the shadow marks the ground at the apex and
      // the warm light gathers under the orb as it comes down. The core is the Ember primary, not the light's pale gold.
      pool: { r: 40, tint: 0xc4532c, alpha: 0.18, fade: 260, falloff: 4, core: 0.5, coreAlpha: 0.3, coreTint: 0xfd6533 }, shadow: { w: 20, alpha: 0.38, apexK: 0.5 } },
    release: { ring: 60, recoil: 6, ringLife: 0.32, ringGrow: 0.12 },
    // burst: the main dome is clamp(2.2 x the struck troops' radius, 120, 180) wu wide (critique fix 11); flip: the six frames
    // cross-fade over the last 40% of each hold and scale 0.95 to 1.05 across it (fix 5); dust: the shockwave, E5 puffs in
    // the ground's dust on the expanding ellipse with an added ring at 0.25 as its leading edge (fix 10)
    impact: { ring: 140, ringLife: 0.42, burst: 120, burstFit: [2.2, 120, 180], embers: 40, emberLife: [1.0, 1.5], emberSpread: [20, 60], emberRise: [30, 60], emberBurst: 0.35,
      sparks: 30, sparkLife: [0.12, 0.25], smoke: 20, smokeBorn: [0.05, 0.4], flip: 0.46, flipBlend: 0.4, flipScale: [0.95, 1.05], core: 2 / 60, pool: 66, poolLife: 0.45,
      // dust: the critique's #B8AC98 multiplies the painted grey puffs to a shade darker than the plains, where it vanished;
      // a pale warm tint gives the ground's dust lighter than the ground, as dust thrown up reads
      dust: { puffs: 20, size: [8, 20], alpha: 0.4, tint: 0xf0e4c8, edge: 0.25 },
      // the scorch smoulders for 1.5 s: E4 ember chunks on the scorch ring, flickering (fix 9, in place of a cream glow)
      smoulder: { n: 10, at: 0.3, life: 1.5, size: [5, 8], ring: 0.8 } },
    linger: { smoke: 2.0, scorch: 120, scorchAt: 0.03, scorchGrow: 0.25, scorchAlpha: 0.8, killScorch: 14 },
    // light: lit figures get an added copy of their own frame tinted the light's colour at add x k (0.5 at the peak, critique
    // fix 1); big bodies keep a multiply tint (tint x k) until they have a copy of their own; pushed shadows 14 + 22 k wu long
    // at alpha 0.55 k
    light: { color: 0xffb347, charge: 46, travel: 70, impact: 140, impactLife: 0.6, tint: 0.35, add: 0.5, shadow: 0.3, shadowLen: [14, 22], shadowAlpha: 0.55 },
    // fire wounds (critique fix 2, docs/12 S2.9): an orange flash for one frame through the added copy, 4 E4 sparks and an E5
    // wisp; under reduced motion no flash frame but a red tint (C.2 amendment 12) fading over 0.15 s
    wound: { flash: 0xffb347, flashAlpha: 0.9, sparks: 4, sparkLife: 0.2, wisp: 0.8, wispTint: 0x2e2620, reducedTint: 0xd0605a, reducedLife: 0.15 },
    footprint: { lead: 0.25, r: 7, out: 0.12 },
    // a big body struck (critique fix 4): the lob ends at 0.45 of its height, the burst is at least 2.2 x its foot radius
    // wide, sorted just in front of it, and its footprint ring is its foot radius
    big: { lobH: 0.45, endH: 0.06, burstK: 2.2, z: 0.05 },
    trauma: 0.30, traumaLife: 0.55, link: 150, thrown: [16, 40], thrownFall: 0.7,
    // fragments (fix 11): a 40 wu trail, a 24 wu orb with a 40 wu glow, a landing burst of at least 70 wu
    fragment: { apex: 50, ring: 60, burst: 70, embers: 12, sparks: 10, smoke: 6, scorch: 34, flip: 0.36, launch: 0.03, fly: [0.18, 0.42], speed: 1100, trail: 40, orb: 24, glow: 40 },
    // burning kills (fix 8, docs/12 S2.9): char over 0.3 s, 2 or 3 E4 flame licks riding the body for 1.5 s, cycling every
    // 4 frames, 8 to 12 wu tall, a normal body and an added glow
    burnOut: { char: 0x3a3029, charT: 0.3, embers: 12, emberLife: 0.7, emberWindow: 0.9, smoke: 3.0, licks: [2, 3], lickLife: 1.5, lickH: [8, 12], lickEvery: 4, lickGlow: 0.6 },
    // the mana glyph (fix 12, docs/12 S2.10 charge): over the caster for the charge and at the front of the release ring
    glyph: { h: 16, lift: 46, ring: true },
    // sound hooks (pretender-and-magic C.3): [cue, beat, offset s, gain dB]; 'hit' fires per struck troop at its hit
    sound: [['spell.R.charge', 'charge', 0, 0], ['spell.R.release', 'release', 0, -3], ['spell.R.travel', 'travel', 0, 0], ['spell.R.burst', 'impact', 0, 0], ['hit.burn', 'hit', 0, 0], ['spell.R.linger', 'linger', 0, 0]],
  },
  entangle: {
    fx: FX_SPELLS.entangle, color: 'G', level: 3, tier: 2, template: 'curse', element: 'nature', budget: 40,
    beats: { full: [0.45, 0.06, 0.29, 0.30, 0.30], short: [0.225, 0.06, 0.29, 0.30, 0.10] },
    flash: { color: 0xa6d96a, alpha: 0.15, dur: 0.06 },
    charge: { cracks: 5, len: [26, 48], split: 64 },
    release: { ring: 54, ringLife: 0.3, ringGrow: 0.1 },
    // the crack (critique fix 3d and the L3 re-roll): a heaved furrow 16 wu wide; its running head throws 8 clods and 2 E5
    // puffs of 10 to 16 wu and leaves clods along the way
    crack: { width: 16, wobble: 0.04, head: 22, clods: 8, puffs: 2, puffSize: [10, 16], trail: 7 },
    impact: { erupt: 0.12, grow: 0.2, dirt: 22, dirtLife: [0.45, 0.65], leaves: 14, leafLife: [1.1, 1.5], leafSpread: [10, 26], runner: 5, runnerGrow: 0.15, thorns: 48, split: 52, splitGrow: 0.12, settle: 0.2, ringIn: 0.2 },
    // the hold (critique fix 3a): thorns 38 wu, open coils 20 wu tall (to the hips; L2 re-roll: a back half behind the man and
    // a front half before him), the dashed curse ring at the commander ring's radius, which dims to 0.3 while he is held (3c);
    // 4 anchor tendrils 12 to 20 wu long radiate from each held man's feet (3b)
    hold: { coil: 20, thorns: 38, ring: 0xa6d96a, ringR: 19, cmdRing: 0.3, tendrils: 4, tendrilLen: [12, 20], tendrilW: 3.2 },
    glyph: { h: 16, lift: 44, ring: true },
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
const FX_BUDGET = { particles: { fireball: 150, entangle: 40 }, extraDraws: 6, decals: 8000, updateMs: 1.0, litAlpha: 0.5 };
