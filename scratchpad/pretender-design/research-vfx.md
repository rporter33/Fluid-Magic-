# Research: flashy magic in strategy games, and how Fluid Magic does it in 2D

Scope: how Age of Wonders 4, Total War: Warhammer III, Heroes of Might and Magic III, V and VII,
Songs of Conquest, Magic: The Gathering (and Arena), and Dominions present magic. Then the 2D
techniques PixiJS 8 offers, with their costs, readability rules, performance budgets, and
reduced-motion variants. Part 3 turns this into a **signature-effect grammar** for each color, each
element, each spell primitive (battle and ritual), each spell tier, and for the pretender.

Owner direction (binding): "flashy magic effects is always interesting and good options for
pretenders like Dominions has is always a highlight ... A customization level matching Age of
Wonders 4 would be very ideal." Earlier directions also hold: battles should be visceral and
detailed, with sound, and the UI should layer complexity tastefully under smart menus.

**How this fits with the other designs.** The battle spectacle proposal
(`battle-design/proposal-spectacle.md`, section 6) already storyboards the 11 M1 battle spells in
five beats. The architecture proposal (`battle-design/proposal-architecture.md`, sections 3.8 and
4) already defines closed-form particles, the Pixi scene graph, and a frame budget. The AoW4
research (`pretender-design/research-aow4.md`, sections 3.4 to 3.6) already proposes pip-derived
glow, aura shapes, and "mechanics that show". This document does not repeat them. It adds four
things: sourced reasons for those choices, a grammar general enough for all five colors, the
ritual layer and the pretender, and a verified catalog of Pixi 8 techniques. Section 3.11 lists the
places where it suggests changing those proposals.

**Method and confidence.** WebFetch could not resolve any host from this session, and the proxy
refused most game sites. Findings about games therefore come from **search-engine extracts** of
the cited pages, not full reads. The exceptions were read directly. PixiJS facts come from the
installed `pixi.js` 8.22.0 (its type declarations and the docs bundled in
`node_modules/pixi.js/skills/`). pixi-filters facts come from its source on raw.githubusercontent.com
and from npm. The Dominions manual is a local copy of the community manual. Each source carries a
tag: **official** (the developer or publisher), **source** (code or engine docs read directly),
**review** (press), **wiki** (fan or community wiki), **forum** (players or modders, anecdotal),
**weak** (an aggregator or low-quality page, used only where nothing better was found). Where no
source was found, the text says "not found" and does not guess.

---

## 0. Findings at a glance

1. **Visual size must match gameplay size.** Riot's rule is "visual impact should represent
   gameplay impact" [C2, C3]. Total War players complain when vortices "look great, but basically
   just tickle the units" [T3]. Hearthstone's original Deathwing reused a generic fire effect and
   "didn't match its impact" [C12]. → Fluid Magic sets screen-level effects by **tier** (spell
   level plus breadth), not per spell by taste (3.5).
2. **The shape tells what the spell does.** Total War names its spell types by shape: missile,
   wind, breath, vortex, augment, hex [T1]. A Lore of Life spell that *looked* like a vortex but was
   direct damage misled players [T3]. → One **template per primitive** (3.4). A damage spell never
   looks like a field effect.
3. **Each color needs its own motion, not just its own tint.** AoW4 reviewers noticed attack
   animations that were the same "with a different color palette" [A3]. `docs/09` already gives
   each color its own motion (Ember rises, Loam spreads, Tide ripples, Radiance radiates, Umbra
   sinks). → Keep these as the **primary verbs**, add a shape language per color, and test that no
   two colors share a verb (3.2).
4. **Mechanics should show on the body, and stack.** AoW4's enchantments and transformations
   "stack and combine visually with PFX, skin decorations, colours, and additional meshes like ice
   shards", for every form and for leaders [A4, official]. → Buffs, blesses, pips, and pretender
   state get visible marks. Each visual slot is a stat family, and the newest effect wins its slot
   (3.4, 3.6).
5. **Spectacle wears thin when repeated.** A Heroes V reviewer: casting "takes a few seconds as the
   caster does something dramatic that gathers power, and then have a dramatic pause ... after I'd
   seen it a few times, it was downright boring" [H1]. Blizzard slowed down Hearthstone animations
   that were "too fast and distracting" [C11]. → The spectacle proposal's short form (half charge
   from the second cast of a spell in a battle) is right. Add tier caps on duration (3.5).
6. **Bloom and blur cost readability.** Songs of Conquest's developer told players who could not
   tell units apart to turn off "Depth" and "Bloom" [S2]. Warhammer III's most cited visual
   complaint is blur and eye strain [T4]. → Bloom only on the effects layer, never on units or
   numbers, and off on Low quality. No motion blur or zoom blur (2.2).
7. **Players mod clutter away.** Warhammer III has a workshop mod that shrinks buff and effect VFX,
   and Creative Assembly itself added occlusion outlines to help players read units [T4]. → An
   "Effects" intensity setting from the start, mapped onto the existing Detail setting (2.6).
8. **Camera tricks on every action make people sick.** Darkest Dungeon players reported nausea
   from "zooming, shaking, and tilting", and a popular mod kept zoom only for critical hits [C16].
   → Camera moves only on tier 3 and divine moments, shake on a trauma curve, and everything
   follows `prefers-reduced-motion` (2.4, 2.6).
9. **Red is the dangerous flash color, and Ember is a shipped color.** WCAG treats red flashes
   separately because "people are even more sensitive to red flashing"; WCAG 2.2 counts a
   transition as saturated red when R/(R+G+B) ≥ 0.8 and the chromaticity shift exceeds 0.2 [X1,
   X2]. Every Ember palette step passes (0.50 to 0.72, computed in 2.6). A pure `#FF0000` hit tint
   does not. → A content test bans saturated-red flash and tint colors (3.10).
10. **Palette steps alone do not read on every ground.** In the computed contrast table (2.5),
    White's best step reaches only 1.41 to 1.79 on Plains, Farmland, and parchment. Umbra's best
    is 1.95 on Forest, and Umbra's and Loam's primaries are about 1.35 there. → Every effect's
    primary shape carries a keyline chosen by the `docs/09` `keylineFor` rule. With it, contrast is
    at least 4.53:1 on every terrain fill, the parchment, and the dark UI.
11. **Dominions keeps its drama in words.** Its global enchantments read "A huge blazing pyre lights
    up the landscape" and "creates a huge ball of fire in the sky" [D5]. Players call the graphics
    "beyond dated" [D1, D2]. Even so, Illwinter added scorched earth and meteor craters in 2025
    [D3]. → Fluid Magic shows the ritual on the map (3.7), and the battlefield remembers (decals).
12. **PixiJS 8 can carry this cheaply if the costs are respected.** `ParticleContainer` renders a
    million particles at 60 fps in the PixiJS team's own benchmark [P2]. Standard blend modes are
    plain GPU blend equations. Every filter, however, is a render-to-texture pass, and advanced
    blend modes are filters too [P1]. → Particles and additive sprites carry most of the show.
    There are at most two full-view filter passes at a time (2.5).

No new sim primitive is needed. Everything here is derived from existing `BattleEvent` kinds,
spell definitions, and state. One optional sim addition (a spell id on ritual messages and a
message to the victim of a hostile ritual) is specified exactly in 3.8.

---

## Part 1. Findings from games

### 1.1 Age of Wonders 4

**What players see.**
- Reviewers praise magic as the visual high point. Cog Connected: "The spells and effects are
  immensely satisfying to look at", although "animations aren't always elegant" [A1, review].
  Other reviews mention "hundreds of spells to research and cast" that feel "diversified by element
  and by tome", "some excellent visuals" in tactical battles, maps that "look quite lush" but
  animations that "lack a certain flair", and sound that does not match "the visual punch of the
  game's magic combat" [A2, review].
- A Steam player noticed that several unit models share "the same exact attack animation with a
  different color palette" [A3, forum].

**How the visuals are built.** Dev Diary #11, "The Art of Age of Wonders 4" (Art Director Rich,
2023-03-30) [A4, official]:
- "Enchantments and evolutions stack and combine visually with PFX, skin decorations, colours, and
  additional meshes like ice shards."
- They apply "to all Forms and all Cultures as well as leaders".
- Taking two affinity paths mixes visuals, for example "frost weapons, steel skin and golden
  armour".
- The art came from a core team of about 9 artists, **one of them a PFX artist**.
- A player in the diary's forum thread recalled from a stream that "the most recently cast
  enchantment is the one that will take visual precedence" when two compete for one visual slot
  [A4, forum, unconfirmed].

**How magic is organized.** There are 54 tomes over six affinities, and "each Tome is centered
around a strong theme" such as Pyromancy, Necromancy, Faith, or Teleportation [A5, official]. Each
affinity opposes another and favors a damage type. A guide maps them: Order to spirit damage and
stability, Chaos to fire and hordes, Nature to animals and growth, Materium to earth, Astral to
lightning and shielding, and Shadow to ice and undead [A6, review].

**World map spells.**
- Strategic spells are cast only on the world map, take time to prepare, and only one can be
  prepared at a time [A7, wiki].
