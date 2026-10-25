# v3 critique: the art director's fix list

2026-10-22. Judged: `ui-mockup/v3-*.png` next to `v2-*.png`, against `handdrawn-design/final.md` and the
owner's direction ("more interesting and detailed, a hand drawn feel"; Final Fantasy XIV's painted maps
and concept art as style inspiration only). Extra evidence: screenshots in
`critique-work/shots/c-*.png` (Near on Brambarrow, Duskholt, Marholt, Stagmoor and Ashmoor; the top of
Mid on Stagmoor and Briardale), and counts read in the page with `__mock.ev` (slots, `REGDBG`). No part
file was edited.

## Verdict

v3 moves the line and the lettering. The hand-ruled borders, the track network, the serif names, the
curved wild names, the Farmland patchwork with windmills, the ruins and hero pieces, and the wild peaks
at Near all read as a drawn map. Every check passes: 0 wrong hits in 200, 91.7% of names placed, a
stable redraw. But v3 does not yet deliver "more detailed" or "painted":

- **At the start zoom (0.42 px per u) most of the new paint is smaller than a pixel.** The paper tooth
  (1.5 u), granulation (1.5 u), flecks (1 to 1.4 u), hedge dots (0.7 u) and the 6 u edge pool all
  average away when the Mid bake (about 1 px per u) is blitted at 0.41×. The land still reads as flat
  vector fills (`v3-v2-ab.png`, `v3-vs-reference.png`).
- **Terrain density is still v2's, and the slots run out.** At Mid a Forest gets 23 to 33 crown slots
  (6 to 9 clumps), Hills get 4 to 7 humps and Mountains 5 peaks; at Near Mountains get 8. The §5.4
  budget allows 30 items and 60% coverage at Mid, 60 items and 75% at Near. The Near views are mostly
  empty ground (`v3-near-rookmere.png`, `c-near-mtn.png`, `c-near-waste.png`).
- **Region names are never placed.** `REGDBG` shows 0 of 6 at the start zoom and 0 of 6 at Far.
- **The silhouette sheet fails its own limits in 8 pairs** (`v3-silhouettes.png`): hump against beast
  den 0.86, peak against siege tent 0.81, mine against beast den 0.86, among others.

## Fixes, in priority order

### 1. Make forests a canopy instead of scattered clumps (detail: 13 of 44 provinces are Forest)

**Evidence.** Stagmoor, Redwick and Oakmoor (`v3-mid-ashfen.png`, `v3-near.png`,
`c-near-forest.png`) show 6 to 9 small dark clumps on flat dark green; v2 looked denser. The cause:
crowns go only on the `G.slots3` slots that survive the zones, track corridors, water and the clearing
(23 to 33 at Mid), and those slots are then grouped 4 to a clump.

**Change.**
- `p55-paint.js`, `drawProvinceDecoP`, forest branch: stop taking crowns from `stampSlotsFor`.
  - Sample crown centers once, at Near spacing, by seeded Poisson disk
    (`rngFor('canopy:12:' + i)`, spacing 1.5 r, r from 4.5 to 6.5 u). Sample over the polygon inset
    by B_u + 2 u, minus the band's zones, the `stampBlocked` corridors (tracks, brooks, ponds), the
    clearing (1.3 × the settlement extent) and 2 to 4 seeded glades (r 0.08 to 0.12 D).
  - Mid keeps the points with rank under 0.55, so crossing into Near adds crowns and never moves one
    (§2.0).
  - Group the crowns into clumps by proximity: up to 7 crowns per clump at Mid and 9 at Near. Cap the
    clumps at 28 (Mid) and 55 (Near), so a clump stays one §5.4 item.
  - Target crown coverage: 40 to 50% of the free area at Mid, 55 to 65% at Near.
- `p52-stamps.js`:
  - `makeClump`: change the spiral step from 1.05·r·√k to 0.85·r·√k, so crowns overlap into a
    canopy.
  - `crownFill`: change the lit face's radius from 0.72 r to 0.8 r and its offset from (−0.22 r,
    −0.22 r) to (−0.16 r, −0.18 r). Each crown then reads as lit from the upper left instead of as a
    dark hole. The face colors do not change.
  - `drawClump`: lower the outer outline's alpha from .8 to .6 on the dark set.
- At Far, keep the 4 canopy masses.

**Verify.**
- The Far full-decoration report keeps every Forest pair at 20 / 12 or more. The closest today are
  Hills/Forest under protanopia (14.1) and Forest/Swamp under tritanopia (18.9).
