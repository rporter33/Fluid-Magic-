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
  numbers' validation. 182 tests in `tests/ai`, 1147 in all (after the review fixes and test
  gaps below).
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
  of 23.0 months (11.8 to 33.2). No command was refused. The AI took 1.23 ms mean and 9.0 ms
  maximum per planning call (6404 calls), 20 games 16.3 s, at load about 2 on 4 cores; 1.83 ms
  and 23.9 s under heavier load. Before the fixes: Cinder Horde
  11, Thornwood 9, all by Wellsprings, mean 19.3 months, about 1.4 ms per call and 13 s on a
  quiet machine. The maximum varies from run to run while the games stay the same, which
  points to garbage collection or warm-up, not the AI's work.
- Code review (spec, correctness, rules, and tests lenses, each finding re-checked by a
  skeptic): 49 of 54 findings confirmed, all applied (the 12 behavior findings and 37 test gaps
  below; 5 refuted). Tests went from 1110 (one timing out) to 1147, 182 of them in `tests/ai`.
  A final check re-applied 12 of the 37 mutations across eight modules, and each fails its
  mirrored test file. The review's scripts for the escort, outmatched-capital, stale-pillage,
  and War-gate findings no longer show the bad behavior; on the review's Large four-nation
  setup, no sample from day 720 to 1500 has a full army idle at home (23 of 27 did for one
  nation before). Runner: Cinder Horde 10, Thornwood 9, one timeout, 0 refused, 1.23 ms per
  call. Five Large three-nation games (a scratch script, since the runner plays two nations on
  Medium) all ended by Wellsprings in a mean of 49.6 months, 0 refused, 2.26 ms per call.
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
- Review test gaps (37 mutations the suite did not catch, 2026-10-21) now fail it, each by a
  unit test in the file that mirrors its module: Defense's order, cover with PD, exact cover,
  spare groups, help counted on its way, escorts taken, besieged forts left to relief; relief's
  ratio, movers, and gather ties; escorts marching and nearest; storm and march odds, the
  aggression and per-target terms of the War odds, garrison holders, value against days,
  sieges counting marchers, the pillage draw per fort and for leaders only; Expansion's
  divisor, enemy provinces, earlier moves, and the combined try; rituals one at a time, the
  Monolith first, the strike front, Fertile Season on own land; the nearest lab, the besieged
  PD skip, a priest turned home, the pretender's summons, and a garrison as no threat. Defense
  and War tests are split by topic (`defense.relief`, `defense.escort`, `war.targets`), with
  shared setups in `tests/ai/armyFixtures.ts`.
- A design review (4 lenses, 39 issues, two independent judges) settled the readings recorded
  in `docs/08-ai.md`. The main changes: roles from content, a planning copy that shares what
  commands never write, `pathsFrom` and no hop limits, the capital reserve from day 0, relief
  of every siege of an own fort, the march home to refill, storms only with the odds, a pillage
  draw made once per besieger and fort, Wellspring denial and escorts, battle mages with
  carried mana, summons handed to the garrison, no `aiMemory`, and the dummy deleted. No
  tuning was needed: the behavior tests passed on the first run with wide margins.

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

## Phase 6b.1: Pretender design rules, the blessing menu, boons (done)

The first of three Phase 6b steps (`docs/10-milestone-1.md`), built at the owner's direction
("good options for pretenders like Dominions has is always a highlight"; the 2026-10-21
pretender build spec, E.1). The owner approved the spec's defaults; they are recorded as owner
decisions in `docs/05-pretender.md`.
- Content: `ChassisDef` gained `realm`, `role`, `newColorFirstPip` and `aiPower` (set on the
  six chassis) and the optional `attunement`, `minAwakening`, `startSprings` and `avatar`
  (used by no chassis until 6b.3); `PRETENDER_COSTS.newColorFirstPip` is gone. New
  `pretenders/blessings.ts` (31 blessings: full Red and Green menus but Thornhide, two minors
  plus the fixed bless for White, Blue and Black), `pretenders/boons.ts` (Sacred Spring 40,
  Avatar 40) and `pretenders/validate.ts` (chassis, blessing, tier and boon checks, run by
  `validateContent`). `PretenderDesign` gained optional `blessings` and `boons`;
  `content/rules.ts` gained `BLESSING_MENU` and `PRETENDER_NAME`; `content/types.ts` the
  `Shield` type.
- Sim: `pretender.ts` has `offersChassis` and `availableChassis` (D1), the per-chassis
  new-color price (D2), attunement in `scaleStepCost(def, chassis, axis, toward)` (D3), the
  minimum awakening (D4), `startingSprings` (D5), `validatePretenderName` and the named
  commander on every arrival (D7), boon costs and checks, and `hasAvatar`. `bless.ts` has
  `blessPoints`, `defaultBlessings`, `chosenBlessings`, `blessOf(design, godPresent)`,
  `nationBless` and `blessingProblem`. `battle/setup.ts` folds every blessing (weapons,
  first-round bonus, berserk, fire shields) and blesses an Avatar in its own dominion.
  `createGame` stores the name, copies the design's lists and adds the capital's springs;
  `selectors.ts` has `provinceSprings` and pays added springs.
- State: `NationState.pretenderName` and `pretenderReturnDay` (null until 6b.3),
  `ProvinceState.extraSprings`, `NationSetup.pretenderName`; `STATE_VERSION` 3, its migration
  chained after S1's in `MIGRATIONS`.
- Tests: `tests/sim/bless.test.ts` (the 16,807-vector default check, folds, incarnate in play,
  every refusal, the bounds table), `pretender.design.test.ts` (realms, prices, attunement,
  minimum awakening, boons, names), `pretender.name.test.ts` (the name in the commander, its
  messages and battle roster, and 365 dummy-AI days that differ only where the name appears),
  `battle/setup.bless.test.ts` (every fold, incarnate, Avatar), `tests/content/blessings.test.ts`,
  `presets.test.ts` (the six presets byte for byte, cost and bless, and behavior pins computed
  on the Phase 6 code before the change: every battle setup the bless reaches and 360 days of
  the dummy AI per preset, new fields stripped), and additions to `validate.chassis`,
  `validate.pretender`, `createGame`, `selectors` and `migrate`. 1291 tests before, 1364
  after.
