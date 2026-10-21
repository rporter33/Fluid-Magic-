# Architecture

## Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Language | TypeScript, strict mode | One language for sim, UI, and a future server. |
| Build | Vite | Fast dev server, trivial static deploy. |
| Map and battle rendering | PixiJS 8 | Best 2D canvas/WebGL performance for sprites, polygons, and animations in a browser. Three.js was considered and rejected: flat 2D art does not need a 3D scene graph. |
| UI panels | React 18 with Zustand | Strategy UIs are form-heavy; DOM beats canvas for panels, lists, and tooltips. |
| Styling | CSS modules, no Tailwind | Keeps the UI self-contained. |
| Tests | Vitest | Sim tests run in Node with no DOM. |
| Lint and format | ESLint (typescript-eslint) and Prettier | |
| Persistence | IndexedDB via `idb-keyval` | Save files are JSON of a few hundred KB gzipped; localStorage is too small. |
| Package manager | npm | |

No backend in M1. The simulation is written as a pure, deterministic module so that M4
can run it on a Node server with clients sending commands.

## Repository layout

```
fluid-magic/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  public/                 # static assets (favicons)
  src/
    sim/                  # PURE. No DOM, no Pixi, no React imports. Deterministic.
      types.ts            # GameState and all nested types
      rng.ts              # seeded PRNG (xoshiro128** or mulberry32), serializable state
      drn.ts              # open-ended 2d6
      ids.ts              # id generation from a counter in state (never Math.random)
      state.ts            # checked lookups (getProvince, getNation, getCommander)
      commanders.ts       # creating commanders and squads; per-unit upkeep and supply
      createGame.ts       # GameSetup -> GameState (uses mapgen, nations, pretender)
      tick.ts             # advance(state): one day
      commands/           # Command union; validateCommand and applyCommand (index.ts)
        army.ts           # move, reverse, orders, scripts, formations, squads, build
        province.ts       # recruit, cancel, PD, tax, storm
        magic.ts          # research color, rituals, giving mana
        pretender.ts      # naming a prophet, claiming a Wellspring
        check.ts          # ownership lookups shared by validators
      economy.ts          # gold, mana, upkeep, fort materials (daily accrual)
      supply.ts           # starvation and healing
      pillage.ts
      messages.ts         # the per-nation message log
      buildings.ts        # construction cost, time, and progress
      population.ts
      unrest.ts
      dominion.ts         # dominion pushes, the monthly spread, Godless
      pretender.ts        # design costs and validation; the pretender's arrival and recall
      scales.ts           # effective scales of a province
      research.ts         # research points, levels, the daily research step
      pips.ts             # pips against spell requirements
      bless.ts            # the bless of sacred units
      recruitment.ts      # recruit cost and time, queues, garrison holders
      movement.ts         # speeds, leg days, paths (pathsFrom) and ETAs, transit and arrival
      independents.ts     # independent forces at game start, strength words
      pd.ts               # PD cost and the defenders it fields
      hash.ts             # state hash for determinism checks
      conflict.ts         # what a hostile arrival does: battles, sieges, captures, retreats
      siege.ts            # daily wall damage and repair, storms
      capture.ts          # a province changing hands
      rituals.ts          # who may cast what where, payment, the daily ritual step
      ritualEffects.ts    # the ritual primitives
      wellsprings.ts      # Wellspring claims
      victory.ts          # capital moves, elimination, the game's result
      visibility.ts       # fog of war
      battle/
        types.ts          # BattleSetup, CombatStats, BattleResult
        resolve.ts        # resolveBattle(setup, rng): the round loop, scripts, the winner
        field.ts          # rows, troops, stat modifiers inside one battle
        attacks.ts        # ranged fire, melee, damage
        landing.ts        # a phase's attacks landing: tallies, life drain, fire-shield burns
        morale.ts         # morale checks, routs, commander deaths
        spells.ts         # choosing and casting a spell, fatigue
        targets.ts        # who a spell lands on
        effects.ts        # the battle primitives
        setup.ts          # a BattleSetup from game state, every modifier folded in
        apply.ts          # a result written back: survivors, deaths, PD, records, messages
        replay.ts         # folding a replay log into the state the viewer shows
        events.ts         # BattleEvent types
        detail.ts         # DetailEvent types: blows, spell hits, burns, drains, morale rolls (never saved)
        record.ts         # BattleSetupRecord, BattleRerun, BattleScene types
        rerun.ts          # toSetupRecord, fromSetupRecord, rerunBattle, matchesRecord
      selectors.ts        # every economic rate, read by the UI, the AI, and the tick alike
      migrate.ts          # the migration map that lifts older saves to STATE_VERSION
      serialize.ts        # save/load JSON, version field, migrations
    content/              # DATA ONLY. Plain objects, typed.
      types.ts            # shapes of unit, nation, building records
      rules.ts            # rule numbers: time, tax, economy, materials, supply, unrest, mana, pillage
      ai.ts               # difficulty levels and every number the AI plays by (AI)
      independents.ts     # independent troop pools by terrain, strength words
      colors.ts           # the five colors, palettes, enemy/ally pairs, nation banners, map keylines
      terrain.ts
      mapgen.ts           # map sizes and every map generation number (shares, springs, placement)
      names.ts            # province name syllables per terrain
      units/
        base.ts           # baseline stats and commander weapons
        common.ts         # independents, summons shared across nations, the garrison holder
        cinderHorde.ts
        thornwood.ts
        pretenders.ts     # one body per chassis
      nations/
        cinderHorde.ts
        thornwood.ts
        index.ts
      spells/
        types.ts          # spell records and the primitive unions
        red.ts
        green.ts
        holy.ts           # the priests' Bless
        validate.ts       # spell checks for content validation
        index.ts          # registry and the requirement parser
                          # white.ts blue.ts black.ts are M2 (docs/02 decisions)
      pretenders/
        chassis.ts
        costs.ts          # design points: budget, pips, dominion, scales, awakening
        scales.ts         # the five axes with per-pole effects
        presets.ts
        types.ts          # PretenderDesign, awakenings
      buildings.ts
      index.ts            # registry: lookups by id, validated on load
    mapgen/
      types.ts            # MapGenParams, CapitalSpec, MapData, MapProvince
      generate.ts         # seed -> MapData (provinces, adjacency, terrain, springs, capitals, wellsprings)
      voronoi.ts          # Poisson disc + Delaunay/Voronoi (use d3-delaunay), Lloyd, adjacency
      geometry.ts         # polygon area, centroid, rounded rectangle, convex clipping
      noise.ts            # seeded simplex noise
      terrain.ts          # terrain by rank from elevation and moisture
      graph.ts            # BFS distances, connectivity
      placement.ts        # capitals, wellsprings, springs, independents
      names.ts            # unique province names
      size.ts             # province count, Wellspring count, map dimensions
      validate.ts         # validateMap: the rules a generated map must satisfy
    ai/                   # PURE, like sim
      ai.ts               # runAi(state, nationId): Command[]; the order of the steps
      plan.ts             # the planning copy, issuing commands on it, the order guard, paths
      roles.ts            # each commander's role from content; the pretender's; the mage split
      assess.ts           # troop, army, and defender power; threat; groups; borders
      economy.ts          # tax, PD, buildings, research
      recruit.ts          # the capital queue, quotas, the troop mix, garrison transfers
      faith.ts            # priests (Godless, Wellsprings, the prophet); the pretender's work
      military.ts         # the army pass in its order; Expansion; the march home
      army.ts             # the army pass's tools: which groups a step may take, sending one
      defense.ts          # relief of besieged forts, Wellspring escorts, Defense
      war.ts              # sieges, storms, pillage; War and Wellspring denial
      magic.ts            # rituals and carried mana
      rng.ts              # each AI call's private random stream; keyed streams
      driver.ts           # playDay: advance, then the AI nations' commands; replayLog
      match.ts            # runMatch: a whole AI game, for the runner and tests
    render/
      MapRenderer.ts      # Pixi app for the strategic map
      ProvinceLayer.ts ArmyLayer.ts LabelLayer.ts
      BattleRenderer.ts   # replay viewer
      sprites.ts          # texture loading, tinting, procedural animation helpers
      camera.ts
    ui/
      App.tsx
      store.ts            # Zustand store: GameState ref, selection, panel state, speed
      loop.ts             # requestAnimationFrame loop, accumulator, speed -> ticks
      screens/
        MainMenu.tsx NewGame.tsx PretenderDesign.tsx GameScreen.tsx VictoryScreen.tsx
      panels/
        TopBar.tsx ProvincePanel.tsx CommanderPanel.tsx ArmyPanel.tsx RecruitPanel.tsx
        ResearchPanel.tsx RitualPanel.tsx MessagesPanel.tsx SpeedControls.tsx
        BattleReplay.tsx
      components/         # Tooltip, ManaSymbol, StatRow, UnitCard, ...
    assets/
      sprites/            # SVG placeholder art (see art direction)
      icons/
  tests/
    sim/*.test.ts
    mapgen/*.test.ts      # one file per mapgen module; fixtures.ts holds shared helpers
    battle/*.test.ts
    content/validate.test.ts
    ai/*.test.ts
  scripts/
    aivai.ts              # headless AI vs AI runner (npm run sim:aivai)
  docs/
```

