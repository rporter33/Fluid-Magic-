# Unit depth and magic items: final build spec

Status: final, 2026-10-21. Task #30. This revises `design-draft.md` (beside this file) by the
two judges' lists. The **Rulings** section below records how each judge item was settled.
The rest of the document is the build spec: exact type changes, exact battle rules with
the tests that pin them, the full M1 unit tables, the abilities catalog, the 20 M1 items,
forging and equipping, the AI, the presentation layers, and the phase plan. **Docs text** at
the end gives the exact new or replacement text for the repository docs.

**Owner direction (binding).** "The detail stats from giants to horses like Dominions and with
the items are very immersive, added immersion without completely making it over complicated
makes this game very engaging and replayable." Earlier directions still hold:
- battles are visceral and have sound;
- the UI matches similar games, with complexity layered under smart menus;
- magic is flashy;
- the pretender has Dominions-like options and AoW4-level customization.

**Constraints kept.**
- The sim stays pure and deterministic. This design adds no randomness source. A unit or item
  without a new feature draws nothing new. The one changed draw (U1) still makes one draw per
  attack, and it is bit-identical to today's draw when every candidate is size 1.
- Content is data and passes content validation. No number is written in sim code. Every rule
  names the content constant or field it reads.
- Every command passes `validate` before `apply`. The AI uses the same commands.
- Every rule has its tests, listed with the rule.
- Symbols are safe for color-blind players: shape, word, and number, never hue alone.
- Everything is placed in an M1 phase or deferred to M2 by name (E.2).
- **Readability first.** Every added stat or rule must earn its place, show in layers (card,
  hover, Codex), and fit one sentence. A.1 gives the test, and A.10 lists what failed it.

**What this final is built on.**
- The repository at `/home/user/Fluid-Magic-`, commit `3addf97` (Phases 0 to 6), read only.
  Since the draft I re-read `src/sim/commands/types.ts`, `src/sim/types.ts` (`CommanderState`,
  `CommanderOrder`, `NationState`), `src/sim/pips.ts`, `src/sim/research.ts`,
  `src/sim/rituals.ts` (`ritualBlocker`, `castBlocker`, `ritualPayment`), `src/sim/commanders.ts`
  (`troopSupply`, `commanderSupply`, `commanderMaxHp`), `src/content/spells/{index,types}.ts`,
  `src/content/nations/*.ts`, `src/content/rules.ts` (`SUPPLY`, `RESEARCH_LEVEL_POINTS`,
  `RESEARCH`), `docs/01` to `docs/04`, `docs/07` to `docs/10`, and `docs/PROGRESS.md`.
- The draft's three research notes beside this file: `research-dom-units.md` ("units
  research"), `research-dom-items.md` ("items research"), `research-presentation.md`
  ("presentation research").
- The sibling finals: `../pretender-design/final.md` ("pretender", with the owner's answers in
  `../pretender-design/owner-answers.md`: every default approved), `../ui-design/spec-final.md`
  ("UI spec"), and `../battle-design/final.md` ("battle design").
- The judges' work: `judge-1/` (`monolith.out.md`, `elder.out.md`, `measure-rerun.md`, the
  Dom6 manual chapters in `judge-1/dl/`) and `judge-2/p/` (`stack.out.md`,
  `goddeath.out.md`, `m-rerun.out.md`).

**Numbers were measured, not guessed.** `final-measure/` is a fresh copy of the draft's
`proto/` (the repository's `src/` and `tests/` with the proposed rules behind switches). It adds
one switch, `startMods`, which lands a battle-start stat change on Entangle's or Bark Skin's
target in round 1, before scripts, for the item triggers. With every switch off it is the
repository's resolver. Every fight runs through the real resolver and the real test fixtures,
400 seeds per cell.

| Script | What it measures | Output |
|---|---|---|
| `final-measure/final.ts` | Great Wyrm and Elder Wyrm kits with the timed Ivy Grasp; army items and their stacks; the elite matchup's attribution and knobs; regeneration from several sources on the pretender fixtures | `final-measure/final.out.md` |
| `final-measure/final2.ts` | Titan kits, the size-6 army band, a god leading troops | `final-measure/final2.out.md` |
| `final-measure/chk.ts` | why a god's kit does not move a fight it leads with troops | (printed) |
| `final-measure/tree.ts` | the World Tree's proposed fire weakness against Cinder armies | `final-measure/tree.out.md` |
| `proto/measure.ts`, `proto/measure-items*.ts` (draft) | the unit rules alone and combined; the draft's item kits | `proto/*.out.md` |

Rerun with `cd final-measure && npx tsx final.ts 400` (about 25 seconds), and the same for
`final2.ts`.

---

## Rulings

"J1" and "J2" are the two judges. Items both judges raised are merged. Every item is listed
once, with its ruling and where it lands.

### Where the judges disagree, or a measurement settled it

| # | Topic | J1 | J2 | Ruling | Why |
|---|---|---|---|---|---|
| R1 | The "Sizes: from horses to giants" Codex page | do not cut it first; it is the owner's literal phrase, and cards flatten sizes 4 to 6 | defer it | **Kept in M1** (Phase 11, when the SVG sprites exist), **fourth** on the cut list. The size silhouette also goes on the recruit card | `UI.unitCard.sizeScale` draws every body of size 4 to 6 at the same size on cards, so the line-up is the only place where Huge, Colossal and Gargantuan read at true scale. It renders sprites that Phase 11 makes anyway on one baseline: a page, not a system |
| R2 | Horn of the Burning Host | measure it as specified (a whole-side battle-start buff) | drop the side-wide reach, or make it a stronger inspire | **It becomes inspire 2 on the bearer's own squads.** The `burningHost` trigger leaves the catalog | Measured: the Ash Chieftain's army goes from 39.5% to 49.8% against Thornwood's start with the Horn, and to 52.3% with the Pendant of Fury as well (`final.out.md` section 3). Inspire lands only on squads its bearer leads, so two commanders' horns cannot stack across a side, and the Warcry question disappears |
| R3 | Regeneration from several sources | item regeneration should not add to a body's own | "the highest counts", or a cap; measure it | **U5: regeneration does not stack. A unit heals by its single best source** (body, blessing, or item). `BATTLE.maxRegeneration: 0.2` is a content constant that validation checks against every source | Measured on the Elder Wyrm (10% of its own) with Ring, Amulet and Crown: 59.3% / 75.0% when sources add, 47.8% / 56.8% under U5 (against Cinder's and Thornwood's starts). On the pretender fixtures an Avatar Elder Wyrm with Greater Evergreen drops from 92.8% to 68.5% in the mountain cell and keeps 100% elsewhere. It is one sentence, it keeps the pretender's 20% ceiling (pretender R7), and the Ring stays useful on bodies without regeneration |
| R4 | The hover matchup line, the Codex "matchups against every unit", and `battleOdds` | M2, or the Codex only | Phase 12 or M2 | **M2, all three** | `battleOdds` is a second module that must track every combat rule exactly. The M1 Codex shows the inputs (numbers, chips, resistances), and replays show the outcomes blow by blow |
| R5 | The Living Monolith's size | sim size 6 (amendment 8) | size 6 and exempt it from supply, or draw it small | **Sim size 6, no supply exemption**: it eats 6 a day like the two other idols | Measured by J1: no battle changes (0.5% at both sizes; `judge-1/monolith.out.md`). It is the only body whose sprite and rules disagreed. An immobile body at a capital that yields 100 or more supply a day does not starve on 6, and an exemption would be a rule for one body |
| R6 | Replay teaching lines (braced, resisted, item triggers) | — | defer | **M1-should, first on the cut list** | The battle design's caption system already exists, so these are three content rows. They are first to go if time runs short |
| R7 | AI items stuck in the vault | — | forge only for wearers in a lab, add a routing step, or relax the door | **All three small parts of one rule**: forge only for a wearer standing in a lab now; at most `AI_ITEMS.maxUnworn` (2) unworn AI items in the vault; idle commanders within `AI_ITEMS.detourDays` (5) of a lab detour to it. **The lab door stays** | Relaxing the door would change the player's rule to fix an AI problem. With these three parts the "worn within 60 days" test has teeth: it counts every AI-forged item (C.10) |

### Must-fix items, merged

| # | Item (judge) | Ruling and where it lands |
|---|---|---|
| M1 | The Monolith's size (J1 1, J2 10) | R5. Sim size 6. Amendment 8 for the pretender track (E.6). A.11's pretender table and C.3 updated |
| M2 | The Dominions rationale for U3 is false (J1 2) | **Corrected.** Dominions 6 repels only when "a defender with a longer weapon than its attacker" is struck ([manual ch. 6, source](https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/06-combat.qmd)). In the [dom6inspector weapons](https://github.com/larzm42/dom6inspector/tree/master/gamedata) the Spear, Lance and Halberd are all length 3 (checked in `web/d6_weapons.csv`), so a spear does not repel a lance there. U3 is FM's own rule. Its precedent is AoW4's "Polearm Unit", which has "First Strike, Charge Resistance", where Charge Resistance is "Unaffected by the bonus effects of Charge attacks" ([aow4db Abilities.json](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Abilities.json), checked in `web-final/aow4_Abilities.json`) (A.6) |
| M3 | Where the elite matchup's shift comes from (J1 3) | **Restated with the attribution, in A.12 and E.7 Q1.** Thornwood's elite share is 72.5% today, 69.3% with U1 alone, 65.5% with U4 alone, and 55.3% with both. The interaction is about 7 points: the Oakhearts are size 2, so they draw twice the fire blows. Knob ladder (measured): Oakheart fire −2 gives 58.5, prot 11 gives 59.9, fire −1 gives 63.4, hp 20 gives 66.1, and no weakness gives 69.3. The fire weakness is the knob for the U1 × U4 interaction: on a Large body each point of weakness counts about twice |
| M4 | The AI's equip step can downgrade fighting gods (J1 4) | **Fixed** (C.10). A weapon item is equipped only when its melee damage, `(str + dmg) × strikes`, beats the commander's best standard melee weapon. A pretender counts as a mage only when its chassis role is mage or idol. Priests (units that default to Bless) are not mages. Test: a Thornwood Titan in the capital lab with Thistle Rod, Hunter's Spear and Pyre Staff in the vault keeps its Great Sword |
| M5 | Unequipping a booster that the commander's own forge or ritual needs (J1 5) | **Refused** (C.7, row 10): "Varo needs Crown of Embers to finish Brand of Ash". One validation row and one test per command |
| M6 | The materials validation couples unit costs (J1 6) | **Loosened** (A.5). Pieces, weapons and mount must add up to **no more than** the cost. The remainder shows on the Shift row as "fittings {n}". Protection stays an exact sum. Every M1 unit's remainder is 0 today |
| M7 | Item triggers and same-effect spells stack (J1 7) | **They never stack** (B.1). A trigger that copies a spell's effect names that spell in `sourceId`, so its stat changes carry the spell's source. The spell's own target rule (a squad lacking its effect) then skips the squad, and the trigger skips a squad the spell already holds. Seed of Barkskin uses `barkSkin`, Ivy Grasp uses `entangle`. Tests in C.13 |
| M8 | Unmeasured cells (J1 8; J2 2, 3) | **Measured** (C.5, E.3). The timed Ivy Grasp: the Crown alone takes a Great Wyrm from 12.8% to 24.8% against Cinder's start. The Crown's hp +10 is **dropped**: the full legal Wyrm kit (Ring, Amulet, Crown) is 76.0% / 94.5% without it and 86.8% / 96.8% with it. The Horn: R2. Regeneration with the Ring: R3. Each is pinned as an E.3 band |
| M9 | Do not cut the sizes line-up first; put the silhouette on the recruit card (J1 9) | R1 |
| M10 | Small inconsistencies (J1 10) | **All fixed.** Burning Pearl's +2 attack is about 15 points per blow at equal skills (46.1% to 61.5%), not 8. The recruit card's cost row is exempt from the 3-number budget, by name (D.1). Forest home is off troop cards; it shows in the hover (D.2). `trample` has one placement (`signature`), and B.4 rules that every weapon-derived entry also shows as a chip on its weapon's line. `UnitDef.abilities` is typed `TriggerAbilityId[]` and validated (B.1, B.3). `braces` is computed after the item weapon fold (C.9). The "+2 per pip beyond the third" clause is removed (C.4). The Warden Captain's lore line now explains his skill of 8 (A.11). `meetsRequirement` and `ritualPayment` take narrowed shapes (C.2) |
| M11 | Command shapes do not match the repository (J2 1) | **Fixed** (C.2, C.7). Variants discriminate on `type`; `nation` sits on the `Command` intersection. `meetsRequirement(pips, holy, req: Requirement)` and `ritualPayment(pool, bill: ManaBill, split?)` take narrowed shapes that both `SpellDef` and `ItemDef` satisfy |
| M12 | Army items widen the lead of the nation already ahead (J2 4) | **Seed of Barkskin +3 → +2.** Measured: Thornwood's start goes 60.5% → 71.0% with the Seed, 76.5% with the Seed and the Antler Crown; Cinder's 39.5% → 49.8% with the Horn, 52.3% with the Pendant and the Horn. The text says that the Pendant and the Horn stack on one commander (inspire adds, I7). Both stacks are E.3 bands |
| M13 | Item HP outside battle (J2 5) | **New rule I11** (C.7): "An item's HP counts on both current and maximum HP; taking it off removes both, never below 1." `commanderMaxHp` includes item HP everywhere (healing, starvation, the battle group's `maxHp`). Tests in C.13 |
| M14 | Tier levels do not fit the match length (J2 6) | **Re-placed: Lesser at level 1, Greater at 2 to 3, Artifact at 4** (C.4). With the starting apprentice and priest (10 points a month), level 2 comes at about month 9, level 3 at month 24 and level 4 at month 44. With four researchers from month 1 (20 points a month), at months 4.5, 12 and 22 (`docs/PROGRESS.md` measured day 660 for level 4). The research path is explicit in the Research panel and in the Codex, and 7b.3 sets a measured target for the Phase 7 AI (E.3) |
| M15 | The AI equip step can deadlock (J2 7) | R7 |
| M16 | U3 exactness (J2 8) | **Fixed** (A.6, C.9). `braces` is folded after the item weapon replaces melee weapons, so a Hunter's Spear braces and a replaced spear stops bracing. It is folded for side-level summon stats too. A fleeing troop does not brace |
| M17 | The size sentence is wrong (J2 9) | **Fixed everywhere**: "Trample hits only bodies of size {m} or less." Size itself never protects a body from trample; the weapon's `maxTargetSize` does |
| M18 | The catalog shape and the mocks disagree (J2 11) | M10: forest home off troop cards; trample has one placement plus the weapon-line rule |
| M19 | U1's effect on big bodies is understated (J2 12) | **Corrected** (A.12). Gods leading troops gain 3 to 10 points, growing with size: the Titan (size 4) with 20 Cinder Warriors +3.3 and +5.3; the Great Wyrm (size 6) with 20 Wardens +10.0 (30.5% → 40.5%). God deaths stay at 0 to 4%. A size-6 army band is added (E.3) |
| M20 | Citations (J2 13) | **Fixed.** Wesnoth's "(inactive)" marker is cited from [reports.cpp](https://raw.githubusercontent.com/wesnoth/wesnoth/master/src/reports.cpp) (lines 444, 1050 and 1090, checked). Separate mount stats are cited from [illwiki, Dom6 mounted](https://illwiki.com/dom5/dom6/mounted) (search extract; the page itself refused this session's connection, and J2 verified it). The Total War claim is dropped. J2's other verifications stand |

### Should-drop items

| # | Item | J1 | J2 | Ruling |
|---|---|---|---|---|
| S1 | The 4 generic items and I8 (leadership and sight items) | defer | defer | **Accepted, M2.** This removes the any-color requirement and research rule, generic-only payment, the leadership refusal on swaps, and the vision change. The slot rule D12 is restated: 20 items, and every slot holds at least 3 |
| S2 | Province hoards | defer | defer | **Accepted, M2.** When Independents win, a fallen commander's items are destroyed, and destroyed artifacts return to the forge. No `ProvinceState.hoard`, no capture hook, no hoard fog rules |
| S3 | The Ledger's world list of artifacts, the artifact star on army badges, open question 8 | defer, drop Q8 | defer | **Accepted.** The Ledger shows the nation's own vault, worn items and forge work (inside its Magic tab, so no sixth tab). Enemy gear shows in battle reports and replays, from the roster's items |
| S4 | The Codex's typed query syntax (`prot >= 7`) | drop | — | **Accepted.** Filter chips stay |
| S5 | The per-unit matchup line and `battleOdds` | M2 or the Codex only | Phase 12 or M2 | R4: M2 |
| S6 | The sizes line-up page and the replay teaching lines | — | defer | R1 (kept, cut line 4) and R6 (M1-should, cut line 1) |
| S7 | U2 on the "never cut" list | — | take it off | **Accepted.** U2 is a consistency rule at today's supply. It rides along in 7b.1 and can be cut |
| S8 | The Horn's side-wide reach | — | drop it, or a stronger own inspire | R2 |

---
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
## A. Unit detail

### A.1 The test every stat passed

A stat or rule enters M1 only when it passes all six checks. They extend the units research
section 12 and the UI spec's rules 2, 3, and 6.

1. **It changes a decision**: what to recruit, whom to bring, where to fight, what to forge.
2. **It fits one sentence** of at most 120 characters (`UI.unitCard.oneLineMax`).
3. **It is visible** on the sprite, on the card, or in the replay's per-blow detail.
4. **It costs no extra draw**: at most the same draws per blow as today, and none for a unit
   without it.
5. **The AI can read it** with the numbers it already uses (`docs/08`).
6. **A stat with no rule is not shown.** Magic resistance stays hidden until a rule reads it.

### A.2 The extended stat model at a glance

Kept as they are: `hp`, `str`, `att`, `def`, `prot`, `mor`, `prec`, `mapSpeed`, the costs, and
the commander traits. Skills stay numbers, because one point matters: att 11 against def 10
hits 53.9% of the time, and 10 against 10 hits 46.1% (presentation research 2.4).

| Field | New? | What it is | Rule it carries | Player sentence | Cost |
|---|---|---|---|---|---|
| `size` 1 to 6 | existing, now named and with rules | body class from man to wyrm | U1 blows, U2 supply | "Bigger targets draw more blows and eat more." | 1 changed draw (same count), 1 supply formula |
| `role` | new, content | one word: Heavy infantry, Cavalry, ... | none | (the word) | content |
| `description` | new, content | a lore line that explains odd stats | none | "Halberdiers in grown thornplate, the wall the forest raises; it is heavy to fight in." | content |
| `gear` | new, content | the unit's armor pieces, from a registry | none: they sum into `prot` and explain `def` and materials | "Prot 9 = thornplate 7 + iron cap 2." | a registry and a validation |
| `naturalProt` | new, content | hide, bark, scale: armor that is the body | none | "Natural armor 3: its oak body." | content |
| `mount` | new, content | a named mount with its look, natural weapons, and materials | none in M1 | "Rides a War Wolf, which bites as the rider strikes." | content |
| `WeaponDef.reach` | new | a braced polearm | U3 | "Reach: a charging foe gains no charge bonus against it." | 1 check per blow, no draw |
| `WeaponDef.firstRoundBonus` | existing, now named **Charge** | the lance's first-round damage | today's rule, cancelled by U3 | "Charge +3: +3 damage in its first melee round, unless the foe holds a reach weapon." | — |
| `WeaponDef.strikes`, `maxTargetSize` | from the pretender's N2 | attacks per weapon; trample | N2 | "Strikes 2." / "Trample: 2 extra blows each round at foes of size 2 or less." | (pretender track) |
| `WeaponDef.materials` | new, content | what the weapon costs to make | validation only | (cost breakdown) | content |
| `resist` | new | one signed number per element | U4 | "Fire −5: fire hits deal 5 more." | 1 subtraction per damage roll |
| `regeneration` | existing | share of max HP healed per round | U5: the single best source counts | "Regenerates 5% of its HP at the end of every round." | a `max` instead of a sum |
| `abilities` | from the pretender's N1, typed | trigger ids only | B | (the catalog's line) | (shared) |

`mr` stays in content and the sim. It is shown nowhere until M2 gives it a rule (A.10).

### A.3 Size: the ladder from men to wyrms

FM's size 1 is a human. In Dominions 6 a human is size 3, a horse 5, a giant 6, and a war
elephant 9, and a square holds "ten size points of units (so three human-sized units of size 3)"
([Dom6 manual ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html)). The
median HP of Dom6 records roughly doubles every two sizes (units research 2.1, computed over the
[dom6inspector data](https://github.com/larzm42/dom6inspector/tree/master/gamedata)). FM's
existing HP already follows that curve.

| Size | Name | Silhouette glyph | Draws blows (U1) | Supply a day (U2) | Sprites per squad (battle design S2.5) | M1 bodies |
|---|---|---|---|---|---|---|
| 1 | **Man-sized** | standing man | ×1 | 1 | 20 | every human troop and commander; Wolf, Fire Sprite, Hornet Swarm |
| 2 | **Large** | horse | ×2 | 2 | 12 | **Ash Rider, Wolf Rider** (new), Oakheart; Oracle, Wild Spirit, Ascended Hero, Ember Hierophant |
| 3 | **Great** | bear | ×3 | 3 | 6 | Salamander; Ash Phoenix |
| 4 | **Huge** | giant | ×4 | 4 | 4 | Giant, Treant; Titan, Pyre Lord, Horned Hunter, Mother of Beasts |
| 5 | **Colossal** | colossus | ×5 | 5 | 2 | Ash Colossus |
| 6 | **Gargantuan** | wyrm | ×6 | 6 | 1 | Great Wyrm; **Living Monolith** (was 1, R5), Primordial, Elder Wyrm, World Tree, Cinder Idol |

The names live in content (`SIZE_CLASSES` in `src/content/sizes.ts`), and the owner may rename
them (E.7 Q3). The UI always shows the number beside the word: "Huge (size 4)".

**What size does not do**, and why:
- **It does not shield a body from trample.** Trample hits only bodies of size {m} or less,
  where {m} is the trampling weapon's `maxTargetSize` (N2). A size-6 Primordial cannot trample
  a size-3 Salamander, because its Trample reads 2, not because the Salamander is big.
- **No frontage cap.** `docs/03` says size 3+ "occupies more formation space", but no rule ever
  did it. A cap needs a rule about who waits, so the claim is dropped from `docs/03`.
- **No item limits.** Items fit any size (C.3). Dominions lets a size-9 Moloch use every slot
  (items research 1.3).
- **Leadership still counts troops, whatever their size** (`docs/01` decision, unchanged).

#### U1. Bigger targets draw more blows

**Sentence:** "Bigger targets draw more blows: a Huge giant in the line takes four times a man's
share."

**Rule.** In `rangedPhase` and `meleePhase`, each attack draws its target from its candidates
with weight equal to the target's combat size. The candidates are today's `targets`
(`targetsUpTo`), filtered first by N2's `maxTargetSize` for a trampling weapon. Spells are
unchanged: area damage still picks troops uniformly, and single-target spells still pick the
largest group.

```ts
// src/sim/battle/attacks.ts
/** One attack's target, weighted by size: one draw, as before (docs/04 decision "Size draws blows"). */
export function drawTarget(rng: RngState, candidates: readonly Fighter[], totalSize: number): Fighter | undefined {
  if (totalSize <= 0) return undefined;            // no candidate: no draw (randBelow refuses 0)
  let r = randBelow(rng, totalSize);
  for (const t of candidates) {
    r -= t.group.base.size;
    if (r < 0) return t;
  }
  return undefined; // unreachable: totalSize is the sum over candidates
}
// rangedPhase and meleePhase: `targets[randBelow(rng, targets.length)]` becomes
// `drawTarget(rng, pool, poolSize)`, where pool is `targets` (or N2's filtered list) and
// poolSize = Σ t.group.base.size, summed once per side per phase, and once per weapon list N2 filters.
```

- **Equivalence.** When every candidate has size 1, `r` is the index, so the draw equals today's
  `targets[randBelow(rng, n)]` exactly. No battle in which every unit is size 1 changes in any
  bit. That covers all four `docs/04` required balance tests.
- **Draws.** Still exactly one `randBelow` per attack. `randBelow` rejects rare high values,
  so its bound may change how many raw numbers that one call consumes; determinism is
  unaffected, and size-1 fights are untouched.
- **`CombatStats.size`** comes from the pretender's N2 (`statsFor` copies `UnitDef.size`). If
  Phase 7b lands before 6b.2, 7b.1 adds it.

**Why melee and ranged both.** One sentence covers both. Dominions weights missiles by size (a
giant sharing a square with a man "is struck two times out of three", [Dom6 manual
ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html)), and its melee
attackers gang up on big units (units research 2.2). AoW4's "Large Target" is "20% easier to
hit with Missile and Magic attacks" ([aow4db
Abilities.json](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Abilities.json),
verified by J2). The measured effect is a tanking role, not a weakness: a big body with high
protection soaks the blows its troops would have taken (A.12).

**Tests** (`tests/sim/battle/attacks.test.ts`):
1. Equivalence: 200 random all-size-1 setups give the same log through `drawTarget` as
   through today's uniform draw, kept as a reference function in the test. The battle
   design's `golden.json` fixtures with no unit above size 1, no charge against reach, and no
   resistance in play stay byte-equal.
2. Share: one Giant among 20 Ash Militia, 4,000 single-swing draws through `drawTarget`. The
   Giant is drawn 4/24 of the time, within 1.5 points.
3. One draw: each attack makes exactly one `randBelow` call for its target (counted with a spy).
4. With trample (N2): the filter runs first, then the weighted draw. A size-4 body is never
   drawn by a `maxTargetSize: 2` weapon, and an empty filtered list makes no draw.
5. Determinism with mixed sizes: one setup and one rng state give one log.

#### U2. A body eats supply equal to its size

**Sentence:** "A body eats supply equal to its size; undead and constructs eat nothing."

**Rule.** `troopSupply(def) = def.size × SUPPLY.perSize`, or 0 for undead and constructs. A
commander eats its own `troopSupply` (the garrison holder 0), plus its troops'. Independents
still never eat (`docs/01` decision). This replaces `SUPPLY.troopSupply`, `bigUnitSize`,
`bigUnitSupply`, and `commanderSupply` with `SUPPLY.perSize: 1`.

**Changes from today:** Ash Rider and Wolf Rider 1 → 2; Oakheart 1 → 2; the Salamander as a
commander 1 → 3 and the Treant 1 → 4; pretenders by size: Oracle 2, Titan 4, Great Wyrm 6,
Living Monolith 6, Wild Spirit 2, Ash Colossus 5, and the new bodies by their sizes.

At today's supply (`pop / 50`; a Hills province gives 100 to 160 a day) none of these starves
an army. They start to matter when Phase 12 retunes supply, as `docs/09` already plans. U2 is
a consistency rule and can be cut (should-drop S7).

**Tests** (`tests/sim/commanders.test.ts`): supply 1 to 6 by size; 0 for constructs and
undead; a commander by its own size; the garrison holder 0; the Living Monolith 6. The
existing starvation fixtures (size-1 armies) are unchanged.

### A.4 Mounts: horses and wolves with names

Dominions 6 splits riders from mounts: "Mounted units are treated as different entities from
their Mounts. The mount may be hit instead of the rider" ([illwiki, Dom6
mounted](https://illwiki.com/dom5/dom6/mounted), search extract; verified by J2). A Knight (hp 11) rides a Destrier (hp 22) with its own hoof attack (units research 3.1,
verified by J2). Dominions 5 had one body.

