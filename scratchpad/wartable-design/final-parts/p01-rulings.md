## Rulings

Each decision taken in this synthesis, with its reason. "J1" and "J2" are the two judges.
Measured numbers come from `final-calc/` unless another file is named.

### Where the judges disagree

**R1. Base: the immersion proposal's experience on the instrument proposal's engineering.**
- J1 favors immersion (7.5 against 6.5); J2 favors instrument (8.1 against 6.9). The means tie
  (instrument 7.3, immersion 7.2), so owner fidelity breaks the tie: this pass exists to answer
  the owner's direction.
- The instrument's gaps are structural. Its room shows only near 0.72× fit, as a perspective
  backdrop behind a top-down table. Its chrome concept reads as a dark UI with a wood texture.
  Its alignment motifs show at Near only, and it defers names.
- The immersion's gaps are values and scope: two failing grounds, a warm grade, bright brass, a
  bake budget wrong for Large maps, and the largest M1. Every one is fixed below with a
  measurement.
- So the experience is the immersion's: the tavern at the default zoom, a top-down room in one
  projection, massifs and meres, land looks and pole motifs at Mid, named leaders. The rules
  around it are the instrument's: a neutral sheet, decoration below information and out of data
  modes, the box rule for labels, aged brass, the two-commit landing, the time box.

**R2. Impassable terrain is wild regions only in M1. Ridges wait for M2.**
- J1 wanted ridges anchored to peak ranges; J2 wanted regions only.
- J2's readability case decides it:
  - a ridge is a line competing with borders, bands, the hover outline, path previews and the
    ritual contour, and at Far zoom it reads as a thick border;
  - two provinces that visibly touch would not be neighbors;
  - ridge rock is 1.40:1 on Mountains (J2).
- J1's own ruling had to restrict ridges to spurs to make them read.
- Regions alone put 35 to 40% of provinces next to a barrier (measured on every size), are the
  most noticeable model at Far, can be named, and add no province field.
- Ranges of 1 to 3 cells already give chains. M2 can add ridges with passes and fliers without
  changing any reader, because `neighbors` keeps its meaning.
- J1's must-fix "restrict ridges to spurs and re-measure" is therefore moot.
- **Chasms** also wait for M2 (with a Rot nation). The model takes a third kind with no rule
  change. The instrument's chasm read as a hole in the map (J1).

**R3. Saves: one version bump with a one-line migration, in commit A.** J1 asked for a bump and a
migration; J2 showed that no save exists before Phase 9. Since the judges wrote, the repository
settled the question: Phase 10 S1 (`7a524b8`) moved `STATE_VERSION` to 2 before any save exists
and added the migration map `src/sim/migrate.ts`, so every later migration stays trivial
(docs/10: S1 lands "before Phase 9 creates saves, so its migration stays trivial"). Commit A adds
`MapData.wilds` to the state, so it takes the next version with the entry
`state.map.wilds ??= []`, following that precedent. Nothing else about saves changes.

**R4. Personal names are presentation state, kept in the save's UI block.**
- J1 recommended names in M1 as a pure hash inside `src/sim`. J2 noted that this breaks
  CLAUDE.md's "all randomness goes through `state.rng`".
- Names change no rule, so they belong with faces in presentation. `src/present/names.ts` deals
  each nation's commanders the next unused name from a deck seeded by `hash32` (R13). The UI
  block stores the assignment, so a name never changes and never repeats in a nation until the
  deck runs out.
- A pure hash cannot avoid repeats. With 12 commanders alive and 120 names, two share a name in
  about 4 games of 10 (birthday bound, 1 − e^(−66/120)).
- The game loop assigns names after every simulated day, so every commander has a name from the
  day it exists, on any machine.

**R5. Repaints: a 600 ms cross-fade in M1, the directional brush wipe M1-should.** J1 grafted the
wipe from the dominating nation's side; J2 dropped it for a plain cross-fade. The cross-fade
ships in Phase 11. The wipe is a Phase 12 item on the cut list. It is the clearest picture of
"growth over time, based on alignment", and it is cheap (one mask per province, at most 8 at a
month end).

**R6. Seasons: the room's window light and frost M1-should; seasonal stamps Later.** J1 grafted
seasons on the room; J2 moved all seasonal variants to M2. The room change is four color sets
and a frost overlay on art that is already procedural. Stamp variants double the stamp atlas, so
they wait.

