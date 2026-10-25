# Milestone 1: Playable Solo Skirmish

## Definition

M1 is done when a player can open the game in a browser, design a pretender for Cinder
Horde or Thornwood, play a full match on a generated Medium map against one or more AI
nations in continuous time with pause and speed controls, fight auto-resolved battles and
watch their replays, research and cast all ten Red or Green spells, spread dominion,
claim Wellsprings, win or lose, and save and load at any point. Placeholder art is
distinct per unit and animated. All sim tests pass.

## Acceptance criteria

1. `npm run dev` serves the game; `npm run build` produces a static bundle under 5 MB
   gzipped; `npm test`, `npm run typecheck`, and `npm run lint` pass.
2. New Game flow: map size, seed, nation, opponents, difficulty, pretender design with
   presets and a validated 400-point budget.
3. Map: 60-province landlocked Medium map, all provinces connected, capitals ≥ 6 apart,
   3 Wellsprings ≥ 3 from capitals, every color's springs appear at least twice.
4. Time: pause and 4 speeds; date display; auto-pause events; the sim stays deterministic
   (test: same seed and same command log yields identical state hash after 365 days).
5. Economy: population, gold, materials (fort-local), supply with starvation, mana with
   springs and dominion tint, unrest, tax rates, upkeep. All visible in the UI.
6. Commanders, squads, movement with ETA and reversal, recruitment queues, garrison
   transfer, PD, buildings (Temple, Lab), pillage, patrol.
7. Battle: resolver per `docs/04-battle.md`, scripts, formations, closing rounds,
   morale, round limits, replay log, replay viewer. Sieges and storming of capitals.
8. Magic: pips, research tracks, fatigue, carried mana, 10 Red and 10 Green spells
   fully working, blessings for pips ≥ 4.
9. Pretender: 6 chassis, pips, dominion, 5 scales with effects, awakening, prophet.
10. Dominion spread, scales applied per province, Godless state.
11. Wellsprings claim and victory; elimination defeat; victory screen with stats.
12. AI per `docs/08-ai.md` passing its behavior tests.
13. Save/load with 3 slots plus autosave.
14. Art: every unit, commander, chassis, building, terrain, and icon has a distinct SVG
    placeholder; animations per `docs/09-art-direction.md`.
15. Headless AI vs AI runner (`npm run sim:aivai -- --games 20 --seed 1`) reporting
    winner, months, and final stats per game.

## Build order

Work in the order below. Each phase ends with its tests green and a commit. Do not start
rendering before the sim phases are solid; the headless runner is the first "game".

### Phase 0: Scaffold (half a day)
- Vite + React + TypeScript strict, ESLint, Prettier, Vitest, PixiJS 8, Zustand, idb-keyval,
  d3-delaunay. `npm` scripts: dev, build, preview, test, typecheck, lint, sim:aivai.
- `src/sim/rng.ts`, `drn.ts`, `ids.ts` with tests (distribution sanity, serialization).
- `content/colors.ts` and `content/terrain.ts`.

### Phase 1: Map and provinces
- `mapgen/generate.ts`: Poisson disc points, Voronoi via d3-delaunay, two rounds of
  Lloyd relaxation, clip to a rounded rectangle, adjacency from shared edges, terrain
  assignment by noise (elevation and moisture, simplex noise with the seeded rng),
  capital placement by farthest-point sampling, Wellsprings, springs, independents,
  province names from a syllable generator per terrain.
- Tests: connectivity, capital distance, province count within ±5%, no province with
  fewer than 2 neighbors, springs coverage.

### Phase 2: Economy and population
- `types.ts` full GameState. `createGame.ts`. `tick.ts` skeleton with phase ordering.
- economy, population, unrest, supply, mana, scales, buildings. Selectors for income.
- Tests: capital income on day 30 matches formula; starvation drains HP; materials cap.

### Phase 3: Commanders, movement, recruitment, independents
- commands.ts with validation; movement with transit and reversal; recruitment queues and
  garrison; PD; independents generation; visibility.
- Tests: move ETA by terrain; recruit consumes pop on completion; command validation
  rejects foreign units.

### Phase 4: Battle
- Resolver per `docs/04-battle.md` with the full event log. Arrival triggers battle.
  Retreat destinations. Siege and storm. Province capture.
- Tests listed in the battle doc, plus capture flow.

### Phase 5: Magic
- Research, pips, battle spell primitives, ritual primitives, Red and Green spell data,
  carried mana, blessings, summon commanders (Salamander, Treant).
- Tests: every Red and Green spell resolves without throwing in a fixture battle or
  province; research level timing; fatigue math.

### Phase 6: Pretender, dominion, Wellsprings, victory
- Chassis, pip costs, scales costs and effects, awakening arrival, prophet, dominion
  spread, Godless, Wellspring claim, victory and defeat, headless runner with a random-
  order dummy AI.
- Tests: presets within budget; dominion spreads from the capital; claim completes in 10
  days; victory triggers.

### Phase 7: AI
- Per `docs/08-ai.md`. Replace the dummy AI in the headless runner. Behavior tests.

### Phase 8: Map rendering and core UI
- Pixi map with province polygons, labels, overlays, army markers, camera. React shell,
  store, loop, top bar, speed controls, province panel, commander panel, recruit panel,
  messages. Right-click move. Tooltips.
- This is the first point where the game is playable by a human. Play it.

### Phase 9: Remaining UI
- Research panel, ritual panel with target picking, build and PD buttons, scripts and
  formations, garrison drag and drop, pretender design screen, new game screen, main
  menu, save/load, victory screen, settings.

### Phase 10: Battle replay viewer
- BattleRenderer per the UI doc with the animation table from the art doc.

### Phase 11: Art and animation
- All SVG placeholders, part system, tinting, procedural animations, spell particles,
  icons, chassis portraits. Manifest with fallbacks.

### Phase 12: Balance and polish
- Run the playtest checklist in `docs/09-balance.md`. Tune. Record changes. Fix the
  rough edges found by playing three full matches as each nation.

## Out of scope for M1 (do not build)

Building new forts, random events, W/U/B nations as playable, hybrid mana costs, sea
provinces, multiplayer, touch layout, sound, localization, mod support, map editor.
Stub nothing for these except where the data format is already designed to hold them
(spell requirement strings, nation color identity arrays).

## Liberties taken

Decisions made without asking, recorded so they can be revisited:
- Thrones became **Wellsprings** to fit the Fluid Magic name and the mana-as-fluid theme.
- Scales are the five MTG enemy-color pairs instead of Dominions' six scales.
- Battle spells cost fatigue, rituals cost mana; some battle spells also need carried mana.
- Materials are fort-local with a 6-month cap, to make fort placement matter later.
- No new forts in M1; capitals are the only forts. Sieges exist because elimination needs them.
- Red and Green are the two shipped nations for the clearest contrast in playstyle and
  the simplest effect primitives.
- PixiJS over Three.js for rendering, React for panels.
- Dominions' squad-level positioning was simplified to three rows per side.
- Research tops out at level 6 in M1 and the spell list is spread across levels 1 to 6.