**M1 (option A): a mount is data.**

```ts
// src/content/types.ts
export interface MountDef {
  name: string;                     // 'Ash Horse', 'War Wolf'
  look: 'horse' | 'wolf';           // the battle rig's mount (battle design UnitLook.mount)
  /** Natural weapons the mount strikes with; appended to the rider's in battle. */
  weapons: readonly WeaponDef[];
  /** Its share of the unit's materials (A.5). */
  materials: number;
}
// UnitDef.mount?: MountDef — validated: present exactly when the unit is tagged mounted, and then size >= 2
```

- `statsFor` builds `CombatStats.weapons` as the rider's weapons followed by the mount's. The
  Wolf Rider's Wolf Bite moves from `weapons` into `mount.weapons`. The order stays Spear, then
  Wolf Bite, so the draws are unchanged.
- **Size 2** for both riders: rider and mount are one Large body. They already cost 20
  population, two bodies' worth (`docs/03`).
- **The Ash Horse has no weapon.** "Ash horses are bred to carry, not to fight." A hoof attack
  would add a free attack to a unit that already wins 81% against Wardens.
- **M2 (option B):** each mounted troop gets `mount.hp` on top of its own. A blow strikes the
  mount on a coin flip (one more draw, only for mounted targets), and trample always strikes
  the mount. An unhorsed troop fights on foot at speed 2, without its charge or the mount's
  weapon, and remounts after the battle for the mount's materials. The sentence: "A blow
  strikes the rider or the mount; unhorsed riders fight on foot."

**Tests:** content validation (mounted ⇔ `mount`, size ≥ 2); the Wolf Rider's battle weapons
are [Spear, Wolf Bite] in that order; a golden fight with Wolf Riders differs from today only by
U1's weighting.

### A.5 Gear: armor built from pieces

Dominions builds armor from pieces (body armor, helmet, shield, barding) and explains defense
as a sum of gear: "base defense 10, +1 from the sword, −2 from the armor, −1 from the shield"
([Dom6 manual ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html)).
Players see a gear list, and the zone values sit "when you click on Protection" ([ch.
4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)). Battle Brothers draws each
piece on a layered sprite, and split helmets that "looked different but gave the same
protection" into items with their own values ([Dev Blog
#34](https://battlebrothersgame.com/dev-blog-34-new-armor-helmet-rework-banners/), search
extract).

**FM keeps one `prot` number in the sim and composes it from pieces in content.** No new rule.

```ts
// src/content/gear.ts
export type GearSlot = 'head' | 'body' | 'shield';
export interface GearDef {
  id: string;
  name: string;
  slot: GearSlot;
  prot: number;
  /** Added to the wearer's skill: a shield's parry is positive, the heaviest armor negative. */
  def: number;
  materials: number;
  description: string;
  /** Presentation only (battle design PartId and Material); the sim never reads it. */
  look: { part: 'helm' | 'torso' | 'shield'; material: Material };
}
export const GEAR = { /* the 13 pieces below */ } as const satisfies Record<string, GearDef>;
export type GearId = keyof typeof GEAR;
// UnitDef gains:  gear: readonly GearId[];  naturalProt: number;
// WeaponDef gains: materials?: number   (required on every weapon of a recruitable unit)
```

**Validation** (`tests/content/gear.test.ts`):
- `unit.prot === unit.naturalProt + Σ gear.prot`, for every unit (exact);
- at most one piece per slot;
- for every recruitable unit, `Σ gear.materials + Σ weapon.materials + (mount?.materials ?? 0)
  <= cost.materials`. The remainder is the unit's **fittings** (`fittingsOf(def)`, derived,
  never stored), shown on the cost's Shift row when above 0: "28 = thornplate 18 + halberd 6
  + iron cap 2 + fittings 2". Every M1 unit's fittings are 0 today;
- every piece is worn by some unit;
- every piece has a look.

Phase 12 can reprice a unit without repricing the pieces it shares; it can reprice a piece
only where every wearer's cost still covers it. Protection is tuned by swapping pieces.

The defense skill is derived, never stored: `skill = def − Σ gear.def`. The hover shows "Def 11
= skill 9 + round shield 2". A stored skill field would be a number with no rule.

**The 13 M1 pieces.** Nation variants of one piece share numbers on purpose; the nation's armor
layer (`docs/09`) draws them differently.

| Piece | Slot | Prot | Def | Materials | Worn by | Material (look and sound) |
|---|---|---|---|---|---|---|
| Leather Cap | head | 1 | 0 | 1 | Ash Militia, Cinder Warrior, Ember Skirmisher, Flame Archer, Thorn Militia, Longbow Hunter, Light Infantry, both Scouts | soft |
| Iron Cap | head | 2 | 0 | 2 | Ash Rider, Flamebrand, Warden, Briar Guard, Wolf Rider, Heavy Infantry | mail |
| Antlered Helm | head | 3 | 0 | 4 | Warden Captain | bark |
| Quilted Robe | body | 1 | 0 | 1 | Ember Adept, Sapling Druid | soft |
| Leather Jerkin | body | 1 | 0 | 1 | Flame Archer, Thorn Militia, Longbow Hunter, Wolf Rider, Light Infantry | soft |
| Wolf Pelt | body | 2 | 0 | 2 | Berserker | hide |
| Ritual Vestments | body | 2 | 0 | 3 | Pyre Priest, Cinder Magus, Grove Priest, Elder Druid | soft |
| Scale Shirt | body | 2 | 0 | 3 | Cinder Warrior, Ash Rider | scale |
| Scale Hauberk | body | 4 | 0 | 6 | Flamebrand, Ash Chieftain | scale |
| Bark Mail | body | 4 | 0 | 6 | Warden, Warden Captain | bark |
| Mail Hauberk | body | 5 | 0 | 10 | Heavy Infantry | mail |
| Thornplate | body | 7 | −1 | 18 | Briar Guard, Oakheart | bark |
| Round Shield | shield | 0 | +2 | 3 | Warden, Warden Captain, Independent Captain | wood |

