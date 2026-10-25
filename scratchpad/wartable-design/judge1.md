# Judge 1: owner fidelity and immersion

Lens: does the design do what the owner asked, sentence by sentence, and does it feel like a cozy,
natural tavern rather than a dark UI with a wood texture? Readability, rules, feasibility and
cohesion are scored too, but owner fidelity breaks ties.

Inputs read in full: `proposal-instrument.md`, `proposal-immersion.md`, `owner-direction.md`. The
immersion calibration sketch renders (`sketch/sketch-{mid,near,far,dominion}.png`), its prototype
maps (`proto-out/proto-medium-s2.png`), and every `.out` in `calc/` and `tools/`. Spot checks
against the repo (`src/mapgen/generate.ts`, `src/mapgen/types.ts`, `src/sim/tick.ts`,
`tests/sim/determinism.test.ts`, `src/content/colors.ts`, every `.neighbors` reader in `src/sim`
and `/home/user/fm-p7f/src/ai`), the staged `docs/07` and `docs/09`, `battle-design/final.md`
(rand.ts, S4.4 portraits, seasons), `pretender-design/final.md` (B.7, B.8, C.4, the naming
tables, the owner's answers) and `units-items-design` (portrait frame extras, head items).

My own measurements are in `judge1-calc/`:
- `impassable-grounds.ts/.out`: the proposals' impassable grounds, plus a search for passing
  granite and water tones;
- `water-vs-identity.ts/.out` and `slate-vs-umbra.ts/.out`: the dark grounds against the mana and
  banner colors;
- `brass.ts/.out`: each brass tone against the Radiance colors.

All use the repo's `tests/content/colorMath.ts`.

---

## Verdict

**Base: proposal-immersion.** It is the only one that answers every sentence of the owner's
direction visibly, and it shows that it does: the sketch has noticeable massifs, meres and ridges,
a dense painted map, settlements, land looks and faces. Graft the instrument proposal's
discipline onto it: the switch-and-bit-identity landing, palette-tested impassable grounds,
decoration out of data modes, label-box exclusion, aged brass, the no-repeat captain deck, the
footpath on passable mountains, and the rustic table details.

| | ownerFidelity | readability | rulesSoundness | feasibility | cohesion | total |
|---|---|---|---|---|---|---|
| Instrument | 6 | 9 | 8 | 8 | 6 | 6.5 |
| Immersion | 9 | 6 | 7 | 5.5 | 7.5 | 7.5 |

---

## The owner's sentences, one by one

| Owner said | Instrument | Immersion |
|---|---|---|
| "the UI is fluid, the hover is intuitive and responsive, the alerts row is good, each thing to try is good" | **Untouched.** Tokens keep their values, and tooltips, alerts, outliner and panels are unchanged. The best of the two here. | Behavior untouched, and the bake is blitted under live hover. But it **retunes `--chrome-0/1/2` to warm browns** and puts **parchment faces on cards**, which includes unit cards inside the approved panels. Contrast passes for text, `--warm` and `--cool`. Alert tiers, mana symbols and banners on the new browns are **not measured**. |
| "i would like more detail on the map" | Ground textures (±8% L\*) plus at most 18 standing stamps per province at Mid. Restrained, and **no rendering shown**, so the owner cannot judge "more detail". | Forest 42, swamp 14 and plains 14 stamps per province at Mid, plus settlements, painted grain and miniatures. The sketch shows a rich painted map at Mid and Near. Clearly "more detail". The sketch also shows clutter bugs: three "the Ashspine" labels, two "Blackmere" meres, "mod" glyphs over names, and a miniature over "Marholt". |
| "impassible terrain that is noticeable" | Wild regions in slate #24222A, **the darkest ground on the sheet** (L\* 13.7). It passes the pair rule (25.4 / 22.5 / 20.3 / 15.5) and has a cliff-tick rim and kind stamps. Strongly noticeable by lightness. But a dead lake and a chasm are the same near-black slate with faint #4A4B5A ripples or a #0E0D10 rift. They read as a hole in the vellum, not as water or a gorge: noticeable but not natural. | Granite massifs, night-water meres and ridge chains. The sketch proves they are noticeable at Far, Mid and Near and in Dominion mode, and they read as landscape (ranges with spurs and passes). **But the granite #5E5953 fails docs/09's terrain-pair rule** (18.3 normal, 11.9 protan, 10.7 deutan vs Forest). The mere #182A36 fails tritan (10.8 vs Forest). Neither failure is disclosed. Ridge rock #B8BFC4 has 1.40:1 on Mountains and nearly matches the passable Mountains' lit stamp #B4C1C6, while ridges prefer Mountains and Hills borders. |
| "the detail view on the lands are great" | Kept. | Kept in layout. Parchment unit cards would restyle content inside it: needs owner sign-off. |
| "some art assets to show the growth over time … based on alignment too!" | Derived from existing state: settlements by population with thriving and declining (pop vs `startPop`), walls by PD, kits by owner, a temple without faith (unlit brazier), dominion motifs in 8 / 15 / 22% of slots near the seat. **Scale-pole motifs at Near only**, so alignment barely shows at the default zoom. No tint. | Settlements in five tiers on a golden-angle spiral, kits, walls, construction. A **land look per nation**: a wash with a *computed* cap that passes the palette test (Cinder 12%, Thornwood 8%), plus motifs and a landmark at strength 7. **Pole motifs at Mid.** A brush-wipe repaint that sweeps from the dominating nation's side, so spread is visible. A time-lapse slider in the mockup. Clearly answers "based on alignment". |
| "leaders certainly need portraits" | Every commander gets a seeded bust: rendezvous over append-only part tables, rank frames, allegiance frame shapes, state overlays, units-items gear chip. A **no-repeat deck for independent captains** (768 looks, keyed by province). Personal names deferred to "a separate small task". | The same bust system with frames by material (oak, bronze, brass, gilded, pewter, elemental). Replay docks use the bust (one-line battle S4.4 change). **Personal names (M1-should, pure hash)**, which do half the work of making a leader a *character*. Independents use terrain pools with about a 4% repeat rate (the deck deferred). The sketch's busts read at 32 to 72 px but look alike: names and silhouettes carry identity. |
| "the overall map should be on a rustic wartable in a cozy but natural tavern, nice oak wood" | Vellum on oiled quarter-sawn oak, with **rustic** detail: forged iron straps with nail heads, knife marks, a tankard ring, a bread board. **But the tavern is nearly never seen.** At fit, the sheet fills the view with a 14 px pad. The room shows only near 0.72× fit, and on Medium at 1280×720 only as slivers at the sides. The room is a *perspective* backdrop ("seen from a seat") behind a *top-down* table: a projection seam. The chrome concept is a "dark instrument case": flat dark docks with oak bars and brass lines. That is very close to "a generic dark UI with a wood texture". | A painted cloth on oak with a **32 px oak band at the start zoom**, props peeking at the corners (sketch-mid). Lean-back reveals the whole table and a **top-down tavern floor in the same projection**: hearth glow from one side, window light from the other, rug, bench, barrel, sleeping hound. **Seasons** follow the battle track's months. **Mirror props**: a month candle burning down, an hourglass on its side while paused, a purse. Warm oak and brass chrome. This reads as a cozy tavern. Less *rustic* than the instrument (brass corner guards, not iron straps), and the sketch's oak is flat and cartoony until owner rasters land. |

**Harmony with the sibling tracks**

| Track | Instrument | Immersion |
|---|---|---|
| Battle | Busts on name cards and docks. Shares the battle backdrops' prop kit and season months. The oak and brass replay modal frame avoids Hand of Fate 2's seam (a good idea). **Creates its own `src/present/portrait/hash.ts` (FNV-1a and Mulberry32)**, duplicating the battle track's `src/present/rand.ts` (`hash32`, `streamFor`). | Reuses `src/present/rand.ts`. Shares the prop kit and seasons. Writes the exact S4.4 line change. Does not give the replay modal the oak hardware. |
| Pretender | B.7 sigil, B.8 rig portraits, C.4 marks. Asks the pretender track to turn Ash Rain's tint into a stipple; I agree a tint must pass a cap. | Adopts C.4 "unchanged", including Burn the Fields' "charred-field hatch". Docs/09 reserves the 45° hatch (unreachable) and cross-hatch (starving). Its own peaks use "ink hatching at 45°" on shadow faces. Neither proposal fixes the anchor grid against B.8's 256-unit grid. Immersion contradicts itself: SVG eye line y 122 (47.7%), raster brief eyes at 38 to 40%. |
| Units and items | Gear chip ○ ◆ ★ on the portrait frame and ★ on the token, as the units design specifies. | **Omits the gear chip.** It says a head item *replaces* the headgear layer, where the units design *adds* a crown part over the helm. |

---

## Ruling on impassable terrain

**Adopt regions (peaks and meres) plus ridges anchored to the peak ranges. Land them behind a
switch, the instrument's two-commit way.**

1. **Model.**
   - **Peaks** (ranges of 1 to 3 cells) and **meres** (single cells) are map cells that are not
     provinces.
   - **Ridges** are impassable shared borders, allowed **only as spurs or chains that start at a
     peak range** (at most 2 spurs per peak, chains at most 4 borders). No free-standing ridge
     between two Hills or Mountains provinces in M1.
   - Every ridge then reads as part of a named range ("a spur of the Ashspine"). This answers the
     instrument's real objection (a lone line competing with borders looks arbitrary, research
     2.2). It keeps what the immersion sketch shows the owner wants: ranges with spurs and passes,
     which read as natural landscape.
   - Chasms or rifts are Later (M2, with the Hollow Court), or M1-should if art time allows.
