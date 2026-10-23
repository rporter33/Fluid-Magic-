> Status: proposed 2026-10-22 from the owner's visual references (`visual-references.owner-direction.md`), pending the owner's review of the mockups. Paths starting `scratchpad/` are the design workspace, outside the repo.

# Reference analysis: the owner's eight screenshots (visual direction v4)

2026-10-22. The input is the owner's direction in `docs/design/visual-references.owner-direction.md`, which is binding,
and eight screenshots of another fantasy strategy game that is still in development (`scratchpad/visual-refs/ref-1.png`
to `ref-8.png`). Each screenshot is 2868 × 1320 and was captured from a video of a development build. They are
references for direction only. Nothing in this file copies their art, models, layouts, names, symbols or UI, and
nothing was traced. The other game is not named here, and it must never be named in an image prompt.

The current Fluid Magic (FM) design they are compared with is:

- `docs/09-art-direction.md`, `docs/07-ui.md`, `docs/12-battle-presentation.md` and `docs/04-battle.md`;
- the v3 mockup screenshots (`scratchpad/ui-mockup/v3-*.png`) and their design, `handdrawn-design/final.md`;
- the palette decision, `palette-ab/decision.md` (view B, the painted fills).

## 0. In ten lines

1. **The map reads as one landscape first and as territory second.** The terrain is painted continuously across
   province borders: dark forest masses, a range lit and shaded in relief, teal rivers and lakes. Ownership sits on
   top of it as a thin colored outline inside each province plus a translucent tint.
2. **It is low-key and quiet.** Zoomed in, the median L\* is 34 (5th to 95th percentile 12 to 47), and only 0.5% of
   pixels have OKLCH chroma above 0.12. The few saturated things on screen carry information: border rails, token
   rims, the selected province.
3. **Value carries the terrain.** Forest is at L\* 19 to 21 and open grass at 39 to 46, the same hue family about
   20 L\* apart. Water is told apart by hue (teal, 186°), mountains by light and shade faces with almost no chroma,
   and snow by lightness (66).
4. **Detail sits below icon scale.** Tree crowns are 1 to 3 px stipple that reads as a mass, never as stamps that
   compete with tokens. At a blur-robust coarse scale the zoomed-in map is about half as busy as v3 at Near and a
   third as busy as v3 at Mid (§1, §4).
5. **The map carries no text.** No province names, no numbers and no badges appear on the land. An army is one
   miniature figure on a round base with a rim in the owner's color. A town is a small walled ring on a larger base.
   About 10% of the screen is UI.
6. **Zoomed out, the land is a sculpted model.** Its plateaus end in dark rock cliffs that drop into a near-black void.
   Mountains stand up in relief. The owner tint and the thin rails still show whose land is whose, and the tokens keep
   their size.
7. **Battles are seen from a three-quarter overhead camera.** The battle line runs diagonally across the screen over
   a plain, low-texture ground. Each side is a set of rectangular blocks with one small figure per soldier. Blocks are
   about 70 to 200 figures, 5 to 13 ranks deep, and face the enemy.
8. **Sides read by value against the ground and by hue family.** Armies are dark to mid (L\* 15 to 44) on light sand or
   snow (60 to 73), cool blues against warm reds and purples. Monsters break the palette on purpose: a saturated red
   dragon (OKLCH C 0.18) or a pale giant (L\* 78), 6 to 7 soldiers tall, each with a large soft shadow.
9. **Effects are small, many and wordless.** Arrows fly as parallel dark dashes in volleys of dozens. A few sparks, one
   beam and one glowing orb appear. Blood shows as ground stains along the seams where lines meet, and the fallen
   stay. No damage numbers float.
10. **The battle UI hugs the edges and covers about 6% of the screen.** It has one bar of up to 18 unit cards along the
    bottom, four small transport buttons at the top right, formation and ability buttons at the bottom right, and a
    four-line hover card (name, hitpoint bar, morale bar, status word).

FM differs on nearly every one of these points. Section 8 lists each difference and what it means for our rules.
The three that bear on the rules most are these:

- Provinces have one terrain each, but the reference paints continuous terrain.
- Our battles have rows but no positions or maneuver, and no rivers or bridges.
- Our squads are 10 to 60 troops (300 per side in a big battle), where the reference shows thousands of figures.

## 1. Method and caveats

- **Reading.** Every image was opened at full size and in crops (hover card, card bar, controls, tokens, borders,
  formations, monsters, cliffs). Readings that could not be measured are marked "by eye".
- **Colors.** Each color is the median of a patch, converted from sRGB to CIELAB and OKLCH
  (`visual-v4/tools/v4color.py`). Every patch was checked on a contact sheet before its value was used.
- **Busyness (clutter).** Each image is scaled so its game area is 1440 px wide (v3's shots already are) and
  averaged into 6 px cells. The figure is the share of neighboring cells whose L\* differs by more than 10 (or by more
  than 20). A fine-scale gradient metric was tried first and rejected: the references are soft video captures and v3
  is a lossless render, so a 1 px blur alone changes v3's fine-scale figure by a factor of 2.5. The coarse metric does
  not depend on that softness.
- **Color differences.** These use the repo's own `tests/content/colorMath.ts` (CIEDE2000, and Machado 2009 for color
  vision deficiencies), imported read-only.
- **Sizes.** Every size is converted to a 1440 px wide game area, the scale of v3's shots and of `docs/07`'s pixel
  figures. In the captures the game area is about 1630 of 2000 display px wide; the rest is black bars from the phone
  capture.
- **Camera angles.** These are estimated from the ellipses that round objects make on screen (token bases, fallen
  shields), assuming an orthographic view. They are approximate.
- **What the captures can and cannot show.** This is a development build. The UI panels use debug labels and
  monospace text, fps counters are on, and the window title bars are visible. The sparse UI is therefore partly
  unfinished, not a design to copy (§7). Video encoding may shift colors slightly.

### 1.1 Numbers used throughout

