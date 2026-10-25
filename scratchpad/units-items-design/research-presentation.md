# Research: showing deep unit and item detail without overwhelming the player

This note looks at how strategy and tactics games present detailed units and items, and turns
what they do into a layered presentation for Fluid Magic (FM). Games covered: the Dominions
unit window, Age of Wonders 4 unit cards and tooltips, Total War unit cards and hover
breakdowns, Civilization VI's unit panel and Civilopedia, Battle Brothers' character screen and
paper doll, Darkest Dungeon, Old World and Crusader Kings III tooltips and encyclopedias,
Warhammer 40,000: Battlesector, and the XCOM unit panels. I added Battle for Wesnoth because its
open source is the clearest reference for showing damage types and resistances. Topics: paper
dolls, comparison when equipping, stat bars against numbers, ability icons with one-line rule
text, size silhouettes, the encyclopedia, and what a battle replay should show.

**Owner direction (binding).** "The detail stats from giants to horses like Dominions and with
the items are very immersive, added immersion without completely making it over complicated
makes this game very engaging and replayable." The earlier binding directions still hold: battles
are visceral and have sound; the UI matches similar games, with complexity tastefully layered
under smart menus; magic is flashy; the pretender has Dominions-like options and AoW4-level
customization.

**Constraints this note keeps.**
- The sim stays deterministic and pure. Content stays data and passes content validation.
- Every command is validated, and the AI uses the same commands as the player.
- No numbers are hard-coded in sim code. Every rule has a test.
- Symbols are safe for color-blind players.
- Each item lands in an M1 phase or is explicitly deferred to M2.
- Above all, readability. Every stat or rule shown must earn its place, appear in layers (card,
  hover, Codex), and be explainable in one sentence.

