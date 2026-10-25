# The war table, instrument first: impassable terrain, map detail, growth by alignment, portraits

Angle: **instrument first.** The war table and the tavern frame the game and make it cozy. The
map stays a precise strategic instrument. A visual earns its place by carrying information or by
staying out of the way. The tavern recedes as the player zooms in. Where readability or speed of
play conflict with atmosphere, readability and speed win.

Owner direction (2026-10-21, binding, `owner-direction.md`): "i would like more detail on the
map, while this is mostly an art pass, i want to make sure the maps have some impassible terrain
that is noticeable, the detail view on the lands are great, some art assets to show the growth
over time would be ideal, based on alignment too! / leaders certainly need portraits / the
overall map should be on an rustic wartable in a cozy but natural tavern, nice oak wood". The
layered UI is approved as it stands (hover, nested tooltips, alerts row, province panel), so this
design changes none of it. It only adds to it.

Inputs read: the staged `docs/07-ui.md` and `docs/09-art-direction.md` (`/home/user/fm-docs/docs/`),
`ui-design/spec-final.md` (2.2, 2.10), the mockup `ui-mockup/game-screen-v1.html`,
`docs/01` (sections 2, 12, 14, Implementation decisions), `docs/03`, `docs/05`, `docs/06`,
`docs/09-balance.md`, `docs/10-milestone-1.md`, `src/mapgen/**`, `src/content/mapgen.ts`,
`src/sim/movement.ts`, the Phase 7 AI in `/home/user/fm-p7f/src/ai`, `battle-design/final.md`,
`pretender-design/final.md` (B.2, B.7, B.8, C.4), `units-items-design/design-draft.md`, and the
three research notes in this folder.

Measurements made for this proposal (scripts and outputs in `calc/`):
- `calc/wilds-proto.ts` → `wilds-proto.out`: the impassable-region placement prototyped on the
  real Phase 1 geometry (`poissonDisc`, `lloydRelax`, `voronoiCells`, `adjacency`,
  `assignTerrain`), 60 seeds × 5 map sizes.
- `calc/base-cuts.ts` → `base-cuts.out`: cut vertices in today's generated maps (`generateMap`),
  40 seeds × 4 sizes.
- `calc/wild-fill.ts`, `calc/wild-fill2.ts`, `calc/wild-edge.ts` → `*.out`: the wild color
  against the terrain fills, mana colors and banners with the repo's own
  `tests/content/colorMath.ts` (CIEDE2000 and the Machado CVD model that `palette.test.ts` uses),
  and WCAG contrast of the wild edge.
- `calc/chrome.ts` → `chrome.out`: WCAG contrast of every text token on the proposed oak chrome.

---

## 0. The design in eighteen lines

1. **Impassable terrain is a region, not a border.** "Wilds" (peaks, chasms, dead lakes) are map
   areas that are not provinces. Nobody owns, enters, crosses or targets them.
2. **No sim code changes.** Every rule that crosses the map (movement, retreat, dominion spread,
   sight, ritual reach, fort materials, the AI's `pathsFrom`) already walks
   `MapProvince.neighbors`. A wild is never a neighbor, so every rule respects it as it stands.
3. **Mapgen adds extra cells and keeps every invariant.** It makes `round(provinces / 20)` ranges
   (Medium: 3) of 1 to 3 cells each. The province count stays exact and the map grows so each
   province keeps its area. There is no cut vertex and no capital beside a wild. Measured: about
   10% extra cells, and 37% of provinces border a wild.
4. **It lands in two commits.** The first puts the code behind `MapGenParams.wilds`, which
   reproduces today's maps exactly when false. The second is the owner-decision commit: it turns
   wilds on, bumps the save version, and re-pins the fixtures and the AI baselines.
5. **A wild reads at every zoom and in every mode.** It has the darkest ground on the sheet (slate
   #24222A, ΔE ≥ 25.4 from every terrain fill for normal vision and ≥ 15.5 under each simulated
   color blindness), a light cliff-tick rim,
   peak, ripple or rift stamps, and a lettered name. Modes never tint it. Mountains, which stay
   passable, gain a drawn footpath, so the two cannot be confused.
6. **The map is a sheet of vellum on an oiled oak table, in a tavern lit by daylight and
   hearth.** Warm light falls on the room and the table, never on the sheet, so every palette
   test still checks exactly what is drawn.
7. **The camera fits the sheet, as now.** The player can lean back to 0.72× fit to see the table
   and its props. Zooming in pushes the table off screen, and the vignette fades to zero. There
   is no second map and no mode switch.
8. **The chrome becomes a dark instrument case.** Every existing token keeps its value. Dark oak
   (#2B231C, grain at most #3A2E23) frames the top bar and the strip. Aged brass (#B8914A) draws
   1 px keylines and corner brackets. Leather is used only for book spines. Every text token
   passes WCAG AA on every new surface: dim text is the worst case at 5.16:1.
9. **Ambience is two candles and a hearth glow.** It is frozen by reduced motion and switched by
   "Table: Full / Simple / Off". There is no sound in M1. Props are inert.
10. **Map detail has two classes.** Ground textures are flat, within ±8% lightness of the fill,
    and allowed under labels. Standing stamps are tall and contrasting, and are excluded from
    label and badge boxes. Both are seeded per (map seed, province, layer) and baked per zoom
    band. Data modes drop all decoration.
11. **Growth is derived from existing state, with no new sim field.**
    - Settlement size comes from `pop`, in the same steps as Population mode.
    - "Thriving" and "declining" compare `pop` with `startPop`.
    - Walls follow PD, and temples, labs and forts follow `buildings`.
    - Siege camps and wall states follow `siege`. Scaffolds follow `construction`.
    - Wellspring claims follow `wellspringClaimedBy`.
12. **Alignment is drawn as shapes, never as tint.**
    - The holder's color family sets the dominion motifs (Ember ash and obsidian; Loam blossom
      and saplings; one family per color, so future nations are covered).
    - `dominion.strength` sets their level.
    - The effective scale per axis, from `effectiveScale`, sets the pole motifs on the province's
      rim.
13. **Change is calm.** Growth and alignment art changes only at month boundaries, with a 600 ms
    cross-fade. Art that is itself information (a building finished, a siege, a capture)
    changes the day it happens, exactly when the panel's icons do. Art never shows more than the
    tooltip does: the fog guard covers it.
14. **Every commander gets a seeded procedural bust.**
    - The face is keyed by `${state.seed}:${commander.id}` and chosen with rendezvous picks over
      append-only part tables.
    - Captains of independents draw from a no-repeat deck keyed by their province.
    - Monsters and pretenders use their rig's portrait pose.
    - The face carries identity. The frame carries rank (4 tiers), allegiance (the badge shape
      grammar) and state (wounds, prophet halo, pretender crown, pip ring, holy mark, starving,
      unpaid, items, fog).
15. **Owner raster portraits come later, as a premium layer.** A set replaces the procedural
    faces of a (nation, unit) type only when it is complete (8 images). One style lock, 256 px
    WebP of at most 24 KB, intake through `art-inbox/`, and a provenance sidecar per file.
16. **Every asset ships procedural first.** That is about 125 map and table shapes and about 116
    portrait parts. Four kinds are owner-generated later: the oak top, the table edge, the tavern
    backdrop, and portraits. Exact prompt templates are in section 7.
17. **M1 placement.** Wilds land after Phase 7. Phase 8 gets the Simple table, wild rendering,
    terrain detail, settlements by tier and PD, and portrait v0. Phase 9 gets the chrome
    materials, the Full table and portrait states. Phase 10 puts portraits in replays. Phase 11
    gets motifs, scars, nation kits and the full part library. A scope guard keeps art from
    blocking play.
18. **Exact docs text** follows in section 9 for docs/01, 06, 07, 09-art-direction, 09-balance and
    10. A 22-step mockup brief follows in section 10.

---

## 1. Instrument-first rules (they settle every conflict below)

1. **The sheet is neutral.** No warm grade, vignette, time-of-day or season light touches the
   map sheet. Light and mood live on the table and the room. The palette tests stay valid
   because what they test is what is drawn.
2. **Decoration sits below information.** Ground textures, stamps, motifs and scars sit below
   borders, ownership bands, mode overlays, labels, chips, paths, badges and selection, which
   keep spec 2.10.1's order. No standing stamp may overlap a label box or a badge box.
3. **One meaning, one look.** Wilds have one look family (the slate and the rim). Their kinds
   differ by stamp shape only. No terrain texture uses the state patterns that docs/09 reserves:
   a uniform 45° hatch (unreachable), a cross-hatch (starving), hatch density (unrest), or dotted
   borders (fog).
4. **Art never shows more than the tooltip does.** Every visual of another nation's land is
   derived from the same fogged view the tooltip reads. The fog guard test (UI spec 7.3)
   includes the map look functions.
5. **Calm by default.** Growth and alignment change at month boundaries. Ambience is slow, small,
   and off under reduced motion. Nothing flashes, which keeps WCAG 2.3.1 satisfied.
6. **Stable.** Every random choice in presentation comes from a hash of the game seed and a
   stable id (province, commander, layer). None uses `state.rng`, `Math.random` or wall time,
   except the ambient flicker clock, which only animates. The same save looks the same on every
   reload.
7. **Everything decorative can be turned off.** Settings → Interface gets "Table: Full / Simple
   / Off" and "Map detail: Full / Reduced". Tests run with Off and with Full.
8. **The approved UI is untouched.** Tooltips, alerts row, outliner, panels, strip, keys and the
   depth audit keep their layout and tokens. This design only adds a frame, map art and
   portraits.

---

## 2. Impassable terrain: wilds

### 2.1 The decision: regions, not ridges

| Model | For | Against | Verdict |
|---|---|---|---|
| (a) **Ridge**: an impassable border between two provinces | No change to the cells. A blocked border chain reads as a mountain line. Dominions does this (`#neighbourspec 4`; research-mapdetail 2.1). | It is a line competing with borders, bands, the hover outline, path previews and the ritual contour. At Far zoom it becomes a thick border. The player must inspect every border, so two provinces that visibly touch may not be neighbors. A Mountains province beside a ridge is easy to misread. | Later, as border kinds for dynamic passes (M2) |
| (b) **Wild region** (massif, chasm, dead lake): cells that are not provinces | It is an area. It is the most noticeable model at every zoom and in every mode, it can be named, and nobody owns it, so it has no band. The rule is one sentence. Every sim reader already respects it, because it is never in `neighbors`. EU4, CK3, Imperator and Endless Legend 2 use it (research-mapdetail 2.1). | It uses map area and needs extra cells, which this design pays for by growing the map. | **M1** |
| (c) Very costly terrain | No new rules. | It is not impassable, which is what the owner asked for. FM's Mountains already take 9 days at speed 2. | No |

The owner asked for *impassable terrain that is noticeable*. An area can be noticed at Far zoom.
A line with no width cannot.

### 2.2 Rule (player-facing)

> Some of the map is not province: wild ranges of peaks, chasms and dead lakes. No one owns,
> enters, crosses or targets a wild. Two provinces are neighbors only where their own borders
> meet, so a wild between them blocks movement, retreat, dominion spread, sight and ritual
> reach alike. Everything that counts in provinces counts around it. Every province can still
> reach every other, and no single province is the only way through.

### 2.3 What it changes, rule by rule (and the code that already does it)

| Rule | Effect of a wild | Code today | Change |
|---|---|---|---|
| Movement and pathing (docs/01 §6) | Paths go around. Leg days are unchanged. ETAs grow where a detour is needed. | `findPath`, `pathsFrom` and `findPathFor` (`src/sim/movement.ts`) iterate `neighbors` | none |
| Move validation | A path step across a wild is "not connected" | `commands/army.ts:58` `neighbors.includes(next)` | none |
| Hostility (Phase 3 rule) | Unchanged. A wild is never hostile, because it is never a province. | `hostileProvinces` | none |
| Retreat (Phase 4 rule) | Retreat goes only to real neighbors | `conflict.ts:98` filters `neighbors` | none |
| Sight and fog (§14) | Sight 1 and 2 count hops around a wild. Terrain is public, so every wild is always visible with its name. | `visibility.ts` `addWithin` over `neighbors` | none |
| Dominion spread (§12) | A check never lands on a wild. Spread flows around it. | `dominion.ts:102` `pick(state.rng, neighbors)` | none |
| Ritual reach (docs/02) | `withinHops` goes around. The targeting contour skirts the wild. | `rituals.ts` `withinHops` | none |
| Fort materials (§4) | Only real neighbors give 50% | `selectors.ts:200` | none |
| AI | Fronts, threats and paths follow `neighbors` | `/home/user/fm-p7f/src/ai/{assess,army,defense,magic,war,plan}.ts`. No AI file reads geometry (grep: no `center`, `site` or `polygon`). | none, except re-measured baselines |
| Saves | `MapData` gains `wilds` | `STATE_VERSION = 1` (`src/sim/types.ts:28`) | +1, with a migration that sets `map.wilds = []` |
| Independents | A province behind a wild is farther from the nearest capital in hops, so it gets a stronger guard (`8 + 4d`) | `capitalDistance` on the province graph | none (that is the correct reading) |

The sim needs no new branch, because a wild is not in the graph. A ridge model that kept
blocked borders out of `neighbors` would cost the sim nothing either. The choice between the two
is made on readability (2.1), not on code.

### 2.4 Data

```ts
// src/content/mapgen.ts (data)
export const WILD_KINDS = ['peaks', 'deadLake', 'chasm'] as const;
export type WildKind = (typeof WILD_KINDS)[number];
MAPGEN.wildProvincesPerRange = 20;          // ranges = round(provinces / 20)
MAPGEN.wildRangeCellWeights = [25, 50, 25];  // a range has 1, 2 or 3 cells
MAPGEN.wildRangeSeparation = 3;             // hops between two ranges in the full cell graph

// src/content/names.ts (data): syllables per kind, e.g.
// peaks: ['Ash','Grey','Iron','Cold','Crag','Wolf'] + ['spine','teeth','crown','horns','fells']
// deadLake: ['Dead','Still','Black','Hollow','Grey'] + [' Mere',' Water',' Tarn',' Fen-lake']
// chasm: ['Black','Deep','Split','Gall','Ember'] + ['rift','maw','scar','gorge','cleft']
// The name always takes "the": "the Ashspine", "the Still Mere", "the Blackrift".

// src/mapgen/types.ts
export type WildId = `w${number}`;           // by index; never from the game's id counter
export interface MapWild {
  id: WildId;
  name: string;
  kind: WildKind;
  /** The range's cells, each convex and positively oriented like MapProvince.polygon. */
  cells: Point[][];
  /** Label anchor: the centroid of the largest cell. */
  center: Point;
  /** Provinces that share a border segment with any of its cells, sorted by id number. */
  borders: ProvinceId[];
}
export interface MapGenParams { seed: number; size: MapSizeId; capitals: readonly CapitalSpec[]; wilds: boolean }
export interface MapData { /* ...as now... */ wilds: MapWild[] }
```

- Province ids stay `p0` to `p{n-1}`, and the game's id counter does not move, so commander and
  squad ids are unchanged for a given map.
- `GameSetup` passes `wilds` through. New Game sets `true`, with no UI toggle in M1. The AI vs AI
  runner gets `--wilds on|off`, default on.
- A pure helper `wildOutline(wild): Point[][]` (in `src/mapgen/geometry.ts`) returns the
  boundary loops: the cell edges not shared by two cells of the same wild. The renderer and the
  hit test use it.

### 2.5 Mapgen algorithm (inside `attempt`, `src/mapgen/generate.ts`)

The order keeps today's rng stream exactly when `wilds` is false:

1. **Plan cells.** If `wilds`, draw `target[r] = 1 + weightedIndex(rng, wildRangeCellWeights)`
   for each of `R = round(count / wildProvincesPerRange)` ranges.
   `total = count + Σ target`. Otherwise `total = count` and nothing is drawn.
2. **Geometry** for `total` sites, as today. `mapDimensions(total)` gives the bounds and outline,
   so each province keeps `provinceArea`. With wilds on, the bounds are computed per attempt.
   Then come `poissonDisc`, `adjustCount`, `lloydRelax`, `voronoiCells`, `adjacency`, and the
   existing checks for empty cells, minimum neighbors and connectivity, all on the full cell
   graph.
3. **Capitals** by `placeCapitals` on the full cell graph, as today.
4. **Noise**: elevation and moisture sampled at every site, as today.
5. **Wilds** (`placeWilds`, new, `src/mapgen/wilds.ts`), only if `wilds` is on:
   - Kinds come from `shuffle(rng, [...WILD_KINDS])` and cycle over the ranges.
   - Scores: peaks use `elevation`, a dead lake uses `moisture − elevation`, a chasm uses
     `−moisture`.
   - **Seed cell**: the highest-scoring cell (lower index on ties) that meets all of these:
     - it does not touch the map outline;
     - it is not a capital and not adjacent to one;
     - it is at least `wildRangeSeparation` hops from every cell already wild;
     - its removal is safe (below).
   - **Growth**: add the highest-scoring neighbor of the range under the same conditions (the
     outline rule aside) until the range reaches its target.
   - **Removal is safe** when the remaining provinces meet all three conditions:
     - they are connected;
     - each keeps at least `minNeighbors` (2) province neighbors;
     - the province graph has no cut vertex.
   - A range that cannot reach its target fails the attempt (`'no room for wilds'`), which is
     retried like any other failure. The site count assumed every planned cell.
6. **Provinces** are the remaining cells, re-indexed in site order. Their adjacency is the full
   adjacency without wild cells.
7. **Everything else is unchanged and runs on the province graph:**
   - `assignTerrain` over the province cells, so the shares stay exact, capitals included;
   - `placeWellsprings` with the fairness and spacing rules;
   - springs, names (then `nameWilds`, unique against province names), populations,
     `capitalDistance`, and independent strength.
8. **Validation.** `validateMap` runs on the result, with the new checks below. The balance search
   (`capitalBalanceRatio` 1.5, `balanceCandidates` 6) is unchanged.

**How each invariant still holds:**

| Invariant | Holds because |
|---|---|
| Exact province count | Wild cells are extra sites. `count` provinces remain. |
| Terrain shares exact | Terrain is assigned by rank over province cells only. |
| Capitals ≥ 6 apart | They are placed on the full graph, and removing cells only lengthens paths. `validateMap` still checks the province graph. Measured: always held, and the mean capital distance rose from 9.48 to 10.02 on Medium (`wilds-proto.out`). |
| 1.5× capital-neighborhood ratio | `capitalBalance` on the province graph, with the same candidate search. Measured first-attempt pass rates: Medium 30/60 with wilds against 32/60 without, which is the same within noise. The search over 6 valid maps covers it, as today. |
| Wellspring fairness and spacing | `placeWellsprings` runs on the province graph. |
| Adjacency only through shared segments | Province–province adjacency is still the shared-border test. A wild breaks no segment between two provinces. It only takes cells out. |
| Connected province graph | The removal check, plus `validateMap`. |
| Min 2 neighbors | The removal check, plus `validateMap`. |
| No single-province chokepoint | The new no-cut-vertex rule. Measured: today's maps have no cut vertex in 160 of 160 (`base-cuts.out`), so the rule keeps an existing property. It applies when wilds are on, so `wilds: false` stays bit-identical. |
| Capital never walled in | No wild touches a capital. The 2-hop ring keeps every neighbor. |

**`validateMap` additions** (when `params.wilds` is true):
- the wild count equals `round(count / 20)`;
- each wild has 1 to 3 non-degenerate cells, and the cells of one wild share segments, so they
  are connected;
- different wilds share no segment, and no province appears in two wilds' `borders` (that is
  separation ≥ 3);
