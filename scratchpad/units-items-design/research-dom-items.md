# Magic items: Dominions 5 and 6, four other games, and an item system for Fluid Magic

Status: research note, 2026-10-21. Input to the units-and-items design (task #30). It is not a
spec. Section 8 sketches the item system the research points to, so the design has a starting
shape to accept, cut, or change.

**Owner direction (binding).** "The detail stats from giants to horses like Dominions and with the
items are very immersive, added immersion without completely making it over complicated makes
this game very engaging and replayable." Earlier directions still hold: visceral battles with
sound; a UI like similar games, with complexity layered under smart menus; flashy magic;
Dominions-like pretenders with AoW4-level customization.

**Constraints kept.** The sim stays pure and deterministic, and every new rule is tested.
Content is data and passes content validation. Every command goes through validate, and the AI
uses the same commands. No numbers are hard-coded in the sim. Color identity never relies on
hue alone. Every piece is placed in an M1 phase or deferred to M2. Above all, every stat or rule
must earn its place, be shown in layers (card, hover, Codex), and be explainable in one sentence.

**How the sources were read.**
- **(data):** files fetched directly and counted with scripts in `tools/`:
  - the Dominions 6 manual's item and booster chapters (the unofficial web edition's sources on
    GitHub);
  - the `dom6inspector` game data for items (`BaseI.csv`) and units (`BaseU.csv`);
  - the `aow4db` hero item dump (`HeroItems.json`).
- **(manual):** the Dominions 6 manual chapters already in the scratchpad (`dl-manual/`).
- **(search extract):** wiki and forum pages this session could not fetch directly (illwiki,
  Steam, paradoxwikis, fandom, and others). Their claims come from the search engine's reading
  of the page, so the URL is given and the claim is worded no stronger than the extract.
- **Measured:** staged fights in the repository's own resolver (`tests/sim/battle/fixtures`) and
  headless games with the dummy AI. The scripts are in `calc/`.

---

## 0. Findings in fifteen lines

1. **Dominions forges items like a ritual.**
   - A mage with the item's paths stands in a lab and spends a turn. Gems come from the
     national treasury, and the nation must have the Construction level.
   - Gem cost follows the path level: 5 per level up to 4, then 30, 40, 55, 70.
   - Fluid Magic can do the same with **one new ritual primitive** and no new order type.
2. **Tiers are research levels.**
   - Dominions 6 places five tiers on Construction 1, 3, 5, 7, and 9. Level 9 holds unique
     artifacts. Dominions 5 used the even levels (2, 4, 6, 8).
   - Of 496 forgeable Dominions 6 items, 45% need only path level 1, and 35% need two paths.
3. **Slots come from the body, not the item.**
   - 76% of Dominions 6 units have the humanoid set: two hands, head, body, feet, and two misc.
   - 13% have only two misc slots (wolves, salamanders, hydras, elementals, Treelords).
   - Dragons get a head and two misc. The Monolith gets one misc. Mounted bodies lose the feet.
4. **The standard weapon comes back.** A weapon item replaces the commander's own weapon. When
   the item comes off, the commander's own weapon returns.
5. **Boosters are the mage's strategy.**
   - Dominions 6 has 55 path-boosting items, all at Construction 5 or higher.
   - A booster works only in a path the wearer already has.
   - Pretenders forge the best boosters, and a booster chain lifts every mage.
6. **Items change commanders in six ways.** They change stats, the weapon, movement, defenses
   (regeneration, retaliation), and the commander's troops (Inspirational). They also add
   effects of their own: spells, summons, and income.
7. **A dead commander's items are a battlefield prize in Dominions.**
   - After a battle, a random surviving commander picks up each item. The chance rises with the
     item's tier, from 30% to 75% for enemy items, and the commander's own side always gets them
     back.
   - An item with no free slot to go to is lost.
   - Away from battle, the items survive only if a lab is in the province.
8. **Artifacts are unique per game.**
   - In Dominions 6 they "yearn" to be forged at half price.
   - By default a player forges at most one artifact per turn.
   - If two players forge the same artifact in the same turn, one is chosen and the others lose
     their gems.
9. **The other games agree on the shape and disagree on loss.**
   - AoW4 has about 10 slots and a forge with infusion points.
   - HoMM3 has about 14 slots, combination artifacts, and the winner takes the loser's
     artifacts.
   - Total War: Warhammer III has up to six items and banners for units. Items can be lost when a
     lord dies, but legendary items never are.
   - Battle Brothers puts every helmet and armor piece on a layered sprite, with damaged
     variants.
10. **Battle Brothers' lesson: gear that looks different must play different.** Its developers
    split visually distinct helmets into separate items with their own armor values.
11. **Measured: protection is Fluid Magic's steepest item lever on big bodies.**
    - Each +1 protection on a Great Wyrm adds about 20 points of win rate against Cinder Horde's
      starting army.
    - +2 protection with 5% regeneration takes it from 14% to 93%.
12. **Measured: a commander's own morale is inert.** A commander routs with its last squad
    without a roll, so a morale item on a commander does nothing. Morale items must inspire the
    squads the commander leads instead. Each +1 is worth about 5 points of win rate.
13. **Measured: damage items do not help a Titan.** Each of its hits already kills a 10 to 11 HP
    troop. Extra strikes do help: two strikes take it from 40% to 76% against 16 independents.
14. **Measured: Fluid Magic already has counters.** Swarm's armor-negating hornets drop a kitted
    Wyrm from 99% to 0%, and Ember Dart drops it from 93% to 59%.
15. **The distilled system has nine sim rules.** Each is one sentence (section 8.1). There are 16
    M1 items, 8 Red and 8 Green, on three tiers (research 1, 3, 5) and six slot kinds. Item
    abilities share one catalog with the pretender design's N1 abilities.

---

## 1. Dominions 5 and 6

### 1.1 How an item is forged

