# Pass 4 design: review with the owner's eye

2026-10-23. This reviews `pass4/design.md` against what the owner has said about the map: "It's not cluttered it's clean", the
natural landscape by default, faint lines that brighten on hover and selection and everywhere in Clear and the Terrain mode,
realm borders that keep their colour-blind contrast in every view (`map-relief.owner-answers.md`), and the reference direction
(`visual-references.owner-direction.md` and `.analysis.md`). I read the parts the design names (in `visual-v4/map/parts/`, read
only), pass 3's judges' reports, and the design's measurements. I also ran two probes of my own on the snapshot. Nothing in
`visual-v4/map/`, `natural/pass3/` or the repo was edited. My probe files are in `pass4/review-owner/`.

## Verdict

**Build it, but not as written.** The substance is right, and most of it earns its place:
- The Lean-back band as its own cheap pass: 5.7 to 8.4 ms in the prototype, against 54 to 98 ms today.
- Fog as memory, which adds no pixels.
- Rivers with real crossing rules.
- The mock rules kept in one place (`P4_RULES`).
- The `?p4=off` sameness check, so nothing approved is lost.
- The measured finding that 270 provinces need 16-bit ids, with 512 × 1 owner and visibility palettes.

It also answers the owner's question honestly. Pass 4 is more than a UI pass, because it shows how the M2 and M5 rules will look
and prints their numbers. But it builds no rules.

**The problem is what it puts on the default view.** With pass 4 on, the first screen and the least zoom both get busier in the
places the player looks most:
- **The start view** (96 px) changes colour, because the start month (M3) is spring and spring is not the approved bake. It also
  gains a river, 4 bridges, 15 road edges and a brass pin, all inside the Cinder heartland. That area already holds the red rails,
  the selected army, its path and the "4d" chip.
- **At Far on the owner's desktop** (53.7 px at 1440 × 900), the name count goes from 6 to as many as 12–14.
- **The Lean-back base reads as the war table**: the model, its cliffs and the oak, whole realms tinted as in the zoomed-out
  reference, thin rails, and pieces with shadows. Five details pull it toward a political map or a debug view:
  1. count plates that read "1";
  2. a "G"-ring glyph and a keep glyph where miniatures should stand;
  3. region names that measurably cannot fit at Lean-back zooms;
  4. a cross-fade tied to the zoom, so a resting view can show both passes half-transparent;
  5. "about 34" region names on a Vast map.

The fourteen changes below fix this without dropping any information. Everything cut from the land stays one gesture away, in a
card, a mode or the outliner.

## Does each item earn its pixels? (after the changes below)

| Item | Lean back (< 44 px) | Far (44–70) | Mid / start (70–180) | Near (> 180) |
|---|---|---|---|---|
| Season tone | yes | yes | yes; the start season is the approved bake (1) | yes |
| Winter frost on passable land | no | no | owner decides by eye (6) | owner decides by eye (6) |
| Rivers | yes, ≥ 2 px | yes | yes, clearly wider than streams (8) | yes |
| Bridges | no | no (cut the 3 px tick) | yes, with short road stubs (2) | yes |
| Roads | Supply mode only | Supply mode only | Supply mode, the planned path, the hovered or selected province's own edges (2) | yes, faint |
| Region names | only where they fit, at most 6 a view, none on the phone (3) | quieter than capital and wild names, only below 62 px (3) | none | none |
| Merged army tokens | yes; no plate at 1 (4) | n/a | n/a | n/a |
| Capitals, Wellsprings, the Working | their Far pieces, not glyphs (4) | pieces, no pulse (12) | pieces, no pulse | pieces |
| Pins | standing pin | standing pin | a tack in the seat's base (13) | a tack in the base |
| Supply path (Supply mode, army selected) | solid line (9) | solid line | solid line | solid line |
| Crossing cost | folded into the day chip (10) | the same | the same | the same |
| Half wheat | by exception | by exception | by exception | by exception |
| Scout eye | cut (12) | cut | cut | cut |
| Fog as memory | no new pixels: approve | approve | approve | approve |

## Changes, most important first

### 1. The start view stays the one the owner approved: the bake is the start season

- **Problem.** The mockup opens at Y1 M3, which is spring. The design makes summer the bake "pixel for pixel" and recolours spring:
  fields go green, grass +0.006 C, blossom specks. The owner would therefore never see the approved natural view at the start.
  Farmland is the most visible material at the start (the strips in `pass2/shots/01-start.png`), so the change shows at once.
