# Natural map, pass 2: art direction and QA critique

2026-10-23. This critique covers the pass-2 build at `visual-v4/map/game-screen-v4.html`. I edited nothing. Nothing in
`/home/user/Fluid-Magic-` was touched, and no part, build file or published page was changed.

Part files are in `visual-v4/map/parts/`. My work is in `visual-v4/natural/pass2/ad/`:
- shots are in `shots/` (a* Natural, b* modes, c* Clear, d* 1280×720, e* phone, f* 1920×1080, g* dpr 2);
- probes are in `tools/` (`adprobe.js`, `probe.cjs`, `readers.cjs`, `misc*.cjs`, `hfref.py`);
- numbers are in `out/`;
- the evidence sheet is `sheet-evidence.png`.

I compared against owner references 2, 3 and 4 for direction only.

I ran 7 shot sessions (Natural, Natural modes, Clear, 1280×720, 390×844, 1920×1080 and dpr 2) plus probe sessions.
Every session that logged page errors had 0, which covers all 7 shot sessions and 6 of the probe sessions.

## Verdict

**Faint neutral lines: right. No fix needed.** I measured how much each line changes the pixel under it (line on
against line off, the best value within ±1.5 px), as a median per edge:

| View | Edges | p10 / p50 / p90 |
|---|---|---|
| Start | 84 | 1.22 / 1.25 / 1.27:1 |
| Reference zoom | 41 | 1.20 / 1.23 / 1.27:1 |
| Far | 73 | 1.22 / 1.25 / 1.31:1 |

No edge is under 1.10 (lost) and none is over 1.5 (a grid). Hover and selection bring a province's own lines up to the
floor, and the result is legible (shots a16 to a19). Realm rails sit clearly on top. The hover card names the terrain.

**The land is calmer and more continuous than Clear.** I measured the share of the land's lightness edges that sit
within 4 px of a province border, divided by the area share of that band:

| View | Natural | Clear |
|---|---|---|
| Start | 1.29 | 1.76 |
| Reference zoom | 1.31 | 2.05 |
| Far | 1.20 | 1.62 |

**Three things still work against "clean, natural, the model on the table":**

1. **Far.** The new Far relief redraws every province polygon, which makes the board read as a quilt. It also breaks the
   reader floor.
2. **The wilds.** They still read as foil-textured grey plaques in a dark-and-cream frame. That frame uses the same
   dark-plus-light keyline grammar as a realm rail. Inside the frame there is a band of passable-looking land, and at
   close zoom the wilds are out of focus.
3. **Smaller views.** The phone at Far and the right-edge controls column still hide or misplace names. That is the
   verifier's defect 3, which is only fixed for the start view.

## Fixes, in priority order

### 1. The Far relief draws the province grid and drops the Far readers under their floor

**Where:** `p59c-relief-detail.js`, `rlFarRaster()`.

**Change:**
- **(a) Remove the per-province mean smoothly.** In the last loop, the line
  `128 + off[k] - (RL_WILDK[o] ? 0 : FP.neutral * sum[o] / cnt[o])` subtracts a constant per province, which leaves a step
  at every border. Instead:
  - fill `mu[k] = sum[o] / cnt[o]` for land texels (0 for wilds);
  - blur it with `rlBoxBlur(mu, QW, QH, Math.max(1, Math.round(0.3 * RLD * TX / 4)), 2)`;
  - subtract the blurred field.
- **(b) Let only the land that rises carry relief.** Multiply the lit/shade term (not the cast shadow) by each texel's
  relief weight:
  - for land, `Math.max(0.25, Math.min(1, Σ_t RB.wch[t][k] · RL_NAT.cap[t] / RL_NAT.cap[4]))`. `RB.wch` is the
    quarter-resolution terrain weight, on the same grid as `h4`;
  - for peaks, 1.
  - The result: hills, mountains and the ranges stand up, while farmland and swamp lie flat.

**Evidence:**
- The raster as drawn shows every polygon as a step (sheet panel 1; `out/far-raster-2x.png`):
  - the per-province mean removed runs from −48.8 to +7.8 grey levels (p10 −25.6, p90 4.2);
  - the step this makes across shared edges has p50 8.1, p90 23.3 and max 44.5 grey levels;
  - 66 of 132 edges step by more than 8.
- On screen at the least zoom (53.7 px a province), the same-terrain step across a border is larger with the relief:
  - at 3 px from the border, 2.5 L\* with the relief against 1.9 without;
  - at 12 px, 4.8 against 3.4.
