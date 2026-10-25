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
