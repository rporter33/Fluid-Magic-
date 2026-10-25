# Pass 3 prototype "open": the range may spill outside its cells

This is a sandbox copy of the game-screen mockup: `build.sh` and `parts/` were copied from `visual-v4/map/`, and the originals are kept in `parts-orig/`. The approach is "rethink the constraint". In the owner's reference direction, mountain ranges run across province borders. So this prototype lets a range's foothills, relief and cast shadow spill a short way out of its cells into neighbouring hills and mountains. Impassability is then shown by the dark contour, the hover card, path refusal and the movement preview, not by a frame.

Nothing outside this folder was touched. `git status` in the repo is clean, and the live build `visual-v4/map/game-screen-v4.html` still has md5 `fed36962…`.

- **Build:** `sh build.sh` writes `game-screen-v4.html` (md5 `d7bb69bd…`). `build.sh` adds the new part `p58x` after `p58w`.
- **Parts edited (line counts):** every part is under 400 lines.
  - `p58w-natural-wilds.js` (110): rewritten. Heights, spill eligibility and shadows.
  - `p58x-natural-wild-colour.js` (123): new. Colour at 2×, the spill colour, the mere, and the Near layer.
  - `p58a-relief-base.js` (164): three constants.
  - `p58m-materials.js` (117): calls the new colour pass.
  - `p59-relief-draw.js` (222): draws the 2× layer.
  - `p59b-relief-lines.js` (319): the rim decision and the Natural ink.
  - `p59c-relief-detail.js` (87): rock grain strength on the ranges.
  - `p89-pass2-checks.js` (87): new check `window.__mock.reliefWildSpill()`.

## What was built (Natural look only)

Clear, the Terrain mode and the data modes keep their current wild look, as allowed.

### 1. Ranges (the Ashspine and the Greyteeth)

**Height field**
- Each range has one height field at twice the bake's resolution.
- The mass rises from a foot that wanders with noise. The foot sits at the outline on ordinary edges and up to 0.2 D outside it on spill edges.
- Shape:
  - The rise uses the cells' inner distance with its medial crease blurred out, so the polygon's skeleton is never drawn as a crest.
  - Ridged crests run along the range's axis in the core; spurs run across it on the flanks.
  - The relief is domain-warped.

**Lighting and materials**
- Lighting is Horn's slope at 2× under the map's light from the upper left, with the relief exaggerated 1.8×.
- Rock:
  - Lit faces reach up to the existing brightness cap (passable rock p99.9 + 2.5 L\*).
  - Shade faces are cool and around L\* 26.
  - It has a crisp ridged grain and darkens in its own cast shadow and valleys.
- The rock line follows the heights, not the polygon. Valleys run up into the range as heath, and spurs come down as rock.
- Frost sits on the highest lit crests, under the cap.

**Resolution at each zoom**
- The 1× bake is the CIELAB mean of the 2× samples.
- The 2× colours are kept as a canvas that is drawn over the bake once a bake texel is about 1 CSS px or more, so Near and the closest zoom are crisp, not magnified.
- The Near detail pass adds the rock grain on top at 0.6 of its land strength.

### 2. The spill (the Ashspine only)

**Where it may go**
- Only into neighbouring hills and mountains. Each texel must pass all of these:
  - its province is hills or mountains, and so is its warped terrain lookup;
  - it is not a field texel;
  - it is not within 0.035 D of a lake, pond or stream;
  - it is outside the seat zone (0.22 D, fading to 0.32 D, covering the town or hamlet, its army slots and its label).
- The resulting eligibility mask is blurred, so the spill fades out before it reaches any excluded texel.
- On wood crowns, only the relief shows; rubble and outcrops are not drawn there.

**What it draws**
- The land keeps its own colour and takes the range's light and shade, heath and rubble on the rising foot, and rock outcrops on the spurs (capped at 0.55).
- Snow, frost and crags are never drawn outside the cells.
- Inside the cells beside a spill edge, the land mirrored across the outline carries the same relief, so the range runs across the line.
- Within 0.08 to 0.15 D of the line on spill edges, no shade drops below L\* 37, so the dark contour reads on both sides.
- The range's cast shadow on the land to the lower right is pass 2's behaviour, unchanged. It already fell on any terrain, including farmland.

