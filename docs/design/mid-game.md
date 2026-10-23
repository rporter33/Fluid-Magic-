# The mid-game and the long session: seasons, supply lines, diplomacy, mercenaries, Great Workings, the map

> Status: proposed, 2026-10-23, written at the owner's request after the Three Kingdoms research
> pass. Nothing here is built. It lands in stages: the map section's rules with Phase 8 where
> they are cheap, the rest after Phase 9b's playtest, across M2 and M5 (`docs/00-vision.md`).
> The owner answered section 12's questions the same day (`mid-game.owner-answers.md`): seven
> on their defaults, supply reach at two hops and the Vast map uncapped at 270 and measured.

The owner's aim (2026-10-23): "a much deeper, modern, accessible and realistic Dominions game",
with the ideal full session "the length of other notable 4X games". Today's match is expansion,
then a Wellspring rush that ends every AI game in a mean of 22 months with no eliminations
(`docs/PROGRESS.md`, Known issues). A 15 to 20 hour session is made of the part that does not
exist yet: what turns on after expansion stalls, and a map large enough to hold it. This record
designs that part against the branch's rules and code, and takes the overworld with it, because
the map is where the player lives for those hours.

## 0. The design in sixteen lines

1. The short match stays the skirmish mode. The long session is a different map scale and a
   staged victory, not a slower clock.
2. **Seasons**: four of three months each. Winter cuts supply and slows marches; spring grows.
   Every rate the economy already has gets one seasonal factor from content.
3. **Supply lines**: an army eats from the nearest own fort along a path of friendly land; each
   hop past two costs a share of the supply it finds (owner decision 2). Doomstacks deep in enemy land starve.
4. **Rivers and roads** are drawn by the relief map already; they become rules: roads shorten
   legs and supply hops, rivers slow crossings and shield defenders.
5. **Diplomacy** moves from the Three Kingdoms record's Tier 2 to core once a map holds six
   nations: attitude, truce, alliance, the coalition rule. Nothing else.
6. **Mercenaries** wait in the tavern, as in Dominions: bands with a hire price and an upkeep,
   bid for against other nations, gone when unpaid. Gold's late sink.
7. **Great Workings**: one ritual per color that changes the world, a few slots in the world,
   visible on the map, dispellable. The late-game chase.
8. **Research** becomes three short schools per color with a choice at each step, same spells,
   one decision per level.
9. **The long-session map**: 150 to 200 provinces, 6 to 8 nations, named regions, Wellsprings
   scaled with it, victory in stages with a hold period.
10. **Automation ladder**: auto-tax, auto-PD, a research queue, rally points, an advisor that
    proposes economy moves through the officer proposal system. Delegation is a choice.
11. **The overview band**: the farthest zoom strips terrain to washes, realms and a few large
    tokens, stated as what each zoom band removes.
12. **Map search, pins and marker muting** are planned now so the label budget leaves room.
13. Fog is memory: explored land keeps its last-seen look; only unexplored land is unpainted.
14. The map paints itself: dominion spreads on its own, and the land shows it. No hex to
    capture by hand.
15. Every system is a rate the top bar can show. Nothing here is a hidden model.
16. Order of work, after Phase 9b's playtest: seasons and rivers, supply lines, diplomacy,
    mercenaries, research schools, the long-session map, Great Workings.

## 1. What the research says

Player feedback on the overworlds and mid-games of the reference games, from the sources at the
end:

| Game | What players praise | What they complain of | Lesson |
|---|---|---|---|
| Dominions 5 and 6 | depth, nations, magic | "beyond dated" look; the terrain layers made it "impossible to have an overall view"; fog shows nothing of what was explored; icons and armies hard to pick out | the overview and fog are rules, not art |
| Total War: Three Kingdoms | the painterly campaign map, "the best-looking Total War ever" | a minority: "cluttered and hard to read" | a painted map still needs a density budget |
| Crusader Kings 3 | zooming out gives a paper map on a table; zooming in strips realm colors for terrain and names, so you plan without switching modes | — | each zoom band removes something |
| Civilization VI | "the most legible Civ" at launch | the parchment fog over explored land made the world "lifeless" and hid scouted features | fog must look like memory, not paper |
| RTK XIV | hex painting shows territory and rivals' power at a glance; supply lines are intuitive | capturing every hex by hand is labor; auto-capture marches in circles | let the map paint itself |
| Age of Wonders 4 | "easy to read and not overloaded" | the top mod removes glows and hover effects | even a clean map accumulates noise |
| Paradox map modes | EU4 added colored borders so terrain mode could be the one you play in | Victoria 3's five lenses, each with a mode | few modes, one good default |
| 4X forums at large | map search (Civ VI), outliner icons that show state (Stellaris) | late-game clutter, hidden units | search, filter, mute |

