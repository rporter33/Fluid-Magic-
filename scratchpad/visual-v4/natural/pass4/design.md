# Pass 4 of the map mockup: the mid-game record's overworld

2026-10-23. **Design only; nothing is built.** This pass shows, in the clickable game-screen mockup, the overworld items of the other
session's mid-game record (`pass4/mid-game.md`, copied from `claude/gifted-meitner-v8l3qv` at 360c7cb): its section 10 "The
overworld", plus the map parts of sections 2 (seasons), 3 (the supply path), 4 (rivers, roads, fords, bridges), 7 (Workings) and 9
(named regions, the Vast map). The record's rules land in later sim phases. Here they are drawn with mock data.

Nothing in `/home/user/Fluid-Magic-`, `visual-v4/map/` or `visual-v4/natural/pass3/` was edited. Every measurement below was taken
on a snapshot of the current build and on copies of it, all under `visual-v4/natural/pass4/` (the appendix lists them). Paths are
relative to `visual-v4/natural/pass4/` unless written in full.

**Binding owner direction applied** (verbatim sources in `docs/design/`):
- `map-relief.owner-answers.md`. The natural landscape is the default. Lines between unowned provinces are faint, and brighten on
  hover and selection, everywhere in Clear, and in the Terrain mode. "Realm borders keep their colour-blind contrast in every view."
- `visual-references.owner-direction.md`: "It's not cluttered it's clean". The reference screenshots are direction only, and the
  game they come from is not named.
- `map-relief.md`, `war-table.md`, `docs/07-ui.md` (labels by zoom, keys, the outliner, fog), and `natural/design-final.md`.
- The record's own settled answers (`mid-game.owner-answers.md`, cited in the record): supply reach is **two hops**, and the Vast map
  is **uncapped at 270 provinces, and measured**.

---

## What this pass is: the answer to "is this purely a UI pass?"

Section 10 of the record is mostly about how the map shows things. Most of it can be shown in the mockup now, with mock data, and it
helps the build in four concrete ways:

1. **It gives the zoomed-out view a job.** The Lean-back band is a strategic layer: realms, capitals, Wellsprings, Workings, armies
   by region, and region names. It comes with a measured performance target. A cheap separate pass draws a 236-province map at its
   least zoom in 8.4 ms, against 98.5 ms for the current drawing.
2. **It turns drawn water into rules.** The relief design held rivers, bridges and roads back because they carried no rule
   (`map-relief.md` §3.6 and §3.9). The record supplies the rules: a crossing costs 2 days, a road halves a leg, and a bridge can
   be cut. The move preview and the Supply mode can now show those numbers.
3. **It gives the late game names and memory.** Named regions, fog as memory with "as of Y1 M3", map search, pins, and marker
   muting.
4. **It puts a clock on the land.** Seasons show on the land and in the clock, and one Great Working stands as a landmark with a
   top-bar banner.

It is not purely UI, but it builds no rules either. The seasonal factors, supply lines, crossing costs, roads and Workings remain sim
work for M2 and M5, in the record's order. The mockup shows their look and the numbers the UI will print, from mock functions that
follow the record's figures.

---

## The design in fourteen lines

1. **One switch.** `P4S.on` is true in the relief look unless `?p4=off`. Painted (v3) never runs pass-4 code, and `?p4=off`
   restores the natural view exactly as before. Each feature also has its own flag, for isolation checks.
2. **A new Lean-back band** below 44 px a province. It fades in from 48 px to 40 px and is drawn by its own cheap static pass:
   - the sculpted model at quarter resolution, with realms as washes (0.28) and a thin rail;
   - capitals, Wellsprings and Workings;
   - one army token per region per nation, with a count;
   - region names.
   Far, Mid and Near keep their thresholds and drawing.
3. **Realm borders keep their colour-blind contrast at Lean-back** through a 1 + 2 + 1 px rail. The washes are never relied on to
   tell realms apart, and are off in Clear and the Terrain mode.
4. **Named regions** of 5 to 9 provinces, generated from the map (8 on the mockup's map), are lettered by hand along their long
   axis at Far and Lean-back. They fade out by 85 px, never sit over a province name, and their hover names the region's provinces
   and its main holder.
5. **Seasons on the land, in Natural only.** Spring greens the fields, summer is today's bake, autumn turns fields gold, and winter
   brings bare grey woods, brown fields, and a grey-blue frost on Hills and Mountains that stays ≥ 22 / 22 from the wilds' snow.
   The clock reads "Y1 Spring M3 D14". Clear and the Terrain mode never change.
6. **Fog as memory.** An explored province out of sight keeps its last-seen settlement, walls and land look, with the approved quiet
   desaturation and dotted lines. Its card says "Out of sight · as of Y1 M3". Ownership, terrain, water, roads, regions, Workings
   and the season stay current, and armies are not remembered on the map.
7. **Rivers along borders, roads from forts, and bridges** at their crossings:
   - The move preview bends at a ford, and "+2 days, crossing" names the cost.
   - A cut bridge shows as a broken span.
   - On a river edge, the river replaces the province line.
8. **The Supply mode** draws the selected army's supply path to its fort as wheat-gold beads, ending in "100%, 1 hop from Kharnath".
   The rule is the owner's two-hop reach, −20% for each hop past it, a floor of 20%, and a road hop counting as half. A piece with a
   share under 100% shows the half-wheat glyph.
9. **Map search on `/`**, a pin list with a pin layer in the outliner, and an eye toggle on outliner headers that mutes battle
   markers, transit arrows, scout eyes and pins.
10. **One Great Working,** Thornwood's The Greening, is cast at Deepmoss at M40 on the time-lapse. It appears as a landmark at the
    capital, a top-bar banner and a card. In winter it holds Thornwood's dominion in spring.
11. **Measured scale:**
    - The natural bake costs 77 ms of CPU for each extra province in the mockup, about 24 s at 270 provinces.
    - A static re-render on a 236-province probe costs 79 to 168 ms. A cached frame costs 0.4 to 0.6 ms at any size.
    - A quarter-resolution overview of the probe bakes in 2.5 s, against 21.8 s at full resolution.
    - The game must tile the Vast bake to stay under docs/06's 96 MB.
12. **A density budget per band**, for names, markers, pieces and chips. Muting frees layout room but never raises a cap or hides
    information from cards.
13. **The build lands after pass 3.** The new code goes in eight new parts, each under 400 lines, plus one CSS part. Hooks into
    existing parts are one to three lines each.
14. **Seven owner questions,** each with a recommended default (§12). The build follows the defaults.

---

## Rulings

- **R1. One switch, per-feature flags.**
  - `P4S = { on, lean, regions, seasons, memory, waters, tools, working }`, set in a new part placed before `p20-time.js`.
  - `on` is false when the look is Painted (v3), when the page opens with `?look=v3`, or with `?p4=off`.
  - `?p4=-seasons,-waters` turns single features off.
  - At load, `P4S` uses `LOOK0` (p10b), because `view` and `RELIEF` are declared later in the script (temporal dead zone). The Map
    look control updates it at run time.
- **R2. Mock rules only.** The numbers are the record's:
  - seasons table, §2;
  - supply with the owner's two-hop reach, §3 and decision 2;
  - crossing +2 days, roads halve a leg (minimum 2), bridges cut and rebuilt, §4;
  - Working slots `floor(nations / 2) + 1`, §7;
  - regions of 5 to 9, §9.
  They live in `P4_RULES` in the new world part, one place, so the later sim phases and docs/09-balance can lift them.
- **R3. The binding rules win where the record disagrees.**
  - The record's Lean-back "removes … rails", but the owner's rule keeps realm borders' colour-blind contrast in every view. Lean-back
    therefore keeps a thin rail.
  - The record's supply example "60% (5 hops from Kharnath)" was written for a reach of 3. With the owner's reach of 2 it reads
    "60%, 4 hops from Kharnath".
- **R4. Hover always names terrain, in every band including Lean-back.** A region card opens only on a region's name. Hovering land
  still opens the province card with its terrain chip.
- **R5. Clear and the Terrain mode are season-invariant and wash-free.** The docs/09 distinct-colours rule they carry is measured on
  fixed fills. Seasons and washes would break it, since the realm tint alone drops terrain pairs to 13.4 / 4.6 across a border in
  Clear.
- **R6. Public against remembered.**
  - Always current: terrain, ownership (docs/01 §14), rivers, roads, bridges as structures, regions, Workings, and the season.
  - Remembered for an explored province out of sight: settlement, walls, buildings, land look (dominion), scars and event pieces,
    population, unrest, defenders, springs, and a bridge's cut state.
- **R7. Lines never dash unless fog says so** (natural N10). The supply path is a chain of round beads, not a dashed line. The move
  thread keeps its approved dashes.
- **R8. Determinism.**
  - Every new seeded stream is `rngFor('p4:12:<purpose>:<key>')` or the relief tables (`relief:${MAP_SEED}:p4:<purpose>`).
  - No new code calls `Math.random` or `Date`.
  - The rule-bearing data (regions, rivers, roads, fords, leg days, the supply path) uses arithmetic, square roots, floors and table
    noise only. The source scan of §10 checks it.
- **R9. Information stays one gesture away** (war-table §3.7: "Decoration thins by band. Information never does").
  - Merged tokens list every army they hold on hover, and the outliner keeps them all.
  - Muting removes markers from the land only.
- **R10. Build order.** Pass 4 is built on the parts as pass 3 leaves them, because pass 3 is editing the wilds, the line floors, the
  phone and labels now. The new code goes in new parts. Existing parts get short hooks, re-applied to pass 3's versions. Pass 3's
  checks are re-run with `?p4=off` and with pass 4 on.

---

## Measured baseline (the current build)

**Method.**
- The build was snapshotted to `snap/game-screen-v4.html` (md5 `fed36962…`). It is byte-identical to a rebuild of `snap/parts`
  (`snap/rebuilt.html`).
- `tools/measure.cjs` ran it in playwright's headless Chromium 1194 with no GPU (software raster), at 1440 × 900, ratio 1, on 4 cores
  with a load average under 0.5. Local d3 and Pixi were used.
- "Static" is a re-render of the cached layers: the median of 4 runs with the cache dropped. "Flush" adds a forced
  `getImageData`. "Cached" is a pan inside the cache margin (median of 30).
- The Vast probe is §7.1's copy with 236 provinces at the same province size and texel density.

| | Mockup map (60 provinces, bake 2048 × 1280) | Vast probe (236 provinces, bake 4096 × 2346) |
|---|---|---|
| Ready (load to first natural frame) | 11.5 s | 26.6 s |
| Bake CPU, shared rasters | 2.68 s (heightfield 1.18, hillshade 0.50, id 0.30, mode relief 0.25, warp 0.24, weights 0.14, water 0.08) | 5.54 s |
| Bake CPU, natural pass | 6.53 s (materials 2.64, wild texels 1.63, covers 0.88, cover blend 0.55, canvas 0.46) | 17.53 s (materials 7.69, wild texels 2.88, cover blend 2.63, covers 2.07, canvas 1.38) |
| Canvases / CPU rasters / JS heap | 57 / 48 / 125 MB | 114 / 177 / 391 MB |
| Static re-render: least zoom | 89.5 ms (53.7 px a province) | 90.9 ms (29.4 px) |
| Static re-render: Far 58, Far 66 | 69.4, 62.1 ms | 99.3, 105.6 ms |
| Static re-render: start (96 px), Mid 140 | 135.5, 88.2 ms | 155.5, 128.5 ms |
| Static re-render: Near 250, Near 400 | 124.4, 164.5 ms | 114.3, 151.7 ms |
| Static with flush, range | 45 to 153 ms | 78 to 168 ms |
| Cached frame (pan); with flush | 0.4 to 0.6 ms; 1.6 to 2.2 ms | 0.4 to 0.6 ms; 1.5 to 1.8 ms |
| Hover frame | 0.9 to 4.6 ms | 0.8 to 11.5 ms |
| Faint lines drawn at Far | 104 edges | 551 edges |

Sources: `out/measure-60.json`, `out/measure-vast.json`, and the `.log` files beside them. A first run of the mockup's map gave a
ready time of 10.6 s and 7.5 s of bake CPU. The runs agree within the machine's noise.

---

## 1. The zoom bands, with what each band removes

### 1.1 The bands

The bands stay docs/07's, measured by the median province's on-screen diameter (D px). A new band is added below Far.

| Band | D px | Which existing zoom becomes it | What it shows | What it removes (against the next band in) |
|---|---|---|---|---|
| **Lean back** (new) | under 44 (fades in from 48 to 40) | The least zooms of large maps: the Vast probe from 29.4 px (its least zoom) up to 44 px (its Fit is 48.0 px). The phone's Fit, which is also its least zoom: 26.6 px on the mockup's map at 390 × 844. The mockup's map leaned fully back at 1024 × 768 (36.7 px). At 1280 × 720 (47.2 px) the fade has only just begun, and at 1366 × 768 (50.7 px) and 1440 × 900 (53.7 px) the least zoom stays Far. Measured with `proto/info2.js`. | The model on the oak with pass 2's sculpted relief; terrain as broad masses from the quarter-resolution overview; lakes and rivers. Realms as washes, with a thin rail. Capitals (keep and name), Wellsprings (icon), Workings (landmark glyph). One army token per region per nation, with a count. Region names, wild contours, pins, the planned path and its chips, transit arrows. The hovered province's tint, floor lines and card. | Cover detail (crowns, field strips, hedgerows, specks). Streams and ponds. Roads and bridges (roads return in Supply mode). Faint province lines and the glow (the wash replaces the glow). Every town but capitals. Per-province army pieces and their status glyphs: one glyph moves to the region token, by exception. Province names other than capitals; Wellspring and wild names (their cards name them). Event pieces (folded into the token's glyph). Number chips per province: the numbers layer shows one per region instead (§1.5). |
| **Far** | 44 to 70 | Pass 2's Far: the mockup map's least zoom at 1366 × 768 and 1440 × 900 (50.7 and 53.7 px), and its Fit at 1366 × 768 and smaller windows (55 to 63 px). | Today's Far: the sculpted model, the natural land at mip 2, towns (step 4 or more, walled, built or capital) as simplified pieces, one army piece per nation per province, the names of capitals, Wellsprings and wilds, faint lines with the floor on hover and selection, rails and glow. New: region names, rivers and bridge ticks, the Working's landmark. | Hamlets (already gone below 220 px). Internal keylines, which are hairlines at Far, as today. Roads (Supply mode only). Full covers: the land is mip 2, so fields read as tone and canopy as masses. |
| **Mid** | 70 to 180 | The start view (96 px), and Fit at 1440 × 900 (84.8 px). | Unchanged, plus the season, rivers, roads, bridges, and fords on the path. | Against Near: hamlets, guards, spring stones, every name, the Near detail. Region names fade out between 70 and 85 px. |
| **Near** | over 180 | Unchanged | Everything, as today | — |

