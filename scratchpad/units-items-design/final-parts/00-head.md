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
