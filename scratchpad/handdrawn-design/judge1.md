# Judge 1: owner fidelity, hand-drawn feel and the FFXIV spirit

Lens: would the owner look at v3 and say the map is more interesting, more detailed and hand-drawn, with
the warmth and painterly richness of FFXIV's maps and concept art? What is still flat, digital or generic?
Is anything copied? Do the prompts name a franchise?

Read: both owner directions, owner answers, `design.md` (all), `research-style.md` (sections 0, 1, 3, 4),
`final.md` sections 3.4, 4.2 and 4.3 (kits, land looks, pole motifs), the v2 screenshots (desktop, near,
mid-ashfen, m70-ashfen, wild), the bench renders (`bench/mid.png`, `mid-soft.png`, `near-soft.png`,
`warm60.png`), `reference-map.png`, and `p50-deco.js` (stamp and motif shapes).
My measurements are in `handdrawn-design/judge1-calc/` (`harmony.out`, `farmland.out`, `huemottle.out`,
`huetangent.out`, `prompts.txt`), run with `npx tsx` from the repo against `tests/content/colorMath.ts`.

**Score: 7 / 10.**

## Verdict

The design does what the owner asked for and keeps what the owner approved. The A/B controls (Hand
Painted or v2, Labels, Borders) let the owner judge the whole pass against v2. These additions change the
feel most, and they come in the right order: washes on paper, hand-ruled ink borders, serif ink lettering,
wild names that curve, clumped forests with one outer outline, hachured hills, ridge-profile peaks, dotted
tracks, brooks, ponds, mines, windmills, ruins, bridges, line-art fog and owner-made stamp sheets.
The FFXIV reading is honest: line plus wash, paper under pigment, one warm light with cool shadows, a name
tier per zoom, and illustrated landmarks that say what lives where. Nothing is copied. No prompt names a
game, studio or artist.

It falls short of a 9 for four reasons.

1. **The colors stay as saturated as v2, and the paint is too faint to change that.** FFXIV's maps and
   reference-map.png get their warmth from muted, harmonized color on warm paper. FM's fills are bright.
   Farmland #EEBA3A has chroma 68, and the Swamp teal and the gamboge dominate v2-desktop. H1 locks the fills.
   I checked whether that is too strict. A uniform 15% chroma cut already fails 20/12 once a warm shift is
   added (18.8 / 12.1), and a 30% cut fails outright (`harmony.out`). Only Farmland has a little room: about
   #E6B047 (L 75, C 60) at 22.5 / 13.4 raw (`farmland.out`). So H1 is right. But the design never tells the
   owner that the map will keep v2's bright, saturated colors. It also leaves the hand to paint amplitudes
   that the bench shows are nearly invisible: ±2 L\* mottle on four terrains (see `bench/mid-soft.png`, where
   Hills, Mountains and Swamp still read as flat fields). A hue mottle would add the richness, but it costs
   too much. ±2 a\*b\* drops terrain pairs to 9.2 under CVD (`huemottle.out`), and 10.2 even when limited to
   Plains, Farmland and Forest (`huetangent.out`). The owner needs to hear that the warmth will come from
   ink, paper, light and lettering, not from the land colors, before seeing v3.
2. **The start view hides several of the best new features.** Region names are Far only, and the start
   zoom is Mid (about 95 px per province). Vignettes are Near only. Capitals become illustrations only at
   Far. The first screen the owner sees gains washes, wobble, tracks and small landmarks, but not the
   lettered regions or the illustrated set pieces that make the reference image and FFXIV's maps feel like
   maps.
3. **Several new scenery shapes copy information shapes.** This breaks the design's own rule H6, and H6's
   test only compares id lists, so it would not catch them. The haystacks already on Farmland (every
   non-windmill stamp) and on Plains are half-domes with a shaded right half. The new independent-camp tents
   are the same half-domes at the same size. In fog both become identical line art. The camp count, which
   is information, is lost in the haystacks. There are more collisions in the mustFix list.
4. **The owner is making art now, but owner art comes last.** Owner art is last in the cut order, and
   question 5 defaults to "after the procedural look ships". The mockup has no way for the owner to see
   their own sheet on the map.

## What will read as hand-drawn (keep)

- The ink hierarchy: survey ink on borders, sepia feature ink at 80% on stamps (v2's near-black stamp
  outlines are a big part of its "vector" look), and contour ink on wilds and settlements.
- Forest clumps with one outer outline (the stroke-then-fill trick). This is the single biggest jump from
  v2's scattered lollipop trees (`bench/near-soft.png`) to painted-map forests.
- Hachures on the lower-right flank only, kept off the reserved 45°. Ridge peaks with flat shade faces.
- Ink lettering in Alegreya on a paper halo, wild names that curve along their range, and region names in
  spaced capitals. Lettering is the cheapest carrier of the hand, and the design treats it that way.
