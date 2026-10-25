# Stage B fix pass (key "fix"): results

Ten of the 12 fixes are in, plus the interim part of fix 8. Fix 1 (the six Thornwood commander faces) and all 30 re-rolls are blocked. I sent R1 to the API three times, at 11:45Z, 12:16Z and 12:50Z. Each call came back HTTP 402 ("prepayment credits are depleted"), so I stopped. Those 3 failed calls are logged and are the only generations this key used, out of a cap of 30.

On the final build, every check passes:
- **Checks:** `ok` and `paintOk` are true. `allPainted` is false because the Thornwood commanders are missing. There are 0 page errors.
- **Battle integrity:** for every battle, determinism holds, the rerun matches, and figures match at phase ends. Overlap and pick errors are both 0.
- **Procedural mode** checks also pass.
- **Re-shoot:** I re-shot `stage-b/shots/` (86 integration shots, the six motion strips and `commanders-vs-cards.png`), added 29 `fix-*` shots, and looked at every one.

## Per fix

1. **Thornwood commanders: not done.** Commanders painted per battle: a 6/7, b 3/7, c 4/6. Elder Druid 08's back view is also missing. There is no honest painted figure for these faces without generations, so they stay procedural and are flagged as such on the field. I prepared the runbook in `fix/jobs-R1-R30.json`. For the body sheets R1 and R2, I rewrote the tunic colour in the bottle-green wording from calibration decision 2.
2. **Far Thornwood colour: done.**
   - I added the `vivid`, `darkC` and `darkestC` looks and set the critique's table.
   - Side share at play zoom, near/far: battle a 46.5/32.0, b 57.2/54.3, c 51.6/31.5. Before, the far side was 23.5 in a and 24.0 in c.
   - Colour-blind contrast still passes. Protan/deutan ΔE: a 13.3/17.8, b 13.1/20.0, c 13.6/18.5.
   - The Wolf Rider frames now get the Thornwood hue lock in `bundle.py`.
   - I rewrote `lab2.js`. It ranks looks by change in lightness, breaks ties toward more colour, and excludes darkening by more than 0.05 without a colour lift (that is what turned the far blocks near-black). It picks exactly the critique's table for all three battles. A plain "least change" ranking picked `lightest` and `darkest/base` instead, which are the pastel and near-black looks the critique rejected.
3. **Detail switch: done.** The tier thresholds are now 56/53 px. The automatic camera spends 0% of its time on the high-resolution art in all six runs (3 battles × 1x/4x); its closest zoom is a man of 52.8 px. The high-resolution set is now baked just after load rather than in the middle of a beat.
4. **Bodies changing pose on landing: done.** The body and the falling figure now use the same seed and the same final rotation. I added `checkDeadHandoff` to the page's `checks()`: 0 mismatches across 163, 100 and 125 deaths.
5. **Sliding feet: done, with some changes beyond the critique's code.** Before → after:

   | Measure | Before | After |
   |---|---|---|
   | Longest step, up to 80 wu/s (a/b/c) | 34 / 25 / 46.5 wu | 15 / 10 / 13.3 wu |
   | Seat slides over 3 wu in a stand frame | 106 / 110 / 46 | 0 / 1 / 1 (max 5.6 wu) |
   | Routers in flee frames while nearly still, max | 4.3 / 3.5 / 6.3 s | 0.03 s |
   | View flips per figure, p95 | 8 / 6 / 9 | 3 / 3 / 5 |
   | Back-to-front spins per blow | yes | 0 |

   - Changes beyond the critique's code:
     - A figure turns to the other side only when its target is more than 30° past square.
     - Sideways moves turn the figure by mirroring only, so it never spins between back and front.
     - Side-steps shorter than a man's height keep the facing.
     - Routers stand once their actual speed drops below 15 wu/s.
     - The victory cheer gives way to the shuffle while a figure is still closing ranks.
   - Battle c's p95 of 5 misses the target of 4. The remaining flips are turns into lateral moves, the turn back afterwards and the rout. As the critique expected, the 0.6 s reform dashes still glide; that needs the owner.
6. **Banners: done.**
   - Blocks carry a 20 × 8 wu painted banner (a 9 × 3 mesh with a travelling wave). Generals carry a 26 × 11 wu banner that flares to 1.15× while they rally. The high-resolution art uses the 256 px banner.
   - The banners add 41.5 KB to the page.
   - I put the general's pole top at 50 wu, not 74. The 74 in `drawBanner` is in art pixels, about 48 wu once commander scale is applied; 74 wu would float the banner 2.6 men up.
