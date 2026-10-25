# Pass 3 art verification: not ready for the owner's review

**Verdict: no.** The art pass is a real step forward, but it does not yet answer the owner's complaint. The complaint had three parts:

| Owner's complaint | Pass 3 result |
|---|---|
| Dark smoky slabs | **Fixed for the Ashspine, mostly fixed for the Greyteeth.** The Ashspine is now a lit range with snow at the start view and at Mid. |
| Straight polygon edges | **Not fixed.** A 3 px ink, now pure black, still draws every straight cell edge of all three wilds. It is the heaviest line on the map at the start view and at Far. |
| A pale frame | **Dimmer, not gone.** The frame is now stone-grey instead of cream, and it is drawn as dashes. The Greyteeth's frame is more complete than in pass 2. |

At the start view and at Far, which the owner sees first, all three wilds still read as framed plaques: black frame, pale mat, picture inside. The Mere is a natural lake, but it sits inside a black polygon of swamp. Up close the rock is soft and grainy, not crisply lit.

I checked the page as built (md5 `6b504c85…`, unchanged during my run). I edited nothing in the parts, the page or the repo, and `git status` is clean. Every one of my sessions logged 0 page errors. I looked at every shot I took. I used the owner's reference screenshots for direction only; none of them is in any file I wrote.

## What improved since pass 2 (same cameras)

- **The smoky slab is gone.** The Ashspine reads as peaks with lit faces, shade and snow caps (`c-start-ash.png`, `p3-05-mid-ash.png`).
  - Start-view busyness is 32.6 / 6.0 (Ashspine) and 34.2 / 7.4 (Greyteeth). Owner reference 2's range is about 31–35 / 8–9.
- **The cream rim is gone on the Ashspine and the Mere.** Share of the outline with a pixel of L\* 65 or more:
  - Ashspine: 0.61 → 0.16;
  - Mere: 0.99 → 0.10.
- **The Mere has a lobed, natural shore.** Its water is at the map's water lightness (L\* p50 34).
- **The land runs into the cells.** The ground step across the line drops from 32–35 to 6–11 CIE76.
- **Up close the wilds are no longer blurred** (`c-max-ash-w.png`, `c-max-grey.png`).

## Numbers

These are the art judge's own measures (`judge.py`), run on my layer dumps of this build. The pass 2 figures come from the judge's dumps of the pass 2 page. Each cell gives Ashspine / Greyteeth / Mere.

| Measure | Pass 2 | Pass 3 | Judge's target |
|---|---|---|---|
| Lighter inner line, start view | .62 / .23 / .99 | **.70 / .89 / .56** | ≤ .40 |
| Lighter inner line, Far | 1 / 1 / 1 | **.96 / .97 / .47** | — |
| Lighter inner line, Mid / Near / closest | .53 / .32 / 1 | .61–.92 / .69–.85 / .18–.30 | — |
| Page's own band share, start view | — | **.58 / .84 / .40** (all .62) | ≤ .40 |
| Page's own band share, Far | — | **.86 / .94 / .40** (all .78) | — |
| Pale rim (L\* ≥ 65), start view | .61 / .22 / .99 | .16 / **.25** / .10 | — |
| Ground step across the line, start / Mid / Near / closest | 34 / 32 / 24 | 7.9 / 11.4 / 11.2 → 6.4 / 8.8 / 3.7 → 6.8 / 7.1 / 2.5 → 6.7 / 5.9 / 2.6 | ≤ 4 |
| Fine detail, core ÷ land, start / Mid / Near / closest | 1.1 / 0.9 / 0.8 / 1.2 (Ash) | **1.8 / 2.4** / 1.45 / 1.15 (Ash); **1.9 / 2.6** / 1.0 / 1.1 (Grey) | 1.0–1.5 |
| Busyness, start view | 39.5 / 11.0 and 36.6 / 11.7 | 32.6 / 6.0 and 34.2 / 7.4 | 31–35 / 8–9 |
| Rock speckle at the closest zoom, rock vs land | — | 1.10 vs 0.79 (Ash); 1.51 vs 1.07 (Grey) | — |

My figures for the whole outline match the builder's: 0.62 at the start view, 0.78 at Far, 0.50–0.53 from Mid in. The builder reported only those totals. Split by wild, the Greyteeth carries the band on 84% of its outline at the start view and 94% at Far. That is a full frame.

## Defects, most important first

