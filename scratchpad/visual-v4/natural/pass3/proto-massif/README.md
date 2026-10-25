# Pass 3 prototype: "Sculpted massif"

This is a sandbox prototype of one approach to the three wilds in the natural view. It covers the Ashspine and the Greyteeth as sculpted mountain massifs, and the Still Mere as a lake with a natural shoreline.

- Page: `game-screen-v4.html`, built by this folder's `build.sh` from `parts/`.
- Baseline: `game-screen-v4.base.html` is the pass-2 page. It has md5 `fed36962…`, the same as `visual-v4/map/game-screen-v4.html`.
- Untouched: nothing in `/home/user/Fluid-Magic-` or `visual-v4/map/` was edited.

## What was built

### New parts (all under 400 lines)

| Part | Lines | What it holds |
|---|---|---|
| `p58x-massif-gen.js` | 115 | Each wild's geometry and spine, a low-frequency pass every 2 bake texels, the fine pass, cast shadows and valleys, the Far relief's heights, and the land's recomputed shadows |
| `p58y-massif-colour.js` | 114 | Colour on the fine raster, the bake's wild texels (2×2 means), the Near detail classes, and the draw |
| `p59x-quiet-edge.js` | 57 | The natural view's outline: the thin ink plus the quiet edge |

### Edited parts

- `p58m`: calls the new generator and colour pass.
- `p58w`: the canvas sculpture is skipped when the new wilds are present.
- `p59`: draws the fine raster, and passes the under layer to the outline.
- `p59b`: `rlDrawWildContours` uses the quiet edge in the natural view.
- `p59c`: the Near detail classes for wild texels.
- `p89`: `reliefWildLook` follows the changed snow rule, and `reliefWildEdge` reports the quiet edge's share.
- `build.sh`: the order of the new parts.

### Massif (peaks)

**Spine and silhouette.**
- The spine runs along the wild's long axis (the principal axis of its texels). In 48 bins along it, the deepest texel gives the spine's offset and the room the cells allow.
- The massif's half-width is 0.8 × that depth.
- A crest meanders along the spine and is rounded. Seeded noise displaces the silhouette.
- A smooth minimum with the outline keeps the massif 0.04 to 0.16 D inside. That width wanders with noise, so the edge never runs parallel to the polygon.

