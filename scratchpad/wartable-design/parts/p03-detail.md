
---

## 3. More map detail: the painted cloth

### 3.1 The surface

- **Fills stay exactly as specified.** The terrain fills, the 10% noise multiply and the 2 px borders of `docs/09` are unchanged, and so is the palette test.
- **Painted grain.** Low-alpha gouache blotches (7%, half ink and half parchment) are baked over the fills, so the cloth reads as painted, not printed.
- **The map's edge.** The rounded outline of the map is a 3 px ink line. Outside it lies bare linen.

Everything else on the cloth is a **stamp**: a small two-tone drawing placed by a seeded sampler inside a province or a region. The calibration sketch has 2,400 stamps on a Medium map at Mid zoom. It reads as a painted map, and every label and badge stays clear (`sketch/sketch-mid.png`).

### 3.2 Terrain detail

Stamp sizes are in world units, a province averages 6400 units², and at the start zoom a unit is about 1.1 px. Counts are per average-sized province and scale with area. Each band shows a nested subset (3.7).

| Terrain | Stamps | Look (two tones: ink outline plus a light face) | Far / Mid / Near | Spacing |
|---|---|---|---|---|
| Forest | canopy crowns in 3 sizes, radius 2.6 to 4.3 | dark crown #26361C, light crown #557A3C, ink 0.8 px, a soft shadow; "half trees" at the inset edge | 25 / 42 / 70 | 6.8 |
| Hills | rounded mounds with 3 to 4 hachure strokes on the shadow side | mound #9C7C2C, ink top line | 3 / 6 / 10 | 16 |
| Mountains (passable) | low peaks, no snow | lit #B4C1C6, shade #6E7F86, ink | 2 / 4 / 7 | 17 |
| Swamp | reed tufts and still pools | reeds #0F3F44, pools #134F55 | 8 / 14 / 22 | 9 |
| Farmland | 2 to 5 field patches with furrows and hedges (**flat**: may pass under labels) | ochres #D9A532 and #F3C85A, furrows #7A5414 at 55%, hedges #465A28 | 2 / 4 / 6 | 21 |
| Wasteland | cracks, stones, dead shrubs | cracks #6E5149, stones #8A7066 with ink, twigs #5A4A40 | 5 / 9 / 14 | 11 |
| Plains | grass tufts, 1 or 2 lone trees, wildflower dots at Near | tufts #7F9A5C | 8 / 14 / 22 | 10 |

