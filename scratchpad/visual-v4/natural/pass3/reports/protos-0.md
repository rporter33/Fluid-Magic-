I built the "Continuous relief" prototype in the sandbox. The ranges now grow out of the land, are crisp up close, and the mere is a lake inside its cell; every check passes with 0 page errors. The main thing still wrong: a thin light line still runs inside the dark outline on most of each wild's edge (76–88%). It is darker and land-coloured now, but at the start view and the least zoom it still reads as a faint frame.

**What I built** (Natural look only; Clear, the Terrain mode and the data modes keep their current wilds):
- **Ranges:** each wild is the land's own heightfield continued under its cells, plus a ridged range that starts at zero on the outline and rises slowly. Heights, slope and light are worked out at twice the bake resolution. The bake averages them, and the double-resolution image is drawn over the bake at Near, which is why the closest zoom is crisp.
- **Look of the ranges:**
  - Light comes from the north-west, giving lit faces and dark faces.
  - Scree lies in the valleys, and snow sits on the highest crests, under the existing brightness cap.
  - Crests and steep faces turn to rock first.
  - Below the rock line, the foothills are the neighbouring land mirrored across the edge, so woods and fields carry on inside.
- **Land around the ranges:** its shading next to the outline and its cast shadows are recomputed from the same heights.
- **Mere:** the lake is an ellipse fitted to the cell, with a noisy, wandering shore kept off the straight edges. It has a lighter shallow shelf, a darker centre, the map's water hue, and the neighbouring marsh and fields continued between the outline and the shore.
- **Edge:**
  - The outline is a 3 px near-black line.
  - A light rim is added only where that line fails the colour-blind contrast test against both sides. Its colour is the darkest that passes, tinted to the land on that edge.
  - Unexplored neighbours' fog now runs into the wild's continued land.

**Numbers** (pass 2 in brackets):
- **Checks:** all pass in Natural (18 views; 7 at double density), Clear and the Terrain mode. The colour-blind wild edge test has 0 failures in every view. Lines and realm borders (rails) pass. One hover-line dip (Ashmoor/Elmwick, 2.14:1 at Mid) is the same one the pass-2 verifier found.
- **Wild look:** peaks lightness p5/p50/p95/max 11.4/27.2/48.1/54.7, with 0 pixels over the cap. The mere's water is ΔE 6.9 from the map's water (7.3).
- **Rim:** a rim shows on 76–88% of the outline (53–59%; 100% at the least zoom). The verifier's measure of a pale rim pixel (lightness 65+) drops to 23% at the start view (57%), 72% at the least zoom (100%), 23% at the reference zoom (57%), and 27% round the mere at Near (100%).
- **Busyness** (verifier's metric; Mid-view numbers for the ranges, the other views are in the README):

| Measure | View | Now | Pass 2 |
|---|---|---|---|
| Range cores | Start | 36.1 / 3.4 | 38.8 / 10.8 |
| Range cores | Mid | 37.5 / 7.6 | 20.7 / 3.6 |
| Range cores | Closest | 28.2 / 7.5 | 5.8 / 0.4 |
| Wild edges | Start | 48.3 / 13.2 | 53.5 / 26.2 |
| Wild edges | Mid | 50.5 / 7.8 | 58.5 / 23.4 |

  Owner reference 2's range measures 34.9 / 8.6.
- **Terrain readers:** the same as pass 2 at every zoom except the least zoom, where province accuracy is 0.983 (was 1.0); Karreach reads plains, still above the 0.95 floor. The pass/fail result matches pass 2 everywhere; Mid still fails, as it did before.
- **Determinism:** fresh loads give identical frames and bake hashes (Natural 3 of 3, Clear and Terrain 2 of 2). One extra load on the busy machine showed a different start frame; the pass-2 verifier saw the same behaviour before this change.
- **Sameness:** Painted (v3) is pixel-identical in 10 views. Clear and Terrain are pixel-identical to pass 2. The supply mode differs by at most 5/255 on 690 pixels.
- **Bake time:** the wild steps take a median 4.8 s against 2.5 s for pass 2, and the full natural bake 14.8 s against 11.4 s CPU, on a busy shared machine. A quiet run took 2.3 s and 8.4 s.
- **Zoom settle:** the rim decision takes 105–320 ms each time a zoom settles (once 753 ms), against 20–209 ms in pass 2.

**Rules it changes:**
1. The light rim now appears only where both the ground and the dark outline fail the colour-blind test, and in a solved land-tinted colour instead of cream.
2. The Natural outline colour is `#0B0A09` instead of `#1C1A17`.
3. "Wilds are never fogged" no longer holds for the land continued inside them; rock and water stay unfogged.
4. Pass-2 critique fix 3a is reversed: the land continues inside the cells again.
5. Pass-2 critique fix 4 (rock grain at Near) is replaced by the double-resolution layer.

**Weaknesses:**
- **Frame:** the rim is a thin pale inner line next to woods and peat pools, worst round the Greyteeth and the mere. The black outline is heavy at the least zoom, and the cell shape is always visible.
- **Ranges:**
  - The rock is busier than pass 2 at Mid and Near, and its fine detail is about twice owner reference 2's, so some may read it as crumpled.
  - On long straight edges the rock line runs straight about 0.15–0.2 D inside the outline.
  - Mirrored land repeats fields and leaves a faint seam at corners (the Ashspine's north-east corner).
  - Snow under the cap reads as pale rock rather than white snow.
  - At the Ashspine's west end the passable Morholt mountains are mirrored into the foothills, so there only the line says "impassable".
- **Mere:** it has no double-resolution layer, so its shore is soft at the closest zoom, and the marsh fringe still traces a polygon.
- **Cost:** about 2 s more bake time (more on the busy machine), slower rim decisions on zoom settle, and about 4 MB kept for the Near layer.

Everything is in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/proto-relief/`. The edited parts are `p58w`, `p58m`, `p59`, `p59b` and `p59c`, plus the new `p58x`; `build.sh` adds `p58x`, and every edited part is at most 332 lines. Nothing in `/home/user/Fluid-Magic-` was touched (`git status` is clean).

Files are in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/proto-relief/`:
- README.md
- game-screen-v4.html
- shots/01-start.png
- shots/02-far.png
- shots/03-mid.png
- shots/04-ref-zoom.png
- shots/05-near-ashspine.png
- shots/06-near-greyteeth.png
- shots/07-near-still-mere.png
- shots/08-closest-ashspine.png
- shots/09-closest-greyteeth.png
- shots/10-closest-still-mere.png
- shots/11-mid-greyteeth-mere.png
- shots/20-clear-start.png
- shots/21-clear-near-ashspine.png
- shots/22-terrain-mode-start.png
- shots/23-mode-supply.png
- shots/30-phone-390x844-fit.png
- shots/40-side-by-side-start.png (against `pass2/shots/01-start.png`)
- shots/41-side-by-side-start-wilds-2x.png
- shots/42-side-by-side-closest-ashspine.png
- shots/43-side-by-side-near-mere.png
- out/ (check results, dumps, readers, timing, sameness)
- tools/