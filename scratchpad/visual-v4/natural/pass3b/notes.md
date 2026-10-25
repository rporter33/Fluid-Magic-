# Natural map pass 3b: work notes

Soft wild edges (the owner's answer of 2026-10-24, "Soft, like province lines") and the pass-3 final verifier's open items
(`../pass3/reports/final.md`). Final page `../../map/game-screen-v4.html`, md5 `0ca3a196…`. Before: the pass-3 final page,
md5 `7ef0ee6d…`, kept with its parts, `build.sh` and `design-final.md` in `before/`. Painted (v3) is untouched; Clear and the
Terrain mode render pixel for pixel as before.

## What changed, in the order it was found

1. **No outline at rest.** The wild-edge layer (ink and stone band) is drawn only for the focus states (`p59x` `rlWildFocus`):
   a hovered or linked wild (its whole outline), a hovered, linked or selected neighbour (its shared edges), a planned march
   and a previewed march (the route's provinces' shared edges, plus the whole outline of a wild the straight line crosses).
   Clear, the Terrain mode and the data modes draw every edge as before. `?wildink=2` and `?wildfoot=talus` are removed.
2. **The seam had six sources**, each a straight line once the ink was gone: the shared hillshade and valleys read the v4
   granite (1.1+) and mere (-0.05) heights across the outline (a lit or shaded strip and a dark valley band in the land
   outside); the land continued inside the cells had no relief; the Far relief's slopes were taken over heights blurred
   across the massif; the natural mips' wild cells were browser-scaled sRGB, not Lab means; the full-resolution bake was
   drawn over the land's half mip at Mid; and the mips' calm also darkened the continued land. All six fixed (`p58z`,
   `p58x`, `p59c`, `p58c`, `p58y`).
3. **The landform marks the extent.** Rock to an irregular foot close to the outline (`p58x`): the rounded outline distance
   less a seeded inset, each edge's median calibrated, a soft floor so no rock runs straight along the outline. First tries
   on a blurred mask iso-line gave polygon slabs and ray streaks; a smooth minimum over collinear edges left a ridge; the
   ridged noises skewed the inset until centred on their medians. After the shots, a stronger mid-scale octave (bays and spurs
   about 0.12 D across) so a long straight cell edge never draws a straight foot at Near; rounder corners (0.25 D) were tried
   and dropped (little change).
4. **The Mere in broad lobes** (zoomed out it read as its cell's polygon), tuned on seven map plans so its shore stays
   close everywhere (`RL_MS.mere`).
5. **Zoom hand-overs.** The fine raster fades in over 0.72 to 1.0 device px a texel (the 1.28x jump: 4.0 L* a notch, now 0.9
   to 1.3); the landform layer over the calm mip over 1.8 to 2.2 (2.1 to 2.5 a notch over two notches, as before at one).
6. **Busyness and fine detail.** The mips calm only the rock, by its share of the texel, scaled by the range's room (the
   narrow Greyteeth read 37.6 at the start view, now 35.6; its fine detail 1.04 x the land's).
7. **1280x720.** The start view opens at the largest of 96 to 84 px a province that shows every wild whole: 84 px, 0% of the
   Greyteeth hidden (was 38%), the ribbon clear.
8. **Checks.** `p92`: `reliefWildRest` (no outline pixel drawn at rest; each wild's whole outline has its landform within
   0.05 D on 80% of it and within 0.09 D at p90, nearest landform on its raster; in view the drawn landform within 0.12 D at
   p90) and `reliefWildFocusSweep` (the colour-blind test on every focus state at 11 views). `p89`/`p89b` sample the edges
   drawn. Three definitions were corrected on the way, each logged here: the share was first read on the outline in view
   (one cove filled a Near view), then along the inward normal (it ran out of the wild at sharp corners); the in-view guard
   now needs half a province of outline in view.
9. **The edge decision** missed a failing sample on map seed 5 (0.94): a thin hedge 8 px out, which the frame's resampling
   spreads over two pixels. The decision now also tests the medians of its profiles blurred over 2 px (`p59x`).
10. **Readers.** The Far floor now binds only its stated band, 55 to 85 px a province (`p88b`).
11. **Hover cost.** The stone colour of each decided edge is solved while idle (`p59x` `rlQeWarm`): a wild's first hover took
    63 to 90 ms (pass 3 painted every edge at each settle instead), now 2 to 3 ms. Frames identical with and without it.

## Measures and checks

See `../design-final.md`, "Pass 3 decisions", "Pass 3b". Outputs: `out/` (JSON per run), `out/logs/` (logs and lane
progress), `out/art/` (art judge), `shots/` (shots and side-by-sides). Runs before 22:11 on 2026-10-24 and `out/old*` are
from earlier builds and are superseded.

## Tools (`tools/`)

- `v/`: the pass-3 final verifier's suite, repointed here (`checksx`, `det`, `detphone`, `v3same`, `v3checks`, `modes`,
  `modewild`, `sweep`, `session`, `focus`, `linesall`, `phonefit`, `dump` + `samecmp.py`), with `focussame.cjs` (Clear and
  Terrain in focus states against the pass-3 page), `det2.cjs` (determinism with the start camera and ribbon logged),
  `detfont.cjs`, `halprobe.cjs`.
- Here: `rest.cjs`, `wfocus.cjs`, `ptrfocus.cjs` (real pointer), `seedprobe3b.cjs` + `mkvariants.sh` (six other map plans),
  `footstats.cjs`, `candfoot.sh`, `footedges.cjs`, `readers.cjs`, `phonereaders.cjs`, `readwho.cjs`, `pop.cjs`, `pop2.cjs`,
  `perf.cjs`, `finalshots.cjs`, `look.cjs`, `sbs.py`, `crop.py`, `art/` (the art judge's `dump.cjs`, `judge.py`, `skirt.py`,
  `extra.py`, `wcrop.py`), `runlane.sh` + `lane*.txt`.
- Phone runs use a 390x844 viewport at 3x without mobile emulation, as the pass-3 verifier did: with emulation and no
  viewport meta, Chromium lays the page out at 980 px.