## Simulation contract

```ts
// All state lives in one serializable object.
interface GameState {
  version: number;
  seed: number;
  rng: RngState;             // serialized PRNG state
  nextId: number;            // monotonic id counter
  day: number;               // absolute day since start, day 0 = Y1 M1 D1
  map: MapData;              // provinces, adjacency; static after generation
  provinces: Record<ProvinceId, ProvinceState>;
  nations: Record<NationId, NationState>;
  commanders: Record<CommanderId, CommanderState>;
  battles: BattleRecord[];   // recent battles with replays (keep last 20)
  messages: Message[];       // event log for the player
  provinceEffects: ProvinceEffect[];   // timed effects from rituals
  result: GameResult | null;
  // Ritual progress lives in the caster's castRitual order (see Implementation decisions).
}

function advance(state: GameState): void;              // mutates, one day
function applyCommand(state: GameState, cmd: Command): CommandResult;  // validate then mutate
```

Rules:
- `advance` and `applyCommand` never call `Math.random`, `Date`, or anything outside the
  state. All randomness comes from `state.rng`.
- Mutation is in place for performance; the UI store bumps a `tickCount` and components
  read via selectors. Do not deep-clone state per tick.
- Floating point is acceptable because the sim runs on one engine. Keep accumulators as
  floats and expose integers via selectors.
