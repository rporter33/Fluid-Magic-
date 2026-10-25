# Research: rendering techniques for a painted, hand-drawn map (canvas 2D now, Pixi v8 later)

Owner direction, 2026-10-22 (`owner-direction.md`): "i need the game map to be more interesting and detailed, a hand
drawn feel" and "i like final fantasy 14 and much concept art as insiration". This file answers *how to draw it*: cheap
watercolor, paper, ink, relief, glyphs, tracks, rivers, curved lettering and baking. It extends
`../wartable-design/research-mapdetail.md` (stamps by blue noise, noisy-edge basics, O'Leary hachures, Pixi batching
limits, the band numbers) and repeats none of it. Keys from that file are cited as "mapdetail A1" and so on.

| Marker | Meaning |
|---|---|
| **[V]** | Opened this session: GitHub and raw.githubusercontent.com (MNPR, perfect-freehand, rough.js, Red Blob, Azgaar, MDN content and browser-compat-data, the Mapbox style spec), the installed Pixi 8.22.0 docs and `.d.ts`, FM source. |
| **[X]** | Search-engine extract; page not opened. tylerxhobbs.com and eu4.paradoxwikis.com failed DNS (ENOTFOUND), as other non-GitHub hosts did for mapdetail. |
| **[calc]** | Measured by the bench in `bench/` (section 2). |
| **Analysis** | My reasoning for FM; cites FM files or the approved design (`../wartable-design/final.md`, "final"). |

---

## 0. Findings in brief

1. **One formula covers most watercolor effects:** MNPR raises color to a density power, `C' = C^(1 + d)`, for edges,
   pigment and granulation (M2-M4 [V]). In canvas 2D, a province's own fill drawn over itself in `multiply` at alpha
   *a* gives `lerp(C, C², a) ≈ C^(1+a)`, with no pixel loop.
2. **Noisy borders need a guard and are not star-shaped.** Red Blob's recursion (R1 [V]) self-intersected in 22 to 28
   of 105 Lloyd-relaxed cells. Subdividing only where the Voronoi edge crosses the segment between the sites gave 0
   crossings on 6 seeds (6 to 11% of edges stay straight); 3.3 to 3.9% of fan triangles still flip, so use earcut.
3. **Gentle wobble reads as hand-drawn:** amplitude 0.2 plus two Chaikin passes reads as ink; 0.45 makes torn-paper
   spikes [calc] (`bench/mid-soft.png` against `bench/mid.png`).
4. **Paint drifts the mean color, and the palette test checks only fills.** The full stack moved province means by
   ΔE2000 1.7 on average and 4.5 at worst (Mountains), mostly through the wash layers. Grain, paper, bleed and a
   shadow edge each stay under 1.3, and a lean wash under 2.3 [calc].
5. **Cost follows path complexity, not pixels:** the full Mid sheet (105 provinces) took 1.68 s on a software
   rasterizer, Far (a quarter of the pixels) 1.08 s, or 0.63 s at 146 points per province instead of 568 [calc].
6. **The cheapest soft edge is an inner `shadowBlur`:** 151 ms against 470 ms for stacked strokes [calc]. It ignores
   the transform (C1 [V]). `ctx.filter` is behind a flag in Safari 18 (C2 [V]). Mid-grey noise in `soft-light` keeps
   the paint mean-neutral, as mapgen2's grain does (R2 [V]); grain plus paper moved means by ΔE2000 0.46 [calc].
7. **For Pixi, keep color and paint apart.** Bake a grey density field, and let one shader compute
   `palette[provinceId]^(1+d)`, so a mode switch uploads 105 texels. Pixi's advanced blend modes need `useBackBuffer`
   and filters (P1 [V]); `multiply` is native.
8. **Bake in canvas 2D, show in Pixi:** OffscreenCanvas 2D runs in workers on Chrome 69, Firefox 105, Safari 16.4
   (C3 [V]); Pixi's `ImageSource` takes `ImageBitmap` and `OffscreenCanvas` (P5 [V]). The mockup's painter carries over.
9. **Hachures collide with a reserved pattern.** Upper-left light puts shadow flanks on the lower right, where fall
   lines run near 45°: the move-targeting hatch's angle (final §3.2). Drop strokes within ±12° of the diagonals.
10. **Players read roads and rivers as rules:** Dominions roads cut movement cost (G1 [X]), Total War bridges sit
    where roads meet rivers (G2 [X]), CK3 armies cross major rivers only at set places (G3 [X]), and Civ V rivers stop
    movement (G4 [X]). FM tracks must join every passable pair; FM rivers must never follow a border.
