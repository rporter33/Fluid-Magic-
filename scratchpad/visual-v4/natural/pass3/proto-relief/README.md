# Pass 3 prototype: "Continuous relief" wilds

This is a sandbox copy of the game-screen mockup (`build.sh` and `parts/` copied from `visual-v4/map/`). The approach treats each mountain wild as the tallest part of one heightfield it shares with the land. The live mockup in `visual-v4/map/` and the repo were not touched (`git status` in the repo is clean).

- Build: `sh build.sh` writes `game-screen-v4.html` (md5 `4add5cc1…`).
- Parts edited:
  - `p58w-natural-wilds.js` (rewritten, 128 lines)
  - `p58x-natural-wild-texel.js` (new, 121 lines; `build.sh` adds it after p58w)
  - `p58m-materials.js` (118)
  - `p59-relief-draw.js` (221)
  - `p59b-relief-lines.js` (332)
  - `p59c-relief-detail.js` (87)
- Every edited part is under 400 lines. The originals are in `parts-orig/`.

## What was built

### Ranges (the Ashspine and the Greyteeth), Natural look only

1. **One heightfield.**
   - Under each wild, the land's own height (S4's blend of the neighbouring terrains, continued by the land weights that reach into the wild) is computed first. A ridged range is then added on top, starting at zero on the outline.
   - Its amplitude grows slowly from the outline: the foothills are 0.20 to 0.42 D wide, varied by noise, and there is a broad dome toward the core. So near the edge the slopes are the spurs' own, not a wall running along the edge.
   - The crests use 5 octaves of ridged noise at 17 map units. The spurs run across the range's long axis.
2. **Crisp light at twice the bake's resolution.**
   - Heights, slope and the Lambert shade (light from the upper left at 40°) are computed at 2× the bake (`RL_NW.peaks.ss`).
   - Each bake texel is the mean of its four 2× texels, so the bake is supersampled.
   - The 2× colours are also kept as a canvas that is drawn over the bake at Near, once a bake texel is 0.95 CSS px or more. This is why the closest zoom is crisp rather than magnified.
   - The cast shadow (56 one-texel diagonal steps, heights ×0.55) and the valleys are made at 1× and read bilinearly.
3. **Materials, reusing the passable-mountain grammar.**
   - Rock runs from shade L\* 12 (slightly blue) to lit L\* 48.
   - Scree sits on the valley floors.
   - Snow is on the highest 22% of crests, mostly on lit faces. It is held at the existing brightness cap, which is not changed.
   - The rock line is ridge- and slope-driven in a narrow window: crests and steep faces turn to rock first, and valleys stay green.
   - Below the rock line, the foothills are the land itself: the baked land mirrored across the nearest edge up to 0.08 to 0.2 D, beyond that a blurred land colour, darkening to heath as they climb.
4. **The land around a range uses the same heights.** In a band around each wild:
   - The land's hillshade beside the outline is recomputed from the continuous heights.
   - The land's cast shadow is recomputed, including the range's longer shadow.
   - The land's valley term is left as S5's. Recomputing it tipped Halevale to "mountains" for the reader at 131 px a province; this is switched off with `landAo: false`.
   - Clear's shared rasters are untouched.

### The Still Mere

- The lake is an ellipse fitted to the cell's own axes. Its radius wanders under a warped seeded noise (bays and points) and is pushed off the outline by an edge penalty, so the shore never runs parallel to the straight cell edges.
- The water uses the map's natural water hue: a shallow shelf by the shore (L\* 41, greener) and a deeper centre (L\* 27). Faint ripples and reeds are sculpted on the bake.
- Between the outline and the shore, the land continues: the baked land is mirrored across the edge up to 0.24 to 0.34 D. It gets wetter, darker and reedier toward the water.

### Edge, fog and Near detail, Natural ownership view only

