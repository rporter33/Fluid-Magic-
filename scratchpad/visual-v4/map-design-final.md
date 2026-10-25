# The relief map: the v4 map design (final, after adversarial review)

2026-10-22. The build spec for the map half of the owner's v4 direction. The battle half is designed separately. The sim
is untouched: every mark on the map comes from map data, the viewer's `provinceView` and seeded presentation streams.
Nothing in the repo was edited (`git status` clean after every run).

This is `map-design.md` corrected by an adversarial review. Everything that survived the review is kept as written; the
changes, each with its reason and its measurement, are listed in "What the review changed, and why" at the end. The
review's own evidence is under `visual-v4/review/` (appendix).

**The owner's direction (2026-10-22, binding; verbatim from `docs/design/visual-references.owner-direction.md`):**

> Attached our photos from a game that I very much like the direction it's going the map you can see zoomed in
> and zoomed out. It's not cluttered it's clean and then also there's scenes from the endgame battle scenes. I
> would like the game to look this way.

**Read as, for the map** (the direction's item 2): clean and uncluttered first; natural painted relief terrain,
continuous across borders; ownership by thin border lines and a light tint; armies and towns as miniatures on bases;
labels and markers kept to what the zoom level needs; zoomed out, a terrain model with cliff edges. This supersedes the
parchment and ink look for the land itself. The war table, the tavern, the layered UI, the wilds, settlements,
alignment looks and portraits stay. Default: the terrain model sits on the oak war table like a sculpted sand table.

The screenshots are references for direction only. Nothing here copies their art, models, layouts, names, symbols or
UI, and the game they come from is never named, here or in any prompt.

**One conflict with the direction is put to the owner, not decided here.** The direction asks for "a light tint" over
owned land. A whole-province tint breaks the docs/09 color-blind rule between owners at every strength that can be
seen (§4.4). The default keeps the rule (a glow inside realm edges and a strong tint on the province the player points
at); owner question 1 offers the whole-province tint as a player setting with its measured cost.

**What stays exactly as approved:** the tavern, the oak table, its props, light and settings (war table §2, except the
cloth, §2 below); the layered UI, the top bar, the alerts ribbon, the docks, the strip and every key; the wild model
(peaks and meres, about 9% of the map, never near a capital, a way around within 6 provinces), its grounds, contour,
rim and names; settlements that grow by population and build walls by PD in the owner's architecture; land looks,
nation motifs, pole motifs and event marks; leader portraits; the six map modes and their mechanism; the fog rules
(what each state shows; docs/01 §14: every player sees all terrain and all ownership); the docs/09 distinct-colors rule
at 20 / 12; one light from the upper left.

**Evidence.** Scripts run with `npx tsx` from the repo root import the repo's own `tests/content/colorMath.ts` and
`src/content/colors.ts`, copied verbatim into `mapwork/calc/` (diff-checked against the working tree on 2026-10-22: no
difference), and the repo's `src/mapgen/generate.ts` and test fixtures read-only. The pixel checks run on a numpy
preview of this design over real mapgen maps.

| File (under `visual-v4/`) | What it measures |
|---|---|
| `mapwork/calc/search.ts` → `mapwork/calc/runs/*.out` | the albedo search: the natural target, the hard constraints, every run |
| `mapwork/calc/report.ts` → `mapwork/calc/report-final.out` | every raw color check of §4 (re-run in review: identical, except its water line, see §4.7) |
| `mapwork/calc/coverage.ts`, `review/coverage-far.ts` | the untinted core of every province for a border band of width w, 180 maps (§5.2) |
| `mapwork/preview/share.py` | each province's own-terrain share under the lookup warp, 60 maps, 5,100 provinces (§3.1) |
| `review/review-checks*.ts` → `*.out` | the review's color checks: states, antialiased rails, snow, water, hairlines, hover, cliff, tray, province-mean budget |
| `review/preview-fix.py` → `review/out-fix/` | the preview with this design's corrections (height blend, lit cap, fog, cliff), and its metrics |
| `review/escarp.py` → `review/escarp.out` | relief at terrain borders against cores (§3.2) |
| `review/patchiness.py` → `review/patchiness.out` | province-scale patchiness against the references (§4.9) |
| `review/explored-at-start.ts` → `.out` | how much of the map a nation has explored on day 0 (§9.1) |

---

## The design in fifteen lines

1. **The cloth becomes a terrain model** carved and painted on a board, standing on the oak war table. Its south faces
   drop as rock cliffs to the wood, it casts a soft shadow to the lower right, and its name is on a brass plaque.
2. **One light from the upper left lights the model.** The hillshade is mean-neutral over every province (each province
   averages to within ΔE 0.5 of its terrain's albedo), so the docs/09 rule still tests the colors drawn.
3. **The camera stays top-down and orthographic.** Depth is painted in one oblique, the battle's 40° pitch: relief
   shading, upright miniatures, and cliff faces on the camera-facing edges. Hit tests, rails and labels stay exact.
4. **One terrain per province for the rules, one landscape for the eye.** The paint looks up its terrain through a
   seeded warp of at most 0.10 D, so terrain edges wander across borders, and every province is still at least 80% its
   own terrain (measured minimum 81.8%). Relief has its own, wider blend, so hills and ranges grow foothills across
   borders instead of drawing each province's outline as a rim.
5. **A low-key natural palette** of seven terrain albedos that passes 20 / 12 in every approved state, with a stated
   texture floor, no passable ground within 20 / 12 of snow in any state, and nothing above OKLCH chroma 0.10.
6. **Ownership is thin rails, a rim glow and a hover tint.** A thin lit rail in the banner runs inside every realm edge,
   a soft glow of the banner fades inward from it, and the hovered or selected province takes a strong tint and an
   inner line. Line widths are set in device pixels so the rails survive antialiasing.
7. **Miniatures on round bases.** An army is one painted figure on a dark base whose rim carries the owner's banner and
   whose notched or smooth silhouette carries allegiance. A town is a walled ring on a base; hamlets are small sprites
   on the land. No numbers stand on the land.
8. **Labels by zoom.** Far: capitals, Wellsprings and wilds. Mid adds only what the player points at, plans with or
   hovers in a panel. Near names every province. The numbers layer and a held Shift show the rest at any zoom.
9. **Wilds stay and become sculpture:** granite massifs raised above everything, snow only on them, and sunken black
   meres, each keeping its 3 px contour, light rim and name.
10. **Water stays inside one province.** Lakes, ponds and streams are scenery, drawn as vector shapes; rivers between
    provinces wait for a crossing rule (owner question 4).
11. **Fog and modes keep their rules.** Terrain is public, so unexplored land shows the whole sculpted model under the
    approved 4% haze, and what the viewer does not know (settlements, springs, motifs) is simply absent. Data modes tint
    a grey model with gentle fixed relief.
12. **Bake once per map.** One 2048 × 1280 bake on every device, made by tiled GPU passes from CPU rasters that are
    cached by a hash of the map; per frame one composite draw, vector rails and water, one miniature atlas.
13. **v3's paper look goes:** washes, ink borders, bands, stamps, tracks, chips, badges, region names on the land,
    vignettes and the cloth margin. What carried information moves to a zoom band or one gesture away (§8).
14. **Owner art** can supply ground detail tiles, miniature figures, town kit pieces, the Wellspring and the plaque;
    every item has a procedural fallback and prompts that never name a game.
15. **docs/09 and docs/07 change** in the sections listed in §12; `palette.test.ts` gains the rail (antialiased), glow,
    relief, snow and water checks.

---

## Rulings

**V1. The model replaces the cloth; the table stays.** The approved war table frames the map as a painted cloth. The
direction keeps the table and asks for a terrain model on it, so the cloth's surface becomes the model's surface, the
cloth's margin parts move to the table (§2.4), and the room, oak, props, ambience and Table settings are unchanged.

**V2. Top-down orthographic, with one painted oblique.** docs/09's "the camera never tilts; depth is painted, never
simulated" stays true. Vertical faces (the model's edge, wild crags, mere banks) and every miniature are drawn as seen
from the battle's camera pitch, 40° above the ground, looking north: a vertical height h shows as 0.77 h on screen and
a circle on the ground as an ellipse 0.64 as tall as it is wide. One oblique for the map and the battle lets both use
one figure atlas. The surface itself is never displaced, and no face or piece is drawn over passable land it does not
stand on: faces are drawn below the model's outline (over the table) or inside a wild's own polygon, so every pixel of
land is where the sim's polygon says. A tilted or perspective camera was considered and rejected for M1 (§2.5).

**V3. A light on the model, mean-neutral.** R19 ("no light, grade or vignette ever falls on the cloth") is replaced:
one neutral daylight from the upper left (azimuth 315°, elevation 40°) shades the relief. Lit faces brighten by at
most 0.6 of the terrain's swing and shaded faces darken by at most the full swing, as real hillshade does. Over each
province's pure-terrain pixels the shading's mean is removed, so the province's mean color is within CIEDE2000 0.5 of
its albedo (measured 0.07 at worst on the corrected preview). The offset is blended across the ecotone so it never
draws a step at a border. No grade, vignette, season tint or time of day falls on the model. The table's own lights
stay masked off it.

**V4. The rules read one terrain per province; the albedo may cross borders only by the warp.** The renderer paints a
province's pixel with the albedo of the province found at the pixel's position displaced by a seeded warp of at most
0.10 D (D = 90 units, the median province diameter on every map size). Each province is therefore at least 80% its own
terrain, with organic fringes instead of polygon edges. Relief (with its own wider blend, §3.2), light, cast shadows
and forests' shadows run continuously across borders; the albedo does not.

**V5. The albedos are law, as the fills were.** Seven terrain albedos replace the fills in `TERRAIN[].fill` and pass
docs/09 unchanged: 20 / 12 on raw albedos and across every approved state. Relief and ground detail move single
pixels; the floor they keep is stated and tested (§4.3).

**V6. No whole-province owner tint by default.** A translucent tint over a whole province drops terrain pairs under the
rule at every strength that can be seen (§4.4). The tint therefore lives where ownership is read: a rim glow inside
realm edges, and the full tint on the one province the player hovers or selects. This departs from the direction's
"light tint" and is owner question 1.

**V7. Rails replace bands, under the band rule, antialiasing included.** A rail is a lit bead: the banner line between
a light keyline (#F4EEDF) on the side facing the light and a dark one (#1C1A17) on the other. It reads on its ground
when the banner differs from the ground, or either keyline differs from both, at 20 / 12, on every relief extreme,
under its own glow, half-blended with any neighbor terrain, in every state. Solid, all 16,170 grounds pass for all 11
banners at 3.87:1 or more. Lines on oblique edges are antialiased, so every line of a rail is at least 1.5 device
pixels wide (§5.1): at the resulting worst coverage 2 of 48,510 cases miss by under 0.1 at device pixel ratio 1, none
at 1.5 or more, and none with the high-contrast borders option.

**V8. Snow and crags stay reserved to the wilds.** Passable mountains are relief without snow; no passable albedo's lit
relief comes within 20 / 12 of snow in any approved state. Cliffs appear only at the model's edge (no information) and
on the wilds.

**V9. Water never runs between provinces** (v3's H5 stands). Lakes and ponds lie inside one province's pure core,
streams rise and end inside one province, and the only water that leaves a province falls off the model's edge.

**V10. Miniatures carry no numbers.** Counts, PD and dominion strength leave the land for hover, selection, the
engagement preview and the numbers layer. Allegiance is the rim's color and the base's silhouette (never color
alone). One status mark by exception stays on the base.

**V11. "Information never thins" becomes "information is one gesture away."** Each zoom band has a label budget (§7);
everything else is in the hover card, the numbers layer, a held Shift, a hovered link in a panel, or the panel. docs/07
principle 2 still holds: every number a decision needs is printed where the player decides (cursor label, engagement
preview).

**V12. Fog and modes: rules unchanged, looks restated, states measured.** What each fog state shows is docs/07's and
docs/01's; how it looks changes (§9). Every look is a state in the palette test. Ownership and terrain are public in
every state (docs/01 §14).

**V13. Presentation randomness is seeded, separate and engine-independent.** Height noise, warp, detail, lakes and
miniature variants come from `streamFor(\`relief:${seed}\`, purpose)` and `hash32(seed, provinceId, purpose)` in
`src/present/rand.ts`, never from `state.rng`. The rule-bearing rasters (terrain lookup, cores, distances, water
placement, the quarter-resolution heightfield) come from a CPU reference in `src/present/map/` that uses only
arithmetic, `Math.sqrt`, `Math.floor` and table value noise, so it is bit-identical in every engine and in the Node
tests; the GPU path draws the same picture from the same seeded tables and is checked against it in the browser smoke.

**V14. Settlements stay; their stage changes.** Growth, walls, kits, ruins, scaffolding and the unlit brazier are drawn
as miniature pieces. Hamlets and villages are small live sprites on the land (never baked: they change monthly); a seat
becomes a town piece on a base from population step 4, or with walls, a fort, a temple or a lab, or as a capital (§6).

**V15. The cloth's look rules go with the cloth.** The paper, washes, ink, wobble, bands, tracks, stamps, flecks,
region names on the land, vignettes, the margin, tacks and hem leave (§8). The shape-family rule (H6) stays for every
miniature and scenery piece.

**V16. Presentation numbers live in one place.** Every size, width, amplitude and threshold below is a row in
docs/09-balance "Map presentation" and a constant in the renderer's params module, read by the tests.

**V17. The bake is a pure function of the map.** Nothing that changes during a game is written into the bake: hamlets,
land-look washes, fog, ownership, hover, modes and battle scars are live layers or decals. The bake can therefore be
rebuilt at any time from the map, the seed and the bake version, and its cache never goes stale.

---

## 1. What the player sees, by zoom band

The bands stay docs/07's: the median province's on-screen diameter is under 70 px (Far), 70 to 180 px (Mid) or over
180 px (Near). The camera rules stay the war table's (§2.7 there): the game starts with the model fitted inside a 32 px
oak band (the fit now includes the south cliff face and the plaque), the wheel leans back to 0.75 × the table's fit and
pushes in to a 420 px median province, a ±8% detent settles on the start zoom, `Z` and Fit return to it, the pan is
clamped to the table, and the camera never rotates or tilts. On Medium at 1280 × 720 the start view is about 95 px per
province (Mid); at 1440 × 900 with the docks collapsed it is about 140 px; fully leaned back it is about 42 px.

| | Far: the model on the table | Mid: the start view | Near: the land |
|---|---|---|---|
| The model | the whole model on the oak, the room around it; cliffs on its south faces, its shadow on the wood, the plaque | the model inside the oak band | land only |
| Relief | hillshade, cast shadows, crags; vertical scale fixed | the same | the same, with the detail tile |
| Ground | canopy reads as dark masses, fields as tone | canopy as soft clumps, field parcels as tones, pools, lakes, streams | detail tiles (furrows, grass, scree), live tree crowns in the visible chunks |
| Ownership | realm rails; internal borders as hairlines; glow 0.05 D (2 to 3.5 px) | realm rails, internal two-tone lines, glow | the same |
| Hover and selection | strong tint and an inner line on the province | the same | the same |
| Miniatures | towns (step 4 or more, walled, built or capital) as simplified pieces; one army per nation per province; no hamlets | towns, muted hamlets, armies, the Wellspring | everything, plus spring stones, independents' guards, mines and windmills |
| Labels (§7) | capitals, Wellsprings, wilds | adds what the player points at, plans with, or hovers in a panel | every province name |
| Chrome | unchanged | unchanged | unchanged |

Sizes change continuously with the zoom (§6.4), never in a step at a band edge; ground detail and hamlets cross-fade
over 150 ms at a band edge (instant under reduced motion), as v3 did.

---

## 2. The model on the war table

### 2.1 The object

The map is a carved terrain model: a board cut to the map's outline (mapgen's rounded rectangle), its top sculpted and
painted (the relief bake, §3), its edge a rock cliff. It lies where the cloth lay, at the cloth's size, and the table
still extends 0.35 × the model's height beyond it on every side. The tavern, the oak, the props, the table's light and
ambience, and the Table settings (Full, Simple, Off) are the war table's, unchanged. Under Table Off the model sits on
the flat #15130F surround with its cliff and shadow.

### 2.2 How the model meets the table

| Part | Rule | Measured |
|---|---|---|
| Cliff face | under every south-facing outline edge (outward normal pointing down the screen), a rock face 24 units tall, shown 18 units tall in the V2 oblique (about 19 px at the 1280 × 720 start zoom, 8 px fully leaned back), drawn below the edge, over the table; strata bands every 6 units at 86% value; #3A3436 at the top to #221E20 at the foot; east and west edges show a face in proportion to their southward slope | top against the oak body #8F7459 2.79:1 (ΔE 27.7 / 26.4), foot 3.77:1 |
| Worn lip | a 1.5 px line of #E9E4D8 at 50% along the whole outline, on the land's side | separates the land's edge from the cliff top by 3.25:1 at worst (dark forest); without a lip, shaded hills against the first draft's #4A4246 top gave 1.04:1 |
| Plinth | the face's lowest 3 units are the board the model is built on: dark oak #2B231C (the chrome's `--oak-0`) with a 1 px lit top edge | 3.54:1 on the oak body |
| Contact | a 2 px #1C1A17 line at 60% where the plinth meets the table; the model's shadow on the oak, offset 0.05 D to the lower right, blurred 0.06 D, #000 from 55% at the plinth to 0 | the cloth's contact shadow was 35% at 3 px; the model is thicker |
| Waterfalls | a stream that reaches the edge falls down the face as a pale streak (#B9D3CF fading out) and ends at the plinth | — |
| Plaque | the cartouche's job: the map's seeded name (`mapTitle(seed)`) in Marcellus SC on a brass plaque #B8914A centered on the south face, 0.9 D wide, set on the plinth | ink #1C1A17 on brass 5.94:1 |

Option for the owner (question 2): a **sand-table tray**, an oak-framed box standing on the table (an object like the
cloth was, so the approved table top and its bake are unchanged) whose dark floor #1E1915 shows in an 8-unit margin
around the model, so the cliffs drop into shadow as in the references. Measured: the land's edge against the floor is
1.14:1 on shaded forest alone, 4.65:1 at worst with the worn lip; the cliff top is 1.43:1 on the floor and the foot
merges (1.06:1), which is the intended drop into darkness. It costs one procedural frame and about 5% of the start
view's province size (the frame and floor take 56 units of the model's height on Medium, against 30 for the open oak).
The review's preview of it read as a dark picture frame in a top-down view rather than as the references' void, so it
is not the default.

### 2.3 The light

- **One neutral daylight from the upper left**, azimuth 315°, elevation 40°, the light v3 already used for stamps and
  settlements (H14). It shades the relief (hillshade), casts the miniatures' shadows to the lower right, and lights the
  model's lip.
- **Asymmetric, as light is:** ΔL = A_t · tanh(3.2 (s − sin 40°)), clamped to [−A_t, +0.6 A_t]. A face turned to the
  light gains less than a face turned away loses. This keeps passable mountains' lit faces at L\* 73 (79 before), away
  from snow in every state (§4.7), and keeps them from reading as ice.
- **Mean-neutral** (V3): per province, the mean lightness change over its pure-terrain pixels is removed. The offset is
  a smooth field: each province's offset is spread with its warped one-hot blurred over 0.03 D and the result iterated
  three times, so same-terrain neighbors meet without a step and each province's core mean stays within ΔE 0.5 of its
  albedo (corrected preview: 0.07 at worst, median 0.00).
- **Cast shadows** from peaks and mountains: a height march in the shade pass (16 steps toward the light, at half the
  bake's resolution, at most 0.25 D long), darkening by up to 6 L\*, inside the same mean-neutral budget.
- **Valleys** darken by up to 4 L\* (ambient occlusion from the blurred height difference), also mean-neutral.
- **What never falls on the model:** the hearth's warm gradient, the candle's pool, the table vignette, season tints
  (they stay on the room and the oak, masked off the model as they were off the cloth), and any time of day.

### 2.4 What the cloth's parts become

| Cloth part (war table §2.3, v3 §2.7) | v4 |
|---|---|
| Linen #E8DCC2 and its fiber flecks | gone; the model's surface is the bake, its margin is the oak |
| Title cartouche | the brass plaque on the south face (§2.2) |
| Compass rose | a brass compass prop in the upper-right table slot, inert and decorative like the other props |
| Four square brass tacks, leather hem | gone (nothing to pin) |
| 3 px outline and the 0.8 px second neatline | gone; the worn lip and the cliff draw the edge |
| Wash overrun into the margin | gone |
| Contact shadow | the model's shadow (§2.2) |

### 2.5 The projection, and why not tilt

| | Top-down, painted oblique faces (**chosen**) | Fixed oblique 2.5D (y squashed, upright everything) | Real perspective (a tilted mesh) |
|---|---|---|---|
| Picking and hit tests | exact on the sim's polygons | an affine transform; exact | inverse projection per event; far land is small |
| Rails and labels | screen-constant lines and labels on exact geometry | the same after the transform; labels must not squash | lines and labels need per-point scale; far labels shrink |
| The bake | one 2D texture | one texture, drawn squashed; relief and shadows must be baked for the squash | a texture on a `PerspectiveMesh`, not measured |
| Depth read | hillshade, cast shadows, upright miniatures, cliff faces on south edges | stronger: every vertical face shows | strongest: the references' look |
| docs/09 | keeps "the camera never tilts; depth is painted" | changes it | changes it |
| Cost | the research's bench numbers (§10) | the same plus depth sorting of terrain features | unmeasured; harder picking and labels |

The chosen projection keeps every approved rule that depends on exact geometry (hit tests on the same polygon, the
label test, the band rule's geometry) and costs nothing at run time. A gentle tilt at Far only, while leaning back, is
offered as owner question 3 for M1-should, after the bake exists.

---

## 3. Terrain

### 3.1 One terrain per province, one landscape

- **The lookup warp.** The albedo painted at a point p is the terrain of the province that contains p + w(p), where w is
  a two-scale value-noise field (features of 40 units at weight 0.7 and 9 units at 0.3), clamped to |w| ≤ 0.10 D = 9
  units, seeded by `hash32(seed, 'warp')`. A point inside a wild or off the land is never warped into or out of: wild
  edges and the model's edge stay sharp (cliffs and shores). The one-hot result is box-blurred over 1.1 units (0.012 D)
  for the albedo, which softens the fringe into a narrow ecotone without a polygon-shaped band.
- **Measured** (`preview/share.py`, 60 mapgen maps: Small, Medium and Large, 2 and 4 nations, seeds 1 to 10, wilds on;
  5,100 provinces): a province's own-terrain share (pixels whose lookup lands in a province of the same terrain) is

  | Warp limit | Minimum | 1st percentile | Median | Provinces under 0.80 |
  |---|---|---|---|---|
  | 0.05 D | 0.907 | 0.941 | 0.984 | 0 |
  | 0.08 D | 0.853 | 0.907 | 0.974 | 0 |
  | **0.10 D** | **0.818** | **0.883** | **0.967** | **0** |
  | 0.12 D | 0.781 | 0.862 | 0.961 | 2 |

  0.10 D is the widest limit that keeps every province at 80% or more; the test holds 0.80 (§13).
- **What crosses borders:** the albedo's fringe (up to 9 units into the neighbor), relief and its shading (§3.2: up to
  about 0.25 D), cast shadows, and canopy shadows. **What does not:** a province's albedo beyond the fringe, water,
  settlements, ownership.
- **What the eye gets:** forests, fields and grass meet in ragged edges that cross the rails, same-terrain neighbors merge
  into one wood, one range or one stretch of fields (mapgen clusters terrain by noise), and hills and ranges throw
  foothills into the land around them. The references' land is more uniform than ours can be: seven color-blind-distinct
  terrains at mapgen's shares always show province-sized patches (risk 1, §16, with the measurement).

### 3.2 The heightfield

Height h(p), in units of the vertical scale (26 world units per unit), from the warped terrain weights for height
w^h_t(p): the same warped one-hot as the albedo, but blurred with a Gaussian of σ = 0.12 D (11 units) instead of 1.1
units.

h(p) = Σ_t w^h_t(p) · (B_t + A_t · n_t(p)), with n_t a seeded value-noise fBm (5 octaves, lacunarity 2.03, gain 0.5).

| Terrain | Base B | Amplitude A | Feature (units) | Noise |
|---|---|---|---|---|
| Swamp | 0.03 | 0.04 | 60 | fBm |
| Farmland | 0.08 | 0.075 | 60 | fBm |
| Plains | 0.10 | 0.15 | 60 | fBm |
| Forest | 0.14 | 0.175 | 45 | fBm, plus the canopy (§3.5) |
| Wasteland | 0.18 | 0.25 | 40 | fBm |
| Hills | 0.28 | 0.30 | 30 | fBm |
| Mountains | 0.48 | 0.62 | 22 | ridged (1 − 2\|n\|), rescaled 1.2n − 0.2 |
| Wild peaks | 1.25 | 0.60 dome + 0.15 ridged | 30 | a dome over the range's cells plus ridged noise, 3 octaves; never under 1.10 |
| Meres | −0.05, flat | — | — | a still surface sunk below its banks |

- **Why the height has its own blend.** With the albedo's 1.1-unit blend, base heights stepped at every terrain border
  (plains 0.10 against hills 0.28 over two units), and the hillshade drew each terrain patch's warped outline as a lit
  and shaded rim: hills read as mesas. On the Near preview the relief in a 3-unit band along terrain borders reached
  p90 4.0 L\* on plains and 5.5 on farmland against 0.4 and 0.3 in their cores (10 and 18 times), forest 5.1 against
  1.1. With σ = 0.12 D and the low terrains' amplitudes raised 2.5×, the ratios fall to 2.7 (plains), 1.7 (farmland)
  and 1.9 (forest), hills no longer show a rim (band 5.4 against core 6.2), and the foothills cross the rails
  (`review/escarp.out`, `review/escarpment-compare.png`).
- **The low terrains' amplitudes** (swamp, farmland, plains, forest, wasteland: 2.5× the first draft) give their cores a
  visible roll; the test asks each terrain's core p90 swing to reach at least a third of its A_t (§13). The color checks
  are unchanged: they use the swing cap A_t of §3.3, not the noise amplitude.
- **Passable land is soft-clamped under 1.00** (mountains reach about 1.10 before the clamp), so the wild peaks, never
  under 1.10, are always the highest ground.
- **Invariants** (tested on the CPU reference): every wild-peak pixel stands higher than every passable pixel within
  2 D; every mere surface lies lower than every land pixel within 1 D; the field is a pure function of (map, seed, bake
  version).
- **Seeds:** `hash32(seed, 'relief', terrain)` per terrain, `hash32(seed, 'wild', wildId)` per range.
- The heightfield never feeds the sim. It does not change movement, supply or battle.

### 3.3 Hillshade and shading

- Horn's gradient on the heightfield; shade s = max(0, n · l) for the light of §2.3.
- Lightness change ΔL = A_t · tanh(3.2 (s − sin 40°)), clamped to [−A_t, +0.6 A_t], plus the ground detail of §3.4, plus
  the cast shadow and the valley term, with A_t the terrain's swing cap (L\*, blended by the albedo weights):

  | Plains | Farmland | Forest | Hills | Mountains | Swamp | Wasteland |
  |---|---|---|---|---|---|---|
  | 4 | 4 | 6 | 9 | 16 | 3 | 6 |

- Then, per province, the mean of ΔL over its pure-terrain pixels is removed as a smooth field (§2.3). The color is the
  blended albedo in CIELAB with ΔL added to L\*, converted to sRGB once in the bake.
- These caps are what §4 measures; the corrected preview's measured p95 swings are in §4.9.

### 3.4 Materials and ground detail

All ground detail is lightness only, mean-neutral, and drawn into the bake. Hue never varies inside a terrain (v3's H1:
a hue mottle breaks the rule). Every detail feature is at least 2 texels of the bake (0.8 to 1.2 units, by map size):
finer detail aliases into static at Mid and belongs to the Near detail tiles.

| Terrain | Reads as | Mid detail (in the bake) | Near detail (tiles, live) | Relief |
|---|---|---|---|---|
| Plains | open grassland | broad mottle ±3.5 L\* (22-unit patches) | the grass tile | low rolling |
| Farmland | tilled country | parcels (7-unit cells) in four tones ±3, no furrows | the field tile with furrows at 0°, 90° or ±30° (never 45°, the reserved hatch), each parcel its own direction; a windmill (scenery, terrain-coded) | nearly flat |
| Forest | dense woodland | canopy clumps ±6 (3 to 6 units), broad mottle ±2 | live crowns in view (§3.5) | gentle, with the canopy's own rim light |
| Hills | rolling upland | broad mottle ±2 | the rock and turf tile; a mine at the foot of a slope (terrain-coded) | rounded, foothills across borders |
| Mountains | bare passable range | scree in the shade faces | the rock tile; a mine | ridged, no snow |
| Swamp | wet lowland | pools of darker wet ground up to 20% of the province (inside its mean), reed mottle ±2 | reeds, the marsh tile | flat |
| Wasteland | dry barrens | crack and dune mottle ±3 | the cracked-earth tile | low |

### 3.5 Forests

- The canopy is texture, never stamps: soft clumps of crowns at Mid that fuse into a dark mass, as the references'
  forests do. The canopy adds 0.04 to the height, so a forest's sunlit edge and shaded edge come from the same hillshade
  as the land.
- Lone trees: in Plains and Hills at most 3% cover, never within 0.15 D of a seat, and inside the province's mean.
- At Near, the crowns in view become live sprites: one `ParticleContainer` per 128-unit chunk (the visible area at Near
  is about 343 × 214 units, 12 to 15 chunks), at most 20,000 crowns on screen, thinned by a seeded rank where a view is
  all forest; crowns of 2 to 4 px at the closest zoom without a larger bake.

### 3.6 Water

- **Lakes:** at most one per province, only in Plains, Farmland, Forest and Hills, at most 8% of the province, inside its
  pure core and at least 0.10 D + 2 units from every border, never in a seat, token or label zone.
- **Ponds:** at most 2% of a province, the same placement rules.
- **Streams:** at most one per province, traced downhill on the CPU reference's quarter-resolution heightfield from a
  seeded source in the core; it ends in the province's lake or pond, sinks into a swamp's pools, or reaches the model's
  edge and falls (§2.2). A stream that would come within 0.10 D of a border is rejected. 1.5 to 3 units wide (2 to 5 px
  at the start zoom).
- **Drawn as vectors:** lakes and ponds as smoothed polygons, streams as width-varying polylines, one mesh over the
  composite, so shores stay crisp at Near whatever the bake's resolution. Swamp pools are part of the swamp's ground and
  its mean, in the bake.
- **Color:** water #50AF9B with a shore band 3 L\* darker and a highlight on the lit bank. Raw, it is 20 / 12 from every
  albedo, both wild grounds and snow. Across map states (a lake under its province's haze, desaturation or wash) it
  keeps 19.7 / 8.5 at worst (against Wasteland); no color within ±6 L\* and ±12 a\*b\* of it passes across states. A
  lake is therefore told apart by its form, the smooth shore line and the bank highlight, and is never more than 8% of
  a province.
- **Fog:** water is public map scenery and shows in every fog state (§9.1).
- **Not in M1:** rivers between provinces, bridges and sea. A river along or across a border reads as a rule; it waits
  for a crossing rule (owner question 4).

### 3.7 Cliffs

Only two kinds: the model's edge (§2.2), which carries no information, and the wilds' crags (§3.8). No province shows a
cliff, a mesa or an escarpment, and the height blend of §3.2 makes sure the relief does not draw one either: cliff
faces and cliff ticks are the wilds' shape family (H6).

### 3.8 Wilds in relief

- **Peaks:** a granite massif raised above all passable land (§3.2), lit faces #8A857E, flat shade faces #2A292C, snow
  #F2EEE6 on the highest eighth of the massif where its faces turn to the light, and crags: painted oblique faces 10
  units tall (8 on screen) along the south side of the range, drawn inside the range's own polygon, never over a
  province. Snow means impassable, as approved.
- **Meres:** still dark water #24222A sunk below the land, its north bank shown as a 4-unit face (#3A3640) inside the
  mere's polygon, pale ripples #8FC3D3, reeds and bone-white snags (approved).
- **Kept as approved:** the 3 px ink contour on the outline, the light rim #E9E4D8 inside it, the italic letter-spaced
  name, and "never tinted, faded, hatched, dimmed or fogged". Hovering a wild shows its card and nothing else on the
  map; no hover tint, glow or rail enters a wild. Rails stop where a province meets a wild; the contour is the border
  there.
- **Passable against impassable:** the massif's lit rock is 16.9 / 16.6 from passable mountains' ground (shade faces
  26.7 / 25.7, snow 21.4 / 20.4); the contour, the rim, the snow and the height carry the difference, as approved.

### 3.9 Roads

None in M1. v3's tracks joined every neighbor pair, so they carried no rule and added busyness at every zoom (§8).
When the player moves, the path preview (the light thread with square brass tacks, approved) shows the route.

---

## 4. Color, measured

Every figure here is from `mapwork/calc/report-final.out` or the review's `review/review-checks*.out` (the repo's
`colorMath.ts`: CIEDE2000, and Machado 2009 at full severity for protanopia, deuteranopia and tritanopia), written
normal / worst deficiency unless marked. Swatches: `mapwork/out-final/albedos.png`.

### 4.1 The albedos

| Terrain | v4 albedo | L\* | OKLCH C | Hue | Reads as | Keyline (`keylineFor`) | WCAG |
|---|---|---|---|---|---|---|---|
| Plains | **#78894A** | 54.4 | 0.090 | 122 | olive grassland | dark | 4.53 |
| Farmland | **#D5B16B** | 74.0 | 0.098 | 83 | ripe wheat | dark | 8.54 |
| Forest | **#1A3819** | 20.5 | 0.065 | 143 | deep woodland | light | 11.17 |
| Hills | **#6D5303** | 36.8 | 0.092 | 87 | umber heath | light | 6.28 |
| Mountains | **#859BB8** | 63.3 | 0.050 | 255 | slate stone, no snow | dark | 6.10 |
| Swamp | **#38616D** | 38.7 | 0.050 | 219 | dark wet slate | light | 5.85 |
| Wasteland | **#877773** | 51.4 | 0.021 | 34 | dusty barrens | dark | 4.06 |

**How they were found.** A seeded (1+1) annealer over CIELAB (`calc/search.ts`, palette-ab's scheme), 16,000 to 20,000
steps a run, minimizing the CIEDE2000 distance (lightness weighted ½) to a natural, low-key target (the references'
forest, open grass and rock, and invented siblings in the same key for the terrains they do not show: plains #6E7A3A,
farmland #B39A5A, forest #24391A, hills #6A6436, mountains #7E8086, swamp #3F4A3A, wasteland #A89C8C), with every check
below as a hard constraint, plus: no albedo above OKLCH C 0.10 (mountains, swamp 0.05; wasteland 0.06), mountains cool
(hue 220 to 290) and no lighter than L\* 64, no albedo darker than L\* 22 before the last nudge. The chosen palette is
run n6 seed 61, then forest moved by ΔE 1.04 (`calc/nudge.ts`) so the granite margin passes unrounded. It is the best of
the 32 completed runs, not a proof of optimality.

**Distance from the target:** plains 5.7, farmland 7.9, forest 2.6, hills 10.4, mountains 13.1, swamp 17.2, wasteland
14.2 (RMS 11.2). The rule costs the most where the target was most muted: swamp and wasteland cannot both be dark
grey-green and grey-brown next to forest, hills and plains for color-blind players.

**Key and chroma against the earlier palettes** (area-weighted by mapgen's terrain shares):

| | L\* range | Area-weighted mean L\* | OKLCH C mean / max |
|---|---|---|---|
| A, approved fills | 29.8 to 81.8 | 58.3 | 0.075 / 0.149 |
| B, painted fills | 23.7 to 86.5 | 57.2 | 0.050 / 0.094 |
| **v4 albedos** | **20.5 to 74.0** | **46.4** | **0.072 / 0.098** |
| The natural target | 21.5 to 65.0 | 44.6 | 0.053 / 0.089 |

(The first draft quoted the v4 area-weighted chroma mean as 0.066; the report computes 0.072. 0.066 is the preview's
per-pixel mean.)

Open land now sits in the middle of the range (plains at L\* 54, against 81 and 87), the change the references make
most visibly. The preview's land is still about 16 L\* lighter than the references' in the median (§4.9): seven
terrains need the spread.

### 4.2 The docs/09 rule, unchanged

| Check | Measured | Needs |
|---|---|---|
| Raw albedos, closest pair per vision | 21.7 (mountains / wasteland) / 14.5 protan (forest / hills) / 14.3 deutan (plains / wasteland) / 14.7 tritan (plains / mountains) | 20 / 12 |
| Every pair of different terrains in any two approved states (raw, unexplored haze 4%, out of sight 10%, ash 10%, moss 6%) | 20.2 / 12.2 at worst; 0 of 525 pairs under (unrounded 20.19 / 12.17) | 20 / 12 |
| Granite #2A292C against every albedo in every state | 20.1 / 12.3 (forest; unrounded 20.06 / 12.30) | 20 / 12 |
| Mere #24222A against every albedo in every state | 23.3 / 14.2 | 20 / 12 |
| Both grounds against every albedo's relief extremes (−A, +0.6 A) in every state | granite 20.1 / 12.3, mere 22.9 / 13.7 | — |
| The strongest unexplored haze that keeps every pair | 4% (6% leaves 3 pairs under) | the approved 4% |

So `palette.test.ts`'s terrain test passes unchanged in code with the new `TERRAIN[].fill` values, and the approved
state caps (ash 10%, moss 6%, haze 4%, out of sight 10%) stay exactly as they are.

### 4.3 The relief texture floor (replaces v3's H13 floor)

Relief and ground detail move single pixels between −A and +0.6 A (§3.3). The rule binds the albedos; the floor states
what the textured pixels keep. At 0.4 of that range (the interquartile range of the shading: half a province's pixels
lie inside it), every pair of different terrains in every approved state keeps **17.1 / 10.3** (211 of 4,725 pixel
pairs under 20 / 12). At 0.25: 18.6 / 11.2. At 0.5: 15.4 / 9.7. At the full range: 9.8 / 5.6, mountains' shaded faces
against swamp.

v3's H13 held 19.5 / 11.0 for a mottle of about ±1.7 L\*. Relief that reads as relief is ten times that on mountains, so
the floor is lower; terrain identity rests on the albedo means (the rule), the relief pattern (ridged, rolling, flat),
the canopy, parcels and pools, and the hover card's terrain line. The test holds the floor at 17 / 10.

### 4.4 Why there is no whole-province tint by default

A translucent owner tint over a whole province, at strength t (normal blend), against every pair of different terrains:

| t | Same owner on both | Any two owners, or one unowned | Pairs under 20 / 12 |
|---|---|---|---|
| 0.04 | 20.3 / 13.0 | 17.5 / 10.0 | 84 of 3,024 |
| 0.08 | 18.4 / 12.0 | 13.4 / 4.6 | 354 |
| 0.12 | 16.5 / 10.8 | 8.8 / 3.7 | 554 |
| 0.20 | 13.7 / 7.8 | 4.5 / 1.2 | 765 |

The same holds on the approved and painted fills (`calc/explore.ts`: A drops to 15.2 / 7.7 at 8% and to 2.2 / 0.3 at
16%; a lightness-keeping "color" tint fails as well). At 20%, the references' "light tint", a tinted province of one
terrain can match another terrain under another owner (4.5 / 1.2). Hence V6 and owner question 1.

### 4.5 Rails: the band rule, restated for thin, antialiased lines

docs/09's band rule asked that a band read on every fill: the banner differs from the fill, or the keyline differs from
both. For rails the ground is no longer flat, so the grounds are, per terrain: the albedo and its relief extremes; each
of those untinted and under the banner's own glow at its 0.35 maximum; and each half-blended with every other terrain
(a rail near a fringe); all in every approved state. That is 210 grounds per terrain and banner, 16,170 for all 11
banners.

A 9 px band was always solid. A rail's lines are 1 to 2 px, and on an oblique edge an antialiased line of width w
covers its best pixel by as little as w − 0.5 at the worst sub-pixel offset: a 1 px keyline shows as a 50% blend, a
1.5 px one as 75%. The rule is therefore checked at the coverage the line actually gets.

| Rail | Keyline coverage | Banner coverage | Band rule fails (of 16,170) | Worst luminance contrast |
|---|---|---|---|---|
| One keyline chosen by the albedo (`keylineFor`, as bands do) | 1 | 1 | 208 (pale #B5D69C and #F3E6B8 on Forest, Hills and Swamp; Umbra #3D2B4F on Mountains and Wasteland) | — |
| The lit bead (both keylines), solid | 1 | 1 | 0 | 3.87:1 |
| The lit bead with the first draft's 0.75 px keylines (about 50% coverage) | 0.5 | 1 | 843 (Ember #FD6533 223, Tide #3A7BD5 205, Thornwood #00674B 171, …) | 1.79:1 |
| **The lit bead at 1.5 device px per line, worst offsets** | **0.75** | **0.75** | **0** | **2.72:1** |
| the same, banner line fully covered | 0.75 | 1 | 2 (Thornwood on a plains fringe half-blended with mountains, under its glow, in the haze or moss state: each misses by under 0.1) | 2.67:1 |

So every line of a rail is at least 1.5 device pixels (§5.1). With 2 device pixels (device pixel ratio 2, or the
high-contrast borders option at any ratio) every line has a fully covered core: 0 fails, 3.87:1. At device pixel ratio
1 the default rail misses the rule on 2 of 48,510 checked cases by under 0.1 and keeps 2.67:1; the high-contrast
borders option (docs/07 "Display options") clears both. The lit bead is the only rail that also keeps a visible thin
line for every banner on every ground; one keyline per banner and terrain passes the rule solid but falls to 2.16:1
(Tide on shaded Mountains).

### 4.6 The rim glow and the hover tint

- The glow is a tint of the banner over the ground at most 0.35 at the border, so its pixels are among the rail grounds
  above. The core it leaves untouched is at least 72.7% of every province at every zoom (§5.2), where the rule's albedos
  show.
- The hover (0.25) and selection (0.30) tints apply to one province; their pixels stay rail grounds (the strongest tint
  at a rail is the glow's 0.35), and the card names the terrain. A 0.25 tint can change a province by as little as ΔE 3.6
  (Radiance #F3E6B8 on Farmland), so every hover also draws an inner line (§5.3).
- Independents have no banner. Their hover pulls the ground toward its own `keylineFor` keyline at 0.20 (dark grounds
  lighten, light ones darken): ΔE 7.7 to 12.6 by terrain, where the first draft's #E9E4D8 at 0.20 moved Farmland by 3.6.

### 4.7 Other colors on the land and table

| Check | Measured |
|---|---|
| Water #50AF9B (L\* 65.5, OKLCH C 0.095), raw, against every albedo, mere and granite | at least 22.1 / 18.9 (plains) normal and 24.4 / 12.3 (mountains) under a deficiency; mere 53.1 / 43.5, granite 50.6 / 41.6 |
| Water, across map states (water and ground each in any approved state) | 19.7 / 8.5 at worst (wasteland); identified by form (§3.6) |
| Snow #F2EEE6 against every albedo's lit relief, every state | +A (first draft): 19.4 / 18.3, mountains under the haze, a fail; **+0.6 A: 20.6 / 19.4** (farmland) |
| Neutral hairline (between independent provinces), `keylineFor` at 70%, 1.5 px, every relief extreme and state | 2.39:1 (wasteland) to 5.21:1 (forest); at the first draft's 55%: 1.98:1 |
| Internal border keyline (`keylineFor`) on its ground, every relief extreme and state | 3.28:1 (wasteland) to 8.12:1 (forest) |
| Banner rims on the dark base #1E1B18 | 11 of 12 (all banners and pewter) directly; Umbra #3D2B4F by a 1 px #F4EEDF keyline |
| The base's worn lip #B8B1A4 with the base, on every relief extreme | 2.86:1 (swamp) to 7.44:1 (farmland) |
| Cliff top #3A3436 against the oak body #8F7459 | 2.79:1, ΔE 27.7 / 26.4; the foot #221E20 3.77:1 |
| The land's edge against the cliff top, with the worn lip (#E9E4D8 at 50%) | 3.25:1 at worst (shaded forest); without the lip, shaded hills against the first draft's #4A4246 top was 1.04:1 |
| Plinth #2B231C on the oak body | 3.54:1 |
| Plaque: ink #1C1A17 on brass #B8914A | 5.94:1 |
| Forest at its darkest (−A) | L\* 14.6, darker than granite (16.8) and near the mere (13.7); against them 20.9 / 13.2 and 23.8 / 14.4 |

Note on `report.ts`: its water line now defaults to an earlier candidate, #2F6B66, which fails (10.4 / 3.8 against
swamp); the design's water is #50AF9B (run with `WATER=#50AF9B`).

### 4.8 Data modes

Modes never draw an albedo (§9.2). Their colors are the approved frozen `MODE_BASE` and ramp, so R16 holds unchanged.
For information: the closest albedo to any mode color is 5.6 normal (Farmland against the ramp near #EAB879) and 0.8
under a deficiency, against the approved fills' 7.2 / 2.2 and B's 5.3 / 0.7. If the owner wants the approved floor
back, palette-ab's measured fix (stops 3 and 4 at #9196A3 and #E0AD85) applies.

### 4.9 Pixels: the preview against the references and v3

`mapwork/preview/preview.py` paints the first draft on real mapgen maps with numpy; `review/preview-fix.py` paints this
design (the height blend, the lit cap, the raised low-terrain amplitudes, the fog look, the cliff and lip). Both are
schematics to check numbers, not the game's art (no detail tiles, flat placeholder miniatures, no dotted fog lines).
Images: `mapwork/out-final/` and `review/out-fix/`; the before and after are side by side in `review/review-sheet.png`.

| Measured on map s3, Medium (land only unless marked) | First draft | **This design** | ref-2, map zoomed in | v3 Mid (cloth) |
|---|---|---|---|---|
| A province's core mean from its albedo (CIEDE2000) | 0.05 at worst | **0.07 at worst** (budget 0.5) | — | budget 2.0 |
| Own-terrain share, this map | 0.855 at worst | 0.855 | — | 1 |
| p95 lightness change per terrain (L\*): plains, farmland, forest, hills, mountains, swamp, wasteland | 2.1, 4.0, 6.0, 7.8, 16.1, 1.3, 3.8 | 2.4, 3.7, 5.5, 7.0, 10.1, 1.4, 4.5 | — | — |
| Relief at terrain borders against cores, p90 ratio (plains / farmland / forest), Near | 10 / 18 / 4.6 | **2.7 / 1.7 / 1.9** | — | — |
| L\* p5 / p50 / p95; sd (Mid) | 15.1 / 50.2 / 75.8; 18.5 | 15.5 / 50.2 / 75.1; 18.4 | 12 / 34 / 47; 11.2 | 16 / 47 / 83; 22.8 |
| OKLCH C mean / p90; pixels over 0.12 (Mid) | 0.066 / 0.098; 0.25% | the same | 0.063 / 0.096; 0.5% | 0.063 / 0.135; 11.2% |
| Fine busyness: 6 px cells with ΔL\* > 10 / > 20 (Mid) | 11.7% / 2.7% | 10.7% / 2.6% | 11.4% / 1.9% | 40.3% / 14.9% |
| The same with miniatures and labels | 15.4% / 4.3% | 14.4% / 4.1% | — | — |
| Fine busyness, Near | 13.3% / 1.8% | **9.5% / 1.2%** | — | v3 Near: 25.8% / 8.6% |
| **Patchwork:** adjacent quarter-province blocks over ΔE 10 / over 15 (Mid; Near) | 26.3% / 16.7%; 31.4% / 22.3% | 26.2% / 16.6%; 31.9% / 21.8% | **16.8% / 4.3%** | — |

The first draft read its fine busyness (11.7% against the references' 11.4%) as "as calm as the references". That
measure compares 6 px cells, so it sees texture but not province-sized patches. At the scale of a quarter of a province,
the patch edges stronger than ΔE 15 are four times as common as in the zoomed-in reference (16.7% against 4.3%); the
references' zoomed-out shots, whose crops include cliffs and the void, measure 13 to 14%. The fixes here calm the fine
texture (Near 13.3% → 9.5%) and remove the relief rims, but the patchwork is set by the rule: seven terrains 20 apart
(risk 1, §16).

---

## 5. Ownership on the land

### 5.1 Lines

All lines are vector meshes built from mapgen's polygons (straight edges; v3's wobble goes), constant in screen width
(at UI scale 100%), rebuilt on a zoom change (about 360 segments on Medium, research B4). Every line is at least 1.5
device pixels wide, so antialiasing never thins it below 75% coverage (§4.5). Widths in CSS pixels:

| Border between | Drawn | Device pixel ratio under 1.5 | 1.5 or more |
|---|---|---|---|
| two provinces of different owners, or an owned and an independent province | on each owned side an **inset rail**, set 1 px inside the border: the dark keyline on the border side, the banner, the light keyline toward the interior; the independent side draws nothing; two owners show two rails 2 px apart | 1.5 + 1.5 + 1.5 | 1 + 1.5 + 1 |
| two provinces of one owner | a **two-tone line**: the banner, with the `keylineFor` keyline of the ground on its lower-right side (it separates provinces; the realm edge carries ownership); at Far a neutral hairline instead | 1.5 + 1.5 | 1.5 + 1 |
| two independent provinces | a **neutral hairline**: `keylineFor` at 70% (#1C1A17 on light albedos, #F4EEDF on dark ones) | 1.5 | 1.5 |
| a province and a wild | the wild's 3 px ink contour and light rim (approved) | 3 | 3 |
| a province and the model's edge | the worn lip (§2.2) | 1.5 | 1.5 |
| any of these where docs/07 draws fog | the same line dotted 2 / 3 px (approved meaning, §9.1) | — | — |

- **High-contrast borders** (docs/07 "Display options"): keylines 2 px at every ratio, hairlines at 85%.
- Every rail is a **lit bead**: the banner between both `MAP_KEYLINES`, which reads as a raised line on the model under
  the one light. Carrying both keylines lets every banner pass on every ground (§4.5) without a per-terrain choice.
- The rail always shows the **current** owner, in every fog state: ownership is public (docs/01 §14).

### 5.2 The rim glow

- Along every realm edge (owners differ, or owned against independent), the owned side is tinted toward its banner
  (normal blend) by t(d) = 0.35 · (1 − d / W)^1.6 for a distance d from the border under W = 0.05 D, at every zoom.
- Not along internal borders, wilds or the model's edge, and never inside a wild. Off in every mode but Ownership.
- **Why 0.05 D, and no screen-pixel floor.** The glow must leave the terrain readable. With W = 0.05 D the untouched
  core is at least 72.7% of every province (median 82.9%) on 180 maps and 15,300 provinces (`calc/coverage.ts`). The
  first draft also set a 4 px floor, which binds whenever a province is under 80 px across, that is at all of Far:

  | W | When a 4 px floor equals it | Core minimum | 1st percentile | Median | Provinces under 70% (of 15,300) |
  |---|---|---|---|---|---|
  | 0.05 D | 80 px | 72.7% | 76.1% | 82.9% | 0 |
  | 0.057 D | 70 px (the top of Far) | 69.2% | 73.0% | 80.6% | 3 |
  | 0.08 D | 50 px | 58.2% | 63.3% | 73.2% | 4,425 |
  | 0.095 D | 42 px (Medium fully leaned back at 1280 × 720) | 50.9% | 57.3% | 68.5% | 9,287 |
  | 0.114 D | 35 px | 42.3% | 50.0% | 62.7% | 13,496 |

  At Far the glow is therefore 2 to 3.5 px, a soft edge on the rail; the rail carries ownership there.
- **Drawn live** in the composite shader from a province-id texture (nearest), a signed-distance texture (linear, so the
  glow and tint edges stay smooth at Near where a texel spans 2 to 3 px), an across-id channel, and a 256 × 1 owner
  palette, so a capture updates one texel and re-bakes nothing.

### 5.3 Hover and selection

| State | Look in Ownership mode | In data and contextual modes |
|---|---|---|
| Hovered province | the whole province tinted 0.25 toward its owner's banner (independents: 0.20 toward the ground's `keylineFor` keyline); a 1 px #F4EEDF line at 70% inside its border; its rails 0.5 px wider | the line only: a tint would change the mode's value color |
| Selected province | tinted 0.30 (independents 0.25 toward `keylineFor`), with a 1.5 px #F4EEDF line inside its rail | the line only |
| Hovered or selected miniature | its base lifts 2 px with a larger shadow; a #F4EEDF ring on the ground around the base (the selection ring, approved) | the same |
| A province named by a hovered link (feed, alerts, outliner, cards) | its hover look, and its name on the land while the link is hovered (§7) | the line and the name |
| A wild | its card only; never tinted (approved) | the same |

Terrain pairs are exempt from the rule on the hovered or selected province: one province at a time, and its card names
the terrain. The rails pass the rule on these grounds too: the strongest tint at a rail is the glow's 0.35 (§4.5).

### 5.4 In modes, fog and events

- **Ownership mode** is the default view described here. In every other mode the glow is off; rails, hairlines, wild
  contours and miniatures stay (the always-on layer, as approved).
- **Fog:** ownership is public, so rails and the glow show the current owner in every fog state; lines are dotted
  where docs/07 draws a dotted border (§9.1).
- **Settlement kits** still show the owner in architecture (approved), so ownership never relies on hue alone: rail
  pattern (inset or two-tone), the kit, the base's silhouette and the pennant.

---

## 6. Miniatures

### 6.1 Principles

- **Physical pieces under the one light.** Every piece stands on the model, casts a short shadow to the lower right
  (#000 at 25%, offset 0.15 × its base), and is drawn upright in the V2 oblique (pitch 40°), sorted by the ground y of
  its base (nearer pieces in front).
- **Round bases.** A base is a dark disc (#1E1B18 top) drawn as an ellipse 0.64 as tall as wide, whose side shows as a
  band 0.12 × its diameter below it, with a 1 px worn lip (#B8B1A4) on its upper-left quarter and a rim in the owner's
  banner.
- **No numbers on the land** (V10). The shape-family rule (H6) holds for every piece: armies, towns, walls, shrines,
  tents, cairns and pennants keep their reserved families.
- **Live sprites, never baked.** Every piece, hamlets included, is a sprite in the pieces layer, so a month's growth or
  a capture never touches the bake (V17).

### 6.2 The set

| Piece | Shown | Base | Content | Owner and state |
|---|---|---|---|---|
| **Army** (a commander with squads) | where the view shows it | B_a (§6.4) | the lead commander's figure, 1.15 B_a tall, idle, facing lower right; a short pennant pole at the base's rear | rim and silhouette by allegiance (§6.3); pennant in the banner |
| **Lone commander** (no squads: scout, mage, priest, prophet) | the same | 0.8 B_a | the commander's figure; the scout hooded, the prophet with the halo | rim; no pennant |
| **Pretender** | the same | 1.15 B_a, brass edge | its body's figure at 1.3× | the crown on the base plaque |
| **Stack** (several armies of one nation in one province) | the same | an oval 1.5 B_a wide | up to 3 figures; the count on hover | fans out on hover; click and Shift+click as approved |
| **Several nations in one province** | the same | one piece per nation | — | slots on an arc (§6.6) |
| **Moving army** | along its leg | — | slides with the transit arrow and the approved walk bob (0.4 s, 3 px) | visible enemies show their current leg only (approved) |
| **Hamlet and village** (population steps 1 to 3: 1 to 9 houses) | Mid and Near, where the view knows the population | none | small house sprites at the seat, the approved counts on the approved spiral; at Mid at 0.8 scale with walls and roofs held within 2.5:1 of the ground, so a hamlet reads as a cluster and not a spray of white dots; full kit colors at Near | roofs and walls in the kit; fresh roofs and decline ruins as approved |
| **Town** (step 4 or 5; or walls from PD 5, a fort, temple or lab; or a capital) | always, where the view knows it | world-scaled (§6.4) | the ring of walls by PD (palisade at 5, stone wall at 15, towers and gatehouse at 25; a watchtower from 1), houses inside on the approved spiral, the keep at the center with a fort, the temple and the lab as landmarks on the ring, scaffolding while building; at Far a simplified ring and keep | rim in the banner, pewter for independents; the pennant on the tallest roof (approved) |
| **Gesso hut** | an unexplored province's seat (§9.1) | none | one unpainted hut #D8D0C0 with a #E8DCC2 roof, 0.04 D | — |
| **Independents' guards** | Near only, an explored independent province's town or hamlet | inside the ring, or beside the hamlet | 1 to 4 pewter figures by the public strength word (weak 1, moderate 2, strong 3, fortress 4) | replaces v3's Near camps; the word is in the card |
| **Fort** | while built | — | a square stone keep at the ring's center in the owner's kit; a fort makes the seat a town piece at any population | the kit and the rim |
| **Temple** | while built | — | a landmark on the ring's edge in the kit (Cinder Horde: a fire temple with a brazier; Thornwood: a timber temple under a living roof); its brazier unlit under another nation's dominion (approved) | the kit |
| **Lab** | while built | — | a landmark on the ring's edge: a workshop tower with a chimney in the kit | the kit |
| **Wellspring** | always | 0.18 D, its own base | the monument: a basin with five drops in the five colors, a static glow while unclaimed | rim #E9E4D8 until claimed, then the claimer's banner; claim stones (approved) |
| **Mana springs** | Near | — | the spring stones the view knows (approved) | — |
| **Battle marker** | 30 days after a battle | — | crossed blades planted in the ground (docs/09's icon), no cairn: cairns are the scars' family | opens the report card (approved) |
| **Siege, pillage, unrest** | while true, as the view shows | — | tents and a ram around the ring, cracked or breached walls; smoke; shutters and barricades (approved events) | — |
| **Land looks, pole motifs, landmarks** | Mid and Near (landmarks also at Far) | — | scenery pieces on the land, never on a base. At Mid at most 3 land-look pieces by dominion band (1 for 1 to 3, 2 for 4 to 6, 3 for 7 to 10; the landmark replaces one from 7) and 1 pole motif (the strongest axis); at Near up to v3's Near counts, at most 10 pieces a province | the dominating nation's or pole's |
| **Battle scars** | 90 days, then cairns to day 360 | — | churned ground as a decal over the composite (not in the bake), cairns as pieces (approved) | — |

### 6.3 Allegiance by the base, never by hue alone

| Allegiance | Base | Pennant |
|---|---|---|
| Own | a smooth round base, its rim a solid ring in the banner, 2.4 px | yes |
| Other nations | the base's outline cut by 8 even notches, 30% of the circumference in all, each 0.12 × the diameter deep and at least 2 px (a crenellated silhouette, readable at 16 px); the rim follows the notched outline | yes |
| Independents | a plain base with a pewter #91A092 rim, no banner | no |

This carries docs/09's three shield shapes (rounded own, notched other, plain independent) onto the base as a
silhouette, which reads on any ground; gaps in a colored rim alone would vanish on dark land. Every banner reads on the
dark base, Umbra's through a 1 px light keyline outside the rim (§4.7); the portraits' frames keep their shapes
(approved).

### 6.4 Sizes by zoom

Sizes are continuous functions of the median province's screen diameter D_px:

- Army base B_a = clamp(0.23 D_px, 16, 34) px.
- Town = clamp((0.16 + 0.045 × (step − 1)) × D_px, 14, 120) px; a capital counts one step up.

| | Fully leaned back (42 px) | Far (60 px) | Start, 1280 × 720 (95 px) | Mid top (180 px) | Near (420 px) |
|---|---|---|---|---|---|
| Army base B_a | 16 px (0.38 D) | 16 px | 22 px (0.23 D) | 34 px (0.19 D) | 34 px (0.08 D) |
| Town, step 4 | 14 px (minimum) | 18 px | 28 px | 53 px | 120 px (maximum) |
| Capital at step 5 | 16 px | 23 px | 37 px | 69 px | 120 px |

Armies keep a near-constant screen size, as the references' do; towns belong to the land and scale with it, inside a
floor and a ceiling. At Far a province shows one army piece per nation (the approved Far rule) and no hamlets.

### 6.5 Status by exception

One plaque on the front of the base (12 px; 10 px when the base is under 20 px), with one glyph from the approved list
(starving, tight supply, unpaid, besieging, casting, pillaging), only while true. A fed army that is moving or guarding
shows none (approved). The pretender's crown and the prophet's halo sit on the same plaque when no status claims it.

### 6.6 Zones and slots

Zones are fixed per province (v3's H10), so armies never re-bake the land. The seat zone is at the province's `center`
(the town, hamlet or hut) and the label zone under the seat piece. Army slots are placed in screen pixels from the
pieces' actual sizes:

- Slot k lies on an arc around the seat at distance r_seat + r_army + 3 px (r = half the base's width; r_seat for a
  hamlet is 0.08 D_px), the first at 20° below the right-hand horizontal, the next ones 40° apart alternating up and down.
- A slot whose base would leave the province's polygon inset by 2 px moves along the arc to the first position inside;
  if there is none (small provinces at Far and Mid), the army stands in front of the seat piece, 0.5 r_seat lower, drawn
  after it, and the seat's label moves below the army's base. A piece never covers a label.
- Why: the first draft's fixed token zone at `center` + (0.17 D, −0.06 D) lies 0.18 D from the seat, inside the town
  piece at every zoom (start: 17 px against the 25 px the two radii need; a capital needs 29.5; Near: 75.6 against 77).
- `layoutMapLabels` and `provinceAnchors` know every box; the test checks the slots at every band (§13).

### 6.7 Where the figures come from

- **M1:** the battle's procedural figure atlas (the research's A5: vector parts baked per nation, every unit and custom
  pretender look from data), drawn at 2× in 64 px cells for the map, in the same 40° oblique; bases, rims, pennants and
  plaques are vector. Town pieces come from the approved kit parts, drawn as pieces.
- **M1-should:** owner-made painted figures for commanders and pretenders, and town kit pieces (§11). The research found
  painted cutouts read far better than procedural ones where counts are small and the eye lingers; a set replaces the
  procedural art only when complete, and the procedural art stays the fallback (docs/09 delivery rule).

---

## 7. Text and markers by zoom

| Band | Names on the land | About how many (Medium) |
|---|---|---|
| Far | capitals, Wellsprings, wild names | 10 to 14 |
| Mid | Far's, plus the hovered province, the selected one, the path's target and waypoints, targeting labels (valid ritual targets with their predicted effect, approved), and any province named by a link the player hovers in a panel | 10 to 14 plus what the player points at |
| Near | every province name, at the foot of its seat; wild names curved along their massifs | all in view |
| Any band, Shift held alone with nothing selected and no tooltip open (docs/07's condition) | every name, and the numbers layer, while held | all |

- **Style:** the approved light-on-dark labels (Alegreya Sans, #F4EEDF with a dark halo; v3's ink-on-paper option goes
  with the paper); wild names italic and letter-spaced in #E9E4D8 (approved); 11 px floor at Mid ramping to 15 px at
  Near.
- **Setting:** Interface → Map labels: Clean (the default above) or All names (every name at Mid, v3's budget). Owner
  question 7.
- **The numbers layer** (`` ` ``, the # button, or Shift held as above): one chip per province with the active mode's
  value (PD in Ownership mode), and one count plate under each army piece (troops; the strength word where the view is
  fogged).
- **Shift keeps docs/07's meanings.** Over an open tooltip, Shift alone still means "more" for that tooltip and shows
  nothing on the map; Shift+click, Shift-drag and Shift+right-click never show names.
- **Links name the land.** Hovering an entity link to a province in the feed, the alerts ribbon, the outliner or a card
  shows that province's hover look and its name on the land while hovered. With few names at the start zoom, this is how
  a name read in a panel is found on the map, one gesture away.
- **The hover card (L1)** keeps docs/07's order (the active mode's value, name, owner, terrain, population, supply,
  materials, unrest, springs, dominion, buildings, defenders). The region's name sits dim on the name line
  ("Morholt · the Ashen Vale"); the footer stays the next-gesture hint (docs/07 principle 1). An army's card leads with
  its commander's portrait at 48 px (approved), its squads and its count.
- **Decisions on the surface:** the cursor label and the engagement preview keep every number a decision needs (ETA,
  arrival, supply there, both sides' strength with "Estimate"), unchanged.
- **Gone from the land:** line-2 chips (dominion candle chip, unrest fist, siege ram), PD plates, count plates and the
  stack count. Dominion lives in its mode and the numbers layer; problems live in the alerts ribbon and in the event
  pieces (siege tents, smoke, barricades), which already show on the land.
- **The label test** changes: no overlap among labels, piece boxes and seat zones at every band; the budgets above at
  the start zoom; at Near at least 90% of provinces in view keep a visible name (was: at the start zoom).

---

## 8. Every v3 element: stays, shrinks, moves to a zoom band, or goes

| v3 element | v4 | Where it goes, and why |
|---|---|---|
| Watercolor wash, lift, edge pool, mottle, granulation, blooms | goes | albedo, relief and lightness-only ground detail paint the land |
| Paper tooth, fibers, pigment flecks | goes | the paper is superseded |
| Wobbling hand-ruled ink borders | goes | straight vector rails and hairlines (§5.1) |
| Ownership bands | goes | inset lit-bead rails and the rim glow (§5); the band rule is restated for thin lines (§4.5) |
| Standing stamps: trees, humps, ridge peaks, reeds, rocks, with ink outlines | goes as stamps | trees become canopy texture, humps and peaks become relief, reeds and rocks become ground detail; live crowns at Near |
| Far relief masses | goes | relief is continuous at every zoom |
| Tracks between every neighbor pair | goes | they carried no rule and added a dotted line on every border at every zoom; the path preview shows routes |
| The dashed footpath on passable Mountains | goes | "snow only on wilds" (V8) separates passable from impassable |
| Place names at Mid | shrinks | Far and Mid show capitals, Wellsprings, wilds and what the player points at or hovers in a panel; every name at Near, with Shift, or with All names (§7) |
| Mid line 2: dominion chip and problem glyphs | moves | the Dominion mode and the numbers layer; problems to the alerts ribbon and the event pieces |
| PD plates, numbers chips | moves | the numbers layer (`` ` `` or Shift) |
| Army shield badges, count plates, ×n | goes | miniatures (§6); counts on hover, selection, the numbers layer and the engagement preview; stacks fan out on hover |
| The corner status glyph | shrinks | one plaque on the base, by exception (§6.5) |
| Standees at Near | becomes the piece | the figure stands on its base at every zoom |
| Region names | moves | the hover card's name line, and at Far while Shift is held |
| Hero set pieces and decorative ruins | goes | history scenery that says nothing (v3's H7) and adds busyness; a settlement's decline ruins stay (approved) |
| Mines and windmills | moves to Near | terrain-coded, redundant scenery |
| Brooks and ponds | stays, restyled | vector water inside one province (§3.6) |
| Bridges | goes | they marked tracks crossing brooks |
| Independent camps | goes | guards in the town at Near by the same strength word (§6.2) |
| Mana spring stones | stays | Near only, as approved |
| The Wellspring illustration | stays | a monument on its own base |
| Capitals at Far | stays | the town piece, simplified at Far |
| Vignettes (sheep, deer, heron, goats, cows, hare) | goes | clutter on a model; a "Life" option later |
| Settlements and growth | stays | hamlet sprites, town pieces from step 4 (§6.2) |
| Land-look washes | stays | ash 10% and moss 6% are measured states (§4.2), drawn live in the composite with the 600 ms cross-fade |
| Nation motifs, pole motifs, landmarks from strength 7 | stays, capped | pieces on the land: at Mid at most 3 land-look pieces and 1 pole motif a province; v3's slot shares have no slots to share in v4 (§6.2) |
| Event marks (siege, pillage, unrest, scars, rituals) | stays | pieces and decals |
| Wilds | stays | sculpted (§3.8) |
| Cloth margin: cartouche, compass rose, neatlines, wash overrun, tacks, hem | moves or goes | the plaque and the compass prop; the rest goes (§2.4) |
| Fog: line-art stamps, sketched hut | restyled | the whole model under the 4% haze, a gesso hut (§9) |
| The path thread with square brass tacks | stays | approved |
| Transit arrows, battle markers, selection rings | stays | as pieces and ground rings |
| Lettering: ink on paper, region names in spaced capitals | goes | the approved light-on-dark labels; curved wild names stay at Near |
| "Try your art" in the mockup | stays | for the new owner sheets (§11) |

---

## 9. Fog and map modes

### 9.1 Fog: the rules stay, the look changes

Terrain and ownership are public (docs/01 §14); population and springs are known once a province has been owned or
scouted (explored); armies show where the nation sees. On day 0 a nation has explored 10% to 22% of a Medium map
(median 15%, 20 seeds, `review/explored-at-start.out`): the first view of every game is mostly unexplored land, so the
unexplored look is the look the owner sees first.

| State | What it shows (docs/07, docs/01, unchanged) | How it looks (v4) |
|---|---|---|
| Unexplored (whether or not in sight) | the terrain; a dotted border; one hut at the seat (population unknown); no land look | **the whole model**: albedo, relief, canopy, lone trees and water exactly as on explored land (all public map data: the bake reveals nothing the view hides), under the approved 4% gesso haze (#E8DCC2); one gesso hut at the seat and no other settlement, wall, motif, landmark, spring stone or guard; the current owner's rail and glow; lines dotted; armies only where the nation sees |
| Explored, out of sight | painted but faded; the settlement as the view allows; armies only where the nation sees | the bake desaturated 10% toward equal-lightness grey (approved), the land-look wash hidden, the settlement in its current state (population is known once explored; the sim keeps no last-seen copy), lines dotted |
| Explored, in sight | everything | as described in §1 to §8 |
| Wilds | never fogged | unchanged |

- **One state at a time.** Unexplored takes the haze and never the desaturation, so no province is in two approved states
  at once and the palette test's states stay the five measured ones.
- **The hem:** along a border between explored and unexplored land, the unexplored side's haze rises to 12% at the
  border and falls to the 4% interior over 0.05 D, so the frontier shows. Like the glow, it lies inside the band that
  leaves at least 72.7% of every province untouched.
- **What reads:** at Mid the frontier is where towns and hamlets give way to single gesso huts (`review/review-sheet.png`,
  lower half), plus the dotted lines and the hem. The first draft's "dust sheet" (half relief, no detail, no water)
  would have made 85% of the first screen a flat patchwork with the relief the owner asked for missing; its preview also
  left the towns standing in the unexplored provinces, so it never showed the rule's look.
- Every look is computed from the same `provinceView(state, viewer, id)` the card uses (approved fog guard). The haze and
  desaturation are live in the composite shader from a 256 × 1 visibility palette, so a visibility change re-bakes
  nothing (v3's H10, option a).

### 9.2 Map modes: the mechanism stays

- In every mode but Ownership, the ground detail, the canopy, water and scenery pieces fade out (R23); each province
  shows `MODE_BASE[terrain]` (the approved bases, frozen as constants: the approved fills desaturated 80% and lifted to
  L\* 50 or lighter) shaded by a gentle fixed relief of ±3 L\* (p95) on every terrain, mean-neutral, and the mode tints
  it. The relief therefore stays readable as a grey model under the data without competing with the data ramp, whose
  adjacent stops are 13.2 apart (the first draft's half amplitude, ±8 on mountains, could carry a pixel most of the way
  to the next stop).
- The glow is off; hover and selection draw their lines without a tint (§5.3); rails, hairlines, wild contours,
  miniatures, labels and each mode's second channel (wheat glyphs, hatch density, candle numbers, spring symbols) keep
  full contrast.
- Because the bases and the data ramp are frozen, R16 (every M1 mode color 20 / 12 from both wild grounds) holds
  unchanged. The new albedos never share the screen with a mode color; §4.8 gives their distance anyway.
- Contextual modes (move targeting hatches unreachable provinces; ritual targeting outlines, dims and labels) are drawn
  by the composite shader and the label layer, unchanged in meaning. The 45° hatch stays reserved for them.
- The model's cliff, plinth and the table are never tinted by a mode.

---

## 10. Performance and the bake

### 10.1 The pipeline (once per map, behind "Preparing the map")

| Step | Where | What | Measured or estimated (research) |
|---|---|---|---|
| 1 | CPU worker | province-id raster from mapgen's polygons at 2048 × 1280; wild cells; the land mask | 390 ms under load |
| 2 | CPU worker | the warped terrain lookup; albedo weights (1.1-unit blend) and height weights (σ 0.12 D) at half resolution; pure-core mask; signed distance to the own border and across id | about 520 ms (warp and blurs) plus 255 ms (distance) |
| 3 | CPU worker | the quarter-resolution heightfield (512 × 320, the same formula in doubles, table noise only) for stream tracing and the invariant tests; lakes, ponds and stream polylines; tree positions per 128-unit chunk | 220 ms for water at 2048, plus an estimated 60 ms for the heightfield |
| 4 | GPU passes, tiled | heightfield at full resolution from the same seeded value table, uploaded as a texture; height packed into 16 bits of RGBA8 (no float render targets) | 1 to 3 ms on a laptop iGPU, 5 to 15 ms on a phone (estimate); 381 ms in SwiftShader |
| 5 | GPU passes, tiled | hillshade (with the lit cap), cast shadows, valleys; the per-province residual means come back as a 512 × 320 read-back and return as a 256 × 1 offset palette, spread across the ecotone (§2.3) | 101 ms in SwiftShader; the read-back about 1 ms |
| 6 | GPU passes, tiled | composite: blended albedos + ΔL + detail + wilds + canopy → the 2048 × 1280 bake, with mips | a few ms on a GPU (estimate) |
| 7 | — | cache the CPU rasters of steps 1 to 3 in IndexedDB, keyed `relief:${BAKE_VERSION}:${ALBEDO_VERSION}:${mapHash}` where `mapHash` is `cyrb53` of the MapData JSON; keep the 3 most recent maps; the GPU passes re-run on every load | typed-array upload 47 ms at 2048 (a canvas upload was 2,308 ms) |

- **Tiled passes:** steps 4 to 6 run in 1024 × 1024 tiles with a 64-texel apron (covering the gradient and the 0.25 D
  shadow march), so the transient render targets stay near 16 MB on a phone instead of three full-size targets.
- **Why the cache holds the CPU rasters and not the bake:** the bake differs slightly between GPUs, and caching it
  stored 42 to 56 MB per map; the rasters are device-independent and the GPU passes take milliseconds. Keying by a hash
  of the map (not seed, size and nation count) catches every input that changes the map, the wilds switch included.
- **Order:** streams are traced on step 3's CPU heightfield, because step 4's GPU heightfield does not exist yet when
  water is placed (the first draft traced them in step 3 on step 4's field).
- **The CPU fallback** runs steps 4 to 6 in the worker at 1024 × 640 (1.3 s at 1024 and 3.3 s at 2048 measured under
  load), only where WebGL2 is missing or a GPU pass fails.
- **Re-bakes:** none during a game (V17): ownership, fog, hover, selection, modes and land-look washes are live in the
  composite; hamlets and pieces are sprites; battle scars are decals.

### 10.2 Every frame

| Item | Budget |
|---|---|
| Composite: the bake; the id texture (RG8, nearest) and the signed-distance texture (R8, linear); the owner, visibility, land-look (with its 600 ms fade) and mode palettes; hover and selection uniforms | 1 draw; 0.2 ms CPU (measured); about 5 Mtexel at 1600 × 1000: under 0.5 ms on a laptop iGPU, 1 to 2 ms on a phone (estimate) |
| Rails, hairlines and water | 2 to 3 draws, rebuilt on a zoom change |
| Miniatures and hamlets | one atlas (2048 × 1024), a few hundred sprites sorted by y, 1 to 2 draws |
| Battle-scar decals | 1 draw |
| Near crowns | one `ParticleContainer` per visible 128-unit chunk, at most 20,000 crowns on screen, Near only |
| Labels and number chips | `BitmapText`, 1 to 2 draws |
| Ownership change | one texel of the 256 × 1 owner palette |
| Total for the map | at most 12 draws, crowns' chunks aside (v3's budget was 15) |
| Frame | docs/06's 60 fps at 1080p with all provinces and 100 army markers, with Table Full; the Playwright performance smoke on `src/render/**` (approved) |

### 10.3 Resolution and memory

One 2048 × 1280 bake on every device: 1.7 to 3.1 texels per unit by map size, 1.5 to 2.8 screen pixels per texel at
Near, where the vector water and rails, the detail tiles and the live crowns carry the fine grain.

| GPU memory, Large 4-nation map at device pixel ratio 2 (docs/06's budget case) | First draft (4096 bake) | **This design** |
|---|---|---|
| The bake, RGBA8 with mips | 55.9 MB | 14.0 MB |
| Id and distance textures | 10.5 MB (RGBA8) | 7.9 MB (RG8 + R8) |
| Detail tiles, four 512², with mips | 5.6 MB | 5.6 MB |
| Miniature atlas, 2048 × 1024, with mips | 11.2 MB (quoted as 8 without mips) | 11.2 MB |
| Table layers (the war table's) | at most 16 MB | at most 16 MB |
| Label font atlas | not counted | about 4 MB |
| **Total** | **about 103 MB: over docs/06's 96 MB** (the draft summed 91) | **about 59 MB** |
| Transient during the bake | three full-size targets | about 16 MB (tiles) |

### 10.4 Settings and phones

- Interface → Map detail: Full (default) or Reduced (no live crowns, no cast shadows, detail tiles off). Reduced never
  removes information: rails, glow, miniatures, settlements, walls, land looks, event pieces and wilds stay, as
  approved. Context loss rebuilds every layer from the cached rasters or the seed (approved).
- Phones (touch is M3; docs/00): the same GPU path at 2048 on WebGL2, whose fragment shaders guarantee highp, with noise
  read from the seeded value texture rather than computed with integer hashes; Map detail starts at Reduced on a coarse
  pointer or where `MAX_TEXTURE_SIZE` is under 8192. The first load of a map pays the CPU steps (about 1.4 s on a
  laptop under load, an estimated 3 to 5 s on a phone); later loads read the cache.

---

## 11. Owner-made art

### 11.1 What can be an image

| Sheet | Used for | Procedural fallback | How it is recolored |
|---|---|---|---|
| G1 to G6, ground detail tiles: grass, tilled fields, forest canopy from above, rock and scree, cracked earth, marsh reeds and pools | the Near detail texture, lightness only | seeded noise detail (§3.4) | converted to luminance and mean-normalized; only a lightness change reaches the map, so the albedos and every rule hold |
| C1, cliff strata | the model's cliff face and wild crags | procedural strata | luminance into the face's tones |
| F1, commander and pretender figures (one per commander type and pretender body) | army pieces | the procedural figure atlas | none: the owner shows on the base rim and the pennant, so a figure needs no nation colors |
| K1 to K3, town kits (Cinder Horde, Thornwood, independents): houses, palisade, stone wall, towers and gatehouse, keep, temple, lab, ruin, scaffolding | town pieces and hamlet sprites | the approved procedural kit parts | none; each kit is measured against the base and the land (kit tones keep 3:1 on the dark base; hamlets at Mid within 2.5:1 of the ground) |
| W1, the Wellspring monument | the Wellspring piece | procedural | the five drops are recolored to the five mana primaries |
| P1, the brass plaque and the brass compass | the table | procedural | none |

### 11.2 Rules for these images

- A kind is used only as a complete set; the procedural art is always the fallback (docs/09 delivery rule).
- Every image goes through `scripts/art-intake.ts` (new kinds `map/tile`, `map/figure`, `map/kit`), with a provenance
  sidecar; masters stay in `art-source/`.
- Tiles must tile seamlessly and carry no light direction; figures, kit pieces and the Wellspring are lit from the upper
  left, seen from 40° above the ground (the battle's pitch, V2), facing the lower right, with no base (the base is
  drawn by the game), on a flat key color, and keyed with a 1 px alpha erosion (research A5).
- **Budget:** images in `src/assets/raster` total 1.99 MB (1,987,716 bytes: the portraits' 272 WebP files 1.68 MB, the
  oak top and the floor 0.31 MB; the 136 JSON sidecars add 0.37 MB but are not images). The 2 MB raster budget has 12 KB
  left. Map art adds about 0.5 MB (four 512² WebP tiles at about 60 KB, figures at 64 px cells), so no map raster can
  land before the owner decides (owner question 9).
- The research's one test showed the image model ignored the asked camera angle on a sprite sheet. The figure prompts
  below therefore ask for one piece per image, and every piece prompt passes a camera reference image (a gray-box
  cylinder on a disc at 40°, made procedurally) as the first reference; this is untested.

### 11.3 Prompts

Every prompt is used with `tools/art/gemini_gen.py` (`MODEL OUT.png PROMPT_FILE [REFERENCE ...]`) or pasted into
ChatGPT. None names a game or a franchise.

**Style sentence (prepended to every prompt):** "A hand-painted tabletop terrain model and its painted miniatures, as
built by a careful hobbyist: matte acrylic paint, gentle dry-brushed highlights, soft natural daylight from the upper
left, muted earthy colors, no text, no logos, no frames, no people unless asked."

**G1 to G6, ground detail tile (one per terrain):**
> Seamless square texture, seen straight down, 1024 by 1024 pixels, tiling on all four edges. [Short grass with low
> clumps and a few bare patches | Small tilled field parcels with furrows running in different directions, no fences |
> Dense forest canopy of rounded tree crowns packed together, seen from directly above | Broken rock, scree and thin
> turf | Dry cracked earth with fine grit and small dune ripples | Marsh with reeds, sedge tufts and small dark pools].
> Even lighting with no cast shadows and no light direction. Gray-green neutral tones only, medium contrast, no strong
> color. No objects, no paths, no buildings, no water edges crossing the border of the tile.

**C1, cliff strata:**
> A vertical rock cliff face seen straight on, as the side of a terrain model: layered sedimentary strata in dark slate
> and umber, horizontal bands, a few cracks and ledges, darker toward the bottom. Seamless left to right, 1024 by 256
> pixels. Neutral daylight. No vegetation, no sky, no ground.

**F1, a commander figure (one per commander type, with the type's kit):**
> One painted tabletop miniature of a [Cinder Horde ash chieftain: a broad warrior in dark scale armor with a jagged
> axe, ash-grey skin, a soot-dark cloak], standing with its feet on an invisible ground line, with no base under it.
> Seen from 40 degrees above the ground, three-quarter view, facing the lower right of the image, full figure, centered,
> feet at the bottom center, about 80% of the image height. Idle stance, weapon lowered. Lit from the upper left. Flat
> solid magenta background (#FF00FF), no shadow on the background. Match the camera of the reference image.

**K1 to K3, a town kit sheet (one per nation):**
> A set of separate painted miniature buildings for a fortified village, each standing alone with space around it on a
> flat solid magenta background: [for the Cinder Horde: three small houses with soot-black roofs and ash-grey walls
> with ember-orange windows, a wooden palisade segment, a dark stone wall segment, a squat stone tower, a gatehouse, a
> square keep, a fire temple with a brazier, a sorcerer's workshop with a chimney]. Every piece seen from 40 degrees
> above the ground, lit from the upper left, no bases, no people, no text.

**W1, the Wellspring:**
> One painted tabletop miniature of an ancient stone spring basin: a low circular basin of pale worn stone with five
> carved spouts around its rim, still water inside glowing faintly, moss in the joints, with no base under it. Seen from
> 40 degrees above, centered, lit from the upper left, flat solid magenta background.

**P1, plaque and compass:**
> A small rectangular brass plaque with beveled edges and four tiny square rivets, blank, seen straight on, aged brass
> with soft wear; and separately, a brass navigator's compass lying flat, seen straight down. Flat solid magenta
> background, lit from the upper left, no text.

---

## 12. What changes in the docs

Drafts for the docs' owners. Nothing here is applied; the repo is untouched.

### 12.1 `docs/09-art-direction.md`

| Section | Change |
|---|---|
| Intro | keep "Flat 2D art with animation"; add: "The map is a baked relief texture of a terrain model, generated from the map and its seed; its miniatures are 2D sprites." |
| Color palettes, terrain paragraph | replace the fills, the noise multiply and the cloth sentence with the text below |
| Distinct colors | "terrain fills" becomes "terrain albedos"; add the relief floor, the snow rule and water (below) |
| Nation banners | unchanged |
| Ownership bands | becomes **Ownership rails** (below) |
| Map states | adds the rim glow, the hover and selection tints, and renames the unexplored haze "gesso" (same #E8DCC2, same 4%); unexplored and out of sight never combine |
| Icons, Map row | "army badge shapes: rounded shield (own), notched shield (other nations), plain shield (independents)" becomes "army bases: smooth (own), notched silhouette (other nations), plain pewter rim (independents)"; the status glyphs move to the base plaque |
| UI chrome | unchanged |
| The war table | the cloth becomes the model (below); props gain the brass compass; "Light falls on the room and the oak only" adds "and on the model only the map's one daylight" |
| The painted map | becomes **The relief map** (below) |
| Impassable terrain | "Wilds are the darkest grounds on the map" becomes "Wilds read at every zoom by their contour, rim and form: peaks are the highest ground and the only snow; meres are still dark water sunk below their banks"; adds: crags and banks are drawn inside the wild; colors, contour, rim and names unchanged |
| Growth and alignment on the map | "Settlements grow..." adds: "hamlets and villages are small sprites on the land; from population step 4, walls from PD 5, a fort, temple or lab, or a capital, the seat is a town piece on a round base"; land looks keep their wash caps and become pieces at Mid (at most 3 and 1 pole motif a province) and Near |
| Animation | unchanged (no idle on the map; the walk bob stays) |
| Delivery rule | adds the map kinds (`map/tile`, `map/figure`, `map/kit`) and the raster budget decision (owner question 9) |

**Terrain paragraph (replacement):**

> Terrain albedos: Plains #78894A, Farmland #D5B16B, Forest #1A3819, Hills #6D5303, Mountains #859BB8, Swamp #38616D,
> Wasteland #877773. The map is a carved terrain model on an oak war table (see "The war table"), lit by one neutral
> daylight from the upper left (azimuth 315°, elevation 40°). Its shading is mean-neutral over each province, so a
> province averages to within CIEDE2000 0.5 of its albedo and the colors tested below are the colors a province shows.
> Relief and ground detail change lightness only: a lit face gains at most 0.6 of the terrain's swing and a shaded face
> loses at most the swing (Plains 4, Farmland 4, Forest 6, Hills 9, Mountains 16, Swamp 3, Wasteland 6 L\*). Water
> inside a province is #50AF9B. No grade, vignette, season tint or time of day falls on the model.

**Distinct colors (added sentences):**

> Relief moves single pixels: at 0.4 of its range every pair of different terrains in every map state keeps 17 / 10. No
> albedo's lit relief, in any map state, comes within 20 / 12 of snow #F2EEE6, which only peaks wear. Water is 20 / 12
> from every albedo and both wild grounds as drawn raw; across map states it keeps 19.7 / 8.5 and is told apart by its
> smooth shore and bank highlight.

**Ownership rails (replacement for "Ownership bands"):**

> A rail is a lit bead: the banner between a light keyline #F4EEDF on the side facing the light and a dark keyline
> #1C1A17 on the other, each line at least 1.5 device pixels wide (1.5 + 1.5 + 1.5 CSS px below device pixel ratio
> 1.5, 1 + 1.5 + 1 from it). Where owners differ, each owned side has one, 1 px inside the border; inside a realm a
> two-tone line (the banner and the ground's `keylineFor` keyline) separates provinces. A rail reads on its ground if
> the banner differs from the ground, or either keyline differs from both, at the minimums above, on every relief
> extreme, under the owner's glow, half-blended with any neighbor terrain and in every map state, with each line at the
> coverage antialiasing leaves it; `tests/content/palette.test.ts` checks all banners. A soft glow of the banner runs
> inside realm edges, at most 35% at the border, gone at 0.05 of the median province diameter. The hovered province
> takes 25% of its owner's banner and the selected one 30%, each with a light inner line. No tint covers whole provinces
> otherwise: 4% already breaks the distinct-colors rule between owners.

**The war table (changed sentences):**

> The scene, seen straight from above in one projection: the map is a carved and painted terrain model on an oiled,
> quarter-sawn white oak table in a village tavern. The camera never tilts; depth is painted in one oblique (40° above
> the ground, the battle's): one light shades the relief, pieces stand upright, and the model's south faces show as
> rock cliffs above a 3-unit plinth of dark oak, casting a soft shadow to the lower right. The map's name is on a brass
> plaque on the south face; a brass compass lies in the table's upper-right margin.

**The relief map (replacement for "The painted map"):**

> - **Layers.** A bake per map (albedos through a seeded lookup warp of at most 0.10 D, relief with its own wider blend,
>   ground detail, wilds, canopy), a live composite pass (glow, hover and selection, fog, land-look washes, modes),
>   vector rails and water, miniatures, decals, labels. Nothing that changes during a game is written into the bake.
> - **One terrain per province:** at least 80% of every province is painted in its own terrain. No province's relief
>   draws its outline: hills and ranges throw foothills across borders.
> - **Level of detail:** Far, Mid and Near show the land, rails and pieces at every zoom; Near adds live tree crowns,
>   detail tiles, spring stones, guards, mines and windmills. Information is one gesture away: the hover card, the
>   numbers layer, Shift, a hovered link.
> - **Modes:** in every mode but Ownership the ground detail and scenery fade and the mode tints the frozen mode base,
>   shaded by a gentle fixed relief.
> - **Fog:** terrain and ownership are public, so unexplored land shows the whole model under a 4% gesso haze, with one
>   gesso hut at the seat and no other settlement, motif or spring, and dotted lines. Land out of sight is the bake
>   desaturated 10%.
> - **Miniatures:** armies are painted figures on round dark bases whose silhouette shows allegiance; towns are walled
>   rings on bases; nothing numeric stands on the land.

### 12.2 `docs/07-ui.md`

| Section | Change |
|---|---|
| Principles 1 | L0 lists "map labels, miniatures" instead of "map labels, badges" |
| Game screen layout | owner question 6: the right dock starts collapsed to its 48 px rail at every width (docs/07 already defines the rail); sizes otherwise unchanged |
| Map → Drawing | replaced by §2, §3 and §5 of this design in brief: the model on the table, the bake, rails and glow, pieces; the draw order becomes room, table, props, the model's shadow and cliff, the bake, the composite, vector water, rails and wild contours, decals, path preview, pieces (y-sorted), labels and chips, ambience over the room and oak only |
| Modes | "the decoration layer" becomes "ground detail, canopy, water and scenery pieces"; hover and selection draw lines only in data modes; the rest unchanged |
| Labels and the density budget | replaced by §7 (budgets per band, Shift with nothing selected, link hover, the numbers layer, the Map labels setting); "Information never thins" becomes "information is one gesture away" |
| Army badges | becomes **Army miniatures**: §6.2, §6.3, §6.5 and §6.6; stacks fan out on hover as before |
| Moving | unchanged (the path thread and tacks, the cursor label) |
| Province tooltip | adds the region's name, dim, on the name line |
| Fog | the look of §9.1; the rules unchanged |
| The table and the camera | "the cloth" becomes "the model"; the fit includes its south cliff and plaque |
| Keyboard | Shift held alone with nothing selected also shows every name while held |
| Accessibility, Display options | high-contrast borders: rail keylines 2 px, hairlines 85% |
| Settings | Interface → Map labels: Clean (default) or All names; Map detail Reduced as §10.4 |

### 12.3 Other docs and content

- **`src/content/terrain.ts`:** the seven `fill` values become the albedos (the field keeps its name; docs call it the
  albedo). `MODE_BASE` becomes stored constants (today derived from the fills), so data modes keep the approved bases.
- **`docs/09-balance.md` "Map presentation":** new rows dated at adoption for the albedos, water, the warp (0.10 D), the
  height blend (σ 0.12 D), relief bases and amplitudes (§3.2), swing caps and the lit cap 0.6 (§3.3), the mean budget
  0.5, the glow (0.35, 0.05 D, no floor), hover 0.25 and selection 0.30, rail widths in device pixels, hairline 70%,
  the cliff (24 units, shown 18) and plinth (3), the lip, the piece sizes (§6.4), the slot rule, the town threshold
  (step 4, PD 5), the Mid motif caps, the label budgets, the mode relief (±3 L\*), the crowns' chunk (128 units) and
  the bake resolution. The rows for stamp caps, the footpath and the land-motif slot shares are marked superseded.
- **`docs/10-milestone-1.md`:** Phase 8 and Phase 11 bullets per §14; acceptance criterion 14's icon list keeps its
  glyphs (the plaque uses them); criterion 17's "painted cloth" becomes "terrain model".
- **`docs/06-architecture.md`:** `render/map/` gains `reliefBake` (worker, tiled GPU passes, raster cache), `composite`
  (one shader), `lines` (rails, hairlines, water meshes), `pieces` (atlas, y-sort, slots), `decals`; the CPU reference
  lives in `src/present/map/` (`relief.ts`, `lookup.ts`, `water.ts` beside the planned `anchors.ts` and
  `settlement.ts`), pure and Node-tested, never in `src/sim` or `src/mapgen`. `src/present/rand.ts` (`hash32`,
  `streamFor`) is specified by docs/12 S2 and not yet built: whichever of Phase 8 and S2 lands first creates it.
- **`docs/design/visual-references.owner-direction.md`:** a pointer to this design once adopted.

---

## 13. Tests

| Test | Checks |
|---|---|
| `tests/content/palette.test.ts` (extended) | the albedos at 20 / 12 (the existing test, new values); every pair in any two approved states; both wild grounds against every albedo state and relief extreme; the relief floor at 0.4 of the range at 17 / 10; snow against every albedo's lit relief (+0.6 A) in every state; lit-bead rails for **all 11 banners** on the 210 grounds per terrain at three coverages (solid; keylines 0.75 with the banner solid; both 0.75): solid and both-0.75 with no fail, keylines-0.75 with at most the 2 measured cases, each within 0.15 of the threshold, and every case at 2.6:1 or more; the internal two-tone keyline and the neutral hairline at their stated floors (3.2:1 and 2.3:1); water against every albedo and both grounds raw; banner rims on the base; the independents' hover moves every terrain by ΔE 7 or more; the glow, hover and selection constants are the ones measured |
| `tests/present/map/terrainCover.test.ts` | the CPU lookup on Small, Medium and Large, 2 and 4 nations, seeds 1 to 5: every province at least 80% its own terrain; the glow core (beyond 0.05 D of every shared edge) at least 70% of every province; no lake, pond or stream pixel within 0.10 D of a border; no stream crosses a border; lakes at most 8% of a province |
| `tests/present/map/relief.test.ts` | the CPU heightfield and rasters are a pure function (same map and seed, same hash, and no `Math.sin`, `exp`, `pow` or `tanh` in the rule-bearing modules, by a source scan); every wild-peak pixel above every passable pixel within 2 D; every mere surface below the land within 1 D; the CPU shading is mean-neutral per province within ΔE 0.5; along terrain borders the relief's p90 is at most 3 times the cores' (the escarpment guard); each terrain's core p90 swing reaches a third of its cap |
| `tests/present/map/pieces.test.ts` | the town threshold (step 4, PD 5, a fort, temple or lab, a capital); base sizes are continuous in D_px within their clamps; the base silhouette by allegiance (notches at least 2 px at 16 px); at most one status plaque; slots: no army base outside its province's 2 px inset, no piece over a label, armies in front of the seat only where no slot fits (counted per band on the cover maps) |
| `tests/ui/derive/mapLabels.test.ts` (changed) | the budgets per band at the start zoom; no overlaps among labels, piece boxes and seat zones at every band; at Near, at least 90% of provinces in view keep a name; Shift shows names only alone, with nothing selected and no tooltip open |
| Fog guard (approved) | every map look comes from `provinceView`; changing hidden state (population, springs, independents' strength) leaves the bake, the composite inputs and the pieces unchanged; changing a province's owner changes its rails in every fog state |
| Cache | the cache key changes with any change to MapData (including `wilds`), `BAKE_VERSION` or the albedos |
| Browser smoke (Playwright, `src/render/**`) | the GPU bake against the CPU reference at 1024: every province's mean within ΔE 0.5 of its albedo; rendered rails at device pixel ratio 1 and 2 on a test map, measured on pixels against §4.5; the frame budget of §10.2; GPU memory within 96 MB on Large with 4 nations at ratio 2 |

---

## 14. Milestone placement

| Phase | What lands |
|---|---|
| Phase 8: Map rendering and core UI | the CPU reference (lookup warp, cores, distances, quarter-resolution heightfield, water placement); the CPU bake at 1024 in a worker (the fallback path, built first); the composite shader (glow, hover, selection, fog, washes, modes); vector rails, hairlines and water; vector bases with a simple silhouette per archetype and the slot rule; labels by band and link hover; the model's cliff, lip, plinth and shadow under Table Simple; the palette, cover, relief and pieces tests |
| Phase 9: Remaining UI | the numbers layer and Shift; the Map labels setting; high-contrast borders; the plaque and the compass prop with Table Full (approved timing) |
| Phase 10: Battle replay viewer | the procedural figure atlas (battle track); the map's army pieces switch to it |
| Phase 11: Art and animation | the tiled GPU passes and the 2048 bake; the raster cache; cast shadows; live crowns at Near; procedural detail tiles; settlements, walls and landmarks as pieces in the kits; land-look and event pieces; scar decals; owner art intake for the map kinds (M1-should) |
| Phase 12: Balance and polish | the performance smoke at budget; the owner's look at a real bake |

**Scope.** docs/10 caps the war table and wild art at about a quarter of Phase 8's diff. If the map items above overrun
it, they are cut in this order, first cut first, each with its fallback: live crowns at Near (the bake's canopy); cast
shadows (hillshade only); waterfalls; the brass compass prop; the Near detail tiles (the bake alone); lone trees; the
GPU path (the CPU bake at 1024 stays the only path).

**M1:** everything above except the owner's raster sets. **M1-should:** owner figures, kits, tiles, the plaque art, the
tilt at Far if the owner wants it (question 3). **Later:** rivers with a crossing rule (question 4), chasms as a wild
kind, a "Life" option for animals.

---

## 15. Owner questions (defaults in bold; the build follows the defaults)

1. **The owner tint.** The direction asks for "a light tint" over owned land. **Default: rule-safe ownership: thin
   rails, a soft glow inside realm edges, and a strong tint on the province pointed at or selected; the color-blind
   rule holds everywhere.** Option: add Interface → Realm tint (off by default), which tints all owned land 8% toward
   its banner. It reads like the references, but between owners it drops terrain pairs to 13.4 / 4.6 (354 of 3,024
   pairs under 20 / 12), so a color-blind player can mistake one terrain for another across a border; the setting says
   so.
2. **The table:** **the model stands on the open oak, its cliffs on the wood** (§2.2), or the sand-table tray, an
   oak-framed box on the table whose dark floor shows around the model, as the references' void does (measured in §2.2;
   no change to the approved table).
3. **The camera:** **top-down with painted depth** (§2.5), or, after the bake exists, a gentle tilt only while leaning
   back past the start zoom (M1-should).
4. **Rivers between provinces:** **not in M1; for M2, a crossing rule** (entering across a river costs one more day; an
   attacker across a river fights at −1; bridges cross free), after which rivers run between provinces and bridges
   show the crossings. Decorative rivers between provinces now are not offered: they read as a rule the game does not
   have.
5. **The land colors:** **adopt the v4 albedos** (§4.1), which replace both the approved fills and the painted B toggle
   on the model; or keep the approved fills, which also pass the rule but are high-key (open land at L\* 81).
6. **The right dock:** **starts collapsed to its 48 px rail** (Outliner and Feed one click away; the choice persists),
   or open as approved.
7. **Names at Mid:** **Clean** (capitals, Wellsprings, wilds and what the player points at or hovers in a panel), or
   All names.
8. **Region names:** **dim on the hover card's name line and at Far while Shift is held**, or dropped.
9. **The raster budget:** images already fill the 2 MB budget (1.99 MB: portraits 1.68 MB, oak and floor 0.31 MB); map
   art adds about 0.5 MB. **Raise the budget to 3 MB**, checked against acceptance criterion 1's 5 MB bundle, or keep
   2 MB and load portrait sets on demand.
10. **Animals on the land** (v3's vignettes): **later, as an option**, or never.

---

## 16. Risks and what was not verified

1. **It will still look more like a patchwork than the references.** At the scale of a quarter of a province, patch
   edges stronger than ΔE 15 are 16.6% of the Mid view against 4.3% in the zoomed-in reference (§4.9). The references'
   land is mostly grass and forest; ours has seven terrains at mapgen's shares that must stay 20 / 12 apart for
   color-blind players. The warp, the foothills, the low chroma and the absence of stamps, tracks and chips calm the
   texture to the references' level, but province-sized patches of distinct color remain. A more uniform land needs a
   looser rule, which needs a measured recognizer (palette-ab found texture statistics identify terrain only 48% of
   the time); not offered.
2. **The previews are schematics.** No bake was built in Pixi; the GPU path, the detail tiles, cast shadows, live
   crowns, dotted fog lines and the real miniatures are unbuilt. The research's bench measured a close pipeline
   (`research-tech.md` (b)). The height-blend and amplitude changes were checked on one map (s3) at Near and Mid.
3. **Thin margins:** every pair in every state 20.2 / 12.2; granite against forest 20.06 / 12.30; snow against lit
   farmland 20.6; the relief floor 17.1 / 10.3; rails at device pixel ratio 1 miss by under 0.1 in 2 of 48,510 cases.
   Any change to an albedo, a state cap, a banner, a swing cap, the lit cap, a line width or the glow must re-run
   `calc/report.ts`, `calc/floor.ts` and `review/review-checks*.ts`.
4. **Data modes** sit closer to the albedos than to the approved fills (5.6 / 0.8 against 7.2 / 2.2); they never share
   the screen; palette-ab's ramp fix applies if wanted.
5. **Fog is quiet.** Unexplored land differs by its missing settlements (one gesso hut), the 4% haze, the hem and the
   dotted lines; 4% is the strongest haze the rule allows. At Far, where hamlets are hidden anyway, the hem and the
   lines carry it. A playtest should confirm the frontier reads.
6. **Taste:** mountains are a cool slate, now with lit faces at L\* 73; hills are a saturated umber (OKLCH C 0.092);
   forest at its darkest is as dark as a mere; water is a light jade (L\* 65.5), lighter than the references' teal,
   because darker water collides with swamp, hills or forest under a deficiency, and it is held apart from the land by
   form across states (§3.6).
7. **The painted figures' camera** is untested: the research's one sheet ignored the asked angle; the prompts add a
   camera reference image, unproven.
8. **Rails at device pixel ratio 1** keep 2.67:1 at the worst antialiasing offset, under WCAG 1.4.11's 3:1 for graphics;
   the high-contrast borders option gives 3.87:1. The neutral hairline keeps 2.39:1 on wasteland. Province identity
   is also on the hover and the card.
9. **Not run:** the game, the repo's tests (nothing in the repo changed), any phone, and the owner's eye.

---

## Appendix: files

Under `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/`:

- `map-design-final.md`: this file. `map-design.md`: the first draft, kept for the record.
- `mapwork/calc/` (run from the repo root with `npx tsx`): `colorMath.ts`, `colors.ts` (the repo's files, verbatim);
  `lib.ts`; `search.ts` and `runs/`; `report.ts` → `report-final.out`; `floor.ts`, `exact.ts`, `haze.ts`, `nudge.ts`,
  `dist.ts`; `explore.ts`; `coverage.ts`; `water.ts`, `water2.ts`; `export-map.ts`, `export-many.ts`; `pal-final.json`.
- `mapwork/preview/`: `preview.py` (the first draft's preview), `share.py`; `mapwork/out-final/`: its renders and
  `metrics.json`; `mapwork/map-s3.json`, `mapwork/maps60.json`: the exported maps.
- `review/` (the review's evidence):
  - `review-checks.ts` to `review-checks8.ts` with their `.out`: snow, water and wild grounds across states; rails at
    three antialiasing coverages; internal keylines and hairlines; hover; cliff, lip and tray; the province-mean budget;
    the relief floor with the lit cap; the glow peak.
  - `coverage-far.ts` → `coverage-far.out`: the glow core at Far widths, 180 maps.
  - `preview-fix.py` (the first draft's preview with this design's corrections; `HSIG`, `LITK`, `AMPX`, `TRAY`
    switches) → `out-fix/` (`far.png`, `mid.png`, `near.png`, `mid-fog.png`, deutan views, `metrics.json`).
  - `escarp.py` → `escarp.out`, with the dumps in `dump-orig/`, `dump-fix/`, `dump-fix-ax/`; `escarpment-compare.png`.
  - `patchiness.py` → `patchiness.out`: province-scale patchiness of the references and both previews.
  - `explored-at-start.ts` → `explored-at-start.out`: the explored share on day 0.
  - `review-sheet.png`: before and after, relief rims and fog.

---

## What the review changed, and why

Kept as written: the model on the oak table, the top-down camera, the albedos and every raw color figure (the report
re-runs identically), the lookup warp and its 80% floor, the case against a default whole-province tint, the lit-bead
rail, the glow's 0.05 D and 0.35, miniatures on bases with no numbers, labels by band, the v3 element table (with three
rows refined), water inside one province, the modes' mechanism, the owner art kinds, the docs plan and the phase plan.

**Against the owner's direction**

1. **The tint conflict is the owner's call.** The direction asks for "a light tint over owned land"; the draft ruled it
   out in V6 and asked nothing. The measured case stands (4% already gives 17.5 / 10.0 between owners), so the default
   keeps the rule, and owner question 1 now offers a Realm tint setting (8%, off by default) with its cost stated.

**Against docs/01 and docs/07**

2. **Ownership is public in every fog state** (docs/01 §14). The draft kept "the last-seen owner's rail and glow" on
   out-of-sight land, and showed the town "at its last-seen state", a copy the sim does not keep (population is known
   once explored). Both now show the current state.
3. **Unexplored land shows the whole model.** On day 0 a nation has explored 10% to 22% of a Medium map (median 15%),
   so the draft's dust sheet (half relief, no canopy, no water) would have been 85% of the first screen, hiding the
   relief the owner asked for, while terrain is public anyway. Unexplored now means: the full bake under the approved
   4% haze, one gesso hut, nothing that reveals population or springs, dotted lines, the hem. No color state changes.
   (The draft's fog preview also left the towns standing in unexplored land.)
4. **Fog states never combine:** unexplored takes the haze, not the desaturation, so the five measured states stay the
   only ones.
5. **Shift keeps docs/07's condition** (alone, nothing selected, no tooltip open), so the tooltip's "Shift more" does not
   flood the map with names.
6. **The region name moves to the card's name line;** docs/07 principle 1 reserves the dim footer for the next-gesture
   hint.
7. **Hovering a link to a province names it on the land.** With names gone from the start zoom, the feed, alerts and
   outliner needed a way to find a named province; this keeps names one gesture away.
8. **No tint in data modes.** A hover or selection tint changes the mode's value color; modes now get the inner line
   only. Wilds are never tinted on hover (docs/09).

**Color, re-measured with the repo's color math**

9. **Snow failed in the haze state.** The draft measured snow raw (20.1); under the 4% haze lit mountains come to 19.4 /
   18.3. Lit faces now gain at most 0.6 of the swing (as real hillshade: lit faces brighten less than shade darkens):
   20.6 / 19.4 in every state, mountains' lit faces at L\* 73 instead of 79 (less icy), and the relief floor improves to
   17.1 / 10.3.
10. **Water is 20 / 12 only raw.** Across states it falls to 19.7 / 8.5 against wasteland, and no color within ±6 L\*
    and ±12 a\*b\* passes. The claim and the docs/09 draft are corrected; water is held apart by its form.
11. **The province-mean budget was too loose.** At ΔE 2.0 two provinces of different terrain can come to 20.2 / 11.7
    raw; at 0.5 they keep 21.4 / 14.0. The budget is 0.5 (the corrected preview measures 0.07).
12. **Rails broke under antialiasing.** The draft's 0.75 px keylines render at about 50% on oblique edges: 843 of 16,170
    grounds fail the band rule (the M1 banners Ember 223 and Thornwood 171) and contrast falls to 1.79:1. Every line is
    now at least 1.5 device pixels: no fail at device pixel ratio 1.5 or more, 2 misses under 0.1 at ratio 1 (cleared by
    high-contrast borders), and the test checks the coverage the line really gets.
13. **Internal borders lose a line:** a two-tone line (banner and `keylineFor`, 3.28:1 at worst) instead of a three-line
    bead; ownership is read at the realm edge.
14. **The neutral hairline was too faint:** 1.98:1 on wasteland at 55% with states and relief counted (the draft quoted
    2.00 raw); it is now 1.5 px at 70%, 2.39:1 at worst.
15. **The land's edge merged with the cliff top** (1.04:1 on shaded hills, 1.58:1 on shaded forest). The top is now
    #3A3436 under a 1.5 px worn lip at 50% along the whole outline: 3.25:1 at worst.
16. **The independents' hover was invisible on light land** (ΔE 3.6 on farmland). It now pulls toward the ground's
    `keylineFor` keyline at 0.20 (ΔE 7.7 to 12.6), and every hover adds an inner line, because a banner tint at 0.25
    can move a province by as little as ΔE 3.6.
17. **Two figures in the draft were off:** the area-weighted chroma mean is 0.072, not 0.066 (that is the preview's pixel
    mean); `report.ts` now defaults to an earlier water candidate that fails, so it must run with `WATER=#50AF9B`.
18. **"Wilds are the darkest grounds" no longer holds per pixel** (forest at its darkest is L\* 14.6, granite 16.8); the
    docs/09 sentence is restated around contour, rim and form. The color distances still pass (20.9 / 13.2, 23.8 / 14.4).

**Geometry and look**

19. **The relief drew every terrain patch's outline.** The height used the albedo's 1.1-unit blend, so base heights
    stepped at every border and hills read as mesas: at Near the relief along terrain borders was 10 to 18 times the
    cores' on plains and farmland. Height now has its own Gaussian blend (σ 0.12 D) and the low terrains' amplitudes
    are 2.5× higher: the ratios fall to 1.7 to 2.7, foothills cross the rails, and Near's fine busyness drops from 13.3%
    to 9.5% (`review/escarpment-compare.png`). The draft's own §3.7 forbade exactly this escarpment.
20. **Per-province mean removal as a constant** would step at borders between same-terrain provinces; the offset is now
    spread across the ecotone and iterated.
21. **Armies stood inside the towns.** The fixed token zone lies 0.18 D from the seat, less than the two pieces' radii
    at every zoom (start: 17 px against 25; Near: 75.6 against 77). Slots are now placed from the pieces' real sizes,
    inside the province, with a stated fallback in front of the seat, and tested.
22. **Far was crowded:** a 22 px army base and an 18 px town on a 42 px province. Bases now scale continuously (16 px at
    Far, 22 at the start zoom as before), towns start at 14 px, hamlets hide at Far, and no size steps at a band edge.
23. **The glow's 4 px floor broke the 72.7% core** wherever a province is under 80 px, that is all of Far: at 50 px the
    core minimum is 58.2% (4,425 of 15,300 provinces under 70%), at 42 px 50.9% (9,287). The floor is gone.
24. **One oblique for everything.** V2 said faces are seen from 25° off the zenith, §2.2 drew the 24-unit cliff at full
    height, and the figure prompts used 40°. All painted depth now uses the battle's 40° pitch, which also lets the map
    share the battle's figure atlas: the cliff shows 18 units, bases are 0.64 ellipses.
25. **Faces never cover land:** wild crags and mere banks are drawn inside the wild's polygon, so no passable pixel is
    painted over by a face and hit tests stay exact.
26. **Allegiance is a silhouette:** notches are cut into the base's outline (at least 2 px), not gaps in a colored rim,
    which vanish on dark ground.
27. **Clutter caps:** hamlets are muted at Mid (within 2.5:1 of the ground, not white dots), guards are Near-only, the
    battle marker drops its cairn (the scars' family), and v3's motif slot shares, which had no slots left in v4, become
    absolute caps (at Mid at most 3 land-look pieces and 1 pole motif a province).
28. **Detail that aliases moves to Near:** farmland furrows (a 1.3-unit period, finer than the bake's texel at Mid) and
    sub-texel canopy stipple read as static and hatch at Mid; Mid shows parcels and clumps, Near the tiles.
29. **Data-mode relief is a fixed ±3 L\*** instead of half the terrain's swing (±8 on mountains), so it never competes
    with the data ramp's 13.2-apart stops.

**Build, performance, determinism**

30. **The bake is a pure function of the map** (V17): hamlets are sprites, washes live in the composite, scars are
    decals. The draft baked hamlets ("painted on the land") while promising no re-bakes, and wrote scars into a cached
    bake.
31. **Memory was over docs/06's budget.** With the 4096 bake the docs/06 case (Large, 4 nations, ratio 2) comes to about
    103 MB against 96 (the draft summed 91 by leaving out the atlas's mips and the fonts). One 2048 bake everywhere,
    vector water, detail tiles and live crowns for Near: about 59 MB.
32. **Phones:** the draft said both "phones at 1024 only" and "phone 2048"; phones now run the same GPU path at 2048 on
    WebGL2, with tiled passes (16 MB transient), noise from a seeded texture (no integer hashing at mediump), and
    Reduced detail by default on coarse pointers.
33. **A pipeline order bug:** streams were traced in CPU step 3 on the heightfield made in GPU step 4. The CPU reference
    now makes its own quarter-resolution heightfield for streams and the invariant tests.
34. **Engine-independent CPU reference:** ECMAScript leaves `Math.sin`, `exp`, `pow` and `tanh` to the engine, so the
    rule-bearing rasters (lookup, cores, distances, water) use only arithmetic, `sqrt`, `floor` and table noise; a
    source scan tests it.
35. **The cache** is keyed by a hash of the map (the draft's key missed the wilds switch) and holds the CPU rasters,
    which are device-independent and small, not 42 to 56 MB of GPU bake per map; LRU of 3.
36. **Edges at Near:** the glow and tints read a linear signed-distance texture, so they do not stair-step where a texel
    of the nearest-sampled id texture spans 2 to 3 px.
37. **Crowns' chunks are 128 units, not 512:** a 512-unit chunk is larger than the whole Near view, so a few chunks
    would hold over 100,000 crowns off screen.
38. **`hash32` and `streamFor` do not exist yet;** they are docs/12 S2's `src/present/rand.ts`, so whichever of Phase 8
    and S2 lands first creates it.
39. **Phase 8 scope:** docs/10 caps the map art at about a quarter of the phase; a cut order with fallbacks is added.

**Claims corrected**

40. **"As calm as the references"** rested on a 6 px measure that cannot see province-sized patches; the province-scale
    measure is added (16.6% against 4.3%) and risk 1 restated.
41. **The raster budget** is full, not 0.9 MB over: images total 1.99 MB (portraits 1.68 MB in 272 WebP files, not
    2.9 MB in 274); question 9's default becomes 3 MB.
42. **Art prompts** asked for a figure "on a plain round black base" while the game draws its own base; figures and the
    Wellspring now come without a base, at the 40° pitch.
