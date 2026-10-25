# Nations

M1 ships two nations fully: **Cinder Horde (R)** and **Thornwood (G)**. The other three
are sketched so the content format and the AI are written to accommodate them.

Every nation entry is data under `src/content/nations/<id>.ts` with: id, name, color
identity, description, capital name, unit list, commander list, starting army, starting
pretender chassis options, and AI personality weights.

## Unit stat model

| Field | Meaning |
|-------|---------|
| hp | hit points |
| str | strength, added to melee damage |
| att | attack skill |
| def | defense skill |
| prot | protection (armor), subtracted from damage |
| mr | magic resistance, used by spells with a resist check |
| mor | morale |
| prec | precision, for ranged attacks |
| size | 1 to 6; size 3+ eats 3 supply, occupies more formation space |
| mapSpeed | 1 slow, 2 normal, 3 fast |
| weapons | list of `{ name, dmg, range?, ammo?, element? }` |
| tags | e.g. sacred, undead, beast, flying, construct, mounted, mindless |
| gold, materials, popCost, recruitDays | recruitment costs |
| leadership | commanders only: max troop count led |
| pips, holy | commanders only |

Baseline human infantry: hp 10, str 10, att 10, def 10, prot 0, mr 10, mor 10, prec 10.
Armor adds prot; weapons add dmg.

## Cinder Horde (R): "The fire that walks"

A confederation of ash-born clans that worship a god of flame. Fast, aggressive, cheap
troops with poor armor and high morale. Fire mages and salamanders. Weak defense; wins by
striking first and burning the enemy economy.

Capital: **Kharnath**, Plains. Palette: ember orange, charcoal, hot white.

Identity levers: Turmoil-friendly, Fury-friendly. Berserkers. Pillage is strong.

### Troops (recruit at fort)
| Unit | hp | str | att | def | prot | mor | mapSpd | Weapons | Cost (g/m/pop) | Days/10 | Tags |
|------|----|-----|-----|-----|------|-----|--------|---------|----------------|---------|------|
| Ash Militia | 10 | 10 | 9 | 8 | 1 | 9 | 2 | Spear 3 | 8/3/10 | 8 | |
| Cinder Warrior | 11 | 11 | 11 | 9 | 3 | 11 | 2 | Axe 5 | 12/8/10 | 10 | |
| Ember Skirmisher | 10 | 10 | 10 | 11 | 1 | 10 | 3 | Javelins 4 (range 3, ammo 4), Knife 2 | 11/4/10 | 10 | |
| Flame Archer | 10 | 10 | 9 | 9 | 2 | 10 | 2 | Fire Arrows 6 (range 6, ammo 10, fire) | 13/6/10 | 10 | |
| Berserker | 13 | 13 | 12 | 7 | 2 | 14 | 2 | Great Axe 8 | 18/10/10 | 12 | berserk (att +2 str +2 when below half hp, never routs) |
| Ash Rider | 12 | 11 | 11 | 11 | 4 | 11 | 3 | Lance 6 (first round +3), Sword 4 | 28/18/20 | 14 | mounted |
| Flamebrand (sacred) | 13 | 12 | 13 | 11 | 6 | 13 | 2 | Burning Blade 6 fire | 32/14/10 | 16 | sacred |
| Fire Sprite (summon only) | 6 | 6 | 10 | 14 | 0 | 50 | 3 | Flame Touch 5 fire, armor piercing | | | flying, mindless, construct |

### Commanders
| Unit | hp | prot | mor | leadership | pips | holy | Cost (g/m/pop) | Days | Notes |
|------|----|------|-----|------------|------|------|----------------|------|-------|
| Scout | 10 | 1 | 10 | 10 | | | 20/2/50 | 10 | sees 2 provinces, stealthy (not shown to enemy) |
| Ash Chieftain | 14 | 4 | 13 | 80 | | | 40/10/50 | 15 | |
| Pyre Priest | 10 | 2 | 11 | 20 | R1 | 2 | 60/4/50 | 20 | requires temple |
| Ember Adept | 10 | 1 | 10 | 10 | R1 | | 70/2/50 | 20 | requires lab |
| Cinder Magus | 11 | 2 | 11 | 20 | R2 (+25% chance R3) | 1 | 160/4/50 | 30 | requires lab, capital only |
| Salamander (summon) | 35 | 8 | 14 | 30 | R2 | | | | size 3, Fire Breath 10 fire range 2 ammo 6 |

Starting army: Chieftain with 20 Cinder Warriors, 10 Flame Archers; 1 Scout; 1 Ember Adept;
1 Pyre Priest. Starting research: R level 1.

AI personality: aggression 0.8, expansion 0.8, research 0.4, pillage 0.6.

## Thornwood (G): "The forest that remembers"

Druidic clans living inside a continent-spanning forest, allied with beasts and treants.
Tough, well-armored, slow troops; strong population growth and supply; big summons.
Wins by out-growing the enemy and fielding monsters late.

Capital: **Deepmoss**, Forest. Palette: moss green, bark brown, pale blossom.

Identity levers: Growth-friendly, Wild-friendly. Regeneration bless. Forests are home
turf (+1 def in forests for Thornwood units).

