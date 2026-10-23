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
- For now a match is shorter than Dominions: roughly 45 to 75 minutes of play against AI.
- The ideal full session will become 15 to 20 hours (owner direction, 2026-10-23,
  `docs/design/three-kingdoms.owner-answers.md`): a long campaign where named officers,
  scenarios and a court matter. The short match ships first; the long format is a later
  milestone, and systems built now keep their data shapes open for it
  (`docs/design/three-kingdoms.md`, section 6).
- Desktop first. Touch layout is a later milestone.

## Scope ladder

| Milestone | Summary |
|-----------|---------|
| M1 (this scope) | Solo skirmish, one generated map, two mono-color nations (Red and Green), 12 units each, 10 spells per shipped color, pretender design with 16 chassis (11 per nation), a blessing menu and appearance customization, dominion, Wellsprings victory, simple AI, placeholder art with animations, save/load. |
| M1, Phase 9b (gated) | The officers prototype, proposed (`docs/design/three-kingdoms.md` Tier 1): named commanders with stats and traits, capture and prisoners, automatic duels, the god's Ascendancy with a field cap and three posts, fort governors and developments, officer proposals, comrade and grudge bonds. Built after Phase 9 and before Phase 10, played for three matches, and shipped in M1 only if the playtest says so; not an M1 acceptance criterion (`docs/10`). |
| M2 | Remaining three mono nations (White, Blue, Black) with their 30 spells, their pretender chassis and blessing menus, forts, events, deeper pretender customization (more slots and variants, a color picker), balance pass. |
| M3 | Ten two-color nations, hybrid mana costs in depth, more rituals, touch layout. |
| M4 | Multiplayer on an authoritative server (the sim is written for this from day one). |
| M5 | The long session: 15 to 20 hour campaigns built on Phase 9b's officers and court, with the record's Tier 2 (loyalty states, treaties and the coalition rule, Search, legends, ploys), scenarios, bigger rosters and an event deck (`docs/design/three-kingdoms.md`, section 6). |

The pretender's M1 scope grew on 2026-10-21 at the owner's direction: "I think flashy magic
effects is always interesting and good options for pretenders like Dominions has is always a
highlight. If it's possible. A customization level matching Age of Wonders 4 would be very
ideal." Ten new chassis, the blessing menu and the customization system moved from M2 into
M1 (Phase 6b and additions to Phases 8 to 12 in `docs/10-milestone-1.md`); the per-slot depth
that matches Age of Wonders 4 arrives in M2. The owner approved the scope change and its
cut order on 2026-10-21 (owner decision 1 in `docs/05-pretender.md`).

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
