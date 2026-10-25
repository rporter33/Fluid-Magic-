# Core Rules

This document is the rules bible for the simulation. Every number here is a starting
value; the implementer may tune, but must record tuned values in `docs/09-balance.md`.

## 1. Time

- The base unit is one **day**. One simulation tick advances one day.
- 30 days make one **month**. Economic rates are expressed per month and applied
  fractionally per day (rate / 30), accumulated in floating point, with integer
  resources rounded at display time and banked as floats internally.
- Speed controls: Paused, 1x (1 day per real second), 2x (2 days/s), 3x (4 days/s),
  4x (8 days/s). Space toggles pause. Number keys 1 to 4 set speed. Plus and minus step.
- Any command may be issued while paused. Commands apply at the start of the next tick.
- Game start is Year 1, Month 1, Day 1. The UI shows `Y1 M3 D14` style dates.

## 2. The map

- A **province** is a polygon region with a terrain type, a population, springs, and an
  owner (a nation or Independents).
- Default map: 60 provinces for 2 nations, scaling 25 provinces per additional nation.
  Capitals are placed at least 6 provinces apart by graph distance.
- Terrain types and their base values:

| Terrain | Materials base | Supply base | Move days | Pop range at start | Defense bonus |
|---------|----------------|-------------|-----------|--------------------|---------------|
| Plains | 10 | 60 | 4 | 6000 to 12000 | 0 |
| Farmland | 8 | 120 | 4 | 10000 to 18000 | 0 |
| Forest | 20 | 50 | 6 | 3000 to 7000 | +1 def to defenders |
| Hills | 30 | 40 | 6 | 3000 to 6000 | +1 def to defenders |
| Mountains | 40 | 20 | 9 | 1000 to 3000 | +2 def to defenders |
| Swamp | 5 | 30 | 8 | 1000 to 3000 | attackers −1 att |
| Wasteland | 15 | 10 | 5 | 500 to 2000 | 0 |

- Seas are out of scope for M1. The generator produces a landlocked map.
- Capitals start at 25000 population on Farmland or Plains, with a fort, a temple, and a lab.

## 3. Population

Population is the root of the economy. Each province has an integer `pop`.

- **Growth** per month: `pop * (0.002 + 0.003 * growthScale)`, where `growthScale` is the
  province's effective Growth/Rot scale (−3 to +3). Rot provinces shrink.
- **Recruitment** removes `popCost` from the province (10 for a human troop, 20 for
  cavalry, 0 for summoned or undead, 50 for a commander).
- **Pillage** (an army order) removes 2% of pop per day, converts it to gold at 1 gold per
  20 pop lost, and adds 5 unrest per day.
- **Battle in the province** removes 0.5% of pop per 100 casualties.
- **Starvation** of the province (supply below 0 for armies) does not reduce pop, only
  army health. Enemy dominion does not reduce pop in M1.
- Population is displayed in the province panel prominently and on the map as a
  small bar under the province name. The player should always feel this number.

## 4. Resources

There are four resource families: gold, materials, supply, and mana (per color).

### Gold
- Income per month per province: `pop / 100 * taxRate * (1 + 0.07 * orderScale) * (1 - unrest / 200)`.
- `taxRate` is a per-province setting: Low (0.5, −2 unrest/month), Normal (1.0),
  High (1.5, +4 unrest/month). Default Normal.
- Gold is national and pooled. Upkeep is paid daily: each troop costs `goldCost / 15` per
  month, each commander `goldCost / 15` per month, sacred units half that.
- Gold below zero: no recruitment, all upkeep unpaid, troops lose 1 morale per month
  unpaid (recovers when paid). Keep it simple; no desertion in M1.

### Materials
- Produced per month per province: `terrainBase + pop / 500`, modified by Artifice scale
  (+10% per step) and Wild scale (−10% per step).
- Materials are **local to forts**. A province with a fort collects its own materials plus
  50% of the materials of each adjacent friendly province that has no fort of its own.
- Materials accumulate in the fort's pool up to a cap of 6 months of production and are
  spent on recruiting units with a materials cost. Unspent materials beyond the cap are lost.
- Materials do not travel between forts.

### Supply
- Each province provides `supplyBase + pop / 50` supply, modified by Growth (+10% per step)
  and Wild (+15% per step) and Rot (−10% per step).
- Every troop consumes 1 supply per day (size 3+ units consume 3, undead and summoned
  constructs consume 0). Commanders consume 1.
