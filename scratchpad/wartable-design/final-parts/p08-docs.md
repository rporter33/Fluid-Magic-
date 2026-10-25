## Docs text

Each block names its target file, where it goes, and its exact text. docs/07 and docs/09-art are
edited **relative to the staged copies** in `/home/user/fm-docs/docs/`. docs/01, 06, 09-balance
and 10 are edited relative to the repository at `7a524b8`; the staged docs/01 adds only
the Incursions bullet in §14, which these blocks do not touch. Blocks land in the commit that
implements them: docs/01, the map rows of docs/09-balance and docs/10's Phase 1b with commit B;
the rest with Phases 8 to 12 as section 7 places them.

### `docs/01-core-rules.md`

**1. §2 "The map": add after the bullet "Seas are out of scope for M1. The generator produces a
landlocked map."**

```markdown
- **Impassable terrain (wilds).** Some of the map is wild: named mountain massifs (peaks) and
  dark lakes (meres). A wild is not a province. No one owns, enters, crosses or targets it. Two
  provinces are neighbors only where their own borders meet, so a wild between them blocks
  movement, retreat, sight, dominion spread and ritual reach alike, and everything counted in
  provinces is counted around it. Every province can still reach every other, no single province
  is the only way through, and no wild lies within 2 provinces of a capital.
```

**2. Implementation decisions, "Map generation (Phase 1)": replace the "Adjacency" bullet with:**

```markdown
- **Adjacency**: two provinces are neighbors exactly when their borders share a segment;
  cells that meet at a single point are not, and a border with a wild makes no neighbor. The
  drawn map and the graph always agree.
```

**3. Same group: replace the "Terrain" bullet with:**

```markdown
- **Terrain** is assigned by rank from simplex-noise elevation and moisture over the provinces
  (wilds are not provinces and take no terrain), so every map has exactly the terrain shares in
  `TERRAIN_SHARES`, capitals included.
```

**4. Add a group after "Map generation (Phase 1)" (after its "Starting population" bullet):**

```markdown
**Wilds (Phase 1b)**

Added on 2026-10-21 by the project owner's decision: "i want to make sure the maps have some
impassible terrain that is noticeable".
- **Count and kinds.** A map has `round(provinces / 20)` wild ranges (Small 2, Medium 3, Large 4;
  6 on Medium with 4 nations). Their kinds cycle peaks, mere, peaks. A peak range has 1, 2 or 3
  cells (weights 25, 50, 25), a mere 1 or 2 (weights 60, 40). Wild cells are extra Voronoi cells
  beyond the province count, so the count stays exact and the map grows to keep each province's
  area.
- **Placement.** Capitals are placed first, on every cell. Peak ranges then start at the
  highest-elevation eligible cell and grow into their highest eligible neighbors; meres do the
  same by moisture minus elevation. A range that cannot reach its size tries the next seed, up to
  12; an attempt that cannot place a range is retried like any failed attempt.
- **Eligible cells.** A wild cell has no vertex on the map's edge, is at least 3 cells from every
  capital, and is at least 3 cells from every other range, so no province borders two ranges.
  Removing it must leave the provinces connected, each with at least 2 neighbors, with no single
  province as the only way between two parts of the map, and with the provinces around every
  range at most 6 steps apart.
- **Everything else on the provinces.** Terrain, Wellsprings and their fairness, springs, names,
  starting population, capital distance and independent strength are placed and checked on the
  provinces that remain, as before. Each capital's 2-hop neighborhood keeps the provinces it would
  have without wilds. The balance search takes up to 10 valid maps.
- **Data.** Wilds live in `MapData.wilds` with their own ids (`w0`, `w1`, ...), never from the
  game's counter. They are never provinces and never in `neighbors`, so movement, retreat, sight,
  dominion spread, ritual reach, fort materials and the AI respect them with no rule of their
  own. Wilds are terrain: every nation sees them, with their names.
- `MapGenParams.wilds: false` reproduces the earlier maps exactly.
- **Not in M1:** impassable borders between provinces (ridges) with passes that open or close,
  fliers, chasms, roads and tunnels.
```

### `docs/09-art-direction.md` (relative to the staged copy)

**1. "Color palettes": replace the sentence "The map background is a deep parchment #E8DCC2 at the
edges fading to #1C1A17 under the UI." with:**

```markdown
The map is painted on a linen cloth (#E8DCC2) that lies on an oak war table (see "The war
table"). No light, grade or vignette ever falls on the cloth, so the colors tested below are the
colors drawn.
```

**2. "Distinct colors": replace "Every pair of terrain fills, and every pair of mana primaries"
with:**

```markdown
Every pair of terrain fills (the wild grounds included), and every pair of mana primaries
```

**3. Add a paragraph after the "Ownership bands" paragraph:**

```markdown
**Map states.** `tests/content/palette.test.ts` also covers what the map draws over the fills:
- each nation's land-look wash at its cap, against every other terrain unwashed, washed by the
  same nation and washed by another (Cinder Horde ash #8F8C88 at most 10%, Thornwood moss
  #5E7F45 at most 6%);
- fog together with land looks: unexplored provinces take a 4% linen haze and no land look; out
  of sight ones are desaturated 10% with the wash hidden;
- the wild grounds (granite #2A292C, water #24222A) against every fill, every banner and every
  map-mode color, directly or, by the band rule above, through their light rim #E9E4D8;
- map modes tint over the fill desaturated 80% and lifted to L* 50 or lighter, and data ramps
  start at L* 40, so every M1 mode color stays distinct from the wild grounds.
```

