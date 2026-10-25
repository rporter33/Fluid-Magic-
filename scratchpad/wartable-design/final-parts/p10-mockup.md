## Mockup brief: changes to `ui-mockup/game-screen-v1.html`, in order

**Goal.** The owner sees and reacts to everything above in the clickable mockup, in this order: the
oak war table and the tavern; noticeable impassable terrain; terrain detail; settlements growing;
land that differs by alignment; leader portraits in the strip, the outliner and the battle
report. Then the chrome A/B, modes, fog and the review aids.

**Constraints.**
- Procedural art only: canvas 2D, inline SVG, CSS. No external images.
- Google Fonts only. Extend the existing link to
  `family=Marcellus+SC&family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Sans+Condensed:wght@400;500;600`.
- Scripts only from cdnjs with pinned versions: keep
  `https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js`; add nothing else.
- Every random choice is seeded: add `h32(str)` (a 32-bit string hash) and
  `rngFor(key) = mulberry32(h32(key))` beside the file's `mulberry32`; never `Math.random`.
  Nothing may change between reloads.
- Every existing interaction keeps working: hover tooltips, nested terms, T lock, the alerts
  ribbon, outliner, feed, strip orders, right-click moves, Space, 1 to 4, Shift+1 to 6, M, F, R,
  H, [ and ], the phone layout.
- Performance: the static scene is drawn into offscreen canvases (the room and table once per
  settings change; the decoration bake per zoom band, mode, time-lapse step and settings); pan
  and hover only blit them, and the ambience loop composites the cache plus flames and motes at
  most 30 times a second. Target 60 fps at 1440 px wide.

### Step 1. Mockup controls and "Try this"

- Rewrite the `page-head` paragraph as a short "Try this" list:
  1. lean back with the wheel to see the table and the tavern;
  2. hover a dark massif, then select Varo and right-click the province named here (filled in
     by step 3) to watch the path bend around it;
  3. drag the time-lapse slider and watch Ashfen change faith;
  4. open Portraits;
  5. switch Table, Chrome and Vision.
- Add a compact group in the page head, outside the game window, labelled "Mockup controls"
  (review aids, not game UI):
  - `Table: Full | Simple | Off`;
  - `Detail: Full | Reduced`;
  - `Time-lapse` slider, Y1 M3 to Y6 M10 (months 3 to 70), with a label "Mockup: jumps the
    clock; in the game slow looks change once a month";
  - `Chrome: Approved | Warm retune (rejected)`;
  - `Parchment: Off | Report card and Codex`;
  - `Vision: Normal | Protan | Deutan | Tritan`;
  - `Reduced motion` (also follows `prefers-reduced-motion`);
  - `Portraits` (opens the gallery, step 14);
  - `Passability` (a review overlay, step 3).

### Step 2. The war table and the tavern (draw under the map; section 2)

World units: the map rectangle stays `[0, 0, W, H]` (1600 × 1000). Cloth margin `m = 40`, hem
6, table margin `T = 0.35 × (H + 2m)`, room margin `R = 0.5 × (H + 2m + 2T)`.

1. **Room** (offscreen, once per settings change), the rectangle `[−m−T−R, −m−T−R, W+m+T+R,
   H+m+T+R]`:
   - floor: base #2A2018; horizontal planks 90 units tall alternating #3A2C20 and #34281D, with
     value-noise streaks at ±4% and seams 2 units #1E1712; a few lit planks #5A4430 toward the
     window side;
   - rug under the table's south half, extending 0.25 × the table's width beyond it: #6B5A48
     with a 24-unit border #8A7560 and an inner line #4A3A2E;
   - bench along the north side: #4E3A28 with plank lines, a folded cloak #5A5148 on it;
   - barrel (east): circle r 55, #5E4630, stave lines, two hoops #3A3836;
   - stool (west): a seat circle r 30 #5E4630 and three leg dots;
   - hound asleep on the rug (south-west), seen from above: an ellipse body 150 × 90 #7A6450,
     a smaller head ellipse tucked against it, a tail curve, shade #5A4636 along one side;
   - door at the south edge #2B2018 with square iron hinges #4A4744, and 30 straw strokes
     #B89A5A beside it;
   - hearth at the west edge: an arc of stones #4A4744 / #5E5953, and a radial glow #FF890E at
     30% fading to 0 over 700 units across the floor;
   - window light to the east: a pale parallelogram #F2EBDD at 14% with three darker 4-unit lead
     bars;
   - a vignette toward the screen edges, #0E0905 to 50%.
