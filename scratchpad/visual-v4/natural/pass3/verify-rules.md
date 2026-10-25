# Pass 3 verification (rules, regressions, accessibility): FAIL, not ready for the owner's review

I verified the final page, `map/game-screen-v4.html` (md5 `6b504c85…`), on my own and edited nothing. Rebuilding it from `map/parts/` with `build.sh` gives a byte-identical file. Every part edited in pass 3 is under 400 lines (the largest is `p59b` at 303). `git status` in `/home/user/Fluid-Magic-` is clean.

**Verdict: FAIL.** Most standing rules hold:
- Line floors at rest, on hover and on selection, for every province.
- The realm band rule.
- Painted (v3) sameness.
- Clear and Terrain-mode land identical to pass 2.
- Three fresh loads identical.
- 0 page errors in every session.

But the colour-blind wild-edge test fails in places the builders never ran:
- the least zoom at 2× on the main map;
- the start view and the sweep on a map seed nobody had tried;
- two data modes centred on the Ashspine (this one is inherited from pass 2).

Also:
- The Far terrain reader fails the page's own Far floor at 60 px per province.
- The least-zoom frame depends on timing: it differs depending on whether the idle prefetch ran before the player zoomed out.
- The owner's visible complaint is still there. Every wild is still a straight-edged polygon fully outlined in black ink, with a pale band along 62–82% of the outline.

Three builder claims are not true as stated:
- "every check passes at 1× and 2×";
- "a frame is the same whether its rung was decided ahead or not";
- the edge decision being robust on other maps.

## What I ran