- The zone check reports 0 hits.
- Mid bake time stays within §7.2.

### 2. Make the paint visible at the start zoom (painterly)

**Evidence.** In `v3-desktop.png` and `v3-v2-ab.png` the province interiors look like v2's flat
fills. The Mid bake is drawn at about 1 px per u and shown at 0.42 px per u, so the paper tooth lands
at about 0.6 screen px and averages away, along with the granulation and the 6 u edge pool.

**Change, in `p55-paint.js`.**
- **Pattern scale per band.** Change `worldPattern(g, tile)` to `worldPattern(g, tile, band)` and
  scale the tile to U × {far: 4, mid: 2.4, near: 1.2} world units per tile pixel (today U in every
  band).
  - Use it in `paintGround` for the paper and for step 5 (granulation). Use the Mid factor in
    `clothMarginV3` in `p40-scene.js`, which builds its own pattern at U.
  - Result: the tooth is about 1.5 screen px at the start zoom, and the fibres are 3 to 8 px long and
    visible as linen.
  - Amplitudes, alpha and the soft-light blend do not change, so the means and every figure in §1.6
    and H13 hold. The 150 ms band cross-fade hides the step in scale.
  - Record this as a deviation from §1.3 ("one tile pixel = 1 u").
- **Paper.** In `paperTile`, change the coarse octave from 11 cells to 6 (blotches of about 40 u,
  about 17 px at the start zoom) and keep its amplitude. This gives the slow unevenness of a wash.
- **Edge pool (step 8).**
  - Change the blur from {far 4, mid 6, near 8} to {far 5, mid 11, near 14} band px.
  - Make the casting rim irregular. Into the `pool` scratch canvas, also stamp filled circles every
    3 u along the ring, with radius (1 + 0.6·n(t)) × 3 band px, where n is value noise along the arc
    length from `rngFor('pool:12:' + i)`.
  - The pooled edge then swells and thins like a drying wash instead of glowing evenly. Keep the B_u
    inset on owned land.

**Verify.**
- `?paintcheck`: every terrain's mean is within ΔE 2.0. Recalibrate `lift` if needed.
- The band rule (§1.6) still passes, because the pool's darkest value does not get darker.
- Performance stays within §7.2.

### 3. Ink labels: one size up, heavier, light letters on dark land (readability; this is the default)

**Evidence.** In `v3-labels-ab.png`, Alegreya 500 at 11 px has a smaller x-height than v2's Alegreya
Sans at about 13 px. It reads a size smaller and thinner than the Approved labels. On Forest, Hills
and Swamp the 3 px pale halo makes a light smear around small dark letters (Redwick, Cinfen,
Coldmere).

**Change.**
- `p50-deco.js`:
  - `nameFs`: raise the floor at the bottom of Mid from 11 to 12 px. Ramp from 12 to 13.5 px across
    Mid and from 13.5 to 15.5 px across Near.
  - `nameFontInk`: weight 500 → 600; capitals 700 → 800.
- `p00a-head.html`: request `Alegreya:ital,wght@0,500;0,600;0,700;0,800;1,500`.
- `p57-letter.js`, `paintLabels`, ink branch:
  - On the dark-terrain set (`DARK_T`): letter in #F4EEDF over a 2.5 px halo rgba(20,18,15,.75), the
    approved pairing (11.7:1).
  - Elsewhere: #2A1F14 over a 2.5 px halo rgba(242,234,214,.8).
  - Region names already switch ink by terrain, so the sheet stays consistent. Keep the Labels A/B.

**Verify.**
- `labelCheck` at the start zoom: at least 90% named, `namesOverTokens` 0. 12 px is about v2's
  widths, which passed.

### 4. Draw Hills and Mountains as ranges, and clear the silhouette failures (detail, H6)

**Evidence.**
- `c-near-mtn.png` (Brambarrow): 8 small single peaks on empty pale blue.
- `v3-near-rookmere.png`: 10 identical bread-roll humps.
- `v3-silhouettes.png`: hump against beast den 0.86 and peak against siege tent 0.81, against a limit
  of 0.70. A lone dome and a lone triangle are exactly the reserved shapes.

