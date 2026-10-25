Natural map pass 2: build, measurements, deviations and files

All four pass-2 items are built and rebuilt into the mockup. Every `window.__mock` check passes in Natural, Clear, Terrain mode and Painted v3, with 0 page errors in every session. The exceptions are the Mid terrain readers, which failed the same way before this pass, and the deviations listed below. Nothing in /home/user/Fluid-Magic- was changed (`git status` is clean).

**What was built**

1. **Faint province lines (owner decision).**
   - In the Natural ownership view, lines between unowned provinces and the inner lines of a realm are now faint: median contrast 1.22–1.25:1, p90 1.31–1.35, max 1.98 (dpr2 max 2.02).
   - Around the hovered province (live) and the selected province (static), those lines rise to the colour-blind floor: hairlines 2.3:1 and inner keylines 3.2:1.
   - Realm borders, Clear, Terrain mode and the data modes keep every line at the floor.
   - The checks behind this are `reliefLines()` (faint statistics plus floor) and the new `reliefLinesHover()`.
2. **Wilds as natural landforms (Natural look only).**
   - Peaks are a ridged range stretched along the wild's long axis, with foothills, valley shading and cast shadows. A rock gully texture is added at full resolution.
   - No peak texel is lighter than the brightest lit passable mountain rock plus 2.5 L*.
   - The mere is a lake with a natural shoreline: a deep centre, a shore band, reeds, faint ripples and a few snags, in the map's water hue.
   - The footprint is exactly the wild's cells, edged by a dark lip and a light rim. Data modes in Natural get a wild layer of their own.
   - New checks: `reliefWildEdge()` and `reliefWildLook()`.
3. **The verifier's six defects.**
   - Internal keylines under 3.2:1 at joints: each colour run is now one path, segments overlap by 0.5 px, and the stroke order is chosen per edge. The Redbarrow/Ashmoor 2.28 dip is gone.
   - Phone day chips over names at min zoom: chips now search a ring of positions and use compact text. Overlaps went from 1 ("4d over Halevale") to 0.
   - Names and towns under the right-edge controls: the controls column is excluded from the view in relief. Labels and wild names avoid it, the column is compact, and the camera clamps on the full view so no empty strip shows behind it.
   - Clear hairline at Karford/Ashstead (1.84–2.09): diagonal edges now use a 2 + 1.5 px pair. The Clear minimum is 2.379.
   - Wild-rim sample at Ashspine/Morholt (and Greyteeth/Marholt in Clear): the rim is 2 px, visible at 0.85 in every look. The wild edge check now has 0 failures.
   - Mountain cores borderline busy: the mountain shading is softened. Core busyness went from 31.6 to 29.0 at the start view and from 22.9 to 10.1 at Mid.
4. **Far reads as a sculpted model.**
   - A soft-light relief from blurred heights (wild heights included) with lit and shaded slopes and cast shadows. It is neutral on average within each province, fades in between 85 and 58 px per province diameter, and appears in the Natural ownership view only.
   - The board casts a longer shadow on the oak, with a contact shadow under the cliff edge, in Natural only.

**Measurements**

Busyness uses the verifier's metric: the share of neighbouring 6 CSS px cells that differ by more than 10 / more than 20 L*, inside the model. The last column is the share of model cells where the lines move lightness by more than 6 L*.

| View | Before pass 2 | Pass 2 | Line cells >6 L* (before → after) |
|---|---|---|---|
| Start | 22.6 / 6.8 | 19.2 / 4.6 | 9.0% → 1.7% |
| Mid | 19.2 / 6.3 | 14.4 / 3.7 | 5.2% → 1.3% |
| Reference zoom | 17.1 / 5.6 | 12.5 / 3.4 | 5.0% → 1.1% |
| Far | 27.0 / 6.7 | 27.8 / 6.7 | 13.8% → 3.1% |

For comparison, ref-2 scores 11.0 / 2.1 with 6 px cells and 14.4 / 2.7 with 12 px cells (about 6 CSS px). Ref-4 scores 10.6 / 3.1 and 17.0 / 4.9.