**Thresholds** (one object, `RL_P4.lean = { dpx0: 48, dpx1: 40, label: 44 }`, a docs/09-balance row):
- `rlLeanK()` is `smoothstep(48 → 40)` of D px, gated on `P4S.lean` and the relief look.
- `bandOf` is **not changed**. It still returns `'far'` at Lean-back, so Painted (v3) and every existing Far branch keep working.
- The zoom chip and `RAW.zoom` read `rlBandName()`, which is `'lean'` once `rlLeanK() ≥ 0.5`. The chip's tooltip gains: "Lean back:
  the whole campaign at a glance: realms as washes, capitals, Wellsprings, Workings, armies by region, region names. Point at a
  region's name for its provinces."
- The hamlet (220), guard (300) and all-names (320 px) thresholds are unchanged.
- The fade is zoom-driven: between 48 and 40 px both passes draw, at `1 − k` and `k`, so names and pieces cross-fade instead of
  popping, as pass 2's Far relief ramps from 85 to 58 px. There is no hysteresis, because the fade is continuous.

**Every mode works at every zoom** (docs/07). At Lean-back:
- Data modes draw their opaque raster at overview resolution, without washes.
- Contextual modes hatch and outline as now.
- The Terrain mode shows the Clear overview without washes.

### 1.2 Realm borders at Lean-back: washes and the thin rail

- **The wash.**
  - Each owned province's polygon is drawn at overview resolution in its banner at **0.28**, source-over, with a soft 1-texel edge.
  - It appears only in Natural and in Ownership mode. There is none in Clear, the Terrain mode or the data modes (R5).
  - It is made once per ownership or fog signature: 1.0 ms on the mockup's map and 1.9 ms on the probe (`out/leanbench-*.json`).
- **Why 0.28.**
  - The rail's band rule was measured on grounds that include the banner glow at its 0.35 peak (natural §8.1: 0 fails), so a wash
    under 0.35 stays inside the measured grounds.
  - 0.28 leaves a margin and keeps 72% of pass 2's Far relief swing (lit 22, shade 34 L\*).
- **The wash does not carry the colour-blind rule.** Two banners at 28% over the same ground differ by 28% of their own ΔE, which
  under a deficiency is far under 12. The rail carries it, as in every other band.
- **The thin rail.**
  - Below ratio 1.5 it is a dark keyline of 1 px, a banner of 2 px and a light keyline of 1 px (1 + 1.5 + 1 CSS px at ratio 2).
  - It is inset on the owner's side, on realm edges only, through `rlDrawRails(g, band, px, { only: i, thin: true })`.
  - This is natural §8.1's "keylines at 0.75, banner solid" model (0 fails). A 1 px keyline at 45° covers about 0.7 of a pixel, so
    the rendered-pixel check decides.
  - **Fallback:** the full lit bead, 1.5 + 2 + 1.5 px (the prototype drew that bead and measured 8.4 ms in all).
- **The glow is off at Lean-back,** because the wash replaces it. The hover and selection tints and the floor lines on hover and
  selection are unchanged in every band, as the owner's line rule asks.
- **Owner question Q1** (§12) asks whether realms should become washes at Lean-back. Natural ruling N7 and the owner's answer name
  "rails and glow", and the 8% realm tint is an option that is off by default.

### 1.3 Pass 2's sculpted Far relief

The overview raster is what Far already draws. The measured mip level at 53.7 to 66 px is 2, the quarter mip. On top of it the
overview composites:
- pass 2's Far relief at full strength (`farRelief` weight 1 at 58 px and below, `fogK` on unexplored land as now);
- the lakes;
- the fog of each province's visibility state (the Natural values 6% haze plus 40% and 25% desaturation, or Clear's 4% and 10%);
- the season (§3).

Lean-back is therefore pass 2's sculpted terrain model, seen without the pieces and with washes. The cliff face, lip, plinth, plaque,
table and room are drawn from their cached bakes, as now. The washes leave 72% of the relief's light and shade, so the model still
reads as sculpted. This matches the owner's description of the zoomed-out reference: "a terrain model with cliff edges … the owner's
tint and thin borders still show which land is whose".

### 1.4 Merged army tokens

- **One token per region per nation in sight.**
  - The count is the number of armies (commanders leading troops) the viewer sees there.
  - Non-army commanders (mages, priests, scouts, the pretender) do not add to the count. They appear on hover, and the token wears
    the crown when the pretender is among them.
  - The token is the piece's round base with the banner rim, the lead commander's figure at 0.8 scale, and a count plate.
  - Its status glyph is at most one, by exception, in docs/07's priority order: starving, tight supply (half wheat), unpaid,
    besieging, casting, pillaging.
- **Position.**
  - The mean of the member provinces' centroids, snapped to the nearest free spot inside the region.
  - It keeps clear of the region name and capital boxes, using the slot search `rlLayout` uses for armies.
  - The viewer's token goes first; another nation's token takes the next free spot.
- **Hover** opens a card listing every army and commander in that region (24 px portrait, name, troops, order, province link).
  **Click** selects the viewer's lead army and shows the strip. **Double-click** fits the region.
- **On the mockup's map at the phone Fit (M3):**
  - The Broad Plain shows a Cinder token "1" for Varo, wearing the crown because the Titan is at Kharnath. Seren and Ondra are in
    its card.
  - The Elderholt holds Thornwood's token "1" for Ilsa at Tormere, and a Cinder token with no count plate for Kesh, the scout at
    Oakmoor.
- **Owner question Q4** (§12): merging armies per region at Lean-back thins exact positions, against war-table §3.7's rule.

### 1.5 Parts and functions

- **New `p64b-leanback.js`** (about 260 lines):
  - `RL_P4.lean`, `rlLeanK()`, `rlBandName()`.
  - `rlOverview()`: a canvas at the quarter mip's size, from the shown look's season variant (`rlLkFor`, §3) plus the Far raster
    (`rlFarRaster`), lakes and fog. It is keyed by look, season, `RB.ver`, `RB.lookVer` and the fog signature.
  - `rlWashCanvas()`.
  - `rlLeanStatic(gU, gO, now, k)`: room, table and rim through the existing cached bakes; then overview, wash, thin rails,
    `rlDrawWildContours`, `rlDrawLip`, rivers (§5), capitals (keep glyph and bold 12 px name), Wellspring icons, Working glyphs,
    tokens, region names (§2) and pins.
  - `rlLeanLayout()`: tokens, capital names and boxes, kept in `RL_PIECE_CACHE.get('LEAN')`.
  - `rlPlaceLeanTokens()`: DOM tokens through `rlDrawPiece` with a new kind `'region'`.
  - `rlLeanNumbers()`: one chip per region. Ownership shows provinces held ("5/8"), Population and Supply show sums, Unrest shows the
    maximum, Dominion shows counts by holder, Springs shows symbols, Terrain shows the most common terrain.
- **Hooks:**
  - **p59 `rlRenderStatic`**, at its top: `const k = rlLeanK(); if (k >= 1) { rlLeanStatic(gU, gO, now, 1); return; }`. At its end:
    `if (k > 0) rlLeanStatic(gU, gO, now, k);` (2 lines). `rlStaticSig` gains `rlLeanK().toFixed(1)` and the `P4S` flags (1 line).
  - **p62:** `rlDrawPieces` takes the alpha `1 − rlLeanK()`, and `rlPlacePieces` hands over to `rlPlaceLeanTokens` when `k ≥ 0.5`
    (2 lines).
  - **p60-draw `updateZoomChip`** reads `rlBandName()` (1 line). **p80d `renderModes`** extends the `RAW.zoom` text (1 line).
  - p61's `rlLayout` is not called when `k ≥ 1`.