- They come in categories: unit enchantments, transformations, summons (which target hexes and,
  after a patch, only hexes next to the player's city, ruler, or heroes), city spells, and
  terraforming spells (which target provinces) [A9, forum and patch notes].
- Damage spells such as Blizzard and Lightning Torrent hit enemy armies and leave status debuffs
  for some turns [A7]. Dev Diary #20 planned to limit "the impact of direct damage spells on the
  world map" [A8, official].
- How a strategic spell **looks** when cast on the map: not found.

**→ Fluid Magic**
- Visual stacking with one slot per family, newest wins, becomes an explicit rule for buffs and
  auras (3.4). The sim already prevents a spell from stacking with itself, since a recast first
  removes the earlier changes (docs/02, Implementation decisions).
- The six affinities with their damage types parallel the five colors and their elements. Each
  color owns one element's look (3.3).
- AoW4's world spell categories match Fluid Magic's ritual primitives almost one for one:
  summonToProvince matches summons; provinceGrowth, Supply, Materials, and DefenseBuff match city
  and terraforming spells; remoteDamage matches Blizzard. The map templates in 3.7 follow these
  categories.
- The palette-swap complaint is the reason each color gets distinct motion and shapes, not only a
  tint.
- The sound complaint backs the battle sound proposal. Map rituals need sound too (3.7).

### 1.2 Total War: Warhammer III

**Spell types are shapes** [T1, review and wiki]:

| Type | Shape | Behavior |
|---|---|---|
| Magic missile | a projectile | can miss, can be blocked by terrain, can hit flyers |
| Wind | a straight band | travels along a line and can be aimed |
| Breath | a cone | like wind, but cone-shaped |
| Vortex | a moving area | pulls or damages over time, drifts |
| Augment | an aura on allies | buff |
| Hex | a curse on enemies | debuff |
| Bombardment | many strikes from above | not described by the found sources |

**Overcasting.** Double-clicking the spell button casts it stronger for more Winds of Magic, with a
risk of a miscast [T2, wiki].

**Readability complaints.**
- Vortices "can drift off target", can hurt the caster's own units, and once "look great, but
  basicaly just tickle the units" [T3, forum and guides].
- A guide warns that a Lore of Life spell looks like a vortex but is direct damage, "so despite
  its awesome animations it should be cast differently" [T3].
- A workshop mod, "Less buff and effect VFX", exists to cut clutter [T4, forum].
- Creative Assembly added "occlusion outlines" that give enemies a colored outline behind trees
  and buildings, and "lazy" health bars that show burst damage [T4, forum citing patch notes].
- Update 2 of the first game "improved targeting UI for several spells" [T8, official wiki].

**Each lore has a color.** In Warhammer Fantasy the eight Winds of Magic each carry a color and a
lore. Aqshy is red (Fire), Azyr blue (Heavens), Chamon yellow (Metal), Ghur brown (Beasts), Ghyran
green (Life), Hysh white (Light), Shyish purple (Death), and Ulgu grey (Shadow) [T5, wiki]. It is
the same idea as MTG's five colors: a lore is recognized by its color first and its element
second.

**Campaign map.** A modder explains that the engine draws corruption as a texture overlay "at
different corruption levels", and another says vampiric corruption switches the area to night
environments [T6, forum]. In Warhammer II's Vortex campaign, a ritual "is clearly visible on the
overworld map", and rivals have a set number of turns to stop it [T7, review].

**→ Fluid Magic**
- One template per primitive, with distinct silhouettes (3.4). Bolts are lines, bursts are rings
  on the ground, auras surround a group, curses cling to it, fields cover the whole battle.
- A spell that does little must look like it did little. The spectacle proposal's grey "0" fizzle
  is right. The intensity of the impact follows the logged damage and kills, not the spell's
  potential (3.4).
- Readability features belong in the first version: an Effects setting (2.6), the optional
  outline that the spectacle proposal already plans, and footprint rings under area targets (3.4).
- Dominion can be drawn as an overlay with levels, as corruption is (3.7).
- A ritual in progress should be visible on the map to the caster, and to rivals only in
  provinces they can see (3.7).

### 1.3 Heroes of Might and Magic III, V, and VII

- Heroes V was the first fully 3D Heroes, and its four magic schools are Light, Dark, Destructive,
  and Summoning [H3, wiki]. Reviewers wrote "the battle graphics are great and spells look
  amazing", and "the aura trails that the heroes can leave are pretty" [H1, review].
- The same era of reviews: casting "take[s] a few seconds as the caster does something dramatic
  that gathers power, and then have a dramatic pause, and then another few seconds of the spell
  going off. It looks good -- but after I'd seen it a few times, it was downright boring" [H1].
  GameSpot noted the frame rate "can bog down pretty badly" when "the flashier spells are firing
  off" [H2, review].
- Heroes III: one low-quality page describes Armageddon as a full-screen animation and reports
  that a reimplementation clips it when a creature casts it [H5, weak]. The original spell
  animations are otherwise not described by any found source. Implosion is a level-5 Earth spell
  costing 30 mana [H4, wiki]. Heroes VII: spell lists exist on the fan wiki, but no source
  describes their visuals.

**→ Fluid Magic**
- The Heroes V problem is length, not looks. Fluid Magic battles are replays a player may watch
  dozens of times. The short form, Beats mode, and tier caps on charge time (3.5) answer it.
- Big spells are where frame time spikes. Each tier gets a particle and filter budget (2.5), and
  a fixture battle with Pyre Storm is the performance smoke test (3.10).
- Hero aura trails are a cheap, much-liked flourish. The pretender's idle aura and its cosmetic
  trail (3.6) are the same kind of thing.

### 1.4 Songs of Conquest

- Development update #30 (November 2020, read in forum reposts) says the team spent "a lot of
  time ... figuring out the general look of our spells. We are trying to find a style that combines
  both the retro vibes of pixels but at the same time looks modern and fresh. Shaders, particles,
  and modern VFX combined with hand-drawn sprites." The same update covers work on "impacts and
  knockbacks" so that hits feel rewarding [S1, forum].
- The game is 2.5D: 2D sprites on a 3D background [S4, wiki].
- Reviews describe "a meaty impact to your attacks and simple but effective visual flourishes to
  spells and special attacks" [S3, review].
- Some players found units hard to tell apart. A developer answered that turning off the "Depth"
  and "Bloom" settings might help [S2, forum].

**→ Fluid Magic**
- Flat SVG sprites plus modern particles and filters is a proven recipe for good-looking 2D magic.
  It is exactly Fluid Magic's stack (`docs/09` SVG parts, Pixi particles and filters).
- 2.5D cheaply: draw every ground effect (rings, footprints, scorch, roots) as an ellipse with a
  vertical scale of 0.4 to 0.5, and every air effect (halos, rays, sparks) unsquashed. The flat
  battlefield then reads as a ground plane (2.2, row 18).
- Bloom must never cover the unit layer, and it can be turned off (2.2, row 3).

### 1.5 Magic: The Gathering and MTG Arena

- **Color concepts** (MTG Wiki): White is peace, law, structure, selflessness, and equality. Blue
  is knowledge, deceit, caution, deliberation, and perfection. Black is power, self-interest,
  death, sacrifice, and uninhibitedness. Red is freedom, emotion, action, impulse, and destruction.
  Green is nature, wildlife, connection, spirituality, and tradition [M1, wiki].
- **Lands**: Plains make white mana, Islands blue, Swamps black, Mountains red, and Forests green
  [M2, wiki].
- **Mana symbols**: a sun for White, a water drop for Blue, a skull for Black, a flame for Red, and
  a tree for Green [M3, weak]. In a design podcast, Mark Rosewater says fire and water "have very
  clear things as elemental images", and that a skull raised the question of whether it was "too
  much" [M3]. A fan wiki for Arena ties Red to "lightning and fire" and Black to "a death theme"
  [M6, wiki].
- **Arena's per-color effects**: no official or community description was found. A video
  collects the entrance animations of Guilds of Ravnica mythic cards [M5]. Arena's card styles are
  "cosmetic enhancements", and styled cards are full art with "a slightly moving image" [M4,
  review].

**→ Fluid Magic**
- The per-color grammar in 3.2 is **derived** from the color pie, the lands, and the symbols. It is
  not copied from Arena, whose effects could not be documented. `docs/09`'s symbols already match:
  a sun disc, a wave crest, a skull in a drop, a flame, and a leaf.
- Each color's look starts from its land. Radiance is open sky and noon light, Tide is the sea and
  storm, Umbra is swamp, rot, and shadow, Ember is mountain, magma, and fire, and Loam is forest,
  root, and beast. Its *shape language* starts from its ethos. Order is symmetric and geometric.
  Control is precise: rings, refraction, crisp arcs. Ambition and death pull inward, drain, and
  sink. Chaos is jagged and erratic. Growth is organic and branching.
- Arena's card styles show that **cosmetic tiers for effects** are an accepted idea that never
  touches the rules. This is the precedent for the pretender's cosmetic aura and flourish (3.6).

### 1.6 Dominions: what to avoid, and what to keep

**What to avoid.**
- Players call the graphics "beyond dated" and say the battle sprites look "exactly the same or
  very close to it" across editions [D1, forum]. One Steam review lists "lazily done hack job
  sprites like a horse sprite with rider's legs still there". Reviews call the style "charmingly
  outdated" and say it "won't win any awards for stunning graphics" [D2, review and forum].
- The scale is huge: "tens, even hundreds of spells to be cast every turn" [D2]. A patch enlarged
  some area spells to suit a bigger battlefield, and remote spell attacks became watchable on the
  battle screen [D4, forum].
- Patch 6.24 (January 2025) added "new graphical effects for fire spells. Fire spells can now
  scorch the earth where they hit and meteors can leave craters" [D3, wiki of patch notes].
- The replay offers a key that toggles "colored squares for the teams", and another for a "wire
  frame grid (battlefield graphics disappear)" [D5, community manual]. Readability is handed to
  overlays.
- Global enchantments are vivid in text. Eternal Pyre: "A huge blazing pyre lights up the
  landscape." Second Sun: "The caster creates a huge ball of fire in the sky" [D5]. No found source
  describes them as visible on the map.

**What to keep:** speed. Hotkeys for every speed, a detail level for the log, a battle summary
before the replay, and the god at the center of everything. The UI research covers these.

**→ Fluid Magic**
- **Avoid**: one effect reused across spells (also Hearthstone's Deathwing lesson [C12]), no visible
  difference between a minor spell and a major one, needing team squares to read the field (the
  side glyph and outline of the spectacle proposal do that job), and ritual flavor text with no
  visual payoff.
- **Adopt**: the battlefield remembers (scorch, craters, roots, flowers as decals). Even
  Dominions moved that way.
- Show what Dominions only writes. A ritual in Fluid Magic changes the look of its province on the
  map for as long as it lasts (3.7).

### 1.7 Craft lessons from beyond strategy games

- **Riot, "Clarity in League"** [C1, official]. Three goals in priority order: gameplay clarity;
  hierarchy, so that the most important moment draws the most attention; and minimal visual noise.
  The exception: "spells with big gameplay effects can and should be noisy, to a degree".
  Projectiles "should convey the direction they're traveling, even without motion", often by
  blurring the tail.
- **Riot's VFX style guide (2017)** [C2, official; C3 summarizes it]. Five areas: gameplay, value,
  color, shape, and timing. "Visual impact should represent gameplay impact". A **primary**
  element (for example a ring that shows a radius) must be readable, and **secondary** elements
  use value and saturation to support it. A Riot developer also wrote that the team "saturate[s]
  blacks and whites at least a bit" rather than using pure values [C5, official reply]. Riot's VFX
  update work fixes hitbox and miscommunication problems first, then readability and noise, then
  theme [C4, official].
- **Timing** [C6, C7]. VFX Apprentice names three phases. **Wind-up** builds before the peak,
  **climax** is the pop, and **fall-off** is the fade. Its workshop teaches "windup, crescendo,
  follow-through, and dissipation", and it advises blocking in timing with plain grey shapes first.
  This is Disney's **anticipation** and **follow through** from *The Illusion of Life* (Thomas and
  Johnston, 1981) [C8].
- **Hearthstone** [C9, C10, C11, C12, official and press]. Senior Effects Artist Hadidjah
  Chamberlin: the "main role of visual effects (VFX) is to communicate information to the player in
  fun and interesting ways". Effects also build suspense and celebrate wins. Big effects are kept
  for three cases: cards with huge mechanical implications, celebratory moments, and turns when the
  player is "probably not doing much else this turn anyway". Designers weigh a card's "Big
  Dealness". A typical effect takes about a week. Some animations were slowed down because they
  were too fast and distracting.
- **Hit-stop** [C13, official video, press, fan translation]. Masahiro Sakurai's "Stop for Big
  Moments!" explains freezing the action at impact, and "boss stop" for a defeated boss. A follow-up
  covers shaking the struck character and scaling the shake with camera distance.
- **Juice** [C14]. Martin Jonasson and Petri Purho's "Juice it or lose it" (2012) and Jan Willem
  Nijman's "The Art of Screenshake" are the standard references for how much feedback feels
  right.
- **Trauma shake** [C15]. Squirrel Eiserloh's GDC 2016 talk, "Juicing Your Cameras With Math",
  drives shake from a trauma value from 0 to 1 that decays over time. Shake is trauma squared times
  smooth noise. The idea is confirmed by implementations that cite the talk; the slides were not
  read.
- **Darkest Dungeon** [C16, forum]. Its zoom, shake, and tilt on every action made some players
  sick. A mod kept zoom only for critical hits. Damage, stress, and buff feedback stayed readable
  without the zoom.
- **Into the Breach** [C17, review and talk listing]. Telegraphing what will happen makes the board
  "easy to act on". The design is covered in a GDC 2019 postmortem.

**→ Fluid Magic**
- The **tier** budget (3.5) is Riot's hierarchy and Hearthstone's "Big Dealness" written as
  numbers.
- The **charge** beat is the telegraph. Because a replay knows the outcome, the charge can mark
  exactly the troops the sim chose (3.4) without inventing anything.
- Pure white is kept for impact frames of tier 3 and divine moments, as Riot does. Black and white
  are tinted slightly (3.2).
- Trauma shake and hit-stop are already in the spectacle proposal. This document only caps them by
  tier.

### 1.8 Accessibility and comfort

- **Flashes** [X1, X2, official]. WCAG 2.3.1: nothing may flash more than three times in any one
  second unless it stays below the general flash and red flash thresholds. A general flash is a
  pair of opposite changes of at least 10% relative luminance where the darker state is below 0.80.
  A red flash is any pair of opposite transitions involving a saturated red. WCAG 2.2's working
  definition, from ISO 9241-391, counts a state as saturated red when R/(R+G+B) ≥ 0.8 **and** the
  chromaticity shift exceeds 0.2 in CIE 1976 UCS. Red is handled separately because "people are
  even more sensitive to red flashing". The area limit is about 25% of a 10-degree field.
- **Motion** [X3, official]. Xbox Accessibility Guideline 117 asks for deliberate settings for
  camera shake, bobbing, motion blur, and automatic camera changes, and for a way to pause or turn
  off moving and flashing content. Halo Infinite's 0 to 100% sliders for shake and radial blur are
  its example. XAG 118 covers photosensitivity.
- **Reduced motion** [X4, official]. `prefers-reduced-motion` reports an OS setting that minimizes
  nonessential motion. MDN lists scaling and panning large objects as triggers for vestibular
  disorders, and web.dev names parallax and zoom.
- **Chromatic aberration** [X5, forum and wiki]. Players report eye strain and headaches,
  "particularly when combined with motion blur and film grain". Crimson Desert added a toggle under
  Accessibility in patch 1.04.00.

**→ Fluid Magic**: section 2.6. Flashes and tints are checked against the saturated-red test.
Chromatic aberration is kept for one divine moment and off unless Flashes is Full. Reduced motion
has a defined variant for every technique.

---

## Part 2. 2D techniques in PixiJS 8

### 2.1 What the engine provides (pixi.js 8.22.0, verified)

| Feature | Facts (source) | Use in Fluid Magic |
|---|---|---|
| `ParticleContainer` and `Particle` | Particles share one base texture (an atlas works). `dynamicProperties` chooses what re-uploads each frame: `vertex`, `position`, `rotation`, `uvs`, `color`; by default only `position`. There are **no filters, masks, or per-particle blend modes**: the container's `blendMode` applies to all. `boundsArea` must be set, or culling hides the container [P1, source] | All spell particles, one container per blend layer (`fxAdd`, `fxNormal`), as the architecture proposal does |
| Particle throughput | The PixiJS team rendered 1,000,000 particles at 60 fps on a MacBook Pro M3, against about 200,000 sprites in a normal container, "over 3x" faster than v7. A single benchmark on one machine [P2, official] | Plenty of headroom. The real limits are fill rate and overdraw (2.5) |
| Standard blend modes | `normal`, `add`, `multiply`, `screen`, `erase`, `none`, plus `min` and `max` on WebGL2. These are GPU blend equations: "hardware-accelerated and cheap" [P1] | `add` for light, `multiply` for Umbra darkening and dimming, `screen` for glows on light ground |
| Advanced blend modes | `overlay`, `color-dodge`, `soft-light`, and others need `import 'pixi.js/advanced-blend-modes'` and `useBackBuffer: true` on WebGL. They are filter-based and cost more [P1] | Avoid in battle. Editor preview only, if at all |
| Batching | A batch breaks on a change of object type, texture source (beyond about 16), blend mode, or topology [P1] | Group by blend mode, and keep spell textures in one or two atlases |
| Built-in filters | `AlphaFilter`, `BlurFilter`, `ColorMatrixFilter`, `DisplacementFilter`, `NoiseFilter`. Each filter costs a framebuffer switch, a bounds measurement, and a render-to-texture pass. One filter on a parent is cheaper than one per child. Set `filterArea` to skip bounds walks; `resolution: 0.5` is cheaper [P1] | `ColorMatrixFilter` for the world dimming and desaturation at tier 3, `DisplacementFilter` for heat shimmer |
| pixi-filters 6.1.5 | Peer dependency `pixi.js >=8`; subpath imports (`pixi-filters/shockwave`). It includes `AdvancedBloomFilter`, `ShockwaveFilter`, `GodrayFilter`, `GlowFilter`, `RGBSplitFilter`, `ZoomBlurFilter`, `MotionBlurFilter`, `OutlineFilter`, `ColorOverlayFilter`, `KawaseBlurFilter`, `SimplexNoiseFilter`, `TwistFilter`, `BulgePinchFilter`, and more [P3, source] | Bloom on the effects layer, shockwave on big impacts, godrays in the editor |
| `AdvancedBloomFilter` | Three steps: extract bright pixels, Kawase blur, combine. Defaults: threshold 0.5, blur 8, quality 4 [P3] | Effects layer only, at half resolution |
| `ShockwaveFilter` | Options `center`, `speed` (500 px/s), `amplitude` (30), `wavelength` (160), `brightness` (1), `radius` (−1 means unbounded), `time` [P3] | Fireball, Pyre Storm meteors, god death, a wall rising. Always set `radius` |
| `GodrayFilter` | `angle` (30), `gain` (0.5), `lacunarity` (2.5), `parallel` or a `center`; fractal Perlin noise per pixel [P3] | Editor preview and divine moments only. In battle, use cheap additive quads |
| `GlowFilter` | `distance` (10) is compiled into the shader, so changing it means a new filter. `quality` defaults to 0.1 [P3] | Avoid per sprite. Bake glow into textures instead |
| `RGBSplitFilter` | Per-channel offsets; defaults red (−10, 0), green (0, 10), blue (0, 0) [P3] | Chromatic aberration: one divine moment, 1 to 2 px |
| Meshes | `MeshRope` (a texture along a polyline; `textureScale`), `MeshPlane` (a subdivided plane to deform), `PerspectiveMesh` [P1] | Rope for trails, lightning, vines, roots, siphon threads, and ritual streams; plane for ripples without a filter |
| `FillGradient` | Linear and radial gradients for `Graphics` [P1, source] | Generate glow, ring, and ray textures at load time, with no image files |
| Culling, render groups, caching | `CullerPlugin`, `cullable`, `cullArea`; `isRenderGroup` for large stable subtrees; `cacheAsTexture` [P1] | Map layers; cull effects outside the view |
| `RenderTexture` | Draw targets that persist; their contents are lost when the GL context is lost (architecture proposal 4.6) | Decals: scorch, frost, roots, flowers |
| `BitmapText` | Updating it only moves quads [P1] | Floaters with element glyphs |
| `@pixi/particle-emitter` 5.0.10 | Peer dependency on `@pixi/*` `<8` [P4, npm] | Not usable with Pixi 8 without a fork. The architecture proposal's closed-form particles avoid the dependency and keep seeking exact |

### 2.2 Technique catalog

Costs are relative (low, medium, high). "RM" is the reduced-motion variant. Tiers are defined in
3.5.

| # | Technique | How in Pixi 8 | Cost | Where it belongs | RM variant |
|---|---|---|---|---|---|
| 1 | Particle bursts | Closed-form particles in a `ParticleContainer` per blend mode; shapes from one generated atlas | low per particle; overdraw dominates | every template | count ×0.5, no flicker |
| 2 | Additive glow | `blendMode: 'add'` with pre-baked soft radial textures: a white-hot center and a colored halo | low | Ember, Radiance, Tide light; heals | the same glow, steady and not pulsing |
| 3 | Bloom | `AdvancedBloomFilter` on the `fxAdd` container only, `resolution: 0.5`, `filterArea` set to the view, threshold about 0.6 | high (3 passes) | tier 2 and up, on the High setting | allowed, but no pulsing |
| 4 | Shockwave | `ShockwaveFilter` with `radius` set and `filterArea` around the blast, 0.35 to 0.6 s | medium to high | Fireball, meteors, wall, god death | an expanding ground ellipse sprite instead |
| 5 | Heat shimmer | `DisplacementFilter` with a scrolling noise sprite, scale 3 to 6 px, over burning ground only | medium | Ember linger | off |
| 6 | Trails | `MeshRope` along samples of the projectile's closed-form path at t − k·dt, with a gradient texture; the tail fades and blurs (Riot) | low | bolts, meteors, sparks, Swarm streaks | the trail stays: it shows direction |
| 7 | Lightning and arcs | `MeshRope` or a thin polyline with seeded midpoint displacement, reseeded every 60 to 80 ms | low | Tide storm (M2), Ash Colossus retaliation | not reseeded (a static fork that fades) |
| 8 | Light shafts | Additive trapezoid quads with a vertical gradient and alpha flicker. `GodrayFilter` only in the editor and at divine moments | low (quads), high (filter) | Radiance columns, Bless, the awakening | the shaft without flicker |
| 9 | Screen flash | A full-screen overlay sprite, tinted. Limiter: at most 3 a second, alpha at most 0.35, never saturated red | low | tier 2 and up, by the tier table | none; a local flash on the target instead |
| 10 | Screen shake | Trauma squared times two sines or smooth noise (spectacle 5.3, architecture 3.8) | low | impacts, by tier | off |
| 11 | Hit-stop and slow motion | Time warp in the timeline (architecture 3.8) | low | kills, tier 3 and divine | off (a 0.5 s freeze card for commander deaths, as the spectacle proposal says) |
| 12 | Decals | Stamp into a world-size `RenderTexture` (scorch, rime, root scars, flowers, rot) | low (only on stamp) | linger beats | unchanged: decals are information |
| 13 | Color grading | `ColorMatrixFilter` on the world container: dim by 30% before an Ember tier-3 impact, desaturate for Umbra, brighten for Radiance | medium (full view) | tier 3 charge, divine | a vignette sprite at the same strength, no ramp |
| 14 | Chromatic aberration | `RGBSplitFilter`, 1 to 2 px, at most 150 ms | medium | **only** the god's death, and only with Flashes on Full | off |
| 15 | Camera push | Zoom envelope at most 1.12 (spectacle) | low | tier 3 charge, divine | off |
| 16 | Fake light | Inside `evaluateInto`, actors within radius r of an impact get an added tint pulse for 150 ms, warm for Ember and cool for Tide | low (CPU) | every tier 2+ impact | kept, pulse halved |
| 17 | Silhouette flash | Pre-generated white silhouette textures (architecture 4.2) | low | hits, impacts | kept |
| 18 | Ground ellipses | Every ground effect (rings, footprints, scorch, roots, sigils) drawn with y-scale 0.45; air effects (halos, rays, sparks) not squashed | none | everywhere | kept |
| 19 | Keylines | 1 to 2 px outline baked into the primary shape's texture, light `#F4EEDF` or dark `#1C1A17` by `keylineFor(ground)` (docs/09) | none | every primary shape (2.5) | kept |
| 20 | Streak stretch | Particles stretched along their velocity (scaleX by speed); squash and stretch on impact rings | none | sparks, embers, needles | kept |
| 21 | Motion blur, zoom blur, film grain | Not used | - | - | - |

Notes:
- **Generated textures.** Glows, rings, rays, sparks, leaves, drips, shards, and thorns are drawn
  at load time with `Graphics` and `FillGradient` into the atlas the architecture proposal plans
  (section 4.4). There are no image files, which keeps them outside the 5 MB bundle limit and free
  of copyright questions.
- **Additive on light ground.** Additive light saturates toward white on light fills. Plains have
  relative luminance 0.60, Farmland 0.54, and parchment 0.72 (computed in 2.5). On those grounds a
  glow needs either a dimming underlay (a `multiply` sprite at about 0.75 under the effect for its
  duration, which doubles as anticipation) or the `screen` blend with a dark keyline. In battle this
  applies to Plains and Farmland backdrops; on the map it applies everywhere outside Forest and
  Swamp.

### 2.3 Timing: anticipation, impact, follow-through

The spectacle proposal's five beats (charge, release, travel, impact, linger) are the classic
wind-up, climax, and fall-off [C6, C8]. Concrete rules, at 1x:

| Beat | Rule | Easing |
|---|---|---|
| Charge | Particles gather toward the caster, accelerating. The mana symbol appears (color identity). Spells with carried mana show the mana bead being drawn from the caster's chip. At tier 2 and up, a faint footprint marks the sim's target troops for the last 0.25 s | ease-in (accelerating) |
| Release | A snap of at most 80 ms: the ring from `docs/09`, the caster's recoil, and the flash if the tier allows one | instant out |
| Travel | 0.15 to 0.6 s. Bolts are straight and fast; lobbed spells arc; ground spells crawl along the ground | linear or ballistic |
| Impact | The impact frame is 1 to 2 frames of white-hot core (pure white only at tier 3 and divine) plus hit-stop by weight. Kills fall here | hold 50 to 120 ms |
| Follow-through | 2 to 4 times the impact time: debris, embers, leaves, the ring expanding past the target, floaters rising | ease-out |
| Linger | Turns into a decal under the units within 1 to 2 s; only small auras stay above units | slow fade |

Block in the timing with plain grey shapes in the battle lab before adding color, as VFX
Apprentice advises [C6, C7]. The lab (architecture proposal 7) already supports fixtures at fixed
`t`.

### 2.4 Readability rules for the battlefield

1. **Hierarchy.** Screen-level effects (flash, shake, color grade, camera, distortion, chromatic
   aberration) follow the tier table (3.5). Nothing below tier 3 touches the camera.
2. **The primary shape shows the truth.** Damage lands on exactly the troops the sim chose (the
   `cast` event names the target groups; the presentation stream picks sprites inside them). Area
   spells show a footprint ellipse around the struck sprites. Buffs and curses sit on exactly the
   affected groups. Every primary shape has a keyline (2.5).
3. **Numbers stay on top.** Draw order: units, then effects, then floaters, badges, and banners.
   Effects over the unit layer have alpha at most 0.6, except on the impact frame.
4. **Value.** Units keep mid values. Effect cores are the brightest thing on screen. Pure white is
   kept for tier-3 impacts and divine moments; everything else uses the color's accent, with black
   and white slightly tinted [C5].
5. **Clear the air fast.** Linger moves under the units within 1 to 2 s (decals). Auras above units
   are small and below 0.35 alpha.
6. **At most two major effects at once.** Casts play in log order (spectacle 6.1). A third tier-2+
   effect waits for the first to reach follow-through.
7. **Identity without hue.** Every cast shows its mana symbol. Every floater carries its element
   glyph. Every color has its own motion verb and shape language (3.2).
8. **Clarity controls.** An "Effects" setting (Full, Reduced, Minimal) maps onto the existing Detail
   setting: Reduced halves particles and drops bloom; Minimal keeps only primary shapes, floaters,
   and decals.

### 2.5 Performance budgets and contrast

**Frame budget.** The architecture proposal sets the battle frame at 60 fps on a mid laptop with
integrated graphics: particles capped at 6,000, 3,000, and 1,200 by quality, about 10 draw calls,
and 6 ms of GPU time. This document adds:

| Budget | High | Medium | Low | Why |
|---|---|---|---|---|
| Full-view filter passes active at once (bloom counts as one, at 0.5 resolution; shockwave one; color grade one) | 2 | 1 | 0 (sprite fallbacks) | each filter is a render-to-texture pass [P1] |
| Additive coverage: the sum of on-screen additive quad areas divided by screen area | 2.0 | 1.0 | 0.5 | overdraw, not particle count, limits transparent particles; "the problem may be present for even small amounts of particles if their on-screen size is large" [P5, P6, P7] |
| Particles per cast, by tier (1 / 2 / 3 / divine) | 40 / 150 / 400 / 1,000 | ×0.5 | ×0.2 | fits under the 6,000 cap alongside blood and dust |
| Large soft glows (over 64 px) | 24 | 12 | 6 | one big sprite is cheaper than many small ones |

The coverage figure is a starting value to be measured in the lab. It needs a cheap counter in
`RenderStats` (architecture 4.1). GPU Gems 3 describes rendering expensive particles to a smaller
render target to cut overdraw [P5]. The same idea is behind bloom at half resolution. Small sprites
can vanish in heavily downsampled blurs [P8], which is another reason to keep bloom at 0.5 and not
lower.

**Map budget.** The map renders continuously during play.
- Map effects take at most 1 ms CPU and 1.5 ms GPU per frame.
- At most 4 animated ritual completions run at once; later ones queue.
- Channeling sigils are one rotating sprite each, and persistent ritual badges are static icons.
- The map ticker stops while the replay modal is open (architecture 4.1).
- A province "wash" (3.7) uses one stencil mask from that province's polygon. Four at once is
  affordable.

**Editor budget.** The pretender preview is a small canvas (about 512 by 512 px). There, bloom,
godrays, and glow at full quality cost little.

**Contrast (computed).** WCAG contrast of each palette step from `docs/09` against each terrain
fill, the parchment, and the dark UI. The script is in `pretender-design/vfx-tools/contrast.mjs`.

The table picks, for each ground, whichever of the color's three steps contrasts most with it.

| Color | Weakest grounds (best own step) | Below 3:1 on | Step that carries it |
|---|---|---|---|
| W Radiance | Parchment 1.41, Plains 1.62, Farmland 1.79, Mountains 2.61 | four grounds | none of its own on light ground, so it needs the dark keyline; its light steps on dark ground (Forest 9.41, dark UI 17.4) |
| U Tide | Wasteland 3.27, Hills 3.43 | none | dark `#1E3F7A` on light ground (5.7 to 7.6), light `#9ED8FF` on dark (Forest 6.2, dark UI 11.3) |
| B Umbra | Forest 1.95, Swamp 3.26 | Forest | dark `#1A1024` on light ground (up to 13.5), a derived lighter rim on dark ground (`#C9A6EA`: Forest 4.5, dark UI 8.4; see 3.2) |
| R Ember | Hills 2.95, Swamp 3.16 | Hills | char `#7A1E12` on light ground (5.8 to 7.6), core `#FFB347` on dark (Forest 5.3, dark UI 9.8) |
| G Loam | Wasteland 3.02, Hills 3.19 | none | dark `#244F22` on light ground (5.3 to 7.0), light `#A6D96A` on dark (Forest 5.7, dark UI 10.6) |

Three colors drop below 3:1 somewhere, and for every color the step that works flips between
light and dark ground. Primaries alone are weak in many places (Umbra 1.35 and Loam 1.36 on
Forest). The `docs/09` `keylineFor` rule fixes both: light `#F4EEDF` or dark `#1C1A17`, whichever
contrasts more with the ground. The better keyline gives Plains 10.7, Farmland 9.7, Forest 8.1,
Hills 4.53, Mountains 6.7, Swamp 4.9, Wasteland 5.5, parchment 12.8, and dark UI 15.0, so at least
4.53:1 everywhere (`vfx-tools/keyline2.mjs`). Rule: **every primary shape carries a keyline by
`keylineFor(ground)`, and its body uses the palette step that contrasts more with that ground.**
Secondary particles need neither.

### 2.6 Accessibility settings and reduced-motion variants

The spectacle proposal (section 12) and the architecture proposal (section 3.9) already define
Gore, Shake, Hit-stop, Flashes, Reduced motion, and Detail. This document adds:

- **Red-flash check (computed).** R/(R+G+B) for every palette step: W 0.33 to 0.44; U 0.14 to
  0.25; B 0.33 to 0.36; R `#FD6533` 0.62, `#7A1E12` 0.72, `#FFB347` 0.50; G 0.00 to 0.34. **None
  reaches the 0.8 of WCAG 2.2's saturated red** [X1]. The danger is elsewhere: `docs/09`'s "Hit: 0.15
  s red tint flash", if built with `#FF0000` (ratio 1.00), is a saturated red. With 300 sprites
  flashing at once over a large share of the screen, it could break the area threshold. Use a tint
  like `#C8504A` (0.56) or `#B22222` (0.72), and let the flash limiter count aggregate red tint area
  as well as full-scene flashes.
- **Chromatic aberration** appears only at the god's death, only with Flashes on Full and Reduced
  motion off (X5). It is not used anywhere else.
- **Effects** (Full, Reduced, Minimal) as in 2.4, rule 8.
- **Reduced motion, by technique**: the RM column in 2.2. Two invariants: **timing is unchanged**,
  so the replay stays in step with the log and tests pin the same cue times; and nothing that
  carries information is removed (projectiles, footprints, decals, floaters, the mana symbol).
- **A discrepancy to settle.** Under reduced motion the spectacle proposal scales particles by
  0.3, the architecture proposal by 0.5. Recommendation: 0.5 with flicker removed, because
  particles here carry the color's motion verb, which is part of its identity.

---

## Part 3. The signature-effect grammar

### 3.1 Formula

A spell's look is composed, not hand-made per spell:

**look = template(primitive) × verb and shapes(color) × material(element) × tier(level, breadth)
\+ flourish(caster, if the caster is the pretender)**

- The **template** fixes the beats and the primary shape (3.4).
- The **color** fixes motion, shapes, palette, blend, and symbol (3.2).
- The **element** fixes the impact material and the decal (3.3).
- The **tier** fixes duration caps, particle caps, and screen effects (3.5).
- The **flourish** is the pretender's cosmetic signature (3.6). It never changes timing or tier.

The storyboards in spectacle 6.3 become **overrides** of this default, for spells that earn
bespoke treatment. Any spell without one, including all of M2's W, U, and B spells, still gets a
correct look on day one.

### 3.2 The five colors

| | W Radiance | U Tide | B Umbra | R Ember | G Loam |
|---|---|---|---|---|---|
| **Source imagery** | Plains, sun; law, structure [M1–M3] | Island, water drop; knowledge, deceit, caution | Swamp, skull; death, sacrifice, power | Mountain, flame; emotion, impulse, destruction | Forest, tree; nature, wildlife, connection |
| **Primary verb** (docs/09) | radiate: straight lines from a center | ripple: rings | sink: down, drips, smoke falls | rise and flicker | spread along the ground |
| **Secondary verbs** | descend (light from above), ring | refract, freeze, arc | drain (pull toward the caster), wither, rise from below | burst, jitter, shimmer | grow (scale with overshoot), branch, erupt from below |
| **Shape language** | straight rays, perfect circles, symmetric rosettes, four-point sparkles; no jitter | concentric rings, sine waves, hexagonal shards, mist sheets, forked lightning | drips, tendrils, inward spirals, cracks, falling smoke | jagged flames, sparks, embers, smoke columns, lava cracks | curves, branching roots and vines, leaves, petals, spores, bark |
| **Light model** | emissive, `add`; warm white body, gold rim | emissive, `add`; cyan light step; the "air bends" (displacement) at tier 2+ | **absorptive**: `multiply` blots and desaturation, with a violet rim | strongly emissive, `add`; orange-gold core, dark char smoke | mostly matter, `normal` blend; only heals glow, soft green-gold |
| **Palette roles** (docs/09) | body `#F3E6B8`, rim `#D9B85C`, core `#FFFFFF` (tier 3 only) | body `#3A7BD5`, dark `#1E3F7A`, light `#9ED8FF` | body `#3D2B4F`, dark `#1A1024`, rim `#9B4DCA` | body `#FD6533`, char `#7A1E12`, core `#FFB347` | body `#00674B`, dark `#244F22`, light `#A6D96A` |
| **Ground decal** | a gilded sigil ring that fades over 2 s; ash outlines for holy kills | rime, puddles, wet sheen | rot stains, withered grass | scorch, cinders, craters | grass tufts, flowers, root scars, leaf litter |
| **Signature moment** | the sun column (a vertical shaft) | the ripple lens (a ring that bends what is under it) | the drain (wisps pulled from targets to the caster) | the burst (a ring plus shockwave, embers rising) | the eruption (thorns, roots, or beasts out of a ground crack) |
| **Avoid** | jitter and smoke (that is Ember and Umbra); confusing Bless with W spells (Bless stays tier 1, with the bell) | green tints; displacement as its only cue (it is off under reduced motion) | going invisible on dark ground; pure black | saturated red flashes; shake on every cast | emissive greens (they read as poison) |
| **Cue without hue** | ray geometry plus the sun-disc glyph | rings plus the wave glyph | downward motion and grey-out plus the skull-drop glyph | upward sparks plus the flame glyph | ground-hugging motion plus the leaf glyph |
| **Sound family** (sound proposal) | high shimmer, chime, swell | water swirl, splash | sub drone, reversed whisper, hiss | crackle, roar, whoosh-boom | rustle, creak, rumble, crack |

Holy magic (priests' Bless) uses the White palette with straight rays from above and the bell.
It is not a color, so it keeps the bell and the sun disc and stays tier 1.

**Testable rules for colors**: the five primary verbs are distinct; every color has a symbol and a
decal; every color's primary shape has a keyline; rims keep at least 3:1 against the dark UI. Umbra
needs a lighter rim than `#9B4DCA` for the darkest grounds. `#C9A6EA` gives 4.5 on Forest and 8.4 on
the dark UI (computed). Derive it, as `docs/09` allows lighter and darker steps.

### 3.3 Elements (damage materials)

The sim's elements are `physical`, `fire`, `nature`, `cold`, `holy`, `decay`
(`src/content/types.ts`). In M1 they have no rules effect (docs/05). They choose the material of an
impact. The spectacle proposal's table (5.5) gives wound, kill, and corpse per element; this table
adds ownership and the map form.

| Element | Owning color | Impact material | Decal | Map form (remoteDamage) |
|---|---|---|---|---|
| fire | R | ember sparks, orange flash, smoke wisps; kills burn out | scorch ring, crater for meteors | ash and embers fall over the province polygon, then a scorch texture |
| nature | G | splinters, leaves, thorn spikes | thorns stay 2 s, leaf litter | brambles sweep across the polygon |
| cold | U | ice shards; kills freeze, then shatter or topple | rime | snow and sleet fall, then a frost rim on borders |
| holy | W | white flare, straight rays; kills burn white from within | ash outline | rays of light from above, sweeping across |
| decay | B | green-black ooze; kills wither and sink | dark stain | a creeping stain spreads from the center |
| physical | none | sparks, chips, blood by blood type (spectacle 5.5) | as the spectacle proposal | dust |

The Great Wyrm's breath is display only, tinted by the nation's color (docs/05). With the AoW4
research's `breathColor`, it takes one of the design's pip colors. Its look is the color's grammar
with the breath template (a cone, as in Total War [T1]).

### 3.4 Primitives: battle templates

Each primitive has one template. A spell with several effects uses the template of its **first**
effect, and the later effects add their markers (Blood Fury's −2 defense shows as a chip and the
defense-debuff visual on the same squad).

| Primitive (docs/02 §5) | Template | Beats and primary shape | The truth it must show | M1 spells |
|---|---|---|---|---|
| `damage` single | **bolt** | Charge at the staff tip; a straight or lobbed projectile by color with a trail; local impact | One troop. **Armor piercing**: a spark exits behind the target. **Armor negating**: the target's armor overlay dissolves for a moment. Zero damage: a grey "0" and a fizzle | Ember Dart |
| `damage` squad | **engulf** | A ring under the block; the color's material wraps every sprite, staggered 20 to 40 ms | Every troop of the group; kills from the log | none in M1 |
| `damage` area(n) | **burst** or **rain** | Travel to the row; a footprint ellipse around the struck sprites; impacts on exactly the n sim-chosen troops (proxies beyond the visible ones). Rain (n ≥ 10) splits into n separate strikes | n troops in the target row, shared across groups (docs/02, Implementation decisions) | Thorn Spray, Fireball, Pyre Storm (rain) |
| `buff` | **aura** | Material flows from the caster to the targets; a per-stat mark (spectacle 6.4); chips | Exactly the buffed groups; the duration as a chip; one visual slot per stat family, newest wins | Warcry, Blood Fury, Bark Skin, Bless |
| `debuff` | **curse** | Material clings to the targets (vines, mist, chains of smoke); the per-stat debuff mark; a countdown chip for rounds(n) | The `expire` event dissolves it | Entangle |
| `heal` | **restore** | Rising motes and a flash in the healing color on wounded sprites; "+n" floaters. `removeDebuffs` dissolves the curse visual into the healer's material (petals for Loam) | Only groups that were healed; the amount from `heal` | Regrowth |
| `summon` | **arrival** | A portal by color (spectacle 6.5: Ember fire portal, Loam ground split, Radiance descending light, Tide water ring, Umbra rising from corpses); then the block forms; badge count | The `summon` event's count and row. Summoned sprites keep a faint color rim all battle, because they vanish at its end | Swarm |
| `fatigueDrain` | **siphon** | Threads (`MeshRope`) from the drained caster to the spell's caster; the target slumps; its fatigue bar ticks | The enemy caster with the most pips, or all of them (docs/02) | none in M1 |
| `moraleShock` | **terror** | A shock ring in the color (Umbra: a dark ripple and desaturation pulse; Radiance: a blinding ring); targets cower | The morale check that follows: hold or rout, as logged | none in M1 |
| `fieldEffect` | **field** | Spectacle 6.6 (storm, fog, wall); the wall's material comes from the caster's color: light for W, ice for U, bone for B, fire for R, thorns for G | One of each kind at a time; field chips in the HUD | none in M1 (supported) |
| damage plus `heal` on self (Life Leech, M2) | **drain** | Wisps from each struck target to the caster, which brightens | Damage and heal from the log | none in M1 |

**Marks for mechanics that are not spells** (they reuse the grammar):
- **Carried mana spent** (Warcry, Pyre Storm, Swarm, Regrowth): at charge, a bead with the mana
  symbol leaves the caster's carried-mana chip and is drawn into the staff. Pillar 2, "magic as
  fluid", becomes visible in every such cast.
- **Life drain** (the Black bless): after the phase, a thin red-violet wisp from each victim to
  each striker still alive (docs/02 pays it after the phase).
- **Fire shield** (Ash Colossus): after the phase, ember sparks jump to each striker that dealt
  damage, with a "−5" floater.
- **Regeneration** (Wild Spirit, the Green bless): green motes and a "+n" each round.
- **Bless on sacred units** (pips ≥ 4): a second aura ring carrying the color's symbol (AoW4
  research 3.6).

### 3.5 Tiers

**Tier** = by level: L1–2 is 1, L3–4 is 2, L5–6 is 3. Add 1 when a spell reaches an area of 5 or
more, all friendly or all enemy groups, or places a field effect. The maximum is 3. Divine is
reserved for the pretender's big moments (3.6). The M1 spells come out as: Ember Dart 1, Thorn
Spray 1 (area 3), Bark Skin 1, Bless 1; Fireball 2, Warcry 2, Blood Fury 2, Entangle 2, Swarm 2;
Pyre Storm 3, Regrowth 3. This matches the spectacle proposal's weights (Fireball shakes 0.30, and
Pyre Storm and Regrowth get the long forms).

