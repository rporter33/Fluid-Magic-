> Status: proposed 2026-10-22 from the owner's visual references (`visual-references.owner-direction.md`), pending the owner's review of the mockups. Paths starting `scratchpad/` are the design workspace, outside the repo.

# Overhead battles and a relief map in Pixi 8: what it costs, measured

2026-10-22. This is technical research for the owner's new direction
(`docs/design/visual-references.owner-direction.md`):

- an overhead three-quarter battle with massed formations, one figure per soldier, huge monsters, volleys and
  persistent blood;
- a clean relief-terrain map with thin owner borders, a light tint and miniatures on bases.

It measures how to build both in the browser with the repo's pixi.js 8.22.0. It does not redesign the battle
layout or the palette. Those are design jobs, and this file gives them numbers. Nothing in the repo was edited.

## How to read the numbers

**Where they were measured.**

- Headless Chromium 141 through Playwright, with WebGL 2 on **SwiftShader**, a software GPU. The GPU work runs on
  the CPU.
- A 4-core Xeon at 2.8 GHz, shared with the QA job's fuzzers for the whole session. The load average was 4 to 10.
- pixi.js 8.22.0 from `node_modules`. The renderer reports a batch limit of 32 textures.

**What transfers to real machines, and what does not.**

- **CPU times transfer.** These are the JS update plus Pixi's scene walk, batching, buffer upload and GL calls.
  - A mid laptop's single core is about as fast as this one, or up to 1.5× faster. The shared load makes the
    numbers here pessimistic.
  - CPU numbers are p50 / p95 over 150 to 240 frames, after a warm-up.
- **"GPU wait" times do not transfer.** This is the time the CPU waits for the GPU to finish a frame (a forced
  1-pixel `readPixels` sync).
  - Here it is SwiftShader rasterizing on the CPU. A real GPU is one to two orders of magnitude faster on this
    work.
  - So for the GPU side I give **fill-rate arithmetic**, marked as an estimate. These are fill-bound 2D scenes, so
    the arithmetic is reliable to within about 2×.
- **"Phone"** means Chrome's 4× CPU throttle, applied to the page's main thread. That is roughly a mid Android
  phone's JS speed. It is a CPU estimate only: no phone GPU was measured.

## The answer, first

**(a) Battles: feasible at 60 fps with one figure per soldier, up to about 3,000 figures on a laptop and 1,500
on a phone.**

The rows are the full stress scene: figures plus 400 arrows, 1,500 blood droplets, one death a frame stamped into
the decals, and a monster. The effects alone are 0.4 to 0.6 ms of it (A4).

| | 600 figures | 1,500 | 3,000 | 6,000 |
|---|---|---|---|---|
| **ParticleContainer + atlas + insertion sort** (update + render CPU, p50) | 0.6 + 0.4 ms | 0.7 + 0.4 ms | 1.0 + 0.7 ms | 1.1 + 0.9 ms |
| Container of Sprites + atlas + insertion sort | 0.7 + 0.7 ms | 1.0 + 1.3 ms | 1.6 + 2.1 ms | 2.4 + 3.8 ms |
| Phone class, ParticleContainer (p50 / p95 of update + render) | 3.3 / 10.8 ms | 2.2 / 13.6 ms | 5.5 / 15.4 ms | — |
| Phone class, Sprites | — | 8.2 / 24.4 ms | — | — |
| GPU, estimated, laptop iGPU at 1920×1080 | under 1 ms | about 1 ms | 1 to 2 ms | 2 to 3 ms |

- In the phone rows, the p95 column adds the two p95s. That overstates a single frame's p95.
- Draw calls are 4 or 5 per frame in every case: ground, decals, troops, arrows and blood.

**(b) Map: bake once per game, then about 0.2 ms of CPU and one draw call per frame.**

- The relief bake costs seconds on the CPU (3.3 s at 2048 × 1280 here), most of it noise. So:
  - move the noise passes to the GPU;
  - keep only the topology on the CPU (lakes, rivers);
  - cache the result by map seed.
- Ownership changes once a turn, through a 256 × 1 palette texture.
- Two findings change the design:
  - Relief shading as built here breaks the docs/09 distinct-colors rule. That needs a ruling.
  - A raster border field fails at near zoom. Borders should be vector lines from the mapgen polygons.

**Recommendation in one paragraph.**

- **Rendering.** Draw soldiers with `ParticleContainer`. Use one atlas per battle and sort by ground y each frame
  with an insertion sort. Split the troops into depth bands around monsters and commanders.
- **Figures.** Make rank-and-file figures from **procedural vector parts baked into that atlas**. They are cheap and
  deterministic, every nation and custom pretender gets them for free, and they show the side color best.
- **Monsters, commanders and pretenders** become **generated painted cutouts on a deformed mesh**. That is where the
  painted look pays most and counts are small.
