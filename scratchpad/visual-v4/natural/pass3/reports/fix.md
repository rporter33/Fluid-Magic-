**No, the art pass is not done.** The page is stable and every check passes, apart from the reader failures listed under "Still failing". It is ready for the owner to make two decisions. It is not ready to be called finished.

Final page: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/game-screen-v4.html` (md5 7ef0ee6d). Before fixing anything, I reproduced every defect on the pass-3 page, which is saved in `natural/pass3/fix/before/`.

**What still stands in the way**
- **The pale frame.** By default the wilds still have a pale stone band on about 86% of their outline at the start view (pass 3: 62%). The band is now thinner and never broken into dashes. The other option, rock and talus down to the line (`?wildfoot=talus`), cuts the band to under half but reads as a wide pale scree apron. The owner picks one from the comparison shots.
- **The ink.** Whether to keep the approved 3 px black outline or switch to 2 px near-black (`?wildink=2`) is also the owner's call.
- **Worse art judge scores.** The "lighter inner line" and the "ground step" across the line got worse than pass 3. At the start view the inner line is 0.92 / 1.00 / 0.81 against a target of 0.40 or less, and the ground step is 14–18 against 4 or less.
- **A first attempt I had to undo.** My first build drew the crisp rock at every zoom. That made the start view much busier than the owner's reference (49% and 55% against 31–35%). I split it: the crisp rock is now only drawn up close (from Near in at 1×, from Mid in at 2×). Start-view busyness is back to 33.1 (Ashspine) and 38.6 (Greyteeth). The cost is a visible contrast step when zooming past 1.28× at 1×: mean lightness change 5.0, up from 3.8 on the pass-3 page.

**Rules defects**
1. **Wild edge fails at the least zoom at 2×:** fixed. Edge samples that sat under a neighbouring outline were being skipped; they are now decided like any other.
2. **Seed 44 fails:** fixed. All views and its sweep pass.
3. **Least-zoom frame depends on whether the background prefetch ran first:** fixed. Frames and decisions are now identical either way, at 1× and 2×.
4. **Data modes fail at Mid on the Ashspine:** fixed. The cream outline is never thinner than 2.5 device px.
5. **Far reader 0.859 at 60 px:** not fixed, and the reason is outside the wilds. With no fog at all those provinces read 0.788, so no fog setting can reach 0.88. Raising it means redrawing the approved land. The reader gives exactly the same numbers on the pass-3 page and this one.
6. Not part of either report.
7. **Phone, least zoom: a name over a town:** fixed. 0 overlaps at 12 cameras in Natural and Clear.
8. **Dense 1 px sampling misses:** fixed. 0 of 307,488 at 1× and 0 of 305,719 at 2×.
9. **Reader checks crash or misreport:** fixed. No crash; they now say "not applicable" where no floor applies (Near, data modes).
10. **Weak evidence:** the full suite below ran on the final page.

**Art defects**
1. **Pale frame:** partly fixed. Both options are built and shot; the default still frames the wilds.
2. **Band drawn as dashes:** fixed. Runs are at least 24 px, gaps under 16 px are joined, and ends fade.
3. **3 px black ink:** left as an owner question, with comparison shots.
4. **Greyteeth a lump:** fixed. It now fills the width of its cells and has no enclosed hollows.
5. **Land only partly continues:** fixed. Fields run to the foot of the range, woods end at a treeline, and the colour now matches the land outside the wild.
6. **Two mountain styles side by side:** not fixed. Redrawing the passable mountains changes every mountain province, which is outside this pass.
7. **Rock soft and grainy up close:** fixed. No speckle, a crisp terminator and a light along the ridgelines.
8. **Too much fine ridging at start and Mid:** improved but still above target. Fine detail is 1.66 / 1.79 at the start view and 2.11 / 2.32 at Mid, against a target of 1.0–1.5.
9. **Mere in a fenced paddock:** fixed. The shore reaches the outline beside dark ground and has a crisp edge.
10. **Clear, Terrain and data modes draw the old slab:** not fixed. The distinct-colours rule would need re-solving, and the owner's word.
11. **Shade:** deeper from Mid in, but about the same as pass 3 at the start view, so the start view still lacks deep valleys.
11. **1280×720:** not fixed, so the Greyteeth's south tip stays under the bottom panel. Clearing three towns from under the alerts ribbon needs 72 px of shift, and the panel starts hiding the Greyteeth after 16 px. My first fix put the towns back under the ribbon and failed `reliefStartClear`, so I reverted it.

**Still failing**
- **The Far reader at 60 px at 1×** (rules defect 5).
- **The phone's terrain readers** fail at the start view, Far, the least zoom, the reference zoom and `back3`. Neither report mentioned this; I found it here. The pass-3 page gives the same values view for view, so this pass did not cause it.

**Final checks**
- **Built-in checks:** Natural, Clear and Terrain at 1×, 2× and phone pass, apart from the reader failures above.
- **Wild edge and colour-blind test:** 0 failures in the check views, the sweeps, the data modes (16,734 samples) and on seeds 7, 31, 3, 44 and the alternative map.
- **Realm rails:** 0 failures.
- **Determinism:** identical frames and bake hashes on reload in all three looks, on the phone and at 1280×720.
- **Painted (v3):** pixel-identical at all 10 views.
- **Clear and Terrain:** land, outlines and rails outside the wilds are identical to the pass-3 page.
- **Sessions:** 0 page errors at 1440×900, 1280×720 and 390×844.
- **Shots:** I re-shot `pass3/shots` and looked at each one.

Most of the suite ran on an intermediate build (b38c422e). The final page renders identically to it at 1440×900 (1× and 2×), 1920×1080 and in Clear. It differs only in the start camera on the phone and at 1280×720, where I re-ran the affected checks on the final page. Nothing in `/home/user/Fluid-Magic-` was changed.

Files are in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/`:
- `map/parts/p58z-wild-foot.js` (new)
- `map/parts/p58y-massif-colour.js`
- `map/parts/p58x-massif-gen.js`
- `map/parts/p58n-covers.js`
- `map/parts/p59x-quiet-edge.js`
- `map/parts/p59c-relief-detail.js`
- `map/parts/p59b-relief-lines.js`
- `map/parts/p61-relief-pieces.js`
- `map/parts/p87-relief-checks.js`
- `map/parts/p88-natural-checks.js`
- `map/parts/p88b-readers.js`
- `map/build.sh`
- `natural/design-final.md` (new section "Fix pass", line 1364)
- `natural/pass3/shots/` (re-shot), including `sbs-fix/` (before and after), `owner/_compare-*.png` (the owner's comparison) and `43-1280-start.png`
- `natural/pass3/fix/out/logs/` (all check logs)