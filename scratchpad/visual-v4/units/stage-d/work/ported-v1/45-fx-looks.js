'use strict';
// ---- the magic pilot's looks (stage D): content as data, read by the timeline (33-fx-timeline.js) and the effects
// layer (46-fx.js, 47-spells-pilot.js). Numbers are the art plan's storyboards (units/art-plan.md 7.3), the battle
// design's S2.10 and the pretender-and-magic design's C.1 and C.3. A spell absent here keeps the mockup's old drawing.

/**
 * Beats per form, story seconds: [charge, release, travel, impact, linger]. Full and short forms are the storyboards
 * (the short form halves the charge and trims the linger); brief is docs/12 S2.7's 0.5 s form; rushed is S2.7's 0.3 s
 * cast once a phase passes 5.0 s. Lingering effects keep running under the next cues whatever the form.
 */
const FX_LOOKS = {
  fireball: {
    color: 'R', level: 2, tier: 2, template: 'burst', element: 'fire', budget: 150,
    beats: { full: [0.70, 0.06, 0.55, 0.14, 0.45], short: [0.35, 0.06, 0.55, 0.14, 0.20], brief: [0.10, 0.04, 0.22, 0.14, 0.00], rushed: [0.08, 0.03, 0.14, 0.05, 0.00] },
    orb: { r0: 4, r1: 14, apex: 120, apexBrief: 60, trail: 90, trailSparks: 20, embers: 60, spiral: [26, 54] },
    release: { ring: 60, recoil: 6 },
    impact: { ring: 140, burst: 120, embers: 40, sparks: 30, smoke: 20, flip: 0.46, core: 2 / 60 },
    linger: { embers: 1.5, smoke: 2.0, scorch: 120 },
    light: { color: 0xffb347, charge: 46, travel: 70, impact: 140, tint: 0.35, shadow: 0.3 },
    footprint: { lead: 0.25, r: 7 },
    trauma: 0.30, link: 150, thrown: [16, 40], thrownFall: 0.7,
    fragment: { apex: 50, ring: 60, burst: 56, embers: 12, sparks: 10, smoke: 6, scorch: 34 },
    burnOut: { char: 0x3a3029, embers: 12, smoke: 3.0 },
    // sound hooks (pretender-and-magic C.3): [cue, beat, offset s, gain dB]; 'hit' fires per struck troop at its hit
    sound: [['spell.R.charge', 'charge', 0, 0], ['spell.R.release', 'release', 0, -3], ['spell.R.travel', 'travel', 0, 0], ['spell.R.burst', 'impact', 0, 0], ['hit.burn', 'hit', 0, 0], ['spell.R.linger', 'linger', 0, 0]],
  },
  entangle: {
    color: 'G', level: 3, tier: 2, template: 'curse', element: 'nature', budget: 40,
    beats: { full: [0.45, 0.06, 0.29, 0.30, 0.30], short: [0.225, 0.06, 0.29, 0.30, 0.10] },
    flash: { color: 0xa6d96a, alpha: 0.15, dur: 0.06 },
    charge: { cracks: 5, len: [26, 48], split: 64 },
    release: { ring: 54 },
    crack: { width: 16, wobble: 0.04 },
    impact: { erupt: 0.12, grow: 0.2, dirt: 22, leaves: 14, runner: 5, thorns: 34, split: 52 },
    hold: { coil: 14, thorns: 26, ring: 0xa6d96a, ringR: 26 },
    wither: 0.6, scar: 16,
    footprint: { lead: 0.25, r: 7 },
    sound: [['spell.G.charge', 'charge', 0, 0], ['roots.burst', 'impact', 0, 0], ['vox.effort', 'impact', 0.35, -6], ['vox.effort', 'impact', 1.1, -6], ['expire.soft', 'wither', 0, 0], ['spell.G.curse', 'wither', 0.05, -10]],
  },
};
/** The Loam and Ember steps used here (C.1): flashes and timed tints only from the light steps (the red-flash rule). */
const FX_COLORS = { emberLight: 0xffb347, emberBody: 0xfd6533, emberDark: 0x7a1e12, loamBody: 0x00674b, loamDark: 0x244f22, loamLight: 0xa6d96a, char: 0x2e2620, smoke: 0x3b3530, key: 0x1c1a17 };
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
