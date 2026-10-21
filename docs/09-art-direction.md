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
opacity is multiplied over every fill. Borders #2B2620 at 2px. The map background is a
deep parchment #E8DCC2 at the edges fading to #1C1A17 under the UI.

**Distinct colors.** Every pair of terrain fills, and every pair of mana primaries
(independents included), differs by at least CIEDE2000 20 for normal vision and 12 under
simulated protanopia, deuteranopia, and tritanopia. Lightness and the blue-yellow axis,
which those players still see, carry most of the difference. `tests/content/palette.test.ts` enforces
this. The original fills failed it (Hills and Wasteland differed by 5.7, about 3 for color
blind players), as did Red and Green, the two M1 nations (6.9 under deuteranopia). Those
values were replaced: Red is brighter and more orange, Green deeper and closer to emerald.

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