- Lightness readers at the least zoom fall under the design floors (patch 0.90, province 0.95):

  | | Patch | Province | Unexplored patch / province |
  |---|---|---|---|
  | With the relief | **0.845** | 0.983 (Stagmarch, plains read swamp) | 0.836 / 0.983 |
  | Without it | 0.956 | 1.0 | 0.880 / 0.967 |

**Done when:**
- the raster's edge step p90 is 4 grey levels or less;
- the same-terrain step at the least zoom is within 0.2 L\* of the no-relief values;
- the readers at the least zoom reach patch ≥ 0.90, province ≥ 0.95 and unexplored patch ≥ 0.88;
- by eye at Far, the Ashspine, the Greyteeth and the hills stand up, and the farmland does not look lumpy.

### 2. The range's interior reads as crumpled foil: too fine, too grey, too contrasty for its size

**Where:** `p58w-natural-wilds.js`, `RL_NW`, `rlNatWildGen()` (the softening step) and `rlNatWildTexel()`.

**Change:**
- **(a) Soften the shading heights the way the passable mountains already are.** In `rlNatWildGen`, the step
  `rlBoxBlur(hX, HW, HH, RL_NW.soft, 1)` runs with `soft: 0`, so it does nothing. Set `soft: 2`, then mix
  `hX = hX + 0.65 · (hS − hX)`, as `RL_NAT.mtnSoft` does. The code comment there already says "the crests read as crumpled
  foil".
- **(b) Use fewer, longer crests:**
  - `peaks.ridgeU` 30 → 48;
  - `peaks.ridge2A` 0.04 → 0;
  - `gully` 4.5 → 1.5;
  - `detail` 1.2 → 0.6.
- **(c) Darken the shade faces and valleys:**
  - `Lshade` 22 → 13;
  - `castL` 8 → 12.
  - Keep `Lcap` as it is: the "no texel over the passable rock plus 2.5" rule holds.

**Evidence:** fine-detail energy is the mean |L\* − box5(L\*)|, measured in cores 8 px in from every outline, on the
land frame. The ref-2 and ref-4 figures are scaled to a 1440 px game area.

| | Peaks wild | Passable mountains | Forest | Other land | Peaks against other land |
|---|---|---|---|---|---|
| Start | 3.17 | 1.64 | 1.45 | 1.25 | **2.5×** |
| Reference zoom | 1.73 | 0.60 | 1.19 | 0.84 | **2.1×** |
| Owner reference 2 | 1.66 (mountains) | — | — | 1.62 | 1.0× |
| Owner reference 4 | 1.75 (mountains) | — | — | 1.34 | 1.3× |

The peaks' lightness is also too grey: L\* p5/p50/p95 is 14.5/30.0/52.2 at the start view, against 4.1/22.4/47.0 for
ref-2's range. The references read as dark masses with lit crests, and ours as mid-grey foil (sheet panel 2; shots a11
and a06).

**Done when:**
- the peaks against other land are 1.4× or less at the start and reference zoom;
- the peaks against the passable mountains are 1.6× or less;
- the peaks' L\* p5 is 9 or less and p50 is 23 or less;
- `reliefWildLook()` reports overCap 0;
- the verifier's core busyness is at or under ref-2's mountains (about 31 / 8; now 38.5 / 8.8).

### 3. The wild reads as a fenced plaque: land inside the fence, and the frame carries all of the impassable read

**Where:** `p58w-natural-wilds.js`, `rlNatWildTexel()` and `RL_NW.peaks.footD`; `p59b-relief-lines.js`,
`rlDrawWildContours()`.

**Change:**
- **(a) On peaks, stop showing the land inside the footprint.**
  - Set `fade = 0` for `lt === 7`, so the land mirrored across the outline is not drawn on the range.
  - Set `footD` from [0.07, 0.24] to [0.02, 0.07], so the scree apron (`M.scree`, lit by the light) starts at the
    contour and the rock rises within about 0.1 D.
  - The mere keeps its mirror (see fix 8).
- **(b) In Natural Ownership only, make the light rim conditional.**
  - Keep the 3 px ink on the whole outline, so the footprint is still drawn exactly.
  - Draw the light rim only on outline edges whose own ground pair fails 20 / 12 directly. Use the same samples as
    `rlWildEdgeCheck`: W is 6 to 9 px inside and G is 6 to 9.5 px outside, read from `RB.L.natural.img`. Compute this
    once per bake per edge and cache it on `RB.lookVer`.
  - Clear, the Terrain mode and the data modes stay exactly as they are.
  - If the owner's approval of the rim is read as binding in Natural too, there is a fallback: on edges that pass
    directly, draw the rim at 1.5 px and alpha 0.5.

