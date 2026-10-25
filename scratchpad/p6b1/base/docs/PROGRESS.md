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
- A code review (4 lenses, each finding re-checked by a skeptic) confirmed 55 of 61 findings.
  Rule bugs: mana a caster spent in battle went uncounted when it died; ritual supply changes
  added to the scales instead of multiplying (Burn the Fields did not halve supply on
  Growth/Wild land); front-row archers stood idle through a storm; Regrowth healed
  commanders; two area effects of one spell hit different troops; summons replayed with no HP.
  Quality: ritualTargets now offers exactly what the castRitual command accepts (one shared
  castBlocker); one inOwnLab check; the buff event's untilRound; field effects no longer log
  unmatched expires; duplicated helpers merged; the spell tests split to mirror src. 43
  mutations the suite did not catch (targets, morale, exhaustion, summons, life drain, ritual
  reach and stacking, labs, scry, remoteDamage, tick order) now fail it, each re-run to prove
  it. 765 tests.

## Phase 6: Pretender, dominion, Wellsprings, victory, headless runner (done)

- Content: the six chassis (`src/content/pretenders/chassis.ts`) with one commander body each
  (`src/content/units/pretenders.ts`), design point costs and awakening
  (`pretenders/costs.ts`), and the six presets (`pretenders/presets.ts`); each nation names
  its two fitting chassis. Content validation checks chassis, bodies, and presets.
- `pretender.ts`: design costs, `validatePretender` (the one rule; `createGame` refuses bad
  designs), and `settlePretender`: the pretender arrives in its capital on day 0, 330, or
  1050, leaves the map while its nation is Godless, returns after, and never returns once
  dead. Only the Oracle researches; the Living Monolith cannot move and dies rather than
  retreat; the Ash Colossus burns melee strikers (fire shield).
- `dominion.ts`: the monthly spread from capitals, temples (with Sanctity), the pretender (x2
  for the Monolith), the prophet, and preaching priests, shuffled together each month;
  Godless. `commands/pretender.ts`: `makeProphet` (holy 3, +1 morale and the bless in
  battle, one check) and `claimWellspring`. `wellsprings.ts`: 10-day claims that any order,
  move, battle, or loss interrupts, announced to everyone. `victory.ts`: capital moves,
  elimination, and the result (Wellsprings, last capital, player defeated).
- `src/ai/` (pure, guarded like the sim): `playDay` advances a day and applies each AI
  nation's commands in order on its planning days, logging refusals; `replayLog` replays a
  log without the AI; `runMatch` plays a whole game; the dummy AI makes random valid choices
  with its own random stream. `npm run sim:aivai -- --games 20 --seed 1` plays Cinder Horde
  against Thornwood and prints winner, reason, months, and stats per game.
- Tests: design costs and every validation refusal; the six presets with pinned costs (385,
  280, 415, 385, 395, 375); arrival on days 0, 330, and 1050; recall and return; Oracle-only
  research; the Living Monolith's immobility, death in retreat, and Call of the Wild; the fire
  shield per hit; the prophet's rules, bless, and morale; every dominion source counted
  exactly; the spread's die, order, neighbors, cap, and messages; Godless, its monthly settle,
  and the recall; Wellspring claims and every interruption; victory by Wellsprings, last
  capital, and player defeat; elimination and capital moves; the AI driver's cadence and
  refusals, replay from the log, and the runner's setup, tally, and determinism. 994 tests.
- Godless: the docs' trigger ("holds no temple anywhere") could never happen in M1. By the
  project owner's decision it now reads "no temple under its own dominion".
- A design review (4 lenses, 36 issues, two independent judges) settled the rules recorded in
  `docs/01-core-rules.md`, `docs/05-pretender.md`, and `docs/08-ai.md`. The main changes: Deep
  Root at dominion 7, Monolith leadership 20 and death instead of retreat, the temple preach
  bonus, the month's checks shuffled across nations, a `pretenderDead` flag instead of a
  pretender state machine, Godless settled monthly, the victory order with player defeat only
  when there is a human, one AI driver for the browser and the runner, a private AI random
  stream, and the purity guard extended to `src/ai`.
- A code review (4 lenses, each finding re-checked by a skeptic) confirmed 24 of 34 findings:
  an eliminated nation's sieges stayed and locked the besieged owner out of recruiting; the
  victory summary lost mana spent per color; the runner's tally hid nations without a win;
  the pip cap moved to content; one count of claimed Wellsprings; retreat asks `canMove`. 16
  mutations the suite did not catch (the spread die, the shuffle, random neighbors, checks on
  the march, Godless after the spread, an unsacred pretender, the fire shield on the dead, the
  prophet's script, the runner's setup and defaults, a repeated chassis) now fail it.

