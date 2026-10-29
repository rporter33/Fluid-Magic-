# Battle Resolver

The resolver is a pure function:

    resolveBattle(setup: BattleSetup, rng: Rng, opts?: { detail?: DetailEvent[] }): BattleResult

`BattleSetup` contains both sides (attacker and defender), each a list of commanders with
their squads, scripts, and carried mana, plus the province terrain, the fort state, and
the province scales. `BattleResult` contains survivors per side (squad counts, commander
HP), the winner, the round count, and a `replay: BattleEvent[]` log sufficient to render
the fight. The optional `detail` array, when given, receives one event per blow, spell hit,
burn, drain, and morale roll; it never changes the result (see "Replay detail").

## Formation grid

- The battlefield is abstract: each side has three **rows** (front, middle, rear) and
  the two sides face each other. There are no columns in M1; a row is a bag of squads.
- Each squad has a `formation: front | middle | rear` chosen by the player on the
  commander panel. Defaults: melee front, ranged middle, mages and commanders rear.
- **Reach** between rows: front vs front engage at round `closingRounds`. Ranged squads
  in middle or rear fire at the enemy front row first, then middle, then rear, if the
  target row has units (range determines how deep they can hit: range ≥ 5 reaches rear).
- Melee squads advance when their target row is empty: after the enemy front row is
  destroyed or routed, the middle row becomes the "front" and so on.

## Closing

Round 1 is a closing round. Units with mapSpeed 3 or the flying tag engage in melee in
round 2. Speed 2 engages in round 3. Speed 1 engages in round 4. Ranged fire and spells
happen from round 1. This gives archers 1 to 3 free volleys and makes fast units matter.

## Round structure

For each round r = 1..75:

1. **Spellcasting.** For each caster (either side, alternating attacker/defender per
   caster index) with fatigue < 100: pick the next spell in its script (5 slots, then
   repeat the last slot, then default). Check requirements (pips, research, carried
   mana). Resolve the effect. Add fatigue.
2. **Ranged fire.** Every ranged squad with ammo > 0 and a target row in range fires.
   Each troop rolls: hit if `prec + DRN ≥ 10 + DRN` (DRN is 2d6 open-ended); damage as
   melee below. Ammo −1. Ranged squads already in melee contact do not fire.
3. **Melee.** Every engaged squad attacks: each troop makes one attack per weapon against
   a random troop in the engaged enemy row. Hit if `att + DRN > def + DRN`. Damage
   `str + weaponDmg + DRN − prot − DRN`, minimum 0 (armor piercing halves prot, armor
   negating ignores it). Shield: if the defender's unit has a shield, a hit is first
   rolled against `def + shieldBonus`; a shield block reduces damage by the shield's
   value. Keep: shield is folded into def in M1, as the unit tables already do.
4. **Morale.** Every squad that took casualties this round checks morale when losses since
   battle start exceed 20% or losses this round exceed 10%: squad routs if
   `mor + DRN < 10 + DRN + routPressure`, where `routPressure` = 2 if the side has lost
   more than 50% of its starting troops, else 0. Units with mor 50 never check. Berserk
   units never check. A routed squad leaves the battle next round (it can be shot during
   the exit round). A commander whose squads all rout checks morale too; a routing
   commander takes its remaining squads with it.
5. **End of round.** Fatigue −5 for all casters. Regeneration. Round-limited effects tick.
   Round 50: attacker retreats (all attacker squads rout and leave safely).
   Round 75: battle ends, both sides retreat.

Battle ends when one side has no active (non-routed, non-dead) troops and no active
commanders, or at the round limits. The side with active units wins. The attacker wins
ties at the round limit only if the defender has no active units.

## Dice

DRN: roll 1d6 twice; each die that shows 6 is rerolled and the new value added, repeatedly
(open ended). Expected value ≈ 8.4. All contested rolls use DRN on both sides.

## Commanders in battle

- Commanders are single units in their chosen row. They attack like troops if engaged.
- A commander at 0 HP dies. Its squads check morale immediately with routPressure +4.
- A mage with the `Cast` script casts; a commander with `Attack` script fights in front;
  `Hold` stays in its row and attacks only if engaged. Defaults: mages Cast, priests
  Cast (priests have a built-in holy spell: Bless, +1 morale friendly squad), others Hold.

**Phase 9b (proposed, `docs/design/three-kingdoms.md` 3.2 and 3.3; built only after Phase 9 and
gated on its playtest):**