| | Tier 1 (minor) | Tier 2 (major) | Tier 3 (epic) | Divine |
|---|---|---|---|---|
| Charge, full form | 0.30 to 0.45 s | 0.45 to 0.8 s | 0.8 to 1.3 s | 1.5 to 2.5 s |
| Total, full form (short form) | ≤ 1.3 s (0.8) | ≤ 2.0 s (1.4) | ≤ 3.2 s (2.2) | ≤ 4 s (no short form) |
| Particles (High) | ≤ 40 | ≤ 150 | ≤ 400 | ≤ 1,000 |
| Full-scene flash | none | 15% (spectacle 6.1) | 15 to 20% | ≤ 35% (architecture cap) |
| Shake (max trauma) | ≤ 0.05 | ≤ 0.30 | ≤ 0.70 in total | ≤ 0.60 |
| Bloom | none | effects layer | effects layer | effects layer plus a brief world bloom |
| Distortion (shockwave) | none | explosions only, radius ≤ 140 wu | yes | yes |
| Color grade (world) | none | none | dim, desaturate, or brighten by color | yes |
| Camera | none | none | push ≤ 1.12 (spectacle) | push and slow motion |
| Global hit-stop | none | none | featured kills only | yes, "boss stop" [C13] |
| Chromatic aberration | none | none | none | only the god's death |
| Caption | name (spectacle 6.1) | name | name with mana symbols | name card with the god's sigil |

