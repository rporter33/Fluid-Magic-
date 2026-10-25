## Docs text

Exact text for the repository docs, each block with the commit it lands in. Every changed doc
records that the owner's direction drove the change. Where a sibling track also rewrites a
doc (the UI spec replaces `docs/07`; the battle and pretender tracks edit `docs/04` and
`docs/10`), these blocks apply to the doc as those tracks leave it, and say where they go.

### `docs/03-nations.md` (lands in 7b.1)

**Replace the section `## Unit stat model`, through its "Baseline human infantry" paragraph, with:**

````markdown
## Unit stat model

Extended on 2026-10-21 at the owner's direction: "the detail stats from giants to horses like
Dominions and with the items are very immersive, added immersion without completely making it
over complicated makes this game very engaging and replayable." Every field below explains a
number the game already has, or carries one rule that fits one sentence; the UI shows them in
layers (card, hover, Codex; `docs/07-ui.md`).

| Field | Meaning |
|-------|---------|
| hp | hit points |
| str | strength, added to melee damage |
| att | attack skill |
| def | defense: the unit's own skill plus its gear's (a round shield +2, thornplate −1). The skill is derived (`def − gear`), never stored |
| prot | protection: natural armor plus the unit's gear pieces, exactly |
| mr | magic resistance. No M1 rule reads it, so the UI does not show it |
| mor | morale |
| prec | precision, for ranged attacks |
| size | 1 to 6: Man-sized, Large, Great, Huge, Colossal, Gargantuan. Bigger targets draw more blows (`docs/04-battle.md`); a body eats supply equal to its size (`docs/01-core-rules.md`) |
| mapSpeed | 1 slow, 2 normal, 3 fast |
| weapons | list of `{ name, dmg, range?, ammo?, element?, armorPiercing?, armorNegating?, firstRoundBonus? (Charge), reach?, strikes?, maxTargetSize?, materials? }` |
| tags | sacred, undead, beast, flying, construct, mounted, mindless, berserk, stealthy, immobile, swampwalker |
| role | one word: Light infantry, Heavy infantry, Shock infantry, Skirmisher, Archer, Cavalry, Sacred warrior, Scout, General, Priest, Mage, Beast, Summon, Monster, God |
| gear | armor pieces from the gear registry (Bodies and kit, below) |
| naturalProt | armor that is the body: hide, bark, scale |
| mount | mounted units only: a named mount with its natural weapons and its share of the materials |
| resist | signed elemental resistance: fire +10 takes 10 less from each fire hit, fire −5 takes 5 more |
| regeneration | share of max HP healed each round; when several sources apply, only the best counts |
| abilities | battle-start abilities, commanders only; every other ability derives from the fields above |
| description | the lore line; its first sentence (at most 120 characters) explains the unit's oddest number |
| gold, materials, popCost, recruitDays | recruitment costs. Gear, weapons and mount add up to no more than the materials cost; the rest is shown as "fittings" |
| leadership | commanders only: max troop count led |
| pips, holy | commanders only |
| body | commanders only: the body plan that sets its item slots (`docs/02-magic.md` section 9) |

Baseline human infantry: hp 10, str 10, att 10, def 10, prot 0, mr 10, mor 10, prec 10, size 1.
Armor adds prot; weapons add dmg.
````

**Add before `## Sketches for M2 (not implemented in M1)`:**

````markdown
## Bodies and kit

Added on 2026-10-21 at the owner's direction ("the detail stats from giants to horses like
Dominions and with the items are very immersive"). The stat tables above keep every number;
this section names the bodies and the gear that make them. Content lives in
`src/content/{sizes,gear}.ts` and the unit files, and `tests/content/gear.test.ts` checks every
sum.

### Size classes

| Size | Name | Glyph | Draws blows | Supply a day |
|---|---|---|---|---|
| 1 | Man-sized | standing man | ×1 | 1 |
| 2 | Large | horse | ×2 | 2 |
| 3 | Great | bear | ×3 | 3 |
| 4 | Huge | giant | ×4 | 4 |
| 5 | Colossal | colossus | ×5 | 5 |
| 6 | Gargantuan | wyrm | ×6 | 6 |

Size does not shield a body from trample: a trampling weapon hits only bodies of its own
`maxTargetSize` or less.

### Gear pieces