- **Capture.** A commander at 0 HP in a battle its side *loses* is captured by the winner
  instead of dying, with probability `BATTLE.captureBase` (0.6) plus `0.02` per point of the
  winning side's best Valor, minus `0.2` for Wanderer, rolled once per downed commander after
  `battleEnd` on the battle's rng. In a battle its side wins, or that ends undecided, 0 HP is
  death as before. Pretenders are never captured: a downed pretender dies (or reforms) as today.
  A losing commander that has nowhere to retreat to (no friendly adjacent province: the case
  `conflict.ts` kills today, which covers everyone inside a stormed fort that falls and every
  Independent commander) is captured on the same roll instead of dying; an immobile pretender
  still dies. A losing commander with a retreat open is never captured unless downed. A held
  Independent Captain is a prisoner like any other and can be recruited. Inside the battle
  nothing changes: the downed commander's squads still check morale at routPressure +4 and go
  to the heir after the battle; the capture is a post-battle outcome written where deaths are
  (`battle/apply.ts`), and the replay's `death` event becomes `down(commander)` followed by
  `captured(commander, by)` or `death(commander)` once the winner is known.
- **Duels.** Before round 1, after battle-start abilities, if either side has an active commander
  with the Duelist trait and the other side has an active commander not scripted Retreat, the
  two highest-Valor eligible commanders fight a duel (eligible: commanders with officer stats,
  so recruitable commanders and Independent Captains; never a pretender, a summoned body or a
  garrison holder): alternating single melee attacks with the
  normal attack, damage and shield rules, no squads, no spells, until one is at or below half
  HP or 10 exchanges have passed (then no result). The loser's side takes a `moraleShock` of
  −2 for the battle, the winner gains a rank step, and the loser keeps the wounds into the
  battle proper. A commander that loses a duel and whose side then loses the battle is captured
  at `captureBase + 0.2`. The duel is scripted by nobody and refused by nobody: it fires, as in
  RTK XIV. One duel per battle.

## Scripts

Each commander has 5 script slots, each `Cast(spellId) | Attack | Hold | Retreat`. After
slot 5 the commander repeats slot 5 unless it is Retreat; then it takes its default action
(see "Commanders in battle"). If a Cast slot cannot be cast
(fatigue, no valid target), the AI caster picks the best castable spell by a simple
heuristic: damage spells when enemies ≥ 10 troops, buffs otherwise.

## Province modifiers

- Terrain defense bonuses apply to the defender (see core rules). Thornwood gets +1 def
  in forests on either side.
- Scales of the province: Fury +1 att and +1 mor per step for the dominating nation's
  units; Lore +1 prec per step.
- Fort storm: defenders +3 prot, +2 mor; walls still standing +6 prot.
- Rootwall ritual buffs apply to defenders.

## Replay log

Every event is appended to `replay`. Event kinds:
`roundStart(r)`, `phase(scripts | ranged | melee | morale | end)`,
`cast(caster, spellId, targets, fatigue)`,
`ability(unitId, abilityId, targets)`,
`volley` and `melee(squad, target, attacks, hits, blocked, onFallen, kills, dmg)`,
`damage(target, amount, element, kills, by?)`, `heal`, `rout`, `leave`, `advance`,
`death(commander)`, `summon`, `buff`, `expire`, `field`, `fieldEnd`, `fatigue`,
`battleEnd(winner, rounds)`.
Phase 9b (proposed) adds `duel(a, b)` with its exchanges as ordinary `melee` and `damage`
events, `duelEnd(winner, loser)`, `down(commander)` in place of `death` while the outcome is open,
and `captured(commander, by)` after `battleEnd`.

The replay viewer plays a battle blow by blow, re-run from its record, as one continuous fight
in real time with pause, play, speed and a time scrubber, with the pacing in
`docs/12-battle-presentation.md` (a hard cap of 150 s per battle). The rounds of this document
are the resolver's unit and the log's `round` field; the player never sees a round number, a
round card or a round step (owner direction 2026-10-29,
`docs/design/battle-presentation.owner-direction.md`).

## Required tests

- Determinism: same setup and seed produce identical results and logs.
- 20 Cinder Warriors beat 10 Ash Militia in ≥ 95% of 200 seeds.
- Equal armies: attacker win rate between 35% and 65% over 500 seeds on Plains.
- Archers with 3 free volleys kill at least 2 of 20 militia on average.
- Pyre Storm on a 30-militia front row kills at least 8 on average.
- Round 50 attacker retreat triggers when both sides are 1 immortal-equivalent (mor 50, prot 99).

