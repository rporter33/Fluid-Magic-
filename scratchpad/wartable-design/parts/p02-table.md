
---

## 2. The war table and the tavern

### 2.1 What the player looks at

The camera looks straight down at an oiled oak war table in a tavern. On the table lies a painted linen campaign cloth: the map. The cloth fills the view at the starting zoom, and a band of oak frames it. Zooming out past the cloth ("leaning back") shows the whole table, with its props in the margins and the tavern floor around it. The view is top-down and orthographic all the way out: no tilt, no parallax, no depth of field. Everything that suggests depth is painted into the art. That keeps the province shapes, label boxes and hit areas exact. The calibration sketch shows the composition at three zooms (`sketch/sketch-far.png`, `sketch-mid.png`, `sketch-near.png`).

**Layers, bottom to top, in world space.** Layers 1 to 13 are the staged spec's map layers (UI spec 2.10.1), with the new map layers of sections 1, 3 and 4 inserted (section 8 has the full list).

| # | Layer | Content | Static? |
|---|---|---|---|
| T0 | Tavern floor | the room seen from above, around the table (2.3) | baked |
| T1 | Table shadow | soft dark falloff under the table's rim | baked |
| T2 | Oak table top | the oak tile (2.2), worn edge, brass corner guards | baked |
| T3 | Table light | the hearth-side warm gradient, candle pools, and a vignette toward the table's edge. **Never over the cloth** | baked |
| T4 | Props | at most 8, in the margin only (2.5) | baked, except the mirror props |
| T5 | Cloth | contact shadow, linen ground, weave, leather hem, brass tacks, the margin's compass rose, cartouche and scale bar | baked |
| 1 to 13 | The map | staged spec 2.10.1, with the new layers | as specified |
| T6 | Ambience | candle and hearth glow sprites, dust motes in the window beam, over the table and the room only | live |

### 2.2 The table: "nice oak wood"

- **Wood.** Oiled, quarter-sawn white oak:
  - tawny grey-gold, with straight grain running left to right and silvery ray fleck;
  - darker end grain on the short edges;
  - a worn, slightly lighter top edge where elbows rest;
  - no orange "golden oak" stain. Golden Oak #A96A28 is CIEDE2000 19.5 from Ember's primary (`research-tabletop.md` 5).
- **Tones** (measured against the cloth, `tools/immersion-colors.out`):

  | Tone | Hex | Use | Against the cloth #E8DCC2 |
  |---|---|---|---|
  | Lit oak | #B08A5E | grain highlights, the worn edge | 2.3:1, ΔE 23 |
  | Oak body | #8C6A47 | the board | 3.6:1, ΔE 34 |
  | Oak shade | #5E4630 | grain lines, end grain | 6.5:1 |
  | Oak edge | #3E2E20 | the rim, the cloth's leather hem | 9.6:1 |

  The cloth reads against the table on luminance alone. Oak body is ΔE 8.9 from the Hills fill, but no terrain fill ever touches oak: the linen margin and the hem separate them.
