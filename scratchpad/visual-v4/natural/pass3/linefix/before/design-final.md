# The natural view: a natural landscape by default, with Clear terrain colours and a Terrain mode

2026-10-23. **Final, after adversarial review.** This is the design for the owner's map decision of 2026-10-23. It changes
the land of the v4 relief map (`docs/design/map-relief.md`, kept here as "map-relief") and leaves its object, light,
miniatures, labels, wilds, rules and pipeline as they are. The sim is untouched, and so is the repo: nothing in
`/home/user/Fluid-Magic-` was edited (`git status` clean). Every number below was measured with a prototype on the mockup's
own map, on a second mockup map (seed 31) where marked, and on 60 mapgen maps where noted.

This is `design.md` corrected by an adversarial review. What the review confirmed is kept as written. Each change, with its
reason and its measurement, is listed in "What the review changed, and why" at the end. Figures the review added or
re-measured are marked *(review)*. The review's scripts and outputs are under `review/` (appendix).

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
`calc/` and `review/calc/` (diff-checked: identical). The numpy colour library `proto/natlib.py` matches them to 4 decimals on
CIEDE2000 under all four visions (`calc/parity.ts`). Rendered-pixel figures come from the mockup itself, with the natural bake
and the fixes injected in memory. The tooling is the independent verifier's own dump (`map/verify-final/dump-colors.cjs`) and
its own `colors.ts` (copied as `calc/lines.ts`). The review re-ran the rails check (identical output on the draft's states),
the rendered-pixel line checks and the classifier, and added the rows at the foot of the table.

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
| `review/calc/rails-hem.ts`, `rails-fog2.ts` → `.out` *(review)* | the band rule with the frontier hem, the corrected natural fog and the Realm tint option; the wild contour and rim on the natural grounds |
| `review/calc/water-snow.ts`, `banner-vs-hairline.ts` *(review)* | natural water, snow and material chroma against the natural grounds; each banner against the light hairline |
| `review/py/classify_states.py`, `fog_sweep.py` → `review/classify-states.out`, `fog-sweep.json` *(review)* | the readers under every map state; the natural fog candidates (visibility against reading) |
| `review/variant/seed31.html`, `review/tools/export2.cjs`, `review/proto2/`, `review/py/xgeo_*.py` → `review/xgeo-*.out` *(review)* | a second map (the mockup with seed 31, built in the review folder only), its natural bake, and the readers trained on one map and tested on the other |
| `review/tools/patches6.js`, `lines6.cjs`, `count6.cjs` + `review/calc/lines3.ts` → `review/lines/*-fixed6-*-report.json` *(review)* | the continuous (anchored) hairline and internal keyline, solved against the fogged ground, on rendered pixels; keyline flips and partner segments counted (`fixed3` to `fixed5` are the intermediate steps) |
| `review/tools/bench-core.cjs`, `bench-cover.cjs` *(review)* | CPU cost of the cover blend at full and half resolution, of the cover classes alone, and of the Lab blend and conversion |

---

## The design in fifteen lines

1. **Natural is the default look of the land.** Muted, low-key materials blend across province borders. Terrain is read from
   what is drawn: canopy masses, field strips with hedgerows, open grass with copses, rolling umber heath, grey-blue rock and
   scree, olive marsh with pools and reeds, and cracked dusty scrub.
2. **Clear terrain colours** (Settings → Accessibility → Terrain colours: Natural | Clear) shows exactly today's v4
   colour-blind-safe bake in Ownership mode. **The Terrain map mode** (the seventh mode, Shift+7) shows the same bake in any
   session, with its baked relief and detail as the mode's second channel. Both keep every v4 check.
3. **Hovering a province always names its terrain.** The name's line carries a terrain chip: a 12 px swatch in the Clear
   fill, the terrain's glyph (seven new icons) and its word. The card's separate Terrain row goes, so the terrain is said once.
   The same holds in the province card, army card, link chips and the screen-reader name, in every mode, fog state, zoom and
   look, and on touch.
4. **The palette is near the references' measured numbers.** Forest is L\* 19, grass 43, fields 48, heath 36, rock 31 with lit
   faces to 51, marsh 34, scrub 53, water a dark teal. No pixel of the bake is above OKLCH C 0.089 (the most chromatic
   material, light grass, is 0.092; the cap is 0.10). The value range is ref-2's.
5. **Two blends, one landscape.** The ground colour blends over σ = 0.12 D (the height blend the bake already makes). The cover
   blends over σ = 0.04 D with noise, so canopy, fields and features interfinger across the v4 warp's ragged edges.
6. **Each province still shows its own terrain.** On 60 mapgen maps the minimum is 71% of a province's area (median 94%). Its
   core (0.15 D in) is at least 98% its own, counting a plains or hills province's copses as its own.
7. **Measured without hue, the terrain still reads, on this map and across maps.** A lightness-only reader names every
   province of this map at every zoom in every vision, and 98 to 100% when trained on one map and tested on another
   *(review)*. Patches score 93 to 99% from Far to ref-2's zoom and 87 to 88% at Near. With the mean lightness removed
   (texture only), patches score 79 to 94%.
8. **Rails keep the band rule on the natural ground.** The lit-bead rail passes every natural case, the frontier hem, the
   corrected fog and the Realm tint option included (38,500 and 77,000 cases, *review*), solid and with its keylines at 0.75
   coverage. The two pale banners need the banner line at 2 px below device pixel ratio 1.5. On rendered pixels: 0 rail
   failures in every view.
9. **Hairlines and internal keylines are continuous and follow the ground under them**, in both looks. Each edge keeps one
   keyline along its whole length; its alpha follows the ground, and where it cannot reach the floor against one side, a
   partner line of the other keyline runs beside it on that side. The draft chose the keyline per segment, which flipped it
   along 13 of 73 natural edges (30 of 73 in Clear) and read as dashes, and dashes mean fog (docs/07) *(review)*. On rendered
   pixels, hairlines are 0 under 2.3:1 in every view in both looks. Natural internal keylines are 3.16:1 at worst. Clear's
   internal keyline improves from 1.21 to 2.55:1 at worst and stays open (§8.2).
10. **Fog in Natural is visible and keeps the value code.** Unexplored land takes a 6% gesso haze plus 40% desaturation (hem
    12%), and out-of-sight land 25% desaturation: ΔE 3.8 to 6.8 from land in sight, against 1.6 to 2.2 approved. The draft's
    10% haze lifted forest from L\* 19 to about 27. A lightness reader that learned the key on explored land then misread
    22% of unexplored provinces at Far *(review)*. Clear and the Terrain mode keep the approved 4% and 10%.
11. **Data modes keep their own opaque raster,** identical in Natural and Clear. Drawing them translucent over the landscape was
    measured and rejected: adjacent ramp stops fall to 0.1 apart under a colour-vision deficiency.
12. **The verifier's eight remaining defects each get a fix.** Hairlines, snow, the hover name over a chip, the cliff, the
    start zoom and the split files are closed or measured. Clear's internal keyline and the hamlets' muting stay open for the
    build's pixel checks, with a fallback stated for each (§10).
13. **Look against ref-2, at its zoom:** the natural land alone has 3.7% of province-scale patch edges over ΔE 15. Ref-2 has 4.3%,
    and the Clear land 18%. Its median L\* is 32.5, against ref-2's 32.8 and Clear's 39.5.
14. **Cost:** in the game the covers and materials are GPU passes from the same seeded tables, so nothing new runs on a phone's
    CPU at load. In the mockup the natural colour pass is about 2.1 to 2.4 s of CPU (the cover blend at half resolution), so
    the default bake goes from 5.6 to about 4.6 to 4.9 s. The second bake is made only when first needed. GPU memory is at most
    73 MB against docs/06's 96 MB (v4: 59 MB).
15. **Docs:** the docs/09 distinct-colours rule moves to "Terrain mode and Clear". The natural palette, blends, covers, fog
    values and line rules become docs/09-balance rows. docs/09 gains seven terrain icons and a mode icon, and docs/07 gains the
    mode, the key and the Accessibility setting. The tests are listed in §14.

---

## Rulings

**N1. Two looks of one model, one rule set.** The relief model (map-relief §2), its light (§2.3), heightfield and hillshade (§3.2,
§3.3), wilds (§3.8), water placement (§3.6), miniatures (§6), labels (§7), fog rules (§9.1) and pipeline (§10) are shared. Only the
land's colour pass differs: Natural (§2 to §4 here) or Clear (map-relief §3.4 and §4 unchanged). Both looks come from the same
seeded CPU rasters. The game picks one by the setting and the mode.

**N2. The distinct-colours rule binds Clear and the Terrain mode, not Natural** (owner answer, item 3). In Natural, terrain is
known from three things: the drawing, measured by the readers of §5 with floors in the tests (across maps and under fog
included); the hover card's terrain chip (§7); and the Terrain mode, one key away. The rule's text in docs/09 moves accordingly (§15).

**N3. Every other colour-blind minimum keeps its limit in every view.** That covers nation banners (unchanged), the rail band
rule (§8.1), the internal keyline and neutral hairline floors (§8.2), the wild contour and rim (§8.1: 0 fails on the natural
grounds in every state, *review*), mode colours against the wild grounds (R16, unchanged, §9), the base rims, and snow kept off
passable land (§10, defect 2).

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
*(review)* The field frames turn by exact constants: cos and sin of 0°, 90° and ±30° are 1, 0, √3/2 and 1/2, and the
seeded jitter of at most ±3.4° is a small rotation by (1, j)/√(1 + j²). The cover raster therefore uses only arithmetic,
`Math.sqrt`, `Math.floor` and table noise. The draft's prototype called cos and sin there (`proto/natural.py`, the parcel
frame). Sines may still shape colour-only terms (furrows, ripples).

**N9. Terrain is public, so the drawing reveals nothing.** Every natural material comes from the map, the seed and terrain,
never from state that fog hides (map-relief V17 holds: the bake is a pure function of the map).

**N10. Lines never dash unless fog says so** *(review)*. A neutral hairline or an internal keyline keeps one keyline colour along
a whole edge; only its alpha and a partner line vary (§8.2). A dotted or dashed border still means fog alone (docs/07).

**N11. One cover, two engines** *(review)*. The covers are drawn from the same seeded tables on the GPU and on the CPU
reference. The game draws them on the GPU. The CPU reference (`src/present/map/`, half resolution) serves the N4 and
readability tests, the CPU fallback and the browser smoke, which compares the two (at least 99.9% of texels of the same class).

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

- **Chroma:** no pixel of the bake is over OKLCH C 0.10 (maximum 0.089). Of the materials themselves, light grass #6E7734 is the
  most chromatic at 0.092 *(review, `review/calc/water-snow.ts`)*. The test caps materials and pixels at 0.10.
- **Value:** forest sits at the references' 19, grass at their 39 to 46, and rock at 15 to 51 against their 32 to 47. Water is
  their teal at L\* 37.
