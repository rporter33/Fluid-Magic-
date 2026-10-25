
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

