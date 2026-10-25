# Phase 2 planned decisions (not yet implemented)

Where docs are silent or conflict, Phase 2 intends to do the following. All numbers come from
src/content (rules.ts, pretenders/scales.ts, units, nations, buildings).

## Time
1. Monthly rates (gold, materials, mana, population growth, unrest) are applied every day as
   rate / 30, accumulated as floats. Discrete monthly events (dominion spread, Phase 6) run on
   the last day of a month: `day % 30 === 29`. `advance` processes `state.day` then increments it.
2. Province effects expire when `day >= untilDay`, checked daily.

## Start of game (createGame)
3. Nation ids n0.. in setup order from the shared counter; duplicate nations get numerals in their
   display name (Cinder Horde II), and mapgen numbers duplicate capital names.
4. Starting gold 300 (not in docs). Starting mana 0. Materials pool 0.
5. Capital starts with fort, temple, lab, a garrison commander, and dominion of its own nation at
   strength = pretender dominion score (1..10). Other provinces: no dominion, owner null.
6. Starting army stands in the capital: each listed commander with its squads; formation default:
   squads with a ranged weapon in the middle row, others front; commanders' default scripts per
   docs/04-battle.md (mages Cast, priests Cast, others Hold) are stored as 5 script slots.
7. Starting research: research.points[color] = cumulative points for the starting level
   (levels [0, 60, 150, 300, 500, 750, 1050]); research.color = nation color.
8. explored = [capital]. Independent defender forces are generated in Phase 3, not Phase 2.
9. The game rng is createRng(seed XOR a fixed salt) so it does not replay mapgen's stream.
10. Pretender commander arrives in Phase 6; NationState.pretenderId starts null.

## Scales
11. National scales = pretender scales + one step per Wellspring province the nation OWNS
   (axis and pole from MapProvince.wellspring), clamped to -3..3.
12. A province's effective scale on each axis = round-half-away-from-zero(nationScale * strength / 10)
   of the dominating nation; 0 without dominion. Ritual 'growth' effects add deltaScale to the
   growth axis there (clamped -3..3).
13. Scale effects are per pole per step (content/pretenders/scales.ts). Where docs/01 formulas and the
   docs/05 table disagree, effects from both apply: Turmoil lowers gold 7%/step (the gold formula is
   linear in the order scale), Wild lowers materials 10%/step (core rule), Artifice lowers supply
   10%/step (pretender table).
14. All spatial effects (gold, supply, materials, growth, unrest, build time, temple cost, recruit time)
   use the province's effective scales.

## Gold and upkeep
15. Income per owned, non-besieged province per month = pop/100 * tax * (1 + goldPct) * (1 - unrest/200).
   Easy AI nations get x0.8.
16. Upkeep per month = goldCost/15 per troop and per commander; sacred units half; units without a
   gold cost (summons, garrison, pretender) pay nothing. Charged daily as upkeep/30.
17. Each day: gold += income/30; then if gold >= upkeep/30 it is paid and unpaidDays = 0, else nothing
   is paid and unpaidDays += 1. Troop morale penalty = floor(unpaidDays / 30) (applied in battle, Phase 4).
   This replaces "gold below zero": gold never goes negative from upkeep.

## Materials
18. Province production per month = (terrain base + pop/500) * (1 + materialsPct) + materials effects.
   A fort province collects its own production plus 50% of each adjacent, owned, fortless province's
   (a fortless province next to two forts feeds 50% to each). Besieged provinces produce nothing.
   Pool cap = 6 * the fort's monthly collection. Fortless provinces not next to a fort waste production.

## Supply and starvation
19. Supply per day = (terrain base + pop/50) * max(0, 1 + supplyPct + supply effects), x0.5 if besieged.
20. Consumption per day: troops 1, size >= 3 eats 3, undead or construct eats 0; commanders 1; the
   garrison holder 0. Every commander counts in its `location` province, also while in transit.
   Units of all owners in a province share its supply.
21. Starving (consumption > supply): every consuming unit loses 2% of max HP per day, starvedDays + 1.
   Squad troops die when the HP pool can no longer cover them: count = ceil(hp / unit hp). Commanders
   cannot drop below 1 HP from starvation (commander death and succession belong to Phase 4).
   Morale penalty = min(3, floor(starvedDays / 5)), applied in battle.
22. Fed: units heal 2% of max HP per day (this also heals battle wounds) and starvedDays - 1 (min 0).

## Population
23. Growth per month = pop * (0.002 + popGrowth scale effects); applied daily; pop floor 0.
   Applies to every province including independents.

## Unrest
24. Monthly unrest change = tax-rate unrest (owned only) + order-axis unrestPerMonth - 2 decay
   - 5 per priest (owner's commander with holy > 0) in the province
   + floor(enemy dominion strength / 3) when another nation dominates an owned province
   + Dread: enemyUnrestPerMonth per Dread step of that province's effective sanctity scale when the
     dominating nation is not the owner. Applied daily, clamped 0..100.

## Mana
25. Owner gets per month: 1 per spring of its color; 2 of every color from an owned Wellspring;
   dominion tint floor(strength/3) of the dominator's color when owner == dominator; Rot adds
   tintManaB (1) Black mana per Rot step of the province's growth scale when tint applies.
   Besieged provinces still produce mana (the siege rule lists only gold, materials, recruits).

## Buildings
26. One construction per province at a time; days scaled by (1 + buildTimePct) of the province's
   wild axis, rounded up; completes even if the commander leaves; a 'built' message is posted.
   Starting a construction (cost, validation) is a Phase 3 command; Phase 2 implements progress.

## Module layout
27. selectors.ts computes every rate (province economy, nation economy, effective scales, dominion
   score); tick.ts applies rate/30 per day using the same selectors, so the UI and the sim cannot
   disagree.