### 3.6 The pretender: the showcase

The owner wants pretenders as rich as Dominions' and customization at AoW4's level. Magic is
where those meet. The god is the brightest thing in its army and on its map, and every mechanic
poured into it shows.

**Mechanics that show** (automatic, cannot be removed). The AoW4 research (3.6) lists these: pip
glow, the bless ring, orbiting symbols at 6 pips, the dominion radius, the awakening state, and
body tags. The VFX specifics:
- **Aura motes**, split by pip count across colors. Each mote moves in its color's verb, so a R4G2
  god shows rising embers and ground-hugging motes in a 2:1 ratio. A player can read the build from
  the motion alone.
- **Bless unlock in the editor.** When a color reaches 4 pips, the second ring forms with that
  color's symbol (a tier 1 cast, with a chime). docs/05 already asks that the player "sees the bless
  effect appear live when 4 is reached". At 6 pips the symbols begin to orbit.

**Fixed signature effects per chassis** (mechanical, never cosmetic):

| Chassis | Signature (idle and in battle) | When it acts |
|---|---|---|
| Oracle of the Flux | floating motes and research glyphs that drift upward | casting: glyphs spin into its sigil circle |
| Titan | heat or light along the great sword's edge | each swing leaves a short arc trail (`MeshRope`) |
| Great Wyrm | wings, smoke at the nostrils in the breath color | breath: a cone template in the breath color, ammo shown as pips |
| Living Monolith | glyphs pulsing slowly, roots in the ground | each dominion check: a pulse runs through the glyphs (map) |
| Wild Spirit | flicker and translucency (stealthy) | regeneration motes each round |
| Ash Colossus | embers rising from its cracks | fire shield sparks when struck (3.4) |

