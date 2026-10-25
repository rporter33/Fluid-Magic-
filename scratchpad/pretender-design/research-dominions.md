# Research: Dominions 5 and 6 pretenders, and what Fluid Magic should take from them

Scope: the pretender chassis in Dominions 5 and 6 (generic and national), the design options
(paths, new-path premium, dominion, scales, awakening, Dom6 blesses with incarnate effects),
the build strategies that make the choice a highlight, and how each maps onto Fluid Magic
(FM): its five colors, its `docs/02` section 5 primitives, and its current pretender rules
(`docs/05-pretender.md`, `src/content/pretenders/*`, `src/sim/pretender.ts`).

Owner direction this serves: "good options for pretenders like Dominions has", "flashy magic
effects", and "a customization level matching Age of Wonders 4". AoW4's cosmetic and editor
side is covered in `research-aow4.md` next to this file. This document covers the mechanical
side that Dominions does best.

Source tags such as [M3] are listed at the end. Numbers in sections 2 to 5 are Dominions'
numbers. Numbers in sections 6 and 7 are Fluid Magic's, either current or proposed as starting
values.

---

## 0. Summary

**Findings**

1. **The roster is huge and cultural.** In current Dom6 game data, 104 nations draw from 298
   distinct pretender bodies, 55 per nation on average (min 1, max 113). A generic pool of
   about 25 bodies (realm 10: dragons, arch mages, liches, the Oracle, the Fountain of Blood)
   is open to most nations. Nine regional pools add mythology: Norse, Celtic, Greek, Far East,
   Middle East, Mesoamerican, Egyptian, Indian, and the Deeps [D1].
2. **Every body is a bundle of five things, sold for one price:** a body (HP, attack, size,
   abilities), free paths, a **new-path cost** (10, 20, 40, 60, or 80), a **base dominion**
   (1 to 4), and often a **scale attunement**. 64% of the bodies with a known cost carry an
   attunement [D1][C1].
3. **Four tiers set the trade-offs.** Mages: dominion 1, new path 10, median cost 100, about
   10 HP. Monsters: dominion 2, new path 80, median 210, about 125 HP. Titans: dominion 3, new
   path 60, median 250, about 90 HP. Statues and idols: dominion 4, new path 40, median 175,
   mostly immobile [D1][C1][W1]. A mage god is cheap to make broad, a monster is expensive to
   branch, and a statue buys dominion and scales but cannot walk.
4. **Costs rise with depth.** A path level is priced by how many you have added: the n-th
   costs 8n, and the first level of a path the body lacks costs its new-path cost instead.
   Dominion candles cost 7n. Scale clicks cost or refund 40. Dormant gives +150 and
   Imprisoned +350 on a 450 budget [M3]. These rules reproduce the manual's own Carrion Dragon
   example exactly (192 for magic, 42 for dominion 2 to 5).
5. **Dom6 blesses are a menu.** Bless points are the sum of (level − 1) over all paths, plus
   any national bonus. An effect costs the sum of its path requirements [M3][W2]. Effects that
   need 5 or more in one path are **incarnate**: they work only while the god is awake and
   alive [W2]. This ties the sleeper trade-off to the bless choice. The menu has about 90
   effects across 9 paths, and some also require a scale [M3].
6. **The highlight is the strategy space, not the picture.** The community names Scales,
   Bless, Expander (super combatant), Specific-spell, and Rainbow-mage builds [W3]. Each is a
   different reading of the same price list. The design steps are form, magic, dominion and
   scales, awakening, and a name; Dominions has no cosmetic customization beyond the name
   [M3].
7. **The pretender's body depends on dominion.** For each level of friendly dominion where it
   stands, a pretender gets +10% HP, +1 strength, and +½ magic resistance, and the same
   amounts are lost per level of enemy dominion [M3][M8]. A pretender with no friendly
   dominion anywhere is eliminated (the Tinkerbell effect) [M8].
8. **Death is a setback, not an end.** A dead god loses one path level or one candle. Priests
   can call it back with about 50 priest-level points. Immortal bodies reform in about three
   months, and dominion-immortal ones (the Phoenix) only if they die in friendly dominion
   [M3].
9. **Two frictions are documented.** Players use outside calculators to find the cheapest
   body for a set of paths [C1]. The bless formula leaves a god "exactly at" a requirement
   unable to afford it, which a Steam thread calls feel-bad and a reply calls intended [S1].

**What to take into Fluid Magic** (details in section 7)

| # | Take | Mechanism in FM | Cost | When |
|---|------|-----------------|------|------|
| 1 | Tiers: body, new-color premium, and base dominion move together | Per-chassis `newColorFirstPip` (data); tiers for base dominion | Data only | M1 |
| 2 | More chassis per color, mythic and color-true | New chassis records using existing fields (flying, stealthy, immobile, berserk, regeneration, fireShield, breath, base pips, `dominionFactor`, `pipDiscount`) | Data only | M1: 2 to 4 more for R and G; M2: W, U, B |
| 3 | Scale attunement | Steps toward an attuned pole cost the own-color price (N6) | Tiny | M1 |
| 4 | Start sites | A chassis adds springs of its color to the capital (N5) | Tiny | M1 |
| 5 | Signature abilities on events: battle-start summons, fear auras, heat auras, death explosions, monthly effects | One trigger wrapper that fires existing primitives (N1) | Small, new | M1 stretch (battle start and round start only), M2 for the rest |
| 6 | Immortal and dominion-immortal gods | `reform` on chassis (N3) | Small, new | M1 stretch or M2 |
| 7 | A bless menu with bless points and incarnate effects | `BLESS_EFFECTS` data, a design field, and the incarnate check (N8) | Medium | M2, or M1 for R and G if Phase 9 can host it |
| 8 | Dragons that are mages until wounded | `shapeChange` (N2) | Medium, new | M2 |
| 9 | Pretender HP and strength set by dominion | A battle-setup rule (N7) | Small | M2 (Phase 12 candidate) |
| 10 | Priests' smite colored by the god's top color | Holy spell variants built from existing primitives | Data only | M2 |

Every ability in rows 5, 6, and 8 is also a set-piece in the replay: a transformation, a
summoning circle at round 0, a fear ripple, a heat shimmer, a death blast, or a god reforming
at its capital (section 7.6).

---

## 1. Method and source quality

- **Rules** come from the Dominions 6 manual, read in full from the community web edition
  [M3][M4][M6][M7][M8]. The local copy matches the published source byte for byte.
- **Chassis data** comes from the Dom6 game data tables published by the dom6inspector
  project [D1]: `BaseU.csv` (stats, paths, `pathcost`, `startdom`, abilities),
  `realms.csv`, `pretender_types_by_nation.csv`, `unpretender_types_by_nation.csv`,
  `attributes_by_nation.csv` (attribute 289, home realm), and `nations.csv`. Availability
  per nation follows the inspector's own logic in `MNation.js` [D2]: home realms, plus added
  gods, minus removed gods.
- **Point costs** are not in the game tables: most pretenders have `basecost` 10000, meaning
  the cost is calculated by the game. Costs come from the community calculator's hand-kept
  table for Dom6 6.32 [C1]. It agrees with the manual on the Phoenix (110). It shows the
  Carrion Dragon at 180 where the manual's example says 160, so costs drift between patches.
  Treat individual costs as approximate. The tier medians are robust.
- **Strategy and bless details** that are not in the manual come from illwiki and Steam.
  Those sites were not reachable from this environment, so those claims rest on search-engine
  excerpts of the pages. They are marked "(excerpt)" in Sources.
- **Reproducible**: the downloaded tables are in `pretender-design/web/`, and the scripts are
  in `pretender-design/tools/` (`avail.py` for availability, `join.py` for costs and
  archetypes, `freq.py` for ability frequencies, `builds.py` for Dom6 build costs,
  `fmbuilds.py` for FM build costs). `builds.py` reproduces the manual's worked example.

---

## 2. Dominions 6 pretender design rules (Dom5 differences noted)

### 2.1 The budget

| Step | Rule | Source |
|------|------|--------|
| Budget | 450 points | [M3] |
| Physical form | The chassis cost is subtracted first; the nation limits which forms are available | [M3] |
| Magic | The n-th level you add in a path costs 8n (8, 16, 24, ... 80). The first level of a path the chassis lacks costs the chassis's **New Path Cost** instead. Counting is per path and by levels added, so starting paths are a discount. | [M3] |
| Dominion | The n-th candle above the chassis's base costs 7n (7, 14, ... 63). Range 1 to 10. | [M3] |
| Scales | Each click toward the favorable side costs 40, and each click toward the unfavorable side gains 40. Heat and Cold away from the nation's preference gain 40 per click for the first 3 clicks only. | [M3] |
| Awakening | Awake: 0. Dormant: +150, arrives in turns 10 to 13. Imprisoned: +350, arrives in turns 28 to 42. | [M3] |
| Bless | Bless points = Σ(level − 1) over paths, plus the national bonus. Each effect costs the sum of its path requirements. | [M3][W2] |