- **Hover and selection floor:** hairline minimum 2.673 (dpr2 2.938); owned-realm inner keyline minimum 3.607 (dpr2 3.521). Every row passes.
- **Clear and Terrain lines:** 0 samples under the floor across 18 views at 1 px sampling. Hairline minimum 2.379, inner keyline minimum 3.291. dpr2 passes.
- **Rails:** 0 band-rule failures in every view and look.
- **Wild edge:** 0 failures in every look (Natural 18 views, Clear, Terrain, dpr2). Sample counts include 305 at the start view, 429 at Mid and 433 at the reference zoom.
- **Peaks:** L* p5 / p50 / p95 / max = 13.4 / 26.9 / 52.6 / 55.0. The cap is 54.85 (passable rock p99.9 is 52.35, plus 2.5). 0 texels exceed the cap plus 0.5 (the allowance for 8-bit rounding), and 0 texels fall outside the wild's cells.
- **Mere:** water Lab is [27.8, −21.5, −2.4] against the map water's [36.8, −23.8, −3.1], ΔE 7.3: the same hue, deeper. Shore fringe is 42.6% of the lake's texels; 0 texels outside its cells.
- **Lightness-only terrain readers:**
  - Start passes: 0.969 patches / 1.0 provinces (unexplored 0.929 / 0.967).
  - Reference zoom passes at 0.957.
  - Mid fails at 0.931 (Duskholt, Karwick). The verifier's before-pass-2 run failed the same way.
  - Far went from 0.956 / 1.0 to 0.845 / 0.983 because of the relief.
- **Determinism:** rebakes are identical (frame 3517309432, bake 484572940, cover identical), and frames are stable in all 18 views. The Clear bake hash 4243484565 matches the verifier's. Painted v3 frame hashes are identical in 10 views over 2 loads.
- **Bake time:** the new wild steps take 276 ms plus 508 ms; a full rebake takes 6.7 s on a shared machine. The Far relief raster takes 125 ms.

**Deviations and known issues**

- **Far is no calmer:** 27.8 / 6.7 against 27.0 / 6.7 before, and above ref-4. The sculpted relief adds back what the faint lines removed. I lowered its strength once already (shading 34 / 52, cast 30) to bring the Far readers back from 0.785 to 0.845.
- **Wild cores are busier than ref-2's mountains:** 38.5 / 8.8 against roughly 31 / 7.6–8.6, from the ridged range texture.
- **The mere is darker than map water** (ΔE 7.3, same hue). This is deliberate, to read as a deep lake.
- **Clear and Terrain are not identical to the last build in two places:**
  - Pixels change only within 6–7 px of wild outlines, from the rim fix for defect 5.
  - In Terrain mode, one name moved off the controls column (defect 3).
  - Otherwise both are the same as the last build.
- **Two Clear inner-keyline samples dip to 3.13–3.17** (Kharnath/Briarmoor, close zoom) when sampling every 0.5 px. At 1 px sampling there are 0.
- **The Mid reader failure is from before this pass** and is not fixed.
- **Some Clear, Terrain, v3, dpr2 and 1280x720 runs came before the last Far strength edit.** That relief only runs in the Natural ownership view, so they are not affected. The Natural suite, Natural shots, dumps and side-by-sides were all redone on the final build.
- **Pre-existing v3 parts over 400 lines are unchanged:** `p50-deco.js` 631, `p52-stamps.js` 453, `p55-paint.js` 452, `p61a-figlib.js` 669. Every part I changed is at most 394 lines.

**Files**

- Build: /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/game-screen-v4.html
- Build script (adds `p58w` and `p89`): /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/build.sh
- New parts:
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p58w-natural-wilds.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p89-pass2-checks.js
- Changed parts:
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p00d-relief.css
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p58a-relief-base.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p58b-relief-shared.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p58c-relief-clear.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p58m-materials.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p58n-covers.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p59-relief-draw.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p59a-relief-rim.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p59b-relief-lines.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p59c-relief-detail.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p60-draw.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p60a-camera.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p61-relief-pieces.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p63-relief-labels.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p80d-rest.js
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/p88-natural-checks.js
- Backups:
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/parts-before/
  - /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/game-screen-v4.before-pass2.html
- Tools (`shots.cjs`, `checks.cjs`, `dump.cjs`, `busy.py`, `look.py`, `vlib.py` and others): /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/tools/
- Check outputs:
  - Final Natural suite: /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/out/run-checks-natural-1-final2.txt
  - Clear and Terrain runs, Clear/Terrain sameness, Painted v3 sameness and v3 checks, busyness, and dumps are in /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/out/
- Shots: /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/shots/
  - 01–07 start, Far, Mid, Near regions; 09–12 both wilds close; 13 fog; 15–17 hover and selection floor; 18–19 a path; 20–21 supply mode; 22–24 deutan and tritan; 25 Far model; 26 month 40.
  - 30–34 Clear; 35–36 Terrain mode; 40–41 1280x720; 42–43 phone; 55–56 dpr2; 70 Painted v3.
  - Side-by-sides 50 and 50b (against ref-2) and 51 (against ref-4), labelled only "owner reference N (direction only)"; before/after 60–63 (start, Ashspine, Still Mere, Far).