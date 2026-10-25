## 12. Performance and memory, against v4

**The bake (mockup, CPU, main thread, time-sliced).** The v4 as built measures 5.6 s CPU and 7.4 s wall:

| Step | ms |
|---|---|
| id | 126 |
| warp | 473 |
| height weights | 173 |
| heightfield | 1,041 |
| hillshade | 379 |
| detail | 1,271 |
| water | 18 |
| mean-neutral | 884 |
| colour and gamut | 1,457 |
| canvas and mips | 406 |
| mode relief | 243 |

| Path | v4 (Clear only) | Natural default | Natural + Clear (after the first switch) |
|---|---|---|---|
| Shared rasters (id, warp, heights, hillshade, water, mode relief) | 2.45 s | 2.45 s | 2.45 s |
| Look-specific | detail, mean-neutral, colour, canvas: 4.0 s | the cover blend at half resolution, 8-bit planes: **0.24 s** *(review bench; the draft's 0.3 s was given for full resolution, which measured 1.5 s and 70 MB in Float32)*; the covers and materials **0.8 to 1.05 s** (the draft's `tools/bench.cjs`, re-run); the per-texel Lab blend of seven grounds and Lab to sRGB **0.66 s** *(review bench; the draft estimated 0.6 s)*; canvas and mips 0.4 s: about **2.1 to 2.4 s** | + the Clear pass 4.0 s, once, when first needed |
| Total CPU | 5.6 s | **about 4.6 to 4.9 s** | 8.6 to 8.9 s over the session |

**In the game (map-relief §10)** *(review, N11)*. The covers and the materials are GPU passes, tiled like the Clear composite,
from the same seeded value tables. Nothing new runs on the CPU at load, so a phone's first load (estimated at 3 to 5 s in
map-relief §10.4) is unchanged. The CPU reference of the cover raster (`src/present/map/`, half resolution) runs only in the Node
tests, the CPU fallback and the browser smoke. For scale: the cover classes alone take 0.5 to 0.6 s in V8 at 2048 × 1280
(`review/tools/bench-cover.cjs`), which a phone would pay 3 to 5 times over at every first load. That is why they are not a
run-time CPU raster. The draft's "the cover raster joins the cached CPU rasters" is withdrawn.

**Memory.**

