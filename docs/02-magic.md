# Magic System

Five colors, each a standalone element with its own flavor. The MTG color pie is the
design bible for what each color is *allowed* to do. Internally every color is keyed by
its MTG letter. Element names are flavor only.

## 1. The five colors

| Key | Element | Essence | Does well | Never does |
|-----|---------|---------|-----------|------------|
| W | Radiance (light, sun, law) | Order, community, protection | Cheap massed troops, healing, protection buffs, anti-undead, dominion spread, unrest control | Direct big damage, summoning monsters, stealing |
| U | Tide (water, mind, storm) | Knowledge, control, deception | Research speed, scrying, illusions and misdirection, debuffs, fatigue, weather, teleportation | Healing, raw brawn, cheap troops |
| B | Umbra (shadow, rot, blood) | Ambition, death, sacrifice | Undead, population sacrifice for power, life drain, fear, unrest in enemy lands, decay | Healing the living, protection buffs, cheap honest troops |
| R | Ember (fire, fury, chaos) | Passion, speed, destruction | Burst damage, area fire, morale and attack buffs, fast troops, berserk, destroying buildings | Defense, long-term growth, control |
| G | Loam (earth, growth, beasts) | Life, growth, the wild | Population growth, supply, big beasts, protection, regeneration, entangle, summoning animals | Flying, evasion, precision, undead |

Enemy pairs, which define the five Scales: W–B, W–R, U–R, U–G, B–G.
Allied pairs (future two-color nations): W–U, U–B, B–R, R–G, G–W.

## 2. Pips

- A mage has a pip count per color, 0 to 6 in M1 (`pips: { W, U, B, R, G }`).
- A spell has a **color requirement** (e.g. `RR` means 2 Red pips) and a **research level**.
  A mage can cast a spell when its pips meet the requirement in every listed color and
  the nation has researched the spell's level in the spell's primary color.
- Hybrid requirements (`R/G`) are satisfied by either color. M1 content uses no hybrids;
  the data format supports them.
- Priests have **holy pips** (`holy: 0..3`), separate from colors, used for preaching,
  claiming Wellsprings, and sacred blessings.

## 3. Costs

Two kinds of spells:

- **Battle spells** are cast during a battle. They cost **fatigue**, not mana. A mage
  starts a battle at fatigue 0 and gains `spell.fatigue` per cast, reduced by
  `5 * (pips − requirement)` for extra pips (minimum 20% of listed). At fatigue ≥ 100
  the mage cannot act; at 200 the mage falls unconscious. Fatigue drops by 5 per round.
  Some battle spells additionally require `manaCarried ≥ spell.manaCost` and consume it.
- **Rituals** are cast on the map by a mage in a lab province. They cost mana from the
  national pool: a cost like `{ R: 3, generic: 2 }` means 3 Red plus 2 of any colors.
  Generic is paid by the player's choice at cast time (default: the primary color, then
  the largest other pool). A ritual takes `castDays` days during which the mage is busy.

## 4. Research

- One research track per color, levels 0 to 6 in M1 (9 eventually).
- Research points per month per mage with order `Research` in a lab:
  `3 + 2 * totalPips`, times `(1 + 0.10 * loreScale)` in the mage's province.
- Cumulative RP to reach each level: `[0, 60, 150, 300, 500, 750, 1050]`.
- The nation chooses one color to research at a time; points go to it. Switching keeps
  partial progress in each color.
- Research progress is visible in the Research panel with the spells unlocked at each level.

## 5. Spell effect primitives

Content is data. Every spell is composed of effect primitives the resolver understands.
Implement exactly these primitives; every spell below maps onto them.

Battle primitives:
- `damage { amount, element, targets: single|squad|area(n), aoeShape, armorPiercing?, armorNegating? }`
- `buff { stat, delta, duration: battle|rounds(n), targets: self|friendlySquad|allFriendly }`
- `debuff { stat, delta, duration, targets: enemySquad|allEnemy|area(n) }`
- `summon { unitTypeId, count, side }`
- `heal { amount, targets }`
- `fatigueDrain { amount, targets }`
- `moraleShock { amount, targets }` (negative morale check modifier, can cause rout)
- `fieldEffect { kind: wall|fog|storm, duration }`