- `advance` order inside one day:
  1. Apply queued commands (already applied by the UI before calling advance).
  2. Movement progress, arrivals, battle resolution, siege progress.
  3. Recruitment queues, building queues, ritual progress, research.
  4. Economy accrual (gold, materials, mana, upkeep), population, unrest, supply damage.
     Phase 2 order: one snapshot of every province's rates; gold, mana, and upkeep;
     fort materials; pillage; population; unrest; supply. Province effects whose
     `untilDay` is the next day are dropped once the day is over.
  5. On the last day of a month: dominion spread, monthly effects tick, AI planning hook.
  6. Visibility recompute (cheap: owned/adjacent/scout sets).
  7. Victory check.
- Every 5 days the UI calls `runAi` for each AI nation and applies the returned commands.
  The AI lives outside `advance` so that a server could schedule it differently.

## Commands

```ts
type Command =
  | { type: 'setSpeed'; ... }                       // UI-only, not a sim command
  | { type: 'move'; commanderIds; path: ProvinceId[] }
  | { type: 'reverse'; commanderId }
  | { type: 'setOrder'; commanderId; order: CommanderOrder }
  | { type: 'setScript'; commanderId; slots: ScriptSlot[] }
  | { type: 'setFormation'; commanderId; squadId; formation }
  | { type: 'transferSquad'; fromCommanderId; toCommanderId; squadId; count? }
  | { type: 'recruit'; provinceId; unitTypeId; count }
  | { type: 'cancelRecruit'; provinceId; queueIndex }
  | { type: 'build'; provinceId; commanderId; buildingId }
  | { type: 'buyPd'; provinceId; levels }
  | { type: 'setTax'; provinceId; rate }
  | { type: 'setResearchColor'; nationId; color }
  | { type: 'castRitual'; commanderId; spellId; targetProvinceId?; genericPayment }
  | { type: 'giveMana'; commanderId; color; amount }   // in a lab province
  | { type: 'claimWellspring'; commanderId }
  | { type: 'storm'; provinceId; nationId }
  | { type: 'makeProphet'; commanderId }
```

