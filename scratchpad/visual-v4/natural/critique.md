# Natural view: art direction and QA critique

2026-10-23. Reviewed: `map/game-screen-v4.html` as built (not edited). Every path below is relative to
`/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/`. My shots, tools and
measurements are in `natural/ad/` (`shots/`, `tools/`, `evidence-sheet.png`, `*-results.json`, `layers-metrics.json`).

**What I covered.** I took my own shots at 1440×900 (dpr 1 and 2), 1280×720, 1024×768 and 1920×1080. I tested:

- **Zoom:** wheel out to the table, the minimum zoom, Far, the start view, Mid at 0.62 / 0.75 / 1.0, ref-2's zoom (1.142) at four places, and Near on ten provinces, one of each terrain.
- **Interaction:** hover on a province, an unexplored province, a wild, a feed link and the Kharnath stack; selecting a province and Varo; a right-click move around the Ashspine.
- **Views:** Shift names, all seven modes by keyboard, the Terrain mode before and after its bake, the Clear setting, the realm tint, Table Off and Simple, deutan, Passability and Painted (v3) and back.
- **Time-lapse:** months 14, 30, 45, 60 and 70.

The page's checks pass in my runs: lines, seats, hover chips, layout, snow and cliff, with 0 page errors in every session.

I also ran six runtime experiments in a private browser to get evidence for fixes 1 to 4. They switched off one layer at a time, tried a different hairline solve and re-baked the natural look with changed parameters. The mockup file was not touched.

The busyness figures in this file are the share of 6 px cells on a 1440 px screen whose L\* differs from a neighbour's by more than 10 (`refs-analysis.md` §1).

## Verdict

**The land itself is now right.** With the overlays off, ref-2's zoom has busyness 12.5% against ref-2's 11.8%. The terrain values in province cores hit the targets:

| Terrain | L\* in province cores | Target |
|---|---|---|
| Forest | 19.4 | 19–20 |
| Plains | 43.6 | 39–46 |
| Farmland | 47.3 | |
| Hills | 35.4 | |
| Swamp | 33.6 | |
| Wasteland | 52.5 | |
| Water | 37–40, teal hue 187 | |

- **Terrain:** each one can be told apart by its drawing, and every hover names it, unexplored land included.
- **Ownership** reads on top.
- **Pieces:** towns and armies read as miniatures on rimmed bases.
- **Fog, modes and time-lapse** all work.

**What still keeps it from the owner's "not cluttered, clean":**

- **The overlays.** With everything on, ref-2's zoom is 22.8% busy, about twice the reference, and the start view is 27.0%. Most of the gap comes from what sits on the land:
  - the near-white neutral hairlines, which still draw a cell grid;
  - a pale box-cluster hamlet in every province;
  - every province named at Near.
- **The relief.** It is too fine and too contrasty where it rises (mountains and wilds read as crumpled foil).
- **Hard edges.** Binary texel edges become pixel blocks and staircases at Near.

Zoomed out, the model still reads as a flat board, and its cliff face now looks like masonry.

## The fixes, most important first

### 1. Neutral hairlines: turn the white cell grid into lit seams

**Where.** `p59b-relief-lines.js`: `rlSegStyles` (kind `'hair'`) and the hairline branch of `rlDrawRails`. The constants are in `RL_P.line` in `p58a-relief-base.js`.

**Change.** Draw the neutral hairline as a lit bevel:

- **Two halves.** The upper-left half is 1.5 px in the light key; the lower-right half is 1.5 px in the dark key.
- **Each half solved on its own side.** Solve each half against its own side only (that side's quantiles plus the ground right under the line), with `hair` 2.35, `hairCov` 0.8 and `q` 0.08.
- **Key fallback, per edge.** If a half's preferred key reaches the target on less than two-thirds of an edge's segments, that half takes the other key for the whole edge. No partner line and no running maximum.
- **Drawing.** `rlDrawRails` draws the halves at −0.75 / +0.75 px with their own alphas.

A working runtime version is `natural/ad/tools/bevel-patch.js` (applied by `bevel.cjs`).

**Evidence.**

- **The grid comes from the hairlines.** `shots/L-start-nohair.png` against `L-start-all.png`: with the hairlines off, the start view reads as one landscape.
  - Start-view busyness drops from 27.0 to 23.2.
  - The pixels over L\* 75 drop from 2.33% to 1.67%, so the hairlines are about a third of the brightest pixels on the map.
  - 72 of 73 anchors are the near-white key (design §8.2). The rails' inner keyline is the same cream, so realm edges and unowned borders share their brightest stroke.
- **The build's lines sit well over the floor.** Rendered hairlines are 3.57:1 median at the start view, 3.43 at ref-2's zoom and 3.32 at Near, against the 2.3 floor.
- **The reference's lines are much fainter.** Ref-2's rails measure about 1.5–1.7:1 against the land in the capture (`ad/ref2-linecrop.png`, peak L\* 46 on ground L\* 34).
- **The bevel, by the page's own `reliefLines()` check** (`bevel-results.json`):

| | min / median, dpr 1 | min / median, dpr 2 |
|---|---|---|
| Start | 2.56 / 3.09 | 2.82 / 3.25 |
| Ref-2's zoom | 2.49 / 3.04 | 2.83 / 3.09 |
| Near | 2.70 / 3.00 | 2.87 / 3.06 |

  - 0 samples under the floor, 0 keyline flips, at most 3 px wide; the internal keylines are unchanged (3.47 / 3.41).
  - Over forest the white stroke becomes a dim seam (`shots/cmp-hair-build-vs-bevel.png`, `cmp-hair-ref-build-vs-bevel.png`).

**Accept when** `reliefLines()` passes in all six modes, in both looks, at dpr 1 and 2.

**Owner question (not a build change).** After this fix the lines are still about twice the reference's weight. Only a lower floor for borders between two independents would match ref-2. The owner kept every colour-blind minimum, so that is the owner's decision.

### 2. Passable mountains are crumpled foil: lower the natural relief caps

**Where.** `RL_NAT.cap` in `p58n-covers.js`, used by `rlNaturalGen` in `p58m-materials.js`. Record the change in docs/09-balance.

**Change.** Mountains 18 → 11 and hills 13 → 9, so mountains stay the strongest relief. Leave the other caps alone.

**Evidence.** In mountain cores at the start view:

- Busyness is 51.5% with a median cell step of 10.1 L\*. Ref-2's range is 26.4% and 3.9.
- L\* runs from 16.7 to 51.2 (10th to 90th percentile). The reference's lit face is 47 and its shade 32.

The re-bake (`mtn.cjs`, `mtn-results.json`):

| | Start view | Ref-2's zoom |
|---|---|---|
| Mountains, busyness / median step | 51.5% / 10.1 → 27.8% / 7.4 | 38.7% / 8.0 → 20.0% / 5.8 |
| Hills, busyness | 8.6% → 5.2% | |

- **Readers still pass** (patch / province accuracy):
  - lightness 0.960 / 1.00
  - texture 0.899 / 0.983
  - unexplored 0.909 / 1.00
  - deutan texture 0.887 / 0.967 (build: 0.899 / 0.967)
- **Look:** `shots/cmp-mountain-caps.png` still reads as a ridged range, but calmer.
- **No low-pass:** I also tried a low-passed hillshade for mountains. It smooths ref-2's zoom to 5%, so I don't recommend it.

**Accept when** `reliefNatural(true)` passes and mountain cores at the start view are at most 30% busy.

### 3. The wild massifs are the loudest objects on the map

**Where.** `rlWildTexel` in `p58b-relief-shared.js`. Pass a `natural` flag from `rlNaturalGen` so Clear and the Terrain mode stay identical to v4.

**Change (natural only).**

- **Granite:** `q = rlSmooth(0.12, 1.0, s)` → `q = 0.2 + 0.6 * rlSmooth(0.12, 1.0, s)`.
- **Snow weight:** × 0.7.
- **Detail:** add full-resolution ridged detail (`rlRidged`, about 3 units, ±3 L\*). Today the shading is the half-resolution `sS`, bilinear, magnified 2.8× at Near, so the Greyteeth is a blurred photo at ref-2's zoom (`shots/c06-ref-dpr2-greyteeth.png`, evidence sheet panel B).

**Evidence.**

- **Today's massifs:** 52–54% busy, median step 10–11. Inside the contour, up to 7% of pixels are over L\* 70 (3–7% depending on the massif and the view). Together with the 3 px ink and light rim, each massif reads as a cut-out tile.
- **The runtime re-bake** (granite and snow change only): busyness drops from 51.6% to 31.8% at the start view and from 54.3% to 36.5% at ref-2's zoom (`shots/cmp-wild-calm.png`). `reliefSnow()` and `reliefLines()` still pass.
- **The contour and rim stay.** They carry the "impassable" signal and the colour-blind check.

### 4. Binary thresholds draw pixel blocks, staircase edges and ink-blot copses

**Where.**

- `rlNaturalGen` in `p58m-materials.js`: three hard `if (noise > t) mixc(...)` speck rules.
- `rlNatCoverGen` in `p58n-covers.js`: the canopy and copse class is one bit per texel.

**Change.**

1. **Soft specks:**
   - **Hills:** `if (rlVN(Tr, u/1.6, v/1.6) > 0.78) mixc(M.hills.rock, ph*0.7)` → `mixc(M.hills.rock, ph * 0.35 * clamp((n − 0.72) / 0.18))`.
   - **Wasteland scrub:** factor 0.5, ramp 0.72–0.90.
   - **Swamp shrubs:** factor 0.6, ramp 0.66–0.84.
2. **Feathered canopy edges, presentation only.**
   - Keep `cls` exactly as it is, so N4 and N11 are untouched.
   - Store the canopy score margin `score − CP.thr` in a new 8-bit plane, `out.nat.cmar`.
   - In the colour pass, blend crown over ground with α = clamp(0.5 + margin / 0.08).
   - Thin the edge crowns by their crown hash (keep a crown when `rlH2c(h) < α`), so wood and copse edges break into single crowns, as the references' do.
   - Hedges and parcel edges: use `F.seam` as a distance for a 1-texel antialiased edge.

**Evidence.**

- **What it looks like now** (`evidence-sheet.png` panel A, `shots/c09`, `c07`, `c10`): at Near and dpr 2 a texel is 3.2 device px.
  - Copses and wood edges step like pixel art.
  - Hill rock specks are pale rectangles.
  - Hedgerows are isolated dark pixels.
- **Plains with their hard dark copses** are 11.4% busy at ref-2's zoom, against 2.7% for ref-2's open land.
- **The soft-speck runtime re-bake** (`speck.cjs`, `shots/cmp-specks.png`) removes the block noise.
  - Readers improve: texture 0.911 → 0.933, lightness 0.964 → 0.975.
  - Snow still passes.

**Accept when:**

- the cover share (N4) is identical before and after;
- the readers pass;
- Near shots at dpr 2 show no texel staircase.

### 5. Hamlets: a pale box cluster in every province from Mid on

**Where.**

- `RL_P.hamletDpx` / `hamletFadePx` in `p58a-relief-base.js`.
- `rlHamlet`, `rlHouse` and `rlMuted` in `p62-relief-figures.js`.

**Change.**

1. **Later appearance:** `hamletDpx` 100 → 220 and `hamletFadePx` 130 → 280, so hamlets appear only deep in Near. The population tier stays in Shift, the numbers layer and the cards.
2. **Real roofs:** in `rlHouse`, pitched roofs with two slopes (west lit +6 L\*, east shade −10 L\*) and a 1 px ridge line.
3. **Muting that keeps the material:** in `rlMuted`, move only L\* toward the ground and keep the material's a\* and b\* (chroma floor about 0.04). Roofs then read as thatch or slate, not grey card.
4. **Layout:** in `rlHamlet`, two short offset rows along a lane instead of the golden-angle spiral, which reads as a stack of tiles.

**Evidence.**

- **How many:** 44 hamlets on screen at 108 px a province, 29 at 131 px (`shots/d01-mid075.png`) and 16 at ref-2's zoom.
- **What they look like:** flat grey and cream parallelograms (evidence sheet panel B). The red kit's grey roofs with lit windows (`shots/c10`) show the better direction.
- **Cost:** removing them at ref-2's zoom lowers busyness from 22.8 to 21.2 and the province-scale patch edges from 21.5 to 19.9.
- **The reference** has no settlements on the land other than walled towns on bases.

**Accept when** `reliefSeats()` still passes (≤ 2.5 Mid, ≤ 4 Near).

### 6. Every province is named at Near

**Where.**

- `rlLayout` in `p61-relief-pieces.js`: `allNames = RL_NUMBERS.on || RL_NUMBERS.shift || near`.
- The `RAW.zoom` text in `renderModes` (`p80d-rest.js`).

**Change.**

- `allNames = … || Dpx >= RL_P.allNamesDpx`, with `allNamesDpx = 320`.
- From 180 to 320 px a province, name only capitals, Wellsprings, towns (`rlIsTown`), the selection and the planned path. Hover and link names stay live.
- Update the "Near: every name" copy to match.

**Evidence.**

- At ref-2's zoom (`Dpx` 200), `reliefLayout()` names 29 of the 29 provinces in view (100%) (`shots/a11-ref-zoom-centre.png`).
- Ref-2 has no text on the land.
- The labels add 1.0 point of busyness at that zoom.

### 7. Near has no detail layer, so the land is a soft smear under crisp pieces

**Where.** `rlRenderStatic` in `p59-relief-draw.js`, as a new `rlNearDetail(g)` called after the land blit.

**Change.** When `cam.s * RB.TX * dpr > 1.5`, draw a chunked, cached detail pass, as the design asks ("Near: crowns of 5 to 9 px … the live crowns of map-relief §3.5"):

- **Canopy:** on canopy texels (`cls` 2, 9 and 10), seeded crowns of 2–4 px using the §4 crown recipe (dome, lit upper-left).
- **Open land:** on other land, a tiled ±3 L\* grain per cover class.

**Evidence.**

- The live crowns are not built (no code for them).
- The bake is 1.28 texels per unit, so at 0.85× the maximum zoom a texel is 1.6 CSS px (3.2 device px at dpr 2).
- Plains and hills at Near are a blurred gradient beside sharp figures and towns (`shots/a2-near-Kharnath.png`, `c07`, `c09`).

**Accept when** the Near pan frame time stays within the v4 budget (`m.panStats()`).

### 8. Farmland bends like rubber and checks like brick

**Where.** `RL_NAT.field` and `RL_NAT.mat.farmland` in `p58n-covers.js`; the furrow term in `rlNaturalGen`.

**Change.**

- **Straighter rows:** `bend` 1.6 → 0.5.
- **Narrower tone spread:** ripe 53 → 51, straw 56 → 52, ploughed 43 → 45, fallow 49 → 48; green stays 46. Hue still separates the crops.
- **Lighter furrows:** amplitude ±1.6 → ±1.0 L\*.
- **Hedges:** antialiased, as in fix 4.

**Evidence.**

- **At Near** the strips wave in step across the whole province (`shots/c10-near-dpr2-farm.png`, `a2-near-Ashmoor.png`).
- **At Mid** the 13 L\* spread between neighbouring parcels reads as a brick wall (`shots/a01-start.png`, lower left).
- **Measured:** farmland cores are 12.5% busy at ref-2's zoom (west), against 2.7% for ref-2's open land.

**Accept when** the farmland readers pass. They rely on structure, not tone spread.

### 9. Ponds and lakes look like stickers

**Where.** `rlDrawWater` in `p59b-relief-lines.js`.

**Change.**

- **Lit bank:** `rgba(236,240,226,.42)` at 1.2·RLK → `.18` at 0.6·RLK.
- **Shaded bank:** `.38` → `.25`.
- **Ripples:** at Mid and Far only, alpha .22 → .12.

**Evidence.**

- At Near the lit bank is a light outline ring (`shots/a2-near-Thornwick.png`, `c08`).
- Ponds in woods sit 18–21 L\* above the canopy (water 37–40 on forest at 19), so they are the brightest spots in a wood. Ref-2's water is darker than the land around it.

**Accept when** the water colour and every water-distinctness rule (design §2.3) are unchanged.

### 10. The cliff face reads as a brick wall

**Where.** `rlRim` in `p59a-relief-rim.js` (the face loop).

**Change.**

- **Joints become fractures:** delete the in-stratum joints (the `jx` / `jf` term that subtracts 6 L\*). Replace them with a few fractures that cross 2–3 strata at 60–75°, 60–140 units apart.
- **Ledge highlight:** 7 → 3.5 L\*, on every other stratum.
- **Strata values:** spread ±3.5 → ±2.5.
- **Face height:** ±15% along the outline (higher under hills and mountains), so the face is not one uniform band.

**Evidence.**

- The vertical stripes are fixed: stripe index 0.153 at the start view and 0.113 at the minimum zoom; light streaks 0.
- But horizontal strata with short joints 18–48 units apart (19–51 px at the start view) now read as masonry courses (evidence sheet panel C, `shots/c03`, `c12`).

**Accept when** `reliefCliff()` has stripe index ≤ 0.2 and light streaks 0.

### 11. Bug: at Far the move's day chip covers province names

**Where.** `rlThread` in `p63-relief-labels.js`.

**Change.**

- Add the wild-name boxes and the alert ribbon to `avoid`.
- When no candidate is free, try the one-line short chip `${days}d` before the fallback "first spot on the model". "Around the Ashspine" is already in the move toast.
- At Far, add candidates at twice the chip height.
- Add a check: no day chip overlaps a placed name.

**Evidence.**

- After Varo's move to Ashvale, wheel out to Far: the two-line "8d / around the Ashspine" chip covers "Halevale" and touches "Ashvale" (evidence sheet panel D, `shots/a08-wheel-out-table.png`, `a09-min.png`).
- `reliefHoverChips()` does not catch this: it only tests hover names.

### 12. On-land chrome and copy

**Where.**

- `rlLayout`'s `tryPlace` in `p61-relief-pieces.js`.
- `renderModes` in `p80d-rest.js`.
- `p30b-provtip.js` line 25.

**Change.**

1. **Names avoid the alert ribbon.** `tryPlace` rejects spots under the ribbon (reuse `rlChipRoom().clearOfRibbon`), so names step aside the way chips already do.
2. **The Ownership caption** ("Owner rails and a glow…") shows for 4 s after a mode change, and on hover of the mode button. It is not a permanent panel over the land's right edge. The Terrain mode keeps its legend.
3. **Unexplored copy.** "Unexplored: not yet painted." becomes "Unexplored: the land is known; what lives here is not." In Natural, unexplored land is drawn.

**Evidence.**

- "Halevale" sits under the alert icons at scale 0.75 (`shots/d01-mid075.png`).
- At 1280×720 the ribbon sits on the Ashspine (`shots/c20-1280x720.png`).
- The caption box is on the land in every Ownership shot.
- The fogged hover card says "not yet painted" (`shots/e01-hover-fog.png`).

## The verifier's earlier defects, re-checked

- **Neutral hairlines:** 0 under the floor (minimum 2.80 / 2.95 / 2.81 at the start view, ref-2's zoom and Near).
- **Passable mountains near snow:** 0 texels.
- **Hamlet muting:** 95th-percentile contrast 2.26 at 131 px and 3.52 at ref-2's zoom.
- **Hovered names over day chips:** 0 names over a chip.
- **Small windows:** 1280×720 and 1024×768 start at Mid, scale 0.548, 96 px a province.
- **Swamp internal keyline:** 3.47 minimum.
- **`p61-relief-pieces.js` split:** 244 lines.
- **Cliff:** the stripes are gone, but the face now reads as masonry (fix 10).

The parts over 400 lines (`p50`, `p52`, `p55`, `p61a`) are unchanged v3 parts.
