
## Fix pass (2026-10-24, the two pass-3 verifiers' defects; `pass3/fix/`)

The rules verifier (`pass3/verify-rules.md`) and the art verifier (`pass3/verify-art.md`) both said the build was not ready. Each defect
was first reproduced on the pass-3 page (`6b504c85…`, kept as `pass3/fix/before/`), then fixed or left with a reason. Painted (v3), the
realm rails and the line floors are not touched. Final page: md5 `7ef0ee6d…` (`map/game-screen-v4.html`).

### Rules defects

| # | Defect | Reproduced | Cause | Fix (part) |
|---|---|---|---|---|
| 1 | Wild edge fails at the least zoom at 2× (Still Mere/Oakmarch 0.995) | yes, 1 of 138 | The edge decision skipped any sample whose inner pixels a neighbouring outline edge might cover ("left to that edge's line"); the check reads it, and where that edge drew no band only black ink stood there | Such samples are decided like any other (only a realm rail's own pixels are still skipped) (`p59x`) |
| 2 | Seed 44 fails at the start view (0.909) and in its sweep (4, worst 0.839) | yes | as 1, plus the decision's sampling | as 1; seed 44 now passes every view and its sweep |
| 3 | The least-zoom frame depends on whether the idle prefetch ran first | yes (`c33f5f30` / `11cf5f24`) | The prefetch decided the least-zoom rung from the start view, where the Far relief's raster is not built yet, so it soft-lit nothing; a rung decided on screen had it | The decision builds the rasters its rung draws (Far relief, glow) before deciding (`p59x`) |
| 4 | Dominion and Springs fail at Mid on the Ashspine (0.927) | yes | The cream rim of the data modes was 2 px at 1×, so on a 45° edge no pixel was wholly rim | The rim is never under 2.5 device px (`p59b`) |
| 5 | Far reader 0.859 at 60 px | yes at the verifier's camera | see "Not fixed" | not fixed |
| 7 | Phone, Fit: Deepmoss over the seat in Ashdale at 6 of 9 cameras | yes | A capital's name that found no free spot was forced onto the first spot with room, over a piece | First a wider search near the seat (up to three lines above or below, half to one name aside) for a spot clear of every piece and name (`p61`) |
| 8 | Dense 1 px sampling: 1 miss at 1×, 2 at 2× | yes (on the old page) | as 1 | as 1 |
| 9 | Reader checks crash on the phone at Near; `pass: false` at Near with no floor; false failures in data modes | yes | The verifier's reader trained on an empty set when one province filled the view; the floors were applied at every zoom; the readers and the Clear means check ran in data modes | Empty training sets are skipped; over 240 px a province the readers report `n/a` (the floors bind Mid, the reference zoom and Far); the readers and `reliefMeans` are `n/a` in a data mode (`p88b`, `p88`, `p87`) |
| 10 | The evidence was weaker than reported | — | — | The full suite below ran on the final build |

### Art defects

| # | Defect | What changed (part) |
|---|---|---|
| 1 | The pale frame | Built both options the verifier asked to compare. **A (default): the stone band**, now thinner at double density (1.25 CSS px, 2.5 device px; it was 4) and never a dash (2). **B: rock to the line** (`?wildfoot=talus`, `p58z`): where the land beside the line is too dark for the ink, the range's foot rises at the line, its rock comes down to it and a lit talus apron lies along it, as light as the colour-blind test needs; it cuts the band to under half the outline but reads as a wide pale scree apron. The owner chooses from `shots/owner/_compare-*.png`. |
| 2 | The band drawn as dashes | A run is at least 24 px long, runs closer than 16 px are joined, ends fade over 8 px (`p59x` `rlQuietRuns`) |
| 3 | Black 3 px ink the heaviest line | Owner question; `?wildink=2` draws the 2 px near-black ink for the comparison shots (`p59x`) |
| 4 | The Greyteeth a lump | The rise is never wider than 0.3 of the room the cells give the range there, the body fills 0.95 of it, and any hollow of land the rock encloses turns to rock (`p58x` `footR`, `kr`; `p58y`) |
| 5 | The land only partly continues | Fields run on to the range's foot (no thinning by depth); woods end at a treeline (a steep step in the climb) instead of thinning into dots; copses stop as the land climbs; the heath at the land's chroma; beside the passable mountains the rock comes to the line (their soft relief no longer runs on inside) (`p58x`, `p58n`, `p58y`) |
| 6 | Two mountain styles side by side | not fixed |
| 7 | Rock soft and grainy up close | The speckle was the Near detail drawing the rock grain on every rock texel (a fall-through to class 4); rock now takes no grain. In the range's own fine raster (Near in at 1×, Mid in at 2×): a crisper terminator (gain 2.4 → 4), a light on each ridgeline (the convex crest of the fine heights), deeper shade (L\* 21 → 16, floor 16 → 12), less ambient halo and navy at the foot. The fine raster is drawn from 1.0 device px a bake texel (was 0.85), so the Near views (0.55 and 0.6 of the closest zoom) are crisp, not the bake magnified (`p59c`, `p58y`) |
| 8 | Too much fine ridging at the start view and Mid | Fewer, longer spurs (`p58x`). The bake (which the start view, Far, Mid and the reference zoom draw, or its mips) takes its own rock colour: the softer terminator (gain 2.0) and no ridgeline light, the same deeper shade (`p58y` `gainB`, `crestB`); its range texels keep 0.4 of their 3 × 3 detail in L\* (`bakeK`); the start view's and Far's mips pull the wilds 0.8 and 0.75 of the way to their local mean (were 0.92 and 0.82). The first build of this pass drew the crisp rock everywhere and the art judge's numbers got worse (start view busyness 49 / 13 and 55 / 15); this split brings them back (see "Measures") |
| 9 | The Still Mere in a fenced paddock | Where the land beside it is too dark for the ink, the shore comes to the outline (decided from the land as drawn, `p58z` `rlMftMereShore`); no shelf where the water meets the line; a crisp shore like the ponds' (a 2-texel band 4 L\* darker in the water, the bank 5 L\* darker) (`p58y`) |
| 10 | Clear, the Terrain mode and the data modes draw the v4 slab | not fixed |
| 11 | Shade floor; 1280×720 start view | The shade is deeper from Mid in (L\* p5 about 14 at Mid and 12 to 14 up close, was 16); at the start view the calmer mips keep p5 near pass 3's (about 15 to 17), so the deep valleys of the reference direction are still not there zoomed out. 1280×720: not fixed (see below) |
| — | Found on the way | With the ranges rising closer to their outline, the Far relief's long shadows (cast over the ranges' heights) blackened the land beside them when zoomed out; the land's Far shadows are now cast with the wilds at the land's height, as the bake's own land shadows already were (`p59c`, `p58x` `hXl`) |