Each command has `nationId` resolved from the acting commander or province; validation
rejects commands against units the nation does not own. The AI uses the same commands.

## Game loop

```
loop(now):
  dt = now - last
  if speed > 0: accumulator += dt * daysPerSecond[speed]
  while accumulator >= 1:
    advance(state); accumulator -= 1
    if state.day % 5 == 0: for each AI nation: apply(runAi(state, nation))
    if state.result: pause
  renderer.sync(state)   // diff-based; only touched provinces/armies update
  store.bump()
```

Cap ticks per frame at 16 to keep the UI responsive at 4x on slow machines.

## Save and load

- `serialize(state): string` and `deserialize(json): GameState` with a `version` and a
  migration map. Save on demand (button, Ctrl+S) and autosave every 30 game days to slot
  `autosave`. Three manual slots. Store in IndexedDB.
- The seed and rng state are saved so a loaded game continues identically.
- Saves are gzipped (`CompressionStream('gzip')`) before they go to IndexedDB, and read back
  with `DecompressionStream`. Twenty large battle records (300 against 300, with re-run
  setups) are about 0.9 MB of JSON but 0.1 MB gzipped; a test pins a 20-record save under
  200 KB gzipped.
- `STATE_VERSION` 2 (Phase 10 S1) adds `scene` and `rerun` to battle records; the migration
  from 1 sets `rerun` to null and the scene from the province's terrain. The migration map
  lives in `src/sim/migrate.ts`, which `serialize.ts` runs on load; loading is lenient about
  replays, so a malformed `rerun` becomes null instead of failing the save.

## Performance targets

- 60 provinces, 4 nations, 200 commanders: `advance` under 2 ms on a laptop.
- Battle of 300 vs 300 troops: resolve under 50 ms.
- Map render: 60 fps at 1080p with all provinces and 100 army markers.

## Content validation

`content/index.ts` builds registries and `tests/content/validate.test.ts` asserts: every
unit referenced by a nation or spell exists; every spell's primitives are implemented;
every preset fits the budget; every nation has a capital unit list that can be recruited
on day 1 (requirements satisfiable); color keys are only W U B R G.

## Implementation decisions

Choices made where this doc was silent, recorded per `CLAUDE.md`:
- **RNG**: xoshiro128** seeded by four splitmix32 steps. `RngState` is `{ a, b, c, d }`, four
  uint32 words, mutated in place by the helpers in `src/sim/rng.ts` (`nextU32`,
  `nextFloat`, `randBelow`, `randInt`, `chance`, `pick`, `shuffle`). Seeds are reduced to
  32 bits (ToUint32 of the truncated number). A test pins the stream for seed 1, so
  changing the algorithm is a save-breaking change.
- **Ids**: one counter (`GameState.nextId`) shared by every kind; an id is a kind prefix
  plus the counter value (`c12`, `sq13`, `p0`). Ids are branded string types
  (`CommanderId`, `SquadId`, ...) so kinds cannot be mixed up at compile time.
- **Purity guard**: `src/sim`, `src/mapgen`, `src/content`, and (Phase 6) `src/ai` are checked
  three ways:
  ESLint restrictions (no `Math.random`, `Date`, `performance`, `crypto`, no render/ui or
  framework imports), a source-scan test (`tests/sim/purity.test.ts`), and a second
  `tsc` pass (`tsconfig.sim.json`) without DOM or Node typings. Content is included
  because the sim imports it.
- **MapData** (`src/mapgen/types.ts`) is produced once by `generateMap(params)` and stored as
  `GameState.map`, static afterwards. Besides geometry and adjacency it carries each
  province's starting values (`startPop`, `springs`, `independentStrength`,
  `capitalDistance`) for `createGame` to copy into `ProvinceState`. Province ids are
  `p0`..`pN-1` from a counter local to mapgen; the prefix keeps them distinct from ids drawn
  from `GameState.nextId`. Coordinates are stored at full precision.
