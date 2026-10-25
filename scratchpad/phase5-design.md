# Phase 5 design: magic (research, pips, battle spells, rituals, carried mana, blessings, summons)

Spec: docs/10 Phase 5 ("Research, pips, battle spell primitives, ritual primitives, Red and
Green spell data, carried mana, blessings, summon commanders (Salamander, Treant). Tests:
every Red and Green spell resolves without throwing in a fixture battle or province;
research level timing; fatigue math."). Acceptance 8: "pips, research tracks, fatigue,
carried mana, 10 Red and 10 Green spells fully working, blessings for pips >= 4". Rules:
docs/02-magic.md (all), docs/04-battle.md round step 1, "Commanders in battle", "Scripts",
required test Pyre Storm (moved from Phase 4), docs/03 mage and summon units, docs/05
(pips >= 4 grant the bless; Oracle researches as a mage is Phase 6), docs/06 commands
`setResearchColor`, `castRitual`, `giveMana` and content validation ("every spell's
primitives are implemented"), docs/07 Research and Ritual panels (UI is Phase 9; the sim
must expose what they show), docs/08 rituals and default scripts (AI is Phase 7).

## Modules

- src/content/spells/types.ts: SpellDef (battle | ritual), primitive unions, targets.
- src/content/spells/red.ts, green.ts: the 10 + 10 spells; holy.ts: the priests' Bless.
  index.ts: SPELLS registry, spellDef(id), isSpellId, spellsOf(color, level).
- src/content/rules.ts: CASTING (fatigue: perExtraPip 5, minShare 0.2, cannotCastAt 100,
  unconsciousAt 200, recoveryPerRound 5; heuristic: damageWhenEnemiesAtLeast 10),
  RESEARCH (base 3, perPip 2, lorePerStep 0.1, already RESEARCH_LEVEL_POINTS), BLESS table
  (per color: stat bonuses at pips >= 4, doubled at >= 6), FIELD_EFFECTS (storm, fog,
  wall), SCRY (days).
- src/sim/research.ts: researchLevel(state, nation, color), researchRate(state, commander),
  nationResearchRate(state, nation), progressResearch(state) (tick step 3), level-up messages.
- src/sim/rituals.ts: ritualTargets(state, commander, spell) (valid target provinces),
  ritualPayment(nation, spell, generic?), progressRituals(state) (tick step 3), the ritual
  primitives (summonToProvince, provincePop, provinceUnrest, provinceGrowth, provinceSupply,
  provinceMaterials, provinceDefenseBuff, remoteDamage, scry, dominionPush, manaConvert).
- src/sim/battle/spells.ts: castable(), chooseSpell(), cast() with the battle primitives
  (damage, buff, debuff, summon, heal, fatigueDrain, moraleShock, fieldEffect).
- src/sim/bless.ts: blessOf(pips) -> stat bonuses; setup.ts folds it into sacred units.
- src/sim/commands/magic.ts: setResearchColor, castRitual, giveMana.

## Spell data (content)

```ts
type SpellTargetBattle = 'single' | 'squad' | { area: number }        // damage
type FriendlyTarget = 'self' | 'friendlySquad' | 'allFriendly'          // buff, heal
type EnemyTarget = 'enemySquad' | 'allEnemy' | { area: number }         // debuff, shock, drain
type Duration = 'battle' | { rounds: number }
type BattlePrimitive =
  | { kind: 'damage'; amount; element; targets: SpellTargetBattle; armorPiercing?; armorNegating? }
  | { kind: 'buff'; stat: StatKey; delta; duration: Duration; targets: FriendlyTarget }
  | { kind: 'debuff'; stat: StatKey; delta; duration: Duration; targets: EnemyTarget }
  | { kind: 'summon'; unit: UnitTypeId; count; side: 'friendly' }
  | { kind: 'heal'; amount; targets: FriendlyTarget; removeDebuffs?: number }
  | { kind: 'fatigueDrain'; amount; targets: EnemyTarget }
  | { kind: 'moraleShock'; amount; targets: EnemyTarget }
  | { kind: 'fieldEffect'; effect: 'wall' | 'fog' | 'storm'; duration: { rounds } }
type RitualTarget = 'caster' | 'casterFort' | { any: hops } | { owned: hops }
type RitualPrimitive =
  | { kind: 'summonToProvince'; unit; count; commander?: boolean }
  | { kind: 'provincePop'; deltaPct } | { kind: 'provinceUnrest'; delta }
  | { kind: 'provinceGrowth'; deltaScale; months } | { kind: 'provinceSupply'; deltaPct; months }
  | { kind: 'provinceMaterials'; delta; months }
  | { kind: 'provinceDefenseBuff'; prot?; def?; months }
  | { kind: 'remoteDamage'; dice: number; element }      // "2d6" -> dice 2
  | { kind: 'scry' } | { kind: 'dominionPush'; strength } | { kind: 'manaConvert'; from; to; ratio }
interface SpellBase { id; name; color: Color | null (null = holy); level; requirement: Pips; holy?: number; description }
interface BattleSpellDef extends SpellBase { kind: 'battle'; fatigue; carriedMana?: Pips; effects: BattlePrimitive[] }
interface RitualSpellDef extends SpellBase { kind: 'ritual'; cost: { mana: Pips; generic }; castDays; target: RitualTarget; effects: RitualPrimitive[] }
```

- Red and Green exactly as docs/02 section 6. Blood Fury's "debuff defense -2" on its own
  squad is a buff primitive with delta -2 (debuffs target enemies); it is part of the price,
  not removable by Regrowth. Regrowth = heal 10 allFriendly with removeDebuffs 1.
- Bless (priests' built-in holy spell, docs/04 "Commanders in battle"): color null, holy 1,
  level 0 (no research), fatigue 10 (doc silent; recorded), buff mor +1 friendlySquad battle.
- W, U, B spell data is not written in M1: several of their spells need effects the
  primitive list lacks (Edict of Order, Beacon, Swift Currents, Veil the Border, Deep Study,
  Rift Step, Dark Tithe, Hollowing, Raise the Fallen "from casualties", "double vs undead",
  "Frost Needle fatigue +5 to the target") and units that do not exist (Radiant Guard,
  Illusion, Skeleton, Wraith). Every listed primitive is still implemented and tested with
  test-only spells. Recorded in docs/02.
- Content validation: every spell's primitives are known kinds with valid fields; every
  unit a spell names exists; levels 0..6 (0 only for holy); requirement colors match the
  spell color; castDays >= 1; costs non-negative; area >= 1; holy spells need holy >= 1.
  Each level of R and G has the spells docs/02 lists.

## Research (docs/02 section 4)

- A researcher: a commander with at least one pip and order research, standing (no
  transit), in a province its nation owns with a lab. Others give nothing; the order stays.
- Monthly RP = (3 + 2 * totalPips) * (1 + 0.10 * lore), lore = the province's effective
  Lore/Fury scale (Fury negative). Applied daily as RP / 30 to research.color.
- Levels: the highest i with points >= RESEARCH_LEVEL_POINTS[i]. Points in a color stop at
  the level-6 threshold (1050); RP beyond it is lost (the UI shows the track complete).
- Level-up message 'research' to the nation naming the color, the level, and the spells it
  unlocks. One message per level crossed.
- setResearchColor { nation, color }: any of the five colors; partial progress kept.
- Selectors for the panel: nationResearchRate (RP/month, sum over researchers), days to the
  next level at the current rate.
- battle/setup.ts researchLevels moves to research.ts.

## Battle casting (docs/04 round step 1, docs/02 section 3)

Each round, step 1, commanders act in caster order (attacker 0, defender 0, attacker 1, ...)
as now. A commander's slot for round r is slot min(r, 5):
- Attack / Hold / Retreat: as Phase 4.
- Cast(spellId) or Cast(null): if the commander is active and conscious (fatigue < 200) and
  can cast (fatigue < 100): if spellId names a castable spell with a valid target, cast it;
  otherwise (null, or not castable) cast the best castable spell; if none, hold.
- Castable: the commander's pips meet the requirement in every color (holy pips for holy
  spells); its side has researched the spell's level in its color (holy: no research);
  its carried mana covers carriedMana; and a valid target exists.
- Best castable: if the enemy has at least 10 living troops present, damage spells
  first, then the rest; otherwise the rest first, then damage. Within a group, highest
  level first, then content order. "Damage spells" are spells with a damage primitive.
- Fatigue: + max(fatigue * 0.2, fatigue - 5 * extra), extra = pips beyond the requirement
  in the spell's colors (sum over required colors; holy spells count holy pips beyond).
  Starts at 0, -5 per round at the end of the round (not below 0). At >= 100 a commander
  casts nothing; at >= 200 it is unconscious and takes no action (no casting, no attacks,
  no script movement) until fatigue falls below 200; it can still be hit.
- Carried mana is consumed per cast; the result's carriedMana is what is left; apply
  writes it back and adds what was used to nation.stats.manaSpent.
- A cast logs `cast { caster, spellId, targets }` (target refs), then each primitive's
  events. Effects land at once, in cast order (not simultaneous), so a later caster sees
  the field after earlier casts. Kills count toward this round's morale checks; a commander
  killed by a spell is checked by commanderDeaths right after step 1.
- Target choice (one choice per target kind per cast, shared by the spell's primitives, so
  Blood Fury's three effects and Entangle's two land on one squad):
  - Enemy 'single' / 'squad' / 'enemySquad': the present enemy group with the most living
    troops in the enemy's front row (rows before it if the front has none); ties in setup
    order. 'single' hits one random living troop of it.
  - { area: n }: n distinct random living troops among every present enemy unit in that
    group's row (all of them if fewer).
  - 'allEnemy': every present enemy group.
  - 'self': the caster. 'friendlySquad': the active friendly squad (not a commander) with
    the most living troops that lacks this spell's effect (heal: has wounds or, with
    removeDebuffs, a debuff); ties in setup order. 'allFriendly': every present friendly
    group, commanders included.
  - Valid target: damage, debuff, shock, drain need an enemy group; a buff needs a target
    without this spell's effect (re-casting a battle-long buff on the same target is
    pointless and the same source does not stack); heal needs a wounded or debuffed target;
    summon and field effects are always valid (a field effect already in force is not).