- **On screen** (§11), the median L\* is 32.5 at ref-2's zoom against ref-2's 32.8, and the L\* sd is 15.6 against 11.6.
- **What the drawing costs in hue:** water against mountain rock and dust is 18.0 / 8.1 and 26.0 / 8.1 under a deficiency. Water
  is told apart by its form (the smooth shore, the bank highlight, the stream line), as v4 already accepted across states
  (19.7 / 8.5). *(review)* Lakes and ponds lie only in plains, farmland, forest and hills (map-relief §3.6). Against every
  ground quantile of those four terrains water keeps at least 20.0 / 13.1. The 8.1 is against mountain rock, marsh and dust,
  where only a stream can run. Water against the mere is 30.1 / 15.8.

---

## 3. Blending across borders

### 3.1 The two blends

The v4 lookup warp (map-relief §3.1: |w| ≤ 0.10 D, features of 40 and 9 units) still decides which terrain a texel belongs to
(`LT`). From its one-hot, Natural takes two blends:

| Blend | Sigma | What it drives | Where it comes from |
|---|---|---|---|
| **Ground** w^g_t | 0.12 D, Gaussian | the ground colour: Σ_t w^g_t · ground_t in CIELAB, plus a broad ±2.2 L\* mottle (fBm, 26 units) | the height weights the bake already makes (S3, quarter resolution): no new raster |
| **Cover** w^c_t | 0.04 D, Gaussian (three box passes) | where each terrain's features appear: presence p_t = clamp((w^c_t − 0.35) / 0.3, 0, 1) | new: at **half resolution** (σ is 3 to 5 texels there), 7 planes in 8 bits, transient. *(review)* At full resolution in Float32 the blend took 1.5 s and 70 MB of CPU memory in V8; at half resolution 0.24 s (`review/tools/bench-core.cjs`) |

The ground therefore shades from one province's colour into the next over about ±0.2 D. That is the owner's "gentle colours
blending across borders". The features change over a narrower, ragged band, so each terrain's look stays crisp and never turns
to mud.

### 3.2 The covers, decided per texel (`proto/natural.py`, `proto/cover_share.py`)

1. **Canopy.** The texel is canopy when 0.5 · w_F(0.07 D) + 0.5 · w^c_F + 0.42 · n_edge > 0.52, where n_edge is fBm at 10 units
   with 3 octaves. Glades are cut out where w^c_F ≥ 0.85 and n_glade (fBm, 9 units) < −0.62. Copses are added where fBm at 15
   units is above 0.80 and w^c_plains + w^c_hills > 0.6, off fields. Forest edges thus throw tongues and outliers up to about
   0.1 D across a border, and woods merge across same-terrain neighbours.
2. **Fields.** Each province's frame is turned by a seeded angle of 0°, 90° or ±30°, never 45° (the reserved hatch), plus a
   seeded jitter of at most ±3.4°, all by exact constants and a small rotation (N8: no cos or sin in the cover). Its strips
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

These are two folds of one map, in sight. §5.5 *(review)* tests a second map and every map state.

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

### 5.5 Across map geometry and across the map states *(review)*

The draft trained and tested on one map, in sight only. The review built a second mockup map (seed 31: other cells and another
terrain layout, built in `review/variant/` only, never in the page file), baked it with the same `natural.py`, and trained on one
map and tested on the other (`review/xgeo-12to31.out`, `review/xgeo-31to12.out`). It also applied every map state to the whole
bake (`review/classify-states.out`, `review/fog-sweep.json`).

| Lightness-only reader, normal vision: patch / province | Far (50 px) | Start (85) | Mid (120) | ref-2 zoom (200) | Near (420) |
|---|---|---|---|---|---|
| Trained on map 12, tested on map 31, in sight | 0.934 / 1.00 | 0.963 / 1.00 | 0.957 / 0.98 | 0.958 / 1.00 | 0.869 / 1.00 |
| Trained on map 31, tested on map 12, in sight | 0.949 / 0.98 | 0.977 / 1.00 | 0.988 / 1.00 | 0.970 / 1.00 | 0.878 / 1.00 |
| The same, deficiencies (12 → 31) | 0.932 to 0.943 / 1.00 | 0.955 to 0.963 / 1.00 | 0.953 to 0.963 / 0.98 | 0.957 to 0.962 / 1.00 | 0.865 to 0.874 / 1.00 |
| Texture only, both directions | 0.79 to 0.81 / 0.97 to 1.00 | 0.88 to 0.91 / 0.98 to 1.00 | 0.91 to 0.94 / 0.97 to 1.00 | 0.92 / 1.00 | 0.83 / 1.00 |

Across maps, one province in 60 can be misread at Far or Mid. The tests' province floor is therefore 0.95, not 1.0 (§14).

| Map state; reader trained on in-sight land of this map (two folds) | Far | Start | Mid | ref-2 zoom |
|---|---|---|---|---|
| Out of sight, 25% desaturation | 0.942 / 1.00 | 0.965 / 1.00 | 0.982 / 1.00 | 0.964 / 1.00 |
| Ash wash 10%, moss wash 6% | 0.927 to 0.939 / 1.00 | 0.965 to 0.970 / 1.00 | 0.978 to 0.982 / 1.00 | 0.956 to 0.965 / 1.00 |
| Unexplored, **the draft's** 10% haze + 25% desaturation | **0.754 / 0.78** | 0.898 / 0.97 | 0.917 / 0.98 | 0.922 / 1.00 |
| The same, across maps (12 → 31; 31 → 12) | 0.765 / 0.78; 0.813 / 0.88 | 0.885 / 0.98; 0.921 / 0.98 | 0.897 / 0.97; 0.962 / 1.00 | 0.923 / 1.00; 0.948 / 1.00 |
| Unexplored, **6% haze + 40% desaturation (chosen, §8.3)** | **0.900 / 0.97** | **0.962 / 1.00** | **0.969 / 1.00** | — |
| The same, across maps (12 → 31; 31 → 12) | 0.901 / 0.98; 0.920 / 0.98 | 0.942 / 1.00; 0.968 / 1.00 | 0.948 / 1.00; 0.984 / 1.00 | 0.951 / 1.00; 0.965 / 1.00 |

- **Why the haze matters in Natural and not in Clear.** Natural terrain is a value code with steps of 3 to 7 L\* (swamp 32.5,
  hills 35, plains 42, fields 48, dust 52). A 10% gesso haze lifts forest from L\* 19 to about 27 and swamp to about 40, the size
  of those steps. A reader who learned the key on explored land then misreads unexplored land, and the first view of a game is
  78 to 90% unexplored (map-relief §9.1). Desaturation leaves L\* alone, so §8.3 moves the fog's visibility into it. Clear's
  steps are 20 apart, and its approved 4% haze costs nothing (0.970 / 1.00 at Far).
- A reader trained on both looks reads the draft's fog well (0.936 / 0.98 at Far, 0.964 / 1.00 at the start). But the frontier
  puts both looks side by side on one screen.
- Texture-only readings barely move under any state: 0.785 at Far and 0.876 at the start under the draft's fog, against 0.787 and
  0.887 in sight.
- Still one map generator and one mockup layout family: the second map is the mockup's jittered grid with another seed, not a
  mapgen map. The 60-map run covers N4 only.

---

## 6. The Terrain mode and the Clear setting

**Clear is exactly today's v4 bake.** That means the albedos #78894A, #D5B16B, #1A3819, #6D5303, #859BB8, #38616D and #877773,
the Clear relief caps and detail, the mean-neutral pass and the gamut correction. Every check of map-relief §4 and
`window.__mock.reliefMeans()` runs unchanged in Clear and in the Terrain mode: means within ΔE 0.5, every terrain pair 20 / 12 in
every state, the relief floor 17 / 10, granite and mere 20 / 12, snow, and water raw. Three changes apply to Clear and Natural
alike, because they fix verifier defects: the line rules (§8.2), the snow clamp (§10, defect 2) and the seat ground (§10,
defect 3).

