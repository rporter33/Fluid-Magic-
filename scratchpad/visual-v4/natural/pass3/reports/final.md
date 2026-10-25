**Verdict: do not ship.** The art pass is not done and isn't ready for the owner as a finished review. The rules hold on the default page. But the owner's complaint is still on screen: straight black outlines with a pale frame, and a polygon-shaped lake when zoomed out. One of the two options offered to the owner also breaks the colour-blind border rule. I edited nothing. The page rebuilds byte-identical (md5 7ef0ee6d) and `git status` is clean.

**Still failing**
1. **The frame is still there, and bigger than in pass 3.** At the start view and zoomed out, all three wilds are straight-edged black outlines. A pale stone band runs along 86% of their outline at the start view (pass 3: 62%) and 88% at the least zoom. By wild at the start view: Greyteeth 98%, Ashspine 84%, Mere 73%.
2. **The Still Mere looks like a teal polygon with a rim again when zoomed out.** Water reaches the outline on 47% of the edge at the start view and 93% at the least zoom (pass 3: 1% and 75%).
3. **Option B (`?wildfoot=talus`) breaks the colour-blind wild-edge rule at 2×.** The page's own sweep fails one sample: 0.974 at Greyteeth/Fenvale, camera "sweep 17". It failed the same way in two fresh loads; the default page passes there at 1.154. Its band is under half only at 1× from the start view inward (0.39 at start, 0.20 at Mid). Elsewhere it covers 0.63–0.70 at 1× zoomed out and 0.74–0.89 at 2×.
4. **Terrain reader failures go beyond what the report lists.** These are inherited: the pass-3 page gives the same values wherever I checked.
   - Far floor fails at 60 and 85 px from camera (800,500), at 55 and 85 px from (720,450), at 60 px and the least zoom on 1280×720, and at 60 px on 1920×1080.
   - The Mid reader fails at 1920×1080: provinces 0.958, unexplored 0.938 (Bramreach, Ashvale, Halegate).
   - Phone readers fail at the start view, Far, least zoom, reference zoom and back3, as the report says.
5. **Art targets still missed.** I re-measured with the art judge's tool on my own captures and got the report's numbers exactly.
   - Lighter inner line 0.92 / 1.00 / 0.81 (target 0.40 or less).
   - Ground step 14.0 / 16.1 / 17.8 (target 4 or less).
   - Fine detail 1.66 / 1.79 at the start view and 2.11 / 2.32 at Mid (target 1.0–1.5).
   - Greyteeth busyness 38.6 at the start view (reference 31–35).
   - The land carried inside the wilds is 2.5–2.8× as textured as the land outside. At the closest zoom it is 3.3 points lighter and 4 points more saturated. The seam at the outline is visible.
6. **Visible jump in the rock when zooming past 1.28× at 1×.** Corrected for the zoom change, rock lightness shifts by 3.7 on average, against 1.1 on the pass-3 page.
7. **Known and unchanged.**
   - Passable mountains next to the Ashspine are in a softer style.
   - Clear, the Terrain mode and the data modes still draw the old granite wilds with the cream rim.
   - At 1280×720 the start view hides 38% of the Greyteeth under the bottom panel, not just its tip.

**What passes on the default page**
- **Built-in checks:** every one passes in Natural, Clear and Terrain at 1×, 2× and on the phone, apart from the readers above.
- **Colour-blind wild edge, 0 failures in:**
  - every check view;
  - the sweeps (16,904 samples at 1× and 2×);
  - the data modes (16,734 at 1× and 2×);
  - my dense probe (307,488 samples at 1×, 305,439 at 2×);
  - 70 real-pointer hovers and selections at each density;
  - 10 map plans, five of them never tried before.
- **Realm rails:** 0 failures in the page checks. My dense probe finds the same 2 corner samples at Rookmere/Briarstead as on passes 2 and 3.
- **Line floors:** 49 of 49 sweep rows in Natural and Clear at 1× and 2×.
- **Determinism:**
  - three fresh loads identical in Natural (1× and 2×), Clear and Terrain;
  - phone and 1280×720 identical;
  - frames identical whether the idle prefetch ran first or not, at 1× and 2×.
