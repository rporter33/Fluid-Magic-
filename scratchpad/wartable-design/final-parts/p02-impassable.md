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
