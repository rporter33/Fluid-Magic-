# The painted map: design for the hand-drawn pass

The build spec for the owner's direction of 2026-10-22. It extends the approved war table design
(`../wartable-design/final.md`, "final" below) and changes how the map is painted, never what it
says. The sim is untouched; every new mark is derived from map data and the viewer's view of the
state, seeded and stable.

**The owner's direction (2026-10-22, binding; verbatim, as `owner-direction.md` records):**

> im working on the art but i need the game map to be more interesting and detailed, a hand drawn
> feel - so far looking good

> i like final fantasy 14 and much concept art as insiration

**Read as:** keep everything approved ("so far looking good": the war table, the layered UI, the
wilds, settlements, alignment looks, portraits); make the map itself richer and hand-drawn; take
Final Fantasy XIV's painted maps and concept art as inspiration for style principles only.

**What stays exactly as approved.** The table, the cloth, the tavern and the props (final §2); the
chrome; the wild model, grounds, rims, contours and colors (final §1.10); settlements, kits, walls,
landmarks of buildings, land looks and pole motifs (final §4); tokens, standees and the path thread
(final §3.6); the three-layer split and "decoration fades in data modes" (R23, R31); "no light on
the cloth" (R19); the band rule, the label budget, the fog rules (R18), the reserved patterns
(R26); every docs/09 fill, banner and mode color.