- **Pure-module conventions**: `src/mapgen/voronoi.ts`, `geometry.ts`, `noise.ts`, and
  `graph.ts` are generic and take every parameter explicitly; modules that apply game rules
  (`placement.ts`, `size.ts`, `generate.ts`) read their numbers from `src/content`.
- **GameState changes from the sketch above** (Phase 2): ritual progress lives in the
  caster's `castRitual` order, so there is no `activeRituals` list and no ritual id kind;
  a dead caster or a new order ends the ritual. `result` is `GameResult | null`.
  `BattleRecord` carries both sides' starting roster. Prophet and pretender identity are
  ids on the nation only. A move order stores the group's map speed, frozen when ordered.
  A nation has a color identity array and a display `banner`.
- **Rates in one place**: `selectors.ts` computes every economic rate (province economy,
  pillage, nation economy, fort materials, dominion score), reading scales from
  `scales.ts`. `tick.ts` applies those rates a day at a time from one snapshot taken at the
  start of step 4, so the UI and the simulation cannot disagree. Pure helpers that apply
  rules read their numbers from `src/content`; the sim hard-codes none.
- **Commands** (Phase 3): every command carries the issuing `nation`, and validation checks
  every commander it names, and every province except the steps of a move path, against
  that nation, so "rejects commands against units the nation does not own" has a subject.
  Fields are named for what they hold (`commanders`, `commander`, `squad`, `from`, `to`,
  `province`, `unit`, `count`, `building`, `levels`, `rate`, `recruit` for a queue item id,
  and `order` for an order kind).
  `validateCommand(state, cmd)` returns an error string or null; `applyCommand(state, cmd)`
  validates, then applies, and returns `{ ok: true }` or `{ ok: false, error }`. Applying
  copies every array it stores, so state never shares objects with a command. `setOrder`
  takes only an order kind (idle, pillage, patrol, research, preach); orders that carry
  progress or targets come from their own commands, which compute them. `cancelRecruit`
  names the queue item by id (`RecruitOrder.id`), not by index, so an item finishing between a
  render and a click cannot shift the target. The commands live in `src/sim/commands/`
  rather than one `commands.ts`, per the small-modules rule.
- **Movement in tick step 2** runs as `advanceTransits` (walk, arrive), `resolveArrivals`
  (Phase 3 ends moves among hostiles; Phase 4 fights there), and `continueMoves` (start the
  next leg). Step 3 runs recruitment before construction, as listed above.
- **GameState additions** (Phase 3): `RecruitOrder` has an `id` and the queuing `nation`;
  `NationState.inSight` holds the enemy commanders a nation saw at the end of the last day,
  for 'sighted' messages. Storing it costs one visibility pass a day instead of two (before
  and after the day), and it also announces armies revealed by commands between days. Vision
  and visible armies are otherwise computed on demand.
- **State hash**: `stateHash(state)` (`src/sim/hash.ts`) is a 53-bit hash of the JSON form,
  used by the determinism tests and later by save verification.
- **Battles** (Phase 4): `resolveBattle` takes a `BattleSetup` that `battle/setup.ts` builds
  with every modifier already folded into each squad's stats, so the resolver reads no game
  state. Tick step 2 runs `advanceTransits`, `resolveArrivals` (now in `conflict.ts`),
  `progressSieges`, and `continueMoves`. `resolveArrivals` builds one presence index for the
  day and rebuilds it only after an arrival that fought, besieged, or captured.
- **Battle records** ("keep last 20"): a `BattleRecord` is stored only for battles in which a
  player's nation (`ai === null`) fought, and the newest `BATTLE.keep` (20) of those are kept.
  Battles between AI nations and independents still apply every consequence and post
  'battle' messages, with `battle: null`; the UI shows "replay no longer kept" for a message
  whose record is gone.
- **Storm** command: `{ type: 'storm', nation, province }`. It is valid for the nation
  besieging the province while one of its commanders (not a hidden one) stands there, and
  sets `siege.storm`; the storm is fought in the next tick's siege step. `SiegeState` gained
  `storm: boolean`.
