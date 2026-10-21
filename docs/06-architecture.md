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
| Persistence | IndexedDB via `idb-keyval` | Save files are JSON of a few hundred KB; localStorage is too small. |
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
      commands.ts         # Command union, validate(state, cmd), apply(state, cmd)
      economy.ts          # gold, mana, upkeep, fort materials (daily accrual)
      supply.ts           # starvation and healing
      pillage.ts
      messages.ts         # the per-nation message log
      buildings.ts        # construction cost, time, and progress
      population.ts
      unrest.ts
      dominion.ts
      scales.ts           # effective scales of a province
      research.ts
      recruitment.ts
      movement.ts         # transit, arrival, battle trigger
      siege.ts
      rituals.ts
      wellsprings.ts
      victory.ts
      visibility.ts       # fog of war
      battle/
        resolve.ts        # resolveBattle(setup, rng)
        formation.ts
        spells.ts         # battle effect primitives
        events.ts         # BattleEvent types
      selectors.ts        # every economic rate, read by the UI, the AI, and the tick alike
      serialize.ts        # save/load JSON, version field, migrations
    content/              # DATA ONLY. Plain objects, typed.
      types.ts            # shapes of unit, nation, building records
      rules.ts            # rule numbers: time, tax, economy, materials, supply, unrest, mana, pillage
      ai.ts               # difficulty levels
      colors.ts           # the five colors, palettes, enemy/ally pairs, nation banners, map keylines
      terrain.ts
      mapgen.ts           # map sizes and every map generation number (shares, springs, placement)
      names.ts            # province name syllables per terrain
      units/
        base.ts           # baseline stats and commander weapons
        common.ts         # independents, summons shared across nations, the garrison holder
        cinderHorde.ts
        thornwood.ts
      nations/
        cinderHorde.ts
        thornwood.ts
        index.ts
      spells/
        red.ts
        green.ts
        white.ts blue.ts black.ts   # data present, may be partially implemented
        index.ts
      pretenders/
        chassis.ts
        scales.ts         # the five axes with per-pole effects
        presets.ts
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
    ai/
      ai.ts               # runAi(state, nationId): Command[]  called every 5 days per AI nation
      economy.ts expansion.ts military.ts research.ts
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
- **Purity guard**: `src/sim`, `src/mapgen`, and `src/content` are checked three ways:
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