- If total consumption exceeds supply, every consuming unit in the province loses 2% of
  max HP per day and squads lose 1 morale per 5 days of starvation (capped at −3).
  Starved HP and morale recover at the same rate once fed.
- Supply is shown in the province panel as `used / available`.

### Mana
- Each **spring** in a province produces 1 mana of its color per month, delivered to the
  national pool of the province owner.
- Each capital holds 4 springs of its nation's color. Independents' provinces have 0 to 2
  springs, placed by the generator so that each color appears on the map.
- **Dominion tint**: a province produces an additional `floor(dominionStrength / 3)` mana
  per month of the dominating nation's color, paid to the province owner only if the
  owner is also the dominator. A mono-Red nation with dominion 9 in a province it owns
  gets +3 Red per month from that province.
- Mana is spent on rituals and on the pretender's dominion abilities. Battle spells cost
  fatigue, not mana (see Magic).
- Mana has no cap.

## 5. Unrest

- Per province, 0 to 100. Reduces gold by `1 - unrest / 200` and blocks recruitment above 50.
- Sources: High tax +4/month, pillage +5/day, enemy dominion present +1/month per 3 strength
  of enemy dominion, lost battle in province +10 once.
- Decay: −2/month baseline, plus −2 per Order scale step, plus −5/month per priest in province.

## 6. Nations, commanders, and armies

- A nation has: an id, a color identity (one color in M1), a pretender, a capital, pools of
  gold and mana, research levels per color, a dominion score, and scales.
- A **commander** is a unit with `leadership` (max troops), orders, a position (province or
  in transit), carried mana, and optionally pips (mage), holy pips (priest), or both.
- A **squad** is `{ unitTypeId, count, hpPool, moraleMod, formation }` attached to a commander.
  Troops have no individual identity, only counts and a shared HP pool, which is split into
  per-unit HP only inside the battle resolver.
- An **army** is the set of commanders in one province (or in transit together) selected by
  the player. Grouping is a UI concept: each commander moves independently unless the
  player issues a move to a multi-commander selection, which gives all of them the same
  path and the slowest commander's speed.

### Orders (commands)
Orders a commander can hold: `Idle`, `Move(path)`, `Pillage`, `PatrolDefend`,
`Research` (mages in a lab), `Preach` (priests, spreads dominion), `CastRitual(spellId, target)`,
`ClaimWellspring`, `Build(buildingId)` (any commander), `Recruit` is province-level not
commander-level.

### Movement
- Movement is along the province adjacency graph. A commander in transit has
  `{ from, to, progress, totalDays }`. `totalDays = destinationTerrain.moveDays * speedFactor`
  where `speedFactor = 1.0` for map speed 2, `0.7` for speed 3, `1.5` for speed 1.
  A squad's map speed is its unit's `mapSpeed`; a commander moves at the min of its own
  and its squads'.
- Entering an enemy or independent province triggers a battle at the moment of arrival,
  resolved immediately in that tick.
- Armies in transit can reverse: a reverse order swaps `from` and `to` and sets
  `progress = totalDays - progress`.
- Paths are computed by Dijkstra over move days. The UI shows the path and ETA.

## 7. Buildings

| Building | Gold | Days | Requires | Effect |
|----------|------|------|----------|--------|
| Temple | 200 | 30 | owned province | Spreads dominion. Priests in a temple province get +1 preach strength. One per province. |
| Lab | 300 | 30 | owned province | Required to recruit mages and to perform rituals and research in that province. One per province. |
| Fort | 600, 300 materials | 150 | owned province, not adjacent to another fort | National recruitment, materials collection, siege defense. M1 ships only capital forts; the Build order exists but building new forts is **M2**. |

A commander in the province issues the Build order. The commander is busy for the
duration. Building completes even if the commander leaves (keep it simple).

## 8. Recruitment

- National units are recruited only in provinces with a fort. Mages also require a lab.
  Sacred units and priests also require a temple.
- Each fort has a recruitment queue. Each queued item costs gold on queueing, materials
  on queueing, and population on completion. Items complete in `unit.recruitDays`
  (troops 10 days per batch of 10 for basic infantry; see unit data). Only one item is
  built at a time per fort, in queue order. Turmoil scale: −10% build time per step.
  Order scale: +5% per step.
- Commanders are recruited as single units. Troops are queued in batches; the batch size
  is chosen by the player (1 to 50). A batch's time is `recruitDays * ceil(count / 10)`.
- Completed troops appear as a squad under a fort's **garrison commander** (a free,
  non-recruitable, immobile commander that exists in every fort). Garrison squads can be
  transferred to any commander in the province via drag and drop.
