# Judge 2: readability, feasibility and performance

Lens: does the map stay a strategy instrument at every zoom, for every viewer, in every mode, and can
it be built within the canvas and Pixi budgets, seeded and stable?

**Score: 7 / 10.** A careful spec: the fills stay law, every new color is measured with the repo's
own math, the band rule holds on the painted extremes, decoration fades in data modes and dims while
targeting, and every new mark is derived from `provinceView` or public map data. Its weakness is
scale. Nearly every size and contrast is specified at the top of the Mid band (180 px median
province), but the game opens near the bottom of Mid (77 px median, s = 0.44 of the top), and the
game bakes Mid at 1.25 px per unit, not at the band top. At the zoom players see most, the tracks
nearly vanish and the new name size overflows the provinces. Region names sit over the bands, and the
opaque paint bake churns with real-time fog. All of this can be fixed with parameters and one
layering decision. None of it needs the design to change direction.

## Method and evidence

Scripts are in `handdrawn-design/judge2-calc/` and use `tests/content/colorMath.ts`,
`src/content/colors.ts` and `src/mapgen/generate.ts` from the repo:

| File | What it measures |
|---|---|
| `colors.ts` → `colors.out` | granulation and paper as L\* swings (gamma-space soft-light, as canvas composites); the band rule on every Ownership fill state (raw, haze, out of sight, ash 10%, moss 6%) with the design's exact amplitudes; terrain pairs across states; border vs painted edge; tracks seen below the band top; region names over borders and bands; wild names over their own peaks; other new marks |
| `pairs2.ts` → `pairs2.out` | terrain-pair extremes across states for several mottle settings, including the realistic blotch peak (radial alpha 0.55) |
| `edges.ts` → `edges.out` | shared-edge lengths of every neighbor pair, seeds 1 to 30 × Small, Medium, Large × 2 and 4 nations (39,571 pairs) |
| `labels.cjs` → `labels.out` | headless Chromium 1194 on `game-screen-v2.html` at its start zoom, with Alegreya and Alegreya Sans woff2 (downloaded to `judge2-fonts/`): v2 name widths against the spec's |
| `footpath.ts` → `footpath.out` | v2's Mountains footpath (R34) against the tracks that replace it, at the band top and at the start zoom |
| `perf.cjs` on v2 (existing script) | baseline: pan p95 16.7 ms at fit, Near and lean-back; static rebuild 158 ms average at fit, 72 ms overall |

## What holds (verified)

- **Band rule on the paint, every state.** 2,695 banner × paint pairs (11 banners × 7 terrains × 5
  Ownership states × 7 paint variants including blooms and the edge pool): 2,210 direct, 485 through
  the keyline, **0 fail**. Closest direct pass: #B5D69C on out-of-sight Farmland, 23.7 / 12.0. The
  design's own check used ±3 on Forest where §1.4 says ±4. The rerun at ±4 also passes.
- **Granulation and paper are small.** Measured as canvas composites them, granulation moves L\* by
  −3.7/+2.9 at most (Wasteland) and paper by ±2. Mottle stays the largest term.
- **Lettering contrast.** Name ink on the paper halo is ≥ 10.58:1. The approved light-on-dark A/B is
  ≥ 11.71:1.
- **Brooks and ponds** are kept off the bands by the inset, and dark water stays a wild. The H5
  reasoning is sound.
- **The noisy-edge construction is safe.** The Red Blob quad keeps each edge inside its quad.
  Chaikin and Douglas–Peucker keep points inside the hull, so edges cannot cross, and one polyline
  feeds the fill, border, band, hover and hit test. Every neighbor pair shares exact vertices
  (0 unmatched in 39,571), so the `EDGE` build by vertex matching works.
- **Decoration discipline.** The data-mode fade, the 60% targeting dim, flat boxes and "hovering
  changes nothing" are all correct.
- **Bake budgets are plausible** in software for Far and Mid at load: lean 7 ms per province at Mid
  on the bench, plus perhaps 30 to 50% for tracks, water, clumps and shadows, gives about 0.85 s for
  Medium. The init work (edges, tracks, water, regions, tiles) fits 120 ms.