| View (world area only, UI excluded) | L\* p5 / p50 / p95 | L\* sd | OKLCH C mean / p90 | Pixels with C > 0.12 | Coarse busyness ΔL\* > 10 / > 20 |
|---|---|---|---|---|---|
| ref-2, map zoomed in | 12 / 34 / 47 | 11.2 | 0.063 / 0.096 | 0.5% | 11.4% / 1.9% |
| ref-3, map further out | 1 / 41 / 61 | 18.2 | 0.033 / 0.068 | 0.1% | 13.6% / 4.4% |
| ref-4, map further out | 1 / 21 / 41 | 15.4 | 0.043 / 0.072 | 0.2% | 13.3% / 3.5% |
| ref-1, battle on sand | 19 / 61 / 64 | 15.2 | 0.067 / 0.085 | 1.5% | 12.8% / 3.1% |
| ref-5, battle on sand | 19 / 61 / 65 | 14.7 | 0.066 / 0.086 | 1.7% | 12.7% / 2.9% |
| ref-6, battle on snow at a bridge | 26 / 65 / 77 | 16.4 | 0.060 / 0.096 | 0.4% | 19.1% / 6.6% |
| ref-7, battle at a fort wall | 13 / 38 / 44 | 9.9 | 0.021 / 0.033 | 0.0% | 7.5% / 0.7% |
| ref-8, battle at a river | 12 / 36 / 41 | 8.7 | 0.032 / 0.044 | 0.0% | 8.0% / 0.7% |
| v3 start view, cloth only (Mid, `v3-m70`) | 15 / 47 / 82 | 22.8 | 0.060 / 0.128 | 10.9% | 43.1% / 16.4% |
| v3 Mid, cloth only (`v3-desktop`) | 16 / 47 / 83 | 22.8 | 0.063 / 0.135 | 11.2% | 40.3% / 14.9% |
| v3 Near (`v3-near`) | 19 / 62 / 82 | 23.7 | 0.081 / 0.155 | 23.0% | 25.8% / 8.6% |
| v3 Far, cloth only (`v3-far`) | 16 / 47 / 83 | 22.9 | 0.065 / 0.140 | 12.5% | 47.4% / 17.9% |

v3 Near shows provinces larger on screen than ref-2 does: about 300 to 450 px across, against 135 to 235. That should
make it the calmer view. Even so, v3 Near is more than twice as busy, has about twice the value spread, and has 46
times the share of strongly saturated pixels. At the start zoom the gap is about 3×.

## 2. The map zoomed in (ref-2)

### 2.1 Palette and values

| Patch | Median | L\* | OKLCH C | Hue |
|---|---|---|---|---|
| Dense forest | #203309 | 18.8 | 0.069 | 131 |
| Forest, another mass | #283611 | 20.5 | 0.061 | 128 |
| Open grass | #5D5E23 | 38.6 | 0.080 | 110 |
| Light grass | #66742B | 46.3 | 0.099 | 119 |
| River or lake | #015D56 | 35.0 | 0.075 | 186 |
| Lake | #015954 | 33.5 | 0.072 | 188 |
| Mountain, lit face | #766F6B | 47.3 | 0.011 | 52 |
| Mountain, shade face | #514949 | 31.8 | 0.011 | 18 |
| Land under an orange owner's tint | #5C4610 | 31.1 | 0.075 | 85 |

- **The key is low and the range narrow.** Nothing on the land is lighter than about L\* 50 except the small lights
  on mountain ridges and the token rims. The hues are olive and moss greens, teal water, and grey and slate rock with
  a faint violet cast in the shadows. The world has no pure white and no pure black.
- **Forest against grass is mainly a value step** (about 20 L\*) within one hue family. It is not a hue change.
- **Water and land are close in value** (water 34 to 35, grass 39 to 46) but far apart in hue: teal at 186° against
  olive at 110 to 120°. That is the blue-yellow axis, which color-blind players still see.
- **Mountains have almost no chroma** (C 0.011). They read only through light: lit faces at 47, shade at 32, with
  snow-dusted ridges catching the highlights.

### 2.2 How the terrain is drawn

- **Forest masses** are large, irregular clumps, 50 to 250 px across, with soft, feathered edges. Inside them, tree
  crowns are a 1 to 3 px stipple that reads as texture, never as individual icons. The masses ignore province
  borders: one wood spans three provinces in ref-2.
- **Open land** is a smooth olive ground with low-contrast mottling (patch L\* sd 6 to 7) and faint lighter streaks.
  It carries no fields, hedges or houses as decoration.
- **Relief** is a real height field lit from the upper left. A long range on the right shows ridges, valleys and lit
  and shaded faces, with snow on the ridges. Thin, pale borders run straight over it. The mountains are provinces
  with owners, not impassable walls.
- **Water:**
  - A wide river or strait and a lake, flat teal with a slightly darker edge.
  - A narrow river ribbon, 6 to 10 px, that meanders across several provinces.
  - A small stone bridge over the strait.
  - The large water body is itself split into regions with blue rails, so water regions are owned too.
- **Roads:** none are visible at this zoom. In ref-4 one grey road winds across several provinces with one bridge. The
  region panel in ref-3 lists roads as a province property.

### 2.3 Borders and tint

- **Every province draws its own outline,** inset a few pixels from the true border. Two neighbors therefore show two
  parallel rails, about 5.5 to 7.5 px apart on a 1440 px screen, each 1.8 to 2.5 px wide and in its own owner's
  color (measured in crops at 5×). Each rail has a lighter core and a slightly darker edge, a built-in keyline that
  lifts it off any ground. The edges are straight polygon segments with no wobble, from a low-poly, Voronoi-like
  layout.
- **Rail colors** are orange-red, yellow-green, blue, teal, violet and pink-red for owners, and a pale grey-white for
  unowned land.
- **Tint (by eye):**
  - Owned land takes a translucent overlay of the owner's color: barely visible for the yellow-green owner in ref-2,
    clear for the orange owner (ref-2), stronger for the teal and violet owners (ref-3), and strong over the red
    owner's whole realm (ref-4).
  - The tint shifts hue but keeps the terrain's value pattern, so forests and relief still read through it.
  - The selected or hovered province takes a markedly stronger tint, so the hierarchy is: untinted, lightly tinted,
    strongly tinted.
- **Where two owners meet,** each side keeps its own rail. A border between two owners is therefore a pair of
  differently colored rails with no ink line.

### 2.4 Tokens and their size against provinces

On a 1440 px screen in ref-2:

- **Provinces** are about 135 to 235 px across, around the 180 px boundary between FM's Mid and Near zoom bands.
- **An army** is one painted miniature figure, about 31 to 36 px tall, standing on a round black base about 31 px
  wide with a rim in the owner's color (white for independents). Cavalry armies show a rider. The base is about a
  sixth of a province's width.
- **A town or fort** is a ring of wall, palisade or stone, about 71 px wide (about 40% of a province), on a base with
  the owner's rim. One figure stands inside, and at closer zoom the keep or a building rises inside the ring.
- **Density:** about 14 armies and 4 towns across roughly 25 provinces, under one token per province on average.
- **No token carries a number, a flag or a status glyph.** An army's size appears only in the side panel.
- **Every token casts a short contact shadow** toward the lower right.

### 2.5 Text and UI on screen

