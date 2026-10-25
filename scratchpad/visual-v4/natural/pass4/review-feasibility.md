# Pass 4 design: accessibility and feasibility review

2026-10-23. This review covers `pass4/design.md` (the 23:04 version) for accessibility and feasibility. It checks:
- the colour-blind rules in every band and season (protan, deutan, tritan);
- the realm-border rule;
- label collisions;
- phone width;
- determinism;
- frame and bake cost toward 270 provinces;
- part sizes;
- whether each item can be built in the mockup before the sim rules exist.

**What I read:**
- The record (`mid-game.md`).
- The binding direction: `docs/design/map-relief.owner-answers.md`, `visual-references.owner-direction.md`, `natural/design-final.md` (N3, N7, N10, §8), `docs/07-ui.md`, and `map-relief.md` §3.6, §3.8, §3.9, §9.1 and §10.3.
- Every part the design names, read in `snap/parts/`. All 47 parts are byte-identical to `visual-v4/map/parts/` today.
- Pass 3's in-flight work, read only: `natural/pass3/judge-*.md` and `proto-massif/`.

**What I wrote:** nothing outside `pass4/review-feas/` and this file. `design.md` is unchanged. Paths below are relative to `visual-v4/natural/pass4/`.

**What I measured.** The setup matches the design's: playwright Chromium 1194, software raster, local d3 and Pixi. Each probe is evaluated inside the page by `review-feas/run.cjs`, and its output is in `review-feas/out-*.json`.

| Probe | What it measures |
|---|---|
| `leanreal.js` | The Lean-back pass drawn through the real path: `rlRenderCache` (35% margin, both cache layers, room, table, vignette and rim), the composite and the live layer |
| `leanparts.js` | The same pass, one layer group at a time |
| `leancached.js` | The pass with the chrome cached |
| `regfit.js` | Region-name widths against region spine lengths at Lean-back zooms |
| `colour.js`, `snow3.js` | The new colours, with the page's own CIEDE2000 and Machado matrices (`rlPairDE`) |
| `mem.js`, `topbar.js` | Look memory, mock-world facts, and the top bar at five widths |

---

## Verdict

**Buildable in the mockup with mock data, but not as written.** Every item can be shown before the sim rules exist (table at the end), but seven defects block the build as specified:

1. **Lean-back breaks the owner's line rule.**
   - It removes every province line in Clear, the Terrain mode and the data modes.
   - It drops the selected province's floor lines.
   - It drops the fog frontier's hem (change 1).
2. **The thin rail is outside the measured rail model,** and saves 1 px (change 2).
3. **The Lean-back speed-up is an artefact of how it was measured.** In the real draw path the pass costs 53.5 ms, against 57.5 ms today, on the mockup's map; on the Vast probe it is 58.4 ms against 95.4 ms. The room, the table and the vignette dominate. A cached chrome layer brings it to 9.4–10.8 ms (change 3).
4. **`p13` throws at load where it is placed.** `MED_DIAM`, `REGION_SYL` and `buildRegions` are still in the temporal dead zone, and p20 calls `pathTo` at load (change 4).
5. **The Lean-back layout is stored under its own key.** Chips, live names, the thread and `rlPieceAt` keep reading the last Far layout (change 5).
6. **Region names at the sizes given fit 0% of regions** at the phone's Fit and at the Vast probe's least zoom (change 6).
7. **Winter frost on passable land is 2.1 / 1.3 from pass 3's shaded massif snow.** It also brings frosted Hills to 4.6 from Wasteland under protanopia (change 7).

Changes 8 to 19 are needed for the checks to mean what the design says, or for the phone, determinism and memory figures to hold.

---

## Changes, most important first

### 1. Keep the owner's line rule at Lean-back

The binding text: lines "brighten to the colour-blind floor around the hovered and selected province, and everywhere in the Clear terrain colours setting and the Terrain mode". `rlFaintOn` (p59b l.182) adds that the data modes keep every line at the floor too.

- **Clear, the Terrain mode and the data modes.** At Lean-back, draw neutral hairlines and internal keylines at the floor. That is the existing loop in `rlDrawRails` without `only`.
  - §1.1's removal list and check §1.6.1 (`RL_LINES.drawn` empty) may apply to Natural in Ownership only.
  - Cost: the loop is vector work, about 551 edges on the probe. A cold re-solve measured +24 ms (mockup map) and +95 ms (probe) at the least zoom.