**Change.**
- `p52-stamps.js`:
  - Add `hillRange(g, x, y, w, P, R)`: 2 to 4 overlapping humps. The lead hump (width w) sits at the
    back. Flankers 0.55 to 0.8 w wide sit lower-left and lower-right, offset by 0.35 to 0.5 w. Each
    crest sits at 0.4 of its hump's width, so the group's outline is a long ridge (aspect 2.5 or more,
    the mound rule in §3.11).
  - Add `peakRange(g, x, y, w, P, R)`: 3 to 5 passable peaks chained along a seeded axis within ±20°
    of horizontal. The tallest stands in the middle; its neighbours are 0.6 to 0.85 of its height and
    overlap by 35% of their width. Each peak keeps h ≤ 0.8 w and its Chaikin rounding (§2.3).
- `p55-paint.js`:
  - `stampItemP`, cases 'hills' and 'mountains': draw one range per slot. A range is one §5.4 item.
  - `midPeaks`: return the ranges' peaks, so the relief wash follows them.
- `p50-deco.js`, `TSPEC` (Far keeps its masses):
  - hills [3, 6, 10] → [3, 7, 14] ranges.
  - mountains [3, 5, 8] → [3, 6, 12] ranges.
- `p52-stamps.js`, other silhouette fixes:
  - `LANDMARKS.mine` (0.86 against the beast den, which is a mound with a dark opening): drop the
    mound and the dark fill. Draw a timber A-frame headframe (two raked legs and a cross-beam, no
    wheel) over a flat spoil fan of dots.
  - Goats vignette (0.75): remove the oval ground patch and space the goats 3.2 u apart.
  - Hare vignette (line art 0.67 against the standing stone, 0.61 against the cairn): draw it
    crouched, long and low.
  - `heroHead` (0.74): lay it on its side with its neck stump, so its outline is long.

**Verify.**
- `?silhouettes`: every pair under 0.70 filled and under 0.60 as line art.
- The §5.4 item counts and coverage.
- The Far pairs report.

### 5. Hills: fix the hachures, the faces and the shadows (hand-drawn; these are bugs)

**Evidence.** In `v3-near-rookmere.png` (Rookmere, zoomed 2×):
- no hump shows any hachures;
- each hump is split hard down the middle into a pale half and a near-black half;
- a dark ellipse sits under each hump;
- loose "))" arcs lie on the ground between the humps.

**Causes and changes.**
- `p52-stamps.js`, `humpP`, the hachures. They start on the rim and point down-right, so the ones on
  the right leave the hump and are clipped away. The rest are #3E3428 drawn on the shade face (about
  L\* 28), where they vanish.
  - Start each stroke inside the hump on the crest: from 0.05 to 0.45 w right of the apex, 0.12 h
    below the outline. Run it down the flank at the §2.3 angles.
  - Stroke the hachures that fall on the shade face in the lit tone at 0.55, and those on the lit face
    in feature ink at 0.75.
- `p52-stamps.js`, `humpP`, the shade face. Today the shade ellipse (offset 0.22 w, rx 0.42 w) covers
  about two thirds of the hump. Replace it with a crescent: a shade ellipse at x + 0.3 w with rx
  0.34 w and a 1 band px soft edge.
- `p55-paint.js`, `stampItemP`, case 'hills': draw no `castShadow` for humps. Hills are ground forms,
  and the 1.2 w × 0.44 w ellipse reads as a dark puddle. The hachures at the foot carry the shade.
- `p55-paint.js`, `groundP`, case 'hills': delete v2's arcs, `g.arc(s.x, s.y, 7 + h * 2.4, 0.15, 1.1)`
  at every slot. They are sized in unscaled world units, they are the loose scratches seen at Near,
  and no hump stands under them.

### 6. Region names: get them placed (lettering; the name tier from FFXIV's maps)

**Evidence.**
- `REGDBG` at the start zoom: The Broad Leas fails 20 times as too long, 18 as outside its run and 62
  as colliding, and is placed 0 times. All six regions are placed 0 times.
- At Far all six are also placed 0 times, mostly as too long (83 for The Broad Leas). At 15 to 24 px
  with 0.3 em tracking the names are longer than their runs, and every place name is already on the
  Far sheet.