- **Decals** are stamped into one ground RenderTexture and re-baked on seek.
- **The map** is baked once per game:
  - GPU passes for the heightfield, hillshade and composite;
  - CPU worker passes for lakes and rivers;
  - trees baked in;
  - upload from typed arrays;
  - ownership drawn by one shader pass plus vector border lines.

Details and evidence follow.

---

## (a) The battle

### A1. Soldier figures at 600, 1,500, 3,000 and 6,000

**The bench** (`bench/battle.js`) is a stress scene in which every figure moves and changes frame every frame.

- Two armies in 100-soldier blocks: 60% melee, 25% archers, 15% cavalry.
- Every figure changes position and animation frame every frame.
- 400 arrows in flight on closed-form arcs.
- 1,500 blood particles.
- One death every frame: a body and a blood splat stamped into the ground texture, with a spray of droplets.
- One monster on a deformed mesh.

The figures come from the procedural atlas of A5: 64 px cells, drawn at 0.5 scale, so a figure is about 25 px
tall at zoom 1. The CPU numbers below come from a 480 × 270 viewport, which keeps SwiftShader's fill time down.
The CPU work does not depend on viewport size.

**CPU per frame in ms, p50 (p95).**

- "Update" is the whole scene's JS: figures, arrows, blood, monster, sort, and the stamp draw into the decal
  texture.
- "Motion" is the part that moves things: figures, arrows, blood and the monster mesh.
- "Render" is Pixi's `renderer.render`.

| Figures | Mode | Sort | Update | of which motion | Sort | Render | Draws |
|---|---|---|---|---|---|---|---|
| 600 | Sprites | none | 0.7 (1.5) | 0.4 | — | 0.4 (1.3) | 4 |
| 600 | Sprites | zIndex | 0.8 (1.2) | 0.5 | — | 0.7 (1.8) | 4 |
| 600 | Sprites | insertion | 0.7 (1.3) | 0.4 | 0.0 (0.1) | 0.7 (1.7) | 4 |
| 600 | Particles | none | 0.5 (1.1) | 0.3 | — | 0.3 (0.8) | 5 |
| 600 | Particles | insertion | 0.6 (1.4) | 0.3 | 0.0 (0.1) | 0.4 (1.5) | 5 |
| 1,500 | Sprites | none | 1.0 (1.8) | 0.6 | — | 0.7 (1.9) | 4 |
| 1,500 | Sprites | zIndex | 1.0 (1.7) | 0.7 | — | 1.4 (2.8) | 4 |
| 1,500 | Sprites | insertion | 1.0 (1.8) | 0.6 | 0.1 (0.2) | 1.3 (2.8) | 4 |
| 1,500 | Sprites, **no atlas** | insertion | 1.1 (1.8) | 0.7 | 0.1 (0.2) | 1.3 (4.7) | 5 |
| 1,500 | Particles | none | 0.6 (1.6) | 0.3 | — | 0.4 (1.3) | 5 |
| 1,500 | Particles | insertion | 0.7 (1.2) | 0.3 | 0.0 (0.1) | 0.4 (1.2) | 5 |
| 3,000 | Sprites | none | 1.2 (3.2) | 0.9 | — | 1.2 (5.2) | 4 |
| 3,000 | Sprites | zIndex | 1.4 (2.5) | 1.1 | — | 2.7 (6.9) | 4 |
| 3,000 | Sprites | insertion | 1.6 (3.4) | 1.1 | 0.2 (0.4) | 2.1 (5.9) | 4 |
| 3,000 | Particles | none | 0.7 (1.2) | 0.4 | — | 0.4 (1.2) | 5 |
| 3,000 | Particles | insertion | 1.0 (1.8) | 0.6 | 0.1 (0.2) | 0.7 (1.7) | 5 |
| 6,000 | Sprites | insertion | 2.4 (5.0) | 1.7 | 0.4 (0.8) | 3.8 (9.8) | 4 |
| 6,000 | Particles | insertion | 1.1 (2.1) | 0.7 | 0.1 (0.2) | 0.9 (3.6) | 5 |

What this shows:

- **Every configuration fits a 16.7 ms frame on a laptop CPU, even at 6,000.** CPU is not the limit on desktop. The
  choice matters for phones and for headroom: the timeline evaluation, HUD and audio share the same frame.
- **`ParticleContainer` costs half or less of Sprites at 1,500 and up.**
  - At 6,000 it is 4× cheaper to render (0.9 against 3.8 ms).
  - It uploads every particle's data each frame anyway, so re-ordering is free.
- **Sprites pay for depth sorting in Pixi's render.** Any child re-order sets the render group's
  `structureDidChange`, and the whole instruction set is rebuilt.
  - Pixi's own `zIndex` sort costs +0.7 ms at 1,500 and +1.5 ms at 3,000 over no sort.
  - The insertion sort itself is 0.1 to 0.4 ms. Ground y changes little between frames, so the data is nearly
    sorted and the sort is close to O(n).
