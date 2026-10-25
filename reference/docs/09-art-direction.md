# Art Direction and Placeholder Art

Flat 2D art with animation. Placeholder art must be good enough to play with and
distinct enough that every unit, nation, terrain, and color reads at a glance. All
placeholder art is authored as **SVG** so it scales, tints, and can be replaced one file
at a time later.

## Color palettes

Each color has a palette used for mana symbols, spell effects, nation chrome, and unit
tints. Hex values are the base; renderers may derive lighter and darker steps.

| Color | Primary | Secondary | Accent | Symbol |
|-------|---------|-----------|--------|--------|
| W Radiance | #F3E6B8 | #D9B85C | #FFFFFF | sun disc |
| U Tide | #3A7BD5 | #1E3F7A | #9ED8FF | wave crest |
| B Umbra | #3D2B4F | #1A1024 | #9B4DCA | skull in a drop |
| R Ember | #FD6533 | #7A1E12 | #FFB347 | flame |
| G Loam | #00674B | #244F22 | #A6D96A | leaf |

Nation chrome uses primary for borders and glow, secondary for panel headers, accent for
highlights. Independents: #8C8A80 / #4A4A44 / #C9C4B0, symbol: a plain shield.

Terrain fills: Plains #C1D29F, Farmland #EEBA3A, Forest #374C2B, Hills #856824,
Mountains #8DA4AD, Swamp #1A727A, Wasteland #AE897F. A seamless noise texture at 10%
opacity is multiplied over every fill. Borders #2B2620 at 2px. The map is painted on a linen
cloth (#E8DCC2) that lies on an oak war table (see "The war table"). No light, grade or
vignette ever falls on the cloth, so the colors tested below are the colors drawn.

**Distinct colors.** Every pair of terrain fills, each wild ground against every terrain fill, and
every pair of mana primaries (independents included), differs by at least CIEDE2000 20 for normal
vision and 12 under simulated protanopia, deuteranopia, and tritanopia. The two wild grounds are
not compared with each other (they differ by about 4): they never touch, since every range is one
kind and ranges stand at least 3 cells apart. Lightness and the blue-yellow axis, which those
players still see, carry most of the difference. `tests/content/palette.test.ts` enforces this
(the wild grounds from Phase 8). The original fills failed it (Hills and Wasteland differed by
5.7, about 3 for color blind players), as did Red and Green, the two M1 nations (6.9 under
deuteranopia). Those values were replaced: Red is brighter and more orange, Green deeper and
closer to emerald.

**Nation banners.** Ownership bands, dominion candles, and army badges use the nation's
banner, not its mana color. The first nation of a color in a game takes that color's
primary. A duplicate (a second Cinder Horde) takes the next entry of `NATION_BANNERS` in
`src/content/colors.ts`. Red: #FD6533, #51DDFC, #3186F2, #C98BAD. Green: #00674B, #5C488E,
#B5D69C, #8F0F04. Duplicates leave the hue family because no other choice stays distinct
for color blind players. The mana symbol and the numbered name keep the identity. All
eight banners differ by at least 28 normally and 16.7 under the simulated deficiencies.

**Ownership bands.** A band is a flat strip of the banner color along the inner border,
with a 1px keyline on its inner edge. The keyline is light #F4EEDF or dark #1C1A17,
whichever contrasts more with the terrain fill (`keylineFor`). A band reads on every fill
if either the banner differs from the fill, or the keyline differs from both the fill and
the banner, at the minimums above. Bare bands fail: Thornwood green on Forest is 8.8 under
deuteranopia. `tests/content/palette.test.ts` checks every banner on every fill.

**Map states.** From Phase 8, `tests/content/palette.test.ts` also covers what the map draws over
the fills:
- each nation's land-look wash at its cap, against every other terrain unwashed, washed by the
  same nation and washed by another (Cinder Horde ash #8F8C88 at most 10%, Thornwood moss
  #5E7F45 at most 6%);
- fog together with land looks: unexplored provinces take a 4% linen haze and no land look; out
  of sight ones are desaturated 10% with the wash hidden;
- the wild grounds (granite #2A292C, water #24222A) against every fill, every banner and every
  map-mode color, directly or, by the band rule above, through their light rim #E9E4D8;
- map modes tint over the fill desaturated 80% and lifted to L* 50 or lighter, and data ramps
  start at L* 40, so every M1 mode color stays distinct from the wild grounds.

## Sprite system

- Every unit sprite is a 64x64 SVG composed from **parts**: body silhouette, armor
  layer, weapon layer, and a "tint zone" (cloth, banners) filled with `currentColor` so
  the renderer tints it per nation.
- Silhouette archetypes (one SVG each, shared across nations): light infantry, heavy
  infantry, archer, skirmisher, cavalry, berserker, sacred warrior, mage (robe and
  staff), priest (robe and staff with symbol), scout (hooded), leader (banner),
  wolf, giant, treant, salamander, swarm, sprite, pretender bodies (oracle, titan,
  wyrm, monolith, spirit, colossus).
- Each nation overrides weapon and armor layers with its own set (Cinder Horde: jagged
  axes, scale armor, ash-grey skin; Thornwood: bark armor, bows, leaf cloaks) so a Warden
  and a Cinder Warrior are not just recolors.
- Commanders have portraits of their own; see "Leader portraits". Pretenders and summoned
  commanders use their rig in its portrait pose, unless a complete raster set replaces it.

## Animation

Animations are **procedural tweens** on sprite transforms and part visibility, not frame
sheets, so every unit gets them for free:

| State | Animation |
|-------|-----------|
| Idle | 1.2 s vertical bob of 2 px, slight weapon sway |
| Walk (map) | 0.4 s bob of 3 px while the marker slides along the edge |
| Attack (battle) | 0.3 s lunge 8 px toward target and back, weapon layer rotates 25 deg |
| Shoot | 0.3 s recoil 4 px, projectile sprite travels along an arc |
| Hit | 0.15 s red tint flash, 2 px shake |
| Death | 0.4 s fall (rotate 90 deg) and fade to 30% |
| Rout | 0.6 s flip horizontally, slide off the edge |
| Cast | 0.6 s staff raise, a ring in the spell color expands from the caster |
| Idle (map) | none: tokens and standees stand still on the map; the walk bob above stays |
| Map repaint | a 600 ms cross-fade over a province whose slow look changed; at most 8 at a month end, the rest instant |
| Table ambience | candle flames ±3% brightness at 0.7 to 1.3 Hz; the hearth ±4% over 7 s; at most 12 dust motes drifting 2 to 4 px/s in the window light, never over the cloth |

## Spell effects

Effects are built from a small set of **families**, each with a fixed lifecycle, and a
**motion grammar** per color. A spell is one family plus one color plus a scale; nothing
else is authored per spell. This keeps the five colors distinguishable at battle scale and
lets a new spell get a finished effect by naming its family in content.

### Families

Every family runs spawn, sustain, fade. Durations are at scale 1; scale 2 and 3 multiply
particle count and radius by 1.5 and 2 and add 100 ms to sustain.

| Family | Use for | Spawn | Sustain | Fade | Particles |
|--------|---------|-------|---------|------|-----------|
| `strike` | single-target damage | 80 ms flash at the target | 0 | 150 ms | 6 to 10 |
| `projectile` | ranged damage with travel | sprite leaves caster | arc to target, 300 ms | burst on arrival (uses `burst` at scale 1) | trail of 8 |
| `burst` | area damage | ring expands from center, 120 ms | 150 ms | 250 ms | 12 to 40 |
| `field` | fieldEffect, lingering area debuff | 300 ms fill of the area | until the effect ends | 400 ms | 20, slow drift |
| `aura` | buffs, heals, blessings on friendlies | ring from caster, 200 ms | pulse once per 500 ms on each target | 300 ms | 8 per target |
| `summon` | summon | 400 ms column at the spawn point | 0 | 300 ms | 16 |
| `shock` | moraleShock, debuff on enemies | 100 ms inward pull | 200 ms | 200 ms | 10 |

Total length at scale 1 never exceeds 900 ms so an effect finishes inside one replay
round at the default speed (1.5 s). At speeds above 2x, skip sustain.

**The eleven M1 battle spells keep `docs/12-battle-presentation.md` S2.10** (owner decision
2026-10-24, `docs/design/battle-overhead.owner-answers.md`: "Keep the flashier timing"): their
five beats, full and short durations (Fireball 1.9 s, 1.3 s short; Entangle 1.4 s) and
particle counts (40 to 160 for small casts, up to 300 for large spells at High) win over the
900 ms total and the particle column above. A family's lifecycle maps onto the beats: spawn is
charge and release, sustain is travel and impact, fade is linger. The 900 ms total and the
particle column are the defaults for spells `docs/12` does not storyboard (W, U and B when
they are implemented, and its generic templates). At speeds above 2x every spell skips
sustain and plays its short form.

### Motion grammar per color

The family says what happens; the color says how it moves. Both tables apply at once.

| Color | Particle shape | Motion | Easing | Blend |
|-------|----------------|--------|--------|-------|
| W Radiance | 2 px lines radiating from center | straight outward, no gravity | ease-out | additive |
| U Tide | concentric arcs | ripple outward with a 60 ms stagger, slight horizontal sway | sine in-out | normal, 70% alpha |
| B Umbra | soft circles | sink downward and inward, slow | ease-in | multiply, then additive accent |
| R Ember | 3 px circles, size jitter 50% | rise with flicker (x jitter from a hash of the particle's index and story time, never the sim's rng and never a per-frame stream, so a scrubbed frame looks the same) | ease-out, fast | additive |
| G Loam | 4 px leaves (short rounded rects) | spread outward along the ground, hugging the row line | ease-out, slow | normal |

Palette use is the same in every family: primary for 70% of particles, accent for 30%,
secondary only for the `field` fill. `docs/12` S2.10's color grammar adds to this table
(Ember's heat shimmer at High quality, Loam's running ground cracks), and its particles are
closed-form functions of story time (`present/battle/particles.ts`).

### Glow

Glow is per effect, not per screen. Each effect lives in its own container with
`blendMode: 'add'` where the grammar says additive; the container gets a one-step
`BlurFilter` only for `burst` and `aura` at scale 3. No full-screen bloom, no custom
shaders in M1; `docs/12`'s release flash is an overlay under its flash limiter (S2.14), not
bloom. Units carry no glow of their own at rest, only effects and the mana symbol of a casting
mage. A creature's emissive parts (the Salamander's cracks, the Ash Colossus' veins, the idols'
glyphs) light only while it uses its own fire ability, as part of that effect, and a spell's
light may tint the figures near it (owner decision 2026-10-24: "Glow only during own fire").

### Readability rules

- Two spells of different colors in the same family must be told apart with the sprites
  hidden. Two spells of the same color in different families must be told apart with
  color removed. The effects gallery (see milestone Phase 10) exists to check both.
- Effects never cover the damage numbers; numbers draw on a layer above all effects.
- At most 3 `burst` or `field` effects play at once; further casts in the same round queue
  and play in event order so a replay stays deterministic to the eye as well as the log.
- Effect durations and particle counts are tuned in `content/fx.ts`, never in render code.

### M1 spell to family mapping

| Spell | Family | Scale | Duration (`docs/12` full form, short in brackets) |
|-------|--------|-------|----------------------------------------------------|
| Ember Dart | projectile | 1 | 0.9 s (0.6) |
| Fireball | burst | 2 | 1.9 s (1.3) |
| Warcry | aura | 2 | 1.3 s |
| Blood Fury | aura | 1 | 1.4 s |
| Pyre Storm | burst | 3 | 3.2 s (2.2) |
| Thorn Spray | burst | 1 | 1.2 s (0.8) |
| Bark Skin | aura | 1 | 1.2 s |
| Entangle | shock | 2 | 1.4 s |
| Swarm | summon | 2 | 1.8 s |
| Regrowth | aura | 3 | 2.0 s |
| Bless (the prophet's blessing) | aura | 1 | 1.0 s (0.6) |

W, U, B spells are assigned a family when they are implemented, using the same table
shape. Battle defaults when a spell has no `fx`: damage with a single target is `strike`,
area damage is `burst`, buffs and heals are `aura`, debuffs are `shock`, summons are
`summon`, field effects are `field`.

## Icons

24x24 monoline SVG icons on a 2 px stroke, one silhouette per noun. States are corner badges
drawn on top (▲ up, ▼ down, ✕ blocked, ‖ paused, ! problem), never new silhouettes. Every icon
listed here needs a distinct SVG (M1 acceptance criterion 14).

| Group | Icons |
|---|---|
| Resources | gold coin, materials (anvil), supply (wheat), population (figures), unrest (fist), each mana symbol, candle (dominion), research book |
| Buildings and places | fort, temple, lab, Wellspring (a fountain with five drops), spring (a drop with the color's glyph); each building also drawn as a faint outline for an empty slot; developments (Phase 9b, proposed): granary (a round silo), market (an awning), barracks (a tent with a spear), shrine (a small roofed niche with a candle) |
| Orders | idle (open hand), guard (shield on a post), pillage (torch), research (book), preach (raised staff with symbol), claim (hand over a fountain), cast (ring with a spark), make prophet (halo), reverse (U-turn arrow), storm (ladder on a wall), move (arrow), build (hammer); govern (a seal on a scroll over a keep; Phase 9b, proposed) |
| Status glyphs (corner badges on army badges and rows) | starving (crossed wheat), tight supply (half wheat), unpaid (crossed coin), wounded (cracked heart), besieging (ram), casting (ring in the spell's color), pillaging (torch), script problem (scroll with !) |
| Map | army badge shapes: rounded shield (own), notched shield (other nations), plain shield (independents); battle marker (crossed blades); siege ram; scout eye; transit arrow; selection ring; wild (three snow-capped peaks over a row of cliff ticks); path tack (a square set as a diamond) |
| Roles | crown (pretender), halo (prophet), eye (scout), hood (stealthy) |
| Officers (Phase 9b, proposed) | baton (Marshal), key (Chancellor), censer (Hierophant), shackle (prisoner), stud (rank), laurel (Ascendancy), crossed sabres over a ring (duel), scroll with a seal (proposal), two linked rings (comrade bond), a broken ring (grudge), the five stats as small glyphs: standard (Command), sword (Valor), open book (Lore), scales (Stewardship), speaking face (Presence) |
| Alert tiers | Urgent (octagon), Important (triangle), Opportunity (circle), Hint (rounded square with "i"); the shape carries the tier without hue |
| Map modes | ownership (banner), dominion (candle), supply (wheat), unrest (fist), population (figures), mana springs (drop), numbers layer (#) |
| Script stances | cast (the spell's mana symbol), attack (crossed blades), hold (shield), retreat (arrow) |
| Wellspring track | filled diamond (claimed), hollow diamond (needed), hexagon outline for the "1 short" badge |
| Screens and chrome | research, ledger (open book with columns), codex (book with magnifier), menu, settings (gear), pin, go-to (crosshair), info (i), close, back, Watch (eye on a play triangle), mute |

## UI chrome

The chrome stays dark and neutral so the map and the mana colors carry identity. It is framed in
the war table's materials: oak frames, aged brass hardware and leather book spines around flat
panel bodies. Mana colors never decorate chrome. They appear only on things that carry that
color.

| Token | Value | Use |
|---|---|---|
| `--chrome-0` | #1C1A17 | panel base, top bar |
| `--chrome-1` | #26231F | raised rows, cards |
| `--chrome-2` | #322E28 | hover, selected tab |
| `--text` | #F4EEDF | parchment text and keylines |
| `--text-dim` | #F4EEDF at 60% | footers, hints, disabled labels |
| `--keyline` | 1 px `--text` at 25% | panel edges (action buttons use `--brass`) |
| `--warm` / `--cool` | #E8A15A / #8DB6C8 | ▲ and ▼ deltas, always beside the arrow; `tests/content/palette.test.ts` checks both at 4.5:1 or more against `--chrome-0` |
| `--focus` | 2 px #F4EEDF outline, 2 px offset | `:focus-visible` on every control |
| `--oak-0` | #2B231C | bevels, frames and spines: the top bar, the strip, the docks' map edge, modals |
| `--oak-grain` | #3A2E23 | grain lines inside frames only, at most 1 px and 20% coverage |
| `--brass` | #B8914A | 1 px keylines on action buttons (4.62:1 on `--chrome-2`), the top bar, the docks' map edge and modal frames; 14 px corner brackets; square tacks and rivets |
| `--brass-hi` | #D4B26A | a 1 px highlight on brackets and tacks only |
| `--leather` | #4A3426 | 10 px spines of the Codex and Ledger; never under text |
| `--parchment` / `--ink` | #E8DCC2 / #1C1A17 | the battle report card and Codex article pages when the parchment option is on; ink at 70% for dim text (5.53:1) |
| `--warm-ink` / `--cool-ink` | #8A4A12 / #2F5D73 | ▲ and ▼ deltas on parchment (5.03:1, 5.26:1) |

- **Type:** one display face for headers and one face with tabular figures for numbers. Body text
  is at least 14 px at 100% UI scale. All sizes are in `rem`.
- **Buttons:** action buttons (they issue a command) are filled `--chrome-2` with a 1 px
  `--brass` keyline and print their cost. Navigation buttons (they open something) are ghost
  buttons with no keyline.
- **Terms and links:** concept terms are `--text` with a 1 px dotted underline, never a mana
  hue. Entity links carry a leading glyph (pin, portrait dot, banner, mana symbol) and underline
  on hover.
- **Cards** (unit, spell, chassis, battle report) share one frame: a rounded rectangle, a header
  band in the nation's secondary color, and a symbol row at the bottom.
- **Materials:** oak grain appears only in frames and bevels, never behind text, numbers or
  icons. Brass marks action buttons, the top bar's bottom edge, the docks' map edge and modal
  frames (1 px keylines), modal and dock corners (14 px L brackets with square tacks), and is
  never round. Brass never touches a mana symbol: at least 2 px of chrome lie between them, and a
  portrait's pip ring sits on a 2 px `--chrome-0` ring outside its frame. Leather is only for book
  spines. Parchment surfaces carry ink text, and a mana symbol on parchment takes a 1 px ink ring.
  Tooltips, rows and cards keep the tokens above with no texture.
- **Patterns** for states shown by color: 45° hatch (invalid or unreachable), dense cross-hatch
  (starving), hatch density per unrest step, dotted borders (fog). The same patterns appear
  in map modes and panels. No map art, texture or ornament uses these patterns; a content test
  checks every texture's line angles and coverage.
- **Motion:** panels appear without sliding. An Urgent alert pulses twice when it appears.
  Reduced motion removes the pulse, the idle bob, every UI tween and the table's ambience
  (candles and hearth freeze at their mean, dust motes are removed), and makes map repaints and
  zoom steps instant.

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
- **Settings:** Table Full (room, table, props, ambience; the default from Phase 9), Simple (oak
  and cloth only; Phase 8's only mode), Off (a plain dark surround).

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
  more approved images, picked by the same seed; state then shows on the frame only. A summoned
  commander (the Salamander, the Treant) has one body and few on the map at once, so its set is
  complete at 4 faces and replaces its rig's portrait pose, which stays the fallback (QA sweep
  2026-10-22, finding DOC-4: the shipped summon sets have 4 faces, which the 8-face rule would
  never draw).

**The Court modal and officer marks (Phase 9b, proposed, `docs/07-ui.md` "Court"):**
- **Rows at 40 px.** The Officers and Prisoners tabs draw every named person as a 40 px portrait
  row (the report-card size), so a nation of 30 officers fits one screen without scrolling at
  1280x720. The Posts tab's three cards draw their holder at 96 px and the candidates at 48 px.
  The Commander panel keeps its 96 px portrait.
- **Rank on the frame.** The three rank steps use the frame's material the way the existing
  ranks do: rank 0 keeps the type's material, rank 1 adds a single stud at the collar, rank 2 a
  pair, rank 3 a thin inner keyline in the banner. No face changes with rank.
- **Post marks.** A post holder's frame carries one 12 px mark at the crown notch: a baton
  (Marshal), a key (Chancellor), a censer (Hierophant). The mark is monoline in the frame's
  material and sits where the prophet's halo sits; a prophet who is Hierophant shows the halo
  with the censer inside it.
- **Prisoners.** A held commander's portrait is drawn in its own nation's frame with a dotted
  band and a shackle glyph at the lower left corner, the way last-seen commanders use a dotted
  frame; it is never greyscale, which means dead. The holder's banner color fills the band's
  dots. On the holder's screen the same portrait appears with its own banner, so the player sees
  whose officer it is.
- **Stat bars on the row.** The five stats are 3 px bars to the right of the name at 40 px, in
  the chrome's brass on oak, never in a color (color carries nation and mana only); a bar above
  the nation's median for that stat gets a brighter tip. At 24 px and below the bars are dropped.
- **Trait chips** reuse the ability chip (`units-and-items.md` D.2): a 16 px icon in a rounded
  square with the trait's name on hover.
- **Bond chips** are 24 px portraits of the comrade or the grudge's target in a ring: brass for a
  comrade, a notched iron ring for a grudge, drawn to the right of the trait chips, at most
  three with a "+N".
- **Duel in the replay.** The two duellists are drawn at 64 px in the replay docks for the duel
  phase, facing each other across the stage's centre, with their names; the loser's portrait
  gains the wound overlay at once.
- **Raster sets need nothing new.** Rank, post, prisoner and bond marks are frame-only, so an
  owner-made raster set shows them without a sidecar; the shackle, baton, key and censer are
  new monoline icons (Icons below). No officer is ever drawn without a portrait.

## Pretender chassis art

Each chassis has a 128x128 SVG portrait. The summary card tints the portrait's tint
zone by the dominant pip color and shows a mana-symbol row beneath.

## Delivery rule

All art lives in `src/assets/sprites/<category>/<name>.svg`. A `manifest.ts` maps
unit type ids to sprite part names. Missing art falls back to the archetype silhouette
with a nation tint so the game never shows a broken image.

Raster art made by the project owner (the oak tile, the tavern floor, portraits) is optional. It
arrives in `art-inbox/`, passes `scripts/art-intake.ts` (crop, sizes, checks, a provenance
sidecar per image, a contact sheet for approval) and lands in `src/assets/raster/` with a
manifest entry; masters stay outside the bundle in `art-source/`. Rasters in the bundle total at
most 2 MB. A portrait set is used only when complete (8 faces or more, 4 for a summoned
commander); the procedural art is always the fallback.

## Implementation decisions

Recorded per `CLAUDE.md`; numbers are also in `docs/09-balance.md`.

**Spell effects as data** (Phase 5 follow-up, 2026-10-24): `src/content/fx.ts` holds the family
table (`FX_FAMILY_DEFS`), the scale rule (`FX_SCALE_RULE`), the limits (`FX_LIMITS`: 900 ms,
3 big effects, no sustain above 2x, the blur at scale 3 for `burst` and `aura`), palette use
(`FX_PALETTE_USE`) and the motion grammar (`FX_GRAMMAR`); each battle spell's `fx` record is in
its spell file. Where "Spell effects" is silent:
- **Projectile spawn** is 0 ms: the sprite leaves the caster at once, its 300 ms arc is the
  sustain, and its fade is a `burst` at scale 1 (520 ms), 820 ms in all.
- **Lingering sustains**: a `field` sustains until its effect ends, and an `aura` pulses on each
  target every 500 ms while it lasts; both run under later cues, so the 900 ms total counts only
  spawn and fade for them (`familyLengthMs`).
- **Scale** 2 and 3 each add 100 ms to a fixed sustain or travel; a linger gains nothing.
- **Holy spells** (Bless) take docs/12 S2.10's holy grammar, rays from above in the Radiance
  palette (`FX_GRAMMAR.holy`), since they have no color of their own.
- **Particle sizes** the grammar table does not give (Tide's arcs, Umbra's soft circles) are
  `null` until the effects gallery (Phase 10) sets them in `content/fx.ts`.
- **`duration`** of the eleven M1 battle spells is docs/12's full form in ms; their short forms
  stay with docs/12's presentation looks (Phase 10).
- **The sim never reads `fx`**: the battle rules fingerprint takes each spell through
  `spellRules`, which drops `fx` and keeps the other keys in order, so adding `fx` left
  `battleRulesHash()` and every pin as they were and a new look voids no saved re-run;
  `tests/sim/fx.guard.test.ts` keeps `src/sim`, `src/ai` and `src/mapgen` from naming it.