- **The selected province.**
  - Today its floor lines come from the static hairline loop (`faint = faintOn && i !== sp && j !== sp`, p59b l.173).
  - The live layer draws floor lines only for the hovered and linked provinces (p59 l.196).
  - With the loop gone at Lean-back, the selection loses its floor. Call `rlDrawProvFloor(g, sp, px)` in the live layer at Lean-back (1 line in p59).
- **Solve the hover and selection floor on the ground actually drawn.**
  - `rlStateOf` (p59b l.34) knows the dominion wash, the realm tint and fog, but not the new 0.28 realm wash.
  - Add the wash to `rlStateOf` when the lean weight is above 0, and add the lean bucket to `rlLineCtx`'s key (p59b l.142). That is 2 lines, not in the hook list.
- **The fog frontier.**
  - `rlGlow` builds one raster holding both the glow (slot 0) and the frontier hem (slot 1; p59 l.28–45). "The glow is off at Lean-back" therefore also removes the hem, which natural §8.3 added because the frontier was all but invisible.
  - Composite `rlGlow(true)` into the overview. This hem-only raster already exists for the Terrain mode.
  - Keep the dotted 2 / 3 px line on explored/unexplored frontier edges at Lean-back. It is docs/07's non-colour fog cue, and it is cheap because only frontier edges carry it.
- **The owner sees the deviation.** In Natural, faint lines vanishing (rather than staying faint) at Lean-back departs from the owner's answer. Add it to Q7's list.
- **Checks added to §1.6 (`p4LeanBack`):**
  - Clear, the Terrain mode and one data mode at Lean-back: `reliefLines()` reports 0 samples under the floor.
  - The selected province's floor lines are drawn.
  - The hover floor reaches at least 2.3:1 over the wash, on rendered pixels.
  - Frontier edges are dotted.

### 2. Use today's rail at Lean-back, and test it everywhere

- **The thin rail is not natural §8.1's model.**
  - §8.1's "keylines at 0.75, banner solid" (0 fails) is today's `rlW()` below ratio 1.5 (p59b l.9): keylines of 1.5 px, banner 2 px.
  - A 1 px keyline can be covered only 0.5 on an axis-aligned edge, which is worse than the "every line at 0.75" row. That row already fails 534 to 1,604 cases.
  - At ratio 1.5 and above, the "thin" rail of 1 + 1.5 + 1 CSS px is exactly today's rail. The saving is 1 CSS px at ratio 1 only.
  - The prototype's 8.4 ms was drawn with today's bead: `leanbench.js` calls `rlDrawRails(g, 'far', px, { only: i })` with no thin option.
  - So: drop `thin`, which also removes an unlisted edit to `rlDrawRails`. The "fallback" is the design.
- **The washes do not carry colour-blind identity.** Say so in §1.2 and in Q1's text, with the numbers (`out-colour.json`):
  - The two mock banners at 0.28 over the same natural ground differ by 24.8–32.0 under normal vision, but only 4.3–8.7 under protanopia.
  - A Thornwood wash is 1.9–4.5 from bare land under protanopia; a Cinder wash is 1.6–12.4.
  - For a protanope, Lean-back shows realms only by the rails, the capital names and the token rims.
- **Rendered rail check at Lean-back** (`rlRailCheck`, 0 fails) in all of these:
  - Natural, Clear, the Terrain mode and each data mode;
  - device pixel ratio 1 and 2;
  - each forced season;
  - with `BAN` swapped through all 11 banners.

  The mock's two banners are the easy pair (60.1 / 19.5). `BAN` is a mutable object, so the check sets each colour and drops `GLOW`, `MODER` and `RL_LINES.cache` between runs.
- **Region names, tokens and pins never sit over a rail.**
  - v3's lettering refused any spot "never under an owner band" (p57 l.174). The design has no such rule.
  - `rlRailCheck` redraws with labels off (`rlRedraw(['pieces', 'labels', …])`), so it cannot see a name over a rail.
  - Add v3's rule, and run one rail check with labels on.

### 3. Measure Lean-back where it runs, and add a chrome cache