## Findings

### 1. The start zoom is where the spec is weakest (sizes are set at the band top)

`BAND_RES.mid` is 180 / MED_DIAM, so "1 px" in the spec is one screen pixel at a 180 px median
province. The mockup opens at s = 0.44 of that (77 px median, `labels.out`), and Mid starts at
s = 0.389. The game (final §3.8) bakes Mid at 1.25 px per unit × DPR, about a 113 px median at DPR 1,
so the spec's px units do not even describe the game's texture.

- **Tracks** (1.6 px dots every 3.5 px, `footpath.out`, `colors.out` §E): at the start zoom the dots
  are 0.67 px every 1.47 px. Line-average contrast is **1.28 to 1.62:1** across terrains, and the
  dot peak on Mountains is 2.41:1. §1.6's "≥ 3 everywhere" holds only at the band top.
- **They replace the passable Mountains' footpath (R34),** which was the second channel separating
  passable Mountains from the peaks wilds. At the start zoom that footpath measures 1.80:1 average
  and 3.00:1 dash peak, so **tracks are a regression for the impassable-terrain read** the owner
  asked to be "noticeable".
- **Information-bearing marks become specks** at the start zoom: camp domes 3.2 × 2.6 → 1.4 × 1.1 px
  (four tents cannot be counted), spring stones r 4.5 → 2.0 px, brook banks 0.7 → 0.3 px.

### 2. Place names: the new size does not fit at the start zoom

v2 ramps names with zoom (`labelFs`: 10 px at the start zoom). The spec fixes Mid at 13 px Alegreya
(14 px for capitals) with a 3.5 px halo. Measured on v2's 60 provinces at its start zoom
(`labels.out`):

| | v2 | spec |
|---|---|---|
| mean name width | 42.8 px | 54.0 px (1.26×) |
| names wider than 80% of the province at the label's height | 4 | **26** |
| names wider than the province | 0 | **6** (Brambarrow 72 px in 62 px, Thornbrook 67 in 60) |

Expect heavy culling, or names crossing borders and bands. The label test's "≥ 90% of provinces keep
a visible name at the start zoom" is at risk.

### 3. Region names sit on top of the instrument at Far

Region names span three or more provinces by construction, so they always cross borders, and at Far
they cross the ownership bands, the main thing Far is for. §2.1 puts them in the label layer, above
the bands. Measured (`colors.out` §F):

- Dark region ink at 85% over the border ink: **1.02:1**, so the letters vanish wherever they cross a
  border.
- Over dark banners: #3D2B4F 1.13, #8F0F04 1.51, #5C488E 1.78, #00674B 1.97.
- Light ink over pale banners: #F3E6B8 1.02, #51DDFC 1.24, #B5D69C 1.26.
- On Wasteland's edge pool: 2.97:1, under the 3:1 the spec claims.

The priority is also contradictory: §3.9 says "below every other label", but Step 3 and the docs/07
text queue region names **before own provinces**, so at Far a flavor name would cull the player's own
province names. v2's Far view (`v2-lean.png`) already labels nearly every province, so there is no
free space to spend.

### 4. Tracks can be read as something else in two geometric cases

- **Along a border.** The research rule "never run along one [a border]" (research-techniques §8)
  was dropped from §3.2. The only constraint left is "stay inside the noisy polygon". A seat near one
  edge with a neighbor's midpoint far away gives a dotted line parallel to another border, and a
  dotted line on a border means fog.
- **Short shared edges.** `MAPGEN.minSharedEdge` is 0.001 √area, so near-point contacts are
  neighbors. Over 180 maps (`edges.out`), **3.7% of neighbor pairs (1,470) share an edge under
  0.1 √area** (6 px at the start zoom, 16 px at the Mid top), 1.9% under 4 units, and **17.6% of
  provinces have such a neighbor**. Each of these tracks crosses at a junction of three or four
  borders, where a dotted line through a corner reads as connecting the diagonal pair as well.
- **No fallback.** Once the control offset reaches zero, §3.2 has none, yet `tracks.test.ts` demands
  "no sample in a third province".

### 5. The paint bake depends on armies and on fog, which change every day