**Change, in `p57-letter.js` `placeRegionNames`.**
- Size each name from its spine: fs = clamp(0.9 × spineLen / textW(name at 1 px with 0.2 em
  tracking), 10, the spec's maximum). That gives 10 to 18 px at Far and 10 to 13 px at Mid. Try
  tracking at 0.2 em first, then 0.12 em.
- Try offsets from −0.5 D to +0.5 D in steps of 0.125 D (today ±0.36, ±0.46 and 0).
- At Mid, lower the share of glyphs that must fall inside the run from 0.75 to 0.6.
- At Far only, change the order in `layoutLabels`: place region names before the place names of
  provinces that are not a capital, not the viewer's, not holding a visible army, not selected and not
  contested. Those names then show only at Mid and Near.
  - This amends H12 ("no other label ever yields to a region name") for Far only. Record the ruling at
    the bottom of `final.md`. The Mid rule stays as it is.

**Verify.**
- On this map, at least 4 of 6 names are placed at Far and at least 2 at the start zoom.
- No name runs under a band, and names stay hidden while targeting.

### 7. Tracks: no stubs that end in a field (readability)

**Evidence.** In `v3-near.png` and `c-near-waste.png` (Redholt, Oakmoor, Morgate), dotted runs stop in
the middle of a province, and short parallel stubs sit between the name and the town. A road that
stops reads as a dead end, and FM has no rule for one (H4).

**Causes and changes, in `p54-feat.js`.**
- **The label-zone cut.** `drawTracks` drops the dots of every half that leaves the seat toward the
  label, and the label sits just above the seat.
  - In `buildFeats`, add the band's label zone plus 2 u to the `okCurve` test.
  - Start such halves from the east or west point of the seat ellipse and bow them around the zone,
    so no dot is dropped in the middle of a run.
  - In `drawTracks`, drop any surviving run shorter than 4 dots.
- **Corner contacts.** Halves with `fallback: 'corner'` stop where they first come within C of a
  border. Run both halves into the shared vertex instead: the last 2 C runs along the corner's
  bisector, with the J rule waived there, so the two halves visibly meet.

**Verify.**
- The §7.4 track geometry tests: clearance C outside the crossing and corner zones.
- The track check ratios do not change.

### 8. Brooks and bridges: stop them looking like UI polylines with drag handles (hand-drawn)

**Evidence.** In `v3-near.png` (Oakmoor), `v3-near-rookmere.png` and `c-near-swamp.png` (Marholt),
each brook is a smooth pale arc with pale squares on it.

**Change, in `p54-feat.js`.**
- **Bridges** (`drawWater`): replace the STONE rectangle with the map sign for a bridge. Draw two ink
  parapet lines (`FEATURE_INK`, 0.9 band px) parallel to the track, 5 u long and the brook's width
  + 2 u apart. Flare each end outward with a 1.2 u tick at 30°. No fill.
- **Brook course** (`buildFeats`, the brook polyline): add a meander before smoothing:
  `ridge(a, b, R, 0.2, 4)` on each segment, then `chaikin(…, 2)`, for a sinuosity of 1.25 or more.
- **Brook drawing** (`drawWater`):
  - Width from 0.6–1.8 u to 0.9–2.4 u.
  - Banks from 0.7 to 1.1 band px: the lower-right bank in #35535A at .8 and, on the dark set, the
    upper-left bank in paper ink #E8DCC2 at .55, so the course reads on Forest, Hills and Swamp.
- H5 still holds: pale water only, inside one province, inset B_u + 6 u from its borders.

### 9. Wild massifs at the start zoom: draw chains, not scattered teeth (impassable terrain stays noticeable)

**Evidence.** Compare the Ashspine in `v3-desktop.png` and `v2-desktop.png`: v3's peaks are smaller,
narrower and jumbled, and v2's read bolder. At Near they are fine (the Greyteeth in
`c-near-swamp.png`).

**Change, in `p50-deco.js` `bakeWildInto` (painted branch).**
- Draw back to front by the peak's foot y. Today the painted
  `list.sort((a, b) => b.h - a.h || a.y - b.y)` draws tall peaks at the back over short ones in front.
- Widen each peak from `q.h / 1.18` to `q.h / 1.1`, the limit in §2.3.
- Place the non-center peaks as flankers chained to the nearest center along a seeded ridge axis
  (offset 0.45 to 0.6 h, overlapping) instead of by blue noise, so each cell reads as one or two
  ridges.
- Raise the centers' height factor from 1.7 to 2.0 base where the name box allows.
- Colors, snow depth (40%), the rim and the name rules do not change.

### 10. Plains, Wasteland and Swamp: more stamps, in clusters (detail)

