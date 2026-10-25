# The war table: the immersion-first proposal

**Angle.** The player is a warlord leaning over an oak war table in a warm tavern. The map is a
living painted cloth. Its land visibly changes as dominions spread and settlements grow. Armies
are painted miniatures, and leaders are characters with faces. This proposal pushes the owner's
direction as far as it can go while the game stays playable and readable. Each section says where
it stops and why.

**The owner's direction, 2026-10-21 (binding, verbatim; typos corrected only).**

> this is great - the UI is fluid - the hover is intuitive and responsive, the alerts row is
> good, each thing to try is good, i would like more detail on the map, while this is mostly an
> art pass, i want to make sure the maps have some impassible terrain that is noticeable, the
> detail view on the lands are great, some art assets to show the growth over time would be
> ideal, based on alignment too!
>
> leaders certainly need portraits
>
> the overall map should be on an rustic wartable in a cozy but natural tavern, nice oak wood

**What this proposal keeps unchanged.** The owner approved the layered UI: hover, nested
tooltips, the alerts row, and the province detail panel. Their behavior, the staged
`docs/07-ui.md`, the five layers, the density budget, and the "nothing is zoom-gated" rule all
stay as they are. This is an art pass with one rule change: impassable terrain. The art may change
how the map looks, never what it says.

**Repository state.** Phase 6 is committed (`3addf97`). The Phase 7 AI is in the worktree
`/home/user/fm-p7f`. Docs 07 and 09 are read from the staged copies in `/home/user/fm-docs/docs/`.
Sibling tracks are harmonized where they touch the map: battle presentation (`battle-design/final.md`),
the pretender (`pretender-design/final.md`, with the owner's answers), and units and items
(`units-items-design/`).

**Evidence.** Every number marked "measured" comes from a script in this folder. The scripts read
the repo (read only) and save their output next to them.

| File | What it measures |
|---|---|
| `tools/impassable-proto.ts` | A full re-implementation of `generate.ts`'s attempt with impassable regions and ridges. It runs on the repo's own mapgen modules and is compared with the current generator on the same seeds (200 seeds for 2 nations, 100 for 3 and 4). Outputs: `tools/impassable-proto-final.out` (Small and Medium, 2 nations) and `tools/impassable-proto-final-b.out` (Large, 3 and 4 nations). |
| `tools/immersion-colors.ts`, `tools/impassable-pattern.ts`, `tools/two-tone.ts`, `tools/haze.ts`, `tools/impassable-search.ts` | CIEDE2000 under the four visions (the repo's `tests/content/colorMath.ts`) and WCAG contrast for every new color: impassable fills and marks, dominion washes, fog haze, material chrome, oak. Outputs are in `*.out` next to each script. |
| `sketch/table-sketch.html` (renders `sketch/sketch-mid.png`, `sketch-near.png`, `sketch-far.png`, `sketch-dominion.png`) | A calibration sketch on a prototype map (seed 2, Medium, 2 nations). It shows the oak table, the cloth, terrain stamps, peaks, meres and ridges, settlements, alignment motifs, miniatures and procedural portraits, at three zooms and in Dominion mode. |
| `proto-out/proto-medium-s{1..4}.png` | Prototype maps with peaks, meres and ridges. Passable adjacency is drawn as white lines. |

---

## 0. The design in twenty points

1. **Impassable terrain is both regions and borders.** *Peaks* (named mountain massifs) and
   *meres* (dark lakes) are map cells that are not provinces. *Ridges* are impassable borders
   between two provinces, drawn as mountain chains. A Medium map gets 3 peaks, 2 meres and about
   7 ridges.
2. **One sentence of rules.** "No army, sight, dominion or ritual crosses impassable terrain."
   `MapProvince.neighbors` keeps its meaning (passable neighbors), so the sim and AI code that
   reads it stays unchanged: seven sim files and five AI files.
3. **Every map invariant still holds, measured on 100 to 200 seeds per map size.** The exact province count, exact
   terrain shares, capitals 6 or more apart, the 1.5x capital-ring ratio, Wellspring fairness and
   spacing, adjacency only through shared segments, and a connected graph. The graph also stays
   2-connected, and every barrier has a way around within 4 hops (ridges) or 6 hops (regions).
   Medium 2-nation maps cost 0.8 more hops and 4.8 more days between capitals.
4. **It is noticeable at every zoom and in every mode.** Barriers are drawn by shape, not by hue.
   Peaks are snow-capped massifs, meres carry ripples, and ridges are sawtooth chains. Two tones
   (ink and snow) reach at least 4.3:1 contrast on every fill (measured). Map modes never tint
   impassable terrain.
5. **The map is a painted linen campaign cloth.** It is pinned with brass tacks to an oiled
   quarter-sawn white oak table, in a tavern seen from above: floorboards, a rug, the hearth's glow
   on one side and a window's daylight on the other.
6. **The sheet stays flat, orthographic and neutrally lit.** Warm light falls only on the room
   and the table. The camera "leans back" by zooming out past the sheet to show the table and
   room. There is no tilt and no blur on the map.
7. **Props mirror the chrome; they never inform alone.** The month candle burns down as the month
   passes. The hourglass lies on its side while paused. The coin purse fills with the treasury. No
   prop is clickable in M1.
8. **The chrome turns to dark oak, brass and parchment.** Panels become dark oak (`--chrome-*`
   retuned to warm browns, with text at 9.7:1 to 13.4:1). Brass keylines and corner brackets mark
   action buttons and docks. Cards carry parchment faces with ink text (12.8:1). Tooltips stay
   dark, because the owner approved them.
9. **Ambience is slow and has an off switch.** Candles flicker ±4% below 1.3 Hz, and the hearth
   breathes on a 6 s cycle. Reduced motion freezes both. Settings → Interface gains "Table: Full /
   Simple / Off". Ambient sound waits for M2.
10. **The painted map gets terrain stamps.** Forest crowns, hill hachures, low passable peaks,
    reeds and pools, field patchworks, cracks and stones, grass tufts. They are seeded per province
    and kept out of the label-and-badge core. Under fog and in map modes, stamps carry terrain
    identity that the hazed fills lose (a 20% haze already drops Hills/Wasteland to 18.7, measured).
11. **Armies are painted miniatures.** A figure stands on a round base, and a shield plaque in the
    allegiance shape carries the count. At Far zoom only the plaque remains. Unscouted enemies
    show a cloaked figure with the strength word, the way a Columbia block shows its back.
12. **Settlements grow from state already in the sim.** Population sets the tier (5 tiers, 1 to
    22 houses, placed center-out so growth never reshuffles). PD raises a watchtower, then a
    palisade, a stone wall, a gatehouse. Temples, labs and forts are landmarks in the owner's
    architectural kit.
13. **Alignment repaints the land.** The dominating nation's *land look* (a wash capped by the
    palette test, plus motifs) grows with dominion strength. Cinder Horde brings ash, ember cairns
    and charred stumps; Thornwood brings blossom, brambles and elder trees. Each scale pole adds its
    own motifs per effective step. A future nation needs only a land-look record.
14. **Scars and blessings show events.** Siege camps and wall cracks, pillage smoke, battle scars
    that fade over 180 days, and ritual marks from the pretender design's map model (Burn the
    Fields, Ash Rain, Fertile Season, Rootwall). Every visual uses only what the viewer may see.
15. **Slow looks repaint calmly.** Growth and alignment repaint at most once a month, with a
    600 ms brush wipe, at most 8 animated per month end. Events show at once, because they are
    information.
16. **Only two optional fields of new state.** `ProvinceState.heldSince` (roads and a "held for"
    line) and personal names for commanders are M1-should. Everything else derives from existing
    state.
17. **Every commander gets a seeded portrait.** It is a layered SVG bust, keyed by
    `${seed}:${commanderId}:${slot}` with rendezvous picks over append-only part tables. The seed
    picks the face; state picks only the overlays and frame (wounds, halo, crown, pip ring, holy
    mark). Pretenders and summons use their rig's portrait pose.
18. **Owner-made raster portraits are a premium layer.** They go through `art-inbox/`, are used
    only when a type's set is complete (8 images, 12 for independents), and carry a provenance
    sidecar. State shows on the frame only.
19. **Placement keeps the game playable first.** Phase 1b lands impassable terrain. Phase 8 ships
    flat fills plus impassable art plus the Simple table. Phase 11 brings stamps, settlements,
    alignment and portrait parts. A scope guard, a cut order and a "Map detail: Full / Reduced"
    setting protect the playable game.
20. **The mockup brief has 16 ordered steps,** ending with a time-lapse slider so the owner can
    watch a province grow and change hands over four years.

## Where I draw the line, and why

| Pushed this far | Stopped here | Why |
|---|---|---|
| The map is a physical cloth on a physical table in a physical room | The sheet never tilts, curls, folds or blurs | Label layout (`layoutMapLabels`), hit areas and the province shapes must stay exact. CK3 keeps its paper map flat, and some of its players turn the table texture off (`research-tabletop.md` 2.9). |
| Warm candle and hearth light | No warm grade on the sheet beyond 8% at 2700 K, and no vignette on the sheet | 15% at 1900 K or a 30% vignette breaks the terrain palette rule (measured in `research-tabletop.md` 4.3). |
| Props that mirror state (month candle, hourglass, purse) | Props never carry information alone and are not clickable in M1 | One home per command (`docs/07` principle 4). Information must not depend on zoom. Clicks in the margin while panning would misfire. |
| Wood, brass, leather and parchment in the chrome | No texture behind text. Tooltips stay dark. Mana colors never decorate chrome | Texture costs legibility (Talisman de-hazed, Total War dropped wooden panels). The owner approved the tooltips as they are. |
| Painted miniatures on bases | Numbers sit on flat plates. Figures are at most 46 px tall at Mid. Stacks fan as before | Miniatures read through contrast, not detail. The badge box stays within the label budget. |
| Land repainted by alignment | Shapes carry the meaning. Washes are capped per nation by the palette test (Cinder 12%, Thornwood 8%). Motifs ghost to 25% in modes | A stronger wash merges terrains for color-blind players (measured: Thornwood moss at 12% gives 10.8 under protanopia). Total War players modded corruption paint down. |
| Growth over time | Slow looks change at most monthly. No reshuffles: growth adds pieces and decline removes the newest | Civ VII's sudden house swaps were disliked. A calm map does not distract. |
| Impassable terrain everywhere it adds strategy | About 8% of the map area and 5% of borders. No barrier within 2 to 3 hops of a capital. No cut province. Detours capped. No flying exception and no passes that open or close in M1 | Fronts stay short, starts stay fair, and the AI needs no new code. A flying exception would give the sim a second adjacency. |
| Portraits for every leader | State never changes the face, only overlays and the frame. Raster art only in complete sets | "My Ash Chieftain, now wounded" must stay the same person. Mixed art styles in one type look like two games. |
| A living tavern | No ambient sound, no time of day, no animated people | M1 scope allows only battle SFX. The sim has no time of day, and a day/night cycle would recolor the map. People would compete with the map. |
| New sim state for "over time" | Only `heldSince` and personal names, both M1-should | The renderer derives everything else, so saves, hashes and the AI stay untouched. |


---

## 1. Impassable terrain

### 1.1 Decision: regions and ridges, one rule

There are three ways to make terrain impassable (`research-mapdetail.md` 2.2): an impassable border (Dominions, ThymeWorld), an impassable region (EU4, CK3, Imperator, Endless Legend 2), or very costly terrain (AoW4). FM already has costly terrain: Mountains take 9 days at speed 2. That is not what the owner asked for. This proposal takes **both of the impassable kinds**, because each covers the other's weakness:

| Kind | What it is | What it adds | Its weakness alone |
|---|---|---|---|
| **Peaks** (region) | A map cell that is not a province. It is drawn as a named, snow-capped massif. Up to 3 touching peak cells form one range | The strongest silhouette on the map; a name ("the Ashspine"); a mass that armies route around | A blob in the middle of the map, with no chokepoints along its flanks |
| **Meres** (region) | A map cell that is not a province, drawn as a dark, still lake. It always stands alone | Variety in the low, wet lands; a second shape that is not mountains | Same as peaks |
| **Ridges** (border) | A shared border between two provinces that no one can cross, drawn as a chain of peaks along the border | Spurs that run out of the massifs, passes between them, chokepoints, and ranges that read as ranges | A lone ridge looks arbitrary (research 2.2); on its own it is less noticeable |

The prototype shows how they combine. On seed 2 (`proto-out/proto-medium-s2.png`) a double peak sends a spine of ridges south to a third peak, with passes on both sides. Seed 3 has a three-cell range with spurs (`proto-medium-s3.png`).

**One rule for both.** Neither a region nor a ridge is an adjacency. `MapProvince.neighbors` keeps its exact meaning, "the provinces you can step to", and every reader of it already respects the barrier:

> **Impassable terrain.** Peaks, meres and ridges cannot be crossed. No army moves, retreats or
> sees across them, no dominion spreads across them, and ritual reach is counted around them.

### 1.2 Data (`src/mapgen/types.ts`, `src/sim/ids.ts`)

```ts
// ids.ts: a new kind. Counter local to mapgen, like provinces (x0, x1, ...).
export const ID_PREFIXES = { ..., impassable: 'x' } as const;
export type ImpassableId = Id<'impassable'>;

// mapgen/types.ts
export type ImpassableKind = 'peak' | 'mere';

export interface ImpassableRegion {
  id: ImpassableId;
  kind: ImpassableKind;
  /** Touching peaks share a range and one name; a mere is a range of its own. */
  range: number;
  name: string;              // "the Ashspine", "Blackmere"
  site: Point;
  center: Point;
  /** Convex outline, the same conventions as MapProvince.polygon. */
  polygon: Point[];
  /** Provinces that share a border segment with it, sorted by id number. */
  borders: ProvinceId[];
}

export interface MapProvince {
  // ...unchanged fields...
  /** Passable neighbors: provinces sharing a border segment that is not a ridge. Unchanged meaning. */
  neighbors: ProvinceId[];
  /** Provinces sharing a border segment across a ridge. Sorted; disjoint from neighbors. */
  ridges: ProvinceId[];
  /** Impassable regions this province borders, sorted. */
  beside: ImpassableId[];
}

export interface MapData {
  // ...unchanged fields...
  /** Peaks and meres, in id order. */
  impassable: ImpassableRegion[];
}
```

`neighbors ∪ ridges` is the full drawn adjacency, so the drawing and the data agree. The renderer draws a ridge on the segment two provinces share. `ImpassableRegion.borders` and `MapProvince.beside` let tooltips say "Borders the Ashspine" without geometry.

### 1.3 Generation (`src/mapgen/generate.ts`, new `src/mapgen/impassable.ts`)

The attempt changes only in its order and in two new steps. The current steps are kept as they are (`generate.ts`, `research-mapdetail.md` 2.5). Numbers live in a new `IMPASSABLE` block in `src/content/mapgen.ts`.

1. **Cells.** `cells = provinceCount + regionCount`, where `regionCount = round(0.05 × provinces)` peaks plus `round(0.03 × provinces)` meres. That is 2 + 1 on Small, 3 + 2 on Medium, 4 + 2 on Large, 4 + 3 on Medium with 3 nations, 6 + 3 with 4 nations. `mapDimensions(cells)` keeps the mean area of 6400 units² per cell, so provinces are as large as today. Then Poisson, adjustCount, Lloyd, Voronoi and the shared-segment adjacency run on all cells, as today.
2. **Capitals** go on the full cell graph by today's `placeCapitals`.
3. **Noise.** Elevation and moisture are sampled at every site, as today.
4. **Regions** (`placeImpassable`). Peaks are chosen in order of elevation, highest first, then meres in order of wetness minus elevation. A cell is taken only if all of these hold:
   - it is at least **3 cell hops** from every capital;
   - it is **interior**: no vertex on the map outline (a mere at the edge would read as a sea, which M1 does not have);
   - a mere touches no other region, and a peak touches no mere;
   - a peak joins a range of at most **3** cells;
   - with it removed, the remaining graph is connected, every remaining cell keeps at least `minNeighbors` (2), and **no cell becomes a cut vertex** (the graph stays 2-connected);
   - every two provinces that border the same region stay within **6** passable hops of each other.

   If fewer regions fit than wanted, the attempt fails and the generator retries, as it already does for capitals and Wellsprings.
5. **Terrain.** `assignTerrain` gets an optional `counts` argument. The terrain pass runs over **all cells**, with the regions fixed as Mountains (peaks) and Swamp (meres), the way capitals are fixed today. Counts are `apportion(TERRAIN_SHARES, provinces)` plus the peaks on Mountains and the meres on Swamp. Once the regions are removed, **the provinces have exactly the shares**. Peaks sit among mountains and hills, and meres among swamps, because the noise is coherent.

   *Why over all cells:* the shares stay exact, and peaks sit among mountains and meres among swamps, which reads as natural ground.

   *A side effect, and its fix:* taking high, wet cells far from the capitals still pushes some Mountains and Hills toward them. On 4-nation maps, with today's search of 6 valid maps, the capitals' 2-hop rings became more uneven: the mean ratio rose from 1.56 to 1.71, and the share of maps within 1.5 fell from 54% to 34% (100 seeds). The cause is terrain: the rings' members are unchanged, but the population-weighted spread of their terrain rose from 1.61 to 1.78 (60 seeds). Widening the balance search to 10 valid maps (step 8) restores it: 50% of maps within 1.5, mean ratio 1.548. Two-nation maps are unaffected: 100% within 1.5 either way.
6. **Ridges** (`placeRidges`). The budget is up to `round(0.05 × borders between provinces)`, which is 7 on Medium. A candidate border must meet one of three conditions:
   - it touches a peak at one end (a spur);
   - it continues an existing chain (the three cells meet at one vertex);
   - both of its provinces are Mountains or Hills.

   Candidates are scored by mean elevation, +2 for touching a peak, +1 for continuing a chain, and +0.5 if both sides are high. They are taken in score order (ties go to the lower index) if all of these hold:
   - both provinces are at least **2 hops** from every capital;
   - the border is at least **0.25 × √provinceArea** (20 units) long, so a chain has room for at least two peaks;
   - a peak sends at most **2** spurs, and a chain is at most **4** borders long;
   - both provinces keep `minNeighbors` passable neighbors;
   - the graph stays connected and 2-connected;
   - **every** ridge's two provinces stay within **4** passable hops, and every region's border provinces within 6.
7. **Then everything as today, on the final passable graph:** Wellsprings (`placeWellsprings`), springs, names (now also range and mere names from `IMPASSABLE_NAMES` in `src/content/names.ts`), starting population, `capitalDistance` and independent strength.
8. **Validation, then balance.** `validateMap` runs with its new checks (1.4). The balance search takes up to **10** valid maps instead of 6 (`MAPGEN.balanceCandidates`) before it settles for the most even one.

All randomness still comes from the one mapgen `RngState` (`createRng(seed)`). The order of draws changes, so **every seed gives a new map**. Saved games keep their own maps, because the map is stored in `GameState`.

### 1.4 Invariants, and why each still holds