**4. "Sprite system": replace the bullet "- Portraits for commanders are the same SVG cropped at 2x
with a colored backdrop." with:**

```markdown
- Commanders have portraits of their own; see "Leader portraits". Pretenders and summoned
  commanders use their rig in its portrait pose.
```

**5. "Animation": add these rows to the table:**

```markdown
| Idle (map) | none: tokens and standees stand still on the map; the walk bob above stays |
| Map repaint | a 600 ms cross-fade over a province whose slow look changed; at most 8 at a month end, the rest instant |
| Table ambience | candle flames ±3% brightness at 0.7 to 1.3 Hz; the hearth ±4% over 7 s; at most 12 dust motes drifting 2 to 4 px/s in the window light, never over the cloth |
```

**6. "Icons": in the "Map" row, after "selection ring", add:**

```markdown
; wild (three snow-capped peaks over a row of cliff ticks); path tack (a square set as a diamond)
```

**7. "UI chrome": replace its first paragraph with:**

```markdown
The chrome stays dark and neutral so the map and the mana colors carry identity. It is framed in
the war table's materials: oak frames, aged brass hardware and leather book spines around flat
panel bodies. Mana colors never decorate chrome. They appear only on things that carry that
color.
```

**8. "UI chrome": in the token table, replace the `--keyline` row and add rows after
`--focus`:**

```markdown
| `--keyline` | 1 px `--text` at 25% | panel edges (action buttons use `--brass`) |
| `--oak-0` | #2B231C | bevels, frames and spines: the top bar, the strip, the docks' map edge, modals |
| `--oak-grain` | #3A2E23 | grain lines inside frames only, at most 1 px and 20% coverage |
| `--brass` | #B8914A | 1 px keylines on action buttons (4.62:1 on `--chrome-2`), the top bar, the docks' map edge and modal frames; 14 px corner brackets; square tacks and rivets |
| `--brass-hi` | #D4B26A | a 1 px highlight on brackets and tacks only |
| `--leather` | #4A3426 | 10 px spines of the Codex and Ledger; never under text |
| `--parchment` / `--ink` | #E8DCC2 / #1C1A17 | the battle report card and Codex article pages when the parchment option is on; ink at 70% for dim text (5.53:1) |
| `--warm-ink` / `--cool-ink` | #8A4A12 / #2F5D73 | ▲ and ▼ deltas on parchment (5.03:1, 5.26:1) |
```

**9. "UI chrome": in the "Buttons" bullet, replace "filled `--chrome-2` with a keyline" with:**

```markdown
filled `--chrome-2` with a 1 px `--brass` keyline
```

**10. "UI chrome": add after the "Cards" bullet:**

```markdown
- **Materials:** oak grain appears only in frames and bevels, never behind text, numbers or
  icons. Brass marks action buttons, the top bar's bottom edge, the docks' map edge and modal
  frames (1 px keylines), modal and dock corners (14 px L brackets with square tacks), and is
  never round. Brass never touches a mana symbol: at least 2 px of chrome lie between them, and a
  portrait's pip ring sits on a 2 px `--chrome-0` ring outside its frame. Leather is only for book
  spines. Parchment surfaces carry ink text, and a mana symbol on parchment takes a 1 px ink ring.
  Tooltips, rows and cards keep the tokens above with no texture.
```

**11. "UI chrome": append to the "Patterns" bullet:**

```markdown
 No map art, texture or ornament uses these patterns; a content test checks every texture's line
angles and coverage.
```

**12. "UI chrome": replace the "Motion" bullet with:**

```markdown
- **Motion:** panels appear without sliding. An Urgent alert pulses twice when it appears.
  Reduced motion removes the pulse, the idle bob, every UI tween and the table's ambience
  (candles and hearth freeze at their mean, dust motes are removed), and makes map repaints and
  zoom steps instant.
```

**13. Add these five sections after "UI chrome" (before "Pretender chassis art"):**

