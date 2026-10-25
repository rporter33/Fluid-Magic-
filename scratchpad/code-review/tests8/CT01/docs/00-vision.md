# Fluid Magic: Vision

Fluid Magic is a single-player, browser-based grand strategy game in the lineage of
Dominions 6, played in continuous real time with Paradox-style pause and speed controls.
Players design a Pretender God, lead one of several nations, expand across a procedurally
generated province map, manage population and resources, research magic, and claim the
world's Wellsprings to ascend.

The magic system is built on five colors with the Magic: The Gathering color pie as its
design bible. Each color is an element with its own flavor, mechanics, and personality,
and the colors stand on their own rather than translating Dominions' eight paths.

## Pillars

1. **Numbers you can feel.** Population and resources are the core economy. Every province
   is a living number: people pay taxes, work the land, feed armies, and become soldiers.
   Armies that are too large starve. Provinces that are over-recruited empty out.
2. **Magic as fluid.** Mana flows from springs in the land and pools by color. Dominion
   tints provinces toward their owner's color and makes the land itself produce more of it.
   Spells cost colored pips plus generic mana, as in MTG, and mages are gated by pips.
3. **Realtime, but thoughtful.** The clock runs continuously at the chosen speed, and any
   order can be issued while paused. There is no reflex gameplay. Battles auto-resolve
   from pre-battle scripting, and a replay shows what happened.
4. **A god of your own.** Pretender design is the signature pre-game decision: choose a
   chassis, allocate color pips, set the five Scales (each an opposition between two enemy
   colors), set Dominion strength, and choose how early the god awakens.
5. **Browser friendly.** Runs in a modern desktop browser with no install. Flat 2D art,
   modest asset sizes, a deterministic simulation that is cheap to run.

## Audience and session

- Players who like Dominions, Paradox grand strategy, and MTG's color philosophy.
- A match is shorter than Dominions: roughly 45 to 75 minutes of play against AI.
- Desktop first. Touch layout is a later milestone.

## Scope ladder

| Milestone | Summary |
|-----------|---------|
| M1 (this scope) | Solo skirmish, one generated map, two mono-color nations (Red and Green), 12 units each, 10 spells per shipped color, pretender design, dominion, Wellsprings victory, simple AI, placeholder art with animations, save/load. |
| M2 | Remaining three mono nations (White, Blue, Black) with their 30 spells, forts, more pretender chassis, events, balance pass. |
| M3 | Ten two-color nations, hybrid mana costs in depth, more rituals, touch layout. |
| M4 | Multiplayer on an authoritative server (the sim is written for this from day one). |

## Naming glossary

| Term | Meaning |
|------|---------|
| Color | One of W, U, B, R, G. Internally always keyed by that letter. |
| Element names | W Radiance, U Tide, B Umbra, R Ember, G Loam. Flavor names only. |
| Mana | Colored resource produced by springs and dominion, spent on rituals. |
| Pip | One level of ability in a color on a mage or pretender. |
| Spring | A mana source inside a province. |
| Wellspring | A primordial spring that is a victory objective (the Thrones analog). |
| Dominion | A nation's spiritual influence over a province, 0 to 10. |
| Scales | Five sliders set at pretender design, each between two enemy colors. |
| Materials | The production resource (Dominions' "resources"). |
| Supply | Food available to armies in a province. |
| Commander | A unit that can lead an army and receive orders. |
| Squad | A group of identical troops under a commander. |
