The painted troops and commanders are now in the battle mockup, with Painted as the default and a Figures: Painted | Procedural control. Every existing check still passes. Two of the asked-for results are not met. Six Thornwood commander faces have no painted figure, so they stay procedural. The far-side Thornwood troops show only about 24% side colour at play zoom, against the 30% target.

I made no image generations (my task gave me no generation cap, and the API was refusing calls with HTTP 402). The repo is untouched. The page is 7,575,786 bytes (about 7.6 MB, under 15 MB); the painted art in it is 5.07 MB of WebP.

**What is in the page**
- **Foot troops:** all 10 troop types in the three battles use their painted frames, back view for the near side and front view for the far side, mirrored where needed. Eleven of their 20 sheet views are flagged stand-ins from the troops report, used as they are.
- **Commanders:** 13 of the 20 battle commanders use their own face's painted figure: all 10 Cinder faces plus Elder Druid 08. Three of those views are flagged stand-ins (Ash Chieftain 03 back, Ash Chieftain 05 back, Cinder Magus 03 back). No tints are applied to commanders, so they keep their portraits' colours.
- **Motion:** each figure has its own phase and tempo. Troops march, rest and shuffle, brace at contact, strike with a lunge, and recoil with a white flash on a wound. They fall into one of two dead poses, and the body left on the ground is that same pose. Routing troops run and drop their weapon and shield where they turn. Archers nock, draw and loose; skirmishers aim and throw. Casters raise the staff and then thrust it; chieftains raise the axe and point at deploy, each round they hold, and when one of their squads holds. The winners cheer in the outro.
- **Variation within troops:** the calibration's colour shader and limits, baked at load into 4 colour variants per troop page and assigned so that neighbours never share one. On top of that, each figure gets its own brightness, scale, lean, small position offset, rest pose, phase and tempo. The shield and crest patterns show only at close zoom.
- **Side colours for colour-blind players:** painted figures are darker than the procedural ones, so I added stronger painted side looks. Cinder cloth and outline only lighten and Thornwood only darken, chosen per battle by measuring all 16 combinations in the page: a lighter/darkest, b dark/lighter, c lighter/darker.
- **Salamander (face 01):** its approved cutout, standing, with the silhouette shadow, facing its target. The breath comes from its mouth. On death it tilts and darkens without being deformed.
- **Wolf Rider:** the pilot test is used in battle c at the corrected rider size (32.7 world units). Battle b needs a back view that does not exist, so it stays procedural there. The Ash Rider, the creatures, the Treant and the Great Wyrm stay procedural.
- **Cards:** commanders keep their approved portraits and the Warden uses its kept bust. The other 9 troop types show a head-and-shoulders crop of their painted figure as a stand-in, because the busts were never made.
- **Close zoom:** frames switch to the higher-resolution set above a man of 50 screen pixels.

**Deviations**
1. **Missing commander art:** Warden Captain 04, 05 and 07, Sapling Druid 03 and 08, and Grove Priest 01 have no painted figure (cmdB stopped on HTTP 402), so they stay procedural and look like toys beside the painted troops. Elder Druid 08 has no back view; its front view stands in for the few moments it turns (6 moments, all in battle c).
2. **Routing Wolf Riders** in battle c face the camera while fleeing, because the pilot test has no back view.
3. **Variation is quantised:** each block uses 4 baked colour variants rather than a fully continuous per-figure tint. Sprites keep the exact depth order with the monsters, the procedural figures and the wall, which one draw per block would break at the clash.
4. **Far-side Thornwood is dark**, especially in battle a. That is the price of the colour-blind contrast with the painted art.
5. **Elder Druid 08's staff** still has a pinkish tint left over from keying.
6. **First switch to close zoom** costs a one-time 0.48 s pause in battle a while the high-resolution variants are prepared (28 ms in battle c).

**Checks, run at 1x and 4x** (Painted, 1920×1080)

Everything that already existed still passes:
- Figures and cards match the record's living troops at every phase end, 28, 22 and 26 per battle, at both speeds.
- Every death leaves a body: 173, 102 and 159. The record's winner is shown, the replay is deterministic, there is no overlap, and 0 of 32, 28 and 30 picks are wrong.
- The clock, texture-count and page-error checks pass.
- Colour-blind contrast on rendered pixels (normal / protan / deutan / tritan):