1. **The wilds are still framed by a pale band inside the black ink.**
   - **Where it shows:**
     - Start view at 2×: the Greyteeth has a pale band on all four sides, the Mere on three, the Ashspine on its west, south and south-east edges (`c-dpr2-start-wilds.png`; evidence sheet, panel 1).
     - Far: all three read as framed plaques (`c-far-wilds.png`, panel 2).
     - 1280×720 and phone: the same (`p3-40-1280-start.png`, `c-phone.png`).
   - **Measured:**
     - Lighter inner line at the start view: 0.70 / 0.89 / 0.56, against the judge's 0.40.
     - On the Greyteeth this rose from 0.23 in pass 2 to 0.89, and its bright rim from 0.22 to 0.25.
     - Pass 3 judged massif's frame as 0.67 / 0.71 / 0.55, so the shipped build is no better than the prototype it grafted onto, and worse on the Greyteeth.
   - **Why:**
     - The colour-blind test samples 6–9 px inside the line.
     - The rock now starts 0.13–0.15 D in, about 13 px at the start view, so the test reads the dark continued land on both sides.
     - Only a light band then passes.
   - **Fix:** build the option the builder listed but did not build: rock up to the line on the runs where the land pair fails.
     - On those runs, bring lit talus and rock faces to within 0–5 px of the ink. Elsewhere let the land run on.
     - Start with the Greyteeth, which needs the band on 84–94% of its outline.
     - Then show the owner the band question as two shots (band against rock-to-the-line), not as a share figure.

2. **The band is drawn as dashes.**
   - **Measured:** at the start view the band breaks into 44 runs on 30 edges. 20 runs are shorter than 12 px (5 under 6 px), and 18 gaps are under 12 px.
   - **Where it shows:** the Ashspine's north edge at Mid (`c-hover-north.png`, panel 3) and the Mere's south and east edges at Near (`c-near-mere.png`). It reads as a dashed line or a rendering fault.
   - **Fix:**
     - a minimum run of about 24 px;
     - bridge gaps under 16 px;
     - fade the run ends over 8 px or more;
     - better, make the light element a landform of varying width (talus, lit spur ends) rather than a constant 2.5 px stripe parallel to the ink.

3. **Straight polygon edges are still the strongest line on the map.**
   - **What changed:** the approved ink went from near-black #0B0A09 to pure black #000000 this pass, at 3 px.
   - **Effect:** at the start view and at Far it outweighs the realm rails, and it draws every straight cell edge (`p3-01-start.png`, `p3-02-far.png`). In the reference direction, mountains have no outline at all.
   - **Owner question:** the ink is approved, so this needs the owner's decision. Show them a 2 px near-black ink (the art judge's ask) beside the 3 px black. The builder lists "Pure black ink? Yes" only as a way to save band coverage.

4. **The Greyteeth is a lump, not a range.**
   - **Where it shows:** `p3-07-near-grey-land.png`, `p3-10-max-grey-land.png`, `p3-34-phone-near-grey.png`, panel 5.
   - **What is wrong:**
     - It is one sinuous rock mass floating in the middle of its cells.
     - A mat of 0.12–0.15 D separates it from the line on every side.
     - A dark, smudged foot runs round it like a drop shadow.
     - An enclosed green hole sits in the middle of the southern half.
     - At the start view, inside its full pale frame, it reads as an object on display.
   - **Fix:**
     - Run the crest along the long axis.
     - Let spurs reach the long sides, up to the line where the edge needs contrast (see defect 1).
     - Open every valley to the foot; no enclosed hollows.
     - Make the rock fill at least about 70% of the cell's width locally.

5. **The land only partly continues across the line.**
   - **Ground step:** 6–11 CIE76, against the judge's target of 4 or less.
   - **Fields stop dead:** on the Greyteeth's west side, the neighbour's field strips end at the ink. Inside is olive with copse dots (`c-near-grey-skirt.png`, panel 4).
   - **The continued land reads as a mat:**
     - It is 2.5× as textured as the land outside at the start view: the scattered copse dots ring each range like clutter.
     - It is 2–4 C\* more saturated at Near and the closest zoom.
     - The Ashspine's east skirt reads as a yellower mat (`c-near-ash-b.png`, `c-max-ash-e.png`).
   - **The Ashspine's west corner:** Morholt's soft relief carries on inside as a blurred blue-grey strip beside crisp rock (`c-max-ash-w.png`).
   - **Fix:**
     - Clip the neighbour's actual field layout and woods to the range's foot, rather than regrowing thinned covers.
     - Thin woods by height into a treeline, not into scattered dots.
     - Match the land's chroma.

6. **Two mountain styles sit side by side.**
   - **What is wrong:** the passable Morholt mountains are soft, blurred blue-grey relief, the "smoky" look the owner named. They sit right beside the crisp Ashspine (`c-morholt-ash.png`, panel 7; `c-phone.png`). The wild looks pasted onto a different kind of map.
   - **Reference direction:** one continuous kind of range.
   - **Fix:** draw passable mountains, and peaks in hills, with the massif generator at lower relief. Outside this pass's brief, but the owner will see it in the first view.

