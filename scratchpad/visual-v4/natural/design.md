# The natural view: a natural landscape by default, with Clear terrain colours and a Terrain mode

2026-10-23. This is the design for the owner's map decision of 2026-10-23. It changes the land of the v4 relief map
(`docs/design/map-relief.md`, kept here as "map-relief") and leaves its object, light, miniatures, labels, wilds, rules and
pipeline as they are. The sim is untouched, and so is the repo: nothing in `/home/user/Fluid-Magic-` was edited
(`git status` clean). Every number below was measured with a prototype on the mockup's own map, and on 60 mapgen maps where
noted.

Paths are relative to `visual-v4/natural/` unless written in full. The workspace is
`/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/`.

**The owner's decision (binding; verbatim from `docs/design/map-relief.owner-answers.md`):**

> Natural + clear option (Recommended)

The option as it was offered: "Natural landscape by default, like your screenshots. Gentle colours blend across borders and
terrain is read from the drawing. A 'Clear terrain colours' setting and a Terrain map mode bring back the colour-blind-safe
colours, and hovering a province always names its terrain."

**The earlier direction still binds** (`docs/design/visual-references.owner-direction.md`): "It's not cluttered it's clean". The
screenshots are direction only. Nothing here copies their art, layouts, names, symbols or UI, nothing was traced, and the game
they come from is not named.

**Evidence.** Colour figures use the repo's own `tests/content/colorMath.ts` and `src/content/colors.ts`, copied verbatim into
`calc/` (diff-checked: identical). The numpy colour library `proto/natlib.py` matches them to 4 decimals on CIEDE2000 under all
four visions (`calc/parity.ts`). Rendered-pixel figures come from the mockup itself, with the natural bake and the fixes injected
in memory. The tooling is the independent verifier's own dump (`map/verify-final/dump-colors.cjs`) and its own `colors.ts`
(copied as `calc/lines.ts`).

| Tool (under `natural/`) | What it does |
|---|---|
| `tools/export.cjs` → `proto/data/` | exports the mockup's map and the relief bake's shared rasters (warped lookup, ids, hillshade, cast shadow, valleys, the Clear bake) |
| `proto/natural.py` | the natural bake, prototyped in numpy (the palette, both blends, every cover, the relief), with Lab mips |
| `tools/natpage.cjs`, `tools/patches.js` | inject the natural bake into the mockup in memory, plus the line, seat and label fixes; the page file is never changed |
| `tools/shoot.cjs` → `proto/renders/before-*`, `after-*`, `clearfixed-*` | the same views before (v4 as built, i.e. Clear) and after (Natural with the fixes), and Clear with the fixes |
| `proto/sheets.py` → `proto/renders/sheet-*.png` | the before/after sheets, beside ref-2 for look only |
| `proto/metrics.py` → `renders/metrics.json` | value, chroma, coarse busyness and province-scale patchwork, against ref-2 and ref-4 |
| `proto/cover_share.py` → `renders/cover-share-60.out` | each province's own-terrain cover on 60 mapgen maps (5,100 provinces) |
| `proto/classify.py`, `proto/lighttable.py` → `renders/classify.json`, `lighttable.out` | lightness-only and texture-only terrain classifiers at five zooms and four visions |
| `calc/rails.ts` → `calc/rails.out` | the band rule for the lit-bead rail on natural grounds, 26,950 cases per coverage |
| `tools/measure-lines.cjs` + `calc/lines.ts` → `proto/lines/*-report.json` | rendered-pixel hairlines, internal keylines, rails, seat muting and snow, before and after the fixes |
| `proto/checks.py` → `renders/checks.json` | snow, fog, data modes, water and own cover on the mockup's map |
| `tools/hovercheck.cjs`, `tools/startzoom.cjs`, `proto/cliff.py`, `tools/bench.cjs` | hover names against day chips; the start zoom per window; the cliff face; the CPU cost of the natural pass |

---

## The design in fifteen lines

1. **Natural is the default look of the land.** Muted, low-key materials blend across province borders. Terrain is read from
   what is drawn: canopy masses, field strips with hedgerows, open grass with copses, rolling umber heath, grey-blue rock and
   scree, olive marsh with pools and reeds, and cracked dusty scrub.
2. **Clear terrain colours** (Settings → Map → Terrain colours: Natural | Clear) shows exactly today's v4 colour-blind-safe bake
   in Ownership mode. **The Terrain map mode** (the seventh mode) shows the same bake in any session. Both keep every v4 check.
3. **Hovering a province always names its terrain.** The name sits on the hover card's title line with the Clear swatch and a
   glyph, and in the province card's heading. This holds in every mode, fog state, zoom and look, on touch, and for screen readers.
4. **The palette is near the references' measured numbers.** Forest is L\* 19, grass 43, fields 48, heath 36, rock 31 with lit
   faces to 51, marsh 34, scrub 53, water a dark teal. No land pixel is above OKLCH C 0.089. The value range is ref-2's.
5. **Two blends, one landscape.** The ground colour blends over σ = 0.12 D (the height blend the bake already makes). The cover
   blends over σ = 0.04 D with noise, so canopy, fields and features interfinger across the v4 warp's ragged edges.
6. **Each province still shows its own terrain.** On 60 mapgen maps the minimum is 71% of a province's area (median 94%). Its
   core (0.15 D in) is at least 98% its own, counting a plains or hills province's copses as its own.
7. **Measured without hue, the terrain still reads.** A lightness-only classifier names every province correctly at every zoom,
   in every vision. Patches score 94% at Far, 97% at the start zoom, 97% at ref-2's zoom and 88% at Near. With the patch's mean
   lightness removed (texture only), patches score 79 to 92% and provinces 98 to 100%.
8. **Rails keep the band rule on the natural ground.** The lit-bead rail passes all 26,950 natural cases solid and with its
   keylines at 0.75 coverage. The two pale banners need the banner line at 2 px below device pixel ratio 1.5, so that line now
   has a fully covered pixel. On rendered pixels: 0 rail failures in every view.
9. **Hairlines and internal keylines adapt per segment** to the ground drawn under them, in both views. On rendered pixels at
   the start view the hairline median goes from 2.15 to 3.21:1, and the share under 2.3:1 from 96 of 150 to 1 of 150. The internal
   keyline minimum goes from 1.19 to 3.30:1.
10. **Fog in Natural is visible.** Unexplored land takes a 10% gesso haze plus 25% desaturation, and out-of-sight land 25%
    desaturation. Clear and the Terrain mode keep the approved 4% and 10%. The 4% cap came from the colour rule, which no longer
    binds the natural view.
11. **Data modes keep their own opaque raster,** identical in Natural and Clear. Drawing them translucent over the landscape was
    measured and rejected: adjacent ramp stops fall to 0.1 apart under a colour-vision deficiency.
12. **The verifier's eight remaining defects each get a fix,** measured where a prototype could: hairlines, mountains near snow,
    hamlet muting, the hovered name over a day chip, the striped cliff, small windows starting at Far, the swamp keyline, and the
    file over 400 lines.
13. **Look against ref-2, at its zoom:** the natural land alone has 3.7% of province-scale patch edges over ΔE 15. Ref-2 has 4.3%,
    and the Clear land 18%. Its median L\* is 32.5, against ref-2's 32.8 and Clear's 39.5.
14. **Cost:** the natural colour pass is about 0.8 to 1.0 s of CPU in V8 at 2048 × 1280, and it drops the mean-neutral and gamut
    passes (about 1.5 s) from the default bake. The second bake (Clear) is made only when it is first needed. GPU memory is at
    most 73 MB against docs/06's 96 MB (v4: 59 MB).
15. **Docs:** the docs/09 distinct-colours rule moves to "Terrain mode and Clear". The natural palette, blends, covers, fog
    values and line rules become docs/09-balance rows. The tests are listed in §14.

---

## Rulings

