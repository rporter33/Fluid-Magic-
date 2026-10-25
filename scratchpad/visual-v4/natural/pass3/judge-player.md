# Pass 3 wilds: player and readability judgement

**Lens.** I judged the three prototypes as a player and readability tester:
- Can you tell at a glance, at every zoom and on the phone, which land is impassable and where its edge is?
- Do hover and path previews make it unambiguous?
- Do the neighbouring provinces' terrain still read?
- Does all of this hold under colour blindness?

I did not judge art direction except where it changes how the map reads.

**How I checked.** I opened each build myself, took my own shots and looked at every one. The rebuilt pages match the delivered ones (md5 `4add5cc1` relief, `fa6edbad` massif, `d7bb69bd` open). I edited nothing in the prototypes, in `visual-v4/map/` or in the repo.

## Verdict

| Prototype | Score | One line |
|---|---|---|
| **Sculpted massif** | **8 / 10** | The clearest "this is a mountain you cannot cross" at every zoom and on the phone. The snow brings back the wilds' reserved cue, the frame is the lightest of the three, and the neighbours read exactly as in pass 2. The cost is a stall on every pan. |
| Continuous relief | 7 / 10 | Crisp, and the most distinct from passable mountains. But the land runs on unchanged across the line, so the line and a pale inner rim carry the whole edge. It is the most framed of the three, and one neighbour misreads at the least zoom. |
| Open (spill) | 4 / 10 | Rock reaches the line inside, but outside the line, passable hills now look like mountain flank. Two neighbours misread, and at the least zoom the range is the hardest of the three to tell from passable mountains. Still framed on most edges. |

**I would ship the sculpted massif.** Before it ships:
- Graft relief's crisp ridged detail at close zoom.
- Graft open's lighter mere water.
- Add an on-map hover response for wilds; none of the three has one.
- Make the edge decision cheap.

Details are under "What to graft onto the massif" below.

## What I ran

All sessions ran at 1440×900 dpr 1 unless marked. There were 0 page errors in every session that recorded them: captures, pointer probes, edge hovers, Clear, readers.