- **Change.**
  - Make the **start season's variant the bake, pixel for pixel**. Here that is spring.
  - Derive summer, autumn and winter from it with the same limits (core ΔE ≤ 6, farmland ≤ 9 or 8).
  - `p4Seasons()` then asserts that the season at M3 equals the natural bake by hash.
  - `p4Off()` at the start view differs only by the layers that change 2 and 8 allow.
- **The rule to record.** The first season a game opens in is drawn as the approved landscape. In the game, where a season is a
  shader uniform, this costs nothing.

### 2. Roads are not drawn at Mid by default; bridges keep short stubs

- **Problem.** The design keeps "roads become Supply-mode only" as its fallback lever (§8). It should be the default:
  - ref-2, the zoomed-in reference, shows no roads at all, and ref-4 shows one.
  - map-relief §3.9 removed v3's tracks because they "added busyness at every zoom".
  - The 15 road edges are spokes from Kharnath and Deepmoss, the two places the player looks at most.
- **Change.**
  - **When roads are drawn:** in Supply mode at every band; along the planned path, as the thread already follows the road; on
    the hovered or selected province's own road edges, faint; and at Near.
  - **Bridges** at Mid and Near get stubs of 0.15 D on each bank that fade into the ground, so a span never stands alone. There is
    no bridge tick at Far and nothing at Lean-back.
  - **The province card** gains one row, "Roads: to Briardale, Redholt", so the rule stays one gesture away.
  - Delete the fallback wording in §8 and §14.
  - `p4Density()` asserts that, at the start view, the only layers pass 4 adds are the river and its bridges.

### 3. Region names: measured, they do not fit at Lean-back; make them quieter at Far

My probe (`review-owner/regionfit.gen.js` → `regionfit.json`) uses the 8 mock regions from `out/proto-world-snap.json`. It measures
each region's long axis plus 0.3 D at each end, and Marcellus SC with 0.28 em tracking measured on the page's canvas. The table
shows how long each name is against 0.85 of its spine; 1.0 or less fits.

| Zoom | Size | Fits | Range |
|---|---|---|---|
| Phone Fit, 26.6 px | 15 px | 0 of 8 | 1.62–2.60 |
| Phone Fit, 26.6 px | 12 px | 0 of 8 | 1.30–2.08 |
| 1024 × 768 least zoom, 36.7 px | 15 px | 0 of 8 | 1.18–1.89 |
| 1024 × 768 least zoom, 36.7 px | 12 px | 1 of 8 | 0.94–1.51 |
| Desktop least zoom (Far), 53.7 px | 12.5 px | 6 of 8 | 0.67–1.07 |
| Far, 66 px | 14 px | 8 of 8 | 0.61–0.98 |

The Vast probe's least zoom (29.4 px) is the same case, because its regions also hold 5 to 9 provinces: about 1.5 to 2.3 at
15 px. Five of the eight long axes are steeper than 45° (83°, 71°, 71°, 64° and 59°), and lettering along them would read
nearly vertical.

As written, then, the Lean-back band would silently show almost no region names. Where names did appear, they would be the largest
text on the table, in the same colour as the wild names, which carry a rule.

**Changes:**
- **Angle.** Clamp every spine to ±30° from horizontal, and measure the fit on the clamped spine.
- **No jitter.** Drop the ±1.2° glyph turn and the ±0.6 px baseline jitter. At 12 px they read as a rendering fault, and the
  "hand-lettered" wording belonged to v3's paper look, which the owner superseded. Keeping Marcellus SC is fine: it is the table
  plaque's face, so region names read as the table's cartography.
- **At Far:**
  - draw region names below the capital and wild names in the hierarchy: 11.5 to 12.5 px, fill at 0.65, a lighter halo;
  - fade them in from 62 px down, and have them gone by 70 px, not 85. Mid stays exactly as today, and the 58–70 px stretch, where
    pass 2's relief ramps, stays free of extra names.
- **At Lean-back:**
  - draw a name only where it fits; a name may run up to 25% past its region if it collides with nothing;
  - show at most 6 region names in a 1440 × 900 view, by priority: regions with fighting, then the viewer's, then the largest;
  - show none below 32 px, which covers the phone's Fit. On the phone, tapping a region opens its card.
- **Budget.** Replace "about 34 on Vast" in §8 with the cap.
- **Owner question 6** becomes: Far below 62 px, quieter; and Lean-back.

### 4. At Lean-back, pieces stand on the table, not glyphs and plates