**N1. Two looks of one model, one rule set.** The relief model (map-relief §2), its light (§2.3), heightfield and hillshade (§3.2,
§3.3), wilds (§3.8), water placement (§3.6), miniatures (§6), labels (§7), fog rules (§9.1) and pipeline (§10) are shared. Only the
land's colour pass differs: Natural (§2 to §4 here) or Clear (map-relief §3.4 and §4 unchanged). Both looks come from the same
seeded CPU rasters. The game picks one by the setting and the mode.

**N2. The distinct-colours rule binds Clear and the Terrain mode, not Natural** (owner answer, item 3). In Natural, terrain is
known from three things: the drawing, measured by the classifiers of §5 with a floor in the tests; the hover card's terrain line
(§7); and the Terrain mode, one key away. The rule's text in docs/09 moves accordingly (§15).

**N3. Every other colour-blind minimum keeps its limit in every view.** That covers nation banners (unchanged), the rail band
rule (§8.1), the internal keyline and neutral hairline floors (§8.2), the wild contour (§8.3), mode colours against the wild
grounds (R16, unchanged, §9), the base rims, and snow kept off passable land (§10, defect 2).

**N4. A province's own terrain dominates its interior.** At least 70% of its area is drawn in its own cover, counting a plains or
hills province's copses as forest. At least 95% of its core (0.15 D and more from every edge) is its own, counting those copses as
its own. Copses cover at most 25% of any core. Measured on 60 maps (§3.4).

**N5. Natural carries no albedo law.** It has no province-mean budget, no mean-neutral pass and no gamut-correction pass: the
province-mean rule (map-relief V3, V5) is Clear's. Natural is held by the readability tests (§5), the chroma cap (OKLCH C 0.10),
the value range (§2.3) and N4.

**N6. Hue may vary inside a terrain in Natural** (fields of several crops, marsh pools, heath and turf). The v3 rule H1, "hue
never varies inside a terrain", exists for the 20 / 12 rule and stays with Clear.

**N7. Ownership is still the rails and the glow** (owner answer, item 1). The hover and selection tints and the inner line are
unchanged. The 8% Realm tint stays an option, off by default (§8.4).

**N8. The same seeded streams, a new purpose key.** The natural noise tables are `relief:${seed}:natural:${purpose}`
(map-relief V13): value noise on 256² tables and integer-hashed cells, with no `Math.random`, no `Date` and no transcendental in
any rule-bearing raster. The cover raster used by the N4 test is CPU and engine-independent. Colours are presentation.

**N9. Terrain is public, so the drawing reveals nothing.** Every natural material comes from the map, the seed and terrain,
never from state that fog hides (map-relief V17 holds: the bake is a pure function of the map).

---

## 1. What the player sees, by zoom band (Natural)

The bands are docs/07's: a median province is under 70 px across at Far, 70 to 180 px at Mid, and over 180 px at Near.

| | Far (the model on the table) | Mid (the start view, §10 defect 6) | Near (the land) |
|---|---|---|---|
| Forest | dark masses (L\* 19) with ragged edges that cross borders | the masses with crown stipple of 2 to 3 px, conifer stands darker, glades, a cast-shadow fringe on their south-east edges | crowns of 5 to 9 px, lit from the upper left; at Near the live crowns of map-relief §3.5 |
| Farmland | a warm, mottled patch, lighter than grass | strips of fields in five crop tones (ochre, straw, green, ploughed, fallow), dark hedgerows on the seams | the same, with furrows 1.25 units apart along each strip and trees on the hedges |
| Plains | smooth olive ground | olive grass with light and dry patches, wind streaks and a few copses | the same; lone trees as live sprites (Near only) |
| Hills | darker umber ground with relief | rolling relief (cap 13 L\*), heath blotches of turf and bracken, rock specks | the same |
| Mountains | grey rock in strong relief | lit and shaded faces (cap 18 L\*), scree in hollows, turf low down, no snow | rock micro-relief |
| Swamp | dark olive, flat, speckled | olive marsh with dark peaty pools (15 to 20%), pale reed beds, shrubs | the same |
| Wasteland | the palest land | dusty scrub with pale drifts, a crack network, scrub dots, faint ripples | the same |
| Water | dark teal lakes and streams | the same, with the shore line and lit bank | the same |
| Wilds | unchanged: granite massifs with snow, black meres, the contour and the rim | unchanged | unchanged |

Everything else per band (miniatures, labels, ownership, chrome) is map-relief §1 unchanged, with the start zoom of §10 defect 6.

---

## 2. The natural palette

### 2.1 Targets (`visual-v4/refs-analysis.md` §1.1, §2.1)

| Reference patch | L\* | OKLCH C | Hue |
|---|---|---|---|
| Dense forest | 18.8 to 20.5 | 0.061 to 0.069 | 127 to 131 |
| Open grass / light grass | 38.6 / 46.3 | 0.080 / 0.099 | 110 / 119 |
| River or lake | 33.5 to 35.0 | 0.072 to 0.075 | 186 to 188 |
| Mountain, lit / shade | 47.3 / 31.8 | 0.011 | 52 / 18 |
| ref-2 as a whole (land and tokens) | p5 / p50 / p95: 10.8 / 32.8 / 46.8; sd 11.6 | mean 0.064, p90 0.097; 0.45% of pixels over 0.12 | — |

The references show no fields, heath, marsh or scrub. Those materials are invented siblings in the same key and chroma.

### 2.2 The materials (CIELAB, D65; `proto/natural.py` `NAT`)

Each terrain has a ground, which is blended wide (§3.1), and cover materials drawn on it.

| Terrain | Ground | Cover materials |
|---|---|---|
| Plains | #65692D (L\* 43) | light grass #6E7734 (48), dry grass #766E38 (46); copses in canopy colours |
| Farmland | #6C6E37 (45), the field margins | ripe #937C49 (53), straw #97845B (56), green crop #6A7139 (46), ploughed #786246 (43), fallow #7D754A (49); hedgerows #3C4926 (29) |
| Forest | #3C4621 (28), seen in glades | canopy #21330D (19), conifer #1E2C15 (16); each crown ±3.5 L\* dome and ±5 L\* lit side |
| Hills | #625031 (35), umber heath | turf #606131 (40), bracken #6D5230 (37), rock specks #7D766D (50) |
| Mountains | #61636B (42), grey-blue rock | scree #757478 (49), valley turf #515537 (35) |
| Swamp | #4F532C (34), olive marsh | pools #2F3F38 (25), reeds #6C6432 (42), shrubs #313D20 (24) |
| Wasteland | #937E64 (54), dust | cracks #796855 (45), scrub #56563D (36), pale drifts #9D8B76 (59) |
| Water (Natural) | #14615B (L\* 37) | shore band 3 L\* darker and the lit bank, as in map-relief §3.6 |

Wild colours are unchanged: granite #2A292C to #8A857E, snow #F2EEE6 and mere #24222A, together with their contour and rim.

### 2.3 Measured on the natural bake (`proto/renders/checks.json`; province cores, 0.15 D in)

| Terrain | L\* p10 / p50 / p90 | OKLCH C mean / p90 | Hue (OKLCH, median) | Core mean |
|---|---|---|---|---|
| Plains | 38.0 / 43.2 / 46.6 | 0.081 / 0.085 | 112 | #62662C |
| Farmland | 41.8 / 47.7 / 54.8 | 0.067 / 0.079 | 99 | #7B7144 |
| Forest | 14.4 / 19.3 / 25.4 | 0.056 / 0.065 | 131 | #253414 |
| Hills | 26.3 / 35.5 / 43.1 | 0.055 / 0.062 | 84 | #5E512E |
| Mountains | 14.8 / 30.5 / 51.3 | 0.013 / 0.020 | 271 | #4C4D4C |
| Swamp | 25.1 / 33.5 / 38.2 | 0.052 / 0.065 | 113 | #4B4F2F |
| Wasteland | 46.9 / 52.9 / 57.4 | 0.044 / 0.046 | 73 | #8D7A60 |