```markdown
## The war table

Added on 2026-10-21 at the owner's direction: "the overall map should be on an rustic wartable
in a cozy but natural tavern, nice oak wood".
- **The scene,** seen straight from above in one projection: the map is a painted linen cloth
  with a leather hem, pinned by four square brass tacks to an oiled, quarter-sawn white oak table
  in a village tavern. The camera never tilts; depth is painted, never simulated.
- **Oak:** tawny grey-gold, straight grain left to right, silvery ray fleck, darker end grain: lit
  #B08A5E, body #8F7459, grain #715636, shade #5E4630, edge #3E2E20. Never an orange stain.
  Rustic: three planks with square nail heads, forged iron corner straps (#4A4744), a few knife
  marks, a faint tankard ring, a worn rim.
- **The cloth** (#E8DCC2) has a 26-unit margin with the map's name in a cartouche and a compass
  rose, a leather hem (#3E2E20) and a soft contact shadow on the oak.
- **The room** around the table, from above: oak floorboards, a hearth's glow from the west, a
  window's daylight to the east, a wool rug, a bench with a folded cloak, a barrel, a stool, a
  hound asleep on the rug. No people, no text, no saturated colors beyond the hearth's small
  glow. The room may follow the seasons (winter months 11 to 2: a cooler window and a brighter
  hearth).
- **Light** falls on the room and the oak only: the hearth's warm gradient on the table's west rim,
  the candle's pool, a vignette toward the rim. The cloth is lit by neutral daylight and nothing
  grades it.
- **Props** stand in the table margin, never on the cloth, and do nothing when clicked: a month
  candle that burns down as the month passes, an hourglass that runs at the game's speed and lies
  on its side while paused, an inkpot and quill, brass dividers, a pewter tankard, dice, a bread
  board, a sealed letter, spare wooden tokens. A prop only mirrors what the chrome shows.
- **The camera** starts with the cloth inside a 32 px band of oak and leans back until the whole
  table and the tavern floor show.
- **Settings:** Table Full (room, table, props, ambience), Simple (oak and cloth only), Off (a
  plain dark surround).

## The painted map

- **Three layers.** A live fill layer (terrain fill, noise, and the land-look wash, or a mode's
  fill); a decoration layer baked per zoom band (ground textures, stamps, settlements, motifs,
  scars); an always-on layer (wilds, borders, bands, ritual, siege and pillage marks,
  Wellsprings).
- **Ground textures** are flat lightness changes within ±8% L* of the fill (±4% inside label,
  token and seat boxes): grass stipple and hedgerows, a field patchwork with furrows at 0°, 90°
  or ±30°, a canopy scallop, hachures on the hills' shadow side, scree, short water streaks, a
  crack network.
- **Standing stamps** (trees, humps, peaks, reeds, rocks) take faces from the fill's lightness (+12%
  and −18% L*) with a 1 px ink outline. They stay out of label, token and seat boxes, inset from
  the border, drawn nearest last, and cover at most 60% of a province at Mid and 75% at Near.
  Their places are seeded by the game seed and the province, so they never change between
  reloads; zooming in only adds stamps.
- **Level of detail:** Far shows 2 to 4 relief masses per province for every terrain, Mid up to
  30 stamps, Near up to 60. Information never thins.
- **Modes:** in every mode but Ownership the decoration layer fades out; the always-on layer
  stays.
- **Fog** is "not yet painted": unexplored land shows its terrain stamps as line art under a light
  haze, with a dotted border and only a sketched hut at the seat; land out of sight is painted
  but faded. Every terrain keeps a silhouette, Far included.
- **Tokens** are painted wood (nations) or pewter (independents) with a contact shadow; count
  plates stay flat. At Near the lead commander's standee may stand on its token. Path previews are
  a light thread with square brass tacks.

## Impassable terrain

Wilds are the darkest grounds on the map, so they read at every zoom, in every mode and for every
kind of color vision.
- **Peaks:** granite #2A292C under a massif of snow-capped peaks that fills the cell and may rise
  10% above it (lit faces #8A857E, flat shadow faces, snow #F2EEE6). Snow means impassable:
  passable Mountains keep small snowless peaks and a dashed footpath (#2B2620 at 75%).
- **Meres:** still water #24222A with a lighter shore band, pale ripples #8FC3D3, reeds and
  bone-white snags.
- **Every wild** has a 3 px ink contour on its outline and a light rim #E9E4D8 inside it (cliff
  ticks on peaks, a shore keyline on meres), and a name in italic, letter-spaced #E9E4D8.
- Wilds are never tinted, faded, hatched, dimmed or fogged.

## Growth and alignment on the map

The map changes as the game goes on, from state the simulation already keeps.
- **Settlements** grow by population in the Population mode's five steps (1 to 22 houses, added
  outward on a spiral, never reshuffled), with fresh roofs when a province has grown a quarter
  past its start and ruins when it has fallen a fifth below. Walls follow PD (a watchtower, a
  palisade, a stone wall, towers and a gatehouse); the keep, temple and lab are landmarks;
  construction shows scaffolding; a temple under another nation's dominion has an unlit brazier.
  The owner's architecture builds them: Cinder Horde soot roofs, ash walls and ember windows;
  Thornwood living roofs and timber; independents' fieldstone and thatch.
- **Land looks.** The dominating nation's god repaints the land by dominion strength: a ground
  wash capped by the palette test and the nation's motifs nearest the settlement first, with a
  landmark from strength 7 (Cinder Horde ash, cairns, charred trees, the burning cairn; Thornwood
  blossom, saplings, mossy stones, the elder tree). A nation without its own look takes its
  color's.
- **Scale poles** add their motifs per effective step (Order hedgerows, Turmoil broken fences,
  Lore standing stones, Fury war cairns, Growth fruit trees, Rot dead trees, Wild briars,
  Artifice mills, Sanctity wayshrines, Dread gibbets).
- **Events:** siege camps and walls cracked, breached or fallen; pillage smoke; unrest shutters
  and barricades; battle scars that turn to cairns and heal within a year; ritual marks while
  their effects last; the Wellspring monument and its claim stones.
- **Calm:** slow looks change at most once a month and are saved with the game, so a reload shows
  the same map; events show the day they happen. A change cross-fades over 600 ms. Nothing
  covers labels, bands, tokens or glyphs.

## Leader portraits

Added on 2026-10-21 at the owner's direction: "leaders certainly need portraits".
- **Every commander** has a portrait: a head-and-shoulders bust built from SVG parts for national
  commanders and independent captains, the rig's portrait pose for pretenders and summoned
  commanders, the fort emblem for a garrison holder.
- **One anchor grid** of 256 units for busts, rig portrait poses and raster portraits: the crown
  at 9%, the eye line at 39%, the chin at 66%, the collar at 78%, three-quarter view facing screen
  right.
- **Identity:** the game seed and the commander id pick every part, each by its own key, by
  rendezvous over append-only part lists, so a face never changes on reload and an art update
  keeps most faces. Independent captains draw from a no-repeat deck keyed by their province.
  Commanders carry personal names, shown as "Varo, Ash Chieftain".
- **State never changes the face.** It adds overlays (a bandage below half HP, blood below a
  quarter, the prophet's halo, the pretender's crown, a mage's eye glint, a head item over the
  headgear) and frame marks (the pip ring, the holy mark, status glyphs, the gear count and best
  tier, a dotted frame for last seen, greyscale for the dead).
- **Frames:** the shape follows the army token (round own, notched other nations, rounded square
  independents), with a band in the banner; the material shows rank: oak, bronze, aged brass, the
  god's brass with a crown notch, pewter for independents, elemental for summons. The pip ring
  sits on a dark ring outside the frame.
- **Sizes:** 256 and 128 (designer, card, name cards, Codex), 96 (Commander panel), 64 (strip,
  replay docks), 48 (tooltips), 40 (report cards, Forces), 24 (outliner), 16 (links). Below 48
  px only the silhouette, the frame and one badge are drawn.
- **Owner-made raster portraits** replace a type's procedural busts only as a complete set of 8 or
  more approved images, picked by the same seed; state then shows on the frame only.
```