2. **One rule, no sim branch.** `MapProvince.neighbors` keeps meaning "passable neighbors".
   - Every sim and AI reader respects the barrier, verified: `movement.ts:73`, `commands/army.ts:58`,
     `conflict.ts:98`, `visibility.ts:26-37`, `dominion.ts:102`, `rituals.ts:37`,
     `selectors.ts:200`, and the AI's `assess`, `army`, `defense` and `magic`. No AI file reads
     geometry.
   - Add `MapProvince.ridges` and `beside`, plus `MapData.impassable`. Region ids must not consume
     the province id counter, so p0 to p{n-1} and commander ids are unchanged.
   - The move refusal names the barrier.
3. **Placement guards** (immersion's, because they were measured on the real algorithm over 100
   to 200 seeds, including after the balance search):
   - regions are interior (no vertex on the outline, so a mere never reads as a sea; the
     instrument lets range growth touch the outline);
   - regions are at least **3 cell hops** from every capital and ridges at least 2. This keeps
     each capital's 2-hop ring with the same members. The instrument's "not a capital and not
     adjacent" lets a wild fall inside the ring, and its balance was measured only on first
     attempts and in a different order than it specifies (Large 2-nation: 23/60 against 32/60);
   - the province graph stays 2-connected, with at least 2 neighbors each;
   - ridge detour at most 4 hops, region detour at most 6;
   - Wellsprings, springs, names, population and capital distance are placed on the passable graph.
