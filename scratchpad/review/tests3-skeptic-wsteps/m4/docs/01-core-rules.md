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