All of this ran on the final build, under heavy shared load; timings are noisy. Tools are in `pass3/verify-rules/tools/`, outputs in `pass3/verify-rules/out/` (logs in `out/logs/`), and shots `V-*.png` in `pass3/verify-rules/`. I looked at every shot, mostly through the contact sheets `V-sheet-*.png`.

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Rebuild, part sizes, repo | PASS | Rebuilt page is byte-identical (md5 `6b504c85…`). Edited parts are 14–303 lines. Repo clean. |
| 2 | Every built-in check (`p86`–`p91`): Natural, Clear and Terrain mode at 1440×900, 1× (19 views plus hover/focus/extras) and 2× (10 views) | **FAIL** | Natural 2× least zoom: `reliefWildEdge` 1 of 138 samples fails (Still Mere/Oakmarch, 0.995), and `reliefWildMargins` fails with it. Natural 1× Far (60 px): `farPass` false. Readers `pass:false` at 6 of 9 Near views (1×) and 2 of 4 (2×). Everything else passes: lines, rest floors, rails, means pairs (0 under), seats, layout, hit, chips, cliff, names in view, wild names, stability, hover lines (200 provinces), `reliefLinesFocus` at 4 views, wild look, footprint, interaction, start-clear, snow, chroma, design, rebake. |
| 3 | The same on the phone (390×844: Natural and Clear at 3×, Terrain at 1×) | **FAIL** | Least zoom (Fit, 26.6 px): `reliefLayout` reports a name over a piece (Deepmoss over the seat in Ashdale) in all 3 looks. Readers throw at 3 Near views ("Cannot read properties of undefined (reading 'length')"). Every other check passes. |
| 4 | Data modes | Mostly PASS | `modes.cjs` (7 modes × 3 views, both looks, 1× and 2×): all rows pass. `reliefLinesSweep` (7 views × 7 modes, every province hovered and selected): 49 of 49 rows pass in all four runs (Natural/Clear × 1×/2×). The wild-edge failure in Dominion and Springs is defect 4. The readers check in Natural data modes and the means check in Clear data modes report false failures, because they test terrain colours that a data mode replaces. |
| 5 | My line-floor probe: real pointer, every province in view hovered then clicked, ±7 px WCAG contrast every 1 px | PASS | Natural, Clear and Terrain at 1×, 6 views each: 0 of 185 provinces have a sample under the floor (lowest 2.40 / 2.47 / 2.49). Natural 2× (3 views) and Supply 1× (3 views): 0 under. In Natural, the other lines stay faint while hovering (p90 at most 1.29; at rest median 1.245, p90 1.336, max 1.76). |
| 6 | Realm band rule | PASS | Page check: 0 failures in every look, mode, view and density. My probe (every 2 px along each realm edge, my own CIEDE2000 and Machado maths) finds 0 failures over about 290,000 samples, except 2 samples within 4 px of the Rookmere/Briarstead corner at Far, where the rails meet at a mitre. The pass-2 page shows the same 2. |
| 7 | Distinct colours in Clear and the Terrain mode | PASS (inherited caveat) | Page means/pairs: 0 under 20/12 in every view. The land layer is pixel-identical to pass 2 at 4 fixed views, so the rule's status is unchanged. Caveat: my per-province median probe finds 9 non-adjacent pairs under (worst: Brammere (hills, unexplored) / Briarmarch, tritan 10.6), identical on the pass-2 page. Morholt's mean budget is 0.50–0.51 against 0.5 (inherited). |
| 8 | Wild edge (colour-blind test) | **FAIL** | See defects 1, 2, 4 and 8. Passes: the page sweep on the main map (0 of 16,904 at 1× and 2×; minimum margin 1.097 / 1.094) and seeds 7 / 31 / four-wild / 3 (minimum margins 1.077 / 1.001 / 1.071 / 1.103). Clear and Terrain: 0 failures in my dense probe. Real-pointer hover and selection of every wild neighbour (70 rows, 1× and 2×): 0 failures under the check's own 6 px end rule. |
| 9 | Terrain readers at every zoom (page reader plus my own reader on dumps) | **FAIL** | Far 60 px: unexplored 0.859 against the 0.88 floor, both in the page's port and in my reader. 53.7 px: 0.901. 75 px: 0.899. Mid pooled: 0.972 / 1.00. Reference zoom pooled: 0.969 / 0.963. Near pooled: 0.888 / 0.917, and unexplored land at Near only 0.38 (both the same on pass 2). |
| 10 | Determinism: 3 fresh loads | PASS, with one timing defect | Natural, Clear and Terrain: 3 of 3 loads identical at 6 views each, bake hashes too. Rebake identical. But the least-zoom frame depends on timing (defect 3). |
| 11 | Painted (v3) against `pass3/before/` | PASS | Settled frames identical at all 10 views (2 loads each) to the pass-2 page and to the page before the natural view. Its checks are identical apart from timing fields. |
| 12 | Scripted sessions, every control | PASS | 0 page errors: Natural, Clear and Terrain at 1440×900; Natural at 1280×720 and 390×844. Covered: hover naming, selection, right-click moves, all 3 wilds ("No path crosses the Ashspine.", Impassable cards), every mode by button, M, Shift+1–7 and the rail, every zoom band, drag, Z, Fit, every control, vision, time-lapse, clock and every panel. On the phone the mode column and Fit button are hidden by design; I tested the 3 wilds separately at Fit (hover, card and refusal all work). 0 page errors in every other probe too. |
| 13 | Frame and bake times (low-load re-measure, against pass 2) | Costs, no rule failure | Natural bake CPU 8.7–9.2 s (pass 2: 7.1 s). The wilds' steps take 3.3 s (pass 2: 1.7 s). Ready at 12.0–12.5 s (pass 2: 10 s). JS heap 150–159 MB (pass 2: 125–133 MB). Cold static redraw 10–45% slower (Near 120–165 ms against 99–120 ms). Hover frames 4–13 ms (pass 2: 3.5–12). Pan frames at 1×: draw p50 0.7 ms, same as pass 2. |

## Defects (most important first)

1. **The colour-blind wild-edge test fails on the main map at the least zoom at 2×.**
   - Still Mere/Oakmarch, canvas point 735,426: the page's own `reliefWildEdge` gives 0.995 (W `#33433c` against G `#3f4722`), and `reliefWildMargins` fails too.
   - Reproduced in 3 independent fresh loads. My probe finds 0.956 at 736,426 and 0.996 at 735,426, 6 px from the edge's end.
   - The crop shows why: the stone band stops short, and only black ink separates the continued swamp inside the wild from the swamp outside.
   - The builders' 2× harness never ran the least zoom, which is why the claim "every check passes at 1× and 2×" got through.
   - Shots: `V-fail-dpr2-min-mere-oakmarch-crop6x.png`, `-full.png`.
2. **The wild edge fails on a map seed nobody had tried (seed 44).**
   - Start view: the page's own check gives the Ashspine/Oakreach (plains) edge 0.909. The same result on a fresh load; it passes at 2×.
   - The page's own sweep has 4 failures, minimum 0.839 (start view panned by 0, 0.61). My dense probe finds 0.782.
   - The decision was tuned on seeds 7, 31 and the four-wild plan. My seed 3 passes (1.103); seed 44 does not.
   - Shots: `V-fail-s44-start-ashspine-oakreach-crop6x.png`, `seed-s44-*.png`. Variants: `pass3/verify-rules/variants/`.