## Phase 10 S1: Battle detail sink and re-runnable records (done)

The first stage of the battle presentation track (`docs/12-battle-presentation.md`, S1), built
during Phase 7 at the owner's direction (visceral replays with per-blow detail and sound).
- Stored log additions A1 to A5 (`docs/04-battle.md`, "Replay log" and "Replay detail"):
  `phase` markers for every round step that logged something; `attacks`, `blocked`,
  `onFallen`, and `dmg` on `volley` and `melee`; `by` on commander damage and fire-shield
  burns; the caster's `fatigue` on `cast`; and `scene` (terrain, storm) on the record.
- `resolveBattle(setup, rng, { detail })`: an observation-only sink (`battle/detail.ts`) gets
  every strike with its rolls and landing, spell hit, burn, drain, morale roll, and the
  fronts and contact of each ranged and melee phase. Every roll is bound to a local in the
  old order; detail objects are built only when a sink is set, so the resolver without one
  runs as fast as before.
- Re-runnable records: player battles store `rerun` (the setup through a JSON round trip,
  spells by id, and the rng state from just before the battle); `battle/rerun.ts` has
  `toSetupRecord`, `fromSetupRecord`, `rerunBattle`, `matchesRecord`, and `validRerun`.
  `STATE_VERSION` is 2; `src/sim/migrate.ts` holds the 1-to-2 migration and the lenient load
  of a malformed `rerun`. `morale.ts` exports `mustCheck`, `breakThreshold`, and `fearless`,
  which the resolver itself uses.
- Proof that nothing moved: `tests/sim/battle/golden.json` (`npm run golden:battle`) pins
  the logs, outcomes, and final rng states of 30 named fixtures on 5 seeds, written before
  the refactor; with A1 to A5 stripped they still match. Outside the repository, 600 battles
  (30 fixtures on 20 seeds) were compared in full before and after, with and without a sink,
  and two 365-day games with a human nation plus two runner games ended in identical states
  (minus the version and the record additions).
- Tests: the golden pin; the sink equivalence (30 fixtures x 20 seeds, result, log, and rng);
  the detail adding up to every tally, the HP of every group, the spell damage, and each
  troop's single death; the order guarantees and phase labels; records that re-run and match
  in the same session, after a save and load, for a storm, and through a played year; AI-only
  battles unrecorded; unknown spells and tampering caught; the size pins (clash300 setup 9.3
  KB, record at most 50.9 KB raw and 5.5 KB gzipped, starting at most 13.8 KB; pins 14, 56,
  7, and 16 KB); the migration; the morale helpers on a grid; the worst re-run with detail
  (about 14 ms against a 45 ms pin). 1291 tests.
- Timing: the resolver without a sink measured unchanged within noise (best of 12: 300 v 300
  0.74 ms before, 0.78 after; clash300 1.92 / 1.88; grind16 4.10 / 4.14; immortal 8.40 /
  8.46). With a sink and verification, clash300 re-runs in about 4 ms and the worst battle
  in about 14 to 19 ms.
- Adversarial check: 1,500 random battles (random sides and units, commanders with random
  spells and scripts, pretenders, PD, storms, field effects, damaged squads) and 11 edge cases
  were fought on the Phase 6 resolver and the new one, with and without a sink. Results,
  stripped logs, and rng states were identical. Every detail stream added up to its tallies,
  HP, spell damage, burns, and commander damage, and every record re-ran to its log. Six whole
  games (two runner games, four with a human nation) ended with the Phase 6 state hash, and
  all 135 records they made re-ran and matched. Mutation testing found six guarantees no test
  checked. Each now has a test: the fatigue a cast logs (`spells.test.ts`), a burn's `by` with
  two shields and a strike's `berserk` flag (new `landing.test.ts`), the drain detail
  (`detail.test.ts`), a spell hit on a troop an earlier effect felled (`effects.staged.test.ts`),
  and a migration that keeps every record (`migrate.test.ts`).

## Deviations from the docs

- TypeScript is pinned to 6.0 because typescript-eslint does not support 7 yet.
- Pretender, dominion, Wellspring, and victory rules settled in Phase 6 (spread order and
  sources, the temple preach bonus, Godless, claims, capital moves, elimination, the order of
  victory checks, the prophet, arrival days, bodies) are at the end of
  `docs/01-core-rules.md` and `docs/05-pretender.md`; the AI contract, cadence, dummy, and
  runner at the end of `docs/08-ai.md`; numbers in `docs/09-balance.md`. The Deep Root preset
  uses dominion 7 (8 is over budget).
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

