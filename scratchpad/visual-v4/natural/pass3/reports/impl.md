The art pass is done and ready for the owner to review. One caveat matters before they look: a pale stone band still runs along about half of each wild's outline, and along two-thirds of it at the start view. That is more than the art judge's 40% target. The band is what makes the edge pass the colour-blind test once the land runs on inside the wild. Three approved rules were changed, each backed by at least two judges, and four questions need the owner's answer.

Every check passes on the final build (md5 `0ae9067f…`), in every look and mode, at 1× and 2× density, with 0 page errors. The colour-blind edge test passes on the main map and on three other maps. Painted (v3) is pixel-identical to pass 2, and so are Clear and the Terrain mode. Rendering is the same on every reload.

**What was built.** All three judges ranked the massif prototype first (art 6/10, player 8/10, rules 6/10), so it is the base. The judges' grafts added:
- **Range:** it starts at zero height on the outline, so the land climbs into it. Rock follows the ridges and slopes, so green valleys run up between the spurs.
- **Foothills:** the neighbouring land itself (fields, woods, pools), made by the land's own recipe and thinning as the range climbs.
- **Up close:** sharp ridged detail, and no grain on rock.
- **Zoomed out:** calmer, with the deepest shade lifted and snow held down.
- **Snow:** caps on the peaks. Ruler-straight snow bars showed on the Greyteeth; I fixed them by letting peak height vary across the range too.
- **The mere:** at the map's water colour, a little lighter than the prototype's.
- **Edge decision:** made from data once per zoom, so panning never changes it. It is redone live for a hovered neighbour, which pass 2 never did.
- **Checks:** a 30-camera sweep, a footprint guard, interaction checks, and runs on seeds 7 and 31 and a four-wild map.

**Problems the extra checks found, all fixed:**
- **Edge failures on other maps:** three cameras failed the colour-blind edge test (0.96–0.99). Two causes: the 2 px band could leave no fully stone-coloured pixel at 1×, and the decision missed small pixel shifts near sharp ground. The band is now at least 2.5 device pixels, and the decision tests the neighbouring samples too.
- **Determinism:** one load in three drew a different start view, because the edge decision's caches depended on earlier calls. Fixed. Three fresh loads now match, and frames are the same before and after other zooms and hovers.

**Rule changes, built as the default, for the owner to confirm:**
1. **Snow brighter than the brightness cap.** Up to L\* 80 on at most 8% of a range; measured 5.0% snow, brightest L\* 75.4. Art and player judges for it; the rules judge would keep the cap.
2. **Land continues inside the wild's cells** up to the range's foot. This reverses pass 2's "rock starts at the outline". All three judges for it. No wild texel lies outside its cells and no land texel is changed.
3. **The cream rim becomes a quiet stone band** in the land's hue, drawn only where the colour-blind test needs it. All three judges for it.

**Not adopted:**
- the 2 px ink (stays 3 px);
- the spill;
- fog in the continued land;
- brightening the wild's outline on hover (the ink is approved as never tinted);
- data-mode copies of the new terrain;
- lit scree at the foot (it read as a mat).

**Key numbers:**

| Measure | Result |
|---|---|
| Light band, share of outline (1×) | 0.62 start, 0.78–0.80 zoomed out, 0.50–0.54 from Mid to the closest zoom |
| Colour-blind edge sweep, main map (1× / 2×) | 0 fails of 16,904 samples; smallest margin 1.097 / 1.112 |
| Other maps (seed 7 / seed 31 / four wilds) | 0 fails; smallest margin 1.069 / 1.001 / 1.071 |
| Real-pointer hovers on every wild neighbour | 0 of 66 fail (pass 2: 15 of 66) |
| Start-view busyness (Ashspine / Greyteeth) | 31.3 / 6.2 and 36.6 / 8.3, against the reference's 31–35 / 8–9 |
| Pan out of the cached frame, median | 251 ms (pass 2: 242 ms, massif prototype: 408 ms) |
| Bake, the wilds' steps | 2.0 s (pass 2: 1.1 s) |

**Where the build misses what the judges asked, with the reason:**
- **Light band above 40%:** with land on both sides of the line, both are often dark. No dark ink reaches the colour-blind threshold against dark ground, so only a lighter band passes.
- **Ink margin ×1.1, not ×1.2:** at ×1.2 the band covers 3–16 points more of the outline.
- **Ink is pure black, not the earlier near-black:** it saves 2–12 points of band. The art judge's chosen prototype also used black.
- **Ground step across the line is 6–11, not 4 or less:** it comes from the land climbing into the range.
- **The mere against swamp pools is 18.4 / 11.2 / 11.4 / 19.5** (normal, protan, deutan, tritan), against the player judge's 20. Pass 2 was 12.6 / 3.2 / 5.6 / 12.2. Reaching 20 under protan needs a milky L\* 45 lake, which the art judge rejected.
- **Thinnest margin:** 1.001, at a corner on seed 31, where a sample is left to the neighbouring edge's line.
- **Inherited from pass 2, unchanged:** the data-mode keyline shortfalls, one hover hairline (2.14), and the Mid terrain reader (0.93).

**Questions for the owner (default built):**
1. Snow brighter than the cap? Yes.
2. Keep the light band? Yes. The alternatives are rock up to the outline on dark edges (not built) or a different colour-blind rule. Margins of ×1.0 are not an option: the test fails at the closest zoom.
3. Pure black ink? Yes.
4. Brighten a wild's outline on hover? No, because the ink is approved as never tinted.

All shots in `pass3/shots/` are reviewed, including hover and selection beside each wild and the path refused by the Ashspine ("No path crosses the Ashspine."). The decisions are written under "Pass 3 decisions" (line 1041) at the bottom of `design-final.md`. Nothing in `/home/user/Fluid-Magic-` was touched.

Files (all under `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/`):
- Page: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/game-screen-v4.html`
- Parts folder: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/`
  - New: `p58x-massif-gen.js`, `p58y-massif-colour.js`, `p59x-quiet-edge.js`, `p89b-pass3-checks.js`
  - Changed: `p58c-relief-clear.js`, `p58m-materials.js`, `p58n-covers.js`, `p58w-natural-wilds.js`, `p59-relief-draw.js`, `p59b-relief-lines.js`, `p59c-relief-detail.js`, `p89-pass2-checks.js`
  - Every edited part is under 400 lines.
- Build script: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/build.sh`
- Decisions: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/design-final.md`
- Backup of parts, build script, page and design doc: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/before/`
- Shots: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/shots/`
- Side-by-sides against pass 2 and the massif prototype: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/shots/sbs/`
- Check outputs: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/build/out/final/`
- Tools: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/build/tools/`