- The fog stays "not yet painted": line art on bare cloth. It is on genre (Elden Ring, Civ VI) and charming.
- Cast shadows to the lower right in a cool blue-grey, and warm lit faces.
- The A/B toggles and the `?paintcheck` calibration. They keep the owner in control and the palette honest.

## Still flat, digital or generic

- **The saturated fields** (above). Farmland and Swamp at Mid still read as a board-game political map.
- **Settlements are left out of the one light.** Step 4 changes only the house shadows. Houses, keeps and
  walls keep v2's flat faces under near-black ink (v2-near), next to trees and hills lit warm and cool. The
  most prominent illustrations on the map would then be the least painterly.
- **Ownership bands at Near** are flat strips that scale with zoom: about 25 px of #FD6533 in v2-near.
  They are the most digital thing on a near view and cover the edge pool, the watercolor signature, on every
  owned province. The design leaves bands "unchanged (approved)" and never notes that the pool vanishes
  under them.
- **Tracks between every neighbor pair** are right for the rules (H4), but they risk a Delaunay-graph look:
  5 to 7 dotted spokes per seat, each two clean quadratics. The reference image's roads meander and are
  fewer. The design has no check for the "diagram" read.
- **The style sentence** does not steer away from the generic AI "old parchment" cliché (dark vignette,
  stains, grunge), which reference-map.png itself shows. FFXIV's painted maps and concept art are cleaner,
  more luminous and airier than that.

## Copying and naming check

- Prompts: I extracted all 107 lines of the `text` blocks (`judge1-calc/prompts.txt`) and checked them
  against a list of franchise, studio and artist names (Final Fantasy, FFXIV, Eorzea, Square Enix, Yoshida,
  Tolkien, Baynes, Azgaar, Elden, Witcher, Dragon Age, Trajan, Crusader, Civilization, aetheryte, moogle,
  chocobo). There are no hits. "Crystals" appears only as a negative ("no crystals", H10), which keeps the
  Wellspring away from an aetheryte read. Good.
- Content: no FFXIV layouts, region shapes, place names, icons, frames or fonts. Marcellus SC was already
  approved and is a generic classical titling face. The five-drop basin is FM's own. "The Ashspine" uses a
  common fantasy term. The procedural region-name generator (prefix plus suffix) could still produce a famous
  game place name by chance, so add a denylist test (graft).
- Docs text (§8.1) names FFXIV as the owner's inspiration and quotes the owner verbatim. That is correct for
  internal docs.

## mustFix

1. **Camp tents vs haystacks.** Change the scenery, not the information. Replace the haystack half-dome
   (`haystack()` in p50-deco.js, used for every Farmland stamp and for Plains when s.v > 0.94) with upright
   tied sheaf stooks or a ridged rectangular rick. Keep the dome silhouette for the 1 to 4 camp tents, and
   check the fog line-art versions separately.
2. **Make H6 a shape-family check, not an id check.** Add a table of silhouette families to §3.11 and to
   `landmarks.test.ts`, and fix these collisions:
   - Drop the broken obelisk. It is a tall narrow stone, like the Lore and Thornwood standing stones, the
     Cinder obsidian shards and the Cinder lab spire.
   - Drop the doorway cut into a cliff. It is a cliff drawing outside a wild, which §2.3 reserves.
   - Drop or redraw the cave mouth in an outcrop, and give the barrow with a stone door a clearly different
     silhouette. Both are mound-plus-dark-hole shapes, like Wild's beast den.
   - Remove the mine cart from the mine adit. It reads as Turmoil's toppled cart.
   - Replace the dust devil vignette. It is a pale rising spiral, which reads as smoke (pillage, unrest,
     Turmoil's smoke wisp, Burn the Fields). A hare or a lizard on a flat rock would work.
   - Make any bird vignette pale and never dark (crows are Dread and battle scars).
   - Note that pale paper-ink tracks on Forest, Hills and Swamp sit next to Sanctity's (and M2 Radiance's)
     pale-stone path. Dots against a solid path is the stated difference; test it.
3. **Put settlements under the one light.** Specify warm lit and cool shade faces (`faces()`) for roof
   planes, keeps, walls and landmarks of every kit, re-run the 3:1 kit-tone test (final §3.11 item 6), and
   add it to Step 4.
4. **Tell the owner about color before showing v3.** Add an owner-facing paragraph to §1.1 and an owner
   question to §10.2: "The land keeps its bright, distinct terrain colors (colorblind safety); the painted
   warmth comes from ink, paper, light and lettering." Offer the one measured option there is: Farmland
   trimmed to about #E6B047 (raw 22.5 / 13.4; re-run `pairs.ts` and the band rule on the painted extremes
   before offering it).
