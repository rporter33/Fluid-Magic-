All four line-floor failures are fixed. Every check passes on the final build (md5 `df2ee416…`) at 1× and 2×, with 0 page errors. The checks now also cover the views where the failures hid, and those runs pass too. The natural view at rest, Painted (v3) and the wilds are unchanged. For the art pass as a whole, pass 3's open items still stand: the light band on about half of each wild's outline, its four owner questions, and the Mid terrain reader at 0.931.

## Root causes and fixes

1. **Data modes at 2× (2.27:1).**
   - **Causes:** the internal keyline's ground was sampled at ratio-1 widths (2.5 + 2.5 px), so at 2× the 1 px keyline was solved on ground it does not cover. The solver also read the nearest texel of the half-resolution mode raster, while the screen draws it blended across the border. And a 1 CSS px keyline at 2× has no fully covered pixel on a 45° edge.
   - **Fixes:** the bands now follow the drawn widths, the ground is read bilinear as drawn, and the keyline is never under 2.5 device px (1.25 CSS px at 2×).
2. **Near view at camera 1180,300 (3.17–3.199).**
   - **Causes:** the same nearest-texel reading at Near. At Elmgate/Deepmoss the ground also turns from light to dark across the line, which the solver's whole-segment average cannot see.
   - **Fix:** each position along the line is now tested, using the honest coverage of its best pixel; the line's order and partner are chosen so no position fails.
3. **Natural hover check (2.14).**
   - **Causes:** a dark hedge sat under the dark lip beside a faint light lip. The new checks also found two 1.5 px lips on a 45° edge whose best pixel is covered about 0.63, not the assumed 0.8 (Karford/Ashstead, 2.11–2.17).
   - **Fix:** a per-position guard raises the weaker lip, or strengthens the faint one, or (at 1×) gives the serving lip 2 of the 3 px.
4. **Clear and the Terrain mode, hover or selection (1.44–1.64).**
   - **Causes:** the light hover/selection outline sat 1 px inside the border and covered the hairline's dark partner. Pass 2 had moved it to 3 px in Natural only. In Clear, the lines were also solved without the hover and selection tint (Halebrook 2.13).
   - **Fixes:** the outline now sits beyond the province line in every look (3 px, or 5 px for an owned province without a rail). The selected province's lines are solved on its tint. Clear's lines are solved for both the rest and the hovered state.
5. **Found by the new checks: Clear at rest (Redwick/Redbarrow 2.26).**
   - **Cause:** the partner-side rule put a dark partner on dark forest.
   - **Fix:** a partner only goes to a side its colour serves, and a per-position hairline guard backs this up.

## Checks
- **Why they hid:**
  - `reliefLinesHover` only ran in Natural, on 10–40 provinces.
  - `reliefLines` skipped segments under 6 px, so Far took 0 samples. It now samples them.
  - The harness never ran the Near view at 1180,300 or the data modes at 2×.
- **New part `p90`:**
  - `reliefLinesFocus` hovers and selects every province in view, in any look or mode.
  - `reliefLinesRest` samples every province line at rest, along whole edges.
  - `reliefLinesSweep` runs both over 7 views (including Far, the least zoom and Near at 1180,300) × 7 modes. The harness `focus.cjs` runs it at 1× and 2×.

## Numbers, before → after
| Measure | Before | After |
|---|---|---|
| Data modes at 2×, internal lines | 2.274 min, 99 samples under, 6 rows failing | 3.326 min, 0 under |
| Near view at 1×: Clear / Terrain mode / Springs | 3.199 / 3.199 / 3.171 | 3.37–3.43 |
| Natural hover check, Mid / Near | 2.137 / 2.287 | 2.628 / 2.431 |
| Real pointer, Clear hover on Ashmoor (start / Mid / Near) | 1.646 / 1.555 / 1.544 | 3.17 / 3.11 / 3.18 |
| Real pointer, Terrain mode selection on Ashmoor | down to 1.473 | 2.87–3.10 |
| Real pointer, Fenvale / Gallreach (Clear) | down to 1.555 | 2.47 or more |
| New sweep, failing rows (natural, Clear) | 1×: 45 and 35 of 49; 2×: 19 and 26 | 0 at both densities |
| Far, Clear | 0 samples taken | 3,005 samples, min 2.32 |

- **Natural at rest:** 0 changed pixels at 5 views; faint lines median 1.245, as before.
- **Clear and Terrain mode:** the land layer is identical. Pixels change only within 7 px of a province line, so the distinct-colours rule is unaffected.
- **Determinism:** identical frames and bake hashes on fresh loads in Natural (3), Clear and the Terrain mode (2 each).
- **Painted (v3):** pixel-identical at 10 views.
- **Wilds:** the wild sweep and the three other maps give the same results as pass 3 (smallest margins 1.097 / 1.112; 1.069 / 1.001 / 1.071).
- **Other checks:** every other existing check passes. The Mid terrain reader (0.931) is unchanged and still open from pass 2.

## Visible changes and costs the owner will see
- In Clear, Terrain and the data modes, the hover/selection outline is now a second thin line inside the border instead of merging with it.
- Clear in Ownership has more two-tone lines at rest: 228 → 320 segments with a partner at the start view. That is the price of holding the floor when a province is hovered.
- The internal keyline at 2× is 1.25 px wide instead of 1 px.
- Clear redraws its lines 80–200 ms slower when the zoom step, look, mode or month changes. Normal frames and hover frames are unchanged.

## Files
- Page: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/game-screen-v4.html`
- Parts in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/`:
  - New: `p59g-line-guards.js` (91 lines), `p90-line-floor-checks.js` (77)
  - Changed: `p59b-relief-lines.js` (303), `p59-relief-draw.js`, `p88-natural-checks.js`
- Build script, updated: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/build.sh`
- Decisions and numbers: "Line pass" section at line 1203 of `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/design-final.md`
- Backup of the pass-3 parts, page and doc: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/linefix/before/`
- Tools: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/linefix/tools/` (`focus.cjs`, `runall.sh`, `lprobe.cjs`, `lshots.cjs`, `perf.cjs`)
- Outputs: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/linefix/out/final/`
- Shots, all reviewed: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/linefix/shots/` (before/after side-by-sides in `sbs/` and `sbs-dpr2/`)

Nothing in `/home/user/Fluid-Magic-` was touched (`git status` is clean).