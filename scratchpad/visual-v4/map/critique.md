# Relief map v4: art direction and QA critique

2026-10-23. Reviewer: art director and QA for `game-screen-v4.html` (Relief, the default look). The page and its parts
were not edited. Every "after" figure below comes from an in-memory patch in a review browser (the page's own
`window.__mock.ev` hook), never from a changed file.

- Page: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/game-screen-v4.html`
- Parts: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/parts/`
- Review scripts and shots: `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/critique-work/`
  (`a.cjs` to `s.cjs`, `preview.cjs`, `cliff.cjs`; shots in `critique-work/shots/`, named below without the folder)

What I did: real wheel zoom from fully leaned back to the closest zoom, drag pans, Z, hover (own, enemy, independent,
wild), army and province selection, right-click moves (valid, around a wild, no path), stack fan-out, all five data
modes, fog at Mid and Near, the time-lapse dragged to Y6 M10 and back, Realm tint 8%, Table Simple and Off, Detail
Reduced, Relief to Painted (v3) and back at run time, window sizes 1920 × 1080, 1440 × 900, 1280 × 720, 1024 × 768 and
the phone. Page errors: 0 in every run.

## Verdict

The owner's words were: "It's not cluttered it's clean". The build is clean in its labels, and the miniatures on round
bases are right. It does not yet read as one natural landscape with ownership on top. It reads as a board of flat
coloured tiles with a mark in every tile.

| Question | Answer | Main evidence |
|---|---|---|
| One clean natural landscape, ownership on top? | No. Each province is a flat block. Plains, farmland and swamp (about 48% of the land) get less relief than the design's own test asks. | Fix 3. Patch edges over ΔE 15 cover 21.5% to 23.3% of the view at the reference's zoom (200 px a province). ref-2 measures 4.3%. |
| Cluttered, muddy, flat or digital? | Cluttered at the start view and at the reference's zoom; flat on low land; digital at Near. | Start view: 60 of 60 provinces carry a mark (44 hamlets, 8 huts, 8 towns). Hairlines on forest are 6.3:1. About 25 baseless guard figures at 200 px a province. Near shows blurred rock and faceted fields. |
| Tokens and towns as miniatures on bases? | Armies, yes; the figures on notched and smooth bases read well. Towns, no: they read as black pucks with a few small boxes on them. | Fix 8. Houses cover 15% of a 120 px base at Near. |
| A convincing terrain model on the table zoomed out? | Not yet. The south face is a 15 px near-black band with no visible rock. With its rounded corners, the model reads as a tray. | Fix 9. |
| Anything broken? | Yes, two interaction faults and one stale-draw fault. The army pieces swallow wheel, right-click and drag. The pieces jump about 300 px during a zoom. The ETA chip leaves the model at 1280 and 1024 widths. | Fixes 1, 2, 11 |
| v3 look changed? | No. Painted (v3) is hash-identical to the original page, also when reached by switching from Relief at run time (`k.cjs`). | — |

## The 12 fixes, most important first

### 1. Army pieces swallow the map's input (broken)

- **Part:**
  - `p61-relief-pieces.js`: `rlPlacePieces` and `rlFan`.
  - `p00d-relief.css`: `.mini`.
  - `p80d-rest.js`: the map input block.
- **Evidence (`e.cjs`, `c03-path-briardale.png`):**
  - Hit boxes: at the start view the four piece elements are 60×65, 69×64, 51×57 and 60×65 px for 17 px bases. The whole box, transparent corners included, takes pointer events (`.mini { pointer-events: auto }`).
  - Wheel: with the pointer on Ilsa's piece, a wheel notch leaves `cam.s` at 0.4165, so the map does not zoom.
  - Drag: a drag that starts on a piece leaves `cam.x` unchanged, so the map does not pan.
  - Right-click: it reaches `CANVAS.mini` with `defaultPrevented: false`. The browser menu opens and no order is given (`moveLine` stays null). Right-clicking an enemy army is exactly where a player attacks.
  - Fanned stacks: a right-click aimed at Briardale hit the fanned Kharnath stack, and the order was lost.
  - Phone: long-press on a piece cannot order a march, because the touch handlers are on the canvas only.
  - In v3 the badges were drawn in the canvas, so this is a v4 regression.