`leanbench.js` drew into a canvas the size of the view, without the room ring or the vignette. The real path draws two cache canvases 1.7× the view in each dimension (2390 × 1394 at 1440 × 900), with the room, the table, the vignette and the rim, then composites them.

Measured (ms, with a pixel flush; medians):

| | Mockup map, 1440 × 900, 53.7 px | Vast probe, 1440 × 900, 29.4 px | Mockup map, phone 390 × 844 at ratio 2, 26.6 px |
|---|---|---|---|
| The design's prototype | 5.7 | 8.4 | — |
| Today's static re-render | 57.5 | 95.4 | 63.4 |
| **Lean-back pass, real path** | **53.5** (38.5–60.9) | **58.4** (52.0–62.3) | **49.3** (44.7–64.5) |
| Room / vignette / table / rim, each alone (including a 2.4–2.9 ms floor) | 14.6 / 13.9 / 12.9 / 4.9 | 19.0 / 14.2 / 10.0 / 5.4 | 19.2 / 11.9 / 8.2 / 4.9 |
| Overview / rails / contours and lip, each alone | 3.0 / 2.7 / 3.6 | 3.1 / 3.7 / 3.4 | 2.6 / 3.2 / 3.9 |
| Region-name layout, each render (`regionSpines` + `layoutOnPath`) | 3.0 | 12.1 | 4.5 |
| **With the chrome cached, names cached** | **10.8** | **10.2** | **9.4** |
| First render, drawing the chrome | 61.6 | 56.2 | 58.3 |
| Cached frame; hover frame | 1.9; 4.3 | 2.0; 4.4 | 1.4; 3.9 |

- **Add a chrome layer.** The room, table, vignette and rim are drawn once per zoom, view size and table setting into their own canvas and blitted 1:1. Lay out the region names once per zoom bucket.
  - Month, fog, selection and wash changes at Lean-back then cost about 10 ms.
  - A zoom settle costs about 60 ms in the mockup. The game composites on the GPU and never pays this.
- **`p4Scale` and check §1.6.6 time the real path:** `RCK = null; draw(); ctx.getImageData(…)`. The 12 ms gate applies at a fixed zoom; a zoom settle is gated at 65 ms.
- **Snap the lean weight.** Below 0.05 it counts as 0, above 0.95 as 1, and in between the chrome is drawn once for both passes. At 1280 × 720 the least zoom sits at a weight of 0.03, and would otherwise pay for both passes.
- **A pass 3 risk.** The massif prototype re-decides its quiet edge from rendered pixels on every static re-render: pans measured 850–932 ms in pass 3's judge. If that lands, Lean-back must draw a contour cached per bake, fog and season, never decided per render.

### 4. Make `p13` lazy: as placed, it would throw at load

The page is one classic script (p00c l.131 to p99). `p13` runs after p12, but the world data needs four things that are declared later:
- `MED_DIAM`, a `const` in p50 l.4. The prototype uses it to space rivers.
- `REGION_SYL` and `buildRegions`, in p54 l.221 and l.230.
- The `relief:` tables, made in p58a.

All of them are in the temporal dead zone while p13 and p20 run. Worse, p20 calls `pathTo` at load (l.85–87, `acrossTarget` and `closedTarget`), and with the `legDays` hook that call reaches the river and road data during p20's own load.

- **What p13 holds.** `P4S`, `P4_RULES` and function declarations only.
- **Rivers, fords, roads and bridges** are built on the first `legDays` call, from p10b and p12 data alone:
  - the median diameter computed locally from `areaOf`;
  - `rngFor` streams, not relief tables.
- **Regions** are built on the first draw (after p54).
- **The `?map=vast` constants** go in p10b, where `W`, `H`, `COLS` and `ROWS` are `const`s (l.39), not in p13 as §9.1 lists.
- **Review targets.** Crossing costs may change `acrossTarget` and `closedTarget`, which are `Ashvale` today. `p4Isolation` should report both with `P4S.waters` on and off, and pass 2's checks that use them must still find their targets.

### 5. Lean-back's layout must be the `'L'` layout

- **Who reads `RL_PIECE_CACHE.get('L')`:**
  - `rlPlacePieces` (p62 l.216);
  - `rlThread` (p63 l.32), `rlArrow` (l.61) and `rlLiveLabels` (l.83);
  - `rlPieceAt` (p61 l.252);
  - the checks in p87 and p88.