**Evidence:**
- **The impassable read rests on the frame alone.** `reliefWildEdge()` passes directly (wild ground against land) on only
  27 of 305 samples at the start view and 2 of 434 at the reference zoom. Every other sample passes only through the
  ink-and-rim pair, because the ground 6 to 9 px inside the outline is the mirrored land.
- **The frame competes with ownership.**
  - The frame is ink #1C1A17 plus rim #E9E4D8 at 0.85, a contrast of about 15:1. It uses the same dark-plus-light
    keyline grammar as a realm rail (keyDark, banner, keyLight), but without the banner. The three wilds therefore read
    as three neutral "realms" (shot a01).
  - Every other neutral line is now 1.25:1.
- **The band reads as passable land.** At the reference zoom, the olive band inside the fence is 15 to 60 px wide
  (sheet panel 2).

**Done when:**
- `reliefWildEdge()` passes directly on at least half of its samples at the start and reference zoom, with 0 fails in
  every view at dpr 1 and dpr 2;
- the rim is drawn on 40% of the outline length or less;
- the Clear and Terrain sameness checks are unchanged.

### 4. At Near the wilds are out of focus next to crisp land

**Where:** `p59c-relief-detail.js`, `rlNearDetail()`.

**Change:** in the pixel loop, the line `const t = rb + colT[i], c = cls[t]; if (c === 255) { u32[o] = 0; continue; }`
skips every wild texel. Map wild texels to a class:
`const c = cls[t] !== 255 ? cls[t] : RB.LT[t] === 7 ? 4 : 255`. This gives the peaks the rock grain tile (`RL_NDG[4]`),
with `a = 0`. Open mere water stays smooth. `cls` in `p58n-covers.js` stays as it is, so the N4 cover test is not
touched.

**Evidence:**
- On the natural bake, every wild texel has class 255: 28,210 peaks samples and 6,071 mere samples.
- At the closest zoom, the wild's fine detail falls below the land's: 0.93× for the Ashspine and 0.85× for the mere.
  At the start view the same ratio is 4.4×.
- The rock looks like a smeared, magnified texture beside crisp crowns and hamlets (sheet panel 3; shots a12 and g02 at
  dpr 2).
- Fix 3a also removes the blurred olive halo of mirrored land inside the contour.

**Done when:**
- the wild-against-land ratio at the closest zoom is 1.0 or more for the Ashspine;
- shots a12 and g02 show no smear;
- `RL_ND.ms` stays within 10% of now.

### 5. A capital loses its name under the right-edge controls

This is the verifier's defect 3. The pass-2 fix only holds at the start view.

**Where:** `p61-relief-pieces.js`, `rlLayout()`, `tryPlace`.

**Change:**
- Reject any spot whose box leaves the canvas or the view band: in layout px, x from 2 − cam.x to cw − 2 − cam.x, and
  y from v.t − cam.y to v.b − cam.y.
- When `ax + tw / 2` reaches the controls box, try the left-of-seat spot `[-(tw / 2 + st.r + 4), -(ay - st.y)]` before
  the right one.
- A forced capital takes the left spot, never `[ax, ay]` under the column.

**Evidence:** at `m.zoomTo(1.142, 'Ashmoor')`, the enemy capital Deepmoss sits at x 1322, under the Near and Fit chips
(the column is at x 1316 to 1350). Its name was placed at x 1363 to 1423, beyond the canvas edge (about x 1358), so it
is not visible (sheet panel 5; shots a06 and x-deepmoss-ref).

**Done when:** across a pan sweep at scales 1.0 and 1.142 (40 camera centres or more), 0 labels have a box outside the
canvas or view band, and 0 are under the controls.

### 6. The phone at Far: names wider than the wilds, labels off the model, chips misplaced

**Where:**
- `p60a-camera.js`, `computeScales()`;
- `p61-relief-pieces.js`, `rlLayout()`, the wild-name loop;
- `p63-relief-labels.js`, `rlArrow()`.

**Change:**
- **(a) Floor the phone's least zoom at Fit:** `if (app.classList.contains('phone')) minScale = Math.max(minScale, fitScale)`.
  At 390×844 that is 0.152 (26.6 px a province) instead of 0.100 (17.6 px, with the model at 160×100 px).
- **(b) Drop wild names that do not fit.** Drop a wild's name when its box is longer than 1.1× the wild's screen extent
  along it. Also replace the fallback `?? spots[0]` with a skip, so the name is dropped rather than placed over pieces.
  The hover card names the wild.
- **(c) Keep the arrow's chip off pieces.** In `rlArrow`, try the `far` ring against `avoid` (pieces and names) before
  accepting a spot that only clears names.