**14. "Delivery rule": append:**

```markdown
Raster art made by the project owner (the oak tile, the tavern floor, portraits) is optional. It
arrives in `art-inbox/`, passes `scripts/art-intake.ts` (crop, sizes, checks, a provenance
sidecar per image, a contact sheet for approval) and lands in `src/assets/raster/` with a
manifest entry; masters stay outside the bundle in `art-source/`. Rasters in the bundle total at
most 2 MB. A portrait set is used only when complete; the procedural art is always the fallback.
```

### `docs/07-ui.md` (relative to the staged copy)

**1. "## Map" → "### Drawing": replace the whole subsection with:**

```markdown
### Drawing
- The map is a painted linen cloth on an oak war table in a tavern (docs/09 "The war table"). No
  light ever falls on the cloth; the table and the room carry the mood.
- Provinces are filled polygons: terrain color with a subtle noise texture and a 2 px border,
  painted with ground textures, terrain stamps, settlements and land looks (docs/09 "The painted
  map", "Growth and alignment on the map").
- The owner's banner forms an inner band with a keyline (docs/09). Independents have none.
- Wilds (impassable peaks and meres) are dark regions with a light rim and a name (docs/09
  "Impassable terrain"). They are not provinces.
- Draw order from the bottom: room, table, props, cloth; the fill layer (fills, noise, land-look
  washes or mode fills); the decoration layer (ground textures, stamps, settlements, motifs,
  scars); the always-on layer (wilds, borders, bands, ritual marks, siege and pillage marks,
  Wellsprings); mode overlays, labels, numbers chips, paths, army tokens, transit arrows,
  selection rings, battle markers; table ambience over the room and the oak only.
- The province tooltip and cursor label are DOM placed from Pixi coordinates.
```

**2. "### Modes": replace the "How a mode draws" bullet with:**

```markdown
- **How a mode draws:** it tints fills only, over the terrain fill desaturated and lifted to L*
  50 or lighter, so borders, bands, badges and labels stay at full contrast. Each mode has a
  second channel besides hue: wheat glyphs, hatch density, candle numbers, spring symbols. Data
  ramps start at L* 40.
- **Decoration steps aside:** in every mode but Ownership the decoration layer (ground textures,
  stamps, settlements, motifs, scars) fades out, so the mode tints a plain fill. Wilds, ritual
  marks, siege and pillage marks and Wellsprings stay. No mode, contextual mode or numbers layer
  tints, dims or hatches a wild. In Dominion mode an undominated province shows its desaturated
  terrain, never a flat grey.
```

**3. "### Labels and the density budget": add at the end:**

```markdown
- **Wild names** (one per range, unique) are labels too, with priority after Wellsprings, and take
  part in the overlap test.
- **Stamps and labels:** no standing stamp, house, motif or landmark lies in a label, token or seat
  box (plus 4 px); ground textures under those boxes drop to ±4% lightness. Standing stamps cover
  at most 60% of a province at Mid and 75% at Near. The label density test checks all of them.
```

**4. "### Army badges": add:**

