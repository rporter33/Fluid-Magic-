# Skills audit: battle mockup, game-screen map, stage B review page

Audit of three browser mockups against the installed gamedev skills (`pixijs-rendering`, `performance-optimization`,
`game-ui-ux`, with their references) as the project digest applies them. `CLAUDE.md` and `docs/**` win where they
differ. This audit is read-only: no file under `visual-v4/` or the repo was changed.

**Tags.** **[Quick win]**: under about an hour, no design change. **[Pass 4]**: the next map pass (overworld bands,
regions, seasons, search, pins, muting). **[Stage D]**: battle animation and magic (the Fireball against Entangle
pilot). **[Phase 8]**: the real `src/render` and `src/ui`.

## How it was measured

- **Snapshots.** Sources were copied at 00:02 UTC on 24 Oct to
  `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/audit-skills/snap/`, because
  other runs were editing the live folder. The copies are `battle-mockup.html` and `src/`, `map/game-screen-v4.html` and
  `map/parts/`, and `units/stage-b/review.html` (modified 23:59).
- **Harnesses.** The scripts are in `.../scratchpad/audit-skills/tools/` (`battle-prof.cjs`, `battle-followup.cjs`,
  `battle-tex-fx.cjs`, `battle-ui.cjs`, `map-prof.cjs`, `review-ui.cjs`). Raw JSON is in `.../scratchpad/audit-skills/out/`.
- **Browser.** Headless Chromium 1194 through Playwright. Pixi came from the repo's `node_modules/pixi.js` 8.22.0 and
  d3 from `scratchpad/vendor-d3`; Google Fonts requests were blocked.
- **Caveat: the GPU is SwiftShader.** WebGL ran on SwiftShader, which is a CPU renderer, and Canvas2D was also
  rasterised on the CPU. GPU waits (about 200 ms a frame) are not representative and are excluded. Only CPU per-frame
  time is reported, with the GPU synced outside the timed region by a 1-pixel `readPixels`, as the page's own
  `measure()` does.
- **Caveat: the machine is shared and noisy.** It is a 4-core VM with a load average of 1.7 to 5.3 during the runs,
  because other sessions were active. `performance.now()` is coarsened to 0.1 ms here. Repeat runs moved p50 by up to
  20% (battle a, painted, 1x: 5.4 ms in one run and 4.9 ms in the other).
- **Caveat: profilers add overhead.** Function shares come from profiled runs. Absolute milliseconds come from
  unprofiled runs.
- **Budget.** 16.67 ms per frame at 60 fps. The digest splits it as about 5 ms update, 4 ms render submit and 2 ms UI.

## Top findings

1. **Battle: per-frame `Graphics` rebuilds are the largest CPU cost and nearly all of the garbage.** Pixi's Graphics
   geometry code takes about 31% of frame CPU. Of 1,249 KiB allocated per frame, about 950 KiB is Graphics geometry.
   Turning off just two of those layers cut render CPU p50 from 1.9 to 1.3 ms and p95 from 5.2 to 3.4 ms. (B1)
2. **Stage D must not draw effects with `Graphics.clear()` and redraw.** In the benchmark, 1,000 additive dots cost
   7.2 ms of CPU per frame as Graphics, 0.7 ms as pooled Sprites and 0.4 ms as a `ParticleContainer`. Entangle's look
   kind `vines` has no draw branch today. (B2, plus the stage D section)
3. **Map: a static re-render costs 52 to 416 ms and runs on every zoom settle, every selection change and every pan
   past the margin.** That is 3 to 25 frames, against a budget of 16.67 ms. The caches are keyed on the exact zoom, not
   on the zoom band. (M1)
4. **Map: the bake's "28 ms slices" are really long tasks of 0.4 to 2.0 s.** Baking the second terrain look while the
   map is live drops a third of the frames for about 5 s. At 270 provinces the CPU bake would be about 4.5x longer. (M2)
5. **Map UI: no keyboard path to provinces or march orders.** The Codex modal leaks Tab focus and shortcuts, focus
   styles are identical to hover, and every visible control at 390 px is under 44 px. (U1 to U4)