**Placement rules** (pure, in `src/present/map/stamps.ts`):
1. **Sampler.** Poisson disc inside the province polygon. It reuses `poissonDisc` from `src/mapgen/voronoi.ts`, on a stream from `streamFor(\`map:${seed}:${provinceId}\`, 'stamps')` (the battle track's `src/present/rand.ts`). Each point gets a **rank** from the order it was drawn in.
2. **Inset.** Tall stamps keep the band width plus 3 units from the edge. Flat stamps (fields, cracks, pools) may reach the edge and are clipped.
3. **The label-and-badge core.** No tall stamp inside a disc of radius max(26 px, 0.42 × inradius) around the label anchor, nor inside the badge box. Flat stamps may pass under a label, whose ink halo keeps it readable.
4. **Order.** Stamps draw by their bottom edge, so nearer ones cover the feet of those behind (Azgaar, research A1).
5. **Shared parts.** The map's tufts, rocks, reeds, dead trees and crop rows are the battle backdrops' props (`battle-design/final.md` S4.4). A province looks like its battlefield.

**Why stamps are more than decoration.** Under fog and in map modes, the fills are hazed or tinted. Measured (`tools/haze.out`): a 20% linen haze already drops Hills against Wasteland to 18.7 (normal) and 10.8 (tritan). A 45% desaturation drops Mountains against Wasteland to 9.2 (protan). In both cases the stamps' shapes still say forest, hills or swamp. So the stamps carry terrain identity exactly where color cannot.

### 3.3 Borders

- **M1:** 2 px #2B2620 between provinces (docs/09). Ownership bands carry nation borders (3.4). Ridges draw as in 1.8.
- **M1-should (Phase 11): painted edges.** Borders are made noisy for drawing only, with Red Blob's midpoint subdivision kept inside the quadrilateral of the two endpoints and the two sites (research R1):
  - amplitude 0.12 of the edge length, recursion down to 6 units;
  - seeded by the pair of province ids, so both provinces get the same edge;
  - **hit tests use the same noisy polygon**, so what the player sees is what they click;
  - adjacency is unchanged, because noisy edges never cross.

### 3.4 Ownership

Ownership bands stay exactly as docs/09 specifies: a flat banner-color strip on the inner border with a `keylineFor` keyline, drawn **above** stamps and settlements. Two additions:
- **The capital pennant.** A small painted banner carrying the nation's sigil (pretender final B.7) stands in the capital's settlement at Mid and Near.
- **Architecture.** Settlements are built in the owner's kit (section 4.2). Ownership therefore shows twice, as a band and as buildings, and neither depends on hue alone.

### 3.5 Labels

- **Provinces.** Names use the display face (Marcellus SC, as in the mockup) in #F4EEDF with a 3.2 px ink halo. Capitals are 2 px larger.
- **Impassable regions.** An italic serif (1.8), so a region never reads as a province.
- **Rules unchanged.** The density budget and the priority culling of UI spec 2.10.3 stay as they are. The only addition: a region's name takes the priority just after Wellsprings, and its box enters `layoutMapLabels`.

### 3.6 Armies as painted miniatures

A miniature replaces the badge, and the **plaque is the badge**. Every rule of the staged badge holds: shape by allegiance, the count, at most one status corner glyph by exception, stacks, fanning, selection, and the transit arrow with its ETA.

| Part | Rule |
|---|---|
| **Base** | an oval, 28 × 10 px at Mid. Nations: dark painted wood #3E2E20 with a 2.2 px rim in the banner color. Independents: pewter #91A092 with the Independents grey rim (ΔE 10 between them, so material and faction agree). The pretender: a gilded rim. A fixed soft shadow sits below |
| **Figure** | the lead commander as a standing figure with a banner pole: its rig (battle design S4.4) in the idle pose, cut down to a map figure. 30 px tall at Mid and 40 to 46 px at Near, **never taller than 46 px**. Pretenders and summons use their own rigs |
| **Escort** (Near only) | 1 to 3 small figures of the army's largest squad's archetype behind the leader: 1 under 20 troops, 2 under 60, 3 from 60 |
| **Plaque** | in front of the base, the allegiance shape (rounded shield for own, notched for other nations, plain for independents) in the banner color. A flat dark plate carries the count in tabular figures, 10.5 px at Mid and 12 px at Near. The status glyph sits on the plaque's corner |
| **Fog** | an unscouted independent force is a **cloaked figure** (its "blank back", as a Columbia block shows one) with the strength word on the plaque. A scout turns it round: the true figure and the exact count |
| **Far band** | the plaque alone, one per nation per province (staged rule) |
| **Selection** | a brass ring on the cloth around the base. The staged bright ring keeps its contrast |
| **Movement** | the figure slides along its path. docs/09's "Walk (map): 0.4 s bob of 3 px" stays, and reduced motion removes it. **No idle bob on the map**: figurines stand still |
| **Box** | figure plus base plus plaque fit 34 × 46 px at Mid. This box is the badge box for `layoutMapLabels`, so miniatures never overlap labels, as the staged budget already requires |

**Where it stops.** Numbers never sit on a painted surface and never take perspective or lighting. Figures never cover the plaque. If a stack's figures would leave its box at Mid, the stack shows one figure and a `×n` tag, as the staged stack does.

### 3.7 Level of detail by zoom

Bands are the staged ones (median province diameter: Far under 70 px, Mid 70 to 180, Near over 180). **Decoration thins by band. Information never does**, which is the staged rule.

| Layer | Far | Mid | Near |
|---|---|---|---|
| Fills, bands, borders | yes | yes | yes, plus painted edges (should) |
| Terrain stamps | 35% of ranks, merged into canopy and relief masses | 60% | 100% |
| Impassable regions and ridges | massif with 3 to 5 stamps; ridges as a sawtooth | full | full, plus scree |
| Settlements | one roof cluster for tier 2 and up, plus capitals | all houses of the tier; walls by PD; landmarks | plus the yard details (wells, carts, fields at the edge) |
| Alignment wash | yes | yes | yes |
| Alignment and scale motifs | none | 1 per strength step and 1 per scale step (4.3) | double |
| Scars and ritual marks | marks that carry information (siege camp, ritual badges) | all | all |
| Miniatures | plaques only | figure, base and plaque | plus escorts |
| Labels | names by priority | staged two lines | staged Near contents |

Thinning by **rank** means zooming in only adds stamps; none move, so the map never shimmers. The baked layer cross-fades over 150 ms when the band changes (instant under reduced motion).

### 3.8 Density budget and baking

- **Caps.** At most 90 stamps per average province at Near (forest is the densest). Settlements have at most 22 houses plus 3 landmarks, and motifs at most 14.
- **Total.** About 7,000 stamps on a Large map at Near, 3% of a 200,000-sprite benchmark. Stamps are not live sprites, though: they are **baked**.
- **The sheet bake.** Each zoom band has one static bake of fills, grain, stamps, settlements, alignment, scars, impassable terrain, borders and bands:
  - tiles of 2048²;
  - the band's scale (Far 0.6, Mid 1.2, Near 2.4 px per unit) times the device pixel ratio.
  - Medium is 816 × 510 units with its regions. Near at DPR 2 is 3916 × 2448, which is 2 × 2 tiles and 38 MB. Mid is 9.6 MB and Far 2.4 MB.
  - Only the current band and the next one are resident, at most 48 MB.
- **Re-bakes.** A province's dirty rectangle (its bounds plus its stamp overhang) re-bakes when its look key changes (section 4.7). At most 4 provinces are re-baked per frame, so a month end with 20 changes takes 5 frames.
- **Live layers.** These stay as specified: mode tints (one batch of province `Graphics`), labels (`BitmapText` for numbers), miniatures (one atlas, at most 100 armies × 3 sprites), paths, selection and effects.
- **The label test grows.** `layoutMapLabels`'s test (UI spec 2.10.3, Medium seeds 1 to 5 at the fit zoom) also checks that no tall stamp's box intersects a label box or a badge box, and that region labels never overlap province labels.

### 3.9 Map modes still read

The staged rule stays: modes tint fills at about 70% over the desaturated terrain fill. Borders, bands, badges, labels and Wellspring glyphs keep full contrast. The detail obeys the mode:

| Detail | In a mode other than Ownership |
|---|---|
| Terrain stamps | ghosted to 40%: terrain is hinted, never competing |
| Settlements and landmarks | full (population and buildings are information) |
| Alignment wash | off (the mode replaces the fill) |
| Alignment and scale motifs | 25% |
| Scars | full for information marks (siege, ritual badges), 40% for the rest |
| Impassable regions and ridges | **never tinted or ghosted** |
| Miniatures, labels, numbers layer | unchanged |

The sketch in Dominion mode shows the tints reading cleanly over the ghosted stamps, with the regions unchanged (`sketch/sketch-dominion.png`).

### 3.10 Fog: "not yet painted"

The staged rules for what is shown stay. Only the look changes:
- **Unexplored.** The cartographer has not painted it yet. The fill sits under a 35% linen haze, terrain stamps are drawn as **sepia line art with no fill** (#6B5A40), and the border is dotted. There is no settlement, alignment or scar detail. Terrain still reads by stamp shape, since terrain is public.
- **Explored, out of sight.** Painted but faded: the fill and stamps are desaturated 45%, and the border is dotted. Settlements and buildings show as the sim allows (population once explored); armies show only where the nation sees.
- **One projection.** Every map look is computed from the same `provinceView(state, viewer, id)` the tooltip and the modes use. The UI spec's **fog guard test** covers `mapLook`: changing hidden state leaves the output unchanged. The art never shows what the tooltip would hide.