**Worked check** (manual example [M3]): a Carrion Dragon (D1 N1, new path 80, dominion 2)
bought to D4 N4 F2 pays 8+16+24 = 48 for Death, 48 for Nature, and 80+16 = 96 for Fire, so
192. Candles 2 to 5 cost 7+14+21 = 42. `tools/builds.py` reproduces both numbers.

### 2.2 Dominion

- Spread chance per "temple check" is `50% + 5% × max dominion`. The pretender's province gets
  one automatic increase plus two temple checks. The home province, the prophet, each temple,
  and each disciple make one temple check. A claimed Throne makes 1 to 7 [M8].
- Maximum dominion in a province is the pretender's starting dominion, plus one per
  `5 × team size` temples [M8].
- Units fighting in friendly dominion get +1 morale, and −1 in enemy dominion [M8].
- **Pretender body by dominion**: per level of friendly dominion, +1 strength, +½ magic
  resistance, and +10% HP. Per level of enemy dominion, the same amounts are lost, with HP
  floored at 10% [M3][M8].
- **Tinkerbell effect**: a pretender with no friendly dominion anywhere is eliminated [M8].

### 2.3 Scales

- There are six scales: Order/Turmoil, Productivity/Sloth, Heat/Cold, Growth/Death,
  Fortune/Misfortune, and Magic/Drain. Each click has a small, flat effect (Order: +3%
  income, +2% resources, +10% recruitment, unrest reduction +1, 2% fewer events) [M3][M8].
- Scales run from −5 to +5, but the design screen allows only ±2. **Attuned** pretenders and
  nations can tip one side by one more step, and lower the opposite side's limit to match.
  The Master Lich, attuned to Death, can reach Death 3 but Growth only 1 [M3]. In the data,
  attunement is per chassis (`moreorder`, `moregrowth`, `moremagic`, ...): 185 of 288
  costed chassis have one [D1].
- Scales spread with dominion and tip slowly: per turn, the chance is `5% × dominion + 10% ×
  gap` [M8]. Extreme values (4 or more) add side effects and spill into neighbors [M8].
- Some blesses require a scale: Winter's Gift needs Cold 1, Half Dead needs Death 2, Unaging
  needs Magic 1, Poison Weapons needs Death 1, and Luck needs Luck 2 [M3].

### 2.4 Awakening and incarnate

- The awakening refunds are 150 and 350 [M3].
- Incarnate blesses (those needing 5 or more in one path) are inactive before the god awakens
  and while it is dead [W2]. A sleeper therefore keeps its points but loses its strongest
  blesses for one to three years. The illwiki bless guide advises: "with a strong bless you
  want an awake pretender or at least dormant. Imprisoned pretenders should generally take
  only minor blesses" [W4].
- The calculator data marks three bodies with a minimum imprisonment of Dormant: Uttervast,
  Bronze Colossus, and Elephant Idol [C1]. A body can therefore be priced on the condition
  that it cannot start awake.

### 2.5 Death, immortality, and calling the god back

- On each death, a pretender loses one level in one path or one candle. The chance of losing
  magic is 50% + 10% per Nature level. Blesses keep their game-start values [M3].
- **Call God**: each priest level assigned generates one point. At about 50 points the god
  returns to its home province, or about 75 in disciple games [M3].
- **Immortal** bodies (the Master Lich) reform anywhere. **Dominion-immortal** bodies (the
  Phoenix) reform only if they die in friendly dominion. Reforming takes about three months,
  and a soul-slain god does not reform [M3].
- Dom6 changed the death penalty from "one loss in each path" to a single loss [M3].

### 2.6 Indirect magic and divine variants

- Every magic path gives passive perks: Fire +10 leadership per level, Earth 3 +3 protection,
  Death 4 +10 morale, Nature +10 supplies per level, and so on [M7].
- **Priests' spells follow the god.** If the pretender has 4 or more in a path, priests'
  Smite and Banishment are replaced by that path's version. Fire's Smite becomes Heavenly Fire
  with 10 armor-negating fire damage; Nature's becomes Word of Thorns with entanglement and
  bleeding; Death's becomes Syllable of Death [M7]. The whole priesthood takes on the god's
  color.

### 2.7 Trinities

Some pretenders are three bodies sharing magic. Apart, they lose power; each one researches.
A dead member returns in half the normal Call God time [M3]. Dom6 data has four: the Hooded
Spirit, the Grey One, and two Titan of Crossroads variants [D1].

### 2.8 What changed from Dom5

- **Paths**: Dom6 adds Glamour (illusions), for nine paths (F A W E S D N G B) plus Holy
  [M3][R1].
- **Blesses**: in Dom5, bless access began at 4 in a path [W4]. A "rainbow" pretender with
  all four elements or all four sorcery paths qualified at 3 [W3]. Dom6's
  points-for-every-level-above-1 replaces that.
- **Effect values moved.** Flaming Weapons is 6 armor-piercing fire damage and costs 6 in
  Dom5 [W7], against 8 armor-piercing in Dom6 [W2].
- **Scale limits**: Dom6 defaults to ±2 per scale, and pretenders shift those limits
  [M3][S2].

---

## 3. Blesses in detail (Dom6)

### 3.1 The menu, by path

Requirements and names are from the manual [M3]. `*` marks a passive bless (always on, no
priest cast needed). **(I)** marks an incarnate effect under the 5-or-more rule [W2]; the
manual's own bold marking was lost in the web transcription.

| Path | Effects (requirement: name) |
|------|------------------------------|
| Fire | F1 Superior Morale (+1 mor); F1+D1 Wasteland Survival*; F2 Attack Skill (+1 att); F2 Fire Resistance; F4 Inspirational Presence*; F4 Righteous Wrath; F5 Death Explosion (I); F5 Heat Aura (I); F6 Fire Shield (I); F7 Flaming Weapons (I); F8+S4 Unbearable Splendour (I) |
| Air | A1 Precision (+1); A2 Shock Resistance; A2 Farshot; A3 Awareness; A4 Swiftness; A4 Storm Flight; A5 Wind Walker* (I); A5+E1 Weightlessness (I); A6 Air Shield (I); A7 Thunder Weapons (I); A8 Charged Bodies (I); A9 Flight (I) |
| Water | W1+Cold1 Winter's Gift*; W1+N1 Swamp Survival*; W2 Cold Resistance; W2 Swimming*; W2 Defense Skill (+1 def); W5 Chill Aura (I); W5 Slow Weapons (I); W6+F2 Vitriol Weapons (I); W6 Water Breathing* (I); W7+Cold1 Frost Mist Weapons (I); W9+Magic1 Quickness (I) |
| Earth | E1 Mountain Survival*; E2 Reinvigoration; E2 Strength of the Earth (+1 str); E4 Unbreakable; E4+N3 Larger*; E5 Reconstruction (I); E5 Resilience of the Earth (I); E6 Hard Skin (I); E7 Fortitude (I) |
| Astral | S1 Arcane Command*; S2 Magic Resistance (+1); S3+D1 Spirit Sight; S3+F1 Solar Weapons; S4 Far Caster; S4 Arcane Finesse; S5 Magic Weapons (I); S6 Twist Fate (I); S7+Misfortune1 Fateweaving (I); S8+Magic2 Etherealness (I) |
| Death | D1 Undying; D1 Undead Command*; D2+Death2 Half Dead; D3 Mending Bones*; D4 Withering Weapons; D5 Stygian Flesh (I); D6 Reforming Flesh (I); D7 Reanimators (I); D8 Death Weapons (I); D8 Fear (I) |
| Nature | N1 Resilient (+1 HP); N1 Low Light Vision; N2 Poison Resistance; N2 Forest Survival*; N3+Magic1 Unaging*; N4+Death1 Poison Weapons; N5 Recuperation* (I); N5 Berserker (I); N6 Barkskin (I); N7 Regeneration (I) |
| Glamour | G1 Undreaming*; G1 Heroism*; G2 Quiet Stride*; G3 True Sight*; G3 Blur; G6 Obfuscate* (I); G6+F2 Awe (I); G7 Displacement (I); G7 Dread (I); G8+Luck2 Luck (I) |
| Blood | B1 Strong Vitae (+1 HP); B2 Strength of the Flesh (+1 str); B3 Strong Blood; B4 Enchanted Blood; B4 Blood Surge; B5 Blood Bond (I); B6 Unholy Weapons (I); B7 Blood Vengeance (I); B8+D4 Vampiric Weapons (I) |

Every blessed unit also gets +1 morale, plus the effects of any Thrones its nation has
claimed. Pretenders and disciples are sacred and are blessed automatically inside their own
dominion [M3].

### 3.2 How the effects behave (examples with numbers)