6. **Review page: 515 tab stops.** The verdict is stop 498, the lightbox does not hold focus, and the ok/flaw dots
   differ by colour alone (ΔE2000 4.9 under deutan vision, against the project's `CVD_MIN` of 12). (R1 to R3)

---

## 1. Battle mockup (`src/*.js`, `page.html`; Pixi 8.22)

**Baseline.** Unprofiled CPU per frame at 1920×1080, DPR 1. Each run is 120 frames starting 1 s before the clash.
P is painted figures, p is procedural.

| Battle | Figures (count, mode) | Speed | Update p50/p95 | HUD p50/p95 | Render CPU p50/p95 | Total p50/p95 (max) | Draw calls | Texture sources |
|---|---|---|---|---|---|---|---|---|
| a | 352 P | 1x | 2.0 / 3.9 | 0.2 / 0.4 | 2.5 / 6.3 | 4.9 / 9.3 (25.3) | 17.6 | 19 |
| a | 352 P | 4x | 2.8 / 4.1 | 0.2 / 0.8 | 3.1 / 7.9 | 6.3 / 12.0 (17.0) | 17.3 | 20 |
| a | 352 p | 1x | 2.0 / 3.2 | 0.2 / 0.4 | 2.1 / 4.7 | 4.4 / 7.5 | 16.6 | 20 |
| b | 271 P | 1x | 1.9 / 2.7 | 0.2 / 0.3 | 1.9 / 4.1 | 4.0 / 6.6 | 15.1 | 18 |
| b | 271 p | 1x | 1.1 / 1.7 | 0.2 / 0.3 | 1.5 / 3.4 | 3.0 / 5.1 | 14.1 | 19 |
| c | 242 P | 1x | 1.9 / 2.6 | 0.2 / 0.4 | 1.6 / 2.9 | 3.9 / 5.9 | 4.3 | 23 |
| c | 242 p | 1x | 1.2 / 2.4 | 0.2 / 0.4 | 1.3 / 2.3 | 2.7 / 5.4 | 6.3 | 20 |

The whole frame fits the budget, with p95 at most 12 ms. Render submit goes over its 4 ms slice at p95 in battle a
(6.3 to 7.9 ms) and in battle b painted (4.1 ms). These are the costs that grow with stage D and the docs/12
`clash300` fixture.

### B1. Per-frame Graphics rebuilds: top CPU cost and nearly all garbage [Quick win for ground fx and glyphs; Stage D for spells, breath and flames]

- **Where.** In `60-render.js`, the `BattleStage` methods clear and redraw `Graphics` every frame:
  - `drawGroundFx` (l.777–824): two contact-shadow ellipses per block, commander rings, buff and debuff rings, and the
    hover and selection hulls.
  - `drawGlyphs` (l.938–984): a pennant per block, plus the held and broke pips.
  - `drawSpells` and `drawBreath` (l.844–936): every spell shape, with 70 or more circles per breath per frame.

  Two body modules do the same: `41-bodies.js` `makeSalamander().pose()` clears the flames (l.114) and `43-wyrm.js`
  clears the tail (l.105) through `ribbonPoly`.
- **Evidence.** CPU profile with the load excluded (battle a, painted, 300 frames):
  - Pixi's Graphics shape builders (pixi.min.js line 348: `build`, the circle and ellipse builder; `cs`, the stroke
    builder; `triangulate`; `xg`, which builds context batches) are about 31% of frame CPU, and GC is 5.4%. The 31%
    excludes the batcher's `packQuadAttributes`, which shares that line and serves sprites.
  - Heap sampling: 1,249 KiB allocated per frame, of which about 950 KiB (76%) is Graphics geometry. That is about
    75 MB/s at 60 fps.
  - Turning off only `drawGroundFx` and `drawGlyphs`: render CPU p50 dropped from 1.9 to 1.3 ms and p95 from 5.2 to
    3.4 ms; update went from 1.6 to 1.4 ms.
- **Skill rules.** performance: "Kill per-frame allocations (GC spikes = stutter)" and "do less". pixijs: do not churn
  static content; use Sprites and `ParticleContainer` for many same-texture objects.
- **Change.** Bake each shape once with `makeTex` and move, scale and tint Sprites every frame:
  - Contact shadows: one pooled `Sprite(texShadow)` per block, scaled to the hull's `rx` and `ry`.
  - Rings: a ring texture tinted with the banner colour (commanders, hover and selection), plus one solid and one dashed
    ring for buffs and debuffs.
  - Pennants: one pennant texture, with the wave as `skew`.
  - Held and broke pips: two textures.
  - Salamander flames: 4 to 6 baked flame frames, picked by `t`.
  - Wyrm tail: a `MeshRope` whose points move. It is never re-tessellated.

  Keep `Graphics` only for shapes built once (the wall and the ladders already are). Re-measure with
  `tools/battle-followup.cjs`.

### B2. The effects layer must not use per-frame Graphics, and Entangle draws nothing [Stage D]

- **Where.** `60-render.js` `drawSpells` (l.844–895) draws every spell kind with `Graphics` circles and ellipses each
  frame. `31-build.js` `SPELL_LOOK.entangle.kind = 'vines'` (l.12) has no branch in `drawSpells`, so Entangle shows
  only the charge glow. Bursts already use pooled Sprites (`pull()`, l.511) in plain Containers, with separate textures
  (`texDot`, `texSoft`, and so on).
- **Evidence.** Micro-benchmark of N additive dots moving every frame, CPU only (`tools/battle-tex-fx.cjs`):

  | N | Graphics redraw | Pooled Sprites | ParticleContainer |
  |---|---|---|---|
  | 300 | 1.8 ms | 0.4 ms | 0.2 ms |
  | 1,000 | 7.2 ms | 0.7 ms | 0.4 ms |
  | 3,000 | 16.0 ms | 1.7 ms | 0.8 ms |

  docs/12 S2.10 asks for 40 to 160 particles per small cast and up to 300 per large spell. Fireball alone calls for a
  40-ember explosion, a 140 wu ring and 2 s of smoke.
- **Skill rules.** pixijs: `ParticleContainer` with `Particle` records, only the changing fields in
  `dynamicProperties`, and one atlas. performance: pooling and draw calls.