Prices rise faster than protection (Scale Shirt 2 for 3, Thornplate 7 for 18), because measured
protection is worth more the higher it already is (items research 7.2). Dominions prices
equipment the same way: ring mail costs 5 resources, full chain 17 (units research 4.1,
verified by J2 against [dom6inspector armors](https://github.com/larzm42/dom6inspector/tree/master/gamedata)).

**Weapon materials** (recruitable units only): Dagger 1, Knife 1, Staff 1, Spear 2, Javelins 2,
Sword 3, Lance 3, Axe 4, Oak Maul 4, Fire Arrows 4, Longbow 6, Halberd 6, Burning Blade 6,
Great Axe 8. **Mounts:** Ash Horse 7, War Wolf 7.

**What the player reads:** "Briar Guard: 26 materials = thornplate 18 + halberd 6 + iron cap 2."
That explains the most expensive Thornwood troop in one line.

### A.6 Weapons: reach, charge, strikes, and what stays out

Dominions weapons have damage, attack and defense modifiers, length, attacks, ammunition, and
flags (two-handed, slash, pierce, blunt, AP, AN, charge, bonus, element). Over the 554 weapons
Dom6 units carry, 13% are armor piercing, 11% armor negating, 36% natural "bonus" weapons, and
2% charge (units research 5.1, computed from the [dom6inspector
weapons](https://github.com/larzm42/dom6inspector/tree/master/gamedata)).

FM's weapon line after this design. Every property is a catalog entry (B) and a chip on the
weapon's line:

| Property | Field | Rule | Sentence | M1 users |
|---|---|---|---|---|
| Damage | `dmg` | str + dmg in melee; dmg alone for shots (`docs/04` decision) | "Damage = strength + weapon in melee; weapon alone for shots." | all |
| Range, ammunition | `range`, `ammo` | range 5+ reaches the rear (`BATTLE.rearReach`) | "Shoots from the middle row; reaches all three." | archers, skirmishers, Salamander, Great Wyrm |
| Element | `element` | U4 resistances read it | "Fire: fire resistance and weakness apply." | Fire Arrows, Burning Blade, Flame Touch, Fire Breath, Burning Fists; Red items |
| Armor piercing | `armorPiercing` | `floor(prot × BATTLE.armorPiercingFactor)` | "Armor piercing: halves the target's protection." | Flame Touch, Burning Talons; Hunter's Spear, The Unquenched |
| Armor negating | `armorNegating` | prot ignored | "Armor negating: ignores protection entirely." | Sting |
| **Charge** | `firstRoundBonus` | + bonus in the group's first melee round, unless the target braces (U3) | "Charge +3: +3 damage in its first melee round, unless the foe holds a reach weapon." | Lance; Blazing Charge blessing |
| **Reach** | `reach` (new) | U3 | "Reach: a charging foe gains no charge bonus against it." | every Spear, Halberd, Hunting Spear; Hunter's Spear |
| Strikes | `strikes` (N2) | that many swings | "Strikes 2: swings twice each round with this weapon." | Brand of Ash, The Unquenched |
| Trample | `strikes` + `maxTargetSize` (N2) | swings only at small enough foes | "Trample: {n} extra blows each round; it hits only bodies of size {m} or less." | Primordial, Elder Wyrm |

#### U3. Reach blunts a charge

**Sentence:** "Halberds blunt a charge: a charge bonus never lands on a troop that holds a reach
weapon and is not fleeing."

**Rule.** `CombatStats.braces` is true when any melee weapon of the final weapon list (after
the item weapon fold, C.9 step 3) has `reach: true`. `statsFor` folds it for squads,
commanders, and the side-level stats of summons. In `meleePhase` a blow's `firstRoundBonus`
counts only when the target does not brace:

```ts
// src/sim/battle/attacks.ts, meleePhase
const braced = target.group.base.braces && target.group.routingSince === null;
const bonus = g.firstMelee === round && !braced ? (w.firstRoundBonus ?? 0) : 0;
```

- It applies to every first-round bonus, the Blazing Charge blessing's included.
- A fleeing troop (its group routing) does not brace: it has turned its back.
- It adds no draw. The detail `strike` event gains `braced: boolean`, true when a bonus was
  cancelled, so the replay can show it.

**Where it comes from.** It is FM's own rule. Dominions' repel is not the source: there, only
"a defender with a longer weapon than its attacker" repels, by a morale roll per blow
([Dom6 manual ch. 6](https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/06-combat.qmd)),
and the Spear, the Lance and the Halberd are all length 3 in the [dom6inspector
weapons](https://github.com/larzm42/dom6inspector/tree/master/gamedata), so a spear does not
repel a lance. The precedent is AoW4's "Polearm Unit", which has "First Strike, Charge
Resistance"; Charge Resistance is "Unaffected by the bonus effects of Charge attacks", and a
Shock Unit's charge "can be countered by Polearm Units" ([aow4db
Abilities.json](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Abilities.json)).
FM takes only the charge resistance: no first strike and no damage bonus against cavalry. Red's
own Ash Militia carry spears, so the rule holds in mirror matches too. Thornwood has no charge in
M1 (Wolf Riders do not charge), so in Red against Green it is Thornwood's answer to Ash Riders
and to the Blazing Charge blessing.

**Measured** (A.12): 10 Ash Riders against 10 Briar Guard go from 55.0% to 47.8% alone, and to
50.3% with the full rule set. Against 15 Thorn Militia, 80.0% becomes 78.8%. Against Wardens
(swords) nothing changes.

**Tests** (`tests/sim/battle/attacks.test.ts`, `setup.test.ts`):
1. A lance against a spearman rolls `damage.base` without the bonus and logs `braced: true`;
   against a swordsman it keeps the bonus.
2. Rounds after the first never add it.
3. A Blazing Charge squad is braced against too.
4. A routing spearman takes the bonus.
5. A commander whose Hunter's Spear replaced its Sword braces; a commander whose item weapon
   replaced its spear does not (`statsFor` with items).
6. Summoned stats in `side.summons` carry `braces`.
7. The rng state after the phase is unchanged by the check.

### A.7 Resistance: wood burns, embers do not

Dominions resistance "subtracts like protection, then cuts the remainder by twice the
resistance as a percent", and negative values encode weakness: the Troll is fire −10 (units
research 6.1, verified by J2). In Dom6 data, 16% of records resist fire, 23% cold, and 25%
poison (units research 6.1, computed). AoW4 shows coarse tiers only where they apply
(presentation research 1.2).

#### U4. Elemental resistance

**Sentence:** "Fire resistance 5: fire hits deal 5 less. Fire −5: they deal 5 more."

```ts
// src/content/types.ts
export type DamageElement = Exclude<Element, 'physical'>;           // fire, nature, cold, holy, decay
// UnitDef.resist?: Partial<Record<DamageElement, number>>          — integers, −10 to 20 (validation)
// CombatStats.resist: Readonly<Partial<Record<DamageElement, number>>> — unit + items (C.9)
// src/sim/battle/attacks.ts (the battle design's rollDamageParts gains one argument):
//   rolled = max(0, base − resist + attackDrn − armor − armorDrn)
```

- **Weapons**, melee and ranged: `resist` is the target's value for the weapon's element; a
  physical weapon reads 0.
- **Spells:** the target's value for the effect's element.
- **Retaliation shields** (N4): each wounding blow owes the striker `max(0, amount −
  striker.resist[element])`.
- **Remote damage** (Ash Rain): each troop takes `max(0, Σ dice − resist[element])`. The draws
  are unchanged.
- **No percentage step.** Dominions' two-step formula does not fit one sentence.
- **Not immunity.** A fire +10 Fire Sprite (prot 0) struck by a 6-damage fire arrow is still
  wounded 21% of the time, because both DRNs are open-ended; a Salamander, with prot 8, 3%. The
  Codex entry says so.
- **Weakness is felt.** A fire arrow wounds a Treant 38% of the time instead of 13%, and an
  Oakheart 38% instead of 21% (`calc/wound.py`, exact over the DRN distribution).
- The detail `DamageRoll` gains `resist: number` (battle design S1.3), so the replay can show
  "+3 (fire weakness)".

**M1 values** (content):

| Unit | Resist | Why |
|---|---|---|
| Treant | fire −5 | dry wood; its regeneration already makes it hard to kill |
| Oakheart | fire −3 | a walking oak (wood material and sap blood in the battle design); −3, not −5, because it is a troop |
| Salamander | fire +10 | it bathes in the flame it breathes |
| Fire Sprite | fire +10 | living flame |
| Flamebrand | fire +3 | temple champions of the fire god; it matters in mirror matches |
| Pretender bodies (proposed to the pretender track) | Ash Colossus, Ash Phoenix, Cinder Idol fire +10; **World Tree none in M1** | the three Red bodies only meet fire in mirror matches. The World Tree is left without a value: measured alone at its capital, Cinder's elite army wins 1.5% against it with no value, 32.0% at −2, 59.8% at −3 and 96.5% at −5 (`final-measure/tree.out.md`). A weakness would need the pretender track to reprice it; Phase 12 may try −2 |

No human of either nation gets a value. Armor is not the body.

**Why M1 and not M2.** The pretender final defers resistances as "rules only W, U and B chassis
use" (pretender E.2). In Red against Green they matter at once: Red deals fire with 5 weapons
and 3 spells, and Thornwood's sacred troop and its summoned commander are trees. With U1, the
elite armies go from 72.5% Thornwood to 55.3% (A.12). Items need it too: Moss Mantle (fire
resistance 5) is Green's answer to fire.

**AI.** `armyPower` (`docs/08`) does not read resistances. The AI never picks spell targets (the
resolver does), so the only gap is that strength estimates miss the matchup. That is recorded
as a known limitation, not a rule.

**Tests** (`tests/sim/battle/attacks.test.ts`, `effects.test.ts`, `tests/sim/ritualEffects.test.ts`):
1. The detail `damage.base` and `resist` for a fire arrow on a Treant (base 6, resist −5).
2. A negative value adds and a positive one subtracts.
3. A physical weapon ignores it.
4. Spell damage reads the effect's element.
5. A fire shield burns a fire +10 striker for `max(0, 5 − 10) = 0`.
6. Ash Rain's per-troop damage is reduced and draws the same dice.
7. Validation refuses `physical` and values out of range.

### A.8 Regeneration from several sources

#### U5. Regeneration does not stack

**Sentence:** "Regeneration does not stack: a unit heals by its single best source."

**Rule.** `statsFor` sets `CombatStats.regeneration` to the largest of the body's own
(`UnitDef.regeneration`), the blessing's (pretender A.6, through the bless or the Avatar boon),
and each worn item's. Nothing else changes: the end-of-round heal is today's.

```ts
// src/sim/battle/setup.ts statsFor
regeneration: Math.max(def.regeneration ?? 0, bless.regeneration ?? 0, ...items.map((i) => i.effects.regeneration ?? 0)),
// src/content/rules.ts
BATTLE.maxRegeneration: 0.2   // content validation: no unit, blessing, or item source above it
```

- **Why.** Measured (R3): an Elder Wyrm (10% of its own) wearing Ring of Regrowth, Barkskin
  Amulet and the Crown of the Ivy King wins 59.3% / 75.0% alone against Cinder's and
  Thornwood's starts when sources add, and 47.8% / 56.8% under U5. On the pretender fixtures,
  an Avatar Elder Wyrm with Greater Evergreen falls from 92.8% to 68.5% in the mountain cell
  under U5 and keeps 100% in the others (`final-measure/final.out.md` section 5).
- **Who it touches.** Only bodies with regeneration of their own: the Treant, the Wild Spirit,
  the World Tree and the Elder Wyrm, when a Green regeneration blessing reaches them through
  Avatar or an item is worn. Sacred troops have no regeneration of their own, so the bless
  lands on them in full.
- **Shown, not hidden.** A source that does not count is greyed in the hover with
  "(inactive: its own regeneration is as high)" (B.4), in the paper doll's delta row
  ("Regeneration 10% → 10%"), and in the designer's Blessings step for an Avatar body.

**Tests** (`tests/sim/battle/setup.test.ts`): a Treant (5%) with Ring of Regrowth (5%) keeps
5%; an Elder Wyrm (10%) with the Ring keeps 10%; a Great Wyrm (0%) with the Ring has 5%; an
Avatar Wild Spirit (10%) with Evergreen (10%) has 10%; content validation refuses a source above
`BATTLE.maxRegeneration`.

### A.9 Role and lore line

- **`role`**, one word per unit, from content: Light infantry, Heavy infantry, Shock infantry,
  Skirmisher, Archer, Cavalry, Sacred warrior, Scout, General, Priest, Mage, Beast, Summon,
  Monster, God. It titles the hover and filters the Codex. AoW4 bundles rules into role tags
  such as "Polearm Unit" and "Shield Unit"; FM's role is a word only, and its rules stay on the
  abilities.
- **`description`**, a lore line whose first sentence (at most 120 characters) explains the
  unit's oddest number. Dominions' descriptions do this: Huskarls "can rarely afford heavy
  armor" (units research 0, from [dom6inspector
  unitdescr](https://github.com/larzm42/dom6inspector/tree/master/gamedata/unitdescr)). A content
  test requires it on every unit.

### A.10 What is left out, and why

| Candidate | Where it is from | Why not in M1 | Where it goes |
|---|---|---|---|
| Encumbrance and troop fatigue | Dom: fatigue per attack lowers att and def ([ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html)) | A hidden penalty that grows each round, with no decision attached. Heavy armor already costs map speed and materials | never for troops; caster fatigue stays |
| Hit locations, limb damage caps | Dom: torso 50%, arms 20%, legs 20%, head 10% | A click deep even in Dominions. The replay already sends "a head with its helmet" flying on brutal kills (battle design S4.4) | presentation only |
| Slash, pierce, blunt | Dom damage types | Invisible on the card. The replay gives each weapon its motion and sound family (battle design S2.2) | presentation only |
| Shields against arrows | Dom missile defense uses parry ×2 | Measured: −38% Flame Archer kills on Wardens, and the start moves from Thornwood 60.5% to 64.8% | **M2**, with White's shield troops; Phase 12 may revisit |
| Giant trample | units research section 7 | Measured: a mountain Giant with trample drops Cinder's start from 67.5% to 45.5% | Phase 12 option, or M2 elephants |
| Separate mount HP, unhorsing | Dom6 | A second roll per blow and an after-battle rule | **M2** (A.4) |
| Magic resistance checks | Dom penetration against MR ([ch. 7](https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html)) | No M1 spell has a resist check | **M2**; MR hidden until then |
| Mindless dissolving without a leader | Dom6 | A rout rule for two summons that already have morale 50 | **M2** with the Black nation |
| Afflictions | Dom: per blow, by location; players say healing is "very very rare" ([Steam](https://steamcommunity.com/app/2511500/discussions/0/4203616776861027901), search extract) | No per-troop identity; the tedium is documented | **M2**, commanders only |
| Experience and renown | Dom stars and Hall of Fame ([ch. 4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)) | New state, rank rules, merge rules | **M2** |
| Terrain walkers beyond swamp | Dom forest and mountain survival | Changes leg days and battle terrain rules | **M2** |
| Awe, ethereal | Dom | Need the W and B nations | **M2** |
| Matchup odds (`battleOdds`) | Wesnoth's "damage versus" | A second module that must track every combat rule (R4) | **M2** |

### A.11 The M1 units, updated

Every unit keeps every number it has today, except the riders' size (1 → 2) and the Living
Monolith's (1 → 6). "Def" shows skill + gear. "Mat." checks the materials sum against the cost
(✓ means fittings 0). "Sup." is the daily supply under U2. Weapons list their properties.
Thornwood's forest home (+1 def in forests, either side) applies to every unit fighting for
Thornwood, summons included; it is a nation property shown in the hover, not on the card.

#### Cinder Horde troops (recruit at fort)

| Unit | Size | Role | hp | str | att | def | prot (gear) | mor | spd | Weapons | Mount | Resist | Abilities | Cost g/m/pop | Mat. | Sup. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ash Militia | 1 Man-sized | Light infantry | 10 | 10 | 9 | 8 | 1 (Leather Cap 1) | 9 | 2 | Spear 3 (reach) | — | — | — | 8/3/10 | 2 + 1 = 3 ✓ | 1 |
| Cinder Warrior | 1 | Heavy infantry | 11 | 11 | 11 | 9 | 3 (Scale Shirt 2, Leather Cap 1) | 11 | 2 | Axe 5 | — | — | — | 12/8/10 | 4 + 3 + 1 = 8 ✓ | 1 |
| Ember Skirmisher | 1 | Skirmisher | 10 | 10 | 10 | 11 | 1 (Leather Cap 1) | 10 | 3 | Javelins 4 (range 3, ammo 4), Knife 2 | — | — | — | 11/4/10 | 2 + 1 + 1 = 4 ✓ | 1 |
| Flame Archer | 1 | Archer | 10 | 10 | 9 | 9 | 2 (Leather Jerkin 1, Leather Cap 1) | 10 | 2 | Fire Arrows 6 (range 6, ammo 10, fire) | — | — | — | 13/6/10 | 4 + 1 + 1 = 6 ✓ | 1 |
| Berserker | 1 | Shock infantry | 13 | 13 | 12 | 7 | 2 (Wolf Pelt 2) | 14 | 2 | Great Axe 8 | — | — | berserk | 18/10/10 | 8 + 2 = 10 ✓ | 1 |
| Ash Rider | **2 Large** | Cavalry | 12 | 11 | 11 | 11 | 4 (Scale Shirt 2, Iron Cap 2) | 11 | 3 | Lance 6 (charge +3), Sword 4 | Ash Horse (no weapon) | — | mounted | 28/18/20 | 3 + 3 + 3 + 2 + 7 = 18 ✓ | **2** |
| Flamebrand | 1 | Sacred warrior | 13 | 12 | 13 | 11 | 6 (Scale Hauberk 4, Iron Cap 2) | 13 | 2 | Burning Blade 6 (fire) | — | fire +3 | sacred | 32/14/10 | 6 + 6 + 2 = 14 ✓ | 1 |
| Fire Sprite (summon) | 1 | Summon | 6 | 6 | 10 | 14 | 0 (natural) | 50 | 3 | Flame Touch 5 (fire, armor piercing) | — | fire +10 | flying, construct, mindless | — | — | 0 |

#### Cinder Horde commanders

| Unit | Size | Role | hp | def | prot (gear) | mor | Lead | Pips, holy | Weapons | Resist | Abilities | Body plan (C.3) | Cost g/m/pop | Mat. | Sup. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Scout | 1 | Scout | 10 | 10 | 1 (Leather Cap 1) | 10 | 10 | — | Dagger 2 | — | stealthy, scout 2 | humanoid | 20/2/50 | 1 + 1 = 2 ✓ | 1 |
| Ash Chieftain | 1 | General | 14 | 10 | 4 (Scale Hauberk 4) | 13 | 80 | — | Axe 5 | — | — | humanoid | 40/10/50 | 4 + 6 = 10 ✓ | 1 |
| Pyre Priest | 1 | Priest | 10 | 10 | 2 (Ritual Vestments 2) | 11 | 20 | R1, holy 2 | Staff 2 | — | — | humanoid | 60/4/50 | 1 + 3 = 4 ✓ | 1 |
| Ember Adept | 1 | Mage | 10 | 10 | 1 (Quilted Robe 1) | 10 | 10 | R1 | Staff 2 | — | — | humanoid | 70/2/50 | 1 + 1 = 2 ✓ | 1 |
| Cinder Magus | 1 | Mage | 11 | 10 | 2 (Ritual Vestments 2) | 11 | 20 | R2 (25% R3), holy 1 | Staff 2 | — | — | humanoid | 160/4/50 | 1 + 3 = 4 ✓ | 1 |
| Salamander (summon) | 3 Great | Beast | 35 | 10 | 8 (natural) | 14 | 30 | R2 | Fire Breath 10 (range 2, ammo 6, fire) | fire +10 | beast | beast | — | — | 3 |

All commanders have str 10, att 10, prec 10, and map speed 3 except the Salamander (speed 2),
as `docs/03` decides.

#### Thornwood troops (recruit at fort)

| Unit | Size | Role | hp | str | att | def | prot (gear) | mor | spd | Weapons | Mount | Resist | Abilities | Cost g/m/pop | Mat. | Sup. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Thorn Militia | 1 | Light infantry | 10 | 10 | 9 | 9 | 2 (Leather Jerkin 1, Leather Cap 1) | 10 | 2 | Spear 3 (reach) | — | — | — | 8/4/10 | 2 + 1 + 1 = 4 ✓ | 1 |
| Warden | 1 | Heavy infantry | 11 | 11 | 10 | 9 + 2 = **11** | 6 (Bark Mail 4, Iron Cap 2, Round Shield 0) | 11 | 1 | Sword 4 | — | — | — | 14/14/10 | 3 + 6 + 2 + 3 = 14 ✓ | 1 |
| Longbow Hunter | 1 | Archer | 10 | 10 | 9 | 10 | 2 (Leather Jerkin 1, Leather Cap 1) | 10 | 2 | Longbow 6 (range 7, ammo 12) | — | — | — | 14/8/10 | 6 + 1 + 1 = 8 ✓ | 1 |
| Briar Guard | 1 | Heavy infantry | 12 | 12 | 11 | 11 − 1 = **10** | 9 (Thornplate 7, Iron Cap 2) | 12 | 1 | Halberd 7 (reach) | — | — | — | 24/26/10 | 6 + 18 + 2 = 26 ✓ | 1 |
| Wolf Rider | **2 Large** | Cavalry | 12 | 11 | 11 | 12 | 3 (Leather Jerkin 1, Iron Cap 2) | 11 | 3 | Spear 4 (reach) | War Wolf: Wolf Bite 3 | — | mounted, beast | 26/12/20 | 2 + 1 + 2 + 7 = 12 ✓ | **2** |
| Oakheart | 2 Large | Sacred warrior | 16 | 14 | 11 | 10 − 1 = **9** | 10 (natural 3, Thornplate 7) | 13 | 1 | Oak Maul 9 | — | **fire −3** | sacred | 36/22/10 | 4 + 18 = 22 ✓ | **2** |
| Wolf (summon, independent) | 1 | Beast | 9 | 9 | 10 | 11 | 1 (natural) | 10 | 3 | Bite 4 | — | — | beast | — | — | 1 |
| Hornet Swarm (summon) | 1 | Summon | 6 | 2 | 12 | 13 | 0 (natural) | 50 | 3 | Sting 2 (armor negating) | — | — | flying, beast, mindless | — | — | 1 |

#### Thornwood commanders

| Unit | Size | Role | hp | def | prot (gear) | mor | Lead | Pips, holy | Weapons | Resist | Abilities | Body plan | Cost g/m/pop | Mat. | Sup. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Scout | 1 | Scout | 10 | 10 | 1 (Leather Cap 1) | 10 | 10 | — | Dagger 2 | — | stealthy, scout 2 | humanoid | 20/2/50 | 2 ✓ | 1 |
| Warden Captain | 1 | General | 14 | 8 + 2 = **10** | 7 (Bark Mail 4, Antlered Helm 3, Round Shield 0) | 12 | 80 | — | Sword 4 | — | — | humanoid | 45/16/50 | 3 + 6 + 4 + 3 = 16 ✓ | 1 |
| Grove Priest | 1 | Priest | 10 | 10 | 2 (Ritual Vestments 2) | 11 | 20 | G1, holy 2 | Staff 2 | — | — | humanoid | 60/4/50 | 4 ✓ | 1 |
| Sapling Druid | 1 | Mage | 10 | 10 | 1 (Quilted Robe 1) | 10 | 10 | G1 | Staff 2 | — | — | humanoid | 70/2/50 | 2 ✓ | 1 |
| Elder Druid | 1 | Mage | 11 | 10 | 2 (Ritual Vestments 2) | 11 | 20 | G2 (25% G3), holy 1 | Staff 2 | — | — | humanoid | 160/4/50 | 4 ✓ | 1 |
| Treant (summon) | 4 Huge | Beast | 60 | 10 | 12 (natural) | 16 | 40 | G1 | Crushing Limbs 12 | **fire −5** | regeneration 5% | beast | — | — | 4 |

The Treant's `beast` tag is not added: it would make Treants cheaper in Wild provinces, and they
are summoned, not recruited.

#### Independents and shared units

| Unit | Size | Role | hp | str | att | def | prot (gear) | mor | Weapons | Abilities | Body plan |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Light Infantry | 1 | Light infantry | 10 | 10 | 9 | 8 | 2 (Leather Jerkin 1, Leather Cap 1) | 9 | Spear 3 (reach) | — | — |
| Heavy Infantry | 1 | Heavy infantry | 11 | 10 | 10 | 10 | 7 (Mail Hauberk 5, Iron Cap 2) | 10 | Sword 4 | — | — |
| Archer | 1 | Archer | 10 | 10 | 10 | 10 | 0 | 10 | Shortbow 5 (range 5, ammo 10) | — | — |
| Swamp Fighter | 1 | Light infantry | 10 | 10 | 10 | 12 | 0 | 10 | Spear 3 (reach) | swampwalker | — |
| Giant | 4 Huge | Monster | 40 | 18 | 10 | 10 | 4 (natural) | 10 | Club 12 | — (no trample, A.10) | — |
| Independent Captain | 1 | General | 12 | 10 | 10 | 8 + 2 = **10** | 0 (Round Shield 0) | 10 | Sword 4 | — | humanoid (never equips: C.7) |
| Garrison | 1 | — | — | — | — | — | — | — | — | immobile (hidden) | none |

Independents have no cost, so their materials are not checked, and they never eat. Their pieces
still sum into `prot`.

#### Why each value: the lore lines

The first sentence of each `description`, which the hover shows (A.9). Each one explains the
unit's oddest number.

| Unit | Lore line (first sentence) | The number it explains |
|---|---|---|
| Ash Militia | "Herders levied with a spear and a cap; they break when the line breaks." | mor 9, prot 1 |
| Cinder Warrior | "Clan warriors in ash-blackened scale, for whom the axe is an oath." | the Horde's backbone |
| Ember Skirmisher | "Runners who throw four javelins and are gone into the smoke." | def 11, speed 3, ammo 4 |
| Flame Archer | "Pitch-dipped arrows that set the enemy line alight." | fire arrows |
| Berserker | "Fury-sworn, bare-chested under a wolf pelt, they do not know how to run." | def 7, mor 14, never routs |
| Ash Rider | "Clan lancers on ash-grey horses bred to carry, not to fight; the first charge is everything." | size 2, 20 pop, charge, no hoof |
| Flamebrand | "Temple champions whose blades burn with the god's fire, which barely touches them." | fire blade, fire +3 |
| Fire Sprite | "A flicker of living flame with no will of its own." | flying, mor 50, fire +10 |
| Scout | "Hooded runners who see without being seen." | sight 2, stealthy |
| Ash Chieftain | "The clan's chosen, who leads eighty in a scale hauberk." | leadership 80 |
| Pyre Priest | "Keeper of the pyre-flame, who blesses the warriors before battle." | holy 2, Bless |
| Ember Adept | "A spark-reader in quilted robes; one pip of fire, and much to learn." | R1, prot 1 |
| Cinder Magus | "Master of the Kharnath pyres; some are born with a third ember." | R2, 25% R3 |
| Salamander | "A fire beast bound by ritual; it breathes flame and bathes in it." | size 3, fire +10 |
| Thorn Militia | "Forest folk with boar spears that blunt a charge." | reach |
| Warden | "Shield-bearers of the deep wood: slow, patient, and hard to kill." | speed 1, def 11 with the shield |
| Longbow Hunter | "Yew longbows that reach the last rank." | range 7 |
| Briar Guard | "Halberdiers in grown thornplate, the wall the forest raises; it is heavy to fight in." | prot 9, def −1, 26 materials |
| Wolf Rider | "Riders on war wolves; the wolf bites as the spear strikes." | two weapons, size 2 |
| Oakheart | "A walking oak under thornplate; dry wood burns." | size 2, prot 10, fire −3 |
| Wolf | "A grey wolf of the deep wood." | — |
| Hornet Swarm | "A cloud of stinging hornets that no armor keeps out." | armor negating, mor 50 |
| Warden Captain | "A Warden who leads eighty from under an antlered helm; he watches the line, not his own guard." | prot 7, leadership 80, skill 8 (M10) |
| Grove Priest | "Speaker for the grove, who blesses the line before battle." | holy 2 |
| Sapling Druid | "A young druid; one pip of loam, and the forest's patience." | G1 |
| Elder Druid | "An old druid who can wake the trees; some hear a third voice." | G2, 25% G3 |
| Treant | "An old tree woken by ritual: it mends itself, and dry wood burns." | regeneration, fire −5 |
| Light Infantry | "Hired spears in leather." | — |
| Heavy Infantry | "Mailed swordsmen of the hill holds." | prot 7 |
| Archer | "Hunters with shortbows." | range 5 |
| Swamp Fighter | "Marsh folk, quick on bad ground." | def 12, swampwalker |
| Giant | "A mountain giant, four men tall, who eats for four and draws every eye and every blow." | size 4, hp 40 |
| Independent Captain | "A local lord with a shield and a grudge." | leadership 60 |

#### Pretender bodies (the fields this design adds; the pretender track owns the rest)

Every body's armor is natural (`naturalProt` = `prot`, no gear, no materials). Sizes are the
pretender final's A.4 values except the Living Monolith (R5).

| Body | Size class | Body plan (C.3) | Resist (proposed) | Supply (U2) |
|---|---|---|---|---|
| Oracle of the Flux | 2 Large | humanoid | — | 2 |
| Titan | 4 Huge | humanoid | — | 4 |
| Great Wyrm | 6 Gargantuan | wyrm | — (breath color display only) | 6 |
| Living Monolith | **6 Gargantuan** (was 1, drawn at 6) | idol | — | 6 |
| Ascended Hero | 2 Large | humanoid | — | 2 |
| Primordial | 6 Gargantuan | wyrm | — | 6 |
| Ash Colossus | 5 Colossal | humanoid | fire +10 | 5 |
| Ash Phoenix | 3 Great | wyrm | fire +10 | 3 |
| Pyre Lord | 4 Huge | humanoid | — | 4 |
| Cinder Idol | 6 Gargantuan | idol | fire +10 | 6 |
| Ember Hierophant | 2 Large | humanoid | — | 2 |
| Wild Spirit | 2 Large | beast | — | 2 |
| World Tree | 6 Gargantuan | idol | — (A.7) | 6 |
| Horned Hunter | 4 Huge | humanoid | — | 4 |
| Elder Wyrm | 6 Gargantuan | wyrm | — | 6 |
| Mother of Beasts | 4 Huge | humanoid | — | 4 |

### A.12 Balance: what moves and what does not

All cells are attacker win rates in percent: 400 seeds, or 200 and 500 for the required tests as
`docs/04` sets them. The riders are size 2 from the U1 column on. "Final" is U1 + U3 + U4 (U2
is supply; U5 touches no unit in these fights). Output: `proto/measure-2.out.md`, reproduced by
both judges.

| Fight | Today | U1 size | U3 reach | U4 resist | Shields vs arrows (rejected) | Giant trample (rejected) | **Final** |
|---|---|---|---|---|---|---|---|
| **R1** 20 Cinder Warriors vs 10 Ash Militia (need ≥ 95) | 98.5 | 98.5 | 98.5 | 98.5 | 98.5 | 98.5 | **98.5** |
| **R2** equal armies (need 35 to 65) | 49.2 | 49.2 | 49.2 | 49.2 | 49.2 | 49.2 | **49.2** |
| **R3** archer kills, rounds 1 to 3 (need ≥ 2) | 4.1 | 4.1 | 4.1 | 4.1 | 4.1 | 4.1 | **4.1** |
| Cinder start attacks Thornwood start | 39.5 | 39.5 | 39.5 | 39.5 | 33.0 | 39.5 | **39.5** |
| Thornwood start attacks Cinder start | 60.5 | 60.5 | 60.5 | 60.5 | 64.8 | 60.5 | **60.5** |
| Cinder mid attacks Thornwood mid¹ | 45.3 | 41.0 | 43.5 | 45.3 | 43.5 | 45.3 | **40.0** |
| Thornwood mid attacks Cinder mid | 54.5 | 51.5 | 59.0 | 54.5 | 58.0 | 54.5 | **53.3** |
| Cinder elite attacks Thornwood elite² | 25.8 | 30.0 | 25.8 | 35.8 | 26.3 | 25.8 | **43.8** |
| Thornwood elite attacks Cinder elite | 70.8 | 68.5 | 70.8 | 66.8 | 75.0 | 70.8 | **54.3** |
| 10 Ash Riders vs 10 Briar Guard | 55.0 | 56.0 | 47.8 | 55.0 | 55.0 | 55.0 | **50.3** |
| 10 Ash Riders vs 15 Thorn Militia | 80.0 | 80.0 | 78.5 | 80.0 | 80.0 | 80.0 | **78.8** |
| 10 Flamebrands vs 10 Oakhearts | 21.3 | 24.3 | 21.3 | 36.0 | 21.3 | 21.3 | **33.8** |
| Cinder start vs mountain Giant + 25 Heavy Infantry | 67.5 | 68.8 | 67.5 | 67.5 | 67.5 | 45.5 | **68.8** |
| Titan (Attack) + 20 Cinder Warriors vs Thornwood start | 14.5 | 17.8 | 14.5 | 14.5 | 14.5 | 14.5 | **17.8** |
| Titan (Attack) + 20 Cinder Warriors vs 20 Heavy Infantry | 52.5 | 57.8 | 52.5 | 52.5 | 52.5 | 52.5 | **57.8** |
| Great Wyrm (Attack) + 20 Wardens vs Cinder start (J2, reproduced in `final2.out.md`) | 30.5 | 40.5 | 30.5 | 30.5 | — | — | **40.5** |
| Cinder start vs Treant (Attack) + 20 Wardens | 71.5 | 66.0 | 71.5 | 71.8 | 68.0 | 71.5 | **66.3** |
| Cinder start vs Living Monolith alone, size 1 or 6 (J1) | 0.5 | 0.5 | — | — | — | — | **0.5** |

¹ Mid armies: Ash Chieftain with 20 Cinder Warriors, 10 Flame Archers, 10 Berserkers, and 10 Ash
Riders, against Warden Captain with 20 Wardens, 10 Longbow Hunters, 10 Briar Guard, and 10
Wolf Riders.
² Elite armies: Ash Chieftain with 20 Cinder Warriors, 10 Flame Archers, and 10 Flamebrands,
against Warden Captain with 20 Wardens, 10 Longbow Hunters, and 10 Oakhearts.

**The elite matchup, attributed** (M3; `final-measure/final.out.md` section 4). Thornwood's share
is the mean of (100 − Cinder attacking) and Thornwood attacking.

| Rules | Cinder elite attacks | Thornwood elite attacks | **Thornwood share** |
|---|---|---|---|
| today | 25.8 | 70.8 | **72.5** |
| U1 only | 30.0 | 68.5 | **69.3** |
| U4 only (Oakheart fire −3) | 35.8 | 66.8 | **65.5** |
| U1 + U4 (= final; no charge in these armies) | 43.8 | 54.3 | **55.3** |

U1 alone moves 3.2 points and U4 alone 7.0. Together they move 17.2, so about 7 points come from
their interaction: the Oakhearts are size 2, so they draw twice the blows, and the fire blows
among them deal 3 more. On a Large body each point of weakness counts about twice.

**Knobs for the elite matchup, measured on the final rules:**

| Knob | Thornwood share | Move |
|---|---|---|
| none (final) | 55.3 | — |
| Oakheart fire −3 → −2 | 58.5 | +3.2 |
| Oakheart prot 10 → 11 | 59.9 | +4.6 |
| Oakheart fire −3 → −1 | 63.4 | +8.1 |
| Oakheart hp 16 → 20 | 66.1 | +10.8 |
| Oakheart without a weakness (U1 alone) | 69.3 | +14.0 |
| Oakheart size 1 (U1 off for it; U4 alone) | 65.5 | +10.2 |

The fire weakness is the knob for the U1 × U4 interaction, and the Oakheart's HP the knob that
offsets the doubled draws directly. The size stays: a walking oak is Large.

**Reading.**
- **The `docs/04` required tests do not move**, under any rule. They use only size-1 units with
  no reach, no shields, and no resistances, and U1 is bit-identical for size 1. The Pyre Storm
  test (militia, no resistance) is untouched for the same reason.
- **The starting matchup does not move** (Thornwood 60.5% either way). It already leans to
  Thornwood today. That is Phase 12's to tune with the Phase 7 AI.
- **The mid-game mix moves about 2 points toward Thornwood** (its mean share 54.6% → 56.7%),
  inside the noise (one cell's standard error is about 2.5 points).
- **The elite matchup moves toward even**: Thornwood 72.5% → 55.3%, from U1 and U4 together.
- **Gods leading troops gain 3 to 10 points, growing with size** (M19): the Titan (size 4) with
  20 Cinder Warriors +3.3 and +5.3, the Great Wyrm (size 6) with 20 Wardens +10.0. The god
  draws more of the blows its troops would have taken. God deaths stay at 0% to 4% under U1
  (`judge-2/p/goddeath.out.md`). Lone duels are unchanged: a lone body is the only target.
- **A god leading troops routs with its last squad**, so its kit barely changes such a fight:
  the Great Wyrm with 20 Wardens wins 40.5% against Cinder's start with Ring and Amulet, with
  +10 protection, or with 50% regeneration alike, because the battle ends in about 4.5 rounds
  when the Wardens break (`final-measure/chk.ts`). Items matter most on champions who fight
  alone, as Dominions' thugs do.
- **Rejected rules are rejected for the numbers above**: shields against arrows push a
  Thornwood-leaning start further, and Giant trample makes a mountain champion a wall.

### A.13 Data shapes, exactly

```ts
// src/content/types.ts (additions and changes)
export type DamageElement = Exclude<Element, 'physical'>;
export type UnitRole = 'lightInfantry' | 'heavyInfantry' | 'shockInfantry' | 'skirmisher' | 'archer'
  | 'cavalry' | 'sacredWarrior' | 'scout' | 'general' | 'priest' | 'mage' | 'beast' | 'summon' | 'monster' | 'god';

export interface WeaponDef {
  name: string;
  dmg: number;
  range?: number;
  ammo?: number;
  element?: Element;
  armorPiercing?: boolean;
  armorNegating?: boolean;
  /** Charge: extra damage in the unit's first melee round, unless the target braces (U3). */
  firstRoundBonus?: number;
  /** U3: melee only. A troop holding it braces against charges. */
  reach?: true;
  /** A.5: what it costs to make; required on every weapon of a recruitable unit. */
  materials?: number;
  /** N2 (pretender track): swings per troop per melee phase, 1 to 4. */
  strikes?: number;
  /** N2: only bodies of this size or less can be struck with it. */
  maxTargetSize?: number;
}

export interface CommanderTraits {
  /* today's fields: leadership, pips, holy, extraPip?, sight?, garrison?, defaultSpell?, research? */
  /** C.3: the slots this body offers. */
  body: BodyPlanId;
}

export interface UnitDef {
  /* today's fields: id, name, hp, str, att, def, prot, mr, mor, prec, size, mapSpeed, weapons,
     tags, regeneration?, fireShield?, cost, recruitDays, requires, commander? */
  /** 1 to 6: Man-sized to Gargantuan (SIZE_CLASSES). U1 draws, U2 supply. */
  size: number;
  role: UnitRole;
  /** Lore; the first sentence (<= 120 characters) is the hover's line. */
  description: string;
  /** A.5: pieces; prot = naturalProt + Σ gear.prot, exactly. */
  gear: readonly GearId[];
  naturalProt: number;
  /** A.4: present exactly on mounted units. */
  mount?: MountDef;
  /** U4: signed, −10 to 20. */
  resist?: Partial<Record<DamageElement, number>>;
  /** N1: trigger abilities only (B.1); every other ability is derived. */
  abilities?: readonly TriggerAbilityId[];
  /** N3 (pretender track). */
  spellPower?: number;
}
```

```ts
// src/sim/battle/types.ts — CombatStats after this design (the pretender's N2 to N4 included)
export interface CombatStats {
  hp: number; str: number; att: number; def: number; prot: number; mor: number; prec: number;
  mapSpeed: number;
  /** After C.9: the item weapon replaces melee weapons; the mount's weapons follow the rider's. */
  weapons: readonly WeaponDef[];
  tags: readonly UnitTag[];
  /** U5: the single best source. */
  regeneration: number;
  lifeDrain: number;
  /** N4: one entry per element, amounts added, in ELEMENTS order (replaces fireShield). */
  shields: readonly Shield[];
  /** N2. */
  size: number;
  /** N3. */
  spellPower: number;
  /** U4: unit + items. */
  resist: Readonly<Partial<Record<DamageElement, number>>>;
  /** U3: some melee weapon in `weapons` has reach. */
  braces: boolean;
}
// src/sim/battle/detail.ts   DamageRoll gains resist: number; the strike event gains braced: boolean
// src/content/rules.ts       SUPPLY.perSize = 1 replaces troopSupply, bigUnitSize, bigUnitSupply, commanderSupply;
//                            BATTLE.maxRegeneration = 0.2
// src/content/sizes.ts       SIZE_CLASSES: readonly { size; name; glyph }[]  (6 rows, A.3)
```

---
## B. The abilities catalog (one, shared with the pretender expansion)

Dominions has "about 500 special abilities", explained "on a mouse-over or right-click"
([manual ch. 4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)). Most of its
flavor comes from a small common set plus rare signatures (units research 7.1). Wesnoth and AoW4
define every special as data with a name and one sentence, and Wesnoth's tooltip appends
"(inactive)" to a special that does not apply ([reports.cpp](https://raw.githubusercontent.com/wesnoth/wesnoth/master/src/reports.cpp),
lines 444, 1050 and 1090). FM keeps one catalog, so the card, the hover, the Codex, the replay's
teaching line, the designer, and the item tooltip all read the same words.

### B.1 The shape

```ts
// src/content/abilities.ts
export type AbilityPlacement =
  | 'signature'   // may take one of the card's 3 glyph slots
  | 'class'       // a word in the hover's title line only (AoW4's secondary passives)
  | 'weapon'      // a chip on its weapon's line only
  | 'element'     // the card's one element mark (resistances)
  | 'body'        // pretender and nation properties: chassis card, hover, Codex
  | 'state';      // a squad state chip in battle contexts (bound)
export type AbilityRule =
  | { kind: 'tag'; tag: UnitTag }
  | { kind: 'stat'; stat: 'regeneration' | 'lifeDrain' | 'spellPower' | 'inspire' | 'sight' }
  | { kind: 'shield'; element: DamageElement }                                     // N4
  | { kind: 'resist'; element: DamageElement }                                     // U4
  | { kind: 'weapon'; property: 'armorPiercing' | 'armorNegating' | 'charge' | 'reach' | 'strikes' | 'trample' }
  | { kind: 'booster' }                                                            // I6
  | {
      kind: 'trigger';                                                             // N1
      trigger: 'battleStart';
      /** Presentation only: the color whose look its cue takes; null takes its first effect's look. */
      color: Color | null;
      effects: readonly BattleEffect[];
      /**
       * D20: a battle spell whose effect this copies. Its stat changes then carry the spell's id
       * as their source, so the two never land on one squad (the target rule skips a squad that
       * already has that source). Absent: the ability's own id is the source, as N1 rules.
       */
      sourceId?: BattleSpellId;
    }
  | { kind: 'body'; property: 'researches' | 'dominionEngine' | 'monthlySummon' | 'reform' | 'avatar' | 'bound' | 'homeTerrain' };

export type AbilityDef = AbilityRule & {
  id: string;
  name: string;
  /** A 24 px monoline glyph id (docs/09 Icons). Signature glyphs are unique. */
  glyph: GlyphId;
  /** At most UI.unitCard.oneLineMax (120) characters. {n}, {m}, {unit}, {color} are filled from the bearer. */
  oneLine: string;
  /** The line for a negative value, where the sign changes the words (resistances). */
  oneLineNegative?: string;
  /** The Codex paragraph: exact numbers and interactions. */
  codex: string;
  /** One placement each (B.4). Weapon-derived entries also show on their weapon's line, whatever this says. */
  placement: AbilityPlacement;
  /** Lower shows first among signature glyphs. */
  cardPriority: number;
  /** When it applies; the hover shows "(inactive: ...)" when the context says it does not. */
  condition?: string;
  milestone: 'M1' | 'M2';
};

export const ABILITIES = { /* the 42 entries of B.5 */ } as const satisfies Record<string, AbilityDef>;
export type AbilityId = keyof typeof ABILITIES;
/** Ids of trigger entries only: what UnitDef.abilities and ItemEffects.abilities may hold. */
export type TriggerAbilityId = {
  [K in AbilityId]: (typeof ABILITIES)[K] extends { kind: 'trigger' } ? K : never;
}[AbilityId];

/** What the pretender's N1 battle code reads. */
export type UnitAbility = Extract<AbilityDef, { kind: 'trigger' }>;
export function triggerDef(id: TriggerAbilityId): UnitAbility;
/** The EffectSource N1 passes to plan and applyEffect: the copied spell's id when there is one. */
export function abilitySource(a: UnitAbility): EffectSource {
  return { id: a.sourceId ?? a.id, effects: a.effects };
}
```

**What this changes in the pretender spec.** Pretender N1 defines `UnitAbility` as `{ id, name,
trigger, color, effects }` and `ABILITIES` as a record of those. Under this design each such
record also carries `kind: 'trigger'` and the display fields, and may carry `sourceId`.
`UnitAbility` becomes the `Extract` above, so `abilityPhase`, `hasTargets`, `plan`,
`applyEffect`, the record's `abilities: string[]`, and `fromSetupRecord` read the same fields as
before. Two lines change: `abilityDef(id)` becomes `triggerDef(id)`, and `abilityPhase` builds
its `EffectSource` with `abilitySource(a)` instead of `a`. None of the pretender's three
abilities has a `sourceId`, so their logs are unchanged (B.6 lists every amendment).

### B.2 How a unit's abilities are found

A unit lists only its trigger abilities (`UnitDef.abilities`). Everything else is **derived**, so
the content cannot hold an ability and a field that disagree:

```ts
// src/content/abilities.ts
/** Every catalog entry that applies to a unit, with its numbers, in catalog order. */
export function abilitiesOf(def: UnitDef, nation?: NationDef, items?: readonly ItemDef[]): readonly AbilityUse[];
export interface AbilityUse {
  id: AbilityId;
  n?: number;
  m?: number;
  unit?: UnitTypeId;
  color?: Color;
  /** The item it comes from, for "from {item}" in the hover. */
  item?: ItemId;
  /** Index into the unit's weapons for weapon entries. */
  weapon?: number;
}
```

| Source | Becomes |
|---|---|
| each tag in `def.tags` | its `tag` entry (`garrison` and `immobile` on the garrison holder are hidden) |
| `regeneration > 0` | `regeneration` with n = percent |
| `fireShield` and, after N4, `shields` | `shield.fire`, `shield.nature` with n |
| each `resist` entry | `resist.<element>` with n (signed) |
| `spellPower > 0` (N3) | `spellPower` with n |
| `commander.sight` | `scout` with n |
| a weapon's `armorPiercing`, `armorNegating`, `firstRoundBonus`, `reach`, `strikes > 1` | the `weapon` entry, attached to that weapon's line |
| a weapon with `maxTargetSize` | `trample` with n = strikes, m = maxTargetSize, attached to that weapon's line |
| `def.abilities` | each trigger entry |
| the chassis (pretender `ChassisDef`) | `researches`, `dominionEngine`, `monthlySummon`, `reform`, `avatar` |
| the nation's `homeTerrain` | `forestHome` (the entry names its terrain) |
| a battle-summoned or bound monthly squad | `bound` (a state chip, not a unit property) |
| worn items | each item's stat, booster, resistance, shield, and trigger entries, with `item` set |

Blessings fold into stats at setup (pretender A.6). Their effects show through the same entries
("Fire shield 3, from Cinder Skin").

### B.3 Validation (`tests/content/abilities.test.ts`)

1. Every entry has a name, a glyph that exists in the icon set, a `oneLine` of at most 120
   characters with all its placeholders fillable, and a `codex` paragraph.
2. No two `signature` entries share a glyph.
3. Every derived use (B.2) of every unit, item, blessing, and chassis resolves to an entry.
4. **No orphans:** every M1 entry has at least one M1 user. M2 entries may have none.
5. **Triggers:** their effects pass `battleEffectProblems` (`content/spells/validate.ts`); their
   ids are unique and distinct from every spell id; they sit only on commander units and
   items; their summoned units exist and are not commanders (pretender N1).
6. **`UnitDef.abilities` and `ItemEffects.abilities` hold trigger ids only**: the type says so
   (`TriggerAbilityId`), and a runtime test checks every content record, so a cast through
   `as` cannot slip past.
7. **`sourceId`** names an existing battle spell, and the trigger's effects have the same kinds,
   stats and target kinds as that spell's (the deltas may differ): Seed of Barkskin against
   Bark Skin, Ivy Grasp against Entangle.
8. Per CLAUDE.md, every new unit, item, chassis, and ability joins the content fixtures.

### B.4 Placement and order on the card

- **The card's glyph row** holds `signature` entries first, by `cardPriority`. Free slots then
  take the weapon chips of the unit's best melee weapon, up to 3 glyphs in all, then "+N"
  (presentation research P1). Conditions beat traits: a squad's state chips (routing,
  starving, blessed, bound) take the slots first (UI spec rule 5).
- **Weapon-derived entries** (`armorPiercing`, `armorNegating`, `charge`, `reach`, `strikes`,
  `trample`) always show as a chip on their weapon's line, whatever their placement. A
  `signature` placement (only `trample`) also lets the entry take a glyph slot.
- **`class` entries** (beast, mounted, construct, mindless, undead, swampwalker, immobile) never
  take a card slot. They are words in the hover's title line: "Large · Cavalry · Mounted ·
  Beast".
- **`element`** entries (resistances) take the card's single element mark, the largest by
  absolute value.
- **`body`** entries show on the pretender card, the hover, and the Codex, never on a troop
  card. Forest home is one: it is on every Thornwood unit, so on the card it would say nothing
  that the nation's banner does not.
- **`state`** entries are chips on squad cards in battle contexts.
- **Inactive.** Where an entry has a `condition` and the context shows it unmet, the hover greys
  the line and appends "(inactive: {condition})". Examples: Berserk on a healthy troop, Forest
  home outside a forest, a booster on a commander without the color, a regeneration source
  that another source outranks (U5).

### B.5 The catalog

Glyphs are concepts for the Phase 11 icon set (24 px monoline, `docs/09` Icons). In panels
every glyph comes with its name or number (UI spec rule 6). "Tests" names the test file and
case; "existing" means a test already in the repository keeps covering the rule.

#### Tags (rules that already exist, now named)

| Id | Name, placement | Exact rule | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `sacred` | Sacred, signature 22 | Receives the nation's bless (`docs/02` section 8, pretender A.6); half upkeep (`ECONOMY.sacredUpkeepFactor`); Sanctity's sacred morale | small figure under a haloed star | "Sacred: carries its god's blessing in battle and costs half upkeep." | Flamebrand, Oakheart; the prophet fights as if sacred | existing: `bless`, `commanders` upkeep, `setup` |
| `berserk` | Berserk, signature 21; condition "below half HP" | Below `BATTLE.berserk.belowHpShare` of max HP: att +2, str +2 in melee; never routs | two crossed jagged strokes | "Berserk: below half HP it gains +2 attack and strength, and it never flees." | Berserker; Fury Unbound blessing | existing: `field`, `morale`, `resolve` |
| `flying` | Flying, signature 20 | Closes in round `BATTLE.closingRound` for flyers (2) | a single wing | "Flies: reaches the enemy in round 2, whatever its speed." | Fire Sprite, Hornet Swarm; Great Wyrm, Ash Phoenix | existing: `resolve` closing |
| `stealthy` | Stealthy, signature 25 | Hidden from other nations while it leads only stealthy troops (`isStealthy`) | eye with a diagonal slash | "Stealthy: enemies cannot see it while it leads only stealthy troops." | both Scouts; Wild Spirit | existing: `commanders`, `visibility` |
| `immobile` | Immobile, class | Map speed 0; cannot move or flee; dies when its side retreats | a stone block with roots | "Immobile: it cannot move, and it dies rather than retreat." | Living Monolith, Cinder Idol, World Tree; the garrison holder (hidden) | existing: `movement`, `conflict` |
| `swampwalker` | Swampwalker, class | No `TERRAIN.swamp.battle.attackerAtt` (−1) when attacking in swamp | three reeds over a wave | "Swampwalker: attacks into swamp without the −1 attack others suffer." | Swamp Fighter | existing: `setup` |
| `undead` | Undead, class, **M2** | Eats no supply (`troopSupply`) | ribcage | "Undead: it eats nothing." | none in M1 | existing: `commanders` supply |
| `construct` | Construct, class | Eats no supply | a rune stone | "Construct: a made thing; it eats nothing." | Fire Sprite | existing: `commanders` supply |
| `beast` | Beast, class | Recruit gold × `max(0, 1 + scaleEffect 'beastCostPct')` (Wild) | paw print | "Beast: cheaper to recruit where the Wild scale is high." | Wolf Rider, Wolf, Hornet Swarm, Salamander | existing: `recruitment` |
| `mounted` | Mounted, class | Content only in M1: a `mount` block and size ≥ 2 (A.4) | horse head | "Mounted: rider and mount fight as one Large body and eat 2 supply." | Ash Rider, Wolf Rider | new: content validation |
| `mindless` | Mindless, class | Content only in M1: validation requires morale 50 (`BATTLE.morale.fearless`) | an eyeless mask | "Mindless: it has no will to break, so it never checks morale." | Fire Sprite, Hornet Swarm | new: content validation |

#### Numbers (stat folds and small rules)

| Id | Name, placement | Exact rule | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `regeneration` | Regeneration, signature 23; condition "its best source" | End of round: each living troop heals `min(maxHp − hp, maxHp × n)`; U5: n is the single best source | leaf inside a circular arrow | "Regenerates {n}% of its HP at the end of every round." | Treant 5%, Wild Spirit, World Tree, Elder Wyrm 10%; Ring of Regrowth 5%; Vigor, Evergreen, Wild Vigor, Greater Evergreen | existing: `resolve`; new: U5 (A.8) |
| `lifeDrain` | Life drain, signature 33 | Each damaging hit heals its striker n, paid after the phase, to strikers still alive | a drop with an arrow into a heart | "Life drain {n}: heals {n} HP for every wound it deals." | the Black bless (pretender's minimal B menu) | existing: `attacks` drain |
| `spellPower` | Spell power, signature 26 | N3: a damage effect rolls `amount + n`, a heal heals `amount + n`; abilities pass 0. Body and items add | a staff with three rays | "Spell power {n}: its spells deal and heal {n} more." | Ember Hierophant 3; Pyre Staff 2 | N3 tests; new: item fold |
| `inspire` | Inspiring, signature 27 | I7: each squad the bearer leads at battle setup gets `mor += n`; several inspire items add | a pennant with an up chevron | "Inspiring {n}: every squad it leads fights with +{n} morale." | Pendant of Fury 1, Horn of the Burning Host 2, Antler Crown 1 | new: `setup` (led squads only) |
| `scout` | Scout, signature 29 | Sees n provinces away (`commanderSight`); counts as a scout for `VISION.scoutExactRange` | an open eye | "Scout: sees {n} provinces away, and nearby independents' exact strength." | both Scouts 2 | existing: `visibility` |

#### Retaliation shields (pretender N4)

| Id | Name, placement | Exact rule | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `shield.fire` | Fire shield, signature 24 | N4: each melee hit that wounds it owes the striker n fire, minus the striker's fire resistance, at least 0 (U4), paid after the phase | a shield rim with flame tongues | "Fire shield {n}: each blow that wounds it burns the striker for {n}." | Ash Colossus 5, Ash Phoenix 5; Cinder Mantle 3; Cinder Skin 3, Living Pyre 5 | existing: `attacks`; N4; new: resistance reduces the burn |
| `shield.nature` | Thorns, signature 24 | As `shield.fire`, nature | a shield rim with thorns | "Thorns {n}: each blow that wounds it pricks the striker for {n}." | Heartwood Aegis 3; Thornhide 4 | N4 tests |

#### Resistances (U4)

| Id | Name, placement | Exact rule | Glyph | One line (positive / negative) | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `resist.fire` | Fire resistance / weakness, element | U4: damage base −= n for fire, in weapons, spells, shields, and remote damage | outline flame with ▲ (resists) or ▼ (weak) | "Fire resistance {n}: fire hits deal {n} less." / "Fire weakness {n}: fire hits deal {n} more." | Salamander +10, Fire Sprite +10, Flamebrand +3, Oakheart −3, Treant −5; Moss Mantle +5; Ash Colossus, Ash Phoenix, Cinder Idol +10 | new: A.7 tests |
| `resist.nature` | Nature, element, **M2** | as fire | outline leaf with ▲ or ▼ | "Nature resistance {n}: nature hits deal {n} less." / "... {n} more." | none in M1 | the shared U4 tests cover every element |
| `resist.cold` | Cold, element, **M2** | as fire | snowflake with ▲ or ▼ | "Cold resistance {n}: cold hits deal {n} less." / "... {n} more." | none in M1 | as above |
| `resist.holy` | Holy, element, **M2** | as fire | outline sun disc with ▲ or ▼ | "Holy resistance {n}: holy hits deal {n} less." / "... {n} more." | none in M1 | as above |
| `resist.decay` | Decay, element, **M2** | as fire | skull in an outline drop with ▲ or ▼ | "Decay resistance {n}: decay hits deal {n} less." / "... {n} more." | none in M1 | as above |

The element outlines differ from the filled mana symbols, so "deals fire" never reads as "costs
R" (presentation research 3.10; UI spec rule 8).

#### Weapon properties (chips on the weapon's line)

| Id | Name, placement | Exact rule | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `armorPiercing` | Armor piercing, weapon | Protection counts `floor(prot × BATTLE.armorPiercingFactor)` | a split shield | "Armor piercing: halves the target's protection." | Flame Touch, Burning Talons; Hunter's Spear, The Unquenched; Flaming Weapons; Ember Dart | existing |
| `armorNegating` | Armor negating, weapon | Protection counts 0 | a crossed-out shield | "Armor negating: ignores protection entirely." | Sting | existing |
| `charge` | Charge, weapon; condition "first melee round" | `firstRoundBonus` added in the group's first melee round, unless the target braces (U3) | two forward chevrons | "Charge +{n}: +{n} damage in its first melee round, unless the foe holds a reach weapon." | Lance +3; Blazing Charge +5 | existing; new: U3 |
| `reach` | Reach, weapon | U3: a troop whose group holds a reach melee weapon, and is not fleeing, takes no `firstRoundBonus` | a polearm with a brace bar | "Reach: a charging foe gains no charge bonus against it." | every Spear, Halberd, Hunting Spear; Hunter's Spear | new: U3 (A.6) |
| `strikes` | Strikes, weapon | N2: `strikes` swings per troop per melee phase, each drawn and rolled as one attack | two parallel slashes with ×n | "Strikes {n}: swings {n} times each round with this weapon." | Brand of Ash 2, The Unquenched 2 | N2 tests; new: item weapons |
| `trample` | Trample, signature 10 | N2: swings only at candidates of size ≤ m; no swing and no draw when none stand | a hoof print over a small figure | "Trample: {n} extra blows each round; it hits only bodies of size {m} or less." | Primordial, Elder Wyrm | N2 tests |

#### Boosters (I6)

| Id | Name, placement | Exact rule | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `booster` | Booster, signature 28; condition "has {color}" | I6: +n pips in a color the bearer already has, capped at `MAX_PIPS`, for casting and forging only | the color's mana symbol with a small "+" | "+{n} {color} pip for casting and forging, if it already has {color}." | Crown of Embers R+1, Heart of Kharnath R+2, Thistle Rod G+1, Crown of the Ivy King G+1 | new: `pips` (`castingPips`), `research` (ignores boosters), forge and unequip validation |

#### Battle-start triggers (pretender N1)

| Id | Name, placement | Exact rule (effects; source) | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `primordialFear` | Fear, signature 11 | debuff mor −2, battle, allEnemy; own source | a staring eye with tremble lines | "Fear: at battle start, every enemy fights at −2 morale for the whole battle." | Primordial | N1 test 3 |
| `kindleTheHost` | Kindle the Host, signature 12 | summon fireSprite × 6, friendly; own source | a flame with rising sparks | "Kindle the Host: at battle start, 6 Fire Sprites rise beside it." | Pyre Lord | N1 test 1 |
| `callTheHunt` | Call the Hunt, signature 13 | summon wolf × 8, friendly; own source | a horn with a paw | "Call the Hunt: at battle start, 8 Wolves run to its side." | Horned Hunter | N1 test 2 |
| `barkskinSeed` | Barkskin, signature 15 | buff prot **+2**, battle, friendlySquad; **source `barkSkin`** | a seed with bark rings | "Barkskin: at battle start, its largest squad grows bark: +2 protection for the battle." | Seed of Barkskin | new: C.13 triggers |
| `ivyGrasp` | Ivy Grasp, signature 16 | debuff def −3 and att −1, rounds 5, enemySquad (Entangle's effects); **source `entangle`** | a coiled vine | "Ivy Grasp: at battle start, vines bind the largest enemy squad: −3 defense, −1 attack, 5 rounds." | Crown of the Ivy King | new: C.13 triggers |

The Codex adds for the two copies: "Bark Skin never lands twice on one squad: a druid's Bark Skin
picks the next squad." and "Entangle never binds a squad twice: Ivy Grasp and a druid's Entangle
bind two different squads. Regrowth lifts either."

#### Bodies, chassis, and nations

| Id | Name, placement | Exact rule | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `researches` | Researches, body | Only bodies without `research: false` research (`canResearch`) | an open book | "Researches: this god studies in a lab like a mage." | Oracle of the Flux | existing: `research` |
| `dominionEngine` | Dominion engine, body | Its dominion checks count twice (`ChassisDef.dominionFactor` 2) | a candle with ×2 | "Dominion engine: its monthly dominion checks count twice." | Living Monolith | existing: `dominion` |
| `monthlySummon` | Brood, signature 31 | Pretender N7 | a crescent moon over a paw | "Brood: {n} {unit} join it each month in its own dominion, up to {m} in all." | Mother of Beasts, Cinder Idol | N7 tests |
| `reform` | Undying, signature 30 | Pretender N8 | a flame inside a circular arrow | "Undying: killed in its own dominion, it rises at the capital {n} days later." | Ash Phoenix | N8 tests |
| `avatar` | Avatar, signature 32 | Pretender A.7: the god is blessed in a province its nation dominates | a crown with a halo | "Avatar: the god itself is blessed when it fights in its own dominion." | Ascended Hero; the Avatar boon | pretender tests |
| `bound` | Bound, state | Pretender N5: a bound squad that breaks never drags its leader | a chain link | "Bound: when it breaks, it never drags its leader from the field." | battle summons; bound monthly summons | N5 tests |
| `forestHome` | Forest home, body; condition "in a forest" | `homeTerrain`: +1 def in forests, on either side | a tree | "Forest home: +1 defense in forest provinces, attacking or defending." | every Thornwood unit | existing: `setup` |

**Counts:** 42 entries. 37 have M1 users. The 5 M2 entries (undead, and nature, cold, holy and
decay resistance) exist so the type and the Codex's Elements page are complete; they are marked
M2 and exempt from the orphan rule. The draft's `burningHost` is gone (R2): the Horn is an
`inspire` user.

### B.6 Reconciliation with the pretender final

The pretender final (`../pretender-design/final.md`, approved by the owner with every default)
defines N1 to N8 and the blessing menu. This catalog takes its three abilities and every
blessing effect unchanged in behavior. The conflicts, each with its ruling:

| # | Pretender final says | This design says | Ruling |
|---|---|---|---|
| P1 | N1: `UnitAbility { id, name, trigger, color, effects }`, `abilityDef(id)`, `UnitDef.abilities?: readonly AbilityId[]` | the catalog's trigger kind with display fields; `triggerDef`; `TriggerAbilityId[]` | **Amend N1**: the same fields plus `kind: 'trigger'` and the display fields. Two lines of code change (B.1). Its tests stand |
| P2 | N1: "the id is the source id of the stat changes" | a trigger may name a copied spell in `sourceId` (D20, M7) | **Amend N1** by one optional field and `abilitySource(a)`. The three pretender abilities have no `sourceId`, so their logs are unchanged |
| P3 | E.2: element resistances are M2 | U4 in M1 for units and items | **Owner sign-off** (E.7 Q1). The breath color stays display only (pretender D6) |
| P4 | A.4: the Living Monolith is sim size 1, drawn larger (`visualSize`) | size 6 in the sim (R5) | **Amend A.4**: size 6. No idol uses `visualSize` any more. Measured: no battle changes; its `aiPower` (measured alone) is unchanged |
| P5 | A.6: blessing regeneration folds into stats by adding | U5: the single best source counts | **Amend A.6's fold** to `max`. It changes only Avatar bodies with regeneration of their own (Wild Spirit, World Tree, Elder Wyrm): measured, the Avatar Elder Wyrm with Greater Evergreen goes from 92.8% to 68.5% in the mountain fixture and stays at 100% elsewhere; the Avatar Wild Spirit with Evergreen goes from 5.5% to 1.3% against the weak plains (it is a raider and loses those fights either way). The designer greys such a regeneration blessing for the god with "(inactive on your god: its own regeneration is as high)" and keeps it for sacred troops |
| P6 | A.4 supply: commanders eat 1 | U2: every body eats its size | **Amend**: pretenders eat 2 to 6 a day. Nothing starves at today's supply |
| P7 | (no body plans) | every chassis body has a body plan (C.3) | **Add** `CommanderTraits.body` to the 16 bodies (A.11 table) |
| P8 | N2: trample filters targets | U1: weighted draw | **Order**: the N2 filter runs first, then U1's draw. The sentence is "Trample hits only bodies of size {m} or less" |
| P9 | A.10: duel bands with armies | U1 moves god-led army fights by 3 to 10 points | **Re-measure** the army bands after 7b.1. Lone duels are unchanged |
| P10 | A.11: `aiPower` counts the body and its summons | items add strength the AI does not see | **Known limitation**, recorded in `docs/08`: `armyPower` does not count items. Phase 12 may add an item term |
| P11 | `docs/05`: a pretender arrives as its body | items | **Add**: a pretender arrives with no items; recall (Godless) sends its items to its nation's vault; a reformed Ash Phoenix returns without them (its items went to the battle's winner) |
| P12 | (reported, not changed) | J2 measured a Great Wyrm with Avatar and Evergreen (10%, prot +1) and no items at 95.3% alone against Cinder's start | **For the pretender track's Phase 12**: this design does not change it (the Wyrm has no regeneration of its own) |

No conflict remains on N3, N4, N5, N7 or N8: the catalog only names them.

### B.7 What a new ability must bring (M2 and beyond)

1. A `docs/02` section 5 primitive, an existing field, or one new rule that passes A.1.
2. Its catalog entry: name, glyph, one line, codex text, placement, condition.
3. Its tests, in the file of the rule it touches.
4. Its fixtures (CLAUDE.md), and a look cue if it fires in battle (pretender C.5).

---
## C. Items

Dominions forges items like a ritual: "the order 'Forge Item' to a mage in a laboratory", with
the nation's gems and its Construction level, and the item goes "into the national inventory"
([Dom6 manual ch. 7](https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html); [ch.
5](https://dmacguigan.github.io/dom6-manual/chapters/05-movement.html), turn order). Its slots
follow the body: 76% of Dom6 units have the humanoid set, and 13% only two misc slots (items
research 1.3, computed from [dom6inspector](https://github.com/larzm42/dom6inspector/tree/master/gamedata)).
Players love building a commander to fight alone (a "thug"), and they find handing "1-6 magical
items ... to >60 units" tedious ([Quarter to
Three](https://forum.quartertothree.com/t/dominions-5-warriors-of-the-faith/131532?page=16),
search extract). FM keeps the first and avoids the second: few slots, labs as the only door,
and an AI that equips its own commanders.

### C.1 The rules, one sentence each

These are the sim rules. Each is tested alone (C.13). I8 (leadership and sight items) is M2,
with the generic items (S1).

| # | Rule | Sentence |
|---|---|---|
| **I1** | Forge | "A mage in an own lab forges an item: it needs the item's pips and research level, pays its mana when the work begins, works for its forge days, and the item then goes to the vault." |
| **I2** | Vault | "Forged and won items wait in the nation's vault, which any own lab reaches." |
| **I3** | Equip | "A commander standing in an own lab can take an item from the vault into a slot, or put one back." |
| **I4** | Slots | "A commander wears items only in the slots its body has, one per slot, and never two of the same item." |
| **I5** | Effects | "An item adds its numbers and abilities to its wearer; a weapon item replaces its melee weapons." |
| **I6** | Boosters | "A booster adds pips only in a color its wearer already has, for casting and forging, never for research." |
| **I7** | Inspire | "Inspiration adds to the morale of every squad its wearer leads; several inspiring items add up." |
| **I9** | Spoils | "A commander who dies in or because of a battle leaves its items to the nation that holds the field; Independents destroy them." |
| **I10** | Artifacts | "An artifact is unique: nobody may begin forging it while it is being forged or exists." |
| **I11** | Item HP | "An item's HP counts on both current and maximum HP; taking it off removes both, never below 1." |

Only commanders wear items. Troops are counts with one HP pool (`Squad`), so items could not
attach to them anyway (items research 1.3). This is one sentence in the Codex.

### C.2 Forging

**Why a command and not generated rituals** (D11): a ritual per item would put 20 records in the
spell registry. They would show in the Research panel's spell lists and the Codex's spells, the
AI's ritual step would see them, and they would break the content tests that match the spell
registry to the `docs/02` lists (`tests/content/spells.test.ts`). A sibling order shares the
ritual helpers instead.

**Shared helpers, narrowed** (M11). Today `meetsRequirement`, `extraPips` and
`requirementSlots` take a `SpellDef`, and `ritualPayment` a `RitualSpellDef`. They read only a few
fields, so they take narrowed shapes that both spells and items satisfy. No call site changes:

```ts
// src/content/spells/types.ts
/** What the pip check reads. SpellDef and ItemDef both fit. */
export interface Requirement { requirement: string; holy?: number }
/** What a payment reads. RitualSpellDef and ItemDef both fit. */
export interface ManaBill { name: string; color: Color | null; cost: { mana: ManaAmounts; generic: number } }

// src/content/spells/index.ts
export function requirementSlots(req: Requirement): readonly (readonly Color[])[];   // the WeakMap cache keys on Requirement
// src/sim/pips.ts
export function meetsRequirement(pips: Pips, holy: number, req: Requirement): boolean;   // reads req.holy ?? 0
export function extraPips(pips: Pips, holy: number, req: Requirement): number;
// src/sim/rituals.ts
export function ritualPayment(pool: Readonly<ColorAmounts>, bill: ManaBill, split?: ManaAmounts): ColorAmounts | string;
/** Takes the payment from the nation's pools and counts it in manaSpent (moved out of beginRitual). */
export function payMana(state: GameState, nation: NationId, pay: ColorAmounts): void;
```

**The command and the order** (`src/sim/commands/types.ts`, `src/sim/types.ts`). Variants
discriminate on `type`, and `nation` sits on the `Command` intersection, as today:

```ts
export type Command = { nation: NationId } & (
  /* ...today's variants... */
  /**
   * Begin forging an item. `generic` splits the generic cost between pools in whole amounts;
   * by default it comes from the item's color, then the largest pools (as castRitual).
   */
  | { type: 'forgeItem'; commander: CommanderId; item: ItemId; generic?: ManaAmounts }
  /** Take an item from the vault into a slot; the item's kind picks the slot when it is left out. */
  | { type: 'equipItem'; commander: CommanderId; item: ItemId; slot?: ItemSlot }
  /** Put the item in a slot back into the vault. */
  | { type: 'unequipItem'; commander: CommanderId; slot: ItemSlot }
);

// CommanderOrder gains (the progress lives in the order, as castRitual's does):
| { kind: 'forge'; item: ItemId; daysLeft: number }
```

**Validation** (`validateForgeItem` through `forgeBlocker`, first problem only; the UI shows the
string):

| # | Check | Refusal |
|---|---|---|
| 1 | an own commander | "That commander is not yours" |
| 2 | a known item | "Unknown item" |
| 3 | not the garrison holder | "{name} forges no items" |
| 4 | not in transit | "{name} is on the move" |
| 5 | standing in a lab in a province its nation owns (`inOwnLab`) | "Items are forged in a lab in a province you own" |
| 6 | the nation is not Godless (as for rituals, `docs/02` decisions) | "{nation} is godless and cannot forge" |
| 7 | casting pips meet the requirement (`meetsRequirement(castingPips(c), c.holy, item)`; I6 boosters count) | "{name} needs RR to forge {item}" |
| 8 | research: the item's color at its level | "{item} needs Ember level 3" |
| 9 | artifacts (I10, `artifactStatus`) | "{item} already exists" / "{item} is being forged" |
| 10 | mana, split as `generic` says or by default (`ritualPayment`) | the payment's own message, as for rituals |

**Apply.** It pays the whole cost (`payMana`) and sets the order `{ kind: 'forge', item,
daysLeft: item.forgeDays }`.

**Progress.** `progressForging(state)` runs in tick step 3, right after `progressRituals`, with
its day semantics: `daysLeft − 1` a day. At 0 it re-checks rows 3 to 8 (not mana; the artifact
check ignores the forger's own order, which is the reservation). On success the vault gains the
item, the order becomes Idle, and the owner gets "Varo forged Brand of Ash at Kharnath." On
failure the order becomes Idle, nothing is refunded, and the message names why: "Varo could not
finish Brand of Ash: the lab at Kharnath is lost".

**Interruption.** Exactly as for rituals: any other order, a move, a retreat, or death ends the
work, and the mana is lost. An artifact's reservation ends with the order.

**No scale changes** forge days, as no scale changes `castDays`.

### C.3 Slots and body plans

Five slots: **weapon, head, body, charm, charm** (D12).

```ts
// src/content/items/slots.ts
export const ITEM_SLOTS = ['weapon', 'head', 'body', 'charm1', 'charm2'] as const;
export type ItemSlot = (typeof ITEM_SLOTS)[number];
export type ItemKind = 'weapon' | 'head' | 'body' | 'charm';   // charm items go in charm1 or charm2
export const BODY_PLANS = {
  humanoid: ['weapon', 'head', 'body', 'charm1', 'charm2'],
  wyrm: ['head', 'charm1', 'charm2'],
  beast: ['charm1', 'charm2'],
  idol: ['charm1'],
  none: [],
} as const satisfies Record<string, readonly ItemSlot[]>;
export type BodyPlanId = keyof typeof BODY_PLANS;
/** The paper doll's line for a missing slot. */
export const BODY_PLAN_LINES: Record<BodyPlanId, string> = {
  humanoid: 'Two hands, a head, a body, and two charms.',
  wyrm: 'A wyrm has no hands: head and charms only.',
  beast: 'A beast carries only charms.',
  idol: 'An idol holds a single charm.',
  none: 'It wears nothing.',
};
// CommanderTraits.body: BodyPlanId   (content; validated)
```

| Plan | Slots | Why (Dominions' layout, items research 1.3) | M1 commanders |
|---|---|---|---|
| **humanoid** | weapon, head, body, 2 charms | two hands, head, body, misc | Scouts, Ash Chieftain, Warden Captain, Pyre and Grove Priests, Ember Adept, Cinder Magus, Sapling and Elder Druids, Independent Captain; Oracle, Titan, Ash Colossus, Ascended Hero, Pyre Lord, Ember Hierophant, Horned Hunter, Mother of Beasts |
| **wyrm** | head, 2 charms | the Dragon and Phoenix layout: no hands | Great Wyrm, Ash Phoenix, Primordial, Elder Wyrm |
| **beast** | 2 charms | the Salamander and Treelord layout | Salamander, Treant, Wild Spirit |
| **idol** | 1 charm | the Monolith layout | Living Monolith, Cinder Idol, World Tree |
| **none** | — | takes no orders | the garrison holder |

**Validation:** every commander unit has a plan; `immobile` bodies are `idol` or `none`;
`beast`-tagged commanders are `beast` or `wyrm`. **Size never blocks an item**: magic fits its
wearer, as Dominions lets a size-9 Moloch use every slot. The plan is authored per body, so a
future centaur needs only a new plan (M2: `rider`, with a barding slot).

### C.4 Tiers, prices, and the research path

| Tier | Shape glyph | Research level | Requirement | Colored mana | Generic mana | Forge days |
|---|---|---|---|---|---|---|
| **Lesser** | ○ circle | 1 | 1 pip | 4 | 0 | 10 |
| **Greater** | ◆ diamond | 2 to 3 | 2 pips | 8 | 2 | 15 |
| **Artifact** | ★ star | 4 | 3 pips | 12 | 8 | 30 |

```ts
// src/content/rules.ts
export const ITEM_RULES = {
  /** Colored mana per requirement pip. */
  manaPerPip: 4,
  tiers: {
    lesser:   { pips: 1, minLevel: 1, maxLevel: 1, generic: 0, days: 10 },
    greater:  { pips: 2, minLevel: 2, maxLevel: 3, generic: 2, days: 15 },
    artifact: { pips: 3, minLevel: 4, maxLevel: 4, generic: 8, days: 30 },
  },
} as const;
```

- **Formula:** colored mana = `manaPerPip` × requirement pips, plus the tier's generic. A content
  test checks every item against it. (The draft's "+2 per pip beyond the third" never applied to
  an M1 item and is gone.)
- **Against income** (items research 7.4, the Phase 6 dummy over 10 games): own-color mana runs
  about 7 a month early, 10 to 12 by months 12 to 18, and 15 by month 24. A Lesser item is about
  half a month of early income; an artifact (20) is about two months of mid-game income. Rituals
  cost 2 to 18 (`docs/02` section 6).
- **The research path** (M14). Nations start at level 1 (`startingResearch`), so Lesser items
  exist from day 1. Research gives `3 + 2 × pips` points a month per researcher, and the level
  thresholds are `[0, 60, 150, 300, 500, 750, 1050]` (`docs/02` section 4).

  | Researchers from month 1 | Points a month | Level 2 (Greater) | Level 3 (Greater) | Level 4 (Artifact) |
  |---|---|---|---|---|
  | the starting apprentice and priest (both 1 pip) | 10 | month 9 | month 24 | month 44 |
  | four 1-pip researchers | 20 | month 4.5 | month 12 | month 22 (`docs/PROGRESS.md`: day 660) |
  | four 1-pip and one 2-pip (the adept tier) | 27 | month 3.3 | month 8.9 | month 16.3 |

  The mean runner game lasts about 27 months (`docs/PROGRESS.md`). So a nation that invests in
  research sees artifacts in an ordinary match, and one that does not sees Greater items late.
  That is the decision: the Research panel prints "Next item tier: Greater at level 2, in about
  5 months" beside the level bar, and the Codex's Items page groups items by level. 7b.3
  measures this with the Phase 7 AI before content lock (E.3 item 5).
- **Measured guide to effect sizes** (items research 7.2; this design's runs). Protection is the
  steepest lever on big bodies: +1 takes a Great Wyrm from 12.8% to 31.3% against Cinder's
  starting army. So protection items stay at +1 (Lesser), +2 (Greater), and +3 (Artifact).
  Damage barely helps a body that already kills a man per blow; extra strikes do.

### C.5 The M1 items

Each item passes the `docs/02` color pie. Red never defends: its items have no protection or
defense. Green never flies, evades, or aims: its items have no defense bonus and no precision.
"Measured" is the attacker's win %, 400 seeds, with the final unit rules (`proto/measure-items*.out.md`,
`final-measure/final*.out.md`). "16 independents" is 11 Light Infantry and 5 Archers under an
Independent Captain. Dominions analogs are from the [Dom6 manual ch.
10](https://dmacguigan.github.io/dom6-manual/chapters/10-magic-items.html) and [ch.
11](https://dmacguigan.github.io/dom6-manual/chapters/11-path-boosters.html).

#### Red (Ember): 10 items

| Item | Tier, slot | Req, level | Cost, days | Exact effects | Card line | Measured | Dominions analog |
|---|---|---|---|---|---|---|---|
| **Flame Blade** | ○ weapon | R, 1 | 4 R, 10 | weapon `Flame Blade` dmg 7, fire | "A blade that never stops burning: dmg 7, fire." | Titan unchanged (40.3% against 16 independents; its Great Sword 8 is better, so the AI never gives it one, C.10). Human generals: Axe 5 or Sword 4 becomes 7 fire | Fire Sword |
| **Pendant of Fury** | ○ charm | R, 1 | 4 R, 10 | inspire 1 | "The squads it leads fight with +1 morale." | Ash Chieftain's army: 39.5 → 45.0 against Thornwood's start, 77.3 → 82.3 against 20 Heavy Infantry | Pendant of Courage, Horn of Valor |
| **Burning Pearl** | ○ charm | R, 1 | 4 R, 10 | att +2 | "A coal that never cools in its hand: +2 attack." | about +15 points per blow at equal skills (46.1% → 61.5% to hit); part of the Red Titan kit (87.0%) | Burning Pearl (att +4) |
| **Cinder Mantle** | ◆ body | RR, 2 | 8 R + 2, 15 | hp +6; fire shield 3 | "Burns whoever strikes it: hp +6, fire shield 3." | Titan alone: 40.3 → 49.5 against 16 independents; with Brand of Ash 81.5 | Red Dragon Scale Mail |
| **Pyre Staff** | ◆ weapon | RR, 2 | 8 R + 2, 15 | weapon `Pyre Staff` dmg 3, fire; spell power 2 | "Its spells burn hotter: spell power +2." | Ember Dart 12 → 14, Fireball 10 → 12, Pyre Storm 14 → 16 (N3) | Wand of Wild Fire |
| **Crown of Embers** | ◆ head | RR, 2 | 8 R + 2, 15 | booster R +1 | "+1 Red pip for casting and forging, if it has Red." | An Ember Adept (R1) casts Fireball and Blood Fury (RR); a Cinder Magus (R2) forges artifacts (RRR) | Flame Helmet |
| **Brand of Ash** | ◆ weapon | RR, 3 | 8 R + 2, 15 | weapon `Brand of Ash` dmg 6, fire, strikes 2 | "Strikes twice a round: dmg 6, fire." | Titan alone: 40.3 → 76.0 against 16 independents | Fire Brand; Holy Scourge (2 attacks) |
| **Horn of the Burning Host** | ◆ charm | RR, 3 | 8 R + 2, 15 | **inspire 2** (R2) | "Its horn rallies the squads it leads: +2 morale." | Ash Chieftain's army: 39.5 → 49.8 against Thornwood's start, 77.3 → 86.8 against 20 Heavy Infantry; **with the Pendant (inspire 3) 52.3** | Horn of Valor |
| **The Unquenched** | ★ weapon | RRR, 4 | 12 R + 8, 30 | weapon `The Unquenched` dmg 9, fire, armor piercing, strikes 2 | "The sword that never cools: dmg 9, fire, armor piercing, strikes twice." | Titan alone: 77.0 against 16 independents; with Cinder Mantle and Burning Pearl 87.0 | Unquenched Sword |
| **Heart of Kharnath** | ★ charm | RRR, 4 | 12 R + 8, 30 | booster R +2 | "+2 Red pips for casting and forging, if it has Red." | A Cinder Magus (R2) casts Pyre Storm (RRR) with a spare pip against fatigue | Orb of Elemental Fire |

#### Green (Loam): 10 items

| Item | Tier, slot | Req, level | Cost, days | Exact effects | Card line | Measured | Dominions analog |
|---|---|---|---|---|---|---|---|
| **Hunter's Spear** | ○ weapon | G, 1 | 4 G, 10 | weapon `Hunter's Spear` dmg 6, armor piercing, reach | "A boar spear: dmg 6, armor piercing, and it blunts charges." | for generals: Sword 4 becomes 6 AP, and the general braces against Ash Riders (U3) | Hunter's Knife |
| **Barkskin Amulet** | ○ charm | G, 1 | 4 G, 10 | prot +1 | "Bark creeps over its skin: +1 protection." | Titan alone: 40.3 → 60.5; Great Wyrm against Cinder's start: 12.8 → 31.3 | Barkskin Amulet |
| **Moss Mantle** | ○ body | G, 1 | 4 G, 10 | fire resistance 5 | "Damp moss smothers flame: fire resistance 5." | against Red's fire weapons and spells (U4) | — (FM's answer to fire) |
| **Thistle Rod** | ◆ weapon | GG, 2 | 8 G + 2, 15 | weapon `Thistle Rod` dmg 3; booster G +1 | "+1 Green pip for casting and forging, if it has Green." | A Sapling Druid (G1) casts Entangle and Swarm (GG) | Thistle Mace |
| **Antler Crown** | ◆ head | GG, 2 | 8 G + 2, 15 | inspire 1, prot +1 | "Its squads fight with +1 morale; +1 protection." | Warden Captain's army: 60.5 → 68.3 against Cinder's start | Horn of Valor |
| **Ring of Regrowth** | ◆ charm | GG, 3 | 8 G + 2, 15 | regeneration 5% (U5: only where it is the best source) | "Its wounds close: regenerates 5% of its HP each round." | Great Wyrm against Cinder's start: 12.8 → 41.0; with the Amulet 69.3. An Elder Wyrm or a Treant gains nothing: their own regeneration is as high | Ring of Regeneration |
| **Barkhide** | ◆ body | GG, 3 | 8 G + 2, 15 | prot +2, hp +6, def −1 | "Living bark grows over its armor: +2 protection, +6 HP, −1 defense." | Titan alone: 40.3 → 67.0 (a wyrm has no body slot) | Green Dragon Scale Mail |
| **Seed of Barkskin** | ◆ charm | GG, 3 | 8 G + 2, 15 | trigger `barkskinSeed`: buff prot **+2** for the battle on its largest squad; source `barkSkin` | "At battle start its largest squad grows bark: +2 protection." | Warden Captain's army: 60.5 → **71.0** against Cinder's start; **with the Antler Crown 76.5** | Handful of Acorns (a battle effect) |
| **Crown of the Ivy King** | ★ head | GGG, 4 | 12 G + 8, 30 | booster G +1; trigger `ivyGrasp` (Entangle's effects for 5 rounds on the largest enemy squad; source `entangle`). **No HP** (M8) | "+1 Green pip; vines bind the largest enemy squad at battle start." | Great Wyrm alone: 12.8 → 24.8 against Cinder's start; Warden Captain's army 60.5 → 70.0; with the Seed 75.8 | Crown of the Ivy King |
| **Heartwood Aegis** | ★ body | GGG, 4 | 12 G + 8, 30 | prot +3, hp +10; thorns 3 (nature shield) | "Heartwood grows over it: +3 protection, +10 HP, thorns 3." | Titan alone: 94.0 against 16 independents; the full Green Titan kit (Aegis, Ring, Amulet, Crown) 100 / 52.3 / 1.8 against 16 independents / 20 Heavy Infantry / Cinder's start | Boots of Antaeus, Blacksteel Plate |

**Slots in use:** weapon 6 items, head 3, body 4, charm 7. Every slot holds at least 3 (D12).

**The strongest M1 kit to watch** (M8). A Great Wyrm wearing Ring of Regrowth, Barkskin Amulet
and the Crown of the Ivy King (34 mana: 24 Green and 10 generic; research level 4) wins **76.0%** alone
against Cinder's starting army and **94.5%** against Thornwood's, up from 12.8% and 31.5%. With
the draft's hp +10 on the Crown it was 86.8% and 96.8%, so the HP is gone. Before the artifact,
the Ring and the Amulet (level 3) give 69.3% and 93.3%. That is Dominions' super combatant on a
220-point body, and M1 has its answers: Green's Swarm and Red's Ember Dart drop a kitted Wyrm to
0% and 59% (items research 7.2). E.3 pins both kits as bands. The first knob is Ring of Regrowth
at 4% (71.8% with the full kit), the second its level (3 → 4 would put it with the artifacts).

**Army items, side by side** (M12; `final.out.md` section 3):

| Army | none | one item | two items on one commander |
|---|---|---|---|
| Ash Chieftain + 20 Cinder Warriors + 10 Flame Archers, attacking Thornwood's start | 39.5 | Pendant 45.0; Horn 49.8 | Pendant + Horn **52.3** |
| Warden Captain + 20 Wardens + 10 Longbow Hunters, attacking Cinder's start | 60.5 | Seed (+2) 71.0; Antler Crown 68.3; Crown of the Ivy King 70.0 | Seed + Antler Crown **76.5**; Seed + Ivy Crown 75.8 |

Each nation's best two-item stack adds 13 to 16 points to its own start. The gap that remains is
the starting matchup's (Thornwood 60.5%), which Phase 12 owns.

**Withdrawn after measuring** (D17, D18, R2):
- a second regeneration item (two 5% items and Barkskin made a Great Wyrm win 95.3% against
  Cinder's start), and now moot under U5;
- Horn of the Wild Hunt (4 wolves at battle start): it cut a general's win from 39.5% to 26.3%;
- the side-wide Horn (`burningHost`): replaced by inspire 2 (R2);
- Giant's Girdle (str +3): no change on a Titan (41%);
- Warded Shield (def +2): it would need a shield slot and a two-handed rule, and def +2 lifted a
  Titan 25 points, too much for a Lesser item;
- the generic items (Fine Blade, Banner of Command, Seer's Lens, Charm of Warding): M2 (S1).

### C.6 Artifacts

- **Unique** (I10). `artifactStatus(state, id): 'free' | 'forging' | 'exists'` scans vaults,
  worn items, and forge orders. No new state. Dominions has the same rule: "You will not be able
  to forge a unique artifact ... that is already in existence" ([manual
  ch. 10](https://dmacguigan.github.io/dom6-manual/chapters/10-magic-items.html)).
- **Reserved when forging begins.** FM runs in continuous time, so Dominions' same-turn tie
  ([illwiki, Dom6 magic](https://illwiki.com/dom5/dom6/magic), search extract) cannot happen. A
  second `forgeItem` is refused with "{item} is being forged". No dice and no lost mana.
- **Destroyed artifacts return to the forge.** Elimination and an Independent victory destroy
  them (C.8), and they can then be forged again. The world gets a message: "The Unquenched is
  lost to the world; it can be forged again."
- **Four in M1**: The Unquenched, Heart of Kharnath, Crown of the Ivy King, Heartwood Aegis. No
  yearning and no per-turn cap: matches are short and artifacts few (items research 1.7).
- **Seen as other gear is** (S3): an enemy's artifact shows in battle reports and replays from
  the roster's items. There is no world list and no badge star in M1.

### C.7 Equipping and transfers

```ts
| { type: 'equipItem'; commander: CommanderId; item: ItemId; slot?: ItemSlot }
| { type: 'unequipItem'; commander: CommanderId; slot: ItemSlot }
```

**Where:** only while the commander stands, not in transit, in a lab province its nation owns.
That is the door `giveMana` uses today. Dominions: "Commanders in a lab can exchange items and
gems with the nation's treasury" ([illwiki Laboratory](https://illwiki.com/dom5/laboratory),
search extract). **Field swaps between commanders are M2.**

**Validation of `equipItem`** (first problem only):

| # | Check | Refusal |
|---|---|---|
| 1 | an own commander | "That commander is not yours" |
| 2 | not the garrison holder | "The garrison takes no orders" |
| 3 | a known item | "Unknown item" |
| 4 | not in transit | "{name} is on the move" |
| 5 | in an own lab (`inOwnLab`) | "Items change hands in a lab in a province you own" |
| 6 | the vault holds one | "No {item} in the vault" |
| 7 | the slot exists on the body and fits the item's kind | the plan's line: "A wyrm has no hands: head and charms only" |
| 8 | not already worn by this commander | "Already wears {item}" |
| 9 | a full slot **swaps**: the old item goes to the vault (one command, so a drag and drop is one action) | (not a refusal) |
| 10 | a swap must not take away a booster that the commander's own forge or ritual still needs (M5): with the old item's boosters removed, `meetsRequirement(castingPips, holy, work)` still holds for its `forge` or `castRitual` order | "{name} needs {item} to finish {work}", e.g. "Varo needs Crown of Embers to finish Brand of Ash" |

`slot` may be left out: the item's kind picks the slot, and a charm takes the first free charm
slot, else swaps `charm1`.

**Validation of `unequipItem`:** rows 1, 2, 4 and 5; "That slot is empty"; and row 10.

**Item HP (I11, M13).** HP items change the commander's state, not only its battle stats:
- `commanderMaxHp(c) = unitDef(c.unit).hp + Σ worn item hp`. It drives healing and starvation
  (`supply.ts`) and the battle's `maxHp` (through `statsFor`, which adds the same HP).
- Equipping adds the item's HP to current HP: `c.hp += hp(new)`. Unequipping removes it:
  `c.hp = max(1, c.hp − hp(old))`. A swap does both: `c.hp = max(1, c.hp − hp(old) + hp(new))`.
  So taking an item on and off never heals, and never kills.
- The battle writes back current HP as today; it can never exceed the item-inclusive maximum.

**Orders are untouched.** Equipping does not interrupt research, rituals, or forging. Row 10
keeps a commander from pulling a booster its own work needs; a forge or ritual still re-checks
pips at completion, for the cases row 10 cannot see (a booster on another commander does not
count).

**Who never equips:** Independents (they issue no commands) and the garrison holder.

### C.8 Death and spoils (exact)

| Event | Where the items go | Where in code |
|---|---|---|
| A commander dies in battle (the result marks it dead) | **The winning nation's vault**, the winner's own dead included. If Independents won: **destroyed** | `battle/apply.ts`, before `commanderDies` |
| A commander dies because of a battle (a loser with nowhere to retreat, or an immobile one that cannot flee) | as above | `conflict.ts retreat`, before `commanderDies` |
| The nation is eliminated | its vault and every item its commanders wear are **destroyed** | `victory.ts` |
| The pretender is recalled (Godless) | its own nation's vault | `pretender.ts recall`, before `removeCommander` |
| The Ash Phoenix reforms (N8) | nothing returns with it: its items went with its death | — |
| Any other death outside battle (none exist in M1: commanders never starve below 1 HP) | its own nation's vault | `dropItems` default |

```ts
// src/sim/items.ts
export type ItemDestination = { kind: 'vault'; nation: NationId } | { kind: 'destroyed' };
/** Moves every item the commander wears, in slot order, to the destination, and posts the messages. */
export function dropItems(state: GameState, commander: CommanderState, to: ItemDestination): void;
```

- **Order:** dead commanders in battle setup order (attacker side first), then retreat deaths in
  the order `retreat` visits them; items in slot order. No rng.
- **Messages:** the winner gets "Spoils at Ashfen: The Unquenched, from Varo the Ember"; the
  loser gets "Lost at Ashfen: The Unquenched (Varo the Ember fell)". Destroyed items read "Lost
  at Ashfen: Flame Blade (destroyed)". A destroyed artifact adds the world message of C.6.
- **Why the winner takes all** (D14). It is deterministic and fits one sentence. Dominions'
  pickup chance (30% to 75% by Construction level for enemy items, [illwiki
  items](https://illwiki.com/dom5/_export/xhtml/items), verified by J2) is dice the player
  cannot plan around. A fallen champion's blade passing to its slayer's nation is the story.
- **Why Independents destroy** (S2). Independents never attack in M1, so this happens only when
  an army loses a commander attacking them; a hoard would need state, a capture hook, and fog
  rules for a rare case. M2 may add hoards.

### C.9 How items fold in

**Battle** (`battle/setup.ts statsFor`, one more argument: the commander's worn items, in slot
order). Additions commute, so only the weapon steps are ordered:

1. Stats: hp, str, att, def, prot, prec add.
2. **Weapon:** the item's weapon replaces every melee weapon (no `range`). Ranged weapons stay,
   so a Great Wyrm keeps its breath (it has no weapon slot in any case). The unit's own weapon
   returns when the item comes off. Dominions: "when the new item is withdrawn, the standard
   item re-appears" ([manual ch. 4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)).
3. **`braces`** (U3) is computed from the weapons after step 2 (M16).
4. The blessing's melee fold (pretender A.6) applies to whatever melee weapon the body now holds,
   so an Avatar god's Flame Blade also gains Flaming Weapons.
5. **Regeneration** is the single best source (U5). Shields merge by element (N4). Resistances
   add. Spell power adds.
6. **Inspire** (I7): in `sideSetup`, every squad led by the commander gets `mor += inspireOf(c)`,
   the sum over its items (the Pendant and the Horn give 3). Provincial defense and garrison
   squads have no leader. Troops summoned during the battle use side-level stats and are not
   inspired. Inspire stacks with Bless and Warcry: they are battle buffs with their own sources;
   inspire is a setup fold.
7. **Triggers:** `BattleCommanderSetup.abilities` holds the body's triggers, then the items'
   triggers in slot order. N1 fires them through `abilitySource` (B.1).
8. **Pips:** `BattleCommanderSetup.pips = castingPips(c)` (I6), so `knownSpells` and the fatigue
   reduction for extra pips both see boosters.
9. **Roster:** `BattleRoster` commanders gain `items: ItemId[]`, so a replay draws the gear and
   the report names the spoils (D.9).

**Map:**
- `castingPips(c)`: for each color with pips ≥ 1, `min(MAX_PIPS, pips + Σ boosts)`. The ritual
  `ritualBlocker`, `forgeBlocker`, `knownSpells`, `extraPips` and the UI read it. `researchRate`,
  `canResearch` and the bless keep reading base pips (I6).
- `commanderMaxHp(c)` includes item HP (I11).

### C.10 The AI: forge and equip

Simple, data-driven, and through the same commands. Every number lives in content.

```ts
// src/content/items/types.ts
export type AiItemRole = 'champion' | 'general' | 'mage';
// ItemDef.ai: { roles: readonly AiItemRole[]; rank: number }
// NationDef.ai.forge: readonly ItemId[]          the nation's forging priority
// src/content/ai.ts
export const AI_ITEMS = {
  /** Mana must be at least this many times the item's cost (the docs/08 ritual rule). */
  manaFactor: 2,
  /** At most this many unworn AI-forged items in the vault before the AI forges again. */
  maxUnworn: 2,
  /** An idle commander this many days or fewer from an own lab detours there to equip. */
  detourDays: 5,
} as const;
```

**A commander's roles** (M4):
- **champion:** its nation's pretender, when the chassis role is leader, fighter, monster, raider
  or summoner (pretender D8);
- **general:** a non-pretender with leadership 40 or more and no color pips; and a pretender whose
  chassis role is leader or summoner;
- **mage:** a non-pretender with color pips whose unit does not default to Bless (priests bless,
  `docs/08` Scripts); and a pretender whose chassis role is mage or idol. A Titan with one nation
  pip is not a mage.

A commander may have several roles. It takes the best item over all of them.

**The weapon rule** (M4). A weapon item is a candidate only when its melee damage beats the
commander's best standard melee weapon: `(str + item.dmg) × (item.strikes ?? 1) > max over the
unit's melee weapons of (str + w.dmg) × (w.strikes ?? 1)`. So a Titan (Great Sword 8) never takes
Flame Blade (7), Hunter's Spear (6), Pyre Staff or Thistle Rod (3), and takes Brand of Ash
((20 + 6) × 2 > 28) and The Unquenched. A mage's Staff 2 loses to Pyre Staff and Thistle Rod.

**Item roles** (content, `ItemDef.ai.roles`):
- champion: Flame Blade, Burning Pearl, Cinder Mantle, Brand of Ash, The Unquenched, Hunter's
  Spear, Barkskin Amulet, Moss Mantle, Ring of Regrowth, Barkhide, Heartwood Aegis;
- general: Flame Blade, Pendant of Fury, Horn of the Burning Host, Hunter's Spear, Barkskin Amulet,
  Moss Mantle, Antler Crown, Seed of Barkskin, Crown of the Ivy King;
- mage: Pyre Staff, Crown of Embers, Heart of Kharnath, Thistle Rod, Crown of the Ivy King, Moss
  Mantle.

**Ranks** (content): The Unquenched, Heart of Kharnath and Heartwood Aegis 10; Crown of the Ivy
King 9; Brand of Ash, Horn of the Burning Host, Ring of Regrowth and Seed of Barkskin 8; Crown
of Embers, Barkhide and Thistle Rod 7; Cinder Mantle, Pyre Staff and Antler Crown 6; Pendant of
Fury and Barkskin Amulet 5; Burning Pearl and Moss Mantle 3; Flame Blade and Hunter's Spear 2.

**Would take** (`aiWouldTake(state, c, item)`, pure): the item has one of the commander's roles,
fits a slot of its body plan that is empty or holds a lower-ranked item, passes the weapon rule,
and is not already worn by it.

**Forge** (a step right after `docs/08` step 8, Rituals, on the same cadence):
1. Take each own commander with the mage role that is idle or researching, stands in an own lab,
   and is not casting or forging. Rituals keep priority: skip mages the ritual step used this
   call.
2. Pick the first item of `NationDef.ai.forge` that passes all of these:
   - `validateCommand(forgeItem)` accepts it with the default split;
   - the nation's mana is at least `AI_ITEMS.manaFactor` × the item's cost;
   - no unworn copy is in the vault, and the vault holds fewer than `AI_ITEMS.maxUnworn` unworn
     items;
   - **a wearer in a lab now** (R7): some own commander standing in an own lab, the forging mage
     included, would take it.
3. Issue `forgeItem`.
4. The research step (`docs/08` step 3) never replaces a `forge` order, which would throw away
   the mana already paid. `docs/PROGRESS.md` records the same rule for rituals.

**Equip** (every planning call): for each own commander standing in an own lab, not in transit,
slot by slot in `ITEM_SLOTS` order, take the highest-ranked vault item it would take, and issue
`equipItem` (into an empty slot, or swapping a lower-ranked item). Ties go by content order.

**Detour** (R7; after the Expansion, Defense and War steps, so it only takes their leftovers): an
own commander that is idle, not part of a target this call, would take some vault item, and
stands within `AI_ITEMS.detourDays` of an own lab, moves to the nearest such lab. The Equip step
then dresses it on a later call.

**Forge priorities** (content):
- Cinder Horde: Pendant of Fury, Flame Blade, Crown of Embers, Cinder Mantle, Horn of the Burning
  Host, Brand of Ash, Pyre Staff, Burning Pearl, The Unquenched, Heart of Kharnath.
- Thornwood: Barkskin Amulet, Antler Crown, Thistle Rod, Ring of Regrowth, Seed of Barkskin,
  Barkhide, Hunter's Spear, Moss Mantle, Crown of the Ivy King, Heartwood Aegis.

**Known limitation:** `armyPower` does not count items (B.6 P10).

**AI behavior tests** (`tests/ai/items.test.ts`):
1. In at least 80% of 20 headless games each AI nation forges an item by month 12.
2. Over those games, at least 80% of AI-forged items are worn within 60 days of being forged, and
   no planning call sees more than `AI_ITEMS.maxUnworn` unworn AI-forged items in the vault.
3. The AI never issues a refused item command.
4. Unit: a Thornwood Titan in the capital lab, with Thistle Rod, Hunter's Spear, Pyre Staff and
   Flame Blade in the vault, keeps its Great Sword; a Cinder Titan takes Brand of Ash.
5. Unit: roles: a Titan, a Pyre Lord and a Horned Hunter are not mages; an Oracle, an Ember
   Hierophant and a Living Monolith are; a Pyre Priest is not; an Ash Chieftain is a general.
6. Unit: the forge step offers only items that a commander in a lab now would take.
7. Unit: an idle general 3 days from a lab, with a vault item it would take, moves there; one 7
   days away does not; one with a target does not.
8. The 365-day determinism hash holds with forging and equipping.

### C.11 Data shapes

```ts
// src/content/items/types.ts
export type ItemTier = 'lesser' | 'greater' | 'artifact';
export interface ItemEffects {
  stats?: Partial<Record<'hp' | 'str' | 'att' | 'def' | 'prot' | 'prec', number>>;
  /** I5: replaces the wearer's melee weapons. */
  weapon?: WeaponDef;
  /** U5: counts only when it is the wearer's best source. */
  regeneration?: number;
  /** N4. */
  shields?: readonly Shield[];
  /** U4. */
  resist?: Partial<Record<DamageElement, number>>;
  /** N3. */
  spellPower?: number;
  /** I7. */
  inspire?: number;
  /** I6: in the item's own color only. */
  boost?: Partial<Record<Color, number>>;
  /** N1 through the catalog: trigger ids only. */
  abilities?: readonly TriggerAbilityId[];
}
export interface ItemDef {
  id: string;
  name: string;
  /** M1 items have one color; generic items are M2. */
  color: Color;
  tier: ItemTier;
  kind: ItemKind;
  /** docs/02 notation: 'R', 'GG', 'RRR'. */
  requirement: string;
  /** Research level in `color`, within the tier's band (ITEM_RULES). */
  level: number;
  cost: { mana: ManaAmounts; generic: number };
  forgeDays: number;
  /** The lore line; its first sentence is the card line (<= 120 characters). */
  description: string;
  effects: ItemEffects;
  ai: { roles: readonly AiItemRole[]; rank: number };
}
// ItemDef satisfies Requirement and ManaBill (C.2).
// src/content/items/index.ts:  export const ITEMS = { ...RED_ITEMS, ...GREEN_ITEMS } as const satisfies Record<string, ItemDef>;
//                              export type ItemId = keyof typeof ITEMS;   export function itemDef(id: ItemId): ItemDef;
// src/content/presentation/items.ts (the sim never reads it): ItemLook { part, variant, glow?: Element, sound? }
```

**Content validation** (`tests/content/items.test.ts`):
- ids are unique, and none clashes with a spell or ability id;
- the requirement parses, has one color equal to `color`, and has the tier's pip count;
- the level is within the tier's band; the cost equals `ITEM_RULES`' formula; the forge days
  equal the tier's;
- the kind exists on at least one body plan;
- a weapon item's weapon is melee (no `range`), and only weapon items carry a weapon;
- abilities are trigger entries;
- boosts are positive and only in the item's own color;
- Red items carry no prot or def above 0, and Green items no def or prec above 0 (the color pie
  as a test);
- regeneration is at most `BATTLE.maxRegeneration`, and resistances are within −10 to 20;
- the description's first sentence is at most 120 characters;
- every item has a look, and two items with the same look and kind have equal effects (Battle
  Brothers' lesson, [Dev Blog #34](https://battlebrothersgame.com/dev-blog-34-new-armor-helmet-rework-banners/),
  search extract);
- every item is in its nation's `ai.forge` list exactly once.

### C.12 State and save changes

```ts
// src/sim/types.ts
export interface CommanderState {
  /* ...today's fields... */
  /** Worn items by slot; {} for every new commander, arrival, and summoned commander. */
  items: Partial<Record<ItemSlot, ItemId>>;
}
export type CommanderOrder =
  /* ...today's variants... */
  | { kind: 'forge'; item: ItemId; daysLeft: number };
export interface NationState {
  /* ...today's fields... */
  /** A multiset: plain items have no identity in M1. */
  vault: Partial<Record<ItemId, number>>;
}
// src/sim/battle/events.ts  BattleRoster commanders gain items: ItemId[]
```

- **One `STATE_VERSION` step**, after the pretender's. Its migration adds `items: {}` on every
  commander, `vault: {}` on every nation, and `items: []` on stored roster commanders. No save
  exists before Phase 9, so the migration runs only on fixtures, as the battle design notes for
  its own step.
- **Hash.** The determinism hash covers the new fields. Its expected value changes once, in the
  commit that adds them.
- **No item instances.** Items have no durability, rolls, or history in M1, so counts suffice.
  Item history ("slew the Ash Chieftain at Kharsk Ford") is M2.
- **Selectors** (`src/sim/items.ts`): `castingPips`, `itemsOf(c)`, `itemHp(c)`, `inspireOf(c)`,
  `artifactStatus`, `itemLocations(state, nation)` (own vault, worn, being forged), `forgeBlocker`,
  `equipBlocker`, `aiWouldTake` (in `src/ai/`).

### C.13 Tests (`tests/` mirroring `src/`)

- **I1 Forge** (`tests/sim/items.forge.test.ts`):
  - forging pays, counts down, and puts the item in the vault on its last day;
  - every refusal row of C.2;
  - another order, a move, a retreat, or death ends it with the mana lost;
  - the completion re-check fails with a message when the lab is lost;
  - a booster lets an R1 adept forge an RR item;
  - `ritualPayment` and `meetsRequirement` give the same results for every M1 spell as before the
    narrowing (a regression over the spell registry).
- **I2, I3** (`tests/sim/commands/items.test.ts`):
  - equip and unequip only in an own lab, standing still;
  - a swap sends the old item to the vault;
  - the garrison holder and foreign commanders are refused;
  - **row 10**: unequipping or swapping out Crown of Embers from an R1 adept forging Brand of Ash
    is refused with "Varo needs Crown of Embers to finish Brand of Ash"; the same unequip on an
    idle adept is accepted; a booster the work does not need (an R2 magus) is accepted.
- **I4:** a body plan without the slot refuses with the plan's line; duplicates are refused;
  charms fill `charm1` then `charm2`.
- **I5** (`tests/sim/battle/setup.test.ts`):
  - `statsFor` adds item stats;
  - a weapon item replaces melee weapons and keeps ranged ones;
  - the unit weapon returns after unequipping;
  - shields merge by element; resistances and spell power add; regeneration takes the best (U5);
  - `braces` follows the final weapons (U3 test 5);
  - an Avatar god's item weapon takes the blessing's melee fold.
- **I6:** `castingPips` adds only in colors with a pip and caps at `MAX_PIPS`; `knownSpells` sees
  boosted pips; `researchRate` does not.
- **I7:** inspire raises the morale of led squads only (not PD, the garrison, other commanders'
  squads, or battle summons); the Pendant and the Horn on one commander give +3.
- **I9** (`tests/sim/items.spoils.test.ts`):
  - the winner's vault takes a dead enemy's items and its own dead's items;
  - an Independent win destroys them, and a destroyed artifact can be forged again;
  - a retreat death goes to the winner;
  - elimination destroys;
  - recall goes to the own vault;
  - the order of messages is fixed.
- **I10:** a second forge of an artifact is refused while one is forging or exists; it is
  allowed after the holder's nation is eliminated.
- **I11** (`tests/sim/items.hp.test.ts`): equipping Heartwood Aegis on a 14-HP captain at 9 HP
  gives 19 of 24; unequipping gives 9 of 14; unequipping at 6 of 24 gives 1 of 14, not 0 and not
  −4; supply healing stops at the item-inclusive maximum; starvation drains 2% of it a day;
  `statsFor` and `commanderMaxHp` agree.
- **Triggers from items** (`tests/sim/battle/abilities.test.ts`):
  - Seed of Barkskin and Ivy Grasp fire in round 1, in slot order after the body's;
  - the Seed's `buff` carries source `barkSkin`, and a Grove Priest's Bark Skin in the same round
    lands on the next-largest squad, so no squad gets +5 (M7);
  - Ivy Grasp's `buff` carries source `entangle` and `untilRound` 5; a druid's Entangle binds a
    different squad; Regrowth lifts Ivy Grasp;
  - without the item, no `ability` event and an unchanged log.
- **Determinism:** the hash test over 365 days with AI forging and equipping, twice, equal.
- **Fixtures** (CLAUDE.md): all 20 items and all body plans in the content fixtures.

### C.14 What items never do in M1

They do not:
- raise their own wearer's morale (inert: a commander routs with its last squad);
- grant spells to non-mages;
- add research points;
- change the bless;
- give carried mana, gold, materials, or monthly mana;
- reach troops, except through inspiration and battle-start triggers;
- raise leadership or sight (M2, S1);
- curse, weigh, wear out, roll random stats, or form sets;
- summon troops for an army (D18);
- stack regeneration (U5).

Each is a rule that does not earn its place in M1. Several return in M2 (E.2).

---
## D. Presentation layers

The UI spec defines the layers: L0 glance, L1 hover (Shift for L1+), L2 concept, L3 panel, and L4
screen (UI spec 1.1). It defines one `UnitCard` with six variants (UI spec 6.4). Every game in
the presentation research layers unit detail the same way: a glance card with identity, state,
and a few numbers; a hover with the full block; a detail view with sources and gear; an
encyclopedia that compares. Hidden roll-changers are the most common complaint (presentation
research 0.1). This part fills in what units and items show at each layer.

### D.1 Rules

1. **Budgets are content and are tested.** `UI.unitCard` in `src/content/ui.ts` holds
   `maxNumbers: 3`, `maxGlyphs: 3`, `maxElementMarks: 1`, `oneLineMax: 120`, and
   `sizeScale: [0.62, 0.74, 0.86, 1, 1, 1]`. A UI derive test fails when any unit's card exceeds
   them. **The recruit variant's cost row** (gold, materials, days per batch) is that variant's
   own line and is exempt from `maxNumbers`, by name, in the test (M10). Civilization VI raises a
   data error when a unit has more than four stats to show (presentation research 1.4, [CQUI's
   copy of unitpanel.lua](https://raw.githubusercontent.com/CQUI-Org/cqui/master/Assets/UI/Panels/unitpanel.lua),
   verified by J2).
2. **Silence for zero and none.** Zero resistances, an empty ability list, MR, and leadership on
   troops never render. Empty table columns are dropped.
3. **Per troop, then the squad.** Stats are per troop. A squad adds its count, HP%, and state.
4. **Nothing that changes a roll is hidden.** Every modifier the resolver applies shows in three
   places: the stat's Shift breakdown, the per-blow detail (battle design S1.3), and the Codex.
   That now includes gear, items, size, reach, resistance, and the regeneration source that
   counts.
5. **One number, one source.** Every number comes from a sim selector, run with a trace for
   breakdowns or with a what-if override for previews (UI spec rule 3). Equip deltas use the
   same fold as battle setup.
6. **One home per fact.** A weapon's properties live on its line. Gear composition lives on the
   Protection row, and materials composition (fittings included) on the cost row.
7. **Glyph, word, and number, never hue alone.** Deltas carry a sign and ▲ or ▼. Elements carry
   outline glyphs. Tiers carry shapes (○ ◆ ★) beside the mana symbol. Sizes carry a silhouette
   and the word.
8. **Size reads before anything is read.** Cards draw sprites to `sizeScale` on a shared
   baseline, so sizes 4 to 6 fill the frame alike; every card of a body that is not man-sized
   therefore carries the size silhouette (12 px) beside its name, and the Codex's Sizes page
   (D.5) draws every body at true scale.

### D.2 The unit card (L0)

**The sprite is the first stat.** It is the battle sprite: the nation's armor and weapon layers
picked from the gear ids, plus the shield, the mount, and a commander's item parts. It is drawn to
scale on a shared baseline (`UI.unitCard.sizeScale`). Size 4 and up fills the frame and breaks its
top edge by up to 8 px.

```
 Recruit variant (72 x 96)       Squad variant                 Box variant (Battle Plan)
 +--------------------+          +--------------------+        +-------------+
 |   [sprite, to      |          | [sprite]      x37  |        | [sprite] r4 |
 |    scale, gear]    |          | ===========-- 82%  |        | Halberd 19  |
 | Briar Guard        |          | (F) [reach]        |        | (F)(M)(R) ->|
 | HP 12 Prot 9 Dmg 19|          +--------------------+        +-------------+
 | [reach]            |
 | 24g 26m  14d/10    |  <- the cost row: exempt from the 3-number budget (D.1 rule 1)
 +--------------------+

 Recruit variant, a Large body
 +--------------------+
 |  [sprite: rider    |
 |   on a wolf]       |
 | Wolf Rider (horse) |  <- (horse) is the 12 px Large silhouette; the hover says "Large (2)"
 | HP 12 Prot 3 Dmg 15|
 | [reach]            |
 | 26g 12m  14d/10    |
 +--------------------+
```

Forest home is not on Thornwood troop cards (M10, B.4). It shows in the hover, and in battle as
the defense breakdown's "forest home +1".

**Headline numbers by role**, at most 3, from `cardNumbers(unit)`, a pure UI derive over content
(presentation research 3.2):

| Role | Numbers |
|---|---|
| infantry, cavalry, monsters, champions | ♥ HP · ⛨ Prot · ⚔ Dmg (str + best melee weapon; a charge's first round as "17+3") |
| archers and skirmishers | ♥ HP · ⛨ Prot · ➶ Shot (dmg) with a range mark |
| mages and priests | ♥ HP · pips on the frame · holy for priests |
| scouts | ♥ HP · eye with the sight distance |

**Glyph row**, at most 3: signature abilities by `cardPriority`, then the best melee weapon's
chips (Charge, Reach, AP, AN), then "+N" (B.4). A squad's state chips come first.

**Element mark**, at most 1: the largest resistance or weakness. "▼ (flame)" on a Treant,
"▲ (flame)" on a Salamander. Nothing shows when the unit has none.

**Size silhouette**: on the recruit, squad and box variants, for bodies that are not man-sized (D.1 rule 8).

**Commander extras** (portrait frame): a gear count and the best tier's shape (○ ◆ ★).

| Variant | Adds for this design |
|---|---|
| `recruit` | the size silhouette; the materials cost, with its breakdown on hover (A.5) |
| `squad` | the size silhouette |
| `box` | reach dots; the closing round; Charge and Reach chips; the size silhouette |
| `mini` | — |
| `report` | items lost or won (spoils) for commanders |
| `replay` | live HP; gear drawn; resist and weak marks on its numbers |

### D.3 The hover (L1) and Shift (L1+)

```
+------------------------------------------------------------------+
| [sprite] Briar Guard              Thornwood · Heavy infantry      |  title: nation, role
|          Man-sized (1) · Slow: joins melee in round 4             |  size class, speed in words
| Halberdiers in grown thornplate, the wall the forest raises;      |  lore line
| it is heavy to fight in.                                          |
| ---------------------------------------------------------------- |
| HP 12    Prot 9    Morale 12    Str 12                            |  body block, per troop
| Att 11   Def 10                                                   |
| ---------------------------------------------------------------- |
| Halberd   7 + str 12 = 19   melee   [Reach]                       |  weapon line with chips
| Gear      Thornplate 7 · Iron Cap 2 = Prot 9                      |  gear composes Prot
| ---------------------------------------------------------------- |
| [tree] Forest home  +1 defense in forest provinces, attacking or  |  abilities: glyph, name, line
|        defending.  (inactive: not in a forest)                    |
| ---------------------------------------------------------------- |
| Upkeep 1.6/mo · Supply 1/day · 24g 26m 10pop · 14 days per 10     |  economy line
| Shift sources · T lock · Ctrl+click Codex                         |  gesture footer
+------------------------------------------------------------------+
```

```
+------------------------------------------------------------------+
| [sprite] Ash Rider                     Cinder Horde · Cavalry     |
|          Large (2) · Mounted · Fast: joins melee in round 2       |  class words in the title
| Clan lancers on ash-grey horses bred to carry, not to fight.      |
| HP 12  Prot 4  Morale 11  Str 11  Att 11  Def 11                  |
| Lance  6 + str 11 = 17   [Charge +3]                              |
| Sword  4 + str 11 = 15                                            |
| Rides  Ash Horse (no weapon of its own)                           |
| Gear   Scale Shirt 2 · Iron Cap 2 = Prot 4                        |
| Upkeep 1.9/mo · Supply 2/day · 28g 18m 20pop · 14 days per 10     |
+------------------------------------------------------------------+
```

**Rows and when they show:**

| Row | Shown when | Sentence (its L2 concept) |
|---|---|---|
| Size class | always | "Bigger targets draw more blows and eat more supply. A trampling weapon hits only bodies of its listed size or less." |
| Speed in words | always | "Fast closes in round 2, normal in 3, slow in 4; archers shoot until then." |
| Body block | always; Prec only with a ranged weapon or spells; MR never in M1 | one line each (`concepts.ts`) |
| Weapon lines | each weapon, the mount's included | "Damage = strength + weapon in melee; weapon alone for shots." |
| Chips | when the weapon has them | the catalog's line (B.5) |
| Rides | mounted units | "Rider and mount fight as one Large body." |
| Gear | units with pieces or natural armor | "Each piece adds protection; materials pay for it." |
| Abilities | each signature and body entry | the catalog line; "(inactive: ...)" when its condition is unmet here |
| Resistances | non-zero only | the catalog's positive or negative line |
| Items | commanders wearing items | each item's card line, marked with its tier shape |
| Economy | always | upkeep, supply by size, cost, days |

**Shift (L1+)** expands without a click (UI spec 5.1):
- **Every stat into its sources.** Base, gear, items, home terrain, Fury and Lore scales, bless,
  buffs, starvation and unpaid morale, storm, and walls, from the stat selector's trace. "Prot 9:
  thornplate 7, iron cap 2"; "Def 10: skill 11, thornplate −1, forest home +1 (inactive)";
  "Regeneration 10%: own 10%; Ring of Regrowth 5% (inactive: its own regeneration is as high)".
- **The weapon line into its damage parts.** "Halberd: str 12 + 7 = 19 against prot (AP: 9 →
  4)". With U4: "Fire Arrows 6 against a Treant: 6 + 5 (fire weakness) = 11 against prot 12".
- **The cost row into its materials.** "26 = thornplate 18 + halberd 6 + iron cap 2", with
  "+ fittings {n}" when above 0.

### D.4 Concepts (L2)

New entries for `src/content/concepts.ts` (beyond the UI spec's 55): Size, Size class, Gear,
Natural armor, Protection, Defense skill, Fittings, Weapon, Reach, Charge, Strikes, Trample,
Armor piercing, Armor negating, Element, Resistance, Regeneration, Mount, Role, Item, Slot, Body
plan, Vault, Spoils, Forging, Tier, Artifact, Booster, Inspiration, and Item HP. Each has a
`summary` (one or two lines: the sentences of A, B, and C) and a `body` (the Codex paragraph,
with the rule in words and its numbers).

### D.5 The detail page (L3) and the Codex (L4)

**Squad sheet** (`I`, right-click, or Ctrl+click on a squad card) is the Codex unit page with a
live block on top: count and HP, wounds carried, active effects, its commander, and its battles.
It is the same component, so the two cannot drift (presentation research 3.5).

**Codex unit page**, in order:
1. Header: name, nation, role, size class with its silhouette, and the sprite at 2× with gear.
2. Lore: the full description.
3. Body block: the L1 numbers.
4. **Weapons table:** name, damage, reach dots, chips, element, materials.
5. **Kit strip:** each gear piece as a tile with its sprite part, name, protection, defense, and
   materials. It is the paper doll's frame in read-only form (presentation research 3.7).
6. **Mount**, for riders.
7. **Abilities:** glyph, name, one line, then the codex paragraph.
8. **Resistances** (non-zero), linked to the Elements page.
9. **Recruitment:** where, cost with its materials breakdown, days, requirements, upkeep, and
   supply by size.
10. **Related:** the same role in the other nation, units of the same size class, and the
    concepts.

(Matchups against every unit are M2, R4.)

**New Codex topics** (UI spec 5.2 lists the existing ones):

| Topic | What it adds that a tooltip lacks |
|---|---|
| **Units table** | sortable columns (HP, Prot, Mor, Str, Att, Def, Prec, Size, Speed, best hit, best shot, materials, upkeep, supply), each cell with a small common-scale bar (presentation research 2.4); **filter chips**: nation, role, size class, tag, ability, element dealt, resistance, mounted, summon only, commander (no typed query in M1, S4) |
| **Sizes: from horses to giants** | every unit and pretender body at true visual size on one baseline beside a man, grouped by size class, each class with its two rules and its trample line (R1; Phase 11, with the SVG sprites) |
| **Gear** | the 13 pieces with their numbers, materials, and wearers (back-links) |
| **Abilities** | every catalog entry with every unit, item, blessing, and chassis that has it |
| **Elements** | each element's glyph, the weapons and spells that deal it, and the units and items that resist it or are weak to it |
| **Items** | a table by slot and tier, grouped by research level, with filters (color, tier, slot, "usable by", "forgeable now"); each row links to its page: effects, requirement, level, cost, days, analogs, and where your copies are (vault, worn by, being forged) |
| **Body plans** | the five plans, their slots, and the bodies on each |

### D.6 The commander's Gear tab: the paper doll

The Commander panel has Overview, Battle Plan, and Rituals (UI spec 2.8.2). **Gear** is its
fourth tab, the UI spec's maximum for a dock panel. It opens on `G` while a commander is
selected (`G` is free in the UI spec's key table).

```
+------------------------------------------------------------------------------------+
| Gear · Varo the Ember (Cinder Magus R2)                  Kharnath · lab: yes       |
+---------------------+----------------------------+---------------------------------+
| [Head]              |                            |  HP       11                    |
|  Crown of Embers ◆  |    full-body sprite 2x     |  Prot      2                    |
|                     |    wears what is shown     |  Pips     R3 (R2 + Crown)       |
| [Body]              |                            |  Hovering Pyre Staff:           |
|  Ritual Vestments   |                            |  Spell power 0 → 2 ▲2           |
|  (standard)         |                            |  Weapon Staff 2 → Pyre Staff 3  |
| [Weapon]            |      Man-sized (1)         |   fire ▲                        |
|  Staff 2 (standard) |                            |  Shift: full comparison         |
| [Charm] [Charm]     |                            |                                 |
|  empty   empty      |                            |                                 |
+---------------------+----------------------------+---------------------------------+
| Vault (Cinder Horde, at your labs)  [All][Weapon][Head][Body][Charm][Usable by Varo]|
| [Pyre Staff ◆] [Pendant of Fury ○] [Flame Blade ○]                                 |
| [Heart of Kharnath ★: "its Red pips need a Red mage; Varo has Red"]                |
| [Crown of Embers ◆, greyed: "Already wears it"] ...                                |
+------------------------------------------------------------------------------------+
```

**Rules on screen.** Each is a validated sim rule and a sentence:
- **Slots follow the body.** A slot the plan lacks is drawn greyed with its line, "A wyrm has no
  hands: head and charms only" (Dominions: "A non-human commander may not have a head slot",
  [manual ch. 4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)).
- **Standard kit shows as "(standard)".** An item drawn over it says "over Bark Mail". A weapon
  item says "replaces Staff 2", and the staff returns when the item comes off.
- **Hovering a vault item writes deltas on the stat rows** (XCOM 2's armory,
  [UISoldierHeader.uc](https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UISoldierHeader.uc)):
  `Prot 2 → 3 ▲1`. Every changed stat appears, with sign and arrow, HP as "HP 9/14 → 19/24".
  A source that would not count says so: "Regeneration 10% → 10% (its own is as high)". The
  deltas come from `commanderStats(state, id, { itemsOverride })`, the same fold as battle setup.
- **Dragging lights the valid slots** (Battle Brothers' `is-equipable`, [paperdoll
  module](https://raw.githubusercontent.com/Battle-Brothers-Legends/Legends-public/master/ui/screens/character/modules/character_screen_left_panel/character_screen_paperdoll_module.js)).
  A click on a vault item equips it into its slot, the first free charm for charms. A click on a
  slot filters the vault to that kind. Dropping on a full slot swaps (C.7).
- **Unusable items stay listed, greyed, with the validator's reason** (XCOM 2's locker,
  [UIArmory_Loadout.uc](https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UIArmory_Loadout.uc)):
  "Items change hands in a lab in a province you own", "Already wears Barkskin Amulet", "Varo
  needs Crown of Embers to finish Brand of Ash". A booster in a color the wearer lacks is
  allowed: its row reads "Its Green pip needs a Green mage; its other effects work".
- **Away from a lab** the vault list is replaced by one line with a link: "Items change hands in
  a lab you own. Nearest: Kharnath, 6 days ▸". The link previews the move. The doll stays
  readable, and the slots show what is worn.
- **Keyboard:** Tab moves between the doll and the vault, the arrow keys move within them, Enter
  equips, and Delete unequips into the vault.

**Depth audit** (UI spec 1.5): select a commander → `G` (or `Enter` → Gear) → click a vault
item. That is 3 clicks, inside the budget. Shift adds no click.

**The item tooltip's own comparison** stays short: at most 3 deltas, and Shift shows them all
(Diablo IV's quiet default and its advanced compare, presentation research 1.11).

### D.7 The item tooltip

```
+------------------------------------------------------------+
| [icon] Brand of Ash          ◆ Greater · Weapon · [R][R]    |  tier shape, slot, requirement symbols
| "Forged in the pyres of Kharnath; it strikes before the     |  lore line
|  last blow has landed."                                     |
| Brand of Ash   dmg 6  [fire]  [Strikes 2]                   |  the weapon line, as on units
| ----------------------------------------------------------- |
| On Kesh (Ash Chieftain): replaces Axe 5 → Dmg 15 → 16 ▲1 ·  |  at most 3 deltas
| fire · strikes ×2                                           |
| In the vault (1) · Forge: RR, Ember 3, {R}x8 + (2), 15 days |  where it is, how it is made
| Shift: full comparison · Ctrl+click Codex                   |
+------------------------------------------------------------+
```

- Granted abilities use the catalog's glyph and line, so Cinder Mantle's fire shield reads
  exactly like the Ash Colossus's.
- An item's location reads "in the vault (2)", "worn by Varo", or "being forged by Kesh, 6
  days". An enemy's item seen in a battle report reads "worn by {name} ({nation}) at {battle}".
- Artifacts add "Unique" and, while one is free, "Not yet forged".

### D.8 Forge rows in the Rituals tab

Forging is a mage's lab work, like a ritual, so it lives in the Rituals tab (UI spec 3.5) as a
**Forge** group with its own filter chip, under the rituals.

```
| Varo the Ember  R2 (R3 with items) · in lab: yes                     |
| [R][G]  [Summon][Province][Remote][Forge]                            |
| Forge                                                                |
| ○ Flame Blade       R    {R}x4         10d  A blade that never stops…|
| ○ Pendant of Fury   R    {R}x4         10d  The squads it leads…     |
| ◆ Cinder Mantle     RR   {R}x8 + (2)   15d  Burns whoever strikes it…|
|   ...  [Show locked (3)]                                             |
|   ◆ Brand of Ash    RR   needs Ember level 3 (about 7 months)        |
|   ★ The Unquenched  RRR  needs Ember level 4                         |
| Pay: R R R R R R R R + (R)(R)  [Edit]   Pool after: R 3              |
| [Forge] (commits)                                                    |
```

- The rows are the forgeable items for this mage, sorted by tier then level. Locked items sit
  under "Show locked", each with `forgeBlocker`'s reason and, for research, the estimate from
  `daysToNextLevel`.
- Payment and its Edit stepper are the ritual's. One click commits. **Stop** confirms inline
  that the mana is lost (UI spec 5.7).
- **Depth:** select a mage → `C` → item row → Forge. That is 4 clicks, the same as a
  self-targeted ritual (UI spec 1.5).

### D.9 Battle replays and reports: gear and resistances

The battle design final covers the stage. These are the additions, each tied to a stored or
detail event. Nothing is inferred (battle design D4, presentation research 3.9):

| What | Battle design today | Added by this design |
|---|---|---|
| Unit looks | `lookFor(unit)` derives a fallback from tags, size, prot, weapon names, nation (S2.2) | `shield` from the shield piece and `mount` from the mount block; `material` from the body piece **only where the battle design's look table sets none** (its rows win). The prot thresholds stay as the last fallback |
| Sprites per squad | 20/12/6/4/2/1 by size (S2.5) | riders are size 2, so 12 per squad instead of 20; the Living Monolith draws at its sim size 6 |
| Commander gear | archetype rigs (S4.4) | the roster's `items` draw as parts: a weapon item swaps the `weapon` part and its `WeaponLook`; a head item adds a `crown` part over the helm; a body item adds a torso or `cloak` overlay; a charm adds a chest glint. A fire weapon flickers in Ember's palette and a nature item sheds leaves. Each `ItemLook` is content |
| Inspiration | — | a pennant chip on each squad its bearer leads, from the roster's items and the catalog; the Horn of the Burning Host sounds once in the opening beat (a cue, no event) |
| Damage numbers | rolling numbers; spell numbers carry the element glyph (S2.9) | the element's outline glyph on every non-physical number, weapons included |
| Resistance | — | a **▲ RESIST** or **▼ WEAK** suffix chip on a number whose `DamageRoll.resist` is non-zero. The per-blow detail line reads "+3 (fire weakness 3)" or "−10 (fire resistance 10)" |
| Reach | cavalry charge choreography (S2.8) | a **BRACED** chip when `strike.braced` is true. In a braced pair the charge's throw-back is skipped, the riders stop at the spear line, and the lance impact plays a braced thud. Ticker: "The Briar Guard's halberds blunt the charge!" |
| AP and AN | ARMOR chip when armor holds (S2.8) | **AP** (split shield) and **AN** (crossed shield) marks on featured blows where they applied |
| Item triggers | — | the `ability` event's cue (pretender C.5), with the item's look: bark creeping up the largest squad for Barkskin, coiling vines for Ivy Grasp |
| Thorns | fire-shield licks (S2.10) | N4's `burn` event carries the element; nature shows thorn particles and a bark impact sound |
| Inspect a unit | dock hover tooltip (S4.6) | click a block or dock row (it pauses): the `replay` unit card with gear, items, and resistances, plus its last 5 blows given and taken, from the detail stream |
| Teaching lines (**M1-should**, cut line 1) | captions (S2.15) | the first time in a battle that a charge is braced, a resistance or weakness changes a blow, or an item ability fires, the ticker adds that entry's line. At most one per entry per battle; off in settings |
| Report | the battle report card (UI spec 4.2) | **Spoils:** each item a fallen commander wore and where it went (taken by a nation, or destroyed). Battle deaths come from the roster's `items`, the log's `death` events, and the winner; retreat deaths from the spoils message. No new record field |

**Sound** (battle design S3): an item weapon takes its `WeaponLook`'s swing family. A body piece's
`material` picks the impact family (`arm.plate`, `shield.wood`, bark, ember). Braced charges use
the spear-clatter variant of `charge.crash`. In fallback mode (no re-run), the AP, AN, RESIST,
WEAK, and BRACED marks are hidden, as the break-chance meter is (battle design D4).

### D.10 Symbols

| Meaning | Symbol | Never alone |
|---|---|---|
| Size class | a 16 px silhouette per class (12 px on cards): man, horse, bear, giant, colossus, wyrm | the word and the number: "Huge (4)" |
| Element dealt | outline flame, leaf, snowflake, sun disc, skull in a drop; physical has none | the element's name in L1 |
| Resist / weak | ▲ / ▼ with the signed number | a warm or cool tone is extra |
| Tier | ○ Lesser, ◆ Greater, ★ Artifact | always beside the mana symbols and the word in L1 |
| Slot | sword, helm, cuirass, ring | the slot's name in the doll |
| Deltas | `→` with ▲ or ▼ and the sign | — |
| Rows | F, M, R letters in filled or empty circles | letters read in greyscale |
| Braced, AP, AN | brace bar, split shield, crossed shield | the chip text |
| Inspired | a pennant with an up chevron | "+2 morale (Horn of the Burning Host)" in the chip's tooltip |

### D.11 What the sim exposes for this part

| Need | Function (module) | Pure, no rng | Phase |
|---|---|---|---|
| Every stat of a commander or unit with its sources, and a what-if for items | `commanderStats(state, id, opts?: { trace?, itemsOverride? })` and `unitStats(def, ctx?)` in `src/sim/selectors.ts`, built on the **same** modifier fold as `battle/setup.ts statsFor` (one fold, a trace sink, UI spec 7.2) | yes | 8 |
| A unit's abilities, numbers filled | `abilitiesOf(def, nation?, items?)` (content) | yes | 7b |
| Casting pips, item HP, inspiration | `castingPips`, `itemHp`, `inspireOf`, `commanderMaxHp` (sim) | yes | 7b |
| Why an item cannot be forged or worn | `forgeBlocker`, `equipBlocker` | yes | 7b |
| Where the nation's items are | `itemLocations(state, nation)`, `artifactStatus(state, id)` | yes | 7b |
| Fittings, derived skill | `fittingsOf(def)`, `defenseSkill(def)` (content) | yes | 7b |
| Card budgets | `cardNumbers`, `cardGlyphs` in `src/ui/derive/unitCard.ts` | yes (UI) | 8 |

### D.12 Tests

- **UI derive** (`tests/ui/derive/unitCard.test.ts`):
  - no M1 unit's card exceeds `UI.unitCard` (the recruit cost row exempt by name);
  - zero resistances and MR never render; forest home never renders on a troop card;
  - signature glyphs come before weapon chips, and state chips before both;
  - every body above size 1 has its silhouette on the recruit, squad and box variants;
  - a snapshot of every M1 unit's derived card (data, not pixels).
- **Equip preview never lies:** for random items and commanders, `commanderStats` with
  `itemsOverride` equals the stats after `applyCommand(equipItem)`, HP included.
- **Breakdowns add up:** each stat's trace total equals the battle setup's stat, for every M1
  unit in the five terrains and with every blessing default.
- **Replay marks:** every RESIST, WEAK, BRACED, AP, and AN mark matches a detail event; none show
  in fallback mode.
- **Smoke (cheap):** the Codex units table sorts and filters; the paper doll renders for each
  body plan; the Forge group lists the forgeable items with reasons for the locked ones; the
  Sizes page renders every body once.

---
## E. Plan

### E.1 What lands in which phase

Order of work, with the reasons:
1. The battle track's S1 lands first: detail events, golden fixtures, and the re-run.
2. The pretender's 6b follows: 6b.1 design rules, 6b.2 battle rules N1 to N5 with
   `CombatStats.size`, 6b.3 map rules and content.
3. Then Phase 7 (AI), in review elsewhere.
4. **Phase 7b** comes after Phase 7, so the AI update builds on the merged AI, and after 6b.2,
   because it extends `CombatStats.size`, N1's triggers, N3's spell power, and N4's shields
   instead of adding second copies. If 6b.2 slips, 7b.1 adds `CombatStats.size` itself (one
   field, the same as N2's) and leaves the rest to 6b.2.
5. The UI comes after 7b, so Phases 8 and 9 build the final shapes once.

Each step ends with `npm run typecheck && npm run lint && npm test` green, a `docs/PROGRESS.md`
entry, and a commit whose message starts with its phase name ("Phase 7b: ...").

| Phase | Deliverable | Main files | Tests |
|---|---|---|---|
| **7b.1** Unit depth | Content: `SIZE_CLASSES`; the gear registry and each unit's `gear`, `naturalProt`, `role`, `description`, `mount`, and `resist`; weapon `reach` and `materials`; Ash and Wolf Riders at size 2; the Living Monolith at size 6; body plans on commander units; the abilities catalog (display fields and rule union, N1's records amended, `TriggerAbilityId`, `sourceId`), `abilitiesOf`, `fittingsOf`, `defenseSkill`. Sim: U1 weighted draws, U2 supply by size, U3 reach (after the item fold, fleeing excepted), U4 resistances (weapons, spells, shields, remote damage), U5 best regeneration source; `CombatStats.resist` and `braces`; the detail fields `DamageRoll.resist` and `strike.braced`; `BATTLE.maxRegeneration`, `SUPPLY.perSize` | `content/{types,sizes,gear,abilities,rules}.ts`, `content/units/*.ts`, `sim/battle/{attacks,effects,setup,types,detail}.ts`, `sim/{commanders,ritualEffects}.ts` | A's rule tests; content validation (gear sums, materials bound, mounts, catalog, trigger ids); `docs/04` required tests unchanged; golden fixtures regenerated once with `npm run golden:battle`, the commit naming each changed fixture and asserting byte-equality for every fixture with no unit above size 1, no charge against reach, and no resistance in play |
| **7b.2** Magic items | The 20 items and their content validation; `ITEM_RULES`; the narrowed helpers (`Requirement`, `ManaBill`, `payMana`); state (`CommanderState.items`, `NationState.vault`, the `forge` order); `forgeItem`, `equipItem`, and `unequipItem` with validation (row 10 included); `progressForging`; folds (C.9); item HP (I11) in `commanderMaxHp`; item triggers through N1 with `abilitySource`; spoils, destruction, elimination, recall; artifacts; messages; the `STATE_VERSION` step and migration; roster `items` | `content/items/*.ts`, `content/spells/{index,types}.ts`, `sim/{items,types,tick,victory,pretender,conflict,selectors,pips,research,rituals,commanders,supply}.ts`, `sim/commands/items.ts`, `sim/battle/{apply,setup,events}.ts` | C.13; the determinism hash once; fixtures for all 20 items and 5 plans |
| **7b.3** AI and balance | The AI's forge, equip and detour steps (C.10); `NationDef.ai.forge`, `ItemDef.ai`, `AI_ITEMS`; the runner prints research levels by month, items forged, worn and taken, Greater items and artifacts per game; the matchup and item bands (E.3); item kits in `sim:duel` | `src/ai/*`, `content/{ai,nations/*,items/*}.ts`, `scripts/{aivai,duel}.ts` | C.10's behavior tests; E.3 bands; 20-game `sim:aivai` before and after, recorded in `docs/09-balance.md`; the research-path target (E.3 item 5) |
| **8** Map and core UI | `UnitCard` with the D.2 budgets, fields and size silhouettes; the unit hover (D.3) with Shift sources through `commanderStats` and `unitStats`; D.4 concepts; a read-only items list on the Commander Overview; the Research panel's "next item tier" line | `src/ui/derive/unitCard.ts`, `src/ui/tips/*`, `src/content/{ui,concepts}.ts`, `src/sim/selectors.ts` | D.12 derive tests; breakdowns add up |
| **9** Remaining UI | the Gear tab paper doll (D.6); the Forge group (D.8); item tooltips (D.7); Codex topics and the unit page (D.5) except the Sizes page; the Ledger Magic tab's Items section; spoils on the battle report | `src/ui/panels/commander/*`, `src/ui/codex/*`, `src/ui/ledger/*` | D.12; equip preview equals apply; smoke tests |
| **10** Replay | D.9's additions | `src/present/battle/*`, `src/render/battle/*`, `src/content/presentation/{items,gear}.ts` | replay mark tests |
| **11** Art | SVG parts for the 13 gear pieces in the nation styles (about 26 files, nation variants reusing shapes); item parts (13: 6 weapons, 3 heads, 4 bodies) and 7 charm icons; 6 size silhouettes; 37 ability glyphs; 5 element outlines; 3 tier shapes; 4 slot icons: **about 100 small files**. The Codex's **Sizes** page (R1) | `src/assets/sprites/{gear,items,icons}/**`, the manifest, `src/ui/codex/sizes.tsx` | manifest coverage for every gear piece, item, and ability; the Sizes page smoke test |
| **12** Balance | E.3's knobs; the playtest additions | `docs/09-balance.md` | the re-pinned bands |

### E.2 M1 and M2

| Item | M1 or M2 | Reason |
|---|---|---|
| Size ladder with names, U1 (draws) | **M1** | the owner's "giants to horses"; one changed draw, bit-identical for size 1 |
| U2 (supply by size) | **M1**, cuttable | a consistency rule at today's supply (S7) |
| Riders at size 2 with named mounts; the Monolith at size 6 | **M1** | honest cards and sprites at no rule cost |
| Gear pieces with validated sums | **M1** | explains numbers that exist; drives art and sound |
| Reach blunts charge (U3) | **M1** | one check, a clear counter, measured |
| Elemental resistance (U4) and its five unit values | **M1** (owner sign-off) | the R against G matchup's story, measured toward parity; items need it |
| Regeneration does not stack (U5) | **M1** | it closes the item and blessing stacks (R3) |
| Role word and lore line | **M1** | content |
| Abilities catalog | **M1** | shared with the pretender track; prevents drift |
| Items: forging, vault, 5 slots, 20 items, boosters, inspire, item HP, spoils, artifacts | **M1** | the owner's "with the items"; small rules on existing code |
| AI forge, equip and detour | **M1** | the AI uses the same commands; never stalls |
| Paper doll, Forge group, item tooltips, Codex topics, the Sizes page | **M1** (Phases 8, 9, 11) | items and sizes need a home |
| Replay teaching lines | **M1-should** | cut line 1 |
| Generic items; leadership and sight items (I8) | **M2** | S1 |
| Province hoards; starting hoards at mapgen | **M2** | S2 |
| A world list of artifacts; artifact stars on army badges; enemy gear in fog | **M2** | S3 |
| The matchup line, matchups in the Codex, `battleOdds` | **M2** | R4 |
| Separate mount HP and unhorsing | **M2** | a second roll and an after-battle rule |
| Shields against arrows | **M2** (or Phase 12) | measured shift toward the side ahead |
| Giant trample; elephants | **M2** (or Phase 12) | measured too strong as specified |
| Magic resistance checks | **M2** | no M1 rule reads MR |
| Commander afflictions and renown; item history | **M2** | new state; the tedium Dominions players report |
| Mindless dissolving, undead rules, awe, ethereal, terrain walkers | **M2** | with the W, U, and B nations |
| Feet, shield, and barding slots; two-handed weapons; a rider body plan | **M2** | each would hold only 1 or 2 of the M1 items |
| White, Blue, and Black items; sets; field swaps; a sending ritual; monthly-mana items; items that grant spells | **M2** | each a rule with no M1 payoff (items research 8.10) |

### E.3 The balance plan

1. **Invariants (always green).**
   - The four `docs/04` required balance tests, unchanged by construction (A.12).
   - The U1 equivalence test: a fight with no unit above size 1, no charge against reach, and no
     resistance in play gives a byte-equal log before and after.
2. **Matchup bands** (`tests/sim/battle/matchups.test.ts`, 200 seeds each, a ±6-point band
   around A.12's Final column). They catch drift, not balance:
   - starting armies both ways (39.5, 60.5);
   - mid armies both ways (40.0, 53.3);
   - elite armies both ways (43.8, 54.3);
   - 10 Ash Riders against 10 Briar Guard (50.3);
   - Titan with 20 Cinder Warriors against 20 Heavy Infantry (57.8);
   - **size 6 (M19):** Great Wyrm with 20 Wardens against Cinder's start (40.5).

   Phase 12 re-pins them.
3. **Item bands** through the pretender track's `sim:duel` (pretender A.10), 400 seeds, ±6:
   - Great Wyrm alone with Ring and Amulet: 69.3 / 93.3 (Cinder's / Thornwood's start);
   - **Great Wyrm alone with Ring, Amulet and the Crown of the Ivy King: 76.0 / 94.5** (M8);
   - **Elder Wyrm alone with Amulet and Crown (a Ring changes nothing, U5): 47.8 / 56.8**;
   - Titan alone against 16 independents: Brand of Ash and Cinder Mantle 81.5; the Red kit 87.0;
     Heartwood Aegis 94.0; the Green kit 100.0 (and 52.3 against 20 Heavy Infantry);
   - **the Ash Chieftain's army: Pendant 45.0, Horn 49.8, Pendant and Horn 52.3** (M12);
   - **the Warden Captain's army: Seed 71.0, Seed and Antler Crown 76.5, Ivy Crown 70.0** (M12);
   - **U5 on the pretender fixtures:** the Avatar Elder Wyrm with Greater Evergreen, mountain
     68.5;
   - **counters:** a kitted Wyrm against an Elder Druid casting Swarm with carried mana, and
     against a Cinder Magus casting Ember Dart (items research 7.2 measured 0% and 59%).
4. **Headless games:** `npm run sim:aivai -- --games 20 --seed 1` with the Phase 7 AI, three
   times: before 7b, after 7b.1, and after 7b.3. Recorded per game: winner, months, research
   levels by month, items forged and worn per nation, Greater items, artifacts, spoils taken.
   Acceptance is the existing checklist line (Thornwood wins roughly half, read as 35% to 65%)
   plus C.10's AI tests.
5. **The research-path target** (M14), measured in 7b.3 before content lock: over the 20 games
   each AI nation forges a Greater item in at least 50% of games, and an artifact appears in at
   least 15% of games. If either misses, knob 5 below.
6. **Knobs, in the order to turn them:**
   1. Oakheart fire −3 → −2 (elite share 55.3 → 58.5; A.12 has the ladder).
   2. Ring of Regrowth 5% → 4% (Wyrm kit 76.0 → 71.8), or its level 3 → 4.
   3. Seed of Barkskin +2 → +1.
   4. Brand of Ash damage 6 → 5.
   5. Tier levels one lower (Greater 1 to 2, Artifact 3) if the research-path target misses;
      one higher for artifacts (5) if artifacts decide most games.
   6. The item price formula.
   7. If the Cinder Horde ends too strong after U4: shields against arrows (A.10), measured and
      ready.
7. **Playtest additions** (`docs/09-balance.md`):
   - a new player forges a Lesser item by month 3 without reading the docs;
   - one Shift over any unit answers "why is this number this?";
   - in three full matches at least one spoils message appears;
   - nothing in a replay changed a blow without a mark or a detail line.

### E.4 Cut lines, in order

1. The replay's teaching lines (R6).
2. The Codex units table's per-cell bars (sorting and the filter chips stay).
3. Two of the four artifacts (keep one per color: The Unquenched and the Crown of the Ivy King).
4. The Sizes page (R1). The size words, the silhouettes on cards, and sprites drawn to scale
   stay.
5. U2: today's supply rule stays (S7).

**Never cut:**
- the gear sums and their validation;
- U1, U3, U4, and U5;
- the catalog;
- I1 to I7 and I9 to I11;
- the paper doll;
- the card budgets and the size silhouettes on cards;
- Shift sources (D.1 rule 4 depends on them).

### E.5 Doc changes (in the commits that implement them; exact text under Docs text)

| Doc | Change | Commit |
|---|---|---|
| `docs/03-nations.md` | The stat model gains size class, role, gear, natural protection, mount, resistance, abilities, and lore; the size line drops "occupies more formation space"; a "Body and kit" table per nation and for the independents; decisions: riders at size 2 with named mounts, gear sums and fittings, the resistance values, derived defense skill, the Warden Captain's lore | 7b.1 |
| `docs/04-battle.md` | Decisions: "Size draws blows" (U1), "Reach blunts a charge" (U3), "Elemental resistance" (U4), "Regeneration does not stack" (U5), "Items in battle"; the replay notes add `DamageRoll.resist`, `strike.braced`, and roster `items`; a required test (equivalence) | 7b.1, 7b.2 |
| `docs/01-core-rules.md` | Supply: "a body eats supply equal to its size"; a new section 15 "Magic items": vault, labs, item HP, spoils, elimination | 7b.1, 7b.2 |
| `docs/02-magic.md` | A new section 9 "Magic items": forging, tiers, prices, boosters, inspiration, artifacts; decisions on the shared helpers | 7b.2 |
| `docs/05-pretender.md` | Body plans per chassis; a pretender arrives without items; recall sends them to the vault; a reformed Phoenix returns without them; regeneration does not stack on Avatar bodies | 7b.2 (one paragraph, given in E.6) |
| `docs/06-architecture.md` | `content/{sizes,gear,abilities,items}`, `sim/items.ts`, `sim/commands/items.ts`; the state additions and the `STATE_VERSION` step | 7b.2 (a line in its module list) |
| `docs/07-ui.md` (as the UI spec rewrites it) | the Gear tab, the Forge group, unit cards with size silhouettes, the item tooltip, the Codex topics, the Ledger Magic tab's Items section | Phases 8 and 9 |
| `docs/08-ai.md` | the forge, equip and detour steps; roles; the known `armyPower` limit | 7b.3 |
| `docs/09-art-direction.md` | "Gear and item layers", size silhouettes and scale, ability and element glyphs, tier shapes, slot icons | Phase 10 (the rules), Phase 11 (the SVGs) |
| `docs/09-balance.md` | every number in A.5, A.7, C.4 and C.5, with the measured rows | 7b.1 to 7b.3 |
| `docs/10-milestone-1.md` | Phase 7b; criterion 7 gains "sizes, mounts, reach, resistances"; a new criterion 17 for items; bullets on Phases 8 to 12; out of scope; liberties | 7b.1 |

### E.6 Amendments the sibling tracks must accept

**Pretender expansion** (detail in B.6):
1. N1's records gain `kind: 'trigger'` and the display fields; `UnitAbility` becomes
   `Extract<AbilityDef, { kind: 'trigger' }>`; `abilityDef` becomes `triggerDef`;
   `UnitDef.abilities` is `TriggerAbilityId[]` (P1).
2. N1 gains the optional `sourceId` and `abilitySource(a)` (P2).
3. E.2's row "element resistances: M2" becomes M1 for units and items (owner sign-off, P3).
   Proposed body values: Ash Colossus, Ash Phoenix, Cinder Idol fire +10; the World Tree none
   (A.7).
4. Every chassis body gets a body plan (C.3) and a size class (P7).
5. U1 changes army duels of a god leading troops by 3 to 10 points, growing with size; the army
   bands are re-measured after 7b.1; lone duels are unchanged (P9).
6. U2: bodies eat their size in supply (P6).
7. Recall sends the god's items to the vault; a reformed Phoenix returns without them; a
   pretender arrives with none (P11).
8. N2's trample filter runs before U1's weighted draw; the sentence is "Trample hits only bodies
   of size {m} or less" (P8).
9. **The Living Monolith is sim size 6** (R5, P4). The A.4 note on immobile bodies' visual size
   is removed. Measured: no battle changes; `aiPower` unchanged.
10. **U5:** the blessing's regeneration fold takes the larger source, not the sum (P5). The
    designer shows a regeneration blessing on an Avatar body with its own regeneration as
    "(inactive on your god: its own regeneration is as high)".
11. Reported, not changed: the Avatar Great Wyrm with Evergreen at 95.3% alone against Cinder's
    start (P12).

The paragraph for `docs/05-pretender.md`'s Implementation decisions (lands in 7b.2):

```markdown
- **Items and bodies** (Phase 7b, at the owner's direction on "the items"): every chassis body
  has a body plan that sets its item slots (humanoid: weapon, head, body, two charms; wyrm:
  head and two charms; beast: two charms; idol: one charm). A pretender arrives with no items.
  Recall (Godless) sends its items to its nation's vault; a reformed Ash Phoenix returns
  without them, since they went with its death. Regeneration does not stack: an Avatar god with
  regeneration of its own heals by the larger of its own and its blessing's. The Living
  Monolith is size 6 in the sim, like the other idols.
```

**Battle presentation:**
1. `DamageRoll.resist` and `strike.braced` in the detail stream.
2. `lookFor` reads gear (the shield, and the body material where the look table sets none) and
   mounts. Recommended: the Heavy Infantry row's material becomes `mail`, matching its Mail
   Hauberk.
3. The roster gains `items`; item parts draw over standard parts.
4. Element glyphs on every non-physical number, weapons included.
5. The RESIST, WEAK, BRACED, AP, and AN marks; the inspire pennant chip.
6. Riders draw 12 sprites per squad; the Living Monolith draws at size 6 from its sim size.
7. The golden fixtures are regenerated once in 7b.1.
8. Three teaching-line rows for the captions (M1-should).

**UI spec:**
1. The Commander panel's fourth tab, Gear (`G`).
2. The Rituals tab's Forge group and chip.
3. The Codex topics of D.5, the Sizes page included.
4. The Ledger's Magic tab gains an Items section (no sixth tab).
5. The concepts of D.4.
6. `UnitCard`'s fields of D.2, size silhouettes included.
7. `commanderStats` and `unitStats` with `itemsOverride` in UI spec 7.2.
8. The Research panel's "next item tier" line.

### E.7 Open questions for the owner

1. **Resistances in M1?** Recommended yes. Wood burns and embers resist, which gives the fire
   against forest matchup its story. Measured, the elite fight moves from Thornwood 72.5% to
   55.3%. That comes from resistances and "bigger targets draw more blows" together: U4 alone
   moves it 7 points, U1 alone 3, and their interaction about 7 more, because Oakhearts are
   Large and draw twice the fire blows. The Oakheart's fire weakness is the knob (−2 gives
   58.5%). The pretender track had resistances in M2.
2. **Spoils.** Recommended: the nation that holds the field takes the fallen's items, and
   Independents destroy them. The alternative is Dominions' chance by tier.
3. **Size names**: Man-sized, Large, Great, Huge, Colossal, Gargantuan, or names in FM's tone?
4. **Research pace for items**: Lesser at level 1, Greater at 2 to 3, artifacts at 4 (about
   month 22 for a nation with four researchers, month 44 with the minimum two). Or artifacts at
   level 3, so most matches see one?
5. **Regeneration does not stack** (U5). It weakens one pretender combination: an Avatar god
   with regeneration of its own and a Green regeneration blessing (the Elder Wyrm, Wild Spirit,
   World Tree). Accept?
6. **Shields against arrows**: deferred because they favor the side already ahead (measured).
   Revisit in Phase 12?
7. **Trample on the independent Giant**: left out because it made mountain champions walls. A
   weaker trample, or never?

---
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
## Sources

**Dominions 6 manual** (community transcription of the official manual):
- [Ch. 4, Units](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html): attributes,
  abilities explained on mouse-over, inventories, slots by body, standard items that return
- [Ch. 5, Movement](https://dmacguigan.github.io/dom6-manual/chapters/05-movement.html): turn
  order (items into the national inventory)
- [Ch. 6, Combat](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html) and its
  [source](https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/06-combat.qmd)
  (read in `judge-1/dl/ch06-main.qmd`): size and squares, missiles weighted by size, gear
  composing defense, **repel only with a longer weapon**, resistance and weakness
- [Ch. 7, Magic](https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html): Forge Item in
  a laboratory, MR and penetration
- [Ch. 10, Magic Items](https://dmacguigan.github.io/dom6-manual/chapters/10-magic-items.html):
  item analogs, unique artifacts
- [Ch. 11, Path Boosters](https://dmacguigan.github.io/dom6-manual/chapters/11-path-boosters.html)

**Dominions game data:**
- [dom6inspector gamedata](https://github.com/larzm42/dom6inspector/tree/master/gamedata) (units,
  weapons, armors, items, unit descriptions). Weapon lengths checked in `web/d6_weapons.csv`:
  Spear 3, Lance 3, Halberd 3, Long Spear 4, Pike 5.

**Dominions community** (search extracts unless marked; claims worded no stronger):
- [illwiki, Dom6 mounted](https://illwiki.com/dom5/dom6/mounted): riders and mounts as separate
  entities, the mount hit instead of the rider (search extract; verified by J2; the page
  refused this session's connection)
- [illwiki, items](https://illwiki.com/dom5/_export/xhtml/items): pickup chance of 30% to 75% by
  Construction level (verified by J2)
- [illwiki, Laboratory](https://illwiki.com/dom5/laboratory): labs and the treasury
- [illwiki, Dom6 magic](https://illwiki.com/dom5/dom6/magic): simultaneous artifact forging
- [Steam, Dom6 afflictions](https://steamcommunity.com/app/2511500/discussions/0/4203616776861027901)
- [Quarter to Three, Dominions 5 thread](https://forum.quartertothree.com/t/dominions-5-warriors-of-the-faith/131532?page=16)
  (handing items to many units)

**Other games:**
- Age of Wonders 4 data via [aow4db](https://github.com/minionsart/aow4db):
  [Abilities.json](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Abilities.json)
  (downloaded to `web-final/aow4_Abilities.json` and checked: "Polearm Unit" with "First Strike,
  Charge Resistance"; "Charge Resistance: Unaffected by the bonus effects of Charge attacks";
  a Shock Unit's charge "can be countered by Polearm Units"; Large Target), and
  [Units.json](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Units.json)
- Heroes of Might and Magic III: [Combat](https://heroes.thelazy.net/index.php/Combat) (search
  extract: the victor takes the artifacts)
- Battle Brothers: [Dev Blog #34](https://battlebrothersgame.com/dev-blog-34-new-armor-helmet-rework-banners/)
  (search extract: looks must match stats); [paper doll module, Legends
  copy](https://raw.githubusercontent.com/Battle-Brothers-Legends/Legends-public/master/ui/screens/character/modules/character_screen_left_panel/character_screen_paperdoll_module.js)
- Civilization VI: [unitpanel.lua, CQUI copy](https://raw.githubusercontent.com/CQUI-Org/cqui/master/Assets/UI/Panels/unitpanel.lua)
  (the four-stat card budget; verified by J2)
- XCOM 2: [UISoldierHeader.uc](https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UISoldierHeader.uc),
  [UIArmory_Loadout.uc](https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UIArmory_Loadout.uc)
  (deltas on stat rows; disabled items with reasons)
- Battle for Wesnoth: [reports.cpp](https://raw.githubusercontent.com/wesnoth/wesnoth/master/src/reports.cpp)
  (downloaded to `web-final/wesnoth_reports.cpp`: the " (inactive)" tooltip suffix at lines
  444, 1050 and 1090)
- Dropped since the draft: the Total War "lost, except legendary" claim (unverified, M20).

**Repository** (read only, commit `3addf97`): the docs and code listed at the top.

**Sibling designs:**
- `../pretender-design/final.md` (A.2 to A.6, A.10, A.11, E.2 to E.5, Docs text) and
  `../pretender-design/owner-answers.md`
- `../battle-design/final.md` (S1.3, S2.2, S2.5, S2.8, S4.4, S4.6, the `docs/04` and `docs/10`
  texts)
- `../ui-design/spec-final.md` (1.1 to 1.5, 2.8.2, 3.5, 5.1, 5.2, 6.4, 7, the `docs/07`,
  `docs/09` and `docs/10` texts)

**Judges:** `judge-1/` (`monolith.ts` and `.out.md`, `elder.ts` and `.out.md`,
`measure-rerun.md`) and `judge-2/p/` (`stack.ts` and `.out.md`, `goddeath.ts` and `.out.md`,
`m-rerun.out.md`).

**Research notes** beside this file: `research-dom-units.md`, `research-dom-items.md`,
`research-presentation.md`.

**Measurements:**
- `proto/` (the draft's copy with switches for U1, U3, U4, shields against arrows, and N2-style
  strikes): `measure.ts`, `measure-items.ts`, `measure-items2.ts` and their `*.out.md`;
- `final-measure/` (this final's copy, adding battle-start stat changes for item triggers):
  `final.ts`, `final2.ts`, `tree.ts`, `chk.ts`, and `final.out.md`, `final2.out.md`,
  `tree.out.md`;
- `calc/wound.py` (exact wound chances over the DRN distribution).
