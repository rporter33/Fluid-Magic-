# Pass 3 wilds: art director's judgement of the three prototypes

**Verdict:** ship **massif** (6/10) as the base, with grafts from **relief** (5/10). Do not ship **open** (3/10), and do not take its spill to the owner now.

None of the three is finished:
- **Massif** is the best looking wild at the start view, at the least zoom and at Mid, which is where the owner looks first. Its mere is the only natural lake of the three. Up close, though, it reads as a rounded clay island sitting on an olive mat inside the frame.
- **Relief** is the most convincing up close: crisp ridges, with the land really running under the line. At the start view it is a bristly grey comb inside the heaviest frame of the three.
- **Open** is still a smoky grey slab inside a cream frame. Its Greyteeth reads as a trench.

I edited nothing in the three prototypes, in `visual-v4/map/` or in the repo (`git status` is clean). Each prototype's `build.sh`, run on a copy of its `parts/`, reproduces its page exactly (md5 `4add5cc1…` relief, `fa6edbad…` massif, `d7bb69bd…` open).

I compared the four builds (pass 2 and the three prototypes) at identical cameras:
- 15 views at 1440×900, normal density;
- 6 views at double density;
- 2 phone views at 390×844;
- layer dumps (labels, pieces and rails off) at 10 views.

Page errors: 0 in every session (16 loads). I looked at every shot. The owner references were used for direction only; nothing of them is in any output.

## Scores (1 to 10, my lens only)

| | Relief | Massif | Open |
|---|---|---|---|
| Start view (96 px a province) | 5 | **7** | 3 |
| Least zoom (54 px) | 4 | **7** | 3 |
| Mid and reference zoom (175 to 200 px) | 5 | **6** | 3 |
| Near and closest (231 to 420 px) | **7** | 5 | 3 |
| Crispness | **8** | 7 | 4 |
| Grows out of the land | **7** | 4 | 4 (6 on the spill edge) |
| Free of pasted-on, smoky and framed looks | 4 | **6** | 2 |
| The Still Mere | 5 | **8** | 4 |
| **Overall** | **5** | **6** | **3** |

The overall score is not an average. The start view and the least zoom weigh most, because they are what the owner sees first and most often, and "It's not cluttered it's clean" is judged there.

## Evidence

**Sheet:** `judge/shots/sheet-judge-art.png`.
- It has four rows: the start view (wilds at 2×), the least zoom, Mid and the reference zoom, and the closest zoom.
- Each tile is a 2×2 grid: pass 2 and relief on top, massif and open below.
- Single grids are in `judge/shots/grid/`. Full frames are in `judge/shots/{p2,relief,massif,open}[-dpr2]/` and `judge/shots/phone/`.

**My measures** (`judge/tools/judge.py`, `silhouette.py`; outputs in `judge/out/judge-all.txt`):
- They are taken on the land layer dumped by the verifier's dump tool, pointed at each build.
- Outline samples are every 2 px along every wild/land edge in view.

