# Milestone 1: Playable Solo Skirmish

## Definition

M1 is done when a player can open the game in a browser, design a pretender for Cinder
Horde or Thornwood, play a full match on a generated Medium map against one or more AI
nations in continuous time with pause and speed controls, fight auto-resolved battles and
watch their replays blow by blow, with sound, research and cast all ten Red or Green spells,
spread dominion, claim Wellsprings, win or lose, and save and load at any point. Placeholder
art is distinct per unit and animated. All sim tests pass.

## Acceptance criteria

1. `npm run dev` serves the game; `npm run build` produces a static bundle under 5 MB
   gzipped; `npm test`, `npm run typecheck`, and `npm run lint` pass.
2. New Game flow: map size, seed, nation, opponents, difficulty, pretender design with
   presets and a validated 400-point budget.
3. Map: 60-province landlocked Medium map with 3 impassable wild ranges, all provinces
   connected with no single province as the only way through, capitals ≥ 6 apart with no wild
   within 2 provinces of a capital, 3 Wellsprings ≥ 3 from capitals, every color's springs
   appear at least twice.
4. Time: pause and 4 speeds; date display; auto-pause events; the sim stays deterministic
   (test: same seed and same command log yields identical state hash after 365 days). Art
   never changes the state: the purity test guards `src/present`, and the state hash is equal
   with every Table and Map detail setting.
5. Economy: population, gold, materials (fort-local), supply with starvation, mana with
   springs and dominion tint, unrest, tax rates, upkeep. All visible in the UI.
6. Commanders, squads, movement with ETA and reversal, recruitment queues, garrison
   transfer, PD, buildings (Temple, Lab), pillage, patrol.
7. Battle: resolver per `docs/04-battle.md`, scripts, formations, closing rounds, morale,
   round limits, replay log, and the replay viewer per `docs/07-ui.md` and
   `docs/12-battle-presentation.md`: per-blow detail from a verified re-run (a labelled
   summary when the re-run cannot be verified), pause, speeds, Beats mode, step, scrub, skip,
   and at most 150 s per battle at 1x. Sieges and storming of capitals.
8. Magic: pips, research tracks, fatigue, carried mana, 10 Red and 10 Green spells
   fully working, blessings per `docs/05` Step 6 (the blessing menu).
9. Pretender: 16 chassis in three realms (11 per nation), pips with per-chassis new-color
   prices, dominion, five scales with effects and attunement, awakening, prophet, the blessing
   menu (per-color bless points, groups, incarnate blessings; the fixed bless as its default),
   two boons, the new battle and map rules of `docs/04` and `docs/05` (battle-start abilities,
   trample, spell power, shields by element, bound squads, monthly summons, the Phoenix's
   reform), and twelve presets with looks.
10. Dominion spread, scales applied per province, Godless state.
11. Wellsprings claim and victory; elimination defeat; victory screen with stats.
12. AI per `docs/08-ai.md` passing its behavior tests.
13. Save/load with 3 slots plus autosave.
14. Art: every unit, commander, chassis, building, terrain, and every icon in the
    `docs/09-art-direction.md` icon inventory has a distinct SVG placeholder; animations per
    `docs/09-art-direction.md`, including the battle impact grammar. Battle replays play
    procedural sound effects per `docs/11-sound.md`, with volume, mute, captions, and the gore,
    shake, flash, and reduced-motion settings. Pretender portraits are composed from the same
    parts as their battle sprites, with every appearance choice visible; every spell, ability
    and ritual has its effect per the magic effects grammar. Every commander has a seeded
    portrait with an allegiance frame, a rank material and state overlays. The map shows
    terrain detail, settlements by population, walls by PD, buildings, impassable wilds, and
    each province's land look by dominion and scales.
15. Headless AI vs AI runner (`npm run sim:aivai -- --games 20 --seed 1`) reporting
    winner, months, and final stats per game.
16. The pretender designer has six steps (Body, Magic, Realm, Blessings, Appearance,
    Identity), a live preview, presets with looks, a random god and look with locks and a
    10-roll history, saved gods, and a share code that round-trips; no look or identity field
    other than the name changes the game state (determinism test).
