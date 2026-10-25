I built the prototype. Letting the range spill outside its cells removes the frame on the Ashspine's hills and mountains side, but the frame stays on most of the other edges, so on the start view the light rim now covers more of all wild outlines than pass 2 (70% against 56%). Every existing check that passed in pass 2 still passes with 0 page errors, the colour-blind wild edge test passes everywhere (0 fails), Painted (v3) and Clear are pixel-identical to pass 2, and every load renders the same. The repo and the live build were not touched.

**What I built (Natural look only; Clear, the Terrain mode and the data modes keep their current wilds):**
- **Both ranges:** heights are now made at twice the bake's resolution, with crests along the range and spurs down its sides. The rock line follows the heights, so valleys run up as heath and spurs come down as rock. A 2× layer is drawn at Near, plus the rock grain at 0.6 strength, so the closest zoom is crisp rather than magnified. Peaks have no texel over the brightness cap and are no longer dark (median L\* 30.4, was 20.5).
- **The spill (Ashspine only):** foothills, relief, rubble and outcrops reach up to 0.21 D into Halevale, Karreach, Ashvale and Morholt. They never touch fields, farmland, water, a seat zone or a province that is not hills or mountains. Snow, frost and crags stay inside. The Greyteeth borders no hills or mountains, so the spill gives it nothing.
- **The edge:** the Natural contour ink is darker (`#0D0C0B`). The light rim is drawn only where neither the ground nor the ink reaches 20 / 12, and pass 2's pale/dark band at the range's foot is gone.
- **The Still Mere:** a lake with a wandering shore inside its cell, a shallow shelf and a deep centre in the map's water hue (ΔE 2.7 from map water, pass 2 was 7.3). The swamp continues into the cell with no seam.

**The numbers (this build / pass 2):**

| Measure | Result |
|---|---|
| Spill | 21,858 texels (0.83% of the bake), max 0.212 D out, CIE76 shift p50 8.9; 0 on fields, farmland, water, seat zones or other terrains; 956 under woods (relief only) |
| Rim, Ashspine's hills/mountains edges | 0.07–0.12 / 0.67–0.81 |
| Rim, Ashspine's other edges | 0.78–1.0 / 0.31–0.54 |
| Rim, Greyteeth | 0.80–0.98 / 0.22–0.38 |
| Rim, Still Mere | 0.34–0.64 / 0.98–1.0 |
| Peak core busyness, start view | 25.2/1.0 / 38.8/10.8 (owner reference 2's range is about 35/8.6) |
| Terrain readers, least zoom | 0.904/0.983 / 0.910/1.0: Karreach now reads as plains |
| Terrain readers, 60 px a province | 0.924/0.983 / 0.925/1.0: Ashvale now reads as plains |
| Terrain readers, other zooms | unchanged; the Mid failure was already there |
| Bake time (medians of 3 loads) | wild steps 3.28 s / 1.64 s; whole Natural bake 9.3 s / 8.0 s; first frame 12.8 s / 11.1 s |
| Memory | 11.3 MB of 2× canvases |

- **Hover and paths:** pointing at the spill names the neighbour ("Halevale · Hills") with no Impassable card. Just inside the line shows "Peaks · Impassable" and the cursor label. Right-clicking into the range is refused, and marches into the spill zone go around the range.
- **Lines and rails:** lines pass and the faint lines are unchanged; rails have 0 fails. The two known line misses (hover lines on Ashmoor/Elmwick, and two Clear hairlines) are identical in pass 2.

**The rule it changes:** "0 texels outside the wild's cells", which is also the approved map-relief rule that every pixel of land is where the sim's polygon says. Smaller changes come with it: the contour ink colour, the rim now counting the ink, and the removal of pass 2's apron band.

**Ask the owner, in my view.** It reverses an approved rule. It also works against "terrain read from what is drawn": the north of Halevale and Karreach now looks like mountain foothills, and two neighbours misread when zoomed out. And on this map it helps only about 40% of one range. I'd put shot 11b and the hover shot 16 in front of them.

**Weaknesses:**
- The frame stays wherever a wild meets dark land (forest, swamp, plains in the range's shadow), so the Greyteeth is framed on 80–98% of its outline.
- The near-black contour is heavier than before and still outlines the polygon at the start view.
- An olive heath band shows just inside the line, most of all round the Greyteeth.
- On the spill edges I lifted shade near the line to L\* 37 so the dark line reads, which leaves a slightly lit strip; at the least zoom the rim comes back there (78%).
- The ranges are calmer than the reference at a coarse scale: a grey mass with fine ridges more than big lit and shaded faces.
- The mere keeps a rim on 34–64% of its outline.
- Not done: no shots at double pixel density (the 2× checks were run).

Files are in /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/proto-open/:
- README.md
- game-screen-v4.html
- shots/
  - required views: 01-start.png, 02-far-least-zoom.png, 03-mid.png, 04-reference-zoom.png, 05-near-ashspine.png, 06-near-greyteeth.png, 07-near-still-mere.png, 08-closest-ashspine.png, 09-clear-start.png, 10-phone-390x844-fit.png
  - side by sides with pass 2: 11-side-by-side-start.png, 11b-side-by-side-start-wilds-2x.png, 18-side-by-side-near-ashspine.png, 19-side-by-side-closest-ashspine.png
  - extras: 12-closest-greyteeth.png, 13-closest-still-mere.png, 14-mode-supply.png, 15-terrain-mode-start.png, 16-hover-spill-halevale.png, 17-hover-inside-ashspine-army.png
- out/ (all measurements)
- tools/