| Measure (Ashspine / Greyteeth / mere) | Pass 2 | Relief | Massif | Open |
|---|---|---|---|---|
| **Pale rim** (a pixel of L\* 65 or more within −2.5 to +4 px; verifier's metric), start view | .61 / .22 / .99 | .24 / .02 / .54 | **.15 / 0 / 0** | .66 / .83 / .67 |
| Pale rim, least zoom | 1 / 1 / 1 | .72 / .84 / .54 | **.29 / .13 / 0** | .92 / 1 / .63 |
| **Any lighter inner line** (0–4 px inside, 8 L\* or more lighter than the ground both 7–10 px in and 7–10 px out), start view | .62 / .23 / .99 | .79 / .83 / .63 | .67 / .71 / .55 | .67 / .83 / .68 |
| Any lighter inner line, least zoom | 1 / 1 / 1 | .99 / .85 / .84 | .86 / .74 / .49 | .92 / 1 / .65 |
| **Ground step across the line** (CIE76, 6–12 px out against 6–12 px in, median), start view | 34 / 32 / 24 | **3.2 / 3.6 / 8.1** | 10.5 / 12.9 / 11.3 | 13.3 / 18.7 / 17.3 |
| Ground step across the line, Near | 35 / 35 / 5.5 | **1.4 / 1.3 / 1.6** | 8.8 / 9.6 / 7.8 | 10.3 / 12.7 / 8.8 |
| **Range core busyness**, 6 px cells, share >10 / >20 L\*, start view (owner reference 2's range: about 31–35 / 8–9) | 39.5 / 11.0 | 36.7 / **1.8** | 47.9 / **14.1** | 22.3 / **0.3** |
| Range core busyness, Mid (Ashspine) | 22.8 / 4.0 | 38.9 / 7.9 | **30.4 / 7.2** | 18.8 / 1.0 |
| Range core busyness, closest | 5.6 / 0.4 | 27.4 / 7.0 | 13.6 / 2.7 | 9.5 / 0.4 |
| **Fine detail**, core ÷ land, start / Mid / Near / closest (owner reference 2: about 1.0) | 1.1 / 0.9 / 0.8 / 1.2 | **3.4 / 6.1 / 3.9** / 1.2 | 1.8 / 2.0 / 1.3 / 1.0 | 2.2 / 3.6 / 2.3 / 1.0 |
| **Range L\*** p5 / p50 / p95, start view (owner reference 2's range: 4 / 22 / 47) | 4 / 18 / 46 | 11 / 29 / 48 | 12 / 29 / 50 | **17 / 31 / 46** |
| **Where the rock begins**, step from ground to rock (CIE76, median), Near | n/a | 23 | 19–20 | **10–15** |
| **Mere water L\*** p50 / p95, Near (map water about L\* 37, C 24) | 27.6 / 34 | 29 / 46 | 28.5 / 39 | 38.7 / 43, low chroma |

How to read the rows:
- **Pale rim** counts only bright rims. **Any lighter inner line** also counts the land-tinted rims (relief) and quiet edges (massif) that replaced the cream rim. In the start-view row, all three prototypes still draw a lighter inner line on 55–83% of the outline, so the frame is reduced in brightness, not removed.
- **Ground step:** lower means the land runs on under the line.
- **Busyness, fine detail and range L\***: the reference figures come from the pass-2 critique and the prototype reports.

Repeatability: the near and closest frames are pixel-identical across two separate loads of every build. At the start view the only differences are at the table edge outside the model, from the room's animation.

## Relief ("continuous relief"): 5/10

**What works**
- **Up close it is the best mountain of the three.** At Near and the closest zoom, the Ashspine and the Greyteeth are crisp, faceted ridges with spurs, lit from the north-west, with dark faces that read as shade rather than smoke (`relief/09-max-ash.png`, `10-max-grey.png`). This is the nearest of the three to the reference's crisply lit range.
- **The land really runs under the line.** The ground step across the outline is 1–4 CIE76 at every zoom but the least, against 7–14 for massif and 10–19 for open. Woods, fields and swamp carry on into the foothills, and the range rises out of them (`13-max-ash-east.png`: the green plains run up to the rock).

**What does not**
- **At the start view and the least zoom it is a grey comb.**
  - All the crests run across the long axis at one spacing, so the range reads as bristles or a torn edge rather than big lit and shaded faces.
  - Fine detail is 3.4× the land at the start view and 6.1× at Mid; the reference is about 1×. This is the "crumpled foil" the pass-2 critique asked to remove.
  - It has almost no large value jumps: 1.8% of cells differ by more than 20 L\*, against the reference's 8–9%.
- **The frame is the heaviest of the three.**
  - The 3 px near-black contour draws every straight polygon edge at every zoom.
  - The solved rim is darker than pass 2's cream, but it is still a lighter line inside the ink on 79–99% of the outline. Around the Greyteeth at the start view it is a complete pale-green ring (`grid/01-start-box530_420_650_610.png`).
- **The mirror shows.**
  - Fields reflected across the line make chevrons at the outline (`grid/10-max-grey-box470_380_620_520.png`), which draws the polygon again by symmetry.
  - Morholt's soft passable mountains are mirrored into the Ashspine's west foothills.
  - At the mere, a reddish field is reflected into the cell.
- **A heavy shadow under the range.** A flat, dark navy cast shadow lies along the Ashspine's south foot.
- **The mere is soft.** It is an ellipse with a soft shore (it has no 2× layer) and a rim on about 50% of its outline.

## Massif ("sculpted massif"): 6/10

**What works**
- **The best read where it matters most.** At the start view, the least zoom and Mid it is a mountain range: big lit and shaded faces, crests and saddles, and snow on the high ridges (`massif/01-start.png`, `15-mid-start-wilds.png`, `02-far.png`). At Mid its busyness (30.4 / 7.2) matches owner reference 2.
- **The quietest frame.**
  - It has a 2 px black ink line.
  - The pale rim is gone: 0–15% of the outline at the start view (pass 2: 22–99%) and 0–29% at the least zoom (pass 2: 100%).
  - The quiet edge that replaces the rim is land-coloured, at L\* about 55.
- **The Still Mere is the only natural lake.** It has a lobed shore that never follows the cell, a lighter shallow shelf, a deeper centre, a reedy margin, and no rim. It is crisp at every zoom (`grid/08-near-mere-stillmere.png`, `grid/11-max-mere-*-dpr2.png`).

**What does not**
- **It is pasted on.**
  - The massif's smooth, rounded silhouette, with a dark shaded foot, sits on an even olive-ochre skirt between it and the line.
  - That skirt is not the land outside: it does not carry the fields or the green plains (`grid/10-max-grey-box470_380_620_520.png`, `13-max-ash-east.png`), and the ground step across the line is 7–14.
  - The effect is a rock island on a mat inside a frame, the opposite of "grows out of the land".
- **Up close it turns to clay.**
  - At Near and the closest zoom the faces are rounded pillows with a visible noise grain (`grid/09-max-ash-box500_300_800_500.png`). The terminators are crisp, but the forms are not ridges.
  - The snow reads as streaks.
- **Louder than the reference when zoomed out.**
  - At the start view and the least zoom, 14–27% of core cells jump more than 20 L\*, against the reference's 8–9%.
  - Navy shade at p5 L\* 8.5–12 and white snow up to L\* 82 make the range the most contrasty object on the map.
  - Snow above the brightness cap is a rule change.

## Open ("spill"): 3/10

**What works**
- **The only range that crosses the line.** Where the Ashspine meets hills and mountains, its foot and relief run into Halevale and Morholt, and the north edge loses the frame. That is the reference's "ranges in mountain country".
- **Water on average.** The mere's mean water is the closest of the three to the map's water.

**What does not**
- **Still a smoky slab.** The rock fills the cell with horizontal brushed streaks and almost no large value structure:
  - 0.3% of cells jump more than 20 L\* at the start view;
  - its L\* p5 is 17, so it has no deep shade;
  - the rock begins with a soft 10–15 CIE76 step, which is why it reads as haze.
- **The Greyteeth reads as a trench.** A dark central groove runs between lit walls (`open/07-near-grey.png`).
- **The frame got heavier than pass 2's.**
  - The cream rim is on 66 / 83 / 67% of the outline at the start view; pass 2 was 61 / 22 / 99%.
  - At the least zoom it is 92 / 100 / 63%.
  - The spill fixes only the Ashspine's north edge, and the Greyteeth has no neighbour it can spill into.
- **The mere is milky.** A wide, pale, low-chroma shallow shelf (L\* 43) around a dark channel reads as ice or a film, and the lake is lighter than the ponds around it.
- **The spill reverses an approved rule** ("every pixel of land is where the sim's polygon says") and costs two terrain reads when zoomed out, for about 40% of one range.

## What to ship, and what to graft onto massif

**Ship massif's architecture:**
- the 2× wild rasters drawn at Near;
- the spine-driven massif;
- the natural mere;
- the per-stretch quiet edge solved from rendered pixels;
- the 2 px ink.

Then graft:

1. **From relief: start the range at zero height and let the land climb into it.**
   - Replace massif's smooth-minimum silhouette (`p58x-massif-gen.js`) with relief's height that rises from 0 at the foot over 0.2–0.4 D, varied by noise.
   - Drive the rock line by ridges and slope ("crests and steep faces turn to rock first, valleys stay green"), so green re-entrant valleys run up between spurs.
   - This removes the pebble outline and its dark foot edge.
2. **From relief, with open's method: the foothills are the neighbouring land itself.**
   - Continue the neighbour's covers into the skirt: fields thinning out, woods climbing to a treeline, swamp pools.
   - Generate them with the land's own seeded recipe, as open's mere fringe does, not with relief's mirror. The mirror draws chevrons at the line, repeats fields and seams at corners.
   - Target: a ground step across the line of 4 CIE76 or less (relief 1–4, massif 7–14 now).
3. **From relief: ridged crests at the fine scale, on massif's large forms.**
   - Sharpen the faces at Near and the closest zoom into faceted ridges instead of rounded pillows.
   - Drop the grain noise on rock at the closest zoom.
   - Keep the fine detail at 1.0–1.5× the land, not relief's 3–6×.
4. **Calm massif at the start view and the least zoom.**
   - Lift the deepest shade from p5 L\* 9–12 toward 15, and desaturate the navy.
   - Hold snow lower or smaller at Far.
   - Aim for core busyness near the reference's 31–35 / 8–9 rather than 48 / 14.
5. **Make the needed light element a landform, not a line.**
   - Continuing the land under the line will raise how often the colour-blind wild edge test needs a light element. Relief needed it on 76–88% of the outline for exactly this reason.
   - Keep massif's per-stretch solve, but draw the light element on the wild side as broken, varying-width lit scree and talus at the foot that follows the heights, not as a constant 2 px band parallel to the ink.
   - Done when: in the start view the "any lighter inner line" share is 40% or less (it is 55–71% now), and the pass-2 verifier's 40% rim target holds.
6. **From relief: fog runs on into the continued land.** The unexplored neighbour's haze fades into the foothills, while rock and water stay unfogged.
7. **From open: the mere's mid-depth at the map's water lightness** (about L\* 37), keeping massif's shore and margin but not open's pale low-chroma shelf.
8. **All three: data modes still draw the v4 granite slab.** Switching to a data mode changes the wild's shape. A desaturated copy of the new wild raster under the mode would keep the shape constant.

**For the owner**, in my view:
- The only decision needed is massif's snow above the brightness cap. The references have snow on the ridges, and it covers 5% of the range.
- I would not ask about the spill now: it helps one edge of one range on this map and reverses an approved rule.

## Method and files

Everything is under `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge/`.

**Tools** (`tools/`):
- `lib.cjs` and `dump.cjs` are adapted from `pass2/verify/tools`.
- `shots.cjs`: identical cameras on all builds.
- `phone.cjs`, `grid.py`, `judge.py`, `silhouette.py`, `wildinfo.cjs`.

**Outputs** (`out/`): `wildinfo.json`, `judge-all.txt`, `dump/`, and the run logs.

**Shots:**
- `shots/{p2,relief,massif,open}/`: views 01–15 at 1440×900.
- `*-dpr2/`: double density.
- `phone/`, `grid/`, and `sheet-judge-art.png`.

**Notes on the measures:**
- **Lighter inner line:** my own measure. I added it because the pass-2 verifier's L\* ≥ 65 rim metric no longer sees the land-tinted rims and quiet edges that replaced the cream rim.
- **Rock start:** its position along the outline (median distance and spread) did not separate relief from massif (both about 0.14 D from the line), so I judged the silhouettes by eye.

Files:
- /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge-art.md
- /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge/shots/sheet-judge-art.png