- **Provincial Defense (PD)**: any owned province may buy PD levels for gold
  `(level + 1) * 15`. Each level adds 2 militia-grade defenders (nation-specific) and every
  5 levels add 1 archer-grade defender. PD fights alone or alongside any garrisoned army.
  Max level 30.

## 9. Independents

- Every non-capital province starts owned by Independents with a defender force sized by
  its graph distance `d` from the nearest capital:
  `strength = 8 + 4 * d` troops, drawn from a terrain-themed pool (plains: light infantry
  and archers; forest: archers and wolves; hills: heavy infantry; mountains: heavy
  infantry and a giant for d ≥ 3; swamp: swamp fighters). Each independent force has one
  commander.
- Independents never move or recruit. Taking a province converts its PD to 0.

## 10. Battle

Battle is resolved instantly in the tick in which a hostile army enters a province.
Full resolver rules are in `docs/04-battle.md`. Summary:

- Up to 75 rounds. Attacker retreats at round 50 if undecided; both sides retreat at 75.
- Round structure: casters cast, ranged fire, melee, morale checks, end-of-round effects.
- Dice: 2d6 open-ended (a 6 is rerolled and added) on both sides of every contested roll.
- Routed squads that survive return to the province they came from. Losers of a defensive
  battle retreat to a random adjacent friendly province, or are destroyed if none exists.
- The resolver is deterministic given the seed, so replays are regenerated from the
  recorded event log rather than re-simulated.

## 11. Sieges

- A fort province with defenders and an attacking army in it is under siege instead of
  fighting immediately. Each day the attacker adds `sum(str) / 10` siege points and the
  defender repairs `sum(str) / 20`. A fort has `wallHp = 300`. When wall HP reaches 0 the
  attacker may **Storm**: a battle where defenders get +3 protection from walls and a
  morale +2 bonus. The attacker may also storm at any time with the defenders getting
  +6 protection while walls stand (strongly discouraged by the UI).
- Besieged provinces produce no gold, materials, or recruits, and the fort's supply
  is halved. Supplies for the besieged come only from the province itself.
- The siege order is automatic: an army entering a fort province with defenders begins
  sieging. The player clicks **Storm** to attack.

## 12. Dominion

- Each province has `dominion = { nationId | null, strength 0..10 }`.
- Sources of spread, checked once per month per source:
  - Capital: 3 checks.
  - Temple: 1 check (+1 with the Sanctity scale per step).
  - Pretender present in the province: 2 checks. Prophet: 1 check.
  - Priest with order Preach: 1 check per holy pip.
- A check: pick a random adjacent province (or the same province 40% of the time). Roll
  d10; if the roll ≤ the nation's `dominionScore`, push +1 toward the nation. If the
  province is dominated by another nation, that nation's strength decreases by 1 instead,
  and it flips when it reaches 0. Strength caps at the nation's `dominionScore`.
- A nation whose capital dominion reaches 0 and that holds no temple anywhere suffers
  **Godless**: no rituals, pretender recall. A nation with no provinces is eliminated.
- Scales in a province are the scales of the dominating nation, scaled by strength:
  `effectiveScale = round(nationScale * strength / 10)`. Independents have scales of 0.
  Enemy scales therefore apply inside your provinces when their dominion overtakes yours.

## 13. Wellsprings and victory

- The generator places 3 Wellsprings (5 for 3 to 4 nations) in independent provinces at
  least 3 provinces from every capital, each guarded by `strength = 30` independents.
- A Wellspring province produces 2 mana of each color per month to its owner and grants
  +1 to one scale (per Wellspring, chosen by the generator).
- A priest with holy pips in an owned Wellspring province uses the `ClaimWellspring`
  order, which takes 10 days uninterrupted. A claimed Wellspring counts toward victory
  and grants the owning nation +1 dominion score. Losing the province unclaims it.
- **Victory**: claim 2 of 3 Wellsprings (3 of 5), or be the last nation with a capital.
- **Defeat**: lose all provinces, or lose the capital while holding no other fort.

## 14. Fog of war

- The player sees all provinces' terrain and ownership. Independents' defender strength
  is shown only as a word (weak, moderate, strong, fortress) unless a scout is adjacent.
- Enemy armies are visible in provinces adjacent to any owned province or any own army
  and anywhere a scout can see (scouts see 2 provinces). Population and springs of a
  province are visible once it has been owned or scouted.

## Implementation decisions