- Deviations from the build spec: the ten new chassis records come with their bodies in
  6b.3, so attunement, the minimum awakening, chassis springs and built-in Avatar are tested
  on patched content, and each nation has five chassis, not eleven. `CombatStats` keeps
  `fireShield` until N4 (6b.2): blessing shields are fire only, folded into it, and content
  validation refuses other elements. `ChassisDef.monthlySummon` and `reform` arrive with their
  rules in 6b.3. Choices where the spec is silent are in `docs/05` "Implementation decisions"
  (validation order, fold order, the design's own scales for scale requirements, an empty
  blessing list choosing none, the name's refusals, springs order).
- Review findings applied: `createGame` now puts `pretenderName` and `pretenderReturnDay` last
  in the nation record, where the 2-to-3 migration appends them, so a lifted version 2 save
  hashes like the same game created on version 3 (before, it was deep-equal but hashed
  differently for the rest of the game; `migrate.test.ts` now compares the JSON text and the
  hash for version 1 and 2 saves). `validatePretenderName` checks the alphabet before the
  length and says "1 to 24 symbols (letters, spaces, apostrophes, hyphens, periods)", so a
  25-symbol name with 23 letters, or a name in another script, gets the rule it breaks. Docs:
  the breath color (`docs/05`) is marked as Phase 9, `docs/10` criterion 8 points to the
  blessing menu, and `docs/06` has the new files, the `bless.ts` role and `STATE_VERSION` 3.
  Mutation testing (116 mutants) left 28 alive; each now has a test: weapon, shield and
  berserk folds on the prophet and an Avatar god, Avatar when the god attacks, blessings that
  cost no design points, a built-in Avatar that costs no boon, the realm before the
  awakening, blessings before boons and the budget, the design before the name, the springs'
  order with a color the map lacks, the nation's income from added springs, full rows for the
  White, Blue and Black minors with def and prec bounds, and the untested branches of
  blessing validation (melee element and negative damage, zero scale steps, a scale on a
  default pick, the default picks' thresholds and extra fields). 1371 tests after the fixes.

## Phase 6b.2: Pretender battle rules: abilities, trample, spell power, shields, bound squads (done)

The second of three Phase 6b steps, after the battle track's S1 (the 2026-10-21 pretender build
spec, E.1; at the owner's direction, "good options for pretenders like Dominions has"). Rules
N1 to N5 and the battle-design amendments 1 to 6 of the spec's C.2, with N1 in the final shape
of the units-and-items build spec (section B; E.6 items 1, 2 and 8).
- Content: new `content/abilities.ts`, the abilities catalog's trigger kind: `AbilityDef` with
  `kind: 'trigger'`, name, glyph id and one line (at most `UI.unitCard.oneLineMax`, 120), the
  trigger, a presentation color, effects and an optional `sourceId`; `UnitAbility` is
  `Extract<AbilityDef, { kind: 'trigger' }>`, `triggerDef`, `abilitySource(a)`; the three
  abilities Fear, Kindle the Host and Call the Hunt (no unit lists them until 6b.3).
  `EffectSource` and `BattleSpellId` in `content/spells`. `WeaponDef.strikes` and
  `maxTargetSize`, `UnitDef.spellPower` and `abilities`, `ChassisDef.monthlySummon` (the type
  only; N7's rule is 6b.3). The Thornhide blessing (32 blessings). Validation in the new
  `content/validateAbilities.ts` and `validateUnit`: display fields, effects through
  `battleEffectProblems`, ids apart from spell ids, a copied spell's shape, glyphs unique, the
  trigger id list, abilities on commanders only, weapon field ranges, spell power, fire shields,
  monthly summons; shield blessings take any element.
- Sim: `battle/abilities.ts` (`abilityPhase`, round 1 inside the scripts span before
  `scriptsPhase`); `effectGroups`, `hasTargets`, `plan`, `applyEffect` and `fieldEffect` take an
  `EffectSource`; `applyEffect` takes the spell power, which `cast` passes and abilities do not;
  `meleePhase` swings each weapon's strikes in a row and filters a size-limited weapon's targets
  once per group, drawing nothing when none are in reach; `burnStrikers` owes per striker troop
  and element and logs one `damage` per group and element; `moralePhase` skips bound squads
  when it collects the commanders to drag; summons are bound. `setup.ts` builds `shields`,
  `size` and `spellPower`, resolves a body's abilities, adds their summons' stats, and binds the
  pretender's squads of its chassis's monthly-summon unit. The `ability` event, the detail
  `burn`'s element, `foldReplay`'s new case, setup records with abilities by id,
  `validRerun`'s check, and `battleRulesInput()`/`battleRulesHash()` with the abilities.
- Tests: `tests/sim/battle/abilities.test.ts` (N1's eight, plus all-or-nothing with a summon,
  inactive commanders, no fatigue, `sourceId`, the hash), `attacks.strikes.test.ts` (N2),
  `effects.staged.test.ts` (N3), `landing.test.ts` (N4), `morale.bound.test.ts` (N5's six and
  standing bound squads), `setup.abilities.test.ts` (abilities, summons, size, spell power,
  shield merging, bound at setup), `named6b.test.ts` and the seven new named battles in the
  detail-sink equivalence and re-run tests, `tests/content/abilities.test.ts` (the fixture
  catalog and every refusal), Thornhide in `blessings.test.ts` and `bless.test.ts` (the bounds'
  nature-shield column). The fire-shield overrides in `attacks.test.ts`, `landing.test.ts`,
  `setup.test.ts` and `setup.bless.test.ts` moved to `shields`; `presetPins.ts` puts setups back
  in the Phase 6 shape before hashing, so the six presets' setup and game pins still match.
  `golden.json` matches byte for byte (not regenerated). The review's mutation pass added
  tests for the bounds it found loose: spell power stays off drains, shocks, buffs, debuffs
  and summons; Trample reaches size 2 exactly; a weapon listed first swings all its strikes
  first, each with the first-round bonus; a troop pays its shield debts in `ELEMENTS` order
  across shield groups; an ability draws from the battle rng as a cast does; two copies of
  one spell plan and check targets under its id; and the validators' accepted edges (a
  120-character line, every placeholder, strikes 1, size 1, fire shield 1, spell power 0, a
  summon cap equal to its count). 1371 tests before, 1509 after.
- Deviations from the build specs: `TriggerAbilityId` comes from a written-out
  `TRIGGER_ABILITY_IDS` list, not a type mapped over `ABILITIES` (that type is circular once a
  unit names an ability; validation holds the list to the catalog). A shield burn's `by` ties
  go to the first shield struck (S1's rule), not "the earlier in setup order", because the
  spec also requires today's log exactly; the spec owner is asked to amend N4's tie clause
  and R4 to match (no pin tells the two rules apart, so a switch would be a one-line change
  in `mainShield`). The seven new named battles sit beside `NAMED`
  (`fixtures/named6b.ts`), outside the golden pin. N5's corner test shocks morale-47 hornets
  to make them break, since a roll at 47 against 10 almost never fails. The catalog's
  remaining display fields (Codex text, placement, card priority, condition, milestone) and
  kinds wait for 7b.1. Amendment 1's script builder, sound map, ticker and report do not exist
  yet; `docs/12` records what each must do with `ability`. Choices where the specs are silent
  are in `docs/04` ("Choices the Phase 6b.2 build spec left open").

## Phase 6b.3: Ten new chassis, monthly summons, the Phoenix's reform, presets, duels, the matrix (done)

The last of three Phase 6b steps (the 2026-10-21 pretender build spec, E.1; at the owner's
direction, "good options for pretenders like Dominions has", with the owner's answers of
2026-10-21: scope approved, realms, Avatar only by boon, no Iron Will, Latin names, the name in
the sim).
- Content: the ten chassis of A.2 and A.4 with their bodies, in `docs/05` Step 1's order
  (generic, Red, Green): Ascended Hero (Avatar built in), Primordial (at least dormant; Fear),
  Ash Phoenix (flying, fire shield 5, Growth attunement, reform 90 days), Pyre Lord (Kindle the
  Host), Cinder Idol (immobile, unarmed, Dread attunement, 2 Fire Sprites a month to 20), Ember
  Hierophant (spell power 3, no research), World Tree (immobile, regeneration, Sanctity
  attunement, one G spring), Horned Hunter (Call the Hunt, Fury attunement), Elder Wyrm
  (wingless, regeneration) and Mother of Beasts (2 Wolves a month to 24); A.4's prices, stats,
  weapons (one `Trample` record, dmg 2, 2 strikes, size 2 or less, on the Primordial and the
  Elder Wyrm) and A.11's `aiPower`. The six presets of A.8 after the old six
  (`PRESETS_PER_NATION` 6, `findPreset`). `UnitDef.plural` ("Wolves") for messages. Validation:
  a chassis is an idol exactly when its body is immobile (the AI reads the role), a monthly
  summon's count is at most its body's leadership, reform days are a whole number ≥ 1, a plural
  is not empty.
- Sim: N7 `monthlySummons` (`src/sim/pretender.ts`, with `nationStock`) in tick step 3 after the
  pretenders settle; N8 in `commanderDies` (`reformDays`) and `settlePretender` (the return
  day, "rises again"); `eliminate` clears a reforming god for good before its commanders die,
  and cancels a return already promised, in the same tick included (a Phoenix falling in the
  storm of its last fort), with "Ysolde will not rise again." before the fall.
  `NationState.pretenderReturnDay` came with 6b.1's save step, so no `STATE_VERSION` step.
- AI (`src/ai`, step 10 only): `pretenderRole(state, c)` reads `ChassisDef.role` (idol:
  ritualist; mage: researcher if its body may research, else rider; raider: hidden if
  stealthy, else rider; the rest: rider; Phase 7's `fighter` is now `rider`); in
  `handOffSquads` the pretender keeps troops of its monthly-summon unit up to that summon's cap,
  whatever their source, so they stay bound to it (N5), and splits off the rest for the
  garrison (the Cinder Idol's own Call Fire Sprites rituals above 20). With the six chassis of
  Phase 6 each role gives Phase 7's reading, so the defaults play as before.
- Scripts: `sim:aivai --presets cinderHorde:<id>,thornwood:<id>` (`parsePresets`; `playedSetup`
  and `runnerOrder` in `match.ts`, `runnerSetup(s)` take the chosen presets) and `--matrix`
  (`src/ai/matrix.ts`: the defaults, then every other preset against the opposing default,
  seeds 1 to 20 in both nation orders, a win table with the 35% to 65% band); `sim:duel`
  (`scripts/duel.ts` on `tests/sim/battle/fixtures/duel.ts`): A.10's table on the real
  resolver over 400 seeds, and `--calibrate`, which measures each chassis's Light Infantry
  equivalent over 200 seeds and rewrites `aiPower`.
- Tests: `tests/sim/pretender.summon.test.ts` (N7's list: day 30 at strength 1, foreign and
  neutral dominion, day 0, transit, Godless and asleep, the nation-wide cap with handed-off
  wolves, Call of the Wild and the garrison holder's wolves, leadership, the Idol's supply,
  binding in battle, tick step 3 after the settle (a dormant Mother's arrival day) and the
  365-day hash, no effect without a summon), `tests/sim/pretender.reform.test.ts` (N8's list:
  day + 90 with a fresh commander, the name and the capital link, foreign, neutral and
  strength-0 deaths, only the Phoenix, a lost battle, Godless and a lost capital, a second
  death, incarnate blessings away, elimination standing, reforming, and in the storm of its
  last fort, the save), `tests/sim/battle/duel.test.ts` (every duel cell within 15 points of
  its measured value, the spec's named targets, what binding is worth, the Avatar rows' god
  stats equal to the sim's Avatar, and every chassis's `aiPower` equal to what `--calibrate`
  writes), `tests/ai/matrix.test.ts` (`--presets` parsing and refusals, whole preset ids only,
  the default runner unchanged, pairings, setups, the tally with the band's inclusive edges
  and summed refusals, the table with an out-of-band row, each new preset's first matrix games
  for a year with no refusal); the Mother's wolves and the Idol's split above the cap in
  `recruit.transfers.test.ts`, the transfer half of `recruit.test.ts`, split off with the
  shared helpers in `recruitFixtures.ts` when the file passed 400 lines; the empty plural in
  `units.test.ts`; the new
  presets' designs, costs, blessings and 365-day determinism in `presets.test.ts`; every new
  body, weapon, trait and ability in `units.test.ts` and `abilities.test.ts`; every new chassis
  record, the parity snapshot and the new checks in `validate.chassis.test.ts`, whose preset
  half moved to the new `validate.presets.test.ts` (the file had passed 400 lines); realms,
  prices, attunement, the Primordial's sleep, the Tree's spring and the Hero's Avatar in
  `pretender.design.test.ts`, `createGame.test.ts` and `setup.bless.test.ts`; the role step in
  `roles`, `faith`, `magic`, `assess`, `recruit` and `military` tests (`makePretender` in
  `tests/sim/fixtures.ts` sets the design's chassis with the commander). 1662 tests in 106
  files before, 1778 in 112 after (1770 in 111 before the review fixes below).
- Behavior guard: `tests/sim/battle/golden.json` is byte for byte unchanged and its test
  passes; the six Phase 6 presets' pins (`presets.test.ts`) pass; `npm run sim:aivai -- --games
  20 --seed 1` gives Cinder Horde 10, Thornwood 9, no winner 1, mean 26.8 months, 0 refused
  commands, as before. Measured without wilds, before Phase 1b made them the default; since
  then `--wilds off` plays these same games, and the default runner's, with wilds, are under
  Phase 1b below.
- Measured duel bands (`npm run sim:duel`, seeds 0 to 399; win % against weak plains / plains /
  hills / forest / mountain; immobile bodies defend): Oracle 0/0/0/0/0, Titan 40/2/0/11/0,
  Great Wyrm 100/100/75/100/5, Living Monolith 100/100/100/100/31, Ascended Hero 15/0/0/3/0,
  Primordial 100/100/73/100/14, Ash Colossus 92/60/2/68/0, Ash Phoenix 56/12/3/27/0, Pyre Lord
  65/22/18/43/5, Cinder Idol 100/100/51/100/0, Ember Hierophant 0/0/0/0/0, Wild Spirit
  1/0/0/0/0, World Tree 100/100/100/100/100, Horned Hunter 78/49/18/56/5, Elder Wyrm
  100/100/56/100/14, Mother alone 8/0/0/1/0; Hero with Avatar and R4 16/0/0/3/0; Mother with 6,
  12 and 24 bound wolves 60/29/2/34/2, 92/72/16/72/6, 98/89/66/90/38, with 12 led wolves
  32/14/7/17/2; Titan + 20 Cinder Warriors 65/43/53/57/21; Hero + 20 Cinder Warriors
  42/19/23/57/9; Titan + 20 Wardens 96/82/75/87/38; Mother + 12 bound wolves + 20 Wardens
  100/95/81/99/52. The spec's targets, all met: Great Wyrm hills 75 (60 to 90); Primordial
  hills 73 (58 to 88) and mountain 14 (at most 32), never more than 15 ahead of the Great Wyrm
  (at most 9); Elder Wyrm hills 56 (42 to 72); Mother with 12 bound wolves plains 72 (57 to
  87); Horned Hunter plains 49 (32 to 62); Ash Phoenix weak plains 56 (41 to 71). Against the
  spec's approximated table, every shared cell is within 3 points (the Primordial's mountain
  falls from 17 to 14 with the real size limit) but one: the Mother with 12 bound wolves and
  20 Wardens wins 52% on the mountain, not 42%, with the wolves led and bound rather than
  staged leaderless. `--calibrate` reproduces A.11's n for all sixteen chassis, so no `aiPower`
  moved.
- Preset matrix without wilds (`npm run sim:aivai -- --matrix`, measured before Phase 1b made
  wilds the default; with wilds under Phase 1b below; seeds 1 to 20 in both orders, 40 games a
  row, 440 games, 0 refused commands, 379 s): baseline Warlord against Elder Oak 24 to 13, 3
  without a winner; each preset's share against the opposing default: Ember Oracle 57%,
  Wildfire 83%, Deep Root 10%, Wyrm of the Loam 43%, Undying Flame 80%, Pyre Host 80%, Dread
  Idol 75%, Heartwood 18%, Hunt Lord 30%, Mother of the Pack 23%. Only Ember Oracle and Wyrm of
  the Loam are within 35% to 65% (below, under known issues). Dread Idol stood at 80% (32 to
  8, mean 24.7 months) before review finding F3 had the Idol hand on its sprites above 20;
  it is now 30 to 8, 2 without a winner, mean 31.3 months, and no other row moved.
- Deviations from the build spec: the matrix plays every non-default preset (ten rows, the
  spec names the six new ones) plus the defaults as a baseline row, each seed in both nation
  orders; `docs/08`'s "raiders ... or take weak provinces alone" is not built (a god never leads
  a group until `aiPower` joins `armyPower` in Phase 8, so the Ash Phoenix rides with an army
  and the stealthy Wild Spirit stays home as in Phase 7); the AI keeps troops of the
  monthly-summon unit with the pretender up to the summon's cap, whatever their source, and
  hands on the rest (the spec is silent, and handing them to the garrison would unbind them);
  an eliminated nation's reforming god is gone for good, a promised return cancelled with a
  message; `UnitDef.plural` is new; the duel fixtures use the real N1 abilities and N2 size
  limit, stage immobile bodies defending with Hold, and add a body-alone row for every
  chassis. The cut lines (E.3) were not applied:
  every duel band is met, and the matrix band, missed by two Phase 6 presets and by Pyre Host
  (on no cut line) as much as by the N7 and N8 bodies, is Phase 12's tuning target, not a
  measured band that cutting would meet.
- Review fixes (the 6b.3 review's confirmed findings): F3, the AI's pretender kept every squad
  of its monthly-summon unit, so the Cinder Idol hoarded 35 to 40 of its own ritual sprites
  in the capital; it now keeps that unit up to the summon's cap and splits off the rest for
  the garrison (measured without wilds: Dread Idol's matrix share 80% to 75%; no other row,
  and no game of the runner without wilds, moved).
  N8, a Phoenix dying in the storm of its last fort was promised a return in the tick that
  eliminated its nation; `eliminate` now cancels a promised return with "Ysolde will not rise
  again." (`godName` in `src/sim/pretender.ts` names a god no commander carries). F6, the
  matrix miss, stays for Phase 12 (known issues). New tests for the gaps the mutation run
  found: N7's place after the settle (a dormant Mother's arrival day), the garrison holder's
  wolves in the cap, the Mother keeping her wolves, the Idol's split above the cap, the rising
  message's capital link, the storm and reforming eliminations, the band's inclusive edges,
  summed refusals and the NO cell, whole preset ids only, the Avatar rows' stats against the
  sim's, and the empty plural. Each of their 17 mutants (the 11 survivors and 6 of the two
  fixes) now fails a test.

## Phase 1b: Impassable terrain (done)

Two commits (war-table design, section 1, 1.3 to 1.9; the owner's direction of 2026-10-21:
"i want to make sure the maps have some impassible terrain that is noticeable"; the form was
offered to the owner as the default on 2026-10-22). Wilds are named mountain massifs (peaks)
and dark lakes (meres): map cells that are not provinces. Commit A built, validated and tested
them behind a switch, off everywhere; commit B, the owner-decision commit, turns them on.

### Commit A: wilds behind a switch
- Content: `WILD_KINDS` (`peaks`, `mere`), `WildKind` and `WILDS` (ranges per 20 provinces,
  the kind cycle, cell weights, the capital and separation guards, the detour, seed tries) in
  `content/mapgen.ts`; `WILD_NAME_PARTS` in `content/names.ts`. `MAPGEN.balanceCandidates`
  stays 6 (10 in commit B).
- Mapgen: `MapGenParams.wilds` (optional, false everywhere); `MapData.wilds: MapWild[]`, the
  map's last key, always `[]` while off; `WildId` (`w0`, `w1`, ... from a counter local to
  mapgen; `ID_PREFIXES.wild`). New `wilds.ts` (`planWilds`, `placeWilds`, `nameWilds`,
  `buildWilds`) and `validateWilds.ts` (called by `validateMap` when wilds are on). With wilds
  on, `generate.ts` plans the ranges first, sizes the map for every cell, places capitals on the
  full cell graph, samples the noise at every site, places the ranges, and builds the provinces
  from the remaining cells in site order. `geometry.ts` gained `segmentDistance`,
  `touchesOutline`, `sharedEdgeLength` and `wildOutline`; `graph.ts` blocked-node searches,
  `connectedWithout`, `cutVertices` (Tarjan, iterative) and `maxPairDistance`.
- Sim and AI: `GameSetup.wilds` goes through `createGame` to the generator. `STATE_VERSION` 4,
  whose migration (`src/sim/migrate.ts`, 3 to 4) sets `state.map.wilds ??= []`. No rule code
  changed: every reader of adjacency walks `MapProvince.neighbors`, which never holds a wild,
  and `tests/sim/adjacency.guard.test.ts` keeps `src/sim` and `src/ai` from reading map geometry
  or the wilds. `playedSetup`, `runnerSetup`, `runnerSetups` and `matrixSetups` take `wilds`
  after Phase 6b.3's chosen presets, so a runner setup carries both; `RUNNER_DEFAULTS.wilds` is
  false, and `npm run sim:aivai` gained `--wilds on|off`, which applies to `--presets` and
  `--matrix` runs too.
- Bit identity: the 30 map hashes (seeds 1 to 5 x Small, Medium, Large x 2 and 4 nations) were
  recorded from the generator at `ec9a907` before the first line of the change, and checked
  again against a clean export of `ec9a907`. `tests/mapgen/generate.identity.test.ts` matches
  them with `wilds` absent and false. The six presets' game pins (`presetPins.ts`, which now
  also strips the empty `map.wilds`) still match, so the AI plays exactly as before.
- Tests: `tests/mapgen/wilds.test.ts` (plan, names, records, and Small maps),
  `wilds.medium.test.ts` and `wilds.large.test.ts` (seeds 1 to 30 with 2, 3 and 4 nations,
  wilds on, through `wildChecks.ts`: `validateMap` empty, exact count and terrain shares via
  `playable.ts`, interior cells 3 cell hops from capitals and other ranges, borders from the
  drawn polygons, one outline loop, no cut province, detours of at most 6, unchanged capital
  rings, each province's site inside its own polygon, determinism), `wilds.place.test.ts`
  (`placeWilds` called directly, with no `validateMap` behind it: scores, ties, peaks before
  meres, each guard including a later range stretching an earlier one's way around, the
  fallbacks to the next neighbor and the next seed, `WILDS.seedTries`, and every guard checked
  by plain BFS on 12 real province graphs), `wilds.pins.test.ts` (sha256 of 20 wild maps,
  re-pinned in commit B), `validateWilds.test.ts` (each new check fires on a hand-broken map;
  a way around of exactly 7 is rejected and one of exactly 6 accepted), `generate.perf.test.ts`, `geometry.test.ts` and `graph.test.ts` additions (cut vertices
  against brute force), `tests/sim/movement.wilds.test.ts`, `visibility.wilds.test.ts`,
  `rituals.wilds.test.ts`, `dominion.wilds.test.ts` (on a Medium map with wilds: paths, sight,
  `withinHops`, ritual targets and spread go around a wild, never across), the version 3
  migration in `migrate.test.ts` (plays 40 days on to the same hash),
  `tests/ai/match.wilds.test.ts` (runner games on wild maps for three years, no refusal,
  deterministic; with chosen presets and in the matrix, the setups carry both) and content
  checks. 1778 tests in 112 files before, 2193 in 126 after (built first on Phase 6b.2: 1662
  before, 2076 after).
- Joined with Phase 6b.3 (built on Phase 6b.2, then rebuilt on Phase 6b.3): no 6b.3 test pinned
  a hash of a whole state (the preset pins strip `map.wilds`, and the summon, reform and
  determinism tests compare two runs of one build), and `tests/sim/battle/golden.json` is
  unchanged. Two 6b.3 tests named what this commit changes: `matrix.test.ts`'s written-out
  Phase 7 runner setup now carries `wilds: false`, which plays the map it played without the
  key, and `pretender.reform.test.ts`'s save test expects `STATE_VERSION` 4, the 3-to-4 step
  as the only one after 6b.1's, and the return day kept through it (its name said "with no
  new save version"; it now says "with no save step of its own", as Phase 6b.3 added none).
- Mutation review: the 30-seed sweeps cannot catch a placement bug, because `generateMap`
  throws away any attempt `validateMap` rejects and tries again; 31 of 68 hand-made mutants
  of `wilds.ts`, `validateWilds.ts`, `generate.ts`, `graph.ts` and `migrate.ts` passed the
  first suite. With `wilds.place.test.ts`, `wilds.pins.test.ts`, the new validation cases and
  the site check, 65 are caught. The other three are equivalent: the `minNeighbors` check in
  `keepsMapWhole` off by one (while `minNeighbors` is 2 the cut-vertex test refuses the same
  cells; a comment says so), wild names checked against no province names (the two name sets
  share only "Stormcrown", and `validateMap` rejects that clash), and the 3-to-4 migration
  with `=` for `??=` (a version 3 map has no wilds).
- Measured (seeds 1 to 10, wilds off then on, balance search at 6; mean, median in ms): Medium
  2 nations 18, 19 then 36, 19; Medium 4 nations 209, 238 then 262, 363; Small 2 15, 16 then
  26, 18; Large 4 306, 338 then 538, 534. At 10 candidates (commit B), Medium 4 nations is 409
  mean, 599 median, 707 max, within the 1,000 ms test. Wild cells are 8 to 10% of the province
  count and 33 to 41% of provinces border a wild; no map failed.
- Deviations from the design: `wildOutline` lives in `geometry.ts` (1.3) although the docs/06
  layout block lists the outline under `wilds.ts`, and the wild checks have their own module,
  `validateWilds.ts`, so `validate.ts` stays small; the layout lists both. The tests of 1.9 sit
  in their own files beside the module tests (`*.wilds.test.ts`, `validateWilds.test.ts`), and
  the 30-seed sweeps are split per size. A range's cell count is checked against its kind's
  weights (peaks 1 to 3, meres 1 or 2). `WILDS.seedTries` counts seeds that pass every
  eligibility test, the whole-map test included. docs/06 also gained the Wilds implementation
  decision, and docs/08 the runner's `--wilds` flag.
- Left for commit B: New Game and `sim:aivai` default to wilds on, `balanceCandidates` 10, the
  docs/01, docs/09-balance and docs/10 text, any re-pins (`wilds.pins.test.ts` must be
  re-pinned, since 10 candidates pick other wild maps), and the matchup row. Rendering,
  tooltips, the Codex page, labels and the palette tests come with Phase 8 (1.10).

### Commit B: impassable terrain on (owner decision 2026-10-21)

- Defaults: `createGame` makes the map with wilds unless `GameSetup.wilds` is false (it was
  on only when true), so New Game, which builds its setup without the switch (Phase 9), gets
  them; `RUNNER_DEFAULTS.wilds` is true, so `npm run sim:aivai` has them unless `--wilds off`.
  `MapGenParams.wilds` stays off unless set: the generator's own default does not change.
  `MAPGEN.balanceCandidates` 6 to 10.
- Re-pins, file by file, each for what a wild map or the balance search changes and nothing
  else:
  - `tests/mapgen/generate.identity.test.ts`: the wilds-off hashes are now those of a clean
    export of `ec9a907` with `balanceCandidates` set to 10; all 30 match it. 27 equal the hashes
    recorded at 6; small-4-4, medium-4-5 and large-4-1 had no map within 1.5 among their first
    6 valid candidates and now keep a more even one (ratio 1.784 to 1.412, 1.556 to 1.139,
    2.157 to 1.647); the file's header keeps the start of their 6-candidate hashes. `ec9a907` at 6
    still reproduces all 30 recorded hashes.
  - `tests/mapgen/wilds.pins.test.ts`: 7 of 20 re-recorded (small-4-2 to 4-5, medium-4-1, 4-2
    and 4-4); each new map is more even than the one picked at 6 (for example small-4-3 2.294
    to 1.674). The 13 others, all the 2-nation pins among them, are unchanged.
  - `tests/content/presetPins.ts`: the pinned setups set `wilds: false`. The pins were computed
    before wilds, so they compare only on the map without them; with it they still match, so
    the presets play exactly as before (the runner's Medium maps without wilds did not move
    with 10 candidates: 0 of 200).
  - `tests/sim/migrate.test.ts`: the saves of versions 1 to 3 come from a game without wilds
    (`redField(1, false)`), since those versions predate wilds; the current-save test now uses
    a wild map.
  - `tests/sim/pretender.play.test.ts`: the Monolith's lost battle moved from seed 1 to seed 3.
    On seed 1 with wilds the capital's guarded neighbors are plains, wasteland and forest, where
    it routs the guards and wins; seed 3's first is mountains, where they hold for 50 rounds as
    seed 1's swamp did. The test now asserts the terrain.
  - `tests/ai/armyFixtures.ts` and the tests built on seed 1's provinces
    (`defense.test.ts`, `defense.relief.test.ts`, `defense.escort.test.ts`, `war.test.ts`,
    `war.targets.test.ts`, `military.test.ts`, `economy.test.ts`): moved to seed 1's map with
    wilds by role. Red's capital is p42 (was p48); p19 borders the capital and both other
    neighbors (was p17), p15 the plains neighbor (p50), p29 the other (p57); the front is p10
    beside Green's p2 (p45 and p3); the spring field is the Wellspring p3 with p2 and the road
    p15, p10 (p51, p42); the denial Wellsprings p3 and p43 (p51, p55); p58 stands next to
    Green's capital p57 (p33 next to p59). Where the role reads the index order the expectation
    moved with it: the first exit, the sally's way out, is now p15. Three scenarios needed more
    than a new id: no province within 2 hops of the new capital is as near two exits, so the
    gather tie uses p6 with all but Green's corner annexed (21 days to p15 and to p19); the
    "value against path days" test's far province is p56 behind a 24-day road with the near
    p10 set to 19,000 people (p10 has 6,400, below the far one's 21,000 by more than the
    discount); and `economy.test.ts` takes E and S as the capital's third and first neighbors
    (p29 beside Thornwood's p40, p15 beside the strong p10), since its first neighbor now has
    no province beyond the capital's ring. The lab test in `economy.test.ts` (p50, p51) and the
    comment in `assess.test.ts` (12 troops) still hold on the new map, so they are unchanged.
  - `tests/ai/match.test.ts`, `match.wilds.test.ts`: the runner defaults to wilds; createGame's
    default with no switch equals the runner's setup; the wilds-off comparison asks for off.
  - New: `tests/sim/createGame.test.ts` checks the default and `wilds: false`;
    `tests/sim/fixtures.ts` gained an optional `wilds` for `twoNationGame` and `redField`.
- Runner (`npm run sim:aivai -- --games 20 --seed 1`): before (commit A, no wilds) Cinder Horde
  10, Thornwood 9, no winner 1, mean 26.8 months, 0 refused; after (wilds) Cinder Horde 17,
  Thornwood 3, no winner 0, mean 23.6 months, 0 refused, 15.5 s, AI 1.28 ms mean and 46.6 ms
  max per call (a re-run gave the same games with 8.8 ms max, so the 46.6 was the shared
  machine; 11.1 and 12.2 ms without wilds). With `--wilds off` commit B plays the before games
  exactly (10, 9, 1, 26.8 months). Rebuilt on Phase 6b.3 (below), both runs replay game for
  game: with wilds 17, 3, 0, 23.6 months, 0 refused (18.6 s, AI 1.55 ms mean, 21.0 ms max per
  call); with `--wilds off` Phase 6b.3's 20 games (10, 9, 1, 26.8 months). The same 100 seeds
  (3000 days, measured before the rebuild on Phase 6b.3) side by side, from an instrumented
  copy outside the repo: wilds on 77 / 20 / 3, mean 28.0
  months; off 70 / 28 / 2, mean 24.9; 0 refused either way; Thornwood's share of decided games
  21% against 29% (Fisher exact p = 0.24). Nation commanders that died with no friendly
  province to retreat to: 13 with wilds, 7 without (independents, which never retreat, about
  2,870 and 2,810). docs/09-balance has the rows.
- Docs: docs/01 §2's rule and the Adjacency and Terrain bullets, and its "Wilds (Phase 1b)"
  decisions, which quote the owner and record the default offered on 2026-10-22 (with one
  sentence changed from the design's block: wilds off reproduces the earlier maps step for
  step, but the balance search now has 10 candidates); docs/09-balance rows dated 2026-10-22
  and the matchup under the checklist; docs/10's Phase 1b section; docs/06 and docs/08 lines
  that said the default was off. The design's other docs blocks (docs/10's Phase 8 to 12
  additions and acceptance criteria, docs/09-balance's map presentation table and its
  playtest line, docs/06's present/ and render/ layout, docs/07, docs/09-art, docs/12) were
  left for the phases that build them; they landed early instead, in the docs-only commit
  below.
- Joined with Phase 6b.3 (built first on Phase 6b.2, then rebuilt on Phase 6b.3, whose numbers
  were all measured without wilds): the 6b.3 tests were read against the new default by the
  rule above (pins and replays computed before wilds turn wilds off; scenarios move by role).
  None names a province or a seed's layout: its provinces come from roles (the capital, its
  neighbors, the first independent province), so they hold on the wild maps. Four changed:
  - `tests/ai/matrix.test.ts`, "leave the default runner exactly as it was without them": the
    written-out Phase 7 setup is a runner replay pinned before wilds, so it is compared with
    `runnerSetups(1, 20, [], false)`; the default now differs from it only by `wilds: true`,
    which the test also checks.
  - `tests/ai/matrix.test.ts`, "plays each Phase 6b.3 preset’s first matrix games for a year
    with no refused command": with wilds four of seed 1's twelve games end by Wellsprings on
    days 300 to 350 (seeds 2 and 3 have five and two such games; without wilds all 36 last the
    year), so a year cannot be played on the wild maps of the first seed. The test keeps seed 1
    without wilds, and a new test plays the same games on the default maps with wilds: no
    refused command, and the full 360 days unless a nation wins.
  - `tests/content/presets.test.ts`: the six 6b.3 presets' 365-day determinism plays through
    `gamePin`, now on the pins' map without wilds (`presetPins.ts`); a comment says so. After
    the join's review, a new test plays the same games (seed 11, each preset against the
    opposing default) twice on maps with wilds and compares their hashes and logs, so the AI's
    play of the new presets is checked on the default maps too.
  - `tests/sim/pretender.reform.test.ts`, the save test (after the join's review): its saves of
    versions 2 and 3 predate wilds, so they come from the same game on a map without them
    (`phoenixGame` takes the switch), and the version-3 save lifts to that game's return day
    and hash; the save of the current version stays on the default map with wilds.
  - Checked and unchanged on the new default: `duel.test.ts` (battles only; its Avatar row reads
    a god at its capital), `pretender.summon.test.ts` and the rest of `pretender.reform.test.ts`
    (the god at its capital, an independent province, a guarded neighbor, all by role), the
    role, recruit, faith, magic and assess tests, and `createGame.test.ts`'s World Tree spring.
    The 6b.3 review's 17 mutants and the 77 of its first mutation run were run again on this
    commit and on Phase 6b.3 itself: all 17 and the same 66 of the 77 are killed on both (the
    other 11 survive or no longer apply on both, as in that run).
  - Re-measured on the new default: the preset matrix with wilds (`npm run sim:aivai --
    --matrix`, 440 games, 0 refused, 400 s on a shared machine): baseline Warlord 34, Elder
    Oak 6, none without a winner; Ember Oracle 60%, Wildfire 70%, Deep Root 10%, Wyrm of the
    Loam 23%, Undying Flame 80%, Pyre Host 80%, Dread Idol 73%, Heartwood 20%, Hunt Lord 20%,
    Mother of the Pack 23%, so only Ember Oracle is within 35% to 65% (two without wilds).
    `npm run sim:duel` is battle-only and prints exactly Phase 6b.3's table.
  - Docs: Phase 6b.3's runner and matrix numbers, here and in docs/09-balance, say they were
    measured without wilds; docs/08's sentence on the runner without `--presets` now says it
    plays the setups of before Phase 6b.3 but for the map (with wilds by default, exactly as
    before with `--wilds off`).
- Tests: 2193 before, 2196 after (three new: the createGame default, the 6b.3 presets' first
  matrix games on the default wild maps, and their year played twice on maps with wilds).
  Built on Phase 6b.2 the commit went from 2076 to 2077.

## Docs: layered UI spec and war table art direction (docs only)

- The layered UI spec (2026-10-21, staged as `ce9bfb2`) and the war table design's remaining
  docs text landed ahead of the phases that build them: docs/07 (the rewrite, with the war
  table's map, modes, fog, table and camera, portraits, settings and `Z`), docs/09-art (Icons,
  UI chrome with the oak and brass tokens, and five new sections), docs/10 (Phases 8 to 12,
  criteria 3, 4 and 14, new criterion 17, the out-of-scope sound line), docs/06 (layout,
  saves, performance, decisions), docs/01 §14 (Incursions), docs/09-balance (the UI rows, the
  "Map presentation" table, a playtest line) and docs/12 (two portrait lines). Where the two
  designs overlap, the war table's text is the later decision. No code changed.
- Open: docs/07's replay keys and settings (Space, 1 to 4, ← →, Home and End, `[` `]`, D, C, H)
  differ from docs/12 S4.7 and S4.8 (N, B, S, M, L, Tab; Beats mode), and docs/07's Pretender
  Design section still describes three columns while criterion 16 and Phase 9 describe the
  six-step designer (the pretender design's section D comes through the UI track). Phase 10
  and Phase 9 settle them.

## Docs: reconcile after Phase 1b (docs only)

- Read docs/01, 06, 07, 09-art, 09-balance, 10 and this file against each other and the code
  (`STATE_VERSION` 4, `balanceCandidates` 10, wilds on in the runner and New Game). Fixed: the
  palette rule no longer asks the two wild grounds (about 4 apart, never touching) to differ by
  20, and its wild checks are marked as Phase 8's; Phase 10's migration list names Phase 8's
  step; docs/06's layout names `content/ui.ts`, the wild name parts, `generate.ts`'s wilds and
  `tests/sim/battle/`; docs/09-balance says which rows run ahead of their code and which runner
  maps moved; the known issues here give the 10-candidate search, the runner with wilds (20 of
  20 by Wellsprings, mean 23.6 months), game 18 without wilds, and 5 as the next save version.
  The two open conflicts above stay open. Runner from seed 1: Cinder Horde 17, Thornwood 3, 0
  refused. Rebuilt on Phase 6b.3 the same reading holds (the runner replays game for game);
  the known issues also say how Phase 6b.3 was joined.
- After the join's review: docs/09-balance's AI expansion reach and gold reserve rows (Phase 7)
  say they were measured without wilds and give the readings on the default maps with wilds,
  re-measured by the behavior tests' rules over the 20 runner games from base seeds 1, 101 and
  1001: at day 360 each nation owns at least 12, 12 and 10 provinces with wilds (13, 12 and 13
  without), and the longest run of an empty capital queue with gold above 200 is 10, 7 and 10
  days with wilds (8, 5 and 6 without). The reserve row's 7 days came from before Phase 7's
  review fixes; it now gives the 8 measured after them, as Phase 7 above has it.

## Docs: the Three Kingdoms record and the long session (docs only)

- `docs/design/three-kingdoms.md` (2026-10-23, commits `502ce19`, `66179fe`, `986dcd1`) is a
  proposed design record: what the Romance of the Three Kingdoms series does with officers,
  rulers and cities, and how it fits a game that does not revolve around them. It was written
  against this branch (Phases 0 to 7, 1b, 6b and 10 S1), then thinned after a research pass
  across RTK XI, XIII, XIV, the RTK 8 Remake, Nobunaga's Ambition: Awakening and Total War: Three
  Kingdoms (sources in the record). The owner settled its five open questions on their defaults
  and asked for the thinner shape (`three-kingdoms.owner-answers.md`, both directions quoted).
- The shape: Tier 1 is one prototype phase after Phases 8 and 9: named commanders with five
  rolled stats and traits from the abilities catalog, capture with recruit, ransom and release,
  automatic duels in the resolver, the god's Ascendancy rank with a field-army cap and three
  posts whose effects scale with the holder, fort governors with four fort-only developments,
  officer proposals in the alerts ribbon, comrade and grudge bonds, and Presence adding dominion
  checks. Nothing is a meter the player tends. Tier 2 (loyalty states, execution, the coalition
  rule with truce and alliance, Search and the tavern board, legends, ploys with the M2 nations)
  waits for a three-match playtest with two questions: did a named person make a story, and did
  officer pauses outnumber army pauses. Tier 3 (officer play, hundreds of officers, slots on
  every province, tribute and marriage, monthly meters, aging) is out or kept for the long
  session. The record lists the state, command, AI and content additions, five runner lines for
  docs/09-balance's checklist, and keeps Tier 1's data shapes open-ended.
- `docs/00-vision.md` (`acc56be`, `4ea72bd`) now says the 45 to 75 minute match ships first and
  the ideal full session will become 15 to 20 hours (owner direction, 2026-10-23). Its scope
  ladder gains a gated "M1, Phase 9b" row for the officers prototype (built after Phase 9,
  played for three matches, shipped in M1 only if the playtest says so, not an acceptance
  criterion) and an M5 row for the long session that builds on Phase 9b with the record's Tier
  2, scenarios, bigger rosters and an event deck. The record's section 6 lists what that unlocks: scenarios
  as the main replay lever, rosters of 30 to 60, an event deck, generations, wider diplomacy.
- The doc pass (2026-10-23, after the owner's "update" requests, one commit per doc): every
  numbered doc the record touches now carries its Phase 9b lines, each marked proposed and
  built only after Phase 9, gated on the playtest.
  - docs/10 (`da05c86`, `55d0cee`): Phase 9b, the officers prototype, after Phase 9 and before
    Phase 10 (the owner's third direction: "keep it before phase 10", so the duels are in the
    records the replay viewer is built on); not an M1 acceptance criterion; Tier 2 and 3 and the
    long session in the out-of-scope list.
  - docs/09-balance (`9a85a44`, `9faa0fc`): six checklist lines for the prototype (one capture
    and prisoner action per game, an elimination in 20, a 15-month spread, no prisoner held
    60 days, no refusal, the two playtest questions), and an Officers prototype table of 22
    design values ahead of their code (stat bounds and ranges, trait weights, rank steps,
    capture and duel numbers, Ascendancy, the field cap, posts, governor effects, developments,
    Presence in spread, proposal limits, the recruit contest, ransom, the AI thresholds and
    the `mercy` and `pride` weights).
  - docs/06 (`d2532de`): the new modules in the layout (`sim/officers.ts`, `sim/proposals.ts`,
    `commands/officers.ts`, `content/officers.ts`), `bonds` and `proposals` on `GameState`, the
    six commands with the `govern` order and the field cap on `move` (in `validate` only), the
    save step after Phase 8's with its migration, and an Officers implementation decision.
  - docs/07 (`11f413b`): the Prisoner taken and Officer proposal alerts (the only alerts with
    buttons; at most 3 proposals open, 1 per officer per month; no auto-pause unless "Officer
    events" is on), the Commander panel's stats, traits, rank, bonds and post rows, the
    Ledger's officer columns, the Court modal on key K (Officers, Posts, Prisoners; no loyalty
    column before Tier 2), and the selectors and message kinds the sim exposes.
  - docs/08 (`f531c07`): steps 11 Prisoners, 12 Court, 13 Governors and 14 Proposals with
    their gates; duels and bonds need no step; five behavior tests over 20 runner games.
  - docs/04 (`fade357`): capture after `battleEnd` on the battle's rng (losing side only, never
    the pretender, a stormed fort captures everyone), the automatic duel before round 1 with
    its `moraleShock`, the events `duel`, `duelEnd`, `down` and `captured`, four required tests
    with the goldens unchanged when no Duelist or downed loser is present, and the decision
    placing the duel on the melee and landing code.
  - docs/01 (`a53eb3f`): the `Govern` order; Governors and developments under Buildings (the
    prefecture is the fort's material catchment; four effects per stat point; Granary, Market,
    Barracks and Shrine, one each per fort; pillage destroys the newest first); Presence and
    Shrine checks in the dominion spread sources.
  - docs/02 (`086cf32`): five ploy primitives (`officerLoyalty`, `defect`, `inciteRevolt`,
    `falseSighting`, `bribe`) with the Lore contest, landing with Phase 9b per owner decision 5
    while the loyalty ones do nothing before Tier 2; the Tier 2 ploys under the M2 Blue and
    Black rituals, Turn the Cloak as the first U/B hybrid, none for Red and Green; a decision
    placing them in the ritual pipeline.
  - docs/09-art (`41d269f`): the Court modal's portrait sizes, rank on the frame, post marks at
    the crown notch, the prisoner's dotted band and shackle, stat bars in brass, trait and bond
    chips, duellists in the replay docks; every mark frame-only so raster sets need no sidecar;
    new monoline icons for officers, the govern order and the developments.
  - docs/03 (`2c88faf`): `officer` ranges and `traitWeights` in the unit stat model; an Officer
    stat ranges section per nation, the four Independent Captain outfits, fixed summons, the
    flavor rule (no recruit range above 16), and the M2 nations' leanings.
  - docs/12 (`8598ee5`): the `'duel'` phase in the stored log; pacing rows for the duel (3.0 s
    plus 0.5 s per exchange, cap 7.0 s) and the capture beat in the outro; the walk-out,
    exchange, stagger and `moraleShock` choreography through the existing impact grammar, kept
    apart from S2.8's sampled sprite pairings; the challenge horn, crowd hush, gasp and roar
    with two recipes; the HUD's Duel chip, scrubber beat, duellist docks at 64 px, ticker lines
    and the result card's captured list; a decision that the exchanges are ordinary `melee`
    and `damage` events on one-member groups, so the goldens and equivalence tests stay
    unchanged and a named `duel` fixture joins the next fixture file.
  - `docs/design/README.md` (`8ccb464`): the record's row says its docs text has landed and
    where.
  - `docs/design/ui-spec.md` (`96643c1`), the one other design record amended, every item tagged
    [Phase 9b]: the two button alerts in 2.5; a new 3.6b Court section (a Ledger sibling on key K
    with Officers, Posts and Prisoners tabs, a where-each-detail-lives table with loyalty
    nowhere before Tier 2, the entry points, a depth audit of 4); `CourtModal`, `PostCard`,
    `StatBars`, `TraitChip`, `BondChip`, `ProposalAlert` and `PrisonerAlert` in 6.6; rows 13
    (seven officer selectors) and 14 (six message kinds) in 7.2; a 9.2 open-items row and a 9b
    row in the 9.3 build plan.
  - README (`cdfd03a`, `0cf5103`): docs/12 and PROGRESS in the documents table, a design records
    table, and a status line naming every phase done on this branch.
- Still no code changed. Every numbered doc, docs/12 included, now carries its Phase 9b lines,
  so the docs describe the prototype completely enough to build from; the
  record and `three-kingdoms.owner-answers.md` (three directions quoted) remain the source where
  a numbered doc is silent.

## QA sweep (2026-10-22)

The owner asked for any further issues and QA. A sweep for real defects (wrong results,
crashes, broken invariants, nondeterminism, validate/apply mismatches, rules against the docs,
saves that do not round-trip, AI refusals, perf cliffs) confirmed nine findings; all are fixed,
each with a test that fails without its fix (DOC-4, a docs fix, with a test of the assets).
Tests: 2196 in 126 files before, 2207 in 130 files after.
- **Sim inputs.** sim-1: `validateCommand` found the nation through the prototype chain, so a
  crafted log's `"constructor"` or `"__proto__"` passed as a nation and `setResearchColor`
  threw in apply; it now takes an own property only. sim-2: `createGame` accepted an unknown
  AI difficulty from JSON and the first day crashed; it now throws a `RangeError`. sim-3:
  `migrateState` returned a save from a newer build, or with no whole-number version, as if
  current; it now throws, so Phase 9's loader can say so.
- **Supply.** BM-1 and DOC-1: units that eat nothing (constructs and undead: the Fire Sprites)
  skipped healing along with starvation, so a wounded sprite squad stayed wounded for good.
  They now heal like fed units, as docs/01 says fed units do. This is the one fix that moved
  the runner's games (below).
- **Battle.** BM-2: retaliation shields burned, and life drain healed, for hits on a troop
  already felled that phase (`onFallen`), which deal no damage; now only hits that dealt
  damage count (docs/05, docs/02). The golden pin was regenerated for it: 9 of 150 entries
  (`fireShield` and `lifeDrain`) change their burns, heals and HP, not their draws, winners or
  rounds. BM-3: a Retreat in slot 5 was repeated after round 5; from round 6 the commander now
  takes its default action (docs/04 "Scripts"). docs/04 records both under "QA sweep".
- **Map generation.** map-1: the 8-start Wellspring search could stop 2 hops unfair on Small
  4-nation maps where fair sets existed (seed 6 with wilds, 16 without). It now searches again
  from every candidate while its result is unfair, drawing nothing from the rng, so maps whose
  first result was fair are unchanged (the 30 bit-identity hashes without wilds all hold). Two
  wild pins moved (small-4-3 and medium-4-3, from 1 hop unfair to fair), re-pinned in
  `wilds.pins.test.ts`. With 4 nations: 0 or 1 hop on Small seeds 1 to 120 with wilds (3 at 1)
  and on all sizes, seeds 1 to 60, without; 0 on Medium and Large seeds 1 to 60 with wilds.
  The retry runs in 6 of the 65 placements behind Medium 4-nation seeds 1 to 10 and none with
  2 nations; a follow-up made the search's cost evaluation cheaper with the same results, so a
  retry takes about 110 ms (145 before it), some 12% of those maps' generation time.
- **Docs and assets.** DOC-4: docs/09-balance and docs/09-art-direction asked 8 faces of every
  portrait set and the rig's pose for summoned commanders, while the shipped Salamander and
  Treant sets (owner-approved, round 2) have 4. The docs now take a summoned commander's set as
  complete at 4 faces, replacing its rig pose, which stays the fallback; the portraits README
  agrees. `tests/assets/portraits.test.ts` checks every set's faces, sizes and sidecars and the
  2 MB raster total (1,987,716 bytes, 12 KB to spare).
- **Test hygiene.** H1: the tests that time out at vitest's 5 s default under load and pass
  alone have explicit timeouts, each documented beside it: `generate.test.ts`'s sweeps 12 s
  ("medium with 3", 2.3 to 2.9 s alone), `wilds.large.test.ts` and `wilds.medium.test.ts` 10 s
  (their 4-nation seeds 1 and 2 take 1.7 to 2.3 s alone; Medium's seed 4 timed out once in this
  sweep's first full run, at a load average near 10), `determinism.test.ts`'s 365-day replay
  10 s (0.9 to 1.1 s alone; 4x would be under the default it has exceeded) and `siege.test.ts`'s
  storm test 10 s (1.8 s alone). H2: the tick budget now takes the fastest of three runs of
  the same 60 days (from copies of one game) and the two resolver budgets the fastest of three
  rounds of their five battles; no budget changed. The re-run pin already took the best of
  five, and `generate.perf.test.ts` takes the median of ten seeds; doubling its 4-nation work
  would bring it near its own 30 s timeout under load, so it is unchanged. H3:
  `tests/ai/match.test.ts` (435 lines) is split by topic into `driver.test.ts` (playDay),
  `driver.replay.test.ts` (replayLog) and `match.test.ts` (runMatch, the headless runner), with
  their helpers in `matchFixtures.ts`; the same 19 tests and assertions.
- **Runner**, `npm run sim:aivai -- --games 20 --seed 1`: before, Cinder Horde 17, Thornwood 3,
  no winner 0, mean 23.6 months (`--wilds off`: 10, 9, 1, 26.8); after, 16, 4, 0, mean 21.6
  months, 11.3 to 39.3 (`--wilds off`: 11, 9, 0, mean 23.5 months, 11.8 to 42.8); 0 refused
  commands in every run, and all 40 games end by Wellsprings. Only BM-1 moved a game: BM-2,
  BM-3 and map-1 each left all 40 games as they were. Over 100 games from seed 1 (3000 days),
  wilds on go 76, 23, 1 (before: 77, 20, 3) and wilds off 69, 30, 1 (before: 70, 28, 2), 0
  refused.
- **Preset matrix** with wilds (`--matrix`, 440 games), after the sweep: baseline Warlord 33,
  Elder Oak 7 (before 34, 6); Ember Oracle 50% (60%), Wildfire 75% (70%), Deep Root 5% (10%),
  Wyrm of the Loam 25% (23%), Undying Flame 88% (80%), Pyre Host 75% (80%), Dread Idol 80%
  (73%), Heartwood 15% (20%), Hunt Lord 23% (20%), Mother of the Pack 18% (23%); still only
  Ember Oracle within 35% to 65%; 0 refused commands. The matrix known issue below stands.
- **Known issues** below: resolved, the slow tests' timeouts (H1) and the 2-hop Wellspring maps;
  game 18 without wilds no longer stalls, though the Defense issue it showed stays; updated, the
  runner, lean, timing, fairness and `migrateState` items; added, the raster headroom with the
  summon-portrait choice for the owner, and the Wellspring retry's cost.

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

- Phase 6b.1 (`docs/05-pretender.md`, "Owner decisions" and "Implementation decisions"):
  realms replace "the nation offers all chassis"; the new-color price is per chassis (the
  Oracle's fell from 50 to 30 net); the fixed bless is now the blessing menu's default. Each
  nation offers five chassis until the ten new ones land in Phase 6b.3.
- Phase 6b.2 (`docs/04-battle.md`, "Pretender abilities and new battle rules" and the choices
  after it): `CombatStats.fireShield` is now `shields`; a summoned squad that breaks below
  morale 50 (Swarm's hornets under Dread or Fear) no longer drags its caster; the trigger id
  list is written out; burn ties keep S1's rule.
- Phase 6b.3 (`docs/05-pretender.md` decisions, `docs/08-ai.md` decisions): the Ash Phoenix
  reforms (the one exception to "gone for good"), but not for an eliminated nation, whose
  promised return is cancelled with "will not rise again"; monthly summons keep to the spec,
  with `UnitDef.plural` for their message; the AI's pretender step reads the chassis role (its
  `fighter` is now `rider`), keeps troops of the monthly-summon unit with the god up to the
  summon's cap and hands on the rest, and does not yet send a raider alone; the preset matrix
  covers every non-default preset in both nation orders.
- Phase 10 S1 (`docs/12-battle-presentation.md`, "Implementation decisions"): landing the hits
  lives in `battle/landing.ts` and the migration map in `src/sim/migrate.ts`, files the spec's
  S1.1 table does not list; the migration test is `tests/sim/migrate.test.ts`, mirroring the
  source, rather than part of `rerun.test.ts`; `golden.json` carries an outcome hash beside
  the spec's log hash.

## Known issues and open questions

- Resolved: Thornwood's capital Deepmoss is Forest. Capitals take their terrain from the
  nation, overriding the core rules' "Farmland or Plains" (see `docs/01-core-rules.md`).
- Capital neighborhoods are balanced to within 1.5x starting population on about 99% of
  2-nation maps. With 3-4 nations the generator keeps the most even of 10 valid maps (6 before
  Phase 1b), which with wilds is within 1.5x on 93% of 3-nation and 56% of 4-nation Medium maps
  (docs/09-balance); the others are above it. Revisit in Phase 12 if playtests show lopsided
  starts.
- Wellspring fairness is exact on 2- and 3-nation maps and within 1 hop on 4-nation maps. Before
  the QA sweep (finding map-1) the search could stop at 2 hops on about 1 in 100 Small 4-nation
  maps; it now retries from every candidate while unfair, and the measured 4-nation maps are at 0
  or 1 (QA sweep above). A 1-hop map may still have no fair set at all (Small seed 6 has none);
  nothing proves 1 hop is always reachable.
- A dead elevation noise field would not fail any test; terrain wiring is covered only by
  exact shares and clustering. Pinning one seed's terrain would catch it but would churn on
  every deliberate generator change.
- For later phases: `wellspringsToWin` (majority of Wellsprings) lives in
  `src/mapgen/placement.ts`; Phase 6 victory should reuse it. (Resolved in Phase 3: farmland
  and wasteland use the plains independent pool.)
- The UI should use `findPathFor` (not `findPath` from a leg's end) so previews match what
  move validation accepts. The AI does, through `pathsFrom` and `pathsWith` (Phase 7).
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
  Wellsprings, none by elimination, in a mean of 21.6 months (11.3 to 39.3) on the default maps
  with wilds, and all 20 without wilds too, in a mean of 23.5 months (11.8 to 42.8), since the
  QA sweep's Fire Sprite healing (finding BM-1). Before it: 23.6 months (11.3 to 43.0) with
  wilds; without, 19 in a mean of 23.0 months (11.8 to 33.2) and game 18 (below) reached the
  timeout. A claim takes 10
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
  18 without wilds (seed 18, `--wilds off`) shows the cost since War opens per target: by day
  600 Cinder Horde holds 35 of 60 provinces and Thornwood 5, and from then on all eight Cinder
  armies stand held in the provinces next to Thornwood's armies. The two independent
  Wellsprings (guards of 250 to 300 power, which one 80-troop army takes) are never attacked,
  so the game stalls until the timeout. With wilds, the default since Phase 1b, game 18 ends by
  Wellsprings in 26.0 months. Since the QA sweep's Fire Sprite healing (finding BM-1) game 18
  without wilds ends too (Cinder Horde by Wellsprings in 28.5 months), so no runner game shows
  the stall now; the Defense rule is unchanged. Phase 8 playtesting or Phase 12 should decide how
  Defense shares one threat.
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
- The AI's slowest call varies over identical runs (9 to 67 ms seen; garbage collection or
  warm-up), against a mean of about 1.2 to 1.8 ms on Medium and 2.3 ms on Large with three
  nations. The browser runs the AI inside a tick, so a long
  pause could show; no test times the AI.

- Phase 10 S1 lands as two commits (`docs/12`, S1.9): first the golden pin alone
  (`scripts/golden-battle.ts`, `package.json`, `tests/sim/battle/fixtures/named.ts`,
  `armies.ts`, and `golden.ts` beside it, `tests/sim/battle/golden.test.ts`, `golden.json`),
  which is green on the Phase 6 resolver and regenerates byte for byte there; then the rest.
- Serialize (Phase 9) must call `migrateState` on load; until then nothing runs the
  migration outside its test. Since the QA sweep (finding sim-3) it throws for a save it cannot
  read (newer than `STATE_VERSION`, or no whole-number version), which the loader should catch
  and show the player.
- For merging Phase 7 (AI) and later tracks over Phase 6b.1: `scaleStepCost` takes the
  chassis as its second argument, `PRETENDER_COSTS.newColorFirstPip` is gone (use
  `ChassisDef.newColorFirstPip`), `blessOf` takes the design and whether the god is on the
  map (`nationBless` for a nation in play), and new `ProvinceState`/`NationState` literals
  need `extraSprings`, `pretenderName` and `pretenderReturnDay`. A later `STATE_VERSION`
  step chains after the last migration (Phase 1b's 3-to-4 took 4, so the next takes 5); a
  field it adds goes last in the `createGame` literal too, where the migration appends it, so
  lifted saves hash like new ones.
- Phase 6b.1 leaves for later: `aiPower` is unread until `armyPower` moves into the sim
  (Phase 8); no AI picks blessings or boons (AI nations keep their default presets); the
  designer's "Recommended" blessings and the unspent-points display are Phase 9 UI (Thornhide
  and the bounds' nature-shield column, which waited for shields by element, landed in 6b.2).
  Incarnate blessings soften the "sleeping builds are strong" issue only for designs that pick
  them; the default picks still bless from day 0.
- For merging Phase 7 (AI) and later tracks over Phase 6b.2: `CombatStats` literals need
  `shields` (not `fireShield`), `size` and `spellPower`; `BattleCommanderSetup` literals and
  `group()` commander parts need `abilities`; `applyEffect` and the target planners take an
  `EffectSource`. Battle records made before 6b.2 load with a null re-run.
- Phase 6b.2 leaves for later: no shipped unit carries an ability, a multi-strike weapon or
  spell power, and no chassis a monthly summon, until the new bodies of Phase 6b.3; the
  battle presentation's handling of `ability` (script beat, sound, ticker, report) lands with
  S2 and S3. Abilities count toward nothing the AI reads (`aiPower` covers them from 6b.3).
- The timing tests (`tick`, the docs/04 resolver budgets, the re-run pin, and Phase 1b's
  `generate.perf.test.ts`) can fail when the machine is loaded by other processes; they pass
  when run alone. Since the QA sweep (H2) the tick and resolver budgets take the fastest of
  three runs, as the re-run pin takes the best of five, so a burst of load seldom fails them;
  sustained load still can, `generate.perf.test.ts` most (its 4-nation median is about 600 ms
  alone against 1,000 ms). Resolved in the QA sweep (H1): the tests that timed out at
  vitest's 5 s default in loaded full runs and passed alone (`siege.test.ts`'s 60-game storm
  test, 1.8 s alone; `generate.test.ts`'s sweeps, "medium with 3" 2.3 to 2.9 s;
  `wilds.large.test.ts`'s and `wilds.medium.test.ts`'s 4-nation seeds, 1.7 to 2.3 s, Medium's
  seed 4 having timed out once at a load average near 10; `determinism.test.ts`'s 365-day
  replay, 0.9 to 1.1 s) have explicit timeouts of 10 to 12 s, documented beside each. A full
  run that fails one of these and passes it alone has met load, not a regression.
- Preset matrix (Phase 6b.3, for Phase 12), measured without wilds: 8 of 10 presets miss the
  35% to 65% band against the opposing default (Wildfire 83%, Undying Flame and Pyre Host 80%,
  Dread Idol 75%; Deep Root 10%, Heartwood 18%, Mother of the Pack 23%, Hunt Lord 30%). The
  default pairing itself leans Red when each seed is played in both orders: Warlord 24, Elder
  Oak 13, 3 without a winner, of 40. The runner's 20 games, one order per seed, split 10 to 9;
  the other order of the same seeds went 14 to 4, 2 without a winner, so the nation's slot
  matters as much as the preset.
  Read against that baseline, the three new Red presets add 15 to 20 points to Warlord's 60%,
  Hunt Lord matches Elder Oak's 33%, and Heartwood and Mother of the Pack trail it by 10 to 15
  (idols never fight in the field; the pack grows slowly). Phase 12 decides between prices,
  AI use of the new bodies, and the matrix's band, and should first remove the nation-order
  effect or score each preset against the same-order (or an order-balanced) default baseline:
  a 35% to 65% band against a 60% to 33% baseline cannot be met by presets of both nations
  (review finding F6; the cut lines would not meet it either). With wilds, the default since
  Phase 1b, 9 of 10 miss (only Ember Oracle, 60%, is in the band) and the baseline leans
  further, Warlord 34 to Elder Oak's 6 over both orders, so against its own baseline every Red
  preset trails Warlord and every Green one is within 8 points of Elder Oak (docs/09-balance).
- Phase 6b.3 leaves for later: `aiPower` is still unread (Phase 8 moves `armyPower` into the
  sim), so the AI cannot see a god's battle-start summons or Fear and never sends a raider god
  alone; A.10's expansion pace report and the nightly double run of the matrix are Phase 12;
  the presets' looks and identities are Phase 9. No preset uses the Ascended Hero, Primordial,
  Ember Hierophant or Elder Wyrm, so the AI plays them only in step tests. A full matrix run
  takes about 6 to 7 minutes (379 s without wilds; 400 s with them, on a shared machine).
- Phase 1b: the runner's matchup leans to Cinder Horde with or without wilds. Over 100 games
  from seed 1 (3000 days each, re-measured in commit B), wilds off give Cinder Horde 70,
  Thornwood 28 and 2 with no winner; wilds on give 77, 20 and 3. Thornwood takes 29% of decided
  games off and 21% on, a gap that is not significant (Fisher exact p = 0.245); neither run
  refused a command. The first 20 games (with wilds off 10, 9 and a timeout; with wilds on 17
  and 3) are a lucky sample for wilds off, whose games 20 to 99 go 60 to 19, so the lean is
  older than wilds. With wilds on by default, the 20 default games now fail the docs/09-balance
  check (3 of 20 for Thornwood). After the QA sweep's Fire Sprite healing (BM-1) the same 100
  seeds give, with wilds, 76, 23 and 1 (mean 25.1 months) and, without, 69, 30 and 1 (mean 24.6);
  the first 20 go 16 to 4 with wilds and 11 to 9 without; 0 refused commands. The lean holds.
- Balance, older than Phase 1b: the docs/09-balance checklist's "Thornwood beats Cinder Horde
  in roughly half of AI vs AI games" passed on its 20 default games without wilds (seed 1, 10
  to 9) only by sample, and fails with them (17 to 3). Over 100 seeds Thornwood wins 28 to
  Cinder Horde's 70 without wilds and 20 to 77 with them (an even split has binomial p = 3e-5
  and 5e-9). Not addressed here; the owner or a balance pass should weigh it.
- For merging later tracks over Phase 1b: `MapData` literals need `wilds` (`[]`), and a later
  `STATE_VERSION` step takes 5 and chains after the 3-to-4 migration. Code in `src/sim` and
  `src/ai` must not read map geometry or `map.wilds` (the adjacency guard test fails). Phase
  6b.3, built beside Phase 1b on Phase 6b.2, was joined by rebuilding Phase 1b's four commits
  on it: `playedSetup`, `runnerSetup(s)` and `matrixSetups` take `wilds` after the chosen
  presets, so `--presets` and `--matrix` runs carry the switch; 6b.3 needed no `MapData`
  literal and no save step; its tests were checked against the wild default by the rule of
  commit B (the ones that changed are listed under commits A and B); its runner and matrix
  numbers stay in the docs labeled as measured without wilds, beside those re-measured with
  them, and its duel bands are battle-only and unchanged.
- Fixed during S1: a re-run used to be trusted whenever its log matched the record, so a
  rule or spell change that left the log as it was went unnoticed (in a test that raised the
  morale base by 1, about 80% of random records still matched and showed morale rolls against
  the new target). `rerun.rules` now stores `battleRulesHash()`, and a save from a build with
  other battle rules, spells or units loads with a null `rerun` (log-only replay).
- Raster art (QA sweep, DOC-4): the WebP rasters total 1,987,716 bytes against the 2 MB
  (2,000,000 byte) cap, so the next raster must displace one; `tests/assets/portraits.test.ts`
  fails when the total passes the cap. The sweep made a summoned commander's 4-face set complete
  and let it replace the rig's portrait pose, to match the shipped Salamander and Treant sets;
  the owner may prefer 8 faces or the rig pose for summons, in which case docs/09-art-direction
  and that test change together.
- The Wellspring retry (QA sweep, map-1) costs about 110 ms per unfair placement on Medium with
  4 nations, some 12% of those maps' generation time; with 2 nations it never ran in the seeds
  checked.