7. **Commanders in frame: done, with additions.**
   - Every commander is now under the card bar for at most 5% of his alive time; the worst was 49%. Battle a's Cinder generals are off screen about 10% of the time, down from 19–42%. Median key zoom is unchanged (0% drop).
   - To get there, I added:
     - a minimum reach of 240 wu;
     - a 10% cap on how far commanders can zoom the camera out;
     - a hold zoom that stops at the commander-inclusive box;
     - a rule that a key is not skipped while a commander is out of view.
8. **Card busts: interim only.** The nine painted busts (R20–R28) are blocked. The figure crops are reframed as the critique describes and now read head-and-shoulders.
9. **Keyer: done, but the critique's premise was wrong.**
   - The shared `tools/key.py` now matches the stage B keyer. But the sandboxes that made these sheets already used the fixed keyer, and re-keying Elder Druid 08 and the Ember Skirmisher back gives byte-identical output. The green and pink were painted into the figures themselves.
   - I added `tools/keycast.py`, a post-pass on the frames:
     - green key (Cinder figures, which hold no green): olive tones become wood, light yellows such as fire are spared;
     - magenta key: rose tones on thin features become wood.
   - I applied it to the Ember Skirmisher back, Elder Druids 05 and 08, Thorn Militia, Briar Guard and Longbow Hunter (both views), then repacked. Only those frames changed. The pink staff and green javelins are gone.
   - The owner-kept Warden I left as kept.
   - The Skirmisher's `keyInUnitPct` stays 0.963, because it is measured on the raw input sheet.
10. **Salamander death: done.** It now tilts 11.5°, settles 16% and darkens, and its shadow follows.
11. **Commander variety: done for production prompts (no generations).**
    - Every face gets its own weapon from its family: axes for Ash Chieftains, braziers and staffs for the casters, staffs for the druids, and swords for Warden Captains. A mantle cut is added where the portrait doesn't fix one.
    - The owner-kept Ash Chieftain 06 and Elder Druids 05 and 08 keep their painted weapon.
    - The choices are recorded in `kits.json` and each figure's sidecar. 21 pending Thornwood front prompts were regenerated with them.
12. **Portrait prompts: done.**
    - "Fir needles" now appears in 0 prompts; 26 use the bottle-green wording. The hue lock gate stays.
    - No designer render of the gods exists, so I built grey clay maquettes from the stage A rigs. 30 full-length god jobs now use a maquette as Image 1 and the anchor as Image 2. The Elder Wyrm has no rig and keeps the anchor alone.
    - The maquettes are crude, but they fix the framing problem.
    - The stand-in test images now sit beside a `DO-NOT-SHOW-STAND-INS.txt`.

## Frame times, page size, generations

- **Frame times (1920 × 1080):** CPU per frame p50 3.2–5.0 ms, p95 4.8–8.6 ms; update p95 ≤ 3.1 ms; render CPU p95 ≤ 6.0 ms. Waiting on the software GPU is 144–206 ms at p50. At a man of 72 px (high-resolution art), update p95 is 2.5–4.2 ms. The machine is shared, so timings are noisy.
- **Page:** 7,634,118 bytes.
- **Stage B generations in `gen-log.tsv`:** 235 rows, 205 ok and 30 failed. By key: cmdA 150, troops 46, cal 24, portraits 9, cmdB 3, fix 3.

## Not done
- All re-rolls R1–R30. Of these, R14–R16, R18, R19, R29 and R30 still need their prompts or reference images built.
- The six Thornwood commander faces and Elder Druid 08's back view.
- The nine painted busts.
- The Wolf Rider back view.
- The portrait run, which needs its own budget of about 70 generations.

## Files
- Page and source: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/battle-mockup.html`, built from `src/44-painted.js`, `src/60-render.js`, `src/70-camera.js`, `src/90-main.js` and the new `src/95-paint-checks.js` in the same folder.
- `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/integrate/bundle.py`
- `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/integrate/tools/lab2.js`
- `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/tools/key.py`
- `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/tools/keycast.py`
- `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/cmdA/sbx/tools/cmd_kits.py` (copied to `work/cmdB/sbx/tools/`)
- `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/portraits/tools/pt_prompts.py`
- `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/portraits/tools/pt_maquettes.py`
- `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/fix/jobs-R1-R30.json`
- Fix tools, measurement scripts and their outputs: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/fix/` (`tools/`, `qa/`)
- Shots: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/shots/`
- Pre-fix backup (page, source, atlases, prompts): `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/pre-fix/`