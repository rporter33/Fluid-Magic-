# Pass 4 of the map mockup: the mid-game record's overworld (final design)

2026-10-24. **Design only; nothing is built.** This is `design.md` (2026-10-23, 23:04) revised with its two reviews:
`review-owner.md` (the owner's eye) and `review-feasibility.md` (accessibility and feasibility). Every change either review asks
for is taken, unless §13 "Review responses" says why not. The pass shows, in the clickable game-screen mockup, the overworld items
of the other session's mid-game record (`mid-game.md`): its section 10 "The overworld", and the map parts of sections 2 (seasons),
3 (the supply path), 4 (rivers, roads, fords, bridges), 7 (Workings) and 9 (named regions, the Vast map). The record's rules land in
later sim phases (M2 and M5). Here they are drawn with mock data.

Nothing in `/home/user/Fluid-Magic-`, `visual-v4/map/` or `visual-v4/natural/pass3/` was edited. Paths are relative to
`visual-v4/natural/pass4/` unless written in full. New for this revision, under `final/`:
- `p4world-r2.js`, the world prototype with the review's determinism fixes, and its outputs `out-world-r2-snap.json` and
  `out-world-r2-vast.json`.
- `regfit-final-*.js` and their outputs `out-regfit-final-*.json`: region-name fit under the final lettering rule.

**Binding owner direction** (verbatim sources in `docs/design/`):
- `map-relief.owner-answers.md`. The natural landscape is the default. Lines between unowned provinces, and inside one realm, are
  faint; "they brighten to the colour-blind floor around the hovered and selected province, and everywhere in the Clear terrain
  colours setting and the Terrain mode. Realm borders … keep their colour-blind contrast in every view."
- `visual-references.owner-direction.md`: "It's not cluttered it's clean". The reference screenshots are direction only; they are
  never copied, and the game they come from is not named.
- `map-relief.md`, `war-table.md`, `docs/07-ui.md` (labels by zoom, keys, the outliner, fog), and `natural/design-final.md`.
- The record's settled answers: supply reach is **two hops**, and the Vast map is **uncapped at 270 provinces, and measured**.

---

## Is this purely a UI pass?

No, but it builds no rules. The record's section 10 is mostly about how the map shows things, and the mockup can show nearly all
of it now. It helps the build in four concrete ways:

1. **The zoomed-out view gets a job, with a measured cost.** The Lean-back band shows the campaign at a glance: realms, capitals,
   Wellsprings, Workings, armies merged by region, and region names. Drawn through the real path with its chrome cached, it costs
   10.2 ms on a 236-province map at its least zoom. Today's drawing there costs 95.4 ms.
2. **Drawn water becomes rules.** The relief design held rivers, bridges and roads back until they carried a rule (map-relief §3.6
   and §3.9). The record supplies the rules: a crossing costs 2 days, a road halves a leg, and a bridge can be cut. The move preview
   and the Supply mode print those numbers.
3. **The late game gets names and memory.** Named regions, fog as memory dated "as of Y1 M3", map search, pins and marker muting.
4. **The land gets a clock.** Seasons show on the land and in the clock, and one Great Working stands as a landmark.

The seasonal factors, supply lines, crossing costs, roads and Workings stay sim work for M2 and M5, in the record's order. The
mockup shows their look and the numbers the UI will print, from mock functions in one place (`P4_RULES`). The pass also measured
three things the sim phases need: 270 provinces need 16-bit province ids, with 512 × 1 owner and visibility palettes; region and
river generation must be seeded from map data alone; and the overview band must cache its chrome to hold 60 fps.

---

## What the owner sees, band by band

The start view is the one the owner approved. With pass 4 on, it differs only by one river, its four bridges, and the pinned
Wellspring's brass tack. Everything else pass 4 adds sits one gesture away, or in a band the start view does not use.

| Band (median province on screen) | Where it appears | What the owner sees |
|---|---|---|
| **Lean back** (below 44 px, ±2 px hysteresis) | The phone's Fit (26.6 px). The 1024 × 768 least zoom (36.7 px). The Vast map's least zoom (29.4 px at 1440 × 900). It never appears at 1280, 1366 or 1440 on the mockup's map. | The sculpted model on the oak, with terrain as broad masses and lakes. Each realm is washed in its banner at 0.28, edged by today's rails, with Far's faint lines between provinces. Capitals stand as their Far pieces, with today's Far capital names, beside the Wellsprings and the Working. Armies are merged into one round-based piece per region per nation; there is no plate for 1, stacked bases for 2 or 3, and a count plate only from 4. Up to 6 region names show in a 1440 × 900 view, small and quiet (none on the phone). The river, standing pins, the planned path and transit arrows complete it. There are no towns but capitals, no province names but capitals', and no glow. |
| **Far** (44–70 px) | The mockup map's least zoom at 1366 and 1440 (50.7 and 53.7 px) | Today's Far, plus the river (at least 2 px wide) and the Working's piece. Region names fade in below 62 px: at most 6, quieter than capital and wild names. There are no bridges and no roads. Pins stand. |
| **Mid** (70–180 px) | The start view (96 px); Fit at 1440 × 900 (84.8 px) | Today's Mid on the approved spring land, plus the river and its stone bridges, which have short road stubs that fade into the ground. Pins are 6 px tacks in the seat's base. Roads show only in Supply mode, along the planned path, and on the hovered or selected province's own edges. |
| **Near** (over 180 px) | Zoomed in | Everything, plus faint roads. |

**In every band:**
- Hover names the terrain.
- The hovered and selected provinces keep their floor lines, river edges included.
- Clear and the Terrain mode keep every line at the floor and never change with the season.
- Seasons tint Natural only. The start season, spring, is the approved bake pixel for pixel. Summer ripens the fields, autumn turns
  them gold, and winter bares the woods. There is no frost unless the owner turns it on to judge it.
- The clock shows a season glyph before `Y1 M3 D14`. The clock stays in view at every width.
- An explored province out of sight shows its last-seen state, and its card says "Out of sight · as of Y1 M3".
- **In Supply mode,** a selected army's supply path is a solid wheat-gold line to its fort, ending "100%, 1 hop from Kharnath".
- **A march across a river** reads "6d · ford +2" on its day chip.
- **The Working** shows as a compact chip, symbol and "1/2", at the start of the alerts ribbon.

---

## The design in sixteen lines

1. **One switch.** `P4S.on` is true in the relief look unless the page opens with `?p4=off`. Painted (v3) never runs pass-4 code,
   and `?p4=off` restores the natural view exactly. Each feature also has its own flag.
2. **The start season is the approved bake.** Spring (M1–3, where the game opens) is today's natural bake pixel for pixel. Summer,
   autumn and winter are derived from it.
3. **A new Lean-back band** below 44 px, with ±2 px hysteresis, decided when the zoom settles. It cross-fades by time (150 ms,
   instant under reduced motion), so no resting view shows two passes. It is drawn by its own pass with a cached chrome layer.
4. **Lean-back keeps the owner's line rule:** today's rails, Far's faint lines, the floor on hover and selection, every line at the
   floor in Clear, the Terrain mode and the data modes, and the fog frontier's hem and dots. The banner wash replaces only the glow.
5. **Merged army tokens** at Lean-back sit on round bases like every piece. A count plate shows only from 4.
6. **Named regions** of 5 to 9 provinces, seeded from map data, show at Lean-back and at Far below 62 px:
   - in Marcellus SC, 11 to 12.5 px, with no jitter, along a spine clamped to ±30°;
   - only where they fit;
   - at most 6 in a 1440 × 900 view, by priority;
   - none on the phone.
7. **Winter without frost by default.** A review control draws Mountains-only frost at Mid and Near so the owner can judge it.
8. **Fog as memory**, as a pure function of the month. The mock adds events, so the remembered and live looks visibly differ.
9. **Rivers are 6 to 9 units wide**, rounded, with banks that carry the province line. Rails inset clear of the water. A bank line
   is drawn where the water cannot carry the border's contrast.
10. **Bridges** have road stubs at Mid and Near. **Roads** are drawn only in Supply mode, along the planned path, on the hovered or
    selected province's edges, and at Near.
11. **Crossings** fold into the day chip: "6d · ford +2". The projection says "+2 days, crossing the Stagflow".
12. **The Supply path** is a solid wheat-gold line with a dark halo and a cross-bar at each hop. It runs centroid to edge to
    centroid and never along an edge.
13. **Late-game tools:**
    - map search on `/`, in a `type="search"` field that exists only while open;
    - pins as tacks at Mid and Near, standing at Far and Lean-back, never hit-testable;
    - muting for battle markers, transit arrows and pins;
    - empty outliner sections hidden.
14. **The Greening** is a static landmark (no pulse) with a compact chip at the start of the alerts ribbon. The clock sticks to the
    top bar's right end, so the date and its season glyph are always in view.
15. **Measured scale:**
    - Lean-back costs 10.2 ms on the probe with its chrome cached; a cached frame costs 2.0 ms and a hover frame 4.4 ms.
    - A season variant costs 26.3 MB on the mockup's map and about 96 MB on the probe.
    - A Vast map needs 16-bit ids, and one owner question about texel density.
16. **Eight owner questions** (§12), each with a default. The build follows the defaults.

---

## Rulings

- **R1. One switch, per-feature flags.**
  - `P4S = { on, lean, regions, seasons, memory, waters, tools, working }`, in the new part `p13`.
  - `on` is false in Painted (v3), with `?look=v3`, and with `?p4=off`. `?p4=-seasons,-waters` turns single features off.
  - At load, `P4S` reads `LOOK0` (p10b), because `view` and `RELIEF` are declared later.
  - The Map look control updates `P4S` at run time. Switching to Painted (v3) re-runs `deriveMonth(curMonth)` and `refreshKeys()`,
    so v3 shows live values, not remembered ones. `legDays` is gated on `P4S.on && P4S.waters`.
- **R2. Mock rules only, in one place.**
  - `P4_RULES` holds the record's numbers:
    - the seasons table (§2);
    - supply with the owner's two-hop reach (§3, decision 2);
    - a crossing costs +2 days, a road halves a leg (minimum 2), and bridges are cut and rebuilt (§4);
    - Working slots are `floor(nations / 2) + 1` (§7);
    - regions hold 5 to 9 provinces (§9).
  - The later sim phases and docs/09-balance lift them from there.
- **R3. The binding rules win where the record disagrees.**
  - **Rails.** The record's Lean-back "removes … rails", but realm borders keep their colour-blind contrast in every view. Lean-back
    keeps today's rails.
  - **Lines.** Lean-back keeps the owner's faint lines and their floors.
  - **Supply example.** "60% (5 hops from Kharnath)" was written for a reach of 3. At the owner's 2 it reads "60%, 4 hops from
    Kharnath", which the Vast probe shows.
- **R4. Hover always names the terrain, in every band.** A region card opens from a region's name, a token's card, the province
  card's region link, or search. Hovering land opens the province card.
- **R5. Clear, the Terrain mode and the data modes are season-invariant and wash-free.** The docs/09 distinct-colours rule is
  measured on fixed fills. Every line there stays at the floor in every band.
- **R6. Public against remembered.**
  - **Always current:** terrain, ownership (docs/01 §14), rivers, roads, bridges as structures, regions, Workings, and the season.
  - **Remembered for an explored province out of sight:** settlement, walls, buildings, land look (dominion), scars and event
    pieces, population, unrest, defenders, springs, and a bridge's cut state.
  - **Projection.** The move preview and the supply path use the viewer's projection, which is the remembered state.
- **R7. Lines dash or dot only for fog** (docs/07; natural N10: "a dotted or dashed border still means fog").
  - The move thread keeps its approved dashes.
  - The supply path is a solid line.
  - No pass-4 line follows a province edge except the river's banks. The supply path and roads cross edges at their ford or bridge
    point.
- **R8. Determinism.**
  - Every new seeded stream is `rngFor('p4:${MAP_SEED}:<purpose>:<key>')`. No new code calls `Math.random` or `Date`.
  - Rule-bearing data (regions, rivers, roads, fords, leg days, the supply path) uses arithmetic, square roots and floors only.
    That rules out `Math.sin` and also calls to p10b's `noise` and `wet`, which use it.
  - Map data never depends on who views it. Regions seed from the lowest province id.
- **R9. Information stays one gesture away** (war-table §3.7). Merged tokens list every army in their card, and the outliner keeps
  them all. Muting removes markers from the land only. Roads are named in the province card.
- **R10. Build order.** Pass 4 is built on the parts as pass 3 leaves them. New code goes in new parts. Existing parts get short
  hooks, re-applied to pass 3's versions. Pass 3's checks re-run with pass 4 on and off.
- **R11. The first season a game opens in is drawn as the approved landscape.** For every new game that is spring (the game opens at
  M3). In the game a season is a material-shader uniform, so this costs nothing.
- **R12. Band switches follow map-relief §1.** Objects switch at a band edge and cross-fade over 150 ms, by time. Only continuous
  properties, such as pass 2's Far relief strength and the region names' fade below 62 px, blend with the zoom.

---

## Measured baseline (the current build)

**Method.**
- The build was snapshotted to `snap/game-screen-v4.html` (md5 `fed36962…`), byte-identical to a rebuild of `snap/parts`.
- Measurements ran in playwright's headless Chromium 1194, software raster, 1440 × 900, ratio 1, 4 cores, with local d3 and Pixi.
- The Vast probe (`vast/`) has 236 provinces at the same province size and texel density.
- **One baseline for re-render costs:** the real draw path with a pixel flush (`review-feas/leanreal.js`). `out/measure-*.json`'s
  89.5 ms (4-run medians with every cache dropped) and `proto/leanbench.js`'s 54.3 ms (an offscreen canvas without the room or
  vignette) are superseded for comparisons.