**The Greyteeth has no hills or mountains neighbour** (its neighbours are forest, swamp and farmland). The spill rule therefore gives it nothing. Its change comes only from the new range drawing.

### 3. The edge

- **Natural contour ink:** now `#0D0C0B` (L\* 3.6; it was `#1C1A17`, L\* 9.8), so it reaches 20 / 12 against grounds down to about L\* 33.
- **Light rim:** drawn only on stretches where the ground pair misses 20 / 12 **and** the ink misses against either side. The ink test has its own margin (1.0) and jitter (2 L\*, more at Far).
- **Pass 2's solved apron is removed:** that was the pale scree or dark talus band at the range's foot.
- **Beside light land on ordinary edges:** the foot keeps no deep shade within 0.05 to 0.10 D, so the ink also carries those edges.

### 4. The Still Mere (inside its cells)

**Lake shape**
- The shore is a seeded wander of the cell's rounded inner distance: lobes, bays and spits that never run parallel to the straight edges.
- Past 0.3 D inside, the water is always open, so there are no islands in the middle.

**Water**
- A shallow shelf by the shore (L\* 43, greener) and a deep centre (L\* 27) in the map's water hue.
- Mean water is Lab [38.0, −19.3, −2.8], against the map's natural water at [36.8, −23.8, −3.1]: ΔE 2.7 (pass 2: 7.3).

**Fringe**
- Between the outline and the shore, the swamp around continues by the land's own seeded recipe (the same pools, reeds and shrubs), turning to marsh and reed at the water. The pattern runs across the outline with no seam.
- No mirrored land is used: at the cell's corners a mirror switched edges and drew a seam, and fields were reflected into the cell.

**Other**
- Reeds, faint ripples and two dark snags are drawn on both the bake and the 2× layer.
- No rim is drawn where the ink or the ground pair carries the edge.

## The rule this changes

