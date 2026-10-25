## 3. More map detail: the painted cloth

### 3.1 Three layers, and the draw order

The staged docs/07 draw order stays and is extended: the map's static art is split into three
layers, so a mode switch only changes alpha and tint (R31).

1. **Cloth** (T5, section 2).
2. **Fill layer** (live: one batch of province `Graphics`): the terrain fill with docs/09's 10%
   noise multiply; in Ownership mode, the land-look wash of provinces in sight (4.3); in a data
   mode, the mode's fill instead (3.9).
3. **Decoration layer** (baked per zoom band; Ownership mode only, faded out over 150 ms in any
   other mode, instantly under reduced motion): ground textures, standing terrain stamps,
   settlements and landmarks, land-look and pole motifs, battle scars, unrest marks, and the fog
   line art.
4. **Always-on layer** (live; every mode, every band): wilds (ground, stamps, contour, rim);
   the 2 px borders (dotted under fog); ownership bands with keylines and the nation sigil on the
   band corner; ritual marks (`mapMarks`, pretender C.4); siege camps and wall states; pillage
   smoke; the Wellspring monument and its claim state.
5. Mode overlays (move-targeting hatch, the ritual hop outline).
6. Labels (province names, wild names, the second line).
7. Numbers-layer chips.
8. Path previews.
9. Army tokens (and standees at Near, M1-should).
10. Transit arrows and ETA labels.
11. Selection rings.
12. Battle markers.

The province tooltip and the cursor label stay DOM overlays placed from Pixi coordinates. T6
ambience never draws over the cloth.

### 3.2 Two classes of detail, per terrain