- **Change.** See "What stage D should build on" below.

### B3. Photosensitivity and reduced motion do not follow the docs [Stage D; Quick win for the OS setting]

- **Where.** `90-main.js` `Game.init` sets `this.reduced = false` (l.22), and only the menu toggles it (l.282). docs/12
  says "reduced motion follows the OS" (l.35) and "the flash limiter is always on" (l.1705). S2.10 adds a full-scene
  flash on the release of any spell of level 3 or more, and Entangle is level 3.
- **Evidence.** With the OS setting emulated as reduce, `matchMedia('(prefers-reduced-motion: reduce)')` was true and
  `GAME.reduced` was false. The mockup has no flash limiter and no flashes view filter.
- **Skill rule.** game-ui-ux, accessibility: reduce-motion and reduce-flashing toggles.
- **Change.** Initialise `this.reduced` from `matchMedia(...)` and add a `change` listener. Before the Entangle flash
  lands, implement docs/12's flash limiter (at most 3 per real second) and the `flashes: full|soft|off` filter.

### B4. Texture memory is about 210 MiB per battle, and the ground is 3218×2273 [Phase 8]

- **Where.**
  - `44-painted.js` `bakePaintVariants` (l.260): K=4 mipmapped render textures per nation page per tier.
  - `60-render.js` l.272: tier H is baked at `setTimeout(0)` on every load, whether or not the camera can reach tier H.
  - `50-ground.js` `paintGround` (l.32, `RES = 0.8`): a single canvas texture with no mipmaps.
- **Evidence.**
  - `renderer.texture.managedTextures`: 45 to 53 sources, about 210 to 214 MiB (an estimate: w×h×4, ×1.33 when
    mipmapped).
  - Pages are up to 2048×1980. The ground is 3218×2273 (about 29 MiB), above the skill's 1024 to 2048 mobile texture
    budget.
- **Skill rule.** performance, asset budgets: cap texture sizes and memory per platform, and add a check so the budget
  stays fixed.
- **Change.**
  - Bake tier H only when it is reachable (max zoom × resolution × 28 ≥ `PAINT_TIER_UP`), and in idle time.
  - Phase 8: bake the variants offline into atlases and load them as `Assets` bundles, with `Assets.backgroundLoad` for
    tier H and `Assets.unload` when the battle screen closes.
  - Split the ground into tiles of at most 2048, or derive `RES` from the maximum zoom.
  - Add a texture-memory row to `window.__battle` with a budget, for example 128 MiB desktop and 64 MiB phone.

### B5. The loop renders every frame while paused and idle [Quick win]

- **Where.** `90-main.js` `Game.loop` (l.80–87) calls `render(this.t)` on every `requestAnimationFrame`, whatever the
  state.
- **Evidence.** Paused for 2 s, every rAF still ran `stage.frame`, `hud.update` and `renderer.render`, at 8.1 ms CPU
  p50. Under SwiftShader, rAF ran at about 1.5 Hz, so the frame count here is not meaningful. On a 60 Hz display this
  repeats the full 4 to 6 ms frame 60 times a second while nothing changes, which costs battery on laptops and phones.
- **Skill rule.** performance: run less often.
- **Change.** Add a dirty flag. Render while `playing`, during `camFade`, while the user pans, zooms or holds a key, and
  after a hover, selection, resize or seek. Otherwise return early and keep the rAF alive.

### B6. Bodies left on the field: no render group, and an O(n) visibility pass every frame [Quick win; Phase 8 for stamping]

- **Where.** `60-render.js`: the `decalLayer` is created in the constructor (l.125) and filled by `makeDecal`
  (l.418–478). `updateDecals` (l.481–496) sets `visible` on every decal every frame. `this.decalShown` exists but is
  never used.
- **Evidence.** At the end of battle a, 722 decal sprites are visible (621 timeline decals plus dropped gear). Holding
  the camera at one story time:

  | Decal layer | Render CPU p50 |
  |---|---|
  | Plain container | 2.6 ms |
  | `enableRenderGroup()` | 1.5 ms |
  | `cacheAsTexture(true)` | 1.6 ms |

  `updateDecals` itself costs 0.07 to 0.21 ms per frame.
- **Skill rule.** pixijs: render groups or `cacheAsTexture` for large static subtrees.
- **Change.**
  - Create the layer as `new PIXI.Container({ isRenderGroup: true })`.
  - In `updateDecals`, walk a cursor over `T.decals` (already sorted by `t`) and touch only the decals whose visibility
    changes; reset the cursor on a backward seek.
  - Phase 8, for long battles: stamp settled decals into a ground-decal `RenderTexture` and re-stamp on a backward seek
    (docs/12 l.78: "decals that can be re-baked").
  - Do not use `cacheAsTexture` while decals keep appearing: it needs an `updateCacheTexture()` call for every new one.

### B7. Pixi's event system walks the whole scene on every pointermove, unused [Quick win]

- **Where.** `90-main.js` `Game.init` calls `app.init` (l.14–17) with no event options. Picking is the page's own
  `pick()`, driven by `window` listeners (l.316–340). Pixi v8 still listens to `document` pointermove (capture) and
  walks the passive stage in `EventBoundary.hitTestMoveRecursive`.