- **The atlas matters less for draw calls than expected on desktop, and more on phones.**
  - The no-atlas run (one texture per frame) made 5 draws against 4. Pixi batches up to 32 textures per draw here,
    and this scene only used about 40 distinct frames.
  - A real roster (12 unit types a side × 2 facings × about 11 poses) passes 16 textures (a phone's usual limit)
    and 32 easily.
  - Its render p95 was already worse: 4.7 against 2.8 ms.
  - More important: **`ParticleContainer` requires one texture source**, so the atlas is not optional on the fast
    path.
- **Memory.** The JS heap stayed at 34 to 66 MB in every run. The procedural atlas is 8 MB (2048 × 1024 RGBA,
  300 frames).

**On a GPU (estimate, not measured).** These are 2D quads with alpha blending, so cost is fill.

- At 1920 × 1080 the ground and the decal sprite cover the screen twice: about 4.1 Mpx.
- Each figure's quad is 32 × 32 px: 1,024 px, so 3,000 figures add about 3.1 Mpx.
- Arrows, droplets and a 300 px monster add under 0.2 Mpx.
- That is about 7.3 Mpx per frame, or about 440 Mpx/s at 60 fps.
- A laptop integrated GPU blends several Gpx/s in practice, so **about 1 to 2 ms**.
- A mid phone (about 2 to 4 Gpx/s, with the renderer resolution capped at 1.5) needs **about 2 to 4 ms**.
- Vertex work (about 12,000 vertices) is negligible.

For the record, SwiftShader needed 475 to 750 ms per full-HD frame. That says nothing about a GPU.

**Phone class (4× CPU throttle), p50 (p95).**

| Figures | Mode | Update | Render |
|---|---|---|---|
| 600 | Particles | 2.2 (6.0) | 1.1 (4.8) |
| 1,500 | Particles | 1.6 (6.2) | 0.6 (7.4) |
| 3,000 | Particles | 3.4 (8.5) | 2.1 (6.9) |
| 1,500 | Sprites | 4.1 (9.2) | 4.1 (15.2) |

- With particles, p50 stays under 6 ms at 3,000. The p95 spikes (GC and throttling jitter) reach about 15 ms
  combined, which is too close to 16.7 ms with the timeline, HUD and audio on top.
- Sprites at 1,500 already reach 24 ms at p95.
- So on phones: **particles only, at most 1,500 figures**, and `resolution` at most 1.5.

### A2. Depth sorting with big actors in the scene

- **The interleaving problem.** A `ParticleContainer` draws its particles in array order and cannot hold other
  display objects. A monster, a commander or a size-4 unit cannot sit between two soldiers inside it.
- **The fix: depth bands.** Each frame, after the insertion sort, the troop array is cut at the ground y of each
  big actor's feet.
  - Each slice goes into its own `ParticleContainer`, with the big actor's mesh or sprite between the slices.
  - M big actors make M + 1 troop draws. A battle with 6 large bodies stays at about 12 draw calls, against the
    10 that docs/12 S4.9 already allows.
  - The cut is one pass over an array the bench already sorts (0.1 to 0.4 ms).
  - Not built here.
- **Picking.** Hover cards need a hit test, and a `ParticleContainer` has none. Pick against squad block bounds in
  JS: a few hundred rectangles at most, negligible.

### A3. Decals baked into a RenderTexture

`bench/decals.js` stamps bodies (the lying pose of a figure) and blood splats into one RenderTexture. The layer is
drawn with `clear: false`; the stamped sprites go back to a pool.

| | 2048 × 2048 (16 MB) | 4096 × 4096 (64 MB) |
|---|---|---|
| CPU to stamp 1 / 10 / 50 / 200 / 1,000 decals in one batch | 0.2 / 0.2 / 0.3 / 0.5 / 1.0 ms | 0.1 / 0.3 / 0.3 / 0.4 / 0.9 ms |
| Full re-bake of 8,000 decals (backward seek, context restore), CPU | 7.0 ms (p95 9.3) | 8.7 ms (p95 38.8) |
| Same, with SwiftShader raster | 2.06 s | 2.93 s |
| Frame cost of showing the field: one baked sprite, CPU / SwiftShader | 0.2 ms / 186 ms | 0.2 ms / 224 ms |
| Frame cost of 8,000 live decal sprites (static render group), CPU / SwiftShader | 0.3 ms / 1,824 ms | 0.2 ms / 2,052 ms |

- **Baking is right.** The CPU cost is the same either way, because a static render group is cheap. But live decals
  multiply fill.
  - 8,000 decals at about 1,500 px each is about 12 Mpx of overdraw every frame, on top of A1's 7 Mpx.
  - SwiftShader shows the ratio: 10×.
- **Re-baking 8,000 decals for a seek is about 8 ms of CPU.** The GPU side is about 8,000 quads at roughly
  1,000 px, about 8 Mpx: 1 to 2 ms on an iGPU (estimate). docs/12 S4.9's re-bake budget of 15 ms holds on
  desktop. On a phone it is a one-off hitch of perhaps 20 to 40 ms, acceptable for a seek.
- **Size.** Use a ground texture of 2048 × 1152 (9 MB) at 1 px per world unit.
  - Desktop may double the density for sharp close zoom: 3840 × 2160, 32 MB.
  - 4096² (64 MB) is too much for phones.
- During the battle bench, per-frame stamping of a body, a splat and stuck arrows cost 0.2 to 0.3 ms p50.

### A4. Arrows, blood, monsters: counted in A1

- **Arrows.** 400 arrows on closed-form parabolic arcs, in a `ParticleContainer` with `position` and `rotation`
  dynamic. Their position follows from the launch time, so seek stays exact, as docs/12 requires.
  - 35% of landings stamp a stuck arrow into the ground.
- **Blood.** 1,500 droplets with gravity and fade, in one `ParticleContainer`.
- **Cost, measured by switching the effects off** (`bench/out/battle-fx-delta.jsonl`, ParticleContainer with
  insertion sort):

  | | Update p50 (p95) | Render p50 (p95) | Draws |
  |---|---|---|---|
  | 1,500 figures alone | 0.2 (0.3) ms | 0.4 (0.9) ms | 2 |
  | 1,500 figures + 400 arrows, 1,500 droplets, monster, one death a frame | 0.6 (1.3) ms | 0.4 (1.0) ms | 5 |
  | 3,000 figures alone | 0.3 (0.6) ms | 0.5 (1.4) ms | 2 |
  | 3,000 figures + **600 arrows** (docs/12's ceiling), droplets, monster, deaths | 0.9 (1.7) ms | 0.6 (2.3) ms | 5 |

  - The effects cost 0.4 to 0.6 ms of update and about 0.1 ms of render.
  - Moving 1,500 figures and changing their frames costs 0.1 ms. Pixi's render is most of the remainder.

### A5. Making the soldier figures: procedural vector atlas vs generated painted sprites

Both were built and put side by side at battle scale
(`bench/out/compare-figures.png`, `bench/out/battle-1500-hd.png`, `bench/out/battle-1500-painted-hd.png`).

**Procedural vector figures** (`bench/figures.js`). Original shapes drawn for this bench:

- Parts are Pixi `Graphics`: legs, tunic in the nation cloth, armor, arms, head and helmet lit from the upper left,
  shield with a trim rim, and a weapon by archetype (spear, sword, axe, bow, rider with lance), plus a baked
  ground shadow.
- They are drawn at 2× into 64 px cells, with the nation colors applied at bake time. Each (unit, nation) is one
  sprite per figure at run time.
- 300 frames: 5 kinds × 3 nations × 2 facings (se, ne; flipped for sw, nw) × 10 poses (idle, walk ×4,
  attack ×3, die ×2).

**Generated painted figures** (`painted/`). `tools/art/gemini_gen.py`, model `gemini-nano-banana-2.1`:

- One 4 × 4 sheet of a Cinder Horde warrior on flat magenta: walk, axe swing, fall, dead. Prompt in
  `painted/soldier-sheet.txt`.
- Keyed with `painted/key.py`, sliced, and scaled with a premultiplied-alpha Lanczos filter into the same 64 px
  cells.
- A second nation was made by moving the saturated orange-red pixels to Thornwood green, keeping the painted
  shading.

| | Procedural vector atlas | Generated painted sprites |
|---|---|---|
| Build cost | Graphics tessellation 52 to 78 ms for 300 frames, plus one bake into the atlas (180 to 590 ms in SwiftShader; a few ms on a GPU). At 4× throttle the whole build took 1.4 to 2.4 s, most of it SwiftShader. | 15.0 s per sheet (2,948 tokens). Keying a 1024² sheet takes 1.0 s in numpy. Then slicing and checking by hand. |
| Coverage | Every unit × nation × pose × custom pretender look from data, at run time. Adding a nation is a palette. | One sheet per unit type per nation per facing. Roughly 50 to 100 sheets for M1 with back views, plus re-rolls. |
| Camera | Exactly as designed. | **Not obeyed.** Asked for 55° overhead facing lower right. Got a near-front chibi view, and the wyrm in near side view. Untested fix: pass a camera reference image (the tool accepts references). |
| Animation frames | Real cycles (walk legs alternate, swing arcs). | **Not real cycles.** The four "walk" frames are nearly identical: heights 191 to 192 px, widths 147 to 149 px, a 0.5% spread. Swing frames vary in height from 179 to 228 px. Usable as key poses only, with motion from transforms (docs/09's animation table already works this way). |
| Keying | Not needed. | Clean on a flat key. A magenta tint remained on 3.5% of visible pixels, all within 3 px of the cutout edge. A 1 px alpha erosion cuts it to 0.16%. After the downscale to battle size it was 1.5% without erosion. |
| Side color at battle zoom: share of a formation's visible pixels in the side's hue | **38% (zoom 1), 37% (zoom 2)** for Cinder; 22% for Thornwood (zoom 2) | **24% (zoom 1), 22% (zoom 2)** for Cinder; 13% for Thornwood after the hue recolor |
| Look | Clean toy-soldier read, nation obvious at zoom 1. Weak at close zoom: flat shapes. The fallen pose is a rotated standee and reads poorly. | Clearly richer at zoom 2. At zoom 1 a dense block reads as grey helmets: the side's color hides under helmets and grey skin. Dead bodies read very well. |
| Second nation | A palette swap at bake time. | Hue recolor works on clearly separated cloth hues: 22.9% of pixels moved. It fails where nations share hues, so the alternative is generating each nation. |
| Determinism and size | Deterministic per Pixi version. 8 MB per 300 frames. | Files in the repo, like the portraits. Same memory at the same cell size. |

**Verdict.**

- **Procedural is the default for rank-and-file.** It wins on readability at the massed zoom (side-color share
  about 1.6× higher), coverage, consistency, cost, and the custom pretender looks.
- **Painted earns its place where counts are small and the eye lingers.** That means monsters, commanders,
  pretenders and close zoom.
- Painted rank-and-file is worth a second trial only with:
  - a camera reference image;
  - a prompt that puts the side color on top-visible surfaces (helmet crest, pauldrons, the shield face toward the
    camera), with a target of 30% or more side-color share at zoom 1;
  - transforms for all motion.

### A6. Monsters: painted cutout with moving parts vs procedural

`bench/monster.js` puts one texture on a `MeshPlane` with a 24 × 16 vertex grid (384 vertices).

- Each frame moves the vertices by weights in UV space: wings flap, the tail sways, the neck and head bob.
- There are no cut parts and no bones file. The same code animated both a procedural wyrm drawn with `Graphics` and
  the generated painted Great Wyrm (`painted/wyrm.png`, keyed on green with no residual fringe, 14.6 s to
  generate).
- **Cost.** 0.02 ms mean (0.4 ms max) per frame for two monsters, plus one draw each.
- **Look** (`bench/out/compare-figures.png`). The painted cutout is far better. The procedural monster reads as
  paper cut-outs next to it.
- **Choice.** Painted cutout on a deformed mesh for every monster and large body. Its motions are:
  - breath, bite and claw as mesh lunges and hit flashes;
  - flight as a lift with the shadow left on the ground;
  - death as a tilt and fade, then a darkened copy stamped into the decals.
- **Risk.** The generator's camera angle, as in A5. Each body needs one image, or two if a back view is wanted.
  That is a small set.

### A7. What this changes in docs/12 (technical only; the battle redesign decides)

- **S2.5.** One figure per soldier up to a per-device cap: 3,000 visible size-1 figures on desktop, 1,500 on
  phones. Above that, the `visible()` rule with larger caps.
  - Kills map literally to figures. Ghost bodies remain only above the cap.
- **S4.3.** `troops` becomes depth-banded `ParticleContainer`s over one battle atlas. Big actors are meshes or
  sprites between the bands.
  - `shadows` disappear: shadows are baked into the figure frames, on flat ground.
- **S4.4.** Per-part rigs of about 8 sprites per actor are replaced by one baked frame per pose for troops.
  - Mesh deformation is used for monsters and commanders.
  - The `PartSet` seam stays and now produces atlas frames.
- **S4.2.** `antialias: true` buys nothing for sprites and costs fill on phones. Use `false`, as the bench did.
  Cap `resolution` at 1.5 on phones.
- **S4.9.** The budgets still hold. The measured CPU for troops, projectiles, particles and decals is about 2 ms
  at 3,000 figures.

---

## (b) The map

### B1. What was built

`bench/terrain.js` bakes a 60-province map with aspect 1.6, like mapgen's rounded rectangle. Images:
`bench/out/map-far.jpg`, `bench/out/map-mid.jpg`, `bench/out/map-near.jpg`, and `bench/out/w4096/` for 4096.
Steps:

1. A province id raster (Voronoi of jittered sites, with straight borders like the game's convex cells), inside a
   noisy land outline.
2. Terrain weights:
   - one-hot per terrain;
   - looked up through a two-octave domain warp of up to about 150 px, so forests and ranges wander across
     straight province borders;
   - box-blurred twice at half resolution.
3. A heightfield:
   - a per-terrain base and amplitude;
   - 6-octave Perlin fBm, plus 6-octave ridged noise where mountains and hills weigh in.
4. A Horn hillshade, lit from the northwest at 40°.
5. Lakes: a priority flood at quarter resolution, keeping depressions deeper than 0.02 with at least 60 cells,
   drawn with a bilinear shoreline.
6. Rivers: D8 flow accumulation, traced from sources and smoothed. Waterfalls where a river leaves the model.
7. The color composite:
   - the palette-ab decision's view-B fills, blended by weight;
   - field strips, rock and snow;
   - the cliff skirt: a strata rock face below the land's southern edge, with a depth that wanders, plus a contact
     shadow. Everything outside the land is transparent, so the oak war table shows through.
8. A tree scatter on a jittered grid, gated by forest weight, with clearings, ragged edges and a few lone trees.
   Trees are baked into the map texture.
9. A per-frame composite shader: owner tint from a province id texture and a 256 × 1 owner palette, a stronger tint
   on the selected province, and thin borders from a distance field.

### B2. Bake times (CPU, ms, measured here under load)

| Step | 1024 × 640 | 2048 × 1280 | 4096 × 2560 |
|---|---|---|---|
| 1. Province id raster + land mask | 248 | 390 | 1,594 |
| 2. Terrain weights (warp + blur, half res) | 202 | 516 | 1,718 |
| 3. **Heightfield** (fBm + ridged) | **490** | **1,356** | **5,352** |
| 4. **Hillshade** (Horn) | **47** | **76** | **191** |
| 5. Lakes and rivers (quarter res) | 74 | 216 | 566 |
| 6. Composite + cliffs | 247 | 719 | 2,442 |
| 7. River strokes (canvas 2D) | 10 | 39 | 106 |
| **CPU bake, steps 1 to 7** | **1,318** | **3,311** | **11,967** |
| Upload from a **canvas** (`Texture.from(canvas)`) | 603 | 2,308 | 8,517 |
| Upload from a **typed array** (`BufferImageSource`) | 20 | 47 | 152 |
| Border distance field (chamfer, 2 passes) | 125 | 255 | 650 |
| Heap after the bake | 25 MB | 77 MB | 233 MB |

Earlier 2048 runs of this recipe and its first drafts measured 2.8 to 3.4 s for steps 1 to 7, with the
heightfield at 1.2 to 1.5 s.

**The hillshade itself is cheap: 76 ms at 2048.** The cost is the procedural heightfield under it: 1.36 s, 41% of
the bake.

**GPU version** of the heightfield and hillshade: two fragment passes into RenderTextures.

- Weights go in as a float texture with hand-written bilinear filtering, because float linear filtering is optional
  on phones.
- An 8-bit weight texture made visible terraces in the hillshade.
- Height is packed into 16 bits in RG.

| | 1024 | 2048 | 4096 |
|---|---|---|---|
| Height pass, SwiftShader | 81 ms | 381 ms | 1,370 ms |
| Hillshade pass, SwiftShader | 33 ms | 101 ms | 308 ms |
| Packing weights for the GPU (CPU) | 79 ms | 242 ms | 649 ms |

**On a real GPU (estimate).** The height pass costs about 12 noise octaves at roughly 30 operations each per pixel.
At 2048 that is about 1 GFLOP:

- a laptop iGPU (about 1.5 TFLOPS) needs **about 1 to 3 ms**;
- a phone needs **5 to 15 ms**.

Once per game either way.

**Uploading from a canvas was 50× slower than from a typed array** here. Some of that is SwiftShader's canvas
read-back; Chrome on a GPU copies faster, but still not for free. Keep the bake in typed arrays end to end. Draw
rivers into the raster, or with Pixi into the RenderTexture, not with canvas 2D.

### B3. Trees

| Spacing at 2048 | Trees | Scatter (CPU) | Bake into the map (SwiftShader) | Live every frame, CPU p50 (p95) |
|---|---|---|---|---|
| 4.2 px | 23,316 | 86 ms | 0.93 s | 1.2 ms (3.2) |
| 2.6 px | 60,955 | 132 ms | 0.70 s | 2.4 ms (6.1) |

- Forest covers about 22% of provinces (mapgen's `TERRAIN_SHARES`). The 4.2 px spacing gives the "dense dark
  masses" read at far and mid zoom (`map-far.jpg`).
- **Bake the trees into the map texture.** Baking costs one draw of 23,000 to 61,000 quads (a few ms on a GPU).
  Keeping them live costs 1.2 to 2.4 ms of CPU every frame: too much on a phone, for no gain at far zoom.
- At near zoom, add live tree particles only for the chunks in view, with a higher-resolution tree texture. That is
  about a ninth of the map at 3×. Not built.

### B4. The frame: tint, selection, borders

| Per frame at 1600 × 1000 | CPU p50 (p95) | Draws | SwiftShader GPU wait |
|---|---|---|---|
| Composite shader (map texture + id texture + palette), far, mid, near zoom | 0.2 ms (0.4 to 0.8) | 1 | 66 to 70 ms |
| The same baked map as a plain sprite | 0.2 ms (0.3) | 1 | 140 ms |
| Owner palette update (one province changes owner) + a tiny draw | 11 ms with sync | — | — |

- **The composite is free on the CPU.** On a GPU it reads 3 texels per pixel: about 5 Mtexel at 1600 × 1000 (under
  0.5 ms on an iGPU, about 1 to 2 ms on a phone at 2400 × 1080, estimated).
  - SwiftShader timed it faster than the plain sprite. That is noise under load, not a result.
- **Hover and selection are a uniform**, so they cost nothing.
- **Ownership is a 256 × 1 texture update once per turn.**
- **The raster border field failed at near zoom: the lines vanished.**
  - The id and distance texture is sampled nearest, at about 0.5 texel resolution. Once a texel spans more than
    about 2.5 screen pixels (4× zoom on the 2048 bake), a border pixel's distance is already wider than the line.
  - At 4096 the lines stay crisp (`bench/out/near-2048-vs-4096.jpg`).
  - **Use vector lines instead.** mapgen already gives convex polygons: about 60 cells × 6 edges, about 360
    segments. Draw them as a screen-width line mesh, rebuilt on zoom change (cheap), each side in its owner's color
    as the direction asks.
  - Keep the id texture only for the tint, so the tint stops at the land edge and the coast noise in one pass.
- **Miniatures on bases.** Armies and towns are a few dozen to a few hundred sprites: one batch, negligible.
  - They can reuse the battle atlas at 2× with a round base in the owner's color, or painted cutouts like the
    portraits.

### B5. Resolution and memory

| Bake | RGBA | With mips | Near zoom (4× the far view on a 1600 px screen) |
|---|---|---|---|
| 1024 × 640 | 2.5 MB | 3.3 MB | 6 screen px per texel: blurry |
| 2048 × 1280 | 10 MB | 13 MB | 3.1 px per texel: soft (`map-near.jpg`) |
| 4096 × 2560 | 40 MB | 53 MB | 1.6 px per texel: sharp (`w4096/map-near.jpg`) |

Add 10 MB for the 2048 id texture.

- **Phones: 2048 × 1280.** Add a tiling detail texture modulated in the composite pass, so near zoom has grain
  without the memory.
- **Desktop: 4096 × 2560**, or 2048 plus the same detail texture.
- 4096 is also the common phone `MAX_TEXTURE_SIZE`, so a 4096 bake must never be required.

### B6. Cliff edges and the terrain model

- **The cliff skirt is part of step 6:** about 90,000 to 98,000 px of rock face at 2048.
  - It gives the "land ends in a drop" read at far zoom, and the waterfalls fall off it.
  - Outside the land the bake is transparent with a 16 px contact shadow, so the model sits on the oak war table
    as the direction's default asks.
- **For a stronger terrain-model read when zoomed out**, Pixi 8's `PerspectiveMesh` can tilt the baked map into a
  trapezoid at far zoom.
  - Not measured.
  - Picking and miniature placement then need the inverse projection.

### B7. The distinct-colors rule on a relief map: it breaks as built

The docs/09 rule asks every pair of terrain fills to differ by CIEDE2000 20, or 12 under each color vision
deficiency. palette-ab's view B passes it as flat fills.

I measured the rendered ground of the 2048 bake before trees and tint. For each terrain I took its colors at the
10th, 50th and 90th lightness percentile. The checks use the repo's `tests/content/colorMath.ts` through
`bench/colorcheck.ts`.

| Closest terrain pair: normal / protan / deutan / tritan | Flat fills (view B) | Relief bake (as built) | Lightness-neutral shading 0.5 | Fill-faithful (no rock, snow, fields or forest lift) + shading 0.5 |
|---|---|---|---|---|
| Medians (p50) | 22.2 / 14.8 / 15.8 / 14.2 | 7.0 / 5.8 / 5.7 / 4.2 | 7.2 / 6.1 / 6.2 / 5.9 | 12.7 / 3.9 / 7.8 / 10.8 |
| Any percentile against any other | — | 4.8 / 0.6 / 0.3 / 3.6 | 3.9 / 2.0 / 1.1 / 2.8 | 2.9 / 0.8 / 0.9 / 2.4 |
| Spread inside one terrain, p10 to p90 (normal) | 0 | 14 (plains) to 46 (mountains) | 15 to 36 | 16 to 39 |

- **Relief alone spreads one terrain across more than the rule's 20.** Even the fill-faithful variant leaves the
  medians at 12.7 normal and 3.9 protan.
- Two things move the medians:
  - continuous blending across borders mixes each province's pixels with its neighbors' terrain;
  - ridged mountains have more shadowed slopes than lit ones.
- **A ruling is needed. This file cannot settle it.** Two possible restatements:
  - apply the rule to a province's low-passed color with relief removed, and make terrain identity redundant
    through features (canopy, peaks, field strips, reeds and the terrain map mode);
  - or limit shading amplitude and blending until the medians pass again. Measured: in the fill-faithful variant,
    blending plus mild shading already cost about 10 ΔE on the closest pair (22.2 to 12.7).
- The band rule for owner borders is not affected by relief, if borders are vector lines in the owner's color with
  a keyline (B4).

---

## Recommendation

### Battle

1. **Rendering.** Troops go in `ParticleContainer`s, with one battle atlas as the single texture source.
   - Each frame: an insertion sort by ground y, then cuts into depth bands at each big actor (A1, A2).
   - Desktop: up to 3,000 literal figures. Phone: up to 1,500 literal figures, `resolution` at most 1.5.
2. **Rank-and-file art.** Procedural vector parts baked per battle into the atlas, with nation colors at bake time
   (A5).
   - Rebuild on WebGL context restore: about 0.1 s of tessellation plus a bake.
3. **Monsters, commanders, pretenders.** Generated painted cutouts on a 24 × 16 deformed mesh (A6). Keyed on a flat
   color with a 1 px alpha erosion.
4. **Decals.** One ground RenderTexture of 2048 × 1152 (desktop optionally 2×). Stamp per frame; re-bake from the
   timeline on seek or restore (A3).
5. **Arrows and blood.** `ParticleContainer`s with closed-form motion, so seek stays exact (A4).

### Map

6. **Baking.** Bake once per game, keyed by map seed and bake version, cached in IndexedDB.
   - The noise heightfield, hillshade, terrain blend and composite run as GPU fragment passes.
   - Lakes and rivers run on the CPU in a worker at quarter resolution (0.07 to 0.57 s).
   - The province raster is drawn from the mapgen polygons.
   - Upload from typed arrays (B2).
   - A CPU-only fallback in a worker takes 1.3 s at 1024 and 3.3 s at 2048 here: acceptable behind a "preparing
     the map" step on desktop, too slow at 2048 on a phone.
7. **Trees.** Baked into the map texture. Live chunks only at near zoom (B3).
8. **The frame.** One composite pass for tint, selection and fog, from an id texture and a palette texture. Owner
   borders as vector line meshes from the mapgen polygons (B4).
9. **Resolution.** 2048 × 1280 with a detail texture on phones; 4096 × 2560 on desktop (B5).
10. **The colors.** Ask the owner or the palette design for a ruling on the distinct-colors rule for relief terrain
    before building the map (B7).

## What was not verified

- **No real GPU and no phone was measured.** GPU costs are fill and ALU arithmetic. Phone costs are CPU-throttle
  estimates.
- **The machine was shared** with the QA fuzzers the whole time (load 4 to 10). CPU numbers are therefore
  pessimistic and somewhat noisy, so compare rows within a table rather than across runs.
- **A real `requestAnimationFrame` loop** delivered 14.7 fps at 480 × 270. That is SwiftShader's limit. The bench
  times frames back to back with a forced sync instead.
- **The painted test is one soldier sheet and one monster, from one model.** Untested:
  - consistency across a roster;
  - camera control by a reference image;
  - per-nation generation.
- **Not built:**
  - depth bands with interleaved monsters;
  - near-zoom live tree chunks;
  - vector border meshes;
  - the detail texture;
  - `PerspectiveMesh` tilt;
  - context-loss rebuild timing.
- **The bench map is not mapgen's output.** It has jittered sites and its own land outline, at the same province
  count and aspect.

## Files

Everything is under `scratchpad/visual-v4/`.

**The bench pages** (each `x.html` runs `x.js`):

| File | What it is |
|---|---|
| `bench/harness.js` | Pixi app, draw counter, GPU sync, frame timing, seeded rng |
| `bench/figures.js` | Procedural figures and the atlas |
| `bench/monster.js` | Mesh-deformed monster |
| `bench/battle.js` | The battle stress scene |
| `bench/decals.js` | Decal baking against live decals |
| `bench/terrain.js` | Relief bake, GPU bake, trees and frame composite |
| `bench/noise.js` | Seeded Perlin noise |
| `bench/compare.js` | Procedural against painted, side by side |

**Scripts:**

- `bench/run.cjs`: the Playwright runner. It loads the local pixi.js through a routed origin.
- `bench/matrix.sh` and `bench/after.sh`: the run lists.
- `bench/colorcheck.ts` and `bench/relief_colors.py`: the color rule on the bake.

**Results** (`bench/out/`):

- **Battle:**
  - `battle-matrix.jsonl`, `battle-fx-delta.jsonl`, `battle-phone.jsonl`, `battle-hd-*.json`, `battle-raf.json`;
  - `decals-2048.json`, `decals-4096.json`;
  - `compare.json`.
- **Map:**
  - `terrain-1024.json`, `terrain-2048.json`, `terrain-4096.json`;
  - `dense/r.json`;
  - the shading variants with their color checks: `sa05/`, `sa10/`, `faith05/`;
  - `relief-colors.json`.
- **Images:**
  - battle: `battle-1500-hd.png`, `battle-1500-painted-hd.png`, `compare-figures.png`, `figures.png`;
  - map: `map-far.jpg`, `map-mid.jpg`, `map-near.jpg`, `w4096/map-*.jpg`, `near-2048-vs-4096.jpg`,
    `gpu-hillshade.png`.

**Painted art** (`painted/`):

- the prompts: `soldier-sheet.txt`, `wyrm.txt`;
- the generated sheets with their JSON records: `soldier-sheet.png`, `wyrm.png`;
- the keyer `key.py` and its outputs `soldier-keyed.png`, `wyrm-keyed.png`;
- the atlases `painted-atlas.png` and `painted-atlas-thorn.png`.
