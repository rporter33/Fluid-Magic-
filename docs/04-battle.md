# Battle Resolver

The resolver is a pure function:

```
resolveBattle(setup: BattleSetup, rng: Rng): BattleResult
```

`BattleSetup` contains both sides (attacker and defender), each a list of commanders with
their squads, scripts, and carried mana, plus the province terrain, the fort state, and
the province scales. `BattleResult` contains survivors per side (squad counts, commander
HP), the winner, the round count, and a `replay: BattleEvent[]` log sufficient to render
the fight.

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

## Scripts

Each commander has 5 script slots, each `Cast(spellId) | Attack | Hold | Retreat`. After
slot 5 the commander repeats slot 5 unless it is Retreat. If a Cast slot cannot be cast
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
`roundStart(r)`, `cast(casterId, spellId, targets)`, `volley(squadId, targetSquadId, hits, kills)`,
`melee(squadId, targetSquadId, hits, kills)`, `damage(unitRef, amount, element)`,
`rout(squadId)`, `death(commanderId)`, `summon(side, unitTypeId, count)`, `buff(...)`,
`battleEnd(winner, rounds)`.

The replay viewer plays these back at 1 round per 1.5 seconds (adjustable), with squads
drawn as sprite blocks in their rows, numbers floating up for damage, and a rout animation.

## Required tests

- Determinism: same setup and seed produce identical results and logs.
- 20 Cinder Warriors beat 10 Ash Militia in ≥ 95% of 200 seeds.
- Equal armies: attacker win rate between 35% and 65% over 500 seeds on Plains.
- Archers with 3 free volleys kill at least 2 of 20 militia on average.
- Pyre Storm on a 30-militia front row kills at least 8 on average.
- Round 50 attacker retreat triggers when both sides are 1 immortal-equivalent (mor 50, prot 99).

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
  default for mages and priests.
