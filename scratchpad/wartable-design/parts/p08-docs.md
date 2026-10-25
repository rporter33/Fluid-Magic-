
---

## 8. Docs text

Each block names its file, where it goes, and its exact text. Docs 07 and 09 are edited **relative to the staged copies** in `/home/user/fm-docs/docs/`. Blocks land in the commit that implements them: docs/01, docs/06 (mapgen) and docs/09-balance (impassable rows) with Phase 1b; the rest with Phases 8 to 12, as section 7 places them.

### 8.1 `docs/01-core-rules.md`

**§2 The map.** After the bullet "Seas are out of scope for M1. The generator produces a landlocked map.", add:

```markdown
- **Impassable terrain.** Some of the map cannot be crossed. *Peaks* (mountain massifs) and
  *meres* (dark lakes) are regions of the map that are not provinces. *Ridges* are borders
  between two provinces, drawn as mountain chains. No army moves, retreats or sees across
  impassable terrain, no dominion spreads across it, and a ritual's reach is counted around it.
  A Medium map has 3 peaks, 2 meres and about 7 ridges, never next to a capital's starting
  neighborhood, and there is always a way around.
```

**Implementation decisions, "Map generation (Phase 1)".** Replace the **Adjacency** bullet with:

```markdown
- **Adjacency**: two provinces are neighbors exactly when their borders share a segment that is
  not a ridge; cells that meet at a single point are not. A province lists its neighbors
  (`neighbors`) and, apart, the provinces across a ridge (`ridges`); together they are every
  shared segment, so the drawn map and the graph always agree.
```

In the **Terrain** bullet, after "capitals included", add: "; impassable regions take part in the ranking (peaks as Mountains, meres as Swamp) and are then removed, so the provinces keep the exact shares".

**Implementation decisions.** Add a new group after "Map generation (Phase 1)":

```markdown
**Impassable terrain (Phase 1b)**

Added on 2026-10-21 by the project owner's direction: "i want to make sure the maps have some
impassible terrain that is noticeable".
- **One adjacency.** `neighbors` holds only passable borders, and every rule that reads it
  (movement, paths, retreat, vision, dominion spread, ritual reach, fort materials, the AI)
  respects impassable terrain with no rule of its own. Move validation names the ridge when a
  path steps across one.
- **Regions.** The map has `round(0.05 × provinces)` peaks and `round(0.03 × provinces)` meres,
  as cells beyond the province count, so a province keeps its mean area. A region is never on
  the map's edge and is at least 3 cells from every capital. Up to 3 touching peaks form one
  named range; a mere touches no other region; a peak touches no mere. Peaks are the highest
  eligible cells, meres the wettest low ones. Regions are named like provinces (`the Ashspine`,
  `Blackmere`).
- **Ridges.** Up to `round(0.05 × borders)` borders between provinces are ridges, chosen from
  borders that touch a peak, continue a ridge, or join two Mountains or Hills provinces,
  highest first. Both provinces of a ridge are at least 2 hops from every capital; a ridged
  border is at least a quarter of `sqrt(provinceArea)` long; a peak sends at most 2 ridges; a
  chain is at most 4 borders long.
- **Always a way around.** After every region and ridge: the province graph is connected and
  2-connected (no single province is the only way into part of the map), every province keeps
  at least 2 neighbors, the two provinces of every ridge are at most 4 passable steps apart,
  and the provinces around every region at most 6.
- **Order.** Cells, then capitals (on every cell), then regions, then terrain on every cell (so
  shares stay exact), then ridges, then Wellsprings, springs, names, population and capital
  distances on the passable graph. The balance search takes up to 10 valid maps.
- **Unchanged guarantees.** Capitals stay at least 6 apart (removing cells and borders only
  lengthens paths), each capital's 2-hop neighborhood has the same provinces as without
  impassable terrain, and Wellsprings are placed and judged on the passable graph.
- **Not in M1:** fliers crossing ridges, passes that open or close, roads and tunnels.
```

### 8.2 `docs/09-balance.md`: rows (date 2026-10-21)

