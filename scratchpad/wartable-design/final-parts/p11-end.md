## Appendix A. Risks

| Risk | Mitigation |
|---|---|
| Wilds make some seeds slow or fail | Measured: 0 failures on 660 maps; seed backtracking; the time test (1.9) |
| 3- and 4-nation balance drops with wilds | `balanceCandidates` 10, measured to restore it (R12) |
| The AI or retreat behaves worse around wilds | No code reads geometry; commit B re-runs 20 AI games and records the matchup and retreat deaths |
| Detail clutters the map | Box exclusion, coverage caps, the extended label test, decoration out of data modes, Map detail Reduced |
| Colors merge for color-blind players | Every new color and state is in the palette test (3.11), including the joint fog and wash states |
| Bakes exhaust memory or stutter on Large maps | Three layers, whole-sheet Mid tiles, lazy Near tiles, staggered re-bakes, the 96 MB budget and the Playwright smoke |
| Art leaks fogged information | One projection (`provinceView`) for tooltip, modes, map art and portraits; the fog guard covers `mapLook` and portraits |
| A mid-month reload changes the map | Slow keys in the UI block, with the day-17 test |
| The art pass eats the schedule | The time box, the fixed cut order, the M1 floor, Off paths, owner rasters never on the critical path |
| Raster art drifts in style or color | One anchor per family, complete sets only, intake checks, the contact sheet, procedural fallbacks |
| Brass or embers read as mana colors | Aged brass only, never round, 2 px from any symbol; ember tones only on Cinder things |

## Appendix B. Files

- This design: `wartable-design/final.md` (assembled from `wartable-design/final-parts/`).
- New measurements: `wartable-design/final-calc/` (`regions-final.ts` with `regions-final.out`
  and `regions-final-b.out`, and the first run `regions-final-v1*.out`; `colors-final.ts`,
  `colors-extra.ts`, `joint-caps.ts`, `joint-caps2.ts`, `grounds-states.ts`, `fog-grounds.ts`,
  `modes-lift.ts`, `ramp-lift.ts`, `ramp2.ts`, each with its `.out`).
- Inputs: `owner-direction.md`, `proposal-immersion.md`, `proposal-instrument.md`, `judge1.md`,
  `judge2.md`, `research-tabletop.md`, `research-mapdetail.md`, `research-portraits.md`, the
  judges' and proposals' calc folders, the immersion sketch (`sketch/`), the staged docs
  (`/home/user/fm-docs/docs/`), the repository at `7a524b8`, `docs/12-battle-presentation.md`,
  `pretender-design/final.md`, `units-items-design/final.md`, `ui-design/spec-final.md`, and the
  mockup `ui-mockup/game-screen-v1.html`.
