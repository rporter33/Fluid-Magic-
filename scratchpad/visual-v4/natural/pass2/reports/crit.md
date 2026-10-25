# Natural map, pass 2: art direction and QA critique

The critique is written. It has eight prioritized fixes, each tied to a part file, function and exact change, with evidence and a "done when" test. The faint neutral lines are right and need no fix. The biggest problem is the new Far relief: it redraws every province outline and pushes the Far terrain reader under its floor (patch 0.845 against 0.90).

I edited nothing in the repo, in the parts, or in the build or published page; `git status` is clean. The page logged 0 errors in all 7 shot sessions and in the 6 probe sessions that recorded errors. I compared against owner references 2, 3 and 4 for direction only. I did not re-check Painted (v3) sameness or determinism; I took the builder's hashes as given.

## Verdict

**Faint neutral lines: right, no fix needed.** I measured, per edge, how much the line changes the pixel under it (median over each edge):

| View | Edges | p10 / p50 / p90 |
|---|---|---|
| Start | 84 | 1.22 / 1.25 / 1.27:1 |
| Reference zoom | 41 | 1.20 / 1.23 / 1.27:1 |
| Far | 73 | 1.22 / 1.25 / 1.31:1 |

- No edge is under 1.10 (lost) and none is over 1.5 (a grid).
- Hovering or selecting a province brings its own lines up to the colour-blind floor, and they read clearly (shots a16 to a19).
- Realm borders sit clearly on top, and the hover card names the terrain.

**The land is calmer and more continuous than Clear.** I measured how much of the land's light/dark structure sits on province borders, relative to the area those border strips cover. Higher means the borders show through the terrain more:

| View | Natural | Clear |
|---|---|---|
| Start | 1.29 | 1.76 |
| Reference zoom | 1.31 | 2.05 |
| Far | 1.20 | 1.62 |

**Three things still work against "clean, natural, the model on the table":**
1. **Far:** the new relief draws every province outline, so the board reads as a quilt.
2. **The wilds:** they still read as foil-textured grey plaques in a dark-and-cream frame, and are out of focus up close.
3. **Smaller views:** the phone at Far and the right-edge controls still hide or misplace names. The verifier's defect 3 is only fixed for the start view.

## Fixes, in priority order

1. **The Far relief draws the province grid and breaks the reader floor** (`p59c-relief-detail.js`, `rlFarRaster()`).
   - **Cause:** each province has its own average shading subtracted as a constant, which leaves a step at every border. The removed amount runs from −48.8 to +7.8 grey levels; the step across borders has p90 23.3 and max 44.5.
   - **Reader impact:** at the least zoom, patch 0.845 and province 0.983, against floors of 0.90 and 0.95. Without the relief it reads 0.956 and 1.0.
   - **Change:** subtract a blurred version of the per-province average instead, and scale the light and shade by each texel's terrain relief strength, so hills, mountains and ranges stand up while farmland and swamp lie flat.
2. **The range's interior reads as crumpled foil** (`p58w-natural-wilds.js`, `RL_NW`, `rlNatWildGen()`, `rlNatWildTexel()`).
   - Its fine-detail energy is 2.5× the surrounding land at the start view and 2.1× at the reference zoom; owner reference 2 is 1.0×.
   - Its lightness (p5/p50/p95) is 14.5/30/52.2, against 4.1/22.4/47.0 for the range in owner reference 2.
   - **Change:** soften the heights the way the passable mountains already are, use fewer and longer crests, and darken the shade faces.
3. **The wild reads as a fenced plaque** (`rlNatWildTexel()` and `RL_NW.peaks.footD`; `p59b-relief-lines.js`, `rlDrawWildContours()`).
   - The ground just inside the outline is mirrored land, so the wild/land check passes on the ground alone on only 27 of 305 samples at the start view (2 of 434 at the reference zoom). The dark-and-cream frame carries the whole "impassable" read.
   - That frame uses the same dark-plus-light grammar as a realm border.
   - **Change:** start the rock and scree at the outline, keep the 3 px dark line everywhere, and draw the light rim only where the ground pair fails the colour-blind test. There is a fallback if the owner treats the rim as approved in Natural too.
4. **The wilds are out of focus at close zoom** (`rlNearDetail()`).
   - Every wild texel is skipped by the close-zoom detail pass, so at the closest zoom the Ashspine has 0.93× and the mere 0.85× the land's fine detail, next to crisp land.
   - **Change:** give the peaks the rock-grain tile in that pass.
5. **The enemy capital Deepmoss loses its name under the right-edge controls** (`p61-relief-pieces.js`, `rlLayout()`, `tryPlace`).
   - At the reference zoom its town sits under the Near and Fit buttons, and its name is placed past the canvas edge, where nobody can see it.
   - **Change:** reject label spots off the canvas or view, and try the spot left of the town first when the controls are in the way.
6. **The phone at Far is a mess** (`computeScales()`, the wild-name loop in `rlLayout()`, `rlArrow()`).
   - The least zoom is 17.6 px per province, with the model 160×100 px.
   - Wild names overflow their wilds by 25 to 65 px, and town names fall off the model.
   - The "4d" day chip ends up under an army piece; at the least zoom the path's chip is off the model.
   - **Change:** floor the phone's zoom at Fit, drop wild names that don't fit, and keep chips off pieces.
7. **Zoomed out, the model's edge reads as a tray** (`rlRenderStatic()` worn lip; `rlRim()` face, Natural branch only).
   - A uniform cream line runs round the whole rectangle.
   - The south cliff face spans only lightness 10 to 23, against 0.6 to 45 on owner reference 4's cliffs.
   - **Change:** draw the light lip only on the north and west sides, and give the face lit ledges and a darker foot.
8. **The mere is the province shape shrunk** (`RL_NW.mere`, `rlSculptWildsNat()`).
   - A band of swamp-looking marsh sits inside the frame.
   - At close zoom, white snags read as "Y" icons and are the brightest marks on the lake.
   - **Change:** bring the shore to the outline and remove the white snags.

Also noted, but not fixes:
- **Realm tint (owner question 1):** worth re-asking now that the lines are faint, since an owned interior now reads like unowned land.
- **Mid terrain reader:** 0.931 against the 0.95 floor, from before this pass.
- **Swamp pools:** 19.8% of swamp, within the design's 15 to 20%.
- **1920×1080:** the least zoom never reaches Far, so the relief shows at about 0.45 strength.
- **1280×720:** at the start view the alerts ribbon sits over the Ashspine.

Files are in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/`:
- `critique.md` (the full critique)
- `ad/sheet-evidence.png` (five evidence panels and an owner reference 2 crop, labelled direction only)
- `ad/shots/` (my shots)
- `ad/out/` (probe numbers, including `far-raster-2x.png`, `readers.json`, `probe-nat.json`, `probe-2.json`)
- `ad/tools/` (the probe scripts: `adprobe.js`, `probe.cjs`, `readers.cjs`, `hfref.py`)