**Cosmetic choices** (in `PretenderLook`, outside `GameState`, per the AoW4 research's Option A):
- **Aura shape**: 4 in M1 (AoW4 research 3.2: halo ring, orbiting motes, ground sigil circle, crown
  of sparks). Its colors always come from the pips.
- **Cast flourish**: a new choice of 4, played during the charge beat of every spell the god casts:
  *sigil wheel* (the god's sigil turns on the ground), *mantle* (a cloak of the dominant color's
  material: embers, leaves, light, mist, or smoke), *halo burst* (a ring of symbols that snaps
  outward on release), and *ascension* (the god lifts 6 wu and settles). The flourish adds to the
  charge but **never lengthens it or raises its tier**. Riot's hierarchy rule applies to gods too:
  the god's Ember Dart is still a tier-1 spell [C2].
- **Sigil inscription**: the god's sigil (AoW4 research 3.3) sits three times on the rim of its cast
  circles and its map ritual sigils. The mana symbol stays at the center, so color identity never
  depends on the sigil.
- **Breath color** (Wyrm only): one of the design's pip colors.

**Divine moments** (tier divine; visible to whoever can see the province):
- **Awakening** (a dormant god at Month 12, an imprisoned one at Month 36, per docs/05): a 2.5 s
  map moment at the capital in the dominant color's verb. Ember: the mountain cracks and a fire
  geyser rises. Loam: the ground splits and roots heave. Radiance: a sun column. Tide: a waterspout.
  Umbra: the shadows pool and something rises. An imprisoned god's runic chains shatter. Then the
  marker appears with a name card. It is tier divine only for the owner; rivals who see it get tier
  2.
- **The god falls in battle**: spectacle 8.2 ("time stops"), with chromatic aberration as the only
  use of it in the game.
- **First cast of a battle**: the god's first cast in each battle plays its flourish in full; later
  casts use the short form, as for other casters.

**Editor preview** (Phase 9). A small Pixi canvas runs the battle renderer's effect code, so the
editor and the replay can never disagree.
- *Cast*: plays the flourish and a tier-1 bolt in the dominant color.
- *Showcase*: loops idle, flourish, and the signature.
- *Color-blind preview*: a `ColorMatrixFilter` that simulates the deficiencies, a check unique to
  Fluid Magic.
- The bless-unlock moment plays live as pips change.

AoW4's "most recent enchantment wins the slot" [A4] becomes the rule for the god's own buffs in
battle.

### 3.7 Rituals and dominion on the map

The strategic layer is where Dominions keeps its drama in words [D5]. Fluid Magic shows it. The
rules follow fog of war (`visionOf` and `visibleCommanders` in `src/sim/visibility.ts`).

**Channeling** (a commander with order `castRitual`):
- The caster's marker gets a rotating ground sigil: the mana symbol at the center and the god's
  sigil on the rim. Around it, a progress ring shows 1 − daysLeft/castDays.
- For a targeted ritual, a stream (`MeshRope` with a scrolling dash texture) flows along the
  province path from the caster to the target, **for the caster's nation only**.
- Rivals who can see the caster's province see the sigil (no name and no target), as Warhammer II
  shows rituals in progress [T7]. The target is revealed only when the ritual lands.

**Completion and failure** (from the `ritual` message and its province; see 3.8):

| Ritual primitive | Map template | What remains while it lasts |
|---|---|---|
| `summonToProvince` | **portal** in the color at the province (fire ring, ground split, light descent, water ring, smoke rising); the new squad or commander marker pops in. Commanders (Salamander, Treant) get tier 2 with a name card | the marker itself |
| `provinceGrowth`, `provinceSupply` +, `provinceMaterials` | **wash**: from the center to the borders, the color's material spreads across the province polygon (a mask from its polygon): sprouts for Fertile Season, a golden wheat shimmer for Bounty of the Loam, ember light at the fort for Forge of Cinders | a badge with the remaining months as a ring, from `ProvinceEffect.source` and `untilDay` |
| `provinceDefenseBuff` | **stitch**: a pattern runs along the province's inner border (thorns for Rootwall) | the border pattern at low alpha, plus a shield badge |
| `provincePop` −, `provinceSupply` −, `provinceUnrest` + | **blight**: the province dims, a fire front sweeps across (Burn the Fields), floaters "−6% pop", "−50% supply", "+15 unrest" | a scorched overlay texture while the supply effect lasts |
| `remoteDamage` | **rain over**: the element falls over the polygon for 2 s (3.3: ash and embers for Ash Rain); each army marker there flashes, with a "−N troops" floater | scorch for some days (presentation only) |
| `scry` | **eye**: an eye opens over the province, and the fog rolls back with a ripple | the scried look while the effect lasts |
| `dominionPush` | **kindle**: candles ignite one by one, and a tint wave spreads from the temple | the candles |
| `manaConvert` | **flow**: symbols stream from one mana pool to the other in the top bar | none |
| failure (any) | **fizzle**: the sigil cracks and fades in a grey puff | none |

**Dominion.** Draw dominion as an overlay with levels, with a slow drifting noise texture in the
nation's banner color, as Warhammer draws corruption [T6]. The candle stack (docs/07) stays the
exact count. A province changing dominion owner gets a short **flip pulse** (a ring from the
center).

**Sound on the map** (AoW4's sound complaint, 1.1): each map template gets a short sound from the
color's family, ducked under the music, and none at speeds 3 and 4.

**Accessibility on the map**: the map shares the flash limiter, the red-flash rule, and reduced
motion. Under reduced motion the wash appears in 0.3 s without sweeping, and nothing pulses.

### 3.8 Hooks: no new primitives, one optional sim addition

**No new sim primitives.** Every template reads existing data: the `BattleEvent` kinds `cast`,
`damage`, `heal`, `buff`, `expire`, `summon`, `field`, `fieldEnd`, `fatigue`, `rout`, `death`;
spell definitions (`effects`, `level`, `color`, `carriedMana`); commanders' `castRitual` orders;
`provinceEffects` (`source`, `untilDay`); and messages. The new motion presets (`drain`, `orbit`,
`fall`, `branch`, beside the architecture proposal's `ballistic`, `rise`, `spread`, `ripple`,
`radiate`, `sink`) are presentation data in `src/present` and `src/content/presentation`.

**Optional sim addition** (recommended for Phase 8 or 9). Today, `src/sim/rituals.ts` posts "<Spell>
is complete at <Province>." or "<Spell> failed: <reason>." as text to the **caster's** nation only.
Two gaps follow. The renderer must parse text to know which spell landed. And the victim of Ash
Rain or Burn the Fields gets no message at all, so neither a message nor an effect tells that player
what happened. Exact proposal:
1. Add `spell?: string` (a spell id) to the message record. Rituals set it on both messages above.
2. When a ritual completes on a province whose owner is a nation other than the caster's, and the
   spell has any of `remoteDamage`, `provincePop` with deltaPct < 0, `provinceUnrest` with delta >
   0, or `provinceSupply` with deltaPct < 0, post to that owner: kind `ritual`, text "<Spell> struck
   <Province>.", `province`, and `spell`. This is deterministic and does not change any outcome. It
   changes the state hash, so the determinism fixtures are regenerated in the same commit.
3. Record the rule at the bottom of docs/02 (Implementation decisions).

The map effect layer is then a pure function of the new messages since the last frame plus the
current state: `planMapFx(messages, state, viewer): MapCue[]` in `src/present`. It needs no state
diffing and is easy to test.

**Presentation data** (render data; the sim and AI never import it):

```ts
// src/content/presentation/magic.ts
export type MotionVerb =
  | 'radiate' | 'ripple' | 'sink' | 'rise' | 'spread'   // docs/09 primary verbs
  | 'drain' | 'orbit' | 'fall' | 'branch' | 'ballistic';
export type BattleTemplate =
  | 'bolt' | 'engulf' | 'burst' | 'rain' | 'aura' | 'curse' | 'restore'
  | 'arrival' | 'siphon' | 'terror' | 'field' | 'drain' | 'breath';
export type MapTemplate =
  | 'channel' | 'portal' | 'wash' | 'stitch' | 'blight' | 'rainOver'
  | 'eye' | 'kindle' | 'flow' | 'fizzle';
export type Tier = 1 | 2 | 3 | 'divine';

export interface ColorGrammar {
  color: Color;
  verb: MotionVerb;                 // distinct across the five colors (tested)
  secondary: readonly MotionVerb[];
  blend: 'add' | 'normal' | 'multiply';
  steps: { body: number; dark: number; light: number; rim: number };
  shapes: readonly ParticleShape[]; // 'ray' | 'ring' | 'shard' | 'drip' | 'spark' | 'leaf' | ...
  decal: DecalKind;
  symbol: ManaSymbolId;             // shown at every charge
  sound: SoundFamilyId;
}

/** Derived for every spell; content overrides only where a storyboard exists. */
export interface SpellLook {
  template: BattleTemplate | MapTemplate;
  tier: Tier;
  storyboard?: StoryboardId;        // spectacle 6.3 overrides
}
export function lookFor(spell: SpellDef): SpellLook; // template from effects[0], tier from 3.5
```

### 3.9 Signature moments for M1, by priority

| # | Moment | Where | Effort | Notes |
|---|---|---|---|---|
| 1 | Pyre Storm | battle, tier 3 | L | the M1 showpiece: dimming, vortex, 12 meteors, shockwaves, craters |
| 2 | Fireball | battle, tier 2 | M | the most cast big spell; shockwave and scorch |
| 3 | Regrowth | battle, tier 3 | M | the Green showpiece: a wave of flowers, curses turning to petals |
| 4 | Swarm | battle, tier 2 | M | a cloud of 200 out of a crack (spectacle) |
| 5 | Pretender awakening | map, divine | M | once per god, seen by every player who can see it |
| 6 | Bless unlock and Cast in the editor | editor | S | the first magic a player sees |
| 7 | Entangle | battle, tier 2 | M | vines with `MeshRope`, struggling lunges |
| 8 | Ash Rain, Burn the Fields | map | M | needs the victim message (3.8) |
| 9 | Bind Salamander, Awaken Treant | map, tier 2 | M | portal and name card |
| 10 | Warcry, Blood Fury | battle, tier 2 | S | banners and red veins (spectacle) |
| 11 | Ritual channeling and stream | map | S | one sprite and one rope per caster |
| 12 | Dominion overlay and flip pulse | map | S | an overlay already needed in Phase 8 |
| 13 | Generic templates for every primitive | both | M | M2's spells look right before their storyboards exist |

### 3.10 Tests

Pure tests (Vitest, mirroring `src/`):
1. `lookFor` returns a look for every spell in the content registry (M1 Red, Green, and holy, plus
   the test-only spells for W, U, and B primitives).
2. Each of the five colors has a `ColorGrammar`, and the five primary verbs are distinct.
3. **Red flash**: every flash and tint color in presentation content has R/(R+G+B) < 0.8, the first
   half of WCAG 2.2's saturated-red definition, which is enough to rule it out. The `docs/09` hit
   tint is included.
4. **Contrast**: for every terrain fill, the parchment, and the dark UI, the keyline that
   `keylineFor` picks gives at least 4.5:1 (today the minimum is 4.53, on Hills), and every
   template's primary shape has a keyline. A new terrain or palette color reruns the check.
5. **Tier budgets**: over every spell's timeline cues, particle counts, flash alpha, trauma, charge
   and total duration stay within the tier table; camera and distortion cues appear only at tier 3
   and divine.
6. **Reduced motion**: for every template, the filtered timeline has no shake, camera, distortion,
   chromatic aberration, or global hit-stop cues, and every impact keeps its time.
7. **Cosmetics are inert**: the same battle with two different looks (flourish, aura, sigil) gives
   identical cue times and an identical script; the headless game gives identical state hashes.
8. **Truth**: impacts fall on the sim's targets; spells with carried mana have a bead cue; a cast
   with zero damage has a fizzle cue; summoned blocks match the `summon` count.
9. **Map planning**: `planMapFx` is deterministic; a rival's ritual produces no cue outside the
   viewer's vision; a hostile ritual on the viewer's province produces a cue (with the 3.8
   addition).
10. The purity guard covers `src/content/presentation/**` (the sim and AI do not import it).

Smoke tests (Playwright, in the battle lab):
11. Snapshots at a fixed `t` of the five colors' tier-1 bolts and tier-2 bursts, normal, in
    grayscale, and under simulated deuteranopia. They are reviewed by eye, cheaply.
12. The Pyre Storm fixture at High stays within the particle cap and the filter pass budget
    (`stats()`).

### 3.11 Suggested changes to the other proposals

| Proposal | Section | Suggestion |
|---|---|---|
| `docs/09` | Animation, "Hit" | Name the hit tint: not `#FF0000` but a tint with R/(R+G+B) < 0.8, for example `#C8504A` |
| Architecture | 3.9 flash limiter | Count aggregate red-tint area as well as full-scene flashes |
| Architecture | 3.8 motion presets | Add `drain`, `orbit`, `fall`, `branch` |
| Architecture | 4.2 scene graph | Optional `AdvancedBloomFilter` on `fxAdd` (High only, 0.5 resolution); a dimming `multiply` underlay for additive effects on light ground |
| Architecture | 4.5 adaptive quality | Add the filter-pass and additive-coverage budgets (2.5) to the step-down rule |
| Spectacle | 6.1 | Charge and total durations capped by tier (3.5); the god's flourish plays only in the charge window |
| Spectacle | 6.5 | Replace the per-primitive list with the template table (3.4), which adds burst versus rain, drain, breath, and the marks for carried mana, life drain, fire shield, and regeneration |
| Spectacle and architecture | reduced motion | Agree on particles ×0.5 without flicker (2.6) |
| AoW4 research | 3.2 and 3.6 | Add the cast flourish (4 styles) and the sigil inscription to `PretenderLook` |
| UI spec | ritual panel | When a target is hovered, preview the map template at low intensity on that province |

### 3.12 Phase placement

- **Phase 8** (map and core UI): the dominion overlay and flip pulse; channeling sigils; one
  generic completion pulse in the color with its symbol; the map effect pool and budget; the
  optional message addition (3.8), if adopted.
- **Phase 9** (remaining UI): the pretender editor preview (Cast, Showcase, the bless unlock,
  color-blind preview); the cast flourish and sigil inscription in the Look tab; the ritual panel's
  target preview.
- **Phase 10** (replay viewer): the battle templates, tiers, color grammar data, and the 11 M1
  storyboards as overrides.
- **Phase 11** (art and animation): generated textures (glows, rays, rings, shards, drips, leaves,
  thorns), decals, the map templates per ritual primitive, the chassis signatures, the four
  flourishes, and the awakening moments.
- **Phase 12** (balance and polish): tune the budgets on target hardware; add a playtest question
  to `docs/09-balance.md`: "Did any spell look bigger or smaller than what it did?"
- **M2**: storyboards for W, U, and B spells; field effects with their spells (Tempest); weather
  and world tints from M2 global rituals; more flourishes; AoW4-style visual transformations for
  the god.

### 3.13 Risks and open questions

- **Overdraw on integrated GPUs.** Mitigated by the coverage budget, auto quality, and half-resolution
  bloom. Measure in the lab first.
- **Filters on the world container at 1080p.** Mitigated by `filterArea`, short durations, and the
  two-pass cap. Without bloom the look must still work, so design without it first.
- **Visual noise against the owner's "flashy".** The tier budget concentrates the flash at the
  moments that matter. The Effects setting lets players choose.
- **Effort in Phase 11.** Build the generic templates first (they cover every spell), then the
  storyboards in the order of 3.9.
- **Open: enemy channeling.** Showing a rival's sigil in provinces the player sees is a small
  information gift. Warhammer II shows rituals in progress [T7]; Dominions does not, as far as was
  found. Recommendation: show it, with no name or target.
- **Open: bloom in M1.** Recommendation: High only, and judged in the lab against the no-bloom look.
- **Open: chromatic aberration at all.** Recommendation: only the god's death, or defer to M2.
- **Source gaps.** No documentation was found for Arena's per-color effects, AoW4's world map cast
  visuals, Heroes III's original spell animations, or Total War's bombardment visuals. The grammar
  does not depend on them.

---

## Sources

Tags: official, source, review, wiki, forum, weak. All were reached through search extracts except
those marked "read directly".

**Age of Wonders 4**
- [A1] review: Cog Connected, https://cogconnected.com/review/age-of-wonders-4-review/
- [A2] review: TechRaptor, https://techraptor.net/gaming/reviews/age-of-wonders-4-review ; Shacknews, https://www.shacknews.com/article/135263/age-of-wonders-4-review-score ; Game8, https://game8.co/reviews/age-of-wonders-4/366 ; New Game Network, https://www.newgamenetwork.com/article/2668/age-of-wonders-4-review/ ; Wccftech, https://wccftech.com/review/age-of-wonders-4/
- [A3] forum: https://steamcommunity.com/app/1669000/discussions/0/3828666283438110304/
- [A4] official: Dev Diary #11, https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-11 ; forum thread, https://forum.paradoxplaza.com/forum/threads/dev-diary-11-the-art-of-age-of-wonders-4.1576391/ ; date from https://aow4.paradoxwikis.com/Developer_diaries
- [A5] official: Dev Diary #1, https://paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-1
- [A6] review: GameSkinny, https://www.gameskinny.com/tips/age-of-wonders-4-how-magic-tomes-and-research-work/
- [A7] wiki: https://aow4.paradoxwikis.com/Strategic_spells
- [A8] official: Dev Diary #20, https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-20
- [A9] forum and patch notes: https://steamcommunity.com/app/1669000/discussions/2/3808406410972565567 ; https://steamcommunity.com/app/1669000/discussions/2/3808405578494961918 ; https://www.magicgameworld.com/?p=79200

**Total War: Warhammer**
- [T1] review and wiki: https://alcasthq.com/warhammer-lore-of-fire-magic-type ; https://alcasthq.com/warhammer-lore-of-heavens-magic-type/ ; https://totalwarwarhammer.fandom.com/wiki/Lore_of_Light ; https://totalwarwarhammer.fandom.com/wiki/Lore_of_the_Deep
- [T2] wiki: https://totalwarwarhammer.fandom.com/wiki/Winds_of_Magic
- [T3] forum and guides: https://steamcommunity.com/app/364360/discussions/0/351660338685393106 ; https://1d6chan.miraheze.org/wiki/Total_War_Warhammer/Tactics/Magic ; https://gmanreviews.blog/total-war-warhammer-3-magic-guide/ ; https://steamah.com/total-war-warhammer-ii-lore-of-light-spell-guide/
- [T4] forum: https://steamcommunity.com/workshop/filedetails/discussion/3142209008/4521135854308796663 ; https://steamcommunity.com/sharedfiles/filedetails/comments/2789865576 ; https://forum.quartertothree.com/t/total-war-warhammer-3/150996?page=17 ; https://steamcommunity.com/app/1142710/discussions/0/6792046983686822785
- [T5] wiki: https://warhammerfantasy.fandom.com/wiki/Winds_of_Magic ; https://whfb.lexicanum.com/wiki/Azyr
- [T6] forum: https://steamcommunity.com/sharedfiles/filedetails/comments/2105377416 ; https://steamcommunity.com/workshop/filedetails/discussion/3368217482/4630358389444104853
- [T7] review: https://www.keengamer.com/articles/reviews/total-war-warhammer-2-review/ ; https://techraptor.net/gaming/reviews/total-war-warhammer-2-review-lord-of-vortex
- [T8] official wiki: https://wiki.totalwar.com/w/Total_War_WARHAMMER_Update_2

**Heroes of Might and Magic**
- [H1] review: RPGnet, https://www.rpg.net/reviews/archive/12/12228.phtml ; GameFAQs, https://gamefaqs.gamespot.com/pc/927207-heroes-of-might-and-magic-v/reviews/101847 ; https://gamefaqs.gamespot.com/pc/927207-heroes-of-might-and-magic-v/reviews/102244
- [H2] review: GameSpot, https://www.gamespot.com/reviews/heroes-of-might-and-magic-v-review/1900-6151741/
- [H3] wiki: https://wikipedia.classicistranieri.com/en/articles/h/e/r/Heroes_of_Might_and_Magic_V_f36c.html
- [H4] wiki: https://mightandmagic.fandom.com/wiki/Implosion_(H3)
- [H5] weak: https://stun.gobrunch.com/post/vcmi-armageddon-animation-bug-creatures

**Songs of Conquest**
- [S1] forum reposts of Development update #30: https://rpgcodex.net/forums/threads/songs-of-conquest-homm2-inspired-turn-based-strategy-adventure-game.128078/page-4 ; https://www.celestialheavens.com/forum/35/17510
- [S2] forum: https://steamcommunity.com/app/867210/discussions/0/596270550693775519/?ctp=2
- [S3] review: https://godisageek.com/reviews/songs-of-conquest-review/ ; https://turnbasedlovers.com/review/songs-of-conquest-1-0-impressions/ ; https://vaporlens.app/app/867210/songs_of_conquest
- [S4] wiki: https://en.wikipedia.org/wiki/Songs_of_Conquest ; https://explorminate.org/songs-of-conquest-qa/

**Magic: The Gathering**
- [M1] wiki: https://mtg.fandom.com/wiki/Color
- [M2] wiki: https://mtg.wiki/page/Basic_land
- [M3] weak and podcast: https://podscripts.co/podcasts/magic-the-gathering-drive-to-work-podcast/1036-mana-symbols ; https://www.cgccards.com/news/article/15229/how-to-read-mtg/
- [M4] review: https://draftsim.com/mtg-arena-cosmetics/ ; https://upcomer.com/mtg-arena-update-march-27th-practice-mode-card-sleeves ; https://mtgazone.com/?p=91267
- [M5] video: https://www.youtube.com/watch?v=odk5Kkk6EQc
- [M6] wiki: https://magicarena.fandom.com/wiki/Color

**Dominions**
- [D1] forum: https://steamcommunity.com/app/2511500/discussions/0/5715697457569906144/?l=english&ctp=9
- [D2] review and forum: https://hitpointreviews.com/reviews/2511500/dominions-6-rise-of-the-pantokrator ; https://fistfulofwits.com/2024/03/07/dominions-6-same-great-taste-more-accessible/ ; https://steamcommunity.com/app/2511500/reviews?browsefilter=toprated
- [D3] wiki of patch notes: https://illwiki.com/dom5/dom6/patchnotes
- [D4] forum: https://www.grogheads.com/forums/index.php?topic=27054.0
- [D5] community manual, read directly from a local copy: https://github.com/dmacguigan/dom6-manual (`chapters/06-combat.qmd`, `07-magic.qmd`, `14-global-enchantments.qmd`)

**Craft**
- [C1] official: https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/
- [C2] official: https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/ ; PDF, https://nexus.leagueoflegends.com/wp-content/uploads/2017/10/VFX_Styleguide_final_public_hidpjqwx7lqyx0pjj3ss.pdf
- [C3] review: https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
- [C4] official: https://www.leagueoflegends.com/en-us/news/dev/dev-behind-the-scenes-of-vfx-updates/
- [C5] official reply: https://devtrackers.gg/leagueoflegends/p/668c1112-syndra-vfx-update-pre-pbe-preview
- [C6] review: https://www.vfxapprentice.com/blog/the-soul-of-effects-what-is-timing-in-vfx ; https://www.vfxapprentice.com/timing-workshop-learn-vfx-timing
- [C7] forum: https://realtimevfx.com/t/block-ins-and-timing/29830
- [C8] wiki: https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation
- [C9] official: https://playhearthstone.com/en-us/blog/22552047
- [C10] press: https://www.screenhub.com.au/news/features/making-magic-behind-the-vfx-that-empowers-the-players-of-hearthstone-262603-1429647/
- [C11] official: https://playhearthstone.com/en-sg/news/18053404
- [C12] press: https://pcgamer.com/deathwing-finally-gets-the-animation-it-deserves
- [C13] press and fan translation: https://nintendowire.com/news/2022/12/12/this-week-in-sakurai-12-5-12-11-fine-tuning-hit-stop-and-cheating-the-system/ ; https://automaton-media.com/en/news/20220824-15208/ ; https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/
- [C14] review: https://rpgplayground.com/research-making-a-juicy-game/ ; https://kenney.nl/learn/must-see-videos-for-indie-developers
- [C15] press and source: https://gamedeveloper.com/programming/video-sprucing-up-cameras-with-math ; https://bevy.org/examples/camera/2d-screen-shake/
- [C16] forum: https://steamcommunity.com/app/262060/discussions/4/618453594749180956/ ; https://steamcommunity.com/app/262060/discussions/0/612823460256613837
- [C17] review and talk: https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i- ; https://rpgcodex.net/content.php?id=10843 ; https://gdcvault.com/play/1025772/-Into-the-Breach-Design

**Accessibility**
- [X1] official: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html ; https://www.w3.org/WAI/WCAG20/Understanding/three-flashes-or-below-threshold
- [X2] official draft: https://www.w3.org/WAI/WCAG3/informative/animation-and-movement/avoid-physical-harm/no-flashing-over-threshold/
- [X3] official: https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/117 ; https://learn.microsoft.com/en-us/gaming/accessibility/guidelines
- [X4] official: https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion ; https://web.dev/learn/accessibility/motion
- [X5] forum and wiki: https://thegameswiki.com/crimson-desert/wiki/chromatic-aberration ; https://forum.star-conflict.com/t/chromatic-aberration-punishing-eyes/18971 ; https://spotlightfx.com/blog/what-is-chromatic-aberration-in-games

**Technology**
- [P1] source, read directly: the installed `pixi.js` 8.22.0, `node_modules/pixi.js/lib/**/*.d.ts` and the bundled docs `node_modules/pixi.js/skills/` (`pixijs-scene-particle-container`, `pixijs-blend-modes`, `pixijs-filters`, `pixijs-performance`, `pixijs-scene-mesh`); https://www.npmjs.com/package/pixi.js
- [P2] official: https://pixijs.com/blog/particlecontainer-v8 ; https://pixijs.com/8.x/guides/components/scene-objects/particle-container
- [P3] source, read directly: https://raw.githubusercontent.com/pixijs/filters/main/README.md ; https://raw.githubusercontent.com/pixijs/filters/main/src/shockwave/ShockwaveFilter.ts ; `src/advanced-bloom/AdvancedBloomFilter.ts`, `src/godray/GodrayFilter.ts`, `src/glow/GlowFilter.ts`, `src/rgb-split/RGBSplitFilter.ts` in the same repository; npm `pixi-filters` 6.1.5
- [P4] source: npm `@pixi/particle-emitter` 5.0.10, https://www.npmjs.com/package/@pixi/particle-emitter
- [P5] official: GPU Gems 3, chapter 23, https://www.oreilly.com/library/view/gpu-gems-3/9780321545428/ch23.html
- [P6] official: https://docs.imgtec.com/performance-guides/graphics-recommendations/html/topics/optimal-particle-rendering-on-powervr.html
- [P7] official: https://docs.unity3d.com/cn/2023.2/Manual/OptimizingGraphicsPerformance.html
- [P8] source: https://gamedev.net/shaderlab/15-separable-blur-and-bloom/ ; https://api.arcade.academy/en/2.6.17/examples/bloom_defender.html

**Computed for this document** (scripts in `pretender-design/vfx-tools/`):
`redflash.mjs` (R/(R+G+B) and relative luminance for every `docs/09` palette step, terrain fill,
and candidate hit tint), `contrast.mjs` (each color's steps against each ground), `keyline.mjs`
(candidate rims, including the derived Umbra rim, against each ground), and `keyline2.mjs` (the
exact `docs/09` keylines `#F4EEDF` and `#1C1A17` against each ground).
