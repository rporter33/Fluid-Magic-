## 4. Color, measured

Every figure here is from `mapwork/calc/report-final.out` (the repo's `colorMath.ts`: CIEDE2000, and Machado 2009 at
full severity for protanopia, deuteranopia and tritanopia), written normal / worst deficiency unless marked. Swatches:
`mapwork/out-final/albedos.png`.

### 4.1 The albedos

| Terrain | v4 albedo | L\* | OKLCH C | Hue | Reads as | Keyline (`keylineFor`) | WCAG |
|---|---|---|---|---|---|---|---|
| Plains | **#78894A** | 54.4 | 0.090 | 122 | olive grassland | dark | 4.53 |
| Farmland | **#D5B16B** | 74.0 | 0.098 | 83 | ripe wheat | dark | 8.54 |
| Forest | **#1A3819** | 20.5 | 0.065 | 143 | deep woodland | light | 11.17 |
| Hills | **#6D5303** | 36.8 | 0.092 | 87 | umber heath | light | 6.28 |
| Mountains | **#859BB8** | 63.3 | 0.050 | 255 | slate stone, no snow | dark | 6.10 |
| Swamp | **#38616D** | 38.7 | 0.050 | 219 | dark wet slate | light | 5.85 |
| Wasteland | **#877773** | 51.4 | 0.021 | 34 | dusty barrens | dark | 4.06 |

