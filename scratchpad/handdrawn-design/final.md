# The painted map: final design for the hand-drawn pass

The build spec for the owner's direction of 2026-10-22. It extends the approved war table design
(`../wartable-design/final.md`, "final" below) and changes how the map is painted, never what it
says. The sim is untouched; every new mark is derived from map data and the viewer's view of the
state, seeded and stable. This is `design.md` revised after two reviews (`judge1.md`: owner
fidelity and the hand-drawn feel; `judge2.md`: readability, feasibility and performance). Every
must-fix is applied or ruled on in "Rulings on the reviews".

**The owner's direction (2026-10-22, binding; verbatim, as `owner-direction.md` records):**

> im working on the art but i need the game map to be more interesting and detailed, a hand drawn
> feel - so far looking good

> i like final fantasy 14 and much concept art as insiration

**Read as:** keep everything approved ("so far looking good": the war table, the layered UI, the
wilds, settlements, alignment looks, portraits); make the map itself richer and hand-drawn; take
Final Fantasy XIV's painted maps and concept art as inspiration for style principles only; and,
because the owner is making art with ChatGPT now, let owner images into the map as early as they
pass intake.

**What stays exactly as approved.** The table, the cloth, the tavern and the props (final §2); the
chrome; the wild model, grounds, rims, contours and colors (final §1.10); settlements, kits, walls,
landmarks of buildings, land looks and pole motifs (final §4), now lit by the one light (H14);
tokens, standees and the path thread (final §3.6); the three-layer split and "decoration fades in
data modes" (R23, R31); "no light on the cloth" (R19); the band rule, the label budget, the fog
rules (R18), the reserved patterns (R26); every docs/09 fill, banner and mode color. Three asked
changes to approved items are owner questions with defaults (§10.2): the ownership band's width is
capped at Near, Artifice's "a mill" becomes "a water mill with a wheel", and the Wasteland skull
stamp becomes a rock.

**Evidence** (scripts run with `npx tsx` from the repo, using the repo's own
`tests/content/colorMath.ts`, `src/content/colors.ts` and `src/mapgen/generate.ts`):

| File | What it measures |
|---|---|
| `calc/painted.ts` → `painted.out` | the band rule against painted extremes; lettering, water, landmark, camp and spring contrast; warm-cool stamp faces; cast shadows |
| `calc/extra.ts` → `extra.out` | camp domes against banners; relief inks; paper gaps (rejected) |
| `calc/pairs.ts`, `calc/tokens.ts` | terrain pairs and tokens on raw fills (superseded by `final.out` §B and §L) |
| `final-calc/final.ts` → `final.out` | the Ownership states as live overlays (§A); terrain pairs across every approved state at the blotch peak and at full mottle, with relief-wash options (§B); the band rule on the final paint in every state (§C); region-name inks (§E); kit faces (§F); flecks (§G); the Farmland A/B (§H, §J, §K); wild names, camp canvas, sheaves (§I); tokens on the final paint (§L) |
| `final-calc/final2.ts` → `final2.out` | tracks as live dots at the re-layout pitch over every paint variant, grain and state (§M, §R); the chosen flecks (§N, §S); face shifts (§P); region names over stamps with the knock-out halo (§Q) |
| `final-calc/tracks.ts` → `tracks.out` | the track geometry of §3.2 on 180 game maps (seeds 1 to 30, Small, Medium, Large, 2 and 4 nations, 39,571 neighbor pairs, noisy edges): crossings, clearances, fallbacks; the median province diameter |
| `final-calc/labels11.cjs` → `labels11.out` | place-name widths at the mockup's start zoom with the 11 to 13 px ramp (headless Chromium, Alegreya woff2) |
| `judge1-calc/`, `judge2-calc/` | the reviews' measurements (hue mottle, Farmland, harmony; Ownership states, edges, labels, footpath) |
| `research-techniques.md` [calc], `bench/` | cost and color drift of every paint stage on a 105-province bench (software raster) |

---

## The design in sixteen lines