4. **Terrain.** Prefer the instrument's order: rank terrain over the remaining province cells
   only, which keeps exact shares with no `counts` argument and keeps the rng stream identical
   when the switch is off. Re-measure the post-search capital balance for 2, 3 and 4 nations with
   the final order. Raise `balanceCandidates` from 6 to 10 only if the measurement needs it (the
   immersion measured that it does for 4 nations under its own order: 34% → 50%).
5. **Landing** (instrument 2.7):
   - **Commit A** puts it behind `MapGenParams.impassable` (default false). A pinned
     `JSON.stringify` hash proves today's maps do not move.
   - **Commit B**, after Phase 7 merges, turns it on in New Game and `sim:aivai`, bumps
     `STATE_VERSION` with a migration to empty fields, re-pins seed-dependent tests, and
     re-measures the AI matchup once.
   - The determinism test compares two runs, so it needs no re-pin (instrument 2.7 says
     otherwise; minor).
6. **Art.** It must be noticeable *and* natural, and pass the palette rule:
   - **Peak ground:** a dark granite near **#302F32** (L\* 19.6; 20.9 / 17.7 / 15.5 / 12.9:
     passes). #343336 (L\* 21.4) is the lightest neutral grey that passes. The massif stamps
     (lit faces, snowcaps, ink outline) cover it, so it reads as grey-and-white mountains with
     dark shadow between them. That keeps the instrument's "darkest land" glance signal.
   - **Mere ground:** near-neutral dark water, such as the instrument's slate **#24222A**
     (passes), carrying pale ripples #8FC3D3 (7.7:1) and reeds.
     - Not violet: #302858 passes the terrain rule but is ΔE 5.4 normal and 3.6 protan from the
       Umbra banner #3D2B4F.
     - Not #182A36: it fails tritan.
   - **Shared signature on every kind:** an ink contour plus a light inner keyline or cliff-tick
     rim. Never tinted, ghosted, hatched or fogged, at every zoom and in every mode.
   - **Ridges:** a 4.5 px ink spine with **snow-capped** peaks astride it. Passable Mountains keep
     snowless low peaks, gain the instrument's dashed footpath, and keep their stamps out of a
     buffer along any ridged border.
   - **Labels:** one name per range, unique against province names.
   - **Palette test:** add the impassable grounds to the pair test, and test them against all five
     colors' banners (the instrument checked only the M1 variants; its slate is 14.0 normal and
     9.0 tritan from the M2 Umbra banner).
