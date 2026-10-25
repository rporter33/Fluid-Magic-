# Stage D animation part: handoff (paused 2026-10-25)

Paused on the coordinator's order. **The build is exactly as before this part**: `src/` and `battle-mockup.html` are restored
from `units/stage-d/pre-anim/` (sha256 checked), and `python3 build.py` reproduces the backed-up page byte for byte (sha256
cba3bf16…). Nothing committed, no map files touched, no generations. My work in progress is saved under `anim-work/`.

## What I read and learned
- **Small figures** (troops, commanders, riders, Fire Sprite, Hornet): `44-painted.js` `paintPose()` already sequences
  march (marchA/stand/marchB/stand by block speed, bob, lean, sway), idle shuffle (stand/idle2, breathing), brace,
  windup/strike/follow, nock/draw/loose, aim/throw/follow, cast actA/actB with recoil, rally, recoil + one-frame white flash,
  fall then deadA/deadB (the end pose and rotation must equal the body decal: `95-paint-checks.js` checkDeadHandoff),
  flee frames, cheer. `PALIAS` maps sprite/hornet cells onto troop poses; `PFALL` gives fallbacks. Mounted troops never use
  gallopA/B, charge, leapA/B or bite (march falls back to walkA/lopeA). `paintSprite()` (60-render.js) reads `pp.dy` but
  ignores `pp.dx`. Lunges come from `evalFigure()` (half the S2.2 lunge, capped). Banners: 9x3 MeshPlane, flare on rally.
- **Big bodies today** (`makePaintedBig`, 44-painted.js; `updateBig`, 60-render.js): one static Sprite of the stage C idle,
  forced to the ground, no deformation; death = tilt 0.2, squash, darken. Battles use only salamander-01 (c, back view,
  breath + Unarmed tail lash, dies), treant-01 (b, back, Crushing Limbs 0.40/0.10/0.40, lives), greatWyrm-thornwood
  (a, front, flying, Breath + Bite = WYRM_BITE neckLunge, a god that dies: "dissolves into its dominant colour").
  Cues: `f.strikes` {t, wind, strike, rec, motion, tf}, `f.shots` breath {t, tRel, dur}, `f.reacts`, `f.death` {t, fall, drop}.
- Other code reads the body through `bb.body.root` (zIndex, tint from the fx light), `bb.body.sprite` (fx occluders:
  texture.frame, scale, anchor), `body.mouth()` (drawBreath), `bb.h`, `body.H`, `setTier`, `pad` (checkBigHeights).
  Keep these when the sprite becomes a mesh. `fxStaffTip` uses figPos and sprite scale only (caster transforms are safe).