| | Mockup map (60 provinces, bake 2048 × 1280) | Vast probe (236 provinces, bake 4096 × 2346) |
|---|---|---|
| Ready (load to first natural frame) | 11.5 s | 26.6 s |
| Bake CPU (shared rasters; natural pass) | 2.68 s; 6.53 s | 5.54 s; 17.53 s |
| Canvases / CPU rasters / JS heap | 57 / 48 / 125 MB | 114 / 177 / 391 MB |
| **Static re-render at the least zoom, real path** | **57.5 ms** (53.7 px; 63.4 ms on the phone at 26.6 px) | **95.4 ms** (29.4 px) |
| Static re-render, other zooms (`measure.cjs`) | 62 to 165 ms | 99 to 168 ms |
| Cold line solve at the least zoom | +24 ms | +95 ms |
| Cached frame (pan) with a flush; hover frame | 1.6 to 2.2 ms; 0.9 to 4.6 ms | 1.5 to 1.8 ms; 0.8 to 11.5 ms |
| Faint lines drawn at Far | 104 edges | 551 edges |

---

## 1. The zoom bands, and the Lean-back band

### 1.1 The bands

The bands stay docs/07's, by the median province's on-screen diameter (D px). One band is added below Far.

| Band | D px | What it shows | What it removes (against the next band in) |
|---|---|---|---|
| **Lean back** (new) | below 44, entered below 42 and left above 46 | The model on the oak with pass 2's sculpted relief, terrain as broad masses from the overview, and lakes. Realm washes (Natural, Ownership mode). Today's rails and Far's line set; the fog frontier's hem and dots. The river at its floor width. Capitals as their Far pieces with today's Far capital name; Wellsprings and the Working as their Far pieces. One army token per region per nation. Region names (§2), wild contours, standing pins, the planned path and its chips, transit arrows, the supply path in Supply mode. The hovered province's tint, floor lines and card. | Cover detail (crowns, field strips, hedgerows, specks). Streams and ponds. Bridges (and roads, except in Supply mode). The glow (the wash replaces it; the frontier hem stays). The land-look (dominion) wash, which stays in the Dominion mode and in cards. Every town but capitals. Per-province army pieces and their status glyphs (one glyph moves to the token, by exception). Province names other than capitals'; Wellspring and wild names (their cards and search name them). Event pieces (folded into the token's glyph). Per-province number chips (the numbers layer shows one per region, §1.5). |
| **Far** | 44 to 70 | Today's Far, plus the river and the Working's piece; region names below 62 px; standing pins | As today: hamlets, internal keylines (hairlines at Far), full covers. No roads (Supply mode only) and no bridges. |
| **Mid** | 70 to 180 | Today's Mid, plus the river, bridges with stubs, roads only by exception (§5.3), and tack pins | As today. Region names are gone from 70 px. |
| **Near** | over 180 | Everything, as today, plus faint roads | — |

**Thresholds** (one object, `RL_P4.lean = { enter: 42, leave: 46, fadeMs: 150 }`, a docs/09-balance row):
- `rlBandName()` returns `'lean'` once the settled zoom is below 42 px, and keeps it until the zoom is above 46 px. It is gated on
  `P4S.lean` and the relief look.
- **The switch is decided when the zoom settles,** as today's static re-render is. Mid-gesture, the cached layers scale as now.
- **The cross-fade** renders the new band's static layer once, then blends the two cached layers over 150 ms. The DOM pieces fade by
  opacity over the same 150 ms. Under reduced motion the switch is instant.
- **No resting view shows both passes.** At 1280 × 720, whose least zoom is 47.2 px, the camera rests in Far.
- `bandOf` is **not changed**. It returns `'far'` at Lean-back, so Painted (v3) and every existing Far branch keep working.
- The zoom chip and `RAW.zoom` read `rlBandName()`. The chip's tooltip: "Lean back: the whole campaign at a glance: realms, capitals,
  Wellsprings, Workings, armies by region, region names. Point at a token or a region's name for what it holds."

**Every mode works at every zoom** (docs/07). At Lean-back:
- Data modes draw their opaque raster at overview resolution, with no washes and every line at the floor.
- Contextual modes hatch and outline as now.
- The Terrain mode shows the Clear overview, with no washes and every line at the floor.

### 1.2 Realm borders at Lean-back: washes, rails and lines

- **The wash.**
  - Each owned province's polygon is drawn at overview resolution in its banner at **0.28**, with a soft 1-texel edge. It is drawn
    in Natural and in Ownership mode only.
  - The wash is made once per ownership or fog signature: 1.0 ms on the mockup's map and 1.9 ms on the probe.
  - 0.28 stays under the 0.35 glow peak on which the rail band rule was measured (natural §8.1), and keeps 72% of pass 2's Far
    relief swing.
- **The wash carries no colour-blind identity.** Measured in `review-feas/out-colour.json`:
  - The two mock banners at 0.28 over the same ground differ by 24.8–32.0 under normal vision, but only 4.3–8.7 under protanopia.
  - A Thornwood wash is 1.9–4.5 from bare land under protanopia; a Cinder wash is 1.6–12.4.
  - For a protanope, Lean-back shows realms by the rails, the capital names and the token rims. Q1 says so.
- **The rails are today's rails** (`rlW()`, keylines 1.5 px and banner 2 px below ratio 1.5), inset on the owner's side through the
  existing `rlDrawRails`, with no new option. The thin rail of `design.md` is dropped: it was outside natural §8.1's measured model,
  and it saved 1 px at ratio 1 only.
- **The lines are Far's.** Lean-back calls `rlDrawRails(g, 'far', px)` as Far does:
  - faint lines in Natural;
  - the floor around the selected province, from the static loop;
  - every hairline and internal keyline at the floor in Clear, the Terrain mode and the data modes (`rlFaintOn` already says so);
  - the hovered province's floor lines, from the live layer as now.
- **Solved on the ground drawn.**
  - `rlStateOf` learns the lean wash, so hover, selection and faint alphas are solved over it.
  - At Lean-back, `rlLineCtx`'s key uses each province's owner and fog state (not the dominion wash, which Lean-back does not draw),
    and one zoom step for the whole band.
  - So lines re-solve only on entering the band and on an ownership or fog change: a cold solve, +24 ms on the mockup's map and
    +95 ms on the probe, reported by `p4Scale`.