- **Righteous Wrath (F4)**: when a sacred unit within 2 squares dies, nearby blessed units
  get +3 attack, +3 strength, and +6 morale for a time [W2][S4].
- **Flaming Weapons (F7, incarnate)**: 8 armor-piercing fire damage on each hit [W2].
- **Stat blesses come in sizes**: according to a forum summary, the cheap version gives +1 for
  2 points, against +2 for 3 points for the larger one (attack, defense, MR) [S3].
- **Four kinds of bless**: incarnate and cast by priests (most majors), incarnate and passive,
  non-incarnate and cast, non-incarnate and passive [S3].

### 3.3 The friction

In a January 2024 thread, a player with an F8 S4 god could not afford Unbearable Splendour,
which requires F8 + S4 and costs 12. The god had only (8−1) + (4−1) = 10 points, because the
first level of each path gives none. A reply calls this "working as designed". The thread
treats it as a fair complaint that it feels bad, and a mod exists that gives every nation +3
points [S1]. **Lesson for FM**: if FM adopts points, the formula should let a mono-color god
afford one effect at its own pip level (section 7.4).

---

## 4. Chassis catalog

### 4.1 Size and distribution

- **104 nations, 298 distinct pretender bodies, 55 per nation on average** (minimum 1,
  maximum 113) [D1].
- **The generic pool** (realm 10), with the number of nations offering each body: Earth
  Serpent 103; Demilich 99; Master Lich 96; Ghost King 95; five path dragons 80 to 83 each
  (Fire, Water, Nature, Air, Earth); Arch Mage (F1), Crone, Great Enchantress, Master
  Enchanter, and Great Sage 88 each; Freak Lord 86; Solar Eagle 85; Fountain of Blood 84;
  Raven of the Underworld 79; Dracolich 78; Oracle 70 [D1].
- **Regional pools** carry the culture: realm 1 Norse (Wyrm, Irminsul, the Idols), 2 Celtic
  (Great Mother, Monolith, Horned One), 3 Greek (37 titans and statues), 4 Far East (Dragon
  King, Nyorai, the Four Symbols), 5 Middle East (Annunaki, Sphinx, Betyls, God Block), 6
  Mesoamerica (Teotls), 7 Egypt (Neters, Phoenix, Monument), 8 India (Devi, Nataraja), and 9
  the Deeps (Kraken, Drakaina) [D1].
- **Pretenders hold the field.** 283 of 288 costed bodies have morale 30, and five have 50.
  281 have magic resistance 18 [D1]. A god is a commander that rarely breaks. In FM, only the
  Monolith has morale 50; the other bodies have 10 to 20.

### 4.2 The four tiers

Bodies grouped by base dominion and new-path cost. Costs are from [C1], stats from [D1].

| Tier | Base dominion | New path | Count | Cost median (range) | HP median | Free path levels (median) | Notes |
|------|---------------|----------|-------|---------------------|-----------|---------------------------|-------|
| Mages | 1 | 10 (some 20 to 40) | 51 | 100 (80 to 270) | 10 | 1 | Cheap and fragile. Branching into new paths costs almost nothing. |
| Monsters | 2 | 80 (some 40 to 60) | 98 | 210 (80 to 330) | 125 | 2 | Strong bodies with locked magic; most have research −8 |
| Titans | 3 | 60 | 102 | 250 (170 to 380) | 90 | 3 | Humanoid giants, two or three paths, a mix of body and magic |
| Statues and idols | 4 | 40 | 37 | 175 (110 to 390) | 120 | 3 | 30 of 37 immobile: dominion and scales engines |

The illwiki Dom6 page describes the same tiers: dominion-1 chassis are "humanoid mages" that
mostly pay 10 for a new path, monsters 80, titans 60, and statues 40 [W1]. The Dom5 chassis
guide gives the same dominion tiers (mages 1, monsters 2, titans 3, idols 4, rarely more than
one candle off). It ranks monsters first for physical power, then titans, and calls idols hard
to destroy [W5].

### 4.3 Archetypes

