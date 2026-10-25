Not yet ready for the owner's review. All eight polish items are fixed and every check passes, but the three wilds still read wrong. The owner's main complaint — the Ashspine and the Greyteeth as dark slabs with straight edges and a pale frame, the Still Mere as a teal polygon with a full rim — was not part of this step and is unchanged. The light band on about half of each wild's outline and pass 3's four owner questions are also still open.

Final page: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/game-screen-v4.html` (md5 `6b504c85…`). Nothing in `/home/user/Fluid-Magic-` was touched (`git status` is clean).

## Per item

**1. Phone day chips under army pieces**
- **Cause:** the army pieces sit on top of the map. The chips dodged where the pieces were in the previous frame, including their blank margins. When no nearby spot was free, the fallback only avoided names.
- **Fix:** chips now avoid each piece's actual drawn outline, on every device. A chip with no free spot nearby moves further out, onto the oak table if needed, with a thin line back to its waypoint. Arrow chips also avoid the path's chips. A chip whose arrow is off screen stays beside its arrow.
- **Numbers:** on the phone, 20 of 120 chips were under pieces (worst 70.9% covered); now 0 of 120. Desktop at 1440×900 (1× and 2×) and 1280×720: 0 of 120 each.
- **Note:** the verifier's own chip tool still flags two chips at 22%. Both lie off the canvas, where the tool measures the wrong pixels; the same fault gave 0.171 before.

**2. Phone names cut by the right rail**
- **Cause:** names were kept inside the canvas edge, but the rail sits on top of the canvas.
- **Fix:** names now stop at the rail or a docked panel.
- **Numbers:** names cut went from 3–4 per view group to 0. Desktop sweeps (80 camera positions each, at 1440×900 and 1280×720): 0 cut.

**3. Wild names crossing their outline**
- **Cause:** a name was checked only against the wild's overall extent, never against its outline.
- **Fix:** a name, with its dark halo, must sit wholly inside its wild, clear of the outline. The page searches the wild for a spot, then tries tighter letter spacing, then 1 px smaller. A name that fits nowhere is dropped; the hover card still names the wild.
- **Numbers:** label pixels outside the wild went from 37–133 (Ashspine) and 34–110 (Mere) to 0 at every size and zoom. The Still Mere is now unnamed at Fit on 1440×900 (it was already unnamed at the least zoom).

**4. Alerts ribbon over the Ashspine at 1280×720**
- **Cause:** the start view centred the capital below the top bar, but the alerts ribbon floats over the map below it.
- **Fix:** the start view moves the land down in small steps until the ribbon covers no wild and no town, keeping the capital comfortably in view.
- **Numbers:** 0 wild pixels and 0 towns under the ribbon at 1280×720, 1440×900, 1920×1080 and the phone. The start view now opens 134 px lower at 1280×720 and 10 px lower at 1440×900.

**5. Cliff face at the least zoom**
- **Statistic used:** the verifier's — the lightness spread of the face from its 5th to its 95th percentile, waterfalls and plaque excluded.
- **Cause:** the face's light and dark came from thin rock layers that blur away when zoomed out.
- **Fix:** broad, natural lighting in the natural view only: buttresses facing west catch the light, gullies stay dark, and the upper face is lit by the sky. Clear and the Terrain mode keep the old face.
- **Numbers:** spread 18.3 → 28.3 at the least zoom, 29.3 at Fit, 29.9 at the start view. The vertical-stripe measure is 0.068 (was 0.052) with 0 light streaks, so the face is not striped.

**6. Wild-rim decision cost**
- **Cause:** the decision was recomputed from scratch at every exact zoom, for all 30 outline edges.
- **Fixes:**
  - The decision is cached by zoom band, in 1% steps; the last 24 bands are kept.
  - Each edge is decided once, and only near the area on screen.
  - While the page is idle it decides ahead the zooms a player is likely to reach next.
  - Repeated work per sample is now done once.
- **Numbers:** over 24 zoom settles, before: all 24 computed live, median 59.6 ms, max 135 ms (346 ms with no pause between zooms). After: 1 computed live, 16.4 ms (15.4 ms with no pauses).
- **Side effect:** the decision is no longer bit-identical to pass 3's. The wild edge sweeps still show 0 failures and similar margins (1.097 / 1.094; other map seeds 1.077 / 1.001 / 1.071).

**7. Mid terrain reader at 0.931**
- **Cause:** not the art. The Mid view the check uses contains only one hills province (Karwick) and one wasteland (Duskholt). A reader trained on the other provinces has never seen those terrains, so 27 of 29 is the most any rendering can score there. The verifier's own reader gives the same 0.931 on that view and 1.00 when pooled over six views.
- **Fix:** the reader now pools further views at the same zoom until every terrain has at least two provinces. Nothing in the rendering changed, and the province grid did not come back.
- **Numbers:** 0.931 → 1.00 provinces (0.966 patches) at 1×; 1.00 (0.960) at 2×.

**8. The verifier's Far reader at 0.864**
- **Cause:** the two readers measured different land.
  - The page's reader renders every province as unexplored and reads it with a reader trained in sight.
  - The verifier's reads the 8 provinces actually unexplored at the east edge (81 patches).
  - Even with no fog at all, those 8 provinces score only 0.889 at 1440×900 (0.812 at 1280×720). The fog itself cost about 2 patches.
- **Reconciliation:** the verifier's reader is now built into the page and reproduces its Python numbers exactly. Both readers report three figures: actual unexplored, the same provinces in sight, and every province forced unexplored.
- **Art fixes, flagged for the owner:**
  - The haze over unexplored land in the natural view goes from 6% to the approved 4% (the hem at the frontier and the 40% desaturation stay).
  - Unexplored land no longer gets the zoomed-out relief shading, so it lies flat when zoomed out.
- **Numbers:** verifier's reader 0.864 → 0.901 (0.890 at 2×). Forced unexplored 0.900 → 0.934. The page's own reader 0.894 → 0.923.
- **Caveat:** this statistic swings with small pans. At the start view (96 px, outside the Far rule) it reads 0.843, against 0.897 on the old build whose start view sat 10 px higher. At the same camera the fix raises it (0.829 → 0.843).

## Checks
- **Built-in checks:** Natural, Clear and the Terrain mode at 1× and 2×, all map modes, and the line-floor sweep (49 of 49 rows in each run) all pass with 0 page errors. The new checks (part `p91`, plus the extended day-chip and cliff checks) pass at 4 window sizes, at 2× and in Clear.
- **Determinism:** identical frames and bake hashes on fresh loads — Natural 3 (plus 2 on the final build), Clear 2, Terrain 2.
- **Painted (v3):** settled frames pixel-identical at 10 views.
- **Clear and the Terrain mode:** the land is pixel-identical; only names and chips moved.
- **Still open from before:** Clear's Morholt colour budget, 0.50–0.51 against 0.5.

## Files
- Parts in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/`:
  - New: `p88b-readers.js` (106 lines), `p91-polish-checks.js` (29)
  - Changed: `p58a`, `p59a`, `p59x`, `p60a`, `p61` (283), `p63`, `p88`, `p89b`
  - Build script, updated: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/build.sh`
- Decisions and numbers: "Polish pass" section at line 1282 of `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/design-final.md`
- Backup of the parts, page and doc before this pass: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/polish/before/`
- Tools: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/polish/tools/` (`runall.sh`, `runpolish.sh`, `shots.sh`)
- Outputs: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/polish/out/final/`
- Shots, all looked at: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/shots/polish/`. Before/after side-by-sides are `sbs-01` to `sbs-14`.