- **The order.**
  - "The Construction school allows you to construct magic items by giving the order 'Forge
    Item' to a mage in a laboratory." Non-artifact items "can be forged without restriction,
    given the appropriate Construction research level, skill, and gems."
    ([Dom6 manual, ch. 7 Magic](https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html))
  - Forging "always takes one turn" and needs the mage "to take an entire turn at a lab"
    (search extract, [illwiki Laboratory](https://illwiki.com/dom5/laboratory)).
  - A mage can repeat the same forge every turn with `Shift+o` (manual, ch. 7).
- **The gems.**
  - "Gems and blood slaves can be carried by commanders or stored in a nation's pool. Labs
    provide access to the national pool." (manual, ch. 7)
  - Cost follows each required path's level: 5, 10, 15, 20, 30, 40, 55, and 70 gems for levels 1
    to 8.
  - "If multiple paths are needed, gems of each type are used": the Sword of Many Colors (E4 S3)
    costs 20 earth gems and 15 astral gems. Blood items cost blood slaves
    ([Dom6 manual, ch. 10 Magic Items](https://dmacguigan.github.io/dom6-manual/chapters/10-magic-items.html),
    source [qmd](https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/10-magic-items.qmd)).
  - A few items list their own cost, such as Shillelagh at "3 glamour gems + 2 nature gems"
    (data).
- **The turn order.** Items are forged in step 5 of turn resolution, after research,
  recruitment, and empowerment and before preaching. They go "into the national inventory"
  ([manual, ch. 5](https://dmacguigan.github.io/dom6-manual/chapters/05-movement.html), turn
  order list).
- **Forge bonuses exist.** The Dwarven Hammer carries "Forge Bonus 2", the Hammer of the Forge
  Lord "Forge Bonus 4", and The First Anvil "Master Smith 1" (data). I did not verify the size of
  the discount.
- **Nation-specific items.** "Some items are restricted to certain nations (e.g. Black Halberd for
  MA Ulm) and only show up in the forge for those nations." Discounted items are shown with a
  gray background (manual, ch. 7). The data has 29 nation-restricted items, and the Dwarven
  Hammer carries two nation rebates.
- **Not everything can be forged.** "Some magic items are not listed here, which cannot be
  forged, only found by chance" (manual, ch. 10). In the data, 33 of 529 items sit at levels 11,
  13, and 15, outside the forge's 1 to 9.

**For Fluid Magic.** This is the ritual rule Fluid Magic already has, almost word for word:
- `docs/02` rituals already need a mage in an own lab, its pips, and the research level.
- They pay mana from the national pool when they begin and keep the mage busy for `castDays`.
- Any other order, a retreat, or death ends them, and the mana is lost.

Forging can be **a ritual whose effect is the item**. It needs one primitive (`forgeItem`) and
no new order, command, or panel flow (section 8.1, F1). Fluid Magic's "generic" mana plays the
part of Dominions' second path: a two-color item in M3 pays both colors.

### 1.2 Tiers and research levels

| Game | Tier names (manual) | Construction levels | Artifacts |
|---|---|---|---|
| Dominions 6 | Magical Trinkets, Lesser, Greater, Very Powerful, Unique Artifacts | 1, 3, 5, 7, 9 | level 9, unique (manual, ch. 10) |
| Dominions 5 | same families | 2, 4, 6, 8. The illwiki pickup table is keyed by Const 2, 4, 6, 8, and a player says "construction gives you new magical items you can forge every even level" (search extract of the Dom5 Steam discussions, among them [this thread](https://steamcommunity.com/app/722060/discussions/0/3800524658150908919/)) | level 8 (a player post in the same results) |

Dominions 6 data, the 496 forgeable items (levels 1 to 9):

| Slot type | L1 | L3 | L5 | L7 | L9 (artifacts) | Total |
|---|---|---|---|---|---|---|
| One-handed weapon | 7 | 32 | 20 | 11 | 21 | 91 |
| Two-handed weapon | 1 | 12 | 11 | 13 | 13 | 50 |
| Missile weapon | 1 | 6 | 7 | 4 | 1 | 19 |
| Shield | 4 | 8 | 6 | 3 | 4 | 25 |
| Armor | 4 | 11 | 19 | 14 | 8 | 56 |
| Helmet and crown | 3 | 7 | 13 | 10 | 12 | 45 |
| Boots | 3 | 5 | 6 | 5 | 5 | 24 |
| Misc | 9 | 33 | 52 | 29 | 53 | 176 |
| Barding | 0 | 3 | 4 | 2 | 1 | 10 |
| **All** | **32** | **117** | **138** | **91** | **118** | **496** |

- **Path level needed:** level 1 for 221 items (45%), 2 for 124 (25%), 3 for 61, 4 for 44, 5
  for 34, 6 for 10, and 7 for 2.
- **Two paths:** 173 items (35%) need two paths.
- **Main path:** Earth 94, Nature 75, Fire 68, Air 59, Glamour 52, Astral 50, Death 50, Water 44,
  Blood 37 (data).

**For Fluid Magic.**
- Research is per color, 0 to 6 in M1 (9 later), and nations start at level 1. Odd levels keep
  Dominions 6's rhythm in three tiers: **Lesser at level 1, Greater at level 3, Artifact at
  level 5**.
- Requirement pips play the part of the path level, priced on Dominions' curve: about 4 mana a
  pip (section 8.3).
- The measured research pace (section 7.4) makes level 5 a late prize. That matches Dominions,
  where artifacts come at the end of the tree.

### 1.3 Slots, and what a body may wear

- **The humanoid set:** two hands, head, body, feet, and two misc (search extract,
  [illwiki Dom5 item](https://illwiki.com/dom5/item)). The manual's tables split one-handed and
  two-handed weapons, so two hands hold two one-handed items (a weapon and a shield) or one
  two-handed weapon.
- **Other bodies:** "Not all units will have all inventory slots. A non-human commander may not
  have a head slot, for instance. Mounted commanders have a foot slot, but it is disabled as
  long as they are mounted... Mounts of commanders have a barding slot."
  ([manual, ch. 4 Units](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html))
- **The standard weapon returns:** "A unit can be upgraded with better armor and weapons simply by
  giving it a superior item. However, the unit's standard items cannot be removed, and when the
  new item is withdrawn, the standard item re-appears." (ch. 4)
- **Who may wear items:** only commanders. A regular unit needs Gift of Reason or Divine Name
  first (search extract, illwiki Dom5 item).

Dominions 6 unit data, 4,091 units, slot layout as hands, head, body, feet, misc (data):

| Layout | Units | Share | Examples |
|---|---|---|---|
| 2, 1, 1, 1, 2 (humanoid) | 3,093 | 76% | Knight, Arch Mage, Cyclops, Moloch, Lord of the Wild (size 9 giants keep every slot) |
| 0, 0, 0, 0, 2 (beast) | 542 | 13% | Salamander, Wolf, Hydra, Great Lion, Unicorn, Treelord, Fire Elemental |
| 2, 1, 1, 0, 2 (no feet) | 237 | 6% | Centaur |
| 0, 1, 0, 0, 2 (horned beast) | 83 | 2% | Dragon, Phoenix, Great White Bull; the Wyrm has 2 heads |
| 0, 0, 0, 0, 1 | 15 | — | Monolith |
| 4, 1, 1, 1, 1 | 12 | — | four-armed bodies; the Ancient Kraken is 4 hands, 2 misc |

Restriction flags on the 496 forgeable items (data):

| Flag | Items | Example | Meaning |
|---|---|---|---|
| Affects mount too | 34 | Ring of Regeneration, Amulet of Resilience | the bonus reaches the mount |
| Cannot be used by mounted units | 8 | Blacksteel Tower Shield | |
| Heavy | 17 | Boots of the Behemoth | heavy items cannot be teleported (Carrier Eagle, below) |
| Cursed | 47 | Eye of Aiming, Crystal Heart | |
| No pickup | 22 | Eye of Aiming, Crystal Heart | lost when the wearer dies in battle (1.6) |
| Strength requirement | a few | The Pebble Pouch (str 20), Bow of the Titans (str 18) | |

**For Fluid Magic.**
- **Body plans are data on the commander unit** (`commander.slots`). No rule is needed for
  hands, feet, or riders: a rider's plan has no feet slot, and a wolf's has only charms.
- **Size never blocks an item.** Dominions lets a size-9 Moloch use every slot. AoW4's
  giant-only weapons are the exception.
- **Only commanders wear items.** Fluid Magic troops are counts with a shared HP pool, so items
  could not attach to them anyway.
- **Skip** "affects mount", heavy, cursed, nation-restricted, and strength requirements. Each is
  a rule with no M1 payoff. A Fluid Magic rider is one body, so a bonus already covers rider and
  mount.

### 1.4 What an item does to a commander

Dominions item effects fall into eight families. A representative item for each (data, manual
ch. 10):

| Family | Representative items (path, Construction) | Notes |
|---|---|---|
| **Stats** | Bracers of Protection (E1, 3): def +2, prot +2. Burning Pearl (F1, 3): att +4. Boots of Giant Strength (E1, 3): str +5 | plain numbers |
| **Weapon** | Fire Sword (F1, 1): dmg 10. Frost Brand (W1, 5): dmg 8, "On strike: Frozen Flames". Fire Brand (F1E1, 7): AP, morale +2, "On strike: Small Area Fire". Sword of Swiftness (W2, 5): 2 attacks | on-hit area effects are what let a thug kill several troops a swing (search extract: brands "let you kill multiple targets at once", [illwiki Thugs and Supercombatants](https://illwiki.com/dom5/thugs-and-supercombatants)) |
| **Armor** | Fire Plate (F1, 3): prot 16, mor +2. Red Dragon Scale Mail (F2, 5): prot 16, HP +6, mor +4, FR +15. Hydra Skin Armor (N2, 7): prot 12, regen 10% | every body armor also adds HP |
| **Movement** | Winged Shoes (A2, 5): flying. Boots of Quickness (W2, 7): quickness, map move +12. Boots of Seven Mile Strides (N2, 7): map move +18 | |
| **Defenses** | Ring of Regeneration (N2, 5): regen 10%. Amulet of Resilience (N2, 5): reinvigoration 5. Amulet of Missile Protection (A2, 3): air shield. Barkskin Amulet (N1, 3) | the core of a super combatant's "layers" (1.9) |
| **Troops and command** | Horn of Valor (N1, 5): Inspirational +1. Helmet of Heroes (F1E1, 5): Inspirational +2. Crown of Command (S2, 5): Leadership +100, Inspirational +1. Sceptre of Authority (F1, 3): Leadership +50 | Inspirational raises the morale of the troops under the commander |
| **Spells and summons** | Wand of Wild Fire (F3, 5): "spell: Fireball". Fenris' Pelt (N4, 9): "casts: Howl". Handful of Acorns (N1, 3): retinue of 3 Vine Men. Crown of the Fire King (F4, 9): retinue of 2 Fire Elementals | the tables list `spell:` (the item grants a castable spell) apart from `casts:` (an effect the item produces itself) |
| **Economy and magic** | Fire in a Jar (F1, 3): 1 temporary fire gem per battle. Owl Quill (A1, 3): research +6. Skull Mentor (D2, 5): research +14. The Ruby Eye (F3, 9): 2 water gems a month. Draupnir (E5, 9): 400 gold a month | |

**Path boosters.** "Magic items that increase magic skill only work if the user's skill in that
path is at least 1." Empowerment, which costs "50 magic gems" for a first level in a new path
and "15 x [target level]" after that, "is the only way to gain skill in a path a unit doesn't
have" (manual, ch. 7). The booster chapter
([manual, ch. 11](https://dmacguigan.github.io/dom6-manual/chapters/11-path-boosters.html),
[qmd](https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/11-path-boosters.qmd))
lists:
- **Construction 5:** 13 boosters. Each gives +1 in one path: Skull Staff (D2), Thistle Mace
  (N2), Flame Helmet (F4), Winged Helmet (A4), Earth Boots (E2), Robe of the Sea (W3), and
  others.
- **Construction 7:** 13 boosters. Among them are the Treelord's Staff (N5, +2 Nature), the Ring
  of Sorcery (S6, +1 to four paths), the Ring of Wizardry (S7, +1 to all nine), and the Ring of
  the False Prophet (G4F2, +1 Holy).
- **Construction 9:** 29 booster artifacts, such as the Orbs of Elemental Fire, Air, Water, and
  Earth (+1 and 1 gem a month) and The Forbidden Light (+2 Fire, +2 Astral).

**For Fluid Magic.** Every family but economy can be built from what Fluid Magic has or what the
pretender design already adds:

| Family | Fluid Magic mechanism | New rule? |
|---|---|---|
| Stats | `CombatStats` deltas folded in `battle/setup.ts statsFor` | no |
| Weapon | replace the commander's melee weapons with the item's `WeaponDef` (Dominions' standard-item rule). `armorPiercing`, `armorNegating`, `element`, and N2 `strikes` (pretender design) cover sharpness, brands, and Swiftness | no (N2 is already planned) |
| Armor and defenses | prot, hp, def, `regeneration`, `fireShield` with N4 `shieldElement` | no |
| Movement | `mapSpeed`, which also sets the battle closing round, capped at 3. The `flying` and `swampwalker` tags | no |
| Troops and command | **Inspire**: +morale to every squad the wearer leads (Dominions' Inspirational) | **yes** (R7) |
| Spells and summons | N1 abilities (`battleStart`, `eachRound`) from **one shared catalog** with the pretender design | no (N1 is already planned) |
| Boosters | +pips in a color the wearer has, for casting and forging | **yes** (R6) |
| Economy | mana a month, research points, temporary carried mana | M2 (each is another rule) |

### 1.5 Representative items by path, mapped to Fluid Magic's colors

Dominions paths do not map one to one. The table follows the `docs/02` color pie ("Does well",
"Never does").

| Fluid Magic color | Dominions paths it borrows from | Representative Dominions items (path, Construction) | What the color may make |
|---|---|---|---|
| **R Ember** (fury, speed, fire) | Fire, some Blood | Fire Sword (F1, 1), Burning Blade (F1, 3, "On hit: Fire"), Pendant of Courage (F1, 1, mor +5), Burning Pearl (F1, 3, att +4), Flame Helmet (F4, 5, +1 Fire), Unquenched Sword (F5, 9, dmg 22 AP, "casts: Heat from Hell") | fire weapons, attack and morale, speed, retaliation, Red boosters. **Never** big protection (Red "never does: defense") |
| **G Loam** (growth, beasts, protection) | Nature, Earth | Hunter's Knife (N1, 3, AP), Barkskin Amulet (N1, 3), Ring of Regeneration (N2, 5), Thistle Mace (N2, 5, +1 Nature), Handful of Acorns (N1, 3, 3 Vine Men), Crown of the Ivy King (N2, 9, barkskin, regen 5%, awakens vine men), Boots of Antaeus (E4N1, 9, regen 10%) | protection, regeneration, beasts summoned at battle start, Green boosters. **Never** flying or evasion (Winged Shoes is not Green) |
| W Radiance (M2) | Astral (holy side), Fire (holy) | Shield of the Dawn (E2S1, 9), Immaculate Shield (F3S2, 9, Priest +1), Armor of Virtue (S3, 9, blessed) | shields, holy boosters, morale for all |
| U Tide (M2) | Water, Air, Astral | Frost Brand (W1, 5), Winged Shoes (A2, 5, flying), Owl Quill (A1, 3, research +6), Robe of Missile Protection (A1, 3) | flying and evasion, research, cold weapons |
| B Umbra (M2) | Death, Blood | Wraith Sword (D2, 5, partial life drain), Horror Helmet (D2, 5, Fear +5), Skull Staff (D2, 5, +1 Death), Ring of the Warrior (B1, 3, att +5) | life drain, fear, Black boosters |

### 1.6 Death, the lab, and moving items

**Battle deaths in Dominions.** All search extracts from
[illwiki Dom5 items](https://illwiki.com/dom5/items):
- After a battle, each dead commander's item "has a chance to be found by a random commander".
- The chance for enemy items is 30% at Const 2, 45% at Const 4, 60% at Const 6, 75% at Const 8,
  and 90% for cursed items. The commander's own side always recovers its items.
- "If the commander who finds an item has no free slot, the item is lost anyway."
- "Nopickup" items (Soul Contracts, Crystal Heart, Eye of Aiming) "are lost when the commander
  dies in battle".

Players say:
- "The winning side has a much larger chance at picking up items", and items not picked up "are
  lost forever" (search extract,
  [Steam, Dom4](https://steamcommunity.com/app/259060/discussions/0/648814843350827187)).
- Distance to the dead may matter. That is community belief, not documentation (search extract,
  [dominionsmods](http://dominionsmods.com/index.php?showtopic=3533)).

**Deaths outside battle.** "If a commander dies outside of battle (disease, Transformation,
Seeking Arrow) the items are lost unless there is a lab in the province. If there is a lab, the
items are saved and go in there." (search extract, illwiki Dom5 items; the same for Dom6:
[Steam](https://steamcommunity.com/app/2511500/discussions/0/4545904024628106646))

**Moving items.**
- Clicking an empty slot "takes you directly to your nation's magic item inventory (if you are in
  a province with a lab)" (manual, ch. 4).
- "Commanders in a lab can exchange items and gems with the nation's treasury; without a lab,
  they can only trade things with other commanders in that province" (search extract,
  [illwiki Laboratory](https://illwiki.com/dom5/laboratory)).
- The ritual Carrier Eagle (Thaumaturgy 3, A2) "will quickly transport a magic item to a
  commander in another province. Heavy items cannot be transported"
  ([manual, ch. 15](https://dmacguigan.github.io/dom6-manual/chapters/15-other-rituals.html)).
- The F8 screen lists "all magic items in your kingdom (treasury and equipped)"
  ([manual, ch. 2](https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html)).

**For Fluid Magic.**
- **Keep the drama:** a fallen champion's sword can change hands.
- **Drop the dice:** a deterministic rule is shorter, fairer, and easier to read. "The side that
  holds the field takes the fallen's items" is HoMM3's rule (section 3).
- **Make the lab the only door.** Fluid Magic already hands mana over only in an own lab
  (`giveMana`), so items move the same way in M1.
- **M2:** field swaps between commanders in one province, and a Carrier Eagle-like ritual
  (Blue).

### 1.7 Artifacts

- **Unique:** "The items at research level 9 are artifacts and are unique (only one of each can
  exist)." "You will not be able to forge a unique artifact... that is already in existence."
  (manual, ch. 7 and 10)
- **Yearning:** "Unique artifacts start to yearn to be forged once their creation seems within
  reach; a yearning artifact can be forged at half the usual cost". The triggers are a nation at
  Construction 9, the Forge of the Ancients, and the Thrones of Creation and of the Artificer
  (ch. 7).
- **One per turn:** the default setting "limits players to forge a maximum of one unique artifact
  per game turn... it will also be meaningful for players with slower research to aim for
  artifact construction" (ch. 2).
- **Simultaneous forging:** "if multiple players attempt to forge the same artifact on the same
  turn, one player is randomly chosen to succeed in the forging, while the other players lose the
  forging cost" (search extract, illwiki Dom6 pages:
  [gems](https://illwiki.com/dom5/dom6/gems), [magic](https://illwiki.com/dom5/dom6/magic)).
- **Count:** artifacts are 118 of 496 forgeable Dominions 6 items (24%) (data).

**For Fluid Magic.**
- Fluid Magic runs in real time, so there is no turn to collide in. An artifact can be
  **reserved when its forging begins**. No one else may begin it while it is being forged or
  exists, so no dice and no lost mana.
- **Lost artifacts return to the forge**, as in Dominions, where a lost artifact no longer
  "exists".
- **Skip yearning and the per-turn cap.** Fluid Magic's matches are short, and only two
  artifacts per color ship in M1.

### 1.8 Complexity Fluid Magic should not import

| Dominions feature | Why cut |
|---|---|
| Cursed items (47) and "curses wielder" | a trap the player has to learn. It needs an unequip-refusal rule and its own UI |
| Heavy items, affects-mount, mounted-only and no-mount flags | no M1 payoff (no barding, no item teleport) |
| Nation-restricted and discounted items | Fluid Magic's color identity already restricts. In M3, two-color nations get both colors' items |
| Forge bonus | a discount rule for a handful of items |
| Pickup chance by tier and distance | replaced by a deterministic field-holder rule |
| Yearning, one artifact per turn | real time and few artifacts |
| Empowerment (pips for gems) | a different system, reserved for M2 if ever |
| Afflictions, element resistances | Fluid Magic M1 has neither, and elements have no effect in M1 |
| Reinvigoration as a stat | Fluid Magic fatigue is only for casters and recovers 5 a round. A recovery item can come in M2 (Blue) |

### 1.9 The strategy that results

- **Thugs and super combatants.**
  - "A supercombatant is designed to tank an enemy army, while a thug is built to wipe out PD or
    small numbers of troops" (search extract,
    [Steam](https://steamcommunity.com/app/722060/discussions/0/1729837292642626646/)).
  - Survival comes from **layering**: "Regeneration, awe, Vine Shield, astral shield and similar
    effects each add a layer, and anything that gets past one must deal with another".
  - Reinvigoration keeps a unit "fatigue-neutral".
  - The counters: "Curse is the premiere anti SC anti-thug spell", and Soul Slay is "potent
    enough to always work if not resisted by MR" (search extract, illwiki Thugs and
    Supercombatants).
  - A player's golem kit: Vine Shield, Armor of Knights, a Frost or Fire Brand, and buff spells
    ([Steam](https://steamcommunity.com/app/722060/discussions/0/2906376154330926315/), search
    extract).
- **Boosted mages.**
  - "The strongest spells require 6 to 9 levels in a path, but no nation can reasonably recruit
    mages with more than 4 in a path", so boosters matter.
  - "The most powerful spells and the most versatile booster items are cast and forged by
    pretenders" (search extract, [illwiki Magic](https://illwiki.com/dom5/magic)).
  - Players chain boosters: one forges a Skull of Fire, then water items and an elemental staff,
    then the astral rings, to bring "any mage to +2 in all paths". Empowerment "is generally an
    inferior option to forging or trading for booster items" (search extract,
    [Steam](https://steamcommunity.com/app/722060/discussions/0/3800524658150908919/)).
- **The pretender is the forge.** A god with several paths forges what the national mages
  cannot.

**For Fluid Magic.**
- All three strategies are reachable with the nine rules in section 8. Section 7 shows that a
  kitted Great Wyrm or Titan becomes a thug or super combatant.
- Booster rules let an R2 Cinder Magus cast RRR Pyre Storm, and an R1 Ember Adept cast RR
  Fireball.
- Green's Swarm and Red's Ember Dart already answer a super combatant (measured, 7.2).

---

## 2. Age of Wonders 4: hero items and the Item Forge

**Slots.**
- The wiki lists "one primary, one secondary, head, chest, legs, mount, and ring slot, plus three
  miscellaneous slots". "The mount slot is only available for Champions and Wizard Kings"
  (search extract, [AoW4 wiki Equipment](https://aow4.paradoxwikis.com/Equipment)).
- Giant Kings "use only giant weapons and cannot equip mounts"
  ([AoW4 wiki Giant King](https://aow4.paradoxwikis.com/Giant_King), cited in
  `pretender-design/research-aow4.md` 1.1).

**The item dump.** The [aow4db](https://github.com/minionsart/aow4db) dump has 693 records: 401
tiered items and 292 forge base types (data):

| Slot | Tier I | II | III | IV | Total |
|---|---|---|---|---|---|
| Primary | 175 | 20 | 17 | 21 | 233 |
| Mount | 27 | 22 | 10 | 1 | 60 |
| Miscellaneous | 6 | 9 | 10 | 8 | 33 |
| Secondary | 19 | 3 | 3 | 2 | 27 |
| Ring | 5 | 7 | 4 | 4 | 20 |
| Torso | 1 | 3 | 3 | 4 | 11 |
| Head | 2 | 4 | 3 | 1 | 10 |
| Legs | 2 | 2 | 2 | 1 | 7 |

- Each item lists the slots it **disables**, and only primary weapons disable any. Of the 233
  tiered primaries, 89 disable Secondary (two-handed) and 99 disable both Secondary and Mount.
- Items list the **hero classes** that may use them. The Flying Broom is a Primary for
  Battlesaint, Warlock, Elementalist, and Ritualist only (data).

**The Item Forge.** All search extracts from AoW4 wiki Equipment:
- Building the Wizard Tower unlocks the Item Forge city structure.
- An item has 5 infusion points (6 for a Giant King with Forge Master). 1 to 2 points make Tier I
  ("produced instantly"), 3 make Tier II, 4 make Tier III, and 5 make Tier IV.
- Crafting needs "binding essence, gold, and a couple of turns". Tiers III and IV also need
  binding fragments.
- Essence and fragments come "primarily by disenchanting owned items", 50 essence per tier.
  [GameRant](https://gamerant.com/age-of-wonders-4-aow4-how-craft-items-forge/) gives 40 per
  tier.
- Owning **magic materials** unlocks more infusions. Mounts can be disenchanted but not crafted.

**Sources and death.**
- Equipment also comes "from quests, infestations, Ancient Wonders, resource nodes, and defeated
  enemy heroes" (search extract, Equipment).
- A developer: "You can only resurrect Heroes that belonged to you. Enemy Heroes can only be
  Animated using the Necromancy Tomes". A player says resurrection brings the hero back with
  equipment (search extract,
  [Steam](https://steamcommunity.com/app/1669000/discussions/0/3826415752018066477/)).

**Look versus mechanics.** In AoW4 the weapon loadout and the mount are mechanical, and the mount
has cosmetic horse armor. Headgear, cape, and outfit are cosmetic. "Mechanics produce visuals
automatically... Cosmetics never produce mechanics" (`pretender-design/research-aow4.md` 1.6,
with its sources).

**For Fluid Magic.**
- **Take the disabled-slot idea.** A two-handed item fills two slots. That is the cleanest way to
  write "staff or shield". One sentence (R4).
- **Take "items say who may use them" only through pips.** A booster needs a pip in its color, so
  no class tags are needed.
- **Take "mechanics drive visuals".** Every worn item shows on the sprite (section 5 and 8.7).
- **Skip infusions, essence, and disenchanting.** That is a crafting economy on top of mana. A
  fixed item list keeps the Codex and the AI simple. Disenchanting could return in M2 as "melt an
  item for half its mana", if players hoard junk.
- **Skip resurrection with gear.** Fluid Magic's pretender reform (N8) brings the god back without
  its items (section 8.1, R8).

## 3. Heroes of Might and Magic: artifacts and sets

**Slots (HoMM3).**
- Helmet, cape, necklace, right hand (weapon), left hand (shield), torso, two rings, feet, and
  miscellaneous slots: 4 in Restoration of Erathia and Armageddon's Blade, 5 in Shadow of Death.
  Shadow of Death "introduces a fifth artifact equipment slot for all heroes"
  ([Wikipedia, SoD](https://en.wikipedia.org/wiki/Heroes_of_Might_and_Magic_III:_The_Shadow_of_Death)).
- A backpack holds up to 64 unused artifacts, and war-machine and spellbook slots are separate
  (search extract, [Heroes 3 wiki Artifact](https://heroes.thelazy.net/index.php/Artifact)).

**Classes.** "Four ranks... Treasure, Minor, Major, and Relic". The rank "is not shown on the item
in game" and sets bank chances and map guard strength (search extract,
[StrategyWiki](https://strategywiki.org/wiki/Heroes_of_Might_and_Magic_III:_The_Restoration_of_Erathia/Artifacts)).

**Combination artifacts (Shadow of Death, 12 of them).** You "must equip all the required
artifacts on your hero, then right-click one of the component items". The result "still takes up
all the slots the component parts used", and the parts' bonuses still apply under the combined
one (search extract,
[Heroes 3 wiki Combination artifact](https://heroes.thelazy.net/index.php/Combination_artifact)).
The newer *Olden Era* uses sets: effects appear "when a certain number of artifacts from the same
set are equipped" (search extract, [olden-era.com](https://olden-era.com/en/artefacts)).

**Loss.** All search extracts from the
[Heroes 3 wiki](https://heroes.thelazy.net/index.php/Retreat) (Retreat,
[Surrender](https://heroes.thelazy.net/index.php/Surrender),
[Combat](https://heroes.thelazy.net/index.php/Combat)):
- A retreating hero "retains all of their artifacts, but loses their army".
- A surrendering hero keeps both, for gold.
- A defeated hero's artifacts go to the victor "only if there is room". Those without "free space
  in artifact slots or in the backpack will just disappear".

**For Fluid Magic.**
- **Take the loss rule:** the winner takes the fallen's items, deterministic and legible (R8).
  Fluid Magic's vault has no size limit, so nothing "disappears".
- **Take "rank shown by shape"**, but show it: Fluid Magic's three tiers get three shapes (8.7).
  HoMM3 hides rank, and that is not this project's readability bar.
- **Defer sets** to M2. A set is a second rule ("n pieces give a bonus") that only pays off with
  many items per color.
- **Take the map treasure feeling** in a small way: Independents keep what they win in a
  province's hoard, and an optional M1 starting hoard is in the open questions.

## 4. Total War: Warhammer III: lord and hero items, and banners

**Categories and count.**
- Items are weapons, armour, talismans, enchanted items, and arcane items, plus followers and
  banners (search extract,
  [TW Warhammer wiki, WH3 items](https://totalwarwarhammer.fandom.com/wiki/Total_War:_Warhammer_III_items);
  [twdb](https://twdb.io/warhammer3/database/items/)).
- "All character types can be equipped with up to six magic items, including armour, weapons,
  enchanted items, arcane items, and talismans" (search extract, official
  [How Lords Work](https://wiki.totalwar.com/w/How_Lords_Work)). That is an older post about the
  first game.

**Banners.** "Characters, including lords and heroes, can equip [banners] in the campaign map to
provide a number of temporary battle buffs to their army units". "Banners need to be assigned to
a specific unit... in the pre-battle menu" (search extract,
[TW Warhammer wiki, Banners](https://totalwarwarhammer.fandom.com/wiki/Banners)).

**Sets, rarity, and legendary items.**
- Sets "provide additional effects once all ancillaries belonging to a set are equipped by the
  same character".
- "Most Legendary Items are gained through set piece battles, and are tied to a specific
  legendary lord" (search extract, WH3 items).
- A patch adjusted "some 600 ancillaries" with a "cost/budget matrix" built on a hidden
  "uniqueness" stat
  ([PC Gamer](https://www.pcgamer.com/games/strategy/total-war-warhammer-3s-latest-patch-radically-reattunes-its-magic-item-system-in-total-some-600-ancillaries-have-had-their-effects-and-rarity-adjusted/)).
- Rare items: after five won battles, each victory has a 3% chance to drop one, for human
  players only (search extract,
  [twdb rare items](https://twdb.io/warhammer3/database/features/rare-items/)).

**Loss.**
- "The player can lose items if the Lord it was equipped to dies in battle, except Legendary
  items, which cannot be lost in battle" (search extract,
  [TW Warhammer wiki, Rarity](https://totalwarwarhammer.fandom.com/wiki/Rarity)).
- Players report that a permanently dead lord's gear is gone, and that the enemy can steal one
  item (search extract,
  [Steam WH2](https://steamcommunity.com/app/594570/discussions/0/1743358239845452341/),
  [Steam WH3](https://steamcommunity.com/app/1142710/discussions/0/4521136683852835018/)).

**For Fluid Magic.**
- **Take the banner idea, without per-unit assignment.** An item that buffs the wearer's own
  squads is Dominions' Inspirational and TW's banner in one. It needs no pre-battle menu:
  "inspiration adds to the morale of every squad its wearer leads" (R7). Measured in 7.3.
- **Take the budget matrix as a balance method.** Price items by measured effect, not by feel.
  Section 7 shows why: +1 protection is worth far more on a Wyrm than +4 damage on a Titan.
- **Skip random drops.** Fluid Magic has no rng in items.
- **Note TW's "legendary items are never lost".** Fluid Magic artifacts may be lost (to the field
  holder), as in Dominions. They are never destroyed while someone holds them. They are only
  destroyed by death away from a lab or by elimination.

## 5. Battle Brothers: gear on mercenaries, visible on the sprite

**Layered sprites.** All search extracts from the developers' blogs:
- The team began with full-body figures but "couldn't keep up". "Each part like head, helmet or
  weapon can be individually swapped"
  ([Dev Blog #5](https://battlebrothersgame.com/dev-blog-5-concept-art-explaining-battle-brothers-character-art-style/)).
- Armor "was separated from the bodies so it has its own layer and is rendered on top of bodies",
  which makes "damaged armor with missing parts easier to show"
  ([Dev Blog #33](http://battlebrothersgame.com/dev-blog-33-character-generation-hiring-shopping/)).
- Helmets got a visual makeover
  ([Dev Blog #49](http://battlebrothersgame.com/dev-blog-49-progress-update-character-backgrounds-visual-makeover-continued/)).

**Looks must match stats.** Dev Blog #34 "split helmet visuals into separate items with their own
armor values, because previously helmet variants looked different but gave the same protection"
(search extract,
[Dev Blog #34](https://battlebrothersgame.com/dev-blog-34-new-armor-helmet-rework-banners/)).

**Weight, durability, and named items.**
- Gear lowers maximum fatigue, and a bag-slot item counts at half (search extract,
  [Steam](https://steamcommunity.com/app/365360/discussions/0/596265621109345097/)).
- "Bags and Belts" raises bag slots from two to four (search extract,
  [RPGHQ](https://rpghq.org/forums/viewtopic.php?p=93730)).
- Armor durability absorbs damage before HP (search extract,
  [guide](https://mygamingtutorials.com/2025/05/19/battle-brothers-guide-understanding-armor-and-fatigue-management/)).
- Named items "are rare items with unique looks, randomized stats and names", with a red glow
  (search extract,
  [BB wiki](https://battlebrothers.fandom.com/wiki/Named_and_Legendary_Items)).

**Loot.** "Enemies only drop gear if the player is the killer", with durability conditions on
armor. That comes from a player reading the scripts and is marked unsettled (search extract,
Steam threads [1](https://steamcommunity.com/app/365360/discussions/0/2971776551517767395),
[2](https://steamcommunity.com/app/365360/discussions/0/1741106440023428663)).

I did not confirm the full paperdoll list (head, body, main hand, off hand, accessory, ammunition,
bags) from a source this session could read. The sources confirm helmets, body armor, weapons, a
secondary hand, and bag slots.

**For Fluid Magic.**
- **The battle presentation already has Battle Brothers' seam.** The biped rig's parts include
  `helm`, `torso`, `weapon`, `weapon2`, `shield`, `cloak`, and `banner` (battle design S4.4
  `PartId`). Items swap or add parts. No new rig is needed.
- **Every item has a look**, and two items that look different must differ in effect. That is a
  content test (8.9).
- **Item materials change hit sounds.** Body armor sets the `material`, so a Cinder Mail sounds
  like `ember` and a Barkhide Mail like `bark`. The battle design's sound bank already keys
  impacts by material (`arm.plate`, `shield.wood`, and others).
- **Skip durability, weight, and random named items.** Fluid Magic has no per-blow armor wear, no
  fatigue for fighters, and no rng in items.

---

## 6. Cross-game comparison

| | Dominions 5/6 | AoW4 | HoMM3 | TW: Warhammer III | Battle Brothers | **Fluid Magic (proposal)** |
|---|---|---|---|---|---|---|
| Slot positions (humanoid) | 7 (2 hands, head, body, feet, 2 misc) + barding | about 10 | about 14 + backpack | up to 6 + followers and banners | head, body, 2 hands, accessory, bags | **7**: weapon, shield, head, body, feet, 2 charms |
| Slots by body | yes, per unit (76% humanoid, 13% misc only) | by ruler type and class | one hero shape | by character | one human shape | **yes, a body plan per commander** |
| Made by | a mage with paths, in a lab, gems, 1 turn | Item Forge: essence, gold, turns | found | found, quests | bought, looted | **a mage with pips, in a lab, mana, days: a ritual** |
| Gated by | Construction level | forge structure, materials | — | — | — | **research level in the item's color** |
| Tiers | 5 (1, 3, 5, 7, 9) | 4 (I to IV) | 4 classes (hidden) | rarity | named and legendary | **3: Lesser (1), Greater (3), Artifact (5)** |
| Unique | artifacts | — | some | legendary | legendary | **artifacts, reserved when forging begins** |
| On death | chance pickup by survivors, own items always | hero resurrects with gear | winner takes if room | lost, legendary kept, one stolen | dropped if the player killed | **the side holding the field takes all** |
| Moving items | lab to treasury, same province, Carrier Eagle | free | between heroes | free | free | **through the vault, in an own lab** |
| Visible on the unit | partly (weapons) | weapon and mount | — | partly | **every piece, layered** | **every piece, as a part** |

---

## 7. Measurements in Fluid Magic's resolver

All runs use the repository's resolver through `tests/sim/battle/fixtures`. Item effects are
folded into `CombatStats` the way `setup.ts statsFor` would fold them. Each cell has 300 seeds
(400 for 7.3). The lone commander's script is Attack every slot. "Win" means the attacker wins.

### 7.1 Lone commanders with item kits (`calc/thug.ts`)

The kit items:
- **Blade:** Flame Blade, dmg 8 fire, armor piercing. It replaces the commander's weapon.
- **Mail:** Ember Mail, prot +4, def −1, mor +2.
- **Regen:** a ring, regeneration 10%.
- **Thug kit:** blade, mail, a helm with prot +2, regen, and a charm with att +3.

| Body | Kit | 12 indeps (8 LI, 4 archers) | 16 indeps (11 LI, 5 archers) | 20 Heavy Infantry |
|---|---|---|---|---|
| Ash Chieftain (hp 14) | none | 0% | 0% | 0% |
| | thug kit | 6% | 0% | 0% |
| Warden Captain (hp 14, prot 7) | thug kit | 25% | 1% | 0% |
| Titan (hp 60, prot 10) | none | 91% | 40% | 0% |
| | blade | 91% | 40% | 0% |
| | mail | 100% | 84% | 2% |
| | regen | 100% | 84% | 0% |
| | blade, mail, regen | 100% | 99% | 20% |
| | thug kit | 100% | 100% | 80% |

**Reading.**
- **Human commanders cannot be thugs.** In Dominions too, thugs are built on strong bodies. Items
  for human commanders should serve the army (inspire) or magic (boosters).
- **A Titan becomes a thug** with three to five items: from 0% to 80% against a 20 Heavy Infantry
  hill province.

### 7.2 Single effects on big bodies, against armies (`calc/sc2.ts`, `calc/counter.ts`)

| Great Wyrm (hp 120, prot 16) | Cinder start army (20 warriors, 10 archers, chieftain) | Giant + 25 HI | 20 HI |
|---|---|---|---|
| none | 14% | 5% | 76% |
| prot +1 | 34% | 13% | 92% |
| prot +2 | 56% | 25% | 98% |
| prot +3 | 77% | 43% | 100% |
| regen 5% | 43% | 25% | 98% |
| hp +10 | 20% | 7% | 84% |
| att +3 | 18% | 8% | 87% |
| fire shield 4 | 28% | 12% | 87% |
| mor +4 | 14% | 5% | 76% |
| prot +2 and regen 5% | 93% | 76% | 100% |

The Titan gains nothing from any single one of these against an army: 0% across the row.

Weapons on the Titan (Great Sword 8, str 20), from `calc/weapons.ts`:

| Weapon | 12 indeps | 16 indeps | 20 HI |
|---|---|---|---|
| Great Sword 8 (its own) | 91% | 40% | 0% |
| dmg 11 | 91% | 41% | 0% |
| armor piercing or negating | 91% | 40% | 0% |
| att +3 | 94% | 46% | 0% |
| two strikes (N2) | 97% | 76% | 5% |

Counters (`calc/counter.ts`):

| Great Wyrm | Thornwood army | + Elder Druid casting Swarm (3 G carried) | Cinder army | + Cinder Magus casting Ember Dart |
|---|---|---|---|---|
| none | 33% | 0% | 14% | 0% |
| prot +2, regen 5% | 99% | 0% | 93% | 59% |

**Reading.**
- **Protection is steep, and steeper with a high base.** At prot 16, each extra point removes a
  large share of the hits that still did damage, because damage is `str + dmg + DRN − prot − DRN`.
  So item protection must be small (+1 Lesser, +2 Greater, +3 Artifact at most) and priced as
  the strongest effect.
- **Damage does not help a body that already one-shots troops. Strikes do.** Fluid Magic's thug
  weapons should give N2 strikes or an N1 area ability, not raw damage. That is Dominions' brand
  logic in Fluid Magic terms. Raw damage stays for human commanders and against high-prot
  targets.
- **Morale on a commander does nothing** (mor +4 is unchanged in the table). `battle/morale.ts`
  rolls only squads. A commander routs with its last squad without a roll, unless it is fearless
  (mor 50). Morale items must therefore inspire squads (7.3).
- **Super combatants have answers in M1.**
  - Green answers with Swarm: 20 hornets per cast, each sting armor-negating. A kitted Wyrm goes
    from 99% to 0%.
  - Red answers with Ember Dart (12, armor piercing): from 93% to 59%.
  - Dominions' rule "every super combatant needs a counter" already holds.

### 7.3 Inspiration on an army (`calc/banner.ts`)

The attacker is an Ash Chieftain with 20 Cinder Warriors and 10 Flame Archers. The bonus goes to
the squads it leads.

| Squads led get | vs 20 HI (hills) | vs Thornwood's start army |
|---|---|---|
| nothing | 77% | 40% |
| mor +1 | 82% | 45% |
| mor +2 | 87% | 50% |
| mor +3 | 89% | 52% |
| att +1 | 84% | 44% |
| att +2 | 84% | 43% |

**Reading.** Each point of inspiration is worth about 5 points of win rate up to +2, then it
flattens. That is a real but modest army item, and a good Lesser or Greater charm. Attack for the
squads is worth about the same at +1 and adds little at +2, so morale is the cleaner item.

### 7.4 Economy pace (`calc/economy.ts`)

These are headless games with the Phase 6 dummy AI, 10 seeds. The dummy researches with the mages
it has and casts no rituals, so banked mana is about the total income.

| Month | Own-color mana banked (median, range) | Own-color research level (median) |
|---|---|---|
| 3 | 17 (15 to 22) | 1 |
| 6 | 41 (36 to 51) | 1 |
| 12 | 102 to 106 (84 to 136) | 1 |
| 18 | 178 to 192 (139 to 248) | 1 |
| 24 (6 games still running) | 264 to 270 (199 to 390) | 2 |

**Reading.**
- Own-color income is about **7 a month early, 10 to 12 by month 12 to 18, and 15 by month 24**.
  Rituals cost 2 to 18. Items priced at about 4 mana a pip fit: a Lesser item is about half a
  month's early income, and an artifact is two to three months of mid-game income.
- Research with only the starting mages reaches level 2 at about month 24. Level 3 items need a
  nation that recruits researchers, and level 5 artifacts are late prizes. The Phase 7 AI may
  research faster. The design should re-measure with it.

---

## 8. Distilled: an item system for Fluid Magic

### 8.1 The rules, one sentence each

Sim rules (each one tested alone):

| # | Rule | Dominions source |
|---|---|---|
| **F1 Forge** | A mage forges an item as a ritual: in an own lab, with the item's pips and research level, paying its mana when it begins, busy for its forge days, and the item then lies in the nation's vault. | 1.1 |
| **R2 Vault** | Forged, captured, and unequipped items wait in the nation's vault, which any own lab reaches. | treasury, 1.6 |
| **R3 Equip** | A commander standing in an own lab province, not busy with a ritual or a forge, can take an item from the vault into a free slot of its kind, or put one back. | 1.6 |
| **R4 Slots** | A commander's body has a fixed set of slots, an item needs a free slot of its kind, a two-handed item also fills the shield slot, and no commander wears two of the same item. | 1.3; AoW4 disabled slots |
| **R5 Effects** | An item adds its numbers to its wearer's, and a weapon item replaces the wearer's melee weapons while worn. | standard-item rule, 1.3 |
| **R6 Boosters** | A booster adds a pip only in a color its wearer already has, for casting and forging, never for research or the bless. | 1.4 |
| **R7 Inspire** | Inspiration adds to the morale of every squad its wearer leads. | Inspirational, 1.4; TW banners |
| **R8 Spoils** | A commander who dies in or because of a battle leaves its items to the vault of the side that holds the field (Independents keep them as the province's hoard until a nation takes it), and one that dies anywhere else saves them to its own vault only if it stands in an own lab province. | 1.6; HoMM3 |
| **R9 Artifacts** | An artifact is unique: no one may begin forging it while it is being forged or exists, and once destroyed it can be forged again. | 1.7 |

Presentation rule (not sim): **every worn item shows**. In battle it is a part on the sprite, on
cards it is a slot glyph, and the Codex has its page (Battle Brothers, AoW4).

Everything else rides on what exists or is already planned:
- `CombatStats` fields;
- the ritual payment, countdown, and interruption code;
- `giveMana`'s lab test;
- the pretender design's N1 abilities, N2 strikes, and N4 retaliation element;
- the `flying`, `swampwalker`, and `stealthy` tags.

**Edge rulings:**
- A retreating or routing commander keeps its items.
- A commander that dies in a retreat with nowhere to go died "because of a battle".
- A reforming pretender (N8) returns without its items, which went to the field holder.
- An eliminated nation's vault is destroyed, and its artifacts become forgeable.
- The garrison holder takes no items, because it takes no orders.
- Summoned commanders (Salamander, Treant) wear items by their body plans.

### 8.2 Data shapes

```ts
// src/content/items/types.ts
export const SLOT_KINDS = ['weapon', 'shield', 'head', 'body', 'feet', 'charm'] as const;
export type SlotKind = (typeof SLOT_KINDS)[number];
export type ItemTier = 'lesser' | 'greater' | 'artifact';

export interface ItemEffects {
  stats?: Partial<Record<'hp' | 'str' | 'att' | 'def' | 'prot' | 'prec', number>>;
  weapon?: WeaponDef;                 // replaces melee weapons (R5); N2 strikes allowed
  mapSpeed?: number;                  // added, capped at 3 (also sets the closing round)
  regeneration?: number;              // fraction of max HP per round
  fireShield?: number;                // with shieldElement (pretender N4)
  shieldElement?: Element;
  tags?: readonly UnitTag[];          // flying, stealthy, swampwalker
  inspire?: number;                   // R7
  pips?: Partial<Record<Color, number>>; // R6 boosters
  abilities?: readonly AbilityId[];   // the shared catalog below
}

export interface ItemDef {
  id: string;
  name: string;
  color: Color;                       // research track and mana color
  tier: ItemTier;
  slot: SlotKind;
  twoHanded?: true;                   // weapons only (R4)
  requirement: string;                // docs/02 notation: 'R', 'RR', 'GGG'
  level: number;                      // research level in `color`: 1, 3 or 5
  cost: { mana: ManaAmounts; generic: number };
  forgeDays: number;
  /** One sentence: what it does. Shown on the card and in hover. */
  description: string;
  effects: ItemEffects;
}

// src/content/abilities.ts: ONE catalog shared with the pretender design (its N1 UnitAbility)
export const ABILITIES: Record<AbilityId, UnitAbility>; // primordialFear, kindleTheHost, callTheHunt,
// heatAura, risingBriars (chassis) + hornOfFury, hornOfTheHunt (items). Chassis and items both
// refer to abilities by id: UnitDef.abilities?: readonly AbilityId[].

// UnitDef.commander gains:  slots: readonly SlotKind[]   // e.g. HUMANOID below
// CommanderState gains:     gear: (ItemId | null)[]       // parallel to its unit's slots
// NationState gains:        vault: Record<ItemId, number> // a multiset: plain items have no identity
// ProvinceState gains:      hoard: Record<ItemId, number> // what Independents hold (R8)
// BattleRecord roster commanders gain gear: ItemId[]      // so the replay draws it
```

- **Forging as a ritual (F1).**
  - The registry derives one `RitualSpellDef` per item at build time: id `forge:<itemId>`, target
    self, effect `{ kind: 'forgeItem', item }`, with the item's cost, days, requirement, and
    level.
  - `castRitual`, payment, the countdown, interruption, the completion re-check, the Ritual
    panel's flow, and the AI all work unchanged. The one new primitive puts the item in the vault.
  - R9 adds one check to the ritual's begin validation.
  - The alternative is a `forgeItem` command that shares the ritual helpers. It is more code for
    the same behavior.
  - Watch the content tests that count "10 spells per color": generated forge rituals must stay
    out of that count.
- **Vault as a multiset.** No item instance ids are needed: plain items have no durability, no
  rolls, and no names. An artifact's existence is a selector over vaults, gear, hoards, and
  forge orders.
- **The shared abilities catalog** is the task's "one abilities catalog" with the pretender
  design. The pretender draft writes abilities inline per chassis, so moving them into
  `content/abilities.ts` is a small change there. The ability id stays the stat-change source id,
  so an ability never stacks with itself (pretender N1).

### 8.3 Tiers, costs, forge days

These are starting values for `docs/09-balance.md`, to be tuned with the pretender design's
`sim:duel` bands.
- **Colored mana:** 4 per requirement pip, plus 2 per pip beyond the third. That is Dominions'
  5, 10, 15, 20, 30 gem curve, scaled to Fluid Magic's measured income (7.4).
- **Generic mana:** 0, 2, or 8 by tier.

| Tier | Research level | Requirement | Colored mana | Generic | Forge days | Rough effect budget (from section 7) |
|---|---|---|---|---|---|---|
| Lesser | 1 | 1 pip | 4 | 0 | 10 | one small effect: prot +1, inspire +1, a weapon of dmg 6 to 7 with one property, +1 map speed |
| Greater | 3 | 2 pips | 8 | 2 | 15 | prot +2, regen 5%, a booster, N2 strikes 2, a battle-start ability |
| Artifact | 5 | 3 to 4 pips | 12 to 18 | 8 | 30 | two or three effects, prot never above +3, regen at most 10% |

For comparison, the rituals run from Call Fire Sprites (2 R, 5 days) to Ash Rain (12 R and 6
generic, 25 days).

### 8.4 Body plans for every M1 commander and chassis

Body plans follow the Dominions 6 data (1.3).

| Plan | Slots | Fluid Magic commanders |
|---|---|---|
| **Humanoid** | weapon, shield, head, body, feet, charm, charm | Scouts, Ash Chieftain, Warden Captain, Independent Captain, priests, Ember Adept, Cinder Magus, Sapling Druid, Elder Druid. Chassis: Oracle of the Flux, Titan, Ash Colossus; from the pretender draft, Ascended Hero, Pyre Lord, Ember Hierophant, Horned Hunter, Mother of Beasts, Briar King |
| **Rider** (M2) | weapon, shield, head, body, charm, charm (no feet) | mounted commanders, when they exist |
| **Horned beast** | head, charm, charm | Great Wyrm, Ash Phoenix, Primordial, Elder Wyrm (Dominions' Dragon and Phoenix) |
| **Beast** | charm, charm | Salamander, Treant, Wild Spirit, Living Flame (Dominions' Salamander, Treelord, elementals) |
| **Idol** | charm | Living Monolith, Cinder Idol, World Tree (Dominions' Monolith) |

The Codex and the paper doll show a missing slot as absent, with one line: "A wyrm has no hands:
head and charms only".

### 8.5 The M1 items: 8 Red, 8 Green

Each item passes the `docs/02` color pie. Ability ids are in the shared catalog.

**Red (Ember).**

| Item | Tier | Req | Slot | Effect (one sentence on the card) | Cost, days | Dominions analog |
|---|---|---|---|---|---|---|
| Flame Blade | Lesser | R | weapon | A fire blade: melee dmg 7, fire, and att +1 | 4R, 10 | Fire Sword (F1, 1) |
| Pendant of Fury | Lesser | R | charm | The squads it leads fight with +1 morale | 4R, 10 | Pendant of Courage (F1, 1), Horn of Valor |
| Cinder Treads | Lesser | R | feet | +1 map speed, at most 3; a speed-2 god closes a round sooner | 4R, 10 | Boots of Quickness |
| Brand of Ash | Greater | RR | weapon | Strikes twice a round: dmg 6 fire, strikes 2 (N2) | 8R + 2, 15 | Holy Scourge (F1, 3, 2 attacks), Fire Brand |
| Cinder Mail | Greater | RR | body | Burns who strikes it: hp +6, fire shield 3, no protection (Red does not defend) | 8R + 2, 15 | Red Dragon Scale Mail (F2, 5) |
| Crown of Embers | Greater | RR | head | +1 Red pip for casting and forging, and prot +1 | 8R + 2, 15 | Flame Helmet (F4, 5, +1 Fire) |
| Horn of the Burning Host | Greater | RR | charm | At battle start, Blood Fury falls on its largest squad (`hornOfFury`) | 8R + 2, 15 | Burning Pearl, Ring of the Warrior |
| **The Unquenched** | Artifact | RRRR | weapon | dmg 9 fire, strikes 2, and Heat Aura: each round from the front, 6 fire to 4 foes (`heatAura`) | 18R + 8, 30 | Unquenched Sword (F5, 9) |

**Green (Loam).**

| Item | Tier | Req | Slot | Effect | Cost, days | Dominions analog |
|---|---|---|---|---|---|---|
| Hunter's Spear | Lesser | G | weapon | dmg 6, armor piercing | 4G, 10 | Hunter's Knife (N1, 3, AP) |
| Barkskin Amulet | Lesser | G | charm | prot +1 | 4G, 10 | Barkskin Amulet (N1, 3) |
| Mossweave Boots | Lesser | G | feet | Walks swamps like home: it never loses attack there (swampwalker) | 3G, 10 | Ranger's Boots, Birch Boots (N1, 3) |
| Ring of Regrowth | Greater | GG | charm | Regenerates 5% of its HP each round | 8G + 2, 15 | Ring of Regeneration (N2, 5) |
| Thistle Rod | Greater | GG | weapon, two-handed | +1 Green pip for casting and forging; staff dmg 3 | 8G + 2, 15 | Thistle Mace (N2, 5, +1 Nature) |
| Barkhide Mail | Greater | GG | body | prot +2, hp +6, def −1 | 8G + 2, 15 | Green Dragon Scale Mail (N2, 5) |
| Horn of the Wild Hunt | Greater | GG | charm | At battle start, 4 Wolves join its side (`hornOfTheHunt`, as Call the Hunt) | 8G + 2, 15 | Handful of Acorns (N1, 3) |
| **Crown of the Ivy King** | Artifact | GGG | head | regen 5%, inspire +1, and Rising Briars at battle start (`risingBriars`) | 12G + 8, 30 | Crown of the Ivy King (N2, 9) |

The Mossweave Boots are weak on purpose, so they are priced at 3 G, below the formula. A
stronger effect such as "+1 def while defending its own dominion" would be a new rule, so I do
not recommend it. Swampwalker is honest, small, and one sentence.

**Should-haves (one per color), each with one more small rule:**
- **Orb of Kharnath** (R artifact, charm): +1 Red pip, and +1 R mana a month to its nation while
  worn. This is Dominions' elemental orbs, and it ties items to the mana economy. Rule: "an
  item's monthly mana goes to its wearer's nation".
- **Roots of the World** (G artifact, feet): +1 Green pip and regen 5%. This is the Boots of
  Antaeus (E4N1, 9). It needs no new rule, only a second Green artifact.

**M2 sketch (White, Blue, Black)**, from the same families, so the slots stay full per color:
- **W:** Shield of Dawn (shield, prot +2), Halo of the Faithful (a holy booster for priests),
  Banner of Order (inspire +2).
- **U:** Winged Sandals (flying), Lens of Tides (+RP, Dominions' Owl Quill), Mistcloak (stealthy
  and def +2), Frost Brand.
- **B:** Wraith Blade (life drain 2), Dread Helm (battle-start Fear, sharing `primordialFear`),
  Skull Staff (+1 Black pip).

### 8.6 What items never do in M1

They do not:
- raise a commander's own morale (inert, 7.2);
- grant spells to non-mages (the caster script and UI cost belongs to M2);
- add research points;
- change the bless;
- give temporary carried mana (a write-back rule);
- give gold or materials;
- curse their wearer, weigh anything, wear out, or roll random stats;
- add set bonuses;
- reach troops.

Each of these is a rule that does not earn its place in M1.

### 8.7 Presentation layers

Following the UI spec draft's L0 to L4:

| Layer | What shows |
|---|---|
| **L0 glance** | Portrait frame: a gear count and the best tier's shape. Battle: every item visible on the sprite (8.8). Army badge: an artifact star when an artifact is worn |
| **L1 hover** | Item tooltip: name, tier shape and color symbol, slot icon, the one-sentence description, then numbers with their meaning ("prot +2: subtracted from every hit"). It names where the item is (worn by, vault, being forged, hoard) |
| **L2 concept** | Dotted terms: Vault, Booster, Inspiration, Artifact, Two-handed, Spoils, Hoard. Each is one sentence, from section 8.1 |
| **L3 panel** | Commander panel, **Gear** tab: a paper doll of the body plan's slots, with absent slots not drawn and one line why. In an own lab, the vault list is filtered to what fits; elsewhere a disabled stub says "Items change hands in a lab". Ritual panel: a **Forge** group listing forgeable items for the selected mage, with cost symbols, days, and the reason when an item is dimmed |
| **L4 screen** | Codex: an Items page by color and tier (requirement, level, cost, where a player meets it). Ledger: an **Items** view of every own item and where it is, plus the world's artifacts and their holders as far as known (Dominions' F8) |

- **Tier shapes:** Lesser ○, Greater ◆, Artifact ★, always beside the mana symbol, so tier and
  color never rely on hue (`docs/07`).
- **Slot icons:** sword, shield, helm, cuirass, boot, ring.

### 8.8 Visible gear (battle presentation hooks)

Item looks are presentation content (`src/content/presentation/items.ts`). The sim never reads
them.

| Slot | Battle rig change | Sound | Notes |
|---|---|---|---|
| weapon | swaps the `weapon` part and its `WeaponLook` (motion, weight, projectile, sound). An element tints the blade (fire flicker) | the weapon's swing family | strikes 2 shows two swings, as the battle design's attack counts already allow |
| shield | adds the `shield` part (round or kite) | `shield.wood` or a metal variant | reactions use the shield as for Wardens |
| head | swaps `helm` for a helm or crown variant | a helm bong on head hits (battle design sound bank) | crowns read at 64 px by silhouette |
| body | a torso overlay, and sets the unit's `material` | impacts by material (`ember`, `bark`, `plate`) | Battle Brothers' "armor as its own layer" |
| feet | a boot overlay on `legBack` and `legFront` | footsteps | subtle |
| charm | a chest glint, plus `extras` where the effect has one: `regen` for Regrowth, `fireShield` for Cinder Mail, a pennant on the leader's `banner` for inspiration | — | an effect that already has a cue keeps it |

- Abilities fire their own `ability` event cues (pretender design C.5).
- Portraits (Phase 11) draw the same parts.
- One content test asks that every item has a look, and that no two items share a look and a
  slot unless their effects are equal (Battle Brothers' Dev Blog #34 lesson).

### 8.9 Commands, AI, tests

**Commands.** All are validated, and the AI uses the same ones:
- `castRitual` with `forge:<itemId>`, or `forgeItem` (F1);
- `equipItem { nation, commander, item, slot }` (R3, R4);
- `unequipItem { nation, commander, slot }`.

Refusal texts, one each: "Items change hands in a lab you own", "{name} is busy forging", "A wyrm
has no hands", "The shield slot is filled by a two-handed weapon", "Already wears one", "The
Unquenched already exists".

A booster is never refused. On a wearer without that color, the hover says "Its Red pip needs a
Red mage", and the item's other effects still apply.

**AI** (Phase 7 follow-up; personality data, no new numbers in code):
- Forge from a per-nation priority list in `NationDef.ai` when the mana spare covers the cost and
  a researched-enough mage is free.
- Equip the pretender first, then army leaders by troops led, then mages with boosters.
- The AI never hoards. It equips whenever it stands in a lab.

**Tests** (`tests/` mirroring `src/`):
- **Content:** every item validates:
  - the requirement parses;
  - the level is in 1 to 6;
  - the slot exists on at least one body plan;
  - `twoHanded` appears only on weapons;
  - abilities exist in the catalog, and their effects pass `battleEffectProblems`;
  - the description is one sentence.
  - Every commander unit has a body plan. Every item has a look.
- **F1:** forging pays, takes its days, puts the item in the vault, stops on another order with
  the mana lost, and refuses without the pips, the research level, or a lab.
- **R3 and R4:**
  - equipping works only in an own lab and refuses when busy;
  - a slot must be free and of the right kind;
  - two-handed fills the shield slot;
  - duplicates are refused;
  - a body plan without hands refuses weapons.
- **R5 to R7:** `statsFor` folds item stats and replaces melee weapons, and ranged ones stay.
  Regeneration and fire shield add up. Inspiration raises led squads' morale and no one else's.
  A booster works only with an existing pip, and `canResearch` and the RP rate ignore it.
- **R8:**
  - the winner's vault takes a dead enemy's items, and the loser's own dead's items too;
  - Independents' wins go to the province hoard, and capture moves the hoard to the captor's
    vault;
  - an out-of-battle death keeps items only in an own lab;
  - an elimination destroys the vault.
- **R9:** a second forge of an artifact is refused while one is being forged or exists, and a
  destroyed artifact can be forged again.
- **Determinism and saves:** the golden hash holds with items, and a save migration adds empty
  vaults, gear, and hoards.
- **Balance bands** (`sim:duel`, pretender design): the 7.1 and 7.2 tables become pinned bands
  for the Titan and Wyrm with M1 items, against the Swarm and Ember Dart counters.

### 8.10 Phases, M1 and M2

| Phase | Work |
|---|---|
| **6c** (sim and content, after the pretender design's 6b) | the 16 items, body plans for all commanders and chassis, `abilities.ts` shared with 6b, vault, gear, and hoard state, F1 and R2 to R9, the commands, tests, and docs (`docs/02` a "Magic items" section, `docs/03` body plans, `docs/04` the fold and inspiration, `docs/09` costs) |
| 7b | AI forging and equipping with the same commands |
| 8 | commander panel Gear tab (paper doll, vault in a lab), item tooltips |
| 9 | the Forge group in the Ritual panel, Codex Items, Ledger Items |
| 10 | the replay draws gear from the battle record's roster; item cues |
| 11 | SVG item parts: about 16 items × 1 to 2 parts ≈ 25 small files |
| 12 | tune costs and caps against the duel bands and the playtest |

M2:
- White, Blue, and Black items;
- field swaps between commanders in one province;
- a Carrier Eagle-like sending ritual (Blue);
- monthly-mana artifacts (if the should-have is cut from M1);
- temporary carried mana;
- items that grant spells;
- sets;
- mounted commanders and the rider plan;
- starting hoards at mapgen (if not in M1).

### 8.11 Open questions for the owner

1. **Spoils.** The proposal is "the side that holds the field takes the fallen's items" (HoMM3,
   deterministic). The alternatives are Dominions' chance by tier, or Total War's "lost, except
   artifacts". Which feels right?
2. **Two charm slots or one?** Two gives Dominions' kits (regen ring plus amulet) and booster
   stacking. One is simpler, and the measured super combatant needs two items to become strong.
3. **Artifacts at research level 5.** With the dummy AI's pace, level 5 is a late prize. Should
   artifacts be rare late-game trophies, as in Dominions, or come earlier, at level 4?
4. **Starting hoards.** Should strong Independent provinces (distance 3 or more) start with a
   Lesser item in their hoard, chosen by mapgen's seeded rng and visible once scouted? That is
   HoMM's and AoW4's treasure on the map in one sentence, and it uses R8's hoard.
5. **Naming.** The Red ritual **Forge of Cinders** makes materials, not items. Keep the name and
   let the Codex say so, or rename the ritual (for example, *Cinder Furnace*) so that "forge"
   always means items?

---

## Sources

**Dominions 6 manual** (unofficial web edition of the official manual; chapter sources on
GitHub):
- [Ch. 2 The Basics](https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html)
- [Ch. 4 Units](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)
- [Ch. 5 Movement](https://dmacguigan.github.io/dom6-manual/chapters/05-movement.html) (turn order)
- [Ch. 7 Magic](https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html)
- [Ch. 10 Magic Items](https://dmacguigan.github.io/dom6-manual/chapters/10-magic-items.html)
  ([source](https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/10-magic-items.qmd))
- [Ch. 11 Path Boosters](https://dmacguigan.github.io/dom6-manual/chapters/11-path-boosters.html)
  ([source](https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/11-path-boosters.qmd))
- [Ch. 15 Other Rituals](https://dmacguigan.github.io/dom6-manual/chapters/15-other-rituals.html)

**Dominions game data:**
- [dom6inspector gamedata](https://github.com/larzm42/dom6inspector/tree/master/gamedata)
  (`BaseI.csv`, `BaseU.csv`)

**Dominions wiki and forums** (search extracts):
- illwiki: [item](https://illwiki.com/dom5/item), [items](https://illwiki.com/dom5/items),
  [laboratory](https://illwiki.com/dom5/laboratory),
  [thugs and supercombatants](https://illwiki.com/dom5/thugs-and-supercombatants),
  [magic](https://illwiki.com/dom5/magic), [Dom6 gems](https://illwiki.com/dom5/dom6/gems),
  [Dom6 magic](https://illwiki.com/dom5/dom6/magic)
- Steam: [Dom4 item recovery](https://steamcommunity.com/app/259060/discussions/0/648814843350827187),
  [Dom6 items and labs](https://steamcommunity.com/app/2511500/discussions/0/4545904024628106646),
  [SC vs thug](https://steamcommunity.com/app/722060/discussions/0/1729837292642626646/),
  [kitting a thug](https://steamcommunity.com/app/722060/discussions/0/2906376154330926315/),
  [construction and boosters](https://steamcommunity.com/app/722060/discussions/0/3800524658150908919/)
- [dominionsmods item drop](http://dominionsmods.com/index.php?showtopic=3533)

**Age of Wonders 4:**
- [AoW4 wiki Equipment](https://aow4.paradoxwikis.com/Equipment) (search extract)
- [AoW4 wiki Giant King](https://aow4.paradoxwikis.com/Giant_King)
- [aow4db data](https://github.com/minionsart/aow4db) (`Data/EN/HeroItems.json`)
- [GameRant forge guide](https://gamerant.com/age-of-wonders-4-aow4-how-craft-items-forge/)
- [Steam, resurrection](https://steamcommunity.com/app/1669000/discussions/0/3826415752018066477/)
- `pretender-design/research-aow4.md` 1.6, with its sources

**Heroes of Might and Magic:**
- Heroes 3 wiki: [Artifact](https://heroes.thelazy.net/index.php/Artifact),
  [Combination artifact](https://heroes.thelazy.net/index.php/Combination_artifact),
  [Retreat](https://heroes.thelazy.net/index.php/Retreat),
  [Surrender](https://heroes.thelazy.net/index.php/Surrender),
  [Combat](https://heroes.thelazy.net/index.php/Combat)
- [Wikipedia, Shadow of Death](https://en.wikipedia.org/wiki/Heroes_of_Might_and_Magic_III:_The_Shadow_of_Death)
- [StrategyWiki, HoMM3 artifacts](https://strategywiki.org/wiki/Heroes_of_Might_and_Magic_III:_The_Restoration_of_Erathia/Artifacts)
- [Olden Era artefacts](https://olden-era.com/en/artefacts)

**Total War: Warhammer:**
- TW Warhammer wiki:
  [WH3 items](https://totalwarwarhammer.fandom.com/wiki/Total_War:_Warhammer_III_items),
  [Banners](https://totalwarwarhammer.fandom.com/wiki/Banners),
  [Rarity](https://totalwarwarhammer.fandom.com/wiki/Rarity)
- [Total War wiki, How Lords Work](https://wiki.totalwar.com/w/How_Lords_Work)
- twdb: [items](https://twdb.io/warhammer3/database/items/),
  [rare items](https://twdb.io/warhammer3/database/features/rare-items/)
- [PC Gamer, the item rebalance](https://www.pcgamer.com/games/strategy/total-war-warhammer-3s-latest-patch-radically-reattunes-its-magic-item-system-in-total-some-600-ancillaries-have-had-their-effects-and-rarity-adjusted/)
- Steam: [WH2 lost items](https://steamcommunity.com/app/594570/discussions/0/1743358239845452341/),
  [WH3 lost items](https://steamcommunity.com/app/1142710/discussions/0/4521136683852835018/)

**Battle Brothers:**
- Dev blogs: [#5](https://battlebrothersgame.com/dev-blog-5-concept-art-explaining-battle-brothers-character-art-style/),
  [#33](http://battlebrothersgame.com/dev-blog-33-character-generation-hiring-shopping/),
  [#34](https://battlebrothersgame.com/dev-blog-34-new-armor-helmet-rework-banners/),
  [#49](http://battlebrothersgame.com/dev-blog-49-progress-update-character-backgrounds-visual-makeover-continued/)
- [BB wiki, Named and Legendary Items](https://battlebrothers.fandom.com/wiki/Named_and_Legendary_Items)
- Steam: [fatigue](https://steamcommunity.com/app/365360/discussions/0/596265621109345097/),
  [loot 1](https://steamcommunity.com/app/365360/discussions/0/2971776551517767395),
  [loot 2](https://steamcommunity.com/app/365360/discussions/0/1741106440023428663)
- [RPGHQ perk list](https://rpghq.org/forums/viewtopic.php?p=93730)
- [armor and fatigue guide](https://mygamingtutorials.com/2025/05/19/battle-brothers-guide-understanding-armor-and-fatigue-management/)

**Repository and sibling designs:**
- `docs/02-magic.md`, `docs/03-nations.md`, `docs/04-battle.md`
- `src/content/types.ts`, `src/sim/battle/{setup,morale,types}.ts`, `src/sim/commanders.ts`,
  `src/sim/commands/magic.ts`
- `../pretender-design/design-draft.md` (N1 to N8, chassis)
- `../battle-design/final.md` (S4.4 rigs and parts, unit looks, sound bank)
- `../ui-design/spec-draft.md` (L0 to L4, commander panel)

**Scripts for this note:**
- `tools/`: `items.py`, `flags.py`, `show.py`, `slots.py`, `aow4.py`, `aow4b.py`. Other
  scripts in `tools/` belong to the sibling units note.
- `calc/`: `thug.ts`, `sc.ts`, `sc2.ts`, `weapons.ts`, `banner.ts`, `counter.ts`, `economy.ts`