- **Change:**
  - **CSS:** `.mini { pointer-events: none; }`. Add `.mini .hit { position: absolute; pointer-events: auto; cursor: pointer; border-radius: 45%; }`.
  - **Hit element:** in `rlPlacePieces`, when `ent` is created, append `const hit = document.createElement('div'); hit.className = 'hit'; el.appendChild(hit);`.
    - Move the `mouseenter`, `mouseleave` and `click` listeners, `tabIndex`, `role`, `aria-label` and `data-tip` from `el` to `hit`.
    - After each `rlDrawPiece`, size `hit` to the piece's own silhouette (the union of `rlArmySh`): left `ox - rx - 2`, top `oy - figH - (army ? 0.25 * B : 0)`, width `2 * rx + 4`, height `figH + ry + 0.24 * B + 2`.
    - Do the same for each fanned sub-piece in `rlFan`.
  - **Forward the map gestures from `hit`:**
    - `wheel`: `(e) => { e.preventDefault(); canvas.dispatchEvent(new WheelEvent('wheel', e)); }` with `{ passive: false }`.
    - `contextmenu`: `(e) => { e.preventDefault(); const r = canvas.getBoundingClientRect(), [wx, wy] = cent[ent.pc.prov]; orderMove(r.left + wx * cam.s + cam.x, r.top + wy * cam.s + cam.y); }`.
    - `mousedown`: `(e) => { if (e.button === 0) { drag = true; dragMoved = 0; } }`.
    - `pointerdown` for touch: re-dispatch to `canvas`.
    - Only select on `click` when `dragMoved <= 6`.
  - **Drag across pieces:** in `p80d-rest.js` add `window.addEventListener('mousemove', (e) => { if (drag && e.target !== canvas) { cam.x += e.movementX; cam.y += e.movementY; clampCam(); dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY); requestDraw(); } });` so a drag keeps panning over pieces.
- **Verify:** re-run `e.cjs`. The wheel zooms, the drag pans, the right-click orders Varo toward Tormere (or shows the no-path toast) with `defaultPrevented: true`, and each hit box is no larger than base plus figure.

### 2. Pieces, the other army's arrow and the path start drift during a zoom (stale draw)

- **Part:** `p61-relief-pieces.js`: `rlLayout` (its returned object), `rlToScr`, `rlPieceAt`, `rlPlacePieces`, `rlThread`.
- **Evidence (`h.cjs`, `h01-mid-zoom.png`):**
  - The cached fast path redraws the land at the new scale while the layout keeps the old one.
  - In mid-gesture (`cam.s` 0.988, layout 0.416), Varo's DOM piece is at (95, 119) while his ground point is at (325, 334). That is **315 px** off.
  - In the shot every army has left its province, and Ilsa's "4d" arrow and the "Marholt" name are drawn at the top-left.
  - After the 140 ms settle the offset is 0.
- **Change:**
  - In `rlLayout` return the scale it laid out at: `const out = { key, band, s, Dpx, ... }`.
  - Make `rlToScr` scale-aware: `const rlToScr = (lx, ly, ls = cam.s) => [lx * cam.s / ls + cam.x, ly * cam.s / ls + cam.y];`.
  - Pass `lay.s` where layout coordinates meet the live frame:
    - `rlPlacePieces` (`rlToScr(pc.x, pc.y, lay.s)`).
    - The name repaint in `rlThread` (`rlToScr(lb.x, lb.y, lay.s)`).
    - `rlThread`'s `sh` boxes (`q * cam.s / lay.s + cam`).
  - `rlPieceAt` returns `[a.x / lay.s, a.y / lay.s]`.
- **Verify:** re-run `h.cjs`. The offset stays at 1 px or less during the gesture.

### 3. Low land is flat: the hillshade spends a fraction of its budget and the mottle spends the rest (biggest look fix)

- **Part:**
  - `p58-relief-bake.js`: `rlBakeGen` steps S4 (heightfield), S5 (hillshade) and S6 (detail).
  - `p87-relief-checks.js`: `rlDesignCheck`.
