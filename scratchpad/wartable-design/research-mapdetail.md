# Research: map detail, impassable terrain, and map art that changes over time and by alignment

This research is for the war table art direction. The owner wrote on 2026-10-21 (`owner-direction.md`):
"i would like more detail on the map, while this is mostly an art pass, i want to make sure the maps have
some impassible terrain that is noticeable, the detail view on the lands are great, some art assets to
show the growth over time would be ideal, based on alignment too!"

This file covers map detail, impassable terrain, and growth by alignment, plus the PixiJS 8 budget for
all three. Portraits and the tavern are covered elsewhere.

**Evidence markers.**

| Marker | Meaning |
|---|---|
| **[V]** | Read this session in the primary source: GitHub-hosted code and docs (Azgaar, O'Leary, Red Blob Games, MapNuke, ThymeWorld); the Dominions 6 manual source (github.com/dmacguigan/dom6-manual, chapters 02, 05, 08 and 14, fetched or read from the identical `../dl-manual/` copy); the PixiJS 8.22.0 docs inside the installed package (`node_modules/pixi.js/skills/**`); FM at commit 3addf97 and the Phase 7 worktree `/home/user/fm-p7f`. |
| **[X]** | A search-engine extract; the page was not opened. In this session WebFetch reached only github.com and raw.githubusercontent.com. Every other host failed DNS (ENOTFOUND): blogspot, mewo2.com, redblobgames.com, illwinter.com, paradoxplaza.com, paradoxwikis, fandom, steamcommunity.com, pixijs.com, acoup.blog. Wiki and forum claims come from the community, not from the developers. |
| **Analysis** | Reasoning about FM. It cites FM files. |

Keys such as A1 and D2 resolve to URLs in section 7.

---

## 0. Findings in brief

1. **Map detail comes from stamps scattered by blue noise inside each polygon.** Azgaar uses Poisson-disc
   points per cell, one spacing quadtree per icon pool across cells, sizes by height, and draws in
   bottom-edge order (A1 [V]). MapNuke adds an edge threshold and large mountain "centerpieces" (W5 [V]).
   FM already has a seeded `poissonDisc` for convex outlines (`src/mapgen/voronoi.ts`), and its cells are
   convex.
2. **Azgaar's relief is unseeded** (`Math.random`; A1 [V]). Copied as is, it re-rolls on every reload. FM
   must seed each stamp from (map seed, province id, layer).
3. **Borders can wobble without changing adjacency.** Red Blob's noisy edges are "constrained to a
   quadrilateral", so neighboring edges never cross (R1 [V]). FM's "the drawn map and the graph always
   agree" holds if hit tests use the same noisy polygon.
4. **Relief reads as hand-drawn when it is strokes and overlapping peaks.** O'Leary strokes a random share
   of slopes (M1 [V]). Here Dragons Abound builds mountains tallest first, rejects heavy overlap, and
   hatches the unlit side before the outline (H1 to H4 [X]).
5. **Games make terrain impassable in three ways:** blocked borders (Dominions; D1 [V], D6, D7 [X]);
   blocked regions (EU4, CK3, Imperator, Endless Legend 2; E1, K1, I1, EL2 [X]); or very costly terrain
   (AoW4, 16 move points against 6; AW1 [X]).
6. **It is noticed when it has its own silhouette and no owner color.** Dominions draws mountain chains on
   blocked borders (D7 [X]) and color-codes connections on Ctrl-8 (D1 [V]). EU4 leaves wastelands grey or
   in the majority neighbor's color (E1 [X]).
7. **It makes chokepoints, and it risks walling in a capital.** CK3 and Total War play around chokepoints
   (K1, TW1 [X]). ThymeWorld leaves gaps in its ridges "so no capital is walled in" (D9 [V]).
8. **For FM the cheapest fit is a ridge: a shared border drawn as mountains and left out of `neighbors`.**
   Twelve files read `neighbors` (seven sim, five AI). They, and mapgen's fairness checks, would all
   respect ridges with no code change (2.5).
9. **Growth shows as buildings added outward from a center.** Imperator goes from cluster to sprawl
   (G1 [X]), Civ VII cities "grow out of their origin hex" (G5 [X]), and AoW4 has a sprawl per culture and
   tier (G8 [X]). The pitfalls are abrupt swaps (Civ VII, G5), oversized models (EU5, G3) and growth that
   is hard to read (Humankind, G7).
10. **FM's population barely moves.** Over 70 months, the M1 target game length, a province grows +15% at
    neutral, +115% at Growth +3 and −39% at Rot −3 (docs/01 §3). Growth art must also count temples,
    labs, PD, Wellsprings and dominion strength.
11. **Alignment repaints land through a layer separate from ownership.** Warhammer's Chaos corruption
    turns land grey, volcanic and dead-forested (T1 [X]). Dominions turns forests and farms into plains,
    and plains into wasteland, at Death 4+, and plains into forest or farms at Growth 4+ (D2 [V]). Fall
    from Heaven 2's hell spreads like creep (FF1 [X]), and Warcraft III's blight spreads around buildings
    (WC1 [X]). Warhammer 3 had to smooth blocky corruption edges, and players modded corruption down
    (T5, T6 [X]).
12. **Pixi 8 carries this if static layers are baked.** A batch breaks on a change of object type,
    texture source (past ~16), blend mode or topology, and textures over 4096 px fail on some mobile GPUs
    (X1 [V]). A 105-province map is 2074×1296 px at the Near threshold and 4148×2592 at device-pixel-ratio
    2, so it needs tiling. About 6,300 stamps is ~3% of a 200k-sprite benchmark (X7 [X]).

---

## 1. Procedural fantasy map rendering at strategy scale

### 1.1 What the reference generators do

**Azgaar's Fantasy Map Generator (FMG), relief icons** (A1 to A6 [V])

- **Rules.** Each land cell is checked against ordered rules: snowy mountains (height 71 to 100,
  temperature ≤ −1), mountains (71 to 100), hills (50 to 70). Otherwise the cell uses its biome's
  weighted pool of "lowland relief", below height 50. Water and river cells get no icons.
- **Placement.** Positions are Poisson-disc samples inside the cell, with 3 tries each, and radius
  `2/(density/100)/styleDensity`. One quadtree per pool spans all cells, so the spacing holds across
  borders. Cells are visited in shuffled order, because sparse relief "would otherwise line up along the
  cell scan".
- **Size and order.** Rule icons grow with height, `min + 0.8 × (h − hmin)`, clamped. Pool icons are 16
  to 20 units. Icons are drawn sorted by bottom edge (`y + s`), so nearer ones cover the feet of those
  behind.
- **Storage and styles.** Icons are plain JSON `{type, variant, x, y, s}`. Style sets (Simple, Colored,
  Gray, Illustrated) restyle without regenerating.
- **No seed.** The shuffle, the sampler, the picks and the variants all use `Math.random`.
- **Labels.** A label with path points becomes an SVG `<textPath>`, and state labels follow an
  auto-fitted path.
- **Performance.** Hiding the blurred halos along state borders is the first speed setting.

**Martin O'Leary's generator (Uncharted Atlas)** (M1, M2 [V])

- **Hill shading is strokes, not fills.** On each land vertex, a stroke is skipped if
  `|slope| < U(0.1, 0.4)`. Otherwise it runs along the slope, with its length scaled by mesh spacing.
  Steep spots get up to four short jittered strokes. The result reads as hand-drawn hachure.
- **City placement.** Score = √(water flux), minus edge penalties, minus `0.02/distance` to each
  existing city.
- **City labels.** Each city tries four boxes (right, left, above, below). The penalty is +100 for
  leaving the map or covering a label or marker, and +1 for each river, coast or border point inside the
  box.
- **Region labels.** Every vertex is scored: near the territory's center scores up, outside it costs
  −3000, and overlapping an earlier region label costs −20000.
- **Borders.** Chained Voronoi edges smoothed with `0.25·prev + 0.5·cur + 0.25·next`.

**Red Blob Games, mapgen2 and mapgen4** (R1 to R4 [V])

- **Noisy edges.** "A variant of midpoint subdivision that keeps the lines constrained to a
  quadrilateral". The quadrilateral is the edge's two endpoints plus the two cell positions. Each split
  point lies in `[0.5 − a/2, 0.5 + a/2]` between the cell positions. Recursion stops below a set length,
  and the caller supplies the random source. Noisy edges cannot cross.
- **Draw order.** Ocean; biome fills over the noisy polygons; a stroke on every side, to hide hairline
  gaps; coasts and rivers with round caps; lighting (per-triangle normal against a fixed light,
  composited `soft-light`); a tiled 100×100 noise composited `soft-light` then `hard-light`, as paper
  grain; and one biome icon per interior region, sized to its inner radius.
- **mapgen4's aim.** It aims to "look pretty instead of generating realistic terrain".

**Here Dragons Abound (Scott Turner's blog)** (all [X]; the host did not resolve)

- **Mountain placement (H1).** A share of the highest land becomes mountains. A symbol is skipped when
  another lies within a distance tied to its size, so that distance sets the density. Placement was
  later reordered so the largest go first.
- **Mountain style (H2 to H4).** Ranges are built tallest first, and a mountain overlapping earlier ones
  beyond 5 to 35% is dropped. Proportions run from about 2.25 to 5, with the tallest rarer and flatter.
  The unlit side is hatched roughly perpendicular to the top line, before the outline is drawn.
  Outlines are heavier near the peak, and the sides get a slight hand jitter.
- **Forests (H5 to H7).** Either cloud-edged masses, with clipping gaps refilled and blurred, or a solid
  mass ringed by single trees whose back-edge "half trees" drop their bottom outline. The tree symbols
  are procedural.
- **Labels (H8).** Labels are placed by simulated annealing. Coastal labels sit in the water along a
  smoothed copy of the coast, and coast segments push labels away.

**Stamp tools and MapNuke**

- **Wonderdraft.** The mountain brush drops symbols as you drag. Too fast or too dense, and the peaks
  "look like a jumbled mess" (W1 [X]). Each symbol carries a "collision or exclusion radius around the
  asset's pivot point" (W2 [X]).
- **Inkarnate.** Separate Mountains, Trees and Terrain packs; regional and parchment styles; Scene Stamps
  and Brush Tool 2.0 (W3, W4 [X]).
- **MapNuke** (open source, Dominions 5 and 6; W5 [V]) scatters art-style sprites per province. Its
  controls are a Cull Chance (density), a Province Edge Threshold ("How close to the edge of the
  province can sprites be?"), a Spawn Chance per sprite, and large Centerpieces for caves and mountains.

**Hachures.** Short strokes along the steepest slope, thicker and denser where steeper, with flat ground
left empty. Dufour's partial hachuring drops the northwest sides of hills for stronger relief (C1, C2 [X]).

### 1.2 Level of detail by zoom

- **CK3** has three zoom levels (P1 [X]): a paper-style map "for easy overview and stylish screenshots";
  then the political map; then terrain, with county names and no realm colors. A later update blended
  the transitions (P2 [X]).
- **FM's bands** are Far, Mid and Near, set by the median province diameter: under 70, 70 to 180, and over
  180 px. No information may be zoom-only (spec-final 2.10.2 and 2.10.3 [V]). Decoration is not
  information, so stamps may thin by band.
- **On a war table**, the Far band is the painted map lying on the table (analysis).

### 1.3 What FM should take (analysis)

| # | Technique | From | FM version |
|---|---|---|---|
| 1 | Blue-noise stamps per province | A1, W5 | `poissonDisc(rng, outline, bounds, radius, tries)` from `src/mapgen/voronoi.ts`, run on the convex cell. The rng is seeded from (map seed, province id, layer). A pure function, kept in a guarded pure folder like the battle track's `src/present/**`. |
| 2 | Inside the cell and off the band | W5 | Inset the cell by the band width plus a margin. Ownership bands sit on the inner border (docs/09). |
| 3 | A label and badge core | M1 | No tall stamps in a disc around `center`, where labels and badges anchor (spec 2.10.3). Flat stamps may pass under. Labels then never fight stamps at any zoom. |
| 4 | Size, order, overlap | A1, H2 | Size from an elevation rank (mapgen could store it) or a seeded value. Bottom-edge order. Massifs tallest first, with at most about 30% overlap. |
| 5 | Painted edges | R1 | Render-only noisy edges with a seeded source. Adjacency stays on straight borders. Hit tests use the noisy polygon. |
| 6 | Relief as strokes | M1, C1, H4 | Hills: slope strokes. Mountains: overlapping peaks with a hatched unlit side. Ridges (section 2): dense peak chains. |
| 7 | Paper grain and light | R2 | Bake once. `soft-light` is an advanced, filter-based blend mode in Pixi (pretender research-vfx 2.1). |
| 8 | Level of detail | P1 | Far: the baked painted map only. Mid: about half the stamps, plus settlement silhouettes. Near: everything, including scale motifs. |
| 9 | One prop kit | battle final.md S2 | Battle backdrops already scatter seeded tufts, rocks, reeds, dead trees, crop rows and a windmill. The map should use the same parts. |

---

## 2. Impassable terrain: rules and depiction

### 2.1 Game by game

**Dominions 6** (D1 [V] unless marked)

- **Rules.** "There are two special terrain types which are properties of the borders between provinces
  rather than the provinces themselves: rivers and mountain passes." A river can be crossed only when
  both sides are Cold +1 or more (frozen); a pass is open only when both sides are Heat +1 or more.
  Fliers and floaters ignore both; swimmers also ignore rivers, and Mountain Survival also ignores
  passes. Map files use `#neighbourspec`: 0 standard, 1 pass, 2 river, 4 impassable, 8 road (D6 [X]).
  In Dominions 5, impassable borders "can only be utilized for spell targeting purposes" (D5 [X]).
  Perpetual Storm makes "all mountain passes … unusable" (D3 [V]).
- **Shows.** Mountains are drawn between provinces joined by a pass or an impassable border (D7 [X]).
  Ctrl-8 color-codes connections (D1 [V]). Winter is drawn on the map in Dominions 5 (D11 [X]); in
  Dominions 4, "rivers freeze over, mountains snow in" (D12 [X]).
- **Play.** Players report "quite a few river or mountain based chokepoints", want more, and note that
  fliers bypass them (D8 [X]). ThymeWorld places "mountain-pass ridges with gaps, placed by the balancer
  so no capital is walled in" (D9 [V]).

**Europa Universalis IV** (E1, E2 [X]). Wastelands "cannot be colonized or traversed". They are grey;
optionally a wasteland takes the color of a nation owning over half its bordering provinces, so the map
has no holes, and it stays impassable. A 2016 diary added a wasteland inside a Norwegian mountain range
to make the area easier to defend.

**Crusader Kings III** (K1 [X]). Impassable terrain marks areas too empty for a county: small mountain
provinces around Bohemia, and the Arabian and Syrian deserts. Armies cannot cross it, so it makes
chokepoints to push through or route around. Most terrain should read from the map without tooltips.

**Imperator: Rome** (I1 [X]). Sicily has 23 cities and "4 impassable mountain range areas". The developers
said this makes campaigns more interesting.

**Civilization VI** (CV1, CV3, CV4 [X]). Mountains are impassable. A Mountain Tunnel (Chemistry; built by
Military Engineers) is a portal between exits in the same range. One player was landlocked by mountains.

**Endless Legend 1 and 2** (EL1, EL2 [X]). The first game's design document says "mountains, cliffs, lakes
and oceans are used as natural frontiers between regions". Endless Legend 2 lists ridges, wastelands and
oceans as impassable.

**Humankind** (HK1, HK2 [X]). Every tile has an elevation. A difference of 2 or more makes a cliff, which
blocks movement and sight. Gentle slopes can be climbed.

**Age of Wonders 4** (AW1, AW2 [X]). Mountain, Stalagmites and Cliff tiles cost 16 move points against 6,
out of 40: costly, not blocked. Lava blocks everything, fliers included.

**Total War: Warhammer II** (TW1, TW2 [X]). Forts are "hyper defensible positions usually found in
mountain passes or other key locations". One critique notes that gates guard chokepoints but cannot be
fully invested.

### 2.2 Three models

| Model | Examples | Pros | Cons |
|---|---|---|---|
| (a) Impassable border (ridge) | Dominions `#neighbourspec 4`; ThymeWorld | Every cell stays playable. A chain drawn on the border reads strongly, and gaps read as passes. | A lone ridge looks arbitrary unless it is heavy and chained into ranges. |
| (b) Impassable region (massif) | EU4, CK3, Imperator, Endless Legend 2 | The most noticeable: a big unowned mass that can be named. | Uses map area. Needs cells beyond the province count, and a new cell kind for hover, fog and labels. |
| (c) Very costly terrain | AoW4; FM Mountains today (9 days at speed 2) | No new rules. | Not impassable, which is what the owner asked for. |

### 2.3 What makes it noticeable

1. **Its own silhouette, not just a color.** Peaks in Civ VI, chains on borders in Dominions (D7 [X]), an
   unowned grey mass in EU4 (E1 [X]).
2. **No ownership color on it.** EU4 leaves it grey, or uses the majority owner's color to avoid holes
   (E1 [X]). In FM, ownership bands (docs/09) should stop at a ridge.
3. **An overlay on demand.** Dominions has Ctrl-8 (D1 [V]). FM's move targeting already hatches
   unreachable provinces (spec 2.10.2 [V]), and a path preview that bends around a ridge teaches the
   rule.
4. **Gaps that read as passes,** as in ThymeWorld (D9 [V]), perhaps with forts in them, as in Total War
   (TW1 [X]).
5. **A name** ("the Ashspine"), placed with O'Leary's region-label scoring (M1 [V]) or Azgaar's path
   labels (A3 [V]).

### 2.4 What it does to strategy

- **Gains.** Chokepoints and fortification (K1, E2, TW1, D8 [X]), and shorter fronts, which matter when
  capitals are only 6 hops apart on 60 provinces (docs/01 §2).
- **Risks.** Walled-in starts, which ThymeWorld guards against (D9 [V]); one Civ VI player was landlocked
  (CV4 [X]). Fliers make ridges moot (D8 [X]): FM M1 has flying units (Fire Sprite, Hornet Swarm, Great
  Wyrm; docs/03, docs/05) but no flying exception in movement.
- **Dynamic passes.** Dominions opens and closes passes through the Heat scale and Perpetual Storm (D1,
  D3 [V]). FM has no temperature scale; a border-kind enum leaves room for M2 rituals.

### 2.5 Fit with FM's code and invariants (analysis)

**Who reads adjacency today.** `MapProvince.neighbors` is the only adjacency.

| Area | Files |
|---|---|
| Sim (seven files) | `movement.ts` (findPath; pathsFrom in fm-p7f), `commands/army.ts` (path validation), `dominion.ts` (spread picks a neighbor), `conflict.ts` (retreat), `selectors.ts` (fort materials), `rituals.ts` (`withinHops`), `visibility.ts` |
| AI (five files, `/home/user/fm-p7f/src/ai`) | `assess`, `army`, `defense`, `magic`, `war` |
| Mapgen checks (`validate.ts`, `placement.ts`) | connectivity; at least 2 neighbors; capital distance; 2-hop ring balance; Wellspring fairness |

**Ridge option.** Keep `neighbors` as the passable neighbors, and add `ridges: ProvinceId[]` for shared
borders drawn as mountains.
- Every reader above then respects ridges with no code change, and the mapgen checks run on the passable
  graph.
- The rule reads as a wall: no movement, dominion spread, sight, ritual reach or fort collection across
  it. That is one sentence for the player.
- Dominions' variant, where spells still cross (D5 [X]), would need a second adjacency and a choice per
  rule.
- docs/01's "the drawn map and the graph always agree" would become "drawn borders = `neighbors` ∪
  `ridges`, with ridges drawn as mountain chains".

**Massif option.** Generate `count + k` cells and keep k of them out of `provinces`. This touches the exact
province count, the geometry, labels, hover and fog: more noticeable, and more work.

**Constraints the research supports.** Run ridges along Mountains and Hills cells (8% and 14%,
`TERRAIN_SHARES`), leave gaps in every chain, never cut off a capital's 2-hop ring, measure balance and
Wellspring fairness after the ridges are placed, and check `minNeighbors` on passable neighbors.
Mountains stay passable at 9 days, so the map has both slow and blocked terrain.

---

## 3. Settlement growth visuals

### 3.1 Game by game

- **Imperator: Rome.** Buildings multiply "from a cluster at the center of a territory … to a sprawling
  mess of buildings filling the entire territory". This is framed as feedback that rewards building big
  cities (G1 [X]). A territory holds "a city (or village, or metropolis)" (G2 [X]).
- **EU4 and EU5.** No source shows EU4 changing city models with development; its city art comes from
  mods (G3 [X]). EU5's map visuals do change with development, and its town models were once scaled down
  for being too large (G3 [X]).
- **Civ VI.** No source shows the city center changing with population; a fan proposal asks for it. The
  palace varies by era and region (G4 [X]).
- **Civ VII** (G5 [X]). Firaxis aimed for "more organic and cohesive looking cities", built from rural
  and urban plots. Previews say cities "slowly grow out of their origin hex with new types of buildings
  and public squares", and that architecture changes with each Age. Players dislike house models that
  swap almost all at once at the Age change.
- **Endless Legend.** 13 factions with at least four district graphics each. Players credit this with "a
  sense of scale, magnitude, and achievement" (G6 [X]).
- **Humankind.** Districts are the city's physical form, growing out from a plaza. Players worried that
  developed tiles were hard to tell apart (G7 [X]).
- **AoW4** (G8 [X]). A patch "Added City Sprawl to all Culture Cities and City Tier Levels". Each culture
  has its own Town Hall. A city gains one province per population, up to about 15.
- **Total War** (G9 [X]). A large Warhammer III mod notes that most settlements show only their "final
  form", with no art per tier. Attila lets minor settlements gain walls.
- **Dominions 6.** "Forts are structures which exist on the map and can be upgraded", from palisades to
  citadel (D4 [V]). Dominion is shown as candles (D2 [V]). There is no sprawl art.

### 3.2 Patterns

1. **Count, not just size.** More buildings means a bigger place (Imperator). This reads at every zoom and
   is cheap to draw with stamps.
2. **Outward from a center** (Civ VII, Humankind, Endless Legend). A fixed seeded order adds new pieces
   without moving the old ones.
3. **Tiers × culture kits** (AoW4, Endless Legend). The art cost multiplies, which is why large mods skip
   art per tier (G9).
4. **Pitfalls and their fixes.** Abrupt swaps (Civ VII): small, gradual steps. Oversized models (EU5): a
   size cap tied to the label and badge budget. Hard-to-read growth (Humankind): one strong cue per step.

### 3.3 What drives growth in FM (analysis)

**Population barely moves.** Monthly growth is `pop × (0.002 + 0.003 × growthScale)` (docs/01 §3). Over
the M1 checklist's 70 months (docs/09-balance) the factor is 1.002^70 ≈ 1.15 at neutral, 1.011^70 ≈ 2.15
at Growth +3 and 0.993^70 ≈ 0.61 at Rot −3. A neutral province barely crosses one of Population mode's
five log-scale steps (spec 2.10.2).

**Signals that do change over a game.** These are fields of `ProvinceState` (`src/sim/types.ts`) or of
the map. Most are player investments, which Imperator rewards too (G1 [X]):

| Signal | Field or rule |
|---|---|
| Population relative to the terrain's starting range | `pop`, `TERRAIN.startPop` |
| Temple (200 gold, 30 days) and lab (300 gold, 30 days); docs/01 §7 | `buildings` |
| Construction under way | `construction` |
| PD level, 0 to 30 (6,975 gold in all) | `pd` |
| Fort (capitals in M1; built forts in M2) | `buildings` |
| Claimed Wellspring | `wellspringClaimedBy` |
| Dominion holder and strength (0 to 10), spread monthly | `dominion` |
| Decline | `unrest`, `siege`, pillaging armies |

**A development stage as a pure function.** `stage = f(pop ratio, buildings, pd, Wellspring, dominion
strength)`. Settlement stamps are the first k points of a fixed, seeded, center-out sequence. Growth
appends points; decline removes the newest. Nothing reshuffles.

**Owner kit.** The owner's kit draws the buildings: Cinder Horde ash-grey and jagged, with scale and flame;
Thornwood bark, leaf and living wood; Independents a neutral kit. This follows docs/09's per-nation part
overrides. Dominion paints the land (section 4), so a province whose kit and paint disagree reads as contested.

---

## 4. Map change by alignment

### 4.1 Game by game

**Total War: Warhammer I to III.** Chaos corruption makes the land "grey volcanic", with lava pits and
dead forests; at high levels battle maps turn reddish and ash falls (T1 [X]). Vampiric corruption also
changes the map, and in Warhammer I it excludes Chaos corruption (T2 [X]). Skaven corruption is subtle,
burrows and warpstone with no change to terrain color (T3 [X]); Warhammer III adds warpstone cracks, and
splits Chaos into Undivided, Khorne, Nurgle, Tzeentch and Slaanesh, which can all coexist at full
strength (T4 [X]). Patch 4.2 smoothed the "blocky" corrupted borders, which had been "an eyesore"
(T5 [X]), and mods disable or soften the terrain effects (T6 [X]).

**Age of Wonders 4.** A Chaos spell makes one province desolate at a time; Nature spells restore land or
plant forest, but not on mountains, desolate land, lava or ice (AW3 [X]). "Sunless" is a feature that
stacks with terrain and spreads back after removal (AW4 [X]). Primal Fury terraforms land toward an
animal's biome, and players value it most around the capital (AW5 [X]).

**Warcraft III blight** (WC1, WC2 [X]). Each finished Undead building spreads blight: large patches for
the Necropolis and Haunted Gold Mine, small ones for the rest. Undead heal on blight, and most of their
buildings need it. Destroying the source and building there clears it, but the trees stay sickly.

**Fall from Heaven 2 hell terrain** (FF1 to FF3 [X]). The developer diary describes hell spreading like
Zerg creep: grassland becomes Broken Lands, plains Fields of Perdition, desert Burning Sands. It spreads
through Ashen Veil land first, then into unowned and evil land as the Armageddon Counter rises
(thresholds vary by version). Razing the Ashen Veil holy city, defeating the Infernals or killing
powerful demons lowers the counter.

**Dominions 6** (D2, D4 [V]; D13, D14 [X]).
- **Dominion.** White candles for friendly dominion, a yellow border for its reach, dark candles for
  enemy dominion on Ctrl-3. Dominion "is not related to military control".
- **Scales.** Shown "by icons/text in the main province window"; each turn they drift toward the local
  dominion's values (D13 [X]).
- **Extremes.** Death 4+: "Slowly turns forests & farms into plains and plains into wastelands."
  Growth 4+: "Slowly turns plains into forests or farms (order scale required for farms)." Growth 5:
  "Slowly turns farms into forests."
- **Seasons.** Summer is one step warmer and winter one step colder, and winter is drawn on the map
  (D11 [X]).

So Dominions shows scales as candles, seasonal snow and slow change at the extremes, not as paint per
scale.

### 4.2 Patterns

1. **A layer separate from ownership paints the land** (corruption T1, dominion D2). FM has the same
   split: the dominating nation's scales apply, scaled by strength (docs/01 §12).
2. **Intensity follows strength:** candle counts (D2), corruption levels (T1).
3. **Real terrain conversion only at extremes:** Dominions 4+ (D2), the Fall from Heaven counter (FF1). In
   FM that would be an M2 sim rule, not art.
4. **Edges matter** (T5), and **heavy paint gets modded down** (T6): blend across borders, keep tints
   moderate, carry identity in shapes.
5. **Shape beats hue.** Skaven corruption without a color change went unnoticed (T3); blight comes with
   dead trees (WC1). FM's palette rule agrees (CIEDE2000 ≥ 20, ≥ 12 under simulated color blindness;
   docs/09).

### 4.3 FM mapping (analysis; the motifs are proposals)

**Inputs.** The dominating nation and its strength, and `effectiveScale = round(nationScale × strength /
10)` per axis (−3 to +3, including the Wellspring step; docs/01 §12, docs/05). Independents sit at 0.
Steps 1, 2 and 3 take about 15%, 35% and 60% of a province's stamp budget.

| Pole | Ground decal or tint (light) | Shape stamps (carry the meaning) |
|---|---|---|
| Order | tidy field rows | straight hedges, milestones, roadside shrines |
| Turmoil | ash smudges | burnt roofs, overturned carts, smoke wisps |
| Lore | faint glyph rings | standing stones, small towers |
| Fury | scorch patches | war cairns, torn banners |
| Growth | lusher, warmer green | blossom clumps, extra trees and crops |
| Rot | grey-green wash | dead trees, fungus rings, bones |
| Wild | overgrowth over fields | ferns, briars, beast dens |
| Artifice | quarry scars | mills, chimneys, stone walls |
| Sanctity | pale stone | wayshrines, a glow at temples |
| Dread | dusk mist | gibbets, crow flocks |

**Rules.** Shapes first, so the meaning survives color blindness. Cap the tint, so that mode tints
(about 70% over a desaturated fill), bands and badges still read (spec 2.10.2). Blend decals across
borders over one stamp radius. Derive from current state only, and re-bake a province only when its
inputs change: dominion spreads on a month's last day (docs/01 Implementation decisions), and buildings
finish on known days. Share the battle track's season rule (frost in months 11 to 2; battle final.md S2)
as a light snow decal, as Dominions does (D11 [X]).

---

## 5. Performance for a 2D WebGL map (PixiJS 8.22)

### 5.1 Engine facts (X1 to X6 [V], installed 8.22.0 docs)

- **Batching (X1).** A batch breaks on a change of object type, texture source (past the per-batch limit,
  typically 16), blend mode or topology. Group stamps by type, in one or two atlases.
- **`cacheAsTexture` (X1).** It bakes a subtree into one texture, for static content; call
  `updateCacheTexture()` after a change, avoid toggling it, and cache nothing over 4096×4096. Textures
  over 4096 px fail on some mobile GPUs.
- **Render groups (X2).** `isRenderGroup` moves a stable subtree's transform to the GPU. Use one per
  subsystem (for example the world), not nested and not one per entity.
- **ParticleContainer (X3).** It draws "hundreds to tens of thousands of lightweight sprites in a single
  draw call". All particles share one base texture source, and only `position` is dynamic by default. It
  needs a `boundsArea`, or culling hides it.
- **Graphics (X1, X4).** Graphics under about 100 points batch like sprites; complex ones should go
  through `generateTexture`. A `FillPattern` with `textureSpace: 'global'` tiles one seamless texture
  across shapes.
- **Text, culling, SVG (X1, X5).** `BitmapText` for changing values (canvas `Text` re-renders on each
  change). `CullerPlugin` costs CPU; use it when GPU-bound. An SVG loads as a texture (rasterized once,
  batched) or as a shared vector `GraphicsContext`.
- **Context loss (X6).** WebGL restores itself after `webglcontextrestored`. I infer that baked textures
  must be regenerable from state, which is the same rule the battle track sets for its decals (battle
  final.md point 6).
- **Benchmark and limits.** 200,000 sprites in a container, or 1,000,000 ParticleContainer particles, at
  60 fps on one M3 laptop (X7 [X]). A 4096 max texture size is near-universal; 8192 is about 85 to 95%,
  and far lower on Android (X8 [X]).

### 5.2 Numbers for FM

These come from `MAPGEN.provinceArea = 6400`, `aspect = 1.6` and `mapDimensions`. A province's equal-area
diameter is 90.3 units, so the Near band (180 px) starts at 2 px per unit.

| Provinces (example) | Map units | px at 2 px/unit | At device-pixel-ratio 2 | RGBA bake |
|---|---|---|---|---|
| 40 (Small, 2 nations) | 640 × 400 | 1280 × 800 | 2560 × 1600 | 4.1 MB |
| 60 (Medium, 2) | 784 × 490 | 1568 × 980 | 3136 × 1960 | 6.1 MB |
| 85 (Medium, 3) | 933 × 583 | 1866 × 1166 | 3732 × 2332 | 8.7 MB |
| 105 (Large, 3) | 1037 × 648 | 2074 × 1296 | 4148 × 2592 (over 4096: tile) | 10.8 MB; 43 MB at ratio 2 |

**Stamp budget (analysis).** A province is about 25,600 px² (about 160 × 160) at the Near threshold,
which fits roughly 150 trees of 16 px at a 12 px Poisson radius. Proposed counts: forests 40 to 60, plains
10 to 20 tufts, settlements 3 to 25 buildings by stage. Worst case: 105 × 60 ≈ 6,300 sprites, about 3% of
the benchmark (X7 [X]). Fill rate and overdraw are the real limits, so static layers should be baked.

**Layer plan (analysis).**
1. **One static bake per zoom band.** Fills (a seamless `FillPattern`), noisy borders, hachures, ridges,
   terrain stamps and scale motifs. At most 4096 px per side, tiled 2×2 beyond that. Dirty tiles are
   re-rendered when a province's inputs change, staggered across frames (X1).
2. **Live overlay,** in spec 2.10.1 order: mode tints, bands, labels (BitmapText for numbers), badges,
   path previews, selection.
3. **Effects:** particles in a ParticleContainer with one atlas.

docs/06 targets "Map render: 60 fps at 1080p with all provinces and 100 army markers". With the bake,
each frame costs about one quad per tile plus the overlay.

**Determinism.** Each stamp's position, variant and size comes from an rng keyed by (map seed, province,
layer). A bake is a pure function of state and band, so the map is identical after a reload, a lost
context or loading a save.

---

## 6. Harmony with the other tracks (analysis)

- **Battle presentation** (`../battle-design/final.md`). The backdrops darken the docs/09 terrain fill by
  25%, scatter seeded props and add seasonal frost. The map should share those parts and the season
  rule, so each province looks like its battlefield. Pure derivations belong in the guarded
  `src/present/**`.
- **Pretender design** (`../pretender-design/design-draft.md` N6, home terrain). Terrain matters in
  battle, so each terrain must look distinct at Mid zoom.
- **docs/09 delivery rule.** Placeholder art is SVG, so stamps can be SVGs rasterized into an atlas at
  load (X5 [V]). Raster art the owner generates can then replace atlas frames one at a time, with the
  manifest keeping the fallbacks.
- **UI spec** (2.10.3). Labels are at most 96 × 30 px and never overlap badges. The `layoutMapLabels`
  test should also check that no tall stamp sits under a label or badge box.

---

## 7. Sources

**Here Dragons Abound** (all [X]; the host did not resolve)
- H1 https://heredragonsabound.blogspot.com/2017/02/mountain-placement.html ; H2 https://heredragonsabound.blogspot.com/2019/11/new-mountains-and-new-approach-part-1.html
- H3 https://heredragonsabound.blogspot.com/2019/11/new-mountain-style-part-2.html ; https://heredragonsabound.blogspot.com/2020/01/new-mountain-style-part-6.html
- H4 https://heredragonsabound.blogspot.com/2019/12/new-mountain-style-part-4.html ; https://heredragonsabound.blogspot.com/2019/12/new-mountain-style-part-5.html
- H5 https://heredragonsabound.blogspot.com/2017/03/one-of-forest-masses.html ; H6 https://heredragonsabound.blogspot.com/2021/02/knurden-style-forests-part-5.html
- H7 https://heredragonsabound.blogspot.com/2018/04/back-in-woods-part-1-introduction.html
- H8 https://heredragonsabound.blogspot.com/2017/09/labeling-coast-part-one.html ; https://heredragonsabound.blogspot.com/2017/09/labeling-coast-part-two.html

**Azgaar FMG** ([V], raw.githubusercontent.com)
- A1 https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/master/src/generators/relief-generator.ts ; A2 https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/master/docs/prd/relief-icon-pools.md
- A3 https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/master/docs/architecture/data-model.md ; A4 https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/master/docs/wiki/Performance-settings.md
- A5 https://raw.githubusercontent.com/wiki/Azgaar/Fantasy-Map-Generator/Icons.md ; A6 https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/master/docs/wiki/Map-embellishments.md

**O'Leary and Red Blob Games** ([V])
- M1 https://raw.githubusercontent.com/mewo2/terrain/master/terrain.js ; M2 https://raw.githubusercontent.com/mewo2/terrain/master/README.md (its notes, https://mewo2.com/notes/terrain/, did not resolve)
- R1 https://github.com/redblobgames/mapgen2/blob/master/noisy-edges.js ; R2 https://github.com/redblobgames/mapgen2/blob/master/draw.js
- R3 https://github.com/redblobgames/mapgen2 ; R4 https://github.com/redblobgames/mapgen4

**Stamps, cartography, level of detail**
- W1 [X] https://loreteller.com/learn/wonderdraft-mountains/ ; W2 [X] https://wonderdraft.fandom.com/wiki/Sprites ; W3 [X] https://feedback.inkarnate.com/changelog/inkarnate-20-star
- W4 [X] https://dungeongoblin.com/blog/inkarnate-pro-review-2021 ; W5 [V] https://github.com/nuke-haus/mapnuke ; C1 [X] https://en.wikipedia.org/wiki/Hachure_map
- C2 [X] https://support.esri.com/en-us/gis-dictionary/partial-hachuring-system ; P1 [X] https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-2-the-medieval-map.1274052/page-2
- P2 [X] https://admin-forum.paradoxplaza.com/forum/developer-diary/dev-diary-177-a-fresh-coat-of-paint.1854817/latest

**Dominions**
- D1 [V] https://github.com/dmacguigan/dom6-manual/blob/main/chapters/05-movement.qmd ; D2 [V] https://github.com/dmacguigan/dom6-manual/blob/main/chapters/08-dominion.qmd
- D3 [V] https://github.com/dmacguigan/dom6-manual/blob/main/chapters/14-global-enchantments.qmd ; D4 [V] https://github.com/dmacguigan/dom6-manual/blob/main/chapters/02-the-basics.qmd
- D5 [X] http://www.illwinter.com/dom5/mapmanual.html ; D6 [X] https://illwinter.com/dom6/dom6mapman.pdf ; D7 [X] https://steamcommunity.com/app/2511500/discussions/0/844005195821231803/
- D8 [X] https://steamcommunity.com/app/2511500/discussions/0/7204143288004552559/ (the extract did not name the thread for each quote; this is the likeliest) ; D9 [V] https://github.com/DrThyme/ThymeWorld
- D11 [X] https://www.gamingonlinux.com/2017/11/dominions-5-warriors-of-the-faith-the-latest-deep-4x-turn-based-strategy-game-is-now-out/page=1/ ; D12 [X] https://steamcommunity.com/app/259060/discussions/0/1483235412214258651
- D13 [X] https://illwiki.com/dom5/dom6/scales ; D14 [X] https://illwiki.com/dom5/dom6/province-attributes

**Impassable terrain in other games** (all [X])
- E1 https://eu4.paradoxwikis.com/Terra_incognito ; E2 https://admin-forum.paradoxplaza.com/forum/developer-diary/eu4-development-diary-25th-of-october-2016.977383/page-15
- K1 https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-2-the-medieval-map.1274052/page-2 ; I1 https://forum.paradoxplaza.com/forum/threads/imperator-development-diary-2-4th-of-june-2018.1103329/post-24327577
- CV1 https://civilization.fandom.com/wiki/Mountains_(Civ6) ; CV3 https://www.civilopedia.net/en-US/gathering-storm/improvements/improvement_mountain_tunnel/
- CV4 https://forums.civfanatics.com/threads/completely-landlocked-inside-mountains.669411/ ; EL1 https://community.amplitude-studios.com/amplitude-studios/endless-legend/forums/7-archives/threads/3589-el-gdd-3-the-world?page=4
- EL2 https://wiki.hoodedhorse.com/ENDLESS_Legend_2/Map ; HK1 https://community.amplitude-studios.com/amplitudestudios/humankind/blogs/722-humankind-feature-focus-02-reimagining-terrain
- HK2 https://humankind.fandom.com/wiki/Terrain ; AW1 https://aow4.paradoxwikis.com/Unit ; AW2 https://steamcommunity.com/app/1669000/discussions/0/3828666283439240445
- TW1 https://www.pcgamer.com/uk/this-free-total-war-warhammer-2-update-adds-enormous-unique-forts-to-defend-and-conquer ; TW2 https://vice.com/en/article/total-war-warhammer-3-immortal-empires-siege-bugs-broken-gates

**Settlement growth** (all [X])
- G1 https://acoup.blog/2024/08/09/collections-teaching-paradox-imperator-part-iib-built-in-a-day/ ; G2 https://forum.paradoxplaza.com/forum/threads/imperator-development-diary-2-4th-of-june-2018.1103329/post-24327577
- G3 https://redlib.ssps.io/r/EU5/comments/1ksqo4a/cities_evolving_over_time_on_the_map ; https://steamcommunity.com/sharedfiles/filedetails/comments/1561128875
- G4 https://well-of-souls.com/civ/civ6_cities.html ; https://forums.civfanatics.com/threads/second-half-civ-6-urban-growth.666633/
- G5 https://checkpointgaming.net/features/2024/10/speaking-with-firaxis-about-ambitious-plans-with-civilization-vii/ ; https://blog.kowatek.com/?p=92609 ; https://www.gamereactor.eu/civilization-vii-hands-on-preview-one-for-the-ages-1420623/ ; https://steamcommunity.com/app/1295660/discussions/0/6404770483182335397 (the extracts did not tie each quote to one page: the "origin hex" and Age lines came from a preview among these, and the swap complaint from the Civ VII Steam forum)
- G6 https://community.amplitude-studios.com/amplitude-studios/humankind/ideas/3104-city-scale-and-district-levels ; https://endlesslegend.wiki.gg/wiki/District
- G7 https://humankind.fandom.com/wiki/District ; https://community.amplitude-studios.com/amplitude-studios/humankind/forums/168-general/threads/35680-two-features-scare-me-in-humankind-the-gigantism-of-the-cities-and-the-combat-system?page=2
- G8 https://www.gogdb.org/product/1915432764/releasenotes (the extract quotes the Ogre Update notes) ; https://aow4.paradoxwikis.com/City_structures ; https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-8
- G9 https://catalogue.smods.ru/archives/274959 ; https://en.wikipedia.org/wiki/Total_War:_Attila

**Alignment** (all [X])
- T1 https://totalwarwarhammer.fandom.com/wiki/Total_War:_Warhammer_II_corruption ; T2 https://totalwarwarhammer.fandom.com/wiki/Total_War:_Warhammer_corruption
- T3 https://steamcommunity.com/app/594570/discussions/0/1743358239833178242/ ; T4 https://totalwarwarhammer.fandom.com/wiki/Total_War:_Warhammer_III_corruption
- T5 https://videogames.si.com/news/total-war-warhammer-3-update-4-2-patch-notes ; T6 https://steamcommunity.com/sharedfiles/filedetails/?id=778287837 ; https://steamcommunity.com/sharedfiles/filedetails/?id=2827883046
- AW3 https://steamcommunity.com/app/1669000/discussions/0/3883848458636217284/ ; https://steamcommunity.com/app/1669000/discussions/0/5294588689503544762/
- AW4 https://steamcommunity.com/app/1669000/discussions/0/688615158420184512/
- AW5 https://www.paradoxinteractive.com/games/age-of-wonders-4/news/primal-fury-dev-diary-1 ; https://steamcommunity.com/app/1669000/discussions/0/4299320351880030860
- WC1 https://warcraft.wiki.gg/wiki/Blight_(plague) ; WC2 https://classic.hiveworkshop.com/war3/undead/basics.shtml
- FF1 https://forums.civfanatics.com/threads/fire-developer-diary.202889/ ; FF2 https://civ-wiki.de/wiki/Infernal_(Civ4_FFH) ; FF3 https://forums.civfanatics.com/threads/hell-terrain-spread.297012/post-7391633

**PixiJS** (X1 to X6 [V]: pixi.js 8.22.0 as installed, https://www.npmjs.com/package/pixi.js)
- X1 `node_modules/pixi.js/skills/pixijs-performance/SKILL.md` ; X2 `skills/pixijs-scene-core-concepts/references/render-groups.md`
- X3 `skills/pixijs-scene-particle-container/SKILL.md` ; X4 `skills/pixijs-scene-graphics/SKILL.md`
- X5 `skills/pixijs-assets/references/svg.md` ; X6 `skills/pixijs-core-concepts/references/renderers.md`
- X7 [X] https://pixijs.com/blog/particlecontainer-v8 ; X8 [X] https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_SIZE ; https://webglfundamentals.org/webgl/lessons/webgl-cross-platform-issues.html

**Fluid Magic** ([V], read locally): `docs/01-core-rules.md` (§2, §3, §7, §12, Implementation
decisions), `docs/03-nations.md`, `docs/05-pretender.md`, `docs/06-architecture.md`, `docs/09-balance.md`,
`/home/user/fm-docs/docs/09-art-direction.md`, `../ui-design/spec-final.md` 2.10,
`../battle-design/final.md` §0 and S2, `src/content/mapgen.ts`, `src/mapgen/{voronoi,size,validate,
types}.ts`, `src/sim/{movement,types}.ts`, `/home/user/fm-p7f/src/{ai,sim}/**` (`neighbors`, `withinHops`).