| Piece | Slot | Prot | Def | Materials | Material (look and sound) |
|---|---|---|---|---|---|
| Leather Cap | head | 1 | 0 | 1 | soft |
| Iron Cap | head | 2 | 0 | 2 | mail |
| Antlered Helm | head | 3 | 0 | 4 | bark |
| Quilted Robe | body | 1 | 0 | 1 | soft |
| Leather Jerkin | body | 1 | 0 | 1 | soft |
| Wolf Pelt | body | 2 | 0 | 2 | hide |
| Ritual Vestments | body | 2 | 0 | 3 | soft |
| Scale Shirt | body | 2 | 0 | 3 | scale |
| Scale Hauberk | body | 4 | 0 | 6 | scale |
| Bark Mail | body | 4 | 0 | 6 | bark |
| Mail Hauberk | body | 5 | 0 | 10 | mail |
| Thornplate | body | 7 | −1 | 18 | bark |
| Round Shield | shield | 0 | +2 | 3 | wood |

Weapon materials: Dagger 1, Knife 1, Staff 1, Spear 2, Javelins 2, Sword 3, Lance 3, Axe 4, Oak
Maul 4, Fire Arrows 4, Longbow 6, Halberd 6, Burning Blade 6, Great Axe 8. Mounts: Ash Horse 7,
War Wolf 7.

### Cinder Horde

| Unit | Size | Role | Gear (natural) | Def = skill + gear | Mount | Resist | Lore line |
|---|---|---|---|---|---|---|---|
| Ash Militia | 1 | Light infantry | Leather Cap | 8 | — | — | Herders levied with a spear and a cap; they break when the line breaks. |
| Cinder Warrior | 1 | Heavy infantry | Scale Shirt, Leather Cap | 9 | — | — | Clan warriors in ash-blackened scale, for whom the axe is an oath. |
| Ember Skirmisher | 1 | Skirmisher | Leather Cap | 11 | — | — | Runners who throw four javelins and are gone into the smoke. |
| Flame Archer | 1 | Archer | Leather Jerkin, Leather Cap | 9 | — | — | Pitch-dipped arrows that set the enemy line alight. |
| Berserker | 1 | Shock infantry | Wolf Pelt | 7 | — | — | Fury-sworn, bare-chested under a wolf pelt, they do not know how to run. |
| Ash Rider | **2** | Cavalry | Scale Shirt, Iron Cap | 11 | Ash Horse (no weapon) | — | Clan lancers on ash-grey horses bred to carry, not to fight; the first charge is everything. |
| Flamebrand | 1 | Sacred warrior | Scale Hauberk, Iron Cap | 11 | — | fire +3 | Temple champions whose blades burn with the god's fire, which barely touches them. |
| Fire Sprite | 1 | Summon | (0) | 14 | — | fire +10 | A flicker of living flame with no will of its own. |
| Scout | 1 | Scout | Leather Cap | 10 | — | — | Hooded runners who see without being seen. |
| Ash Chieftain | 1 | General | Scale Hauberk | 10 | — | — | The clan's chosen, who leads eighty in a scale hauberk. |
| Pyre Priest | 1 | Priest | Ritual Vestments | 10 | — | — | Keeper of the pyre-flame, who blesses the warriors before battle. |
| Ember Adept | 1 | Mage | Quilted Robe | 10 | — | — | A spark-reader in quilted robes; one pip of fire, and much to learn. |
| Cinder Magus | 1 | Mage | Ritual Vestments | 10 | — | — | Master of the Kharnath pyres; some are born with a third ember. |
| Salamander | 3 | Beast | (8) | 10 | — | fire +10 | A fire beast bound by ritual; it breathes flame and bathes in it. |

### Thornwood

| Unit | Size | Role | Gear (natural) | Def = skill + gear | Mount | Resist | Lore line |
|---|---|---|---|---|---|---|---|
| Thorn Militia | 1 | Light infantry | Leather Jerkin, Leather Cap | 9 | — | — | Forest folk with boar spears that blunt a charge. |
| Warden | 1 | Heavy infantry | Bark Mail, Iron Cap, Round Shield | 9 + 2 = 11 | — | — | Shield-bearers of the deep wood: slow, patient, and hard to kill. |
| Longbow Hunter | 1 | Archer | Leather Jerkin, Leather Cap | 10 | — | — | Yew longbows that reach the last rank. |
| Briar Guard | 1 | Heavy infantry | Thornplate, Iron Cap | 11 − 1 = 10 | — | — | Halberdiers in grown thornplate, the wall the forest raises; it is heavy to fight in. |
| Wolf Rider | **2** | Cavalry | Leather Jerkin, Iron Cap | 12 | War Wolf (Wolf Bite 3) | — | Riders on war wolves; the wolf bites as the spear strikes. |
| Oakheart | 2 | Sacred warrior | Thornplate (3) | 10 − 1 = 9 | — | fire −3 | A walking oak under thornplate; dry wood burns. |
| Wolf | 1 | Beast | (1) | 11 | — | — | A grey wolf of the deep wood. |
| Hornet Swarm | 1 | Summon | (0) | 13 | — | — | A cloud of stinging hornets that no armor keeps out. |
| Scout | 1 | Scout | Leather Cap | 10 | — | — | Hooded runners who see without being seen. |
| Warden Captain | 1 | General | Bark Mail, Antlered Helm, Round Shield | 8 + 2 = 10 | — | — | A Warden who leads eighty from under an antlered helm; he watches the line, not his own guard. |
| Grove Priest | 1 | Priest | Ritual Vestments | 10 | — | — | Speaker for the grove, who blesses the line before battle. |
| Sapling Druid | 1 | Mage | Quilted Robe | 10 | — | — | A young druid; one pip of loam, and the forest's patience. |
| Elder Druid | 1 | Mage | Ritual Vestments | 10 | — | — | An old druid who can wake the trees; some hear a third voice. |
| Treant | 4 | Beast | (12) | 10 | — | fire −5 | An old tree woken by ritual: it mends itself, and dry wood burns. |