5. **Let the owner see their own art now.** Owner direction item 4 says the owner is making art with ChatGPT
   now.
   - Add a mockup control, "Try your art", that loads a local PNG through a file input. It runs a mini intake
     (alpha check, component split, luminance recolor per §6.5) and rebakes with the sheet for H1 (paper),
     H2 (trees) and H4 (relief).
   - Change question 5's default to "in the mockup as soon as a sheet passes intake; in the game after the
     procedural look ships".
   - On the intake contact sheet, show each raw image next to its recolored, on-map result. The ChatGPT art
     will come back in the saturated terrain faces, and the owner should see that before approving.
6. **Make the prompts consistent with the spec.**
   - §3.10 lists 6 vignettes, but the H9 prompt asks for 8 (adds a fox and geese). Align them, dropping the
     geese for the crow reason.
   - The H5 prompt asks for two bridges, but §3.4 bridges are procedural decks aligned to the track, and a
     raster can't align. Move them to "stays procedural".
   - The H5 prompt also asks for a flat-topped mesa with layered stripes. It is not in §3.4, and the stripes
     invite hatching. Drop it.
   - The H5 windmill prompt says "sails set at a slant", which invites 45°, and the intake will refuse that.
     Say "sails turned a little from upright, never at 45 degrees".
   - The H5 prompt still lists the obelisk, the cliff doorway, the cave outcrop and the mine cart. Drop them
     per item 2.
7. **Keep the edge pool visible on owned land.** Draw the edge pool from the band's inner edge (inset the
   inner-shadow polygon by the band width) whenever the province has an owner band. Otherwise the main
   watercolor cue disappears under the band on most of the map from midgame on.

## Ideas to graft

- **Region names at the start zoom.** Show region names in the lower part of Mid (median province under
  about 110 px) at 13 to 15 px, 70% alpha, collision-tested and dropped first. The owner's first screen then
  has the lettered-regions look of FFXIV's region maps.
- **One hero landmark per region.** For each region component (§3.9), add one large illustrated scenery set
  piece at 2 to 3 times landmark size, at Far and Mid, outside boxes, seeded. Examples: a colossal fallen
  statue in the Barrens, a giant elder stump in the wold, a great ruined bridge pier in the fens. This is the
  mappa-mundi "illustrations of what lives where" principle (research §1.3). It is the closest FM can get to
  concept-art set pieces without touching information, and it fits H6 if shape-checked.
- **Pigment flecks instead of a hue mottle.** Hue mottle fails the measurements, so add hue richness through
  tiny, low-coverage marks that never move region means: wildflower dots on Plains at Near, ochre lichen on
  Mountains scree, rust flecks on Wasteland, pale sedge heads on Swamp. Keep coverage under 3%, never in
  banner or mana hues, and count them in the density budget.
- **Painted relief shading as pigment.** Give each hump or peak a soft cool wash on the ground to its lower
  right (larger and fainter than the cast shadow, merging between neighbors, mean-compensated with a lift).
  Hills provinces then read as painted terrain, not flat ground with humps on it. It stays a local pigment
  term, not a light on the cloth.
- **A track character pass.** Add a seeded low-frequency meander along each track (not only two
  quadratics) and a 10 to 20% jitter in dot spacing. Add a v3 screenshot check for the "graph" read. If it
  reads as a diagram at Mid, draw only the border-crossing third of each track at Mid and full tracks at Near.
- **Wash overrun at the map edge.** Let the outer provinces' wash bleed 2 to 4 px past the outline into the
  margin as an irregular, lighter watercolor edge under the neatline. It suggests the painter's hand at the
  sheet's edge, the softened FFXIV edge without an edge fade, and it changes no fill.
- **Band width cap at Near.** Cap the ownership band's on-screen width (for example 8 to 10 px) so it reads
  as an inked ribbon, not a moat. This needs owner sign-off, since bands are approved.
- **Elegance cues in the prompts.** Add "luminous, airy light; refined, delicate detail; clean paper without
  heavy aging, burns or grunge" to the style sentence. Offer an A/B cartouche and corner prompt with "flowing
  Art Nouveau-influenced curves and oak leaves". Art Nouveau is a public art movement that the research
  links to that game's art books, and it brings the elegance without copying any frame.
- **A denylist test for generated names.** Check region and wild names against a short list of famous game
  and fiction place names, so a generator never lands on one by chance.
- **Step 14 deliverable:** `v3-vs-reference.png`, the start view beside `reference-map.png` at the same
  size, so the owner can judge the gap directly.

## Things to drop

- The broken obelisk, the cliff doorway, the cave outcrop and the mine cart (shape collisions, item 2).
- The dust devil vignette and the geese vignette.
- The mesa with layered stripes and the two bridges in the H5 prompt.
- The H6 id-disjointness test as the only guard. Keep it, but it does not guard what H6 promises.
