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

## Phase 7: AI (done)

- `src/ai/ai.ts`: `runAi(state, nation)` is the AI of `docs/08-ai.md`. It replaces the dummy in
  the headless runner and the tests; `src/ai/dummy.ts` and its tests are deleted. Each call
  plans on a copy of the state (`plan.ts`) that deep-copies only what commands write, in seven
  steps: economy, recruitment and transfers, research, priests, the army pass, rituals, and
  the pretender's work. Each command is applied on the copy as it is issued, and only the
  accepted ones are returned. The AI uses only the player's commands, reads the whole map (no
  fog for the AI in M1), writes no `aiMemory`, and draws only from its own streams (`aiRng`,
  and `keyedRng` for the pillage draw).
- Roles come from content (`roles.ts`): leader, mage (researcher or battle mage, split by the
  research personality), priest, scout, summoned, and the pretender by its body; `src/ai`
  names no unit or chassis. `assess.ts` sizes up armies and provinces. `economy.ts` sets taxes,
  PD, buildings, and research. `recruit.ts` keeps the capital queue, the quotas, and the 2:1
  troop mix, and holds 20 troops in the capital from day 0. `faith.ts` claims Wellsprings, one
  priest each, and guards against Godless. `magic.ts` casts rituals at war and at peace and
  gives battle mages carried mana.
- The army pass (`military.ts`, `army.ts`, `defense.ts`, `war.ts`) gives each group one task a
  call, in order: relief of own besieged forts; the sieges the nation lays (stormed with 1.3
  times the defenders once the walls are down, else held, with a keyed pillage draw);
  Wellspring escorts; Defense (the capital, then Wellsprings, then the rest); War (sieges,
  Wellspring denial past the odds gate, marches, new targets); Expansion with no hop limit;
  and the march home to refill. A group moves as one with the fighter pretender, summoned
  commanders, and one battle mage.
- Every AI number is in `src/content/ai.ts` (`AI`), checked by content validation, with a row
  in `docs/09-balance.md`. `src/sim/movement.ts` gained `pathsFrom`, every path of a group
  from one search; `findPathFor` is built on it. `scripts/aivai.ts` plays `runAi` and prints
  the AI's milliseconds per planning call.
- Tests: the contract (state and `state.rng` untouched, the same commands for the same state,
  every command valid in order, nothing after the end), `aiRng` and `keyedRng`; the planning
  copy and its ids; roles; power, threat, groups, and borders; and one file per step module:
  tax, the PD order, the scout's buildings, quotas rounded down, the queue and its fallbacks,
  the adept tier, batches, the troop mix and weights, transfers above the reserve from day 0,
  researchers and the ritual guard, Godless and the priests, Wellspring claims and escorts,
  relief of a lone besieger within bounded days, gathering, the sally, storm odds, the pillage
  draw at the personality's rate, the War gate, Wellspring denial past it but not before
  Easy's month 12, Expansion's score and the 1.5x rule, the march home and refill, groups
  moving together, summons with research between them, carried mana and Warcry cast with
  it, rituals at war and at peace; `pathsFrom` against `findPath` on several seeds; the AI
  numbers' validation. 155 tests in `tests/ai`, 1120 in all (after the review fixes below).