**How they were found.** A seeded (1+1) annealer over CIELAB (`calc/search.ts`, palette-ab's scheme), 20,000 steps a run,
minimizing the CIEDE2000 distance (lightness weighted ½) to a natural, low-key target (the references' forest, open
grass and rock, and invented siblings in the same key for the terrains they do not show: plains #6E7A3A, farmland
#B39A5A, forest #24391A, hills #6A6436, mountains #7E8086, swamp #3F4A3A, wasteland #A89C8C), with every check below as a
hard constraint, plus: no albedo above OKLCH C 0.10 (mountains, swamp 0.05; wasteland 0.06), mountains cool (hue 220 to
290) and no lighter than L\* 64, no albedo darker than L\* 22 before the last nudge, so the wild grounds stay the
darkest ground. 34 runs; the chosen one is run n6 seed 61, then forest moved by ΔE 1.04 (`calc/nudge.ts`) so the
granite margin passes unrounded. It is the best of these runs, not a proof of optimality.

**Distance from the target:** plains 5.7, farmland 7.9, forest 2.6, hills 10.4, mountains 13.1, swamp 17.2, wasteland
14.2 (RMS 11.2). The rule costs the most where the target was most muted: swamp and wasteland cannot both be dark
grey-green and grey-brown next to forest, hills and plains for color-blind players.

**Key and chroma against the earlier palettes** (area-weighted by mapgen's terrain shares):

| | L\* range | Area-weighted mean L\* | OKLCH C mean / max |
|---|---|---|---|
| A, approved fills | 29.8 to 81.8 | 58.3 | 0.075 / 0.149 |
| B, painted fills | 23.7 to 86.5 | 57.2 | 0.050 / 0.094 |
| **v4 albedos** | **20.5 to 74.0** | **46.4** | **0.066 / 0.098** |
| The natural target | 21.5 to 65.0 | 44.6 | 0.053 / 0.089 |

Open land now sits in the middle of the range (plains at L\* 54, against 81 and 87), the change the references make
most visibly. The palette is about 11 lighter than the references' land in the median (§4.9): seven terrains need the
spread.

### 4.2 The docs/09 rule, unchanged

| Check | Measured | Needs |
|---|---|---|
| Raw albedos, closest pair per vision | 21.7 (mountains / wasteland) / 14.5 protan (forest / hills) / 14.3 deutan (plains / wasteland) / 14.7 tritan (plains / mountains) | 20 / 12 |
| Every pair of different terrains in any two approved states (raw, unexplored haze 4%, out of sight 10%, ash 10%, moss 6%) | 20.2 / 12.2 at worst; 0 of 525 pairs under (unrounded 20.19 / 12.17) | 20 / 12 |
| Granite #2A292C against every albedo in every state | 20.1 / 12.3 (forest; unrounded 20.06 / 12.30) | 20 / 12 |
| Mere #24222A against every albedo in every state | 23.3 / 14.2 | 20 / 12 |
| Both grounds against every albedo's relief extremes (±A) | 20.6 / 13.1 and 23.3 / 14.4 | — |
| The strongest unexplored haze that keeps every pair | 4% (6% leaves 3 pairs under) | the approved 4% |

So `palette.test.ts`'s terrain test passes unchanged in code with the new `TERRAIN[].fill` values, and the approved
state caps (ash 10%, moss 6%, haze 4%, out of sight 10%) stay exactly as they are.

### 4.3 The relief texture floor (replaces v3's H13 floor)

Relief and ground detail move single pixels by up to ±A (the p95 swing, §3.3). The rule binds the albedos; the floor
states what the textured pixels keep. At ±0.4 A (the interquartile range of the shading: half a province's pixels lie
inside it), every pair of different terrains in every approved state keeps **17.1 / 10.0** (unrounded 17.12 / 10.05;
276 of 4,725 pixel pairs fall under 20 / 12). At ±0.25 A: 18.0 / 10.8. At ±0.5 A: 15.1 / 9.0. At the full ±A: 9.3 / 4.4,
mountains' shaded faces against swamp.

v3's H13 held 19.5 / 11.0 for a mottle of about ±1.7 L\*. Relief that reads as relief is ten times that on mountains, so
the floor is lower; terrain identity rests on the albedo means (the rule), the relief pattern (ridged, rolling, flat),
the canopy, parcels and pools, the card, and the Terrain line of the hover card. The test holds the floor at 17 / 10.

### 4.4 Why there is no whole-province tint

A translucent owner tint over a whole province, at strength t (normal blend), against every pair of different terrains:

| t | Same owner on both | Any two owners, or one unowned | Pairs under 20 / 12 |
|---|---|---|---|
| 0.04 | 20.3 / 13.0 | 17.5 / 10.0 | 84 of 3,024 |
| 0.08 | 18.4 / 12.0 | 13.4 / 4.6 | 354 |
| 0.12 | 16.5 / 10.8 | 8.8 / 3.7 | — |
| 0.20 | 13.7 / 7.8 | 4.5 / 1.2 | — |

The same holds on the approved and painted fills (`calc/explore.ts`: A drops to 15.2 / 7.7 at 8% and to 2.2 / 0.3 at 16%;
a lightness-keeping "color" tint fails as well). At 20%, the references' "light tint", a tinted province of one terrain
can match another terrain under another owner (4.5 / 1.2). Hence V6: the glow, along realm edges only, and the full
tint on the one province the player is pointing at.

### 4.5 Rails: the band rule, restated

docs/09's band rule asked that a band read on every fill: the banner differs from the fill, or the keyline differs from
both. For rails the ground is no longer flat, so the grounds are, per terrain: the albedo and its relief extremes (±A);
each of those untinted and under the banner's own glow at its 0.35 maximum; and each half-blended with every other
terrain (a rail near a fringe); all in every approved state. That is 210 grounds per terrain and banner.

| Rail | 11 banners × 7 terrains × 210 grounds = 16,170 | Worst luminance contrast (banner or keyline against the ground) |
|---|---|---|
| One keyline chosen by the albedo (`keylineFor`, as bands do) | 208 fail (pale banners #B5D69C and #F3E6B8 on Forest, Hills and Swamp; Umbra #3D2B4F on Mountains and Wasteland) | — |
| One keyline chosen per banner and terrain | 0 fail | 2.16:1 (Tide #3A7BD5 on shaded Mountains); 634 grounds under 3:1 |
| **The lit bead: both keylines** | **0 fail** | **3.87:1** (#8F0F04 on lit Plains) |

The lit bead is the only one of the three that also keeps a thin line at 3:1 or more for every banner on every ground
(WCAG 1.4.11's floor for graphics), which a 1.5 px line needs more than a 9 px band did.

### 4.6 The rim glow and the hover tint

- The glow is a tint of the banner over the ground at most 0.35 at the border, so its pixels are among the rail
  grounds above. The core it leaves untouched is at least 72.7% of every province (§5.2), where the rule's albedos
  show.
- The hover (0.25) and selection (0.30) tints apply to one province; its pixels stay rail grounds (at most 0.35) and
  the card names its terrain.

### 4.7 Other colors on the land and table

| Check | Measured |
|---|---|
| Water #50AF9B (L\* 65.5, OKLCH C 0.095) against swamp, mere and granite | 31.2 / 27.3, 53.1 / 43.5, 50.6 / 41.6 |
| Water against every other albedo | at least 22.1 / 18.9 (plains) normal and 24.4 / 12.3 (mountains) under a deficiency: 20 / 12 from every terrain |
| Snow #F2EEE6 against every albedo's lit relief (+A) | 20.1 / 19.2 at worst (mountains): no passable ground reads as snow |
| Neutral hairline (unowned borders) on every albedo's relief extremes | 2.00:1 (wasteland) to 3.57:1 (forest) |
| Banner rims on the dark base #1E1B18 | 11 of 12 (all banners and pewter) directly; Umbra #3D2B4F by a 1 px #F4EEDF keyline |
| The base's worn lip #B8B1A4 with the base, on every relief extreme | 2.86:1 (swamp) to 7.44:1 (farmland) |
| Cliff face against the oak body #8F7459 | 2.23:1 at the top, 3.45:1 at the foot; ΔE 24.3 / 22.1 and 31.8 / 30.5 |
| Plinth #2B231C on the oak body | 3.54:1 |
| Plaque: ink #1C1A17 on brass #B8914A | 5.94:1 |

### 4.8 Data modes

Modes never draw an albedo (§9.2). Their colors are the approved frozen `MODE_BASE` and ramp, so R16 holds unchanged.
For information: the closest albedo to any mode color is 5.6 normal (Farmland against the ramp near #EAB879) and 0.8
under a deficiency, against the approved fills' 7.2 / 2.2 and B's 5.3 / 0.7. If the owner wants the approved floor
back, palette-ab's measured fix (stops 3 and 4 at #9196A3 and #E0AD85) applies.

### 4.9 Pixels: the preview against the references and v3

`mapwork/preview/preview.py` paints this design on real mapgen maps with numpy: the warp, the heightfield and hillshade,
mean-neutral shading, the ground detail, lakes and swamp pools, the wilds, rails, glow, hamlets, towns and placeholder
army pieces, the cliff and the table. It is a schematic to check numbers, not the game's art (no detail tiles, flat
placeholder miniatures). Images: `mapwork/out-final/` (`contact-sheet.png`, `mid.png`, `far.png`, `near.png`,
`mid-fog.png`, `mid-deutan.png`, `near-deutan.png`).

| Measured on the Mid view (land only; Medium, seed 3) | v4 preview | ref-2, map zoomed in | v3 Mid (cloth) |
|---|---|---|---|
| A province's core mean from its albedo (CIEDE2000) | 0.05 at worst, median 0.00 (budget 2.0) | — | v3's paint check: 1.86 |
| Own-terrain share, this map | 0.855 at worst | — | 1 (no blending) |
| p95 lightness swing per terrain (L\*) | plains 2.1, farmland 4.0, forest 6.0, hills 7.8, mountains 16.1, swamp 1.3, wasteland 3.8 | — | — |
| L\* p5 / p50 / p95; sd | 15.1 / 50.2 / 75.8; 18.5 | 12 / 34 / 47; 11.2 | 16 / 47 / 83; 22.8 |
| OKLCH C mean / p90; pixels over 0.12 | 0.066 / 0.098; 0.25% | 0.063 / 0.096; 0.5% | 0.063 / 0.135; 11.2% |
| Coarse busyness ΔL\* > 10 / > 20 (6 px cells, refs-analysis §1) | **11.7% / 2.7%** | 11.4% / 1.9% | 40.3% / 14.9% |
| The same with miniatures and labels | 15.4% / 4.3% | — | — |
| Near, land only | 13.3% / 1.8% | — | v3 Near: 25.8% / 8.6% |

The land is as calm as the references' by this measure and about a third as busy as v3; it keeps more value range
than the references (sd 18.5 against 11.2) because seven terrains must stay apart for color-blind players.