| Battle | Contrast | Below ground (L*, near / far) |
|---|---|---|
| a | 26.1 / 13.0 / 17.0 / 29.1 | 32.2 / 49.8 |
| b | 34.5 / 14.5 / 20.9 / 40.5 | 56.7 / 38.4 |
| c | 24.8 / 13.2 / 17.2 / 26.6 | 21.2 / 37.5 |

Procedural mode also passes, and its colour numbers are identical to the previous build's.

The new checks:
- **Painted frames:** foot troops are painted in every block (8/8, 8/8, 6/6) and commanders 6/7, 3/7 and 4/6. All 2,395 sampled sprites show their own look's painted frames. Read strictly, this check fails because of the missing Thornwood art.
- **Card-to-figure face match:** 13 of 13 match, read from the card image and the sprite's texture, with 0 mismatches.
- **Variation:** 0 identical neighbours in 947, 705 and 511 pairs. Neighbours differ in frame 88–91% of the time, in colour variant about 78–79%, in tint about 94–96% and in timing 100%.
- **Side colour at play zoom** (target 30%):

| Battle | Near side | Far side |
|---|---|---|
| a | Cinder 43.0% | Thornwood **23.5%** |
| b | Thornwood 50.0% | Cinder 54.2% |
| c | Cinder 47.8% | Thornwood **24.0%** |

The far Thornwood shortfall comes from the Longbow Hunter front (16.7–19.5%, a stand-in that failed its camera check), the Briar Guard front (22.9%) and the Wolf Rider (19.2%). The darker look needed for colour-blind contrast costs a few more points; the Warden passes at 33–34%. Re-rolling the Longbow Hunter front and adding a surcoat to the Briar Guard front need the API back.

**Frame times** (shared machine with a software GPU, so timings are noisy; CPU p50 / p95 in ms, same run for both modes)

| Battle | Speed | Painted | Procedural |
|---|---|---|---|
| a | 1x | 4.0 / 8.0 | 4.2 / 8.1 |
| a | 4x | 5.0 / 8.8 | 4.0 / 7.4 |
| b | 1x | 3.6 / 7.2 | 2.9 / 4.9 |
| b | 4x | 3.9 / 7.1 | 3.4 / 6.2 |
| c | 1x | 3.8 / 7.5 | 3.4 / 7.7 |
| c | 4x | 3.7 / 7.7 | 3.2 / 6.3 |

The software GPU's wait is 132–212 ms painted (182–258 ms procedural); it does not transfer to real hardware. At closest zoom (a man of 72 px) the update takes 1.7–2.5 ms and the render 1.6–2.1 ms (p50). Loading the painted pages takes about 0.2 s once.

**Shots:** I looked at every one. They cover each battle at deploy, volley, clash, rout and result, the clash in Procedural for comparison, close zooms of each nation's blocks at deploy and clash, every commander beside its card, a sheet of all 20 commanders' portraits with their painted front and back figures, hover cards, motion strips, dropped gear, and phone portrait and landscape. Fixes made after looking:
- the routing Wolf Riders no longer lose their rider;
- the frame set now switches on the right frame when zooming;
- the painted side looks were re-tuned;
- battle a's near side was eased from lightest to lighter.

Files are in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/`:
- `battle-mockup.html` (the page)
- `build.py` (now also inlines the painted data)
- `src/44-painted.js` (new)
- `src/60-render.js`, `src/80-hud.js`, `src/90-main.js`, `src/page.html` (changed)
- `units/stage-b/pre-integrate/` (backup of `src/`, `page.html`, `battle-mockup.html` and `build.py`)
- `units/stage-b/integrate/` (`bundle.py`, `paint-data.json`, `bundle-report.json`, `cmd_contact.py`, `checks-painted.json`, `checks-procedural.json`, `lab-painted.json`, `lab-painted2.json`, `pages/`, `tools/` with the drivers including `shoot.js`, `checksfull.js` and `lab2.js`, and `shots-dev/`)
- `units/stage-b/shots/` (87 shots, including `commanders-vs-cards.png`)