- **The fog frontier.**
  - The overview composites `rlGlow(true)`, the hem-only raster the Terrain mode already uses. The glow's banner slot is off.
  - Explored/unexplored frontier edges keep their dotted 2 / 3 px line (docs/07's non-colour fog cue).
- **Nothing sits on a rail.** Region names, tokens and pins never cover a rail (v3's "never under an owner band", p57 l.174). One rail
  check runs with labels on.

### 1.3 The overview

The overview raster is what Far already draws: mip 2, the quarter mip, of the shown season variant (§3).

**On top of it, the overview composites:**
- pass 2's Far relief at full strength;
- lakes;
- each province's fog state: Natural's 6% haze plus 40% and 25% desaturation, or Clear's 4% and 10%;
- the frontier hem.

**Cost.** It is keyed by look, season, `RB.ver`, `RB.lookVer` and the fog signature, and takes 2.2 to 10.9 ms to make.

**The result** is pass 2's sculpted terrain model seen without the pieces, which matches the owner's description of the zoomed-out
reference: "a terrain model with cliff edges … the owner's tint and thin borders still show which land is whose".

### 1.4 Merged army tokens

- **One token per region per nation in sight.**
  - The count is the number of armies (commanders leading troops) the viewer sees there. Mages, priests, scouts and the pretender do
    not add to the count; they are listed in the card. The token wears the crown when the pretender is among them.
  - The token is the piece's round base with the banner rim and the lead commander's figure at 0.8 scale.
  - Plates by count: none at 0 or 1; at 2 or 3, the bases stack, offset 3 px; a count plate appears from 4.
  - Its status glyph is at most one, by exception, in docs/07's priority: starving, tight supply (half wheat), unpaid, besieging,
    casting, pillaging.
- **Position.**
  - The mean of the member provinces' centroids, snapped to the nearest free spot inside the region, with `rlLayout`'s slot search.
  - It keeps clear of region names, capital boxes and rails.
  - The viewer's token goes first.
- **Hover** opens a card listing every army and commander in the region (24 px portrait, name, troops, order, province link) and the
  region's name as a link.
- **Click** selects the viewer's lead army. The card's "Fit the region" link fits the region. There is no double-click or double-tap
  binding, because double-tap is the browser's zoom gesture.
- **On the mockup's map at the phone's Fit (M3, regions from `final/out-world-r2-snap.json`):**
  - The Gold Plain shows a Cinder token wearing the crown, with no plate. The Titan, Seren and Ondra are in its card.
  - The Ravenholt shows a Cinder token for Varo at Ashfen, with no plate and with Kesh (the scout at Oakmoor) in its card. It also
    shows a Thornwood token for Ilsa at Tormere.
  - No plate shows anywhere at M3.
- **Owner question Q4** (§12).

### 1.5 Parts and functions

**New `p64b-leanback.js`** (about 300 lines):
- `RL_P4.lean`, `rlBandName()`, and the band switch with its 150 ms cross-fade of cached layers.
- `rlChrome()`: the room, table, vignette and rim, drawn once per zoom, view size and table setting into one canvas and blitted 1:1.
- `rlOverview()` and `rlWashCanvas()`.
- `rlLeanStatic(gU, gO, now)`, which draws, in order:
  1. the chrome;
  2. the overview and the wash;
  3. `rlDrawRails(g, 'far', px)`;
  4. `rlDrawWildContours` and `rlDrawLip`;
  5. rivers (§5);
  6. capital, Wellspring and Working pieces;
  7. tokens;
  8. region names (laid out once per zoom bucket, §2);
  9. standing pins.
- `rlLeanLayout()`, which returns the layout shape every reader expects and is stored as `RL_PIECE_CACHE.get('L')` with `lean: true`:
  - `labels`: the capital names;
  - `wildOps`: empty;
  - `boxes`: tokens, region-name glyphs and pins;
  - `armies`: the tokens, each with `ids` listing every member, so `rlPieceAt` finds a commander's token.

  The thread, the transit arrow, the live names and the day chips therefore read the Lean-back layout, not the last Far one.
- `rlPlaceLeanTokens()`: DOM tokens through `rlDrawPiece` with a new kind, `'region'`.
- `rlLeanNumbers()`: one chip per region:
  - Ownership: provinces held ("5/8");
  - Population and Supply: sums;
  - Unrest: the maximum;
  - Dominion: counts by holder;
  - Springs: symbols;
  - Terrain: the most common terrain.

**Hooks:**
- **p59 `rlRenderStatic`:**
  - at its top, `if (rlBandName() === 'lean') { rlLeanStatic(gU, gO, now); RL_LAST_LAYOUT = RL_PIECE_CACHE.get('L'); return; }`;
  - `rlStaticSig` gains the band name and the `P4S` flags (3 lines).
- **p59b:** `rlStateOf` learns the lean wash, and `rlLineCtx` gains the Lean-back key (2 lines).
- **p62:** `rlPlacePieces` hands over to `rlPlaceLeanTokens` at Lean-back, and `rlDrawPiece` hands kind `'region'` to the token
  painter (2 lines).
- **p63:** `rlNameBoxes` adds the region glyph boxes, at Far as well (1 line).
- **p60-draw `updateZoomChip`** and **p80d `renderModes`** read `rlBandName()` (1 line each).
- p61's `rlLayout` is not called at Lean-back.

### 1.6 Checks (`window.__mock.p4LeanBack()`)

They run at the probe's least zoom, at the mockup's phone Fit, and at its 1024 × 768 least zoom.

1. **Gone:**
   - no province name but capitals' (`lay.labels`);
   - no town but capitals;
   - no glow pixels beyond the hem;
   - no per-province DOM piece (the `.mini` count equals the token count).
2. **Lines** (the owner's rule):
   - In Natural, `RL_LINES.drawn` holds Far's set.
   - In Clear, the Terrain mode and one data mode, `reliefLines()` reports 0 samples under the floor.
   - The selected province's floor lines are drawn.
   - The hover floor reaches 2.3:1 over the wash, on rendered pixels.
   - Frontier edges are dotted, and the hem is present.
3. **Rails:** `rlRailCheck()` gives 0 fails on rendered pixels with the wash on:
   - in Natural, Clear, the Terrain mode and each data mode;
   - at ratio 1 and 2;
   - in each forced season;
   - with `BAN` swapped through all 11 banners, dropping `GLOW`, `MODER` and `RL_LINES.cache` between runs;
   - once with labels on.

   Every wash alpha is ≤ 0.35.
4. **Tokens:**
   - one per region per nation in sight;
   - every visible army sits in exactly one token;
   - plates only from 4;
   - `rlPieceAt` finds each member's token.
5. **Names:**
   - no overlap among region names, capital names, tokens, path chips and pins;
   - no name or token over a rail;
   - every name on the model and inside the view band.
6. **Hover:** a province returns `provTip` with its terrain chip; a token returns its card; a region's name returns the region card.
7. **Cost, on the real path** (`RCK = null; draw(); ctx.getImageData(…)`):
   - static ≤ 12 ms at a fixed zoom with the chrome cached and lines warm;
   - a zoom settle ≤ 65 ms;
   - a cached frame ≤ 2 ms;
   - the cold line solve reported.
8. **Band switch:** enter below 42 px, leave above 46 px. The fade lasts 150 ms (0 ms under reduced motion). At every resting zoom
   from the least zoom to 70 px, one pass draws.
9. **Clear and the Terrain mode:** no wash pixels, against a wash-off render.
10. **Pass 3 on the phone:** pass 3's phone checks pass at Fit with Lean-back on.

### 1.7 What stays untouched, and the cost

- **Untouched:**
  - `bandOf`, and everything drawn above 46 px. With only `P4S.lean` on, canvas hashes at 53.7, 96, 140 and 250 px equal `?p4=off`.
  - Painted (v3).
  - The rails, glow and lines of Far, Mid and Near.
- **Cost** (`review-feas/out-lean*.json`, the real path):

  | | Mockup map at 53.7 px | Vast probe at 29.4 px | Phone at 26.6 px |
  |---|---|---|---|
  | Today's static re-render | 57.5 ms | 95.4 ms | 63.4 ms |
  | Lean-back with the chrome and names cached | 10.8 ms | 10.2 ms | 9.4 ms |
  | First render, drawing the chrome | 61.6 ms | 56.2 ms | 58.3 ms |

  - **Frames:** a cached frame costs 1.4 to 2.0 ms, and a hover frame 3.9 to 4.4 ms.
  - **Names.** The region-name layout, 3.0 to 12.1 ms per render, is paid once per zoom bucket.
  - **Lines.** Far's faint lines add about 1 to 3 ms warm (single strokes, the rails' 2.7 to 3.7 ms loop). This is an estimate,
    measured in step 6; if it breaks the 12 ms gate, the line loop gets its own cached layer keyed by `rlLineCtx`.
  - **The game composites on the GPU** and does not pay the mockup's chrome or line costs.

---

## 2. Named regions on the land

### 2.1 The regions (data)

The reference is `final/p4world-r2.js`, run inside the mockup's closure by `tools/run-proto.cjs`.

- **Seeds and growth.**
  - There are K = round(n / 7) regions.
  - Seeds come from farthest-point sampling over the province graph, **from the lowest province id** (map data, never the viewer's
    capital).
  - Growth is balanced: the smallest live region claims its cheapest unassigned neighbour. The cost is 1 for a terrain different
    from the seed's, plus 0.35 × hops from the seed; ties go to the lower index.
  - Leftovers join a neighbour.
- **Repair.**
  - A region under 5 merges into its smallest neighbour if the sum stays ≤ 9; otherwise it takes boundary provinces from donors over
    5, keeping each donor connected.
  - A region over 9 splits along its long axis (the PCA of member centroids) into two connected halves of at least 5. On the probe
    this split 10 → 5 + 5, 11 → 5 + 6 and 10 → 5 + 5.
- **Names.**
  - The most common terrain picks v3's `REGION_SYL` syllables, reused unchanged. Names are unique against province, wild, river and
    v3 region names.
  - **Prefixes:** no two regions share one, and none may begin a nation's name. "The Thornweald", held by the Cinder Horde, echoed
    Thornwood.
  - **Letters:** a triple letter collapses ("Mill" + "lands" is "The Millands").
  - **The name pool.** On large maps the prefixes grow with province syllables, in the record's "Ashfall Downs" pattern. The probe
    fell back to "The X March" 11 times with v3's lists alone.
- **Determinism.**
  - Name streams are `rngFor('p4:12:region:<lowest member id>')`; there is no trigonometry.
  - Regions are map data: changing the viewer or the owners changes nothing. Only the holder is live.
- **The holder.** A tie reads "Split: independents 4, the Cinder Horde 4".
- **Build order.** Regions are built lazily on the first draw, after p54 (`REGION_SYL` and `buildRegions` are declared there).

**The mockup's map** (`final/out-world-r2-snap.json`, 2.5 ms):

| Region | Provinces | Terrain | Held mostly by | Members |
|---|---|---|---|---|
| The Lark Plain | 8 | plains | independents (6) | Thornwick, Rookford, Wyrmere, Thornreach, Coldbrook, Rookmarch, Redcrag, Brammere |
| The Black Marsh | 8 | swamp | independents (8) | Marholt, Sundale, Oakmarch, Lanstead, Halebrook, Stagmoor, Fenvale, Thornbrook |
| The Millands | 6 | farmland | independents (6) | Wyrford, Cinfen, Duskholt, Briarstead, Wyrmarch, Elmwick |
| The Gold Plain | 8 | plains | split, 4 and 4 | Stagmarch, Torbarrow, Redholt, Kharnath, Brambarrow, Briarmoor, Briarmarch, Karford |
| The Red Knolls | 9 | hills | independents (9) | Halevale, Karreach, Wyrholt, Redwick, Redbarrow, Ashmoor, Halegate, Ashvale, Karwick |
| The Deepweald | 5 | forest | Thornwood (3 of 5) | Bramreach, Oakford, Rookmere, Cinford, Deepmoss |
| The Ravenholt | 8 | forest | Cinder Horde (5 of 8) | Briardale, Morholt, Sunmere, Ashfen, Oakmoor, Tormere, Ashstead, Coldmere |
| The Broad Meads | 8 | plains | independents (5) | Elmgate, Elmcrag, Ashdale, Morgate, Gallreach, Wyrfen, Rookbarrow, Lanbrook |

All eight are connected, with sizes 5 to 9. On the Vast probe the rule gives 34 regions of 5 to 9 (9 ms).

### 2.2 Drawing: quiet cartographic lettering

- **The spine.**
  - The region's principal axis, **clamped to ±30° from horizontal**. Seven of the mockup's eight axes, and 23 of the probe's 34, are
    steeper.
  - Member centroids are projected onto it, smoothed (Chaikin, 2 passes) and extended 0.3 D past the end members. The name is
    centred on the arc midpoint.
- **Size is fitted, not fixed:** size = min(cap, 0.85 × spine ÷ the name's width at 1 px), at 0.12 em tracking.
  - Caps: 12.5 px at Lean-back and at Far, with floors of 11 px and 11.5 px.
  - Below the floor, a name may still run up to 25% past its region (at least 80% of its glyph centres inside, with v3's p57 l.173
    test and the owner's limit), if it collides with nothing and never crosses a wild or a rail.
  - Failing that, the next of up to 5 spines is tried (v3's `regionSpines`). Failing that, no name is drawn; the card, the token and
    search still find the region.
- **Measured fit under this rule** (`final/out-regfit-final-*.json`; centroid spines, collisions not tested):

  | D px | Mockup map (8 regions): fit / with overrun | Vast probe (34): fit / with overrun |
  |---|---|---|
  | 26.6 (phone Fit; no names drawn there) | 1 / 7 | 3 / 26 |
  | 29.4 (Vast least zoom) | 2 / 8 | 4 / 28 (82%) |
  | 36.7 (1024 × 768 least zoom) | 5 / 8 | 15 / 34 |
  | 44 | 7 / 8 | 26 / 34 |
  | 53.7 (desktop least zoom, Far) | 8 / 8 | 30 / 34 |
  | 62 | 8 / 8 | 34 / 34 |

- **Lettering.**
  - Glyphs are laid out by p57's `layoutOnPath` and painted by `paintGlyphs`, read-only: p57 is not edited.
  - Marcellus SC, already loaded: the table plaque's face, so region names read as the table's cartography.
  - There is no glyph turn and no baseline jitter.
- **Quieter than capital and wild names.**
  - The fill is #D8D1C1, a step under the wild names' #E9E4D8 and the capital names' #F4EEDF.
  - The halo is rgba(20,18,15,.75) at 3 px: lighter than the capital names' .85 to .95, and darker than `design.md`'s .5.
  - The fill must reach 4.5:1 against the halo-darkened ground on rendered pixels. The fill alone measures 2.59:1 on pale wasteland.
    Where it fails, the fill steps up toward #E9E4D8 before the halo grows.
- **How many: at most 6 region names** in a 1440 × 900 view, scaled by the map view's area and rounded, with at least 3 (4 at
  1024 × 768). **None on the phone:** there, a tap on land opens the province card, whose region link opens the region card.
- **Which:** first regions with fighting (a battle in the last 30 days, or a siege); then regions holding the viewer's provinces;
  then the largest; ties go to the lower id. The message feed names regions the same way ("fighting in the Ravenholt").
- **Order: never over a province label.** Region names are static and path chips are live, so the chips avoid the names.
  - **At Far,** names are placed after every province name, wild name, piece and pin.
  - **At Lean-back,** they are placed after capitals, tokens and pins.
  - **Where names may sit:** inside the model and the view band, and off the mode column, the alerts ribbon and the open search field
    (`rlControlsLay`, `rlRibbonLay`, and the field's rectangle).
- **By zoom:**
  - full at Lean-back and up to 62 px;
  - fading by zoom from 62 to 70 px (a continuous property);
  - none from 70 px.

  The start view (96 px) and Mid stay exactly as today, and so does the 62–70 px stretch where pass 2's relief ramps.
- **Modes and fog:** region names show in every mode and every fog state (regions are map data).

### 2.3 Hover and card

Pointing at a region's name opens it. On touch, the name's hit band is at least 44 px tall.

- **At once:**
  - the name brightens to #F4EEDF;
  - the region's provinces take a light tint (0.12);
  - the region's outer outline draws at the faint lines' floor (2.3:1, solved like the hover floor lines).
- **After 500 ms, the region card:**
  - Title "The Ravenholt"; value "Region · 8 provinces"; meaning "Held mostly by the Cinder Horde (5 of 8)."
  - Rows: every member province as a link, with its terrain glyph and owner mark (never more than 9).
  - "Armies seen here: Varo, Ash Chieftain (48); Ilsa Oakhand (52)."
  - Foot: "Click to fit the region · / to search".
- **Click** fits the region (`animateCam` to its box, never past Mid). A tap opens the card.
- **The province card** names its region, dim and as a link: "Ashfen · [swamp] · the Ravenholt".

### 2.4 Parts, checks, untouched, cost

- **Parts:**
  - The data lives in `p13-p4-world.js`, built lazily: `rlRegions4()`, `regionOf4[i]` and `regionHolder(r)`.
  - **New `p64a-regions.js`** (about 220 lines) holds:
    - `rlRegionLayout(band, lay)`: spines, fitted sizes, the cap and priority, glyph boxes;
    - `rlPaintRegions(g)`, `rlRegionAt(sx, sy)`, `rlRegionHover(g)`, `regionTip(r)`.
- **Hooks:**
  - p59 `rlRenderStatic`: `rlPaintRegions` after `rlPaintLabels` (1 line). p59 `rlDraw`: `rlRegionHover` (1 line).
  - p80d `mousemove`: `rlRegionAt` before `provinceAt` (3 lines).
  - p80a `resolveTip`: the `'region:'` key (1 line).
  - p30b `provTip`: the region link on the name line (1 line).
  - p63 `rlNameBoxes`: the region glyph boxes (shared with §1.5).
- **Checks (`p4Regions()`):**
  - **Data:**
    - every province is in exactly one region; sizes are 5 to 9; each region is connected;
    - names are unique, with distinct prefixes, no nation prefix and no triple letter;
    - rebuilding twice, or with the other nation as viewer, gives the same regions.
  - **Layout,** at 29.4, 36.7, 44, 53.7 and 62 px on both maps:
    - every spine is within ±30°;
    - at most the cap is drawn, in priority order;
    - every region the cap selects is placed at 29.4 px and above on both maps, and the share that could fit is reported;
    - 0 glyph boxes over province names, wild names, pieces, chips, pins, rails or wilds;
    - every name is on the model and in the view band.
  - **Fill:** ≥ 4.5:1 against the halo-darkened ground.
  - **Where none are drawn:** on the phone, and at 70 px and above. The fade weight is monotonic.
  - **The card:** it lists every member and the holder, with a tie read as split.
- **Untouched:** v3's regions, `REGION_SYL`, p57, Painted (v3), Mid, and the start view.
- **Cost:** build 2.5 ms (mockup) and 9 ms (probe), once. Layout 3.0 to 12.1 ms per zoom bucket, cached. Paint ≤ 1 ms.

---

## 3. Seasons on the land

### 3.1 The clock and the data

- **Months.** 1 to 3 are spring, 4 to 6 summer, 7 to 9 autumn and 10 to 12 winter. The time-lapse (M3 to M70) passes six winters:
  M10–12, M22–24, M34–36, M46–48, M58–60 and M70.
- **The record's factors,** in `P4_RULES.seasons`:

  | Rate | Spring | Summer | Autumn | Winter |
  |---|---|---|---|---|
  | Supply | +10% | 0 | +20% | −30% |
  | Population growth | +0.1% | 0 | 0 | −0.1% |
  | Move days | 0 | 0 | 0 | +2 on Hills, Mountains and Forest; +1 elsewhere |
  | Materials | 0 | +10% | 0 | −10% |
  | Unrest decay | 0 | 0 | 0 | −1 |

- **The clock** shows a season glyph before `Y1 M3 D14`, on desktop and phone. The glyphs are four new icons in p10a: bud, sun, wheat
  sheaf and snowflake. The word and the factors live in the clock's tooltip: "Spring: supply +10%, growth +0.1%. Summer in 1 month."
- **The clock stays in view.** Today the top bar is a horizontal scroller with its scrollbar hidden:
  - at 1440 × 900 the clock's speed buttons run 99 px past the visible edge;
  - at 1024 × 768 and on the phone the date itself is out of view (content 1517 px against 990 px; 1461 against 356).

  Pass 4 pins the clock to the bar's right end (`position: sticky; right: 0`, on the bar's own background, in p00e), and the other
  readouts scroll under it. This fixes a defect that predates pass 4, so it is offered to pass 3 or the base as a general fix. If
  Chromium does not pin an overflowing flex item, the readouts move into an inner scroller and the clock sits beside it.
- **The time-lapse label** reads the glyph and `Y1 M3`.
- **The move preview** in winter adds the season's days through `legDays` (§5.2). The final chip shows the total, and the projection
  adds "winter +4 days".
- **The Supply mode's values** take the factor through `fillFor` and the numbers layer. The legend adds "Winter: −30%."

### 3.2 What the land shows (Natural only)

| Season | On the land (cover classes of `RB.nat`) | Limits against the bake |
|---|---|---|
| **Spring** (M1–3; the start, M3) | **Today's natural bake, pixel for pixel** (R11) | identical by hash |
| Summer (M4–6) | Ripening: some green-crop parcels become ripe, and some ripe ones straw. Grass toward dry grass (#766E38 at 0.12). | core mean ΔE00 ≤ 6 |
| Autumn (M7–9) | Fields: green crop becomes ripe gold, and ripe becomes straw stubble (+3 L\*). 10% of deciduous crowns warm toward russet (#6B4A26 at 0.25). Grass toward dry grass (#766E38 at 0.3). | ≤ 6; farmland ≤ 9 |
| Winter (M10–12) | Deciduous canopy lifts toward bark grey-brown (#5C5448 at 0.18); conifers stay. Fields go toward ploughed and fallow (0.35). Grass dulls (−30% chroma, +2 L\*). Swamp reeds go toward straw. Water and wasteland are unchanged. **No frost on passable land** (Q2). | ≤ 6; farmland ≤ 8 |

- **Snow still means impassable.** The wilds never change and keep the only snow: v4's #F2EEE6, or pass 3's massif snow once it
  lands. `reliefSnow()` runs on each variant.
- **The frost review control.** "Winter frost: Off | On" (Off by default) draws frost for the owner to judge by eye:
  - on Mountains provinces only, at Mid and Near only, on north faces (hillshade fS < −0.1) and the upper third of heights, with
    coverage ≤ 35%;
  - never at Far or Lean-back, on Hills, or in Clear or the Terrain mode.
- **Its colour is solved after the pass 3 rebase,** to reach 20 / 12 from every shade of pass 3's snow and from the massif's granite.
  The design's #929DA6 measures:
  - 2.1 / 1.3 from pass 3's shaded snow at sv −0.375, and never more than 16.5 from any shade of it;
  - 9.2 / 8.6 from the massif's lit rock at its 0.55 cap;
  - on Hills (the reason Hills are excluded), frosted turf against wasteland ground is 13.3 / 4.6 under protanopia.

  If no colour passes, the control draws the best one found, and the legend's status line says "Frost: fails the snow-distance rule;
  review only". The owner sees why it is off.
- **Calm:**
  - every pixel stays ≤ OKLCH C 0.10 in every season;
  - the natural lightness-only readers keep ≥ 0.95 province accuracy and ≥ 0.90 patch accuracy at Mid in every season, trained on
    that season;
  - a reader trained on spring and tested on each season keeps ≥ 0.90 by province.
- **By band:** at Lean-back and Far the season reads as tone in the overview. At Mid and Near it shows as strips in new tones and
  bare canopy. In winter at Near, the Near detail's crown strength is × 0.6.
- **The Greening** (§6.4): from M40, provinces under Thornwood's dominion draw the bake (spring) in every season. That is a clip of
  the bake; no extra variant exists.
- **Transitions.**
  - At a season's first month (M1, M4, M7, M10), the land cross-fades over 600 ms by blending two cached static layers, not by
    re-rendering each frame. It is instant under reduced motion.
  - The next variant is made in idle slices during the last month of the current one.
  - A time-lapse jump into an unmade season keeps the shown one, with "Preparing winter…" in the legend's status line.
- **Never seasonal:** Clear, the Terrain mode, the data modes' colours (only the Supply values change), Painted (v3) and the wilds.
- **Review control:** "Season: Clock | Spring | Summer | Autumn | Winter" forces one season.

### 3.3 How a variant is made (mockup)

- **Per texel,** from the natural bake's unwashed image (`Lk.img`), the cover classes `RB.nat.cls` and `cmar`, and the half-resolution
  hillshade `RB.fS` and heights `RB.hh`.
- **The formula:** `out = base + (target − base) · a`, with per-class targets and alphas, then two mips by canvas downscale.
  Speckles and the 10% russet crowns use p58n's integer hash `rlH2`.
- **Storage:** `RB.S[season] = { img, canvas, mip1, mb1, mip2, mb2, washKeys, ready }`, the shape of a look.
- **Every reader goes through `rlLkFor(look)`,** which returns the variant when the look is Natural and the season is not spring:
  - `blitLook`, `rlWashSync`, `rlGroundSides` and `rlHouseGround`;
  - `rlWildRimMap`, whose key gains the season, so the wild rim is decided on winter ground;
  - the `RL_SEATG` key, which gains the season;
  - `rlNatChroma` and `rlSnowCheck` (p88), which take a look argument so the season checks test the variant, not the bake four times.

  `rlLineCtx`'s key gains the season.
- **Memory** (measured in `review-feas/out-mem-60.json`):
  - A variant is 26.3 MB on the mockup's map and about 96 MB on the probe (washed canvases and unwashed copies with mips).
  - With spring as the bake, at most two variants exist: the shown one, and the next, which keeps only its unwashed `ImageData` (13
    MB, or 48 MB on the probe) until it is shown.

### 3.4 Parts, checks, untouched, cost

- **Parts:** **new `p58s-seasons.js`** (about 190 lines) holds:
  - `RL_SEASON`: targets, alphas and limits, as docs/09-balance rows;
  - `rlSeasonOf(M)`, and `rlSeasonGen(season)`, time-sliced through `rlRunGen`;
  - `rlLkFor(look)` and `rlEnsureSeason(M)`;
  - the frost control;
  - `rlSeasonClip(g, lvl)`, the Greening's clip of the bake.
- **Hooks:**
  - p59: `blitLook`, `rlWashSync`, and the 600 ms blend of cached layers at a season change (3 lines).
  - p59b: `rlGroundSides`, `rlWildRimMap` and `rlLineCtx`'s key (3 lines).
  - p61: `rlHouseGround` and the `RL_SEATG` key (2 lines).
  - p59c: `rlNearDetail`'s crown strength (1 line).
  - p60b: `fillFor('supply')` and its legend (2 lines).
  - p80d: `updateTop` and `setMonth` print the glyph and call `rlEnsureSeason` (3 lines).
  - p88: a look argument for `rlNatChroma` and `rlSnowCheck` (2 lines).
  - p10a: four glyphs. p00e: the sticky clock.
- **Checks (`p4Seasons()`):**
  - **At M3:** the shown variant equals the natural bake by hash, and the start view equals `?p4=off` except for the layers §8 allows.
  - **For each forced season:**
    - the variant is built, with 0 pixels over C 0.10;
    - `reliefSnow()` and `reliefNatural()` pass on the variant, and so do `reliefRails()`, `reliefLines()` and the wild-edge check
      (pass 2's or pass 3's);
    - core shifts are within the limits;
    - the readers pass, trained on the season and trained on spring.
  - **Invariance:** Clear and Terrain-mode hashes are identical across the four seasons.
  - **The clock:** the date reads `^Y\d+ M\d+ D\d+$` after a season glyph, and its tooltip names the season.
  - **Visibility:** the glyph and date are visible without scrolling at 390, 1024, 1280, 1440 and 1920 px.
  - **The fade:** one 600 ms blend at M4, and no re-render while it runs.
  - **The frost control:** Off by default; when On, frost appears only on Mountains, only at Mid and Near; its snow distance is
    reported.
  - **Supply:** the raster changes by the factor and nothing else.
  - **Memory:** at most two variants exist.
- **Untouched:** Painted (v3), Clear, the Terrain mode, the data-mode colours, the natural bake (spring is the bake), and the wilds.
- **Cost:** a variant takes 83 ms (mockup) or 255 ms (probe). A season change adds a wash composite (113 or 243 ms measured) and a
  cold line solve (+24 to +46 ms, or +95 to +108 ms). In the game a season is a shader uniform: no bake.

---

## 4. Fog as memory

### 4.1 Today

| State | Today |
|---|---|
| Unexplored | Natural terrain under 6% haze plus 40% desaturation (Clear: 4%). One gesso hut at the seat. The current owner's rail and glow. Dotted lines. Card: "Unexplored: the land is known; what lives here is not." |
| Explored, out of sight | 25% desaturation (Clear: 10%). Dotted lines. The settlement, walls, land look and every value in its current state (map-relief §9.1: "the sim keeps no last-seen copy"). Card row: "Seen: earlier; out of sight now". |

Two provinces are out of sight on the mockup's map, Deepmoss and Redcrag. Deepmoss comes into sight at M60, when Dravik besieges it.

### 4.2 Pass 4

- **Memory is a pure function of the month.**
  - lastSeen(i, M) is the latest month ≤ M in which the viewer saw i.
  - The snapshot is that month's derived state for i (`dm0(lastSeen)`), memoised by month.
  - Scrubbing the time-lapse in any order gives the same picture: M64 then M40 equals a fresh M40.
- **What the snapshot keeps:**
  - settlement step, walls (PD) and buildings;
  - the land look (dominion holder and strength);
  - scars and event pieces;
  - population, unrest, defenders and springs;
  - bridges' cut state.
- **Drawing.** Out of sight, a province is drawn from its snapshot, with the approved quiet difference (25% desaturation in Natural,
  10% in Clear, dotted lines) and no live animation. Public things stay current (R6).
- **Ordering.** The Greening's clip, the supply path and the move preview read the remembered state after `rlMemApply`, so nothing
  out of sight leaks.
- **The card.** Under the title, a dim line reads "Out of sight · as of Y1 M3", and every remembered value is the snapshot's. The
  "Seen" row goes. The province panel's heading carries the same chip.
- **Armies are not remembered on the map:** there are no ghost pieces. The card adds "Last seen here: Ilsa Oakhand, 52 troops, Y1
  M3" when an army was seen there. **Owner question Q3.**
- **Unexplored land is unchanged.** The record's "unpainted parchment" is v3's wording. On the relief, "not yet painted" is the haze
  over public terrain (map-relief §9.1, natural §8.3).
- **The mock gives memory something to show.**
  - Deepmoss's real walls do not rise in today's mock, and its dominion stops rising at M15. The `p66` re-bind therefore adds mock
    events: Deepmoss's walls rise at M24 and M44, it builds a temple at M36, and Redcrag's walls rise at M28.
  - Both provinces were last seen at Y1 M3. Up to M59 they keep their M3 look. At M60 Deepmoss comes into sight, its land and town
    cross-fade to the live state (two wall steps and a temple at once), and the "as of" line goes.
- **By band:**
  - Lean-back: the wash is current, the capital piece is remembered, and tokens show only armies in sight.
  - Far, Mid and Near: settlements, walls, motifs and scars come from the snapshot.
  - Data modes show the remembered values, the card's projection (docs/07).

### 4.3 Parts, checks, untouched, cost

- **Parts:** **new `p66-memory.js`** (about 140 lines):
  - `RL_MEM`: the sight table by month, memoised snapshots, and the mock events;
  - `rlLastSeen(i, M)`, `rlMemApply(M)`.
- **Hooks:**
  - The part re-binds `deriveMonth`, a function declaration in p20, so p20 is not edited:
    `const dm0 = deriveMonth; deriveMonth = (M) => { dm0(M); if (P4S.memory) rlMemApply(M); };`.
  - p30b `provTip`: the "as of" line (2 lines). p80c `renderProvince`: the heading chip (1 line).
- **Checks (`p4Memory()`):**
  - At M3, M30 and M59, every out-of-sight province's look key equals its snapshot's, and its card says "as of Y1 M3".
  - Scrubbing: `setMonth(64)` then `setMonth(40)` hashes equal a fresh `setMonth(40)`.
  - The remembered M59 and live M60 looks of Deepmoss differ in its box.
  - **The fog guard:** changing live hidden state leaves the canvas in the province's box unchanged.
  - Unexplored provinces are hash-identical, in their boxes, to `?p4=off`.
  - No army piece is drawn out of sight.
  - The preview and supply text use remembered values.
- **Untouched:** the unexplored look, the fog values, the dotted lines, Painted (v3), and the data-mode colours.
- **Cost:** one memoised derivation per distinct last-seen month (well under 1 ms a month), and one re-render on a reveal.

---

## 5. Rivers, roads, fords and bridges as rules; the supply path

### 5.1 The data (mock, in `p13-p4-world.js`; reference `final/p4world-r2.js`)

- **Built lazily** on the first `legDays` call, which comes during p20's load (`acrossTarget` and `closedTarget` call `pathTo`).
  - So it reads p10b and p12 data only.
  - The median diameter is computed locally from `areaOf` (`MED_DIAM` is a `const` in p50). Streams come from `rngFor`, not the
    relief tables.
  - `p4Determinism` scans every identifier the builder reads.
- **Rivers run along province borders.**
  - **The corner graph** holds province/province edges only; wild edges are excluded.
  - **Corner height** is the mean of its cells' elevations (Mountains 5, Hills 4, Forest 3, Plains, Farmland and Wasteland 2, Swamp
    1, Peaks 6, Mere 0), plus 0.24 × a seeded value noise. The noise is a 500-unit lattice of `rngFor('p4:12:rivh:<ix,iy>')` values
    with a smoothstep blend: arithmetic only, in place of p10b's `noise`.
  - **Sources** are corners at the foot of a peaks wild or a Mountains province. A river steps to the lowest neighbour while heights
    fall, then heads toward the nearest model edge.
  - **Length:** at least 4 edges; a tributary needs 3.
  - **Count:** `round(2n / 60)`, from 2 to 4.
  - **Names:** syllables plus water nouns, unique against province and wild names.
  - Rivers are edge properties: they never cut the graph.
- **Fords:** one per river edge, at a seeded 0.35 to 0.65 along it (`p4:12:ford:<edge>`).
- **Roads** (the record §4).
  - Each fort's catchment is every province within 2 hops (the owner's reach), joined by the fort's shortest-path tree over its own
    land.
  - Among equal parents the generator prefers one that does not cross a river.
  - Roads are map data: a capture does not move them.
- **Bridges** stand where a road crosses a river. A cut bridge is mock state by month.

**On the mockup's map** (`final/out-world-r2-snap.json`; the river's course is unchanged by the noise fix, and only its name
changed):
- **The Stagflow:** 10 edges, from the Ashspine's foot between Stagmoor and Tormere to the west edge, through the Cinder heartland.
  One of its edges is a realm edge.
- **Roads:** 15 edges, from Kharnath and Deepmoss.
- **Bridges:** 4 (Redholt/Kharnath, Morholt/Briardale, Sunmere/Briardale, Briardale/Ashfen). Briardale/Ashfen is cut from M31, since
  Thornwood holds Ashfen from M30.
- **One river.** This small map yields one river of ≥ 4 edges. The check accepts 1 here, with a note.
- **The Vast probe:** 4 rivers of 14 to 23 edges, 36 road edges and 7 bridges.

### 5.2 Leg days (mock rule)

`legDays(v, w)` is built in this order:
1. start from `DAYS[terrain of w]`;
2. on a road, take `max(2, ceil(d / 2))`;
3. add 2 if the edge carries a river and no intact bridge;
4. add the season's winter days.

- **Hook:** p20 `pathTo` uses `legDays` (1 line). With `P4S.waters` off, it returns `DAYS`.
- **At M3,** 4 of the 17 provinces Varo can reach are reached across the Stagflow without a bridge, and pay +2 days.
- **Review targets.** `acrossTarget` and `closedTarget` (both Ashvale today) are reported with waters on and off, and pass 2's checks
  that use them must still find their targets.

### 5.3 What the player sees, by band

- **Rivers.**
  - Width 6 to 9 mapgen units, widening downstream: about 6 to 10 px at the start view, against the streams' 1.5 to 3 units.
  - The floor is 2 px at Far and Lean-back.
  - The course follows the border's own vertices, rounded by Chaikin (2 passes), with a seeded meander of up to 0.04 D. It is never
    a stiff polyline.
  - Natural water #14615B (Clear: #50AF9B), with a shore band 3 L\* darker and the streams' lit bank highlight. A mouth on the south
    edge falls down the cliff through the existing falls code.
- **The banks carry the province line.**
  - **In Natural at rest,** the faint line on a river edge is not drawn: the river is the border.
  - **Bank lines.** The water fails 20 / 12 against some natural grounds:

    | Ground | ΔE (normal / worst) |
    |---|---|
    | Mountains ground | 21.6 / 5.6 (1.21:1) |
    | Mountain scree | 24.9 / 9.9 |
    | Swamp pools | 14.7 / 10.5 |
    | Wasteland cracks | 28.1 / 10.4 |
    | Hill rock | 25.4 / 11.3 |

    Wherever the water misses 20 / 12 against a side's ground, that bank gets a keyline solved with `rlAlphaFor` at the hairline
    floor (2.3:1). The same rule applies in Clear, where water passes raw but not across fog states (19.7 / 8.5 against Wasteland).
  - **Hover and selection.** The floor line of the hovered or selected province runs along its own bank, so its outline has no gap.
    This holds in every band, including Far and Lean-back.
  - **Clear, the Terrain mode and the data modes** draw the floor line along each bank, in every band.
  - **Fog.** Where both sides are fogged, the bank lines are dotted.
- **Rails on a river edge** are inset on each owned side to clear the water by 1 px, measured per vertex (half-width plus the
  meander's offset). They never sit on water, so `rlRailCheck`'s ground sample (8.5 px in) never reads water. This matters at Near
  400, where the river's half-width reaches 13 to 20 px, and because Thornwood's banner is 8.8 / 2.0 (tritan) from the water.
- **Bridges.**
  - **At Mid and Near:** a stone span about 6 × 3 units at the road's crossing, with a lit top and dark ends. Road stubs of 0.15 D on
    each bank fade into the ground, so a span never stands alone.
  - **At Far and Lean-back:** nothing.
  - **A cut bridge** shows two stubs with a 2-unit gap and two rubble dots at Mid and Near. At Far the river shows, and the preview
    and the river's card give the cost.
- **Roads** are drawn only:
  - in Supply mode, at every band;
  - along the planned path, where the thread itself follows the road's geometry (no second stroke);
  - on the hovered or selected province's own road edges, faint, from the live layer;
  - at Near, faint.

  The style is a dusty track: #B6A27C at 0.45, 1.2 px (2 px at Near), from seat to the edge's ford or bridge point to seat, smoothed,
  clipped off seats, names and pieces. The province card gains one row: "Roads: to Briardale, Redholt".
- **The move preview** (p63's thread).
  - **A leg that crosses a river** bends through its ford point, or through the bridge. A crossing without a bridge draws a small tick
    in the river's colour across the thread at the ford.
  - **The leg's existing day chip** reads "6d · ford +2". There is no separate chip.
  - **The projection and the order's toast:** "Right-click: Varo marches here in 10 days (+2 days, crossing the Stagflow)".
- **Hover.**
  - **A river** opens a small card, like a wild's: "The Stagflow · river." Its meaning reads "Crossing it costs 2 days unless a bridge
    stands. A defender gets +1 def against an army that crossed it." Its rows list its bridges as links, with their state.
  - **A bridge:** "Bridge over the Stagflow · Briardale–Ashfen · no crossing cost". Once cut: "Cut Y3 M7 by Thornwood: crossing +2
    days until rebuilt".
- **Looks and modes.**
  - Rivers and bridges are drawn in Clear and the Terrain mode, because they are public scenery and rules.
  - In data modes, rivers stay as thin lines with their bank lines.
  - Streams, lakes and ponds still fade in data modes, as approved.
- **Fog.** Rivers, roads and bridges are public and drawn in every fog state. A bridge's cut state out of sight is remembered (§4).

### 5.4 The Supply mode draws the supply path

- **The rule.**
  - The path is the shortest one, in hops, over own or own-dominated land to an own fort; a road hop counts as half.
  - The share is full up to 2 hops, drops 20% for each hop past 2, and floors at 20%. With no friendly path, it is the floor.
- **The line.** With one of the viewer's armies selected in Supply mode, a **solid 2 px wheat-gold line** (#E6C46A) runs from the
  army's piece to its fort:
  - it has a dark halo, #1C1A17 at 0.85 or more, 1.5 px on each side, because over the upper Supply ramp the gold alone falls to
    1.07–1.53:1;
  - it tapers softly toward the fort;
  - it passes through each hop's edge midpoint, or along the road through its bridge or ford point, crossing edges and never
    following one;
  - each hop is marked by a **short cross-bar**, never a round mark (war-table §3.6 keeps round marks off paths).
- **The end chip** at the army reads "100%, 1 hop from Kharnath". The prototype printed "1 hops", and the r2 prototype is fixed. Half
  hops print as "1½ hops".
- **The piece's status glyph.** The half wheat shows when the share is under 100% (docs/07's "tight supply"). Below 50%, the share
  also shows on the card.
- **The move preview in Supply mode** adds the record's line, "supply after arrival: 60%, 4 hops from Kharnath", to the last chip's
  second line and to the projection.
- **The mock shows:**
  - Varo at Ashfen: "100%, 1 hop from Kharnath" (two road hops).
  - Dravik pillaging at M14, or besieging Deepmoss from M60: "20%, no friendly path to a fort", with the half wheat.
  - On the Vast probe, 19 targets read "80%, 3 hops from Kharnath" and 4 read "60%, 4 hops from Kharnath".
- **In winter** the Supply fills drop by 30%.
- **At Lean-back** the path draws over the overview.

### 5.5 Parts, checks, untouched, cost

- **Parts:**
  - The data lives in `p13-p4-world.js`.
  - **New `p65-waters.js`** (about 270 lines):
    - drawing: `rlDrawRivers(g, px, band)` (course, banks, bank lines, mouth), `rlDrawRoads`, `rlDrawBridges` (spans and stubs);
    - geometry: `rlRiverEdge(e)`, `rlRiverInset(i)` (the rails' per-vertex inset), `rlBentPts(ml, pts)`;
    - hover: `rlWaterAt(sx, sy)`, `riverTip`, `bridgeTip`;
    - supply: `rlSupplyPath(c)`, `rlDrawSupplyPath(g)`, `rlSupplyChip`.
- **Hooks:**
  - **p59:** `rlRenderStatic` draws rivers and bridges after `rlDrawWater` (1 line). `rlDraw` draws the supply path in Supply mode
    and the hovered or selected province's road edges (2 lines).
  - **p59b** (3 lines):
    - the faint-line branch in `rlDrawRails` skips river edges in Natural;
    - floor lines on river edges move to the banks;
    - `rlInset` takes the river inset on realm edges.
  - **p63 `rlThread`:** `legDays`, the bent points, the ford tick and the day chip's "· ford +2" (3 lines).
  - **p62 `RL_STATUS`:** the half wheat (1 line), with its glyph in p10a.
  - **p30b:** `moveProjection` gets the crossing and supply text, and `provTip` the "Roads:" row (3 lines). **p80d `orderMove`:** the
    toast (1 line).
  - **p20 `pathTo`:** `legDays` (1 line).
  - **p80d `mousemove`:** `rlWaterAt` before `provinceAt` (1 line). **p80a `resolveTip`:** `'river:'` and `'bridge:'` (1 line).
- **Checks (`p4Waters()`, `p4Supply()`):**
  - **Rivers:**
    - 1 to 4 on the mockup's map (1 accepted with a note), and 2 to 4 per 60 provinces elsewhere;
    - ≥ 4 edges (a tributary 3), from a peaks or Mountains corner to the model edge or another river, never along a wild;
    - graph connectivity unchanged;
    - width 6 to 9 units and ≥ 2 px; no corner sharper than the Chaikin bound; meander ≤ 0.04 D.
  - **Lines on river edges:**
    - in Natural at rest, no faint line;
    - the hovered and selected provinces' floor runs along their bank;
    - in Clear, the Terrain mode and a data mode, every bank carries the floor, at every band;
    - every 4 px along each bank, the water reaches 20 / 12 against the ground beyond, or the bank line reaches 2.3:1;
    - bank lines are dotted where both sides are fogged.
  - **Rails:** `rlRailCheck()` gives 0 fails with rivers drawn, at the start view, Near 250 and Near 400. No rail pixel lies on water.
  - **Bridges and roads:**
    - every road/river edge draws a bridge with stubs at Mid and Near, and none at Far or Lean-back;
    - the cut bridge draws broken from M31;
    - roads appear only in Supply mode, on the path, on hover or selection, and at Near.
  - **Leg days and chips:**
    - +2 at a crossing without a bridge, +0 over an intact one, +2 once it is cut;
    - a road leg takes `max(2, ceil(d / 2))`;
    - every crossing leg's day chip carries "ford +2", and no chip overlaps a name or piece (`rlDayChipsCheck`, `rlHoverChipsCheck`).
  - **Supply:**
    - the share matches an independent BFS;
    - the line is solid, with its halo and cross-bars;
    - the line or its halo reaches 3:1 against the ground on rendered pixels, over every Supply-ramp value it crosses;
    - the end chip's text, with "hop" singular at 1;
    - the half wheat on pieces under 100%, and the preview line.
- **Untouched:** streams, lakes, ponds and falls (map-relief §3.6); the wilds and their edges; Painted (v3), where `legDays` equals
  `DAYS`.
- **Cost:**
  - Data at load: 1.5 ms (rivers) and 0.2 ms (roads) on the mockup's map; 6.7 and 0.1 ms on the probe.
  - Drawing is vector: about ≤ 2 ms per static re-render.
  - The supply path: ≤ 0.5 ms a frame.

---

## 6. Late-game tools

### 6.1 Map search (`/`)

- **Keys.**
  - `/` binds by character (`e.key === '/'` without Shift), and docs/07's `?` (Shift with the same key on US layouts) still opens the
    key overlay. The key-table test matches both by character and Shift.
  - On layouts where `/` is Shift with a digit (QWERTZ: Shift+7, which picks the Terrain mode by physical key), search opens from a
    magnifier button in the outliner's header and from the Codex search.
- **The field.**
  - It exists only while open: `<input type="search">`, which p80e's key handler already skips, so digits typed into it never change
    the speed or the mode.
  - It sits at the top of the map view, under the alerts ribbon: 320 px wide, or the full width on the phone. It is focused on open.
  - Its rectangle joins the layout's avoid set (`rlRibbonLay` and `rlControlsLay`), so names and chips keep off it.
- **Results.**
  - They come as you type: prefix matches first, then substrings, ignoring case and accents.
  - Search finds provinces, commanders, regions, rivers and bridges, wilds, Workings and mercenary bands. The mock's two bands,
    "the Ashen Company" and "the Reedmen", open a toast: "Bands are hired in the tavern (mid-game record §6)".
- **The lists.**
  - A dropdown shows up to 8 results, with kind icons.
  - The outliner's **Search** section, at the top, lists every result while the field is open, and after Enter until cleared.
- **On the map,** every match takes the link look (`RL_LINK`), at most 12 at once. Names follow the live-name rule.
- **Moving through results.** Enter or a click goes to the result at the band it reads in, and selects it. The arrow keys move
  through the list. Esc closes the field, and a second Esc clears the search.

### 6.2 Pins

- **P** pins the hovered province or army, or else the selected one, and a second P unpins. The province card's pin button
  (`RAW.pin`) does the same.
- **The Pinned section** lists every pin, with an unpin ✕. Sunmere is pinned at the start, as now. Its header carries the pin-layer
  toggle.
- **The pin layer:**
  - At Mid and Near, a **6 px brass tack set into the seat's base rim** (#B8914A with a dark outline).
  - At Far and Lean-back, where finding things is the problem, a standing 10 × 14 px brass pin above the seat or token.
  - Pins are **never hit-testable**: hover and taps fall through to the seat or piece below, whose card says "Pinned" and carries the
    unpin button. This also settles touch: there is no 10 × 14 px target.
  - Pins count in the marker budget (§8).

### 6.3 Marker muting from the outliner's headers

- **The muteable classes:**
  - **Battles** (new section): battles of the last 30 days, such as the victory at Morholt in M3. It mutes battle markers.
  - **Sighted** (new section): enemy armies in sight with their transit, such as "Ilsa Oakhand · 4d to Ashfen". It mutes transit
    arrows.
  - **Pinned:** it mutes the pin layer.
- **There is no scout eye and no Scouts mute.** Scouting is a normal order, not one of docs/07's exceptions, so it gets no glyph to
  mute. The record's "scout eyes" therefore have nothing to hide.
- **The sections.** Battles and Sighted hide when empty and start collapsed (docs/07: "Empty sections hide").
- **The eye toggle.**
  - It shows on header hover and focus, and always on touch. A struck eye stays visible while its class is muted.
  - Each toggle is a button with `aria-pressed` and a label such as "Hide battle markers on the map", at least 44 px on the phone.
- **A muted class leaves the map only.**
  - Its markers are not laid out or drawn.
  - It stays in the outliner (count dimmed), hover cards, the alerts ribbon and the feed.
  - The tooltip reads "Hidden on the map. Still listed here and in cards."
- **Storage.** The game keeps the mute state in the save's UI block. The mockup keeps it in memory, with `?mute=battles,transit,pins`.
- **Never muteable:** rails, wilds, the hovered and the selected, the planned path and its chips, capitals and Workings.

### 6.4 A Great Working: landmark and chip

- **The mock.** Thornwood casts **The Greening** at Deepmoss at M40 (Y4 M4): "spring in every province of the caster's dominion all
  year; beasts cost half". Slots: `floor(2 / 2) + 1 = 2`.
- **The landmark.**
  - A miniature on its own round base beside Deepmoss's town, placed like the Wellspring: a broad old tree with a green-gold crown
    and a ring of standing stones, at 1.3 × the Wellspring's base.
  - **It is static:** no glow pulse, and no animation frames requested.
  - At Far and Lean-back it is the simplified Far piece.
  - It is public, so it is drawn in fog and kept current. Deepmoss itself stays remembered until M60.
- **On the land.** From M40, provinces under Thornwood's dominion (as remembered, §4) draw the bake in every season. It shows in the
  winters of M46–48, M58–60 and M70.
- **The chip.**
  - At the start of the alerts ribbon, at every width: the Working's colour symbol and "1/2".
  - It is not in the top bar, which scrolls at every common width (§3.1).
  - It shows for every nation, so the player sees the enemy's Working, and it is hidden while no Working stands.
  - Hover: "The Greening · Great Working of Thornwood · since Y4 M4", its effect, "slot 1 of 2", and "Dispel: Unmaking (L6, a
    contest of Lore)".
  - Click centres the map on Deepmoss and opens the card.

### 6.5 Parts, checks, untouched, cost

- **Parts:**
  - **New `p81-tools.js`** (about 330 lines): search (index, field, results, highlights, outliner section); pins (P, list, layer);
    mutes (`view.muted`, header toggles, `rlMutedKind`); the Working (landmark layout, drawing, card, chip). Its data, `WORKINGS`,
    lives in p13.
  - **New `p00e-pass4.css`** (about 80 lines): the search field, the chip, the outliner toggles, tokens, pins, the sticky clock, and
    the controls.
  - **p00c-body** (about 12 lines): the search container, the chip slot, and the mockup controls "Pass 4: On | Off", "Season: Clock |
    Spring | Summer | Autumn | Winter", "Winter frost: Off | On" and "Map: Mockup | Vast probe".
- **Hooks:**
  - p80e keys: `/` and P (2 lines).
  - p80b: the Search, Battles and Sighted sections (empty ones hidden), and the header buttons (about 8 lines).
  - p61 `rlLayout`: the Working's slot after the Wellsprings loop (1 line); muted battle markers and event pieces skipped (2 lines).
    `rlRibbonLay` and `rlControlsLay` take the search field's rectangle (1 line).
  - p62 `rlDrawPieces`: the Working, tacks and pins (1 line).
  - p59 `rlDraw`: the transit arrows' mute (1 line).
  - p80a `resolveTip`: `'working:'` (1 line).
  - All the new chrome is hidden in Painted (v3) and with `?p4=off`.
- **Checks:**
  - **`p4Search()`:**
    - `/` opens a `type="search"` field;
    - typing "3" into it changes neither the speed nor the mode;
    - Shift+Digit7 still picks the Terrain mode, and `?` still opens the key overlay;
    - a query per kind finds its entries, with ≤ 12 highlights;
    - Enter moves the camera and sets the selection;
    - the outliner section shows, and Esc closes the field;
    - names and chips avoid the field.
  - **`p4Pins()`:**
    - P adds a row and a tack (Mid) or a pin (Far);
    - pins are not hit-testable;
    - the layer toggle hides and shows them;
    - unpinning removes both.
  - **`p4Mute()`:**
    - muting each class removes exactly its markers (boxes and pixels), and un-muting restores the hash;
    - cards and the outliner keep the items;
    - empty sections are hidden;
    - toggles carry `aria-pressed` and a label, and are ≥ 44 px on the phone.
  - **`p4Working()`:**
    - none before M40;
    - from M40, the landmark sits beside Deepmoss clear of names and pieces, and requests no animation frames;
    - the chip's text and count are right, and it is visible without scrolling at 390, 1024, 1280, 1440 and 1920 px;
    - in winter, Thornwood-dominated pixels equal the bake's, and the others equal the winter variant's.
- **Untouched:** the outliner's existing sections and rows, the alerts ribbon's alerts, the Codex search, and the key table except `/`
  and P.
- **Cost:** the search index builds in ≤ 1 ms, and a keystroke takes ≤ 1 ms. A highlight is live: 1 to 5 ms. Pins and mutes add no
  raster.

---

## 7. Scale: the Vast map (up to 270 provinces), measured

### 7.1 The probe

- **What it is.** The current build copied to `vast/`, with 236 provinces, 242 cells and 661 edges, at the same province size
  (median diameter 176.4 against 175.2) and texel density (bake 4096 × 2346).
- **What it changes in p10b (6 lines):**
  - sites and size: 22 × 11 on 3200 × 1833 units;
  - capitals at (460, 953) and (2760, 862);
  - realm sizes of 40 and 36;
  - fog: 60 provinces unexplored and 20 out of sight.

  In the build, the `?map=vast` constants go in p10b, where `W`, `H`, `COLS` and `ROWS` are `const`s; p58a sets the bake size.
- **Why 236 and not 270.** The id raster is 8-bit with 255 meaning "off the model", so it stops at 254 cells. **270 needs 16-bit
  ids.** map-relief's RG8 id texture holds them, but its 256 × 1 owner and visibility palettes must become 512 × 1.
- **Two nations only.** The mock hard-codes `red` and `green` (in `rlGlow`'s banner table and in `pathTo`), so eight-nation density
  is untested: 8 capital names, the 48-token cap, and 8 banners at Lean-back. The banner swap of §1.6 is the colour proxy.
- **`vastq/`** is the probe with a quarter-resolution bake (1024 × 586).

### 7.2 Per province

- **The bake:** 77 ms of CPU per extra province over a fixed 3.5 s, about **24 s for 270 provinces** at today's density in the
  mockup. In the game the colour passes run on the GPU. The CPU steps left (id, warp, height weights, water, mode relief) come to
  about 2.8 s at 270 on a laptop, and 8 to 14 s on a phone at map-relief §10.4's 3 to 5×.
- **A static re-render** at Far, Mid and Near costs about 0.2 to 0.4 ms per province in view, over a screen-bound 50 to 90 ms: 79 to
  168 ms on the probe. The game's composite is one GPU draw (map-relief §10.2).
- **A cached frame** stays 0.4 to 0.6 ms (1.5 to 2.2 ms with a flush) at both sizes.
- **Memory.** Canvases grow from 57 to 114 MB, CPU rasters from 48 to 177 MB, and the heap from 125 to 391 MB. A season variant adds
  about 96 MB on the probe (§3.3).

### 7.3 What the Lean-back pass and the bake must do

1. **Lean-back is its own pass with a cached chrome layer:** 10.2 ms on the probe at its least zoom, against 95.4 ms today. A zoom
   settle redraws the chrome (56.2 ms) once.
2. **Month changes at Lean-back** touch only the wash (dirty provinces; 1.9 ms for all) and, on a visibility change, the overview's
   fog. Lines re-solve only on an ownership or fog change.
3. **The overview comes first.**
   - The quarter-resolution natural bake of the probe took 2.5 s of CPU, against 21.8 s at full resolution. Its page was ready in 6.3
     s, against 26.6 s.
   - **In the mockup,** the first frame of a Vast map comes from that overview, through one hook in p58b's first line
     (`const BW = out.reqBW ?? RL_P.bakeW`). The generators write into `out` and read `RL_P.bakeW` once, and p58w reads only
     `RB.ver`, so this is likely to work.
   - **Fallback:** Lean-back uses the full bake's quarter mip, and the overview-first order stays a game design item.
4. **GPU memory at Vast.**
   - A whole-map bake at today's density (4096 × 2560 RGBA8 with mips) is 56 MB instead of 14. That takes the map from about 59 MB
     to about 101 MB.
   - docs/06's 96 MB is the budget for a Large 4-nation map, and map-relief §10.3 keeps "one 2048 × 1280 bake on every device". Which
     applies to Vast is **owner question Q8**:
     - **(a)** the one-bake rule: 14 MB, with the land half as sharp at Near on a Vast map;
     - **(b)** the whole map at mip 1 (14 MB with its mips), plus full-density tiles near the view at Near only. 4 to 6 tiles of 1152²
       (1024² plus a 64-texel apron) without mips, at 5.3 MB each, add 21 to 32 MB.
   - `design.md`'s "8 tiles, 45 MB" was wrong: 8 tiles with mips take 57 MB, more than the bake they replace.
5. **The record's gate** ("the overview band holding 60 fps") becomes `p4Scale()`. On the probe at its least zoom, and on the
   mockup's map at the phone's Fit and at 1024 × 768:
   - Lean-back static ≤ 12 ms at a fixed zoom;
   - a zoom settle ≤ 65 ms;
   - a cached frame ≤ 2 ms;
   - bake, overview, variant and line-solve times and memory reported.

---

## 8. The density budget per band, and muting

Counts are the most drawn on the land in a 1440 × 900 view; scale them by view area for other windows. The rule stays: no name over
a name, piece, chip or rail, at any band.

| | Lean back (below 44 px) | Far (44 to 70) | Mid (70 to 180) | Near (over 180) |
|---|---|---|---|---|
| **Names** | Capital names ≤ 1 per nation (≤ 8). Region names ≤ 6 (by area, at least 3; none on the phone), by priority. | Capitals, Wellsprings and wilds (Medium 10 to 14; Vast ≤ 24 in view), plus region names below 62 px: ≤ 6, quieter | Far's names without regions, plus the hovered, selected, path and linked (≤ 6 more) | Towns from 180 px; every name from 320 px |
| **Markers** | Working pieces ≤ slots (≤ 5); Wellspring pieces ≤ 9; standing pins ≤ 12; battle markers ≤ 1 per region; transit arrows for visible enemy legs; search highlights ≤ 12 | The same; battle markers at towns only, as now | Plus battle markers everywhere and scenery ≤ 3 per province; pins as tacks | Plus guards ≤ 2 and spring stones; scenery ≤ 10 per province |
| **Pieces** | Army tokens ≤ 1 per region per nation in sight (cap 48), with plates only from 4; capital pieces ≤ 8 | Towns (step 4 or more), plus 1 army piece per nation per province (≤ 100 armies, docs/06) | Plus muted hamlets from 220 px, as now | Everything |
| **Lines** | Today's rails; Far's lines (faint in Natural, the floor in Clear, the Terrain mode and the data modes); the frontier hem and dots; the river at ≥ 2 px with bank lines where needed | Rails, glow, faint lines, the river | Plus internal keylines; bridges with stubs; roads only by exception | Plus faint roads |
| **Chips** | Path chips (a crossing folds into the day chip); numbers ≤ 1 per region | Path chips; numbers ≤ 1 per province | Same | Same |

**What pass 4 adds to the start view** (96 px, M3, nothing hovered):
- the Stagflow and its 4 bridges with stubs;
- Sunmere's brass tack in its Wellspring's base;
- the season glyph in the clock.

The land is the bake, pixel for pixel. There are no region names (gone from 70 px), no roads (Mid shows them only by exception), no
crossing chip until a march is planned, and no Working before M40.

**Measured today:** on the mockup's map, 6 names at Far, at the start view and at Mid 140; 8 at Near 250; all 59 at Near 400. Towns
8; army pieces 4.

**`p4Density()`** checks every band against the table on both maps. It asserts that the start view's canvas differs from `?p4=off`
only inside the river's, bridges' and tack's boxes. It also reports the drawn line length per band (rails, lines, rivers, roads)
against today's, as a measure for "clean".

**Muting and the budget:**
- A muted class drops out before layout, so names and chips may take the room. Muting never raises a cap.
- A muted marker stays in hover cards, the outliner (dimmed) and the alerts.
- What is never muteable (§6.3) is never counted as muteable room.
- Live names (hover, link, search) follow the six-spot rule and never push a placed name.

---

## 9. Parts plan

### 9.1 New parts, in `build.sh` order

| Part | After | Lines (estimate) | What |
|---|---|---|---|
| `p00e-pass4.css` | `p00d-relief.css` | 80 | Search field, Working chip, outliner toggles, tokens, pins, sticky clock, controls |
| `p13-p4-world.js` | `p12-edges.js` | 280 | `P4S` and `?p4=`, `P4_RULES`, and function declarations only. Lazy builders: regions (first draw, after p54) and rivers, fords, roads, bridges and cut state (first `legDays` call; p10b and p12 data only). Also `legDays`, `rlSupplyPath`, `WORKINGS` and the value noise. |
| `p58s-seasons.js` | `p58w-natural-wilds.js` | 190 | Season variants, `rlLkFor`, `rlEnsureSeason`, the frost control, the Greening clip |
| `p64a-regions.js` | `p63-relief-labels.js` | 220 | Region names: fit, cap, priority, hover, card |
| `p64b-leanback.js` | `p64a-regions.js` | 300 | The Lean-back band: switch, chrome cache, overview, wash, tokens, layout `'L'`, numbers |
| `p65-waters.js` | `p64b-leanback.js` | 270 | Rivers and banks, bridges and stubs, roads by exception, the ford tick, the supply path |
| `p66-memory.js` | `p65-waters.js` | 140 | Fog as memory (pure function of M), mock events |
| `p81-tools.js` | `p80b-outliner.js` | 330 | Search, pins, muting, the Working and its chip |
| `p90a-pass4-checks.js` | `p89-pass2-checks.js` | 230 | `p4Bands`, `p4LeanBack`, `p4Regions`, `p4Seasons`, `p4Memory` |
| `p90b-pass4-checks.js` | `p90a-pass4-checks.js` | 230 | `p4Waters`, `p4Supply`, `p4Search`, `p4Pins`, `p4Mute`, `p4Working`, `p4Density`, `p4Scale`, `p4Off`, `p4Isolation`, `p4Determinism`, `p4Checks` |

### 9.2 Hooks into existing parts

Each hook is re-applied to pass 3's version of the part. Pass 3's massif edits p58m, p58w, p59, p59b, p59c and p89, the same parts
pass 4 hooks, so step 0 re-counts every length. Every part stays under 400 lines. Parts already over 400 (p61a 669, p50 631, p52
453, p55 452) are not touched.

| Part (lines today) | Hook lines | What |
|---|---|---|
| `p00c-body.html` (133) | about 12 | Search container, chip slot, four mockup controls |
| `p10a-icons.js` (62) | 5 | Season glyphs ×4, half wheat |
| `p10b-core.js` (206) | 6 | `?map=vast`: sites and size, capitals, realm sizes, fog |
| `p20-time.js` (92) | 1 | `pathTo` uses `legDays` |
| `p30b-provtip.js` (40) | 6 | Region link, "as of" line, crossing and supply projection, "Roads:" row |
| `p58a-relief-base.js` (164) | 1 | Bake size from `?map=vast` |
| `p58b-relief-shared.js` (153) | 1 | `out.reqBW` / `reqBH` (overview first) |
| `p58d-relief-water.js` (123) | 2 | Overview first in the scheduler; season prefetch |
| `p59-relief-draw.js` (221) | about 13 | Lean-back early path and `RL_LAST_LAYOUT`; `rlStaticSig`; `rlLkFor` in `blitLook` and `rlWashSync`; the season blend; rivers and bridges; region paint and hover; supply path and hovered roads; transit mute |
| `p59b-relief-lines.js` (317) | 8 | River edges (faint skip, floor to banks, rail inset); `rlGroundSides` and `rlWildRimMap` through `rlLkFor`; `rlLineCtx` season and Lean-back key; `rlStateOf` lean wash |
| `p59c-relief-detail.js` (87) | 1 | Winter crown strength |
| `p60-draw.js` (394) | 1 | `updateZoomChip` reads `rlBandName()` |
| `p60b-modes.js` (29) | 2 | Supply factor; legend |
| `p61-relief-pieces.js` (267) | 6 | `rlHouseGround` via `rlLkFor`; `RL_SEATG` season key; the Working's slot; muted battle markers and events; the search field in `rlRibbonLay`/`rlControlsLay` |
| `p62-relief-figures.js` (263) | 5 | Lean tokens; kind `'region'`; half wheat in `RL_STATUS`; Working, tacks and pins |
| `p63-relief-labels.js` (97) | 4 | `legDays`, bent points, ford tick and day-chip text; region glyph boxes in `rlNameBoxes` |
| `p80a-tips.js` (95) | 1 | `'region:'`, `'river:'`, `'bridge:'`, `'working:'`, `'rtok:'` tips |
| `p80b-outliner.js` (53) | 8 | Search, Battles and Sighted sections (empty ones hidden); header toggles |
| `p80c-sel.js` (89) | 1 | "As of" chip |
| `p80d-rest.js` (231) | 8 | Glyph before the date; `rlEnsureSeason`; `RAW.zoom`; region and water hit before `provinceAt`; toast |
| `p80e-start.js` (207) | 2 | Keys `/` and P |
| `p88-natural-checks.js` | 2 | Look argument for `rlNatChroma` and `rlSnowCheck` |

`p60-draw.js` is at 394 lines and takes one line. If pass 3 grows it, `p64b` re-binds `updateZoomChip` instead (a function
declaration), as `p66` re-binds `deriveMonth`.

---

## 10. Checks added to `window.__mock` (`p90a`, `p90b`)

| Check | What it asserts |
|---|---|
| `p4Bands()` | Band names at sampled D px; enter below 42 and leave above 46; a 150 ms time fade (0 under reduced motion); no resting zoom with both passes drawn; `bandOf` unchanged; `?p4=off` has no lean band |
| `p4LeanBack()` | §1.6: removed layers; the owner's line rule in every look and mode; rails in every look, ratio, season and banner, and once with labels on; tokens and plates; names and rails; hover; real-path cost; Clear without wash; pass 3's phone checks |
| `p4Regions()` | §2.4: partition, sizes, connectivity, names and prefixes, viewer independence, the ±30° spine, the cap and priority, fit share, 0 overlaps, fill contrast, none on the phone or from 70 px, the card |
| `p4Seasons()` | §3.4: M3 equals the bake; per season chroma, snow, rails, lines, wild edges, shifts and readers; Clear and Terrain invariance; the clock and its visibility at five widths; the fade; the frost control; Supply factor; ≤ 2 variants |
| `p4Memory()` | §4.3: snapshot keys, "as of", scrubbing, the M59/M60 difference, the fog guard, unexplored unchanged, no ghost pieces, previews from memory |
| `p4Waters()` | §5.5: river rules and form, bank lines and floors, rails clear of water at Near, bridges and stubs, roads by exception, leg days, day-chip text, `acrossTarget` and `closedTarget` reported |
| `p4Supply()` | §5.5: the share against an independent BFS, the solid line and halo at 3:1, cross-bars, chip text, half wheat, preview line |
| `p4Search()`, `p4Pins()`, `p4Mute()`, `p4Working()` | §6.5 |
| `p4Density()` | §8's counts per band on both maps; the start view differs from `?p4=off` only in the river's, bridges' and tack's boxes; line length per band against today's |
| `p4Scale()` | §7.3's targets on the real path; bake, overview, variant and line-solve times and memory |
| `p4Off()` | With `?p4=off`, canvas hashes at the start view, Far, Mid, Near and the phone's Fit equal the baselines step 0 records on pass 3's build; Painted (v3) hashes equal the v3 sameness check's |
| `p4Isolation()` | Each feature flag alone changes nothing outside its scope (hashes at four zooms) |
| `p4Determinism()` | Two loads give equal regions, rivers, roads and season variants. A source scan of the new parts finds no `Math.random` or `Date`. In `p13`'s rule-bearing functions it finds no `Math.sin`, `Math.cos`, `Math.exp`, `Math.log`, `Math.pow` or `Math.atan2`, and no call to `noise` or `wet`. Every identifier the lazy builders read at p20's load is declared in p10b or p12. |
| `p4Checks()` | Runs all of the above; `reliefChecks()` and pass 2's and pass 3's checks run unchanged, with pass 4 on and off |

---

## 11. What stays untouched

- **Painted (v3), pixel for pixel.** Every pass-4 path is gated on `P4S.on`, and the new chrome is hidden.
- **The natural view with `?p4=off`,** pixel for pixel against step 0's baselines.
- **The start view's land:** spring is the bake.
- **Determinism:** seeded streams only; no `Math.random` or `Date`; rule-bearing data without transcendental calls; map data
  independent of the viewer.
- **The sim and the repo:** no file in `/home/user/Fluid-Magic-` changes. The mock rules sit in `P4_RULES` for later phases.
- **Pass 2 and pass 3:**
  - the faint-line rule and its floors, the Far relief, the wilds and their edges, and the line solver (fed the shown variant through
    one accessor);
  - their checks, re-run with pass 4 on and off.
- **The approved fog values, rails, glow (outside Lean-back), data-mode colours, the Terrain mode's fills and Clear's fills.**

---

## 12. Owner questions (defaults in bold; the build follows the defaults)

1. **Q1. Realms as washes at Lean-back?** The record asks for washes; the owner's direction says "rails and glow".
   - **Default: yes, at Lean-back only, in Natural and Ownership mode: a 0.28 banner wash in place of the glow, with today's rails and
     faint lines kept.**
   - The wash does not tell realms apart for a protanope (the two mock banners differ by only 4.3–8.7). The rails, capital names and
     token rims do.
2. **Q2. Winter frost on passable land?**
   - **Default: no frost.** Winter reads through bare woods, ploughed fields, dulled grass and the clock.
   - The "Winter frost" control shows Mountains-only frost at Mid and Near, to judge by eye. Today's frost colour is nearly
     indistinguishable from pass 3's shaded snow (2.1 / 1.3).
3. **Q3. Fog as memory,** which changes map-relief §9.1 and needs a last-seen record per nation in the sim? **Default: yes. Looks
   and card values come from the last sight, dated "as of". Armies are not remembered on the map; the card names the last army seen
   there.**
4. **Q4. One army token per region per nation at Lean-back?** **Default: yes, on round bases, with a count plate only from 4. Every
   army stays in the token's card and the outliner.**
5. **Q5. Rivers and bridges drawn now; roads only by exception?** **Default: yes in the mockup, behind the pass-4 switch. Roads show
   in Supply mode, along the planned path, on hover or selection, and at Near. In the game all three arrive with their rules (M2) and
   never before.**
6. **Q6. Region names: where and how many?** **Default: Lean-back and Far below 62 px; at most 6 in a 1440 × 900 view (fighting
   first, then yours, then the largest); 11 to 12.5 px, quieter than capital names; none on the phone.** Judge it on the Far 53.7 px
   shot, the owner's desktop least zoom.
7. **Q7. Departures from the record** (rulings, listed so the owner sees them):
   - Lean-back keeps today's rails and faint lines, where the record "removes rails".
   - Region names use the relief's light lettering, not "parchment".
   - Unexplored land stays haze, not parchment.
   - The clock shows a season glyph, with the word in its tooltip, not "Y1 Spring M3 D14".
   - The Working's chip leads the alerts ribbon, not the top bar.
   - Scouts carry no eye glyph to mute.
8. **Q8. Texel density on a Vast map?** **Default: one 2048 × 1280 bake on every device (map-relief §10.3), so a Vast map is about
   half as sharp at Near.** The alternative is full-density tiles near the view at Near, about 21 to 32 MB more. Shots at Near 250
   show both.

---

## 13. Review responses

Every change in both reviews is taken except the parts below.

**Owner-eye review (`review-owner.md`):**
- **3, "none below 32 px": taken for the phone, not as a zoom floor.** The floor's reason was that names did not fit, measured at
  0.28 em tracking and 15 px.
  - Under the final rule (11 to 12.5 px, 0.12 em, ±30° spine, 25% overrun), 82% of the Vast probe's regions can carry a name at its
    29.4 px least zoom (§2.2). A 32 px floor would blank region names on a Vast map's least zoom on desktop, which is where the band
    is most used.
  - The cap of 6 and the priority keep that view clean. None show on the phone, the case the floor was for.
- **3, "fill at 0.65, a lighter halo": taken in part.** The names are quieter by size, a dimmer fill (#D8D1C1) and the cap, and the
  halo (.75) is lighter than capital names'.
  - Lowering the fill's alpha or the halo would fail the 4.5:1 text contrast the feasibility review asks for: the fill alone is
    2.59:1 on pale wasteland.
  - The cap of 6 is also applied at Far, so the owner's desktop least zoom gains at most 6 names, not 8.
- **6, the frost control: taken, with Mountains only.** The feasibility review measured frosted Hills at 4.6 from Wasteland under
  protanopia, so the control never frosts Hills.
- **7, the optional faint lines at Lean-back: taken as the default.** The owner's rule covers them, the zoomed-out reference keeps
  every outline, and Clear and the Terrain mode need the same loop anyway. Q7 therefore lists no line deviation.
- **11, the compact Working chip: taken, but at the start of the alerts ribbon.** The top bar scrolls at every width under 1920 px,
  and the chip must be visible.
- **14, "put this side by side in pass 3's checks": taken as pass 4's shot.** Pass 3 is in flight and read-only to this pass. Pass
  3's phone checks gate step 6 instead.

**Feasibility review (`review-feasibility.md`):**
- **1, "faint lines vanishing in Natural at Lean-back: add it to Q7": superseded.** Lean-back keeps Far's line set, so there is no
  deviation to list.
- **3, "snap the lean weight": superseded by the owner review's change 5.** The band switches at 44 ± 2 px and cross-fades by time,
  so no resting weight exists to snap.
- **5, "fade or pop": settled by the same change.** Names are in the static layer and fade with it over 150 ms.
- **6, sizes and targets: taken in part.**
  - Far uses the owner's 11.5 to 12.5 px, not 12.5 to 14: it is quieter, and all 8 fit at 53.7 and 62 px. Lean-back caps at 12.5
    px, not 13, so a region name never outweighs a 12 px bold capital name.
  - "At least 80% of regions named at 29.4 and 36.7 px" becomes "every region the cap selects is placed", with the fit share
    reported. The cap shows at most 6.
  - "At most 4 on the phone" becomes none, on the owner's eye.
  - The overrun limit is the owner's 25% (80% of glyph centres inside), using v3's 60% test code with the stricter threshold.
- **12, "beads with a halo": the halo and the edge-crossing geometry are taken; the beads are not.** The owner review's solid line
  replaces them, because dots are exactly fog's grammar.
- **13, "below 1920, the pennant moves": simplified to the ribbon at every width.** The clock is pinned to the bar's end, so the
  season glyph needs no second home beside the pause button.
- **18, pins on touch: the "not hit-testable" option is taken,** rather than 44 px hit areas that would overlap the seat's.

---

## 14. Build steps (in order)

Each step ends with `p4Checks()` so far, pass 2's and pass 3's checks with pass 4 on and off, and a rebuild with 0 page errors.

0. **Rebase on pass 3.**
   - **Parts:**
     - snapshot pass 3's landed parts and build;
     - `p13` with `P4S`, `?p4=`, `P4_RULES` and empty builders;
     - `p00c`'s four controls;
     - a `p00e` skeleton;
     - `p90a` and `p90b` with `p4Off`.
   - **Checks:** `p4Off()` against the new baselines; pass 3's checks.
   - **Done when:**
     - pass 3 has landed and its checks pass on the snapshot;
     - baseline hashes (start view, Far, Mid, Near, the phone's Fit, Painted (v3)) and real-path times are recorded;
     - every hooked part's length is re-counted;
     - `p4Off()` passes with `p13` present.
1. **World data and the probe.**
   - **Parts:**
     - `p13`'s lazy builders (regions with split and name rules; rivers with value noise; fords, roads, bridges and cut state;
       `legDays`; `rlSupplyPath`; `WORKINGS`);
     - the `p20` hook;
     - `p10b` and `p58a` for `?map=vast`.
   - **Checks:** the data halves of `p4Regions()`, `p4Waters()`, `p4Supply()` and `p4Determinism()`, on both maps; `acrossTarget` and
     `closedTarget` reported.
   - **Done when:**
     - the mockup's map gives the §2.1 table and the Stagflow (10 edges, 4 bridges, 15 road edges), equal to `final/p4world-r2.js`;
     - the probe gives 34 regions of 5 to 9 and 4 rivers;
     - two loads are equal;
     - pass 2's checks still find their targets.
2. **Seasons and the clock.**
   - **Parts:** `p58s`; hooks in p59, p59b, p59c, p61, p60b, p80d, p88 and p10a; the sticky clock in `p00e`.
   - **Checks:** `p4Seasons()`.
   - **Done when:**
     - M3 equals the bake by hash;
     - all four seasons pass every relief check on their own variant;
     - the frost control is Off by default and reports its snow distance;
     - the date and glyph are visible at the five widths.
3. **Fog as memory.**
   - **Parts:** `p66`; hooks in p30b and p80c.
   - **Checks:** `p4Memory()`.
   - **Done when:**
     - the scrub test is equal;
     - Deepmoss's M59 and M60 boxes differ;
     - the fog guard holds;
     - no ghost pieces.
4. **Rivers, bridges, roads and the supply path.**
   - **Parts:** `p65`; hooks in p59, p59b, p63, p62, p30b, p80d, p80a and p20; the half wheat in p10a.
   - **Checks:** `p4Waters()`, `p4Supply()`, `reliefLines()`, `reliefRails()` (start view, Near 250, Near 400), `reliefDayChips()` and
     `reliefHoverChips()`.
   - **Done when:**
     - the start view differs from `?p4=off` only in the river's and bridges' boxes;
     - no rail pixel lies on water;
     - every bank passes the 20 / 12 or 2.3:1 rule;
     - the day chip reads "6d · ford +2" on a crossing leg.
5. **Named regions.**
   - **Parts:** `p64a`; hooks in p59, p80d, p80a, p30b and p63.
   - **Checks:** `p4Regions()`.
   - **Done when:**
     - at 53.7 px on the mockup's map, at most 6 names show, all fitting, and none over a label, piece or rail;
     - none show from 70 px or on the phone;
     - the fill passes 4.5:1.
6. **Lean-back.**
   - **Parts:** `p64b`; hooks in p59, p59b, p62, p63, p60 and p80d.
   - **Checks:** `p4Bands()`, `p4LeanBack()`, the Lean-back half of `p4Scale()`, and pass 3's phone checks at Fit.
   - **Done when:**
     - on the probe at 29.4 px and on the phone at 26.6 px, the real-path static is ≤ 12 ms at a fixed zoom, a settle ≤ 65 ms, and a
       cached frame ≤ 2 ms;
     - `rlRailCheck` gives 0 fails in every look, mode, ratio, season and banner;
     - the line rule holds in every look;
     - no resting zoom shows two passes.
7. **Tools and the Working.**
   - **Parts:** `p81` and `p00e`; hooks in p80b, p80e, p61, p62, p59 and p80a.
   - **Checks:** `p4Search()`, `p4Pins()`, `p4Mute()`, `p4Working()`.
   - **Done when:**
     - typing in the search field never changes the speed or mode;
     - pins are tacks at Mid and are not hit-testable;
     - empty sections are hidden;
     - the Working's chip shows at the five widths and the landmark requests no frames.
8. **Scale.**
   - **Parts:** the overview-first hooks in p58b and p58d; a probe run at a 2048-wide bake, for Q8.
   - **Checks:** `p4Scale()`.
   - **Done when:**
     - the probe's first frame comes from the overview, or the fallback is recorded;
     - every §7.3 figure is reported;
     - Near 250 is shot at both densities.
9. **Density and isolation.**
   - **Parts:** none new; tune within the specified limits (road alpha, region-name fill, token spacing).
   - **Checks:** `p4Density()`, `p4Isolation()`, `p4Determinism()`, `p4Off()`.
   - **Done when:** every band holds §8's budget on both maps, and each flag alone stays in its scope.
10. **Rebuild, run and shoot.**
    - **Parts:** none.
    - **Checks:** every check, old and new, with pass 4 on and off.
    - **Shots:**
      - the start view (pass 4 on and off, side by side) and in each season;
      - Far at 53.7 px (1440 × 900);
      - the Vast probe at 1440 × 900 at its least zoom;
      - the phone's Fit today against Lean-back, side by side;
      - winter Mid with frost Off and On;
      - Deepmoss at M59 and M60;
      - a crossing preview;
      - Supply mode with Varo and with Dravik;
      - search, pins and a muted class;
      - the Greening at M47;
      - the probe at Near 250 at both bake densities.
    - **Done when:** every check passes, every shot has been looked at and judged against "It's not cluttered it's clean", and the
      deviations from this design are recorded at the foot of this file.

---

## 15. Risks and what was not verified

- **Not built, not shot.** The looks of the seasons, rivers, banks, region lettering, tokens and the Working are specified, not seen.
  Their numbers are limits for the checks.
- **The line cost at Lean-back.** Far's faint lines at Lean-back are estimated at 1 to 3 ms warm. A cold solve is +95 ms on the probe
  on an ownership or fog change. The fallback is a cached line layer (§1.7).
- **The frost colour** may find no value that passes against pass 3's snow. The control then says so (§3.2).
- **The sticky clock** relies on Chromium pinning an overflowing flex item. The fallback is an inner scroller (§3.1). It also fixes a
  defect that predates pass 4, which pass 3 or the base may prefer to own.
- **Region-name fit** was measured on centroid spines without collisions (`final/out-regfit-final-*.json`). The build measures it on
  `regionSpines` with the layout's avoid set.
- **The probe stops at 236 provinces and two nations.** The figures for 270 provinces and eight nations are extrapolated, and the
  banner swap stands in for eight banners.
- **Pass 3's massif** re-decides its quiet edge from rendered pixels on every static re-render: pans took 850–932 ms in pass 3's
  judge. If that lands, Lean-back draws the contour cached per bake, fog and season, never decided per render.
- **The machine.** Software raster on 4 cores; static medians vary by about ±25% between runs.
- **The `/` key** on layouts where it is Shift with a digit falls back to the outliner button and the Codex search.

---

## Appendix: files (under `visual-v4/natural/pass4/`)

| File | What |
|---|---|
| `mid-game.md` | The record, copied from the remote branch (input) |
| `design.md` | The first design (superseded by this file) |
| `review-owner.md`, `review-owner/` | The owner-eye review and its probes (region fit, viewports) |
| `review-feasibility.md`, `review-feas/` | The accessibility and feasibility review and its probes (real-path Lean-back, colour, memory, top bar) |
| `final/p4world-r2.js` | Reference for `p13`: regions from the lowest id with split and name rules; rivers with seeded value noise; fords, roads, bridges, leg days, supply ("1 hop") |
| `final/out-world-r2-snap.json`, `final/out-world-r2-vast.json` | Its outputs on the mockup's map and the Vast probe |
| `final/regfit-final.tmpl.js`, `final/regfit-final-*.js`, `final/out-regfit-final-*.json` | Region-name fit under the final rule |
| `snap/` | Snapshot of the current build (md5 `fed36962…`) |
| `vast/`, `vastq/` | The Vast probe (236 provinces), and the same at a quarter-resolution bake |
| `tools/measure.cjs`, `tools/run-proto.cjs`, `tools/run-vp.cjs` | Measurement and prototype runners |
| `proto/`, `out/` | `design.md`'s prototypes and measurements (`proto/p4world.js` is superseded by `final/p4world-r2.js`) |