- **Evidence:**
  - **The design's own test fails.** Design §3.2 and §13 (`relief.test.ts`) ask each terrain's core p90 relief swing to reach a third of its cap. On the built bake the core p90 |ΔL| is:
    - plains 1.16 (needs 1.33);
    - farmland 0.57 (needs 1.33);
    - swamp 0.89 (needs 1.00).
  - These three terrains are about 48% of the land (`j.cjs`, `f.cjs`).
  - **The build already measured it.** The same numbers are in the build's own `tmp/checks-final.json` (`/start/design/escarpment`, coreP90 1.15, 0.57, 0.87), but `rlDesignCheck` never compares them with the cap. Its "relief rules pass" covers only the invariants and the escarpment ratio.
  - **Mottle, not landform.** About 86% of the plains' lightness variance is mottle: relief sd 0.79 against detail sd 1.97 (`n.cjs`).
  - **Cause:**
    - The build's own deviations (`hGain` 0.42, `featK` 1.5) flatten the slopes.
    - `tanh(3.2 (s − sin 40°))` needs |s − 0.64| ≈ 0.3 to approach the cap.
    - On plains, s only spans 0.51 to 0.74.
  - This is why the start view looks like coloured tiles and Near looks like flat paint (`a04-wheel-in-max.png`, `04b-near-capital.png`, `l-Elmgate-200.png`).
