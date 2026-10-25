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

Spell visual effects: a particle burst using 12 to 40 small circles in the color's
palette with element-specific motion (Ember rises and flickers, Loam spreads outward
along the ground, Tide ripples, Radiance radiates straight lines, Umbra sinks).

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