```markdown
- **Material:** nation tokens read as painted wood and independents as pewter, with a fixed
  contact shadow; numbers stay on flat plates. At Near zoom the lead commander's standee may
  stand on the token (the badge box grows to hold it).
```

**5. "### Moving": add:**

```markdown
- **Wilds:** paths go around them, and the label adds "around the Ashspine" when the straight
  line to the target crosses one. Over a wild the cursor shows ✕ and "Impassable: the Ashspine";
  right-click does nothing there. When no path exists, the reason names the wild and the hostile
  province that closes the way around: "No path: the Ashspine blocks the way, and the way around
  crosses hostile Velmere."
- **Path previews** are a light thread with square brass tacks at each day mark.
```

**6. "### Province tooltip and engagement preview": add:**

```markdown
- **Wilds** have a small card: name, kind, "Impassable", the rule in one sentence, and the
  provinces it borders as links. A province's card lists the wilds it borders.
```

**7. "### Fog": replace the subsection with:**

```markdown
### Fog
- **Unexplored provinces:** "not yet painted": the fill under a light linen haze, terrain stamps
  as line-art silhouettes, a dotted border, and only a sketched hut at the seat (population
  unknown).
- **Out of sight:** painted but faded: a slightly desaturated fill and a dotted border; the
  settlement shows what the view allows.
- **Wilds** are terrain and are never fogged.
- **Fogged values** read "unknown" or a strength word, never 0. Map art and portraits use the
  same view of a province as its tooltip, so they never show more than it does.
```

**8. Add after "### Fog":**

```markdown
### The table and the camera
- The game starts with the cloth fitted to the unobscured area inside a 32 px band of oak.
  Zooming out leans back to 0.75 of the scale that fits the whole table, showing the table, its
  props and the tavern floor; zooming in pushes the table off screen.
- A wheel stop within 8% of the start zoom settles on it. `Z`, or the Fit button at the top of
  the mode column, returns there.
- Panning keeps the view's center over the table.
- Props are inert: the cursor pans through them, and a click on the table or a prop clears the
  selection.
- `H` hides the chrome and leaves the table in view.
```

**9. "## Commander panel and Battle Plan": replace "**Header:** portrait with a pip ring," with:**

```markdown
**Header:** a 96 px portrait (docs/09 "Leader portraits") with a pip ring,
```

**10. "## Bottom strip (selected commanders)": replace "- **Portrait:** opens the Commander
panel." with:**

```markdown
- **Portrait** (64 px): opens the Commander panel.
```

**11. Add a section after "## Bottom strip (selected commanders)":**

```markdown
## Leader portraits

Every commander has a portrait (docs/09 "Leader portraits"): 96 px in the Commander panel, 64 in
the bottom strip and the replay docks, 128 on name cards and Codex pages, 48 in hover tooltips,
40 in report cards and the Forces tab, 24 in the outliner, 16 beside a name in text. It is the
same person everywhere; state shows as overlays and frame marks (wounds, halo, crown, pip ring,
holy mark, status glyphs, gear). A commander the player cannot see shows its last-seen portrait,
faded, in a dotted frame. Commanders carry personal names, shown with their unit as a title:
"Varo, Ash Chieftain". Pretenders keep the name their god was given.
```

**12. "## Other screens", Settings: replace the "Interface" item with:**

```markdown
  - **Interface:** UI scale, text size, tooltip delay or Off, detail key Hold or Toggle,
    guidance, reset hints, table (Full, Simple, Off), map detail (Full, Reduced).
```

**13. "## Accessibility and feel": replace the "Motion and flashes" item with:**

```markdown
- **Motion and flashes:** reduced motion follows the OS, and also freezes the table's candles and
  hearth and makes map repaints and zoom steps instant. Screen shake defaults to 50%. The flash
  limit is always on.
```

**14. "## Keyboard and mouse": in the key table, replace the row "| WASD, arrows, drag; wheel |
pan; zoom to cursor |" with:**

```markdown
| WASD, arrows, drag; wheel; Z | pan; zoom to cursor; fit the map |
```

**15. "## Changes from the previous version of this document": add:**

```markdown
11. **The war table (2026-10-21, the owner's direction: "the overall map should be on an rustic
    wartable in a cozy but natural tavern, nice oak wood"):** the map is a painted cloth on an oak
    table in a tavern, with impassable wilds, terrain detail, settlements that grow, land that
    changes with dominion, painted tokens, leader portraits with names, and oak and brass chrome
    hardware. Table and Map detail settings and the `Z` fit key were added.
```

### `docs/09-balance.md`: rows dated 2026-10-21

**Append to the main table:**

