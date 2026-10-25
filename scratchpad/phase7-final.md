# Phase 7 final design: the AI (docs/08-ai.md)

This replaces scratchpad/phase7-design.md. It folds in the design review (39 issues, two
judges; rulings in scratchpad/p7-rulings.txt, referenced as #n). Where the judges differed,
the choice made is stated.

## Contract and entry point

- `runAi(state, nation): Command[]` in src/ai/ai.ts (docs/06/08 name). It is a `Player` for
  src/ai/driver.ts playDay. It never mutates state and never draws from state.rng; randomness
  only from src/ai/rng.ts. The dummy (src/ai/dummy.ts, tests/ai/dummy.test.ts) is deleted
  (#36); aiRng and contract tests move to tests/ai/ai.test.ts against runAi. The runner and
  match tests use runAi. No --ai flag.
- The AI reads every commander and province (no fog for the AI in M1; no visionOf) (#38).
- No aiMemory writes, no setAiMemory command (#33). aiMemory stays at its initial value;
  docs/08 decisions record that M1 derives the war target from orders and sieges (closes the
  PROGRESS item).

## Planning copy (#32)

- `planningCopy(state) = { ...state, provinces, nations, commanders each JSON round-tripped }`;
  map, rng, provinceEffects, battles, messages, result are shared by reference; nextId and day
  carry over. Steps receive only the copy. `issue(cmd)`: `if (applyCommand(copy, cmd).ok)
  out.push(cmd)`. Commands that create things (recruit ids, split squads) get the same ids on
  the copy as on the real state because nextId carries over and the real state receives the
  same commands in the same order. The contract test asserts stateHash(state) and state.rng
  are unchanged after every call (shared references would reveal any helper that writes them).

## Paths (#31)

- `pathsFrom(state, commanders)` in src/sim/movement.ts: findPath's Dijkstra without the early
  exit, same lowest-index ties, same stop-at-first-hostile rule, hostileProvinces built once;
  returns `{ days(province): number | undefined, pathTo(province): ProvinceId[] | null }`.
  findPathFor is reimplemented on it (its tests pin the equivalence). The AI caches one
  pathsFrom per group per call. No hop caps anywhere. scripts/aivai.ts prints AI ms per call;
  the number goes to PROGRESS (no timing assertion).

## Roles (#2, #24, #25) — derived from content, no unit names in src/ai

One helper `roleOf(state, commander)` in src/ai/roles.ts:
1. pretender: nation.pretenderId (role from its body, below);
2. garrison: isGarrisonHolder (never acts);
3. summoned: unit cost null (Treant, Salamander): an attached fighter, never a leader, mage or
   researcher (judge 1's choice: it rides with armies; it does not take troops or count toward
   the leader quota);
4. priest: a recruitable commander whose unit requires 'temple' (a prophet stays a priest);
5. mage: a recruitable commander whose unit requires 'lab'; the adept tier also requires
   'capital';
6. scout: a recruitable stealthy commander;
7. leader: a recruitable commander with no pips, holy 0, not stealthy, leadership >=
   AI.leaderLeadership (60).
Every count and every step's selection uses roles only. Unit choice for recruitment uses the
nation's `commanders`/`troops` lists filtered by role and requirements.

Pretender role from its body (#25): research allowed (Oracle) -> researches in the capital lab;
cannot move (Monolith) -> casts rituals in the capital; stealthy (Wild Spirit) -> stays in the
capital, not a fighter; otherwise a fighter that stays in the capital until day
AI.pretenderJoinDay (90) and then rides with the strongest group leaving its province. The
pretender never leads troops (left out of transfers and the leader count).

## Groups and free armies (#3, #25, #35)

- A group = a leader (or a lone summoned/pretender fighter acting as one only for Return) plus
  the own attached commanders standing with it idle and not in transit: the fighter pretender,
  summoned commanders, and at most AI.battleMagesPerArmy (1) battle mage. Attached commanders
  join the strongest group leaving the province they stand in. Every move lists the whole
  group (one pace); armyPower counts exactly the commanders in the move.
- Free field army: a group whose leader is idle (or pillage/patrol), not in transit, leads >=
  AI.fieldArmyTroops (15), not besieging (stands where siege.attacker is its nation), not
  escorting (stands in an owned unclaimed Wellspring with an own priest walking there or
  claiming), and not yet assigned this call. Defense may also take escorts and moving groups
  whose current leg does not end in a hostile province (re-pathed from the leg's end) (#5).
- Combining (#35): only groups standing in the same province, in one move command.
- Order guard (#24): no step gives any order or move to a commander whose order is castRitual,
  claimWellspring or build.

## Power (#12)

- troopPower(unit) = (hp + att + def + prot) / 4 * (1 + AI.rangedBonus (0.1) * hasRanged), from
  content stats. armyPower(group) = sum over squads of count * troopPower scaled by hp/maxHp,
  plus each commander as one troop of its unit; hidden (stealthy-only) commanders count 0.
- defenderPower(province): independents there, the owner's commanders there, garrison troops,
  PD force (pdForce), same formula; walls not doubled anywhere. Score divisions use
  max(defenderPower, 1).
- "Independent with strength > 20" compares independentCount against AI.independentStrength.

## Step order per call (#22, judge 1's order)

1. Economy (tax, PD, build) — `economy.ts`
2. Recruitment and transfers — `recruit.ts`
3. Research (researchers, castRitual guard) — `economy.ts` or `ai.ts`
4. Priests: Godless defense, Wellspring walks and claims, prophet — `faith.ts`
5. Army pass (one assignment per group per call) — `military.ts`:
   a. relief of own besieged forts (#19); b. own sieges: storm or hold, pillage draw (#23, #4);
   c. claim escorts (#8); d. Defense: capital, then owned Wellsprings, then others by index
   (#5); e. War with Wellspring denial first (#8, #33); f. Expansion (#15); g. Return home (#0).
6. Rituals and giveMana — `magic.ts`
7. Pretender roles (non-fighter) — `faith.ts` or `ai.ts`
docs/08 decisions record that its numbered list is the AI's duties, and that armies are
assigned in this priority order.

## 1. Economy

- Tax: Normal everywhere; High in the capital while gold < AI.taxHighBelowGold (50) and the
  capital's unrest < AI.taxHighMaxUnrest (20) (issue setTax only on change).
- PD (only with gold above AI.goldReserve kept for recruitment; one level per province per
  call): provinces adjacent to an enemy nation's province up to AI.pd.enemy (10), then owned
  Wellsprings up to AI.wellspringPd (10) (#8), then provinces adjacent to an independent with
  independentCount > AI.independentStrength (20) or to an enemy up to AI.pd.border (5).
- Build (one construction at a time nation-wide; the builder is the scout only, walking there
  with findPathFor if elsewhere; with no scout the build waits) (#3): a Lab in the owned
  non-capital province with the most population once gold > AI.labGold (500) and the nation
  has only the capital's lab; else a Temple in each owned province with pop > AI.templePop
  (8000) when gold > AI.templeGold (300).

## 2. Recruitment and transfers (#1, #11, #12)

- Capital queue kept 1 to 2 items deep (AI.queueMin/Max).
- Quotas (floor): leaders 2 + floor(provinces / 6); mages max(2, floor(provinces / 4)), the adept
  tier when affordable after the reserve; priests floor(provinces / 5) (temple required);
  scouts 1, replaced if lost.
- Troops: melee:ranged AI.meleeRangedRatio (2) by troop count over field troops plus the
  garrison plus the queue; batch AI.batch.large (20) when affordable, else AI.batch.small
  (10), never fewer; when 10 of the wanted troop cannot be paid in gold or fort materials,
  fall back to the cheapest troop at 10, then to a wanted commander. Unit choice among
  affordable units by weightedIndex on aiRng with weight = 1 + aggression * (gold cost /
  highest troop gold cost of the nation) + pillage * (fast ? 1 : 0), fast = mapSpeed above the
  nation's lowest troop speed (#34).
- Transfers: garrison troops above AI.capitalGarrison (20) go to leaders standing in the capital,
  up to each leader's leadership; the reserve holds from day 0 (#1).
- A mage that leads troops and stands with its nation's garrison holder gives every squad to
  the holder (summons flow to leaders like recruits) (#7).

## 3. Research (#6)

- Research color = the nation's color. Researchers = ceil(mages * research personality), oldest
  first by commander id; they stand in the capital lab with Research (or castRitual). The other
  mages are battle mages. A castRitual order is never replaced.

## 4. Priests (#10, #8, judge 2's Godless rule)

- Godless danger: the nation owns no temple province (capital included) whose dominion is its
  own at strength >= AI.godlessAlarm (2). In danger, every priest whose order is idle or
  preach, and the prophet, walk to the capital (unless besieged) and preach there.
- Otherwise priests claim: a priest standing in an owned unclaimed Wellspring claims; else free
  priests walk to the nearest owned unclaimed Wellspring (one priest per Wellspring); else
  preach in the capital.
- Prophet: name the oldest priest prophet when allowed (one more check, holy 3); it is a priest.

## 5. Army pass

a. Relief (#19, judge 1's plus the shared sally): any siege of an own fort, whatever the
   besiegers' strength. (1) The nearest free group of any troop count whose armyPower >=
   AI.reliefRatio (1.2) * besiegers' armyPower moves to the fort (findPathFor; a group inside the
   fort uses [an owned neighbor without enemy armies, the fort]). (2) Else groups standing
   together combine. (3) Else the others walk to the gather point (the fort's owned non-hostile
   neighbor nearest by path days to the strongest such group, ties by index) and enter as one
   group once together they qualify. While the capital is besieged, Return sends groups to the
   gather point.
b. Sieges this nation holds (#23, #4): storm when the fort has no defenders, or the walls are
   down (wallsDown) and besiegers' armyPower (every own commander there, any order) >=
   AI.stormRatio (1.3) * defenders' power; otherwise hold (held from other steps). Pillage:
   each (besieging leader, province) pair draws once from a keyed rng (seed, slot, commander
   id, province id; src/ai/rng.ts), with probability = pillage personality; a winning draw
   sets Pillage (issued only on change); the siege still counts it; any later move ends it.
   Pillage happens nowhere else (docs/08 decision: in M1 a won province is captured at once,
   so "provinces it cannot hold" are enemy forts it besieges).
c. Escorts (#8, judge 1): while an own priest walks to or claims an owned Wellspring, one free
   army stands there and is held: an army already there first, else the nearest free army is
   sent; with no free army the priest goes alone.
d. Defense (#5, judge 2): capital, then owned Wellsprings, then other owned provinces by
   index. Threat = summed armyPower of other nations' non-hidden groups within AI.threatHops (1).
   Local defense = PD force + garrison + own groups standing there or assigned there this call.
   While threat > local defense, assign the nearest group by path days (free armies, escorts,
   or moving groups whose leg does not end in a hostile province) whose power plus the local
   defense exceeds the threat; a group already there that covers it stays (counts as
   assigned). Else buy one PD level there when gold allows.
e. War (#8, #33, judge 2's target order; skipped before DIFFICULTIES.warFromMonth): target
   order: (1) a province this nation besieges (reinforce); (2) Wellspring denial: when an enemy
   nation's claimed plus owned-unclaimed Wellsprings reach wellspringsToWin, its owned
   Wellspring provinces (claim under way first, then unclaimed, then claimed, then by index),
   ignoring the aggression gate; if none is reachable, the first hostile province on the
   shortest adjacency route toward it; (3) the last province of an own group's move path if an
   enemy nation owns it; (4) a new target, only when aggression * ownFieldPower > AI.warRatio
   (1.2) * enemyPowerNearby (enemy groups within AI.warHops (2) of own provinces plus defenders
   of border enemy provinces): the best reachable enemy province by (pop, Wellspring, enemy
   capital when its defenders are weak). Groups go when their power (combined only when
   standing together) >= AI.warRatio * the target's defenders.
f. Expansion (#15): candidates = every independent province pathsFrom reaches from the group
   (the last step hostile), score = (pop / AI.score.popPer + springs * AI.score.spring +
   wellspring * AI.score.wellspring) / max(defenderPower, 1) / (1 + AI.distancePenalty * (1 -
   expansion) * pathDays); move to the best where armyPower > AI.expansionRatio (1.5) *
   defenderPower, skipping provinces an own move already ends at.
g. Return (#0, judge 2): every leader-led group outside the capital, idle, not in transit, not
   besieging, not escorting, and not assigned this call, walks home (to the gather point while
   the capital is besieged); battle mages and the fighter pretender left without a leader walk
   home too. In the capital, transfers fill leaders.

## 6. Rituals and carried mana (#7, #28, #6)

- Only researchers (and the Monolith pretender) cast rituals, standing in the capital lab. Cast
  the cheapest useful ritual whose total cost <= half of the mana it would use
  (AI.ritualCostFactor 2): at war (an enemy nation's province or group adjacent to an own
  province): summons (callFireSprites, callOfTheWild, bindSalamander, awakenTreant); at peace:
  Forge of Cinders on the capital, Bounty of the Loam on the capital when not active there,
  Fertile Season on the best own province; at war also Burn the Fields / Ash Rain on an enemy
  province adjacent to a war front, never where own squads stand. Targets from ritualTargets
  (castBlocker keeps them valid).
- Battle mages standing in an own lab province get giveMana, per color their known battle spells
  need as carried mana, up to AI.carriedMana (2) carried in total, without taking the pool
  below half.

## Numbers (#34): src/content/ai.ts `AI`, each with a docs/09 row

leaderLeadership 60, batch {large 20, small 10}, queue {min 1, max 2}, provincesPerLeader 6,
baseLeaders 2, provincesPerMage 4, minMages 2, provincesPerPriest 5, scouts 1, meleeRangedRatio 2,
fieldArmyTroops 15, expansionRatio 1.5, warRatio 1.2, reliefRatio 1.2, stormRatio 1.3,
capitalGarrison 20, threatHops 1, warHops 2, independentStrength 20, rangedBonus 0.1, score
{popPer 1000, spring 3, wellspring 10}, distancePenalty (tuned; start 0.05), pd {border 5,
enemy 10}, wellspringPd 10, goldReserve (start 150), labGold 500, templeGold 300, templePop 8000,
taxHighBelowGold 50, taxHighMaxUnrest 20, ritualCostFactor 2, pretenderJoinDay 90,
battleMagesPerArmy 1, carriedMana 2, godlessAlarm 2. src/ai has no game-number literals.

## Tests (#17, #9, #37)

- tests/ai/behavior.test.ts: one beforeAll drives playDay with runAi over runnerSetup(1, 0..19)
  to day 720 or the game's end, recording per day and nation: capital owned, eliminated, queue
  length, gold, capital garrison troops, recruitBlock(capital), refusals; provinces at day 360.
  (a) >= 8 provinces at day 360 in >= 16 of 20 games per nation (eliminated by then = fail);
  (b) the empty-queue run never exceeds 60 days, counting only days with the capital owned,
  not eliminated, queue empty, gold > 200 and recruitBlock null (any other day resets);
  (c) garrison troops > 0 every day >= 180 while the capital is owned; (d) zero refusals.
  Explicit timeout ~120 s. Horizon recorded in docs/08 decisions.
- tests/ai/ai.test.ts: contract (no mutation, rng untouched, deterministic, commands valid in
  order, aiRng properties, keyed rng); planning copy ids match the real application.
- Step tests on fixtures (one file per module): tax; PD budget order; build site and scout;
  recruitment mix, batches and fallbacks, quotas with floor; reserve from day 0 and transfers;
  summons handed to the garrison; researchers split and castRitual guard; Godless danger and
  priest moves; Wellspring claims, one priest per spring, escort; relief of a lone besieger
  within bounded days; strong besieger gathers; storm odds (not at half strength, yes with a
  second army, empty fort at once); pillage draw stable per pair and matching the personality
  over many pairs; defense picks the nearest covering group; War odds gate, Wellspring denial
  bypassing the gate but not warFromMonth; expansion scoring and the 1.5x rule; return home
  refill and leave again; groups move together with the pretender and one battle mage;
  battle mage giveMana and casting a carried-mana spell; ritual choice at war and peace; Easy
  cadence and war delay; pathsFrom equals findPathFor for every target.
- Runner statistics recorded in PROGRESS (not asserted): win split, reasons, mean months, AI ms
  per call; the docs/09 checklist targets are Phase 12's.

## Layout and docs

src/ai/ai.ts (runAi, step order), plan.ts (planningCopy, issue), roles.ts, assess.ts (power,
threat, defenderPower, border maps), economy.ts (tax, PD, build, research), recruit.ts,
military.ts (army pass), faith.ts (priests, Wellsprings, prophet, Godless, pretender roles),
magic.ts (rituals, giveMana), rng.ts (+ keyed rng), driver.ts, match.ts. Delete dummy.ts. sim:
movement.ts pathsFrom. content: ai.ts AI. docs/06 layout and decisions, docs/08 decisions (every
reading above), docs/09 rows (every AI number), PROGRESS (Phase 7 section, closes the AI items),
README. Runner prints AI ms per call.