### Independents

| Unit | Size | Role | Gear (natural) | Def = skill + gear | Lore line |
|---|---|---|---|---|---|
| Light Infantry | 1 | Light infantry | Leather Jerkin, Leather Cap | 8 | Hired spears in leather. |
| Heavy Infantry | 1 | Heavy infantry | Mail Hauberk, Iron Cap | 10 | Mailed swordsmen of the hill holds. |
| Archer | 1 | Archer | — | 10 | Hunters with shortbows. |
| Swamp Fighter | 1 | Light infantry | — | 12 | Marsh folk, quick on bad ground. |
| Giant | 4 | Monster | (4) | 10 | A mountain giant, four men tall, who eats for four and draws every eye and every blow. |
| Independent Captain | 1 | General | Round Shield | 8 + 2 = 10 | A local lord with a shield and a grudge. |

Every Spear, Halberd and Hunting Spear has reach; the Lance has Charge +3. Body plans: every
national commander and the Independent Captain are humanoid; the Salamander and the Treant are
beasts; the pretender bodies' plans are in `docs/05-pretender.md`.
````

**In `## Implementation decisions`, replace the bullet "Stats the tables leave out" with:**

````markdown
- **Stats the tables leave out** take the baseline (`hp 10, str 10, att 10, def 10, prot 0,
  mr 10, mor 10, prec 10`), size 1, and map speed 2. This applies to every commander
  (including Scouts), except for map speed below. Sizes above 1 are in Bodies and kit.
````

**In `## Implementation decisions`, add at the end:**

````markdown
**Bodies and kit (Phase 7b)**

Added on 2026-10-21 at the owner's direction on detail "from giants to horses".
- **Riders are Large.** Ash Riders and Wolf Riders are size 2: rider and mount are one body in
  M1, with one HP pool. The mount is data (`UnitDef.mount`: name, look, natural weapons,
  materials). The Wolf Rider's Wolf Bite belongs to its War Wolf and strikes after the Spear,
  as before. The Ash Horse has no weapon. Separate mount HP is M2.
- **Gear sums.** Every unit's protection is its natural armor plus its pieces, exactly. For a
  recruitable unit, pieces, weapons and mount add up to no more than its materials cost; the
  rest is its fittings, derived and shown, never stored (0 for every M1 unit). Defense skill is
  derived as `def − gear def`. Nation variants of a piece share its numbers; the art draws
  them differently.
- **"Occupies more formation space"** is dropped from the size field: no rule ever did it, and a
  frontage cap would need a rule about who waits.
- **Resistances**: Treant fire −5, Oakheart fire −3, Salamander and Fire Sprite fire +10,
  Flamebrand fire +3. No human of either nation has one. Values are integers from −10 to 20.
- **Forest home** is a nation property. The UI shows it in the hover and the defense breakdown,
  not on troop cards.
- **The Warden Captain's lore line** explains his defense skill of 8, below his Wardens' 9: he
  watches the line, not his own guard. No number changed.
````

### `docs/04-battle.md` (lands in 7b.1, the items block in 7b.2)

**In "Round structure", step 3, replace "each troop makes one attack per weapon against a random
troop in the engaged enemy row" with:**

````markdown
each troop makes one attack per weapon against a troop of the engaged enemy row drawn at
random, weighted by size (a Huge giant is drawn four times as often as a man)
````

**Required tests: add:**

````markdown
- Size equivalence: a battle with no unit above size 1, no charge against reach, and no
  resistance in play gives a log identical to the uniform target draw.
````

**Replay log: add after the list of event kinds:**