- Action assets: `atlas/actions/index.json`, `<family>-<S|H>.<i>.png/json` (anchor = ground anchor), `figures/<fig>.json`
  (per view/action: heightWu, kind, points in wu from the anchor, atlas frame/shadow/white, heldBack, codeOnly),
  `.weights.json` (24x16, parts per frame, idle included). Idle textures stay in stage C (gods: `stage-c/atlas/gods/tiers`,
  creatures: `stage-c/atlas/creatures/<family>-<tier>`, salamander-01: pilot frames via bundle.py's nested salamander01()).
- Budget: docs/12 S4.9 (evaluate 2 ms, rig 2.5, particles 2.5, Pixi CPU 3 ms). WebP q90 method 4 encodes a 2048² action page
  in 1-2 s at about 1/8 of the PNG (method 6 is 15-27 s for the same size).

## Baseline (before any change, under load avg ~11)
`anim-work/checks-before.json` (+ .log): ok, paintOk, pilot all true, 0 page errors; CPU p50/p95 ms: a 1x 3.3/8.3, a 4x
3.9/8.2, b 1x 2.3/4.0, b 4x 3.6/15.1, c 1x 2.3/8.4, c 4x 3.1/10.7 (GPU wait is SwiftShader, ignore).
`anim-work/split/hash-pre.json`: pixel hashes of the pre-anim page, 266 frames (3 battles, 1x and 4x, every 1.25 s).

## What I changed (all saved, none live)
- `anim-work/split-src/` (46 files): `src/` split so every module is under 400 lines, behaviour meant to be unchanged:
  31-build -> 31 + 31a/b/c (phases take a context `C`; `TL_PHASES` in 32-finish), 44-painted -> 44 + 44a-paint-bake,
  44b-paint-pose, 44c-paint-banner; 46-fx -> 46 + 46a-fx-light (the light code, the carry-over); 50-ground -> 50 +
  51-ground-props; 60-render -> 59-render-looks, 60..65, 66-eval-figure; 80-hud -> 80 + 81-hud-hover; 90-main -> 90..93
  and 99-boot.js (GAME and window.__battle must be made last). **Verified**: Node timeline digest of all 3 battles is
  identical (`anim-tools/tldigest.cjs`). **Not yet verified**: the pixel-hash comparison (run pixhash.cjs --cmp hash-pre).
- `anim-work/rebundle-ashrider/paint-data.json`: bundle.py re-run (stage C carry-over 1). Only `ashRider.front.*` frames
  and the creature page changed (diffed). Not live: the live paint-data.json is the backed-up one.
- Tools in `units/stage-d/anim-tools/`: lib.cjs (Playwright + a tiny static server), run_checks.cjs, pixhash.cjs,
  tldigest.cjs, movemethods.py, build_assets.py (bug: create `assets/actions/figures/` before writing figure files).

## Plan, step by step
1. Live the split: copy split-src into src, build, `pixhash.cjs <page> out.json --cmp anim-work/split/hash-pre.json`
   must report 0 differing frames; run run_checks.cjs.
2. Assets: fix and run build_assets.py (nice) -> `visual-v4/assets/{paint,fx,actions,idle,gallery}` + manifest.json;
   loaders: `let PAINT`/`PAINTLIB`/`FX_DATA` filled by fetch in Game.init (procedural fallback if fetch fails); build.py
   stops inlining paint/fx; action pages per battle (S at load, H in the background, `__battle.loaded` promise); cards stay
   inline (face checks hash their data URLs). Pixel hashes again (still identical), then swap in the Ash Rider rebundle.
3. ActionLib (44d): figure JSON, frames, pages, uint8 weights; per-frame rig (base grid, part weights, pivots from weight
   overlap with the parent part, points in px).
4. BodyRig (44e): two MeshPlane(24x16) layers for short crossfades, shadows per layer, white-flash textures, a hidden proxy
   sprite for `body.sprite`, deformed `mouth()`.
5. Motion (44f/g): `bodyActAt` from cues (death > strike > breath/cast > hit overlay > walk > idle) and one program per
   class: serpent, quad, wyrm, phoenix, treant, world tree, biped, idol, spirit (art plan 6 numbers; held-back fallbacks
   by mesh: arm raise for the 4 front windups and 2 front castA, Giant back fall = hit tilting into dead, Giant 02 front
   follow = strike easing to idle, Elder Wyrm lunge/trample/front death by mesh then god dissolve). Precomputed footfall and
   impact events (dust, trauma 0.04, 2 wu tremor of nearby figures) as a pure function of T.
6. Small figures in 44b: dx weight shift, brace 1.4 wu/6°, windup 6° + sx 0.97, follow 10°, smears/ash flakes, rear-rank
   spear jabs, javelin run-up, cavalry walk/gallop/charge, wolf lope/leap/bite, varied death styles (end pose unchanged),
   banner flare on Warcry / droop when shaken, hornet cluster swirl.
7. Gallery `?gallery=figures` (85-87) with `window.__mock` {figure, action, view, zoom, speed, seek, step, list}.
8. 98-anim-checks.js (coverage, seek determinism, feet, frame times vs budget and baseline, particles/draws), then
   Playwright look-and-fix, shots in anim-shots/, anim-report.md.

## Exact next step
Step 1: `cp anim-work/split-src/* src/`, `python3 build.py`, then
`nice -n 10 node anim-tools/pixhash.cjs visual-v4/battle-mockup.html anim-work/split/hash-split.json --cmp anim-work/split/hash-pre.json`.
