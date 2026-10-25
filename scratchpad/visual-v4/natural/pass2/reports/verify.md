# Verification of the pass-2 game screen: not ready to ship

I verified `game-screen-v4.html` (md5 `fed36962…`) independently and edited nothing. Rebuilding the page from the parts gives the same file, and `git status` in `/home/user/Fluid-Magic-` is clean.

**Verdict:** All 3 looks render the same on every fresh load, there were 0 page errors in every session, Painted (v3) is unchanged, Clear and the Terrain mode draw the same land as before, realm borders hold the colour-blind band rule everywhere, and the natural view's faint lines match the owner's decision. Ten things still fail (listed after the table). Most of the line-floor failures were already in the page before this fix pass. The builder's claim that every built-in check passes is not true: the checks fail in views the builder never ran (the Near view at camera 1180,300, the data modes at double density, and the hover check on more than 12 provinces).

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Build and file sizes | PASS | Every part edited this pass is under 400 lines (largest 317). The four parts over 400 lines (p50, p52, p55, p61a) are unchanged since v4. |
| 2 | Built-in checks, Natural (18 views normal density, 7 double) | PASS except two | Lines, rails, seats, layout, hit test, hover chips, day chips, cliff, stability, wild edge (0 fails), wild look, design, snow, chroma, cover and rebake all pass. The hover lines check, run on 40 provinces instead of the builder's 12, fails at Mid (Ashmoor/Elmwick 2.14:1) and Near (2.29:1) at normal density; it passes at double density. The Mid terrain reader is still 0.931 (already known). |
| 3 | Built-in checks, Clear (18 + 7 views) | PASS except one known item | Morholt mean is 0.50–0.51 against the 0.5 budget, same as before. |
| 4 | Built-in checks, Terrain mode (18 + 7 views) | PASS | 0 fails. |
| 5 | Line check in every map mode | **FAIL** (already in the pre-fix page) | Normal density, Near view (camera 1180,300): internal lines 3.171–3.199:1 in Clear, Springs and the Terrain mode. Double density, Dominion, Unrest and Springs: internal lines down to 2.27:1 (36 samples). The pre-fix page gives the same numbers; the previous verifier's build passed all of these. Rails: 0 fails in all 84 rows. |
| 6 | Painted (v3) | PASS | Its checks are identical apart from timing fields. All 10 views match the pre-fix page and the page before the natural view (settled frames, 2 loads each). |
| 7 | Three fresh loads, same hashes | PASS, one caveat | Natural (second run), Clear and Terrain: 3 of 3 loads identical in all 6 views, bake hashes too. Caveat: in the first run, on a heavily loaded machine, 1 of 3 Natural loads showed a different cached frame at the start view (month 3 and month 40). The cached start frame and a redraw from scratch differ slightly (at most 24/255 over 459k pixels); the pre-fix page does the same. |
| 8 | Scripted session, 0 page errors | PASS | Natural, Clear and Terrain at 1440×900, Natural at 390×844, and every probe: 0 page errors. Hover names the province and its terrain 50/50, 20/20 and 8/8 in all 3 looks, including 7 unexplored and 2 out-of-sight provinces. Select, right-click moves (the route around the Ashspine, the enemy piece), all 3 wilds ("Impassable" tooltip, "No path crosses …"), every mode (buttons, M, Shift+1–7, the rail), every zoom band, drag, Z, Fit, every control, the time-lapse and every panel all work. On the phone, the mode column is hidden by design: modes work through the rail and Shift+digits, and wilds and selection work at Fit. |
| 9 | Owner's line decision, measured on rendered pixels with the real pointer | PASS mostly; two failures | **Natural, at rest:** lines between unowned provinces and inside a realm are faint (median 1.25:1 at normal density, 1.34 at double; at most 2.0). PASS. **Natural, hover and select:** 67 hovered provinces reach the floor except Ashmoor/Elmwick at Mid (1 sample of 130 at 2.0–2.2:1). Selected Deepmoss's internal lines are at 8.6:1. **Clear and Terrain, at rest:** at the floor everywhere (hairlines ≥ 2.65:1), including Far, which the built-in check never samples. **Clear and Terrain, hover and select: FAIL, already in the pre-fix page.** The hovered or selected province's own hairlines drop under 2.3:1: Ashmoor 1.56 (43 of 527 samples), Fenvale/Ashstead 1.52, Gallreach/Coldbrook 1.64. **Realm borders:** band rule 0 fails in every view, look, mode and density. PASS. |
| 10 | Colour rules that still apply | PASS, older items unchanged | Wild rims: 0 fails (the old Ashspine/Morholt sample is fixed). Natural snow, seats and chroma (0.089) pass. Unchanged from before: Clear pair Morholt/Rookmarch 19.45 against 20, and 1–2 mountain pixels near snow at start and Far. |
| 11 | The six defects from the last verification | 3 PASS, 1 split, 2 FAIL | Clear Karford/Ashstead spot: fixed. Ashspine/Morholt rim sample: fixed. Phone day chips over names: 0. Names by the right-edge controls: 160 desktop camera positions with 0 names cut, but still fails on the phone. Internal lines at segment joints: still 3.17–3.199:1 (and 2.27:1 in data modes at double density). Busy wild cores: 32.0/8.8 at the start view and 42.5/9.7 at Far, against ref-2's ~31/8. |
| 12 | Open items: wilds brightest, black meres, flat board | Partly done | Wilds are no longer brightest (1.3% of peak pixels above the land's 95th percentile). Meres are no longer black (L\* 26 teal, was 13.7). Model lip: light on north and west, dark on south and east. Still open: the ranges read as dark smoky slabs with straight polygon edges; the light rim covers 57% of the wild outline (target 40% or less), 100% at the least zoom and 99–100% of the mere; the cliff face's lightness spread at the least zoom is 18.3 against a target of 25 (the builder's 25.8 uses a different statistic). |
| 13 | Other targets from the fix list | Mixed | **Fix 1 (Far):** the page's readers at the least zoom pass narrowly (0.910 / 1.00 / 0.894); my own reader gets 0.864 for unexplored land, under the 0.88 floor. **Fix 2 (range lightness):** dark-end and middle lightness at the start view are 5.4 / 21.5, PASS. **Fix 3 (ground against land):** the ground passes on its own on 80% of samples at the start view and 71% at the reference zoom, PASS. **Fix 4 (Near detail time):** 1.08× and 1.04× the pre-fix page, within 10%, PASS but noisy. **Desktop day chips:** 0–0.5% covered by pieces, PASS. **Wild-rim decision cost:** up to 209 ms each time a zoom settles (builder said 20–100 ms). |

## Defects remaining (most important first)

1. **Line floors fail in the built-in checks** (already in the pre-fix page):
   - Data modes at double density: internal lines down to 2.27:1.
   - The Near view in Clear, the Terrain mode and Springs: 3.17–3.199:1.
   - The hover lines check at Mid and Near: Ashmoor/Elmwick 2.14:1.
2. **Clear and the Terrain mode on hover or selection:** the focused province's own hairlines fall to 1.44–1.64:1 (already in the pre-fix page). This breaks the owner's "everywhere under Clear" rule.
3. **Phone at Fit, day chips under army pieces:** 20–59% of each chip is covered.
4. **Phone at Fit, names cut by the right rail when panned:** Deepmoss and Thornbrook, with their towns in view.
5. **Wild names cross their own outline on desktop:**
   - At the start view, Fit and the least zoom.
   - The Ashspine has 37–134 label pixels outside its cells; the Still Mere has 35–111 at the start view and Fit.
6. **Light rim on 57% of the wild outline** (target 40% or less), and 100% at the least zoom.
7. **The ranges read as smoky dark slabs with straight polygon edges and a pale band; the mere is a teal polygon with a full rim.** This is still not the natural look of the owner's screenshots.
8. **Cliff face lightness spread at the least zoom is 18.3** (target 25 or more).
9. **Wild cores are slightly too busy:** 32.0/8.8 at the start view and 42.5/9.7 at Far.
10. **Minor:**
    - One cached start frame in six loads differed under heavy machine load.
    - The Mid terrain reader is still 0.931.
    - Clear: Morholt budget 0.50–0.51, the Morholt/Rookmarch pair at 19.45, and 1–2 pixels near snow (all unchanged).
    - At 1280×720 the alerts ribbon covers the Ashspine (known).

Files are in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/verify/`:
- `out/` has every check result, my measurements and the comparisons against the pre-fix page.
- `tools/` has the scripts that produced them.
- `shots/verify-evidence-sheet.png` shows six of the remaining defects side by side.
- `shots/F-01` to `F-21` are my final shots.