- **Chroma:** no land pixel is over OKLCH C 0.10 (maximum 0.089). The chroma cap is a test.
- **Value:** forest sits at the references' 19, grass at their 39 to 46, and rock at 15 to 51 against their 32 to 47. Water is
  their teal at L\* 37.
- **On screen** (§11), the median L\* is 32.5 at ref-2's zoom against ref-2's 32.8, and the L\* sd is 15.6 against 11.6.
- **What the drawing costs in hue:** water against mountain rock and dust is 18.0 / 8.1 and 26.0 / 8.1 under a deficiency. Water
  is told apart by its form (the smooth shore, the bank highlight, the stream line), as v4 already accepted across states
  (19.7 / 8.5).

---

## 3. Blending across borders

### 3.1 The two blends

The v4 lookup warp (map-relief §3.1: |w| ≤ 0.10 D, features of 40 and 9 units) still decides which terrain a texel belongs to
(`LT`). From its one-hot, Natural takes two blends:

| Blend | Sigma | What it drives | Where it comes from |
|---|---|---|---|
| **Ground** w^g_t | 0.12 D, Gaussian | the ground colour: Σ_t w^g_t · ground_t in CIELAB, plus a broad ±2.2 L\* mottle (fBm, 26 units) | the height weights the bake already makes (S3, quarter resolution): no new raster |
| **Cover** w^c_t | 0.04 D, Gaussian (three box passes) | where each terrain's features appear: presence p_t = clamp((w^c_t − 0.35) / 0.3, 0, 1) | new, full resolution, 7 planes (transient) |

The ground therefore shades from one province's colour into the next over about ±0.2 D. That is the owner's "gentle colours
blending across borders". The features change over a narrower, ragged band, so each terrain's look stays crisp and never turns
to mud.

### 3.2 The covers, decided per texel (`proto/natural.py`, `proto/cover_share.py`)

1. **Canopy.** The texel is canopy when 0.5 · w_F(0.07 D) + 0.5 · w^c_F + 0.42 · n_edge > 0.52, where n_edge is fBm at 10 units
   with 3 octaves. Glades are cut out where w^c_F ≥ 0.85 and n_glade (fBm, 9 units) < −0.62. Copses are added where fBm at 15
   units is above 0.80 and w^c_plains + w^c_hills > 0.6, off fields. Forest edges thus throw tongues and outliers up to about
   0.1 D across a border, and woods merge across same-terrain neighbours.
2. **Fields.** Each province's frame is turned by a seeded angle of 0°, 90° or ±30°, never 45° (the reserved hatch). Its strips
   are rows 8.5 units deep (±2.5, bent ±1.6 over 28 units), each cut into parcels 13 to 32 units long. A parcel is a field when
   0.6 · w_A(0.06 D) at its centre + 0.4 · w^c_A + 0.36 · (h − 0.5) > 0.5. A field area therefore ends at a hedgerow, not at a
   polygon edge, and outlying fields cross the border.
3. **Everything else** is the ground blend plus the features of each terrain, weighted by p_t (§4). The cover class of a texel is
   the argmax of w^c over the other terrains.

### 3.3 Relief in Natural

The relief is the shared hillshade fS (map-relief §3.3) with natural swing caps, blended by w^c:

| | Plains | Farmland | Forest | Hills | Mountains | Swamp | Wasteland |
|---|---|---|---|---|---|---|---|
| Cap A_t (L\*) | 6 | 4 | 7 | 13 | 18 | 3 | 8 |

- **Light:** ΔL = A_t · clamp(fS, −1, 0.6) − 6 · cast shadow − 4 · valley. Canopy damps the ground's shading to 0.7.
- **Canopy shadow:** the canopy throws 9 L\* of shadow 1.2 units to the lower right onto open ground. This is the dark fringe of
  the references' forest masses.
- **No mean removal** (N5).
- **Why the caps are larger than Clear's** (4 / 4 / 6 / 9 / 16 / 3 / 6): the critique found Clear's low land "flat" (critique fix
  3) because the colour rule held the caps down. Natural spends value on landform, as the references do.

### 3.4 How much of each province is its own (N4)

| Measure | 60 mapgen maps (5,100 provinces) | The mockup's map (60 provinces) |
|---|---|---|
| Whole province, copses counted as forest: minimum / 1st percentile / median | **0.712** / 0.797 / 0.935 (4 under 0.75, 0 under 0.70) | 0.817 / — / 0.919 |
| Whole province, copses as the province's own | 0.756 / 0.825 / 0.953 | — |
| Core (0.15 D in), copses as its own: minimum / 1st percentile | **0.980** / 0.996 (0 under 0.90) | — |
| Core, copses as forest: minimum / median | 0.752 / 1.000 (plains 0.752, hills 0.782: copses) | 0.833 |

By terrain, the whole-province minimum (copses as forest) is: plains 0.712, farmland 0.756, forest 0.827, hills 0.741,
mountains 0.827, swamp 0.793 and wasteland 0.819. The v4 warp alone gave a minimum of 0.818. Natural trades about 0.1 of the
border fringe for a landscape that crosses borders, and its cores stay pure.

---

## 4. How each terrain is drawn (the materials' recipes)

Every recipe is CIELAB on the ground blend, weighted by the terrain's presence p_t. The noise is seeded value noise (N8); sizes
are in mapgen units (D = 90).

| Terrain | Drawing | Recognised by |
|---|---|---|
| **Plains** | grass ground; wind streaks ±1.6 L\* (anisotropic, 14 × 3.2 units); light-grass patches (fBm at 11 units, up to 60%); dry patches (fBm at 18, up to 80%); copses (§3.2) | mid value, the smoothest open land (gradient p50 1.07 at ref zoom), streak coherence 0.30, a few dark clumps |
| **Farmland** | strip parcels in eight tone slots of five crops; ±1.2 L\* unevenness; furrows ±1.6 L\* every 1.25 units along the strip (green crop excepted); hedgerows on parcel ends and on 45% of row seams, 0.4 units, 60% opacity, broken by noise; hedge trees in canopy | the highest gradient energy of the open land (4.4) with a straight, patchwork structure; lighter than grass |
| **Forest** | canopy of jittered crowns 2.3 units apart (radius 0.55 to 0.9), each a dome lit from the upper left; gaps −6 L\*; conifer stands (fBm at 22 > 0.25); a broad ±2 L\* stand mottle; glades; the canopy shadow | the darkest land (L\* 19) with fine stipple |
| **Hills** | umber heath with turf blotches (fBm at 9, up to 75%) and bracken (up to 60%); rock specks (value noise at 1.6 > 0.78); relief cap 13 | darker than grass with the largest share of dark (0.14 to 0.16) and blotchy, isotropic texture (coherence 0.12) |
| **Mountains** | grey-blue rock, scree where the ground is concave (valley term) or noisy, turf in deep valleys, ±2 L\* micro-relief; relief cap 18; never snow | the widest spread (sd 12.7) and strong directional relief (coherence 0.44 to 0.47) |
| **Swamp** | olive marsh; pools where fBm at 9 > 0.40 (flat dark peat-water, 15 to 20% of the area); reed beds as short strokes (0.9 × 4.5 units, up to 70%); shrubs | dark, flat (gradient 2.4) and speckled with dark pools; the lowest relief |
| **Wasteland** | dust with pale drifts (fBm at 16); a crack network of cells 6 units wide (0.05-wide seams, 80%); scrub dots (value noise at 1.4 > 0.78); ripples ±1.2 L\* and streaks ±2.5 | the palest land (L\* 53), fine cracks, low relief |

What the bake draws carries no information beyond terrain. Settlements, springs, motifs, roads and ownership stay live layers or
pieces (map-relief V17).

---

## 5. Measured: told apart without hue

### 5.1 Method (`proto/classify.py`)