- **Size.** The table extends 20% of the map's short side beyond the cloth on every side. The cloth adds a 26-unit margin around the map's rectangle. That margin is where the cartographic furniture sits: the map's rounded outline leaves room in the corners.
- **Hardware.** Brass corner guards (bright brass #DBBD76 lit, aged brass #7F6C24 shade) and the four brass tacks that pin the cloth. Brass is hardware at corners. It never sits beside a mana symbol and never takes a disc or drop shape: Brass Nail is ΔE 3.8 from Radiance's secondary (`research-tabletop.md` 5).

### 2.3 The tavern: "cozy but natural"

The tavern is seen from above, around the table: the same orthographic view, so there is no seam.

| Element | Where | Notes |
|---|---|---|
| Wide oak floorboards with dark seams | everywhere | straw scattered near the door |
| The hearth | the west side, off the table | firelight spills across the floor and up the table's west edge |
| A leaded window's daylight | a pale patch on the floor to the east | the "natural" light: a window as well as a fire |
| A wool rug, a bench with a folded cloak, a barrel, a stool, a hound asleep on the rug (from above, its face hidden) | around the table | cozy is safety, abundance and softness (`research-tabletop.md` 4.8) |

There are no people and no text. Nothing looms in the dark, which is what separates cozy from Inscryption's dread.

**Seasons.** The room follows the game month, using the battle backdrops' rule (`battle-design/final.md` S2.4):

| Months | Room |
|---|---|
| 11 to 2 (winter) | cool window light #CFE0EA, frost in the window corners, the hearth 20% brighter |
| 3 to 5 (spring) | fresh rushes on the floor |
| 6 to 8 (summer) | the window open, a bright patch |
| 9 to 10 (autumn) | a few leaves blown in by the door, rain streaks on the window |

A season change cross-fades over 2 s, at most four times a year. Reduced motion makes it instant.

**Art source.**
- **M1:** a procedural floor: plank lines, the seasonal light patch, the hearth gradient, and 4 flat silhouettes (rug, bench, barrel, hound) in the oak and pewter tones. It lives in `src/render/map/table/room.ts`.
- **M1-should:** an owner-made top-down raster, one per season (prompt in section 6.3), through `art-inbox/`. It replaces the procedural floor, and the procedural floor stays as the fallback.

### 2.4 Camera and zoom

| Zoom | Rule | What shows |
|---|---|---|
| **Start** | The whole cloth fits the unobscured area (UI spec 2.1) with a **32 px band of oak** on its tightest side | the Mid band on Medium at 1280x720, as the staged spec requires (about 100 px per province on the 65-cell map; the staged spec's 110 had no table) |
| **Lean back (minimum)** | The table fits the viewport (contain), times 0.92 | the whole table and its props, and the tavern floor in a frame around it (`sketch-far.png` shows the table; the floor art is in 2.3). Province names thin by the Far band's priority |
| **Near (maximum)** | unchanged from the staged spec | the Near band |
| **Pan clamp** | The view's center stays inside the table's rectangle | never the void beyond the room art |

- The camera never rotates or tilts and has no parallax: WCAG 2.3.3 names parallax as the standard trigger (`research-tabletop.md` 4.7). Wheel and pinch zoom ease over 120 ms. Reduced motion makes zoom steps instant.
- Clicking the table, a prop or the room does what clicking empty map does: it clears the selection.

### 2.5 Props

Props sit in the table's margin, never on the cloth. Their positions are fixed slots, and the variant in each slot comes from a render-side hash of the game seed, the same every reload. Each prop is decorative, or a **mirror**: it repeats a fact the chrome already shows. No prop is the only place a fact appears, and no prop is clickable in M1.

| Prop | Slot | Kind | Mirrors | Rule | When |
|---|---|---|---|---|---|
| The month candle | bottom-left | mirror | the clock's month hairline (top bar) | wax height = 1 − day/30. At the month's end, after the dominion spread, a fresh candle lights with a 0.4 s puff (instant under reduced motion) | M1 (Phase 12) |
| The hourglass | top-right | mirror | speed and pause | sand runs at the speed's rate (0, 1, 2, 4, 8 grains a second). **It lies on its side while paused**, a fourth channel beside the red tint, the PAUSED word and the hatched pips | M1-should |
| The coin purse | bottom-right | mirror | the treasury | four states: empty (0 gold); a few coins (less than one month of upkeep); a pile (up to 6 months); a heap | M1-should |
| Tankard, inkpot and quill, two dice, a folded letter with a wax seal | top-left and bottom-right | decorative | — | seeded variants (pewter or clay tankard; seal color from the nation's palette secondary) | M1-should |

**Later (M2):** a hover name on each prop; cosmetic clicks (roll the dice, pinch the candle, clink the tankard), as on Hearthstone's boards; and decorating the tavern over a campaign, as in Wartales.

### 2.6 Lighting

- **The cloth is lit by neutral daylight.** Warm light falls on the room and the table only. The cloth takes at most a **2700 K multiply of 8%**, as a gradient toward the hearth side, and no vignette. The research measured that 2700 K at 15% still passes the terrain palette rule (20.8 normal, 12.9 under protanopia), while 1900 K at 15% fails (11.3). Eight percent leaves a margin.
- **The table** carries:
  - the hearth's warm gradient on its west edge: 2000 K #FF890E, additive, 30% at the edge, gone by a third of the way in;
  - the candle pools: 2700 K #FFA757 at 30%;
  - a vignette toward its rim: #140C06, rising to 55% at the edge.
- **The room** takes the same hearth and window light and a vignette toward the screen edge.
- **The chrome** is never lit. Panels stay flat colors.
- **Time of day.** The sim has none, and a day/night cycle would recolor the map (Armello's purple nights). The seasons in 2.3 are the only link to the clock, with the month candle.

### 2.7 The chrome in oak, brass, leather and parchment

The staged `docs/09` "UI chrome" keeps its structure: dark panels, parchment text, two button styles, no mana colors in decoration. What changes is the material. Panels become dark oak. Hardware is brass. Cards get parchment faces. Leather is for spines.

**Tokens** (WCAG contrast measured, `tools/immersion-colors.out`; text #F4EEDF, ink #1C1A17):

| Token | Was | Becomes | Text | Dim text (60%) | ▲ warm / ▼ cool | Brass keyline |
|---|---|---|---|---|---|---|
| `--chrome-0` panel base, top bar | #1C1A17 | **#2E2219** dark oak | 13.35 | 5.71 | 7.12 / 7.11 | 8.50 |
| `--chrome-1` raised rows, cards | #26231F | **#3A2B1F** | 11.74 | 5.28 | 6.26 / 6.25 | 7.48 |
| `--chrome-2` hover, selected tab | #322E28 | **#4A3727** | 9.72 | 4.64 | 5.18 / 5.17 | 6.19 |
| `--leather` dock spines, tab backs | — | **#5A3A28** | 8.76 | 4.29 (**no dim text on leather**) | 4.67 / 4.66 | 5.58 |
| `--brass` keylines, brackets, rivets | — | **#DBBD76** | — | — | — | — |
| `--parchment` card faces, Codex pages | — | **#E8DCC2**, with ink text | ink 12.77 | ink at 70%: 5.53 | warm-ink #8A4A12 5.03 / cool-ink #2F5D73 5.26 | — |

All text passes WCAG AA (4.5:1). Dim text passes on every oak step and is barred from leather. `tests/content/palette.test.ts` checks every pair in this table, as it already checks `--warm` and `--cool`.

**Where material appears.**

| Place | Treatment |
|---|---|
| **Top bar** | an oak rail (`--chrome-0`), with oak grain only in its 3 px top and bottom bevels, a 1 px brass keyline along the bottom edge, and brass rivets at both ends. Readouts sit on flat color |
| **Docks and the strip** | a 6 px oak frame (grain allowed in the frame), 14 px brass corner brackets, and a leather spine on the side that faces the map. The panel body is flat `--chrome-0` |
| **Action buttons** | filled `--chrome-2` with a 1 px brass keyline (6.19:1 non-text contrast). Navigation buttons stay ghost buttons. The keyline is the "this issues a command" signal |
| **Cards** (unit, spell, chassis, battle report) | the staged frame, unchanged (rounded rectangle, header band in the nation's secondary color, symbol row), on a **parchment face with ink text**. Mana symbols on parchment get a 1 px ink ring, because W Radiance's primary #F3E6B8 nearly matches parchment |
| **Codex** | the article pane becomes a parchment page with ink text, a bound book. The topic list stays dark oak |
| **Tooltips** | unchanged in structure and behavior (the owner approved them): `--chrome-0` with a 1 px brass keyline. The gesture footer keeps dim text (5.71:1) |
| **Map mode column** | oak plaques. The active mode gets a brass keyline |
| **Alerts ribbon, toasts** | unchanged shapes and tiers. Toasts get the oak base |
| **Modals** (Research, Ledger, Settings, Game Menu) | an oak frame with brass corners and dark oak pages. Parchment is used only for cards and the Codex |
| **Focus ring** | `--text` 2 px on dark, ink 2 px on parchment (12.77:1) |

**What material never does:**
- grain never sits behind text, numbers or icons;
- brass never touches a mana symbol;
- no leather behind dim text;
- the map is never framed by more than its 6 px dock frame, so the map stays the hero.

### 2.8 Ambient motion, reduced motion, and the settings

| Motion | Parameters | Reduced motion |
|---|---|---|
| Candle flames (month candle, room candles) | brightness ±4%, value noise at 0.7 to 1.3 Hz; flame height ±3% | frozen at the mean |
| Hearth glow on the floor and the table's west edge | ±5% on a 6 s cosine | frozen at the mean |
| Dust motes in the window beam | at most 12; drift of 4 px/s; over the room and table, never the cloth | removed |
| Hourglass sand | at the speed's rate | the sand level is shown, with no stream |
| Season cross-fade | 2 s, four times a year | instant |
| Map repaints (section 4.7) | 600 ms brush wipe | instant |

Nothing flashes. Every rate is under 3 Hz and every change is under 10% brightness, well inside WCAG 2.3.1.

**Settings** (UI state in the store and the save's UI block, never in `GameState`):
- **Interface → Table:**
  - **Full** (default): the room, the table, props and ambience.
  - **Simple:** the oak table and the cloth only. No room art, no props, no motion.
  - **Off:** a flat #1C1A17 around the cloth's hem, today's look. CK3 offers the same switch, and some of its players use it.
- **Interface → Map detail:**
  - **Full** (default).
  - **Reduced:** stamps at half density, alignment motifs and scale motifs off below Near, no ambience.
  - Reduced exists for slow machines and for players who want a plainer map. It never removes information. Settlement tiers, sieges, ritual marks and impassable terrain stay.
- **Accessibility → Reduced motion** (follows the OS) also freezes the table ambience, as listed above. The staged docs/09 list ("the pulse, the idle bob and every UI tween") gains "table ambience and map repaints".

### 2.9 Ambient sound

**Out of M1.** The staged docs/10 limits M1 to battle SFX ("sound other than battle SFX (no music, no UI or alert sounds)"), and the owner has not asked for more. **Later (M2):** a hearth crackle, a soft tavern murmur, rain on the window in autumn, a quill scratch when an order is given, a coin clink when the purse changes state. They would use the battle track's procedural engine (`docs/11-sound.md`) with an "Ambience" volume slider. Each informative sound gets a visual twin. M1 ships no audio code in the map renderer.

### 2.10 Performance budget (table and room)

| Item | Budget |
|---|---|
| Draw calls for T0 to T5 | at most 6 (each layer one baked texture or one atlas batch). No filters, no runtime blur |
| Textures | oak tile 1024² (procedural, or a 2048² raster); room art at most 2048×2048 WebP and at most 1.5 MB; props atlas 1024² |
| VRAM for table and room | at most 24 MB at device pixel ratio 2 |
| Ambience per frame | at most 0.3 ms CPU (2 glow sprites, at most 12 motes) |
| Rebakes | T0 and T2 to T5 bake once per load and per season; the mirror props redraw only on their state change |
| Context loss | every baked layer is rebuilt from state and seed (`render/map/table/*.rebuild()`), as the battle track requires of its decals |

The whole map, table included, must hold docs/06's "60 fps at 1080p with all provinces and 100 army markers" with Table Full and Map detail Full. A Playwright performance smoke runs only on commits that touch `src/render/**`, as the battle design rules (D11).