**R7. Armies: painted tokens in M1, standees at Near M1-should, escorts Later.** J1 grafted
miniatures at Mid; J2 kept tokens, with at most a standee at Near. The Mid density budget (96 ×
30 px labels on about 100 px provinces) decides it: a 30 to 46 px figure on every army at Mid
crowds labels. At Near the badge box grows to hold the lead commander's standee, cut from its
battle rig after Phase 10. An unscouted independent force is a cloaked standee with its strength
word.

**R8. Props: the month candle and the hourglass are M1-should mirrors; the coin purse is
dropped.** J2 is right that a purse is a fourth copy of the treasury tied to upkeep thresholds.
The candle (`1 − day/30` of wax) and the hourglass (on its side while paused) repeat the clock's
two facts in the room's language. Neither is ever the only home of a fact.

**R9. Two wild grounds with one signature.** J1 wanted granite for peaks and water for meres
(natural); J2 wanted one slate family. Kinds keep their own ground, because one near-black slate
for a lake reads as a hole (J1). Both are the darkest grounds on the map, both carry the same
ink contour and light rim, and two ranges never touch (they are 3 cells apart). Granite against
water is only 4.0 apart, which is why the kind is carried by stamp shape (snow-capped peaks
against ripples and reeds).

**R10. The battle star on army tokens waits for M2.** J1's must-fix 7 asks for a ★ on the army
token "as the units design specifies". The later units final moves it to M2 (`units-items-design/final.md`,
should-drop S3, "artifact stars on army badges", and its M2 list). This design follows the later
final and reserves the token's lower corner for it. The gear chip on the portrait frame and the
head item drawn over the headgear are adopted.

### Rules adopted from both judges, with the measurement behind each

**R11. Wild guards** (J2 must-fix 1, J1 ruling 3). Every wild cell, growth cells included, is
interior (no vertex on the map outline). It is at least 3 cell hops from every capital, on the
full cell graph, and at least 3 cell hops from every cell of another range, so no province
borders two. After every cell the remaining provinces stay connected, keep 2 neighbors each,
have no cut vertex, and the provinces around each range stay within 6 passable steps of each
other. Each guard is also a `validateMap` check with a hand-broken test.

**R12. Generation order and the balance search** (J2 must-fix 2, J1 ruling 4).
- Order: range sizes are drawn, then geometry on every cell, then capitals on the full cell
  graph (today's call), then noise, then wilds. Terrain is ranked over the province cells with
  today's `assignTerrain` unchanged (no `counts` argument). Wellsprings, springs, names,
  populations and capital distances follow on the province graph.
- Measured end to end through the repo's `validateMap` and the balance search, on 660 maps: 0
  maps failed; each capital's 2-hop ring kept its members on all 660; there were 0 cut vertices;
  the largest detour was 6; Wellspring unfairness was unchanged (max 0, or 1 with 4 nations, as
  today).
- With 6 candidates, 3- and 4-nation balance drops (Medium 4 nations within 1.5: 54% today, 38%
  with wilds). With 10 candidates it is restored or better (56%, mean ratio 1.507 against 1.565).
  So `MAPGEN.balanceCandidates` goes from 6 to 10, in commit B.
- A range that cannot reach its size releases its cells and tries the next seed (at most 12).
  This cut failed attempts by two thirds against the first prototype run
  (`regions-final-v1.out`).

**R13. One presentation hash** (J1 must-fix 9). Every seed for stamps, slots, houses, props,
portraits, decks and names comes from the battle track's `src/present/rand.ts` (`hash32`,
`streamFor`). There is no separate FNV-1a or Mulberry32 module.

**R14. Bit identity** (J2 must-fix 3). `MapGenParams.wilds` is optional and defaults to false, so
commit A changes no call site. `MapData.wilds` is always present (`[]` when off). The test removes
the `wilds` key and compares a SHA-256 of `JSON.stringify` with hashes recorded from today's
generator before the change, for seeds 1 to 5 on every size with 2 and 4 nations. The balance
search change lands in commit B, because it changes today's unbalanced maps.