- **Evidence.** The stage has 1,528 nodes.
  - A pointermove costs 0.303 ms with the default stage and 0.046 ms with `stage.eventMode = 'none'` (85% less).
  - Pixi's `hitTest` alone takes 0.232 ms; the page's own pick takes 0.045 ms.
- **Skill rule.** pixijs: `eventMode` is per object, and the default `'passive'` still walks the children.
- **Change.** Pass the event options to init:

  ```js
  await this.app.init({ ..., eventMode: 'none',
    eventFeatures: { move: false, globalMove: false, click: false, wheel: false } });
  ```

  These are 8.22 init options (`EventSystem` reads `options.eventMode` and `options.eventFeatures`).

  Phase 8: if picking moves to Pixi events, put `eventMode = 'static'` only on hit proxies (one hull per block), set
  `interactiveChildren = false` on the figure layers, and drag with `globalpointermove`.

### B8. The stand-in big bodies keep a filter on permanently in Painted mode [Quick win]

- **Where.** `60-render.js` constructor l.180–183: `body.root.filters = [this.standInCM]`.
- **Evidence.** 2 framebuffer binds per frame in battles a and b painted, against 0 when procedural. Battle a render
  CPU p50 was 2.5 ms painted against 2.1 ms procedural (not isolated).
- **Skill rule.** pixijs, filters: "use sparingly and remove (`obj.filters = null`) when not needed".
- **Change.** Tone the stand-ins with `tint` (for example `0xd0ccc4`) and drop the filter. Stage C replaces them
  anyway; do not port the filter to Phase 8. The death-sequence grade (l.613–614) switches itself off correctly
  (`filters = []` removes the effect in v8).

### B9. The HUD polls every frame (cheap here, but the pattern does not scale) [Quick win; Phase 8]

- **Where.** `80-hud.js` `Hud.update` (l.186–256):
  - Every card, every frame, runs `statusList` → `statusAt`. In `32-finish.js` (l.83), `statusAt` scans all `T.glyphs`
    and `T.spellFx` and allocates objects and template strings. For berserk groups, `statusList` (l.182) also scans
    `T.F.some(...)`.
  - It builds a key string per card.
  - `T.rounds.filter` (l.209) allocates every frame.
  - The scrubber width and time are written to the DOM every frame (l.225–226).
- **Evidence.** HUD cost is 0.2 ms p50 and 0.3 to 0.8 ms p95 with 11 cards and 6 minis, within the 2 ms UI slice.
  `statusAt` shows 0.2 ms of self time per frame in the profiled run.
- **Skill rule.** game-ui-ux: drive the HUD from events, not polling. performance: no per-frame allocation.
- **Change.**
  - At `buildTimeline`, give each group a sorted list of HUD change times: deaths, rout, leave, glyph start and end,
    cast start and end, contact start and end, and hp changes.
  - `update(t)` advances a cursor and refreshes only the cards whose next change time it crossed, or all cards on a
    seek.
  - Write the scrubber only when the shown second changes.

### B10. The HUD is not keyboard or touch ready [Phase 8]

- **Where.** `80-hud.js` `build()`:
  - Cards and enemy minis are `div`s with mouse handlers (l.99–124). 0 of 11 cards are focusable.
  - `#scrub` is 12 px tall and not focusable (`page.html` CSS).
  - Transport buttons are 32×32 at 390 px.
  - Opening the menu leaves focus outside it (measured).
  - The viewport meta has no `viewport-fit=cover`, and the CSS has no `env(safe-area-inset-*)`.
- **Skill rules.** game-ui-ux: focus navigation, initial focus, a modal holds focus, targets of 44 px or more, safe
  area.
- **Change.**
  - Cards become buttons with a roving `tabindex` in the card bar. Enter selects, and focus shows the hover card.
  - The scrubber becomes `role="slider"` with arrow keys and a 44 px touch band.
  - Buttons are at least 44 px on touch.
  - The menu focuses its first item and returns focus on close.
  - Safe-area insets on the HUD edges.

### B11. Other Phase 8 notes

- **`preserveDrawingBuffer: true`** (`90-main.js` l.16) exists only for the checks and screenshots. It costs on tiled
  mobile GPUs: turn it off in `src/render` and take screenshots with `renderer.extract`. [Phase 8]
- **Assets.** Painted pages bypass `Assets` (`44-painted.js` `PaintLib.load`, l.59–86, uses `new Image` and
  `ImageSource`, so there is no unload path). Card art is a GPU readback per group on every load (`80-hud.js`
  `cardArt`, l.80–81: `extract.canvas` and `toDataURL`). Phase 8: use an `Assets` manifest with bundles, and take card
  art from the portrait atlas. [Phase 8]

### Checked and fine

- v8 async `init` and `app.canvas` are used correctly.
- `app.ticker` is stopped. The page's own rAF clock clamps `dt` to 0.1 s and advances story time by real milliseconds,
  which is frame-rate independent, like `ticker.deltaMS`.