### 1.6 Checks (`window.__mock.p4LeanBack()`, at the probe's least zoom, the mockup's phone Fit and its 1024 × 768 least zoom)

1. **Gone:** no province name but capitals' (`lay.labels`); no town but capitals; no faint line, hairline or internal keyline drawn
   (`RL_LINES.drawn` is empty); no per-province DOM piece (the `.mini` count equals the token count).
2. **Rails:** `rlRailCheck()` on rendered pixels with the wash on gives 0 fails. Every wash alpha is ≤ 0.35.
3. **Tokens:** one per region per nation in sight. Every visible army sits in exactly one token, and the count equals the region's
   armies.
4. **Names:** no overlap among region names, capital names, tokens, path chips and pins. Every name is on the model and inside the
   view band.
5. **Hover:** hovering a province returns `provTip` with its terrain chip; hovering a region name returns the region card.
6. **Cost:** `staticMs ≤ 12` on the probe at 1440 × 900, and a cached frame ≤ 2 ms with a flush.
7. **Fade:** the lean weight is 0, 0.5 and 1 at 48, 44 and 40 px, and both passes draw between.
8. **Clear and the Terrain mode:** no wash pixels, against a wash-off render.
9. **Pass 3 on the phone:** pass 3's phone checks still pass at Fit with Lean-back on (names on the model, chips on the model, no
   overlap).

### 1.7 What stays untouched, and the cost

- **Untouched:**
  - `bandOf`, and everything drawn above 48 px. With only `P4S.lean` on, canvas hashes at 53.7, 96, 140 and 250 px equal `?p4=off`.
  - Painted (v3).
  - The rails, the glow and the lines of Far, Mid and Near.
- **Cost:**
  - **Measured prototype** (`proto/leanbench.js`, which draws table and rim, the quarter mip, the wash, rails on owned provinces,
    wild contours and about one name per region): **5.7 ms against 54.3 ms** for today's static re-render at the mockup map's least
    zoom, and **8.4 ms against 98.5 ms** on the Vast probe at 29.4 px.
  - Re-making the overview on a fog or season change: about 10 to 30 ms (an estimate for one composite at 512 × 320 or 1024 × 587).
  - Code: about 260 new lines and 8 hook lines.

---

## 2. Named regions on the land

### 2.1 The regions (data)

This is the reference implementation, `proto/p4world.js`, run inside the mockup's closure by `tools/run-proto.cjs`. Nothing on the
page changes.

- **K = round(n / 7) regions.**
  - Seeds by farthest-point sampling over the province graph, from the viewer's capital.
  - Balanced growth: the smallest live region claims its cheapest unassigned neighbour. The cost is 1 if the terrain differs from
    the seed's, plus 0.35 × hops from its seed, ties broken by index.
  - Leftovers join a neighbour.
- **Repair.**
  - A region under 5 merges into its smallest neighbour if the sum stays ≤ 9. Otherwise it takes boundary provinces from donors over
    5, keeping each donor connected.
  - **New in the build:** a region over 9 splits along its long axis into two connected halves of ≥ 5. The probe left two regions of
    12 without this step.
- **Names.**
  - The region's most common terrain picks v3's `REGION_SYL` syllables. The lists are reused, not changed.
  - Names are unique against province names, wild names and v3's region names.
  - No two regions share a prefix. The first run made "The Mosswold" and "The Mossweald".
  - For large maps the prefix pool grows with the province syllables A (Ash, Cin, Kar …) before terrain suffixes, in the record's
    "Ashfall Downs" pattern. The probe fell back to "The X March" ten times with v3's lists alone.
- **Determinism:** `rngFor('region4:12:' + minId)`; no trig; regions are map data and never depend on ownership. The holder is live.

**The mockup's map** (prototype output, `out/proto-world-snap.json`; 4.4 ms at load):

| Region | Provinces | Terrain | Held mostly by | Members |
|---|---|---|---|---|
| The Broad Plain | 8 | plains | Cinder Horde (5 of 8) | Kharnath, Redholt, Briardale, Torbarrow, Stagmarch, Ashfen, Brambarrow, Briarmarch |
| The Wind Knolls | 6 | hills | independents (4) | Oakford, Briarstead, Wyrford, Bramreach, Rookmere, Cinford |
| The Sedge Fens | 9 | swamp | independents (9) | Lanbrook, Rookbarrow, Sundale, Oakmarch, Thornbrook, Marholt, Ashmoor, Gallreach, Lanstead |
| The Lark Leas | 8 | plains | independents (6) | Thornwick, Rookford, Wyrmere, Thornreach, Coldbrook, Rookmarch, Redcrag, Brammere |
| The Long Downs | 8 | hills | independents (6) | Halegate, Ashvale, Karwick, Morholt, Sunmere, Halevale, Karreach, Wyrholt |
| The Mosswold | 6 | forest | independents (6) | Cinfen, Redwick, Duskholt, Morgate, Redbarrow, Elmwick |
| The Elderholt | 8 | forest | independents (6) | Stagmoor, Tormere, Oakmoor, Ashstead, Briarmoor, Coldmere, Fenvale, Karford |
| The Gold Leas | 7 | plains | Thornwood (4 of 7) | Elmgate, Elmcrag, Ashdale, Wyrmarch, Deepmoss, Halebrook, Wyrfen |

All eight are connected, with sizes 6 to 9. On the Vast probe the rule gives 31 regions of 5 to 12 (`out/proto-world-vast.json`,
10.5 ms), which the split step brings to 5 to 9.

### 2.2 Drawing: hand-lettered along the long axis

- **The spine.**
  - The region's principal axis (the PCA of its cells, as v3's `buildRegions` computes it).
  - The member centroids are ordered along it, smoothed (Chaikin, 2 passes), and extended 0.3 D past the end members.
  - The name is centred on the spine's arc midpoint.
  - If the name is longer than 0.85 of the spine, the font steps down to its floor. Failing that, the next spine is tried (up to 5,
    as v3's `regionSpines` does). Failing that, there is no name; the card and search still find the region.
- **Lettering.**
  - Glyphs are laid out by p57's `layoutOnPath` and painted by `paintGlyphs`, reused read-only: p57 is not edited.
  - Font: Marcellus SC, already loaded. Letter-spacing 0.28 em. Size 15 to 18 px at Lean-back and 12.5 to 14 px at Far, by the
    region's extent.
  - Fill #E9E4D8 at 0.92, with a halo of rgba(20,18,15,.5) at 3 px.
  - Each glyph gets a seeded turn of ±1.2° and a baseline offset of ±0.6 px (`rngFor('region4:glyph:' + key)`), which is the
    hand-lettered feel. It is cached per zoom bucket, so nothing moves between frames.
  - This is the relief map's approved light lettering, in its own display face: province names use Alegreya Sans, and wild names use
    italic Alegreya Sans, letter-spaced. The record's "parchment label style" was v3's ink on paper, which the owner superseded for
    the land.
- **Order: never over a province label.**
  - At Far, names are placed after every province name, wild name, piece, path chip and pin. At Lean-back, they are placed after
    capitals, tokens, pins and chips.
  - A glyph box that touches any of these moves the name to the next spot.
  - Names stay inside the model, inside the view band, and off the mode column and the alerts ribbon, using `rlControlsLay` and
    `rlRibbonLay`.
- **Fade:** full at Lean-back and up to 70 px, gone by 85 px. The start view (96 px) shows none, so it keeps today's names.
- **Modes and fog:** region names show in every mode (they are labels) and in every fog state (regions are map data).

### 2.3 Hover and card

Pointing at a region's name (its glyph boxes plus 3 px) at Far or Lean-back:
- **At once:**
  - The name brightens to #F4EEDF.
  - The region's provinces take a light tint at half the hover tint's strength (0.12).
  - The region's outer outline draws at the faint lines' floor (2.3:1, solved like the hover floor lines). This adds no new line
    grammar.
- **After 500 ms, the region card:**
  - Title "The Broad Plain"; value "Region · 8 provinces"; meaning "Held mostly by the Cinder Horde (5 of 8)."
  - Rows: every member province as a link, with its terrain glyph and owner mark (all of them: never more than 9).
  - "Armies seen here: Varo, Ash Chieftain (48)."
  - Foot: "Click to fit the region · / to search".
- **Click** fits the region (`animateCam` to its box, never past Mid). **Tap** opens the card on touch.
- **The province card** names its region, dim, on the name line, as map-relief §7 already asked: "Ashfen · [swamp] · the Broad
  Plain".

### 2.4 Parts, checks, untouched, cost

- **Parts:**
  - The data lives in `p13-p4-world.js` (§9): `rlRegions4()`, `regionOf4[i]`, `regionHolder(r)`.
  - **New `p64a-regions.js`** (about 200 lines): `rlRegionLayout(band, lay)` (spines, glyphs, boxes), `rlPaintRegions(g)`,
    `rlRegionAt(sx, sy)`, `rlRegionHover(g)`, `regionTip(r)`, and the fade.
- **Hooks:**
  - p59 `rlRenderStatic`: `rlPaintRegions(gO, band, lay)` after `rlPaintLabels` (1 line).
  - p59 `rlDraw`: `rlRegionHover(g)` after the province tints (1 line).
  - p80d `mousemove`: `rlRegionAt` before `provinceAt` sets `hoverRegion` and the 500 ms tip (3 lines).
  - p80a `resolveTip`: the `'region:'` key (1 line).
  - p30b `provTip`: the region on the name line (1 line).
- **Checks (`p4Regions()`):**
  - Every province sits in exactly one region; sizes 5 to 9; each region connected.
  - Names unique, with distinct prefixes. Rebuilding twice gives the same regions.
  - At 29, 40, 54 and 66 px on both maps: 0 glyph boxes over province names, wild names, pieces, chips or pins; every name on the
    model and in the view band.
  - At 85 px and above, none drawn.
  - The card lists every member and the holder. The fade weight is monotonic.
- **Untouched:** v3's regions, `REGION_SYL`, p57, Painted (v3), and the start view.
- **Cost:** build 4.4 ms (60) and 10.5 ms (Vast) at load. Layout per zoom bucket is about 2 to 5 ms (an estimate: 8 to 34 names × at
  most 5 spines × `layoutOnPath`). Paint ≤ 1 ms.

---

## 3. Seasons on the land, driven by the clock and the time-lapse

### 3.1 The clock and the data

- **Months:** 1 to 3 are spring, 4 to 6 summer, 7 to 9 autumn, 10 to 12 winter (the record).
- **The time-lapse** (M3 to M70) passes six winters: M10–12, M22–24, M34–36, M46–48, M58–60 and M70.
- **The record's factors** live in `P4_RULES.seasons`:

| Rate | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|
| Supply | +10% | 0 | +20% | −30% |
| Population growth | +0.1% | 0 | 0 | −0.1% |
| Move days | 0 | 0 | 0 | +2 on Hills, Mountains and Forest; +1 elsewhere |
| Materials | 0 | +10% | 0 | −10% |
| Unrest decay | 0 | 0 | 0 | −1 |

- **The clock** reads `Y1 Spring M3 D14`, the record's format, after a season glyph: four new icons in p10a (bud, sun, wheat sheaf,
  snowflake). The phone shows the glyph and `Y1 M3 D14`.
