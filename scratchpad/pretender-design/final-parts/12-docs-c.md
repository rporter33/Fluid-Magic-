
### `docs/09-art-direction.md` (lands in Phase 9 and Phase 10; the SVG lines in Phase 11)

**Sprite system, in the archetype list, replace "pretender bodies (oracle, titan, wyrm,
monolith, spirit, colossus)" with:**

```markdown
pretender bodies, one archetype each on the shared rigs (oracle, titan, wyrm, monolith, spirit,
colossus, ascended hero, primordial, ash phoenix, pyre lord, cinder idol, ember hierophant,
world tree, horned hunter, elder wyrm, mother of beasts)
```

**Replace the section "Pretender chassis art" with:**

```markdown
## Pretender chassis art

Added on 2026-10-21 at the owner's direction ("a customization level matching Age of Wonders 4
would be very ideal").

Each chassis is drawn on one of the shared battle rigs (biped, quadruped, serpent, treant,
wyrm, slab, spirit); no chassis needs a rig of its own. Its portrait is not a separate file:
it is the chassis's own parts in the rig's portrait pose, at 128 px on the summary card, 256
px in the designer and 64 px in the battle docks, so every appearance choice shows on the
card. Each chassis has one portrait detail layer (face lines, eyes, engraving) drawn for 256
px and hidden below 128 px. The summary card tints the tint zone by the dominant pip color and
shows a mana-symbol row beneath.

Parts that carry mechanics are fixed and never offered as choices: wings on flyers, roots on
the World Tree, the Wild Spirit's flicker, the Ash Colossus's embers, the Monolith's rooted
base. A choice may change a wing's shape, never remove it.
```

**Add a section "Pretender looks" after it:**

```markdown
## Pretender looks

- **Slots**: four overlay slots per chassis, three variants each (variant 0 is the base art),
  each an overlay on one anchor of the rig: headgear, mantle or pelt, weapon head, horns,
  back, tail, crest, plumage, canopy, face, base. Variants come from shared families authored
  once in anchor space, so the rig's procedural poses move every variant.
- **Markings**: eight procedural patterns (stripes, rings, spots, banded, mottled, runic,
  veins, plain) in the accent color, three offered per chassis.
- **Colors**: three chosen channels, material (eight swatches per material family: skin,
  stone, bark, wood, scale, hide; six for ember), metal (six) and accent (eight muted tones);
  the banner, the pip tint and the glow are derived and never chosen. Every material and metal
  swatch reaches 3:1 against its keyline; every accent differs from every nation banner by
  CIEDE2000 15 (10 under simulated color blindness); swatches in a table differ by 8.
  `tests/content/looks.test.ts` enforces this.
- **Sliders**: stature, head, horns, wingspan, glow; −2 to +2; never change the size class.
- **Poses**: regal, wrathful, serene, for the portrait.
- **Aura and flourish**: a halo or orbiting motes, colored by the god's pips; a sigil wheel
  or a halo burst inside the charge of the god's first cast. Neither changes timing.
- **Mechanics show by themselves**: pips as aura motes moving in each color's verb, blessing
  rings with the color's symbol on blessed units, a crown notch for incarnate blessings,
  orbiting symbols at 6 pips, candles for dominion, closed eyes or runic chains for a sleeping
  or imprisoned god.
- **The contact sheet**: `lab/looks.html` lays out every chassis with every variant at 64,
  128 and 256 px, in light and dark backdrops and under simulated color blindness, for review.
```

**Add a section "Sigils and banners":**

```markdown
## Sigils and banners

A nation's banner color stays fixed (ownership is gameplay information). Its identity is a
sigil: a frame (roundel, shield, lozenge, sunburst, ring of thorns, broken circle) around a
charge (crown, eye, hand, tree, flame, tower, serpent, star, skull, wave, antler, key, sword,
wheel, moon, anvil), drawn monoline in the neutral that `keylineFor(banner)` picks, on a
banner division (plain, per pale, per fess, per bend, chevron, bordure). Frames and charges are
original geometric SVGs in the icon style; divisions are drawn in code. The sigil shows on
army badges, battle pennants, the summary card, name cards and ritual sigils.
```

**After the "Spell visual effects" paragraph (as the battle design rewrites it), add:**