- Behavior (docs/08's required tests, `tests/ai/behavior.test.ts`): one run of the 20 runner
  games from seed 1, to day 720 or the game's end, about 15 s. Both nations own at least 8
  provinces on day 360 in 20 of 20 games (16 required); on that day Cinder Horde owns 13 to 27
  and Thornwood 13 to 24. No capital queue stood empty more than 8 days with gold above 200
  (limit 60). No held capital had an empty garrison on any day from day 180. No command was
  refused. The same holds from base seeds 101 and 1001. A further test plays one Large
  three-nation game (seed 8) for up to three years, about 2.5 s: no field army stands in its
  capital without a task for more than 120 days while an enemy province in reach passes the
  per-target War odds (review finding cor-3).
- Runner statistics (`npm run sim:aivai -- --games 20 --seed 1`; repeated runs play identical
  games), after the review fixes below: Cinder Horde 10 wins, Thornwood 9, and one game without
  a winner (game 18, below). The 19 others ended by Wellsprings, none by elimination, in a mean
  of 23.0 months (11.8 to 33.2). No command was refused. The AI took 1.83 ms per planning call
  on a machine under heavy load (6404 calls), 20 games 23.9 s. Before the fixes: Cinder Horde
  11, Thornwood 9, all by Wellsprings, mean 19.3 months, about 1.4 ms per call and 13 s on a
  quiet machine. The maximum varies from run to run while the games stay the same, which
  points to garbage collection or warm-up, not the AI's work.
- Review fixes (12 confirmed behavior findings, 2026-10-21): escorts are registered for every
  Wellspring before any free army is sent, so one claim's escort is never sent to another; an
  outmatched capital keeps the groups standing in it when no helper covers the threat; a
  pillage held anywhere but at the nation's own siege (a fort that fell to it) is set idle, and
  besiegers stop pillaging when they storm; War's new-target odds are judged per candidate
  target (its garrison and PD plus other nations' commanders within 2 hops) instead of one sum
  over the whole border, which never opened for a large nation. Refactors with identical
  commands in 1848 compared calls: the plan finds the hostile provinces once a call
  (`pathsWith` in `movement.ts`), `splitMages` reads the plan's roles, one shared `walk` and
  `fewestDays`, one `isRanged` and `isMoving`; the dead `freeArmies`, `Borders.independent`,
  and unused exports were deleted. `planAi` returns a call's whole plan for tests. The two slow
  tests got explicit timeouts. New tests cover each fix, an Oracle pretender studying after day
  90, and the escort rule through `escortClaims`.
- A design review (4 lenses, 39 issues, two independent judges) settled the readings recorded
  in `docs/08-ai.md`. The main changes: roles from content, a planning copy that shares what
  commands never write, `pathsFrom` and no hop limits, the capital reserve from day 0, relief
  of every siege of an own fort, the march home to refill, storms only with the odds, a pillage
  draw made once per besieger and fort, Wellspring denial and escorts, battle mages with
  carried mana, summons handed to the garrison, no `aiMemory`, and the dummy deleted. No
  tuning was needed: the behavior tests passed on the first run with wide margins.

## Deviations from the docs

- TypeScript is pinned to 6.0 because typescript-eslint does not support 7 yet.
- Pretender, dominion, Wellspring, and victory rules settled in Phase 6 (spread order and
  sources, the temple preach bonus, Godless, claims, capital moves, elimination, the order of
  victory checks, the prophet, arrival days, bodies) are at the end of
  `docs/01-core-rules.md` and `docs/05-pretender.md`; the AI contract, cadence, dummy, and
  runner at the end of `docs/08-ai.md`; numbers in `docs/09-balance.md`. The Deep Root preset
  uses dominion 7 (8 is over budget).
- AI readings settled in Phase 7 (roles from content, groups and free armies, the step order
  and the army pass, the planning copy, no `aiMemory`, the reserve from day 0, relief, storms,
  pillage only at besieged forts, Wellspring denial and escorts, Godless defense, the research
  split and battle mages, rituals at war and at peace, Expansion with no hop limit, the march
  home, the behavior test horizons) are at the end of `docs/08-ai.md`; `pathsFrom` and the
  AI's modules at the end of `docs/06-architecture.md`; every AI number in
  `docs/09-balance.md`.
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
- The UI should use `findPathFor` (not `findPath` from a leg's end) so previews match what
  move validation accepts. The AI does, through `pathsFrom` (Phase 7).
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
- Wellspring victory is immediate on the last claim, with no hold period, and it comes early.
  The random dummy won by Wellsprings in 17 of 20 runner games, in a mean of about 27 months.
  Phase 7's AI holds its Wellsprings (Defense right after the capital, PD 10, escorts) and
  contests the enemy's (denial past the odds gate), yet all 20 runner games from seed 1 end by
  Wellsprings, none by elimination, in a mean of 19.3 months (11.8 to 40.3). A claim takes 10
  days and a call comes every 5, so denial seldom lands in time. Phase 12 decides whether
  Wellspring wins need a hold period or tougher guards.
- Resolved in Phase 3: Wild and Artifice "build time" scales recruitment time too; arrivals
  are grouped by province and then nation; legs use the move order's frozen `mapSpeed`.
- A commander in transit is present at its location for battles: it defends there and is
  caught by arrivals there, and a battle there ends its transit. Change this only together
  with `isHostile`.
- Research conflict: four apprentices reach level 4 by month 24 only at neutral or better
  Lore; at capital Fury −2 (the Warlord and Wildfire presets) they take until day 825.
  Phase 12 decides (see `docs/09-balance.md`).
- Resolved in Phase 7 (docs/08 decisions): the AI's priests come home to preach when no
  capital or temple of its own holds its dominion at 2 or more, so Godless is guarded. It
  writes no `aiMemory`, so no memory command was added. It names priests prophets, whose Bless
  script suits them, and sets no scripts. Battle mages take carried mana in an own lab, and
  the order guard keeps research from replacing a ritual under way. It relieves every siege of
  its forts from outside (a group inside steps out and back in), holds a siege that cannot
  progress so that more armies join, and storms breached walls only with 1.3 times the
  defenders.
- Forts start with an empty materials pool, so the capital's first batch of 10 Cinder
  Warriors (80 materials at about 60 a month) waits about 40 days. Revisit in playtesting
  (Phase 8) or balance (Phase 12).
- The AI's gold piles up while fort materials bind its recruitment, and it has no rule for
  spending a surplus. So Easy's gold income factor (x0.8) barely bites (docs/09). Phase 12.
- With research 0.4, Cinder Horde's first two mages are one researcher and one battle mage, and
  a researcher casts a ritual only while another keeps studying, so Cinder Horde casts no
  ritual until its third mage (12 provinces). With research 0.7, Thornwood's first three mages
  all research, so its first battle mage comes with the fourth (16 provinces). Phase 12.
- One enemy army can hold several of the AI's armies in Defense: each own province within a
  hop of it counts the whole army as its threat, and each draws its own defender. Runner game
  18 (seed 18) shows the cost since War opens per target: by day 600 Cinder Horde holds 35 of
  60 provinces and Thornwood 5, and from then on all eight Cinder armies stand held in the
  provinces next to Thornwood's armies. The two independent Wellsprings (guards of 250 to
  300 power, which one 80-troop army takes) are never attacked, so the game stalls until the
  timeout. Phase 8 playtesting or Phase 12 should decide how Defense shares one threat.
- The AI retakes provinces it loses only through War (Expansion takes independents only, as
  docs/08 says), behind the aggression gate. Since the review (finding cor-3) the gate is
  judged per target, so a weakly held province opens it even for Thornwood (0.4); before, the
  gate summed the whole border and seldom opened. On 24 Large three-nation games to day 1500,
  11 ended without a winner under the old gate and 4 under the new one.
- The capital queue runs empty for about 4 days between planning calls in most games: each
  call fills it to 2 items and it drains before the next. That is far under the 60-day limit;
  a deeper `AI.queue.max` would close the gap.
- The behavior tests cover the Normal AI with the runner's two nations and their default
  presets. Easy's cadence and War delay, and the other pretender bodies, are covered by step
  tests only.
- The AI's slowest call varies from 11 to 67 ms over identical runs (garbage collection or
  warm-up), against a mean of about 1.4 ms. The browser runs the AI inside a tick, so a long
  pause could show; no test times the AI.