- **The clock tooltip** gives the season's factors and the next change: "Spring: supply +10%, growth +0.1%. Summer in 1 month."
- **The time-lapse label** reads `Y1 Spring M3`.
- **The move preview** in winter adds the season's days through `legDays` (§5.2). The final chip shows the total, and the projection
  adds "winter +4 days".
- **The Supply mode's values** take the factor: `fillFor` multiplies by it, and so does the numbers layer. The legend adds
  "Winter: −30%."

### 3.2 What the land shows (Natural only)

| Season | On the land (cover classes of `RB.nat`) | Limits |
|---|---|---|
| Spring (M1–3; the start, M3) | Field parcels: ripe and straw tones become green crop or ploughed. Grass +0.006 OKLCH C. Pale blossom specks on copses at Near only (≤ 1% of copse texels, integer-hashed). | Core mean ΔE00 against summer ≤ 6 |
| Summer (M4–6) | **Today's natural bake, pixel for pixel.** | — |
| Autumn (M7–9) | Fields: green crop becomes ripe gold, and ripe becomes straw stubble (+3 L\*). 10% of deciduous crowns warm toward russet (#6B4A26 at 0.25). Grass toward dry grass (#766E38 at 0.3). | ≤ 6; farmland ≤ 9 |
| Winter (M10–12) | **Frost #929DA6** (L\* 64, a\* −2, b\* −6) on Hills and Mountains, where the half-resolution hillshade faces away from the light (fS < −0.1) and on the upper third of each province's heights, at alpha up to 0.55. Coverage is capped at 35% of a Mountains province and 20% of a Hills province. Deciduous canopy lifts toward bark grey-brown (#5C5448 at 0.18); conifers stay. Fields go toward ploughed and fallow (0.35). Grass dulls (−30% chroma, +2 L\*). Swamp reeds go toward straw. Water is unchanged (ice would read as a mere or as land), and so is wasteland. | ≤ 6; Hills and Mountains ≤ 8; farmland ≤ 8 |

- **Snow still means impassable.**
  - The wilds never change; they keep the map's only white snow (#F2EEE6).
  - The frost colour is 23.2 from the wild snow under normal vision and 22.4 under the worst simulated deficiency (computed here with
    CIEDE2000 and the page's Machado matrices).
  - Every passable pixel must stay ≥ 20 / 12 from the snow in every season: `reliefSnow()` runs in each.
  - Frost L\* is capped at 64. Today's brightest passable rock is 58.3 (natural §10 defect 2).
  - **Owner question Q2** (§12): frost on passable land touches the approved "snow means impassable" cue.
- **Calm:**
  - Every pixel stays ≤ OKLCH C 0.10 in every season.
  - The core mean shifts stay within the limits above.
  - The natural lightness-only readers keep ≥ 0.95 province accuracy and ≥ 0.90 patch accuracy at Mid in every season, trained on
    that season.
  - A reader trained on summer and tested on each season keeps ≥ 0.90 by province, so the key the player learned survives the
    season.
- **By band:**
  - Lean-back and Far: the season reads as tone in the overview (frosted crests, gold fields, bare grey woods).
  - Mid: frost on the north faces and crests, strips in new tones, bare canopy.
  - Near: the same, with the Near detail's crown strength × 0.6 in winter.
- **The Greening (§6.4):** from M40, provinces under Thornwood's dominion draw the spring variant in every season.
- **Transitions:**
  - At a season's first month (M1, M4, M7, M10) the land cross-fades over 600 ms, the monthly look change. It is instant under
    reduced motion.
  - The next season's variant is made in idle slices during the last month of the current one.
  - If the time-lapse jumps into a season not yet made, the shown one stays, with "Preparing winter…" in the mode legend's status
    line, as "Preparing terrain colours…" does for the Terrain mode.
- **Never seasonal:**
  - Clear and the Terrain mode (R5).
  - The data modes' colours; only the Supply values change.
  - Painted (v3). The wilds.
  - A mockup control, "Season: Clock | Spring | Summer | Autumn | Winter", forces one season for review.

### 3.3 How a variant is made (mockup)

- **Per texel,** from three sources:
  - the natural bake's unwashed image (`Lk.img`);
  - the cover classes `RB.nat.cls` (0 to 6: the blend's terrain; 1: a field, with `ftone` 1 to 8; 2: canopy; 9: a copse; 10: a
    hedge tree) and `cmar`;
  - the half-resolution hillshade `RB.fS` and heights `RB.hh`.
- **The formula:** `out = base + (target − base) · a`, an sRGB lerp with per-class targets and alphas, then two mips by canvas
  downscale. Speckles and the 10% russet crowns use p58n's integer hash `rlH2`, so no transcendental call is involved.
- **Storage:** `RB.S[season] = { img, canvas, mip1, mb1, mip2, mb2, washKeys, ready }`, the same shape as a look.
  - `rlLkFor(look)` returns the variant when the look is Natural and the season is not summer.
  - `blitLook`, `rlWashSync`, the line solver's ground sampler `rlGroundSides` and the seat ground `rlHouseGround` all read through
    it.
  - Hairline and faint alphas are therefore solved on winter ground. `rlLineCtx`'s key gains the season.
- **Memory:** two variants are kept, the shown one and the next. The others are freed.

### 3.4 Parts, checks, untouched, cost

- **Parts:** **new `p58s-seasons.js`** (about 180 lines) holds:
  - `RL_SEASON`, the targets, alphas and limits as docs/09-balance rows;
  - `rlSeasonOf(M)`, and the generator `rlSeasonGen(season)`, time-sliced through `rlRunGen`;
  - `rlLkFor(look)` and `rlEnsureSeason(M)`;
  - `rlSeasonClip(g, lvl)`, the Greening composite: the spring variant clipped to the caster's dominion.
- **Hooks:**
  - p59: `blitLook` and `rlWashSync` use `rlLkFor` (2 lines).
  - p59b: `rlGroundSides` uses `rlLkFor`, and `rlLineCtx` gains the season in its key (2 lines).
  - p61: `rlHouseGround` uses `rlLkFor` (1 line). p59c: `rlNearDetail`'s crown strength (1 line).
  - p80d: `updateTop` and `setMonth` print the date with the season and call `rlEnsureSeason` (3 lines).
  - p60b: `fillFor('supply')` takes the factor, and `MODES[2]` its legend (2 lines).
  - p10a: four glyphs.
- **Checks (`p4Seasons()`):** for each forced season:
  - The variant is built; 0 pixels over C 0.10; frost L\* ≤ 64.5; `reliefSnow()` passes.
  - Core shifts are within the limits; frost coverage is within 35% and 20%.
  - The readers pass, both trained on the season and trained on summer.
  - Clear and Terrain-mode canvas hashes are identical across all four seasons.
  - The summer variant equals the natural bake (hash), and Seasons off equals `?p4=off`.
  - The clock text matches `^Y\d+ (Spring|Summer|Autumn|Winter) M\d+ D\d+$`.
  - One 600 ms fade at M4, then the frame is still.
  - The Supply raster changes by the factor and nothing else.
- **Untouched:** Painted (v3), Clear, the Terrain mode, the data-mode colours, the natural bake (summer is the bake), and the wilds.
- **Cost (measured,** `proto/seasonbench.js`, a winter-like timing probe): **83 ms** on the mockup's map and **255 ms** on the probe,
  for the texel pass and mips. Add one wash composite (75 and 167 ms measured for a full wash) and the line re-solve on first draw.
  Memory per variant is 13.1 MB (60) or 48.1 MB (Vast) with mips; two are kept. In the game a season is a uniform in the material
  shader: no extra bake.

---

## 4. Fog as memory

### 4.1 What the mockup does now

| State | Today |
|---|---|
| Unexplored | Natural terrain under 6% haze plus 40% desaturation (Clear: 4%). One gesso hut at the seat. The current owner's rail and glow. Dotted lines. Card: "Unexplored: the land is known; what lives here is not." |
| Explored, out of sight | 25% desaturation (Clear: 10%). Dotted lines. The settlement, walls, land look and **every value in its current state**: map-relief §9.1 says "the sim keeps no last-seen copy". Card row: "Seen: earlier; out of sight now", with today's numbers. |

Two provinces are out of sight on the mockup's map: Deepmoss and Redcrag. Deepmoss comes into sight at M60, when Dravik besieges it.

### 4.2 Pass 4

- **The snapshot.** An explored province keeps what the viewer saw when it was last in sight:
  - settlement step, walls (PD) and buildings;
  - the land look (dominion holder and strength: the wash, motifs and pole);
  - scars and event pieces;
  - population, unrest, defenders and springs.
- **Out of sight it is drawn from that snapshot.** The pieces and land look are those of the date, with the approved quiet difference
  (25% desaturation in Natural, 10% in Clear, dotted lines). Its pieces get no live animation. Nothing else is added. Public things
  stay current (R6): the owner's rails and wash, terrain, water, roads, regions, Workings and the season.
- **The card.**
  - The title line is unchanged. Under it, a dim line reads "Out of sight · as of Y1 M3", the record's "as of Y2 M4".
  - Every remembered value is the snapshot's.
  - The "Seen" row goes, so the date is said once. The province panel's heading carries the same "as of" chip.
- **Armies are not remembered on the map:** no ghost pieces. The card adds "Last seen here: Ilsa Oakhand, 52 troops, Y1 M3" when an
  army was seen there. **Owner question Q3** (§12).
- **Unexplored land is unchanged.**
  - The record's "only unexplored land is unpainted parchment" is the v3 cloth's wording.
  - On the relief, the approved reading of "not yet painted" is the haze over public terrain (map-relief §9.1, natural §8.3). It
    shows what Dominions' players asked for ("fog shows nothing of what was explored"), because explored land now keeps its look.
- **The mock.**
  - Deepmoss and Redcrag were both last seen at Y1 M3 (the BASE state, `deriveMonth(3)`).
  - As the time-lapse runs they keep their M3 look while their real state moves on: Deepmoss's dominion strength rises every 6
    months, its population grows, and its walls rise.
  - At M60 Dravik's siege brings Deepmoss into sight. Its land cross-fades to its current look with the monthly fade, and the card's
    "as of" line goes.
  - That is the demonstration: drag the time-lapse past M60.
- **By band:**
  - Lean-back: the wash (public) is current, the capital's keep is remembered, and tokens show only armies in sight.
  - Far, Mid and Near: settlements, walls, motifs and scars come from the snapshot.
  - Data modes show the remembered values. This is one projection, the card's (docs/07: "Map art and portraits use the same view of
    a province as its tooltip").

### 4.3 Parts, checks, untouched, cost

- **Parts:** **new `p66-memory.js`** (about 120 lines):
  - `RL_MEM = { seenAt, snap }`.
  - `rlMemCapture(M)`: in sight, take a snapshot; out of sight, keep the old one.
  - `rlMemApply()`: copy the hidden fields from the snapshot into `prov[i]` for provinces out of sight, keeping `owner`. `KEYS` and
    the look keys then follow through the existing `refreshKeys`.
- **Hooks:**
  - The new part re-binds `deriveMonth`, a function declaration in p20, so p20 is not edited:
    `const dm0 = deriveMonth; deriveMonth = (M) => { dm0(M); if (P4S.memory) { rlMemCapture(M); rlMemApply(); } };`.
  - p30b `provTip`: the "as of" line replaces the "Seen" row (2 lines).
  - p80c `renderProvince`: the heading chip (1 line).
- **Checks (`p4Memory()`):**
  - At M3, M30 and M59, every out-of-sight province's look key equals its snapshot's, not the live one. Its card says "as of Y1 M3".
  - **The fog guard:** changing its live hidden state and re-rendering leaves the canvas hash in its box unchanged.
  - At M60 Deepmoss's key equals the live key, and the line is gone.
  - Unexplored provinces are hash-identical, in their boxes, to `?p4=off`.
  - No army piece is drawn in a province out of sight.
- **Untouched:** the unexplored look, the fog values, the dotted lines, Painted (v3), and the data-mode colours.
- **Cost:** under 1 ms a month for the snapshot. No new raster. One re-render on a reveal.

---

## 5. Rivers, roads, fords and bridges as rules; the Supply path

### 5.1 The data (mock, in `p13-p4-world.js`; reference `proto/p4world.js`)

- **Rivers run along province borders.**
  - **The corner graph:** province/province edges only; wild edges are excluded.
  - **Corner height:** the mean of its cells' elevations (Mountains 5, Hills 4, Forest 3, Plains, Farmland and Wasteland 2, Swamp 1,
    Peaks 6, Mere 0), plus 0.08 × the map's `noise`.
  - **Sources:** corners at the foot of a peaks wild or of a Mountains province.
  - **Trace:** step to the lowest neighbour while heights fall, then toward the nearest model edge.
  - **Length:** at least 4 edges; a tributary that joins another river needs at least 3.
  - **Count:** `round(2n / 60)`, from 2 to 4.
  - **Names:** syllables plus water nouns ("the Reedflow"), unique.
  - Rivers are edge properties. They never cut the graph, and the wilds' no-cut-vertex rule is untouched.
- **Fords:** one per river edge, at a seeded 0.35 to 0.65 along it.
- **Roads (the record §4: "each capital and each fort province connects to its catchment").**
  - The catchment is every province within 2 hops, the owner's reach.
  - It is joined by the fort's shortest-path tree over the fort's own land. Among equal parents the generator prefers one that does
    not cross a river, which gives fewer bridges and changes no rule.
  - Roads are map data: a capture does not move them.
- **Bridges** stand where a road crosses a river. A cut bridge is mock state by month.

**On the mockup's map** (prototype, `out/proto-world-snap.json`):
- **The Reedflow:** 10 edges, from the Ashspine's foot between Stagmoor and Tormere to the west edge, through the Cinder heartland.
- **Roads:** 15 edges, from Kharnath and Deepmoss.
- **Bridges:** 4 over the Reedflow (Redholt/Kharnath, Morholt/Briardale, Sunmere/Briardale, Briardale/Ashfen). If the tie-break
  above leaves the start view busy, it lowers that count.
- **A cut bridge:** Briardale/Ashfen is cut from M31, since Thornwood holds Ashfen from M30.
- **A second river.** This small map yields one river of ≥ 4 edges. An earlier run of the rule found two rivers of 3 edges, so the
  build accepts a 3-edge tributary as the second river.
- **The Vast probe:** 4 rivers of 14 to 26 edges, 36 road edges and 7 bridges.

### 5.2 Leg days (mock rule)

`legDays(v, w)` is built in this order:
1. Start from `DAYS[terrain of w]`.
2. Halve it on a road: `max(2, ceil(d / 2))`.
3. Add 2 if the edge carries a river and no intact bridge.
4. Add the season's winter days (§3.1).

- **Hook:** p20 `pathTo` uses `legDays` (1 line). With `P4S.waters` off it returns `DAYS`, so Painted (v3) and `?p4=off` are
  unchanged.
- **Effect at M3:** of the 17 provinces Varo can reach, 4 are reached across the Reedflow where no bridge stands, and pay +2 days.
  Where Kharnath's roads cross the river, bridges carry them at no cost, until the Briardale/Ashfen bridge is cut.

### 5.3 What the player sees, by band

- **Rivers.**
  - A water line along the border, 3 to 4.5 mapgen units wide (about 3.2 to 4.8 px at the start view), widening downstream.
  - Colour: the natural water #14615B (Clear: #50AF9B). The shore band is 3 L\* darker, with the streams' lit bank highlight.
  - A gentle meander keeps within ±1.5 units of the border, so the border stays the river's centre line.
  - A mouth on the south edge falls down the cliff through the existing falls code.
  - Lean-back and Far: a 1 to 1.5 px line with no bank. Mid and Near: full.
- **On a river edge** the faint line, the hairline, the internal keyline and the hover floor line are not drawn: the river is the
  border. On a realm edge, the rails stay on both sides, over the river's banks.
- **Roads.**
  - Mid and Near only, plus Supply mode at every band.
  - A dusty track: #B6A27C at 0.55, 1.2 px at Mid and 2 px at Near, with a 0.5 px darker edge at Near.
  - It runs seat → the edge's ford or bridge point → seat, smoothed, clipped off seats, names and pieces.
  - Hidden at Far and Lean-back, as detail.
- **Bridges.**
  - Mid and Near: a stone span about 6 × 3 units across the river at the road's crossing, with a lit top and dark ends.
  - Far: a 3 px light tick. Lean-back: hidden.
  - **A cut bridge** draws as two stubs with a 2-unit gap and two rubble dots. At Far it is a broken tick.
- **The move preview** (p63's thread):
  - A leg that crosses a river bends through its ford point, or through the bridge.
  - A crossing without a bridge gets a chip, **"+2 days, crossing"**, placed by the day-chip machinery (`chipOf` spots, then
    `rlChipRing`). It is pushed to `RL_CHIPS`, so live names keep off it.
  - The waypoint chips include the +2. A road leg is drawn along the road.
  - The projection reads "Right-click: Varo marches here in 10 days (+2 crossing the Reedflow)", and the order's toast says the same.
- **Hover.**
  - A river: a small card like a wild's. "The Reedflow · river." Meaning: "Crossing it costs 2 days unless a bridge stands. A
    defender gets +1 def against an army that crossed it." Rows: its bridges as links, with their state.
  - A bridge: "Bridge over the Reedflow · Briardale–Ashfen · no crossing cost", or, once cut: "Cut Y3 M7 by Thornwood: crossing +2
    days until rebuilt".
- **Looks and modes.**
  - Rivers, roads and bridges are drawn in Clear and the Terrain mode, because they are public scenery and rules.
  - In data modes, rivers and bridges stay as thin lines (rules stay drawn, as wilds do). Roads show only in Supply mode.
  - Streams, lakes and ponds still fade in data modes, as approved.
- **Fog:** public, so drawn in every fog state. A bridge's cut state out of sight is remembered (§4).

### 5.4 The Supply mode draws the supply path

- **The rule:**
  - The path is the shortest one over own or own-dominated land to an own fort, counted in hops; a road hop counts as half.
  - The share is full up to 2 hops (owner decision 2), drops 20% for each hop past 2, and floors at 20%.
  - With no friendly path, the share is the floor.
- **The beads.** With one of the viewer's armies selected in Supply mode, the path runs from the army's piece to its fort as a chain
  of wheat-gold beads:
  - #E6C46A, 2.5 px, every 7 px, with a dark halo;
  - through each hop's edge midpoint, or along the road where it takes one;
  - with a small tick at each hop.
  The beads are round dots, never dashes, so the path cannot read as a fogged border (R7).
- **The end chip** at the army reads "100%, 1 hop from Kharnath". Half hops print as "1½ hops".
- **The piece's status glyph:**
  - The half wheat shows when the share is under 100%. This is docs/07's "tight supply", in the exception order starving, tight
    supply, unpaid, besieging, casting, pillaging.
  - Below 50%, the share also shows on the card.
- **The move preview in Supply mode** adds the record's engagement-preview line, "supply after arrival: 60%, 4 hops from Kharnath",
  to the last chip's second line and to the projection.
- **The mock shows** (prototype):
  - Varo at Ashfen: "100%, 1 hop from Kharnath", from two road hops.
  - Dravik pillaging Thornwood land at M14 or besieging Deepmoss from M60: "20%, no friendly path to a fort", with the half wheat.
  - On the Vast probe, march previews read "80%, 3 hops from Kharnath" and "60%, 4 hops from Kharnath".
- **In winter** the Supply fills drop by 30%, the season factor.
- **At Lean-back** the path draws over the overview.

### 5.5 Parts, checks, untouched, cost

- **Parts:**
  - The data lives in `p13-p4-world.js`.
  - **New `p65-waters.js`** (about 230 lines):
    - drawing: `rlDrawRivers(g, px, a, band)`, `rlDrawRoads`, `rlDrawBridges`;
    - geometry: `rlRiverEdge(e)`, `rlBentPts(ml, pts)`, `rlFordChips(g, ml, chips, avoid)`;
    - hover: `rlWaterAt(sx, sy)`, `riverTip`, `bridgeTip`;
    - supply: `rlSupplyPath(c)`, `rlDrawSupplyPath(g)`, `rlSupplyChip`.
- **Hooks:**
  - p59 `rlRenderStatic`, after `rlDrawWater`: draw roads, rivers and bridges (1 line).
  - p59b: the edge loop in `rlDrawRails` and in `rlDrawProvFloor` skips river edges (2 lines).
  - p63 `rlThread`: `days += legDays(...)`, the bent points, and the ford chips (3 lines).
  - p59 `rlDraw`: the supply path in Supply mode, before the thread (1 line).
  - p62 `RL_STATUS`: the half wheat (1 line), plus its glyph in p10a.
  - p30b `moveProjection`: crossing and supply text (2 lines). p80d `orderMove`: the toast (1 line).
  - p20 `pathTo`: `legDays` (1 line).
  - p80d `mousemove`: `rlWaterAt` before `provinceAt` (1 line). p80a `resolveTip`: `'river:'` and `'bridge:'` (1 line).
- **Checks (`p4Waters()`, `p4Supply()`):**
  - **Rivers:**
    - 1 to 4 on the mockup's map (1 accepted, with a note) and 2 to 4 per 60 provinces elsewhere.
    - At least 4 edges each (a tributary 3), from a peaks or mountains corner to the model edge or another river, never along or
      through a wild.
    - Graph connectivity and the no-cut rule unchanged.
    - No faint line, hairline or internal keyline drawn on a river edge (`RL_LINES.drawn`).
  - **Leg days:** +2 at a crossing without a bridge, +0 over an intact bridge, +2 once it is cut; a road leg `max(2, ceil(d / 2))`.
  - **Path chips:** every crossing leg has a ford chip, and no chip overlaps a name or piece (`rlDayChipsCheck`,
    `rlHoverChipsCheck`).
  - **River pixels:** every 4 px across each river, the water against the ground beyond each bank reaches 20 / 12, or the bank line
    reaches 2.3:1 against both. This is the wild-edge check's method.
  - **Rails and bridges:** `rlRailCheck()` passes with rivers drawn; every road/river edge draws a bridge; the cut bridge draws broken
    from M31.
  - **Supply:** the share formula matches an independent BFS over every own province and every hostile province next to own land;
    the beads are drawn; the end chip's text; the half wheat on pieces under 100%; the Supply-mode preview line.
- **Untouched:**
  - Streams, lakes, ponds and falls (map-relief §3.6), and the wilds and their edges.
  - Painted (v3): `legDays` equals `DAYS` there.
  - The Clear look, apart from the new water and roads.
- **Cost:**
  - Data at load: rivers 1.1 to 1.7 ms and roads 0.2 ms on the mockup's map; 5.2 and 0.1 ms on the probe.
  - Drawing is vector: about ≤ 2 ms per static re-render (an estimate from the comparable stream layer's measured 1 to 6 ms).
  - The supply path: ≤ 0.5 ms per frame.

---

## 6. Late-game tools

### 6.1 Map search (`/`)

- **The key.**
  - `/` binds by its character (`e.key === '/'`) unless the keystroke is Shift with a digit on the player's layout.
  - On QWERTZ, `/` is Shift+7, which picks the Terrain mode by physical key (docs/07 binds the digit row by `code`). There, search
    opens from a magnifier button in the outliner's header and, as docs/07 has it, from the Codex search ("Search also finds
    provinces and own commanders").
  - The key-table test rejects the duplicate.
- **The field.**
  - At the top of the map view, centred under the alerts ribbon: 320 px wide, the full width on the phone. It is focused on open.
  - Results come as you type: prefix matches first, then substrings, ignoring case and accents.
  - It finds provinces, commanders, regions, rivers and bridges, wilds, Workings, and mercenary bands. The mock has two bands, "the
    Ashen Company" and "the Reedmen"; their result opens a toast: "Bands are hired in the tavern (mid-game record §6)".
- **The lists.**
  - A dropdown shows up to 8 results, with kind icons.
  - The outliner shows a **Search** section at its top with every result. It stays while the field is open, and after Enter until
    cleared.
- **On the map,** every match takes the link look (`RL_LINK`: the hover tint and the live name): a province, a region's provinces, a
  commander's province, a river's edges, a Working's capital.
  - At most 12 matches are highlighted at once; the rest are listed only.
  - Names follow the live-name rule: six spots, with chips redrawn on top.
- **Keys:**
  - Enter or a click goes to the result: the camera centres on it at the band it reads in (a province at Mid, a region fitted, a
    river's extent) and selects it.
  - The arrow keys move through the list. Esc closes the field, and a second Esc clears the search.

### 6.2 Pins

- **P** pins the hovered province or army, or else the selected one. A second P unpins. The province card's pin button (`RAW.pin`
  exists) does the same.
- **The Pinned section** in the outliner lists every pin, with an unpin ✕. Sunmere is pinned at the start, as now.
- **Its header** carries the pin-layer toggle, a pin icon that is on by default.
- **The pin layer:**
  - A small brass map pin, 10 × 14 px (head #B8914A with a dark outline), above the pinned seat or piece.
  - It shows at every band, Lean-back included, and counts in the marker budget (§8).
  - Hovering a pin names its province.

### 6.3 Marker muting from the outliner's headers

- **Each header gets an eye toggle** for the marker class it lists:
  - **Battles** (new section): battles of the last 30 days, such as the victory at Morholt in M3. Mutes battle markers.
  - **Sighted** (new section): enemy armies in sight with their transit, such as "Ilsa Oakhand · 4d to Ashfen". Mutes transit
    arrows.
  - **Scouts:** mutes scout eyes, the eye glyph a scouting piece carries, a new status glyph.
  - **Pinned:** mutes the pin layer.
- **A muted class leaves the map only.**
  - Its markers are not laid out or drawn, so names and chips may use the room.
  - It stays everywhere else: the outliner rows (the count dimmed), hover cards, the alerts ribbon and the feed.
  - The header shows a struck eye, and its tooltip reads "Hidden on the map. Still listed here and in cards."
- **Storage:** the game keeps the muted state in the save's UI block (the record). The mockup keeps it in memory, with
  `?mute=battles,transit,scouts,pins` for review.
- **Never mutable:** rails, wilds, the hovered and the selected, the planned path and its chips, capitals and Workings.

### 6.4 A Great Working: landmark and banner

- **The mock.**
  - Thornwood casts **The Greening** at Deepmoss at M40 (Y4 M4). The record's effect: "spring in every province of the caster's
    dominion all year; beasts cost half".
  - Slots: `floor(2 / 2) + 1 = 2`.
- **The landmark.**
  - A miniature on its own round base beside Deepmoss's town, placed like the Wellspring: the slot search around the seat, before
    armies.
  - It shows a broad old tree with a green-gold crown and a ring of standing stones, at 1.3 × the Wellspring base.
  - A slow 4 s glow pulse plays through the present layer; it is static under reduced motion.
  - Far: the simplified piece. Lean-back: a 16 px glyph token with a green G ring.
  - Workings are public, so the landmark is drawn in fog and current (R6). Deepmoss itself stays remembered until M60.
- **On the land:** from M40, provinces under Thornwood's dominion draw the spring variant in every season (§3.3). It shows in the
  winters of M46–48, M58–60 and M70.
- **The banner.**
  - A pennant chip in the top bar, after the Wellsprings readout: the Working's colour symbol, "The Greening", and "1/2".
  - It shows for every nation, so the player sees the enemy's Working. On the phone: the symbol and "1/2".
  - Hover: "The Greening · Great Working of Thornwood · since Y4 M4", then its effect, "slot 1 of 2", and "Dispel: Unmaking (L6, a
    contest of Lore)".
  - Click centres the map on Deepmoss and opens the card. The banner is hidden while no Working stands.

### 6.5 Parts, checks, untouched, cost

- **Parts:**
  - **New `p81-tools.js`** (about 320 lines):
    - search: the index, the UI, results, highlights and the outliner section;
    - pins: P, the list, the layer and hover;
    - mutes: `view.muted`, the header toggles, and `rlMutedKind(kind)`;
    - the Working: landmark layout, drawing and card, and the banner. Its data, `WORKINGS`, lives in p13.
  - **New `p00e-pass4.css`** (about 70 lines).
  - **p00c-body:** the search field's container, the banner slot, and the mockup controls "Pass 4: On | Off", "Season: Clock |
    Spring | Summer | Autumn | Winter" and "Map: Mockup | Vast probe" (about 12 lines).
- **Hooks:**
  - p80e keys: `/` and `P` (2 lines).
  - p80b: three sections (Search, Battles, Sighted) and the header buttons (about 8 lines).
  - p61 `rlLayout`: the Working's slot after the Wellsprings loop (1 line); muted classes skipped for the battle marker and the event
    pieces (2 lines).
  - p62 `rlDrawPieces`: the Working and pins (1 line).
  - p59 `rlDraw`: the transit arrow's mute (1 line).
  - p80a `resolveTip`: `'working:'` and `'pin:'` (1 line).
  - All the new chrome is hidden in Painted (v3) and with `?p4=off`.
- **Checks:**
  - **`p4Search()`:**
    - `/` opens the field, and Shift+Digit7 still picks the Terrain mode.
    - A query per kind finds its entries; highlights ≤ 12.
    - Enter moves the camera to the target and sets the selection.
    - The outliner section shows; Esc closes.
  - **`p4Pins()`:** P on a hovered province adds a row and a marker; the layer toggle hides and shows them; unpinning removes both.
  - **`p4Mute()`:** muting each class removes exactly its markers (their layout boxes, and the pixels in them); un-muting restores
    the canvas hash; cards and the outliner keep the items.
  - **`p4Working()`:**
    - None before M40. From M40, the landmark sits beside Deepmoss on the model, clear of names and pieces; the banner's text and
      count are right.
    - In winter, a sample of Thornwood-dominated pixels equals the spring variant's, and the others equal the winter variant's.
- **Untouched:** the outliner's existing sections and rows, the alerts ribbon, the Codex search, and the key table except `/` and P.
- **Cost:**
  - The search index builds in ≤ 1 ms. A keystroke over about 300 entries (Vast: about 400) takes ≤ 1 ms.
  - A highlight is a live layer, like hover: 1 to 5 ms.
  - Pins and mutes add no raster.

---

## 7. Scale: the Vast map (up to 270 provinces), measured

### 7.1 The probe

- **The variant.** The probe is the current build copied to `vast/` with three changes, all in the copies:
  - 22 × 11 sites on 3200 × 1833 units, the same province size (median diameter 176.4 against 175.2);
  - a bake of 4096 × 2346, the same texel density;
  - realms of 40 and 36 provinces, 60 unexplored and 20 out of sight.
  It has 236 provinces, 242 cells and 661 edges.
- **Why 236 and not 270.**
  - The mockup's id raster is 8-bit, with 255 meaning "off the model", so it stops at 254 cells.
  - A first probe at 264 cells ran with 0 errors but drew 9 cells with wrong ids, and was discarded.
  - **The game's 270 needs 16-bit ids.** map-relief's id texture is RG8, which holds them, but its 256 × 1 owner and visibility
    palettes must become 512 × 1.
- **The quarter build.** `vastq/` is the same probe with the bake at 1024 × 586. It is what an overview-first bake costs.
- **Conditions:** as the baseline (headless, software raster, 1440 × 900, ratio 1). 0 page errors in every run.

### 7.2 Per province

- **The bake** costs 136 ms of CPU per province on the mockup's map and 92 ms on the probe.
  - **Marginal: 77 ms per province over a fixed 3.5 s**, so about **24 s of CPU for 270 provinces** at today's density (one thread,
    V8).
  - In the game the colour passes run on the GPU. The CPU steps left (id, warp, height weights, water, mode relief) measured 1.0 s
    at 60 and 2.5 s at 236. That is about 2.8 s at 270 on a laptop, and 8 to 14 s on a phone at map-relief §10.4's 3 to 5×, once
    per map before the cache.
- **A static re-render** costs about **0.2 to 0.4 ms per province in view**, over a screen-bound 50 to 90 ms. Most of it is raster:
  the land blit, the fog composite, the Far relief and the rim.
  - On the probe that is 79 to 168 ms: 5 to 10 dropped frames on every zoom settle, pan out of the cached margin, month change and
    selection change.
- **A cached frame** (a pan inside the 35% margin, a hover) stays **0.4 to 0.6 ms** (1.5 to 2.2 ms with a flush) at both sizes. It
  does not grow with provinces.
- **Memory.**
  - Mockup canvases go from 57 to 114 MB, kept CPU rasters from 48 to 177 MB, and the JS heap from 125 to 391 MB.
  - On the GPU, in map-relief §10.3's budget case, a whole-map Vast bake at today's density is 4096 × 2560 RGBA8 with mips: **56 MB
    instead of 14**. That takes the map from about 59 MB to about 101 MB, **over docs/06's 96 MB**.

### 7.3 What the Lean-back pass and lazy baking must do to hold 60 fps

1. **Lean-back is its own static pass.**
   - Measured: **8.4 ms** at the probe's least zoom, against 98.5 ms today; **5.7 ms** against 54.3 ms on the mockup's map.
   - Budget: ≤ 12 ms on a Vast map.
   - It draws no full-resolution blit, no per-province fog composite at screen resolution, no line-style solve, no pieces, no water
     vectors except rivers, and no Near detail.
2. **Month changes at Lean-back** touch only the wash canvas, and only its dirty provinces (all of them took 1.9 ms). A visibility
   change re-makes the overview's fog in one composite at overview resolution. Season variants change every 3 months. The monthly
   hitch at Lean-back is therefore ≤ 12 ms.
3. **The overview comes first.**
   - Lean-back and Far both draw the whole map at quarter resolution (Far measured at mip 2).
   - A quarter-resolution natural bake of the probe took **2.5 s of CPU** (shared 1.35 s, natural 2.0 s), against 21.8 s at full
     resolution. Its page was ready in **6.3 s**, against 26.6 s.
   - The first frame of a Vast map can come from the overview. Full-resolution land then follows by tiles near the view, in idle
     slices (1024² tiles with a 64-texel apron, as map-relief §10.1 already tiles its GPU passes).
   - Mid and Near draw the overview's upscale until their tiles exist. A "Preparing the land…" chip shows only if a tile is missing
     for over 1 s.
4. **The mockup** builds the overview first (a quarter-size run of the shared and natural generators into `RBQ`, through one hook in
   p58b's first line: `const BW = out.reqBW ?? RL_P.bakeW`), then the whole map. It keeps no tile LRU; the game tiles.
   - **Fallback, if the generators read the global `RB` anywhere:** Lean-back uses the full bake's quarter mip, as the prototype did,
     and the overview-first order stays a game design item.
5. **GPU memory at Vast.** A resident set of tiles (8 × 5.6 MB with mips, about 45 MB), plus the overview (3.5 MB), plus the id and
   distance textures tiled the same way, replaces the 56 MB whole-map bake. That is within docs/06's 96 MB.
6. **Far, Mid and Near** on the probe keep the mockup's 86 to 168 ms re-render hitch (a CPU canvas).
   - The game's composite is one GPU draw (map-relief §10.2: 0.2 ms of CPU, measured) and holds 60 fps there.
   - Mockup mitigations, not required for pass 4: skip the re-render on a month change when only washes changed, and widen the cache
     margin at Far.
7. **The record's gate** ("the overview band holding 60 fps") becomes `p4Scale()`: on the probe at its least zoom, Lean-back static
   ≤ 12 ms and a cached frame ≤ 2 ms; on the mockup's map, the same at the phone's Fit (26.6 px) and at 1024 × 768 leaned back
   (36.7 px).

**In the mockup**, `?map=vast` or the control "Map: Mockup | Vast probe" loads the probe:
- p10b reads the parameter (22 × 11, 3200 × 1833, capitals at (460, 953) and (2760, 862)).
- p58a sets the bake to 4096 × 2346.
- Everything else is already generic: 0 page errors measured, and the time-lapse cast, wilds, fog and pieces derive from the map.

---

## 8. The density budget per band, and muting

Counts are the most drawn on the land in a 1440 × 900 view; scale them by view area for other windows. The rule stays: no name over
a name, piece or chip, at any band.

| | Lean back (under 44 px) | Far (44 to 70) | Mid (70 to 180) | Near (over 180) |
|---|---|---|---|---|
| **Names** | Region names: at most 1 per region in view (8 on the mockup's map, about 34 on Vast). Capital names: 1 per nation (≤ 8). | Capitals, Wellsprings, wilds (Medium 10 to 14; Vast ≤ 24 in view), plus region names ≤ 1 per region in view, fading out from 70 to 85 px | Far's names without regions, plus the hovered, selected, path and linked (≤ 6 more) | Towns from 180 px; every name from 320 px |
| **Markers** | Workings ≤ slots (≤ 5); Wellspring icons ≤ 9; pins ≤ 12; battle markers ≤ 1 per region; transit arrows for visible enemy legs; search highlights ≤ 12 | The same; battle markers at towns only, as now | Plus battle markers everywhere, scout eyes, scenery ≤ 3 per province | Plus guards ≤ 2 and spring stones; scenery ≤ 10 per province |
| **Pieces** | Army tokens: ≤ 1 per region per nation in sight (cap 48). Capital keeps ≤ 8. | Towns (step 4 or more) plus 1 army piece per nation per province (≤ 100 armies, docs/06) | Plus muted hamlets from 220 px (Near), as now | Everything |
| **Lines** | Thin rails on realm edges; rivers; the hover floor | Rails, glow, faint lines, rivers, bridge ticks | Plus internal keylines, roads, bridges | Same |
| **Chips** | Path chips; numbers layer ≤ 1 per region | Path chips; numbers ≤ 1 per province | Same | Same |

**Measured today:**
- On the mockup's map: 6 names at Far, at the start view and at Mid 140; 8 at Near 250; all 59 at Near 400. Towns 8; army pieces 4
  (`out/measure-60.json`).
- The start view with pass 4 on adds the season's tone, the Reedflow, Kharnath's roads and its bridges. It adds no names (regions
  fade out by 85 px) and no Working before M40.
- `p4Density()` checks every band against the table on both maps. If the start view reads busy, roads become Supply-mode only. That
  is the one lever this design keeps for "It's not cluttered it's clean".

**Muting and the budget:**
- A muted class drops out **before layout**: its boxes are not reserved, so names and chips may take the room.
- Muting never raises a cap.
- A muted marker stays in hover cards, the outliner (dimmed) and the alerts.
- What is never mutable (§6.3) is never counted as mutable room.
- Search highlights and pins are markers. Live names (hover, link, search) follow the six-spot rule and never push a placed name.

---

## 9. Parts plan

### 9.1 New parts, in `build.sh` order

| Part | After | Lines (estimate) | What |
|---|---|---|---|
| `p00e-pass4.css` | `p00d-relief.css` | 70 | Search field, banner, outliner header toggles, tokens' plates, pins, controls |
| `p13-p4-world.js` | `p12-edges.js` | 260 | `P4S` and `?p4=`, `P4_RULES` (seasons, supply, crossing, roads, slots), regions, rivers, fords, roads, bridges and cut state, `legDays`, `rlSupplyPath`, `WORKINGS`, `BANDS`, the `?map=vast` constants |
| `p58s-seasons.js` | `p58w-natural-wilds.js` | 180 | Season variants, `rlLkFor`, `rlEnsureSeason`, the Greening clip |
| `p64a-regions.js` | `p63-relief-labels.js` | 200 | Region names, hover, card |
| `p64b-leanback.js` | `p64a-regions.js` | 260 | The Lean-back band and pass |
| `p65-waters.js` | `p64b-leanback.js` | 230 | Rivers, roads, bridges, fords, chips, the supply path |
| `p66-memory.js` | `p65-waters.js` | 120 | Fog as memory |
| `p81-tools.js` | `p80b-outliner.js` | 320 | Search, pins, muting, the Working and its banner |
| `p90-pass4-checks.js` | `p89-pass2-checks.js` | 340 | `window.__mock.p4*` (§10) |

### 9.2 Hooks into existing parts

Each is re-applied to pass 3's version of the part, and every part stays under 400 lines.

| Part (lines today) | Hook lines | What |
|---|---|---|
| `p00c-body.html` (133) | about 12 | Search container, banner slot, three mockup controls |
| `p10a-icons.js` (62) | 6 | Season glyphs ×4, half wheat, scout eye |
| `p10b-core.js` (206) | 3 | `?map=vast`: COLS, ROWS, W, H, capitals |
| `p20-time.js` (92) | 1 | `pathTo` uses `legDays` |
| `p30b-provtip.js` (40) | 5 | Region on the name line, "as of" line, crossing and supply projection |
| `p58a-relief-base.js` (164) | 1 | Bake size from `?map=vast` |
| `p58b-relief-shared.js` (153) | 1 | `out.reqBW` / `reqBH` (overview first) |
| `p58d-relief-water.js` (123) | 2 | Overview first in the scheduler; season prefetch |
| `p59-relief-draw.js` (221) | 9 | Lean-back early path and fade; `rlLkFor` in `blitLook` and `rlWashSync`; rivers, roads and bridges; regions paint; region hover; supply path; transit mute |
| `p59b-relief-lines.js` (317) | 4 | Skip river edges (2); `rlGroundSides` through `rlLkFor`; season in `rlLineCtx`'s key |
| `p59c-relief-detail.js` (87) | 1 | Winter crown strength |
| `p60-draw.js` (394) | 1 | `updateZoomChip` reads `rlBandName()` |
| `p60b-modes.js` (29) | 2 | Supply factor; legend |
| `p61-relief-pieces.js` (267) | 4 | `rlHouseGround` via `rlLkFor`; the Working's slot; muted battle markers and events |
| `p62-relief-figures.js` (263) | 4 | Pieces' alpha `1 − k`; lean tokens; half wheat and scout eye in `RL_STATUS`; Working and pins |
| `p63-relief-labels.js` (97) | 3 | `legDays`, bent points, ford chips |
| `p80a-tips.js` (95) | 1 | `'region:'`, `'river:'`, `'bridge:'`, `'working:'`, `'pin:'`, `'rtok:'` tips |
| `p80b-outliner.js` (53) | 8 | Search, Battles and Sighted sections; header eye and pin toggles |
| `p80c-sel.js` (89) | 1 | "As of" chip |
| `p80d-rest.js` (231) | 8 | Date with season; `rlEnsureSeason`; `RAW.zoom`; region and water hit before `provinceAt`; toast |
| `p80e-start.js` (207) | 2 | Keys `/` and P |

`p60-draw.js` is at 394 lines and takes one line. If pass 3 grows it, the hook moves into `p64b-leanback.js` by re-binding
`updateZoomChip`, a function declaration, as §4.3 re-binds `deriveMonth`.

---

## 10. Checks added to `window.__mock` (`p90-pass4-checks.js`)

| Check | What it asserts |
|---|---|
| `p4Bands()` | Band names at sampled D px; lean weight 0, 0.5 and 1 at 48, 44 and 40 px; `bandOf` unchanged; `?p4=off` has no lean band |
| `p4LeanBack()` | §1.6 (removed layers, rails on rendered pixels with the wash, tokens, names, hover, ≤ 12 ms static, Clear without wash, pass 3's phone checks) |
| `p4Regions()` | §2.4 (partition, sizes, connectivity, unique names and prefixes, determinism, 0 overlaps at Far and Lean-back, fade, card) |
| `p4Seasons()` | §3.4 (chroma, snow distance, core shifts, frost coverage, readers per season and summer-trained, Clear and Terrain invariance, summer equals the bake, clock format, fade, Supply factor) |
| `p4Memory()` | §4.3 (snapshot look keys, "as of", the fog guard on pixels, the M60 reveal, unexplored unchanged, no ghost pieces) |
| `p4Waters()` | §5.5 (river rules, no lines on river edges, leg days, ford chips, river pixel contrast, rails with rivers, bridges and the cut bridge) |
| `p4Supply()` | §5.5 (share formula against an independent BFS, beads, end chip, half wheat, Supply-mode preview line) |
| `p4Search()`, `p4Pins()`, `p4Mute()`, `p4Working()` | §6.5 |
| `p4Density()` | §8's counts per band on both maps; muting frees boxes and never raises a cap |
| `p4Scale()` | §7.3's targets on the probe and on the phone's Fit; reports bake, overview and variant times and memory |
| `p4Off()` | With `?p4=off`, canvas hashes at the start view, Far, Mid and Near equal the pre-pass-4 snapshot's (`snap/game-screen-v4.html`, md5 `fed36962…`); Painted (v3) hashes equal the v3 sameness check's |
| `p4Isolation()` | Each feature flag alone changes nothing outside its scope (hashes at four zooms) |
| `p4Determinism()` | Two loads give equal hashes for regions, rivers, roads and season variants; a source scan of the new parts finds no `Math.random` or `Date`, and finds no `Math.cos`, `Math.sin`, `Math.exp`, `Math.log`, `Math.pow` or `Math.atan2` in the rule-bearing functions of `p13` |
| `p4Checks()` | Runs all of the above; `reliefChecks()` and pass 2's and pass 3's checks run unchanged, with pass 4 on and off |

---

## 11. What stays untouched

- **Painted (v3), pixel for pixel.** Every pass-4 path is gated on `P4S.on`, which is false there, and the new chrome is hidden. The
  v3 sameness check runs as before.
- **The natural view with `?p4=off`,** pixel for pixel against the snapshot (`p4Off()`).
- **Determinism.** Seeded streams only; no `Math.random` or `Date`; rule-bearing data without transcendental calls (R8).
- **The sim and the repo.** No file in `/home/user/Fluid-Magic-` changes. The mock rules sit in one place (`P4_RULES`) for later
  phases.
- **Pass 2 and pass 3:**
  - The faint-line rule, the floor on hover and selection, the Far relief, the wilds and their edges, and the line solver (fed the
    shown variant through one accessor).
  - Their checks re-run with pass 4 on and off.
- **The approved fog values, rails, glow, data-mode colours, the Terrain mode's fills and Clear's fills.**

---

## 12. Owner questions (defaults in bold; the build follows the defaults)

1. **Q1. Realms as washes at Lean-back** (the record §10.1), against natural ruling N7 and the owner's "rails and glow", with the 8%
   realm tint off by default. **Default: yes, at Lean-back only. Each owned province is washed in its banner at 0.28, in Natural and
   Ownership mode only. The glow is off there, and a thin rail keeps the colour-blind contrast.** The alternative is no washes and
   the full rail with the glow at every band.
2. **Q2. Winter frost on passable Mountains and Hills,** against "snow means impassable" (map-relief §3.8) and "snow kept off
   passable land" (natural N3). **Default: allow a grey-blue frost (L\* ≤ 64, ≥ 22 / 22 from the wilds' snow) on north faces and
   crests, in Natural only, with the wilds keeping the only white snow.** The alternative is no frost: winter reads through bare
   woods, brown fields and the clock alone.
3. **Q3. Fog as memory,** which changes map-relief §9.1 ("the sim keeps no last-seen copy") and needs a last-seen record per nation
   in the sim's province view. **Default: yes. Province looks and card values come from the last sight, dated "as of". Armies are
   not remembered on the map; the card names the last army seen there.**
4. **Q4. One army token per region at Lean-back,** which thins exact positions against war-table §3.7 ("Information never does").
   **Default: yes, at Lean-back only. Every army stays one gesture away in the token's card and the outliner, and zooming in shows
   it.**
5. **Q5. Rivers, bridges and roads drawn now,** against map-relief §3.6 and §3.9 ("Not in M1"; "a river … reads as a rule; it waits
   for a crossing rule"). The record now gives the rules, and places them in M2. **Default: show them in the mockup behind the pass-4
   switch. In the game they arrive with their rules (M2) and never before, since a drawn river without its rule would mislead.**
6. **Q6. Where region names show.** The record says "the mid zoom" (§9) and "the Far and Lean-back bands" (§10.2). **Default: Far
   and Lean-back, fading out by 85 px, so the start view stays as clean as today.**
7. **Q7. The record's Lean-back "removes rails"** conflicts with the binding rule that realm borders keep colour-blind contrast in
   every view. **Default (a ruling, not a choice): the binding rule wins, and Lean-back keeps a thin rail.** This is listed only so
   the owner sees the deviation from the record.

---

## 13. Build steps (in order)

0. **Rebase.**
   - Wait for pass 3 to land, then snapshot its parts and build.
   - Record baseline hashes (start view, Far, Mid, Near, the phone's Fit, Painted (v3)) and baseline times with `tools/measure.cjs`.
   - Add `p13` with `P4S`, `?p4=`, the three mockup controls (Pass 4, Season, Map) and `P4_RULES`. No drawing yet.
   - Check: `p4Off()`.
1. **World data** (`p13`): regions with the over-9 split and the larger name pool; rivers with tributaries; fords, roads, bridges and
   the cut state; `legDays` and the `pathTo` hook; `rlSupplyPath`; `WORKINGS`, `BANDS` and the memory snapshot dates.
   - Checks: the data halves of `p4Regions()`, `p4Waters()`, `p4Supply()` and `p4Determinism()`.
2. **Seasons** (`p58s` and the hooks in p59, p59b, p59c, p61, p60b, p80d, p10a): the clock and time-lapse label; the Supply factor.
   - Check: `p4Seasons()`, then re-run `reliefNatural()` and `reliefSnow()` per season.
3. **Fog as memory** (`p66` and the hooks in p30b and p80c). Check: `p4Memory()`.
4. **Rivers, roads and bridges** (`p65`, with hooks in p59, p59b, p63, p62, p30b, p80d and p80a): the bent path and ford chips; the
   supply path, its chip and the half wheat.
   - Checks: `p4Waters()`, `p4Supply()`, `reliefLines()`, `reliefRails()`, `reliefDayChips()`, `reliefHoverChips()`.
5. **Named regions** (`p64a`, with hooks in p59, p80d, p80a and p30b). Check: `p4Regions()`.
6. **Lean-back** (`p64b`, with hooks in p59, p62, p60 and p80d): overview, wash, thin rail, tokens, capitals, numbers per region, and
   the fade.
   - Checks: `p4Bands()`, `p4LeanBack()`, and pass 3's phone checks at Fit.
7. **Tools and the Working** (`p81`, `p00e` and the hooks in p80b, p80e, p61, p62, p59 and p80a). Checks: `p4Search()`, `p4Pins()`,
   `p4Mute()`, `p4Working()`.
8. **The Vast probe** (`?map=vast`), then overview first (the p58b and p58d hooks). Check: `p4Scale()`. If the generators read the
   global `RB`, keep the mip-based overview and record the deviation.
9. **The density budget** (`p4Density()`, `p4Isolation()`). Tune roads, region name sizes and token spacing until the counts hold at
   the start view and at every band on both maps.
10. **Rebuild, run and shoot.**
    - Rebuild, run every check old and new with pass 4 on and off, and shoot the views below. Review every shot.
    - Views: the start view in each season; Far 54 px; the phone's Fit (Lean-back); the probe's least zoom; a winter Mid; Deepmoss
      at M59 and M60; a crossing preview; Supply mode with Varo and with Dravik; search, pins and a muted class; the Greening at M47.
    - Fix, then report the deviations from this design at the foot of this file.

---

## 14. Risks and what was not verified

- **Not built, not shot.** The looks of the seasons, rivers, region lettering, tokens and the Working are specified, not seen.
  Their numbers are limits for the checks, and the builder tunes within them.
- **The season limits** (core shifts, frost coverage) are set from the natural palette's spacing. The readers per season have not
  been run, so winter Hills against Wasteland is the case to watch.
- **The Lean-back cost** is a prototype: no tokens, real lettering or fog, and drawn into an offscreen canvas. The 12 ms budget leaves
  3.6 ms of room on the probe.
- **The probe stops at 236 provinces** because of the 8-bit id raster. The figure for 270 is extrapolated (77 ms of bake per province
  over 3.5 s fixed; 0.2 to 0.4 ms of re-render per province in view).
- **The machine.** Software raster on 4 cores. Static re-render medians vary by about ±25% between runs (`measure-*.log` against the
  first run).
- **Pass 3 conflicts.** Hooks into p59b, p61 and p63, and the phone's Fit becoming Lean-back, touch areas pass 3 is changing. Step 0
  rebases, and pass 3's checks gate step 6.
- **The rivers on the mockup's small map.** The rule found one river of ≥ 4 edges, and four bridges near Kharnath. The tie-break and
  a tributary are the levers. If the start view still reads busy, roads become Supply-mode only (§8).
- **The `/` key** on layouts where it is Shift with a digit falls back to the outliner button and the Codex search (§6.1).

---

## Appendix: files (under `visual-v4/natural/pass4/`)

| File | What |
|---|---|
| `mid-game.md` | The record, copied from the remote branch (input) |
| `snap/game-screen-v4.html`, `snap/parts/`, `snap/build.sh`, `snap/rebuilt.html` | Snapshot of the current build (md5 `fed36962…`), identical to a rebuild of its parts |
| `vast/` | The Vast probe: 236 provinces, bake 4096 × 2346 (copies of the parts with three changes) |
| `vastq/` | The probe with a quarter-resolution bake (1024 × 586) |
| `tools/measure.cjs` | Ready time, bake steps, memory, and static, cached and hover frames by zoom, with a per-function breakdown |
| `tools/run-proto.cjs` | Evaluates a prototype inside the mockup's closure (the page is not changed) |
| `proto/p4world.js` | Reference for `p13`: regions, rivers, fords, roads, bridges, leg days, the supply path |
| `proto/leanbench.js` | The Lean-back static pass against today's re-render |
| `proto/seasonbench.js` | The cost of a season variant |
| `proto/times.js` | Bake times of a loaded build |
| `proto/info.js`, `proto/info2.js`, `tools/run-vp.cjs` | Fit, least and start zooms per window size; the time-lapse cast's provinces |
| `out/measure-60.json`, `out/measure-vast.json` (+ `.log`) | Baseline and probe measurements |
| `out/proto-world-snap.json`, `out/proto-world-60.json`, `out/proto-world-vast.json` | World prototype outputs (`-60` is the first run, before the river and name fixes) |
| `out/leanbench-snap.json`, `out/leanbench-vast.json` | Lean-back prototype timings |
| `out/seasonbench-snap.json`, `out/seasonbench-vast.json` | Season variant timings |
| `out/times-vastq.json` | Quarter-resolution bake of the probe |
