## 2. The war table and the tavern

### 2.1 What the player looks at

The camera looks straight down at an oiled oak war table in a village tavern. On the table lies a
painted linen campaign cloth, the map, pinned at its corners with square brass tacks. At the
start zoom the cloth fills the view inside a 32 px band of oak, with iron corner straps and the
edges of props showing in the band. Zooming out ("leaning back") shows the whole table, its
props, and the tavern floor around it. The projection is top-down and orthographic all the way
out: no tilt, no parallax, no depth of field, no perspective backdrop. Depth is painted, never
simulated, so province shapes, label boxes and hit areas stay exact.

**Layers, bottom to top, in world space:**

| # | Layer | Content | Static? |
|---|---|---|---|
| T0 | Room | the tavern floor seen from above (2.4) | baked once, and per season (M1-should) |
| T1 | Table shadow | a soft dark falloff under the table's rim | baked |
| T2 | Oak top and edge | the oak tile, plank seams, iron corner straps, knife marks, tankard ring, worn rim (2.2) | baked |
| T3 | Table light | hearth gradient, candle pool, rim vignette; masked off the cloth | baked |
| T4 | Props | in the table margin only (2.5) | baked, except the two mirror props |
| T5 | Cloth | contact shadow, linen, leather hem, square brass tacks, cartouche, compass rose (2.3) | baked |
| M | The map | fill, decoration and always-on layers, then labels, chips, paths, tokens, arrows, rings, markers (3.1) | as specified |
| T6 | Ambience | candle and hearth glow sprites, dust motes; over the room and the oak only | live |

### 2.2 The table: "rustic", "nice oak wood"

- **Wood.** Oiled, quarter-sawn white oak: tawny grey-gold, straight grain running left to right,
  silvery ray fleck, darker end grain on the short edges, a worn and slightly lighter top edge
  where elbows rest. No orange "golden oak" stain (Golden Oak #A96A28 is 19.5 from Ember's
  primary, `research-tabletop.md` 5).