Rules settled during implementation where this doc was silent or conflicted, recorded per
`CLAUDE.md`. Numbers live in `src/content/mapgen.ts` and `docs/09-balance.md`.

**Map generation (Phase 1)**
- **Province count**: the New Game size (Small 40, Medium 60, Large 80) is the count for two
  nations; each nation beyond two adds 25. Medium with two nations is section 2's 60. The
  count is exact, not approximate.
- **Capital terrain and name** come from the nation (Kharnath is Plains, Deepmoss is
  Forest), overriding section 2's "Farmland or Plains" where the nation doc differs. When
  the same nation appears twice, later capitals get numerals (Kharnath II).
- **Capital placement**: farthest-point sampling on the province graph, at least 6 apart;
  which nation gets which capital is shuffled. Maps whose capitals' starting neighborhoods
  (provinces within 2 hops) differ in population by more than 1.5x are passed over: the
  generator takes the first map within the ratio, or the most even of several valid maps.
- **Terrain** is assigned by rank from simplex-noise elevation and moisture, so every map has
  exactly the terrain shares in `TERRAIN_SHARES`, capitals included.
- **Adjacency**: two provinces are neighbors exactly when their borders share a segment;
  cells that meet at a single point are not. The drawn map and the graph always agree.
- **Wellsprings** are never adjacent to each other and at least 3 from every capital. They
  are chosen so every nation is equally far, in total, from the Wellsprings it needs to win
  (2 of 3, 3 of 5), and then spread as far apart as that allows.
- **Wellspring scale bonus**: "+1 to one scale" is one step toward one pole of one axis,
  chosen by the generator. Axes differ between Wellsprings while there are axes left; the
  pole is random.
- **Springs** (section 4): independent provinces hold 0 to 2 springs. Across the
  independents every color gets the same number of springs, give or take one, and at least
  two; terrain decides which color goes where when there is a choice. Wellspring provinces
  hold no ordinary springs, since they already yield every color.
- **Independents** (section 9): each province stores its starting defender strength
  (`8 + 4d`, 30 on Wellsprings) at generation. Troop composition by terrain comes in Phase 3.
- **Starting population** is uniform in the terrain's range, rounded to 100.

**Economy and population (Phase 2)**
- **Daily application**: every monthly rate (gold, materials, mana, growth, unrest) is
  applied each day as rate / 30. A day's rates come from one snapshot taken before any of
  them change. Discrete monthly events (dominion spread) fire on the last day of a month.
- **Start**: 300 gold, no mana, an empty materials pool. The capital starts with dominion
  of its own nation at the pretender's dominion score.
- **Scales in a province** (section 12): `effectiveScale` rounds halves away from zero, so
  both poles round alike. A nation's own scales gain one step per Wellspring province it
  owns. Scale effects from section 4's formulas apply in both directions, alongside the
  pretender table: Turmoil lowers gold 7% per step, Wild lowers materials 10% per step,
  Artifice lowers supply 10% per step.
- **Upkeep** (section 4): upkeep is paid as far as the treasury allows; gold never goes
  below zero from upkeep. A short day adds its unpaid share to the nation's unpaid-days
  counter and a fully paid day takes one off, so morale recovers at the rate it was lost.
  Troops lose 1 morale per 30 unpaid days, at most 3 (the "gold below zero" rule).
- **Materials cap**: the 6-month cap only stops a pool from growing. A pool above the cap
  (after a siege or a population drop) keeps what it has. A besieged fort collects
  nothing, neither its own materials nor its neighbors' share.
- **Province effects** (timed ritual effects) are in force while the day is before their
  `untilDay` and are dropped at the end of the day before it.
- **Supply**: commanders eat where they stand, also while in transit (at the province they
  left). Independents never eat and never starve. A starving squad loses HP from its pool,
  with wounds spread evenly as in the resolver, so troops die in proportion:
  `count = ceil(count * newHp / oldHp)` (0 once the pool is empty), which for a healthy squad
  is the pool rounded up to whole troops. Commanders cannot starve below 1 HP. The
  starvation counter is capped so morale returns at the rate it was lost. Fed units heal
  2% of max HP per day, which also heals battle wounds. The squad `moraleMod` of section 6
  is derived from the starvation counter and the unpaid-days counter, not stored.
- **Unrest** (section 5): priests calm only their own nation's provinces and only while
  standing there. "Enemy dominion present" means another nation dominates the province.