```markdown
| 2026-10-21 | 01 §2 (owner decision) | Wild ranges | none | round(provinces / 20): Small 2, Medium 3, Large 4, Medium with 3 nations 4, with 4 nations 6, Large with 4 nations 7; kinds cycle peaks, mere, peaks | Owner direction: "impassible terrain that is noticeable". Measured on 660 maps: 35 to 40% of provinces border a wild |
| 2026-10-21 | (new) | Cells per wild range | — | peaks 1 / 2 / 3 at weights 25 / 50 / 25; mere 1 / 2 at 60 / 40 | About 9% extra cells (Medium 5.4) |
| 2026-10-21 | (new) | Wild guards | — | every cell interior; at least 3 cells from every capital and from other ranges; provinces stay connected with 2 neighbors each and no cut vertex; the provinces around a range within 6 steps; 12 seeds tried per range | 0 of 660 maps failed; each capital's 2-hop ring kept its members on all 660; largest detour 6 |
| 2026-10-21 | (new) | Map area | provinces × 6400 | (provinces + wild cells) × 6400 | Provinces keep their size |
| 2026-10-21 | 01 §2 | Capital balance search | up to 6 valid maps | up to 10 | With wilds at 6, maps within 1.5 fell to 74% (Medium, 3 nations; 79% without wilds) and 38% (4 nations; 54%); at 10: 93% and 56% (mean ratio 1.565 → 1.507). Generation on Medium: 26 ms with 2 nations, 420 ms with 4 (means) |
```

**Add after the main table (before "## Playtest checklist"):**

```markdown
### Map presentation

| Date | Doc | Field | From | To | Reason |
|------|-----|-------|------|----|--------|
| 2026-10-21 | 09 | Wild grounds | — | granite #2A292C (peaks), water #24222A (meres), rim #E9E4D8 | Darkest grounds; against the nearest fill 21.7 / 18.6 / 16.5 / 14.1 and 25.4 / 22.5 / 20.3 / 15.5 (normal / protan / deutan / tritan); every M1 banner and mode color directly, Umbra's banner by the rim |
| 2026-10-21 | 07 | Mode base | desaturated fill | desaturated 80% and lifted to L* 50 with linen (Forest 33%, Swamp 19%, Hills 12%) | Every M1 mode color passes 20 / 12 against both wild grounds |
| 2026-10-21 | 07 | Data ramp | #181E3C … #FAE6A0 | #4C5E96 #8170AC #C4808E #E6AC6E #F8E6A6 | L* 41 to 91; 24.6 / 23.9 from the wild grounds; adjacent steps at least 13 apart for normal vision |
| 2026-10-21 | 09 | Land-look wash caps | — | Cinder Horde ash #8F8C88 ≤ 10%, Thornwood moss #5E7F45 ≤ 6%, × strength / 10 | Largest that keep every pair type at 20 / 12 (12% and 8% fail: 19.8, 11.8) |
| 2026-10-21 | 07 | Fog fills | "parchment haze" | unexplored: 4% linen haze, no land look; out of sight: desaturated 10%, wash hidden | Largest that keep every terrain pair in every combination of states and land looks at 20 / 12 (20.5 / 12.2); a 35% haze gives 12.7 / 3.8 |
| 2026-10-21 | 07 | Start zoom; lean back | fit the map with a 14 px pad | the cloth fits with a 32 px oak band; lean back to 0.75 × the table's fit; a ±8% detent | The table frames the map; Medium at 1280x720 stays in the Mid band (about 95 px per province) |
| 2026-10-21 | 09 | Settlement tiers | — | `UI.popSteps` 2,000 / 5,000 / 10,000 / 20,000; houses 1–2 / 3–5 / 6–9 / 10–15 / 16–22 | One source with Population mode |
| 2026-10-21 | 09 | Thriving and declining | — | population ≥ 1.25 × start / ≤ 0.80 × start | Growth over 70 months is +15% at neutral scales, so the marks need the ratio |
| 2026-10-21 | 09 | Walls by PD | — | watchtower at 1, palisade at 5, stone wall at 15, towers and gatehouse at 25 | Four readable steps over 0 to 30 |
| 2026-10-21 | 09 | Land motifs | — | dominion 1–3 / 4–6 / 7–10 take 8% / 15% / 22% of a province's slots; a landmark from 7; pole motifs 1 per step at Mid, 2 at Near, at most 6 per axis and 30% of slots | Strength reads as reach around the settlement |
| 2026-10-21 | 09 | Stamp caps | — | per average province: Far 2 to 4 masses, Mid ≤ 30, Near ≤ 60; coverage ≤ 60% / 75% | The density budget of docs/07 |
| 2026-10-21 | 09 | Battle scars | — | churned ground for 90 days, then cairns (1 per 50 casualties, at most 4) until day 360 | A year of memory |
| 2026-10-21 | 09 | Repaint | — | 600 ms cross-fade; at most 8 animated per month end; slow looks at most monthly | A calm map |
| 2026-10-21 | 09 | Footpath on passable Mountains | — | #2B2620 at 75%, 1.5 px, dash 4 / 3 | 3.65:1 on Mountains |
| 2026-10-21 | 07 | Commander panel portrait | 64 px | 96 px | Leaders need faces (owner direction) |
| 2026-10-21 | 09 | Raster art | — | at most 2 MB in the bundle; a portrait set needs 8 images; 256 px WebP ≤ 24 KB and 64 px ≤ 4 KB each | Keeps criterion 1's 5 MB bundle |
```

**Add to "## Playtest checklist":**

```markdown
- [ ] On maps with wilds, a new player finds the way around a range without reading docs (the path preview bends and the label names the range), and a match against one Normal AI still ends by month 70 in most games.
```

### `docs/10-milestone-1.md`

**1. Add a section after "### Phase 7: AI":**