- Phase 10 S1 (`docs/12-battle-presentation.md`, "Implementation decisions"): landing the hits
  lives in `battle/landing.ts` and the migration map in `src/sim/migrate.ts`, files the spec's
  S1.1 table does not list; the migration test is `tests/sim/migrate.test.ts`, mirroring the
  source, rather than part of `rerun.test.ts`; `golden.json` carries an outcome hash beside
  the spec's log hash.

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
- Resolved in Phase 6: the docs' Godless trigger ("holds no temple anywhere") could never
  happen in M1, since every fort is a capital with a temple. By the project owner's
  decision it now reads "no temple under its own dominion" (docs/01 section 12), so a
  nation whose capital and temples fall under an enemy's dominion becomes Godless. It is
  rare: none of 20 runner games saw it, since capitals stand 6 or more provinces apart and
  each pushes its own dominion with at least 4 checks a month.
- A hidden commander (a Wild Spirit pretender, or a prophet leading only stealthy troops)
  makes its dominion checks wherever it stands, unseen, even deep in enemy land. The docs
  give the checks without condition; Phase 12 or the design decides whether to limit them.
- Sleeping builds are strong: the bless comes from the design's pips at game start
  (docs/02 section 8), so an imprisoned design spends 750 points with the bless in force from
  day 1 and only the body waiting until month 36. Phase 12 balance.
- Wellspring victory is immediate on the last claim, with no hold period, and it comes early:
  even the random dummy wins by Wellsprings in most runner games, in a mean of about 27
  months (20 games from seed 1: 17 Wellspring wins, 2 last-capital wins, 1 timeout at 100
  months). Phase 7's AI must defend its Wellsprings and contest the enemy's; Phase 12 decides
  whether Wellspring wins need a hold period or tougher guards.
- Resolved in Phase 3: Wild and Artifice "build time" scales recruitment time too; arrivals
  are grouped by province and then nation; legs use the move order's frozen `mapSpeed`.
- A commander in transit is present at its location for battles: it defends there and is
  caught by arrivals there, and a battle there ends its transit. Change this only together
  with `isHostile`.
- Research conflict: four apprentices reach level 4 by month 24 only at neutral or better
  Lore; at capital Fury −2 (the Warlord and Wildfire presets) they take until day 825.
  Phase 12 decides (see `docs/09-balance.md`).
- For Phase 7 (AI): Godless is now reachable, so the AI should preach at home (or name a
  prophet there) when an enemy's dominion threatens its capital and temples.
- For Phase 7 (AI): `aiMemory` may change only through a command (docs/08 decisions); add
  one when the AI first writes memory. A new prophet keeps its script, so the AI sets a
  caster script itself if it wants one.
- For Phase 7 (AI): Warcry, Pyre Storm, Swarm, and Regrowth need carried mana, so the AI
  needs a `giveMana` step; its research step must not replace a `castRitual` order, which
  would throw away the mana already paid.
- For Phase 7 (AI): there is no sally; a besieged fort is relieved only by an army arriving
  from outside, which fights the besiegers alone (the garrison and PD stay inside). A siege
  whose defenders repair at least as fast as the besiegers batter never breaches (defenders
  with twice the besiegers' strength stall it for good), so the AI must storm when the walls
  are down or the siege cannot progress, or relieve its own forts. `siegeRates` gives the
  numbers.
- Forts start with an empty materials pool, so the capital's first batch of 10 Cinder
  Warriors (80 materials at about 60 a month) waits about 40 days. Revisit in playtesting
  (Phase 8) or balance (Phase 12).
- Phase 10 S1 lands as two commits (`docs/12`, S1.9): first the golden pin alone
  (`scripts/golden-battle.ts`, `package.json`, `tests/sim/battle/fixtures/named.ts`,
  `armies.ts`, and `golden.ts` beside it, `tests/sim/battle/golden.test.ts`, `golden.json`),
  which is green on the Phase 6 resolver and regenerates byte for byte there; then the rest.
- Serialize (Phase 9) must call `migrateState` on load; until then nothing runs the
  migration outside its test.
- The timing tests (`tick`, the docs/04 resolver budgets, the re-run pin) can fail when the
  machine is loaded by other processes; they pass when run alone.
- Fixed during S1: a re-run used to be trusted whenever its log matched the record, so a
  rule or spell change that left the log as it was went unnoticed (in a test that raised the
  morale base by 1, about 80% of random records still matched and showed morale rolls against
  the new target). `rerun.rules` now stores `battleRulesHash()`, and a save from a build with
  other battle rules, spells or units loads with a null `rerun` (log-only replay).