2. **Table** (offscreen):
   - shadow: the table rectangle offset 14 units, #000 at 40%, blur 30;
   - oak: a 512² pattern built once (instrument recipe): base #8F7459; grain lines #715636 where
     `sin(y·0.9 + 3·sin(x·0.004 + k))` passes 0.96; ray fleck as faint #BB9E7C ellipses 6 × 2
     at 25%; the pattern follows the camera through `setTransform`;
   - three planks across the short side with 2-unit #5E4630 seams and two square nail heads per
     plank end (6 × 6 #2B2A28, a 1-unit #6E6A64 highlight on the upper and left edges);
   - rim: a 22-unit band shaded #715636 to #3E2E20 outward, with a lighter worn strip (#B08A5E
     at 30%) along the bottom edge;
   - **forged iron corner straps:** at each corner an L of two 26 × 110 bands #4A4744 with a
     #2B2A28 edge and three square nail heads per arm;
   - **knife marks:** 4 seeded thin lines (30 to 50 units, within ±20° of horizontal) #5E4630 at
     60% beside the bread board's slot;
   - **tankard ring:** a 1.5-unit circle stroke r 34, #5E4630 at 35%, with two gaps, beside the
     tankard's slot;
   - table light (masked out of the cloth rectangle): the hearth's gradient on the west rim,
     #FF890E `lighter` from 20% to 0 over 30% of the table's width; the candle's pool, #FFA757
     at 25%, radius 0.12 × (H + 2m) around the candle; a rim vignette #140C06 from 0 to 45% at
     the rim.