The zoomed-out reference keeps miniatures on bases at their on-screen size, with no numbers on them. map-relief §7 already removed
count plates from the land. To keep Lean-back reading as the war table:
- **Capitals** keep their Far simplified piece and today's Far capital label, not a "keep glyph and bold 12 px name".
- **Wellsprings and the Working** keep their Far pieces. Cut the "16 px glyph token with a green G ring": a letter in a ring is
  a debug marker.
- **Merged tokens:**
  - no count plate when the count is 1;
  - at 2 or 3, show the bases stacked and offset by 3 px;
  - a plate appears only from 4.
  - The token's card still lists every army.
- **Mock example:** Kesh's scout-only token "with no count plate" is correct. Varo's and Ilsa's tokens "1" lose their plates.

### 5. The Lean-back cross-fade follows the approved band-edge rule, not the zoom

- **Problem.** The design blends both passes continuously from 48 to 40 px "with no hysteresis", so the camera can rest inside the
  blend:
  - My probe (`review-owner/viewports.json`) measured the least zoom at 1280 × 720 as **47.2 px**. That is a permanent 3% Lean-back
    blend, which costs both passes for an invisible result.
  - Any window whose least zoom falls near 44 px would rest at 50/50: DOM pieces and tokens both at half alpha, names doubled. That
    is the debug look the brief asks to avoid.
- **Change.** Use map-relief §1's rule for objects: switch at **44 px with ±2 px hysteresis**, and cross-fade over **150 ms by
  time** (instant under reduced motion).
  - Continuous blending stays for continuous properties only, like pass 2's Far relief strength.
  - `p4Bands()` then checks that no resting zoom leaves both passes partly drawn.

### 6. Winter frost: flip owner question 2's default to "no frost", and let the owner judge it by eye

- **Pass 3 depends on snow.** Pass 3's player judge chose the sculpted massif because "the snow brings back the wilds' reserved
  cue". The frost works against that cue:
  - **Area.** `out/seasonbench-*.json` puts frost on **9.3% of all land texels** (10.7% on Vast). Pass 3's ridge snow covers about
    5% of one range.
  - **Distance from snow.** The 23.2 / 22.4 margin was measured against #F2EEE6. Pass 3's massif snow runs from streaks up to L\*
    82, so the margin has to be re-measured after the rebase.
  - **Reference.** The reference's snow regions read as snow at L\* 66, and the frost is L\* 64.
- **Change.**
  - Build winter with bare woods, ploughed fields, dulled grass and the clock, and no frost on passable land.
  - Add a mockup control, "Winter frost: Off | On", that draws the specified frost at Mid and Near only, on north faces and crests,
    and never at Far or Lean-back.
  - Shoot winter Mid both ways for the owner.

### 7. The owner's line rules hold on river edges and at Lean-back

The binding text says lines "brighten to the colour-blind floor around the hovered and selected province, and everywhere in the
Clear terrain colours setting and the Terrain mode". The design breaks it in two places:
- **On a river edge,** it drops the hover and selection floor line and the Clear line.
- **At Lean-back,** it removes every neutral line in every look (`RL_LINES.drawn` empty).

**Changes:**
- In Natural, drop only the faint line on a river edge.
- Keep the hover and selection floor line there, drawn along the bank on the hovered side, so a hovered province's outline has no
  gap.
- In Clear and the Terrain mode, keep the floor lines on river edges and at Lean-back. That is 1 px and cheap: 104 edges on the
  mockup's map and 551 on Vast.
- Fix §1.6 check 1 and §5.5 to match.
- **Optional:** the zoomed-out reference keeps every province outline, so consider keeping the natural faint lines under the wash
  at Lean-back too, if the 12 ms budget allows.

### 8. Rivers must read as rivers: wider than streams, and never a zigzag

- **Width.** The approved streams are 1.5 to 3 units, and the river is specified at 3 to 4.5 units, so a crossing that costs 2 days
  would look like decoration. Make rivers **6 to 9 units**, widening downstream, with a floor of 2 px at Far and Lean-back.
- **Shape.** Province edges are straight polygon segments (the faint lines in `pass2/shots/01-start.png`). A river held within ±1.5
  units of them is a stiff polyline with sharp corners. Round the corners with Chaikin through the border's own vertices, and let
  the meander reach 0.04 D.
- **Rails.** The rails stay inset on both sides, as the reference does along its river.

### 9. Draw the supply path as a solid line, not beads