```markdown
| 2026-10-21 | 01 §2 | Impassable regions | none | peaks round(0.05 × provinces), meres round(0.03 × provinces) (Medium 3 + 2); not on the edge; at least 3 cells from every capital; ranges of at most 3 peaks; meres alone; the provinces around a region within 6 steps | Owner direction: noticeable impassable terrain. 200 Medium seeds: 0 failures, 1.8 attempts on average, capitals 9.4 → 10.2 steps and 45.5 → 50.3 days apart, 39% of provinces touch impassable terrain |
| 2026-10-21 | 01 §2 | Ridges | none | up to round(0.05 × borders) (Medium 7); both sides at least 2 steps from every capital; sides within 4 steps by a way around; chains of at most 4; at most 2 per peak; borders at least 0.25 × sqrt(provinceArea) long | Chokepoints with passes, spurs from the massifs; measured detours never above 4 |
| 2026-10-21 | (new) | Map area | provinces × 6400 | (provinces + impassable regions) × 6400 | Provinces keep their size |
| 2026-10-21 | (new) | Province graph | connected | connected and 2-connected (no cut province) | Every baseline map already was (200 seeds); keeps barriers from sealing valleys |
| 2026-10-21 | 01 §2 | Capital balance search | up to 6 valid maps | up to 10 | With impassable terrain, 4-nation maps within 1.5 fell to 34% at 6; at 10 they are 50% (54% without impassable terrain), 3-nation maps 93% (79%) |
```

