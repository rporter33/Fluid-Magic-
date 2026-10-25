# The relief map: the v4 map design

2026-10-22. The build spec for the map half of the owner's v4 direction. The battle half is designed separately. The sim
is untouched: every mark on the map comes from map data, the viewer's `provinceView` and seeded presentation streams.
Nothing in the repo was edited; every number below was measured in this directory (appendix).

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

**What stays exactly as approved:** the tavern, the oak table, its props, light and settings (war table §2, except the
cloth, §2 below); the layered UI, the top bar, the alerts ribbon, the docks, the strip and every key; the wild model
(peaks and meres, about 9% of the map, never near a capital, a way around within 6 provinces), its grounds, contour,
rim and names; settlements that grow by population and build walls by PD in the owner's architecture; land looks,
nation motifs, pole motifs and event marks; leader portraits; the six map modes and their mechanism; the fog rules
(what each state shows); the docs/09 distinct-colors rule at 20 / 12; one light from the upper left.

**Evidence.** Scripts run with `npx tsx` from the repo root import the repo's own `tests/content/colorMath.ts` and
`src/content/colors.ts`, copied verbatim into `mapwork/calc/` (diff-checked against 41779dd), and the repo's
`src/mapgen/generate.ts` read-only. The pixel checks run on a numpy preview of this design over real mapgen maps.

| File (under `visual-v4/mapwork/`) | What it measures |
|---|---|
| `calc/search.ts` → `calc/runs/*.out` | the albedo search: the natural target, the hard constraints, every run |
| `calc/report.ts` → `calc/report-final.out` | every color check in §4 for the chosen albedos |
| `calc/explore.ts` | whole-province tints on the approved and painted fills (§4.4) |
| `calc/coverage.ts` | the core share of every province on 180 maps for a border band of width w (§3.1, §5) |
| `preview/share.py` | each province's own-terrain share under the lookup warp, 60 maps, 5,100 provinces (§3.1) |
| `calc/water.ts`, `calc/water2.ts` | the water color and the bases' lip (§4.7) |
| `calc/floor.ts`, `calc/exact.ts`, `calc/haze.ts`, `calc/nudge.ts` | the relief floor as stated, unrounded margins, the strongest fog haze, the last nudge to the forest albedo |
| `preview/preview.py` → `out-final/` | the preview at Far, Mid and Near, fog, a deutan simulation, and its pixel metrics (§4.9) |

---

## The design in fifteen lines

1. **The cloth becomes a terrain model** carved and painted on a board, standing on the oak war table. Its south faces
   drop as rock cliffs to the wood, it casts a soft shadow to the lower right, and its name is on a brass plaque.
2. **One light from the upper left lights the model.** The hillshade is mean-neutral over every province, so the color
   a province averages to is its terrain's albedo, and the docs/09 rule still tests the colors drawn.
3. **The camera stays top-down and orthographic.** Depth is painted: relief shading, cast shadows, upright miniatures
   and cliff faces drawn on the camera-facing edges. Hit tests, rails and labels stay exact.
4. **One terrain per province for the rules, one landscape for the eye.** The paint looks up its terrain through a
   seeded warp of at most 0.10 D, so terrain edges wander organically across borders, and every province is still at
   least 80% its own terrain (measured minimum 81.8% on 5,100 provinces). Relief is continuous everywhere.
5. **A low-key natural palette** of seven terrain albedos that still passes 20 / 12 in every approved state, with a
   stated texture floor, no passable ground near snow, and nothing above OKLCH chroma 0.10.
6. **Ownership is thin rails, a rim glow and a hover tint.** A thin rail in the banner, lit like a raised bead (a light
   and a dark keyline), runs inside every realm edge, a soft glow of the banner fades inward from it, and the hovered or
   selected province takes a strong tint. There is no tint over whole provinces: even 4% breaks 20 / 12 between
   owners (measured).
7. **Miniatures on round bases.** An army is one painted figure on a dark base whose rim carries the owner's banner and
   whose rim shape carries allegiance. A town is a walled ring on a base, growing with population; hamlets are painted
   on the land. No numbers stand on the land.
8. **Labels by zoom.** Far: capitals, Wellsprings and wilds. Mid adds only what the player points at or plans with.
   Near names every province. The numbers layer and a held Shift show the rest at any zoom.
9. **Wilds stay and become sculpture:** granite massifs raised above everything, snow only on them, and sunken black
   meres, each keeping its 3 px contour, light rim and name.
10. **Water stays inside one province.** Lakes, ponds and streams are scenery; rivers between provinces wait for a
    crossing rule (owner question 3).
11. **Fog and modes keep their rules.** Unexplored land is the model under a dust sheet with its painted detail
    flattened; data modes tint the grey model. Every state is a measured state.
12. **Bake once per game.** GPU passes for height, shade and composite, a CPU worker for the rule-bearing rasters, a
    cache by map seed; per frame one composite draw, vector rails and one miniature atlas.
13. **v3's paper look goes:** washes, ink borders, bands, stamps, tracks, chips, badges, region names on the land,
    vignettes and the cloth margin. What carried information moves to a zoom band or one gesture away (§8).
14. **Owner art** can supply ground detail tiles, miniature figures, town kit pieces, the Wellspring and the plaque;
    every item has a procedural fallback and prompts that never name a game.
15. **docs/09 and docs/07 change** in the sections listed in §12; `palette.test.ts` gains the rail, glow, relief and
    snow checks.

---

## Rulings

**V1. The model replaces the cloth; the table stays.** The approved war table frames the map as a painted cloth. The
direction keeps the table and asks for a terrain model on it, so the cloth's surface becomes the model's surface, the
cloth's margin parts move to the table (§2.4), and the room, oak, props, ambience and Table settings are unchanged.

