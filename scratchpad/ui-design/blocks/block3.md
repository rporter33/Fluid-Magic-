### Phase 8: Map rendering and core UI
- Follow `docs/07-ui.md`, rewritten on 2026-10-21 for the owner's direction: "Make sure the UI
  matches those of similar games; where complexity is tastefully layered under smart menu
  design."
- Sim support first:
  - trace sinks on the selectors, with `src/sim/explain/*` and the property test
  - `ProvinceOverride` what-ifs
  - `armyPower` in the sim, and `supplyAfterArrival`
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
- Tests: explain, overrides, the preview perf test (2 ms), incursions, fog guard, label density,
  unobscured area, bindings, Shift state machine, pauses.
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
- Main menu, New Game with guidance, Pretender Design (per-step `validatePretender`,
  `PretenderCard`, `pretenderReading`), save/load, victory screen.
- Settings (Game, Messages, Interface, Accessibility, Audio, Controls).
- Onboarding: the first hint, reactive hints, Learn with Why links. The province History tab.
- Tests: formation layout budget, battle summaries outliving records, depth audit, concepts.

### Phase 10: Battle replay viewer
- The replay frame per `docs/07-ui.md`: header with condition chips, rosters (player on the
  left), log with four levels, transport and an event-indexed scrubber, cinematic mode, captions.
- The battle presentation's `BattleStage` behind the frame's contract: the stage is the clock and
  answers seek requests. Use the animation table from the art doc and the separate battle
  presentation design.