Columns: point cost [C1]; free paths; new-path cost (NP); base dominion (Dom); HP, protection,
and strength; abilities from the game data [D1]; and the number of nations that may take the
body (#N) [D1]. Path letters: F fire, A air, W water, E earth, S astral, D death, N nature,
G glamour, B blood.

**Mages** (the "Arch Mage" family; dominion 1, new path 10)

| Body | Cost | Paths | NP | Dom | HP/prot/str | Abilities | #N |
|------|------|-------|----|-----|-------------|-----------|----|
| Arch Mage | 90 | F1 | 10 | 1 | 10/0/10 | elemental range +1 | 88 |
| Crone | 90 | D1 | 10 | 1 | 10/0/9 | none | 88 |
| Great Enchantress | 100 | G1 | 10 | 1 | 9/0/8 | 1 Glamour gem a month | 88 |
| Master Enchanter | 100 | N1 | 10 | 1 | 10/0/10 | stealth, sorcery range +1 | 88 |
| Great Sage | 110 | S1 | 10 | 1 | 10/0/10 | research +15 | 88 |
| Freak Lord | 100 | B1 | 10 | 1 | 10/0/10 | crossbreeder | 86 |
| Frost Father | 100 | A1 W1 | 10 | 1 | 10/0/10 | cold aura 10 | 55 |
| Master Alchemist | 90 | E1 | 10 | 1 | 10/0/10 | alchemy | 8 |
| Great Sorceress | 120 | D1 G1 | 10 | 1 | 13/0/12 | stealth, spellsinger | 4 |

**Dragons by path** (shown as a wizard until wounded or ordered to change [M3]. In the data,
the dragon form carries +2 in its own path and −2 in all paths, so its own path is unchanged
and every other path drops by 2 [D1]. The wizard form has about 10 HP.)

| Body (wizard form) | Cost | Paths | NP | Dom | Dragon form HP/prot/str | Abilities (dragon form) | #N |
|--------------------|------|-------|----|-----|-------------------------|--------------------------|----|
| Fire Dragon (Arch Mage) | 260 | F2 | 80 | 2 | 125/18/25 | flying, fear 10, fire resistance, Heat attunement | 83 |
| Water Dragon (Frost Father) | 260 | W2 | 80 | 2 | 125/18/25 | flying, fear 10, cold resistance, Cold attunement | 80 |
| Nature Dragon (Master Enchanter) | 260 | N2 | 80 | 2 | 125/18/25 | flying, fear 10, poison resistance | 83 |
| Air Dragon (Storm Father) | 260 | A2 | 80 | 2 | 125/18/25 | flying, fear 10, storm power 3, Turmoil attunement | 83 |
| Earth Dragon (Great Sage) | 260 | E2 | 80 | 2 | 125/18/25 | flying, fear 10, acid resistance | 83 |
| Dracolich (Master Lich form) | 220 | D2 | 80 | 2 | 180/9/27 | flying, fear 15, undead, invulnerable 20 | 78 |
| Carrion Dragon (Carrion Lord) | 180 | D1 N1 | 80 | 2 | 200/11/27 | fear 15, undead, Growth and Magic attunement | 4 |
| Sea Dragon (Great Seer of the Deeps) | 140 | W2 | 80 | 2 | 150/22/28 | fear 10, trample, aquatic | 12 |
| Dragon King, Celestial Dragon (Celestial Bureaucrat) | 200 | W2; A1 S1 | 60 | 2 | 77/17/20 | flying, fear 5 | 6 |
| Azi (Great Warlock) | 260 | F1 D1 | 80 | 2 | 125/18/25 | flying, fear 10, chaos power 2 | 7 |

**Immobiles** (statues, monoliths, fountains, idols; dominion 4, new path 40, cannot move but
can be teleported, except the Monument, Geyser, and God Block, which are too large [M3])

| Body | Cost | Paths | Dom | HP/prot | Abilities | #N |
|------|------|-------|-----|---------|-----------|----|
| Monolith | 210 | E1 S1 N1 | 4 | 200/28 | immobile | 60 |
| Oracle | 160 | W2 G1 | 4 | 30/25 | immobile, blind, fewer bad events | 70 |
| Fountain of Blood | 130 | B3 | 4 | 30/22 | immobile, fear 20, Turmoil and Magic attunement | 84 |
| Demilich | 170 | D3 | 3 | 3/0 | immobile, **immortal**, invulnerable 30 | 99 |
| Sacred Geyser | 160 | F1 W2 | 4 | 200/25 | immobile, heat aura 6 | 58 |
| Monument | 150 | E2 S1 | 4 | 500/30 | immobile, Order attunement | 29 |
| Statue of Order / of War / of Fertility / of the Underworld | 150 to 180 | E1 S2; F2 E1; E1 N2; D3 | 4 | 100 to 120/25 | immobile, attuned to Order, Turmoil, Growth, Death | 32 / 34 / 30 / 37 |
| Idol of Men / of Beasts / of Sorcery | 170 to 190 | F1 A1 N1; A1 N2; S1 D1 G1 | 4 | 120/20 | immobile; Beasts summons a Jotun wolf at battle start; Sorcery has Magic attunement | 21 to 25 |
| Irminsul (world tree) | 140 | N3 | 4 | 250/20 | immobile, ivy lord, **start site** | 24 |
| Crystal Soul | 210 | E1 G2 | 4 | 300/28 | immobile, **start site**, Magic attunement | 10 |
| God Block | 120 | E3 | 4 | 350/25 | immobile, cannot be teleported | 18 |
| Baphomet | 150 | F1 S1 B1 | 4 | 100/0 | immobile, ethereal, fire shield 14, heat aura 15 | 7 |
| Void Lurker | 130 | S3 | 4 | 130/2 | immobile, ethereal, Magic attunement | 3 |
| Polypal Queen | 160 | W1 S2 | 4 | 180/9 | immobile, spawns Polypal Spawn in its dominion over time (`domsummon2`) | 1 |

**Risen and reborn** (undead and immortals; "rising ones" is read as these)

| Body | Cost | Paths | NP | Dom | HP/prot/str | Abilities | #N |
|------|------|-------|----|-----|-------------|-----------|----|
| Master Lich | 260 | D3 | 40 | 2 | 30/5/15 | **immortal** (reforms anywhere), invulnerable 25, undead | 96 |
| Lich Queen | 180 | D3 | 40 | 2 | 18/5/12 | immortal, invulnerable 25 | 21 |
| Grand Saurolich | 260 | D3 | 40 | 2 | 33/7/15 | immortal, invulnerable 25 | 3 |
| Ghost King | 190 | D1 | 20 | 2 | 35/0/14 | ethereal, stealth, fear 10, cold aura, **raises Ghosts in its dominion over time** (`domsummon20`) | 95 |
| Vampire Queen | 270 | D1 B2 | 40 | 1 | 16/0/13 | flying, immortal, stealth | 3 |
| Bog Mummy | 260 | D1 B1 | 40 | 2 | 65/5/24 | immortal, fear 5, invulnerable 20 | 5 |
| Phoenix | 110 | F1 A1 | 80 | 2 | 36/5/12 | flying, **dominion-immortal**, heat aura 3, fire power | 30 |
| Titan of the Spring | 210 | D2 N1 | 60 | 3 | 78/3/20 | immortal and dominion-immortal, spring power | 22 |
| Risen Oracle | 240 | E1 D1 | 60 | 2 | 95/1/25 | immortal, fear 5 | 3 |
| Worm Soul | 240 | N3 | 40 | 2 | 10/0/12 | immortal, regeneration, invulnerable 15 | 1 |

**Titans** (dominion 3, new path 60; the most numerous tier)

| Body | Cost | Paths | HP/prot/str | Abilities | #N |
|------|------|-------|-------------|-----------|----|
| Great Mother | 270 | E1 N2 | 185/6/20 | regeneration 10%, trample, Growth attunement | 55 |
| Titan of War and Wisdom | 270 | A1 E1 S1 | 85/3/20 | fear 5, Order attunement | 22 |
| Titan of Heaven | 230 | A2 E1 | 90/3/26 | storm power 3, Order attunement | 21 |
| Titan of the Forge | 240 | F1 E2 | 90/3/26 | forge bonus 20%, Productivity attunement | 28 |
| Lord of the Desert Sun | 240 | F2 N1 | 90/3/24 | **summons 1d6 Great Lions at battle start**, Heat attunement | 18 |
| Horned One | 220 | N3 | 95/8/26 | stealth, berserk, **1d6 boars and 2d6 wolves at battle start**, beastmaster | 21 |
| Lord of the Wild | 250 | N2 B1 | 90/8/25 | stealth, berserk, beastmaster | 17 |
| Nataraja | 260 | F1 E1 S1 | 84/3/22 | fire shield 10 | 15 |
| Solar Disc | 190 | F3 | 50/0/20 | flying, fire shield 14, heat aura 10, local sun | 16 |
| Neter of the Sun | 250 | F2 S1 | 95/3/24 | awe 3, Heat attunement | 20 |
| Son of Niefel, Father of Winters | 240 to 250 | W2 D1; A1 W2 | 88 to 90/3 to 8/22 to 28 | cold aura 15, Cold attunement | 4 / 18 |
| Titan of the Underworld | 230 | E1 D2 | 90/3/24 | stealth, assassin | 25 |
| Mother of Monsters | 240 | D1 N1 B1 | 110/10/20 | poison cloud 8, **spawns random monsters in its dominion over time** (`domsummon20`), crossbreeder | 28 |
| Son of the Fallen | 220 | B3 | 105/6/25 | fear 5, **kills population where it stands** (120) | 6 |

**Monsters** (dominion 2, new path 80; most have research −8)

| Body | Cost | Paths | HP/prot/str | Abilities | #N |
|------|------|-------|-------------|-----------|----|
| Earth Serpent | 240 | E2 | 210/20/28 | fear 5, Sloth attunement | 103 |
| Wyrm | 220 | W1 E1 | 160/15/25 | regeneration 10%, fear 5 | 39 |
| Celestial Gryphon | 150 | A2 | 135/12/25 | flying, fear 5 | 45 |
| Man-Eater | 210 | E1 B1 | 155/14/27 | flying, fear 10, kills population (100), Turmoil attunement | 47 |
| Golden Lion | 240 | F1 N1 | 152/13/27 | fear 5, invulnerable 25 | 39 |
| Great White Bull / Great Black Bull | 200 | E1 N1 / N1 B1 | 181 to 183/12/30 | trample, berserk, supply +100, Growth attunement | 41 / 32 |
| Sphinx | 200 | S1 G1 | 121/12/24 | flying, fear 5, Magic attunement | 38 |
| Solar Eagle | 240 | F1 A1 | 108/11/23 | flying, awe 3, patrol and siege bonus | 85 |
| Raven of the Underworld | 120 | D2 | 77/10/23 | flying, stealth, fear 5, dark power 4 | 79 |
| Serpent of Chaos / Solar Serpent | 210 / 160 | D2 / F2 | 155 to 172/15/25 to 26 | regeneration 10%, fear 10 or awe 3 | 19 / 19 |
| Devourer of Souls | 170 | E1 D1 | 161/15/28 | fear 15 | 3 |
| Moloch | 330 | F2 B1 | 66/20/21 | flying, fear 5, heat aura 3, demon | 19 |
| Gorgon | 240 | E2 N1 | 30/9/13 | flying, fear 10, petrifies attackers | 17 |

**Spirits** (ethereal or "magic being" bodies, usually dominion 2)

| Body | Cost | Paths | HP/prot | Abilities | #N |
|------|------|-------|---------|-----------|----|
| Virtue | 270 | F1 A2 | 39/0 | flying, awe 5, invulnerable 25, Order attunement | 11 |
| Bodhisattva of Mercy | 250 | S1 G2 | 33/0 | flying, awe 5, heals the army, unrest −10, Order attunement | 7 |
| Ahura of the Oath | 260 | F2 S1 | 49/1 | flying, awe 5, invulnerable 15, 1 Fire gem a month | 4 |
| Spenta Mainyu | 260 | A1 S2 | 49/1 | ethereal, awe 5, **teleport** | 4 |
| Uttervast | 300 | S3 | 107/0 | ethereal, teleport, damage reversal; **must start at least dormant** | 2 |
| Firstborn of the Smokeless Flame | 260 | F2 A1 | 58/3 | flying, ethereal, fire shield 12, heat aura 5 | 2 |

**Abominations and devourers**: Mother of Monsters (spawns monsters, poison cloud), Son of the
Fallen and Man-Eater (eat the population), Devourer of Souls (fear 15), Fountain of Blood
(fear 20), Freak Lord (crossbreeds monsters), and King in Yellow (190, S2 G1, fear 5, Magic
attunement) [D1].

**Trinities**: Hooded Spirit (280, W1 E1 N1, ethereal, stealth 65, supply +150), Grey One
(110, W1 D1 G1, three mage sisters), Titan of Crossroads (350, S1 D1 N1, battle-start
summons) [D1][C1].

### 4.4 Ability frequency across 288 costed bodies [D1][C1]

| Ability | Share | Ability | Share |
|---------|-------|---------|-------|
| Scale attunement | 64% | Ethereal | 5% |
| Fear | 25% | Immortal or dominion-immortal | 5% |
| Flying | 22% | Heat or cold aura | 5% |
| Research penalty (monsters) | 16% | Supply bonus | 4% |
| Summons at battle start | 15% | Regeneration | 3% |
| Stealthy | 11% | Trample | 3% |
| Immobile | 11% | Gem (mana) income | 3% |
| Shapechange or second form | 9% | Research bonus | 3% |
| Awe | 8% | Start site, population kill, fire shield | 2% each |
| Invulnerable | 7% | Teleport, berserk | 2% each |

The four abilities that most often give a body its feel are attunement, fear, flying, and
battle-start summons. All four map well onto FM (section 7.2).

### 4.5 Ability semantics (manual)

- **Fear +N**: enemies in the area take a morale check against 10, or rout. +N widens the area;
  each full +5 adds 1 to the check [M4].
- **Awe +N**: an enemy must pass a morale check against 10 + N before it may attack the unit
  [M4]. It is resolved as an early strikeback, before the attack roll [M6].
- **Heat and Chill**: auras of heat or frost clouds over 3 squares, scaled by the Heat/Cold
  scale [M4].
- **Ethereal**: 75% of non-magical strikes miss, and ethereal units pass fort walls [M4].
- **Trample**: the unit displaces smaller units. Each one must pass a defense check against
  3d6 or take 7 + size armor-piercing damage [M4].
- **Regeneration**: the unit heals part of its HP each round [M4].
- **Berserker**: when wounded, the unit goes berserk on a morale check against 12 and fights
  to the death [M4].

---

## 5. Why the choice is a highlight: strategies and how cost balances them

### 5.1 The build families

illwiki's Dom5 archetypes are Scales, Bless, Expander, Specific-spell, and Rainbow, and most
good gods mix two of them [W3]. "Full Scales" builds belong to nations that can expand without
an awake god. MA Ulm and C'tis are named as nations that max scales with an imprisoned god
[W3]. The costs below are computed with the Dom6 rules (section 2.1) and the costs in [C1],
using `tools/builds.py`.

| Strategy | Example Dom6 build | Cost | What it buys |
|----------|--------------------|------|--------------|
| **Bless rush** (awake) | Neter of the Sun (F2 S1, 250) → F7 S2, dominion 5, one scale click | 250 + 120 + 8 + 21 + 40 = **439 of 450** | 7 bless points: Flaming Weapons (F7), incarnate, so the god must be awake. The sacreds hit early and hard. |
| **Super combatant** (expander) | Earth Serpent (E2, 240, 210 HP) → E5, dominion 4, 3 clicks | 240 + 48 + 21 + 120 = **429 of 450** | A god that clears independents from turn 1, with Earth self-buffs. It is weaker in enemy dominion (section 2.2). |
| **Mage god / rainbow** (dormant) | Arch Mage (F1, 90, new path 10) → level 2 in all 9 paths, dominion 5, 5 clicks | 90 + 216 + 70 + 200 = **576 of 600** | Research, items, and site searching in every path, plus 9 bless points of minor blesses. Cheap because new paths cost 10. Rainbow variants exist for site searching, forging, and research [W6]. |
| **Scales sleeper** (imprisoned) | God Block (E3, 120) → E4, dominion 10, ±2 on all six scales | 120 + 8 + 147 + 480 = **755 of 800** | The best economy and the fastest dominion. No incarnate blesses for about 3 years. |
| **Dominion push** (awake, immobile) | Statue of Fertility (E1 N2, 170) → N4, dominion 9, 3 clicks | 170 + 24 + 105 + 120 = **419 of 450** | Fast dominion and Growth from home. It cannot move, but it is cheap. |

Two more patterns from the guides:

- **Wake only if it pays.** Wake the god only for a strong incarnate bless for the sacreds, or
  for a body that can take provinces with little preparation [W4][S5].
- **Dominion floor.** "Generally you want a strength of at least 5 so you don't get dominion
  killed." Nations that rely on capital-only sacreds want 6 to 8 [W4].

### 5.2 The balancing levers

What keeps those five families comparable on one price list:

1. **Body against branching.** The new-path cost rises with body strength: 10 for mages, 40
   for statues, 60 for titans, 80 for monsters. A monster cannot cheaply become a mage god,
   and a mage cannot buy a body.
2. **Body against dominion.** Base dominion falls as mobility and fighting power rise: 4 for
   immobiles, 3 for titans, 2 for monsters, 1 for mages. With candles at 7n, low-dominion
   bodies pay more for the same candle count.
3. **Depth is escalating.** At 8n per added level, the fifth added level costs 40. Incarnate
   majors need 5 or more in one path, so depth is the price of a big bless.
4. **Time against points.** Awakening refunds 150 or 350, but incarnate blesses stay off
   until the god arrives. A few bodies must sleep (minimum imprisonment) [C1].
5. **Scales are self-funding.** Taking bad scales refunds 40 per click, and attunement extends
   one side's limit by one.
6. **The body depends on dominion.** HP and strength rise or fall with local dominion, so a
   super combatant is strong at home and weak on enemy soil.
7. **Risk.** Death costs a path level or a candle and the time to call the god back.
   Immortality is part of the chassis price.
8. **Weak sides in the body.** Monsters research at −8. Immobiles cannot leave home. Mages
   have about 10 HP.
9. **The nation decides what is worth buying.** A bless is only as good as the nation's
   sacreds, and illwiki's advice is to build for the nation's strengths [W4][S5].

### 5.3 What players praise and where they stumble

- Players praise the variety. Community posts on Dom6's new content single out bodies such as
  the three-path Devi of Strength riding a tiger and the Crystal Soul, an immobile god that
  brings a gem-producing site [S7]. Reviewers compare the new Glamour path to Pokémon adding
  the Fairy type [R1]. The store page presents dominion as what empowers the god's sacred
  warriors, and as what the god dies without [S6].
- **Opacity**: a community calculator exists to answer "which chassis is cheapest for these
  paths, scales, and dominion". It has a bless-point optimizer and an AI-pretender exporter,
  and its changelog tracks patch-by-patch cost changes [C1].
- **Feel-bad pricing**: the bless-point thread (section 3.3) [S1].

---

## 6. Fluid Magic today against Dominions 6

| Lever | Dominions 6 | Fluid Magic now (`docs/05`, `costs.ts`) | Comment |
|-------|-------------|-----------------------------------------|---------|
| Budget | 450 | 400 | Comparable |
| Chassis cost | 80 to 390, median 210 | 20 to 220 (6 bodies) | Comparable share of the budget |
| Chassis count | 55 per nation from 298 | 6 for everyone, 2 highlighted per nation | The main gap |
| Path or pip price | n-th added level costs 8n. 1 → 6 in a starting path: 8+16+24+32+40 = 120. 0 → 6 in a new path: new-path cost + 160 (170 for a mage, 240 for a monster). | Levels 1 to 6: 40, 20, 25, 30, 35, 40 (190 from 0 in the nation's color, 210 in a new color) | FM front-loads the first pip, then rises; similar totals |
| New color premium | Per chassis: 10, 20, 40, 60, or 80 | Flat 60 (Oracle 50) | **Make it per chassis** (section 7.5) |
| Base dominion | 1 to 4 by tier | 1 to 4 (Oracle 1, Colossus 1, Titan, Wyrm, and Spirit 2, Monolith 4) | Already tiered; align it with the body tiers |
| Dominion price | 7n per candle (1 → 10 = 315) | 30 flat (1 → 10 = 270) | FM's flat price makes the first candles dear and the last ones cheap |
| Scales | Six axes, ±40 a click, unfavorable clicks refund, ±2 limit, attunement | Five two-colored axes, 20 or 40 a step by nation color, no refunds, ±3 | FM's poles both have value, so no refunds is consistent |
| Awakening | +150 / +350 | +150 / +350 (days 330 / 1050) | Same |
| Bless | Points Σ(level−1), a menu of about 90 effects, incarnate at ≥ 5 in a path | Fixed per color at ≥ 4 pips, doubled at 6; no menu, no incarnate | **The big depth gap** (section 7.4) |
| Pretender is sacred | Yes, auto-blessed in own dominion | No (`docs/05` decisions) | An open question for FM |
| Body by dominion | ±10% HP and ±1 str per level | None | Proposed N7 |
| Death | Lose a path level or a candle; Call God; immortals reform | Gone for good in M1 | Proposed N3 (reform) |
| Signature abilities | Fear, awe, auras, battle summons, start sites, attunement, shapechange, immortality | Flying, stealthy, immobile, regeneration, fire shield, breath, Monolith checks ×2, Oracle discount | Section 7.2 |
| Divine variants | Smite and Banishment follow the god's top path ≥ 4 | Priests know only Bless | Section 7.2 |

**FM's current builds** (Red nation, computed with FM's rules using `tools/fmbuilds.py`; the
first row reproduces the Warlord preset's 385):

| Strategy | FM design | Cost |
|----------|-----------|------|
| Bless rush | Titan R4, dominion 5, Fury 3, Turmoil 2, awake | 120 + 75 + 90 + 100 = 385 of 400 |
| Double bless | Titan R6, dominion 3, Fury 3, awake | 120 + 150 + 30 + 60 = 360 of 400 |
| Super combatant | Great Wyrm R3, dominion 4, Fury 3, awake | 220 + 25 + 60 + 60 = 365 of 400 |
| Mage god | Oracle R6 G2, dominion 4, Fury 2, dormant | 20 + 130 + 60 + 90 + 40 = 340 of 550 |
| Dominion push | Living Monolith R1, dominion 10, Fury 3, Turmoil 3, awake | 60 + 40 + 180 + 120 = 400 of 400 |
| Scales sleeper | Living Monolith, dominion 10, ±3 on all five scales, imprisoned | 60 + 180 + 480 = 720 of 750 |

FM already supports all five families. It lacks **choice inside each family**: which bless,
which body flavor, which signature ability, which risk profile. Dominions gets that from the
number and variety of bodies and the bless menu.

---

## 7. Mapping onto Fluid Magic

### 7.1 Dominions paths to FM colors

These follow the MTG pie in `docs/02` section 1. G never flies, evades, or has precision.
R never defends. W never deals big damage, summons monsters, or steals. U never heals or
has raw brawn. B never heals the living or buffs protection.

| Dominions | FM color | Notes |
|-----------|----------|-------|
| Fire | R | Fire shield, heat aura, flaming weapons, death explosion, righteous wrath |
| Nature | G | Regeneration, barkskin, beasts, supply; Dom's flying nature dragon becomes a wingless wyrm |
| Earth | G (strength, hard skin, size), W (unbreakable, order statues) | |
| Water, Air, Glamour | U | Cold aura, quickness, air shield, storm, illusions, blur, stealth, teleport |
| Astral | U (research, magic) and W (solar, twist fate, magic resistance) | |
| Death | B | Undead, fear, withering, reform, liches |
| Blood | B, with R for fury and blood surge | |
| Holy | W, plus every nation's priests | |

### 7.2 Abilities and archetypes onto FM mechanics

Status key: **Exists** means it is in the M1 sim now. **Data** means it is a new content
record using existing fields. **N1 to N8** are the new primitives in section 7.3. **Defer**
means a new battle rule, placed in M2 or later.

| Dominions ability or archetype | FM expression | Status |
|--------------------------------|---------------|--------|
| Flying body (22%) | `flying` tag (closes in round 2) | Exists |
| Stealthy | `stealthy` tag | Exists |
| Immobile statue | `immobile` tag, `mapSpeed 0`, `dominionFactor` | Exists |
| Regeneration | `regeneration` fraction | Exists |
| Fire shield | `fireShield` (Ash Colossus) | Exists |
| Breath or ranged body attack | Ranged weapon with ammo and element | Exists (element is display only in M1) |
| Berserk (bulls, Horned One) | `berserk` tag | Exists (R color only, per the pie) |
| Free paths | `basePips` | Exists |
| Mage discount | `pipDiscount` (Oracle) | Exists |
| Tiered new-path cost | `newColorFirstPip` per chassis | Data (one field) |
| Base dominion tiers | `baseDominion` | Exists |
| Research penalty or bonus (Great Sage +15; monsters −8) | `researchFactor` on the commander (default 1) | Data plus one multiplier in research |
| Minimum imprisonment | `minAwakening` on the chassis, checked in `validatePretender` | Data plus one check |
| Scale attunement (64%) | N6 | Tiny |
| Start site (Irminsul, Crystal Soul) | N5 | Tiny |
| Gem income (Great Enchantress) | N1 `monthly` + a new ritual primitive `manaGain { color, amount }`, or N5 instead | Small |
| Supply bonus (bulls, Hooded Spirit) | N1 `monthly` + `provinceSupply` | N1 |
| Population kill (Man-Eater, Son of the Fallen) | N1 `monthly` + `provincePop` | N1 |
| Free summons in its dominion over time (Ghost King, Mother of Monsters) | N1 `monthly` + `summonToProvince` | N1 |
| Battle-start summons (15%: lions, wolves, boars, elementals) | N1 `battleStart` + `summon` | N1 |
| Fear aura (25%) | N1 `roundStart` + `moraleShock` on `enemyFront` | N1 |
| Heat or cold aura | N1 `roundStart` + `fatigueDrain` (and `damage` for heat) on `enemyFront` | N1 |
| Death explosion (F5 bless) | N1 `death` + `damage` area | N1 |
| Righteous Wrath (F4 bless) | N1 `allyDeath` + `buff` | N1 |
| Immortal or dominion-immortal | N3 | New |
| Weapon blesses (flaming, withering, poison) | N4 | New |
| Dragon wizard-to-dragon | N2 | New |
| Body set by dominion | N7 | Rule |
| Bless menu, incarnate | N8 | Data plus bless.ts |
| Divine Smite variants by top color ≥ 4 | Holy battle spells built from `damage` plus `debuff` or `moraleShock`, chosen by the pretender's top color at setup | Data plus one selection rule |
| Teleport (Spenta Mainyu) | Rift Step style movement; no primitive yet | Defer (M2, with U) |
| Awe | A morale check before a melee attack | Defer (M2, new battle rule) |
| Ethereal | 75% of non-magical strikes miss; needs a magic-weapon notion | Defer (M2) |
| Trample | Needs positions inside rows | Defer (M3 or later) |
| Petrification, swallowing | MR checks and new afflictions | Defer |
| Trinities | Three linked commanders | Defer (M3 or later) |
| Call God | A priest order that accumulates holy points | Defer (M2) |

### 7.3 New primitives, specified

Every one below is deterministic: no new randomness source, a fixed order, and rng draws in
the resolver's existing sequence. Each is data in `src/content/**` read by the sim, and each
logs replay events. Names follow the existing code.

**N1. Ability triggers.** This is a wrapper, not a new effect. It fires existing `docs/02`
primitives on events.

```ts
// content/types.ts
export type AbilityTrigger =
  | { on: 'battleStart' }            // after setup, before round 1
  | { on: 'roundStart' }             // each round, before step 1 (spellcasting)
  | { on: 'death' }                  // right after the phase that kills the unit
  | { on: 'allyDeath'; tag?: UnitTag } // end of a phase in which a friendly troop (with tag) died, once per round
  | { on: 'monthly' };               // map: first tick of each month, the unit's province
export interface UnitAbility {
  id: string;
  trigger: AbilityTrigger;
  effect: BattleEffect | RitualEffect; // battle triggers take BattleEffect, monthly takes RitualEffect
}
// UnitDef.abilities?: readonly UnitAbility[]
// New enemy target kind for auras: { kind: 'enemyFront' } = enemy groups in the row this
// unit is in contact with (none before contact).
```

- **Order**: battle abilities fire in caster order (attacker 0, defender 0, ...) and, inside
  a unit, in list order. They cost no fatigue and need no pips or research. Their effects use
  the same targeting and stacking rules as spells (a buff is not stacked on a target that
  already has it).
- **Death** abilities fire even though the unit is gone, from its last row.
- **Monthly** abilities run in the tick step that handles monthly effects. The province is
  where the unit stands, and the effect obeys the primitive's own rules (owned province, and
  so on).
- **Replay**: `ability(unitRef, abilityId, targets)`, followed by the primitive's normal
  events (`summon`, `damage`, `buff`, ...).
- **Why**: about half the Dominions bodies' signature behaviors are an existing effect on an
  event: battle-start summons (15%), fear (25%), auras, death explosions, Righteous Wrath,
  population kill, and free summons. One wrapper makes them all data, and no bespoke ability
  code is needed.
- **Tests**: a battle-start summon is on the field before round 1, and the log shows the
  event; fear forces a morale check on the engaged enemy squad every round; a death trigger
  fires once; a monthly supply ability changes supply once a month; the determinism hash
  holds with abilities present.
- **M1 stretch subset**: `battleStart` and `roundStart` only, with `summon`, `moraleShock`,
  and `fatigueDrain`.

**N2. Shapechange** (dragons, the Serpent King, Bouda, werebeasts).

```ts
export interface ShapeChange {
  form: UnitTypeId;        // the other body
  whenHpBelow: number;     // fraction, e.g. 0.5: battle trigger
  pipDelta?: Pips;         // pips added in the other form (Dom dragons: every other color −2)
  mapDays?: number;        // map command to change form at will; absent = battle only
}
```

- **Battle**: at the end of a phase, a unit whose HP is at or below `whenHpBelow × maxHp`,
  and which has not changed this battle, takes the other form's base stats, weapons, and
  tags. HP becomes `round(form.hp × hp / maxHp)`, at least 1. Lethal damage taken in the
  same phase still kills it. A wizard dragon is fragile until it changes, which is the
  Dominions trade-off.
- **Map**: a `changeShape` command takes `mapDays`. Pips follow the current form.
- **Replay**: `transform(unitRef, fromUnit, toUnit)`.
- **Tests**: the change happens at the threshold and only once; the change of stats is
  visible to later phases; same seed, same result.

**N3. Reform** (Master Lich, Phoenix, Titan of the Spring).

```ts
export interface Reform { days: number; where: 'anywhere' | 'ownDominion' }
// ChassisDef.reform?: Reform
```

- When the pretender dies, it reforms if `where` is `anywhere`, or if the province of death
  has the nation's dominion at strength 1 or more. Then `nation.pretenderReturnDay = day +
  days` is set instead of `pretenderDead`. `settlePretender` places it in the capital on that
  day by the existing arrival rules (capital held, not Godless).
- If the condition fails, the pretender is dead as today.
- Message: "X will reform in N days" or "X is destroyed".
- **Tests**: reform returns the god on the day; dominion-immortal dies for good outside its
  own dominion; a Godless nation's god waits.
- This changes the `docs/05` decision that a pretender that dies is gone for good. It is a
  rule change, priced into the chassis cost.

**N4. Weapon rider** (Flaming, Withering, Poison, Death weapons).

```ts
export interface WeaponRider { dmg: number; element: Element; armorPiercing?: boolean; armorNegating?: boolean }
// Bless.weaponRider?: WeaponRider (from the bless menu) or UnitDef.weaponRider
```

- Each melee hit that lands also deals `dmg + DRN − prot' − DRN` (at least 0) of `element`
  to the same troop in the same phase. `prot'` is halved for armor piercing and 0 for armor
  negating, as for weapons.
- Rolls come right after the hit's own damage roll.
- **Replay**: the `damage` event gets a second element entry.
- **Tests**: no rider damage on misses; armor piercing halves protection; determinism holds.

**N5. Start site** (Irminsul, Crystal Soul, Matrona, Mother of Storms).

```ts
// ChassisDef.startSite?: { color: Color; springs: number }
```

- `createGame` appends `springs` springs of `color` to the capital's springs. Mana flows
  through the existing economy.
- **Test**: capital mana income rises by the springs' output.

**N6. Scale attunement** (64% of Dominions bodies).

```ts
// ChassisDef.attunement?: readonly { axis: ScaleAxis; toward: 'positive' | 'negative' }[]
```

- A step toward an attuned pole costs `scaleStep.own` (20) even when the pole's color is not
  the nation's.
- FM keeps ±3. There is no new effect table and no refund.
- **Test**: `scaleStepCost` for an attuned pole equals `own`.
- Unlike Dominions, which extends a limit, this changes only the price. That keeps every
  scale effect FM already has.

**N7. Pretender body by dominion** (a battle-setup rule).

- In `battle/setup`, the pretender's max HP is multiplied by `1 + 0.1 × d` (at least 0.1) and
  its strength increased by `d`. `d` is the province's dominion strength when it is the
  nation's own, minus the strength when it is an enemy's.
- Starting values follow Dominions. Record them in `docs/09-balance.md`.
- **Test**: the same pretender has more HP at home than in enemy dominion.

**N8. Bless menu** (section 7.4).

```ts
export interface BlessEffectDef {
  id: string; name: string; color: Color;
  requires: Partial<Record<Color, number>>;   // pips
  requiresScale?: { axis: ScaleAxis; toward: 'positive' | 'negative'; steps: number };
  cost: number;                                 // bless points
  effect: Partial<Bless>;                       // stats, regeneration, lifeDrain, fireShield, weaponRider, ...
  ability?: UnitAbility;                        // N1, for triggered blesses
}
// PretenderDesign.blesses: readonly string[]
// incarnate = some requirement ≥ BLESS.incarnateAt (5): applies only while nation.pretenderId !== null
```

`validatePretender` checks the requirements, the scale, and the point total. `blessOf`
takes the chosen effects and the incarnate flag.

### 7.4 A bless menu for FM (shape, with starting values)

**Points.** `blessPoints = 1 + Σ max(0, pips[c] − 1)`.

- A mono-color R4 god has 4 points, so it can buy exactly one R4 effect. That is today's
  behavior, so the presets keep their bless.
- R6 gives 6 points: an R6 effect, or an R4 and an R2 effect.
- R4 G2 gives 5.
- A Dominions-style god "exactly at" a requirement can always afford one effect in its top
  color, which avoids the friction in section 3.3. A splash pip still costs 60 design points
  and gives no bless point at level 1.

**Cost** = the highest pip requirement, as in Dominions. **Incarnate** = requires 5 or more.

| Color | Minor (1 to 3) | Major (4) | Incarnate (5 to 6) |
|-------|----------------|-----------|--------------------|
| R | R1 +1 mor; R2 +1 att; R3 +2 str | **R4 Ember Wrath: +2 att, +2 str** (today's bless); R4 Righteous Wrath: N1 `allyDeath` + `buff` att +3, str +3, mor +6 for 3 rounds | R5 Fire Shield 3 (existing field); R5 Death Blast: N1 `death` + `damage` 10 fire area(5); R6 Flaming Weapons: N4 6 fire, armor piercing |
| G | G1 +2 HP; G2 +1 prot; G3 +1 str | **G4 Regrowth: regeneration 10%, +1 prot** (today's); G4 Thick Hide: +3 prot | G5 Barkskin: +4 prot; G6 Wild Vigor: regeneration 20%, +2 str |
| W | W1 +1 mor; W2 +1 MR (no effect until spells check MR); W3 +2 mor | **W4 Steadfast: +2 mor, +1 prot**; W4 Sun Strike: +1 att, double damage against undead (new rule) | W5 Twist Fate: the first hit in a battle is negated (new rule); W6 Awe 2 (Defer) |
| U | U1 +1 prec; U2 +1 def; U3 +2 prec | **U4 Clear Sight: +2 def, +2 prec**; U4 Blur: +3 def | U5 Chill Aura: N1 `roundStart` `fatigueDrain` 10 on `enemyFront`; U6 Air Shield: ranged damage halved (new rule) |
| B | B1 +1 att; B2 +2 HP; B3 Undying (first lethal blow leaves 1 HP, new rule) | **B4 Drinker: lifeDrain 2, +1 att** (today's); B4 Withering: N4 4 decay, armor negating | B5 Dread: N1 `roundStart` `moraleShock` 1 on `enemyFront`; B6 Reanimators (summon from corpses, Defer) |

- **Scale-gated blesses**, as in Dominions [M3]: e.g. B Dread requires Dread 1, and G Wild
  Vigor requires Growth 1. This ties step 4 of the design to step 2.
- **Data-only subset** for M1, if wanted: the R and G stat effects work with today's resolver
  once `hp` and `fireShield` join the `Bless` record. That is a few lines in `blessOf` and
  `battle/setup`, which already folds `regeneration` and `lifeDrain` the same way. Righteous
  Wrath, Death Blast, Flaming Weapons, Chill Aura, and Dread need N1 or N4. The rows marked
  "new rule" need battle rules that do not exist yet.
- **Open question for the synthesis**: should the pretender itself be sacred and blessed in
  its own dominion, as in Dominions? That makes a fire-shield bless on a super combatant a
  real build.

### 7.5 Cost-structure lessons

1. **Make the new-color premium per chassis**, and tie it to the body:

   | FM tier | Bodies | Base dominion | First pip of a new color |
   |---------|--------|---------------|--------------------------|
   | Seer | Oracle and future mages | 1 | 40 (with the −10 discount: 30; today 50) |
   | Titan | Titan (2 today), Ash Colossus (1 today) | 2 | 60 |
   | Beast | Wyrm, Spirit, future monsters | 2 | 80 |
   | Idol | Monolith and future statues | 4 | 50 |

   These are starting values for `docs/09-balance.md`.
2. **Minimum awakening per chassis** (`minAwakening`). The UI already "recommends dormant"
   for the Great Wyrm. Dominions shows that a hard minimum is a fair pricing tool [C1].
3. **Incarnate couples time to power.** A sleeper keeps its points but waits for its best
   bless. This gives FM's awakening step a second dimension at no UI cost.
4. **Attunement as a discount** (N6) gives a body a "personality" toward a world view: a
   Statue of Order wants Order, and a Fountain of Blood wants Dread.
5. **Monsters research badly** (`researchFactor`), so a monster god is a warrior and the
   Oracle a scholar. FM already has only the Oracle research. A factor keeps that rule and
   allows Dominions-like nuance.
6. **Dominion price**: FM's flat 30 is fine. Dominions' escalating 7n mostly guards the top
   candles. If Phase 12 finds dominion 9 and 10 too cheap, an escalating table is the lever.
7. **Show what the calculator shows**: live bless points, the "cheapest body for these pips"
   reverse search, and which effects are incarnate [C1]. That belongs to the UI spec. It is
   listed here because Dominions players needed an outside tool for it.

### 7.6 Flashy-magic hooks (for the battle presentation track)

Each Dominions-derived ability becomes a replay beat. These fit the five-beat spell grammar
and per-color particles in `battle-design/proposal-spectacle.md` and `docs/09`: Ember rises,
Loam spreads, Tide ripples, Radiance radiates, Umbra sinks.

| Ability | Replay event | Beat |
|---------|--------------|------|
| Dragon shapechange (N2) | `transform` | The wizard staggers, a color-tinted shell cracks, the silhouette swells to size 6, a roar shockwave shakes the screen, and scales or embers linger |
| Battle-start summons (N1) | `ability` + `summon` | Round 0: a summoning circle in the god's color, beasts burst from the ground (G) or fire (R) |
| Fear or Dread aura (N1) | `ability` + `moraleShock` | A dark ripple from the god each round, and enemy banners tremble |
| Heat or Chill aura (N1) | `ability` + `fatigueDrain` / `damage` | A heat shimmer or frost creep over the engaged row |
| Fire shield | existing `damage` | Each strike on the god flares, and the striker smokes |
| Death blast (N1) | `ability` + `damage` area | The god falls and erupts in a fire ring across the row |
| Righteous Wrath (N1) | `ability` + `buff` | A sacred falls and nearby sacreds flare red |
| Reform (N3) | map message | A pyre or phylactery glows at the capital, then the god rises |
| Awakening | map arrival | The god's portrait card and a dominion-color pulse spreading from the capital |
| Divine variants | `cast` | Priests' smites take the god's color: fire from the sky for R, thorns for G |

Everything above is pure presentation of logged events. The sim records the events and never
reads anything cosmetic, which keeps the determinism rule intact.

### 7.7 A roster sketch (not final; for the synthesis)

Each proposal names its Dominions model. The existing six stay.

| Color | Proposal | Model | Needs | Milestone |
|-------|----------|-------|-------|-----------|
| R | **Cinder Idol**: immobile, R2 base, dominion 4, Turmoil attunement | Statue of War | Data, N6 | M1 |
| R | **Pyre Lord**: titan, R2, summons 5 Fire Sprites at battle start | Lord of the Desert Sun | N1 | M1 stretch |
| R | **Ash Phoenix**: flying, R1, fire shield 3, dominion-immortal (reforms in 90 days) | Phoenix | N3 | M1 stretch or M2 |
| R | **Living Flame**: spirit, R3, flying, fire shield 8, heat aura | Solar Disc, Firstborn | N1 | M2 |
| G | **World Tree**: immobile, G3, dominion 4, regeneration, start site (2 G springs), Growth attunement | Irminsul | Data, N5, N6 | M1 |
| G | **Horned Hunter**: titan, G2, stealthy, summons 6 Wolves at battle start | Horned One | N1 | M1 stretch |
| G | **Elder Wyrm**: wingless, G1, 160 HP, regeneration 10% | Wyrm | Data | M1 |
| G | **Great Aurochs**: beast, G1, supply +50% where it stands, Growth attunement | Great White Bull | N1 monthly, N6 | M2 |
| W | Radiant Statue (Order), Virtue (flying, awe), Mercy (healer, unrest) | Statue of Order, Virtue, Bodhisattva | Data, Defer (awe) | M2 |
| U | Archsage (research ×1.5), Storm Wyrm (shapechange), Mirror Spirit (stealth, teleport) | Great Sage, Air Dragon, Spenta Mainyu | Data, N2 | M2 |
| B | Lich (immortal), Bone Throne (immobile, immortal), Ghost King (free monthly summons), Fountain of Blood (fear) | Master Lich, Demilich, Ghost King, Fountain | N1, N3 | M2 |

The Wild Spirit and Ash Colossus already follow the Dominions pattern of a color-fixed body
with free pips. CLAUDE.md requires that every new chassis join the content validation
fixtures.

### 7.8 Tests the additions need

- **Content**: every chassis validates (body unit exists, pips within `MAX_PIPS`, dominion
  within 1 to 10). Every ability's primitive validates against the `docs/02` list.
  Presets stay within budget.
- **Sim**: the N1 to N8 tests above; `validatePretender` rejects unaffordable blesses,
  blesses with unmet requirements or scales, and awakenings below the minimum; the
  determinism hash covers a game with abilities and reforms.
- **AI** (`docs/08`): the AI's preset picker ignores new chassis until they are tuned; the
  headless runner still finishes 20 games.

---

## 8. Open questions for the synthesis

1. **Bless menu now or in M2?** It is the largest depth gain. In M1 it needs a fourth area on
   the Phase 9 design screen, plus N1 and N4 for its incarnate effects.
2. **Should the pretender be sacred** and blessed in its own dominion (section 7.4)?
3. **Should FM adopt reform** (N3) in M1? It changes the "dead for good" decision in
   `docs/05`.
4. **How many chassis in M1?** The highlight-two-per-nation UI scales to about 12 bodies
   before it needs filters by tier or color.
5. **Scale refunds**: FM's two-valued poles argue against refunds. Attunement as a discount
   is the proposed substitute.

---

## Sources

Manual (Dominions 6, unofficial web edition of the official manual; read in full):
- [M3] Ch. 3, The Pretender. https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html (source: https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/03-the-pretender.qmd)
- [M4] Ch. 4, Units. https://dmacguigan.github.io/dom6-manual/chapters/04-units.html
- [M6] Ch. 6, Combat. https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html
- [M7] Ch. 7, Magic. https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html
- [M8] Ch. 8, Dominion. https://dmacguigan.github.io/dom6-manual/chapters/08-dominion.html

Game data (read in full):
- [D1] dom6inspector game data tables (`BaseU.csv`, `realms.csv`, `pretender_types_by_nation.csv`, `unpretender_types_by_nation.csv`, `attributes_by_nation.csv`, `nations.csv`, `magic_paths.csv`). https://github.com/larzm42/dom6inspector/tree/master/gamedata
- [D2] dom6inspector nation logic for pretender lists (`MNation.js`) and unit costs (`MUnit.js`). https://github.com/larzm42/dom6inspector/tree/master/scripts/DMI

Calculator (read in full):
- [C1] zollqir, Pretenders Calculator for Dominions 6 (v2.05, Dom6 6.32): `src/data/pretender_costs.json`, `src/data/pretenders.json`, README changelog. https://github.com/zollqir/pretenders-dom6

Wiki pages (search-engine excerpts; the pages themselves were unreachable from this environment):
- [W1] illwiki, Pretenders and Pretender Design (Dom6). https://illwiki.com/dom5/dom6/pretenders (excerpt)
- [W2] illwiki, Bless (Dom6). https://illwiki.com/dom5/dom6/bless (excerpt)
- [W3] illwiki, Pretender Archetypes (Dom5). https://illwiki.com/dom5/pretender-archetypes (excerpt)
- [W4] illwiki, Pretender Design and Bless Strategies (Dom5). https://illwiki.com/dom5/taorec-bless-strategies (excerpt)
- [W5] illwiki, Choosing Your Chassis (Dom5). https://illwiki.com/dom5/pretender-chassis (excerpt)
- [W6] illwiki, Maerlande's Pretender Design & Analysis. https://illwiki.com/dom5/maerlande-pretender-design (excerpt)
- [W7] illwiki, Blesses (Dom5). https://illwiki.com/dom5/blesses (excerpt)

Steam and reviews (search-engine excerpts):
- [S1] "Is the new bless system really working as intended" (Dom6, Jan 2024). https://steamcommunity.com/app/2511500/discussions/0/4132682727127343168 (excerpt)
- [S2] "Dominions 6 new Features and Changes". https://steamcommunity.com/app/2511500/discussions/0/3807281445020039925/ (excerpt)
- [S3] "Good bless combos". https://steamcommunity.com/app/2511500/discussions/0/4297067919526502631/ (excerpt)
- [S4] "Unholy Weapons is a pretty good counter-elite bless". https://steamcommunity.com/app/2511500/discussions/0/6660355377992864947/ (excerpt)
- [S5] Guide: Pretender, Bless, and Thug Design. https://steamcommunity.com/sharedfiles/filedetails/?id=1978405957 (excerpt)
- [S6] Dominions 6 store page. https://store.steampowered.com/app/2511500/Dominions_6__Rise_of_the_Pantokrator/ (excerpt)
- [S7] "New Pretenders" (Dom6). https://steamcommunity.com/app/2511500/discussions/0/4035854109130217333/ (excerpt)
- [R1] Wargamer, Dominions 6 review. https://www.wargamer.com/dominions-6/review (excerpt)

Fluid Magic (repository, read): `docs/00-vision.md`, `docs/02-magic.md`, `docs/03-nations.md`,
`docs/04-battle.md`, `docs/05-pretender.md`, `docs/09-art-direction.md`,
`docs/10-milestone-1.md`, `src/content/pretenders/*.ts`, `src/content/units/pretenders.ts`,
`src/content/spells/types.ts`, `src/content/rules.ts` (BLESS), `src/sim/pretender.ts`,
`src/sim/bless.ts`, `src/sim/battle/setup.ts`.