- **Contour:** the outline is carried by the 3 px dark contour, now near-black `#0B0A09` (L\* 3; was `#1C1A17`). Next to hills, swamp ground and mountains it reaches 20 / 12 on its own.
- **Light rim:** drawn only where neither the ground pair nor the contour reaches 20 / 12 ×1.1 against both sides. The wild side is jittered ±jit/2 and the land side ±jit.
- **Rim colour:** solved per edge as the darkest lightness that passes (×1.3 margin), in the hue of that edge's own ground (×0.8). Beside a wood it is a lit green edge, not a cream frame.
- **Fog:** the passable neighbour's haze and desaturation run 0.22 D into the wild's continued land as a fading strip. The rim decision reads the same fog factor.
- **Near grain:** the continued land takes its own land's Near grain (canopy crowns included). Rock and open water take none.

Clear, the Terrain mode and the data modes keep the v4 massif and mere and the cream rim on every edge.

## Numbers

### Checks

All checks are `window.__mock`, run with the verifier's `checks.cjs`. Outputs are in `out/run-checks-*.txt` and `out/checks-*.json`.

- **Page errors:** 0 in every session (checks, shots, dumps, readers, determinism, sameness, v3).
- **Natural, 1× (18 views):** lines, rails, seats, layout, hit test, chips, cliff, stability, wild edge, wild look, snow, chroma, cover, design and rebake all pass.
  - Hover lines: Ashmoor/Elmwick 2.14:1 at Mid and 2.29:1 at Near (a land edge). This is the same as the pass-2 verifier found and is not caused by this change.
- **Natural, 2× (7 views):** all pass, hover included.
- **Clear and the Terrain mode (18 views each):** all pass. The Clear bake hash is 4243484565, unchanged.

### Wild edge test (colour-blind)

- 0 fails in every view, look and density: Natural 18 + 7 views, Clear 18, Terrain 18.
- Samples include 305 at the start view, 138 at the least zoom, 429 at Mid and 433 at the reference zoom.
- The ground pair passes directly on 0.3% to 17% of samples; the dark contour or the rim carries the rest.

### Rim

| View | Outline share with any rim, this build (pass 2) | Verifier's metric, pixel L\* ≥ 65, this build (pass 2) |
|---|---|---|
| Start | 75.6% (53–59%) | 23.8% (57.4%) |
| Least zoom | 87.9% (100%) | 71.9% (100%) |
| Mid | 75.5% | — |
| Reference zoom | 79.9% | 23.4% (56.9%) |
| Near | 84–85% | 21.9% on the Ashspine (51.6%) |

- The mere alone, by the verifier's metric: 53% at the start view (pass 2: 99%) and 27% at Near (pass 2: 100%).
- **Rim decision cost:** 105–320 ms each time a zoom settles, with one 753 ms reading at the closest zoom on the loaded machine. Pass 2 was 20–209 ms.

### Wild look

- **Peaks:** L\* p5 / p50 / p95 / max = 11.4 / 27.2 / 48.1 / 54.7, against a cap of 54.85. 0 texels are over the cap and 0 lie outside their cells.
- **Mere:** water Lab [28.4, −20.9, −2.8] against the natural water's [36.8, −23.8, −3.1], ΔE 6.9 (pass 2: 7.3). Fringe share is 0.44.

### Busyness

This uses the verifier's metric: the share of neighbouring 6 CSS px cells that differ by more than 10 / more than 20 L\*, on the land layer. "Edges" is a band within 12 px of the wild outline, on the lines layer. Tool: `tools/busywild.py`; outputs in `out/busywild-*.json`. Both builds were dumped at identical views.

