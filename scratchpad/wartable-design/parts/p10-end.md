
---

## 10. Harmony with the other tracks

| Track | What this proposal takes or gives |
|---|---|
| **UI** (staged docs/07, `ui-design/spec-final.md`) | Takes: the zoom bands, the density budget and `layoutMapLabels` (extended to stamps and region labels), "nothing is zoom-gated", mode tinting, badge rules (the plaque is the badge), the fog guard test (extended to `mapLook`), Phase 8 to 10 text (extended). Changes: a 96 px Commander panel portrait; oak `--chrome-*` values; parchment cards and Codex pages; two Interface settings. Tooltips are untouched |
| **Battle presentation** (`battle-design/final.md`) | Takes: `src/present/rand.ts` (`hash32`, `streamFor`), the rigs and `PartSet` for miniature figures, the season rule (months 11 to 2 frost, 9 to 10 autumn), the backdrops' prop kit (tufts, rocks, reeds, dead trees, crop rows), and the D11 test gate for render commits. Gives: the commander bust for replay docks and name cards (8.7) |
| **Pretender** (`pretender-design/final.md` and the owner's answers) | Takes: B.8 rig portraits for gods (the "pretender" row of 5.1), the B.7 sigil (capital pennant, gilded frame corner), C.4 `mapMarks` and the ritual marks (adopted unchanged in 4.4), and C.5 marks (aura on the god's miniature, the prophet's halo glyph). `src/present/map/` is one folder for both tracks' map code |
| **Units and items** (`units-items-design/`) | Takes: the head-slot item replaces the portrait's headgear (5.4, if items land), the reserved overlay slots for afflictions and renown (M2, R9 and R10), and the size ladder for the escort figures' scale. Gives nothing that changes their rules |

## 11. Open questions for the owner (defaults in bold)

1. **Impassable terrain as specified:** peaks and meres as regions (about 8% of the map) plus ridges (about 5% of borders), never next to a capital's neighborhood, always with a way around. **Approve.**
2. **Default table setting: Full** (room, props, ambience), not Simple.
3. **Commander panel portrait at 96 px** (the staged spec has 64).
4. **Personal names for commanders** ("Varo, Ash Chieftain"): **yes, M1-should.**
5. **First raster portrait sets: Ash Chieftain, Warden Captain, Pyre Priest, Grove Priest.**
6. **Cards and Codex pages on parchment; tooltips stay dark.**
7. **Portraits face screen-right everywhere** (mirroring in the replay's right dock would flip asymmetric marks and scars).
8. **"How long held" visuals** (roads, capture scorch, needing `heldSince`): **M1-should.**

## 12. Risks

| Risk | Mitigation |
|---|---|
| Bakes at device pixel ratio 2 on Large maps exhaust memory or stutter | 2048² tiles; only two bands resident (at most 48 MB); at most 4 province re-bakes per frame; the Reduced setting and its Hint; the Phase 12 performance pass with the Playwright smoke |
| Detail clutters the map and hurts reading | The label-and-badge core; ghosting in modes; per-province caps; the `layoutMapLabels` test extended to stamps; the calibration sketch already shows clear labels at Mid with 2,400 stamps |
| Every seed gives a new map after Phase 1b, so AI tuning and checklist numbers move | Land after Phase 7; re-run the AI behavior tests and re-pin seeds; Phase 12 re-measures match length and the Thornwood against Cinder Horde split |
| The art pass eats the schedule | Section 7.3: the M1 floor, the cut order, and the rule that no art item delays a sim or UI criterion |
| Raster art drifts in style or clashes in color | A style anchor; complete sets only; intake checks and a contact sheet; the procedural fallback; the palette rules in every prompt |
| Art leaks fogged information | One projection (`provinceView`) for tooltip, modes and art; the fog guard test covers `mapLook` |
| Brass and candle tones read as mana colors | Brass never touches a mana symbol and never takes a disc or drop shape; mana symbols on parchment get an ink ring; the palette test covers the tokens |
| The generator's new checks make some seeds slow | Measured: at most 11 attempts (p95) with 4 nations, within the 25 allowed; the time test guards 500 ms |

## 13. Files

- This proposal: `wartable-design/proposal-immersion.md`.
- Prototype and measurements: `wartable-design/tools/impassable-proto.ts` (and `.out` files), `immersion-colors.ts`, `impassable-pattern.ts`, `impassable-search.ts`, `two-tone.ts`, `haze.ts` (each with its `.out`), `svgshot.cjs`, `sketchshot.cjs`.
- Prototype maps: `wartable-design/proto-out/proto-medium-s{1..4}.{svg,png,json}`.
- Calibration sketch: `wartable-design/sketch/table-sketch.html` with `map-s2.js` and `map-s3.js`; renders `sketch-mid.png`, `sketch-near.png`, `sketch-far.png`, `sketch-dominion.png`.
- Research it builds on: `research-tabletop.md`, `research-mapdetail.md`, `research-portraits.md`.
