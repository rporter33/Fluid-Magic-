# Pass 3 wilds: rules and QA judge

I judged the three wild prototypes (Continuous relief, Sculpted massif, Open) as a QA and rules engineer. I ran my own checks on fresh builds and looked at every shot I took. I edited nothing in the prototypes, in `visual-v4/map/` or in the repo.

## Verdict

**Not ready for the owner yet.** All three pass the 18 standard check views, but each one breaks the colour-blind wild edge rule (20 / 12) at camera positions or on maps its builder did not test. Pass 2 does not break it anywhere I looked. Each prototype also has at least one engineering or rules problem that needs fixing before it can merge.

| Prototype | Score | One line |
|---|---|---|
| **Sculpted massif** | **6 / 10** | Its core (landform, mere, 2× raster, footprint) keeps every rule I tested on four maps and looks right on all of them. Its edge decision is the weak part: it reads pixels on every redraw, flickers when the camera pans less than a pixel, and makes static redraws 2–4.5× slower. That decision lives in one replaceable 59-line part. |
| **Continuous relief** | **5 / 10** | The best-engineered edge decision: computed from data once per zoom, does not change with panning, and the cheapest redraws. But its approach has problems that tuning can't fix: mirrored land (fields inside an impassable wild on another map), a light line on 76–88% of the outline, and fog inside the wild (breaks an approved rule). |
| **Open (spill)** | **3 / 10** | Reverses an approved rule (V2/V4: wild material only inside the wild's cells). The benefit depends on the map (239 texels on seed 7, none for the Greyteeth). It has the most colour-blind failures (12 samples, worst 0.82), misreads two neighbours' terrain, and has the slowest bake. |

**I would ship the Sculpted massif as the base**, with five grafts (section 9). The main one: replace its edge decision (`p59x-quiet-edge.js`) with the relief's per-zoom decision from `p59b`, and raise the margin. If only one prototype could merge with no changes, the relief is the safer build to run, but its look problems come from the approach itself.

## 1. What I ran

- **Builds:** rebuilt from each prototype's `parts/`. The md5s match the shipped pages: pass 2 `fed36962…`, relief `4add5cc1…`, massif `fa6edbad…`, open `d7bb69bd…`. All three started from the current live parts; every `parts-orig/` file equals `visual-v4/map/parts/`.
- **Page errors:** 0 in all 111 logged browser sessions. The Canvas2D `willReadFrequently` warning shows in every build, pass 2 included.
- **Runs:** the full `window.__mock` suite, determinism (fresh loads and rebake), Painted (v3) sameness, Clear and Terrain sameness. Beyond what the builders ran, I added:
  - a seeded 30-camera sweep around the wilds;
  - each wild's closest zoom;
  - per-sample margins on the colour-blind test;
  - sub-pixel and integer pans;
  - real-pointer hover and select on wild neighbours;
  - three other map plans: seed 7, seed 31, and a four-wild plan with a 1-cell Ashspine;
  - far-zoom terrain readers;
  - footprint against the pass-2 bake;
  - bake, redraw and memory cost;
  - code diff and size.
- **Timing:** p2, relief and massif ran on a quiet machine (load about 1). The art workflow then loaded it (load 6–8), so the second round and the open build's runs are noisy.

## 2. The hard rule: the colour-blind wild edge test (20 / 12)

| | Pass 2 | Relief | Massif | Open |
|---|---|---|---|---|
| **Standard views** (Natural 18 at dpr 1 and 7 at dpr 2; Clear 7; Terrain 7) | 0 fails | 0 | 0 | 0 |
| **Main map, 30-camera sweep** (10,424 samples) | 0 | 1 (0.96, Greyteeth/Ashstead, Mid) | 1 (0.96, Ashspine/Stagmoor, Near) | 4 (0.94 Ashspine/Halevale, Far; 0.99 ×2 Ashspine/Morholt, a spill edge; **0.82** Greyteeth/Fenvale) |
| **Main map, each wild at the closest zoom** | 0 | **1 (0.97, Ashspine/Ashvale)**, confirmed with the page's own `reliefWildEdge()` | 0 | 0 |
| **Seed 7** | 0 | 0 | 2 (0.98 Ashspine/Tormarch, closest; 0.99 Greyteeth/Oakgate, Mid) | 5 in 2 views (start 0.97; 60 px a province, worst 0.936) |
| **Seed 31** | 0 | 0 | 0 | 1 (0.999, 60 px a province) |
| **Four-wild plan** | 0 | 1 (0.99, Greyteeth/Elmwick, closest) | 0 | 2 (0.99 Ashspine/Redbarrow; 0.97 Greyteeth/Elmwick) |
| **Sub-pixel pan** (24 positions in 3 standard views) | 0 | 0 | **3 positions fail** (1 sample each, start and Ashspine Near) | 0 |
| **Margin, main map, 11 views:** p5 of each sample's best ratio | 1.27–1.55 | 1.27–1.38 | **1.11–1.17** | 1.11–1.37 |
| **Margin:** samples under 1.10, of 4,266 | 3 | 6 | **45** | 38 |
| **Total failing samples outside the standard views** | **0** | **3** | **3, plus 3 from panning** | **12** |

What this means:

- **"0 fails in every view" holds only for the views each builder tuned on.** All three miss by 1–4% (open by 18%) elsewhere, so the 18 standard views are not enough to guard this rule.
- **Massif runs closest to the line by design.** It solves the least light edge that passes, at ×1.06 / ×1.14, and its decision samples rendered pixels, so the result depends on where pixel centres fall.
- **Open's misses sit on the spill edges** (shade lifted to L\* 37 so that the ink "just" passes) **and on the Greyteeth.**
- **Hover is a gap that pass 2 already has.** No build's decision includes the hovered neighbour's tint; selection is included. Over 46 real-pointer hovers in three views, failing samples were: pass 2 15, relief 4, massif 2, open 0. Selecting gave 0 in every build.
  - Caveat: my probe placed the pointer slightly off its intended spot, so not every hovered province was a wild's neighbour. Treat the counts as indicative.
  - The pass-2 case reproduces on its own: hovering Stagmoor at the start view drops the Ashspine/Stagmoor edge to 0.85–0.94 (`shots/hovdbg-p2-start-sbs.png`).

## 3. Determinism, sameness and the other checks

- **Determinism:** all three give identical frames and bake hashes over 3 fresh Natural loads (9 views; natural, cover and height bakes). Clear and Terrain were identical over 2 loads each. Rebakes were identical.
- **Clear and Terrain match pass 2:** the frame hashes equal pass 2's in all 9 views, and the Clear bake is `4243484565` in every build.
- **Painted (v3):** identical in 10 views over 2 loads in every build.
- **Massif depends on the camera, not on time.** The same camera always gives the same frame, but a 0.37–0.61 px pan rebuilds the static layer with a different edge (section 5).
- **Same results in all builds:**
  - Lines pass. The faint lines are unchanged: median 1.22–1.25 : 1.
  - Rails: 0 fails.
  - Seats, layout, hit test, chips, cliff and the stable check pass.
  - Snow, chroma, cover and design pass.
- **Failures shared with pass 2:**
  - Hover lines on Ashmoor/Elmwick: 2.14 at Mid and 2.29 at Near, at dpr 1.
  - The Mid reader: 0.928 / 0.931.
  - Clear's Morholt mean at Mid.
- **Terrain readers at the far zooms:**

| | Least zoom: lightness / texture, province accuracy | 60 px a province: lightness |
|---|---|---|
| Pass 2 | 1.0 / 0.967 | 1.0 |
| Massif | 1.0 / 0.967 | 1.0 |
| Relief | 0.983 / **0.95** (Karreach and Ashfen misread; texture is exactly at its floor) | 1.0 |
| Open | 0.983 / 0.967 (Karreach misread) | 0.983 (Ashvale misread) |

## 4. Design rules: kept or broken

| Rule (source) | Relief | Massif | Open |
|---|---|---|---|
| Wild material only inside its cells (map-relief V2/V4; pass-2 `reliefWildLook` "0 texels outside") | kept | kept | **broken**: 21,858 texels in four hills/mountains provinces, ΔE up to 26 |
| Land outside changed only by shading (footprint against the pass-2 bake, ΔE > 2) | 51,203 texels, almost all lighter (50,733): pass 2's cast shade near the outline is removed | 48,579, all lighter, same cause | 28,406, of which 15,923 turn greyer (materials) |
| "Never tinted, faded, hatched, dimmed or fogged" (map-relief §3.8, approved) | **broken**: neighbour fog runs 0.22 D into the wild's continued land | kept | kept |
| 3 px ink contour (approved) | kept: 3 px, `#0B0A09` | **changed**: 2 px black | kept: 3 px, `#0D0C0B` |
| Light rim `#E9E4D8` (approved; pass 2 already made it conditional) | replaced by a solved, land-tinted stone | replaced by a 2 px "quiet edge" around L\* 55 | cream, conditional |
| Light line, share of the outline in view | 76–88% (the most) | **51–66%** | 58–86% (Greyteeth 80–98%) |
| Pass-2 brightness cap | kept (max L\* 54.7) | **broken** by snow: L\* to 82, 2.97% of range texels over the cap; its own check was rewritten to allow it | kept (max 52.1) |
| Snow and crags only in wilds (V8) | kept | kept | kept (snow and crags stay inside) |
| Terrain read from what is drawn (owner, N2) | mirrored fields and woods appear inside a wild (seed 31 Greyteeth) | kept | foothills spill onto two neighbours, misread as plains |
| Water stays in one province (V9) | kept | kept | kept |
| Data modes | the v4 slab | the v4 slab | the v4 slab |
| Pass-2 critique fix 3a (rock starts at the outline) | reversed | partly reversed: a 0.04–0.16 D foothill band | kept on ordinary edges |

**Why a light line survives in every prototype:** the test compares the wild's ground 6–9 px inside with the land 6–9 px outside. Any approach that grows land-like foothills up to the outline fails that pair. A dark line then can't reach 20 / 12 against dark land (forest, swamp, shaded hills), so only a lighter line passes there. Massif's 2 px quiet edge in the land's hue is the least visible solution I measured.

## 5. Cost

| | Pass 2 | Relief | Massif | Open |
|---|---|---|---|---|
| Natural bake CPU, quiet / loaded | 6.8 / 10.8 s | 8.4 / 9.5 s | 8.4 / 10.1 s | 12.1 / 12.6 s (both loaded) |
| Wild steps of the bake | 1.4 / 1.9 s | 2.2 / 2.5 s | 2.6 / 3.3 s | 4.0 / 4.2 s |
| First frame with the bake | 12.1 s | 14.3 s | 14.1 s | 17.6 s |
| Composite per frame; pan p95 | 0.3–0.9 ms; under 2.2 ms | same | same | same |
| Static redraw (zoom settle, pan out of cache), median by view | 59–132 ms | 61–132 ms | **131–587 ms** | 64–154 ms |
| Edge decision | 15–203 ms, per zoom | 17–71 ms, per zoom | **115–408 ms, on every static redraw** | 34–254 ms, per zoom |
| Redraw on select / on a new month, median | 177–205 / 105–136 ms | 124–133 / 107–134 ms | 238–297 / 216–333 ms | 185–218 / 142–174 ms |
| Resident memory: canvases + typed arrays | 13.1 + 87.7 MB | +18 MB | **+46 MB** (about 26 MB of working planes are kept after the bake) | +11 MB |
| Does the edge change when the camera only pans? | no | no | **yes**: up to 12 of 195 stretches flip and solved L\* moves up to 15 | no |

The massif's decision reads the rendered layer with `getImageData` on every static redraw. In the game the map is a WebGL composite, so that would mean a GPU read-back at every zoom settle, selection and month change. That is the largest integration risk of the three.

## 6. Code size and integration risk

| | Relief | Massif | Open |
|---|---|---|---|
| Parts touched / new | 6 / 1 | 9 / 3 | 8 / 1 |
| Wild code (pass 2's `p58w` is 26.8 KB) | 35.3 KB (`p58w` rewritten + `p58x`) | 42.0 KB in 3 new parts; pass 2's `p58w` is left in as about 26 KB of dead code | 30.6 KB |
| Net added | about +13 KB | +44 KB as built; about +17 KB once dead code is deleted | about +7 KB |
| Largest edited part | 332 lines (`p59b`) | 318 | 319 |
| Determinism hazards | none; `Math.hypot` in edge normals only | `Math.pow` in heights; presentation only | `Math.hypot` in the spill's seat-zone test (the game version should use `sqrt`) |
| Check changes | none | `reliefWildLook` rewritten for the snow rule | new `reliefWildSpill` check |
| Main risk | Fog into wilds needs per-texel neighbour id and depth in the composite; mirror seams | Pixel read-back decision; memory; spine logic on odd shapes, though it held on a 1-cell wild | An approved-rule reversal coupled to seat zones, water and fields; the benefit depends on mapgen luck |

Every edited part is under 400 lines. All three edit the same five shared parts (`p58m`, `p58w`, `p59`, `p59b`, `p59c`), so merging one rules out cherry-picking another without hand merges.

## 7. What I saw in my shots

- **Start view** (`sheet-start-wilds.png`):
  - Massif reads as a lit mountain range with snow, plus a natural lake.
  - Relief is a crumpled, spiky foil with a thin pale inner line on the Ashspine and the Greyteeth.
  - Open is still a grey slab filling the polygon, with a cream rim on the Greyteeth and the mere.
- **Near and closest** (`sheet-ash.png`, `sheet-ashMax.png`, `sheet-dpr2-ashMax.png`):
  - Massif is crisp, with an even olive strip on the north and east sides.
  - Relief is crisp but busy; its fine detail is 5.9× the land's at Mid.
  - Open is smeared and streaky at dpr 2, and its spill draws translucent grey cliffs over Halevale across the black line.
- **Other maps** (`sheet-seed7-*.png`, `sheet-seed31-*.png`, `sheet-alt-*.png`):
  - Massif holds up on every shape, including the 1-cell Ashspine.
  - Relief mirrors a neighbouring farmland's field strips into the Greyteeth on seed 31.
  - Open shows its spill as a grey haze outside the line.
- **Least zoom** (`sheet-min.png`): every build is still framed; massif the least.
- **Massif pan flicker** (`pop-massif-start-sbs.png`): the quiet edge changes on the Ashspine's west end and the mere's east edge after a 0.61 px pan.

## 8. Scores, with reasons

**Sculpted massif: 6 / 10.**

- For:
  - Its landform, mere, 2× raster and footprint pass everything on four maps.
  - Readers are identical to pass 2.
  - Calmest edge band: busyness 39 / 7 against pass 2's 54 / 26.
  - Smallest light-line share; no fog break.
- Against:
  - The edge decision reads pixels on every redraw, flickers when panning, costs 2–4.5× pass 2's redraw time, and has the thinnest margins (45 samples under 1.10). It fails on seed 7, in the sweep, and at 3 sub-pixel pan positions.
  - Snow breaks the pass-2 cap; the contour drops from 3 px to 2 px.
  - +46 MB memory and the largest code. Its cores are the busiest at the start view and the least zoom (48.7 / 14.5 against the reference range's roughly 31–35 / 8–9).
- Most of the "against" list is one module plus some constants.

**Continuous relief: 5 / 10.**

- For:
  - The edge decision is computed from data once per zoom, does not change with panning, and costs 17–71 ms.
  - Redraws cost the same as pass 2's or less; healthy margins (p5 1.27–1.38).
  - Keeps the cap and the footprint.
- Against:
  - Fails 3 samples, one of them on the main map at the Ashspine's closest zoom.
  - Breaks the approved "never fogged" rule.
  - Mirrored land puts passable-looking fields and woods inside an impassable wild, and leaves seams at corners.
  - The light line is on 76–88% of the outline.
  - One extra far-zoom misread; the texture reader sits exactly at its 0.95 floor.

**Open (spill): 3 / 10.**

- For:
  - Smallest net code; calmest range cores.
  - The mere's water is closest to the map's water (ΔE 2.7).
  - Interaction stays correct: hover names the neighbour and paths are refused.
- Against:
  - Reverses approved V2/V4.
  - Only 239 spill texels on seed 7 and nothing for the Greyteeth.
  - 12 failing samples (worst 0.82); thin margins on the spill edges.
  - Two neighbours misread; the slowest bake (+1.3 to +5 s); the frame is still on 58–86% of the outline.
- I would not ask the owner about the spill now: the evidence does not support it.

## 9. Ship the massif, with these grafts

1. **Replace the massif's edge decision with the relief's.**
   - Take the relief's `rlWildRimMap` decision from `p59b`: the ink test, plus `rlRimNeedL`'s solved, land-tinted stone, cached by zoom.
   - Keep the massif's 2 px band width.
   - At Near, decide on the massif's fine raster rather than the 1× bake.
   - Result: the edge no longer changes with panning, and the decision costs 17–71 ms once per zoom (as in the relief) instead of 115–408 ms on every redraw.
2. **Raise the margins and cover hover.**
   - Raise every pair and stone margin to at least ×1.2; every prototype missed by 0.96–0.99 somewhere.
   - When a province is hovered, re-decide its edges with its tint. That is one province, and it fixes a gap pass 2 shares.
3. **Clean up memory and code.**
   - Free the massif's 2× working planes after the bake, as the relief does (about 26 MB).
   - Delete pass 2's dead `p58w` generator on merge.
4. **From the open prototype:**
   - The mere: its water recipe (ΔE 2.7 against the massif's 6.2) and its swamp fringe that continues across the outline without mirroring.
   - Optionally, its height-driven rock line (valleys up as heath, spurs down as rock) to break the massif's even olive strip on long straight edges.
   - Its interaction checks (hover names the neighbour, path refusal).
   - Its footprint check, turned into a guard: 0 land texels changed outside the wilds except by shading.
5. **Make the check suite catch these misses.** Add the 30-camera sweep, every wild's closest zoom, sub-pixel pans, and seeds 7 and 31 plus the four-wild plan. Every prototype passed the 18 standard views and failed somewhere here.

**Do not graft:**
- the relief's fog strips (approved rule) or its mirrored land (fields inside wilds);
- the open prototype's spill (approved rule; the benefit depends on the map).

**Questions for the owner, only if the massif's look is kept:**
- Snow brighter than the cap (up to L\* 82 on under 8% of a range)?
- A 2 px contour instead of the approved 3 px?

The defaults would be to keep the cap and 3 px; the art judges should say whether snow under the cap still reads as snow (the relief's does not).

## Files

Everything is under `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge-rules/`.

- **Results** (`out/`):
  - check suites: `checks-*.json`, `run-checks-*.txt`
  - sweeps: `run-sweep-*-natural-1.txt`
  - margins: `run-margin-*.txt`
  - other maps: `run-seed*-*.txt`
  - hover: `run-hoverwild-*.txt`
  - pans: `run-panstab-*.txt`
  - cost: `perf.json`, `run-perf-quiet.txt`
  - footprint: `footprint.json`, `footprint-diff.png`
  - busyness: `run-busy-*.txt`
  - far readers: `run-readfar-*.txt`
  - determinism and v3: `run-det-*.txt`, `run-v3-*.txt`
- **Sheets and evidence** (`shots/`):
  - `sheet-start-wilds.png`, `sheet-ash.png`, `sheet-ashMax.png`, `sheet-dpr2-ashMax.png`, `sheet-grey.png`, `sheet-mere.png`, `sheet-min.png`, `sheet-phone.png`
  - `sheet-seed7-start.png`, `sheet-seed7-ash.png`, `sheet-seed31-start.png`, `sheet-seed31-grey.png`, `sheet-alt-start.png`, `sheet-alt-w0near.png`
  - `pop-massif-start-sbs.png`, `hovdbg-p2-start-sbs.png`
- **Tools** (`tools/`): `checks.cjs`, `sweep.cjs`, `margin.cjs`, `seedprobe.cjs`, `hoverwild.cjs`, `hovdbg.cjs`, `panstab.cjs`, `popshot.cjs`, `perf.cjs`, `bake.cjs`, `footprint.py`, `busywild.py`, `readfar.cjs`, `edgeat.cjs`, `det.cjs`, `v3same.cjs`. `rebuild/` holds each build and the seed variants.