````markdown
The per-blow detail stream (`docs/12-battle-presentation.md`) carries each damage roll's
`resist` and each strike's `braced`, and the roster names the items every commander wore.
````

**In the 6b.2 block "Pretender abilities and new battle rules (Phase 6b)", replace the bullet
"Retaliation shields" with:**

````markdown
- **Retaliation shields**: a unit's shields are a list of element and amount (the Ash
  Colossus: fire 5). After the melee hits of a phase land, each damaging hit on a shielded
  unit costs its striker the shield's amount, per element, ignoring protection but minus the
  striker's resistance to that element. Shields of one element add; each element logs its own
  `damage`, fire before nature.
````

**Implementation decisions: add a new block at the end:**

````markdown
**Unit depth and items (Phase 7b)**

Added on 2026-10-21 at the owner's direction: "the detail stats from giants to horses like
Dominions and with the items are very immersive, added immersion without completely making it
over complicated." Each rule fits one sentence, is tested alone, and adds no randomness
source.
- **Size draws blows.** "Bigger targets draw more blows: a Huge giant in the line takes four
  times a man's share." Every ranged and melee attack draws its target from its candidates
  with weight equal to the target's size: one draw, as before. When every candidate is size
  1 the draw is today's exactly, so such battles do not change in any bit. Spells do not use
  it: area damage still picks troops uniformly. A trampling weapon filters its candidates to
  its `maxTargetSize` first, then draws by size.