### Not fixed, with the reason

- **Rules 5, the Far reader at 60 px (0.859 at the verifier's camera, 800,500).** At that camera the same eight provinces read 0.788 with no
  fog at all (the control), so the fog adds accuracy there and no fog setting can reach 0.88; the floor measures those provinces' blends.
  Raising it means redrawing the natural terrain itself, the approved look. The wilds are not read, so this pass leaves it exactly as it was:
  from the other camera (720,450) the reader gives 0.875 / 0.902 / 0.900 / 0.904 / 0.878 unexplored at 55 / 60 / 66 / 75 / 85 px on both
  the pass-3 page and this one (60 to 75 px pass). The page's own check fails at 60 px from 800,500 at 1× (it passes at 2×).
- **Art 6, the passable mountains' soft relief.** Outside this pass: they are land, read by the terrain readers and the cover test, and
  their recipe changes every mountain province.
- **Art 10, the data modes' v4 slab.** R16 (every mode colour 20 / 12 from both wild grounds) is solved against the v4 granite and mere;
  drawing the new range there needs that rule re-solved and the owner's word ("not adopted" in pass 3).
- **Art 11, 1280×720.** At the start zoom the land between the alerts ribbon and the bottom panel is shorter than the span from the seats under
  the ribbon (Karreach, Halevale, Wyrholt) to the Greyteeth's south: clearing the three seats takes 72 px of shift, and the panel starts to
  hide the Greyteeth after 16 px. A first try counted the hidden Greyteeth against the shift; it left the three seats under the ribbon and
  failed `reliefStartClear` (the polish pass's rule), so it was reverted: the ribbon stays clear and the Greyteeth's south tip stays under the
  panel at 1280×720 (`shots/43-1280-start.png`). Fixing both needs a smaller start zoom at that size (it would drop into the Far band) or a
  layout change.
- **The phone's terrain readers (found here, not in either report).** On the phone (390×844, 3×) the page's reader check fails at the start
  view, Far, the least zoom, the reference zoom and `back3` (for example 0.903 at the start view, 0.854 unexplored at Far, 0.693 at the
  reference zoom on three provinces). The pass-3 page gives the same values view for view; it is the land's colours (the R5 family) on the
  few provinces a phone view holds, not the wilds.
- **Art 1 in the default.** With the land running on beside dark forest and swamp, the colour-blind test needs a light element on about
  half the outline; the anti-dash rule (2) joins it into continuous runs. Option B removes most of the band but replaces it with a wider
  pale apron. The owner question stays open, now as two shots.

### Owner questions (defaults in bold)

1. The wild's light element beside dark ground: **A, the thin stone band**, or B, rock and talus to the line (`?wildfoot=talus`)?
2. The ink: **3 px black (approved)**, or 2 px near-black (`?wildink=2`; the band then covers more of the outline)?

### Measures (art judge, `judge.py`, 1×, same cameras; pass 3 as reviewed → this pass)

| View | Ashspine busyness (>10 / >20 L\*) | Greyteeth busyness | Fine detail ÷ land (Ash / Grey) | Lighter inner line (Ash / Grey / Mere) | Ground step (Ash / Grey / Mere) | Rock L\* p5 (Ash / Grey) |
|---|---|---|---|---|---|---|
| Start | 32.6 / 6.0 → 33.1 / 5.7 | 34.2 / 7.4 → 38.6 / 6.4 | 1.80 / 1.89 → 1.66 / 1.79 | .70 / .89 / .56 → .92 / 1.00 / .81 | 7.9 / 11.4 / 11.2 → 14.0 / 16.1 / 17.8 | 16.4 / 16.5 → 16.6 / 15.1 |
| Far (least zoom) | 34.7 / 6.7 → 33.3 / 6.7 | 35.3 / 5.9 → 38.2 / 14.7 | 2.08 / 2.17 → 1.99 / 2.10 | .96 / .97 / .47 → .98 / 1.00 / .73 | 18.9 / 18.2 / 25.6 → 20.7 / 19.8 / 28.7 | 13.3 / 12.7 → 13.7 / 11.6 |
| Mid | 28.9 / 6.1 → 31.4 / 4.9 | 26.9 / 5.2 → 33.3 / 6.0 | 2.41 / 2.62 → 2.11 / 2.32 | .74 / .85 / .30 → .86 / .91 / .44 | 6.4 / 8.8 / 3.7 → 9.7 / 12.0 / 9.1 | 15.8 / 16.2 → 14.6 / 13.8 |
| Near (0.55 / 0.6 of closest) | 23.0 / 3.2 → 36.5 / 9.2 | 19.0 / 2.2 → 32.1 / 8.5 | 1.45 / 1.02 → 2.21 / 0.98 | .61 / .81 / .20 → .72 / .85 / .34 | 6.8 / 7.1 / 2.5 → 7.4 / 8.7 / 4.2 | 15.7 / 15.5 → 13.6 / 12.6 |
| Closest | 13.8 / 1.2 → 24.6 / 4.8 | 14.6 / 1.3 → 26.7 / 5.9 | 1.15 / 1.14 → 0.76 / 0.63 | .66 / .69 / .18 → .72 / .78 / .29 | 6.7 / 5.9 / 2.6 → 7.1 / 5.4 / 3.0 | 15.2 / 15.3 → 13.6 / 12.2 |

- The owner reference's busyness at the start view is about 31–35 / 8–9: the Ashspine is on it, the Greyteeth 3.6 points over on the
  first figure. Fine detail at the start view and Mid is lower than pass 3 but still over the judge's 1.0–1.5.
- The light inner line, the ground step and the pale rim (L\* ≥ 65 at the start view: .16 / .25 / .10 → .28 / .33 / .08) are worse: the
  continued land is darker at the line (art 5), so the colour-blind test needs the band on more of the outline, and the band is joined
  into runs (art 2). The page's own band share: start view 0.62 → 0.86, Far 0.78 → 0.87, Mid 0.62, the reference zoom 0.61. Option B
  (`?wildfoot=talus`) is the alternative.
- Up close the rock is busier and crisper (the fine raster's terminator, ridgeline light and deeper shade) and no longer speckled (fine
  detail at the closest zoom 1.15 → 0.76 on the Ashspine). Where the bake hands over to the fine raster (1.28 of the scale at 1×) the
  range's contrast steps up: mean |ΔL\*| 3.8 on the pass-3 page, 5.0 here (`art/out/_pop-*.png`).
- Cost: the wilds' colour pass computes two rock colours (fine raster and bake): the natural bake took 14.4 s CPU on the loaded machine
  (pass 3: 13.7–20.6 s across runs).

### Checks on the final page

Run on the page as built (the full queue on `b38c422e…`, whose frames are identical to the final page's at 1440×900 1× and 2×, 1920×1080
and in Clear; the final page differs only in the start camera at 390×844 and 1280×720, where the phone checks, phone fit, the phone and
1280×720 sessions, the start-view check and two-load determinism were re-run on `7ef0ee6d…`):
- Built-in checks, Natural / Clear / Terrain at 1× and 2× and on the phone: 0 page errors; everything passes except the Far reader at 60 px
  at 1× (rules 5) and the phone's readers (above), both unchanged from the pass-3 page.
- Wild edge: 0 failing samples in every check view; dense 1 px probe 0 of 307,488 (1×) and 0 of 305,719 (2×); sweep 33 views, 16,904
  samples, 0 failures at 1× and 2× (min 1.12 / 1.115), no decision change while panning; data modes 0 of 16,734 at 1× and 2×; all 7 modes
  × 3 views pass in both looks at 1× and 2×.
- Seeds 7, 31, 3, 44 and the alternative map: 0 edge failures in every view and sweep, 0 page errors.
- Realm rails: 0 failures in every check; the dense probe finds the same 2 mitre samples at Rookmere/Briarstead as on passes 2 and 3.
- Determinism: three loads identical (frames and bake hashes) in Natural, Clear and Terrain; two loads identical at 390×844 (Natural,
  Clear) and 1280×720; live and idle decisions identical at 1× and 2× (rules 3).
- Painted (v3): pixel-identical to before the natural view at all 10 views.
- Clear and Terrain mode: outside the wilds, land, rails and lines identical to the pass-3 page at every dumped view; inside, only the
  thinner stone band.
- Phone, Fit: 0 names over pieces at 12 cameras (7 at the least zoom, the verifier's six among them) in Natural and Clear (rules 7). Sessions: 0 page errors at 1440×900, 1280×720 and 390×844
  (on the phone the mode column and Fit button are hidden by design).
