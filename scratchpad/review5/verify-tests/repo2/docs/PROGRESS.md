# Progress

## Phase 0: Scaffold (done)

- Vite 8 + React 18 + TypeScript 6 (strict, `noUncheckedIndexedAccess`), ESLint
  (typescript-eslint `strictTypeChecked`, react-hooks), Prettier, Vitest. PixiJS 8,
  Zustand, idb-keyval, and d3-delaunay are installed but not used yet.
- Scripts: `dev`, `build`, `preview`, `test`, `typecheck`, `lint`, `format`, `sim:aivai`.
  `typecheck` runs a second pass over pure code without DOM/Node types; `lint` runs
  ESLint and `prettier --check`.
- `src/sim/rng.ts` (xoshiro128**), `src/sim/drn.ts` (open-ended 2d6), `src/sim/ids.ts`
  (counter ids with branded types), with tests for reference vectors, distribution
  sanity, determinism, and JSON round trips.
- `src/content/colors.ts` (five colors, palettes, enemy and allied pairs) and
  `src/content/terrain.ts` (seven terrains with base values and fills), checked by
  `tests/content/validate.test.ts`.
- Purity guard for sim, mapgen, and content (see the end of `docs/06-architecture.md`).
- The app shell renders a placeholder title screen.

## Phase 1: Map and provinces (done)

- `src/mapgen/`: `generateMap({ seed, size, capitals })` builds a `MapData`. Steps: Poisson
  disc sites, two Lloyd rounds, Voronoi cells via d3-delaunay clipped to a rounded rectangle,
  adjacency from shared borders, farthest-point capitals, terrain by rank from seeded
  simplex noise, Wellsprings, springs, independent strength, starting population, and
  syllable names per terrain. `validateMap` checks every rule; generation retries
  deterministically when an attempt fails it.
- `src/content/`: `mapgen.ts` (map sizes and every generation number), `names.ts` (name
  syllables), `pretenders/scales.ts` (the five scale axes; costs and effects come in Phase 6).
  `src/sim/rng.ts` gained `weightedIndex`.
- Tests: one file per mapgen module, plus end-to-end checks on 20 Medium seeds and on
  Small, Large, 3-nation, and 4-nation maps. These cover connectivity, capital spacing,
  exact province count, at least 2 neighbors, springs coverage and parity, Wellspring
  distance and separation, exact terrain shares, drawn borders matching adjacency, and
  determinism. All are measured with helpers independent of `src/mapgen`.