- **What goes wrong under a separate `'LEAN'` key.** All of these read the last Far layout:
  - day chips and the new ford chips avoid stale names, and miss region names, tokens and capital boxes;
  - the thread and the transit arrow start at stale piece positions.
  - In addition, the early return in `rlRenderStatic` skips `RL_LAST_LAYOUT = lay` (p59 l.160).
- **Change.**
  - `rlLeanLayout` returns the same shape: `labels` (capital names), `wildOps` (empty), `boxes` (tokens, region glyphs, pins), and `armies` (the tokens, each with `ids` listing every member, so `rlPieceAt` finds a commander's token).
  - It is stored as `'L'` with `lean: true`, and `RL_LAST_LAYOUT` is set on the early return.
  - `rlNameBoxes` (p63 l.29) adds the region glyph boxes at Far as well (1 line, an unlisted p63 hook).
- **Fix the order in §2.2.** Region names are static and path chips are live, so the chips avoid the names, not the reverse.
- **Fade or pop.** The hooks fade only `rlDrawPieces`: `rlPaintLabels` is not faded, and the DOM armies switch to tokens at a weight of 0.5. Either fade labels at 1 − k (1 line in p63) or say that names pop.

### 6. Size region names to the room they have

Measured (`regfit.js`). The regions are BFS groups of 5 to 7 provinces, so the spines are approximate. "Fits" uses the design's own rule: 0.85 × spine ≥ name width.

| D px | Median spine (mockup map / Vast) | Fits at 15 px, 0.28 em (names 142–174 px) | Fits at 12 px, 0.12 em (names 90–113 px) |
|---|---|---|---|
| 26.6 (phone Fit) | 101 / 94 | 0% / 0% | 25% / 3% |
| 29.4 (Vast least zoom) | 112 / 104 | 0% / 0% | 38% / 13% |
| 36.7 (1024 × 768 least zoom) | 139 / 130 | 0% / 3% | 100% / 88% |
| 54 (Far) | 205 / 192 | 63% / 75% | 100% / 100% |

The design sets the largest size (15–18 px) in the band where regions are smallest on screen. In the real-path probe, 0 of 37 names were placed on the Vast probe and 0 of 10 on the phone.

- **Sizes.** Lean-back names 11 to 13 px at 0.12 em; Far 12.5 to 14 px at 0.2 em. The size is min(cap, 0.85 × spine ÷ name width at 1 px).
- **Placement.** A name may run past its region as long as at least 60% of its glyph centres lie inside (v3's rule, p57 l.173). It never crosses a wild.
- **`p4Regions` target.** At least 80% of regions named at 29.4 and 36.7 px; report the share at 26.6 px.
- **Halo.** Use 0.75 at 3 px; the design gives 0.5. Province names use 0.85 and wild names 0.55. The fill alone measures 2.59:1 on pale wasteland and 2.18:1 on a frosted crest. Check that the fill reaches 4.5:1 against the halo-darkened ground below 18 px.
- **The phone budget.** §8 scales caps by view area (0.19 at 390 × 844, so 1.5 names), while §1.6 expects every region named. Pick one: at most 4 region names on the phone, largest regions first.
- **Touch.** A name's hit band is its glyph boxes plus 3 px, about 18 px tall. Make it at least 44 px tall on touch.

### 7. No frost on passable land (Q2's default flips), or at least none on Hills

- **What holds.** `#929DA6` is 23.2 / 22.4 (protan worst) from v4's snow `#F2EEE6`, exactly as the design says.
- **Pass 3's massif.**
  - The massif is the art judge's chosen base, and it adds shaded blue-grey snow: L\* 50–72, b\* −2 to −9 (`proto-massif/parts/p58y-massif-colour.js`: L\* = 72 + 22·sv, b\* = −2 + 7·sv, a\* −0.8).
  - The frost is **2.1 / 1.3** from that snow at sv −0.375, and never reaches 20 / 12 from any shade of it: 16.5 at most (`out-snow-pass3.json`).
  - Pass 3's player judge: "Snow is a categorical cue the design reserves for wilds."
- **The range edge.**
  - Frost at its 0.55 cap over mountain ground is 9.2 / 8.6 from the massif's lit rock `#8A857E`, down from 16.1 / 15.7 unfrosted.
  - map-relief §3.8 rests passable-against-impassable on 16.9 / 16.6, plus the contour, the rim and the snow.
- **Hills against Wasteland**, the case §14 names, now measured under protanopia:
  - frosted hill turf is 13.3 / **4.6** from wasteland ground;
  - frosted hill ground is 10.2 / 7.8.
- **Change.**
  - Default to no frost. Winter reads through bare canopy, ploughed fields, dulled grass and the clock.
  - If the owner wants frost anyway: Mountains only. Measure it against pass 3's final snow range and granite at 20 / 12, and re-decide the wild rim on winter ground (change 9).

### 8. Make spring the bake, and correct the variant memory

- **Why spring.**
  - The time-lapse starts at M3, which is spring. With summer as the bake, every pass-4 load opens on a changed start view, and the start view is where the owner judged "It's not cluttered it's clean".
  - Making spring the identity keeps the approved start view pixel-identical. The start then differs from `?p4=off` only by the waters.
  - The Greening's clip draws the bake itself, so it needs no variant.
  - Summer becomes a mild ripening variant (more ripe and straw strips). Autumn and winter stay as designed.
- **Variant memory.**
  - A look holds washed canvases and unwashed copies: `canvas`, `mip1` and `mip2`, plus `img`, `mb1` and `mb2`.
  - Measured: 26.3 MB per variant on the mockup's map (the design says 13.1), so about 96 MB on the Vast probe.
  - Two kept on the probe is about 193 MB, on top of a 391 MB heap. With the Greening as designed, autumn holds three: autumn, spring and winter.
- **With spring as the bake,** at most two variants exist. The next one keeps only its unwashed `ImageData` (13 MB, or 48 MB on the probe) until it is shown.

### 9. Every reader of the look goes through `rlLkFor`, and the season checks test the variant

- **Direct readers missing from the hook list:**
  - `rlWildRimMap` (p59b l.276) reads `RB.L.natural`, and its key has no season. In winter the wild rim's stretches would still be decided on summer ground: the frost case of change 7.
  - The `RL_SEATG` key (p61 l.260) has no season.
  - `rlNatChroma` (p88 l.10) and `rlSnowCheck` (p88 l.18) read `RB.L` directly. Step 2's "re-run `reliefNatural()` and `reliefSnow()` per season" would test the summer bake four times. Give both a look argument.
- **`p4Seasons` per forced season also runs** `reliefRails()`, `reliefLines()` and the wild-edge check (pass 2's or pass 3's). The rail band rule (natural §8.1) was measured on summer ground quantiles only.
- **The cost of a season change.**
  - The parts: the variant (83 / 255 ms, the design's figure), a full wash composite (113 / 243 ms measured), and a cold line solve (+24 to +46 ms on the mockup's map, +95 to +108 ms on the probe).
  - `rlEnsureSeason` also washes the next variant in idle slices.
  - The 600 ms fade blends two cached static layers instead of re-rendering every frame. The existing look cross-fade re-renders every frame (p59 l.179), which costs about 130 ms a frame at Mid on the probe.

### 10. Rivers: a solved bank line where the water cannot carry the border

- **Measured.** Natural river water `#14615B` against natural grounds (normal / worst deficiency):

  | Ground | ΔE | Luminance contrast |
  |---|---|---|
  | Mountains ground | 21.6 / **5.6** | 1.21:1 |
  | Mountain scree | 24.9 / 9.9 | |
  | Swamp pools | 14.7 / 10.5 | |
  | Wasteland cracks | 28.1 / 10.4 | |
  | Hill rock | 25.4 / 11.3 | |

  - Sources sit at Mountains corners, so every river's first edges fail, and the Reedflow runs along Ashfen (swamp).
  - The natural bank is 0.6 px at 0.18 alpha (p59b l.246), which cannot carry a floor.
- **The bank line.** On each river edge, solve a keyline for each bank with `rlAlphaFor` against that side's ground, at the hairline floor of 2.3:1. Draw it wherever the water misses 20 / 12.
  - Clear water `#50AF9B` passes raw (Mountains 24.4 / 12.3, Wasteland 34.3 / 12.4), but not across fog states (map-relief §3.6: 19.7 / 8.5 against Wasteland). Apply the same rule in Clear.
- **Keep the hover and selection floor on river edges at Far and Lean-back,** where the river is a 1 to 1.5 px line with no bank. Remove only the faint line there.
- **Fog.** Where both sides of a river edge are fogged, draw the bank dotted, so the fog grammar survives.
- **Width at Near.**
  - A river 3 to 4.5 mapgen units wide (`RLK` 1.95) is about 8 to 12 px at Near 250 and 13 to 20 px at Near 400. The rails are inset only 1 to 6 px, so they would sit on water.
  - At Near 400 the river's half-width (6.5 to 10 px) also reaches `rlRailCheck`'s ground sample, 8.5 px in, so the check would compare the banner with water.
  - Thornwood's banner is 8.8 / **2.0** (tritan) from the natural water.
  - Change: at realm edges, inset the rail by the river's half-width, or cap that half-width at the rail's 1 px gap. Run `rlRailCheck` at Near 250 and 400 with rivers drawn.

### 11. Determinism

- **Rivers.** Corner heights add `0.08 * noise(c.x, c.y)` (`proto/p4world.js`), and `noise` is `Math.sin` (p10b l.76).
  - R8 and N8 forbid transcendentals in rule-bearing data. A source scan of p13 alone would not see a call into p10b.
  - Use `rlH2` or a seeded table instead, and make the scan reject calls to `noise` and `wet` from p13.
- **Regions** are seeded "from the viewer's capital" (`seeds = [redCap]`). `MapData.regions` must not depend on who is viewing. Seed from the lowest province id.
- **Keys.** `rngFor('region4:12:' …)` hard-codes the seed and does not match R8's `p4:12:` scheme. Use `p4:${MAP_SEED}:<purpose>:<key>` everywhere.
- **Memory under scrubbing.**
  - The time-lapse is a slider. `rlMemCapture`'s rule ("out of sight: keep the old one") depends on the path taken: after M64 then M40, Deepmoss would show its M64 snapshot at M40.
  - Make memory a pure function of M. lastSeen(i, M) is the latest month ≤ M in which i was in sight, and the snapshot is `dm0(lastSeen)`, which is cheap.
  - Check: `setMonth(64)` then `setMonth(40)` gives the same hash as a fresh `setMonth(40)`.

### 12. Supply beads: specify the halo, and fix R7's reasoning

- **Contrast over the Supply ramp.** Over the upper half of the Supply mode's ramp (heat 0.6 and above), the bead `#E6C46A` is 26.3 down to 5.8 normal, 12.0 down to 3.3 under the worst deficiency, and 1.07–1.53:1 in luminance. The path runs exactly there: own, well-supplied land near the fort.
- **The halo.** `#1C1A17` at 0.85 or more, 1.5 px around each bead. Check on rendered pixels that the bead or its halo reaches 3:1 against the ground.
- **R7's reasoning.** It says beads are round dots, never dashes, so the path cannot read as a fogged border. But docs/07 draws fog as a *dotted* border, and N10 says "a dotted or dashed border still means fog". The beads are acceptable only because the path runs from centroid to edge midpoint to centroid, never along an edge. Say that, and require road legs to cross edges rather than follow them.

### 13. Put the season and the Working banner where they can be seen

- **The top bar is a horizontal scroller with its scrollbar hidden** (orig-css l.39). Measured content width against visible width:

  | Window | Content width | Visible width |
  |---|---|---|
  | 1440 × 900 | 1517 px | 1406 px |
  | 1024 × 768 | 1517 px | 990 px |
  | Phone | 1461 px | 356 px |

  On the phone the date sits at x 1284–1354 of a 356 px bar. Only 1920 fits, with 78 px to spare.
- **The effect.** The season word and a Working pennant (about 150 px) push the clock further out of view at every common width, and on the phone neither shows at all.
- **Change.**
  - Below 1920, the pennant goes to the start of the alerts ribbon.
  - The season glyph also prefixes the time-lapse label, and on the phone sits beside the pause button.
  - `p4Seasons` and `p4Working` check that both are visible without scrolling at 390, 1024, 1280, 1440 and 1920 px.

### 14. Give the memory demonstration something to remember

- **The claim does not hold** (`out-mem-60.json`):
  - Deepmoss's walls do not rise: `pd` is 6 at M3, M30 and M59. Only Kharnath's `pd` grows (p20 l.23).
  - Its dominion stops rising at M15: strength 5, 6, 7, 7, 7 at M3, M9, M15, M30 and M59.
  - Between M15 and M59 only its population changes.
- **Change.** The `p66` re-bind adds mock events so the remembered M3 look and the live M59 look differ visibly: Deepmoss's walls at M24 and M44, a building at M36, and one change at Redcrag.
- **Ordering.** The Greening's clip and the supply path read dominion after `rlMemApply`, so an out-of-sight province uses its remembered dominion and leaks nothing.
- **The bridge cut state.** It is remembered, but the move preview's "+2 days, crossing" uses `legDays`. State that the preview uses the viewer's projection (the remembered state), or it reveals a cut made out of sight.

### 15. Re-base the sameness checks and the hooks on pass 3

- **`p4Off`.** It compares against `snap/game-screen-v4.html` (`fed36962…`), which predates pass 3. After step 0 that is the wrong reference: use the hashes step 0 records.
- **Shared parts.** Pass 3's massif edits p58m, p58w, p59, p59b, p59c and p89 (proto-massif README), the same parts pass 4 hooks (p59 9 lines, p59b 4, p59c 1). Re-count the part lengths after the rebase.
- **Switching to Painted (v3) at run time.**
  - Re-run `deriveMonth(curMonth)` and `refreshKeys()` so v3 shows live values, not memory-applied ones.
  - Gate `legDays` on `P4S.on && P4S.waters`.

### 16. Correct the scale accounting

- **Tiles.**
  - A 1024² tile with a 64-texel apron is 1152², or 7.1 MB with mips, so 8 tiles take 57 MB, not 45. That is more than the 56 MB whole-map bake they replace.
  - At the probe's start view (96 px a province) the view spans most of the map at mip 1: 0.55 px a unit against 1.28 texels a unit.
  - A workable split: the whole map at mip 1 (14 MB with its own mips), plus full-resolution tiles near the view at Near only (2 × 2 to 3 × 2 tiles).
- **Which budget applies.** docs/06's 96 MB is the budget for a Large 4-nation map. map-relief §10.3 keeps "one 2048 × 1280 bake on every device"; at Vast size that halves texel density. That is the other option the owner should see. The mockup needs neither.
- **The probe's p10b changes.** `?map=vast` changes 6 lines of p10b in the probe, not 3: sites and size, capitals, realm sizes (40 and 36) and fog (60 and 20).
- **Nations.** The probe has two nations, because the mock hard-codes `red` and `green`, for example in `rlGlow`'s banner table and `pathTo`. Eight-nation density (8 capital names, the 48-token cap, 8 banners at Lean-back) is therefore untested. State the gap, and use the banner swap of change 2 as the colour proxy.

### 17. Hooks the design does not list

Each is a 1 or 2 line edit, about 12 lines in all. p59 goes from 9 to about 13 hook lines (221 → about 234 lines).

| Part | Hook |
|---|---|
| p59 `rlRenderStatic` | The chrome cache; `RL_LAST_LAYOUT` set on the early return |
| p59 `rlDraw` | `rlDrawProvFloor` for the selected province at Lean-back |
| p59b `rlStateOf` | The Lean-back wash |
| p59b `rlWildRimMap` | `rlLkFor`, and the season in its key |
| p61 `RL_SEATG` | The season in its key |
| p61 `rlRibbonLay` / `rlControlsLay` | The open search field's rectangle, so names and chips keep off it |
| p62 `rlDrawPiece` | Hands kind `'region'` to the new token painter |
| p63 `rlNameBoxes` | Region glyph boxes |
| p63 `rlPaintLabels` | Alpha 1 − k |
| p88 `rlNatChroma`, `rlSnowCheck` | A look or variant argument |

### 18. Touch and keyboard

- **Pins** are 10 × 14 px. On touch, give them a 44 px hit area, or make them not hit-testable (the outliner row and a long-press name them).
- **Outliner eye toggles** are buttons with `aria-pressed` and a label such as "Hide battle markers on the map", at least 44 px on the phone.
- **The search field** must be `type="search"` or untyped. The key handler skips only those inputs (p80e l.3); otherwise a digit typed into the field changes the speed or the mode.
- **Region tokens.** On touch, "fit the region" comes from the token card's link. Double-tap is the browser's zoom gesture.
- **`/` and `?`.** docs/07 binds `?` to the key overlay, and on US layouts `?` is Shift with the `/` key. The key-table test must accept both bindings, matched by character and Shift.

### 19. Keep the start view as approved: no roads at Mid by default

- **What would still change.** With spring as the bake (change 8), the start view's remaining additions are the Reedflow, its four bridges and Kharnath's 15 road edges, all around the view's centre.
- **Why roads are the problem.** A pale 1.2 px road is close to the faint lines' grammar, and map-relief §3.9 dropped v3's tracks for "busyness at every zoom".
- **Default.** Roads show in Supply mode, along the planned path at every band, and at Near, but not at Mid.
- **A measure for the owner's "clean".** `p4Density` adds the drawn line length per band (rails, lines, rivers and roads) against today's.

---

## Can each item be built before the sim rules exist?

| Item | Buildable with mock data? | On condition of |
|---|---|---|
| Lean-back band | Yes | Changes 1, 2, 3 and 5 |
| Named regions | Yes | Built lazily after p54 (4); sizes (6); seed (11) |
| Seasons | Yes, with mock factors in `P4_RULES` | Spring as the bake (8); every reader (9); frost (7) |
| Fog as memory | Yes, by re-binding `deriveMonth` (p20 untouched; one classic script, so the re-bind works) | Memory as a pure function of M (11); mock events (14) |
| Rivers, fords, bridges, leg days | Yes | Lazy, without `MED_DIAM` (4); bank line (10); no `noise` (11) |
| Supply path and half wheat | Yes (a BFS over mock forts: Kharnath and Deepmoss) | Halo (12) |
| Search, pins, marker muting | Yes, UI only | Input type and touch (18); search rectangle in the layout's avoid set (17) |
| The Greening, landmark and banner | Yes (mock `WORKINGS`) | Banner placement (13); clip by remembered dominion (14) |
| Vast probe (`?map=vast`) | Yes, up to 254 cells (8-bit id raster; the probe has 242) | 6 lines of p10b (16) |
| Overview-first bake | Likely. The generators write into `out` and read `RL_P.bakeW` once (p58b l.6); p58w reads only `RB.ver`. | Keep the design's fallback |

## Claims checked that hold

- **Frost against v4's snow:** 23.2 / 22.4 (protan worst), reproduced exactly. Red against green banners: 60.1 / 19.5.
- **Zoom figures.** Fit and least zoom reproduce: 84.8 and 53.7 px (mockup map at 1440), 48.0 and 29.4 px (Vast probe), 26.6 px (the phone's Fit, which is its least zoom).
- **Lean-back frames:**
  - a cached frame costs 1.4–2.0 ms with a flush, so the 2 ms gate holds;
  - a hover frame costs 3.9–4.4 ms;
  - the overview takes 2.2 to 10.9 ms to make.
- **The bands.** Leaving `bandOf` unchanged is sound. Zoom gestures scale the cached layers (p59 l.184), so the lean weight in `rlStaticSig` adds no re-renders mid-gesture.
- **Load order.** `LOOK0` (p10b) comes before `view` (p40) and `RELIEF` (p58a), so the temporal-dead-zone reasoning in R1 is right.
- **The id raster.** It is 8-bit, with 255 meaning off the model; 270 provinces need 16-bit ids.
- **Supply.** The reach-2 arithmetic of R3 is right. Elmcrag, Dravik's pillage target, has no Cinder neighbour, so "no friendly path" holds.
- **Dates.** M40 is Y4 M4, M31 is Y3 M7, and the six winters are as listed.
- **GPU memory.** The 55.9 MB and 14 MB bake figures are right.
- **Part sizes.**
  - Every new part is planned under 400 lines.
  - `p60-draw.js` at 394 lines has its fallback re-bind.
  - Parts already over 400 lines (p61a 669, p50 631, p52 453, p55 452) are not touched.

## What this review changes in the owner questions

- **Q1:** add the measured colour-blind figures for the washes (change 2) to the question's text.
- **Q2:** the default flips to no frost on passable land (change 7).
- **Q7:** also list the faint lines removed in Natural at Lean-back (change 1).
- **Q3 to Q6:** unchanged.
