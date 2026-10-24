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
| R Ember | #D9442B | #7A1E12 | #FFB347 | flame |
| G Loam | #3F8F3A | #244F22 | #A6D96A | leaf |

Nation chrome uses primary for borders and glow, secondary for panel headers, accent for
highlights. Independents: #8C8A80 / #4A4A44 / #C9C4B0, symbol: a plain shield.

Terrain fills: Plains #B9B069, Farmland #C9BE5A, Forest #4E7B3B, Hills #9C8A5C,
Mountains #7B7B7B, Swamp #4F6B4A, Wasteland #A58C6B. A seamless noise texture at 10%
opacity is multiplied over every fill. Borders #2B2620 at 2px. The map background is a
deep parchment #E8DCC2 at the edges fading to #1C1A17 under the UI.

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
- Portraits for commanders are the same SVG cropped at 2x with a colored backdrop.

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

### Motion grammar per color

The family says what happens; the color says how it moves. Both tables apply at once.

| Color | Particle shape | Motion | Easing | Blend |
|-------|----------------|--------|--------|-------|
| W Radiance | 2 px lines radiating from center | straight outward, no gravity | ease-out | additive |
| U Tide | concentric arcs | ripple outward with a 60 ms stagger, slight horizontal sway | sine in-out | normal, 70% alpha |
| B Umbra | soft circles | sink downward and inward, slow | ease-in | multiply, then additive accent |
| R Ember | 3 px circles, size jitter 50% | rise with flicker (random x jitter per frame from the renderer's own rng, never the sim's) | ease-out, fast | additive |
| G Loam | 4 px leaves (short rounded rects) | spread outward along the ground, hugging the row line | ease-out, slow | normal |

Palette use is the same in every family: primary for 70% of particles, accent for 30%,
secondary only for the `field` fill.

### Glow

Glow is per effect, not per screen. Each effect lives in its own container with
`blendMode: 'add'` where the grammar says additive; the container gets a one-step
`BlurFilter` only for `burst` and `aura` at scale 3. No full-screen bloom, no custom
shaders in M1. Units never glow; only effects and the mana symbol of a casting mage.

### Readability rules

- Two spells of different colors in the same family must be told apart with the sprites
  hidden. Two spells of the same color in different families must be told apart with
  color removed. The effects gallery (see milestone Phase 10) exists to check both.
- Effects never cover the damage numbers; numbers draw on a layer above all effects.
- At most 3 `burst` or `field` effects play at once; further casts in the same round queue
  and play in event order so a replay stays deterministic to the eye as well as the log.
- Effect durations and particle counts are tuned in `content/fx.ts`, never in render code.

### M1 spell to family mapping

| Spell | Family | Scale |
|-------|--------|-------|
| Ember Dart | projectile | 1 |
| Fireball | burst | 2 |
| Warcry | aura | 2 |
| Blood Fury | aura | 1 |
| Pyre Storm | burst | 3 |
| Thorn Spray | burst | 1 |
| Bark Skin | aura | 1 |
| Entangle | shock | 2 |
| Swarm | summon | 2 |
| Regrowth | aura | 3 |

W, U, B spells are assigned a family when they are implemented, using the same table
shape. Battle defaults when a spell has no `fx`: damage with a single target is `strike`,
area damage is `burst`, buffs and heals are `aura`, debuffs are `shock`, summons are
`summon`, field effects are `field`.

## Icons

24x24 monoline SVG icons: gold coin, materials (anvil), supply (wheat), population
(figures), unrest (fist), each mana symbol, fort, temple, lab, Wellspring (a fountain
with five drops), scout eye, siege ram, pillage torch, research book, preach, claim.

## Pretender chassis art

Each chassis has a 128x128 SVG portrait. The summary card tints the portrait's tint
zone by the dominant pip color and shows a mana-symbol row beneath.

## Delivery rule

All art lives in `src/assets/sprites/<category>/<name>.svg`. A `manifest.ts` maps
unit type ids to sprite part names. Missing art falls back to the archetype silhouette
with a nation tint so the game never shows a broken image.