- **Reach blunts a charge.** "A charge bonus never lands on a troop that holds a reach weapon
  and is not fleeing." Spears, halberds and hunting spears have reach. The check reads the
  target's final melee weapons, items included, and adds no draw. It is FM's own rule; its
  precedent is Age of Wonders 4's charge resistance on polearm units, not Dominions' repel
  (which needs a longer weapon than the attacker's).
- **Elemental resistance.** "Fire resistance 5: fire hits deal 5 less. Fire −5: they deal 5
  more." A unit's resistance to a blow's element is subtracted from the damage base before the
  dice: `max(0, base − resist + DRN − armor − DRN)`. It applies to weapons, spells, retaliation
  shields and remote damage (Ash Rain: each troop's dice total minus its resistance). Physical
  damage has no resistance. There is no percentage step.
- **Regeneration does not stack.** "A unit heals by its single best source": the largest of its
  body's, its blessing's, and its items' regeneration. No source may exceed
  `BATTLE.maxRegeneration` (20%).
- **Items in battle** (`docs/02-magic.md` section 9): a commander's items add their numbers
  at setup; a weapon item replaces its melee weapons, and ranged weapons stay; the blessing's
  melee changes then apply to whatever melee weapon it holds; shields merge by element;
  resistances and spell power add; regeneration takes the best source. Inspiration adds to the
  morale of the squads the bearer leads, at setup; it is not a buff, so it stacks with Bless
  and Warcry. Item abilities fire at battle start after the body's, in slot order. An item
  ability that copies a spell (Seed of Barkskin, Ivy Grasp) carries that spell's source, so the
  two never land on one squad: the spell's target rule picks the next squad. Casting uses the
  commander's pips with its boosters.
````

### `docs/02-magic.md` (lands in 7b.2)

**Add after section 8 (as the pretender track leaves it):**

````markdown
## 9. Magic items

Added on 2026-10-21 at the owner's direction: "the detail stats from giants to horses like
Dominions and with the items are very immersive ... makes this game very engaging and
replayable." Items are forged, not found, and only commanders wear them.

- **Forging.** A mage standing in a lab in a province its nation owns forges an item with the
  `forgeItem` command. Its pips, boosters included, must meet the item's requirement, and the
  nation must have researched the item's level in its color. The whole cost is paid when the
  work begins (colored mana, then the generic part, split as for rituals), and the work takes
  the item's forge days. Any other order, a move, a retreat, or death ends it, and the mana is
  lost. At the last day the checks run again (mana aside); if one fails, nothing is refunded.
  The item goes to the nation's vault.
- **Tiers and prices.** 4 colored mana per requirement pip, plus the tier's generic mana.

  | Tier | Level | Requirement | Cost | Days |
  |---|---|---|---|---|
  | Lesser (○) | 1 | 1 pip | 4 | 10 |
  | Greater (◆) | 2 to 3 | 2 pips | 8 + 2 generic | 15 |
  | Artifact (★) | 4 | 3 pips | 12 + 8 generic | 30 |

- **Artifacts are unique**: nobody may begin forging one while it is being forged or exists.
  A destroyed artifact can be forged again.
- **Slots by body.** Weapon, head, body and two charms. A humanoid has all five, a wyrm a head
  and two charms, a beast two charms, an idol one charm. One item per slot, never two of the
  same item.
- **Effects.** An item adds its numbers and abilities to its wearer; a weapon item replaces its
  melee weapons, and the standard weapon returns when it comes off. An item's HP counts on
  both current and maximum HP; taking it off removes both, never below 1.
- **Boosters** add pips only in a color the wearer already has, up to 6, for casting and
  forging, never for research or the bless.
- **Inspiration** adds to the morale of every squad its wearer leads; several inspiring items
  add up.

Format: Name (tier, slot; requirement, level) effects.

### Red (Ember) items

1. **Flame Blade** (Lesser, weapon; R, L1) weapon dmg 7 fire.
2. **Pendant of Fury** (Lesser, charm; R, L1) inspire 1.
3. **Burning Pearl** (Lesser, charm; R, L1) att +2.
4. **Cinder Mantle** (Greater, body; RR, L2) hp +6, fire shield 3.
5. **Pyre Staff** (Greater, weapon; RR, L2) weapon dmg 3 fire; spell power 2.
6. **Crown of Embers** (Greater, head; RR, L2) booster R +1.
7. **Brand of Ash** (Greater, weapon; RR, L3) weapon dmg 6 fire, strikes 2.
8. **Horn of the Burning Host** (Greater, charm; RR, L3) inspire 2.
9. **The Unquenched** (Artifact, weapon; RRR, L4) weapon dmg 9 fire, armor piercing, strikes 2.
10. **Heart of Kharnath** (Artifact, charm; RRR, L4) booster R +2.

### Green (Loam) items

1. **Hunter's Spear** (Lesser, weapon; G, L1) weapon dmg 6, armor piercing, reach.
2. **Barkskin Amulet** (Lesser, charm; G, L1) prot +1.
3. **Moss Mantle** (Lesser, body; G, L1) fire resistance 5.
4. **Thistle Rod** (Greater, weapon; GG, L2) weapon dmg 3; booster G +1.
5. **Antler Crown** (Greater, head; GG, L2) inspire 1, prot +1.
6. **Ring of Regrowth** (Greater, charm; GG, L3) regeneration 5%.
7. **Barkhide** (Greater, body; GG, L3) prot +2, hp +6, def −1.
8. **Seed of Barkskin** (Greater, charm; GG, L3) at battle start, prot +2 for the battle on its
   largest squad (a Bark Skin: the spell never lands on that squad again).
9. **Crown of the Ivy King** (Artifact, head; GGG, L4) booster G +1; at battle start, Entangle's
   effects on the largest enemy squad for 5 rounds (an Entangle).
10. **Heartwood Aegis** (Artifact, body; GGG, L4) prot +3, hp +10, nature shield 3.

Red items never add protection or defense, and Green items never add defense or precision (the
color pie, section 1, as a content test).
````

**Implementation decisions: add a new block at the end:**

````markdown
**Magic items (Phase 7b)**

Added on 2026-10-21 at the owner's direction on items (section 9).
- **Forging is an order of its own**, not a ritual per item, so items stay out of the spell
  registry, the Research panel's spell lists and the AI's ritual step. It shares the ritual
  helpers: the pip check and the payment take narrowed shapes (`Requirement`, `ManaBill`) that
  spells and items both fit, and the mana leaves the pool through one `payMana`.
- **Casting pips**: a commander's pips plus its boosters, capped at 6, in colors where it has a
  pip. Casting (battle and rituals), forging, and the fatigue reduction for extra pips read
  them; research and the bless read base pips.
- **Booster refusal**: a commander may not take off or swap out a booster that its own forge or
  ritual still needs ("Varo needs Crown of Embers to finish Brand of Ash"). The completion check
  still runs.
- **Artifact reservation**: an artifact is reserved when its forging begins, so two nations can
  never forge the same one. The reservation ends with the order.
- **Research path**: nations start at level 1, so Lesser items exist from day 1. With the
  starting apprentice and priest researching (10 points a month), level 2 comes at about month
  9, level 3 at month 24 and level 4 (artifacts) at month 44; with four researchers (20 a
  month), at months 4.5, 12 and 22.
````

### `docs/01-core-rules.md` (Supply in 7b.1; section 15 in 7b.2)

**In "### Supply", replace the bullet "Every troop consumes 1 supply per day ..." with:**

````markdown
- A body consumes supply equal to its size each day: a man 1, a rider 2, a Huge treant 4, a
  Gargantuan wyrm 6. Undead and summoned constructs consume 0. Commanders eat their own size
  like troops; the garrison holder eats nothing. (Changed on 2026-10-21 at the owner's
  direction on detail "from giants to horses"; it replaces the size-3 threshold.)
````

**In "## 6. Nations, commanders, and armies", in the commander bullet, replace "carried mana,
and optionally pips (mage), holy pips (priest), or both." with:**

````markdown
carried mana, the magic items it wears (section 15), and optionally pips (mage), holy pips
(priest), or both.
````

**Add before `## Implementation decisions`:**

````markdown
## 15. Magic items

Added on 2026-10-21 at the owner's direction: "the detail stats from giants to horses like
Dominions and with the items are very immersive." How items are forged, what they do, and the
item list are in `docs/02-magic.md` section 9. This section is how they move.

- **The vault.** Every nation has a vault: forged and won items wait there, and any own lab
  reaches it.
- **Equipping.** A commander standing (not in transit) in a lab province its nation owns can
  take an item from the vault into a slot of its body, or put one back (`equipItem`,
  `unequipItem`). Equipping into a full slot swaps, and the old item goes to the vault.
  Equipping changes no order. Commanders cannot hand items to each other in the field in M1.
- **Item HP.** An item's HP counts on both current and maximum HP: healing, starvation and
  battle all use the item-inclusive maximum. Taking an item off removes its HP from both,
  never below 1.
- **Spoils.** A commander who dies in a battle, or because of one (a loser with nowhere to
  retreat, an immobile body that cannot flee), leaves every item it wore to the vault of the
  nation that won, the winner's own dead included. If Independents won, the items are
  destroyed.
- **Elimination** destroys the nation's vault and every item its commanders wear.
- **Recall.** A pretender recalled by Godless leaves its items in its own vault.
- **Artifacts** that are destroyed can be forged again.
- **Fog.** A nation sees its own vault and gear. Enemy gear shows in battle reports and
  replays.
````

### `docs/07-ui.md` (as the UI spec rewrites it; lands in Phases 8 and 9)

**Add after `## Commander panel and Battle Plan (left dock, on demand)`, as a fourth tab after
"Rituals":**

````markdown
- **Gear** (key G): a paper doll, added on 2026-10-21 at the owner's direction on "the items".
  - Slots follow the body plan. A slot the body lacks is drawn greyed with the plan's line ("A
    wyrm has no hands: head and charms only").
  - The full-body sprite wears what is shown. Standard kit reads "(standard)"; an item drawn
    over it reads "over Bark Mail"; a weapon item reads "replaces Staff 2".
  - The vault below lists the nation's items with filter chips (All, Weapon, Head, Body, Charm,
    Usable by this commander). Hovering an item writes deltas on the stat rows (`Prot 2 → 3 ▲1`,
    HP as current and maximum), from the same fold as battle setup. A source that would not
    count says so ("Regeneration 10% → 10% (its own is as high)").
  - A click equips into the item's slot (the first free charm for charms); a drag lights the
    valid slots; dropping on a full slot swaps. Unusable items stay listed, greyed, with the
    validator's reason.
  - Away from an own lab the vault list becomes one line with a link: "Items change hands in a
    lab you own. Nearest: Kharnath, 6 days ▸".
  - Keyboard: Tab between doll and vault, arrows within, Enter equips, Delete unequips.
  - Depth: commander → G → item (3 clicks).
````

**In `## Rituals (the Commander panel's Rituals tab, key C)`, add:**

````markdown
- **Forge group** (with its own filter chip, under the rituals): the items this mage can forge,
  by tier then level, each with its requirement, cost, days and card line; locked items under
  "Show locked" with the reason and, for research, the time to the level. Payment and Stop work
  as for rituals. Depth: mage → C → item → Forge (4 clicks).
````

**In `## Ledger (modal, key L)`, replace the Magic tab bullet with:**

````markdown
- **Magic:** mana sources, rituals in progress, every active effect seen, and **Items**: the
  vault, who wears what, and what is being forged, with days left.
````

**In `## Research (modal, key R)`, add:**

````markdown
- Beside the level bar: "Next item tier: Greater at level 2, in about 5 months".
````

**Add a new section after `## Tooltips and the Codex`:**

````markdown
## Unit cards and unit hovers

Added on 2026-10-21 at the owner's direction: "the detail stats from giants to horses ...
added immersion without completely making it over complicated". Detail is layered: the card
glances, the hover tells the whole truth, Shift shows every source, the Codex compares.
- **Card budget** (`UI.unitCard`, tested): at most 3 numbers (by role: HP, Prot, Dmg for
  fighters; HP, Prot, Shot for archers; HP and pips for mages), 3 glyphs (signature abilities,
  then the best melee weapon's chips, then "+N"; a squad's state chips first), and 1 element
  mark (the largest resistance or weakness, ▲ or ▼). The recruit card's cost row is its own
  line and outside the budget. Zero values never render.
- **The sprite is the first stat**: drawn with its gear, shield, mount and items, to scale on a
  shared baseline (`sizeScale`). Every body that is not man-sized carries its size silhouette
  (12 px) beside its name on recruit, squad and box cards.
- **Hover**: nation and role; size class in words and number ("Large (2)") with the class words
  (Mounted, Beast); speed in words; the lore line; the body block per troop; each weapon's line
  with its chips; the mount; the gear that composes protection; abilities with their one line,
  greyed with "(inactive: ...)" where they do not apply; non-zero resistances; worn items; and
  upkeep, supply, cost and days.
- **Shift**: every stat into its sources (base, gear, items, terrain, scales, bless, buffs,
  starvation, unpaid upkeep, storm, walls), each weapon into its damage parts (strength,
  weapon, charge, resistance, armor), and the materials into pieces, weapons, mount and
  fittings.
- **Codex topics**: Units table (sortable, filter chips), Sizes (every body at true scale on one
  baseline), Gear, Abilities, Elements, Items (by slot, tier and research level), Body plans.
- **Item tooltip**: tier shape, slot, requirement symbols, lore, the weapon line or effects, at
  most 3 deltas on the hovered or selected commander (Shift for all), where the nation's copies
  are, and how it is forged.
- **Battle report**: Spoils lists each item a fallen commander wore and where it went.
````

**In the key table of `## Keyboard and mouse`, add the row:**

````markdown
| G | the selected commander's Gear tab |
````

### `docs/09-art-direction.md` (the rules in Phase 10; the SVGs in Phase 11)

**In `## Sprite system`, add after the bullet "Each nation overrides weapon and armor layers":**

````markdown
- **Gear layers** (added on 2026-10-21 at the owner's direction on detail "from giants to
  horses"): the armor layer is picked from the unit's gear pieces (`docs/03-nations.md`, Bodies
  and kit), drawn in the nation's style: a Thornwood Iron Cap and a Cinder Iron Cap share their
  numbers and differ in shape. A shield piece adds the shield part; a mount adds the horse or
  wolf under the rider. Pieces with the same look and slot must have the same numbers.
- **Item parts** draw over the standard parts: a weapon item replaces the weapon part, a head
  item adds a crown over the helm, a body item adds a mantle or overlay, a charm a small chest
  glint. Fire items flicker in Ember's palette; nature items shed leaves.
````

**Add after `## Sprite system`:**

````markdown
## Size and scale

- Sprites keep one baseline and scale by size class on cards (`UI.unitCard.sizeScale` 0.62,
  0.74, 0.86, 1, 1, 1 for sizes 1 to 6); sizes 4 and up fill the frame and may break its top
  edge by 8 px. Because cards flatten sizes 4 to 6, every non-man-sized card carries the size
  silhouette.
- The Codex's Sizes page draws every unit and pretender body at true relative scale on one
  baseline beside a man, grouped by class.
- In battle, sprites per squad follow size (20, 12, 6, 4, 2, 1 for sizes 1 to 6).
````

**In the `## Icons` table (as the UI spec rewrites it), add these rows:**

````markdown
| Sizes | six silhouettes: standing man, horse, bear, giant, colossus, wyrm |
| Abilities | one 24 px glyph per catalog ability (`src/content/abilities.ts`): 37 glyphs, signature glyphs unique; the resistances use the element outlines with ▲ or ▼ |
| Elements | outline flame, leaf, snowflake, sun disc, skull in a drop: outlines, so they never read as the filled mana symbols |
| Item tiers and slots | ○ Lesser, ◆ Greater, ★ Artifact, always beside the mana symbols; slot icons sword, helm, cuirass, ring |
| Combat marks | brace bar (BRACED), split shield (AP), crossed shield (AN), ▲ RESIST, ▼ WEAK, pennant (inspired) |
````

### `docs/08-ai.md` (lands in 7b.3)

**Add after step 8, Rituals:**

````markdown
8b. **Items** (added on 2026-10-21 with magic items, `docs/02-magic.md` section 9):
   - **Roles**: a pretender is a champion (leader, fighter, monster, raider, summoner
     chassis), a general (leader, summoner) or a mage (mage, idol); other commanders are
     generals (leadership 40 or more, no color pips) or mages (color pips, not a priest).
   - **Forge**: each idle or researching mage in an own lab, not used by step 8, forges the
     first item of its nation's priority list that validates, that the nation can pay twice
     over, of which no unworn copy waits, while fewer than 2 unworn items wait, and that a
     commander standing in an own lab now would take.
   - **Equip**: every commander in an own lab takes, slot by slot, the highest-ranked vault item
     for its roles that fits an empty slot or outranks the worn one. A weapon item must out-damage
     the weapon it replaces (`(str + dmg) × strikes`), so a Titan keeps its Great Sword.
   - **Detour**: after steps 4 to 6, an idle commander within 5 days of an own lab, with a vault
     item it would take, goes there.
   - The research step never replaces a forge order.
````

**Implementation decisions: add:**

````markdown
- **Items and `armyPower`**: `armyPower` does not count items, so a kitted champion is
  underrated. Phase 12 may add an item term.
````

### `docs/10-milestone-1.md` (lands in 7b.1)

**Definition: replace "research and cast all ten Red or Green spells," with:**

````markdown
research and cast all ten Red or Green spells, forge and wear magic items,
````

**Acceptance criteria: in criterion 7 (as the battle presentation rewrites it), after "round
limits," insert:**

````markdown
unit sizes that draw blows by size, mounts, reach against charges, elemental resistance,
````

**Acceptance criteria: add after criterion 16 (the pretender track's):**

````markdown
17. Unit detail and magic items (added on 2026-10-21 at the owner's direction: "the detail
    stats from giants to horses like Dominions and with the items are very immersive, added
    immersion without completely making it over complicated"): every unit has a size class,
    role, gear, lore line and, where they apply, a mount and resistances, all validated
    against its numbers; 20 forgeable items (10 Red, 10 Green) in three tiers with five
    body-dependent slots, a vault, spoils, unique artifacts, and an AI that forges and equips;
    a paper doll, a Forge group, item tooltips, and unit cards, hovers and Codex pages within
    their tested budgets.
````

**Build order: add after "Phase 7: AI":**

````markdown
### Phase 7b: Unit depth and magic items
- At the owner's direction ("the detail stats from giants to horses like Dominions and with
  the items are very immersive, added immersion without completely making it over
  complicated makes this game very engaging and replayable"), units gain their bodies and kit
  and nations gain magic items before the UI phases. The design is the 2026-10-21 units and
  items build spec; its rules are in `docs/01` to `docs/04` and `docs/08`. It follows Phase 7
  and the pretender's 6b.2. Three commits, each green:
- 7b.1: size classes, gear, roles, lore, mounts, resistances, reach, body plans, the abilities
  catalog; size draws blows, supply by size, reach blunts a charge, elemental resistance,
  regeneration does not stack; the riders at size 2 and the Living Monolith at size 6; the
  battle goldens regenerated once.
- 7b.2: the 20 items, forging, the vault, equipping, item HP, boosters, inspiration, spoils,
  artifacts, item abilities through the pretender's battle-start code; one save-version step.
- 7b.3: the AI's forge, equip and detour steps; the runner's item and research report; the
  matchup and item bands; the research-path target.
- Tests: every rule's own tests; the `docs/04` required tests unchanged; the size equivalence
  test; determinism with forging.
````

**Phases 8 to 12: add a bullet to each:**

````markdown
- (Phase 8) Unit cards with their budgets and size silhouettes; unit hovers with Shift sources;
  the unit and item concepts; a read-only items list on the Commander Overview; the Research
  panel's next item tier.
- (Phase 9) The Gear tab paper doll, the Forge group, item tooltips, the Codex unit page and its
  topics (Units, Gear, Abilities, Elements, Items, Body plans), the Ledger's Items section,
  spoils on the battle report.
- (Phase 10) Gear, items, mounts and resistances in the replay: item parts, the RESIST, WEAK,
  BRACED, AP and AN marks, the inspire chip, item ability cues, and (if time allows) the
  teaching lines.
- (Phase 11) The gear, item, size, ability, element, tier and slot SVGs (about 100 files), and
  the Codex's Sizes page.
- (Phase 12) The matchup and item bands re-pinned; the research-path target; the knobs of the
  units and items build spec.
````

**Out of scope for M1, add:**

````markdown
items for troops, generic and White, Blue or Black items, item sets, province hoards, handing
items between commanders in the field, separate mount HP, shields against arrows, magic
resistance checks
````

**Liberties taken, add:**

````markdown
- Size draws blows in melee and at range alike, from one weighted draw; a battle of men only
  is unchanged in every bit.
- Reach cancels a charge's bonus instead of Dominions' repel roll: one check, no draw.
- Elemental resistance subtracts from damage without Dominions' percentage step, and
  regeneration from several sources does not stack.
- A battle's winner takes every item its dead wore; Independents destroy them. Items move only
  through the vault, in a lab.
````

---
