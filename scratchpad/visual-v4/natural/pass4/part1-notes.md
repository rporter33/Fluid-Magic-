# Pass 4, part 1: build steps 0 to 4 (work notes)

Design: `design-final.md` §14, steps 0 to 4, built with the recommended defaults. Page: `../map/game-screen-v4.html`, built by
`../map/build.sh` from `../map/parts/*`; final md5 `b3c755b3…` (copy in `part1/out/page-s10.html`). Before: the pass-3b page,
md5 `0ca3a196…`, kept with its parts and `build.sh` in `part1/before/`. All measures are on a shared, noisy 4-core machine
(load average 8 to 12 during the final runs, from another agent's work); times vary by ±25% or more between runs.

`?p4=off` restores the pass-3b page pixel for pixel. `?p4=-feat` turns one feature off and a bare `?p4=feat` keeps only that one
(features: `lean`, `regions`, `seasons`, `memory`, `waters`, `tools`, `working`). `?map=vast` loads the 236-province test map.

## What was built, per step

### Step 0: rebase on pass 3b

- `p13-p4-world.js` (new): `P4S` parsed from `?p4=`, `p4(f)`, the record's mock rules (`P4_RULES`), and (step 1) the world builders.
  `body.p4off` hides every pass-4 control.
- `p00c` (4 lines): the four review controls (Pass 4 on/off, Season, Winter frost, Map). Pass 4 and Map reload the page with the
  query; Season and Winter frost act live. `p00e-pass4.css` (new, 9 lines): pass-4 chrome hidden in Painted (v3) and with `?p4=off`.
- `p90a`/`p90b` (new): `window.__mock.p4Off()` against recorded pass-3b baselines (start, Far, Mid, Near at 1440 × 900 in Natural
  and Clear, the phone's Fit at 390 × 844 @3, Painted (v3)), and `p4Checks()` running every pass-4 check.
- Baselines (pass-3b page): Natural 1440 start `94ed8b25`, Far `310ae96c`, Mid `2d95d549`, Near `2c806cbf`; Clear `ecf4c561`,
  `79d2d582`, `e90a98c7`, `49b62335`; phone Fit `eab73d20`; v3 `382761f8`, `651396dd`, `09cfcce4`, `3f8265ba`. 1280 × 720 and
  1440 × 900 @2 have no table entry; there the `?p4=off` hashes are compared with the before page directly.

### Step 1: world data and the Vast test map

- `p13`: lazy `rlWorld4()` (port of `final/p4world-r2.js`): the corner graph without wild edges, corner heights with the seeded
  value noise, rivers with their names, fords, roads from each capital's 2-hop tree over its own land, bridges with the cut state
  (Briardale/Ashfen from M31), `p4Crossing`, `p4BridgeUp`; `legDays(v, w)` (§5.2); `rlSupplyPath(at, nation)` (Dijkstra,
  insertion-order tie-break: "100%, 1 hop from Kharnath", "20%, no friendly path to a fort"); `rlRegions4()` and `regionHolder()`
  (§2.1 split and name rules); the `WORKINGS` mock. Built on the first `legDays` call during p20's load, reading p10b/p12 data only.
  No `Math.random`, no `Date`, never p10b's `rnd`; streams are `rngFor('p4:<seed>:<purpose>:<key>')`.
- `p20` (1 line): `pathTo` uses `legDays`. `p10b` (6 lines) and `p58a` (1 line): `?map=vast` (236 provinces, 4096 × 2346 bake).
- Mockup map: equal to r2. 8 regions (sizes 5 to 9, table below), the Stagflow (10 edges, from the Ashspine's foot between Stagmoor
  and Tormere to the west edge, one realm edge), 15 road edges, 4 bridges (Redholt/Kharnath, Morholt/Briardale, Sunmere/Briardale,
  Briardale/Ashfen cut from M31). Varo: "100%, 1 hop from Kharnath"; 17 reachable provinces, 4 of them across the river without a
  bridge (+2 days). Vast: 34 regions of 5 to 9 (3 splits), 4 rivers (Reedburn 23 edges to the south edge, Wyrflow 18, Wyrrun 18,
  Coldflow 14), 36 road edges, 7 bridges. Pass 2's targets: `acrossTarget` Ashvale and `closedTarget` Karreach, the same with
  waters on and off.

  | Region | Provinces | Terrain | Holder line |
  |---|---|---|---|
  | The Lark Plain | 8 | plains | Held mostly by independents (6 of 8) |
  | The Black Marsh | 8 | swamp | Held mostly by independents (8 of 8) |
  | The Millands | 6 | farmland | Held mostly by independents (6 of 6) |
  | The Gold Plain | 8 | plains | Split: independents 4, the Cinder Horde 4 |
  | The Red Knolls | 9 | hills | Held mostly by independents (9 of 9) |
  | The Deepweald | 5 | forest | Held mostly by Thornwood (3 of 5) |
  | The Ravenholt | 8 | forest | Held mostly by the Cinder Horde (5 of 8) |
  | The Broad Meads | 8 | plains | Held mostly by independents (5 of 8) |

### Step 2: seasons and the clock (Natural only)

- `p58s-seasons.js` (new): the season variants of the natural bake (summer, autumn, winter), derived per texel from the spring
  bake by cover class (grass dries, fields turn to stubble and straw, autumn russet and bark, winter grass and fields muted, reeds),
  with mips; built lazily in 32-row slices (summer 252 ms, autumn 452 ms, winter 398 ms in the final p4Checks run); the shown
  variant fades in over 600 ms (one static render at the change, none during the fade); the next season prefetched in the last
  month of a season. Spring is the bake itself (M3 equals the base hash).
- Hooks: p59 (sync, fade, static signature), p59b/p59c/p59x/p61 (the ground through `rlLkFor`, cache keys with the season),
  p60b and p61 (supply × the season factor), p88 (`rlLkFor` in the natural chroma and snow checks), p10a (four glyphs and the
  half wheat).
- Clear and the Terrain mode never change (hash equal in all four seasons). Frost: off by default, a review control.
- The clock: season glyph before the date; pinned to the top bar's right end (`position: sticky`, `p00e`), so date and glyph stay
  in view at 390, 1024, 1280, 1440 and 1920 px. Tooltip: "Spring: supply +10%, growth +0.1%. Summer in 1 month. …".

### Step 3: fog as memory

- `p66-memory.js` (new, 33 lines): `deriveMonth` re-bound. An explored province out of sight is drawn from its last-seen month's
  derived state (memoised per month), so scrubbing in any order gives the same picture; public things stay live (owner, terrain,
  rivers, roads, bridges, regions, season). No ghost pieces: armies are not remembered on the map; the card names the last army seen.
  The mock adds hidden events (Deepmoss walls at M24 and M44, growth ×1.3 at M36; Redcrag walls at M28) so memory and live differ.
- Hooks: p30b (the card's "Out of sight · as of Y1 M3", "Last seen here", the Seen row suppressed), p80c (the province chip),
  p61 (no ghost armies), p80e (re-derive on toggling).

### Step 4: rivers, bridges, roads and the supply path

- `p65-waters.js` (new, 177 lines): the course (corner graph, Chaikin ×2, seeded meander ≤ 0.04 D, 6 to 9 units, ≥ 2 px floor),
  shore band, lit highlight, mouth falls on the south edge (p59a); bank lines; rails inset clear of the water (p59b `rlInset`
  per edge) with spurs (below); no line pixel on water (destination-out after the static lines; evenodd clip in the live layer);
  bridges with stubs at Mid and Near, the cut bridge from M31; roads in Supply mode, at Near, and on the hovered or selected
  province's own road edges; river and bridge cards on hover; the march thread bent through the ford, the ford tick, "7d · ford +2"
  on the day chip and "(+2 days, crossing the Stagflow)" in the projection and toast; the Supply-mode path (a 2 px wheat-gold line
  over a dark halo, cross-bars at hops, end chip "100%, 1 hop from Kharnath") and "supply after arrival" in the preview; the half
  wheat on tight armies (p62).
- Hooks: p59 (draw order), p59a (falls), p59b (rail inset, bank lines, live clip, spurs, inner line), p62, p63, p30b, p80d, p87
  (the rail check's river inset), p88 (water skip in `reliefLines`), p20.

## The final verification found seven defects; all fixed

The first full runs of the inherited checks with rivers drawn (pages `4a2ce3c4…` and `c991cc96…`) failed where step 4's own checks
had passed, because `p4Waters` tested banks only where the water fails 20 / 12 and rails only at the start view, Near 250 and
Near 400:

1. **Rails at M40** (Morholt/Ashfen, 2 samples at 1.4:1). A realm edge without a river meets a river edge at a vertex; the inset
   lines meet up to 0.4 of the edge back from the corner, so the realm line stopped short of the water. Fix (`rlRailSpurs`, p59b
   1 line): the rail runs on along its own inset line into the water and is clipped at the bank.
2. **Bank lines under the floor in Clear and the Terrain mode** (Sunmere/Briardale, Tormere/Fenvale, Briardale/Ashfen: 1.66 to
   2.29:1, up to 117 samples a view). One key and one alpha per bank could not serve ground that runs from dark to light along a
   bank, or a sliver of the far side's ground lying between the water and the line where the course leaves its border. Fix
   (`rlBankStyle`, `rlBankLine`): per course segment an inner and an outer slot (each the line's width), keys and alphas solved per
   position on each slot's own ground with the line's real best-pixel coverage (`rlCovBest`): the main key alone where it serves
   every position; else the pairing (main inside with the other key as a partner outside, or the other key inside and the main
   outside) that serves the most positions, one pairing along a run of paired segments; an outer line runs a segment past where it
   is needed.
3. **Bank lines over bridges** (2.21:1 against the span's stone). Fix: at Mid and Near the span's footprint is clipped out of the
   bank lines (the bridge reads as lying over the border).
4. **A road over a line** (Briardale/Kharnath internal keyline 3.19:1 under Kharnath's faint road on hover). Fix (`rlRoadGapOut`):
   roads stop 5 px short of the line they cross (on a river, short of the water and its banks).
5. **The hover/selection inner line over the bank lines** (Fenvale, Ashfen: 1.5 to 2.2:1). The inner line ran inside the river
   edge's water inset, on top of the bank lines' outer slot. Fix (p59b `rlInnerLine`, 1 line): on a river edge it clears the bank
   lines too.
7. **Crossed keys under the hover** (Redholt at 1920 × 1080, 2.17:1): the live hover redrew a bank the static layer already drew,
   in the other key, and the two greyed each other. Fix: the hover keeps the static bank's keys (alphas also solved on the tint).
6. **The river's source against the wild's edge** (`reliefWildSweep`: 3 samples at 0.93 of 20 / 12, the Ashspine/Tormere edge at
   the start view's pans and one sweep camera). The Stagflow rises at a corner of the Ashspine's outline, so the water filled the
   land side of the wild edge test (6 to 9.5 px out) and its round cap crossed the outline. Fix (`rlQ0`): a river rising on a wild's
   corner starts 11 px clear of the wild's outline at every zoom (about 0.1 D at the start view, 3 units at Near); its course,
   water, erase, clip, hover and bank lines all start there.

And two check definitions changed (`p90c-pass4-floor.js`, new, 52 lines; p88 1 line), since a river edge's line no longer runs
on its straight edge:
- p90's samplers (`reliefLinesRest`, `reliefLinesFocus`, `reliefLinesSweep`) and p89's (`reliefLinesHover`, the hovered or
  selected province's own bank only) sample a river edge along each bank line drawn at the floor (the focus province's own bank, else every bank not a wild's and not under a realm's rails), every 1 px, ±3 px across,
  at the bank floor 2.3:1 (§5.5), not under a bridge's span; every other edge as before.
- p90's and p88's samples skip points on the water or within 8.5 px of it (7.5 at 2×): p90's 4 px clearance at an edge's end,
  counted from where the line meets the bank lines' outer edge (0.5 + 2 + 2 px past the water). The bank samples keep the same
  clearance at a course portion's ends (the joints).
- The Supply mode's supply path is an overlay like the march thread: it is left out of the line checks' frames (`SKIP 'arrows'`),
  as the thread is. Drawn over a line, it gave Briardale/Kharnath five 1.0:1 samples in `modes.cjs` (Clear, Mid, Supply).
- With the rivers off (`?p4=off`, `SKIP 'p4waters'`, before the bake) the samplers run exactly as before.

## Deviations from the design

- **Rebased on pass 3b** (as asked), not pass 3: baselines and `p4Off` use the pass-3b page.
- **Roads:** "among equal parents the generator prefers one that does not cross a river" is not applied. With it the mockup's map
  has 3 bridges instead of the reference's 4 (`final/out-world-r2-snap.json`, the step-1 "done when"); the r2 reference is kept.
- **Region names on the Vast map:** a grown prefix takes a capitalised suffix ("Ashfall", not "Coldfallholt"); 11 of 34 Vast
  names differ from r2 for that reason. The mockup's 8 names are r2's.
- **Memory mock events:** Deepmoss already has a temple, so its M36 event is growth (population ×1.3) instead of a temple.
- **Frost:** no colour passes the snow-distance rule (20 / 12) against pass 3b's snow and rock. The design's #929DA6 reaches
  4.5 / 4.2; the best calm candidate (OKLCH C ≤ 0.10) is #95CDF7 at 18.6 / 17.7. The control says "Frost: fails the
  snow-distance rule; review only" and is off by default. Its look (shot) is saturated blue blotches with texel-blocky edges at Near:
  not fit to ship as is.
- **Bank lines, bridges, road gaps, rail spurs, the inner line's river clearance, the source's clearance from a wild** (above) are
  additions the design does not describe; they are what makes the inherited floor rules hold on a map with rivers.
- **Check definitions** for river edges in p90/p88 (above).
- **Two inherited harness quirks** handled in the pass-4 checks, both present on the pass-3b page: Painted (v3)'s Near differs on a
  second pass in one load (`dcd54fa9` against `3f8265ba`), so `p4Off()` must run first on a fresh load; and the first fit after a
  camera elsewhere differs from a fresh fit (`d103dd40` against `7d26ecbb` with `?p4=off`), so `p4Memory` calls the start view twice.
- **Hooks over 3 lines** in three parts: p59 (+10 / −6 lines over the season, waters, roads and supply-path sites), p59b
  (+9 / −8 over rail inset, bank lines, live clip, spurs, inner line, ground lookups and cache keys) and p10b (+7 / −6, the Vast
  map's constants). Every part is under 400 lines (largest touched: p59b 306, p65 177).

## Check results (final page `b3c755b3…` and its predecessors; see `part1-handoff.md` for the table)

The page changed four times after the first full run; each change is listed with what was re-run on it. Logs: `part1/out/final6/`
(page `2398e646…`: everything), `part1/out/final8/` (`e129ee21…`: the Supply-mode guard; modes, focus, hashes) and
`part1/out/final10/` (`b3c755b3…`: the hover key lock; the natural suites, session, LP probe). Normal frames are identical on
all three (det4 hashes equal: start `bedca5cf`, Mid `1cb570f0`, Near `ad524fd8`, …); Clear, the Terrain mode, the data modes,
Painted and `?p4=off` do not reach the changed code, so their page-s6 results stand.

- `?p4=off` pixel-identical to pass 3b: Natural, Clear, phone (baseline table), 1280 × 720 and 1440 × 900 @2 (against the before
  page), Painted (v3) 10 views × 2 loads (`v3same`), det4 on `?p4=off`. Pass.
- Determinism: det4 (8 views, bakes, world digest `2c4a940d`) identical over 3 loads Natural, 2 Clear, 2 Terrain mode; 0 page errors.
- `p4Checks()`: regions, watersData, supplyData, determinism, seasons, memory, waters, supply all pass; Vast data checks pass.
- Inherited (`checksx` Natural 1×, 2×, phone, 1280, 1920; Clear 1×, 2×; Terrain 1×, phone; Dominion; Springs): only the failures
  pass 3b already had (Far floor readers; Mid reader at 1920; phone readers; Dominion's readers ERR in the harness).
- `modes.cjs` Natural and Clear 1× (7 modes × 3 views): all pass. `focus.cjs` Natural 1× (7 modes × 7 views, rest, hover,
  select): 49 rows, 0 fails. `sweep.cjs` 1×: 16,904 samples, 0 fails, min 1.135 (pass 3b: 1.135). `session.cjs` Natural: 0
  page errors, 0 failed steps. The LP probe (`linesall.cjs`) and the final page's `checksx` 1×/2×/1280/1920 were stopped at the pause
  (phone finished: pass-3b's reader failures only); on page s8 the LP probe had 1 hover sample under (Redholt, fixed by defect 7).

## Costs (shared machine, load 8 to 12; not re-measured after the fixes)

Before (pass 3b): ready 13.9 s, bake CPU 10.6 s / wall 12.9 s; static flush least 84.6 ms, start 87.3, Mid 140 71.3, Near 250
117.4; cached 1.4 to 2.0 ms; hover 9.4 ms; settles median 19 ms, max 250 ms. Pass 4 adds: world 1.5 ms and regions 1.2 to 2.8 ms
(Vast 4.9 / 31 ms); season variants 250 to 450 ms each, built lazily in slices; memory snapshots 0.1 ms each. Ready times in the
final runs were 14 to 29 s on page s6/s8 under the load, against 12 to 27 s for the pass-3b page in the same runs. A clean
before/after `perf4.cjs` pair was not run (the next step).
