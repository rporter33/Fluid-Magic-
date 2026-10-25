# Painted figures, magic and monsters: the art plan

Stage A of the painted-art track, 2026-10-23. This file plans every painted figure on the battle field, the painted
portraits that come before the monsters, gods and mounts, the animation and the magic. It is written for the
implementing models and for the art director who reviews the pilot. Nothing here goes into the game until the owner
has seen the pilot. Paths are relative to `scratchpad/visual-v4/units/` unless they start with `src/`, `docs/` or
`art-source/` (the repo, read only) or `visual-v4/` (the design workspace).

The owner's words (binding, `docs/design/battle-overhead.owner-answers.md`):

> The painted unit art is what would make this stand out, on top of additional animations, and the salamander
> portrait doesn't match the salamander in game. But the formations and effects so far are great. This is a good
> direction, increasing the fidelity, and the detail is what we're looking to achieve here.

> Amazing work go ahead, show me the pilot when ready - the magic will need the same attention to detail as the
> animation and monsters, for the monsters and gods and mounts, letting me do a review on the portraits and then in
> game before animation would be ideal

What they set:

1. Painted art for every figure on the field, in the painted style of the approved leader portraits, and more
   animation. Fidelity and detail are the goal.
2. A figure and its portrait match. The Salamander did not; it is the first thing the pilot fixes.
3. The magic gets the same attention as the animation and the monsters.
4. Monsters, gods and mounts are reviewed three times, in this order: their painted portraits, their painted figures
   standing in the game, then their animation.
5. The pilot comes to the owner before anything is produced. Cities in battles come later (not in this plan).

References for direction only: `visual-refs/ref-1, 5, 6, 7, 8` (battles) and `visual-v4/refs-analysis.md`. Nothing is
copied from them: no art, model, layout, name or UI, nothing traced, and the other game is never named in a file or a
prompt. `tools/make_prompts.py` refuses a prompt that names a game, franchise or studio.

---

## 0. The plan in sixteen points

1. **Style lock.** The portraits' hand (oil on panel, visible brushwork, muted earth palette, soft edges, a thin rim
   light) carried to full figures in daylight from the upper left, with realistic proportions and a silhouette that
   reads at 40 px. The side's cloth is the one clear hue, on the surfaces the camera sees from above (section 1).
2. **Side colour, measured.** At least 30% of a formation's visible pixels in the side's hue at f = 28 px
   (`tools/checks.py`, metric in 1.4). Baselines: the mockup's procedural figures 29 to 53%; the failed 2026-10-22
   painted sheet 5%; the pilot's maquette guides 27 to 49%. Every pilot troop kit now carries a tabard, surcoat or
   tunic in the side's cloth that the front view also sees.
3. **Camera.** Pitch 40°, yaw 30°, orthographic. The back view is the near side facing up-right, the front view the far
   side facing down-left; mirroring gives the other two facings (section 2).
4. **Camera references** from the mockup for every body type (`refs/mockup/`, 48 renders), and exact-camera clay
   maquettes in each sheet's grid (`refs/guides/`), which carry the camera, the poses and the cloth zones into the
   generator. The 2026-10-22 sheet failed on the camera because it had no camera reference; these fix that.
5. **Inventory.** 61 entries: 14 troop types, 2 mounted troops, 2 mounts, 7 creatures, 14 commander kinds (128 human
   faces; 136 approved faces with the Salamander's and Treant's 8) and 22 god bodies (16 chassis, the six generic ones
   in both palettes) (section 3, `inventory.md`).
6. **Two tracks.** Troops and human commanders: pilot, then production. Creatures, mounts and gods: painted portrait
   (owner review 1), then the painted figure standing in the game (owner review 2), then animation (owner review 3).
   A figure on that track is never generated before its portrait is approved. The Salamander and Treant portraits are
   already approved, so the pilot can show the Salamander standing, unanimated.
7. **Stages** A (this pilot, 60 generations), B (troops, commanders and the portraits of creatures, mounts and gods,
   about 400), C (creatures, mounts and gods standing in the game, about 90), D (animation and magic, about 210), each
   ending in an owner review page (section 4).
8. **Sheets.** One image per figure per view, 16 key poses on a flat key colour chosen so it never appears in the unit;
   creatures and gods get separate large cutouts per action for mesh deformation; a painted card bust per troop type in
   the portraits' framing (section 5).
9. **A face, a figure.** Every commander face gets its own figure, made with that face's portrait as the identity
   reference and the kit text from its sidecar prompt; the Salamander and Treant get one figure per face.
10. **Animation** is painted key poses plus closed-form transforms (bob, lean, lunge, squash, knockback), and mesh
    deformation for big bodies, inside docs/12's pacing (section 6).
11. **Magic** is storyboarded beat by beat for this camera for all eleven battle spells and every visible ability, with
    painted effect sheets (flames, embers, smoke, thorns, roots, glyph rings, light shafts), particles, a light model
    that lights figures and ground, and decals (section 7). The magic pilot is Fireball against Entangle.
12. **Pipeline.** `gen.py` (logged, budgeted) → `key.py` (measured key, erosion, despill, colour bleed) → `slice.py`
    (components per cell, ground anchor) → `checks.py` (camera, variety, scale, fringe, side share, value) → `pack.py`
    (tiers, keyline, white flash frames, cloth variants, atlas JSON) (section 8). Dry-run on the maquettes and on the
    2026-10-22 sheet: the checks pass the maquettes and fail that sheet on camera, variety and side colour.
13. **Atlas tiers.** Tier S: a man stands 56 px (the automatic camera's 18 to 48 px is a downscale). Tier H: 112 px for
    devicePixelRatio ≥ 1.5 and the player's zoom to 72 px. Big bodies by size class, 129 to 336 px tall at tier S.
14. **The pilot** paints battle c, "The Fight in Wickemoss": the Salamander the owner flagged, both nations' line
    infantry and archers, and five leaders, with 4 calibration generations first (section 9).
15. **Prompts** for every pilot job are written (`prompts/*.txt`, `prompts/manifest.json`); stage B reuses the builder.
16. **Open questions** for the owner are few and are in section 11.

---

## 1. Style lock

### 1.1 What carries over from the portraits

The approved portraits (`art-source/portraits/`, 136 faces, style anchor `anchor-style.webp`) were all made with one
prompt template. The figures keep its hand and change only what a battle field needs.

| Portrait trait | On the field |
|---|---|
| Painterly oil on a wood panel, visible directional brushwork, moderate detail | kept: the same words open every figure prompt, and the portrait is passed as the style reference |
| Muted, earthy palette: charcoal, ash grey, dull iron with rusted edges, bark brown, moss, bone | kept for everything except the side's cloth |
| No saturated area larger than a clasp | relaxed for troops only: the side's cloth is the one clear hue, at docs/12 3.8's troop cloth range (L\* 35 to 55, OKLCH C ≤ 0.16): Cinder `#C4532C`, Thornwood `#1F6A50` |
| Soft edges, a thin warm rim light separating the silhouette | kept as a thin bright rim on the upper-left edges, from the sun |
| A single warm candle key light from the upper left, deep warm shadows | **replaced** by daylight: a high sun in the upper left of the image, warm highlights on helmet tops and shoulders, a cool blue-grey sky fill in the lower-right shadows, no deep shadows |
| Very dark warm background `#1C1A17`, head-and-shoulders framing | **replaced** by a flat key colour and full-length figures; the card busts (5.4) keep the portrait framing and background |
| A readable silhouette at 48 px | kept, as a figure at 40 px tall: helmet or hood shape, shoulder line and weapon must read |

### 1.2 Proportions and silhouette

- Realistic adult proportions: the head with its helmet about one sixth of the standing height. The failed sheet's
  big-headed "chibi" look is refused by the prompt and caught by the camera check's head offset.
- Weapons at true size. Spears and halberds slant together in a block (refs-analysis 5.3): the weapon's line is part of
  the silhouette.
- Each nation keeps its silhouette family from docs/09: the Horde's crests, horns and spikes; the Thornwood's leaf
  crests, antlers and hoods. Commanders are 1.15× a man (design 3.2) and carry a banner, a staff or a raised weapon in
  their action poses so they read as a lone figure.

### 1.3 Light on the field

All figures are painted in one light so a battle reads as one scene: sun high in the upper left of the image (the same
direction as the ground's hill shading and the sky-falls of design 8), soft cool fill, no cast shadow in the image. The
game draws every shadow: a soft ellipse under each figure (in the atlas), and the big-body and flyer shadows of design
6.

### 1.4 Side colour on top-visible surfaces

The camera sees the tops of helmets, shoulders and upper backs most, so the side's cloth goes there: crests or cloth
caps, shoulder capes or mantles, hoods, and the shield face toward the camera (the front view; from behind the camera
sees the inside of the shield). Every troop kit also carries cloth that the front view sees: a tabard, a hood, a scarf
or the shield face. `units.json` lists each unit's zones (`sideZones`), and the maquette guides paint those zones in
the cloth colour so the generator sees where they go.

**The measure** (`tools/checks.py side_report`): the stand frame is downscaled (premultiplied Lanczos) to f = 28 px,
given the atlas keyline, and laid out as an 8 × 4 block at the unit's formation spacing (design 3.5) in the design's
projection, far ranks first, on the mockup's four lightest-to-darkest grounds (plains `#A8A784`, farmland `#B4A27E`,
forest `#938E70`, swamp `#8E8E78`). A visible pixel is "in the side's hue" when its OKLCH hue is within 20° of the
cloth's and its chroma is at least max(0.04, 0.45 × the cloth's). That keeps shaded and dark cloth (Thornwood dark
`#113F2F` C 0.057; Cinder dark `#7E3118` C 0.113) and leaves out ash skin (C 0.061 at hue 52), wood and bark (hue 59
to 63). **Target: ≥ 30% on plains in both views.**