And on the mid-game, from the same games: the systems that keep a 4X alive after expansion are
the ones that change the rules of the land (seasons, supply, globals), the ones that add actors
(diplomacy, mercenaries, independents that react), and the ones that give a late chase (wonders,
globals, staged victories). The design below takes one of each.

## 2. Seasons

- **The rule.** A year is four seasons of three months: spring (months 1 to 3), summer, autumn,
  winter. The date reads `Y2 Winter M11 D4`. Seasons are content (`src/content/seasons.ts`):
  one factor per rate per season, applied where the rate is computed in `selectors.ts`, so the
  tick, the UI and the AI read one number.

| Rate | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|
| Supply | +10% | 0 | +20% (harvest) | −30% |
| Population growth | +0.1% | 0 | 0 | −0.1% |
| Move days | 0 | 0 | 0 | +2 on Hills, Mountains and Forest; +1 elsewhere |
| Materials | 0 | +10% | 0 | −10% |
| Unrest decay | 0 | 0 | 0 | −1 |

- **Scales speak to seasons.** Growth softens winter supply by 5% per step; Rot deepens it.
  Wild lengthens winter's move penalty by one day on Forest. A Green Great Working (section 7)
  can hold a province in spring.
- **Why it fits.** The economy is already per-month rates applied per day (`docs/01` §1); a
  season is one more factor. The map already repaints monthly (`war-table.md` 4.7), so the land
  shows the season: snow on Mountains and Hills, bare Forest canopy, golden Farmland in autumn.
  The tavern's "room's seasons" (`docs/10` Phase 12) become the same clock.
- **Why it matters for length.** Campaigns get a rhythm: march in summer, hold in winter, as RTK
  and Total War do. A 20 hour session needs quiet months the player can plan in.

## 3. Supply lines

- **The rule.** Every province has a supply source today (`supplyBase + pop / 50`). An army also
  draws on its nation's nearest fort: its **supply path** is the shortest path over friendly or
  own-dominated land to an own fort province, by hops. An army at most 2 hops from a fort eats
  from the province as today (owner decision 2; the default said 3). Each hop past 2 reduces the supply the army can use by 20%
  (content), to a floor of 20%. No friendly path at all: the floor. Independents and garrisons
  are never on a supply line.