**Evidence.** In the Near views (`c-near-waste.png`: Redbarrow, Duskholt, Morgate; `v3-near.png`:
Redholt), single tufts and single rocks stand evenly spaced on empty fill. Plains hedgerow dots
(0.7 u) vanish at Mid.

**Change.**
- `p50-deco.js`, `stampShape`:
  - Plains `tuft`: a cluster of 3 to 6 tufts (heights 2.5 to 5 u, lean ±15°, spread over 4 u).
  - The copse (`s.v < 0.18`): 2 to 4 crowns through `makeClump`.
  - Wasteland: outcrops of 3 to 5 rocks of falling size, side by side on one ground line and never
    stacked (stacked stones are the reserved cairn), plus dry scrub.
  - Swamp reeds: reed beds of 5 to 9 around a short pool dash.
- `p50-deco.js`, `TSPEC`:
  - plains [2, 10, 20] → [2, 14, 34].
  - wasteland [2, 8, 14] → [2, 12, 28].
  - swamp [3, 12, 22] → [3, 14, 30].
- `p55-paint.js`, `groundP`, Plains hedgerows: dots from 0.7 u to 1.2 u, every 3.5 u, and at Near a
  crown (r 2.5 u, with faces) on every fifth dot. Keep them wavy (Order's hedgerows are straight).

**Verify.**
- The §5.4 item counts and coverage.
- `?silhouettes`: no free pale dots and no stacked stones.

### 11. Flecks: gather them in drifts so they stop reading as a rash (painterly)

**Evidence.** In `c-near-waste.png` (Redbarrow, Morgate), `v3-near.png` (Redholt) and
`c-near-swamp.png` (Marholt), sorrel and sedge dots are spread evenly over the whole province and
read as a rash.

**Change, in `p55-paint.js` `paintGround` step 7.**
- Gate fleck placement with a seeded value-noise mask at 0.25 D (`rngFor('fleckmask:12:' + i)`).
  Keep candidates where the mask is above 0.55: about 30% of the area, in 2 to 4 drifts.
- Raise the density inside the drifts 2.5×, so coverage and the mean shift stay as §1.4 measured
  them.
- Jitter the radius from 0.6 to 1.4 u.
- Keep the 3 u minimum spacing, and still no rings or rows.

### 12. Give the stamp ink a hand (hand-drawn)

**Evidence.** At Near every stamp outline is a perfect ellipse, circle or straight polygon (ponds,
humps, rocks, sheaves, landmarks). Beside the wobbling borders, the drawing reads as vector clip art.

**Change, in `p52-stamps.js`.**
- Add `inkPath(g, pts, R, closed)`:
  - one level of midpoint displacement at an amplitude of 0.04 of the segment length, then one Chaikin
    pass;
  - stroked as a tapered ribbon with the `taper` helper, width w0·(0.75 + 0.25·sin(πt)) per segment;
  - one seeded break of 8 to 12% on paths longer than 12 u.
- Use it for the outline strokes in `humpP`, the passable branch of `peakPaint`, `rock`, `sheaf` and
  the ink outlines in `drawLandmark` (landmarks, ruins, heroes). In `p54-feat.js`, use it for the pond
  bank in `drawWater`.
- Fills stay on the clean path, so silhouettes and zones do not move.
- Do not use it on settlements, tokens, borders or wild contours (approved, and a broken border means
  fog).

## Keep as is

- The wobbling survey-ink borders on the shared polylines.
- The tracks as live dots.
- The cloth margin with its wash overrun and double neatline.
- The Farmland patchwork, windmills and sheaves.
- The arches, aqueducts and the hero stump.
- The Near wild peaks with their ragged snow.
- The curved wild names.
- The fog line art.
- The state overlay.
- Try your art.
- The readability guard: decoration fades in data modes, and tracks go to full strength under
  Passability and selection (`v3-select.png`).

## Re-run after the fixes

- `?paintcheck`: ΔE 2.0 or less per terrain. Read the Far pairs report, and watch Hills/Forest under
  protanopia (14.1 today) and Plains/Farmland under deuteranopia (14.6).
- `?silhouettes`: every pair under 0.70 filled and under 0.60 as line art.
- `__mock.checks()`: hit, labels (90% or more), zones, stable.
- The §5.4 item and coverage counts.
- The §7.2 performance budgets.
- Re-shoot `v3-desktop`, `v3-mid-ashfen`, `v3-near`, `v3-near-rookmere`, `v3-far`, `v3-labels-ab`
  and `v3-vs-reference`.
