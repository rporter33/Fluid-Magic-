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

Sacred units of a nation receive a **bless** derived from the pretender's pips at game
start (computed once):

| Color pips ≥ 4 | Bless effect on sacred units |
|----------------|------------------------------|
| W | +2 morale, +1 protection |
| U | +2 defense, +2 precision |
| B | Life drain 2 per hit, +1 attack |
| R | +2 attack, +2 strength |
| G | Regeneration 10% max HP per round, +1 protection |

Pips ≥ 6 in a color doubles the numeric parts. Blesses apply only in battle and only to
units with `sacred: true`.