- **Roads** (section 4) count a hop as half. A Granary (Phase 9b) extends its fort's reach by 1.
- **What it does.** A 60-troop stack four hops into enemy land on Hills (supply 100 to 160 a
  day, the Known-issue number) starves at 60% of that; six hops, at 20%. Forts, roads and
  governors become the logistics the Known issues asked for ("armies larger than 60 troops in a
  Hills province starve within a month" can pass by distance, not by cutting Hills supply).
- **Visible.** The Supply map mode draws the supply path from a selected army as a dotted line
  to its fort, and the army badge's wheat glyph turns to the half wheat when the line is long.
  The engagement preview (`docs/07`) shows "supply after arrival: 60% (5 hops from Kharnath)".
- **AI.** `assess.ts` adds the supply share to `armyPower`; the War step's march gate reads it, so
  the AI does not overextend. One number, one place.

## 4. Rivers and roads as rules

The relief map draws water and roads (`map-relief.md` 3.6, 3.9). They become rules in
`src/mapgen` and `src/sim/movement.ts`:

- **Rivers.** The generator traces 2 to 4 rivers per 60 provinces from high ground to the map
  edge along province borders, as a border property (`MapProvince.neighbors` gain
  `river: boolean` per edge). A crossing adds 2 move days, and the defender of a province gets
  +1 def against an army that arrived across a river, for that battle. Rivers never cut the
  graph; the wilds' no-cut-vertex rule stays.
- **Roads.** Each capital and each fort province connects to its catchment by roads the
  generator draws along the shortest edges; a road halves a leg's terrain days (minimum 2)
  and counts as half a hop for supply. Roads can be built: a Build order `road(to)` on a
  commander in the province, 100 gold and 20 days per edge, M2 with forts.
- **Fords and bridges.** A road across a river is a bridge: no crossing penalty, and a siege
  target of its own (an attacker in either province may `cutBridge` in 10 days; the owner
  rebuilds in 20). This is the one new order; everything else reuses `build`.
- **Why it fits.** Movement is Dijkstra over edge costs (`movement.ts`); rivers and roads are
  edge costs. The map already draws them, so the rule only makes a drawn thing true, which is
  the test the owner's "realistic" sets (`docs/00` pillar 1: numbers you can feel).

## 5. Diplomacy, promoted

`docs/design/three-kingdoms.md` section 4 defines the relation record, attitude, truce,
alliance and the coalition rule as Tier 2. This record promotes them to core for any map with
six or more nations, unchanged in content, with two additions for the long session:

- **Claims.** A nation whose dominion has held a province of another at 7 or more for 12 months
  gains a claim on it; attacking a claimed province costs no attitude with third nations.
  Claims are the one reason a war can be "just", and they make dominion the engine of
  diplomacy, which is the game's own idea.
- **Coalition wars.** When the coalition rule drops every attitude toward the leader below −50,
  the AI nations form a coalition: a shared truce among themselves for 24 months and a shared
  target. The message feed announces it; the leader sees "the world turns against you". This is
  how a 20 hour session gets its act three.

No tribute, no marriage, no embassies. Two commands and one record, as before.

## 6. Mercenaries in the tavern

Dominions' mercenary market, placed where this game already sits: the tavern.

- **The pool.** The world has 6 to 10 mercenary bands at a time (content: 12 bands per color pair
  of the map's springs, drawn deterministically from `state.rng` at game start and refreshed
  one per 6 months). A band is a commander with squads from the independent and nation pools,
  a hire price (100 to 600 gold), an upkeep (its troops' upkeep × 1.5) and a contract of 6
  months.
- **The board.** The tavern panel (shared with Phase 9b's free officers, Tier 2 Search) lists
  the bands available to the nation: those within 4 hops of its land. Hiring is a bid: the
  highest bid at the month's end wins; ties go to the nearest. The AI bids by its treasury and
  the War gate.
- **The contract.** A hired band arrives at the nation's nearest fort in 10 days, takes orders
  like any commander, and leaves at the contract's end or the first unpaid month, returning to
  the pool with its wounds. It never governs, holds a post, or is captured (it ransoms itself).
- **Why it fits.** The sim has every piece: independent pools, commanders with squads, upkeep,
  the message feed, a validated command (`hireBand`). It gives gold a late sink, gives a losing
  nation a comeback, and makes the tavern a place the player visits for a reason.

## 7. Great Workings

Dominions' global enchantments, in the color pie:

| Color | Working | Effect while it stands | Cost | Days |
|---|---|---|---|---|
| W | Dawn Unending | every temple makes +1 check; unrest decay +2 everywhere the caster's dominion holds | {W:30, generic:15} | 60 |
| U | The Drowned Library | research +50% for the caster; every other nation's research −10% | {U:30, generic:15} | 60 |
| B | The Long Night | population growth −0.3% everywhere; the caster's undead cost no upkeep; Dread +1 in every province | {B:30, generic:15} | 60 |
| R | Season of Ash | supply −25% everywhere but the caster's dominion; fire damage +2 in every battle | {R:30, generic:15} | 60 |
| G | The Greening | spring in every province of the caster's dominion all year; beasts cost half | {G:30, generic:15} | 60 |

- **Slots.** The world holds `floor(nations / 2) + 1` Workings at once (3 on a 4-nation map).
  A new Working past the cap displaces the oldest unless its caster pays the displaced caster's
  cost again. Each Working is a landmark on the map at the caster's capital and a banner in the
  top bar for every nation.
- **Dispelling.** `Unmaking` (L6, any color, {generic: the Working's color cost}) targets a
  Working; a contest of the two casters' Lore plus their nations' research levels in the
  Working's color, DRN both sides. A failed Unmaking spends its mana.
- **Why it fits.** They are rituals (`rituals.ts`), with one new primitive, `globalEffect`, that
  registers a world-wide `provinceEffect` with no province. The selectors read them like any
  effect. The AI's `magic.ts` casts the nation's Working when mana is 2× its cost and no slot
  is free only if it can afford the displacement; it casts Unmaking when a Working hurts it
  more than `AI.unmakeThreshold`.
- **Why it matters for length.** A chase at research level 6 that every nation sees on the map
  is what a 20 hour game ends with. It also answers "research tops out at level 6" with a reason
  to get there.

## 8. Research as schools

The docs' research is levels that unlock lists (`docs/02` §4). For the long session, each color
has three **schools** of two levels each, and a level is reached by choosing a school:

| Color | Schools (two spells each, from the existing ten) |
|---|---|
| R | Flame (Ember Dart, Fireball), War (Warcry, Blood Fury), Ruin (Burn the Fields, Pyre Storm); rituals follow their school |
| G | Thorn (Thorn Spray, Entangle), Bark (Bark Skin, Regrowth), Wild (Call of the Wild, Swarm) |

- The RP table is unchanged; a school's second level costs its color's next level. A nation may
  open all three schools; the order is the choice. Level 6 (Ash Rain, Rootwall, the Workings)
  needs two schools at their second level.
- The Research modal's five columns become five rows of three school cards each. The AI picks
  by its personality (`research` weight and the War gate). Content validation checks every
  spell sits in one school and every school has two levels.
- **Why.** One decision per level is what a 4X player expects, and the same twenty M1 spells
  serve it. Dominions' lists are its least liked system in every review read for this record.

## 9. The long-session map and the staged victory

- **Scale.** The long session plays at 150 to 200 provinces with 6 to 8 nations. The generator
  already makes Large 4-nation maps (130 provinces) in about half a second and the tick runs
  under 2 ms at 110 provinces with 326 commanders (`docs/PROGRESS.md` Phases 1b and 3), so 200
  provinces and 8 nations are inside the performance budgets with the same code. New map size
  `Vast` (120 for 2 nations, +25 per nation; 8 nations give 270). Owner decision 8: no cap at
  200; the map reaches 270 and is measured (generation time, the 2 ms tick budget, the overview
  band at 60 fps) before any cap is set.
- **Named regions.** The generator groups provinces into regions of 5 to 9 by terrain and
  adjacency (a watershed, a range's foothills, a coast), names each from the syllable generator
  with a region suffix ("the Reedmarsh", "Ashfall Downs"), and draws the name at the mid zoom
  in the label budget's largest size. Regions are data (`MapData.regions`), never a rule; they
  give scenarios, events, mercenary bands and the message feed a place to name.
- **Wellsprings** scale: 3 for 2 nations, 5 for 3 to 4, 7 for 5 to 6, 9 for 7 to 8, placed by the
  existing fairness search.
- **Staged victory.** Claiming the majority of Wellsprings opens an **Ascension** of 6 months
  (owner decision 5: start at six and test)
  during which every other nation sees the claimant's capital marked and the coalition rule
  applies at double weight; the claim must hold all 6 months. Losing one Wellspring resets it.
  Last capital standing still wins at once. The short match keeps the immediate win.
- **Why.** Dominions and the Known issues agree: an immediate Wellspring win ends the game
  before its mid-game. The hold period is the cheapest fix and gives act three its clock.

## 10. The overworld

The branch's map direction (`war-table.md`, `map-relief.md`, the owner's natural-landscape
decision of 2026-10-23) already answers most of section 1: the war table, the natural landscape
with the clear-colors option, ownership as rails and glow, labels by zoom with a density budget,
fog as "not yet painted", growth drawn on the land. Four things the feedback says are still
missing, and all four matter more at 20 hours than at one.

### 10.1 The overview band

Dominions 6's loudest complaint is losing the whole-map view. The war table's lean-back view is
the answer, if it is a strategic layer and not a smaller painting. The zoom bands (`docs/07`,
"Labels by zoom") gain a column, **what the band removes**:

| Band | Shows | Removes |
|---|---|---|
| Lean back (the table) | realms as washes, capitals, Wellsprings, Workings, army tokens merged per region with a count, region names | terrain detail, province labels, settlements, badges, rails |
| Far | the above plus province rails and fort icons | settlements, terrain stamps, minor labels |
| Mid | the painted land, settlements, labels, badges by exception | nothing; the density budget rules |
| Near | everything, with the numbers layer on demand | — |

The lean-back band is drawn from the same data with a separate, cheap renderer pass, so it holds
60 fps on a Vast map where the painted land would not.

### 10.2 Named regions on the land

Section 9's regions are drawn as a hand-lettered name along the region's long axis at the Far and
Lean-back bands, in the parchment label style, never over a province label. Hovering a region at
those bands names its provinces and who holds most of them. Regions are the unit the message
feed uses at a distance ("fighting in the Reedmarsh").

### 10.3 Rivers and roads drawn as rules

Section 4's rivers and roads are drawn by the relief map already; the rule makes the drawing
true. The move preview bends at a ford and shows "+2 days, crossing"; the Supply mode draws the
supply path along roads; a cut bridge shows as a broken span. Nothing is drawn that is not a
rule, and no rule is hidden.

### 10.4 Late-game tools

- **Map search** (key `/`): provinces, commanders, regions, bands, Workings by name; results
  highlight on the map and list in the outliner.
- **Pins** (`docs/07` key P) gain a pin list in the outliner and a pin layer toggle.
- **Marker muting**: the outliner's section headers mute a class of markers on the map (battle
  markers, scout eyes, transit arrows), as alerts can be muted. The muted state lives in the UI
  block of the save.
- **Fog as memory**: explored land keeps its last-seen look and date; the tooltip says "as of
  Y2 M4". Only unexplored land is unpainted parchment. This is the Civ VI lesson and is already
  the `war-table.md` 3.10 rule; it is restated here because the long session makes it matter.

### 10.5 What the map never asks

No hex to capture by hand. Dominion spreads on its own and the land shows it (`war-table.md`
section 4). The player's map work is choosing where to march and what to build; the painting
is the game's.

## 11. Architecture fit

- **Purity and determinism.** Seasons are a factor of `state.day`; supply paths, rivers, roads,
  regions and bands are data or Dijkstra over edge costs; mercenaries and Workings are
  commanders and effects drawn from `state.rng` in fixed tick steps. The purity guard needs no
  change.
- **Content.** `seasons.ts`, `supplyLines` in `rules.ts`, `rivers` and `roads` in `mapgen.ts`,
  `mercenaries.ts`, the Workings in `spells/*.ts` with the `globalEffect` primitive, schools in
  `spells/index.ts`, `regions` in `mapgen.ts` and `names.ts`, `AI` numbers for each.
- **Commands.** `hireBand`, `castRitual` (Workings and Unmaking reuse it), `build` with `road`,
  `cutBridge`, and the diplomacy commands of the Three Kingdoms record. Automation (section 0,
  line 10) is UI-side: it issues ordinary commands on the player's behalf and is never a sim
  rule, so the AI and the player keep the same command set.
- **State.** `MapData` gains `rivers` (per edge), `roads` (per edge), `regions`; `GameState`
  gains `bands` and `workings`; `NationState` gains the relation record. One save step per
  phase.
- **AI.** Seasons and supply lines are read through `assess.ts`; mercenaries in `recruit.ts`;
  Workings and Unmaking in `magic.ts`; coalitions in a `diplomacy` step. Every number in `AI`.
- **UI.** The season in the clock and on the land; the supply path in Supply mode; the tavern
  board; the Workings banner; the schools modal; the overview band; search, pins, muting.

## 12. Open questions for the owner (settled)

Answered 2026-10-23 (`mid-game.owner-answers.md`): defaults on 1, 3, 4, 5, 6, 7 and 9; two
hops on 2; 270 and measure on 8. Defaults in bold as asked.

1. Season length: **three months each**, or two?
2. Supply reach before the penalty: **three hops**, or two? (Owner: two.)
3. Do rivers protect defenders: **yes, +1 def for that battle**, or only slow the crossing?
4. Working slots: **`floor(nations / 2) + 1`**, or a flat three?
5. The Ascension hold period: **six months**, or twelve?
6. Research schools: **three per color of two levels**, or keep levels and add a queue only?
7. Mercenaries: **in the long session and M2 forts**, or already in the short match?
8. The Vast map's cap: **200 provinces**, or let it reach 270 and measure? (Owner: 270 and measure.)
9. Automation on every difficulty: **yes; it is a convenience, not a rule**.

## 13. Order of work and gates

After Phase 9b's playtest, in this order, each its own phase with tests mirroring `src` and a
balance row per number:

1. **Seasons and rivers** (M2 with forts; Phase 8 draws them first): the cheapest feel per line
   of code, and the map section's rules.
2. **Supply lines and roads**: makes forts, governors and the Granary matter; re-measure the
   Hills starvation line in the checklist.
3. **Diplomacy, promoted, with claims and coalitions**: needed before six-nation maps.
4. **Mercenaries**: the tavern board shared with Tier 2 Search.
5. **Research schools**: a content reshuffle and one modal.
6. **The long-session map**: Vast size, regions, Wellspring scaling, the staged victory, the
   overview band, search and muting. This is M5's first phase.
7. **Great Workings and Unmaking**: with the M2 colors, because three of five are theirs.

Gates, in the runner and in play:

- 20 runner games on a Vast 6-nation map end by at least three reasons, with a mean past 48
  months and at least two coalitions formed.
- The Hills starvation line passes by supply distance with Hills supply unchanged.
- A human session on a Vast map reaches 15 hours with the alerts ribbon never past six open and
  the overview band holding 60 fps.
- The two Three Kingdoms questions, asked again after seasons and supply lines: did the land
  make a story the player retold; did the player pause for logistics more than for armies.

## Sources

- Wargamer, Dominions 6 review (https://www.wargamer.com/dominions-6/review)
- Steam, "10+ years, the same ugly graphics" (https://steamcommunity.com/app/2511500/discussions/0/5715697457569906144/)
- Steam, Dominions 6 terrain change thread (https://steamcommunity.com/app/2511500/discussions/0/4132683013932217244/)
- Fistful of Wits, Dominions 6 (https://fistfulofwits.com/2024/03/07/dominions-6-same-great-taste-more-accessible/)
- Quarter to Three, Dominions 4 legibility (https://forum.quartertothree.com/t/dominions-4/72798?page=28)
- Wireframe, Total War: Three Kingdoms review (https://wireframe.raspberrypi.com/articles/total-war-three-kingdoms-review-a-masterful-reinvigoration)
- Destructoid, the Three Kingdoms map (https://destructoid.com/take-a-look-at-total-war-three-kingdoms-gorgeous-map)
- Steam, Three Kingdoms map thread (https://steamcommunity.com/app/779340/discussions/0/1642038749317256993)
- Paradox, CK3 dev diary 2, the medieval map (https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-2-the-medieval-map.1274052/page-2)
- GameWatcher, the CK3 map (https://www.gamewatcher.com/crusader-kings-3-map)
- GamePressure, Civ VI hands-on (https://www.gamepressure.com/editorials/previews/civilization-vi-hands-on-dont-judge-a-game-by-its-promo-screens/z3ba)
- Digital Trends, Civ VI art (https://digitaltrends.com/gaming/art-civilization-vi)
- Steam, Civ VI fog thread (https://steamcommunity.com/app/289070/discussions/0/340412122412001815)
- TheSixthAxis, RTK XIV review (https://www.thesixthaxis.com/?p=351911)
- CogConnected, Age of Wonders 4 review (https://cogconnected.com/review/age-of-wonders-4-review/)
- Steam Workshop, AoW4 Less Visual Clutter (https://steamcommunity.com/sharedfiles/filedetails/comments/2974850147)
- AltChar, Victoria 3 lenses (https://www.altchar.com/game-news/there-will-be-at-least-5-map-modes-in-victoria-3-a8dSi0K54DdL)
- Paradox, EU4 dev diary 1 on terrain mode borders (https://forum.paradoxplaza.com/forum/threads/europa-universalis-iv-developer-diary-1-the-world-is-at-your-feet.631266/post-14321044)
- Game8, 4X clutter and search (https://game8.co/articles/featured/6362)
- PC Gamer, the Stellaris interface (https://pcgamer.com/why-i-love-stellaris-slick-interface)
- The Three Kingdoms research pass: `three-kingdoms.md`, section 1 and its sources