Phase 9b (proposed):
- Capture odds over 500 seeds match the closed formula within 3 points for the base, the best
  Valor and Wanderer cases; a pretender is never captured; a winning side's downed commander dies.
- A stormed fort that falls captures every commander inside that has no retreat; a siege that
  lifts captures none; a losing commander with a friendly neighbor retreats as today.
- A duel is deterministic, fires exactly once with a Duelist on either side, never with a Retreat
  script on the other, ends at half HP or 10 exchanges, and its `moraleShock` shows in the
  loser's side's next morale check.
- The battle goldens (`tests/sim/battle/golden.json`) are unchanged when no commander has the
  Duelist trait and no battle is lost by a side with a downed commander; with them, only the
  post-battle outcome and the new events differ, never a draw before `battleEnd`.

## Implementation decisions

- **Replay record**: a `BattleRecord` holds both sides' starting roster (commanders and
  squads with unit, count, HP, and row) plus the event log. The viewer needs nothing from
  live state, because dead commanders and emptied squads are gone by the time a replay is
  opened.
- **Battle refs**: squads and commanders use their state ids. Units without a state entry
  get battle-local refs: provincial defense `pd0`, `pd1`, ..., summons `su0`, `su1`, ....
  A `summon` event carries its row. A `heal` event logs regeneration and healing.
- **Morale penalties** carried into battle are derived: up to 3 from starvation (one per 5
  starving days) and up to 3 from unpaid upkeep (one per 30 days).
- **Scripts**: a Cast slot may name no spell, meaning the best castable one. This is the
  default for mages; priests default to Bless (Phase 5, `docs/02-magic.md` decisions).

**Resolver (Phase 4)**
- **Closing and contact**: a unit's closing round is 2 for flyers and map speed 3, 3 for speed
  2, and 4 for speed 1 or 0 (`BATTLE.closingRound`). A unit can shoot while it has a ranged
  weapon with ammunition that reaches the enemy's current front (range 5 or more reaches the
  rear, shorter ranges the front and middle rows). An active unit in its side's front row
  that cannot shoot closes on the enemy from its own closing round. A side's front row is in
  contact when the enemy front holds an active closer past its closing round, and then all of
  it fights back, however slow. So archers never charge while they can shoot: they get one
  free volley against speed-3 melee, two against speed 2, and three against speed 1, and
  join the melee once out of arrows. Contact is fixed when each phase begins.
- **Ranged damage** ("damage as melee"): the same formula without the shooter's strength,
  `weaponDmg + DRN − prot − DRN`, at least 0, with armor piercing and negating as in melee.
  Strength bonuses such as berserk count only in melee.
- **Rows**: a side's front is its first row with an active (alive, not routing) unit. Attacks
  draw targets from every unit still on the field, routing ones included, in the enemy front
  and any row before it, so stragglers can be cut down in their exit round. Ranged reach is
  measured to that front. A routing unit only flees: it neither shoots nor fights back.
- **Simultaneous resolution**: within a phase every attack is rolled against the field as the
  phase began, then all damage lands, so two units that kill each other both fall. Rolls go
  attacker side first, in setup order, so the rng stream is fixed. A unit with no melee
  weapon attacks once unarmed (damage 0, in content).
- **Morale details**: both loss shares count against the squad's starting size. A side has
  lost over half when its starting troops minus the living troops of its starting squads
  still on the field exceed half its starting troops (commanders and summons do not count).
  A squad rolls at most once a round. A commander's death is checked right after the phase
  that killed it: it is logged and its squads roll at once with pressure +4, and do not roll
  again that round.
- **A commander's rout** (deviation from "checks morale too"): when a commander's last
  standing squad routs, the commander routs with it without a roll, unless it has morale 50 or
  is berserk, or the squad that broke is bound (below). A commander that brought no squads,
  or whose squads all died, fights on and never routs by morale. A brave commander that stayed
  behind alone would leave its routed troops without a commander, and squads cannot travel
  without one (docs/01 section 10).
- **Berserk**: a berserk troop below half its HP attacks at +2 att and +2 str
  (`BATTLE.berserk`). Berserk squads never rout: not by morale, not with their commander, not
  on a Retreat slot. Only the round-50 retreat takes them off the field.