- Damage: per troop hit, amount + DRN - prot' - DRN, at least 0, prot' as for weapons
  (armor piercing halves, negating ignores). No hit roll and no magic resistance in M1
  (no Red or Green spell names a resist check). One 'damage' event per target group with
  the total and kills.
- Buff / debuff: a StatMod on the group (debuff: true for debuffs), untilRound null for
  'battle' or round + n - 1 for rounds(n). One 'buff' event per group. Same source on the
  same group replaces the old mod. Expiry already logs 'expire'.
- Summon: a new group on the caster's side: ref su0, su1, ... (battle-local), leader the
  caster, summoned true, row by the unit's default formation, base unit stats (no province
  modifiers: the resolver reads no state), full HP, ammo. Logs 'summon'. Summoned troops
  leave with the battle: they are not written back, and they do not count as casualties.
- Heal: each living troop of each target group regains amount HP, up to max; removeDebuffs
  removes that many debuff mods per group (the newest first). Logs 'heal' and 'expire'.
- fatigueDrain: target enemy commanders gain amount fatigue ('enemySquad': the enemy
  commander with the most pips; 'allEnemy': all of them; area: commanders among the
  troops hit).
- moraleShock: each target group that can check (not mor 50, berserk, routing, or already
  checked this round) rolls morale now with pressure + |amount| and the side's pressure.
