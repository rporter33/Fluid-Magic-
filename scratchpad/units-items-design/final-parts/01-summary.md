## 0. The design in eighteen lines

1. **Every unit gains a richer card without a richer rulebook.** The new fields are a size
   class, a role, gear pieces, natural protection, a mount, weapon properties, elemental
   resistance, catalog abilities, and a lore line. Most are content that explains numbers the
   game already has. Five are battle rules: U1, U3, U4, U5 and the item folds.
2. **A size ladder from men to wyrms**: Man-sized 1, Large 2, Great 3, Huge 4, Colossal 5,
   Gargantuan 6. Size does two things: bigger bodies **draw more blows** (U1) and **eat more
   supply** (U2). Trample hits only bodies of size {m} or less, where {m} is the trampling
   weapon's own number (the pretender's N2).
3. **"Bigger targets draw more blows."** Each attack still makes one target draw, now weighted
   by the target's size. A fight in which every unit is size 1 comes out bit-identical, so
   every `docs/04` required test is unchanged (measured).
4. **Horses and wolves are real.** Ash Riders and Wolf Riders become Large (size 2) with a named
   mount (Ash Horse, War Wolf) that owns its natural weapon and its share of materials. Rider
   and mount keep one HP pool in M1; separate mount HP is M2.
5. **Armor is built from pieces.** A registry of 13 gear pieces. Each unit's protection equals
   its natural armor plus its pieces, exactly. Its pieces, weapons and mount add up to no more
   than its materials cost; the rest shows as "fittings". Today's numbers do not move.
6. **"Halberds blunt a charge."** A charge bonus never lands on a troop that holds a reach
   weapon and is not fleeing (U3, FM's own rule, after AoW4's Charge Resistance). Measured: 10
   Ash Riders against 10 Briar Guard go from 55% to 50%.
7. **"Wood burns."** Elemental resistance is one signed number per element, subtracted from the
   damage base (U4). Treants fire −5, Oakhearts fire −3, Salamanders and Fire Sprites fire +10,
   Flamebrands fire +3. With U1, the elite Red against Green fight goes from Thornwood 72.5% to
   55.3%. This moves resistances from M2 into M1; the owner decides (E.7 Q1).
8. **"Regeneration does not stack"** (U5): a unit heals by its single best source.
9. **Left out, with reasons** (A.10): encumbrance and troop fatigue, hit locations, damage
   types, shields against arrows, Giant trample, magic resistance checks, afflictions.
10. **One abilities catalog** (B) serves troops, pretenders, blessings, and items: 42 entries
    (37 with M1 users, 5 reserved for M2), each with its exact rule, a glyph, a one-line text
    of at most 120 characters, its users, and its tests. The pretender's N1 `UnitAbility`
    becomes the catalog's `trigger` kind, with one optional field (`sourceId`) and no change to
    its battle code.
11. **Items are forged, not found.** The `forgeItem` command sends a mage in an own lab to work
    for 10, 15, or 30 days. It needs the item's pips and research level; the mana is paid when
    the work begins. Other orders, death, or a retreat end the work, and the mana is lost,
    exactly as for rituals.
12. **20 M1 items**: 10 Red and 10 Green, in three tiers: Lesser at research level 1, Greater at 2
    to 3, Artifact at 4. They are built only from stat changes, weapons, resistances, catalog
    abilities, and pip boosters. Each one was measured.
13. **Five slots, set by the body**: weapon, head, body, and two charms. A wyrm has a head and
    charms, a beast only charms, an idol one charm. Only commanders wear items.
14. **Items add; a weapon item replaces.** Standard gear stays, and the standard weapon returns
    when the item comes off. An item's HP counts on current and maximum HP alike.
15. **The vault and the lab.** Forged and won items wait in the nation's vault. A commander
    standing in an own lab equips or stores them (`equipItem`, `unequipItem`).
16. **Spoils go to the side that holds the field.** A commander who dies in or because of a
    battle leaves every item to the winning nation's vault. If Independents win, the items are
    destroyed. Destroyed artifacts return to the forge.
17. **Layers** (D): the card carries at most 3 numbers, 3 glyphs, and 1 element mark, and a size
    silhouette when the body is not man-sized. The hover holds the whole truth with one-line
    rules, and Shift shows every source. The Codex compares and filters, and its "Sizes" page
    lines every body up at true scale. The commander's Gear tab is a paper doll with deltas on
    the stat rows. Replays draw every piece of gear and mark resisted and braced blows.
18. **Plan** (E): Phase 7b in three commits, after Phase 7 and the pretender's 6b. The UI comes
    in Phases 8 to 10, the SVG gear and item parts in Phase 11, tuning in Phase 12. **M2**:
    separate mount HP, shields against arrows, magic resistance checks, afflictions and renown,
    generic, White, Blue and Black items, hoards, field swaps, item history, matchup odds.

---

## 1. Decisions

Where the research notes or the sibling designs disagree, or a measurement changed a
recommendation, this table decides. Rows changed since the draft are marked with the ruling
that changed them.