**Evidence:** at 390×844 (sheet panel 4; shots e02 and e03):

| | Fit | Least zoom |
|---|---|---|
| Wild names overflow their wild by | 25 / 56 / 34 px | 30 / 65 / 50 px |
| Labels off the model | Deepmoss | Deepmoss, Kharnath |
| Chips | the arrow's "4d" chip is under Varo's piece | the path's last chip "8d" is off the model |

**Done when:** at Fit and the least zoom on 390×844:
- wild-name overflow is 0;
- 0 labels are off the model;
- every chip's text is visible on the model.

### 7. The model's edge reads as a tray, not as a cliff

**Where:**
- `p59-relief-draw.js`, `rlRenderStatic()`, the worn lip:
  `gO.strokeStyle = 'rgba(233,228,216,.5)'; gO.lineWidth = 3 * px; modelPath(gO); gO.stroke();`
- `p59a-relief-rim.js`, `rlRim()`, the face, in the `nat` branch only.

**Change:**
- **(a) Draw the lip only where the light falls.** In Natural, stroke the lip only along the north and west sides, where
  the outward normal faces the light (dot with −RL_LIGHT.xy > 0.2). Fade it over the NE and SW corners. Along the south
  and east crests, draw a 1 px dark crest instead (rgba(20,16,14,.45)).
- **(b) Give the face more value structure:**
  - the lit ledge on every other stratum, 3.5 → 8 L\*;
  - stratum values, ±2.5 → ±4.5;
  - the fractures' lit west lip, +1.5 → +5 L\*;
  - the foot, darkened toward L\* 6.
  - Keep the strata horizontal (AD fix 10).
  - Clear and the Terrain mode stay as they are.

**Evidence:**
- A uniform cream line runs all the way round the rounded rectangle (shots a02, a04 and crop-far-edge-se).
- The south face is a flat dark band:

  | | L\* p5 / p50 / p95 |
  |---|---|
  | Our face, least zoom | 10.3 / 17.1 / 22.8 |
  | Our face, 69 px a province | 10.4 / 18.1 / 23.3 |
  | Owner reference 4 cliff | 0.6 / 7.0 / 45.0 |
  | Owner reference 3 cliff | 1.5 / 12.3 / 54.8 |

**Done when:**
- the face's L\* p5-to-p95 spread at the least zoom is 25 or more (now 12.5);
- the lip shows on the north and west only.

### 8. The mere is the polygon shrunk, ringed by swamp inside the fence, with white stick icons on it

**Where:** `p58w-natural-wilds.js`, `RL_NW.mere` and `rlSculptWildsNat()`.

**Change:**
- **(a) Bring the shore to the contour:**
  - `shoreD` [0.05, 0.17] → [0.01, 0.10];
  - `shoreU` 20 → 34.
  - The shore then touches the contour along part of its length, and the bays and spits are at the lake's scale.
- **(b) Remove the bone-white snags.** Today these are strokes in rgba(196,190,176,.7), 6 to 8 units tall. At most, draw
  2 in dark wood (rgba(52,44,34,.7)).
- **(c) Quieten the ripples:** alpha .16 → .08 and .3 → .12.

**Evidence:**
- The shoreline follows the polygon about 0.05 to 0.17 D in. That leaves 10 to 34 px of marsh, at the reference zoom,
  that looks like the swamp outside (shots a13 and a14).
- At the closest zoom, the snags read as white "Y" icons, and they are the brightest marks on the lake (shot a14).

**Done when:**
- the water comes within 0.02 D of the contour on 30% of the outline or more;
- no snag lighter than the water + 10 L\* remains;
- `reliefWildEdge()` reports 0 fails;
- `reliefWildLook()` reports 0 texels outside the cells.

## Not in the list (for the record)

- **Realm tint (owner question 1, design-final §16).** With neutral lines now faint, an owned interior reads like
  unowned land. Owner references 2 and 3 tint owned land. This is worth re-asking with this build; it is not a fix.
- **The Mid reader is under the province floor, from before this pass.** It reads 0.931 against the 0.95 floor:
  Duskholt (wasteland read farmland or swamp) and Karwick (hills read plains).
- **Swamp pools are within the design.** They cover 19.8% of swamp texels (the design allows 15 to 20%).
- **The view's size changes how much Far relief you see.** At 1920×1080 the least zoom is 73 px a province, so the
  view never reaches Far and the relief is at about 0.45 strength.
- **At 1280×720, the start view puts the alerts ribbon over the Ashspine's frame.**
- **Checks I did not repeat.** I did not re-check Painted (v3) sameness or determinism; I took the builder's hashes as
  given.