- **On the land:** nothing. There are no names, counts, chips or icons.
- **The chrome,** about 10% of the screen in all:
  - a nation-and-gold pill at the top left;
  - a menu button at the top right;
  - a bar of unit cards for the selected army at the bottom left (9 cards, the same component as the battle's card
    bar);
  - a dark blue side panel at the right with the selected army's or province's facts;
  - a turn counter and End Turn button.
- **The game is turn-based.** It has no clock and no speeds.
- **Text strings on screen:** about 9 in ref-2 and about 16 in ref-3, where the province panel is open.

### 2.6 Camera

- **The view is tilted and in perspective.** Round bases read as ellipses about 0.43 as tall as wide, and far land is
  foreshortened.
- **Estimated pitch:** about 30 to 40° above the ground plane at this zoom. The camera does not rotate, and north
  stays roughly up.

## 3. The map zoomed out (ref-3, ref-4)

- **The land is a terrain model.** In ref-3, land plates end in near-vertical rock cliffs of dark slate and violet
  (#26263F, L\* 16) that drop into a near-black void (L\* 1, with faint star specks in one corner). Chasms of void also
  cut inside the map, splitting it into plateaus, so impassable ground is a gap, not a painted mark. In ref-4 one small
  bridge crosses a chasm.
- **Mountains stand up.** In ref-4 the ridges cast shade on the ground, and the cliff faces turned toward the camera
  show as tall dark walls. Seeing them depends on the tilt.
- **The owner's realm is tinted as a whole.** In ref-4 the red owner's tint (#61383D to #714F4D, L\* 29 to 37) colors
  every province it holds. The thin red rails trace each province, and a small green and pale region at the right
  reads as another owner at once.
- **Snow regions** (ref-3) are warm grey (#A9A098, L\* 66) where unowned. They turn green-teal under the teal owner and
  violet-grey under the violet one. The rails stay crisp on the light ground.
- **Tokens keep their on-screen size** and are still miniatures (about 25 to 31 px figures). They grow relative to
  provinces as the view pulls back. Towns show walls and a keep. No labels appear at any zoom.
- **Rivers and roads** stay visible as thin lines. A river in ref-3 runs from province to province and over a cliff edge
  into the void.
- **The measures** (§1.1): ref-3 and ref-4 have the widest value range of all eight (L\* sd 15 to 18), because the void
  and the cliffs are near black. Their coarse busyness is 13 to 14%, still about a third of v3 at Mid or Far.

## 4. Why the map reads clean

1. **The landscape is continuous and big-shaped.** The ground is one painted surface, and forests and ranges are large
   masses that cross borders. Province shapes come only from thin rails. The eye sees a place before it sees a grid.
2. **Information owns the saturation.** The land is muted (C over 0.12 on 0.5% of pixels). The rails, token rims and
   selected tint are the brightest, most saturated things, so they pop without size or weight.
3. **Value is the terrain code.** Dark forest, mid grass, light snow, teal water and grey lit rock can each be read in
   grayscale, so no terrain needs a loud hue.
4. **Detail is texture, not icons.** Below about 3 px, detail fuses into surfaces. Nothing in the scenery is the size of
   a token, so scenery never competes with tokens.
5. **Information is sparse and categorical.** One figure per army, one ring per town, owner color on rails and rims.
   Numbers and names live in one panel that opens on selection.
6. **Hierarchy comes from tint strength:** none, light, strong (selected). There are no outlines on top of outlines.
7. **Things are physical.** One light falls from the upper left. Tokens and towns cast shadows, and miniatures stand on
   bases.
8. **There is a frame.** Zoomed out, the cliff edge and the void make the land an object and give impassable ground a
   shape that cannot be misread.

## 5. Battles (ref-1, ref-5, ref-6, ref-7, ref-8)

### 5.1 Camera and composition

- **The camera is three-quarter overhead with mild perspective.** Far figures are slightly smaller. Fallen round
  shields read as ellipses about 0.55 to 0.6 as tall as wide, which gives an estimated pitch of 35 to 45° above the
  ground. It is steeper than the map's camera.
- **The battle line runs diagonally,** from lower left to upper right in every shot. Both sides' blocks show their
  depth and their front, and the screen fills with ground and troops rather than sky. The horizon is never in view.
- **The camera frames the action,** not a fixed stage. In every shot some blocks are cut by the screen edges.
- **No side is fixed to a screen side.** Each army comes from wherever the terrain puts it.

### 5.2 Ground and terrain features

| Patch | Median | L\* | OKLCH C | Hue |
|---|---|---|---|---|
| Sand, ref-1 | #B09561 | 63.0 | 0.077 | 83 |
| Sand with grass, ref-5 | #A78E4E | 60.0 | 0.089 | 89 |
| Snow, ref-6 | #ABB2D6 | 73.1 | 0.052 | 276 |
| River on snow, ref-6 | #00767A | 44.7 | 0.087 | 199 |
| Bridge deck, ref-6 | #B4A0B1 | 68.0 | 0.033 | 331 |
| Mud and dust, ref-7 | #635959 | 38.8 | 0.013 | 18 |
| Fort wall, ref-7 | #272228 | 14.0 | 0.013 | 321 |
| Sand bank, ref-8 | #625A50 | 38.7 | 0.019 | 73 |
| River, ref-8 | #435367 | 34.7 | 0.039 | 254 |

- **The ground is one plain surface.** Within a patch the L\* spread is 0.4 to 5, with only faint streaks, grass tufts
  and a few shrubs and rocks along banks. It is a stage, not a scene.
- **The features are few, large and simple.** They give the fight its shape:
  - ref-6: a broad stone bridge with two arches over a saturated teal river in snow.
  - ref-7: a long dark wall with a gate arch, its cracks glowing red.
  - ref-8: a slate-blue river crossed by two stone bridges, with pebbles and shrubs along the banks.
- **One sharply saturated element is allowed per scene** (the teal river, the red dragon, a pink beam). Everything
  else is muted.

### 5.3 Formations (by eye, from crops)

| Shot | Block | Files × ranks | Figures |
|---|---|---|---|
| ref-1 | blue line facing a dark mass | about 33 × 6 | about 200 |
| ref-5 | red pike square | about 9 × 8 | about 70 |
| ref-6 | red infantry on the bridge | about 10 × 13 | about 130 |
| ref-7 | pale block in an echelon of three | about 12 × 6 | about 70 |
| ref-8 | rear blue block | about 16 × 5 | about 80 |

- **One figure per soldier.** Figures are 16 to 25 px tall on a 1440 px screen, about 1.1 to 1.7% of the screen
  width.
- **Blocks have crisp rectangular outlines** with files about 1.6 to 1.9 figure widths apart and ranks about as far.
  The block, not the figure, is what the eye reads.
- **Facing:** every figure in a block faces the same way, square to the block's front and toward the enemy. Pikes and
  spears slant forward together, which shows the facing even at figure scale.
- **Each block is one unit type** and one shade. Within a side, unit types vary in shade (crimson, rose and pale pink
  on one side in ref-8; slate blue and grey-blue on the other).
- **The two sides are two hue families:** cool blue, teal and slate against warm crimson, purple, orange and red.
- **In contact, two looks appear:**
  - Two lines meet along a thin seam and keep their shape: ref-1, ref-5, ref-6.
  - The lines dissolve into a mixed crowd where their colors interleave: the gate in ref-7, the bridgehead in ref-8.
- **Maneuver is visible.** Echelons, angled lines, cavalry swinging round, and a wider line wrapping a narrower one all
  appear.
- **Army size:** each side fields up to 18 blocks (the card bar), so a screen holds several hundred to about two
  thousand figures.

### 5.4 Cavalry and commanders

- **Cavalry** forms looser clumps of riders, about 1.5× an infantry footprint. Riders are pale against tan horses, so
  they read as a different type at a glance. In ref-5 the cavalry pours into the side of a dark infantry mass.
- **A lone mounted leader** stands well behind the lines on a white horse (ref-7, ref-8), easy to find because it is
  alone. Leader cards carry a small star.

### 5.5 Monsters at scale

- **They are drawn at true size:**
  - ref-1 and ref-5: a red dragon about 7 soldiers tall and 17 long;
  - ref-6: a pale giant about 6 soldiers tall, fighting inside a teal block;
  - ref-7: a horned brute about 6 soldiers tall.
- **They read through three channels at once:** size, a palette break (dragon OKLCH C 0.18, against at most about 0.09
  elsewhere; giant L\* 78 among L\* 37 soldiers), and a large soft cast shadow on the ground.
- **Selection** is a thin cyan-white outline around the monster (the dragon in ref-1, the brute in ref-7). The other
  shots do not show it.
- **A monster stands among soldiers** without a base or a ring, and soldiers crowd around its feet.

### 5.6 Projectiles and spells

- **Arrows** are short dark dashes, about 1 to 2.5 px by 10 to 15 px on a 1440 px screen.
  - A volley is dozens of them, all at one angle, in a loose band between the shooters and the target. Volleys are
    visible across the sky region of ref-5 and ref-8.
  - Spent arrows stick in the ground in front of the target (ref-1, under the dragon).
- **Spells:**
  - a pink-red beam across a third of the screen (ref-6), with golden embers and sparks spattering the struck block;
  - a glowing yellow orb (ref-7, ref-8);
  - a red glow on the giant's weapon.
- **Effects are additive light** on muted ground. There is no floating text and no damage numbers.

### 5.7 Blood and the dead

- **Blood is ground stains:** dark red-brown smears and pools along the seams where lines meet. On snow and on the
  bridge deck it shows pink-red (ref-6). It marks where the fighting happened, not each hit.
- **The fallen stay on the field** (ref-6): bodies lie flat with their round shields in front of a block, a line of
  ellipses.

### 5.8 The unit card bar

- **Size:** 18 cards in every battle shot. Each card is about 55 × 62 px on a 1440 px screen, and the bar runs about
  78% of the screen width from the bottom left, about 7.8% of the screen height. The map's army bar (ref-2, ref-4) uses
  the same card.
- **Card face:** a dark navy body with a full-body render of the unit type, not a face portrait, on a dark red-brown
  floor. There are no numbers and no names.
- **Status icons** sit in a column down the card's left edge, with one marker at the top right:

  | Icon | Meaning |
  |---|---|
  | Green shield | by eye, a defensive stance |
  | Face icon (green, yellow-green, yellow or orange-red) | by eye, morale state |
  | Crossed swords | engaged |
  | Red square at the right | meaning unknown, perhaps taking losses |
  | Small star at the top right | leader |

- **States:**
  - Selected: a light gold border.
  - Destroyed or routed (by eye): washed out to pale grey.
- **Only the player's side is shown.** The enemy has no bar.

### 5.9 The hover card

- **Four lines of serif text near the cursor, about 150 px wide.** There is no panel: white text with a dark outline
  sits straight on the ground.
  - Line 1: the unit's name.
  - Line 2: "Hitpoints", a red bar and a current/max pair.
  - Line 3: "Morale", a teal bar and figures.
  - Line 4: one status word in red.
- **The hovered block lightens** (the blue line in ref-1 shows a lighter teal half). The hovered or selected monster
  gets the outline.

### 5.10 Play controls and other buttons

- **Top right:** four dark navy squares of about 33 px (play, fast forward, pause, menu). The active control has a warm
  outline. A debug fps counter sits beside them.
- **What is absent:** no scrubber, no clock, no round counter, no speed numbers.
- **Bottom right:**
  - three deployment presets drawn as diagrams of colored squares: a red row in front, a blue row behind, green on the
    flanks and a yellow leader square at the back;
  - a settings gear;
  - above them, two army-wide ability buttons with white glyphs (a flame, a bird, and other glyphs in ref-7).
  - Read by eye: the player can change formation and use abilities during the battle.

### 5.11 Text and UI share

| Element | Share or count |
|---|---|
| UI area | about 6% of the screen (card bar about 5%, two button clusters about 1%) |
| Text on the field | none, except the hover card |
| Battle UI under FM's spec, `docs/12` S4.6 at 1920 × 1080, docks open | about 62% of the screen unobscured |
| Same, docks collapsed to 72 px | about 81% unobscured |

The `docs/12` HUD has these parts:

- a 48 px top bar;
- a strength bar;
- an 88 px transport;
- 280 px docks on both sides;
- a four-line ticker, name cards and damage numbers (on by default).

## 6. Why the battles read clean

1. **One plain ground at one value.** Light ground under dark armies (sand, snow), or the reverse, so every block is a
   silhouette. Coarse busyness is 7.5 to 13% on plain ground and 19% on the busiest scene (snow, river and bridge).
2. **The unit of reading is the block.** Rectangles are units in order, ragged blobs are melee, a lone figure is a
   leader, a giant figure is a monster. The geometry tells the story with no text.
3. **Sides by hue family, types by shade.** That gives two levels of grouping with no badges.
4. **Saturation is reserved** for one scene element, monsters and spell light.
5. **The diagonal composition** shows fronts and depth at once.
6. **Effects are plentiful but small:** arrows as dashes, sparks as points, blood as stains. The amount reads as
   intensity without clutter.
7. **The UI sits at the edges,** is iconic, and shows the player's side only. Detail comes on hover.

## 7. What not to take

- **The development build's chrome:**
  - snake_case labels;
  - monospace debug panels with raw property lists;
  - fps counters;
  - navy panels with neon edges;
  - debug-precision morale figures.

  The owner liked the land and the battles, not that chrome. FM's layered UI is owner-approved and stays.
- **Names:** any name, unit name, nation name or label seen in the shots.
- **Specific designs:** any specific model, card frame, icon glyph (the flame, the bird, the formation diagrams as
  drawn), the token or town model designs, or the screen layout.
- **The rules the shots imply:** turn-based play, live control in battle, sea regions.

Section 8 decides which of these FM wants as its own rules.

## 8. Differences, point by point, and what each means for our rules

### 8.1 The map

**M1. Terrain per province.**

- **References:** terrain is continuous and independent of borders. Forests, ranges and rivers span several provinces.
- **FM today:** each province is one terrain (`mapgen/terrain.ts` ranks per-province elevation and moisture) painted as
  one wash. "Brooks and ponds are pale scenery inside one province", and "rivers between provinces" were cut (final.md,
  "The design in sixteen lines", items 6 and 12).
- **What it means for our rules:**
  - The sim keeps one terrain per province, because defense, supply and movement read it.
  - The renderer needs a world terrain field built from the per-province terrain plus noise. Each province's painted
    cover must be dominated by its sim terrain, for example at least 70% of its area, with transitions only in a band
    near the border.
  - A test should hold the shares, so the picture never contradicts the tooltip. This is presentation only, with no
    rule change.

**M2. Relief.**

- **References:** a lit height field, mountains as ranges, snow on ridges.
- **FM today:** stamps per province (humps, hachures, ridge peaks), "one light from the upper left" on stamps only, and
  "never a sheet-wide gradient" (R19).
- **What it means for our rules:**
  - Mapgen already samples an elevation per province, and Mountains and Hills come from it. A continuous height field
    can be derived from those values plus seeded noise, in presentation code.
  - Wild peaks are the highest ground and meres the lowest.
  - A hill-shade is a sheet-wide light, so R19 and docs/09's "no light falls on the cloth" must be replaced if relief
    is lit.

**M3. Rivers, lakes, bridges, sea.**

- **References:** rivers cross borders, water regions are owned, bridges sit at crossings.
- **FM today:** no rivers between provinces, no sea. Dark water is always an impassable mere (a wild).
- **What it means for our rules:**
  - A river between provinces implies a barrier our rules lack. Either keep water inside provinces (v3's ruling) or
    add a river rule in M2: rivers along some borders, a crossing cost in movement days or a battle penalty for the
    attacker, bridges as free crossings.
  - A rule touches mapgen, movement, `findPathFor`, the battle setup, the AI and the tests.
  - Sea and coast are out of M1 scope.

**M4. The map's edge and impassable ground.**

- **References:** cliffs into a void, chasms inside the map, at least one bridge over a chasm.
- **FM today:** a rounded-rectangle cloth with a neatline. Wilds are peaks (granite) and meres, with a 3 px contour and
  a light rim.
- **What it means for our rules:**
  - A cliff skirt around the outline is decoration with no rule. The owner's default is that the model sits on the oak
    table, so the cliffs drop to the oak, not into a void.
  - A chasm would be a new wild kind (content and mapgen), held to the existing wild rules: at most about 9% of the
    map, never near a capital, a way around within 6 provinces.
  - Raised peaks and sunken meres already fit the model look.
  - A bridge over a chasm would make a wild passable, so it should not be shown.

**M5. Borders.**

- **References:** two inset rails per border, each 1.8 to 2.5 px with a light core, straight segments, owner colors, a
  pale rail for unowned land.
- **FM today:** hand-ruled wobbling ink borders, 2 px #2B2620 (±12% width), plus banner bands B = max(2.5, 0.0314 × the
  median province diameter), capped at 9 px, with a keyline (docs/09 band rule).
- **What it means for our rules:**
  - The band rule (banner against fill, or keyline against both, at 20/12) assumes a flat fill and a band. A 2 px rail
    over painted, varied terrain needs a restated rule:
    - the rail's core or edge must reach 20/12, or a WCAG contrast floor, against the terrain pixels along that border,
      measured on the bake;
    - for every banner;
    - in every tint state.
  - The double rail gives each province a closed outline, which also makes the hover and hit area obvious.
  - The wobble may stay or go. The references are straight.

**M6. Owner tint.**

- **References:** a translucent owner tint, by eye 20 to 35%, stronger on selection.
- **FM today:** ownership is the band only. Land looks (dominion) are washes capped at 10% (Cinder ash) and 6%
  (Thornwood moss). Fog is a 4% haze or a 10% desaturation, and the palette tests cover those states.
- **What it means for our rules:**
  - Two washes, owner tint and dominion look, on one province would turn to mud and break the measured 20/12 margins,
    which are already thin (20.2/12.2 for B).
  - The design must pick one:
    - the owner tint replaces the band, and dominion keeps motifs only; or
    - the tint is dominion and ownership stays with the rails.
  - Whichever wins, every tint level joins `palette.test.ts`'s Ownership states.

**M7. Army tokens.**

- **References:** one miniature on a round base with an owner-color rim, no number, no glyph, about a sixth of a
  province.
- **FM today:** shield badges by allegiance (rounded, notched, plain), a troop count on a flat plate, one exception
  glyph, a stack count ×n, and a standee only at Near. Painted wood or pewter.
- **What it means for our rules:**
  - Allegiance by shape moves to the base (rim color plus a shape on the rim, so color is never the only channel).
  - The count leaves the always-on surface. docs/07 principle 2 ("decisions on the surface") still holds: the
    engagement preview prints both sides' strength where the player decides.
  - Status glyphs show only by exception and only on hover or selection, or as one small mark on the base.
  - Stacks become several figures on one base, or a ×n mark on hover.
  - The army badge tests and docs/09's icon table change. No sim rule changes.

**M8. Towns.**

- **References:** a walled ring on a base, about 40% of a province, with a figure inside.
- **FM today:** settlements grow by population (1 to 22 houses on a spiral). Walls follow PD; keep, temple and lab are
  landmarks; looks follow alignment. All owner-approved.
- **What it means for our rules:**
  - Keep the growth: houses grow inside the ring, and the ring's wall follows PD (palisade, stone, towers).
  - The ring on a base gives the seat a fixed footprint, which also fixes label and token zones.
  - No rule change.

**M9. Labels and markers.**

- **References:** none on the land at any zoom.
- **FM today:**
  - The v3 start view (`v3-m70`) shows 53 place names, 8 region and wild names, about 50 PD plates, badges and 5 alert
    icons on the map.
  - docs/07 shows names at Far by priority and at Mid always.
  - docs/09 says "Information never thins".
- **What it means for our rules:**
  - The owner's direction is "labels and markers kept to what the zoom level needs". Make it a density budget per zoom:
    - Mid shows the capitals, Wellsprings, wild names and the hovered or selected province's name;
    - Near shows names;
    - PD and other numbers go to the numbers layer (the `` ` `` key) or the tooltip.
  - "Information never thins" becomes "information is one gesture away" (docs/07's L0 and L1 layers).
  - The label density tests and the Mid line-2 chips change.

**M10. Tracks.**

- **References:** a few roads; roads are a province property.
- **FM today:** a dotted track joins every pair of neighbors, live at Mid and Near (final.md, "The design in sixteen
  lines", item 5).
- **What it means for our rules:**
  - Every neighbor pair is marchable anyway, so tracks carry no rule. They add busyness.
  - Show the path preview when moving, and keep at most a few cosmetic roads between seats.
  - No rule change. A road rule (faster movement) would be new and is not proposed.

**M11. Value and palette.**

- **References:**
  - Low key: open land at L\* 39 to 46, forest 19 to 21, water 34, snow 66, lit rock 47.
  - Narrow range (sd 11).
  - 0.5% of pixels above C 0.12.
- **FM today:**
  - Approved fills are high-key: Plains #C1D29F at L\* about 81, Farmland #EEBA3A.
  - B fills: Plains #D4DCC0 at L\* 86.5, Mountains at 73.7, Forest at 23.7. On B the open land is the lightest
    terrain, like paper.
  - v3 Near: L\* sd 23.7, 23% of pixels above C 0.12.
- **What it means for our rules:**
  - The references put open land in the middle of the range and keep light for snow, highlights and information.
  - Taken flat, the references' natural colors fail docs/09's distinct-colors rule (§8.3, X1), because they rely on
    texture and relief.
  - So either tune a low-key natural palette that still passes 20/12 as flat terrain colors (with each province's
    painted mean within a stated ΔE of its terrain color), or state and measure a replacement rule. Note that the
    palette A/B found texture statistics identified terrain only 48% of the time, so a replacement needs a measured
    recognizer, not an argument.

**M12. Camera and framing.**

- **References:**
  - A tilted perspective view (pitch about 30 to 40°).
  - At the default zoom, 20 to 30 provinces at 135 to 235 px each.
  - The world fills about 90% of the screen.
- **FM today:**
  - docs/09 says "The camera never tilts; depth is painted, never simulated".
  - The start view fits the whole cloth inside 32 px of oak. In v3 the cloth is 29% of the game frame, table and room
    another 28%.
  - Provinces are 60 to 80 px at the start.
- **What it means for our rules:**
  - Start closer, around the capital, at the Mid/Near boundary. Keep the table and tavern for zooming out (the owner
    keeps them).
  - Choose between:
    - top-down with lit relief and painted cliff skirts, which is cheapest, keeps docs/09's projection, hit tests and
      labels, and keeps pillar 5's "flat 2D";
    - a fixed oblique 2.5D view with no perspective: y squashed, cliff faces and upright sprites, depth sorting;
    - real perspective, which is a mesh projection in Pixi, with harder picking and label placement.
  - None of them is a sim change. All of them change docs/09's war table section.

**M13. Fog.**

- **References:** not shown.
- **FM today:** "not yet painted": a linen haze, line-art stamps, dotted borders.
- **What it means for our rules:** the line-art metaphor belongs to the parchment look. A terrain model needs a new
  fog: unexplored land as a grey unlit model or a cloud layer, out-of-sight land darker and desaturated. The fog's
  palette states must be measured again. The visibility rules do not change.

**M14. Map modes.**

- **References:** not shown.
- **FM today:** a mode tints a desaturated fill (L\* 50 or lighter), and decoration fades.
- **What it means for our rules:** the same mechanism works on the terrain model (desaturate and lift the bake, tint by
  data). The mode colors' 20/12 distance from the wild grounds must be measured again if the grounds become a void,
  cliffs or chasms.

**M15. The chrome on the map screen.**

- **References:** about 10% of the screen, about 9 to 16 strings.
- **FM today:** a top bar with about 15 readouts, the alerts ribbon, a right dock (outliner and feed) open by default,
  and the bottom strip on selection. Chrome is about 43% of the game frame at 1440 × 900.
- **What it means for our rules:**
  - The layers are owner-approved ("the UI is fluid"), so keep them.
  - Change one default: the right dock starts collapsed to its 48 px rail at every width (docs/07 already defines the
    rail for narrow screens). The top bar, the alerts ribbon and the strip stay as they are.
  - Rules: none. docs/07's layout defaults change.

**M16. Unit cards on the map.**

- **References:** the selected army's units as a row of full-body cards, the same component as in battle.
- **FM today:** the bottom strip shows a commander's squads with icons, counts and a portrait (a bust).
- **What it means for our rules:** one card component for the strip, the battle bar and the recruit tab means full-body
  art per unit type (rig pose or raster). Commanders keep their portraits. Content gains a card look per unit and
  validation fixtures per CLAUDE.md.

### 8.2 Battles

**B1. Camera and stage.**

- **References:** three-quarter overhead, a diagonal battle line, a terrain field, no fixed screen side.
- **FM today:** `docs/12` S2.4: a side view, a 1600 × 900 world, the player always on the left, a horizon at y = 300,
  four parallax backdrop layers, and six depth lanes.
- **What it means for our rules:**
  - The stage is re-laid out on a ground plane. Rows (front, middle, rear) become depth bands behind each side's front.
    The six lanes become lateral slots along the line.
  - "Player always on the left" becomes "player at the near side (bottom), facing up". A diagonal tilt is optional.
  - The S2.4 world, bands, perspective scale and backdrops are rewritten. S1's per-blow truth is untouched.

**B2. Maneuver.**

- **References:** echelons, angled lines, cavalry swinging into a flank, a wide line wrapping a narrow one.
- **FM today:** docs/04 says "no columns in M1; a row is a bag of squads". Motion is closing by speed (rounds 2 to 4),
  advancing into an emptied row, and routing off. Melee targets are random troops in the engaged row, and there is no
  flank rule.
- **What it means for our rules:**
  - The picture may show only what the rules contain:
    - an approach timed to each unit's closing round;
    - contact;
    - the advance when the target row empties (S2.4's clash-line rule);
    - routs toward the own edge.
  - A wider front wrapping a narrower one is honest, because every troop in an engaged row fights.
  - A flank charge with a visible effect would imply a rule. Lateral placement is cosmetic, so it must not suggest
    one.
  - Real maneuver (positions, facing, flanks) would be a new battle model, outside M1.

**B3. Figures per soldier.**

- **References:** one figure per soldier, blocks of 70 to 200, up to 18 blocks per side, about 16 to 25 px figures at
  1440 px.
- **FM today:**
  - Proxies (S2.5): at most 20/12/6/4/2/1 sprites per squad by size; dynamic files; ghost bodies (D1).
  - A size-1 troop is 46 wu tall in a 1600 wu world, about 2.9% of the width.
  - Real armies: `starting` is 32 per side; `clash300` is 300 per side in 6 or 7 squads of about 43.
- **What it means for our rules:**
  - Our counts are small enough to draw literally. 600 figures is well within reach for batched Pixi 8 sprites, still
    to be measured in the lab.
  - One figure per troop up to a cap per side (a content number) retires proxies, files and ghost bodies for nearly
    every battle, and makes detailed-mode attribution literal.
  - D1, S2.5 and parts of S2.6 change. The sim does not.
  - The catch: early battles will look small, 30 against 30, not the references' thousands. Frame the camera to the
    armies; never multiply figures, which would break D1's rule that a block never lies about strength.

**B4. Block shape.**

- **References:** crisp rectangles, 5 to 13 ranks, files about 1.7 figure widths apart, all facing the enemy, weapons
  slanting together.
- **FM today:** S2.4 grids are 4 × 5 for size 1 down to 1 × 1, with fixed spacing per size.
- **What it means for our rules:**
  - Formation look becomes content (ranks by unit role, spacing by size): archers loose and wide, heavy infantry deep,
    cavalry in loose clumps.
  - A block shrinks from the back as troops die, so the front stays full. That matches "every dead troop leaves a
    body".

**B5. Terrain features in the scene.**

- **References:** sand, snow, a river with bridges, a fort wall and gate.
- **FM today:**
  - A record's `scene` holds terrain (seven kinds) and the storm state.
  - Season comes from the day: months 11 to 2 add frost, 9 and 10 autumn leaves.
  - No rivers or bridges exist anywhere in the rules.
- **What it means for our rules:**
  - The fort storm maps cleanly: the wall line between the sides, defender archers on the rampart while walls stand, a
    breach while they are down.
  - A gate funnel would imply a chokepoint we do not model, so show the fight along the wall or at the breach.
  - Winter can become a full snow ground, since the season comes from the record's day.
  - Rivers and bridges are only set dressing behind or beside the armies, never between them, unless M3's river rule is
    adopted. In that case `scene` gains the crossing.

**B6. Monster scale.**

- **References:** true size, 6 to 7 soldiers tall (the dragon 17 long), a large soft shadow, a palette break, an
  outline on selection.
- **FM today:** size scales are 1.0, 1.3, 1.7, 2.2, 2.7 and 3.4 (size 6). Rigs draw a wyrm, treant, giant, monolith and
  colossus.
- **What it means for our rules:**
  - The size-to-scale table becomes larger, for example a size-6 body at about 6 to 7× height. It is content (PRESENT
    layout) with a check that monsters never hide a block's count: an outline or see-through when they occlude.
  - No sim change: `size` already exists.

**B7. Volleys.**

- **References:** dozens of parallel dark dashes, arrows stuck in the ground.
- **FM today:** D8: one projectile per real shot (cap 400/240/120 per phase by speed). Stuck arrows are already decals.
- **What it means for our rules:** already aligned. The overhead view shows each arc as a short flight with a ground
  shadow. No change beyond the drawing.

**B8. Blood and the dead.**

- **References:** stains along the seams, bodies with shields left lying.
- **FM today:** decals, pools, a gore setting (Standard default), corpses kept.
- **What it means for our rules:** aligned. On a plain overhead ground the stains carry more of the story, so the decal
  cap (8,000 stamps) and its merging matter more. The gore Off setting keeps dark silhouettes.

**B9. HUD.**

- **References:** a bottom card bar for the player's side only, a hover card, edge buttons, about 6% of the screen.
- **FM today:** S4.6: a top bar with round and phase chips, a strength bar, left and right docks of 280 px with rows per
  squad, a ticker, a transport of 88 px, name cards, damage numbers on by default. About 62% unobscured with the docks
  open.
- **What it means for our rules:**
  - Replace the docks' default with a card bar: one card per squad and commander, the player's side at the bottom and
    the enemy's on hover or as a slim top bar.
  - Keep the docks, ticker and log one key away (Tab, L), because the docks hold the exact counts and chips that
    `docs/12` requires to equal `foldReplay` at every phase end.
  - Set damage numbers off by default.
  - No sim change.

**B10. Card states.**

- **References:** stance shield, morale face color, engaged swords, a leader star, washed out when gone.
- **FM today:** dock tags (ROUTING, FLED, WIPED OUT, SUMMONED, Provincial defense), buff and debuff chips, the
  break-chance meter in detailed mode (D4), fatigue for casters.
- **What it means for our rules:**
  - Our states map to card icons: shaken, holding or breaking (from detail morale events, or `mustCheck()` in the
    fallback); engaged (contact); casting and exhausted (A4 fatigue); routing, fled and dead; commander; summoned and
    bound.
  - Every icon needs a shape as well as a color (docs/07 principle 6).
  - No new log data is needed.

**B11. Hover card.**

- **References:** name, a hitpoint bar with current/max, a morale bar, one status word.
- **FM today:** dock tooltips with stats, weapons and buffs. Commander HP is exact. Morale is a roll against a
  threshold, not a pool.
- **What it means for our rules:**
  - A squad has no hitpoint pool: its bar is troops alive over troops at the start, exact at the count cue.
  - A commander's bar is exact HP.
  - A morale bar has nothing true to show unless it is the D4 break chance (detailed mode only) or losses against the
    20% and 10% check lines in the fallback. Never invent a pool.

**B12. Transport.**

- **References:** play, fast forward, pause and menu at the top right, nothing else.
- **FM today:** a full transport: restart, step, play, step, end, four speeds, Beats, a scrubber with beat icons, the
  time, a speaker. Keys for all of them.
- **What it means for our rules:** a compact top-right cluster (play or pause, speed steps, menu). The scrubber appears
  on hover over the bottom edge or with a key. The keys stay. The 150 s cap, Beats mode, step and seek stay (docs/12 is
  binding on watchability).

**B13. Mid-battle controls.**

- **References:** formation presets and ability buttons during the battle.
- **FM today:** battles resolve instantly and the replay only watches. Battle Plan scripts (5 slots) and rows are set
  beforehand.
- **What it means for our rules:**
  - Nothing is commanded in the replay, so no ability buttons appear.
  - The formation presets are a good idea for the pre-battle Battle Plan: one click sets rows for all squads, using our
    rows only. That is a UI addition, no rule change.

**B14. Pacing.**

- **References:** continuous real time, by eye.
- **FM today:** rounds with phases (spells, ranged, melee, morale), a timeline with budgets per phase, about 42 s for
  `starting` and 83 s for `clash300` at 1x.
- **What it means for our rules:** unchanged. The overhead view plays the same phases. Blocks keep moving between
  phases (approach, idle sway), so it feels continuous. Budgets per phase (90/55/30 strikes) may rise, since literal
  figures make more blows visible at once. That needs a measurement in the lab.

**B15. Commanders on the field.**

- **References:** a lone mounted leader behind the lines.
- **FM today:** commanders stand in their row (rear by default). The Attack script advances them, and they draw at
  1.15× scale.
- **What it means for our rules:** already aligned. A commander stands alone behind its squads, and Attack moves it to
  the front. Its card carries the star, and its name card uses the portrait.

**B16. Spells.**

- **References:** a beam, embers, an orb, simple additive light.
- **FM today:** five beats per spell (charge, release, travel, impact, linger), eleven storyboards, the color particle
  grammar of docs/09.
- **What it means for our rules:** aligned. Re-stage the storyboards for overhead (beams and arcs across the ground,
  impacts as rings on the ground). Global dims and desaturation stay rare.

### 8.3 Cross-cutting

**X1. The distinct-colors rule.**

- **References:** their natural colors, taken as flat terrain colors, fail our rule in 4 of 20 pairs of different
  terrains:
  - forest against open grass: 17.0 normal, 15.1 under the worst deficiency;
  - open grass against mountain grey: 21.1 / 4.4;
  - water against mountain grey: 26.3 / 2.3;
  - snow against sand: 14.6 / 11.2.

  Texture and relief make the difference there.
- **FM today:** docs/09 requires 20/12 between every pair of terrain fills, plus the band rule. These are binding unless
  a design states and measures a replacement.
- **What it means for our rules:** the v4 map must do one of two things:
  - keep a flat terrain color per terrain that passes 20/12, and paint each province so its mean stays within a stated
    ΔE of that color (final.md already holds 2.0); or
  - replace the rule with a measured recognizer on the rendered bake (color plus texture plus relief) that identifies
    each province's terrain at a stated rate for every vision.

**X2. Pillar 5, "flat 2D art, modest asset sizes".**

- **References:** a 3D engine, with modeled miniatures, terrain and monsters.
- **FM today:** SVG parts, procedural rigs, rasters at most 2 MB in the bundle.
- **What it means for our rules:**
  - The look must be reached in 2D:
    - the terrain field and its lit relief generated in the browser from the game seed (maps are procedural, so no image
      model can paint the map itself);
    - tileable textures and stamps for forest canopy, rock, sand and snow from the art pipeline or procedural;
    - miniature figures and monsters as sprites, Gemini-made or rig-drawn, in two or three facings.
  - The 2 MB raster budget needs a decision once figure sprites arrive.

**X3. Determinism.**

- **References:** not applicable.
- **FM today:** the sim and mapgen never call `Math.random`. Presentation streams come from `streamFor(battle, ...)`.
- **What it means for our rules:** the height field, the cover masks and the block layouts are presentation. They come
  from seeded streams keyed by the game seed and province (or the battle id), never from `state.rng`, so the sim's
  stream is untouched.

**X4. The war table.**

- **References:** not present.
- **FM today:** the cloth on oak in a tavern. Table Full is the default. Props sit in the margin.
- **What it means for our rules:** the owner keeps the table and tavern. The cloth becomes a sculpted terrain model on
  the oak, a sand table whose cliff skirts stand on the wood. Props, the room, the light and the table settings keep
  their rules. Only "no light falls on the cloth" changes, if relief is lit.

**X5. Colorblind safety in battle.**

- **References:** the sides are blue against red and purple.
- **FM today:** sides are told apart by banner, side glyph and position (the player on the left), with an optional
  outline.
- **What it means for our rules:** position stays the main channel (the player near, the enemy far). The banner hue
  family per side must pass the existing banner distances. Block outlines in the banner color with a dark keyline stay
  available.

**X6. Unit card and figure art.**

- **References:** full-body renders on every card, and figures at 16 to 25 px.
- **FM today:** 136 approved face portraits (commanders), and archetype SVG parts for units.
- **What it means for our rules:**
  - Each unit type needs a full-body card image and an overhead figure. Both are new content entries per unit, so the
    content validation fixtures grow (CLAUDE.md).
  - Faces stay for commanders, name cards and the docks.

## 9. Questions this hands to the v4 design (suggested defaults in bold)

1. **Map camera:** **top-down with lit relief and cliff skirts** (no tilt), a fixed oblique 2.5D view, or perspective.
2. **Owner tint:**
   - **The tint shows ownership, about 20 to 25%, and stronger on selection. Thin double rails replace the bands, and
     dominion keeps motifs only;** or
   - the tint is dominion and the rails show ownership.
3. **Terrain cover per province:** **the sim terrain covers at least 70% of the province's area, with a test.**
4. **Rivers between provinces:** **decoration inside provinces only for M1 (v3's ruling). Rivers as a crossing rule are
   proposed for M2.**
5. **Chasms as a new wild kind:** **not in M1.** Peaks stay raised and meres sunken.
6. **Labels at Mid:** **capitals, Wellsprings, wild names and the hovered or selected province only. Names at Near. PD
   plates only in the numbers layer.**
7. **Army counts on the map:** **on hover, on selection and in the engagement preview only.**
8. **Battle figures:** **one figure per troop up to 600 per side** (to be measured in the lab), proxies beyond that.
9. **Battle HUD default:** **a card bar and a compact transport. The docks are one key away. Damage numbers are off.**
10. **Monster scale:** **size 6 at about 6.5× a soldier's height**, in content.
11. **Palette:** **a low-key natural palette that still passes 20/12 as terrain colors, measured before it is adopted.**
    A replacement rule only with a measured recognizer.

## Appendix: files

All under `scratchpad/visual-v4/`:

- `refs-analysis.md`: this file.
- `tools/v4color.py`: sRGB to CIELAB and OKLCH.
- `tools/patches.py`: the terrain patches and their contact sheet. `tools/armies.py`: the army and monster patches.
- `tools/metrics.py`: value, chroma and fine-scale edges. `tools/coarse.py`: the blur-robust busyness (§1.1).
  `tools/blurcheck.py`: why the fine-scale metric was dropped.
- `tools/ts/refpal.ts`: the references' natural colors against the repo's palette rule (repo `colorMath.ts`, read-only).
- `work/`: crops made for reading (hover card, card bar, controls, tokens, borders, formations, monsters, cliffs) and
  `patch-sheet.png`. They are derived from the references, are for study only, and must not enter the repo or any
  deliverable.