| Invariant (docs/01 Implementation decisions) | Why it holds | Check |
|---|---|---|
| Exact province count | Cells are `provinces + regions`, and only regions are removed | existing count check |
| Exact terrain shares | Counts are apportioned over the provinces, with regions fixed as extra Mountains and Swamp (step 5) | existing share check (`terrain.test.ts`) |
| Capitals at least 6 apart | Placed on the full cell graph. Removing cells and edges can only lengthen paths | existing distance check, run on `neighbors` |
| 1.5x capital-neighborhood ratio | Regions are at least 3 cell hops from every capital and ridges at least 2. So each capital's 2-hop ring has the **same members** as on the cell graph. The search tries up to 10 valid maps | existing `capitalBalance`; measured |
| Wellsprings at least 3 from capitals and 2 apart; fairness | `placeWellsprings` runs on the final passable graph, so fairness is measured where armies actually walk | existing checks |
| Adjacency only through shared segments | Unchanged. Ridges are a subset of shared segments, so `neighbors ∪ ridges` equals today's adjacency rule | new: `ridges ∩ neighbors = ∅`; each ridge is a shared segment at least 20 units long |
| Connected graph; at least 2 neighbors | Enforced at every region and ridge step | existing checks |
| (new) **2-connected**: no single province is the only way into part of the map | Enforced at every step. Today's maps already are (0 cut vertices in 200 baseline seeds) | new: articulation points = 0 |
| (new) **Detours**: ridge sides within 4 passable hops; region borders within 6 | Enforced on the final graph | new |
| (new) Regions interior, at least 3 cells from capitals; ridges at least 2 hops from capitals | Enforced at placement | new |

### 1.5 Measured results

The prototype ran with the numbers above, compared with today's `generateMap` on the same seeds (`tools/impassable-proto-final.out`, `tools/impassable-proto-final-b.out`). Times are for the unoptimized prototype.

| Map | Seeds | Fail | Attempts mean (p95) | Regions | Ridges | Capital hops, min pair | Days at speed 2 | Mean passable neighbors | Within 1.5 ratio | Wellspring unfairness, max | Touch impassable |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Small, 2 nations | 200 | 0 | 1.71 (4) | 2 peaks, 1 mere | 4.04 of 4.04 | 7.66 → 8.14 | 36.7 → 40.1 | 4.79 → 4.14 | 100% → 100% | 0 → 0 | 35% |
| **Medium, 2** | 200 | 0 | 1.80 (4) | 3, 2 | 6.97 of 7 | **9.40 → 10.21** | **45.5 → 50.3** | 5.00 → 4.29 | 100% → 100% | 0 → 0 | **39%** |
| Large, 2 | 100 | 0 | 1.91 (5) | 4, 2 | 9.28 of 9.29 | 11.02 → 11.61 | 53.7 → 57.2 | 5.14 → 4.48 | 98% → 100% | 0 → 0 | 36% |
| Medium, 3 | 100 | 0 | 4.37 (11) | 4, 3 | 9.97 of 10 | 6.94 → 7.23 | 33.0 → 34.7 | 5.16 → 4.46 | 79% → 93% | 0 → 0 | 39% |
| Medium, 4 | 100 | 0 | 8.01 (11) | 6, 3 | 12.99 of 13 | 7.04 → 7.54 | 33.0 → 35.5 | 5.26 → 4.57 | 54% → 50% (mean ratio 1.565 → 1.548) | 1 → 1 | 36% |

On every map, the maximum ridge detour is 4, the maximum region detour is 6, and there are 0 cut provinces. Generation time on Medium is 37 ms against 24 ms today. On Medium with 4 nations it is 580 ms against 174 ms. The prototype runs a full BFS for every candidate. The implementation keeps the candidate order but checks detours incrementally and must stay **under 100 ms on Medium with 2 nations and under 500 ms with 4** on a laptop (test budget, section 1.9). Generation runs once, at New Game.

**Reading.** About 4 in 10 provinces touch impassable terrain, so most fronts meet some. Capitals end up about one hop and about 5 days farther apart, which is a modest delay. The checklist's "a match ends by month 70" is re-measured in Phase 12 anyway. Balance gets better with 3 nations (79% to 93% of maps within 1.5), and with 4 nations it stays within noise of today (54% to 50%, mean ratio slightly better).

### 1.6 What it changes in each system

| System | Reads | Code change | Behavior |
|---|---|---|---|
| Movement and pathing (`movement.ts` `findPath`, `pathsFrom`; `commands/army.ts`) | `neighbors` | **None.** Plus a better refusal: when the next step is in `ridges`, `validateCommand` says "A ridge blocks the way from Ashfen to Karrow" instead of "The path is not connected" | Paths bend around barriers. ETAs grow where they do |
| Hostility (`hostileProvinces`) | provinces and presence | None | Unchanged. Regions are never provinces |
| Retreat (`conflict.ts`) | `neighbors` | None | A loser never retreats across a ridge |
| Vision and fog (`visibility.ts`) | `neighbors` | None | Armies are not seen across a ridge. Regions hide nothing new: provinces on opposite shores of a mere were never adjacent. Regions are always visible, like terrain (docs/01 §14) |
| Dominion spread (`dominion.ts`) | `neighbors` | None | A check never lands across a ridge |
| Ritual reach (`rituals.ts` `withinHops`) | `neighbors` | None | Reach is counted around barriers. The targeting outline (UI 2.10.2) visibly bends |
| Fort materials (`selectors.ts`) | `neighbors` | None | A ridged neighbor does not feed the fort |
| AI (`fm-p7f/src/ai`: assess, army, defense, magic, war; `pathsFrom`, `hopsFrom`, `adjacencyRoute`, `withinHops`) | `neighbors` | **None** | The AI sees the same graph the player walks. Behavior tests are re-run. Tests pinned to a seed's geometry are re-pinned |
| Mapgen checks (`validate.ts`) | adjacency | New checks (1.4) | — |
| UI (staged docs/07) | `neighbors`, `ridges`, `impassable` | Hover and cursor (section 1.8) | A region has its own tooltip and is never a move target |
| Saves | `GameState.map` | **`STATE_VERSION` bump** with a migration: an old map gets `impassable: []`, and every province gets `ridges: []` and `beside: []` | Old saves load as maps with no impassable terrain |

**Determinism.** The determinism test compares two runs of one seed, not a pinned hash. It keeps passing, and its fixture (Medium, seed 1) simply plays on a new map. Tests that rely on `neighbors[0]` of a capital keep working, because a capital never loses a neighbor (ridges are at least 2 hops away, regions at least 3 cells).

### 1.7 Numbers (content, recorded in docs/09-balance, rows in section 8)

```ts
// src/content/mapgen.ts
export const IMPASSABLE = {
  peakShare: 0.05,             // peak cells per province (Medium: 3)
  mereShare: 0.03,             // mere cells per province (Medium: 2)
  regionMinCapitalCells: 3,    // cell hops from every capital
  maxRangeCells: 3,            // touching peak cells in one range
  regionMaxDetour: 6,          // provinces around one region stay this close
  ridgeShare: 0.05,            // ridged borders per border between provinces (Medium: 7)
  ridgeMinCapitalDistance: 2,  // both provinces at least this far from every capital
  ridgeMaxDetour: 4,           // a ridge's two provinces stay this close
  ridgeChainMax: 4,            // borders per chain
  ridgeSpursPerPeak: 2,
  ridgeMinLength: 0.25,        // shortest ridged border, as a fraction of sqrt(provinceArea)
  ridgeTerrains: ['mountains', 'hills'],
} as const;
// MAPGEN.balanceCandidates: 6 -> 10
```

### 1.8 How it looks (art), at every zoom and in every mode

Impassable terrain is drawn **by shape, in two tones**. Hue is never the identifier, so it reads for every kind of color vision. The two tones are ink #1C1A17 and snow #F3F0E8. Every mark uses both, so one of them reaches at least **4.3:1** on every surface (measured, `tools/two-tone.out`):

| Surface | Ink | Snow | Best |
|---|---|---|---|
| Plains / Farmland / Forest / Hills | 10.7 / 9.7 / 1.8 / 3.3 | 1.4 / 1.6 / 8.3 / 4.6 | 10.7 / 9.7 / 8.3 / 4.6 |
| Mountains / Swamp / Wasteland | 6.7 / 3.1 / 5.5 | 2.3 / 4.9 / 2.8 | 6.7 / 4.9 / 5.5 |
| Peak granite / mere water / cloth / oak | 2.5 / 1.2 / 12.8 / 3.5 | 6.1 / 13.0 / 1.2 / 4.3 | 6.1 / 13.0 / 12.8 / 4.3 |

**Peaks.**
- **Ground.** A granite wash, #5E5953, over the whole cell. The rim is a 3 px ink contour with a 2 px snow keyline inside it.
- **Relief.** A massif fills the cell edge to edge:
  - 8 to 14 peak stamps per cell, by area, of which 2 or 3 are centerpieces at 1.7 times the size. A centerpiece is about 0.55 of the cell's inradius tall.
  - Each peak shows a lit rock face #8E8880, a shadow face #4A4540 with ink hatching at 45°, and a snow cap down to 42% of its height.
  - The outline is ink, 1.3 px at Mid.
- **Order and rise.** Stamps are drawn tallest first and then by bottom edge. Their tops may rise up to 10% of their height above the cell's top edge, never at the base, and they cast a soft drop shadow. The massif should be the tallest thing on the map.
- **Passable Mountains look different.** That terrain keeps small, low, snowless blue-grey peaks (4 to 7 per province) on #8DA4AD. Size, density, snow and the granite ground tell the two apart at a glance (`sketch/sketch-near.png`).

**Meres.**
- **Water.** Night water #182A36, with two shoreline bands inside the rim (#234257 and #2B5068).
- **Marks.** 8 to 14 two-hump ripple strokes in #8FC3D3 (7.7:1 on the water), and reed tufts at the shore.
- **Rim.** A 3 px ink contour.

**Ridges.**
- **Spine.** A 4.5 px ink line on the shared segment.
- **Chain.** Peaks astride the line, one every 13 units at Mid, alternating two heights. Each has a light rock face #B8BFC4, a snow tip, a shadow face #6E7F86 and an ink outline.
- **Layering.** Ridges draw **above** ownership bands, so a ridge between two nations' bands still shows.

**By zoom** (the bands of UI spec 2.10.3):

| Band | Peaks | Meres | Ridges | Name |
|---|---|---|---|---|
| Far (under 70 px) | the massif with 3 to 5 stamps; contour and keyline | water, rim, 3 ripples | spine plus a snow sawtooth of 2 to 3 teeth | yes, priority after capitals and Wellsprings |
| Mid | full massif | full | full chain | yes |
| Near | adds snowfields and scree around the base | adds reflections of the shore reeds | adds a scree fan at each end | yes |

**Names.** Regions take italic serif labels:
- Peaks: ink on a snow halo, set along the range's long axis.
- Meres: pale blue #CFE8F0 on a water halo.

Their label boxes go into `layoutMapLabels` like province labels, and they never compete with province labels because they sit in their own cells.

**In map modes.** Modes tint province fills only (UI spec 2.10.2). Impassable regions are **never tinted and never ghosted**, so they look identical in all six modes and in the numbers layer. That makes them easier to spot in a mode than in Ownership. Ridges keep full contrast as well. In Dominion mode, an undominated province must use the desaturated terrain under the tint, as the spec says, and never a flat grey. A flat grey would sit next to granite; the sketch's flat grey shows the risk (`sketch-dominion.png`).

**Fog.** Terrain is public (docs/01 §14), so regions and ridges are always drawn in full, including in unexplored land.

**Hover and orders.**
- Hovering a region shows a small card: "**The Ashspine** · Impassable peaks. No army, sight, dominion or ritual crosses them. Borders: Lanmarch, Thorngate, Redmoor, …" The borders are entity links.
- A region is never a move target. The cursor shows ✕ (the blocked badge) and the label reads "Impassable".
- Impassable terrain never makes a move impossible by itself, because the graph stays connected. It does make paths longer, and it can leave the only way around running through hostile land. The cursor label says so:
  - with a path that bends around a barrier, the ETA line adds "around the Ashspine";
  - with no path, the reason names the barrier and what closes the way around: "No path: the Ashspine blocks the way, and the way around crosses hostile Velmere."
  - The barrier named is the first peak, mere or ridge that the straight line from the army to the target crosses. That is a render-side check, the barrier the player is looking at.
- With commanders selected, the path preview bends around barriers. That is how the rule teaches itself.
- Move targeting hatches unreachable provinces as before. Ritual targeting's hop outline bends around barriers.

**Performance.** Regions and ridges are static. They are baked into the sheet layer with the fills (section 3.8) and cost nothing per frame.

### 1.9 Tests

- `tests/mapgen/impassable.test.ts` (new), over seeds 1 to 50 on every size and nation count:
  - region counts equal the shares;
  - every region is interior, at least 3 cells from every capital, and has no region of the other kind next to it;
  - ranges have at most 3 cells; meres stand alone;
  - ridges are symmetric, disjoint from `neighbors`, shared segments at least 20 units long, at least 2 hops from every capital, at most 2 per peak, and chains at most 4 long;
  - every detour is within its cap;
  - 0 articulation points;
  - `neighbors ∪ ridges` equals the shared-segment adjacency of the province cells.
- `tests/mapgen/validate.test.ts`: each new check rejects a hand-broken map (a ridge that is also a neighbor, a region touching the outline, a cut province).
- `tests/mapgen/terrain.test.ts`: `assignTerrain` with `counts` and fixed cells gives the exact province shares.
- `tests/mapgen/generate.test.ts`:
  - same seed, same map;
  - generation under 500 ms on Medium with 4 nations and under 100 ms with 2 (median of 5 runs, as a guard);
  - the 1.5 ratio holds on at least 95% of Medium 2-nation seeds 1 to 200.
- `tests/sim/movement.test.ts`:
  - `findPath` never crosses a ridge;
  - move validation refuses a ridged step with the ridge message;
  - retreat never lands across a ridge;
  - `withinHops` and vision never cross a ridge.
- `tests/sim/serialize.test.ts` (with save/load in Phase 9): a version-1 save loads with empty `impassable`, `ridges` and `beside`.
- AI (`fm-p7f`): re-run every behavior test. A test that fails only because its seed's geometry moved gets a new seed, noted in its file.

### 1.10 Which built phases change, and how to land it

| Phase | Change | Size |
|---|---|---|
| 1 (mapgen) | `impassable.ts` (new); `generate.ts` order; `terrain.ts` `counts`; `validate.ts` checks; `types.ts`; `names.ts` and content name pools; `content/mapgen.ts` `IMPASSABLE` | about 350 lines plus tests |
| 3 (commands) | the ridge refusal message in `commands/army.ts` | a few lines |
| 2 to 6 (sim) | none | — |
| 7 (AI) | none; re-run behavior tests and re-pin seeds | test fixtures |
| `docs/01`, `docs/09-balance`, `docs/06`, `docs/10` | text in section 8 | — |

**Landing.** Land it as **"Phase 1b: impassable terrain"**, after Phase 7 merges, so the AI worktree is not rebased in the middle of its work. It is one commit with its tests, `npm run typecheck && npm run lint && npm test`, and the message `Phase 1b: impassable terrain (peaks, meres, ridges) by owner direction`.

The rule is an owner decision. The owner asked for impassable terrain, and docs/01's Implementation decisions record it the way the Godless trigger was recorded: "changed ... by the project owner's decision". The parent workflow should put the defaults to the owner in one question, with the prototype pictures:

> "Impassable terrain: peaks and meres (non-province regions, about 8% of the map) plus ridges
> (impassable borders, about 5%), never next to a capital, always with a way around. Approve?"

Until the owner answers, nothing in Phases 8 to 12 depends on it except its art.

### 1.11 Later (not M1)

- **Fliers cross ridges, never regions.** M2. It needs a second adjacency for groups whose every member flies. Dominions lets fliers ignore passes (D1).
- **Passes that open and close.** Dominions does this through the Heat scale and Perpetual Storm. FM has no temperature scale; an M2 ritual could close or open one ridge.
- **Roads and tunnels.** Civ VI's mountain tunnel. M3.
- **A third region kind, "rift"** (a chasm in dry lowland), for the Hollow Court's Rot. M2, with that nation.
- **Fort sites at passes** (Total War), when building forts arrives in M2.


---

## 2. The war table and the tavern

### 2.1 What the player looks at

The camera looks straight down at an oiled oak war table in a tavern. On the table lies a painted linen campaign cloth: the map. The cloth fills the view at the starting zoom, and a band of oak frames it. Zooming out past the cloth ("leaning back") shows the whole table, with its props in the margins and the tavern floor around it. The view is top-down and orthographic all the way out: no tilt, no parallax, no depth of field. Everything that suggests depth is painted into the art. That keeps the province shapes, label boxes and hit areas exact. The calibration sketch shows the composition at three zooms (`sketch/sketch-far.png`, `sketch-mid.png`, `sketch-near.png`).

**Layers, bottom to top, in world space.** Layers 1 to 13 are the staged spec's map layers (UI spec 2.10.1), with the new map layers of sections 1, 3 and 4 inserted (section 8 has the full list).

| # | Layer | Content | Static? |
|---|---|---|---|
| T0 | Tavern floor | the room seen from above, around the table (2.3) | baked |
| T1 | Table shadow | soft dark falloff under the table's rim | baked |
| T2 | Oak table top | the oak tile (2.2), worn edge, brass corner guards | baked |
| T3 | Table light | the hearth-side warm gradient, candle pools, and a vignette toward the table's edge. **Never over the cloth** | baked |
| T4 | Props | at most 8, in the margin only (2.5) | baked, except the mirror props |
| T5 | Cloth | contact shadow, linen ground, weave, leather hem, brass tacks, the margin's compass rose, cartouche and scale bar | baked |
| 1 to 13 | The map | staged spec 2.10.1, with the new layers | as specified |
| T6 | Ambience | candle and hearth glow sprites, dust motes in the window beam, over the table and the room only | live |

### 2.2 The table: "nice oak wood"

- **Wood.** Oiled, quarter-sawn white oak:
  - tawny grey-gold, with straight grain running left to right and silvery ray fleck;
  - darker end grain on the short edges;
  - a worn, slightly lighter top edge where elbows rest;
  - no orange "golden oak" stain. Golden Oak #A96A28 is CIEDE2000 19.5 from Ember's primary (`research-tabletop.md` 5).
- **Tones** (measured against the cloth, `tools/immersion-colors.out`):

  | Tone | Hex | Use | Against the cloth #E8DCC2 |
  |---|---|---|---|
  | Lit oak | #B08A5E | grain highlights, the worn edge | 2.3:1, ΔE 23 |
  | Oak body | #8C6A47 | the board | 3.6:1, ΔE 34 |
  | Oak shade | #5E4630 | grain lines, end grain | 6.5:1 |
  | Oak edge | #3E2E20 | the rim, the cloth's leather hem | 9.6:1 |

  The cloth reads against the table on luminance alone. Oak body is ΔE 8.9 from the Hills fill, but no terrain fill ever touches oak: the linen margin and the hem separate them.