11. **Canvas has no text-on-path.** Place glyphs with kerned advances, and reject curves that turn more than 45°
    between adjacent glyphs (Mapbox's default, MB1 [V]). In Pixi, use `SplitBitmapText` or `MeshRope` (P3, P4 [V]).
12. **Safari caps canvas memory** at a reported 224 to 384 MB total and 16.7 MP per canvas (S1 [X]): release bakes.

---

## 1. What "hand-drawn, inspired by FFXIV concept art" asks of the renderer (analysis)

Only principles are taken (owner-direction item 3). One review of the Endwalker art book describes its concept art as
"a sort of water color style" (F1 [X]); no source on the in-game maps opened. The principles below are the owner's.

| Principle | Technique (section) | Guard that keeps the map an instrument |
|---|---|---|
| Painterly parchment base | paper grain and fibres, mean-neutral (4) | fibres avoid the diagonals; the cloth margin keeps its own flecks (final §2.3) |
| Soft watercolor washes | wash layers, density model, blooms (3) | painted mean within ΔE2000 2 of the fill; no wash on wilds or in data modes |
| Confident ink linework | noisy borders, variable width (5) | a border never breaks or tapers (dotted means fog); width ≥ 1.7 px |
| Illustrated landmarks | glyph atlases, centerpieces (7) | stamps keep out of label, badge and seat boxes (final §3.2) |
| Elegant lettering | curved, letter-spaced names for wilds, rivers, regions (10) | province names stay straight; the label test uses oriented boxes |
| Warm-cool harmony | warm upper left, cool lower right, in `soft-light` (3.2) | ΔE2000 0.66 at full strength [calc] |
| Atmospheric depth | value hierarchy (light interiors, pooled edges), contact shadows on stamps | the camera never tilts (final §2.7); depth lives in value |

---

## 2. The bench (method for every [calc])

- **Files:** `bench/bench.html` (painter, metrics), `bench/run.mjs` (Playwright), `bench/mid.png` (amplitude 0.45),
  `bench/mid-soft.png` and `bench/near-soft.png` (0.2 with two Chaikin passes).
- **Map:** Large, 105 provinces on 1037 × 648 units (mapdetail §5.2); best-candidate sites and 2 Lloyd rounds as in
  `src/content/mapgen.ts`; labelled half-plane Voronoi; mulberry32 streams keyed `seed:layer:id`.
- **Sizes:** Mid 2.5 px per unit (1.25 × DPR 2; 2593 × 1620), Far 1.2 (1244 × 778), Near a 1024² tile at 9.3.
- **Timing:** a 1-pixel `getImageData` after each stage forces rasterization; otherwise all cost lands in
  `transferToImageBitmap`. Playwright's headless Chromium (build 1194) rasterizes in software, so the numbers are
  pessimistic; GPU canvas was not measured.
- **Color:** per province, the masked mean CIELAB against the fill in CIEDE2000, and L\* p5 and p95.

---

## 3. Watercolor, cheaply

### 3.1 The density model

- **MNPR** (Montesdeoca et al.; M1 to M6 [V]) uses one density power throughout. Edges:
  `pow(renderTex.rgb, vec3(1.0 + dEdge))`, with `dEdge` a Gaussian-blurred edge mask (kernel radius 3 by default;
  M2, M5). Pigment density: `pow(rgb, control + 1)` (M4). Granulation: `pow(rgb, 1 + density × application ×
  (1 − (0.2·height + 0.8)))`, from the paper height map (M3).
- **Bousseau et al. 2006** writes it as `C' = C − (C − C²)(d − 1)` (B1 [X], via a thesis extract).
- **Why FM wants it (analysis):** it darkens saturated colors more and keeps hue, as pigment does, and it is close to
  mean-neutral when the density averages zero: `E[C^(1+d)] ≈ C(1 + E[d]·ln C)`.

### 3.2 The wash: layered, deformed polygons (Hobbs)

Hobbs: "The core of the watercolor technique is a recursive polygon deformation algorithm". It jitters each edge
midpoint by a Gaussian, recurses, and stacks many nearly transparent layers; more variation gives softer fades
(H1 [X]). A Processing port uses depth 5 and variance r/10 (H2 [X]).

```js
function deform(P, depth, v, R) {                 // R: seeded stream for (map, province, 'wash')
  for (let d = 0; d < depth; d++, v *= 0.75) P = P.flatMap((a, k) => { const b = P[(k + 1) % P.length],
    len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [a, [(a[0] + b[0]) / 2 + gauss(R) * v * len, (a[1] + b[1]) / 2 + gauss(R) * v * len]]; });
  return P;
}
g.save(); tracePath(g, noisy); g.clip(); fill(F);  // flat fill first: coverage and identity are guaranteed
for (let b = 0; b < 2; b++) { const B = deform(cellScaled(1.08), 2, 0.12, R);
  for (let l = 0; l < 3; l++) { tracePath(g, deform(B, 3, 0.08, R)); g.globalAlpha = 0.07;
    g.fillStyle = shadeL(F, l % 2 ? 5 : -5); g.fill(); } }   // alternate ±5 L*, then re-measure the mean
g.restore();
```

| Wash variant [calc] | Mid sheet (105) | Mean ΔE2000 / worst | Notes |
|---|---|---|---|
| 3 bases × 6 layers (18) | 567 ms | 1.58 / 4.14 (Mountains) | visible mottling at Near; darkens 0.1 to 2.0 L\* |
| 2 bases × 3 layers (6) | 220 ms | 1.29 / 2.27 (Hills) | enough at Mid; the lean default |
| Warm-cool `soft-light` gradient, full alpha | 15 ms | 0.66 / 1.95 | `rgba(255,214,150)` to the upper left, `rgba(90,120,170)` to the lower right |

- **The drift is systematic darkening,** even with balanced ±5 L\* layers. On the wash stack (wash 18, edge, grain,
  bloom, paper), an L\*-only correction cut the worst case from 4.41 to 2.88 but pushed Wasteland from 1.66 to 2.71,
  so hue drifts too [calc]. Calibrate per terrain in
  CIELAB in the Playwright smoke; Vitest has no canvas in Node, so it can only check that the signed alphas and ΔL\*
  sum to zero (analysis).

### 3.3 Edge darkening and pigment pooling

| Method | Cost [calc] | Look | Use |
|---|---|---|---|
| Self-`multiply` strokes: 4 widths (3.2 to 12.8 px) at 11%, plus a 2.2 px pooling line at 22% | Mid 470, Far 400, Near tile 50 ms | crisp ring, soft fall-off, round joins | Near tiles |
| Inner shadow: clip to the cell, then fill a ring outside it with `shadowBlur` 6 and `rgba(40,30,20,.35)` | Mid 151 ms | soft, rounded corners, neutral grey | Far and Mid |
| Pixi: edge distance baked into the density texture (11.3) | one texture fetch | exact | the game |

```js
g.save(); tracePath(g, P); g.clip(); g.shadowColor = 'rgba(40,30,20,.35)';
g.shadowBlur = 6 * dpr;                 // device pixels: shadowBlur ignores the current transform (C1 [V])
g.beginPath(); g.rect(bx - 40, by - 40, bw + 80, bh + 80); addPath(g, P); g.fill('evenodd'); g.restore();
```

- **Color [calc]:** self-multiply moves the mean by ΔE2000 0.63 (L\* p5 −7.2), the shadow by 0.31 (p5 −4.5): both
  inside final §3.2's ±8% L\* band, under the ownership band. The hard 1 to 1.5 px line just inside the border is the
  "pigment pooling" cue final §3.3 asks for (as black at 12%); self-multiply keeps its hue.

### 3.4 Granulation, blooms and bleeding

- **Granulation:** a seamless grey tile (value noise, 128 ± 26) in `soft-light`, clipped per province (96 ms at Mid;
  [calc]). Alpha by terrain: Wasteland 0.8, Mountains 0.7, Hills 0.6, Forest 0.45, Swamp 0.35, Plains 0.25, Farmland
  0.2, because earths and blues granulate and yellows stay smooth (analysis, after M3).
- **Wet-edge blooms (backruns):** 1 or 2 per province, outside label and seat boxes, Mid and Near only (42 ms at Mid):
  a noisy circle `r(1 + 0.18 sin 5θ + 0.1 sin 11θ)`, filled +4 L\* at 35%, with a −9 L\* rim at 30%.
- **Color bleeding:** MNPR bleeds with a depth- and control-gated Gaussian of radius 20 (M5 [V]). In canvas, each side
  of a shared edge clips to its own cell and strokes the shared polyline in the neighbor's fill, 7 then 4 px at 10%
  (249 ms at Mid, mean ΔE2000 0.19; [calc]). The most "watercolor" cue, and the first to drop on a budget. Never
  bleed into or out of wilds (final §1.10).

### 3.5 What the paint does to color, all stages [calc]

The full stack (wash 18, edge, bleed, granulation, bloom, paper): mean ΔE2000 1.74, worst 4.47 (Mountains); ΔL\* −0.5
to −2.6; L\* p5 −8.2, p95 +2.8. **Rule (analysis):** every terrain's painted mean stays within ΔE2000 2.0 of its docs/09
fill, spending at most 4 of the palette test's margin of 20. Bands, keylines and wilds are drawn over the paint.

---

## 4. Paper

- **mapgen2's grain** (R2 [V]): a 100 × 100 tile of `128 + randInt(16) − 8`, composited in `soft-light`, then
  `hard-light`. Mid-grey noise in these modes is mean-neutral.
- **MNPR's substrate** (M6 [V]) also offsets UVs by the paper's normals (`uv + normal × distortion × texel`) and lights
  the paper with `diffuse = 1 − (1 − n·l)² × shading`: shader work. In canvas 2D the grain does most of it.
- **Seamless and world-locked:** wrap the noise lattice modulo its period and sum octaves n, 2n, 4n, 8n;
  `CanvasPattern.setTransform(DOMMatrix)` keeps grain in world space across tiles and re-bakes (C4 [V]).
- **Fibres:** short curved strokes at 10 to 16% (`rgba(90,70,40,.10)`, `rgba(255,250,235,.16)`), within ±25° of
  horizontal, as paper fibres follow the machine direction. Random angles would put 11% of their length within 10° of
  45°, over final §3.2's 10% cap (analysis).
- **Measured [calc]:** grain plus paper moved means by ΔE2000 0.46, worst 1.22 (Forest +0.9 L\*: `soft-light` lifts
  darks). An owner-made paper tile qualifies once its mean is normalized to 128 and its contrast capped at ±20.

---

## 5. Ink lines

### 5.1 Noisy borders that keep adjacency exact

- **The recursion** (R1 [V]): `center = lerp(p, q, 0.5(1 − amplitude) + U·amplitude)`, recursing on
  `(a, center, mid(a,p), mid(a,q))` and `(center, b, mid(b,p), mid(b,q))` until shorter than `length`. Here `a`, `b`
  are the edge's endpoints and `p`, `q` the sites. Each pair is subdivided once (`r0 < r1`); the other side reverses.
- **The guard [calc].** "Constrained to a quadrilateral" holds only when quad a-p-b-q is convex, which needs a-b to
  cross p-q. At obtuse Delaunay triangles it does not, and even after Lloyd relaxation 22 to 28 of 105 cells
  self-intersected. Subdividing only convex quads gave 0 crossings on seeds 1 to 5 and 7; 18 to 29 of about 275
  edges stayed straight, and they do not stand out.
- **Shape:** amplitude 0.2, `length` 3 units, then two Chaikin passes with endpoints fixed so triple points stay exact:
  about 568 points per province, against 198 before Chaikin [calc].
- **One polyline for everything,** keyed `min(i,j):max(i,j)` and seeded `edge:${seed}:${i}:${j}`: fill, border, band,
  hover outline and hit test. Adjacency stays `neighbors` (FM drops only point contacts, `minSharedEdge` 0.001 × √area
  in `src/content/mapgen.ts`), so "the drawn map and the graph always agree" holds.
- **Not star-shaped [calc]:** 3.3 to 3.9% of fan triangles from the site flip even with the guard. Triangulate with
  earcut (Pixi `Graphics` does) or bake.
- **Per band:** Douglas-Peucker on each shared polyline (so both sides agree) to one point per 1.5 screen px: about 150
  points per province at Far, 300 at Mid, all at Near. Hit tests use the Near polyline, after a bounding-box prefilter.
- **Wild contours** stay crisp, with little or no noise: the contour and rim are information.

### 5.2 Variable width, taper and breaks

- **perfect-freehand** (PF [V]): `getStroke(points, {size: 8, thinning: .5, smoothing: .5, streamline: .5,
  start: {taper: 0, cap: true}})` returns an outline polygon to fill through `Path2D`; pressure is simulated from
  point spacing.
- **rough.js** (RJ [V]) draws each line twice, the second jittering half as much. Jitter is `roughness × gain ×
  U(−x, x)` (gain 1 below 200 px, 0.4 above 500 px, linear between); bowing offsets `bowing × maxRandomnessOffset ×
  (y2 − y1)/200` along the normal, as one cubic with `divergePoint` ∈ [0.2, 0.4].
- **Cost [calc]:** one `stroke()` per segment cost 108 ms at Mid (about 40k calls). Fill one outline polygon per edge
  instead (277 fills).
- **Rules (analysis):** borders keep a 2 px mean width (±12% slow variation, alpha 0.85 to 1) and never break or taper:
  a dotted border means fog (final §3.3, §3.10). Taper and breaks are for decoration (hachures, river ends, ripples,
  trunks): `w(t) = w0 · sin(π t)^0.6 + 0.2 px`, and a skipped segment with probability 0.1, never within 4 px of a
  border.

---

## 6. Hatching and stippling for relief

- **Reserved patterns** (final §3.2): at most 10% of stroke length within 10° of 45°, no cross-hatch, and no uniform
  hatch. The mockup's move-targeting hatch is exactly 45° (`p60-draw.js`, `lineTo(d + H, H)`).
- **Hachures follow the fall line** (mapdetail M1, C1, C2). Radial strokes on a lower-right flank sweep 0° to 90°,
  and about 22% land between 35° and 55° (analysis). Radiate from the crest over the lower half (20° to 160°), and
  skip any stroke near either diagonal.

```js
for (let k = 0; k < n; k++) { const a = lerp(0.35, 2.8, (k + R()) / n);              // radians, lower half
  const deg = (a * 180 / Math.PI) % 90; if (Math.abs(deg - 45) < 12) continue;         // clear of 45° and 135°
  const r0 = crestR * (0.9 + 0.2 * R()), r1 = r0 + len * (0.6 + 0.4 * steep);
  taperedStroke(g, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.6, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.6, 0.9 * px); }
```

- **Stippling.** Secord's weighted Voronoi stippling runs about 80 darkness-weighted Lloyd iterations in one
  JavaScript port (ST1 [X]): too slow per province, and unstable across re-bakes. FM's seeded slot ranks (final §3.2)
  are the cheap equivalent: a dot at every finer slot (about 2.5 px at Mid) whose rank is below the local shade. Shade
  changes add or remove dots and move none ("zooming in only adds"). Use it for scree, sand and meres' banks.
- **Cost [calc]:** 24 tapered hachures per hill or mountain cost 7 ms per sheet. Relief strokes are cheap; the wash
  is not.

---

## 7. Glyph systems: trees and mountains with variation

- **Generators, then atlas (analysis).** Each glyph type is a pure function `(params, rng) → paths`, rendered once per
  band into an atlas: 16 variants × about 10 types × 3 bands. Stamping is then one `drawImage` or sprite; about 1,500
  tree stamps took 13 ms at Mid [calc].
- **Variation axes,** seeded per slot: crown lobes 3 to 5, radius ±15%, lean ±6°, trunk length; tone ±4 L\* around
  final §3.2's faces (fill +12 and −18 L\*); a mirror flag; scale 0.85 to 1.15.
- **Clumping:** a coarse Poisson pass picks clump centers; trees fill the slots within about 1.5 crowns of them, and
  back-edge "half trees" drop their bottom outline (mapdetail H5 to H7).
- **Mountains** are built from a ridge profile:

```js
function peak(g, x, y, h, w, R, P) {         // base centre (x, y); P: lit, shade, ink, px
  const apex = [x + (R() - 0.5) * w * 0.3, y - h], foot = [x + w * (0.1 + 0.15 * R()), y];
  const L = ridge([x - w, y], apex, R, 3), Rr = ridge(apex, [x + w, y], R, 3);    // midpoint displacement, 3 levels
  poly(g, [...L, foot], P.lit); poly(g, [...Rr, foot], P.shade);                 // lit west face, shaded east face
  for (const s of fallLines(Rr, foot, 5, R)) taperedStroke(g, ...s, 0.8 * P.px);  // steeper than 55°: clears 45°
  inkOutline(g, [...L, ...Rr.slice(1)], P.ink, (t) => P.px * (1.4 - 0.6 * Math.abs(t - 0.5) * 2)); // heavy at the top
}
```

- **Placing peaks:** tallest first, rejecting overlaps above about 30% (mapdetail H2), drawn by the bottom edge. Fall
  lines on a steep face run 60° to 80°, clear of the reserved band; wild peaks keep final §1.10's flat shadow face.
- **Owner stamp sheets** slice into the same atlas frames. Terrain stamps are recolored through luminance plus alpha
  and tinted to the faces, so the distinct-colors rule holds; only neutral landmarks keep full color (analysis).

---

## 8. Roads as dotted ink tracks

**Precedent.** Players expect roads to be rules: Dominions roads lower each half-step's movement cost by 2 (G1 [X]),
and Total War bridges sit where roads meet rivers (G2 [X]). Azgaar's "ancient" style dashes both roads (`3`) and state
borders (`2`), told apart by color only (AZ3 [V]). That is a warning for FM, where a dotted border means fog.

**FM has no road rule:** movement days depend only on the destination's terrain (docs/01 §6). Tracks on some
neighbor pairs and not others would suggest a rule that does not exist. Recommended (analysis):

- **Truthful:** one track per passable neighbor pair, from each seat to the arc-length midpoint of the shared border
  and on to the neighbor's seat. Wilds are not neighbors, so tracks bend around the Ashspine and teach the rule; M2
  ridges get none. Codex: "Tracks join every pair of neighbors. Travel time depends on the destination's terrain."
- **Unmistakable for fog or orders:** round sepia dots (`setLineDash([0.1 * px, 3.2 * px])`, `lineCap 'round'`,
  1.6 px, `#6B4A2B` at 70%) that stop 3 px before the ink border, resume 3 px after it, and never run along one. The
  order thread stays light `#F4EEDF`, dashed 8/6, with brass tacks (final §3.6).
- **Hand-drawn:** a quadratic curve with a seeded control offset of 10 to 20% of its length, out of label and seat
  boxes; omitted at Far.
- **Reconcile final §1.10's mountain footpath:** it becomes the track style everywhere, so Mountains say "a way
  through" like every province, and peaks say none.

---

## 9. Decorative rivers that are not mistaken for rules

**Precedent: rivers are rules almost everywhere.** Dominions makes them a border property, crossable only when
frozen (mapdetail D1). Civ V stops units crossing one and gives −20% to attacks across it (G4 [X]). CK3 armies cross
major rivers only at set places (G3 [X]), and Total War fights at the bridge or ford (G2 [X]).

**FM's rivers are scenery** (the sim is untouched), so they must look unlike a rule (analysis):

1. **Never along a border.** Cross a shared border near 30% or 70% of its length (tracks take 50%), at 60° or more.
   A river that follows a border is a Dominions river border.
2. **Thin and tapered, never band-like.** Width grows downstream, like Azgaar's `flux^0.7` term plus a Fibonacci
   length progression (AZ1 [V]) and mapgen4's per-vertex width (R4 [V]): 0.6 px at the source to 2.2 px at the mouth
   (Mid), as a variable-width polygon in a muted ink blue-grey with a 0.6 px bank line. Test it against Swamp
   `#1A727A` and Tide's banner `#3A7BD5`.
3. **Sourced and sunk by the terrain.** FM stores no elevation (`generate.ts` samples it only to rank terrain), so use
   a proxy: peaks 6, Mountains 5, Hills 4, Forest 3, Plains, Farmland and Wasteland 2, Swamp 1, meres 0, plus seeded
   jitter. A river starts beside peaks or in Mountains and steps to a strictly lower neighbor until a mere, a Swamp or
   the cloth's edge. Two to five per map, meandering with Azgaar's 0.5 (AZ1 [V]).
4. **A bridge only where a track crosses a river,** a small plank glyph: scenery meeting scenery.
5. **Never in data modes:** rivers live in the decoration layer and fade with it (final §3.1). No tint, no hover; the
   Codex says "Rivers are scenery".

---

## 10. Curved text on paths (canvas 2D now, Pixi later)

- **Canvas 2D has no text-on-path:** place each glyph at its arc-length position, rotated to the tangent (T1 [X]),
  after resampling the path at equal steps to avoid spacing and rotation jitter (T2 [X]). Use kerned advances measured
  on prefixes. Apply letter-spacing by hand: `ctx.letterSpacing` came only in Chrome 99, Firefox 115, Safari 18.4 (C2 [V]).
- **Mapbox's rules** (MB1 [V]): `text-max-angle` 45 ("Maximum angle change between adjacent characters") and
  `text-keep-upright` true, which flips a path that runs right to left.

```js
function textOnPath(g, text, pts, font, track = 0.08) {        // pts: resampled polyline in screen px
  g.font = font; const em = g.measureText('M').width, chars = [...text], adv = [];
  for (let k = 0; k < chars.length; k++) adv.push(g.measureText(text.slice(0, k + 1)).width - g.measureText(text.slice(0, k)).width);
  if (pts.at(-1)[0] < pts[0][0]) pts = [...pts].reverse();      // keep upright
  const cum = arcLengths(pts), total = adv.reduce((a, b) => a + b, 0) + track * em * (chars.length - 1);
  let s = (cum.at(-1) - total) / 2, prev = null; if (s < 0) return null;   // does not fit: try the next candidate
  const out = [];
  for (let k = 0; k < chars.length; k++) { const a = at(pts, cum, s), b = at(pts, cum, s + adv[k]);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); if (prev !== null && Math.abs(wrap(ang - prev)) > Math.PI / 4) return null;
    out.push({ ch: chars[k], x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, ang }); prev = ang; s += adv[k] + track * em; }
  return out;                                                   // draw with translate/rotate/fillText; boxes for collision
}
```

- **What curves (analysis):** wild names along a massif's spine, river names, and region or sea titles in the cloth's
  margin. Province names stay straight: their 96 × 30 px budget and the label test (final §3.5) assume boxes, and
  curves cost legibility at 11 px. The label test gains oriented glyph boxes for curved labels.
- **Pixi v8:** wild names are live labels with culling priority (final §3.5), not baked. `SplitBitmapText` (P4 [V],
  experimental) exposes `chars` as containers that take the computed `x, y, rotation`, recomputed on zoom change. Or
  bend a straight label texture with `MeshRope`, which needs 15 to 30 points for a visible bend (P3 [V]); fine for
  gentle arcs, but tight curves distort glyphs.

---

## 11. Baking strategy and budgets

### 11.1 Measured cost (software raster, per sheet; [calc])

| Stack | Far 1244×778 | Mid 2593×1620 | Near 1024² tile |
|---|---|---|---|
| Flat fill and ink borders only | — | 62 ms | — |
| Lean: wash 6, shadow edge, grain, bloom, stamps, ink, paper | — | 738 ms | — |
| Full: wash 18, self-multiply edge, bleed, grain, bloom, stamps, hachures, ink, paper | 1079 ms (568 points); 633 ms (146 points) | 1680 ms | 395 ms (about 100 ms per 512²) |

Per province at Mid: about 7 ms lean and 16 ms full; cost follows province count and path points, not pixels.

### 11.2 Budgets for 60 to 105 provinces (analysis, from 11.1 and mapdetail §5.2)

| Provinces | Mid sheet at DPR 2 (tiles ≤ 2048²) | RGBA | Mid bake, lean / full | Far sheet |
|---|---|---|---|---|
| 60 | 1960 × 1225 (1 tile) | 9.6 MB | 0.42 / 0.96 s | 941 × 588, 2.2 MB |
| 85 | 2333 × 1458 (2 tiles) | 13.6 MB | 0.60 / 1.36 s | 1120 × 700, 3.1 MB |
| 105 | 2593 × 1620 (2 tiles) | 16.8 MB | 0.74 / 1.68 s | 1244 × 778, 3.9 MB |

Near uses 512² tiles with an LRU of 32 (32 MB; final §3.8). This rasterizer fills about 10 tiles per second per worker.

### 11.3 The plan

1. **One painter, two hosts:** pure functions over a `CanvasRenderingContext2D`-shaped interface, (map, seed, look
   keys, band, rect) → pixels. The mockup calls it inline; the game runs it in a worker on an `OffscreenCanvas`
   (C3 [V]) and hands `transferToImageBitmap()` results to Pixi's `ImageSource` (P5 [V]). Firefox has a reported slow
   `transferFromImageBitmap` path (S2 [X]), so upload textures rather than use bitmap renderers.
2. **Far and Mid at load,** in the worker behind the loading screen (final §3.8). The painted stack misses final's
   "full Mid bake on Medium ≤ 150 ms" by 3 to 9× in software: measure GPU canvas in the Playwright performance smoke,
   and keep Map detail Reduced as the flat stack (62 ms).
3. **Re-bakes:** a province's dirty rectangle, in the worker, 7 to 16 ms each; the main thread only swaps textures,
   keeping final's 3 ms-per-frame stagger.
4. **Progressive Near:** the scaled Mid bake shows at once, then tiles replace it from the view's center out.
5. **Release canvases** (1 × 1 when done). Safari's total canvas memory is reported at 224 MB (iOS 12), 256 to 288 MB
   (iPad, iPhone X) and 384 MB (iOS 15), with at most 16,777,216 px per canvas (S1 [X]). Worker canvases count: keep
   2 workers at most.
6. **Pixi live layer: province-ID texture plus palette,** the Paradox model of one unique color per province in
   `provinces.bmp` (PX1 [X]).
   - Bake the ID map once from the noisy polygons with nearest filtering (1037 × 648 R8, 0.7 MB), with a CPU copy for
     hit tests.
   - One shader computes `pow(palette[id], 1 + d)`, with `d` from a baked density texture (wash, edge distance, grain,
     blooms; signed, averaging zero). A mode switch uploads 105 palette texels; hover and selection compare IDs.
   - No advanced blend modes: they need `useBackBuffer` and filters (P1, P2 [V]). Stamps, settlements and motifs stay
     in the decoration bake (final §3.1), in `multiply` or `normal`. Context loss rebuilds all of it from seed and state.
7. **The mockup** keeps its per-province sprites (`p60-draw.js`): the noisy polygon replaces `cells[i]` everywhere
   (`pathPoly`, hover, hit tests), the lean stack runs at Mid and the full stack at Near, and grain and paper patterns
   are world-locked with `setTransform`.

---

## 12. Risks and open questions

- **Unmeasured:** GPU timings and painted-mean drift on real hardware. Put both in the Playwright smoke before the art
  pass lands, with the rule ΔE2000 ≤ 2.0 per terrain (3.5).
- **Hit tests:** noisy borders move the line players read as the rule, so hit tests, bands and outlines share one
  polyline. Test that each sampled point's ID-map value matches the noisy polygon containing it.
- **Tracks** are a design call; if drawn, they cover every passable pair (section 8).
- **Mode colors:** the density split (11.3, item 6) could paint data modes too. Final §3.9 keeps them flat; default
  `d` = 0 outside Ownership.

---

## 13. Sources

**Watercolor**
- M1 [V] https://github.com/semontesdeoca/MNPR/tree/master/shaders ; files under https://raw.githubusercontent.com/semontesdeoca/MNPR/master/shaders/ :
  M2 `quadEdgeManipulation.ogsfx`, M3 `quadPigmentApplication.ogsfx`, M4 `quadPigmentManipulation.ogsfx`,
  M5 `wc/quadSeparable.ogsfx`, M6 `quadSubstrate.ogsfx`
- B1 [X] https://artis.inrialpes.fr/Publications/2006/BKTS06 ; formula via https://cs.brown.edu/research/pubs/theses/masters/2010/doran.pdf
- CU [X] https://grail.cs.washington.edu/projects/watercolor/ (Curtis et al. 1997; glazes and Kubelka-Munk, too heavy for FM)
- H1 [X] https://www.tylerxhobbs.com/words/a-guide-to-simulating-watercolor-paint-with-generative-art (ENOTFOUND) ; H2 [X] https://sighack.com/post/generative-watercolor-in-processing
- F1 [X] https://gamingtrend.com/reviews/final-fantasy-xiv-endwalker-the-art-of-resurrection-among-the-stars-review-memories-of-beyond-the-star/

**Lines, noise, maps**
- R1 [V] https://raw.githubusercontent.com/redblobgames/mapgen2/master/noisy-edges.js ; R2 [V] .../mapgen2/master/draw.js ; R4 [V] .../mapgen4/master/render.ts
- PF [V] https://github.com/steveruizok/perfect-freehand ; RJ [V] https://raw.githubusercontent.com/rough-stuff/rough/master/src/renderer.ts
- AZ1 [V] https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/master/src/generators/river-generator.ts ; AZ2 [V] .../src/generators/routes-generator.ts
- AZ3 [V] https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/master/public/styles/ancient.json ; .../public/styles/watercolor.json
- ST1 [X] https://www.cs.ubc.ca/labs/imager/tr/2002/secord2002b/secord.2002b.pdf ; https://observablehq.com/@csee/voronoi-stippling
- MB1 [V] https://raw.githubusercontent.com/mapbox/mapbox-gl-js/main/src/style-spec/reference/v8.json
- T1 [X] https://www.npmjs.com/package/textpath ; T2 [X] https://blog.siddjain.com/2014/02/04/canvas-notes/

**Browser and engine**
- C1 [V] https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/api/canvasrenderingcontext2d/shadowblur/index.md
- C2 [V] https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/CanvasRenderingContext2D.json (filter: Safari 18 behind a flag; letterSpacing 99/115/18.4)
- C3 [V] https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/OffscreenCanvas.json
- C4 [V] https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/api/canvaspattern/settransform/index.md ; composite modes: .../canvasrenderingcontext2d/globalcompositeoperation/index.md
- S1 [X] https://www.pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/ ; https://developer.apple.com/forums/thread/112218 ; https://bugs.webkit.org/show_bug.cgi?id=190280 ; https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/
- S2 [X] https://bugzilla.mozilla.org/show_bug.cgi?id=1864882
- P1 to P5 [V], pixi.js 8.22.0 as installed (`node_modules/pixi.js/skills/`): P1 `pixijs-blend-modes/SKILL.md`; P2
  `pixijs-filters/SKILL.md`; P3 `pixijs-scene-mesh/references/mesh-rope.md`; P4
  `pixijs-scene-text/references/split-bitmap-text.md`; P5 `lib/rendering/renderers/shared/texture/sources/ImageSource.d.ts`
  (`ImageResource` includes `ImageBitmap` and `OffscreenCanvas`).
- PX1 [X] https://admin-forum.paradoxplaza.com/forum/threads/modding-the-map.508256 ; https://github.com/ThomasSlade/Provincial

**Rules in other games**
- G1 [X] https://illwiki.com/dom5/dom6/map-movement ; G4 [X] https://civilization.fandom.com/wiki/Rivers_(Civ5)
- G2 [X] https://wiki.totalwar.com/w/Terry_-_Other_Tile_Types ; https://r2encv2.totalwar.com/en/manual/single-player/0089_enc_page_battle_play_phase_conflict_terrain/index.html
- G3 [X] https://steamcommunity.com/sharedfiles/filedetails/comments/2234950816 ; https://forum.paradoxplaza.com/forum/threads/more-strait-and-rivers-crossings.1453676/

**FM** [V]: `src/mapgen/voronoi.ts` (adjacency by shared border), `src/content/mapgen.ts` (`minSharedEdge`, Lloyd 2),
`src/mapgen/generate.ts` (elevation sampled only to rank terrain), docs/09 (palette, distinct colors), docs/01 §6
(movement), mockup parts `p50-deco.js` and `p60-draw.js`, `../wartable-design/final.md` §1.10, §2.3, §3.1 to §3.11.