Measured with this rule (`work/keytest/` for the mockup and the 2026-10-22 sheet, `work/dryrun2/` for the maquettes):

| Figure | Back view | Front view |
|---|---|---|
| Mockup procedural Cinder Warrior | 33.0% | 38.3% |
| Mockup procedural Warden | 36.9% | 37.8% |
| Mockup procedural Flame Archer, Longbow Hunter | 52.7%, 51.0% | — |
| Mockup procedural Briar Guard, Ash Militia, Thorn Militia | 29.1%, 34.8%, 48.1% | — |
| The failed 2026-10-22 painted Cinder warrior | 5.1% | — |
| Maquette guide, Cinder Warrior, Warden (with the new tabards) | 32.6%, 36.1% | 27.4%, 35.2% |
| Maquette guide, Flame Archer, Longbow Hunter (with the new surcoats) | 47.0%, 42.1% | 47.3%, 49.2% |
| Maquette guide, Ember Skirmisher (cloth tunic), Flamebrand (tabard) | 32.7%, 33.3% | 30.6%, 29.3% |

The failed sheet hid its colour under grey helmets and skin, as research A5 found (24% by its looser count; 5% by this
one, which ignores skin and leather). The rule is now a check that fails a sheet, not an observation. The maquettes
only show where the cloth goes; two of them sit just under 30% in the front view, so the prompts ask for large,
unbroken cloth areas, and the painted sheet is what is measured.

### 1.5 Value against the ground

Design 3.8 rule 2: a block's mean L\* (figures and the gaps between them, the block's closed area) at least 15 below its
ground. Measured the same way on the four grounds: the mockup's procedural blocks are 15 to 32 below (the swamp is the
tight case: Warden front 15.3, Cinder Warrior front 16.3); the pilot's clay maquettes 16 to 29 below on their worst
ground (the bare-armed Ember Skirmisher is the tight one). Painted figures are darker than the
procedural ones (muted iron and charcoal), so they should pass with room; `checks.py` fails a sheet that does not.

### 1.6 The style sentence (in every figure prompt, from `tools/make_prompts.py`)

> Painting style: painterly oil on a wood panel, visible directional brushwork, moderate detail, the same hand as the
> painted portrait references; a muted earthy palette of charcoal, ash grey, dull iron, bark brown, leather and bone, in
> which the side's cloth is the one clear hue; soft painterly edges, with small crisp highlights on metal edges and a
> thin bright rim of light along the upper-left edges of every figure. Each figure has a strong, simple, readable
> silhouette that still reads when the figure is shrunk to 40 pixels tall. It is not a cartoon: no cel shading, no
> thick black outlines, no chibi or big-headed proportions, no glossy 3D render, no pixel art.

> Light: outdoor daylight. A high sun in the upper left of the image lights the tops of helmets and hoods, the
> shoulders and the upper-left side of every figure with warm highlights; a cool blue-grey sky fill lies in the shadows
> on the lower-right side. No candlelight, no dramatic dark shadows, nothing glows unless the description below says
> so. No cast shadow on the background.

Nothing glows on a troop or leader: the game draws the fire arrows' flame, staff light and every spell (section 7). The
Flamebrand's burning blade is the one painted flame, because it is the unit's silhouette; the game adds its flicker and
embers.

---

## 2. Camera references

### 2.1 The camera

Design 3.1, unchanged: orthographic, pitch P = 40°, yaw ψ = 30°.

```
X = 0.866·x + 0.500·y                 (x lateral, y depth toward the far side, h height; world units)
Y = 0.321·x − 0.557·y − 0.766·h       (screen y grows downward)
```

| View | Who | Facing on screen | What the camera sees |
|---|---|---|---|
| back (`ne`) | the near side advancing; the far side routing | up and to the right | the back, the right side (the weapon arm), the top of the head and the shoulders |
| front (`sw`) | the far side advancing; the near side routing | down and to the left | the face from above, the chest, the left side (the shield arm) |
| `nw`, `se` | movement along the line, big bodies turning to a foe | — | the back or front view mirrored (`scale.x = −1`) |

The views are generated in the facings used most (near side advancing up-right, far side advancing down-left), so the
common case is never mirrored and weapons stay in the right hand there.

### 2.2 From the mockup: `refs/mockup/`

`tools/mockup_refs.cjs` opens `visual-v4/battle-mockup.html` in Playwright (the Pixi CDN routed to the repo's copy),
draws each body type's procedural figure with the mockup's own `drawFigure` and `makeBigBody`, idle, in both views,
at 9× (450 px tall), on the unit's key colour, and records each foot point (`refs/mockup/refs.json`; contact sheet
`refs/mockup/contact.png`). 48 renders: infantry (Cinder Warrior, Warden), spear (both militias), halberd, berserker,
Flamebrand, skirmisher, archers (both), cavalry, wolf rider, wolf, fliers (Fire Sprite, Hornet Swarm), commanders
(Ash Chieftain, Warden Captain), mages (Cinder Magus, Elder Druid), independents (Heavy Infantry, Archer) and the three
monsters (Salamander, Treant, Great Wyrm).

What they show: the rank-and-file are drawn for the 40° camera (helmet tops, shoulders and cloth large), so they set
the scale, the side-colour budget and the reading at play zoom. The monsters are profile rigs that the mockup flips to
face each side; they are not drawn for the camera, which is why they read as paper cut-outs (research A6) and why the
Salamander's body could drift from its portrait. They are kept as a record of what the painted art replaces, not as
generator input.

### 2.3 Exact-camera maquettes: `refs/guides/`

`tools/guides.py` (with `sdf.py`, `rigs.py`, `poses.py`) ray-marches posed clay figures at exactly the design's camera
(the basis in `sdf.py` reproduces the projection above), lit from the upper left, on the figure's key colour, in the
sheet's exact grid. Troop guides paint the side-colour zones in the nation's cloth. One guide per figure and view (each
monster: one per action and view); `refs/guides/guides.json` records every cell's anchor and screen box for the checks.

They are the generator's camera and pose reference (Image 1 of every figure prompt): the camera, the facing, each
cell's pose, the figure's size in its cell and the grid. The prompt says not to copy the clay surfaces or the toy-like
shapes. Changes made in this step:

- **Tabards.** The humanoid rig gained a `tabard` gear flag (torso and a skirt to mid-thigh in the cloth zone). The
  Cinder Warrior and Warden (tabards), Flame Archer and Longbow Hunter (surcoats), Ember Skirmisher (a cloth tunic and
  shoulder scarf) and Flamebrand (its knee-length tabard) use it, and their kits say so; the Cinder Warrior's and
  Warden's maquettes went from 9% and 17% front-view side share to 27% and 35%.
- **The Salamander.** Its maquette stood high on thin dog-like legs; the rig is now low-slung (belly a hand above the
  ground), with short thick legs splayed sideways and the head held up on the neck, as the portrait and the design
  (63 wu tall with the head up) describe.
- Guides rendered in this step: every figure of the three battles except the Great Wyrm (a god: its portrait comes
  first), the Fire Sprite again on its blue key, the Salamander and Treant per action. `guides.json` is now written
  after every figure, so an interrupted run keeps its work (the previous run lost its metadata that way).

### 2.4 Style references: `refs/style/style-refs.json`

Each figure's references, in prompt order after the guide: its own approved portrait where one exists (every commander
face; the Salamander and Treant faces), else the closest portrait of the same nation, then the anchor. A borrowed
portrait gives only the hand, the palette and the nation's materials; the prompt says not to paint that person.
`refs/style/pilot-refs.png` shows each pilot figure's guide (back, front), portrait and anchor side by side.