| View | Peak cores now (pass 2) | Mere core now (pass 2) | Wild edges now (pass 2) | Peak fine detail ÷ land, now (pass 2) |
|---|---|---|---|---|
| Start | 36.1 / 3.4 (38.8 / 10.8) | 1.6 / 0 (0.8 / 0) | 48.3 / 13.2 (53.5 / 26.2) | 3.5 (1.4) |
| Least zoom | 28.4 / 2.8 (51.4 / 11.9) | 0 / 0 (4.0 / 0) | 52.2 / 19.1 (62.5 / 25.0) | 3.3 (2.2) |
| Mid | 37.5 / 7.6 (20.7 / 3.6) | 2.2 / 0 (0.9 / 0) | 50.5 / 7.8 (58.5 / 23.4) | 5.9 (1.0) |
| Reference zoom | 27.7 / 5.8 (19.6 / 4.6) | 1.2 / 0 (0.3 / 0) | 53.6 / 11.2 (57.9 / 24.9) | 2.9 (0.7) |
| Near, Ashspine | 35.6 / 7.7 (16.5 / 2.0) | — | 43.1 / 4.4 (53.2 / 29.8) | 4.3 (1.0) |
| Closest, Ashspine | 28.2 / 7.5 (5.8 / 0.4) | — | 45.7 / 6.3 (55.1 / 32.2) | 1.7 (1.2) |

- For comparison, owner reference 2's range measures 34.9 / 8.6 with 6 px cells at about 1 CSS px. Its fine detail is 2.07 L\* absolute, against this build's 2.3–4.3.

### Terrain readers (the page's lightness-only readers)

Each cell gives patch / province accuracy. Tool: `tools/readers2.cjs`; output in `out/run-readers-*.txt`.

| View | This build | Pass 2 |
|---|---|---|
| Least zoom | 0.910 / 0.983 (Karreach hills read plains) | 0.910 / 1.0 |
| 60 px a province | 0.925 / 1.0 | 0.925 / 1.0 |
| Start | 0.974 / 1.0 | 0.974 / 1.0 |
| 131 px a province | 0.964 / 0.957 | 0.968 / 0.957 |
| Mid | 0.928 / 0.931 | 0.928 / 0.931 |
| Mid, east | 0.967 / 0.963 | 0.967 / 0.963 |
| Reference zoom | 0.932 / 0.957 | 0.932 / 0.957 |
| Reference zoom, west | 0.960 / 0.941 | 0.957 / 0.941 |
| Near (0.8 of max) | 0.999 / 1.0 | 0.999 / 1.0 |

- The overall pass/fail flag is the same in both builds at every zoom.
- The Mid failure was already there before this pass.
- At the least zoom the flag fails in both builds on the texture reader.

### Determinism and sameness

- **Fresh loads:** Natural 3 of 3, Clear 2 of 2 and Terrain 2 of 2 are identical in 6 views, bake hashes included (natural `d40849d6`). Rebakes are identical.
- One extra single load on the heavily loaded machine showed a different cached start frame (`92702858` against `27855915`). The pass-2 verifier saw the same cached-start-frame behaviour before this change. The 3 loads after it were identical.
- **Painted (v3):** pixel-identical to the pass-2 build and to the page before the natural view, in 10 views over 2 loads.
- **Clear and the Terrain mode:** pixel-identical to the pass-2 build in 5 views each.
- **Supply data mode:** at most 690 pixels differ, by at most 5/255. The natural land shows through the mode layer at its residual opacity.

### Bake time

The machine was shared and noisy. Medians are from 3 interleaved fresh loads each; output in `out/timing.txt`.

- The wild steps (land heights, both ranges at 2×, the land band, the 2× colour, the wild texels) take 4.8 s, against 2.5 s for pass 2's wild steps on the same machine.
- The full natural bake takes 14.8 s CPU against 11.4 s.
- On an earlier quiet run, the wild steps took 2.3 s and the whole bake 8.4 s CPU.

### Other

- About 4 MB of 2× canvases are kept for Near; the 2× working planes are freed after the bake.

## Shots

All shots are at 1440×900 in `shots/`:

- `01-start`, `02-far` (least zoom), `03-mid`, `04-ref-zoom`
- `05-near-ashspine`, `06-near-greyteeth`, `07-near-still-mere`
- `08-closest-ashspine`, `09-closest-greyteeth`, `10-closest-still-mere`, `11-mid-greyteeth-mere`
- `20-clear-start`, `21-clear-near-ashspine`, `22-terrain-mode-start`, `23-mode-supply`
- `30-phone-390x844-fit` (390×844)
- Side-by-sides against pass 2:
  - `40-side-by-side-start` (against `pass2/shots/01-start.png`)
  - `41-side-by-side-start-wilds-2x`
  - `42-side-by-side-closest-ashspine`
  - `43-side-by-side-near-mere`