- **Mana**: sieges stop gold, materials, and recruits, not mana.
- **Pillage** (section 3): one army with the Pillage order is enough; more do not stack.
  Pillage works in any province the army stands in. With several nations pillaging, the
  first in nation order takes the gold. Patrol has no economic effect. Pillage is applied
  after the day's gold and before growth, which is computed from the population at the
  start of the day.
- **Buildings** (section 7): one construction per province at a time. It is abandoned if the
  province changes hands, and the commander who started it returns to idle when it ends,
  unless it has since been given another order (a Build order names its province). Wild and
  Artifice scale construction time; it is never under 1 day.

**Commanders, movement, recruitment, independents, fog (Phase 3)**
- **Map speed**: national commanders move at speed 3 (docs/03), so an army's pace is set by
  its slowest troops; a lone commander or scout moves at 3. A group moved together keeps the
  slowest member's speed on every leg, frozen when ordered.
- **Leg days** are whole days: `round(moveDays * speedFactor)`, at least 1 (table in
  docs/09-balance.md). Progress counts days, so a reversal and an ETA are whole days too.
- **Hostile provinces**: a province is hostile to a nation if it does not own it, or if a
  commander of another owner is present in it (in transit or not; garrison holders never
  count, and neither do commanders hidden by stealth, since a refused path would give them
  away). A besieged fort is hostile to its owner's arrivals because its besiegers stand in
  it. A move ends on arrival in a hostile province; Phase 4 fights there. Paths may cross
  only friendly provinces, so only the last province of a path may be hostile; the
  pathfinder and move validation both enforce this, and `findPathFor` gives a group exactly
  the path validation accepts (none while its leg ends among hostiles). A stealthy scout
  that enters a hostile province stops there like any army.
- **Movement within a day** (step 2): every transit advances; arrivals settle (Phase 4
  battles go here); then commanders with a move order start their next leg the same day.
  Commanders passing through therefore stand in the province while arrivals are resolved.
- **Location** is always the last province a commander stood in, and a commander is present
  there in transit or not for supply, vision, hostility, and (Phase 4) battles. Acting there
  needs it to stand still: squad transfers, Build orders, and research are refused on the
  march, priests calm unrest and armies pillage only while standing. A reversal swaps the leg's ends and turns the days walked into the days back
  (section 6), but the commander never reached the far end, so its location, supply,
  vision, and `cameFrom` stay those of the province it left. Reversing a leg not yet begun cancels it. A reversed commander stops when
  it gets back. A new path for a commander in transit starts where its current leg ends.
- **Orders** set without arguments (idle, pillage, patrol, research, preach) take effect on
  arrival when given on the march; research needs a mage standing in an own province with a
  lab; preach needs holy pips. Orders with progress or targets come only from their own
  commands. The garrison holder takes no orders, scripts, or builds; only its squads move.
- **Squads**: a commander holds at most one squad per unit type and row. Transfers,
  formation changes, and recruits merge into a matching squad, which keeps its id (troops
  and HP add up; the higher starvation counter stays). A partial transfer splits off a proportional share of
  the HP pool. Leadership counts troops, whatever their size.
- **Recruitment** (section 8): time is `recruitDays * ceil(count / 10)` for troops and
  `recruitDays` for commanders, scaled by the fort province's recruit time (Order +5%, Turmoil
  -10% per step) and build time (Wild +15%, Artifice -15% per step; section 8 calls recruit
  time "build time"), rounded up to whole days and fixed when queued. Beasts cost 10% less
  gold per Wild step. The queue pauses while the fort is besieged or its unrest is above 50,
  and queueing is refused then. A finished item waits until the province has the population
  it costs. Completed troops join the fort's garrison holder; commanders stand in the fort.
  Items queued by a nation that no longer owns the fort are dropped without refund. The
  recruit and build time percentages are summed into one factor, `max(0, 1 + sum)`.
  Cancelling returns the gold in full and the materials only up to the fort's pool cap, so
  the queue cannot bank materials past the cap; a besieged fort's queue is frozen and cannot
  be cancelled from.
- **Garrison holder**: exactly one per fort, owned by the fort's owner and standing there;
  createGame sets this up. A fort that changes hands (Phase 4 capture) gets a new holder, and
  the old one is removed with any troops it still keeps.
- **Provincial defense** (section 8): raising PD from level L costs `(L + 1) * 15`, so 0 to 30
  costs 6975 gold. PD cannot be bought during a siege. PD levels are public knowledge, like
  terrain and ownership.