| Figure | Style reference (portrait 512 px master) | Why |
|---|---|---|
| Cinder Warrior | `cinderHorde/ashChieftain/05` | the plainest chieftain helm and dark scale: a line warrior's kit |
| Flame Archer | `cinderHorde/cinderScout/03` | hood, cape and scarf over the face |
| Ember Skirmisher | `cinderHorde/cinderScout/06` | a light runner, soot-marked skin |
| Flamebrand | `cinderHorde/pyrePriest/06` | the temple's iron and fire |
| Ash Militia, Berserker, Ash Rider | `cinderScout/04`, `ashChieftain/06`, `ashChieftain/02` | levy wool; the heavy bearded brute; the riding clans |
| Warden | `thornwood/wardenCaptain/05` | the line's bark plate and leaf cloak |
| Longbow Hunter, Thorn Militia | `thornwood/thornScout/04`, `thornScout/01` | hooded forest hunters and levies |
| Briar Guard, Wolf Rider | `wardenCaptain/07`, `thornScout/02` | the darkest pine-bark kit; a hooded rider |
| Every commander face | its own portrait | identity and style |
| Salamander 01, Treant 01 | their own portraits | identity: the owner's match rule |

---

## 3. Inventory

`tools/inventory.py` writes `inventory.json` and the full table `inventory.md` (61 rows) from the content and the
portrait files. In short:

| Group | Entries | Approved portraits | Track |
|---|---|---|---|
| Troops, foot (Cinder 6, Thornwood 4, independents 4) | Ash Militia, Cinder Warrior, Ember Skirmisher, Flame Archer, Berserker, Flamebrand; Thorn Militia, Warden, Longbow Hunter, Briar Guard; Light Infantry, Heavy Infantry, Archer, Swamp Fighter | none: a painted card bust each, made after its figure | troop |
| Mounted troops | Ash Rider (Ash Horse), Wolf Rider (War Wolf) | none | the figure waits for its mount's portrait |
| Mounts (units-and-items A.4) | Ash Horse (no weapon, ash-grey, soot mane), War Wolf (Wolf Bite 3, a huge grey timber wolf). No other mount is named in content or design | none | mount |
| Creatures | Fire Sprite, Hornet Swarm, Wolf (summons); Giant (independent monster, size 4); Oakheart ("a walking oak under thornplate", sacred, size 2); Salamander and Treant (summoned commanders) | Salamander 4, Treant 4; the rest none | creature |
| Commanders | Scout ×2, Ash Chieftain, Pyre Priest, Ember Adept, Cinder Magus, Warden Captain, Grove Priest, Sapling Druid, Elder Druid (8 faces each), Independent Captain (hunter, levy, mountaineer, reedman: 12 each) | 128 human faces | commander |
| Gods (docs/05: sixteen chassis) | Oracle of the Flux, Titan, Great Wyrm, Living Monolith, Ascended Hero, Primordial (generic: Cinder and Thornwood palettes each); Ash Colossus, Ash Phoenix, Pyre Lord, Cinder Idol, Ember Hierophant (Red); Wild Spirit, World Tree, Horned Hunter, Elder Wyrm, Mother of Beasts (Green) | none (they had procedural portraits in the plan, B.8) | god |
| No look | Garrison | — | — |

Battles a, b and c use 14 troop types, 19 commander faces, the Salamander (face 01), the Treant (face 01) and a
Thornwood Great Wyrm.

### 3.1 The portraits that come first (stage B, owner review 1)

Every creature, mount and god gets a painted portrait before any of its figures is generated. They use the leader
portraits' template (the prompt in `src/assets/raster/portraits/*/*/NN.json`, anchor as Image 1), so the card bar
stays one family:

- **Creatures** (Fire Sprite, Hornet Swarm, Wolf, Giant, Oakheart): a head-and-shoulders bust in the leader framing
  (top of the head 9% from the top, eyes at 39%, cut at mid-chest), three-quarter view facing right, candle key light
  and warm rim, background `#1C1A17`. The Salamander and Treant portraits are the template for "a creature, not a
  person" (their sidecars). A swarm's portrait is one hornet, large; a sprite's is its flame face. Two candidates each,
  the owner picks one (the Giant gets two faces, so a squad of four varies).
- **Mounts** (Ash Horse, War Wolf): a head-and-neck bust in the same framing, in its battle tack: the Ash Horse with its
  soot mane, iron face plate and the ember caparison at the withers; the War Wolf with its bark breast harness and the
  green saddle blanket's edge. The tack carries the side's cloth so the bust reads as the unit's mount. Two candidates
  each.
- **Gods**: the body as the player's design shows it. The designer composes the god's portrait from the same parts
  as its battle body, in the rig's portrait pose (pretender design B.8). So the painted god portrait is **the whole
  body**, three-quarter front, in the **regal** portrait pose, wearing **variant 0 of every slot** (B.3) in **swatch 0**
  of its material, metal and accent tables, with the nation's tint zone in the nation's cloth: the look every preset
  and AI god starts from. Framing as the designer's 256 px preview: the body fills the square, crown or horns about 6%
  from the top, feet or base about 94%, the same candle light, rim and dark background as the leaders. A **card crop**
  (head and upper body) is chosen per god for the 64 px card, recorded in its sidecar. One portrait per body: 22 (the
  six generic chassis in both palettes, the ten realm chassis in their own), two candidates each.

  | Chassis | Variant 0 (B.3), as painted |
  |---|---|
  | Oracle of the Flux | cowl; no mantle; orb staff head; runic robe glyphs; floating hem |
  | Titan | great helm; no mantle; straight great sword |
  | Great Wyrm | swept horns; smooth membranes; spade tail; banded scales; wings |
  | Living Monolith | no capstone, no overgrowth, no face; runic glyphs; rooted base |
  | Ascended Hero | circlet; long cape; straight blade |
  | Primordial | ram horns; moss back; club tail; mottled hide |
  | Ash Colossus | brazier head; bare shoulders; bare fists; vein cracks; embers |
  | Ash Phoenix | plume crest; fan plumage wings; long tail; barred feathers |
  | Pyre Lord | flame crown; ember mantle; glaive |
  | Cinder Idol | brazier face; plinth; soot and crack veins; smoke |
  | Ember Hierophant | mask; ember mantle; orb staff head |
  | Wild Spirit | antlers; leaf ruff; wisps; stripes; a translucent flicker (drawn by the game) |
  | World Tree | round canopy; no trunk face; ridged bark; roots |
  | Horned Hunter | antlers; leaf mantle; leaf-blade spear; stripe warpaint |
  | Elder Wyrm | crown of spines; moss back; club tail; no wings |
  | Mother of Beasts | bear-pelt cloak; antler crown; plain maul |

  The variants beyond 0 (two per slot, 81 combinations a chassis) are an owner question (section 11, Q1).

---

## 4. Review stages