7. **Invariants at risk**, which the final must restate and test:
   - "Adjacency only through shared segments" becomes "`neighbors ∪ ridges` = shared segments".
   - The 1.5× capital-ring balance.
   - Generation time: the immersion prototype took 580 ms on Medium with 4 nations, against its
     own 500 ms budget.
   - Exact terrain shares.
   - The state version and save migration.
   - AI baselines and seed-pinned tests move once, in commit B.
8. **Owner approval.** Ask in one question, with the prototype pictures, as the immersion
   suggests. Ridges are a content number (`ridgeShare`), so the owner can set it to 0 with no
   code change.

---

## Must fix (in the final)

1. **Impassable grounds.** Replace the immersion's granite #5E5953 and mere #182A36 with tones
   that pass the docs/09 pair rule: dark granite about #302F32 under the massif stamps, and
   near-neutral dark water about #24222A with pale ripples. Never violet (Umbra), never navy
   (Tide). Add both to `palette.test.ts`, and test them against all five color banners. Disclose
   the numbers in docs/09-balance.
2. **Brass.**
   - Broad brass (action-button keylines, brackets, frames) uses aged brass **#B8914A** (≥ 10.5
     from the Radiance secondary under every vision).
   - The immersion's `--brass` **#DBBD76 is ΔE 3.8 normal and 2.1 tritan from the Radiance
     secondary #D9B85C**. Restrict it to 1 px highlights.
   - No round brass at all: rivets, tacks and studs become square.
   - The pip ring always sits on a 2 px chrome ring outside any metal frame (instrument 6.5). The
     immersion puts the pip ring on a brass rank frame.
3. **Reload stability of monthly looks.** Both proposals freeze slow looks to the month.
   Population and unrest change daily (`tick.ts`), so a mid-month reload recomputes a different
   look. That is the "flicker between reloads" the task forbids.
   - Persist the per-province slow look keys in the save's UI block at each month boundary, as the
     `BattleSummary` list already is.
   - Test: save on day 17, reload, and the look keys are equal.
4. **Data modes.** In every mode but Ownership, terrain stamps and motifs fade out (instrument
   4.7), not ghost to 40%. In the immersion's Dominion sketch, forest stamp density shifts the
   perceived ramp. Keep impassable terrain, ritual marks, siege marks and the mode's second
   channel. Undominated provinces in Dominion mode show desaturated terrain, never flat grey
   (immersion's catch).
5. **No light on the sheet.** Drop the immersion's 8% 2700 K multiply on the cloth (instrument
   rule 1). If kept, the palette test must check the wash, the grade and the fog haze together,
   not each alone.
