# Palette A/B: the art director's critique

2026-10-22. Judged: the built mockup (`ui-mockup/game-screen.html`) with `?palette=painted` and with the default (Bright),
against `handdrawn-design/reference-map.png`, `handdrawn-design/final.md` (rulings, §10.2 question 6),
`handdrawn-design/critique.md` and `palette-ab/decision.md`.

**How I checked.**
- **Shots:** I shot both palettes myself at every zoom band, with the deutan, tritan and protan previews, all five data modes, fog,
  the wilds and the phone width. They are in `palette-ab/review/shots/`, with comparisons in `palette-ab/review/crops/`.
- **Colour math:** the repo's own `tests/content/colorMath.ts` and `src/content/colors.ts`, copied unchanged (diff-checked against the
  repo) and run with `npx tsx` from the repo.
- **Fix previews:** every fix below was applied **at runtime** in the built page through `__mock.ev`. The override is in
  `palette-ab/review/override/fixes.js`. The page's own checks were re-run on each preview.
- **What I did not touch:** no part file was edited, and the repo is untouched (`git status` clean).
- **Checking the preview method:** writing B's fills at runtime gives the same canvas hash as a fresh `?palette=painted` load
  (3177617018 both times).

## Verdict

**At the start zoom, Painted still reads as a board, only a quieter one.** It is quieter in hue but not in value or warmth. Measured
inside the neatline at the start view, against the reference scaled to the same 671 px width (`review/data/valstats.json`):

| | Reference | Bright | Painted |
|---|---|---|---|
| Warm pixels (hue 20 to 100, C\* > 8) | 83% | 35% | **29%** |
| Pixels lighter than L\* 80 | 0.1% | 15.4% | **16.0%** |
| Pixels darker than L\* 30 | 12% | 23.4% | **28.9%** |
| L\* spread at province scale (patch σ) | 7.3 | 14.7 | **16.1** |
| Mean C\* | 26.0 | 25.0 | 17.8 |

- **The reference is not muted.** It is warm and mid-valued. Painted lowered the chroma but kept a 24 to 87 L\* range, and it added
  three cool or grey notes the reference does not have: ice-blue Mountains, slate Swamp and mauve Wasteland.
  - The near-black Forest (L\* 23.7) and near-white Plains (L\* 86.5) are the two largest terrains on the sheet: 24 of 60 provinces.

**Fills cannot get closer under docs/09.** This is the main finding, and it changes where the effort goes.
- **The reference itself would fail the rule.** Its own terrain means, sampled from its forest, plains, fields, barrens, peaks, marsh
  and hills, sit 3.5 ΔE apart at the closest pair (2.8 under tritanopia). Their mean pair difference is 11.1 (`review/search/refpairs.ts`).
- **Every legal palette is a patchwork.** Every palette that passes the 20 / 12 rule has a mean pair difference of 32 or more.
- **Six searches found no way round it.** I ran six seeded constrained searches with the decision's own search and constraints
  (`review/search/runs/`):
  - three toward a warm, mid-valued target;
  - three toward "B with warm-grey Mountains, tan Wasteland, a darker Plains and a lighter Forest".