The owner set the order; each stage ends with a review page (a private artifact, approve or redo per item, the
owner's picks stored with it) and nothing moves on until the owner has answered.

| Stage | Delivers | Generations | Review page |
|---|---|---|---|
| **A. Pilot** (this job) | this plan and its files; 4 calibration sheets; battle c painted: Cinder Warrior, Flame Archer, Warden, Longbow Hunter (both views and a card bust each), Ash Chieftains 06 and 03, Warden Captain 07, then Ember Skirmisher, Flamebrand, Ember Adept 07, Elder Druid 08, Sapling Druid 08; the Salamander (face 01) standing in the game, unanimated; the art director's review | **≤ 60** (log `gen-log.tsv`, enforced by `gen.py`) | "Painted pilot": battle c live with a painted/procedural toggle; each sheet beside its guide and portrait; formation proofs at f = 28 and 48 px with the side-share and value numbers; the Salamander portrait beside its standing figure; the art director's notes; the owner's questions |
| **B. Troops and portraits** | every foot troop sheet (both views) and card bust; every human commander face's figure (128 faces); the three banners; the painted portraits of every creature, mount and god (2 candidates each) | about 400: troops 8 types × 3 + re-rolls ≈ 32; commanders 122 faces × 2 views + 20% ≈ 290; portraits 30 subjects × 2 + 15% ≈ 70; banners 3 | "Troops and portraits": the troop gallery and all three battles painted; each commander's figure beside its face; a portrait board of creatures, mounts and gods with a pick for each (owner review 1) |
| **C. Standing in the game** | for each approved creature, mount and god portrait: its figure standing (idle cutouts for big bodies, both views; full key-pose sheets for size-1 and size-2 creatures and the mounted troops, shown standing); the Salamander faces 02 to 04 and the Treant faces 01 to 04; a 2K output test for size-6 bodies | about 90: Salamander 6, Treant 8, Giant 4, Wolf, Fire Sprite, Hornet, Oakheart, Ash Rider and Wolf Rider 11, gods 44, re-rolls 25% | "Standing in the game": each one placed in a battle at deploy and in a lineup by size on the field, beside its approved portrait, no animation (owner review 2) |
| **D. Animation and magic** | the animation layer (section 6); action cutouts for every big body; the magic (section 7): 17 painted effect sheets, the storyboards built, the magic pilot (Fireball, Entangle) shown first | about 210: big-body actions ≈ 155 (2 × 2 grids for size ≤ 4, single cutouts for size 5 and 6), effect sheets 17 × 2 candidates + re-rolls ≈ 45, the magic pilot's re-rolls ≈ 10 | "Animation and magic": the magic pilot first (two spells, slowed and at speed, with the storyboard beside it), then every battle replayed, each creature and god animated beside its standing figure (owner review 3) |

Totals: about 760 generations, at the measured 15 s and about 3,000 tokens each (research A5), roughly 3.2 hours of
generation over the four stages. Budgets for B to D are set when the owner approves the stage; `gen.py` holds stage A
to 60.

---

## 5. Sheets

### 5.1 One image per figure per view

A sheet is one generation: every key pose of one figure in one view, on a flat key colour, in the guide's grid. 1:1
sheets come out at 1024 × 1024 (256 px cells, a standing figure about 160 px tall); 4:3 at about 1184 × 864.

| Layout | Grid | Cells, row by row | Who |
|---|---|---|---|
| melee | 4 × 4, 1:1 | stand, idle2, marchA, marchB / windup, strike, follow, brace / recoil, fall, deadA, deadB / fleeA, fleeB, cheer, dropped (weapon and shield on the ground) | line, heavy and shock infantry (the Berserker's flee cells become a second roar and a backhand chop: it never routs) |
| archer | 4 × 4, 1:1 | stand, marchA, marchB, nock / draw, loose, windup, strike (knife) / recoil, fall, deadA, deadB / fleeA, fleeB, cheer, dropped | Flame Archer, Longbow Hunter, Archer |
| thrower | 4 × 4, 1:1 | stand, runA, runB, aim / throw, follow, windup, strike (knife) / recoil, fall, deadA, deadB / fleeA, fleeB, cheer, dropped | Ember Skirmisher |
| commander | 4 × 4, 1:1 | stand, idle2, marchA, marchB / windup, strike, follow, recoil / actA, actB, fall, deadA / deadB, fleeA, fleeB, cheer | every human commander; act = rally (generals: weapon raised, then pointed at the enemy), cast (mages: staff raised in both hands, then thrust forward), bless (priests: staff high and palm up, then the hand over the troops) |
| cavalry | 4 × 4, 4:3 | stand, walkA, walkB, gallopA / gallopB, charge, windup, strike / recoil, fall, deadA, deadB / boltA, boltB (riderless), cheer, dropped | Ash Rider (stage C) |
| wolfrider | 4 × 4, 4:3 | stand, lopeA, lopeB, leapA / leapB, charge, windup, strike / bite, recoil, fall, deadA / deadB, boltA, boltB, cheer | Wolf Rider (stage C) |
| beast | 4 × 3, 4:3 | stand, idle2, lopeA, lopeB / leapA, leapB, bite, howl / recoil, fall, deadA, deadB | Wolf (stage C) |
| sprite | 4 × 3, 4:3 | wingUp, wingMid, wingDown, glide / dive, strike, recoil, burstA / burstB, mark (scorch), wingUp2, wingDown2 | Fire Sprite (stage C) |
| hornet | 4 × 3, 4:3, one view | up, down at 0°, 90°, 180° / sting 0°, 90°, glide 0°, 90° / deadA, deadB | Hornet Swarm (stage C; the game draws 12 per figure) |

Every layout holds what the owner and docs/12 ask for: stand, two marching steps, attack windup and strike, recoil,
falling, two dead poses; archers draw and loose; cavalry two gallops and a charge; commanders a cast or rally pose;
fliers wing up and wing down. The extra cells (idle, follow-through, brace, flee, cheer, dropped gear) feed section 6.

### 5.2 The key colour, per unit

The key is the colour farthest from everything in the unit, so the keyer's despill never touches the unit's paint.
`key.py` reports `keyInUnitPct` (paint leaning toward the key more than 3 px inside the figure); above 0.5% the unit's
key is wrong or the sheet is re-rolled.

| Key | Units | Why |
|---|---|---|
| green `#00FF00` | Cinder Horde troops and leaders, the Ash Horse, the Salamander | charcoal, ash, iron and ember orange; no green anywhere |
| magenta `#FF00FF` | Thornwood troops and leaders, the War Wolf, the Treant, the Hornet, Thornwood gods | moss and pine greens; the pale blossom sigil is cream, not pink (the prompt bans pink and purple) |
| blue `#0000FF` | Fire Sprite, fire effects that need a key (most fire is painted on black, 7.2), Cinder gods made of ember (Ash Colossus, Ash Phoenix, Cinder Idol) | flame is orange, yellow and white: blue is its complement, and the blue despill never dims an orange edge (magenta's dims flame edges; green eats yellow highlights) |
| magenta | independents | grey and tan kit; the Swamp Fighter's reed greens rule out green |

### 5.3 Big bodies: separate cutouts per action

Creatures of size 3 and up and every god body get one large cutout per action and view, each its own texture on a
24 × 16 `MeshPlane` (design 12.2). For the stage C review only the idle cutout exists.

| Body | Actions (stage D) |
|---|---|
| Salamander (serpent) | idle, breath (head forward, jaws open, throat swollen), tail lash, hit, dead |
| Treant, World Tree (treant) | idle, windup (limbs raised), slam, hit, dead (toppled) |
| Great Wyrm, Elder Wyrm, Primordial (wyrm, serpent, quadruped) | idle, breath or bite (neck lunged, jaws open), flight (wings up; Great Wyrm only), hit, dead; Elder Wyrm and Primordial: trample (rearing stomp) |
| Ash Phoenix (wyrm, flier) | glide, wings up, wings down, rake (talons forward), hit, burn-out |
| Biped gods and the Giant (Titan, Ascended Hero, Pyre Lord, Horned Hunter, Mother of Beasts, Ember Hierophant, Oracle, Ash Colossus) | idle, stepA, stepB, windup, strike, hit, dead; casters add cast; summoners add their call (Pyre Lord: glaive sweep; Horned Hunter: horn raised) |
| Idols (Living Monolith, Cinder Idol) | idle, pulse (glyphs bright, a mask, 6.4), hit (cracks), shattered |
| Wild Spirit (spirit) | idle, leap, rake, hit, dissolving |

Size ≤ 4 bodies put four actions in one 2 × 2 sheet per view (512 px cells); size 5 and 6 get one action per image
(1:1 or 16:9 by the guide's shape). Each cutout is made with the approved idle cutout as a second reference ("the same
creature, now …"), so all actions stay one creature.

### 5.4 Card busts

Every troop type gets a painted card bust in the portraits' framing and light (the leader template, with the troop's
kit and its cloth showing on the shoulders and headgear), made after its sheet is approved, with the sheet as the kit
reference. It replaces design 12.3's baked card pose and puts commanders and troops in one card family. Creatures,
mounts and gods use their stage B portraits as card art (gods with their card crop).

### 5.5 A figure that matches its face

- **Commanders.** Each face's figure is generated with that face's own portrait as Image 2 and a kit written from its
  sidecar prompt (`units_src.py` `COMMANDERS`): headgear with its exact shape, beard, mantle, pauldrons, weapon. At 40 to
  55 px the headgear, the mantle and the weapon carry the identity, so the prompt says to paint those exactly. The art
  director ticks each face's identity marks on a 4× crop beside the portrait (the review page shows the pair).
- **Salamander and Treant.** One figure per face used, made from that face. Battle c uses Salamander 01, battle b
  Treant 01; the other faces come in stage C because any face can be drawn by the seed. The Salamander's kit is its
  portrait's sidecar: dull obsidian-black scales with a fine net of dull ember cracks, the broad flat head of a giant
  river salamander, stubby horn nubs along the jaw, three bony knobs on the brow, a pale scrape across the snout. The
  mockup's orange lizard with flame spikes is what the owner saw not matching; none of it survives.
- **Identity check, automatic part:** the median OKLab colour of the figure's upper third against the portrait's
  subject (masked by luminance against `#1C1A17`) must differ by ΔE2000 < 18. It catches a wrong palette, not a wrong
  helm; the helm is the art director's.

---

## 6. Animation plan (stage D)

Painted key poses carry the silhouette; motion between them comes from closed-form transforms on each particle
(position, rotation, scale, tint, frame) evaluated from story time, so seeking stays exact (design 9: `poses.ts` maps
kind, weapon motion, pose and pose time to an atlas frame and an offset). Big bodies deform a 24 × 16 mesh by region
weights (`mesh.ts`). Timings below are docs/12 S2.2's weapon table and S2.7's windows; nothing here lengthens a segment.

| Motion | Frames | Transforms | Timing |
|---|---|---|---|
| March | the design's 4-frame walk from three painted poses: marchA, stand (passing), marchB, stand (passing) | vertical bob 1.5 wu (up at the passing frames), forward lean 4° about the feet, ±1° sway; per-figure phase from the seeded scene stream; robed casters add a hem sway (a 2° skew of the lower third, alternating) | 2 steps/s at speed 1, ×1.4 speed 2, run = walk ×1.6 (design 12.1) |
| Idle shuffle | stand ↔ idle2 | breathing scale.y 1.00 to 1.01; a 0.5 wu weight shift | every 1.2 to 2.0 s, seeded (design 6) |
| Brace | brace | knees 1.4 wu lower, lean 6° forward | while waiting for contact |
| Attack: chop, slash, great chop | windup → strike → follow → stand | anticipation: lean back 6° and scale.x 0.97 on the windup; lunge 10 to 14 wu on the strike; a 2-frame white arc smear (slash) or ash flakes (chop); follow-through lean 10° | windup / strike / recover from S2.2 (axe 0.13/0.06/0.15; great axe 0.18/0.07/0.20, ×0.85 in rage) |
| Spear thrust | windup → strike → stand | the whole figure slides 14 wu forward and back; rear ranks use the strike frame 6 wu up and 8 wu forward ("jab over shoulders") | 0.10/0.06/0.14 |
| Halberd | windup → strike → follow | arc −70° to +30° read from the frames; 12 wu lunge | 0.18/0.07/0.20 |
| Archer draw and loose | nock → draw (held) → loose → stand | 1° lean back at full draw; the arrow spawns at the bow hand's anchor; ripple over 0.25 s across the squad | draw 0.35 (fire arrows), 0.40 (longbow), 0.30 (shortbow); recoil 0.12 to 0.15 |
| Javelin | runA, runB → aim → throw → follow | 2-step run-up 12 wu and back | 0.50 s flight |
| Cavalry walk, gallop, charge | walkA/B; gallopA/B at 6 Hz; charge for the last 0.5 s | 2 wu bob, ±3° pitch rock; charge lean 6°; churn stamps; on impact the victims' shove and the lance throw of design 6 | S2.8's charge timeline |
| Wolf lope and bite | lopeA/B; leapA/B; bite | a 3 wu arc per bound; the bite's 18 wu hop and a 0.2 s worry on a wound | pounce 0.12/0.06/0.16 |
| Hit stagger | recoil | knockback 3 to 6 wu away from the blow, 6° tilt, one frame of the white silhouette (design 12.1) | 0.18 s |
| Deaths, varied | fall → deadA or deadB | by death style: crumple (straight down), fall back (rotate 20° back), thrown (16 to 40 wu along the ground for fireball kills), burn-out (tint to char, 12 embers, then the dead frame darkened), impaled (lifted 2 wu on a thorn, then dead); dead frames rotated ±20° and flipped by seed, stamped into decals at 55% | fall 0.35 s |
| Rout | the away view's march frames at 1.6× | weapons dropped (the dropped frame stamped where the figure turned); heading within ±15° of straight back | 120 wu/s (design 6) |
| Victory cheer | cheer ↔ stand | a 3 wu hop at 1.5 Hz, staggered; weapons raised | the outro |
| Banner wave | — | the pennant is a painted banner cloth (two nation banners and an independent one, stage B) on an 8 × 2 mesh strip with a travelling sine; flare on Warcry, droop when shaken | continuous |
| Casting gestures | actA (charge beat) → actB (release) | a 4 wu recoil at release; the staff head's light is the spell's (section 7) | the spell's charge and release |
| Commander rally | actA ↔ actB | — | on holds and Warcry |
| Monster breath | breath cutout | mesh: neck region pulled back 4° and the body's scale.y 1.03 over the inhale, then the head region pushed 8 wu forward; the throat's emissive mask glows | inhale 0.3 s, stream 0.6 s (Salamander), rear and sweep 0.9 s (Great Wyrm) |
| Bite | bite cutout | the neck region lunges 40 wu along its weights; a killed foe lifts and drops | 0.30/0.08/0.35 |
| Claw (Wild Spirit, Ash Phoenix rake) | rake cutout | a 24 wu leap; three painted claw-streak sprites | 0.12/0.05/0.18 |
| Tail sweep | tail-lash cutout | tail region rotates ±25° about its root, with ease-out | 0.10/0.05/0.15 |
| Wing flap | flight cutout; Phoenix up/down cutouts | wing regions scale.y 0.7 to 1.0 and rotate ±12° at 0.9 Hz (flying) or 0.2 Hz (idle); cross-fade between up and down cutouts over 2 frames | — |
| Stomp shake | stepA ↔ stepB (bipeds), mesh shear of the leg regions (quadrupeds) | each footfall: dust puff, trauma 0.04, a 2 wu tremor of figures within 2 footprints | size 4 and up |
| Collapse | dead cutout | tilt 8 to 12°, settle over 0.9 to 1.4 s (topple), then a darkened copy stamped into the decals; the god's death dissolves into its dominant colour (pretender design C.5) | S2.8 |
| Flier bob | wing frames | ±6 wu at 0.8 Hz; shadow scale 1 − h/400 | design 6 |
| Swarm swirl | hornet frames by velocity direction | 12 dots per figure on closed-form Lissajous orbits; the cloud contracts on a sting | darts (0.05/0.03/0.05)×3 |

Region weights for the mesh come from the maquettes: `guides.py` adds a part-ID pass (head, neck, body, each limb,
tail, wings) rendered from the same pose, registered to the painted cutout by its silhouette (bounding box, then a
small affine fit), smoothed into per-vertex weights. Weapon tips and bow hands per frame come the same way, so
projectiles, smears and Flaming Weapons start at the painted weapon.

---

## 7. Magic plan (stage D)

### 7.1 Principles

- **Five beats** (docs/12 S2.10): charge, release, travel, impact, linger, with the durations, tiers, particle
  budgets, trauma, flash rules and colour grammar of the pretender design C.1 and C.3. Nothing here lengthens a beat.
- **For this camera** (design 8): rings are ground ellipses squashed to 0.643; projectiles fly at their height h with a
  ground shadow; sky-falls come from the upper left at 60°; nothing is written on the field.
- **Painted where the eye lingers.** Flames, embers, smoke, explosions, thorns, roots, vines, leaves, light shafts and
  glyph rings are painted sheets in the portraits' hand, so magic matches the figures; motion, counts and timing are
  code (particles, ropes, meshes, shaders).
- **Light.** Each spell has a light: an additive ground light pool (a painted soft-light texture, squashed 0.643) at its
  source and impact; a per-figure tint toward the light colour for figures within its radius (ParticleContainer tint,
  free), up to 35% at the peak; a second short shadow pushed away from a bright point light for figures within it
  during the impact (alpha by intensity, 0.3 s); emissive masks on creatures (the Salamander's cracks, the Ash Colossus'
  veins, the idols' glyphs) driven by the spell or ability. Ember is emissive and additive; Loam is matter in normal
  blend and glows only when it heals (C.1).
- **Code** moves the paint: particles in the `fxNormal` and `fxAdd` containers with painted sprites; ropes (`MeshRope`)
  for trails, tendrils and running cracks with painted strip textures; meshes for cones and coils; filters only at High
  (displacement for shockwaves and heat shimmer, the world `ColorMatrixFilter` for dimming, brightening and
  desaturation); mask wipes for materials creeping over figures (Bark Skin).
- **Decals** stamp into the field texture under the 8,000 cap: scorch dots, rings and craters, burnt tracks, thorns
  (2 s), leaf litter, root scars, flowers, a gilded ring fading over 2 s.
- **Readability at play zoom** (f = 18 to 48 px): every primary shape is at least 0.25 f across (a 7 px bead at 28 px);
  ground rings are at least 2 px wide with the keyline of C.1; the struck troops show footprint ellipses 250 ms before
  impact (the truth of who is hit); each colour has its own motion so it reads without its hue (Ember rises and
  flickers, Loam spreads along the ground, Radiance comes down in straight rays); effects stay inside the camera's
  focus box; the red-flash rule binds every flash and timed tint.

### 7.2 Painted effect sheets (stage D, 17 sheets, two candidates each)

| Sheet | Background and blend | Contents |
|---|---|---|
| E1 flame tongues | black, additive | an 8-frame loop of a flame tongue, three sizes; reused for burning ground, the Flamebrand's blade flicker, fire shields, Kindle the Host's arc |
| E2 orb and meteor | black, additive | the fireball orb in 3 sizes, its rope trail, a meteor rock with a flame tail |
| E3 fire burst | black, additive | a 6-frame explosion seen from 40° (low dome, not a side-view mushroom) |
| E4 embers and sparks | black, additive | 16 particle sprites |
| E5 smoke | grey on black, luminance as alpha | 8 puffs and 2 columns, tinted char by the game |
| E6 scorch decals | white, multiply | scorch dot, scorch ring 120 wu, crater 30 wu, burnt track, burning-patch base |
| E7 fire breath | black, additive; billows on blue key, normal blend | a 4-frame stream seen at the camera, inner core and outer billows separate |
| L1 thorns | magenta key | thorn spikes erupting in 4 growth stages × 3 variants, one with an impaled-figure slot |
| L2 roots and vines | magenta key | coils that wrap a figure's legs in 3 stages, the same withered (brown, falling) |
| L3 ground crack | white, multiply | a crack strip for ropes, a split-ground decal, root scars |
| L4 leaves, petals, flowers | magenta key | 12 leaves, 8 petals, flower decals, leaf litter |
| L5 bark plating | opaque tile | a bark texture for Bark Skin's mask wipe and the bark material |
| L6 loam breath | magenta key and black | a gale of thorned seeds, spores and torn leaves for a Thornwood wyrm's breath (the breath is the nation's element, display only) |
| H1 holy light | black, additive | the column of light, the sun disc, the halo ring |
| G1 glyph rings | black, additive | the flame, leaf and sun mana rings, drawn on the 0.643 ground ellipse, for release beats and blessing rings |
| U1 umbra | white, multiply | dark ripples, drips and inward tendrils for Fear and life drain |
| V1 veins | black, additive | vein overlays for Blood Fury, tinted by the game |

### 7.3 Storyboards, spell by spell

Times are story ms, full form (short form in brackets).

**Ember Dart** (R1, tier 1, bolt; 900 [600]). Charge 0–350: 24 embers (E4) rise and gather at the staff head, the
flame glyph (G1) flickers over the caster, a small warm light pool at the feet. Release 350–400: a 40 wu ring, 4 wu
recoil (actB). Travel 400–600: a painted flame bead (E2 small) streaks flat at h 16 with a 60 wu trail and a faint
glow line on the ground under it. Impact 600–680: a two-frame white core, 16 sparks, the target's tint to warm 35%; an
armor-piercing hit throws a spark out behind it; a kill burns out (6). Linger 680–900: 6 smoke wisps (E5), a 12 wu
scorch dot (E6). Reads at 28 px as a bright dot crossing the gap, then a puff.

**Fireball** (R2, area 5, tier 2, burst; 1900 [1300]). Charge 0–700: the orb grows from 4 to 14 wu at the staff (E2),
60 embers spiral in, the caster and its neighbours tint warm; footprint ellipses glow under the 5 struck troops for the
last 250 ms. Release 700–760: a 60 wu ring, 6 wu recoil. Travel 760–1310: a lob with a 120 wu apex, a 90 wu rope trail
and 20 trailing sparks; the orb's shadow crosses the ground, and a moving light pool under it brightens the figures it
passes. Impact 1310–1450: the burst (E3) as a low dome, a 140 wu ground ring, 40 embers, 30 sparks; figures within 140
wu tint warm and get a short shadow pushed away from the centre; kills are thrown 16 to 40 wu along the ground and burn
out; shockwave (High) or an expanding ellipse. Linger 1450–1900: embers rise 1.5 s, smoke 2 s, heat shimmer over the
scorch (High), a 120 wu scorch ring decal (E6).

**Warcry** (R2, all friendly, tier 2, aura; 1300). Charge 0–300: the caster's rally pose (actA), swell ×1.04. Release
300–360: an orange ripple ring. Travel 360–960: a ground band sweeps its own side's blocks; each block's weapons rise
(its cheer frame for 0.2 s) and its pennant flares as the band passes. Impact: the morale buff's banner glow. Linger
960–1300: 40 ember flecks rise from the banners.

**Blood Fury** (R3, one squad, tier 2, aura; 1400). Charge 0–400: three red rope tendrils run along the ground from the
caster to the squad (design 8). Release 400–460: flash 0.15 in `#FFB347`. Impact 460–900: veins (V1) rise over the
figures at 24 px and up; below that, a red ring pulses under the block at 1.2 Hz in `#B8605A`. Linger to 1400: the pulse
stays for the battle.

**Pyre Storm** (R5, area 12, tier 3, rain; 3200 [2200]). Charge 0–1300: the world dims 30%, a 200-particle ember vortex
gathers at h 200 over the target row, the camera pushes to 1.12×, footprint ellipses under the 12 struck troops for the
last 250 ms. Release 1300–1360: flash 0.15. Impacts at 1600 + 90 k ms: 12 meteors (E2) fall from the upper left at 60°,
each a 120 wu streak with its own moving light pool, then a burst (E3 small), a 30 wu crater (E6) and the figures
around it lit and shadowed; slow motion 0.6× over the first three. Linger 2590–3200: burning patches (E1 on E6 bases) for
4 s under the next cues, 60 rising embers, heat shimmer.

**Thorn Spray** (G1, area 3, tier 1, burst; 1200 [800]). Charge 0–350: green motes spread over the ground from the
caster's feet, leaf glyph. Release 350–400: a ground ring. Travel 400–700: a crack (L3 rope) runs along the ground to the
target row. Impact 700–850: thorn spikes (L1) erupt under the 3 struck troops with overshoot, 12 splinters and 12
leaves; kills are impaled. Linger 850–1200: thorns stay 2 s, leaf litter decal. Normal blend: Loam is matter.

**Bark Skin** (G2, one squad, tier 1, aura; 1200). Charge 0–300: a 16-leaf spiral (L4) at the caster. Travel 340–500:
leaves drift along the ground to the squad. Impact 500–1100: bark (L5) creeps up the figures by a mask wipe from the
feet (on tier H frames; at tier S the block's tint shifts to bark with a plating ring). The squad's material becomes
bark (wood chips on deflections). Linger: the plating mark.

**Entangle** (G3, one enemy squad, tier 2, curse; 1400). Charge 0–450: earth cracks spread from the caster (L3). Release
450–510: flash 0.15 in `#A6D96A`. Travel 510–800: a crack runs to the target block. Impact 800–1100: roots (L2) burst up
through the ground under every figure of the block and coil to the knees, 3 growth stages over 200 ms; dirt particles.
Linger 1100–1400 and after: the block's lunges are halved (stance), a dashed curse ring; at `expire` the vines brown
and fall in 600 ms (L2 withered), root scars stay.

**Swarm** (G4, summon, tier 2, arrival; 1800). Charge 0–600: buzzing swells, a ground hum shown as dust shiver. Release
600–700: the ground splits (a 60 wu crack decal, an earth ring), flash 0.15. Impact 700–1500: 240 hornet dots (12 per
figure × 20) boil out of the crack on closed-form swirls and settle into the new block's seats. Linger: the badge.

**Regrowth** (G5, all friendly, tier 3, restore; 2000). Charge 0–800: soil light wells up under the caster (the one
glowing Loam effect), 60 green-gold motes rise slowly, the world brightens 8%. Release 800–860: flash 0.15. Travel
860–1660: a green band crosses its side; flowers (L4) sprout as it passes. Impact: "+n" floaters on wounded blocks when
numbers are on; curses dissolve into 20 petals per cleansed squad. Linger: petals drift.

**Bless** (holy, tier 1, aura; 1000 [600]). Charge 0–300: a sun disc (H1) over the priest. Release: the bell. Travel
340–540: the column of gold light (H1) descends on the squad from h 240, its light pool gilding the block's figures by
tint. Impact 540–700: a gold halo ring (G1) on the ground. Linger: banner glow; a gilded ring decal fading over 2 s.

### 7.4 Abilities and visible rules

| Ability | Five beats on the field | Painted | Light and decal |
|---|---|---|---|
| Salamander fire breath (ammo 6) | charge: the breath cutout, throat and cracks glow (emissive mask) 0.3 s; release: jaws open; travel: a 260 wu cone of fire (E7) streams 0.6 s along the ground toward the volley's targets; impact: the targets burn (tint, embers, burn-out deaths); linger: ground burns 2 s | E7, E1 | a moving light pool along the cone; a burnt track under the figures it swept (decal) |
| Great Wyrm breath (ammo 5) | charge: rears up (breath cutout), chest glows; release: the head sweeps the row 0.9 s; travel: a 320 wu cone in the nation's element (Ember: E7 fire; Loam: L6 seeds and spores, matter); impact: the targets; linger: burning ground or thorn litter | E7 or L6 | Ember lights; Loam does not |
| Fire shield (Ash Colossus, Ash Phoenix, Cinder Skin, Living Pyre) | per damaging hit on the bearer: flame tongues (E1) lick from the bearer to the striker, sparks, "−n"; the bearer's emissive veins pulse | E1 | a small light flare at the striker |
| Thorn shield (Thornhide) | splinters and a thorn spike (L1 small) jump to the striker | L1 | — |
| Life drain (Black blessings) | a dark thread (U1, multiply) from the struck to the striker, then green-black motes into the striker | U1 | no light: Umbra absorbs |
| Trample (Primordial, Elder Wyrm) | the rearing stomp cutout; a dust ring; up to the struck small figures shoved 12 wu and flattened; footprints | — (dust is E5) | crater footprints decal; trauma |
| Regeneration | green motes rise from the bearer; the Treant's bark knits (its hit cutout cross-fades back to idle) | L4 motes | a faint Loam heal glow |
| Fear (Primordial) | the god rears; a dark multiply ripple (U1) rolls across the enemy side as a 0.6 s ground band; enemy pennants droop | U1 | the enemy side darkens 10% for the band's passing |
| Kindle the Host (Pyre Lord) | the glaive sweeps an arc of fire (E1 rope arc); six sprites ignite along it and form their block | E1 | a warm arc of light |
| Call the Hunt (Horned Hunter) | the horn is raised (its call cutout); eight wolves bound in from its flank edge with dust | E5 dust | — |
| Berserk rage | a red pulse ring under the block at 1.2 Hz, veins at 24 px and up, attacks ×0.85 time | V1 | — |
| Blessing rings, the god's aura, the prophet's halo | thin ground rings with the colour's glyph at the front (G1); aura motes moving in each pip colour's verb; the prophet's soft rays (H1, alpha 0.3) | G1, H1 | — |
| Flaming Weapons (Red blessing) | flame tongues (E1 small) ride the weapon tip anchor of each frame (6) | E1 | a small warm tint on the bearer |
| Fire arrows | the ember tip and trail on each arrow; a hit ignites 1 s; a miss burns the ground 1.5 s (design 6) | E4, E1 small | burn spot decal |
| The god falls | slow motion 0.2× for 2 s, the field desaturated, the body falls by its death style and dissolves into its dominant colour's particles | the death cutout; the colour's sheet | — |

### 7.5 The magic pilot (shown to the owner at the start of stage D)

Two spells that differ on every axis, each built completely (painted sheets, particles, light, decals, sound hooks)
and shown in a real replay before the other nine:

| | Fireball (battle a: the Cinder Magus casts it 6 times) | Entangle (battle c: cast once by the Thornwood druids) |
|---|---|---|
| Colour, verb | Ember: rises, bursts | Loam: spreads along the ground, grows from below |
| Template | burst (damage, area 5) | curse (debuff, one squad) |
| Light | emissive, additive; lights and shadows the figures | matter, normal blend; no light |
| Travel | a lob in the air with a ground shadow | a crack along the ground |
| Painted | E2, E3, E4, E5, E6 | L1, L2, L3, L4 |
| Linger | scorch ring, embers, smoke, heat shimmer | vines that hold for 5 rounds, then wither; root scars |

The review page shows each at 1×, at 0.25× and frame by frame beside its storyboard, at play zoom and at 2×.

---

## 8. Pipeline

All tools are in `tools/`; all run on numpy and Pillow (no scipy here) and Playwright for the mockup.

### 8.1 Generation: `tools/gen.py`

`python3 gen.py --stage A --purpose "…" MODEL OUT.png PROMPT.txt [REF …] [--aspect 1:1]` runs the repo's
`tools/art/gemini_gen.py` (which writes `OUT.json` with the sha256, model, prompt, references and usage; the key is
added by the environment's network secret and is never read or printed), then appends a row to `gen-log.tsv` (file,
model, seconds, tokens, stage, purpose, date, result). It refuses a call once the stage has used its budget (A: 60),
failures included. `gen.py --count` reports the stage's use.

- Models: `gemini-nano-banana-2.1` (the portraits' model) by default; `gemini-3-pro-image` and
  `nano-banana-pro-preview` are tried in the calibration (section 9).
- References, in order: the maquette guide (camera and pose), the identity or style portrait, the anchor.
- Output sizes: 1024 px for 1:1. `gemini_gen.py` sends only the aspect ratio. For size-6 bodies at tier H a 2K output
  is wanted: stage C tests one generation with a scratchpad variant that adds `imageConfig.imageSize`; if the model
  refuses it, size-6 bodies are made at 1K and tier H upscales them 1.3× (acceptable for the player's close zoom only).

### 8.2 Keying: `tools/key.py`

Improves `visual-v4/painted/key.py`:

1. The key is measured from the sheet's border (generated backgrounds are never exactly `#00FF00`: the 2026-10-22
   sheet's was `#FD0CFB`, the wyrm's `#10F608`), and the key strength is normalised by it.
2. A soft alpha ramp (opaque below 0.30 of the background's strength, clear above 0.70).
3. **Edge erosion:** a 1 px min filter on the alpha removes the outer ring where the key bled into the paint, applied
   only where that ring is tinted by the key, so a thin untinted spear shaft or staff (2 to 3 px on a sheet) survives
   (the first version ate the maquettes' staffs and broke the head-offset check).
4. **Despill** on every pixel: the key channel is clamped to the others (green: G ≤ max(R, B); blue: B ≤ max(R, G);
   magenta: R and B lose their common excess over G).
5. **Colour bleed:** pixels below alpha 0.5 take the colour of their opaque neighbours, so mipmaps and premultiplied
   downscales never pull key or black into the edge.
6. A report: `spillEdgePct` (fixed at the edge), `keyInUnitPct` (key colour inside the unit: wrong key or re-roll),
   `fringePct` (left after despill).

Measured: on the 2026-10-22 sheet the old keyer left 3.51% of visible pixels tinted; the new one finds 3.96% spill at
the edge, fixes all of it (residual 0.000%) and 0.03% key colour inside the unit. On the wyrm: 1.53% spill, residual 0.
About 2 s per 1024 px sheet.

### 8.3 Slicing: `tools/slice.py`

- Per grid cell, a window 22% larger on each side; 8-connected components of alpha > 0.35 (labelled by max-propagation
  in numpy). The cell's figure is its largest component inside the cell, plus every component mostly inside it that is
  at least 30 px or within 14 px of the main one (sparks, arrow tips, tassels); other specks are dropped and counted.
  A figure touching the window edge is flagged as running into a neighbour.
- **Ground anchor:** standing frames, the centre of the lowest 15% of the figure (both feet) at its lowest row; lying
  frames, the body's centre at three quarters of its height; flying frames, the centroid (the hover point; the game
  draws the shadow). A "feet overlay" proof (all frames stacked on their anchors) is part of the review; manual nudges go
  in the metadata as `anchorOverride` and are applied by `pack.py`.
- Output: one trimmed PNG per frame (2 px pad, other cells' pixels cleared) and `<figure>.<view>.json` (box, anchor,
  height, width, area, parts, flags; missing and overlapping cells). Monster cutouts use `--single ACTION`.

### 8.4 Scale and atlas cells

One scale per figure and view: the stand frame's height becomes the tier's standing height (`units.json` `heightPx`),
and every other frame keeps its size relative to it.

| Body | Tier S stand height | Tier H | Nominal cell (S) |
|---|---|---|---|
| Man (size 1) | 56 px | 112 px | 72 × 72 |
| Commander (×1.15) | 64 | 128 | 80 × 80 |
| Wolf rider (size 2, long) | 74 | 148 | 120 × 88 |
| Cavalry (size 2) | 84 | 168 | 128 × 96 |
| Fire Sprite | 40 | 80 | 56 × 56 |
| Hornet (one of 12 dots a figure) | 10 | 20 | 16 × 16 |
| Size 3 body (Salamander, Ash Phoenix) | 129 | 258 | 260 × 160 texture |
| Size 4 (Treant, Giant, Titan…) | 190 | 380 | 384 × 384 |
| Size 5 (Ash Colossus) | 258 | 516 | 512 × 512 |
| Size 6 (wyrms, idols, World Tree, Primordial) | 336 | 672 | 1024 × 512 (long) or 512 × 512 |

Tier S serves devicePixelRatio below 1.5 and the automatic camera (18 to 48 px a man: always a downscale, so painted
detail is kept by mipmaps). Tier H serves DPR ≥ 1.5 and the player's zoom up to 72 px. Frames are trimmed, so the
nominal cell is only for capacity. Measured on the pilot's twelve looks (maquette sheets, both views, 16 poses and 2
white frames each: 432 frames): tier S fills one 2048 × 1024 page at 67%; tier H fills two 2048² pages. A battle's
measured maximum of 13 looks plus commanders therefore fits one page at tier S and two or three at tier H (one per
side, as design 12.1 allows).

### 8.5 Packing and metadata: `tools/pack.py`

`python3 pack.py OUT_PREFIX S|H DIR:FIGURE:VIEW[:CLOTHHEX] …`

- Premultiplied-alpha Lanczos downscale; the design's keyline (`#1C1A17`, 60%, 1 px at tier S, 2 px at tier H).
- White silhouettes of `stand` and `recoil` per view for the one-frame hit flash.
- **Cloth variants:** design revision 6 picks base, mid, light or dark cloth per side and ground (battle c: the near
  Cinder side wears dark `#7E3118`). The cloth is found by the side-share rule as a soft mask and moved in OKLab to the
  variant, keeping the painted shading; the variant is packed as its own frames for the battles that need it.
- Shelf packing into 2048² pages with 2 px gutters, page height cut to a power of two; one Pixi spritesheet JSON per
  page (`frames` with `frame`, `anchor`, `sourceSize`; `meta` with the tier). Mirrored views are not stored.
- **Per figure metadata** (written beside the atlas by the pilot step): figure id, unit, face, views, scale, frames by
  pose name, anchors, `weaponTip` and `bowHand` per frame (from the guide registration, 6), the cloth hex and variants,
  the key, the generation files and their sha256, the checks' report, and the approval (who, when).

### 8.6 Automatic checks: `tools/checks.py`

| Check | Rule | Maquette (dry run) | The 2026-10-22 sheet |
|---|---|---|---|
| Camera | the stand silhouette against the guide's, both scaled to one height and aligned on their ground points: IoU ≥ 0.60; IoU − IoU with the mirrored guide ≥ 0.03 (facing); aspect ratio within 0.75 to 1.33 of the guide's; head offset over the feet (after an opening that removes staffs and spears above the head) within 0.10 standing heights of the guide's | IoU 0.91 to 0.99; facing margin +0.20 to +0.32 (24 sheets) | **fails**: IoU 0.54, facing −0.03, head offset +0.09 against −0.01 |
| Variety | marchA against marchB: silhouette IoU ≤ 0.86 and legs (lowest 35%) IoU ≤ 0.72; no two of stand, march, windup, strike, recoil (draw, loose, gallops, charge) above 0.92. Robes to the ground hide the legs: march IoU ≤ 0.95, and the walk comes from the hem sway and lean (6) | march 0.51 to 0.68 (robed casters 0.85 to 0.92); most alike ≤ 0.87 (draw against loose) | **fails**: march 0.88, stand and marchA 0.97 |
| Scale | stand, idle and march heights within ±15% of the stand frame | passes | passes (its frames hardly differ) |
| Fringe | `fringePct` ≤ 0.2 and `keyInUnitPct` ≤ 0.5 | 0, 0 | 0, 0.03 (after the new keyer) |
| Side colour | ≥ 30% at f = 28 px on plains (1.4) | 27 to 49% | **fails**: 5% |
| Value | block mean L\* ≥ 15 below each of the four grounds (1.5) | 16 to 29 below on the worst ground | passes (27 below) |
| Identity (commanders, Salamander, Treant) | ΔE2000 < 18 between the figure's upper third and the portrait's subject (5.5); the marks checklist by the art director | — | — |

`--proof OUT.png` writes the formation proof (the block on the four grounds, 3×) used on the review page.

### 8.7 Into the mockup, then the game

The pilot step adds a loader to the mockup: a painted look's atlas JSON replaces `bakeFigures` for that unit (same
frame indices as `FR`, mapped by pose name: idle ← stand, idle2; walk ← marchA, stand, marchB, stand; attack ← windup,
strike, follow, strike; shoot ← draw, loose, stand (archers) or actA, actB, stand (leaders) or aim, throw, follow
(skirmishers); brace ← brace; flinch ← recoil; fall ← fall; dead ← deadA (deadB as the seeded variant); white ← the stand
and recoil silhouettes), and a painted big body replaces
`makeBigBody`'s Graphics with a `Sprite` (stage A: no deformation; stage D: the `MeshPlane`). The procedural figure
stays the fallback for any look without approved art, as design 12.2 requires. In the game, the files go to
`src/assets/raster/figures/<nation>/<unit>/` with JSON sidecars like the portraits', and the content validation test
gains a check that every painted look has both views, all its layout's frames and an approved sidecar.

---

## 9. The pilot (stage A)

**Battle c, "The Fight in Wickemoss"** (swamp; the Cinder Horde attacks from the near side; Thornwood defends). It
holds the Salamander the owner flagged (near side, so its back view), both nations' line infantry and archers, and
leaders of both sides. Units on the creature or mount track (Fire Sprite, Hornet Swarm, Wolf Rider) stay procedural.

| Order | Jobs | Generations |
|---|---|---|
| 1. Calibration | the Cinder Warrior's back sheet with `gemini-nano-banana-2.1`, `gemini-3-pro-image` and `nano-banana-pro-preview` (guide, portrait, anchor), then the best model with the guide and the anchor only (does the candle-lit portrait pull the light or the framing?). Each is keyed, sliced and checked; the art director picks the model and the reference set | 4 |
| 2. Core | Cinder Warrior, Flame Archer, Warden, Longbow Hunter (back and front sheets, then a card bust each); Ash Chieftain 06 and 03, Warden Captain 07 (back and front); the Salamander face 01 idle (back and front) | 4 × 3 + 3 × 2 + 2 = 20 |
| 3. Second wave | Ember Skirmisher, Flamebrand (sheets and busts); Ember Adept 07, Elder Druid 08, Sapling Druid 08 (sheets) | 2 × 3 + 3 × 2 = 12 |
| 4. Re-rolls and the art director's fixes | a sheet that fails a check or the review is re-rolled once with the failure named in the prompt; a second failure is reported, not re-rolled again | ≤ 24 |
| Total | | ≤ 60 |

`prompts/manifest.json` holds every job (prompt file, references in order, model, aspect, key, output path, wave); a
card bust runs only after its figure's front sheet is approved. The Salamander shows **standing, unanimated**: it
keeps its place in the replay and turns to face its foe, but its cutout is not deformed, as the owner's order asks.

**The art director's review** (the next step) checks each sheet and the battle against: the style lock (1.1 to 1.3);
camera and facing by eye and by `checks.py`; the 16 poses distinct and readable at 48 px (2× crops) and at play zoom;
side colour ≥ 30% and value; weapons and shields consistent across cells; anatomy (hands, feet, weapon grips); the
identity marks of each commander against its portrait, and the Salamander's head, scales, cracks, horn nubs, brow
knobs and scrape against portrait 01; keying edges on light and dark grounds; feet that do not slide between frames;
how painted and procedural figures sit together. Each finding names the sheet, the cell and the fix (re-roll with a
prompt change, a key change, an anchor nudge or a code change).

---

## 10. Files

| File | What it is |
|---|---|
| `art-plan.md` | this plan |
| `units.json` | the figures of the three battles: kit, gear, side zones, key, layout, formation, references, battles, track, stage; the pilot's waves and budget (written by `tools/units_src.py`) |
| `inventory.json`, `inventory.md` | the full M1 inventory, 61 entries (written by `tools/inventory.py`) |
| `gen-log.tsv` | the generation log (empty: this step generated nothing) |
| `prompts/*.txt`, `prompts/manifest.json` | the pilot's 36 prompts and jobs: 4 calibration, 20 core, 12 second wave (written by `tools/make_prompts.py`) |
| `refs/mockup/` | camera references from the mockup, 48 renders, `refs.json`, `contact.png` |
| `refs/guides/` | exact-camera maquette guides per figure and view, monsters per action, `guides.json` |
| `refs/style/style-refs.json`, `refs/style/pilot-refs.png` | each figure's style references; the pilot's references side by side |
| `tools/units_src.py` | the unit table (kits, zones, keys, pilot) |
| `tools/guides.py`, `sdf.py`, `rigs.py`, `poses.py` | the maquette renderer, its rigs and the sheet layouts and pose words |
| `tools/mockup_refs.cjs` | renders `refs/mockup/` from the mockup |
| `tools/make_prompts.py` | the prompt builder and manifest |
| `tools/inventory.py`, `tools/style_refs.py`, `tools/contact.py` | the inventory, the style references, contact sheets |
| `tools/gen.py` | generation with logging and the stage budget |
| `tools/key.py`, `tools/slice.py`, `tools/checks.py`, `tools/pack.py` | the pipeline (section 8) |
| `work/keytest/` | the keyer and checks on the 2026-10-22 sheet and the mockup's figures (formation proofs `proof-*.png`) |
| `work/dryrun2/` | the whole pipeline on the pilot's 24 maquette sheets: keyed sheets, key reports, sliced frames, formation proofs (`*.block.png`) |
| `work/dryrun/` | the atlases packed from them (`atlasS.0.png` with a dark-cloth variant, `atlasS12.0.png`, `atlasH.0-1.png`) and their JSON |

---

## 11. Risks and questions for the owner

**Risks**

1. **The camera.** The generator ignored a camera described in words on 2026-10-22. The maquette guide is the fix;
   the calibration measures it on the first sheet, and the camera check fails a sheet that faces the wrong way or comes
   out front-on. If all three models fail it, the fallback is to generate each pose from its own guide cell at 2 × 2
   (four sheets a view) at four times the cost, which the stage A budget cannot cover; that would come back to the
   owner as a finding, not be spent.
2. **Consistency across 16 cells.** Helmets, shields and cloth can drift between cells; the prompt says "the same
   soldier in every cell", the art director checks it, and a drifting sheet is re-rolled.
3. **Clay leaking into the paint.** The maquettes are smooth grey shapes; the prompt forbids copying their surfaces, and
   the calibration's fourth job tells whether the portrait reference is needed to hold the painted hand.
4. **Commander volume.** 128 faces × 2 views is the largest item of stage B (about 290 generations with re-rolls). A
   cheaper variant (two faces per sheet, 8 poses each) halves it but halves each face's poses; this plan does not
   recommend it.

**Questions** (each has a default the plan follows unless the owner says otherwise)

- **Q1. God variants.** Painted god art shows variant 0 of every slot. The designer offers two more per slot (81
  combinations a chassis). Default: paint variant 0 now; after the owner approves the base portraits, paint the
  silhouette-changing slots (headgear or horns, weapon head) as separate overlay cutouts at the same camera in stage D,
  and draw the rest (markings, glyphs, aura) in code.
- **Q2. Troop card busts.** Default: painted busts in the portraits' framing for every troop type (5.4), replacing the
  baked card pose.
- **Q3. Oakheart.** "A walking oak under thornplate": default, reviewed on the creature track (portrait first).