- **Tones** (WCAG against the cloth #E8DCC2, `final-calc/colors-extra.out`):

  | Tone | Hex | Use | Against the cloth |
  |---|---|---|---|
  | Lit oak | #B08A5E | grain highlights, the worn rim | 2.33:1 |
  | Oak body | #8F7459 | the boards | 3.21:1 |
  | Grain | #715636 | grain lines, plank seams | 5.00:1 |
  | Oak shade | #5E4630 | end grain, knife marks | 6.45:1 |
  | Oak edge | #3E2E20 | the rounded rim, the cloth's leather hem | 9.56:1 |
  | Forged iron | #4A4744, nail heads #2B2A28 with a #6E6A64 highlight | corner straps | 6.79:1 |

- **Rustic details**, baked into T2 and seeded by `streamFor(\`table:${seed}\`, 'detail')`:
  - three wide planks across the short side, with dark seams and two square nail heads at each
    plank end;
  - forged iron straps wrapping the four corners, each with three square nail heads;
  - 3 to 5 short knife marks near the bread board's slot;
  - one faint tankard ring (a 1 px #5E4630 circle at 35%, broken in two places) near the
    tankard's slot;
  - a worn, lighter rim along the long edge nearest the viewer's chair (the bottom edge).
- **Size.** The table extends 0.35 × the cloth's height beyond the cloth on every side. The room
  extends 0.5 × the table's height beyond the table.
- **Art source.** M1: a procedural tile (1024², grain from value noise along x, ray fleck as
  faint #BB9E7C ellipses, seams and nails as paths). M1-should: the owner's 1024² seamless oak
  tile (prompt A1), with the procedural tile as the fallback.

### 2.3 The cloth

- Painted linen #E8DCC2 with fiber flecks (short strokes at random angles, ±3% L\*) that show only
  in the margin; the terrain fills cover them. Never a woven grid, which would read as the
  cross-hatch docs/09 reserves for starving.
- A 26-unit margin around the map's rounded outline, a 4-unit leather hem #3E2E20, a soft contact
  shadow on the oak (#000 at 35%, offset 3 px toward the lower right, blur baked).
- Four **square** brass tacks #B8914A with a 1 px #D4B26A highlight on two edges.
- In the margin: a title cartouche at the top center with the map's seeded name in Marcellus SC,
  ink #1C1A17 (12.8:1), for example "The Ember Marches" (`mapTitle(seed)`, presentation only);
  a compass rose in the corner the map's rounded outline leaves empty (upper right). Both never
  touch a province.
- The map's rounded outline is a 3 px ink line. No light, grade, vignette or season tint ever
  falls on the cloth (R19).

### 2.4 The tavern: "cozy but natural"

Seen from above, around the table, in the same projection, so there is no seam.

| Element | Where | Drawing (procedural M1; owner raster M1-should, prompt A2) |
|---|---|---|
| Wide oak floorboards with dark seams | everywhere | planks #3A2C20, seams #1E1712, lit planks #5A4430 |
| The hearth | beyond the table's west side | its warm glow spills across the floor and onto the table's west rim |
| A leaded window's daylight | a pale patch on the floor to the east | the "natural" light: a window as well as a fire |
| A wool rug | under the table's south side | undyed wool #6B5A48 with a plain border #8A7560 |
| A bench with a folded cloak; a barrel with iron hoops; a three-legged stool | around the table | browns #4E3A28, #5E4630; cloak #5A5148 |
| A hound asleep on the rug, seen from above, head tucked away | south-west | #7A6450, shade #5A4636 |
| Straw near the door | the south edge | a few #B89A5A strokes |

No people, no text, no banners, no weapons. Nothing looms in the dark, which separates cozy from
dread. No saturated reds, oranges, greens or blues anywhere in the room except the hearth's
small glow, so nothing reads as a mana color or a banner.

**Seasons (M1-should).** The room follows the game month with the battle backdrops' months
(`docs/12-battle-presentation.md` S2.4):

| Months | Room |
|---|---|
| 11 to 2 (winter) | cool window patch #CFE0EA, frost in the window corners, the hearth glow 20% stronger |
| 3 to 5 (spring) | fresh rushes on the floor |
| 6 to 8 (summer) | a brighter, warmer window patch #FFF1D6 |
| 9 to 10 (autumn) | a few leaves by the door, rain streaks in the window patch |

A season change cross-fades over 2 s, at most four times a year, and is instant under reduced
motion. Never on the cloth.

### 2.5 Props

Props stand in the table margin, never on the cloth. Each sits in a fixed slot beside a cloth
corner or edge, centered 0.06 × the cloth's height outside the hem, so its inner third shows in
the oak band at the start zoom. Variants come from `streamFor(\`table:${seed}\`, 'props')`, the
same on every reload.

**Props are inert in M1.** They have no hover and no click; the cursor pans through them, and a
click on one does what a click on bare table does (it clears the selection). Each is decorative,
or a **mirror** of a fact the chrome already shows. No prop is ever the only home of a fact.

| Prop | Slot | Kind | Rule | When |
|---|---|---|---|---|
| Month candle in an iron holder | upper left | mirror of the clock's month hairline | wax height = `1 − day/30`; at the month's end, after the spread, a fresh candle lights with a 0.4 s puff (instant under reduced motion) | M1-should (Phase 12) |
| Hourglass | upper right | mirror of speed and pause | sand runs at the speed's rate (0, 1, 2, 4, 8 grains a second); **it lies on its side while paused**, a fourth channel beside the red tint, PAUSED and the hatched pips | M1-should (Phase 12) |
| Inkpot and quill; brass dividers | lower left | decorative | dividers in aged brass, square pivot | M1-should (Phase 9) |
| Pewter tankard; two bone dice | lower right | decorative | pewter #91A092 or clay, seeded | M1-should (Phase 9) |
| Bread board with a heel of bread and a knife | bottom edge | decorative | the knife marks (2.2) sit beside it | M1-should (Phase 9) |
| Folded letter with a dark wax seal (#4A2A1C) | top edge | decorative | — | M1-should (Phase 9) |
| Six spare unpainted wooden tokens | left edge | decorative | the same shield shapes as the army tokens, bare wood | M1-should (Phase 9) |

Later (M2): hover names, cosmetic clicks, props that change over a campaign.

### 2.6 Lighting

- **The cloth is lit by neutral daylight.** Nothing grades it (R19).
- **The table** (T3, every effect masked off the cloth):
  - the hearth's warm gradient on the west rim: 2000 K #FF890E, additive, 20% at the rim, gone
    by 30% of the table's width;
  - the month candle's pool: 2700 K #FFA757 at 25%, radius 0.12 × the cloth's height (with the
    candle only);
  - a vignette toward the table's rim: #140C06 rising to 45% at the rim.
- **The room** (T0): the hearth glow on the floor (#FF890E radial, 30%), the window patch
  (#F2EBDD at 14%, or the season's), and a vignette toward the screen edge (#0E0905 to 50%).
- **The chrome** is never lit.
- **Time of day** is never used: the sim has none, and a whole-board shift hurts reading.

### 2.7 Camera and zoom

| Zoom | Rule | What shows |
|---|---|---|
| **Start** | the cloth fits the unobscured area (staged docs/07) with a **32 px oak band** on its tightest side | the Mid band: on Medium at 1280×720, about 1.07 px per unit and 95 px per province |
| **Lean back** (minimum) | 0.75 × the scale at which the whole table fits the view | the whole table, its props, and a ring of tavern floor; on Medium the map is in the Far band |
| **Near** (maximum) | the median province is 420 px across | the Near band; no oak on screen |
| **Pan clamp** | the view's center stays inside the table's rectangle | never the void beyond the room |
| **Detent** | a wheel stop within ±8% of the start zoom settles to it 150 ms after the last wheel event, over 200 ms (instant under reduced motion) | the standard view is easy to find |
| **Fit** | `Z`, or the Fit button at the top of the mode column | returns to the start zoom (`Home` stays the capital) |

- The camera never rotates or tilts and has no parallax. Wheel and pinch zoom ease over 120 ms;
  reduced motion makes zoom steps instant.
- `H` (hide chrome) leaves the table in view, which doubles as a screenshot mode.
- Zoom bands still come from the median province's on-screen diameter, so the table changes no
  band rule.

### 2.8 The chrome in oak, brass and leather

The staged docs/09 "UI chrome" keeps its structure and every token value. The chrome reads as the
table's furniture: oak frames and brass hardware around the approved dark panel bodies.

**New tokens** (WCAG measured in `judge2-calc/checks.out` and `final-calc/colors-final.out`):

| Token | Value | Use | Measured |
|---|---|---|---|
| `--oak-0` | #2B231C | 3 px bevels of the top bar, 6 px dock frames, the strip's top spine, 8 px modal frames | text 13.34, dim 5.74, `--warm` 7.12, `--cool` 7.10 (no text sits on it today) |
| `--oak-grain` | #3A2E23 | grain lines inside frames only, at most 1 px and 20% coverage | worst case under text: text 11.37, dim 5.16 |
| `--brass` | #B8914A | 1 px keylines (action buttons, the top bar's bottom edge, the docks' map-facing edges, modal frames); 14 px L-shaped corner brackets; square tacks and rivets | 5.94 on `--chrome-0`, 4.62 on `--chrome-2`, 4.51 on grain (non-text needs 3) |
| `--brass-hi` | #D4B26A | a 1 px highlight on brackets and tacks only | never within 2 px of a mana symbol (1.5 from Radiance's secondary) |
| `--leather` | #4A3426 | 10 px spines of the Codex and Ledger modals, with square brass stitch marks at 40% | never under text |
| `--parchment`, `--ink` | #E8DCC2, #1C1A17 | the battle report card's face and Codex article pages (M1-should, owner A/B) | ink 12.77, ink at 70% 5.53 |
| `--warm-ink`, `--cool-ink` | #8A4A12, #2F5D73 | ▲ and ▼ deltas on parchment | 5.03, 5.26 |

**Where material appears:**

| Place | Treatment |
|---|---|
| Top bar | the `--chrome-0` body unchanged; 3 px oak bevels top and bottom; a 1 px brass keyline on the bottom edge; square brass rivets at both ends |
| Bottom strip | the body unchanged; a 6 px oak spine on top with a 1 px brass keyline |
| Docks | bodies unchanged; a 6 px oak frame on the map-facing edge with a 1 px brass keyline; 14 px brass corner brackets at its two map-facing corners |
| Modals (Research, Ledger, Codex, Settings, Game Menu, the report card, the replay) | an 8 px oak frame with 14 px brass corner brackets and square tacks; bodies unchanged. The replay modal shares the hardware, so the battle stage does not feel like another game |
| Codex and Ledger | a 10 px leather spine on the left edge |
| Action buttons | the 1 px keyline becomes `--brass` (4.62:1); the staged keyline (text at 25%) measures 2.10:1, under WCAG 1.4.11's 3:1 |
| Battle report card and Codex article pages | parchment with ink text, only if the owner picks it in the mockup's A/B (M1-should). Mana symbols on parchment take a 1 px ink ring (Radiance's primary is 1.09:1 on parchment) |
| Tooltips, the alerts ribbon, the outliner, panel rows and cards, the mode column, toasts | unchanged (approved) |

**What material never does:** grain never sits behind text, numbers or icons; brass never touches
a mana symbol (at least 2 px of chrome between them); brass is never round; leather never carries
text; the map is framed by no more than a dock's 6 px edge, so it stays the hero.

**The warm retune was measured and rejected** (R27). The mockup shows both versions side by side
(mockup step 9).

### 2.9 Ambient motion and reduced motion

| Motion | Parameters | Reduced motion |
|---|---|---|
| Candle flame | brightness ±3% and height ±2% from seeded value noise at 0.7 to 1.3 Hz | frozen at the mean |
| Hearth glow (floor and the table's west rim) | brightness ±4% on a 7 s cosine | frozen at the mean |
| Dust motes in the window light | at most 12, drifting 2 to 4 px/s; over the room and oak only | removed |
| Hourglass sand | at the speed's rate | the level shows, no stream |
| Season change | 2 s cross-fade, four times a year | instant |
| Map repaints | section 4.7 | instant |

- Nothing flashes: every rate is under 3 Hz and every change under 10% brightness (WCAG 2.3.1).
- Ambience updates at most 30 times a second and stops while the tab is hidden, while the replay
  modal is open, and while no table pixel is on screen.
- The staged docs/09 motion list ("the pulse, the idle bob and every UI tween") gains "table
  ambience and map repaints".

### 2.10 Ambient sound

Out of M1. docs/10 rules out "music, sound outside battle replays (map, menus, UI)", and the
owner has not asked for more. M2: a hearth crackle, a soft murmur, rain on the window in autumn,
a quill scratch on an order, synthesized by the battle track's recipe engine
(`docs/12-battle-presentation.md` S3) behind an "Ambience" slider. M1 ships no audio code in the
map renderer.

### 2.11 Settings (UI state in the store and the save's UI block, never in `GameState`)

- **Interface → Table:** Full (the room, the table, props, ambience; the default from Phase 9),
  Simple (oak and cloth, a still room gradient, no props, no ambience; Phase 8's only mode), Off
  (a flat #15130F around the cloth's hem, today's look).
- **Interface → Map detail:** Full (default), or Reduced: terrain stamps at half density, pole
  motifs off, ambience off. Reduced never removes information: settlements, walls, land-look
  washes and nation motifs, scars, ritual and siege marks, wilds and tokens stay.
- **Accessibility → Reduced motion** (follows the OS) also freezes the table's ambience and makes
  repaints instant.

### 2.12 Performance budgets

| Item | Budget |
|---|---|
| Draw calls for T0 to T5 | at most 4 (room, oak, props atlas, cloth); no filters, no runtime blur |
| Textures | oak tile 1024² (procedural, or the owner's WebP ≤ 250 KB); room ≤ 1536 × 1024 (procedural, or WebP ≤ 400 KB); props atlas 1024²; vignette 256² |
| Ambience | ≤ 0.3 ms CPU per frame (2 glow sprites, ≤ 12 motes) |
| GPU memory, table and map together | ≤ 96 MB on a Large 4-nation map at device pixel ratio 2 (3.8) |
| Rebakes | the room once per load and per season; the oak and cloth once per load; mirror props only when their state changes |
| Context loss | every baked layer is rebuilt from state and seed (`render/map/*.rebuild()`) |
| Frame | docs/06's "60 fps at 1080p with all provinces and 100 army markers" holds with Table Full and Map detail Full. A Playwright performance smoke runs on commits that touch `src/render/**` (battle design D11) |

---