**R15. Wild grounds** (J1 must-fix 1). Peaks: granite **#2A292C** (L\* 16.8). Meres: water
**#24222A** (L\* 13.7) with pale ripples #8FC3D3.
- Granite is darker than the judges' #302F32 because #302F32 fails against out-of-sight Forest
  under the final fog cap (19.7 normal at 10% desaturation, under the rule's 20;
  `grounds-states-grid.out`). #2A292C is 21.7 / 18.6 / 16.5 / 14.1 from the nearest fill and
  passes every fog and wash state.
- Every banner passes directly except Umbra's #3D2B4F (an M2 nation). There the docs/09 band
  rule applies: the always-present rim #E9E4D8 differs from both by at least 64.
- No violet water (5.4 from Umbra's banner, J1) and no navy (Tide).

**R16. Map-mode colors** (J2 must-fix 7). A mode tints over the terrain fill desaturated 80%,
**lifted to L\* 50 or lighter** with linen: Forest +33%, Swamp +19%, Hills +12%. The data ramp
becomes #4C5E96, #8170AC, #C4808E, #E6AC6E, #F8E6A6 (L\* 41 to 91). Then every M1 mode color
passes 20 / 12 directly against both grounds: 0 cases need the rim. Only M2 Umbra tints still
rely on the rim (13 to 16 cases), which the band rule allows. The mockup's old first ramp stop
#181E3C (L\* 12) is gone.

**R17. Washes** (J2 must-fix 6). Land-look caps are computed by the palette test for every pair
type: Cinder ash ≤ 10%, Thornwood moss ≤ 6% (worst 21.0 normal, 12.5 CVD). 12% and 8% fail
(19.8, 11.8).

**R18. Fog** (J2 must-fix 12, J1 graft). Both remedies apply:
- every terrain has a line-art silhouette at every band, Far included;
- the fills move only as far as the palette allows when every state and land look is combined:
  unexplored takes a 4% linen haze and no land look; out of sight takes 10% desaturation, with
  the wash hidden and motifs kept. Measured jointly: 20.5 normal, 12.2 CVD.
- The staged "parchment haze" at the mockup's 45% fails badly (12.7 normal and 3.8 tritan at
  35%).

**R19. No light on the cloth** (J1 must-fix 5, J2 must-fix 5). No multiply, grade, vignette or
season light ever touches the map sheet. Warmth lives on the oak and in the room.

**R20. Brass** (J1 must-fix 2, J2 must-fix 8).
- Aged brass **#B8914A** for all broad brass. It is 10.5 or more from Radiance's secondary under
  every vision, but 5.6 from Ember's primary under protanopia, so brass never touches a mana
  symbol: at least 2 px of chrome separate them.
- #DBBD76 is never used. #D4B26A appears only as a 1 px highlight on brackets and tacks.
- Rivets, tacks and studs are square.
- A portrait's pip ring sits on a 2 px `--chrome-0` ring outside any metal frame.

**R21. Frame metals.** Rank shows by material and ornament: oak (scouts), bronze #8C6A43 (≥ 8.4
from every mana color), aged brass (rank 2), the god's brass with a 1 px gilt highlight and a
crown notch, pewter #91A092 (independents), elemental (summons). The immersion's gilded #F2D27A
and bronze #B58735 are not used (#B58735 is 3.0 from Ember's primary under protanopia, J2).
Frame shape follows allegiance, as the army token does (J2 graft).

**R22. Reload-stable slow looks** (J1 must-fix 3, J2 must-fix 13). The per-province slow look keys
and the month index are saved in the save file's UI block at each month boundary, never in
`GameState`. Test: save on day 17 after population has moved, reload, and the keys are equal.

**R23. Data modes** (J1 must-fix 4). In every mode but Ownership the decoration layer fades out:
ground textures, stamps, settlements, motifs and scars. The always-on layer stays: wilds,
borders, bands, ritual marks, siege camps and wall states, pillage smoke, Wellspring claim
stones, and the mode's second channel. Undominated provinces in Dominion mode show their lifted
desaturated terrain, never a flat grey.

**R24. Labels** (J1 must-fix 6, J2 must-fix 11). One label per range, unique against every
province name. Standing stamps keep out of the real label, badge and seat boxes from
`layoutMapLabels` plus 4 px; a disc around the anchor is not enough. Tokens anchor above the
label. The label test also covers stamps, settlements, wild labels and standee boxes.