| GPU (Large map, 4 nations, ratio 2: docs/06's case) | v4 | This design |
|---|---|---|
| Land bake with mips | 14.0 MB | 14.0 MB (Natural) |
| Second bake (Clear), only while the setting or Terrain mode has been used this session; freed after 2 minutes unused | — | +14.0 MB |
| Id and distance | 7.9 MB | 7.9 MB |
| Cover-blend inputs during the bake (two RGBA8 at half resolution) | — | 5.2 MB transient |
| Detail tiles, miniature atlas, table, labels | 37 MB | 37 MB |
| **Total** | **about 59 MB** | **59 MB (Natural only) to 73 MB (both bakes)**, under docs/06's 96 MB |

- **Mockup canvases:** the natural bake and mips take 13.1 MB, plus 13.1 MB for its unwashed copies. Clear adds the same once
  used. That is up to 26 MB more than v4's 57 MB of canvases. The cover blend's CPU planes are 4.4 MB in 8 bits at half
  resolution, transient *(review)*.
- **Per frame: unchanged.** One composite draw samples whichever bake is current. The rails, hairlines and water keep their 2 to
  3 draws (the segment styles, partners included, are vertex colours). Map draws stay at most 12.
- **Phones:** one bake at a time. Switching to Clear re-runs the GPU colour pass (milliseconds) and frees the other. The natural
  pass adds one tiled GPU pass at load and no CPU work. Map detail Reduced (map-relief §10.4) keeps every cover, because the
  covers are the terrain's identity in Natural. Reduced drops only the Near crowns and cast shadows, as before.

---

## 13. Build notes for the mockup (the next workflow step)

- **The natural pass,** `p58n-covers.js` and `p58m-materials.js` (one part if the port fits in 400 lines).
  - `rlNaturalGen(out)` takes the shared rasters (S1 to S5, the water) and writes `out.natImg`, `out.natMip1`, `out.natMip2`,
    `out.cover` and `out.natTimes`.
  - It reuses the S3 height weights as the ground blend. It makes the cover blend (σ 0.04 D) **at half resolution in 8-bit
    planes**, then the covers and materials of §3 and §4 per texel, with the parameters in one `RL_NAT` object (docs/09-balance
    rows).
  - The field frames turn by exact constants and a small-rotation jitter (N8). No `Math.cos`, `Math.sin` or other transcendental
    enters the cover; sines may shape colour-only terms.
  - The numpy prototype `proto/natural.py` is the reference for every constant. Its outputs are under `proto/data/`.
- **Looks.** `view.terrain = 'natural' | 'clear'`; `?terrain=clear`; a "Terrain colours" control in the mockup's settings
  under Accessibility, beside "high-contrast borders".
  - `rlRenderStatic` blits `RB.natCanvas` or `RB.canvas` by look and mode. Each colour pass runs lazily, the first time its look
    is shown.
  - The wash keeps per-look unwashed copies.
  - Fog values come from `RL_P.fog[look]`. Natural: `haze 0.06`, `unexSat 0.40`, `outSat 0.25`, `hemPeak 0.12`; the unexplored
    province takes the haze and then the desaturation. Clear: the approved values.
  - Natural water is #14615B; Clear water stays #50AF9B.
- **The Terrain mode.** Add `['terrain', 'terrain', 'Terrain', 'The colour-blind-safe terrain colours.']` to `MODES`, with
  Shift+7 (no F7).
  - The mode raster is the Clear bake as baked; water stays; settlements, motifs and scars fade as in other modes; the hover
    line only; a legend with "Use these colours everywhere"; the numbers layer shows terrain glyphs.
  - It makes the Clear bake lazily (time-sliced), showing "Preparing terrain colours…" until it is ready.
- **Hover naming.**
  - `provTip`: the title is `${p.name}` followed by the terrain chip (swatch, glyph, word); "capital" joins it after a middle
    dot; the `value` slot keeps what it holds; **the Terrain row is removed**.
  - The dock heading subtitle and the army card's location line.
  - The link chip text, and the aria-label.
  - Seven terrain glyphs and the mode icon in `p10a-icons.js`.
- **Lines.** Replace `RL_HAIRA` and the albedo-keyed `keylineFor` in `rlDrawRails` with `rlSegStyles(edge, kind)`: the anchor,
  the running-maximum alpha and the partner for hairlines; the anchor and partner on the lower-right side for internal
  keylines, 2.5 px below ratio 1.5. Sides by the same lower-right normal `rlDrawRails` uses. Grounds sampled in the provinces'
  fog states. Cached per map, look, band and fog version. `review/tools/patches6.js` is the reference prototype (the draft's
  `tools/patches.js` is superseded). The rail banner is 2 px below ratio 1.5.
- **Independents' hover.** `rlTintOf` takes the keyline of the province's natural core mean in Natural, `RL_KEYFOR` in Clear.
- **Seats.** `rlSeatGround` is replaced by a per-house ground: the darkest bake texel under each house's footprint (+1 px) in the
  current look. `rlMuted` aims at 2.3 / 3.6, and every house tone passes through it. Cached per seat, look and band.
- **Labels.** `rlArrow` records its chip box; `rlLiveLabels` tries six spots and redraws the chip on top if none is free.
- **Snow.** In S6, clamp `DL` to [−A_t, +0.6 A_t] after detail and micro-relief, before S7.
- **Cliff.** `rlRim` draws strata, ledges, faults and short joints as in `proto/cliff.py`, and drops the full-height lit facets.
- **Start view.** `fitScale` stays the lean-back fit. A new `startScale = max(fitScale, 96 / MED_DIAM)` is centred on the
  capital and clamped to `MODEL_BOX`. Z and the start use it. The camera code moves to `p60a-camera.js`.
- **The split** of `p61`, `p58` and `p60` is §10 defect 8. `build.sh` lists the parts in order: p58a, p58b, p58c, p58n, p58m,
  p59, p60, p60a, p61a, p61, p62, p63.
- **New checks in `window.__mock`:**
  - `reliefNatural()`: chroma over 0.10 is 0, the own cover per province (N4), and the readers' features on the rendered canvas
    at the current zoom (a nearest-centroid reader with centroids from `proto/renders/classify.json`). Province accuracy at least
    0.95 and patch accuracy at least 0.9 at Mid, in sight and on unexplored land.
  - `reliefLines()`: per segment, hairline ≥ 2.3:1 and internal ≥ 3.2:1 on rendered pixels, against the same pixel without
    lines, the partner's pixels counted; no edge changes keyline along its length; no hairline wider than 3 px.
  - `reliefSeats()`: hamlet light pixels' p95 ≤ the limit per seat.
  - `reliefHoverChips()`: no hover name over a chip.
- **Which checks run where.** In Natural, `reliefMeans()` reports "not applicable (Natural)" and the readability check stands in.
  In Clear and the Terrain mode it runs unchanged.

---

## 14. Tests (repo, when the map is built)

| Test | Checks |
|---|---|
| `tests/content/palette.test.ts` | unchanged for the Clear albedos and every v4 colour check (now titled "Clear and the Terrain mode"). New: the natural materials have OKLCH C ≤ 0.10. The lit-bead rail passes the band rule on the natural grounds (seven quantiles, half-blends, glow, every approved state, the natural fog **and its hem**, the Realm tint option, all 11 banners) solid and with keylines at 0.75 and the banner solid. **The wild contour (ink or rim) differs from every natural ground in every state.** The natural fog moves every terrain's ground by ΔE ≥ 3.5 (unexplored) and ≥ 1.5 (out of sight). No natural material or relief extreme is within 20 / 12 of snow. **Natural water is ≥ 20 / 12 from every ground of the four terrains that hold lakes** |
| `tests/present/map/terrainCover.test.ts` (extended) | N4 on Small, Medium and Large, 2 and 4 nations, seeds 1 to 5: the whole province ≥ 0.70 own (copses as forest); the core (0.15 D) ≥ 0.95 own (copses as their own); copses ≤ 25% of any core; the CPU cover raster is a pure function of map and seed. **A source scan finds no `Math.cos`, `Math.sin`, `Math.exp`, `Math.log`, `Math.pow` or `Math.atan2` in the cover module**, as the determinism test does for `Math.random` |
| `tests/present/map/readability.test.ts` (new) | the CPU reference of the natural bake at 512 px on **two maps of different geometry** (two mapgen seeds). The lightness-only reader trained on one map and tested on the other at D_px 85 and 200: province accuracy ≥ 0.95 and patch accuracy ≥ 0.90; texture-only ≥ 0.80. **The same reader, trained in sight, tested on the unexplored state (6% + 40%) at D_px 85: province ≥ 0.95 and patch ≥ 0.90** |
| `tests/present/map/lines.test.ts` (new) | the anchored solve: one keyline per edge (no flips); every hairline segment reaches 2.45:1 at coverage 0.75, with its partner where drawn; the partner lies on the side its anchor fails; internal keylines reach 3.3:1 at coverage 1; grounds are taken in the fog state |
| `tests/ui/derive/mapLabels.test.ts` (changed) | hover and link names never overlap a day chip; the start scale is at least 96 px a province at 1024 × 768, 1280 × 720, 1366 × 768 and 1440 × 900 |
| The key-table test (changed) | Shift+7 picks the Terrain mode; F7 stays unbound |
| The icon test (M1 criterion 14, changed) | the seven terrain glyphs and the Terrain mode icon are distinct SVGs |
| Browser smoke (Playwright, `src/render/**`) | Natural and Clear bakes from one CPU cache; the switch and the Terrain mode re-bake nothing that is shared; **the GPU covers match the CPU reference on ≥ 99.9% of texels**; the rendered-pixel rail, hairline, keyline and seat checks; the frame budget; GPU memory ≤ 96 MB with both bakes |

---

## 15. What changes in the docs (drafts; nothing is applied)

**`docs/09-art-direction.md`.**

- *Distinct colors*: "Every pair of terrain fills …" becomes "In the Terrain map mode and with Clear terrain colours, every pair
  of terrain fills …". The mana primaries and the wild grounds against the Clear fills are unchanged.
- Add: "The default map view is a natural landscape (docs/design/natural-view). There, terrain is read from the drawing, named on
  every hover and shown in the Terrain mode. The banner, band, keyline, hairline, contour and snow minimums apply in every view."
- *Map states*: the natural fog values beside the approved ones, which stay for Clear: unexplored 6% haze and 40% desaturation,
  out of sight 25% desaturation, the hem to 12%.
- *Terrain paragraph*: the Clear albedos stay as the fills. Add the natural materials as a table with "presentation; not bound by
  the distinct-colors rule".
- *H1 (hue within a terrain)*: "in Clear and the Terrain mode".
- *Icons* *(review)*: the Map modes row gains "terrain (a swatch with a leaf)"; a new row "Terrain" lists the seven glyphs of §7.

**`docs/07-ui.md`.**

- Modes: seven, with Terrain; "Shift+1 to Shift+7 (F1 to F6 best effort; F7 is never bound)".
- Settings → **Accessibility** gains "Terrain colours: Natural or Clear" *(review: there is no Map tab)*; Display options lists it.
- The province tooltip: "the active mode's value first; the name with the terrain (swatch, glyph and word); the owner; …". The
  separate terrain row goes. The province card's heading gains the terrain.
- Link chips name the terrain.
- The start view's minimum scale is 96 px a province, centred on the capital ("The table and the camera").
- Fog: in the natural view the unexplored land is hazed and desaturated, and out-of-sight land desaturated (the values above).

**`docs/09-balance.md` "Map presentation"** gains rows dated at adoption:

- the natural materials (§2.2) and water #14615B;
- σ_g 0.12 D and σ_c 0.04 D (the cover blend at half resolution);
- the canopy edge (0.07 D, 0.42 at 10 units, threshold 0.52);
- glades (0.85, −0.62 at 9 units) and copses (0.80 at 15 units, plains and hills, ≤ 25% of a core);
- the field strips (8.5 ± 2.5 deep, 13 to 32 long, 0.6 / 0.4 / 0.36 weights, hedges 0.4 units, 45% of row seams; frames 0°, 90°,
  ±30° with ±3.4° jitter);
- the presence ramp (0.35 to 0.65);
- the natural relief caps (6 / 4 / 7 / 13 / 18 / 3 / 8) and the canopy damping and shadow (0.7; 9 L\* at 1.2 units);
- natural fog (unexplored 6% haze + 40% desaturation; out of sight 25%; hem 12%);
- the line rules (segments 0.1 D; one keyline per edge; hairline 2.45:1 at coverage 0.75 against p10 and p90, alpha cap 0.92,
  running maximum over ±1 segment; partner 1.5 px at 0.8 on the failing side; internal 3.3:1 at coverage 1, 2.5 px below ratio
  1.5; rail banner 2 px below ratio 1.5; grounds in the fog state);
- seat muting (per house, darkest texel under the footprint +1 px, 2.3 / 3.6);
- the readability floors (province 0.95, patch 0.90 across maps and on unexplored land);
- the snow clamp; the start scale (96 px); the cliff strata.

The v4 rows for `RL_HAIRA` and "hamlets muted against the albedo" are marked superseded.

**`docs/design/map-relief.md`:** a pointer to this design under "Status", and its §4.2 sentence "unchanged in code" gains "in the
Terrain mode and Clear".

---

## 16. Owner questions (defaults in bold; the build follows the defaults)

1. **The Realm tint in Natural:** **off by default, as your answer names rails and glow**; or on at 8% in Natural only, as the
   references show. In Natural it no longer costs terrain pairs, and the rails keep the band rule with it (77,000 cases, 0 fails).
2. **Fog in Natural:** **unexplored 6% haze plus 40% desaturation, out of sight 25%**: twice as visible as today's at its weakest,
   and terrain still reads on unexplored land. Or the stronger 10% haze, about 1 ΔE more visible, at the cost of terrain read
   from value: up to a fifth of unexplored provinces misread at Far by a reader who learned explored land. Or today's 4% and 10%
   everywhere.

The draft's third question, hiding the lines between unowned provinces at Far and Mid, is withdrawn *(review)*. The hairline
floor is one of the minimums your answer keeps in every view, and on a landscape that blends across borders, hidden lines would
leave unowned provinces with no visible edge.

---

## 17. Risks and what was not verified

1. **The prototype is numpy, not the page's code.** The natural bake was injected into the mockup in memory. The JS port must
   reproduce `proto/natural.py`, and the build's readability check is the guard. The seeds, tables and sizes are given. The
   noise tables differ between numpy and the page, so the statistics carry over, not the pixels.
2. **The readers are a model of a reader, not a playtest.**
   - A linear discriminant on 13 lightness features is a floor for what a human sees: people also use context, shape and the
     hover card.
   - *(review)* It now holds across two map geometries and under every map state, with the corrected fog. Both maps are the
     mockup's jittered grid; mapgen maps are tested for N4 only, and the repo's readability test (§14) uses two mapgen seeds.
   - Plains against hills is the weakest pair (texture-only 0.85 at the start zoom). Under the draft's fog, farmland and hills fell
     to 0.60 to 0.62 per patch at Far.
3. **Busyness on screen is still about twice ref-2's at 6 px** (22.9% against 11.8%). The land itself is calm. The lines at their
   floor, the labels and the hamlets make the rest. These figures were shot with the draft's lines; the continuous lines have the
   same widths, remove the dashes and add a partner on 3% of natural hairline segments (not re-measured).
4. **Open in the build** *(review)*: Clear's internal keyline (1 to 4 samples per view under 3.2:1, fallback the full lit bead);
   hamlets at Mid and Near (the per-house muting is not prototyped, fallback 85% scale at Mid).
5. **Rails and hairlines by structure** *(review)*. In Natural nearly every neutral hairline is light, close to the Radiance banner
   (9.6 / 6.4) and the pale duplicate (18.8 / 12.2). Their realm edges are told from unowned borders by the rail's width, dark
   outer keyline, inset and glow, not by colour. No rule is broken; worth the owner's eye on a Radiance game.
6. **The cliff face, the hover chips and the start view** were measured on the mockup or a numpy strip. The cliff strata were not
   drawn in the page.
7. **Timings are on a shared machine** with software rendering: the benches and the bake step times are noisy, and the GPU
   estimates are estimates. The review's benches are partial models of the pass (`review/tools/bench-*.cjs`).
8. **Not run:** the repo's tests, a phone, a GPU, and the owner's eye. The sheets in `proto/renders/` show the draft's fog and
   lines; `review/renders/*-fixed6-*.png` show the corrected ones.

---

## Appendix: files (under `visual-v4/natural/`)

- `design.md`: the draft. `design-final.md`: this file.
- `proto/`:
  - `natlib.py`, `natural.py`, `cover_share.py`, `classify.py`, `lighttable.py`, `checks.py`, `metrics.py`, `cliff.py`,
    `sheets.py`;
  - `data/`: the exported rasters and both natural bakes, `natural.png` and `natural-s99`;
  - `renders/`:
    - the views: `before-*.png`, `after-*.png`, `clearfixed-*.png`;
    - the sheets: `sheet-ref-zoom.png`, `sheet-start.png`, `sheet-far-near.png`, `sheet-fog-clear.png`, `sheet-cvd.png`;
    - `cliff-before-after.png`, `startrule-*.png`;
    - the measurements: `metrics.json`, `classify.json`, `lighttable.out`, `cover-share-60.out`, `checks.json`,
      `hovercheck.json`, `startzoom.json`;
  - `lines/`: the rendered-pixel dumps and their `*-report.json`.
- `calc/`:
  - `colorMath.ts` and `colors.ts` (the repo's, verbatim); `parity.ts`;
  - `rails.ts` → `rails.out`; `lines.ts` (the verifier's `colors.ts` with this folder's paths) → `lines-*.out`;
  - `natural-grounds.json`, `clear-grounds.json`.
- `tools/`: `export.cjs`, `natpage.cjs`, `patches.js`, `shoot.cjs`, `measure-lines.cjs`, `hovercheck.cjs`, `startzoom.cjs`,
  `times.cjs`, `bench.cjs`.
- `review/` *(the review's)*:
  - `calc/`: the repo's colour math (verbatim), `rails-hem.ts`, `rails-fog2.ts` (+ `TINT=1`), `water-snow.ts`,
    `banner-vs-hairline.ts`, `lines3.ts`, and their `.out`;
  - `py/`: `classify_states.py`, `fog_sweep.py`, `xgeo_feats.py`, `xgeo_eval.py`; outputs `classify-states.out`,
    `fog-sweep.json`, `xgeo-12.npz`, `xgeo-31.npz`, `xgeo-12to31.out`, `xgeo-31to12.out`;
  - `variant/`: `seed31.html` (the mockup with `MAP_SEED = 31`, built here only) and `data31/` (its rasters and natural bake);
    `proto2/` (the prototype with a configurable data folder);
  - `tools/`: `patches3.js` to `patches6.js` (the line rule, step by step; `patches6.js` is the reference), `lines3.cjs` to
    `lines6.cjs`, `count6.cjs`, `dbg-int.cjs`, `export2.cjs`, `bench-core.cjs`, `bench-cover.cjs`;
  - `lines/`: rendered-pixel dumps and reports, `*-fixed3-*` to `*-fixed6-*`;
  - `renders/`: `*-fixed3-*` to `*-fixed6-*` shots, `cmp-fog-lines.png` (draft against continuous lines),
    `natural-fixed6-fog-crop.png` (the chosen fog).

---

## What the review changed, and why

Each item: what was wrong or unproven in the draft, what changed, and the measurement.

1. **Hairlines dashed.** The draft chose the keyline per 0.1 D segment, so it flipped along 13 of 73 natural edges and 30 of 73
   in Clear (13 and 14 of them two or more times): light lines with dark dashes, and dashes mean fog in docs/07. **Now** one
   keyline per edge, with a running-maximum alpha and a partner line where needed (N10, §8.2). Rendered: 0 hairline samples under
   2.3:1 in every view of both looks (the draft's rule: 1 and 3 at the start), no flips.
2. **The two-tone fallback ignored the ground.** It always put dark on one side and light on the other, and the prototype's
   sampler used an unflipped normal. **Now** the partner goes on the side the anchor fails, by the same normal the rails use.
3. **Line styles ignored fog.** With the natural fog on, the draft's internal keyline fell to 2.97:1 at a frontier edge. **Now**
   grounds are sampled in the fog state and the cache carries a fog version: 3.38:1 there.
4. **Clear's internal keyline was claimed closed by own-side sampling.** Measured, it was not: 1.21 to 2.13:1 at worst. **Now** it
   is anchored, 2.5 px below ratio 1.5, with a partner: 2.55 to 2.90:1 at worst. Still open, with the lit-bead fallback stated.
5. **The natural fog broke the value code.** The draft's 10% haze lifted dark terrains by up to 8 L\*. A reader that learned
   explored land misread 22% of unexplored provinces at Far on this map, and 12 to 22% across maps. **Now** 6% haze plus 40%
   desaturation (hem 12%): 97 to 98% at Far and 100% from the start zoom on both maps, at 3.8 to 6.8 ΔE of visibility.
6. **Readability was tested on one map.** **Now** across two geometries in both directions: provinces 98 to 100% at every
   zoom. The test floor becomes 0.95 per province (one province in 60 can miss), on two maps and on unexplored land.
7. **The rails check left out the frontier hem** and the Realm tint option. **Now** both are in: 38,500 and 77,000 cases, 0 fails
   at the design coverage.
8. **The wild contour was claimed but not reported.** It passes by its rim on every natural ground in every state (490 cases),
   while granite against natural forest is 21.3 / 5.2 directly.
9. **Determinism.** The prototype's field frames used cos and sin in the cover raster, which N8 rules out. **Now** exact constants
   and a small-rotation jitter, with a source-scan test.
10. **Phone cost.** The draft kept the cover raster on the CPU at run time and costed a full-resolution blend at 0.3 s (measured
    1.5 s and 70 MB). **Now** the covers are a GPU pass in the game (N11), with no new CPU work at load. The CPU reference is used
    only by tests, the fallback and the smoke. The mockup blends at half resolution (0.24 s), and its total is re-stated as 4.6 to
    4.9 s.
11. **The hover card.** The draft put the terrain in the title's value slot, which docs/07 gives to the active mode's value and
    the mockup to "capital", and kept the Terrain row as well. **Now** the terrain chip follows the name, and the row goes.
12. **Missing icons.** The swatch "with the terrain's glyph" pointed at docs/09 terrain icons that do not exist. **Now** seven
    glyphs and a mode icon are specified, kept apart from supply's wheat and the wild's snowy peaks, with the icon test.
13. **The setting's place and the key.** docs/07's settings have no Map tab: Terrain colours goes under Accessibility. Shift+7
    only, because F7 is caret browsing in Chrome and Firefox.
14. **The Terrain mode contradicted itself.** "The Clear bake with ground detail faded" cannot be drawn, because the detail is
    baked, and docs/07 asks every mode for a second channel. **Now** the bake shows as baked, water stays, and the numbers layer
    shows terrain glyphs.
15. **Independents' hover** used the Clear albedo's keyline on natural ground; now it uses the natural core's.
16. **Hamlet muting** was claimed fixed but still overshot at Mid (2.58 against 2.5). **Now** each house is muted against the
    darkest texel under it, left for the build to verify.
17. **Owner question 3 withdrawn**, because hiding lines would break a minimum that the owner's answer keeps. Question 2's default
    changes with item 5.
18. **Smaller corrections:** the material chroma maximum is 0.092, not 0.089 (the bake's pixels are 0.089). Water is 20.0 / 13.1
    or more from every ground where lakes lie. `p60-draw.js` (458 lines) is split, because the start view changes it.
    `p61a-figlib.js` stays whole as a verbatim copy. The Clear and natural passes are both lazy.

**Kept as written:** the palette and materials, both blends, the covers and N4, the relief caps, the data-mode ruling, the snow
clamp, the hover-chip fix, the cliff strata, the start-view rule, the GPU memory budget, Realm tint owner question 1, and every
measurement not listed above.