- fieldEffect: one per kind on the field, until round + n - 1. storm: no ranged fire and
  -2 att for everyone; fog: -4 prec for everyone; wall: no melee between the fronts (both
  sides). Numbers in content. Logs a 'field' event (new kind) and 'expire'.

## Blessings (docs/02 section 8, docs/05)

- blessOf(pretender pips): for each color with pips >= 4, that color's bless; doubled at
  >= 6. Several colors stack. W +2 mor +1 prot; U +2 def +2 prec; B lifeDrain 2 per hit
  and +1 att; R +2 att +2 str; G regeneration 0.10 and +1 prot. Derived from the pretender
  design, which never changes, so "computed once" holds without storing it.
- setup.ts adds it to the stats of the nation's sacred units (troops and commanders with
  the sacred tag; the prophet in Phase 6). CombatStats gains lifeDrain (HP per damaging
  hit, up to max); attacks.ts heals the attacker's troop.

## Rituals (docs/02 section 3, 5, 6)

- castRitual { nation, commander, spell, target: ProvinceId | null, generic?: Pips }.
  Valid when: the nation is not godless; the commander is the nation's, standing in a
  province it owns with a lab, not the garrison holder; the spell is a ritual; pips meet the
  requirement; research reaches the level; the target fits the spell (below); the pool covers
  the colored cost plus the generic payment. Generic: the given split (non-negative, sums
  to the generic cost, covered by the pool after the colored part), else the default: the
  spell's color first, then the largest other pools (ties in WUBRG order).
