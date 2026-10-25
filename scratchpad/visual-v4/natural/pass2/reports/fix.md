I applied all eight fixes to the parts, rebuilt the page and re-shot `pass2/shots/`. Two targets are still missed: the light rim still runs along 53–59% of the wild outline (target 40% or less), and on the phone the day chips still sit under army pieces at Fit. A few other targets are close but not met; they're listed under "Not done".

Every check passes, with no page errors in any session. Rendering is the same on every reload, Painted (v3) is unchanged, and Clear and the Terrain mode draw the same land as before. Nothing in `/home/user/Fluid-Magic-` was touched (`git status` is clean). Every part I edited is under 400 lines. I did not republish the page; the build at `map/game-screen-v4.html` is ready for that.

## Per fix

**1. Far relief no longer draws the province grid** (`p59c` `rlFarRaster`, `p58a` `RL_P.farRelief`)
- Done as asked: the per-province average is now blurred (0.3 D) before it is removed, and light and shade are weighted by each spot's terrain relief (minimum 0.25), so farmland and swamp lie flat while hills, mountains and the ranges stand up.
- I also had to lower the strength and soften the relief over unexplored land, to get the terrain readers back over their floors.
- Results:
  - The step across province borders in the relief layer: p90 2.5 grey levels (was 23.3), max 5 (was 44.5).
  - Terrain readers at the least zoom: 0.910 / 1.00 / 0.894 against floors 0.90 / 0.95 / 0.88 (were 0.845 / 0.983 / 0.836).
  - Miss: the same-terrain lightness step 3 px from a border is 2.3 against 1.9 without the relief (target within 0.2). At 12 px it is 3.2 against 3.4, which passes.

**2. Range interior no longer reads as crumpled foil** (`p58w` `RL_NW`, `rlNatWildGen`, `rlNatWildTexel`)
- Darker shade faces and fewer crests, as asked. I changed the rock lighting so flat slopes sit dark and only faces turned to the light get bright, and made the scree in hollows darker.
- I did not use the critique's exact numbers. With softening at 0.65 the range became smooth grey dunes with no crests, so I used 0.5, longer crests (56 rather than 48) and lighter gully and detail values.
- Results:
  - Fine detail against other land: 1.35× at the start view, 0.75× at the reference zoom (target 1.4× or less).
  - Against the passable mountains: 1.05× at both (target 1.6× or less).
  - Lightness p5 / p50: 5.3 / 20.5 (target 9 / 23 or less). No texel over the cap.
  - Miss: the verifier's core busyness is 32.0 / 8.8 (was 38.5 / 8.8; ref-2 is about 31 / 8).

**3. Wild no longer reads as a fenced plaque** (`p58w`, `p58m`, `p59b` `rlDrawWildContours`, `p89`)
- (a) Done: the range no longer shows mirrored land inside its outline, and the foothill band is narrowed to 0.02–0.07 D.
- The critique's version alone left the ground matching the land on most samples. So I added a band at the range's foot whose lightness is chosen against the land outside it: dark rock beside light land, pale grey scree beside dark land.
- (b) The 3 px dark line stays on the whole outline. The light rim is now drawn only on the stretches where the ground pair fails 20 / 12. That is decided per stretch at the current zoom, with a safety margin that includes the selected province's tint and any water next to the edge.
- Clear, the Terrain mode, the data modes and the passability view keep the rim on every edge.
- Results:
  - Ground passes on its own on 71–90% of samples (was 9% at the start view and under 1% at the reference zoom), and 49% at the least zoom.
  - 0 fails in every view, at both screen densities.
  - Miss: the rim covers 53–59% of the outline, and all of it at the least zoom.
- Visual concern: beside forest and swamp, the pale scree reads as a light band, so a light edge partly remains. I tried a dark-only band (ground passes on only 30–50% of samples, rim on 85–100%) and broken-up scree fans (rim on about 98%).
- A neighbour's hover tint is not part of the rim decision; the dark line stays.

**4. Wilds in focus up close** (`p59c` `rlNearDetail`): peaks now get the rock grain. The Ashspine's fine detail at the closest zoom is 1.34× the land's (was 0.93). The lake stays smooth (0.95×). I couldn't confirm the "time within 10%" target: the shared machine was too noisy (medians 112 against 129 ms).