3. **Props** in the table margin, each centered 0.06 × (H + 2m) outside the hem diagonally from
   its corner, so its inner third shows in the start zoom's oak band. Draw them in a painted
   three-quarter top view:
   - upper left: the **month candle** in an iron holder (holder circle r 26 #4A4744 with a ring
     handle; a beeswax cylinder 18 units wide, #E9DFC2 with a #CFC0A0 side, whose visible side
     is `50 × (1 − day/30)` units tall; a teardrop flame with a #FFE8C3 to #FF8400 radial
     gradient). At a month change, a fresh candle (0.4 s puff; instant under reduced motion);
   - upper right: the **hourglass** (two wooden caps #5E4630, glass #CFE0EA at 30%, sand #C9A86A
     whose upper and lower triangles follow the day's fraction); a 1 px grain stream while
     running; **rotated 90° on its side while paused**;
   - lower left: an inkpot (r 22 #1E2A2E with a highlight), a quill (a feather path #E9E4D8 with
     #CFC6B4 barbs, lying diagonally), brass dividers (two thin #B8914A legs with a square pivot);
   - lower right: a pewter tankard (r 34 #91A092, rim #6F7C70, a handle) and two bone dice (22 ×
     22 rounded squares #E9E4D8 with #1C1A17 pips);
   - bottom edge: a bread board (120 × 70 #8C6A47 with grain), a heel of bread (#C9A06A, crust
     #8A5A2A) and a knife (blade #A8ADB3, handle #4E3A28);
   - top edge: a folded letter (90 × 60 #E9DFC2 with a fold line) with a wax seal r 10 #4A2A1C;
   - left edge: six bare-wood shield tokens #B08A5E with #715636 outlines.
   - Props are inert: no hover, and a click passes to the table (clears the selection).
4. **Cloth** `[−m, −m, W+m, H+m]`:
   - a contact shadow (offset 3 px, #000 at 35%, blur 8);
   - linen #E8DCC2 with fiber flecks (short strokes at random angles, ±3% L\*; never a grid);
   - a 6-unit leather hem #3E2E20;
   - four **square** brass tacks at the corners: 12 × 12 #B8914A, a 1-unit #D4B26A highlight on
     the top and left edges, a 1-unit #1C1A17 outline;
   - a cartouche at the top center of the margin: a scroll frame in ink lines with "The Ember
     Marches" in Marcellus SC 22 units, #1C1A17;
   - a compass rose in the upper-right corner of the margin, ink lines, "N" marked;
   - the map rectangle's outline, 3 units of ink.
   - **No light, grade or vignette on the cloth.** Draw table light before the cloth.
5. **Camera:**
   - `fit()` fits the cloth rectangle (not the map) into `viewRect()` with a **32 px** pad, and
     stores it as `fitScale`;
   - wheel zoom runs from `0.75 ×` the scale that fits the table rectangle up to the scale at
     which the median province is 420 px across;
   - **detent:** 150 ms after the last wheel event, a scale within ±8% of `fitScale` animates to
     it over 200 ms (instant under reduced motion);
   - `Z` and a "Fit" button at the top of the mode column return to `fitScale`;
   - pan clamp: the view's center stays inside the table rectangle;
   - a small chip by the mode column, "Zoom: Far / Mid / Near", from the median on-screen
     province diameter (70 and 180 px).
6. **Table settings:** Full (everything above plus the ambience of step 17); Simple (oak, cloth
   and a still room gradient, no props, no ambience); Off (`#15130F` around the hem, today's
   look).

### Step 3. Wilds (impassable terrain; section 1)

1. **Generator** (before terrain, owners and names):
   - an 11 × 6 jittered grid (66 sites) in the same `W × H`, with the 2 Lloyd rounds as now;
   - capitals first, as now: `redCap = nearest(230, 520)`, `greenCap = nearest(1380, 470)`;
   - a second field `wet(x, y)`: a sum of sines like `noise` with other phases;
   - a fixed plan: "the Ashspine" peaks, 3 cells; "the Still Mere", a mere, 1 cell; "the
     Greyteeth" peaks, 2 cells, so 60 provinces remain;
   - peaks by `noise` (highest first), the mere by `wet − noise`; seed at the best eligible cell
     and grow into the best eligible neighbor; if a range cannot grow, release it and try the
     next seed (at most 12);
   - eligible: no vertex on the rectangle `[0, 0, W, H]`; at least 3 Delaunay hops from both
     capitals and from every cell of another range; with the cell removed, the rest stays
     connected, every neighbor keeps 2 neighbors, there is no cut vertex (an iterative Tarjan),
     and the provinces around each range stay within 6 hops;
   - keep cell indices; set `prov[i].wild = { id, kind, name }` on wild cells, build
     `provList = prov.filter((p) => !p.wild)`, run every province loop (terrain ranks, owners,
     names, Ashfen, Sunmere, Wellsprings, commanders, labels, badges) over `provList`, and make
     `nbrs(i)` skip wild cells. Terrain ranks over the 60 provinces with today's shares;
   - pick `acrossTarget`: a province bordering the Ashspine whose straight line from Ashfen's
     center crosses the Ashspine and which `pathTo` reaches; put its name in "Try this". If a
     province exists whose only way around crosses a Thornwood province, pick it as
     `closedTarget` for the no-path demo.
2. **Peaks:** granite #2A292C over each cell; 8 to 14 peak stamps per cell by area (Poisson,
   seeded `rngFor('wild:' + id)`), 2 or 3 centerpieces at 1.7×, about 0.55 of the inradius
   tall; each peak a triangle with a lit left face #8A857E, a flat right face #46423F (no
   hatching), a snowcap #F2EEE6 down to 40% of its height, a 1.3 px ink outline #1C1A17; drawn
   tallest first, then by bottom edge; tips may rise 10% above the cell's top edge.
3. **Mere:** water #24222A; a 5 px shore band #2E3138 inside the outline; 8 to 14 two-hump ripple
   strokes #8FC3D3 at 1.5 px (14 to 20 px wide), leaving the middle third open; 5 to 8 reed tufts
   (#8E9A6E with ink) and 2 or 3 bone-white snags #CFC6B4 on the shore.
4. **Signature on both:** along the wild's outline (cell edges not shared by two cells of the
   same wild), a 3 px ink contour #1C1A17 in place of the province border; inside it, cliff ticks
   on peaks (#E9E4D8 at 85%, perpendicular, 5 px apart, 4 to 7 px long, seeded ±1 px; 3 px and 4
   px apart at Far) or a 2 px shore keyline (#E9E4D8 at 70%) on the mere.
5. **Names:** Alegreya Sans italic 400, letter-spacing 0.08 em (`ctx.letterSpacing` where
   supported), #E9E4D8, no halo, 11 to 16 px by area, at the largest cell's centroid; no stamp
   inside the label box plus 4 px.
6. **Drawn in every mode, at every zoom, never tinted, dimmed, hatched or fogged.**
7. **Passable Mountains:** 4 to 7 small, spaced, snowless peaks (lit #B4C1C6, shade #6E7F86,
   ink) and a dashed footpath #2B2620 at 75%, 1.5 px, dash [4, 3], through the seat between the
   midpoints of the two longest edges.
8. **Hover** (the existing tip system, key `wild:<id>`): the rim goes to 100%; the card reads
   "The Ashspine", "Peaks · Impassable", the rule sentence from 1.2, and "Borders:" with each
   bordering province as a link (`selectProv`). A province's own tooltip gains "Borders the
   Ashspine (impassable)" when it does.
9. **With Varo selected:**
   - over a wild, the cursor label reads "✕ Impassable: the Ashspine"; right-click toasts "No
     path crosses the Ashspine." and issues nothing;
   - right-click `acrossTarget`: the path bends around the range (because `nbrs` skips wilds),
     and the toast and the ETA label add "around the Ashspine" (`barrierOnLine`: the first wild
     polygon the segment between the two centers crosses);
   - right-click `closedTarget` (if any): "No path: the Ashspine blocks the way, and the way
     around crosses hostile {name}."
10. **Passability** (mockup control): hatch at 45° every province Varo cannot reach (the game's
    unreachable pattern), outline every wild 4 px #E9E4D8, and show "Review only: not a game
    mode".

### Step 4. Terrain detail (section 3; Ownership mode only, in the decoration bake)

- Seed each province's layers with `rngFor('map:11:' + i + ':' + layer)`.
- **Ground textures** (lightness within ±8% of the fill, ±4% inside label, token and seat boxes):
  - Plains: 120 stipple dots; 1 or 2 short hedgerow polylines #5E7046 at 50% with bush dots;
  - Farmland: a Voronoi of 5 to 9 seeds inside the cell; each field ±6% L\*; furrows 4 px apart
    at 0°, 90°, +30° or −30° per field (never 45°), #A07A20 at 35%; hedges along field edges
    #465A28 at 55%;
  - Forest: rows of small arcs (r 4 to 6), #2A3A21 at 40% and #4B6339 at 30%;
  - Hills: 3 or 4 curved hachures on the lower-right of each Poisson point, #6E561C at 50%;
  - Mountains: scree stipple #6E7F86 at 40%;
  - Swamp: staggered horizontal dashes 6 to 14 px, #2C8C94 at 60%, and pools (ellipses #2C8C94
    at 45%);
  - Wasteland: the edges of a fine Voronoi (20 to 30 seeds), #8F6E64 at 45%, 1 px.
- **Standing stamps** with the section 3.2 counts per band (Far masses, Mid, Near): faces at the
  fill +12% L\* and −18% L\*, a 1 px ink outline #1C1A17 at 70%. Shapes: tree crowns (circle
  clusters, the darker face lower right), humps (half ellipses with 3 slope strokes), small
  snowless peaks, reed tufts (4 lines), rocks (two-face polygons), grass tufts (3 lines),
  haystacks, a windmill.
- **Placement:** Poisson slots inset 8 units, each with a seeded rank (Far ⊂ Mid ⊂ Near), sorted
  by distance from the seat; no standing stamp inside the label box (96 × 30 screen px at the
  label), the token box (30 × 48 above it) or the seat box, plus 4 px; drawn by bottom edge;
  coverage at most 60% at Mid and 75% at Near.

### Step 5. Settlements that grow (section 4.2)

- The seat sits below the label (its half height plus 6 px), clamped inside the cell.
- Tier from `pop` by `[2000, 5000, 10000, 20000]`; houses interpolated (1–2, 3–5, 6–9, 10–15,
  16–22); house *k* at angle k × 137.508° and radius 3.2 √k units, squashed 1.3 : 0.8, jitter
  and roof variant from `rngFor('house:' + i + ':' + k)`.
- Kits by owner, every roof with a 1 px ink outline:
  - red: longhouses, walls #8F8C88, soot roofs #3A3633 with a jagged crest line, ember window
    dots #FFB347 (1.5 px);
  - green: round huts, walls #A0785A, living roofs #4E6B3A with a lighter moss highlight;
  - none: fieldstone walls #D8CBB0, thatch #C2A86B.
- Thriving (pop ≥ 1.25 × start): the two newest houses get thatch #E3CF8F and garden plots appear;
  declining (≤ 0.80 × start): the two newest stand as roofless outlines.
- Walls by PD: 1 to 4 a watchtower; 5 to 14 a palisade ring (stakes #6B4A2B); 15 to 24 a stone
  ring #9A958C with crenellation ticks; 25 to 30 adds 4 towers and a gatehouse on the south.
- Landmarks: the capitals' keep, temple and lab in their kit (red temple: a stepped pyre tower
  with a lit brazier; green temple: a ring of 6 small trees around an altar; red lab: a black
  spire #2B2A28 with an ember window; green lab: a hollow tree tower); a scaffold grid whose
  height follows the build in quarters.
- **A temple without faith:** give Ashfen a temple (built at M8 in the time-lapse); under
  Thornwood dominion its brazier is unlit (a grey dot, no glow).
- Wellsprings: a stone basin #CFC6B4 with five pale drops #CFE8F0 and a hollow diamond; while
  claimed: a priest figure and a 10-day ring; once claimed: 4 standing stones in the claimer's
  banner and a filled diamond.
- Far: a keep glyph at the capitals and a roof cluster from tier 3; Near: yard details (a well, a
  cart, garden plots).

### Step 6. Land that differs by alignment (section 4.3)

- Wash (Ownership mode, provinces in sight): `mix(fill, wash, washMax × s / 10)`, Cinder #8F8C88
  at 0.10, Thornwood #5E7F45 at 0.06.
- Nation motifs in the slots nearest the seat, 8% / 15% / 22% of the slots at strength 1–3 / 4–6
  / 7–10:
  - Cinder: L1 ash stipple (#8F8C88 dots at 25%) and black cairns (3 stacked ellipses #2B2A28
    with one #FFB347 dot); L2 scorched patches (irregular #3A3633 blobs at 35% with 3 to 5
    #FFB347 specks), obsidian shards (small #1C1A17 triangles with a #6E6A64 edge), braziers;
    L3 charred trees (forest crowns replaced by bare #2B2A28 branches) and thin #FFB347 cracks;
    landmark at 7+: the burning cairn (a tall cairn with a brazier and a static #FFB347 ring at
    40%);
  - Thornwood: L1 blossom dots #EAD2DA in the crowns and ivy (#4E6B3A strokes) on grey stones
    #9A958C; L2 saplings, mossy standing stones (#9A958C with #5E7F45 tops), meadow dots #EFE7CF;
    L3 great trees (2× crowns), vines over houses, bramble arcs #5A3A28; landmark at 7+: the elder
    tree (an outsized crown ringed with blossom).
- Pole motifs in the outermost slots, 1 per effective step at Mid and 2 at Near (effective step =
  `round(scale × strength / 10)`, halves away from zero): give the Cinder Horde the Warlord
  scales (Fury 3, Turmoil 2: war cairns with spears, torn banners; broken fences, a toppled cart,
  a smoke wisp) and Thornwood the Elder Oak scales (Growth 3, Wild 2: fruit trees, lush crop
  clumps, doubled furrows; briars, ferns, a beast den).
- Ashfen (a Cinder town under Thornwood dominion 2) shows blossom around Cinder houses; call it
  out in "Try this" as "contested faith".

### Step 7. The time-lapse (growth over time, by alignment; section 4.7)

Moving the slider re-derives the example state by month from M3, with these deterministic deltas:
- population compounds monthly: × (1 + 0.002 + 0.003 × the province's effective Growth step), so
  Thornwood land visibly gains houses and often a tier by M40;
- Cinder dominion strength +1 every 6 months in its own provinces, up to 7; one ring of spread
  into neutral provinces every 8 months; Thornwood the same, up to 7;
- Ashfen: Thornwood dominion 2 rising to 5 by M24; Cinder retakes its faith at M40;
- M6: Sunmere's temple finishes (a scaffold M3 to M6); M8: Ashfen's temple;
- M12: Cinder takes 2 independent provinces (bands at once, kits at the next month); Varo at
  6 / 14 HP (bandage);
- M14 to M15: a Cinder army pillages a Thornwood border province (smoke; population −8%; unrest
  50: barricades), which drops a tier and turns "declining";
- M17 to M18: a Cinder priest claims Sunmere (the priest figure and ring, then lit stones);
- M20 to M23: Burn the Fields on a Thornwood province (irregular char patches and three thin
  smoke lines, never a hatch); Kharnath's PD reaches 15 at M20 (stone wall) and 25 at M48
  (towers, gatehouse);
- M24: Ondra becomes the prophet (halo);
- M30: Thornwood takes Ashfen (the band at once, the Thornwood kit at M31);
- M36: Ash Rain on a Thornwood border province (an ash-flake stipple thinning in three steps over
  30 days);
- M60 to M64: a Cinder army besieges Deepmoss (tents in the Cinder banner; walls cracked at M62,
  breached at M64);
- the Morholt battle scar: churned earth M3 to M5, cairns from M6, gone at M15.

Changed provinces re-bake and cross-fade over 600 ms, at most 8 animated per step and the rest
instant (instant under reduced motion). A `Wipe` checkbox previews the M1-should brush wipe from
the dominating or capturing nation's side. The room's season follows the slider's month.

### Step 8. Leader portraits (section 5)

- Write `portraitSVG(c, size, state)` on the 256-unit grid (crown y 23, eyes y 100, chin y 169,
  collar y 200, face axis x 120, facing right), seeded by `rngFor('portrait:11:' + c.id + ':' +
  slot)` per slot:
  - backdrop: the banner darkened 35% with a radial vignette;
  - head shapes (6 ellipses), eyes and brows, nose and mouth at 96 px and up;
  - skin ramps: Cinder #6E6A64 / #8F8C88 / #B9B6B1 with ember-crack marks; Thornwood #6B4A2B /
    #A0785A / #C9A585; independents #8C6A4A / #B08A6A / #D2B293;
  - hair and beards; headgear per type (horned helm, ember hood with a flame clasp, ember
    circlet, tall cowl, ash hood; bark helm with antler stubs, wreath crown, twig circlet, antler
    hood, leaf hood); collars;
  - frame: round for own, round with 8 notches for other nations, a rounded square for
    independents; a 3 px banner band with its keyline; material by rank (oak #8C6A47, bronze
    #8C6A43 with 4 square rivets, brass #B8914A with corner brackets, the god's brass with a 1 px
    #D4B26A highlight and a crown notch, pewter #91A092);
  - the pip ring on a 2 px #1C1A17 ring outside the frame;
  - the gear chip (count and ○ ◆ ★) on the lower right at 48 px and up.
- Demo states: Ondra the prophet (halo, from M24 in the time-lapse); the Ashen Titan the pretender
  (a crowned rig-style stand-in for B.8, the god's frame); Seren, Ondra and the Titan with pip
  rings, Ondra's holy mark; Kesh with the scout and hood badges; Varo wounded at M12; Varo with
  one ◆ item (gear chip "1 ◆") and Ilsa with a notched frame.
- **Personal names:** keep the mockup's names and show them as "Varo, Ash Chieftain".
- **Placements:** the strip at 64 (replacing the letter tile `.face`); outliner rows at 24; the
  commander hover tooltips at 48; the battle report's commanders' fates at 40 (the independent
  captain dead: greyscale with a black corner ribbon); the Ilsa tooltip with its notched frame.

### Step 9. The chrome: approved, with hardware (section 2.8)

- `Chrome: Approved` (default): keep every token; add
  - the top bar's 3 px `--oak-0` #2B231C bevels top and bottom with grain lines #3A2E23 (two
    repeating gradients, at most 1 px, 20% coverage), a 1 px `--brass` #B8914A bottom keyline,
    square brass rivets at both ends;
  - the strip's 6 px oak spine with a brass keyline;
  - the docks' 6 px oak edge facing the map, a 1 px brass line, and 14 px L brass corner brackets
    (2 px #B8914A with a 1 px #D4B26A edge, square tacks) at the two map-facing corners;
  - modals in an 8 px oak frame with brackets; the Codex with a 10 px leather spine #4A3426 and
    square brass stitch marks at 40%;
  - action buttons with a 1 px #B8914A keyline (navigation buttons stay ghosts); tooltips
    unchanged.
- `Chrome: Warm retune (rejected)`: `--chrome-0/1/2` #2E2219 / #3A2B1F / #4A3727, with an inline
  strip in the Look group showing both palettes side by side and the measured failures labelled:
  "Urgent alert 2.66:1, Tide symbol 2.66:1 on --chrome-2 (under 3:1)".
- `Parchment: Report card and Codex`: the battle report card's face and the Codex article in
  #E8DCC2 with ink #1C1A17, dim ink at 70%, ▲ #8A4A12 and ▼ #2F5D73, and a 1 px ink ring on every
  mana symbol there.

### Step 10. Modes read with the detail (section 3.9)

- Outside Ownership, fade the decoration bake out over 150 ms (instant under reduced motion).
  Keep wilds, ritual marks, siege and pillage marks and Wellsprings.
- `fillFor`: tint over the terrain fill desaturated 80% and lifted to L\* 50 with linen (Forest
  #79786B, Hills #7E7767, Swamp #6F7A77); undominated provinces show that base, never #3B3832.
- Replace `heat()`'s stops with #4C5E96, #8170AC, #C4808E, #E6AC6E, #F8E6A6.

### Step 11. Fog (section 3.10)

- Mark the 8 provinces with the largest centroid `x` that border no own province as unexplored:
  the fill under a 4% linen haze (#E8DCC2), no land look; stamps and Far masses as line art
  (#3E3428 on Plains, Farmland, Mountains, Wasteland; #E8DCC2 on Forest, Hills, Swamp), no fill;
  a dotted border; a single sketched hut outline at the seat; population "unknown" in the
  tooltip.
- Mark two explored provinces out of sight: the fill desaturated 10%, the wash hidden, a dotted
  border.

### Step 12. Tokens and paths (section 3.6)

- `badgeSVG` becomes painted wood: the banner fill, a 1 px lighter top edge (the banner +12%
  L\*), a 1.5 px #1C1A17 outline at 70%, a contact shadow ellipse (#000 at 25%, 2 px down);
  independents in pewter #91A092; plates flat.
- At Near, a 40 px procedural standee (a helmeted silhouette in the banner tint) on each own and
  enemy token; an unscouted independent force as a cloaked figure with its strength word.
- The move preview becomes a thread (3 px #F4EEDF with a 1 px #1C1A17 edge, dashed [8, 6]) with
  square brass tacks (6 px #B8914A set as diamonds) and day plates at each step.

### Step 13. Events on the map (section 4.4)

- Morholt: the crossed-blades marker plus churned earth, broken spears and crows (fading by the
  time-lapse as in step 7).
- The siege, pillage, Burn the Fields and Ash Rain marks as step 7 schedules them; Fertile Season
  on Deepmoss from M8 to M14 as sprout motifs and a leaf badge (no sheen).

### Step 14. The portrait gallery (the Portraits control)

A modal with five rows:
1. twelve seeded Ash Chieftains at 64, to judge variety;
2. every Cinder and Thornwood commander type, and an Independent Captain in each of its four
   outfits, at 128;
3. one Ash Chieftain at 256, 128, 96, 64, 48, 40, 24 and 16 (level of detail);
4. one commander in every state at 64: healthy, under 50%, under 25%, prophet, pretender,
   starving, unpaid, holy, gear "2 ★", last seen, dead;
5. frames: each rank material in each allegiance shape at 96.

### Step 15. Vision preview (the Vision control)

Inline SVG `feColorMatrix` filters with the Machado 2009 full-severity matrices (as in
`tests/content/colorMath.ts`) for protan, deutan and tritan, applied to `.app` with CSS `filter:
url(#…)`, labelled "approximate preview".

### Step 16. Map detail Reduced

Terrain stamps at half density, pole motifs off, ambience off; settlements, walls, washes, nation
motifs, scars, marks, wilds and tokens stay.

### Step 17. Ambience (Table Full only)

- The candle flame's brightness ±3% and height ±2% from smoothed value noise at 0.7 to 1.3 Hz;
  the hearth glow ±4% on a 7 s cosine; at most 12 dust motes drifting 2 to 4 px/s in the window
  light, over the room and the oak only; the hourglass's grain stream.
- Frozen at the mean (motes removed) under reduced motion; stopped while `document.hidden`, while
  a modal is open, and while no table pixel is on screen.

### Step 18. Screenshots

Refresh `shot-desktop.png` (start zoom, Ownership) and add: `shot-lean.png` (leaning back, Table
Full), `shot-near.png` (Near over Kharnath: houses, walls, motifs, pole motifs), `shot-wild.png`
(the Ashspine hovered with Varo selected and the bent path), `shot-m40.png` (time-lapse M40),
`shot-m70.png`, `shot-portraits.png` (the gallery), `shot-pop-mode.png` (Population mode:
decoration off, wilds on), `shot-dominion.png`, `shot-fog.png`, `shot-chrome-ab.png` (both chrome
options), `shot-deutan.png`, and `shot-phone.png`.

### Step 19. Check before handing back

- No console errors; no `Math.random`.
- At the start zoom on 1280 × 720 and 1440 × 900: no label overlapped by a token, standee, stamp,
  house or motif; the oak band and the iron straps visible; the props' inner thirds visible.
- Panning stays smooth (the bakes are blitted, not redrawn).
- Reduced motion stops every ambient motion and makes repaints instant.
- Every old interaction still works (the constraints' list), and the phone layout still opens on
  Varo.

---
