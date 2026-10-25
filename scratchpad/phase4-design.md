# Phase 4 design: battle resolver, arrival battles, retreat, siege and storm, capture

Spec: docs/10 Phase 4 ("Resolver per docs/04-battle.md with the full event log. Arrival
triggers battle. Retreat destinations. Siege and storm. Province capture. Tests listed in the
battle doc, plus capture flow."). Rules: docs/04-battle.md (all), docs/01 sections 3 (battle
pop loss), 5 (lost battle unrest), 6 (movement, battle at arrival), 8 (PD fights), 9
(independents; capture sets PD 0), 10, 11 (sieges), 12 (scales in battle), 13 (losing the
province unclaims a Wellspring), and the Phase 3 decisions at the bottom of docs/01
(hostility, presence, location). Spells are Phase 5: the casting step exists as a hook and
Cast slots act as Hold until then; the "Pyre Storm" required test moves to Phase 5.

## Modules

- src/sim/battle/types.ts: BattleSetup, CombatStats, BattleResult (pure data).
- src/sim/battle/resolve.ts: `resolveBattle(setup, rng): BattleResult`, pure; uses only the
  setup and the rng. Split by phase if large: battle/fire.ts (ranged, melee, damage),
  battle/morale.ts.
- src/sim/battle/setup.ts: builds a BattleSetup from GameState (participants, PD force,
  modifiers folded into each unit's stats).
- src/sim/battle/apply.ts: writes a result back: casualties, wounds, deaths, battle record,
  messages, stats, population loss, unrest.
- src/sim/conflict.ts: what happens on a hostile arrival (battles, siege start, capture,
  retreats); replaces Phase 3's resolveArrivals body.
- src/sim/siege.ts: daily siege progress and storms.
- src/sim/capture.ts: province capture.
- src/content/rules.ts: BATTLE (rounds, closing, morale thresholds, pressure, pop loss,
  unrest, records kept), SIEGE (wall HP, divisors), STORM (prot, morale).
- commands: `storm { nation, province }`.

## Resolver (pure)

1. Setup: two sides, each { nation, commanders, squads }. A squad: ref (state id or `pd0`...),
   commander ref or null, unit id, count, HP pool, row, and CombatStats (hp, str, att, def,
   prot, mor, prec, mapSpeed, weapons, tags, regeneration) with every modifier already
   applied. A commander: ref, unit, name, HP, row, stats, script, pips, holy. Tests can build
   setups directly (e.g. immortals).
2. Troops: each squad becomes `count` troops, each with HP pool / count (the pool split
   evenly; docs/01: split into per-unit HP only inside the resolver). Commanders are single
   units in their row; all commanders start in the rear row.
3. Rows and fronts: a side's front is its first row (front, middle, rear) with any present
   unit (alive, not yet gone; routing units are present until they leave). Melee units
   attack the enemy front; units in other rows wait until their row becomes the front.
4. Closing: a unit attacks in melee from round 2 if mapSpeed 3 or flying, 3 if speed 2, 4 if
   speed 1 (per unit, by its own speed). Ranged fire and spells from round 1.
5. Round r = 1..75:
   a. Scripts: each commander executes slot min(r, 5): Cast = cast hook (Phase 5; Hold for
      now); Attack = move to the front row (stays there); Hold = stay; Retreat = the
      commander and its squads begin routing.
   b. Ranged: every non-routing squad with a ranged weapon with ammo left, that is not in
      melee contact (its row is the side front and r >= its closing round), fires each
      ranged weapon if the enemy front is within reach (range >= 5 reaches the rear, else
      front and middle only). Each troop shoots once per such weapon at a random present unit
      of the enemy front row: hit if prec + DRN >= 10 + DRN. Ammo - 1 per weapon per volley.
   c. Melee: every non-routing unit in its side's front row with r >= its closing round, while
      the enemy has a front, attacks once per melee weapon (units with none attack once
      unarmed, weapon damage 0) a random present unit of the enemy front row: hit if att + DRN
      > def + DRN.
   d. Damage (ranged and melee alike, docs/04 "damage as melee"): str + weapon dmg + DRN - prot
      - DRN, at least 0; armor piercing uses floor(prot / 2), armor negating 0. First-round
      bonus (lances) adds in the unit's first melee round.
   e. Resolution is simultaneous within a phase: all attacks of the phase are rolled against
      the units present at its start, then damage is applied. Rolling order is attacker then
      defender units, in setup order, so the rng stream is fixed.
   f. Morale: each squad that took casualties this round and is not routing checks if its
      losses since the start exceed 20% of its starting count or this round's exceed 10%:
      routs if mor + DRN < 10 + DRN + pressure; pressure = 2 if its side has lost more than
      50% of its starting troops. Squads whose commander died this round check regardless,
      with pressure + 4. mor >= 50 or berserk never check. Then a commander whose living
      squads all rout checks with its own mor; if it routs it leaves with them.
   g. End of round: routing units that were routing at the start of this round leave
      (safely). Regeneration heals regenerating units (heal events). The battle ends if a side
      has no active (alive, not routing, not gone) units. At the end of round 50, if it
      has not ended, the attacker retreats (all its units leave safely).
6. Winner: the side with active units; the attacker wins only if the defender has none. If
   neither has any, no winner. The 75-round cap is a safety limit (round 50 ends every
   undecided battle).
7. Result: per squad ref { count, hp, routed } of survivors (count 0 = destroyed); per
   commander ref { hp, dead, routed }; casualties (troops and commanders killed, both sides);
   winner; rounds; replay events (roundStart, volley and melee per attacking squad or
   commander and target squad or commander with hits and kills, damage events for hits on
   commanders, rout, death, heal, battleEnd).

## Modifiers (setup.ts folds them into stats)

- Terrain: defenders + terrain defenderDef; attackers + terrain attackerAtt (swamp -1) unless
  swampwalker. Thornwood units + homeTerrain def in forest on either side.
- Province scales (the dominating nation's units only): Fury +1 att and +1 mor per step,
  Lore +1 prec per step, Sanctity +1 mor per step for sacred units. Dread: enemies of the
  dominating nation get mor + scaleEffect(enemyMoralePer3Dominion) (the effective scale
  already scales with dominion strength).
- Storm: defenders +2 mor and +3 prot, or +6 prot while walls stand (wallHp > 0).
- Province defense effects (Rootwall, Phase 5): prot/def to the effect nation's defenders.
- Morale penalties: minus starvation (squad starvedDays) and minus unpaid upkeep (nation),
  as Phase 2 derived.

## Who fights on an arrival (conflict.ts)

When nation N arrives in a province P that is hostile to it (Phase 3 rule), its move orders
end. Then, repeating while N still has commanders in P:
1. If a nation T other than N and other than P's owner has a commander present in P (not a
   garrison holder, not stealthy), the first such T in nation order is fought first: N's
   commanders present in P attack T's commanders present in P. If N loses, stop.
2. If P is N's own, stop (relief done).
3. The owner's forces in P: the owner's commanders present (not stealthy), the garrison
   holder's squads (the holder itself never fights), and the PD force; or, for an
   independent province, the independent commanders there.
   - None: N captures P.
   - P has a fort and an owner nation: a siege begins (`siege = { attacker: N, wallHp: 300,
     storm: false }`), no battle.
   - Otherwise a battle; if N wins, it captures P.
Several nations arriving on one day are handled in arrival order; a later one finds the
earlier one present (step 1).

## After a battle (apply.ts, conflict.ts)

- Survivors are written back (count, HP pool); empty squads go; dead commanders are removed
  (a dead prophet or pretender clears the nation's id). Garrison squads write back to the
  holder; PD survivors set pd = ceil(militia left / 2) (archers ignored).
- Winners stay; their routed units regroup with them.
- Losing attacker: each surviving commander (with its surviving squads) goes back to the
  province it came from (cameFrom) if that is still friendly; otherwise to a random adjacent
  friendly province (state.rng); otherwise it is destroyed. "Friendly" = owned by its nation
  and not hostile to it.
- Losing defender: each surviving commander goes to a random adjacent friendly province, or is
  destroyed if none. Independents that lose are destroyed. Garrison squads and PD of a fort
  that falls are lost.
- Retreating commanders arrive at once (no transit) with order idle.
- Population: pop x (1 - 0.005 x casualties / 100). Unrest +10 when the province owner lost
  a battle there.
- Record: BattleRecord { id, day, province, attacker, defender, winner, rounds, roster,
  replay }; the last 20 are kept. Messages 'battle' to each nation involved. Stats:
  battlesWon / battlesLost per nation.

## Capture (capture.ts)

owner = N; pd = 0; siege = null; wellspringClaimedBy = null; replaceGarrison for a fort
(the old holder's troops are lost); the old owner's queue drops by the Phase 3 rule;
construction is abandoned by the Phase 2 rule; messages 'captured' to N and 'lost' to the
old owner; N.stats.provincesTaken + 1. Dominion is unchanged.

## Sieges (siege.ts), tick step 2 after arrivals and before continueMoves

For each province with a siege:
- No commander of siege.attacker present: the siege ends.
- No defenders left (as in conflict step 3): the attacker captures.
- storm set: a storm battle (defenders with storm modifiers); win = capture, loss = the
  attacker retreats as a losing attacker; the siege ends either way.
- Otherwise wallHp = clamp(wallHp - attackerStr / 10 + defenderStr / 20, 0, 300), where Str
  is the sum of str of every present troop and commander on that side (attackers: siege
  attacker's commanders present; defenders: owner's commanders, garrison squads, PD).
- storm { nation, province }: the nation is the besieger and has a commander there; sets
  storm, resolved in the next tick's siege step. Docs/07 says the player clicks Storm.
- Commanders inside a besieged fort may march out (no sally rules in M1).

## Tests (docs/04 list + capture flow)

Determinism; 20 Cinder Warriors beat 10 Ash Militia in >= 95% of 200 seeds; equal armies on
Plains: attacker win rate 35-65% over 500 seeds; archers with 3 free volleys kill >= 2 of 20
militia on average; round-50 attacker retreat with two immortals (mor 50, prot 99); Pyre
Storm moves to Phase 5. Plus: closing rounds by speed, reach by range, morale thresholds and
pressure, commander death check, mor 50 and berserk, routing exit timing, damage rules (AP,
AN, first round bonus), simultaneous resolution, modifiers, arrival battle -> capture,
losers' retreat destinations and destruction, PD fights and shrinks, garrison squads fight,
siege start / progress / lift / capture without defenders / storm with walls up and down,
pop loss, unrest +10, Wellspring unclaim, battle record cap and messages, 300 vs 300 under
50 ms.

## State changes

SiegeState gains `storm: boolean`. BATTLE/SIEGE/STORM constants in content. No other shape
changes (BattleRecord already exists).