- **Size.** The table extends 20% of the map's short side beyond the cloth on every side. The cloth adds a 26-unit margin around the map's rectangle. That margin is where the cartographic furniture sits: the map's rounded outline leaves room in the corners.
- **Hardware.** Brass corner guards (bright brass #DBBD76 lit, aged brass #7F6C24 shade) and the four brass tacks that pin the cloth. Brass is hardware at corners. It never sits beside a mana symbol and never takes a disc or drop shape: Brass Nail is ΔE 3.8 from Radiance's secondary (`research-tabletop.md` 5).

### 2.3 The tavern: "cozy but natural"

The tavern is seen from above, around the table: the same orthographic view, so there is no seam.

| Element | Where | Notes |
|---|---|---|
| Wide oak floorboards with dark seams | everywhere | straw scattered near the door |
| The hearth | the west side, off the table | firelight spills across the floor and up the table's west edge |
| A leaded window's daylight | a pale patch on the floor to the east | the "natural" light: a window as well as a fire |
| A wool rug, a bench with a folded cloak, a barrel, a stool, a hound asleep on the rug (from above, its face hidden) | around the table | cozy is safety, abundance and softness (`research-tabletop.md` 4.8) |

There are no people and no text. Nothing looms in the dark, which is what separates cozy from Inscryption's dread.

**Seasons.** The room follows the game month, using the battle backdrops' rule (`battle-design/final.md` S2.4):

| Months | Room |
|---|---|
| 11 to 2 (winter) | cool window light #CFE0EA, frost in the window corners, the hearth 20% brighter |
| 3 to 5 (spring) | fresh rushes on the floor |
| 6 to 8 (summer) | the window open, a bright patch |
| 9 to 10 (autumn) | a few leaves blown in by the door, rain streaks on the window |

A season change cross-fades over 2 s, at most four times a year. Reduced motion makes it instant.

**Art source.**
- **M1:** a procedural floor: plank lines, the seasonal light patch, the hearth gradient, and 4 flat silhouettes (rug, bench, barrel, hound) in the oak and pewter tones. It lives in `src/render/map/table/room.ts`.
- **M1-should:** an owner-made top-down raster, one per season (prompt in section 6.3), through `art-inbox/`. It replaces the procedural floor, and the procedural floor stays as the fallback.

### 2.4 Camera and zoom

| Zoom | Rule | What shows |
|---|---|---|
| **Start** | The whole cloth fits the unobscured area (UI spec 2.1) with a **32 px band of oak** on its tightest side | the Mid band on Medium at 1280x720, as the staged spec requires (about 100 px per province on the 65-cell map; the staged spec's 110 had no table) |
| **Lean back (minimum)** | The table fits the viewport (contain), times 0.92 | the whole table and its props, and the tavern floor in a frame around it (`sketch-far.png` shows the table; the floor art is in 2.3). Province names thin by the Far band's priority |
| **Near (maximum)** | unchanged from the staged spec | the Near band |
| **Pan clamp** | The view's center stays inside the table's rectangle | never the void beyond the room art |

- The camera never rotates or tilts and has no parallax: WCAG 2.3.3 names parallax as the standard trigger (`research-tabletop.md` 4.7). Wheel and pinch zoom ease over 120 ms. Reduced motion makes zoom steps instant.
- Clicking the table, a prop or the room does what clicking empty map does: it clears the selection.

### 2.5 Props

Props sit in the table's margin, never on the cloth. Their positions are fixed slots, and the variant in each slot comes from a render-side hash of the game seed, the same every reload. Each prop is decorative, or a **mirror**: it repeats a fact the chrome already shows. No prop is the only place a fact appears, and no prop is clickable in M1.

| Prop | Slot | Kind | Mirrors | Rule | When |
|---|---|---|---|---|---|
| The month candle | bottom-left | mirror | the clock's month hairline (top bar) | wax height = 1 − day/30. At the month's end, after the dominion spread, a fresh candle lights with a 0.4 s puff (instant under reduced motion) | M1 (Phase 12) |
| The hourglass | top-right | mirror | speed and pause | sand runs at the speed's rate (0, 1, 2, 4, 8 grains a second). **It lies on its side while paused**, a fourth channel beside the red tint, the PAUSED word and the hatched pips | M1-should |
| The coin purse | bottom-right | mirror | the treasury | four states: empty (0 gold); a few coins (less than one month of upkeep); a pile (up to 6 months); a heap | M1-should |
| Tankard, inkpot and quill, two dice, a folded letter with a wax seal | top-left and bottom-right | decorative | — | seeded variants (pewter or clay tankard; seal color from the nation's palette secondary) | M1-should |

**Later (M2):** a hover name on each prop; cosmetic clicks (roll the dice, pinch the candle, clink the tankard), as on Hearthstone's boards; and decorating the tavern over a campaign, as in Wartales.

### 2.6 Lighting

- **The cloth is lit by neutral daylight.** Warm light falls on the room and the table only. The cloth takes at most a **2700 K multiply of 8%**, as a gradient toward the hearth side, and no vignette. The research measured that 2700 K at 15% still passes the terrain palette rule (20.8 normal, 12.9 under protanopia), while 1900 K at 15% fails (11.3). Eight percent leaves a margin.
- **The table** carries:
  - the hearth's warm gradient on its west edge: 2000 K #FF890E, additive, 30% at the edge, gone by a third of the way in;
  - the candle pools: 2700 K #FFA757 at 30%;
  - a vignette toward its rim: #140C06, rising to 55% at the edge.
- **The room** takes the same hearth and window light and a vignette toward the screen edge.
- **The chrome** is never lit. Panels stay flat colors.
- **Time of day.** The sim has none, and a day/night cycle would recolor the map (Armello's purple nights). The seasons in 2.3 are the only link to the clock, with the month candle.

### 2.7 The chrome in oak, brass, leather and parchment

The staged `docs/09` "UI chrome" keeps its structure: dark panels, parchment text, two button styles, no mana colors in decoration. What changes is the material. Panels become dark oak. Hardware is brass. Cards get parchment faces. Leather is for spines.

**Tokens** (WCAG contrast measured, `tools/immersion-colors.out`; text #F4EEDF, ink #1C1A17):

| Token | Was | Becomes | Text | Dim text (60%) | ▲ warm / ▼ cool | Brass keyline |
|---|---|---|---|---|---|---|
| `--chrome-0` panel base, top bar | #1C1A17 | **#2E2219** dark oak | 13.35 | 5.71 | 7.12 / 7.11 | 8.50 |
| `--chrome-1` raised rows, cards | #26231F | **#3A2B1F** | 11.74 | 5.28 | 6.26 / 6.25 | 7.48 |
| `--chrome-2` hover, selected tab | #322E28 | **#4A3727** | 9.72 | 4.64 | 5.18 / 5.17 | 6.19 |
| `--leather` dock spines, tab backs | — | **#5A3A28** | 8.76 | 4.29 (**no dim text on leather**) | 4.67 / 4.66 | 5.58 |
| `--brass` keylines, brackets, rivets | — | **#DBBD76** | — | — | — | — |
| `--parchment` card faces, Codex pages | — | **#E8DCC2**, with ink text | ink 12.77 | ink at 70%: 5.53 | warm-ink #8A4A12 5.03 / cool-ink #2F5D73 5.26 | — |

All text passes WCAG AA (4.5:1). Dim text passes on every oak step and is barred from leather. `tests/content/palette.test.ts` checks every pair in this table, as it already checks `--warm` and `--cool`.

**Where material appears.**

| Place | Treatment |
|---|---|
| **Top bar** | an oak rail (`--chrome-0`), with oak grain only in its 3 px top and bottom bevels, a 1 px brass keyline along the bottom edge, and brass rivets at both ends. Readouts sit on flat color |
| **Docks and the strip** | a 6 px oak frame (grain allowed in the frame), 14 px brass corner brackets, and a leather spine on the side that faces the map. The panel body is flat `--chrome-0` |
| **Action buttons** | filled `--chrome-2` with a 1 px brass keyline (6.19:1 non-text contrast). Navigation buttons stay ghost buttons. The keyline is the "this issues a command" signal |
| **Cards** (unit, spell, chassis, battle report) | the staged frame, unchanged (rounded rectangle, header band in the nation's secondary color, symbol row), on a **parchment face with ink text**. Mana symbols on parchment get a 1 px ink ring, because W Radiance's primary #F3E6B8 nearly matches parchment |
| **Codex** | the article pane becomes a parchment page with ink text, a bound book. The topic list stays dark oak |
| **Tooltips** | unchanged in structure and behavior (the owner approved them): `--chrome-0` with a 1 px brass keyline. The gesture footer keeps dim text (5.71:1) |
| **Map mode column** | oak plaques. The active mode gets a brass keyline |
| **Alerts ribbon, toasts** | unchanged shapes and tiers. Toasts get the oak base |
| **Modals** (Research, Ledger, Settings, Game Menu) | an oak frame with brass corners and dark oak pages. Parchment is used only for cards and the Codex |
| **Focus ring** | `--text` 2 px on dark, ink 2 px on parchment (12.77:1) |

**What material never does:**
- grain never sits behind text, numbers or icons;
- brass never touches a mana symbol;
- no leather behind dim text;
- the map is never framed by more than its 6 px dock frame, so the map stays the hero.

### 2.8 Ambient motion, reduced motion, and the settings

| Motion | Parameters | Reduced motion |
|---|---|---|
| Candle flames (month candle, room candles) | brightness ±4%, value noise at 0.7 to 1.3 Hz; flame height ±3% | frozen at the mean |
| Hearth glow on the floor and the table's west edge | ±5% on a 6 s cosine | frozen at the mean |
| Dust motes in the window beam | at most 12; drift of 4 px/s; over the room and table, never the cloth | removed |
| Hourglass sand | at the speed's rate | the sand level is shown, with no stream |
| Season cross-fade | 2 s, four times a year | instant |
| Map repaints (section 4.7) | 600 ms brush wipe | instant |

Nothing flashes. Every rate is under 3 Hz and every change is under 10% brightness, well inside WCAG 2.3.1.

**Settings** (UI state in the store and the save's UI block, never in `GameState`):
- **Interface → Table:**
  - **Full** (default): the room, the table, props and ambience.
  - **Simple:** the oak table and the cloth only. No room art, no props, no motion.
  - **Off:** a flat #1C1A17 around the cloth's hem, today's look. CK3 offers the same switch, and some of its players use it.
- **Interface → Map detail:**
  - **Full** (default).
  - **Reduced:** stamps at half density, alignment motifs and scale motifs off below Near, no ambience.
  - Reduced exists for slow machines and for players who want a plainer map. It never removes information. Settlement tiers, sieges, ritual marks and impassable terrain stay.
- **Accessibility → Reduced motion** (follows the OS) also freezes the table ambience, as listed above. The staged docs/09 list ("the pulse, the idle bob and every UI tween") gains "table ambience and map repaints".

### 2.9 Ambient sound

**Out of M1.** The staged docs/10 limits M1 to battle SFX ("sound other than battle SFX (no music, no UI or alert sounds)"), and the owner has not asked for more. **Later (M2):** a hearth crackle, a soft tavern murmur, rain on the window in autumn, a quill scratch when an order is given, a coin clink when the purse changes state. They would use the battle track's procedural engine (`docs/11-sound.md`) with an "Ambience" volume slider. Each informative sound gets a visual twin. M1 ships no audio code in the map renderer.

### 2.10 Performance budget (table and room)

| Item | Budget |
|---|---|
| Draw calls for T0 to T5 | at most 6 (each layer one baked texture or one atlas batch). No filters, no runtime blur |
| Textures | oak tile 1024² (procedural, or a 2048² raster); room art at most 2048×2048 WebP and at most 1.5 MB; props atlas 1024² |
| VRAM for table and room | at most 24 MB at device pixel ratio 2 |
| Ambience per frame | at most 0.3 ms CPU (2 glow sprites, at most 12 motes) |
| Rebakes | T0 and T2 to T5 bake once per load and per season; the mirror props redraw only on their state change |
| Context loss | every baked layer is rebuilt from state and seed (`render/map/table/*.rebuild()`), as the battle track requires of its decals |

The whole map, table included, must hold docs/06's "60 fps at 1080p with all provinces and 100 army markers" with Table Full and Map detail Full. A Playwright performance smoke runs only on commits that touch `src/render/**`, as the battle design rules (D11).


---

## 3. More map detail: the painted cloth

### 3.1 The surface

- **Fills stay exactly as specified.** The terrain fills, the 10% noise multiply and the 2 px borders of `docs/09` are unchanged, and so is the palette test.
- **Painted grain.** Low-alpha gouache blotches (7%, half ink and half parchment) are baked over the fills, so the cloth reads as painted, not printed.
- **The map's edge.** The rounded outline of the map is a 3 px ink line. Outside it lies bare linen.

Everything else on the cloth is a **stamp**: a small two-tone drawing placed by a seeded sampler inside a province or a region. The calibration sketch has 2,400 stamps on a Medium map at Mid zoom. It reads as a painted map, and every label and badge stays clear (`sketch/sketch-mid.png`).

### 3.2 Terrain detail

Stamp sizes are in world units, a province averages 6400 units², and at the start zoom a unit is about 1.1 px. Counts are per average-sized province and scale with area. Each band shows a nested subset (3.7).

| Terrain | Stamps | Look (two tones: ink outline plus a light face) | Far / Mid / Near | Spacing |
|---|---|---|---|---|
| Forest | canopy crowns in 3 sizes, radius 2.6 to 4.3 | dark crown #26361C, light crown #557A3C, ink 0.8 px, a soft shadow; "half trees" at the inset edge | 25 / 42 / 70 | 6.8 |
| Hills | rounded mounds with 3 to 4 hachure strokes on the shadow side | mound #9C7C2C, ink top line | 3 / 6 / 10 | 16 |
| Mountains (passable) | low peaks, no snow | lit #B4C1C6, shade #6E7F86, ink | 2 / 4 / 7 | 17 |
| Swamp | reed tufts and still pools | reeds #0F3F44, pools #134F55 | 8 / 14 / 22 | 9 |
| Farmland | 2 to 5 field patches with furrows and hedges (**flat**: may pass under labels) | ochres #D9A532 and #F3C85A, furrows #7A5414 at 55%, hedges #465A28 | 2 / 4 / 6 | 21 |
| Wasteland | cracks, stones, dead shrubs | cracks #6E5149, stones #8A7066 with ink, twigs #5A4A40 | 5 / 9 / 14 | 11 |
| Plains | grass tufts, 1 or 2 lone trees, wildflower dots at Near | tufts #7F9A5C | 8 / 14 / 22 | 10 |

**Placement rules** (pure, in `src/present/map/stamps.ts`):
1. **Sampler.** Poisson disc inside the province polygon. It reuses `poissonDisc` from `src/mapgen/voronoi.ts`, on a stream from `streamFor(\`map:${seed}:${provinceId}\`, 'stamps')` (the battle track's `src/present/rand.ts`). Each point gets a **rank** from the order it was drawn in.
2. **Inset.** Tall stamps keep the band width plus 3 units from the edge. Flat stamps (fields, cracks, pools) may reach the edge and are clipped.
3. **The label-and-badge core.** No tall stamp inside a disc of radius max(26 px, 0.42 × inradius) around the label anchor, nor inside the badge box. Flat stamps may pass under a label, whose ink halo keeps it readable.
4. **Order.** Stamps draw by their bottom edge, so nearer ones cover the feet of those behind (Azgaar, research A1).
5. **Shared parts.** The map's tufts, rocks, reeds, dead trees and crop rows are the battle backdrops' props (`battle-design/final.md` S4.4). A province looks like its battlefield.

**Why stamps are more than decoration.** Under fog and in map modes, the fills are hazed or tinted. Measured (`tools/haze.out`): a 20% linen haze already drops Hills against Wasteland to 18.7 (normal) and 10.8 (tritan). A 45% desaturation drops Mountains against Wasteland to 9.2 (protan). In both cases the stamps' shapes still say forest, hills or swamp. So the stamps carry terrain identity exactly where color cannot.

### 3.3 Borders

- **M1:** 2 px #2B2620 between provinces (docs/09). Ownership bands carry nation borders (3.4). Ridges draw as in 1.8.
- **M1-should (Phase 11): painted edges.** Borders are made noisy for drawing only, with Red Blob's midpoint subdivision kept inside the quadrilateral of the two endpoints and the two sites (research R1):
  - amplitude 0.12 of the edge length, recursion down to 6 units;
  - seeded by the pair of province ids, so both provinces get the same edge;
  - **hit tests use the same noisy polygon**, so what the player sees is what they click;
  - adjacency is unchanged, because noisy edges never cross.

### 3.4 Ownership

Ownership bands stay exactly as docs/09 specifies: a flat banner-color strip on the inner border with a `keylineFor` keyline, drawn **above** stamps and settlements. Two additions:
- **The capital pennant.** A small painted banner carrying the nation's sigil (pretender final B.7) stands in the capital's settlement at Mid and Near.
- **Architecture.** Settlements are built in the owner's kit (section 4.2). Ownership therefore shows twice, as a band and as buildings, and neither depends on hue alone.

### 3.5 Labels

- **Provinces.** Names use the display face (Marcellus SC, as in the mockup) in #F4EEDF with a 3.2 px ink halo. Capitals are 2 px larger.
- **Impassable regions.** An italic serif (1.8), so a region never reads as a province.
- **Rules unchanged.** The density budget and the priority culling of UI spec 2.10.3 stay as they are. The only addition: a region's name takes the priority just after Wellsprings, and its box enters `layoutMapLabels`.

### 3.6 Armies as painted miniatures

A miniature replaces the badge, and the **plaque is the badge**. Every rule of the staged badge holds: shape by allegiance, the count, at most one status corner glyph by exception, stacks, fanning, selection, and the transit arrow with its ETA.

| Part | Rule |
|---|---|
| **Base** | an oval, 28 × 10 px at Mid. Nations: dark painted wood #3E2E20 with a 2.2 px rim in the banner color. Independents: pewter #91A092 with the Independents grey rim (ΔE 10 between them, so material and faction agree). The pretender: a gilded rim. A fixed soft shadow sits below |
| **Figure** | the lead commander as a standing figure with a banner pole: its rig (battle design S4.4) in the idle pose, cut down to a map figure. 30 px tall at Mid and 40 to 46 px at Near, **never taller than 46 px**. Pretenders and summons use their own rigs |
| **Escort** (Near only) | 1 to 3 small figures of the army's largest squad's archetype behind the leader: 1 under 20 troops, 2 under 60, 3 from 60 |
| **Plaque** | in front of the base, the allegiance shape (rounded shield for own, notched for other nations, plain for independents) in the banner color. A flat dark plate carries the count in tabular figures, 10.5 px at Mid and 12 px at Near. The status glyph sits on the plaque's corner |
| **Fog** | an unscouted independent force is a **cloaked figure** (its "blank back", as a Columbia block shows one) with the strength word on the plaque. A scout turns it round: the true figure and the exact count |
| **Far band** | the plaque alone, one per nation per province (staged rule) |
| **Selection** | a brass ring on the cloth around the base. The staged bright ring keeps its contrast |
| **Movement** | the figure slides along its path. docs/09's "Walk (map): 0.4 s bob of 3 px" stays, and reduced motion removes it. **No idle bob on the map**: figurines stand still |
| **Box** | figure plus base plus plaque fit 34 × 46 px at Mid. This box is the badge box for `layoutMapLabels`, so miniatures never overlap labels, as the staged budget already requires |

**Where it stops.** Numbers never sit on a painted surface and never take perspective or lighting. Figures never cover the plaque. If a stack's figures would leave its box at Mid, the stack shows one figure and a `×n` tag, as the staged stack does.

### 3.7 Level of detail by zoom

Bands are the staged ones (median province diameter: Far under 70 px, Mid 70 to 180, Near over 180). **Decoration thins by band. Information never does**, which is the staged rule.

| Layer | Far | Mid | Near |
|---|---|---|---|
| Fills, bands, borders | yes | yes | yes, plus painted edges (should) |
| Terrain stamps | 35% of ranks, merged into canopy and relief masses | 60% | 100% |
| Impassable regions and ridges | massif with 3 to 5 stamps; ridges as a sawtooth | full | full, plus scree |
| Settlements | one roof cluster for tier 2 and up, plus capitals | all houses of the tier; walls by PD; landmarks | plus the yard details (wells, carts, fields at the edge) |
| Alignment wash | yes | yes | yes |
| Alignment and scale motifs | none | 1 per strength step and 1 per scale step (4.3) | double |
| Scars and ritual marks | marks that carry information (siege camp, ritual badges) | all | all |
| Miniatures | plaques only | figure, base and plaque | plus escorts |
| Labels | names by priority | staged two lines | staged Near contents |

Thinning by **rank** means zooming in only adds stamps; none move, so the map never shimmers. The baked layer cross-fades over 150 ms when the band changes (instant under reduced motion).

### 3.8 Density budget and baking

- **Caps.** At most 90 stamps per average province at Near (forest is the densest). Settlements have at most 22 houses plus 3 landmarks, and motifs at most 14.
- **Total.** About 7,000 stamps on a Large map at Near, 3% of a 200,000-sprite benchmark. Stamps are not live sprites, though: they are **baked**.
- **The sheet bake.** Each zoom band has one static bake of fills, grain, stamps, settlements, alignment, scars, impassable terrain, borders and bands:
  - tiles of 2048²;
  - the band's scale (Far 0.6, Mid 1.2, Near 2.4 px per unit) times the device pixel ratio.
  - Medium is 816 × 510 units with its regions. Near at DPR 2 is 3916 × 2448, which is 2 × 2 tiles and 38 MB. Mid is 9.6 MB and Far 2.4 MB.
  - Only the current band and the next one are resident, at most 48 MB.
- **Re-bakes.** A province's dirty rectangle (its bounds plus its stamp overhang) re-bakes when its look key changes (section 4.7). At most 4 provinces are re-baked per frame, so a month end with 20 changes takes 5 frames.
- **Live layers.** These stay as specified: mode tints (one batch of province `Graphics`), labels (`BitmapText` for numbers), miniatures (one atlas, at most 100 armies × 3 sprites), paths, selection and effects.
- **The label test grows.** `layoutMapLabels`'s test (UI spec 2.10.3, Medium seeds 1 to 5 at the fit zoom) also checks that no tall stamp's box intersects a label box or a badge box, and that region labels never overlap province labels.

### 3.9 Map modes still read

The staged rule stays: modes tint fills at about 70% over the desaturated terrain fill. Borders, bands, badges, labels and Wellspring glyphs keep full contrast. The detail obeys the mode:

| Detail | In a mode other than Ownership |
|---|---|
| Terrain stamps | ghosted to 40%: terrain is hinted, never competing |
| Settlements and landmarks | full (population and buildings are information) |
| Alignment wash | off (the mode replaces the fill) |
| Alignment and scale motifs | 25% |
| Scars | full for information marks (siege, ritual badges), 40% for the rest |
| Impassable regions and ridges | **never tinted or ghosted** |
| Miniatures, labels, numbers layer | unchanged |

The sketch in Dominion mode shows the tints reading cleanly over the ghosted stamps, with the regions unchanged (`sketch/sketch-dominion.png`).

### 3.10 Fog: "not yet painted"

The staged rules for what is shown stay. Only the look changes:
- **Unexplored.** The cartographer has not painted it yet. The fill sits under a 35% linen haze, terrain stamps are drawn as **sepia line art with no fill** (#6B5A40), and the border is dotted. There is no settlement, alignment or scar detail. Terrain still reads by stamp shape, since terrain is public.
- **Explored, out of sight.** Painted but faded: the fill and stamps are desaturated 45%, and the border is dotted. Settlements and buildings show as the sim allows (population once explored); armies show only where the nation sees.
- **One projection.** Every map look is computed from the same `provinceView(state, viewer, id)` the tooltip and the modes use. The UI spec's **fog guard test** covers `mapLook`: changing hidden state leaves the output unchanged. The art never shows what the tooltip would hide.


---

## 4. Growth over time, by alignment

### 4.1 Principles

1. **Derive from state the sim already keeps.** Population, buildings, construction, PD, siege, unrest, dominion (holder and strength), effective scales, province effects, Wellspring claims, and ownership. The only new state is optional (4.6).
2. **Investment shows.** FM's population moves slowly. Over the M1 target of 70 months a province grows +15% at neutral scales, +115% at Growth +3, and −39% at Rot −3 (`research-mapdetail.md` 3.3). So growth art also counts what the player builds (temples, labs, PD) and how deep a god's presence runs (dominion strength). Imperator rewards players the same way.
3. **Alignment paints the land; ownership builds the houses.** The dominating nation's god repaints the ground. The owner's architecture builds the settlement. A province where they differ tells its own story: a Cinder town with Thornwood brambles creeping in is a faith turning.
4. **Calm and stable.** Slow looks change at most once a month. Growth adds pieces at the edge and decline removes the newest, so nothing reshuffles. The same state gives the same picture after a reload.
5. **Never hide strategic information.** Bands, labels, miniatures, glyphs and mode tints draw above everything in this section. Tall pieces keep out of the label-and-badge core.

### 4.2 Settlements

**Tier from population** (`settlementTier(pop, isCapital)` in `src/present/map/settlement.ts`):

| Tier | Population | Houses | Typical start |
|---|---|---|---|
| 0 Homestead | under 1,500 | 1 | Wasteland, some Mountains and Swamp |
| 1 Hamlet | 1,500 to 3,999 | 2 to 3 | Mountains, Swamp, Hills, Forest |
| 2 Village | 4,000 to 7,999 | 4 to 6 | Forest, Hills, Plains |
| 3 Town | 8,000 to 13,999 | 7 to 10 | Plains, Farmland |
| 4 Large town | 14,000 and up | 11 to 15 (15 at 20,000) | Farmland |
| 5 City (capitals) | — | 16, plus 1 per 5,000 above 25,000, up to 22 | every capital |

- **Houses within a tier** grow linearly with population, about one house per 1,000 to 1,500 people. So a neutral province gains a house or two over a game. A Thornwood province at Growth +3 climbs a whole tier (a 9,000 town becomes about 19,000, from 8 houses to 14). A Rot province loses houses.
- **Center-out, never reshuffled.** House *k* sits on a golden-angle spiral (radius ∝ √k), squashed 1.3 : 0.8 so it reads as ground seen from above. Its jitter, size and roof variant come from `hash(seed, province, 'house', k)`. Growth appends house *k + 1*; decline removes the highest *k*. The anchor sits below and right of the label anchor, outside the core.
- **Walls by PD**, the player's most visible investment (0 to 30 levels, 6,975 gold):

  | PD | Defense |
  |---|---|
  | 0 | none |
  | 1 to 4 | a watchtower |
  | 5 to 14 | a palisade ring |
  | 15 to 29 | a stone wall ring with towers |
  | 30 | adds a gatehouse |

  The ring's radius follows the house count.
- **Landmarks** at fixed seeded slots around the settlement: temple, lab, fort (capitals in M1), Wellspring basin. A building **under construction** shows scaffolding, and the built part's height is `1 − daysLeft / days`, quantized to quarters. Construction is live information (the Build order).
- **Settlement kits by owner:**

  | Kit | Houses | Temple | Lab | Fort |
  |---|---|---|---|---|
  | Cinder Horde | soot roofs #3A3633, ash walls #8F8C88, ember-lit windows (#FFB347 dots, static) | a stepped stone pyre with a brazier | a black spire with an ember window | jagged dark stone walls |
  | Thornwood | round huts with living roofs #4E6B3A, timber walls #A0785A | a grove shrine in a ring of standing trees | a living-wood tower in leaf | a palisade of trunks around a great tree |
  | Independents | fieldstone #D8CBB0, thatch #B89A5A | a plain chapel | a stone tower | a squat keep |

  A future nation adds a kit record of roof, wall, accent and three landmark stamps (`SETTLEMENT_KITS` in content).
- **On capture**, the kit switches to the new owner's at once. A change of ownership is information, so it is an event (4.7).

### 4.3 Alignment: each nation's land look, and the scale poles

**Data** (`src/content/presentation/map/land.ts`):

```ts
export interface LandLook {
  /** Ground wash over the terrain fill, at strength 10. */
  wash: string;
  /** Wash alpha at strength 10; tests/content/palette.test.ts caps it (below). */
  washMax: number;
  /** The nation's own motifs, drawn by strength. */
  motifs: readonly MotifId[];
  /** One per province at dominion strength 7 or more. */
  landmark: MotifId;
}
export const LAND_LOOKS: Readonly<Record<NationDefId, LandLook>>;
/** Motifs per scale pole, drawn per step of the province's effective scale. */
export const POLE_MOTIFS: Readonly<Record<ScalePole, readonly MotifId[]>>;
```

**The rule, which extends to every future nation:**
- A province's land look is its **dominating nation's land look**, at its dominion strength (0 to 10).
- Each axis's effective scale adds that pole's motifs (`effectiveScale = round(nationScale × strength / 10)`, plus a Wellspring step; docs/01 §12).
- Independents have no dominion and scales of 0, so no paint.
- A new nation needs one `LandLook` record. Its scales bring their poles' motifs automatically.

**Strength sets the amount:**

| Dominion strength | Wash alpha | Nation motifs (Mid; Near doubles) | Landmark |
|---|---|---|---|
| 0 | none | none | — |
| 1 to 3 | washMax × s/10 | 1 | — |
| 4 to 6 | washMax × s/10 | 3 | — |
| 7 to 9 | washMax × s/10 | 5 | one |
| 10 | washMax | 7 | one |

**The two M1 nations:**

| | Cinder Horde | Thornwood |
|---|---|---|
| Wash | ash #8F8C88, **washMax 0.12** | moss #5E7F45, **washMax 0.08** |
| Measured at the cap (worst pair of different terrains, either washed or not; normal / protan / deutan / tritan) | 20.9 / 13.4 / 13.7 / 13.1 (passes 20 / 12) | 21.1 / 12.3 / 14.1 / 13.2 (passes). At 12% it fails: protan 10.8 |
| Motifs | ember cairns (a stone pile with a glowing top); charred stumps replacing 4% of forest crowns per strength point; obsidian shards; cracked earth with a static ember seam; smoke curls over settlements | blossom in the canopies (pale #F2D7E0, 6% of crowns per strength point); bramble arcs; mossy standing stones; roots across the tracks; saplings on plains |
| Landmark | the burning cairn: a tall cairn with a brazier | the elder tree: an outsized crown ringed with blossom |

The **wash cap is computed, not chosen.** `palette.test.ts` gains a check over every `LandLook`: for each pair of different terrain fills, with either one washed at `washMax` or both washed, the CIEDE2000 stays at least 20 normal and 12 under each deficiency. Content may set a lower `washMax`, never a higher one. Shapes carry the meaning, and the wash only sets the mood. This is where Total War's corruption overreached (`research-mapdetail.md` 4.1, T5 and T6).

**Scale-pole motifs** (from `research-mapdetail.md` 4.3, given exact shapes). One motif per effective step at Mid and two at Near, from the pole's kit. They are placed by the motif sampler, outside the core.

| Pole | Motifs | Pole | Motifs |
|---|---|---|---|
| Order | straight hedgerows, milestones, roadside shrines | Turmoil | burnt roofs (on houses), an overturned cart, a smoke wisp |
| Lore | standing stones, a small observatory tower | Fury | a war cairn with spears, torn banners |
| Growth | blossom clumps; +8% forest crowns; farmland furrows doubled at +2 | Rot | dead trees replacing 15% of crowns per step, fungus rings, bleached bones |
| Wild | briars, ferns, a beast den | Artifice | a mill, a quarry scar, stone field walls |
| Sanctity | a wayshrine, a glow on the temple landmark | Dread | a gibbet, a crow flock (static), dusk mist at the borders |

A Warlord Cinder Horde (Turmoil 2, Fury 3) at full strength shows ash, cairns, overturned carts and war cairns. An Elder Oak Thornwood (Growth 3, Wild 2) shows blossom, briars, extra trees and doubled furrows. The two read apart at a glance and in grey: one is spiky and stony, the other round and leafy.

### 4.4 Scars and blessings from events

| Event | What shows | Source (state) | Lasts | Information? |
|---|---|---|---|---|
| **Battle** fought by the viewer | churned earth along a line through the province, broken spears, and a stone cairn per fallen commander | the `BattleSummary` kept in the save's UI block (UI spec 4.1: day, province, casualties, commander deaths) | fades in monthly steps (100%, 66%, 33%) and is gone after 180 days | no (the staged battle marker is) |
| **Siege** | a camp of tents in the besieger's banner, a stake ring, a ram. The walls crack below 200 wall HP, lose crenellations below 100, and show a rubble breach at 0 | `ProvinceState.siege` (wall HP), where the besiegers are visible | while it lasts | **yes**: drawn in every mode and band |
| **Pillage** | 1 to 3 smoke columns and burnt field patches | a visible army with the Pillage order in the province | while it lasts; the unrest look then remains | yes |
| **Unrest** | at 25 and up, shuttered windows; at 50, a smoke curl and an overturned cart; at 75, burnt roofs on 30% of houses | `unrest`, where `provinceView` shows it | while it holds | yes (it mirrors the unrest glyph) |
| **Rituals** | the pretender design's persistent marks, adopted unchanged (`pretender-design/final.md` C.4): Forge of Cinders (ember glyph and a months ring), Burn the Fields (a charred-field hatch for 3 months and a badge), Ash Rain (an ash tint fading over 30 days), Fertile Season (a green sheen and a leaf badge), Bounty of the Loam (a wheat badge), Rootwall (a thorn border at 0.35 alpha and a shield badge) | `provinceEffects` via `mapMarks(state, viewer)`; Ash Rain's fading tint is keyed by its message day (`Message.fx`) | as the effect lasts | yes |
| **Wellspring** | unclaimed: a stone basin with a faint five-color shimmer of five static droplets. While a claim runs: a priest figure at the basin and a 10-day progress ring. Claimed: standing stones around it lit in the claimer's banner, with its sigil | `wellspring`, `wellspringClaimedBy`, the claiming priest's order | — | yes (claims are public) |
| **The god and the prophet** | the pretender's miniature on a gilded base with its aura motes; a halo glyph on the prophet's plaque (pretender C.5) | `pretenderId`, `prophetId` | — | yes |
| **Capture** | the new owner's kit at once. With `heldSince` (M1-should): 30 days of scorched roofs and swapped banners | ownership; `heldSince` | 30 days | yes |
| **Long rule** (M1-should) | a dirt track from the settlement to each neighbor held by the same owner for 6 months; paved after 24 months | `heldSince`, `neighbors` | — | no |

### 4.5 Where each visual comes from

| Visual | Derived from | Changes |
|---|---|---|
| Terrain stamps | `MapProvince.terrain`, the seed, the province id | never (season variants four times a year) |
| Settlement tier and houses | `ProvinceState.pop`, capital | month start (4.7) |
| Walls | `pd` | month start |
| Landmarks | `buildings`, `construction` | event |
| Settlement kit | `owner` | event |
| Wash, nation motifs, landmark | `dominion.nation`, `dominion.strength` | month start (spread happens on the month's last day anyway) |
| Scale motifs | `effectiveScale` per axis (`scales.ts`) | month start |
| Siege camp, walls damage | `siege` | event |
| Pillage smoke | commanders' orders, within vision | event |
| Unrest look | `unrest` (in steps) | month start |
| Ritual marks | `provinceEffects`, `Message.fx` | event |
| Battle scars | the UI block's `BattleSummary` list | event, then monthly fade |
| Wellspring | `wellspring`, `wellspringClaimedBy`, the claimer's order | event |
| Roads, capture scorch | `heldSince` (should) | month start |

### 4.6 New state: only one optional field

Everything in M1 derives from existing state, except roads and the capture scorch, which need to know how long the current owner has held a province. The messages are capped at 300 per nation, so they cannot answer that.

- **Field:** `ProvinceState.heldSince: number`, the absolute day the current owner took the province. It is 0 for every province at game start, independents included.
- **Writers:**
  - `capture.ts`, the one place a province changes hands: `heldSince = state.day`.
  - Elimination in `victory.ts`, when provinces pass to no one: `heldSince = state.day`.
  - `createGame`: 0.
- **Save:** the same `STATE_VERSION` bump as Phase 1b if both land together; otherwise a bump of its own. The migration sets `heldSince = 0`.
- **Other uses:** the Province panel's header gains "Held since Y2 M3 (8 months)", a fact players ask for, and the AI may use it later.
- **Test** (`tests/sim/capture.test.ts`): a capture sets `heldSince` to the day, an elimination does the same, a new game starts at 0, and the field survives a save round trip. The determinism test needs no change (it compares two runs).
- **Status: M1-should.** It is cut first if Phase 11 runs long; roads and scorch then wait.

### 4.7 Transitions: calm, monthly, and never hiding anything

**The look key.** `mapLook(provinceView)` returns a key in two parts:
- **slow:** tier, house count, PD stage, wash step, motif counts, pole steps, unrest stage, season;
- **fast:** owner, buildings, construction quarter, siege stage, effect ids, the battle-scar stage, the Wellspring state.

The slow part is computed from the state as it stood **on the first day of the current month**. The renderer caches it when `floor(day / 30)` changes, so slow looks change at most monthly, and right after the dominion spread. The fast part is recomputed on every store bump.

**Repaint.** When a key changes, the province's area is re-baked (3.8) and revealed with a **600 ms brush wipe**: a soft-edged mask sweeping across the province.
- For dominion it sweeps from the direction of the dominating nation's nearest province, so the paint visibly spreads from there.
- For a capture it sweeps from the attacker's side.
- At a month end at most **8** repaints animate. The rest change at once, as the pretender design's candle rule caps its kindles.
- Reduced motion makes every repaint instant.
- Map effects (pretender C.4's cues) play over a repaint, never under it.

**What a repaint never covers.** Labels, bands, miniatures, plaques, status glyphs, mode tints, paths, selection and the numbers layer all draw above the baked layer. A wipe touches only the bake. Tall pieces (houses, motifs, scars) obey the stamp core rule (3.2), so growth never creeps under a label or a badge. The tests check both.

### 4.8 Tests (`tests/present/map/*.test.ts`, Node, no DOM)

- `settlementTier` and the house count at every threshold. Adding population adds the next house and leaves earlier houses where they were. Losing population removes the newest house.
- Walls by PD; the construction quarters; the kit by owner; every nation has a kit and a land look. **When adding a nation, add it to these fixtures** (CLAUDE.md).
- `washMax` against the palette rule, for every land look (in `tests/content/palette.test.ts`).
- Motif counts by strength and by pole step; motif ids exist; no motif belongs to two nations' kits.
- The look key's slow part does not change between two days of the same month, whatever the state does. Its fast part changes on a capture, a siege and an effect.
- **Fog guard:** changing a hidden province's pop, buildings or dominion leaves `mapLook` for the viewer unchanged.
- **Determinism:** the same state gives the same stamps, houses and motifs (positions and variants) across two runs and across a save round trip. Nothing reads `Math.random`, `Date` or `state.rng`.


---

## 5. Leader portraits

"Leaders certainly need portraits." Every commander gets one. A portrait is a **person**: the seed picks the face, and state picks only overlays and the frame. "Varo, now wounded" is still Varo. The calibration sketch's procedural busts read at 72 px and at 32 px (bottom row of `sketch/sketch-mid.png`): helmets, hoods, beards and halos tell them apart before any face detail does.

### 5.1 Who gets which portrait

| Commanders | Portrait | What the seed varies | Count on Medium |
|---|---|---|---|
| National commanders: Cinder Scout, Ash Chieftain, Pyre Priest, Ember Adept, Cinder Magus; Thorn Scout, Warden Captain, Grove Priest, Sapling Druid, Elder Druid | a **bust** from parts (5.2) | face, hair, beard, marks, headgear variant, skin and hair ramps | 5 to 30 per nation over a game |
| Independent Captains | a bust from the shared human set, its **outfit by the province's terrain** (7 pools: reeds in swamps, furs in mountains, and so on) | as above | 58 at game start |
| Pretenders (16 chassis, `pretender-design/final.md`) | the rig in its **portrait pose** with the god's chosen look (B.8): 256, 128 and 64 px with the 256 px detail layer | nothing: the look is chosen in the designer | 1 per nation |
| Summoned commanders: Salamander, Treant (and M2 summons) | their rig's portrait pose | markings and scars only (B.8) | a few |
| The garrison holder | none: it is never selectable and shows as the fort | — | 1 per fort |

**Harmony with the battle track.** The battle design draws dock and name-card portraits as "the rig in its idle pose at 2×, on the banner color" (S4.4). For national and independent commanders, the replay uses the **bust** instead, so the Varo the player knows from the strip is the Varo who falls in the replay. Pretenders and summons keep their rig portraits. Section 8.7 holds the one-line change to the battle design.

### 5.2 The layered SVG system

- **The grid.** 256 × 256 units, with fixed anchors: crown at y 40, eye line at y 122, chin at y 190, collar at y 196. These are the pretender design's 256-unit portrait grid. Strokes marked `data-lod="portrait"` drop below 96 px.
- **Layers, back to front:**
  1. backdrop: dark oak #2B2018 under the banner color at 28%, and the nation's motif pattern at 8%;
  2. hair, cloak and headgear behind the head;
  3. shoulders and clothes, by type and nation, with a `currentColor` tint zone that takes the banner color;
  4. neck;
  5. head shape, in the skin ramp's three tones;
  6. ears;
  7. eyes and brows;
  8. nose and mouth;
  9. marks (soot stripes, warpaint, moss, tattoos);
  10. scars (state; afflictions in M2);
  11. beard;
  12. front hair;
  13. headgear;
  14. state overlays (5.4);
  15. the frame (5.5).
- **The part library** (M1). About 125 small SVGs, authored in Phase 11. Phases 8 to 10 use the same slots drawn as code paths (`proceduralPortraitParts`), as the battle rigs are placeholders until Phase 11 (S4.4):

  | Set | Parts |
  |---|---|
  | Shared (46) | 6 head shapes, 6 eye-and-brow sets, 6 nose-and-mouth sets, 11 hair shapes (bald included), 8 beards (none included), 3 scars, 6 ears and necks |
  | Per nation (34 each) | 4 marks; headgear, 3 to 4 per type × 5 types (Cinder: scout hood, chieftain's horned helm, priest's soot hood with an ember clasp, adept circlet, magus's tall peaked hood; Thornwood: scout hood of leaves, captain's bark helm, priest's grove hood with antler pins, druid circlet of twigs, elder's crown of living wood); collars, 2 per type |
  | Independents (11) | 4 helms; 7 terrain outfits |
  | Overlays (9) | bandage, blood, glowing eyes, brow sigil, halo, crown, runic chains, closed eyes, fog dots |
  | Frames (6) | oak, bronze, brass, gilded, pewter, elemental |

- **Color ramps** (three tones each: `--ramp-dark`, `--ramp-base`, `--ramp-light`; CK2's gradient map, `research-portraits.md` 5.3):
  - Cinder skin: ash grey to soot (#9C9893, #8F8C88, #7E7A75, #6E6A64), with ember-crack hairlines (#FFB347) at 96 px and up.
  - Thornwood skin: bark to blossom undertone (#B48A68, #A0785A, #8C6648, #6B4A2B).
  - Independent skin: #D2B293, #C9A585, #B08A6A, #8C6A4A.
  - Five hair ramps per nation.
- **Pools are content.** `PORTRAIT_POOLS[nationDef][unit]` lists part ids per slot, with optional weights (`src/content/presentation/portraits/pools.ts`). `INDEPENDENT_POOLS[terrain]` does the same for independents. Every recruitable commander type must have a pool, and the content validation fixtures list them (CLAUDE.md).

### 5.3 Seeding

- **Keyed draws.** `portraitSeed = \`${state.seed}:${commander.id}\``. Each slot draws from its own key, `hash32(\`${portraitSeed}:${slot}\`)`, using the battle track's `src/present/rand.ts`. No draw depends on call order, so adding a slot moves nothing else (DiceBear's keyed draws, `research-portraits.md` 5.1).
- **Rendezvous picks.** A slot keeps the part with the best score `−ln(u(seed, slot, partId)) / weight`. Part tables are **append-only**, and a content test pins this. Adding a part then changes about 1/(n+1) of picks, 7.9% when a slot grows from 12 parts to 13, against 92.5% with `hash % n` (`research-portraits.md` 5.5). An art update keeps about 90% of faces.
- **Stable everywhere.** Commander ids are monotonic (`c<n>`), so a reload, a lost WebGL context or a load from the save shows the same face. Portraits never read `state.rng`, so replays, saves and the determinism test are untouched.
- **Repeats.** A nation's commanders of one type are compared side by side at 32 to 72 px. Only the silhouette counts there: headgear or hair, beard, face shape and one strong mark.
  - Bare-headed priests and mages have 11 × 8 × 6 × 5 = 2,640 salient looks: P(any repeat among 8) is 1.1%.
  - Helmeted chieftains and captains have 3 × 8 × 6 × 5 = 720: 3.8% among 8.
  - Independent captains split into 7 terrain pools of about 8 each: about 4%.

  A stored `lookIndex` (a deck that cannot repeat, `research-portraits.md` 5.7) waits until playtests show repeats.
- **Pure composition.**
  - `composePortrait(view: PortraitView, size): PortraitPlan` in `src/present/portrait/compose.ts` returns layer ids, transforms and ramp colors. It is pure and tested in Node.
  - `Portrait.tsx` (`src/ui/portrait/`) renders the plan as inline SVG for the DOM.
  - `src/render/portraits.ts` rasterizes it to a Pixi texture for the battle stage and the map tooltip, cached by (commander, state hash, size).

### 5.4 State overlays

State never changes the face. It picks overlays, the frame and badges (CK2's property slots, `research-portraits.md` 3.1 and 4).

| State | Source | At 96 px and up | At 48 to 72 px | At 32 px and below |
|---|---|---|---|---|
| Wounded | `hp` at most 50% of max | a bandage across the brow | bandage | the cracked-heart glyph on the frame corner (docs/09) |
| Badly wounded | `hp` at most 25% | blood and a darker vignette | blood | glyph |
| Starving, unpaid | `starvedDays`; the nation's unpaid counter | frame corner glyphs (crossed wheat, crossed coin) | glyph | glyph |
| Prophet | `nation.prophetId` | a halo behind the head and a candle flame at the frame's top | halo | halo |
| Pretender | `nation.pretenderId` | the rig portrait (B.8), the crown badge, awakening overlays (dormant: closed eyes; imprisoned: runic chains) | same | crown |
| Mage paths | `pips` | **the pip ring**: one mana symbol per pip on the frame's top arc (UI spec 2.8.2), with "R6" past 6; eyes glow in the color's accent (Ember #FFB347, Loam #A6D96A) at 2 or more pips; a faint brow sigil | ring and eyes | one dot in the dominant color |
| Holy | `holy` | the holy mark on the frame's foot and a symbol on the collar | mark | mark |
| Scout, stealthy | unit tags | the eye or hood role badge (docs/09) | badge | badge |
| Out of sight (an enemy) | `visionOf` | the last-seen portrait, desaturated, in a dotted frame (docs/09's fog pattern). A stealthy commander never shows | same | same |
| Dead (reports, history, victory screen) | the battle record or summary | greyscale with a black corner ribbon | same | same |
| Head-slot item (if the units-and-items design lands) | the commander's equipped head item | the item's part replaces the headgear layer | same | same |
| Afflictions, experience (M2, units design R9 and R10) | new state | eyepatch; scars in three placements; weathering at 3 and 8 battles; renown stars on the frame | — | frame glyphs |

Mana colors appear only on what carries them: the pips and a mage's eyes (docs/09).

### 5.5 Frames by rank

| Rank | Commanders | Frame | Ornament |
|---|---|---|---|
| 0 | Scouts | plain oak #8C6A47 | none |
| 1 | Priests, adepts, druids | bronze #B58735 | corner studs |
| 2 | Chieftains, captains, the magus, the elder | brass #DBBD76 | corner brackets |
| God | the pretender | gilded #F2D27A | a crown notch and the god's sigil in a corner (pretender B.7) |
| Independent | Independent Captains | pewter #91A092 | none |
| Bound | summoned commanders | elemental: ember-iron #4A4440 with an ember seam (Salamander), living root #6B4A2B with leaves (Treant) | — |

Every frame has a 2 px inner band in the **banner color** with a `keylineFor` keyline, so ownership shows on every portrait at every size.

### 5.6 Where portraits appear, and how large

| Surface | Size | Notes |
|---|---|---|
| Commander panel header | **96 px** (the staged spec says 64; leaders deserve faces) | with the pip ring |
| Bottom strip | 72 px | click opens the Commander panel (unchanged) |
| Replay name cards (deaths, arrivals) | 128 px | |
| Codex unit pages | 128 px | a canonical seed per type |
| Replay rosters and docks | 64 px | the battle design's size |
| Battle report card (commanders' fates) | 48 px | dead ones in greyscale with the ribbon |
| Commander and army hover tooltips | 48 px | in the header |
| Outliner rows | 28 px | the "portrait dot" |
| Entity links in text | 20 px | the head only |
| Pretender designer, card | 256 and 128 px | B.8 |

The map miniature shows the commander's **figure**, not the bust. The bust appears in the hover tooltip.

**Level of detail:**
- **96 px and up:** everything.
- **48 to 72 px:** eyes become dots, fine strokes drop, marks stay.
- **32 px and below:** silhouette only (backdrop, head, hair or headgear, beard), plus the halo and crown. Wounds move to the frame glyph and the pip ring to one dot.

### 5.7 The owner's raster layer (ChatGPT images)

- **Order of use:**
  1. a raster set for the (nation, unit), once **complete** (at least 8 images; 12 for each independent terrain pool), picked by the 5.3 seed;
  2. the procedural bust;
  3. docs/09's archetype silhouette with a nation tint.

  Types never mix within one game: two Ash Chieftains must not look as if they came from different games.
- **Style lock.** The brief in section 6.4 is pasted verbatim into every prompt, after an approved **style anchor** image attached as "Image 1: style reference". OpenAI's guide recommends exactly this anchor-and-preserve-list workflow (`research-portraits.md` 6.3).
- **Sizes.** Generate at 1024 × 1536 or 1024 × 1024. The intake crops a 1024² master to the brief's framing and derives **256, 128 and 64 px WebP**. Other sizes are resampled from the next larger one.
- **Files:**
  - the owner drops `art-inbox/portraits/<nation>-<unit>-<anything>.png` (example: `cinderHorde-ashChieftain-braided.png`);
  - accepted files land in `src/assets/portraits/<nationDef>/<unitId>/<nn>.webp`, with a sidecar `<nn>.json` holding source name, sha256 of the original, tool and model as ChatGPT shows them, date, prompt, edits, whether C2PA was present, and the approver;
  - originals stay out of the bundle, in `art-inbox/accepted/` (gitignored), for provenance.
- **Intake** (`scripts/art-intake.ts`, Node, outside the pure folders):
  1. writes the sidecars, crops, derives the sizes;
  2. flags outliers against the set's median in mean luminance, warmth (R − B) and face-box position;
  3. writes a contact sheet (`art-inbox/contact.html`, the set at 64 and 128 px on oak and on dark) for the owner to approve.
- **The manifest.** `src/assets/portraits/manifest.ts` lists each set with `minPool`. Content validation fails on a missing size or sidecar.
- **State on raster portraits** is frame-only: halo or crown above the edge, a wound vignette, glyphs, the pip ring, the rank frame. Face overlays would float on faces that do not share the SVG anchors. A sidecar with hand-set `"anchors": {eyeL, eyeR, crown}` may opt in.
- **Provenance and disclosure.** Prompts alone may not be protected by copyright in the US (`research-portraits.md` 6.7). The procedural system, the frames and the overlays stay the game's own identity, and the sidecars make a store's AI disclosure easy to fill in.

### 5.8 Personal names (M1-should, strongly recommended)

Names do half the work of telling leaders apart. The mockup already shows Varo, Seren, Ondra, Kesh and Ilsa Oakhand.

- **Rule.** `CommanderState.name` becomes a personal name from `personalName(state.seed, commanderId, nationDef)`. It is a pure function: a hash over content name pools per nation, with **no rng draw**, so the sim's random stream is unchanged.
- **Where it is set.** Commanders are created through `src/sim/commanders.ts`, which sets `name: def.name` today.
- **Display.** The unit's name becomes the title: "Varo, Ash Chieftain".
- **Messages** already store their text, so names appear in them from the commander's creation on.
- **Pretenders** keep `NationState.pretenderName` (pretender D7).
- **Cost.** State hashes change, but the determinism test compares two runs, so it holds. One content file of name pools: Cinder harsh and short (Varo, Kesh, Ondra), Thornwood soft (Ilsa, Bren, Maelor), Independents plain.

### 5.9 Tests

- `composePortrait`: the same seed and id give the same plan; a different id gives a different plan; adding a part to a 12-part slot changes at most 12% of 1,000 ids (rendezvous). Every pool's part ids exist, and part tables are append-only (pinned list).
- Overlays: each state picks its overlay and never changes a face layer (the face layers' ids are equal with and without the state). LOD at 96, 64, 32 and 20 px drops what 5.6 says.
- Frames by rank for every commander unit; every recruitable commander unit has a pool (content fixtures); every summon and chassis has a rig portrait pose (with the pretender and battle tracks' fixtures).
- Raster manifest: every set has its three sizes and a sidecar; no set below `minPool` is used.
- UI smoke tests: a `Portrait` renders at each size (CLAUDE.md: "the UI gets smoke tests only where cheap").


---

## 6. Asset production

### 6.1 Inventory

Asset sources:
- **Code:** procedural, drawn by code paths in the renderer.
- **SVG:** small SVG files authored in Phase 11, replacing code paths one by one through the same interface, as the battle rigs do.
- **Owner:** owner-generated raster through `art-inbox/`.
- **Later:** not in M1.

| Asset | Count | Source in M1 | Upgrade | When | Fallback |
|---|---|---|---|---|---|
| Impassable art: massif peaks, mere water, ridge chains | 3 drawings, seeded | Code | SVG peak parts in Phase 11 | **M1, Phase 8** | — (it is gameplay) |
| Oak table top | 1 seamless tile | Code: grain lines, fleck, worn edge (`sketch/table-sketch.html` has a working version) | **Owner**, 2048² (6.3 A) | Code M1 Phase 8; owner M1-should | code |
| Table edge and brass corner guards | 4 corners, 1 edge | Code | — | M1 Phase 8 | — |
| Tavern floor, top-down | 1 per season | Code: planks, light patches, 4 silhouettes | **Owner**, summer and winter (6.3 C); spring and autumn later | Code M1 Phase 12; owner M1-should | code |
| Linen cloth, hem, tacks | 1 | Code | — | M1 Phase 8 | — |
| Compass rose, title cartouche, scale bar | 3 | SVG | — | M1-should Phase 11 | none drawn |
| Props: month candle, hourglass, coin purse, tankard, inkpot and quill, dice, sealed letter | 7 | Code (vector) | SVG | candle M1 Phase 12; the rest M1-should | none drawn |
| Terrain stamps | 7 terrains × 3 to 6 variants (about 34) | Code, Phase 11 | SVG atlas, Phase 11 | **M1, Phase 11** | flat fills |
| Settlement kits | 3 kits × (4 houses + 3 landmarks + 3 wall stages + scaffolding) (about 34) | Code | SVG | M1 Phase 11 | one generic house |
| Nation land-look motifs | 2 × (5 motifs + 1 landmark) | SVG | — | M1 Phase 11 | wash only |
| Scale-pole motifs | 10 poles × 3 | SVG | — | M1-should Phase 11 | none |
| Scars: battle churn, broken spears, cairn; siege tents, stakes, ram, wall cracks; smoke; burnt roofs | about 12 | Code (siege camp in Phase 8, because it is information); the rest SVG | — | siege M1 Phase 8; the rest M1 Phase 11 | the siege glyph |
| Miniature plaques (3 allegiance shapes) | 3 | Code | — | **M1, Phase 8** | — |
| Miniature figures | one per rig archetype | from the battle rigs (`PartSet`), cut down to map scale | Phase 11 SVG parts | Phase 10 (with the rigs); plaque-only before | plaque only |
| Portrait parts | about 125 + 9 overlays + 6 frames | Code paths in Phases 8 and 9 (head, hair, beard, headgear, frame, halo, crown, bandage) | **SVG**, Phase 11 | **M1** | archetype silhouette |
| Raster portraits | 8 per national type (80) + 12 per independent terrain (84) | — | **Owner** (6.4) | the 4 most-seen types M1-should (Ash Chieftain, Warden Captain, Pyre Priest, Grove Priest); the rest later | procedural bust |
| Chrome materials | CSS tokens, 14 px brass bracket SVG, oak bevel strips | Code/CSS | — | tokens M1 Phase 8; brackets and bevels Phase 12 | flat tokens |
| Ambience: candle glow, hearth glow, motes | 3 sprites | Code | — | M1-should Phase 12 | static |
| Ambient sound | — | — | — | Later (M2) | — |

The art inventory adds about 230 small SVGs in Phase 11 to the battle and pretender tracks' 171. Each is a short path file in the docs/09 two-tone style. Every SVG stamp passes the same content test: it has an ink outline and a light face, uses only palette colors, and stays inside its declared box.

### 6.2 Rules for owner-made images

Every owner prompt follows the same rules. They are the docs/09 palette rules applied to raster art:
- **Palette.** Oak #B08A5E / #8C6A47 / #5E4630 / #3E2E20, pewter #91A092, linen #E8DCC2, brass #DBBD76 only on small hardware, firelight kept small. **No large areas of saturated red, orange, green or blue**, because mana colors and banners carry identity on the map. No disc-shaped or drop-shaped brass near the center.
- **Nothing that competes with the map.** No text, letters, numbers, signatures, logos, frames or borders. No people in the room art.
- **Names.** No artists, studios, games, real people or insignia (OpenAI refuses prompts "in the style of a living artist").
- **Workflow.** Generate, then upload to `art-inbox/<kind>/`. The intake script checks size, tileability (for tiles), luminance and chroma ranges, and writes the provenance sidecar. The owner approves on a contact sheet.
- **One anchor per family.** The first approved image of a family (table, room, portraits) is attached as "Image 1: style reference" to every later prompt in that family, with the preserve list repeated (`research-portraits.md` 6.3).

### 6.3 Prompt templates: table and room (exact text)

**A. Oak table top, a seamless tile** (`art-inbox/table/oak-top-<anything>.png`)

```text
A seamless, tileable texture of an oiled quarter-sawn white oak tabletop, seen from directly
above, square, 2048 by 2048 pixels. Straight grain running left to right, visible silvery ray
fleck, gentle natural color variation, tawny grey-gold tones: highlights around #B08A5E, body
around #8C6A47, grain lines around #5E4630. Soft, even, neutral daylight from above, matte oil
finish, a few faint scratches and slightly worn areas, no stains, no knots larger than a
thumbnail, no cracks. Photographic realism with a slightly painterly softness.
The texture must tile seamlessly: the left edge must continue into the right edge and the top
edge into the bottom edge, with no visible seam, no vignette, no lighting gradient across the
image, no shadows of objects.
Do not include any objects, text, letters, logos, borders, frames or people.
```

Accept if it tiles without a seam (the intake script compares wrapped edges) and its mean CIELAB lightness is between 45 and 58.

**B. Table edge (optional, later)**

```text
The rounded edge of the same oiled quarter-sawn white oak table, seen from directly above, a
long horizontal strip 2048 by 256 pixels. The top 70% is the flat tabletop continuing the grain
left to right; the bottom 30% is the rounded, slightly darker edge, worn lighter where elbows
rest, falling into soft shadow (#3E2E20) at the bottom. Neutral even light, matte oil finish.
The strip must tile seamlessly left to right. No objects, no text, no metal, no people.
```

**C. Tavern floor around the table, top-down** (`art-inbox/room/floor-<season>-<anything>.png`; summer first, then winter)

```text
A top-down view, straight down from the ceiling, of the floor of a cozy, natural village tavern
around a large rectangular oak table. The table itself is NOT in the image: the center of the
image is an empty rectangle of plain dark floor 60% of the image wide and 60% high, where the
table will be placed later. Wide format, 2400 by 1600 pixels.
Around that empty center: wide oak floorboards with dark seams; a woven wool rug; a wooden
bench with a folded wool cloak; a barrel; a three-legged stool; a large hound asleep on the rug,
seen from above with its head tucked away; a little straw near a door at the bottom edge.
Light: the warm glow of a stone hearth just beyond the left edge spills across the floorboards
from the left, small and soft; cool natural daylight from a leaded window beyond the right edge
lies as a pale rectangle on the floor on the right. The corners of the image fall gently into
warm darkness.
Season: [SUMMER: the daylight patch is bright and warm, the window is open.]
        [WINTER: the daylight patch is pale and cool, a little frost at its edge, the hearth glow
        is stronger.]
Painterly realism, gouache and oil feel, matte, muted natural colors: oak browns (#5E4630,
#8C6A47), warm stone, pewter greys (#91A092), wool in undyed creams and browns. Keep firelight
small. No saturated reds, oranges, greens or blues anywhere except the small glow at the left
edge. No people, no faces, no text, no signs, no banners, no weapons, no candles in the empty
center.
```

Accept if the center rectangle stays empty and dark (the intake script checks mean lightness under 25 there) and chroma stays under 40 outside the hearth glow.

### 6.4 Prompt templates: portraits (exact text)

**The brief.** It is pasted verbatim into every portrait prompt, after "Image 1: style reference" once an anchor exists:

```text
Head-and-shoulders portrait bust of one fantasy war leader, three-quarter view facing toward
the right side of the image, square 1024 by 1024 pixels (if square is unavailable, 1024 by 1536
with the bust in the upper square). Framing: the top of the head or headgear at 8 to 10% from
the top, the eyes at 38 to 40% from the top, the image cut at mid-chest. One figure only. No
hands, no weapons held up to the face, no text, no border, no frame, no signature, no logo.
Lighting: a single warm candle key light from the upper left (about 1900 kelvin), a dim warm
fill, deep warm shadows. Background: near-black warm brown (#2B2018) with a faint wash of the
banner color given below, plain and unpatterned.
Medium: painterly oil or gouache on wood panel, moderate detail, strong readable silhouette:
the headgear or hair shape and the contrast between face and background must read when the
image is shrunk to 64 pixels.
Mana colors appear only in a mage's eyes, as noted below; nothing else in the image glows.
```

**Subject blocks.** Three lines, appended after the brief. The words in brackets come from the seeded traits the intake script suggests, so a raster set matches its procedural pool's variety:

| Type | Subject block |
|---|---|
| Ash Chieftain (Cinder Horde) | `Nation: the Cinder Horde, ash-born clans of a fire god. Ash-grey skin with faint soot marks, [braided / cropped / shaved] hair, [a braided / short / no] beard, a horned helm of blackened iron, scale armor of dark plates with rusted edges. Banner color wash: ember orange #FD6533, faint. Expression: [grim / fierce / weary].` |
| Pyre Priest | `Nation: the Cinder Horde. Ash-grey skin, soot stripes across the cheeks, a hood of charcoal cloth with an ember-shaped clasp, a collar of dark iron rings with a small flame symbol. Banner color wash: ember orange, faint.` |
| Ember Adept | `Nation: the Cinder Horde. Ash-grey skin, a thin iron circlet, a young [keen / wary / proud] face, a charcoal robe with an ember-red trim. Banner color wash: ember orange, faint.` |
| Cinder Magus | `Nation: the Cinder Horde. Ash-grey skin, a tall peaked charcoal hood, an old [gaunt / heavy / scarred] face. Eyes glowing ember amber (#FFB347). Banner color wash: ember orange, faint.` |
| Cinder Scout | `Nation: the Cinder Horde. Ash-grey skin, a low charcoal hood and a scarf over the lower face, alert eyes. Banner color wash: ember orange, very faint.` |
| Warden Captain (Thornwood) | `Nation: Thornwood, forest clans who remember. Warm bark-brown skin, [braided / long / tied] hair, [a full / short / no] beard, a helm of layered bark plates, a cloak of real leaves over bark armor. Banner color wash: deep moss green #00674B, faint. Expression: [steady / watchful / stern].` |
| Grove Priest | `Nation: Thornwood. Bark-brown skin, a hood of green wool pinned with small antlers, a collar with a carved leaf symbol, moss in the hair. Banner color wash: deep moss green, faint.` |
| Sapling Druid | `Nation: Thornwood. Bark-brown skin, a circlet of twigs, a young [calm / curious / solemn] face, a cloak of moss-green wool. Banner color wash: deep moss green, faint.` |
| Elder Druid | `Nation: Thornwood. Bark-brown skin, a crown of living wood with small leaves, an old [lined / serene / stern] face, a long beard with moss in it. Eyes glowing pale green (#A6D96A). Banner color wash: deep moss green, faint.` |
| Thorn Scout | `Nation: Thornwood. Bark-brown skin, a hood made of overlapping leaves, face paint of green stripes. Banner color wash: deep moss green, very faint.` |
| Independent Captain, by terrain | `Independent captain of a [plains / farmland / forest / hills / mountain / swamp / wasteland] province. Weathered human face, [plains: a plain iron cap and a padded jerkin; forest: a fur-trimmed hood; hills: a dented kettle helm; mountains: a heavy fur mantle and a scarred iron helm; swamp: a reed-woven cloak and a leather cap; farmland: a straw hat over a mail coif; wasteland: a sun-bleached scarf wrapped over a cap]. Banner color wash: neutral grey #8C8A80, faint.` |

Only the two types whose base pips are 2 (the Cinder Magus and the Elder Druid) have glowing eyes in their raster art, matching 5.4. A raster image is the same for every commander of its type, so its eyes cannot follow an individual's pips; the pip ring on the frame does that.

Edits use "change only X; keep everything else the same" and repeat the brief's framing lines, as the guide advises.


---

## 7. Milestone placement

### 7.1 What lands where

| Phase | Lands | Status |
|---|---|---|
| **1b: impassable terrain** (after Phase 7 merges) | rules, mapgen, data, validation, tests, the ridge refusal message, the docs/01 decision, the save version bump | **M1** |
| **8: map rendering and core UI** | the **sheet bake** architecture (bands, tiles, dirty re-bakes), on which everything later plugs in | **M1** |
| | **impassable art**: massifs, meres, ridges, names, the region card, the ✕ cursor, the no-path reason | **M1** |
| | the **Simple table**: procedural oak, linen cloth with hem and tacks, the start zoom with its oak band, lean-back zoom and clamps | **M1** |
| | **miniature plaques** (the badge, in allegiance shapes); the **siege camp** mark | **M1** |
| | **code-path portraits** in the strip and the outliner | **M1** |
| | **oak chrome tokens** (`--chrome-*` values, `--brass` keylines on action buttons) | **M1** |
| 9: remaining UI | the 96 px portrait in the Commander panel; portraits in report cards; parchment card faces and Codex pages | **M1** |
| | Settings: Table (Full/Simple/Off) and Map detail (Full/Reduced) | **M1** |
| | personal names | M1-should |
| 10: battle replay | busts in the rosters (64) and name cards (128); miniature figures cut from the rigs | **M1** |
| 11: art and animation | terrain stamps (SVG atlas); settlements (5 tiers, 3 kits, walls, landmarks, construction); nation land looks (washes and motifs); scars; portrait SVG parts | **M1** |
| | scale-pole motifs; painted edges; cartographic furniture; season variants on stamps | M1-should |
| | `heldSince` with roads and capture scorch | M1-should |
| 12: balance and polish | the room floor (code); the month candle; brass brackets and bevels; the repaint wipe; the performance pass | **M1** |
| | the other props and the ambience | M1-should |
| | owner raster art: table, room, the first 4 portrait sets | M1-should |
| | re-run the docs/09 checklist on maps with impassable terrain (match length, Thornwood against Cinder Horde) | **M1** |

**Later (M2 and beyond):**
- ambient sound;
- interactive props, and decorating the tavern over a campaign;
- fliers over ridges, and passes that open or close; the "rift" region kind; roads as a mechanic;
- afflictions and weathering on portraits (with the units design's R9 and R10);
- raster portraits for every type;
- spring and autumn room art;
- `lookIndex` portrait decks.

### 7.2 Acceptance criteria to change (`docs/10-milestone-1.md`)

The battle and pretender tracks also amend these. The new text adds to theirs:

- **3. Map:** add "and impassable terrain (3 peaks, 2 meres and about 7 ridges on Medium) that never cuts the map, never touches a capital's neighborhood, and always leaves a way around (a ridge within 4 provinces, a region within 6)".
- **14. Art:** add "every commander has a seeded portrait; the map draws terrain detail, settlements by population and buildings, impassable terrain, and each nation's land look by dominion".
- **New 16. The war table:** "The map is a painted cloth on an oak war table in a tavern. Settings offer Table Full / Simple / Off and Map detail Full / Reduced. The map holds 60 fps at 1080p with both on Full, and reduced motion freezes the table's ambience."

### 7.3 Scope guard: the art pass must not stall the playable game

1. **Rules first, art after play.**
   - Phase 1b and Phase 8's impassable art come first, because they change what players can do.
   - Everything else on the map waits until Phase 8's "This is the first point where the game is playable by a human. Play it."
   - Phase 8 ships flat fills plus impassable art plus the Simple table. That is enough to play.
2. **No art item delays a sim or UI criterion.** Each item has a fallback (6.1), so a missing asset never blocks a phase.
3. **One time budget.** The map art in Phase 11 gets the same time as the unit SVGs. Past that, the cut order applies, without a new discussion.
4. **Cut order** (first cut first):
   1. owner raster art;
   2. `heldSince`, roads and scorch;
   3. scale-pole motifs;
   4. painted edges;
   5. props beyond the month candle;
   6. ambience;
   7. personal names;
   8. season variants;
   9. escort figures;
   10. the room floor (the Simple table stays).

   **The M1 floor, never cut:** impassable art; the Simple table; plaques; settlement tiers; terrain stamps (at least Forest, Hills and Mountains); both nations' washes with 2 motifs each; procedural portraits for every commander.
5. **A performance gate.** If the first 120 frames on a machine average under 50 fps, a Hint suggests "Map detail: Reduced". Phase 12 fixes any machine class that the Reduced setting does not bring to 60.
6. **No more new sim state.** Phase 1b's map fields and the two M1-should fields (`heldSince`, names) are all of it. Everything else derives.


---

## 8. Docs text

Each block names its file, where it goes, and its exact text. Docs 07 and 09 are edited **relative to the staged copies** in `/home/user/fm-docs/docs/`. Blocks land in the commit that implements them: docs/01, docs/06 (mapgen) and docs/09-balance (impassable rows) with Phase 1b; the rest with Phases 8 to 12, as section 7 places them.

### 8.1 `docs/01-core-rules.md`

**§2 The map.** After the bullet "Seas are out of scope for M1. The generator produces a landlocked map.", add:

```markdown
- **Impassable terrain.** Some of the map cannot be crossed. *Peaks* (mountain massifs) and
  *meres* (dark lakes) are regions of the map that are not provinces. *Ridges* are borders
  between two provinces, drawn as mountain chains. No army moves, retreats or sees across
  impassable terrain, no dominion spreads across it, and a ritual's reach is counted around it.
  A Medium map has 3 peaks, 2 meres and about 7 ridges, never next to a capital's starting
  neighborhood, and there is always a way around.
```

**Implementation decisions, "Map generation (Phase 1)".** Replace the **Adjacency** bullet with:

```markdown
- **Adjacency**: two provinces are neighbors exactly when their borders share a segment that is
  not a ridge; cells that meet at a single point are not. A province lists its neighbors
  (`neighbors`) and, apart, the provinces across a ridge (`ridges`); together they are every
  shared segment, so the drawn map and the graph always agree.
```

In the **Terrain** bullet, after "capitals included", add: "; impassable regions take part in the ranking (peaks as Mountains, meres as Swamp) and are then removed, so the provinces keep the exact shares".

**Implementation decisions.** Add a new group after "Map generation (Phase 1)":

```markdown
**Impassable terrain (Phase 1b)**

Added on 2026-10-21 by the project owner's direction: "i want to make sure the maps have some
impassible terrain that is noticeable".
- **One adjacency.** `neighbors` holds only passable borders, and every rule that reads it
  (movement, paths, retreat, vision, dominion spread, ritual reach, fort materials, the AI)
  respects impassable terrain with no rule of its own. Move validation names the ridge when a
  path steps across one.
- **Regions.** The map has `round(0.05 × provinces)` peaks and `round(0.03 × provinces)` meres,
  as cells beyond the province count, so a province keeps its mean area. A region is never on
  the map's edge and is at least 3 cells from every capital. Up to 3 touching peaks form one
  named range; a mere touches no other region; a peak touches no mere. Peaks are the highest
  eligible cells, meres the wettest low ones. Regions are named like provinces (`the Ashspine`,
  `Blackmere`).
- **Ridges.** Up to `round(0.05 × borders)` borders between provinces are ridges, chosen from
  borders that touch a peak, continue a ridge, or join two Mountains or Hills provinces,
  highest first. Both provinces of a ridge are at least 2 hops from every capital; a ridged
  border is at least a quarter of `sqrt(provinceArea)` long; a peak sends at most 2 ridges; a
  chain is at most 4 borders long.
- **Always a way around.** After every region and ridge: the province graph is connected and
  2-connected (no single province is the only way into part of the map), every province keeps
  at least 2 neighbors, the two provinces of every ridge are at most 4 passable steps apart,
  and the provinces around every region at most 6.
- **Order.** Cells, then capitals (on every cell), then regions, then terrain on every cell (so
  shares stay exact), then ridges, then Wellsprings, springs, names, population and capital
  distances on the passable graph. The balance search takes up to 10 valid maps.
- **Unchanged guarantees.** Capitals stay at least 6 apart (removing cells and borders only
  lengthens paths), each capital's 2-hop neighborhood has the same provinces as without
  impassable terrain, and Wellsprings are placed and judged on the passable graph.
- **Not in M1:** fliers crossing ridges, passes that open or close, roads and tunnels.
```

### 8.2 `docs/09-balance.md`: rows (date 2026-10-21)

```markdown
| 2026-10-21 | 01 §2 | Impassable regions | none | peaks round(0.05 × provinces), meres round(0.03 × provinces) (Medium 3 + 2); not on the edge; at least 3 cells from every capital; ranges of at most 3 peaks; meres alone; the provinces around a region within 6 steps | Owner direction: noticeable impassable terrain. 200 Medium seeds: 0 failures, 1.8 attempts on average, capitals 9.4 → 10.2 steps and 45.5 → 50.3 days apart, 39% of provinces touch impassable terrain |
| 2026-10-21 | 01 §2 | Ridges | none | up to round(0.05 × borders) (Medium 7); both sides at least 2 steps from every capital; sides within 4 steps by a way around; chains of at most 4; at most 2 per peak; borders at least 0.25 × sqrt(provinceArea) long | Chokepoints with passes, spurs from the massifs; measured detours never above 4 |
| 2026-10-21 | (new) | Map area | provinces × 6400 | (provinces + impassable regions) × 6400 | Provinces keep their size |
| 2026-10-21 | (new) | Province graph | connected | connected and 2-connected (no cut province) | Every baseline map already was (200 seeds); keeps barriers from sealing valleys |
| 2026-10-21 | 01 §2 | Capital balance search | up to 6 valid maps | up to 10 | With impassable terrain, 4-nation maps within 1.5 fell to 34% at 6; at 10 they are 50% (54% without impassable terrain), 3-nation maps 93% (79%) |
```

Under a new heading **"Map presentation"** (like the battle track's "Battle presentation"):

```markdown
| 2026-10-21 | 09 | Start zoom; lean back | fit the map | the cloth fits the unobscured area with a 32 px oak band; zoom out to 0.92 × the table's fit | The table frames the map; still the Mid band at 1280x720 (about 100 px per province) |
| 2026-10-21 | 09 | Light on the cloth | none | at most a 2700 K multiply of 8% | 15% at 1900 K breaks the terrain palette rule under protanopia |
| 2026-10-21 | 09 | Dominion wash caps | none | Cinder Horde ash #8F8C88 at 12%; Thornwood moss #5E7F45 at 8%, scaled by strength / 10 | Largest alphas that keep every terrain pair at CIEDE2000 20 normal and 12 under each deficiency (Thornwood at 12%: 10.8 protan) |
| 2026-10-21 | 09 | Settlement tiers | none | population 1,500 / 4,000 / 8,000 / 14,000; houses 1 / 2–3 / 4–6 / 7–10 / 11–15; capitals 16 + 1 per 5,000 above 25,000, at most 22 | A Growth +3 province climbs about one tier over a 70-month game; a neutral one gains a house or two |
| 2026-10-21 | 09 | Walls by PD | none | watchtower at 1, palisade at 5, stone wall at 15, gatehouse at 30 | PD is the most visible investment |
| 2026-10-21 | 09 | Land motifs | none | nation motifs 1 / 3 / 5 / 7 at dominion 1 / 4 / 7 / 10, a landmark from 7; 1 motif per scale step at Mid, 2 at Near | Strength reads as density |
| 2026-10-21 | 09 | Terrain stamps per average province, Far / Mid / Near | none | forest 25 / 42 / 70; hills 3 / 6 / 10; mountains 2 / 4 / 7; swamp 8 / 14 / 22; farmland 2 / 4 / 6; wasteland 5 / 9 / 14; plains 8 / 14 / 22 | Calibrated in the war-table sketch at Mid: dense, labels clear |
| 2026-10-21 | 09 | Repaint | none | 600 ms brush wipe; at most 8 animated per month end; slow looks change at most monthly | Calm map |
| 2026-10-21 | 09 | Battle scars | none | 180 days, fading in thirds each 60 days | A season of memory |
| 2026-10-21 | 07 | Commander panel portrait | 64 px | 96 px | Leaders need faces (owner direction) |
| 2026-10-21 | 09 | Raster portrait sets | none | used once a set has 8 images (12 per independent terrain) | Too few variants is worse than none |
```

### 8.3 `docs/09-art-direction.md` (relative to the staged copy)

**In "Color palettes",** replace "The map background is a deep parchment #E8DCC2 at the edges fading to #1C1A17 under the UI." with:

```markdown
The map is painted on a linen cloth (#E8DCC2) pinned to an oak war table; see "The war table".
```

**In "Sprite system",** replace "- Portraits for commanders are the same SVG cropped at 2x with a colored backdrop." with:

```markdown
- Commanders have portraits of their own; see "Leader portraits". Pretenders and summoned
  commanders use their rig in its portrait pose.
```

**In "Animation",** add these rows to the table:

```markdown
| Idle (map) | none: miniatures stand still on the map; the walk bob above stays |
| Map repaint | a 600 ms brush wipe over a province whose look changed, from the side the change came from; at most 8 per month end, the rest instant |
| Table ambience | candle flames ±4% brightness at 0.7 to 1.3 Hz; the hearth ±5% on a 6 s cycle; at most 12 dust motes drifting 4 px/s in the window light, never over the cloth |
```

**In "UI chrome",** replace the first paragraph with:

```markdown
The chrome stays dark so the map and the mana colors carry identity, and it is made of the war
table's materials: dark oak panels, brass hardware, leather spines and parchment card faces.
Mana colors never decorate chrome. They appear only on things that carry that color.
```

In the token table, change three values and add five rows. `tests/content/palette.test.ts` checks every text pair at 4.5:1 and every keyline at 3:1:

```markdown
| `--chrome-0` | #2E2219 | panel base, top bar (dark oak): text 13.35:1 |
| `--chrome-1` | #3A2B1F | raised rows, cards: text 11.74:1 |
| `--chrome-2` | #4A3727 | hover, selected tab: text 9.72:1, dim text 4.64:1 |
| `--leather` | #5A3A28 | dock spines and tab backs; text 8.76:1; never dim text |
| `--brass` | #DBBD76 | keylines on action buttons (6.19:1 on `--chrome-2`), corner brackets, rivets |
| `--parchment` | #E8DCC2 | card faces and Codex pages, with ink #1C1A17 text (12.77:1) and dim ink at 70% (5.53:1) |
| `--warm-ink` / `--cool-ink` | #8A4A12 / #2F5D73 | ▲ and ▼ deltas on parchment (5.03:1, 5.26:1) |
```

After the "Cards" bullet, add:

```markdown
- **Materials:** oak grain appears only in frames and bevels (the top bar's edges, the docks'
  6 px frame), never behind text, numbers or icons. Brass marks action buttons (a 1 px keyline),
  dock and modal corners (14 px brackets) and the top bar's rivets, and never touches a mana
  symbol. Card faces and Codex pages are parchment with ink text; a mana symbol on parchment
  takes a 1 px ink ring. Tooltips stay dark (`--chrome-0` with a brass keyline).
```

In the **Motion** bullet, replace "Reduced motion removes the pulse, the idle bob and every UI tween." with "Reduced motion removes the pulse, the idle bob, every UI tween, the table's ambience and map repaints (they become instant)."

**Add five sections after "Animation"** (after the battle and pretender tracks' sections, if those have landed):

```markdown
## The war table

Added on 2026-10-21 at the owner's direction: "the overall map should be on an rustic wartable
in a cozy but natural tavern, nice oak wood".

- **The scene.** Seen straight from above: the map is a painted linen cloth with a leather hem,
  pinned by four brass tacks to an oiled, quarter-sawn white oak table, in a tavern lit by a
  hearth on one side and a window on the other. The camera never tilts; depth is painted, never
  simulated.
- **Oak.** Tawny grey-gold, straight grain left to right, silvery ray fleck, darker end grain:
  lit #B08A5E, body #8C6A47, shade #5E4630, edge #3E2E20. No orange stain.
- **Light.** Warm light falls on the room and the table only: the hearth (2000 K, #FF890E) and
  candles (2700 K, #FFA757), with a vignette toward the table's rim. The cloth is lit by neutral
  daylight and takes at most an 8% 2700 K multiply, never a vignette.
- **The room** follows the game's seasons (winter months 11 to 2, the battle backdrops' rule):
  cooler window light and a brighter hearth in winter. No people, no time of day.
- **Props** stand in the table's margin, never on the cloth: a month candle that burns down as
  the month passes, an hourglass that runs at the game's speed and lies on its side while
  paused, a coin purse that fills with the treasury, a tankard, an inkpot and quill, dice and a
  sealed letter. Props only mirror what the chrome shows and are not clickable.
- **Settings:** Table Full (room, table, props, ambience), Simple (oak and cloth only), Off (a
  plain dark surround).

## The painted map

- **Stamps.** Each terrain has small two-tone drawings (ink outline, light face) scattered by a
  seeded sampler inside each province: forest crowns, hill mounds with hachures, low passable
  peaks, reeds and pools, field patchworks, cracks and stones, grass tufts. They are seeded by
  the game seed and the province, so they never change between reloads; they keep out of a disc
  around the label and the army badge; nearer stamps cover the feet of those behind.
- **Level of detail.** Far shows 35% of the stamps, Mid 60%, Near all; zooming in only adds.
  Information never thins: settlements, sieges, ritual marks and impassable terrain show at
  every zoom.
- **Modes.** In any mode but Ownership, stamps ghost to 40% and land motifs to 25%; settlements,
  information marks and impassable terrain stay at full strength.
- **Fog.** Unexplored land is "not yet painted": the fill under a 35% linen haze, stamps as sepia
  line art, a dotted border. Land out of sight is painted but faded (desaturated 45%). Terrain
  still reads by its stamps' shapes where the hazed fills merge.
- **Armies are painted miniatures**: the lead commander's figure on a round base (painted wood
  for nations, pewter for independents) behind a plaque in the allegiance shape that carries the
  count and the status glyph. The plaque is the badge; at Far only the plaque shows. An
  unscouted independent force stands as a cloaked figure with its strength word.

## Impassable terrain

Drawn by shape in two tones, ink #1C1A17 and snow #F3F0E8, so one tone reaches 4.3:1 or more on
every fill and the shape reads for every kind of color vision.
- **Peaks:** a granite ground (#5E5953) under a massif of snow-capped peaks that fills the cell
  and rises slightly above it, with an ink contour and a snow keyline. Passable Mountains keep
  small, low, snowless peaks, so the two never look alike.
- **Meres:** night water (#182A36) with shore bands and pale ripples (#8FC3D3).
- **Ridges:** an ink spine on the shared border with a chain of light peaks astride it, drawn
  above ownership bands.
- Regions and ridges are never tinted or ghosted by a map mode, are always visible (terrain is
  public), and carry italic names.

## Growth and alignment

The map changes as the game goes on, from state the simulation already keeps.
- **Settlements** grow by population in five tiers (1 to 22 houses, added outward from the
  center, never reshuffled), in the owner's architecture (Cinder Horde soot and ash with ember
  windows; Thornwood living roofs and timber; independents fieldstone and thatch). Walls follow
  PD (watchtower, palisade, stone wall, gatehouse); temples, labs and forts are landmarks;
  construction shows scaffolding.
- **Land looks.** The dominating nation's god repaints the land by dominion strength: a ground
  wash capped by the palette test (Cinder Horde ash, Thornwood moss) and the nation's motifs
  (ember cairns and charred stumps; blossom, brambles and an elder tree). Each scale pole adds
  its own motifs per effective step (Order hedgerows, Turmoil burnt roofs, Lore standing stones,
  Fury war cairns, Growth blossom, Rot dead trees, Wild briars, Artifice mills, Sanctity
  wayshrines, Dread gibbets). A new nation needs one land-look record.
- **Scars and blessings:** siege camps and cracked walls, pillage smoke, unrest (shutters,
  smoke, burnt roofs), battle scars that fade over 180 days, ritual marks while their effects
  last, Wellspring basins and claim stones.
- **Calm.** Slow looks (settlements, land looks) change at most once a month; events show at
  once. A change repaints the province with a short brush wipe. Nothing covers labels, bands,
  badges or glyphs.

## Leader portraits

Added on 2026-10-21 at the owner's direction: "leaders certainly need portraits".
- Every commander has a portrait: a head-and-shoulders bust built from SVG parts on a 256-unit
  grid (backdrop, clothes in the banner tint, head, features, marks, beard, hair, headgear,
  overlays, frame). The game seed and the commander id pick every part, each from its own key,
  by rendezvous over append-only part lists, so a face never changes on reload and an art update
  keeps most faces.
- State never changes the face. It adds overlays (a bandage below half HP, blood below a
  quarter, a halo for the prophet, a crown for the pretender, glowing eyes in a mage's color)
  and frame marks (the pip ring, the holy mark, status glyphs, a dotted frame out of sight,
  greyscale with a ribbon when dead).
- Frames show rank: oak (scouts), bronze (priests, adepts, druids), brass (chieftains, captains,
  the magus, the elder), gilded (the pretender), pewter (independents), elemental (summons),
  each with an inner band in the banner color.
- Sizes: 128 (name cards, Codex), 96 (Commander panel), 72 (bottom strip), 64 (replay docks),
  48 (report cards, tooltips), 28 (outliner), 20 (links). Below 48 px only the silhouette, the
  halo and the crown are drawn.
- Pretenders and summoned commanders use their rig's portrait pose.
- Owner-made raster portraits may replace a type's procedural busts once the type has a full
  set; state then shows on the frame only.
```

**In "Delivery rule",** append:

```markdown
Raster art (portraits, the table, the room) is optional and owner-made: it arrives in
`art-inbox/`, passes `scripts/art-intake.ts` (crops, sizes, checks, a provenance sidecar per
image, a contact sheet for approval) and lands in `src/assets/<kind>/` with WebP sizes and a
manifest entry. A raster set is used only when complete; the procedural art is always the
fallback.
```

### 8.4 `docs/07-ui.md` (relative to the staged copy)

**"Map" → "Drawing".** Replace the whole subsection with:

```markdown
### Drawing
- The map is a painted cloth on an oak war table (docs/09 "The war table"). The camera looks
  straight down; it starts with the cloth filling the unobscured area and a 32 px band of oak
  around it, and can zoom out ("lean back") until the whole table and the tavern floor around
  it show.
- Provinces are filled polygons: terrain color with a subtle noise texture and a 2 px border,
  with terrain stamps, settlements and land looks painted on them (docs/09 "The painted map",
  "Growth and alignment").
- The owner's banner forms an inner band with a keyline (docs/09). Independents have none.
- Impassable regions (peaks, meres) and ridges are drawn by shape and are never tinted by modes
  (docs/09 "Impassable terrain").
- Draw order from the bottom: room, table, props, cloth; fills, noise, stamps, land looks,
  settlements, scars, impassable regions, borders, bands, ridges (one baked layer per zoom band);
  mode overlays, labels, numbers chips, paths, army miniatures, transit arrows, selection rings,
  battle markers; table ambience over the room only.
- The province tooltip and cursor label are DOM placed from Pixi coordinates.
```

**"Modes".** Add after "How a mode draws":

```markdown
- **Detail in modes:** terrain stamps ghost to 40% and land motifs to 25%; settlements,
  information marks (sieges, ritual badges) and impassable terrain keep full strength.
  Impassable regions are never tinted or hatched; in Dominion mode an undominated province shows
  its desaturated terrain, never a flat grey.
```

**"Labels and the density budget".** Add:

```markdown
- **Impassable regions** carry italic names (priority after Wellsprings). No tall stamp,
  house or motif sits inside a label or badge box; the label test checks this too.
```

**"Army badges".** Replace the first bullet with:

```markdown
- **Miniatures:** an army is a painted miniature: the lead commander's figure (30 px at Mid, at
  most 46 px at Near, with up to 3 escort figures at Near) on a round base, behind a plaque that
  is the badge: rounded shield for own armies, notched shield for other nations, plain shield
  for independents, in the banner color. At Far only the plaque shows. An unscouted independent
  force stands as a cloaked figure with its strength word.
```

**"Moving".** Add:

```markdown
- **Impassable terrain:** paths bend around peaks, meres and ridges, and the label says "around
  the Ashspine". A region is never a target (the cursor shows ✕ and "Impassable"). When the way
  around is closed, the reason names both: "No path: the Ashspine blocks the way, and the way
  around crosses hostile Velmere."
```

**"Province tooltip and engagement preview".** Add:

```markdown
- **Impassable regions** have a small card: name, kind, "No army, sight, dominion or ritual
  crosses it", and the provinces it borders as links. A province's card lists the impassable
  terrain it borders.
```

**"Fog".** Replace the subsection with:

```markdown
### Fog
- **Unexplored provinces:** "not yet painted": the fill under a linen haze, terrain stamps as
  sepia line art, a dotted border. Terrain still reads by its stamps.
- **Out of sight:** painted but faded (desaturated) with a dotted border.
- **Fogged values** read "unknown" or a strength word, never 0. Map art uses the same view of
  a province as its tooltip, so it never shows what the tooltip hides.
```

**Commander panel.** Replace "**Header:** portrait with a pip ring," with "**Header:** portrait (96 px) with a pip ring,".

**Bottom strip.** Replace "- **Portrait:** opens the Commander panel." with "- **Portrait** (72 px): opens the Commander panel."

**Settings.** In **Interface**, replace "guidance, reset hints." with "guidance, reset hints, table (Full, Simple, Off), map detail (Full, Reduced)." In **Accessibility**, after "reduced motion," add "(it also freezes the table's ambience and map repaints)".

**Add a section after "Bottom strip (selected commanders)":**

```markdown
## Leader portraits

Every commander has a portrait (docs/09 "Leader portraits"): 96 px in the Commander panel, 72
in the bottom strip, 64 in the replay docks, 48 in report cards and hover tooltips, 28 in the
outliner, 20 beside a name in text. The portrait is the same person everywhere; state shows as
overlays and frame marks (wounds, halo, crown, pip ring, holy mark, status glyphs). A commander
the player cannot see shows its last-seen portrait, faded, in a dotted frame.
```

**"Changes from the previous version".** Add:

```markdown
11. **The war table (2026-10-21, the owner's second direction):** the map is a painted cloth on
    an oak table in a tavern, with impassable terrain, terrain detail, settlements that grow,
    land that changes with dominion, painted miniatures for armies, leader portraits, and oak,
    brass and parchment chrome. Table and Map detail settings were added.
```

### 8.5 `docs/10-milestone-1.md`

**After "Phase 7", add:**

```markdown
### Phase 1b: Impassable terrain (after Phase 7)
- Added on 2026-10-21 by the owner's direction ("i want to make sure the maps have some
  impassible terrain that is noticeable"); rules in `docs/01-core-rules.md` §2 and its
  Implementation decisions.
- `mapgen/impassable.ts`: peaks and meres as cells beyond the province count, ridges between
  provinces; `assignTerrain` with counts; `validateMap` checks (2-connected, detours, capital
  distances, interior regions); `ImpassableRegion`, `ridges`, `beside`; region names; the ridge
  refusal in move validation; a state version bump with its migration.
- Tests: impassable placement and invariants over seeds 1 to 50 on every size and nation count;
  movement, retreat, vision and ritual reach never cross a ridge; generation time; the AI's
  behavior tests re-run.
```

**Phase 8.** Add these bullets (to the UI track's Phase 8 text):

```markdown
- The war table, Simple: oak, the linen cloth, the start zoom with its oak band, lean back.
- The sheet bake per zoom band, with dirty re-bakes; impassable art (massifs, meres, ridges,
  names, the region card, the ✕ cursor and the no-path reason).
- Army miniatures' plaques (the badge); the siege camp mark; oak chrome tokens and brass
  keylines; code-path portraits in the strip and the outliner.
```

**Phase 9.** Add:

```markdown
- Portraits in the Commander panel (96 px), report cards and tooltips; parchment card faces and
  Codex pages; Settings → Interface → Table and Map detail. Should: personal names.
```

**Phase 10.** Add:

```markdown
- Portrait busts in the replay docks and name cards; miniature figures cut from the battle rigs.
```

**Phase 11.** Replace its bullet with:

```markdown
- All SVG placeholders, part system, tinting, procedural animations, spell particles, icons,
  chassis portraits. Manifest with fallbacks.
- The painted map: terrain stamps, settlements (tiers, kits, walls, landmarks, construction),
  land looks by dominion, scars, the repaint. Portrait SVG parts and overlays. Should: scale-pole
  motifs, painted edges, cartographic furniture, season variants, `heldSince` with roads.
```

**Phase 12.** Add:

```markdown
- The tavern floor, the month candle, brass brackets and bevels, the repaint wipe, the map
  performance pass (60 fps at 1080p with Table and Map detail Full). Should: the other props,
  the ambience, owner-made raster art. Re-run the checklist on maps with impassable terrain.
```

**Acceptance criteria.** In 3, after "every color's springs appear at least twice", add ", and impassable terrain (3 peaks, 2 meres and about 7 ridges) that never cuts the map, never touches a capital's starting neighborhood and always leaves a way around". In 14 (in the UI track's wording), after "has a distinct SVG placeholder", add "; every commander has a seeded portrait; the map draws terrain detail, settlements by population and buildings, impassable terrain, and each nation's land look by dominion". Add:

```markdown
16. The war table: the map is a painted cloth on an oak war table in a tavern; Settings offer
    Table Full / Simple / Off and Map detail Full / Reduced; the map holds 60 fps at 1080p with
    both on Full; reduced motion freezes the table's ambience.
```

**Out of scope for M1.** In the UI track's "sound other than battle SFX (no music, no UI or alert sounds)", replace the parenthesis with "(no music; no UI, alert or ambient tavern sounds)".

### 8.6 `docs/06-architecture.md`

**Repository layout.**
- Under `mapgen/`, add `impassable.ts          # peaks, meres and ridges: placement and checks`.
- Under `content/`, add `presentation/map/      # stamps, settlement kits, land looks, pole motifs, table props` and `presentation/portraits/ # portrait pools, ramps, frames`.
- Under `src/`, add these blocks:

```text
    present/map/            # PURE (guarded with src/present): stamps.ts settlement.ts land.ts
                            # scars.ts look.ts (mapLook, look keys) impassableArt.ts
    present/portrait/       # PURE: compose.ts (seeded parts, overlays, LOD)
    render/map/             # SheetBake.ts StampAtlas.ts ImpassableLayer.ts MiniatureLayer.ts
                            # Repaint.ts table/ (room.ts table.ts props.ts ambience.ts)
    render/portraits.ts     # portrait plans to Pixi textures (replay, map tooltips)
    ui/portrait/            # Portrait.tsx (inline SVG)
    assets/portraits/       # raster sets, sidecars, manifest.ts
  art-inbox/                # owner uploads (gitignored), accepted originals
  scripts/art-intake.ts     # crops, sizes, checks, sidecars, contact sheet
```

**Implementation decisions.** Add:

```markdown
- **Impassable terrain** (Phase 1b): `MapData.impassable` holds peaks and meres (ids `x0`...,
  from a counter local to mapgen), `MapProvince.ridges` the provinces across a ridge and
  `beside` the regions a province borders. `neighbors` keeps its meaning (passable), so no
  sim or AI reader changed. The state version was bumped; older maps load with none.
- **Map presentation** (Phase 8): everything the map draws is a pure function of the state
  the viewer may see (`provinceView`, the tooltip's projection) and the seed, computed in
  `src/present/map`; randomness comes from `streamFor('map:<seed>:<province>', purpose)`,
  never from `state.rng`. Static art is baked per zoom band into tiles and re-baked per
  province when its look key changes; slow parts of the key change only at a month's start.
- **Portraits** (Phase 8): `composePortrait` keys every part by `<seed>:<commander>:<slot>` and
  picks by rendezvous over append-only part tables; state picks overlays and frames only.
- Should, if built: **`ProvinceState.heldSince`** (Phase 11), set by capture and elimination,
  for roads and the "held since" line; **personal names** (Phase 9), `CommanderState.name` from
  a hash of seed, commander id and nation over content name pools, with no rng draw.
```

### 8.7 One line in the battle track

In `battle-design/final.md` S4.4, "Portraits for name cards and docks are the rig in its idle pose at 2×, on the banner color" becomes: "Portraits for name cards and docks are the commander's portrait bust (docs/09 'Leader portraits'); pretenders and summoned commanders keep their rig in its portrait pose." This changes no docs text the battle track lands, only its S6.1 roster component's image source.


---

## 9. Mockup brief: changes to `ui-mockup/game-screen-v1.html`, in order

**Goal.** The owner should see and react to everything above in the clickable mockup:
- impassable terrain at three zooms and in every mode;
- the table and the tavern;
- map detail;
- growth over time by alignment;
- portraits everywhere;
- the oak chrome.

**Constraints:**
- procedural art only (canvas 2D, inline SVG, CSS);
- no external images;
- Google Fonts allowed;
- scripts only from cdnjs with pinned versions (d3 7.8.5 is already loaded);
- everything seeded with the existing `mulberry32` or a string-hash variant, with no `Math.random`;
- every existing interaction (hover tooltips, nested terms, locks, alerts, outliner, feed, strip, right-click moves, keys, the phone layout) keeps working.

`sketch/table-sketch.html` in this folder has working canvas code for the oak, the cloth, every stamp, peaks, meres, ridges, settlements, motifs, miniatures and portraits. It can be lifted.

1. **Make room for impassable terrain without losing provinces.**
   - Generate **65 sites** instead of 60 (the 10 × 6 jittered grid plus 5 farthest-point extras, then the two Lloyd rounds).
   - Add a second noise function for wetness.
   - Choose **3 peaks** (highest `noise`) and **2 meres** (highest wetness minus `noise`). Each must be interior (no cell vertex on the map rectangle) and at least 3 Delaunay hops from both capitals. Meres touch no other region, and at most 3 peaks touch.
   - Remove the 5 regions from the province list, so the map keeps **60 provinces**. Name the range "the Ashspine" and the meres "Blackmere" and "Stillwater".
   - Add **7 ridges** on borders between Hills or Mountains provinces, or borders touching a peak. Each must be at least 2 hops from both capitals, keep both sides within 4 passable hops, and leave every province at least 2 neighbors.
   - `nbrs()`, `bfs()` and `pathTo()` use the passable adjacency only. Keep the existing story (Ashfen, Sunmere, Varo, Ilsa) by re-choosing those provinces after the regions are placed.
2. **Put the map on the table.** Draw, under the map:
   - the tavern floor: dark planks, a warm hearth gradient from the left, a pale window patch on the right, and silhouettes of a rug, a bench, a barrel and a sleeping hound;
   - the oak table: grain lines, ray fleck, a worn rim, brass corner guards, a candle pool and a rim vignette;
   - props in the margin: the month candle, the hourglass, a tankard, an inkpot and quill, dice, the coin purse;
   - the linen cloth: weave, leather hem, four brass tacks, a compass rose and a title cartouche reading "The Ember Marches".
   - Change `fit()` so the cloth fits the unobscured area with a **32 px oak band**.
   - Allow zooming out to **0.92 of the table's fit**, and clamp panning to the table.
   - The cloth stays neutral. Warm light falls only on the room and the table.
3. **Bake the static map.** Draw fills, grain, stamps, settlements, motifs, scars, regions, borders, bands and ridges into an offscreen canvas per zoom band (Far, Mid, Near by median province diameter: under 70, 70 to 180, over 180 px).
   - Pan and hover blit the bake. A band, mode, season or look change re-bakes.
   - Labels, miniatures, paths, the hover outline and selection draw live on top.
4. **Draw impassable terrain** as in section 1.8:
   - granite massifs with snow-capped peaks (2 to 3 centerpieces), a 3 px ink contour and a snow keyline;
   - meres in night water with shore bands, ripples and reeds;
   - ridges as an ink spine with a chain of light peaks, drawn above the bands;
   - italic names.
   - Hovering a region opens its card. Right-click on a region shows the ✕ cursor and the toast "Impassable: the Ashspine". A right-click to a province behind a barrier shows a path bending around it, with "around the Ashspine" in the toast. When the way around is blocked by hostile land, the toast names both, as in section 1.8.
   - Add a seventh mode button, **"Passability"**, for the review only. It hatches every province you cannot reach from Varo and outlines the barriers.
5. **Add terrain stamps** with the 3.2 table's shapes, colors and Far / Mid / Near counts:
   - seeded per province;
   - kept out of the label core (a radius of max(26 px, 0.42 × inradius)) and the badge box;
   - drawn by bottom edge;
   - nested by rank across bands.
6. **Add settlements** with the 4.2 rules:
   - tier from population, houses on the golden-angle spiral, the kit by owner (Cinder soot and ember windows, Thornwood living roofs, independent thatch);
   - walls by PD;
   - landmarks: the capitals' fort, temple and lab, and **Sunmere's** temple under construction with scaffolding;
   - the Wellspring basins: Sunmere claimed by the Cinder Horde, with lit stones and the sigil.
7. **Add land looks** with the 4.3 rules:
   - the Cinder ash wash (12% × strength / 10) and Thornwood moss wash (8% × strength / 10);
   - the nation motifs by strength (Cinder ember cairns and charred stumps; Thornwood blossom and brambles);
   - the landmarks at strength 7 and up (the burning cairn, the elder tree);
   - pole motifs: Cinder Turmoil 2 and Fury 3 (overturned carts, war cairns); Thornwood Growth 3 and Wild 2 (blossom clumps, briars, extra trees).
8. **Add scars and events** with 4.4:
   - a battle scar at the province of the report's victory (churned earth, broken spears, a cairn), fading by time-lapse month;
   - a **siege camp** at one Thornwood border fort (tents, stake ring, ram, cracked walls);
   - **Burn the Fields** active on one Thornwood province (charred hatch and badge);
   - **Fertile Season** on Deepmoss (sheen and leaf badge);
   - pillage smoke where the example Cinder army pillages (make one of the existing armies pillage);
   - unrest looks on Ashfen (31: shutters).
9. **Replace the DOM badges with miniatures** (3.6):
   - the figure on its base, behind the allegiance plaque with the count, and the status corner glyph;
   - escorts at Near; plaques only at Far;
   - the cloaked figure and strength word for unscouted independents;
   - the brass selection ring.
   - Keep them DOM (or canvas) so hover, click, double-click and the fan still work.
   - The miniature's box is the badge box. Fix the label collision seen in the sketch by anchoring above the label (the current `sy − 62` offset).
10. **Portraits** (5.2 to 5.6). Write `portraitSVG(commander, size, state)` with seeded slots:
    - 4 head shapes, 6 hair, 5 beards;
    - headgear per type: chieftain horned helm, captain bark helm, priest hoods, adept circlet, magus peaked hood, druid twig circlet, scout hoods;
    - marks (soot stripes, moss);
    - skin and hair ramps per nation;
    - the backdrop on the banner tint;
    - frames by rank (oak, bronze, brass, gilded, pewter);
    - overlays: bandage below 50% HP, halo for the prophet, crown for the pretender, glowing eyes and a pip ring for mages, holy mark, dotted frame when out of sight, greyscale with a ribbon when dead.

    Use it in:
    - the strip at 72 px, replacing the letter tile;
    - the outliner rows at 28 px;
    - the commander hover tooltip header at 48 px;
    - the battle report's commanders' fates at 48 px;
    - a new **Portraits** button (page header) opening a gallery: every M1 commander type × 4 seeds, plus state variants (wounded, prophet, R2 mage, dead, out of sight), at 128, 72 and 32 px.

    The Titan pretender gets a crowned rig-style bust as a stand-in for the B.8 rig portrait. Give the commanders personal names (they already have them).
11. **Retune the chrome to oak, brass and parchment** (2.7):
    - `--chrome-0/1/2` to #2E2219, #3A2B1F and #4A3727; the old `--chrome-3` hover to `--chrome-2`;
    - an oak-bevel top bar with brass rivets and a brass bottom keyline;
    - docks with a 6 px oak frame, 14 px brass corner brackets and a leather spine;
    - action buttons with a 1 px brass keyline, navigation buttons ghost;
    - the battle report and Codex article on parchment with ink text, and mana symbols there with an ink ring;
    - tooltips unchanged except the brass keyline;
    - dim text never on leather.
12. **Make modes read with the detail** (3.9):
    - stamps ghost to 40% and motifs to 25%;
    - settlements and information marks stay full;
    - impassable regions are never tinted;
    - Dominion mode shows undominated provinces as desaturated terrain, not the current flat #3B3832, which would sit next to granite.
13. **Fog** (3.10). Make the provinces 4 or more hops from both capitals "unexplored":
    - linen haze, sepia line-art stamps, a dotted border, no settlement detail, population "unknown" in the tooltip;
    - make two explored provinces "out of sight" (desaturated 45%).
14. **A "Look" popover in the page header** (review controls, not game UI):
    - Table (Full / Simple / Off);
    - Map detail (Full / Reduced);
    - Season (summer / winter: rime on the stamps, a lower snowline on the peaks, a cool window and a brighter hearth);
    - Reduced motion (also honors the OS setting).
    - Under Full, run the ambience: candle flicker ±4% at about 1 Hz, the hearth on a 6 s cycle, at most 12 motes in the window light, the hourglass sand. Lay the hourglass on its side while the game is paused. The month candle follows the clock's day.
15. **A time-lapse slider in the page header**, "Y1 M3 ▸ Y4 M3" (0 to 36 months), that re-derives the example state by month:
    - Cinder dominion spreads one ring every 8 months, with strength rising by 1 every 4 months up to 7;
    - Thornwood's provinces grow at Growth +3 (pop × 1.011 per month), so their villages visibly become towns;
    - the province the Cinder army pillages in months 12 and 13 loses population (pillage takes 2% a day) and drops a tier, with smoke, then shutters and burnt roofs from its unrest;
    - Sunmere's temple finishes at month 2;
    - Kharnath's PD reaches 15 at month 20 (the stone wall);
    - Thornwood takes Ashfen at month 10 (the kit switches, the band changes);
    - the siege starts at month 24;
    - the battle scar fades out by month 6.

    Moving the slider repaints changed provinces with the **600 ms brush wipe** (at most 8 at a time, the rest instant; instant under reduced motion), and the room's season follows the month. This is the owner's "growth over time, based on alignment" made watchable.
16. **Check before handing back:**
    - no console errors;
    - screenshots at 1440 × 900, 1280 × 720 and a phone width, in Ownership and Dominion modes, at Far, Mid and Near, and in winter;
    - labels never overlapped by miniatures or tall stamps at the fit zoom;
    - panning stays smooth (the bake is blitted, not redrawn);
    - reduced motion stops every ambient motion;
    - the old interactions still work (hover, nested tooltips, T lock, alerts, outliner, feed, strip orders, right-click moves, Space, 1 to 4, Shift+1 to 6, M, F, R, H, [ and ]).


---

## 10. Harmony with the other tracks

| Track | What this proposal takes or gives |
|---|---|
| **UI** (staged docs/07, `ui-design/spec-final.md`) | Takes: the zoom bands, the density budget and `layoutMapLabels` (extended to stamps and region labels), "nothing is zoom-gated", mode tinting, badge rules (the plaque is the badge), the fog guard test (extended to `mapLook`), Phase 8 to 10 text (extended). Changes: a 96 px Commander panel portrait; oak `--chrome-*` values; parchment cards and Codex pages; two Interface settings. Tooltips are untouched |
| **Battle presentation** (`battle-design/final.md`) | Takes: `src/present/rand.ts` (`hash32`, `streamFor`), the rigs and `PartSet` for miniature figures, the season rule (months 11 to 2 frost, 9 to 10 autumn), the backdrops' prop kit (tufts, rocks, reeds, dead trees, crop rows), and the D11 test gate for render commits. Gives: the commander bust for replay docks and name cards (8.7) |
| **Pretender** (`pretender-design/final.md` and the owner's answers) | Takes: B.8 rig portraits for gods (the "pretender" row of 5.1), the B.7 sigil (capital pennant, gilded frame corner), C.4 `mapMarks` and the ritual marks (adopted unchanged in 4.4), and C.5 marks (aura on the god's miniature, the prophet's halo glyph). `src/present/map/` is one folder for both tracks' map code |
| **Units and items** (`units-items-design/`) | Takes: the head-slot item replaces the portrait's headgear (5.4, if items land), the reserved overlay slots for afflictions and renown (M2, R9 and R10), and the size ladder for the escort figures' scale. Gives nothing that changes their rules |

## 11. Open questions for the owner (defaults in bold)

1. **Impassable terrain as specified:** peaks and meres as regions (about 8% of the map) plus ridges (about 5% of borders), never next to a capital's neighborhood, always with a way around. **Approve.**
2. **Default table setting: Full** (room, props, ambience), not Simple.
3. **Commander panel portrait at 96 px** (the staged spec has 64).
4. **Personal names for commanders** ("Varo, Ash Chieftain"): **yes, M1-should.**
5. **First raster portrait sets: Ash Chieftain, Warden Captain, Pyre Priest, Grove Priest.**
6. **Cards and Codex pages on parchment; tooltips stay dark.**
7. **Portraits face screen-right everywhere** (mirroring in the replay's right dock would flip asymmetric marks and scars).
8. **"How long held" visuals** (roads, capture scorch, needing `heldSince`): **M1-should.**

## 12. Risks

| Risk | Mitigation |
|---|---|
| Bakes at device pixel ratio 2 on Large maps exhaust memory or stutter | 2048² tiles; only two bands resident (at most 48 MB); at most 4 province re-bakes per frame; the Reduced setting and its Hint; the Phase 12 performance pass with the Playwright smoke |
| Detail clutters the map and hurts reading | The label-and-badge core; ghosting in modes; per-province caps; the `layoutMapLabels` test extended to stamps; the calibration sketch already shows clear labels at Mid with 2,400 stamps |
| Every seed gives a new map after Phase 1b, so AI tuning and checklist numbers move | Land after Phase 7; re-run the AI behavior tests and re-pin seeds; Phase 12 re-measures match length and the Thornwood against Cinder Horde split |
| The art pass eats the schedule | Section 7.3: the M1 floor, the cut order, and the rule that no art item delays a sim or UI criterion |
| Raster art drifts in style or clashes in color | A style anchor; complete sets only; intake checks and a contact sheet; the procedural fallback; the palette rules in every prompt |
| Art leaks fogged information | One projection (`provinceView`) for tooltip, modes and art; the fog guard test covers `mapLook` |
| Brass and candle tones read as mana colors | Brass never touches a mana symbol and never takes a disc or drop shape; mana symbols on parchment get an ink ring; the palette test covers the tokens |
| The generator's new checks make some seeds slow | Measured: at most 11 attempts (p95) with 4 nations, within the 25 allowed; the time test guards 500 ms |

## 13. Files

- This proposal: `wartable-design/proposal-immersion.md`.
- Prototype and measurements: `wartable-design/tools/impassable-proto.ts` (and `.out` files), `immersion-colors.ts`, `impassable-pattern.ts`, `impassable-search.ts`, `two-tone.ts`, `haze.ts` (each with its `.out`), `svgshot.cjs`, `sketchshot.cjs`.
- Prototype maps: `wartable-design/proto-out/proto-medium-s{1..4}.{svg,png,json}`.
- Calibration sketch: `wartable-design/sketch/table-sketch.html` with `map-s2.js` and `map-s3.js`; renders `sketch-mid.png`, `sketch-near.png`, `sketch-far.png`, `sketch-dominion.png`.
- Research it builds on: `research-tabletop.md`, `research-mapdetail.md`, `research-portraits.md`.
