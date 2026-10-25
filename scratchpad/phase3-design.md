# Phase 3 design: commands, movement, recruitment, PD, independents, visibility

Spec: docs/10-milestone-1.md Phase 3 ("commands.ts with validation; movement with transit and
reversal; recruitment queues and garrison; PD; independents generation; visibility. Tests: move
ETA by terrain; recruit consumes pop on completion; command validation rejects foreign units").
Rules: docs/01-core-rules.md sections 6 (orders, movement), 7, 8 (recruitment, PD), 9
(independents), 14 (fog). Commands: docs/06-architecture.md "Commands". Existing state shapes:
src/sim/types.ts. Battles, capture, sieges are Phase 4; research/rituals Phase 5; dominion,
prophet, Wellspring claim Phase 6; AI Phase 7; UI Phase 8.

## Files

- src/sim/commands/types.ts: `Command` union, `CommandResult`.
- src/sim/commands/index.ts: `validateCommand(state, cmd): string | null` and
  `applyCommand(state, cmd): CommandResult` (validate, then apply; a switch on `cmd.type`, no
  casts). One module per group: commands/army.ts (move, reverse, setOrder, setScript,
  setFormation, transferSquad, build), commands/province.ts (recruit, cancelRecruit, buyPd,
  setTax). Each exports `validateX` and `applyX`.
- src/sim/movement.ts: speeds, leg days, Dijkstra path, ETA, daily movement.
- src/sim/recruitment.ts: recruit cost, time, daily queue progress, garrison helper.
- src/sim/pd.ts: PD cost and the PD force a province fields in battle (used by Phase 4).
- src/sim/independents.ts: independent forces at game start; strength words.
- src/sim/visibility.ts: vision sets, explored update, what a nation sees.
- src/content: rules.ts gains MOVEMENT, RECRUITMENT, PD, VISION; new independents.ts with
  terrain pools and strength words.

## Commands

1. Every command carries the issuing `nation: NationId`. applyCommand validates first and
   mutates only if valid. The AI emits the same commands (docs/08).
2. All commands are rejected when the game has a result, or the nation does not exist or is
   eliminated. Ids that do not exist are rejected (not thrown). Counts and levels must be
   integers in range; enums are checked.
3. "Validation rejects commands against units the nation does not own": every commander
   named must have `owner === cmd.nation`; every province named must be owned by it (except
   move paths, which may go anywhere).
4. CommandResult = { ok: true } | { ok: false; error: string } with a human-readable error
   for the UI.
5. Phase 3 command set (docs/06 list minus later phases): move, reverse, setOrder,
   setScript, setFormation, transferSquad, build, recruit, cancelRecruit, buyPd, setTax.
   Later phases add setResearchColor, castRitual, giveMana (5), storm (4), claimWellspring,
   makeProphet (6). setOrder rejects castRitual and claimWellspring until then, and rejects
   move and build (those have their own commands, which need extra arguments).

## Movement

6. Commander map speed = min(own unit mapSpeed, every squad's unit mapSpeed). Speed 0
   (garrison holder, immobile tag) cannot move. A move gives the whole selection one frozen
   `mapSpeed` = the slowest commander's (stored in the order, as Phase 2 decided).
7. Leg days into a province = round(terrain.moveDays * speedFactor), at least 1, with
   speedFactor 1.5 / 1.0 / 0.7 for speed 1 / 2 / 3 (content MOVEMENT). Integer legs keep
   progress, reversal, and ETAs in whole days. Speed 2: plains 4, farmland 4, forest 6, hills
   6, mountains 9, swamp 8, wasteland 5. Speed 3: 3, 3, 4, 4, 6, 6, 4. Speed 1: 6, 6, 9, 9,
   14, 12, 8. (Math.round on x.5 rounds up.)
8. move { nation, commanders: CommanderId[], path: ProvinceId[] }: 1+ distinct commanders,
   all owned, all at the same position (same location, and either none in transit or all in
   the identical transit), all mobile. Path: 1+ existing provinces, the first adjacent to the
   start node, each next adjacent to the previous, length at most the province count. The
   start node is the location, or transit.to for commanders in transit (the current leg
   finishes first; reverse is the way to turn around). Apply: order = { move, path rest,
   mapSpeed }; commanders not in transit start the first leg at once (transit progress 0).
   Replacing an order ends what it was doing (a build in progress continues, per section 7).
9. Daily movement, tick step 2, commanders in state order: progress + 1; at progress >=
   totalDays the commander arrives: location = to, cameFrom = from, transit = null.
   - Arrival in a province its nation does not own (enemy or independent): the move order
     ends there (order idle). Phase 4 puts the battle, capture, or siege at this point.
     A non-move order held during transit (set with setOrder while moving) stays.
   - Otherwise, with a move order: if path is non-empty the next leg starts the same day at
     progress 0 using order.mapSpeed; if empty the order becomes idle.
   - Arrivals are returned grouped by province (in order of first arrival) and then nation,
     for Phase 4 to fight one battle per arriving nation.
10. reverse { nation, commander }: owned, in transit. At progress 0 the transit is cancelled
    (nothing travelled; the commander stays where it is). Otherwise from and to swap,
    progress = totalDays - progress, location = the new from (the invariant location ===
    transit.from), and a move order's remaining path is emptied, so the commander stops
    when it gets back. Single commander per docs/06; the UI sends one per selected commander.
11. Pathfinding: `findPath(state, from, to, mapSpeed)` is Dijkstra over leg days, ties
    broken by province index, returns the provinces to enter (excluding from) or null.
    `etaDays(state, commander)` = days left on the leg + leg days of the remaining path.
    Both are selectors shared by UI and AI.

## Orders

12. setOrder { nation, commander, order } accepts idle, pillage, patrol, research, preach.
    research: the commander has pips, is not in transit, and stands in a province its nation
    owns with a lab. preach: holy > 0. idle, pillage, patrol, preach are allowed in transit
    and take effect on arrival (idle in transit = stop at the end of this leg). Pillage
    without troops is allowed (it does nothing, as Phase 2's selector ignores it). Patrol has
    no effect until Phase 4.
13. setScript { nation, commander, slots }: exactly SCRIPT_SLOTS valid slots; a cast slot's
    spellId must be null until Phase 5 adds spells.
14. setFormation { nation, commander, squad, formation }: the squad belongs to the
    commander; front / middle / rear. Allowed in transit.
15. transferSquad { nation, from, to, squad, count? }: both owned, different, same location,
    neither in transit; count integer 1..squad.count, default all. Leadership: the target's
    troop count after the transfer must not exceed its leadership (troops are counted, not
    weighted by size; the garrison holder leads 10000). Whole squads move as they are; a
    partial transfer splits off a new squad with a proportional share of the HP pool and the
    same formation and starvation counter. (The split keeps count = ceil(hp / unit hp).)
16. build { nation, province, commander, building }: commander owned, not in transit,
    standing in the province; province owned; building buildable (forts are not in M1), not
    already there, no construction under way; gold >= cost. Apply: order = build;
    startConstruction (Phase 2).

## Recruitment

17. recruit { nation, province, unit, count }: province owned, has a fort, not besieged,
    unrest <= 50 (UNREST.recruitBlockAbove); unit is in the nation's troops or commanders
    list; its requirements hold (fort, temple, lab in the province; capital = the nation's
    capital); commanders count exactly 1, troops 1..50; gold >= gold cost (so never with gold
    below zero) and the fort pool >= materials cost. Apply: pay gold and materials now and
    queue { unit, count, nation, daysLeft, paid }.
18. Gold cost = cost.gold * count, times (1 + beastCostPct) for beast-tagged units (Wild:
    -10% per step), from the fort province's scales. Materials cost = cost.materials * count.
19. Recruit days: troops recruitDays * ceil(count / 10); commanders recruitDays; times
    max(0, 1 + recruitTimePct) of the province's scales (Order +5%, Turmoil -10% per step),
    rounded up, at least 1. Fixed when queued. Wild and Artifice "build time" does not apply
    (the pretender table separates "recruit time" from "build time").
20. Daily, tick step 3 (after construction), each fort province with a queue: items whose
    nation is no longer the owner are dropped without refund. Paused while besieged or unrest
    > 50. Otherwise the head item counts down; at 0 it completes if the province has the
    population (popCost * count), else it waits at 0 until it does. Completion: pop -= cost;
    troops become a new squad under the fort's garrison holder (one squad per batch, default
    formation); a commander is created in the province (idle, default script, extra pip
    rolled). A 'recruited' message goes to the owner. At most one item completes per fort per
    day; the next item starts counting the next day.
21. cancelRecruit { nation, province, index }: province owned, index in range. Refunds the
    item's paid gold and materials in full (the pool may end above its cap).
22. The garrison holder is created on demand if a fort province lacks one (keeps the Phase 2
    invariant robust when Phase 4 captures forts).

## Provincial defense

23. buyPd { nation, province, levels }: owned, not besieged, levels integer >= 1, pd + levels
    <= 30, gold >= cost. Raising PD from level L to L+1 costs (L + 1) * 15 gold, so 0 -> 1
    costs 15 and 0 -> 30 costs 6975.
24. pdForce(state, province): the owner nation's militia x 2 * pd and archer x floor(pd / 5)
    (NationDef.pd). Phase 4 fields it in battle. Independents have PD 0; capture sets PD 0
    (Phase 4).
25. setTax { nation, province, rate }: owned province, valid rate. No cooldown (known issue
    for Phase 12).

## Independents

26. createGame gives every non-capital province with independentStrength > 0 one Independent
    Captain (owner null, idle, hold script) with the province's independentStrength troops
    from its terrain pool, split by weight with largest remainders (ties to the earlier
    entry); zero-count squads are left out:
    plains, farmland, wasteland: light infantry 2, archer 1; forest: wolf 2, archer 1; hills:
    heavy infantry; mountains: heavy infantry, plus one giant (counted in the strength) when
    capitalDistance >= 3; swamp: swamp fighter. (docs/01 section 9 lists no pool for
    farmland and wasteland; they use the plains pool.)
27. Strength words for fogged independents, by current independent troop count: weak below
    16, moderate below 24, strong below 30, fortress from 30 (8 + 4d gives 12, 16, 20, 24, 28,
    32 for d 1 to 6; Wellsprings 30).

## Visibility

28. A nation's vision: every owned province and its neighbors, plus every own commander's
    location and the provinces within its sight (1 by default, scouts 2 via
    CommanderTraits.sight). In-transit commanders see from their location.
29. Explored (pop and springs known): owned at any time, or within a scout's sight (a
    commander whose unit has sight). Updated in tick step 6 and once at game start, so the
    starting scout reveals the capital's surroundings.
30. Visible enemy armies: commanders of other nations standing in the vision set, except
    stealthy ones. A commander is stealthy if its unit is stealthy and all its squads'
    units are too (so a scout leading troops is seen).
31. Independents: a strength word everywhere; the exact count where a scout of the nation is
    in or adjacent to the province.
32. Vision and visible armies are selectors computed on demand; only `explored` is stored.
    The AI ignores fog in M1 (docs/08). No 'sighted' messages yet (Phase 8 UI decides).

## Tick order

33. advance: 2. movement (arrivals); 3. construction, then recruitment; 4. economy (Phase 2);
    6. explored update.

## State changes

34. RecruitOrder gains `nation: NationId`. No other GameState shape changes.

## Open questions for later phases (recorded, not decided now)

- Phase 4: an arrival in a hostile province resolves battle / capture / siege; in-transit
  commanders never defend; a reversing commander's location is the province it was heading
  to, so battle and siege code must skip commanders in transit. Capture clears the queue (or
  leaves it for the drop rule above), sets PD 0, creates the new owner's garrison holder.
- Phase 4: do stealthy scouts trigger battles when they enter hostile provinces?
