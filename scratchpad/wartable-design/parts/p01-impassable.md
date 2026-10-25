
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