6. **Labels.**
   - One label per impassable range, with unique names (the sketch has three "the Ashspine" and
     two "Blackmere").
   - Miniatures anchor above the label.
   - Standing stamps stay out of label and badge boxes plus 4 px (instrument's box rule, stricter
     than the immersion's disc).
   - Extend the `layoutMapLabels` test to stamps, settlements, region labels and miniature boxes.
7. **Units and items.** Put the gear chip (count plus best tier ○ ◆ ★) on the portrait frame and
   ★ on the token. A head item *adds* its part over the headgear, as the units design's rigs do.
   It does not replace it.
8. **One portrait anchor grid.** Use one grid for SVG busts, the B.8 rig portrait pose, the raster
   style lock and the intake crop. Write it in docs/09. The immersion's SVG eye line y 122 (47.7%)
   contradicts its raster brief (38 to 40%), and the instrument uses 39%.
9. **One seeded-hash module.** Use the battle track's `src/present/rand.ts` (`hash32`,
   `streamFor`) for stamps, props and portraits. No separate FNV-1a and Mulberry32 module.
10. **Reserved patterns and pretender C.4.**
    - No presentation art uses a uniform straight hatch or cross-hatch (docs/09 reserves them).
    - Drop the 45° hatching on peak shadow faces.
    - Ask the pretender track that Burn the Fields' mark be irregular char patches, not a hatch,
      and that Ash Rain's tint pass the same computed wash cap as a land look.
    - Add the instrument's content test for line angles and coverage.
11. **Approved UI.**
    - Do not restyle the province detail panel or its cards. Parchment goes only on Codex article
      pages and the battle report card, unless the owner approves more from a mockup A/B.
    - Before adopting the warm `--chrome-*` retune, measure every alert tier color, the five mana
      symbols and every banner on `--chrome-0/1/2`, and put the old and new chrome side by side in
      the mockup.
12. **The tavern must be felt at the default zoom, in one projection.**
    - Keep the immersion's 32 px oak band, the corner props and the top-down room.
    - Do not use the instrument's perspective "seen from a seat" backdrop behind a top-down table.
    - Add the instrument's rustic details to the table: forged iron corner straps with nail heads,
      knife marks, a tankard ring, a bread board, quill and inkpot, brass dividers. Iron is more
      rustic than polished brass corner guards.