**Companion work. This note links to it and does not repeat it.**
- **`research-dom-units.md`** (this folder) covers *which* stats and rules FM should have: size,
  mounts, gear lists, resistances, one abilities catalog, MR, descriptions, renown, and
  afflictions (its R1 to R10). This note covers *how to show them*. Its section 12 (the "earn its
  place" test and its layer table) is the starting point for section 3 here.
- **`../ui-design/spec-final.md`** is the UI build spec. It defines the five layers L0 to L4, the
  `Tip` system, Shift for "more", the Codex, the `UnitCard` component and its variants, and
  rule 3: every number comes from a sim selector run with a trace. This note fills in what a unit
  and an item show at each layer.
- **`../battle-design/final.md`** is the replay. It covers looks by archetype and rig, armor
  materials, the ARMOR chip, blood by element, spell numbers with element glyphs, docks with exact
  HP, and per-blow detail events. Section 3.9 below adds only what is missing for gear and
  resistances.
- **`../pretender-design/design-draft.md`** defines the pretender abilities (N1 triggers,
  `UnitAbility`). Section 3.4 below proposes the display fields for the shared abilities catalog
  that research-dom-units R5 calls for.

---

## How this was researched, and how far to trust it

- **Network.** WebFetch failed DNS in this session (`getaddrinfo ENOTFOUND`). Through curl, the
  proxy refused fandom, wiki.gg, Wikipedia, Steam, Paradox, Mohawk, PC Gamer, web.archive.org,
  Reddit, and YouTube with 403. Only `raw.githubusercontent.com` was reachable. So I took primary
  evidence from game code and data published on GitHub. Each of these was read in this session:
  - open-source games: Battle for Wesnoth and OpenXcom;
  - mods that carry the shipped UI scripts: the XCOM 2 Community Highlander, CQUI for Civ VI,
    and Legends for Battle Brothers;
  - a Battle Brothers item mod;
  - the aow4db fan database's dump of AoW4 game data;
  - the Dominions 6 Data Inspector;
  - the community transcription of the Dominions 6 manual.

  Everything else comes from WebSearch result extracts.
- **Marks on every claim:**
  - **[V]**: I read the primary source (code, data, or manual) in this session.
  - **[X]**: taken from a search-engine extract; I did not open the page.
  - **[U]**: general knowledge, unverified. Nothing in section 3 depends on a [U] claim.
  - **[C]**: I computed it from [V] data or from FM's rules. The scripts are in `tools/`.
- **Mod copies.** The XCOM 2, Civ VI, and Battle Brothers UI code comes from mod repositories
  that copy the shipped files and then change them. I claim only what is almost certainly in the
  shipped game. Where the code shows that a mod added a feature, I say so.
- **FM.** Repository at `3addf97` (Phase 6), read only: `docs/03`, `docs/04`, `docs/07`,
  `docs/09-art-direction`, `src/content/types.ts`, `src/content/units/*.ts`, and
  `src/sim/battle/attacks.ts`.

---

## 0. Summary

### 0.1 Findings

1. **Every game in the set layers its unit detail, and the layers line up.**
   - A glance card shows identity, count, health, and a few signature numbers.
   - Hover shows the full stat block and what each icon means.
   - A detail view shows sources and gear.
   - An encyclopedia compares units.

   The games differ in how much the card carries. Civ VI caps its unit panel at **four stats**,
   leaves out any stat that is zero, and raises a data error if a unit has more than four to show
   [C6][V]. Dominions puts everything in one dense window. Even there, the "how was this computed"
   view and the protection per body zone sit one click deeper [DM4][V].
2. **The deep layer earns trust by showing sources, not by being dense.** Dominions opens a
   breakdown when you click a stat ("base morale value of 12 ... experience (+1) and friendly
   dominion (+1) ... 14") [DM4][V]. Its manual explains defense as a sum of gear ("base defense 10,
   +1 from the sword, -2 from the armor, -1 from the shield") [DM6][V]. XCOM 2's shot breakdown
   lists every hit-chance modifier, largest first [X2s][V]. Civ VI's combat preview starts with
   "N Base Strength" and adds one line per modifier [C6][V].
3. **Hidden roll-changers are the most common complaint, and players write mods to expose them.**
   - Total War: Warhammer III leaves spread, accuracy, and reload skill off the stat card, and a
     "Helper UI" mod adds them [TW2][X]. Modders also point out that stun and knockback are
     missing from the stats chart [TW5][X].
   - Dominions logs omit fatigue penalties and critical hits [D7][X].
   - XCOM 2 did not show armor mitigation in its damage preview. The Community Highlander added it
     as an option (Issue #1540) [X2s][V].
   - Dominions players maintain an external database with property search over every unit,
     item, weapon, and armour [DI][V].
4. **Gear reads best on the body.** Battle Brothers' character screen puts slots in three columns
   around the character: accessory and main hand, head and a large body slot, quiver and off hand.
   Bag slots sit below [BBp][V]. A dragged item lights up the slots it can go to. A two-hander
   blocks the off hand, and armor cannot go into the bag [BBp][V]. A helmet item declares
   `ShowOnCharacter`, hides hair and beard, has color variants and an impact sound by material,
   and carries a lore line that justifies its stats [BBs][V].
5. **Slots follow the body, and blocked slots are part of the information.**
   - Dominions: a non-human commander may lack a head slot. A mounted commander's foot slot is
     disabled while mounted. A mount has a barding slot. Standard gear "re-appears" when a
     replacement is removed [DM4][V].
   - AoW4: 332 of the 401 primary weapons in the data disable another slot. 177 disable both mount
     and off hand, 153 only the off hand, and 2 only the mount [AD][V][C].
6. **The best comparison is a delta written on the stat row itself.** When you highlight an item
   in XCOM 2's locker, the soldier header recomputes with the new item added and the old one
   subtracted, and each changed stat gets "+N" or "−N" [X2h][X2l][V]. Items that cannot be
   equipped stay in the list, disabled with a red reason [X2l][V]. Diablo III summarizes a
   comparison in three aggregates: Damage, Toughness, Recovery [D3b][X]. Diablo IV shows only
   "higher or lower item power" by default, and a setting shows every gained and lost stat
   [D4a][D4b][X]. Summary first, full comparison on demand.
7. **Bars are for current against maximum. Skills are numbers.**
   - OpenXcom draws every stat as a number with a bar. The bar's maximum is the base value, and
     its value is the current one, so wounds visibly shorten the accuracy bars [OX][V].
   - XCOM 2 draws HP as ticks and armor as pips [X2f][V].
   - Battle Brothers labels every bar with its number [BBh][V].
   - Dominions, Civ, AoW4, and Wesnoth show skills as plain numbers.

   In FM a single point matters. Attack 11 against defense 10 hits 53.9%; 10 against 10 hits
   46.1% [C]. A 0 to 20 bar would draw that difference as 5% of its width.
8. **Ability text is data: a name, a glyph, and one sentence.** Wesnoth defines every weapon
   special and ability as data with a name and a description sentence, and marks a special
   "(inactive)" when it does not apply [WN-s][WN-r][V]. AoW4's unit passives have a median
   description of 76 characters (90th percentile 161), with stat icons and links inline [AD][C].
   AoW4 also groups rules into **role tags**. "Polearm Unit" carries First Strike, Charge
   Resistance, and +40% against Cavalry and Large Target. "Shield Unit" carries Shield Defense and
   Shield Wall [AD][V].
9. **Size reads as a named class with a short rule.** Total War's Anti-Large works "against
   targets roughly horse-sized or bigger" [TW4][X]. AoW4 tags 121 of 513 units "Large Target":
   "20% easier to hit with Missile and Magic attacks", immune to most displacement, and has
   Demolisher [AD][V][C]. Dominions keeps a numeric size that many rules read
   (research-dom-units section 2).
10. **Resistances work best as a short signed list by element, shown only when they apply.**
    - Wesnoth shows a table: damage type icon, then a signed percentage on a red-to-green color
      scale [WN-h][WN-u][V].
    - AoW4 uses coarse tiers in the element's color with its icon, for example "Fire Weakness 4"
      and "Blight Protection 2". 40% of its units have at least one, and 88% of the entries are
      tier 2 or 4 [AD][V][C].
    - Darkest Dungeon lists eight resistances as percentages [DD2][X].
    - Wesnoth's weapon tooltip translates resistance into outcomes. Under "Damage versus" it shows
      the damage this weapon would deal to each visible enemy type, best targets first [WN-r][V].
11. **Position rules can be drawn as dots.** On a Darkest Dungeon skill, yellow dots mark the ranks
    it can be used from and red dots mark the ranks it can hit. Area targets are linked by a line
    [DD1][X]. FM's three rows and its "range 5 reaches the rear" rule fit that picture exactly.
12. **Visible gear is immersion players ask for, and part-based art makes it cheap.** Darkest
    Dungeon's gear upgrades change the icons on the character sheet but not the hero sprite. Fans
    asked for visible stages, and one heard the art cost was prohibitive [DD3][X]. FM's sprites are
    composed SVG parts with armor and weapon layers per nation (`docs/09`), so showing gear costs
    data, not art.
13. **Encyclopedias pay off when they compare and filter, not when they repeat tooltips.**
    - Dominions 6's Data Inspector lists every unit, item, weapon, and armour, with property
      filters such as `fireres >= 25`, `size <= 1`, or `weapon =~ bane blade` [DI][V].
    - Civ VI's Better Civilopedia mod "Added Table of Units with key statistics" [CV1][X].
    - AoW4 ships 508 concepts as data, and the unit-facing first sentences are one line ("Fire
      Protection reduces Fire Damage.") [AD][V].
    - Old World players called its help a "rehash of the tooltip info" (UI research [X]).
14. **Items gain meaning from history.** CK3's Royal Court artifacts lose durability while worn and
    keep a history that shows on their details screen [CK2][X]. Dominions tracks each unit's
    wounds, experience, and kills (UI research, Wargamer [X]). A sword that "slew the Ash
    Chieftain at Kharsk Ford" is free immersion once battles are recorded.

### 0.2 What Fluid Magic should do

Each line is one presentation decision. The sentence is what the player reads at L1 or in the
Codex.

| # | Decision | One sentence for the player | Where | Milestone |
|---|---|---|---|---|
| P1 | **Budgeted card**: at most 3 numbers chosen by role, at most 3 ability glyphs, at most 1 element marker; gear drawn on the sprite | (no text; the card shows) | `UnitCard` all variants | M1 Phase 8 |
| P2 | **Complete hover**: full stat block, weapons with property chips, gear composition, abilities with their one-liners. **Shift** adds the sources of every stat | "Prot 9: thornplate 7 + iron cap 2." | L1 / L1+ | M1 Phase 8 |
| P3 | **Matchup line** from an exact odds selector (pure, no rng): hit chance, average damage, and kills per swing against a known enemy type | "About 1 in 2 swings fells a Cinder Warrior." | L1+, Battle Plan, Codex | M1-should (Phase 9) |
| P4 | **Abilities as glyph + name + one line** from the shared catalog, with an "(inactive)" state when a condition is unmet | "Berserk: +2 att and +2 str below half HP; never routs." | card glyphs, L1, L2, Codex | M1 (with research-dom-units R5) |
| P5 | **Role word** on every unit, from content (or derived from its look archetype) | "Heavy infantry." | title of L1, Codex filter | M1 content |
| P6 | **Size classes in words, sprites to scale**, and a Codex line-up of every unit against a human silhouette | "Huge: eats 3 supply, towers over the line." | card sprite, L1 title, Codex | M1 (Codex Phase 9; art Phase 11) |
| P7 | **Resistances only when non-zero**: glyph, sign, and arrow; a full element table in the Codex | "Fire −5: fire hits deal 5 more." | card marker, L1, Codex | when research-dom-units R3 lands (M1-should or M2) |
| P8 | **Reach dots** on weapons and battle spells: which rows a squad acts from, and which enemy rows it hits | "Shoots from the middle row; reaches all three." | L1, Battle Plan | M1 Phase 9 |
| P9 | **Commander paper doll**: slots shaped by the body, drag or click to equip, blocked slots with their reason, deltas on the stat rows, standard kit that returns, one validated `equipItem` command | "Two-handed: frees no hand for a shield." | Commander panel, Gear tab | with the item design (M2 unless items land in M1); **M1 ships a read-only Kit strip** |
| P10 | **Item tooltip** with a "replaces" line, at most 3 deltas, and the full comparison on Shift | "Emberbrand replaces Axe: +2 dmg, fire." | L1 on items | with items |
| P11 | **Codex that compares**: sortable unit table with common-scale bars, property filters, side-by-side compare of up to 3, size line-up, abilities index, elements page | "Filter: flying · fire weapon · size 3+." | L4 | M1 Phase 9 (table, filters); M1-should (compare, line-up) |
| P12 | **Replay shows gear and damage types**: element glyph on every non-physical number, AP and AN marks on armor chips, inspecting a unit (card plus its last blows), and teaching lines the first time something occurs | "Armor piercing: halves protection." | replay HUD and stage | M1 Phase 10 |
| P13 | **A lore line that explains odd stats** on every unit and item | "Huskarls can rarely afford heavy armor." | L1 first line, Codex | M1 content (research-dom-units R7) |
| P14 | **History**: commander battles and kills now; item provenance later | "Varo the Ember: 6 battles, 41 kills." | Commander panel, item tip | M1 hook (counts); M2 (item history) |

---

## 1. Game by game

### 1.1 Dominions 6: dense but complete

**What it shows.**
- **One stats screen per unit.** The manual's attribute list covers:
  - hit points, size, strength, attack, defense, protection, morale, magic resistance,
    precision, encumbrance, map move, combat speed, fatigue, and age;
  - for commanders, three kinds of leadership [DM4][V].
- **Abilities.** There are "about 500 special abilities in the game". "A mouse-over or
  right-click on the ability in the stats screen will give an explanation" [DM4][V].
- **Stat breakdowns.** "You can get further information about an ability simply by clicking on
  it. This will bring up a window which shows how the value has been modified. For example, a
  unit may have a base morale value of 12, but due to experience (+1) and friendly dominion (+1)
  the modified value is 14" [DM4][V].
- **Protection by body zone.** Protection "can be different on different parts of the body ...
  These separate values will be shown when you click on Protection" [DM4][V].
- **Gear explains stats.** The combat chapter's example: "A Heavy Infantry unit has a broad
  sword, chain mail hauberk, half helmet and shield, with base defense 10, +1 from the sword, -2
  from the armor, -1 from the shield, and a shield Parry value of 4. Actual defense is 8; total
  defense with parry is 12" [DM6][V].
- **Inventories.**
  - "Clicking on an empty inventory slot takes you directly to your nation's magic item inventory
    (if you are in a province with a lab)".
  - "Not all units will have all inventory slots. A non-human commander may not have a head slot".
  - "Mounted commanders have a foot slot, but it is disabled as long as they are mounted ...
    Mounts of commanders have a barding slot".
  - "The unit's standard items cannot be removed, and when the new item is withdrawn, the
    standard item re-appears" [DM4][V].
- **Battle viewing.**
  - A summary with casualty lists comes first, then "View battle".
  - The log has detail levels `1` to `4`.
  - `v`: "while viewing a unit, show its combat log".
  - `F1` lists all units, and `F2` shows "current weather and dominion scales" [DM6][V].

**What players built around it.** The Dominions 6 Data Inspector "lists all of the Units, Spells,
Items, Sites, Mercenaries, Events, Weapons and Armour in the game", with a property search
(`fireres >= 25`, `size <= 1`, `weapon =~ bane blade`, `fear =~` for any unit that causes fear)
[DI][V]. Its FAQ documents one number shown two ways. Shocking Grasp reads "Damage 18+" in the
game and "Damage 15+++" in the inspector, because the game adds the minimum caster bonus and the
inspector shows it as `+` signs [DI][V].

**Complaints** (UI research and research-dom-units):
- Dominions 6 replaced labels with tiny icons [D1][X].
- Battle logs leave out fatigue penalties and crits [D7][X].
- Dominions 5's unit screen drew damage bars that do not scale with max HP, so a dragon and a
  small hero look alike [S12][X].

**For FM.**
- **Keep:** every number opens its breakdown (FM does it on hover, one gesture cheaper); gear
  composes stats in plain sight; a per-unit log in the replay.
- **Build the inspector into the game:** the Codex gets property filters and a sortable table
  (section 3.6).
- **Avoid:** icons without words in panels; logs that leave out a modifier; a single number shown
  two ways.

### 1.2 Age of Wonders 4: role tags, coarse resistances, one-sentence concepts

The aow4db fan database publishes AoW4's game data as JSON (`Data/EN/Units.json`,
`Abilities.json`, `HeroItems.json`, `concept_tooltips.json`) [AD][V]. That makes the data model
verifiable, though not the screen layout.

- **Unit record.** `hp`, `armor` (Defense), `resistance` (against magic), `status_resistance`,
  `combat_speed`, `mp`, `tier`, `cost`, `upkeep`, `abilities`, `primary_passives`,
  `secondary_passives`, a `resistances` list, and medal rewards per rank [AD][V].
- **Two tiers of passives:**
  - *Secondary* passives are mostly classification: Land Movement (369 units), Magic Origin
    (126), Large Target (121), Animal (82), Floating (57), Flying (53), Shield Unit (43), Cavalry
    (38), Polearm Unit (32) [AD][V][C].
  - *Primary* passives are fighting rules: Control Loss Immunity (147), Demolisher (125), Low
    Maintenance (96), Heartless (57), Shield Defense (43), First Strike (39), Fearless (38),
    Charge Resistance (33) [AD][V][C].
  - The median unit has 3 of each [C].
  - I could not see how the game lays the two lists out on screen. The split itself is in the
    data.
- **Role tags bundle rules into one word.**
  - "Polearm Unit: Specialists in taking out large threats and cavalry and can counter shock unit
    charges. Polearm Units have: First Strike, Charge Resistance, +40% damage against Cavalry and
    Large Target units."
  - "Shield Unit: ... gains Shield Defense. Defense Mode: Shield Wall."
  - "Large Target: ... Is 20% easier to hit with Missile and Magic attacks. Is immune to most
    displacement effects. Has Demolisher" [AD][V].
- **Resistances by damage channel, as coarse signed tiers.** The Rose Knight has "Blight
  Protection 2", "Frost Protection 2", "Fire Weakness 4", and "Spirit Weakness 4". Each is drawn
  in its element color with the damage icon [AD][V].
  - Of 513 unit records, 203 (40%) have at least one entry.
  - Of the 528 entries with a tier, 464 (88%) are tier 2 or 4.
  - The most common weaknesses are Spirit (82), Fire (55), Blight (39), Frost (37), and Shock
    (37) [AD][C].
- **One-sentence concepts.** 508 concept tooltips ship as data. Examples:
  - "Fire Protection reduces Fire Damage."
  - "Defense reduces damage from Melee and Ranged attacks."
  - "Resistance reduces damage from Magic attacks and Combat Spell."
  - "Status Resistance reduces the chance that a unit will be affected by Negative Status
    Effect."

  The first sentence has a median of 105 characters [AD][V][C].
- **Ability text inlines numbers, icons, and links.** Charge Strike reads: damage "27" with the
  physical icon, accuracy 100%, range 1; requisites Melee, Base, and Single Shot as links; a
  bullet list ("Gains 20% damage per hex traveled, up to 3 hexes. Cancels Defense Mode. Removes
  Retaliation Attack."); and a modifier "Inflicts 2 Bleeding for 3 Turns" [AD][V].
- **Hero items.** 693 records. Slot types:
  - Primary 401, Miscellaneous 73, Mount 60, Secondary 48, Ring 45, Torso 26, Head 22, Legs 18;
  - tiers I to IV [AD][V][C];
  - 332 weapons block another slot: 177 block mount and secondary, 153 only secondary, 2 only
    the mount [AD][C].
  - A mounts guide says some two-handed weapons cannot be used while riding, "as they block mount
    slot" [AW2][X].
  - Item text uses the unit vocabulary: "Grants +1 Defense", "Unit gains: Very Fast Movement.
    Cavalry unit type. Large Target" [AD][V].
  - Dev Diary #10 describes heroes as having inventory slots like an RPG character's [AW3][X].
- **Tooltips.**
  - Nested, with F1 to open the encyclopedia [AW1][X].
  - The Wyvern update added tooltips to status effects in the abilities panel "so you don't have
    to enter the Unit Panel" (UI research [X]).

**For FM.**
- One role word per unit.
- Resistances in two or three coarse steps, not fine percentages.
- Classification tags at L1, signature rules as L0 glyphs.
- One-sentence concepts.
- Blocked slots shown on the paper doll.

### 1.3 Total War: Warhammer: per-model stats, split damage, hidden-stat complaints

All [X]: the wiki and Steam pages were blocked, so this is what search extracts said.
- **Per model.** Card stats are the stats of every model in the unit. Health is per model, and
  the unit's health bar is their sum. Morale has its own bar [TW1][X].
- **Hover explains.** Hovering weapon strength splits it into regular, armour-piercing, and bonus
  damage, and every stat and ability icon on the card has a tooltip [TW1][X].
- **Attribute one-liners.**
  - Anti-Large gives an edge "against targets roughly horse-sized or bigger".
  - Charge Defence against Large cancels a large enemy's charge bonus when the unit braces.
  - Armour-Piercing mostly bypasses armour.
  - Armoured blocks damage from most sources, but not armour-piercing damage [TW4][X].
- **Hidden numbers.**
  - Spread, accuracy, and reload skill are not on the Warhammer III stat card; the "Helper UI"
    mod shows them in the unit info panel and unit browser [TW2][X].
  - A modding thread says stun and knockback are not on the stats chart [TW5][X].
  - A modder says vanilla melee intervals varied and skewed the displayed melee stats without
    the player knowing [TW6][X].
- **Intent.** Lead writer Andy Hall (2015) said the Warhammer stat lines helped the team, since
  every Warhammer character has one, and that the stats "influence everything in the background"
  [TW3][X].
- [U] The exact bar layout, for example a shaded bonus segment, could not be verified and is not
  used here.

**For FM.**
- Show stats per troop. A squad's card adds only the count and HP%.
- Split damage into its parts on hover (`str 12 + Halberd 7`).
- Never leave a roll-changing number off the hover (section 3.1, rule 4).

### 1.4 Civilization VI: a four-stat card and a modifier list

From the shipped `unitpanel.lua` as carried in the CQUI mod [C6][V]:
- **The stat list holds only stats above zero:** strength, ranged, bombard, religious,
  anti-air, movement, range, and charges. "If we have more than 4 stats then try to remove melee
  strength"; with still more, `UI.DataError("More than four stats were picked to display ...")`.
- **The combat preview shows three stats,** with the main combat stat drawn on its own above them.
  Each side has a modifier stack. The stack starts with "N Base Strength" and adds one icon line
  per modifier, paging with an animation when it overflows.
- **Outcome labels** are named bands: decisive, major, and minor victory, stalemate, minor and
  major defeat (`LOC_HUD_UNIT_PANEL_OUTCOME_*`).
- **The Civilopedia** has topics on the left (UI research [X]). The Better Civilopedia mod
  "Added Table of Units with key statistics" [CV1][X]. I infer that the base game lacked a
  comparison table.

**For FM.**
- A hard card budget, enforced by a test (a data error in Civ).
- Zero values stay silent.
- Previews list the base first, then the modifiers.
- Outcomes are named bands, which the battle report already does (UI spec section 4.2).

### 1.5 Battle Brothers: the paper doll, bars with numbers, gear that drives look and sound

From the Legends mod's copy of the character screen modules and a gear mod's item script:
- **Paper doll** [BBp][V]:
  - Three columns: left holds accessory and main hand; middle holds head and a large body slot;
    right holds ammo (quiver) and off hand. Bag slots sit below.
  - A drag start marks each valid slot `is-equipable`.
  - Items flagged `isBlockingOffhand` (two-handers) clear or block the off hand.
  - "Dropping Head | Body in Backpack is not allowed".
  - Legends adds armor-layer buttons, which are a mod feature.
- **Stats** [BBh][V]. Each attribute row is an icon, a talent image (`talent_0` to `talent_3`,
  the stars), a progress bar labeled with its number, and a tooltip bound to the row. The
  level-up dialog uses two columns:
  - Hitpoints, Fatigue, Resolve, Initiative;
  - Melee skill, Ranged skill, Melee defense, Ranged defense.

  Each `+` button shows the rolled increase.
- **Stash** [BBi][V]: filter buttons All, Weapons, Armor, Misc, and Usable, plus Sort.
- **Items carry their look and sound** [BBs][V]. The Decorated Great Helm sets:
  - `ShowOnCharacter = true`, `HideHair`, `HideBeard`;
  - three color `Variant`s;
  - `ImpactSound = ArmorChainmailImpact`;
  - `Condition`/`ConditionMax` 325 (armor that wears down);
  - `StaminaModifier = -23` and `Vision = -3`;
  - the description: "This well-loved helmet offers extraordinary protection, but its antiquated
    design is cumbersome and difficult to breathe in."

  The lore line explains both penalties.
- **Weapon text and its confusion** [X]:
  - Weapon tooltips read like "Damage 25 - 40, 65% effective against armor" [BB1].
  - Players found that the damage on the weapon tooltip differs from the damage on the attack
    tooltip [BB1].
  - "The tooltip for a spear will not tell you that it has +20 hit chance, but if you hover over
    the 'Thrust' skill that's where you will see it" [BB2].

**For FM.**
- The paper doll's shape and its drag highlights.
- Gear as data that drives both the sprite and the hit sound. The battle design's `Material`
  already picks sparks and sounds.
- Lore lines that justify stats.
- A weapon's properties live on the weapon's line, nowhere else.

### 1.6 Darkest Dungeon: resistances as a list, position dots

All [X].
- **Resistances.** Each hero lists eight resistances as percentages. The Crusader has Stun 40%,
  Move 40%, Blight 30%, Bleed 30%, Disease 30%, Debuff 30%, Death Blow 67%, and Trap 10% [DD2].
- **Position dots.** On a skill, yellow dots show the positions it can be used from and red dots
  show the positions it can target. An area skill links its red dots with a line [DD1]. (The
  sequel changes the colors; this describes the first game.)
- **Gear and sprites.** Weapon and armor upgrades change the icons on the character sheet but not
  the hero sprite. Fans asked for visible upgrade stages, and one commenter had heard the art cost
  would be prohibitive [DD3].

**For FM.**
- Reach dots for FM's three rows (section 3.3).
- Gear shown on the sprite, which FM's part system makes cheap (`docs/09` sprite system).

### 1.7 XCOM 2, and X-COM through OpenXcom: deltas, pips, previews, sorted breakdowns

**XCOM 2,** from the War of the Chosen source as published in the Community Highlander:
- **Equip preview** [X2h][X2l][V]. `UIArmory_Loadout.OnSelectionChanged` calls
  `Header.PopulateData(unit, newItem, replacedItem)`. `UISoldierHeader` adds the new item's stat
  markup, subtracts the replaced item's, and appends `+N` (good state) or `−N` (bad state) to
  Will, Aim, Health, Mobility, Tech, Armor, Dodge, and Psi.
- **Locker list** [X2l][V]. Each item shows its count. One that cannot be equipped keeps its row,
  disabled, with a red `DisabledReason`. The code keeps a `CanBeEquipped` flag for sorting.
- **Unit flags** [X2f][V]:
  - HP shows as ticks (`HP_PER_TICK`, always rounded up), armor as pips.
  - While aiming, the flag previews the damage on the HP ticks and the armor shred or pierce on
    the armor pips (`SetArmorShred` and `SetArmorPierce`).
  - A profile setting hides enemy health.
- **Shot wings** [X2s][V]. Hit chance and crit chance each list their modifiers, sorted by value,
  largest first, with the damage range. The Highlander added an optional "Armor Mitigation" row
  to the damage breakdown (`PREVIEW_ARMOR_MITIGATION`, Issue #1540). Vanilla did not show armor's
  share there.

**OpenXcom,** the open re-implementation of X-COM: UFO Defense:
- **Stats screen** [OX][V]. Every stat is a number and a bar. The bar's maximum is the base stat
  and its value is the current one. Firing, throwing, and melee accuracy shrink with wounds
  (`base × health / max health`). Armor has one bar per facing: front, left, right, rear, and
  under.
- **Inventory** [OX][V]. It shows carried weight against strength, counts the item being dragged,
  and recolors the text when over.

**For FM.**
- Deltas written on the stat rows when hovering an item, with a sign and an arrow (color alone
  fails color-blind players).
- Disabled items keep their row and give their reason.
- Armor piercing previewed on the armor number.
- Modifier lists sorted by size.
- Armor mitigation always shown as its own row.
- Bars only for current against maximum, always with the number.

### 1.8 Battle for Wesnoth: damage types and resistances in the open

From `src/help/help_topic_generators.cpp`, `src/reports.cpp`, `src/units/helper.cpp`, and
`data/core/macros/{weapon_specials,abilities}.cfg` [WN][V]:
- **The attacks table.** Each row has the attack icon, name, damage × strikes, a range icon, and
  a damage-type icon with its name. The **Special** column is left out when no attack has a
  special. Specials are links to their help topics.
- **The resistances table.** One row per damage type, with its icon and a signed percentage.
  `resistance_color` colors the percentage on a saturated red-to-green scale.
- **"Damage versus".** The sidebar's weapon tooltip lists the damage this weapon would deal to
  each visible enemy type, grouped by their resistance, "weak resistances (= good damage) first".
- **Rule text is data.** A special has a name and a description:
  - "magical: This attack always has a 70% chance to hit regardless of the defensive ability of
    the unit being attacked."
  - "charge: When used offensively, this attack deals double damage to the target. It also
    causes this unit to take double damage from the target's counterattack."

  A special that does not apply in the current context gets "(inactive)". Statuses are icons
  with a sentence: "This unit is poisoned. It will lose 8 HP every turn until it can seek a cure
  ...".
- **Lengths.** Special descriptions have a median of 146 characters (90th percentile 239) [C].
  That is help-page text, longer than AoW4's unit passives (median 76).

**For FM.**
- "Damage versus" becomes the matchup line (P3).
- "(inactive)" for conditional abilities.
- Empty columns and empty sections are left out.
- Rule text comes in two lengths: a one-liner at L1 and a full paragraph in the Codex.

### 1.9 Old World and Crusader Kings III: nested, context-filtered, history

From the UI research notes, all [X]:
- **Old World.**
  - Shift freezes a tooltip so its links can be used (official manual).
  - F1 opens the linked encyclopedia page (Update #73).
  - Character names in tooltips select the character (#16).
  - Character tooltips "show trait effects that are relevant to the current position" (#132).
  - Unit tooltips became "scrollable, with unit effects ordered alphabetically" (#129).
- **CK3 tooltips.** Nested concept tooltips with a timer lock and a middle-click lock (Dev Diary
  #16; the EU5 Tinto Talks #77 describes the same system).
- **CK3 men-at-arms.** Four stats (Damage, Toughness, Pursuit, Screen) [CK1]; counters that cut a
  regiment's effectiveness by as much as 90% [CK1b]; terrain bonuses.
- **CK3 Royal Court artifacts.**
  - A character inventory with crown or headgear, regalia, weapon, armor, and up to four
    trinkets; one of each except trinkets.
  - Worn artifacts lose durability.
  - The details screen shows durability and **history** [CK2].

**For FM.**
- Tooltips filtered by context (the UI spec adopts this). For units: costs in the recruit grid,
  rows and reach in the Battle Plan, HP and morale on the map.
- Sort effects by importance, not alphabetically.
- A "counters" line comes from the matchup selector, not from hand-written text.
- Item history is M2.

### 1.10 Warhammer 40,000: Battlesector

Evidence is thin [X]. One player asked that the army management screen "show details for every
unit and every weapon they carry, so we can make informed decisions about who to pick" [BS1]. The
point is general: per-weapon detail matters most where the player chooses whom to bring. In FM,
that is the recruit grid and the Battle Plan.

### 1.11 Outside the genre: Diablo comparisons, MTG reminder text, inventory space

All [X].
- **Diablo III.**
  - Blizzard's 2012 blog describes comparison tooltips that keep console co-op moving [D3a].
  - Every comparison shows three categories: Damage, Toughness, and Recovery [D3b].
  - Toughness was meant to estimate effective health [D3c].
  - A forum user calls the integrated values "pretty misleading" because they leave mechanics out
    [D4f].
- **Diablo IV.** By default it only flags higher or lower item power. "Advanced Tooltip Compare"
  shows every effect gained (green) and lost (red) [D4a][D4b].
- **MTG reminder text** is "parenthetical text in italics in the text box of a card that
  summarizes a rule that applies to that card, but is not actually rules text" [MTG1]. Recent
  special-treatment cards omit it, and players are divided [MTG2]. FM's color pie comes from MTG,
  so its players will know the convention.
- **Inventory space.**
  - On a Baldur's Gate EE forum, players argued that stats should not take a third of the
    inventory screen, and that only core stats belong there [BG].
  - Diablo III merged the character window into the inventory, with a compact stat panel and a
    "Details" button [DW].
- **Wargroove** publishes a unit-by-unit damage matrix [WG].

---

## 2. Patterns across the games

### 2.1 The layer ladder for units

| Game | Card (L0) | Hover (L1/L2) | Detail (L3) | Encyclopedia (L4) |
|---|---|---|---|---|
| Dominions 6 | sprite, name, count | ability explanation on mouse-over or right-click | one dense stats window; click a stat to see its modifiers; click Protection for the zones | none in game; the Data Inspector outside [DI] |
| AoW4 | portrait, HP, rank | nested tooltips, concept links, F1 | unit panel: stats, abilities, passives, resistances | encyclopedia; 508 concepts as data |
| Total War: Warhammer | art, health, rank, type icon [U] | stats and icons explained; weapon strength split | unit info panel | unit browser (in game, plus mods) |
| Civ VI | at most 4 non-zero stats | combat preview: base, then modifiers | — | Civilopedia, plus a mod's unit table |
| Battle Brothers | sprite with gear, bars | per-stat and per-item tooltips | character screen: paper doll, bars, stars, perks | — |
| XCOM 2 | flag: HP ticks, armor pips | shot breakdown, sorted | armory: deltas on stat rows | — |
| Wesnoth | sidebar: HP, XP, resistances | weapon "damage versus"; specials | — | help: attacks, resistances, terrain tables |
| Old World / CK3 | portrait, icons | nested, context-filtered, lockable | character windows | encyclopedia generated from script |

What they share:
- The card names the thing and shows its state.
- Hover gives the whole truth with links.
- Detail shows **sources** (Dominions, XCOM, Civ) and **gear** (Battle Brothers, XCOM).
- The encyclopedia **compares** (the Inspector, Better Civilopedia).

### 2.2 Paper-doll equip screens

| Convention | Evidence | Why it reads |
|---|---|---|
| Slots arranged around a figure that wears the gear | Battle Brothers' three columns [BBp][V]; Diablo, WoW [X] | spatial memory: the head slot is by the head |
| Slots follow the body; disabled slots stay visible | Dominions head and feet rules, barding [DM4][V]; AoW4 blocked slots [AD][V] | the body explains the rule ("no hands: no weapon") |
| Two-handers block a slot visibly | Battle Brothers `isBlockingOffhand` [BBp][V]; AoW4 332 of 401 weapons [AD][C] | a trade the player can see |
| Dragging lights up the valid slots | Battle Brothers `is-equipable` [BBp][V] | no trial and error |
| A list-based path for keyboard or controller | XCOM 2 equipped list and locker list [X2l][V] | the same screen without a mouse |
| Standard kit returns when an item is removed | Dominions [DM4][V] | base stats never need bookkeeping |
| Load or burden updates while dragging | OpenXcom weight against strength [OX][V] | the cost shows before commitment |
| Stats beside the doll stay compact | Baldur's Gate forum [BG][X]; Diablo III's "Details" button [DW][X] | the doll is the hero of the screen |
| Stash filters | Battle Brothers All, Weapons, Armor, Misc, Usable [BBi][V] | finds the item for this slot |

### 2.3 Comparison when equipping

| Approach | Evidence | Strength | Weakness |
|---|---|---|---|
| Deltas on the stat rows while hovering | XCOM 2 [X2h][V] | the change appears where the stat lives | needs a stat list on screen |
| Disabled with a reason | XCOM 2 [X2l][V] | explains instead of hiding | — |
| Aggregate categories (Damage, Toughness, Recovery) | Diablo III [D3b][X] | one glance | "misleading" when it leaves mechanics out [D4f][X] |
| Higher or lower power only, full comparison as an option | Diablo IV [D4a][D4b][X] | quiet by default | the full view hides in settings |
| Color-coded sign only | XCOM 2 good and bad states [X2h][V] | compact | color alone fails color-blind players |

The pattern for FM: deltas on the stat rows, always with a sign and an arrow. At most 3 deltas in
the item tooltip; Shift shows all of them. One derived summary line, the matchup (P3), comes from
the same sim selector as everything else, so it never misleads by leaving something out.

### 2.4 Stat bars versus numbers

- **Bars appear for bounded current-against-maximum values,** always labeled:
  - OpenXcom's HP, TUs, energy, and armor per facing [OX][V];
  - XCOM 2's HP ticks and armor pips [X2f][V];
  - Battle Brothers' bars, each labeled with its number [BBh][V];
  - Total War's per-model health and its separate morale bar [TW1][X].
- **Skills are shown as numbers** in Dominions, Civ VI, AoW4, and Wesnoth.
- **Where bars mislead:**
  - Each unit's bar on its own scale: the Dominions 5 dragon and small hero [S12][X].
  - The bar's scale differs from what the player compares: Cleveland and McGill found that
    position along a *common* scale is judged most accurately [CM].
- **FM's numbers are small integers near the baseline of 10, where one point matters.**

  | FM matchup (no modifiers) | Hit chance [C] |
  |---|---|
  | att 10 vs def 10 | 46.1% |
  | att 11 vs def 10 | 53.9% |
  | att 11 vs def 9 | 61.5% |
  | att 12 vs def 7 | 79.3% |
  | att 9 vs def 11 | 31.6% |
  | ranged, prec 10 | 53.9% |

  A bar from 0 to 20 would draw the 10-against-11 difference as 5% of its width.

**For FM:**
- Numbers for skills on the card and in hover.
- Bars only for current against maximum: squad HP%, commander HP, caster fatigue, ammunition,
  and (with items) durability. Always labeled "9 / 14".
- Common-scale bars only inside Codex table columns, where every row shares the column's range.

### 2.5 Ability icons with one-line rule text

- **One record per rule:** name, icon, one sentence, and a link to the long text.
  - Wesnoth: specials and abilities [WN-s][V].
  - AoW4: passives and concepts [AD][V].
  - Total War: attributes [TW4][X].
- **Lengths that work:**
  - AoW4 unit passives: median 76 characters, 90th percentile 161 [C].
  - AoW4 concept first sentences: median 105 [C].
  - Wesnoth help sentences run longer, median 146, because they include exact numbers [C].

  FM's limit of 120 characters (research-dom-units section 12) sits between AoW4's median and its
  90th percentile.
- **Show the state.** Wesnoth's "(inactive)" [WN-r][V] tells the player why a rule did not fire.
  XCOM's dimmed rows and Civ's zero-hiding do the same job.
- **Bundle with a role word.** AoW4's Polearm Unit and Shield Unit [AD][V], and Total War's
  anti-large [TW4][X], let one word carry three rules.
- **Reminder text.** MTG prints the rule beside the keyword where players need it [MTG1][X].
  The Codex page is FM's "card text box": keyword plus reminder for every ability the unit has.

### 2.6 Size: classes and silhouettes

- **A named class carries the rules.** Total War's "horse-sized or bigger" [TW4][X] and AoW4's
  "Large Target" (121 of 513 units; three effects in one sentence) [AD][V][C] show that one word
  is enough for most decisions. Dominions keeps a number from 1 to 9 or more that eight rules read
  (research-dom-units section 2.2).
- **Silhouettes to scale.** No source in this set documents a "size line-up" screen. The evidence
  is indirect:
  - players value scale ("giants to horses" is the owner's own phrase);
  - FM's battle design already draws sprites at their visual size (battle-design S2.2, S2.4).

  A Codex page that lines every unit up against a human silhouette is a proposal, flagged as
  such.
- **For FM:** name the classes in words (section 3.3). Draw the card sprite to scale. Make the
  line-up the Codex's "from horses to giants" page.

### 2.7 Damage types and resistances

| Presentation | Evidence | Read |
|---|---|---|
| Damage type icon on every attack | Wesnoth attacks table [WN-h][V]; AoW4 damage icons [AD][V] | the element is part of the weapon |
| A signed table by element, colored | Wesnoth [WN-h][WN-u][V] | complete, but a full table even when most rows are 0 |
| Coarse tiers, only those that apply, in element color with icon | AoW4: 40% of units, 88% of entries at tier 2 or 4 [AD][C] | quiet: most units show nothing |
| A list of percentages | Darkest Dungeon's eight [DD2][X] | fine for 8 fixed kinds, noisy as chips |
| Armour piercing as a share of damage | Total War split [TW1][X]; Battle Brothers "% effective against armor" [BB1][X] | readable, but confused players when it disagreed with another tooltip [BB1][X] |
| Resistances turned into outcomes ("damage versus") | Wesnoth [WN-r][V] | answers "should I send these archers?" |

**For FM** (when research-dom-units R3 lands):
- Show a resistance only when it is non-zero, with the element glyph, the signed number, and ▲
  (resists) or ▼ (weak).
- The Codex elements page holds the full table.
- The matchup line folds resistances in, so the player sees outcomes, not arithmetic.

### 2.8 Gear and damage on the battle stage

- **Gear is data that drives look and sound.** Battle Brothers' helmet sets `ShowOnCharacter`
  and an `ImpactSound` by material [BBs][V]. FM's battle design already gives every unit a
  `Material` that picks deflect sparks and sounds (battle-design S2.2), and `docs/09` gives each
  nation its own armor and weapon layers.
- **Armor interaction previewed on armor.** XCOM 2 marks pierce and shred on the armor pips
  [X2f][V]. FM's ARMOR chip (battle-design S2.8) fires when armor holds. There is no mark yet
  for armor piercing or negating getting through.
- **Per-unit logs.** Dominions' `v` [DM6][V]. A log that leaves out modifiers is the complaint
  [D7][X].
- **Visible upgrades.** The Darkest Dungeon fan request [DD3][X].

### 2.9 Encyclopedias

- **Generated from data,** so they cannot drift: CK3 (UI research [X]); AoW4's 508 concepts
  [AD][V].
- **They compare and filter:** the Dominions 6 Data Inspector's property search [DI][V]; the
  Better Civilopedia unit table [CV1][X]; Wargroove's damage matrix [WG][X].
- **They are reachable from any tooltip:** Old World's F1 (#73), AoW4's F1 (UI research [X]).
- **They must add what tooltips lack.** Old World's help was called a rehash of its tooltips (UI
  research [X]).

### 2.10 Anti-patterns, with the evidence

| Anti-pattern | Evidence | FM guard |
|---|---|---|
| A roll-changing number missing from the UI | Total War spread, accuracy, reload, stun, knockback [TW2][TW5][X]; XCOM 2 armor mitigation [X2s][V]; Dominions logs [D7][X] | Rule 4 (section 3.1): if it changes a roll, it is in the L1+ breakdown, the per-blow detail, and the Codex |
| A property shown on the wrong object | the Battle Brothers spear bonus appears only on the skill [BB2][X] | a weapon's properties appear on its own line |
| One number, two values | Dominions game against inspector [DI][V]; Battle Brothers weapon against attack tooltip [BB1][X] | one selector feeds every surface (UI spec rule 3) |
| Tiny unlabeled icons | Dominions 6 [D1][X] | in panels, a glyph always comes with a word or a number |
| Bars on per-unit scales | Dominions 5 [S12][X] | bars only for current against maximum, labeled |
| Upgrades invisible on the sprite | Darkest Dungeon [DD3][X] | gear and items draw as SVG parts |
| A full table where most rows are 0 | Wesnoth shows every damage type | non-zero only on cards and hover; the full table in the Codex |
| Players keep an external database | the Dominions Data Inspector [DI][V] | Codex filters and table |
| Stats crowding the inventory | Baldur's Gate forum [BG][X] | the paper doll shows core stats; Shift or the Overview tab holds the rest |
| Missing reminder text on special cards | MTG [MTG2][X] | every ability on a Codex page shows its one-liner |
| Deltas by color only | XCOM 2 good and bad states [X2h][V] | sign, arrow, and color |

---

## 3. Fluid Magic: a layered presentation for units and items

### 3.1 Rules

These extend the "earn its place" test of research-dom-units section 12 and the UI spec's eight
rules.

1. **Budgets are content and are tested.** `UI.unitCard` in `src/content/ui.ts` holds:
   - `maxNumbers: 3`, `maxGlyphs: 3`, `maxElementMarks: 1`;
   - `oneLineMax: 120`;
   - `hoverRowsBeforeShift: 14`.

   A UI derive test fails if any unit's card exceeds them (Civ VI's data error, as a test).
2. **Silence for zero and none.** Zero resistances, an empty ability list, and stats no rule reads
   are left out: MR until a rule uses it (research-dom-units R6), and leadership on troops. Empty
   table columns are dropped. Sources: Civ [C6][V], Wesnoth [WN-h][V].
3. **Per troop, then the squad.** Stats are per troop. A squad adds its count, HP% (`Squad.hp`
   against count × max), and its state.
4. **Nothing that changes a roll is hidden.** Every modifier the resolver applies appears:
   - as a row in that stat's L1+ breakdown (terrain, scales, bless, starvation, unpaid, home
     terrain, buffs);
   - in the per-blow detail (battle-design S1.3);
   - in the Codex concept text.
5. **One number, one source.** Every displayed number comes from a sim selector, run with a trace
   for breakdowns or with a what-if override for previews (UI spec rule 3). This includes the
   matchup odds (section 3.11).
6. **One home per fact.** A weapon's damage, reach, ammunition, element, AP, AN, and charge
   bonus are on its weapon line and nowhere else. Gear composition is on the Protection row.
7. **Glyph + word + number, never hue alone.** Deltas carry a sign and ▲ or ▼. Elements carry
   their glyph. Rows carry the letters F, M, and R as well as dots (section 3.10).

### 3.2 The unit card (L0)

The UI spec defines one `UnitCard` with the variants `recruit`, `squad`, `box`, `mini`,
`report`, and `replay`, about 72 × 96 px for the squad strip. This section defines what each
variant carries.

**The sprite is the first stat.**
- It is the same SVG as the battle sprite. The nation's armor and weapon layers, the shield, the
  mount, and (with items) the commander's item parts are all drawn. So gear is visible at L0 for
  free (Battle Brothers, Darkest Dungeon lesson).
- Sprites are drawn to scale with a shared baseline. Size 1 fills 62% of the frame height, size
  2 74%, size 3 86%, and size 4 and up the full frame, breaking the top edge by up to 8 px. The
  numbers are content in `UI.unitCard.sizeScale`. A Giant looks big before the player reads
  anything.

**Headline numbers by role**, at most 3 (Civ VI's filter). They come from `cardNumbers(unit)`, a
pure UI derive over content:

| Role (section 3.3) | Numbers |
|---|---|
| Melee (infantry, cavalry, monsters) | ♥ HP · ⛨ Prot · ⚔ Dmg (str + best melee weapon) |
| Ranged | ♥ HP · ⛨ Prot · ➶ Shot (dmg) with a range mark (M or R, section 3.10) |
| Caster or priest | ♥ HP · pip row (already on the frame) · holy for priests |
| Scout | ♥ HP · eye glyph with the sight distance |

**Ability glyphs**, at most 3, then "+N":
- They are ordered by `AbilityDef.cardPriority`. The signature rules come first: sacred,
  berserk, flying, regeneration, fire shield, trample, fear, stealthy.
- Classification tags such as `beast` or `construct` never take a card slot. They appear in the
  L1 title. This is AoW4's primary and secondary split.

**Element mark**, at most 1: the largest resistance or weakness, for example "▼ (flame)". It
appears only when R3 lands.

**State chips (squad variants only)** take the glyph slots first, because conditions beat traits
(UI spec rule 5): routing, starving, unpaid, blessed, buffed, and debuffed.

| Variant | Sprite | Name | Numbers | Glyphs | Other |
|---|---|---|---|---|---|
| `recruit` | yes | yes | 3 by role | 3 | cost (gold, materials, pop) and days per 10; a reason line when blocked (from `validateCommand`) |
| `squad` | yes | on hover | — | state first, then abilities | count badge, HP bar (squad HP%), row glyph |
| `box` (Battle Plan) | yes | short | Dmg or Shot only | 2 | reach dots, closing round ("r3") |
| `mini` (outliner, rosters) | head crop | — | — | 1 | count |
| `report` | yes | yes | — | — | start → end; killed and routed (UI spec section 4.2) |
| `replay` | yes | yes | — | buffs and debuffs | live count, exact HP for commanders (battle-design S4.6) |

### 3.3 The unit hover (L1) and Shift (L1+)

**Anatomy** (the UI spec's Value and Entity tip template, specialized). The stats are FM's
Briar Guard from `docs/03`. The lore line and the gear pieces are invented for the example, as
the research-dom-units R2 gear registry would compose them:

```
+-------------------------------------------------------------+
| [sprite] Briar Guard              Thornwood · Heavy infantry |  title, nation, role
|          Man-sized · Slow (joins melee in round 4)           |  size class, speed in words
| Thornplate grown on the living vine; the wall the forest     |  lore line (first sentence)
| raises.                                                      |
| ------------------------------------------------------------ |
| HP 12    Prot 9    Morale 12   Str 12                        |  body block, per troop
| Att 11   Def 10    Prec 10                                   |
| ------------------------------------------------------------ |
| Halberd    7 + str 12 = 19      melee   [Reach]              |  weapon line with chips
| Gear       Thornplate 7 + Iron cap 2 = Prot 9                |  gear composes Prot
| ------------------------------------------------------------ |
| [leaf] Forest home   +1 def in forests, either side.         |  ability: glyph, name, one line
| ------------------------------------------------------------ |
| vs Cinder Warrior: about 1 in 2 swings fells one             |  matchup (P3, M1-should)
| ------------------------------------------------------------ |
| Upkeep 1.6/mo · Supply 1 · 24 g 26 m 10 pop · 14 days per 10  |  economy line
| Shift sources · T lock · Ctrl+click Codex                    |  gesture footer
+-------------------------------------------------------------+
```

**Rows and their sentences.** Each label is a dotted concept link (L2):

| Row | Shown when | Sentence (L2 summary) |
|---|---|---|
| Size class | always | "Size sets supply eaten and how much of the line a body fills." (wording follows research-dom-units R1) |
| Speed in words | always | "Fast closes in round 2, normal in 3, slow in 4; archers shoot until then." |
| HP, Prot, Morale, Str, Att, Def, Prec | always (Prec only with a ranged weapon or spells) | one line each, from `concepts.ts` |
| Weapon line | each weapon | "Damage = strength + weapon in melee; weapon alone for shots." |
| [Reach] [AP] [AN] [Charge +3] [Fire] chips | when the weapon has them | AP: "Halves the target's protection." AN: "Ignores protection." Charge: "+3 damage in its first melee round." |
| Gear | with the gear registry | "Each piece adds protection; materials pay for it." |
| Abilities | each | the catalog's `oneLine`; "(inactive)" with its condition when unmet in this context |
| Resistances | non-zero only | "Fire −5: fire hits deal 5 more." |
| Matchup | with the odds selector | see below |
| Economy | always | upkeep, supply, cost, days; blocked reason in the recruit grid |

**Reach dots** (Darkest Dungeon's position dots, mapped onto FM's rows). Each ranged weapon and
battle spell shows two groups of three dots:
- **Acts from**: own rows, always all three for FM shooters. For melee squads, the row they fight
  from is the front.
- **Reaches**: enemy rows. Range under 5 reaches the front and middle; range 5 or more reaches the
  rear (`BATTLE.rearReach`, `attacks.ts` `reaches`).
- Dots are filled or empty circles labeled F, M, and R, so shape and letter carry the meaning
  without color.
- Longbow (range 7): `●●● → ●●●`. Javelins (range 3): `●●● → ●●○`.

**Shift (L1+).**
- Every stat row expands into its sources: base, home terrain, Fury and Lore scales, bless,
  buffs, starvation and unpaid morale, fort storm, walls. The sources come from the stat selector's
  trace (section 3.11).
- The weapon line expands into the damage parts: `str 12 + Halberd 7 = 19, against prot (9 →
  4 with AP)`.
- The matchup expands into a "damage versus" list (Wesnoth) against every enemy unit type the
  player has seen, best targets first:

  ```
  vs Ash Militia      hit 68%  avg 18  fells 92% of hits  → 1 in 1.6 swings
  vs Cinder Warrior   hit 62%  avg 16  fells 83% of hits  → 1 in 2 swings
  vs Salamander       hit 54%  avg 11  35 HP              → about 6 swings to fell
  ```

  Figures are computed with no modifiers [C].

**The matchup line in plain words.** FM's dice make exact odds cheap. DRN is two open-ended d6,
and the hit and damage rules are in `attacks.ts`. Computed with no modifiers [C]:

| Attacker → target | Hit | Average damage on a hit | One-hit kill | Line shown |
|---|---|---|---|---|
| Briar Guard Halberd (str 12 + 7) → Cinder Warrior (def 9, prot 3, hp 11) | 61.5% | 16.1 | 83% | "About 1 in 2 swings fells one." |
| Cinder Warrior Axe (11 + 5) → Briar Guard (def 10, prot 9, hp 12) | 53.9% | 7.5 | 21% | "About 1 in 9 swings fells one." |
| Flame Archer arrow (6) → Warden (prot 6, hp 11) | 53.9% | 2.4 | 5% | "About 1 in 36 arrows fells one." |
| Fire Sprite Flame Touch (str 6 + 5, AP) → Briar Guard (def 10, prot 9 → 4, hp 12) | 46.1% | 7.5 | 21% | "About 1 in 10 swings fells one." |
| Briar Guard Halberd → Salamander (def 10, prot 8, hp 35) | 53.9% | 11.2 | 0.2% | "About 6 swings to fell one." |

Notes on the table:
- **The Fire Sprite row shows why the chips matter.** Armor piercing makes the sprite's base 11
  against prot 4 deal exactly what the axe's base 16 deals against prot 9. "AP is worth 5 here"
  is the kind of fact the Shift view should make visible.
- **The phrasing switches for big bodies.** When one hit rarely kills (under 10%), the line gives
  swings to fell one instead: HP ÷ (hit chance × average damage), rounded. For the Salamander that
  is 35 ÷ 6.0 ≈ 6. "1 in 1000 swings" would be true but useless. The threshold is content
  (`UI.matchup.oneHitBelow`).

A "1 in N" line is one sentence a player can feel. The percentages stay in Shift for players who
want them. The real selector folds every modifier in (rule 4), so in-game lines will differ from
this table.

**Context filtering** (Old World #132, UI spec section 5.1):
- **Recruit grid:** title, numbers, economy line and blocked reason first; matchup against the
  nearest known enemy army.
- **Battle Plan:** row, closing round, reach dots, script; matchup against the opposing army's
  front squads when they are known.
- **Map and outliner:** HP%, morale state, supply status, order.
- **Replay:** live HP, buffs with rounds left, gear, last blows (section 3.9).

### 3.4 Concepts (L2) and the abilities catalog fields

**New concepts for `src/content/concepts.ts`**, beyond the UI spec's 55: Size, Protection,
Armor piercing, Armor negating, Weapon, Reach (with research-dom-units R4), Range, Ammunition,
Element, Resistance (with R3), Role, Gear, Item, Slot, Hit chance, Damage roll, and Matchup.
Each has a `summary` (one or two lines) and a `body` (the Codex paragraph with the formula in
words).

**Display fields for the shared abilities catalog** (research-dom-units R5; pretender N1). The
catalog holds rules; these are the presentation fields every entry must carry. Content
validation checks them.

```ts
// src/content/abilities.ts (display fields only; the rule fields belong to research-dom-units R5 and pretender N1)
export interface AbilityDisplay {
  name: string;               // "Berserk"
  glyph: GlyphId;             // a 24x24 monoline SVG id from docs/09 Icons
  oneLine: string;            // <= UI.unitCard.oneLineMax chars: "+2 att and +2 str below half HP; never routs."
  reminder?: string;          // Codex reminder text where the one-liner drops a number or edge case
  codex: string;              // the full paragraph with exact numbers and interactions
  kind: 'signature' | 'class'; // signature: may take a card glyph slot; class: L1 title only (AoW4 split)
  cardPriority: number;       // lower shows first among signature abilities
  condition?: string;         // when it applies, for "(inactive)": "below half HP", "first melee round"
}
```

- **Validation:**
  - every `UnitTag`, weapon property, `CommanderTraits` field shown in the UI, and N1 ability
    resolves to an entry;
  - `oneLine` fits the limit;
  - every glyph exists in the icon set;
  - no two signature abilities share a glyph.
- **Measured against the evidence:** the one-liner corresponds to AoW4's passive text (median 76
  characters) [C]; `codex` corresponds to Wesnoth's help sentences (median 146) [C]; `reminder`
  is MTG's convention [MTG1][X].

### 3.5 The detail page (L3)

**Troops.** A squad's detail is the **Squad sheet**, opened with `I`, a right-click, or Ctrl+click
on a squad card. It is the Codex unit page (3.6) with a live block on top:
- count and HP;
- wounds carried (survivors keep their wounds, `docs/04`);
- active effects with time left;
- the commander leading it;
- the battles it fought (from battle summaries).

There is no separate component. The live block is the only difference, so the two cannot drift.

**Commanders.** The Commander panel (UI spec section 2.8.2, on demand with `Enter`) holds the
commander's sheet on its Overview tab:

```
+---------------------------------------------------------------------------+
| Varo the Ember · Cinder Magus · [R][R] · holy 1      [Overview][Plan][Rituals][Gear] |
+----------------------+----------------------------------------------------+
| [portrait 2x, gear]  | HP 9 / 11   Morale 11   Fatigue 0                  |
|                      | Leadership 20 (leads 12)   Map speed fast          |
| Man-sized            | Att 10  Def 10  Str 10  Prot 2  Prec 10            |
|                      | Staff 2 (melee)                                    |
| History              | Abilities: (none)                                  |
|  6 battles · 41 kills| Carried mana: [R] 4                                |
|  slew Ash Chieftain  | Research: toward Ember 3                           |
|  at Kharsk Ford      |                                                    |
+----------------------+----------------------------------------------------+
```

- History is P14: battles and kills are an M1 hook (research-dom-units R9). Notable kills come
  from battle summaries.
- The Gear tab is the paper doll (3.7). It is the panel's fourth tab, which is the UI spec's
  maximum.

### 3.6 The Codex (L4): compare, filter, line up

The UI spec's Codex generates entity pages from the content registry. For units and items it
adds the following.

**Unit page sections:**
1. Header: name, nation, role, size class, sprite at 2× with gear.
2. Lore: the full description.
3. Body block, the same numbers as L1.
4. Weapons table: name, damage, reach dots, chips, element.
5. Gear list, piece by piece, with protection and materials (once gear exists).
6. Abilities: glyph, name, one-liner, then the reminder and Codex text.
7. Resistances table (non-zero rows), with a link to the elements page.
8. Recruitment: where, cost, days, requirements, upkeep, supply.
9. Matchups: "damage versus" against every unit in the game. This is the reference, not the fog
   view: the Codex is public knowledge, as Dominions' manual and inspector are.
10. Related: same role in the other nation, the cheaper and dearer alternatives, and the concepts.

**List views:**
- **Unit table.** Sortable columns: HP, Prot, Mor, Str, Att, Def, Prec, Size, Speed, best melee
  hit, best shot, cost, upkeep. Each cell has a small **common-scale bar** for its column, so a
  column reads as a chart (Cleveland and McGill [CM]) and the number stays in the cell.
- **Filters** as chips (the Inspector's property search [DI][V], made friendly): nation, role,
  size class, tag, ability, element dealt, resistance, "has ranged", "summon only", "commander".
  Advanced players type `prot >= 7`; the chip set builds the same query.
- **Compare.** Pick up to 3 units for side-by-side columns. Differences are marked ▲ or ▼
  against the first unit [M1-should].
- **Line-up: "From horses to giants".** Every unit at true visual size on one baseline, against a
  human silhouette, grouped by size class [M1-should; sprites in Phase 11].
- **Abilities index.** Every ability with every unit that has it (a back-link).
- **Elements page.** Every element: glyph, which weapons and spells deal it, and which units
  resist or are weak to it (with R3).
- **Items** (with items): a table by slot, with filters and "Usable by" links to own commanders.

**The Codex adds what tooltips lack** (UI spec section 5.2): comparison, filters, the line-up,
back-links, and full matchups. It never repeats a tooltip without adding something.

### 3.7 The commander paper doll

Whether items exist in M1 is the item design's decision. **The paper doll's frame ships in M1
regardless,** as a read-only **Kit strip**: a row of tiles for every unit's standard gear. Each
tile is the piece's sprite part, its name, and its numbers, with a tooltip. It appears on the
Codex page and the Squad sheet. When items arrive, the strip becomes the doll's slots.

**Layout** (Battle Brothers' columns, Dominions' slot rules):

```
+-------------------------------------------------------------------------------+
| Gear · Varo the Ember (Cinder Magus)                     at Kharsk (lab: yes)  |
+-------------------------+---------------------------+-------------------------+
| [Head]                  |                           |  HP     9 / 11          |
|  Ember Circlet          |   full-body sprite 2x     |  Prot   2  → 4  ▲2      |
|                         |   (wears what is shown)   |  Def    10              |
| [Main hand]             |                           |  Morale 11 → 13 ▲2      |
|  Staff 2 (standard)     |                           |  Fire   — → ▲5          |
|                         |                           |  Abilities granted:     |
| [Body]                  |                           |   (fire shield) Fire    |
|  (robes, standard)      |                           |   Shield 3              |
|                         |                           |                         |
| [Misc]                  |   Man-sized               |  Shift: full comparison |
+-------------------------+---------------------------+-------------------------+
| Stash (Cinder Horde, at labs)  [All][Weapons][Armor][Head][Misc][Usable by Varo]|
| [Emberbrand][Ash Mail][Cinder Ring][Bark Shield: greyed, "needs a free hand"]... |
+-------------------------------------------------------------------------------+
```

**Rules on screen.** Each is a validated rule in the sim and a sentence on screen.
- **Slots follow the body.**
  - The body's slot set is content. Humanoid: head, main hand, off hand, body, misc. Beasts and
    many pretender bodies: misc only. Mounted: no feet while mounted (Dominions [DM4][V]).
  - Slots the body lacks are drawn greyed with the reason: "Wyrm: no hands".
- **Standard kit returns** (Dominions [DM4][V]). Standard items show "(standard)". Removing an item
  restores them, so there is no empty-slot penalty and no bookkeeping.
- **Blocking is drawn.** A two-hander greys the off hand with a chain glyph and "held by
  Emberbrand (two-handed)" (Battle Brothers [BBp][V], AoW4 [AD][V]).
- **Hovering a stash item writes deltas on the stat rows** (XCOM 2 [X2h][V]): `Prot 2 → 4 ▲2`.
  There are at most 3 delta rows in the item tip itself. The rows on the doll show every changed
  stat.
- **Dragging lights the valid slots** (Battle Brothers [BBp][V]). A click on an item equips it
  into its slot, or into the empty one if there are two. A click on a slot filters the stash to
  that slot (Dominions [DM4][V]).
- **Unusable items stay listed, disabled, with the validator's reason** (XCOM 2 [X2l][V]): "needs
  a lab in this province", "Wyrm: no hands", "carried by Kesh". The reason string is what
  `validateCommand` returns (UI spec rule 7).
- **Keyboard path** (XCOM 2's lists): Tab moves between the slots and the stash, arrows move
  within them, and Enter equips.

**Commands.** `equipItem { commander, item, slot }` and `unequipItem { commander, slot }`. Both
pass `validate` before `apply`, and the AI equips with the same commands (docs/08 would gain an
"equip the best item for each commander" step). The deltas come from the stats selector with a
what-if override (UI spec section 7.2), never from a UI recomputation.

**Depth audit** (UI spec section 1.5): select commander → `Enter` → Gear tab → click item = **4
clicks**, which is within the budget. Shift adds no click.

### 3.8 The item tooltip

```
+------------------------------------------------------------+
| [icon] Emberbrand              Weapon · one hand · Ember 2  |
| "Forged in the Kharnath pyres; it never cools."            |
| Burning blade  dmg 7  [fire] [AP]                          |
| [ember glyph] Fire shield 3: strikers take 3 fire per hit. |
| ---------------------------------------------------------- |
| On Varo: replaces Staff 2 → Hit ▲5 · fire · ▲AP            |  at most 3 deltas
| Shift: full comparison · Ctrl+click Codex                  |
| History: forged Y1 M8 at Kharnath · 14 kills (M2)          |
+------------------------------------------------------------+
```

- The "replaces" line is the comparison summary (Diablo IV's quiet default [D4a][X]). Shift
  lists every changed stat (Advanced Compare).
- Granted abilities use the same catalog entries, glyphs, and one-liners as units, so an item's
  fire shield reads exactly like the Ash Colossus's.
- History is P14, M2 (CK3 [CK2][X]). It is built from battle summaries naming the item's bearer.

### 3.9 The battle replay: gear, damage types, resistances

The battle design covers most of the stage. This table separates what it already has from what
this note adds.

| What | Already in battle-design final | Added here |
|---|---|---|
| Gear on sprites | archetype, rig, material, shield, mount (S2.2); placeholder rigs, then SVG parts in Phase 11 (S4.4, S6.2) | **commander items draw as parts** over the slot's standard part (an item's `look.part`); a magic weapon gets a glow in its element's palette |
| Armor holding | deflect sparks by material; **ARMOR** chip when more than 60% of a pair's hits are blocked (S2.8) | an **AP** mark (a split-shield glyph) on hits where armor piercing applied, and **AN** (shield crossed out) where negating applied; shown in detailed mode on featured blows, and in the per-blow detail |
| Damage numbers | rolling number per block; spell numbers carry their element color and glyph (S2.9) | **element glyph on every non-physical number, weapons included** (Fire Arrows, Burning Blade, Flame Touch, Fire Breath). Physical stays plain |
| Resistances (with R3) | — | a small **▲ RESIST** or **▼ WEAK** suffix chip on the number when the target's resistance changed the blow; the per-blow detail shows `−3 (fire resist 3)` |
| Inspect a unit | dock row hover outlines the block; tooltip with stats, weapons, buffs (S4.6) | **click a block or dock row** (pauses): the `replay` unit card plus **its last 5 blows** given and taken, from the detail stream (Dominions' `v` [DM6][V]); in fallback mode, the tallies only |
| Log detail | Events and Report tabs (S4.6) | the Report's detail levels mirror Dominions' 1 to 4 [DM6][V]: outcomes; plus counts; plus modifiers; plus every roll |
| Teaching | ticker lines; captions (S2.15) | **the first time** in a battle that AP, AN, an element, a resistance, a charge, or reach decides a blow, the ticker adds the concept's one-liner ("Armor piercing: halves protection."); at most one per concept per battle; off in settings |
| Size | visual size, footsteps, topple deaths (S2.2, S2.9) | — (covered) |
| Commander HP | exact HP bar in the docks (S4.6) | on stage, a thin HP bar over commanders and size 3+ units, with a tick per 10 HP (XCOM's ticks [X2f][V]) |

Rules that keep this honest:
- Every mark comes from a detail event (`strike.damage.armor`, `element`) or a stored event.
  Nothing is inferred.
- In fallback mode the AP, AN, and RESIST marks are hidden, as the break-chance meter is
  (battle-design D4).

### 3.10 Symbols and color

| Meaning | Symbol | Never alone |
|---|---|---|
| Elements | outline versions of the mana shapes for fire (flame), nature (leaf), and holy (sun disc); snowflake for cold; skull in a drop for decay; no glyph for physical. This changes battle-design S2.9, which reuses the mana shapes as they are | the outline keeps "fire damage" apart from "costs R" (UI spec rule 8: mana colors only on things with that identity); the element's name in L1 |
| Resist / weak | ▲ / ▼ with the signed number | warm or cool tone is extra; the shape carries the meaning |
| Deltas | `→` with ▲ or ▼ and the sign | — |
| Rows | F, M, R letters inside filled or empty circles | letters work in greyscale |
| Size classes | a silhouette per class (man, horse, ogre, giant, colossus) at 16 px in L1 titles | the word ("Huge") next to it |
| Abilities | 24 px monoline glyphs (`docs/09` Icons) | the name in L1, always |
| AP / AN | split shield / crossed shield | the chip text "AP" / "AN" |

**Size class words.** These need a ruling from the owner and research-dom-units R1. FM's size 1
is human, so: 1 Man-sized, 2 Large (Oakheart, Oracle), 3 Big (Salamander), 4 Huge (Giant,
Treant, Titan), 5 and 6 Colossal (Ash Colossus, Great Wyrm). The words are content
(`UI.sizeClasses`).

### 3.11 What content and sim must expose

| Need | Where | Pure | Notes |
|---|---|---|---|
| `AbilityDisplay` fields on every catalog entry | `src/content/abilities.ts` | content | section 3.4; validation |
| `description` on every unit and gear piece | `UnitDef`, `GearDef` | content | research-dom-units R7; first sentence is the L1 lore line |
| `role` on units, or derived from the look archetype | `UnitDef.role?` or `lookFor(unit).archetype` | content | one word per unit |
| `GearDef.look: { part, material }` | gear registry (research-dom-units R2) | content | the same part draws on the card, doll, and stage |
| Body slot sets | chassis and unit content | content | for the doll; Dominions' rules |
| `unitStats(state, ref, opts?: { trace?, override? })` | `src/sim/selectors.ts`, reusing the modifier fold in `battle/setup.ts` with a trace sink | yes | every stat with its sources; the override gives the equip preview (UI spec section 7.2). One fold serves battle setup and hover, so they cannot disagree |
| `battleOdds(attacker, weaponIndex, target, mods)` | `src/sim/battle/odds.ts` | yes, **no rng** | exact hit chance and damage distribution from the DRN distribution, using the resolver's own formulas (`attacks.ts`) and `BATTLE` constants; feeds the matchup line; the AI may use it later |
| `equipItem`, `unequipItem` commands | `src/sim/commands/**` | yes | validated; AI uses them |
| `cardNumbers`, `cardGlyphs` | `src/ui/derive/unitCard.ts` | yes (UI) | budgets from `UI.unitCard`; tested |
| Detail-stream fields for AP, AN, and resist marks | already in `strike.damage` (battle-design S1.3) | yes | add `resist` to `DamageRoll` when R3 lands |

`battleOdds` is a new pure function with no state and no rng. It must share the arithmetic of
`rollDamageParts` and the hit tests, so one formula has one copy. A test checks it against 20,000
seeded resolver rolls.

### 3.12 Tests

- **Content validation:**
  - every ability, tag, weapon property, and N1 ability has `name`, `glyph`, and `oneLine` within
    the limit;
  - signature glyphs are unique;
  - every unit has a `description`;
  - every gear piece has a look part;
  - every body has a slot set.

  New units, gear, and abilities go into the fixtures (CLAUDE.md).
- **UI derive:**
  - no unit's card exceeds `UI.unitCard` budgets;
  - zero resistances and MR never render;
  - the variant table in 3.2 holds for every M1 unit (a snapshot of the derived data, not pixels).
- **`battleOdds`:**
  - exact against Monte Carlo through the real resolver functions within 0.5 points;
  - symmetric cases (att = def gives 46.1%, ranged prec 10 gives 53.9%);
  - AP and AN.
- **Equip preview never lies:** for random items and commanders, the preview's stats equal the
  stats after `apply(equipItem)`.
- **Replay marks:** every AP, AN, and RESIST mark matches a detail event; none in fallback mode.
- **Smoke (cheap):** the Codex unit table sorts and filters; the paper doll renders for each body
  type.

### 3.13 Phasing and cut lines

| Phase | Lands |
|---|---|
| Phase 8 (map and core UI) | `UnitCard` variants with budgets; unit hover with body block, weapon chips, abilities, economy; Shift sources; concepts |
| Phase 9 (remaining UI) | Codex unit page, table, filters, abilities index; Squad sheet; Commander Overview with history counts; reach dots in the Battle Plan; matchup line (M1-should) |
| Phase 10 (replay) | the additions in 3.9 |
| Phase 11 (SVG parts) | gear layers on cards, doll, and stage; the size line-up page |
| With R3 (resistances) | element marks, resist rows, the elements page, RESIST and WEAK chips |
| With items (M2 unless the item design lands them in M1) | Gear tab paper doll, item tips, stash, `equipItem`; item history (M2) |

**Cut lines**, in this order:
1. The size line-up page (keep sprite scale and the size words).
2. Compare-3 in the Codex.
3. The matchup line in hover (keep it in the Codex).
4. Teaching lines in the replay.

Never cut:
- the card budgets;
- Shift sources (rule 4 depends on them);
- one-liners on every ability.

---

## 4. Open questions for the owner

1. **Matchup line in M1?** It needs one pure sim function (`battleOdds`). It turns stats into the
   feeling the owner asked for ("about 1 in 2 swings fells a Cinder Warrior"). Recommended for
   Phase 9.
2. **Size words.** Man-sized, Large, Big, Huge, Colossal, or other names that fit FM's tone?
3. **Enemy gear in fog.** Should enemy commanders' items show only after a battle against them
   (they are in the battle record), or also when scouted?
4. **"1 in N" or percentages first?** The note proposes "1 in N" at L1 and percentages on Shift.
5. **Kit strip in M1.** A read-only standard-gear row on every unit costs little and prepares the
   paper doll. Adopt it, even if items wait for M2?

---

## Sources

**Primary, read in this session [V]**

- [DM4] Dominions 6 manual, chapter 4 Units (community transcription of the official manual).
  https://dmacguigan.github.io/dom6-manual/chapters/04-units.html ; source
  https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/04-units.qmd
- [DM6] Dominions 6 manual, chapter 6 Combat. https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html ;
  source https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/06-combat.qmd
- [DI] Dominions 6 Mod Inspector, README (larzm42). https://github.com/larzm42/dom6inspector ;
  https://raw.githubusercontent.com/larzm42/dom6inspector/master/README.md
- [AD] Age of Wonders 4 game data as published by the aow4db fan database (MinionsArt):
  https://minionsart.github.io/aow4db/ ; data
  https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Units.json ,
  https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Abilities.json ,
  https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/HeroItems.json ,
  https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/concept_tooltips.json
- [C6] Civilization VI `unitpanel.lua`, as carried in the CQUI mod (a modified copy of Firaxis's
  file). https://raw.githubusercontent.com/CQUI-Org/cqui/master/Assets/UI/Panels/unitpanel.lua
- [BBp] Battle Brothers paper doll module, Legends mod copy.
  https://raw.githubusercontent.com/Battle-Brothers-Legends/Legends-public/master/ui/screens/character/modules/character_screen_left_panel/character_screen_paperdoll_module.js
- [BBh] Battle Brothers character header and level-up module, Legends copy.
  https://raw.githubusercontent.com/Battle-Brothers-Legends/Legends-public/master/ui/screens/character/modules/character_screen_left_panel/character_screen_left_panel_header_module.js
- [BBi] Battle Brothers stash list module, Legends copy.
  https://raw.githubusercontent.com/Battle-Brothers-Legends/Legends-public/master/ui/screens/character/modules/character_screen_right_panel/character_screen_inventory_list_module.js
- [BBs] Sato's Additional Equipment Mod for Battle Brothers: README and Decorated Great Helm
  script. https://github.com/jcsato/sato_additional_equipment_mod ;
  https://raw.githubusercontent.com/jcsato/sato_additional_equipment_mod/master/scripts/items/helmets/decorated_great_helm.nut
- [X2h] XCOM 2 War of the Chosen, `UISoldierHeader.uc`, Community Highlander.
  https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UISoldierHeader.uc
- [X2l] `UIArmory_Loadout.uc` and `UIArmory_LoadoutItem.uc`, same repository.
  https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UIArmory_Loadout.uc ;
  https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UIArmory_LoadoutItem.uc
- [X2f] `UIUnitFlag.uc`, same repository.
  https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UIUnitFlag.uc
- [X2s] `UITacticalHUD_ShotWings.uc`, same repository (Issue #1540 armor mitigation row).
  https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UITacticalHUD_ShotWings.uc
- [OX] OpenXcom `UnitInfoState.cpp` and `InventoryState.cpp`.
  https://raw.githubusercontent.com/OpenXcom/OpenXcom/master/src/Battlescape/UnitInfoState.cpp ;
  https://raw.githubusercontent.com/OpenXcom/OpenXcom/master/src/Battlescape/InventoryState.cpp
- [WN] Battle for Wesnoth source. [WN-h] help topic generator
  https://raw.githubusercontent.com/wesnoth/wesnoth/master/src/help/help_topic_generators.cpp ;
  [WN-r] sidebar reports https://raw.githubusercontent.com/wesnoth/wesnoth/master/src/reports.cpp ;
  [WN-u] unit helper (resistance colors) https://raw.githubusercontent.com/wesnoth/wesnoth/master/src/units/helper.cpp ;
  [WN-s] specials and abilities
  https://raw.githubusercontent.com/wesnoth/wesnoth/master/data/core/macros/weapon_specials.cfg ,
  https://raw.githubusercontent.com/wesnoth/wesnoth/master/data/core/macros/abilities.cfg
- [CM] Cleveland, W. S., and McGill, R. (1984), "Graphical Perception: Theory, Experimentation,
  and Application to the Development of Graphical Methods", Journal of the American Statistical
  Association 79(387). https://doi.org/10.1080/01621459.1984.10478080 (cited from the standard
  literature; not reopened in this session)

**Search-engine extracts [X]** (pages not opened; where an extract named several pages behind a
claim, they are grouped)

- [TW1] Total War: Warhammer per-model stats, weapon strength split on hover, tooltips on stat and
  ability icons: https://steamcommunity.com/app/1142710/discussions/0/3801651661449927115 ;
  https://steamcommunity.com/app/594570/discussions/0/1489987633998777774 ;
  https://steamcommunity.com/app/594570/discussions/0/3114770279402429850
- [TW2] Hidden spread, accuracy, reload; the Helper UI mod:
  https://steamcommunity.com/sharedfiles/filedetails/comments/2790585668 ;
  https://steamcommunity.com/app/1142710/discussions/0/3801651661449927115
- [TW3] Gamereactor, 2015 interview with Andy Hall: https://www.gamereactor.eu/?p=26906
- [TW4] Total War: Warhammer wiki attribute texts:
  https://totalwarwarhammer.gamepedia.com/Spearmen-at-Arms_(Shields) (Anti-Large);
  https://totalwarwarhammer.fandom.com/wiki/Beastslayers_of_Bastonne_(Foot_Squires) (Charge
  Defence); https://totalwarwarhammer.fandom.com/wiki/Gorebull (Armour-Piercing);
  https://totalwarwarhammer.fandom.com/wiki/Saurus_Scar-Veteran (Armoured)
- [TW5] Stun and knockback missing from the stats chart:
  https://steamcommunity.com/workshop/filedetails/discussion/691006940/350532536098956335
- [TW6] Melee intervals skewing the displayed stats:
  https://steamcommunity.com/workshop/filedetails/discussion/3308073985/612032174956240488
- [CV1] Better Civilopedia (Steam Workshop changelog: "Added Table of Units with key
  statistics"): https://steamcommunity.com/sharedfiles/filedetails/changelog/1341630847?p=2
- [BB1] Battle Brothers "Damage 25 - 40, 65% effective against armor"; weapon against attack
  tooltip damage: https://steamcommunity.com/app/365360/discussions/0/528398719806924128 ;
  https://steamcommunity.com/app/365360/discussions/0/3385042609884595433 ;
  https://steamcommunity.com/app/365360/discussions/0/614286507336795084
- [BB2] Spear hit bonus shown only on the Thrust skill:
  https://steamcommunity.com/app/365360/discussions/0/3153060475180161988 ;
  https://steamcommunity.com/app/365360/discussions/0/3385042609884595433
- [DD1] Darkest Dungeon skill dots (yellow usable, red targets, linked area):
  https://steamcommunity.com/app/262060/discussions/0/412447613581265645 ;
  https://forum.quartertothree.com/t/darkest-dungeon/73511?page=59 ;
  https://darkestdungeon.wiki.gg/wiki/Getting_Started
- [DD2] Darkest Dungeon Crusader base resistances: https://darkestdungeon.wiki.gg/wiki/Crusader
- [DD3] Darkest Dungeon gear not shown on sprites (2015 and 2017 threads):
  https://steamcommunity.com/app/262060/discussions/0/490121928351931621 ;
  https://steamcommunity.com/app/262060/discussions/2/1621724915804138632
- [CK1] CK3 men-at-arms stats (dev diary summary):
  https://www.gamingonlinux.com/2019/11/paradox-explain-their-vision-for-crusader-kings-3-along-with-a-new-dev-diary-on-war/page=1/ ;
  [CK1b] counters: https://www.gamewatcher.com/news/crusader-kings-3-troops-armies
- [CK2] CK3 Royal Court artifacts and inventory: Dev Diary #80
  https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-80-is-that-a-dagger-in-your-pocket.1496381 ;
  Dev Diary #85 https://www.paradoxinteractive.com/games/crusader-kings-iii/news/dev-diary-85-an-artifact%E2%80%99s-life ;
  NME https://www.nme.com/news/crusader-kings-3-is-adding-an-inventory-system-for-wearing-artefacts-3088573 ;
  patch 1.017 notes https://mp1st.com/news/crusader-kings-3-update-1-017-released-for-royal-court-dlc-this-may-17
- [AW1] AoW4 nested tooltips and F1 (via `../ui-design/research-fourx.md` section 1):
  https://www.pcgamer.com/age-of-wonders-4-review/ ;
  https://steamcommunity.com/app/1669000/discussions/0/3828666283435815182/ ; Wyvern patch notes
  https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-wyvern-update-patch-notes
- [AW2] AoW4 mounts guide (two-handed weapons block the mount slot):
  https://www.gamepressure.com/S013-amp.asp?ID=21933
- [AW3] AoW4 Dev Diary #10 (RPG-like hero inventory):
  https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-10
- [BS1] Warhammer 40,000: Battlesector, request for unit and weapon details at army selection:
  https://steamcommunity.com/app/1295500/discussions/0/3056239973538500315
- [D3a] Diablo III blog, item comparison tooltips (2012): https://us.diablo3.com/blog/20120910
- [D3b] BlizzardWatch, Damage, Toughness, Recovery comparison:
  https://blizzardwatch.com/2015/06/20/surviving-diablo-3/
- [D3c] GameBanshee on the Diablo III anniversary item comparison post: https://www.gamebanshee.com/kxf39
- [D4a] Windows Central, Diablo IV Advanced Tooltip Compare:
  https://windowscentral.com/gaming/the-one-diablo-4-tip-i-wish-i-knew-before-i-started-playing
- [D4b] Den of Geek, Diablo IV default comparison:
  https://www.denofgeek.com/games/diablo-4-best-hidden-setting-compare-gear
- [D4f] Blizzard forums, "D4 items comparison question" (D3's integrated values "misleading"):
  https://us.forums.blizzard.com/en/d4/t/d4-items-comparison-question/23505
- [MTG1] MTG Wiki, Reminder text: https://mtg.wiki/page/Reminder_text
- [MTG2] MTG Rocks, players divided by missing reminder text:
  https://mtgrocks.com/mtg-players-divided-by-missing-reminder-text/
- [BG] Beamdog forums, inventory stat space: https://forums.beamdog.com/discussion/comment/806739
- [DW] Diablo Wiki, Character window: https://diablowiki.net/Character_window
- [WG] Wargroove wiki, Damage Matrix: https://wargroovewiki.com/Unit_Matrix
- [D1], [D7], [S12] Dominions UI complaints, via the companion notes:
  https://steamcommunity.com/app/2511500/discussions/0/3807281445009631725/ (UI/UX, Dominions 6);
  https://steamcommunity.com/app/2511500/discussions/0/4849904427680840957/ (combat logs);
  https://steamcommunity.com/app/722060/discussions/0/1736589520010564593 (unit screen bars)
- Old World updates #16, #73, #129, #132 and the manual's Shift freeze: cited with URLs in
  `../ui-design/research-fourx.md` section 1.

**Computed [C]** (this folder):
- `tools/odds.py` and `tools/odds2.py`: exact FM hit chances and damage distributions from the
  `docs/04` DRN and the `attacks.ts` formulas.
- AoW4 unit, passive, and resistance counts and text lengths: `web-pres/aow4_*.json`.
- AoW4 hero item slot counts: `web-aow4/HeroItems.json`, the same aow4db file
  `Data/EN/HeroItems.json`, fetched earlier into this folder; summarized by `tools/aow4.py`.
- Wesnoth text lengths: `web-pres/wesnoth_*.cfg`.

**Local copies** of every [V] file are in `web-pres/` in this folder. The AoW4 hero items are in
`web-aow4/`, and the Dominions manual chapters are in `../dl-manual/`.

**Fluid Magic** (read only, `3addf97`): `docs/00-vision.md`, `docs/03-nations.md`,
`docs/04-battle.md`, `docs/07-ui.md`, `docs/09-art-direction.md`, `src/content/types.ts`,
`src/content/units/thornwood.ts`, and `src/sim/battle/attacks.ts`. Companion designs:
`research-dom-units.md`, `../ui-design/spec-final.md`, `../battle-design/final.md`, and
`../pretender-design/design-draft.md`.
