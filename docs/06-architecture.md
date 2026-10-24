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
      createGame.ts       # GameSetup -> GameState (uses mapgen, nations, pretender)
      tick.ts             # advance(state): one day
      commands.ts         # Command union, validate(state, cmd), apply(state, cmd)
      economy.ts          # gold, materials, supply, upkeep
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
      selectors.ts        # read-only derived data for UI and AI (income per province, etc.)
      serialize.ts        # save/load JSON, version field, migrations
    content/              # DATA ONLY. Plain objects, typed.
      colors.ts           # the five colors, element names, palettes, enemy/ally pairs
      terrain.ts
      units/
        common.ts         # independents, summons shared across nations
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
        scales.ts
        presets.ts
      buildings.ts
      fx.ts               # effect family timings, particle counts, per-color motion grammar
      index.ts            # registry: lookups by id, validated on load
    mapgen/
      generate.ts         # seed -> MapData (provinces, adjacency, terrain, springs, capitals, wellsprings)
      voronoi.ts          # Poisson disc + Delaunay/Voronoi (use d3-delaunay)
      terrain.ts
      placement.ts        # capitals, wellsprings, springs, independents
    ai/
      ai.ts               # runAi(state, nationId): Command[]  called every 5 days per AI nation
      economy.ts expansion.ts military.ts research.ts
    render/
      MapRenderer.ts      # Pixi app for the strategic map
      ProvinceLayer.ts ArmyLayer.ts LabelLayer.ts
      BattleRenderer.ts   # replay viewer
      effects/            # effect families and color grammar (see art doc), driven by replay events
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
    mapgen/*.test.ts
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
  activeRituals: RitualInProgress[];
  provinceEffects: ProvinceEffect[];   // timed effects from rituals
  result?: GameResult;
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
- `deserialize` refuses a save whose `version` is greater than the build's (report "saved by
  a newer version", never guess). Migrations are pure functions applied in order
  `v -> v+1`; each migration gets a test fixture. After migration the state is validated
  (required keys present, every id reference resolves, color keys in W U B R G) before it
  is handed to the UI. A failed load reports the reason and leaves the current game
  untouched.
- Autosave alternates between the keys `autosave` and `autosave-prev` so one bad write
  never loses both. Autosave never writes a manual slot. Each save is one `put` of the
  full JSON string; IndexedDB makes that write atomic, so no temp-and-rename is needed.
- Autosave fires on safe boundaries only: at the end of a tick, never mid-battle
  resolution or while a command is being applied.

## Performance targets

- 60 provinces, 4 nations, 200 commanders: `advance` under 2 ms on a laptop.
- Battle of 300 vs 300 troops: resolve under 50 ms.
- Map render: 60 fps at 1080p with all provinces and 100 army markers.

## Rendering notes (PixiJS 8)

Pin the v8 API; most mistakes come from v7 habits.

- Boot: `const app = new Application(); await app.init({...})`. Options go to `init`, not
  the constructor. Mount `app.canvas` (there is no `app.view`). Pass `resizeTo` the map
  container element, not `window`, because React panels share the page.
- Textures: SVG placeholders are rasterized once through `Assets.load` (or `Assets.add`
  with a data URL for generated SVG strings) at a fixed resolution per zoom bucket (1x, 2x).
  `Texture.from(url)` only reads the cache in v8; load first.
- Events: province polygons and army markers set `eventMode = 'static'`; everything else
  stays `'passive'`. Map drag listens for `pointerdown` on the stage, then
  `globalpointermove` (plain `pointermove` stops at the object's edge in v8) and ends on
  `pointerup` or `pointerupoutside`. Right-click move uses `rightdown`.
- Ticker: the callback receives the `Ticker`; use `ticker.deltaMS`. Sim ticks come from
  `ui/loop.ts`, never from the Pixi ticker. The Pixi ticker only drives tweens and camera.
- Layers: `ProvinceLayer` is a render group (`isRenderGroup: true`) because it changes
  only on ownership or overlay changes. Army markers and labels are ordinary containers.
- Teardown: leaving the battle replay destroys its sprites and unloads its textures;
  `removeChild` alone leaks GPU memory. Destroy an app with `releaseGlobalResources: true`
  before creating another in the same tab (tests, hot reload).

### Camera (`render/camera.ts`)

- State is `{ x, y, zoom }` in world units with a target for each; every frame the
  current values move toward the target with exponential smoothing using `deltaMS`
  (never a per-frame `lerp(a, b, 0.1)`, which changes speed with frame rate).
- Wheel zooms toward the cursor: keep the world point under the cursor fixed while
  `zoom` changes. Zoom is clamped to [0.5, 3] and stepped multiplicatively (x1.15 per
  notch).
- The view is clamped so the map rectangle plus a 10% margin always covers the viewport;
  compute the clamp from viewport size divided by zoom, and re-clamp on resize.
- WASD pans at a constant screen speed (pixels per second divided by zoom). Drag pans
  1:1 with the pointer with no smoothing while the button is held.

## Content validation

`content/index.ts` builds registries and `tests/content/validate.test.ts` asserts: every
unit referenced by a nation or spell exists; every spell's primitives are implemented;
every preset fits the budget; every nation has a capital unit list that can be recruited
on day 1 (requirements satisfiable); color keys are only W U B R G; every battle spell's
`fx.family` is one of the families in `docs/09-art-direction.md`.