**Relief.**
- Peaks and saddles rise along the crest.
- Spurs run across the axis: ridged noise at 28 × 40 mapgen units, 3 octaves, domain-warped.
- The faces are lit from the north-west with a hard terminator. The shade side is dark and cool; the lit rock reaches pass 2's cap (L\* 54.85).
- The massif casts a shadow on itself and its own foothills, nothing else. A 28-step march is made at bake resolution, with only the wild's own texels casting.
- Valleys are darkened, and scree aprons sit at the foot and in the gullies.
- Snow covers the top crests (60–72% of the massif's height), less on the steepest faces. Lit snow is up to L\* 86 and shaded snow is blue-grey.

**Foothills.**
- The ground between the massif and the outline is the land's own: S3's ground blend, drawn with the land's own seeded patterns, so they run on across the outline. These are heath blotches, plains streaks and patches, and swamp pools, reeds and shrubs.
- The foothills carry the hills' shading and the massif's cast shadow.
- Next to forest, sparse crowns climb toward a treeline.

### Mere

- An ellipse is fitted to the cell, displaced by noise and pulled in 0.05 to 0.13 D from the outline by a smooth minimum.
- The water has a shallow lighter shelf at the shore, the map's natural water at mid depth and a darker centre, with faint light ripples.
- The fringe between the shore and the outline is the land's ground with the swamp's pools. It is wetter toward the shore and has reed beds. There is no rim.

### Crisp at every zoom

- Every wild is computed on its own raster at 2 × the bake's resolution (2.56 texels per world unit).
- The bake's wild texels are 2×2 means of that raster, so the canvas, its mips and the checks see the same picture.
- On screen, wild cells are clipped and drawn from the sharpest source that still fits the zoom:
  - the fine raster once a bake texel covers more than 1/0.85 device px;
  - the bake's full-resolution canvas from there out to 1.8 bake texels per device px;
  - beyond that, the land's own mip.
- At the closest zoom a fine texel is 0.94 CSS px. Near detail adds rock grain on the massif, heath on the foothills and reeds on the mere's fringe.

### Outline (natural view, Ownership mode only)

- A 2 px black ink line, down from pass 2's 3 px `#1C1A17`.
- A quiet edge only where the colour-blind wild edge test needs it. It is a 2 px band just inside the ink, in the land side's hue (× 0.6). Its L\* is solved per stretch as the least value that reaches 20 / 12 × 1.14 against the wild's ground (W) and the land (G).
- The decision reads the under layer as rendered, with the rails composited and the selected neighbour's tint applied. It samples the pixels the test samples, every 1 px, at the current zoom, on each static re-render.
- Clear, the Terrain mode, the data modes and the passability view keep the v4 granite and mere and the v4 contour and rim. This is unchanged and pixel-identical (see below).

## Rule changes

1. **Snow may pass the wild cap.** Pass 2's rule was that no wild texel is brighter than the passable mountains' brightest lit rock (p99.9) plus 2.5 L\*, a cap of 54.85.
   - Rock still obeys it: 0 rock texels are over the cap.
   - Snow on the top crests may exceed the cap, but a texel only by its snow share × (86 − cap).
   - Snow may cover at most 8% of the range. It is 4.95% now, and 2.97% of range texels are over the cap. Snow L\* max is 82.2.
   - `reliefWildLook()` checks this changed rule and passes. Under the old rule it would fail.
   - The verifier's "peaks brighter than the land's p95" is 3.4–7.4% of peak pixels (pass 2: 0.3–7.9%).
2. **No cream rim in the natural view.**
   - The light rim (`#E9E4D8` at 0.85, on 53–100% of the outline) is replaced by the quiet edge, solved per stretch.
   - The ink goes from 3 px `#1C1A17` to 2 px black. Black lets the ink alone reach 20 / 12 against more of the land (L\* ≈ 30–45 grounds).
   - The colour-blind wild edge test itself is unchanged and passes.
3. **The quiet-edge decision reads rendered pixels** (the static under layer), not the bake. It runs on every static re-render rather than being cached per zoom.
4. **The land's cast shadows near the wilds are recomputed (Natural only).**
   - The wilds count at foothill height, so the v4 granite dome no longer shades the land outside a wild. The massif shades only its own foothills.
   - The Far relief now reads the massif's real heights.
   - Clear is unaffected and keeps its v4 shadows.

## Numbers

All runs are 1440×900 unless marked. The checks are this folder's copies of the verifier's tools. Outputs are in `out/`.

### Wild edge test (`reliefWildEdge`)
- **Natural:** 0 fails in all 18 views at dpr1 (`out/run-checks-natural-1-final.txt`) and all 7 views at dpr2 (`out/run-checks-natural-2-final.txt`).
- **Extra dpr2 probes** (start, mid, Near Ashspine, max): 0 fails (`out/run-edge-dpr2.txt`).
- **Clear and the Terrain mode:** 0 fails in all 18 views each.

### Quiet edge
| | This prototype | Pass 2 |
|---|---|---|
| Share of the outline in view | 51–66% at dpr1; 50–64% at dpr2 | 53–100% (cream rim) |
| L\* | 43–73, median 53–57 | about 91 (cream) |
| Verifier's light-rim measure (a pixel of L\* ≥ 65 within −2.5..+4 px) | 2–16% of outline samples | 51–100% |
| Mere | 0–3% | 99–100% |

### Busyness (`tools/wbusy.py`)
The verifier's metric: 6 CSS px cells, share of neighbours differing by more than 10 / more than 20 L\*, on the land layer. The wild core is at least 4 px inside the outline. The wild edge is cells within 12 px of a wild outline.

| View (D px) | Wild core, this prototype | Wild core, pass 2 | Wild edge, this prototype | Wild edge, pass 2 |
|---|---|---|---|---|
| Start (96) | 40.3 / 11.9 | 32.0 / 8.8 | 41.8 / 7.4 | 54.2 / 28.2 |
| Far, least zoom (54) | 46.3 / 11.9 | 42.5 / 9.7 | 43.0 / 5.3 | 63.9 / 25.8 |
| Mid (175) | 28.2 / 7.7 | 16.3 / 2.8 | 40.4 / 7.0 | 61.3 / 24.8 |
| Reference zoom (200) | 18.8 / 5.0 | 13.0 / 3.0 | 42.9 / 9.5 | 59.9 / 26.1 |
| Near, Ashspine (231) | 23.6 / 5.6 | 16.9 / 2.0 | 50.3 / 8.8 | 58.5 / 30.5 |
| Near, Greyteeth (252) | 15.4 / 3.8 | 8.2 / 1.3 | 37.8 / 5.1 | 52.3 / 21.8 |
| Near, mere (252) | 15.8 / 3.6 | 6.7 / 1.0 | 34.9 / 4.8 | 56.2 / 17.5 |
| Closest zoom, Ashspine (420) | 13.5 / 2.6 | 5.8 / 0.4 | 45.0 / 8.4 | 54.7 / 30.9 |

- The ref-2 mountains score 30.8 / 8.0 by the same metric.
- Passable land cores are unchanged: for example 4.8 / 0.2 at the start view.

### Terrain readers (`m.reliefNatural(true).readers`, `tools/readers2.cjs`)
The same failures exist in pass 2, with the same provinces missed:

| View | This prototype | Pass 2 |
|---|---|---|
| Far, least zoom | 0.912 / 1.0, texture 0.788 | 0.910 / 1.0, texture 0.784 |
| Start | pass, 0.974 / 1.0 | pass, 0.974 / 1.0 |
| Mid 0.75 | pass, 0.964 | pass, 0.968 |
| Mid | fail, 0.928 / 0.931 | fail, 0.928 / 0.931 (Duskholt, Karwick) |
| Reference zoom | pass, 0.932 / 0.957 | pass, 0.932 / 0.957 |
| Near, Ashspine | fail, 0.774 / 0.889 | fail, 0.767 / 0.889 (Duskholt, Ashfen) |
| Closest zoom | pass, 0.995 / 1.0 | pass, 0.995 / 1.0 |

The Far texture reader and the Near view both fail in pass 2 too.

### Lines and rails
- Lines pass and rails have 0 failures in all 18 natural, 18 Clear and 18 Terrain views at dpr1 and in the dpr2 natural views.
- Faint-line median is 1.22–1.25:1, unchanged.
- The hover lines check fails at Mid and Near at dpr1, as in pass 2's verification (Ashmoor/Elmwick 2.14 and 2.29). That failure is not in the wilds. At dpr2 it passes.

### Wild look (`reliefWildLook`)
- Passes under the changed rule.
- Peaks L\* p5 / p50 / p95 / max: 11.1 / 29.9 / 47.6 / 82.2. Rock over the cap: 0.
- Mere water mean Lab is [29.9, −20.0, −5.1] against the map water's [36.8, −23.8, −3.1], ΔE 6.2: the same hue, deeper. The fringe is 48% of the cell.
- 0 texels outside their cells.

### Determinism and sameness
- **Natural:** 3 fresh loads give identical frames in 6 views and identical bake hashes (`out/run-det-natural-final.txt`). The rebake check is also identical (frame 3725784413, bake 1403365240).
- **Clear:** 2 loads identical; bake hash 4243484565, the same as pass 2's.
- **Clear and the Terrain mode against pass 2:** 0 changed pixels in the land layer and the full frame in 5 views each, re-run on the final build (`out/run-same-clear-final.txt`, `out/run-same-terrain-final.txt`).
- **Painted (v3):** frames identical to pass 2 and to the page before the natural view in 10 views over 2 loads (`out/run-v3same.txt`).
- **Page errors:** 0 in every session.

### Bake time
The machine is shared, so these timings are noisy.
- **Wild steps, best of 3 in isolation** (`out/run-prof-*.txt`): 1.90 s here (generator 0.97, colour 0.93) against pass 2's 1.46 s. About +0.4 s.
- **Full natural bake, CPU:** 9.3 s here against 10.1 s for pass 2's page in the same session.
- **The quiet-edge decision:** 120–760 ms on each static re-render (zoom settle or pan out of the cache). Pass 2's rim decision cost up to 209 ms.
- **Fine-raster memory:** about 1.3 M fine texels, 5 MB as canvases. The five Float32 planes kept on the boxes (heights, masks, distances) add about 26 MB; they could be freed after the bake.

## Shots (`shots/`, 1440×900 unless marked)

| File | View |
|---|---|
| `01-start.png` | Start view |
| `02-far.png` | Far, least zoom |
| `03-mid.png` | Mid |
| `04-ref-zoom.png` | Reference zoom |
| `05-near-ashspine.png` | Near, the Ashspine |
| `06-near-greyteeth.png` | Near, the Greyteeth |
| `07-near-mere.png` | Near, the mere |
| `08-max-ashspine.png` | Closest zoom, the Ashspine |
| `09-max-greyteeth.png`, `10-max-mere.png` | Closest zoom, the other two wilds |
| `11-mid-wilds.png` | Mid, all three wilds |
| `20-clear-start.png`, `21-clear-near-ashspine.png` | Clear terrain colours |
| `22-terrain-start.png` | The Terrain mode |
| `23-mode-supply.png`, `24-mode-supply-near.png` | A data mode |
| `30-phone-fit.png` | 390×844 at Fit |
| `31-phone-start.png` | 390×844 start |
| `40-dpr2-max-ashspine.png`, `41-dpr2-start.png` | Double density |
| `50-side-by-side-start.png` | Side by side with `pass2/shots/01-start.png`, cropped to the model |
| `51-side-by-side-start-full.png` | The same, full frame |
| `52-side-by-side-near-ashspine.png`, `53-side-by-side-near-mere.png` | Near views side by side with pass 2 |

## Weaknesses

1. **The quiet edge is still on about half the outline** (51–66% in view). Wherever the land outside is dark (forest canopy, shaded hills, swamp pools), black ink cannot reach 20 / 12, so a lighter line must. It is quieter than pass 2's cream rim: land-hued, L\* about 55 rather than about 91. Even so, at the start view it reads as a thin olive verge around parts of the Ashspine, the Greyteeth and the mere. Only a lighter strip inside the outline would remove it, and that is the light band pass 2 was criticised for.
2. **The wild cores are busier than pass 2 and ref-2 at the start view and Far**: 40.3 / 11.9 and 46.3 / 11.9, against pass 2's 32.0 / 8.8 and ref-2's 30.8 / 8.0.
   - Crisp, lit faces, ridges and snow add contrast at 6 px cells. Pass 2 was calm because it was smoky.
   - Closer in, the cores are calmer than ref-2 (13.5–23.6 / 2.6–5.6) but busier than pass 2's smooth slabs.
   - I tried calmer variants (lower contrast, larger forms). They reached 34.7 / 9.8 at the start view but went soft, like rounded hills, at Near, so I kept crisper forms.
3. **The forms are procedural.** At the closest zoom the faces read as rounded, sculpted rock with crisp creases, not the sharp pyramidal peaks of the reference. The spine logic gives a believable range, but not a hand-placed one. The snow reads as streaks along the crests more than as caps.
4. **The foothill band can still look like an even olive strip** on stretches where the smooth minimum holds the massif to the outline: the Ashspine's east end and the Greyteeth's west side. The mere's fringe is also smoother than the swamp outside it. The pools carry over, but at a lower density.
5. **Snow breaks pass 2's cap** (rule change 1). The wilds again hold some of the brightest pixels on the map: 3–7% of peak pixels are over the land's p95, a small area.
6. **Cost.** The wild steps are about 0.4 s slower. The quiet-edge decision costs 120–760 ms on each static re-render, worse than pass 2's 209 ms, because it reads the rendered layer with `getImageData`. That also produces the Canvas2D "willReadFrequently" console warning; these are warnings, not page errors. Caching the decision per zoom, as pass 2 did, would cut most of this.
7. **The hover tint of a neighbouring province is not in the decision** (as in pass 2). A hovered neighbour could lower a stretch below 20 / 12 while it is hovered. The selection tint is included.
8. **Data modes, Clear and the Terrain mode keep the v4 granite slabs and mere** (allowed by the brief). So switching to a data mode shows the old slab shapes over the new massif's footprint.

## Tools (`tools/`)
- **Copied from pass 2's verifier**, with `lib.cjs` pointing here: `checks.cjs`, `dump.cjs`, `det.cjs`, `v3same.cjs`, `samecheck-p2.cjs`, `look.py`, `wild.py`, `vlib.py`.
- **New:** `shots.cjs`, `edge.cjs`, `edgefail.cjs`, `wbusy.py`, `readers2.cjs`, `prof2.cjs`, `sbs.py`, `fine.cjs`, `fine2.cjs`.
- **Lane scripts:** `laneA.sh` to `laneF.sh`. `stoplanes.sh` stops this folder's runs only.