Stated plainly: **"0 texels outside the wild's cells"** (pass 2's wild look rule). This is also map-relief finding 25 and V2: "every pixel of land is where the sim's polygon says". Under this prototype, a wild's drawing changes land outside its cells.

The spill check (`m.reliefWildSpill()`) measures it:
- **Texels changed:** 21,858 bake texels outside the Ashspine's cells, 0.83% of the bake.
  - Halevale 9,075, Karreach 5,810, Morholt 4,137, Ashvale 2,836: all hills or mountains.
- **Reach:** at most 0.212 D from the outline.
- **How much they moved (CIE76):** p50 8.9, p90 15.8, max 25.4; 20,332 texels moved by more than 2.
- **Where it never goes:** 0 texels on fields, on farmland by the lookup, on water, in a seat zone, or in a province that is not hills or mountains. 956 texels sit under wood crowns, where only the relief shows.
- **Wild texels themselves:** still 0 outside their cells (the existing `reliefWildLook()` check).

Smaller changes that come with it, in the Natural ownership view only:
- The contour ink colour.
- The rim decision counts the ink.
- Pass-2 critique fix 3's apron is removed.
- Pass-2 critique fix 4's Near rock grain is replaced by the 2× layer plus the grain at 0.6.
- The mere's fringe no longer mirrors the land.

## What it costs (measured)

Unless stated, every number is from this build against the pass-2 build at the same views, 1440×900, dpr 1. There were 0 page errors in every session (checks, sweeps, dumps, readers, determinism, sameness, v3, shots, interaction).

### Terrain readers (the page's lightness-only readers; patch / province accuracy)

| View | This build | Pass 2 | Misread here |
|---|---|---|---|
| Least zoom (53.7 px/province) | 0.904 / 0.983 | 0.910 / 1.0 | **Karreach** (hills read plains) |
| 60 px | 0.924 / 0.983 | 0.925 / 1.0 | **Ashvale** (hills read plains) |
| Start | 0.972 / 1.0 | 0.974 / 1.0 | none |
| 131 px | 0.966 / 0.978 | 0.968 / 0.957 | Bramreach (pass 2 also missed Ashvale) |
| Mid | 0.928 / 0.931 (fails) | 0.928 / 0.931 (fails) | Duskholt, Karwick (before this pass) |
| Reference zoom | 0.932 / 0.957 | 0.932 / 0.957 | Briardale |
| Near | 0.999 / 1.0 | 0.999 / 1.0 | none |

- **Cost to the neighbours:** two of the four spill neighbours, Karreach and Ashvale, read as plains at the two farthest zooms. Halevale and Morholt are never misread.
- Province accuracy stays above the 0.95 floor everywhere it passed before. The least-zoom flag fails in both builds, because of the texture reader.

### The colour-blind wild edge test

**0 fails in every view, look and density:**
- Natural: 18 views at 1× and 7 at 2×.
- Clear: 18 views. Terrain mode: 18 views.
- An 11-view wild sweep in each look.

Samples: 305 at the start view, 138 at the least zoom, 429 at Mid, 433 at the reference zoom.

**Light rim share of the outline, per wild (this build / pass 2):**

| View | Ashspine, hills/mountains edges | Ashspine, other edges | Greyteeth | Still Mere | All wilds |
|---|---|---|---|---|---|
| Start | **0.12** / 0.67 | 1.00 / 0.54 | 0.83 / 0.22 | **0.64** / 0.98 | 0.70 / 0.56 |
| Least zoom | 0.78 / 1.0 | 1.0 / 1.0 | 0.98 / 1.0 | 0.56 / 1.0 | 0.86 / 1.0 |
| Mid | **0.07** / 0.68 | 0.78 / 0.42 | 0.80 / 0.24 | 0.44 / 1.0 | 0.58 / 0.54 |
| Reference zoom | **0.07** / 0.71 | 0.80 / 0.33 | 0.87 / 0.27 | 0.34 / 1.0 | 0.59 / 0.53 |
| Near, Ashspine | **0.07** / 0.81 | 0.80 / 0.31 | 0.87 / 0.31 | 0.38 / 1.0 | 0.60 / 0.55 |
| Closest | 0.07 / 0.81 | 0.83 / 0.35 | 0.89 / 0.38 | 0.35 / 1.0 | 0.61 / 0.59 |

- **What the spill buys:** on the Ashspine's spill edges, the frame goes from about 70–80% of the edge to about 7–12%.
- **The mere:** its rim drops from a full rim to 34–64%.
- **Ordinary edges beside forest, swamp and shadowed plains:** the rim is now drawn where pass 2 drew its pale or dark apron band, so the rim covers more of the outline (Greyteeth 0.80–0.98). It is a 2 px line rather than a 6–10 px band.

### Hover, path refusal and the movement preview (real pointer; start view and Near)

- **Hovering a spill point** outside the cells names the neighbour and its terrain ("Halevale · Hills", "Morholt · Mountains", …). It shows no "Impassable" card and no cursor label: 9 of 9 at both zooms (6 points in the spill, 3 beside ordinary edges).
  - The neighbour's hover tint covers the spilled foothills (shot 16). The spill visibly belongs to that province.
- **Hovering just inside** shows "Peaks · Impassable" and, with an army selected, "✕ Impassable: the Ashspine", 9 of 9 at both zooms.
- **Right-clicking into the range** is refused: "No path crosses the Ashspine."
- **Orders into the spill zone** never enter a wild:
  - Into Morholt: ordered, 5 days.
  - Into Ashvale: "8 days, around the Ashspine".
  - Into Karreach and Halevale: refused, "No path: the Ashspine blocks the way, and the way around crosses hostile Ashvale".
- None of this logic was changed. It runs on the polygons, not on the drawing.

### Busyness (the verifier's metric: share of neighbouring 6 px cells with ΔL\* > 10 / > 20)

| View | Peak cores (now / pass 2) | Mere core | Peak edge band, lines layer | Peak fine detail ÷ land |
|---|---|---|---|---|
| Start | 25.2/1.0 (38.8/10.8) | 2.3/0 (0.8/0) | 66.0/19.6 (57.9/27.3) | 2.32 (1.41) |
| Least zoom | 21.1/0.0 (51.4/11.9) | 4.0/0 (4.0/0) | 64.9/24.3 (68.5/25.2) | 2.48 (2.16) |
| Mid | 20.0/0.7 (20.7/3.6) | 1.1/0 (0.9/0) | 67.2/22.7 (64.6/21.7) | 3.50 (0.95) |
| Reference zoom | 12.2/0.1 (19.6/4.6) | 0.7/0 (0.3/0) | 57.3/25.2 (61.5/23.9) | 2.09 (0.66) |
| Near, Ashspine | 15.4/1.0 (16.5/2.0) | — | 74.2/17.3 (61.9/30.4) | 2.52 (0.96) |
| Closest, Ashspine | 10.5/0.4 (5.8/0.4) | — | 70.5/18.8 (65.2/35.4) | 1.22 (1.16) |

- For reference, owner reference 2's range is about 35 / 8.6 by the same metric. The cores are therefore calmer than both pass 2 and the reference at the coarse scale; the crispness is in fine detail, not in big value jumps.
- **Peak lightness** (p5 / p50 / p95 / max): 17.0 / 30.4 / 47.0 / 52.1 against a cap of 54.85, with 0 texels over it. Pass 2 was 5.3 / 20.5 / … — the dark slab is gone.

### Bake time and memory

Three interleaved fresh loads per build on the shared machine; medians.

| | This build | Pass 2 | Difference |
|---|---|---|---|
| Wild steps (heights + colour) | 3.28 s | 1.64 s | +1.6 s |
| Whole Natural bake (CPU) | 9.3 s | 8.0 s | +1.3 s (+17%) |
| First frame with the bake | 12.8 s | 11.1 s | +1.7 s |

Memory:
- The 2× canvases kept for Near take 11.3 MB of RGBA. The Greyteeth's canvas includes a spill margin it does not use, so it could be trimmed to about 1.5 MB.
- The review-only spill mask takes 2.6 MB.

### Lines, rails, determinism, sameness

**Lines**
- Natural lines pass in every view. The faint lines are unchanged: median 1.245 at the start view, p90 1.34, maximum 1.76–1.98.
- The hover-lines check fails at Mid and Near on Ashmoor/Elmwick (2.14 and 2.29). That failure is unrelated to the wilds and is identical in pass 2. At 2× it passes.
- Clear and Terrain line minima are identical to pass 2, including the 1.756 and 1.815 hairlines that pass 2 already had at two Near views.

**Rails:** 0 band-rule fails in every view, look and density.

**Determinism**
- Natural: 3 of 3 fresh loads identical in 6 views, bake hash `34d47a0a`.
- Clear: 2 of 2 identical. Terrain mode: 2 of 2 identical.
- Rebakes are identical: Natural 3702877693; Clear 4243484565, the same as pass 2.

**Sameness**
- Clear is pixel-identical to pass 2 in 5 views.
- The Terrain mode draws the same land. At the start view, 3,528 px differ, all in animated army and town sprites.
- The Supply mode differs by at most 624 px, by ≤ 10/255, where the Natural land shows through at its residual opacity.
- Painted (v3) is identical to pass 2 and to the page before the Natural view, in 10 views over 2 loads.

## Should the owner be asked? Yes.

1. **It reverses an approved rule.** "Every pixel of land is where the sim's polygon says" was approved with V2. Pass 2 then made "0 texels outside the wild's cells" a check. Undoing either is the owner's decision.
2. **It changes how terrain reads, which the owner chose as the default.** The owner picked "terrain is read from what is drawn". With the spill, the northern third of Halevale and Karreach looks like mountain foothills, though both provinces are hills. The page's own readers show the cost: Karreach and Ashvale read as plains when zoomed out. Hover still names the right terrain, and the neighbour's tint covers the foothills.
3. **The benefit depends on the map.** On this map it applies to about 40% of one range's outline and to none of the Greyteeth's, which borders no hills or mountains.
   - In the reference direction, ranges sit inside mountain country. On our maps a wild's neighbours are mapgen's luck.
   - A mapgen rule ("ranges border at least some hills or mountains") would decide how often the spill helps. That is a sim-side change and needs the owner too.

The question should show the start-view side by side (shot 11b) and the hover shot (16). Two options:
- **"Ranges may run into neighbouring hills and mountains; the dark line marks what you cannot enter."**
- **"Keep wilds inside their own provinces."**

## Weaknesses (honest)

**The frame is still there on most of the outline**
- At the start view, the light rim covers 70% of all wild outlines (pass 2: 56%).
- The spill only removes it where a range meets hills or mountains.
- Beside forest, swamp and the range's own shadowed plains, the colour-blind test still needs a light element. Here that is the 2 px rim, where pass 2 used a pale or dark band.
- The Greyteeth is framed on 80–98% of its outline.

**The range itself**
- **Heavy contour:** the near-black 3 px contour is heavier than before, and at the start view the polygon is still drawn by it on every side.
- **Olive foot bands:** on ordinary edges, the heath foot reads as an olive band just inside the line, especially round the Greyteeth (shot 06) and on the Ashspine's east side. The light-land floor that lets the ink pass there adds to it.
- **Coarse-scale calm:** the cores are calm at the coarse scale (25 / 1 at the start view against the reference's about 35 / 9). At the start view the range reads as a grey mass with fine ridging more than as big lit and shaded faces. The large-scale value contrast is lower than the reference.
- **Mirror at spill edges:** inside the cells beside a spill edge, the land is mirrored across the outline. Its texture repeats as a reflection, and at a corner the mirror can switch edges.

**The spill**
- **Lifted shade on spill edges:** within 0.08–0.15 D of the line, shade is lifted to L\* 37. This is a slight lit corridor along the north side; it exists so the ink passes.
- **Least zoom:** the frame comes back on the spill edges (78%), because the test samples 0.11–0.17 D from the line there.

**The mere**
- The rim still covers 34–64% of the outline, wherever the swamp outside is dark and the fringe sits between the line and the water.
- The fringe is generic swamp. Beside Ashmoor's and Elmwick's fields it shows marsh, not fields, so on those two edges the line is still a change of land.

**Cost**
- About 1.3–1.7 s more bake time and 11 MB of canvases.
- The rim decision takes up to about 260 ms each time a zoom settles (pass 2: up to about 210 ms).

**Not done**
- No dpr-2 shots were taken. The 2× checks were run.
- The cached-start-frame flake the pass-2 verifier saw under heavy load was not reproduced.

## Shots (`shots/`, 1440×900 unless noted)

**Required views**
- `01-start`, `02-far-least-zoom`, `03-mid`, `04-reference-zoom`
- `05-near-ashspine`, `06-near-greyteeth`, `07-near-still-mere`
- `08-closest-ashspine`
- `09-clear-start`
- `10-phone-390x844-fit` (390×844)

**Side by side with pass 2**
- `11-side-by-side-start`: against `pass2/shots/01-start.png`.
- `11b-side-by-side-start-wilds-2x`: the wilds at 2×.
- `18-side-by-side-near-ashspine`
- `19-side-by-side-closest-ashspine`

**Extras**
- `12-closest-greyteeth`, `13-closest-still-mere`
- `14-mode-supply`, `15-terrain-mode-start`
- `16-hover-spill-halevale`: the spill belongs to Halevale.
- `17-hover-inside-ashspine-army`: the card and "✕ Impassable".

## Files

- **Measurements:** `out/`.
  - Check suites: `run-checks-{natural-1,natural-2,clear-1,terrain-1}.txt`.
  - Wild, line and rail sweeps: `run-wq-*.txt`, `wq-*.json`. The pass-2 build's are in `run-wq-p2-*`.
  - Rim per wild: `rimwild-{now,p2}.json`.
  - Busyness: `busywild-final.txt`.
  - Readers: `readers2-{now,before}.json`.
  - Determinism: `run-det-*.txt`.
  - Sameness: `run-same.txt`, `same/`, `run-v3same.txt`.
  - Spill: `spill.json`. Interaction: `interact.json`. Timing: `timing.txt`.
  - Dumps: `dump/`.
- **Tools:** `tools/`. They are copied from pass 2's verifier tools and the sibling sandbox, and pointed here.
  - Added for this prototype: `spill.cjs`, `interact.cjs`, `rimwild.cjs`, `rimdbg2.cjs`, `hovershot.cjs`, `sbs.py`, `edges.cjs`, `probe1.cjs`, `mprobe.cjs`, and the lane scripts `L1`–`L4.sh`.