- **What they returned:** in every run Mountains stays at least 14.5 ΔE from a warm grey. Forest stays at L\* 25 or below. Or
  Farmland goes orange (#E3A018, C\* about 70).
- **What follows:** the start view will stay a patchwork of fills. The hand-drawn feel has to come from drawing that covers the
  fill. The decision said this too; the numbers above show the fills cannot add more.

**At the reference's own scale the drawing covers too little ground.** The reference spans the map in 1,536 px; that is s = 0.957
in the mockup (`review/samescale-vs-reference.png`).
- **Flat fill:** 46.7 to 52.7% of Painted's map pixels sit in flat fill (7 × 7 L\* σ under 2). The reference has 1.2%.
- **Forests are mostly bare.** At Mid, Forest crowns cover 6 to 11% of each Forest province (`__mock.ev`, `canopyFor`).
  - The canopy fill rate the v3 critique asked for is met: 49% of the free area.
  - But the free area is only about 22% of the province, after the 14 u border inset, the track and brook corridors, two to four
    glades, the clearing and the zones.
  - So at the start zoom, 13 of 60 provinces read as flat dark green with stitched track dots.
- **What reads as drawn at Near:** Farmland (field patchwork, windmills), Hills (ranges) and the settlements.
- **What reads flat or digital:**
  - Forest: bare dark fill.
  - Plains: near-white, with copses drawn as white puffballs.
  - Mountains: an ice-blue sheet with small grey teeth.
  - Swamp: 71% flat inside.

**Readability holds in both palettes** (`palette-ab/checks-painted.txt` and my own runs):
- **Hit test and labels:** 0 wrong of 200; 90% of names placed; 0 names over tokens; a stable redraw.
- **Colour pairs:** no Far full-decoration pair under 20 / 12 (Painted's closest are 21.8 normal and 13.3 protan).
- **Ownership bands:** clear in every preview. Ember on Painted Farmland is 7.4 direct under deuteranopia, so it reads through its
  dark keyline (55.7 / 52.8 / 57.3 / 55.3). It is visible in `crops/cvd-sw-bands.png`, but it is the weakest band on the sheet
  under protan and deutan.
- **Wild areas:** granite and mere stay far from every fill (20.6 / 13.0 and 24.1 / 13.9). The mere stays far darker than the slate
  Swamp.
- **Data modes:** all five are identical between the palettes (largest channel difference 3).
- **Page errors:** none.

**Low contrast that Painted made worse:**
- **Passable peaks on Mountains:** the lit face is 1.11:1 (Bright 1.41).
- **Water on Mountains:** the pond is 1.14:1, and 3.6 ΔE under tritanopia. The brook is 1.34:1 (`crops/painted-plains-mtn-2x.png`).

## Fixes, in priority order

Every fix is a drawing change, and each works in both palettes. Fixes 1 to 5 together, previewed in the page, give these results
(`review/data/fixes-metrics.json`, `review/preview/preview2.json`):

- **Flatness:** flat pixels at s = 0.957 fall from 46.7% to 38.5%. Pixels darker than L\* 30 at the start view fall from 28.9% to 26.6%.
- **Checks unchanged:**
  - the `?paintcheck` paint table is identical (Hills 1.86 / 2.0);
  - Far pairs are unchanged (21.8 / 13.3 Painted, 22.2 / 13.9 Bright);
  - hit 0 / 200, labels 90%, names over tokens 0, zones 0 hits on label, second line or seat, stable redraw;
  - tracks 4.20 / 1.70.

See `review/start-proposed-vs-reference.png`, `review/samescale-proposed-vs-reference.png` and `review/crops/fixes-*.png`.

### 1. Give the forest canopy the room it was meant to have (13 of 60 provinces)

**Evidence.**
- **Coverage:** crowns cover 6 to 11% of a Forest province at Mid and 13 to 21% at Near. The density check reports covMean 0.11 at
  Mid and 0.17 at Near.
- **Brightness:** the crown's lit face is only 1.96:1 on Painted Forest.
- **Result:** at the start zoom a crown is 4 to 5 px across, and lit, shade and outline average back to the fill.
  - 28.9% of the start view is darker than L\* 30; the reference has 12%.
  - See `crops/start-forest-3x.png` and `crops/fixes-1.4-Stagmoor.png`.

**Change.**
- **`p55-paint.js`, `CANOPY_KEEP`:** `{ mid: 0.55, near: 0.77 }` → `{ mid: 1, near: 1 }`. Near must stay at least Mid, so crossing
  into Near still only adds crowns.
- **`p55-paint.js`, `canopyAll`:**
  - `tries`: `* 14` → `* 24`.
  - The crowd test: `0.75 * (q.r + r)` → `0.6 * (q.r + r)`.
  - Glades:
    - `ng = 2 + Math.floor(R() * 3)` → `ng = 1 + Math.floor(R() * 2)`;
    - `r = (0.08 + 0.04 * R()) * D` → `r = (0.06 + 0.03 * R()) * D`.
  - The border inset: `distToEdge(cv, x, vy) - 6 < B_U + 2 * U` → `distToEdge(cv, x, vy) - 6 < (prov[i].owner ? B_U : 0) + 2 * U`.
    "Owned" is already in the paint key (H10).
  - `stampBlocked(i, x, vy, r)` → `canopyBlocked(i, x, vy, r)`.
- **`p54-feat.js`, new `canopyBlocked`** (next to `stampBlocked`). Tracks get half a crown, because the dots are live over the bake.
  Brooks, ponds and marks get more room than today, because a dense canopy otherwise overlaps them (seen in the preview without the
  margins):
  ```js
  function canopyBlocked(i, x, y, r) {
    const F = feats(), blk = F.block.get(i); if (!blk) return false; const wt = F.water.get(i);
    if (F.tracks.some((h) => h.s === i && distToPolyline(h.pts, x, y) < 0.5 * r + U)) return true;
    if (wt && wt.brook && distToPolyline(wt.brook, x, y) < r + 4 * U) return true;
    if (blk.pond && Math.hypot(x - blk.pond.x, (y - blk.pond.y) / 0.75) < 1.25 * blk.pond.r + r + 2 * U) return true; // the pond is drawn up to 1.23 r
    return blk.marks.some(([mx, my, mr]) => Math.hypot(x - mx, y - my) < mr + r + 3 * U);
  }
  ```
- **`p52-stamps.js`, `paletteP`:** on Forest at Mid and Near, the lit face is the fill + 22 L\* instead of + 12. Far keeps its masses:
  ```js
  const F = faces(f), lit = terr[i] === 'forest' && band !== 'far' ? mix(shadeL(f, 22), '#F6D9A0', 0.12) : F.lit;
  ```
  and return `lit` in place of `F.lit`.

**Measured in the preview.**
- **Coverage:** crowns now cover 33% of a Forest province at Mid and 41% at Near (covMean 0.33 and 0.41).
- **Item budget (§5.4):**
  - Mid: 24.7 items per average province, at most 28.1 (budget 30).
  - Near: 30.1, at most 38.4 (budget 60).
  - The largest province reaches 30 clumps at Mid.
- **Lit face:** 2.68:1 on Painted Forest (#6A8056) and 2.61:1 on Bright.
- **Stamps in an empty token zone:** 818 → 1,551 hits. They are allowed by design.
- **Far:** the Far pairs and the paint check are unchanged.

**Cost.** Crowns per average Forest province go from 26 to 118 at Mid and from 54 to 163 at Near.
- Bake times swung from 31 to 46 ms mean for Near, run to run, on this shared machine.
- The as-built Near bake already measured 30 to 34 ms here, against a 25 ms budget.
- Re-measure §7.2 on a quiet machine before you accept this; I did not tune to these numbers.

### 2. Draw the Plains trees in tree colours, not as white puffballs

**Evidence.** The copses (2 to 4 crowns) and the Near hedgerow crowns take the Plains fill's faces.
- **Painted:** the lit face is #F6FADA (L\* 97.2), lighter than the paper, at 1.32:1 on the fill.
- **Bright:** #E5F1BC (L\* 93.1).
- They read as cotton or cloud (`crops/painted-plains-mtn-2x.png`, Redbarrow), and they sit in the pale family H6 reserves for
  Thornwood's meadow.

**Change.**
- **`p52-stamps.js`, after `paletteP`:**
  ```js
  function treeP(P) { const tf = shadeL(TERRAIN.forest.fill, 20); return { ...P, ...faces(tf), trunk: shadeL(TERRAIN.forest.fill, -6), dark: false }; }
  ```
- **`p55-paint.js`, `stampItemP`, case `'plains'`:** `drawClump(g, c, P)` → `drawClump(g, c, treeP(P))`. `P.line` passes through,
  so fog line art is unchanged.
- **`p55-paint.js`, `groundP`, the Plains hedgerow crowns at Near:** `drawClump(g, [...], Pp)` → `drawClump(g, [...], treeP(Pp))`.

**Measured.**
- **Painted:** lit #81976B (L\* 59.8), shade #2B4429. That is 2.25:1 and ΔE 21.1 / 20.3 / 20.6 / 21.2 on Painted Plains.
- **Bright:** 1.67:1 and ΔE 12.9.

Keep a copse at 2 to 4 crowns, never one: a single green tree is Thornwood's great-tree motif. Re-run `?silhouettes`.

### 3. Put grass on Plains, Hills and Swamp

**Evidence.**
- **Flat interiors:** at the start view, the share of interior pixels within ±3 L\* of the province median is:
  - Swamp 71%;
  - Wasteland 61%;
  - Hills 59%;
  - Plains 47%.
- **Today's ground marks:**
  - Plains: a stipple of 1.1-unit dots, under a pixel at the start zoom.
  - Hills: nothing (`case 'hills': break`).
  - Swamp: horizontal streaks.
- **The reference** fills the ground between objects with short grass strokes.

**Change, in `p55-paint.js` `groundP`.**
- Add after `rx`/`ry`, on its own seed so the hedgerows and infields do not move:
  ```js
  const Rg = rngFor('grass:12:' + i), gx = () => bx0 + Rg() * (bx1 - bx0), gy = () => by0 + Rg() * (by1 - by0);
  const tufts = (n, dL, a) => { g.strokeStyle = rgba(shadeL(f, dL), a); g.lineWidth = 0.9 * PX; g.lineCap = 'round'; g.beginPath();
    for (let m = 0; m < n; m++) { const x = gx(), y = gy(), L = (2.2 + 1.4 * Rg()) * U, a0 = -Math.PI / 2 + (Rg() - 0.5) * 0.3;
      for (const da of [-0.3, 0, 0.3]) { const l = da ? 0.75 * L : L; g.moveTo(x, y); g.lineTo(x + Math.cos(a0 + da) * l, y + Math.sin(a0 + da) * l); } }
    g.stroke(); g.lineCap = 'butt'; };
  ```
- **Plains:** keep the 120 · k stipple at Far only. At Mid and Near, replace it with `tufts(Math.round(600 * k), -20, 0.5)`.
- **Hills:** `case 'hills': if (band !== 'far') tufts(Math.round(400 * k), 12, 0.45); break;`.
- **Swamp:** first line of the case, `if (band !== 'far') tufts(Math.round(300 * k), 14, 0.45);`.

**Why the shapes are safe.** Every stroke is within 26° of vertical, so at least 19° from the reserved 45°. They are strokes, not
free pale dots, grey stipple or dot rings. Ground marks are outside the paint check, and Far is left alone.

**Measured.** With grass alone, flat pixels at s = 0.957 fall from 46.7% to 41.5%. The Far pairs and the paint check are unchanged.

### 4. Paint passable peaks from the Mountains fill

**Evidence.** `stampItemP` paints passable peaks in literal #B4C1C6 / #6E7F86, tuned to the approved fill.
- **Painted:** the lit face is 1.11:1 (ΔE 8.1) and the shade 2.03:1. The peaks vanish into the ice-blue ground, and Mountains reads as
  a frozen lake (`crops/fixes-2.04-Brambarrow.png`).
- **Bright:** 1.41:1 and 1.60:1.

**Change, in `p55-paint.js` `stampItemP`, case `'mountains'`:**
```js
const cols = { lit: '#B4C1C6', shade: '#6E7F86', ink: INK, lw: P.lw };
```
becomes
```js
const F = faces(P.fill), cols = { lit: F.lit, shade: mix(shadeL(P.fill, -26), '#3A4466', 0.14), ink: INK, lw: P.lw };
```

- Leave `p50-deco.js`'s `peakStamp` call alone; it is Hand: v2's path.
- The silhouette sheet in `p86-checks.js` keeps its literal greys.

**Measured.**

| | Lit face | Shade |
|---|---|---|
| Painted | #C6D9E8, 1.42:1 | #566D85, 2.61:1 |
| Bright | 1.49:1 | 2.61:1 |

The Far pairs are unchanged in both palettes.

### 5. Let water on Mountains keep its banks

**Evidence.** Water must stay pale (H5), and on Painted Mountains (#9FB8D0) it nearly disappears:
- **Pond (#A6C7CC):** 1.14:1, with ΔE 10.1 / 7.4 / 6.5 / 3.6 under normal, protan, deutan and tritan vision.
- **Brook (#BCD6D9):** 1.34:1, with ΔE 11.8 / 10.5 / 10.3 / 7.4.
- **On Bright:** 1.45:1 for the pond and 1.71:1 for the brook.
- **Today's banks:** on light land the upper brook bank is #35535A at .55 and 0.8 band px.

**Change, in `p54-feat.js` `drawWater`:**
- **The brook bank:**
  ```js
  if (dark) { g.strokeStyle = 'rgba(232,220,194,.55)'; g.stroke(hi); } else { g.lineWidth = 0.8 * PX; g.strokeStyle = 'rgba(53,83,90,.55)'; g.stroke(hi); }
  ```
  becomes
  ```js
  if (dark) { g.strokeStyle = 'rgba(232,220,194,.55)'; g.stroke(hi); } else if (terr[i] === 'mountains') { g.strokeStyle = 'rgba(53,83,90,.8)'; g.stroke(hi); } else { g.lineWidth = 0.8 * PX; g.strokeStyle = 'rgba(53,83,90,.55)'; g.stroke(hi); }
  ```
- **The pond bank:** in its `inkPath` call, `true, 0.8 * PX, 'rgba(53,83,90,.7)')` becomes
  ```js
  true, terr[i] === 'mountains' ? 1.2 * PX : 0.8 * PX, terr[i] === 'mountains' ? 'rgba(53,83,90,.9)' : 'rgba(53,83,90,.7)')
  ```

**Measured.** The bank ink #35535A is 4.04:1 on Painted Mountains and 3.17:1 on Bright. The course reads in `crops/fixes-2.04-Brambarrow.png`.

## What I would not do

- **More fill tuning.** See the verdict: the reference's own terrain means fail docs/09 by a factor of six. Six constrained searches
  found nothing warmer that keeps 20 / 12.
- **The deferred paint-strength A/B** (paper tooth ±20 → ±28, Plains granulation .5, Farmland .45). Measured alone in the page, it
  leaves flat pixels at 46.6% (as built 46.7%), so it changes nothing measurable. It raises the Hills paint deviation from 1.86 to
  1.93 of the 2.0 budget.

## For the owner question (Land: Bright or Painted)

**On this evidence, Painted does not bring the start view closer to the reference.**
- It is cooler (29% warm pixels; Bright 35%, reference 83%) and wider in value.
- Its Mountains read as water or ice, and its Plains as blank paper.
- What it gains is hue harmony: no teal marsh and no yellow fields.

Fixes 1 to 5 help both palettes about equally. Flat pixels at s = 0.957 fall to 38.5% Painted and 38.3% Bright. At the start view,
pixels darker than L\* 30 fall to 26.6% Painted and 21.9% Bright.

**My recommendation:** keep Bright as the default, land fixes 1 to 5, and show the owner the A/B again on the fixed drawing.

## Outside this list (seen, not new, both palettes)

- **The Ownership legend over the map's right edge.** The "Ownership · Owner bands over the painted land." legend sits on the map's
  right edge at all times. It clips "Thornwick" at the start view and hides "Deepmoss" at Mid. This is approved chrome.
- **Region names cut by a wild's rim.** "The Sallow Marsh" is cut by the Still Mere's rim. `placeRegionNames` tests glyph centres
  for wild cells, not glyph boxes.
- **Out of sight is invisible.** It is a 10% grey (ΔE 0.55 to 1.61 per terrain; Painted Plains 0.65, Swamp 0.55). This is a fog-rule
  (R18) question, not a palette one.
- **Tracks.** At the start zoom they measure 4.17 dot peak and 1.70 line average on Painted (3.46 / 1.66 Bright). That is still under
  the 1.80 line average needed to retire the footpath.

## Files

All under `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/palette-ab/`:

- **This file:** `critique.md`.
- **Evidence images:**
  - `review/samescale-vs-reference.png` and `review/samescale-proposed-vs-reference.png`;
  - `review/start-proposed-vs-reference.png`;
  - `review/crops/`, which holds:
    - `pb-*.png`: Painted over Bright at every band;
    - `cvd-*.png` and `fixes-cvd-*.png`;
    - `painted-plains-mtn-2x.png`, `start-forest-3x.png` and `region-names-5x.png`;
    - `fixes-*.png`.
- **Shots:**
  - `review/shots/`: both palettes at Far, Mid, Near, the start view, CVD, modes 2 to 6, fog, wilds and phone;
  - `review/preview/`: the runtime previews.
- **Data:**
  - `review/data/`: `valstats.json`, `flat*.json`, `provstats.json`, `edgeprof.json`, `ref-terrain-means.json` and `fixes-metrics.json`;
  - `review/preview/preview2.json`: the page checks for each preview.
- **Tools:**
  - `review/tools/`: `adshots.cjs`, `preview2.cjs`, `provstats.cjs`, `edgeprof.cjs`, `samescale.cjs`, `valstats.py` and `flat.py`;
  - `review/override/fixes.js`: the runtime override behind every preview;
  - `review/search/`: `ad.ts`, `fog.ts`, `fixnums.ts`, `refpairs.ts` and `bank.ts`, plus the six search runs in `runs/`. The colour math
    there is the repo's, copied unchanged.