13. **Owner raster art is not the first cut.**
    - The owner offered to generate art. Land `scripts/art-intake.ts` in Phase 9 and send the
      table, room and portrait style-anchor prompts early (task #29).
    - Keep the procedural fallback, and cut raster *integration* only if the intake is late.
    - The immersion's cut order puts owner rasters first. Reverse that.
14. **Feasibility.**
    - The immersion's M1 floor is large: ridges, three-band bakes, miniatures cut from rigs, about
      230 SVGs, mirror props, seasons, the wipe.
    - Keep the instrument's time box: Phase 8 table and detail work is at most about a quarter of
      the Phase 8 diff, and the rest moves to Phase 11.
    - Make miniature figures depend on the battle rigs landing (Phase 10), with plaques before.
    - Set a generation-time test the implementation can meet, with incremental detour checks.

## Graft into the final

**From the instrument proposal**
- The two-commit landing behind `MapGenParams` with a pinned bit-identity hash.
- The dashed footpath that marks passable Mountains as "a way through".
- The no-repeat deck for independent captains, keyed by province, with no new state.
- The thriving and declining marks from `pop / startPop`.
- A temple without faith shows an unlit brazier.
- Decoration fades out in data modes.
- Ground textures within ±8% L\*, with ±4% under labels.
- The content test that bans reserved state patterns.
- The aged brass token and the pip-ring separation ring.
- Square brass tacks.
- Rustic table details (iron straps, knife marks, tankard ring).
- The replay modal shares the oak and brass hardware.
- Wilds and impassable terrain are never fogged.
- Mockup: CVD vision preview, a Far/Mid/Near band chip, and a population-mode screenshot showing
  decoration off and impassable terrain on.
- The art-intake checks: luminance-centroid crop, chroma flag outside the eyes, provenance
  sidecar, contact sheet.

**From the immersion proposal**
- Ridges as spurs of named ranges.
- Impassable hover card listing the bordered provinces as links.
- Move feedback: "around the Ashspine" in the ETA, and a no-path reason that names the barrier and
  the hostile province closing the way around.
- The start zoom's 32 px oak band.
- The top-down tavern floor in the same projection (hearth, window, rug, hound), with seasons
  following the battle track's months.
- Mirror props (month candle, hourglass on its side while paused, purse), never the only home of
  a fact.
- Land looks with a **computed** wash cap tested per `LandLook`, plus nation motifs and a
  strength-7 landmark.
- Pole motifs at **Mid**, not Near only.
- The brush-wipe repaint from the dominating nation's side, at most 8 animated per month end.
- Painted miniatures (figure, base, plaque = badge), and a cloaked figure for unscouted forces.
- Fog as "not yet painted": sepia line art, with stamps carrying terrain identity under haze
  (measured: 20% haze drops Hills/Wasteland to 18.7).
- Settlements on a golden-angle spiral; growth appends, decline removes the newest.
- **Personal names** for commanders as a pure hash with no rng draw, reusing the pretender track's
  per-color syllable and epithet tables, shown as "Varo, Ash Chieftain". Recommended M1, because
  a face without a name is not yet a character.
- Rank frames by material, with aged brass.
- Busts in the replay docks (the battle S4.4 line).
- Mockup: the time-lapse slider and the "Passability" review mode.

## Drop

**From the instrument proposal**
- The perspective tavern backdrop behind an orthographic table, and the near-invisible room.
- The "dark instrument case" as the chrome concept. Keep its numbers, not the framing.
- The separate FNV-1a and Mulberry32 hash module.
- One slate look for lakes and chasms, which reads as a hole in the map.
- Scale-pole motifs at Near only.
- Personal names deferred out of this design.

**From the immersion proposal**
- Granite #5E5953 and mere #182A36 (both fail the palette rule).
- `--brass` #DBBD76 as the broad keyline token, and round brass rivets, tacks and studs.
- The 8% warm grade on the cloth.
- Ghosting stamps to 40% in data modes.
- Free-standing ridges not attached to a peak range.
- 45° hatching on peak shadow faces.
- A head item replacing the headgear.
- Parchment faces on cards inside the approved panels, by default.
- Owner raster art as the first cut.
- The terrain-pool independent portraits, replaced by the no-repeat deck.

---

## Evidence I measured

`judge1-calc/impassable-grounds.out`:
```
#5E5953 L*38.1 n 18.3 Forest | p 11.9 | d 10.7 | t 15.7 Hills fail      (immersion granite)
#182A36 L*16.1 n 25.1 Forest | p 22.9 | d 20.4 | t 10.8 Forest fail     (immersion mere)
#24222A L*13.7 n 25.4 Forest | p 22.5 | d 20.3 | t 15.5 Forest PASS     (instrument slate)
#343336 L*21.4 n 20.4 Forest | p 17.1 | d 14.9 | t 12.2 Forest PASS     (lightest passing grey)
#302F32 L*19.6 n 20.9 Forest | p 17.7 | d 15.5 | t 12.9 Forest PASS     (recommended granite)
#302858 L*19.4 n 33.4 Swamp  | p 23.6 | d 19.2 | t 12.5 Forest PASS     (passes, but see below)
```

`judge1-calc/water-vs-identity.out`: #302858 is ΔE 5.4 normal and 3.6 protan from the B banner
#3D2B4F, so violet water is out.

`judge1-calc/slate-vs-umbra.out`: slate #24222A against the B banner #3D2B4F is 14.0 normal and
9.0 tritan, which the instrument's banner check did not cover.

`judge1-calc/brass.out`: #DBBD76 against the Radiance secondary #D9B85C is 3.8 / 4.1 / 3.6 / 2.1.
#B8914A is 11.6 / 11.4 / 10.5 / 10.7.

Repo checks:
- `src/sim/tick.ts`: population and unrest move daily, and dominion spreads on the month's last
  day. This is the reload-stability issue.
- `tests/sim/determinism.test.ts` compares two runs, with no pinned hash.
- The B banner and the dark keyline colors come from `src/content/colors.ts`.