- **Problem.** R7 picks round beads so the path "cannot read as a fogged border". But fog lines are drawn dotted
  (`setLineDash([2 * px, 3 * px])` in p59b), so beads are exactly the dotted look R7 wants to avoid.
- **Change.**
  - Draw a **solid 2 px wheat-gold line** (#E6C46A with a dark halo), softly tapered toward the fort.
  - Mark each hop with a **short cross-bar**, not a round tick. War-table §3.6 keeps round marks off paths so they cannot be read as
    mana symbols or springs.
  - Keep the end chip, and print "1 hop", never "1 hops": the prototype prints "1 hops".

### 10. Fold "+2 days, crossing" into the existing day chip

- **Problem.** A separate chip for each crossing adds chips to the busiest part of the start view.
- **Change.**
  - Draw a small water tick across the thread at the ford.
  - The leg's existing day chip reads "6d · ford +2".
  - The cursor label and the projection carry the record's sentence, "+2 days, crossing the Reedflow".
  - Same information, one chip fewer for each crossing.

### 11. The top bar gets the season glyph and a compact Working chip

- **Problem.** At 1440 × 900 the top bar already runs to the clock at the right edge (`pass2/shots/01-start.png`).
- **Change.**
  - **Season:** show only the glyph before `Y1 M3 D14` on desktop, as on the phone. The word and the factors go in the clock's
    tooltip.
  - **Working:** show its colour symbol and "1/2", with "The Greening" in the tooltip.
  - Hide the chip while no Working stands, as designed.

### 12. Cut the Working's glow pulse and the scout eye

- **The 4 s glow pulse** is the only moving light on a calm map. The record's own research says the most popular cleanup mod for one
  reference game "removes glows and hover effects". Keep the landmark static; the top-bar chip and the card announce it.
- **The scout eye** is a new glyph added to every scouting piece so that it can then be muted. Scouting is a normal order and is not
  in docs/07's exception list. Cut the glyph and the Scouts mute. Muting covers battle markers, transit arrows and pins.

### 13. Pins: a tack in the seat's base, not a standing marker at the start view

- **Problem.** Sunmere is pinned at the start (`p80b-outliner.js`), so the default pin layer puts a 10 × 14 brass pin over the
  Wellspring, its piece and its name on the first screen.
- **Change.**
  - At Mid and Near, a pin is a **6 px brass tack set into the seat's base rim**.
  - The standing pin appears only at Far and Lean-back, where finding things is the problem.
  - Add it to §8's list of what pass 4 adds to the start view.

### 14. Chrome and documentation

- **Outliner:**
  - Battles and Sighted hide when empty and start collapsed (docs/07: "Empty sections hide").
  - The eye toggles show on header hover and focus; a struck eye stays visible while its class is muted.
  - The search field exists only while open.
- **Shots for the owner.** Lean-back is never visible at 1366 or 1440 on the mockup's map: its least zoom is Far there. Add a Vast
  shot at 1440 × 900 at least zoom, and a side by side of the phone's Fit today against Lean-back. On the phone, Lean-back becomes
  the Fit view (start 96 px, Fit 26.6 px), so the owner should judge that change there. Pass 3 owns the phone, so put this side by
  side in pass 3's checks.
- **Measurements.** State one baseline: the least zoom's static re-render is 89.5 ms in the table and 54.3 ms in §1.7
  (`leanbench`). Note that leanbench assumed 9 regions where the design has 8, and that its prototype has no tokens, lettering or
  fog.

## On the owner questions (defaults the review recommends)

| Question | Recommendation |
|---|---|
| Q1, washes at Lean-back | Agree. The zoomed-out reference tints whole realms. |
| Q2, frost | Default no frost, with a toggle so the owner decides by eye (change 6). |
| Q3, fog as memory | Agree. It adds no pixels. |
| Q4, a token per region | Agree, with no plate at 1 (change 4). |
| Q5, rivers now | Agree for rivers and bridges; roads not at Mid (change 2). |
| Q6, where region names show | Far below 62 px, quieter; and Lean-back where they fit (change 3). |
| Q7, the thin rail | Agree. The binding rule wins. |

## Files

- `pass4/review-owner/regionfit.gen.js`, `regionfit.json`: region-name fit and spine angles (run with `tools/run-proto.cjs` on
  `snap/game-screen-v4.html`).
- `pass4/review-owner/viewports.json`: Fit, least and start zooms at 390 × 844, 1024 × 768, 1280 × 720 and 1440 × 900 (run with
  `tools/run-vp.cjs` and `proto/info2.js`).