- Targets: 'caster' -> null (the caster's province); 'casterFort' -> null, the caster's
  province must have a fort; { owned: n } -> a province the nation owns within n hops of the
  caster's province (0 included); { any: n } -> any province within n hops.
- Applying: mana is paid at once (stats.manaSpent); the order becomes castRitual with
  daysLeft = castDays. Each day of tick step 3, a caster with that order, standing, counts
  down; at 0 the effects apply and the order becomes idle, with a 'ritual' message. A
  move or another order replaces it (mana lost; the UI warns). A caster that dies or retreats
  loses it. At completion the target is checked again (owned targets must still be owned;
  the caster must still be in a lab province it owns); if not, the ritual fails with a
  message and no refund.
- Effects at the target province T (the caster's province for caster/casterFort):
  - summonToProvince: commander -> a new commander of the nation at the caster's province
    (default script, its pips), else a squad of count troops joining the caster (addSquad).
  - provincePop: pop *= 1 + deltaPct. provinceUnrest: unrest += delta, clamped 0..100.
  - provinceGrowth / Supply / Materials / DefenseBuff: a ProvinceEffect for months * 30 days
    (nation = caster's). The same spell's effect on the same province replaces the old one.
  - remoteDamage { dice }: every troop and commander in T (any owner, hidden ones included;
    not garrison holders themselves, which have no body; PD is abstract and untouched) takes
    dice x d6 - prot, at least 0. Squad pools are split evenly per troop as in battle; dead
    troops leave; commanders at 0 HP die (commanderDies).
  - scry: a ProvinceEffect 'scry' for SCRY.days (30): the nation sees T as if it had a scout
    there, and T becomes explored.
  - dominionPush { strength }: toward the caster's nation: same nation or none -> + strength
    (cap 10, nation set); another nation -> - strength, and past 0 the remainder becomes the
    caster's (0 exactly -> no dominion).
  - manaConvert { from, to, ratio }: the nation's whole `from` pool becomes `to` at ratio.
- Messages: 'ritual' on completion (and on failure) to the nation.

## Carried mana (docs/02 section 7)

- giveMana { nation, commander, color, amount }: the commander is the nation's, standing in
  a province it owns with a lab; amount a positive whole number <= the pool. Moves mana from
  the pool to commander.carriedMana. No way back in M1. Lost on death (the record goes).

## Summoned commanders

- Salamander and Treant exist in content. A ritual-summoned commander has the summon unit's
  pips and holy, default script (mages cast), HP full, no squads, map speed from the unit
  (baseline 2; docs/03 "summoned commanders keep the baseline until Phase 5" -> they keep
  it). They cost no upkeep (no gold cost) and eat as commanders.

## Tick (docs/06 step 3)

recruitment, construction, rituals, research (in that order; rituals before research so a
completed ritual's summoned mage starts researching tomorrow).

## Tests

- Every Red and Green battle spell cast in a fixture battle by a mage with enough pips,
  research, and carried mana: it resolves without throwing, logs its cast, and its effect
  shows (damage kills, buff changes stats, summon adds a squad, heal heals).
- Pyre Storm on a 30-militia front row kills at least 8 on average (docs/04 required).
- Every Red and Green ritual cast through the command into a fixture province and run to
  completion: its effect is in the state.
- Every primitive (incl. those no M1 spell uses) with test-only spells.
- Fatigue math: cost with extra pips, the 20% floor, -5 per round, no casting at 100,
  unconscious at 200 and recovery.
- Research level timing: one R1 mage in a lab reaches the next level on the computed day;
  Lore and Fury change it; four mages reach level 4 by the computed day; capped at 1050.
- Script choice: named spell, fallback when not castable, heuristic by enemy size.
- Blessings per color and doubling at 6; sacred only.
- Commands refused for other nations' commanders, without labs, godless, wrong targets,
  short mana; giveMana moves mana; carried mana spent in battle is written back.
- Determinism with spells; 300 vs 300 with mages under 50 ms.

## State changes

- CombatStats.lifeDrain. BattleEvent 'field' (and summon/buff/cast already exist).
- ProvinceEffect kind 'scry'. Commands: setResearchColor, castRitual, giveMana.
- No other GameState shape changes (research, carriedMana, castRitual order exist).
