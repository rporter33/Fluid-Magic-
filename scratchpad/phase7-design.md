# Phase 7 design: the AI (docs/08-ai.md)

Spec: docs/10 Phase 7 ("Per docs/08-ai.md. Replace the dummy AI in the headless runner.
Behavior tests."), acceptance 12 ("AI per docs/08-ai.md passing its behavior tests") and 15
(the runner). docs/08 in full, including the Phase 6 Implementation decisions (the AI
contract, cadence, presets, runner). Related: docs/01 (rules the AI plays by), docs/02
(rituals, carried mana), docs/05 (pretender, prophet), docs/06 (layout, commands, purity),
docs/09 checklist ("Thornwood beats Cinder Horde in roughly half of AI vs AI games"; "a match
against one Normal AI ends by month 70 in most games"), docs/PROGRESS.md known issues that name
Phase 7 (carried mana for Warcry/Pyre Storm/Swarm/Regrowth and giveMana; research must not
replace a castRitual order; no sally, storm when walls are down or a siege cannot progress;
siegeRates; findPathFor; aiMemory only through a command; Godless now reachable: preach at
home; early Wellspring wins: defend and contest Wellsprings).

## Contract (kept from Phase 6)

- An AI player is `(state, nation) => Command[]`; it never mutates state and never draws from
  state.rng; randomness only from `aiRng(state, nation)`. The driver (`src/ai/driver.ts`)
  applies the commands in order after the day's advance on planning days (5 Normal, 10 Easy).
- `aiPlayer` (src/ai/ai.ts) replaces `dummyPlayer` in the runner and as the default player of
  AI nations. The dummy stays in src/ai/dummy.ts as a test opponent (cheap, random) or is
  deleted (decide: keep it; the runner gets `--ai dummy|full`, default full).

## Planning on a scratch copy

- `plan(state, nation)` makes a planning copy: provinces, nations, commanders, provinceEffects
  and rng deep-copied; map shared (static); battles and messages empty. Each step issues
  commands through `issue(cmd)`, which runs validateCommand on the copy and, if valid,
  applyCommand on the copy and records it. Later steps therefore see earlier commands' effects
  (gold spent, troops moved, orders set, queue items added). Because the driver applies the
  same commands in the same order to a state identical to the copy, the AI never has a refused
  command. A refused command on the copy is simply not issued (no logging).
- Cost: one copy per call (~0.3-1 ms on a 4-nation Medium game); measured and kept under
  ~5 ms per call in total.

## Memory

- `NationState.ai.memory = { target: ProvinceId | null, lastPlanDay }` is written only through a
  new command `{ type: 'setAiMemory', nation, target }` (valid only for an AI nation; target
  null or an existing province). The War step uses it to keep one war target until it is taken,
  becomes unreachable, or the war odds fail; the driver's log replays it like any command.
  `lastPlanDay` is set by the same command (the day it is issued). docs/06 decisions record it.

## Numbers

All AI numbers live in `src/content/ai.ts` as `AI` (thresholds, batch sizes, ratios, PD levels,
gold reserves, power formula weights), not in src/ai code: tax gold < 50 and unrest < 20; PD 5
next to independents of strength > 20 or enemies, 10 next to enemy nations; lab at gold > 500
in the second-best province; temples at pop > 8000 when gold > 300; one build at a time;
leaders 2 + provinces / 6; melee:ranged 2:1; batches 10-20; mages 1 per 4 provinces, min 2;
priests 1 per 5 provinces; scouts 1; field army 15 troops; expansion 1.5x; war 1.2x; capital
garrison 20 after month 6; rituals at 2x cost; fighter pretender joins after month 3. Numbers
the docs leave out get values here and in docs/09: gold reserve kept for recruitment before
PD and buildings (e.g. 150); PD bought one level per province per call.

## Power

- `troopPower(unit) = (hp + att + def + prot) / 4 * (1 + 0.1 * hasRanged)` from content stats
  (docs/08 formula). `armyPower(commander)` sums its squads (count * troopPower, scaled by
  hp / maxHp for wounds); commanders themselves count as one troop of their unit.
- `defenderPower(province)`: independents standing there (known exactly: no fog for the AI in
  M1), plus the owner's commanders there, garrison troops, and PD force (`pdForce`), all by the
  same formula. A fort with walls standing doubles it while the walls hold (siege: the AI
  besieges and storms instead; see War).
- `threat(province)`: enemy armies within 1 hop (their armyPower), for Defense.

## Steps (docs/08 order), each through `issue`

1. Economy
   - Tax: Normal everywhere; High in the capital while gold < 50 and the capital's unrest < 20.
   - PD: only with gold above the recruitment reserve; one level per province per call, first
     in provinces adjacent to an enemy nation's province (target 10), then those adjacent to
     an independent of strength > 20 or an enemy (target 5); never in the capital beyond its
     target (it has walls and a garrison).
   - Build (one construction at a time nation-wide): a Lab in the owned non-capital province
     with the most population once gold > 500 and the nation has only the capital's lab; else
     a Temple in each owned province with pop > 8000 when gold > 300. The builder is an idle
     own non-garrison commander standing there; if none, the nearest idle priest (else scout)
     is sent there (findPathFor) and builds on a later call.
2. Recruitment (capital queue kept 1-2 items deep; one or more items per call while the queue
   has room and gold and materials allow; cheaper fallbacks when materials are short so the
   queue does not stay empty with gold > 200)
   - Leader (the nation's first commander with leadership >= 60) while field leaders < 2 +
     provinces / 6.
   - Mages: 1 per 4 provinces, minimum 2 (Ember Adept; Cinder Magus / Elder Druid, the adept
     tier, when gold allows it after the reserve). Priests: 1 per 5 provinces (requires
     temple). Scouts: 1, replaced if lost.
   - Troops: keep melee:ranged 2:1 by troop count over the nation's field troops plus the
     queue; batch of 20 when affordable, else 10 (else the most it can afford >= 5). Unit
     choice within melee and ranged: weighted by personality (aggression favors stronger and
     costlier units, pillage favors mounted/fast units) and affordability in gold and
     materials; ties by aiRng.
   - Recruited troops land in the garrison; the AI moves them to field leaders in the capital
     (transferSquad with counts up to leadership), keeping AI.capitalGarrison (20) in the
     garrison after month 6.
3. Research: research color = the nation's color (always on). Mages that lead no troops and
   are idle get Research (they stand in the capital lab). A mage with a castRitual order is
   never given another order (the paid mana would be lost). The Oracle pretender researches.
4. Expansion: for each idle field army (leader with >= 15 troops), score each adjacent
   independent province `(pop / 1000 + springs * 3 + wellspring * 10) / defenderPower` and move
   into the best if armyPower > 1.5 * defenderPower. If none adjacent qualifies, march toward
   the best qualifying independent province within reach (findPathFor over friendly land; the
   last step may be hostile). Personality `expansion` scales how far it looks (hops).
5. Defense: for each owned province with a visible-or-known enemy threat greater than its local
   defense (defenderPower), the nearest idle field army within 3 hops moves there; else, if
   gold allows, buy PD there. The capital keeps >= 20 garrison troops after month 6: transfers
   never take it below, and if it is below, recruitment favors cheap troops that stay home.
6. War (skipped before DIFFICULTIES.warFromMonth): enemy power nearby = sum of enemy armies
   within 2 hops of own provinces plus defenders of border enemy provinces. When aggression *
   ownFieldPower > 1.2 * enemyPowerNearby and a border enemy province is reachable, pick a
   target (memory first, else the best of: enemy capital if its defenders are weak, Wellspring
   provinces, high pop) and send armies (combining two if one alone is short of 1.2x the
   target's defenders). At an enemy fort: besiege; storm when the walls are down
   (stormState/wallsDown) or when siegeRates show the walls will never fall and the army has
   1.5x the defenders.
7. Pillage: an army standing in an enemy province its nation cannot hold (enemy power within 1
   hop > own army) takes the Pillage order with probability `pillage` personality (aiRng);
   Thornwood's 0.1 makes it rare, Cinder Horde's 0.6 common.
8. Rituals: for each mage in an own lab, cast the cheapest useful ritual whose total cost is
   <= half the matching mana: summons (Call of the Wild, Call Fire Sprites, Call Salamander,
   Treant) when at war; Fertile Season / Bounty of the Loam on the best own province at peace;
   Burn the Fields / Ash Rain on an enemy province adjacent to a war front. Targets from
   ritualTargets (the shared castBlocker from the Phase 5 review keeps it in line with the
   command). Before a mage joins an army, give it the carried mana its battle spells need
   (giveMana in the capital lab).
9. Wellsprings: when the nation owns an unclaimed Wellspring and a priest is free, send the
   priest there (findPathFor) and claim on arrival; an escort army goes along if enemy armies
   are within 2 hops. A priest standing in an owned unclaimed Wellspring claims at once.
   Priests otherwise preach at home; when the capital's dominion is threatened (enemy dominion
   in the capital or its neighbors) they preach in the capital (Godless prevention).
10. Pretender: a fighter chassis (Titan, Great Wyrm, Ash Colossus, Wild Spirit) joins the main
    army after month 3 (moves with it, or troops are transferred to it as a leader); the Oracle
    researches; the Living Monolith casts rituals in the capital. Prophet: name the first
    priest prophet when allowed (one more dominion check; holy 3).

## Scripts

Default scripts already match docs/08 (mages cast the best castable spell, damage first
against 10+ enemies; priests Bless; leaders Hold). The AI sets no scripts in M1 except giving a
new prophet a caster script.

## Tests (tests/ai/*.test.ts)

- docs/08 required behavior, over 20 runner seeds (Cinder Horde vs Thornwood, Medium, Normal):
  each AI nation owns >= 8 provinces at month 12 in >= 80% of games (per nation); no AI
  nation's capital queue stays empty more than 60 consecutive days while its gold > 200; no AI
  capital has 0 garrison troops on any day after month 6.
- Contract: no refusals in the runner; never mutates state or touches state.rng; deterministic;
  replayLog reproduces the hash.
- Step unit tests on fixtures: tax, PD budget, build site and builder, recruitment mix and
  fallbacks, garrison reserve, research and the castRitual guard, expansion scoring and the
  1.5x rule, defense response, war odds and target memory through setAiMemory, storming
  when walls are down, pillage probability, ritual choice and giveMana, Wellspring priests,
  pretender roles, Easy's war delay and cadence.
- Runner statistics recorded in PROGRESS (not asserted): win split by nation, reasons, mean
  months; the checklist targets are Phase 12's.

## Layout

src/ai/ai.ts (aiPlayer, step order), plan.ts (planning copy, issue), assess.ts (power, threat,
defenderPower, border maps), economy.ts, recruit.ts, research.ts, expansion.ts, military.ts
(defense, war, sieges, pillage), magic.ts (rituals, giveMana), faith.ts (Wellsprings, priests,
prophet, pretender). content/ai.ts gains AI numbers. Commands: setAiMemory.