| Run | Builds | What |
|---|---|---|
| `tools/capture.cjs` | pass 2 (`visual-v4/map`), relief, massif, open | 10 desktop views (start, least zoom, Mid, reference zoom, Near on each wild, closest on each wild); 5 phone views at 390×844 dpr 2 (start, Fit, Mid on Ashspine, Mid on Greyteeth, Near on Ashspine); the supply data mode. Each view is dumped as land and lines layers plus a province/wild mask |
| `tools/interact.cjs` | all 4 | Real pointer: 26 walks across wild edges in 1 px steps (start, Mid, Near); 14 tooltip and cursor-label hovers; neighbour hovers; marching orders that go around a wild |
| `tools/edgehover.cjs` | all 4 | At Near over the Ashspine: hover Halevale (hills) and Morholt (passable mountains) 14 px outside the line, then 14 px inside it with Varo selected |
| `tools/analyze.py` | 60 views | Edge salience, ground onset, wild against passable mountains and hills, neighbour shift. Each is run under normal vision and simulated protan, deutan and tritan (Machado 2009, full severity, linear RGB, the page's matrices) |
| `tools/readers.cjs` | all 4 | The page's own terrain readers at the least zoom, 60 px a province, the start view and Mid |
| `tools/clear.cjs` | all 4 | Clear terrain colours: canvas hash at the start view and Mid |
| `tools/hitch.cjs` | all 4 | Wall time of zoom changes and of pans out of the cached frame, interleaved, run twice |

The machine was shared: load average was 9 to 15 during the timing runs.

## 1. Which land is impassable, at a glance, at every zoom and on the phone

**What I saw**

- **Massif.** Reads as a mountain object at every zoom: big lit and shaded faces with snow on the crests, standing in an olive foothill apron.
  - Least zoom: `sheets/far-b.png`.
  - Start view: `sheets/start-ash.png`, `sheets/start-grey-mere.png`.
  - Mid: `sheets/mid-ash.png`, `sheets/mid-gm.png`.
  - Phone: `sheets/phone-start.png`, `sheets/phone-mid-ash.png`, `sheets/phone-near-ash.png`.
  - In the squint test (grey plus blur, `sheets/squint-start.png`) both ranges still pop. The mere is the weakest of the three wilds there, but it is visible.
- **Relief.** Reads as rock at every zoom: a crisp field of dark ridges. The ridges run in an even vertical comb, which reads as texture more than as a range.
  - The rock starts well inside the line. Around it, the neighbours' woods, fields and hills carry on inside the impassable cell. Examples: forest on both sides of the Ashspine's south line at the reference zoom (`sheets/ref-ash.png`); fields running across the mere's north line at the closest zoom (`sheets/max-mere.png`).
  - A player sees walkable-looking land inside the line, and only the line says it is not.
- **Open.** Inside the line the rock reaches the line. But at the start view and Mid the range reads as a grey slab with horizontal streaks, like brushed metal or wood grain (`sheets/mid-ash.png`, `sheets/near-ash.png`). That is closest of the three to the pass-2 slab the owner rejected.
  - The Greyteeth is a striated grey bar inside a cream frame (`sheets/near-grey.png`).
  - On the Ashspine's north side, mountain-looking relief continues past the line into Halevale (`sheets/eh-halevale.png`, `sheets/phone-near-ash.png`).

**Measured: does the impassable ground look different from the land around it, and where does that start?**

Method: a linear classifier on the land layer (blur about 2 px; L\*, a\*, b\* and local texture), trained on wild cores against the land ring 0.35 to 1.2 D outside. The 4 px around the line are excluded.

| | Pass 2 | Relief | Massif | Open |
|---|---|---|---|---|
| Ground AUC, wild core against land ring (all views) | 0.963–1.0 | 0.981–1.0 | 0.973–1.0 | 0.954–1.0 |
| Same, worst colour-blind simulation | ≥ 0.942 | ≥ 0.969 | ≥ 0.968 | ≥ 0.946 |
| Where the ground starts to look wild (50% point, inside the line) | 0.05–0.2 D | 0.15 D everywhere | 0.15 D everywhere | 0.05–0.10 D (0.15 at least zoom) |
| Share that looks wild in the first 0.15 D inside the line | 0.0–0.99 | 0.09–0.42 | 0.12–0.33 | 0.33–0.74 (0.15 at least zoom) |

**Measured: is it a mountain I cannot cross, or one I can?**

The game also has passable Mountains, such as Morholt next to the Ashspine. This classifier is trained on the Peaks cores against every passable mountain province in view.

| | Pass 2 | Relief | Massif | Open |
|---|---|---|---|---|
| AUC, normal vision | 0.899–0.950 | **0.986–0.999** | 0.946–0.992 | 0.897–0.986 |
| AUC, worst colour-blind simulation | ≥ 0.850 | **≥ 0.984** | ≥ 0.941 | **≥ 0.831** (least zoom) |
| Median colour distance, ΔE76 | 6.3–16.5 | 5.7–10.2 | 6.2–9.1 | 2.4–7.1 |

Notes on these numbers:
- Relief separates best from passable mountains. Open is worst: at the least zoom its grey range sits close to passable mountains in both colour and texture.
- The massif's numbers understate it. Its snow covers only about 5% of the range, so it barely moves the classifier, but the eye locks onto it. Snow is a categorical cue the design reserves for wilds:
  - passable Mountains are "never snow";
  - no natural material may come within 20 / 12 of snow;
  - the wild icon is "three snow-capped peaks";
  - the approved v4 wild was a granite massif with snow.
- Relief and open hold their snow or frost under the brightness cap, so it reads as pale rock. The massif is the only one where a player sees "snowy peaks = wild" (`sheets/far-b.png`, `sheets/cvd-start-deutan.png`).

## 2. Where the edge is

**Measured, every outline sample.** I sampled every 3 px along every wild outline, 6 px clear of the corners. For each sample I asked:
- does the line differ from both sides by at least ΔE76 20 (the sides are the medians 5–14 px out);
- is there a light line (more than 12 L\* above both sides) within ±4 px;
- how much does the ground itself change across the line?

| | Pass 2 | Relief | Massif | Open |
|---|---|---|---|---|
| Share of outline where the line stands out from both sides (≥ 20), all views | 0.49–1.0 (1.0 only at least zoom) | 0.983–1.0 | 0.989–1.0 | 0.995–1.0 |
| Same, worst colour-blind simulation | 0.36–1.0 (0.36–0.75 outside least zoom) | 0.959–1.0 | 0.978–1.0 | 0.986–1.0 |
| Light line present ("frame"), share of outline | 0.35–1.0 | **0.67–0.93** | **0.53–0.79** | 0.55–0.88 |
| Light line at the start view: Ashspine / Greyteeth / mere | 0.60 / 0.22 / 1.00 | 0.78 / 0.82 / 0.63 | 0.63 / 0.71 / 0.54 | 0.67 / 0.83 / 0.69 |
| Light line at the least zoom: Ashspine / Greyteeth / mere | 1 / 1 / 1 | 0.99 / 0.83 / 0.84 | 0.88 / 0.75 / 0.47 | 0.92 / 1.00 / 0.65 |
| Ground step across the line (median ΔE76) | 27–35 | **0.7–3.7** (24 at least zoom, where the 5–14 px sides reach the rock) | 7.7–15 (25 at least zoom) | 7.4–18 (24 at least zoom) |

**Read as a player**

- **All three fix the edge itself.** The near-black line plus the solved light line marks the edge almost everywhere, in every vision and at every zoom, which pass 2 did not do. Pointing confirms it: the hover flips between the wild and its neighbour within 0–1 px of the drawn line in 26 of 26 crossings in every build.
- **Relief draws the edge as a line on the land.** The ground is the same on both sides (median step 1–4 ΔE76), so the impassable cell boundary has nothing behind it but the line and a pale inner rim on 67–93% of the outline. This is the most "framed" of the three, which is the thing the owner objected to.
- **The massif changes the ground at the line.** The foothill apron is a distinct olive (step 8–15) and it has the least light line (53–79%). The apron is uneven: an even olive strip on the Ashspine's east end and the Greyteeth's west side. The massif can read as an island in a moat (`sheets/near-ash.png`, `sheets/near-grey.png`).
- **Open's edge is clear on ordinary edges, but ambiguous where it spills.** On the Ashspine's north side the line cuts through a single drawn slope: rock on both sides, with Halevale's town sitting on the mountainside (`sheets/eh-halevale.png`). A player cannot tell from the picture whether the mountain ends at the line or at the foot of the slope. The Greyteeth is framed on 81–100% of its outline.

## 3. Hover and path previews

The logic is identical in all four builds, because it runs on the polygons.

**Pointing inside a wild**
- Shows "Peaks · Impassable" or "Mere · Impassable" (14 of 14 hovers per build).
- With Varo selected, also shows the cursor label "✕ Impassable: the Ashspine" and the no-go cursor.
- Right-clicking inside the wild is refused with "No path crosses the Ashspine."

**Pointing at a neighbour**
- The card reads, for example, "Halevale · Hills, Borders the Ashspine (impassable)".
- The neighbour's tint and its lines at the colour-blind floor stop at the line, which is the best edge cue any build has.

**Orders around a wild**
- Varo's order to Ashvale is routed via Morholt, around the Ashspine.
- The thread never visibly crosses rock in any build (`sheets/order-start.png`, `sheets/order-start-zoom.png`).

**Where the prototypes differ: does what you point at look like what the card says?**
- **Relief:** 14 px inside the north line the ground looks like Halevale's hills, but the cursor says "✕ Impassable" (`sheets/eh-halevale-in.png`). The picture and the card disagree about the land under the cursor.
- **Massif:** the same spot is the darker foothill apron, so it disagrees less. The rock itself is unambiguous.
- **Open:** the reverse problem. Pointing at the rock-looking spill outside the line says "Halevale · Hills", with no Impassable card. The neighbour's hover tint does cover the spill, which helps, but only while hovering.

**Gaps in all three, unchanged from pass 2**
- **Hovering a wild changes nothing on the map.** I measured 0 changed pixels inside the Ashspine on hover; the code skips wilds in the hover tint. The only feedback is the cursor label (with an army selected) or the card after 500 ms.
- **There is no path preview before the right-click.**
- **On the phone** (no hover) the long-press toast is the only confirmation.
- **The phone start view's "4d" day chip sits on the Ashspine** in every build (`sheets/phone-start.png`).

## 4. Do the neighbours' terrains still read?

**The page's own readers (my run).** Patch / province accuracy, with the provinces missed:

| View | Pass 2 | Relief | Massif | Open |
|---|---|---|---|---|
| Least zoom | 0.910 / 1.0 | 0.910 / 0.983, **Karreach (hills) reads plains** | 0.912 / 1.0 | 0.904 / 0.983, **Karreach reads plains** |
| 60 px a province | 0.925 / 1.0 | 0.925 / 1.0 | 0.926 / 1.0 | 0.924 / 0.983, **Ashvale (hills) reads plains** |
| Start | 0.974 / 1.0 | 0.974 / 1.0 | 0.974 / 1.0 | 0.972 / 1.0 |
| Mid | 0.928 / 0.931 | same | same | same |

At Mid, Duskholt and Karwick misread in all four builds, which was already the case in pass 2.

**Colour shift of each neighbour's strip 0.03–0.2 D outside the wild, against its own interior (ΔE76 of medians)**

| Neighbour | Pass 2, relief, massif | Open |
|---|---|---|
| Halevale (start view) | 2.6 | 4.4 |
| Karreach (start view) | 1.7 | 5.6 |
| Ashvale (start view) | 4.7 | 6.7 |
| Karreach (phone, Mid) | 0.5 | 12.6 |

- Relief and the massif leave the neighbours exactly as pass 2 drew them.
- Open repaints them. Visually, the north of Halevale and Karreach reads as mountain foothills, against the owner's "terrain read from what is drawn".

## 5. Colour blindness

I simulated protan, deutan and tritan, and looked at all three at the start view (`sheets/cvd-start-protan.png`, `sheets/cvd-start-deutan.png`, `sheets/cvd-start-tritan.png`) and at the Ashspine's west end against Morholt (`sheets/west-start-deutan.png`).

- **Edges:** all three hold under every simulation (table in §2). The line stands out on ≥ 96% of the outline.
- **Wild against passable mountains:** under protan and deutan, Morholt's passable mountains and the ranges both turn blue-grey.
  - Relief keeps them apart by value and texture (AUC ≥ 0.984).
  - The massif keeps them apart with dark mass and white snow (snow survives every simulation).
  - Open's grey slab comes closest to Morholt (AUC down to 0.831 at the least zoom).
- **The mere against the swamp's dark pools** (passable water in the provinces around it), ΔE76 of medians:

| View | Vision | Pass 2 | Relief | Massif | Open |
|---|---|---|---|---|---|
| Start | normal | 22.4 | 19.5 | 20.2 | 28.5 |
| Start | protan | 18.7 | **13.6** | 16.4 | 26.9 |
| Start | deutan | 20.0 | 15.8 | 19.0 | 26.8 |
| Start | tritan | 17.3 | 17.2 | 16.4 | 27.8 |
| Near (mere) | protan | 20.5 | **10.0** | 11.7 | 28.4 |

  - Under protan, relief's dark mere is only 10 from the pools, so it reads as a very large pool; only its outline says otherwise.
  - Open's lighter water stands apart in every vision, but its blotchy shallows and islands read as a marsh rather than a deep lake (`sheets/near-mere.png`, `sheets/max-mere.png`).
  - The massif's mere has the clearest lake form (shelf, beach line, dark centre, no rim) but sits between the other two on distance.
- **Clear terrain colours** (the colour-blind setting): the canvas hash is identical in all four builds at the start view and Mid (`6de2d964`, `c2e5cac3`). A player on Clear sees pass 2's wilds in every prototype. The data modes show the same v4 granite slabs in all builds (`sheets/supply.png`). Switching from Natural to a data mode changes the wild's drawn footprint in all three.

## 6. Feel: stalls on pan and zoom

Pan out of the cached frame, median of 12 pans in each of two runs, on a loaded machine:

| Run | Pass 2 | Relief | Massif | Open |
|---|---|---|---|---|
| 1 | 253 ms | 289 ms | **850 ms** | 282 ms |
| 2 | 238 ms | 197 ms | **932 ms** | 202 ms |

- The massif re-decides its quiet edge from rendered pixels on every static re-render, so every pan to new ground stalls 3–4 times longer.
- Zoom changes were 0.7–1.5 s median in every build and too noisy to separate.

## Scores and reasons

### Sculpted massif: 8 / 10

**For**
- It is the only build where the impassable range reads as an object at a glance at every zoom and on the phone.
- Its snow is the wilds' reserved cue: passable Mountains never have snow, and the wild icon is snowy peaks.
- It has the least frame (light line on 53–79% of the outline, olive at about L\* 55 rather than cream).
- The ground changes at the line, so the edge is more than a stroke.
- The neighbours and the page's readers are identical to pass 2.
- Its mere is the most lake-like.
- The line holds in every simulation.

**Against**
- The foothill apron is an even olive strip on some edges, which reads as a moat.
- Up close the forms are rounded and putty-like and the snow swirls (`sheets/max-ash.png`), less convincing than relief's crisp ridges.
- Pans stall about 0.9 s.
- Its snow passes pass 2's brightness cap, which is a rule change the owner should see.
- Its mere is only 11.7 from the swamp pools under protan at Near.

### Continuous relief: 7 / 10

**For**
- The crispest rock at Near and the closest zoom.
- The best separation from passable mountains in every vision.
- The edge line holds everywhere.

**Against**
- The land carries on unchanged across the line (step 1–4 ΔE76): woods, fields and hills sit inside the impassable cell, and the impassable look starts 0.15 D in.
- The edge is carried by a line and a pale inner rim on 67–93% of the outline, the most framed of the three. That is the owner's complaint.
- The vertical-comb rock reads as texture more than as a range of ridges and valleys.
- Mirror seams: fields reflected inside the mere's north edge, and Morholt's relief mirrored into the Ashspine's west end.
- Its mere is the closest to the swamp pools under protan (10.0).
- Karreach misreads at the least zoom.

### Open (spill): 4 / 10

**For**
- Inside the line, the rock reaches the line.
- Its mere water is the most distinct from pools in every vision.
- Hover tints the spill as the neighbour's.

**Against**
- Passable hills now look like mountain flank: Halevale's town sits on the drawn slope, and Karreach and Ashvale misread at the two farthest zooms.
- The line cuts through one drawn slope on the spill edges, so the edge of the mountain is not where the edge of the wild is.
- The range reads as a grey slab with streaks, closest to the rejected pass-2 look and least distinct from passable mountains (AUC 0.831 worst case).
- It is still framed: the Greyteeth on 81–100% of its outline.
- It reverses an approved rule for a benefit that reaches about 40% of one range.

## What to graft onto the massif

1. **From relief: the crisp ridge grammar up close.**
   - Keep the massif's large forms for the start view and the least zoom.
   - At Near and the closest zoom, add relief's ridged crests, lit and shade faces and valley scree as the detail octave on its double-resolution raster, instead of the rounded putty faces and swirled snow.
   - Put snow as caps on crests and lit faces, not as streaks.
2. **From relief: let spurs come down through the apron.** Relief's rock line is driven by ridges and slope ("crests and steep faces turn to rock first, valleys stay green"). Use it to vary the foothill strip so the massif touches or nears the line on part of the outline. That breaks the even olive moat on the Ashspine's east end and the Greyteeth's west side.
3. **From open: the mere's lighter water and shelf.**
   - Raise the massif mere's shallow shelf toward open's lighter water so it is at least ΔE76 20 from the swamp pools in every simulation. Today it is 11.7 under protan at Near; open gets 27–30.
   - Keep the massif's defined shore and dark centre, and no islands or blotches.
   - Keep the massif's land-recipe fringe with no mirror. Relief's mirror makes seams and reflected fields; open showed the fringe works without one.
4. **From relief and pass 2: decide the quiet edge once per zoom, not on every re-render.** This fixes the 0.85–0.93 s pan stalls; the massif README already proposes it. Reading the rendered layer is fine at zoom settle.
5. **New, none of the three has it: show the wild on hover.**
   - When the pointer is over a wild, brighten its contour at once, as a hovered province's lines are; with an army selected, add a light no-go wash.
   - Today hovering the range changes 0 pixels on the map until the card appears 500 ms later.
   - On the phone, a long-press could flash the same outline with the toast.
6. **Do not graft the spill.** It costs neighbour terrain reads and blurs where the impassable land ends, and it needs the owner to undo an approved rule.

## Evidence

Everything is under `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge-player/`.

**Comparison sheets** (`sheets/`): rows or columns are builds; crops are native size, or 2× nearest-neighbour where marked.
- **Start view:**
  - `start-ash.png` (2×)
  - `start-grey-mere.png` (2×)
  - `start-ash-open.png` (2×)
  - `start-grey-mere-open.png` (2×)
  - `squint-start.png`
- **Least zoom, Mid and reference zoom:**
  - `far-a.png`, `far-b.png` (least zoom, 2×)
  - `mid-ash.png`, `mid-gm.png`
  - `ref-ash.png`
- **Near and closest zoom:**
  - `near-ash.png`, `near-grey.png`, `near-mere.png`
  - `max-ash.png`, `max-grey.png`, `max-mere.png`
- **Phone (390×844):**
  - `phone-start.png`, `phone-mid-ash.png`, `phone-mid-grey.png`, `phone-near-ash.png`
- **Colour blindness:**
  - `cvd-start-protan.png`, `cvd-start-deutan.png`, `cvd-start-tritan.png`
  - `west-start.png`, `west-start-deutan.png` (Ashspine against Morholt)
- **Hover and orders:**
  - `eh-halevale.png`, `eh-halevale-in.png`, `eh-morholt.png`
  - `hover-army-start.png`
  - `order-start.png`, `order-start-zoom.png`
- **Data mode:** `supply.png`

**Other files**
- **Shots:** `shots/<build>-<view>.png`, 4 builds by about 30 shots each (views, phone, hovers, orders, edge hovers, Clear, supply).
- **Measurements** (`out/`):
  - `an-<build>-<view>.json` (60 files)
  - `interact-<build>.json`, `edgehover-<build>.json`
  - `readers.log`, `clear-hashes.json`
  - `hitch-run1.json`, `hitch.json`, `hitch2.log`
- **Tools** (`tools/`): `lib.cjs`, `capture.cjs`, `interact.cjs`, `edgehover.cjs`, `clear.cjs`, `readers.cjs`, `hitch.cjs`, `analyze.py`, `summary.py`, `sheet.py`.