| # | Topic | Options seen | Decision | Why |
|---|---|---|---|---|
| D1 | Where size weights the target draw | melee and ranged (units research R1); ranged only (AoW4's "Large Target", [aow4db Abilities.json](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Abilities.json)) | **Both (U1)** | One sentence covers both. It favors the side that brings the big body, which then tanks for its troops: gods leading troops gain 3 to 10 points, growing with size (A.12, M19) |
| D2 | Supply by size | today 1, or 3 at size 3+ (`SUPPLY.bigUnitSize`); units research: supply = size | **Supply = size (U2)**, commanders included | "A body eats supply equal to its size" is one sentence and replaces a threshold. Undead and constructs still eat nothing. Not on the never-cut list (should-drop S7) |
| D3 | Mounts | one body; mount as data (option A); a separate HP layer (option B); Dom6's separate entities | **A in M1, B in M2** | A makes the card, the Codex, the cost, and the sprite honest at no rule cost. B needs a second roll per blow and an after-battle remount rule |
| D4 | Gear pieces and materials | prot only; prot and def; prot, def, and materials | **Prot is an exact sum; materials an upper bound with "fittings" as the rest (M6); defense skill is derived** | Pieces can be repriced without moving every unit that shares them, and the rest stays visible |
| D5 | Reach | Dom's repel (only a longer weapon repels); AoW4's Charge Resistance on polearms | **Reach cancels the charge bonus (U3)**, FM's own rule (M2) | One check per blow, no draw, a clear counter. Measured: Ash Riders against Briar Guard 55% → 50% |
| D6 | Elemental resistance | M2 (pretender E.2); M1 (units research R3) | **M1 (U4), five unit values** | The two M1 nations are fire and forest. With U1 it brings the elite fight from 72.5% to 55.3% (attribution in A.12). Items need it. **Owner sign-off** (E.7 Q1) |
| D7 | Shields against arrows | M1-should (units research R4b) | **M2** | Measured: the starting matchup moves from Thornwood 60.5% to 64.8%, toward the nation already ahead |
| D8 | Trample on the independent Giant | add it | **No in M1** | Measured: Cinder's start falls from 67.5% to 45.5% against a mountain Giant with 25 Heavy Infantry |
| D9 | Magic resistance | hide; M2 rule | **Hidden in M1** | No M1 rule reads `mr` |
| D10 | One catalog for abilities | inline per chassis; one file | **One `ABILITIES` catalog, `AbilityDef` with a rule union (B.1)** | The card, the hover, and the Codex cannot drift. N1's battle code reads the trigger kind unchanged |
| D11 | How forging is ordered | one generated ritual per item (items research F1); a command of its own | **`forgeItem` and a `forge` order**, sharing the ritual helpers through narrowed shapes (C.2, M11) | Generated rituals would enter the spell registry, the Research panel, the AI's ritual step, and the spell-list tests |
| D12 | Slots | 7; 6; 5 | **5: weapon, head, body, charm, charm** (restated, S1) | With 20 items: weapon 6, head 3, body 4, charm 7. Every slot holds at least 3. Feet and shields would hold 1 or 2, and a shield slot needs a two-handed rule (M2) |
| D13 | Item against standard gear | replace (Dominions, [manual ch. 4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)); add | **Add; a weapon item replaces the melee weapons** | Replacing armor would hand the full value to bodies with natural protection and no pieces (+6 protection on a Titan) |
| D14 | Spoils | Dominions' chance by tier ([illwiki items](https://illwiki.com/dom5/_export/xhtml/items), 30% to 75% by Construction level, verified by J2); HoMM3's winner takes all ([Heroes 3 wiki](https://heroes.thelazy.net/index.php/Combat), search extract) | **The winning nation takes all; Independents destroy (C.8, S2)** | Deterministic, one sentence, and a duel for a famous sword becomes a story |
| D15 | Moving items | free; through the treasury in a lab ([illwiki Laboratory](https://illwiki.com/dom5/laboratory), search extract) | **Only through the vault, in an own lab** | Mana moves the same way (`giveMana`). Field swaps are M2 |
| D16 | Tiers | levels 1, 3, 5; 1-2, 3-4, 5 (draft) | **Lesser 1, Greater 2 to 3, Artifact 4** (M14) | At the measured research pace the draft's tiers put 14 of 24 items beyond an ordinary match |
| D17 | Regeneration from several sources | one regeneration item (draft); adds | **The single best source counts (U5, R3)** | One sentence; measured; keeps the pretender's 20% ceiling |
| D18 | Battle-start summons on army items | Horn of the Wild Hunt | **None in M1** | Staged as a 4-wolf squad, it cut a general's win from 39.5% to 26.3%: fast wolves drag the front into contact early |
| D19 | Morale items | on the wearer; on its squads | **Inspire the led squads (I7)**, and several inspire items add (R2) | A commander's own morale changes nothing: it routs with its last squad without a roll |
| D20 | Trigger items that copy a spell | separate sources (stack); the spell's source | **The spell's source (`sourceId`)**: they never land twice on one squad (M7) | One rule ("an ability never stacks with itself") now also covers its spell |

---