- every wild borders at least 2 provinces, and no capital is in any `borders`;
- `borders` matches the geometry;
- the province graph has no cut vertex;
- wild names are unique and differ from every province name.

**Measured** (`calc/wilds-proto.out`, 60 seeds per configuration):

| Map | Provinces | Ranges | Wild cells (mean) | Provinces bordering a wild | Attempts short of room |
|---|---|---|---|---|---|
| Small, 2 nations | 40 | 2 | 3.9 (9.8%) | 36% | 5 of 60 |
| Medium, 2 | 60 | 3 | 6.1 (10.2%) | 37% | 1 of 60 |
| Large, 2 | 80 | 4 | 8.1 (10.1%) | 36% | 4 of 60 |
| Medium, 3 | 85 | 4 | 8.2 (9.6%) | 33% | 1 of 60 |
| Large, 4 | 130 | 7 | 13.9 (10.7%) | 38% | 1 of 60 |

The prototype placed the capitals after the wilds, with a "not beside a wild" filter. The spec
places them first, on the full graph, to keep the rng stream, and then keeps wilds away from
them. That order also guarantees capitals ≥ 6 apart, because removing cells only lengthens
paths. Commit A's tests re-measure every row with the spec's order.

The kinds land beside the terrain that explains them. Peaks border mostly Hills and Mountains,
dead lakes border Swamp and Forest, and chasms border Wasteland and Plains (border counts in the
output). On Medium the map grows by about 10% in area, about 5% per side.

### 2.6 Tests

| File | Test |
|---|---|
| `tests/mapgen/wilds.test.ts` | Seeds 1–30 × every size × 2–4 nations, with wilds on: `validateMap` is empty; province count is exact; terrain shares are exact; there is no cut vertex; no capital borders a wild; ranges ≥ 3 apart; seed cells are off the outline; the kinds cycle. The same params give the same `MapData`. |
| `tests/mapgen/wilds.test.ts` | **Bit-identity**: with `wilds: false`, `JSON.stringify(generateMap(p))` equals a hash pinned before the change, for seeds 1–5 × Small, Medium and Large. This proves commit A changes nothing. |
| `tests/mapgen/validate.test.ts` | Each new `validateMap` check fires on a hand-broken map (a wild touching a capital, two wilds sharing a province, a cut vertex). |
| `tests/sim/movement.test.ts` | On a seed with a wild, two provinces on opposite sides of it are not neighbors, and `findPath` goes around (its path length is greater than the hop count through the wild would be). |
| `tests/sim/visibility.test.ts`, `rituals.test.ts`, `dominion.test.ts` | Sight, `withinHops`, and spread targets never include a wild id, and never reach across one in fewer hops than the province graph gives. |
| `tests/sim/serialize.test.ts` (Phase 9) | A version-1 save migrates to `wilds: []` and plays on identically. |
| `tests/content/palette.test.ts` | The wild slate joins the terrain fills in the pairwise test (≥ 20 normal, ≥ 12 under CVD). |
| `tests/ai/*` | `runMatch` completes 20 games on wild maps. The docs/09-balance matchup check (Thornwood about half) is re-measured and recorded. |
| `tests/ui/derive/mapLabels.test.ts` | Wild labels take part in overlap culling, and wild polygons are hit-tested before provinces. |

### 2.7 Landing it as an owner decision

- **Commit A, "Phase 1b: wilds behind a switch"**, can land any time, even during Phase 7:
  - `placeWilds`, the `MapGenParams.wilds` flag (default `false` everywhere), the
    `MapData.wilds` field (always `[]`), the validations and the tests;
  - the bit-identity test proves that no map, fixture or AI baseline moves.
- **Commit B, "Phase 1b: impassable terrain (owner decision 2026-10-21)"**, lands right after
  Phase 7 merges, so the AI baselines move once:
  - New Game and the AI vs AI runner default to `wilds: true`;
  - `STATE_VERSION` +1, with the migration;
  - the fixed-seed fixtures are re-pinned (determinism hash, mapgen snapshots, any test that
    names a seed's province ids);
  - `npm run sim:aivai -- --games 20 --seed 1` is re-run and the matchup row is recorded;
  - docs/01 §2 rule and Implementation decision, docs/09-balance rows, docs/10 criterion 3.
- **Phases that change:** Phase 1 (mapgen, content, validate, tests); Phase 2 (the version
  constant); Phases 3 to 6 (no code, fixtures only); Phase 7 (baselines only); Phase 8 (rendering,
  section 2.8); Phase 9 (the migration in `serialize.ts`).

### 2.8 Art: noticeable at every zoom, in every mode, for every viewer

**The look (one family):**
- **Ground: wild slate #24222A**, the darkest ground on the sheet (L\* 13.7; the darkest terrain
  is Forest at L\* 29.8). Its smallest CIEDE2000 to any terrain fill is to Forest: normal 25.4,
  protan 22.5, deutan 20.3, tritan 15.5. That passes the palette test's 20 and 12
  (`wild-fill2.out`). Against the eight banners its minimum is 17.8 (tritan). The slate is never
  tinted, banded, hatched, fogged or mode-tinted.