- **Change (same caps, same extremes, same means):**
  - **Shade gain table.** At the top of `p58` add `const RL_SHG = [2.6, 3.6, 1.4, 1.0, 1.0, 2.2, 1.2]; // shade gain: plains, farmland, forest, hills, mountains, swamp, wasteland`.
  - **S4:**
    - Declare `HG = new Float32Array(HW * HH).fill(1)` next to `hh`.
    - After `if (ws < 1e-4) { wv[lt] = 1; ws = 1; }` add `{ let gs = 0; for (let c = 0; c < 7; c++) gs += (wv[c] / ws) * RL_SHG[c]; HG[k] = gs; }`. This blends the gain across ecotones like the heights.
  - **S5:** `let v = rlTanh(3.2 * HG[k] * (s - RL_SIN_EL));`.
  - **S6 (spend less on mottle):**
    - plains: `3.5 * rlFbm(TD[0], x / (22 * RLK) …)` → `1.8 * …`;
    - farmland: `[-3, -1, 1, 3][(bid >>> 20) & 3]` → `[-1.6, -0.5, 0.5, 1.6][…]`;
    - swamp reeds: `2 * rlVN(TD[3], x / (2.6 * RLK) …)` → `1 * …` (the pools stay at −5, since they are the swamp's identity).
  - **Check:** add a `coreSwing` entry to `rlDesignCheck`: per terrain, the core p90 of `RL_CAP[t] * |fS|` on `RB.pure` texels against `RL_CAP[t] / 3`. This is the measurement in `j.cjs`.
  - **Record:** add `RL_SHG` and the new detail amplitudes to docs/09-balance "Map presentation". Re-run `calc/floor.ts` and the review's relief-floor check before adopting: the extremes −A and +0.6A are unchanged, but the distribution inside them moves.
- **Measured with the change (in memory, `preview.cjs`):**
  - Core p90: plains 2.40, farmland 1.83, swamp 1.66, forest 2.85. All pass.
  - Escarpment ratios: plains 1.94 → 1.29, farmland 2.11 → 1.38 (limit 3).
  - Province means: worst 0.31 ΔE2000 (budget 0.5), with 0 terrain pairs under 20 / 12.
  - Rails: 0 failures, worst 2.61:1.
  - Layout: 0 overlaps.
  - Lightness sd per terrain falls (simulated: plains 2.16 → 1.94, farmland 2.25 → 1.64, swamp 3.18 → 2.07). The same budget now draws landform instead of grain.
  - Shots: `compare-preview.png`, `p-Tormere-200-preview.png`.
  - Honest limit: with caps of 3 to 4 L\* on low land, the roll stays gentle. The references' stronger relief needs larger caps, which is a colour-rule question for the owner, not a build fix.

### 4. A mark in every province at the start view

- **Part:** `p61-relief-pieces.js`: `rlLayout` (the seats loop), `rlHut`, `rlDrawPieces`. The threshold goes in `p58` `RL_P`.
- **Evidence (`j.cjs`, `a01-start.png`, `c-start-nw.png`):**
  - The start view is at 73 px a province, just inside Mid, so every seat draws.
  - 44 hamlets at the 5 px clamp minimum, 8 gesso huts and 8 towns put a mark in 60 of 60 provinces. At that size the hamlets are grey brick glyphs.
  - The hut (#C9C1B1 wall, #E8DCC2 roof) is 9.5:1 on forest, so it reads as a white UI square.
  - In ref-2 and ref-4 only armies and towns stand on the land.
- **Change:**
  - Add `hamletDpx: 100` to `RL_P`.
  - In the seats loop: `else if (!far) { kind = 'hamlet';` → `else if (Dpx >= RL_P.hamletDpx) { kind = 'hamlet';`.
  - Likewise `if (fog === 'unexplored') { if (!far) { kind = 'hut';` → `if (Dpx >= RL_P.hamletDpx) {`.
  - In `rlDrawPieces` wrap the hamlet and hut items in `g.globalAlpha = rlSmooth(100, 130, lay.Dpx)` so they fade in rather than pop.
  - Give `rlHut` the ground: `function rlHut(g, st, ground)`, with walls `rlMuted('#C9C1B1', ground)` and roof `rlMuted(RL_C.gesso, ground)`. Call it as `rlHut(g, s2, ground)`.
  - Population stays one gesture away: the hover card, Population mode and the numbers layer.
  - At the start zoom the frontier is carried by the dotted lines and the hem, as the design already relies on at Far (design risk 5: confirm it in the playtest).
  - This is a design deviation: §1's "Mid: muted hamlets" becomes "from 100 px". Record it in docs/09-balance.
- **After:** `p01-start-preview.png`. Only towns, armies and the Wellsprings stand on the model.

### 5. The neutral hairline is the loudest line on the map

- **Part:** `p59-relief-draw.js`: `rlDrawRails` (the internal-edge loop). The constants go in `p58`.
- **Evidence:**
  - `keylineFor` at a fixed 70% gives these contrasts on the albedo:

    | Terrain | Contrast |
    |---|---|
    | forest | 6.31:1 |
    | hills | 3.99:1 |
    | swamp | 3.79:1 |
    | mountains | 3.63:1 |

  - The banner of the rail that carries ownership is weaker: Ember on forest 4.36:1, Thornwood on forest 1.87:1.
  - So on the darkest, most common ground the line that says "nobody owns either side" outshouts ownership. Every forest province gets a bright cream outline (`a01-start.png`, `b01-mid-kharnath.png`).
  - The design's floor for this line is 2.39:1.
- **Change:**
  - Replace `g.strokeStyle = rgba(key, RL_P.hairline)` with `g.strokeStyle = rgba(key, RL_HAIRA[terr[lr]])`.
  - `const RL_HAIRA = { plains: 0.62, farmland: 0.46, forest: 0.34, hills: 0.51, mountains: 0.67, swamp: 0.48, wasteland: 0.70 };`
  - Each value is solved so that the worst case over the terrain's relief extremes (−A, 0, +0.6A) and the 4% haze is 2.40 to 2.44:1. `RL_P.hairline` (0.70) stays as the cap.
  - Re-run `review/review-checks*.ts` for the other three states (out of sight, ash, moss) before adopting.
  - Record the per-terrain alphas in docs/09-balance (design §4.7 and §5.1 change from "70%").
- **After:** `p01-start-preview.png` and `p-Tormere-200-preview.png`. Rails now lead and hairlines recede. Rails still pass: 0 fails, worst 2.61:1.

### 6. The mockup's panels shrink the owner's first view to almost Far

- **Part:** `p80d-rest.js` (the `headMore` fold line) and `p00c-body.html` (`#tryListRelief`).
- **Evidence (`q.cjs`):**
  - At 1440 × 900 the "Try this" list and the open Mockup controls take about 200 px. The start view is 73 px a province, where the Far band ends at 70.
  - The design's start view is 95 px at 1280 × 720. The tile look is worst at this size.
  - Folded, the start view is 87.9 px and the model is 20% larger (`q-start-folded.png`).
- **Change:**
  - In `p80d-rest.js`: `if (window.innerWidth < 720 || window.innerHeight < 800) document.getElementById('headMore').open = false;` → `if (RELIEF() || window.innerWidth < 720 || window.innerHeight < 800) …`.
  - In `p00c-body.html`: move `<ol class="try desk rlonly" id="tryListRelief">` inside `<details class="headmore" id="headMore">`, directly after its `<summary>`.
  - Painted (v3) keeps its own list and frame, so v3 stays hash-identical.

### 7. Near: baseless guard figures and pale hamlets look like a crowd of extra armies

- **Part:** `p61-relief-pieces.js`: `rlLayout` (the guards loop), `rlHamlet`, `rlMuted`.
- **Evidence (`l-Tormere-200.png`, `l-Elmgate-200.png`, at the reference's zoom of 200 px a province):**
  - About 25 pewter figures without bases (1 to 4 per independent seat) stand beside the hamlets, next to only 4 real army pieces. At a glance they read as armies.
  - The independents' kit wall #D8CBB0 is 8.06:1 on forest, 4.53:1 on hills and 4.22:1 on swamp: white cubes.
- **Change:**
  - **Guards:** `if (near && p.owner === null && p.indep) { const n = TENTS[strengthWord(p.indep)]` → `if (Dpx >= 300 && p.owner === null && p.indep) { const n = Math.min(2, TENTS[strengthWord(p.indep)])`. Place them inside the cluster (`d = st.r * 0.5` for hamlets). The strength word stays in the card.
  - **Hamlets:** pass `muted = true` at every band in `rlHamlet`: `rlHouse(..., true, ground, ...)`.
  - **Muting limit:** in `rlMuted` use `const lim = bandOf(cam.s) === 'near' ? 4 : 2.5` in place of the two 2.5s, and key the cache with `c + ground + lim`.
- **After:** `p-Tormere-200-preview.png`.

### 8. Towns read as black pucks

- **Part:** `p61-relief-pieces.js`: `rlTown` and `rlTownPx`.
- **Evidence (`j.cjs`, `a04-wheel-in-max.png`, `04b-near-capital.png`):**
  - At Near every town is a 120 px base whose top is #1E1B18 (8.4:1 on farmland), under a translucent dark yard.
  - Ten 11 px houses cover 15% of the base top (24% at Kharnath and Deepmoss).
  - The eye reads a black disc with crumbs on it, not a walled settlement.
- **Change:**
  - **Yard:** `g.fillStyle = 'rgba(78,70,56,.55)'; ellipse(g, x, y - 0.5, rx * 0.84, ry * 0.84); g.fill();` → `g.fillStyle = mix(ground, '#7A6A52', 0.6); ellipse(g, x, y - 0.5, rx * 0.8, ry * 0.8); g.fill();`. This is opaque packed earth. The dark base remains as the ring that carries the banner rim, so design §4.7's rim contrasts still hold.
  - **Houses:** `hs = Math.max(3, Math.min(11, T * 0.11))` → `Math.max(3, Math.min(16, T * 0.14))`.
  - **Size:** the `rlTownPx` ceiling goes from 120 to 96.
  - Record the house size and the ceiling in docs/09-balance (design §6.4).
- **After:** `p-Elmgate-200-preview.png` (Ashmoor, Elmwick, Ashdale).

### 9. The model's cliff does not read as rock zoomed out

- **Part:**
  - `p59-relief-draw.js`: `rlRim`.
  - `p58-relief-bake.js`: `RL_P.face` and `RL_P.faceShown` (`RL_FACE` and `MODEL_BOX` follow, so the fit includes the face).
- **Evidence:**
  - At the start view the south face is 15 px of #3A3436 to #221E20. The strata (3.7 px bands at 86% value) do not show (`c-start-south.png`).
  - The face is 0.2 D tall. Faces in ref-3 and ref-4 are roughly half a province or more.
  - Together with the 0.22 D rounded corners, the model reads as a tablet or tray, not a carved terrain model.
- **Change:**
  - **Height:** `face: 24 → 48`, `faceShown: 18 → 37`.
  - **Strata:** the ledge line `'rgba(150,140,135,.28)'` → `.12`.
  - **Rock facets:** after the strata loop, before `// the plinth`, add irregular rock facet clusters.
    - Walk each south-facing segment of `S` (normal `y > 0.3`) in seeded steps `w = (4 + 10 * R * R) * RLK`.
    - On 42% of the steps draw a lit west facet: a quad `0.2–0.45 w` wide, starting `5–30%` down the face and `35–85%` of the face tall, filled with a vertical gradient `rgba(158,148,146, 0.3–0.6) → 0`. A facet turned west faces the 315° light: n·l = cos 40° sin 45° = 0.54.
    - Give each lit facet a dark crease `rgba(8,7,8,.5)` on its east edge.
  - **Shading:** darken the lower half of the face by `rgba(14,12,13,.35)`.
  - **Talus:** add 2 to 5 rubble ellipses at the foot on half the segments.
  - Do not use same-width columns. I tried them in memory and they read as plastic ribbing.
- **After:** `compare-cliff.png` (top: as built; bottom: in memory) and `q02-cliff-after-far.png`.
- **Limit:** with the top-down camera this is the most the face can give. The references' depth comes from a tilted camera, which is owner question 3 (tilt at Far, M1-should).

### 10. Near: blurred rock and faceted fields (the design's Near detail is missing)

- **Part:** `p58-relief-bake.js`: `rlBakeGen` S6 (`mountains` and `farmland` branches) and S8 (the granite branch).
- **Evidence:**
  - At 420 px a province a bake texel is 1.9 screen px and the hillshade, made on the half-resolution heightfield, is 3.8 px.
  - Passable mountains and the wild peaks look like soft, out-of-focus photographs (`g02-near-greyteeth.png`, `a04-wheel-in-max.png`).
  - Farmland parcels are flat Voronoi facets with hard seams, like stained glass (`a04-wheel-in-max.png`).
  - Design §3.4's Near detail tiles and §3.5's live crowns are not built.
- **Change:**
  - **Mountains (S6):** add full-resolution micro-relief.
    - `const TMR = rlGTable('micro:mountains')` before the loop.
    - In the `mountains` branch: `const e = 0.7 * RLK, f = (u, v) => rlRidged(TMR, u / (7 * RLK), v / (7 * RLK), 2, 0.2); d += 3 * Math.max(-1, Math.min(1, (f(x - e, y - e) - f(x + e, y + e)) * 2.2));`. This is a slope toward the upper-left light at 7-unit features. It is lightness only and mean-neutral through S7.
  - **Peaks (S8):** in the granite branch add the same term with amplitude 5 L\* to `L` before the snow mix. The peaks carry no mean rule.
  - **Farmland:** keep the second-nearest distance `best2` in the cell loop. Replace `d += tone` with `d += tone * (0.55 + 0.45 * rlSmooth(0, 0.12, Math.sqrt(best2) - Math.sqrt(best)))` so parcel seams soften.
  - The detail tiles and live crowns stay the design's Phase 11 items.

### 11. The planned path's ETA chip leaves the model

- **Part:** `p61-relief-pieces.js`: `rlThread` (`free` and `cands`).
- **Evidence (`p.cjs`):**
  - With Varo's march to Ashvale planned, the final chip "8d · around the Ashspine" is drawn on the oak to the left of the model.
    - At 1280 × 720 the chip starts left of the model's edge at x 399 (`c-chip-1280.png`).
    - At 1024 × 768 it lies entirely on the table (`c-chip-1024b.png`).
  - The same happens when a 1920 window is resized to 1280 (`c51-1280.png`).
  - It is the number the player decides by (docs/07 principle 2). At 1440 × 900 it is on the model.
- **Change:**
  - **Model box:** in `free`, also require the chip inside the model's screen box inset by 4 px (`const [mx0, my0] = toScreen(0, 0), [mx1, my1] = toScreen(W, H)`).
  - **Ribbon:** also require the chip clear of `#ribbon`'s rectangle, taken relative to the canvas.
  - **More candidates:** append `[8, h + 10]`, `[-tw / 2, h + 26]` and `[-tw / 2, -2 * h - 16]` to `cands`.
  - **Fallback:** if none is free, draw the last chip on two lines (`8d` / `around the Ashspine`) at the first candidate inside the model.

### 12. Every static re-render pays for high-quality upscaling (pan hitch)

- **Part:** `p59-relief-draw.js`: `rlRenderStatic` (the bake blit).
- **Evidence (`m.cjs`, `o.cjs`, `r.cjs`, `s.cjs`):**
  - The machine is shared and runs headless with software raster, so all timings are noisy.
  - A fast pan at Near hitches once per cache exit, up to 304 ms.
  - A static re-render at Near takes a median of 334 ms. Of that, about 255 ms is `imageSmoothingQuality = 'high'` while upscaling the bake (334 → 80 ms with bilinear).
  - The picture barely changes: mean absolute difference 0.31 of 255, max 19, at edges only.
  - The rails, pieces, labels and water together cost about 10 ms.
- **Change:** `g.imageSmoothingQuality = 'high';` → `g.imageSmoothingQuality = src.width / W < cam.s * dpr ? 'low' : 'high';`. That is bilinear when upscaling the chosen source and high-quality only when shrinking. Confirm the hitch on a GPU browser before closing.

## Seen, not in the 12

- **Owner-level colour matters (the design's albedos are law, measured in §4):**
  - Passable mountains (#859BB8) read as ice or snow-field at Mid and Near, next to the reserved snow on the peaks.
  - Swamp (#38616D) reads as open water at Near.
  - Both follow from the 20 / 12 colour-blind rule. They belong with the owner's palette question, not with a build fix.
- **The time-lapse keeps the old planned path:** the "8d · around the Ashspine" chip stays after Varo moves. This is identical in the original v3 page (`i.cjs`), so it is mockup state, not a v4 regression.
- **Labels under the alerts ribbon:** they can sit under the floating ribbon (Karreach in the builder's `19b-numbers-mid.png`). This is also true in v3.
- **The other army's arrow crosses hamlet houses:** this is in the build report's known issues and is minor once fix 4 and fix 7 thin the houses.
- **Fog:** at 4% the unexplored haze is all but invisible. With fix 4 the frontier at the start zoom is carried by the dotted lines and the hem only. This is the design's accepted risk 5, for the playtest.
- **What works and should stay:**
  - Labels by band: 6 names at the start view, all names at Near.
  - The lit-bead rails, the glow, and the hover and selection tints.
  - Wild names on the massif at Near.
  - The forest canopy masses, the water shapes, the data modes' gentle relief, and the Realm tint control.
  - The miniature armies with notched and smooth bases.
  - Tooltips, Escape, the outliner and the run-time switch to Painted (v3).

## Evidence index

All files are under
`/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/critique-work/shots/`.

**As built**

| Group | Files |
|---|---|
| Views and zoom | `a01-start.png`, `a02-wheel-out.png`, `a03-wheel-in-4-near.png`, `a04-wheel-in-max.png`, `a05-near-pan.png`, `a06-after-z.png` |
| Crops | `c-start-south.png` (cliff), `c-start-nw.png`, `c-start-eastedge.png`, `c-near-eastedge.png` |
| Interaction | `b01`–`b10`, `sheet-b.png` (hover, select, move, stack fan), `c01`–`c03` (paths; `c03` is the right-click lost on the fanned stack) |
| Modes, time-lapse, tint, table | `sheet-modes.png`, `sheet-tl.png`, `sheet-tog.png` |
| Painted and resizes | `c40-to-v3.png`, `c41-back-relief.png`, `c50-1920.png`, `c51-1280.png` |
| Stale draw | `h01-mid-zoom.png` (pieces displaced mid-zoom) |
| Near and the reference's zoom | `g01-near-ashspine-south.png`, `g02-near-greyteeth.png`, `g03`–`g05`, `g10-start-dpr2.png`, `l-Tormere-200.png`, `l-Elmgate-200.png`, `l-Halebrook-260.png` |
| ETA chip | `p-chip-1280.png`, `p-chip-1024.png`, `c-chip-1280.png`, `c-chip-1024b.png` |
| Painted, original | `k-orig.png`, `k-switched.png` (v3 switched at run time, hash-identical to the original) |

**In-memory previews (the page file untouched)**

| Fixes | Files |
|---|---|
| 3, 4, 5, 7, 8 | `compare-preview.png`, `p01-start-preview.png`, `p-Tormere-200-preview.png`, `p-Elmgate-200-preview.png`, `p-Kharnath-420-preview.png` |
| 9 | `compare-cliff.png`, `q00-cliff-before.png`, `q01-cliff-after.png`, `q02-cliff-after-far.png` |
| 6 | `q-start-folded.png` |

**Measurements, by script (in `critique-work/`)**

| Script | What it measures |
|---|---|
| `f.cjs` | lightness components per terrain |
| `j.cjs` | seat counts, the core-swing test, town fill |
| `n.cjs` | shade-gain simulation |
| `e.cjs` | input through pieces |
| `h.cjs` | zoom drift |
| `k.cjs` | Painted (v3) sameness |
| `m.cjs`, `o.cjs`, `r.cjs`, `s.cjs` | re-render timings and the smoothing diff |
| `p.cjs` | ETA chip |
| `q.cjs` | folded panels |
| `i.cjs` | path through the time-lapse, both looks |

**Other numbers**

- Patchiness: `review/patchiness.py` run on `l-Tormere-200.png` (21.5% of edges over ΔE 15), `l-Elmgate-200.png` (23.3%) and `a01-start.png` (18.4%). The references measure 4.3% (ref-2) and 13.2% (ref-4).
- Contrasts (hairline, banners, kit walls, hut): computed with the WCAG formula in the review shell, recorded in each fix above.