3. **The least-zoom frame depends on timing.**
   - Zoom out before the idle prefetch has run, and the frame hashes `c33f5f30` with the band on 0.796 of the outline. Zoom out after it has run, and the frame is `11cf5f24` with 0.784.
   - Reproduced twice each, in fresh browsers. Mid, the closest zoom and one wheel step are timing-independent.
   - This contradicts the `p59x` comment ("a pure cache, so a frame is the same whether its rung was decided ahead or not").
   - Three loads only match because my harness waits the same time on each. A player on a slow machine, or one who zooms out quickly, gets a different frame.
   - Evidence: `out/histdiag3-dpr1.json`. A random session of zooms, hovers and clicks also changed the least-zoom frame (`out/hist-natural-dpr1.json`).
4. **Data modes fail the wild-edge test at Mid on the Ashspine.**
   - Dominion and Springs, camera at Mid centred on the Ashspine: Ashspine/Halevale 0.927 and Ashspine/Ashfen 0.99 (3 samples, the page's own check).
   - The pass-2 page gives identical results, so this is inherited. It was never caught because data modes were only checked at 3 cameras, none centred on a wild.
   - Cause: the cream rim is too thin on a 45° edge at 1×.
   - Shots: `V-fail-dominion-mid-ashspine-halevale-crop6x.png`, `V-modewild-*`.
5. **The Far reader fails the page's own floor at 60 px per province.**
   - At 1× and 60 px, `farPass` is false: actual-unexplored accuracy is 0.859 against 0.88.
   - My own reader on my own dump gives the same 0.859.
   - It passes at 53.7 px, which is outside the 55–85 px Far band, and at 75 px (0.899). The polish report quoted 53.7 px only.
   - Improved from pass 2 (0.812 at 60 px). Passes at 2× (0.884).
6. **The owner's complaint is still visible (not a rule failure, but it decides "ready for review").**
   - All three wilds keep a continuous black 3 px ink outline: ink on 100% of the outline in every view I measured.
   - The edges are the straight polygon edges of the cells. The pale stone band covers 0.62 of the outline at the start view and 0.78–0.82 zoomed out, against the art target of 0.40 or less.
   - The Still Mere is a natural lake inside a fully inked polygon frame.
   - The ranges are better than in pass 2 (lighter, sculpted, snow-capped, with the land continuing inside the cells). But inside the frame the land runs on, so the black polygon cuts straight through forest and swamp. The range still does not grow out of the land.
   - Shots: `V-01`, `V-04-*`, `V-05-*`, `V-06-*`, `V-21-dpr2-max-Greyteeth.png`.
7. **Phone, least zoom (Fit):** a name sits over a piece (Deepmoss over the seat in Ashdale, or in Elmwick) at 6 of 9 camera positions, in all three looks. Shots: `V-phone-overlap-natural-*.png`.
8. **Dense sampling still finds misses that the page's sweep cannot see.**
   - Method: every 1 px instead of the check's every 4 px, with the check's own 6 px end rule.
   - 1×: 1 failure in 307,488 samples (Greyteeth/Fenvale, 0.976).
   - 2×: 2 failures in 305,439 (Greyteeth/Lanstead 0.968 mid-edge, and the Still Mere case of defect 1).
   - All are at cameras outside the page's seeded sweep. The pass-2 page has 2 failures in 73,656 (0.92), so this is better than pass 2, but not zero.
9. **Reader checks misbehave.**
   - On the phone they throw at Near views.
   - On desktop they report `pass:false` at 6 of 9 Near views. Province accuracy is 0.80–0.94 there, against design §5.2's 1.00. There is no formal floor at Near, and the result is inherited (my reader: 0.917 now and on pass 2).
   - They, and the Clear means check, are not limited to the Ownership mode, so they report false failures in data modes.
10. **The builders' evidence is weaker than reported.**
    - The polish pass's full suite (checks, modes, determinism, v3 sameness, sweeps, seeds) ran on md5 `9198092f…` at 07:50. The final `6b504c85…` (built 08:55, after `p88b` changed) only got a few repeat runs.
    - The harnesses skipped:
      - the 2× least zoom;
      - readers outside the start view, Mid and the reference zoom;
      - data-mode cameras centred on a wild;
      - any unseen map seed.

Every failure above was reproduced, and none is inferred from code alone.