1. **Watercolor washes on linen:** each province is its terrain fill, painted: lighter in the
   middle, pooled darker at the edge (at the band's inner edge on owned land), a slow mottle on the
   light terrains, granulation, a bloom or two, pigment flecks, paper tooth over all. The painted
   mean stays within CIEDE2000 2.0 of the fill. Haze, land-look washes and the out-of-sight fade are
   drawn live over the paint, so the paint never shows a stale fog state.
2. **Ink with a hand:** borders wobble like a hand-ruled line (one seeded polyline per shared edge,
   used by fill, border, band, hover and hit test) with ±12% width; bands are inner ribbons on the
   same line; decoration ink tapers and breaks.
3. **One light from the upper left:** warm lit faces and cool blue-grey shade faces on stamps,
   landmarks and settlements alike, cool cast shadows to the lower right. Never a sheet-wide
   gradient (R19).
4. **Forests are painted clumps;** mountains are ridge-profile peaks, lower and rounder than wild
   peaks, with flat shade faces and a soft cool wash on the ground beside them; hills are humps
   with hachures that avoid the reserved 45°.
5. **Tracks join every pair of neighbors** as live dotted roads (1.8 px dots every 2.5 to 3 px at
   every zoom), seat to border to seat, crossing at a right angle, never along a border: a track
   means "you can march here", and none crosses a wild.
6. **Brooks and ponds are pale scenery inside one province;** dark water is always a wild; fog
   shows no water.
7. **Landmarks say what the land is:** a mine on every Hills and Mountains province, a windmill on
   every Farmland province, old ruins on a quarter of provinces, bridges where tracks meet brooks,
   and one hero set piece per named region, visible from far zoom.
8. **Near zoom shows the independents' camps** (1 to 4 domed tents by the public strength word) and
   the mana spring stones the view knows. A Wellspring is illustrated: a glowing basin whose five
   drops carry the five mana colors until it is claimed.
9. **Lettering is ink on paper:** names in Alegreya, dark ink on a paper halo (owner A/B), sized
   from 11 px up with the zoom; region names in spaced Marcellus SC under the bands, last in
   priority; wild names curve along their massifs from 13 px, clear of the peaks.
10. **Region names** come from terrain: each connected run of 3 or more provinces of one terrain
    may be named ("the Greywold", "the Reed Fens"); public, presentation only, checked against a
    deny list of famous place names.
11. **Near adds life:** one small vignette per province (sheep, deer, a heron, goats, cows, a hare)
    and pigment flecks (sorrel, lichen, rust, sedge). No people.
12. **Cut, with reasons:** every scenery shape that shares a silhouette family with an information
    or alignment mark (§3.11): obelisks, cliff doorways, caves, carts, dust devils, dark birds,
    domed haystacks, free pale dots; also huts, cliffs outside wilds, rivers between provinces,
    paper gaps, scale bars, graticules, fog sketches and sheet gradients.
13. **The instrument wins:** decoration fades in data modes and dims to 60% while targeting
    (tracks stay at full strength there), keeps out of fixed label, token and seat zones and paints
    them flat, and never depends on armies.
14. **Owner art:** paper, tree clumps, relief, landmarks, hero set pieces, cartouche, compass,
    corners, vignettes and a Wellspring as ChatGPT images, recolored through luminance so the
    palette holds; "Try your art" shows a sheet on the mockup's map the moment it passes intake;
    every image has a procedural fallback.
15. **Bake once, blit always:** the paint is keyed by terrain, exploration and "owned", never by
    armies or daily fog; it lives in the existing decoration bake; live layers stay within the map's
    15 draw calls.
16. **A 16-step mockup brief,** the washes and paper first, the owner's own art fifth.

---

## Rulings

**H1. The fills are law; the hand comes from paint, line, light, paper and lettering.** docs/09's
fills pass CIEDE2000 20 normal and 12 under each deficiency, in every approved Ownership state. The
painted look therefore comes from lightness texture, edges, ink, light and lettering, not from the
land colors. Measured (`judge1-calc/harmony.out`): a uniform 15% chroma cut with a warm shift fails
20/12 (18.8 / 12.1), and a 30% cut fails outright. A hue mottle fails too: ±2 a\*b\* drops terrain
pairs to 9.2 under a deficiency (10.2 even on Plains, Farmland and Forest alone; `huemottle.out`,
`huetangent.out`), so hue richness comes from sparse pigment flecks instead (§1.4). The one
measured room is Farmland: **#EDB141** (L\* 76, C\* 64 against the approved 78 and 68; ΔE 3.8)
keeps 21.0 / 12.2 across every approved state pair with no paint and fails no band pair
(`final.out` §K). The review's #E6B047 passes on raw fills (22.5 / 13.4) but not across the
approved states (11.5 under a deficiency: Farmland under the ash wash against hazed Wasteland,
`final.out` §H), so it is not offered. #EDB141 is an owner A/B (§10.2 question 6), and §1.1 tells the
owner before v3 that the land keeps v2's bright colors.

**H2. R19 still holds.** The paint is pigment texture inside each province, mean-neutral within
ΔE2000 2.0. Nothing grades, lights, multiplies or vignettes the sheet. The research's warm-to-cool
`soft-light` gradient across the sheet (`research-techniques.md` §3.2) is rejected: it is a light on
the cloth. Warm-cool lives on stamp, landmark and settlement faces and their shadows. The relief
wash beside passable peaks (§2.3) is local pigment, compensated by the lift. The wash overrun at
the map's outline (§2.7) is an irregular painted edge in the margin, not an edge fade, and changes
no fill.

**H3. Noisy borders move from Later to M1-should (Phase 11), on one polyline.** final §3.3 allowed
painted edges "only with hit tests on the same noisy polygon". This design does exactly that: one
seeded polyline per shared edge, endpoints fixed, used for the fill, border, band, hover, selection,
hit test and the wild contour. Adjacency stays `MapProvince.neighbors`. Phase 8 builds the same
module with the noise off. Bands are inner-aligned ribbons on the simplified noisy polygon, never
per-province masks (§7.3).

**H4. Tracks are presentation of `neighbors`, drawn live.** R36 dropped roads as sim state; tracks
add none. FM has no road rule (docs/01 §6: travel time depends on the destination's terrain), so a
track on some pairs and not others would invent one. Every passable neighbor pair gets exactly one
track and no other pair gets any. Tracks are a live layer of screen-constant dots, not part of the
bake, because baked dots shrink to specks at the start zoom (judge 2: 0.67 px dots, 1.28 to 1.62:1
line average). Live dots of 1.8 px every 2.5 to 3 px measure 4.66:1 dot peak and 1.97 to 2.28:1 line
average on Mountains at every zoom, and at worst 3.76:1 and 1.81:1 on painted interior ground in any
state (`final2.out` §M, §R), above the R34 footpath's 3.00 and 1.80 at the start zoom. So tracks
replace the footpath, after the mockup's on-screen check confirms it (§9 step 14); until then the
footpath stays.

**H5. Water never runs between provinces.** Players read rivers as rules (Dominions, Civ, CK3,
Total War; `research-techniques.md` §9). FM's brooks rise and end inside one province and keep
B_u + 6 u from every border (§2.0); ponds are pale and small. Dark water means a wild, always.
Unexplored provinces show no water: water is scenery, and a solid line in the dotted fog reads as a
border. Rivers that cross provinces wait for a river rule (Later).

**H6. Scenery may not share a silhouette family with an information or alignment mark.** The
families are a table (§3.11) and a test (§7.4): every drawable declares its family, scenery and
reserved families are disjoint, and a raster check compares every scenery silhouette with every
reserved silhouette, filled and as fog line art, at Mid size. Reserved: domes (independent camps)
and domes or mounds with a dark opening (Wild's beast den); single tall stones and spires (Lore,
Thornwood, claimed Wellsprings, W markers, Order milestones, Cinder shards and spire); stacked
stones (cairns); houses, huts, towers and wall rings (population, PD); shrines; triangle tents
(sieges); rising wisps (pillage, unrest, Turmoil); dark birds (Dread, battle scars); carts and
wheels (Turmoil); bones and skulls (Rot, B); flags and shields (ownership, the independents'
token); cliff ticks and snow (wilds); straight hedgerows (Order); solid pale paths (Sanctity,
Radiance); free pale dots (Thornwood's meadow), grey stipple (Cinder's ash) and dot rings (Rot).

**H7. Landmarks are truthful or plainly old.** Mines and windmills are terrain-coded (every Hills
and Mountains province has a mine, every Farmland a windmill), so they say what the terrain says.
Ruins and hero set pieces are history: seeded, never house-shaped, never near the seat. A hero set
piece belongs to a named region (§3.4) and says nothing the terrain does not.

**H8. Labels: ink on paper is the default, the approved light-on-dark labels are the A/B.** Both
measure well above 4.5:1 on every fill (§1.6). The owner picks in the mockup. Sizes ramp with the
zoom from an 11 px floor, so names fit at the start zoom (§4.2).

**H9. Owner rasters supply form and brushwork, never color.** Terrain stamp sheets are recolored
through luminance into each terrain's faces; landmark, hero, cartouche and ornament sheets must be
near-neutral. Wild peaks, settlements and information marks stay procedural (measured colors). The
mockup's "Try your art" runs the same intake and recolor in the browser, so the owner sees a sheet
on the map before the game has it.

**H10. The paint never depends on armies or on the daily fog.** The decoration's paint is keyed by
the province's terrain, whether it is explored, whether it has an owner band, and Map detail. Token
zones are fixed per province (sized for `UI.tokenZoneStacks`), so armies never re-bake paint. Haze,
the land-look wash and the out-of-sight fade are a live overlay over the decoration (judge 2's
option a), so visibility flips and captures between nations change no paint bake, and the map
never shows a stale fog state. The two flags that re-bake (explored, owned) change rarely; while such a
bake is pending, the province shows its live fill instead of its stale decoration (option b for
those two flags).

**H11. Every mark is sized for the zoom where it first shows, and information shows only where it
reads.** Sizes are in world units, u = 1/180 of the median province diameter (§2.0), not in pixels at
a band's top. Tracks are live and screen-constant. Independent camps and spring stones appear at
Near only: at the start zoom they were 1.4 × 1.1 px domes and 2 px discs, uncountable, and both are
redundant there (the strength word on the independents' token and tooltip; the Springs mode and
the Near label symbols).

**H12. Region names sit under the instrument and come last.** They are drawn above the decoration
and below borders, bands, wilds and every label, and are placed after every other label, so they
never cull a place name, a wild name or a token. They show at Far and in the lower part of Mid
(median province under 110 px), so the start view has lettered regions.

**H13. A texture floor for terrain pairs, stated honestly.** The means are the fills, so docs/09's
20 / 12 holds for every pair of terrains in every approved state (20.5 / 12.2 measured). Texture
moves single pixels: at the realistic peak of a mottle blotch (0.55 of the amplitude, the radial
gradient's alpha) every pair of different terrains in every approved state stays at least **19.5
normal and 11.0 under each deficiency** (measured 19.6 / 11.4; at the theoretical full amplitude
19.0 / 10.7; `final.out` §B, §C). That needs mottle 0 on Hills and Wasteland and ±1 on Mountains and
Swamp; granulation and the edge pool texture them instead. `palette.test.ts` enforces the floor.

**H14. Settlements are under the one light.** Roof planes, keeps, walls, temples, labs, landmarks and
the Wellspring monument get warm lit and cool shade faces (+8 / −12 L\*, smaller than the stamps'
+12 / −18 so every kit keeps its tones), and the cool cast shadow. Every kit still has a tone at 3:1
or more on every fill (`final.out` §F).

### Rulings on the reviews

**Must-fix ledger.**

| # | Must-fix | Resolution | Where |
|---|---|---|---|
| J1.1 | Camp tents look like haystacks | Haystacks become upright tied sheaves (an hourglass with fanned ears); camp tents keep the dome, gain a finial and a pale door line (no dark slit, which is the beast den's), and show at Near only; fog line art of both is tested separately | §2.6, §3.5, §3.11, §7.4 |
| J1.2 | H6 by shape, not id | Shape-family table and raster test; obelisk, cliff doorway and cave mouth dropped; the barrow loses its door (a long mound, no opening); the mine loses its cart; the dust devil becomes a hare; birds are pale; paper-ink tracks against Sanctity's pale path tested by form | H6, §3.4, §3.10, §3.11, §7.4 |
| J1.3 | Settlements out of the one light | H14; `faces()` for every kit's roofs, keeps, walls and landmarks; the kit-tone test re-run (passes) | §1.5, §1.6, §9 step 4 |
| J1.4 | Tell the owner about color | Owner note in §1.1; question 6 in §10.2 with the measured Farmland A/B (#EDB141, since #E6B047 fails the approved states) | H1, §1.1, §10.2 |
| J1.5 | Owner art too late | "Try your art" in the mockup (step 5); question 5's default is now "in the mockup as soon as a sheet passes intake"; the intake contact sheet shows raw and recolored on-map results side by side | §6.2, §6.4, §9 step 5 |
| J1.6 | Prompts consistent with the spec | H9 has the six vignettes of §3.10; H5 loses the bridges (procedural), the mesa, the obelisk, the cliff doorway, the cave and the cart; sails "turned a little from upright, never at 45 degrees" | §6.3 |
| J1.7 | Edge pool hidden under bands | The edge pool and pooling line are inset by B_u on provinces with an owner band; "owned" joins the paint key | §2.2 step 6, H10 |
| J2.1 | Sizes for the start zoom, in game units | §2.0 units (u = D / 180; D = 90 units on every map size); tracks live and screen-constant (measured above the footpath); camps and spring stones at Near | H4, H11, §2.0, §3.2 |
| J2.2 | Ramp Mid names | 11 px at the Mid bottom to 13 px at the top (Near 13 to 15); measured at the start zoom: 11.1 px, 1.08 × v2's widths, 11 names over 80% of their province (v2 4), none wider (v2 0) | §4.2, `labels11.out` |
| J2.3 | Region names under the instrument | A live lettering layer at the depth the review asked for (above the decoration, below borders, bands, wilds and labels), placed last; ink #2A1F14 or #F4EEDF at 90%, worst 3.14:1 on the Wasteland edge pool; one priority list everywhere | H12, §3.9, §8.2 |
| J2.4 | Track geometry | Never along a border: clearance C = 10 u outside the crossing zone, a straight perpendicular last segment, dots dropped within J = 9 u of any other border, the crossing slid along the edge's middle half, a via-centroid fallback, corner contacts; measured on 180 maps; `tracks.test.ts` | §3.2, §7.4 |
| J2.5 | Paint coupled to armies | Fixed token zones; `tokensAt` out of every key | H10, §2.2, §9 step 1 |
| J2.6 | Stale fog | Option (a): live state overlay; option (b) only for the explored and owned flags | H10, §2.1, §7.3 |
| J2.7 | Terrain-pair claim | H13's floor; mottle 0 on Hills and Wasteland, ±1 on Mountains and Swamp, ±3 on Plains, Farmland and Forest; the states in `palette.test.ts` | H13, §1.4, §1.6, §7.4 |
| J2.8 | Curved wild names over peaks | Peaks keep out of the glyph boxes plus 2 px at every band, Far included; curved only at 13 px or more; v2's straight placement as the fallback | §4.3 |
| J2.9 | H6 by shape (dust devil, obelisk, haywain, mine cart, geese, fox, pole shield) | All dropped; greyscale silhouette sheet in step 15 | §3.11, §9 step 15 |
| J2.10 | Pixi bands without masks | Inner-aligned strokes with round joins on the simplified noisy polygon in one `Graphics`, keyline the same way; inset ribbon as the fallback; a test that no band pixel leaves its province | §2.7, §7.3, §7.4 |
| J2.11 | Budget and stability gaps | Near tile budget with the scaled-Mid fallback; seed keys for PAPER and GRAN; mottle tested against the union of every band's zones; an allocation order for the cap; the 30 MB atlas cap is the total | §5.4, §7.2, §7.3 |

**Graft ledger.**

| Graft | Taken as |
|---|---|
| Region names in the lower part of Mid (J1) | Yes, at 13 to 15 px; at 90% alpha, not 70% (70% gives 2.93, 2.90 and 2.47:1 on Hills, Mountains and Wasteland, `final.out` §E) |
| One hero landmark per region (J1) | Yes, §3.4: seven set pieces, 2 to 2.5 times landmark size, Far, Mid and Near; family-checked; owner sheet H11 |
| Pigment flecks instead of a hue mottle (J1) | Yes, §1.4: sorrel seed heads on Plains, ochre lichen on scree, rust on Wasteland, olive sedge heads on Swamp. Plains wildflowers are not taken: Thornwood's level 2 meadow is pale free dots (#EFE7CF), an alignment mark |
| Painted relief shading (J1) | On Mountains, #3A4466 at up to 0.08. Not on Hills: every tested Hills wash drops Forest against Hills under a deficiency to 10.0 to 10.7 at the blotch peak, under H13's floor (`final.out` §B) |
| Track character (J1) | Yes: a seeded low-frequency meander and ±15% dot-spacing jitter; a "Tracks: Full / Crossings" A/B and a step-15 check for the diagram look |
| Wash overrun at the map edge (J1) | Yes, §2.7 |
| Band width cap at Near (J1) | Yes, 9 px, as owner question 7 (bands are approved) |
| Elegance cues in the prompts; Art Nouveau A/B for cartouche and corner (J1) | Yes, §6.2 style sentence, H6b and H8b |
| Deny list for generated names (J1, J2) | Yes, `tests/content/mapNames.test.ts` |
| `v3-vs-reference.png` (J1) | Yes, step 15 |
| Option (a) for fog (J2) | Yes, H10 |
| Tracks in Passability (J2) | Yes, and while commanders are selected (move targeting). Not in Supply: supply is per province (docs/01 "Supply"), not adjacency |
| Feather the flat zones by 4 px (J2) | Yes, §2.2 |
| Paint check twice, stamps off and full decoration at Far (J2) | Yes, step 14 |
| Silhouette rule for passable and wild peaks (J2) | Yes, §2.3 |
| Wellspring drops colored only while unclaimed (J2) | Yes, §3.6 |
| One `BitmapFont` for place names (J2) | Yes, §7.3 |
| Camps from Near only (J2) | Yes, H11 |
| Remove v2's live 12% pigment stroke when painted (J2) | Yes, §2.7 |

**Drop ledger.** Dropped as the reviews asked: the broken obelisk, the cliff doorway, the cave
mouth, the mine cart, the dust devil, the haywain, the geese and the fox, the H5 mesa and bridges,
the camp's pole and shield, scree tick fans at passable peaks, the fog brook, region names in the
label layer and their place in the priority list, the id-only H6 test as the sole guard, and
design.md's claims "≥ 3 everywhere" for tracks and "≥ 11.2 under every deficiency" for terrain
pairs. Also dropped here, by the same rule: the barrow's stone door, Plains wildflowers, the
approved Wasteland skull stamp (a skull is Rot's and B's; it becomes a rock) and the domed
haystack.

---
## 1. The look and the palette

### 1.1 The look

A campaign map painted by a careful cartographer on the linen cloth: transparent watercolor washes
in the seven terrain colors, lighter in the middle of each province and pooled darker at its edge
(at the inner edge of its banner ribbon when it has an owner), granulation in the earths and greys,
a few pigment flecks, and the cloth's tooth showing through; confident sepia ink for everything
drawn on top (clustered tree crowns with one outer outline, profile peaks with flat shadow faces and
a cool wash on the ground beside them, rounded hills with a few hachures, a mine in the hillside, a
windmill in the wheat, tied sheaves in the stubble, an old arch in the grass, a colossal ruin
standing for each named region, pale double-lined brooks running into small ponds); dotted tracks
running from town to town across every border; near-black survey ink for borders that wobble like a
hand-ruled line; one soft light from the upper left, warm on lit faces of trees, hills and roofs and
cool blue-grey in their shadows; names lettered in dark ink on a breath of paper, region names spaced
wide across the land as you lean back, wild names curving along their massifs. Over it, untouched,
the instrument: flat banner ribbons with keylines, the darkest wilds with their light rims,
painted-wood tokens, crisp chips. Luminous and clean: no burns, stains, dark corners or grunge.

**For the owner, before v3 (H1): the land keeps v2's bright terrain colors.** They are the
colorblind-safe palette: every pair of terrains differs by CIEDE2000 20, and by 12 for players with
a color deficiency, in every fog and alignment state. Muting them breaks that rule (a 15% chroma cut
already fails; a hue mottle fails), so the painted warmth comes from the ink, the paper, the light,
the lettering and the illustrated landmarks, not from the land colors. The one measured option is a
slightly deeper, warmer Farmland gold (#EDB141 instead of #EEBA3A), offered as an A/B in the mockup
(question 6).

### 1.2 What FM takes from Final Fantasy XIV, and what it never takes

Principles (from `research-style.md` §1.5 and the owner's reading):

| Principle | FM's form |
|---|---|
| Painted ground, crisp information on top | paint lives in the decoration bake; bands, wilds, labels, chips and tokens stay flat and above it |
| Paper under pigment | a mean-neutral paper tooth over every wash (not a multiply, H2) |
| Line plus wash | an ink line with a transparent wash that pools at its edge |
| One light from the upper left; warm light, cool shadow | stamp, landmark and settlement faces and their cast shadows only |
| A name tier per zoom | region names at Far and lower Mid, province names everywhere, wild names everywhere |
| Illustrated landmarks that say what lives where | mines, windmills, ruins, the Wellspring basin, one hero set piece per named region |
| Atmospheric depth | value depth: light interiors, pooled edges, cool shadows; never a vignette (R19) |
| Luminous, airy, refined | clean paper, sparse marks, no aging or grunge in procedural art or prompts |
| Elegant lettering | serif names, spaced capitals, curved names |

**Never taken:** its map images, layouts, region shapes, place names, icons, crystal or teleport
symbols, logos, logo lettering, fonts, UI frames, characters or creatures. No prompt names it or any
other game, studio or artist (§6). Generated names are checked against a deny list (§3.9).

### 1.3 Paper

| Item | Value | Use |
|---|---|---|
| Cloth | **#E8DCC2** (unchanged) | the margin; the base under everything |
| Paper tooth | a seamless grey tile, value noise 128 ± 20 (two octaves: 1.5 px tooth, 24 px mottle), composited `soft-light` at 0.5; seed `streamFor('map:${seed}', 'paper')` | over every province's paint, world-locked (one tile pixel = 1 u) |
| Fibres | 400 strokes per 256² tile, 3 to 8 px, within ±25° of horizontal, #5A4628 at 10% and #FFFAEB at 14% | inside the tile; never near 45° (R26) |
| Granulation tile | 128², value noise 128 ± 26 at 1.5 px; seed `streamFor('map:${seed}', 'gran')` | §2.2 step 5 |
| Label halo paper | **#F2EAD6** at 85% | the halo behind place names (ΔE 3.8 from the cloth) |
| Margin wear | linen darkened to #D9CBAE within 6 units of the hem | the margin only, outside the neatline; texture, not light. No ring stains, burns or dark corners (clean paper) |

The tooth replaces docs/09's "seamless noise texture at 10% opacity multiplied over every fill":
mid-grey in `soft-light` is mean-neutral (grain plus paper moved means by ΔE 0.46, worst 1.22,
`research-techniques.md` §4), where a multiply always darkens. The tiles are seeded per map and
world-locked, so a reload draws the same grain.

### 1.4 Pigments: each fill as a wash

The wash's mean is the docs/09 terrain fill. The Ownership state (haze, land-look wash, out of
sight) is not in the paint; it is a live overlay (§2.1, H10). Every term below is symmetric or
compensated. The pigment names guide owner art and prompts; they are not colors.

| Terrain (fill, L\*) | Pigment idea | Mottle ±L\* | Edge pool ΔL\* | Granulation (`soft-light` alpha) | Blooms (Mid, Near) | Relief wash | Interior lift L\* |
|---|---|---|---|---|---|---|---|
| Plains #C1D29F (81.8) | sap green and yellow ochre | 3 | −7 | 0.25 | 1 | — | +1.2 |
| Farmland #EEBA3A (78.2) | gamboge and raw sienna | 3 | −7 | 0.20 | 0 (the patchwork varies) | — | +1.2 |
| Forest #374C2B (29.8) | hooker's green and burnt umber | 3 | −5 | 0.45 | 0 (canopy) | — | +0.8 |
| Hills #856824 (45.7) | raw umber and yellow ochre | 0 | −6 | 0.60 | 1 | — | +1.0 |
| Mountains #8DA4AD (65.9) | cerulean and neutral grey | 1 | −7 | 0.70 | 1 | #3A4466 at ≤ 0.08 | +1.2 |
| Swamp #1A727A (43.7) | viridian and Payne's grey | 1 | −6 | 0.35 | 2 | — | +1.0 |
| Wasteland #AE897F (60.3) | rose madder and burnt sienna | 0 | −8 | 0.80 | 1 | — | +1.4 |

- **Why the amplitudes:** H13's floor (19.5 normal, 11.0 under each deficiency at the realistic
  blotch peak, every approved state). With these amplitudes the closest texture pair is 19.6
  (Mountains under moss against hazed Swamp) and 11.4 (Plains under moss against hazed Mountains);
  13 extreme pairs fall under 20 / 12, all texture (`final.out` §B, §C). design.md's
  4/3/4/2/2/2/2 gave 19.3 / 10.2 with 47 such pairs. Hills and Wasteland are textured by granulation
  (−3.7 / +2.9 L\* on Wasteland, judge 2) and the edge pool instead.
- **Interior lift** starts at the values above and is calibrated per terrain by the paint check
  (mockup step 14, the Playwright smoke in the game) until the painted mean is within ΔE 2.0.
- **Granulation** follows real pigments: earths and greys granulate, yellows stay smooth
  (`research-techniques.md` §3.4).
- **Relief wash** (Mountains only, H13): Hills washes were tested and every one drops Forest against
  Hills under a deficiency to 10.0 to 10.7 at the blotch peak (`final.out` §B).

**Pigment flecks** (hue richness without a hue mottle; `final2.out` §S):

| Terrain | Fleck | Color | Coverage | Size | Bands | Nearest banner or mana primary (normal / deficiency) | Mean shift |
|---|---|---|---|---|---|---|---|
| Plains | sorrel seed heads | #9A6446 | ≤ 1.5% | 1 to 1.4 u dots | Near | #FD6533 20.0 / #00674B 6.8 | ΔE 0.53 |
| Mountains | ochre lichen on scree stones | #B59A55 | ≤ 1.5% | 1 to 1.4 u dots on stones | Mid, Near | #F3E6B8 20.2 / #FD6533 6.3 | 0.46 |
| Wasteland | rust flecks | #8E5A3E | ≤ 2% | 1 to 1.4 u dots | Mid, Near | #8F0F04 17.2 / #00674B 5.0 | 0.33 |
| Swamp | sedge heads on stalks | #A99C70 head on a 3 u stalk | ≤ 1.5% | 1.2 u heads | Near | #B5D69C 18.9 / #FD6533 12.0 | 0.56 |

Flecks are scattered by blue noise (minimum spacing 3 u), never in rings, rows or clumps of more than
three (Rot's fungus rings, Order's hedgerows), never pale free dots (Thornwood's meadow, #EFE7CF;
the sedge heads are 20.3 from it and stand on stalks) or grey stipple (Cinder's ash). They are below
every information mark's size (the smallest, a spring symbol, is 7 u), and they are part of the
paint, so the paint check counts them.

### 1.5 Inks and other new colors

| Role | Value | Where |
|---|---|---|
| Survey ink | **#2B2620**, 2 px mean, ±12% width, alpha 0.85 to 1 per edge (unchanged color) | province borders |
| Contour ink | **#1C1A17** (unchanged) | wild contours, the neatline, settlement and landmark outlines, tokens |
| Feature ink | **#3E3428** (the fog line-art sepia), stamps at 80% | tree, hill and peak outlines, hachures, tracks on light fills, fog line art |
| Paper ink | **#E8DCC2** | tracks and fog line art on Forest, Hills and Swamp (the fog rule's dark set) |
| Name ink | **#2A1F14** on halo #F2EAD6 at 85% | place names (default; A/B) |
| Region ink | **#2A1F14** at 90% on Plains, Farmland, Mountains, Wasteland; **#F4EEDF** at 90% on Forest, Hills, Swamp; a knock-out halo of the run's fill at 50%, 3 px | region names |
| Stamp faces | lit = mix(fill + 12 L\*, **#F6D9A0**, 0.12); shade = mix(fill − 18 L\*, **#3A4466**, 0.14) | trees, hills, peaks, reeds, rocks |
| Settlement faces | lit = mix(tone + 8 L\*, #F6D9A0, 0.12); shade = mix(tone − 12 L\*, #3A4466, 0.14) | roof planes, walls, keeps, temples, labs, landmarks, ruins, heroes, the Wellspring monument (H14) |
| Cast shadow | rgba(38,42,64,0.22) | under every standing stamp, landmark, ruin, hero and house, to the lower right |
| Relief wash | **#3A4466** at ≤ 0.08 | the ground to the lower right of passable peaks |
| Brook | water **#BCD6D9**, banks **#35535A** at 70%, 0.7 band px | brooks |
| Pond | **#A6C7CC**, lit rim #DCEAEA, bank #35535A at 70% | ponds |
| Stone | **#CFC6B4** (faces #E8DCC5 / #9E978E), ink outline #1C1A17 | ruins, heroes, mine spoil, bridges' decks, the spring stone's rim, a claimed Wellspring's carved drops |
| Timber | **#8C6A47** (faces #AC8962 / #654C34) | mine frames, windmill bodies |
| Sheaf straw | Farmland's stamp faces (lit #FEDB64) with #3E3428 ties | sheaves on Farmland and Plains |
| Camp canvas | **#B9B4A6** (faces by the settlement rule), pale door line #E8DCC2, ink outline | independent camps (Near) |
| Spring stone | **#E9E1CC** disc, 1 band px ink ring #1C1A17 | mana spring marks (Near) |
| Wellspring drops | the five mana primaries with 0.6 band px ink outlines while unclaimed; carved stone #CFC6B4 once claimed | the Wellspring basin |
| Flecks | §1.4 | paint |

### 1.6 Measured contrast

**Bands on the painted ground, every state** (`final.out` §C). Every banner in `NATION_BANNERS`
against every terrain's final paint variants (fill, mottle extremes, the edge pool and the pool −3,
bloom fill and rim, the Mountains relief wash), each under every Ownership state as the live overlay
draws it (raw, haze, out of sight, ash 10%, moss 6%): 2,530 pairs, 2,073 direct, 457 through the
keyline, **0 fail**. Closest direct pass: #51DDFC on hazed Mountains (#8AA0A7), 20.0 / 17.3.

**Tokens** (`final.out` §L). Paint would push banner tokens under 20/12 that pass on the unpainted
state: mottle alone does it for #3186F2 and #B5D69C on Mountains, #C98BAD and #B5D69C on Farmland
and #5C488E on Swamp. **Fix:** tokens stand only in their fixed token zone (H10), which is painted
flat (no mottle, granulation, blooms, flecks or relief wash; paper only), so paint adds no token
pair. Tokens carry the 19 pairs that are already under on flat fills by shape, outline, top-edge
highlight, plate and contact shadow, as approved.

**Terrain pairs** (`final.out` §B): H13. No paint, every approved state: 20.5 / 12.2 (0 pairs under).
Final paint at the blotch peak: 19.6 / 11.4; at full amplitude 19.0 / 10.7. Out of sight as a live
overlay (an equal-L\* grey at 10%) is within ΔE 0.7 of the approved 10% desaturation (`final.out`
§A).

**Lettering, WCAG** (`painted.out` §3, `final.out` §E, `final2.out` §Q):

| Text | Worst ground | Ratio | Need |
|---|---|---|---|
| Name ink #2A1F14 on halo at 85% | Forest | **10.58** | 4.5 |
| (approved: #F4EEDF on a dark halo) | Plains | 11.71 | 4.5 |
| Region ink at 90%, on the ground (fill, mottle, pool, blooms, every state) | Wasteland edge pool | **3.14** | 3 (decorative lettering, H12) |
| Region ink at 90% over stamp faces, with the knock-out halo | Hills lit face | **3.08** | 3 |
| (design.md's region ink, #33261A at 85%) | Wasteland edge pool | 2.70 | fails |
| Wild names #E9E4D8 (approved) | granite | 11.40 | 4.5; on snow 1.10 and the lit face 2.89, so peaks keep out of the name (§4.3) |

**Lines and marks, WCAG:**

| Mark | Ground | Ratio | Note |
|---|---|---|---|
| Tracks, 1.8 px dots, alpha 1, pitch 2.5 to 3 px (live) | Mountains fill | **4.66 peak; 1.97 to 2.28 average** | the R34 footpath at the start zoom: 3.00 and 1.80 |
| | Mountains interior paint, any state | 3.76; 1.81 to 2.07 | `final2.out` §R |
| | Mountains edge pool | 3.29 peak | |
| | Wasteland interior paint, any state | 3.07; 1.68 to 1.86 | the lowest terrain; not the passability channel |
| Brook (best of water and bank) | Wasteland | 2.64 | scenery; no requirement |
| Landmark, ruin, hero (best of stone and ink) | Hills | **3.31** | final §3.11 item 6: one tone ≥ 3:1 |
| Settlement kits with faces (best tone) | every fill | ≥ 3.09 | Cinder by its faces alone (≥ 3.15, Swamp); Thornwood and Independents by their ink outline, as approved (Hills 3.31, Swamp 3.09) |
| Camp dome (best of canvas and ink) | Swamp | 3.09 | ≥ 3 |
| Spring stone ink ring on its disc | all | 13.32 | the symbol's shape carries color identity |

**Water, camps and sheaves against banners** (`painted.out` §5, `extra.out` §7b, `final.out` §I):
brooks and ponds come closest to #51DDFC (14.9 / 11.8) and #B5D69C (20.2 / 4.7 under a deficiency);
they never lie within B_u + 6 u of any border, so they never touch a band. Pond against mere water:
63.7. Camp canvas #B9B4A6 is 15.4 / 10.9 from the closest banner (#F3E6B8) and 11.4 / 6.6 from the
pewter independents' token, which it never resembles in shape (domes, no shield). Sheaf straw is
38.8 / 16.2 from siege tents in #FD6533.

**Warm-cool faces** (`painted.out` §6, `final2.out` §P): stamp faces move ΔE 0.9 to 5.9 from final
§3.2's plain faces and stay 7.4 to 20.1 from their fill; settlement faces move 5.1 to 14.6 from the
flat kit tones, enough to read as light without losing the kit's identity.

**Rejected by measurement:** paper gaps along borders (the cloth at 35% over a fill is ΔE 19.6 on
Forest and 16.0 on Swamp: a light line along a dark border reads as a keyline; `extra.out` §9); a hue
mottle (H1); a muted palette (H1); the Hills relief wash (§1.4); region ink at 85% or 70% (above).

---

## 2. Layers, draw order and zoom bands

### 2.0 Units

- **u** is one 180th of the map's median province diameter, in world units. Game maps have a median
  diameter of 90 units on Small, Medium and Large alike (`tracks.out`), so **u = 0.50 units**.
- On screen, 1 u is 1 px at the top of Mid (median province 180 px), 0.39 px at the bottom of Mid
  (70 px), 0.43 px at the mockup's start zoom (77 px at 1440 × 900), and 2.33 px at the top of Near
  (420 px). The game's Mid bake (1.25 px per unit × DPR, final §3.8) draws 1 u as 0.63 px × DPR. The
  mockup's `PX` at Mid is exactly 1 u.
- **Shape sizes are in u and are the same in every band.** Near adds items and never resizes them,
  so crossing a band moves and rescales nothing. Far draws its own simplified variants (masses),
  also sized in u.
- **Ink and stroke widths baked into the decoration stay in band pixels**, as approved (the
  mockup's `PX` per band, written "band px").
- **Live layers** (borders, bands, tracks, region names, labels, tokens, chips) are in screen px.
- **B_u = 6.4 u**, the ownership band's widest world width in Mid and Near. The band is
  max(2.5 px, 0.0314 × the median province's on-screen diameter) wide, capped at 9 px at Near
  (question 7): 2.5 px at the Mid bottom is 6.4 u, 5.65 px at the Mid top is 5.65 u. Distances from
  borders are written B_u + N u.

**Information marks at the zoom where they first show:**

| Mark | First shows | Size | Where it first shows | Check |
|---|---|---|---|---|
| Tracks | Mid | 1.8 px dots every 2.5 to 3 px (live) | the same at every zoom | §1.6: Mountains 4.66 peak, ≥ 1.97 average on the fill |
| Independent camps | Near | tents 5 × 4.2 u, 7 u apart | ≥ 5 × 4.2 px at the Near bottom | 1 to 4 tents countable |
| Spring stones | Near | disc r 4.5 u, symbol 7 u | 9 px disc at the Near bottom | ring 13.32:1 |
| The Wellspring illustration | every band | the approved monument × 1.4 | approved | approved |
| Mines, windmills (terrain, redundant) | Mid | about 17 u (1.3 house widths) | 6.6 px at the Mid bottom, 7.3 px at the start zoom | Hills 3.31 |
| Hero set pieces (scenery) | Far | 34 to 43 u | 13 to 17 px at the Far top | Hills 3.31 |
| Region names (no new fact) | Far and Mid under 110 px | 13 to 24 px (live) | — | 3.14 |
| Place names | every band | 11 px floor (live) | — | 10.58 |

### 2.1 The draw order

final §3.1's three layers stay. The decoration layer gains sublayers, baked in this order per
province and band (Ownership mode only; it fades in every other mode, R23):

| # | Sublayer | Content |
|---|---|---|
| D1 | Ground paint | an opaque base wash of the terrain fill, interior lift, mottle pairs, relief wash, granulation, blooms, flecks, the edge pool (inner shadow, inset by B_u on owned land) and the pooling line. The fixed zones are painted flat, feathered 4 px |
| D2 | Paper | the tooth and fibres, `soft-light` 0.5, world-locked |
| D3 | Ground textures | final §3.2's approved textures within ±8 L\* (±4 in the zones): grass stipple and wavy hedgerows, the field patchwork with hedges and furrows, infields and clearings, the canopy scallop, scree, swamp streaks and pools, wasteland cracks |
| D4 | Water | ponds, then brooks (pale water, two bank lines), then bridge decks |
| D6 | Standing items, by bottom edge | all cast shadows first (one pass), then: hills with hachures, peaks, forest clumps, other terrain stamps, mines, windmills, ruins, the hero set piece, camps (Near), spring stones (Near), land-look and pole motifs, settlements (walls, houses, landmarks, pennant), vignettes (Near) |
| D7 | Fog line art | for unexplored provinces D1 is the base and paper only, and D3 and D6 are drawn as line art (§5.3) |

(D5 is gone: tracks are live.) The paint's key is the terrain, the explored flag, the owned flag
and Map detail (H10); the stamps' keys are v2's slow keys without `tokensAt` and without the
in-sight flag.

**Live layers over the decoration, bottom to top:**

1. **State overlay** (Ownership mode, fades with the decoration): one batched fill of noisy
   polygons. Unexplored: cloth #E8DCC2 at 0.04 (the haze). Out of sight: an equal-L\* grey of the
   terrain fill at 0.10 (ΔE ≤ 0.7 from the approved 10% desaturation; the land-look wash is hidden,
   as approved). In sight with a land look: the look's wash at washMax × s / 10. A province whose
   paint bake is pending for its explored or owned flag draws its live fill here, opaque, until the
   bake lands.
2. **Region lettering** (Far and Mid under 110 px; H12; hidden while targeting).
3. **Tracks** (Mid and Near; fade with the decoration, except at full strength while commanders are
   selected and in the Passability overlay).
4. **The always-on layer**, unchanged in content: wilds (ground, peaks or ripples, contour, rim),
   borders (ink ribbons on the shared polylines, dotted where both sides are fogged), ownership
   bands with keylines and sigils (inner-aligned ribbons), ritual marks, siege camps and walls,
   pillage smoke, and the **Wellspring illustration** with its claim state (§3.6).
5. Above it, unchanged: mode overlays, labels (wild names, place names and their second line), numbers
   chips, path previews, tokens, transit arrows, selection rings, battle markers.

### 2.2 The ground paint recipe (D1, exact)

Per province, clipped to its noisy polygon. `f` = the terrain fill, `rec` = §1.4, `R` =
`streamFor('map:${seed}:${id}', 'paint')`, `D` = the median province diameter. **The zones** are the
province's fixed label, token and seat zones (§5.4) for every band, unioned, plus 4 px at each band's
widest scale, so the same zones apply at Far, Mid and Near and the same blotches survive in every band.

1. **Base:** fill the polygon with `f` at alpha 1 (the bake is opaque inside provinces, so
   `soft-light` stages blend against the paint, not against transparency).
2. **Lift:** fill with `f` lightened by 2 × `rec.lift` L\* at alpha 0.5.
3. **Mottle** (every band; skipped when `rec.M` is 0): `n = max(2, round(6 × area / meanArea))`
   pairs. Each pair draws two soft radial blotches of the same radius r = (0.10 to 0.18) × D at two
   seeded points: one `f` + `rec.M` L\*, one `f` − `rec.M` L\*, each a radial gradient from alpha 0.55
   to 0. A pair is skipped whole if either blotch's inner half touches the zones, so the sum stays
   zero and the surviving pairs are the same in every band.
4. **Relief wash** (Mountains, every band, at the Mid peak slots so it is the same in every band):
   for each passable peak, an ellipse at (x + 0.6w, y + 0.25w), rx 1.1w, ry 0.45w, drawn opaque #3A4466 into a scratch layer (so neighbors merge
   instead of stacking), then the layer composited at 0.08, clipped to the polygon minus the zones.
   The lift compensates its mean (step 14 calibrates both).
5. **Granulation** (Mid, Near): the granulation tile, world-locked, `soft-light` at `rec.G`, clipped
   to the polygon and masked by the zones with a 4 px feather (a blurred zone mask, so grain never
   stops on a hard rectangle that reads as a label plate).
6. **Blooms** (Mid, Near): `rec.B` noisy circles r(θ) = r(1 + 0.18 sin 5θ + 0.1 sin 11θ), r =
   (0.07 to 0.11) × D, at least 10 u from the edge and outside the zones: fill `f` + 4 L\* at 0.35,
   rim stroke `f` − 9 L\* at 0.30, 1.2 band px.
7. **Flecks** (§1.4 by band): seeded with `streamFor('map:${seed}:${id}', 'fleck')`, outside the zones.
8. **Edge pool:** an inner shadow. Clip to the polygon, set `shadowColor` to `f` − 28 L\* at 0.45 and
   `shadowBlur` to 4, 6 or 8 screen px (Far, Mid, Near) converted to the bake canvas's device pixels
   (`shadowBlur` ignores the transform), and let the shadow of a large rectangle minus the polygon
   (`evenodd`) fall inside. **On a province with an owner band** the casting shape also includes a
   stroke of the polygon 2 × B_u wide, so the pool begins at the band's inner edge instead of under
   the band. Draw the casting shape off the canvas and bring only its shadow in with
   `shadowOffsetX/Y`, so the shape itself never paints. Measured (no inset): mean ΔE 0.31, p5 −4.5
   L\* (`research-techniques.md` §3.3).
9. **Pooling line:** stroke the polygon, still clipped, 4.4 band px wide (2 × B_u + 4.4 band px on
   owned land) in `f` − 14 L\* at 0.35: 2.2 band px visible inside the border or the band.

Then D2 paper: the tooth tile, `soft-light`, alpha 0.5, clipped to the polygon. Wilds get no paint
and no paper: they stay the crisp, darkest ink on the map. v2's live 12% black pigment stroke along
borders is not drawn when Hand is Painted (the edge pool and pooling line replace it; judge 2:
Forest's inner border contrast already falls from 1.40 to 1.25:1).

**Paint check** (step 14, and the Playwright smoke in the game): a province's painted mean with
stamps off is within **ΔE2000 2.0** of `f`, every terrain. The research bench measured the full stack
at mean 1.74, worst 4.47 (Mountains) before calibration (`research-techniques.md` §3.5); the lift
is the calibration knob. A second run at Far with the full decoration reports every terrain pair's
ΔE between the provinces' full means (normal and each deficiency) and lists any pair under 20 / 12
for review; it is a report, not a gate, since stamps and settlements were never part of the fill rule.

### 2.3 Relief

- **Hills:** final's humps (fill +12 / −18 L\* faces, now warm-cool) plus 4 to 6 tapered hachure
  strokes on each hump's lower-right flank, radiating from the crest at 6° to 33° and 57° to 80°
  below horizontal (never within ±12° of 45°), length 0.35 to 0.55 of the hump's width, feature ink
  #3E3428 at 0.75, width `w0 · sin(πt)^0.6 + 0.2` band px with w0 0.9. Hachures belong to the hump
  (stamp class, inside its box), never spread over the ground, so ground textures keep ±8 L\*.
- **Passable Mountains:** ridge-profile peaks (`research-techniques.md` §7: midpoint-displaced
  ridges, three levels), lit face #B4C1C6 with a soft vertical wash (+4 L\* at the top), **flat**
  shade face #6E7F86 (R26), no snow, ink outline heavier at the summit (1.4 band px tapering to 0.8),
  and the relief wash beside them (§2.2 step 4). No scree tick fans: ticks at a peak's foot are the
  wild rim's vocabulary.
- **Wild peaks:** the same ridge generator with the approved colors (lit #8A857E, flat shadow
  #46423F, snow #F2EEE6 down to 40% with a ragged 3- to 5-tooth lower edge), tallest first.
- **Silhouette rule:** a passable peak's height is at most 0.8 × its base and its ridge midpoint
  displacement is rounded (two Chaikin passes); a wild peak's height is at least 1.1 × its base with
  sharp ridges. With color, snow and the rim, the two never blur.
- **Cliffs are reserved.** Only wild rims carry cliff ticks; no scarp lines anywhere else.
- **Cast shadows:** every standing stamp casts an ellipse rgba(38,42,64,0.22) centered at (x +
  0.25w, y + 0.4 u), rx 0.6w, ry 0.22w, rotated −10°.

### 2.4 Forests: painted tree clusters

- **Clumps, not scatters:** the lowest-ranked free slots become clump centers (one per 4 slots); the
  other slots join the nearest center within 1.6 crown spacings. Each clump holds 2 to 7 crowns.
- **Crown:** a lobed circle r(θ) = r(1 + 0.12 sin(kθ + φ)), k = 3 to 5; shade face (warm-cool
  shade), lit face offset (−0.22r, −0.22r) with radius 0.72r (warm lit). No fruit or blossom dots
  (Growth, Thornwood).
- **One outer outline per clump:** stroke every crown at twice the ink width (#3E3428 at 80%), then
  fill every crown over it, back to front: only the clump's outer contour keeps its ink.
- **Trunks** only under crowns with no crown within 1.2r below them (a 0.24r stub, `f` − 30 L\*).
- **Conifers:** a Forest province bordering Mountains or a peaks wild draws 70% conifer crowns
  (three jagged tiers, lit left half, shade right half); others 15%. Derived from map data.
- **Sizes:** crown r 4 to 5.5 u in Mid and Near alike; caps unchanged (30 at Mid, 60 at Near; Near
  adds crowns in more slots). Far: 4 canopy masses (clumps of 6 crowns at r 15 u, 6 px at the Far
  top).

### 2.5 Water

- **Brooks** (§3.3): pale water #BCD6D9 as a tapered ribbon, 0.6 u at the spring to 1.8 u at the
  mouth, between two bank lines #35535A at 70%, 0.7 band px; a 1.4 u spring dot at the source.
- **Ponds** (§3.3): a noisy blob squashed 0.75 vertically, #A6C7CC, a lit rim #DCEAEA (1.2 band px,
  80%) on the upper-left shore, a bank line #35535A (0.8 band px, 70%), two or three reed tufts on the
  lower shore; at Near two short ripple arcs #E9F2F2.
- **Swamp pools** stay final's #2C8C94, now with one pale ripple dash (#9FD0D4 at 70%) at Near.
- **Meres** are unchanged: near-black, ripples, rim, contour, name. Dark water means a wild.
- **Fog:** unexplored provinces show no brook, pond or bridge (H5).

### 2.6 Fields

- **Farmland patchwork** (approved): 5 to 9 fields; boundaries now hand-inked (two levels of
  midpoint displacement, amplitude 0.15); field tones ±5 L\*; furrows at 0°, 90° or ±30° in
  `f` − 12 L\* at 0.35; hedges between fields as wobbly dotted bushes (#4E5A2E at 60%, crown dots
  1.4 u every 3 u).
- **Sheaves replace haystacks** (H6: the approved half-dome haystack is the camp tent's silhouette,
  and in fog both became the same line art). A sheaf is an upright tied bundle: a waist tie two
  fifths up (#3E3428), fanned ears above (3 to 5 short strokes), splayed stalks below, 2.6 u wide at
  the ears and 4.2 u tall, in Farmland's stamp faces (lit left, shade right) with an ink outline.
  Sheaves stand in rows of 2 or 3 along the furrow direction (stooks in the stubble); every
  non-windmill Farmland stamp is a sheaf row, and Plains' rare stamp (s.v > 0.94) is a single sheaf.
  In fog, line art: an hourglass outline with the fanned ears.
- **Infields:** on Plains, Hills and Wasteland, a settlement of tier T ≥ 2 has T − 1 small furrowed
  patches (up to 4) in seeded ranked spots just outside its fixed extent, ±5 L\*: growth adds the
  next spot, decline removes the newest (final §4.2's rule). Slow key: the tier.
- **Clearings:** in Forest, trees keep out of 1.3 × the settlement extent, and that ellipse is
  lightened +5 L\* with a soft edge: a clearing in the woods.
- **Plains hedgerows** (approved, 1 or 2) are drawn wavy and dotted, so they never match Order's
  straight hedgerows.

### 2.7 Borders, bands and the outline

- **Geometry** (H3): each shared edge is subdivided only where its segment crosses the segment
  between the two sites (a convex quad), with Red Blob's recursion (`center = lerp(p, q, 0.4 +
  0.2U)`), down to 3 units on a 6400-unit province, then two Chaikin passes with fixed endpoints.
  About 6 to 11% of edges stay straight; none self-intersect on the bench seeds
  (`research-techniques.md` §5.1). Edges on the map outline stay straight.
- **Stroke:** per shared edge, a filled ribbon in #2B2620, width 2 px × (1 + 0.12 sin(2π(f1 t +
  φ1)) + 0.05 sin(2π(f2 t + φ2))), f1 in [1, 2], f2 in [3, 5], alpha 0.85 to 1 per edge. A border
  never breaks or tapers: a dotted border means fog. An edge is dotted (2/3 px) when both sides are
  fogged. Along a wild, the 3 px contour replaces it (approved).
- **Bands:** a flat strip of the banner color inside the province along its noisy polygon, width
  B = max(2.5 px, 0.0314 × the median province's on-screen diameter), **capped at 9 px at Near**
  (question 7; v2 reaches 13 px per side, about 25 px between two owned provinces), with a 1 px
  keyline on its inner edge (`keylineFor`). Drawn as inner-aligned strokes with round joins on the
  simplified polygon: the keyline as a (B + 1) px inner stroke, then the band as a B px inner stroke
  over it. No per-province masks (§7.3).
- **Neatline:** the outline keeps its 3 px #1C1A17 line and gains a 0.8 px rule at 60%, 5 px
  outside it in the margin (a double neatline).
- **Wash overrun:** outside the outline, each outer province's wash runs 2 to 4 px (seeded, noisy,
  r(t) from two sines) into the margin as an irregular lighter edge: the province's terrain fill at
  0.35 over the cloth, under the neatline, in the cloth bake (static; terrain only). It shows the
  painter's hand at the sheet's edge without an edge fade and changes no fill. Never along a wild
  (the wild's contour is the outline there).
- **Simplification:** Douglas-Peucker per shared polyline to one point per 1.5 screen px (about
  150 points per province at Far, 300 at Mid, all at Near); both sides use the same result.

### 2.8 What each zoom band shows

Far is under 70 px median province on screen, Mid 70 to 180, Near above 180 (staged docs/07).

| Layer | Far | Mid | Near |
|---|---|---|---|
| Base wash, lift, mottle, edge pool | yes (edge blur 4 px) | yes (6 px) + pooling line | yes (8 px) + pooling line |
| Granulation, blooms | — | yes | yes |
| Relief wash (Mountains) | yes | yes | yes |
| Flecks | — | lichen, rust | plus sorrel, sedge |
| Paper tooth and fibres | yes (0.4 px tooth) | yes | yes (2.3 px tooth) |
| State overlay (live) | yes | yes | yes |
| Ground textures | global patterns (approved) | per province | full |
| Relief | 2 to 4 masses (approved) | humps with hachures, peaks | same, more slots |
| Forests | 4 canopy masses | clumps, ≤ 30 crowns | ≤ 60 crowns, trunks |
| Ponds, brooks | — | yes | plus ripples, shore reeds |
| Tracks (live) | — | dots | dots |
| Fields | 2 field blocks (approved) | patchwork, sheaves, hedges, infields, clearings | full furrows |
| Mines, windmills, ruins, bridges | — | yes | yes, with detail |
| Hero set pieces | yes | yes | yes |
| Camps | — | — | domes |
| Spring stones | — | — | yes |
| Wellspring | glyph (always-on) | the illustration | plus the glow and drops in detail |
| Settlements | approved (capitals: keep plus 3 roofs, §3.8) | approved, lit | approved, lit |
| Vignettes | — | — | ≤ 1 per province |
| Region names (live) | yes | below 110 px median | — |
| Place names | by priority | yes | yes |
| Wild names | straight below 13 px | curved from 13 px | curved |
| Borders | ink, simplified | ink ribbon | ink ribbon, every point |
| Wilds, bands, tokens, chips | approved | approved | approved, bands capped at 9 px |

When the band changes, the decoration cross-fades over 150 ms and region names fade with it
(instant under reduced motion). Nothing changes position or size across a band (§2.0).

---
## 3. "More interesting": the features

### 3.1 Feature list

| Feature | Derived from | Seed key | Carries information? | Bands | Cap per province |
|---|---|---|---|---|---|
| Wash, paper, flecks | terrain fill; explored; owned | `paint`, `fleck` | no (mean = the fill) | all (flecks §1.4) | — |
| State overlay (live) | fog, land look | — | yes, as approved (fog, dominion wash) | all | — |
| Wobbling borders | geometry | `edge:${min}:${max}` | the border itself (unchanged meaning) | all | — |
| Tracks (live) | `neighbors`, seats, shared edges | `track:${min}:${max}` | **yes, redundant:** "you can march here"; none crosses a wild | Mid, Near | one per neighbor |
| Brooks | terrain, neighbors' elevation proxy, Wellspring | `brook:${id}` | no ("scenery", Codex) | Mid, Near | 1 |
| Ponds | terrain | `pond:${id}` | no | Mid, Near | 1, ≤ 4% of area |
| Mines | terrain: every Hills and Mountains province | `landmark:${id}` | terrain, redundant ("materials country") | Mid, Near | 1 |
| Windmills | terrain: every Farmland province | `landmark:${id}` | terrain, redundant ("food country") | Mid, Near | 1 |
| Ruins | seed, terrain kind table | `landmark:${id}` | no (history) | Mid, Near | 1, about 25% of provinces |
| Hero set pieces | named regions (§3.9), terrain | `hero:${regionKey}` | no (history; the terrain is public) | Far, Mid, Near | 1 per named region |
| Bridges | a track crossing a brook | — | no | Mid, Near | as crossings |
| Independent camps | owner null, the public strength word | `camp:${id}` | **yes:** weak 1, moderate 2, strong 3, fortress 4 tents (the tooltip's word) | Near | 4 tents |
| Mana spring stones | `springs`, when the view shows them | — | **yes, redundant** with the Springs mode and Near label symbols | Near | one per spring (0 to 4) |
| Wellspring illustration | `wellspring`, claim state | — | **yes** (always-on; claim state approved) | all | 1 |
| Capital at Far | capital, kit | — | redundant | Far | 1 |
| Region names (live) | connected same-terrain runs of ≥ 3 provinces | `region:${seed}` | no new fact (terrain is public) | Far, Mid under 110 px | — |
| Curved wild names | wild cells | — | the name (approved) | all (curved from 13 px) | 1 per range |
| Vignettes | terrain | `vignette:${id}` | no | Near | 1, 60% chance |

Every new mark is computed from the same `provinceView(state, viewer, id)` the tooltip uses, or from
public map data, so art never shows more than the tooltip (final §4.1 principle 6).

### 3.2 Tracks

- **One per passable neighbor pair**, never for another pair. Wilds are not neighbors, so tracks
  bend around the Ashspine and teach the rule. The Codex concept "Tracks": "Tracks join every pair
  of neighboring provinces. Travel time depends on the destination's terrain."
- **Geometry** (world units, computed once per map in `src/present/map/tracks.ts`). Constants: the
  crossing zone **Z = 12 u** (the Mid-top band plus 6), the clearance **C = 10 u** (the band plus 4),
  the junction drop **J = 9 u** (the band plus 3), the settlement's clearing **S0 = 15 u**.
  1. **The crossing.** M starts at the arc-length midpoint of the shared polyline. From M, walk
     inward on each side along the edge's local normal (perpendicular to its chord over ±6 u),
     starting at Z, until the point is at least C from every border of that province, the shared
     edge included; give up at 54 u (0.3 D) or on leaving the polygon. If either side gives up, M
     slides along the edge in steps of 5% of its length, alternating sides of the midpoint, within
     the middle half (25% to 75%). The first M that works on both sides is the crossing, and the walks'
     end points are Mi on each side.
  2. **The last segment** on each side is straight from Mi to M, perpendicular to the edge, so every
     track crosses its border at a right angle (60° or more is required). Measured: 12 u at the
     median, 18 u at the 95th percentile.
  3. **The curve** runs from S (where the ray from the seat toward Mi leaves the settlement's fixed
     ellipse, 0.75 × `settleExtent` wide and 0.5 × tall) to Mi: a quadratic whose control is offset
     by a seeded 10 to 20% of its length, plus a seeded low-frequency meander (one or two half-sines,
     amplitude 3 to 6% of the length, zero at both ends). Every sample farther than S0 from S lies
     inside the polygon and at least C from every border: **never along a border.** On failure the
     meander halves, then goes; then the offset halves, then goes to zero; then the curve bends
     through the province's label point (a quadratic whose control makes it pass the centroid; the
     label zone breaks the dots there anyway).
  4. **Junctions:** on the last segment, any dot within J of a border other than the shared one is
     dropped, so a track never draws through a corner where three borders meet.
  5. **Corner contacts:** if no M in the middle half works (a near-point contact;
     `MAPGEN.minSharedEdge` is 0.001 √area), each side's curve aims at the midpoint and stops where it
     first comes within C of any border: two dotted halves pointing at the corner, with a gap across
     it. The tooltip's neighbor list and the move preview carry the rest.
  - **Measured** on 180 game maps (seeds 1 to 30 × Small, Medium, Large × 2 and 4 nations; 39,571
    neighbor pairs; noisy edges; no meander; `tracks.out`): the seeded curve 97.0%, half offset 1.2%,
    zero offset 0.5%, through the label point 0.2%, corner contacts 1.1%; the crossing slid off the
    midpoint for 4.7%; 2.8% of last-segment dots fall to the junction rule. The first rule tried
    (crossing fixed at the midpoint, a 20 u inward point, 12 u clearance) left 19.6% of pairs with no
    valid curve.
  - Tracks end at the settlement extent, which never changes (final §4.2), so growth never moves
    them. Wild cells are never inside a province polygon, so no track crosses a wild.
- **Drawn live** (`src/render/map/tracks.ts`, one batch): round dots **1.8 px** across at alpha 1, in
  #3E3428 on Plains, Farmland, Mountains and Wasteland and #E8DCC2 on Forest, Hills and Swamp (each
  half takes its own province's ink). The spacing in world units is 2.5 px / q, where q is the zoom
  rounded down to a power of 2^(1/4); between re-layouts the spacing scales with the zoom, so it stays
  **2.5 to 3 px** on screen and dots never swim while zooming. Each dot is jittered ±15% along the
  track by `hash32(trackKey, k)`, stable across re-layouts. Gaps: no dot within 3 px of the shared
  edge (the border shows through), none under label zones plus 2 px (the cartographic knock-out),
  none at junctions (step 4). The fog's dotted border is 2 px dashes on the border; tracks are dots
  across it.
- **Contrast** (§1.6, H4): on Mountains 4.66 peak and 1.97 to 2.28 average on the fill, worst 3.76 /
  1.81 on painted interior ground in any state, against the R34 footpath's 3.00 / 1.80 at the start
  zoom. Tracks replace the footpath once step 14 confirms it on screen.
- **Modes:** tracks fade with the decoration in data modes; they stay at full strength while
  commanders are selected (move targeting) and in the Passability overlay, since adjacency is what
  those ask (not in Supply: supply is per province). They stay in Map detail Reduced and draw at full
  alpha in unexplored provinces (adjacency is public).
- **The diagram check** (judge 1): five to seven dotted spokes per seat can read as a graph. Step 15
  shoots the start view with `Tracks: Full` and `Tracks: Crossings` (at Mid only the third of each
  half nearest its border; full tracks at Near). If Full reads as a diagram, Crossings becomes the
  default (question 8).
- **Stamps keep off tracks:** a standing stamp's slot is dropped if within its radius plus 2 u of a
  track's polyline or a brook (computed once per map).
- **M1-should:** path previews follow the tracks (seat, Mi, M, Mi, seat) instead of straight
  centroid lines, with the tacks at each seat (owner question 3).

### 3.3 Brooks and ponds

- **Who gets one** (seeded): Wellspring provinces always (the brook rises at the basin); otherwise a
  brook with probability Hills 0.6, Mountains 0.6, Swamp 0.6, Forest 0.5, Plains 0.4, Farmland 0.3,
  Wasteland 0; a pond with probability Plains 0.25, Forest 0.2, Mountains 0.2, Farmland 0.15, Hills
  0.15, Swamp 0, Wasteland 0.
- **Uphill side:** an elevation proxy (peaks wild 6, Mountains 5, Hills 4, Forest 3, Plains,
  Farmland and Wasteland 2, Swamp 1, mere 0) picks the highest neighbor; the source is the free slot
  farthest toward it, the mouth the pond (if any) or the free slot farthest the other way, at least
  half a diameter from the source.
- **Route:** three levels of midpoint displacement (amplitude 0.25 of the segment), then two
  Chaikin passes. Every point must stay inside the province's polygon inset by **B_u + 6 u** and
  outside the zones; on failure the amplitude halves, then the brook is dropped. A brook may pass
  beside the settlement, never through its extent.
- **Ponds:** 1.5 to 4% of the province's area, at a free slot, inset like brooks.
- **Never a rule:** never along or across a border (by construction), no tint, no hover, faded in
  data modes, absent in unexplored provinces. The Codex line under "Tracks": "Brooks and ponds are
  scenery; dark water is a wild."

### 3.4 Landmarks and hero set pieces

| Terrain | Always | Ruins (about 25% of provinces, one of) | Hero set piece (one per named region of this terrain) |
|---|---|---|---|
| Plains | — | a broken arch; a long barrow (a grassy mound at least 2.5 times as long as tall, no opening); a three-arched aqueduct fragment | the stone feet of a fallen colossus on a plinth |
| Farmland | a windmill | an aqueduct fragment; a ruined wall with an empty window | a long ruined aqueduct of five arches striding across the fields |
| Forest | — | a fallen giant trunk with its roots; a ruined wall with an empty window; a broken arch | a giant ancient stump, flat-topped, with roots and ferns and no crown |
| Hills | a mine | three broken columns on a step; a long barrow; a broken arch | a half-buried colossal stone head, face up, eyes closed |
| Mountains | a mine | three broken columns on a step; a toppled statue (face down) | a great natural stone arch, rounded, with no cliff ticks |
| Swamp | — | half-sunken columns in reeds; a broken arch half-sunk in reeds | a great broken bridge pier with one arch, standing in reeds |
| Wasteland | — | a broken arch; three broken columns on a step; a toppled statue (face down) | a colossal toppled statue lying face down |

- **The mine:** a square timber frame (two posts and a lintel, #8C6A47 with faces) set into a small
  hillside, a dark rectangular opening inside the frame (never round: a round dark hole in a mound is
  Wild's beast den), and a fan of pale spoil stones (#CFC6B4 dots) to its right. No cart, no rails.
- **The windmill:** a stone tower (#CFC6B4 with faces), a timber cap, four sails at 22.5° + k·90°,
  never at 45° (R26).
- **Placement:** the always-landmark takes the lowest-ranked free slot at least 1.2 × the
  settlement extent from the seat; a ruin the lowest-ranked free slot at least 1.4 ×, inset B_u +
  10 u. Both leave the stamp pool.
- **Hero set pieces** (judge 1's "what lives where"): one per named region (§3.9), in the region's
  largest province, at the free slot farthest from the seat (at least 1.6 × the settlement extent),
  outside every zone, inset B_u + 12 u, at least 2 u from any track or brook; if none fits, the next
  largest province; else none. It replaces that province's ruin. **34 to 43 u wide** (2 to 2.5
  times a landmark; 13 to 17 px at the Far top, 15 to 18 px at the start zoom), the same size in
  every band, so it reads from the table's edge. Seeded by `hero:${regionKey}` (variant and mirror).
  It counts as 3 items in the density budget.
- **Drawing:** landmarks about 17 u (1.3 house widths); stone #CFC6B4, timber #8C6A47, both with
  settlement faces (§1.5); ink #1C1A17 at 0.9 band px; the cast shadow of §2.3. Heroes the same at
  their size.
- **Bridges:** where a track crosses a brook: a deck 4 u along the track and the brook's width + 3 u
  across it, #CFC6B4 with #3E3428 rails (0.8 band px); the live track's dots run over it. Bridges stay
  procedural (they align to the track).
- **Cut** (H6, §3.11): watchtowers, standing stones and circles, obelisks and lone pillars, shrines,
  cairns, huts, lumber camps, wells, sheepfolds, signposts, hollow trees, caves, cliff doorways,
  carts and wheels, anything with a flag, fire or smoke.
- **Asked changes to approved motifs** (question 9): Artifice's "a mill" becomes "a water mill with
  a wheel", so windmills stay Farmland's alone; the approved Wasteland skull stamp becomes a rock,
  since a skull is Rot's and B's.

### 3.5 Independent camps

- **When:** the province's owner is Independents, at Near only (H11). Its tents follow the public
  strength word (docs/01 §14, "Implementation decisions": weak under 16, moderate under 24, strong
  under 30, fortress at 30): 1, 2, 3 or 4 domed tents. The mockup's badge thresholds (15/25) align to
  these.
- **Drawing:** a row beside the seat, 7 u apart, starting at seat + (0.9 × `settleExtent`, 4 u):
  domes 5 × 4.2 u (half-ellipses) in the canvas faces (lit left, shade right), a 1.2 u finial tick at
  each apex, a pale door line (#E8DCC2, 0.8 band px) from the base up the middle, an ink outline of
  0.9 band px and the cast shadow. Never a dark slit or hole (the beast den), no pole, no shield (a
  small independents' token), no fire, no smoke, no spears, no triangle tents (sieges).
- **In fog:** the word is public, so unexplored provinces show the domes, finials and door lines as
  line art at Near. The silhouette test (§7.4) compares these line-art domes with the sheaves'
  line art on their own.

### 3.6 Wellsprings as illustrated features

- The approved basin monument grows to 1.4× at Mid and Near, gains a soft pale glow (radial #F4EEDF
  from 0.28 to 0 over 18 u, inside the province only) and the settlement faces.
- **While unclaimed**, its five carved drops take the five mana primaries (W #F3E6B8, U #3A7BD5, B
  #3D2B4F, R #FD6533, G #00674B) with 0.6 band px ink outlines: it yields every color (docs/01
  §13), so it may carry them. **Once claimed**, the drops are carved stone (#CFC6B4, ink outline), so
  the only colors at the basin are the stones lit in the claimer's banner (all five primaries are
  `NATION_BANNERS` entries).
- The province's brook rises at the basin.
- Claim states are unchanged: hollow or filled diamond, the priest and the 10-day ring, standing
  stones lit in the claimer's banner, the sigil. Always-on, every band.

### 3.7 Mana spring stones

- **When:** at Near (H11), where the viewer's view shows the province's springs (owned or scouted,
  docs/01 §14); never in unexplored or never-scouted provinces.
- **Drawing:** one per spring, left of the settlement at seat − (0.9 × `settleExtent` + k × 10 u,
  −6 u): a disc #E9E1CC of r 4.5 u with a 1 band px ink ring, holding the color's mana symbol (7 u) in
  its primary with a 0.6 band px ink outline (W's pale sun disc reads by its outline: 13.3:1).
  Decoration: in the Springs mode the mode's own symbols take over.

### 3.8 Capitals at Far

The Far keep glyph becomes the keep plus three roofs of the owner's kit and the pennant, at the
same footprint: the capital reads as a city from the table's edge.

### 3.9 Region names

- `regions(map, seed)`: connected components of provinces of one terrain (through `neighbors`),
  size 3 or more; the largest first, at most round(provinces / 10) (Medium 6), each at least 1.5
  name lengths from the next. A region's key is its lowest province id.
- **Names** from content syllables per terrain, unique against every province and wild name:
  Forest "Grey Elder Moss Raven Thorn Deep Old" + "wold, weald, holt"; Swamp "Black Reed Sallow
  Sedge" + "Fens, mire, Marsh"; Hills "Red Barrow Wind Long High" + "Downs, Tors, Knolls"; Mountains
  "Iron Cold High Grey" + "Uplands, Heights, Scarps" (never the wilds' "spine, teeth, fells");
  Plains "Gold Wide Broad Lark" + "Meads, Leas, Plain"; Farmland "Wheat Barley Honey Mill" + "Vale,
  lands, Furrows"; Wasteland "Salt Dust Red Scour" + "Barrens, Waste, Flats". Each takes "the".
- **Deny list:** `tests/content/mapNames.test.ts` checks every prefix and suffix combination, every
  wild name, and every province name the generator makes on seeds 1 to 30 at each size against
  `tests/fixtures/deniedPlaceNames.ts` (the inspiration's region, city and landmark names and other
  famous game and fiction place names; whole names and multi-word runs, case-insensitive). A hit
  fails the test, and the fix is a syllable change.
- **Layer and priority (H12):** a live lettering layer above the decoration and the state overlay,
  below tracks, borders, bands, wilds and every label. Region names are placed after every other
  label: no glyph box (plus 2 px) may overlap a place-name box, a wild-name glyph, a token zone or a
  seat zone, and no other label ever yields to a region name.
- **Placement:** along the run's principal axis through its area-weighted centroid, 0.84 of its
  extent long, bowed 8% (side seeded), set on the curve (§4.3), every glyph's center inside the run.
  On a collision try perpendicular offsets of ±0.25 D and ±0.5 D, then lengths 0.7 and 0.56, then
  90% size, then a straight line along the axis; otherwise none.
- **Sizes and ink:** Marcellus SC, letter-spaced 0.3 em; 15 to 24 px by the run's size at Far, 13
  to 15 px at Mid while the median province is under 110 px (fading out from 100 to 110 px); ink
  #2A1F14 or #F4EEDF by the run's terrain at 90% over a knock-out halo of the run's fill at 50%,
  3 px. Hidden while targeting and in data modes.

### 3.10 Vignettes (Near only)

One per province with probability 0.6, at a free slot clear of tracks and brooks by 3 u: a flock of
3 to 5 sheep (Plains, Hills; #EFE9DC with ink heads), two deer (Forest edge; #8C6A47), a grey heron
in reeds (Swamp; pale #B9C2C6), three goats on a flat rock (Mountains; #D8CBB0), two cows (Farmland;
#EFE9DC with #8C6A47 patches), a hare sitting up (Wasteland; #B59A7A). Each 5 to 8 u, with an ink
outline and a cast shadow. No people, riders, carts, dark birds or birds in flight; nothing that
moves. Birds are pale (crows are Dread's and battle scars').

### 3.11 Shape families and cuts

**The rule (H6):** every drawable in content declares a `family`. Scenery may use only scenery
families. The test compares silhouettes too (§7.4), because an id list cannot see a shape.

| Reserved family (greyscale silhouette at Mid) | Reserved for | What scenery does instead |
|---|---|---|
| Dome, aspect 1 to 1.4, with a finial | independent camps (Near) | sheaves are upright hourglasses; mounds are long (aspect ≥ 2.5) |
| Dome or mound with a dark opening | Wild's beast den | the mine's opening is a square timber frame; no caves |
| Triangle tent | siege camps (banner colors) | — |
| Single tall stone or spire (height ≥ 2 × width) | Lore and Thornwood standing stones, claimed Wellspring stones, W marker stones, Order milestones, Cinder obsidian shards, the Cinder lab spire | columns stand in threes on a step or lie half-sunk; no obelisks or lone pillars |
| Stack of stones | Cinder, Fury and B cairns; battle grave cairns | spoil is a flat fan of dots |
| House, hut, roofless walls in a ring | settlements (population, decline) | ruins are single walls with an empty window, arches, columns, aqueducts |
| Tower, palisade, wall ring | PD walls and the watchtower | the windmill is Farmland's alone (terrain-coded) |
| Gabled shrine, candle, chapel | Sanctity, Order, the independents' temple | — |
| Rising wisp or column | pillage, unrest, Turmoil, Burn the Fields | no dust devils, mist plumes or chimney smoke |
| Dark bird | Dread crows, battle-scar crows | the heron is pale and standing |
| Cart, wheel, broken fence | Turmoil (the approved upright yard cart stays inside settlements at Near) | no haywain, no mine cart |
| Bones, skulls | Rot, B | the Wasteland skull stamp becomes a rock (question 9) |
| Flag, pennant, banner, shield | ownership, the independents' token | no camp pole or shield |
| Cliff ticks, scarp lines; snow | wild rims; wild peaks | passable peaks are lower and rounder (§2.3); the natural arch has no ticks |
| Straight hedgerow | Order | hedgerows are wavy and dotted |
| Solid pale path | Sanctity, Radiance | tracks are dots with gaps at least the dot's size (paper-ink dots are ΔE 5.9 from the pale-stone path, so form carries it; `final.out` §D) |
| Free pale dots | Thornwood's meadow (#EFE7CF) | flecks are rust, ochre or olive, or heads on stalks |
| Grey stipple | Cinder's ash drifts | — |
| Ring of dots or mushrooms | Rot's fungus rings | flecks scatter by blue noise, never in rings or rows |
| Fruit or blossom in crowns; outsized crown | Growth; Thornwood's blossom and elder tree | crowns are plain; the hero stump has no crown |
| Bare dead tree | Rot | the fallen trunk lies flat with its roots |
| Gibbet | Dread | — |
| Brazier, ember dot | Cinder | — |
| Water mill with a wheel; quarry scar; stone field walls | Artifice | windmills on Farmland; spoil fans |

**Cut, and why:**

| Idea | Why cut |
|---|---|
| Decorative watchtowers | the PD 1 to 4 wall stage |
| Standing stones, stone circles, obelisks | single tall stones (above) |
| Shrines, wayside chapels | Sanctity and Order motifs, the independents' temple |
| Cairns, grave mounds of stones | Cinder and Fury motifs, battle scars |
| Huts, lumber camps, sheepfolds | read as houses and walls: population and PD |
| Caves, cliff doorways | the beast den; cliffs mean impassable |
| Carts, haywains, wheels | Turmoil's toppled cart |
| Dust devils, mist, smoke | smoke means pillage, unrest and Turmoil |
| Geese, crows, any dark bird | Dread and battle scars |
| Domed haystacks | the camp tent's silhouette (replaced by sheaves) |
| Plains wildflowers | Thornwood's meadow dots |
| The flat-topped striped mesa | invites hatching; not a landmark |
| Scree tick fans at passable peaks | ticks at a peak's foot are the wild rim's |
| Water in unexplored provinces | a solid line in dotted fog reads as a border |
| Rivers between provinces | read as rules (H5) |
| Color bleeding across borders | muddies the border where distinctness matters most |
| Paper gaps along borders | a light line on dark fills reads as a keyline (§1.6) |
| A scale bar | distance is not time in FM (destination terrain decides) |
| Graticules | a grid is the reserved cross-hatch |
| Sketches in the fog (beasts, ships) | imply hidden information |
| Margin vignettes of capitals | the margin is 26 units; tiny, and it duplicates the outliner |
| A warm-cool sheet gradient, an edge fade | light on the cloth (R19) |
| Ring stains, burns, dark corners | the clean-paper principle (§1.2) |
| Animated water or vignettes | motion on the map competes with tokens and the walk bob |

---

## 4. Lettering

### 4.1 Faces (Google Fonts, OFL; self-hosted woff2 in the game)

| Role | Face | Why |
|---|---|---|
| Place names | **Alegreya** 500 (capitals 700) | a literary serif with a calligraphic rhythm, the best small-size serif in the set; pairs with the chrome's Alegreya Sans |
| Wild names | **Alegreya** italic 500 (was Alegreya Sans italic) | the approved color, sizes and spacing; now serif and curved |
| Region names | **Marcellus SC** (already loaded) | classical titling capitals, the cartouche's face, spaced wide |
| Cartouche | Marcellus SC (unchanged) | — |
| Chrome, chips, numbers | unchanged (Alegreya Sans, IBM Plex Sans Condensed) | approved |

Mockup link: add `&family=Alegreya:ital,wght@0,500;0,700;1,500` to the existing Google Fonts URL.
Game: `src/assets/fonts/` gains Alegreya 500, 700 and 500 italic (latin subset woff2, about 30 to 45
KB each) with `OFL.txt`. In Pixi, place names, wild names and region names are `BitmapText` from
`BitmapFont`s rasterized at 2× (Alegreya 500 and 700 with the paper halo baked as an outline, Alegreya
italic, Marcellus SC), so every name batches in a draw call or two (§7.3).

### 4.2 Sizes per zoom (CSS px at UI scale 100%)

| Label | Far | Mid | Near |
|---|---|---|---|
| Place name | 11 (capital 12, 700), by priority | **11 at the band's bottom to 13 at its top**, linear in the median province's on-screen size (capital +1) | 13 to 15, the same way (capital +1) |
| Wild name | 11 to 13, straight | 12 to 16 by area (approved 11 to 16); curved from 13 | 15 to 20, curved |
| Region name | 15 to 24 by the run's size, letter-spaced 0.3 em | 13 to 15 while the median province is under 110 px | — |

Never below 11 px. Measured at the mockup's start zoom (77 px median, `labels11.out`): the ramp gives
11.1 px; names are 1.08 × v2's width (a fixed 13 px was 1.26 ×); 11 of 60 fill more than 80% of their
province's width (v2: 4; fixed 13 px: 26) and none is wider than its province (fixed 13 px: 6). The
Mid label budget stays 96 × 30 px and 2 lines; box widths are measured with the new face and include
the halo. **The label test** (final §3.5, extended) runs at the start zoom and one Near zoom on Medium
seeds 1 to 5: at least 90% of provinces keep a visible name, no label overlaps a token zone, curved
labels test glyph by glyph.

### 4.3 Curved labels

- **Wild names** curve only at 13 px or more; below that they are set straight (v2's placement).
  The spine: for a range of 2 or 3 cells, a polyline through the cells' centroids ordered along the
  principal axis, extended 10% at both ends, two Chaikin passes; for one cell, an arc along its long
  axis with a sagitta of 6% of its length.
- **Peaks keep out of the name:** in every band, Far included, the wild's name is laid out first
  and its peaks are placed after, outside the curved name's glyph boxes plus 2 px (or v2's straight
  box when the name falls back). On snow the name would be 1.10:1 and on a lit face 2.89:1; on the
  granite ground it is 11.40:1.
- **Region names** follow the bowed axis of §3.9.
- **Setting text on a path:** resample the path at equal arc steps; place each glyph at its kerned
  advance (prefix measurements) plus manual tracking (`ctx.letterSpacing` is too new to rely on);
  rotate to the tangent; flip the path if it runs right to left (keep upright); reject the layout
  if two adjacent glyphs turn more than 45° (Mapbox's `text-max-angle`); try 90% size, then a
  straight line; else skip (`research-techniques.md` §10).
- **Collision:** curved labels contribute one oriented box per glyph to the label test.
- **Province names stay straight.**

### 4.4 Halos

- **Place names (default, H8):** ink #2A1F14 filled over a halo stroke of #F2EAD6 at 85%, 3 px,
  round joins: lettering on a breath of paper (10.58:1 at worst).
- **The approved style (A/B):** #F4EEDF on rgba(20,18,15,.85), 3 px.
- **Region names:** a knock-out halo of the run's terrain fill at 50%, 3 px, under translucent ink
  (3.14:1 at worst on the ground, 3.08:1 over stamp faces).
- **Wild names:** no halo (approved).
- The second line (dominion chip, glyph discs) is unchanged.

---

## 5. Readability guard

### 5.1 Map modes

- In every mode but Ownership the decoration layer, the state overlay and the region names fade out
  over 150 ms (R23): paint, paper, flecks, textures, water, landmarks, heroes, camps, spring stones,
  vignettes. Tracks fade too, except in the Passability overlay. The mode tints a plain fill, exactly
  as tested.
- The always-on layer (wilds, borders, bands, marks, the Wellspring) keeps full contrast in every
  mode. The borders' wobble stays, since it is the geometry.

### 5.2 Selection and targeting

- While commanders are selected (move targeting) or a ritual is targeting, the decoration layer
  dims to **60%** over 150 ms and region names hide; the 45° move hatch and the ritual hop outline
  read on a quieter ground. Tracks stay at full strength during move targeting (adjacency is the
  question). Labels, bands, wilds, tokens, chips and the path thread are unchanged.
- Hovering a province changes nothing in the decoration.

### 5.3 Fog

- **Unexplored** ("not yet painted"): D1 is the terrain base and the paper tooth only (no mottle, no
  edge pool, no flecks), under the live haze: bare cloth with a breath of color. Terrain stamps,
  sheaves, the landmark and the hero set piece are line art in the fog sepia #3E3428 or #E8DCC2 per
  fill (final §3.10); camps are line-art domes at Near; tracks are full dots (adjacency is public).
  No brook, pond, bridge or spring stone; no settlement beyond the sketched hut. Region names show
  (terrain is public).
- **Out of sight:** painted, under the live equal-L\* grey at 10% (R18's desaturation, ΔE ≤ 0.7) with
  the land-look wash hidden; spring stones as last known (Near).
- Every input is `provinceView` or public map data; the fog guard test covers the new outputs.

### 5.4 The density budget

**Fixed zones** (H10): every province has, per band, a label zone (the name box at the band's widest
scale and font, plus the second line), a token zone (centered on the badge anchor, wide enough for
`UI.tokenZoneStacks` stacks: 3 at Far and Mid, two nations and the independents in M1, and 4 fanned
tokens with a standee at Near; tall enough for the badge and its ETA plate) and a seat zone (the
settlement's fixed extent). Each is padded 4 px at the band's widest scale. They never depend on
armies. More stacks than the zone holds draw over the decoration (tokens have opaque plates,
outlines and contact shadows), and the label test covers the cap case.

| Item | Mid | Near |
|---|---|---|
| Standing items (stamps, sheaves, landmarks, ruins, the hero, camp tents, spring stones, motifs) | ≤ 30 per average province (unchanged) | ≤ 60 |
| Coverage of standing items and ponds | ≤ 60% (unchanged) | ≤ 75% |
| Brooks, ponds, terrain landmark, ruin or hero, vignette | ≤ 1 each | ≤ 1 each |
| Flecks | §1.4 coverage, not counted as items | same |
| Tracks (live) | one per neighbor, 1.8 px dots | same |
| Zones (label, token, seat, plus 4 px) | no standing item, no water, no fleck, tracks broken; paint flat, feathered 4 px | same |

**Allocation order** when a province's slots run out: information marks first (camps and spring
stones, Near), then the terrain landmark (mine or windmill), then the hero set piece (3 items),
then land-look and pole motifs within their approved share (at most 30% of slots), then the ruin,
then the vignette (Near), then terrain stamps fill what is left. Settlements are outside the cap, as
approved (at most 22 houses and 4 landmarks).

The label test (final §3.5) also checks spring stones, camps, landmarks, heroes, bridges and
vignettes against every label, token and seat zone, and curved labels by glyph boxes.

### 5.5 Colorblind checks

Every new information mark carries a non-hue channel: tracks by placement (across borders, dots),
camps by count and dome shape, spring stones by symbol, the Wellspring by its basin and diamond,
wilds by darkness and rim. The painted extremes keep the band rule in every state (0 fails). Terrain
means keep 20 / 12 in every approved state, and texture keeps H13's floor of 19.5 / 11.0 at the blotch
peak (measured 19.6 / 11.4). The mockup's Vision control (Protan, Deutan, Tritan) is part of the
review (step 15).

### 5.6 Settings

Map detail **Full**: everything here. **Reduced**: no paint (D1 is the flat terrain fill, as Phase
8), no paper, no flecks, stamps at half density (approved), no vignettes; the state overlay, tracks,
water, landmarks, heroes, camps, spring stones and region names stay (cheap, and Reduced never removes
information).

---
## 6. Owner-made art (ChatGPT images)

### 6.1 What can be an image

| Entry | Image | Size | File (`art-inbox/map/`) | Lands at (`src/assets/raster/map/`) | Budget | Fallback |
|---|---|---|---|---|---|---|
| H1 | Paper tile (seamless) | 1024 × 1024 | `paper__{x}.png` | `paper.webp`, 512² grey | ≤ 80 KB | procedural tooth and fibres |
| H2 | Broadleaf clumps (16) | 1024 × 1024 | `trees-broadleaf__{x}.png` | `trees-broadleaf.webp` + `.json` | ≤ 180 KB | the clump generator (§2.4) |
| H3 | Conifer clumps (8) and single trees (8) | 1024 × 1024 | `trees-conifer__{x}.png` | `trees-conifer.webp` + `.json` | ≤ 180 KB | the clump generator |
| H4 | Hills (8) and snowless peaks (8) | 1024 × 1024 | `relief__{x}.png` | `relief.webp` + `.json` | ≤ 180 KB | humps and ridge peaks (§2.3) |
| H5 | Landmarks (12) | 1024 × 1024 | `landmarks__{x}.png` | `landmarks.webp` + `.json` | ≤ 180 KB | code paths (§3.4) |
| H6 | Title cartouche frame (H6b: flowing-curve A/B) | 1536 × 1024 | `cartouche__{x}.png`, `cartouche-b__{x}.png` | `cartouche.webp` (the chosen one) | ≤ 120 KB | the ink scroll frame |
| H7 | Compass rose | 1024 × 1024 | `compass__{x}.png` | `compass.webp` | ≤ 60 KB | the procedural rose |
| H8 | Corner ornament, top-left, mirrored (H8b: flowing-curve A/B) | 1024 × 1024 | `corner__{x}.png`, `corner-b__{x}.png` | `corner.webp` (the chosen one) | ≤ 60 KB | the double neatline alone |
| H9 | Vignettes (6), after H2 | 1536 × 1024 | `vignettes__{x}.png` | `vignettes.webp` + `.json` | ≤ 100 KB | code paths (§3.10) |
| H10 | Wellspring basin, after H2 | 1024 × 1024 | `wellspring__{x}.png` | `wellspring.webp` | ≤ 60 KB | the approved basin |
| H11 | Hero set pieces (7), after H2 | 1536 × 1024 | `heroes__{x}.png` | `heroes.webp` + `.json` | ≤ 200 KB | code paths (§3.4) |

**Stays procedural:** wild peaks and ripples (information, measured colors, flat shadow faces),
settlements and kits (grow house by house, kit tones tested), tracks, bridges (aligned to the
track), brooks, ponds, flecks, borders, bands, labels, and every information mark (camps, spring
stones, the Wellspring's claim state).

**Budget:** map sheets ≤ 1.4 MB (only the chosen variant of an A/B ships), loaded after the first
frame; the procedural art draws first and the next bake swaps in the raster. docs/09's raster cap
rises from 2 MB to 3.4 MB (§8).

**Order:** H1, H2 and H6 first (they change the feel most); H3 to H5 and H11 once H2 is approved as
the family anchor; H7 to H10 last. **In the mockup, at once:** "Try your art" (§9 step 5) puts H1,
H2, H3 and H4 on the map the moment a sheet passes its intake, so the owner judges ChatGPT art in
place while making it (question 5). In the game, raster integration stays last in the cut order
(R29).

### 6.2 How the owner uses these prompts

- One image per request in ChatGPT; download the PNG.
- **To see it on the map now:** open the mockup, press "Try your art", pick the entry (H1 paper, H2
  broadleaf, H3 conifers, H4 hills and peaks) and the PNG. The mockup runs the intake's alpha,
  component and color checks, recolors the sheet (§6.5) and redraws the map with it beside the
  procedural look; nothing leaves the browser.
- **For the game:** rename the PNG as the table says, drop it in `art-inbox/map/`, run
  `npm run art:intake`, and approve on the contact sheet.
- Paste the prompt exactly, with one substitution: where it says `[style sentence]`, paste the
  style sentence block below in its place. `{x}` in a file name is anything. For H3, H4, H5, H9,
  H10 and H11, attach the approved H2 image as "Image 1: style reference" and keep the prompt's first
  sentence, which tells ChatGPT what to preserve.
- **Transparent backgrounds:** ask as written. If the image shows a checkerboard painted into it,
  or a solid color behind the items, reply: "Make the background truly transparent (an alpha
  channel), not a drawn checkerboard. Change nothing else." If that fails twice, reply: "Put the
  items on a perfectly flat pure white background (#FFFFFF) with nothing else. Change nothing
  else."; the intake keys white out (luminance above 250 and chroma under 4 becomes transparent,
  with a 2 px feather), which works because every item has an ink outline.
- If ChatGPT adds letters, a frame or a signature: "Remove all text, letters, numbers, signatures
  and frames. Change nothing else."

**The style sentence** (repeated in every prompt below, never naming a game, studio or artist):

```text
Style: hand-painted fantasy map art, as in a finely illustrated atlas: confident sepia-brown ink
linework of lively, varying weight; transparent watercolor washes that pool slightly darker at
their edges and let warm paper show through; soft pigment granulation; muted, natural, slightly
desaturated colors; one soft light from the upper left, warm on lit sides, with cool blue-grey
shadows on the lower right. Luminous, airy light; refined, delicate detail; clean paper without
heavy aging, burns, stains or grunge. Calm, elegant and readable.
```

### 6.3 Prompts

**H1. Paper tile** (square 1024 × 1024)

```text
A seamless, tileable texture of warm off-white handmade watercolor paper, seen straight on and
filling the whole square image. A fine cold-press tooth, soft irregular mottling a few percent
lighter and darker, and faint short paper fibres that mostly run left to right. Very low contrast.
Even, flat lighting: no shadows, no gradient across the image, no vignette, no darker corners.
Color near #E8DCC2. Clean, fresh paper: no aging, no stains, no burns, no folds, no creases, no torn
edges, no woven or grid pattern, no diagonal lines, no drawings, no text, no letters, no logos, no
border. The left edge must continue seamlessly into the right edge, and the top edge into the
bottom edge. Square image.
```

- **Intake:** wrapped seams mean ΔE2000 ≤ 3; converted to luminance; mean set to 128 and contrast
  clamped to ±20; gradient-orientation energy within 10° of 45° and 135° ≤ 10% (R26); no FFT peak
  above 6× the median off the center (no grid); downscaled to 512².

**H2. Broadleaf tree clumps** (square 1024 × 1024; the family anchor)

```text
A sheet of 16 separate small illustrations of broadleaf tree clusters for a top-down fantasy map,
arranged in a loose 4 by 4 grid with wide empty space around every cluster so that no two touch
and none touches the edge of the image. Each cluster is 2 to 6 round, softly lobed tree crowns
overlapping one another, seen from above at a slight three-quarter angle, the way trees are
painted on an illustrated map. Each cluster has one clean sepia ink outline around its outer
edge and only light, broken lines inside; a lit side toward the upper left, a darker shadow side
toward the lower right, and a small soft cool grey shadow on the ground to its lower right.
Vary them: small and large, tight and loose, one or two with a slightly taller tree. Muted mid
greens with warmer lit edges.
[style sentence]
Transparent background. No ground, no grass, no paper texture behind the clusters, no trunks
except a short stub under the front trees, no flowers, no blossom, no fruit, no text, no letters,
no numbers, no signature, no frame. Square image.
```

**H3. Conifers and single trees** (square; attach H2 as Image 1)

```text
Image 1 is the style reference: match its ink line, washes, light direction, shadow and scale
exactly. A sheet of 16 separate illustrations on a transparent background, in a loose 4 by 4 grid
with wide empty space around each and none touching the edge. Top two rows: 8 clusters of 2 to 5
conifers with narrow, pointed, layered crowns, overlapping, one clean sepia outline around each
cluster's outer edge. Bottom two rows: 8 single round broadleaf trees with a short trunk, each
alone. Same light from the upper left and the same small cool shadow to the lower right of each.
[style sentence]
Transparent background. No ground, no snow, no dead or bare trees, no text, no letters, no
signature, no frame. Square image.
```

**H4. Hills and snowless peaks** (square; attach H2 as Image 1)

```text
Image 1 is the style reference: match its ink line, washes and light exactly. A sheet of 16
separate illustrations on a transparent background, in a loose 4 by 4 grid with wide empty space
around each and none touching the edge. Top two rows: 8 low, rounded hills seen from the side at
a slight angle, each with a few short curved slope strokes on its lower-right side only, following
the fall of the slope. Bottom two rows: 8 small, low, rounded rocky peaks in side profile, each no
taller than it is wide, alone or in groups of two or three, each with a lit left face and a darker,
flat, untextured right face, and an ink outline that is heavier near the summit. No snow anywhere.
Muted ochre and grey-blue washes.
[style sentence]
Transparent background. No trees, no snow, no cliffs, no sharp spires, no straight diagonal
hatching across whole shapes, no cross-hatching, no tick marks at the feet, no text, no letters,
no signature, no frame. Square image.
```

**H5. Landmarks** (square; attach H2 as Image 1)

```text
Image 1 is the style reference: match its ink line, washes, light and shadow exactly. A sheet of
12 separate small landmark illustrations for a top-down fantasy map, on a transparent background,
in a loose 4 by 3 grid with wide empty space around each and none touching the edge, all seen
from above at a slight three-quarter angle, each with a small soft cool shadow to its lower right:
1 a broken stone arch; 2 three broken columns standing together on a low stone step; 3 a
timber-framed mine entrance set into a small grassy hillside, a square frame of two posts and a
lintel around a dark square opening, with a small fan of pale spoil stones beside it; 4 a stone
tower windmill with a timber cap and four sails turned a little from upright, never at 45 degrees;
5 a row of half-sunken columns among reeds and still pale water; 6 a long, low grassy burial mound
with no opening, three times as long as it is tall; 7 a fallen giant tree trunk lying flat with its
roots; 8 a stone statue lying face down; 9 a ruined stone wall fragment with one empty window; 10 a
three-arched ruined aqueduct segment; 11 a broken stone arch half-sunk in reeds; 12 a smaller
broken arch with its keystone fallen at its foot. Weathered pale stone, grey-brown timber, muted
moss greens only in crevices.
[style sentence]
Transparent background. No people, no animals, no birds, no flags, no banners, no pennants, no
fire, no smoke, no tents, no carts, no wheels, no caves or round dark holes, no cliffs, no standing
stones, no obelisks, no single pillars, no stone circles, no shrines, no candles, no towers other
than the windmill, no stacked-stone cairns, no skulls or bones, no houses or huts, no wells, no
fences, no bridges, no bright colors, no text, no letters, no signature, no frame. Square image.
```

**H6. Title cartouche** (landscape 1536 × 1024)

```text
An ornate but restrained title cartouche for a fantasy map, on a transparent background: a wide
horizontal frame of scrolled parchment ends and fine strapwork, drawn in sepia-brown ink with a
pale warm parchment wash, oak leaves and acorns curling from both ends, a little cool shadow under
the scrolls. The frame fills about 80% of the image width and a third of its height, centered.
The center of the frame is an EMPTY, blank, pale parchment panel with nothing on it, ready for a
title to be added later.
[style sentence]
Transparent background outside the frame. No letters, no words, no numbers, no symbols, no coats
of arms, no crowns, no flags, no figures, no signature. Landscape image.
```

**H6b. Title cartouche, flowing curves** (landscape 1536 × 1024; the A/B to H6)

```text
An elegant title cartouche for a fantasy map, on a transparent background: a wide horizontal frame
of long, flowing, organic curves in the spirit of Art Nouveau, the sweeping lines ending in oak
leaves and acorns, drawn in sepia-brown ink with a pale warm parchment wash and a little cool
shadow under the curls. The frame fills about 80% of the image width and a third of its height,
centered. The center of the frame is an EMPTY, blank, pale parchment panel with nothing on it,
ready for a title to be added later.
[style sentence]
Transparent background outside the frame. No letters, no words, no numbers, no symbols, no coats
of arms, no crowns, no flags, no figures, no faces, no signature. Landscape image.
```

**H7. Compass rose** (square 1024 × 1024)

```text
An elegant eight-pointed compass rose for a fantasy map, on a transparent background, centered
and filling about 80% of the image: four long main points and four shorter ones between them, the
north point slightly longer with a small leaf-shaped tip, a thin double ring behind the points.
Sepia-brown ink linework, each point split into a lit half and a shaded half in pale parchment
and soft grey-brown washes, light from the upper left.
[style sentence]
Transparent background. No letters (no N, E, S or W), no numbers, no degree marks, no symbols, no
text, no signature. Square image.
```

**H8. Corner ornament** (square 1024 × 1024)

```text
One ornamental corner piece for the top-left corner of a fantasy map's border, on a transparent
background: two thin straight ink rules meeting at a right angle in the top-left of the image, and
at the corner a small, restrained cluster of oak leaves and acorns with a curl of strapwork,
extending no more than a third of the way along each rule. Sepia-brown ink with pale parchment and
muted green-brown washes, light from the upper left.
[style sentence]
Transparent background. Nothing in the rest of the image. No letters, no symbols, no animals, no
faces, no signature. Square image.
```

**H8b. Corner ornament, flowing curves** (square 1024 × 1024; the A/B to H8)

```text
One ornamental corner piece for the top-left corner of a fantasy map's border, on a transparent
background: two thin ink rules meeting at a right angle in the top-left of the image, and at the
corner a restrained spray of oak leaves and one acorn on long, flowing, organic curves in the
spirit of Art Nouveau, extending no more than a third of the way along each rule. Sepia-brown ink
with pale parchment and muted green-brown washes, light from the upper left.
[style sentence]
Transparent background. Nothing in the rest of the image. No letters, no symbols, no animals, no
faces, no signature. Square image.
```

**H9. Vignettes** (landscape 1536 × 1024; attach H2 as Image 1)

```text
Image 1 is the style reference: match its ink line, washes, light and shadow exactly. A sheet of
6 separate tiny illustrations for a top-down fantasy map, on a transparent background, in two rows
of three with wide empty space around each, seen from above at a slight three-quarter angle, each
with a small soft cool shadow to its lower right: 1 a flock of five sheep; 2 two deer; 3 a pale
grey heron standing in a few reeds; 4 three mountain goats on a small flat rock; 5 two pale cows
with brown patches; 6 a hare sitting up. Calm animals standing still on the ground.
[style sentence]
Transparent background. No people, no riders, no carts, no wagons, no dark birds, no birds in
flight, no buildings, no fences, no flags, no text, no letters, no signature, no frame. Landscape
image.
```

**H10. Wellspring basin** (square; attach H2 as Image 1)

```text
Image 1 is the style reference: match its ink line, washes and light exactly. One small
illustration, centered, on a transparent background: a sacred spring for a fantasy map, a round
weathered stone basin set into the ground and brimming with clear pale water, a thin brook running
out of it toward the lower right, soft moss and a few reeds around the stones, a faint pale mist
above the water. Seen from above at a slight three-quarter angle, with a small soft cool
shadow to the lower right.
[style sentence]
Transparent background. No standing stones, no statues, no colored lights, no glowing symbols, no
crystals, no people, no text, no letters, no signature, no frame. Square image.
```

**H11. Hero set pieces** (landscape 1536 × 1024; attach H2 as Image 1)

```text
Image 1 is the style reference: match its ink line, washes, light and shadow exactly. A sheet of
7 separate large ruin and landmark illustrations for a top-down fantasy map, on a transparent
background, in two rows (four above, three below) with wide empty space around each and none
touching the edge, all seen from above at a slight three-quarter angle, each with a small soft cool
shadow to its lower right: 1 the giant stone feet of a fallen colossus standing on a square plinth,
broken off at the ankles; 2 a long ruined aqueduct of five arches; 3 a giant ancient tree stump
with a flat top, thick roots and a few ferns, with no branches and no leaves above it; 4 a colossal
carved stone head lying half buried in the ground, face up, eyes closed; 5 a great natural rock
arch, smooth and rounded; 6 a great broken stone bridge pier with one arch, standing alone in
reeds; 7 a colossal stone statue lying face down, broken in two. Weathered pale stone and
grey-brown wood, muted moss greens only in crevices.
[style sentence]
Transparent background. No people, no animals, no birds, no flags, no fire, no smoke, no dark
water, no caves or dark holes, no cliffs, no standing stones, no obelisks, no towers, no houses,
no skulls or bones, no swords, spears or other weapons, no bright colors, no text, no letters, no
signature, no frame. Landscape image.
```

### 6.4 Intake checks (`scripts/art-intake.ts`, kinds `map/*`)

- **Alpha:** PNG with an alpha channel; at least 40% of pixels fully transparent (sheets), or the
  white key-out applied. **Fake transparency:** a periodic two-grey checker of 8 to 16 px tiles in
  the "background" is refused with "fake transparency; ask again".
- **Components:** alpha above 0.5, connected, at least 0.2% of the image each; the count matches the
  entry (16 for H2 to H4, 12 for H5, 6 for H9, 7 for H11, 1 for H6, H6b, H7, H8, H8b and H10) within
  ±2; none touches the image edge.
- **Light:** for at least 75% of components, the upper-left half's mean luminance exceeds the
  lower-right half's.
- **Ink:** at least 3% of each component's opaque pixels darker than 25% luminance (an outline).
- **Reserved patterns:** gradient-orientation energy within 10° of 45° or 135° ≤ 10% per component
  (a windmill with sails at 45° fails here).
- **Silhouettes (H6):** each component's alpha mask, normalized to its bounding box, against every
  reserved family's mask (§7.4): an IoU of 0.7 or more flags the component on the contact sheet
  with the family's name ("reads as a cairn"); a flagged component is not used until the owner
  approves it or asks again.
- **Color:** H5 to H11: 99th-percentile chroma C\* ≤ 30 (near-neutral). H2 to H4: any color (they
  are recolored).
- **Text:** the owner confirms "no letters" on the contact sheet.
- **Contact sheet:** for every component, side by side: the raw image, the recolored result (§6.5),
  and the result on the map at Mid size on its terrain's paint. ChatGPT art comes back in the
  terrain faces, and the owner sees that before approving.
- **Output:** each component framed in a 256² cell (H9: 128²; H11: 512²), centered, its base on a
  baseline at 85% of the cell, packed into a 1024² (or 2048 × 1024) atlas with a JSON of frames,
  kinds and anchors; WebP quality 85; the provenance sidecar as final's "Provenance".

### 6.5 Recoloring at use

- **Terrain sheets (H2 to H4):** per pixel, luminance L; ink where L < 0.22 (feature ink #3E3428 at
  the pixel's alpha); otherwise mix(shade face, lit face, smoothstep(0.35, 0.8, L)) with the
  terrain's warm-cool faces (§1.5), keeping alpha. The image supplies form and brush; the palette
  stays the palette (H9). Conifers on Forest use Forest's faces; hills on Hills, peaks on
  Mountains.
- **Neutral sheets (H5 to H11):** drawn as they are, with the cast shadow from the image itself.
  The cartouche's title stays procedural Marcellus SC; the compass's "N" stays procedural.
- **Variants:** each frame is a variant; slots pick frames by seed (`frame = hash32(seed, id, slot)
  mod frames`); a mirror flag doubles variety. Missing or refused sheets fall back per entry.
- **One implementation:** `src/present/map/recolor.ts` is pure (pixels in, pixels out), and the
  mockup's "Try your art" ports the same function, so what the owner sees in the mockup is what the
  game will draw.

---

## 7. Performance and baking

### 7.1 Cost (from `research-techniques.md` §11, software raster, 105-province bench)

| Stack | Far sheet | Mid sheet | Near 512² tile |
|---|---|---|---|
| Flat fill and ink borders | — | 62 ms | — |
| Lean paint (wash 6, shadow edge, grain, bloom, stamps, ink, paper) | — | 738 ms | about 45 ms |
| Full paint | 633 ms (146 points per province) | 1,680 ms | about 100 ms |

This design uses one opaque base plus pairs of blotches (cheaper than the bench's 18-layer wash; and
none on Hills and Wasteland), the shadow edge (151 ms), granulation (96 ms), blooms (42 ms), flecks
and paper: about the lean stack.

### 7.2 Mockup budgets (headless Chromium 1194 at 1440 × 900, DPR 1, `perf.cjs`)

| Item | Budget |
|---|---|
| Once per load: shared polylines, noisy polygons, tracks, brooks, ponds, landmark, hero and camp slots, regions, paper and granulation tiles | ≤ 120 ms total, logged under `PROF.init` |
| First paint (Mid composite, every province) | ≤ 1.5 s |
| Per-province Mid re-bake | ≤ 16 ms; at most 12 ms of bakes per frame after the first paint (unchanged budget) |
| Near province bake | ≤ 25 ms |
| Live layers per static redraw: state overlay, region names, track re-layout | ≤ 1 ms, ≤ 2 ms, ≤ 2 ms |
| Pan and hover | 60 fps (blit only), `panFps` p95 frame ≤ 16.7 ms at Mid, Near and lean-back |
| Time-lapse step | ≤ 8 province re-bakes animate; the rest swap at once |
| "Try your art": intake and re-bake of the affected provinces | ≤ 2 s per sheet |

### 7.3 The game (Pixi v8)

- **One painter, two hosts:** pure painters over a `CanvasRenderingContext2D`-shaped interface in
  `src/render/map/paint/` (wash, paper, flecks, relief, forests, water, landmarks, heroes, camps,
  springs, vignettes, labels-on-path layout), fed by pure geometry from `src/present/map/`
  (`edges.ts`, `tracks.ts`, `water.ts`, `landmarks.ts`, `regions.ts`, `zones.ts`, `curveText.ts`,
  `recolor.ts`).
- **Bake in a worker:** `OffscreenCanvas` 2D (Chrome 69, Firefox 105, Safari 16.4); results go to
  Pixi through `ImageBitmap` sources. Far and Mid at load behind the loading screen; Near lazily
  in 512² tiles (LRU 32, unchanged).
- **Keys (H10):** the paint's key is terrain, explored, owned and Map detail; the stamps' keys are
  v2's slow keys without `tokensAt` and without the in-sight flag. **Churn:** paint re-bakes once
  per province when it is explored and when it passes between the independents and a nation;
  stamps re-bake at month boundaries (approved). Army movement and visibility flips re-bake
  nothing. A province whose paint is pending for one of its flags shows its live fill in the state
  overlay until the bake lands.
- **Bake budgets:** Medium (60 provinces) Far + Mid ≤ 1.0 s in software, Large 4 nations ≤ 2.4 s,
  measured on GPU canvas in the Playwright performance smoke; a re-bake ≤ 16 ms per province in the
  worker, with the main thread swapping at most 3 ms of textures per frame (final §3.8). final's
  "full Mid bake on Medium ≤ 150 ms" now applies to Map detail Reduced.
- **Near tiles:** ≤ 50 ms per 512² tile in software (the bench: about 100 ms for the full stack, 45
  ms lean) and ≤ 25 ms on GPU canvas, at most 2 tiles in flight. While a tile is pending, the Mid
  bake, scaled, shows in its place (`research-techniques.md` §11.3 item 4), so a zoom-in never shows
  a hole.
- **GPU memory:** unchanged. The paint lives inside the existing decoration textures (Mid 13.6 MB
  for 85 provinces at DPR 2, Far 3.1 MB, Near ≤ 32 MB); total table and map ≤ 96 MB (final §2.12).
- **Atlases:** the stamp atlases and owner sheets live in one bake worker as `ImageBitmap`s, **≤ 30
  MB in total** (bitmaps are not shared between workers). A second worker, if used, bakes only the
  paint (wash, flecks, paper), which needs no atlas. Release canvases when done (Safari's total
  canvas memory).
- **Bands:** every owned province's band in one `Graphics`: an inner-aligned stroke with round joins
  on the simplified noisy polygon (polygons normalized to one winding, so one `alignment` value puts
  the stroke inside), the keyline as a (B + 1) px stroke first and the band as a B px stroke over it.
  No masks. Fallback, if the inner stroke shows spikes at sharp concave corners: a precomputed inset
  ribbon per province, rebuilt when B changes by a quarter pixel. Test: no band pixel outside its
  province's ID (§7.4).
- **Live layers and draw calls:**

  | Layer | Ownership mode | Data modes |
  |---|---|---|
  | Fill (one `Graphics` batch; skipped under the opaque paint, except during the 150 ms fade) | — | 1 |
  | Decoration (Far, Mid or Near tiles) | 1 | — |
  | State overlay (one `Graphics`) | 1 | — |
  | Region names (`BitmapText`) | 1 | — |
  | Tracks (one `Graphics` or particle batch) | 1 | 0 or 1 (Passability) |
  | Wilds (one atlas) | 1 | 1 |
  | Borders (ribbons, one `Graphics`) | 1 | 1 |
  | Bands and keylines (one `Graphics`) | 1 | 1 |
  | Information marks (atlas) | 1 | 1 |
  | Mode overlays (hatch, hop outline) | — | 1 |
  | Place and wild names (`BitmapText`, two font pages) | 1 to 2 | 1 to 2 |
  | Chips | 1 | 1 |
  | Path previews | 1 | 1 |
  | Tokens, arrows, rings, battle markers (one atlas) | 1 to 2 | 1 to 2 |
  | **Total** | **12 to 14** | **10 to 13** |

  The map stays within 15 draw calls; the table within 4.
- **Hit test:** an ID map (R8, nearest filtering, 1 texel per unit, 0.7 MB on Medium, CPU copy)
  rasterized from the same noisy polygons, with a point-in-polygon check against the site's cell
  and its neighbors near boundaries. Test: sampled points agree with the polygons.
- **Context loss:** every bake and the ID map rebuild from seed and state.
- **Later optimization (not M1):** a density texture plus palette shader (`pow(palette[id], 1 + d)`,
  `research-techniques.md` §11.3) if decoration memory gets tight.

### 7.4 Tests

- `tests/present/map/edges.test.ts`: both sides of every shared edge use the same polyline,
  reversed; endpoints are the original vertices; no province or wild polygon self-intersects on
  seeds 1 to 30 × Small, Medium, Large × 2 and 4 nations; every point lies inside its edge's quad;
  simplification keeps both sides equal.
- `tracks.test.ts` (same seeds): exactly one track per unordered neighbor pair and none otherwise;
  no sample in a wild cell or a third province; ends on the settlement extents; the last segment
  perpendicular to the edge at the crossing (60° or more); beyond Z from the crossing and S0 from the
  start, every sample at least C from every border; no dot within J of a border other than its own
  crossing edge; corner contacts at most 2% of pairs and every other pair crossing in its edge's
  middle half; identical output across runs.
- `water.test.ts`: every brook and pond point lies inside its province inset by B_u + 6 u and
  outside every zone; probabilities by terrain over 30 seeds within ±10% of §3.3.
- `landmarks.test.ts`: one mine on every Hills and Mountains province, one windmill on every
  Farmland province; ruins 20 to 30%; one hero per named region, or a logged miss when no province of
  the region has room; landmark, hero, vignette and camp ids disjoint from `POLE_MOTIFS`,
  `LAND_LOOKS`, settlement pieces, scars, siege and pillage marks.
- `silhouettes.test.ts` (H6): (1) every drawable in content (stamps, sheaves, landmarks, ruins,
  heroes, vignettes, flecks, camps, spring stones, and every pole motif, land-look motif,
  settlement piece, scar, siege, pillage and ritual mark) declares a `family`, and scenery families
  are disjoint from §3.11's reserved families; (2) each painter draws into a recording 2D context
  (paths flattened to polygons, fills and strokes rasterized on a 48² grid at the shape's Mid size,
  no DOM); masks are normalized to their bounding boxes; every scenery mask against every reserved
  mask has an IoU under 0.70 filled and under 0.60 as fog line art (outlines dilated 1 px), each
  version tested on its own. **Calibration:** before the fixes, the test must fail on v2's haystack
  against the camp dome, the obelisk against the standing stone, and the dust devil against the
  smoke wisp.
- `regions.test.ts`: components connected, one terrain, size ≥ 3, at most provinces / 10; names
  unique against provinces and wilds; every placed glyph's center inside its run; no glyph box over a
  place-name box, a wild-name glyph, a token zone or a seat zone.
- `tests/content/mapNames.test.ts`: the deny list (§3.9).
- `zones.test.ts`: zones depend on band and province only; moving an army or flipping visibility
  changes no paint key and no zone.
- `tests/content/palette.test.ts` gains: the band rule against the final paint in every Ownership
  state; terrain means ≥ 20 / 12 in every state pair, and texture ≥ 19.5 / 11.0 at 0.55 of the
  mottle amplitude (H13); name, region and wild label contrast; tracks (1.8 px dots across the 2.5 to
  3 px pitch range) ≥ 3:1 peak and ≥ 1.8:1 average on the Mountains fill and on its interior paint in
  every state; every kit with faces keeps one tone ≥ 3:1 on every fill; landmark and hero tones;
  flecks at least ΔE 12 from every banner and mana primary; water against banners with the inset
  rule recorded; the Farmland A/B fill against everything, if chosen.
- `tests/content/presentation.test.ts` (reserved patterns): hachures, fibres, furrows, hedges,
  windmill sails, the tracks' dot pattern (gaps at least the dot's size, so no solid path), brooks
  and the grain tile.
- Bands: on Medium seeds 1 to 5 at the start zoom and at Near, no band pixel (alpha ≥ 0.5) lies
  outside its province's ID.
- Fog guard: changing a hidden province's springs, population or independents' strength leaves its
  spring stones, camps and infields unchanged for the viewer.
- Playwright smoke: per terrain, painted mean ΔE2000 ≤ 2.0 (stamps off); bake and Near tile times of
  §7.3; hit tests on wobbling borders; the label test at the start zoom and one Near zoom; at most 15
  draw calls on the map.
- Intake: fixtures for a fake checkerboard, a missing alpha, a component on the edge, a 45° hatch,
  and a cairn-shaped component (the silhouette flag).

---
## 8. Docs text

### 8.1 `docs/09-art-direction.md` (the staged copy with the war table text applied)

**1. "Color palettes": replace "A seamless noise texture at 10% opacity is multiplied over every
fill. Borders #2B2620 at 2px." with:**

```markdown
In Ownership mode each terrain fill is painted as a watercolor wash on the cloth's paper tooth (see
"The painted map's hand"); the paint never moves a province's mean color more than CIEDE2000 2 from
its fill, and data modes tint the plain fill. Borders are #2B2620 ink, 2 px on average.
```

**2. "Distinct colors": append to the paragraph:**

```markdown
 Painted texture may move single pixels but never the means: at the realistic peak of a mottle
blotch, every pair of different terrains, in every fog and land-look state, stays at least 19.5
apart for normal vision and 11 under each simulated deficiency, and every province's mean stays
its fill.
```

**3. "Ownership bands": replace "A band is a flat strip of the banner color along the inner border,
with a 1px keyline on its inner edge." with:**

```markdown
A band is a flat strip of the banner color along the inner border, at most 9 px wide on screen,
with a 1px keyline on its inner edge.
```

**4. Add this section after "The painted map":**

```markdown
## The painted map's hand

Added on 2026-10-22 at the owner's direction: "im working on the art but i need the game map to be
more interesting and detailed, a hand drawn feel - so far looking good", and "i like final fantasy
14 and much concept art as insiration". The inspiration is Final Fantasy XIV's painted maps and
its concept art, taken as style principles only: painted ground under crisp information, paper
under pigment, an ink line with a transparent wash, one light from the upper left with warm lit
sides and cool shadows, a tier of names per zoom, illustrated landmarks that say what the land is,
luminous clean paper, and elegant lettering. Nothing of that game is copied: no map images,
layouts, region shapes, place names, icons, symbols, logos, fonts or characters. Prompts for
owner-made images describe qualities and never name a game, studio or artist, and generated names
are checked against a deny list of famous place names. The land keeps its terrain colors (the
distinct-colors rule): the painted warmth comes from ink, paper, light and lettering.

- **Paint.** Each province is a wash of its terrain fill: lighter in the middle, pooled darker at
  its edge (an inner pool about 6 px and a fine pooling line, starting at the band's inner edge on
  owned land), a slow mottle (±3 L* on Plains, Farmland and Forest, ±1 on Mountains and Swamp, none
  on Hills and Wasteland), granulation in the earths and greys, a bloom or two, a few pigment flecks
  (sorrel seed heads, ochre lichen, rust, sedge heads), a soft cool wash beside passable peaks, and
  the cloth's paper tooth over all, mean-neutral. The fog haze, the dominion wash and the
  out-of-sight fade are drawn live over the paint. Every province keeps fixed label, token and seat
  zones, painted flat and free of decoration. The painted mean stays within CIEDE2000 2 of the
  fill. Wilds are never painted. Nothing grades or lights the cloth.
- **Ink.** Borders follow one seeded wobbling line per shared edge, the same line the fill, band,
  hover and hit test use; their width varies ±12% and they never break or taper (a dotted border
  means fog). Drawn features use sepia #3E3428 (or #E8DCC2 on Forest, Hills and Swamp) and may
  taper and break. The map's outline has a double neatline, and the outer provinces' wash runs a
  few pixels past it into the margin.
- **Light.** One light from the upper left: lit faces of stamps, landmarks and settlements lean warm
  (#F6D9A0 at 12%), shadow faces cool (#3A4466 at 14%), and every standing item casts a cool shadow
  rgba(38,42,64,.22) to the lower right.
- **Terrain drawing.** Forests are clumps of lobed crowns with one outer ink outline, conifers where
  a forest borders mountains; hills are humps with a few hachures on their lower right; passable
  mountains are low, rounded, snowless profile peaks with flat shadow faces, wild peaks taller and
  sharper. Hachures avoid 33° to 57° and 123° to 147°. Only wild rims carry cliff ticks, and only
  wild peaks carry snow. Farmland stubble carries upright tied sheaves.
- **Tracks** join every pair of neighboring provinces, from settlement to the middle of the shared
  border to settlement, crossing it at a right angle and never running along a border, as dots
  1.8 px wide every 2.5 to 3 px at every zoom. No other pair has one, and none crosses a wild.
- **Water.** Brooks (pale #BCD6D9 between two #35535A banks) and ponds (#A6C7CC) lie inside one
  province, clear of its borders; they are scenery and are not drawn in unexplored provinces. Dark
  water is always a wild.
- **Landmarks.** Every Hills and Mountains province has a mine, every Farmland province a windmill;
  about a quarter of provinces have an old ruin; bridges stand where tracks cross brooks; each named
  region has one large ruined set piece, visible from far zoom. At near zoom, independent provinces
  show 1 to 4 domed tents by their strength word, and known mana springs show as small spring stones
  with their symbol. A Wellspring is a glowing basin whose five drops carry the five mana colors
  until it is claimed. Scenery never shares a silhouette with an information or alignment mark: no
  watchtowers, standing stones, obelisks, shrines, cairns, huts, caves, carts, dark birds, flags,
  fire or smoke.
- **Lettering.** Place names in Alegreya, dark ink #2A1F14 on a paper halo #F2EAD6 at 85%, from 11 px
  and growing with the zoom; wild names in Alegreya italic #E9E4D8, curved along the range from 13 px
  and kept clear of the peaks; region names (runs of three or more provinces of one terrain, named
  from content) in letter-spaced Marcellus SC at far and middle zoom, #2A1F14 or #F4EEDF at 90%,
  drawn under the borders and bands and placed after every other label.
- **Near zoom** adds one small vignette per province: sheep, deer, a heron, goats, cows, a hare. No
  people.
- **Owner-made map art** (paper, tree clumps, hills and peaks, landmarks, set pieces, cartouche,
  compass, a corner ornament, vignettes, the Wellspring basin) supplies form and brushwork only:
  terrain stamps are recolored through their luminance into each terrain's faces, and the rest must
  be near-neutral. Wild peaks, settlements and information marks stay procedural.
```

**5. "Impassable terrain": append to the "Meres" bullet:**

```markdown
 Dark water always means a wild; brooks and ponds elsewhere are pale.
```

**and replace "and a name in italic, letter-spaced #E9E4D8." with:**

```markdown
and a name in letter-spaced italic #E9E4D8 that curves along the range and keeps clear of its peaks.
```

**6. "Delivery rule": in the raster paragraph, replace "Rasters in the bundle total at most 2 MB."
with:**

```markdown
Rasters in the bundle total at most 3.4 MB, of which map sheets (paper, stamp sheets, set pieces,
cartouche, compass, ornaments) take at most 1.4 MB and load after the first frame.
```

### 8.2 `docs/07-ui.md` (the staged copy with the war table text applied)

**1. "### Drawing": replace the bullet "Provinces are filled polygons: terrain color with a subtle
noise texture and a 2 px border, painted with ground textures, terrain stamps, settlements and land
looks (docs/09 "The painted map", "Growth and alignment on the map")." with:**

```markdown
- Provinces are filled polygons painted as watercolor washes on the cloth, with ground textures,
  terrain stamps, settlements and land looks (docs/09 "The painted map", "The painted map's
  hand", "Growth and alignment on the map"). Borders are hand-ruled ink, 2 px on average, along
  the same wobbling line the hover outline and the click test use. The paint depends only on
  terrain, exploration and whether the province has an owner; fog and dominion washes are drawn
  live over it, so moving armies and changing visibility never wait for a repaint.
- Dotted tracks join every pair of neighboring provinces and never cross a wild; their dots are
  the same size at every zoom. Brooks and ponds are scenery; dark water is a wild. The Codex
  concept "Tracks" says so.
```

**and replace the "Draw order from the bottom" bullet with:**

```markdown
- Draw order from the bottom: room, table, props, cloth; the fill layer (terrain or mode fills);
  the decoration layer (paint, ground textures, stamps, water, landmarks, settlements, motifs,
  scars); the state overlay (fog haze, out-of-sight fade, land-look washes); region names;
  tracks; the always-on layer (wilds, borders, bands, ritual marks, siege and pillage marks,
  Wellsprings); mode overlays, labels, numbers chips, paths, army tokens, transit arrows,
  selection rings, battle markers; table ambience over the room and the oak only.
```

**2. "### Modes": in "Decoration steps aside", replace "(ground textures, stamps, settlements,
motifs, scars)" with "(paint, ground textures, stamps, tracks, water, landmarks, settlements,
motifs, scars)", and add after "Contextual modes":**

```markdown
- **Quieter while targeting:** while commanders are selected or a ritual targets, the decoration
  layer dims to 60% and region names hide. Tracks stay at full strength during move targeting.
  Labels, bands, wilds, tokens and chips are unchanged.
```

**3. "### Labels and the density budget": replace the bullet "- **Far:** names only, culled by
priority (capitals, Wellsprings, own provinces, then the rest), and one badge per nation per
province." with:**

```markdown
- **Far:** names only, culled by priority (capitals, Wellsprings, wild names, own provinces, then
  the rest), and one badge per nation per province. Region names (spaced capitals across runs of
  three or more provinces of one terrain) show at Far and at Mid while provinces are under 110 px;
  they are drawn under the borders and bands and placed after every other label, so they never
  cull one.
```

**append to the "Near" bullet:**

```markdown
 The painted map adds the independents' camps (one to four tents by their strength word) and
  stones for the known mana springs.
```

**and add at the end of the subsection:**

```markdown
- **Lettering:** names are dark ink on a paper halo (Alegreya), 11 px at the bottom of Mid growing
  to 13 px at its top and 15 px at Near; wild names curve along their range from 13 px. Curved
  labels take part in the overlap test glyph by glyph. Nothing is lettered below 11 px.
- **Fixed zones:** each province keeps its label, token and seat zones clear of decoration
  whether or not armies stand there.
```

**4. "### Moving": append to the "Path previews" bullet (M1-should):**

```markdown
 They follow the tracks from settlement to settlement.
```

**5. "### Fog": append to the "Unexplored provinces" bullet:**

```markdown
 Tracks, landmarks and independent camps show as pencil line art; brooks, ponds and spring
  stones do not.
```

**6. "## Changes from the previous version of this document": add:**

```markdown
12. **The painted map's hand (2026-10-22, the owner's direction: "i need the game map to be more
    interesting and detailed, a hand drawn feel"):** watercolor washes on the cloth, hand-ruled
    borders, live fog and dominion washes, tracks between neighbors, brooks and ponds, mines,
    windmills, ruins and one set piece per named region, independent camps and spring stones at
    near zoom, an illustrated Wellspring, region names under the bands, ink lettering that grows
    with the zoom, curved wild names, fixed label and token zones, and a quieter map while
    targeting.
```

### 8.3 `docs/09-balance.md`: rows dated 2026-10-22 ("Map presentation")

u is one 180th of the map's median province diameter (0.5 units on every M1 map size).

```markdown
| Border wobble | amplitude 0.2 of the site segment, to 3 units, 2 Chaikin passes | src/content/presentation/map/paint.ts | 2026-10-22, hand-drawn pass |
| Wash | mottle ±3 L* (Plains, Farmland, Forest), ±1 (Mountains, Swamp), 0 (Hills, Wasteland); edge pool −5 to −8 L*; painted mean within CIEDE2000 2.0; texture floor 19.5 / 11 | same | same |
| Relief wash | #3A4466 at up to 0.08, beside passable peaks only | same | same |
| Flecks | coverage at most 1.5% (Plains, Mountains, Swamp) and 2% (Wasteland) | same | same |
| Tracks | one per neighbor pair; dots 1.8 px every 2.5 to 3 px on screen; clearance 10 u, crossing zone 12 u, junction drop 9 u | src/content/presentation/map/tracks.ts | same |
| Brooks, ponds | probability by terrain (Hills, Mountains, Swamp 0.6; Forest 0.5; Plains 0.4; Farmland 0.3), inset band + 6 u | src/content/presentation/map/water.ts | same |
| Ruins | 25% of provinces | src/content/presentation/map/landmarks.ts | same |
| Hero set pieces | one per named region, 34 to 43 u | src/content/presentation/map/landmarks.ts | same |
| Region names | runs of ≥ 3 provinces, at most provinces / 10; Far and Mid below 110 px | src/content/presentation/map/regions.ts | same |
| Place-name sizes | Far 11 px; Mid 11 to 13 px; Near 13 to 15 px (capitals +1) | src/content/ui.ts | same |
| Token zone | 3 stacks at Far and Mid, 4 fanned tokens at Near | src/content/ui.ts | same |
| Band width | max(2.5 px, 0.0314 × the median province's on-screen diameter), at most 9 px | src/content/ui.ts | same |
| Targeting dim | decoration at 60% | src/content/ui.ts | same |
```

---

## 9. Mockup brief

**Where:** edit the parts in `wartable-design/mock-work/parts/` (v2 parts are backed up in
`handdrawn-design/parts-v2-backup/`); add `parts/p85-tryart.js` and append it to `build.sh`'s list
after `p80d-rest.js`; build with `mock-work/build.sh` into `ui-mockup/game-screen.html` (v3); keep
`game-screen-v2.html`. Seeds come from `rngFor(key)`; never `Math.random`. d3 7.8.5 from cdnjs stays
the only script.

**Units in this brief:** "N u" means N × `U` world units with `const U = MED_DIAM / 180` (U equals
`PX` at Mid); "N band px" means N × `PX` (`PX = 1 / BAND_RES[band]`), as v2 draws ink; "N px" on a
live layer means N / `cam.s` world units. Counts scale with `areaOf[i] / MEAN_AREA`.

**Order:** what changes the feel most comes first, then the owner's own art; every step must leave
the mockup working.

### Step 0. Controls (p00c-body.html, p80d-rest.js, p40-scene.js `view`)

- In `#mockctl` add `Hand: Painted | v2` (`view.hand`), `Labels: Ink | Approved` (`view.labels`),
  `Borders: Wobble | Straight` (`view.borders`), `Bands: Capped | v2` (`view.bandCap`), `Tracks:
  Full | Crossings` (`view.tracks`), `Farmland: Approved | #EDB141` (`view.farm`), and a `Try your
  art` button (step 5). `Hand: v2` restores every v2 path, so the owner can A/B the whole pass.
- `view.hand`, `view.borders` and `view.farm` join `lookKey` and `staticSig` and call
  `invalidateBakes()` on change (`view.farm` also sets `TERRAIN.farmland.fill`, recomputes
  `MODE_BASE` and clears `FILLMEMO`); `view.labels`, `view.bandCap` and `view.tracks` only need
  `requestDraw()` (live layers).
- "Try this" gains: "6 Switch Hand, Labels, Borders and Bands to compare with v2." and "7 Try your
  art: put a ChatGPT sheet on the map."
- URL flags `?paintcheck` (step 14) and `?silhouettes` (step 15).

### Step 1. Washes on paper, fixed zones, the state overlay (p50-deco.js; p60-draw.js `fillFor`, `renderStatic`)

- Split `fillFor`'s default branch into `ownFill(p)` (terrain fill with haze, fog desaturation or the
  land-look mix). With `view.hand === 'painted'` the live fill in Ownership mode is the plain terrain
  fill and the state overlay draws the rest; `Hand: v2` keeps v2's `fillFor`.
- `const PAINT = { plains: { M: 3, E: -7, G: 0.25, B: 1, lift: 1.2 }, farmland: { M: 3, E: -7, G: 0.2,
  B: 0, lift: 1.2 }, forest: { M: 3, E: -5, G: 0.45, B: 0, lift: 0.8 }, hills: { M: 0, E: -6, G: 0.6,
  B: 1, lift: 1.0 }, mountains: { M: 1, E: -7, G: 0.7, B: 1, lift: 1.2, relief: 0.08 }, swamp: { M: 1,
  E: -6, G: 0.35, B: 2, lift: 1.0 }, wasteland: { M: 0, E: -8, G: 0.8, B: 1, lift: 1.4 } }`.
- Tiles, built once: `PAPER` (256², `rngFor('paper:12')`, value noise 128 ± 20 at 1.5 px and 24 px,
  400 fibres 3 to 8 px within ±25° of horizontal in rgba(90,70,40,.10) and rgba(255,250,235,.14),
  drawn wrapped) and `GRAN` (128², `rngFor('gran:12')`, value noise 128 ± 26 at 1.5 px). Patterns
  with `setTransform(new DOMMatrix([U, 0, 0, U, 0, 0]))` (world-locked, one tile pixel per u).
- **Fixed zones:** rename `exclusions(i, band)` to `zones(i, band)` and size its token box for
  `TOKEN_ZONE = { far: 3, mid: 3, near: 4 }` stacks instead of `tokensAt(i)`; add `zonesAll(i)`, the
  union over the three bands. Remove `tokensAt(i)` from `lookKey`. With Hand Painted, `lookKey` maps
  `'outofsight'` to `''` (the overlay draws it) and gains `p.owner ? 'O' : ''`.
- New `paintGround(g, i, band)`, called first in `drawProvinceDeco` inside its clip when
  `view.hand === 'painted'`: §2.2 steps 1 to 9, then paper (`soft-light`, 0.5). The mottle and bloom
  tests use `zonesAll(i)`. Build once per province a zone mask (the polygon in white with the zones
  cut out through a 4 px blur) and multiply the granulation, relief-wash and fleck scratch layers by
  it (`destination-in`) before compositing. Edge pool: `g.shadowBlur = {far: 4, mid: 6, near:
  8}[band] * spriteRes(band) * PX`, `shadowColor = rgba(shadeL(f, -28), .45)`; draw the casting
  path (rectangle minus polygon, plus a `2 * B_U` stroke of the polygon when `p.owner`, with
  `B_U = 6.4 * U`) translated off the canvas and bring its shadow back with `shadowOffsetX`.
- Unexplored: base and paper only (no mottle, edge pool, blooms or flecks). Wild bakes get no
  paint or paper.
- New `drawStateOverlay(g)` in `renderStatic`, right after the decoration composite, in Ownership
  mode with Hand Painted: per province, unexplored → fill its polygon with rgba(232,220,194,.04);
  out of sight → `greyEqL(f)` (the fill's L\* with a\* = b\* = 0) at .10; in sight with a dominion
  → the look's wash at (0.10 for ash, 0.06 for moss) × s / 10; and a province whose baked key
  differs from its current key in the `U` or `O` part → its `ownFill(p)`, opaque, until the
  re-bake lands.
- Do not draw v2's live `rgba(0,0,0,.12)` 5 px stroke (p60-draw.js, the ownership pigment edge) when
  Hand is Painted.

### Step 2. Hand-ruled borders and inner bands on shared polylines (p10b-core.js, p50-deco.js, p60-draw.js, p80d-rest.js)

- After `areaOf` in p10b-core.js: `EDGE` (Map `min:max` → `{ a, b, i, j, pts }`) from consecutive
  vertex pairs shared by `cells[i]` and a `NB[i]` cell (equal within 0.01); skip outline edges.
  `noisy(a, b, p, q, R)`: if segment a-b does not cross segment p-q, `[a, b]`; else the recursion
  `c = lerp(p, q, 0.4 + 0.2 R())` on `(a, c, mid(a,p), mid(a,q))` and `(c, b, mid(b,p), mid(b,q))`
  down to `L = 3 * sqrt(MEAN_AREA / 6400)` units, then two Chaikin passes with endpoints fixed.
  Seed `rngFor(\`edge:12:${min}:${max}\`)`.
- `npoly[i]`: walk `cells[i]`, replacing each shared edge by its polyline in walk direction.
  `view.borders === 'straight'` makes `npoly = cells`.
- Replace `cells[...]` with `npoly[...]` in: the fill loop and wild fills (`renderStatic`), bands
  and keylines, hover and selection outlines (`draw`), `geo(i).poly` (clips, `inPoly` for slots;
  keep `distToEdge` on the convex `cells[i]` minus 6 units for speed), `bakeWildInto` clips.
- `wgeo(w).edges` become polylines from `EDGE` (wild cell against a cell not in the range); ticks
  are placed by arc length along them; the contour strokes them.
- Borders: replace the per-province `pathPoly(...); stroke()` loop with one ribbon per `EDGE`
  entry whose two sides are provinces: width `2 * px * (1 + 0.12 * sin(2π(f1 t + φ1)) + 0.05 *
  sin(2π(f2 t + φ2)))`, alpha 0.85 to 1, fill #2B2620; dotted 2/3 px when both sides are fogged.
- Bands: `B = Math.max(2.5, 5.5 * cam.s)` px, and `Math.min(9, B)` at Near when `view.bandCap ===
  'capped'`. Per owned province, clipped to `npoly` (canvas clips are fine in the mockup; the game
  uses inner strokes, §7.3): stroke the polygon `2 * (B + 1)` px wide in `keylineFor`'s color, then
  `2 * B` px wide in the banner. This replaces v2's 0.86-scaled keyline polygon.
- Hit test: `provinceAt(x, y)`: `i0 = nearest(x, y)`; return the first of `[i0, ...NB[i0]]` whose
  `npoly` contains the point; else `i0`. Use it in the three `nearest(x, y)` calls in p80d-rest.js.
- Neatline: keep the 3 px outline; add a 0.8 px #1C1A17 rule at 60% 5 px outside it (in
  `bakeCloth`).

### Step 3. Lettering (p00a-head.html, p60-draw.js `drawLabels`, p50-deco.js `nameFont`, `wgeo`)

- Fonts: add `&family=Alegreya:ital,wght@0,500;0,700;1,500` to the Google Fonts link; extend
  `fontsReady` to check `"13px Alegreya"`.
- `nameFs(s)`: with `med = s * MED_DIAM`: Far 11; Mid `11 + 2 * (med - 70) / 110`; Near `13 + 2 *
  Math.min(1, (med - 180) / 240)`; capitals +1. Use it for the label boxes in `zones()` too.
- `nameFont` (ink): `${cap ? 700 : 500} ${fs}px 'Alegreya', Georgia, serif`; draw `strokeText` with
  `lineJoin 'round'`, `lineWidth 3`, `rgba(242,234,214,.85)`, then `fillText` #2A1F14.
  `view.labels === 'approved'` keeps v2's code and `labelFs`.
- Split `drawLabels` into `layoutLabels(band)` (returns the placed boxes and positions) and
  `paintLabels(g, layout)`, so region names (drawn earlier) can be placed against the final label
  layout.
- `textOnPath(g, text, pts, font, track)` as `research-techniques.md` §10 (equal-step resampling,
  prefix advances, keep upright, 45° limit), returning glyph placements and oriented boxes.
- Wild names: in `wgeo`, per band, lay out the name first: curved on the §4.3 spine when the band's
  size is 13 px or more (italic 500 Alegreya, tracking 0.12 em, #E9E4D8), else v2's straight or
  vertical label; then place the peaks outside the glyph boxes (or v2's `lbox`) plus 2 px, at every
  band including Far. Fallback 90%, then v2's straight label.
- Region names: `REGIONS` once (components of `provList` by `terr` through `nbrs`, size ≥ 3, top
  `round(provList.length / 10)`, names from §3.9 by `rngFor('region:12:' + k)`). New
  `drawRegionNames(g, band, layout)` in `renderStatic` after `drawStateOverlay` and before tracks,
  in Ownership mode with `decoTo === 1`, when `band === 'far'` or `med < 110` (alpha 1 → 0 from 100
  to 110 px): Marcellus SC, 15 to 24 px at Far and 13 to 15 px at Mid, tracking 0.3 em, ink #2A1F14
  or #F4EEDF at .9 by the run's terrain over a 3 px halo of the run's fill at .5; placed after every
  label in `layout` per §3.9 (offsets, lengths, 90%, straight), never pushing a label out. The label
  queue keeps its order: capitals, Wellsprings, wild names, own provinces, the rest.

### Step 4. Forests, relief, sheaves and the one light (p50-deco.js stamps, `house`, `landmark`, `walls`)

- `faces(f)`: lit = `mix(shadeL(f, 12), '#F6D9A0', .12)`, shade = `mix(shadeL(f, -18), '#3A4466',
  .14)`; `palette()` returns them; stamp ink becomes `rgba(62,52,40,.8)` (#3E3428); settlement ink
  stays #1C1A17.
- `kitFaces(tone)`: lit = `mix(shadeL(tone, 8), '#F6D9A0', .12)`, shade = `mix(shadeL(tone, -12),
  '#3A4466', .14)`. In `house`, split each roof at its ridge into a lit left plane and a shaded right
  plane and give walls a lit front; in `landmark` (keep, temple, lab, the Wellspring monument) and
  `walls`, lit left and shade right. Keep every ink outline and the ember window dots.
- `castShadow(g, x, y, w)`: ellipse at (x + 0.25w, y + 0.4 u), rx 0.6w, ry 0.22w, −10°, fill
  rgba(38,42,64,.22); called for every standing item in a first pass over `items` (sorted list),
  then the items. House shadows switch to this color.
- Sheaves: replace `haystack()` with `sheafRow(g, x, y, P)` (§2.6: 2 or 3 sheaves 2.6 × 4.2 u along
  the furrow direction, waist tie, fanned ears, splayed stalks; line art in fog as an hourglass with
  ears); every non-windmill Farmland stamp and Plains' `s.v > 0.94` stamp (a single sheaf).
- Wasteland's `skull` stamp becomes `rock` (question 9's default).
- Forest clumps (§2.4): in `drawProvinceDeco`, for forest, group `stampSlots` into clumps; draw each
  clump with the stroke-then-fill outline trick; lobed crowns; trunks on the bottom row; conifers
  70% when `nbrs(i)` or a `NB[i]` wild of kind peaks includes Mountains or peaks, else 15%; crown r
  4 to 5.5 u at Mid and Near; Far: 4 masses of 6 crowns at r 15 u.
- `hump`: faces from `faces`; replace its three slope strokes with 4 to 6 tapered hachures at 6° to
  33° and 57° to 80°, #3E3428 at 0.75, length 0.35 to 0.55 w.
- `peakStamp`: build L and R ridges by 3-level midpoint displacement; lit face with a vertical
  gradient (+4 L\* at the top); shade face flat; ink 1.4 band px at the apex tapering to 0.8.
  Passable peaks (approved colors #B4C1C6 / #6E7F86): height ≤ 0.8 × base, ridges smoothed by two
  Chaikin passes, no scree fans. Wild peaks (approved colors, snow with a 3- to 5-tooth lower
  edge): height ≥ 1.1 × base, sharp.
- Relief wash: `paintGround` step 4 uses the Mid peak slots of Mountains provinces (computed in
  `geo` before stamps) in every band.
- Plains hedgerows in `ground()`: wavy, as crown dots r 1.4 u every 3 u in rgba(94,112,70,.6).

### Step 5. Try your art (new p85-tryart.js; p00c-body.html; p50-deco.js stamp hooks)

- The `Try your art` button opens a small panel: an entry select (H1 Paper, H2 Broadleaf, H3
  Conifers, H4 Hills and peaks), a file input (`accept="image/png"`), a "Back to procedural" button
  per entry, and a results area. Everything stays in the page; nothing is uploaded.
- On a file: `createImageBitmap`, draw into a canvas at most 1024², read the pixels. **Mini intake**
  (§6.4): an alpha channel with at least 40% fully transparent pixels, else the white key-out
  (luminance above 250 and chroma under 4 → transparent, 2 px feather); refuse a periodic two-grey
  checker of 8 to 16 px tiles ("fake transparency; ask again"); components by an 8-connected flood
  fill on a 256² alpha mask (alpha above 0.5), kept when at least 0.2% of the image, counted against
  the entry (16 ± 2), edge-touching ones listed; the light check and the ink check as warnings. H1
  instead: luminance, mean set to 128, contrast clamped to ±20, the wrapped-seam ΔE, downscaled to
  256².
- **Recolor** (§6.5) each component into sprite canvases per terrain: H2 → Forest broadleaf clumps,
  H3 → conifer clumps and single trees, H4 → hills (top rows) and passable peaks (bottom rows); H1
  replaces `PAPER`. Store as `view.art[entry]` (this session only), `invalidateBakes()`, redraw.
- Stamp hooks: when `view.art` has the entry, the clump, hump or peak draw calls `drawImage` of the
  frame picked by `hash32(12, i, slot) % frames` (mirrored when the hash's low bit is set), scaled
  to the stamp's footprint; the image's own shadow replaces `castShadow`.
- **Results area:** for every component, side by side: the raw cut-out, the recolored version, and a
  swatch of it on its terrain's paint at Mid size; a summary line (count, warnings, refusals).
- Budget: ≤ 2 s per sheet.

### Step 6. Tracks, live (p50-deco.js `TRACKS`; p60-draw.js `drawTracks`)

- Once per map: for every `EDGE` whose sides are both provinces, run §3.2's steps 1 to 5 in world
  units (`Z = 12 * U`, `C = 10 * U`, `J = 9 * U`, `S0 = 15 * U`; walks along the local normal; the
  crossing slides within the middle half; the seeded control offset and meander from
  `rngFor(\`track:12:${min}:${max}\`)`; the fallbacks in order; corner contacts). Store per half its
  polyline, the crossing M, the edge id and its ink (#3E3428, or #E8DCC2 on forest, hills, swamp).
- `drawTracks(g, band)` in `renderStatic` after the region names and before the wilds: nothing at
  Far; alpha 1 when `view.pass` or a commander is selected, else `decoAlpha`. Spacing in world units
  `2.5 / q` with `q = 2 ** (Math.floor(Math.log2(cam.s) * 4) / 4)`; dot k at `(k + 0.15 * (h(k) - 0.5)
  * 2) * spacing` along the polyline, `h(k) = hash32(trackKey, k) / 2 ** 32`; each dot a filled
  circle of radius `0.9 / cam.s`. Drop dots within `3 / cam.s` of the shared edge, inside label
  zones plus 2 px, and within `J` of any other border. `view.tracks === 'crossings'` at Mid draws
  only the third of each half nearest M.
- Keep `footpath()` behind `view.footpath` until step 14's on-screen check passes, then remove it
  from Mountains.
- Stamps: drop slots within (stamp radius + 2 u) of any track polyline (precomputed per province).

### Step 7. Water (p50-deco.js; new `WATER`)

- Once per map, per province, seeded `brook:12:${i}` and `pond:12:${i}`: probabilities, elevation
  proxy, source and mouth, routing, insets (`B_U + 6 * U`) and zones exactly as §3.3; the Wellspring
  province's brook starts at the basin's position (the `drawMarks` Wellspring offset).
- Pond (§2.5): blob r(θ) = r(1 + 0.15 sin(3θ + φ1) + 0.08 sin(5θ + φ2)), y × 0.75, fill #A6C7CC,
  lit rim #DCEAEA 1.2 band px at .8 on the upper-left half, bank #35535A 0.8 band px at .7, 2 or 3
  `reeds()` on the lower shore (#8E9A6E), Near: 2 ripple arcs #E9F2F2 1 band px.
- Brook: ribbon width (0.6 + 1.2 t) u filled #BCD6D9, bank lines at ±w/2 in #35535A, 0.7 band px,
  .7; source dot r 1.4 u.
- Bridges: intersect each track half with the brook; at each crossing a deck #CFC6B4 (4 u along the
  track, brook width + 3 u across) with #3E3428 rails 0.8 band px; the live dots draw over it.
- Swamp pools: one pale dash #9FD0D4 at .7 at Near.
- Nothing of this in unexplored provinces. Stamps drop slots within (radius + 2 u) of brooks and
  inside ponds.

### Step 8. Landmarks, heroes, camps, spring stones, the Wellspring, capitals at Far (p50-deco.js, p60-draw.js `drawMarks`)

- Code paths in stone #CFC6B4 and timber #8C6A47 with `kitFaces`, ink #1C1A17 0.9 band px, at
  `LS × 1.3`: `mine` (square frame, dark rectangular opening, spoil fan; no cart), `windmill`
  (stone tower, timber cap, sails at 22.5° + k·90°), `arch`, `smallArch`, `barrow` (long mound, no
  opening), `aqueduct`, `wallFragment`, `fallenTrunk`, `columns`, `sunkenColumns`, `sunkenArch`,
  `toppledStatue`. Choice and placement per §3.4 with `rngFor('landmark:12:' + i)`; remove the
  chance windmill from `stampShape` (one per Farmland province now). No obelisk, cave or cliff door.
- Heroes: per `REGIONS` entry, `rngFor('hero:12:' + key)`; code paths `heroFeet`, `heroAqueduct`,
  `heroStump`, `heroHead`, `heroArch`, `heroPier`, `heroStatue` at 34 to 43 u, placed per §3.4,
  drawn at Far, Mid and Near (the same world size), replacing that province's ruin.
- Camps: Near only, every province with `owner === null`, Wellsprings included (their strength 30
  reads "fortress": 4 tents); words weak < 16, moderate < 24, strong < 30, fortress ≥ 30 from
  `p.indep` (align `placeBadges`' words to these); §3.5's domes with finial and door line at
  `seat + (0.9 × settleExtent, 4 u)`. No pole, no shield.
- Spring stones: Near only, if `fogOf(i) !== 'unexplored'`, for each `p.springs[k]` a disc #E9E1CC
  r 4.5 u, ink ring 1 band px, `manaImg[c]` at 7 u; at `seat − (0.9 × settleExtent + k × 10 u, −6 u)`.
  Bake only when `manaImg[c].complete`; invalidate that province when an image loads.
- Wellspring (`drawMarks`): scale the monument by 1.4; add the glow (radial #F4EEDF .28 → 0, 18 u,
  clipped to the province); the five drops in W #F3E6B8, U #3A7BD5, B #3D2B4F, R #FD6533, G #00674B
  with 0.6 band px ink outlines while unclaimed, carved #CFC6B4 once claimed.
- Far capitals (`settlementItems`, far branch): keep plus the first 3 houses plus the pennant.

### Step 9. Fields, clearings and flecks (p50-deco.js `ground`, `settlementItems`, `paintGround`)

- Farmland: field boundaries by 2-level midpoint displacement (0.15); tones ±5 L\*; furrows
  `rgba(shadeL(f, -12), .35)`; hedges as wobbly dot lines #4E5A2E at .6.
- Infields (Plains, Hills, Wasteland, tier ≥ 2): `tier − 1` patches (≤ 4) at ranked spots on a ring
  at 1.15 to 1.5 × `settleExtent`, each a 3- to 5-sided polygon of about 0.5 × the house spiral
  radius, fill ±5 L\*, furrows at 0°, 90° or ±30°.
- Forest clearings: stamps skip slots within 1.3 × `settleExtent`; a soft ellipse +5 L\* there.
- Flecks (§1.4) in `paintGround` step 7: blue-noise points (minimum spacing 3 u) from
  `rngFor('fleck:12:' + i)`, outside `zonesAll(i)`, at the table's coverage and bands; lichen only on
  scree stones' slots; sedge heads on 3 u stalks.

### Step 10. Vignettes at Near (p50-deco.js)

- `sheep`, `deer`, `heron`, `goats`, `cows`, `hare` per §3.10, `rngFor('vignette:12:' + i)`,
  probability 0.6, Near only, one per province, clear of tracks and brooks by 3 u, with
  `castShadow`. No haywain, no dust devil, no birds but the pale heron.

### Step 11. The cloth margin (p40-scene.js `bakeCloth`)

- Replace the 7,000 fleck strokes with the `PAPER` tile over the margin (`soft-light`, 0.6).
- Margin wear: a 6-unit band inside the hem toward #D9CBAE (linear fade). No ring stains. Never
  inside the neatline.
- Wash overrun (§2.7): for each outline edge of an outer province (not a wild), a noisy strip 2 to 4
  px wide outside the outline, `rngFor('overrun:12:' + i)`, filled with the terrain fill at .35,
  drawn before the neatline.
- Cartouche: keep the scroll frame and Marcellus SC title; add oak-leaf curls (three leaves and an
  acorn per end, #3E3428 outline, #A89A6E wash at .5).
- Corners: a small procedural oak-leaf sprig (3 leaves) at each inner corner of the hem, mirrored,
  outside the map.

### Step 12. Fog (p50-deco.js `drawProvinceDeco`)

- Unexplored: tracks at full alpha (live, step 6); no brook, pond or bridge; the landmark, the hero,
  sheaves and camps (Near) through `P.line`, all in `lineCol`; no spring stones; no flecks.

### Step 13. Readability guard (p80d-rest.js mode switch, p80c-sel.js selection)

- Replace the `decoTo` rule with `decoTo = state.mode !== 'ownership' ? 0 : (state.sel &&
  state.sel.type === 'cmd') || ritualTargeting ? 0.6 : 1`, recomputed on mode change, selection
  and deselection (150 ms, instant under reduced motion). The state overlay follows `decoAlpha`;
  tracks follow step 6's rule.
- Region names skip when `decoTo < 1`.
- `view.detail === 'reduced'`: no `paintGround` (flat terrain fill), no paper, no flecks, no
  vignettes; the state overlay, tracks, water, landmarks, heroes, camps, spring stones and region
  names stay.

### Step 14. Performance, the paint check and the track check (p60-draw.js, p50-deco.js, `__mock`)

- Compute `EDGE`, `npoly`, `TRACKS`, `WATER`, landmark, hero and camp slots, `REGIONS`, `PAPER` and
  `GRAN` once, timed into `PROF.init` (≤ 120 ms).
- `?paintcheck`: (1) bake each province at Mid with stamps, water and settlements off; average
  CIELAB over its polygon; print per terrain the mean and worst ΔE2000 against the terrain fill in a
  table in the console and in `__mock.paintcheck()`; tune `PAINT[t].lift` until every terrain is ≤
  2.0 and record the values in the mockup's notes. (2) At Far with the full decoration, average each
  province, and report every terrain pair's ΔE2000 between the means (normal, Protan, Deutan,
  Tritan), listing pairs under 20 / 12.
- Track check at the start zoom: on 20 Mountains track halves, sample the rendered canvas along the
  dots and beside them; report dot-peak and line-average WCAG ratios; do the same for `footpath()`
  with `view.footpath`. Remove the footpath only if tracks reach ≥ 3:1 peak and ≥ 1.8:1 average.
- Run `perf.cjs`: first paint ≤ 1.5 s, `panFps` p95 ≤ 16.7 ms at Mid, Near and lean-back; report
  `PROF`.

### Step 15. Screenshots and checks

- `ui-mockup/v3-desktop.png` (start zoom), `v3-mid-ashfen.png`, `v3-near.png` (Kharnath),
  `v3-far.png` (lean back: region names and heroes), `v3-wild.png` (curved Ashspine and Still Mere,
  a bending path), `v3-fog.png`, `v3-select.png` (Varo selected: decoration at 60%, tracks full, move
  hatch), `v3-supply.png` (a data mode: flat tints), `v3-deutan.png` and `v3-tritan.png`,
  `v3-labels-ab.png` (Ink against Approved at Mid), `v3-v2-ab.png` (Hand v2 against Painted),
  `v3-bands-ab.png` (Capped against v2 at Near), `v3-tracks-ab.png` (Full against Crossings at the
  start zoom), `v3-farmland-ab.png`, `v3-tryart.png` (a sheet through Try your art, or the panel
  with the procedural fallback), `v3-silhouettes.png` (`?silhouettes`: every scenery shape beside
  every reserved shape in greyscale at Mid size, filled and as fog line art), `v3-vs-reference.png`
  (the start view beside `reference-map.png` at the same size), `v3-paintcheck.txt`.
- Checks: every v2 interaction works (hover, tooltips, T lock, alerts, outliner, strip orders,
  right-click moves, keys, phone layout); clicks near wobbling borders select the province under
  the cursor (sample 200 points along borders against `npoly`); no stamp, water, fleck or track dot
  in a label, token or seat zone; no track sample nearer than C to a border outside its crossing
  zone; moving an army re-bakes nothing (watch `REB`); no `Math.random`; a reload draws the
  identical map; paint check ≤ 2.0 per terrain; the label test at the start zoom (≥ 90% of names,
  none over a token zone); the diagram read of `v3-tracks-ab.png`; budgets of §7.2.

---

## 10. Milestone placement and owner questions

### 10.1 Phases

| Phase | What lands |
|---|---|
| 8 | unchanged: flat fills, straight borders, the Simple table, wilds, tokens; `src/present/map/edges.ts` with the noise off, the polygon hit test, and fixed zones (`zones.ts`) |
| 11 | the paint stack, paper, flecks, the state overlay, noisy borders and inner-stroke bands, forests, relief, sheaves, lit settlements, live tracks, water, landmarks, hero set pieces, camps, spring stones, the Wellspring illustration, ink lettering, curved wild names, region names, fog line art for the new features, the targeting dim, the silhouette and deny-list tests |
| 12 (M1-should) | vignettes, paths along tracks, the cloth margin's overrun and ornaments, owner map sheets (last in the cut order) |

**Cut order inside this pass** (if the time box hits): owner rasters in the game → vignettes →
margin ornaments and overrun → paths along tracks → hero set pieces → region names → curved names
(straight fallback) → ruins → flecks → brooks and ponds → noisy borders (variable-width straight
ink) → the wash (flat fill plus approved textures). Tracks, the lit settlements and the ink
lettering stay: cheap, and they carry the look. The mockup's "Try your art" is not in the game's
cut order; it ships with v3.

### 10.2 Owner questions (defaults in bold; the build follows the defaults)

1. Labels: **dark ink on a paper halo** / the approved light-on-dark labels.
2. Borders: **hand-ruled wobble** / straight.
3. Path previews: **follow the tracks (M1-should)** / straight lines between centers.
4. Region names: **at far zoom and while provinces are under 110 px** / far zoom only / none.
5. Owner map sheets: **in the mockup as soon as a sheet passes intake ("Try your art"); in the game
   after the procedural look ships** / in the game first.
6. The land keeps v2's bright terrain colors (colorblind safety; the painted warmth comes from ink,
   paper, light and lettering). Farmland: **keep #EEBA3A** / the deeper, warmer gold #EDB141 (the
   only measured option; A/B in the mockup).
7. Ownership band at Near: **capped at 9 px** / as approved (it grows to 13 px).
8. Tracks at middle zoom: **full tracks** / crossings only (the third nearest each border), decided
   after the diagram check.
9. Two motif changes: **Artifice's mill becomes a water mill with a wheel, and the Wasteland skull
   stamp becomes a rock** / keep them.

---

## Appendix: files

- This design: `handdrawn-design/final.md` (from `design.md`, after `judge1.md` and `judge2.md`).
- Measurements: `handdrawn-design/final-calc/final.ts`, `final2.ts`, `tracks.ts`, `labels11.cjs` and
  their `.out` files; earlier `handdrawn-design/calc/`; the reviews' `judge1-calc/` and
  `judge2-calc/`.
- Research: `handdrawn-design/research-style.md`, `research-techniques.md` (with `bench/`);
  `wartable-design/research-mapdetail.md`, `research-tabletop.md`.
- Target-feel reference (a generated image, not an asset, not to be traced):
  `handdrawn-design/reference-map.png`.
- Approved design: `wartable-design/final.md`, `owner-answers.md`; mockup parts
  `wartable-design/mock-work/parts/`, v2 backup `handdrawn-design/parts-v2-backup/`.

---

## Rulings after the v3 critique (2026-10-22, applied in the mockup)

From `handdrawn-design/critique.md`, applied to `wartable-design/mock-work/parts/`:

- **H12 amended at Far only.** At Far, region names are placed before the place names of minor
  provinces: a province that is not a capital or Wellspring, not the viewer's, holds no visible army,
  is not selected and is not contested (no siege, no pillage, no other nation's dominion over owned
  land). Those names show again at Mid and Near. Capitals, Wellsprings, wild names, tokens and the
  major names still come first, and no glyph box (plus 2 px) overlaps any of them. At Mid, H12
  stands: region names are placed last and never cull a label. Measured on this sheet: 4 of 6 region
  names at Far, 4 of 6 at the start zoom.
- **§1.3 deviation: paper and granulation tiles scale per band.** One tile pixel is U × {Far 4,
  Mid 2.4, Near 1.2} instead of 1 u, so the paper tooth is about 1.5 screen px at the start zoom.
  Amplitudes, alpha and the soft-light blend are unchanged. The paper's coarse octave is 6 cells, not 11.
- **§3.9 placement at Mid.** The search uses offsets of -0.5 D to +0.5 D in steps of 1/16 D and the
  two-province chains as well as the longest ones. It sizes each name from its spine at 10 px up to the
  §3.9 size, and needs 60% of the glyph centers inside the run (was 75%). The last resort is §3.9's
  straight line, along the run's axis or level, scanned across the run. Settlements are avoided by
  their drawn extent: the houses with their roofs and any temple, lab or keep, plus the pennant as
  its own box.