```markdown
### Phase 1b: Impassable terrain (owner decision 2026-10-21)
- The owner's direction: "i want to make sure the maps have some impassible terrain that is
  noticeable". Rules in `docs/01-core-rules.md` §2 and its Implementation decisions ("Wilds").
- Commit A (any time): `mapgen/wilds.ts` behind `MapGenParams.wilds` (default false),
  `MapData.wilds` with the next `STATE_VERSION` and its migration (`wilds: []`), the new
  `validateMap` checks and tests; a hash recorded from the earlier generator proves that maps
  with wilds off are unchanged.
- Commit B (the owner's decision, after A): wilds on in New Game and `sim:aivai`; `MAPGEN.balanceCandidates`
  10; seed-pinned fixtures re-pinned; 20 AI games re-measured and the matchup recorded.
- Tests: exact province count and terrain shares with wilds; interior wilds at least 3 cells
  from capitals and from each other; no cut vertex; detours of at most 6; capital rings
  unchanged; paths, sight, rituals and spread go around wilds; generation time.
```

**2. "### Phase 8": append (after the UI track's replacement text, if it has landed):**

```markdown
- The war table and wild art (`docs/09` "The war table", "Impassable terrain"), at most about a
  quarter of this phase's diff: the Simple table (procedural oak with iron straps, the cloth,
  square tacks); the camera's start zoom with its oak band, lean back, clamp, detent and the Fit
  button (`Z`); the fill, decoration and always-on map layers; wild grounds, rims, stamps, names,
  hover cards, the ✕ cursor, "around the" labels and the no-path reason; the footpath on
  passable Mountains; siege camps, wall states and the Wellspring monument; painted wood and
  pewter tokens and brass-tack paths; the lifted mode base and data ramp; portrait v0 (code-path
  busts with allegiance frames, rank materials and the pip ring's separation ring) in the strip,
  outliner, Commander panel and tooltips; the brass action keyline.
- Tests: the palette test with wild grounds, banners and mode colors; the label test with wild
  labels and token boxes; the fog guard over the map look and portraits.
- Anything of the above not done when this phase's tests pass moves to Phase 11 and is noted in
  `docs/PROGRESS.md`. The game is playable with flat fills.
```

**3. "### Phase 9": append:**

```markdown
- Chrome hardware (oak bevels and frames, brass keylines and brackets, leather spines); the Full
  table (the procedural tavern floor, hearth and window light, the candle pool, the rim
  vignette); Settings → Interface → Table and Map detail; portrait overlays, badges and the gear
  chip, and portraits on report cards; `scripts/art-intake.ts` and the raster manifest.
- Should: the static table props; personal names; the parchment report card and Codex pages if
  the owner chose them.
```

**4. "### Phase 10": append:**

```markdown
- Portrait busts in the replay docks, name cards and result card; the replay modal in the oak and
  brass frame.
```

**5. "### Phase 11": append after its bullet:**

```markdown
- The painted map: ground textures, terrain stamps and Far masses with level of detail; fog line
  art; settlements (tiers, thriving and declining, walls, landmarks, scaffolds, kits); land looks
  by dominion and pole motifs; battle scars, unrest marks, pillage smoke; slow looks saved in the
  UI block with the monthly cross-fade; the portrait SVG part library. Should: standees at Near.
  The map art shares this phase's time budget with the unit SVGs; past it, the cut order in the
  war-table design applies.
```

**6. "### Phase 12": append:**

```markdown
- The map's performance pass (60 fps at 1080p with Table and Map detail Full, Large with 4
  nations). Re-run the checklist on maps with wilds. Should: the month candle and hourglass, the
  table's ambience, the room's seasons, the brush-wipe repaint, owner raster sets that arrived
  complete.
```

**7. Acceptance criteria. Replace criterion 3 with:**

```markdown
3. Map: 60-province landlocked Medium map with 3 impassable wild ranges, all provinces
   connected with no single province as the only way through, capitals ≥ 6 apart with no wild
   within 2 provinces of a capital, 3 Wellsprings ≥ 3 from capitals, every color's springs
   appear at least twice.
```

**Append to criterion 4:**

```markdown
 Art never changes the state: the purity test guards `src/present`, and the state hash is equal
with every Table and Map detail setting.
```

**Append to criterion 14:**

```markdown
 Every commander has a seeded portrait with an allegiance frame, a rank material and state
overlays. The map shows terrain detail, settlements by population, walls by PD, buildings,
impassable wilds, and each province's land look by dominion and scales.
```

**Add a criterion (numbered after any the other tracks add):**

```markdown
16. The war table: the map is a painted cloth on an oak war table in a tavern, framed by an oak
    band at the start zoom and shown whole with the tavern floor when leaning back; Settings
    offer Table Full / Simple / Off and Map detail Full / Reduced; the map holds 60 fps at 1080p
    with both on Full; reduced motion freezes the table's ambience.
```

**8. "## Out of scope for M1": replace "sound outside battle replays (map, menus, UI)" with:**

```markdown
sound outside battle replays (map and tavern ambience, menus, UI)
```

### `docs/12-battle-presentation.md` (the battle track's doc, two lines)

**1. S4.4, replace the bullet "- **Portraits** for name cards and docks are the rig in its idle
pose at 2×, on the banner color." with:**

```markdown
- **Portraits** for name cards and docks are the commander's portrait (docs/09 "Leader
  portraits"); pretenders and summoned commanders keep their rig in its portrait pose, on the
  banner color.
```

**2. S6.2, replace "- Portraits for name cards and docks come from the same SVG at 2×, and
chassis portraits from the 128×128 SVGs." with:**

```markdown
- Portraits for name cards and docks come from the commander's portrait (docs/09 "Leader
  portraits"); pretenders and summoned commanders use their rig's portrait pose (docs/05,
  pretender B.8).
```

### `docs/06-architecture.md`

**1. "## Repository layout": under `mapgen/`, add after `validate.ts`:**

```text
      wilds.ts            # impassable wild ranges: placement, outline, names (Phase 1b)
```

**2. Under `src/`, add after `ai/` (the battle track adds `present/rand.ts` and `present/battle/`):**

```text
    present/              # PURE presentation derivations, guarded like sim
      map/
        look.ts           # mapLook: slow and fast look keys from the viewer's fogged view
        scatter.ts        # scatterProvince: seeded stamp slots per province and layer
        anchors.ts        # provinceAnchors: label, token, seat
        settlement.ts     # tiers, the house spiral, walls, landmarks
        land.ts           # land looks and pole motifs by dominion and scales
        wilds.ts          # wild stamps, rims, barrierOnLine
        fx.ts             # map cues and marks (pretender design C.4)
      portrait/
        spec.ts           # portraitSpec: parts, frame, overlays, badges from commander and view
        svg.ts            # portraitSvg: a pure SVG string builder
      names.ts            # assignNames: personal names dealt from per-nation decks
```

**3. Under `render/`, replace the three lines `MapRenderer.ts`, `ProvinceLayer.ts ArmyLayer.ts
LabelLayer.ts` and `camera.ts` with:**

```text
      MapRenderer.ts      # Pixi app for the strategic map
      camera.ts           # start zoom, lean back, detent, clamp, fit
      map/
        table/            # room.ts table.ts props.ts light.ts ambience.ts
        FillLayer.ts      # live fills, noise, washes and mode tints
        DecorationBake.ts # per-band baked tiles; lazy Near tiles; dirty re-bakes; cross-fades
        AlwaysOnLayer.ts  # wilds, borders, bands, ritual, siege, pillage and Wellspring marks
        LabelLayer.ts TokenLayer.ts
      portraits.ts        # portrait SVG to cached textures for the replay and map tooltips
```

**4. Under `content/`, add:**

```text
      presentation/       # presentation data; never imported by sim, mapgen or ai
        map/              # textures, stamps, kits, LAND_LOOKS, COLOR_LAND_LOOKS, POLE_MOTIFS, caps
        table.ts          # table, props, light and ambience numbers
        portraits.ts      # PORTRAIT_POOLS, ramps, PORTRAIT_RANK, overlays
        names.ts          # COMMANDER_NAMES per color and for independents
```

**5. Under `assets/`, add `raster/` (owner art taken in by the intake script, with
`manifest.ts`); at the top level add `art-inbox/` (owner drops, gitignored) and `art-source/`
(masters, outside the bundle); under `scripts/`, add `art-intake.ts` (`npm run art:intake`).**

**6. "## Save and load": add after the `STATE_VERSION` 2 bullet:**

```markdown
- The next `STATE_VERSION` (Phase 1b) adds `map.wilds`, the impassable wild ranges; the
  migration sets it to `[]`, so an older map has none.
- The save file's UI block (never `GameState`) also holds presentation state: the map's slow
  look keys with their month index, so a reload shows the same map, and commanders' personal
  names. The sim never reads it.
```

**7. "## Performance targets": replace the map line with:**

```markdown
- Map render: 60 fps at 1080p with all provinces, 100 army markers, the Full table and full map
  detail; at most 4 draw calls and no filters for the table and room; the decoration layer baked
  per zoom band (Near lazily in 512² tiles); GPU memory for table and map at most 96 MB on a
  Large 4-nation map at device pixel ratio 2.
```

**8. "## Implementation decisions": add:**

```markdown
- **Wilds** (Phase 1b): `MapData.wilds` holds impassable regions that are not provinces, with ids
  from a counter local to mapgen. They are never in `neighbors`, so movement, retreat, sight,
  dominion, rituals, fort materials and the AI needed no code to respect them.
- **Map presentation** (Phases 8 and 11): everything the map shows beyond the sim's numbers is
  derived by pure functions in `src/present/**` from state, the viewer's fogged view and the save
  file's UI block, never stored in `GameState`. Random choices hash the game seed with a stable id
  through `src/present/rand.ts`; `state.rng`, `Math.random` and wall time are forbidden there by
  the purity guard. Slow looks change only at month boundaries and are saved in the UI block;
  information events change the look the day they happen.
- **Portraits and names** (Phases 8, 9 and 11): `portraitSpec` keys every part by seed, commander
  and slot and picks by rendezvous over append-only part tables; state picks overlays and frames
  only. Personal names are dealt from per-nation decks after each simulated day and kept in the
  UI block.
```

---