- An adversarial review (6 lenses, 2 skeptics per finding) confirmed 20 findings, and all
  of them are fixed. Among them: adjacency now matches the drawn borders, terrain shares
  stay exact with capitals, capitals are shuffled into nation slots, spring colors are
  dealt evenly (Green had 2.5x Red's springs), and Wellspring placement is never adjacent
  and is fair for 3-4 nations. Mutation checks confirmed that the strengthened tests catch
  each of these regressions.
- Terrain fills and the Red and Green mana colors were replaced so every pair is clearly
  distinct, also for color blind players (CIEDE2000 at least 20 normally, 12 under simulated
  protanopia, deuteranopia, tritanopia). The new values are in `docs/09-art-direction.md`,
  and `tests/content/palette.test.ts` enforces the rule.
- Generation over 200 seeds per configuration had no failures. Medium 2-nation maps take
  about 20 ms; 4-nation maps take up to about 0.4 s.

## Phase 2: Economy and population (done)

- `src/sim/types.ts` holds the full `GameState` (provinces, nations, commanders, squads,
  orders, scripts, battles with a starting roster, messages, province effects, result);
  `src/sim/battle/events.ts` holds the battle event union for Phase 4. Everything is plain
  JSON.
- `createGame(setup)` builds nations, capitals (fort, temple, lab, garrison holder,
  dominion at the pretender's score), and the starting armies from `docs/03-nations.md`.
- `advance(state)` runs one day in the documented order. Phase 2 fills step 3 with
  construction and step 4 with gold, mana, upkeep, fort materials, pillage, population,
  unrest, and supply; later phases slot into the marked steps.
- `selectors.ts` computes every rate (province and nation economy, pillage, fort
  materials, dominion score, morale penalties) and the tick applies the same numbers, from
  one snapshot per day. `scales.ts` turns pretender scales and owned Wellsprings into
  province scales.
- Content: all M1 units and both nations from `docs/03-nations.md`, buildings, per-pole
  scale effects, rule numbers (`src/content/rules.ts`), and AI difficulty income factors.
- Tests: the milestone's three (capital income on day 30, starvation drain, materials cap)
  plus every formula in `docs/01-core-rules.md` sections 3 to 7 with expected values
  computed in the test, scales rounding and clamping, upkeep shortfalls, healing,
  pillage, construction and builder release, the message cap, and determinism: the same
  seed twice, and a save and load in the middle of a busy 4-nation game.
- A design review of the types and a code review of the implementation (multi-lens, two
  skeptics per finding) were applied. The code review confirmed 29 findings; among them,
  gold could be created from a negative treasury, an expired effect stayed in force for a
  day, a besieged fort still collected its neighbors' materials, a builder could be freed
  from a different job, and pillage was computed apart from the selectors. A 4-nation
  Medium game (110 provinces, 220 commanders, some pillaging) runs about 0.7 ms per day
  after the review's performance fixes, against the 2 ms budget.

## Phase 3: Commanders, movement, recruitment, independents (done)

- `src/sim/commands/`: the Command union and `validateCommand` / `applyCommand` for move,
  reverse, setOrder, setScript, setFormation, transferSquad, build, recruit, cancelRecruit,
  buyPd, and setTax. Every command names its nation and is refused, changing nothing, for
  anything that nation does not own.
- `movement.ts`: map speeds, whole-day legs, Dijkstra paths that cross only friendly
  provinces, ETAs, and the daily walk in three steps (transits, arrivals, onward legs) so
  Phase 4 can fight at arrivals. Reversal keeps the commander where it last stood.
- `recruitment.ts`: costs, Wild beast discount, recruit time with Order, Turmoil, Wild, and
  Artifice, the daily queue (paused by siege or unrest, waiting for population), garrison
  holders, and capped refunds. `pd.ts`: PD cost and the force it fields.
- `independents.ts`: every non-capital province gets an Independent Captain and its terrain
  pool at game start. `visibility.ts`: vision, explored provinces, visible armies, fogged
  independent strength, and 'sighted' messages. `hash.ts`: a state hash.
- Tests: move ETA by terrain at every speed, multi-leg paths, groups, reversal, and Dijkstra
  against an independent Bellman-Ford; recruitment end to end (pop taken on completion);
  every command refused against another nation's units; independents per terrain; fog; and
  acceptance criterion 4: a 365-day command log replays to the same state hash, also through
  a save and load.
- A design review (4 lenses, 31 issues, two independent judges) settled the rules recorded in
  the docs; the main changes were keeping a reversing commander where it last stood,
  commander speed 3, Wild and Artifice on recruit time, one squad per unit and row, paths only
  through friendly provinces, and garrison holders that take no orders. A code review (4
  lenses, each finding re-checked by a skeptic) found one rules gap (cancelling during a
  siege lost the materials; now refused), a pathfinder that could offer a path validation
  refuses (now `findPathFor`), arrival handling over budget under heavy marching, and 28
  ways to break the code that no test caught. Each of those 28 mutations now fails the suite.
- Speed: a 4-nation Medium game (110 provinces) with 326 commanders runs about 1.6 ms per
  day; with 200 armies all marching on long paths, about 1.9 ms (docs/06 budget: 2 ms).

## Phase 4: Battles, sieges, capture (done)

- `src/sim/battle/`: `resolveBattle(setup, rng)` is pure. It splits squads into troops in
  three rows, then runs each round: scripts, ranged fire, melee (both simultaneous within the
  phase), commander deaths, morale, and end of round (exits, regeneration). It returns
  survivors, the winner, and a full replay log; `foldReplay` rebuilds the viewer's state from
  a record. `setup.ts` builds a setup from game state with terrain, scales, Dread, storm,
  starvation, and unpaid-upkeep modifiers folded in; `apply.ts` writes the result back
  (wounds, deaths through `commanderDies`, a dead commander's troops to an heir, PD losses,
  population, unrest, records, messages, stats).
- `conflict.ts`: what an arrival among hostiles does (fight a third nation first, besiege a
  fort, take an undefended province, or fight for it, capturing only if someone is left), and
  the one retreat rule. `siege.ts`: daily walls, `siegeRates` for the UI and AI, empty forts
  falling, and storms. `capture.ts`: a province changing hands. The `storm` command.
- Tests: the docs/04 required tests except Pyre Storm (Phase 5 brings spells), plus closing
  and reach by speed and range, ammunition, damage rules, simultaneous kills, morale
  thresholds, pressure and commander deaths, fearless and berserk units, scripts, the winner
  when both sides break, replay folding over many battles, every modifier, arrival battles to
  capture, retreats and deaths, PD and garrison troops fighting, sieges from start to storm,
  heirs, records, and timing (300 against 300 in about 1 ms; a day with 175 armies marching
  about 1.8 ms).
- A design review (4 lenses, 35 issues, two independent judges) settled the rules recorded at
  the end of `docs/04-battle.md` and `docs/01-core-rules.md`. The main changes: archers keep
  shooting until they are reached, slow units fight back once reached, ranged damage leaves
  out strength, forts are always besieged, hidden commanders take no part, a capture needs
  someone left standing, every death goes through one function, and replays are kept only
  for the player's battles. Where the judges ruled that the defender wins every mutual rout,
  the required "20 Cinder Warriors beat 10 Ash Militia in 95%" test failed (89%), so the side
  holding the field wins instead (recorded in `docs/04-battle.md` and `docs/09-balance.md`).
  Starvation now kills troops in proportion to the HP lost, closing the Phase 3 known issue.
- A code review (4 lenses, each finding re-checked by a skeptic) confirmed 59 findings. Rule
  bugs: missile troops that could not reach the enemy front neither shot nor charged; a
  fallen defender's troops vanished when the fort's garrison held none; Dread lowered morale
  in battles the dominating nation was not part of; PD lost morale for unpaid upkeep it never
  draws; and a newcomer took over battered walls from besiegers that had simply left. An
  arrival scanned every commander about eight times; it now reads the province once a step,
  and sieges no longer compute their rates twice. 45 mutations the suite did not catch
  (morale boundaries, heirs, PD after battle, retreats, storms, reach, lances, berserk, rng
  ties) now fail it. Armor piercing's factor moved to content.

## Phase 5: Magic (done)

- Content: `src/content/spells/` holds the ten Red and ten Green spells of `docs/02-magic.md`
  and the priests' Bless as data built from the section 5 primitives, with requirement strings
  that can hold hybrids, and content validation for every spell. Rule numbers (fatigue,
  research, blessings, field effects, scry) are in `src/content/rules.ts`.
- Battle: the resolver casts in round step 1, one commander after another: named spells or
  the best castable one, fatigue and recovery, carried mana, and all eight battle primitives
  (`battle/spells.ts`, `targets.ts`, `effects.ts`). Setup lists each commander's known spells
  and the stats of what it can summon; sacred units carry the pretender's bless, life drain
  included.
- Map: research (`research.ts`), rituals with payment, targets, a completion check, and all
  eleven ritual primitives (`rituals.ts`, `ritualEffects.ts`), dominion pushes
  (`dominion.ts`), scry vision, and the commands `setResearchColor`, `castRitual`, `giveMana`;
  `setScript` takes named spells. Priests default to Bless.
- Tests: every Red and Green spell cast in a fixture battle or run to completion as a ritual
  through its command; the docs/04 Pyre Storm test (at least 8 of 30 militia); fatigue math
  and exhaustion; script choice and caster order; every primitive, including those no M1
  spell uses; research timing (one apprentice reaches level 2 on day 540, four reach level 4
  on day 660); payment, targets, refusals, and failures; blessings; replay folding with
  spells; 300 against 300 with eight casters under 50 ms.
- A design review (4 lenses, 49 issues, two independent judges) settled the rules recorded in
  `docs/02-magic.md`, `docs/04-battle.md`, `docs/05-pretender.md`, and `docs/06-architecture.md`.
  The main changes: named spells in scripts, priests that Bless, requirement strings with
  hybrids, no action at fatigue 100, summons with their side's modifiers, recasts that
  replace instead of stack, rituals that cannot be stacked on one province, leadership for
  summoned troops, Ash Rain on troops only and without armor, and one dominion push for
  rituals and Phase 6's spread.

## Deviations from the docs

- TypeScript is pinned to 6.0 because typescript-eslint does not support 7 yet.
- `sim:aivai` is a stub that validates its arguments; the runner arrives in Phase 6.
- Map rules settled in Phase 1 (province count by size and nation count, capital terrain
  from the nation, Wellspring separation and fairness, even spring colors, and more) are
  listed at the end of `docs/01-core-rules.md`. Their numbers are in `docs/09-balance.md`.
- Rules settled in Phase 3 (commander speed 3, whole-day legs, hostile provinces, paths only
  through friendly provinces, location kept on reversal, squad merging, recruit time and
  refunds, garrison holders, independents' pools, fog and sightings) are listed at the end of
  `docs/01-core-rules.md`; the command API's departures from the `docs/06` sketch (explicit
  `nation`, field names, `setOrder` by kind, `cancelRecruit` by id, the `commands/` folder)
  at the end of `docs/06-architecture.md`; numbers in `docs/09-balance.md`.
- Battle rules settled in Phase 4 (closing and contact, ranged damage without strength, the
  winner when both sides break, a commander routing with its last squad, heirs, berserk,
  winners staying where they fought, capture only if held, one retreat rule, sieges and
  storms, battle records only for the player's battles) are listed at the end of
  `docs/04-battle.md` and `docs/01-core-rules.md`; numbers in `docs/09-balance.md`. Dread's
  battle morale follows the effective scale (`docs/05-pretender.md`).
- Magic rules settled in Phase 5 (requirement strings, fatigue at 100, known spells and the
  casting heuristic, targets, recasts, summons for the battle only, field effects, research
  points and the level-6 cap, ritual payment, targets, completion checks, leadership, and
  each primitive's reading) are at the end of `docs/02-magic.md`. White, Blue, and Black
  spell data is not written (M2; the `docs/06` layout lists those files).
- Economy rules settled in Phase 2 (daily application of monthly rates, upkeep shortfall
  and recovery, materials cap, supply in transit, pillage order, construction) are listed
  at the end of `docs/01-core-rules.md`. `GameState` differs from the
  `docs/06-architecture.md` sketch: no `activeRituals` (ritual progress lives in the
  caster's order) and `result` is `GameResult | null`.

## Known issues and open questions

- Resolved: Thornwood's capital Deepmoss is Forest. Capitals take their terrain from the
  nation, overriding the core rules' "Farmland or Plains" (see `docs/01-core-rules.md`).
- Capital neighborhoods are balanced to within 1.5x starting population on about 99% of
  2-nation maps. With 3-4 nations the most even of 6 valid maps is often 1.5x to 2.5x.
  Revisit in Phase 12 if playtests show lopsided starts.
- Wellspring fairness is exact on 2- and 3-nation maps and within 1 hop on 4-nation maps.
- A dead elevation noise field would not fail any test; terrain wiring is covered only by
  exact shares and clustering. Pinning one seed's terrain would catch it but would churn on
  every deliberate generator change.
- For later phases: `wellspringsToWin` (majority of Wellsprings) lives in
  `src/mapgen/placement.ts`; Phase 6 victory should reuse it. (Resolved in Phase 3: farmland
  and wasteland use the plains independent pool.)
- The UI and AI should use `findPathFor` (not `findPath` from a leg's end) so previews match
  what move validation accepts.
- Supply conflict: at pop / 50, Hills supply is 100 to 160 a day, so the balance checklist
  item "armies larger than 60 troops in a Hills province starve within a month" cannot pass.
  Phase 12 decides between retuning (about pop / 250) and changing the checklist.
- Tax rate changes cost nothing yet, and High tax at the capital is free income until
  unrest bites; Phase 12 balance.
- `NationState.capital` never changes; Phase 6 decides what happens when a capital falls.
- Resolved in Phase 3: Wild and Artifice "build time" scales recruitment time too; arrivals
  are grouped by province and then nation; legs use the move order's frozen `mapSpeed`.
- A commander in transit is present at its location for battles: it defends there and is
  caught by arrivals there, and a battle there ends its transit. Change this only together
  with `isHostile`.
- Research conflict: four apprentices reach level 4 by month 24 only at neutral or better
  Lore; at capital Fury −2 (the Warlord and Wildfire presets) they take until day 825.
  Phase 12 decides (see `docs/09-balance.md`).
- For Phase 6: whether pretenders other than the Oracle research is one predicate,
  `canResearch` in `research.ts`. A new prophet keeps its script; Phase 6 decides whether it
  gets a caster script. Godless already blocks rituals.
- For Phase 7 (AI): Warcry, Pyre Storm, Swarm, and Regrowth need carried mana, so the AI
  needs a `giveMana` step; its research step must not replace a `castRitual` order, which
  would throw away the mana already paid.
- For Phase 6: `pretenderId` is null both before the pretender arrives and after it dies, so
  awakening must track the arrival separately.
- For Phase 7 (AI): there is no sally; a besieged fort is relieved only by an army arriving
  from outside, which fights the besiegers alone (the garrison and PD stay inside). A siege
  whose defenders repair at least as fast as the besiegers batter never breaches (defenders
  with twice the besiegers' strength stall it for good), so the AI must storm when the walls
  are down or the siege cannot progress, or relieve its own forts. `siegeRates` gives the
  numbers.
- Forts start with an empty materials pool, so the capital's first batch of 10 Cinder
  Warriors (80 materials at about 60 a month) waits about 40 days. Revisit in playtesting
  (Phase 8) or balance (Phase 12).
