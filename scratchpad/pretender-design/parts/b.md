
---

## B. Customization (Age of Wonders 4-like)

### B.1 What to take from AoW4

AoW4's decisive move is that the people's form is cosmetic and the traits are mechanical: "the
physical form is effectively only cosmetic" ([AoW4 wiki: Form](https://aow4.paradoxwikis.com/Form)).
Reviewers call the faction creator the game's centerpiece, with "an unparalleled degree of
customization for the genre" ([Gideon's Gaming](https://gideonsgaming.com/age-of-wonders-4-review/)).
The lessons below come from `research-aow4.md` (Part 2), which cites each source.

| Lesson | Evidence | Fluid Magic |
|---|---|---|
| Any look on any build | Form is cosmetic ([wiki](https://aow4.paradoxwikis.com/Form)) | `PretenderLook` never touches `PretenderDesign` |
| Mechanics add visuals; cosmetics never add mechanics | Dragon attunement sets breath and glow ([Dragon Dawn](https://www.paradoxinteractive.com/games/age-of-wonders-4/add-ons/age-of-wonders-4-dragon-dawn)) | Pips, blessings, dominion, awakening and body tags each show automatically (B.4, C.5) |
| A visual that carries movement cannot be hidden | Transformations hideable except flying or floating ([forum](https://steamcommunity.com/app/1669000/discussions/0/6761669877514621714/)) | Wings, roots, stealth flicker and embers are fixed parts, never slots |
| Cosmetics locked by mechanics anger players | The C4U mod exists only to unlock cultures' cosmetics ([Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=2971527182)) | No slot is locked by nation, realm or pips |
| Fixed secondary colors anger players | Dragons have "only one colour option" ([forum](https://steamcommunity.com/app/1669000/discussions/0/4036979414422568941/)) | Three chosen channels on every chassis |
| New ruler types shipped thin | "Not enough cosmetic options for Giant Kings" ([forum](https://steamcommunity.com/app/1669000/discussions/0/596271495257278373/)) | A content test requires 4 slots × 3 variants on every chassis |
| Random came late, then gained settings and history | Random Ruler in the Wyvern Update ([patch notes](https://store.steampowered.com/news/app/1669000/view/7208622092879106175)) | Random god and random look from day one, with locks and a 10-roll history |
| No in-game sharing | "No easy in-game way to share factions" ([forum](https://steamcommunity.com/app/1669000/discussions/0/839501827476184072/)) | A share code |
| Generated history makes a faction feel authored | "The creator will also create a historic background" ([GamePressure](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c)) | A templated myth line with an override |
| Appearance editable mid-campaign | Dragon Lord "Adjust Appearance" ([MMORPG](https://www.mmorpg.com/reviews/age-of-wonders-4-dragon-dawn-review-strategy-session-2000128239)) | "Adjust appearance" on the pretender's commander panel (M1-should) |
| One base mesh, shared animations | Dev Diary #11 ([GameBanshee](https://www.gamebanshee.com/news/127487-age-of-wonders-4-developer-diary-11-art-design.html)) | One anchor skeleton per rig; parts authored in anchor space; docs/09 tweens move anchors |

### B.2 Where the look lives

- **Outside `GameState`.** `PretenderDesign` stays the sim's type. The look, the identity
  (except the name) and the nation look live in three places: the designer's saved gods
  (`GodRecord`), the share code, and the save file's presentation block. The sim cannot read
  what it does not hold, so "cosmetic never affects the sim" is structural.
- **The name** is the one exception: `NationSetup.pretenderName` (D7) names the pretender
  commander, so messages ("Vulkra stands in Kharnath.") and battle records carry it. It is an
  opaque label; no rule branches on it.
- **AI nations** get a look and identity at New Game: the preset's own look, or a roll from a
  stream seeded by the game seed and the nation's slot. A reload shows the same look because
  the save stores it.
- **Guards.** `tests/sim/purity.test.ts` forbids `src/sim/**`, `src/mapgen/**` and `src/ai/**`
  from importing `src/content/looks/**`, as the battle design forbids `src/present`. A
  determinism test plays the same headless game with two different looks and identities and
  asserts equal state hashes; a second test changes only the name and asserts equal outcomes
  (winner, day, provinces) with the name fields blanked from the hash.

```ts
// src/content/looks/types.ts (presentation data; never imported by sim, mapgen, ai)
export type SlotId = string;        // per chassis, from ChassisLookDef
export type VariantId = string;
export interface PretenderLook {
  v: 1;
  chassis: string;                                    // the slots are validated against it
  parts: Partial<Record<SlotId, VariantId>>;          // absent = the slot's variant 0
  markings: MarkingId;                                // procedural pattern (B.5)
  swatches: { material: SwatchId; metal: SwatchId; accent: SwatchId };
  sliders: Partial<Record<SliderId, -2 | -1 | 0 | 1 | 2>>;
  pose: 'regal' | 'wrathful' | 'serene';
  aura: 'halo' | 'motes' | 'groundSigil' | 'sparkCrown';            // shape only; colors from pips
  flourish: 'sigilWheel' | 'mantle' | 'haloBurst' | 'ascension';    // charge window only (C.5)
}
export interface PretenderIdentity {
  name: string;                 // 1 to 24 characters; copied into NationSetup.pretenderName
  epithet: string;              // 0 to 32, "the Unburnt"
  title: string;                // 0 to 32, "Lord of Cinders"
  pronoun: 'he' | 'she' | 'they' | 'it';
  myth: string | null;          // null = the templated myth (B.6); up to 280 characters
}
export interface NationLook {
  sigil: { frame: SigilFrameId; charge: SigilChargeId };
  division: BannerDivisionId;
}
/** A god in the designer, in My Gods, and in a share code. */
export interface GodRecord {
  v: 1;
  nation: NationDefId;
  design: PretenderDesign;      // the sim's type, checked by validatePretender
  look: PretenderLook;          // checked by validateLook
  identity: PretenderIdentity;
  nationLook: NationLook;
}
/** The save file (Phase 9, src/ui/persistence): the sim's state plus the presentation block. */
export interface SaveFile {
  format: 'fluid-magic-save';
  version: number;
  game: string;                                        // serialize(state), gzipped as the battle design asks
  presentation: { gods: Record<NationId, { look: PretenderLook; identity: PretenderIdentity; nationLook: NationLook }> };
}
// src/content/looks/chassis.ts
export interface ChassisLookDef {
  chassis: string;
  rig: Rig;                                            // the battle design's rigs, plus 'avian' and 'behemoth'
  slots: readonly { id: SlotId; family: PartFamily; variants: readonly VariantId[] }[];
  markings: readonly MarkingId[];
  materialFamily: 'skin' | 'stone' | 'bark' | 'scale' | 'hide' | 'ember';
  sliders: readonly SliderId[];
  /** Parts that carry mechanics and are never slots. */
  fixed: readonly PartId[];
}
export function validateLook(look: PretenderLook, chassis: string): string | null;
```

### B.3 Slots and variants per chassis

Every chassis has **four slots with three variants each** (variant 0 is the base art Phase 11
needs anyway), plus a **markings** pattern from eight procedural ones. Slots favor silhouette,
because faces vanish at 64 px (research-aow4 L8). Variants come from **shared part families**,
authored once in anchor space and scaled per chassis, so 18 chassis cost far fewer files than
18 × 8.

| Chassis | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Fixed (mechanics) |
|---|---|---|---|---|---|
| Oracle of the Flux | headgear: cowl, circlet, mask | mantle: none, long cape, tattered | staff head: orb, crescent, mote cage | robe glyphs: runic, spiral, dot-line (procedural) | floating hem |
| Titan | headgear: great helm, horned crown, crown of points | mantle: none, long cape, banner cape | blade: straight, flamberge, broad | armor marks: plain, runic, veins (procedural) | giant scale |
| Great Wyrm | horns: swept, crown of spines, frill | wing membrane: smooth, tattered, ribbed sail | tail: spade, club, blade fin | scale pattern: banded, mottled, plated (procedural) | wings, breath glow |
| Living Monolith | shape: obelisk, menhir, broken arch | capstone: none, floating stone, carved face | overgrowth: none, moss and vines, soot and cracks | glyphs: runic, spiral, dot-line (procedural) | rooted base |
| Ascended Hero | headgear: circlet, great helm, horned crown | mantle: long cape, banner cape, tattered | blade: straight, broad, flamberge | heraldry: plain, quartered, chevrons (procedural) | — |
| Primordial | horns: ram, crown of spines, antlers | back: moss, spines, crystals | tail: club, spade, blade fin | hide: mottled, banded, stone (procedural) | — |
| Ash Colossus | head: brazier, horned skull, faceless crown | shoulders: bare, chains, spikes | fists: bare, banded, molten | cracks: veins, plates, runes (procedural) | embers |
| Ash Phoenix | crest: plume, flame crown, horned | plumage: fan, flame fringe, streamers | tail: long, fan, forked | feathers: barred, ember-tipped, plain (procedural) | flame wings |
| Pyre Lord | headgear: flame crown, horned crown, great helm | mantle: ember mantle, banner cape, none | glaive: glaive, crescent, hooked | ash marks: stripes, veins, runic (procedural) | — |
| Cinder Idol | face: brazier face, horned head, stacked cairn | base: plinth, chained, skull pile | overgrowth: soot and cracks, ember veins, none | glyphs (procedural) | immobile base, smoke |
| Ember Hierophant | headgear: mask, cowl, flame crown | mantle: ember mantle, long cape, tattered | staff head: orb, crescent, mote cage | robe glyphs (procedural) | — |
| Living Flame | form: pillar, serpent coil, winged | crown: none, flame crown, horns | heart: ember core, white heart, eye (procedural) | tongues: lapping, spiral, sheet (procedural) | flight, heat haze |
| Wild Spirit | beast form: stag, wolf, great cat | head: antlers, spirit mask, horned skull | trail: wisps, leaves, mist (procedural) | markings: stripes, rings, spots (procedural) | translucent flicker |
| World Tree | canopy: round, weeping, crown of thorns | trunk face: none, carved face, knotted eyes | blossom: none, pale blossom, fruit (procedural) | bark: ridged, spiral, knotted (procedural) | roots |
| Horned Hunter | antlers: antlers, ram, swept | mantle: leaf mantle, wolf pelt, tattered | spear: leaf blade, hooked, crescent | warpaint (procedural) | — |
| Elder Wyrm | horns: crown of spines, swept, frill | back: moss, spines, crystals | tail: club, spade, blade fin | scale pattern (procedural) | — (no wings: it does not fly) |
| Mother of Beasts | pelt: bear, wolf, stag | headgear: antler crown, circlet, none | maul: plain, studded, stone-headed | warpaint (procedural) | — |
| Briar King | headgear: horned crown, antler crown, crown of points | mantle: leaf mantle, tattered, none | maul: thorned, studded, stone-headed | bark (procedural) | thorns |

Combinations: 3⁴ = 81 silhouettes per chassis, 1,458 in all, before color, markings, pose,
aura, flourish and sliders (B.7 counts).

### B.4 Color channels and the color-blind rules

| Channel | Chosen or derived | Choices in M1 | Carries information? |
|---|---|---|---|
| `banner` (the docs/09 tint zone in battle and on the map) | derived: the nation's banner (`NATION_BANNERS`) | none | yes: which side; tested by the palette test |
| `pipTint` (the tint zone on the summary card and the designer portrait, per docs/09) | derived: the dominant pip color | none | yes: always beside the mana-symbol row |
| `glow` (aura motes, eyes, glyphs, breath, staff head) | derived: every color with pips, in proportion; the Wyrm's breath from D6 | none | yes: paired with symbols (C.5) |
| `material` (skin, stone, bark, scale, hide, ember) | chosen | 8 per family (ember 6) | no |
| `metal` (crowns, armor, chains) | chosen | 6: gold, silver, bronze, iron, bone, obsidian | no |
| `accent` (cloth trim, markings) | chosen | 8 muted tones | no |

Rules, each a test in `tests/content/looks.test.ts` using the palette test's helpers
(`tests/content/colorMath.ts`):
1. Chosen channels carry no information; side identity is banner, glyph and position (battle
   design S4.8) and color identity is glow plus symbol.
2. Every material and metal swatch reaches WCAG 3:1 against the keyline chosen for it by the
   docs/09 `keylineFor` rule, so the silhouette reads on every swatch.
3. Every accent differs from every `NATION_BANNERS` entry by CIEDE2000 ≥ 15 (≥ 10 under the
   simulated deficiencies), so a god's trim never reads as another side's banner.
4. No swatch, glow or flash color is a saturated red (R/(R+G+B) < 0.8, the WCAG 2.2 test
   research-vfx 2.6 computed for the palettes).
5. The designer has a color-blind preview (protanopia, deuteranopia, tritanopia) using the
   palette test's simulation matrices in a `ColorMatrixFilter`.

M2: a free color picker for material, metal and accent only, behind "More colors", checked by
rules 2 and 3 live. The derived channels never get one (AoW4 players asked for more colors,
[Age of Colors mod](https://steamcommunity.com/sharedfiles/filedetails/?id=2970499689); FM's
map colors are gameplay information, so identity goes into shapes instead).

### B.5 Sliders, poses, auras, flourishes, markings

- **Sliders** (−2 to +2, integer, clamped): stature ±3% a step; head ±6%; horn or crown length
  ±10%; wingspan ±8% (flyers only); ember or glyph intensity ±25% particle rate (bodies with
  embers or glyphs; capped by the tier budgets of C.1). The sim's `size` drives battle
  drawing, so stature never changes the size class. Each slider is a transform on an anchor; a
  test composes every chassis at ±2 and checks the bounding box stays inside the 128 px
  portrait frame (AoW4's cropping problem, research-aow4 1.5).
- **Poses** (3: regal, wrathful, serene) are anchor rotations for the portrait and the idle
  stance. Battle poses stay rig-driven (battle design S4.4).
- **Aura shapes** (4, procedural, cosmetic): halo ring, orbiting motes, ground sigil circle,
  crown of sparks. Their colors always come from the pips; their motes move in each color's
  verb (C.1).
- **Cast flourishes** (4, procedural, cosmetic): sigil wheel, mantle, halo burst, ascension.
  They play inside the charge beat of the god's own casts and never lengthen it (C.5).
- **Markings** (8 procedural pattern fills: stripes, rings, spots, banded, mottled, runic,
  veins, plain), drawn in the accent channel through the part's tint mask. Each chassis lists
  three as its slot 4 or as extra markings.

### B.6 Identity: name, epithet, title, pronoun, myth

- **Name** (1 to 24), **epithet** (0 to 32), **title** (0 to 32), **pronoun** (he, she, they,
  it; AoW4 launched its Eldritch Sovereign without "it",
  [forum](https://steamcommunity.com/app/1669000/discussions/0/4548155824440762289/)). Display:
  "Vulkra the Unburnt" with "Lord of Cinders" beneath.
- **Generators** run on the designer's seeded stream (B.9). Names come from syllable tables
  per dominant color, like `src/content/names.ts` does for provinces (Ember: Vul, Khar, Pyr,
  Ash, Cind + ra, ax, oth, eth; Loam: Thal, Ver, Ald, Sylv + wyn, mere, oak, ra; M2 colors
  added with their nations). Epithets and titles come from tables keyed by role and dominant
  color ("the Unburnt", "Pyreborn", "the Evergreen", "Root of Ages"; "Lord of Cinders", "Mother
  of the Hunt", "Keeper of the Spring").
- **Myth** (2 or 3 sentences, templated, overridable): built from the chassis phrase, the
  dominant color, the strongest scale pole, the dominion strength word, the awakening, and the
  signature blessing. Example (Ash Phoenix, R4, Growth 2, dormant): "Ash-feathered and
  undying, Vulkra the Unburnt sleeps a year beneath Kharnath. When it wakes, the land will grow
  and burn by turns." Templates read the pronoun. The docs/05 "reading" stays a separate,
  strategic one-liner on the card ("An undying firebird. Expect raids that never end.").
- **The sim's copy** is the name only (D7). Messages never use pronouns, so the pronoun can
  stay in the presentation block.

### B.7 Nation banner and sigil

- **Banner color** stays as `NATION_BANNERS` assigns it, because ownership bands and candles
  are gameplay information and pass the palette tests (docs/09).
- **Division** (6, procedural): plain, per pale, per fess, per bend, chevron, bordure, in the
  banner color and the neutral that `keylineFor(banner)` picks (`#F4EEDF` or `#1C1A17`).
- **Sigil**: a frame (6: roundel, shield, lozenge, sunburst, ring of thorns, broken circle)
  around a charge (16: crown, eye, hand, tree, flame, tower, serpent, star, skull, wave, antler,
  key, sword, wheel, moon, anvil), drawn in the neutral. 96 sigils × 6 divisions = 576 banners,
  all told apart by shape. Charges are original geometric shapes.
- **Where it shows**: the army badge corner (10 px charge), the squad pennants in battle beside
  the side glyph, the `PretenderCard`, the top bar's nation button, name cards, the rim of
  ritual sigils (C.4), and the victory screen.

**Counting looks.** Per chassis: 81 silhouettes × 8 markings × (8 × 6 × 8) swatches × 3 poses ×
4 auras × 4 flourishes ≈ 12 million, before 5 sliders at 5 steps. AoW4's published comparison
points are in research-aow4 3.7: 13 base banner colors, a 6-type ruler roster, and per-slot
counts not found.

| Axis | AoW4 | FM M1 | FM M2 |
|---|---|---|---|
| Ruler type / chassis | 6 | 18 (12 per nation) | 36 |
| Part slots per body | about 10 humanoid slots | 4 × 3, plus markings | 6 × 5 |
| Sliders | body shape, head, hands, height, arm length | 5 (by chassis) | 7 |
| Chosen color channels | skin, hair, armor, banner ×2, later a picker | 3 (8 / 6 / 8) | 3 plus a picker |
| Banner identity | 13 colors, icon set | fixed colors; 96 sigils × 6 divisions | about 200 sigils |
| Pose | diplomacy pose | 3 | 5 |
| Magic look | via attunement | 4 auras, 4 flourishes, pip-driven glow | 8 and 8 |
| Presets | 18 to 20 | 12 with looks | 30 |
| Random | ruler, reroll, settings, history | god and look, locks, seed, 10-roll history | plus constraints |
| Sharing | none in game | share code | plus files and a gallery |

### B.8 Portrait

- The portrait is **composed from the same parts** as the battle sprite, in a portrait pose, at
  128 px (card), 256 px (designer preview) and 64 px (battle docks). This replaces docs/09's
  "a 128x128 SVG portrait" per chassis, so every cosmetic choice shows on the card.
- Layers, back to front: backdrop (parchment, the nation's home terrain gradient, or night),
  ground aura, body parts, glow parts, bless rings and orbiting symbols (C.5), the awakening
  overlay (dormant: a sleep veil and closed eyes; imprisoned: runic chains), the sigil corner,
  the frame.
- AoW4's lighting toggle becomes the backdrop toggle (research-aow4 L10).

### B.9 Presets, randomize, My Gods, the share code

- **Presets** (A.8) carry a curated look and identity. Applying a preset asks nothing; a "keep
  my look" checkbox keeps the current look and identity when only the build should change.
- **Random god** (`rollGod(nation, seed, opts)`): picks an available chassis, an awakening at or
  above its minimum, a strategy family (bless rush, mage, dominion, sleeper, summoner), then
  spends by that family's template (pips first, then dominion, then the nation's own poles),
  fills leftovers until under 20 points remain, takes the Recommended blessings, and adds one
  affordable boon 30% of the time. The result always validates (tested over 1,000 seeds).
- **Random look** (`rollLook(chassis, seed, locks)`): every unlocked slot, swatch, marking,
  pose, aura and flourish uniform; sliders 0 (60%), ±1 (30%), ±2 (10%). Identity rolls from the
  generators.
- **Determinism and history.** The stream is `createRng(hash32('god', seed))` from the sim's
  algorithm (via the battle design's pure `src/present/rand.ts`), never `state.rng`. The seed
  is shown in the dice tooltip; Back and Forward walk the last 10 rolls. Locks exist per build
  step and per look slot. Players asked for a random button on every step
  ([forum](https://steamcommunity.com/app/1669000/discussions/0/3828666283443789087/)), so each
  step and slot has its own die.
- **My Gods**: an IndexedDB store of `GodRecord`s (`idb-keyval`, which docs/06 already names).
  Save edits in place, Save as copy, Rename, Delete, Copy code. AoW4 players reported edits that
  did not stick ([forum](https://steamcommunity.com/app/1669000/discussions/0/5294588689507328353/)).
- **Adjust appearance** in game (M1-should): the pretender's commander panel opens Look and
  Identity (not the name, which the sim holds). Nothing in the sim changes.

**The share code.** `FM1-` + base64url(payload ‖ CRC-16/CCITT-FALSE). Indices come from
append-only code tables in content (`src/content/looks/codes.ts`); a snapshot test pins every
existing index so old codes keep decoding.

| Field | Bits |
|---|---|
| payload version | 4 |
| nation (code table) | 6 |
| chassis (code table) | 7 |
| pips W U B R G | 5 × 3 |
| dominion | 4 |
| scales (value + 3) | 5 × 3 |
| awakening | 2 |
| breath color (0 = default) | 3 |
| blessings: count, then each id | 4 + n × 7 |
| boons mask, then Sacred Spring's color if set | 8 (+ 3) |
| look: slot count, then each variant | 3 + n × 4 |
| swatches material, metal, accent | 4 + 3 + 4 |
| sliders: count, then id and value + 2 | 3 + n × 6 |
| pose, aura, flourish, markings | 2 + 3 + 3 + 4 |
| sigil frame, charge, division | 3 + 5 + 3 |
| pronoun | 2 |
| name, epithet, title (UTF-8, byte length first) | each 7 + 8 × bytes |
| myth override flag, then its UTF-8 | 1 (+ 10 + 8 × bytes) |
| CRC-16 | 16 |

Measured with the prototype (`calc/sharecode.mjs`): a Pyre Lord named "Vulkra the Unburnt,
Lord of Cinders" encodes to 78 characters,
`FM1-EAQAIEAbYBBkEIQJWyDRWkR2DKzq2NbkwlujQykCq3MTq5NzoemN7kyEDezECG0tzIyuTmA5EQ`; without
identity text 35 characters; with long names and a 120-character custom myth 268. A one-letter
typo fails the checksum. On import, the code is decoded, then checked by `validatePretender`
and `validateLook`; a refusal names its reason ("This code was made with a newer version",
"Pyre Lord is not offered to Thornwood", "The design costs 405 of 400 points"). A
`#god=FM1-…` link that opens New Game with the god is M1-should.

### B.10 Art budget

How parts compose (docs/09 part system, battle design S4.4 `PartSet` seam):
- Each **rig** has an anchor skeleton (named points: `head`, `crown`, `back`, `handMain`,
  `tail`, `base`). Parts are authored in their anchor's local frame, so docs/09's procedural
  tweens animate every variant for free.
- The battle design's `PartId` list gains `horns`, `back`, `face` and `base`. Cosmetic variants
  are alternative textures for a `PartId`: `PartSet.build(unit, look, palette, god?)` takes the
  pretender's look and picks each slot's variant; a missing variant falls back to variant 0,
  then to the procedural part (the battle design's fallback chain).
- Tint zones keep `currentColor`: the banner in battle, the dominant pip color on the card. The
  accent channel fills a second mask (`data-zone="accent"`), the material a third.

**What M1 must ship as SVG** (Phase 11):

| Group | Files | Notes |
|---|---|---|
| Chassis bodies: 18 chassis on 9 rigs (biped god, wyrm, behemoth, avian, spirit, slab, tree, plus the bear pelt and flame forms) | about 90 parts | shared biped skeleton parts are reused; each chassis adds 3 to 6 parts of its own |
| Headgear family | 8 | cowl, circlet, mask, great helm, horned crown, crown of points, flame crown, antler crown |
| Mantle family | 6 | long cape, tattered, banner cape, ember mantle, leaf mantle, wolf pelt |
| Weapon finishes | 10 | 2 extra each for blade, polearm, maul, staff, fists |
| Horns | 5 | swept, crown of spines, frill, ram, antlers |
| Wings and tails | 8 | membranes 2, plumage 2, wyrm tails 2, phoenix tails 2 |
| Backs | 3 | moss, spines, crystals (Primordial and Elder Wyrm) |
| Chassis-specific variants | 27 | idol shapes, capstones, faces, bases, canopies, Colossus heads and shoulders, Phoenix crests, spirit and flame forms, pelts |
| Sigils | 22 | 6 frames, 16 charges, monoline in the docs/09 icon style |
| Awakening overlays | 2 | sleep veil, runic chains |
| **Total** | **about 180 small SVG files** | of which about 90 are cosmetic |

**Procedural (code, no SVG files):** markings (8), glyph scripts (3), aura shapes (4),
flourishes (4), banner divisions (6), sliders (5), poses (3), the blossom, heart and tongue
variants, the pip-driven glow, and every effect texture (C.1). Until Phase 11 the designer and
the replay draw the battle design's procedural placeholder parts, so Phase 9 does not wait for
art.

**Cut line** if Phase 11 runs long: drop to 2 variants on weapon finishes and horns (−8), drop
the two *should* chassis (about −10 parts and −4 variants), then drop slot 3 on chassis whose
slot 4 is procedural. Never cut a chassis below 4 slots × 3 variants (AoW4's thin-ruler lesson),
and never cut procedural items, which cost code, not art.

### B.11 Tests

- `tests/content/looks.test.ts`: every chassis has a `ChassisLookDef` with at least 4 slots ×
  3 variants; every variant resolves to a manifest entry or a listed procedural fallback;
  every preset has a valid look; swatch rules 2 to 4 (B.4); sliders at ±2 stay inside the
  portrait frame; code tables are append-only (snapshot).
- `tests/present/looks/validate.test.ts`: `validateLook` refuses unknown slots, another
  chassis's variants, out-of-range sliders and an overlong myth.
- `tests/present/looks/share.test.ts`: 1,000 random gods round-trip exactly; a flipped
  character fails the checksum; a newer version is refused with its message; an over-budget or
  foreign-realm design is refused with the validator's message.
- `tests/present/looks/random.test.ts`: `rollGod` over 1,000 seeds always validates and leaves
  under 20 points; the same seed gives the same god; locks hold.
- `tests/sim/purity.test.ts`: the sim, mapgen and AI never import `src/content/looks`.
- `tests/sim/determinism.test.ts`: two looks, equal hashes; two names, equal outcomes.
- UI smoke (cheap): compose every chassis with every variant into an SVG string without
  throwing.