- **Scripts** run in caster order: attacker 0, defender 0, attacker 1, and so on. Attack moves
  the commander into its side's current front row (the front row if its side has none
  active) and logs an `advance`; it stays there. Retreat starts the rout of the commander and
  its squads as if it had begun the round before, so they leave at the end of this round.
  Cast slots hold until Phase 5 brings battle spells.
- **Winner**: the attacker wins only if the defender has no active units and it has some. When
  both sides break in the same round (mutual rout or both wiped out), the side with more
  living units still on the field, routing ones included, holds it; a tie goes to the
  defender. The design review proposed giving every mutual rout to the defender. Measured
  over the required tests, 20 attacking Cinder Warriors then beat 10 Ash Militia in only 89%
  of seeds (required: 95%), because small squads often break together. With the field-holding
  rule it is 98.5%, and equal armies split 49%. At round 50 the attacker leaves the field and
  the defender wins; round 75 stays only as a safety constant.
- **After the battle**: a dead commander's surviving squads join the first living commander of
  its side in setup order (leadership notwithstanding until the next transfer), else the
  fort's garrison holder when that side is defending its fort, else they are lost. Survivors
  keep their wounds. The rest is in the Phase 4 rules at the end of `docs/01-core-rules.md`.
- **Read-only setup**: `battle/setup.ts` folds every modifier into each squad's stats. The
  resolver keeps those as read-only bases and puts everything that changes in a battle
  (rows, routs, ammunition, timed modifiers) on its own groups, reading stats through one
  accessor. The same setup object fought twice with equal rng states gives the same result.
- **Modifiers**: attackers lose terrain attack (swamp −1) unless swamp walkers; Thornwood's
  forest defense applies on either side; starvation and unpaid upkeep lower morale, but
  provincial defense draws no pay and never suffers the unpaid-upkeep loss; Dread is in the
  `docs/05-pretender.md` decisions and touches only those fighting the dominating nation.
  Armor piercing keeps half the protection, rounded down (`BATTLE.armorPiercingFactor`). Carried mana passes through battle unchanged
  until Phase 5.
- **Replay additions**: `advance(unit, row)` when a script moves a commander and
  `leave(unit)` when a living unit leaves the field (rout exit, Retreat, the round-50
  retreat). `damage` carries the weapon's element, physical when it has none.
  `foldReplay(roster, events)` (`battle/replay.ts`) rebuilds each unit's count, commander HP,
  row, and rout state from a record, and a test checks that it ends where the result ends.

**Spellcasting (Phase 5)**
- **Step 1 is sequential**: commanders act in caster order (attacker 0, defender 0,
  attacker 1, ...), and each cast's effects land before the next commander acts. Spell kills
  count toward this round's morale, and commander deaths are checked right after step 1, so
  a caster killed by an earlier cast neither casts nor acts that round. The rest of the
  casting rules are in the `docs/02-magic.md` decisions.
- **Replay additions**: `cast` lists the target groups; spell damage logs one `damage` per
  target group; `buff` carries `debuff` and `untilRound`, the last round it holds (null for
  the battle); `field` and `fieldEnd` mark field effects and stand for their stat changes,
  which log no `buff` or `expire` of their own; `fatigue` logs a drain. `expire` is logged
  once per group and source, for changes a `buff` announced.

**Replay detail (Phase 10 S1)**
- **Phase markers**: a `phase` event opens each round step that logged anything; a step's
  span includes the commander deaths checked right after it, and `end` includes the round-50
  departures. `foldReplay` ignores them.
- **Attack tallies**: `volley` and `melee` carry `attacks` (rolls, misses included), `hits`,
  `blocked` (hits on a living troop that rolled 0 damage), `onFallen` (hits on a troop
  already felled earlier in the same phase, since every roll is made against the field as
  the phase began; about 15% of hits in large battles), `kills`, and `dmg` (HP removed, each
  blow capped at its target's HP). Wounds are `hits − blocked − onFallen − kills`.
- **Killers and costs**: `damage` carries `by`, the striking group, for weapon hits on
  commanders, and the shield's group for fire-shield burns; spell damage leaves it out (the
  `cast` before it names the caster). `cast` carries the caster's fatigue after paying.
- **Re-runnable records**: a `BattleRecord` stores `scene` (terrain, and the storm state
  when a fort was stormed) and, for player battles, `rerun`: the setup (through a JSON round
  trip, spells by id) and the rng state just before the battle. The viewer fights the battle
  again with a `detail` sink and uses the detail only if the re-run's whole log, winner, and
  rounds equal the record's; otherwise (no `rerun`, a mismatch after a rule or content
  change, or an error) it plays a summary built from the tallies and shows no rolls. Detail
  is never saved, so its shape can change freely. `STATE_VERSION` became 2: older records
  load with `rerun: null`, and a malformed `rerun` loads as null rather than failing.