**R25. One portrait anchor grid** (J1 must-fix 8). On 256 units: crown at y 23 (9%), eye line at
y 100 (39%), chin at y 169 (66%), collar at y 200 (78%), face axis at x 120. The same grid
holds for SVG busts, the pretender's B.8 portrait pose (its focus line at y 100), the raster
style lock and the intake crop. docs/09 records it.

**R26. Reserved patterns** (J1 must-fix 10). No presentation art uses a uniform straight hatch or
a cross-hatch. Peak shadow faces are flat tones. A content test checks every texture's line
angles and coverage. Three asks go to the pretender track (C.4):
- Burn the Fields draws irregular char patches and smoke lines, not a "charred-field hatch";
- Ash Rain's 30-day persistent tint becomes an ash-flake stipple;
- Fertile Season's persistent "green sheen" becomes sprout motifs.
Any persistent tint the pretender track keeps must pass the same wash test as a land look.

**R27. The approved UI is protected** (J1 must-fix 11, J2 drop).
- Panel bodies, cards, tooltips, the alerts ribbon and the outliner keep their layout and tokens.
- Parchment goes only on the battle report card and Codex article pages, M1-should, after an
  owner A/B in the mockup.
- The warm `--chrome-*` retune was measured and is rejected. On warm `--chrome-2` the Urgent
  alert falls to 2.66:1 and the Tide symbol to 2.66:1, under WCAG's 3:1 for non-text; the staged
  values give 3.19. The mockup shows both side by side.
- One contrast fix is adopted: action buttons take a 1 px `--brass` keyline (4.62:1 on
  `--chrome-2`). The staged keyline (text at 25%) measures 2.10:1, under 3:1 (J2).

**R28. The tavern at the default zoom, in one projection** (J1 must-fix 12). A 32 px oak band at
the start zoom, props peeking at its corners, a top-down tavern floor around the table, and the
instrument's rustic details: forged iron corner straps with square nail heads, knife marks, a
tankard ring, a bread board, quill and inkpot, brass dividers. No perspective backdrop.

