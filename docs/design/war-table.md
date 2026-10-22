# The war table: final design

Impassable terrain, the oak war table in a tavern, map detail, growth by alignment, and leader
portraits. This is the build spec for the owner's direction of 2026-10-21. It replaces
`proposal-immersion.md` and `proposal-instrument.md`.

**The owner's direction (2026-10-21, binding; typos corrected only, as `owner-direction.md` records):**

> this is great - the UI is fluid - the hover is intuitive and responsive, the alerts row is
> good, each thing to try is good, i would like more detail on the map, while this is mostly an
> art pass, i want to make sure the maps have some impassible terrain that is noticeable, the
> detail view on the lands are great, some art assets to show the growth over time would be
> ideal, based on alignment too!
>
> leaders certainly need portraits
>
> the overall map should be on an rustic wartable in a cozy but natural tavern, nice oak wood

**What stays as it is.** The owner approved the layered UI: hover, nested tooltips, the alerts
row, and the province detail panel. The staged `docs/07-ui.md`, its five layers, its density
budget, "nothing is zoom-gated", and every approved chrome token value stay. This design changes
how the map looks, never what it says. Its one rule change is impassable terrain.

**Repository state.** Phase 7 merged while this final was written (`cfe2d11`, `1ca32ec`); its AI
reads adjacency only through `MapProvince.neighbors` (`army.ts`, `assess.ts`, `defense.ts`,
`magic.ts`) and no AI file reads geometry, as the judges found in the `fm-p7f` worktree. The
staged docs (`/home/user/fm-docs/docs/`, commit `ce9bfb2`) are the current `docs/07-ui.md` and
`docs/09-art-direction.md`. The blocks for docs/01, 06, 09-balance and 10 are written against
the repository at `7a524b8` (Phase 10 S1, which also brought `STATE_VERSION` 2, the migration
map `src/sim/migrate.ts`, and the battle design as `docs/12-battle-presentation.md`).

**New evidence for this final** (scripts and outputs in `wartable-design/final-calc/`; every
script reads the repo read-only and uses its own modules):

| File | What it measures |
|---|---|
| `regions-final.ts` → `regions-final.out`, `regions-final-b.out` | The final wild model and generation order as a copy of `generate.ts`'s `attempt()`, run through the repo's own `validateMap` and the balance search with 6 and with 10 candidates, against today's `generateMap` on the same seeds: Medium with 2 nations (200 seeds), 3 and 4 nations (100 each), Small and Large with 2 (100 each), Large with 4 (60) |
| `colors-final.ts` → `colors-final.out` | CIEDE2000 under the four visions (the repo's `tests/content/colorMath.ts`) and WCAG contrast: wild grounds against fills, all banners, every map-mode color; rims and marks; wash caps; fog caps; brass against mana colors; the staged chrome against the warm retune; oak and parchment |
| `joint-caps2.ts`, `grounds-states.ts`, `modes-lift.ts`, `ramp-lift.ts`, `ramp2.ts`, `colors-extra.ts` (each with `.out`) | Land-look washes and fog states combined; the granite tone against every fog state; the lifted mode base and data ramp; footpath, fog line art, frame metals, table tones |

The judges' measurements (`judge1-calc/`, `judge2-calc/`) and the proposals' (`calc/`, `tools/`)
are cited where used.

---

## The design in twenty-two lines

1. **Base.** The immersion proposal's experience (a tavern felt at the default zoom, massifs and
   meres, land that changes with alignment at the default zoom, leaders with names), rebuilt on
   the instrument proposal's engineering (a neutral sheet, palette-tested colors, decoration
   below information, a two-commit landing, a time box).
2. **Impassable terrain is wilds:** named mountain massifs (peaks) and dark lakes (meres) that are
   map cells but not provinces. Medium gets 3 ranges, about 5.4 extra cells. Ridges and chasms
   wait for M2.
3. **No sim or AI code changes.** A wild is never in `MapProvince.neighbors`, and every reader of
   adjacency (movement, retreat, sight, dominion spread, ritual reach, fort materials, the Phase
   7 AI) already walks `neighbors`.
4. **Every mapgen invariant holds, measured** on 660 maps: exact province count and terrain
   shares, capitals 6 or more apart, each capital's 2-hop ring unchanged (0 of 660 changed), no
   cut province, detours of at most 6 steps. The balance search grows from 6 to 10 maps, which
   restores the 1.5× ratio on 3- and 4-nation maps (Medium 4 nations: 54% today, 38% with wilds
   at 6, 56% at 10).
5. **It lands in two commits:** A behind `MapGenParams.wilds` with a bit-identity test; B, the
   owner-decision commit, which turns it on. Phase 7 has merged, so B can follow A directly.
6. **It is noticeable at every zoom and in every mode:** the darkest grounds on the map (granite
   #2A292C under snow-capped massifs, still water #24222A under pale ripples), a light rim, an
   ink contour and a name. Never tinted, faded, hatched or fogged. Passable Mountains stay
   snowless and carry a dashed footpath.
7. **The map is a painted linen cloth** on an oiled, quarter-sawn white oak war table in a tavern,
   seen straight down in one projection. The start zoom shows a 32 px oak band with iron corner
   straps and props peeking in; leaning back shows the whole table and the tavern floor around
   it (hearth, window light, rug, bench, a sleeping hound).
8. **No light ever falls on the cloth.** Warmth lives on the oak and the room, so every palette
   test checks exactly what is drawn.
9. **The chrome keeps every approved token** and gains the table's hardware: oak frames, aged
   brass #B8914A keylines and square tacks, leather spines on book modals. Parchment report cards
   and Codex pages are an owner A/B (M1-should). The warm token retune was measured and rejected.
10. **Map detail in three layers:** a live fill layer (tinted by modes), a baked decoration layer
    (ground textures, stamps, settlements, motifs, scars; faded out in data modes), and an
    always-on layer (wilds, borders, bands, ritual and siege marks).
11. **Settlements grow from state the sim already keeps:** tiers from population (the Population
    mode's steps), thriving and declining against the starting population, walls by PD,
    temples, labs, forts, scaffolds, Wellspring claims, kits by owner.
12. **Alignment repaints the land:** the dominating nation's land look (a palette-capped wash plus
    motifs and a landmark at strength 7) and scale-pole motifs at the default zoom. A future
    nation needs one record, or inherits its color's family.
13. **Calm and reload-stable:** slow looks change at most monthly and their keys are saved in the
    save file's UI block, so a mid-month reload shows the same map. Events show the day they
    happen.
14. **Fog is "not yet painted":** line-art terrain silhouettes for all seven terrains, a dotted
    border, no settlement. Fills move at most 4% (haze) or 10% (desaturation), the measured
    caps that keep every terrain pair distinct.
15. **Every commander gets a seeded portrait:** a layered SVG bust on one anchor grid, faces by
    rendezvous over append-only parts, a no-repeat deck for independent captains, state as
    overlays and frame marks only, frames by allegiance shape and rank material.
16. **Personal names** ("Varo, Ash Chieftain") are presentation state in the UI block, drawn from
    a no-repeat deck per nation (M1-should). The sim is untouched.
17. **Owner raster art is a premium layer:** the intake script lands in Phase 9, the first
    prompts go to the owner now, and every raster has a procedural fallback.
18. **One seeded-hash module:** the battle track's `src/present/rand.ts`.
19. **No new sim state.** Presentation state lives in the UI block (look keys, names), like the
    battle summaries and the god's look.
20. **Phase 8 stays playable with flat fills:** the Simple table, wilds, tokens and portrait v0.
    Terrain detail, settlements and land looks arrive in Phase 11. A time box and a fixed cut
    order guard the schedule.
21. **Exact docs text** for docs/01, 06, 07 (staged), 09 (staged), 09-balance and 10, and two
    portrait lines in docs/12.
22. **A 19-step mockup brief,** table and tavern first, ending with a time-lapse slider that shows
    a province grow and change faith.

---

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

## 1. Impassable terrain: wilds

### 1.1 The decision

| Model | What it is | Verdict |
|---|---|---|
| **Wild region** (peaks, meres) | Map cells that are not provinces. Nobody owns, enters, crosses or targets them | **M1** |
| Ridge | An impassable border between two provinces | M2, with passes that open or close and fliers that cross (R2) |
| Chasm | A third region kind (a rift in dry lowland) | M2, with a Rot nation; stamps only, no rule change |
| Very costly terrain | Mountains already take 9 days at speed 2 | No: not impassable |

The owner asked for impassable terrain that is *noticeable*. An area can be noticed at every zoom;
a line with no width cannot.

### 1.2 The rule (player-facing, docs/01 §2)

> Some of the map is wild: named mountain massifs (peaks) and dark lakes (meres). A wild is not
> a province. No one owns, enters, crosses or targets it. Two provinces are neighbors only where
> their own borders meet, so a wild between them blocks movement, retreat, sight, dominion
> spread and ritual reach alike, and everything counted in provinces is counted around it. Every
> province can still reach every other, and no single province is the only way through.

### 1.3 Data

```ts
// src/content/mapgen.ts (data)
export const WILD_KINDS = ['peaks', 'mere'] as const;        // 'chasm' arrives in M2
export type WildKind = (typeof WILD_KINDS)[number];
export const WILDS = {
  /** Ranges per map: round(provinces / provincesPerRange). Medium 3, Small 2, Large 4. */
  provincesPerRange: 20,
  /** Range r has kind kindCycle[r % 3]: Medium gets peaks, a mere, peaks. */
  kindCycle: ['peaks', 'mere', 'peaks'] as const,
  /** Weights for a range of 1, 2 or 3 cells. */
  cellWeights: { peaks: [25, 50, 25], mere: [60, 40] },
  /** Cell hops from every capital, on the full cell graph. */
  minCapitalCells: 3,
  /** Cell hops between cells of two different ranges, so no province borders two. */
  separation: 3,
  /** The provinces bordering one range stay this many passable steps apart. */
  maxDetour: 6,
  /** Seeds tried per range before the attempt fails. */
  seedTries: 12,
} as const;
// MAPGEN.balanceCandidates: 6 -> 10 (commit B)

// src/content/names.ts (data): wild name syllables. The name always takes "the".
// peaks: Ash Grey Iron Cold Crag Wolf Storm Raven Frost Black + spine teeth crown horns fells spires fangs
// mere:  Still Black Dead Hollow Grey Mirror Silent + " Mere" "water" " Tarn" "mere"
// e.g. "the Ashspine", "the Greyteeth", "the Still Mere", "the Blackwater"
```

```ts
// src/mapgen/types.ts
export type WildId = Id<'wild'>;  // w0, w1, ...: ID_PREFIXES gains wild: 'w'; a scratch counter local to mapgen
export interface MapWild {
  id: WildId;
  kind: WildKind;
  name: string;
  /** The range's cells, each convex and positively oriented like MapProvince.polygon. */
  cells: Point[][];
  /** Label anchor: the centroid of the largest cell. */
  center: Point;
  /** Provinces that share a border segment with any of its cells, sorted by id number. */
  borders: ProvinceId[];
}
export interface MapGenParams { seed: number; size: MapSizeId; capitals: readonly CapitalSpec[]; wilds?: boolean }
export interface MapData { /* ...unchanged... */ wilds: MapWild[] }   // [] when wilds is off
```

- `MapProvince` does not change. `neighbors` keeps its meaning: the provinces one can step to.
- Province ids stay `p0` to `p{n-1}` in site order. Wild ids come from their own scratch counter
  and never touch `GameState.nextId`, so commander, squad and message ids are unchanged for a
  given map.
- A pure helper, `wildOutline(wild): Point[][]` in `src/mapgen/geometry.ts`, returns the boundary
  loops (cell edges not shared by two cells of the same wild). The renderer and the hit test use
  it.
- A province's tooltip finds the wilds it borders through `MapWild.borders` (an index built once
  in `src/ui/derive/`).
- `GameSetup` passes `wilds` through. New Game sets it true in commit B (no UI toggle in M1).
  `npm run sim:aivai` gains `--wilds on|off` (default on from commit B).

### 1.4 Generation (`src/mapgen/generate.ts`, new `src/mapgen/wilds.ts`)

When `wilds` is false, nothing new is drawn and every step is today's, so the maps are
bit-identical. When it is true, each attempt runs:

1. **Plan.** `R = round(count / 20)` ranges. Range `r` has kind `kindCycle[r % 3]` and
   `1 + weightedIndex(rng, cellWeights[kind])` cells. `total = count + Σ cells`. The bounds and
   the outline come from `mapDimensions(total)`, per attempt, so every province keeps its mean
   area of 6400 units².
2. **Geometry on every cell**, as today: `poissonDisc`, `adjustCount`, `lloydRelax`,
   `voronoiCells`, `adjacency`, and the checks for empty cells, minimum neighbors and
   connectivity.