7. **Up close the rock is soft and grainy, not crisply lit.**
   - **Grain:** at the closest zoom the rock carries about 40% more per-pixel speckle than the land: 1.10 against 0.79 on the Ashspine, 1.51 against 1.07 on the Greyteeth (`c-max-grain.png`, panel 6).
   - **Softness:** at 2× density, ridge edges spread over 3–4 device px (`c-dpr2-max-ash.png`). The faces read as draped cloth or clay, and the Greyteeth's dark faces look sooty.
   - **The builder's claim:** "no grain on rock" holds only for the Near detail pass. The speckle is in the rock's own raster.
   - **Fix:**
     - Remove per-texel noise from the massif colour.
     - Add a crisp ridge-line light term, or a finer raster for the closest zoom.
     - Replace the soft navy shading at the foot with shade cast to one side.

8. **Too much fine ridging at the start view and Mid.**
   - **Measured:** fine detail is 1.8–1.9× the land at the start view and 2.4–2.6× at Mid, against 1.0–1.5.
   - **Where it shows:** at the start view the Ashspine reads as rows of similar spikes at one spacing (`c-start-ash.png`).
   - Busyness is on target, so the problem is the finest ridging, not the large forms.
   - **Fix:** cut the fine ridged amplitude in the start-view and Mid mips, and keep two or three dominant spurs per stretch of range.

9. **The Still Mere is a lake in a fenced paddock.**
   - **What works:** the shore is natural and the cream rim is gone.
   - **What does not:**
     - The black polygon runs through even swamp, about 0.13 D (about 55 px at the closest zoom) from the water (`c-dpr2-max-mere.png`, panel 8).
     - The pale band remains on 40% of the outline at the start view and Far.
     - The light shallow shelf is a soft halo of constant width all round, so it reads as a glow (`c-max-mere.png`).
     - The lake's outline is the cell shrunk and rounded.
   - **Fix:**
     - Let the shore come to the ink on at least half the outline, so the ink reads as the shoreline.
     - Vary the shelf: wide in coves, none on steep banks.
     - Keep the meadow fringe to two or three coves.
     - Give the water a crisp 1–2 px edge, like the map's ponds.

10. **Clear, the Terrain mode and every data mode still draw the v4 granite slab with its pale rim** (`c-modes-ash.png`, panel 9).
    - Switching mode changes the wilds' shape and brings back exactly what the owner complained about.
    - The builder lists this as "not adopted"; the owner should know before reviewing.
    - **Fix:** draw the new range, desaturated, under the data modes. In Clear and the Terrain mode, use it under Clear's distinct-colours band.

11. **Minor.**
    - **Shade:** the range's darkest shade was lifted to L\* p5 16 (owner reference 2's range: about 4). At the start view the range lacks the deep blue-black valleys of the reference direction and reads greyer. This followed the judge's instruction; revisit it once the frame is solved.
    - **1280×720:** the new start view puts the south of the Greyteeth under the bottom panel (`p3-40-1280-start.png`).

## Phone and interaction

**Phone (390×844):**
- The Ashspine reads as a range at Mid (`p3-32-phone-mid-ash.png`).
- The frames show at the start view and Fit (`c-phone.png`), and the Greyteeth is a lump at Near (`c-phone2.png`).
- Morholt's soft relief sits beside the crisp range.
- Nothing is broken and there are 0 page errors.

**Hovering and selecting a neighbour:**
- Hovering Halevale draws its hover outline beside the Ashspine, and the band is re-decided with no visible popping.
- Only the dash positions shift slightly (`c-hover-ash.png`).
- The hover card names the impassable wild.

## Method and files

Everything is under `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/verify-art/`.

**Shots** (`shots/`), each with a `-land` layer copy (rails, pieces and labels off):
- **Both builds, identical cameras centred on the wilds:** `p3-*` (this build) and `p2-*` (pass 2, md5 `fed36962…`) at 1440×900. Views: start, Far, Mid, the reference zoom, Mid on the wilds, Near on each wild, and the closest zoom on each wild and on both ends of the Ashspine.
- **Both builds:** double density, phone.
- **This build only:** 1280×720, 1920×1080, hover and selection, modes and Clear.
- **Crops and side-by-sides:** `c-*.png`.
- **Evidence:** `evidence-sheet.png`, with panels numbered as above.

**Measures** (`out/`):
- `judge-all.txt`: the art judge's measures on my dumps.
- `skirt.txt`: continued land against the land outside, and rock speckle.
- `bandshare.json`: the page's own band share per wild, at 1× and 2×.
- `bandruns.json`: run and gap lengths of the band.
- `dump/`: the layer dumps; the pass 2 dumps are links to the judge's.

**Tools** (`tools/`): `lib.cjs`, `shots.cjs`, `dump.cjs` and `judge.py` (adapted from the judge's), `skirt.py`, `bandshare.cjs`, `runs.cjs`, `hover.cjs`, `modes.cjs`, `sbs.py`.

I did not re-run the built-in check suites, determinism or Painted (v3) sameness; this verification covers the art direction only.

Report file: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/verify-art.md`
Evidence sheet: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/verify-art/shots/evidence-sheet.png`