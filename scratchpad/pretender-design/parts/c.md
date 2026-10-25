
---

## C. Flashy magic

### C.1 The grammar

**Look = template(primitive) × verb and shapes(color) × material(element) × tier(level,
breadth) + flourish(the god, cosmetic).** The template fixes the beats and the primary shape;
the color fixes motion, shapes, light model, palette and symbol; the element fixes the impact
material and the decal; the tier fixes duration, particle and screen budgets; the flourish
decorates the god's charge and never changes timing or tier. A spell or ability without a
storyboard still gets a correct look on day one, which covers every M2 spell before it is
storyboarded (research-vfx 3.1).

Why: Total War names its spell types by shape (missile, wind, breath, vortex, augment, hex)
([alcasthq](https://alcasthq.com/warhammer-lore-of-fire-magic-type)), and a spell that looks
like a vortex but is direct damage misleads players
([guide](https://steamcommunity.com/app/364360/discussions/0/351660338685393106)); Riot's rule is
"visual impact should represent gameplay impact"
([VFX style guide](https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/));
AoW4 players noticed animations that were the same "with a different color palette"
([forum](https://steamcommunity.com/app/1669000/discussions/0/3828666283438110304/)). So each
color gets its own motion, not only its own tint, and each primitive its own shape.

**Colors** (palettes from docs/09; verbs from docs/09's animation section; M2 colors defined
now so their spells look right when they arrive).

| | W Radiance | U Tide | B Umbra | R Ember | G Loam |
|---|---|---|---|---|---|
| Primary verb | radiate (straight lines from a center) | ripple (rings) | sink (down, drips, falling smoke) | rise and flicker | spread along the ground |
| Secondary verbs | descend, ring | refract, freeze, arc | drain toward the caster, wither | burst, jitter, shimmer | grow with overshoot, branch, erupt from below |
| Shapes | rays, perfect circles, rosettes, four-point sparkles | concentric rings, sine waves, hex shards, mist sheets | drips, tendrils, inward spirals, cracks | jagged flames, sparks, embers, smoke columns | curves, roots, vines, leaves, petals, spores, bark |
| Light model | emissive, additive; warm white body, gold rim | emissive, additive; displacement at tier 2+ | absorptive: multiply blots, desaturation, violet rim (`#C9A6EA` derived for dark ground) | strongly emissive, additive; orange-gold core, char smoke | matter, normal blend; only heals glow |
| Body / dark / light steps | `#F3E6B8` / `#D9B85C` / `#FFFFFF` (tier 3 only) | `#3A7BD5` / `#1E3F7A` / `#9ED8FF` | `#3D2B4F` / `#1A1024` / `#9B4DCA` | `#FD6533` / `#7A1E12` / `#FFB347` | `#00674B` / `#244F22` / `#A6D96A` |
| Decal | gilded ring fading over 2 s | rime, wet sheen | rot stain | scorch, cinders, craters | grass tufts, flowers, root scars, leaf litter |
| Signature moment | the sun column | the ripple lens | the drain | the burst | the eruption from a ground crack |
| Cue without hue | ray geometry and the sun-disc glyph | rings and the wave glyph | downward motion, grey-out, the skull-drop glyph | upward sparks and the flame glyph | ground-hugging motion and the leaf glyph |
| Sound family (battle design) | `spell.W.*`: shimmer, bell, choir | `spell.U.*`: swirl, splash, ice | `spell.B.*`: sub drone, whisper, hiss | `spell.R.*`: crackle, roar, fwoomp | `spell.G.*`: rustle, creak, crack, bloom |

Every primary shape carries a 1 to 2 px keyline by docs/09's `keylineFor(ground)`: with it,
contrast is at least 4.53:1 on every terrain fill, the parchment and the dark UI, while
several palette steps alone fall below 3:1 (computed in research-vfx 2.5). Holy (the priests'
Bless, the prophet) uses the Radiance palette with light from above and the bell.

**Elements** (impact material; the sim's elements have no rules effect in M1).

| Element | Owner | Impact | Kill | Decal | Map form |
|---|---|---|---|---|---|
| fire | R | ember sparks, orange flash, smoke wisp | blackens and burns out | scorch ring; crater for meteors | ash and embers fall over the polygon, then a scorch texture |
| nature | G | splinters, leaves, thorn spikes | impaled on thorns | thorns 2 s, leaf litter | brambles sweep across the polygon |
| cold | U (M2) | ice shards | freezes, then shatters | rime | sleet, then a frost rim on the borders |
| holy | W (M2) | white flare, straight rays | burns white from within | ash outline | rays sweep across from above |
| decay | B (M2) | green-black ooze | withers and sinks | dark stain | a stain creeps out from the center |
| physical | — | sparks or blood by material and blood type (battle design S2.9) | by death style | as the battle design | dust |

**Templates by primitive** (battle; the first effect of a spell or ability picks the template,
later effects add their marks).

| Primitive | Template | Primary shape | The truth it shows |
|---|---|---|---|
| `damage` single | bolt | a straight or lobbed projectile with a trail | one troop; armor piercing: a spark exits behind the target; zero damage: grey "0" and a fizzle |
| `damage` squad | engulf | a ring under the block, the material wrapping every sprite | every troop of the group |
| `damage` area(n) | burst (n < 10) or rain (n ≥ 10) | a footprint ellipse around the struck sprites | exactly the n troops the sim chose |
| `buff` | aura | material flows from the caster to the targets; a per-stat mark (battle design S2.10) | exactly the buffed groups; the duration as a chip |
| `debuff` | curse | material clings to the targets | dissolves at `expire` |
| `heal` | restore | rising motes and "+n" on wounded sprites; cleansed curses turn into the healer's material | only the healed groups |
| `summon` | arrival | a portal by color, then the block forms | the summon's count and row |
| `fatigueDrain` | siphon | threads from the drained caster to the spell's caster | the enemy caster(s) drained |
| `moraleShock` | terror | a shock ring; targets cower | the check that follows |
| `fieldEffect` | field | storm, fog, or a wall in the caster's color | one of each kind at a time |
| breath weapon | breath | a cone (Total War's breath shape) | the volley's targets |

**Tiers.** Tier by level: levels 1 to 2 are tier 1, 3 to 4 tier 2, 5 to 6 tier 3; plus one for
an area of 5 or more, all friendly or all enemy groups, or a field effect; at most 3.
Abilities count as level 1, so Fear (all enemy) is tier 2; a storyboard may raise an ability to
tier 2 (the battle-start summons, Rising Briars), never to 3. Divine is reserved for the god's
own moments. The M1 spells: Ember Dart 1, Thorn Spray 1, Bark
Skin 1, Bless 1; Fireball 2, Warcry 2, Blood Fury 2, Entangle 2, Swarm 2; Pyre Storm 3,
Regrowth 3. **Budgets follow the battle design where it speaks** (decision P7, P8):

| | Tier 1 | Tier 2 | Tier 3 | Divine |
|---|---|---|---|---|
| Full form duration (short form) | ≤ 1.3 s (0.8) | ≤ 2.0 s (1.4) | ≤ 3.2 s (2.2) | ≤ 4.0 s, no short form |
| Particles at High (Medium ×0.5, Low ×0.2, reduced motion ×0.3) | ≤ 80 | ≤ 160 | ≤ 300 per burst, ≤ 500 at once | ≤ 600 |
| Full-scene flash | only if level ≥ 3 (0.15 at release, Full) | same | same | ≤ 0.35, through the limiter |
| Shake (trauma) | ≤ 0.05 | ≤ 0.30 | ≤ 0.70 in total | ≤ 0.60 |
| Filters (full-view passes: ≤ 2 High, ≤ 1 Medium, 0 Low) | none | shockwave on explosions, High only | shockwave, heat shimmer, world grade | grade, desaturation |
| Camera | none | none | push ≤ 1.12 | push 1.25, slow motion 0.2x |

Flashes and tints are never a saturated red (R/(R+G+B) < 0.8; every docs/09 palette step passes,
computed in research-vfx 2.6; WCAG's red-flash rule:
[W3C](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)).

### C.2 Fitting the battle cue and timeline model

The battle design builds one timeline of cues in story milliseconds (S2.11). This draft adds
no cue kinds; it adds content and one stored event.

- **`SpellLookDef`** in `src/content/presentation/looks/spells.ts`, keyed by spell id **and by
  ability id**: template, tier, particle presets per beat, decal kinds, sound recipe ids, and an
  optional storyboard override. `spellLookFor(id)` derives a default from the effects when no
  entry exists (battle design S2.2 fallbacks).
- **Cues used**: `spellBeat` (charge, release, travel, impact, linger; form full, short or
  brief), `burst` (preset, count, seed), `flash`, `camera` (trauma, zoom, dim, desaturate),
  `floater`, `chip`, `aura` and `auraEnd`, `material`, `spawn`, decals, and `slows` and `holds`.
- **Abilities** arrive as the new stored event `ability` (N1). The script builder treats it as a
  `cast` with no fatigue and no mana bead; the detail sink (battle design S1.4) emits
  `spellHit` for ability damage as it does for casts. Repeated `eachRound` abilities use the
  `brief` form (0.4 s) after their first full play, and count as casts in the pacing chain
  (battle design S2.7: a phase's casts beyond 5 s drop to 0.3 s).
- **Persistent marks** (blessing rings, the god's aura, Avatar, Iron Will) are `aura` cues at
  the intro, folded into keyframes, so seeking stays exact.
- **New particle presets** (`content/presentation/particles.ts`): `ember.gather`,
  `ember.vortex`, `ember.lick`, `loam.motes`, `loam.leaves`, `loam.petals`, `loam.dirt`,
  `hornet.boil`, `radiance.motes`, `umbra.ripple` (multiply), `pip.motes.<color>` (five).

### C.3 The eleven M1 battle spells

Durations and trauma equal the battle design's S2.10; this section adds the layer, sound and
reduced-motion detail. Times are story ms at 1x, full form; the short form scales the charge
by half and trims the linger. "RM" is reduced motion (battle design S2.14: no shake, camera,
hit-stop, slow motion or full-scene flash; particles ×0.3; projectiles still fly).

**Ember Dart** (R, level 1, tier 1, bolt; 900 ms, short 600)
- Beats: charge 0–350 (24 embers gather at the staff tip, flame glyph above the caster);
  release 350–400 (40 wu ring, 4 wu recoil); travel 400–600 (a flame bead, flat streak, 60 wu
  trail); impact 600–680 (two-frame white core, 16 sparks; armor piercing: a spark exits behind
  the target); linger 680–900 (6 smoke wisps).
- Particles ≤ 50. Light: additive bead and core. Screen: trauma 0.03; no flash. Decal: scorch
  dot 12 wu; a kill burns out.
- Sound: `spell.R.charge` from its offset, `spell.R.release` −3 dB, `dart.flame.fly`,
  `hit.burn`; a kill adds `elem.fire.ignite` and a burning cry.
- RM: the bead flies without trail flicker; sparks ×0.3.

**Fireball** (R, level 2, area 5, tier 2, burst; 1900 ms, short 1300)
- Beats: charge 0–700 (an orb grows from 4 to 14 wu at the staff; 60 embers spiral in;
  footprint ellipses under the 5 struck troops for the last 250 ms); release 700–760 (60 wu ring,
  6 wu recoil); travel 760–1310 (a lob with a 120 wu apex, 90 wu rope trail, 20 trailing sparks);
  impact 1310–1450 (white core 2 frames; 140 wu ground ring; 40 embers, 30 sparks, 20 smoke);
  linger 1450–1900 (embers rise 1.5 s; smoke 2 s under the next cues).
- Particles ≤ 150. Distortion: shockwave radius 140 wu (High only; otherwise an expanding ground
  ellipse sprite). Heat shimmer over the scorch for 1.5 s (High only). Screen: trauma 0.30; no
  full-scene flash (level 2). Decal: scorch 120 wu. Kills are thrown and burn out.
- Sound: `spell.R.charge` (0.7 s), `spell.R.release`, `spell.R.travel` for the lob,
  `spell.R.burst` at the center with its duck, `hit.burn` per sprite, cries, `spell.R.linger` for
  2 s.
- RM: no shockwave (ellipse), no shimmer, no shake; the orb still lobs.

**Warcry** (R, level 2, all friendly, tier 2, aura; 1300 ms)
- Beats: charge 0–300 (the caster swells ×1.04; a carried-mana bead with the flame glyph leaves
  its mana chip); release 300–360 (red-orange ripple ring); travel 360–960 (a ground band crosses
  its own side; each squad's weapons rise and banners flare as it passes); impact: "+2 MOR"
  chips staggered with the band; linger 960–1300 (40 ember flecks rise from banners).
- Particles ≤ 60. Mark: banner glow (morale buff) for the battle. No trauma, no flash.
- Sound: the caster's `vox.shout`, `chant.<nation>` (level by troops), `drum.<nation>`,
  `spell.R.buff` −8 dB.
- RM: the band fades in over 200 ms without sweeping; chips unchanged.

**Blood Fury** (R, level 3, one squad, tier 2, aura; 1400 ms)
- Beats: charge 0–400 (three tendrils, rope, flow from the caster to the squad); release 400–460
  (full-scene flash 0.15 in `#FFB347`); impact 460–900 (veins rise over the sprites); linger
  900–1400 (veins pulse at 1.2 Hz for the battle; chip "+2 ATT +3 STR −2 DEF", the last in the
  bad tone).
- Particles ≤ 40 (warm motes in `#FD6533` and `#7A1E12`, never saturated red).
- Sound: `heartbeat` twice as pre-roll 0.6 s before the release, `fury.swell` on the squad,
  `spell.R.buff` −6 dB.
- RM: no flash; veins static.

**Pyre Storm** (R, level 5, area 12, tier 3, rain; 3200 ms, short 2200)
- Beats: charge 0–1300 (world dims 30% by the world `ColorMatrixFilter`; a 200-particle vortex
  gathers above the target row; camera push to 1.12×; footprint ellipses under the 12 struck
  troops for the last 250 ms; carried-mana bead); release 1300–1360 (full-scene flash 0.15 in
  `#FFB347`); impacts 1600 + 90 k ms for k = 0 to 11 (each a meteor streak of 120 wu with an
  8-particle trail, then a 24-particle burst and a 30 wu crater); slow motion 0.6x over the
  first three impacts; linger 2590–3200 (burning patches, 60 rising embers; burning ground 4 s
  under the next cues).
- Particles: ≤ 500 at once. Distortion: shockwave on the first and last meteor (High); heat
  shimmer over the burning ground (High). Screen: trauma 0.12 per meteor, 0.70 in total.
- Sound: `spell.R.charge` (1.3 s) with `charge.rumble` −6 dB under it, `spell.R.release`,
  `meteor.whistle` 0.25 s before each impact, `explosion.small` at each impact (at most 6 at
  once), `spell.R.linger` at two points.
- RM: a static vignette replaces the dim ramp; no camera, slow motion, flash or shake; meteors
  still fall, without trails.

**Thorn Spray** (G, level 1, area 3, tier 1, burst; 1200 ms, short 800)
- Beats: charge 0–350 (green motes spread from the caster's feet along the ground; leaf glyph);
  release 350–400 (ground ring); travel 400–700 (a crack runs along the ground to the target
  row: a rope with a crack texture on the ground plane); impact 700–850 (thorn spikes erupt
  under the 3 struck troops, growing with overshoot; 12 splinters and leaves each); linger
  850–1200.
- Particles ≤ 60. Normal blend (matter). Screen: trauma 0.03. Decals: thorns stay 2 s, leaf
  litter. Kills are impaled.
- Sound: `spell.G.charge` (0.35 s), `spell.G.travel` for the crack, `thorns.erupt` under each
  struck sprite, flesh layers.
- RM: the crack fades in without running; spikes appear without overshoot.

**Bark Skin** (G, level 2, one squad, tier 1, aura; 1200 ms)
- Beats: charge 0–300 (a 16-leaf spiral at the caster); release 300–340; travel 340–500 (leaves
  drift along the ground to the squad); impact 500–1100 (bark creeps up the sprites by a mask
  wipe from the feet); linger 1100–1200 (chip "+3 PROT").
- Particles ≤ 40. Mark: plating overlay in bark; the squad's material becomes bark, so
  deflections now throw wood chips (battle design S2.2).
- Sound: `spell.G.charge` short, `bark.grow`; deflections on the squad play `arm.bark`.
- RM: bark fades in over 200 ms.

**Entangle** (G, level 3, one enemy squad, tier 2, curse; 1400 ms)
- Beats: charge 0–450 (earth cracks spread from the caster); release 450–510 (full-scene flash
  0.15 in `#A6D96A`); travel 510–800 (a crack runs to the target block); impact 800–1100 (roots
  burst and coil up the sprites, rope vines; chip "−3 DEF −1 ATT" with a 5-round countdown);
  linger 1100–1400 (stance `entangled`: lunges halved).
- At `expire`: the vines brown and fall in 600 ms (`auraEnd`).
- Particles ≤ 40 (dirt, leaves). Decal: root scars.
- Sound: `spell.G.charge`, `roots.burst`, two or three `vox.effort` from the struggling block;
  at `expire`, `expire.soft` and a short `spell.G.curse` tail −10 dB.
- RM: no flash; vines static; the wither is a fade.

**Swarm** (G, level 4, summon, tier 2, arrival; 1800 ms)
- Beats: charge 0–600 (buzzing swells; ground hum; carried-mana bead); release 600–700 (ground
  split, a 60 wu crack decal, earth ring; full-scene flash 0.15 in `#A6D96A`); impact 700–1500
  (200 hornet dots boil out of the crack on closed-form swirls and coalesce into the block, 12
  dots per sprite); linger 1500–1800 (badge "20").
- Effect particles ≤ 40 (dirt). The 200 boiling dots are the swarm rig's own dots (battle design
  S4.4: 12 per sprite), not effect particles. Trauma 0.10.
- Sound: `spell.G.charge`, `swarm.erupt`, then the `buzz.swarm` loop bound to the squad.
- RM: no flash; the dots fade in at their places over 300 ms.

**Regrowth** (G, level 5, all friendly squads, tier 3, restore; 2000 ms)
- Beats: charge 0–800 (soil light wells up under the caster; 60 green-gold motes rise slowly; the
  world brightens 8% by the world grade; carried-mana bead); release 800–860 (full-scene flash
  0.15 in `#A6D96A`); travel 860–1660 (a green band crosses its side; flowers sprout as it
  passes); impact as the band reaches each squad ("+n" floaters; curses dissolve into petals, 20
  per cleansed squad); linger 1660–2000 (petals drift).
- Particles ≤ 300 (motes, petals). Decal: flowers. Heal light: the only glowing Loam effect.
- Sound: `spell.G.charge` (0.8 s), `spell.G.heal` as the band passes, `regen.tick` per healed
  squad (at most 4).
- RM: no brightening ramp (a static tint), no flash; the band fades in; flowers appear.

**Bless** (holy, priests, tier 1, aura; 1000 ms, short 600)
- Beats: charge 0–300 (a sun disc over the priest); release 300–340 (bell); travel 340–540 (a
  column of gold light descends on the squad: additive trapezoid quads with a vertical gradient);
  impact 540–700 (a gold halo ring on the ground); linger 700–1000 (chip "+1 MOR"; banner glow
  mark).
- Particles ≤ 30. Decal: a gilded ring fading over 2 s.
- Sound: `bless.chime` (full form the first time a priest blesses in a battle, then the bell
  alone).
- RM: the column without flicker.

### C.4 Rituals on the map

The battle design covers battles only, so the map gets its own small pipeline, pure like the
battle one:

```ts
// src/present/map/fx.ts (pure; guarded with src/present)
export type MapTemplate =
  | 'channel' | 'stream' | 'portal' | 'wash' | 'stitch' | 'blight' | 'rainOver'
  | 'eye' | 'kindle' | 'flow' | 'fizzle' | 'awaken' | 'reform' | 'anoint' | 'flip';
export interface MapCue {
  key: string;                       // message id plus role: stable, seeds every random choice
  template: MapTemplate;
  province: ProvinceId; to: ProvinceId | null;
  color: Color | 'holy'; spell: string | null;
  tier: 1 | 2 | 3 | 'divine';
  /** Real milliseconds, full form. */
  dur: number;
  card: { title: string; subtitle: string; sigil: boolean } | null;
}
export interface MapMark {           // persistent, while a province effect lasts
  province: ProvinceId; kind: 'badge' | 'overlay' | 'border'; spell: string; color: Color; untilDay: number;
}
export function planMapFx(newMessages: readonly Message[], state: GameState, viewer: NationId,
  view: { speed: 0 | 1 | 2 | 3 | 4; reducedMotion: boolean }): MapCue[];
export function mapMarks(state: GameState, viewer: NationId): MapMark[];   // from provinceEffects within vision
```

- **One optional sim addition** (research-vfx 3.8, adopted, Phase 8): `Message.fx?: { kind:
  'ritual' | 'awaken' | 'reform' | 'anoint' | 'summon'; spell?: string }`, set by rituals, the
  pretender's arrival and return, `makeProphet` and the monthly summon; and when a ritual
  completes on a province owned by another nation and it has `remoteDamage`, `provincePop` < 0,
  `provinceUnrest` > 0 or `provinceSupply` < 0, a `ritual` message to that owner ("Ash Rain
  struck Ember Ford."). Deterministic; no outcome changes; the state hash changes, so the
  determinism fixtures are regenerated in that commit, and the rule is recorded in docs/02.
- **Time**: map effects play in real time, independent of game speed. At speeds 3 and 4 they
  use a brief form (40% of the duration, no card). More than 4 at once: the rest show only their
  persistent mark. While paused, they play.
- **Vision**: the caster's nation sees its own; a rival sees an effect only in provinces it can
  see (`visionOf`), and never a target or a name before the ritual lands. Victims see hostile
  rituals through the new message.
- **Channeling**: a rotating ground sigil under the caster's marker (the mana symbol at the
  center, the god's sigil three times on the rim) and a progress ring `1 − daysLeft/castDays`.
  For a targeted ritual, a stream (rope with a scrolling dash texture) runs along the path to
  the target for the caster's nation only. Rivals who see the caster see the sigil only.
- **Fizzle**: the sigil cracks and fades in a grey puff (0.8 s).

| Ritual | Template, tier | Full form | What plays | What stays while it lasts | RM |
|---|---|---|---|---|---|
| Call Fire Sprites (R1) | portal, 1 | 1.6 s | a ring of fire on the ground (60 embers); five sprites flare out and settle into the army badge, whose count ticks +5 | — | the ring fades in; the badge ticks |
| Forge of Cinders (R2) | wash, 1 | 1.8 s | ember light blooms at the fort icon; 30 anvil sparks; a warm wash at 0.15 alpha over the polygon | ember glyph on the fort with a months ring (6) | static bloom |
| Burn the Fields (R3) | blight, 2 | 2.4 s | a jagged flame front, masked to the polygon, sweeps in from the caster's side; three smoke columns; floaters "−6% pop", "−50% supply", "+15 unrest" | a charred-field hatch overlay for 3 months, and a badge | the overlay appears in 0.3 s; floaters |
| Bind Salamander (R4) | portal, 2 | 2.4 s | a fire fissure opens; the salamander's marker crawls out; a name card | — (its marker) | fade-in and card |
| Ash Rain (R6) | rainOver, 3 | 3.0 s | the polygon dims 30%; 300 ash flakes and embers fall inside it; each army marker there flashes one white frame and floats "−N troops"; "+25 unrest" | an ash-grey tint fading over 30 days (presentation only), and a badge | no fall; the tint and floaters appear |
| Call of the Wild (G1) | portal, 1 | 1.6 s | the ground splits in a leaf burst (40); wolf silhouettes bound into the badge, +6 | — | fade-in |
| Fertile Season (G2) | wash, 1 | 1.8 s | sprouts spread from the center to the borders; the fill brightens 8% | a faint green sheen and a leaf badge with a months ring (6) | sheen appears in 0.3 s |
| Awaken Treant (G3) | portal, 2 | 2.4 s | roots heave; a sapling shoots up and becomes the Treant's marker; a name card | — | fade-in and card |
| Bounty of the Loam (G4) | wash, 1 | 1.8 s | a golden wheat shimmer ripples across the polygon; the materials glyph pulses | a wheat badge with a months ring (6) | static shimmer |
| Rootwall (G5) | stitch, 2 | 2.0 s | thorn vines grow clockwise along the inner border | the thorn border at 0.35 alpha and a shield badge (12 months) | the border appears |

The ritual panel's target hover (UI spec 3.5) previews the template at 30% intensity on the
hovered province (research-vfx 3.11).

**Budgets on the map**: at most 1 ms CPU and 1.5 ms GPU per frame for effects; particles per
cue ≤ 80, 150 or 300 by tier; one stencil mask per wash; persistent marks are static textures;
the map ticker stops while the replay modal is open (battle design S6.1).

### C.5 The pretender and the prophet

**Mechanics that show** (automatic; no look can remove them).

| Mechanic | Mark | Where |
|---|---|---|
| Pips | aura motes split by pip count, each moving in its color's verb (a R4 G2 god shows rising embers and ground-hugging motes 2 : 1); the mana-symbol row | card, preview, battle, map marker |
| A blessing color (any chosen effect of it) | a thin ground ring with that color's symbol at its front, on every blessed unit (sacreds, the prophet, the god with Avatar) | battle (from the intro), card |
| An incarnate blessing | a small crown notch on its ring; while the god is away the ring is drawn dashed (inactive) | battle, card |
| 6 pips in a color | its symbols orbit the god | card, preview, battle |
| Dominion | candle count; aura radius | card, map |
| Awakening | dormant: closed eyes, slow breath, dim aura; imprisoned: runic chains | card, preview |
| Body tags | wings, roots, flicker, embers, regeneration motes, thorns | everywhere |
| Iron Will | the god's banner never droops; "FEARLESS" in its dock | battle |

**Abilities in battle** (N1 events; cue lists in the battle design's vocabulary).

| Ability | Tier, form | What plays | Sound | RM |
|---|---|---|---|---|
| Fear (Primordial, battle start) | 2, 1.2 s | the god rears; a dark multiply ripple rolls across the enemy side (ground band 0.6 s); enemy banners droop (morale debuff mark); "−2 MOR" chips; 40 dust motes; trauma 0.15 | `roar.primordial` (new), `shock.morale`, `crowd.murmur` on the enemy side | a 200 ms darkening; chips |
| Heat Aura (Living Flame, each round) | 1; 0.9 s first, then brief 0.4 s | a heat haze band over the enemy front (High: local displacement; else an additive orange haze); 6 ember licks on the struck troops; burn floaters; kills burn out | `aura.heat.tick` (new), `elem.fire.sizzle` per struck (at most 3) | static haze, licks |
| Rising Briars (Briar King, battle start) | 2, 1.0 s | Entangle's storyboard in its brief form | `roots.burst` | as Entangle |
| Kindle the Host (Pyre Lord, battle start) | 2, 1.2 s | the glaive sweeps an arc of fire (rope arc); six sprites ignite along it (`spawn` style `ember`) and form their block | `summon.sprites.ignite` (new), then the sprites' flicker loop | sprites fade in along the arc |
| Call the Hunt (Horned Hunter, battle start) | 2, 1.4 s | the god raises a horn; eight wolves bound in from its flank edge with dust (`spawn` style `step`) | `horn.hunt` (new), two `wolf.howl` | wolves fade in at the block |
| Fire shield, thorn shield | — (per phase) | sparks or splinters jump to each striker that dealt damage; "−n" | `fire.shield`; thorns: `thorns.erupt` −10 dB | unchanged |
| Regeneration | — (end of round) | green motes and "+n" | `regen.tick` −20 dB | motes ×0.3 |

**Cosmetic, the god's own** (look only; inert).
- **Idle aura**: the chosen shape, colored by pips, alpha ≤ 0.35 above units (research-vfx
  2.4), counted in the battle design's aura pool (64).
- **First-cast flourish**: on the god's first cast of each battle, inside the charge beat only:
  sigil wheel (its sigil turns on the ground), mantle (a cloak of the dominant color's material:
  embers, leaves, light, mist or smoke), halo burst (a ring of symbols snaps outward at release),
  or ascension (the god lifts 6 wu and settles). At most 60 extra particles, within the tier.
  The god's Ember Dart is still tier 1 (Riot's hierarchy rule).

**Divine moments.**
- **Awakening** (a dormant god on day 330, an imprisoned one on day 1050; docs/05): at the
  capital, 2.5 s for its owner (divine), 1.2 s tier 2 for rivals who see the capital. Ember: the
  ground cracks in a ring and a fire geyser rises, embers rain. Loam: the ground splits, roots
  heave, a crown of leaves bursts. M2: Radiance a sun column, Tide a waterspout, Umbra shadows
  pooling and something rising. An imprisoned god's runic chains shatter first (0.5 s). Then the
  marker appears with a name card (sigil, name, epithet, title). An edge pointer pulses if the
  capital is off-screen; the map camera never moves by itself. RM: a fade and the card.
- **Undying** (N8): where it dies, its ashes stream along the path to the capital (1.5 s,
  tier 2); on its return day a pyre (or the color's verb) ignites at the capital and the god
  rises (2.0 s, tier 2) with "Vulkra rises again". In the battle replay, the god's death plays
  the battle design's god death, the body bursting into flame, and the card adds "…and will
  rise again" when the state shows a return day.
- **The god falls** (battle design S2.8): slow motion 0.2x for 2.0 s, the field desaturated,
  "THE GOD FALLS", trauma 0.6; the body dissolves into its dominant color. Per chassis, beyond
  the six the battle design lists: the Ascended Hero falls with its blade upright; the
  Primordial topples and the ground shakes three times; the Phoenix bursts into flame; the
  Pyre Lord's glaive gutters out; the Cinder Idol's braziers die and it crumbles; the
  Hierophant's mask cracks; the Living Flame gutters to smoke; the World Tree splits and
  topples; the Horned Hunter's antlers fall; the Elder Wyrm sinks; the Mother of Beasts' wolves
  howl; the Briar King's thorns wither.
- **The bless unlock** (designer): when a color reaches 4 pips the ring forms with its symbol
  (0.9 s, `bless.chime`); at 6 its symbols start to orbit; an incarnate pick adds the crown
  notch; a boon pick plays a small sign (Avatar: the god's ring lights; Undying: an ember
  stream; Iron Will: its banner snaps taut).

**The prophet.**
- **Anointing** (map, tier 2, 1.8 s, `Message.fx` 'anoint'): a beam in the god's dominant color
  runs from the capital to the prophet's province, and a halo settles on its marker; the badge
  keeps a small halo glyph.
- **In battle**: a holy halo of soft rays (Radiance palette, alpha 0.3) over the prophet, the
  nation's blessing rings (it is blessed), and its Bless casts use the Bless storyboard. Its
  death is a commander death with "The prophet has fallen" and the halo shattering.
- **Dominion**: on the monthly spread, provinces whose strength rose kindle a candle (0.4 s),
  at most 8 visible per month, the rest instant; a province whose dominating nation changed
  gets the flip pulse (a ring from the center).
- **Monthly summons** (N7): a small portal at the pretender's province, tier 1, 0.8 s.

### C.6 Sound hooks

- **Battle** (M1, the battle design's S3b families): every cue above names a recipe from the
  sound proposal's tables, plus four new recipes, in its notation:

  | Id | Bus | kHz | Length | Variants | Recipe |
  |---|---|---|---|---|---|
  | `aura.heat.tick` | spell | 32 | 0.5 s | 3 | low roar P > LP 400>900, AM 6 Hz + crackle G(150/s) @-6; plays −10 dB under impacts |
  | `summon.sprites.ignite` | spell | 32 | 1.2 s | 2 | six ignitions (P burst > BP 800>3000, 30 ms each, 120 ms apart) + `spell.R.release` @-6 |
  | `horn.hunt` | stinger | 32 | 1.8 s | 2 | brass model D3 gliding to A3, breathy, no drive |
  | `roar.primordial` | voice | 24 | 1.6 s | 2 | V(f0 [55,70], u>o>a, tract 1.6, drive 4, subharmonic 0.5) + B rumble @-6 |

- **Designer** (M1-should): Cast, Showcase and the bless unlock play the baked battle recipes on
  the battle SFX bus; no new recipes.
- **Map** (M2, decision P10): ids reserved, `map.ritual.<color>.<template>`,
  `map.awaken.<color>`, `map.anoint`, `map.reform`; ducked under music, silent at speeds 3 and 4.
- **Captions**: every divine moment and ability with a sound has a caption (battle design
  accessibility).

### C.7 Tests

Pure (Vitest):
1. `spellLookFor` returns a look for every spell and every ability in content; the computed tier
   matches C.1's table.
2. Each M1 spell's built timeline: beats sorted and within the C.3 durations (full and short);
   particle counts within the tier; a full-scene flash only when the level is 3 or more; trauma
   within the tier cap; filter cues only on tier-2 explosions and tier 3.
3. Abilities: Fear yields one chip per enemy group and no second; the heat aura's later rounds
   use the brief form; battle-start summons spawn exactly the event's count.
4. Reduced motion: no camera, shake, slow-motion or full-scene flash cues; impacts keep their
   times (the battle design's invariant).
5. `planMapFx`: deterministic; nothing for a rival's ritual outside vision; a cue for a hostile
   ritual on the viewer's province; at most 4 at once; the brief form at speeds 3 and 4.
6. Red-flash rule over every flash and tint color in presentation content.
7. Cosmetic inertness: two looks give identical cue times and strike sets; only flourish and
   aura art differ.
8. Truth: impacts on the sim's targets; a mana bead cue for spells with carried mana; a fizzle
   for zero damage.

Playwright (battle lab, battle design S5): a fixture per new ability (`primordialFear`,
`livingFlameHeat`, `pyreLordKindle`, `hunterCall`, `briarKing`) renders non-blank at its impact;
the Pyre Storm fixture stays within the particle cap and filter-pass budget at High.