3. **Capitals** by today's `placeCapitals` on the full cell graph.
4. **Noise**: elevation and moisture at every site, as today.
5. **Wilds** (`placeWilds`). Peak ranges are placed first (score: elevation), then meres (score:
   moisture minus elevation), each in plan order.
   - **Seed** at the highest-scoring eligible cell (the lower index on ties).
   - **Grow** into the highest-scoring eligible neighbor of the range until it has its size.
   - If it cannot grow, release its cells and try the next eligible seed, at most `seedTries`
     (12). If no seed works, the attempt fails with `'no room for wilds'` and is retried like any
     failed attempt.
   - **A cell is eligible** when all of these hold:
     - it is not a capital and is at least 3 cell hops from every capital;
     - it is interior: no vertex lies on the map outline;
     - it is at least 3 cell hops from every cell of another range;
     - with it removed, every remaining neighbor keeps at least 2 neighbors, the remaining
       cells are connected, and none is a cut vertex (Tarjan's algorithm, linear time);
     - with it removed, the provinces bordering each range stay within 6 passable steps of each
       other (a BFS from each bordering province only).
6. **Provinces** are the remaining cells, re-indexed in site order. Their adjacency is the cell
   adjacency without wild cells.
7. **Everything else as today, on the province graph:**
   - `assignTerrain` over the province cells, unchanged, so the shares are exact, capitals
     included;
   - `placeWellsprings` with its fairness and spacing rules, then `wellspringSteps`,
     `placeSprings`, `nameProvinces`, then **`nameWilds`** (unique against every province name
     and each other), starting populations, `capitalDistance` and independent strength.
8. **Validation, then balance.** `validateMap` runs with its new checks (1.5). The balance search
   keeps up to 10 valid maps (commit B).

All randomness comes from the one mapgen `RngState`. Peaks border Hills and Mountains in 34 to
44% of their borders against 22% by share, and meres border Swamp and Forest in about half (37 to
58%), because the noise is coherent: the land around a massif rises toward it.

### 1.5 Invariants, and why each still holds

| Invariant (docs/01 Implementation decisions) | Why it holds | Check |
|---|---|---|
| Exact province count | Wild cells are extra sites; `count` cells remain | existing count check |
| Exact terrain shares | Terrain is ranked over the province cells only | existing `terrain.test.ts` |
| Capitals at least 6 apart | Placed on the full graph; removing cells only lengthens paths | existing check on `neighbors`; measured min 6 to 10 by size |
| 1.5× capital-neighborhood ratio | Wilds are at least 3 cell hops from every capital, so each capital's 2-hop ring has the same members (0 of 660 maps changed). The terrain inside the ring still shifts, so the search keeps up to 10 valid maps | `capitalBalance`; measured (1.6) |
| Wellsprings at least 3 from capitals and 2 apart; fairness | Placed and judged on the province graph | existing checks; measured unfairness unchanged |
| Adjacency only through shared segments | Unchanged between provinces: a wild breaks no segment between two provinces, it removes cells | existing adjacency checks |
| Connected; at least 2 neighbors | Enforced at every cell | existing checks |
| (new) No cut province | Enforced at every cell; today's maps already have none (360 of 360 seeds across both proposals) | new check |
| (new) Detours | The provinces around each range within 6 steps | new check |
| (new) Wilds interior, 3 from capitals, ranges 3 apart | Enforced at placement | new checks |

**`validateMap` additions** (when `params.wilds` is true): the range count equals
`round(count / 20)`; each wild has 1 to 3 non-degenerate cells that share segments; every cell is
interior; no capital is within 2 cell hops of a wild (equivalently, no capital and no capital's
neighbor is in any `borders`); no province appears in two wilds' `borders`; `borders` matches the
geometry; the province graph has no cut vertex; each wild's bordering provinces are within 6
steps of each other; wild names are unique and differ from every province name.

### 1.6 Measured results

`final-calc/regions-final.out` and `regions-final-b.out`. "Today" is `generateMap` on the same
seeds; "wilds" uses the final model with the balance search at 6 and at 10 candidates.

| Map (seeds) | Wild cells (% of provinces) | Provinces bordering a wild | Within 1.5: today / wilds@6 / wilds@10 (mean ratio today → @10) | Attempts mean (p95) @10 | Generation ms mean (p95): today → @10 |
|---|---|---|---|---|---|
| Small, 2 nations (100) | 3.19 (8.0%) | 35% | 100 / 100 / 100% (1.232 → 1.221) | 2.19 (5) | 9 (20) → 16 (39) |
| **Medium, 2 (200)** | **5.44 (9.1%)** | **37%** | **100 / 100 / 100% (1.201 → 1.216)** | **1.86 (5)** | **21 (52) → 26 (63)** |
| Large, 2 (100) | 7.45 (9.3%) | 38% | 98 / 100 / 100% (1.245 → 1.233) | 1.82 (5) | 38 (95) → 44 (110) |
| Medium, 3 (100) | 7.52 (8.8%) | 36% | 79 / 74 / 93% (1.390 → 1.347) | 4.47 (11) | 77 (152) → 137 (331) |
| Medium, 4 (100) | 10.74 (9.8%) | 40% | 54 / 38 / 56% (1.565 → 1.507) | 8.38 (13) | 173 (273) → 420 (689) |
| Large, 4 (60) | 12.70 (9.8%) | 40% | 42 / 37 / 55% (1.622 → 1.525) | 7.93 (12) | 307 (414) → 601 (894) |

| Map | Mean passable neighbors | Closest capitals: hops (min), days at speed 2 | Mean `capitalDistance` | Max detour | Cut vertices | Rings changed | Wellspring unfairness max |
|---|---|---|---|---|---|---|---|
| Small 2 | 4.79 → 4.35 | 7.66 → 8.08 (7); 36.6 → 39.5 | 2.56 → 2.68 | 5 | 0 | 0 | 0 → 0 |
| Medium 2 | 5.00 → 4.52 | 9.40 → 10.10 (8); 45.5 → 49.5 | 3.23 → 3.41 | 6 | 0 | 0 | 0 → 0 |
| Large 2 | 5.14 → 4.64 | 11.02 → 11.79 (10); 53.7 → 58.2 | 3.81 → 4.02 | 6 | 0 | 0 | 0 → 0 |
| Medium 3 | 5.16 → 4.69 | 6.94 → 7.33 (6); 33.0 → 36.0 | 3.06 → 3.14 | 6 | 0 | 0 | 0 → 0 |
| Medium 4 | 5.26 → 4.75 | 7.04 → 7.39 (6); 33.0 → 35.6 | 2.74 → 2.83 | 6 | 0 | 0 | 1 → 1 |
| Large 4 | 5.32 → 4.81 | 7.77 → 8.15 (7); 36.1 → 39.0 | 3.02 → 3.13 | 6 | 0 | 0 | 1 → 1 |

**Reading.** About 37% of provinces touch a wild, so most fronts meet one. Capitals end up about
0.7 steps and 4 days farther apart on Medium. No map failed. The wild placement itself costs 3 ms
on Medium with 2 nations and 42 ms with 4; the rest of the added time is the longer balance
search, which is what restores 3- and 4-nation balance.

### 1.7 What it changes in each system

| System | Reads | Code change | Behavior to re-measure |
|---|---|---|---|
| Movement and pathing (`movement.ts` `findPath`, `pathsFrom`, `findPathFor`) | `neighbors` | none | paths bend around wilds; ETAs grow where they do |
| Move validation (`commands/army.ts:58`) | `neighbors` | none: a step between non-neighbors is already refused, and the UI only proposes `findPathFor` paths | — |
| Hostility (`hostileProvinces`) | provinces and presence | none: a wild is never a province | — |
| Retreat (`conflict.ts:98`) | `neighbors` | none | fewer friendly neighbors, so somewhat more commanders die with nowhere to go |
| Sight and fog (`visibility.ts`) | `neighbors` | none | sight 1 and 2 count steps around a wild; wilds are terrain, always visible with their names |
| Dominion spread (`dominion.ts:102`) | `neighbors` | none | checks never land on a wild; spread concentrates on the remaining neighbors |
| Ritual reach (`rituals.ts` `withinHops`) | `neighbors` | none | reach is counted around wilds; the targeting outline bends |
| Fort materials (`selectors.ts:200`) | `neighbors` | none | only real neighbors feed the fort |
| Independents | `capitalDistance` | none | provinces behind a wild are farther in steps, so their guards are stronger (mean `capitalDistance` +0.18 on Medium) |
| AI (`src/ai`, merged in Phase 7: assess, army, defense, magic, war, plan; `pathsFrom`, `hopsFrom`, `adjacencyRoute`) | `neighbors` | none; no AI file reads geometry | behavior tests re-run; the matchup row re-measured once |
| Saves | `GameState.map` | one entry in `src/sim/migrate.ts`: `state.map.wilds ??= []`, with the next `STATE_VERSION` (R3) | — |
| UI | `MapData.wilds` | hover, cursor, labels, tooltip lines (1.10) | — |

### 1.8 Numbers (docs/09-balance rows in "Docs text")

`WILDS` above, plus `MAPGEN.balanceCandidates` 10. The owner can turn wilds down with content
alone: `provincesPerRange` sets how many, `cellWeights` how large.

### 1.9 Tests and landing

**Tests.**
- `tests/mapgen/wilds.test.ts`, seeds 1 to 30 on every size with 2, 3 and 4 nations, wilds on:
  - `validateMap` is empty, the province count and terrain shares are exact;
  - every wild cell is interior, at least 3 cell hops from every capital and from other ranges;
  - no cut vertex; every range's detour is at most 6;
  - each capital's 2-hop ring has the same members on the cell and province graphs;
  - the same params give the same `MapData`.
- **Bit identity:** with `wilds` false, `sha256(JSON.stringify(map without wilds))` equals the
  hash recorded from today's generator, for seeds 1 to 5 × Small, Medium, Large × 2 and 4
  nations. The expected hashes are recorded by running today's generator before the first line
  of the change.
- **Generation time** (`tests/mapgen/generate.perf.test.ts`, median over seeds 1 to 10, 10
  candidates): under 150 ms on Medium with 2 nations and under 1,000 ms with 4. Measured means
  26 and 420 ms.
- `tests/mapgen/validate.test.ts`: every new check fires on a hand-broken map (a wild touching a
  capital's neighbor, a wild cell on the outline, two ranges sharing a bordering province, a cut
  vertex, a detour of 7, a wild named like a province).
- `tests/sim/movement.test.ts`: on a seed with a wild, two provinces on opposite sides are not
  neighbors, and `findPath` goes around.
- `tests/sim/visibility.test.ts`, `rituals.test.ts`, `dominion.test.ts`: sight, `withinHops` and
  spread targets never include a wild and never reach across one in fewer steps than the
  province graph gives.
- `tests/sim/migrate.test.ts`: a state of the previous version gains `map.wilds = []` and plays
  on identically.
- `tests/content/palette.test.ts`: the wild grounds against every fill, every banner (directly
  or by the rim), every map-mode color, and every fog and wash state (1.10).
- `tests/ui/derive/mapLabels.test.ts`: wild labels take part in overlap culling, and wild
  polygons are hit-tested before provinces.
- `tests/ai/*`: `runMatch` completes 20 games on wild maps; the docs/09-balance matchup check
  (Thornwood about half) is re-measured and recorded, with the retreat-death count.

**Landing: two commits.**
- **Commit A, "Phase 1b: wilds behind a switch"**, any time: `wilds.ts`,
  the optional `MapGenParams.wilds` (false everywhere), `MapData.wilds` (always `[]`), the next
  `STATE_VERSION` with its `migrate.ts` entry, the validations, the tests. The bit-identity test
  proves no map moves; state hashes are compared run to run (`tests/ai/match.test.ts`,
  determinism), never pinned, so no fixture or AI baseline moves.
- **Commit B, "Phase 1b: impassable terrain (owner decision 2026-10-21)"**, once the owner
  approves. Phase 7 has merged (`1ca32ec`), so B can follow A directly and the AI baselines move
  once:
  - New Game and `sim:aivai` default to `wilds: true`;
  - `MAPGEN.balanceCandidates` 6 → 10;
  - seed-pinned fixtures re-pinned (mapgen snapshots, any test that names a seed's province ids);
    the determinism test compares two runs, so it needs no re-pin;
  - `npm run sim:aivai -- --games 20 --seed 1` re-run, the matchup row recorded;
  - docs/01, docs/09-balance and docs/10 text from "Docs text".
- **Phases that change:** Phase 1 (mapgen, content, validation, tests); Phases 2 to 7 (no code;
  fixtures and baselines only); Phase 8 (rendering, 1.10).
- **Owner decision.** The parent workflow asks once, with the mockup open:
  > "Impassable terrain: named mountain massifs and dark meres that are not provinces, about 9%
  > of the map (3 on a Medium map), never within 2 provinces of a capital, always with a way
  > around within 6 provinces. Impassable borders (ridges) wait for M2 with mountain passes.
  > Approve?" Default: approve.

### 1.10 The art: noticeable at every zoom, in every mode, for every viewer

**One signature on every kind.** A 3 px ink contour (#1C1A17) on the wild's outline, where it
replaces the 2 px province border, and a light rim (#E9E4D8) just inside it: cliff ticks on
peaks, a 2 px shore keyline on meres. The rim is never omitted, at any zoom or in any mode, so
every neighbor color passes docs/09's band rule (ground or rim). Either the ground or the rim
reaches at least 4.1:1 against every fill (worst: Hills, rim 4.14:1).

**Peaks.**
- **Ground:** granite **#2A292C** over the whole cell.
- **Massif:** stamps fill the cell edge to edge: 8 to 14 peaks per cell by area at Mid, of which
  2 or 3 are centerpieces at 1.7×, about 0.55 of the cell's inradius tall.
  - Each peak: a lit face #8A857E (3.95:1 on granite), a flat shadow face #46423F (no
    hatching), a snowcap #F2EEE6 down to 40% of its height (12.5:1 on granite), and a 1.3 px ink
    outline at Mid.
  - Drawn tallest first, then by bottom edge. Tops may rise up to 10% of their height above the
    cell's top edge, under the neighbor's border and band. The massif is the tallest thing on
    the map.
- **Rim:** cliff ticks perpendicular to the edge, #E9E4D8 at 85%, 4 to 7 px long and 5 px apart
  with ±1 px seeded jitter (3 px and 4 px apart at Far).
- **Snow means impassable.** Passable Mountains never carry snow (below).

**Meres.**
- **Ground:** still water **#24222A**, with a 5 px shore band inside the rim one step lighter
  (#2E3138).
- **Marks:** 8 to 14 two-hump ripple strokes in #8FC3D3 (8.16:1 on the water), staggered,
  leaving the middle third open; reed tufts (#8E9A6E with ink) and two or three bone-white snags
  (#CFC6B4) on the shore.
- **Rim:** a 2 px shore keyline #E9E4D8 at 70%.

**Names.** One label per range, on the largest cell's centroid. Alegreya Sans italic,
letter-spaced 0.08 em, #E9E4D8 with no halo (11.4:1 on granite, 12.4:1 on water), sized by area
(11 to 16 px at Mid). Stamps keep out of the label box plus 4 px. Culling priority: after
capitals and Wellsprings, before ordinary provinces.

**Passable Mountains can never be mistaken for peaks:**
- the fill #8DA4AD stays;
- 4 to 7 small, low peaks, spaced apart and never a closed chain: lit #B4C1C6, shade #6E7F86,
  ink outline, **no snow**;
- a **dashed footpath** between the midpoints of the province's two longest edges through its
  seat: #2B2620 at 75%, 1.5 px, dash 4 / 3 (3.65:1 on Mountains). It says "a way through".
- Its stamps keep at least the band width plus 6 px away from any wild.

**By zoom** (bands of the staged docs/07). Wilds are information, so every band draws them in
full: ground, contour, rim, kind stamps.

| Band | Peaks | Meres | Name |
|---|---|---|---|
| Far (under 70 px) | 3 to 5 peak stamps per cell, contour, ticks | ground, rim, 3 ripples | culled after capitals and Wellsprings |
| Mid | full massif | full | yes |
| Near | adds scree fans at the base | adds snags' reflections | yes |

**By mode.** Modes tint province fills only. Wilds are never tinted, faded, hatched, dimmed or
outlined by a mode, a contextual mode or the numbers layer. In a data mode they read as "no data,
no entry", which makes them easier to spot than in Ownership. Map-mode colors are built to pass
against both grounds (R16).

**By fog.** Never fogged: terrain is public (docs/01 §14).

**Colorblind safety.** Lightness (both grounds are the darkest on the map), the light rim, and the
stamp shapes. No hue is needed. The palette test enforces the grounds' distance from every color
they can touch (section 3.11).

**Hover and orders** (render and UI only; the sim is unchanged):
- **Hover** brightens the rim to 100% and opens an L1 tooltip: "**The Ashspine** · Peaks ·
  Impassable", the rule sentence from 1.2, "Borders:" with the bordering provinces as entity
  links, and the footer `Ctrl+click Codex`. A Codex concept page, "Impassable terrain", joins
  `src/content/concepts.ts`.
- A province's tooltip gains one line: "Borders the Ashspine (impassable)".
- **With commanders selected**, the cursor over a wild shows ✕ and the cursor label reads
  "Impassable: the Ashspine". Right-click issues nothing. A click on a wild clears the
  selection, as a click on bare table does.
- **Paths that bend:** when the straight segment from the army to the target crosses a wild, the
  ETA line adds "around the Ashspine" (`barrierOnLine(from, to)` in `src/ui/derive/`, the first
  wild the segment crosses).
- **No path:** the reason names the barrier and what closes the way around: "No path: the
  Ashspine blocks the way, and the way around crosses hostile Velmere."
- Move targeting hatches unreachable provinces as before; ritual targeting's hop outline bends
  around wilds. Neither touches a wild.

---

## 2. The war table and the tavern

### 2.1 What the player looks at

The camera looks straight down at an oiled oak war table in a village tavern. On the table lies a
painted linen campaign cloth, the map, pinned at its corners with square brass tacks. At the
start zoom the cloth fills the view inside a 32 px band of oak, with iron corner straps and the
edges of props showing in the band. Zooming out ("leaning back") shows the whole table, its
props, and the tavern floor around it. The projection is top-down and orthographic all the way
out: no tilt, no parallax, no depth of field, no perspective backdrop. Depth is painted, never
simulated, so province shapes, label boxes and hit areas stay exact.

**Layers, bottom to top, in world space:**

| # | Layer | Content | Static? |
|---|---|---|---|
| T0 | Room | the tavern floor seen from above (2.4) | baked once, and per season (M1-should) |
| T1 | Table shadow | a soft dark falloff under the table's rim | baked |
| T2 | Oak top and edge | the oak tile, plank seams, iron corner straps, knife marks, tankard ring, worn rim (2.2) | baked |
| T3 | Table light | hearth gradient, candle pool, rim vignette; masked off the cloth | baked |
| T4 | Props | in the table margin only (2.5) | baked, except the two mirror props |
| T5 | Cloth | contact shadow, linen, leather hem, square brass tacks, cartouche, compass rose (2.3) | baked |
| M | The map | fill, decoration and always-on layers, then labels, chips, paths, tokens, arrows, rings, markers (3.1) | as specified |
| T6 | Ambience | candle and hearth glow sprites, dust motes; over the room and the oak only | live |

### 2.2 The table: "rustic", "nice oak wood"

- **Wood.** Oiled, quarter-sawn white oak: tawny grey-gold, straight grain running left to right,
  silvery ray fleck, darker end grain on the short edges, a worn and slightly lighter top edge
  where elbows rest. No orange "golden oak" stain (Golden Oak #A96A28 is 19.5 from Ember's
  primary, `research-tabletop.md` 5).
- **Tones** (WCAG against the cloth #E8DCC2, `final-calc/colors-extra.out`):

  | Tone | Hex | Use | Against the cloth |
  |---|---|---|---|
  | Lit oak | #B08A5E | grain highlights, the worn rim | 2.33:1 |
  | Oak body | #8F7459 | the boards | 3.21:1 |
  | Grain | #715636 | grain lines, plank seams | 5.00:1 |
  | Oak shade | #5E4630 | end grain, knife marks | 6.45:1 |
  | Oak edge | #3E2E20 | the rounded rim, the cloth's leather hem | 9.56:1 |
  | Forged iron | #4A4744, nail heads #2B2A28 with a #6E6A64 highlight | corner straps | 6.79:1 |

- **Rustic details**, baked into T2 and seeded by `streamFor(\`table:${seed}\`, 'detail')`:
  - three wide planks across the short side, with dark seams and two square nail heads at each
    plank end;
  - forged iron straps wrapping the four corners, each with three square nail heads;
  - 3 to 5 short knife marks near the bread board's slot;
  - one faint tankard ring (a 1 px #5E4630 circle at 35%, broken in two places) near the
    tankard's slot;
  - a worn, lighter rim along the long edge nearest the viewer's chair (the bottom edge).
- **Size.** The table extends 0.35 × the cloth's height beyond the cloth on every side. The room
  extends 0.5 × the table's height beyond the table.
- **Art source.** M1: a procedural tile (1024², grain from value noise along x, ray fleck as
  faint #BB9E7C ellipses, seams and nails as paths). M1-should: the owner's 1024² seamless oak
  tile (prompt A1), with the procedural tile as the fallback.

### 2.3 The cloth

- Painted linen #E8DCC2 with fiber flecks (short strokes at random angles, ±3% L\*) that show only
  in the margin; the terrain fills cover them. Never a woven grid, which would read as the
  cross-hatch docs/09 reserves for starving.
- A 26-unit margin around the map's rounded outline, a 4-unit leather hem #3E2E20, a soft contact
  shadow on the oak (#000 at 35%, offset 3 px toward the lower right, blur baked).
- Four **square** brass tacks #B8914A with a 1 px #D4B26A highlight on two edges.
- In the margin: a title cartouche at the top center with the map's seeded name in Marcellus SC,
  ink #1C1A17 (12.8:1), for example "The Ember Marches" (`mapTitle(seed)`, presentation only);
  a compass rose in the corner the map's rounded outline leaves empty (upper right). Both never
  touch a province.
- The map's rounded outline is a 3 px ink line. No light, grade, vignette or season tint ever
  falls on the cloth (R19).

### 2.4 The tavern: "cozy but natural"

Seen from above, around the table, in the same projection, so there is no seam.

| Element | Where | Drawing (procedural M1; owner raster M1-should, prompt A2) |
|---|---|---|
| Wide oak floorboards with dark seams | everywhere | planks #3A2C20, seams #1E1712, lit planks #5A4430 |
| The hearth | beyond the table's west side | its warm glow spills across the floor and onto the table's west rim |
| A leaded window's daylight | a pale patch on the floor to the east | the "natural" light: a window as well as a fire |
| A wool rug | under the table's south side | undyed wool #6B5A48 with a plain border #8A7560 |
| A bench with a folded cloak; a barrel with iron hoops; a three-legged stool | around the table | browns #4E3A28, #5E4630; cloak #5A5148 |
| A hound asleep on the rug, seen from above, head tucked away | south-west | #7A6450, shade #5A4636 |
| Straw near the door | the south edge | a few #B89A5A strokes |

No people, no text, no banners, no weapons. Nothing looms in the dark, which separates cozy from
dread. No saturated reds, oranges, greens or blues anywhere in the room except the hearth's
small glow, so nothing reads as a mana color or a banner.

**Seasons (M1-should).** The room follows the game month with the battle backdrops' months
(`docs/12-battle-presentation.md` S2.4):

| Months | Room |
|---|---|
| 11 to 2 (winter) | cool window patch #CFE0EA, frost in the window corners, the hearth glow 20% stronger |
| 3 to 5 (spring) | fresh rushes on the floor |
| 6 to 8 (summer) | a brighter, warmer window patch #FFF1D6 |
| 9 to 10 (autumn) | a few leaves by the door, rain streaks in the window patch |

A season change cross-fades over 2 s, at most four times a year, and is instant under reduced
motion. Never on the cloth.

### 2.5 Props

Props stand in the table margin, never on the cloth. Each sits in a fixed slot beside a cloth
corner or edge, centered 0.06 × the cloth's height outside the hem, so its inner third shows in
the oak band at the start zoom. Variants come from `streamFor(\`table:${seed}\`, 'props')`, the
same on every reload.

**Props are inert in M1.** They have no hover and no click; the cursor pans through them, and a
click on one does what a click on bare table does (it clears the selection). Each is decorative,
or a **mirror** of a fact the chrome already shows. No prop is ever the only home of a fact.

| Prop | Slot | Kind | Rule | When |
|---|---|---|---|---|
| Month candle in an iron holder | upper left | mirror of the clock's month hairline | wax height = `1 − day/30`; at the month's end, after the spread, a fresh candle lights with a 0.4 s puff (instant under reduced motion) | M1-should (Phase 12) |
| Hourglass | upper right | mirror of speed and pause | sand runs at the speed's rate (0, 1, 2, 4, 8 grains a second); **it lies on its side while paused**, a fourth channel beside the red tint, PAUSED and the hatched pips | M1-should (Phase 12) |
| Inkpot and quill; brass dividers | lower left | decorative | dividers in aged brass, square pivot | M1-should (Phase 9) |
| Pewter tankard; two bone dice | lower right | decorative | pewter #91A092 or clay, seeded | M1-should (Phase 9) |
| Bread board with a heel of bread and a knife | bottom edge | decorative | the knife marks (2.2) sit beside it | M1-should (Phase 9) |
| Folded letter with a dark wax seal (#4A2A1C) | top edge | decorative | — | M1-should (Phase 9) |
| Six spare unpainted wooden tokens | left edge | decorative | the same shield shapes as the army tokens, bare wood | M1-should (Phase 9) |

Later (M2): hover names, cosmetic clicks, props that change over a campaign.

### 2.6 Lighting

- **The cloth is lit by neutral daylight.** Nothing grades it (R19).
- **The table** (T3, every effect masked off the cloth):
  - the hearth's warm gradient on the west rim: 2000 K #FF890E, additive, 20% at the rim, gone
    by 30% of the table's width;
  - the month candle's pool: 2700 K #FFA757 at 25%, radius 0.12 × the cloth's height (with the
    candle only);
  - a vignette toward the table's rim: #140C06 rising to 45% at the rim.
- **The room** (T0): the hearth glow on the floor (#FF890E radial, 30%), the window patch
  (#F2EBDD at 14%, or the season's), and a vignette toward the screen edge (#0E0905 to 50%).
- **The chrome** is never lit.
- **Time of day** is never used: the sim has none, and a whole-board shift hurts reading.

### 2.7 Camera and zoom

| Zoom | Rule | What shows |
|---|---|---|
| **Start** | the cloth fits the unobscured area (staged docs/07) with a **32 px oak band** on its tightest side | the Mid band: on Medium at 1280×720, about 1.07 px per unit and 95 px per province |
| **Lean back** (minimum) | 0.75 × the scale at which the whole table fits the view | the whole table, its props, and a ring of tavern floor; on Medium the map is in the Far band |
| **Near** (maximum) | the median province is 420 px across | the Near band; no oak on screen |
| **Pan clamp** | the view's center stays inside the table's rectangle | never the void beyond the room |
| **Detent** | a wheel stop within ±8% of the start zoom settles to it 150 ms after the last wheel event, over 200 ms (instant under reduced motion) | the standard view is easy to find |
| **Fit** | `Z`, or the Fit button at the top of the mode column | returns to the start zoom (`Home` stays the capital) |

- The camera never rotates or tilts and has no parallax. Wheel and pinch zoom ease over 120 ms;
  reduced motion makes zoom steps instant.
- `H` (hide chrome) leaves the table in view, which doubles as a screenshot mode.
- Zoom bands still come from the median province's on-screen diameter, so the table changes no
  band rule.

### 2.8 The chrome in oak, brass and leather

The staged docs/09 "UI chrome" keeps its structure and every token value. The chrome reads as the
table's furniture: oak frames and brass hardware around the approved dark panel bodies.

**New tokens** (WCAG measured in `judge2-calc/checks.out` and `final-calc/colors-final.out`):

| Token | Value | Use | Measured |
|---|---|---|---|
| `--oak-0` | #2B231C | 3 px bevels of the top bar, 6 px dock frames, the strip's top spine, 8 px modal frames | text 13.34, dim 5.74, `--warm` 7.12, `--cool` 7.10 (no text sits on it today) |
| `--oak-grain` | #3A2E23 | grain lines inside frames only, at most 1 px and 20% coverage | worst case under text: text 11.37, dim 5.16 |
| `--brass` | #B8914A | 1 px keylines (action buttons, the top bar's bottom edge, the docks' map-facing edges, modal frames); 14 px L-shaped corner brackets; square tacks and rivets | 5.94 on `--chrome-0`, 4.62 on `--chrome-2`, 4.51 on grain (non-text needs 3) |
| `--brass-hi` | #D4B26A | a 1 px highlight on brackets and tacks only | never within 2 px of a mana symbol (1.5 from Radiance's secondary) |
| `--leather` | #4A3426 | 10 px spines of the Codex and Ledger modals, with square brass stitch marks at 40% | never under text |
| `--parchment`, `--ink` | #E8DCC2, #1C1A17 | the battle report card's face and Codex article pages (M1-should, owner A/B) | ink 12.77, ink at 70% 5.53 |
| `--warm-ink`, `--cool-ink` | #8A4A12, #2F5D73 | ▲ and ▼ deltas on parchment | 5.03, 5.26 |

**Where material appears:**

| Place | Treatment |
|---|---|
| Top bar | the `--chrome-0` body unchanged; 3 px oak bevels top and bottom; a 1 px brass keyline on the bottom edge; square brass rivets at both ends |
| Bottom strip | the body unchanged; a 6 px oak spine on top with a 1 px brass keyline |
| Docks | bodies unchanged; a 6 px oak frame on the map-facing edge with a 1 px brass keyline; 14 px brass corner brackets at its two map-facing corners |
| Modals (Research, Ledger, Codex, Settings, Game Menu, the report card, the replay) | an 8 px oak frame with 14 px brass corner brackets and square tacks; bodies unchanged. The replay modal shares the hardware, so the battle stage does not feel like another game |
| Codex and Ledger | a 10 px leather spine on the left edge |
| Action buttons | the 1 px keyline becomes `--brass` (4.62:1); the staged keyline (text at 25%) measures 2.10:1, under WCAG 1.4.11's 3:1 |
| Battle report card and Codex article pages | parchment with ink text, only if the owner picks it in the mockup's A/B (M1-should). Mana symbols on parchment take a 1 px ink ring (Radiance's primary is 1.09:1 on parchment) |
| Tooltips, the alerts ribbon, the outliner, panel rows and cards, the mode column, toasts | unchanged (approved) |

**What material never does:** grain never sits behind text, numbers or icons; brass never touches
a mana symbol (at least 2 px of chrome between them); brass is never round; leather never carries
text; the map is framed by no more than a dock's 6 px edge, so it stays the hero.

**The warm retune was measured and rejected** (R27). The mockup shows both versions side by side
(mockup step 9).

### 2.9 Ambient motion and reduced motion

| Motion | Parameters | Reduced motion |
|---|---|---|
| Candle flame | brightness ±3% and height ±2% from seeded value noise at 0.7 to 1.3 Hz | frozen at the mean |
| Hearth glow (floor and the table's west rim) | brightness ±4% on a 7 s cosine | frozen at the mean |
| Dust motes in the window light | at most 12, drifting 2 to 4 px/s; over the room and oak only | removed |
| Hourglass sand | at the speed's rate | the level shows, no stream |
| Season change | 2 s cross-fade, four times a year | instant |
| Map repaints | section 4.7 | instant |

- Nothing flashes: every rate is under 3 Hz and every change under 10% brightness (WCAG 2.3.1).
- Ambience updates at most 30 times a second and stops while the tab is hidden, while the replay
  modal is open, and while no table pixel is on screen.
- The staged docs/09 motion list ("the pulse, the idle bob and every UI tween") gains "table
  ambience and map repaints".

### 2.10 Ambient sound

Out of M1. docs/10 rules out "music, sound outside battle replays (map, menus, UI)", and the
owner has not asked for more. M2: a hearth crackle, a soft murmur, rain on the window in autumn,
a quill scratch on an order, synthesized by the battle track's recipe engine
(`docs/12-battle-presentation.md` S3) behind an "Ambience" slider. M1 ships no audio code in the
map renderer.

### 2.11 Settings (UI state in the store and the save's UI block, never in `GameState`)

- **Interface → Table:** Full (the room, the table, props, ambience; the default from Phase 9),
  Simple (oak and cloth, a still room gradient, no props, no ambience; Phase 8's only mode), Off
  (a flat #15130F around the cloth's hem, today's look).
- **Interface → Map detail:** Full (default), or Reduced: terrain stamps at half density, pole
  motifs off, ambience off. Reduced never removes information: settlements, walls, land-look
  washes and nation motifs, scars, ritual and siege marks, wilds and tokens stay.
- **Accessibility → Reduced motion** (follows the OS) also freezes the table's ambience and makes
  repaints instant.

### 2.12 Performance budgets

| Item | Budget |
|---|---|
| Draw calls for T0 to T5 | at most 4 (room, oak, props atlas, cloth); no filters, no runtime blur |
| Textures | oak tile 1024² (procedural, or the owner's WebP ≤ 250 KB); room ≤ 1536 × 1024 (procedural, or WebP ≤ 400 KB); props atlas 1024²; vignette 256² |
| Ambience | ≤ 0.3 ms CPU per frame (2 glow sprites, ≤ 12 motes) |
| GPU memory, table and map together | ≤ 96 MB on a Large 4-nation map at device pixel ratio 2 (3.8) |
| Rebakes | the room once per load and per season; the oak and cloth once per load; mirror props only when their state changes |
| Context loss | every baked layer is rebuilt from state and seed (`render/map/*.rebuild()`) |
| Frame | docs/06's "60 fps at 1080p with all provinces and 100 army markers" holds with Table Full and Map detail Full. A Playwright performance smoke runs on commits that touch `src/render/**` (battle design D11) |

---

## 3. More map detail: the painted cloth

### 3.1 Three layers, and the draw order

The staged docs/07 draw order stays and is extended: the map's static art is split into three
layers, so a mode switch only changes alpha and tint (R31).

1. **Cloth** (T5, section 2).
2. **Fill layer** (live: one batch of province `Graphics`): the terrain fill with docs/09's 10%
   noise multiply; in Ownership mode, the land-look wash of provinces in sight (4.3); in a data
   mode, the mode's fill instead (3.9).
3. **Decoration layer** (baked per zoom band; Ownership mode only, faded out over 150 ms in any
   other mode, instantly under reduced motion): ground textures, standing terrain stamps,
   settlements and landmarks, land-look and pole motifs, battle scars, unrest marks, and the fog
   line art.
4. **Always-on layer** (live; every mode, every band): wilds (ground, stamps, contour, rim);
   the 2 px borders (dotted under fog); ownership bands with keylines and the nation sigil on the
   band corner; ritual marks (`mapMarks`, pretender C.4); siege camps and wall states; pillage
   smoke; the Wellspring monument and its claim state.
5. Mode overlays (move-targeting hatch, the ritual hop outline).
6. Labels (province names, wild names, the second line).
7. Numbers-layer chips.
8. Path previews.
9. Army tokens (and standees at Near, M1-should).
10. Transit arrows and ETA labels.
11. Selection rings.
12. Battle markers.

The province tooltip and the cursor label stay DOM overlays placed from Pixi coordinates. T6
ambience never draws over the cloth.

### 3.2 Two classes of detail, per terrain

- **Ground textures** are flat lightness changes within ±8% L\* of the fill (±10% for
  Wasteland's cracks), symmetric so a province's mean color stays its fill. Inside label, badge
  and seat boxes they drop to ±4%. At Far each terrain uses one seamless pattern in global
  texture space.
- **Standing stamps** are small drawings that stand up from the ground: trees, humps, peaks,
  reeds, rocks, houses, motifs.
  - Faces are the fill lightened 12% L\* and darkened 18% L\*, with a 1 px ink outline
    (#1C1A17 at 70%), so they read as painted texture and never as a new color.
  - They never sit inside a label, badge or seat box from `layoutMapLabels` (plus 4 px), stay
    inset from the border by the band width plus 3 px, and draw by their bottom edge, so nearer
    stamps cover the feet of those behind.
  - They cover at most 60% of a province at Mid and 75% at Near.

| Terrain (fill) | Ground texture | Standing stamps | Far mass | Mid | Near |
|---|---|---|---|---|---|
| Plains #C1D29F | grass stipple; 1 or 2 short hedgerow lines | grass tufts, lone trees, a haystack | 2 tuft clusters | 10 | 20 |
| Farmland #EEBA3A | a patchwork of 5 to 9 field polygons (a seeded Voronoi inside the cell), each ±6% L\*, furrows at 0°, 90° or ±30° (never 45°), hedges between | haystacks, a windmill | 2 field blocks | 4 | 8 |
| Forest #374C2B | a canopy scallop (arcs of crowns) | tree crowns in two tones, in clumps; "half trees" at the inset edge with their bottom outline dropped | 4 canopy clumps | 30 | 60 |
| Hills #856824 | hachure arcs on the shadow side (lower right) | rounded humps with slope strokes | 3 humps | 6 | 10 |
| Mountains #8DA4AD (passable) | scree stipple | small snowless peaks; the dashed footpath (1.10) | 3 peaks | 5 | 8 |
| Swamp #1A727A | short staggered water streaks and pools (#2C8C94) | reed tufts, dead snags | 3 reed clusters | 12 | 22 |
| Wasteland #AE897F | a crack network (edges of a fine seeded Voronoi) | rocks, a bleached skull, dry shrubs | 2 rock clusters | 8 | 14 |

Counts are per average province (6400 units²) and scale with area. The Far masses are also the
fog silhouettes (3.10), so every terrain has one.

**No texture is a reserved pattern.** A content test (`tests/content/presentation.test.ts`)
measures every texture's strokes: no more than 10% of the stroke length within 10° of 45°; no
two perpendicular angle bins each above 30% (a cross-hatch); and no single angle bin above 60%
with strokes spanning more than half the province (a uniform hatch). Those patterns belong to
states (docs/09: unreachable, starving, unrest steps, fog).

**Placement** (`scatterProvince`, pure, `src/present/map/scatter.ts`):
- **Slots:** `poissonDisc` (from `src/mapgen/voronoi.ts`) on the inset cell, with a radius per
  terrain (0.09 √area for Forest up to 0.2 for Plains), on
  `streamFor(\`map:${seed}:${provinceId}\`, layer)`. Slots are computed once per map and cached.
- **Ranks:** each slot gets a seeded rank. Far shows the lowest ranks, Mid more, Near all, so
  zooming in only adds stamps and none moves.
- **Order of use:** slots are sorted by distance from the seat. Dominion motifs replace terrain
  stamps in the slots nearest the seat; pole motifs replace them in the outermost slots (4.3).
  Growth changes what stands in a slot, never where.
- **Shared vocabulary:** tufts, rocks, reeds, dead trees, crop rows and the windmill are the
  battle backdrops' props (`docs/12-battle-presentation.md` S4.4), so a province looks like its
  battlefield.

### 3.3 Borders

- Straight ink lines: 2 px #2B2620 with a seeded alpha between 0.85 and 1.0 along the stroke,
  and a 3 px inner pigment edge (black at 12%), a watercolor pooling cue. A border is a survey
  line: the geometry is the rule.
- Dotted under fog (staged). Along a wild, the wild's 3 px contour replaces the border (1.10).
- Painted noisy edges are Later, and only with hit tests on the same noisy polygon.

### 3.4 Ownership

- Bands are unchanged: a flat banner strip on the inner border with a `keylineFor` keyline, drawn
  above stamps and settlements, with the nation's sigil (pretender B.7) on the band corner in
  Ownership mode (staged spec 2.10.2).
- A banner pennant flies from the seat's tallest roof in the owner's banner; it changes the day
  the province changes hands.
- The settlement is built in the owner's kit (4.2), so ownership shows twice, as a band and as
  architecture, and neither relies on hue alone.

### 3.5 Labels

- The staged rules stay: names in Alegreya Sans with a dark halo, the Mid budget of 96 × 30 px
  and 2 lines, culling by priority.
- Wild names follow 1.10. Culling priority becomes: capitals, Wellsprings, wild names, own
  provinces, the rest.
- **The label test grows** (`tests/ui/derive/mapLabels.test.ts`, Medium seeds 1 to 5, the start
  zoom on 1280×720 and one Near zoom): no two visible boxes overlap among province labels, wild
  labels, token boxes and standee boxes; no standing stamp, house, motif or landmark box
  intersects any label, token or seat box plus 4 px; at least 90% of provinces keep a visible
  name.

### 3.6 Army tokens

- **Tokens** keep the staged shapes and content (rounded shield own, notched shield other
  nations, plain shield independents; the count; at most one corner glyph by exception). The
  material changes:
  - nations' tokens are painted wood: a flat banner fill, a 1 px lighter top edge (the banner
    +12% L\*), a 1.5 px dark outline (#1C1A17 at 70%);
  - independents' tokens are pewter #91A092 (10 from the independents' grey #8C8A80, so
    material and faction agree);
  - a fixed contact shadow (an ellipse, #000 at 25%, 2 px down);
  - count plates stay flat and unlit, in tabular figures;
  - the pretender's token has a brass edge, the crown glyph and its aura motes (pretender C.5);
    the prophet's token carries the halo glyph;
  - the token's lower corner is reserved for the M2 artifact star (R10).
- **Standees** (M1-should, Phase 11, after the battle rigs land in Phase 10): at Near, the lead
  commander's rig in its idle pose, 40 px tall and never taller than 46 px, stands on the token.
  The badge box grows by the standee's height, and `layoutMapLabels` knows it. An unscouted
  independent force stands as a cloaked figure, with its strength word on the plate; a scout
  turns it round. Map detail Reduced keeps tokens only. No idle bob on the map; docs/09's walk
  bob stays and reduced motion removes it.
- **Path previews** become a light thread (3 px #F4EEDF with a 1 px #1C1A17 edge, dashed 8 / 6)
  with square brass tacks (6 px #B8914A, set as diamonds, dark outline) at each day mark and the
  day on a flat plate. Never round, so a step cannot be read as a mana symbol or a spring.

### 3.7 Level of detail by zoom

Decoration thins by band. Information never does (the staged rule).

| Layer | Far (under 70 px) | Mid (70 to 180) | Near (over 180) |
|---|---|---|---|
| Fills, bands, borders | yes | yes | yes |
| Ground textures | global patterns | per province | per province, full |
| Terrain stamps | 2 to 4 masses per province, every terrain | the Mid counts (≤ 30) | the Near counts (≤ 60) |
| Wilds | full (1.10) | full | full, with scree and reflections |
| Settlements | a keep glyph at forts, one roof cluster from tier 3 | every house of the tier, walls, landmarks | plus yard details (a well, a cart, garden plots) |
| Land-look wash | yes | yes | yes |
| Nation motifs | none | their share of the Mid slots | their share of the Near slots |
| Pole motifs | none | 1 per effective step | 2 per effective step |
| Information marks (siege, pillage, ritual, Wellspring claim) | yes | yes | yes |
| Battle scars, unrest marks | none | yes | yes |
| Tokens | one per nation per province (staged) | tokens | tokens, standees (should) |
| Labels | staged | staged | staged |

When the band changes, the decoration layer cross-fades over 150 ms (instant under reduced
motion).

### 3.8 Density budget and the bake

- **Caps:** at most 30 standing stamps per average province at Mid and 60 at Near; coverage at
  most 60% and 75%; settlements at most 22 houses plus 4 landmarks; motifs at most 30% of a
  province's slots.
- **Decoration bake:**
  - Far: 0.6 px per unit × device pixel ratio, the whole sheet in tiles of at most 2048² (about
    5 MB on Large with 4 nations at DPR 2).
  - Mid: 1.25 px per unit × DPR, the whole sheet in tiles of at most 2048² (about 10 MB on
    Medium and 22 MB on Large with 4 nations at DPR 2, J2). Within the band the bake is scaled,
    not redrawn.
  - Near: lazily, per 512² screen tile, with an LRU of 32 tiles (at most 32 MB at DPR 2). Never
    a whole-map Near bake.
- **Re-bakes:** a province's dirty rectangle (its bounds plus stamp overhang) re-bakes when its
  look key changes (4.7), staggered at most 3 ms per frame. A full Mid bake on Medium takes at
  most 150 ms, run behind the loading screen.
- **Live layers:** the fill layer (one batch), the always-on layer (wild stamps from one atlas;
  borders and bands as `Graphics`), labels (`BitmapText` for numbers), tokens (one atlas, at
  most 100 armies), paths, selection and effects.
- **Memory:** table and map together within 96 MB on Large with 4 nations at DPR 2.

### 3.9 Map modes still read

- In every mode but Ownership the decoration layer fades out (R23). The mode tints a plain fill,
  exactly as the staged spec tested it.
- **The mode's base** is the terrain fill desaturated 80% and **lifted to L\* 50 or lighter** with
  linen: Forest #79786B (+33%), Hills #7E7767 (+12%), Swamp #6F7A77 (+19%); the lighter fills
  need no lift. Undominated provinces in Dominion mode show this base, never a flat grey.
- **Data ramps** (Supply, Unrest, Population) run #4C5E96, #8170AC, #C4808E, #E6AC6E, #F8E6A6
  (L\* 41 to 91; adjacent steps at least 13 apart for normal vision; each mode keeps its second
  channel).
- The always-on layer, labels, chips, tokens and the mode's second channel keep full contrast.
- Measured: every M1 mode color passes 20 / 12 directly against both wild grounds (R16).

### 3.10 Fog: "not yet painted"

What is shown stays as the staged spec rules. Only the look changes.
- **Unexplored:** the cartographer has not painted it yet.
  - The fill under a 4% linen haze, with no land look.
  - Terrain stamps and the Far masses drawn as **line art** with no fill: #3E3428 on Plains,
    Farmland, Mountains and Wasteland; #E8DCC2 on Forest, Hills and Swamp (at least 3.5:1 on
    each, `colors-extra.out`). Terrain still reads by shape, since terrain is public.
  - A dotted border.
  - No settlement detail: one sketched hut outline at the seat ("people live here, number
    unknown"). No motifs, scars or marks beyond what the tooltip shows.
- **Explored, out of sight:** painted but faded: the fill desaturated 10%, the wash hidden,
  stamps and motifs painted, the settlement as the view allows (population once explored), a
  dotted border. Armies show only where the nation sees.
- **Wilds** are never fogged.
- The fill changes are the largest that keep every terrain pair distinct in every combination of
  states and land looks (R18).
- **One projection.** Every map look is computed from the same `provinceView(state, viewer, id)`
  the tooltip and the modes use. The UI spec's fog guard test covers `mapLook` and portraits:
  changing hidden state leaves the output unchanged.

### 3.11 Palette and contrast tests (`tests/content/palette.test.ts`, extended)

1. Wild grounds against every terrain fill: 20 normal, 12 under each deficiency.
2. Wild grounds against every banner (all five colors' primaries, every `NATION_BANNERS` entry,
   the independents' colors): direct, or, by docs/09's band rule, the rim #E9E4D8 differs from
   both. Every M1 banner must pass directly.
3. Wild grounds against every map-mode color the renderer can produce, computed from content:
   dominion steps of every banner over every lifted base, the undominated bases, and each data
   ramp sampled at 21 points. M1 colors directly; W, U and B directly or by the rim. Ramps start
   at L\* 40 or lighter.
4. Every `LandLook`'s wash at `washMax`: every pair of different terrains, unwashed, washed by one
   nation, and washed by two different nations.
5. Fog and land looks together: every pair of different terrains in any two states (unexplored
   haze; in sight with any land look; out of sight desaturated with the wash hidden), and both
   wild grounds against every state.
6. WCAG: the rim on both grounds, ripples on water, the footpath on Mountains and the fog line
   art on each fill at 3:1 or more; wild labels on their grounds at 4.5:1 or more; every new
   chrome token at 4.5:1 for text it carries and 3:1 for keylines; every settlement kit has one
   tone at 3:1 or more on every fill.

---

## 4. Growth over time, based on alignment

### 4.1 Principles

1. **Derive from state the sim already keeps.** Population and its start, buildings and
   construction, PD, sieges, unrest, dominion (holder and strength), effective scales, province
   effects, Wellspring claims, ownership, commanders' orders, and the battle summaries the UI
   already keeps. No new sim field (R36).
2. **Investment shows, because population barely moves.** Over the 70-month target a province
   grows about +15% at neutral scales, +115% at Growth +3 and −39% at Rot −3
   (`research-mapdetail.md` 3.3). So the art combines population (against its start) with what
   the player builds (PD, temples, labs), how deep a god's presence runs (dominion strength,
   which rises month by month), and the events that mark the land.
3. **Alignment paints the land; ownership builds the houses.** The dominating nation's god
   repaints the ground; the owner's architecture builds the settlement. Where they differ, the
   province tells a story: a Cinder town with blossom creeping in is losing its faith, as the
   province panel already says in words.
4. **Calm and stable.** Slow looks change at most once a month; events show the day they happen.
   Growth adds pieces at the edge and decline removes the newest, so nothing reshuffles. The same
   save shows the same map after a reload (R22).
5. **Never hide information.** Everything here sits in the decoration layer below bands, labels,
   tokens, glyphs and mode tints, keeps out of label and badge boxes, and fades out in data
   modes. The information marks (sieges, pillage, rituals, Wellspring claims) are in the
   always-on layer.
6. **Art never shows more than the tooltip.** Every look of another nation's land comes from the
   viewer's fogged view.

### 4.2 Settlements

**Tier from population** (`settlementTier(pop, isCapital)`, `src/present/map/settlement.ts`),
using the Population mode's steps, one source for both (`UI.popSteps` in `src/content/ui.ts`):

| Tier | Population | Houses (interpolated by population within the step) |
|---|---|---|
| T1 hamlet | under 2,000 | 1 to 2 |
| T2 village | 2,000 to 4,999 | 3 to 5 |
| T3 town | 5,000 to 9,999 | 6 to 9 |
| T4 large town | 10,000 to 19,999 | 10 to 15 |
| T5 city | 20,000 and up (every capital) | 16 to 22 |

- **Never reshuffled.** House *k* sits on a golden-angle spiral around the seat: angle
  k × 137.508°, radius 3.2 √k units, squashed 1.3 : 0.8 so it reads as ground seen from above.
  Its jitter, size and roof variant come from `hash32(seed, provinceId, 'house', k)`. Growth adds
  house *k* + 1; decline removes the highest *k*.
- **Thriving and declining** compare population with the province's start (`MapProvince.startPop`),
  because absolute growth is small:
  - thriving, at 1.25 × the start or more: the two newest houses get fresh pale-thatch roofs
    (#E3CF8F) and garden plots appear around the spiral (flat ground texture);
  - declining, at 0.80 × the start or less: the two newest houses stand as roofless ruins (walls
    in outline, no roof).
- **Walls by PD**, the player's most visible investment (0 to 30 levels, 6,975 gold):

  | PD | Defense |
  |---|---|
  | 0 | none |
  | 1 to 4 | a watchtower |
  | 5 to 14 | a palisade ring |
  | 15 to 24 | a stone wall ring |
  | 25 to 30 | a stone wall with towers and a gatehouse |

  The ring's radius follows the house count.
- **Landmarks** at fixed seeded slots around the seat: the keep (fort), the temple, the lab, and
  the Wellspring monument.
  - **Under construction:** scaffolding, with the built part's height at `1 − daysLeft / days`
    in quarters.
  - **A temple without faith** (the province's dominating nation is not its owner) shows an unlit
    brazier: docs/01's rule that such a temple "keeps no faith".
- **Kits by owner** (`SETTLEMENT_KITS` in `src/content/presentation/map/kits.ts`):

  | Kit | Houses | Temple | Lab | Keep | Signature |
  |---|---|---|---|---|---|
  | Cinder Horde | dark timber longhouses with jagged crests; soot roofs #3A3633, ash walls #8F8C88, static ember window dots #FFB347 | a stepped pyre tower with a brazier | a blackstone spire with an ember window | a basalt keep | braziers along the road |
  | Thornwood | round huts with living roofs #4E6B3A, timber walls #A0785A; tree houses from T4 | a ring of trees around a grove altar | a hollow-tree tower in leaf | a living palisade around an oak keep | saplings around the seat |
  | Independents | timber and fieldstone #D8CBB0, thatch #C2A86B | a wayside chapel | a stone tower | a square stone keep | a plain shield pennant |

  - Every kit tone set has one tone at 3:1 or more against every fill (3.11), and every roof
    carries a 1 px ink outline.
  - **Future nations:** `NationDef.look.kit` is optional. A nation without one takes its
    primary color's kit from `COLOR_KITS`: W whitewashed stone and red-brown tile; U blue slate on
    stilts; B black stone with bone; R the Cinder kit; G the Thornwood kit. A content test
    requires a kit for every nation or its color.
- **On capture,** the band and the pennant change the same day (information). The kit converts at
  the next month boundary (slow), as a captured town is rebuilt.

### 4.3 Alignment: land looks and scale poles

**Data** (`src/content/presentation/map/land.ts`):

```ts
export interface LandLook {
  /** Ground wash over the terrain fill at strength 10 (Ownership mode, in sight only). */
  wash: string;
  /** Wash alpha at strength 10. tests/content/palette.test.ts computes the cap (3.11). */
  washMax: number;
  /** Motif ids by level: level 1 (strength 1-3), 2 (4-6), 3 (7-10). Each level adds to the last. */
  motifs: readonly [readonly MotifId[], readonly MotifId[], readonly MotifId[]];
  /** One per province at strength 7 or more, in the slot nearest the seat. */
  landmark: MotifId;
}
export const LAND_LOOKS: Readonly<Partial<Record<NationDefId, LandLook>>>;
export const COLOR_LAND_LOOKS: Readonly<Record<Color, LandLook>>;   // fallback by primary color
export const POLE_MOTIFS: Readonly<Record<ScalePole, readonly MotifId[]>>;
```

**The rule, which covers every future nation:**
- A province's land look is its **dominating nation's** look (`dominion.nation`), at its
  strength (`dominion.strength`, 0 to 10). A nation without a record takes its primary color's.
- **Strength sets the amount:**

  | Dominion strength | Wash alpha | Motif slots (nearest the seat) | Landmark |
  |---|---|---|---|
  | 0 | none | none | — |
  | 1 to 3 | washMax × s / 10 | level 1, 8% of the province's slots | — |
  | 4 to 6 | washMax × s / 10 | levels 1 and 2, 15% | — |
  | 7 to 10 | washMax × s / 10 | levels 1 to 3, 22% | one |

  So a province shows its god around its people first, and the motifs reach farther month by
  month as strength rises: growth over time, by alignment.
- **Each scale pole adds its own motifs**, by the province's effective scale per axis
  (`provinceScales(state, provinceId)`, docs/01 §12, Wellspring steps included): 1 motif per step
  at Mid and 2 at Near, at most 6 per axis, in the outermost slots, with all motifs together at
  most 30% of a province's slots.
- Independents have no dominion and scales of 0, so their land is unpainted.

**The two M1 nations:**

| | Cinder Horde | Thornwood |
|---|---|---|
| Wash | ash #8F8C88, **washMax 0.10** | moss #5E7F45, **washMax 0.06** |
| Measured at the caps | every pair type 21.0 normal, 12.5 CVD (12% and 8% fail: 19.8, 11.8) | same test |
| Level 1 | ash drifts (a grey stipple ground texture), black-stone cairns with one ember dot | blossom clusters (#EAD2DA) in the crowns, ivy on stones |
| Level 2 adds | scorched patches with a static ember speckle, obsidian shards, braziers along the road | saplings in open slots, mossy standing stones, flower meadows |
| Level 3 adds | charred trees replacing up to a third of the nearby crowns, thin static ember cracks (#FFB347) | great old trees, vines over the houses, bramble arcs |
| Landmark (strength 7+) | the burning cairn: a tall cairn with a brazier | the elder tree: an outsized crown ringed with blossom |

Ember tones appear only on Cinder land and Cinder settlements, which carry that color (docs/09:
mana colors only on things that carry them).

**The M2 color families** (fallbacks, drawn when those nations arrive): W Radiance white marker
stones, sun shrines, pale-stone roads, a white tower; U Tide mist pools, blue reeds, stilt walks,
flooded fields; B Umbra dead grass, crows, bone cairns, black pools, gibbet trees. Their washes
are capped by the same test.

**Scale-pole motifs** (`POLE_MOTIFS`, exact shapes):

| Pole | Motifs | Pole | Motifs |
|---|---|---|---|
| Order | straight hedgerows, milestones, a roadside shrine | Turmoil | broken fences, a toppled cart, a smoke wisp (never burning roofs, which belong to pillage) |
| Lore | glyph-ringed standing stones, a small observatory | Fury | war cairns topped with spears, torn banners |
| Growth | fruit trees, lush crop clumps; farmland furrows doubled from +2 | Rot | dead trees replacing crowns, fungus rings, bleached bones |
| Wild | briars over field patches, ferns, a beast den | Artifice | a mill, chimneys, a quarry scar, stone field walls |
| Sanctity | wayshrines with a candle, a pale-stone path, a glow on the temple | Dread | a gibbet, crows on bare branches |

A Warlord Cinder Horde (Turmoil, Fury) at full strength shows ash, cairns, toppled carts and war
cairns. An Elder Oak Thornwood (Growth, Wild) shows blossom, briars, fruit trees and doubled
furrows. They read apart at a glance and in greyscale: one is spiky and stony, the other round and
leafy.

### 4.4 Scars and blessings from events

| Event | What shows | Source | Lasts, cadence | Layer |
|---|---|---|---|---|
| **Battle** the viewer fought | under 90 days: churned earth along a line through the province, broken spears, crows; then grave cairns, 1 per 50 casualties (at most 4), until day 360 | the `BattleSummary` list in the save's UI block (day, province, casualties) | stages change at month boundaries | decoration (the staged crossed-blades marker is the information) |
| **Siege** | a camp of tents in the besieger's banner, a stake ring, a ram; walls intact at 200 HP or more, cracked at 100 to 199, breached at 1 to 99, a rubble gap at 0 (docs/09-balance: down below 1 HP) | `ProvinceState.siege`, where the besiegers are visible | the day it starts and each threshold | always-on |
| **Pillage** | 2 smoke columns and burning roofs on 2 houses | a visible commander with the pillage order standing in the province | daily | always-on |
| **Unrest** | at 25: shuttered windows; at 50: barricades and one smoke wisp; at 75: two | `unrest`, where the view shows it | month boundary | decoration (the unrest glyph is the information) |
| **Rituals** | the pretender design's persistent marks (C.4) with three changes asked of that track (R26): Forge of Cinders (ember glyph and a months ring), Burn the Fields (irregular char patches and three thin smoke lines, 3 months, a badge), Ash Rain (an ash-flake stipple thinning over 30 days in three steps, a badge), Fertile Season (sprout motifs and a leaf badge), Bounty of the Loam (a wheat badge), Rootwall (a thorn border at 0.35 alpha and a shield badge) | `mapMarks(state, viewer)` from `provinceEffects`; Ash Rain's steps keyed by its message day | as the effect lasts | always-on |
| **Wellspring** | unclaimed: a stone basin monument with five carved drops and a hollow diamond; while a claim runs: a priest figure at the basin and a 10-day progress ring; claimed: standing stones lit in the claimer's banner, a filled diamond and the claimer's sigil | `wellspring`, `wellspringClaimedBy`, the claiming priest's order | the day it changes | always-on |
| **The god and the prophet** | the pretender's token with a brass edge, crown glyph and aura motes; the prophet's token with a halo glyph | `pretenderId`, `prophetId` | live | tokens |
| **Capture** | the band and pennant at once; the kit at the next month boundary | `owner` | as listed | always-on, then decoration |

Every visual of another nation's province uses only what the viewer's view shows.

### 4.5 Where each visual comes from

| Visual | Derived from | Cadence |
|---|---|---|
| Terrain stamps, ground textures | `MapProvince.terrain`, the seed, the province id | never changes |
| Settlement tier and houses | `ProvinceState.pop`, capital | slow (month) |
| Thriving, declining | `pop / MapProvince.startPop` | slow |
| Walls | `pd` | fast (the day PD is bought or lost) |
| Keep, temple, lab | `buildings` | fast |
| Scaffold | `construction` | fast (quarters) |
| Temple without faith | `dominion.nation` against `owner`, with a temple | slow |
| Kit | `owner` → `NationState.def` → kit | slow |
| Pennant | `owner`, its banner | fast |
| Wash, nation motifs, landmark | `dominion.nation`, `dominion.strength` | slow (the spread runs on the month's last day) |
| Pole motifs | `provinceScales` per axis | slow |
| Unrest marks | `unrest` steps | slow |
| Siege camp, wall states | `siege` | fast |
| Pillage smoke | commanders' orders, within vision | fast |
| Ritual marks | `provinceEffects`, `Message.fx` | fast |
| Battle scars | the UI block's `BattleSummary` list | slow stages |
| Wellspring | `wellspring`, `wellspringClaimedBy`, the claimer's order | fast |

### 4.6 New state: none in the sim

- "Over time" is drawn from state that already accumulates: dominion strength (a month-by-month
  push), population against its start, PD and buildings bought, and the battle summaries.
- **Presentation state in the save's UI block** (never in `GameState`, as the battle summaries
  and the god's look already are):
  - `mapLook: { monthIndex: number; slow: Record<ProvinceId, SlowLookKey> }` (4.7);
  - `names: Record<CommanderId, string>` (5.8, M1-should).
- **Later, only if playtests ask for "old" land:** `ProvinceState.dominionSince: number | null`,
  written by `dominion.ts` in the push that flips the holder, tested by "a flip sets it to
  `state.day`, a push that keeps the holder leaves it, a loss to 0 clears it".

### 4.7 Transitions: calm, monthly, reload-stable

**The look key.** `mapLook(view, ui)` (`src/present/map/look.ts`, pure) returns two parts:
- **slow:** tier, house count, thriving or declining, kit, wash step (strength 0 to 10), motif
  level, landmark, the five pole steps, unrest stage, battle-scar stage, temple faith;
- **fast:** pennant (owner), buildings, construction quarter, PD wall stage, siege stage,
  pillage, ritual mark ids and steps, Wellspring state.

**Slow keys change only at month boundaries, and survive a reload:**
- When the store first sees a state in a new month (`monthIndex = floor((day − 1) / 30)`), it
  computes every province's slow key from the viewer's fogged view of that state, right after
  the month's last-day spread, and stores them with the month index in the UI block.
- Between boundaries the renderer reads the stored slow keys; population, unrest and the rest may
  move daily without changing the map's slow look.
- Saving writes the UI block; loading uses the stored keys when their month index equals the
  loaded state's. A save from before this feature recomputes once.
- The fast part is recomputed at every store update (the end of each day).

**Repaint.** When a key changes, the province's dirty rectangle in the decoration layer is
re-baked (3.8) and revealed:
- **M1:** a 600 ms cross-fade.
- **M1-should (Phase 12):** a 600 ms brush wipe, a soft-edged mask sweeping from the side of the
  dominating nation's nearest province (dominion changes) or the capturer's side (a kit change),
  so the paint visibly spreads from there.
- At a month end at most 8 repaints animate; the rest change at once, as the pretender design
  caps its candle kindles. Reduced motion makes every repaint instant.
- Map effects (pretender C.4 cues) play over a repaint, never under it.
- A repaint touches only the decoration bake. Labels, bands, tokens, glyphs, mode tints, paths,
  selection and the numbers layer draw above it.

### 4.8 Tests (`tests/present/map/*.test.ts`, Node, no DOM)

- `settlementTier` and the house count at every step. Adding population adds the next house and
  leaves the earlier houses where they were; losing it removes the newest.
- Thriving and declining at 1.25 and 0.80 of the start; walls at every PD step; scaffold quarters;
  the unlit brazier; kits by owner and by color; every nation resolves a kit and a land look.
  **When adding a nation, add it to these fixtures** (CLAUDE.md).
- Every `LandLook`'s `washMax` passes the palette test (3.11). Motif counts by strength level and
  by pole step; every motif id exists; no motif is in two nations' families.
- **Calm:** the slow key does not change between two days of one month, whatever the state does;
  it may change on the month's first day. The fast key changes the day of a capture, a building,
  a PD purchase, a siege threshold and a ritual.
- **Reload:** save on day 17 after population has moved; reload; every slow key is equal, and
  `mapLook` returns the same keys for every province.
- **Fog guard:** changing a hidden province's population, buildings or dominion leaves the
  viewer's `mapLook` unchanged.
- **Stable slots and determinism:** `scatterProvince` depends only on (seed, province, layer);
  the same state gives the same stamps, houses and motifs across two runs and a save round trip;
  nothing in `src/present` reads `Math.random`, `Date` or `state.rng` (the purity test).

---

## 5. Leader portraits

"Leaders certainly need portraits." Every commander gets one. A portrait is a person: the seed
picks the face, and state picks only overlays and the frame. "Varo, now wounded" is still Varo.

### 5.1 Who gets which portrait

| Commanders | Portrait | What the seed varies | Count on Medium |
|---|---|---|---|
| National commanders: Cinder Scout, Ash Chieftain, Pyre Priest, Ember Adept, Cinder Magus; Thorn Scout, Warden Captain, Grove Priest, Sapling Druid, Elder Druid | a **bust** from parts (5.3) | head, eyes, nose and mouth, hair, beard, marks, headgear variant, skin and hair ramps | 5 to 30 per nation over a game |
| Independent Captains | a **bust** from a no-repeat deck keyed by province (5.4), outfit by the terrain it guards | as above | 58 at game start |
| Pretenders (every chassis) | the rig in its **portrait pose** with the god's look (pretender B.8) | nothing: the look is chosen in the designer and kept in the UI block (B.2) | 1 per nation |
| Summoned commanders (Salamander, Treant; M2 summons) | their rig's portrait pose | markings and scars only | a few |
| The garrison holder | the fort emblem, never a face | — | 1 per fort |
| Until Phase 11's parts exist | the code-path bust (5.3), else docs/09's archetype silhouette on the banner backdrop | — | — |

### 5.2 One anchor grid (R25)

Every portrait, procedural or raster, shares one 256-unit grid:

| Anchor | y (of 256) | Share of the height |
|---|---|---|
| Crown (top of the head or headgear) | 23 | 9% |
| Eye line | 100 | 39% |
| Chin | 169 | 66% |
| Collar (cut at mid-chest below it) | 200 | 78% |
| Face axis | x 120 | three-quarter view, facing screen right |

- The SVG busts' parts are drawn on it.
- The pretender's B.8 portrait pose places its **focus line** (the eyes, or the glyph center of
  the Living Monolith) at y 100, with the silhouette's top at y 12 or lower.
- The raster style lock (Art prompt pack, P0) asks for the same proportions, and the intake
  script's crop maps the detected eye line to y 100.
- Strokes marked `data-lod="portrait"` drop below 96 px.

### 5.3 The layered SVG system

**Layers, back to front:**
1. backdrop: the banner darkened 35% with a radial vignette (docs/09's "colored backdrop");
2. hair, cloak and headgear parts that sit behind the head;
3. shoulders and clothes by type and nation, with a `currentColor` tint zone in the banner color;
4. neck;
5. head shape, in the skin ramp's three tones;
6. ears;
7. eyes and brows (a mage's eye glint here);
8. nose and mouth;
9. marks (soot stripes, ember cracks, bark whorls, moss);
10. scars;
11. beard;
12. front hair;
13. headgear;
14. a head item's `crown` part, over the headgear (units design D.9), never replacing it;
15. state overlays (5.6);
16. the frame, its band, badges and the gear chip (5.5, 5.6);
17. the pip ring on its separation ring (5.5).

**Parts** (M1, about 116 small SVGs in Phase 11; Phases 8 to 10 draw the same slots as code paths
in `proceduralPortraitParts`, as the battle rigs are placeholders until Phase 11):

| Slot | Shared | Cinder Horde | Thornwood | Independents |
|---|---|---|---|---|
| Head shape | 6 | — | — | — |
| Eyes and brows | 6 | ember glint for mages with 2 or more R pips | green glint for 2 or more G pips | — |
| Nose and mouth | 6 | — | — | — |
| Hair (bald included) | 11 | topknot, shaved sides (2) | braids with leaves (2) | — |
| Beard (none included) | 8 | braided with rings (2) | moss-tangled (2) | — |
| Scars | 3 | — | — | — |
| Marks | — | soot stripes, ember cracks (4) | bark whorls, moss (4) | — |
| Headgear, 3 per type | — | scout ash hood, chieftain horned helm, priest ember hood with a flame clasp, adept ember circlet, magus tall cowl | scout leaf hood, captain bark helm with antler stubs, priest wreath crown, druid twig circlet, elder antler hood | 4 helms |
| Collar, 2 per type | — | scale plates, robe, cowl | bark mail, leaf cloak, robe | 4 outfits by terrain: levy (plains, farmland, wasteland), hunter (forest), mountaineer (hills, mountains), reedman (swamp) |
| Skin ramps (three tones each) | — | 4 around the battle sprite's ash grey #8F8C88 | 4 around bark tan #A0785A | 5 human ramps |
| Hair ramps | 5 per nation | | | |

Totals: shared 40, Cinder 34, Thornwood 34, independents 8; plus 12 overlays, frame ornaments and
3 frame shapes. **Phase 8's v0** is about 40 code-path parts: head shapes, hair or headgear per
type, beards, the frame.

**Pools are content.** `PORTRAIT_POOLS[nationDef][unitId]` and `PORTRAIT_POOLS.independent`
(`src/content/presentation/portraits.ts`) list part ids per slot with optional weights, and the
ramps. Every commander unit has a pool or appears in `PORTRAIT_RIG_UNITS`. The content
validation fixtures enforce it (CLAUDE.md: when adding a unit, add it to the fixtures).

### 5.4 Seeding

- **One hash** (R13): every draw is `hash32('portrait', seed, commanderId, slot, ...)` from
  `src/present/rand.ts`. Each slot draws under its own key, so adding a slot moves nothing else.
- **Weighted rendezvous:** in each slot, every part `p` scores `−ln(u) / weight`, with
  `u = (hash32('portrait', seed, commanderId, slot, p.id) + 0.5) / 2³²`, and the lowest score
  wins. Part tables are **append-only** with string ids; a content test pins them against a
  committed snapshot. Adding a part changes about 1/(n + 1) of picks, against 92.5% for
  `hash % n` (`research-portraits.md` 5.5), so an art update keeps about 90% of faces.
- **Repeats among a nation's commanders** (salient look: headgear or hair, beard, head shape,
  one strong mark): helmeted types have 720 salient looks, so P(any repeat among 8) is 3.8%;
  bare-headed types have 2,640, so 1.1% (`research-portraits.md` 5.6).
- **Independent Captains: a deck, no state.** Their ordinal is the rank of their province in a
  permutation of province ids seeded by `hash32(seed, 'indep')`. The ordinal decodes in mixed
  radix into (helm 4, beard 8, head 6, scar 4) = 768 looks, with a seeded offset per game. The
  largest map has 126 captains, so no game repeats one. Independents never move, so the province
  is their identity.
- **Stable everywhere.** Commander ids are monotonic and saved; portraits never read
  `state.rng`. A reload, a lost WebGL context or a load from the save shows the same face.
  Replays, saves and the determinism test are untouched.
- **Pure composition.** `portraitSpec(input, size)` in `src/present/portrait/spec.ts` returns
  part ids, ramps, overlays, badges and frame; `portraitSvg(spec, parts)` builds an SVG string.
  `Portrait.tsx` (`src/ui/components/`) renders it inline and memoizes on `spec.key`;
  `src/render/portraits.ts` turns the same SVG into a cached Pixi texture for the replay docks,
  name cards and map tooltips.

```ts
// src/present/portrait/spec.ts (pure; guarded with src/present)
export interface PortraitInput {
  gameSeed: number;
  commanderId: CommanderId;
  unit: UnitTypeId;
  nationDef: NationDefId | null;            // null: Independents
  banner: string;
  allegiance: 'own' | 'other' | 'independent';
  hpFrac: number;
  pips: Pips; holy: number;
  roles: { pretender: boolean; prophet: boolean; scout: boolean; stealthy: boolean };
  starving: boolean; unpaid: boolean;
  gear: { count: number; bestTier: 0 | 1 | 2 | 3 };   // units design D.2; 0 = none
  headItem: ItemId | null;                  // its crown part, over the headgear
  guardTerrain: TerrainId | null;           // independents: the province they hold
  deckOrdinal: number | null;               // independents
  seen: 'live' | 'lastSeen' | 'dead';
}
export type PortraitSize = 16 | 24 | 28 | 40 | 48 | 64 | 96 | 128 | 256;
export function portraitSpec(input: PortraitInput, size: PortraitSize): PortraitSpec;
export function portraitSvg(spec: PortraitSpec, parts: PartLibrary): string;
```

### 5.5 Frames: allegiance by shape, rank by material

- **Shape follows the army token** (staged spec 2.10.4), so allegiance never relies on hue: own,
  round; other nations, round with 8 notches; independents, a plain rounded square.
- **Band:** a 3 px band in the owner's banner (independents #8C8A80) with a `keylineFor(banner)`
  keyline, so ownership shows at every size.
- **Rank by material and ornament** (`PORTRAIT_RANK[unit]`, content; R21):

  | Rank | Units | Frame |
  |---|---|---|
  | 0 | scouts | plain oak #8C6A47 |
  | 1 | priests, adepts, the Sapling Druid | bronze #8C6A43 with 4 square rivets |
  | 2 | Ash Chieftain, Warden Captain, Cinder Magus, Elder Druid | aged brass #B8914A with corner brackets |
  | God | the pretender | aged brass with a 1 px gilt highlight (#D4B26A), a crown notch at the top and the god's sigil in a corner (pretender B.7) |
  | Independent | Independent Captains | pewter #91A092 |
  | Bound | summoned commanders | elemental: ember-iron #4A4440 with a static ember seam (Salamander), living root #6B4A2B with leaves (Treant) |

- **The pip ring** (staged spec 2.8.2: one mana symbol per pip, "R6" past 6) sits on a 2 px
  `--chrome-0` ring outside any metal frame, so a mana symbol never touches brass or gilt (R20).
- **Badges:** at most 3 at once, by priority: role (pretender or prophet), wound, supply or pay,
  holy, gear.

### 5.6 State overlays (from existing state)

State never changes the face; a test checks that the face layers are identical with and without
each state.

| State | Source | 96 px and up | 48 to 72 px | 40 px and below |
|---|---|---|---|---|
| Wounded (HP at most 50%) | `hp`, the unit's max | a bandage across the brow | bandage | the cracked-heart corner glyph (docs/09) |
| Badly wounded (at most 25%) | same | blood, and the backdrop 20% darker | blood | the filled cracked heart |
| Starving | `starvedDays` | crossed-wheat corner glyph | glyph | glyph |
| Unpaid | the nation's unpaid counter | crossed-coin corner glyph | glyph | — |
| Prophet | `nation.prophetId` | a halo behind the head with a candle-flame rim | halo | a halo ring above the frame |
| Pretender | `nation.pretenderId` | the rig portrait, the crown badge, the god's frame; awakening overlays per B.8 (dormant: closed eyes; imprisoned: runic chains) | same | crown badge |
| Mage pips | `pips` | the pip ring; at 2 or more pips, an eye glint in the dominant color's accent (Ember #FFB347, Loam #A6D96A) | ring and glint | one dot of the dominant color |
| Holy | `holy` | the holy mark on the frame's foot | mark | dot |
| Scout, stealthy | unit tags | eye or hood badge (docs/09) | badge | badge |
| Gear | equipped items (units design D.2) | the **gear chip**: the count and the best tier's shape (○ ◆ ★) on the frame's lower right | chip | — |
| Head item | the equipped head item | its `crown` part over the headgear (D.9) | same | — |
| Out of sight (an enemy) | not in `visionOf` | the last-seen portrait, desaturated 70%, in a dotted frame (docs/09's fog pattern); a stealthy commander never shows | same | dotted ring |
| Dead (reports, history, victory screen) | the battle record or summary | greyscale with a black corner ribbon | same | — |
| Afflictions, renown (M2, units design) | new state | eyepatch, scars from anchors; renown stars | glyph | — |

Mana colors appear only on what carries them: the pips and a mage's eyes (docs/09).

### 5.7 Where portraits appear, and how large

| Surface | Size | Notes |
|---|---|---|
| Commander panel header | **96** with the pip ring | the staged spec says 64; leaders deserve faces |
| Bottom strip | 64 (76 with the ring) | a click opens the Commander panel (unchanged) |
| Outliner rows | 24 | the "portrait dot": head and headgear silhouette |
| Entity links in text and the feed | 16 | the head only |
| Commander and army hover tooltips | 48 | in the header |
| Province panel, Forces tab | 40 | own commanders and seen enemies |
| Battle report card, commanders' fates | 40 | the dead in greyscale with the ribbon |
| Replay docks, name cards, result card | 64, 128, 64 | the bust for national and independent commanders; pretenders and summons keep their rig portraits (5.9) |
| Codex unit pages | 128 | the seed `codex:<unitId>`, a type preview |
| Victory screen | 128 | the pretender and the three commanders with the most battles |
| Top bar nation button | 28 | the pretender (the mini portrait the staged spec names) |
| Pretender designer, `PretenderCard` | 256, 128 | B.8 |
| Fanned stack tokens (M1-should) | 20 | a dot above each fanned token |

**Level of detail:** 96 px and up, everything; 48 to 72 px, eyes become dots and fine strokes
drop; 40 px and below, the silhouette (backdrop, head, hair or headgear, beard), the frame and at
most one badge; 24 px and below, the head and headgear only.

### 5.8 Personal names (M1-should; R4)

- **Display:** the personal name, then the unit as a title: "Varo, Ash Chieftain". Pretenders
  keep `NationState.pretenderName` (pretender D7). Summoned commanders keep their unit's name
  ("the Salamander").
- **National commanders:** `assignNames(prev, state, seed)` (`src/present/names.ts`, pure). For
  each commander id in `state` without a name, in id order, it takes the next unused name from
  its nation's deck: `COMMANDER_NAMES[primaryColor]` shuffled by `hash32(seed, nationId,
  'names')`. When a deck runs out, names repeat with a numeral ("Varo II"). The game loop calls
  it after every simulated day; the UI block stores the result, so a name never changes, even
  after its bearer dies.
- **Independent Captains:** a name from `COMMANDER_NAMES.independent`, by the same province
  permutation as their portrait deck, with the province as a title: "Brannoc, Captain of Ashfen".
  Pure, nothing stored.
- **Content** (`src/content/presentation/names.ts`): at least 120 names per color, built in the
  pretender track's syllable style (B.6) but kept apart from god names. Ember: harsh and short
  (Varo, Kesh, Ondra, Dravik, Ulrek); Loam: soft (Ilsa, Bren, Maelor, Tamsin, Wyn); independents:
  plain (Brannoc, Hedda, Osric, Marta).
- **Messages:** sim message text keeps unit names ("Ash Chieftain recruited in Kharnath."). The
  feed renders a message's commander `refs` (staged spec) as a portrait dot and the name.
- **Tests:** the same commanders on the same days get the same names; no two living commanders of
  a nation share a name before the deck runs out; a save round trip keeps every name.

### 5.9 Harmony with the sibling tracks

- **Battle** (now `docs/12-battle-presentation.md` in the repository): two lines change (exact
  text in "Docs text"). S4.4's "Portraits for name cards and docks are the rig in its idle pose
  at 2×, on the banner color" and S6.2's "Portraits for name cards and docks come from the same
  SVG at 2×" both become the commander's portrait from docs/09 "Leader portraits", with
  pretenders and summoned commanders keeping their rig in its portrait pose. The roster
  component's image source changes in S6.1. The replay modal takes the oak and brass frame
  (2.8).
- **Pretender** (`pretender-design/final.md`): B.8 portraits are framed with the god's frame;
  their focus line follows the anchor grid (one line in B.8); C.4 marks change as R26 asks; the
  B.7 sigil sits on the god's frame corner, the band corner and the capital's pennant.
- **Units and items** (`units-items-design/final.md`): the gear chip on the frame (D.2); a head
  item's part drawn over the headgear (D.9); the artifact star on army tokens stays M2 (S3), with
  its corner reserved (R10).

### 5.10 The owner's raster layer (ChatGPT images)

- **Order of use** per (nation, unit):
  1. a complete raster set: at least 8 approved images (12 for each independent outfit), picked
     by rendezvous over the set's file ids with the same `seed:commanderId` key;
  2. the procedural bust;
  3. the archetype silhouette.

  Types never mix within one game: two Ash Chieftains must not look as if they came from
  different games. Pretenders keep their composed rig portrait.
- **State on raster faces is frame-only:** the halo or crown above the frame, the wound vignette
  and glyph, the pip ring, the rank frame, badges and the gear chip. A sidecar with hand-set
  `anchors: { eyeL, eyeR, crown }` may opt in to face overlays.
- **No banner wash in raster art.** A raster portrait serves every nation of its type, and a
  second Cinder Horde has another banner; the frame's band carries the banner.
- **Sizes:** generate 1024 × 1024. The intake keeps a 512 px master WebP outside the bundle
  (`art-source/portraits/`) and ships a 256 px WebP (≤ 24 KB) and a 64 px WebP (≤ 4 KB) in
  `src/assets/raster/portraits/<nationDef>/<unitId>/<nn>.webp`. Other sizes are downscaled from
  the 256 at load.
- **Inbox name:** `art-inbox/portraits/<nationDef>__<unitId>__<anything>.png`.
- **Intake** (`scripts/art-intake.ts`, Node, outside the pure folders; Phase 9):
  1. hash the original (SHA-256);
  2. find the face box from the luminance centroid and the eye line, and crop so the eye line
     lands at 39% and the crown near 9% (the owner confirms on the contact sheet);
  3. write the sizes;
  4. flag outliers against the set's median in mean luminance, warmth (R − B) and face-box
     position;
  5. flag an image whose 99th-percentile chroma is above C\* 45 outside the eyes (a mana-like
     glow);
  6. write `art-inbox/contact.html`: the set at 256, 64 and 24 px on oak and on `--chrome-0`;
  7. on the owner's approval, move the files and write the sidecar.
- **Sidecar** `<nn>.json`: source file name and the original's SHA-256; tool and model as
  ChatGPT shows them; date; the full prompt and edits; whether C2PA metadata was present
  (ChatGPT images carry it, WebP conversion drops it); the approver.
- **Manifest:** `src/assets/raster/manifest.ts` lists each set with its count; content validation
  fails on a missing size or sidecar. An incomplete or invalid set is ignored whole.
- **Provenance:** prompts alone may not be protected by copyright in the US
  (`research-portraits.md` 6.7). The procedural system, frames and overlays stay the game's own
  identity, and the sidecars answer a store's AI-content questions.

### 5.11 Tests

- `tests/present/portrait/spec.test.ts`:
  - the same input gives the same spec and SVG; different commander ids differ in at least one
    salient slot for at least 90% of 100 pairs;
  - adding one part to a slot changes at most 1/(n + 1) + 3% of 1,000 seeded picks;
  - Independent Captains on Medium seeds 1 to 5 never share a salient look;
  - state (HP, roles, starving, gear, head item) never changes the face parts, only overlays,
    badges, the crown part and the frame;
  - at 40 px the spec holds no `data-lod="portrait"` part and at most one badge;
  - the pip ring always has its separation ring.
- `tests/content/portraits.test.ts`: every commander unit of every nation has a pool or a rig
  portrait; every pool id exists; part tables are append-only; every raster set has both sizes
  and a sidecar, or is ignored.
- `tests/ui/derive/fog.test.ts`: an out-of-sight commander's portrait uses its last-seen state
  and never reveals its HP.
- UI smoke test (cheap): `Portrait` renders at each size.

---

## 6. Asset production

### 6.1 Inventory

"Code" is drawn in code (TypeScript paths, SVG strings, Pixi `Graphics`) from content data,
seeded where it varies. "SVG" is a small authored file in Phase 11 that replaces a code path
through the same interface, as the battle rigs do. "Owner" is generated by the owner in ChatGPT
and taken in through `art-inbox/` (prompts in "Art prompt pack"). "Later" is after M1.

| Asset | Count | M1 source | Upgrade | Phase | Budget | Fallback |
|---|---|---|---|---|---|---|
| Wild grounds, contour, rim, peak massif, mere ripples, reeds, snags | 2 kinds, about 10 shapes | Code | SVG peaks (11) | **8** | atlas | none (gameplay) |
| Wild name syllables | 2 sets | content | — | 1b | — | — |
| Passable Mountains' snowless peaks and footpath | 2 | Code | — | **8** | — | — |
| Oak top tile with seams, nails, iron straps, knife marks, tankard ring | 1 tile, 4 corners | Code | **Owner** A1 (M1-should) | **8** | 1024²; owner WebP ≤ 250 KB | Code |
| Cloth: linen, hem, square tacks, contact shadow | 1 | Code | — | **8** | — | — |
| Cartouche, compass rose | 2 | Code | SVG | 9 | — | none drawn |
| Tavern floor, top-down, with hearth, window, rug, bench, barrel, stool, hound | 1 | Code | **Owner** A2 summer (M1-should), A3 winter (M1-should) | 9 | ≤ 1536 × 1024 WebP ≤ 400 KB each | Code |
| Season tints and frost | 4 | Code | — | 12 (M1-should) | — | summer look |
| Props: month candle, hourglass, inkpot and quill, dividers, tankard, dice, bread board, letter, spare tokens | 9 | Code (vector atlas) | SVG | candle and hourglass 12, the rest 9 (all M1-should) | atlas 1024² | none drawn |
| Ambience: candle and hearth glow, motes | 3 | Code | — | 12 (M1-should) | — | static |
| Chrome hardware: oak bevels and frames, brass keylines, brackets, tacks, leather spines | CSS and inline SVG | Code | — | 9 (action keyline in 8) | — | flat tokens |
| Parchment report card and Codex pages | 2 surfaces | CSS | — | 9 (M1-should, owner A/B) | — | dark |
| Ground textures | 7 | Code | — | 11 | 7 pattern tiles 256² | flat fill |
| Terrain standing stamps and Far masses | about 25 shapes | Code | SVG atlas | 11 | one 2048² atlas | flat fill |
| Fog line art | the same shapes, stroked | Code | — | 11 | — | dotted border only |
| Settlement kits (Cinder, Thornwood, independents): 3 houses, hall, temple, lab, keep, walls (4 stages), tower, scaffold | 3 × 12 | Code | SVG | 11 | atlas | the independents' kit with a banner pennant |
| `COLOR_KITS` for W, U, B | 3 × 12 | — | — | Later (M2 nations) | — | — |
| Land-look motifs, Cinder and Thornwood (3 levels and a landmark) | 2 × 7 | SVG | — | 11 | atlas | the wash alone |
| Scale-pole motifs | 10 × 2 or 3 | SVG | — | 11 | atlas | none |
| Battle scars, unrest marks | 6 | Code | SVG | 11 | — | the staged marker and glyphs |
| Siege camp, wall states, pillage smoke, Wellspring monument and claim stones | 8 | Code | SVG | **8** (siege, Wellspring), 11 (the rest) | — | the staged glyphs |
| Ritual marks | pretender C.4 | that track | — | that track | — | badges |
| Army tokens (wood, pewter) and path tacks | 3 shapes, 2 materials | Code | — | **8** | — | today's badge |
| Standees | one per rig | the battle `PartSet`, idle pose | — | 11 (M1-should) | — | token only |
| Portrait parts v0 (code paths) | about 40 | Code | — | **8** | — | archetype silhouette |
| Portrait part library, overlays, frames | about 116 + 12 + ornaments | SVG | — | 11 | about 130 small files | v0 |
| Raster portrait sets | 8 per (nation, unit); first 4 types | **Owner** P0 to P4 | more types | M1-should; Later for the rest | 256 px ≤ 24 KB + 64 px ≤ 4 KB each; all rasters ≤ 2 MB in the bundle | procedural bust |
| Ambient tavern sound | — | — | — | Later (M2) | — | — |

Every SVG and code stamp passes one content test: it has an ink outline and a face, uses only
palette-derived tones, stays inside its declared box, and is not a reserved pattern (3.2). The
art adds about 130 small SVGs in Phase 11 to the battle and pretender tracks' 171.

### 6.2 Rules for owner-made images

- **Palette:** oak #B08A5E, #8F7459, #715636, #5E4630, #3E2E20; pewter #91A092; linen #E8DCC2;
  forged iron #4A4744; aged brass only on small hardware. No large areas of saturated red,
  orange, green, blue or violet, because mana colors and banners carry identity. Firelight is
  light, not paint. Oak is tawny grey-gold, never orange.
- **Nothing that competes with the map:** no text, letters, numbers, signatures, logos, frames
  or borders. No people or faces in the room art.
- **No names** of artists, studios, games, real people or insignia in any prompt.
- **One anchor per family.** The first approved image of a family (table, room, portraits) is
  attached as "Image 1: style reference" to every later prompt in that family, with the
  preserve list repeated.
- **Workflow:** generate, download the PNG, drop it into `art-inbox/<kind>/` with the file name
  the pack gives, run `npm run art:intake`, approve on the contact sheet. The intake checks
  size, tileability (tiles), lightness and chroma, writes the sidecar, and refuses what fails
  (it never edits pixels beyond crop and resize).

### 6.3 Prompts

The exact prompts, sizes, file names and landing paths are in "Art prompt pack" below.

---

## 7. Milestone placement

### 7.1 Phase by phase

| When | What | Exit |
|---|---|---|
| **Now** (task #29) | Send the owner prompts A1 (oak tile), A2 (summer floor) and P0 (portrait style anchor). Nothing waits for the answers | — |
| **Phase 1b, commit A** (any time; Phase 7 has merged) | `wilds.ts`, the optional `MapGenParams.wilds`, `MapData.wilds = []`, the next `STATE_VERSION` with its `migrate.ts` entry, the validations, the tests | the bit-identity test is green; no fixture moves |
| **Phase 1b, commit B** (after A and the owner's approval) | wilds on in New Game and `sim:aivai`; `balanceCandidates` 10; fixtures re-pinned; 20 AI games re-measured; docs/01, 09-balance, 10 | 20 AI games finish on wild maps; the matchup row is recorded |
| **Phase 8** (time box: at most about a quarter of Phase 8's diff for the items in this row) | the **Simple table** (procedural oak with straps and nails, cloth, hem, square tacks, contact shadow); the **camera** (start zoom with the 32 px band, lean back, pan clamp, detent, `Z` and the Fit button); the three map layers (fill live, the decoration layer's bake hook, always-on); **wild art** (grounds, contour, rim, massif and mere stamps, names, hover card, ✕ cursor, "around the X", the no-path reason); the passable Mountains' footpath; siege camp and wall states; the Wellspring monument and claim; **painted tokens** and brass-tack paths; the lifted mode base and data ramp; **portrait v0** (code-path busts with allegiance frames, rank materials, the band and the pip ring's separation ring) in the strip, outliner, Commander panel and tooltips; the brass action keyline | playable with flat fills. Tests: palette (wild grounds, banners, mode colors), the label test with wild labels and token boxes, the fog guard over `mapLook` and portraits |
| **Phase 9** | chrome hardware (oak bevels and frames, brass keylines and brackets, leather spines); the **Full table** (procedural room, hearth and window light, candle pool, rim vignette); Settings → Table and Map detail; portrait state overlays, badges and the gear chip; portraits in report cards; **`scripts/art-intake.ts`** and the raster manifest; M1-should: static props, personal names, the parchment A/B surfaces if the owner chose them | contrast tests for the new tokens; the intake runs on a sample |
| **Phase 10** | busts in the replay docks, name cards and result card (the battle S4.4 line); the replay modal's oak and brass frame | — |
| **Phase 11** (shares Phase 11's time budget with the unit SVGs) | ground textures, standing stamps and Far masses with level of detail and box exclusion; fog line art; settlements (tiers, thriving and declining, walls, landmarks, scaffolds, the unlit brazier, 3 kits); land looks (washes, motifs, landmarks) and pole motifs at Mid and Near; battle scars, unrest marks, pillage smoke; the reload-stable slow keys and the 600 ms cross-fade; the portrait SVG library; M1-should: standees at Near | calm and reload tests; the label test with stamps, settlements and standees; the reserved-pattern test |
| **Phase 12** | performance pass on Large with 4 nations; tuning densities and thresholds in play; re-run the docs/09-balance checklist on wild maps; M1-should: the month candle and hourglass, ambience, season light, the brush wipe, owner raster sets that arrived complete | docs/06's frame budget with Table Full and Map detail Full |

### 7.2 M1, M1-should, Later

**M1 (the floor; never cut):**
- wilds: the rule, mapgen, validation, art, hover and orders;
- the Simple table with the oak band, the camera, lean back, and the Full table's procedural room;
- tokens in wood and pewter; brass-tack paths;
- terrain detail with level of detail (at least Forest, Hills and Mountains stamps; every
  terrain's Far mass and fog line art);
- settlements by tier with walls by PD, buildings, scaffolds and the siege and Wellspring states;
- both nations' land looks (wash and at least 2 motifs per level and the landmark) and pole motifs
  at Mid;
- decoration out of data modes, the lifted mode base and ramp, the fog caps;
- reload-stable slow looks with the cross-fade;
- procedural portraits for every commander, with allegiance frames, rank materials, state
  overlays and the gear chip;
- chrome hardware, Table and Map detail settings, reduced motion.

**M1-should (cut in this order, first cut first, without a new discussion):**
1. season light in the room;
2. ambience (candles, hearth, motes);
3. the hourglass and the static props (the month candle last);
4. the brush wipe (the cross-fade stays);
5. standees at Near and the cloaked figure;
6. pole motifs at Near (Mid stays);
7. battle scars;
8. personal names;
9. the parchment surfaces;
10. raster integration (only if the intake is late; the intake script and the prompts start
    early, R29).

**Later (M2 and on):** ridges, passes that open and close, fliers over ridges, chasms; roads and
tunnels; ambient tavern sound; interactive props and a tavern that changes over a campaign;
painted noisy borders; curved wild names; W, U and B motif families and kits as playable
nations arrive; `dominionSince`; seasonal stamps; escort figures; afflictions, renown and
weathering on portraits; the artifact star on tokens; raster portraits for every type; spring
and autumn room art.

### 7.3 Acceptance criteria to change (`docs/10-milestone-1.md`)

The battle, pretender and units tracks also amend these; the text below adds to theirs (exact
blocks in "Docs text"):
- **3. Map:** wild ranges, no single province as the only way through, and no wild within 2
  provinces of a capital.
- **4. Time:** art never changes the state.
- **14. Art:** seeded portraits; terrain detail, settlements, impassable terrain and land looks.
- **New 16. The war table.**
- **Out of scope:** "sound outside battle replays (map and tavern ambience, menus, UI)".

### 7.4 Scope guard: the art pass never stalls the playable game

1. **Rules first, art after play.** Phase 1b and Phase 8's wild art come first, because they
   change what players can do. Phase 8 exits playable with flat fills and the Simple table; that
   is when "This is the first point where the game is playable by a human. Play it." applies.
2. **The time box.** The Phase 8 table and detail items take at most about a quarter of Phase 8's
   diff. What is not done moves to Phase 11 and is noted in `docs/PROGRESS.md`.
3. **One budget in Phase 11.** The map art shares Phase 11's time with the unit SVGs. Past it, the
   cut order in 7.2 applies.
4. **Every decorative layer has an Off path,** which is also the path the tests take. A layer that
   breaks a frame budget, the label test or the palette test is switched off, never allowed to
   block a merge.
5. **No art work touches `src/sim`, `src/mapgen` (after Phase 1b) or `src/ai`.** The purity test
   enforces it, so art bugs cannot change outcomes.
6. **Owner rasters are never on the critical path.** Every raster has a procedural fallback that
   ships first; a set lands only when complete.
7. **A performance gate.** If the first 120 frames average under 50 fps, a Hint suggests "Map
   detail: Reduced". Phase 12 fixes any machine class that Reduced does not bring to 60.
8. **No new sim state.** Everything derives; presentation state lives in the UI block.

### 7.5 Open questions for the owner (defaults in bold; the build follows the defaults)

1. **Impassable terrain as specified** (1.9's question): massifs and meres, about 9% of the map,
   never near a capital, always a way around; ridges in M2. **Approve.**
2. **Table default: Full** (room, props, ambience) from Phase 9.
3. **Commander panel portrait at 96 px** (the staged spec has 64).
4. **Personal names** ("Varo, Ash Chieftain"): **yes, M1-should.**
5. **First raster portrait sets: Ash Chieftain, Warden Captain, Pyre Priest, Grove Priest.**
6. **Parchment** on the battle report card and Codex pages: **decide from the mockup's A/B**;
   without an answer, the approved dark surfaces stay.
7. **Portraits face screen right everywhere** (mirroring in the replay's right dock would flip
   asymmetric marks).

---

## Docs text

Each block names its target file, where it goes, and its exact text. docs/07 and docs/09-art are
edited **relative to the staged copies** in `/home/user/fm-docs/docs/`. docs/01, 06, 09-balance
and 10 are edited relative to the repository at `7a524b8`; the staged docs/01 adds only
the Incursions bullet in §14, which these blocks do not touch. Blocks land in the commit that
implements them: docs/01, the map rows of docs/09-balance and docs/10's Phase 1b with commit B;
the rest with Phases 8 to 12 as section 7 places them.

### `docs/01-core-rules.md`

**1. §2 "The map": add after the bullet "Seas are out of scope for M1. The generator produces a
landlocked map."**

```markdown
- **Impassable terrain (wilds).** Some of the map is wild: named mountain massifs (peaks) and
  dark lakes (meres). A wild is not a province. No one owns, enters, crosses or targets it. Two
  provinces are neighbors only where their own borders meet, so a wild between them blocks
  movement, retreat, sight, dominion spread and ritual reach alike, and everything counted in
  provinces is counted around it. Every province can still reach every other, no single province
  is the only way through, and no wild lies within 2 provinces of a capital.
```

**2. Implementation decisions, "Map generation (Phase 1)": replace the "Adjacency" bullet with:**

```markdown
- **Adjacency**: two provinces are neighbors exactly when their borders share a segment;
  cells that meet at a single point are not, and a border with a wild makes no neighbor. The
  drawn map and the graph always agree.
```

**3. Same group: replace the "Terrain" bullet with:**

```markdown
- **Terrain** is assigned by rank from simplex-noise elevation and moisture over the provinces
  (wilds are not provinces and take no terrain), so every map has exactly the terrain shares in
  `TERRAIN_SHARES`, capitals included.
```

**4. Add a group after "Map generation (Phase 1)" (after its "Starting population" bullet):**

```markdown
**Wilds (Phase 1b)**

Added on 2026-10-21 by the project owner's decision: "i want to make sure the maps have some
impassible terrain that is noticeable".
- **Count and kinds.** A map has `round(provinces / 20)` wild ranges (Small 2, Medium 3, Large 4;
  6 on Medium with 4 nations). Their kinds cycle peaks, mere, peaks. A peak range has 1, 2 or 3
  cells (weights 25, 50, 25), a mere 1 or 2 (weights 60, 40). Wild cells are extra Voronoi cells
  beyond the province count, so the count stays exact and the map grows to keep each province's
  area.
- **Placement.** Capitals are placed first, on every cell. Peak ranges then start at the
  highest-elevation eligible cell and grow into their highest eligible neighbors; meres do the
  same by moisture minus elevation. A range that cannot reach its size tries the next seed, up to
  12; an attempt that cannot place a range is retried like any failed attempt.
- **Eligible cells.** A wild cell has no vertex on the map's edge, is at least 3 cells from every
  capital, and is at least 3 cells from every other range, so no province borders two ranges.
  Removing it must leave the provinces connected, each with at least 2 neighbors, with no single
  province as the only way between two parts of the map, and with the provinces around every
  range at most 6 steps apart.
- **Everything else on the provinces.** Terrain, Wellsprings and their fairness, springs, names,
  starting population, capital distance and independent strength are placed and checked on the
  provinces that remain, as before. Each capital's 2-hop neighborhood keeps the provinces it would
  have without wilds. The balance search takes up to 10 valid maps.
- **Data.** Wilds live in `MapData.wilds` with their own ids (`w0`, `w1`, ...), never from the
  game's counter. They are never provinces and never in `neighbors`, so movement, retreat, sight,
  dominion spread, ritual reach, fort materials and the AI respect them with no rule of their
  own. Wilds are terrain: every nation sees them, with their names.
- `MapGenParams.wilds: false` reproduces the earlier maps exactly.
- **Not in M1:** impassable borders between provinces (ridges) with passes that open or close,
  fliers, chasms, roads and tunnels.
```

### `docs/09-art-direction.md` (relative to the staged copy)

**1. "Color palettes": replace the sentence "The map background is a deep parchment #E8DCC2 at the
edges fading to #1C1A17 under the UI." with:**

```markdown
The map is painted on a linen cloth (#E8DCC2) that lies on an oak war table (see "The war
table"). No light, grade or vignette ever falls on the cloth, so the colors tested below are the
colors drawn.
```

**2. "Distinct colors": replace "Every pair of terrain fills, and every pair of mana primaries"
with:**

```markdown
Every pair of terrain fills (the wild grounds included), and every pair of mana primaries
```

**3. Add a paragraph after the "Ownership bands" paragraph:**

```markdown
**Map states.** `tests/content/palette.test.ts` also covers what the map draws over the fills:
- each nation's land-look wash at its cap, against every other terrain unwashed, washed by the
  same nation and washed by another (Cinder Horde ash #8F8C88 at most 10%, Thornwood moss
  #5E7F45 at most 6%);
- fog together with land looks: unexplored provinces take a 4% linen haze and no land look; out
  of sight ones are desaturated 10% with the wash hidden;
- the wild grounds (granite #2A292C, water #24222A) against every fill, every banner and every
  map-mode color, directly or, by the band rule above, through their light rim #E9E4D8;
- map modes tint over the fill desaturated 80% and lifted to L* 50 or lighter, and data ramps
  start at L* 40, so every M1 mode color stays distinct from the wild grounds.
```

**4. "Sprite system": replace the bullet "- Portraits for commanders are the same SVG cropped at 2x
with a colored backdrop." with:**

```markdown
- Commanders have portraits of their own; see "Leader portraits". Pretenders and summoned
  commanders use their rig in its portrait pose.
```

**5. "Animation": add these rows to the table:**

```markdown
| Idle (map) | none: tokens and standees stand still on the map; the walk bob above stays |
| Map repaint | a 600 ms cross-fade over a province whose slow look changed; at most 8 at a month end, the rest instant |
| Table ambience | candle flames ±3% brightness at 0.7 to 1.3 Hz; the hearth ±4% over 7 s; at most 12 dust motes drifting 2 to 4 px/s in the window light, never over the cloth |
```

**6. "Icons": in the "Map" row, after "selection ring", add:**

```markdown
; wild (three snow-capped peaks over a row of cliff ticks); path tack (a square set as a diamond)
```

**7. "UI chrome": replace its first paragraph with:**

```markdown
The chrome stays dark and neutral so the map and the mana colors carry identity. It is framed in
the war table's materials: oak frames, aged brass hardware and leather book spines around flat
panel bodies. Mana colors never decorate chrome. They appear only on things that carry that
color.
```

**8. "UI chrome": in the token table, replace the `--keyline` row and add rows after
`--focus`:**

```markdown
| `--keyline` | 1 px `--text` at 25% | panel edges (action buttons use `--brass`) |
| `--oak-0` | #2B231C | bevels, frames and spines: the top bar, the strip, the docks' map edge, modals |
| `--oak-grain` | #3A2E23 | grain lines inside frames only, at most 1 px and 20% coverage |
| `--brass` | #B8914A | 1 px keylines on action buttons (4.62:1 on `--chrome-2`), the top bar, the docks' map edge and modal frames; 14 px corner brackets; square tacks and rivets |
| `--brass-hi` | #D4B26A | a 1 px highlight on brackets and tacks only |
| `--leather` | #4A3426 | 10 px spines of the Codex and Ledger; never under text |
| `--parchment` / `--ink` | #E8DCC2 / #1C1A17 | the battle report card and Codex article pages when the parchment option is on; ink at 70% for dim text (5.53:1) |
| `--warm-ink` / `--cool-ink` | #8A4A12 / #2F5D73 | ▲ and ▼ deltas on parchment (5.03:1, 5.26:1) |
```

**9. "UI chrome": in the "Buttons" bullet, replace "filled `--chrome-2` with a keyline" with:**

```markdown
filled `--chrome-2` with a 1 px `--brass` keyline
```

**10. "UI chrome": add after the "Cards" bullet:**

```markdown
- **Materials:** oak grain appears only in frames and bevels, never behind text, numbers or
  icons. Brass marks action buttons, the top bar's bottom edge, the docks' map edge and modal
  frames (1 px keylines), modal and dock corners (14 px L brackets with square tacks), and is
  never round. Brass never touches a mana symbol: at least 2 px of chrome lie between them, and a
  portrait's pip ring sits on a 2 px `--chrome-0` ring outside its frame. Leather is only for book
  spines. Parchment surfaces carry ink text, and a mana symbol on parchment takes a 1 px ink ring.
  Tooltips, rows and cards keep the tokens above with no texture.
```

**11. "UI chrome": append to the "Patterns" bullet:**

```markdown
 No map art, texture or ornament uses these patterns; a content test checks every texture's line
angles and coverage.
```

**12. "UI chrome": replace the "Motion" bullet with:**

```markdown
- **Motion:** panels appear without sliding. An Urgent alert pulses twice when it appears.
  Reduced motion removes the pulse, the idle bob, every UI tween and the table's ambience
  (candles and hearth freeze at their mean, dust motes are removed), and makes map repaints and
  zoom steps instant.
```

**13. Add these five sections after "UI chrome" (before "Pretender chassis art"):**

```markdown
## The war table

Added on 2026-10-21 at the owner's direction: "the overall map should be on an rustic wartable
in a cozy but natural tavern, nice oak wood".
- **The scene,** seen straight from above in one projection: the map is a painted linen cloth
  with a leather hem, pinned by four square brass tacks to an oiled, quarter-sawn white oak table
  in a village tavern. The camera never tilts; depth is painted, never simulated.
- **Oak:** tawny grey-gold, straight grain left to right, silvery ray fleck, darker end grain: lit
  #B08A5E, body #8F7459, grain #715636, shade #5E4630, edge #3E2E20. Never an orange stain.
  Rustic: three planks with square nail heads, forged iron corner straps (#4A4744), a few knife
  marks, a faint tankard ring, a worn rim.
- **The cloth** (#E8DCC2) has a 26-unit margin with the map's name in a cartouche and a compass
  rose, a leather hem (#3E2E20) and a soft contact shadow on the oak.
- **The room** around the table, from above: oak floorboards, a hearth's glow from the west, a
  window's daylight to the east, a wool rug, a bench with a folded cloak, a barrel, a stool, a
  hound asleep on the rug. No people, no text, no saturated colors beyond the hearth's small
  glow. The room may follow the seasons (winter months 11 to 2: a cooler window and a brighter
  hearth).
- **Light** falls on the room and the oak only: the hearth's warm gradient on the table's west rim,
  the candle's pool, a vignette toward the rim. The cloth is lit by neutral daylight and nothing
  grades it.
- **Props** stand in the table margin, never on the cloth, and do nothing when clicked: a month
  candle that burns down as the month passes, an hourglass that runs at the game's speed and lies
  on its side while paused, an inkpot and quill, brass dividers, a pewter tankard, dice, a bread
  board, a sealed letter, spare wooden tokens. A prop only mirrors what the chrome shows.
- **The camera** starts with the cloth inside a 32 px band of oak and leans back until the whole
  table and the tavern floor show.
- **Settings:** Table Full (room, table, props, ambience), Simple (oak and cloth only), Off (a
  plain dark surround).

## The painted map

- **Three layers.** A live fill layer (terrain fill, noise, and the land-look wash, or a mode's
  fill); a decoration layer baked per zoom band (ground textures, stamps, settlements, motifs,
  scars); an always-on layer (wilds, borders, bands, ritual, siege and pillage marks,
  Wellsprings).
- **Ground textures** are flat lightness changes within ±8% L* of the fill (±4% inside label,
  token and seat boxes): grass stipple and hedgerows, a field patchwork with furrows at 0°, 90°
  or ±30°, a canopy scallop, hachures on the hills' shadow side, scree, short water streaks, a
  crack network.
- **Standing stamps** (trees, humps, peaks, reeds, rocks) take faces from the fill's lightness (+12%
  and −18% L*) with a 1 px ink outline. They stay out of label, token and seat boxes, inset from
  the border, drawn nearest last, and cover at most 60% of a province at Mid and 75% at Near.
  Their places are seeded by the game seed and the province, so they never change between
  reloads; zooming in only adds stamps.
- **Level of detail:** Far shows 2 to 4 relief masses per province for every terrain, Mid up to
  30 stamps, Near up to 60. Information never thins.
- **Modes:** in every mode but Ownership the decoration layer fades out; the always-on layer
  stays.
- **Fog** is "not yet painted": unexplored land shows its terrain stamps as line art under a light
  haze, with a dotted border and only a sketched hut at the seat; land out of sight is painted
  but faded. Every terrain keeps a silhouette, Far included.
- **Tokens** are painted wood (nations) or pewter (independents) with a contact shadow; count
  plates stay flat. At Near the lead commander's standee may stand on its token. Path previews are
  a light thread with square brass tacks.

## Impassable terrain

Wilds are the darkest grounds on the map, so they read at every zoom, in every mode and for every
kind of color vision.
- **Peaks:** granite #2A292C under a massif of snow-capped peaks that fills the cell and may rise
  10% above it (lit faces #8A857E, flat shadow faces, snow #F2EEE6). Snow means impassable:
  passable Mountains keep small snowless peaks and a dashed footpath (#2B2620 at 75%).
- **Meres:** still water #24222A with a lighter shore band, pale ripples #8FC3D3, reeds and
  bone-white snags.
- **Every wild** has a 3 px ink contour on its outline and a light rim #E9E4D8 inside it (cliff
  ticks on peaks, a shore keyline on meres), and a name in italic, letter-spaced #E9E4D8.
- Wilds are never tinted, faded, hatched, dimmed or fogged.

## Growth and alignment on the map

The map changes as the game goes on, from state the simulation already keeps.
- **Settlements** grow by population in the Population mode's five steps (1 to 22 houses, added
  outward on a spiral, never reshuffled), with fresh roofs when a province has grown a quarter
  past its start and ruins when it has fallen a fifth below. Walls follow PD (a watchtower, a
  palisade, a stone wall, towers and a gatehouse); the keep, temple and lab are landmarks;
  construction shows scaffolding; a temple under another nation's dominion has an unlit brazier.
  The owner's architecture builds them: Cinder Horde soot roofs, ash walls and ember windows;
  Thornwood living roofs and timber; independents' fieldstone and thatch.
- **Land looks.** The dominating nation's god repaints the land by dominion strength: a ground
  wash capped by the palette test and the nation's motifs nearest the settlement first, with a
  landmark from strength 7 (Cinder Horde ash, cairns, charred trees, the burning cairn; Thornwood
  blossom, saplings, mossy stones, the elder tree). A nation without its own look takes its
  color's.
- **Scale poles** add their motifs per effective step (Order hedgerows, Turmoil broken fences,
  Lore standing stones, Fury war cairns, Growth fruit trees, Rot dead trees, Wild briars,
  Artifice mills, Sanctity wayshrines, Dread gibbets).
- **Events:** siege camps and walls cracked, breached or fallen; pillage smoke; unrest shutters
  and barricades; battle scars that turn to cairns and heal within a year; ritual marks while
  their effects last; the Wellspring monument and its claim stones.
- **Calm:** slow looks change at most once a month and are saved with the game, so a reload shows
  the same map; events show the day they happen. A change cross-fades over 600 ms. Nothing
  covers labels, bands, tokens or glyphs.

## Leader portraits

Added on 2026-10-21 at the owner's direction: "leaders certainly need portraits".
- **Every commander** has a portrait: a head-and-shoulders bust built from SVG parts for national
  commanders and independent captains, the rig's portrait pose for pretenders and summoned
  commanders, the fort emblem for a garrison holder.
- **One anchor grid** of 256 units for busts, rig portrait poses and raster portraits: the crown
  at 9%, the eye line at 39%, the chin at 66%, the collar at 78%, three-quarter view facing screen
  right.
- **Identity:** the game seed and the commander id pick every part, each by its own key, by
  rendezvous over append-only part lists, so a face never changes on reload and an art update
  keeps most faces. Independent captains draw from a no-repeat deck keyed by their province.
  Commanders carry personal names, shown as "Varo, Ash Chieftain".
- **State never changes the face.** It adds overlays (a bandage below half HP, blood below a
  quarter, the prophet's halo, the pretender's crown, a mage's eye glint, a head item over the
  headgear) and frame marks (the pip ring, the holy mark, status glyphs, the gear count and best
  tier, a dotted frame for last seen, greyscale for the dead).
- **Frames:** the shape follows the army token (round own, notched other nations, rounded square
  independents), with a band in the banner; the material shows rank: oak, bronze, aged brass, the
  god's brass with a crown notch, pewter for independents, elemental for summons. The pip ring
  sits on a dark ring outside the frame.
- **Sizes:** 256 and 128 (designer, card, name cards, Codex), 96 (Commander panel), 64 (strip,
  replay docks), 48 (tooltips), 40 (report cards, Forces), 24 (outliner), 16 (links). Below 48
  px only the silhouette, the frame and one badge are drawn.
- **Owner-made raster portraits** replace a type's procedural busts only as a complete set of 8 or
  more approved images, picked by the same seed; state then shows on the frame only.
```

**14. "Delivery rule": append:**

```markdown
Raster art made by the project owner (the oak tile, the tavern floor, portraits) is optional. It
arrives in `art-inbox/`, passes `scripts/art-intake.ts` (crop, sizes, checks, a provenance
sidecar per image, a contact sheet for approval) and lands in `src/assets/raster/` with a
manifest entry; masters stay outside the bundle in `art-source/`. Rasters in the bundle total at
most 2 MB. A portrait set is used only when complete; the procedural art is always the fallback.
```

### `docs/07-ui.md` (relative to the staged copy)

**1. "## Map" → "### Drawing": replace the whole subsection with:**

```markdown
### Drawing
- The map is a painted linen cloth on an oak war table in a tavern (docs/09 "The war table"). No
  light ever falls on the cloth; the table and the room carry the mood.
- Provinces are filled polygons: terrain color with a subtle noise texture and a 2 px border,
  painted with ground textures, terrain stamps, settlements and land looks (docs/09 "The painted
  map", "Growth and alignment on the map").
- The owner's banner forms an inner band with a keyline (docs/09). Independents have none.
- Wilds (impassable peaks and meres) are dark regions with a light rim and a name (docs/09
  "Impassable terrain"). They are not provinces.
- Draw order from the bottom: room, table, props, cloth; the fill layer (fills, noise, land-look
  washes or mode fills); the decoration layer (ground textures, stamps, settlements, motifs,
  scars); the always-on layer (wilds, borders, bands, ritual marks, siege and pillage marks,
  Wellsprings); mode overlays, labels, numbers chips, paths, army tokens, transit arrows,
  selection rings, battle markers; table ambience over the room and the oak only.
- The province tooltip and cursor label are DOM placed from Pixi coordinates.
```

**2. "### Modes": replace the "How a mode draws" bullet with:**

```markdown
- **How a mode draws:** it tints fills only, over the terrain fill desaturated and lifted to L*
  50 or lighter, so borders, bands, badges and labels stay at full contrast. Each mode has a
  second channel besides hue: wheat glyphs, hatch density, candle numbers, spring symbols. Data
  ramps start at L* 40.
- **Decoration steps aside:** in every mode but Ownership the decoration layer (ground textures,
  stamps, settlements, motifs, scars) fades out, so the mode tints a plain fill. Wilds, ritual
  marks, siege and pillage marks and Wellsprings stay. No mode, contextual mode or numbers layer
  tints, dims or hatches a wild. In Dominion mode an undominated province shows its desaturated
  terrain, never a flat grey.
```

**3. "### Labels and the density budget": add at the end:**

```markdown
- **Wild names** (one per range, unique) are labels too, with priority after Wellsprings, and take
  part in the overlap test.
- **Stamps and labels:** no standing stamp, house, motif or landmark lies in a label, token or seat
  box (plus 4 px); ground textures under those boxes drop to ±4% lightness. Standing stamps cover
  at most 60% of a province at Mid and 75% at Near. The label density test checks all of them.
```

**4. "### Army badges": add:**

```markdown
- **Material:** nation tokens read as painted wood and independents as pewter, with a fixed
  contact shadow; numbers stay on flat plates. At Near zoom the lead commander's standee may
  stand on the token (the badge box grows to hold it).
```

**5. "### Moving": add:**

```markdown
- **Wilds:** paths go around them, and the label adds "around the Ashspine" when the straight
  line to the target crosses one. Over a wild the cursor shows ✕ and "Impassable: the Ashspine";
  right-click does nothing there. When no path exists, the reason names the wild and the hostile
  province that closes the way around: "No path: the Ashspine blocks the way, and the way around
  crosses hostile Velmere."
- **Path previews** are a light thread with square brass tacks at each day mark.
```

**6. "### Province tooltip and engagement preview": add:**

```markdown
- **Wilds** have a small card: name, kind, "Impassable", the rule in one sentence, and the
  provinces it borders as links. A province's card lists the wilds it borders.
```

**7. "### Fog": replace the subsection with:**

```markdown
### Fog
- **Unexplored provinces:** "not yet painted": the fill under a light linen haze, terrain stamps
  as line-art silhouettes, a dotted border, and only a sketched hut at the seat (population
  unknown).
- **Out of sight:** painted but faded: a slightly desaturated fill and a dotted border; the
  settlement shows what the view allows.
- **Wilds** are terrain and are never fogged.
- **Fogged values** read "unknown" or a strength word, never 0. Map art and portraits use the
  same view of a province as its tooltip, so they never show more than it does.
```

**8. Add after "### Fog":**

```markdown
### The table and the camera
- The game starts with the cloth fitted to the unobscured area inside a 32 px band of oak.
  Zooming out leans back to 0.75 of the scale that fits the whole table, showing the table, its
  props and the tavern floor; zooming in pushes the table off screen.
- A wheel stop within 8% of the start zoom settles on it. `Z`, or the Fit button at the top of
  the mode column, returns there.
- Panning keeps the view's center over the table.
- Props are inert: the cursor pans through them, and a click on the table or a prop clears the
  selection.
- `H` hides the chrome and leaves the table in view.
```

**9. "## Commander panel and Battle Plan": replace "**Header:** portrait with a pip ring," with:**

```markdown
**Header:** a 96 px portrait (docs/09 "Leader portraits") with a pip ring,
```

**10. "## Bottom strip (selected commanders)": replace "- **Portrait:** opens the Commander
panel." with:**

```markdown
- **Portrait** (64 px): opens the Commander panel.
```

**11. Add a section after "## Bottom strip (selected commanders)":**

```markdown
## Leader portraits

Every commander has a portrait (docs/09 "Leader portraits"): 96 px in the Commander panel, 64 in
the bottom strip and the replay docks, 128 on name cards and Codex pages, 48 in hover tooltips,
40 in report cards and the Forces tab, 24 in the outliner, 16 beside a name in text. It is the
same person everywhere; state shows as overlays and frame marks (wounds, halo, crown, pip ring,
holy mark, status glyphs, gear). A commander the player cannot see shows its last-seen portrait,
faded, in a dotted frame. Commanders carry personal names, shown with their unit as a title:
"Varo, Ash Chieftain". Pretenders keep the name their god was given.
```

**12. "## Other screens", Settings: replace the "Interface" item with:**

```markdown
  - **Interface:** UI scale, text size, tooltip delay or Off, detail key Hold or Toggle,
    guidance, reset hints, table (Full, Simple, Off), map detail (Full, Reduced).
```

**13. "## Accessibility and feel": replace the "Motion and flashes" item with:**

```markdown
- **Motion and flashes:** reduced motion follows the OS, and also freezes the table's candles and
  hearth and makes map repaints and zoom steps instant. Screen shake defaults to 50%. The flash
  limit is always on.
```

**14. "## Keyboard and mouse": in the key table, replace the row "| WASD, arrows, drag; wheel |
pan; zoom to cursor |" with:**

```markdown
| WASD, arrows, drag; wheel; Z | pan; zoom to cursor; fit the map |
```

**15. "## Changes from the previous version of this document": add:**

```markdown
11. **The war table (2026-10-21, the owner's direction: "the overall map should be on an rustic
    wartable in a cozy but natural tavern, nice oak wood"):** the map is a painted cloth on an oak
    table in a tavern, with impassable wilds, terrain detail, settlements that grow, land that
    changes with dominion, painted tokens, leader portraits with names, and oak and brass chrome
    hardware. Table and Map detail settings and the `Z` fit key were added.
```

### `docs/09-balance.md`: rows dated 2026-10-21

**Append to the main table:**

```markdown
| 2026-10-21 | 01 §2 (owner decision) | Wild ranges | none | round(provinces / 20): Small 2, Medium 3, Large 4, Medium with 3 nations 4, with 4 nations 6, Large with 4 nations 7; kinds cycle peaks, mere, peaks | Owner direction: "impassible terrain that is noticeable". Measured on 660 maps: 35 to 40% of provinces border a wild |
| 2026-10-21 | (new) | Cells per wild range | — | peaks 1 / 2 / 3 at weights 25 / 50 / 25; mere 1 / 2 at 60 / 40 | About 9% extra cells (Medium 5.4) |
| 2026-10-21 | (new) | Wild guards | — | every cell interior; at least 3 cells from every capital and from other ranges; provinces stay connected with 2 neighbors each and no cut vertex; the provinces around a range within 6 steps; 12 seeds tried per range | 0 of 660 maps failed; each capital's 2-hop ring kept its members on all 660; largest detour 6 |
| 2026-10-21 | (new) | Map area | provinces × 6400 | (provinces + wild cells) × 6400 | Provinces keep their size |
| 2026-10-21 | 01 §2 | Capital balance search | up to 6 valid maps | up to 10 | With wilds at 6, maps within 1.5 fell to 74% (Medium, 3 nations; 79% without wilds) and 38% (4 nations; 54%); at 10: 93% and 56% (mean ratio 1.565 → 1.507). Generation on Medium: 26 ms with 2 nations, 420 ms with 4 (means) |
```

**Add after the main table (before "## Playtest checklist"):**

```markdown
### Map presentation

| Date | Doc | Field | From | To | Reason |
|------|-----|-------|------|----|--------|
| 2026-10-21 | 09 | Wild grounds | — | granite #2A292C (peaks), water #24222A (meres), rim #E9E4D8 | Darkest grounds; against the nearest fill 21.7 / 18.6 / 16.5 / 14.1 and 25.4 / 22.5 / 20.3 / 15.5 (normal / protan / deutan / tritan); every M1 banner and mode color directly, Umbra's banner by the rim |
| 2026-10-21 | 07 | Mode base | desaturated fill | desaturated 80% and lifted to L* 50 with linen (Forest 33%, Swamp 19%, Hills 12%) | Every M1 mode color passes 20 / 12 against both wild grounds |
| 2026-10-21 | 07 | Data ramp | #181E3C … #FAE6A0 | #4C5E96 #8170AC #C4808E #E6AC6E #F8E6A6 | L* 41 to 91; 24.6 / 23.9 from the wild grounds; adjacent steps at least 13 apart for normal vision |
| 2026-10-21 | 09 | Land-look wash caps | — | Cinder Horde ash #8F8C88 ≤ 10%, Thornwood moss #5E7F45 ≤ 6%, × strength / 10 | Largest that keep every pair type at 20 / 12 (12% and 8% fail: 19.8, 11.8) |
| 2026-10-21 | 07 | Fog fills | "parchment haze" | unexplored: 4% linen haze, no land look; out of sight: desaturated 10%, wash hidden | Largest that keep every terrain pair in every combination of states and land looks at 20 / 12 (20.5 / 12.2); a 35% haze gives 12.7 / 3.8 |
| 2026-10-21 | 07 | Start zoom; lean back | fit the map with a 14 px pad | the cloth fits with a 32 px oak band; lean back to 0.75 × the table's fit; a ±8% detent | The table frames the map; Medium at 1280x720 stays in the Mid band (about 95 px per province) |
| 2026-10-21 | 09 | Settlement tiers | — | `UI.popSteps` 2,000 / 5,000 / 10,000 / 20,000; houses 1–2 / 3–5 / 6–9 / 10–15 / 16–22 | One source with Population mode |
| 2026-10-21 | 09 | Thriving and declining | — | population ≥ 1.25 × start / ≤ 0.80 × start | Growth over 70 months is +15% at neutral scales, so the marks need the ratio |
| 2026-10-21 | 09 | Walls by PD | — | watchtower at 1, palisade at 5, stone wall at 15, towers and gatehouse at 25 | Four readable steps over 0 to 30 |
| 2026-10-21 | 09 | Land motifs | — | dominion 1–3 / 4–6 / 7–10 take 8% / 15% / 22% of a province's slots; a landmark from 7; pole motifs 1 per step at Mid, 2 at Near, at most 6 per axis and 30% of slots | Strength reads as reach around the settlement |
| 2026-10-21 | 09 | Stamp caps | — | per average province: Far 2 to 4 masses, Mid ≤ 30, Near ≤ 60; coverage ≤ 60% / 75% | The density budget of docs/07 |
| 2026-10-21 | 09 | Battle scars | — | churned ground for 90 days, then cairns (1 per 50 casualties, at most 4) until day 360 | A year of memory |
| 2026-10-21 | 09 | Repaint | — | 600 ms cross-fade; at most 8 animated per month end; slow looks at most monthly | A calm map |
| 2026-10-21 | 09 | Footpath on passable Mountains | — | #2B2620 at 75%, 1.5 px, dash 4 / 3 | 3.65:1 on Mountains |
| 2026-10-21 | 07 | Commander panel portrait | 64 px | 96 px | Leaders need faces (owner direction) |
| 2026-10-21 | 09 | Raster art | — | at most 2 MB in the bundle; a portrait set needs 8 images; 256 px WebP ≤ 24 KB and 64 px ≤ 4 KB each | Keeps criterion 1's 5 MB bundle |
```

**Add to "## Playtest checklist":**

```markdown
- [ ] On maps with wilds, a new player finds the way around a range without reading docs (the path preview bends and the label names the range), and a match against one Normal AI still ends by month 70 in most games.
```

### `docs/10-milestone-1.md`

**1. Add a section after "### Phase 7: AI":**

```markdown
### Phase 1b: Impassable terrain (owner decision 2026-10-21)
- The owner's direction: "i want to make sure the maps have some impassible terrain that is
  noticeable". Rules in `docs/01-core-rules.md` §2 and its Implementation decisions ("Wilds").
- Commit A (any time): `mapgen/wilds.ts` behind `MapGenParams.wilds` (default false),
  `MapData.wilds` with the next `STATE_VERSION` and its migration (`wilds: []`), the new
  `validateMap` checks and tests; a hash recorded from the earlier generator proves that maps
  with wilds off are unchanged.
- Commit B (the owner's decision, after A): wilds on in New Game and `sim:aivai`; `MAPGEN.balanceCandidates`
  10; seed-pinned fixtures re-pinned; 20 AI games re-measured and the matchup recorded.
- Tests: exact province count and terrain shares with wilds; interior wilds at least 3 cells
  from capitals and from each other; no cut vertex; detours of at most 6; capital rings
  unchanged; paths, sight, rituals and spread go around wilds; generation time.
```

**2. "### Phase 8": append (after the UI track's replacement text, if it has landed):**

```markdown
- The war table and wild art (`docs/09` "The war table", "Impassable terrain"), at most about a
  quarter of this phase's diff: the Simple table (procedural oak with iron straps, the cloth,
  square tacks); the camera's start zoom with its oak band, lean back, clamp, detent and the Fit
  button (`Z`); the fill, decoration and always-on map layers; wild grounds, rims, stamps, names,
  hover cards, the ✕ cursor, "around the" labels and the no-path reason; the footpath on
  passable Mountains; siege camps, wall states and the Wellspring monument; painted wood and
  pewter tokens and brass-tack paths; the lifted mode base and data ramp; portrait v0 (code-path
  busts with allegiance frames, rank materials and the pip ring's separation ring) in the strip,
  outliner, Commander panel and tooltips; the brass action keyline.
- Tests: the palette test with wild grounds, banners and mode colors; the label test with wild
  labels and token boxes; the fog guard over the map look and portraits.
- Anything of the above not done when this phase's tests pass moves to Phase 11 and is noted in
  `docs/PROGRESS.md`. The game is playable with flat fills.
```

**3. "### Phase 9": append:**

```markdown
- Chrome hardware (oak bevels and frames, brass keylines and brackets, leather spines); the Full
  table (the procedural tavern floor, hearth and window light, the candle pool, the rim
  vignette); Settings → Interface → Table and Map detail; portrait overlays, badges and the gear
  chip, and portraits on report cards; `scripts/art-intake.ts` and the raster manifest.
- Should: the static table props; personal names; the parchment report card and Codex pages if
  the owner chose them.
```

**4. "### Phase 10": append:**

```markdown
- Portrait busts in the replay docks, name cards and result card; the replay modal in the oak and
  brass frame.
```

**5. "### Phase 11": append after its bullet:**

```markdown
- The painted map: ground textures, terrain stamps and Far masses with level of detail; fog line
  art; settlements (tiers, thriving and declining, walls, landmarks, scaffolds, kits); land looks
  by dominion and pole motifs; battle scars, unrest marks, pillage smoke; slow looks saved in the
  UI block with the monthly cross-fade; the portrait SVG part library. Should: standees at Near.
  The map art shares this phase's time budget with the unit SVGs; past it, the cut order in the
  war-table design applies.
```

**6. "### Phase 12": append:**

```markdown
- The map's performance pass (60 fps at 1080p with Table and Map detail Full, Large with 4
  nations). Re-run the checklist on maps with wilds. Should: the month candle and hourglass, the
  table's ambience, the room's seasons, the brush-wipe repaint, owner raster sets that arrived
  complete.
```

**7. Acceptance criteria. Replace criterion 3 with:**

```markdown
3. Map: 60-province landlocked Medium map with 3 impassable wild ranges, all provinces
   connected with no single province as the only way through, capitals ≥ 6 apart with no wild
   within 2 provinces of a capital, 3 Wellsprings ≥ 3 from capitals, every color's springs
   appear at least twice.
```

**Append to criterion 4:**

```markdown
 Art never changes the state: the purity test guards `src/present`, and the state hash is equal
with every Table and Map detail setting.
```

**Append to criterion 14:**

```markdown
 Every commander has a seeded portrait with an allegiance frame, a rank material and state
overlays. The map shows terrain detail, settlements by population, walls by PD, buildings,
impassable wilds, and each province's land look by dominion and scales.
```

**Add a criterion (numbered after any the other tracks add):**

```markdown
16. The war table: the map is a painted cloth on an oak war table in a tavern, framed by an oak
    band at the start zoom and shown whole with the tavern floor when leaning back; Settings
    offer Table Full / Simple / Off and Map detail Full / Reduced; the map holds 60 fps at 1080p
    with both on Full; reduced motion freezes the table's ambience.
```

**8. "## Out of scope for M1": replace "sound outside battle replays (map, menus, UI)" with:**

```markdown
sound outside battle replays (map and tavern ambience, menus, UI)
```

### `docs/12-battle-presentation.md` (the battle track's doc, two lines)

**1. S4.4, replace the bullet "- **Portraits** for name cards and docks are the rig in its idle
pose at 2×, on the banner color." with:**

```markdown
- **Portraits** for name cards and docks are the commander's portrait (docs/09 "Leader
  portraits"); pretenders and summoned commanders keep their rig in its portrait pose, on the
  banner color.
```

**2. S6.2, replace "- Portraits for name cards and docks come from the same SVG at 2×, and
chassis portraits from the 128×128 SVGs." with:**

```markdown
- Portraits for name cards and docks come from the commander's portrait (docs/09 "Leader
  portraits"); pretenders and summoned commanders use their rig's portrait pose (docs/05,
  pretender B.8).
```

### `docs/06-architecture.md`

**1. "## Repository layout": under `mapgen/`, add after `validate.ts`:**

```text
      wilds.ts            # impassable wild ranges: placement, outline, names (Phase 1b)
```

**2. Under `src/`, add after `ai/` (the battle track adds `present/rand.ts` and `present/battle/`):**

```text
    present/              # PURE presentation derivations, guarded like sim
      map/
        look.ts           # mapLook: slow and fast look keys from the viewer's fogged view
        scatter.ts        # scatterProvince: seeded stamp slots per province and layer
        anchors.ts        # provinceAnchors: label, token, seat
        settlement.ts     # tiers, the house spiral, walls, landmarks
        land.ts           # land looks and pole motifs by dominion and scales
        wilds.ts          # wild stamps, rims, barrierOnLine
        fx.ts             # map cues and marks (pretender design C.4)
      portrait/
        spec.ts           # portraitSpec: parts, frame, overlays, badges from commander and view
        svg.ts            # portraitSvg: a pure SVG string builder
      names.ts            # assignNames: personal names dealt from per-nation decks
```

**3. Under `render/`, replace the three lines `MapRenderer.ts`, `ProvinceLayer.ts ArmyLayer.ts
LabelLayer.ts` and `camera.ts` with:**

```text
      MapRenderer.ts      # Pixi app for the strategic map
      camera.ts           # start zoom, lean back, detent, clamp, fit
      map/
        table/            # room.ts table.ts props.ts light.ts ambience.ts
        FillLayer.ts      # live fills, noise, washes and mode tints
        DecorationBake.ts # per-band baked tiles; lazy Near tiles; dirty re-bakes; cross-fades
        AlwaysOnLayer.ts  # wilds, borders, bands, ritual, siege, pillage and Wellspring marks
        LabelLayer.ts TokenLayer.ts
      portraits.ts        # portrait SVG to cached textures for the replay and map tooltips
```

**4. Under `content/`, add:**

```text
      presentation/       # presentation data; never imported by sim, mapgen or ai
        map/              # textures, stamps, kits, LAND_LOOKS, COLOR_LAND_LOOKS, POLE_MOTIFS, caps
        table.ts          # table, props, light and ambience numbers
        portraits.ts      # PORTRAIT_POOLS, ramps, PORTRAIT_RANK, overlays
        names.ts          # COMMANDER_NAMES per color and for independents
```

**5. Under `assets/`, add `raster/` (owner art taken in by the intake script, with
`manifest.ts`); at the top level add `art-inbox/` (owner drops, gitignored) and `art-source/`
(masters, outside the bundle); under `scripts/`, add `art-intake.ts` (`npm run art:intake`).**

**6. "## Save and load": add after the `STATE_VERSION` 2 bullet:**

```markdown
- The next `STATE_VERSION` (Phase 1b) adds `map.wilds`, the impassable wild ranges; the
  migration sets it to `[]`, so an older map has none.
- The save file's UI block (never `GameState`) also holds presentation state: the map's slow
  look keys with their month index, so a reload shows the same map, and commanders' personal
  names. The sim never reads it.
```

**7. "## Performance targets": replace the map line with:**

```markdown
- Map render: 60 fps at 1080p with all provinces, 100 army markers, the Full table and full map
  detail; at most 4 draw calls and no filters for the table and room; the decoration layer baked
  per zoom band (Near lazily in 512² tiles); GPU memory for table and map at most 96 MB on a
  Large 4-nation map at device pixel ratio 2.
```

**8. "## Implementation decisions": add:**

```markdown
- **Wilds** (Phase 1b): `MapData.wilds` holds impassable regions that are not provinces, with ids
  from a counter local to mapgen. They are never in `neighbors`, so movement, retreat, sight,
  dominion, rituals, fort materials and the AI needed no code to respect them.
- **Map presentation** (Phases 8 and 11): everything the map shows beyond the sim's numbers is
  derived by pure functions in `src/present/**` from state, the viewer's fogged view and the save
  file's UI block, never stored in `GameState`. Random choices hash the game seed with a stable id
  through `src/present/rand.ts`; `state.rng`, `Math.random` and wall time are forbidden there by
  the purity guard. Slow looks change only at month boundaries and are saved in the UI block;
  information events change the look the day they happen.
- **Portraits and names** (Phases 8, 9 and 11): `portraitSpec` keys every part by seed, commander
  and slot and picks by rendezvous over append-only part tables; state picks overlays and frames
  only. Personal names are dealt from per-nation decks after each simulated day and kept in the
  UI block.
```

---

## Art prompt pack (owner-generated assets)

**How the owner uses this pack.**
- Generate in ChatGPT, one image per request, and download the PNG.
- Rename it as the entry says and drop it into `art-inbox/` in the repository (gitignored).
- Run `npm run art:intake`; it checks the image, writes the sizes and a provenance sidecar, and
  opens `art-inbox/contact.html` for approval. An image that fails a check is refused with the
  reason; the intake never edits pixels beyond crop and resize.
- Paste each prompt exactly as written. Replace only `{…}` fields.
- For a family's later prompts, attach that family's approved anchor image as "Image 1".
- For edits, write "Change only {X}. Keep everything else exactly the same." and repeat the
  framing sentences of the original prompt.
- Every asset has a procedural fallback that ships first. Nothing in the game waits for an image.

**Send now** (task #29): A1, A2 and P0. After P0 is approved: P1 to P4. After A2 is approved: A3.

ChatGPT's image sizes are 1024 × 1024 (square), 1536 × 1024 (landscape) and 1024 × 1536
(portrait); every entry asks for one of them.

### A1. Oak table top (seamless tile)

- **When:** now (M1-should). **Size:** square, 1024 × 1024.
- **File:** `art-inbox/table/oak-top__{anything}.png`.
- **Prompt:**

```text
A seamless, tileable texture of an oiled, quarter-sawn white oak tabletop, seen from directly
above, filling the whole square image. Straight, tight grain runs left to right with a subtle
silvery ray fleck. Two thin dark plank seams run straight across the image from left to right,
one a third of the way down and one two thirds of the way down. Tawny grey-gold color:
highlights near #B08A5E, the body near #8F7459, grain lines near #715636. Matte oil finish, worn
smooth, with a few very faint fine scratches. Soft, even, neutral daylight from directly above,
low contrast, no shadows of objects, no vignette, no lighting gradient across the image. No
orange or reddish stain, no varnish shine, no knots larger than a thumbnail, no cracks.
Photographic realism with a slightly painterly softness. The left edge must continue seamlessly
into the right edge, and the top edge into the bottom edge. No objects, no text, no letters, no
logos, no border, no frame, no people. Square image.
```

- **Intake checks:** the wrapped edges match (mean CIEDE2000 across each wrapped seam ≤ 3); mean
  L\* between 45 and 58; 99th-percentile chroma C\* ≤ 30; less than 0.5% of pixels saturated red
  or orange (hue 0° to 50° with C\* above 40).
- **Lands:** `src/assets/raster/table/oak-top.webp` (1024², quality 85, ≤ 250 KB) with
  `oak-top.json`. Knife marks, the tankard ring, nails and iron straps stay procedural on top of
  it, so they never repeat with the tile.
- **Fallback:** the procedural oak tile (`src/render/map/table/table.ts`).

### A2. Tavern floor around the table, top-down, summer

- **When:** now (M1-should). **Size:** landscape, 1536 × 1024.
- **File:** `art-inbox/room/floor-summer__{anything}.png`.
- **Prompt:**

```text
A top-down view, looking straight down from the ceiling, of the floor of a cozy, natural village
tavern around a large rectangular oak table. The table itself is NOT in the image: the center of
the image is an empty rectangle of plain dark floor, 60% of the image wide and 60% of it high,
where the table will be placed later. Landscape image.
Around that empty center: wide oak floorboards with dark seams; a woven wool rug in undyed
creams and browns below the center; a wooden bench with a folded wool cloak on it; a barrel
with iron hoops; a three-legged stool; a large hound asleep on the rug, seen from above with its
head tucked away; a little straw near a plank door at the bottom edge.
Light: the warm glow of a stone hearth just beyond the left edge spills across the floorboards
from the left, small and soft; cool natural daylight from a leaded window beyond the right edge
lies as a pale rectangle on the floor on the right, with the shadows of the window's lead lines.
The corners of the image fall gently into warm darkness.
Summer: the window patch is bright and slightly warm.
Painterly realism with a gouache and oil feel, matte, muted natural colors: oak browns (near
#5E4630 and #8C6A47), warm grey stone, pewter greys, undyed wool. Keep the firelight small. No
saturated red, orange, green, blue or violet anywhere except the small glow at the left edge. No
people, no faces, no text, no signs, no banners, no weapons, nothing in the empty center.
```

- **Intake checks:** the central 60% × 60% rectangle has mean L\* under 25 and low variance (the
  table covers it); chroma C\* under 40 outside the left 20% (the hearth); the owner confirms on
  the contact sheet that no face or text appears.
- **Lands:** `src/assets/raster/room/floor-summer.webp` (1536 × 1024, ≤ 400 KB) with its sidecar.
- **Fallback:** the procedural floor (`src/render/map/table/room.ts`).

### A3. Tavern floor, winter (after A2 is approved)

- **When:** M1-should, with A2 attached as Image 1. **Size:** landscape, 1536 × 1024.
- **File:** `art-inbox/room/floor-winter__{anything}.png`.
- **Prompt:**

```text
Image 1 is the approved tavern floor. Keep everything exactly the same: the view straight down,
the empty dark rectangle in the center, every piece of furniture, the hound, the rug, the
floorboards, the painting style and the colors. Change only the season and the light: it is
winter. The window patch on the right is pale and cool, with a little frost at its edges; the
hearth's glow from the left is somewhat stronger and warmer; a little melted snow lies by the
door at the bottom edge. No people, no faces, no text, nothing in the empty center. Landscape
image.
```

- **Checks, lands, fallback:** as A2, at `src/assets/raster/room/floor-winter.webp`; the
  procedural winter tint is the fallback. Spring and autumn floors are Later.

### P0. Portrait style anchor

- **When:** now. The owner regenerates until satisfied; the approved image becomes Image 1 for
  every portrait. **Size:** square, 1024 × 1024.
- **File:** `art-inbox/portraits/anchor__style.png` (kept as the anchor; it may also enter the Ash
  Chieftain set as `cinderHorde__ashChieftain__00.png`).
- **Prompt:** the style lock followed by the Ash Chieftain subject and the first trait line:

```text
Head-and-shoulders portrait bust of one fantasy war leader, three-quarter view, the face turned
toward the right side of the image. Square image. Framing: the top of the head or headgear about
9% from the top edge, the eyes about 39% from the top, the chin about 66% from the top, the
image cut at mid-chest. One figure only. No hands, no weapons raised toward the face, no text,
no border, no frame, no signature, no logo.
Lighting: a single warm candle key light from the upper left, a dim warm fill, deep warm
shadows. Background: plain, unpatterned, very dark warm brown close to #1C1A17, with no objects.
Medium: painterly oil on a wood panel, moderate detail, a strong readable silhouette: the shape
of the headgear or hair and the contrast between the face and the background must still read
when the image is shrunk to 64 pixels.
Colors: muted and earthy. Nothing in the image glows, except where the subject below says a
mage's eyes glow. No saturated red, orange, green or blue area larger than a small clasp or trim.

Subject: A warrior of the Cinder Horde, ash-born clans who worship fire: ash-grey skin with faint
soot markings, charcoal and smoke-grey clothing, armor of dark iron plates with rusted edges.
An Ash Chieftain: a horned helm of blackened iron, a braided beard, scale-plate pauldrons.
Traits: a braided beard, a grim expression, a scar through the left eyebrow.
```

- **Intake checks (every portrait):** the eye line is found between 33% and 45% of the height
  before the crop (the crop then places it at 39%); the corners' mean L\* is at most 20; no
  99th-percentile chroma above C\* 45 outside the eye region; luminance, warmth and face-box
  position within the set's spread (outliers flagged); the contact sheet shows the set at 256, 64
  and 24 px on oak and on `--chrome-0`.
- **Lands:** `src/assets/raster/portraits/{nationDef}/{unitId}/{nn}.webp` (256 px, ≤ 24 KB) and
  `{nn}-64.webp` (≤ 4 KB), with `{nn}.json`; the 512 px master in `art-source/portraits/...`.
- **Fallback:** the procedural bust, always. A set is used only when it has 8 approved images.

### P1 to P4. The first portrait sets (M1-should)

Each request is: the line "Image 1 is the style reference: match its painting style, lighting,
framing, background and proportions exactly. Change only the subject described below. Keep
everything else the same.", then the style lock from P0 unchanged, then `Subject:` with the
nation line, the type line and one trait line. Eight requests per set, one per trait line.

**File names:** `art-inbox/portraits/{nationDef}__{unitId}__{01..08}.png`, for example
`cinderHorde__ashChieftain__03.png`.

**Nation lines:**
- Cinder Horde: `A warrior of the Cinder Horde, ash-born clans who worship fire: ash-grey skin with faint soot markings, charcoal and smoke-grey clothing, armor of dark iron plates with rusted edges.`
- Thornwood: `A warden of the Thornwood, forest clans who live among ancient trees: weathered bark-brown skin, bark-and-leaf clothing and armor in moss green and bark brown, a few pale blossoms.`
- Independents: `A captain of a free village militia: a weathered human face, plain leather and iron, no insignia.`

**P1. Ash Chieftain** (`cinderHorde__ashChieftain`). Type line: `An Ash Chieftain: a horned helm of blackened iron, scale-plate pauldrons.` Traits:
1. `a braided beard, a grim expression, a scar through the left eyebrow.`
2. `a cropped beard, weary eyes, grey at the temples.`
3. `no beard, a broad jaw, soot stripes across the brow.`
4. `a long braided beard with iron rings, a fierce stare.`
5. `a short beard, a broken nose, a calm and cold look.`
6. `a heavy beard, deep-set eyes, a thin crack-like scar on the cheek.`
7. `no beard, gaunt cheeks, one horn of the helm chipped.`
8. `a braided moustache, old and scarred, watchful.`

**P2. Warden Captain** (`thornwood__wardenCaptain`). Type line: `A Warden Captain: a helm of layered bark plates with short antler stubs, a cloak of real leaves over bark armor.` Traits:
1. `braided hair, a full beard, a steady look.`
2. `long hair tied back, no beard, watchful eyes.`
3. `a short beard with moss in it, a stern mouth.`
4. `grey braids, a weathered face, a calm look.`
5. `a young face, a thin beard, a scar on the chin.`
6. `a heavy brow, a full red-brown beard, a patient look.`
7. `close-cropped hair under the helm, no beard, a leaf tattoo on the cheek.`
8. `an old face, a white beard, kind but hard eyes.`

**P3. Pyre Priest** (`cinderHorde__pyrePriest`). Type line: `A Pyre Priest: a hood of charcoal cloth with an ember-shaped iron clasp, a collar of dark iron rings, soot stripes across the cheeks.` Traits:
1. `an old lined face, a shaved chin.`
2. `a thin face, a short grey beard.`
3. `a young face, intense eyes.`
4. `a heavy face, a burn scar on the jaw.`
5. `a narrow face, a long braided beard.`
6. `a gaunt face, sunken eyes, a calm smile.`
7. `a round face, a stubbled chin.`
8. `an old face, a forked beard.`

**P4. Grove Priest** (`thornwood__grovePriest`). Type line: `A Grove Priest: a wreath crown of oak leaves, moss in the hair, a plain green-grey robe with a carved leaf clasp.` Traits:
1. `an old serene face, a long white beard.`
2. `a young calm face, braided hair.`
3. `a lined face, a short beard, gentle eyes.`
4. `a narrow face, long loose hair.`
5. `a broad face, a moss-tangled beard.`
6. `a weathered face, a scar across the nose.`
7. `an old face, no beard, a thoughtful look.`
8. `a stern face, grey braids.`

**Later sets** use the same template:
- Ember Adept: `An Ember Adept: a young face, a thin blackened-iron circlet, a charcoal robe with a dull ember-red trim.`
- Cinder Magus: `A Cinder Magus: an old gaunt face, a tall peaked charcoal cowl; the eyes glow amber like embers (#FFB347), and nothing else glows.`
- Cinder Scout: `A Cinder Scout: a low charcoal hood and a scarf over the lower face, alert eyes.`
- Sapling Druid: `A Sapling Druid: a young calm face, a circlet of twigs, a cloak of moss-green wool.`
- Elder Druid: `An Elder Druid: an old lined face, a hood with small antlers, a long beard with moss in it; the eyes glow pale green (#A6D96A), and nothing else glows.`
- Thorn Scout: `A Thorn Scout: a hood of overlapping leaves, thin green face paint in stripes.`
- Independent Captain, by outfit (12 per outfit): levy `a plain iron cap and a padded jerkin`; hunter `a fur-trimmed hood`; mountaineer `a heavy fur mantle and a dented iron helm`; reedman `a reed-woven cloak and a leather cap`. File names `independent__independentCaptain-{outfit}__{nn}.png`.

Only the two types whose base pips are 2 (the Cinder Magus and the Elder Druid) have glowing eyes
in raster art. A raster image serves every commander of its type, so it cannot follow an
individual's pips; the pip ring on the frame does that. No raster portrait carries a banner color:
the frame's band does.

### Provenance (every image)

The intake writes `{name}.json` beside each accepted file: the source file name and the
original's SHA-256; the tool and model as ChatGPT shows them; the date; the full prompt text and
any edit prompts; whether C2PA metadata was present (ChatGPT images carry it, and WebP
conversion drops it, so the sidecar records it); and the approver. The originals stay in
`art-inbox/accepted/` (gitignored). Content validation fails on a missing size or sidecar.

---

## Mockup brief: changes to `ui-mockup/game-screen-v1.html`, in order

**Goal.** The owner sees and reacts to everything above in the clickable mockup, in this order: the
oak war table and the tavern; noticeable impassable terrain; terrain detail; settlements growing;
land that differs by alignment; leader portraits in the strip, the outliner and the battle
report. Then the chrome A/B, modes, fog and the review aids.

**Constraints.**
- Procedural art only: canvas 2D, inline SVG, CSS. No external images.
- Google Fonts only. Extend the existing link to
  `family=Marcellus+SC&family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Sans+Condensed:wght@400;500;600`.
- Scripts only from cdnjs with pinned versions: keep
  `https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js`; add nothing else.
- Every random choice is seeded: add `h32(str)` (a 32-bit string hash) and
  `rngFor(key) = mulberry32(h32(key))` beside the file's `mulberry32`; never `Math.random`.
  Nothing may change between reloads.
- Every existing interaction keeps working: hover tooltips, nested terms, T lock, the alerts
  ribbon, outliner, feed, strip orders, right-click moves, Space, 1 to 4, Shift+1 to 6, M, F, R,
  H, [ and ], the phone layout.
- Performance: the static scene is drawn into offscreen canvases (the room and table once per
  settings change; the decoration bake per zoom band, mode, time-lapse step and settings); pan
  and hover only blit them, and the ambience loop composites the cache plus flames and motes at
  most 30 times a second. Target 60 fps at 1440 px wide.

### Step 1. Mockup controls and "Try this"

- Rewrite the `page-head` paragraph as a short "Try this" list:
  1. lean back with the wheel to see the table and the tavern;
  2. hover a dark massif, then select Varo and right-click the province named here (filled in
     by step 3) to watch the path bend around it;
  3. drag the time-lapse slider and watch Ashfen change faith;
  4. open Portraits;
  5. switch Table, Chrome and Vision.
- Add a compact group in the page head, outside the game window, labelled "Mockup controls"
  (review aids, not game UI):
  - `Table: Full | Simple | Off`;
  - `Detail: Full | Reduced`;
  - `Time-lapse` slider, Y1 M3 to Y6 M10 (months 3 to 70), with a label "Mockup: jumps the
    clock; in the game slow looks change once a month";
  - `Chrome: Approved | Warm retune (rejected)`;
  - `Parchment: Off | Report card and Codex`;
  - `Vision: Normal | Protan | Deutan | Tritan`;
  - `Reduced motion` (also follows `prefers-reduced-motion`);
  - `Portraits` (opens the gallery, step 14);
  - `Passability` (a review overlay, step 3).

### Step 2. The war table and the tavern (draw under the map; section 2)

World units: the map rectangle stays `[0, 0, W, H]` (1600 × 1000). Cloth margin `m = 40`, hem
6, table margin `T = 0.35 × (H + 2m)`, room margin `R = 0.5 × (H + 2m + 2T)`.

1. **Room** (offscreen, once per settings change), the rectangle `[−m−T−R, −m−T−R, W+m+T+R,
   H+m+T+R]`:
   - floor: base #2A2018; horizontal planks 90 units tall alternating #3A2C20 and #34281D, with
     value-noise streaks at ±4% and seams 2 units #1E1712; a few lit planks #5A4430 toward the
     window side;
   - rug under the table's south half, extending 0.25 × the table's width beyond it: #6B5A48
     with a 24-unit border #8A7560 and an inner line #4A3A2E;
   - bench along the north side: #4E3A28 with plank lines, a folded cloak #5A5148 on it;
   - barrel (east): circle r 55, #5E4630, stave lines, two hoops #3A3836;
   - stool (west): a seat circle r 30 #5E4630 and three leg dots;
   - hound asleep on the rug (south-west), seen from above: an ellipse body 150 × 90 #7A6450,
     a smaller head ellipse tucked against it, a tail curve, shade #5A4636 along one side;
   - door at the south edge #2B2018 with square iron hinges #4A4744, and 30 straw strokes
     #B89A5A beside it;
   - hearth at the west edge: an arc of stones #4A4744 / #5E5953, and a radial glow #FF890E at
     30% fading to 0 over 700 units across the floor;
   - window light to the east: a pale parallelogram #F2EBDD at 14% with three darker 4-unit lead
     bars;
   - a vignette toward the screen edges, #0E0905 to 50%.
2. **Table** (offscreen):
   - shadow: the table rectangle offset 14 units, #000 at 40%, blur 30;
   - oak: a 512² pattern built once (instrument recipe): base #8F7459; grain lines #715636 where
     `sin(y·0.9 + 3·sin(x·0.004 + k))` passes 0.96; ray fleck as faint #BB9E7C ellipses 6 × 2
     at 25%; the pattern follows the camera through `setTransform`;
   - three planks across the short side with 2-unit #5E4630 seams and two square nail heads per
     plank end (6 × 6 #2B2A28, a 1-unit #6E6A64 highlight on the upper and left edges);
   - rim: a 22-unit band shaded #715636 to #3E2E20 outward, with a lighter worn strip (#B08A5E
     at 30%) along the bottom edge;
   - **forged iron corner straps:** at each corner an L of two 26 × 110 bands #4A4744 with a
     #2B2A28 edge and three square nail heads per arm;
   - **knife marks:** 4 seeded thin lines (30 to 50 units, within ±20° of horizontal) #5E4630 at
     60% beside the bread board's slot;
   - **tankard ring:** a 1.5-unit circle stroke r 34, #5E4630 at 35%, with two gaps, beside the
     tankard's slot;
   - table light (masked out of the cloth rectangle): the hearth's gradient on the west rim,
     #FF890E `lighter` from 20% to 0 over 30% of the table's width; the candle's pool, #FFA757
     at 25%, radius 0.12 × (H + 2m) around the candle; a rim vignette #140C06 from 0 to 45% at
     the rim.
3. **Props** in the table margin, each centered 0.06 × (H + 2m) outside the hem diagonally from
   its corner, so its inner third shows in the start zoom's oak band. Draw them in a painted
   three-quarter top view:
   - upper left: the **month candle** in an iron holder (holder circle r 26 #4A4744 with a ring
     handle; a beeswax cylinder 18 units wide, #E9DFC2 with a #CFC0A0 side, whose visible side
     is `50 × (1 − day/30)` units tall; a teardrop flame with a #FFE8C3 to #FF8400 radial
     gradient). At a month change, a fresh candle (0.4 s puff; instant under reduced motion);
   - upper right: the **hourglass** (two wooden caps #5E4630, glass #CFE0EA at 30%, sand #C9A86A
     whose upper and lower triangles follow the day's fraction); a 1 px grain stream while
     running; **rotated 90° on its side while paused**;
   - lower left: an inkpot (r 22 #1E2A2E with a highlight), a quill (a feather path #E9E4D8 with
     #CFC6B4 barbs, lying diagonally), brass dividers (two thin #B8914A legs with a square pivot);
   - lower right: a pewter tankard (r 34 #91A092, rim #6F7C70, a handle) and two bone dice (22 ×
     22 rounded squares #E9E4D8 with #1C1A17 pips);
   - bottom edge: a bread board (120 × 70 #8C6A47 with grain), a heel of bread (#C9A06A, crust
     #8A5A2A) and a knife (blade #A8ADB3, handle #4E3A28);
   - top edge: a folded letter (90 × 60 #E9DFC2 with a fold line) with a wax seal r 10 #4A2A1C;
   - left edge: six bare-wood shield tokens #B08A5E with #715636 outlines.
   - Props are inert: no hover, and a click passes to the table (clears the selection).
4. **Cloth** `[−m, −m, W+m, H+m]`:
   - a contact shadow (offset 3 px, #000 at 35%, blur 8);
   - linen #E8DCC2 with fiber flecks (short strokes at random angles, ±3% L\*; never a grid);
   - a 6-unit leather hem #3E2E20;
   - four **square** brass tacks at the corners: 12 × 12 #B8914A, a 1-unit #D4B26A highlight on
     the top and left edges, a 1-unit #1C1A17 outline;
   - a cartouche at the top center of the margin: a scroll frame in ink lines with "The Ember
     Marches" in Marcellus SC 22 units, #1C1A17;
   - a compass rose in the upper-right corner of the margin, ink lines, "N" marked;
   - the map rectangle's outline, 3 units of ink.
   - **No light, grade or vignette on the cloth.** Draw table light before the cloth.
5. **Camera:**
   - `fit()` fits the cloth rectangle (not the map) into `viewRect()` with a **32 px** pad, and
     stores it as `fitScale`;
   - wheel zoom runs from `0.75 ×` the scale that fits the table rectangle up to the scale at
     which the median province is 420 px across;
   - **detent:** 150 ms after the last wheel event, a scale within ±8% of `fitScale` animates to
     it over 200 ms (instant under reduced motion);
   - `Z` and a "Fit" button at the top of the mode column return to `fitScale`;
   - pan clamp: the view's center stays inside the table rectangle;
   - a small chip by the mode column, "Zoom: Far / Mid / Near", from the median on-screen
     province diameter (70 and 180 px).
6. **Table settings:** Full (everything above plus the ambience of step 17); Simple (oak, cloth
   and a still room gradient, no props, no ambience); Off (`#15130F` around the hem, today's
   look).

### Step 3. Wilds (impassable terrain; section 1)

1. **Generator** (before terrain, owners and names):
   - an 11 × 6 jittered grid (66 sites) in the same `W × H`, with the 2 Lloyd rounds as now;
   - capitals first, as now: `redCap = nearest(230, 520)`, `greenCap = nearest(1380, 470)`;
   - a second field `wet(x, y)`: a sum of sines like `noise` with other phases;
   - a fixed plan: "the Ashspine" peaks, 3 cells; "the Still Mere", a mere, 1 cell; "the
     Greyteeth" peaks, 2 cells, so 60 provinces remain;
   - peaks by `noise` (highest first), the mere by `wet − noise`; seed at the best eligible cell
     and grow into the best eligible neighbor; if a range cannot grow, release it and try the
     next seed (at most 12);
   - eligible: no vertex on the rectangle `[0, 0, W, H]`; at least 3 Delaunay hops from both
     capitals and from every cell of another range; with the cell removed, the rest stays
     connected, every neighbor keeps 2 neighbors, there is no cut vertex (an iterative Tarjan),
     and the provinces around each range stay within 6 hops;
   - keep cell indices; set `prov[i].wild = { id, kind, name }` on wild cells, build
     `provList = prov.filter((p) => !p.wild)`, run every province loop (terrain ranks, owners,
     names, Ashfen, Sunmere, Wellsprings, commanders, labels, badges) over `provList`, and make
     `nbrs(i)` skip wild cells. Terrain ranks over the 60 provinces with today's shares;
   - pick `acrossTarget`: a province bordering the Ashspine whose straight line from Ashfen's
     center crosses the Ashspine and which `pathTo` reaches; put its name in "Try this". If a
     province exists whose only way around crosses a Thornwood province, pick it as
     `closedTarget` for the no-path demo.
2. **Peaks:** granite #2A292C over each cell; 8 to 14 peak stamps per cell by area (Poisson,
   seeded `rngFor('wild:' + id)`), 2 or 3 centerpieces at 1.7×, about 0.55 of the inradius
   tall; each peak a triangle with a lit left face #8A857E, a flat right face #46423F (no
   hatching), a snowcap #F2EEE6 down to 40% of its height, a 1.3 px ink outline #1C1A17; drawn
   tallest first, then by bottom edge; tips may rise 10% above the cell's top edge.
3. **Mere:** water #24222A; a 5 px shore band #2E3138 inside the outline; 8 to 14 two-hump ripple
   strokes #8FC3D3 at 1.5 px (14 to 20 px wide), leaving the middle third open; 5 to 8 reed tufts
   (#8E9A6E with ink) and 2 or 3 bone-white snags #CFC6B4 on the shore.
4. **Signature on both:** along the wild's outline (cell edges not shared by two cells of the
   same wild), a 3 px ink contour #1C1A17 in place of the province border; inside it, cliff ticks
   on peaks (#E9E4D8 at 85%, perpendicular, 5 px apart, 4 to 7 px long, seeded ±1 px; 3 px and 4
   px apart at Far) or a 2 px shore keyline (#E9E4D8 at 70%) on the mere.
5. **Names:** Alegreya Sans italic 400, letter-spacing 0.08 em (`ctx.letterSpacing` where
   supported), #E9E4D8, no halo, 11 to 16 px by area, at the largest cell's centroid; no stamp
   inside the label box plus 4 px.
6. **Drawn in every mode, at every zoom, never tinted, dimmed, hatched or fogged.**
7. **Passable Mountains:** 4 to 7 small, spaced, snowless peaks (lit #B4C1C6, shade #6E7F86,
   ink) and a dashed footpath #2B2620 at 75%, 1.5 px, dash [4, 3], through the seat between the
   midpoints of the two longest edges.
8. **Hover** (the existing tip system, key `wild:<id>`): the rim goes to 100%; the card reads
   "The Ashspine", "Peaks · Impassable", the rule sentence from 1.2, and "Borders:" with each
   bordering province as a link (`selectProv`). A province's own tooltip gains "Borders the
   Ashspine (impassable)" when it does.
9. **With Varo selected:**
   - over a wild, the cursor label reads "✕ Impassable: the Ashspine"; right-click toasts "No
     path crosses the Ashspine." and issues nothing;
   - right-click `acrossTarget`: the path bends around the range (because `nbrs` skips wilds),
     and the toast and the ETA label add "around the Ashspine" (`barrierOnLine`: the first wild
     polygon the segment between the two centers crosses);
   - right-click `closedTarget` (if any): "No path: the Ashspine blocks the way, and the way
     around crosses hostile {name}."
10. **Passability** (mockup control): hatch at 45° every province Varo cannot reach (the game's
    unreachable pattern), outline every wild 4 px #E9E4D8, and show "Review only: not a game
    mode".

### Step 4. Terrain detail (section 3; Ownership mode only, in the decoration bake)

- Seed each province's layers with `rngFor('map:11:' + i + ':' + layer)`.
- **Ground textures** (lightness within ±8% of the fill, ±4% inside label, token and seat boxes):
  - Plains: 120 stipple dots; 1 or 2 short hedgerow polylines #5E7046 at 50% with bush dots;
  - Farmland: a Voronoi of 5 to 9 seeds inside the cell; each field ±6% L\*; furrows 4 px apart
    at 0°, 90°, +30° or −30° per field (never 45°), #A07A20 at 35%; hedges along field edges
    #465A28 at 55%;
  - Forest: rows of small arcs (r 4 to 6), #2A3A21 at 40% and #4B6339 at 30%;
  - Hills: 3 or 4 curved hachures on the lower-right of each Poisson point, #6E561C at 50%;
  - Mountains: scree stipple #6E7F86 at 40%;
  - Swamp: staggered horizontal dashes 6 to 14 px, #2C8C94 at 60%, and pools (ellipses #2C8C94
    at 45%);
  - Wasteland: the edges of a fine Voronoi (20 to 30 seeds), #8F6E64 at 45%, 1 px.
- **Standing stamps** with the section 3.2 counts per band (Far masses, Mid, Near): faces at the
  fill +12% L\* and −18% L\*, a 1 px ink outline #1C1A17 at 70%. Shapes: tree crowns (circle
  clusters, the darker face lower right), humps (half ellipses with 3 slope strokes), small
  snowless peaks, reed tufts (4 lines), rocks (two-face polygons), grass tufts (3 lines),
  haystacks, a windmill.
- **Placement:** Poisson slots inset 8 units, each with a seeded rank (Far ⊂ Mid ⊂ Near), sorted
  by distance from the seat; no standing stamp inside the label box (96 × 30 screen px at the
  label), the token box (30 × 48 above it) or the seat box, plus 4 px; drawn by bottom edge;
  coverage at most 60% at Mid and 75% at Near.

### Step 5. Settlements that grow (section 4.2)

- The seat sits below the label (its half height plus 6 px), clamped inside the cell.
- Tier from `pop` by `[2000, 5000, 10000, 20000]`; houses interpolated (1–2, 3–5, 6–9, 10–15,
  16–22); house *k* at angle k × 137.508° and radius 3.2 √k units, squashed 1.3 : 0.8, jitter
  and roof variant from `rngFor('house:' + i + ':' + k)`.
- Kits by owner, every roof with a 1 px ink outline:
  - red: longhouses, walls #8F8C88, soot roofs #3A3633 with a jagged crest line, ember window
    dots #FFB347 (1.5 px);
  - green: round huts, walls #A0785A, living roofs #4E6B3A with a lighter moss highlight;
  - none: fieldstone walls #D8CBB0, thatch #C2A86B.
- Thriving (pop ≥ 1.25 × start): the two newest houses get thatch #E3CF8F and garden plots appear;
  declining (≤ 0.80 × start): the two newest stand as roofless outlines.
- Walls by PD: 1 to 4 a watchtower; 5 to 14 a palisade ring (stakes #6B4A2B); 15 to 24 a stone
  ring #9A958C with crenellation ticks; 25 to 30 adds 4 towers and a gatehouse on the south.
- Landmarks: the capitals' keep, temple and lab in their kit (red temple: a stepped pyre tower
  with a lit brazier; green temple: a ring of 6 small trees around an altar; red lab: a black
  spire #2B2A28 with an ember window; green lab: a hollow tree tower); a scaffold grid whose
  height follows the build in quarters.
- **A temple without faith:** give Ashfen a temple (built at M8 in the time-lapse); under
  Thornwood dominion its brazier is unlit (a grey dot, no glow).
- Wellsprings: a stone basin #CFC6B4 with five pale drops #CFE8F0 and a hollow diamond; while
  claimed: a priest figure and a 10-day ring; once claimed: 4 standing stones in the claimer's
  banner and a filled diamond.
- Far: a keep glyph at the capitals and a roof cluster from tier 3; Near: yard details (a well, a
  cart, garden plots).

### Step 6. Land that differs by alignment (section 4.3)

- Wash (Ownership mode, provinces in sight): `mix(fill, wash, washMax × s / 10)`, Cinder #8F8C88
  at 0.10, Thornwood #5E7F45 at 0.06.
- Nation motifs in the slots nearest the seat, 8% / 15% / 22% of the slots at strength 1–3 / 4–6
  / 7–10:
  - Cinder: L1 ash stipple (#8F8C88 dots at 25%) and black cairns (3 stacked ellipses #2B2A28
    with one #FFB347 dot); L2 scorched patches (irregular #3A3633 blobs at 35% with 3 to 5
    #FFB347 specks), obsidian shards (small #1C1A17 triangles with a #6E6A64 edge), braziers;
    L3 charred trees (forest crowns replaced by bare #2B2A28 branches) and thin #FFB347 cracks;
    landmark at 7+: the burning cairn (a tall cairn with a brazier and a static #FFB347 ring at
    40%);
  - Thornwood: L1 blossom dots #EAD2DA in the crowns and ivy (#4E6B3A strokes) on grey stones
    #9A958C; L2 saplings, mossy standing stones (#9A958C with #5E7F45 tops), meadow dots #EFE7CF;
    L3 great trees (2× crowns), vines over houses, bramble arcs #5A3A28; landmark at 7+: the elder
    tree (an outsized crown ringed with blossom).
- Pole motifs in the outermost slots, 1 per effective step at Mid and 2 at Near (effective step =
  `round(scale × strength / 10)`, halves away from zero): give the Cinder Horde the Warlord
  scales (Fury 3, Turmoil 2: war cairns with spears, torn banners; broken fences, a toppled cart,
  a smoke wisp) and Thornwood the Elder Oak scales (Growth 3, Wild 2: fruit trees, lush crop
  clumps, doubled furrows; briars, ferns, a beast den).
- Ashfen (a Cinder town under Thornwood dominion 2) shows blossom around Cinder houses; call it
  out in "Try this" as "contested faith".

### Step 7. The time-lapse (growth over time, by alignment; section 4.7)

Moving the slider re-derives the example state by month from M3, with these deterministic deltas:
- population compounds monthly: × (1 + 0.002 + 0.003 × the province's effective Growth step), so
  Thornwood land visibly gains houses and often a tier by M40;
- Cinder dominion strength +1 every 6 months in its own provinces, up to 7; one ring of spread
  into neutral provinces every 8 months; Thornwood the same, up to 7;
- Ashfen: Thornwood dominion 2 rising to 5 by M24; Cinder retakes its faith at M40;
- M6: Sunmere's temple finishes (a scaffold M3 to M6); M8: Ashfen's temple;
- M12: Cinder takes 2 independent provinces (bands at once, kits at the next month); Varo at
  6 / 14 HP (bandage);
- M14 to M15: a Cinder army pillages a Thornwood border province (smoke; population −8%; unrest
  50: barricades), which drops a tier and turns "declining";
- M17 to M18: a Cinder priest claims Sunmere (the priest figure and ring, then lit stones);
- M20 to M23: Burn the Fields on a Thornwood province (irregular char patches and three thin
  smoke lines, never a hatch); Kharnath's PD reaches 15 at M20 (stone wall) and 25 at M48
  (towers, gatehouse);
- M24: Ondra becomes the prophet (halo);
- M30: Thornwood takes Ashfen (the band at once, the Thornwood kit at M31);
- M36: Ash Rain on a Thornwood border province (an ash-flake stipple thinning in three steps over
  30 days);
- M60 to M64: a Cinder army besieges Deepmoss (tents in the Cinder banner; walls cracked at M62,
  breached at M64);
- the Morholt battle scar: churned earth M3 to M5, cairns from M6, gone at M15.

Changed provinces re-bake and cross-fade over 600 ms, at most 8 animated per step and the rest
instant (instant under reduced motion). A `Wipe` checkbox previews the M1-should brush wipe from
the dominating or capturing nation's side. The room's season follows the slider's month.

### Step 8. Leader portraits (section 5)

- Write `portraitSVG(c, size, state)` on the 256-unit grid (crown y 23, eyes y 100, chin y 169,
  collar y 200, face axis x 120, facing right), seeded by `rngFor('portrait:11:' + c.id + ':' +
  slot)` per slot:
  - backdrop: the banner darkened 35% with a radial vignette;
  - head shapes (6 ellipses), eyes and brows, nose and mouth at 96 px and up;
  - skin ramps: Cinder #6E6A64 / #8F8C88 / #B9B6B1 with ember-crack marks; Thornwood #6B4A2B /
    #A0785A / #C9A585; independents #8C6A4A / #B08A6A / #D2B293;
  - hair and beards; headgear per type (horned helm, ember hood with a flame clasp, ember
    circlet, tall cowl, ash hood; bark helm with antler stubs, wreath crown, twig circlet, antler
    hood, leaf hood); collars;
  - frame: round for own, round with 8 notches for other nations, a rounded square for
    independents; a 3 px banner band with its keyline; material by rank (oak #8C6A47, bronze
    #8C6A43 with 4 square rivets, brass #B8914A with corner brackets, the god's brass with a 1 px
    #D4B26A highlight and a crown notch, pewter #91A092);
  - the pip ring on a 2 px #1C1A17 ring outside the frame;
  - the gear chip (count and ○ ◆ ★) on the lower right at 48 px and up.
- Demo states: Ondra the prophet (halo, from M24 in the time-lapse); the Ashen Titan the pretender
  (a crowned rig-style stand-in for B.8, the god's frame); Seren, Ondra and the Titan with pip
  rings, Ondra's holy mark; Kesh with the scout and hood badges; Varo wounded at M12; Varo with
  one ◆ item (gear chip "1 ◆") and Ilsa with a notched frame.
- **Personal names:** keep the mockup's names and show them as "Varo, Ash Chieftain".
- **Placements:** the strip at 64 (replacing the letter tile `.face`); outliner rows at 24; the
  commander hover tooltips at 48; the battle report's commanders' fates at 40 (the independent
  captain dead: greyscale with a black corner ribbon); the Ilsa tooltip with its notched frame.

### Step 9. The chrome: approved, with hardware (section 2.8)

- `Chrome: Approved` (default): keep every token; add
  - the top bar's 3 px `--oak-0` #2B231C bevels top and bottom with grain lines #3A2E23 (two
    repeating gradients, at most 1 px, 20% coverage), a 1 px `--brass` #B8914A bottom keyline,
    square brass rivets at both ends;
  - the strip's 6 px oak spine with a brass keyline;
  - the docks' 6 px oak edge facing the map, a 1 px brass line, and 14 px L brass corner brackets
    (2 px #B8914A with a 1 px #D4B26A edge, square tacks) at the two map-facing corners;
  - modals in an 8 px oak frame with brackets; the Codex with a 10 px leather spine #4A3426 and
    square brass stitch marks at 40%;
  - action buttons with a 1 px #B8914A keyline (navigation buttons stay ghosts); tooltips
    unchanged.
- `Chrome: Warm retune (rejected)`: `--chrome-0/1/2` #2E2219 / #3A2B1F / #4A3727, with an inline
  strip in the Look group showing both palettes side by side and the measured failures labelled:
  "Urgent alert 2.66:1, Tide symbol 2.66:1 on --chrome-2 (under 3:1)".
- `Parchment: Report card and Codex`: the battle report card's face and the Codex article in
  #E8DCC2 with ink #1C1A17, dim ink at 70%, ▲ #8A4A12 and ▼ #2F5D73, and a 1 px ink ring on every
  mana symbol there.

### Step 10. Modes read with the detail (section 3.9)

- Outside Ownership, fade the decoration bake out over 150 ms (instant under reduced motion).
  Keep wilds, ritual marks, siege and pillage marks and Wellsprings.
- `fillFor`: tint over the terrain fill desaturated 80% and lifted to L\* 50 with linen (Forest
  #79786B, Hills #7E7767, Swamp #6F7A77); undominated provinces show that base, never #3B3832.
- Replace `heat()`'s stops with #4C5E96, #8170AC, #C4808E, #E6AC6E, #F8E6A6.

### Step 11. Fog (section 3.10)

- Mark the 8 provinces with the largest centroid `x` that border no own province as unexplored:
  the fill under a 4% linen haze (#E8DCC2), no land look; stamps and Far masses as line art
  (#3E3428 on Plains, Farmland, Mountains, Wasteland; #E8DCC2 on Forest, Hills, Swamp), no fill;
  a dotted border; a single sketched hut outline at the seat; population "unknown" in the
  tooltip.
- Mark two explored provinces out of sight: the fill desaturated 10%, the wash hidden, a dotted
  border.

### Step 12. Tokens and paths (section 3.6)

- `badgeSVG` becomes painted wood: the banner fill, a 1 px lighter top edge (the banner +12%
  L\*), a 1.5 px #1C1A17 outline at 70%, a contact shadow ellipse (#000 at 25%, 2 px down);
  independents in pewter #91A092; plates flat.
- At Near, a 40 px procedural standee (a helmeted silhouette in the banner tint) on each own and
  enemy token; an unscouted independent force as a cloaked figure with its strength word.
- The move preview becomes a thread (3 px #F4EEDF with a 1 px #1C1A17 edge, dashed [8, 6]) with
  square brass tacks (6 px #B8914A set as diamonds) and day plates at each step.

### Step 13. Events on the map (section 4.4)

- Morholt: the crossed-blades marker plus churned earth, broken spears and crows (fading by the
  time-lapse as in step 7).
- The siege, pillage, Burn the Fields and Ash Rain marks as step 7 schedules them; Fertile Season
  on Deepmoss from M8 to M14 as sprout motifs and a leaf badge (no sheen).

### Step 14. The portrait gallery (the Portraits control)

A modal with five rows:
1. twelve seeded Ash Chieftains at 64, to judge variety;
2. every Cinder and Thornwood commander type, and an Independent Captain in each of its four
   outfits, at 128;
3. one Ash Chieftain at 256, 128, 96, 64, 48, 40, 24 and 16 (level of detail);
4. one commander in every state at 64: healthy, under 50%, under 25%, prophet, pretender,
   starving, unpaid, holy, gear "2 ★", last seen, dead;
5. frames: each rank material in each allegiance shape at 96.

### Step 15. Vision preview (the Vision control)

Inline SVG `feColorMatrix` filters with the Machado 2009 full-severity matrices (as in
`tests/content/colorMath.ts`) for protan, deutan and tritan, applied to `.app` with CSS `filter:
url(#…)`, labelled "approximate preview".

### Step 16. Map detail Reduced

Terrain stamps at half density, pole motifs off, ambience off; settlements, walls, washes, nation
motifs, scars, marks, wilds and tokens stay.

### Step 17. Ambience (Table Full only)

- The candle flame's brightness ±3% and height ±2% from smoothed value noise at 0.7 to 1.3 Hz;
  the hearth glow ±4% on a 7 s cosine; at most 12 dust motes drifting 2 to 4 px/s in the window
  light, over the room and the oak only; the hourglass's grain stream.
- Frozen at the mean (motes removed) under reduced motion; stopped while `document.hidden`, while
  a modal is open, and while no table pixel is on screen.

### Step 18. Screenshots

Refresh `shot-desktop.png` (start zoom, Ownership) and add: `shot-lean.png` (leaning back, Table
Full), `shot-near.png` (Near over Kharnath: houses, walls, motifs, pole motifs), `shot-wild.png`
(the Ashspine hovered with Varo selected and the bent path), `shot-m40.png` (time-lapse M40),
`shot-m70.png`, `shot-portraits.png` (the gallery), `shot-pop-mode.png` (Population mode:
decoration off, wilds on), `shot-dominion.png`, `shot-fog.png`, `shot-chrome-ab.png` (both chrome
options), `shot-deutan.png`, and `shot-phone.png`.

### Step 19. Check before handing back

- No console errors; no `Math.random`.
- At the start zoom on 1280 × 720 and 1440 × 900: no label overlapped by a token, standee, stamp,
  house or motif; the oak band and the iron straps visible; the props' inner thirds visible.
- Panning stays smooth (the bakes are blitted, not redrawn).
- Reduced motion stops every ambient motion and makes repaints instant.
- Every old interaction still works (the constraints' list), and the phone layout still opens on
  Varo.

---

## Appendix A. Risks

| Risk | Mitigation |
|---|---|
| Wilds make some seeds slow or fail | Measured: 0 failures on 660 maps; seed backtracking; the time test (1.9) |
| 3- and 4-nation balance drops with wilds | `balanceCandidates` 10, measured to restore it (R12) |
| The AI or retreat behaves worse around wilds | No code reads geometry; commit B re-runs 20 AI games and records the matchup and retreat deaths |
| Detail clutters the map | Box exclusion, coverage caps, the extended label test, decoration out of data modes, Map detail Reduced |
| Colors merge for color-blind players | Every new color and state is in the palette test (3.11), including the joint fog and wash states |
| Bakes exhaust memory or stutter on Large maps | Three layers, whole-sheet Mid tiles, lazy Near tiles, staggered re-bakes, the 96 MB budget and the Playwright smoke |
| Art leaks fogged information | One projection (`provinceView`) for tooltip, modes, map art and portraits; the fog guard covers `mapLook` and portraits |
| A mid-month reload changes the map | Slow keys in the UI block, with the day-17 test |
| The art pass eats the schedule | The time box, the fixed cut order, the M1 floor, Off paths, owner rasters never on the critical path |
| Raster art drifts in style or color | One anchor per family, complete sets only, intake checks, the contact sheet, procedural fallbacks |
| Brass or embers read as mana colors | Aged brass only, never round, 2 px from any symbol; ember tones only on Cinder things |

## Appendix B. Files

- This design: `wartable-design/final.md` (assembled from `wartable-design/final-parts/`).
- New measurements: `wartable-design/final-calc/` (`regions-final.ts` with `regions-final.out`
  and `regions-final-b.out`, and the first run `regions-final-v1*.out`; `colors-final.ts`,
  `colors-extra.ts`, `joint-caps.ts`, `joint-caps2.ts`, `grounds-states.ts`, `fog-grounds.ts`,
  `modes-lift.ts`, `ramp-lift.ts`, `ramp2.ts`, each with its `.out`).
- Inputs: `owner-direction.md`, `proposal-immersion.md`, `proposal-instrument.md`, `judge1.md`,
  `judge2.md`, `research-tabletop.md`, `research-mapdetail.md`, `research-portraits.md`, the
  judges' and proposals' calc folders, the immersion sketch (`sketch/`), the staged docs
  (`/home/user/fm-docs/docs/`), the repository at `7a524b8`, `docs/12-battle-presentation.md`,
  `pretender-design/final.md`, `units-items-design/final.md`, `ui-design/spec-final.md`, and the
  mockup `ui-mockup/game-screen-v1.html`.

