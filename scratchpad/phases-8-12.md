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
- Integrate the presentation track (S6): its `BattleStage` behind the frame's contract (the stage
  is the clock and answers seek requests), with the animation table of
  `docs/09-art-direction.md`; the `BattleReplay` modal from battle messages, the replay and sound
  sections of the settings screen, gzipped saves with the `STATE_VERSION` migrations (2 from S1,
  3 from Phase 6b.1, 4 from Phase 1b), `replay-modal.spec.ts`.
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
  The map art shares this phase's time budget with the unit SVGs; past it, the cut order in the
  war-table design applies.

### Phase 12: Balance and polish
- Run the playtest checklist in `docs/09-balance.md`. Tune. Record changes. Fix the
  rough edges found by playing three full matches as each nation.
- The preset matrix and duel bands; the cost-parity and blessing-bounds snapshots reviewed;
  AI power recalibrated.
- The map's performance pass (60 fps at 1080p with Table and Map detail Full, Large with 4
  nations). Re-run the checklist on maps with wilds. Should: the month candle and hourglass, the
  table's ambience, the room's seasons, the brush-wipe repaint, owner raster sets that arrived
  complete.