- `Texture.from(canvas)` for the ground is valid in v8: it is not a URL.
- Projectiles, bursts and see-through silhouettes are pooled. `evalFigure` and `paintPose` reuse their output objects.
- `dispose()` destroys the stage, the ground and particle textures, and the painted variants. The page's own check
  keeps the managed texture count stable across reloads.
- Draw calls stay at 4 to 18 per frame, with 18 to 23 texture sources. Batching holds today. Keep stage D on one atlas
  so it stays that way on 16-unit GPUs.
- Resolution is capped at 1.5 on touch.

### What stage D should build on (Fireball against Entangle) [Stage D]

1. **Closed-form effects in story time.** Keep today's model: `T.bursts` with `mulberry(b.key)` and `age`, and docs/12
   `particleAt(burst, i, age, out)`. Each spell cue (`t0`, `release`, `impact`, `t1`, `seed`, `targets`) comes from
   the timeline, and every particle is a function of `(seed, i, age)`. Never integrate per frame. Seek, Beats mode and
   screenshots then stay exact, and the `build.py` check against `Math.random` stays green.
2. **`ParticleContainer`s, one per layer and blend mode.** Each one is one draw call:
   - `fxGround`, below `units`: Entangle's roots and the ground ends of the vines, the crack, the scorch glow.
   - `fxAir`, above `units`: the Fireball orb, trail embers, explosion sparks, smoke.

   Split each layer into a normal container and an `'add'` container. Set
   `dynamicProperties: { position: true, vertex: true, rotation: true, color: true, uvs: false }`; turn `uvs` on only
   for flip-book frames. Measured: 1,000 particles cost 0.4 ms of CPU per frame.
3. **One effects atlas.** Ember, spark, soft dot, four smoke puffs, ring, shock ring, three leaves, thorn, vine segment,
   root tip and scorch. Bake it once at load into one `RenderTexture` with `generateTexture`; in Phase 8 load it as an
   `Assets` spritesheet. Fold today's separate `texDot`, `texSoft`, `texPool` and `texChurn` into it, so effects never
   break the batch.
4. **A pre-warmed pool.** Size it from the docs/12 caps at the worst frame of `clash300` (for example 1,500). Recycle
   by index as `pull()` does; unused particles get alpha 0, or truncate `particleChildren` and call `update()`.
5. **No per-frame Graphics.**
   - The Fireball shock ring (140 wu) is one Sprite of the ring frame, scaled.
   - Entangle's vines are a `MeshRope` per vine. Their points come in closed form from the block hull and `t` (coil,
     then wither at `expire`). Roots are sprites.
   - The ground crack is a decal sprite revealed by scale and alpha.
6. **Light from additive sprites, not filters.** The orb halo and the impact glow are additive soft sprites. If heat
   shimmer is wanted, use a `DisplacementFilter` on a small container with `filterArea` set to the orb's bounds, on for
   the 0.7 s orb at High quality only, then removed. Never put a filter on `world`.