- **Rim: the cartographic cliff mark.** It is a 6 px inner band of short ticks perpendicular to
  the edge, #E9E4D8 at 85%, 4 to 7 px long and 5 px apart, with a seeded jitter of ±1 px. At Far
  zoom the ticks are 3 px, 4 px apart. The edge is at least 3:1 on one side against every
  terrain (`wild-edge.out`): slate vs Plains 9.71, Farmland 8.76, Mountains 6.02, Wasteland 5.00;
  ticks vs Forest 7.42, Swamp 4.44, Hills 4.14. The 2 px province border (#2B2620) still runs
  along the outside.
- **Kind stamps** (shape carries the kind):
  - **Peaks**: overlapping massif peaks drawn tallest first, at most 30% overlap. Each has a lit
    face #6B6775, a shadow face #1A1920 and a snowcap #E9E4D8. They are dense, with a Poisson
    radius of 0.12 √area, and fill the range.
  - **Dead lake**: a flat surface with horizontal ripple strokes (#4A4B5A, 1.5 px, staggered),
    bone-white dead snags (#8A8578) along the shore, and no stamps in the middle third (open
    water).
  - **Chasm**: a jagged rift polygon down the long axis in #0E0D10, with a lit lip #6B6775 and
    strata lines across its walls.
- **Name**: Marcellus SC (the display face), letter-spaced 0.12 em, #E9E4D8 at 12.4:1 on the
  slate, sized by area (11 to 16 px at Mid), horizontal, at the wild's label anchor. It has no
  halo, because the ground is dark. Curved names are Later.
- **Passable Mountains are drawn so they cannot be mistaken for peaks**:
  - the light fill #8DA4AD stays;
  - the peaks are smaller and spaced apart, and never form a closed chain;
  - a **dashed footpath** (#5E5246 at 60%, 1.5 px, 4/3 dash) runs between two of the province's
    longest borders through its seat. The path says "a way through".

**By zoom:** wilds are information, so every zoom draws them in full: slate, rim and kind stamps.
Only their name is culled, first at Far.

**By mode:** a data mode tints province fills only (spec 2.10.2). Wilds keep their look in every
mode, so a wild reads as "no data, no entry" everywhere. Data-mode ramps must start at L\* ≥ 25,
which keeps the slate the darkest ground in every mode. The mockup's heat ramp starts at
[24, 30, 60] and must be lifted. That is a note for the Phase 8 ramp.

**Interaction:**
- **Hover** brightens the rim ticks to 100% and opens an L1 tooltip: "The Ashspine · Peaks ·
  Impassable", the rule sentence (2.2), "Borders 6 provinces", and the footer `Ctrl+click Codex`.
  A Codex concept page "Impassable terrain" is added to `src/content/concepts.ts`.
- **With commanders selected**, the cursor over a wild shows ✕. The cursor label reads
  "Impassable: the Ashspine". Right-click issues nothing. Path previews to provinces beyond it
  already bend around it.
- **A click** on a wild clears the selection, as a click on empty table does.

**Colorblind safety:** lightness (13.7 against ≥ 29.8), the tick rim, and the stamp shapes. No
hue is needed. The palette test enforces the slate's distance from every fill.

---

## 3. The war table and the tavern

### 3.1 Scene composition (back to front)

| Layer | Space | What it is | Source in M1 |
|---|---|---|---|
| R0 Room | screen | The tavern beyond the table:<br>- warm dark plaster and timber;<br>- a leaded window with cool daylight at the upper left, the key light for the whole scene;<br>- a stone hearth glimpsed at the lower right;<br>- shelves with pewter.<br>Pre-blurred, low contrast, desaturated. | Procedural gradient stack (Simple). Owner raster (Full, M1-should). |
| R1 Table top | world | Oiled, quarter-sawn white oak: tawny grey-gold planks running left to right, straight grain, faint silvery ray fleck, knife marks, one tankard ring. Planks are about 0.33 × sheet height wide. It extends 0.5 × sheet height beyond the sheet on every side. | Procedural seamless tile (1024²) |
| R2 Table edge | world | A rounded bullnose edge in darker end grain (#715636 to #5D4F39), forged iron corner straps (#4A4744) with nail heads. It throws a soft shadow onto the room. | Procedural strip. Owner raster later. |
| R3 Table light | world | Two warm pools (2000 K #FF890E at 14% additive, on the oak only) under the candles. A vignette on the table toward the screen edges, by zoom (3.3). | Procedural radial textures |
| R4 Props | world | In the margin ring only, at least 0.04 × sheet height from the sheet:<br>- a pewter tankard;<br>- two beeswax candles in iron holders;<br>- brass dividers (the cartographer's tool);<br>- a quill and inkpot;<br>- a pair of bone dice;<br>- a folded letter with a dark-brown wax seal;<br>- a bread board;<br>- six spare unpainted wooden tokens.<br>Placement is seeded by the game seed. | Procedural SVG atlas (M1-should) |
| R5 Sheet shadow | world | A contact shadow 3 px offset toward the lower right, blur baked, #000 at 35% | Procedural |
| R6 Sheet | world | Vellum #E8DCC2 with paper grain. It has:<br>- a deckled edge (seeded jitter of ±0.4% of the height);<br>- 4 square-headed brass tacks at the corners (never round: brass never takes a disc shape);<br>- a 4% parchment margin around the map outline;<br>- a hand-ruled double neat line (#2B2620, 1 px and 0.5 px, 3 px apart);<br>- a cartouche in the top margin with the map's seeded name in ink (#1C1A17, 12.8:1);<br>- a compass rose in one corner margin, never over provinces. | Procedural |
| R7 to R20 | world | The map: spec 2.10.1 layers 2 to 13, plus this design's detail layers (4.1) | — |

The sheet replaces docs/09's "parchment #E8DCC2 at the edges fading to #1C1A17 under the UI".
The sheet edge reads against the table at 3.21:1 against #8F7459 oak, plus the contact shadow.

**Props are inert.** They have no hover and no click, and the cursor pans through them. Cosmetic
clickables are a time sink beside the play area (Hearthstone's corners, research-tabletop 2.1),
and informational props would duplicate the top bar while showing only at lean-back
(research-tabletop 4.4). Later options: a brass hourglass that mirrors game speed, and the
dividers as a measuring tool.

### 3.2 Lighting

- **The sheet is lit by neutral daylight from the window** (upper left). The only lighting on it
  is the contact shadow. There is no candle grade on the map. research-tabletop 4.3 measured that
  a 15% 1900 K multiply breaks the terrain palette (protan 11.3), so the instrument rule takes the
  grade off the sheet entirely.
- **The table and the room take the warmth:** candle pools on the oak (static, baked), and the
  hearth glow on the room backdrop.
- **Clock and seasons:** never on the sheet. M1-should: the room's window light follows the
  month. Months 11 to 2 are cooler and dimmer (window tint #8DB6C8 at 10%) with a frost rim;
  months 6 to 8 are 6% brighter. This matches the battle design's season rule (months 11 to 2
  frost). Day and night are not used. A whole-board shift hurts reading (research-tabletop 2.5).

### 3.3 Camera and zoom

- **World:** the table rectangle (sheet plus 0.5 × sheet height on every side).
- **Fit (`s_fit`):** the map outline fits the unobscured area with a 14 px pad, as now. On
  Medium at 1280×720 that is about 110 px per province (Mid). The game starts at fit.
- **Lean back:** wheel or `-` past fit, down to `s_min = 0.72 × s_fit`. Table and props appear
  around the sheet. On Medium at 1280×720 the median province is still about 79 px (Mid), and on
  Large it falls into Far.
- **Detent:** a wheel stop within ±8% of `s_fit` settles to `s_fit` after 150 ms idle, so the
  standard view is easy to find. `Home` (and a double-click on bare table) returns to fit. The
  move takes 200 ms, or is instant under reduced motion.
- **Zoom in:** to the Near cap, where the median province is 420 px.
- **Pan clamp:** the view center stays inside the map outline's bounding box. Beyond the sheet,
  the view shows at most the table margin, never empty room, except at `s_min`.
- **The tavern recedes:**
  - the room is only visible where the table does not cover the view, which is only near
    `s_min`;
  - the table vignette (R3) has strength 0.35 at `s_min`, 0.20 at `s_fit`, and 0 at
    1.5 × `s_fit` and above, linear between;
  - the vignette is masked out of the sheet at every zoom;
  - at Near zoom, the screen is all sheet.
- **`H` (hide chrome)** leaves the table in view, which doubles as a screenshot mode.

### 3.4 The chrome: a dark instrument case

The staged docs/09 tokens keep their values, so `palette.test.ts`'s checks of `--warm` and
`--cool` against `--chrome-0` still hold. Materials appear only as frames and hardware, never
under dense text rows, and never next to a mana symbol in a disc or drop shape. Bright brass is
ΔE 3.8 from W Radiance's secondary (research-tabletop 5), and #B8914A is 11.6.

| New token | Value | Use | Contrast (`chrome.out`, `wild-fill.out`) |
|---|---|---|---|
| `--oak-0` | #2B231C | Base of the top bar and the bottom strip | text 13.34, dim 5.74, `--warm` 7.12, `--cool` 7.10 |
| `--oak-grain` | #3A2E23 | Grain lines on `--oak-0`, ≤ 1 px, ≤ 20% coverage, straight along the long axis | worst case under text: text 11.37, dim 5.16, `--warm` 6.07, `--cool` 6.06 |
| `--brass` | #B8914A | 1 px keylines:<br>- top bar bottom edge;<br>- strip top edge;<br>- the dock edge facing the map;<br>- the outer frame of modals | 5.94 on chrome-0, 5.29 on oak-0, 4.51 on grain (non-text needs 3:1) |
| `--brass-hi` | #D4B26A | The 1 px highlight on brass corner brackets only | 8.58 on chrome-0 |
| `--leather` | #4A3426 | The spines of the Codex and Ledger modals, 10 px, with stitch dots in `--brass` at 40%. No text. | — |
| `--sheet` | #E8DCC2 | The map sheet | ink 12.77 |
| `--ink` | #1C1A17 | Text on the sheet (cartouche, compass letters) | 12.77 on `--sheet` |

- **Top bar:** `--oak-0` with seeded grain, and a 1 px `--brass` bottom keyline. Readouts, kbd
  chips and buttons are unchanged.
- **Docks and their panels:** `--chrome-0` bodies, unchanged and flat. The map-facing edge gets a
  6 px dark-oak spine with a 1 px `--brass` keyline.
- **Bottom strip:** `--oak-0` with a 6 px spine on top and a `--brass` keyline.
- **Modals:**
  - Research, Ledger, Codex, Settings, the replay and the report card get an 8 px `--oak-0`
    frame with 14 px L-shaped brass corner brackets (2 px stroke, `--brass`, with a `--brass-hi`
    edge);
  - the replay modal shares this hardware, so the battle stage does not feel like another game
    (the Hand of Fate 2 seam, research-tabletop 2.3);
  - bodies are unchanged.
- **Tooltips, buttons, alerts ribbon, outliner rows:** unchanged (approved).
- **Parchment** is used only for the map sheet in M1. Parchment documents (report cards, Codex
  pages) are Later, as a theme option.

### 3.5 Ambient motion and reduced motion

| Element | Motion | Limit |
|---|---|---|
| Candle flames (2) | Brightness ±3% and scale ±2% from seeded 1D value noise at ≤ 2 Hz | Never a flash. Luminance change stays under the WCAG 2.3.1 general threshold. |
| Hearth glow (room) | Brightness ±4%, one cycle every 7 s | — |
| Dust motes in the window beam (Full only) | 12 points drifting at 2 to 4 px/s | Room layer only |
| Sheet, map, tokens, labels | None (besides game-driven movement) | — |

- **Reduced motion** (the OS setting, or Settings → Accessibility) freezes flames and glow at
  their mean and removes the motes. docs/09's motion list gains "table ambience".
- **Table: Full / Simple / Off** (Settings → Interface):
  - Full: room, table, props, ambience;
  - Simple: table and sheet, a static room gradient, no props, no ambience;
  - Off: a flat #15130F around the sheet, as in the mockup today.
  - The default is Full from Phase 9 on, and Simple in Phase 8.
- Ambience stops when the tab is hidden, while the replay modal is open, and when no table pixel
  is on screen.

### 3.6 Sound

Out of M1. The M1 scope allows only battle SFX (staged docs/10: "sound other than battle SFX
(no music, no UI or alert sounds)"), and the pretender final's P10 keeps map sound out. Later,
with the M2 map and menu sound package: fire crackle, murmur and rain on the window, synthesized
by the battle track's recipe engine, behind an "Ambience" slider in Settings → Audio. Nothing
in M1 needs a hook for it.

### 3.7 Performance budgets

- **Table and room cost:**
  - at most 4 draw calls and no filters;
  - static textures:
    - the oak tile, 1024²;
    - the edge strip, 1024 × 128;
    - the room, at most 1920 × 1080: procedural, or WebP ≤ 400 KB from the owner;
    - the props atlas, 1024²;
    - the vignette, 256²;
  - ambient updates at ≤ 30 Hz, and ≤ 0.3 ms CPU per frame.
- **Map frame budget:** docs/06's "60 fps at 1080p with all provinces and 100 army markers" now
  holds with Table Full and Map detail Full.
- **GPU memory** for table and map is ≤ 96 MB on Large with 4 nations at device-pixel-ratio 2
  (4.6).
- **Bundle:** procedural art is code. Owner rasters total ≤ 2 MB gzipped in M1 builds
  (criterion 1 caps the bundle at 5 MB), loaded after first paint. A build-size test fails past
  the cap.

---

## 4. More map detail

### 4.1 Layer order (spec 2.10.1, extended; new layers marked +)

1. Sheet (R6, section 3).
2. Province fills (terrain, or the active mode's fill).
3. Noise texture at 10% (docs/09).
4. **+ Ground textures** (4.2), in Ownership mode only.
5. **+ Standing stamps:** terrain, settlements, buildings, motifs and scars (4.2, section 5), in
   Ownership mode only.
6. **+ Wilds** (slate, rim, kind stamps), in every mode.
7. 2 px borders.
8. Ownership bands with keylines (docs/09).
9. **+ Ritual marks** (`mapMarks`, pretender C.4), in every mode.
10. Mode overlays (hatching, hop outline).
11. Labels, including wild names.
12. Numbers-layer chips.
13. Path previews.
14. Army tokens.
15. Transit arrows and ETA labels.
16. Selection rings.
17. Battle markers.

### 4.2 Two classes of detail, per terrain

- **Ground textures** are flat lightness modulations, within ±8% L\* of the fill (±10% for
  Wasteland cracks). They are symmetric, so the province's mean color stays the fill and the mode
  and palette reading hold. They may cover the whole province, but inside label and badge boxes
  they drop to ±4%. At Far, each terrain's texture is a seamless pattern (`FillPattern` with
  `textureSpace: 'global'`), which is cheap and constant.
- **Standing stamps** are tall, outlined, higher-contrast symbols (trees, peaks, houses,
  motifs):
  - their ink colors derive from the fill by lightness only (−18% and +12% L\*), with a 1 px
    outline of #2B2620 at 60%;
  - they are never inside a label or badge box;
  - they are inset from the border by the band width plus 3 px;
  - they are drawn in bottom-edge order (Azgaar, research-mapdetail 1.1).

| Terrain | Ground texture | Standing stamps (count at Near / Mid) |
|---|---|---|
| Plains #C1D29F | Grass stipple; 1 to 2 hedgerow lines | Lone trees and bushes, a haystack (8 / 4) |
| Farmland #EEBA3A | A patchwork of 5 to 9 field polygons (a seeded Voronoi inside the cell), each ±6% L\*, with furrows at 0°, 90° or ±30°, never 45° | Haystacks, a windmill (6 / 2) |
| Forest #374C2B | A canopy scallop pattern (arcs of crowns), ±8% | Tree crowns in 2 tones in clumps; edge "half trees" whose bottom outline is dropped (48 / 18; Far: ≤ 4 large clumps) |
| Hills #856824 | Hachure arcs: short strokes on the shadow side, lower right (Dufour; research-mapdetail 1.1) | Humps with slope strokes (10 / 5; Far: 3 large humps) |
| Mountains #8DA4AD | Scree stipple, ridge lines | Separate peaks, lit face +15%, shaded face −15%, a snowcap on the tallest; **the footpath** (2.8) (9 / 5; Far: 3 peaks) |
| Swamp #1A727A | Horizontal water streaks (short, staggered), lighter pools #2C8C94 | Reed tufts, dead snags (24 / 10) |
| Wasteland #AE897F | A crack network (edges of a fine seeded Voronoi), ±10% | Rocks, a bleached skull, a dry wash (12 / 6) |

**No terrain texture is a uniform straight hatch across a province.** That reservation keeps the
state patterns free (rule 3). A content test checks every texture's line angles and coverage.

**Placement (`scatterProvince`, pure):**
- **Slots:** `poissonDisc` (the existing `src/mapgen/voronoi.ts` function) runs on the convex
  cell, inset as above, with radius per terrain (0.09 √area for Forest, up to 0.2 for Plains).
  The rng is seeded from `hash32(`${map.seed}:${provinceId}:${layer}`)`. Slots are computed once
  per map and cached.
- **Order:** every slot has a fixed position and a fixed seeded terrain stamp. Slots are ranked
  by distance from the seat (4.4).
  - Dominion motifs **replace** the terrain stamp in the slots nearest the seat.
  - Pole motifs replace it in the outermost slots (section 5).
  - So "around the town" changes first and the periphery keeps reading as terrain.
  - Nothing ever moves: growth changes only what stands in a slot.
- **Exclusion:** the label box and badge box from `layoutMapLabels` at that band, plus 4 px.
- **Quiet ground:** standing stamps cover at most 60% of the province area at Mid and 75% at
  Near.

### 4.3 Borders, ownership, labels

- **Borders stay straight.** A province border is a survey line: the geometry is the rule. They
  are drawn as ink (2 px #2B2620, alpha varying 0.85 to 1.0 along the stroke, seeded), with a
  3 px inner pigment edge (black at 12%, a watercolor pooling cue). Noisy edges are Later, and
  only if hit tests use the same noisy polygon (research-mapdetail 1.3 item 5).
- **Ownership:** docs/09's band and keyline are unchanged. There is a banner pennant on the tallest
  building of the seat (tint zone, the owner's banner), and the nation's sigil (pretender B.7) on
  the band corner in Ownership mode, as spec 2.10.2 has it.
- **Labels:** spec 2.10.3 is unchanged (Alegreya Sans with its dark halo). Wild names are added
  in Marcellus SC, letter-spaced (2.8). The priority order for culling becomes: capitals,
  Wellsprings, own provinces, the rest, then wild names. At Mid, wild names show with the same
  overlap rule.

### 4.4 Province anchors (pure, `provinceAnchors(polygon, center)`)

- **Label:** `center`, as today.
- **Badge:** above the label, as in the mockup.
- **Seat** (the settlement): below the label, offset by the label's half height plus 6 px,
  clamped inside the inset polygon. Seat and label never overlap, because the seat's box takes
  part in the exclusion test.
- Houses fill the first k positions of a fixed, seeded, center-out sequence inside the seat box.
  Growth appends, and decline removes the newest, so no house ever moves.

### 4.5 Army markers: painted tokens, miniatures at Near

- **Tokens:** spec 2.10.4 is unchanged in shape and content (rounded shield own, notched other
  nations, plain independents; the count; at most one exception glyph). The material changes:
  - nation tokens look like painted wood: a flat banner fill, a 1 px lighter top edge and a
    1.5 px dark outline;
  - independents look like pewter (#91A092, ΔE 10 from the Independents grey #8C8A80, so
    material and faction agree; research-tabletop 4.5);
  - a fixed contact shadow (an ellipse, 25% alpha);
  - count plates stay flat and unlit.
- **Miniatures (M1-should):**
  - at Near only, a standee of the lead commander's rig in its idle pose (the battle part set,
    40 px tall) stands on each token;
  - the badge box grows by the standee height at Near, and `layoutMapLabels` knows it;
  - Far and Mid keep tokens, and "Map detail: Reduced" keeps tokens at every zoom.
- **Path previews:** the dashed line stays, styled as a light thread (3 px #F4EEDF with a 1 px
  dark edge). Waypoint and day dots become square-headed brass tacks (a 6 px #B8914A square,
  dark outline, rotated 45° into a diamond), with the day labels on flat plates. They are never
  round, so a path step cannot be mistaken for a mana symbol or a spring.

### 4.6 Level of detail and the density budget

| Band (spec 2.10.3) | Ground | Terrain and motif stamps per province | Settlement (counted apart) | Motifs and scars | Table |
|---|---|---|---|---|---|
| Far, < 70 px | Global patterns only | Relief massing only: ≤ 4 (Forest, Hills, Mountains) | A keep glyph for forts and capitals only; Wellspring glyph | None (ritual marks stay) | Visible at lean back |
| Mid, 70 to 180 (default) | Per-province textures | ≤ 18 | One cluster stamp scaled by tier (12 to 28 px), walls by PD, banner pennant | Dominion level shown; scars as one mark | Margins only |
| Near, > 180 | Full | ≤ 48 | Individual buildings: up to 22 houses plus specials | Dominion and pole motifs; scars in detail | Off screen |

- **Density budget (adds to spec 2.10.3):**
  - no standing stamp in a label or badge box;
  - standing coverage ≤ 60% at Mid and ≤ 75% at Near;
  - ≤ 2,500 standing stamps on screen.
- **Bake:**
  - Far: patterns only, no bake.
  - Mid: the whole sheet at 1.25 px per map unit (times the device pixel ratio), in tiles ≤
    2048². That is about 11 MB on Medium and at most 24 MB on Large with 4 nations, at
    device-pixel-ratio 2. Within the band the bake is scaled, not redrawn.
  - Near: lazily, per 512² screen tile, with an LRU of 32 tiles (≤ 32 MB at device-pixel-ratio
    2).
  - **Re-bake when a province's look key changes:**
    - at a month boundary, typically 5 to 20 provinces;
    - otherwise on an information event (section 5).
  - Re-baking is staggered at ≤ 3 ms per frame. Baked textures are regenerated after a lost
    WebGL context, from state.
- **Map detail: Reduced** keeps the ground textures, wilds, settlement clusters and tokens, and
  drops the other standing stamps and motifs.

### 4.7 Map modes still read

- In any mode other than Ownership, layers 4 and 5 fade out over 150 ms (instantly under reduced
  motion). The mode tints a plain fill, exactly as spec 2.10.2 tested it.
- Wilds (6) and ritual marks (9) stay, as do borders, bands, labels, badges and the mode's
  second channel.
- Data-mode ramps start at L\* ≥ 25 (2.8).

### 4.8 Fog on the sheet

- **Unexplored ("not yet surveyed"):**
  - the terrain fill shows, because terrain is public (docs/01 §14);
  - ground textures and stamps are drawn as pencil outlines only (stroke #2B2620 at 35%, no
    fill), under spec 2.10.7's parchment haze;
  - the border is dotted;
  - no settlement is drawn, because the population is unknown. A single sketched hut outline at
    the seat says "people live here, number unknown".
- **Explored, out of sight:** the fill is desaturated and the border dotted (spec). Settlements
  show the tier the view selector gives. Army tokens show only where seen.
- **Wilds** are never fogged.

---

## 5. Growth over time, based on alignment

### 5.1 What actually changes during a game (why several signals are combined)

Population barely moves. Over the 70-month target game a province grows +15% at neutral, +115%
at Growth +3, and −39% at Rot −3 (research-mapdetail 3.3, from docs/01 §3). Growth art therefore
combines population with the investments the player makes (PD, temples, labs), the dominion that
spreads month by month, and the events that mark the land.

### 5.2 Derivation: every visual and its source

All of these are derived by pure functions in `src/present/map/look.ts` from the viewer's fogged
province view. They need **no new sim state**.

| Visual | Derived from (existing state) | Changes |
|---|---|---|
| **Settlement tier** T1 to T5 (houses), using the same steps as Population mode | `ProvinceState.pop` against `UI.popSteps` = 2,000 / 5,000 / 10,000 / 20,000 | month boundary |
| Houses within a tier | Interpolated by `pop` within the step: T1 1 to 2, T2 3 to 5, T3 6 to 9, T4 10 to 15, T5 16 to 22 | month boundary |
| **Thriving / declining** | `pop / MapProvince.startPop`. ≥ 1.25 adds fresh pale-thatch roofs, gardens and an outer ring of 2 new houses. ≤ 0.80 turns the newest 2 houses into roofless ruins. | month boundary |
| **Architecture kit** | `owner` → `NationState.def` → `NationDef.look.kit`. Independents (null) use the neutral kit. | month boundary. After a capture the band changes at once and the old kit stays until the month ends. |
| **Banner pennants** | the owner's `NationState.banner` | immediately on capture |
| **Walls** | `pd`: 1 to 9 a palisade ring; 10 to 19 a stone wall; 20 to 30 a wall with towers | end of the day bought (an information event, player-caused) |
| **Fort keep** | `buildings` includes `fort` | immediately |
| **Temple, lab** | `buildings` | the day they complete |
| **Temple without faith** | a temple whose province's `dominion.nation` is not the owner: its brazier is unlit. docs/01's Phase 6 rule: such a temple "keeps no faith", so it does not hold off Godless. | month boundary (spread day) |
| **Scaffold** | `construction` not null | immediately |
| **Siege camp** | `siege` not null: tents in the besieger's banner around the keep | immediately |
| **Wall state** | `siege.wallHp`: ≥ 200 intact; 100 to 199 cracked; 1 to 99 breached; 0 a rubble gap (docs/09-balance: walls are down below 1 HP) | when a threshold is crossed |
| **Pillage smoke** | a visible commander with order `pillage` standing in the province: 2 smoke columns and burning roofs | daily (live, information) |
| **Unrest** | `unrest` ≥ 50 (recruitment blocked): barricades and one smoke wisp; ≥ 75: two | month boundary |
| **Wellspring** | `MapProvince.wellspring`: the fountain monument with five drops (docs/09 icon) | static |
| **Wellspring claim** | `wellspringClaimedBy`: pennants in the claimant's banner, and the track's filled diamond on the monument (hollow when unclaimed) | immediately |
| **Dominion motifs** | `dominion.nation` → that nation's `colors` → `COLOR_MOTIFS`. Level from `dominion.strength`: 1 to 3 → level 1, 4 to 6 → 2, 7 to 10 → 3 | month boundary (spread fires on a month's last day) |
| **Scale-pole motifs** | `effectiveScale(state, province)` per axis, −3 to +3 (docs/01 §12, Wellspring steps included) | month boundary |
| **Ritual marks** | `mapMarks(state, viewer)` from `provinceEffects` (pretender C.4): Burn the Fields' charred hatch for 3 months, Fertile Season's sheen and leaf badge, Bounty's wheat badge, Rootwall's thorn border | when cast, and when the effect ends |
| **Battle scars** | The UI save block's `BattleSummary` list (UI spec 7.3 `battleSummaries.ts`): province, day, casualties. These are the battles the player fought, so the fog is respected. Under 3 months: churned earth, broken spears, crows. 3 to 11 months: grave cairns, 1 per 50 casualties, at most 4. Gone at 12 months. | The crossed-blades marker shows at once for 30 days (spec). The ground scar appears at the next month boundary. |

### 5.3 Settlement kits (who built it)

Each kit has the same 9 shapes: 3 house variants, a hall, a temple, a lab tower, a keep,
palisade and wall segments, and a tower. Every roof gets a 1 px #2B2620 outline, so a thatch roof
reads even on Farmland.

| Kit | Houses | Temple | Lab | Keep | Signature |
|---|---|---|---|---|---|
| Independent (neutral) | Timber and thatch, pitched (thatch #C2A86B) | A wayside chapel | A stone tower | A square stone keep | Plain shield pennant |
| Cinder Horde | Dark timber longhouses with jagged crests; charcoal roofs #4A4440 with ember ridge dots | A stepped pyre-tower with a brazier | A blackstone tower with a red-gold window | A basalt keep | Braziers along the road |
| Thornwood | Round living-wood huts with moss roofs #5E7A45; tree-houses from T4 | A ring of trees around a grove altar | A hollow-tree tower | A living palisade around an oak keep | Saplings around the seat |

**Future nations:** `NationDef.look.kit` is optional. A missing kit falls back to the kit of the
nation's primary color in `COLOR_KITS`:
- W: whitewashed stone, red-brown tile;
- U: blue slate, stilts;
- B: black stone, bone ornament;
- R: the Cinder kit;
- G: the Thornwood kit.

A content test requires a kit for every nation, or for its primary color.

### 5.4 Dominion: how land looks under each nation's faith

The motif family follows the **color**, so it covers every future nation. A two-color nation
alternates its colors' families over its motif slots, primary first. Motifs are shapes, so the
meaning survives color blindness. **Dominion never tints fills** (rule 1). Dominion mode carries
the color.

| Color family | Level 1 (strength 1 to 3) | Level 2 (4 to 6) adds | Level 3 (7 to 10) adds |
|---|---|---|---|
| R Ember (Cinder Horde) | Ash drifts (grey stipple), black-stone cairns with one ember dot | Scorched ground patches with ember speckle, obsidian shards, braziers on the road | Charred trees replace up to a third of nearby crowns; thin static ember cracks (#FFB347) |
| G Loam (Thornwood) | Blossom clusters (pale blossom #EAD2DA), ivy on stones | Saplings in open slots, mossy standing stones, flower meadows | Great old trees, vines over houses, a ring of oaks around the seat |
| W Radiance (M2) | White marker stones | Sun shrines, tidy hedges | Pale-stone roads, a white tower |
| U Tide (M2) | Mist pools | Standing water, blue reeds | Flooded fields, stilt walks |
| B Umbra (M2) | Dead grass tufts, crows | Bone cairns, black pools | Dead woods, gibbet trees |

- **Share of slots:** level 1 takes 8% of the province's standing-stamp slots, level 2 takes 15%,
  and level 3 takes 22%. The slots nearest the seat go first. A province shows its dominion
  around its people, and the motifs reach farther as strength grows month by month: "growth
  over time".
- **Contested land:** the motifs follow the dominating nation, and the kit and banner follow the
  owner. A Cinder town wreathed in blossoms is visibly losing its faith. The province panel
  already says so in words.

### 5.5 Scale poles (Near only, in the rim slots)

Each nonzero effective step `s` places `2s` motifs of that pole (at most 6 per axis) in the
outermost slots. At most 30% of slots go to poles in all. Motifs are shapes keyed by pole id in
`POLE_MOTIFS` (content), so they cover any nation's scales.

| Pole | Motif |
|---|---|
| Order | Straight hedgerows, milestones |
| Turmoil | Broken fences, a toppled cart |
| Lore | Glyph-ringed standing stones, a small observatory |
| Fury | War cairns topped with weapons, torn banners |
| Growth | Fruit trees, lush crop clumps |
| Rot | Fungus rings, dead trees, bones |
| Wild | Briars over field patches, a beast den |
| Artifice | A mill, chimneys, a quarry scar |
| Sanctity | Wayshrines with a candle, pale-stone paths |
| Dread | A gibbet, crow flocks |

Turmoil's motifs avoid burning roofs, which belong to pillage, so the two cannot be confused.

### 5.6 Calm transitions

- **Month boundary** (the first frame after `state.day % 30 === 0`): every province's look key is
  recomputed. Changed provinces re-bake and cross-fade in 600 ms, or instantly under reduced
  motion. Nothing else in the growth and alignment layers changes during a month.
- **Information events** (capture, building completed, PD bought, siege start, wall threshold,
  pillage start and end, claim, ritual marks) update at the end of the day they happen, in step
  with the panel icons and labels, which already change then.
- **Strategic information is never hidden:**
  - the layers sit below every information layer (4.1);
  - standing stamps avoid label and badge boxes;
  - data modes drop them;
  - the tooltip and panel hold every number;
  - the art is a glance proxy that agrees with them, because it uses the same steps.

### 5.7 New state? None in M1. One optional field, Later

- "How long a province has been under a dominion" is already visible as `dominion.strength`.
  Strength rises by monthly checks, so its level is "time held, weighted by effort".
- **Later (only if playtests ask for "old" land):**
  - `ProvinceState.dominionSince: number | null` (the day the current holder took it), written
    by `dominion.ts` in the push that flips the holder;
  - tested by "a flip sets it to `state.day`, a push that keeps the holder leaves it, and a loss
    to 0 sets null";
  - it would change the state hash, so the fixtures would be regenerated, and it adds a
    migration.
- **Battle weathering on portraits** would read the units track's `CommanderState.battles`
  counter if that M1 hook lands (units-items R9).

### 5.8 Tests

| File | Test |
|---|---|
| `tests/present/map/look.test.ts` | Each row of the 5.2 table maps from a fixture state to the expected look key. The same state gives the same key. |
| | **Calm:** advancing days 1 to 29 of a month changes no growth or alignment field of any look; day 30 may. |
| | **Events:** completing a temple changes the key the same day. |
| | **Stable slots:** `scatterProvince` positions depend only on (map seed, province, layer). Changing pop, owner or dominion never moves a stamp. It only changes what stands in a slot, or adds and removes houses at the end of the seat's sequence. |
| `tests/ui/derive/fog.test.ts` | **Fog guard:** extended to `provinceLook`. Changing a hidden province's `pop` or `buildings`, or a hidden enemy, leaves the viewer's look unchanged. |
| `tests/present/map/scatter.test.ts` | **Exclusion and budget:** on Medium seeds 1 to 5 at fit zoom on 1280×720, no standing stamp intersects a label or badge box from `layoutMapLabels`, and the coverage and count caps hold. |
| `tests/content/presentation.test.ts` | **Patterns:** no terrain texture is a uniform straight-line hatch. Stamp inks are within the lightness bounds. |
| | **Coverage:** every color has a motif family, every pole has motifs, and every nation resolves a kit. |
| `tests/sim/purity.test.ts` | `src/present/**` stays guarded: no `Math.random`, `Date` or `state.rng`. |
| | **The sim never imports presentation:** `src/sim`, `src/mapgen` and `src/ai` do not import `src/present` or `src/content/presentation`. |

---

## 6. Leader portraits

### 6.1 Principles

1. **Every commander has a portrait.** That covers:
   - national commanders, by unit type;
   - pretenders (every chassis);
   - summoned commanders (Salamander, Treant);
   - captains of independents.

   The fort's garrison holder is a bookkeeping commander. It shows the fort emblem, never a
   face.
2. **The face carries identity. The frame carries state** (CK2's lesson, research-portraits 1).
   The look reads as "my Ash Chieftain, now wounded", never as a different person.
3. **A portrait is legible at 32 px.** Silhouette first: headgear or hair, beard, face shape.
   Eyes and mouths are for 96 px and up.
4. **Render-only and stable.** The seed is `${state.seed}:${commander.id}` with keyed draws.
   No `state.rng`. Saves, replays and the determinism test are untouched.

### 6.2 Which base each commander uses

| Commander | Base | Notes |
|---|---|---|
| Cinder Horde: Scout, Ash Chieftain, Pyre Priest, Ember Adept, Cinder Magus | **Bust** from parts | Cinder parts (6.3) |
| Thornwood: Scout, Warden Captain, Grove Priest, Sapling Druid, Elder Druid | **Bust** | Thornwood parts |
| Independent Captain | **Bust**, from a deck (6.4) | The outfit follows the terrain of the province it guards (independents never move) |
| Salamander, Treant (summoned) | **Rig portrait pose** (battle S4.4 part set, `RigTextures.portrait`) | The seed varies markings and scars only |
| Pretender (every chassis) | **Rig portrait pose with its look** (pretender B.8: layers, 256 px detail layer, awakening overlays) | The god's look comes from the save's UI block, as B.2 rules |
| Garrison holder | Fort emblem | Never a face |
| Until Phase 11 parts exist | The archetype silhouette on the banner backdrop | docs/09's fallback rule |

### 6.3 Parts (M1 budget, about 116 small SVGs plus overlays and frames)

All parts are drawn on a 256-unit grid with fixed anchors: eye line at 39%, crown at 9%, chin
at 66%, collar at 78%. Strokes marked `data-lod="portrait"` drop below 96 px. Skin, hair and
beard are drawn in three flat tones mapped to `--ramp-dark`, `--ramp-base` and `--ramp-light`,
filled from ramps (CK2 and Multiavatar practice, research-portraits 5.3).

| Slot | Shared (all humans) | Cinder Horde | Thornwood | Independents |
|---|---|---|---|---|
| Head shape | 6 | — | — | — |
| Eyes and brows | 6 | ember-glint eyes for mages with ≥ 2 R pips | green-glint for ≥ 2 G pips | — |
| Nose and mouth | 6 | — | — | — |
| Hair (incl. bald) | 11 | topknot, shaved sides (2) | braids with leaves (2) | — |
| Beard (incl. none) | 8 | braided with rings (2) | moss-tangled (2) | — |
| Scars | 3 | — | — | — |
| Marks | — | soot stripes, ember cracks (4) | bark whorls, moss (4) | — |
| Headgear by type | — | Scout ash hood (3), Chieftain horned helm (3), Priest ember hood with flame (3), Adept ember circlet (3), Magus tall cowl (3) | Scout leaf hood (3), Captain bark helm with antler stubs (3), Priest wreath crown (3), Druid twig circlet (3), Elder antler hood (3) | helms (4) |
| Collar by type | — | scale plates, robe, cowl (2 per type) | bark mail, leaf cloak, robe (2 per type) | outfits by terrain: levy (plains, farmland, wasteland), hunter (forest), mountaineer (hills, mountains), reedman (swamp) |
| Skin ramps | — | ash-grey to soot: 4 ramps around the battle sprite's #8F8C88 | bark-tan to blossom: 4 around #A0785A | 5 human ramps |
| Hair ramps | 5 per nation | | | |

Totals: shared 40, Cinder 34, Thornwood 34, independents 8, so about 116 parts. Then 12 state
overlays, 4 rank ornaments and 3 frame shapes. Content: `PORTRAIT_POOLS[nationDef][unitId]` and
`PORTRAIT_POOLS.independent.independentCaptain` in `src/content/presentation/portraits.ts`. Each
lists part ids per slot with optional weights, and its ramps. Every commander unit must have a
pool or appear in `PORTRAIT_RIG_UNITS`. The content validation fixture enforces that, per
CLAUDE.md.

### 6.4 Seeding (stable across reloads and content updates)

- **Hash:** FNV-1a 32 over the key string, then Mulberry32 (DiceBear's scheme,
  research-portraits 5.1).
- **Keyed draws:** each slot draws under its own key, so adding a slot moves nothing else.
- **Weighted rendezvous:** per slot, every part `p` in the pool scores
  `−ln(u(seed:cid:slot:p.id)) / weight`, and the lowest score wins. Part tables are
  **append-only**, with string ids. Adding a 13th variant changes about 1/(n+1) of picks,
  against 92.5% for `hash % n` (research-portraits 5.5, measured). A content test checks that
  each table is append-only against a committed snapshot of ids.
- **National commanders:** rendezvous by commander id. A helmeted type has 720 salient looks:
  P(any repeat of the salient look) is 3.8% among 8 and 8.8% among 12. A bare-headed type has
  2,640: 1.1% and 2.5% (research-portraits 5.6).
- **Captains of independents (58 on Medium): a deck, with no new state.**
  - Their look ordinal is the rank of their province in a permutation of province ids seeded by
    `${seed}:indep`.
  - The ordinal decodes in mixed radix into (helm, beard, head, scar). That gives 4 × 8 × 6 × 4
    (three scars or none) = 768 looks.
  - A seeded offset varies the order per game.
  - The first 768 captains are all different. The largest map has 126, so a game never repeats
    one. Their province is their identity, because independents never move.
- **Pretenders:** the god's look comes from the save's UI block (pretender B.2), not the seed.

### 6.5 Frames: rank and allegiance

- **Shape follows the token grammar** (spec 2.10.4), so allegiance never relies on the banner
  hue:
  - own: round;
  - other nations: round with 8 notches;
  - independents: a plain rounded square.
- **Band:** a 3 px band in the owner's banner (Independents #8C8A80). The backdrop is the banner
  darkened 35% with a radial vignette (docs/09's "colored backdrop"). The head outline uses
  `keylineFor(banner)`, so the face reads on light duplicate banners such as #B5D69C.
- **Rank ornament** (`PORTRAIT_RANK[unit]`, content):

| Rank | Units | Ornament |
|---|---|---|
| 0 | scouts | None |
| 1 | priests, adepts, Sapling Druid, Independent Captain | 4 bronze rivets (#8C6A43) |
| 2 | Ash Chieftain, Warden Captain, Cinder Magus, Elder Druid, summoned commanders | A brass ring (#B8914A) with 2 studs |
| 3 | pretender | A gilded ring (#D4B26A) with a crown notch at the top |

The pip ring sits on a 2 px `--chrome-0` ring outside the frame. A mana symbol (above all
Radiance, which is ΔE 3.8 from bright brass) therefore never touches brass or gilt.

### 6.6 State overlays (from existing state)

At most 3 frame badges show at once, by priority: role (pretender or prophet), wound, supply or
pay, holy, gear.

| State | Source | ≥ 96 px | 64 px | 32 px |
|---|---|---|---|---|
| Wounded (hp < 50% of max) | `hp`, unit max HP | Bandage across the brow | Bandage | Cracked-heart frame glyph |
| Badly wounded (< 25%) | same | Plus a blood mark, and the backdrop darkens 20% | Plus blood | Filled cracked heart |
| Prophet | `nation.prophetId === id` | A halo behind the head (the docs/09 role icon) with a candle-flame rim | Halo | A halo ring above the frame |
| Pretender | `nation.pretenderId === id` | The rig portrait, a crown badge and the gilded frame. Awakening overlays per B.8 (dormant: closed eyes; imprisoned: runic chains). | same | Crown badge |
| Mage pips | `commander.pips` | Pip ring of mana symbols around the frame (spec 2.8.2). Eye glint in the dominant color at ≥ 2 pips. | Pip ring | One dot of the dominant color, with its letter at ≥ 48 |
| Holy | `commander.holy` | The holy mark on the frame (spec 2.8.2) | same | Dot |
| Scout | unit role | Eye badge (docs/09) | same | same |
| Stealthy | `isStealthy` | Hood badge | same | same |
| Starving | `starvedDays > 0` | Crossed-wheat frame glyph | same | same |
| Unpaid | `nation.unpaidDays > 0` | Crossed-coin frame glyph | same | — |
| Gear (items track) | equipped items | Gear chip ○ ◆ ★ by best tier (units-items D) | same | — |
| Out of sight | not in `visionOf` | The last-seen portrait, desaturated 70%, with a dotted frame (docs/09 fog pattern) | same | Dotted ring |
| Dead | reports, history | Greyscale with a black corner ribbon | same | — |
| M2: afflictions, renown | units-items R9, R10 | An eyepatch and scars from anchors; renown stars on the frame | glyph | — |

```ts
// src/present/portrait/spec.ts (pure; guarded with src/present)
export interface PortraitInput {
  gameSeed: number;
  commanderId: CommanderId;
  unit: UnitTypeId;
  nationDef: NationDefId | null;   // null: Independents
  banner: string;
  allegiance: 'own' | 'other' | 'independent';
  hpFrac: number;
  pips: Pips; holy: number;
  roles: { pretender: boolean; prophet: boolean; scout: boolean; stealthy: boolean; garrison: boolean };
  starving: boolean; unpaid: boolean;
  gearTier: 0 | 1 | 2 | 3;
  guardTerrain: TerrainId | null;  // independents: the province they hold
  deckOrdinal: number | null;      // independents: 6.4
  seen: 'live' | 'lastSeen' | 'dead';
}
export type PortraitSize = 24 | 32 | 40 | 48 | 64 | 96 | 128 | 256;
export interface PortraitSpec {
  key: string;                     // stable cache key: identity + state + size
  base: 'bust' | 'rig' | 'emblem';
  parts: readonly { slot: PortraitSlot; id: string; ramp?: RampId }[];
  frame: { shape: 'round' | 'notched' | 'plain'; rank: 0 | 1 | 2 | 3; band: string };
  overlays: readonly OverlayId[];
  badges: readonly BadgeId[];      // at most 3, by priority
}
export function portraitSpec(input: PortraitInput, size: PortraitSize): PortraitSpec;
export function portraitSvg(spec: PortraitSpec, parts: PartLibrary): string; // pure string builder
```

- `src/ui/components/Portrait.tsx` gains `commander?: CommanderId`. It reads the state and
  view, builds the input, and memoizes on `spec.key`. The DOM renders the SVG string.
- `src/render/portraits.ts` turns the same SVG into a cached Pixi texture for the replay docks
  and name cards (the battle design's `RigTextures.portrait` slot).

### 6.7 Where portraits appear, and sizes

| Place | Size | Notes |
|---|---|---|
| Bottom strip | 64 (ring 76) | Click opens the Commander panel (spec) |
| Commander panel header | **96** (pip ring around) | Up from spec 2.8.2's 64. The dock is 320 to 360 wide. |
| Outliner rows | 24 | A portrait dot showing head and headgear silhouette only |
| Entity links in text and the feed | 16 | The "portrait dot" glyph (docs/09) becomes the real portrait's dot |
| Army hover tooltip (L1) | 48 | |
| Province panel, Forces tab | 40 | Own commanders and seen enemies |
| Fanned stack tokens (M1-should) | 20 | A dot above each fanned token, to tell commanders apart |
| Battle report card rosters | 40 | The dead shown in greyscale |
| Replay docks / name cards / result card | 64 / 128 / 64 | Shared with the battle stage's name cards for commander and god deaths (battle design point 12) |
| Pretender designer / `PretenderCard` | 256 / 128 | B.8 |
| Top bar nation button | 28 | The pretender, as the mini portrait the spec already names |
| Victory screen | 128 | The pretender and the top 3 commanders by battles |
| Codex unit pages | 128 | The seed `codex:<unitId>`, a type preview |

### 6.8 The owner-generated raster layer (premium, M1-should at the earliest)

- **Resolution order** per (nation, unit):
  1. a complete raster set, at least `minPool` = 8 approved images;
  2. the procedural bust;
  3. the archetype silhouette.

  **Never mix within a type in one game.** Total War's 2 to 5 variants per type show that too few
  is worse than none (research-portraits 3.7). Pretenders keep their composed rig portrait.
- **Pick:** rendezvous over the set's file ids with the same `${seed}:${commanderId}` key.
- **State on raster faces is frame-only:** halo or crown above the edge, the wound vignette and
  glyph, the pip ring, rank and badges. Face overlays such as a bandage would float on a face
  without anchors. The exception is a sidecar with hand-set `anchors: { eyeL, eyeR, crown }`.
- **Style lock** (pasted verbatim into every prompt, section 7.2):
  - head-and-shoulders bust, three-quarter view, facing screen-right;
  - crown at 9% from the top, eyes at 39%, cut at mid-chest;
  - one figure; no hands, text, border or signature;
  - painterly oil on wood, moderate detail;
  - one warm candle key from the upper left;
  - a dark warm background near #1C1A17;
  - readable at 64 px.
- **Sizes and files:**
  - **Generate:** 1024 × 1024 PNG.
  - **Intake:**
    - a 512 px master WebP at quality 90, kept in `art-source/portraits/` and outside the
      bundle;
    - a 256 px WebP of at most 24 KB in
      `src/assets/raster/portraits/<nationDef>/<unitId>/<nn>.webp`;
    - 128, 64 and 32 px are derived at load by canvas downscale.
- **Inbox name:** `art-inbox/portraits/<nationDef>__<unitId>__<anything>.png`, for example
  `art-inbox/portraits/cinderHorde__ashChieftain__v3.png`.
- **Intake:** `scripts/art-intake.ts` (Node, outside `src/sim`) runs these steps:
  1. hash the original (sha256);
  2. crop to the style frame (face box from the luminance centroid; the owner confirms on the
     contact sheet);
  3. write the sizes;
  4. flag outliers against the set median in mean luminance, warmth (R − B) and face-box
     position;
  5. flag images whose 99th-percentile chroma is above C\* 45 outside the eyes (a mana-like
     glow);
  6. write a contact sheet HTML at 256, 64 and 32;
  7. on the owner's approval, move the files and write the sidecar.
- **Sidecar** `<nn>.json`:
  - the source file name and the sha256 of the original;
  - the tool and model as ChatGPT shows them, and the date;
  - the full prompt text and the edits;
  - whether C2PA metadata was present (ChatGPT images carry it; WebP conversion drops it, so
    the sidecar records it), and the approver.

  Content validation fails on a missing size or sidecar. The sidecars also answer Steam's AI
  content survey (research-portraits 6.7).
- **Fallback:** a set that is incomplete, or fails validation, is ignored as a whole. The
  procedural bust remains.

### 6.9 Tests

| File | Test |
|---|---|
| `tests/present/portrait/spec.test.ts` | The same input gives the same spec and SVG. Different commander ids differ in at least one salient slot for ≥ 90% of 100 pairs. |
| | Adding one part to a slot changes ≤ 1/(n+1) + 3% of 1,000 seeded picks. |
| | Independent captains on Medium seeds 1 to 5 never share a salient look. |
| | State changes (`hpFrac`, roles, starving) never change `parts`, only overlays, badges and frame. |
| | At 32 px the spec holds no part marked `data-lod="portrait"` and at most 1 badge. |
| `tests/content/portraits.test.ts` | Every commander unit of every nation has a pool or is a rig unit. Every pool id exists. Part tables are append-only against the committed snapshot. |
| | Every raster set has every size and a sidecar, and is complete or ignored. |
| `tests/ui/derive/fog.test.ts` | Portraits of commanders out of sight use `lastSeen`, and never reveal state the viewer cannot see (HP of an unseen enemy). |

---

## 7. Asset production

### 7.1 Inventory

"Procedural" means drawn in code (TypeScript, SVG strings, or Pixi `Graphics`) from content
data, seeded where it varies. "Owner" means the owner generates it in ChatGPT and drops it in
`art-inbox/`. "Later" means after M1.

| Asset | Count | Kind | Phase | Budget | Fallback |
|---|---|---|---|---|---|
| Wild slate, rim ticks, peak, ripple and rift stamps | 3 kinds, about 10 stamp shapes | procedural | 8 | — | — (required) |
| Wild name syllables | 3 sets | content | 1b | — | — |
| Terrain ground textures | 7 | procedural, seeded | 8 | 7 pattern tiles of 256² | flat fill |
| Terrain standing stamps | about 25 shapes | procedural SVG into an atlas | 8 | one 2048² atlas | none |
| Mountain footpath | 1 | procedural | 8 | — | — |
| Settlement kit, neutral (9 shapes) | 9 | procedural SVG | 8 | in the atlas | — |
| Settlement kits, Cinder and Thornwood | 18 | procedural SVG | 11 (M1-should) | in the atlas | neutral kit with a banner pennant |
| PD walls, keep, siege tents, wall states, scaffold | 10 | procedural | 8 (walls, keep), 11 (tents, states, scaffold) | in the atlas | — |
| Wellspring monument, claim pennants | 2 | procedural | 8 | — | docs/09 icon |
| Dominion motif families (R, G) | 2 × 6 shapes | procedural | 11 | in the atlas | none (Dominion mode carries it) |
| Dominion families W, U, B | 3 × 6 | procedural | Later (M2 nations) | — | — |
| Scale-pole motifs | 10 × 2 shapes | procedural | 11 | in the atlas | none |
| Battle scars, pillage smoke, unrest barricades | 6 | procedural | 11 | — | markers and labels |
| Oak table top | 1 tile | procedural in 8; **owner** raster M1-should | 8 / 11 | 1024² WebP ≤ 250 KB | procedural |
| Table edge with iron straps | 1 strip | procedural; owner raster Later | 9 | 1024 × 128 | procedural |
| Tavern backdrop | 1 | procedural gradient in 9; **owner** raster M1-should | 9 / 11 | 1920 × 1080 WebP ≤ 400 KB | gradient |
| Sheet: vellum, deckle, neat line, pins, cartouche, compass | 6 | procedural | 8 (sheet, deckle), 9 (pins, cartouche, compass) | — | — |
| Props: tankard, candles and holders, dividers, quill and inkpot, dice, letter, bread board, tokens | 8 | procedural SVG atlas | 9 (M1-should) | 1024² | none |
| Candle flame, hearth glow, motes | 3 | procedural | 9 | — | none |
| Chrome: oak grain, brass keylines and brackets, leather spine | 4 | CSS and inline SVG | 9 | — | flat tokens |
| Army token materials (wood, pewter) | 2 | procedural | 8 | — | today's badge |
| Miniature standees | per rig | battle part set | 11 (M1-should) | — | token |
| Portrait parts, overlays, frames | about 116 + 12 + 7 | procedural SVG | 8 (v0: head, hair or headgear, beard, frame); 9 (overlays); 11 (full library) | about 120 small files | archetype silhouette |
| Raster portrait sets | 8 per (nation, unit); 12 types | **owner** | M1-should (only complete sets ship) | ≤ 24 KB each; ≤ 2 MB rasters in all | procedural bust |
| Ambient tavern sound | — | Later | M2 | — | — |

### 7.2 Prompt templates for owner-generated assets (exact text)

The rules for every template:
- Paste the text as written. Replace only the `{…}` fields.
- The templates name no artists, studios, games or real people.
- They keep docs/09's distinct-colors rule:
  - no saturated red, green, blue or violet objects that could read as a mana color or a
    banner;
  - firelight is light, not paint;
  - oak is tawny grey-gold, never orange "golden oak", which is ΔE 19.5 from Ember's primary
    (research-tabletop 3).

**Oak table top (seamless tile)**

> Top-down view of an oiled, quarter-sawn white oak tabletop, filling the whole square frame,
> as a flat texture for a game. Three wide planks run left to right with thin dark seams. Tight
> straight grain with a subtle silvery ray fleck. Tawny grey-gold color, roughly between #A7855A
> and #8F7459, darker in the grain. Worn smooth by years of use: a few faint knife scratches and
> one faint ring left by a tankard. Even, soft, neutral daylight with no shadows from objects,
> matte finish, low contrast. No orange or reddish stain, no varnish shine, no objects, no
> text, no border, no vignette. The left edge must continue into the right edge and the top
> edge into the bottom edge so the image tiles seamlessly. Square, 2048 by 2048 pixels.

**Table edge**

> A straight horizontal strip showing the front edge of a thick, oiled white oak tabletop, seen
> from directly above and slightly in front: the flat top in the last fifth of the strip, then
> a rounded edge, then darker end grain fading into shadow at the bottom. A forged black iron
> strap with three round nail heads wraps the edge at the far left only. Tawny grey-gold oak
> (#A7855A to #715636), dark iron (#4A4744). Soft neutral daylight from the top. No objects, no
> text. The strip must tile seamlessly from left to right except for the iron strap.
> 2048 by 256 pixels.

**Tavern backdrop**

> Background plate for a strategy game: the softly out-of-focus interior of a cozy, natural,
> rustic tavern, seen from a seat at a large oak war table. The table itself is not in the
> picture. Heavy dark timber beams, whitewashed plaster and grey fieldstone walls, a stone
> hearth with a low fire at the lower right, a leaded window with soft cool daylight at the upper
> left, plain wooden shelves with pewter tankards and clay jugs, a wooden bench, bundles of
> dried herbs hanging from a beam. The light is mostly daylight. Firelight warms only the area
> near the hearth. Strong depth-of-field blur over everything (nothing is sharp), low contrast,
> muted and earthy colors (oak browns, grey stone, cream plaster), darker toward the edges. No
> people, no animals, no text, no signs, no banners, no brightly colored objects. 16:9,
> 2560 by 1440 pixels.

**Portrait (one subject per request; attach the approved style anchor as Image 1)**

> Image 1 is the style reference: match its painting style, lighting, framing and background
> exactly. Change only the subject. Keep everything else the same.
>
> A head-and-shoulders portrait bust of a single fantasy war leader, in three-quarter view,
> facing to the right of the frame. The top of the head sits about 9% from the top edge, the
> eyes about 39% from the top, and the picture is cut at mid-chest. One warm candle light from
> the upper left, a dim warm fill, and a plain very dark warm-brown background (close to
> #1C1A17) with no objects. Painterly oil on wood, moderate detail, strong silhouette and clear
> value contrast between the face and the background, so the portrait still reads at 64 pixels.
> No hands, no weapons raised, no text, no border, no frame, no signature.
>
> Subject: {nation line}. {type line}. Traits: {trait line}.
>
> Square, 1024 by 1024 pixels.

The nation, type and trait lines come from content, so a prompt matches the procedural look's
parts:
- **Cinder Horde nation line:** "A warrior of the Cinder Horde, ash-born clans who worship fire:
  ash-grey skin, soot markings, charcoal and smoke-grey clothing and armor, a few hot-white
  ember sparks in the hair only."
- **Thornwood nation line:** "A warden of the Thornwood, forest clans who live among ancient trees:
  weathered tan skin, bark-and-leaf clothing and armor in moss green and bark brown, a few pale
  blossoms."
- **Independents nation line:** "A captain of a free hill or village militia, plain weathered
  leather and iron, no insignia."
- **Type line** (examples):
  - "An Ash Chieftain: a horned iron helm, braided beard, scale-plate pauldrons."
  - "A Grove Priest: a wreath crown of oak leaves, braided hair, a plain robe."
  - "An Elder Druid: an antler hood, a long white beard, a heavy robe; faint green light in the
    eyes only."
- **Trait line:** the seeded traits, for example "a scar across the left cheek, grey temples,
  soot stripes on the brow".
- Mages get mana light **in the eyes only**, in a color matching their pips: Ember #FD6533 (not
  candle orange) and Loam #00674B.

The first request (the style anchor) is the same text without the first paragraph. The owner
regenerates it until satisfied, and it then becomes Image 1 for every portrait.

---

## 8. Milestone placement

### 8.1 Phase by phase

| When | What | Exit test |
|---|---|---|
| **Phase 1b commit A** (any time, also during Phase 7) | `placeWilds`, the `wilds` switch (default false), `MapData.wilds = []`, validations, tests | The bit-identity test is green. No fixture moves. |
| **Phase 1b commit B** (right after Phase 7 merges; owner decision) | Wilds on; `STATE_VERSION` +1 with the migration; fixtures re-pinned; `sim:aivai` re-measured; docs/01, 09-balance, 10 | 20 AI games finish on wild maps. The matchup row is recorded. |
| **Phase 8** | Two parts. (1) **Table and wilds:** the Simple table (procedural oak, sheet, deckle, contact shadow), the camera (fit, lean back, detent, clamp, Home), wild rendering (slate, rim, kind stamps, names, hover, cursor label), the mountain footpath, straight ink borders. (2) **Detail and portraits:** ground textures and standing stamps with LOD and exclusion, neutral settlements by tier with PD walls, keep and Wellspring, decoration hidden in data modes, wood and pewter tokens, brass-tack paths, and portrait v0 (busts from about 40 parts with rank frames and the allegiance shape) in the strip, outliner, Commander panel and tooltips | Spec 9.4's label density test, extended with stamp exclusion. The fog guard extended to the map look. The frame budget with Simple. |
| **Phase 9** | Chrome materials (oak top bar and strip, brass keylines and brackets, leather spines); the Full table (room gradient, candle pools, props, ambience) with reduced motion and "Table" and "Map detail" settings; portrait state overlays and badges, report-card rosters; the save migration in `serialize.ts` | Contrast test of the new tokens. Ambience is frozen under reduced motion. |
| **Phase 10** | Replay docks, name cards and the result card use `portraitSpec`. The replay modal frame gets the oak and brass hardware. | — |
| **Phase 11** | The full portrait part library (about 116); Cinder and Thornwood settlement kits; dominion motifs (R, G); scale-pole motifs; battle scars, siege camps and wall states, pillage smoke, unrest; miniature standees; raster intake (`scripts/art-intake.ts`), the manifest and owner rasters (table, backdrop, portrait sets) | Manifest coverage. Content tests for motifs, kits and pools. |
| **Phase 12** | Tune densities, motif shares and thresholds in playtests; performance checks on Large with 4 nations | docs/06's frame budget with Full |

### 8.2 M1, M1-should, Later

- **M1 (must):**
  - wilds (rule, mapgen, art);
  - the Simple table and the camera behavior;
  - terrain detail with LOD and the density rules;
  - settlements by tier with PD walls, buildings, siege state and the Wellspring claim;
  - decoration hidden in data modes;
  - dominion motifs for the Ember and Loam families at three levels (Phase 11). They are the
    owner's "based on alignment" and the cheapest proof of it;
  - portrait v0 for every commander, with rank frames, allegiance shapes and state overlays (HP,
    prophet, pretender, pips, holy, starving, unpaid, fog);
  - the chrome materials;
  - Table settings and reduced motion.
- **M1-should** (cut in this order if late):
  1. ambience;
  2. props;
  3. owner raster table and backdrop;
  4. battle scars;
  5. scale-pole motifs;
  6. Cinder and Thornwood settlement kits;
  7. miniature standees;
  8. raster portrait sets;
  9. fanned-token portrait dots;
  10. seasonal room light.
- **Later (M2 and on):**
  - ridges and passes as border kinds (Dominions-style dynamic passes);
  - noisy borders;
  - curved wild names;
  - interactive or informational props;
  - ambient tavern sound;
  - parchment document theme;
  - W, U and B motif families and kits;
  - `dominionSince`;
  - portrait weathering, afflictions and renown;
  - day and night (never on the sheet);
  - tavern decor that grows with the campaign.

### 8.3 Acceptance criteria to change (docs/10)

- **3.** "Map: 60-province landlocked Medium map with 3 impassable wild ranges, all provinces
  connected with no single province as the only way through, capitals ≥ 6 apart and never
  beside a wild, 3 Wellsprings ≥ 3 from capitals, every color's springs appear at least twice."
- **14.** Append: "The map lies on an oak war table (Table: Full / Simple / Off). Every province
  shows its terrain detail, settlement by population, walls by PD, buildings, and its dominion's
  motifs. Every commander has a seeded portrait with a rank frame and state overlays."
- **4.** Append: "and art never changes the state: the purity test guards `src/present`, and the
  determinism hash is equal with every Table and Map detail setting."

### 8.4 Scope guard (the art pass never stalls the playable game)

1. **Phase 8's exit is playability with the Simple table.** Anything in this proposal that is not
   done when Phase 8's tests pass moves to Phase 11, except the M1-must items for wilds and
   tokens.
2. **Every decorative layer has an Off path,** which is also the path the tests take. A layer
   that breaks a frame budget, a label test or a palette test is switched off, never allowed to
   block a merge.
3. **No art work may touch `src/sim`, `src/mapgen` (after Phase 1b) or `src/ai`.** The purity
   test enforces it. Art bugs can never change outcomes.
4. **Owner rasters are never on the critical path.** Every raster asset has a procedural
   fallback that ships first. A raster set lands only when complete.
5. **Time box:** the Phase 8 table and detail work may take at most about a quarter of Phase 8's
   diff. Past that, the remaining items move to Phase 11 and are noted in PROGRESS.md.
6. **The cut order** in 8.2 is fixed in advance, so cutting needs no new decision.

---

## 9. Docs text

Every block below is exact text. "Staged" means the files in `/home/user/fm-docs/docs/`.

### 9.1 `docs/01-core-rules.md`

**Section 2 "The map": after the bullet "Seas are out of scope for M1. The generator produces a
landlocked map.", add:**

```markdown
- **Impassable terrain (wilds).** Some of the map is not province: wild ranges of peaks,
  chasms and dead lakes. No one owns, enters, crosses or targets a wild. Two provinces are
  neighbors only where their own borders meet, so a wild between them blocks movement,
  retreat, dominion spread, sight and ritual reach alike; everything that counts in provinces
  counts around it. Every province can still reach every other, and no single province is the
  only way through.
```

**Implementation decisions, "Map generation (Phase 1)": replace the "Adjacency" bullet with:**

```markdown
- **Adjacency**: two provinces are neighbors exactly when their borders share a segment;
  cells that meet at a single point are not, and a border with a wild makes no neighbor. The
  drawn map and the graph always agree.
```

**and add after the "Starting population" bullet:**

```markdown
- **Wilds (Phase 1b)**, by the project owner's decision of 2026-10-21 ("i want to make sure the
  maps have some impassible terrain that is noticeable"). The generator makes
  `round(provinces / 20)` wild ranges (Small 2, Medium 3, Large 4) of 1 to 3 cells each
  (weights 25 / 50 / 25) from extra Voronoi cells, so the province count stays exact and the
  map grows to keep each province's area. Kinds cycle through peaks, dead lake and chasm in a
  shuffled order. A range starts at the interior cell with the highest elevation (peaks),
  moisture minus elevation (dead lake) or dryness (chasm), and grows into its best neighbors.
  Ranges are at least 3 cells apart, so no province borders two. A cell becomes wild only if
  the remaining provinces stay connected, each keeps 2 neighbors, and no province becomes a cut
  vertex (the only way between two parts of the map). No wild touches a capital. Capitals are
  placed before the wilds, and terrain, Wellsprings, springs, names, populations, capital
  distance and the 1.5x neighborhood balance are placed and checked on the provinces that
  remain, as before. Wilds live in `MapData.wilds`; they are never provinces, never in
  `neighbors`, and take no id from the game's counter. An attempt that cannot place every
  planned cell is retried like any failed attempt. `MapGenParams.wilds: false` reproduces the
  earlier maps exactly.
```

### 9.2 `docs/09-art-direction.md` (relative to the staged version)

**In "Color palettes", replace the sentence "The map background is a deep parchment #E8DCC2 at
the edges fading to #1C1A17 under the UI." with:**

```markdown
The map is drawn on a vellum sheet (#E8DCC2) that lies on an oak war table (see "The war
table"). No light, grade or vignette ever falls on the sheet, so the colors tested below are the
colors drawn. Wilds are drawn in slate #24222A, the darkest ground on the sheet (L* 13.7);
data-mode ramps start at L* 25 or lighter so it stays the darkest in every mode.
```

**In "Distinct colors", replace "Every pair of terrain fills, and every pair of mana primaries"
with:**

```markdown
Every pair of terrain fills (the wild slate included), and every pair of mana primaries
```

**In "Sprite system", replace the bullet "Portraits for commanders are the same SVG cropped at 2x
with a colored backdrop." with:**

```markdown
- Commander portraits are their own part system; see "Leader portraits".
```

**Replace the section "Pretender chassis art" with** (it agrees with the pretender design's B.8):

```markdown
## Pretender chassis art

A pretender's portrait is its rig in the `portrait` pose, composed from the same parts as its
battle sprite with a detail layer at 128 px and above, and framed as in "Leader portraits" with
the gilded rank. The summary card shows a mana-symbol row beneath.
```

**In "UI chrome", add these rows to the token table:**

```markdown
| `--oak-0` | #2B231C | base of the top bar and the bottom strip |
| `--oak-grain` | #3A2E23 | grain lines on `--oak-0`, at most 1 px and 20% coverage |
| `--brass` | #B8914A | 1 px keylines on the top bar, strip, the docks' map-facing edges and modal frames; corner brackets |
| `--brass-hi` | #D4B26A | the 1 px highlight on corner brackets only |
| `--leather` | #4A3426 | 10 px spines of the Codex and Ledger modals; never under text |
| `--sheet` / `--ink` | #E8DCC2 / #1C1A17 | the map sheet, and text drawn on it |
```

**and add this bullet after "Cards":**

```markdown
- **Materials:** the chrome is a dark instrument case. Dark oak frames the top bar and the
  strip, a 6 px oak spine with a brass keyline edges each dock where it meets the map, and
  modals get an 8 px oak frame with brass corner brackets. Panel bodies, tooltips, buttons and
  rows keep the tokens above with no texture. Brass never takes a disc or drop shape and never
  touches a mana symbol: a 2 px dark ring separates a portrait's pip ring from its frame
  (bright brass is ΔE 3.8 from Radiance's secondary). Every text token
  passes 4.5:1 on every material surface; dim text on the lightest grain is the lowest at 5.16:1.
```

**In "UI chrome", replace the "Motion" bullet with:**

```markdown
- **Motion:** panels appear without sliding. An Urgent alert pulses twice when it appears.
  Reduced motion removes the pulse, the idle bob, every UI tween and the table ambience
  (candles and hearth freeze at their mean; dust motes are removed).
```

**In "Icons", add to the "Map" row:** `wild (three peaks over a row of cliff ticks)`.

**Add these sections before "Delivery rule":**

```markdown
## The war table

The map is a vellum sheet pinned to an oiled oak war table in a cozy, natural tavern.
- **Sheet:** #E8DCC2 with paper grain, a deckled edge, square brass tacks at the corners, a 4% margin
  with a hand-ruled double neat line, the map's name in a cartouche and a compass rose in a
  corner of the margin. A soft contact shadow lies on the oak.
- **Table:** quarter-sawn white oak, oiled, tawny grey-gold (#A7855A to #8F7459), straight grain
  with a silvery fleck, never orange; a rounded edge in darker end grain with forged iron corner
  straps. It extends half the sheet's height beyond the sheet on every side.
- **Props** stay in the margin and do nothing: a pewter tankard, two beeswax candles, brass
  dividers, quill and inkpot, dice, a sealed letter, a bread board, spare wooden tokens. Their
  places come from the game seed.
- **Room:** a blurred tavern beyond the table: timber, plaster and stone, a hearth glimpsed at
  the lower right, a window with daylight at the upper left (the scene's key light).
- **Light:** daylight falls neutral on the sheet. Candle pools (2000 K) warm the oak only, the
  hearth glow lives on the room, and a vignette darkens the table toward the screen edges by
  zoom (0.35 at the farthest lean-back, 0.20 at fit, none from 1.5× fit). Nothing grades the
  sheet.
- **Ambience:** candle flames vary ±3% brightness below 2 Hz; the hearth glow ±4% over 7 s;
  a few dust motes drift in the window light. All of it stops under reduced motion, when the
  tab is hidden, during the replay, and when no table is on screen.
- **Settings:** Table Full (room, table, props, ambience), Simple (table and a still room, no
  props), Off (a flat #15130F around the sheet).

## Map detail

- **Ground textures** are flat lightness changes within ±8% L* of the terrain fill (±10% for
  Wasteland cracks), symmetric so a province's mean color stays its fill; ±4% inside label and
  badge boxes. Plains: grass stipple and hedgerows. Farmland: a patchwork of 5 to 9 fields with
  furrows at 0°, 90° or ±30°. Forest: a canopy scallop. Hills: hachure arcs on the shadow side.
  Mountains: scree and ridge lines. Swamp: short horizontal water streaks and pools. Wasteland:
  a crack network. No texture is a uniform straight hatch; those patterns belong to states.
- **Standing stamps** are trees, peaks, humps, reeds, rocks, houses and motifs, inked from the
  fill by lightness only (−18% and +12% L*) with a 1 px #2B2620 outline at 60%. They never sit
  in a label or badge box, stay inside the ownership band, and are drawn nearest-last. At most 18
  per province at Mid and 48 at Near besides the settlement; at Far only up to 4 relief masses
  (forest clumps, humps, peaks).
- **Passable mountains** carry a dashed footpath (#5E5246 at 60%) through the province, so they
  never read as a wild.
- **Placement** uses seeded Poisson points per province (seed: map seed, province, layer),
  sorted from the settlement outward. Growth adds or removes stamps at the end of that order;
  nothing already drawn moves.
- **Modes:** in every mode but Ownership, ground textures and standing stamps fade out (150 ms,
  instant under reduced motion), so modes tint a plain fill. Wilds and ritual marks stay.
- **Borders** stay straight ink lines (2 px #2B2620) with a slight seeded density change and a
  3 px inner pigment edge (black at 12%).
- **Tokens:** nation army badges look like painted wood, independents like pewter (#91A092),
  with a fixed contact shadow; count plates stay flat. At Near zoom a miniature of the lead
  commander may stand on the token.
- **Paths** are a light thread with square brass tacks (set as diamonds) at each day mark.

## Impassable terrain (wilds)

One look for every wild, so it reads at every zoom and in every mode:
- **Ground:** slate #24222A (CIEDE2000 ≥ 25.4 from every terrain fill for normal vision, ≥ 15.5
  under simulated color blindness), never tinted, banded, hatched or fogged.
- **Rim:** cliff ticks #E9E4D8 at 85%, 4 to 7 px long and 5 px apart, perpendicular to the edge
  inside the wild (3 px and 4 px apart at Far). Against every terrain either the slate or the
  ticks reach 4.1:1 or more.
- **Kind by shape:** peaks are overlapping massifs with lit faces #6B6775 and snowcaps
  #E9E4D8; a dead lake is still water with horizontal ripples and bone-white snags on its shore;
  a chasm is a black rift (#0E0D10) with a lit lip and strata lines.
- **Name** in the display face, letter-spaced, #E9E4D8, without a halo.
- **Hover** brightens the rim and names the wild and the rule; with commanders selected the
  cursor shows ✕ and "Impassable".

## Growth and alignment on the map

Each province shows how it has grown and whose faith holds it. All of it derives from existing
state through the viewer's fogged view; art never shows more than the tooltip.
- **Settlement** at the province's seat (below its label): houses by population, in the same
  steps as Population mode (`UI.popSteps`: 2,000 / 5,000 / 10,000 / 20,000; 1 to 22 houses);
  fresh roofs and a new outer ring when population is 1.25× its start or more, ruins at 0.8× or
  less; a palisade, stone wall or towered wall at PD 1, 10 and 20; the keep for a fort; temple
  and lab buildings (a temple under another nation's dominion shows an unlit brazier); a
  scaffold while building; the owner's banner on the tallest roof. Kits: neutral timber and
  thatch for independents, dark timber and pyre-towers for the Cinder Horde, living wood and
  moss for Thornwood; a nation without a kit takes its primary color's.
- **Events:** siege tents in the besieger's banner and walls cracked, breached or fallen by the
  wall's HP; pillage smoke while an army pillages; barricades at unrest 50 and 75; a Wellspring
  monument with the claimant's pennants and diamond; ritual marks as the magic design draws
  them; for 12 months after a battle the player fought there, churned ground and then grave
  cairns.
- **Dominion** is shown by shapes from the dominating nation's color family, never by tinting
  the land: Ember brings ash drifts, cairns, scorched ground, obsidian, braziers and charred
  trees; Loam brings blossoms, ivy, saplings, mossy stones, meadows and great old trees. Strength
  1 to 3, 4 to 6 and 7 to 10 take 8%, 15% and 22% of the province's stamps, nearest the
  settlement first.
- **Scales:** at Near zoom, each step of a province's effective scale adds two motifs of its pole
  on the province's rim (hedgerows for Order, broken fences for Turmoil, glyph stones for Lore,
  war cairns for Fury, fruit trees for Growth, fungus rings for Rot, briars for Wild, mills for
  Artifice, wayshrines for Sanctity, gibbets for Dread), at most 30% of the stamps.
- **Calm:** growth and alignment change only at the turn of a month, with a 600 ms cross-fade.
  Things that are themselves information (a capture, a building finished, PD bought, a siege, a
  claim) change the day they happen, as the panels do.

## Leader portraits

Every commander has a portrait: a bust built from parts for national commanders and captains
of independents, the rig's portrait pose for summoned commanders and pretenders, and the fort
emblem for a fort's garrison holder.
- **Identity:** the face (head, hair or headgear, beard, marks, skin and hair ramps) is chosen
  per commander from `${game seed}:${commander id}` with weighted rendezvous picks over
  append-only part tables, so a reload or an art update keeps faces. Captains of independents
  draw from a no-repeat deck keyed by their province. Parts come per nation and commander type
  (Cinder Horde: ash-grey skin, horned helms, ember hoods, soot marks; Thornwood: bark-tan skin,
  bark helms with antler stubs, wreaths, leaf hoods; independents: plain helms and an outfit by
  the terrain they guard).
- **Frame:** the shape follows the army badge (round own, notched other nations, plain square
  independents), a band in the owner's banner, and a rank ornament: none (scouts), bronze rivets
  (priests, adepts, captains of independents), a brass ring (chieftains, captains, magi, elder
  druids, summoned), gilded with a crown notch (pretender).
- **State** never changes the face. Overlays and frame badges (at most 3) show wounds (bandage
  below half HP, blood below a quarter), the prophet's halo, the pretender's crown, the pip ring
  and a mage's eye glint, the holy mark, scout and stealth badges, starving and unpaid glyphs,
  gear tier, a desaturated dotted "last seen" portrait under fog, and greyscale for the dead.
- **Sizes:** 256 (designer), 128 (name cards, victory, Codex), 96 (Commander panel), 64 (strip,
  replay docks), 48 (tooltips), 40 (report rosters, Forces), 24 (outliner), 16 (entity links).
  Below 96 px fine strokes drop; at 32 px and below only the silhouette, the frame and one badge
  remain.
- **Owner raster portraits** replace a commander type's procedural faces only as a complete set
  of 8 or more approved images, picked by the same seed. State then shows on the frame only.
```

**Replace the section "Delivery rule" with:**

```markdown
## Delivery rule

All placeholder art lives in `src/assets/sprites/<category>/<name>.svg`, or is drawn in code
from `src/content/presentation/**`. A `manifest.ts` maps unit type ids to sprite part names.
Missing art falls back to the archetype silhouette with a nation tint so the game never shows a
broken image.

Raster art made by the project owner arrives in `art-inbox/` and is taken in by
`scripts/art-intake.ts`, which crops it, writes the bundled sizes under `src/assets/raster/`, keeps
a 512 px master under `art-source/` (outside the bundle), and writes a sidecar JSON per file
with the original's sha256, tool and model, date, prompt, edits, C2PA presence and approver.
Rasters in the bundle total at most 2 MB. Every raster has a procedural fallback, and a
portrait set is used only when complete.
```

### 9.3 `docs/07-ui.md` (relative to the staged version)

**Replace the subsection "### Drawing" under "## Map" with:**

```markdown
### Drawing
- The map is a vellum sheet on an oak war table in a tavern (docs/09 "The war table"). The
  sheet is never tinted by light; the table and the room carry the mood.
- Provinces are filled polygons: terrain color with a subtle noise texture, ground textures and
  standing stamps (docs/09 "Map detail"), and a 2 px border.
- The owner's banner forms an inner band with a keyline (docs/09). Independents have none.
- Each province has a settlement at its seat, below its label, grown from population, PD and
  buildings, with its dominion's motifs around it (docs/09 "Growth and alignment on the map").
- Wilds (impassable peaks, chasms and dead lakes) are slate regions with a cliff-tick rim and
  their name (docs/09 "Impassable terrain"). They are not provinces.
- Draw order from the bottom: sheet, fills, noise, ground textures, standing stamps, wilds,
  borders, bands, ritual marks, mode overlays, labels, numbers chips, paths, badges, transit
  arrows, selection rings, battle markers.
- The province tooltip and cursor label are DOM placed from Pixi coordinates.
```

**In "### Modes", add a bullet after "How a mode draws":**

```markdown
- **Decoration steps aside:** in every mode but Ownership, ground textures, stamps, settlements
  and motifs fade out, so the mode tints a plain fill. Wilds and ritual marks stay. Population
  mode uses `UI.popSteps` (2,000 / 5,000 / 10,000 / 20,000), the same steps the settlements use.
  Ramps start at L* 25 or lighter, so wilds stay the darkest ground in every mode.
```

**In "### Labels and the density budget", add at the end:**

```markdown
- **Stamps and labels:** no standing stamp lies in a label box or badge box (plus 4 px); ground
  textures under them drop to ±4% lightness. Standing stamps cover at most 60% of a province at
  Mid and 75% at Near. The label density test also checks the stamps from `scatterProvince`.
- **Wild names** are labels too, culled first, and take part in the overlap test.
```

**In "### Army badges", add:**

```markdown
- **Material:** nation badges read as painted wooden tokens and independents as pewter, with a
  fixed contact shadow; numbers stay on flat plates. At Near zoom a miniature of the lead
  commander may stand on the token (the badge box grows to hold it).
```

**In "### Moving", add:**

```markdown
- **Wilds:** paths go around them. Over a wild the cursor shows ✕ and the label reads
  "Impassable: the Ashspine"; right-click does nothing there.
```

**Replace "### Fog" with:**

```markdown
### Fog
- **Unexplored provinces:** terrain fills under a parchment haze, with ground textures and
  stamps as pencil outlines, a dotted border, and only a sketched hut at the seat (population
  unknown).
- **Out of sight:** a desaturated fill and a dotted border; the settlement shows what the view
  allows.
- **Wilds** are terrain and are never fogged.
- **Fogged values** read "unknown" or a strength word, never 0. Map art never shows more than the
  tooltip.
```

**Add after "### Fog":**

```markdown
### The table and the camera
- The game starts with the map fitted to the unobscured area, as before. Zooming out past fit
  leans back to 0.72× fit, showing the table and its props; a wheel stop near fit settles on
  fit, and `Home` returns there. Zooming in pushes the table off screen and the table's vignette
  fades to none at 1.5× fit.
- Panning keeps the view's center over the map. Beyond the sheet the view shows at most the
  table, never the room, except when leaning back fully.
- Props are inert; the cursor pans through them. A click on the table clears the selection.
- `H` hides the chrome and leaves the table in view.
```

**In "## Commander panel and Battle Plan", replace "**Header:** portrait with a pip ring," with:**

```markdown
**Header:** a 96 px portrait (docs/09 "Leader portraits") with a pip ring,
```

**In "## Other screens", Settings, replace the "Interface" item with:**

```markdown
  - **Interface:** UI scale, text size, tooltip delay or Off, detail key Hold or Toggle,
    guidance, reset hints, table (Full / Simple / Off), map detail (Full / Reduced).
```

**In "## Accessibility and feel", replace the "Motion and flashes" item with:**

```markdown
- **Motion and flashes:** reduced motion follows the OS and also freezes the table's candles and
  hearth. Screen shake defaults to 50%. The flash limit is always on.
```

### 9.4 `docs/09-balance.md` rows (dated 2026-10-21)

```markdown
| 2026-10-21 | 01 §2 (owner decision) | Wild ranges | none | round(provinces / 20): Small 2, Medium 3, Large 4, Medium 3 nations 4, Large 4 nations 7 | Owner direction "impassible terrain that is noticeable". Measured over 60 seeds per size: wild cells are about 10% of the province count and 33 to 38% of provinces border one |
| 2026-10-21 | (new) | Cells per wild range | — | 1, 2 or 3 with weights 25 / 50 / 25 | Spikes and short ranges; mean 2 |
| 2026-10-21 | (new) | Wild separation | — | ranges at least 3 cells apart; no province borders two | Distinct features, never a wall across the map |
| 2026-10-21 | (new) | Wild guards | — | seed cell off the map edge; no capital beside a wild; every province keeps 2 neighbors; no cut vertex in the province graph | Today's maps have no cut vertex (160 of 160 seeds measured), so the guard keeps that property; capitals are never walled in |
| 2026-10-21 | (new) | Map area with wilds | provinces × 6400 | (provinces + wild cells) × 6400 | Each province keeps its area; Medium grows about 10% |
| 2026-10-21 | (new) | Wild slate | — | #24222A, rim #E9E4D8 | ΔE to the nearest fill (Forest) 25.4 normal, 22.5 protan, 20.3 deutan, 15.5 tritan; edge at least 4.1:1 on one side for every terrain |
| 2026-10-21 | 07 | Population steps (map mode and settlements) | five log-scale steps | `UI.popSteps` 2,000 / 5,000 / 10,000 / 20,000 | One source for the mode and the settlement tiers |
| 2026-10-21 | (new) | Settlement growth marks | — | thriving at pop ≥ 1.25 × start, declining at ≤ 0.80 × start | Growth over a 70-month game is +15% at neutral, so the marks need the ratio, not the absolute |
| 2026-10-21 | (new) | PD walls | — | palisade at PD 1, stone at 10, towers at 20 | Three readable steps over 0 to 30 |
| 2026-10-21 | (new) | Dominion motif levels | — | strength 1–3 / 4–6 / 7–10 take 8% / 15% / 22% of a province's stamps | Visible, never crowding the terrain |
| 2026-10-21 | (new) | Battle scars | — | churned ground for 3 months, cairns until 12 months (1 per 50 casualties, at most 4) | A year of memory, then the land heals |
| 2026-10-21 | (new) | Map detail caps | — | standing stamps ≤ 18 per province at Mid, ≤ 48 at Near, ≤ 2,500 on screen; coverage ≤ 60% / 75% | The density budget of docs/07 |
| 2026-10-21 | (new) | Camera | fit only | lean back to 0.72 × fit; detent ±8% around fit; vignette 0.35 / 0.20 / 0 at 0.72 / 1 / 1.5 × fit | The table is seen by choice; the map stays the instrument |
| 2026-10-21 | (new) | Portrait part pick | — | weighted rendezvous over append-only tables; independents from a 768-look deck | ≤ 1/(n+1) of faces change when a part is added (92.5% with hash % n) |
| 2026-10-21 | (new) | Raster art budget | — | ≤ 2 MB of rasters in the bundle; portraits 256 px WebP ≤ 24 KB; a set needs 8 images | Keeps the 5 MB bundle criterion |
```

### 9.5 `docs/10-milestone-1.md`

**Add a section after "### Phase 7: AI":**

```markdown
### Phase 1b: Impassable terrain (owner decision 2026-10-21)
- Commit A (any time): `placeWilds` behind `MapGenParams.wilds` (default false), `MapData.wilds`,
  the new `validateMap` checks, tests; a pinned hash proves `wilds: false` maps are unchanged.
- Commit B (after Phase 7): wilds on in New Game and `sim:aivai`; `STATE_VERSION` +1 with a
  migration to `wilds: []`; fixtures re-pinned; 20 AI games re-measured and the matchup recorded.
- Tests: exact province count and shares with wilds; no cut vertex; no capital beside a wild;
  ranges 3 apart; paths, sight, rituals and spread go around wilds.
```

**Append to "### Phase 8" (after the UI spec's text):**

```markdown
- War table and map art (`docs/09` "The war table", "Map detail", "Impassable terrain"): the
  Simple table (procedural oak, sheet, deckle, contact shadow); the camera's fit, lean-back,
  detent, clamp and `Home`; wild rendering, hover and cursor; the mountain footpath; ground
  textures and standing stamps with level of detail and label exclusion; neutral settlements by
  population with PD walls, keep and Wellspring; decoration hidden in data modes; wooden and
  pewter tokens; brass-tack paths; portrait v0 for every commander (busts from about 40 parts,
  rank frames, allegiance shapes) in the strip, outliner, Commander panel and tooltips.
- Tests: stamp exclusion in the label density test; the fog guard over `provinceLook` and
  portraits; calm month-boundary updates; slot stability; the palette test with the wild slate.
- Scope guard: Phase 8 exits playable with the Simple table; unfinished art moves to Phase 11.
```

**Append to "### Phase 9":**

```markdown
- Chrome materials (dark oak, brass keylines and brackets, leather spines); the Full table
  (room, candle pools, props, ambience) with reduced motion and the Table and Map detail
  settings; portrait state overlays and frame badges; portraits on report cards.
```

**Append to "### Phase 10":**

```markdown
- Portraits in the replay docks, name cards and result card; the replay modal's frame shares the
  oak and brass hardware.
```

**Replace "### Phase 11" with:**

```markdown
### Phase 11: Art and animation
- All SVG placeholders, part system, tinting, procedural animations, spell particles,
  icons, chassis portraits. Manifest with fallbacks.
- The full portrait part library; Cinder Horde and Thornwood settlement kits; dominion motifs by
  color family and scale-pole motifs; battle scars, siege camps and wall states, pillage smoke,
  unrest; miniature standees; the raster intake script, its manifest and the owner's table,
  backdrop and portrait sets.
```

**Acceptance criteria:** criterion 3, 4 and 14 as in section 8.3 of this proposal.

### 9.6 `docs/06-architecture.md`

**In "## Repository layout", under `mapgen/`, add:**

```
      wilds.ts            # impassable wild ranges: placement, outline, names (Phase 1b)
```

**Under `src/`, add after `ai/`:**

```
    present/              # PURE presentation derivations, guarded like sim (battle design S2)
      map/
        look.ts           # provinceLook: settlement, kit, walls, motifs, scars from the fogged view
        scatter.ts        # scatterProvince: seeded stamp slots per province and layer
        anchors.ts        # provinceAnchors: label, badge, seat
        fx.ts             # map cues and marks (pretender design C.4)
      portrait/
        spec.ts           # portraitSpec: parts, frame, overlays from commander and view
        svg.ts            # portraitSvg: a pure SVG string builder
        hash.ts           # FNV-1a, Mulberry32, keyed and rendezvous picks
```

**Under `render/`, replace the `MapRenderer.ts` and layer lines with:**

```
      MapRenderer.ts      # Pixi app for the strategic map
      camera.ts           # fit, lean-back, detent, clamp
      map/
        TableLayer.ts     # room, oak, edge, light, props, ambience
        SheetLayer.ts     # vellum, deckle, pins, cartouche, contact shadow
        DetailBake.ts     # per-band baked tiles of fills, textures, stamps, wilds; dirty re-bake
        ProvinceLayer.ts ArmyLayer.ts LabelLayer.ts
      portraits.ts        # portrait SVG to cached textures for the replay and name cards
```

**Under `content/`, add:**

```
      presentation/       # presentation data; never imported by sim, mapgen or ai
        map.ts            # textures, stamps, kits, COLOR_MOTIFS, POLE_MOTIFS, detail caps
        table.ts          # table, props, light and ambience numbers
        portraits.ts      # PORTRAIT_POOLS, ramps, PORTRAIT_RANK, overlays
```

**Under `assets/`, add `raster/` (owner art taken in by the intake script), and at the top level
`art-inbox/` (owner drops) and `art-source/` (masters, outside the bundle); under `scripts/`,
`art-intake.ts`.**

**In "## Performance targets", replace the map line with:**

```markdown
- Map render: 60 fps at 1080p with all provinces, 100 army markers, the Full table and full map
  detail; at most 4 draw calls and no filters for the table; static map layers baked per zoom
  band; GPU memory for table and map at most 96 MB on a Large 4-nation map at device pixel
  ratio 2.
```

**In "## Implementation decisions", add:**

```markdown
- **Map presentation** (Phase 8): everything the map shows beyond the sim's numbers (terrain
  detail, settlements, motifs, scars, portraits) is derived by pure functions in `src/present/**`
  from state, the viewer's fogged view and the save's UI block, never stored in `GameState`.
  Random choices hash the game seed with a stable id (province, commander, layer); `state.rng`,
  `Math.random` and wall time are forbidden there by the purity guard. Growth and alignment
  visuals change only at month boundaries; information events change them the day they happen.
- **Wilds** (Phase 1b): `MapData.wilds` holds impassable regions that are not provinces. They are
  never in `neighbors`, so movement, retreat, sight, dominion, rituals and the AI need no code to
  respect them.
```

### 9.7 `docs/08-ai.md` (optional, one line under its implementation notes)

```markdown
- **Wilds** need no AI rule: they are not in the province graph, so `pathsFrom`, fronts and
  threats already go around them.
```

---

## 10. Mockup brief (changes to `ui-mockup/game-screen-v1.html`, in order)

Constraints:
- **Art:** procedural only (canvas, inline SVG, CSS). No external images.
- **Fonts:** the three Google Fonts already loaded (Marcellus SC, Alegreya Sans, IBM Plex Sans
  Condensed).
- **Scripts:** only `https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js`, already present.
- **Kept as they are:** the approved UI (top bar, alerts ribbon, docks, strip, tooltips, keys).
- **Randomness:** everything seeded with the file's `mulberry32`. Nothing may change between
  reloads.

1. **Header and mockup controls.** Rewrite the `page-head` paragraph as a short "Try this" list:
   - lean back with the wheel to see the table;
   - hover a dark wild, then select Varo and hover it again;
   - jump the clock with Time-lapse;
   - open Portraits;
   - switch Table and Vision.

   Add a compact control group in the page head, outside the game window, labelled "Mockup
   controls":
   - `Table: Full | Simple | Off`;
   - `Detail: Full | Reduced`;
   - `Time-lapse: M3 | M12 | M24 | M40 | M70`;
   - `Portraits` (opens the gallery modal);
   - `Vision: Normal | Deutan | Protan | Tritan`;
   - `Reduced motion` (also follows `prefers-reduced-motion`).
2. **Wilds in the map generator.**
   - Use an 11 × 6 site grid (66 sites) in the same `W × H`, and keep the 2 Lloyd rounds.
   - Pick the capitals first (`redCap`, `greenCap` as now).
   - Port `placeWilds` from `wartable-design/calc/wilds-proto.ts` with exactly 3 ranges of 2
     cells, so 60 provinces remain. Kinds are shuffled from peaks, dead lake and chasm.
     Elevation is the existing `noise()`, and moisture is a second sum of sines with other
     phases. Keep every guard:
     - the seed cell is off the rectangle edge;
     - it is not a capital and not next to one;
     - ranges are 3 apart;
     - the remaining graph is connected, every province keeps 2 neighbors, and there is no cut
       vertex.
   - Then re-index the provinces 0 to 59 and keep the wild cells in `wilds[]` with `{ kind,
     name, cells, center, borders }`.
   - Names: "the Ashspine", "the Still Mere", "the Blackrift".
   - `nbrs(i)` returns province neighbors only. `nearest(x, y)` maps a wild cell to `{ wild }`.
   - Terrain shares, owners, names, Wellsprings and commanders are computed on the 60 provinces,
     as now.
3. **The scene behind the map.**
   - Draw the room as CSS backgrounds on `.app`: a radial hearth glow at 88% 92%
     (`rgba(255,137,14,.18)`), a cool window light at 12% 8% (`rgba(141,182,200,.10)`), and a
     `#1E1814` to `#120F0C` gradient.
   - In `draw()`, replace the `#15130F` fill with `clearRect`, so the CSS room shows wherever the
     table does not cover the view. With Table Off, keep the `#15130F` fill and skip steps 1 to 4
     below. Then draw, in world coordinates:
     1. **The oak table**, the rectangle `[-0.5H, -0.5H, W + 0.5H, H + 0.5H]`. Fill it from a
        512² offscreen pattern built once:
        - base #96724C;
        - three horizontal planks with #5D4F39 seams;
        - grain as thin #715636 lines where `sin(y·0.9 + 3·sin(x·0.004 + k))` crosses 0.96;
        - ray fleck as faint #BB9E7C ellipses;
        - the pattern follows the camera through `setTransform`.
     2. **The rounded edge**: a 22-unit band shaded #715636 to #5D4F39, with #4A4744 iron straps
        and three nail dots at each corner.
     3. **Two candle pools** (`lighter`, #FF890E at 14%).
     4. **The table vignette**, alpha 0.35, 0.20 or 0 by zoom (section 3.3).
     5. **The sheet's contact shadow**: the sheet polygon offset 3 px, `rgba(0,0,0,.35)`, blur
        8.
     6. **The sheet**, `[-m, -m, W + m, H + m]` with `m = 0.04H`:
        - #E8DCC2 with a 256² paper-grain pattern at 6%;
        - a deckled edge (seeded jitter of ±0.4% H every 12 units);
        - a double neat line at `m/2`;
        - the cartouche "The Ember Marches" in Marcellus SC #1C1A17;
        - a compass rose in the lower-right margin;
        - four square brass tacks (#B8914A with a #D4B26A edge).
   - The vignette is drawn before the sheet, so the sheet is never darkened.
4. **Camera.**
   - `fit()` stores `fitScale`. Wheel zoom runs from `0.72 × fitScale` to the scale at which the
     median province is 420 px across.
   - **Detent:** 150 ms after the last wheel event, a scale within ±8% of fit animates to fit
     (200 ms; instant under reduced motion).
   - `Home` returns to fit.
   - **Pan clamp:** the view center stays inside `[0, W] × [0, H]`.
   - Show a small chip by the mode column, "Zoom: Far / Mid / Near", from the median on-screen
     province diameter (70 and 180 px), so the owner sees the bands change.
5. **Ground textures** (Ownership mode only), one function per terrain, as in section 4.2. Clip
   to the province, seed with `mulberry32(hash(i, 'tex'))`, and keep lightness within ±8% of the
   fill. Halve the strength inside the label and badge boxes.
6. **Standing stamps** (Ownership mode only, by band):
   - **Placement:** seeded dart-throwing Poisson points inside the province, inset 8 units.
     - Exclude the label box (96 × 30 px at the label), the badge box (30 × 48 px above it) and
       the seat box.
     - Sort by distance to the seat.
   - **Stamps** are canvas paths with a 1 px #2B2620 outline at 60%:
     - tree crowns in two tones;
     - peaks with lit and shaded faces and snow;
     - humps with slope strokes;
     - reeds, rocks, haystacks, a windmill.
   - **Caps:** Far ≤ 4 relief masses, Mid ≤ 18, Near ≤ 48.
   - **Mountain footpath:** a #5E5246 dashed line at 60% through the seat, between the midpoints
     of the two longest edges.
7. **Wilds, drawn in every mode.**
   - Slate #24222A.
   - Cliff ticks #E9E4D8 at 85% inside the outline (edges not shared by two cells of the same
     wild), perpendicular, 5 px apart (4 at Far).
   - Kind stamps: massifs with snow; ripples with bone snags; a rift polygon along the long axis
     with a lit lip.
   - The name in Marcellus SC, letter-spaced (`ctx.letterSpacing = '0.12em'` where supported),
     #E9E4D8.
   - **Hover:**
     - the rim goes to 100%;
     - a tooltip opens through the existing tip system (`wild:<id>`): the title, "Peaks ·
       Impassable", the rule sentence from section 2.2, and "Borders: n provinces".
   - **With a commander selected:**
     - hovering a wild shows the cursor label "✕ Impassable: the Ashspine";
     - a right-click toasts "No path crosses the Ashspine.";
     - `pathTo` already bends around it, because `nbrs` skips wilds.
8. **Borders** as ink: 2 px #2B2620 with a 3 px inner pigment edge (black at 12%). Bands as now.
9. **Settlements** at the seat (below the label):
   - **Tier:** from `pop` through `popSteps` [2000, 5000, 10000, 20000], with houses
     interpolated.
   - **Kit by owner:**
     - red: dark timber longhouses with jagged crests and ember ridge dots;
     - green: round huts with moss roofs;
     - none: timber and thatch.
   - **Buildings:**
     - a banner pennant on the tallest roof;
     - PD walls (palisade from 1, stone from 10, towers from 20);
     - the keep, temple and lab at the capitals;
     - Wellspring monuments with a hollow diamond, or a filled one with the claimant's pennants
       once claimed.
   - **By band:** Near shows houses one by one, Mid one cluster stamp scaled by tier, Far only a
     keep glyph at the capitals.
10. **Dominion motifs** from `p.dom`: level 1 for strength 1 to 3 and level 2 for 4 to 6, taking
    8% and 15% of the stamp slots nearest the seat.
    - **Red family:** ash stipple, black cairns with one ember dot, scorched patches, obsidian
      shards, braziers.
    - **Green family:** blossom clusters, ivy stones, saplings, mossy standing stones.
    - **Ashfen** (Cinder town, Thornwood dominion 2) gets blossoms. Call it out in the header as
      "contested faith".
11. **Scale-pole motifs** at Near, on the province rim.
    - Give the demo nations scales: Cinder Turmoil −2 and Fury −1; Thornwood Growth +3 and
      Wild +2.
    - Use `round(scale × strength / 10)` (halves away from zero), placing `2 × step` motifs
      from section 5.5's table.
12. **Events.**
    - **Morholt:** a crossed-blades marker plus fresh battle scars (churned ground, broken
      spears, crows), matching the feed's "Victory at Morholt".
    - **A Burn the Fields mark** on one green border province: irregular char patches and three
      thin smoke lines. No 45° hatch.
13. **Time-lapse** (the "growth over time" demonstration). Each step applies a deterministic
    synthetic delta from the M3 state:
    - Population compounds monthly by `0.002 + 0.003 × growth step`.
    - Dominion strength rises 1 per 8 months, up to 5.
    - **M12:**
      - temples in 2 red and 2 green provinces;
      - Varo at 6/14 HP (bandage on his portrait);
      - Morholt's scar turns to cairns.
    - **M24:**
      - Cinder takes 3 more provinces: the bands change at once, the kits at this step;
      - Ashfen PD 12 (stone wall);
      - pillage smoke where a Cinder army pillages;
      - Morholt's scar gone.
    - **M40:**
      - a Cinder army besieges Deepmoss (tents in the Cinder banner, cracked walls);
      - Kharnath PD 22 (towers);
      - Sunmere claimed (pennants, a filled diamond).
    - **M70:** Growth-pole land in Thornwood shows fruit trees and lush crops, and Cinder land
      shows Turmoil and Fury rims.
    - Between steps, cross-fade the baked images over 600 ms (instant under reduced motion).
      Label it "Mockup: jumps the clock; in the game this changes once a month."
14. **Map modes.** Outside Ownership, skip the ground textures, stamps, settlements, motifs and
    scars, with a 150 ms fade. Keep wilds and ritual marks. Lift the `heat()` ramp's first stop
    from `[24,30,60]` to `[58,62,104]`, so every step has L\* ≥ 25 and wilds stay the darkest
    ground.
15. **Fog demonstration.** Mark the 8 provinces with the largest centroid `x` as unexplored:
    - the terrain fill under a parchment haze (`rgba(232,220,194,.45)`);
    - textures and stamps as pencil outlines (#2B2620 at 35%, no fill);
    - a dotted border;
    - one sketched hut at the seat;
    - tooltip population "unknown".
16. **Army tokens and paths.**
    - `badgeSVG` becomes painted wood: a 1 px lighter top edge, a 1.5 px dark outline, and a
      soft contact shadow ellipse. Plates stay flat.
    - At Near zoom, add a 40 px procedural standee (a helmeted silhouette in the banner tint) on
      each token.
    - The move preview becomes a thread (3 px #F4EEDF, 1 px dark edge, dashed) with diamond brass
      tacks and day plates at each step.
17. **Portraits.**
    - Write `portraitSVG(c, size)`, seeded by `hash('11:' + c.id)`, with the slots of section
      6.3:
      - **frame:** banner backdrop darkened 35% with a vignette; allegiance shape (round own,
        notched other); a banner band; a rank ornament (rivets, a brass ring, or gilded with a
        crown notch);
      - **base:** head shape (6 ellipses); a skin ramp per nation (Cinder #5E5B58 / #8F8C88 /
        #B9B6B1 with ember-crack marks; Thornwood #6E4E36 / #A0785A / #C9A585);
      - **features:** hair and beard, collar, headgear per type (horned helm, ember hood with
        flame, ember circlet, ash hood, bark helm with antler stubs), and eyes and mouth at 96
        and up.
    - **Demo states:**
      - Ondra is the prophet (halo);
      - the Ashen Titan is the pretender (a monumental head with a flame crown and the gilded
        frame);
      - Seren, Ondra and the Titan wear pip rings, and Ondra the holy mark;
      - Kesh wears the scout and hood badges;
      - Varo is wounded at M12.
    - **Placements:**
      - the strip (64, replacing the letter `.face`);
      - outliner rows (24);
      - commander tooltips (48);
      - the Ilsa tooltip, with a notched frame.
18. **Portraits gallery modal** (the Portraits button), four rows:
    1. twelve seeded Ash Chieftains at 64, to judge variety;
    2. every Cinder and Thornwood commander type, plus an Independent Captain in its four
       terrain outfits, at 128;
    3. one Ash Chieftain at 256, 128, 96, 64, 48, 32 and 24 (level of detail);
    4. one commander in every state at 64: healthy, under 50%, under 25%, prophet, pretender,
       starving, unpaid, last seen, dead.
19. **Chrome materials.**
    - **Top bar:** `--oak-0` #2B231C with a CSS grain of two repeating gradients in #3A2E23, and
      a 1 px `--brass` #B8914A bottom border.
    - **Strip:** the same, with a 6 px oak spine on top.
    - **Docks:** a 6 px oak spine and a 1 px brass line on the edge facing the map.
    - **Modals:** an 8 px oak border with 14 px L-shaped brass corner brackets (pseudo-elements,
      2 px, with a #D4B26A edge).
    - **The Codex modal:** a 10 px leather (#4A3426) spine with brass stitch dots at 40%.
    - **Tooltips and buttons:** unchanged.
20. **Ambience** (Table Full only, frozen under reduced motion, stopped when `document.hidden`):
    - two candle flames on the table margin: teardrop paths with a #FFE8C3 to #FF8400 radial
      gradient, brightness ±3% from smoothed value noise at ≤ 2 Hz;
    - the hearth glow's alpha ±4% over 7 s;
    - 12 dust motes drifting at 2 to 4 px/s in the window light.

    "Simple" drops props and ambience and keeps the table. "Off" is a flat #15130F around the
    sheet.
21. **Vision preview.** Add inline SVG `feColorMatrix` filters with the Machado 2009
    full-severity matrices (as in `tests/content/colorMath.ts`) for protan, deutan and tritan.
    Apply the chosen one to `.app` with CSS `filter: url(#…)`, labelled "approximate preview".
22. **Performance and screenshots.**
    - Cache the static scene in an offscreen canvas keyed by camera, mode, Time-lapse step and
      settings. The ambience loop only composites the cache plus flames and motes, at ≤ 30 fps.
      Target 60 fps at 1440 px wide.
    - Refresh the screenshots:
      - `shot-desktop.png` (fit);
      - `shot-lean.png` (leaning back, Full);
      - `shot-near.png` (Near over Kharnath: houses, walls, motifs, poles);
      - `shot-wild.png` (a wild hovered with Varo selected);
      - `shot-m40.png` (Time-lapse M40);
      - `shot-portraits.png` (the gallery);
      - `shot-pop-mode.png` (Population mode: decoration off, wilds on);
      - `shot-deutan.png`.

---

## 11. Open questions for the owner (each has a default the build follows)

1. **Wild kinds:** peaks, dead lakes and chasms, or peaks only? *Default: all three.* They give
   variety, and each sits beside the terrain that explains it.
2. **Dynamic passes** (ridges that open with a scale or a ritual, as in Dominions) in M2? *Default:
   Later.* The data model leaves room for them.
3. **Seeded personal names for commanders** ("Varo", with "Ash Chieftain" as the title)? Names
   do half the work of telling leaders apart. *Default: a separate small task, out of this
   design.*
4. **Weathered faces** after many battles (needs the units track's `battles` counter)? *Default:
   M2, with renown.*
5. **Which raster portrait sets first?** *Default: Ash Chieftain and Warden Captain, then the two
   priests.* Scouts last.
6. **Table props that do something** (an hourglass for speed, dividers to measure)? *Default:
   none in M1.* Props are inert.
7. **Seasonal window light in the room?** *Default: M1-should.* Never on the sheet.

---

## Appendix A. Harmony with the other tracks

- **Battle presentation** (`battle-design/final.md`):
  - name cards and replay docks use `portraitSpec`, so a commander looks the same on the map
    and in battle. Humanoid commanders get the bust. Monsters and pretenders keep the rig's
    portrait pose, which their S4.4 note already names (`RigTextures.portrait`);
  - the map's stamp shapes and the stage backdrops share one prop vocabulary (tufts, rocks,
    reeds, dead trees, crop rows, a windmill; S2.4);
  - the room's seasonal light uses the same months (11 to 2 frost);
  - the replay modal's frame takes the oak and brass hardware.
- **Pretender design** (`pretender-design/final.md`):
  - `src/present/map/fx.ts` and `mapMarks` (C.4) draw at layer 9. This design asks that
    persistent marks change fills by at most 8% (the measured palette cap): Ash Rain's 30-day
    "ash-grey tint" becomes an ash-flake stipple, and Fertile Season's 8% brightening is within
    the cap;
  - the B.7 sigil sits on the band corner;
  - B.8 pretender portraits are framed with the gilded rank (6.5);
  - looks live outside `GameState` (B.2), as portraits do here.
- **Units and items** (`units-items-design/design-draft.md`):
  - the gear-tier chip (○ ◆ ★) goes on the portrait frame, and the ★ on the army token;
  - the `battles` and `kills` hook (R9) feeds M2 weathering;
  - afflictions (M2) use face anchors.
- **UI spec** (`ui-design/spec-final.md`, approved):
  - every layout, key and tooltip stays;
  - `Portrait` gains `commander?: CommanderId`, and the Commander panel header grows from 64 to
    96 px;
  - Population mode's steps are fixed as `UI.popSteps`;
  - the label density test and the fog guard are extended;
  - Settings → Interface gains Table and Map detail.

## Appendix B. Files

- This proposal: `wartable-design/proposal-instrument.md`.
- Measurements:
  - `wartable-design/calc/wilds-proto.ts` and `.out`;
  - `calc/base-cuts.ts` and `.out`;
  - `calc/wild-fill.ts`, `calc/wild-fill2.ts` and `calc/wild-edge.ts`, with their `.out` files;
  - `calc/chrome.ts` and `.out`.
- Inputs: `owner-direction.md`, `research-tabletop.md`, `research-mapdetail.md`,
  `research-portraits.md` (this folder), and the files listed at the top.