- **Tokens.** `exclusions(i, band)` sizes the token box by `tokensAt(i)`, and `lookKey` includes
  `tokensAt(i)`. Under the paint, token boxes are painted flat, so **every army arrival or departure
  re-bakes the province's paint** (Mid, Far and the Near tiles it touches). The flat rectangle also
  appears and disappears with the armies, and the blotches pop.
- **Fog and land look.** D1 is opaque and bakes `f` = the Ownership fill (haze, out-of-sight
  desaturation, land-look wash). The clock runs daily, so visibility flips continuously as armies
  move. Each flip re-bakes the province, and until the bake lands the opaque paint hides the live
  fill, so the province shows a **stale fog state**: information, not decoration. v2 re-baked on fog
  too, but its decoration was transparent stamps over a live fill, so v2 was never stale.

### 6. The terrain-pair claim was measured on raw fills only

§1.6 and §5.5 say terrain pairs keep "≥ 11.2 at blotch extremes under every deficiency". Across the
approved Ownership states (`pairs2.out`):

| Case | Normal | CVD (closest pair) |
|---|---|---|
| no paint (the approved states) | 20.5 | 12.2 |
| the design at full M | 18.3 | 8.6 (Hills/haze vs Wasteland/moss6) |
| a realistic single-blotch peak (0.55 × M, the radial gradient's alpha) | 19.6 | **10.0** |
| two same-sign blotches overlapping (0.8 × M) | 19.0 | 9.3 |

This is texture, not the fill (the means stay the fills, and the approved ±8 L\* ground textures
already deviate more at a fine scale), so it does not break docs/09. But the design states a number
that is not true, and 23 Hills–Wasteland extreme pairs fall under 12. Setting Hills and Wasteland
mottle to 0 recovers that pair (granulation already gives them −3.7/+2.9 L\* of texture).

### 7. Curved wild names will run over the peaks

The spine runs through the cells' centroids, which is where the massif's tallest peaks stand. Wild
name #E9E4D8 on snow #F2EEE6 is **1.10:1**, and on the lit face 2.89:1 (`colors.out` §G). v2 keeps
peaks out of a straight name box at Mid and Near only (`lbox`; "at Far the massif keeps all its
peaks"). The research itself warns that "curves cost legibility at 11 px", yet the spec curves at Far
from 11 px.

### 8. Scenery that borrows information shapes (H6 by shape, not by id)

The disjoint-id test cannot catch silhouettes. At Mid, at 5 to 13 px:

- **Dust devil** (a pale vertical swirl on Wasteland): a smoke wisp. Smoke means pillage, unrest
  stage 2 and 3, and the Turmoil pole. H6 lists smoke explicitly.
- **Broken obelisk** (ruins on Forest, Swamp, Wasteland): a single standing stone. Standing stones
  mean Lore, Thornwood level 2, a claimed Wellspring, and W's marker stones.
- **Haywain** (Near) and the **mine's cart**: Turmoil's toppled cart.
- **H9 prompt items 7 and 8 (a fox, two geese)** are not in §3.10. Geese are birds on the ground,
  and crows mean battle scars and Dread.
- **The camp's pole shield** is a small plain shield (#8C8A80, ΔE 10.0 / 5.8 CVD from the pewter
  token) beside the independents' real plain-shield token.

### 9. Pixi feasibility details

- **Bands as "inner strokes clipped per province"** (§7.3) means a stencil mask per owned province:
  dozens of mask pushes, which breaks the "map ≤ 15 draw calls" budget. A wobbling polygon needs an
  inner-aligned stroke or a precomputed inset, not masks.
- **Near.** §7.2's "Near province bake ≤ 25 ms" is a mockup number. The game bakes Near per 512²
  tile, and §7.3 gives that no budget. The bench measured about 100 ms per tile for the full stack;
  the lean stack is about 45 ms. The progressive fallback (show the scaled Mid bake until the tile
  lands, research §11.3 item 4) is not restated.
- **Seeds and stability.** The PAPER and GRAN tiles have no seed key. Mottle pairs are skipped when
  they touch a box, but the boxes differ per band (label sizes per band), so the surviving blotches
  differ between Far, Mid and Near and pop during the 150 ms cross-fade. That breaks the approved
  "zooming in only adds, nothing moves".
- **Labels and draw calls.** Place names as cached `Text`, one texture each, cost about 7 batches
  for 105 names. With the other live layers that is about 15 to 17 draw calls: tight against the
  budget.
- **Atlas memory.** "≤ 30 MB CPU" for atlases with "at most 2 workers": ImageBitmaps are not shared
  between workers, so say whether the cap is per worker or total.

### 10. Smaller readability notes

- **Borders between two dark provinces get slightly softer.** The pixel inside the border goes from
  1.40:1 (v2) to 1.25:1 on Forest at Mid; ΔE is unchanged at 17.9. This is acceptable, but drop v2's
  live 12% black pigment stroke when Hand is Painted, so the edge does not darken twice.
- **Flat boxes with a hard `evenodd` edge.** Granulation stops on a hard rectangle around every label
  and seat (±3 L\* on Wasteland), which reads as a label plate. A 4 px feathered mask hides it.
- **The fog brook** (one solid 1 px sepia line, 1.89 to 2.43:1) is the only solid line inside an
  all-dotted fog region: the most border-like mark in the pass.
- **Passable and wild peaks now share the ridge generator.** Add scree tick fans at their feet and
  the "ticks at a peak's foot mean impassable" vocabulary blurs. The two need a silhouette rule as
  well as color and snow.
- **Density budget.** It says ≤ 30 standing items, but not which items yield. In Forest, 30 crowns
  plus a ruin, camps and spring stones exceed it.

## mustFix (specific)

1. **Size information marks for the start zoom, in the units the game bakes in.**
   - Restate §2 and §3 sizes in world units for the game's Mid bake (1.25 px per unit × DPR) and keep
     the mockup's band-top px only as a mockup note.
   - Check every information-bearing mark at the start zoom (s = 0.44 of the Mid top) and at the Mid
     bottom: tracks, the Mountains' second channel, camps, spring stones.
   - Tracks must measure ≥ 3:1 dot peak and ≥ 1.8:1 line average on Mountains at the start zoom (the
     v2 footpath's values). Options: dots ≥ 1.2 px every ≥ 2.8 px at the Mid bottom (about 3 px dots
     at the top), or tracks drawn as a separate live layer of screen-constant dots.
   - Until then, do not remove R34's footpath.
2. **Ramp Mid place names with zoom.** Use 11 px Alegreya at the Mid bottom up to 13 px at the top
   (v2's ramp with an 11 px floor), not a fixed 13 px. Rerun the label test at the start zoom: at
   least 90% of names visible, no overlap with token boxes. Today 26 of 60 names fill more than 80% of
   their province's width, and 6 are wider than their province.
3. **Put region names under the instrument and last in priority.**
   - Bake them into the Far decoration: above the paint, below borders, bands, wilds and labels.
   - Give them the lowest priority: they never cull a place name. Fix the contradiction between §3.9
     ("below every other label") and Step 3 and the docs/07 text ("before own provinces").
   - Change the Wasteland edge-pool contrast claim (2.97:1) or the ink.
4. **Track geometry.**
   - Add "never along a border": outside a band width plus 6 px around its own crossing, every track
     sample stays at least a band width plus 4 px from every border, and it crosses its edge at 60° or
     more.
   - Handle short shared edges: 3.7% of neighbor pairs share less than 0.1 √area. Use a straight,
     perpendicular last segment, and drop dots within a band width plus 3 px of any other border.
   - Give a fallback when the zero-offset curve still leaves the polygon (route via the unnoised
     Voronoi edge's midpoint, then trim).
   - Test it in `tracks.test.ts`.
5. **The paint must not depend on armies.** Give each province one fixed token zone, sized for the
   token cap and always painted flat. Remove `tokensAt` from the paint's key and from
   `exclusions(i, band)`, so army movement never re-bakes paint.
6. **The paint must not show stale fog.** Choose one:
   - (a) Key the paint by terrain only. Draw the Ownership state live over it as one batched overlay
     of noisy polygons: haze is the cloth at 4%; the land-look wash is ash or moss at
     washMax × s / 10; out of sight is an equal-L\* grey at 10%. Each of these is already an alpha
     blend of one color over the fill.
   - (b) Keep the opaque bake. While a province's bake is stale for a fill key (fog, owner, land
     look), hide its decoration sprite and show the live fill. Budget the churn (provinces per in-game
     day × Mid, Far and Near-tile bake cost).
7. **Correct the terrain-pair claim.**
   - Measure terrain pairs across the approved states at the realistic blotch peak. Today: 19.6 / 10.0
     CVD; 8.6 at full M.
   - Either record an explicit texture floor (≥ 10 CVD at blotch peaks) in §1.6 and
     `palette.test.ts`, or set Hills and Wasteland mottle to 0. Granulation already textures them.
8. **Keep curved wild names readable.**
   - Peaks keep out of the curved name's glyph boxes plus 2 px at every band, Far included.
   - Curve only at 13 px or more; set straight below.
   - If the glyph boxes cannot be cleared, fall back to v2's straight placement.
9. **Drop or reshape the scenery that borrows information shapes.** Drop the dust devil, the broken
   obelisk, the haywain, the H9 geese and fox, the mine cart and the camp's pole shield. Add a
   greyscale silhouette check at Mid, against `POLE_MOTIFS`, land-look motifs, scars and siege and
   pillage marks, to mockup step 14.
10. **Specify Pixi bands without per-province masks.**
    - Draw an inner-aligned stroke with round joins, or a precomputed inset ribbon, on the simplified
      noisy polygon, in one `Graphics`; draw the keyline by the same method.
    - Test that no band pixel lies outside its province's ID.
11. **Close the budget and stability gaps.**
    - A Near tile budget for the game (lean, software and GPU canvas), with the scaled-Mid fallback
      restated.
    - Seed keys for the PAPER and GRAN tiles.
    - Test mottle pairs against the union of all bands' boxes, so the same blotches survive at every
      band.
    - An allocation order for the density cap: information marks (camps, spring stones), then the
      terrain landmark, then ruins and stamps.
    - Say whether the 30 MB atlas cap is per worker or total.

## Ideas to graft

- **Option (a) of mustFix 6.** It also makes ownership and land-look changes instant and removes the
  largest source of re-bakes.
- **Keep tracks in the Passability mode** (and perhaps Supply): adjacency is exactly what those modes
  ask about. Everywhere else, tracks fade with the decoration.
- **Feather the flat-box mask by 4 px,** so granulation does not stop on a hard rectangle around
  every label.
- **Run the paint check twice:** stamps off (the spec) and with the full decoration at Far, reporting
  terrain-pair ΔE of the full means. Far is where provinces read as averages.
- **A silhouette rule for passable and wild peaks:** passable peaks lower and rounder (height ≤ 0.8 ×
  base), wild peaks taller (≥ 1.1 × base), so the generator cannot blur them.
- **Color the Wellspring's five drops only while it is unclaimed;** once claimed, carve them neutral.
  All five drops are `NATION_BANNERS` entries, beside stones lit in the claimer's banner.
- **One `BitmapFont` for place names** (Alegreya 500 and 700 at 2×), so all names batch in one or two
  draw calls.
- **A deny-list content test** of the inspiration's region and place names against the region-name
  syllables and province names (cheap insurance for "never its names").
- **Show camps from Near only:** at Mid they are uncountable specks and redundant with the strength
  word on the independents' token.

## Things to drop

- Scree tick fans at the feet of passable peaks (Near). Ticks at a peak's foot are the wild rim's
  vocabulary.
- The single solid brook line in unexplored fog. Water is scenery, so omit it in fog.
- The dust devil, broken obelisk, haywain, H9's geese and fox, the mine cart, and the shield on the
  camp pole (finding 8).
- Region names in the label layer and their priority above own provinces. Keep region names, baked
  under the bands.
- §1.6's "≥ 3 everywhere" for tracks and "≥ 11.2 under every deficiency" for terrain pairs, as
  stated today. Both hold only at the band top and on raw fills.