- **Magic** (Phase 5): commands `{ type: 'setResearchColor', nation, color }`,
  `{ type: 'castRitual', nation, commander, spell, target, generic? }` (target null for
  rituals cast where the caster stands; `generic` an optional whole-number split of the
  generic cost), and `{ type: 'giveMana', nation, commander, color, amount }`. `setScript`
  accepts a named battle spell the commander's pips meet; research is checked in battle.
  Tick step 3 runs recruitment, construction, rituals, then research.
- **Battle setup** (Phase 5): each `BattleCommanderSetup` lists the battle spells the
  commander knows (`spells`), and each `BattleSideSetup` carries the stats of every unit its
  spells can summon (`summons`), both worked out from game state; `research` levels are no
  longer on the side. `CombatStats` gained `lifeDrain`. `ProvinceEffect` gained `scry`.
- **Content validation** checks every spell: its requirement parses and holds its color,
  levels and numbers are in range, every unit it names exists, and every primitive is one of
  docs/02 section 5 with valid fields.
- **Pretender and victory** (Phase 6): commands `{ type: 'makeProphet', nation, commander }`
  and `{ type: 'claimWellspring', nation, commander }`. `NationState` gained `pretenderDead`;
  the pretender is on the map exactly when `pretenderId` is set, and its arrival day comes
  from its design's awakening. `CombatStats` gained `fireShield`. Tick step 3 now ends with
  Wellspring claims and then each nation's pretender (arrival, recall, return); step 5, on a
  month's last day, spreads dominion and settles Godless; step 7 moves capitals, eliminates
  nations, and sets `state.result`.
- **The AI driver** (Phase 6): `playDay(state, player)` in `src/ai/driver.ts` is the game
  loop's AI step for the browser and the headless runner alike. It advances one day; then,
  unless the game has ended, each AI nation still in the game whose planning day it is
  (`state.day % planEveryDays === 0`, counted after the advance) has its commands applied in
  order through `applyCommand`. A refused command is recorded and skipped, never fatal.
  Applied commands are logged with their day, and `replayLog` plays such a log back on a new
  game without the AI, reaching the same state hash.
- **Paths for every target at once** (Phase 7): `pathsFrom(state, commanders)` in
  `src/sim/movement.ts` runs `findPath`'s search to the end, with the same lowest-index ties
  and the same stop at the first hostile province, and finds the hostile provinces once. It
  returns `days(to)`, `pathTo(to)`, and the provinces `reached`, nearest first. `findPathFor`
  is `pathsFrom(...).pathTo(to)`, so its tests pin the two together, and a test checks every
  target on several seeds against `findPath`. The AI ranks targets with one search per group
  instead of one per target. `pathsWith(state, commanders, hostile)` is the same search with
  the hostile provinces given: the AI's plan finds them once a call (who stands where and who
  owns what hold for the call) and searches with them on every miss of its path cache.
- **The AI** (Phase 7): `runAi(state, nation)` in `src/ai/ai.ts` is a `Player` for `playDay`.
  It replaces the Phase 6 dummy (`src/ai/dummy.ts`, deleted) in the runner and the tests. The
  module list differs from the sketch's `economy.ts expansion.ts military.ts research.ts`:
  research lives in `economy.ts` and Expansion in `military.ts`, and the planning copy, roles,
  power, recruitment, priests, the army pass's tools and steps, and magic have their own
  modules (the layout above). Each call plans on a copy of the state (`plan.ts`; docs/08
  decisions) and returns only the commands the copy accepted. `src/ai` stays under the purity
  guard, and the AI's randomness comes only from `src/ai/rng.ts`: `aiRng` per call, and
  `keyedRng(state, nation, ...keys)`, fixed by the seed, the nation's slot, and the keys, for
  a draw made once (the pillage draw).
- **AI numbers** (Phase 7): every number the AI plays by is in `AI` (`src/content/ai.ts`), and
  `validateContent` checks them: each positive, whole where it counts something, batches no
  larger than the largest recruit order, the four odds ratios at least 1, PD levels within the
  PD maximum, the Godless alarm a dominion strength, and each difficulty level's numbers.
