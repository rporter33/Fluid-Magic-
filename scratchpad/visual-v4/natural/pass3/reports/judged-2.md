The art pass isn't ready for the owner yet. I judged all three wild prototypes; each passes its 18 standard check views but breaks the colour-blind wild edge rule (20 / 12) at camera positions or on maps its builder didn't test. Pass 2 doesn't break it anywhere I looked. The full report is at `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge-rules.md`.

| Prototype | Score | Why |
|---|---|---|
| Sculpted massif | 6 / 10 | The mountains and lake keep every rule I tested on four maps and look right on all of them. The weak part is how it decides where the light edge line goes: it reads screen pixels on every redraw, flickers when the camera pans less than a pixel, and makes redraws 2–4.5× slower. That logic is one replaceable 59-line part. |
| Continuous relief | 5 / 10 | Best edge logic: worked out once per zoom from data, steady when panning, cheapest redraws. But the approach itself causes problems tuning can't fix: farmland mirrored inside an impassable wild on another map, a light line on 76–88% of the outline, and fog drawn inside the wild (breaks an approved rule). |
| Open (spill) | 3 / 10 | Reverses an approved rule (wild drawing only inside its own provinces). The gain depends on the map: 239 texels on seed 7, nothing for the Greyteeth. Most colour-blind failures (12 samples, worst 0.82), two neighbours read as the wrong terrain, slowest bake. |

**Edge test failures outside the standard views** (every miss is 1–4% short of 20 / 12, except open's worst at 18%):
- **Pass 2:** none.
- **Relief:** 3, including one on the main map at the Ashspine's closest zoom, confirmed with the page's own check.
- **Massif:** 3, plus 1 sample at each of 3 of the 24 sub-pixel pan positions I tried.
- **Open:** 12.

**Ship the Sculpted massif as the base, with these grafts:**
1. Replace its edge logic with the relief's: worked out once per zoom and cached. That costs 17–71 ms per zoom instead of 115–408 ms per redraw, and stops the flicker.
2. Raise every contrast margin to at least ×1.2.
3. Include the hovered neighbour's tint in the decision. No build does today, pass 2 included: hovering Stagmoor drops the Ashspine edge to 0.85–0.94.
4. Free the massif's roughly 26 MB of working data after the bake, and delete pass 2's leftover wild code when merging.
5. Take the open prototype's lake water and shoreline, and its interaction checks.
6. Add these to the check suite: the 30-camera sweep, each wild's closest zoom, sub-pixel pans, and three other maps (seeds 7 and 31, plus a four-wild layout).

Don't graft the relief's fog or mirrored land, or the open prototype's spill.

**Questions for the owner, only if the massif is kept:**
- Should snow be allowed above pass 2's brightness cap? The massif takes it to L\* 82.
- Is a 2 px edge line acceptable instead of the approved 3 px?

The defaults would be to keep the cap and 3 px.

**Also checked:**
- **Repeatable rendering:** fresh reloads give identical frames and bakes in all three.
- **Unchanged looks:** Clear, the Terrain mode and Painted (v3) are pixel-identical to pass 2.
- **Errors and part size:** 0 page errors in 111 sessions, and every edited part is under 400 lines.

I edited nothing in the prototypes, the live mockup or the repo (`git status` is clean). Timings for pass 2, relief and massif are from a quiet machine; the open build's ran after the art workflow loaded it, so its numbers are noisy.

Evidence is in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge-rules/`:
- `out/`: all measurements
- `shots/`: comparison sheets, including `pop-massif-start-sbs.png` (the pan flicker) and `hovdbg-p2-start-sbs.png` (the hover gap)
- `tools/`: the scripts