## Rules this changes

The colour-blind wild edge check is unchanged and passes. Four existing rules change, and one fix is replaced:

1. **The light rim.** The pass-2 rule drew it on every stretch whose ground pair misses 20 / 12, in cream at 0.85. Now it is drawn only where the ground pair *and* the dark contour both miss, and in a solved stone tinted to that edge's ground.
2. **The Natural contour colour** is `#0B0A09`, not `#1C1A17`.
3. **"Wilds are never fogged."** The land continued inside a wild now takes its neighbour's fog in a 0.22 D strip. The rock and the water are still never fogged.
4. **Pass-2 critique fix 3a is reversed:** the range's ground continues the land inside the footprint again. The edge is now carried by the contour, not by a change of material.
5. **Pass-2 critique fix 4 (rock grain at Near) is replaced** by the 2× range layer.

The brightness cap is not changed, so snow is held under it.

## Weaknesses

- **A frame still shows.** The rim is drawn on 76–88% of the outline, because a continuous ground means that next to dark woods and peat pools only a light line can meet 20 / 12. It is darker and land-coloured now, but at the start view and the least zoom it still reads as a thin pale inner line. It is strongest round the Greyteeth (woods and swamp) and the mere.
- **The near-black 3 px contour now carries the whole edge.** At Far it is heavy, and the cell polygon is always visible. That is by design here, but it is the polygon.
- **The rock is busier than pass 2 at Mid and Near.** It is close to owner reference 2 by the 6 px metric (37.5 / 7.6 against 34.9 / 8.6), but its pixel-level fine detail is 3–6 times the smooth natural land and about twice the reference's. Some will read it as crumpled.
- **The rock line follows long straight edges.** The foothill band follows the distance to the edge, so a long straight cell edge gives a straight-ish rock line about 0.15–0.2 D inside it. The Ashspine's south side shows this.
- **Mirrored land:**
  - Fields repeat as reflections.
  - At concave and convex corners the reflection switches edges, leaving a faint seam from the corner (visible at the Ashspine's north-east corner at the closest zoom).
  - Beyond the mirror the foothills are a smooth blurred colour.
- **Snow under the cap** reads as pale crest rock more than white snow.
- **The mere:**
  - It has no 2× layer, so its shore is soft at the closest zoom.
  - The ellipse follows the cell's proportions.
  - The marsh fringe all round still outlines a polygon inside the dark contour.
- **Cost:**
  - The bake takes about 2 s more.
  - The rim decision takes up to about 0.3 s, and once 0.75 s, each time a zoom settles.
  - About 4 MB is kept for the Near layer.
- **Morholt:** at the Ashspine's west end, the passable mountains are mirrored into the foothills. Only the line and the darker rock beyond say "impassable" there.
- **Least-zoom reader:** the province reader drops from 1.0 to 0.983 (Karreach, which touches the range, reads plains). It is still above the 0.95 floor.
- **Run order:** the check suites, dumps and shots ran on the build just before the 2× planes were freed after the bake. That last edit leaves the bake hashes and the frames identical (3 fresh loads). The timings are noisy because the machine was shared.

## Files

- Tools: `tools/` — `quick.cjs`, `wq.cjs` (wild, line and rail sweep), `shots.cjs`, `dump.cjs`, `busywild.py`, `wild.py`, `readers2.cjs`, `checks.cjs`, `det.cjs`, `same.cjs`/`same.py`, `v3same.cjs`, `tm.cjs`, `edgefail.cjs`, `rimdbg.cjs`. They are copied from `pass2/verify/tools` and `pass2/tools`, pointed at this sandbox.
- Outputs: `out/`, including `out/dump/` (`now-*` and `p2-*`), the `run-*.txt` logs, the JSON results and `timing.txt`.