- **Ground textures** are flat lightness changes within ±8% L\* of the fill (±10% for
  Wasteland's cracks), symmetric so a province's mean color stays its fill. Inside label, badge
  and seat boxes they drop to ±4%. At Far each terrain uses one seamless pattern in global
  texture space.
- **Standing stamps** are small drawings that stand up from the ground: trees, humps, peaks,
  reeds, rocks, houses, motifs.
  - Faces are the fill lightened 12% L\* and darkened 18% L\*, with a 1 px ink outline
    (#1C1A17 at 70%), so they read as painted texture and never as a new color.
  - They never sit inside a label, badge or seat box from `layoutMapLabels` (plus 4 px), stay
    inset from the border by the band width plus 3 px, and draw by their bottom edge, so nearer
    stamps cover the feet of those behind.
  - They cover at most 60% of a province at Mid and 75% at Near.

| Terrain (fill) | Ground texture | Standing stamps | Far mass | Mid | Near |
|---|---|---|---|---|---|
| Plains #C1D29F | grass stipple; 1 or 2 short hedgerow lines | grass tufts, lone trees, a haystack | 2 tuft clusters | 10 | 20 |
| Farmland #EEBA3A | a patchwork of 5 to 9 field polygons (a seeded Voronoi inside the cell), each ±6% L\*, furrows at 0°, 90° or ±30° (never 45°), hedges between | haystacks, a windmill | 2 field blocks | 4 | 8 |
| Forest #374C2B | a canopy scallop (arcs of crowns) | tree crowns in two tones, in clumps; "half trees" at the inset edge with their bottom outline dropped | 4 canopy clumps | 30 | 60 |
| Hills #856824 | hachure arcs on the shadow side (lower right) | rounded humps with slope strokes | 3 humps | 6 | 10 |
| Mountains #8DA4AD (passable) | scree stipple | small snowless peaks; the dashed footpath (1.10) | 3 peaks | 5 | 8 |
| Swamp #1A727A | short staggered water streaks and pools (#2C8C94) | reed tufts, dead snags | 3 reed clusters | 12 | 22 |
| Wasteland #AE897F | a crack network (edges of a fine seeded Voronoi) | rocks, a bleached skull, dry shrubs | 2 rock clusters | 8 | 14 |

Counts are per average province (6400 units²) and scale with area. The Far masses are also the
fog silhouettes (3.10), so every terrain has one.

**No texture is a reserved pattern.** A content test (`tests/content/presentation.test.ts`)
measures every texture's strokes: no more than 10% of the stroke length within 10° of 45°; no
two perpendicular angle bins each above 30% (a cross-hatch); and no single angle bin above 60%
with strokes spanning more than half the province (a uniform hatch). Those patterns belong to
states (docs/09: unreachable, starving, unrest steps, fog).

**Placement** (`scatterProvince`, pure, `src/present/map/scatter.ts`):
- **Slots:** `poissonDisc` (from `src/mapgen/voronoi.ts`) on the inset cell, with a radius per
  terrain (0.09 √area for Forest up to 0.2 for Plains), on
  `streamFor(\`map:${seed}:${provinceId}\`, layer)`. Slots are computed once per map and cached.
- **Ranks:** each slot gets a seeded rank. Far shows the lowest ranks, Mid more, Near all, so
  zooming in only adds stamps and none moves.
- **Order of use:** slots are sorted by distance from the seat. Dominion motifs replace terrain
  stamps in the slots nearest the seat; pole motifs replace them in the outermost slots (4.3).
  Growth changes what stands in a slot, never where.
- **Shared vocabulary:** tufts, rocks, reeds, dead trees, crop rows and the windmill are the
  battle backdrops' props (`docs/12-battle-presentation.md` S4.4), so a province looks like its
  battlefield.

### 3.3 Borders

- Straight ink lines: 2 px #2B2620 with a seeded alpha between 0.85 and 1.0 along the stroke,
  and a 3 px inner pigment edge (black at 12%), a watercolor pooling cue. A border is a survey
  line: the geometry is the rule.
- Dotted under fog (staged). Along a wild, the wild's 3 px contour replaces the border (1.10).
- Painted noisy edges are Later, and only with hit tests on the same noisy polygon.

### 3.4 Ownership

- Bands are unchanged: a flat banner strip on the inner border with a `keylineFor` keyline, drawn
  above stamps and settlements, with the nation's sigil (pretender B.7) on the band corner in
  Ownership mode (staged spec 2.10.2).
- A banner pennant flies from the seat's tallest roof in the owner's banner; it changes the day
  the province changes hands.
- The settlement is built in the owner's kit (4.2), so ownership shows twice, as a band and as
  architecture, and neither relies on hue alone.

### 3.5 Labels

- The staged rules stay: names in Alegreya Sans with a dark halo, the Mid budget of 96 × 30 px
  and 2 lines, culling by priority.
- Wild names follow 1.10. Culling priority becomes: capitals, Wellsprings, wild names, own
  provinces, the rest.
- **The label test grows** (`tests/ui/derive/mapLabels.test.ts`, Medium seeds 1 to 5, the start
  zoom on 1280×720 and one Near zoom): no two visible boxes overlap among province labels, wild
  labels, token boxes and standee boxes; no standing stamp, house, motif or landmark box
  intersects any label, token or seat box plus 4 px; at least 90% of provinces keep a visible
  name.

### 3.6 Army tokens

- **Tokens** keep the staged shapes and content (rounded shield own, notched shield other
  nations, plain shield independents; the count; at most one corner glyph by exception). The
  material changes:
  - nations' tokens are painted wood: a flat banner fill, a 1 px lighter top edge (the banner
    +12% L\*), a 1.5 px dark outline (#1C1A17 at 70%);
  - independents' tokens are pewter #91A092 (10 from the independents' grey #8C8A80, so
    material and faction agree);
  - a fixed contact shadow (an ellipse, #000 at 25%, 2 px down);
  - count plates stay flat and unlit, in tabular figures;
  - the pretender's token has a brass edge, the crown glyph and its aura motes (pretender C.5);
    the prophet's token carries the halo glyph;
  - the token's lower corner is reserved for the M2 artifact star (R10).
- **Standees** (M1-should, Phase 11, after the battle rigs land in Phase 10): at Near, the lead
  commander's rig in its idle pose, 40 px tall and never taller than 46 px, stands on the token.
  The badge box grows by the standee's height, and `layoutMapLabels` knows it. An unscouted
  independent force stands as a cloaked figure, with its strength word on the plate; a scout
  turns it round. Map detail Reduced keeps tokens only. No idle bob on the map; docs/09's walk
  bob stays and reduced motion removes it.
- **Path previews** become a light thread (3 px #F4EEDF with a 1 px #1C1A17 edge, dashed 8 / 6)
  with square brass tacks (6 px #B8914A, set as diamonds, dark outline) at each day mark and the
  day on a flat plate. Never round, so a step cannot be read as a mana symbol or a spring.

### 3.7 Level of detail by zoom

Decoration thins by band. Information never does (the staged rule).

| Layer | Far (under 70 px) | Mid (70 to 180) | Near (over 180) |
|---|---|---|---|
| Fills, bands, borders | yes | yes | yes |
| Ground textures | global patterns | per province | per province, full |
| Terrain stamps | 2 to 4 masses per province, every terrain | the Mid counts (≤ 30) | the Near counts (≤ 60) |
| Wilds | full (1.10) | full | full, with scree and reflections |
| Settlements | a keep glyph at forts, one roof cluster from tier 3 | every house of the tier, walls, landmarks | plus yard details (a well, a cart, garden plots) |
| Land-look wash | yes | yes | yes |
| Nation motifs | none | their share of the Mid slots | their share of the Near slots |
| Pole motifs | none | 1 per effective step | 2 per effective step |
| Information marks (siege, pillage, ritual, Wellspring claim) | yes | yes | yes |
| Battle scars, unrest marks | none | yes | yes |
| Tokens | one per nation per province (staged) | tokens | tokens, standees (should) |
| Labels | staged | staged | staged |

When the band changes, the decoration layer cross-fades over 150 ms (instant under reduced
motion).

### 3.8 Density budget and the bake

- **Caps:** at most 30 standing stamps per average province at Mid and 60 at Near; coverage at
  most 60% and 75%; settlements at most 22 houses plus 4 landmarks; motifs at most 30% of a
  province's slots.
- **Decoration bake:**
  - Far: 0.6 px per unit × device pixel ratio, the whole sheet in tiles of at most 2048² (about
    5 MB on Large with 4 nations at DPR 2).
  - Mid: 1.25 px per unit × DPR, the whole sheet in tiles of at most 2048² (about 10 MB on
    Medium and 22 MB on Large with 4 nations at DPR 2, J2). Within the band the bake is scaled,
    not redrawn.
  - Near: lazily, per 512² screen tile, with an LRU of 32 tiles (at most 32 MB at DPR 2). Never
    a whole-map Near bake.
- **Re-bakes:** a province's dirty rectangle (its bounds plus stamp overhang) re-bakes when its
  look key changes (4.7), staggered at most 3 ms per frame. A full Mid bake on Medium takes at
  most 150 ms, run behind the loading screen.
- **Live layers:** the fill layer (one batch), the always-on layer (wild stamps from one atlas;
  borders and bands as `Graphics`), labels (`BitmapText` for numbers), tokens (one atlas, at
  most 100 armies), paths, selection and effects.
- **Memory:** table and map together within 96 MB on Large with 4 nations at DPR 2.

### 3.9 Map modes still read

- In every mode but Ownership the decoration layer fades out (R23). The mode tints a plain fill,
  exactly as the staged spec tested it.
- **The mode's base** is the terrain fill desaturated 80% and **lifted to L\* 50 or lighter** with
  linen: Forest #79786B (+33%), Hills #7E7767 (+12%), Swamp #6F7A77 (+19%); the lighter fills
  need no lift. Undominated provinces in Dominion mode show this base, never a flat grey.
- **Data ramps** (Supply, Unrest, Population) run #4C5E96, #8170AC, #C4808E, #E6AC6E, #F8E6A6
  (L\* 41 to 91; adjacent steps at least 13 apart for normal vision; each mode keeps its second
  channel).
- The always-on layer, labels, chips, tokens and the mode's second channel keep full contrast.
- Measured: every M1 mode color passes 20 / 12 directly against both wild grounds (R16).

### 3.10 Fog: "not yet painted"

What is shown stays as the staged spec rules. Only the look changes.
- **Unexplored:** the cartographer has not painted it yet.
  - The fill under a 4% linen haze, with no land look.
  - Terrain stamps and the Far masses drawn as **line art** with no fill: #3E3428 on Plains,
    Farmland, Mountains and Wasteland; #E8DCC2 on Forest, Hills and Swamp (at least 3.5:1 on
    each, `colors-extra.out`). Terrain still reads by shape, since terrain is public.
  - A dotted border.
  - No settlement detail: one sketched hut outline at the seat ("people live here, number
    unknown"). No motifs, scars or marks beyond what the tooltip shows.
- **Explored, out of sight:** painted but faded: the fill desaturated 10%, the wash hidden,
  stamps and motifs painted, the settlement as the view allows (population once explored), a
  dotted border. Armies show only where the nation sees.
- **Wilds** are never fogged.
- The fill changes are the largest that keep every terrain pair distinct in every combination of
  states and land looks (R18).
- **One projection.** Every map look is computed from the same `provinceView(state, viewer, id)`
  the tooltip and the modes use. The UI spec's fog guard test covers `mapLook` and portraits:
  changing hidden state leaves the output unchanged.

### 3.11 Palette and contrast tests (`tests/content/palette.test.ts`, extended)

1. Wild grounds against every terrain fill: 20 normal, 12 under each deficiency.
2. Wild grounds against every banner (all five colors' primaries, every `NATION_BANNERS` entry,
   the independents' colors): direct, or, by docs/09's band rule, the rim #E9E4D8 differs from
   both. Every M1 banner must pass directly.
3. Wild grounds against every map-mode color the renderer can produce, computed from content:
   dominion steps of every banner over every lifted base, the undominated bases, and each data
   ramp sampled at 21 points. M1 colors directly; W, U and B directly or by the rim. Ramps start
   at L\* 40 or lighter.
4. Every `LandLook`'s wash at `washMax`: every pair of different terrains, unwashed, washed by one
   nation, and washed by two different nations.
5. Fog and land looks together: every pair of different terrains in any two states (unexplored
   haze; in sight with any land look; out of sight desaturated with the wash hidden), and both
   wild grounds against every state.
6. WCAG: the rim on both grounds, ripples on water, the footpath on Mountains and the fog line
   art on each fill at 3:1 or more; wild labels on their grounds at 4.5:1 or more; every new
   chrome token at 4.5:1 for text it carries and 3:1 for keylines; every settlement kit has one
   tone at 3:1 or more on every fill.

---