**R29. Owner raster art is never on the critical path, and it starts now** (J1 must-fix 13). The
three anchor prompts (oak tile, summer floor, portrait style anchor) go to the owner now (task
#29). `scripts/art-intake.ts` lands in Phase 9. Raster integration is the last item on the cut
list, and every raster has a procedural fallback that ships first.

**R30. Scope** (J1 must-fix 14, J2 must-fix 15).
- Phase 8 ships the Simple table, the camera, wild art, tokens and portrait v0 on flat fills. It
  is playable that way.
- Table and detail work is at most a quarter of the Phase 8 diff; the rest moves to Phase 11.
- Standees wait for the battle rigs (Phase 10).
- Generation time has a budget the implementation can meet: measured means on Medium are 26 ms
  with 2 nations and 420 ms with 4 (p95 63 and 689) with 10 candidates. The wild placement itself
  costs 3 and 42 ms; the rest is the longer balance search.

**R31. The bake** (J2 must-fix 9 and 10). Three layers: fill (live, tinted by modes), decoration
(baked per band), always-on (live). A mode switch changes alpha and tint only, never re-bakes.
Mid is baked whole in tiles of at most 2048²; Near is baked lazily in 512² tiles with an LRU of
32.

**R32. The settlement tiers use the Population mode's steps** (`UI.popSteps`), one source for both
(instrument), with the immersion's golden-angle spiral: growth appends a house, decline removes
the newest.

**R33. Fit has its own key.** `Home` is the capital in the staged docs/07, so fitting the map is
`Z` and a Fit button at the top of the mode column (every hotkey has a button).

**R34. The passable Mountains' footpath** is #2B2620 at 75% (3.65:1 on Mountains). The
instrument's #5E5246 at 60% measured 1.84:1, too faint to be a second channel.

**R35. Lean back** reaches 0.75 × the scale that fits the whole table, so the tavern floor shows
as a ring around the table.

**R36. No new sim state.** `heldSince`, roads and the capture scorch wait (J2). "How long a
province has been under a dominion" is drawn from `dominion.strength`, which rises month by
month. If playtests ask for "old" land, M2 adds `ProvinceState.dominionSince`.

### Must-fix ledger

| Item | Ruling |
|---|---|
| J1-1 grounds and banners | R15 (granite #2A292C, water #24222A; palette test against all banners) |
| J1-2 brass | R20, R21 |
| J1-3 reload-stable looks | R22 |
| J1-4 data modes | R23 |
| J1-5 neutral sheet | R19 |
| J1-6 labels | R24 |
| J1-7 units and items | gear chip and head item adopted (section 5.6); token ★ moved to M2 by the units final (R10) |
| J1-8 anchor grid | R25 |
| J1-9 rand.ts | R13 |
| J1-10 reserved patterns, pretender asks | R26 |
| J1-11 approved UI | R27 |
| J1-12 tavern at default zoom | R28 |
| J1-13 raster art not first | R29 |
| J1-14 scope | R30; ridges are moot (R2) |
| J2-1 regions only, guards | R2, R11 |
| J2-2 re-measure end to end | R12, section 1.6 |
| J2-3 bit identity | R14 |
| J2-4 no migration | rejected in favor of the repository's own precedent: one trivial migration entry (R3) |
| J2-5 no light on the sheet | R19 |
| J2-6 wash caps, Ash Rain | R17, R26 |
| J2-7 palette test with mode colors | R16 |
| J2-8 brass and frames | R20, R21 |
| J2-9 three bake layers | R31 |
| J2-10 lazy Near tiles | R31 |
| J2-11 box exclusion | R24 |
| J2-12 fog | R18 |
| J2-13 reload-stable cache | R22 |
| J2-14 names out of `src/sim` | R4 |
| J2-15 phase placement | R30, section 7 |

### Graft ledger

| From | Graft | Where |
|---|---|---|
| Instrument | two-commit landing | 1.9 |
| Instrument | footpath on passable Mountains | 1.10 (color per R34) |
| Instrument | no-repeat deck for independent captains | 5.4 |
| Instrument | thriving and declining from `pop / startPop`; the unlit brazier | 4.2 |
| Instrument | ground textures within ±8% L\* (±4% under boxes); pattern test | 3.2 |
| Instrument | replay modal in oak and brass | 2.8, 5.9 |
| Instrument | rustic table details | 2.2 |
| Instrument | intake checks, CVD preview, band chip | 5.10, mockup steps 15 and 2 |
| Instrument | decoration fades in modes; shape-only motif families by color | 3.9, 4.3 |
| Instrument | chrome as oak frames over flat bodies; #B8914A action keyline | 2.8 |
| Immersion | wild hover card with border links; "around the X"; the no-path reason | 1.10 |
| Immersion | 32 px oak band; top-down tavern floor; seasons (M1-should) | 2.1 to 2.6 |
| Immersion | month candle and hourglass (no purse) | 2.5, R8 |
| Immersion | land looks with computed wash caps, motifs, landmark; pole motifs at Mid | 4.3 |
| Immersion | brush wipe (M1-should) and the time-lapse slider | 4.7, mockup step 7 |
| Immersion | standees and the cloaked figure (Near, M1-should) | 3.6, R7 |
| Immersion | fog as "not yet painted" with silhouettes | 3.10 |
| Immersion | golden-angle settlements | 4.2 |
| Immersion | personal names (as presentation state, R4) | 5.8 |
| Immersion | rank frames by material; busts in replay docks | 5.5, 5.9 |
| Immersion | peak art (massif fills the cell, tallest first, may rise 10% above its top edge) | 1.10 |
| Immersion | interior, 3-hop guards, detour cap, end-to-end measurement | R11, R12 |
| Immersion | "decoration thins by band, information never does" | 3.7 |

### Drop ledger

Dropped as the judges listed: the perspective backdrop; the "dark instrument case" framing; the
separate hash module; one slate for lakes and chasms; pole motifs at Near only; deferring names;
granite #5E5953 and mere #182A36; #DBBD76 as broad brass and round brass; the 8% warm multiply;
ghosting stamps to 40%; free-standing ridges (and, by R2, all ridges in M1); 45° peak hatching; a
head item replacing the headgear; parchment cards inside approved panels; owner rasters first in
the cut order; terrain-pool captain portraits; the warm `--chrome-*` retune; the whole-map Near
bake; stamp ghosting; names hashed inside `src/sim`; `heldSince`, roads and capture scorch;
seasonal stamps; escort figures and rig-cut miniatures at Mid; the coin purse; the immersion's
bronze #B58735 and gilded #F2D27A. The proposals' v1-to-v2 migrations are replaced by one entry
in the repository's migration map (R3).

---