**Evidence** (scripts in `handdrawn-design/calc/`, run with `npx tsx` from the repo, using the
repo's own `tests/content/colorMath.ts` and `src/content/colors.ts`):

| File | What it measures |
|---|---|
| `painted.ts` → `painted.out` | the band rule against painted extremes; lettering, track, water, landmark, camp and spring contrast; warm-cool faces; cast shadows |
| `extra.ts` → `extra.out` | region-name inks; camp domes against banners; relief inks; paper gaps (rejected) |
| `pairs.ts` → `pairs.out` | terrain pairs at the extremes of the wash mottle, per amplitude |
| `tokens.ts` → `tokens.out` | army tokens against painted extremes |
| `../research-techniques.md` [calc] | cost and color drift of every paint stage on a 105-province bench (software raster) |

---

## The design in sixteen lines

1. **Watercolor washes on linen:** each province is its docs/09 fill, painted: lighter in the middle,
   pooled darker at the edge, a slow mottle, granulation, a bloom or two, paper tooth over all. The
   paint never moves a province's mean more than CIEDE2000 2.0 from its fill.
2. **Ink with a hand:** borders wobble like a hand-ruled line (one seeded polyline per shared edge,
   used by fill, border, band, hover and hit test) with ±12% width; decoration ink tapers and breaks.
3. **One light from the upper left:** warm lit faces, cool blue-grey shadows on stamps, cool cast
   shadows to the lower right. Never a sheet-wide gradient (R19).
4. **Forests are painted clumps,** mountains ridge-profile peaks with flat shadow faces, hills humps
   with hachures that avoid the reserved 45°.
5. **Tracks join every pair of neighbors** as dotted sepia roads, seat to border to seat: a track
   means "you can march here", and none crosses a wild.
6. **Brooks and ponds are pale scenery inside one province;** dark water is always a wild.
7. **Landmarks say what the land is:** a mine on every Hills and Mountains province, a windmill on
   every Farmland province, old ruins on a quarter of provinces, bridges where tracks meet brooks.
8. **Independent camps show the public strength word** (1 to 4 bell tents). Mana springs show as
   small carved spring stones with their symbol where the view knows them. Wellsprings are
   illustrated: a glowing basin with five drops in the five mana colors, the province's brook
   rising from it.
9. **Lettering is ink on paper:** names in Alegreya, dark ink on a paper halo (owner A/B against
   the approved style); region names in spaced Marcellus SC at Far; wild names curve along their
   massifs.
10. **Region names** come from terrain: each connected run of 3 or more provinces of one terrain
    may be named ("the Greywold", "the Reed Fens"); public, presentation only.
11. **Near adds life:** one small vignette per province (sheep, deer, a heron, goats, a haywain, a
    dust devil). No people.
12. **Cut, with reasons:** watchtowers, standing stones, shrines and cairns as scenery (they are
    information or alignment motifs); huts (they read as population); cliffs outside wilds; rivers
    between provinces; paper gaps along borders; scale bars; graticules; fog sketches; a warm-cool
    sheet gradient.
13. **The instrument wins:** decoration fades in data modes, dims to 60% while commanders are
    selected, keeps out of label, token and seat boxes, and paints those boxes flat.
14. **Owner art:** paper, tree clumps, relief, landmarks, cartouche, compass, corners, vignettes and
    a Wellspring as ChatGPT images, recolored through luminance so the palette holds; every one has
    a procedural fallback that ships first.
15. **Bake once, blit always:** the paint goes into the existing decoration bake (Far and Mid at
    load in a worker, Near in tiles); no extra GPU memory; live layers unchanged in count.
16. **A 14-step mockup brief,** the washes and paper first.

---

## Rulings

**H1. The fills are law; the hand comes from paint, line and paper.** docs/09's fills pass
CIEDE2000 20 normal and 12 under each deficiency. Muting or shifting them is not allowed, so the
painted look comes from symmetric lightness texture, edges, ink and lettering. Every paint stage is
measured against the fill (§1.6).

**H2. R19 still holds.** The paint is pigment texture inside each province, mean-neutral within
ΔE2000 2.0. Nothing grades, lights, multiplies or vignettes the sheet. The research's warm-to-cool
`soft-light` gradient across the sheet (`research-techniques.md` §3.2) is rejected: it is a light on
the cloth. Warm-cool lives on stamp faces and shadows only.

**H3. Noisy borders move from Later to M1-should (Phase 11), on one polyline.** final §3.3 allowed
painted edges "only with hit tests on the same noisy polygon". This design does exactly that: one
seeded polyline per shared edge, endpoints fixed, used for the fill, border, band, hover, selection,
hit test and the wild contour. Adjacency stays `MapProvince.neighbors`. Phase 8 builds the same
module with the noise off.

**H4. Tracks are presentation of `neighbors`.** R36 dropped roads as sim state; tracks add none.
FM has no road rule (docs/01 §6: travel time depends on the destination's terrain), so a track on
some pairs and not others would invent one. Every passable neighbor pair gets exactly one track and
no other pair gets any. Tracks replace the passable Mountains' footpath (R34) with the same
contrast (≥ 3:1).

**H5. Water never runs between provinces.** Players read rivers as rules (Dominions, Civ, CK3,
Total War; `research-techniques.md` §9). FM's brooks rise and end inside one province and keep a
band width plus 6 px from every border; ponds are pale and small. Dark water means a wild, always.
Rivers that cross provinces wait for a river rule (Later).

**H6. Scenery may not borrow an information shape.** Watchtowers (PD 1 to 4), standing stones (Lore,
Thornwood, claimed Wellsprings), shrines (Sanctity, Order), cairns (Cinder, Fury, battle graves),
tents in banner colors (sieges), smoke (pillage, unrest), cliff ticks (wild rims), snow (wilds),
houses and huts (population), flags (ownership) and skull piles (Rot) never appear as terrain
landmarks or vignettes. A content test checks the id lists are disjoint.

**H7. Landmarks are truthful or plainly old.** Mines and windmills are terrain-coded (every Hills
and Mountains province has a mine, every Farmland a windmill), so they say what the terrain says.
Ruins are history: seeded, about a quarter of provinces, never house-shaped, never near the seat.

**H8. Labels: ink on paper is the default, the approved light-on-dark labels are the A/B.** Both
measure well above 4.5:1 on every fill (§1.6). The owner picks in the mockup.

**H9. Owner rasters supply form and brushwork, never color.** Terrain stamp sheets are recolored
through luminance into each terrain's faces; landmark, cartouche and ornament sheets must be
near-neutral. Wild peaks, settlements and information marks stay procedural (measured colors).

---

## 1. The look and the palette

### 1.1 The look

A campaign map painted by a careful cartographer on the linen cloth: transparent watercolor washes
in the seven terrain colors, lighter in the middle of each province and pooled darker at its edge,
with a slow mottle, a little granulation in the earths and greys, and the cloth's tooth showing
through; confident sepia ink for everything drawn on top (clustered tree crowns with one outer
outline, profile peaks with flat shadow faces, rounded hills with a few hachures, a mine in the
hillside, a windmill in the wheat, an old arch in the grass, dotted tracks running from town to
town across every border, pale double-lined brooks running into small ponds); near-black survey
ink for borders that wobble like a hand-ruled line; one soft light from the upper left, warm on
lit faces and cool blue-grey in the shadows; names lettered in dark ink on a breath of paper,
region names spaced wide across the land at far zoom, wild names curving along their massifs. Over
it, untouched, the instrument: flat banner bands with keylines, the darkest wilds with their light
rims, painted-wood tokens, crisp chips.

### 1.2 What FM takes from Final Fantasy XIV, and what it never takes

Principles (from `research-style.md` §1.5 and the owner's reading):

| Principle | FM's form |
|---|---|
| Painted ground, crisp information on top | paint lives in the decoration bake; bands, wilds, labels, chips and tokens stay flat and above it |
| Paper under pigment | a mean-neutral paper tooth over every wash (not a multiply, H2) |
| Line plus wash | an ink line with a transparent wash that pools at its edge |
| One light from the upper left; warm light, cool shadow | stamp faces and cast shadows only |
| A name tier per zoom | region names at Far, province names at Mid and Near, wild names everywhere |
| Illustrated landmarks that say what lives where | mines, windmills, ruins, the Wellspring basin |
| Atmospheric depth | value depth: light interiors, pooled edges, cool shadows; never a vignette (R19) |
| Elegant lettering | serif names, spaced capitals, curved names |

**Never taken:** its map images, layouts, region shapes, place names, icons, crystal or teleport
symbols, logos, logo lettering, fonts, UI frames, characters or creatures. No prompt names it or any
other game, studio or artist (§6).

### 1.3 Paper

| Item | Value | Use |
|---|---|---|
| Cloth | **#E8DCC2** (unchanged) | the margin; the base under everything |
| Paper tooth | a seamless grey tile, value noise 128 ± 20 (two octaves: 1.5 px tooth, 24 px mottle), composited `soft-light` at 0.5 | over every province's paint, world-locked (one tile pixel = one screen pixel at the top of Mid) |
| Fibres | 400 strokes per 256² tile, 3 to 8 px, within ±25° of horizontal, #5A4628 at 10% and #FFFAEB at 14% | inside the tile; never near 45° (R26) |
| Label halo paper | **#F2EAD6** at 85% | the halo behind place names (ΔE 3.8 from the cloth) |
| Margin wear | linen darkened to #D9CBAE within 6 units of the hem, two faint ring stains (#B9A27E at 6%) in the margin's lower corners | the margin only, outside the neatline; texture, not light |

The tooth replaces docs/09's "seamless noise texture at 10% opacity multiplied over every fill":
mid-grey in `soft-light` is mean-neutral (grain plus paper moved means by ΔE 0.46, worst 1.22,
`research-techniques.md` §4), where a multiply always darkens.

### 1.4 Pigments: each fill as a wash

The wash's mean is the docs/09 fill (or, in Ownership mode, the fill with its land-look wash, haze
or fog desaturation: the province's Ownership fill). Every term below is symmetric or compensated.
The pigment names guide owner art and prompts; they are not colors.

| Terrain (fill, L\*) | Pigment idea | Mottle ±L\* | Edge pool ΔL\* | Granulation (`soft-light` alpha) | Blooms (Mid, Near) | Interior lift L\* |
|---|---|---|---|---|---|---|
| Plains #C1D29F (81.8) | sap green and yellow ochre | 4 | −7 | 0.25 | 1 | +1.2 |
| Farmland #EEBA3A (78.2) | gamboge and raw sienna | 3 | −7 | 0.20 | 0 (the patchwork varies) | +1.2 |
| Forest #374C2B (29.8) | hooker's green and burnt umber | 4 | −5 | 0.45 | 0 (canopy) | +0.8 |
| Hills #856824 (45.7) | raw umber and yellow ochre | 2 | −6 | 0.60 | 1 | +1.0 |
| Mountains #8DA4AD (65.9) | cerulean and neutral grey | 2 | −7 | 0.70 | 1 | +1.2 |
| Swamp #1A727A (43.7) | viridian and Payne's grey | 2 | −6 | 0.35 | 2 | +1.0 |
| Wasteland #AE897F (60.3) | rose madder and burnt sienna | 2 | −8 | 0.80 | 1 | +1.4 |

- **Why the amplitudes differ:** at ±2 on Hills, Mountains, Swamp and Wasteland, the closest pair
  of blotch extremes stays 20.9 normal (Mountains against Swamp) and 11.2 under a deficiency (Hills
  against Wasteland); at ±3 those fall to 19.2 and 9.3 (`pairs.out`). The means stay the fills.
- **Interior lift** starts at the values above and is calibrated per terrain by the paint check
  (mockup step 13, the Playwright smoke in the game) until the painted mean is within ΔE 2.0.
- **Granulation** follows real pigments: earths and greys granulate, yellows stay smooth
  (`research-techniques.md` §3.4).

### 1.5 Inks and other new colors

| Role | Value | Where |
|---|---|---|
| Survey ink | **#2B2620**, 2 px mean, ±12% width, alpha 0.85 to 1 per edge (unchanged color) | province borders |
| Contour ink | **#1C1A17** (unchanged) | wild contours, the neatline, settlement and landmark outlines, tokens |
| Feature ink | **#3E3428** (the fog line-art sepia), stamps at 80% | tree, hill and peak outlines, hachures, tracks on light fills, fog line art |
| Paper ink | **#E8DCC2** | tracks and fog line art on Forest, Hills and Swamp (the fog rule's dark set) |
| Name ink | **#2A1F14** on halo #F2EAD6 at 85% | place names (default; A/B) |
| Region ink | **#33261A** at 85% on Plains, Farmland, Mountains, Wasteland; **#F1E8D2** at 85% on Forest, Hills, Swamp | region names, no halo |
| Warm lit mix | #F6D9A0 at 12% over the lit face (fill +12 L\*) | stamp lit faces |
| Cool shade mix | #3A4466 at 14% over the shade face (fill −18 L\*) | stamp shade faces |
| Cast shadow | rgba(38,42,64,0.22) | under every standing stamp, landmark, house, to the lower right |
| Brook | water **#BCD6D9**, banks **#35535A** at 70%, 0.7 px | brooks |
| Pond | **#A6C7CC**, lit rim #DCEAEA, bank #35535A at 70% | ponds |
| Stone | **#CFC6B4**, shade #8E877A, ink outline #1C1A17 | ruins, mine frames, bridges' decks, the spring stone's rim |
| Camp canvas | **#B9B4A6**, shade fill −18 L\*, ink outline | independent camps |
| Spring stone | **#E9E1CC** disc, 1 px ink ring #1C1A17 | mana spring marks |
| Wellspring drops | the five mana primaries with 0.6 px ink outlines | the Wellspring basin |

### 1.6 Measured contrast

**Bands on the painted ground** (`painted.out` §1). Every banner in `NATION_BANNERS` against every
terrain's paint extremes (mottle high and low, the edge pool, the edge pool −3): 385 pairs, 314
direct, 71 through the keyline, **0 fail**. The closest direct pass is #C98BAD on Wasteland's edge
pool (#98756B): 20.2 normal, 12.6 under a deficiency. The raw fills need the keyline in 16 pairs;
the painted extremes add none that fail.

**Tokens** (`tokens.out`). 19 banner-on-fill pairs are already under 20/12 on flat fills; tokens
carry them by shape, outline, top-edge highlight, plate and contact shadow, as approved. Paint
would push three more under at mottle extremes (#3A7BD5 and #B5D69C on Mountains, #C98BAD on
Farmland). **Fix:** token, label and seat boxes (plus 4 px) are painted flat: no mottle, no
granulation, no blooms (final §3.2 already caps textures there at ±4 L\*). With it, paint adds no
token pair.

**Terrain pairs** (`pairs.out`): blotch extremes stay ≥ 20.9 normal and ≥ 11.2 under a deficiency
with the amplitudes of §1.4. Province means stay the fills.

**Lettering, WCAG** (`painted.out` §3, `extra.out` §4b):

| Text | Worst fill | Ratio | Need |
|---|---|---|---|
| Name ink #2A1F14 on halo at 85% | Forest | **10.58** | 4.5 |
| (approved: #F4EEDF on a dark halo) | Plains | 11.71 | 4.5 |
| Region ink at 85% (large text) | Hills | **3.60** | 3 |
| Wild names #E9E4D8 (approved) | granite | 11.40 | 4.5 |

**Lines and marks, WCAG:**

| Mark | Worst fill | Ratio | Note |
|---|---|---|---|
| Tracks at 85% (sepia or paper per fill) | Wasteland | **3.12** | ≥ 3 everywhere; Mountains 3.64 (the footpath was 3.65) |
| Brook (best of water and bank) | Wasteland | 2.64 | scenery; no requirement |
| Landmark (best of stone and ink) | Hills | **3.31** | final §3.11 item 6: one tone ≥ 3:1 |
| Camp dome (best of canvas and ink) | Swamp | 3.09 | ≥ 3 |
| Spring stone ink ring on its disc | all | 13.32 | the symbol's shape carries color identity |

**Water and camps against banners** (`painted.out` §5, `extra.out` §7b): brooks and ponds come
closest to #51DDFC (14.9 / 11.8) and #B5D69C (20.2 / 4.7 under a deficiency); they never lie within
a band width plus 6 px of any border, so they never touch a band. Pond against mere water: 63.7.
Camp canvas #B9B4A6 is 15.4 / 10.9 from the closest banner (#F3E6B8), and camps are domes, never
the siege camp's triangles in a banner color.

**Warm-cool faces** (`painted.out` §6): the shifts move faces by ΔE 0.9 to 5.9 from final §3.2's
plain faces; each face stays 7.4 to 20.1 from its fill, so stamps still read as painted texture.

**Rejected by measurement:** paper gaps along borders (the cloth at 35% over a fill is ΔE 19.6 on
Forest and 16.0 on Swamp: a light line along a dark border reads as a keyline; `extra.out` §9).

---

## 2. Layers, draw order and zoom bands

### 2.1 The draw order

final §3.1's three layers stay. The decoration layer gains sublayers, baked in this order per
province and band (Ownership mode only; it fades in every other mode, R23):

| # | Sublayer | Content |
|---|---|---|
| D1 | Ground paint | an opaque base wash (the Ownership fill), interior lift, mottle pairs, granulation, blooms, the edge pool (inner shadow) and the pooling line. Label, token and seat boxes painted flat |
| D2 | Paper | the tooth and fibres, `soft-light` 0.5, world-locked |
| D3 | Ground textures | final §3.2's approved textures within ±8 L\* (±4 under boxes): grass stipple and wavy hedgerows, the field patchwork with hedges and furrows, infields and clearings, the canopy scallop, scree, swamp streaks and pools, wasteland cracks |
| D4 | Water | ponds, then brooks (pale water, two bank lines) |
| D5 | Tracks | sepia or paper dots, gaps at borders, boxes and bridges |
| D6 | Standing items, by bottom edge | all cast shadows first (one pass), then: hills with hachures, peaks, forest clumps, other terrain stamps, mines, windmills, ruins, bridges, camps, spring stones, land-look and pole motifs, settlements (walls, houses, landmarks, pennant), vignettes (Near) |
| D7 | Fog line art | for unexplored provinces D1 is the hazed base and paper only, and D3 to D6 are drawn as line art (§5.3) |

The **always-on layer** is unchanged in content: wilds (ground, peaks or ripples, contour, rim),
borders (now ink ribbons on the shared polylines, dotted where both sides are fogged), ownership
bands with keylines and sigils, ritual marks, siege camps and walls, pillage smoke, and the
**Wellspring illustration** with its claim state (§3.6). Above it, unchanged: mode overlays, labels
(region names first, then wild names, then place names and their second line), numbers chips, path
previews, tokens, transit arrows, selection rings, battle markers.

### 2.2 The ground paint recipe (D1, exact)

Per province, clipped to its noisy polygon, `f` = the province's Ownership fill, `rec` = §1.4,
`px` = one screen pixel at the band's top in world units, `R` = `streamFor(map:${seed}:${id}, 'paint')`:

1. **Base:** fill the polygon with `f` at alpha 1 (the bake is opaque inside provinces, so
   `soft-light` stages blend against the paint, not against transparency).
2. **Lift:** fill with `f` lightened by 2 × `rec.lift` L\* at alpha 0.5.
3. **Mottle** (every band): `n = max(2, round(6 × area / meanArea))` pairs. Each pair draws two
   soft radial blotches of the same radius r = (0.10 to 0.18) × median province diameter at two
   seeded points: one `f` + `rec.M` L\*, one `f` − `rec.M` L\*, each a radial gradient from alpha
   0.55 to 0. A pair is skipped whole if either blotch's inner half touches a box, so the sum stays
   zero.
4. **Granulation** (Mid, Near): a 128² grey value-noise tile (1.5 px features, 128 ± 26), world-
   locked pattern, `soft-light` at `rec.G`, clipped to the polygon minus the boxes (`evenodd`).
5. **Blooms** (Mid, Near): `rec.B` noisy circles r(θ) = r(1 + 0.18 sin 5θ + 0.1 sin 11θ), r =
   (0.07 to 0.11) × median diameter, at least 10 px from the edge and outside the boxes: fill `f`
   + 4 L\* at 0.35, rim stroke `f` − 9 L\* at 0.30, 1.2 px.
6. **Edge pool:** an inner shadow. Clip to the polygon, set `shadowColor` to `f` − 28 L\* at 0.45
   and `shadowBlur` to 4, 6 or 8 screen px (Far, Mid, Near) converted to the bake canvas's device
   pixels (`shadowBlur` ignores the transform), and fill a large rectangle minus the polygon
   (`evenodd`). Measured: mean ΔE 0.31, p5 −4.5 L\* (`research-techniques.md` §3.3).
7. **Pooling line:** stroke the polygon, still clipped, 4.4 px wide in `f` − 14 L\* at 0.35 (2.2 px
   visible inside; the border covers 1 px of it).

Then D2 paper: the tooth tile, `soft-light`, alpha 0.5, clipped to the polygon. Wilds get no paint
and no paper: they stay the crisp, darkest ink on the map.

**Paint check:** a province's painted mean (stamps off) is within **ΔE2000 2.0** of `f`, every
terrain. The research bench measured the full stack at mean 1.74, worst 4.47 (Mountains) before
calibration (`research-techniques.md` §3.5); the lift term is the calibration knob.

### 2.3 Relief

- **Hills:** final's humps (fill +12 / −18 L\* faces, now warm-cool) plus 4 to 6 tapered hachure
  strokes on each hump's lower-right flank, radiating from the crest at 6° to 33° and 57° to 80°
  below horizontal (never within ±12° of 45°), length 0.35 to 0.55 of the hump's width, feature ink
  #3E3428 at 0.75, width `w0 · sin(πt)^0.6 + 0.2 px` with w0 0.9 px. Hachures belong to the hump
  (stamp class, inside its box), never spread over the ground, so ground textures keep ±8 L\*.
- **Passable Mountains:** ridge-profile peaks (`research-techniques.md` §7: midpoint-displaced
  ridges, three levels), lit face #B4C1C6 with a soft vertical wash (+4 L\* at the top), **flat**
  shade face #6E7F86 (R26), no snow, ink outline heavier at the summit (1.4 px tapering to 0.8 px).
  At Near, a scree fan of 5 tapered ticks at each foot, 60° to 80°.
- **Wild peaks:** the same ridge generator with the approved colors (lit #8A857E, flat shadow
  #46423F, snow #F2EEE6 down to 40% with a ragged 3- to 5-tooth lower edge), tallest first.
- **Cliffs are reserved.** Only wild rims carry cliff ticks; no scarp lines anywhere else.
- **Cast shadows:** every standing stamp casts an ellipse rgba(38,42,64,0.22) centered at (x +
  0.25w, y + 1 px), rx 0.6w, ry 0.22w, rotated −10°.

### 2.4 Forests: painted tree clusters

- **Clumps, not scatters:** the lowest-ranked free slots become clump centers (one per 4 slots); the
  other slots join the nearest center within 1.6 crown spacings. Each clump holds 2 to 7 crowns.
- **Crown:** a lobed circle r(θ) = r(1 + 0.12 sin(kθ + φ)), k = 3 to 5; shade face (warm-cool
  shade), lit face offset (−0.22r, −0.22r) with radius 0.72r (warm lit).
- **One outer outline per clump:** stroke every crown at twice the ink width (#3E3428 at 80%), then
  fill every crown over it, back to front: only the clump's outer contour keeps its ink.
- **Trunks** only under crowns with no crown within 1.2r below them (a 0.24r stub, `f` − 30 L\*).
- **Conifers:** a Forest province bordering Mountains or a peaks wild draws 70% conifer crowns
  (three jagged tiers, lit left half, shade right half); others 15%. Derived from map data.
- **Sizes:** crown r 4 to 5.5 px at Mid, 5 to 7 at Near; caps unchanged (30 at Mid, 60 at Near).
  Far: 4 canopy masses (clumps of 6 crowns at r 6 px).

### 2.5 Water

- **Brooks** (§3.3): pale water #BCD6D9 as a tapered ribbon, 0.6 px at the spring to 1.8 px at the
  mouth (Mid), between two bank lines #35535A at 70%, 0.7 px; a tiny spring dot at the source.
- **Ponds** (§3.3): a noisy blob squashed 0.75 vertically, #A6C7CC, a lit rim #DCEAEA (1.2 px, 80%)
  on the upper-left shore, a bank line #35535A (0.8 px, 70%), two or three reed tufts on the lower
  shore; at Near two short ripple arcs #E9F2F2.
- **Swamp pools** stay final's #2C8C94, now with one pale ripple dash (#9FD0D4 at 70%) at Near.
- **Meres** are unchanged: near-black, ripples, rim, contour, name. Dark water means a wild.

### 2.6 Fields

- **Farmland patchwork** (approved): 5 to 9 fields; boundaries now hand-inked (two levels of
  midpoint displacement, amplitude 0.15); field tones ±5 L\*; furrows at 0°, 90° or ±30° in
  `f` − 12 L\* at 0.35; hedges between fields as wobbly dotted bushes (#4E5A2E at 60%, crown dots
  1.4 px every 3 px).
- **Infields:** on Plains, Hills and Wasteland, a settlement of tier T ≥ 2 has T − 1 small furrowed
  patches (up to 4) in seeded ranked spots just outside its fixed extent, ±5 L\*: growth adds the
  next spot, decline removes the newest (final §4.2's rule). Slow key: the tier.
- **Clearings:** in Forest, trees keep out of 1.3 × the settlement extent, and that ellipse is
  lightened +5 L\* with a soft edge: a clearing in the woods.
- **Plains hedgerows** (approved, 1 or 2) are drawn wavy and dotted, so they never match Order's
  straight hedgerows.

### 2.7 Borders as ink

- **Geometry** (H3): each shared edge is subdivided only where its segment crosses the segment
  between the two sites (a convex quad), with Red Blob's recursion (`center = lerp(p, q, 0.4 +
  0.2U)`), down to 3 units on a 6400-unit province, then two Chaikin passes with fixed endpoints.
  About 6 to 11% of edges stay straight; none self-intersect on the bench seeds
  (`research-techniques.md` §5.1). Edges on the map outline stay straight.
- **Stroke:** per shared edge, a filled ribbon in #2B2620, width 2 px × (1 + 0.12 sin(2π(f1 t +
  φ1)) + 0.05 sin(2π(f2 t + φ2))), f1 in [1, 2], f2 in [3, 5], alpha 0.85 to 1 per edge. A border
  never breaks or tapers: a dotted border means fog. An edge is dotted (2/3 px) when both sides are
  fogged. Along a wild, the 3 px contour replaces it (approved).
- **Neatline:** the outline keeps its 3 px #1C1A17 line and gains a 0.8 px rule at 60%, 5 px
  outside it in the margin (a double neatline).
- **Simplification:** Douglas-Peucker per shared polyline to one point per 1.5 screen px (about
  150 points per province at Far, 300 at Mid, all at Near); both sides use the same result.

### 2.8 What each zoom band shows

Far is under 70 px median province on screen, Mid 70 to 180, Near above 180 (staged docs/07).

| Layer | Far | Mid | Near |
|---|---|---|---|
| Base wash, lift, mottle, edge pool | yes (edge blur 4 px) | yes (6 px) + pooling line | yes (8 px) + pooling line |
| Granulation, blooms | — | yes | yes |
| Paper tooth and fibres | yes (0.4 px tooth) | yes | yes (2.3 px tooth) |
| Ground textures | global patterns (approved) | per province | full |
| Relief | 2 to 4 masses (approved) | humps with hachures, peaks | plus scree fans |
| Forests | 4 canopy masses | clumps, ≤ 30 crowns | ≤ 60 crowns, trunks |
| Ponds, brooks | — | yes | plus ripples, shore reeds |
| Tracks | — | dots | dots |
| Fields | 2 field blocks (approved) | patchwork, hedges, infields, clearings | full furrows |
| Mines, windmills, ruins, bridges | — | yes | yes, with detail |
| Camps | — | domes | domes and the standard |
| Spring stones | — | 9 px | 13 px |
| Wellspring | glyph (always-on) | the illustration | plus the glow and drops in detail |
| Settlements | approved (capitals: keep plus 3 roofs, §3.8) | approved | approved |
| Vignettes | — | — | ≤ 1 per province |
| Region names | yes | — | — |
| Place names | by priority | yes | yes |
| Wild names | curved | curved | curved |
| Borders | ink, simplified | ink ribbon | ink ribbon, every point |
| Wilds, bands, tokens, chips | approved | approved | approved |

When the band changes, the decoration cross-fades over 150 ms and region names fade with it
(instant under reduced motion).

---

## 3. "More interesting": the features

### 3.1 Feature list

| Feature | Derived from | Seed key | Carries information? | Bands | Cap per province |
|---|---|---|---|---|---|
| Wash and paper | fill, land look, fog (the Ownership fill) | `paint` | no (mean = the fill) | all | — |
| Wobbling borders | geometry | `edge:${min}:${max}` | the border itself (unchanged meaning) | all | — |
| Tracks | `neighbors`, seats, shared edges | `track:${min}:${max}` | **yes, redundant:** "you can march here"; none crosses a wild | Mid, Near | one per neighbor |
| Brooks | terrain, neighbors' elevation proxy, Wellspring | `brook:${id}` | no ("scenery", Codex) | Mid, Near | 1 |
| Ponds | terrain | `pond:${id}` | no | Mid, Near | 1, ≤ 4% of area |
| Mines | terrain: every Hills and Mountains province | `landmark:${id}` | terrain, redundant ("materials country") | Mid, Near | 1 |
| Windmills | terrain: every Farmland province | `landmark:${id}` | terrain, redundant ("food country") | Mid, Near | 1 |
| Ruins | seed, terrain kind table | `landmark:${id}` | no (history) | Mid, Near | 1, about 25% of provinces |
| Bridges | a track crossing a brook | — | no | Mid, Near | as crossings |
| Independent camps | owner null, the public strength word | `camp:${id}` | **yes:** weak 1, moderate 2, strong 3, fortress 4 tents (the tooltip's word) | Mid, Near | 4 tents |
| Mana spring stones | `springs`, when the view shows them | — | **yes, redundant** with the Springs mode and Near label symbols | Mid, Near | one per spring (0 to 4) |
| Wellspring illustration | `wellspring`, claim state | — | **yes** (always-on; claim state approved) | all | 1 |
| Capital at Far | capital, kit | — | redundant | Far | 1 |
| Region names | connected same-terrain runs of ≥ 3 provinces | `region:${seed}` | no new fact (terrain is public) | Far | — |
| Curved wild names | wild cells | — | the name (approved) | all | 1 per range |
| Vignettes | terrain | `vignette:${id}` | no | Near | 1, 60% chance |

Every new mark is computed from the same `provinceView(state, viewer, id)` the tooltip uses, or from
public map data, so art never shows more than the tooltip (final §4.1 principle 6).

### 3.2 Tracks

- **One per passable neighbor pair**, never for another pair. Wilds are not neighbors, so tracks
  bend around the Ashspine and teach the rule. The Codex concept "Tracks": "Tracks join every pair
  of neighboring provinces. Travel time depends on the destination's terrain."
- **Shape:** from the edge of province A's fixed settlement extent to the arc-length midpoint of the
  shared polyline, then on to B's extent: two quadratic curves, each with a seeded control offset
  of 10 to 20% of its length. If a sample leaves its province's noisy polygon, the offset halves,
  then goes to zero. Tracks end at the settlement extent, which never changes (final §4.2), so
  growth never moves them.
- **Drawn as dots:** `setLineDash([0.1, 3.4] px)`, round caps, 1.6 px, ink #3E3428 at 85% on
  Plains, Farmland, Mountains and Wasteland, #E8DCC2 at 85% on Forest, Hills and Swamp (each half
  takes its own province's ink). They stop 3 px before the border and resume 3 px after it; they
  break under label boxes (plus 2 px), the cartographic knock-out. The fog's dotted border is 2 px
  dashes on the border; tracks are dots across it.
- **Replaces** the passable Mountains' footpath (R34): Mountains reach 3.64:1 (the footpath had
  3.65:1).
- **Stamps keep off tracks:** a standing stamp's slot is dropped if within its radius plus 2 px of a
  track or brook (computed once per map).
- **M1-should:** path previews follow the tracks (seat, border midpoint, seat) instead of straight
  centroid lines, with the tacks at each seat (owner question 3).

### 3.3 Brooks and ponds

- **Who gets one** (seeded): Wellspring provinces always (the brook rises at the basin); otherwise a
  brook with probability Hills 0.6, Mountains 0.6, Swamp 0.6, Forest 0.5, Plains 0.4, Farmland 0.3,
  Wasteland 0; a pond with probability Plains 0.25, Forest 0.2, Mountains 0.2, Farmland 0.15, Hills
  0.15, Swamp 0, Wasteland 0.
- **Uphill side:** an elevation proxy (peaks wild 6, Mountains 5, Hills 4, Forest 3, Plains,
  Farmland and Wasteland 2, Swamp 1, mere 0) picks the highest neighbor; the source is the free slot
  farthest toward it, the mouth the pond (if any) or the free slot farthest the other way, at least
  half a diameter from the source.
- **Route:** three levels of midpoint displacement (amplitude 0.25 of the segment), then two
  Chaikin passes. Every point must stay inside the province's polygon inset by **a band width plus
  6 px** and outside label, token and seat boxes; on failure the amplitude halves, then the brook
  is dropped. A brook may pass beside the settlement, never through its extent.
- **Ponds:** 1.5 to 4% of the province's area, at a free slot, inset like brooks.
- **Never a rule:** never along or across a border (by construction), no tint, no hover, faded in
  data modes. The Codex line under "Tracks": "Brooks and ponds are scenery; dark water is a wild."

### 3.4 Landmarks

| Terrain | Always | Ruins (about 25%, one of) |
|---|---|---|
| Plains | — | a broken arch, a grassy barrow with a stone door, a three-arched aqueduct fragment |
| Farmland | a windmill (sails at 22.5° + k·90°) | an aqueduct fragment, a ruined wall with an empty window |
| Forest | — | a fallen giant trunk with roots, a ruined wall, a broken obelisk |
| Hills | a mine adit (timber frame, spoil heap, cart) | three broken columns on a step, a barrow, a cave mouth in an outcrop |
| Mountains | a mine adit | a doorway cut into a cliff, a cave mouth |
| Swamp | — | half-sunken columns in reeds, a broken obelisk |
| Wasteland | — | a toppled statue (face down), a broken obelisk, a broken arch |

- **Placement:** the always-landmark takes the lowest-ranked free slot at least 1.2 × the
  settlement extent from the seat; a ruin the lowest-ranked free slot at least 1.4 ×, inset a band
  width plus 10 px. Both leave the stamp pool.
- **Drawing:** about 1.3 house widths; stone #CFC6B4 and #8E877A, timber #8C6A47, ink #1C1A17 at
  0.9 px; the cast shadow of §2.3.
- **Bridges:** where a track crosses a brook: a deck 4 px along the track and the brook's width + 3 px
  across it, #CFC6B4 with #3E3428 rails (0.8 px); the track's dots run over it.
- **Cut** (H6): watchtowers, standing stones and circles, shrines, cairns, huts, lumber camps,
  wells, sheepfolds, signposts, hollow trees, anything with a flag, fire or smoke.
- **One asked change to the approved motif list:** Artifice's "a mill" becomes "a water mill with a
  wheel", so windmills stay Farmland's alone.

### 3.5 Independent camps

- **When:** the province's owner is Independents. Its tents follow the public strength word
  (docs/01 §14, "Implementation decisions": weak under 16, moderate under 24, strong under 30,
  fortress at 30): 1, 2, 3 or 4 bell tents. The mockup's badge thresholds (15/25) align to these.
- **Drawing:** a row beside the seat, 7 px apart (Mid): half-ellipse domes 3.2 × 2.6 px, #B9B4A6,
  the right half −18 L\*, ink outline 0.9 px, a door slit; at the row's left a 7 px pole (#5E4630)
  with a small plain shield (#8C8A80, ink). No fire, no smoke, no spears, no triangle tents.
- **In fog:** the word is public, so unexplored provinces show the domes as line art.

### 3.6 Wellsprings as illustrated features

- The approved basin monument grows to 1.4× at Mid and Near, gains a soft pale glow (radial #F4EEDF
  from 0.28 to 0 over 18 px, inside the province only) and five drops in the five mana primaries
  (W #F3E6B8, U #3A7BD5, B #3D2B4F, R #FD6533, G #00674B) with 0.6 px ink outlines: it yields every
  color (docs/01 §13), so it may carry them.
- The province's brook rises at the basin.
- Claim states are unchanged: hollow or filled diamond, the priest and the 10-day ring, standing
  stones lit in the claimer's banner, the sigil. Always-on, every band.

### 3.7 Mana spring stones

- **When:** the viewer's view shows the province's springs (owned or scouted, docs/01 §14); never
  in unexplored or never-scouted provinces.
- **Drawing:** one per spring, left of the settlement: a disc #E9E1CC (r 4.5 px at Mid, 6.5 at
  Near) with a 1 px ink ring, holding the color's mana symbol in its primary with a 0.6 px ink
  outline (W's pale sun disc reads by its outline: 13.3:1). Decoration: in the Springs mode the
  mode's own symbols take over.

### 3.8 Capitals at Far

The Far keep glyph becomes the keep plus three roofs of the owner's kit and the pennant, at the
same footprint: the capital reads as a city from the table's edge.

### 3.9 Region names

- `regions(map, seed)`: connected components of provinces of one terrain (through `neighbors`),
  size 3 or more; the largest first, at most round(provinces / 10) (Medium 6), each at least 1.5
  name lengths from the next.
- **Names** from content syllables per terrain, unique against every province and wild name:
  Forest "Grey Elder Moss Raven Thorn Deep Old" + "wold, weald, holt"; Swamp "Black Reed Sallow
  Sedge" + "Fens, mire, Marsh"; Hills "Red Barrow Wind Long High" + "Downs, Tors, Knolls"; Mountains
  "Iron Cold High Grey" + "Uplands, Heights, Scarps" (never the wilds' "spine, teeth, fells");
  Plains "Gold Wide Broad Lark" + "Meads, Leas, Plain"; Farmland "Wheat Barley Honey Mill" + "Vale,
  lands, Furrows"; Wasteland "Salt Dust Red Scour" + "Barrens, Waste, Flats". Each takes "the".
- **Placement:** along the component's principal axis through its area-weighted centroid, 0.84 of
  its extent long, bowed by 8% (side seeded), set on the curve (§4.3); a straight fallback along the
  axis; otherwise none. Far only, below every other label.

### 3.10 Vignettes (Near only)

One per province with probability 0.6, at a free slot clear of tracks and brooks: a flock of 3 to
5 sheep (Plains, Hills; #EFE9DC with ink heads), two deer (Forest edge; #8C6A47), a heron in reeds
(Swamp; #B9C2C6), three goats on a rock (Mountains; #D8CBB0), a haywain parked on a track (Farmland;
#8C6A47 with #E3CF8F hay), a dust devil (Wasteland; a spiral stroke #CFC6B4 at 60%). Each about 5 to
8 px, with an ink outline and a cast shadow. No people, no riders, nothing that moves.

### 3.11 Cut, and why

| Idea | Why cut |
|---|---|
| Decorative watchtowers | the PD 1 to 4 wall stage |
| Standing stones, stone circles | Lore motifs, Thornwood's mossy stones, claimed Wellsprings |
| Shrines, wayside chapels | Sanctity and Order motifs, the independents' temple |
| Cairns, grave mounds of stones | Cinder motifs, Fury war cairns, battle scars |
| Huts, lumber camps, sheepfolds | read as houses and walls: population and PD |
| Cliffs outside wilds | cliff ticks mean impassable |
| Rivers between provinces | read as rules (H5) |
| Color bleeding across borders | muddies the border where distinctness matters most |
| Paper gaps along borders | a light line on dark fills reads as a keyline (§1.6) |
| A scale bar | distance is not time in FM (destination terrain decides) |
| Graticules | a grid is the reserved cross-hatch |
| Sketches in the fog (beasts, ships) | imply hidden information |
| Margin vignettes of capitals | the margin is 26 units; tiny, and it duplicates the outliner |
| A warm-cool sheet gradient, an edge fade | light on the cloth (R19) |
| Animated water or vignettes | motion on the map competes with tokens and the walk bob |

---

## 4. Lettering

### 4.1 Faces (Google Fonts, OFL; self-hosted woff2 in the game)

| Role | Face | Why |
|---|---|---|
| Place names | **Alegreya** 500 (capitals 700) | a literary serif with a calligraphic rhythm, the best small-size serif in the set; pairs with the chrome's Alegreya Sans |
| Wild names | **Alegreya** italic 500 (was Alegreya Sans italic) | the approved color, sizes and spacing; now serif and curved |
| Region names | **Marcellus SC** (already loaded) | Trajan-like titling capitals, the cartouche's face, spaced wide |
| Cartouche | Marcellus SC (unchanged) | — |
| Chrome, chips, numbers | unchanged (Alegreya Sans, IBM Plex Sans Condensed) | approved |

Mockup link: add `&family=Alegreya:ital,wght@0,500;0,700;1,500` to the existing Google Fonts URL.
Game: `src/assets/fonts/` gains Alegreya 500, 700 and 500 italic (latin subset woff2, about 30 to 45
KB each) with `OFL.txt`.

### 4.2 Sizes per zoom (CSS px at UI scale 100%)

| Label | Far | Mid | Near |
|---|---|---|---|
| Place name | 11 (capital 12, 700), by priority | 13 (capital 14) | 15 (capital 16) |
| Wild name | 11 to 13 | 12 to 16 by area (approved 11 to 16) | 15 to 20 |
| Region name | 15 to 24 by component size, letter-spaced 0.3 em | — | — |

Never below 11 px. The Mid label budget stays 96 × 30 px and 2 lines; box widths are measured with
the new face and include the halo.

### 4.3 Curved labels

- **Wild names** follow a spine: for a range of 2 or 3 cells, a polyline through the cells'
  centroids ordered along the principal axis, extended 10% at both ends, two Chaikin passes; for
  one cell, an arc along its long axis with a sagitta of 6% of its length.
- **Region names** follow the bowed axis of §3.9.
- **Setting text on a path:** resample the path at equal arc steps; place each glyph at its kerned
  advance (prefix measurements) plus manual tracking (`ctx.letterSpacing` is too new to rely on);
  rotate to the tangent; flip the path if it runs right to left (keep upright); reject the layout
  if two adjacent glyphs turn more than 45° (Mapbox's `text-max-angle`); try 90% size, then a
  straight line; else skip (`research-techniques.md` §10).
- **Collision:** curved labels contribute one oriented box per glyph to the label test.
- **Province names stay straight.**

### 4.4 Halos

- **Place names (default, H8):** ink #2A1F14 filled over a halo stroke of #F2EAD6 at 85%, 3.5 px,
  round joins: lettering on a breath of paper (10.58:1 at worst).
- **The approved style (A/B):** #F4EEDF on rgba(20,18,15,.85), 3 px.
- **Region names:** no halo; translucent ink per terrain (3.60:1 at worst).
- **Wild names:** no halo (approved).
- The second line (dominion chip, glyph discs) is unchanged.

---

## 5. Readability guard

### 5.1 Map modes

- In every mode but Ownership the whole decoration layer fades out over 150 ms (R23): paint,
  paper, textures, water, tracks, landmarks, camps, spring stones, vignettes. Region names hide.
  The mode tints a plain fill, exactly as tested.
- The always-on layer (wilds, borders, bands, marks, the Wellspring) keeps full contrast in every
  mode. The borders' wobble stays, since it is the geometry.

### 5.2 Selection and targeting

- While commanders are selected (move targeting) or a ritual is targeting, the decoration layer
  dims to **60%** over 150 ms and region names hide; the 45° move hatch and the ritual hop outline
  read on a quieter ground. Labels, bands, wilds, tokens, chips and the path thread are unchanged.
- Hovering a province changes nothing in the decoration.

### 5.3 Fog

- **Unexplored** ("not yet painted"): D1 is the hazed base and the paper tooth only (no mottle, no
  edge pool): bare cloth with a breath of color. Terrain stamps, tracks (dots at 50%), brook (one
  pencil line at 50%), pond (outline), landmark (outline), camp (outline domes) are line art in the
  fog sepia #3E3428 or #E8DCC2 per fill (final §3.10). No spring stones, no settlement beyond the
  sketched hut. Region names show (terrain is public).
- **Out of sight:** painted, with the fill desaturated 10% (R18); spring stones as last known.
- Every input is `provinceView` or public map data; the fog guard test covers the new outputs.

### 5.4 The density budget

| Item | Mid | Near |
|---|---|---|
| Standing items (stamps, landmarks, camp tents, spring stones, motifs) | ≤ 30 per average province (unchanged) | ≤ 60 |
| Coverage of standing items and ponds | ≤ 60% (unchanged) | ≤ 75% |
| Brooks, ponds, terrain landmark, ruin, vignette | ≤ 1 each | ≤ 1 each |
| Tracks | one per neighbor, 1.6 px dots | same |
| Boxes (label, token, seat, plus 4 px) | no standing item, no water, tracks broken; paint flat | same |

The label test (final §3.5) also checks spring stones, camps, landmarks, bridges and vignettes
against every label, token and seat box, and curved labels by glyph boxes.

### 5.5 Colorblind checks

Every new information mark carries a non-hue channel: tracks by placement (across borders, dots),
camps by count and dome shape, spring stones by symbol, the Wellspring by its basin and diamond,
wilds by darkness and rim. The painted extremes keep the band rule (0 fails), and terrain pairs keep
≥ 11.2 at blotch extremes under every deficiency (§1.6). The mockup's Vision control (Protan,
Deutan, Tritan) is part of the review (step 14).

### 5.6 Settings

Map detail **Full**: everything here. **Reduced**: no paint (D1 is the flat fill, as Phase 8), no
paper, stamps at half density (approved), no vignettes; tracks, water, landmarks, camps, spring
stones and region names stay (cheap, and Reduced never removes information).

---

## 6. Owner-made art (ChatGPT images)

### 6.1 What can be an image

| Entry | Image | Size | File (`art-inbox/map/`) | Lands at (`src/assets/raster/map/`) | Budget | Fallback |
|---|---|---|---|---|---|---|
| H1 | Paper tile (seamless) | 1024 × 1024 | `paper__{x}.png` | `paper.webp`, 512² grey | ≤ 80 KB | procedural tooth and fibres |
| H2 | Broadleaf clumps (16) | 1024 × 1024 | `trees-broadleaf__{x}.png` | `trees-broadleaf.webp` + `.json` | ≤ 200 KB | the clump generator (§2.4) |
| H3 | Conifer clumps (8) and single trees (8) | 1024 × 1024 | `trees-conifer__{x}.png` | `trees-conifer.webp` + `.json` | ≤ 200 KB | the clump generator |
| H4 | Hills (8) and snowless peaks (8) | 1024 × 1024 | `relief__{x}.png` | `relief.webp` + `.json` | ≤ 200 KB | humps and ridge peaks (§2.3) |
| H5 | Landmarks (16) | 1024 × 1024 | `landmarks__{x}.png` | `landmarks.webp` + `.json` | ≤ 220 KB | code paths (§3.4) |
| H6 | Title cartouche frame | 1536 × 1024 | `cartouche__{x}.png` | `cartouche.webp` | ≤ 120 KB | the ink scroll frame |
| H7 | Compass rose | 1024 × 1024 | `compass__{x}.png` | `compass.webp` | ≤ 60 KB | the procedural rose |
| H8 | Corner ornament (top-left; mirrored) | 1024 × 1024 | `corner__{x}.png` | `corner.webp` | ≤ 60 KB | the double neatline alone |
| H9 | Vignettes (8), after H2 | 1536 × 1024 | `vignettes__{x}.png` | `vignettes.webp` + `.json` | ≤ 120 KB | code paths (§3.10) |
| H10 | Wellspring basin, after H2 | 1024 × 1024 | `wellspring__{x}.png` | `wellspring.webp` | ≤ 60 KB | the approved basin |

**Stays procedural:** wild peaks and ripples (information, measured colors, flat shadow faces),
settlements and kits (grow house by house, kit tones tested), tracks, brooks, ponds, borders,
bands, labels, every information mark.

**Budget:** map sheets ≤ 1.1 MB, loaded after the first frame; the procedural art draws first and
the next bake swaps in the raster. docs/09's raster cap rises from 2 MB to 3 MB (§8).

**Order:** H1, H2 and H6 first (they change the feel most); H3 to H5 once H2 is approved as the
family anchor; H7 to H10 last. Raster integration stays last in the cut order (R29).

### 6.2 How the owner uses these prompts

- One image per request in ChatGPT; download the PNG; rename as the table says; drop it in
  `art-inbox/map/`; run `npm run art:intake`; approve on the contact sheet.
- Paste the prompt exactly, with one substitution: where it says `[style sentence]`, paste the
  style sentence block below in its place. `{x}` in a file name is anything. For H3, H4, H5, H9
  and H10, attach the approved H2 image as "Image 1: style reference" and keep the prompt's first
  sentence, which tells ChatGPT what to preserve.
- **Transparent backgrounds:** ask as written. If the image shows a checkerboard painted into it,
  or a solid color behind the items, reply: "Make the background truly transparent (an alpha
  channel), not a drawn checkerboard. Change nothing else." If that fails twice, reply: "Put the
  items on a perfectly flat pure white background (#FFFFFF) with nothing else. Change nothing
  else."; the intake keys white out (luminance above 250 and chroma under 4 becomes transparent,
  with a 2 px feather), which works because every item has an ink outline.
- If ChatGPT adds letters, a frame or a signature: "Remove all text, letters, numbers, signatures
  and frames. Change nothing else."

**The style sentence** (repeated in every prompt below, never naming a game, studio or artist):

```text
Style: hand-painted fantasy map art, as in a finely illustrated atlas: confident sepia-brown ink
linework of lively, varying weight; transparent watercolor washes that pool slightly darker at
their edges and let warm paper show through; soft pigment granulation; muted, natural, slightly
desaturated colors; one soft light from the upper left, warm on lit sides, with cool blue-grey
shadows on the lower right. Calm, elegant and readable.
```

### 6.3 Prompts

**H1. Paper tile** (square 1024 × 1024)

```text
A seamless, tileable texture of warm off-white handmade watercolor paper, seen straight on and
filling the whole square image. A fine cold-press tooth, soft irregular mottling a few percent
lighter and darker, and faint short paper fibres that mostly run left to right. Very low contrast.
Even, flat lighting: no shadows, no gradient across the image, no vignette, no darker corners.
Color near #E8DCC2. No stains larger than a fingertip, no folds, no creases, no torn edges, no
woven or grid pattern, no diagonal lines, no drawings, no text, no letters, no logos, no border.
The left edge must continue seamlessly into the right edge, and the top edge into the bottom edge.
Square image.
```

- **Intake:** wrapped seams mean ΔE2000 ≤ 3; converted to luminance; mean set to 128 and contrast
  clamped to ±20; gradient-orientation energy within 10° of 45° and 135° ≤ 10% (R26); no FFT peak
  above 6× the median off the center (no grid); downscaled to 512².

**H2. Broadleaf tree clumps** (square 1024 × 1024; the family anchor)

```text
A sheet of 16 separate small illustrations of broadleaf tree clusters for a top-down fantasy map,
arranged in a loose 4 by 4 grid with wide empty space around every cluster so that no two touch
and none touches the edge of the image. Each cluster is 2 to 6 round, softly lobed tree crowns
overlapping one another, seen from above at a slight three-quarter angle, the way trees are
painted on an illustrated map. Each cluster has one clean sepia ink outline around its outer
edge and only light, broken lines inside; a lit side toward the upper left, a darker shadow side
toward the lower right, and a small soft cool grey shadow on the ground to its lower right.
Vary them: small and large, tight and loose, one or two with a slightly taller tree. Muted mid
greens with warmer lit edges.
[style sentence]
Transparent background. No ground, no grass, no paper texture behind the clusters, no trunks
except a short stub under the front trees, no flowers, no fruit, no text, no letters, no numbers,
no signature, no frame. Square image.
```

**H3. Conifers and single trees** (square; attach H2 as Image 1)

```text
Image 1 is the style reference: match its ink line, washes, light direction, shadow and scale
exactly. A sheet of 16 separate illustrations on a transparent background, in a loose 4 by 4 grid
with wide empty space around each and none touching the edge. Top two rows: 8 clusters of 2 to 5
conifers with narrow, pointed, layered crowns, overlapping, one clean sepia outline around each
cluster's outer edge. Bottom two rows: 8 single round broadleaf trees with a short trunk, each
alone. Same light from the upper left and the same small cool shadow to the lower right of each.
[style sentence]
Transparent background. No ground, no snow, no text, no letters, no signature, no frame. Square
image.
```

**H4. Hills and snowless peaks** (square; attach H2 as Image 1)

```text
Image 1 is the style reference: match its ink line, washes and light exactly. A sheet of 16
separate illustrations on a transparent background, in a loose 4 by 4 grid with wide empty space
around each and none touching the edge. Top two rows: 8 low, rounded hills seen from the side at
a slight angle, each with a few short curved slope strokes on its lower-right side only, following
the fall of the slope. Bottom two rows: 8 small rocky mountain peaks in side profile, alone or in
groups of two or three, each with a lit left face and a darker, flat, untextured right face, and
an ink outline that is heavier near the summit. No snow anywhere. Muted ochre and grey-blue
washes.
[style sentence]
Transparent background. No trees, no snow, no cliffs, no straight diagonal hatching across whole
shapes, no cross-hatching, no text, no letters, no signature, no frame. Square image.
```

**H5. Landmarks** (square; attach H2 as Image 1)

```text
Image 1 is the style reference: match its ink line, washes, light and shadow exactly. A sheet of
16 separate small landmark illustrations for a top-down fantasy map, on a transparent background,
in a loose 4 by 4 grid with wide empty space around each and none touching the edge, all seen
from above at a slight three-quarter angle, each with a small soft cool shadow to its lower right:
1 a broken stone arch; 2 three broken columns on a low stone step; 3 a doorway cut into a small
cliff face; 4 a timber-framed mine entrance in a hillside with a small spoil heap and an empty
mine cart; 5 a stone windmill with four sails set at a slant; 6 a wooden plank footbridge; 7 a
small arched stone bridge; 8 a row of half-sunken columns among reeds and still pale water; 9 a
broken stone obelisk; 10 a grassy barrow mound with a stone doorway; 11 a fallen giant tree trunk
with its roots; 12 a toppled stone statue lying face down; 13 a rocky outcrop with a cave mouth;
14 a ruined stone wall fragment with one empty window; 15 a three-arched ruined aqueduct segment;
16 a flat-topped rock mesa with layered stripes. Weathered pale stone, grey-brown timber, muted
moss greens only in crevices.
[style sentence]
Transparent background. No people, no animals, no flags, no banners, no pennants, no fire, no
smoke, no tents, no standing stones, no stone circles, no shrines, no candles, no towers, no
stacked-stone cairns, no skulls or bones, no houses or huts, no wells, no fences, no bright colors,
no text, no letters, no signature, no frame. Square image.
```

**H6. Title cartouche** (landscape 1536 × 1024)

```text
An ornate but restrained title cartouche for a fantasy map, on a transparent background: a wide
horizontal frame of scrolled parchment ends and fine strapwork, drawn in sepia-brown ink with a
pale warm parchment wash, oak leaves and acorns curling from both ends, a little cool shadow under
the scrolls. The frame fills about 80% of the image width and a third of its height, centered.
The center of the frame is an EMPTY, blank, pale parchment panel with nothing on it, ready for a
title to be added later.
[style sentence]
Transparent background outside the frame. No letters, no words, no numbers, no symbols, no coats
of arms, no crowns, no flags, no figures, no signature. Landscape image.
```

**H7. Compass rose** (square 1024 × 1024)

```text
An elegant eight-pointed compass rose for a fantasy map, on a transparent background, centered
and filling about 80% of the image: four long main points and four shorter ones between them, the
north point slightly longer with a small leaf-shaped tip, a thin double ring behind the points.
Sepia-brown ink linework, each point split into a lit half and a shaded half in pale parchment
and soft grey-brown washes, light from the upper left.
[style sentence]
Transparent background. No letters (no N, E, S or W), no numbers, no degree marks, no symbols, no
text, no signature. Square image.
```

**H8. Corner ornament** (square 1024 × 1024)

```text
One ornamental corner piece for the top-left corner of a fantasy map's border, on a transparent
background: two thin straight ink rules meeting at a right angle in the top-left of the image, and
at the corner a small, restrained cluster of oak leaves and acorns with a curl of strapwork,
extending no more than a third of the way along each rule. Sepia-brown ink with pale parchment and
muted green-brown washes, light from the upper left.
[style sentence]
Transparent background. Nothing in the rest of the image. No letters, no symbols, no animals, no
faces, no signature. Square image.
```

**H9. Vignettes** (landscape 1536 × 1024; attach H2 as Image 1)

```text
Image 1 is the style reference: match its ink line, washes, light and shadow exactly. A sheet of
8 separate tiny illustrations for a top-down fantasy map, on a transparent background, in two rows
of four with wide empty space around each, seen from above at a slight three-quarter angle, each
with a small soft cool shadow to its lower right: 1 a flock of five sheep; 2 two deer; 3 a grey
heron standing in a few reeds; 4 three mountain goats on a small rock; 5 a hay wagon parked, loaded
with hay, no horse; 6 a small swirling dust devil; 7 a fox; 8 a pair of geese on the ground.
[style sentence]
Transparent background. No people, no riders, no buildings, no flags, no text, no letters, no
signature, no frame. Landscape image.
```

**H10. Wellspring basin** (square; attach H2 as Image 1)

```text
Image 1 is the style reference: match its ink line, washes and light exactly. One small
illustration, centered, on a transparent background: a sacred spring for a fantasy map, a round
weathered stone basin set into the ground and brimming with clear pale water, a thin brook running
out of it toward the lower right, a few small wildflowers and soft moss around the stones, a faint
pale mist above the water. Seen from above at a slight three-quarter angle, with a small soft cool
shadow to the lower right.
[style sentence]
Transparent background. No standing stones, no statues, no colored lights, no glowing symbols, no
crystals, no people, no text, no letters, no signature, no frame. Square image.
```

### 6.4 Intake checks (`scripts/art-intake.ts`, kinds `map/*`)

- **Alpha:** PNG with an alpha channel; at least 40% of pixels fully transparent (sheets), or the
  white key-out applied. **Fake transparency:** a periodic two-grey checker of 8 to 16 px tiles in
  the "background" is refused with "fake transparency; ask again".
- **Components:** alpha above 0.5, connected, at least 0.2% of the image each; the count matches the
  entry (16, or 8 for H9, 1 for H6 to H8 and H10) within ±2; none touches the image edge.
- **Light:** for at least 75% of components, the upper-left half's mean luminance exceeds the
  lower-right half's.
- **Ink:** at least 3% of each component's opaque pixels darker than 25% luminance (an outline).
- **Reserved patterns:** gradient-orientation energy within 10° of 45° or 135° ≤ 10% per component.
- **Color:** H5 to H10: 99th-percentile chroma C\* ≤ 30 (near-neutral). H2 to H4: any color (they
  are recolored).
- **Text:** the owner confirms "no letters" on the contact sheet.
- **Output:** each component framed in a 256² cell (H9: 128²), centered, its base on a baseline at
  85% of the cell, packed into a 1024² (or 2048 × 1024) atlas with a JSON of frames, kinds and
  anchors; WebP quality 85; the provenance sidecar as final's "Provenance".

### 6.5 Recoloring at use

- **Terrain sheets (H2 to H4):** per pixel, luminance L; ink where L < 0.22 (feature ink #3E3428 at
  the pixel's alpha); otherwise mix(shade face, lit face, smoothstep(0.35, 0.8, L)) with the
  terrain's warm-cool faces (§1.5), keeping alpha. The image supplies form and brush; the palette
  stays the palette (H9). Conifers on Forest use Forest's faces; hills on Hills, peaks on
  Mountains.
- **Neutral sheets (H5 to H10):** drawn as they are, with the cast shadow from the image itself.
  The cartouche's title stays procedural Marcellus SC; the compass's "N" stays procedural.
- **Variants:** each frame is a variant; slots pick frames by seed (`frame = hash32(seed, id, slot)
  mod frames`); a mirror flag doubles variety. Missing or refused sheets fall back per entry.

---

## 7. Performance and baking

### 7.1 Cost (from `research-techniques.md` §11, software raster, 105-province bench)

| Stack | Far sheet | Mid sheet | Near 512² tile |
|---|---|---|---|
| Flat fill and ink borders | — | 62 ms | — |
| Lean paint (wash 6, shadow edge, grain, bloom, stamps, ink, paper) | — | 738 ms | — |
| Full paint | 633 ms (146 points per province) | 1,680 ms | about 100 ms |

This design uses one opaque base plus pairs of blotches (cheaper than the bench's 18-layer wash),
the shadow edge (151 ms), granulation (96 ms), blooms (42 ms) and paper: about the lean stack.

### 7.2 Mockup budgets (headless Chromium 1194 at 1440 × 900, DPR 1, `perf.cjs`)

| Item | Budget |
|---|---|
| Once per load: shared polylines, noisy polygons, tracks, brooks, ponds, landmark and camp slots, regions, paper and granulation tiles | ≤ 120 ms total, logged under `PROF.init` |
| First paint (Mid composite, every province) | ≤ 1.5 s |
| Per-province Mid re-bake | ≤ 16 ms; at most 12 ms of bakes per frame after the first paint (unchanged budget) |
| Near province bake | ≤ 25 ms |
| Pan and hover | 60 fps (blit only), `panFps` p95 frame ≤ 16.7 ms at Mid, Near and lean-back |
| Time-lapse step | ≤ 8 province re-bakes animate; the rest swap at once |

### 7.3 The game (Pixi v8)

- **One painter, two hosts:** pure painters over a `CanvasRenderingContext2D`-shaped interface in
  `src/render/map/paint/` (wash, paper, relief, forests, water, tracks, landmarks, camps, springs,
  vignettes, labels-on-path layout), fed by pure geometry from `src/present/map/` (`edges.ts`,
  `tracks.ts`, `water.ts`, `landmarks.ts`, `regions.ts`, `curveText.ts`).
- **Bake in a worker:** `OffscreenCanvas` 2D (Chrome 69, Firefox 105, Safari 16.4); results go to
  Pixi through `ImageBitmap` sources. Far and Mid at load behind the loading screen; Near lazily
  in 512² tiles (LRU 32, unchanged).
- **Bake budgets:** Medium (60 provinces) Far + Mid ≤ 1.0 s in software, Large 4 nations ≤ 2.4 s,
  measured on GPU canvas in the Playwright performance smoke; a re-bake ≤ 16 ms per province in the
  worker, with the main thread swapping at most 3 ms of textures per frame (final §3.8). final's
  "full Mid bake on Medium ≤ 150 ms" now applies to Map detail Reduced.
- **GPU memory:** unchanged. The paint lives inside the existing decoration textures (Mid 13.6 MB
  for 85 provinces at DPR 2, Far 3.1 MB, Near ≤ 32 MB); total table and map ≤ 96 MB (final §2.12).
  Stamp atlases and owner sheets stay in the worker as `ImageBitmap`s (≤ 30 MB CPU), never on the
  GPU. At most 2 workers; release canvases when done (Safari's total canvas memory).
- **Live layers:** fills as one batch of `Graphics` from the simplified noisy polygons (earcut);
  borders as one `Graphics` of ribbons; bands as inner strokes clipped per province; wilds from one
  atlas; labels: place names as cached `Text` with stroke halos, curved wild and region names as
  per-glyph sprites from a `BitmapFont` (or `SplitBitmapText`) laid out by `curveText.ts` on band
  change. Draw calls for the map ≤ 15, table ≤ 4.
- **Hit test:** an ID map (R8, nearest filtering, 1 texel per unit, 0.7 MB on Medium, CPU copy)
  rasterized from the same noisy polygons, with a point-in-polygon check against the site's cell
  and its neighbors near boundaries. Test: sampled points agree with the polygons.
- **Context loss:** every bake and the ID map rebuild from seed and state.
- **Later optimization (not M1):** a density texture plus palette shader (`pow(palette[id], 1 + d)`,
  `research-techniques.md` §11.3) if decoration memory gets tight.

### 7.4 Tests

- `tests/present/map/edges.test.ts`: both sides of every shared edge use the same polyline,
  reversed; endpoints are the original vertices; no province or wild polygon self-intersects on
  seeds 1 to 30 × Small, Medium, Large × 2 and 4 nations; every point lies inside its edge's quad;
  simplification keeps both sides equal.
- `tracks.test.ts`: exactly one track per unordered neighbor pair and none otherwise; no sample in a
  wild cell or a third province; ends on the settlement extents; same output across runs.
- `water.test.ts`: every brook and pond point lies inside its province inset by a band width plus
  6 px and outside every box; probabilities by terrain over 30 seeds within ±10% of §3.3.
- `landmarks.test.ts`: one mine on every Hills and Mountains province, one windmill on every
  Farmland province; ruins 20 to 30%; landmark, vignette and camp ids disjoint from `POLE_MOTIFS`,
  `LAND_LOOKS`, settlement pieces, scars, siege and pillage marks (H6).
- `regions.test.ts`: components connected, one terrain, size ≥ 3, at most provinces / 10; names
  unique against provinces and wilds.
- `tests/content/palette.test.ts` gains §1.6's checks: the band rule against painted extremes; name,
  region and wild label contrast; tracks ≥ 3:1 at 85%; landmark and camp tones; water against
  banners with the inset rule recorded.
- `tests/content/presentation.test.ts` (reserved patterns): hachures, fibres, furrows, hedges,
  tracks, brooks and the grain tile.
- Fog guard: changing a hidden province's springs or population leaves its spring stones, camps and
  infields unchanged for the viewer.
- Playwright smoke: per terrain, painted mean ΔE2000 ≤ 2.0 (stamps off); bake times of §7.3; hit
  tests on wobbling borders; the label test at the start zoom and one Near zoom.
- Intake: fixtures for a fake checkerboard, a missing alpha, a component on the edge, a 45° hatch.

---

## 8. Docs text

### 8.1 `docs/09-art-direction.md` (the staged copy with the war table text applied)

**1. "Color palettes": replace "A seamless noise texture at 10% opacity is multiplied over every
fill. Borders #2B2620 at 2px." with:**

```markdown
In Ownership mode each fill is painted as a watercolor wash on the cloth's paper tooth (see "The
painted map's hand"); the paint never moves a province's mean color more than CIEDE2000 2 from its
fill, and data modes tint the plain fill. Borders are #2B2620 ink, 2 px on average.
```

**2. Add this section after "The painted map":**

```markdown
## The painted map's hand

Added on 2026-10-22 at the owner's direction: "im working on the art but i need the game map to be
more interesting and detailed, a hand drawn feel - so far looking good", and "i like final fantasy
14 and much concept art as insiration". The inspiration is Final Fantasy XIV's painted maps and
its concept art, taken as style principles only: painted ground under crisp information, paper
under pigment, an ink line with a transparent wash, one light from the upper left with warm lit
sides and cool shadows, a tier of names per zoom, illustrated landmarks that say what the land is,
and elegant lettering. Nothing of that game is copied: no map images, layouts, region shapes,
place names, icons, symbols, logos, fonts or characters. Prompts for owner-made images describe
qualities and never name a game, studio or artist.

- **Paint.** Each province is a wash of its fill: lighter in the middle, pooled darker at its edge
  (an inner pool about 6 px and a fine pooling line), a slow mottle (±4 L* on Plains and Forest, ±3
  on Farmland, ±2 elsewhere), granulation in the earths and greys, a bloom or two, and the cloth's
  paper tooth over all, mean-neutral. Label, token and seat boxes are painted flat. The painted mean
  stays within CIEDE2000 2 of the fill. Wilds are never painted. Nothing grades or lights the cloth.
- **Ink.** Borders follow one seeded wobbling line per shared edge, the same line the fill, band,
  hover and hit test use; their width varies ±12% and they never break or taper (a dotted border
  means fog). Drawn features use sepia #3E3428 (or #E8DCC2 on Forest, Hills and Swamp) and may
  taper and break. The map's outline has a double neatline.
- **Light.** One light from the upper left: stamp lit faces lean warm (#F6D9A0 at 12%), shadow
  faces cool (#3A4466 at 14%), and every standing stamp casts a cool shadow rgba(38,42,64,.22) to
  the lower right.
- **Terrain drawing.** Forests are clumps of lobed crowns with one outer ink outline, conifers where
  a forest borders mountains; hills are humps with a few hachures on their lower right; passable
  mountains are snowless profile peaks with flat shadow faces. Hachures avoid 33° to 57° and 123°
  to 147°. Only wild rims carry cliff ticks, and only wild peaks carry snow.
- **Tracks** join every pair of neighboring provinces, from settlement to the middle of the shared
  border to settlement, as sepia dots that stop short of the border and break under labels. No
  other pair has one, and none crosses a wild.
- **Water.** Brooks (pale #BCD6D9 between two #35535A banks) and ponds (#A6C7CC) lie inside one
  province, a band width plus 6 px from every border; they are scenery. Dark water is always a wild.
- **Landmarks.** Every Hills and Mountains province has a mine, every Farmland province a windmill;
  about a quarter of provinces have an old ruin; bridges stand where tracks cross brooks.
  Independent provinces show 1 to 4 bell tents by their strength word. Known mana springs show as
  small spring stones with their symbol. A Wellspring is a glowing basin with five drops in the
  five mana colors. Scenery never borrows an information shape: no watchtowers, standing stones,
  shrines, cairns, huts, flags, fire or smoke.
- **Lettering.** Place names in Alegreya, dark ink #2A1F14 on a paper halo #F2EAD6 at 85%; wild
  names in Alegreya italic #E9E4D8, curved along the range; region names (runs of three or more
  provinces of one terrain, named from content) in letter-spaced Marcellus SC at far zoom only,
  #33261A or #F1E8D2 at 85%.
- **Near zoom** adds one small vignette per province: sheep, deer, a heron, goats, a haywain, a
  dust devil. No people.
- **Owner-made map art** (paper, tree clumps, hills and peaks, landmarks, cartouche, compass, a
  corner ornament, vignettes, the Wellspring basin) supplies form and brushwork only: terrain
  stamps are recolored through their luminance into each terrain's faces, and the rest must be
  near-neutral. Wild peaks, settlements and information marks stay procedural.
```

**3. "Impassable terrain": append to the "Meres" bullet:**

```markdown
 Dark water always means a wild; brooks and ponds elsewhere are pale.
```

**and replace "and a name in italic, letter-spaced #E9E4D8." with:**

```markdown
and a name in letter-spaced italic #E9E4D8 that curves along the range.
```

**4. "Delivery rule": in the raster paragraph, replace "Rasters in the bundle total at most 2 MB."
with:**

```markdown
Rasters in the bundle total at most 3 MB, of which map sheets (paper, stamp sheets, cartouche,
compass, ornaments) take at most 1.1 MB and load after the first frame.
```

### 8.2 `docs/07-ui.md` (the staged copy with the war table text applied)

**1. "### Drawing": replace the bullet "Provinces are filled polygons: terrain color with a subtle
noise texture and a 2 px border, painted with ground textures, terrain stamps, settlements and land
looks (docs/09 "The painted map", "Growth and alignment on the map")." with:**

```markdown
- Provinces are filled polygons painted as watercolor washes on the cloth, with ground textures,
  terrain stamps, settlements and land looks (docs/09 "The painted map", "The painted map's
  hand", "Growth and alignment on the map"). Borders are hand-ruled ink, 2 px on average, along
  the same wobbling line the hover outline and the click test use.
- Dotted tracks join every pair of neighboring provinces and never cross a wild. Brooks and ponds
  are scenery; dark water is a wild. The Codex concept "Tracks" says so.
```

**2. "### Modes": in "Decoration steps aside", replace "(ground textures, stamps, settlements,
motifs, scars)" with "(paint, ground textures, stamps, tracks, water, landmarks, settlements,
motifs, scars)", and add after "Contextual modes":**

```markdown
- **Quieter while targeting:** while commanders are selected or a ritual targets, the decoration
  layer dims to 60% and region names hide; labels, bands, wilds, tokens and chips are unchanged.
```

**3. "### Labels and the density budget": replace the bullet "- **Far:** names only, culled by
priority (capitals, Wellsprings, own provinces, then the rest), and one badge per nation per
province." with:**

```markdown
- **Far:** names only, culled by priority (capitals, Wellsprings, wild names, region names, own
  provinces, then the rest), and one badge per nation per province. Region names are spaced
  capitals across runs of three or more provinces of one terrain.
```

**and add at the end of the subsection:**

```markdown
- **Lettering:** names are dark ink on a paper halo (Alegreya); wild names curve along their
  range. Curved labels take part in the overlap test glyph by glyph. Nothing is lettered below
  11 px.
```

**4. "### Moving": append to the "Path previews" bullet (M1-should):**

```markdown
 They follow the tracks from settlement to settlement.
```

**5. "### Fog": append to the "Unexplored provinces" bullet:**

```markdown
 Tracks, brooks, ponds, landmarks and independent camps show as pencil line art; spring stones
  do not.
```

**6. "## Changes from the previous version of this document": add:**

```markdown
12. **The painted map's hand (2026-10-22, the owner's direction: "i need the game map to be more
    interesting and detailed, a hand drawn feel"):** watercolor washes on the cloth, hand-ruled
    borders, tracks between neighbors, brooks and ponds, mines, windmills and ruins, independent
    camps, spring stones, an illustrated Wellspring, region names at far zoom, ink lettering and
    curved wild names, and a quieter map while targeting.
```

### 8.3 `docs/09-balance.md`: rows dated 2026-10-22 ("Map presentation")

```markdown
| Border wobble | amplitude 0.2 of the site segment, to 3 units, 2 Chaikin passes | src/content/presentation/map/paint.ts | 2026-10-22, hand-drawn pass |
| Wash | mottle ±4/±3/±2 L*, edge pool −5 to −8 L*, painted mean within CIEDE2000 2.0 | same | same |
| Tracks | one per neighbor pair, dots 1.6 px every 3.5 px at 85% | same | same |
| Brooks, ponds | probability by terrain (Hills, Mountains, Swamp 0.6; Forest 0.5; Plains 0.4; Farmland 0.3), inset band + 6 px | src/content/presentation/map/water.ts | same |
| Ruins | 25% of provinces | src/content/presentation/map/landmarks.ts | same |
| Region names | runs of ≥ 3 provinces, at most provinces / 10 | src/content/presentation/map/regions.ts | same |
| Targeting dim | decoration at 60% | src/content/ui.ts | same |
```

---

## 9. Mockup brief

**Where:** edit the parts in `wartable-design/mock-work/parts/` (v2 parts are backed up in
`handdrawn-design/parts-v2-backup/`); build with `mock-work/build.sh` into
`ui-mockup/game-screen.html` (v3); keep `game-screen-v2.html`. Seeds come from `rngFor(key)`;
never `Math.random`. d3 7.8.5 from cdnjs stays the only script. "N px" below means N × `PX` world
units (`PX = 1 / BAND_RES[band]`, as p50 uses it); counts scale with `areaOf[i] / MEAN_AREA`.

**Order:** what changes the feel most comes first; every step must leave the mockup working.

### Step 0. Controls (p00c-body.html, p80d-rest.js, p40-scene.js `view`)

- In `#mockctl` add `Hand: Painted | v2` (`view.hand`), `Labels: Ink | Approved`
  (`view.labels`), `Borders: Wobble | Straight` (`view.borders`). `Hand: v2` restores every v2
  path, so the owner can A/B the whole pass.
- Add `view.hand` and `view.borders` to `lookKey` and `staticSig`, and call `invalidateBakes()` on
  change; `view.labels` only needs `requestDraw()`.
- "Try this" gains: "6 Switch Hand, Labels and Borders to compare with v2."
- A `?paintcheck` URL flag (step 13).

### Step 1. Washes on paper (p50-deco.js; p60-draw.js `fillFor`)

- Split `fillFor`'s default branch into `ownFill(p)` (terrain fill with haze, fog desaturation or
  the land-look mix) and use it from `fillFor`.
- Add `const PAINT = { plains: { M: 4, E: -7, G: 0.25, B: 1, lift: 1.2 }, farmland: { M: 3, E: -7,
  G: 0.2, B: 0, lift: 1.2 }, forest: { M: 4, E: -5, G: 0.45, B: 0, lift: 0.8 }, hills: { M: 2, E:
  -6, G: 0.6, B: 1, lift: 1.0 }, mountains: { M: 2, E: -7, G: 0.7, B: 1, lift: 1.2 }, swamp: { M:
  2, E: -6, G: 0.35, B: 2, lift: 1.0 }, wasteland: { M: 2, E: -8, G: 0.8, B: 1, lift: 1.4 } }`.
- Tiles, built once: `PAPER` (256², value noise 128 ± 20 at 1.5 px and 24 px, 400 fibres 3 to 8 px
  within ±25° of horizontal in rgba(90,70,40,.10) and rgba(255,250,235,.14), drawn wrapped) and
  `GRAN` (128², value noise 128 ± 26 at 1.5 px). Patterns with `setTransform(new DOMMatrix([k, 0,
  0, k, 0, 0]))`, k = 1 / `BAND_RES.mid` (world-locked across provinces).
- New `paintGround(g, i, band)`, called first in `drawProvinceDeco` inside its clip, when
  `view.hand === 'painted'`: §2.2 steps 1 to 7, then paper (`soft-light`, 0.5). The flat region is
  `exclusions(i, band)`; build the "polygon minus boxes" clip with `evenodd` rects. Inner shadow:
  `g.shadowBlur = {far: 4, mid: 6, near: 8}[band] * spriteRes(band) * PX`, `shadowColor` =
  `rgba(shadeL(f, -28), .45)`.
- Unexplored: base `ownFill` and paper only (no mottle, edge or blooms).
- Wild bakes get no paint or paper.

### Step 2. Hand-ruled borders on shared polylines (p10b-core.js, p50-deco.js, p60-draw.js, p80d-rest.js)

- After `areaOf` in p10b-core.js: `EDGE` (Map `min:max` → `{ a, b, i, j, pts }`) from consecutive
  vertex pairs shared by `cells[i]` and a `NB[i]` cell (equal within 0.01); skip outline edges.
  `noisy(a, b, p, q, R)`: if segment a-b does not cross segment p-q, `[a, b]`; else the recursion
  `c = lerp(p, q, 0.4 + 0.2 R())` on `(a, c, mid(a,p), mid(a,q))` and `(c, b, mid(b,p), mid(b,q))`
  down to `L = 3 * sqrt(MEAN_AREA / 6400)` units, then two Chaikin passes with endpoints fixed.
  Seed `rngFor(\`edge:12:${min}:${max}\`)`.
- `npoly[i]`: walk `cells[i]`, replacing each shared edge by its polyline in walk direction.
  `view.borders === 'straight'` makes `npoly = cells`.
- Replace `cells[...]` with `npoly[...]` in: the fill loop and wild fills (`renderStatic`), bands
  and keyline rings, hover and selection outlines (`draw`), `geo(i).poly` (clips, `inPoly` for slots;
  keep `distToEdge` on the convex `cells[i]` minus 6 units for speed), `bakeWildInto` clips.
- `wgeo(w).edges` become polylines from `EDGE` (wild cell against a cell not in the range); ticks
  are placed by arc length along them; the contour strokes them.
- Borders: replace the per-province `pathPoly(...); stroke()` loop with one ribbon per `EDGE`
  entry whose two sides are provinces: width `2 * px * (1 + 0.12 * sin(2π(f1 t + φ1)) + 0.05 *
  sin(2π(f2 t + φ2)))`, alpha 0.85 to 1, fill #2B2620; dotted 2/3 px when both sides are fogged.
- Hit test: `provinceAt(x, y)`: `i0 = nearest(x, y)`; return the first of `[i0, ...NB[i0]]` whose
  `npoly` contains the point; else `i0`. Use it in the three `nearest(x, y)` calls in p80d-rest.js.
- Neatline: keep the 3 px outline; add a 0.8 px #1C1A17 rule at 60% 5 px outside it (in
  `bakeCloth`).

### Step 3. Lettering (p00a-head.html, p60-draw.js `drawLabels`, p50-deco.js `nameFont`, `wgeo`)

- Fonts: add `&family=Alegreya:ital,wght@0,500;0,700;1,500` to the Google Fonts link; extend
  `fontsReady` to check `"13px Alegreya"`.
- `nameFont` (ink): `${cap ? 700 : 500} ${fs}px 'Alegreya', Georgia, serif` with fs 11/13/15 by
  band (capitals +1); draw `strokeText` with `lineJoin 'round'`, `lineWidth 3.5`,
  `rgba(242,234,214,.85)`, then `fillText` #2A1F14. `view.labels === 'approved'` keeps v2's code.
- `textOnPath(g, text, pts, font, track)` as `research-techniques.md` §10 (equal-step resampling,
  prefix advances, keep upright, 45° limit), returning glyph placements and oriented boxes.
- Wild names: spine per §4.3 (computed in `wgeo`), font `italic 500 ${nameFs}px 'Alegreya'`,
  tracking 0.12 em, #E9E4D8; fallback 90%, then v2's straight or vertical label.
- Region names: `REGIONS` once (components of `provList` by `terr` through `nbrs`, size ≥ 3, top
  `round(provList.length / 10)`, names from §3.9 by `rngFor('region:12:' + k)`), drawn at Far only,
  in Ownership mode and with nothing selected, before place names: Marcellus SC, 15 to 24 px,
  tracking 0.3 em, #33261A or #F1E8D2 at 85% by the run's terrain. Queue order: capitals,
  Wellsprings, wild names, region names, own provinces, the rest.

### Step 4. Forests, relief and shadows (p50-deco.js stamps)

- `faces(f)`: lit = `mix(shadeL(f, 12), '#F6D9A0', .12)`, shade = `mix(shadeL(f, -18), '#3A4466',
  .14)`; `palette()` returns them; stamp ink becomes `rgba(62,52,40,.8)` (#3E3428); settlement ink
  stays #1C1A17.
- `castShadow(g, x, y, w)`: ellipse at (x + 0.25w, y + 1 px), rx 0.6w, ry 0.22w, −10°, fill
  rgba(38,42,64,.22); called for every standing item in a first pass over `items` (sorted list),
  then the items. House shadows switch to this color.
- Forest clumps (§2.4): in `drawProvinceDeco`, for forest, group `stampSlots` into clumps; draw each
  clump with the stroke-then-fill outline trick; lobed crowns; trunks on the bottom row; conifers
  70% when `nbrs(i)` or a `NB[i]` wild of kind peaks includes Mountains or peaks, else 15%; crown r
  4 to 5.5 px (Mid), 5 to 7 (Near); Far: 4 masses of 6 crowns at r 6 px.
- `hump`: faces from `faces`; replace its three slope strokes with 4 to 6 tapered hachures at 6° to
  33° and 57° to 80°, #3E3428 at 0.75, length 0.35 to 0.55 w.
- `peakStamp`: build L and R ridges by 3-level midpoint displacement; lit face with a vertical
  gradient (+4 L\* at the top); shade face flat; ink 1.4 px at the apex tapering to 0.8 px. Used by
  passable Mountains (approved colors #B4C1C6 / #6E7F86) and wild peaks (approved colors, snow with
  a 3- to 5-tooth lower edge). Near: scree fans under passable peaks.
- Plains hedgerows in `ground()`: wavy, as crown dots r 1.4 px every 3 px in rgba(94,112,70,.6).

### Step 5. Tracks (p50-deco.js; new `TRACKS`)

- Once per map: for every `EDGE` whose sides are both provinces, midpoint `m` by arc length; for each
  side, start where the ray from the seat toward `m` leaves the ellipse (0.75 × `settleExtent`
  wide, 0.5 × tall); quadratic to `m` with control at the midpoint plus the normal × (0.10 to 0.20)
  × length × ±1 (seeded `track:12:${min}:${max}`); sample every 2 px at the Mid top; if a sample
  (except the last 3 px) leaves `npoly` of its side, halve the offset, then go straight.
- Drop samples within 3 px of `m` and inside any `exclusions(side, band)` box plus 2 px (gaps).
- Draw in D5: per half, `setLineDash([0.1 * PX, 3.4 * PX])`, `lineCap 'round'`, `lineWidth 1.6 *
  PX`, color #3E3428 or #E8DCC2 (forest, hills, swamp) at 0.85.
- Remove `footpath()` for Mountains (tracks replace it).
- Stamps: drop slots within (stamp radius + 2 px) of any track sample (precompute per province).

### Step 6. Water (p50-deco.js; new `WATER`)

- Once per map, per province, seeded `brook:12:${i}` and `pond:12:${i}`: probabilities, elevation
  proxy, source and mouth, routing, insets and boxes exactly as §3.3; the Wellspring province's
  brook starts at the basin's position (the `drawMarks` Wellspring offset).
- Pond (§2.5): blob r(θ) = r(1 + 0.15 sin(3θ + φ1) + 0.08 sin(5θ + φ2)), y × 0.75, fill #A6C7CC,
  lit rim #DCEAEA 1.2 px at .8 on the upper-left half, bank #35535A 0.8 px at .7, 2 or 3 `reeds()`
  on the lower shore (#8E9A6E), Near: 2 ripple arcs #E9F2F2 1 px.
- Brook: ribbon width (0.6 + 1.2 t) px filled #BCD6D9, bank lines at ±w/2 in #35535A, 0.7 px, .7;
  source dot r 1.4 px.
- Bridges: intersect each track half with the brook; at each crossing a deck #CFC6B4 (4 px along the
  track, brook width + 3 px across) with #3E3428 rails 0.8 px; the track dots draw over it.
- Swamp pools: one pale dash #9FD0D4 at .7 at Near.
- Stamps drop slots within (radius + 2 px) of brooks and inside ponds.

### Step 7. Landmarks, camps, spring stones, the Wellspring, capitals at Far (p50-deco.js, p60-draw.js `drawMarks`)

- New code paths in stone #CFC6B4 / #8E877A, timber #8C6A47, ink #1C1A17 0.9 px, at `LS × 1.3`:
  `mine`, `windmill` (sails at 22.5° + k·90°), `arch`, `barrow`, `aqueduct`, `wallFragment`,
  `fallenTrunk`, `obelisk`, `columns`, `caveOutcrop`, `cliffDoor`, `sunkenColumns`,
  `toppledStatue`. Choice and placement per §3.4 with `rngFor('landmark:12:' + i)`; remove the
  chance windmill from `stampShape` (one per Farmland province now).
- Camps: every province with `owner === null`, Wellsprings included (their strength 30 reads
  "fortress": 4 tents); words weak < 16, moderate < 24, strong < 30, fortress ≥ 30 from `p.indep`
  (align `placeBadges`' words to these);
  §3.5 drawing at `seat + (0.9 × settleExtent, 4 px)`.
- Spring stones: if `fogOf(i) !== 'unexplored'`, for each `p.springs[k]` a disc #E9E1CC r 4.5 px
  (Mid) / 6.5 (Near), ink ring 1 px, `manaImg[c]` at 7 / 11 px; at `seat − (0.9 × settleExtent + k ×
  10 px, −6 px)`. Bake only when `manaImg[c].complete`; invalidate that province when an image
  loads.
- Wellspring (`drawMarks`): scale the monument by 1.4; add the glow (radial #F4EEDF .28 → 0, 18 px,
  clipped to the province); recolor the five drops to W #F3E6B8, U #3A7BD5, B #3D2B4F, R #FD6533,
  G #00674B with 0.6 px ink outlines.
- Far capitals (`settlementItems`, far branch): keep plus the first 3 houses plus the pennant.

### Step 8. Fields and clearings (p50-deco.js `ground`, `settlementItems`)

- Farmland: field boundaries by 2-level midpoint displacement (0.15); tones ±5 L\*; furrows
  `rgba(shadeL(f, -12), .35)`; hedges as wobbly dot lines #4E5A2E at .6.
- Infields (Plains, Hills, Wasteland, tier ≥ 2): `tier − 1` patches (≤ 4) at ranked spots on a ring
  at 1.15 to 1.5 × `settleExtent`, each a 3- to 5-sided polygon of about 0.5 × the house spiral
  radius, fill ±5 L\*, furrows at 0°, 90° or ±30°.
- Forest clearings: stamps skip slots within 1.3 × `settleExtent`; a soft ellipse +5 L\* there.

### Step 9. Vignettes at Near (p50-deco.js)

- `sheep`, `deer`, `heron`, `goats`, `haywain` (on a track half at its 60% point, aligned),
  `dustDevil`, per §3.10, `rngFor('vignette:12:' + i)`, probability 0.6, Near only, one per
  province, clear of tracks and brooks by 3 px, with `castShadow`.

### Step 10. The cloth margin (p40-scene.js `bakeCloth`)

- Replace the 7,000 fleck strokes with the `PAPER` tile over the margin (`soft-light`, 0.6).
- Margin wear: a 6-unit band inside the hem toward #D9CBAE (linear fade), two ring stains (r 9 and
  13 units, #B9A27E at 6%, broken arcs) in the lower margin corners. Never inside the neatline.
- Cartouche: keep the scroll frame and Marcellus SC title; add oak-leaf curls (three leaves and an
  acorn per end, #3E3428 outline, #A89A6E wash at .5).
- Corners: a small procedural oak-leaf sprig (3 leaves) at each inner corner of the hem, mirrored,
  outside the map.

### Step 11. Fog (p50-deco.js `drawProvinceDeco`)

- Unexplored: tracks at 50% alpha, the brook as a single 1 px line at 50% (no water), the pond as
  its outline, the landmark and camp through `P.line`, all in `lineCol`; no spring stones.

### Step 12. Readability guard (p80d-rest.js mode switch, p80c-sel.js selection)

- Replace the `decoTo` rule with `decoTo = state.mode !== 'ownership' ? 0 : (state.sel &&
  state.sel.type === 'cmd') || ritualTargeting ? 0.6 : 1`, recomputed on mode change, selection
  and deselection (150 ms, instant under reduced motion).
- Region names skip when `decoTo < 1`.
- `view.detail === 'reduced'`: no `paintGround` (flat `ownFill`), no paper, no vignettes; tracks,
  water, landmarks, camps, spring stones and region names stay.

### Step 13. Performance and the paint check (p60-draw.js, p50-deco.js, `__mock`)

- Compute `EDGE`, `npoly`, `TRACKS`, `WATER`, landmark and camp slots, `REGIONS`, `PAPER` and
  `GRAN` once, timed into `PROF.init` (≤ 120 ms).
- `?paintcheck`: bake each province at Mid with stamps, water, tracks and settlements off; average
  CIELAB over its polygon; print per terrain the mean and worst ΔE2000 against `ownFill` in a table
  in the console and in `__mock.paintcheck()`. Tune `PAINT[t].lift` until every terrain is ≤ 2.0;
  record the final values in the mockup's notes.
- Run `perf.cjs`: first paint ≤ 1.5 s, `panFps` p95 ≤ 16.7 ms at Mid, Near and lean-back; report
  `PROF`.

### Step 14. Screenshots and checks

- `ui-mockup/v3-desktop.png` (start zoom), `v3-mid-ashfen.png`, `v3-near.png` (Kharnath),
  `v3-far.png` (lean back: region names), `v3-wild.png` (curved Ashspine and Still Mere, a bending
  path), `v3-fog.png`, `v3-select.png` (Varo selected: decoration at 60%, move hatch), `v3-supply.png`
  (a data mode: flat tints), `v3-deutan.png` and `v3-tritan.png`, `v3-labels-ab.png` (Ink against
  Approved at Mid), `v3-v2-ab.png` (Hand v2 against Painted), `v3-paintcheck.txt`.
- Checks: every v2 interaction works (hover, tooltips, T lock, alerts, outliner, strip orders,
  right-click moves, keys, phone layout); clicks near wobbling borders select the province under
  the cursor (sample 200 points along borders against `npoly`); no stamp, water or track dot in a
  label, token or seat box; no `Math.random`; a reload draws the identical map; paint check ≤ 2.0
  per terrain; budgets of §7.2.

---

## 10. Milestone placement and owner questions

### 10.1 Phases

| Phase | What lands |
|---|---|
| 8 | unchanged: flat fills, straight borders, the Simple table, wilds, tokens; `src/present/map/edges.ts` with the noise off and the polygon hit test |
| 11 | the paint stack, paper, noisy borders, forests, relief, tracks, water, landmarks, camps, spring stones, the Wellspring illustration, ink lettering, curved wild names, region names, fog line art for the new features, the targeting dim |
| 12 (M1-should) | vignettes, paths along tracks, the cloth margin's wear and ornaments, owner map sheets (last in the cut order) |

**Cut order inside this pass** (if the time box hits): owner rasters → vignettes → margin
ornaments → paths along tracks → region names → curved names (straight fallback) → ruins → brooks
and ponds → noisy borders (variable-width straight ink) → the wash (flat fill plus approved
textures). Tracks and the ink lettering stay: cheap, and they carry the look.

### 10.2 Owner questions (defaults in bold; the build follows the defaults)

1. Labels: **dark ink on a paper halo** / the approved light-on-dark labels.
2. Borders: **hand-ruled wobble** / straight.
3. Path previews: **follow the tracks (M1-should)** / straight lines between centers.
4. Region names at far zoom: **yes** / no.
5. Owner map sheets: **after the procedural look ships** / before.

---

## Appendix: files

- This design: `handdrawn-design/design.md`.
- Measurements: `handdrawn-design/calc/painted.ts`, `extra.ts`, `pairs.ts`, `tokens.ts` and their
  `.out` files.
- Research: `handdrawn-design/research-style.md`, `research-techniques.md` (with `bench/`);
  `wartable-design/research-mapdetail.md`, `research-tabletop.md`.
- Target-feel reference (a generated image, not an asset, not to be traced):
  `handdrawn-design/reference-map.png`.
- Approved design: `wartable-design/final.md`, `owner-answers.md`; mockup parts
  `wartable-design/mock-work/parts/`, v2 backup `handdrawn-design/parts-v2-backup/`.