- **Independents** (section 9): one Independent Captain leads each province's force. Pools are
  split by weight (largest remainders): plains, farmland, and wasteland 2 light infantry to 1
  archer; forest 2 wolves to 1 archer; hills heavy infantry; mountains heavy infantry plus one
  giant (counted in the strength) at 3 or more from a capital; swamp swamp fighters.
  Farmland and wasteland have no pool in section 9 and use the plains pool.
- **Fog** (section 14): a nation sees other nations' armies in and next to its provinces and
  its commanders' locations, and within 2 of its scouts. A stealthy commander leading only
  stealthy troops is never seen; garrison holders show only while they keep troops. Explored
  provinces (population and springs known) are those ever owned or within a scout's sight.
  Independent strength reads as weak (under 16), moderate (under 24), strong (under 30), or
  fortress, and exactly where one of the nation's scouts is in or next to the province.
  Each day a nation is told, once per province and enemy nation, of armies that came into
  sight; it remembers which enemy commanders it saw at the end of the last day.

**Battles, sieges, capture (Phase 4)**
- **Who fights** (sections 6 and 10): when a nation's commanders arrive in a province hostile
  to it, their moves end and, while it still has commanders there: (1) it first fights any
  third nation with commanders present (the first in nation order), and stops if it loses;
  (2) in its own province it stops there (a relief is done); (3) a nation's fort is besieged,
  defended or not, with no battle on arrival; (4) any other province is taken at once if
  nobody defends it, or fought for. The defenders are the owner's commanders present, the
  fort's garrison troops (never the holder itself), and PD; in an independent province, the
  independents. All of a day's arrivals stand in their provinces before any is resolved, and
  they are resolved in arrival order, so a later same-day arrival is already there to defend
  when an earlier one fights.
- **Hidden commanders** (stealthy, leading only stealthy troops) take no part on either side:
  they never fight, besiege, storm, or take a province, and are never attacked. An arrival
  of hidden commanders only ends its move.
- **Capture only if held**: a won battle or storm takes the province only if the winning nation
  still has a commander (not hidden, not a garrison holder) standing there. Otherwise the
  owner keeps it, with whatever PD and garrison troops the battle left.
- **Retreat** (section 10, one rule for every loser): back to the province it came from if
  that is not the battle's province and is friendly (owned by its nation, with no other
  nation's commander present, hidden ones aside); else to a random adjacent friendly province
  (`state.rng`); else the commander dies with its troops. Independents never move, so beaten
  independents die. A fort's garrison troops are lost when its defenders lose. Retreating
  commanders arrive at once, idle.
- **After a battle**, every surviving commander that fought, on either side, ends its transit
  and its move order (idle) where it fought; the losers then retreat. A winning side's routed
  squads and commanders stay in the province with their side: section 10's "return to the
  province they came from" would need a squad to travel without a commander.
- **Deaths**: every commander death (battle, nowhere to retreat, later spells) goes through
  one path, `commanderDies`, which clears the nation's `pretenderId` and, for a prophet,
  `prophetId`, starting the 24-month wait for a new prophet.
- **Population and unrest** (sections 3 and 5): a battle costs the province
  `pop * 0.005 * casualties / 100`, counting every troop and commander killed on both sides
  (summoned units aside). "Lost battle in province +10 once" applies when the province's owner
  loses a battle there, whether it attacked or defended.
- **PD after a battle**: PD that fought is set to `min(pd, ceil(militia left / 2))`; archers do
  not count.
- **Sieges** (section 11), each day after arrivals: a siege ends when no commander of the
  besieger (hidden ones aside) is present. Otherwise the walls take `attackers' str / 10`
  and are repaired by `defenders' str / 20`, clamped to 0..300, where str sums every troop
  and commander present on that side (garrison troops and PD defend; the holder does not).
  Walls are down below 1 HP, shown as 0. An undefended fort falls once its walls are down.
  Reinforcements of the besieger join the siege as it stands; a nation that beats the
  besiegers in the province takes over the siege and its battered walls.
- **Storm**: the besieger may order a storm at any time while it has a commander there. It is
  fought in the next day's siege step: an undefended fort falls at once; otherwise the
  defenders get +2 morale and +6 protection while the walls stand, +3 once they are down.
  The siege ends with the storm, whoever wins.
- **Capture** (sections 8, 9, 13): the new owner gets the province at Normal tax with PD 0;
  any siege ends, a Wellspring claim is cleared, and a fort gets a new garrison holder (the
  old one's troops are lost). The old owner's recruitment queue drops by the Phase 3 rule
  and construction is abandoned by the Phase 2 rule. Dominion is unchanged.

