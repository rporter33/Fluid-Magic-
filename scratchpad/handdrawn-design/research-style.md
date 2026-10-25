# Research: what makes a painted map feel hand-made and rich

For the hand-drawn map pass. On 2026-10-22 the owner wrote (`owner-direction.md`, verbatim): "im working on the
art but i need the game map to be more interesting and detailed, a hand drawn feel - so far looking good", then
"i like final fantasy 14 and much concept art as insiration". This file studies Final Fantasy XIV's maps and
concept art, then other painted maps the owner is likely to know, and extracts principles Fluid Magic (FM) can
reuse. FM takes style principles only: never FFXIV's assets, map layouts, place names, symbols, logos, fonts or
characters, and prompts for owner-made images never name the franchise.

## Method and markers

- **Access.** As in the earlier tracks (`wartable-design/research-*.md`), WebFetch and curl reached only
  github.com and raw.githubusercontent.com. Every press, wiki, forum and publisher host failed (ENOTFOUND or proxy
  403). Game claims therefore come from search extracts, or from the author's knowledge of the games.
- **[V]** opened this session: GitHub-hosted code and data (SaintCoinach's FFXIV sheet definitions and map code,
  Azgaar's style presets and SVG filters, rough.js, perfect-freehand, MNPR, the Google Fonts repository).
- **[X]** a search-engine extract; the page was not opened. A lead, not a quote.
- **[K]** the author's general knowledge of a game or work, not sourced this session. Treat it as a description
  to check against the owner's own screenshots before building on it.
- **Obs** observed in FM's v2 screenshots (`ui-mockup/v2-*.png`). **→ FM** marks a recommendation.
- Keys such as F1 or A2 resolve to URLs in section 8.

---

## 0. Findings in brief

1. **Painted ground, crisp information.** FFXIV, Elden Ring and The Witcher 3 put soft, painterly terrain under
   sharp, flat UI icons and labels [K]. The richness lives in the ground; the instrument lives on top. FM's
   layering (decoration bake under an always-on layer, tokens, labels) already matches; the ground is what is thin.
2. **The paper is a layer, multiplied.** FFXIV builds each map image by multiplying a second texture over the
   painted base wherever that texture is not transparent (F1 [V]). Azgaar's parchment presets do the same with a
   paper image at 20% to 60% opacity (A2 [V]). Pigment over paper, never paper over pigment.
3. **Washes are uneven on purpose.** A flat fill reads as vector art. Watercolor reads through edge darkening,
   granulation, backruns, pigment separation and glazing (R4 [X]); procedurally through low-frequency noise in the
   wash's alpha (Azgaar's "splotch" filter, A3 [V]) or stacks of deformed, nearly transparent polygons (R5 [X]).
4. **One light, from the upper left.** Shaded relief and map trees take light from the upper left (north-west);
   a light from below makes relief look inverted (M2 [X]); tree shadows fall on the lower right, parallel (M1 [X]).
5. **Line has weight, wobble and gaps.** Coasts and borders heavy, interior marks light; ridges "implied by the
   absence of a line" (M1 [X]); seeded roughness and bowing (R1 [V]); tapered ends (R2 [V]); sepia ink, not black.
6. **Water is drawn, not filled.** Ripple lines cluster near the shore and thin out seaward (M1 [X]); Azgaar
   exposes reach, coastal gap and coastline bands as parameters (A1 [V]).
7. **Lettering carries the hand-made feel cheaply.** Region names in large, letter-spaced capitals; places in small
   mixed case; water in italic; names follow their feature (M3 [X], T1 [X]). Tolkien's printed maps put features
   in black and names in red (T1 [X]).
8. **Decoration lives in the margins and the empty places.** Cartouches hold title, scale and legend and frame
   the art without covering the geography (M4 [X]); Baynes framed Middle-earth with a figure border and ten place
   vignettes (T2 [X]); sea creatures moved from the map face into cartouches and margins over time (M4 [X]).
9. **Detail is staged by zoom.** CK3: a paper map on a table at far zoom, a political 3D map in the middle,
   terrain and county names close in (C1 [X]). FFXIV: world, region, area, with a name tier per level (F2 [V]).
10. **The unexplored is unpainted, not black.** Elden Ring shows blank parchment with faint paths until a
    fragment reveals an "artistic rendition" (E1 [X]); Civ VI's fog is old cartography with sketches, sea life and
    graticules (V1 [X]); FFXIV's map rows carry discovery fields (F2 [V]). FM's "not yet painted" fog fits the genre.
11. **FFXIV's art house style is line plus wash.** A drawn line with color washed over it, kept since Akihiko
    Yoshida's time (F4 [X]); its world map has been read as a medieval mappa mundi, with illustrations of what lives
    where (F6 [X]).