Ritual primitives:
- `summonToProvince { unitTypeId, count, commander?: boolean }` (summons as a new commander if `commander`, else as a squad under the caster)
- `provincePop { deltaPct }`, `provinceUnrest { delta }`, `provinceGrowth { deltaScale, months }`
- `provinceSupply { deltaPct, months }`, `provinceMaterials { delta, months }`
- `provinceDefenseBuff { prot?, def?, months }` (applies to defenders in that province)
- `remoteDamage { dicePerUnit, element }` (hits every troop in a target province)
- `scry { provinceId }`, `dominionPush { provinceId, strength }`
- `manaConvert { from, to, ratio }`

## 6. Spell list

Each color has 5 battle spells and 5 rituals. **Red and Green must be fully implemented
in M1.** W, U, B are defined here for completeness; they share primitives and may be
implemented opportunistically, but they are not required for M1 acceptance.

Format: Name (Level, Requirement) Kind: effect. Fatigue (battle) or mana cost and days (ritual).

### Red (Ember)

Battle:
1. **Ember Dart** (L1, R) damage 12 fire, single target, armor piercing. Fatigue 10.
2. **Fireball** (L2, RR) damage 10 fire, area(5). Fatigue 25.
3. **Warcry** (L2, R) buff morale +2, all friendly, battle. Fatigue 20. Requires 1 carried R mana.
4. **Blood Fury** (L3, RR) buff attack +2 and strength +3, debuff defense −2, one friendly squad, battle. Fatigue 30.
5. **Pyre Storm** (L5, RRR) damage 14 fire, area(12). Fatigue 60. Requires 1 carried R mana.

Rituals:
1. **Call Fire Sprites** (L1, R) summonToProvince FireSprite x5 as a squad. Cost {R:2}. 5 days.
2. **Forge of Cinders** (L2, RR) provinceMaterials +25 for 6 months on the caster's fort province. Cost {R:3, generic:1}. 10 days.
3. **Burn the Fields** (L3, RR) target any province within 3 hops: provincePop −6%, provinceSupply −50% for 3 months, provinceUnrest +15. Cost {R:4, generic:2}. 10 days.
4. **Bind Salamander** (L4, RRR) summonToProvince Salamander as a commander (R2 mage, fire-breathing beast). Cost {R:8, generic:4}. 20 days.
5. **Ash Rain** (L6, RRRR) target any province within 4 hops: remoteDamage 2d6 fire per troop, provinceUnrest +25. Cost {R:12, generic:6}. 25 days.

### Green (Loam)

Battle:
1. **Thorn Spray** (L1, G) damage 8 nature, area(3), no armor piercing. Fatigue 10.
2. **Bark Skin** (L2, G) buff protection +3, one friendly squad, battle. Fatigue 15.
3. **Entangle** (L3, GG) debuff defense −3 and attack −1, one enemy squad, rounds(5). Fatigue 25.
4. **Swarm** (L4, GG) summon Hornet Swarm x20 as one squad on the friendly side. Fatigue 35. Requires 1 carried G mana.
5. **Regrowth** (L5, GGG) heal 10 to all friendly squads and remove one debuff each. Fatigue 50. Requires 1 carried G mana.

Rituals:
1. **Call of the Wild** (L1, G) summonToProvince Wolf x6 as a squad. Cost {G:2}. 5 days.
2. **Fertile Season** (L2, GG) provinceGrowth +2 for 6 months on an owned province within 2 hops. Cost {G:3, generic:1}. 10 days.
3. **Awaken Treant** (L3, GGG) summonToProvince Treant as a commander (G1 mage, size 4, high prot). Cost {G:6, generic:3}. 15 days.
4. **Bounty of the Loam** (L4, GG) provinceSupply +100% and provinceMaterials +15 for 6 months on an owned province within 2 hops. Cost {G:5, generic:2}. 10 days.
5. **Rootwall** (L5, GGG) provinceDefenseBuff prot +2, def +1 for 12 months on an owned province within 2 hops. Cost {G:8, generic:4}. 15 days.

### White (Radiance), M2