**V2. Top-down orthographic, with painted depth.** docs/09's "the camera never tilts; depth is painted, never simulated"
stays true. Vertical faces (the model's edge, wild crags, mere banks) are drawn as if seen from 25° south of the zenith,
on south-facing edges only, below the surface they belong to. The surface itself is never displaced, so every pixel of
land is where the sim's polygon says. A tilted or perspective camera was considered and rejected for M1 (§2.5).

**V3. A light on the model, mean-neutral.** R19 ("no light, grade or vignette ever falls on the cloth") is replaced:
one neutral daylight from the upper left (azimuth 315°, elevation 40°) shades the relief, and over each province's
pure-terrain pixels the shading's mean is removed, so the province's mean color is within CIEDE2000 2.0 of its albedo
(measured 0.05 at worst on the preview). No grade, vignette, season tint or time of day falls on the model. The table's
own lights stay masked off it.

**V4. The rules read one terrain per province; the art may cross borders only by the warp.** The renderer paints a
province's pixel with the terrain of the province found at the pixel's position displaced by a seeded warp of at most
0.10 D (D = 90 units, the median province diameter on every map size). Each province is therefore at least 80% its own
terrain, with organic fringes instead of polygon edges. Relief, light and forests' shadows run continuously across
borders; the albedo does not.

**V5. The albedos are law, as the fills were.** Seven terrain albedos replace the fills in `TERRAIN[].fill` and pass
docs/09 unchanged: 20 / 12 on raw albedos and across every approved state. Relief and ground detail move single
pixels; the floor they keep is stated and tested (V5 numbers in §4.3).

**V6. No whole-province owner tint.** A translucent tint over a whole province drops terrain pairs under the rule at
every strength that can be seen (§4.4). The tint therefore lives where ownership is read: a rim glow inside realm
edges, and the full tint on the one province the player hovers or selects.

**V7. Rails replace bands, under the band rule.** A rail is a lit bead: a 1.5 px banner line between a light keyline
(#F4EEDF) on the side facing the light and a dark one (#1C1A17) on the other. It reads on its ground when the banner
differs from the ground, or either keyline differs from both, at 20 / 12, on every relief extreme, under its own glow,
half-blended with any neighbor terrain, in every state: all 16,170 grounds pass for all 11 banners, and the rail keeps
3.87:1 luminance contrast at worst (§4.5). One keyline chosen per fill, as `keylineFor` does for bands, fails 208 of
them.

**V8. Snow and crags stay reserved to the wilds.** Passable mountains are relief without snow; no passable albedo's lit
relief comes within 20 / 12 of snow. Cliffs appear only at the model's edge (no information) and on the wilds.

**V9. Water never runs between provinces** (v3's H5 stands). Lakes and ponds lie inside one province's pure core,
streams rise and end inside one province, and the only water that leaves a province falls off the model's edge.

**V10. Miniatures carry no numbers.** Counts, PD and dominion strength leave the land for hover, selection, the
engagement preview and the numbers layer. Allegiance is the rim's color and shape (never color alone). One status
mark by exception stays on the base.

**V11. "Information never thins" becomes "information is one gesture away."** Each zoom band has a label budget (§7);
everything else is in the hover card, the numbers layer, a held Shift or the panel. docs/07 principle 2 still holds:
every number a decision needs is printed where the player decides (cursor label, engagement preview).

**V12. Fog and modes: rules unchanged, looks restated, states measured.** What each fog state shows is docs/07's; how it
looks changes (§9). Every look is a state in the palette test.

**V13. Presentation randomness is seeded and separate.** Height noise, warp, detail, lakes and miniature variants come
from `streamFor(\`relief:${seed}\`, purpose)` and `hash32(seed, provinceId, purpose)`, never from `state.rng`. The
rule-bearing rasters (terrain lookup, cores, water containment) come from a CPU reference implementation that tests run
in Node; the GPU path draws the same picture and is checked against it in the browser smoke.

**V14. Settlements stay; their stage changes.** Growth, walls, kits, ruins, scaffolding and the unlit brazier are drawn
as miniature pieces. Hamlets and villages are painted on the land; a seat becomes a town piece on a base from
population step 4, or with walls, a fort, a temple or a lab, or as a capital (§6).

**V15. The cloth's look rules go with the cloth.** The paper, washes, ink, wobble, bands, tracks, stamps, flecks,
region names on the land, vignettes, the margin, tacks and hem leave (§8). The shape-family rule (H6) stays for every
miniature and scenery piece.

**V16. Presentation numbers live in one place.** Every size, width, amplitude and threshold below is a row in
docs/09-balance "Map presentation" and a constant in the renderer's params module, read by the tests.

---

## 1. What the player sees, by zoom band

The bands stay docs/07's: the median province's on-screen diameter is under 70 px (Far), 70 to 180 px (Mid) or over
180 px (Near). The camera rules stay the war table's (§2.7 there): the game starts with the model fitted inside a 32 px
oak band (the fit now includes the south cliff face and the plaque), the wheel leans back to 0.75 × the table's fit and
pushes in to a 420 px median province, a ±8% detent settles on the start zoom, `Z` and Fit return to it, the pan is
clamped to the table, and the camera never rotates or tilts. On Medium at 1280 × 720 the start view is about 95 px per
province (Mid); at 1440 × 900 with the docks collapsed it is about 140 px.

| | Far: the model on the table | Mid: the start view | Near: the land |
|---|---|---|---|
| The model | the whole model on the oak, the room around it; cliffs on its south faces, its shadow on the wood, the plaque | the model inside the oak band | land only |
| Relief | hillshade, cast shadows, crags; vertical scale fixed | the same | the same, with the detail tile |
| Ground | canopy reads as dark masses, fields as tone | canopy stipple of 1 to 3 px crowns, field parcels, pools, streams | detail tile, live tree crowns in the visible chunks |
| Ownership | realm rails; internal borders as hairlines; glow at least 4 px | realm rails, internal rails, glow | the same |
| Hover and selection | strong tint on the province | the same | the same |
| Miniatures | towns as walls and keep; one army per nation per province | towns, hamlets, armies, the Wellspring | everything, spring stones, independents' guards, mines and windmills |
| Labels (§7) | capitals, Wellsprings, wilds | adds what the player points at or plans with | every province name |
| Chrome | unchanged | unchanged | unchanged |

Nothing changes position or size when a band changes; the ground detail cross-fades over 150 ms (instant under reduced
motion), as v3 did.

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
| Cliff face | under every south-facing outline edge (outward normal pointing down the screen), a rock face 24 units tall (0.27 D: about 25 px at the 1280 × 720 start zoom, 14 px fully leaned back), drawn below the edge in the painted oblique of V2; strata bands every 6 units at 86% value; #4A4246 at the top to #2A2527 at the foot; east and west edges show a face in proportion to their southward slope | against the oak body #8F7459: 2.23:1 at the top, 3.45:1 at the foot; ΔE 24.3 / 22.1 and 31.8 / 30.5 |
| Plinth | the face's lowest 3 units are the board the model is built on: dark oak #2B231C (the chrome's `--oak-0`) with a 1 px lit top edge | 3.54:1 on the oak body |
| Contact | a 2 px #1C1A17 line at 60% where the plinth meets the table; the model's shadow on the oak, offset 0.05 D to the lower right, blurred 0.06 D, #000 from 55% at the plinth to 0 | the cloth's contact shadow was 35% at 3 px; the model is thicker |
| North and west edges | no face shows from above; a 1.5 px lit lip (#E9E4D8 at 40%) runs along the top of the outline where the light catches it | 1.74:1 over the oak body (an edge highlight, not a line that must read alone) |
| Waterfalls | a stream that reaches the edge falls down the face as a pale streak (#B9D3CF fading out) and ends at the plinth | — |
| Plaque | the cartouche's job: the map's seeded name (`mapTitle(seed)`) in Marcellus SC on a brass plaque #B8914A centered on the south face, 0.9 D wide, set on the plinth | ink #1C1A17 on brass 5.94:1 |

Option B for the owner (question 1): a **sand-table tray**, a recess in the oak top 30 units deep whose dark floor
(#1E1915) shows around the model, so the cliffs drop into shadow as in the references. It needs a new table bake and
changes the approved table top, so it is not the default.

### 2.3 The light

- **One neutral daylight from the upper left**, azimuth 315°, elevation 40°, the light v3 already used for stamps and
  settlements (H14). It shades the relief (hillshade), casts the miniatures' shadows to the lower right, and lights the
  model's lip.
- **Mean-neutral** (V3): per province, the mean lightness change over its pure-terrain pixels is removed, so relief adds
  form but no net light or dark to a province. The preview measures the largest province mean at ΔE 0.05 from its
  albedo (budget 2.0, as v3's paint had).
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
| 3 px outline and the 0.8 px second neatline | gone; the lit lip and the cliff draw the edge |
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
offered as owner question 2 for M1-should, after the bake exists.

---

## 3. Terrain

### 3.1 One terrain per province, one landscape

- **The lookup warp.** The terrain painted at a point p is the terrain of the province that contains p + w(p), where w
  is a two-scale value-noise field (features of 40 units at weight 0.7 and 9 units at 0.3), clamped to |w| ≤ 0.10 D = 9
  units, seeded by `hash32(seed, 'warp')`. A point inside a wild or off the land is never warped into or out of: wild
  edges and the model's edge stay sharp (cliffs and shores). The one-hot result is box-blurred over 1.1 units (0.012 D),
  which softens the fringe into a narrow ecotone without a polygon-shaped band.
- **Measured** (`preview/share.py`, 60 mapgen maps: Small, Medium and Large, 2 and 4 nations, seeds 1 to 10, wilds on;
  5,100 provinces): a province's own-terrain share (pixels whose lookup lands in a province of the same terrain) is

  | Warp limit | Minimum | 1st percentile | Median | Provinces under 0.80 |
  |---|---|---|---|---|
  | 0.05 D | 0.907 | 0.941 | 0.984 | 0 |
  | 0.08 D | 0.853 | 0.907 | 0.974 | 0 |
  | **0.10 D** | **0.818** | **0.883** | **0.967** | **0** |
  | 0.12 D | 0.781 | 0.862 | 0.961 | 2 |

  0.10 D is the widest limit that keeps every province at 80% or more; the test holds 0.80 (§13).
- **What crosses borders:** the fringe of each terrain (up to 9 units into the neighbor), relief and its shading, cast
  shadows, and canopy shadows. **What does not:** a province's albedo beyond the fringe, water, settlements, ownership.
- **What the eye gets:** forests, fields and grass meet in ragged, natural edges that cross the rails, and same-terrain
  neighbors merge into one wood, one range or one stretch of fields, because mapgen clusters terrain by noise. The
  references' land is more uniform than ours can be: seven colorblind-distinct terrains, at mapgen's shares, always
  show more patches than a land that is mostly grass and forest (risk 1, §16).

### 3.2 The heightfield

Height h(p), in units of the vertical scale (26 world units per unit), from the warped terrain weights w_t(p):

h(p) = Σ_t w_t(p) · (B_t + A_t · n_t(p)), with n_t a seeded value-noise fBm (5 octaves, lacunarity 2.03, gain 0.5).

| Terrain | Base B | Amplitude A | Feature (units) | Noise |
|---|---|---|---|---|
| Swamp | 0.03 | 0.015 | 60 | fBm |
| Farmland | 0.08 | 0.03 | 60 | fBm |
| Plains | 0.10 | 0.06 | 60 | fBm |
| Forest | 0.14 | 0.07 | 45 | fBm, plus the canopy (§3.5) |
| Wasteland | 0.18 | 0.10 | 40 | fBm |
| Hills | 0.28 | 0.30 | 30 | fBm |
| Mountains | 0.48 | 0.62 | 22 | ridged (1 − 2\|n\|), rescaled 1.2n − 0.2 |
| Wild peaks | 1.25 | 0.60 dome + 0.15 ridged | 30 | a dome over the range's cells plus ridged noise, 3 octaves; never under 1.10 |
| Meres | −0.05, flat | — | — | a still surface sunk below its banks |

- **Passable land is soft-clamped under 1.00** (mountains reach about 1.10 before the clamp), so the wild peaks, never
  under 1.10, are always the highest ground.
- **Invariants** (tested): every wild-peak pixel stands higher than every passable pixel within 2 D; every mere surface
  lies lower than every land pixel within 1 D; the field is a pure function of (map, seed, bake version). The preview
  (§4.9) approximates these parameters.
- **Seeds:** `hash32(seed, 'relief', terrain)` per terrain, `hash32(seed, 'wild', wildId)` per range.
- The heightfield never feeds the sim. It does not change movement, supply or battle.

### 3.3 Hillshade and shading

- Horn's gradient on the heightfield; shade s = max(0, n · l) for the light of §2.3.
- Lightness change ΔL = A_t · tanh(3.2 (s − sin 40°)), plus the ground detail of §3.4, plus the cast shadow and the
  valley term, with A_t the terrain's p95 swing (L\*, blended by the weights):

  | Plains | Farmland | Forest | Hills | Mountains | Swamp | Wasteland |
  |---|---|---|---|---|---|---|
  | 4 | 4 | 6 | 9 | 16 | 3 | 6 |

- Then, per province, the mean of ΔL over its pure-terrain pixels is subtracted (V3). The color is the blended albedo in
  CIELAB with ΔL added to L\*, converted to sRGB once in the bake.
- These amplitudes are what §4 measures; the preview's measured p95 swings are in §4.9.

### 3.4 Materials and ground detail

All ground detail is lightness only, mean-neutral, and drawn into the bake. Hue never varies inside a terrain (v3's H1:
a hue mottle breaks the rule).

| Terrain | Reads as | Mid detail | Near detail | Relief |
|---|---|---|---|---|
| Plains | open grassland | broad mottle ±3.5 L\* (22-unit patches), fine grass ±1 | the grass detail tile | low rolling |
| Farmland | tilled country | parcels (7-unit cells) in four tones ±3, each with furrows ±1.2 at 0°, 90° or ±30° (never 45°, the reserved hatch) | the field tile; a windmill (scenery, terrain-coded) | nearly flat |
| Forest | dense woodland | canopy stipple ±6 (crowns of 0.6 to 1.2 units: 1 to 3 px), broad mottle ±2 | live crowns in view (§3.5) | gentle, with the canopy's own rim light |
| Hills | rolling upland | broad mottle ±2 | the rock and turf tile; a mine at the foot of a slope (terrain-coded) | rounded, ±9 |
| Mountains | bare passable range | scree in the shade faces | the rock tile; a mine | ridged, ±16, no snow |
| Swamp | wet lowland | pools of water up to 20% of the province (inside its mean), reed stipple ±2 | reeds, the marsh tile | flat |
| Wasteland | dry barrens | crack and dune mottle ±3, grit ±1.5 | the cracked-earth tile | low, ±6 |

### 3.5 Forests

- The canopy is texture, never stamps: a stipple of crowns at 1 to 3 px at Mid that fuses into a dark mass, as the
  references' forests do. The canopy adds 0.04 to the height, so a forest's sunlit edge and shaded edge come from the
  same hillshade as the land.
- Lone trees: in Plains and Hills at most 3% cover, never within 0.15 D of a seat, and inside the province's mean.
- At Near, the crowns in view become live sprites (one `ParticleContainer` per 512-unit chunk, at most 20,000 crowns on
  screen, research B3), so they keep 2 to 4 px crowns at the closest zoom without a 4096 bake.

### 3.6 Water

- **Lakes:** at most one per province, only in Plains, Farmland, Forest and Hills, at most 8% of the province, inside its
  pure core and at least 0.10 D + 2 units from every border, never in a seat, token or label zone.
- **Ponds:** at most 2% of a province, the same placement rules.
- **Streams:** at most one per province, traced downhill on the heightfield from a seeded source in the core; it ends in
  the province's lake or pond, sinks into a swamp's pools, or reaches the model's edge and falls (§2.2). A stream that
  would come within 0.10 D of a border is rejected. 1.5 to 3 units wide (2 to 5 px at the start zoom).
- **Swamp pools** are part of the swamp's ground and its mean.
- **Color:** water #50AF9B with a shore band 3 L\* darker and a highlight on the lit bank. It is 20 / 12 from every
  albedo, from both wild grounds and from snow (§4.7), so a lake never reads as a swamp, a mere or a terrain.
- **Fog shows no water** (v3): unexplored land is the dust sheet (§9).
- **Not in M1:** rivers between provinces, bridges and sea. A river along or across a border reads as a rule; it waits
  for a crossing rule (owner question 3).

### 3.7 Cliffs

Only two kinds: the model's edge (§2.2), which carries no information, and the wilds' crags (§3.8). No province shows a
cliff, a mesa or an escarpment: cliff faces and cliff ticks are the wilds' shape family (H6).

### 3.8 Wilds in relief

- **Peaks:** a granite massif raised above all passable land (§3.2), lit faces #8A857E, flat shade faces #2A292C, snow
  #F2EEE6 on the highest eighth of the massif where its faces turn to the light, and crags: painted oblique faces 10
  units tall on the south side of the range's outline. Snow means impassable, as approved.
- **Meres:** still dark water #24222A sunk below the land, its north bank shown as a 4-unit face (#3A3640) in the
  painted oblique, pale ripples #8FC3D3, reeds and bone-white snags (approved).
- **Kept as approved:** the 3 px ink contour on the outline, the light rim #E9E4D8 inside it, the italic letter-spaced
  name, and "never tinted, faded, hatched, dimmed or fogged". Rails stop where a province meets a wild; the contour is
  the border there. No rim glow enters a wild.

### 3.9 Roads

None in M1. v3's tracks joined every neighbor pair, so they carried no rule and added busyness at every zoom (§8). When the
player moves, the path preview (the light thread with square brass tacks, approved) shows the route.

---

## 4. Color, measured

Every figure here is from `mapwork/calc/report-final.out` (the repo's `colorMath.ts`: CIEDE2000, and Machado 2009 at
full severity for protanopia, deuteranopia and tritanopia), written normal / worst deficiency unless marked. Swatches:
`mapwork/out-final/albedos.png`.

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

**How they were found.** A seeded (1+1) annealer over CIELAB (`calc/search.ts`, palette-ab's scheme), 16,000 to 20,000 steps a run,
minimizing the CIEDE2000 distance (lightness weighted ½) to a natural, low-key target (the references' forest, open
grass and rock, and invented siblings in the same key for the terrains they do not show: plains #6E7A3A, farmland
#B39A5A, forest #24391A, hills #6A6436, mountains #7E8086, swamp #3F4A3A, wasteland #A89C8C), with every check below as a
hard constraint, plus: no albedo above OKLCH C 0.10 (mountains, swamp 0.05; wasteland 0.06), mountains cool (hue 220 to
290) and no lighter than L\* 64, no albedo darker than L\* 22 before the last nudge, so the wild grounds stay the
darkest ground (granite is L\* 16.8, mere 13.7). The chosen palette is run n6 seed 61, then forest moved by ΔE 1.04
(`calc/nudge.ts`) so the granite margin passes unrounded. It is the best of the 32 completed runs, not a proof of optimality.

**Distance from the target:** plains 5.7, farmland 7.9, forest 2.6, hills 10.4, mountains 13.1, swamp 17.2, wasteland
14.2 (RMS 11.2). The rule costs the most where the target was most muted: swamp and wasteland cannot both be dark
grey-green and grey-brown next to forest, hills and plains for color-blind players.

**Key and chroma against the earlier palettes** (area-weighted by mapgen's terrain shares):

| | L\* range | Area-weighted mean L\* | OKLCH C mean / max |
|---|---|---|---|
| A, approved fills | 29.8 to 81.8 | 58.3 | 0.075 / 0.149 |
| B, painted fills | 23.7 to 86.5 | 57.2 | 0.050 / 0.094 |
| **v4 albedos** | **20.5 to 74.0** | **46.4** | **0.066 / 0.098** |
| The natural target | 21.5 to 65.0 | 44.6 | 0.053 / 0.089 |

Open land now sits in the middle of the range (plains at L\* 54, against 81 and 87), the change the references make
most visibly. The preview's land is still about 16 L\* lighter than the references' in the median (§4.9): seven terrains
need the spread.

### 4.2 The docs/09 rule, unchanged

| Check | Measured | Needs |
|---|---|---|
| Raw albedos, closest pair per vision | 21.7 (mountains / wasteland) / 14.5 protan (forest / hills) / 14.3 deutan (plains / wasteland) / 14.7 tritan (plains / mountains) | 20 / 12 |
| Every pair of different terrains in any two approved states (raw, unexplored haze 4%, out of sight 10%, ash 10%, moss 6%) | 20.2 / 12.2 at worst; 0 of 525 pairs under (unrounded 20.19 / 12.17) | 20 / 12 |
| Granite #2A292C against every albedo in every state | 20.1 / 12.3 (forest; unrounded 20.06 / 12.30) | 20 / 12 |
| Mere #24222A against every albedo in every state | 23.3 / 14.2 | 20 / 12 |
| Both grounds against every albedo's relief extremes (±A) | 20.6 / 13.1 and 23.3 / 14.4 | — |
| The strongest unexplored haze that keeps every pair | 4% (6% leaves 3 pairs under) | the approved 4% |

So `palette.test.ts`'s terrain test passes unchanged in code with the new `TERRAIN[].fill` values, and the approved
state caps (ash 10%, moss 6%, haze 4%, out of sight 10%) stay exactly as they are.

### 4.3 The relief texture floor (replaces v3's H13 floor)

Relief and ground detail move single pixels by up to ±A (the p95 swing, §3.3). The rule binds the albedos; the floor
states what the textured pixels keep. At ±0.4 A (the interquartile range of the shading: half a province's pixels lie
inside it), every pair of different terrains in every approved state keeps **17.1 / 10.0** (unrounded 17.12 / 10.05;
276 of 4,725 pixel pairs fall under 20 / 12). At ±0.25 A: 18.0 / 10.8. At ±0.5 A: 15.1 / 9.0. At the full ±A: 9.3 / 4.4,
mountains' shaded faces against swamp.

v3's H13 held 19.5 / 11.0 for a mottle of about ±1.7 L\*. Relief that reads as relief is ten times that on mountains, so
the floor is lower; terrain identity rests on the albedo means (the rule), the relief pattern (ridged, rolling, flat),
the canopy, parcels and pools, and the hover card's terrain line. The test holds the floor at 17 / 10.

### 4.4 Why there is no whole-province tint

A translucent owner tint over a whole province, at strength t (normal blend), against every pair of different terrains:

| t | Same owner on both | Any two owners, or one unowned | Pairs under 20 / 12 |
|---|---|---|---|
| 0.04 | 20.3 / 13.0 | 17.5 / 10.0 | 84 of 3,024 |
| 0.08 | 18.4 / 12.0 | 13.4 / 4.6 | 354 |
| 0.12 | 16.5 / 10.8 | 8.8 / 3.7 | 554 |
| 0.20 | 13.7 / 7.8 | 4.5 / 1.2 | 765 |

The same holds on the approved and painted fills (`calc/explore.ts`: A drops to 15.2 / 7.7 at 8% and to 2.2 / 0.3 at 16%;
a lightness-keeping "color" tint fails as well). At 20%, the references' "light tint", a tinted province of one terrain
can match another terrain under another owner (4.5 / 1.2). Hence V6: the glow, along realm edges only, and the full
tint on the one province the player is pointing at.

### 4.5 Rails: the band rule, restated

docs/09's band rule asked that a band read on every fill: the banner differs from the fill, or the keyline differs from
both. For rails the ground is no longer flat, so the grounds are, per terrain: the albedo and its relief extremes (±A);
each of those untinted and under the banner's own glow at its 0.35 maximum; and each half-blended with every other
terrain (a rail near a fringe); all in every approved state. That is 210 grounds per terrain and banner.

| Rail | 11 banners × 7 terrains × 210 grounds = 16,170 | Worst luminance contrast (banner or keyline against the ground) |
|---|---|---|
| One keyline chosen by the albedo (`keylineFor`, as bands do) | 208 fail (mostly the pale banners #B5D69C and #F3E6B8 on Forest, Hills and Swamp, and Umbra #3D2B4F on Mountains and Wasteland) | — |
| One keyline chosen per banner and terrain | 0 fail | 2.16:1 (Tide #3A7BD5 on shaded Mountains); 634 grounds under 3:1 |
| **The lit bead: both keylines** | **0 fail** | **3.87:1** (#8F0F04 on Plains under its own glow) |

The lit bead is the only one of the three that also keeps a thin line at 3:1 or more for every banner on every ground
(WCAG 1.4.11's floor for graphics), which a 1.5 px line needs more than a 9 px band did.

### 4.6 The rim glow and the hover tint

- The glow is a tint of the banner over the ground at most 0.35 at the border, so its pixels are among the rail
  grounds above. The core it leaves untouched is at least 72.7% of every province (§5.2), where the rule's albedos
  show.
- The hover (0.25) and selection (0.30) tints apply to one province; its pixels stay rail grounds (at most 0.35) and
  the card names its terrain.

### 4.7 Other colors on the land and table

| Check | Measured |
|---|---|
| Water #50AF9B (L\* 65.5, OKLCH C 0.095) against swamp, mere and granite | 31.2 / 27.3, 53.1 / 43.5, 50.6 / 41.6 |
| Water against every other albedo | at least 22.1 / 18.9 (plains) normal and 24.4 / 12.3 (mountains) under a deficiency: 20 / 12 from every terrain |
| Snow #F2EEE6 against every albedo's lit relief (+A) | 20.1 / 19.2 at worst (mountains): no passable ground reads as snow |
| Neutral hairline (unowned borders) on every albedo's relief extremes | 2.00:1 (wasteland) to 3.57:1 (forest) |
| Banner rims on the dark base #1E1B18 | 11 of 12 (all banners and pewter) directly; Umbra #3D2B4F by a 1 px #F4EEDF keyline |
| The base's worn lip #B8B1A4 with the base, on every relief extreme | 2.86:1 (swamp) to 7.44:1 (farmland) |
| Cliff face against the oak body #8F7459 | 2.23:1 at the top, 3.45:1 at the foot; ΔE 24.3 / 22.1 and 31.8 / 30.5 |
| Plinth #2B231C on the oak body | 3.54:1 |
| Plaque: ink #1C1A17 on brass #B8914A | 5.94:1 |

### 4.8 Data modes

Modes never draw an albedo (§9.2). Their colors are the approved frozen `MODE_BASE` and ramp, so R16 holds unchanged.
For information: the closest albedo to any mode color is 5.6 normal (Farmland against the ramp near #EAB879) and 0.8
under a deficiency, against the approved fills' 7.2 / 2.2 and B's 5.3 / 0.7. If the owner wants the approved floor
back, palette-ab's measured fix (stops 3 and 4 at #9196A3 and #E0AD85) applies.

### 4.9 Pixels: the preview against the references and v3

`mapwork/preview/preview.py` paints this design on real mapgen maps with numpy: the warp, the heightfield and hillshade,
mean-neutral shading, the ground detail, lakes and swamp pools, the wilds, rails, glow, hamlets, towns and placeholder
army pieces, the cliff and the table. It is a schematic to check numbers, not the game's art (no detail tiles, flat
placeholder miniatures). Images: `mapwork/out-final/` (`contact-sheet.png`, `mid.png`, `far.png`, `near.png`,
`mid-fog.png`, `mid-deutan.png`, `near-deutan.png`).

| Measured on the Mid view (land only; Medium, seed 3) | v4 preview | ref-2, map zoomed in | v3 Mid (cloth) |
|---|---|---|---|
| A province's core mean from its albedo (CIEDE2000) | 0.05 at worst, median 0.00 | — | budget 2.0 (v3's paint check) |
| Own-terrain share, this map | 0.855 at worst | — | 1 (no blending) |
| p95 lightness swing per terrain (L\*) | plains 2.1, farmland 4.0, forest 6.0, hills 7.8, mountains 16.1, swamp 1.3, wasteland 3.8 | — | — |
| L\* p5 / p50 / p95; sd | 15.1 / 50.2 / 75.8; 18.5 | 12 / 34 / 47; 11.2 | 16 / 47 / 83; 22.8 |
| OKLCH C mean / p90; pixels over 0.12 | 0.066 / 0.098; 0.25% | 0.063 / 0.096; 0.5% | 0.063 / 0.135; 11.2% |
| Coarse busyness ΔL\* > 10 / > 20 (6 px cells, refs-analysis §1) | **11.7% / 2.7%** | 11.4% / 1.9% | 40.3% / 14.9% |
| The same with miniatures and labels | 15.4% / 4.3% | — | — |
| Near, land only | 13.3% / 1.8% | — | v3 Near: 25.8% / 8.6% |

The land is as calm as the references' by this measure and about a third as busy as v3; it keeps more value range
than the references (sd 18.5 against 11.2) because seven terrains must stay apart for color-blind players.

---

## 5. Ownership on the land

### 5.1 Lines

All lines are vector meshes built from mapgen's polygons (straight edges; v3's wobble goes), screen-constant in width
(at UI scale 100%), rebuilt on a zoom change (about 360 segments on Medium, research B4). The raster border field the
research tried vanished at Near; vectors do not.

| Border between | Drawn | Width |
|---|---|---|
| two provinces of different owners, or an owned and an unowned province | on each owned side an **inset rail**, set 1 px inside the border: a 0.75 px dark keyline on the border side, the banner, a 0.75 px light keyline toward the interior; the unowned side draws nothing | 0.75 + 1.5 + 0.75 px (Far 0.75 + 1 + 0.75); two owners show two rails 2 px apart |
| two provinces of one owner | one **centered rail**: the banner between a light keyline on the side facing the upper left and a dark keyline on the other; at Far a neutral hairline instead (the realm edge carries ownership there) | 0.75 + 1.25 + 0.75 px |
| two unowned provinces | a **neutral hairline**: #1C1A17 at 55% on light albedos or #F4EEDF at 50% on dark ones (`keylineFor`) | 1.25 px |
| a province and a wild | the wild's 3 px ink contour and light rim (approved) | 3 px |
| a province and the model's edge | the lit lip (§2.2) | 1.5 px |
| any of these with both sides fogged | the same line dotted 2 / 3 px (approved meaning) | — |

Every rail is a **lit bead**: the banner between both `MAP_KEYLINES`, which reads as a raised line on the model under
the one light, like the references' rails with their lighter core and darker edge. Carrying both keylines is what lets
every banner pass on every ground (§4.5) without a per-terrain choice; the band's `keylineFor` stays for nothing else
on the map and remains in content for the chrome's tests.

### 5.2 The rim glow

- Along every realm edge (owners differ, or owned against unowned), the owned side is tinted toward its banner (normal
  blend) by t(d) = 0.35 · (1 − d / W)^1.6 for a distance d from the border under W, with W = max(0.05 D, 4 screen px).
- Not along internal borders, wilds or the model's edge, and never inside a wild.
- **Why 0.05 D:** the glow must leave the terrain readable. With W = 0.05 D the untouched core is at least 72.7% of every
  province (median 82.9%) on 180 maps and 15,300 provinces (`calc/coverage.ts`); at 0.07 D, 1,064 provinces fall under
  70%. At Far the 4 px floor keeps the glow visible on small provinces.
- **Drawn live** in the composite shader from a province-id texture, a nearest-edge distance and across-id texture
  (baked once with the map), and a 256 × 1 owner palette, so a capture updates one texel and re-bakes nothing.

### 5.3 Hover and selection

| State | Look | Rule |
|---|---|---|
| Hovered province | the whole province tinted 0.25 toward its owner's banner (unowned: #E9E4D8 at 0.20); its rails 0.5 px wider | terrain pairs are exempt: one province at a time, and its card names the terrain |
| Selected province | tinted 0.30, with a 1.5 px #F4EEDF line inside its rail | the same |
| Hovered or selected miniature | its base lifts 2 px with a larger shadow; a #F4EEDF ring on the ground around the base (the selection ring, approved) | — |

The rails pass the rule on these grounds too: the strongest tint at a rail is the glow's 0.35 (§4.5).

### 5.4 In modes, fog and events

- **Ownership mode** is the default view described here. In every other mode the glow is off; rails, hairlines, wild
  contours and miniatures stay (the always-on layer, as approved).
- **Fog:** rails and hairlines are dotted where both sides are fogged; an out-of-sight province keeps its last-seen
  owner's rail and glow; an unexplored one shows what the view knows.
- **Settlement kits** still show the owner in architecture (approved), so ownership never relies on hue alone: rail
  pattern (inset or centered), the kit, the base rim shape and the pennant.

---

## 6. Miniatures

### 6.1 Principles

- **Physical pieces under the one light.** Every piece stands on the model, casts a short shadow to the lower right
  (#000 at 25%, offset 0.15 × its base), and is drawn upright, sorted by the ground y of its base (nearer pieces in
  front).
- **Round bases.** A base is a dark disc (#1E1B18 top) whose side shows as a crescent 0.12 × its diameter below it (the
  painted oblique of V2), with a 1 px worn lip (#B8B1A4) on its upper-left quarter and a rim in the owner's banner.
- **No numbers on the land** (V10). The shape-family rule (H6) holds for every piece: armies, towns, walls, shrines,
  tents, cairns and pennants keep their reserved families.

### 6.2 The set

| Piece | Shown | Base | Content | Owner and state |
|---|---|---|---|---|
| **Army** (a commander with squads) | where the view shows it | B_a = clamp(0.20 × the median province's screen diameter, 22, 34) px | the lead commander's figure, 1.15 B_a tall, idle, facing lower right; a short pennant pole at the base's rear | rim by allegiance (§6.3); pennant in the banner |
| **Lone commander** (no squads: scout, mage, priest, prophet) | the same | 0.8 B_a | the commander's figure; the scout hooded, the prophet with the halo | rim; no pennant |
| **Pretender** | the same | 1.15 B_a, brass edge | its body's figure at 1.3× | the crown on the base plaque |
| **Stack** (several armies of one nation in one province) | the same | an oval 1.5 B_a wide | up to 3 figures; the count on hover | fans out on hover; click and Shift+click as approved |
| **Several nations in one province** | the same | one piece per nation | — | fixed slots on an arc (§6.6) |
| **Moving army** | along its leg | — | slides with the transit arrow and the approved walk bob (0.4 s, 3 px) | visible enemies show their current leg only (approved) |
| **Hamlet and village** (population steps 1 to 3: 1 to 9 houses) | always | none | houses painted on the land at the seat, in the owner's kit, the approved counts on the approved spiral | roofs and walls in the kit; fresh roofs and ruins as approved |
| **Town** (step 4 or 5; or walls from PD 5, a fort, temple or lab; or a capital) | always | world-scaled: (0.16 + 0.045 × (step − 1)) D, capitals one step up; at least 18 px, at most 120 px on screen | the ring of walls by PD (palisade at 5, stone wall at 15, towers and gatehouse at 25; a watchtower from 1), houses inside on the approved spiral, the keep at the center with a fort, the temple and the lab as landmarks on the ring, scaffolding while building | rim in the banner, pewter for independents; the pennant on the tallest roof (approved) |
| **Independents' guards** | an unowned province's town or hamlet | inside the ring, or beside the hamlet | 1 to 4 pewter figures by the public strength word (weak 1, moderate 2, strong 3, fortress 4) | replaces v3's camps; the word is in the card |
| **Fort** | while built | — | a square stone keep at the ring's center in the owner's kit; a fort makes the seat a town piece at any population | the kit and the rim |
| **Temple** | while built | — | a landmark on the ring's edge in the kit (Cinder Horde: a fire temple with a brazier; Thornwood: a timber temple under a living roof); its brazier unlit under another nation's dominion (approved) | the kit |
| **Lab** | while built | — | a landmark on the ring's edge: a workshop tower with a chimney in the kit | the kit |
| **Wellspring** | always | 0.18 D, its own base | the monument: a basin with five drops in the five colors, glowing while unclaimed | rim #E9E4D8 until claimed, then the claimer's banner; claim stones (approved) |
| **Mana springs** | Near | — | the spring stones the view knows (approved) | — |
| **Battle marker** | 30 days after a battle | — | crossed blades planted in the ground beside a small cairn | opens the report card (approved) |
| **Siege, pillage, unrest** | while true | — | tents and a ram around the ring, cracked or breached walls; smoke; shutters and barricades (approved events) | — |
| **Land looks, pole motifs, landmarks** | Mid and Near | — | scenery pieces on the land, never on a base, at the approved counts | the dominating nation's or pole's |
| **Battle scars** | 90 days, then cairns to day 360 | — | churned ground in the bake, cairns as pieces (approved) | — |

### 6.3 Allegiance by the rim, never by hue alone

| Allegiance | Rim | Pennant |
|---|---|---|
| Own | a solid ring in the banner, 2.4 px | yes |
| Other nations | the banner ring notched: 8 even gaps of 30% (a crenellated ring) | yes |
| Independents | pewter #91A092, plain, no banner | no |

This carries docs/09's three shield shapes (rounded own, notched other, plain independent) onto the base. Every banner
reads on the dark base, Umbra's through a 1 px light keyline outside the rim (§4.7); the portraits' frames keep their
shapes (approved).

### 6.4 Sizes by zoom

| | Far (median province 50 px) | Start, 1280 × 720 (95 px) | Mid top (180 px) | Near (420 px) |
|---|---|---|---|---|
| Army base B_a | 22 px (0.44 D) | 22 px (0.23 D) | 34 px (0.19 D) | 34 px (0.08 D) |
| Town, step 4 | 18 px (minimum) | 28 px | 53 px | 120 px (maximum) |
| Capital | 19 px | 37 px | 69 px | 120 px |

Armies keep a near-constant screen size, as the references' do; towns belong to the land and scale with it, inside a
floor and a ceiling. At Far a province shows one army piece per nation (the approved Far rule).

### 6.5 Status by exception

One plaque, 12 px, on the front of the base, with one glyph from the approved list (starving, tight supply, unpaid,
besieging, casting, pillaging), only while true. A fed army that is moving or guarding shows none (approved). The
pretender's crown and the prophet's halo sit on the same plaque when no status claims it.

### 6.6 Zones

As v3 ruled (H10), zones are fixed per province, so armies never re-bake the land and never stand on a town: the seat
zone at the province's `center` (the town or hamlet), the token zone at `center` + (0.17 D, −0.06 D) with further
nations' slots on an arc around the seat, and the label zone under the seat. `layoutMapLabels` knows every box.

### 6.7 Where the figures come from

- **M1:** the battle's procedural figure atlas (the research's A5: vector parts baked per nation, every unit and custom
  pretender look from data), drawn at 2× in 64 px cells for the map; bases, rims, pennants and plaques are vector. Town
  pieces come from the approved kit parts, drawn as pieces.
- **M1-should:** owner-made painted figures for commanders and pretenders, and town kit pieces (§11). The research found
  painted cutouts read far better than procedural ones where counts are small and the eye lingers; a set replaces the
  procedural art only when complete, and the procedural art stays the fallback (docs/09 delivery rule).

---

## 7. Text and markers by zoom

| Band | Names on the land | About how many (Medium) |
|---|---|---|
| Far | capitals, Wellsprings, wild names | 10 to 14 |
| Mid | Far's, plus the hovered province, the selected one, the path's target and waypoints, and targeting labels (valid ritual targets with their predicted effect, approved) | 10 to 14 plus what the player points at |
| Near | every province name, at the foot of its seat; wild names curved along their massifs | all in view |
| Any band, Shift held alone | every name, and the numbers layer, while held | all |

- **Style:** the approved light-on-dark labels (Alegreya Sans, #F4EEDF with a dark halo; v3's ink-on-paper option goes
  with the paper); wild names italic and letter-spaced in #E9E4D8 (approved); 11 px floor at Mid ramping to 15 px at
  Near.
- **Setting:** Interface → Map labels: Clean (the default above) or All names (every name at Mid, v3's budget). Owner
  question 6.
- **The numbers layer** (`` ` ``, the # button, or Shift held): one chip per province with the active mode's value (PD in
  Ownership mode), and one count plate under each army piece (troops; the strength word where the view is fogged).
- **The hover card (L1)** keeps docs/07's order (the active mode's value, name, owner, terrain, population, supply,
  materials, unrest, springs, dominion, buildings, defenders) and adds the region's name as a dim footer line. An army's
  card leads with its commander's portrait at 48 px (approved), its squads and its count.
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
| Ownership bands | goes | inset lit-bead rails and the rim glow (§5); the band rule is restated for rails (§4.5) |
| Standing stamps: trees, humps, ridge peaks, reeds, rocks, with ink outlines | goes as stamps | trees become canopy texture, humps and peaks become relief, reeds and rocks become ground detail; live crowns at Near |
| Far relief masses | goes | relief is continuous at every zoom |
| Tracks between every neighbor pair | goes | they carried no rule and added a dotted line on every border at every zoom; the path preview shows routes |
| The dashed footpath on passable Mountains | goes | "snow only on wilds" (V8) separates passable from impassable |
| Place names at Mid | shrinks | Far and Mid show capitals, Wellsprings, wilds and what the player points at; every name at Near, with Shift, or with All names (§7) |
| Mid line 2: dominion chip and problem glyphs | moves | the Dominion mode and the numbers layer; problems to the alerts ribbon and the event pieces |
| PD plates, numbers chips | moves | the numbers layer (`` ` `` or Shift) |
| Army shield badges, count plates, ×n | goes | miniatures (§6); counts on hover, selection, the numbers layer and the engagement preview; stacks fan out on hover |
| The corner status glyph | shrinks | one plaque on the base, by exception (§6.5) |
| Standees at Near | becomes the piece | the figure stands on its base at every zoom |
| Region names | moves | the hover card's footer, and at Far while Shift is held |
| Hero set pieces and ruins | goes | history scenery that says nothing (v3's H7) and adds busyness |
| Mines and windmills | moves to Near | terrain-coded, redundant scenery |
| Brooks and ponds | stays, restyled | water inside one province (§3.6) |
| Bridges | goes | they marked tracks crossing brooks |
| Independent camps | goes | guards in the town by the same strength word (§6.2) |
| Mana spring stones | stays | Near only, as approved |
| The Wellspring illustration | stays | a monument on its own base |
| Capitals at Far | stays | the town piece, simplified at Far |
| Vignettes (sheep, deer, heron, goats, cows, hare) | goes | clutter on a model; a "Life" option later |
| Settlements and growth | stays | painted hamlets, town pieces from step 4 (§6.2) |
| Land-look washes | stays | ash 10% and moss 6% are measured states (§4.2) |
| Nation motifs, pole motifs, landmarks from strength 7 | stays | pieces on the land at Mid and Near |
| Event marks (siege, pillage, unrest, scars, rituals) | stays | pieces and bake marks |
| Wilds | stays | sculpted (§3.8) |
| Cloth margin: cartouche, compass rose, neatlines, wash overrun, tacks, hem | moves or goes | the plaque and the compass prop; the rest goes (§2.4) |
| Fog: line-art stamps, sketched hut | restyled | the dust sheet and a gesso hut (§9) |
| The path thread with square brass tacks | stays | approved |
| Transit arrows, battle markers, selection rings | stays | as pieces and ground rings |
| Lettering: ink on paper, region names in spaced capitals | goes | the approved light-on-dark labels; curved wild names stay at Near |
| "Try your art" in the mockup | stays | for the new owner sheets (§11) |

---

## 9. Fog and map modes

### 9.1 Fog: the rules stay, the look changes

| State | What it shows (docs/07, unchanged) | How it looks (v4) |
|---|---|---|
| Unexplored | the terrain; a dotted border; one hut at the seat (population unknown); no land look | **the dust sheet:** the model's albedo with its relief at half amplitude and no painted detail (no canopy stipple, parcels, pools or water), under the approved 4% haze in the model's gesso (#E8DCC2); one unpainted gesso hut (#D8D0C0) at the seat, no base; dotted rails and hairlines |
| Explored, out of sight | painted but faded; the settlement as the view allows; armies only where the nation sees | the bake desaturated 10% toward equal-lightness grey (approved), the land-look wash hidden, the town at its last-seen state, rails dotted |
| Wilds | never fogged | unchanged |

- **The hem:** along a border between explored and unexplored land, the unexplored side's haze rises to 12% at the
  border and falls to the 4% interior over 0.05 D, so the dust sheet has a visible edge. Like the glow, it lies inside
  the band that leaves at least 72.7% of every province untouched; the core keeps the measured 4%.
- The metaphor moves from "not yet painted" on a cloth to "not yet painted" on a model: the sculpt is there, the paint
  is not. Terrain stays readable because the albedo and the relief are the terrain (v3 needed line art for that).
- Every look is computed from the same `provinceView(state, viewer, id)` the card uses (approved fog guard). The haze and
  desaturation are live in the composite shader from a 256 × 1 visibility palette, so a visibility change re-bakes
  nothing (v3's H10, option a).
- The states are the approved ones, so the palette test's fog states carry over unchanged (§4.2).

### 9.2 Map modes: the mechanism stays

- In every mode but Ownership, the ground detail, the canopy, water and scenery pieces fade out (R23); each province
  shows `MODE_BASE[terrain]` (the approved bases, frozen: the approved fills desaturated 80% and lifted to L\* 50 or
  lighter) shaded by the hillshade at half amplitude, still mean-neutral, and the mode tints it. The relief therefore
  stays readable as a grey model under the data.
- The glow is off; rails, hairlines, wild contours, miniatures, labels and each mode's second channel (wheat glyphs,
  hatch density, candle numbers, spring symbols) keep full contrast.
- Because the bases and the data ramp are frozen, R16 (every M1 mode color 20 / 12 from both wild grounds) holds
  unchanged. The new albedos never share the screen with a mode color; §4.8 gives their distance anyway.
- Contextual modes (move targeting hatches unreachable provinces; ritual targeting outlines, dims and labels) are drawn
  by the composite shader and the label layer, unchanged in meaning. The 45° hatch stays reserved for them.
- The model's cliff, plinth and the table are never tinted by a mode.

---

## 10. Performance and the bake

### 10.1 The pipeline (once per game, behind "Preparing the map")

| Step | Where | What | Measured or estimated (research) |
|---|---|---|---|
| 1 | CPU worker | province-id raster from mapgen's polygons; wild cells; the land mask | 390 ms at 2048 × 1280 under load |
| 2 | CPU worker | the warped terrain lookup and weights at half resolution; pure-core mask; nearest-edge distance and across-id (for the glow) | about 520 ms at 2048 (warp and blur) plus 255 ms (distance) |
| 3 | CPU worker | lakes, ponds and stream polylines at quarter resolution; tree positions per chunk | 220 ms at 2048 |
| 4 | GPU pass | heightfield (fBm, ridged, wild domes), height packed into 16 bits | 1 to 3 ms on a laptop iGPU, 5 to 15 ms on a phone (estimate); 381 ms in SwiftShader |
| 5 | GPU pass | hillshade, cast shadows, valleys; the per-province shading means come back as a 512 × 320 read-back and return as a 256 × 1 offset palette | 101 ms in SwiftShader; the read-back about 1 ms |
| 6 | GPU pass | composite: blended albedos + ΔL + detail + water + wilds + canopy → the bake, with mips | a few ms on a GPU (estimate) |
| 7 | — | cache the bake in IndexedDB, keyed `relief:${BAKE_VERSION}:${seed}:${size}:${nations}:${res}`; upload from typed arrays | typed-array upload 47 ms at 2048 (a canvas upload was 2,308 ms) |

- Steps 1 to 3 are the CPU reference that Node tests run (V13). A CPU-only fallback runs steps 4 to 6 in the worker too
  (1.3 s at 1024 and 3.3 s at 2048 measured under load): acceptable behind the loading step on desktop, used on phones at
  1024 only.
- **Re-bakes:** none for ownership, fog, hover, selection or modes (all live). The bake changes only for the ground
  marks of slow looks (battle scars), which repaint a province's dirty rectangle within the approved 3 ms-per-frame
  stagger and 600 ms cross-fade.

### 10.2 Every frame

| Item | Budget |
|---|---|
| Composite: the bake, the id and edge texture, the owner, visibility and mode palettes, hover and selection uniforms | 1 draw; 0.2 ms CPU (measured); about 5 Mtexel at 1600 × 1000: under 0.5 ms on a laptop iGPU, 1 to 2 ms on a phone (estimate) |
| Rails and hairlines | a line mesh, 1 to 2 draws, rebuilt on a zoom change |
| Miniatures | one atlas (2048 × 1024), a few hundred Sprites sorted by y, 1 to 2 draws |
| Near crowns | one `ParticleContainer` per visible chunk, at most 20,000 crowns on screen, Near only (live everywhere would cost 1.2 to 2.4 ms CPU) |
| Labels and number chips | `BitmapText`, 1 to 2 draws |
| Ownership change | one texel of the 256 × 1 owner palette |
| Total for the map | at most 12 draws (v3's budget was 15) |
| Frame | docs/06's 60 fps at 1080p with all provinces and 100 army markers, with Table Full; the Playwright performance smoke on `src/render/**` (approved) |

### 10.3 Resolution and memory

| | Desktop (`MAX_TEXTURE_SIZE` ≥ 8192) | Phone and fallback |
|---|---|---|
| The bake | 4096 × 2560, 53 MB with mips; 1.6 px per texel at Near on a 1600 px screen (sharp) | 2048 × 1280, 13 MB with mips, plus the detail tiles for grain at Near |
| Id and edge texture | RGBA8 at 2048 × 1280, 10 MB | the same |
| Detail tiles | four 512² tiles, 4 MB | the same |
| Miniature atlas | 2048 × 1024, 8 MB | the same |
| Table layers | the war table's (at most 16 MB) | the same |
| Total | about 91 MB, within the approved 96 MB at DPR 2 | about 51 MB |

A 4096 bake is never required: 4096 is a common phone texture limit.

### 10.4 Settings

Interface → Map detail: Full (default) or Reduced (no live crowns, no cast shadows, detail tiles off). Reduced never
removes information: rails, glow, miniatures, settlements, walls, land looks, event pieces and wilds stay, as approved.
Context loss rebuilds every layer from the cache or the seed (approved).

---

## 11. Owner-made art

### 11.1 What can be an image

| Sheet | Used for | Procedural fallback | How it is recolored |
|---|---|---|---|
| G1 to G6, ground detail tiles: grass, tilled fields, forest canopy from above, rock and scree, cracked earth, marsh reeds and pools | the Near detail texture, lightness only | seeded noise detail (§3.4) | converted to luminance and mean-normalized; only a lightness change reaches the map, so the albedos and every rule hold |
| C1, cliff strata | the model's cliff face and wild crags | procedural strata | luminance into the face's tones |
| F1, commander and pretender figures (one per commander type and pretender body) | army pieces | the procedural figure atlas | none: the owner shows on the base rim and the pennant, so a figure needs no nation colors |
| K1 to K3, town kits (Cinder Horde, Thornwood, independents): houses, palisade, stone wall, towers and gatehouse, keep, temple, lab, ruin, scaffolding | town pieces and painted hamlets | the approved procedural kit parts | none; each kit is measured against the base and the land (kit tones keep 3:1 on the dark base) |
| W1, the Wellspring monument | the Wellspring piece | procedural | the five drops are recolored to the five mana primaries |
| P1, the brass plaque and the brass compass | the table | procedural | none |

### 11.2 Rules for these images

- A kind is used only as a complete set; the procedural art is always the fallback (docs/09 delivery rule).
- Every image goes through `scripts/art-intake.ts` (new kinds `map/tile`, `map/figure`, `map/kit`), with a provenance
  sidecar; masters stay in `art-source/`.
- Tiles must tile seamlessly and carry no light direction; figures and kit pieces are lit from the upper left, seen from
  40° above the ground, facing the lower right, on a flat key color, and keyed with a 1 px alpha erosion (research A5).
- **Budget:** the 2 MB raster budget is already passed by the approved portraits (2.9 MB in `src/assets/raster/
  portraits`, 274 files). Map art adds about 0.5 MB (four 512² WebP tiles at about 60 KB, figures at 64 px cells). The
  budget needs the owner's decision before any map raster lands (owner question 8).
- The research's one test showed the image model ignored the asked camera angle on a sprite sheet. The figure prompts
  below therefore ask for one piece per image, and every piece prompt passes a camera reference image (a gray-box base and cylinder at 40°, made
  procedurally) as the first reference; this is untested.

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
> axe, ash-grey skin, a soot-dark cloak], standing on a plain round black base whose edge is left unpainted. Seen from
> 40 degrees above the ground, three-quarter view, facing the lower right of the image, full figure, centered, about 70%
> of the image height. Idle stance, weapon lowered. Lit from the upper left. Flat solid magenta background (#FF00FF),
> no shadow on the background. Match the camera of the reference image.

**K1 to K3, a town kit sheet (one per nation):**
> A set of separate painted miniature buildings for a fortified village, each standing alone with space around it on a
> flat solid magenta background: [for the Cinder Horde: three small houses with soot-black roofs and ash-grey walls
> with ember-orange windows, a wooden palisade segment, a dark stone wall segment, a squat stone tower, a gatehouse, a
> square keep, a fire temple with a brazier, a sorcerer's workshop with a chimney]. Every piece seen from 40 degrees
> above the ground, lit from the upper left, no bases, no people, no text.

**W1, the Wellspring:**
> One painted tabletop miniature of an ancient stone spring basin on a round black base: a low circular basin of pale
> worn stone with five carved spouts around its rim, still water inside glowing faintly, moss in the joints. Seen from
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
| Map states | adds the rim glow, the hover and selection tints, and renames the unexplored haze "gesso" (same #E8DCC2, same 4%) |
| Icons, Map row | "army badge shapes: rounded shield (own), notched shield (other nations), plain shield (independents)" becomes "army base rims: solid (own), notched (other nations), plain pewter (independents)"; the status glyphs move to the base plaque |
| UI chrome | unchanged |
| The war table | the cloth becomes the model (below); props gain the brass compass; "Light falls on the room and the oak only" adds "and on the model only the map's one daylight" |
| The painted map | becomes **The relief map** (below) |
| Impassable terrain | adds: peaks are raised above all passable ground with crags on their south faces; meres are sunk below their banks; colors, contour, rim and names unchanged |
| Growth and alignment on the map | "Settlements grow..." adds: "hamlets and villages are painted on the land; from population step 4, walls from PD 5, a fort, temple or lab, or a capital, the seat is a town piece on a round base"; land looks keep their wash caps and become pieces at Mid and Near |
| Animation | unchanged (no idle on the map; the walk bob stays) |
| Delivery rule | adds the map kinds (`map/tile`, `map/figure`, `map/kit`) and the raster budget decision (owner question 8) |

**Terrain paragraph (replacement):**

> Terrain albedos: Plains #78894A, Farmland #D5B16B, Forest #1A3819, Hills #6D5303, Mountains #859BB8, Swamp #38616D,
> Wasteland #877773. The map is a carved terrain model on an oak war table (see "The war table"), lit by one neutral
> daylight from the upper left (azimuth 315°, elevation 40°). Its shading is mean-neutral over each province, so a
> province averages to within CIEDE2000 2.0 of its albedo and the colors tested below are the colors a province shows.
> Relief and ground detail change lightness only, at most the terrain's swing (p95: Plains 4, Farmland 4, Forest 6,
> Hills 9, Mountains 16, Swamp 3, Wasteland 6 L\*). Water inside a province is #50AF9B. No grade, vignette, season tint
> or time of day falls on the model.

**Distinct colors (added sentences):**

> Relief moves single pixels: at ±0.4 of the swing every pair of different terrains in every map state keeps 17 / 10.
> No albedo's lit relief comes within 20 / 12 of snow #F2EEE6, which only peaks wear. Water is 20 / 12 from every albedo
> and both wild grounds.

**Ownership rails (replacement for "Ownership bands"):**

> A rail is a lit bead: 1.5 px of the banner between a light keyline #F4EEDF on the side facing the light and a dark
> keyline #1C1A17 on the other. Where owners differ, each owned side has one, 1 px inside the border; inside a realm one
> rail is centered on the border. A rail reads on its ground if the banner differs from the ground, or either keyline
> differs from both, at the minimums above, on every relief extreme, under the owner's glow, half-blended with any
> neighbor terrain and in every map state; `tests/content/palette.test.ts` checks all banners. A soft glow of the banner
> runs inside realm edges, at most 35% at the border, gone at 0.05 of the median province diameter. The hovered
> province takes 25% of its owner's banner and the selected one 30%. No tint covers whole provinces otherwise: 4%
> already breaks the distinct-colors rule between owners.

**The war table (changed sentences):**

> The scene, seen straight from above in one projection: the map is a carved and painted terrain model on an oiled,
> quarter-sawn white oak table in a village tavern. The camera never tilts; depth is painted: one light shades the
> relief, pieces stand upright, and the model's south faces show as rock cliffs 24 units tall above a 3-unit plinth of
> dark oak, casting a soft shadow to the lower right. The map's name is on a brass plaque on the south face; a brass
> compass lies in the table's upper-right margin.

**The relief map (replacement for "The painted map"):**

> - **Layers.** A bake per game (albedos through a seeded lookup warp of at most 0.10 D, relief, ground detail, water,
>   wilds, canopy), a live composite pass (glow, hover and selection tints, fog, modes), vector rails, miniatures,
>   labels.
> - **One terrain per province:** at least 80% of every province is painted in its own terrain.
> - **Level of detail:** Far, Mid and Near show the land, rails and pieces at every zoom; Near adds live tree crowns,
>   detail tiles, spring stones, mines and windmills. Information is one gesture away: the hover card, the numbers
>   layer, Shift.
> - **Modes:** in every mode but Ownership the ground detail and scenery fade and the mode tints the frozen mode base,
>   shaded at half relief.
> - **Fog:** unexplored land is the model under a dust sheet: its albedo at half relief with no painted detail, a 4%
>   gesso haze, a hut at the seat, dotted rails. Land out of sight is the bake desaturated 10%.
> - **Miniatures:** armies are painted figures on round dark bases whose rim shows allegiance; towns are walled rings on
>   bases; nothing numeric stands on the land.

### 12.2 `docs/07-ui.md`

| Section | Change |
|---|---|
| Principles 1 | L0 lists "map labels, miniatures" instead of "map labels, badges" |
| Game screen layout | owner question 5: the right dock starts collapsed to its 48 px rail at every width (docs/07 already defines the rail); sizes otherwise unchanged |
| Map → Drawing | replaced by §2, §3 and §5 of this design in brief: the model on the table, the bake, rails and glow, pieces; the draw order becomes room, table, props, the model's shadow and cliff, the bake, the composite, rails and wild contours, path preview, pieces (y-sorted), labels and chips, ambience over the room and oak only |
| Modes | "the decoration layer" becomes "ground detail, canopy, water and scenery pieces"; the rest unchanged |
| Labels and the density budget | replaced by §7 (budgets per band, Shift, the numbers layer, the Map labels setting); "Information never thins" becomes "information is one gesture away" |
| Army badges | becomes **Army miniatures**: §6.2, §6.3 and §6.5; stacks fan out on hover as before |
| Moving | unchanged (the path thread and tacks, the cursor label) |
| Province tooltip | adds the region's name as a dim footer line |
| Fog | the look of §9.1; the rules unchanged |
| The table and the camera | "the cloth" becomes "the model"; the fit includes its south cliff and plaque |
| Keyboard | Shift held alone also shows every name while held |
| Settings | Interface → Map labels: Clean (default) or All names; Map detail Reduced as §10.4 |

### 12.3 Other docs and content

- **`src/content/terrain.ts`:** the seven `fill` values become the albedos (the field keeps its name; docs call it the
  albedo).
- **`docs/09-balance.md` "Map presentation":** new rows dated at adoption for the albedos, water, the warp (0.10 D),
  relief bases and amplitudes (§3.2), swings (§3.3), the glow (0.35, 0.05 D, 4 px floor), hover 0.25 and selection
  0.30, rail widths, the cliff (24 units) and plinth (3), the token sizes (§6.4), the town threshold (step 4, PD 5), the
  label budgets, and the bake resolutions. The rows for stamp caps, the footpath and the land-motif slot shares are
  marked superseded where §8 drops them.
- **`docs/10-milestone-1.md`:** Phase 8 and Phase 11 bullets per §14; acceptance criterion 14's icon list keeps its
  glyphs (the plaque uses them).
- **`docs/06-architecture.md`:** `render/map/` gains `reliefBake` (worker plus GPU passes, cache), `composite` (one
  shader), `rails` (line mesh), `pieces` (atlas, y-sort, zones); the CPU reference lives in `src/present/map/` (pure,
  Node-tested), never in `src/sim` or `src/mapgen`.
- **`docs/design/visual-references.owner-direction.md`:** a pointer to this design once adopted.

---

## 13. Tests

| Test | Checks |
|---|---|
| `tests/content/palette.test.ts` (extended) | the albedos at 20 / 12 (the existing test, new values); every pair in any two approved states; both wild grounds against every albedo state; the relief floor at ±0.4 A at 17 / 10; snow against every albedo's lit relief; lit-bead rails for **all 11 banners** on the 210 grounds per terrain (§4.5), and their luminance contrast at 3:1 or more; water against every albedo and both grounds; banner rims on the base; the glow, hover and selection constants are the ones measured |
| `tests/present/map/terrainCover.test.ts` | the CPU lookup on Small, Medium and Large, 2 and 4 nations, seeds 1 to 5: every province at least 80% its own terrain; the glow core (beyond 0.05 D of every shared edge) at least 70% of every province; no lake, pond or stream pixel within 0.10 D of a border; no stream crosses a border; lakes at most 8% of a province |
| `tests/present/map/relief.test.ts` | the heightfield is a pure function (same map and seed, same hash); every wild-peak pixel above every passable pixel within 2 D; every mere surface below the land within 1 D; the CPU shading is mean-neutral per province (within ±0.5 L\* at 256 px across the map) |
| `tests/present/map/pieces.test.ts` | the town threshold (step 4, PD 5, a fort, temple or lab, a capital); base sizes within their clamps; the rim by allegiance; at most one status plaque; pieces never overlap a seat zone; the shape-family table (H6) covers every piece |
| `tests/ui/derive/mapLabels.test.ts` (changed) | the budgets per band at the start zoom; no overlaps among labels, piece boxes and seat zones at every band; at Near, at least 90% of provinces in view keep a name |
| Fog guard (approved) | every map look comes from `provinceView`; changing hidden state leaves the bake, the composite inputs and the pieces unchanged |
| Browser smoke (Playwright, `src/render/**`) | the GPU bake against the CPU reference at 1024: every province's mean within ΔE 1.0; the frame budget of §10.2 |

---

## 14. Milestone placement

| Phase | What lands |
|---|---|
| Phase 8: Map rendering and core UI | the CPU reference (lookup warp, cores, edge field, water placement); a CPU bake at 1024 in a worker (relief, shading, albedos, detail); the composite shader (glow, hover, selection, fog, modes); vector rails and hairlines; vector bases with a simple silhouette per archetype; labels by band; the model's cliff, plinth and shadow under Table Simple; the palette, cover and relief tests |
| Phase 9: Remaining UI | the numbers layer and Shift; the Map labels setting; the plaque and the compass prop with Table Full (approved timing) |
| Phase 10: Battle replay viewer | the procedural figure atlas (battle track); the map's army pieces switch to it |
| Phase 11: Art and animation | the GPU passes, the 2048 and 4096 bakes and the cache; cast shadows; live crowns at Near; procedural detail tiles; settlements, walls and landmarks as pieces in the kits; land-look and event pieces; owner art intake for the map kinds (M1-should) |
| Phase 12: Balance and polish | the performance smoke at budget; the owner's look at a real bake |

**M1:** everything above except the owner's raster sets. **M1-should:** owner figures, kits, tiles, the plaque art, the
tilt at Far if the owner wants it (question 2). **Later:** rivers with a crossing rule (question 3), chasms as a wild
kind, a "Life" option for animals.

---

## 15. Owner questions (defaults in bold; the build follows the defaults)

1. **The table:** **the model stands on the open oak, its cliffs on the wood** (§2.2), or a sand-table tray, a recess
   in the table whose dark floor shows around the model, as the references' void does.
2. **The camera:** **top-down with painted depth** (§2.5), or, after the bake exists, a gentle tilt only while leaning
   back past the start zoom (M1-should).
3. **Rivers between provinces:** **not in M1; for M2, a crossing rule** (entering across a river costs one more day; an
   attacker across a river fights at −1; bridges cross free), after which rivers run between provinces and bridges
   show the crossings. Decorative rivers between provinces now are not offered: they read as a rule the game does not
   have.
4. **The land colors:** **adopt the v4 albedos** (§4.1), which replace both the approved fills and the painted B toggle
   on the model; or keep the approved fills, which also pass the rule but are high-key (open land at L\* 81).
5. **The right dock:** **starts collapsed to its 48 px rail** (Outliner and Feed one click away; the choice persists),
   or open as approved.
6. **Names at Mid:** **Clean** (capitals, Wellsprings, wilds and what the player points at), or All names.
7. **Region names:** **in the hover card's footer and at Far while Shift is held**, or dropped.
8. **The raster budget:** the approved portraits already take 2.9 MB of the 2 MB budget; map art adds about 0.5 MB.
   **Raise the budget to 4 MB**, checked against acceptance criterion 1's 5 MB bundle, or keep 2 MB and load portrait
   sets on demand.
9. **Animals on the land** (v3's vignettes): **later, as an option**, or never.

---

## 16. Risks and what was not verified

1. **It will still look more like a patchwork than the references.** Their land is mostly grass and forest; ours has
   seven terrains at mapgen's shares that must stay 20 / 12 apart for color-blind players. The warp, the continuous
   relief, the low chroma and the absence of stamps, tracks and chips bring the busyness to the references' level by
   the coarse measure (11.7% against 11.4%), but province-sized patches of distinct color remain. A more uniform land
   needs a looser rule, which needs a measured recognizer (palette-ab found texture statistics identify terrain only
   48% of the time); not offered.
2. **The preview is a schematic.** No bake was built in Pixi; the GPU path, the detail tiles, cast shadows, live
   crowns and the real miniatures are unbuilt. The research's bench measured a close pipeline (`research-tech.md` (b)).
3. **Thin margins:** every pair in every state 20.2 / 12.2; granite against forest 20.06 / 12.30; snow against lit
   mountains 20.1; the relief floor 17.12 / 10.05. Any change to an albedo, a state cap, a banner or an amplitude must
   re-run `calc/report.ts` and `calc/floor.ts`.
4. **Data modes** sit closer to the albedos than to the approved fills (5.6 / 0.8 against 7.2 / 2.2); they never share
   the screen; palette-ab's ramp fix applies if wanted.
5. **Fog is quieter than v3's line art.** Unexplored land differs by its missing detail, its dotted rails, the hem and
   the gesso hut; 4% is the strongest haze the rule allows. A playtest should confirm it reads.
6. **Taste:** mountains are a cool slate whose lit faces reach L\* 79; hills are a saturated umber (OKLCH C 0.092);
   water is a light jade (L\* 65.5), lighter than the references' teal, because darker water collides with swamp,
   hills or forest under a deficiency.
7. **The painted figures' camera** is untested: the research's one sheet ignored the asked angle; the prompts add a
   camera reference image, unproven.
8. **The thin-line floor** (3.87:1) assumes both keylines render at 0.75 px with antialiasing; at UI scale under 100%
   they may blur into the banner. The lit bead should be checked on a real screen at 1280 × 720.
9. **Not run:** the game, the repo's tests (nothing in the repo changed), any phone, and the owner's eye.

---

## Appendix: files

Under `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/`:

- `map-design.md`: this file.
- `mapwork/calc/` (run from the repo root with `npx tsx`):
  - `colorMath.ts`, `colors.ts`: the repo's files, copied verbatim (diff-checked at 41779dd);
  - `lib.ts`: conversions, states, tints, relief variants;
  - `search.ts`: the albedo search; every run's palette and record in `runs/` (`r*`, `n1` to `n6`);
  - `report.ts` → `report-final.out`: every check of §4; `floor.ts`, `exact.ts`, `haze.ts`, `nudge.ts`, `dist.ts`;
  - `explore.ts`: whole-province tints on A and B; `coverage.ts`: core shares on 180 maps; `water.ts`, `water2.ts`;
  - `export-map.ts`, `export-many.ts`: mapgen maps for the preview (read-only use of `src/mapgen`);
  - `pal-final.json`: the albedos.
- `mapwork/preview/`: `preview.py` (the schematic preview and its metrics), `share.py` (own-terrain shares, 60 maps).
- `mapwork/out-final/`: `contact-sheet.png`, `mid.png`, `far.png`, `near.png`, `mid-fog.png`, `fog-crop.png`,
  `mid-deutan.png`, `near-deutan.png`, `albedos.png`, `metrics.json`.
- `mapwork/map-s3.json`, `mapwork/maps60.json`: the exported maps.
- Earlier runs kept for the record: `mapwork/out-r3s4/`, `out-n1s14/`, `out-cand/` (palettes rejected for violet
  mountains, icy mountains and an unproven floor).
