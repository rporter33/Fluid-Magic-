
---

## 7. Milestone placement

### 7.1 What lands where

| Phase | Lands | Status |
|---|---|---|
| **1b: impassable terrain** (after Phase 7 merges) | rules, mapgen, data, validation, tests, the ridge refusal message, the docs/01 decision, the save version bump | **M1** |
| **8: map rendering and core UI** | the **sheet bake** architecture (bands, tiles, dirty re-bakes), on which everything later plugs in | **M1** |
| | **impassable art**: massifs, meres, ridges, names, the region card, the ✕ cursor, the no-path reason | **M1** |
| | the **Simple table**: procedural oak, linen cloth with hem and tacks, the start zoom with its oak band, lean-back zoom and clamps | **M1** |
| | **miniature plaques** (the badge, in allegiance shapes); the **siege camp** mark | **M1** |
| | **code-path portraits** in the strip and the outliner | **M1** |
| | **oak chrome tokens** (`--chrome-*` values, `--brass` keylines on action buttons) | **M1** |
| 9: remaining UI | the 96 px portrait in the Commander panel; portraits in report cards; parchment card faces and Codex pages | **M1** |
| | Settings: Table (Full/Simple/Off) and Map detail (Full/Reduced) | **M1** |
| | personal names | M1-should |
| 10: battle replay | busts in the rosters (64) and name cards (128); miniature figures cut from the rigs | **M1** |
| 11: art and animation | terrain stamps (SVG atlas); settlements (5 tiers, 3 kits, walls, landmarks, construction); nation land looks (washes and motifs); scars; portrait SVG parts | **M1** |
| | scale-pole motifs; painted edges; cartographic furniture; season variants on stamps | M1-should |
| | `heldSince` with roads and capture scorch | M1-should |
| 12: balance and polish | the room floor (code); the month candle; brass brackets and bevels; the repaint wipe; the performance pass | **M1** |
| | the other props and the ambience | M1-should |
| | owner raster art: table, room, the first 4 portrait sets | M1-should |
| | re-run the docs/09 checklist on maps with impassable terrain (match length, Thornwood against Cinder Horde) | **M1** |

**Later (M2 and beyond):**
- ambient sound;
- interactive props, and decorating the tavern over a campaign;
- fliers over ridges, and passes that open or close; the "rift" region kind; roads as a mechanic;
- afflictions and weathering on portraits (with the units design's R9 and R10);
- raster portraits for every type;
- spring and autumn room art;
- `lookIndex` portrait decks.

### 7.2 Acceptance criteria to change (`docs/10-milestone-1.md`)

The battle and pretender tracks also amend these. The new text adds to theirs:

- **3. Map:** add "and impassable terrain (3 peaks, 2 meres and about 7 ridges on Medium) that never cuts the map, never touches a capital's neighborhood, and always leaves a way around (a ridge within 4 provinces, a region within 6)".
- **14. Art:** add "every commander has a seeded portrait; the map draws terrain detail, settlements by population and buildings, impassable terrain, and each nation's land look by dominion".
- **New 16. The war table:** "The map is a painted cloth on an oak war table in a tavern. Settings offer Table Full / Simple / Off and Map detail Full / Reduced. The map holds 60 fps at 1080p with both on Full, and reduced motion freezes the table's ambience."

### 7.3 Scope guard: the art pass must not stall the playable game

1. **Rules first, art after play.**
   - Phase 1b and Phase 8's impassable art come first, because they change what players can do.
   - Everything else on the map waits until Phase 8's "This is the first point where the game is playable by a human. Play it."
   - Phase 8 ships flat fills plus impassable art plus the Simple table. That is enough to play.
2. **No art item delays a sim or UI criterion.** Each item has a fallback (6.1), so a missing asset never blocks a phase.
3. **One time budget.** The map art in Phase 11 gets the same time as the unit SVGs. Past that, the cut order applies, without a new discussion.
4. **Cut order** (first cut first):
   1. owner raster art;
   2. `heldSince`, roads and scorch;
   3. scale-pole motifs;
   4. painted edges;
   5. props beyond the month candle;
   6. ambience;
   7. personal names;
   8. season variants;
   9. escort figures;
   10. the room floor (the Simple table stays).

   **The M1 floor, never cut:** impassable art; the Simple table; plaques; settlement tiers; terrain stamps (at least Forest, Hills and Mountains); both nations' washes with 2 motifs each; procedural portraits for every commander.
5. **A performance gate.** If the first 120 frames on a machine average under 50 fps, a Hint suggests "Map detail: Reduced". Phase 12 fixes any machine class that the Reduced setting does not bring to 60.
6. **No more new sim state.** Phase 1b's map fields and the two M1-should fields (`heldSince`, names) are all of it. Everything else derives.