- **Painted (v3):** pixel-identical at all 10 views to the pass-3 page and to the page before the natural view.
- **Clear and Terrain:** identical to pass 3 outside the wilds.
- **Sessions:** 0 page errors at 1440×900 (all three looks), 1280×720 and 390×844. All 98 page-error counts across my runs are 0.

**Fix report claims**
- **Confirmed:**
  - md5 and backup;
  - band about 86% at the start view;
  - judge scores worse;
  - start-view busyness 33.1 / 38.6, though the Greyteeth is still above the reference;
  - rules defects 1, 2, 3, 4, 7, 8 and 9;
  - art defects 3, 6, 8, 10 and 11;
  - phone readers;
  - final checks K1 and K3–K10;
  - b38c422e differs from the final page by one line in `p60a-camera.js` and renders identically at 1440×900 (1× and 2×), 1920×1080 and in Clear.
- **Partly true:**
  - The band is thinner only at 2×; at 1× it is unchanged.
  - "Never dashes" holds along each edge, but 2–9 px breaks remain where edges meet.
  - Option B is "under half" only as noted above, and it fails at 2×.
  - Art defect 2 (dashes): same as above, mostly fixed.
  - Art defect 4 (Greyteeth): no enclosed hollows now, and the median row is 82–90% rock, but 31–44% of rows are still under 70% rock.
  - Art defect 7 (rock): the speckle is gone (rock grain 0.30 against 0.79 for land). The faces still read as smooth clay with smoky valleys.
  - Art defect 9 (Mere): the shore reaches the outline on 16–25% of the edge from Mid in (was 0%), but it regresses when zoomed out.
  - Contrast step "5.0 vs 3.8": by the same method I get 4.9 vs 4.0. Corrected for the zoom it is 3.7 vs 1.1.
- **Refuted:**
  - Art defect 5 "fixed": see item 5 above.
  - Rules defect 5 "exactly the same numbers on both pages": close, but 55 px gives 0.888 vs 0.899, and the no-fog figure is 0.788 vs 0.800. The failure is also not only at 60 px.
  - Rules defect 10 "full suite ran on the final page": the report itself says most of it ran on b38c422e.
  - "Every check passes apart from the listed readers": see items 3 and 4.
  - 1280×720 "south tip": it is 38% of the range.

**What changed since pass 2, in plain words for the owner**
- The two mountain wilds are no longer dark, blurry slabs. They are grey ranges with lit faces, shaded valleys and snow, and the rock is sharp up close.
- The Still Mere is now a lake with a natural, wavy shore. Close up, on the side facing dark land, the water reaches the border.
- Fields, woods and marsh carry on inside each wild up to the mountains' foot. The Greyteeth is now a range rather than a lump.
- The cream frame is gone. But a thinner grey band now runs along most of each border, inside the same straight black line. Zoomed out, the wilds still look framed and the lake looks like a teal shape with a rim. That part of your complaint is not fixed.
- You are asked two questions:
  - Thin grey band (the default), or rock and pale scree down to the border? The scree looks like a wide pale mat and currently fails the colour-blind test on high-resolution screens.
  - Keep the 3 px black border, or use a 2 px near-black one? The 2 px border makes the grey band show on more of the outline.
- Also since pass 2:
  - The faint province lines you chose hold up when you hover or select a province.
  - On the phone, names, day chips and pieces no longer overlap.
  - The alerts ribbon no longer covers the land at the start.
  - Wild names stay inside their wilds.
  - The table edge reads more like a cliff.
  - Unexplored land lies flat when zoomed out.

Files are in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/final/`:
- `shots/final-evidence-sheet.png` (the key comparisons on one sheet)
- `shots/` (all my shots and side-by-sides)
- `out/` and `out/logs/` (check results)
- `art/out/` (art measures)
- `tools/`, `art/tools/` (the scripts)
- `rebuild/game-screen-v4.html`
- `variants/` (the 10 map plans)