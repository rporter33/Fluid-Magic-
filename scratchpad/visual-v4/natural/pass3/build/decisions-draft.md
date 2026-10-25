
## Pass 3 decisions (2026-10-24, the wilds in the natural view; flagged for the owner)

Pass 3 rebuilt the wilds in the Natural look (Ownership mode). Three prototypes were built: a continuous relief, a sculpted massif
and an open spill. Three judges then scored them, on art direction, on player readability and on the rules. All three judges ranked
the **massif first**: art 6/10 (relief 5, open 3), player 8/10 (relief 7, open 4), rules 6/10 (relief 5, open 3). The mockup
(`map/parts/`, built by `map/build.sh`) now ships the massif with the grafts the judges asked for. Clear, the Terrain mode, the data
modes and Painted (v3) are unchanged.

**Owner flag.** Three of the changes below alter an approved rule. Each is backed by at least two judges, is built as the default,
and is listed under "Rule changes" for the owner to confirm or reverse.

### What was built

| Graft (asked by) | What the build does | Where |
|---|---|---|
| Base: the massif (all three) | One range along a spine on the wild's long axis. Its half-width follows the room the cells give it. A crest with peaks and saddles, spurs across the axis, faceted ridges at the fine scale. Each wild has its own raster at 2× the bake's resolution; the bake's wild texels are its 2×2 means. | `p58x-massif-gen.js`, `p58y-massif-colour.js` |
| The land climbs into the range (art 1) | Height is 0 on the outline and rises over 0.16–0.38 D, seeded per stretch. The rock line comes from ridges, slope and noise, so green valleys run up between the spurs. | `RL_MS.peaks.footD`, `RL_MSC.rockK` |
| The foothills are the neighbouring land itself (art 2, player 2–3, rules 4) | The land's own seeded covers (p58n) and materials (p58m) run on the wild's texels. Each texel uses the province of its nearest outline edge, with no mirror. Woods (×0.5), fields (×0.55) and copses (×0.5) thin as the land climbs, at e / 0.55. | `RL_MS.climb`, `out.msCov`, `out.msNb` |
| Faceted ridges up close, no grain on rock (art 3, player 1) | Ridged fine detail: 8.5 units, 2 octaves, ×0.06 of the height. The Near detail draws no grain on rock texels. | `RL_MS.peaks.fine*`, `p59c` |
| Calm when zoomed out (art 4) | The start view's and least zoom's mips pull wild lightness toward its local mean (×0.92 / ×0.82 over 0.035 D). They lift the deepest shade (floor L\* 16 / 18) and hold snow down (knee L\* 66 / 60). | `RL_MSM`, `rlMsMips` |
| Snow as caps, not streaks (player 1) | Snow sits on the top 2.5–10% of each range's blurred heights (quantiles 0.90–0.975), broken by ridges and noise, with less on steep faces. Peaks and saddles vary across the axis too (`crestQ` 0.6); along the axis alone they drew ruler-straight snow bars on the Greyteeth. | `RL_MS.snowQ`, `RL_MS.peaks.crestQ` |
| The mere at the map's water (art 7, player 3, rules 4) | Mid-depth is the map's water (#14615B, L\* 37). A shelf of L\* 50 runs at the shore; the water darkens to L\* 28 at the centre over 0.07–0.8 of the depth (rendered median L\* 34.5). The fringe is the continued land, 7 L\* darker toward the shore, with reed beds. | `RL_MS.mere`, `RL_MSC.water` |
| Decide the edge once per zoom, from data (rules 1, player 4) | The colour-blind wild edge test's decision is made from the sources the composite draws at that zoom: the fine raster at Near, otherwise the bake or the mips, plus wash, tint, glow, haze and fog. It is cached per zoom and look state, so a pan never changes it and nothing is read back from the screen. | `p59x-quiet-edge.js` |
| Margins, and hover decided live (rules 2) | Pair and stone margins are ×1.2; the ink's is ×1.1 (see "Departures"). A hovered or selected neighbour's edges are re-decided with its tint and drawn live. | `RL_QE`, `rlDrawWildHover` |
| Robust to the check's own sampling (found by the seed runs, below) | The check takes the median of 4 pixels inside and 5 outside. Where the ground changes sharply near the line (a shaded foot, a forest edge at a corner), a sub-pixel shift moves that median by one place. So the decision also tests the pair and the ink against each median's neighbours, over pixels from 5.5 to 9.5 px in and 5.5 to 10 px out. The ink is tested against every median the check may take, not against the darkest pixel: a darker but more saturated colour can stand further from black. The band is at least 2.5 device px, so one pixel across it is always wholly stone. The decision's two memos are pure functions of their keys: before, one load in three drew a different start view. | `rlQuietEdgeMap`, `rlQeBand` |
| Memory and dead code (rules 3) | The 2× working planes are freed after the bake. Pass 2's natural wild generator, apron, mirror and sculpt are deleted (`p58w` is 14 lines). | `rlMsFree`, `p58w` |
| Footprint guard, interaction checks, sweep (rules 4–5) | Three new checks in `window.__mock`. **Sweep:** the edge test over 30 seeded cameras, each wild's closest zoom and sub-pixel pans. **Footprint:** a hash of every land texel before and after the wilds' pass. **Interaction:** hit test, cards, path refusal. All three also run on seeds 7 and 31 and on a four-wild plan. | `p89b-pass3-checks.js` |

### Rule changes (each backed by two or more judges; built as the default; owner to confirm)

1. **Snow brighter than the cap.** Snow may pass pass 2's brightness cap (L\* 54.85), up to L\* 80, on at most 8% of a range's
   texels. Measured: 5.0% of range texels are snow, 2.3% are over the cap, and the brightest is L\* 75.4. Rock stays under the cap
   (0 texels over). Backed by the art judge (the only owner decision it asked for) and the player judge (snow brings back the
   wilds' reserved cue). The rules judge listed it as an owner question and would default to keeping the cap.
2. **The neighbouring land continues inside the wild's cells, up to the range's foot.** This reverses pass-2 critique fix 3a
   (rock starts at the outline). Backed by the art judge (graft 2), the player judge (grafts 2–3) and the rules judge (graft 4,
   open's fringe without the mirror). Every wild texel still lies in its cells; the footprint guard holds (0 land texels written by
   the wilds' pass).
3. **The cream rim (#E9E4D8) gives way to a quiet stone band.** The band sits just inside the ink. It is 2 CSS px wide but never
   under 2.5 device px, so at dpr 1 it is 2.5 px. It takes the land side's hue (×0.6), at the least lightness that reaches 20 / 12
   × 1.2 against both sides. It is drawn only on the runs where the colour-blind wild edge test needs a light element. Backed by the art judge (ship the per-stretch quiet edge), the rules judge (graft 1, a solved
   land-tinted stone) and the player judge (the lightest frame of the three). The 20 / 12 test itself is unchanged and stays the
   gate.

A consequence of rule 2, not a separate rule: land shadows are recomputed with the wilds at the land's height, so no wild casts
shade onto the land outside it. 12,422 half-resolution land texels next to the wilds are lighter than in pass 2.

### Not adopted

- **The 2 px ink** (art for; the rules judge asked the owner, default 3 px). The ink stays 3 px.
- **The spill** (all three judges against; it reverses an approved rule).
- **Fog in the continued land** (art for; rules against: "never tinted, faded, hatched, dimmed or fogged" is approved).
- **Brightening the wild's contour on hover, and a no-go wash** (player only). The ink is approved as never tinted. Hovering a wild
  still names it in its card; the path preview refuses it with "Impassable: the Ashspine" and the toast.
- **A data-mode copy of the new raster** (art only). Clear, the Terrain mode and the data modes keep the v4 granite massif and
  mere, so a wild's drawn shape still changes when switching from Natural to a data mode.
- **The light element as lit scree at the foot** (art graft 5). A lighter lower-slope skirt was tried and taken out: it read as
  the mat the judges disliked. The light element stays the quiet stone band.

### Departures from what the judges asked, with the reason

- **The light band covers more than 40% of the outline** (art: 40% or less at the start view). Measured at dpr 1: 0.62 at the
  start view, 0.78–0.80 when zoomed out, 0.50–0.54 from Mid to the closest zoom. At dpr 2 the figures are within 0.05. The colour-blind test compares the
  ground 6–9 px inside with the ground 6–9 px outside. With the land continued, both sides are often the same dark ground (forest,
  swamp, shaded hills, L\* 20–33). Against that ground no dark ink reaches 20 / 12, so only a lighter element passes. The art judge
  named the cause itself ("continuing the land under the line will raise how often the test needs a light element"). The share
  could be cut only by giving up the continued land, the test's margin or the test itself.
- **The ink's margin is ×1.1, not ×1.2** (rules). At ×1.2 the light band covers 3–16 points more of the outline (start view
  0.62 → 0.74, Mid 0.53 → 0.65, Near 0.52 → 0.67). The pair and stone margins are ×1.2. The sweep's smallest margin is reported
  below.
- **The ink is #000000, not v4's #0B0A09** (3 px either way). Black reaches 20 / 12 against more land, saving 2–12 points of light
  band (start view 0.70 → 0.62, Near 0.65 → 0.52). The massif prototype, whose ink the art judge asked to ship, also used black.
  Flagged in case the owner treats the colour as part of the approved contour.
- **The ground step across the line is 6–11 CIE76, not 4 or less** (art). Start view: Ashspine 7.9, Greyteeth 11.4, mere 11.1;
  Mid to the closest zoom: 5.9–7.1. The step comes from the climb (the range's relief and the thinning covers 6–12 px in), not from
  the lower-slope thinning term: with that term off (`climb.depthK` 0) the step changes by 0.3 at most and the light band by 0.6
  points at most. That term is a candidate for removal.
- **The mere against the swamp's peat pools is ΔE76 18.4 / 11.2 / 11.4 / 19.5** (normal, protan, deutan, tritan; the medians of
  the mere's open water and of the pools as drawn at the start view). The player judge asked for 20 in every vision. Pass 2 measures
  12.6 / 3.2 / 5.6 / 12.2 and the massif prototype 12.5 / 6.8 / 9.0 / 13.1 by the same method; the player's own method gave higher
  numbers for every build. Reaching 20 under protan needs the lake at about L\* 45, the pale, milky shelf the art judge rejected in
  the open prototype.
- **Busyness at the start view: Greyteeth 36.6 / 8.3** (core cells jumping more than 10 / 20 L\*), against the reference's 31–35 /
  8–9. The Ashspine is 31.3 / 6.2. At the least zoom both are 34.7–35.3 / 5.9–6.7.

### Measured on the final build (md5 `0ae9067f…`, 1440×900)

**The light band** is the share of the wilds' outline in view drawn with the quiet stone band, as decided by the page (all three
wilds):

| View (px a province) | dpr 1 | dpr 2 |
|---|---|---|
| Start (96) | 0.62 | 0.64 |
| Far (60) / least zoom (54) | 0.78 / 0.80 | 0.83 |
| Mid (175) / reference zoom (200) | 0.53 / 0.50 | 0.53 / 0.51 |
| Near (336) / closest (420) | 0.54 / 0.52 | 0.54 / 0.52 |

**The art judge's measures** (its own tools, rerun on this build at dpr 1). "Lighter line" is its "any lighter inner line" share.
"Step" is the CIE76 ground step 6–12 px out against in. "Busy" is the share of core 6 px cells jumping more than 10 / 20 L\*:

| View | Wild | Lighter line | L\* ≥ 65 rim | Step | Busy | Fine detail vs land | Range L\* p5 / p50 / p95 |
|---|---|---|---|---|---|---|---|
| Start | Ashspine | 0.71 | 0.16 | 7.9 | 31.3 / 6.2 | 1.88 | 16.4 / 27.4 / 47.3 |
| Start | Greyteeth | 0.87 | 0.25 | 11.4 | 36.6 / 8.3 | 1.97 | 16.5 / 25.7 / 46.2 |
| Start | Still Mere | 0.56 | 0.10 | 11.2 | – | 0.94 | 26.4 / 34.1 / 40.7 |
| Least zoom | Ashspine / Greyteeth | 0.96 / 0.97 | 0.40 / 0.43 | 18.9 / 18.2 | 34.7 / 6.7, 35.3 / 5.9 | 2.07 / 2.18 | – |
| Mid | Ashspine | 0.61 | 0.17 | 5.9 | 27.9 / 4.6 | 2.28 | 16.0 / 27.6 / 47.2 |
| Near | Ashspine / Greyteeth | 0.61 / 0.81 | 0.18 / 0.25 | 6.8 / 7.1 | 23.0 / 3.2, 19.0 / 2.2 | 1.45 / 1.02 | – |
| Closest | Ashspine | 0.66 | 0.13 | 6.7 | 13.8 / 1.2 | 1.15 | 15.2 / 27.9 / 47.9 |

For comparison, the art judge measured the massif prototype at 55–71% "lighter line" at the start view, with core busyness 48 / 14
and shade at p5 L\* 9–12; the reference is 31–35 / 8–9.

**Other measures:**

- **Snow:** 5.0% of range texels; 2.3% are over the cap; the brightest is L\* 75.4. No rock texel is over the cap.
- **The mere:** rendered median L\* 34.5. Against the peat pools, ΔE76 18.4 / 11.2 / 11.4 / 19.5 (normal, protan, deutan, tritan).
- **Footprint:** the land hash is `cbd877c9` before and after the wilds' pass, and 0 wild texels lie outside their cells. 12,422
  half-resolution land texels are lighter, because the land's shadows are recomputed without the ranges.

### Checks (every look and mode, dpr 1 and 2)

All runs are on build `0ae9067f…`. Every session had 0 page errors.

| Check | Result |
|---|---|
| The page's checks, Natural, Clear and Terrain mode, dpr 1 (18 views) and dpr 2 (7) | Colour-blind wild edge: 0 failing of 4,700 and 1,758 samples in each look. Realm rails (band rule): 0 failing. Lines, seats, layout, names, hit, chips: pass. |
| Data modes (7 modes × 3 views × 2 looks × 2 densities) | Wild edge in Ownership: 0 failing. The failing data-mode keyline rows (2 / 6 / 3 / 6) are the same rows, with the same counts, on the pass-2 page. |
| Inherited, unchanged from pass 2 (same values on the pass-2 page) | Natural dpr 1: the hover hairline Ashmoor/Elmwick at 2.14 / 2.29, and the Mid terrain reader at 0.928 / 0.931. |
| Sweep, main map, dpr 1 / dpr 2 (33 cameras plus 15 pan positions each) | 0 failing of 16,904 samples. Smallest margin 1.097 / 1.112; 1 / 0 samples under 1.10. A pan never changed the decision. |
| Seed 7 / seed 31 / four-wild plan (11 / 11 / 14 views, then the sweep) | 0 failing in the views or the sweep. Smallest margins 1.069 / 1.001 / 1.071. Wild look, footprint and interaction all pass. |
| Hover: the real pointer on every wild neighbour in view (66 hovers over 5 views) | 0 hovers with a failing sample. The pass-2 page, by the same test: 15 of 66. |
| Footprint and interaction | Land hash `cbd877c9` before and after. 30 / 30 edges name the wild inside and the neighbour's terrain outside, and refuse paths. 3 / 3 cards say Impassable. |
| Determinism | Natural, 3 fresh loads: 6 views and the bake hashes identical. Clear and Terrain, 2 loads each: identical. History: the start and Mid frames are the same before and after other zooms, hovers and selections have filled the decision's memos. Rebake: identical (natural `1603612350`, clear `4243484565`). |
| Painted (v3) | 10 views, settled frames, 2 loads each: identical to the pass-2 page and to the page before the natural view. The plain determinism probe still differs at ref and near between loads, as it does on pass 2, because it does not wait for the sprites to settle. |
| Clear and the Terrain mode | Pixel-identical to the pass-2 page at 5 views each (0 changed pixels), so their colour distances (20 / 12 under simulation) are unchanged. |

**One limit:** where the decision leaves a sample to a neighbouring edge's line at a corner, the margin is thinner. The smallest
margin found on any map, 1.001 on seed 31 at the Greyteeth/Karcrag corner, is one of these.

### Performance (shared machine; timings are noisy)

- **Bake:** the wilds' steps take 2.0 s (generate 1.1 s, colour 0.9 s), against pass 2's 1.1 s. The whole natural bake used 14.2 s of
  CPU over 17.8 s wall, against 11.0 s / 14.5 s for pass 2, measured while other checks ran.
- **Memory:** the 2× working planes, about 45 MB, are freed after the bake. The fine colour images, about 10 MB, are kept for the Near
  decision.
- **The edge decision:** once per zoom, 25–378 ms (median 153 ms) over the checked views. It is never recomputed on a pan.
- **Pan out of the cached frame,** median of 12 (max): pass 3 251 ms (598), pass 2 242 ms (359), massif prototype 408 ms (1,088).
  **Zoom change,** median: 863 / 948 / 838 ms.

### Owner questions (defaults in bold; the build follows the defaults)

1. Snow brighter than the cap, on at most 8% of a range, up to L\* 80? **Yes** (art and player); the rules judge's default was no.
2. The light band on about half of each wild's outline (two-thirds at the start view). It is the price of the land continuing under
   the line while the colour-blind test holds with a margin. **Keep it**, or choose one of: rock up to the outline on dark-ground
   edges (pass 2's look there; not built); or a different colour-blind rule for wild edges. Smaller margins are not an option:
   at ×1.0 everywhere the band falls 8–12 points (start view 0.53, Mid 0.42), but the test already fails at the closest zoom
   (4 samples, worst 0.98).
3. Black ink (#000000) instead of #0B0A09? **Yes.**
4. Brighten a wild's contour on hover (the player judge's ask)? **No**, because the approved ink is never tinted. It needs the
   owner's word.