- **Screens.** The bake is resampled to the screen size of a province at each zoom: D_px of 50 (Far), 85 (the start view), 120
  (Mid), 200 (ref-2's zoom) and 420 (Near).
- **Patches.** Square patches of 0.3 D_px (15 to 48 px) that lie wholly inside one province, at least half a patch from its edge.
  Province cores are what the player reads; the border band is N4's.
- **Lightness only.** Thirteen features from L\* alone: mean, p10 and p90; log sd; skew; gradient at 1 and 2 px; Laplacian;
  structure-tensor coherence; dark and light shares around the mean; autocorrelation at 2 and 4 px.
  - "Lightness" uses all thirteen.
  - "Texture" drops the mean, p10 and p90, so value alone cannot do it.
- **Classifier.** A linear discriminant. Training and testing use disjoint provinces in two folds stratified by terrain, so
  every province is tested once. Results are given per patch and per province (the majority of its patches).
- **Visions.** Normal, and L\* of the Machado-simulated image for protan, deutan and tritan.
- **Across seeds.** Trained on the natural bake, tested on a bake made with other noise tables (`natural.py --seed 99`).

### 5.2 Results (`renders/classify.json`): patch accuracy / province accuracy

| Natural | Far (50 px) | Start (85) | Mid (120) | ref-2 zoom (200) | Near (420) |
|---|---|---|---|---|---|
| Patches tested | 973 | 743 | 739 | 1,562 | 10,638 |
| **Lightness, normal** | **0.941 / 1.00** | **0.968 / 1.00** | **0.982 / 1.00** | **0.965 / 1.00** | **0.878 / 1.00** |
| Lightness, deutan | 0.938 / 1.00 | 0.960 / 1.00 | 0.977 / 1.00 | 0.962 / 1.00 | 0.876 / 1.00 |
| Lightness, protan | 0.947 / 1.00 | 0.974 / 1.00 | 0.989 / 1.00 | 0.966 / 1.00 | 0.884 / 1.00 |
| Lightness, tritan | 0.945 / 1.00 | 0.968 / 1.00 | 0.984 / 1.00 | 0.965 / 1.00 | 0.878 / 1.00 |
| **Texture only, normal** | 0.787 / 0.98 | 0.887 / 1.00 | 0.920 / 0.98 | 0.914 / 1.00 | 0.821 / 1.00 |
| Texture only, the worst deficiency | 0.778 / 0.95 | 0.884 / 1.00 | 0.919 / 0.98 | 0.911 / 1.00 | 0.819 / 1.00 |
| Across seeds, lightness | 0.939 / 1.00 | 0.969 / 1.00 | 0.977 / 1.00 | 0.969 / 1.00 | 0.879 / 1.00 |
| Across seeds, texture | 0.805 / 0.97 | 0.890 / 1.00 | 0.936 / 1.00 | 0.928 / 1.00 | 0.823 / 1.00 |
| *Clear, for comparison: lightness* | *0.975 / 1.00* | *0.991 / 1.00* | *0.991 / 1.00* | *0.992 / 1.00* | *0.947 / 1.00* |
| *Clear: texture only* | *0.841 / 0.97* | *0.887 / 0.97* | *0.924 / 0.98* | *0.928 / 0.98* | *0.860 / 1.00* |

Per terrain at the start view (lightness, normal): plains 0.94, farmland 0.96, forest 0.99, hills 0.95, mountains 1.00, swamp
1.00, wasteland 0.95. Near is lowest because a 48 px patch at 420 px a province sees one field or one pool, not the pattern;
province accuracy stays 100%.

Lightness carries terrain in both looks. Natural is 1 to 7 points under Clear per patch, and level with it per province. With
texture only it matches Clear from the start zoom up, and it reads swamp better: from the start zoom to ref-2's, swamp scores
0.57 to 0.73 in Clear and 0.81 to 0.86 in Natural.

### 5.3 The lightness-only comparison (`renders/lighttable.out`, the start view, 26 px patches)

| Terrain | Mean L\* p10 / p50 / p90 | sd L\* | Gradient | Coherence | Dark share |
|---|---|---|---|---|---|
| Forest | 17.7 / 19.6 / 21.4 | 3.7 | 4.12 | 0.17 | 0.03 |
| Mountains | 29.5 / 32.4 / 36.9 | 12.6 | 10.32 | 0.47 | 0.40 |
| Swamp | 29.9 / 32.5 / 34.2 | 4.2 | 3.46 | 0.16 | 0.11 |
| Hills | 30.8 / 35.2 / 38.2 | 5.9 | 3.90 | 0.23 | 0.16 |
| Plains | 39.1 / 42.0 / 44.5 | 4.9 | 2.49 | 0.28 | 0.05 |
| Farmland | 45.6 / 47.8 / 49.5 | 4.8 | 4.28 | 0.18 | 0.07 |
| Wasteland | 46.5 / 52.3 / 54.0 | 3.3 | 3.79 | 0.18 | 0.04 |

### 5.4 The cases where two terrains could be confused (two-class discriminants, disjoint provinces)

| Pair | Start view: lightness / texture only | ref-2 zoom: lightness / texture | What separates them |
|---|---|---|---|
| Plains / hills | 0.968 / 0.852 | 0.976 / 0.966 | value (grass 42 against heath 35), relief (hills' cap 13) and heath blotches; the weakest pair, and the reason hills sit 7 L\* under grass |
| Farmland / wasteland | 0.981 / 0.969 | — | similar value (48 / 52): the field patchwork's gradient and Laplacian against fine cracks on smooth dust |
| Hills / swamp | 0.994 / 1.000 | 0.974 / 0.968 | the brightest decile (heath turf against flat marsh) and relief |
| Mountains / swamp | not among the ten closest pairs (all of those score 0.968 or more) | — | rock relief (sd 12.6) against flat marsh (4.2), at near-equal mean L\* (32.4 / 32.5) |
| Forest / swamp | 0.996 at ref zoom | — | darkest decile; at Near 175 of 10,638 patches confused (a dark pool against a crown gap) |

Where the drawing is ambiguous on purpose, the hover card names the terrain (§7) and the Terrain mode shows the Clear fill. Those
places are a fringe within 0.1 D of a border, a copse in grass, or one parcel at Near.

---

## 6. The Terrain mode and the Clear setting

**Clear is exactly today's v4 bake.** That means the albedos #78894A, #D5B16B, #1A3819, #6D5303, #859BB8, #38616D and #877773,
the Clear relief caps and detail, the mean-neutral pass and the gamut correction. Every check of map-relief §4 and
`window.__mock.reliefMeans()` runs unchanged in Clear and in the Terrain mode: means within ΔE 0.5, every terrain pair 20 / 12 in
every state, the relief floor 17 / 10, granite and mere 20 / 12, snow, and water raw. Three changes apply to Clear and Natural
alike, because they fix verifier defects: the per-segment line rules (§8.2), the snow clamp (§10, defect 2) and the seat ground
(§10, defect 3).

| | Clear setting | Terrain mode |
|---|---|---|
| Where | Settings → Map → Terrain colours: **Natural** (default) / Clear; also `?terrain=clear` in the mockup; persists per profile | the seventh map mode, after Springs: the mode bar's leaf-and-swatch button, Shift+7, and M cycles through it |
| What the land shows | the Clear bake in Ownership mode, with the glow, hover tint, fog states and land-look washes, exactly as v4 | the Clear bake with ground detail, water and scenery faded as in other modes (R23), no glow, hover and selection as lines only |
| Legend | none (the hover card names the terrain) | a mode legend of seven swatches with the terrain names and their glyphs, in Clear fills |
| Fog | approved: 4% haze, 10% desaturation | approved values (the same states as Clear) |
| Checks | every v4 colour check | every v4 colour check (the mode raster is the bake, not `MODE_BASE`) |

- **Why a mode and a setting.** The setting serves players who always want the colours (colour-vision deficiency, or habit). The
  mode serves a question asked now and then ("where are the hills?") without changing the default. The other modes keep
  `MODE_BASE`, frozen as approved.
- **Switching** cross-fades over 150 ms: the land texture swaps under the live layers, and nothing else re-bakes. Under reduced
  motion it is instant.
- **When the Clear bake exists.** Both bakes share every CPU raster (N1). The Clear colour pass runs the first time it is needed:
  the setting at load, the Terrain mode, or `?terrain=clear`. In the game that is a GPU pass of milliseconds. In the mockup it is
  about 4 s of time-sliced CPU (detail 1.3 s, mean-neutral 0.9 s, colour and gamut 1.5 s, canvas 0.4 s), with "Preparing terrain
  colours…" on the mode button until it is ready.

---

## 7. Hover names the terrain everywhere

| Surface | Rule |
|---|---|
| Province hover card (L1, docs/07) | the terrain moves from the second row to the **title line**: "Tormere · Forest", preceded by a 12 px swatch in the terrain's Clear fill with the terrain's glyph inside it (docs/09 terrain icons), in every mode, fog state, zoom and look. The Terrain row stays, so docs/07's order holds |
| Province card (the left dock when a province is selected) | the heading's subtitle: "Forest · Cinder Horde" (or "Independent"), with the same swatch and glyph |
| Army card | its location line names the province and the terrain: "in Tormere (forest)" |
| Link hover (feed, alerts, outliner, cards) | the province's hover look, its name on the land (map-relief §7) and, from this design, the terrain in the name chip: "Tormere · forest" |
| Wilds | the wild card's value line already reads "Peaks · Impassable" or "Mere · Impassable"; unchanged |
| Touch | a long-press shows the same card (M3), with the terrain on the title line |
| Screen readers | each province's accessible name is "Tormere, forest, Cinder Horde" |
| Fog | terrain is public (docs/01 §14), so it is named in every fog state, unexplored included |
| Shift and the numbers layer | Shift held with nothing selected shows names and, in Natural, each name's swatch (a 10 px chip beside it): a full terrain read-out one key away |

The glyph and the swatch carry the terrain by two channels: a shape and the colour-blind-safe Clear fill. A hover therefore
teaches the mapping that the Terrain mode and Clear use.

---

## 8. Ownership, the glow and fog on the natural ground

### 8.1 Rails: the band rule, analytic (`calc/rails.ts` → `calc/rails.out`, the repo's colour math)

- **Grounds per terrain.** The natural bake's pixels within 0.12 D of a border at seven lightness quantiles (0.5% to 99.5%). Each
  is also half-blended with every other terrain's median, untinted and under the banner's glow at its 0.35 peak.
- **States.** Raw, the approved haze 4%, out of sight 10%, ash 10% and moss 6%, plus the natural fog of §8.3.
- **Banners.** All 11. That makes 26,950 cases per coverage.

| Coverage | Fails | Worst luminance contrast |
|---|---|---|
| Solid | **0** | 3.87:1 |
| Keylines at 0.75 (the rest the banner or the ground, the worse), banner solid | **0** | 2.90:1 |
| Every line at 0.75 | 534: Radiance #F3E6B8 161, the pale duplicate #B5D69C 373 | 2.90:1 |

**The fix:** below device pixel ratio 1.5 the rail is 1.5 + **2** + 1.5 CSS px (banner 2 px), so the banner line always has a
fully covered pixel. That is the "keylines 0.75, banner solid" row: 0 fails. The same model on the Clear grounds gives 5 and 281
fails, so it is stricter than map-relief §4.5's (2 of 48,510). It is the one used here for both looks.

**On rendered pixels** (the verifier's method, `calc/lines.ts`), the rails show **0 failures in every view**: Natural at the start,
Mid, two Near views and month 40 at ratio 1, and the start and Near at ratio 2. The worst contrast is 3.06 to 3.61:1 at ratio 1
(3.84 to 8.73 at ratio 2). The Clear figures are the same: 0 failures, worst 2.92 to 3.39:1.

### 8.2 Neutral hairlines and internal keylines: per segment, from the ground under them (both looks)

The v4 rule keyed both lines to the province's Clear albedo: `RL_HAIRA[terrain]` and `keylineFor(albedo)`. Natural grounds break
that key (§10, defect 1), and even in Clear the shaded ground under a line is not the albedo. The new rule is:

- **Segments.** Each shared edge is cut into segments of at most 0.1 D. For each, sample the bake's texels along it:
  - hairlines: within 3 screen px either side, at the current band's mip;
  - internal keylines: on its own (lower-right) side only, 0 to 3 px.
- **The hairline** (1.5 px) takes the keyline, light #F4EEDF or dark #1C1A17, and the smallest alpha (capped at 0.92) for which
  the antialiased pixel (coverage 0.75) reaches **2.45:1 against both the p10 and the p90** of that ground.
  - Where no single keyline can (dark canopy on one side, light dust on the other), the segment is drawn as a **two-tone pair**
    (dark at 0.8 on the upper-left side, light at 0.8 on the lower-right, each 1.5 px).
  - Unreachable segments: 113 of 1,406 in Natural, 104 of 703 in Clear.
- **The internal keyline** takes the keyline of better worst-case contrast against its own side's p10 and p90. It is **2 CSS px**
  below ratio 1.5, so it has a fully covered pixel; the banner half stays 1.5 px.
- **Cost.** The styles are computed once per map, look and band (about 1,400 segments) and cached. Rails, hairlines and water
  stay 2 to 3 draws: one mesh with vertex colours in Pixi, and alpha buckets in the canvas mockup.

**Rendered pixels** (`proto/lines/*-report.json`; "fixed2" is this rule):

| View (ratio 1 unless noted) | Hairline median / under 2.3:1 (of n) | Internal keyline minimum / under 2.3:1 |
|---|---|---|
| Natural, as v4's rule draws it, start view | 2.15 / **96 of 150** | 1.19 / 13 of 60 |
| **Natural, this rule, start** | **3.21 / 1 of 150** | **3.30 / 0** |
| Natural, this rule, Mid (175 px) | 3.29 / 0 of 61 | 3.21 / 0 |
| Natural, this rule, Near (two views) | 2.95 to 4.05 / 0 | 3.25 to 3.62 / 0 |
| Natural, this rule, start, ratio 2 | 3.42 / 0 | 3.24 / 0 |
| Clear as built, start (the verifier's defect) | 2.44 / 60 of 150 | 1.55 / 4 |
| **Clear, this rule, start** | **3.15 / 3 of 150** | 2.13 / 1 |
| Clear, this rule, Mid | 3.28 / 0 of 61 | 1.33 / 3 |

**What remains.** The prototype's Clear internal keyline still had 1 to 3 misses. It sampled both sides of the line at the start
zoom's width and kept that sample at every zoom. The rule above samples the keyline's own side at the band's width; the build
re-measures with the page's check. The single Natural hairline under 2.3 (1.44:1) is a segment whose ground changes within 2 px
along it. A check on rendered pixels in `window.__mock` (§13) holds both floors: hairline 2.3:1, internal 3.2:1.

### 8.3 Fog

| State | Natural | Clear and the Terrain mode |
|---|---|---|
| Unexplored | the 4% gesso haze becomes **10% haze plus 25% desaturation**; the hem peaks at 20% (12% approved) and falls to the interior over 0.05 D | approved: 4% haze, the hem to 12% |
| Explored, out of sight | **25% desaturation** | approved: 10% |
| What each state shows | unchanged (docs/07, docs/01 §14) | unchanged |

**Why.** The 4% and 10% caps were "the strongest haze the rule allows" (map-relief §4.2). That rule no longer binds Natural, and the
critique and design risk 5 both found the frontier all but invisible.

**Measured** (`renders/checks.json`, mean ΔE of a terrain's p10, p50 and p90 grounds):

| | ΔE |
|---|---|
| Approved haze, by terrain | 1.6 to 2.2 |
| Approved out of sight | 0.6 to 1.3 |
| Natural unexplored | 4.8 to 6.5 |
| Natural out of sight | 1.5 to 3.3 |
| Natural unexplored against out of sight | 4.1 to 5.6 |

The rails pass the band rule in both natural states (§8.1). The haze compresses texture contrast by only 10%, so the drawing still
reads. See `renders/after-fog.png`.

### 8.4 The glow, hover, selection and the Realm tint

- **Glow, hover, selection.** Unchanged: the glow is 0.35 at most, gone at 0.05 D; hover is 0.25, selection 0.30, with the inner
  line. The glow is among the rail grounds above.
- **The Realm tint option** (8%, off by default) no longer costs terrain pairs in Natural: there are none to keep. It keeps its
  setting text for Clear only.
- **Owner question 1.** Whether Natural should turn it on by default, as the references do, is put back to the owner (§16). The
  owner's answer names "rails and glow", so the default stays off.

---

## 9. Data modes

**Chosen: unchanged.** Every data mode draws its own opaque raster: `fillFor` per province, shaded by the gentle fixed relief of
±3 L\*, mean-neutral. It is identical in Natural and Clear (map-relief §9.2), so R16 (mode colours 20 / 12 from both wild grounds)
holds unchanged. In every mode the landscape fades out (R23), and only the wilds, rails, miniatures and labels stay.

**Rejected: the mode colours as a translucent tint over the natural ground.** Measured on the HEAT ramp, adjacent stops (each over
any natural ground, `renders/checks.json`) come apart by:

| Mode colours drawn | Adjacent stops at worst, normal / worst deficiency |
|---|---|
| translucent at 0.6 over the landscape | 5.1 / 0.1 |
| translucent at 0.75 | 6.0 / 0.1 |
| translucent at 0.9 | 9.1 / 3.3 |
| **opaque raster with ±3 L\* relief (chosen)** | **9.7 / 2.8**, the same as today's |

A translucent mode lets the ground's own variation swamp the data: a fifth of the ramp collapses for a colour-blind player. The
Terrain mode is the one mode that shows terrain, and it shows the Clear fills (§6).

---

## 10. The verifier's remaining defects

| # | Defect (`map/verify-final`) | Fix in this design | Measured |
|---|---|---|---|
| 1 | Neutral hairlines under their floor on rendered pixels (start: median 2.44, 60 of 150 under 2.3) | per-segment keyline and alpha from the ground under the line, solved at coverage 0.75 against its p10 and p90; a two-tone pair where one keyline cannot serve both; in both looks (§8.2) | Clear 3.15 median, 3 of 150 under; Natural 3.21, 1 of 150 |
| 2 | Passable mountains near the snow colour (Clear: 5.9 to 9.2% of mountain pixels within 20 / 12; brightest L\* 84.6) | **Natural:** rock never comes near: every passable pixel is ≥ 23.3 / 22.6 from snow (mountains ≥ 26.2 / 25.8, brightest L\* 58.3). **Clear:** clamp each texel's total change (relief + detail + micro-relief) to [−A_t, +0.6 A_t] before the mean-neutral pass, which restores the means as now | Clear mountains, raw: 8.8% → **0%** within 20 / 12 (minimum 22.0 / 21.0; L\* max 73.9); under the haze: 15.1% → 0%; farmland 0.01% → 0% |
| 3 | Hamlet muting overshoot (muted against the flat albedo) | the seat's ground is the bake's own colour under the seat (its darker decile within 0.09 D), and the muting aims under the limit: 2.3:1 at Mid, 3.6:1 at Near, verified at 2.5 and 4. Every tone (walls, roof, lit end, ridge, windows) passes through the muting | Mid, Natural: p95 per seat, worst 4.14 → **2.58**, median 2.91 → 2.25. Clear: 3.11 → **2.39**. Near is still 3.9 to 4.5 in the prototype, where windows and ridges were not muted; the build mutes every tone and checks p95 ≤ the limit per seat |
| 4 | A hovered name drawn over a transit day chip | live names (hover, link) avoid every arrow and path chip: the label tries six spots (its own; below; above the seat; right; left; lower), and if none is free the chip is drawn again on top, since the number is the decision. The layout check adds hover names against chips | every province hovered at the start, Mid and with a path planned: **1 overlap (Tormere on Ilsa's "4d") → 0**; 1 label moved (`renders/hovercheck.json`) |
| 5 | The cliff face reads as vertical stripes | a strata-led face: horizontal strata 6 to 13 units deep with their own value (±3.5 L\*), a lit ledge on each top and a shadow below, gentle bends and fault steps every 80 to 200 units, short joints inside one stratum only (18 to 48 units apart, irregular), low-frequency weathering. No full-height facets. The colours are the approved #3A3436 to #221E20 with the plinth and plaque | stripe index (vertical-edge energy share) **0.568 → 0.141**; light streak columns **15.4 → 0 per 100 px** (`renders/cliff-before-after.png`) |
| 6 | Windows of 1280 × 720 and smaller start at Far | the start view is at least 96 px a province: s0 = max(the fit, 96 / D), centred on the capital and clamped so the view stays on the model (or centred on it where the model is the smaller). Z returns to it; leaning back still shows the whole model | as built: 55 to 63 px at 1024 × 768, 1280 × 720 and 1366 × 768 (Far). With the rule: **96 px, Mid**, capital on screen, at every size; 114 px at 1920 × 1080 (unchanged); phone 96 px (`renders/startzoom.json`, `startrule-*.png`) |
| 7 | The internal keyline under its floor on swamp (median 2.89) | as #1: the keyline is chosen from the ground on its own side, and is 2 px below ratio 1.5 | Natural: minimum 3.30 at the start (swamp 4.30). Clear swamp in the prototype: median 2.89 → 3.63, minimum 1.70 → 2.76; the own-side sampling, which the prototype lacked, closes the rest (to verify in the build) |
| 8 | `p61-relief-pieces.js` at 543 lines | split by job (§13): `p61-relief-pieces.js` (layout, slots, the seat ground), `p62-relief-figures.js` (bases, figures, towns, hamlets, huts, events), `p63-relief-labels.js` (labels, live names, chips, the path thread, arrows). `p58-relief-bake.js` (501 lines) splits too: noise and helpers, the shared rasters, the Clear colour, and the new `p58n-natural.js`. Each is under 400 lines | — |

---

## 11. The look against the references (`renders/metrics.json`, `proto/renders/sheet-*.png`)

All views are 1440 × 900, the mockup with its pieces, labels and UI, cropped to the land. Ref-2 is cropped to its land.
Patchwork: adjacent quarter-province blocks over ΔE 10 / 15. Busy: adjacent 6 px cells with ΔL\* over 10 / 20.

| View | L\* p5 / p50 / p95 | L\* sd | OKLCH C mean; over 0.12 | Busy 10 / 20 | Patchwork 10 / 15 |
|---|---|---|---|---|---|
| ref-2 (zoomed in, land and tokens) | 10.8 / 32.8 / 46.8 | 11.6 | 0.064; 0.45% | 11.8 / 1.8 | 16.8 / **4.3** |
| ref-4 (further out) | 0.9 / 28.3 / 42.3 | 14.2 | 0.050; 0.31% | 14.6 / 4.1 | 25.3 / 13.2 |
| Before: v4 (Clear), ref-2's zoom | 13.2 / 39.5 / 75.5 | 21.9 | 0.059; 0.65% | 20.6 / 7.9 | 36.1 / 22.2 |
| **After: Natural, ref-2's zoom** | 12.5 / **32.5** / 56.3 | 15.6 | 0.049; 0.70%\* | 22.9 / 7.0 | **20.0 / 7.1** |
| Before: start view | 15.0 / 45.8 / 74.7 | 19.2 | 0.064; 0.67% | 25.1 / 8.6 | 30.9 / 19.1 |
| **After: Natural, start view** | 14.4 / 38.3 / 58.4 | 15.3 | 0.050; 0.76%\* | 28.2 / 7.7 | **19.4 / 5.5** |
| **The land alone** (bake, no lines or pieces), ref-2's zoom: Natural / Clear | — | — | — | 8.4 / 0.9 against 6.9 / 2.0 | **11.7 / 3.7** against 24.9 / 18.0 |

\* The pixels over C 0.12 are banner rails, rims and UI. The land has none.

- **What this says.** The natural land alone is as calm as ref-2 at province scale: 3.7% of patch edges over 15, against ref-2's
  4.3% and Clear's 18%. It also sits in ref-2's key (median 32.5 against 32.8).
- **What is left** is fine-scale busyness on screen (22.9% against ref-2's 11.8%). It comes from what stands on the land, not
  from the land (8.4%): every province's outline at the hairline floor, labels, hamlets and the wild massifs.
  - The reference draws a line around every province too. Its lines are thinner and lower in contrast than our floor allows.
  - The hairline floor is a colour-blind minimum, and it stays (N3).
- The sheets show it: `sheet-ref-zoom.png`, `sheet-start.png`, `sheet-far-near.png`, `sheet-fog-clear.png` and `sheet-cvd.png`.

---

## 12. Performance and memory, against v4

**The bake (mockup, CPU, main thread, time-sliced).** The v4 as built measures 5.6 s CPU and 7.4 s wall:

| Step | ms |
|---|---|
| id | 126 |
| warp | 473 |
| height weights | 173 |
| heightfield | 1,041 |
| hillshade | 379 |
| detail | 1,271 |
| water | 18 |
| mean-neutral | 884 |
| colour and gamut | 1,457 |
| canvas and mips | 406 |
| mode relief | 243 |

| Path | v4 (Clear only) | Natural default | Natural + Clear (after the first switch) |
|---|---|---|---|
| Shared rasters (id, warp, heights, hillshade, water, mode relief) | 2.45 s | 2.45 s | 2.45 s |
| Look-specific | detail, mean-neutral, colour, canvas: 4.0 s | cover blend (7 planes, three box passes) about 0.3 s; the natural material pass **0.76 to 0.96 s** in V8 (`tools/bench.cjs`); Lab to sRGB about 0.6 s; canvas and mips 0.4 s: about **2.1 s** | + the Clear pass 4.0 s, once, when first needed |
| Total CPU | 5.6 s | **about 4.6 s** | 8.6 s over the session |

In the game (map-relief §10), the natural pass is one more GPU composite pass, of the same size as the Clear one, a few ms. The
CPU rasters are cached in IndexedDB as before. The cover raster (R8) used by the N4 test joins them.

**Memory.**

| GPU (Large map, 4 nations, ratio 2: docs/06's case) | v4 | This design |
|---|---|---|
| Land bake with mips | 14.0 MB | 14.0 MB (Natural) |
| Second bake (Clear), only while the setting or Terrain mode has been used this session; freed after 2 minutes unused | — | +14.0 MB |
| Id and distance | 7.9 MB | 7.9 MB |
| Cover-blend inputs during the bake (two RGBA8 at half resolution) | — | 5.2 MB transient |
| Detail tiles, miniature atlas, table, labels | 37 MB | 37 MB |
| **Total** | **about 59 MB** | **59 MB (Natural only) to 73 MB (both bakes)**, under docs/06's 96 MB |

- **Mockup canvases:** the natural bake and mips take 13.1 MB, plus 13.1 MB for its unwashed copies. Clear adds the same once
  used. That is up to 26 MB more than v4's 57 MB of canvases.
- **Per frame: unchanged.** One composite draw samples whichever bake is current. The rails, hairlines and water keep their 2 to
  3 draws (the segment styles are vertex colours). Map draws stay at most 12.
- **Phones:** one bake at a time. Switching to Clear re-runs the GPU colour pass (milliseconds) and frees the other.
  Map detail Reduced (map-relief §10.4) keeps every cover, because the covers are the terrain's identity in Natural. Reduced drops
  only the Near crowns and cast shadows, as before.

---

## 13. Build notes for the mockup (the next workflow step)

- **The natural pass,** `p58n-natural.js`, a new part of at most 400 lines.
  - `rlNaturalGen(out)` takes the shared rasters (S1 to S5, the water) and writes `out.natImg`, `out.natMip1`, `out.natMip2`,
    `out.cover` and `out.natTimes`.
  - It reuses the S3 height weights as the ground blend. It makes the cover blend (σ 0.04 D) at full resolution, then the covers
    and materials of §3 and §4 per texel, with the parameters in one `RL_NAT` object (docs/09-balance rows).
  - The numpy prototype `proto/natural.py` is the reference for every constant. Its outputs are under `proto/data/`.
- **Looks.** `view.terrain = 'natural' | 'clear'`; `?terrain=clear`; a "Terrain colours" control beside "Map look".
  - `rlRenderStatic` blits `RB.natCanvas` or `RB.canvas` by look and mode.
  - The wash keeps per-look unwashed copies.
  - Fog values come from `RL_P.fog[look]`.
  - Natural water is #14615B; Clear water stays #50AF9B.
- **The Terrain mode.** Add `['terrain', 'terrain', 'Terrain', 'The colour-blind-safe terrain colours.']` to `MODES`, with
  Shift+7.
  - The mode raster is the Clear bake, with the hover line only and a legend.
  - It makes the Clear bake lazily (time-sliced), showing "Preparing terrain colours…" until it is ready.
- **Hover naming.**
  - `provTip`: title `${p.name}`, value `${swatch} ${TERRAIN[p.terrain].name}`; the Terrain row stays.
  - The dock heading subtitle and the army card's location line.
  - The link chip text, and the aria-label.
- **Lines.** Replace `RL_HAIRA` and the albedo-keyed `keylineFor` in `rlDrawRails` with `rlSegStyles(edge, kind)` (cached per map,
  look and band; `tools/patches.js` is the prototype). The rail banner is 2 px below ratio 1.5; the internal keyline 2 px below
  1.5, from its own side.
- **Seats.** `rlSeatGround(i)` samples the current look's bake (darker decile within 0.09 D). `rlMuted` aims at 2.3 / 3.6, and
  every house tone passes through it.
- **Labels.** `rlArrow` records its chip box; `rlLiveLabels` tries six spots and redraws the chip on top if none is free.
- **Snow.** In S6, clamp `DL` to [−A_t, +0.6 A_t] after detail and micro-relief, before S7.
- **Cliff.** `rlRim` draws strata, ledges, faults and short joints as in `proto/cliff.py`, and drops the full-height lit facets.
- **Start view.** `fitScale` stays the lean-back fit. A new `startScale = max(fitScale, 96 / MED_DIAM)` is centred on the
  capital and clamped to `MODEL_BOX`. Z and the start use it.
- **The split** of `p61` and `p58` is §10 defect 8. `build.sh` lists the new parts in order: p58a, p58b, p58c, p58n, p59, p60,
  p61a, p61, p62, p63.
- **New checks in `window.__mock`:**
  - `reliefNatural()`: chroma over 0.10 is 0, the own cover per province (N4), and the classifiers' features on the rendered
    canvas at the current zoom. These are a nearest-centroid classifier with centroids from `proto/renders/classify.json` and an
    LDA-like threshold. The province accuracy must be 1.0 and the patch accuracy at least 0.9 at Mid.
  - `reliefLines()`: per-segment hairline ≥ 2.3:1 and internal ≥ 3.2:1 on rendered pixels, against the same pixel without lines.
  - `reliefSeats()`: hamlet light pixels' p95 ≤ the limit per seat.
  - `reliefHoverChips()`: no hover name over a chip.
- **Which checks run where.** In Natural, `reliefMeans()` reports "not applicable (Natural)" and the readability check stands in.
  In Clear and the Terrain mode it runs unchanged.

---

## 14. Tests (repo, when the map is built)

| Test | Checks |
|---|---|
| `tests/content/palette.test.ts` | unchanged for the Clear albedos and every v4 colour check (now titled "Clear and the Terrain mode"). New: the natural materials have OKLCH C ≤ 0.10. The lit-bead rail passes the band rule on the natural grounds (seven quantiles, half-blends, glow, every approved and natural fog state, all 11 banners) solid and with keylines at 0.75 and the banner solid. The natural fog states move every terrain's ground by ΔE ≥ 4 (unexplored) and ≥ 1.5 (out of sight). No natural material or relief extreme is within 20 / 12 of snow |
| `tests/present/map/terrainCover.test.ts` (extended) | N4 on Small, Medium and Large, 2 and 4 nations, seeds 1 to 5: the whole province ≥ 0.70 own (copses as forest); the core (0.15 D) ≥ 0.95 own (copses as their own); copses ≤ 25% of any core; and the CPU cover raster is a pure function of map and seed |
| `tests/present/map/readability.test.ts` (new) | the CPU reference of the natural bake at 512 px on two seeds. The lightness-only classifier, trained on one seed and tested on the other, at D_px 85 and 200: province accuracy 1.0 and patch accuracy ≥ 0.90; texture-only ≥ 0.80 (measured 0.89 to 0.93) |
| `tests/present/map/lines.test.ts` (new) | the per-segment solve: every segment's chosen style reaches 2.45:1 (hairline, coverage 0.75) or is drawn two-tone; internal keylines ≥ 3.2:1 at coverage 1 |
| `tests/ui/derive/mapLabels.test.ts` (changed) | hover and link names never overlap a day chip; the start scale is at least 96 px a province at 1024 × 768, 1280 × 720, 1366 × 768 and 1440 × 900 |
| Browser smoke (Playwright, `src/render/**`) | Natural and Clear bakes from one CPU cache; the switch and the Terrain mode re-bake nothing that is shared; the rendered-pixel rail, hairline, keyline and seat checks; the frame budget; GPU memory ≤ 96 MB with both bakes |

---

## 15. What changes in the docs (drafts; nothing is applied)

**`docs/09-art-direction.md`.**

- *Distinct colors*: "Every pair of terrain fills …" becomes "In the Terrain map mode and with Clear terrain colours, every pair
  of terrain fills …". The mana primaries and the wild grounds against the Clear fills are unchanged.
- Add: "The default map view is a natural landscape (docs/design/natural-view). There, terrain is read from the drawing, named on
  every hover and shown in the Terrain mode. The banner, band, keyline, hairline, contour and snow minimums apply in every view."
- *Map states*: the natural fog values (§8.3) beside the approved ones, which stay for Clear.
- *Terrain paragraph*: the Clear albedos stay as the fills. Add the natural materials as a table with "presentation; not bound by
  the distinct-colors rule".
- *H1 (hue within a terrain)*: "in Clear and the Terrain mode".

**`docs/07-ui.md`.**

- Modes gain Terrain (Shift+7).
- Settings → Map → Terrain colours: Natural | Clear.
- The province tooltip puts the terrain on the title line with a swatch and glyph; the province card's heading gains the terrain.
- Link chips name the terrain.
- The start view's minimum scale is 96 px a province.

**`docs/09-balance.md` "Map presentation"** gains rows dated at adoption:

- the natural materials (§2.2) and water #14615B;
- σ_g 0.12 D and σ_c 0.04 D;
- the canopy edge (0.07 D, 0.42 at 10 units, threshold 0.52);
- glades (0.85, −0.62 at 9 units) and copses (0.80 at 15 units, plains and hills, ≤ 25% of a core);
- the field strips (8.5 ± 2.5 deep, 13 to 32 long, 0.6 / 0.4 / 0.36 weights, hedges 0.4 units, 45% of row seams);
- the presence ramp (0.35 to 0.65);
- the natural relief caps (6 / 4 / 7 / 13 / 18 / 3 / 8) and the canopy damping and shadow (0.7; 9 L\* at 1.2 units);
- natural fog (10% + 25%; out of sight 25%; hem 20%);
- the line rules (segments 0.1 D, 2.45:1 at 0.75, two-tone fallback, internal 2 px, rail banner 2 px below ratio 1.5);
- seat muting (darker decile, 2.3 / 3.6);
- the snow clamp; the start scale (96 px); the cliff strata.

The v4 rows for `RL_HAIRA` and "hamlets muted against the albedo" are marked superseded.

**`docs/design/map-relief.md`:** a pointer to this design under "Status", and its §4.2 sentence "unchanged in code" gains "in the
Terrain mode and Clear".

---

## 16. Owner questions (defaults in bold; the build follows the defaults)

1. **The Realm tint in Natural:** **off by default, as your answer names rails and glow**; or on at 8% in Natural only, as the
   references show. In Natural it no longer costs terrain pairs, and the rails keep the band rule.
2. **Fog in Natural:** **visible: unexplored 10% haze plus 25% desaturation, out of sight 25%**; or the approved 4% and 10%
   everywhere.
3. **Lines between unowned provinces:** **kept at the colour-blind floor (2.45:1), so every province has a visible outline**; or
   hidden at Far and Mid for unowned neighbours. That would be calmer, as the references are, but those borders would then show
   only on hover.

---

## 17. Risks and what was not verified

1. **The prototype is numpy, not the page's code.** The natural bake was injected into the mockup in memory. The JS port must
   reproduce `proto/natural.py`, and the build's readability check is the guard. The seeds, tables and sizes are given. The
   noise tables differ between numpy and the page, so the statistics carry over, not the pixels.
2. **The classifier is a model of a reader, not a playtest.**
   - A linear discriminant on 13 lightness features is a floor for what a human sees: people also use context, shape and the
     hover card.
   - It was trained on this map's provinces in two folds, and across noise seeds on the same map. It was not tested across map
     geometries (the 60-map run covers N4 only).
   - Plains against hills is the weakest pair (texture-only 0.85 at the start zoom).
3. **Busyness on screen is still about twice ref-2's at 6 px** (22.9% against 11.8%). The land itself is calm. The lines at their
   floor, the labels and the hamlets make the rest (owner question 3).
4. **Some seat and line figures are the prototype's, not the build's:**
   - hamlets at Near (windows and ridges unmuted in the prototype);
   - one Natural hairline under the floor;
   - the Clear internal keyline sampled from both sides.
   The build checks them on pixels (§13).
5. **The cliff face, the hover chips and the start view** were measured on the mockup or a numpy strip. The cliff strata were not
   drawn in the page.
6. **Timings are on a shared machine** with software rendering: the bench and the bake step times are noisy, and the GPU estimates
   are estimates.
7. **Not run:** the repo's tests, a phone, a GPU, and the owner's eye.

---

## Appendix: files (under `visual-v4/natural/`)

- `design.md`: this file.
- `proto/`:
  - `natlib.py`, `natural.py`, `cover_share.py`, `classify.py`, `lighttable.py`, `checks.py`, `metrics.py`, `cliff.py`,
    `sheets.py`;
  - `data/`: the exported rasters and both natural bakes, `natural.png` and `natural-s99`;
  - `renders/`:
    - the views: `before-*.png`, `after-*.png`, `clearfixed-*.png`;
    - the sheets: `sheet-ref-zoom.png`, `sheet-start.png`, `sheet-far-near.png`, `sheet-fog-clear.png`, `sheet-cvd.png`;
    - `cliff-before-after.png`, `startrule-*.png`;
    - the measurements: `metrics.json`, `classify.json`, `lighttable.out`, `cover-share-60.out`, `checks.json`,
      `hovercheck.json`, `startzoom.json`;
  - `lines/`: the rendered-pixel dumps and their `*-report.json`.
- `calc/`:
  - `colorMath.ts` and `colors.ts` (the repo's, verbatim); `parity.ts`;
  - `rails.ts` → `rails.out`; `lines.ts` (the verifier's `colors.ts` with this folder's paths) → `lines-*.out`;
  - `natural-grounds.json`, `clear-grounds.json`.
- `tools/`: `export.cjs`, `natpage.cjs`, `patches.js`, `shoot.cjs`, `measure-lines.cjs`, `hovercheck.cjs`, `startzoom.cjs`,
  `times.cjs`, `bench.cjs`.