17. The war table: the map is a painted cloth on an oak war table in a tavern, framed by an oak
    band at the start zoom and shown whole with the tavern floor when leaning back; Settings
    offer Table Full / Simple / Off and Map detail Full / Reduced; the map holds 60 fps at 1080p
    with both on Full; reduced motion freezes the table's ambience.

## Build order

Work in the order below. Each phase ends with its tests green and a commit. Do not start
rendering before the sim phases are solid; the headless runner is the first "game".

**Presentation track.** At the owner's direction ("the battles should be visceral with
detail and sfx since its not real time that should be fine, take what you need to get this
done"), the battle replay is built as its own track in stages S1 to S6
(`docs/12-battle-presentation.md`), in parallel with the phases from Phase 7 on, and
integrated in Phase 10. S1 (the resolver's detail sink and re-runnable records) lands
during Phase 7, before Phase 9 creates saves, so its migration stays trivial. S2 to S5 are
pure code, the audio engine, the renderer, and the lab; they need no game UI and run beside
Phases 7 to 9. Each stage ends green and is committed with the prefix `Phase 10 S<n>:`.

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

### Phase 6b: Pretender variety
- At the owner's direction ("good options for pretenders like Dominions has is always a
  highlight ... A customization level matching Age of Wonders 4 would be very ideal"), the
  pretender grows before the UI phases. The design is the 2026-10-21 pretender build spec;
  its rules are in `docs/04` and `docs/05`. The owner approved the scope and its defaults on
  2026-10-21 (`docs/05`, "Owner decisions"). Three commits, each green:
- 6b.1: realms, per-chassis new-color prices, attunement, minimum awakening, starting springs,
  the god's name, roles, AI power for the existing six; the blessing menu with the fixed bless
  as its default; the Sacred Spring and Avatar boons; one save-version step.
- 6b.2 (after the battle track's S1): battle-start abilities, multi-strike weapons, spell
  power, shields by element (with the Thornhide blessing), bound squads; the battle
  presentation's record and event amendments.
- 6b.3: monthly summons, the Phoenix's reform, the ten new chassis and six new presets with
  their content fixtures, `sim:aivai --presets` and `--matrix`, `sim:duel` with pinned bands
  and `--calibrate`, the AI's pretender step by role.
- Tests: every rule's own tests; every existing preset's bless and cost unchanged; the battle
  goldens unchanged; determinism with each new preset.

### Phase 7: AI
- Per `docs/08-ai.md`. Replace the dummy AI in the headless runner. Behavior tests.

### Phase 1b: Impassable terrain (owner decision 2026-10-21)
- The owner's direction: "i want to make sure the maps have some impassible terrain that is
  noticeable". Rules in `docs/01-core-rules.md` §2 and its Implementation decisions ("Wilds").
- Commit A (any time): `mapgen/wilds.ts` behind `MapGenParams.wilds` (default false),
  `MapData.wilds` with the next `STATE_VERSION` and its migration (`wilds: []`), the new
  `validateMap` checks and tests; a hash recorded from the earlier generator proves that maps
  with wilds off are unchanged.
- Commit B (the owner's decision, after A): wilds on in New Game and `sim:aivai`; `MAPGEN.balanceCandidates`
  10; seed-pinned fixtures re-pinned; 20 AI games re-measured and the matchup recorded.
- Tests: exact province count and terrain shares with wilds; interior wilds at least 3 cells
  from capitals and from each other; no cut vertex; detours of at most 6; capital rings
  unchanged; paths, sight, rituals and spread go around wilds; generation time.

### Phase 8: Map rendering and core UI
- Follow `docs/07-ui.md`, rewritten on 2026-10-21 for the owner's direction: "Make sure the UI
  matches those of similar games; where complexity is tastefully layered under smart menu
  design."
- Sim support first:
  - trace sinks on the selectors, with `src/sim/explain/*` and the property test
  - `ProvinceOverride` what-ifs
  - `armyPower` in the sim, with each chassis' `aiPower` (Phase 6b.1), and `supplyAfterArrival`
  - incursions (`incomingThreats`, `updateIncursions`, `APPROACH.quietDays`) and the new message
    kinds with `refs`, with a save version bump
  - `src/content/ui.ts` with the UI thresholds, logged in `docs/09-balance.md`
- Pixi map:
  - a full-window canvas that never resizes for panels
  - province polygons, bands, labels within the Mid density budget, six modes and the numbers
    layer
  - army badges with exception-only status glyphs, and stacks
  - camera, move preview, cursor label, right-click move, Shift waypoints, engagement preview
- React shell and store:
  - top bar with breakdowns, clock, speed, auto-pause with the reason chip and the popup queue
  - alerts ribbon, outliner, message feed
  - Province panel (Overview with scales, Recruit, Forces)
  - bottom strip with the order bar (Guard included)
  - Commander panel Overview on demand, with Give mana
  - tooltips with locks and the Shift state machine
  - the read-only key table
- The war table and wild art (`docs/09` "The war table", "Impassable terrain"), at most about a
  quarter of this phase's diff: the Simple table (procedural oak with iron straps, the cloth,
  square tacks); the camera's start zoom with its oak band, lean back, clamp, detent and the Fit
  button (`Z`); the fill, decoration and always-on map layers; wild grounds, rims, stamps, names,
  hover cards, the ✕ cursor, "around the" labels and the no-path reason; the footpath on
  passable Mountains; siege camps, wall states and the Wellspring monument; painted wood and
  pewter tokens and brass-tack paths; the lifted mode base and data ramp; portrait v0 (code-path
  busts with allegiance frames, rank materials and the pip ring's separation ring) in the strip,
  outliner, Commander panel and tooltips; the brass action keyline.
- Map spell effects: the channeling sigil and stream, a completion pulse per color, dominion
  candles and the flip pulse, the map effect pool and its limits; effect tags on messages and
  the victim's ritual message.
- Tests: explain, overrides, the preview perf test (2 ms), incursions, the fog guard (also over
  the map look and portraits), label density (with wild labels and token boxes), unobscured
  area, bindings, Shift state machine, pauses; the palette test with wild grounds, banners and
  mode colors.
- Anything of the war table and wild art not done when this phase's tests pass moves to Phase 11
  and is noted in `docs/PROGRESS.md`. The game is playable with flat fills.
- This is the first point where the game is playable by a human. Play it.

### Phase 9: Remaining UI
- The Battle Plan sheet: `formationLayout`, script timeline, `scriptCheck`, presets, copy and
  paste, garrison and squad drag and drop.
- The Rituals tab and map targeting: `predictRitual`, hop outline, the targeting pause, commit on
  click.
- The Research modal, with W, U and B disabled in M1.
- The Ledger: Provinces, Commanders, Magic, Battles, Nations.
- Nested concept tooltips, `src/content/concepts.ts`, and the Codex.
- `summarizeBattle`, the `BattleReport` card, and battle summaries kept in the save's UI block.
- Main menu, New Game with guidance, save/load, victory screen.
- The pretender designer (`docs/07`): six steps, live preview and card (`PretenderCard`,
  `pretenderReading`), per-step `validatePretender`, looks, identity, sigils, random with
  history and locks, My Gods, share codes; looks in the save's UI block.
- Settings (Game, Messages, Interface with Table and Map detail, Accessibility, Audio,
  Controls).
- Onboarding: the first hint, reactive hints, Learn with Why links. The province History tab.
- Chrome hardware (oak bevels and frames, brass keylines and brackets, leather spines); the Full
  table (the procedural tavern floor, hearth and window light, the candle pool, the rim
  vignette); portrait overlays, badges and the gear chip, and portraits on report cards;
  `scripts/art-intake.ts` and the raster manifest.
- Should: the static table props; personal names; the parchment report card and Codex pages if
  the owner chose them.
- Tests: formation layout budget, battle summaries outliving records, depth audit, concepts.

### Phase 10: Battle replay viewer
- The replay frame per `docs/07-ui.md`: header with condition chips, rosters (player on the
  left), log with four levels, transport and an event-indexed scrubber, cinematic mode, captions.
- Integrate the presentation track (S6, `docs/12-battle-presentation.md`): its stage behind the
  frame's contract (the stage is the clock and answers seek requests), with the animation table
  of `docs/09-art-direction.md`; the `BattleReplay` modal from battle messages, the replay and
  sound sections of the settings screen, gzipped saves with the `STATE_VERSION` migrations (2
  from S1, 3 from Phase 6b.1, 4 from Phase 1b, and Phase 8's step for incursions),
  `replay-modal.spec.ts`.
- Spell and ability looks for every spell and ability; the eleven storyboards with their
  layers, sound and reduced-motion detail; blessing rings, the god's aura and first-cast
  flourish; placeholder parts for every chassis and slot family.
- Portrait busts in the replay docks, name cards and result card; the replay modal in the oak and
  brass frame.
- Done when the S1 to S5 tests pass, no sound mapping is pending, and the owner has signed
  off the listening checklist in `docs/11-sound.md`.

### Phase 11: Art and animation
- All SVG placeholders, part system, tinting, procedural animations, spell particles,
  icons, chassis portraits. Manifest with fallbacks.
- Battle viewer: the SVG part sprites replace the procedural placeholder parts through the
  same `PartSet` interface, part by part with procedural fallbacks; portraits for name cards;
  the battle screenshot baselines are refreshed in this commit only.
- The pretender SVGs (bodies of the new chassis, slot variants, portrait detail layers,
  sigils), the map ritual templates, the god's divine moments, and the looks contact sheet.
- The painted map: ground textures, terrain stamps and Far masses with level of detail; fog line
  art; settlements (tiers, thriving and declining, walls, landmarks, scaffolds, kits); land looks
  by dominion and pole motifs; battle scars, unrest marks, pillage smoke; slow looks saved in the
  UI block with the monthly cross-fade; the portrait SVG part library. Should: standees at Near.
  The map art shares this phase's time budget with the unit SVGs; past it, the war table's
  should items are cut in this order, first cut first: season light in the room; ambience
  (candles, hearth, motes); the hourglass and the static props (the month candle last); the
  brush wipe (the cross-fade stays); standees at Near and the cloaked figure that stands for an
  unscouted independent force; pole motifs at Near (Mid stays); battle scars; personal names;
  the parchment surfaces; raster integration.

### Phase 12: Balance and polish
- Run the playtest checklist in `docs/09-balance.md`. Tune. Record changes. Fix the
  rough edges found by playing three full matches as each nation.
- The preset matrix and duel bands; the cost-parity and blessing-bounds snapshots reviewed;
  AI power recalibrated.
- The map's performance pass (60 fps at 1080p with Table and Map detail Full, Large with 4
  nations). Re-run the checklist on maps with wilds. Should: the month candle and hourglass, the
  table's ambience, the room's seasons, the brush-wipe repaint, owner raster sets that arrived
  complete.

## Out of scope for M1 (do not build)

Building new forts, random events, W/U/B nations as playable, hybrid mana costs, sea
provinces, multiplayer, touch layout, music, sound outside battle replays (map and tavern
ambience, menus, UI, alerts), localization, mod support, map editor, pretender appearance
editing during a game, links that carry a god, random presets for AI opponents, a free color
picker, designer and map sound. Stub nothing for these except where the data format is already
designed to hold them (spell requirement strings, nation color identity arrays).

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
- Battle sound effects moved into M1 at the owner's direction. They are generated in code,
  with no audio files; music and map or menu sound stay out.
- Bless points are per color, not pooled as in Dominions, so that White, Blue and Black pips
  (which buy nothing else in M1) cannot buy Red and Green blessings.
- Iron Will (a god that never routs with its troops) was designed and measured, then left out
  of M1: it added 35 to 55 points of win rate to every god-led army.