7. **The full-scene flash** (Entangle's release) is a full-screen `Sprite(Texture.WHITE)` in the overlay with an alpha
   curve. Route it through the flash limiter and the flashes filter (B3); reduce-flashing gives the soft variant.
8. **Canvas text is BitmapText.** Captions ("Cinder Magus: Fireball"), chips ("−3 DEF −1 ATT"), Entangle's countdown and
   damage floaters use pooled `BitmapText` from one bitmap font. The counters change every second, and Text would
   re-rasterise on every change. The HUD stays DOM.
9. **Decals go into the grouped decal layer** (B6): Fireball's 120 wu scorch and burnt kills, and Entangle's withered
   vines.
10. **Reduced motion and quality:** no shake, half the particle count, camera cuts (as today) and soft flashes. At 4x,
    the LOD drops particle counts.
11. **A budget with a check.** Add a `window.__battle` row
    `fx: { particles, drawCalls, updateMs, renderMs }` with a budget of at most 1 ms of effects update and at most
    4 extra draw calls at the worst frame of the fixture, measured with the existing `measure()`.
12. **Content is data** (`CLAUDE.md`). `SPELL_LOOK` (`31-build.js` l.4–16) belongs with the presentation content,
    keyed by spell id and mapped onto docs/02 section 5 primitives (`damage{element: fire, area}`, `debuff`), not in
    the timeline builder.

---

## 2. Game-screen map (`map/parts/`, built page `map/game-screen-v4.html`)

**Baseline.** CPU, Canvas2D. The map has 60 provinces and a 1024×640 bake.

| Measure | 1920×1080, DPR 1 | 390×844, DPR 3, phone layout |
|---|---|---|
| Bake: CPU / wall / slices | 5.7 s / 7.2 s / 67 | 8.0 s / 10.7 s / 74 |
| Long tasks before ready: count, max | 44, max 812 ms | 52, max 2,000 ms |
| Largest rAF gap before ready | 833 ms | 2,017 ms |
| Second look (Clear) baked while live | 4.8 s; 32 of 92 frames over 33 ms; max gap 400 ms | 5.0 s; 33 of 93 over 33 ms; max gap 550 ms |
| Static re-render, Far | not reachable | 47–65 ms |
| Static re-render, Mid | 52–81 ms | 125–215 ms |
| Static re-render, Near | 301–357 ms | 321–416 ms |
| Pan inside the cache, per draw | 2.1–2.2 ms (rAF pan p95 3.9 ms) | 3.0–3.9 ms (p95 10.1 ms) |
| Pan past the margin at Near | 1 re-render in 20 steps (90 ms) | 6 in 20 steps (337 ms) |
| Select a province at Near | 153 ms | 195 ms |
| Month change | 76 ms | 99 ms |
| Figure atlas ready | 2.1 s | 3.1 s |

### M1. Static re-render of 52–416 ms on every zoom settle, selection and pan past the margin [Pass 4]

- **Where.**
  - `p59-relief-draw.js` `rlDraw` l.185 re-renders whenever `cam.s !== RCK.s`, that is, after every zoom.
  - `rlStaticSig` (l.68) includes `state.sel`, `moveLine`, `rlPiecesSig()`, `curMonth`, `cw` and `ch`.
  - `p61-relief-pieces.js` `rlLayout` (l.95) keys its layout on `cam.s.toFixed(5)`.
  - `p59b-relief-lines.js` `rlWildRimMap` (l.278) keys its colour solve on `s0.toFixed(4)`.
- **Evidence.**
  - The numbers in the baseline table: a Near re-render is 18 to 25 frames.
  - Profile of a Mid re-render (57 ms each): `drawImage` is 49%. The wild-rim CIEDE2000 and CVD solve (p59b
    l.289–293: `rlPairDE`, `dE2000`, `rlLab`, `rlLumOf`, `col`) is about 27%, and it is re-solved on every settle.
- **Skill rules.** performance: cache by zoom band, do less, and amortise. Frame budget 16.67 ms.
- **Change.**
  - **(a) Under layer per band.** Cache the under layer (land, glow, fog, water) per zoom band at the band's reference
    scale, over the model or in 512 world-unit tiles. Blit it scaled within the band, and re-render only on a change of
    band, look, fog or ownership.
  - **(b) Quantise the over layer.** Step its layout scale (labels, pieces, rails) by 2^(1/8), about 9%. Blit it scaled
    within a step and re-lay only on a step change.
  - **(c) Re-key `rlWildRimMap`** on the band and the quantised scale.
  - **(d) Take `state.sel` and `moveLine` out of the static signature.** Draw the selection tint, the inner line and the
    thread live, as hover already is. Patch only the selected province where it changes the rim or muting.
  - **(e) Double-buffer.** Keep showing the scaled old cache and render the new one in slices of at most 8 ms, then swap.
  - **Budget:** no static work over 8 ms in any frame; sharp within 250 ms of a settle. Put both in `window.__mock`
    (`RREB` already counts re-renders).

### M2. The bake overruns the frame budget, and the 270-province map multiplies it [Pass 4; Phase 8]

- **Where.** `p58d-relief-water.js` `rlRunGen` (l.104–109) targets 28 ms slices with `setTimeout(0)` between them. The
  bake generators (p58b, p58m, p58n, p58w) yield only between whole raster passes, so a single step runs for 0.4 to
  2 s. `rlEnsureLook` bakes the second look while the map is live, for example the first time the player picks Clear
  terrain colours or the Terrain mode.
- **Evidence.** See the baseline table. The timings by step are in `rlTimes()`: materials 1,930 ms, wildTexels 974 ms,
  hillshade 642 ms, covers 620 ms.
- **Skill rule.** performance: "Defer/Amortize: spread procedural generation and loading across frames to avoid
  spikes".
- **Change.**
  - Yield inside the row loops, so that each step is about 2 ms.
  - While the map is interactive, use a slice budget of 6 to 8 ms (for example `requestIdleCallback` with
    `deadline.timeRemaining()`). Keep 28 ms only while "Preparing the map…" covers the screen.
  - Better: run the pure raster passes over `RB`'s typed arrays in a Worker and transfer `ImageBitmap`s back.
  - **For 270 provinces:** at the same texel density, the CPU bake scales to about 26 s (a linear estimate from 5.7 s
    at 60 provinces). Bake a cheap Far pass first (province fills plus hillshade at quarter resolution, about 1/16 of
    the texels, an estimated 0.5 s or less) and show it at once. Then bake Mid and Near detail region by region, nearest
    the camera first, in the worker. The farthest zoom never waits for Near detail.
  - **Phase 8:** the GPU bake that the `rlTimes()` design note targets ("a few ms to 15 ms on a GPU").

### M3. Pixi and a WebGL context are loaded only to rasterise 8 figures [Quick win; Phase 8]

- **Where.** `p61-relief-pieces.js` `rlStartFigures` (l.18–35) uses `autoDetectRenderer`, one `extract.canvas` per
  figure, then `renderer.destroy()`. The figures are then drawn with Canvas2D `drawImage` (p62 `rlFigure`, l.170).
  `p61a-figlib.js` is a copy of the battle library.
- **Evidence.** Real figures arrive 2.1 s after start at 1920 and 3.1 s at 390, while the bake runs; fallback figures
  show until then. pixi.min.js is 840 KB.
- **Skill rules.** pixijs: textures come through `Assets`, and `destroy({ releaseGlobalResources: true })` when another
  renderer may be created in the same tab. performance: asset budgets.
- **Change.** Bake the 8 figure canvases at build time into one PNG atlas, inline it as a data URI, and `drawImage`
  from it; drop Pixi from the map page. If it stays, call `renderer.destroy({ releaseGlobalResources: true })`.
  Phase 8: the map and the battle share one figure atlas through `Assets`.

### M4. A forced layout on every pan frame [Quick win]

- **Where.**
  - `p60a-camera.js` `viewRect` (l.7–15) calls `getComputedStyle` and `offsetWidth`, plus `rlControlsLeft` with
    `getBoundingClientRect` over the mode buttons. It runs from `clampCam` (l.45) on every pan step and mousemove.
  - `rlLayout` also calls `rlRibbonLay`, `rlControlsLay` and `rlViewLay`.
  - `rlPlacePieces` (p62 l.239–242) writes piece styles every draw, so the next read forces a layout.
- **Evidence.** A 60-frame rAF pan ran 60 to 61 layouts and style recalcs: 7.3 to 7.4 ms of layout plus 2.7 ms of
  style in total, or 0.17 ms a frame. Small today.
- **Change.** Cache the view rect and the control boxes. Invalidate them from a `ResizeObserver` on `#leftDock`,
  `#rightDock`, `#rail`, `#modes` and `#strip`, and on the phone class change.

### Map UI against game-ui-ux

#### U1. No keyboard path to provinces or march orders [Pass 4]

- **Where.**
  - `orderMove` is reached only from a right-click (`p80d-rest.js` l.40, p62 l.209) or a long-press (l.59).
  - Provinces are selected only by a click on the canvas, and the canvas is not focusable.
  - There is no arrow-key navigation.
  - The keyboard can reach army pieces (`.hit` with `role=button`), outliner rows and the top bar.
- **Skill rule.** game-ui-ux: every action reachable without a mouse.
- **Change.** Pass 4 search on `/`: a combobox listing provinces (and armies). Enter selects and centres the province,
  and the province card gets a "March [army] here" button. Optionally, arrow keys walk the `NB` neighbours when the map
  has focus, announced through a live region.

#### U2. The modal leaks focus and shortcuts [Quick win]

- **Where.** `p80d-rest.js` `openModal` and `closeModal` (l.178–179). The `p80e-start.js` keydown handler (l.3–19)
  handles only Escape for the modal.
- **Evidence.** With the Codex open:
  - 9 of 30 Tabs landed outside `#modal`, on the mockup header and on army pieces.
  - `M` and `3` changed the map mode (to dominion) and the speed (to 3) under the modal.
  - Escape left focus on `body`, not on the opener.
- **Skill rule.** game-ui-ux: trap focus inside modal dialogs, and use a screen stack (push and pop) rather than flags.
- **Change.**
  - Set `inert` on `#app`'s other children (and the page head) while the scrim is shown.
  - Return early from the global keydown handler when `!scrim.hidden`, except for Escape.
  - Store `document.activeElement` in `openModal` and focus it again in `closeModal`.
  - Phase 8: a screen stack in `src/ui`.

#### U3. Focus looks the same as hover, and the outline is removed [Quick win]

- **Where.** `orig-css.txt` l.42 (`.readout`), l.52 (`.screenbtn`), l.88 (`.iconbtn`) and l.124 (`.ucard`):
  `:hover, :focus-visible { background|border …; outline: none }`.
- **Evidence.** The tab order shows the readouts, screen buttons and rail icons focused with `outline: none` and the
  hover background.
- **Skill rule.** game-ui-ux, references section 3: "Visible focus style distinct from hover".
- **Change.** Split each rule into `:hover { background: … }` and
  `:focus-visible { outline: 2px solid var(--text); outline-offset: 2px }`. The pieces' `.mini .hit:focus-visible`
  (`p00d-relief.css` l.8) and `.modebtn:focus-visible` already do this.

#### U4. Touch targets at 390 px [Pass 4]

- **Evidence.** In the phone layout, all 15 visible controls are under 44 px:
  - rail icons 26×26 (three of them);
  - army piece hits 22 to 27 px wide;
  - alerts 34×34;
  - readouts 34 px tall.

  On desktop, the speed pips are 14×18, pause is 26×22 and Fit is 34×26.
- **Skill rule.** game-ui-ux, references section 6: hit targets of about 9 mm or more (34 CSS px minimum, 44 preferred),
  with padding.
- **Change.** At the phone breakpoint, give `.iconbtn`, `.alert`, `.pausebtn` and the speed group, and the readouts, a
  44 px hit area. A transparent `::after` inset of −9 px keeps the art size. Pass 4's pins, search and mute controls
  should start at 44 px.

#### U5. Viewport and safe areas [Phase 8; also Pass 4 if the page is opened standalone]

- **Where.** The page has no `<meta name="viewport">` of its own: `p00a-head.html` carries only
  `claude:viewport-fit-sides` and relies on the artifact host's skeleton. The only safe-area rule is the page head's
  left and right padding (`orig-css.txt` l.20–21). The top bar, strip, mode column and docks use fixed pixel insets.
- **Evidence.** Opened standalone with `isMobile` at 390×844, the layout was 980 px wide and the phone class was off.
- **Skill rule.** game-ui-ux: respect the safe area and inset critical UI.
- **Change.** Phase 8 `index.html`:
  `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, plus
  `env(safe-area-inset-*)` on the top bar (top), the strip and the docks (bottom), and the mode column and rail (right).

#### U6. State is not exposed: speed pips and mode buttons lack `aria-pressed` [Quick win]

- **Where.** `#speed button` (`p00c-body.html`) and `.modebtn` (`p80d-rest.js` l.109) carry their state only in the
  `.on` class.
- **Evidence.** `aria-pressed` was null on all 5 speed buttons and all 7 mode buttons. Visually, the filled pip
  separates by ΔE2000 72 under every vision, so this is not colour alone. Paused shows the "PAUSED" word plus stripes,
  which is good.
- **Skill rule.** game-ui-ux, accessibility: do not encode state in colour alone; expose it.
- **Change.** Set `aria-pressed` wherever `.on` toggles, as `btnPass` already does (p80e l.89).

#### Checked and fine

- Reduced motion is read from the OS at load (`p40-scene.js` l.16). It gates the ambience, the camera ease and the
  fades. Adding a `change` listener would make it complete.
- The 30 fps ambience `present()` costs 0.01 to 0.04 ms and stops under reduced motion, a hidden tab or an open modal.
- Panels update on events: the day tick updates the top bar and badges once per game day (`p80d-rest.js` `tick`,
  l.158), and the month change re-renders once.
- Province picking is spatial (`p12-edges.js` `provinceAt`: nearest site, then its neighbours).
- Hover never re-renders the static cache. A hover draw costs 4.4 to 7.2 ms, including the blit.
- The pieces' focus ring, the modal's initial focus on Close, and labelled icon buttons are in place.

---

## 3. Stage B review page (`units/stage-b/review.html`, before the rebuild)

### R1. 515 tab stops, with the verdict at stop 498 [for the rebuild]

- **Where.** The page script (l.689) gives every `img.z` `tabIndex = 0` and `role=button`: 330 visible images, 474 in
  all including closed `<details>`.
- **Evidence.** The same at 390 px and at 1440 px.
- **Skill rule.** game-ui-ux: keyboard reachability and focus order.
- **Change.** Pictures are not tab stops. Give each figure group one "View full size" button that opens a
  gallery-lightbox stepped with the arrow keys. Add a skip link to the verdict at the top, next to `nav.toc`.

### R2. The lightbox does not hold focus [for the rebuild]

- **Where.** The `#lb` script (l.687–695). It has `role=dialog`, `aria-modal`, focus on Close, Escape, and focus
  returns to the opener: all good.
- **Evidence.** 5 of 5 Tabs after opening went to the page behind it.
- **Skill rule.** game-ui-ux, references section 3: trap focus inside modal dialogs.
- **Change.** Set `inert` on `.wrap` while it is open, or wrap Tab between its controls.

### R3. Ok and flaw differ by colour alone [for the rebuild]

- **Where.** `ul.stat li::before` and `li.flaw::before` (l.120–121): a 7 px dot, green `#8CC08A` against orange
  `#E8957A`, with no glyph.
- **Evidence.** ΔE2000 41.9 with normal vision, but 4.9 under deutan and 6.9 under protan, using the battle util's
  Machado and CIEDE2000 code. The project's minimum is 12. The tables are fine: `.ok` carries "✓" and `.bad` carries
  words.
- **Skill rule.** game-ui-ux, references section 6: do not encode state in colour alone; add icon, shape or text.
- **Change.** Use `content: '✓'` and `content: '!'` (or `✕`), or a filled dot against a ring.

### R4. Small targets at 390 px [for the rebuild]

- **Evidence.**
  - `nav.toc a` and `.answers a`: 20 px tall.
  - `details.more summary`: 32 px.
  - `#lb button`: about 32 px.
  - The pick buttons are 48×40: above the 34 px minimum, below the 44 preferred.
- **Change.** `min-height: 44px` (with `display: inline-flex; align-items: center`) on the links, summaries and the
  lightbox Close; pick buttons to 44 px.

### R5. The lightbox Close ignores safe areas [for the rebuild]

- **Where.** `#lb button { top: 10px; right: 12px }` (l.168), under `viewport-fit=cover`.
- **Change.** `top: max(10px, env(safe-area-inset-top)); right: max(12px, env(safe-area-inset-right))`.

### Patterns to keep in the rebuild (and reuse in `src/ui`)

- Pick buttons are real `<button>`s with `aria-pressed`. The pressed state changes the fill, not only the hue, and the
  word ("Keep", "Redo") stays.
- A single `:focus-visible` rule gives a 2 px brass outline that is distinct from hover's border change.
- Inputs are labelled (`aria-label="Note: …"`).
- Picks and notes persist with a try/catch around `localStorage`.
- The copy-verdict button falls back to selecting the text.
- Body padding uses `max(16px, env(safe-area-inset-*))`.
- Tables reflow to labelled rows at 560 px (`td::before { content: attr(data-label) }`).
- No horizontal scroll at 390 px (`scrollWidth` 390).