```markdown
## Magic effects grammar

Added on 2026-10-21 at the owner's direction ("flashy magic effects is always interesting").
Every spell, ability and ritual looks like what it does: its template comes from its first
primitive (bolt, engulf, burst, rain, aura, curse, restore, arrival, siphon, terror, field,
breath), its motion and shapes from its color (Radiance radiates rays, Tide ripples rings,
Umbra sinks and drips, Ember rises and flickers, Loam spreads along the ground and erupts),
its impact material and decal from its element, and its size from its tier (level and
breadth: durations, particle counts, shake and flash budgets). The god's flourish decorates
its own casts and never changes their timing. On the map, rituals play as their own templates
(portal, wash, blight, rain over a province, stitch along a border), with a channeling sigil
while they are cast.

## Flashes and red

No flash or timed tint may be a saturated red. WCAG 2.2 counts a color as saturated red when
R/(R+G+B) ≥ 0.8 on linearized sRGB (its "relative luminance" values); Fluid Magic keeps every
flash color and every tint that reverts within a second, or pulses, below 0.78. Ember's primary
#FD6533 (0.86) and secondary #7A1E12 (0.91) are saturated red, so they color particles and
decals only; Ember flashes use its accent #FFB347 (0.66). The red hit tint uses a passing
color such as #D0605A (0.74). Pulses
run at 3 Hz or less. `tests/content/presentation.test.ts` enforces this.
```

### `docs/10-milestone-1.md` (lands in 6b.1, except where noted)

**Acceptance criteria, replace 9:**

```markdown
9. Pretender: 16 chassis in three realms (11 per nation), pips with per-chassis new-color
   prices, dominion, five scales with effects and attunement, awakening, prophet, the blessing
   menu (per-color bless points, groups, incarnate blessings; the fixed bless as its default),
   two boons, the new battle and map rules of `docs/04` and `docs/05` (battle-start abilities,
   trample, spell power, shields by element, bound squads, monthly summons, the Phoenix's
   reform), and twelve presets with looks.
```

**Acceptance criteria, add to the end of 14:**

```markdown
    Pretender portraits are composed from the same parts as their battle sprites, with every
    appearance choice visible; every spell, ability and ritual has its effect per the magic
    effects grammar.
```

**Acceptance criteria, add:**

```markdown
16. The pretender designer has six steps (Body, Magic, Realm, Blessings, Appearance,
    Identity), a live preview, presets with looks, a random god and look with locks and a
    10-roll history, saved gods, and a share code that round-trips; no look or identity field
    other than the name changes the game state (determinism test).
```

**Build order: add after "Phase 6: Pretender, dominion, Wellsprings, victory":**

```markdown
### Phase 6b: Pretender variety
- At the owner's direction ("good options for pretenders like Dominions has is always a
  highlight ... A customization level matching Age of Wonders 4 would be very ideal"), the
  pretender grows before the UI phases. The design is the 2026-10-21 pretender build spec;
  its rules are in `docs/04` and `docs/05`. Three commits, each green:
- 6b.1: realms, per-chassis new-color prices, attunement, minimum awakening, starting springs,
  the god's name, roles, AI power for the existing six; the blessing menu with the fixed bless
  as its default; the Sacred Spring and Avatar boons; one save-version step.
- 6b.2 (after the battle track's S1): battle-start abilities, multi-strike weapons, spell
  power, shields by element, bound squads; the battle presentation's record and event
  amendments.
- 6b.3: monthly summons, the Phoenix's reform, the ten new chassis and six new presets with
  their content fixtures, `sim:aivai --presets` and `--matrix`, `sim:duel` with pinned bands
  and `--calibrate`, the AI's pretender step by role.
- Tests: every rule's own tests; every existing preset's bless and cost unchanged; the battle
  goldens unchanged; determinism with each new preset.
```

**Phases 8 to 12: add a bullet to each:**

```markdown
- (Phase 8) Map spell effects: the channeling sigil and stream, a completion pulse per color,
  dominion candles and the flip pulse, the map effect pool and its limits; effect tags on
  messages and the victim's ritual message; `aiPower` in `armyPower`.
- (Phase 9) The pretender designer (`docs/07`): six steps, live preview and card, looks,
  identity, sigils, random with history and locks, My Gods, share codes; looks in the save's
  UI block.
- (Phase 10) Spell and ability looks for every spell and ability; the eleven storyboards with
  their layers, sound and reduced-motion detail; blessing rings, the god's aura and first-cast
  flourish; placeholder parts for every chassis and slot family.
- (Phase 11) The pretender SVGs (bodies of the new chassis, slot variants, portrait detail
  layers, sigils), the map ritual templates, the god's divine moments, and the looks contact
  sheet.
- (Phase 12) The preset matrix and duel bands; the cost-parity and blessing-bounds snapshots
  reviewed; AI power recalibrated.
```

**Out of scope for M1, add:**

```markdown
pretender appearance editing during a game, links that carry a god, random presets for AI
opponents, a free color picker, designer and map sound
```

**Liberties taken, add:**

```markdown
- Bless points are per color, not pooled as in Dominions, so that White, Blue and Black pips
  (which buy nothing else in M1) cannot buy Red and Green blessings.
- Iron Will (a god that never routs with its troops) was designed and measured, then left out
  of M1: it added 35 to 55 points of win rate to every god-led army.
```
