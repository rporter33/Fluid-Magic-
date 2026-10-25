# Phase 2 decisions as implemented

Where the docs are silent or conflict, Phase 2 does the following. Numbers live in src/content
(rules.ts, pretenders/scales.ts, colors.ts, units, nations, buildings, ai.ts).

## Time
1. Monthly rates (gold, materials, mana, growth, unrest) apply every day as rate / 30. `advance`
   processes `state.day`, then increments it. Rates for a day come from one snapshot taken at the
   start of step 4. Province effects with `untilDay <= day` are dropped at the start of step 4.

## Start of game
2. Nation ids n0.. in setup order (all nations are created before any commander). Duplicate nations
   get numerals in their names and distinct banners: the k-th nation of a primary color takes
   NATION_BANNERS[color][k].
3. Starting gold 300, mana 0, materials 0. Capital: fort, temple, lab, a garrison holder, and
   dominion of its own nation at the pretender's dominion score.
4. Starting army in the capital; squads with a ranged weapon stand in the middle row, others front;
   mages and priests get 5 'cast best spell' slots ({kind:'cast', spellId:null}), others 'hold'.
5. research.points[color] = cumulative points of the starting level; explored = [capital].
6. Game rng = createRng(seed XOR 0x5f3759df), apart from mapgen's createRng(seed).
7. Independent defender forces arrive in Phase 3; the pretender commander in Phase 6.

## Scales
8. National scales = pretender scales + one step per Wellspring province the nation owns, clamped.
9. Province scale = round-half-away-from-zero(national * strength / 10) of the dominating nation,
   plus ritual growth effects, clamped; 0 without dominion. Never -0.
10. Effects per pole per step; formula effects apply both ways (Turmoil -7% gold, Wild -10%
    materials, Artifice -10% supply). All spatial effects use the province's scales.

## Gold and upkeep
11. Province gold per month = pop/100 * tax * (1 + goldPct) * (1 - unrest/200), owned and not
    besieged; easy AI nations x0.8.
12. Upkeep per month = goldCost/15 per troop and commander, sacred half, no cost no upkeep.
13. Each day: gold += income/30; pay max(0, min(gold, upkeep/30)). A fully paid day lowers
    unpaidDays by 1 (not below 0); a short day adds the unpaid fraction, capped at 119. Morale
    penalty = min(3, floor(unpaidDays/30)), applied in battle (Phase 4). Gold is never driven
    below zero by upkeep.

## Materials
14. Province production per month = (terrain base + pop/500) * max(0, 1 + materialsPct) + ritual
    materials; none while besieged. A fort collects its own plus 50% of each adjacent, owned,
    fortless province. Pool cap = 6 months of collection; the cap only stops growth, a pool
    above it keeps what it has.

## Supply
15. Supply per day = (terrain base + pop/50) * max(0, 1 + supplyPct + ritual supply), halved under
    siege. Consumption: troops 1, size >= 3 eats 3, undead/construct 0; commanders 1; garrison 0.
    Commanders count where `location` is (also in transit). Independents (owner null) never eat
    and are always fed.
16. Starving (used > supply): eaters lose 2% of max HP a day; squad count = ceil(hp / unit hp);
    commanders stop at 1 HP; starvedDays + 1, capped at 19. Fed: heal 2% of max a day (battle
    wounds too), starvedDays - 1. Morale penalty = min(3, floor(starvedDays/5)). One message per
    nation when its units begin starving in a province.
    Known conflict: at pop/50 Hills supply is 100-160, so the docs/09 checklist item about armies
    over 60 starving in Hills cannot pass; Phase 12 decides.

## Population, unrest, mana, pillage
17. Growth per month = pop * (0.002 + popGrowth effects), all provinces; pop floor 0.
18. Unrest per month = order-axis effect - 2 decay; for owned provinces also tax unrest, -5 per
    priest of the owner present (not in transit), and when another nation dominates: + floor(enemy
    strength/3) + Dread enemyUnrestPerMonth. Clamped 0..100.
19. Mana per month to the owner: 1 per spring; 2 of every color from a Wellspring province; tint
    floor(strength/3) of the owner's primary color when the owner dominates, plus Rot tintManaB
    Black. Sieges do not stop mana.
20. Pillage: each day, each province with a commander that has troops, is not in transit, and holds
    the pillage order loses 2% of pop; the first pillaging nation in nation order gets 1 gold per
    20 lost; unrest +5. Applied after gold accrual, before growth. Patrol has no economic effect
    (Phase 3/4).

## Buildings
21. One construction per province; days = ceil(days * max(0, 1 + buildTimePct)), min 1; temple
    cost scaled by templeCostPct; completes even if the builder leaves; abandoned if the owner
    changes; the builder returns to idle if it still holds that build order.

## State shape
22. Ritual progress lives in the castRitual order (no activeRituals). Prophet and pretender identity
    only in NationState ids. BattleRecord has a starting roster. Move orders store the group's
    frozen map speed. Messages are capped at 300 per nation.