Battle: Sunlance (L1, W, damage 10 holy single, double vs undead), Shield of Dawn (L2, W, prot +2 all friendly), Rally (L3, WW, heal 5 all friendly + morale +1), Banish (L4, WW, damage 20 holy area(6) undead only), Solar Judgment (L6, WWW, damage 12 holy area(10) + moraleShock −3).
Rituals: Blessed Harvest (L1, W, unrest −20), Consecrate (L2, WW, dominionPush +2 on temple province), Call Guardians (L3, WW, summon Radiant Guard x8), Edict of Order (L4, WWW, +1 Order scale in province for 12 months), Beacon (L5, WWW, +2 dominion checks per month at target temple for 12 months).

### Blue (Tide), M2

Battle: Frost Needle (L1, U, damage 9 cold single + fatigue +5), Mist Veil (L2, U, debuff enemy precision −4 battle), Sapping Tide (L3, UU, fatigueDrain 20 enemy squad), Phantom Host (L4, UU, summon Illusion x15: 1 hp, high def, no damage), Tempest (L5, UUU, fieldEffect storm: no ranged, −2 att all, 10 rounds).
Rituals: Scry (L1, U, scry any province within 5 hops), Swift Currents (L2, UU, −50% move days from caster's province for 6 months), Veil the Border (L3, UU, hide armies in province for 6 months), Deep Study (L4, UUU, +50% research in lab for 6 months), Rift Step (L6, UUUU, teleport caster and squads to any owned province).

### Black (Umbra), M2

Battle: Wither (L1, B, damage 10 decay single, armor negating), Dread Aura (L2, B, moraleShock −2 enemy squad), Life Leech (L3, BB, damage 8 area(4) and heal caster), Raise the Fallen (L4, BB, summon Skeleton x10 from casualties), Plague Wind (L5, BBB, damage 6 area(15) each round for 3 rounds).
Rituals: Dark Tithe (L1, B, sacrifice 2% pop of caster's province for 6 B mana), Grave Call (L2, BB, summon Skeleton x12), Creeping Rot (L3, BB, target province Rot +2 for 6 months, unrest +10), Bind Wraith (L4, BBB, summon Wraith commander), Hollowing (L6, BBBB, target province pop −15%, summon Skeletons equal to pop lost / 50).

## 7. Mage design rules

- Nation mages come in two tiers: an apprentice tier with 1 pip (cheap, recruitable
  anywhere with a lab) and an adept tier with 2 pips plus a 25% chance of a random third
  pip in the nation color (capital only). Summoned commanders can carry pips.
- Mages gain no pips from experience in M1.
- Carried mana: a commander can hold mana. The player transfers mana from the national
  pool to a commander in a lab province. Lost on death.

## 8. Blessings

Sacred units, the prophet, and a pretender with Avatar fight **blessed**. What they get is
chosen at pretender design from a blessing menu (`docs/05-pretender.md`, Step 6), after
Dominions 6. The menu was introduced on 2026-10-21 at the owner's direction ("good options for
pretenders like Dominions has").

- Bless points per color = pips in that color − 1; a color's points buy only its blessings.
- A blessing costs its requirement − 1 (at least 1); requirements run from 2 to 6.
- At most one blessing per group. Incarnate blessings work only while the god is on the map.
- Without a choice, each color at 4 or 5 pips gives its standard blessing and at 6 its greater
  one:

| Color | Standard (4 pips) | Greater (6 pips) |
|-------|-------------------|------------------|
| W | +2 morale, +1 protection | +4 morale, +2 protection |
| U | +2 defense, +2 precision | +4 defense, +4 precision |
| B | Life drain 2 per hit, +1 attack | Life drain 4 per hit, +2 attack |
| R | +2 attack, +2 strength | +4 attack, +4 strength |
| G | Regeneration 10% max HP per round, +1 protection | Regeneration 20%, +2 protection |

Blessings apply only in battle.

## Implementation decisions

Recorded per `CLAUDE.md` (Phase 5); numbers are also in `docs/09-balance.md`.

**Spell data**
- **Requirements** are strings in this doc's notation: one letter per pip, a slash joining
  the letters of a pip either color can fill (`RR`, `R/G`, `RR/G`). They parse once into pip
  slots; a caster meets a requirement when its pips fill every slot, one pip each (an exact
  search, so `R` plus `R/G` needs two pips). Holy spells have an empty requirement and a holy
  pip count. Every castability check (battle, scripts, rituals, the UI) uses this one rule.
- **White, Blue, and Black** spell data is not written in M1. Section 6 calls them M2 and
  gives none of their fatigue, mana costs, cast days, or durations, and several need effects
  the primitive list lacks (Edict of Order, Beacon, Swift Currents, Veil the Border, Deep
  Study, Rift Step, Dark Tithe, Hollowing, Raise the Fallen "from casualties", "double vs
  undead") or units that do not exist. Every primitive is still implemented and tested with
  test-only spells. The Research panel shows those colors' levels without spell names.
- **Bless** is the priests' holy spell: holy 1, no research, fatigue 10, +1 morale on one
  friendly squad for the battle. Pyre and Grove Priests default to it (docs/08 "priests
  Bless"); when every squad is blessed they fall back to their best castable spell.
- **Blood Fury**'s "debuff defense −2" falls on its own squad, so it is a buff with a
  negative delta: the price of the fury, which Regrowth never lifts.
- **Area damage** has one shape in M1: `n` distinct random living troops among every present
  unit in the target group's row. The damage primitive omits `aoeShape` until a second shape
  exists.

**Research** (section 4)
- A researcher is a commander with a color pip (holy pips do not count) whose order is
  Research, standing, in a lab province its nation owns. Phase 6 decides which pretenders
  research; one predicate (`canResearch`) holds that rule.
- Monthly points `(3 + 2 * colorPips) * (1 + researchPct)`, where `researchPct` is the
  province's Lore/Fury scale effect (+10% per Lore step, −10% per Fury step), applied daily
  as a thirtieth. A level is reached at its threshold, with a 1e-9 slack for the daily sums.
  Points stop at the level-6 threshold (1050); research beyond it is lost. A message names
  each level reached and the spells it unlocks.

**Battle spells** (section 3, docs/04 round step 1)
- **Fatigue** at 100 or more stops a commander from acting at all: no spell, no Attack or
  Retreat slot, no melee or ranged attack, and no closing on the enemy, so it draws no enemy
  archers into melee. It can still be hit and recovers 5 a round. M1 treats 200
  ("unconscious") the same: only a fatigue drain can reach it and no M1 spell drains. A cast
  costs `max(fatigue * 0.2, fatigue − 5 * extra)`, `extra` being the caster's pips in the
  requirement's colors beyond its slots (holy pips beyond for holy spells).
- **The spells a commander knows** are fixed at battle setup: those its pips meet and its
  nation has researched. A Cast slot casts the named spell if it is known and has a target,
  else the best castable one: against 10 or more active enemy troops damage spells first,
  otherwise the rest first, then the highest level, then content order. A spell is castable
  with its carried mana in hand and a target for every effect.
- **Targets** are chosen once per cast: a spell's area effects share one draw of troops and
  land on every group those troops belong to; its other effects share the targets of an
  earlier effect of the same kind and target kind.
  Enemy groups: the largest present group in the enemy's front row, then the rows behind it.
  Friendly squads: the largest active squad lacking the spell's effect (or, for heals,
  wounded or cursed), front row first. A buff or curse is cast only on a target without it;
  a recast (Warcry once a summon arrives) first removes the spell's earlier changes from its
  targets, so effects never stack. Damage spells roll `amount + DRN − prot − DRN` per troop
  hit, at least 0, with armor piercing and negating as for weapons, and no hit roll.
- **Summons** last the battle: they join on the caster's side under the caster, with the
  side's modifiers worked out at setup (terrain, scales, storm), and are not written back or
  counted as casualties.
- **Heal** with `removeDebuffs n` lifts every change of the `n` newest curse spells on each
  target group (Regrowth lifts a whole Entangle).
- **moraleShock** adds its amount to a group's morale pressure for the round and makes it
  check in the morale step even without losses; a squad still rolls once a round.
  **fatigueDrain** tires the enemy caster with the most pips (or all of them).
- **Field effects**: storm stops all ranged fire and gives everyone −2 attack (Tempest's
  text), so front-row archers, unable to shoot, close like other troops; fog gives everyone
  −4 precision; wall stops melee between the fronts. One of each
  kind at a time. Their stat parts fall on every unit present when cast; later summons
  arrive unaffected. Fog and wall numbers are this milestone's own (no spell defines them).
- **Carried mana** a battle spell uses is spent from the caster's carried pool and counted in
  the nation's mana spent, also when the caster dies later in the battle.
- **"All friendly squads"** (Regrowth) leaves commanders out; "all friendly" (Warcry) takes
  them in.
- **Life drain** (the Black bless) heals each striker 2 per damaging hit, paid after every hit
  of the phase has landed and only to strikers still alive.
- **Blessing folds** (Phase 6b): every blessing is a stat change folded in at battle setup
  (`battle/setup.ts`); the resolver gains nothing for blessings beyond shields by element.
  Weapon blessings copy each melee weapon (no range) with more damage, an element and armor
  piercing; a first-round blessing raises each melee weapon's first-round bonus; a berserk
  blessing adds the tag; a shield blessing adds a retaliation shield of its element (Cinder
  Skin and Living Pyre fire, Thornhide nature), merged by element with the body's own fire
  shield (`docs/04-battle.md`, "Retaliation shields"). Ranged weapons and unarmed blows gain
  nothing. Blessings fold in content order, so the order a design lists them never matters;
  with two blessings naming a melee element the first in content order wins (no M1 content
  has two).
- **Pretender abilities** (Phase 6b) are effect lists of the section 5 battle primitives on a
  pretender body, fired at battle start (`docs/04-battle.md`). They plan targets as a spell
  does, cost no fatigue or mana, and ignore spell power. Their ids never equal a spell id.
- **Spell power** (Phase 6b): a caster's `spellPower` adds to the amount of every damage and
  heal effect it casts (the Ember Hierophant: 3).

**Rituals** (sections 3, 5, 6)
- **Casting** needs a nation that is not godless, a caster standing in a lab province its
  nation owns, its pips, the research level, a fitting target, and the mana. The whole cost
  is paid when the ritual begins: the colored part, then the generic part as the command
  splits it (whole amounts) or by default from the spell's color first and then the largest
  other pools. The caster's order counts down castDays; any other order, a retreat, or death
  ends the ritual and the mana is lost.
- **Targets**: rituals cast on the caster's own province take no target; Forge of Cinders
  needs a fort there; ranged rituals reach provinces within their hops (by adjacency), and
  "owned" ones only provinces the nation owns. A ritual with timed effects cannot be cast on
  a province that holds an effect of the same spell from anyone.
- **Targets offered** (Ritual panel, AI) are those the command accepts with the default split,
  leadership and mana included; the default split pays whenever any whole split could.
- **At completion** the same checks run again (mana and leadership aside); if one fails, it fails
  with a message naming why, and nothing is refunded.
- **Summoned troops** must fit the caster's leadership when the ritual begins; when they
  arrive they join whatever it leads by then. Summoned commanders (Salamander, Treant) stand
  in the caster's province with their unit's pips and the default caster script.
- **Primitives**: timed effects last `months * 30` days. `remoteDamage` hits troops only
  (every squad in the province, any owner, hidden ones included), each taking plain `dice`
  d6 with no protection; wounds spread evenly, the dead leave, survivors keep their wounds;
  commanders and PD are untouched. `scry` shows the nation that province alone for 30 days
  (armies and exact independent strength) and explores it. `dominionPush` applies single
  docs/01 section 12 steps through the same function Phase 6's spread will use (own or
  empty: +1 up to the dominion score; another nation's: −1, leaving no dominion at 0).
  `manaConvert` turns the nation's whole `from` pool into `to`, `ratio` to one.
  `provinceSupply` is a factor of its own, `1 + sum of deltaPct`, after the scales' supply
  change, so Burn the Fields halves supply and Bounty of the Loam doubles it whatever the
  province's scales. `provinceGrowth` adds to the province's Growth scale, which stays within
  −3..+3 and moves supply with it (docs/01 sections 3 and 4).
- **giveMana** moves whole mana from the pool to a commander standing in a lab province its
  nation owns; nothing moves back in M1. Mana carried is lost with its commander.