Under a new heading **"Map presentation"** (like the battle track's "Battle presentation"):

```markdown
| 2026-10-21 | 09 | Start zoom; lean back | fit the map | the cloth fits the unobscured area with a 32 px oak band; zoom out to 0.92 × the table's fit | The table frames the map; still the Mid band at 1280x720 (about 100 px per province) |
| 2026-10-21 | 09 | Light on the cloth | none | at most a 2700 K multiply of 8% | 15% at 1900 K breaks the terrain palette rule under protanopia |
| 2026-10-21 | 09 | Dominion wash caps | none | Cinder Horde ash #8F8C88 at 12%; Thornwood moss #5E7F45 at 8%, scaled by strength / 10 | Largest alphas that keep every terrain pair at CIEDE2000 20 normal and 12 under each deficiency (Thornwood at 12%: 10.8 protan) |
| 2026-10-21 | 09 | Settlement tiers | none | population 1,500 / 4,000 / 8,000 / 14,000; houses 1 / 2–3 / 4–6 / 7–10 / 11–15; capitals 16 + 1 per 5,000 above 25,000, at most 22 | A Growth +3 province climbs about one tier over a 70-month game; a neutral one gains a house or two |
| 2026-10-21 | 09 | Walls by PD | none | watchtower at 1, palisade at 5, stone wall at 15, gatehouse at 30 | PD is the most visible investment |
| 2026-10-21 | 09 | Land motifs | none | nation motifs 1 / 3 / 5 / 7 at dominion 1 / 4 / 7 / 10, a landmark from 7; 1 motif per scale step at Mid, 2 at Near | Strength reads as density |
| 2026-10-21 | 09 | Terrain stamps per average province, Far / Mid / Near | none | forest 25 / 42 / 70; hills 3 / 6 / 10; mountains 2 / 4 / 7; swamp 8 / 14 / 22; farmland 2 / 4 / 6; wasteland 5 / 9 / 14; plains 8 / 14 / 22 | Calibrated in the war-table sketch at Mid: dense, labels clear |
| 2026-10-21 | 09 | Repaint | none | 600 ms brush wipe; at most 8 animated per month end; slow looks change at most monthly | Calm map |
| 2026-10-21 | 09 | Battle scars | none | 180 days, fading in thirds each 60 days | A season of memory |
| 2026-10-21 | 07 | Commander panel portrait | 64 px | 96 px | Leaders need faces (owner direction) |
| 2026-10-21 | 09 | Raster portrait sets | none | used once a set has 8 images (12 per independent terrain) | Too few variants is worse than none |
```

### 8.3 `docs/09-art-direction.md` (relative to the staged copy)

**In "Color palettes",** replace "The map background is a deep parchment #E8DCC2 at the edges fading to #1C1A17 under the UI." with:

```markdown
The map is painted on a linen cloth (#E8DCC2) pinned to an oak war table; see "The war table".
```

**In "Sprite system",** replace "- Portraits for commanders are the same SVG cropped at 2x with a colored backdrop." with:

```markdown
- Commanders have portraits of their own; see "Leader portraits". Pretenders and summoned
  commanders use their rig in its portrait pose.
```

**In "Animation",** add these rows to the table:

```markdown
| Idle (map) | none: miniatures stand still on the map; the walk bob above stays |
| Map repaint | a 600 ms brush wipe over a province whose look changed, from the side the change came from; at most 8 per month end, the rest instant |
| Table ambience | candle flames ±4% brightness at 0.7 to 1.3 Hz; the hearth ±5% on a 6 s cycle; at most 12 dust motes drifting 4 px/s in the window light, never over the cloth |
```

**In "UI chrome",** replace the first paragraph with:

```markdown
The chrome stays dark so the map and the mana colors carry identity, and it is made of the war
table's materials: dark oak panels, brass hardware, leather spines and parchment card faces.
Mana colors never decorate chrome. They appear only on things that carry that color.
```

In the token table, change three values and add five rows. `tests/content/palette.test.ts` checks every text pair at 4.5:1 and every keyline at 3:1:

```markdown
| `--chrome-0` | #2E2219 | panel base, top bar (dark oak): text 13.35:1 |
| `--chrome-1` | #3A2B1F | raised rows, cards: text 11.74:1 |
| `--chrome-2` | #4A3727 | hover, selected tab: text 9.72:1, dim text 4.64:1 |
| `--leather` | #5A3A28 | dock spines and tab backs; text 8.76:1; never dim text |
| `--brass` | #DBBD76 | keylines on action buttons (6.19:1 on `--chrome-2`), corner brackets, rivets |
| `--parchment` | #E8DCC2 | card faces and Codex pages, with ink #1C1A17 text (12.77:1) and dim ink at 70% (5.53:1) |
| `--warm-ink` / `--cool-ink` | #8A4A12 / #2F5D73 | ▲ and ▼ deltas on parchment (5.03:1, 5.26:1) |
```

After the "Cards" bullet, add:

```markdown
- **Materials:** oak grain appears only in frames and bevels (the top bar's edges, the docks'
  6 px frame), never behind text, numbers or icons. Brass marks action buttons (a 1 px keyline),
  dock and modal corners (14 px brackets) and the top bar's rivets, and never touches a mana
  symbol. Card faces and Codex pages are parchment with ink text; a mana symbol on parchment
  takes a 1 px ink ring. Tooltips stay dark (`--chrome-0` with a brass keyline).
```

In the **Motion** bullet, replace "Reduced motion removes the pulse, the idle bob and every UI tween." with "Reduced motion removes the pulse, the idle bob, every UI tween, the table's ambience and map repaints (they become instant)."

**Add five sections after "Animation"** (after the battle and pretender tracks' sections, if those have landed):

```markdown
## The war table

Added on 2026-10-21 at the owner's direction: "the overall map should be on an rustic wartable
in a cozy but natural tavern, nice oak wood".

- **The scene.** Seen straight from above: the map is a painted linen cloth with a leather hem,
  pinned by four brass tacks to an oiled, quarter-sawn white oak table, in a tavern lit by a
  hearth on one side and a window on the other. The camera never tilts; depth is painted, never
  simulated.
- **Oak.** Tawny grey-gold, straight grain left to right, silvery ray fleck, darker end grain:
  lit #B08A5E, body #8C6A47, shade #5E4630, edge #3E2E20. No orange stain.
- **Light.** Warm light falls on the room and the table only: the hearth (2000 K, #FF890E) and
  candles (2700 K, #FFA757), with a vignette toward the table's rim. The cloth is lit by neutral
  daylight and takes at most an 8% 2700 K multiply, never a vignette.
- **The room** follows the game's seasons (winter months 11 to 2, the battle backdrops' rule):
  cooler window light and a brighter hearth in winter. No people, no time of day.
- **Props** stand in the table's margin, never on the cloth: a month candle that burns down as
  the month passes, an hourglass that runs at the game's speed and lies on its side while
  paused, a coin purse that fills with the treasury, a tankard, an inkpot and quill, dice and a
  sealed letter. Props only mirror what the chrome shows and are not clickable.
- **Settings:** Table Full (room, table, props, ambience), Simple (oak and cloth only), Off (a
  plain dark surround).

## The painted map

- **Stamps.** Each terrain has small two-tone drawings (ink outline, light face) scattered by a
  seeded sampler inside each province: forest crowns, hill mounds with hachures, low passable
  peaks, reeds and pools, field patchworks, cracks and stones, grass tufts. They are seeded by
  the game seed and the province, so they never change between reloads; they keep out of a disc
  around the label and the army badge; nearer stamps cover the feet of those behind.
- **Level of detail.** Far shows 35% of the stamps, Mid 60%, Near all; zooming in only adds.
  Information never thins: settlements, sieges, ritual marks and impassable terrain show at
  every zoom.
- **Modes.** In any mode but Ownership, stamps ghost to 40% and land motifs to 25%; settlements,
  information marks and impassable terrain stay at full strength.
- **Fog.** Unexplored land is "not yet painted": the fill under a 35% linen haze, stamps as sepia
  line art, a dotted border. Land out of sight is painted but faded (desaturated 45%). Terrain
  still reads by its stamps' shapes where the hazed fills merge.
- **Armies are painted miniatures**: the lead commander's figure on a round base (painted wood
  for nations, pewter for independents) behind a plaque in the allegiance shape that carries the
  count and the status glyph. The plaque is the badge; at Far only the plaque shows. An
  unscouted independent force stands as a cloaked figure with its strength word.

## Impassable terrain

Drawn by shape in two tones, ink #1C1A17 and snow #F3F0E8, so one tone reaches 4.3:1 or more on
every fill and the shape reads for every kind of color vision.
- **Peaks:** a granite ground (#5E5953) under a massif of snow-capped peaks that fills the cell
  and rises slightly above it, with an ink contour and a snow keyline. Passable Mountains keep
  small, low, snowless peaks, so the two never look alike.
- **Meres:** night water (#182A36) with shore bands and pale ripples (#8FC3D3).
- **Ridges:** an ink spine on the shared border with a chain of light peaks astride it, drawn
  above ownership bands.
- Regions and ridges are never tinted or ghosted by a map mode, are always visible (terrain is
  public), and carry italic names.

## Growth and alignment

The map changes as the game goes on, from state the simulation already keeps.
- **Settlements** grow by population in five tiers (1 to 22 houses, added outward from the
  center, never reshuffled), in the owner's architecture (Cinder Horde soot and ash with ember
  windows; Thornwood living roofs and timber; independents fieldstone and thatch). Walls follow
  PD (watchtower, palisade, stone wall, gatehouse); temples, labs and forts are landmarks;
  construction shows scaffolding.
- **Land looks.** The dominating nation's god repaints the land by dominion strength: a ground
  wash capped by the palette test (Cinder Horde ash, Thornwood moss) and the nation's motifs
  (ember cairns and charred stumps; blossom, brambles and an elder tree). Each scale pole adds
  its own motifs per effective step (Order hedgerows, Turmoil burnt roofs, Lore standing stones,
  Fury war cairns, Growth blossom, Rot dead trees, Wild briars, Artifice mills, Sanctity
  wayshrines, Dread gibbets). A new nation needs one land-look record.
- **Scars and blessings:** siege camps and cracked walls, pillage smoke, unrest (shutters,
  smoke, burnt roofs), battle scars that fade over 180 days, ritual marks while their effects
  last, Wellspring basins and claim stones.
- **Calm.** Slow looks (settlements, land looks) change at most once a month; events show at
  once. A change repaints the province with a short brush wipe. Nothing covers labels, bands,
  badges or glyphs.

## Leader portraits

Added on 2026-10-21 at the owner's direction: "leaders certainly need portraits".
- Every commander has a portrait: a head-and-shoulders bust built from SVG parts on a 256-unit
  grid (backdrop, clothes in the banner tint, head, features, marks, beard, hair, headgear,
  overlays, frame). The game seed and the commander id pick every part, each from its own key,
  by rendezvous over append-only part lists, so a face never changes on reload and an art update
  keeps most faces.
- State never changes the face. It adds overlays (a bandage below half HP, blood below a
  quarter, a halo for the prophet, a crown for the pretender, glowing eyes in a mage's color)
  and frame marks (the pip ring, the holy mark, status glyphs, a dotted frame out of sight,
  greyscale with a ribbon when dead).
- Frames show rank: oak (scouts), bronze (priests, adepts, druids), brass (chieftains, captains,
  the magus, the elder), gilded (the pretender), pewter (independents), elemental (summons),
  each with an inner band in the banner color.
- Sizes: 128 (name cards, Codex), 96 (Commander panel), 72 (bottom strip), 64 (replay docks),
  48 (report cards, tooltips), 28 (outliner), 20 (links). Below 48 px only the silhouette, the
  halo and the crown are drawn.
- Pretenders and summoned commanders use their rig's portrait pose.
- Owner-made raster portraits may replace a type's procedural busts once the type has a full
  set; state then shows on the frame only.
```

**In "Delivery rule",** append:

```markdown
Raster art (portraits, the table, the room) is optional and owner-made: it arrives in
`art-inbox/`, passes `scripts/art-intake.ts` (crops, sizes, checks, a provenance sidecar per
image, a contact sheet for approval) and lands in `src/assets/<kind>/` with WebP sizes and a
manifest entry. A raster set is used only when complete; the procedural art is always the
fallback.
```

### 8.4 `docs/07-ui.md` (relative to the staged copy)

**"Map" → "Drawing".** Replace the whole subsection with:

```markdown
### Drawing
- The map is a painted cloth on an oak war table (docs/09 "The war table"). The camera looks
  straight down; it starts with the cloth filling the unobscured area and a 32 px band of oak
  around it, and can zoom out ("lean back") until the whole table and the tavern floor around
  it show.
- Provinces are filled polygons: terrain color with a subtle noise texture and a 2 px border,
  with terrain stamps, settlements and land looks painted on them (docs/09 "The painted map",
  "Growth and alignment").
- The owner's banner forms an inner band with a keyline (docs/09). Independents have none.
- Impassable regions (peaks, meres) and ridges are drawn by shape and are never tinted by modes
  (docs/09 "Impassable terrain").
- Draw order from the bottom: room, table, props, cloth; fills, noise, stamps, land looks,
  settlements, scars, impassable regions, borders, bands, ridges (one baked layer per zoom band);
  mode overlays, labels, numbers chips, paths, army miniatures, transit arrows, selection rings,
  battle markers; table ambience over the room only.
- The province tooltip and cursor label are DOM placed from Pixi coordinates.
```

**"Modes".** Add after "How a mode draws":

```markdown
- **Detail in modes:** terrain stamps ghost to 40% and land motifs to 25%; settlements,
  information marks (sieges, ritual badges) and impassable terrain keep full strength.
  Impassable regions are never tinted or hatched; in Dominion mode an undominated province shows
  its desaturated terrain, never a flat grey.
```

**"Labels and the density budget".** Add:

```markdown
- **Impassable regions** carry italic names (priority after Wellsprings). No tall stamp,
  house or motif sits inside a label or badge box; the label test checks this too.
```

**"Army badges".** Replace the first bullet with:

```markdown
- **Miniatures:** an army is a painted miniature: the lead commander's figure (30 px at Mid, at
  most 46 px at Near, with up to 3 escort figures at Near) on a round base, behind a plaque that
  is the badge: rounded shield for own armies, notched shield for other nations, plain shield
  for independents, in the banner color. At Far only the plaque shows. An unscouted independent
  force stands as a cloaked figure with its strength word.
```

**"Moving".** Add:

```markdown
- **Impassable terrain:** paths bend around peaks, meres and ridges, and the label says "around
  the Ashspine". A region is never a target (the cursor shows ✕ and "Impassable"). When the way
  around is closed, the reason names both: "No path: the Ashspine blocks the way, and the way
  around crosses hostile Velmere."
```

**"Province tooltip and engagement preview".** Add:

```markdown
- **Impassable regions** have a small card: name, kind, "No army, sight, dominion or ritual
  crosses it", and the provinces it borders as links. A province's card lists the impassable
  terrain it borders.
```

**"Fog".** Replace the subsection with:

```markdown
### Fog
- **Unexplored provinces:** "not yet painted": the fill under a linen haze, terrain stamps as
  sepia line art, a dotted border. Terrain still reads by its stamps.
- **Out of sight:** painted but faded (desaturated) with a dotted border.
- **Fogged values** read "unknown" or a strength word, never 0. Map art uses the same view of
  a province as its tooltip, so it never shows what the tooltip hides.
```

**Commander panel.** Replace "**Header:** portrait with a pip ring," with "**Header:** portrait (96 px) with a pip ring,".

**Bottom strip.** Replace "- **Portrait:** opens the Commander panel." with "- **Portrait** (72 px): opens the Commander panel."

**Settings.** In **Interface**, replace "guidance, reset hints." with "guidance, reset hints, table (Full, Simple, Off), map detail (Full, Reduced)." In **Accessibility**, after "reduced motion," add "(it also freezes the table's ambience and map repaints)".

**Add a section after "Bottom strip (selected commanders)":**

```markdown
## Leader portraits

Every commander has a portrait (docs/09 "Leader portraits"): 96 px in the Commander panel, 72
in the bottom strip, 64 in the replay docks, 48 in report cards and hover tooltips, 28 in the
outliner, 20 beside a name in text. The portrait is the same person everywhere; state shows as
overlays and frame marks (wounds, halo, crown, pip ring, holy mark, status glyphs). A commander
the player cannot see shows its last-seen portrait, faded, in a dotted frame.
```

**"Changes from the previous version".** Add:

```markdown
11. **The war table (2026-10-21, the owner's second direction):** the map is a painted cloth on
    an oak table in a tavern, with impassable terrain, terrain detail, settlements that grow,
    land that changes with dominion, painted miniatures for armies, leader portraits, and oak,
    brass and parchment chrome. Table and Map detail settings were added.
```

### 8.5 `docs/10-milestone-1.md`

**After "Phase 7", add:**

```markdown
### Phase 1b: Impassable terrain (after Phase 7)
- Added on 2026-10-21 by the owner's direction ("i want to make sure the maps have some
  impassible terrain that is noticeable"); rules in `docs/01-core-rules.md` §2 and its
  Implementation decisions.
- `mapgen/impassable.ts`: peaks and meres as cells beyond the province count, ridges between
  provinces; `assignTerrain` with counts; `validateMap` checks (2-connected, detours, capital
  distances, interior regions); `ImpassableRegion`, `ridges`, `beside`; region names; the ridge
  refusal in move validation; a state version bump with its migration.
- Tests: impassable placement and invariants over seeds 1 to 50 on every size and nation count;
  movement, retreat, vision and ritual reach never cross a ridge; generation time; the AI's
  behavior tests re-run.
```

**Phase 8.** Add these bullets (to the UI track's Phase 8 text):

```markdown
- The war table, Simple: oak, the linen cloth, the start zoom with its oak band, lean back.
- The sheet bake per zoom band, with dirty re-bakes; impassable art (massifs, meres, ridges,
  names, the region card, the ✕ cursor and the no-path reason).
- Army miniatures' plaques (the badge); the siege camp mark; oak chrome tokens and brass
  keylines; code-path portraits in the strip and the outliner.
```

**Phase 9.** Add:

```markdown
- Portraits in the Commander panel (96 px), report cards and tooltips; parchment card faces and
  Codex pages; Settings → Interface → Table and Map detail. Should: personal names.
```

**Phase 10.** Add:

```markdown
- Portrait busts in the replay docks and name cards; miniature figures cut from the battle rigs.
```

**Phase 11.** Replace its bullet with:

```markdown
- All SVG placeholders, part system, tinting, procedural animations, spell particles, icons,
  chassis portraits. Manifest with fallbacks.
- The painted map: terrain stamps, settlements (tiers, kits, walls, landmarks, construction),
  land looks by dominion, scars, the repaint. Portrait SVG parts and overlays. Should: scale-pole
  motifs, painted edges, cartographic furniture, season variants, `heldSince` with roads.
```

**Phase 12.** Add:

```markdown
- The tavern floor, the month candle, brass brackets and bevels, the repaint wipe, the map
  performance pass (60 fps at 1080p with Table and Map detail Full). Should: the other props,
  the ambience, owner-made raster art. Re-run the checklist on maps with impassable terrain.
```

**Acceptance criteria.** In 3, after "every color's springs appear at least twice", add ", and impassable terrain (3 peaks, 2 meres and about 7 ridges) that never cuts the map, never touches a capital's starting neighborhood and always leaves a way around". In 14 (in the UI track's wording), after "has a distinct SVG placeholder", add "; every commander has a seeded portrait; the map draws terrain detail, settlements by population and buildings, impassable terrain, and each nation's land look by dominion". Add:

```markdown
16. The war table: the map is a painted cloth on an oak war table in a tavern; Settings offer
    Table Full / Simple / Off and Map detail Full / Reduced; the map holds 60 fps at 1080p with
    both on Full; reduced motion freezes the table's ambience.
```

**Out of scope for M1.** In the UI track's "sound other than battle SFX (no music, no UI or alert sounds)", replace the parenthesis with "(no music; no UI, alert or ambient tavern sounds)".

### 8.6 `docs/06-architecture.md`

**Repository layout.**
- Under `mapgen/`, add `impassable.ts          # peaks, meres and ridges: placement and checks`.
- Under `content/`, add `presentation/map/      # stamps, settlement kits, land looks, pole motifs, table props` and `presentation/portraits/ # portrait pools, ramps, frames`.
- Under `src/`, add these blocks:

```text
    present/map/            # PURE (guarded with src/present): stamps.ts settlement.ts land.ts
                            # scars.ts look.ts (mapLook, look keys) impassableArt.ts
    present/portrait/       # PURE: compose.ts (seeded parts, overlays, LOD)
    render/map/             # SheetBake.ts StampAtlas.ts ImpassableLayer.ts MiniatureLayer.ts
                            # Repaint.ts table/ (room.ts table.ts props.ts ambience.ts)
    render/portraits.ts     # portrait plans to Pixi textures (replay, map tooltips)
    ui/portrait/            # Portrait.tsx (inline SVG)
    assets/portraits/       # raster sets, sidecars, manifest.ts
  art-inbox/                # owner uploads (gitignored), accepted originals
  scripts/art-intake.ts     # crops, sizes, checks, sidecars, contact sheet
```

**Implementation decisions.** Add:

```markdown
- **Impassable terrain** (Phase 1b): `MapData.impassable` holds peaks and meres (ids `x0`...,
  from a counter local to mapgen), `MapProvince.ridges` the provinces across a ridge and
  `beside` the regions a province borders. `neighbors` keeps its meaning (passable), so no
  sim or AI reader changed. The state version was bumped; older maps load with none.
- **Map presentation** (Phase 8): everything the map draws is a pure function of the state
  the viewer may see (`provinceView`, the tooltip's projection) and the seed, computed in
  `src/present/map`; randomness comes from `streamFor('map:<seed>:<province>', purpose)`,
  never from `state.rng`. Static art is baked per zoom band into tiles and re-baked per
  province when its look key changes; slow parts of the key change only at a month's start.
- **Portraits** (Phase 8): `composePortrait` keys every part by `<seed>:<commander>:<slot>` and
  picks by rendezvous over append-only part tables; state picks overlays and frames only.
- Should, if built: **`ProvinceState.heldSince`** (Phase 11), set by capture and elimination,
  for roads and the "held since" line; **personal names** (Phase 9), `CommanderState.name` from
  a hash of seed, commander id and nation over content name pools, with no rng draw.
```

### 8.7 One line in the battle track

In `battle-design/final.md` S4.4, "Portraits for name cards and docks are the rig in its idle pose at 2×, on the banner color" becomes: "Portraits for name cards and docks are the commander's portrait bust (docs/09 'Leader portraits'); pretenders and summoned commanders keep their rig in its portrait pose." This changes no docs text the battle track lands, only its S6.1 roster component's image source.