| | Clear setting | Terrain mode |
|---|---|---|
| Where | **Settings → Accessibility → Terrain colours: Natural (default) / Clear**, beside pattern overlays and high-contrast borders. docs/07's settings have no Map tab, and players with a colour-vision deficiency look under Accessibility. Also `?terrain=clear` in the mockup. It persists per profile. The Terrain mode's legend carries a link, "Use these colours everywhere", that sets it | the seventh map mode, after Mana springs: a mode-column button with its own icon (§7) and **Shift+7**. M and Shift+M cycle through it. **F7 is not bound**: Chrome and Firefox use it for caret browsing (docs/07 already treats F1 to F6 as best effort) |
| What the land shows | the Clear bake in Ownership mode, with the glow, hover tint, fog states and land-look washes, exactly as v4 | **the Clear bake as baked.** Its relief, canopy, parcels and pools stay, because they are this mode's second channel (docs/07: every mode has one besides hue). Water stays. Settlements, motifs and scars step aside as in every mode but Ownership (R23). No glow; hover and selection draw lines only |
| Numbers layer (`` ` ``) | PD, as in Ownership | one chip per province with the terrain's glyph and word: the mode's value |
| Legend | none (the hover card names the terrain) | a legend chip of seven swatches with the terrain names and glyphs, in Clear fills |
| Fog | approved: 4% haze, 10% desaturation | approved values (the same states as Clear) |
| Checks | every v4 colour check | every v4 colour check (the mode raster is the bake, not `MODE_BASE`). R16 holds: the Clear albedos keep 20.1 / 12.3 from the wild grounds at worst (map-relief §4.2) |

- **Why a mode and a setting.** The setting serves players who always want the colours (colour-vision deficiency, or habit). The
  mode serves a question asked now and then ("where are the hills?") without changing the default. The other modes keep
  `MODE_BASE`, frozen as approved.
- **Switching** cross-fades over 150 ms: the land texture swaps under the live layers, and nothing else re-bakes. Under reduced
  motion it is instant.
- **When each bake exists.** Both bakes share every CPU raster (N1). The Clear colour pass runs the first time it is needed:
  the setting at load, the Terrain mode, or `?terrain=clear`. In the game that is a GPU pass of milliseconds. In the mockup it is
  about 4 s of time-sliced CPU (detail 1.3 s, mean-neutral 0.9 s, colour and gamut 1.5 s, canvas 0.4 s), with "Preparing terrain
  colours…" on the mode button until it is ready. *(review)* The natural colour pass is lazy the same way: a profile with Clear
  set never pays for it unless it leaves Clear.

---

## 7. Hover names the terrain everywhere

| Surface | Rule |
|---|---|
| Province hover card (L1, docs/07) | the title line reads "Tormere · Forest": the name, then a **terrain chip**, a 12 px swatch in the terrain's Clear fill with the terrain's glyph inside it, and the word. This holds in every mode, fog state, zoom and look. *(review)* **The card's separate Terrain row goes**, so the terrain is said once (the owner's "It's not cluttered it's clean"). The title's value slot keeps the active mode's value, as docs/07 says ("the active mode's value first"); the draft put the terrain in that slot, which would have pushed out the mode's value and, in the mockup, "capital". "Capital" joins the chip's line after a middle dot. The region name stays dim on the name line. In the Terrain mode the value is the terrain, and the chip is not repeated |
| Province card (the left dock when a province is selected) | the heading's subtitle: "Forest · Cinder Horde" (or "Independent"), with the same swatch and glyph (ui-spec already names "terrain icon and word" in this header) |
| Army card | its location line names the province and the terrain: "in Tormere (forest)" |
| Link hover (feed, alerts, outliner, cards) | the province's hover look, its name on the land (map-relief §7) and the terrain in the name chip: "Tormere · forest" |
| Wilds | the wild card's value line already reads "Peaks · Impassable" or "Mere · Impassable"; unchanged |
| Touch | a long-press shows the same card (M3), with the terrain on the title line |
| Screen readers | each province's accessible name is "Tormere, forest, Cinder Horde" |
| Fog | terrain is public (docs/01 §14), so it is named in every fog state, unexplored included |
| Shift and the numbers layer | Shift held with nothing selected shows names and, in Natural, each name's swatch (a 10 px chip beside it): a full terrain read-out one key away. In the Terrain mode the numbers layer's chips are the terrain glyphs (§6) |

The glyph and the swatch carry the terrain by two channels: a shape and the colour-blind-safe Clear fill. A hover therefore
teaches the mapping that the Terrain mode and Clear use.

**New icons** *(review)*. docs/09's icon table has no terrain glyphs, and M1 acceptance criterion 14 asks for a distinct SVG for
every icon it lists. It gains seven 24 × 24 monoline glyphs, each one silhouette:

| Terrain | Glyph | Kept apart from |
|---|---|---|
| Plains | three grass tufts on a ground line | — |
| Farmland | three furrowed strips in perspective | the supply icon (a wheat ear): never a wheat ear |
| Forest | two conifers | — |
| Hills | two rounded humps | — |
| Mountains | one peak, no snow | the wild icon (three snow-capped peaks over cliff ticks): one peak, never snow |
| Swamp | reeds over two wavy water lines | the Mana springs mode icon (a drop) |
| Wasteland | a cracked ground line with a dead shrub | — |

The Terrain map mode gets an eighth: a square swatch with a leaf.

---

## 8. Ownership, the glow and fog on the natural ground

### 8.1 Rails: the band rule, analytic (`calc/rails.ts` → `calc/rails.out`; `review/calc/rails-*.ts`; the repo's colour math)

- **Grounds per terrain.** The natural bake's pixels within 0.12 D of a border at seven lightness quantiles (0.5% to 99.5%). Each
  is also half-blended with every other terrain's median, untinted and under the banner's glow at its 0.35 peak.
- **States.** Raw, the approved haze 4%, out of sight 10%, ash 10% and moss 6%, plus the natural fog of §8.3. *(review)* Plus the
  frontier hem, where rails run along the explored edge: Clear's 12% haze, the chosen natural hem (12% haze + 40% desaturation),
  and the draft's natural hem (20% + 25%), which the draft's check left out.
- **Banners.** All 11.

| Coverage | Fails: the draft's states (26,950 cases) | Fails: with the hems and the chosen fog *(review, 38,500)* | With the 8% Realm tint, alone and under the glow, chosen fog and hems *(review, 77,000)* | Worst luminance contrast |
|---|---|---|---|---|
| Solid | **0** | **0** | **0** | 3.87:1 |
| Keylines at 0.75 (the rest the banner or the ground, the worse), banner solid | **0** | **0** | **0** | 2.90:1 |
| Every line at 0.75 | 534: Radiance #F3E6B8 161, the pale duplicate #B5D69C 373 | 774 (the same two banners) | 1,604 (the same two, and #3186F2) | 2.90:1 |

**The fix:** below device pixel ratio 1.5 the rail is 1.5 + **2** + 1.5 CSS px (banner 2 px), so the banner line always has a
fully covered pixel. That is the "keylines 0.75, banner solid" row: 0 fails. The same model on the Clear grounds gives 5 and 281
fails, so it is stricter than map-relief §4.5's (2 of 48,510). It is the one used here for both looks.

**The wild contour** *(review)*: its 3 px ink or its light rim #E9E4D8 differs from every natural ground quantile at 20 / 12 in
every state, the hems included: 490 cases, 0 fails. The rim carries it: granite #2A292C against the natural forest median is
21.3 / 5.2 directly, which docs/09 allows ("directly or, by the band rule, through their light rim").

**On rendered pixels** (the verifier's method, `calc/lines.ts`), the rails show **0 failures in every view**: Natural at the start,
Mid, two Near views and month 40 at ratio 1, and the start and Near at ratio 2. The worst contrast is 3.06 to 3.61:1 at ratio 1
(3.84 to 8.73 at ratio 2). The Clear figures are the same: 0 failures, worst 2.92 to 3.39:1. *(review)* Re-measured with the
chosen fog and the continuous lines of §8.2: 0 failures in every view of both looks (`review/lines/*-fixed6-*`).

### 8.2 Neutral hairlines and internal keylines: continuous, from the ground under them (both looks)

The v4 rule keyed both lines to the province's Clear albedo: `RL_HAIRA[terrain]` and `keylineFor(albedo)`. Natural grounds break
that key (§10, defect 1), and even in Clear the shaded ground under a line is not the albedo.

**The draft's per-segment rule, and why it changed** *(review)*. The draft chose a keyline, light or dark, for each 0.1 D segment
on its own. On the rendered map that flips the keyline along 13 to 14 of the 73 natural neutral edges (13 of them two or more
times) and 30 of 73 in Clear (14 of them two or more times; `review/tools/lines3.cjs`, `count6.cjs`). The result is a light line
with dark dashes, 8 px long at the start zoom and 17 px at Mid (`review/renders/cmp-fog-lines.png`, top). docs/07 gives a dotted border one meaning, fog, so a dashed hairline reads as
fogged land, and it is noise. The draft's two-tone fallback also drew the dark line on one fixed side and the light line on the
other, whatever the ground: where the dark ground lay on the dark line's side, both lines sat on grounds like their own. The
prototype's sampler used an unflipped edge normal, so "its own side" was the wrong side on about half the edges, and its style
cache ignored the band and the fog.

**The rule:**

- **Segments and grounds.** Each shared edge is cut into segments of at most 0.1 D. For each, the bake's texels along it are
  sampled at the current band's mip, on each side separately (0 to 3 screen px; sides by the lower-right normal that
  `rlDrawRails` uses), **in each province's current fog state**: an unexplored side is sampled at the hem's peak haze.
- **The anchor.** Each edge keeps **one keyline (light #F4EEDF or dark #1C1A17) along its whole length**: the one that reaches the
  target on the most segments (ties: the lower mean alpha). Per segment, the hairline's alpha is the smallest that brings the
  antialiased pixel (coverage 0.75) to **2.45:1 against both the p10 and the p90** of the ground on both sides, capped at 0.92.
  It is then raised to the larger of its neighbours' (a running maximum over ±1 segment), so it never dips for one segment.
- **The partner.** Where the anchor cannot reach the target against one side (dark canopy on one side, light dust on the other),
  a 1.5 px line of the other keyline at 0.8 runs beside the anchor **on that side**, so each tone lies against the ground it
  contrasts with. The anchor never changes colour; the partner comes and goes. In Natural, 14 of 507 hairline segments take a
  partner, and 72 of the 73 anchors are light (the references' unowned lines are pale too). In Clear, 79 of 507.
- **Internal keylines** take the same anchor and partner, sampled on their own (lower-right) side only, at **3.3:1 at coverage
  1**. They are **2.5 CSS px below ratio 1.5**: a 2 px line leaves no fully covered pixel on a 45° edge, where it needs about
  √2 + 0.7 px. The partner sits beyond the keyline, and the banner half stays 1.5 px. 5 of 196 internal segments take a partner
  in Natural, 41 in Clear.
- **Cache.** The styles are computed per map, look, band and fog version (about 1,400 segments). An edge is re-solved only when
  one of its provinces changes visibility. Rails, hairlines and water stay 2 to 3 draws: one mesh with vertex colours in Pixi,
  and alpha buckets in the canvas mockup.

**Rendered pixels** *(review; the verifier's dump and `calc/lines.ts`; `review/lines/*-fixed6-*-report.json`; Natural with the
fog of §8.3 on)*:

| View | Natural hairline: min / median / under 2.3:1 | Natural internal keyline: min / under 3.2:1 | Clear hairline: min / median / under 2.3:1 | Clear internal keyline: min / under 3.2:1 |
|---|---|---|---|---|
| Start, ratio 1 | 2.39 / 3.38 / **0 of 150** | 3.48 / **0 of 60** | 2.42 / 3.31 / **0 of 150** | 2.63 / 3 of 60 |
| Mid (175 px) | 2.44 / 3.52 / **0 of 61** | 3.22 / **0 of 60** | 2.40 / 3.44 / **0 of 61** | 2.75 / 4 of 60 |
| Near (two views) | 2.91 to 2.96 / 2.95 to 4.05 / 0 | 3.41 to 3.84 / 0 | 2.94 to 3.93 / 2.98 to 4.35 / 0 | 2.77 to 2.90 / 1 to 3 of 25 to 27 |
| Start, ratio 2 | 2.70 / 3.75 / 0 | 3.16 / 1 of 60 | 2.77 / 3.53 / 0 | 2.72 / 2 of 60 |
| Near, ratio 2 | 2.80 / 2.96 / 0 | 3.80 / 0 | 2.86 / 3.06 / 0 | 2.55 / 3 of 27 |

- **Against the draft's rule on the same pixels:** Natural hairlines had a minimum of 1.44:1 (1 of 150 under 2.3) at the start,
  and Clear 1.66:1 (3 of 150). With the draft's fog on, its internal keyline fell to 2.97:1 at a frontier edge, because it was
  solved against the unfogged bake. With the chosen fog and the fogged-ground solve, the start view's minimum is 3.38:1.
- **Clear's internal keyline stays open.** The draft expected own-side sampling to close it. Measured, own-side sampling alone
  leaves 1.21 to 2.13:1 at worst in five of the six views, with 3 to 6 samples under 3.2 in each (`review/lines/clear-fixed5-*`). The anchor, the 2.5 px
  width and the partner raise the minimum to 2.55 to 2.90:1 and leave 1 to 4 of 25 to 60 samples under 3.2. Those sit on the
  warp fringe, where the lower-right province shows its neighbour's albedo for up to 0.1 D. Natural passes (3.16:1 at worst, one
  sample at ratio 2). The page's check (§13) holds 3.2:1 in both looks. **Fallback, if Clear still misses in the build:** Clear's
  internal border becomes the full lit bead (both keylines around the banner), which passes the band rule on every ground (§8.1).
- **Rails and hairlines by structure** *(review)*. In Natural nearly every neutral hairline is light, and the Radiance banner
  #F3E6B8 is 9.6 / 6.4 from the light keyline (the pale duplicate #B5D69C 18.8 / 12.2;
  `review/calc/banner-vs-hairline.ts`). Such a realm edge is told from an unowned border by structure: a rail is a 5 px lit
  bead with a dark outer keyline, inset on the owned side, with the glow fading inward. A hairline is 1.5 px, and 3 px on the
  2.8% of segments that carry a partner. No colour minimum is broken, because banners are tested against grounds, not against
  lines. The layout check (§13) adds: no hairline segment is wider than 3 px.

### 8.3 Fog

| State | Natural | Clear and the Terrain mode |
|---|---|---|
| Unexplored | the 4% gesso haze becomes **6% haze plus 40% desaturation**. The hem peaks at **12%** haze (the approved peak) and falls to the interior over 0.05 D | approved: 4% haze, the hem to 12% |
| Explored, out of sight | **25% desaturation** | approved: 10% |
| What each state shows | unchanged (docs/07, docs/01 §14) | unchanged |

**Why.** The 4% and 10% caps were "the strongest haze the rule allows" (map-relief §4.2). That rule no longer binds Natural, and the
critique and design risk 5 both found the frontier all but invisible. The draft raised the haze to 10%. The review measured what
that costs the value code that Natural's terrain rests on (§5.5), and moved the visibility into desaturation, which leaves L\*
alone.

**Measured** *(review, `review/fog-sweep.json`)*: ΔE is the mean of each terrain's p10, p50 and p90 core grounds; the reader is the
lightness-only reader of §5, trained on in-sight land and tested on the other fold under the fog.

| Natural unexplored | ΔE from in sight | ΔE from out of sight (25%) | Reader: patch / province at Far; start; Mid |
|---|---|---|---|
| 4% haze (approved), no desaturation | 1.5 to 2.2 | 2.3 to 3.6 | 0.924 / 0.98; 0.968 / 1.00; 0.978 / 1.00 |
| 4% haze + 40% desaturation | 3.0 to 6.4 | 2.2 to 3.3 | 0.927 / 0.98; 0.969 / 1.00; 0.980 / 1.00 |
| **6% haze + 40% desaturation (chosen)** | **3.8 to 6.8** | **2.9 to 4.2** | **0.900 / 0.97; 0.962 / 1.00; 0.969 / 1.00** |
| 8% haze + 25% desaturation | 4.1 to 5.7 | 2.9 to 4.5 | 0.851 / 0.92; 0.942 / 1.00; 0.953 / 1.00 |
| 10% haze + 25% desaturation (the draft) | 4.7 to 6.7 | 3.6 to 5.7 | 0.754 / 0.78; 0.898 / 0.97; 0.917 / 0.98 |

- The chosen fog is twice as visible as the approved one at its weakest (3.8 against 1.6 to 2.2). It keeps every province at the
  start and Mid zooms, and 97 to 98% at Far, on both maps (§5.5).
- Natural out of sight against in sight: 1.5 to 3.3 (the draft's figure; desaturation only).
- In Natural an unexplored province takes the haze and the desaturation together. That departs from map-relief's "one state at a
  time", which exists for the palette test's pairs; Natural has none (N2).
- The rails pass the band rule in both natural states and on the hem (§8.1). The line styles are solved against the fogged
  ground (§8.2).
- Not re-shot: the sheets in `proto/renders/` show the draft's 10% haze (`after-fog.png`). The review's
  `review/renders/natural-fixed6-fog.png` shows the chosen values.

### 8.4 The glow, hover, selection and the Realm tint

- **Glow, hover, selection.** Unchanged: the glow is 0.35 at most, gone at 0.05 D; hover is 0.25, selection 0.30, with the inner
  line. The glow is among the rail grounds above.
- **Independents' hover and selection in Natural** *(review)*. v4 pulls an independent province toward its Clear albedo's keyline
  (`RL_KEYFOR[terrain]`, 0.20 and 0.25). In Natural that keyline is chosen from the province's natural core mean
  (`keylineFor` of it). That gives light for every natural terrain but wasteland (core L\* 53: dark). Keyed to Clear, a natural
  plains province (core L\* 43) would be pulled toward the dark keyline meant for Clear's lighter plains (L\* 54), the weaker pull.
- **The Realm tint option** (8%, off by default) no longer costs terrain pairs in Natural: there are none to keep. It keeps its
  setting text for Clear only. The rails pass the band rule with it, alone and under the glow (§8.1, *review*).
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
| 1 | Neutral hairlines under their floor on rendered pixels (start: median 2.44, 60 of 150 under 2.3) | one keyline per edge with its alpha from the ground under it, a partner line on the side the keyline cannot serve, solved against the fogged ground, in both looks (§8.2; *review*: the draft's per-segment choice dashed the lines) | *(review)* 0 under 2.3:1 in every view of both looks: Natural start 2.39 at worst (median 3.38), Clear 2.42 (3.31). The draft's rule left 1 and 3 at the start and flipped keyline along 13 and 30 of 73 edges |
| 2 | Passable mountains near the snow colour (Clear: 5.9 to 9.2% of mountain pixels within 20 / 12; brightest L\* 84.6) | **Natural:** rock never comes near: every passable pixel is ≥ 23.3 / 22.6 from snow (mountains ≥ 26.2 / 25.8, brightest L\* 58.3; every natural material ≥ 26.5 / 25.9, *review*). **Clear:** clamp each texel's total change (relief + detail + micro-relief) to [−A_t, +0.6 A_t] before the mean-neutral pass, which restores the means as now | Clear mountains, raw: 8.8% → **0%** within 20 / 12 (minimum 22.0 / 21.0; L\* max 73.9); under the haze: 15.1% → 0%; farmland 0.01% → 0% |
| 3 | Hamlet muting overshoot (muted against the flat albedo) | *(review)* The draft muted against the darker decile of a 0.09 D disc under the seat and still overshot (Natural Mid 2.58 against the 2.5 check; Near 3.9 to 4.5 against 4), because a tenth of the ground under the houses is darker than that decile. **Each house tone (walls, roof, lit end, ridge, windows) is muted against the darkest texel under that house's own footprint (+1 px)**, aiming at 2.3:1 at Mid and 3.6:1 at Near; the check is p95 per seat ≤ 2.5 and ≤ 4. The muted tones are cached per seat, look and band | not measured by the review; `reliefSeats()` (§13) decides in the build. Fallback: hamlets at Mid draw at 85% scale |
| 4 | A hovered name drawn over a transit day chip | live names (hover, link) avoid every arrow and path chip: the label tries six spots (its own; below; above the seat; right; left; lower), and if none is free the chip is drawn again on top, since the number is the decision. The layout check adds hover names against chips | every province hovered at the start, Mid and with a path planned: **1 overlap (Tormere on Ilsa's "4d") → 0**; 1 label moved (`renders/hovercheck.json`) |
| 5 | The cliff face reads as vertical stripes | a strata-led face: horizontal strata 6 to 13 units deep with their own value (±3.5 L\*), a lit ledge on each top and a shadow below, gentle bends and fault steps every 80 to 200 units, short joints inside one stratum only (18 to 48 units apart, irregular), low-frequency weathering. No full-height facets. The colours are the approved #3A3436 to #221E20 with the plinth and plaque | stripe index (vertical-edge energy share) **0.568 → 0.141**; light streak columns **15.4 → 0 per 100 px** (`renders/cliff-before-after.png`; a numpy strip, not drawn in the page) |
| 6 | Windows of 1280 × 720 and smaller start at Far | the start view is at least 96 px a province: s0 = max(the fit, 96 / D), centred on the capital and clamped so the view stays on the model (or centred on it where the model is the smaller). Z returns to it; leaning back still shows the whole model | as built: 55 to 63 px at 1024 × 768, 1280 × 720 and 1366 × 768 (Far). With the rule: **96 px, Mid**, capital on screen, at every size; 114 px at 1920 × 1080 (unchanged); phone 96 px (`renders/startzoom.json`, `startrule-*.png`) |
| 7 | The internal keyline under its floor on swamp (median 2.89) | as #1, on its own side only, 2.5 CSS px below ratio 1.5, with the anchor and partner (§8.2) | *(review)* Natural: 3.16 to 3.84:1 at worst by view (swamp 3.99 at worst). Clear swamp: 2.70 to 3.20 at worst by view, from 2.67 to 3.30 with the draft's rule (the ratio-2 Near view is unchanged at 2.70). **Clear's internal keyline elsewhere stays open**: 2.55 to 2.90:1 at worst, 1 to 4 samples per view under 3.2 (the draft's own-side sampling alone: 1.21 to 2.13, 3 to 6). Fallback: the full lit bead in Clear (§8.2) |
| 8 | `p61-relief-pieces.js` at 543 lines | split by job (§13): `p61-relief-pieces.js` (layout, slots, the seat ground), `p62-relief-figures.js` (bases, figures, towns, hamlets, huts, events), `p63-relief-labels.js` (labels, live names, chips, the path thread, arrows). `p58-relief-bake.js` (501 lines) splits too: noise and helpers, the shared rasters, the Clear colour, and the new natural pass. *(review)* `p60-draw.js` (458 lines) holds `fitScale`, which defect 6 changes: the camera and start-view code moves to a new `p60a-camera.js`. The natural pass is two parts (`p58n-covers.js`, `p58m-materials.js`) if the port passes 400 lines. `p61a-figlib.js` (669) is a verbatim copy of the battle's figure library and stays one file, as its header says. Each part the build touches is under 400 lines | — |

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
- *(review)* These on-screen figures were shot with the draft's lines and fog. The continuous lines (§8.2) keep the same widths,
  remove the dashes and add a partner on 3% of natural hairline segments; the chosen fog is lighter than the draft's. Not
  re-measured.

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
| Look-specific | detail, mean-neutral, colour, canvas: 4.0 s | the cover blend at half resolution, 8-bit planes: **0.24 s** *(review bench; the draft's 0.3 s was given for full resolution, which measured 1.5 s and 70 MB in Float32)*; the covers and materials **0.8 to 1.05 s** (the draft's `tools/bench.cjs`, re-run); the per-texel Lab blend of seven grounds and Lab to sRGB **0.66 s** *(review bench; the draft estimated 0.6 s)*; canvas and mips 0.4 s: about **2.1 to 2.4 s** | + the Clear pass 4.0 s, once, when first needed |
| Total CPU | 5.6 s | **about 4.6 to 4.9 s** | 8.6 to 8.9 s over the session |

**In the game (map-relief §10)** *(review, N11)*. The covers and the materials are GPU passes, tiled like the Clear composite,
from the same seeded value tables. Nothing new runs on the CPU at load, so a phone's first load (estimated at 3 to 5 s in
map-relief §10.4) is unchanged. The CPU reference of the cover raster (`src/present/map/`, half resolution) runs only in the Node
tests, the CPU fallback and the browser smoke. For scale: the cover classes alone take 0.5 to 0.6 s in V8 at 2048 × 1280
(`review/tools/bench-cover.cjs`), which a phone would pay 3 to 5 times over at every first load. That is why they are not a
run-time CPU raster. The draft's "the cover raster joins the cached CPU rasters" is withdrawn.

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
  used. That is up to 26 MB more than v4's 57 MB of canvases. The cover blend's CPU planes are 4.4 MB in 8 bits at half
  resolution, transient *(review)*.
- **Per frame: unchanged.** One composite draw samples whichever bake is current. The rails, hairlines and water keep their 2 to
  3 draws (the segment styles, partners included, are vertex colours). Map draws stay at most 12.
- **Phones:** one bake at a time. Switching to Clear re-runs the GPU colour pass (milliseconds) and frees the other. The natural
  pass adds one tiled GPU pass at load and no CPU work. Map detail Reduced (map-relief §10.4) keeps every cover, because the
  covers are the terrain's identity in Natural. Reduced drops only the Near crowns and cast shadows, as before.

---

## 13. Build notes for the mockup (the next workflow step)

- **The natural pass,** `p58n-covers.js` and `p58m-materials.js` (one part if the port fits in 400 lines).
  - `rlNaturalGen(out)` takes the shared rasters (S1 to S5, the water) and writes `out.natImg`, `out.natMip1`, `out.natMip2`,
    `out.cover` and `out.natTimes`.
  - It reuses the S3 height weights as the ground blend. It makes the cover blend (σ 0.04 D) **at half resolution in 8-bit
    planes**, then the covers and materials of §3 and §4 per texel, with the parameters in one `RL_NAT` object (docs/09-balance
    rows).
  - The field frames turn by exact constants and a small-rotation jitter (N8). No `Math.cos`, `Math.sin` or other transcendental
    enters the cover; sines may shape colour-only terms.
  - The numpy prototype `proto/natural.py` is the reference for every constant. Its outputs are under `proto/data/`.
- **Looks.** `view.terrain = 'natural' | 'clear'`; `?terrain=clear`; a "Terrain colours" control in the mockup's settings
  under Accessibility, beside "high-contrast borders".
  - `rlRenderStatic` blits `RB.natCanvas` or `RB.canvas` by look and mode. Each colour pass runs lazily, the first time its look
    is shown.
  - The wash keeps per-look unwashed copies.
  - Fog values come from `RL_P.fog[look]`. Natural: `haze 0.06`, `unexSat 0.40`, `outSat 0.25`, `hemPeak 0.12`; the unexplored
    province takes the haze and then the desaturation. Clear: the approved values.
  - Natural water is #14615B; Clear water stays #50AF9B.
- **The Terrain mode.** Add `['terrain', 'terrain', 'Terrain', 'The colour-blind-safe terrain colours.']` to `MODES`, with
  Shift+7 (no F7).
  - The mode raster is the Clear bake as baked; water stays; settlements, motifs and scars fade as in other modes; the hover
    line only; a legend with "Use these colours everywhere"; the numbers layer shows terrain glyphs.
  - It makes the Clear bake lazily (time-sliced), showing "Preparing terrain colours…" until it is ready.
- **Hover naming.**
  - `provTip`: the title is `${p.name}` followed by the terrain chip (swatch, glyph, word); "capital" joins it after a middle
    dot; the `value` slot keeps what it holds; **the Terrain row is removed**.
  - The dock heading subtitle and the army card's location line.
  - The link chip text, and the aria-label.
  - Seven terrain glyphs and the mode icon in `p10a-icons.js`.
- **Lines.** Replace `RL_HAIRA` and the albedo-keyed `keylineFor` in `rlDrawRails` with `rlSegStyles(edge, kind)`: the anchor,
  the running-maximum alpha and the partner for hairlines; the anchor and partner on the lower-right side for internal
  keylines, 2.5 px below ratio 1.5. Sides by the same lower-right normal `rlDrawRails` uses. Grounds sampled in the provinces'
  fog states. Cached per map, look, band and fog version. `review/tools/patches6.js` is the reference prototype (the draft's
  `tools/patches.js` is superseded). The rail banner is 2 px below ratio 1.5.
- **Independents' hover.** `rlTintOf` takes the keyline of the province's natural core mean in Natural, `RL_KEYFOR` in Clear.
- **Seats.** `rlSeatGround` is replaced by a per-house ground: the darkest bake texel under each house's footprint (+1 px) in the
  current look. `rlMuted` aims at 2.3 / 3.6, and every house tone passes through it. Cached per seat, look and band.
- **Labels.** `rlArrow` records its chip box; `rlLiveLabels` tries six spots and redraws the chip on top if none is free.
- **Snow.** In S6, clamp `DL` to [−A_t, +0.6 A_t] after detail and micro-relief, before S7.
- **Cliff.** `rlRim` draws strata, ledges, faults and short joints as in `proto/cliff.py`, and drops the full-height lit facets.
- **Start view.** `fitScale` stays the lean-back fit. A new `startScale = max(fitScale, 96 / MED_DIAM)` is centred on the
  capital and clamped to `MODEL_BOX`. Z and the start use it. The camera code moves to `p60a-camera.js`.
- **The split** of `p61`, `p58` and `p60` is §10 defect 8. `build.sh` lists the parts in order: p58a, p58b, p58c, p58n, p58m,
  p59, p60, p60a, p61a, p61, p62, p63.
- **New checks in `window.__mock`:**
  - `reliefNatural()`: chroma over 0.10 is 0, the own cover per province (N4), and the readers' features on the rendered canvas
    at the current zoom (a nearest-centroid reader with centroids from `proto/renders/classify.json`). Province accuracy at least
    0.95 and patch accuracy at least 0.9 at Mid, in sight and on unexplored land.
  - `reliefLines()`: per segment, hairline ≥ 2.3:1 and internal ≥ 3.2:1 on rendered pixels, against the same pixel without
    lines, the partner's pixels counted; no edge changes keyline along its length; no hairline wider than 3 px.
  - `reliefSeats()`: hamlet light pixels' p95 ≤ the limit per seat.
  - `reliefHoverChips()`: no hover name over a chip.
- **Which checks run where.** In Natural, `reliefMeans()` reports "not applicable (Natural)" and the readability check stands in.
  In Clear and the Terrain mode it runs unchanged.

---

## 14. Tests (repo, when the map is built)

| Test | Checks |
|---|---|
| `tests/content/palette.test.ts` | unchanged for the Clear albedos and every v4 colour check (now titled "Clear and the Terrain mode"). New: the natural materials have OKLCH C ≤ 0.10. The lit-bead rail passes the band rule on the natural grounds (seven quantiles, half-blends, glow, every approved state, the natural fog **and its hem**, the Realm tint option, all 11 banners) solid and with keylines at 0.75 and the banner solid. **The wild contour (ink or rim) differs from every natural ground in every state.** The natural fog moves every terrain's ground by ΔE ≥ 3.5 (unexplored) and ≥ 1.5 (out of sight). No natural material or relief extreme is within 20 / 12 of snow. **Natural water is ≥ 20 / 12 from every ground of the four terrains that hold lakes** |
| `tests/present/map/terrainCover.test.ts` (extended) | N4 on Small, Medium and Large, 2 and 4 nations, seeds 1 to 5: the whole province ≥ 0.70 own (copses as forest); the core (0.15 D) ≥ 0.95 own (copses as their own); copses ≤ 25% of any core; the CPU cover raster is a pure function of map and seed. **A source scan finds no `Math.cos`, `Math.sin`, `Math.exp`, `Math.log`, `Math.pow` or `Math.atan2` in the cover module**, as the determinism test does for `Math.random` |
| `tests/present/map/readability.test.ts` (new) | the CPU reference of the natural bake at 512 px on **two maps of different geometry** (two mapgen seeds). The lightness-only reader trained on one map and tested on the other at D_px 85 and 200: province accuracy ≥ 0.95 and patch accuracy ≥ 0.90; texture-only ≥ 0.80. **The same reader, trained in sight, tested on the unexplored state (6% + 40%) at D_px 85: province ≥ 0.95 and patch ≥ 0.90** |
| `tests/present/map/lines.test.ts` (new) | the anchored solve: one keyline per edge (no flips); every hairline segment reaches 2.45:1 at coverage 0.75, with its partner where drawn; the partner lies on the side its anchor fails; internal keylines reach 3.3:1 at coverage 1; grounds are taken in the fog state |
| `tests/ui/derive/mapLabels.test.ts` (changed) | hover and link names never overlap a day chip; the start scale is at least 96 px a province at 1024 × 768, 1280 × 720, 1366 × 768 and 1440 × 900 |
| The key-table test (changed) | Shift+7 picks the Terrain mode; F7 stays unbound |
| The icon test (M1 criterion 14, changed) | the seven terrain glyphs and the Terrain mode icon are distinct SVGs |
| Browser smoke (Playwright, `src/render/**`) | Natural and Clear bakes from one CPU cache; the switch and the Terrain mode re-bake nothing that is shared; **the GPU covers match the CPU reference on ≥ 99.9% of texels**; the rendered-pixel rail, hairline, keyline and seat checks; the frame budget; GPU memory ≤ 96 MB with both bakes |

---

## 15. What changes in the docs (drafts; nothing is applied)

**`docs/09-art-direction.md`.**

- *Distinct colors*: "Every pair of terrain fills …" becomes "In the Terrain map mode and with Clear terrain colours, every pair
  of terrain fills …". The mana primaries and the wild grounds against the Clear fills are unchanged.
- Add: "The default map view is a natural landscape (docs/design/natural-view). There, terrain is read from the drawing, named on
  every hover and shown in the Terrain mode. The banner, band, keyline, hairline, contour and snow minimums apply in every view."
- *Map states*: the natural fog values beside the approved ones, which stay for Clear: unexplored 6% haze and 40% desaturation,
  out of sight 25% desaturation, the hem to 12%.
- *Terrain paragraph*: the Clear albedos stay as the fills. Add the natural materials as a table with "presentation; not bound by
  the distinct-colors rule".
- *H1 (hue within a terrain)*: "in Clear and the Terrain mode".
- *Icons* *(review)*: the Map modes row gains "terrain (a swatch with a leaf)"; a new row "Terrain" lists the seven glyphs of §7.

**`docs/07-ui.md`.**

- Modes: seven, with Terrain; "Shift+1 to Shift+7 (F1 to F6 best effort; F7 is never bound)".
- Settings → **Accessibility** gains "Terrain colours: Natural or Clear" *(review: there is no Map tab)*; Display options lists it.
- The province tooltip: "the active mode's value first; the name with the terrain (swatch, glyph and word); the owner; …". The
  separate terrain row goes. The province card's heading gains the terrain.
- Link chips name the terrain.
- The start view's minimum scale is 96 px a province, centred on the capital ("The table and the camera").
- Fog: in the natural view the unexplored land is hazed and desaturated, and out-of-sight land desaturated (the values above).

**`docs/09-balance.md` "Map presentation"** gains rows dated at adoption:

- the natural materials (§2.2) and water #14615B;
- σ_g 0.12 D and σ_c 0.04 D (the cover blend at half resolution);
- the canopy edge (0.07 D, 0.42 at 10 units, threshold 0.52);
- glades (0.85, −0.62 at 9 units) and copses (0.80 at 15 units, plains and hills, ≤ 25% of a core);
- the field strips (8.5 ± 2.5 deep, 13 to 32 long, 0.6 / 0.4 / 0.36 weights, hedges 0.4 units, 45% of row seams; frames 0°, 90°,
  ±30° with ±3.4° jitter);
- the presence ramp (0.35 to 0.65);
- the natural relief caps (6 / 4 / 7 / 13 / 18 / 3 / 8) and the canopy damping and shadow (0.7; 9 L\* at 1.2 units);
- natural fog (unexplored 6% haze + 40% desaturation; out of sight 25%; hem 12%);
- the line rules (segments 0.1 D; one keyline per edge; hairline 2.45:1 at coverage 0.75 against p10 and p90, alpha cap 0.92,
  running maximum over ±1 segment; partner 1.5 px at 0.8 on the failing side; internal 3.3:1 at coverage 1, 2.5 px below ratio
  1.5; rail banner 2 px below ratio 1.5; grounds in the fog state);
- seat muting (per house, darkest texel under the footprint +1 px, 2.3 / 3.6);
- the readability floors (province 0.95, patch 0.90 across maps and on unexplored land);
- the snow clamp; the start scale (96 px); the cliff strata.

The v4 rows for `RL_HAIRA` and "hamlets muted against the albedo" are marked superseded.

**`docs/design/map-relief.md`:** a pointer to this design under "Status", and its §4.2 sentence "unchanged in code" gains "in the
Terrain mode and Clear".

---

## 16. Owner questions (defaults in bold; the build follows the defaults)

1. **The Realm tint in Natural:** **off by default, as your answer names rails and glow**; or on at 8% in Natural only, as the
   references show. In Natural it no longer costs terrain pairs, and the rails keep the band rule with it (77,000 cases, 0 fails).
2. **Fog in Natural:** **unexplored 6% haze plus 40% desaturation, out of sight 25%**: twice as visible as today's at its weakest,
   and terrain still reads on unexplored land. Or the stronger 10% haze, about 1 ΔE more visible, at the cost of terrain read
   from value: up to a fifth of unexplored provinces misread at Far by a reader who learned explored land. Or today's 4% and 10%
   everywhere.

The draft's third question, hiding the lines between unowned provinces at Far and Mid, is withdrawn *(review)*. The hairline
floor is one of the minimums your answer keeps in every view, and on a landscape that blends across borders, hidden lines would
leave unowned provinces with no visible edge.

---

## 17. Risks and what was not verified

1. **The prototype is numpy, not the page's code.** The natural bake was injected into the mockup in memory. The JS port must
   reproduce `proto/natural.py`, and the build's readability check is the guard. The seeds, tables and sizes are given. The
   noise tables differ between numpy and the page, so the statistics carry over, not the pixels.
2. **The readers are a model of a reader, not a playtest.**
   - A linear discriminant on 13 lightness features is a floor for what a human sees: people also use context, shape and the
     hover card.
   - *(review)* It now holds across two map geometries and under every map state, with the corrected fog. Both maps are the
     mockup's jittered grid; mapgen maps are tested for N4 only, and the repo's readability test (§14) uses two mapgen seeds.
   - Plains against hills is the weakest pair (texture-only 0.85 at the start zoom). Under the draft's fog, farmland and hills fell
     to 0.60 to 0.62 per patch at Far.
3. **Busyness on screen is still about twice ref-2's at 6 px** (22.9% against 11.8%). The land itself is calm. The lines at their
   floor, the labels and the hamlets make the rest. These figures were shot with the draft's lines; the continuous lines have the
   same widths, remove the dashes and add a partner on 3% of natural hairline segments (not re-measured).
4. **Open in the build** *(review)*: Clear's internal keyline (1 to 4 samples per view under 3.2:1, fallback the full lit bead);
   hamlets at Mid and Near (the per-house muting is not prototyped, fallback 85% scale at Mid).
5. **Rails and hairlines by structure** *(review)*. In Natural nearly every neutral hairline is light, close to the Radiance banner
   (9.6 / 6.4) and the pale duplicate (18.8 / 12.2). Their realm edges are told from unowned borders by the rail's width, dark
   outer keyline, inset and glow, not by colour. No rule is broken; worth the owner's eye on a Radiance game.
6. **The cliff face, the hover chips and the start view** were measured on the mockup or a numpy strip. The cliff strata were not
   drawn in the page.
7. **Timings are on a shared machine** with software rendering: the benches and the bake step times are noisy, and the GPU
   estimates are estimates. The review's benches are partial models of the pass (`review/tools/bench-*.cjs`).
8. **Not run:** the repo's tests, a phone, a GPU, and the owner's eye. The sheets in `proto/renders/` show the draft's fog and
   lines; `review/renders/*-fixed6-*.png` show the corrected ones.

---

## Appendix: files (under `visual-v4/natural/`)

- `design.md`: the draft. `design-final.md`: this file.
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
- `review/` *(the review's)*:
  - `calc/`: the repo's colour math (verbatim), `rails-hem.ts`, `rails-fog2.ts` (+ `TINT=1`), `water-snow.ts`,
    `banner-vs-hairline.ts`, `lines3.ts`, and their `.out`;
  - `py/`: `classify_states.py`, `fog_sweep.py`, `xgeo_feats.py`, `xgeo_eval.py`; outputs `classify-states.out`,
    `fog-sweep.json`, `xgeo-12.npz`, `xgeo-31.npz`, `xgeo-12to31.out`, `xgeo-31to12.out`;
  - `variant/`: `seed31.html` (the mockup with `MAP_SEED = 31`, built here only) and `data31/` (its rasters and natural bake);
    `proto2/` (the prototype with a configurable data folder);
  - `tools/`: `patches3.js` to `patches6.js` (the line rule, step by step; `patches6.js` is the reference), `lines3.cjs` to
    `lines6.cjs`, `count6.cjs`, `dbg-int.cjs`, `export2.cjs`, `bench-core.cjs`, `bench-cover.cjs`;
  - `lines/`: rendered-pixel dumps and reports, `*-fixed3-*` to `*-fixed6-*`;
  - `renders/`: `*-fixed3-*` to `*-fixed6-*` shots, `cmp-fog-lines.png` (draft against continuous lines),
    `natural-fixed6-fog-crop.png` (the chosen fog).

---

## What the review changed, and why

Each item: what was wrong or unproven in the draft, what changed, and the measurement.

1. **Hairlines dashed.** The draft chose the keyline per 0.1 D segment, so it flipped along 13 of 73 natural edges and 30 of 73
   in Clear (13 and 14 of them two or more times): light lines with dark dashes, and dashes mean fog in docs/07. **Now** one
   keyline per edge, with a running-maximum alpha and a partner line where needed (N10, §8.2). Rendered: 0 hairline samples under
   2.3:1 in every view of both looks (the draft's rule: 1 and 3 at the start), no flips.
2. **The two-tone fallback ignored the ground.** It always put dark on one side and light on the other, and the prototype's
   sampler used an unflipped normal. **Now** the partner goes on the side the anchor fails, by the same normal the rails use.
3. **Line styles ignored fog.** With the draft's fog on, its internal keyline fell to 2.97:1 at a frontier edge. **Now** grounds
   are sampled in the fog state and the cache carries a fog version: with the chosen fog the start view's minimum is 3.38:1.
4. **Clear's internal keyline was claimed closed by own-side sampling.** Measured, it was not: 1.21 to 2.13:1 at worst. **Now** it
   is anchored, 2.5 px below ratio 1.5, with a partner: 2.55 to 2.90:1 at worst. Still open, with the lit-bead fallback stated.
5. **The natural fog broke the value code.** The draft's 10% haze lifted dark terrains by up to 8 L\*. A reader that learned
   explored land misread 22% of unexplored provinces at Far on this map, and 12 to 22% across maps. **Now** 6% haze plus 40%
   desaturation (hem 12%): 97 to 98% at Far and 100% from the start zoom on both maps, at 3.8 to 6.8 ΔE of visibility.
6. **Readability was tested on one map.** **Now** across two geometries in both directions: provinces 98 to 100% at every
   zoom. The test floor becomes 0.95 per province (one province in 60 can miss), on two maps and on unexplored land.
7. **The rails check left out the frontier hem** and the Realm tint option. **Now** both are in: 38,500 and 77,000 cases, 0 fails
   at the design coverage.
8. **The wild contour was claimed but not reported.** It passes by its rim on every natural ground in every state (490 cases),
   while granite against natural forest is 21.3 / 5.2 directly.
9. **Determinism.** The prototype's field frames used cos and sin in the cover raster, which N8 rules out. **Now** exact constants
   and a small-rotation jitter, with a source-scan test.
10. **Phone cost.** The draft kept the cover raster on the CPU at run time and costed a full-resolution blend at 0.3 s (measured
    1.5 s and 70 MB). **Now** the covers are a GPU pass in the game (N11), with no new CPU work at load. The CPU reference is used
    only by tests, the fallback and the smoke. The mockup blends at half resolution (0.24 s), and its total is re-stated as 4.6 to
    4.9 s.
11. **The hover card.** The draft put the terrain in the title's value slot, which docs/07 gives to the active mode's value and
    the mockup to "capital", and kept the Terrain row as well. **Now** the terrain chip follows the name, and the row goes.
12. **Missing icons.** The swatch "with the terrain's glyph" pointed at docs/09 terrain icons that do not exist. **Now** seven
    glyphs and a mode icon are specified, kept apart from supply's wheat and the wild's snowy peaks, with the icon test.
13. **The setting's place and the key.** docs/07's settings have no Map tab: Terrain colours goes under Accessibility. Shift+7
    only, because F7 is caret browsing in Chrome and Firefox.
14. **The Terrain mode contradicted itself.** "The Clear bake with ground detail faded" cannot be drawn, because the detail is
    baked, and docs/07 asks every mode for a second channel. **Now** the bake shows as baked, water stays, and the numbers layer
    shows terrain glyphs.
15. **Independents' hover** used the Clear albedo's keyline on natural ground; now it uses the natural core's.
16. **Hamlet muting** was claimed fixed but still overshot at Mid (2.58 against 2.5). **Now** each house is muted against the
    darkest texel under it, left for the build to verify.
17. **Owner question 3 withdrawn**, because hiding lines would break a minimum that the owner's answer keeps. Question 2's default
    changes with item 5.
18. **Smaller corrections:** the material chroma maximum is 0.092, not 0.089 (the bake's pixels are 0.089). Water is 20.0 / 13.1
    or more from every ground where lakes lie. `p60-draw.js` (458 lines) is split, because the start view changes it.
    `p61a-figlib.js` stays whole as a verbatim copy. The Clear and natural passes are both lazy.

**Kept as written:** the palette and materials, both blends, the covers and N4, the relief caps, the data-mode ruling, the snow
clamp, the hover-chip fix, the cliff strata, the start-view rule, the GPU memory budget, Realm tint owner question 1, and every
measurement not listed above.

## Build after the art-direction critique (2026-10-23, `critique.md`)

The mockup (`map/parts/`, built by `map/build.sh`) applies the critique's twelve fixes. Numbers for docs/09-balance "Map
presentation", and the places where the build departs from the critique's letter (each kept every check passing):

| Value | Was | Now | Where |
|---|---|---|---|
| Neutral hairline (Natural) | one anchored keyline, 2.45:1, partner | lit bevel: upper-left lip light, lower-right lip dark, each solved on its own side at 2.35:1, coverage 0.8, p8 / p92 | `RL_P.bevel`, `rlSegStyles` |
| Natural relief caps, hills / mountains | 13 / 18 | 10.5 / 11 | `RL_NAT.cap` |
| Natural granite light reach; snow weight | 0 to 1; 1 | 0.2 to 0.8; 0.7, plus 3-unit ridged detail at +-3 L* | `rlWildTexel(..., nat)` |
| Hill rock, scrub, shrub specks | hard thresholds | ramps 0.72 to 0.90 (x0.35), 0.72 to 0.90 (x0.5), 0.66 to 0.84 (x0.6) | `rlNaturalGen` |
| Canopy edge | one bit per texel | feathered over a score margin of 0.08; crowns kept by their hash | `RL_NAT.canopy.feather`, `out.nat.cmar` |
| Hamlets and huts | from 100 px a province (fade to 130) | from 220 px (fade to 280); pitched roofs; L*-only muting; two rows on a lane | `RL_P.hamletDpx`, `rlHouse`, `rlMuted`, `rlHamletSpots` |
| Every name | from 180 px (Near) | from 320 px; Near adds towns | `RL_P.allNamesDpx` |
| Near detail | none | soft-light crowns and grain from 1.5 CSS px a texel (full at 2.1) | `RL_P.nearDetail`, `p59c` |
| Field rows | bend 1.6, depth 2.5 over 9 units, furrows +-1.6, crops L* 43 to 56 | bend 0.5, depth 1.2 over 24, furrows +-1.0, crops L* 45 to 52 | `RL_NAT.field`, `RL_NAT.mat.farmland` |
| Natural pond banks; ripples at Mid and Far | lit .42 at 1.2, shaded .38; .22 | lit .18 at 0.6, shaded .25; .12 | `rlDrawWater` |
| Cliff face | joints, ledge 7 L* on each stratum, strata +-3.5 | fractures over 2 to 3 strata at 60 to 75 degrees, 60 to 140 units apart; ledge 3.5 on every other; +-2.5; rock height +-15% over a talus apron | `rlRim` |

**Departures, with the reason:**

- **The bevel is Natural only.** In Clear and the Terrain mode the bevel left 5 to 7 segments under 2.3:1 (worst 1.29), so those
  looks keep the v4 anchor-and-partner hairline, which passes.
- **The bevel's fallback.** The critique's "a lip that misses on a third of the edge takes the other key" doubled the light lip on
  63 of 73 natural edges (the dark key cannot reach 2.35:1 against dark ground): a 3 px light line that added more busyness than
  the old one. Where the other lip's key also serves that side, the missing lip stays a soft shade of its own key (dark at 0.3,
  light at 0.25), the lit lip is 2 px below ratio 1.5 and solved against both sides, and per segment the soft lip steps up where
  the lit one cannot serve. Two solved lips of opposite keys are solved at coverage 0.55 below ratio 1.5 (each spills into the
  other's antialiased pixel; at 0.8 one data-mode segment fell to 2.13:1).
- **Hills 10.5, not 9.** At 9, three unexplored hill provinces read as plains (0.95 by province, at the floor); at 10.5, 0.967 at
  ratios 1 and 2. Mountains stay the strongest at 11.
- **Field depth.** The critique named `bend`; the waves it saw at Near came as much from the row-depth term, so that is calmer too.
- **The Near detail** is gated in CSS px per texel, not device px, so the look is the same at ratios 1 and 2 and ref-2's zoom is
  untouched.
- **Talus.** The plinth is a flat board, so the face cannot change height at its foot: the rock's height varies over a scree apron.
- **Owner question (open):** the bevel still reads about twice the reference's line weight. Only a lower floor between two
  independents would match ref-2.

## Pass 3 decisions (2026-10-24, the wilds in the natural view; flagged for the owner)

Pass 3 rebuilt the wilds in the Natural look (Ownership mode). Three prototypes were built: a continuous relief, a sculpted massif
and an open spill. Three judges then scored them, on art direction, on player readability and on the rules. All three judges ranked
the **massif first**: art 6/10 (relief 5, open 3), player 8/10 (relief 7, open 4), rules 6/10 (relief 5, open 3). The mockup
(`map/parts/`, built by `map/build.sh`) now ships the massif with the grafts the judges asked for. Clear, the Terrain mode, the data
modes and Painted (v3) are unchanged.

**Owner flag.** Three of the changes below alter an approved rule. Each is backed by at least two judges, is built as the default,
and is listed under "Rule changes" for the owner to confirm or reverse.

### What was built

| Graft (asked by) | What the build does | Where |
|---|---|---|
| Base: the massif (all three) | One range along a spine on the wild's long axis. Its half-width follows the room the cells give it. A crest with peaks and saddles, spurs across the axis, faceted ridges at the fine scale. Each wild has its own raster at 2× the bake's resolution; the bake's wild texels are its 2×2 means. | `p58x-massif-gen.js`, `p58y-massif-colour.js` |
| The land climbs into the range (art 1) | Height is 0 on the outline and rises over 0.16–0.38 D, seeded per stretch. The rock line comes from ridges, slope and noise, so green valleys run up between the spurs. | `RL_MS.peaks.footD`, `RL_MSC.rockK` |
| The foothills are the neighbouring land itself (art 2, player 2–3, rules 4) | The land's own seeded covers (p58n) and materials (p58m) run on the wild's texels. Each texel uses the province of its nearest outline edge, with no mirror. Woods (×0.5), fields (×0.55) and copses (×0.5) thin as the land climbs, at e / 0.55. | `RL_MS.climb`, `out.msCov`, `out.msNb` |
| Faceted ridges up close, no grain on rock (art 3, player 1) | Ridged fine detail: 8.5 units, 2 octaves, ×0.06 of the height. The Near detail draws no grain on rock texels. | `RL_MS.peaks.fine*`, `p59c` |
| Calm when zoomed out (art 4) | The start view's and least zoom's mips pull wild lightness toward its local mean (×0.92 / ×0.82 over 0.035 D). They lift the deepest shade (floor L\* 16 / 18) and hold snow down (knee L\* 66 / 60). | `RL_MSM`, `rlMsMips` |
| Snow as caps, not streaks (player 1) | Snow sits on the top 2.5–10% of each range's blurred heights (quantiles 0.90–0.975), broken by ridges and noise, with less on steep faces. Peaks and saddles vary across the axis too (`crestQ` 0.6); along the axis alone they drew ruler-straight snow bars on the Greyteeth. | `RL_MS.snowQ`, `RL_MS.peaks.crestQ` |
| The mere at the map's water (art 7, player 3, rules 4) | Mid-depth is the map's water (#14615B, L\* 37). A shelf of L\* 50 runs at the shore; the water darkens to L\* 28 at the centre over 0.07–0.8 of the depth (rendered median L\* 34.5). The fringe is the continued land, 7 L\* darker toward the shore, with reed beds. | `RL_MS.mere`, `RL_MSC.water` |
| Decide the edge once per zoom, from data (rules 1, player 4) | The colour-blind wild edge test's decision is made from the sources the composite draws at that zoom: the fine raster at Near, otherwise the bake or the mips, plus wash, tint, glow, haze and fog. It is cached per zoom and look state, so a pan never changes it and nothing is read back from the screen. | `p59x-quiet-edge.js` |
| Margins, and hover decided live (rules 2) | Pair and stone margins are ×1.2; the ink's is ×1.1 (see "Departures"). A hovered or selected neighbour's edges are re-decided with its tint and drawn live. | `RL_QE`, `rlDrawWildHover` |
| Robust to the check's own sampling (found by the seed runs, below) | The check takes the median of 4 pixels inside and 5 outside. Where the ground changes sharply near the line (a shaded foot, a forest edge at a corner), a sub-pixel shift moves that median by one place. So the decision also tests the pair and the ink against each median's neighbours, over pixels from 5.5 to 9.5 px in and 5.5 to 10 px out. The ink is tested against every median the check may take, not against the darkest pixel: a darker but more saturated colour can stand further from black. The band is at least 2.5 device px, so one pixel across it is always wholly stone. The decision's two memos are pure functions of their keys: before, one load in three drew a different start view. | `rlQuietEdgeMap`, `rlQeBand` |
| Memory and dead code (rules 3) | The 2× working planes are freed after the bake. Pass 2's natural wild generator, apron, mirror and sculpt are deleted (`p58w` is 14 lines). | `rlMsFree`, `p58w` |
| Footprint guard, interaction checks, sweep (rules 4–5) | Three new checks in `window.__mock`. **Sweep:** the edge test over 30 seeded cameras, each wild's closest zoom and sub-pixel pans. **Footprint:** a hash of every land texel before and after the wilds' pass. **Interaction:** hit test, cards, path refusal. All three also run on seeds 7 and 31 and on a four-wild plan. | `p89b-pass3-checks.js` |

### Rule changes (each backed by two or more judges; built as the default; owner to confirm)

1. **Snow brighter than the cap.** Snow may pass pass 2's brightness cap (L\* 54.85), up to L\* 80, on at most 8% of a range's
   texels. Measured: 5.0% of range texels are snow, 2.3% are over the cap, and the brightest is L\* 75.4. Rock stays under the cap
   (0 texels over). Backed by the art judge (the only owner decision it asked for) and the player judge (snow brings back the
   wilds' reserved cue). The rules judge listed it as an owner question and would default to keeping the cap.
2. **The neighbouring land continues inside the wild's cells, up to the range's foot.** This reverses pass-2 critique fix 3a
   (rock starts at the outline). Backed by the art judge (graft 2), the player judge (grafts 2–3) and the rules judge (graft 4,
   open's fringe without the mirror). Every wild texel still lies in its cells; the footprint guard holds (0 land texels written by
   the wilds' pass).
3. **The cream rim (#E9E4D8) gives way to a quiet stone band.** The band sits just inside the ink. It is 2 CSS px wide but never
   under 2.5 device px, so at dpr 1 it is 2.5 px. It takes the land side's hue (×0.6), at the least lightness that reaches 20 / 12
   × 1.2 against both sides. It is drawn only on the runs where the colour-blind wild edge test needs a light element. Backed by the art judge (ship the per-stretch quiet edge), the rules judge (graft 1, a solved
   land-tinted stone) and the player judge (the lightest frame of the three). The 20 / 12 test itself is unchanged and stays the
   gate.

A consequence of rule 2, not a separate rule: land shadows are recomputed with the wilds at the land's height, so no wild casts
shade onto the land outside it. 12,422 half-resolution land texels next to the wilds are lighter than in pass 2.

### Not adopted

- **The 2 px ink** (art for; the rules judge asked the owner, default 3 px). The ink stays 3 px.
- **The spill** (all three judges against; it reverses an approved rule).
- **Fog in the continued land** (art for; rules against: "never tinted, faded, hatched, dimmed or fogged" is approved).
- **Brightening the wild's contour on hover, and a no-go wash** (player only). The ink is approved as never tinted. Hovering a wild
  still names it in its card; the path preview refuses it with "Impassable: the Ashspine" and the toast.
- **A data-mode copy of the new raster** (art only). Clear, the Terrain mode and the data modes keep the v4 granite massif and
  mere, so a wild's drawn shape still changes when switching from Natural to a data mode.
- **The light element as lit scree at the foot** (art graft 5). A lighter lower-slope skirt was tried and taken out: it read as
  the mat the judges disliked. The light element stays the quiet stone band.

### Departures from what the judges asked, with the reason

- **The light band covers more than 40% of the outline** (art: 40% or less at the start view). Measured at dpr 1: 0.62 at the
  start view, 0.78–0.80 when zoomed out, 0.50–0.54 from Mid to the closest zoom. At dpr 2 the figures are within 0.05. The colour-blind test compares the
  ground 6–9 px inside with the ground 6–9 px outside. With the land continued, both sides are often the same dark ground (forest,
  swamp, shaded hills, L\* 20–33). Against that ground no dark ink reaches 20 / 12, so only a lighter element passes. The art judge
  named the cause itself ("continuing the land under the line will raise how often the test needs a light element"). The share
  could be cut only by giving up the continued land, the test's margin or the test itself.
- **The ink's margin is ×1.1, not ×1.2** (rules). At ×1.2 the light band covers 3–16 points more of the outline (start view
  0.62 → 0.74, Mid 0.53 → 0.65, Near 0.52 → 0.67). The pair and stone margins are ×1.2. The sweep's smallest margin is reported
  below.
- **The ink is #000000, not v4's #0B0A09** (3 px either way). Black reaches 20 / 12 against more land, saving 2–12 points of light
  band (start view 0.70 → 0.62, Near 0.65 → 0.52). The massif prototype, whose ink the art judge asked to ship, also used black.
  Flagged in case the owner treats the colour as part of the approved contour.
- **The ground step across the line is 6–11 CIE76, not 4 or less** (art). Start view: Ashspine 7.9, Greyteeth 11.4, mere 11.1;
  Mid to the closest zoom: 5.9–7.1. The step comes from the climb (the range's relief and the thinning covers 6–12 px in), not from
  the lower-slope thinning term: with that term off (`climb.depthK` 0) the step changes by 0.3 at most and the light band by 0.6
  points at most. That term is a candidate for removal.
- **The mere against the swamp's peat pools is ΔE76 18.4 / 11.2 / 11.4 / 19.5** (normal, protan, deutan, tritan; the medians of
  the mere's open water and of the pools as drawn at the start view). The player judge asked for 20 in every vision. Pass 2 measures
  12.6 / 3.2 / 5.6 / 12.2 and the massif prototype 12.5 / 6.8 / 9.0 / 13.1 by the same method; the player's own method gave higher
  numbers for every build. Reaching 20 under protan needs the lake at about L\* 45, the pale, milky shelf the art judge rejected in
  the open prototype.
- **Busyness at the start view: Greyteeth 36.6 / 8.3** (core cells jumping more than 10 / 20 L\*), against the reference's 31–35 /
  8–9. The Ashspine is 31.3 / 6.2. At the least zoom both are 34.7–35.3 / 5.9–6.7.

### Measured on the final build (md5 `0ae9067f…`, 1440×900)

**The light band** is the share of the wilds' outline in view drawn with the quiet stone band, as decided by the page (all three
wilds):

| View (px a province) | dpr 1 | dpr 2 |
|---|---|---|
| Start (96) | 0.62 | 0.64 |
| Far (60) / least zoom (54) | 0.78 / 0.80 | 0.83 |
| Mid (175) / reference zoom (200) | 0.53 / 0.50 | 0.53 / 0.51 |
| Near (336) / closest (420) | 0.54 / 0.52 | 0.54 / 0.52 |

**The art judge's measures** (its own tools, rerun on this build at dpr 1). "Lighter line" is its "any lighter inner line" share.
"Step" is the CIE76 ground step 6–12 px out against in. "Busy" is the share of core 6 px cells jumping more than 10 / 20 L\*:

| View | Wild | Lighter line | L\* ≥ 65 rim | Step | Busy | Fine detail vs land | Range L\* p5 / p50 / p95 |
|---|---|---|---|---|---|---|---|
| Start | Ashspine | 0.71 | 0.16 | 7.9 | 31.3 / 6.2 | 1.88 | 16.4 / 27.4 / 47.3 |
| Start | Greyteeth | 0.87 | 0.25 | 11.4 | 36.6 / 8.3 | 1.97 | 16.5 / 25.7 / 46.2 |
| Start | Still Mere | 0.56 | 0.10 | 11.2 | – | 0.94 | 26.4 / 34.1 / 40.7 |
| Least zoom | Ashspine / Greyteeth | 0.96 / 0.97 | 0.40 / 0.43 | 18.9 / 18.2 | 34.7 / 6.7, 35.3 / 5.9 | 2.07 / 2.18 | – |
| Mid | Ashspine | 0.61 | 0.17 | 5.9 | 27.9 / 4.6 | 2.28 | 16.0 / 27.6 / 47.2 |
| Near | Ashspine / Greyteeth | 0.61 / 0.81 | 0.18 / 0.25 | 6.8 / 7.1 | 23.0 / 3.2, 19.0 / 2.2 | 1.45 / 1.02 | – |
| Closest | Ashspine | 0.66 | 0.13 | 6.7 | 13.8 / 1.2 | 1.15 | 15.2 / 27.9 / 47.9 |

For comparison, the art judge measured the massif prototype at 55–71% "lighter line" at the start view, with core busyness 48 / 14
and shade at p5 L\* 9–12; the reference is 31–35 / 8–9.

**Other measures:**

- **Snow:** 5.0% of range texels; 2.3% are over the cap; the brightest is L\* 75.4. No rock texel is over the cap.
- **The mere:** rendered median L\* 34.5. Against the peat pools, ΔE76 18.4 / 11.2 / 11.4 / 19.5 (normal, protan, deutan, tritan).
- **Footprint:** the land hash is `cbd877c9` before and after the wilds' pass, and 0 wild texels lie outside their cells. 12,422
  half-resolution land texels are lighter, because the land's shadows are recomputed without the ranges.

### Checks (every look and mode, dpr 1 and 2)

All runs are on build `0ae9067f…`. Every session had 0 page errors.

| Check | Result |
|---|---|
| The page's checks, Natural, Clear and Terrain mode, dpr 1 (18 views) and dpr 2 (7) | Colour-blind wild edge: 0 failing of 4,700 and 1,758 samples in each look. Realm rails (band rule): 0 failing. Lines, seats, layout, names, hit, chips: pass. |
| Data modes (7 modes × 3 views × 2 looks × 2 densities) | Wild edge in Ownership: 0 failing. The failing data-mode keyline rows (2 / 6 / 3 / 6) are the same rows, with the same counts, on the pass-2 page. |
| Inherited, unchanged from pass 2 (same values on the pass-2 page) | Natural dpr 1: the hover hairline Ashmoor/Elmwick at 2.14 / 2.29, and the Mid terrain reader at 0.928 / 0.931. |
| Sweep, main map, dpr 1 / dpr 2 (33 cameras plus 15 pan positions each) | 0 failing of 16,904 samples. Smallest margin 1.097 / 1.112; 1 / 0 samples under 1.10. A pan never changed the decision. |
| Seed 7 / seed 31 / four-wild plan (11 / 11 / 14 views, then the sweep) | 0 failing in the views or the sweep. Smallest margins 1.069 / 1.001 / 1.071. Wild look, footprint and interaction all pass. |
| Hover: the real pointer on every wild neighbour in view (66 hovers over 5 views) | 0 hovers with a failing sample. The pass-2 page, by the same test: 15 of 66. |
| Footprint and interaction | Land hash `cbd877c9` before and after. 30 / 30 edges name the wild inside and the neighbour's terrain outside, and refuse paths. 3 / 3 cards say Impassable. |
| Determinism | Natural, 3 fresh loads: 6 views and the bake hashes identical. Clear and Terrain, 2 loads each: identical. History: the start and Mid frames are the same before and after other zooms, hovers and selections have filled the decision's memos. Rebake: identical (natural `1603612350`, clear `4243484565`). |
| Painted (v3) | 10 views, settled frames, 2 loads each: identical to the pass-2 page and to the page before the natural view. The plain determinism probe still differs at ref and near between loads, as it does on pass 2, because it does not wait for the sprites to settle. |
| Clear and the Terrain mode | Pixel-identical to the pass-2 page at 5 views each (0 changed pixels), so their colour distances (20 / 12 under simulation) are unchanged. |

**One limit:** where the decision leaves a sample to a neighbouring edge's line at a corner, the margin is thinner. The smallest
margin found on any map, 1.001 on seed 31 at the Greyteeth/Karcrag corner, is one of these.

### Performance (shared machine; timings are noisy)

- **Bake:** the wilds' steps take 2.0 s (generate 1.1 s, colour 0.9 s), against pass 2's 1.1 s. The whole natural bake used 14.2 s of
  CPU over 17.8 s wall, against 11.0 s / 14.5 s for pass 2, measured while other checks ran.
- **Memory:** the 2× working planes, about 45 MB, are freed after the bake. The fine colour images, about 10 MB, are kept for the Near
  decision.
- **The edge decision:** once per zoom, 25–378 ms (median 153 ms) over the checked views. It is never recomputed on a pan.
- **Pan out of the cached frame,** median of 12 (max): pass 3 251 ms (598), pass 2 242 ms (359), massif prototype 408 ms (1,088).
  **Zoom change,** median: 863 / 948 / 838 ms.

### Owner questions (defaults in bold; the build follows the defaults)

1. Snow brighter than the cap, on at most 8% of a range, up to L\* 80? **Yes** (art and player); the rules judge's default was no.
2. The light band on about half of each wild's outline (two-thirds at the start view). It is the price of the land continuing under
   the line while the colour-blind test holds with a margin. **Keep it**, or choose one of: rock up to the outline on dark-ground
   edges (pass 2's look there; not built); or a different colour-blind rule for wild edges. Smaller margins are not an option:
   at ×1.0 everywhere the band falls 8–12 points (start view 0.53, Mid 0.42), but the test already fails at the closest zoom
   (4 samples, worst 0.98).
3. Black ink (#000000) instead of #0B0A09? **Yes.**
4. Brighten a wild's contour on hover (the player judge's ask)? **No**, because the approved ink is never tinted. It needs the
   owner's word.