- **Observation only**: with or without a sink, every draw happens on the same path and in
  the same order (rolls are bound to local values; nothing draws inside a detail branch).
  A golden test pins the stripped logs of 30 fixtures across the change, and an equivalence
  test compares result, log, and rng state with and without a sink.
- **Shared morale helpers**: `mustCheck()`, `breakThreshold()`, and `fearless()` in
  `morale.ts` are the rules the resolver itself uses; the viewer imports them for its shaken
  state and break chance instead of copying the rules.
- **Choices the spec left open**: a fire-shield burn's `by` is the shield group that owed the
  burned group the most fire (ties to the first shield struck). A morale roll's detail
  `cause` is `losses` when the losses alone made the squad roll, `shock` when only a shock
  spell did, and `commanderDeath` for the roll after a commander dies. Detail `engage` events
  open every ranged phase that is not grounded by a storm and every melee phase. A strike's
  `berserk` marks melee blows with the rage bonus; `firstRound` marks blows in the group's
  first melee round.

**Pretender abilities and new battle rules (Phase 6b)**

Added on 2026-10-21 at the owner's direction ("good options for pretenders like Dominions
has"). Each rule is tested alone; none adds a randomness source.

- **Battle-start abilities**: a commander's body may list abilities, each an effect list of
  `docs/02` section 5 primitives. In round 1, inside step 1 and before the scripts, commanders
  in caster order fire theirs, in list order, if they are active. An ability fires only when
  every effect has a target, as a spell needs; it plans targets as a spell does and lands its
  effects at once, with no fatigue, mana, research or spell power. It logs `ability` with its
  targets, then its effects' events. Only commanders carry abilities.
- **Multi-strike weapons**: a melee weapon with `strikes` n swings n times per troop per melee
  phase, each swing a full attack with its own target draw. A weapon with `maxTargetSize`
  strikes only targets of that size or smaller: "Trample hits only bodies of size {m} or
  less". With none present it swings at nothing and draws nothing.
- **Spell power**: see `docs/02-magic.md` decisions.
- **Retaliation shields**: a unit's shields are a list of element and amount (the Ash
  Colossus: fire 5). After the melee hits of a phase land, each damaging hit on a shielded
  unit costs its striker the shield's amount, per element, ignoring protection. Shields of one
  element add; each element logs its own `damage`, fire before nature.
- **Bound squads**: a squad summoned in the battle, or a squad of the unit its leading
  pretender's chassis summons each month, is bound. A bound squad that breaks never drags its
  commander into a rout; standing bound squads still keep it on the field. The one change for
  earlier content: summoned hornets pushed below morale 50 by Dread or Fear no longer drag
  their caster when they break.
- **Fear and morale 50**: Fear is a battle-long morale debuff; like Dread and unpaid upkeep, it
  can bring a morale-50 unit below the line, and such a unit then rolls like any other.

**Choices the Phase 6b.2 build spec left open** (recorded per `CLAUDE.md`):
- **Ability records** are the trigger entries of the abilities catalog (`src/content/abilities.ts`,
  after the units-and-items build spec, section B): `kind: 'trigger'`, a name, a glyph id and a
  one line of at most 120 characters (`UI.unitCard.oneLineMax`), the trigger, a presentation
  color, the effects, and an optional `sourceId`. With `sourceId` (a battle spell whose effect
  the ability copies) its stat changes carry the spell's id as their source, so the copy and the
  spell never land on one squad; the `ability` event still names the ability's own id. No
  shipped ability has one. The other catalog kinds and display fields arrive in Phase 7b.1.