12. **Muted, warm-cool palettes.** Painted maps sit in desaturated earth tones on warm paper, with cool water and
    cool shadows [K]; Pillars of Eternity chose "a little more muted" palettes on purpose (P1 [X]). FM's fills are
    fixed by the distinct-colors rule, so the look must come from texture, line and paper, not from muting hue.

---

## 1. Final Fantasy XIV

### 1.1 The in-game maps (area, region, world)

**Verified structure** (SaintCoinach, the community's FFXIV data library, on GitHub):
- **The map image is two layers.** `BuildImage` loads `ui/map/{id}/{id}_m.tex` (the painted map) and, when present,
  a second texture `{id}m_m.tex`, and returns `MultiplyBlend(image, mask)`: each RGB channel is multiplied
  (`a*b/255`) wherever the second texture is not transparent; alpha is kept (F1 [V]). The game ships its map art
  as a painting plus a multiply layer.
- **A three-tier name hierarchy.** Each `Map` row has `PlaceName{Region}`, `PlaceName` and `PlaceName{Sub}`, plus
  `Hierarchy`, `SizeFactor` and `Offset{X,Y}` (F2 [V]): region, area and sub-area names exist as separate tiers.
- **Discovery.** `Map` rows carry `DiscoveryIndex`, `DiscoveryFlag` and `DiscoveryArrayByte` (F2 [V]), consistent
  with map areas revealing as the player explores [K].
- **Labels attach to icons.** A `MapMarker` row is `X, Y, Icon, PlaceName{Subtext}, SubtextOrientation, ...`
  (F3 [V]): a place name is an icon plus a caption whose side (left, right, above, below) is authored per marker.

**What the maps look like** [K] (check against the owner's screenshots):
- Top-down terrain painted from the zone's real shape: soft rendered relief lit from the upper left, painted over
  in naturalistic but softened color; no hard outlines on terrain, only on cliffs and shores.
- The painted zone sits on a warm paper tone; outside the walkable area the painting dissolves into that paper with
  a soft, irregular edge rather than a rectangle.
- Water is lighter and greener in the shallows, deeper toward the middle; shores carry a pale rim. Forests read as
  a dense canopy texture, not individual tree icons; roads and paths are pale, slightly wobbly ribbons; towns are
  small clusters of painted roofs.
- Information sits on top as crisp, flat, high-contrast icons (aetherytes, quests, exits) and small serif captions
  with a thin light halo. The painting never competes with them; it is lower in contrast than the icons.
- The world and region maps are painterly overviews: soft-edged landmasses, gently textured sea, large region names
  in spaced serif capitals. The world map is stylized, not to scale, because the game is built from separate zones
  (F9 [X]).

### 1.2 Concept art and the art books

- **Line plus wash.** A later FFXIV artist says the "line-drawing style has been around since Yoshida's time" and he
  keeps it; the article describes the look as "an elegantly sketched figure swathed in colour washes" (F4 [X]).
  Yoshida was the game's art director and main character designer (F10 [X]).
- **The books.** *The Art of Eorzea -Another Dawn-*: 300 pages of "concept designs, environment artwork, sketches"
  with production notes and artist comments (F7 [X]); described as "intricate medieval-inspired designs" drawing on
  "Art Nouveau to European fantasy" influences (F7 [X]). *The Art of Ishgard* volumes: "concept art and planning
  images", environments, and the team's process (F8 [X]). The Endwalker team names a dedicated background concept
  artist (F5 [X]).
- **What the environment paintings do** [K]: big value groups first (sky, far range, midground, near); strong
  atmospheric perspective; warm key light with cool, blue-violet shadows; architecture drawn as clean line then
  glazed; small figures and banners for scale; soft vignetting toward the edges.

### 1.3 The world map as a medieval map

An essay on FFXIV and medieval geography argues the world map parallels the medieval mappa mundi, drawing on "the
medieval perception of the world rather than historically accurate cartography"; that style places animals and
illustrations across the map "to indicate what can be found in different regions" (F6 [X]).

### 1.4 The map frame

[K] The map window is a thin, dark, low-ornament frame around the painting, with controls along its edge. The
ornament is in the map art, not the window. FM's approved oak, brass and leather chrome already plays this role.

### 1.5 What FM takes from FFXIV

1. Paint the ground; keep information crisp and on top (FM's draw order already separates them).
2. Paper as a multiply layer over the paint, and the painting dissolving into paper at its outer edge.
3. Line plus wash as the house style: an ink line, a transparent wash that does not quite fill it.
4. A name tier per zoom level, and captions authored relative to their icon.
5. One light from the upper left; warm light, cool shadow; distance and edges fade toward the paper tone.
6. Illustrated landmarks that say what lives where (the mappa mundi lesson), kept off the information.
Never: its map layouts, region shapes, names, icons, crystal or aetheryte symbols, logo lettering or UI frames.

---

## 2. The comparison set

**Dragon Age: Inquisition, the war table.** Operations appear "as markers on a worn map", some known only as
markers, reporting back after a set time (D1 [X]); advisors are sent to markers and reports collected (D2 [X]).
The art book collects work "from digital to watercolor paintings" (D3 [X]); the Inquisitor's Edition shipped a
22" × 32" cloth map of Thedas (D3 [X]). [K] The map is a large warm-brown sheet with illustrated mountains and
forests, worn edges and stains, under candlelight, with physical markers; the camera tilts over the table.
→ FM: closest precedent for FM's own frame (a sheet on a table, markers as objects); its lesson is wear and stain
on the sheet and markers that are props, not UI.

**The Witcher 3.** The art book calls its map "an artistic interpretation of the world, not a cartographic tracing"
(W1 [X]). [K] The in-game map is a top-down painting of the terrain under a sepia-leaning grade, with crisp icons;
its region overviews are illustrated. → FM: interpretation over survey; FM's Voronoi cells can be painted loosely
as long as the hit-tested geometry stays exact (staged rule, final.md 3.3).

**Elden Ring.** Without a fragment a region is "a blank piece of parchment with a few hints of paths"; a fragment
reveals an "artistic rendition" of the local geography (E1 [X], E2 [X]). [K] Ink linework in umber and sepia on a
toned sheet, light watercolor washes, cliffs as hatched bands, the great landmarks drawn as small illustrations,
icons crisp and few. → FM: the strongest model for "not yet painted" (faint lines on bare cloth) and for landmark
illustrations as the map's visual anchors.

**Pillars of Eternity I and II.** The team went back to late-1990s fantasy art; "the colour palettes are a little
more muted, less super colourful and intense" (P1 [X]). In Deadfire some places stay unmarked until the ship sails
near, and a cartographer questline lets the player chart and name islands (P2 [X]). [K] The world maps are ink and
wash on parchment with illustrated locations. → FM: muted, ink-led; discovery as the cartographer's act.

**Divinity: Original Sin 2.** The Divine Edition includes "a detailed Reaper's Coast map" and an art book (DS1
[X]); nothing opened describes the in-game map. Not used as evidence.

**Old World.** Extracts say little about its map art: the developers called antiquity "very colorful" and carried
that into the game; one critic called the graphics dated (O1 [X]). Not used as evidence.

**Crusader Kings III.** Three regimes: "when zoomed far out, the map will turn into an actual paper map", "shown as
an actual paper map on a table" with small ships and monsters; zoom in for the 3D map with the political overlay;
further in, realm colors give way to county names and terrain (C1 [X]). A later diary restyled terrain after
Chinese ink painting and Shan Shui and smoothed the transitions between zoom levels (C2 [X]). → FM: the paper map
is a zoom state, decorated with small scenes; transitions blend rather than pop.

**Civilization VI** (added: the closest analogue to FM's fog). Unexplored land is old cartography: "brown splotches
and sketches of the landscape" that melt away to reveal the live map, "sketches of ships and sea life as well as
latitude and longitude lines"; the lead designer wanted the map to matter more and cited early maps "with sea
dragons on the edge" (V1 [X]). Some fans disliked the stylization (V1 [X]).

**Tolkien, Christopher Tolkien, Pauline Baynes, Daniel Reeve.**
- Christopher Tolkien's maps: features in black, names in red; regions in Roman capitals "of varying size and
  thickness", small places "in tiny lowercase letters" (T1 [X]).
- Thrór's map: East at the top, compass points in runes, mountains, rivers and a dragon, in blue and red ink, with
  hidden moon-letters (T4 [X]).
- Baynes's 1970 *A Map of Middle-earth*: a colour map with a header and footer of characters and ten vignettes of
  places ("The doors of Durin", "Hobbiton", "The Argonath"); Tolkien wrote that "these pictures agree remarkably
  with my own vision" (T2 [X], T3 [X]).
- Reeve, the films' calligrapher and mapmaker, gave each culture its own hand and each character distinct
  handwriting (T5 [X]).
- [K] Mountains drawn in side profile in overlapping rows, shaded on one side; forests as massed scalloped crowns
  with a firm outer edge; rivers as single lines thickening downstream; a plain double-rule neatline.
→ FM: two inks (features in umber, names in a red or dark ink), a strict lettering hierarchy, vignettes and figure
borders on the cloth margin, profile mountains.

**Azgaar's Fantasy Map Generator** (the procedural benchmark; style presets opened, A2 [V]). The "Cinderwood" preset
("warm parchment, illustrated relief and settlement icons", A1 [V]) is a concrete recipe:
- paper texture at opacity 0.2 through a sepia color matrix; a vignette #2f2418 at 0.55, inset 1.5% to 2%, blurred
  20 px; landmass #cfc7af; sea #77705e with a wave pattern at 0.9 and four coastline bands;
- relief in the "illustrated" set, stroke #6d5a3d; rivers #8a9084;
- state borders dashed `3 1.2 0.5 1.2` at 0.5 width and 0.7 opacity; province borders dotted `1 2`;
- state fills at opacity 0.2 through the "splotch" filter: `feTurbulence` fractal noise (base frequency 0.01, 4
  octaves) turned into an alpha mask (alpha = 1.2 − 0.9·noise) so the wash is uneven (A3 [V]);
- all labels Cinzel, weight 900, uppercase, red-brown #8a2e28 with a thin paper-colored stroke #d3c9ae; state names
  letter-spaced 1.2, province names 0.3, towns 0.1 (A2 [V]).
The "Ancient" preset sets the paper at 0.6 and uses UnifrakturMaguntia for capitals; "Watercolor" pairs Comfortaa
with the handwriting face Gloria Hallelujah for regions (A2 [V]). Azgaar also offers hachures (denser and heavier on
steeper slopes, placement stable for the same map), ocean waves with "Reach" and "Coastal gap", lake ripples with a
"Shore gap", and illustrated settlement icons (A1 [V]).

---

## 3. Principles, by topic

### 3.1 Paper and pigment

- **Multiply, do not overlay.** Paint the color, then multiply a paper or cloth texture over it (F1 [V], A2 [V]).
  Multiply always darkens, so the texture is near-white and low in contrast (Azgaar keeps it at 0.2 opacity).
- **Tone.** Warm, slightly uneven ground: Azgaar uses #cfc7af to #e3dfce for land (A2 [V]); FM's cloth is #E8DCC2.
- **Grain at two scales.** A fine tooth (fibers, 1 to 2 px) and a broad mottle (blotches tens of px across); paper
  roughness also distorts the paint (MNPR's "substrate distortion", R3 [V]).
- **Edge staining and wear.** Darker, warmer toward the sheet edge (Cinderwood vignette #2f2418 at 0.55, A2 [V]);
  a few rings and drips, never over information. By one account cartouches began because hand coloring obscured
  fine engraved lines (M4 [X]): decoration goes where the data is not.
- → FM: the cloth stays (approved, final.md 2.3). Inside provinces the cloth shows through the wash as a ±3% L\*
  mottle; the margin gets the staining. Avoid a woven grid (reserved cross-hatch, final.md 2.3).

### 3.2 Watercolor washes

- **The five tells** (R4 [X]): edge darkening (pigment migrates to the drying edge), granulation (pigment settles in
  the paper's valleys), backruns (dark branching blooms where water pools), pigment separation, glazing (thin
  transparent layers stacked).
- **Uneven opacity.** Low-frequency noise in the wash's alpha (A3 [V]); or 30 to 100 stacked, nearly transparent
  copies of a recursively deformed polygon, more variation where the edge should be soft (R5 [X]).
- **Edges.** A darker, slightly wider band where the wash meets the line, occasional gaps and overlaps between
  neighboring washes (MNPR's "edge darkening" and "gaps and overlaps", R3 [V]); lines "not straight, very much by
  design", overlapping one another (R6 [X]).
- → FM: keep each province's mean color equal to its fill (palette tests, final.md 3.11) by making every variation
  symmetric in L\*; edge darkening as a 3 to 5 px inner band at about −8% L\* (the staged "pigment edge" is 3 px at
  12% black); a 1 to 2 px seeded gap between wash and border in places, so the cloth peeks through; no backruns
  near labels or bands. Ownership bands stay flat (docs/09), so ownership never reads as texture.

### 3.3 Terrain drawing

- **Light.** One light from the upper left; shadows on the lower right of every stamp; cast shadows parallel and
  starting at the trunk (M1 [X], M2 [X]). N or NNW light resists relief inversion even better than NW (M2 [X]).
- **Forests.** Clumps, not scatters; a firm outer edge with the shadow side filled; rounded strokes for broadleaf,
  sharp vertical strokes for conifers; forest flows around hills and follows ridges, its shadow density showing the
  relief (M1 [X]).
- **Mountains.** Side-profile peaks drawn tallest first and overlapping; the unlit side hatched or washed dark; the
  ridge "implied by the absence of a line"; foothill trees in front to seat the range (M1 [X]; research-mapdetail
  §1 [V] for O'Leary and Azgaar).
- **Hills.** Low humps with a few slope strokes on the shadow side; hachures denser and heavier where steeper, flat
  ground left empty (A1 [V]).
- **Water.** Shore ripples tight near land and sparser outward, drawn with a thinner, lighter pen; a fresh set of
  disconnected ripples in inlets; a light wash along the coast (M1 [X]); a gap between shore and first ripple
  (A1 [V]). [K] FFXIV lightens the shallows and keeps the middle calm.
- **Cliffs and roads** [K]: cliffs as a dark band with short ticks down-slope (FM's wild rim already does this);
  roads as pale, slightly wobbly ribbons or broken double lines, thinning into tracks.
- → FM: map each terrain to these idioms in its existing stamp vocabulary (final.md 3.2) and add clump logic:
  Forest stamps grouped into 2 to 4 crowns with a shared outline and a shadow side; Mountains as profile peaks with a
  washed shadow face; a lighter shallow band and ripple strokes wherever FM draws water (meres, swamp pools).

### 3.4 Line quality

- **Weight hierarchy.** Outer coasts and the sheet outline heaviest; borders next; terrain marks light; water lines
  thinnest and lightest (M1 [X]; Cinderwood borders 0.5 vs province 0.3, A2 [V]).
- **Wobble, seeded.** rough.js: roughness 1 and bowing 1 by default, 0 gives straight; a seed reproduces the same
  drawing; multi-stroke outlines unless disabled (R1 [V]).
- **Pressure and taper.** perfect-freehand: size, thinning 0.5, smoothing 0.5, streamline 0.5, and start/end taper
  (R2 [V]): strokes that thin at their ends read as pen, not vector.
- **Breaks.** Lines that stop short of meeting; dashes with uneven rhythm (`3 1.2 0.5 1.2`, A2 [V]).
- **Ink color.** Umber or sepia (#3E3428 to #6d5a3d) for terrain; a near-black only where contrast is information.
- → FM: borders are survey lines and hit-test geometry; keep them exact but stroke them with a seeded taper and
  ±10% width variation; wobble belongs to stamps, ripples, roads and the outer outline. Hachure angles must avoid
  the reserved 45° and cross-hatch patterns (final.md 3.2).

### 3.5 Color

- **Warm-cool harmony** [K]: warm paper and lit faces, cool water and shadows. Shadows of stamps toward blue-violet
  rather than toward black; lit faces toward warm yellow.
- **Atmospheric fading.** With distance, color shifts toward the atmosphere, contrast falls, edges soften, detail
  blurs (M5 [X]). On a map, the analogue is the sheet's outer edge: the painting fades toward paper (FFXIV [K], the
  vignette, A2 [V]).
- **Muted saturation** [K] (P1 [X]).
- → FM: the fills are law (CIEDE2000 ≥ 20, ≥ 12 under each deficiency; docs/09), so do not desaturate them; get the
  painted feel from symmetric lightness texture, a cool shift in stamp shadows and a warm shift in lit faces, each
  re-run through `palette.test.ts`. Fade only the decoration toward the cloth at the map's outer edge, never fills,
  bands, wilds or tokens.

### 3.6 Lettering

- **Hierarchy** (M3 [X], T1 [X]): region and wild names in letter-spaced capitals, sized by importance; places in
  mixed case, smaller; water in italic ("italics suggest motion", M3 [X]); at small sizes ranks differ by at least 2
  points (M3 [X]).
- **Curves.** Names follow their feature: along a river, through a mountain range, across an area's long axis;
  letter spacing grows to fill an area (M3 [X]). Not for point places, which stay horizontal.
- **Ink and halo.** Red or red-brown names over umber features (T1 [X]; #8a2e28, A2 [V]); halos thin and
  paper-colored, not dark glows (A2 [V]). FFXIV captions sit to one authored side of their icon (F3 [V]).
- **Hand.** Calligraphic or old-print faces carry the hand-made feel; each culture may have its own hand (T5 [X]).
- → FM: keep labels legible over every fill (the staged label budget and halo rules win); try a serif map face for
  names (section 6) and a letter-spaced SC face for wild and region names, curved along the wild's long axis.

### 3.7 Decoration

- **Cartouche:** title, scale, legend, sometimes a dedication; from 15th-century strapwork borders, Baroque at its
  height, simpler ovals by the late 18th century (M4 [X]). Its imagery once backed a ruler's claim to territory
  (M4 [X]): a nation-flavored cartouche suits a strategy map.
- **Compass rose** on water or margin, masked to water in Azgaar (A2 [V]); Thrór's in runes, East at top (T4 [X]).
- **Borders and vignettes:** Baynes's figure frieze and ten place vignettes (T2 [X]); a double-rule neatline [K].
- **Illustrated landmarks:** what lives where (F6 [X]); Elden Ring's great landmarks drawn on the sheet [K].
- **Small scenes:** ships and monsters on CK3's paper map (C1 [X]); ships, sea life and graticules in Civ VI's fog
  (V1 [X]); sea creatures retreating to cartouches and margins (M4 [X]).
- → FM: margins of the cloth (title cartouche and compass already specified), wilds and the fog are the places for
  ornament; one illustrated landmark per Wellspring and capital; nothing decorative inside a label, token or band box.

### 3.8 Detail by zoom

| Reference | Far | Middle | Near |
|---|---|---|---|
| CK3 (C1 [X]) | paper map on a table, ships and monsters | 3D map, political colors | terrain and county names, armies |
| FFXIV (F2 [V], [K]) | world map, region names | region map, area names | area map, sub-area names, icons |
| Elden Ring (E1 [X]) | blank parchment, faint paths | (one sheet) | revealed rendition, icons |

→ FM's bands (final.md 3.7) already add detail inward. Add by band: Far keeps one mass per terrain plus the sheet
ornament and region-scale names; Mid adds clumps, ripples, roads and place names; Near adds the yard details, the
finest hachures, cast shadows and stamp textures. Transitions blend (C2 [X]).

### 3.9 The unexplored

Blank sheet with faint paths (E1 [X]); sketches melting into the live map (V1 [X]); places unmarked until approached
(P2 [X]); map areas revealed by discovery (F2 [V]). → FM's line-art fog is on genre; it can borrow faint pencil
paths and the occasional marginal sketch, and must stay a projection of `provinceView` (final.md 3.10).

---

## 4. Where v2 stands against these principles (Obs, from the v2 screenshots)

| Principle | v2 | Gap |
|---|---|---|
| Paper under paint | fills are opaque; the cloth shows only in the margin | no paper mottle or grain in the land |
| Uneven wash | flat fills, uniform edges | no edge darkening beyond the staged 3 px, no splotch |
| Line quality | uniform 2 px borders; stamps with uniform outlines | no taper, wobble or weight hierarchy |
| One light | stamps have lit and dark faces | no cast shadows; forest crowns not clumped |
| Terrain idioms | trees, humps and peaks evenly scattered | no clumps, ripples, roads or relief strokes |
| Water | meres are dark blocks with ripple marks | no shallows, shore band only on wilds |
| Lettering | Alegreya Sans with dark halos; wilds in sans italic | no serif map face, no curved names |
| Decoration | title cartouche and compass in the margin | no vignettes, landmarks or small scenes |
| Saturation | fills are bright and flat (Farmland, Swamp) | painted feel must come from texture, not hue |

---

## 5. Owner-made images versus procedural (owner direction item 4)

What the references suggest an image does better, and what code does better:
- **Images:** the cloth or paper sheet (tileable, with a stained margin); stamp sheets of trees in clumps,
  profile mountains, hills, settlement roofs and landmarks (one light, upper left, transparent background);
  cartouche frames, a compass rose, corner ornaments and margin vignettes. These are hand-made by nature, and FFXIV
  and Baynes put their richness exactly here.
- **Procedural:** washes, edge darkening and mottle (seeded noise), ripples, hachures, roads, borders, labels and
  fog line art. These must follow state and geometry and stay seeded and stable.
- **Prompt seeds** (describe qualities, never a franchise): "a sheet of hand-inked fantasy map stamps on a
  transparent background: twelve clumps of broadleaf trees drawn in sepia ink with a light watercolor wash, light
  from the upper left, shadow on the lower right, top-down three-quarter view, no text"; "a seamless tile of
  undyed linen painted with a thin warm wash, faint fibers, no weave grid, even lighting"; "an ornate but restrained
  map title cartouche in ink and pale wash, strapwork and oak leaves, empty center, transparent background".
- Every image passes the palette and contrast tests after tinting, and every image has a procedural fallback.

---

## 6. Google Fonts for the lettering

All OFL on Google Fonts (METADATA.pb `license: "OFL"`; descriptions quoted from DESCRIPTION.en_us.html; G1 [V]).
FM loads Marcellus SC, Alegreya Sans and IBM Plex Sans Condensed today (Obs, mockup source).

| Role | Family | Why (description, G1 [V]) | Note |
|---|---|---|---|
| Place names | **Alegreya** (+ italic) | "originally intended for literature"; "dynamic and varied rhythm" | Pairs with the loaded Alegreya Sans; best small-size serif here |
| Region and wild names | **Alegreya SC** | small caps of the same family, 10 styles with italics | Letter-space 0.08 to 0.15 em |
| Titles, cartouche | **Marcellus SC** (loaded) or **Cinzel** | Marcellus "leans more towards the titling style of Trajan"; Cinzel "inspired in first century roman inscriptions" | Capitals only; Azgaar's Cinderwood uses Cinzel (A2 [V]) |
| Old-print flavor | **IM Fell English / SC**, DW Pica, Great Primer, French Canon | digital revivals of the Fell types, Oxford, 17th century | Irregular, early-print look ([X], G2); Google's copy is OFL, unlike the CTAN copy (G2 [X]) |
| Calligraphic flavor | **Almendra / Almendra SC / Display** | "based on calligraphy"; "related to the chancery and gothic hands" | For wild names or a nation's hand |
| Pen hand | **Fondamento** | "based on the traditional Foundational Hand" (Edward Johnston) | The most legible hand-lettered face |
| Pen hand, tall x-height | **Eagle Lake** | "based on the practical Running Book Hand" | Short labels |
| Elegant display | **Cormorant SC / Garamond / Unicase** | 9 styles, 5 weights | Thin; 16 px and up only |
| Uncial flavor | **Uncial Antiqua**, MedievalSharp, Macondo, Metamorphous | uncial; gothic inscriptions; tarot calligraphy; Romanesque mix | Culture flavor, sparingly |
| Marginal notes | **Caveat**, Kalam | handwriting "for both short annotations and body text" | Annotations, never names |
| Flourish only | Tangerine, Pinyon Script | chancery italic; round hand | Cartouche flourishes |
| Avoid on the map | Pirata One, Grenze Gotisch, UnifrakturMaguntia | blackletter | Poor small-size legibility |

→ FM: test Alegreya and Alegreya SC for names first (one family, already half-loaded); IM Fell English SC or
Almendra SC for wild names and the cartouche if a stronger hand is wanted; check each at the Mid label sizes
(final.md 3.5) for legibility on every fill and in fog.

---

## 7. Gaps and things not verified

- No FFXIV map image or art book page was opened; section 1.1's look and 1.2's painting habits are [K].
- Old World and Divinity: Original Sin 2 contributed nothing verifiable; describe them only from the owner's
  screenshots if the owner cites them.
- Curtis, Hobbs, Stamen, the cartography conventions and the tutorials are extracts; the formulas FM adopts should be
  tested in the mockup, not taken on trust.

---

## 8. Sources

**FFXIV.** F1 [V] https://github.com/xivapi/SaintCoinach/blob/master/SaintCoinach/Xiv/Map.cs ;
F2 [V] https://raw.githubusercontent.com/xivapi/SaintCoinach/master/SaintCoinach/Definitions/Map.json ;
F3 [V] https://raw.githubusercontent.com/xivapi/SaintCoinach/master/SaintCoinach/Definitions/MapMarker.json ;
F4 [X] https://www.creativebloq.com/features/the-art-of-ff-xiv ;
F5 [X] https://creativebloq.com/news/final-fantasy-xiv-endwalker-art ;
F6 [X] https://omeka.emich.edu/s/thedigitalmedieval/page/antonio-bienko-final-fantasy-14-and-medieval-geography ;
F7 [X] https://store.crunchyroll.com/products/final-fantasy-xiv-a-realm-reborn-the-art-of-eorzea-another-dawn-art-book-9781646091324.html ,
https://www.thevideogamelibrary.org/book/final-fantasy-xiv-a-realm-reborn-the-art-of-eorzea-another-dawn ;
F8 [X] https://www.thevideogamelibrary.org/book/final-fantasy-xiv-heavensward-the-art-of-ishgard-stone-and-steel ,
https://www.outland.no/scars-of-war ; F9 [X] https://forum.square-enix.com/ffxiv/showthread.php?p=4675037 ;
F10 [X] https://www.engadget.com/2010-09-09-the-art-director-speaks-in-the-latest-video-for-final-fantasy-xi.html ,
https://en.wikipedia.org/wiki/Akihiko_Yoshida

**Games.** D1 [X] https://kotaku.com/dragon-age-inquisition-s-war-table-brought-the-wider-w-1823169693 ;
D2 [X] https://primagames.com/eguides/dragon-age-inquisition-eguide/the-war-council/the-war-table ;
D3 [X] https://www.darkhorse.com/books/22-382/art-of-dragon-age-inquisition-hc/ , https://www.parkablogs.com/ja/node/11300 ,
https://primagames.com/eguides/dragon-age-inquisition-eguide/behind-the-scenes-at-bioware/inquisitors-edition-for ;
W1 [X] https://ica-abs.copernicus.org/articles/6/272/2023/ica-abs-6-272-2023.pdf ;
E1 [X] https://eldenring.wiki.gg/wiki/Maps , https://www.shacknews.com/article/129001/map-locations-elden-ring ;
E2 [X] https://vulkk.com/2022/03/02/how-to-reveal-and-use-the-map-in-elden-ring/ ;
P1 [X] https://www.gamereactor.eu/?p=20872 ; P2 [X] https://pcgamer.com/pillars-of-eternity-2-deadfire-review ,
https://bit-tech.net/reviews/gaming/pc/pillars-of-eternity-ii-deadfire-review/1/ ;
DS1 [X] https://www.gog.com/game/divinity_original_sin_2_divine_edition ;
O1 [X] https://pcgamer.com/old-world-review , https://civfanatics.com/page/136/ ;
C1 [X] https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-2-the-medieval-map.1274052/page-2 ,
https://www.gamewatcher.com/crusader-kings-3-map ;
C2 [X] https://admin-forum.paradoxplaza.com/forum/developer-diary/dev-diary-177-a-fresh-coat-of-paint.1854817/latest ;
V1 [X] https://digitaltrends.com/gaming/art-civilization-vi , https://twinfinite.net/news/civilization-vi-devs-explain-the-games-art-style/ ,
https://www.keengamer.com/article/14614_civilization-vi-review , https://www.thumbsticks.com/new-video-examines-the-art-of-civilization-vi-16072016/

**Tolkien and Baynes.** T1 [X] https://en.wikipedia.org/wiki/Tolkien%27s_maps ;
T2 [X] https://en.wikipedia.org/wiki/A_Map_of_Middle-earth ; T3 [X] https://geographicus.com/P/AntiqueMap/middleearth-baynes-1970-4 ;
T4 [X] https://tolkiengateway.net/wiki/Thror%27s_map , https://tai.tolkienists.org/tai/3/ ;
T5 [X] https://kotaku.com/the-beautiful-hand-writing-and-maps-of-the-lord-of-the-1685551885 , https://tolkiengateway.net/wiki/Daniel_Reeve

**Technique.** A1 [V] https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/master/docs/wiki/Map-embellishments.md ;
A2 [V] https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/master/public/styles/cinderwood.json (also
ancient.json, watercolor.json, ink.json) ; A3 [V] https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/master/src/index.html
(filters `splotch`, `filter-sepia`) ; R1 [V] https://github.com/rough-stuff/rough/wiki ;
R2 [V] https://github.com/steveruizok/perfect-freehand ; R3 [V] https://github.com/semontesdeoca/MNPR ;
R4 [X] https://grail.cs.washington.edu/projects/watercolor/paper_tiny.pdf , https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/curtis97.pdf ;
R5 [X] https://www.tylerxhobbs.com/words/a-guide-to-simulating-watercolor-paint-with-generative-art , https://sighack.com/post/generative-watercolor-in-processing ;
R6 [X] https://stamen.com/watercolor-process-3dd5135861fe/ , https://www.cooperhewitt.org/2023/10/04/evolving-digital-collections-and-their-stewardship-stamens-watercolor-maps ;
M1 [X] https://www.fantasticmaps.com/?p=2561 , https://www.fantasticmaps.com/2015/01/how-to-draw-forested-hills-on-a-top-down-map/ ,
https://www.fantasticmaps.com/?p=2195 , https://www.fantasticmaps.com/?p=2025 , https://torstan.deviantart.com/art/How-to-Draw-Forests-295836612 ;
M2 [X] https://en.wikipedia.org/wiki/Terrain_cartography , https://isprs-archives.copernicus.org/articles/XLII-4/101/2018/ ,
https://www.geographyrealm.com/relief-inversion/ ; M3 [X] https://www.axismaps.com/guide/labeling ,
https://www.esri.com/arcgis-blog/products/arcgis-pro/mapping/cartographic-conventions , https://atlas.co/courses/gis-basics/typography-in-maps/ ;
M4 [X] https://en.wikipedia.org/wiki/Cartouche_(cartography) , https://www.allenarchaeology.co.uk/tag/maps/ ,
https://erep.lit.auth.gr/wp-content/uploads/2024/03/2019-Mapping-Cartouches-e-perimetron-14.pdf , https://library.oapen.org/handle/20.500.12657/76094 ;
M5 [X] https://www.britannica.com/art/aerial-perspective , https://drawpaintacademy.com/atmospheric-perspective/

**Fonts.** G1 [V] https://github.com/google/fonts/tree/main/ofl/ (METADATA.pb and DESCRIPTION.en_us.html for alegreya,
alegreyasc, marcellussc, cinzel, imfellenglish, imfellenglishsc, almendra, almendrasc, fondamento, eaglelake,
cormorantsc, uncialantiqua, caveat and the rest of section 6; copies in `handdrawn-design/web/fonts/`) ;
G2 [X] https://www.fonttoolbox.com/fonts/im-fell-types , https://tug.ctan.org/fonts/imfellflowers/README

**Prior FM research.** `wartable-design/research-mapdetail.md` §1 (O'Leary's slope strokes, Azgaar's relief
placement, hachures; [V] there) and `research-tabletop.md` (the table, props and light).