**5. Names under the right-edge controls** (`p61` `rlLayout`)
- Done as asked: a name must sit fully on the canvas and in the view band, the spot left of the town is tried first near the controls, and a capital's forced name never goes off the canvas or under the controls.
- I also found and fixed a cause: the layout was measuring against an oversized area while the cached map was drawn.
- Names near an edge now slide inward, names for towns off-screen wait off-screen, and names stay on the model.
- A sweep of 96 camera positions at both zooms: 0 names off the canvas or band, 0 under the controls. Deepmoss's name is visible at the reference zoom.

**6. Phone at Far** (`p60a`, `p61`, `p63`)
- (a) Done: the phone's least zoom is now Fit (26.6 px a province).
- (b) Done: no wild names overflow at Fit or the least zoom (those that don't fit are dropped), and no names fall off the model. The same rule applies on desktop, so "The Still Mere" is not named at the least zoom there.
- (c) Partly: on the phone the chips now try to avoid the army pieces, and every chip is on the model. Miss: at Fit, chips still overlap 1–4 pieces each.

**7. Model edge reads as a cliff, not a tray** (`p59a` `rlDrawLip` and `rlRim`): in Natural, the light lip shows only on the north and west sides, and the south and east get a dark crest. The cliff face's lightness range at the least zoom is 6.3 to 32.1, a spread of 25.8 (target 25 or more; the AD measured 12.5). To get there I made the lit ledges brighter (16) and deeper, the strata ±6.5, and the foot darker (toward 4). The strata stay horizontal.

**8. The mere** (`p58w`): done as asked. The shoreline comes to the outline; I added a small noise ramp so water is within 0.02 D on 35% of the outline (target 30%). There are at most 2 snags, in dark wood, and the ripples are fainter.

## Final checks
- **All built-in checks:** Natural (18 views at normal density, 7 at double density) and the Terrain mode pass with 0 fails.
- **Clear:** one item is over budget (Morholt 0.50–0.51 against 0.5). It was already there, with the same numbers, and the Clear land is pixel-identical to before.
- **Pre-existing reader miss:** the Mid terrain reader still fails at 0.931, unchanged from before.
- **Clear and Terrain against the last build:** the land is identical in all 5 views. Only name positions moved (the fix 5 and 6 rules apply in every look), at most 1,461 pixels.
- **Painted (v3):** all 10 views are identical to before across 2 reloads; its checks differ only in timing fields.
- **Repeatable rendering:** Natural (3 reloads), Clear (2) and Terrain (2) are identical. Painted's moving sprites differ between reloads at one view; the verifier saw the same thing before.
- **Owner's line decision:** the faint lines are unchanged (median 1.245), and hover and selection still bring a province's lines up to the floor.

## Not done
- The rim covers more than 40% of the outline; the pale scree band looks like a light frame.
- The same-terrain step at 3 px misses by 0.2.
- On the phone at Fit, chips sit under army pieces.
- Core busyness is slightly over ref-2's.
- The Near detail timing could not be confirmed.
- The rim decision costs about 20–100 ms each time a zoom settles.
- Out of scope: at 1280×720 the alerts ribbon still covers the Ashspine, and the realm tint is still an open question for the owner.

## Files
- Final page: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/game-screen-v4.html` (copy at `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/fix/game-screen-v4.final.html`)
- Parts changed (in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/`): `p58a-relief-base.js`, `p58m-materials.js`, `p58w-natural-wilds.js`, `p59-relief-draw.js`, `p59a-relief-rim.js`, `p59b-relief-lines.js`, `p59c-relief-detail.js`, `p60a-camera.js`, `p61-relief-pieces.js`, `p63-relief-labels.js`, `p89-pass2-checks.js`
- Parts and page before this pass: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/fix/parts-before/` and `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/fix/game-screen-v4.before-fix.html`
- Shots: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/shots/`. Before/after sheets are `60-before-after-start.png` to `64-before-after-ref.png`; the previous shots are in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/fix/shots-before/`.
- Measurements: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/fix/out/` (check results, the per-fix measures, sameness, repeatability and look metrics)
- Tools: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/fix/tools/`