- **The trigger id list** `TRIGGER_ABILITY_IDS` is written out beside the catalog: a type
  derived from the catalog itself would be circular once a unit names an ability (units,
  abilities, effects, the summoned unit's id). Content validation holds the list equal to the
  catalog's trigger entries, in order.
- **An ability's targets** in its event are the groups its effects planned, as a cast's; a
  summon plans none, so Kindle the Host and Call the Hunt log `targets: []`. The detail
  `spellHit` of an ability's damage names its source id in `spell`.
- **Who an ability skips**: only commanders that are not active (dead before the battle, or
  absent); being too tired does not matter in round 1, when nobody is.
- **Spell power** adds to every `damage` and `heal` effect a cast lands (single, squad and
  area alike), never to fatigue drains, shocks, buffs or summons; abilities pass 0.
  Content: a whole number, 0 or more, on commanders only.
- **Weapon fields**: `strikes` is a whole number from 1 to 4 and `maxTargetSize` from 1 to 6,
  both on melee weapons only. A troop swings each weapon's strikes in a row before its next
  weapon, so a weapon's `strike` detail events are consecutive. The size compared is the
  target's `CombatStats.size`, the body's `UnitDef.size`.
- **A shield burn's `by`** is the shield group that owed the burned group the most of that
  element, ties to the first shield of that element struck. The build spec wrote "the earlier
  in setup order" for ties but also required today's log exactly and called its rule the
  battle design's A3 rule, which landed in S1 as first struck; S1's rule is kept, so no
  existing burn changes (Cinder Skin on several sacred squads can tie on fire). No pinned
  battle reaches a tie where the two rules differ. The spec's N4 tie clause and R4 are to
  read "ties: the first shield of that element struck (S1's rule)". The detail `burn` event
  carries its element; a striker owed several elements burns in `ELEMENTS` order and stops
  when it dies.
- **Shields at setup** merge the body's `fireShield` with the blessings' shields, by element,
  in `ELEMENTS` order; a unit with none has an empty list.
- **Bound at setup**: `sideSetup` marks a squad bound when its commander is its owner's
  pretender and its unit is that pretender's chassis's `ChassisDef.monthlySummon.unit` (the
  Mother of Beasts' Wolves, the Cinder Idol's Fire Sprites, whatever their source). The type
  landed in Phase 6b.2 so the battle rule could read it; the monthly rule and the chassis that
  use it arrived in Phase 6b.3 (`docs/05`, monthly summons). Battle summons are bound when they
  join.
- **Records**: a commander's setup record holds its abilities by id; `fromSetupRecord` throws
  on an unknown id and `validRerun` asks for the list, so a Phase 6b.1 record (no
  `abilities`, `fireShield` in its stats) loads as a log-only replay. `battleRulesHash()`
  covers the abilities too, so no `STATE_VERSION` step was needed.
- **Fixtures**: the named battles `primordialFear`, `pyreLordKindle`, `hunterCall`, `trample`,
  `twoShields`, `spellPower` and `boundWolves` (`tests/sim/battle/fixtures/named6b.ts`) join the
  detail-sink equivalence and re-run tests, not the golden pin, whose 30 battles hold none of
  the new rules and still match byte for byte. Their abilities ride on existing bodies, as
  they were written before the new chassis arrived in Phase 6b.3; the staged duels of
  `npm run sim:duel` (`tests/sim/battle/fixtures/duel.ts`, Phase 6b.3) fight the real bodies
  with their own abilities, and the golden pin still matches byte for byte.

**QA sweep (2026-10-22)**
- **After a Retreat in slot 5** (finding BM-3): from round 6 on, a commander whose slot 5 is
  Retreat takes its default action, the one its default script holds (`defaultSlot`): Cast its
  unit's default spell, or the best castable one, when it has color or holy pips; Hold
  otherwise. This shows only for a commander too tired to act in round 5, since one that
  retreats in round 5 has left by round 6. Before the fix it retreated in the first later round
  it could act.
- **Damaging hits** (finding BM-2): retaliation shields burn, and life drain heals, only for a
  hit that dealt damage: the target was still alive when it landed and the roll was above 0. A
  hit on a troop already felled in the same phase (`onFallen`) deals none, so it neither burns
  its striker nor feeds drain. Before the fix every striker that rolled damage paid or gained.
  The golden pin's `fireShield` and `lifeDrain` battles changed with it (9 of 150 entries): their
  burns, heals and HP, not their draws, winners or rounds.
- **Capture and duels** (Phase 9b, proposed): capture is decided after `battleEnd` on the battle's
  rng so that every draw before it is unchanged and the goldens hold; the roll order is downed
  commanders in setup order. `apply.ts` writes `held` and the prisoner row where it wrote the
  death, and the heir rule is the same. The duel runs in `resolve.ts` between abilities and
  round 1 as its own phase (`phase(duel)`), using the melee attack and landing code on two
  one-unit groups so shields, resistances and multi-strike apply unchanged. Its numbers are in
  `BATTLE` (`captureBase`, `captureValor`, `captureWanderer`, `duelExchanges`, `duelShock`).