### Troops
| Unit | hp | str | att | def | prot | mor | mapSpd | Weapons | Cost (g/m/pop) | Days/10 | Tags |
|------|----|-----|-----|-----|------|-----|--------|---------|----------------|---------|------|
| Thorn Militia | 10 | 10 | 9 | 9 | 2 | 10 | 2 | Spear 3 | 8/4/10 | 8 | |
| Warden | 11 | 11 | 10 | 11 | 6 | 11 | 1 | Sword 4, Shield (+2 def, counted) | 14/14/10 | 12 | |
| Longbow Hunter | 10 | 10 | 9 | 10 | 2 | 10 | 2 | Longbow 6 (range 7, ammo 12) | 14/8/10 | 10 | |
| Briar Guard | 12 | 12 | 11 | 10 | 9 | 12 | 1 | Halberd 7 | 24/26/10 | 14 | |
| Wolf Rider | 12 | 11 | 11 | 12 | 3 | 11 | 3 | Spear 4, Wolf Bite 3 | 26/12/20 | 14 | mounted, beast |
| Oakheart (sacred) | 16 | 14 | 11 | 9 | 10 | 13 | 1 | Oak Maul 9 | 36/22/10 | 18 | sacred, size 2 |
| Wolf (summon only) | 9 | 9 | 10 | 11 | 1 | 10 | 3 | Bite 4 | | | beast |
| Hornet Swarm (summon only) | 6 | 2 | 12 | 13 | 0 | 50 | 3 | Sting 2 armor negating | | | flying, mindless, beast |

### Commanders
| Unit | hp | prot | mor | leadership | pips | holy | Cost (g/m/pop) | Days | Notes |
|------|----|------|-----|------------|------|------|----------------|------|-------|
| Scout | 10 | 1 | 10 | 10 | | | 20/2/50 | 10 | sees 2 provinces, stealthy |
| Warden Captain | 14 | 7 | 12 | 80 | | | 45/16/50 | 15 | |
| Grove Priest | 10 | 2 | 11 | 20 | G1 | 2 | 60/4/50 | 20 | requires temple |
| Sapling Druid | 10 | 1 | 10 | 10 | G1 | | 70/2/50 | 20 | requires lab |
| Elder Druid | 11 | 2 | 11 | 20 | G2 (+25% chance G3) | 1 | 160/4/50 | 30 | requires lab, capital only |
| Treant (summon) | 60 | 12 | 16 | 40 | G1 | | | | size 4, Crushing Limbs 12, regeneration 5% per round |

Starting army: Warden Captain with 20 Wardens, 10 Longbow Hunters; 1 Scout; 1 Sapling
Druid; 1 Grove Priest. Starting research: G level 1.

AI personality: aggression 0.4, expansion 0.6, research 0.7, pillage 0.1.

## Sketches for M2 (not implemented in M1)

- **Sunward Concord (W)**: human legions, cheap disciplined infantry, priests everywhere,
  Radiant Guard sacreds, healing and dominion. Capital Aurelion. Order and Sanctity.
- **Mirrorsea Compact (U)**: coastal scholars, illusionists, crossbows, few but excellent
  troops, best research. Capital Vellmar. Lore and Artifice.
- **Hollow Court (B)**: necromancer nobility, skeleton hordes with 0 upkeep and 0 supply,
  population sacrifice, fear. Capital Gravehold. Rot and Dread.

## Independents

Independent unit pool (shared, nation-neutral, palette grey and tan):
Light Infantry (as Ash Militia with prot 2), Heavy Infantry (hp 11, prot 7, mor 10,
Sword 4), Archer (Shortbow 5 range 5 ammo 10), Wolf (as above), Swamp Fighter (def 12,
Spear 3, ignores swamp penalty), Giant (hp 40, str 18, prot 4, size 4, Club 12),
Independent Captain (hp 12, leadership 60).

## Implementation decisions

Recorded per `CLAUDE.md`; numbers are also in `docs/09-balance.md`.
- **Unit ids**: camelCase names (`cinderWarrior`, `wardenCaptain`). The two Scouts are
  `cinderScout` and `thornScout`. The Wolf is one shared unit used by Thornwood summons and
  independents.
- **Stats the tables leave out** take the baseline (`hp 10, str 10, att 10, def 10, prot 0,
  mr 10, mor 10, prec 10`), size 1, and map speed 2. This applies to every commander
  (including Scouts) and to mounted troops, whose size is not listed, except for map speed
  below.
- **Commander map speed** is 3 for every national commander (Phase 3). A commander moves at
  the slowest of itself and its squads, so with speed 2 no army could ever use its speed-3
  troops (Ash Riders, Ember Skirmishers, Wolf Riders). Lone scouts, priests, and mages move at
  3. Summoned commanders (Salamander, Treant) keep the baseline speed 2.
- **Commander weapons** are not listed. Scouts carry a Dagger 2, priests and mages a Staff
  2, Ash Chieftain an Axe 5, and Warden Captain and Independent Captain a Sword 4.
- **Requirements**: every recruitable unit needs a fort; priests and sacred units also need a
  temple; mages need a lab; the adept tier is capital only. The Salamander has the beast tag.
- **Color identity** is an array (`colors: ['R']`), as the milestone asks. Thornwood's forest
  bonus is nation data: `homeTerrain: { terrain: 'forest', def: 1 }`.
- **Provincial defense** uses the nation's militia (Ash Militia, Thorn Militia) and archer
  (Flame Archer, Longbow Hunter) units.
- **The garrison holder** is a common unit: free, immobile, never fights, and never eats.
- **Default spells** (Phase 5): Pyre and Grove Priests carry `defaultSpell: 'bless'`, so their
  default script casts Bless. Whether a commander gets a caster script follows its own pips
  and holy pips, not only its unit's.

