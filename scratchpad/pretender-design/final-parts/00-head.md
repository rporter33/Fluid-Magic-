# Pretender variety, customization, and flashy magic: final build spec

Status: final, 2026-10-21. This file revises `design-draft.md` (beside it) by the two judges'
lists. Where the judges disagree, or where a measurement overturned both, the section
"Rulings" decides and says why. This file is the build spec. The draft, the three research
notes (`research-dominions.md`, `research-aow4.md`, `research-vfx.md`) and `calc/` stay
beside it as catalogs. When they conflict with this file, this file wins.

**What this revision is built on** (re-read for this revision):

- the repository at `/home/user/Fluid-Magic-` (Phases 0 to 6; files read are listed under
  Sources);
- the battle presentation's final spec, `../battle-design/final.md`, cited as "battle design
  S2.7" and so on. The draft cited `final-parts/p1.md` to `p6.md`, which do not exist. Every
  battle reference below was checked against `final.md`;
- the UI spec's final version, `../ui-design/spec-final.md`, cited as "UI spec 3.3". The
  draft cited `part1.md` to `part3.md`, which do not exist.

**Owner direction (binding).** "I think flashy magic effects is always interesting and good
options for pretenders like Dominions has is always a highlight. If it's possible. A
customization level matching Age of Wonders 4 would be very ideal." Earlier directions still
hold: battles are visceral, with detail and sound effects; the UI matches similar games, with
complexity tastefully layered under smart menus. This direction drove every change in this
file. "If it's possible" is honored in two ways: what the measurements or the art budget say
does not fit M1 is deferred to M2 and named (E.2), and the scope change itself goes to the
owner for sign-off (E.5, question 1).

**Constraints kept.**

- The sim stays pure and deterministic. Nothing in this file adds a randomness source, and
  every new rng draw sits on the resolver's existing path.
- Content is data. Every ability is composed from the `docs/02` section 5 primitives. The
  new rules (N1 to N5, N7, N8) are specified exactly below, each with its tests.
- Cosmetic choices never reach the sim. The look, the identity and the nation look live
  outside `GameState`. The god's name is the one string the sim holds, and B.2 says why and
  how a test proves it changes nothing else.
- No copyrighted assets. Art is SVG authored in the repo or drawn in code; effects are
  procedural.
- Color identity never relies on hue alone. Every color carries its mana symbol, and every
  side carries its glyph and sigil.
- Everything is testable, and everything is placed in an M1 phase or deferred to M2 by name.

**Numbers were computed, not guessed.** Every script is in `pretender-design/calc-final/`,
with its output beside it (`*.out.md`, `*.out.txt`). The TypeScript ones run on the
repository's own resolver through its test fixtures:
`cd /home/user/Fluid-Magic- && npx tsx <script>`.

| Script | What it computes | Used in |
|---|---|---|
| `costs-final.mjs` | `designCost` mirrored with the final rules: every preset and example build, and the cost-parity table | A.3, A.4, A.8, A.10 |
| `duel-final.ts`, `duel-mother.ts` | staged fights, 400 seeds each, in the real resolver | A.10, Rulings R2, R3, R8 |
| `aipower.ts` | each body's Light Infantry equivalent, for `ChassisDef.aiPower` | A.11 |
| `bless-bounds-percolor.mjs` (and `bless-bounds.mjs`, the pooled variant it replaced) | the strongest selection any pip set can buy, per stat | A.6, R7 |
| `sharecode-final.mjs` | the share code: full encode and decode, 2,000 round trips, lengths, typo detection | B.9, R11 |
| `redflash-final.mjs` | WCAG's saturated-red ratio on linearized sRGB for every palette step | B.4, C.1, R14 |

---

## Rulings

Each judge item is listed once, with the ruling and its reason. "J1" and "J2" are the two
judges. Items both judges raised are merged.

### Where the judges disagree, or a measurement overturned both

| # | Topic | J1 | J2 | Ruling | Why |
|---|---|---|---|---|---|
| R3 | Iron Will | make it a flag, and raise its price (20 points took a god-led wolf army from 30% to 91%) | make it a flag that `neverChecks` reads | **Iron Will leaves M1.** Its M2 form is specified (A.9): a `fearless` tag that the battle design's `fearless()` helper reads, tested against Fear plus Dread 3 | Measured on an ordinary general, not only on wolves: a Titan leading 20 Cinder Warriors wins 65% / 43% / 53% / 57% / 21% against the five fixtures, and 100% / 98% / 92% / 98% / 76% with Iron Will (`duel-final.out.md`). A rule that adds 35 to 55 points of win rate to every god-led army is mandatory at any price a 400-point budget can carry, so it is not a choice. The Mother of Beasts, the case that motivated it, is covered by bound squads (R2) |
| R12 | Whole-body cosmetic slots (Wild Spirit's beast form, Living Flame's form, Monolith's shape, Mother's pelt) | keep them, but let them ship with 2 variants | replace them with overlay slots in M1 | **Overlays (J2).** Every M1 slot is an overlay on one anchor (horns, mantles, crests, canopies, faces); the AoW4 floor of 4 slots × 3 variants stays | A whole-body variant is a rig with every battle pose; an overlay is one SVG on an anchor that the procedural poses already move. This also removes every new rig (R10) |
| R8a | Ascended Hero price | about 110, or leadership 80 | its body nets −10 after its pip and its Avatar | **Cost 100, base dominion 1 (was 2), leadership 100 (was 120).** Base dominion 1 adds 30 to every build, so the effective rise is 60 points over the draft | Measured as a general: Hero (Avatar, R4) leading 20 Cinder Warriors wins 42% / 19% / 23% / 57% / 9%, against the Titan's 65% / 43% / 53% / 57% / 21%. At 100 it is a cheaper, weaker, faster general with Avatar, not a better Titan, so the Warlord preset is not a trap. Its parity body value is 20 (Titan 50) |
| R8b | Primordial price | 210 to 220, or trim HP or trample | about 90 points too cheap (about 250) | **Cost 220, and trimmed stats**: hp 150 (was 160), prot 14 (was 15), Crushing Blow 11 (was 12) | At 220 with the trimmed body it measures 100% / 100% / 73% / 100% / 17% against the Great Wyrm's 100% / 100% / 75% / 100% / 5%, with nearly equal HP left. Its extra base dominion (+30 of value) pays for the Wyrm's flight, breath and speed. Forced dormancy is not counted as a price (J2) |
| R5 | Living Flame and its Heat Aura | add `CommanderTraits.defaultScript` and a test (must-fix); defer it with the Briar King and N6 (should-drop) | defer the Living Flame, the Briar King and N6 | **Defer all three to M2**, with the `eachRound` trigger and `frontOnly`. The M2 sketch (A.9) records the `defaultScript` field and its test so the fix is not lost | Both judges' should-drop lists agree, and N6 and `frontOnly` exist only for these two bodies |
| R21a | Undying as a purchasable boon | not raised | defer; keep reform only on the Ash Phoenix | **Defer the boon (J2).** N8 ships for the Phoenix only | It shrinks N8's balance surface to one body, and keeps the `docs/05` rule "gone for good" for every other god |
| R2 | The Mother of Beasts' wolves | the draft staged them leaderless; led by the god she wins 30% / 14% / 16% | (raised N7's cap instead, R17) | **Bound squads (N5).** A squad whose unit is the monthly-summon unit of the pretender's chassis never drags the pretender into a rout, exactly as a battle summon does. The flag is computed at battle setup from the unit type, so no squad carries new state | Re-measured, rows labeled by staging: led ordinary wolves 32% / 14% / 7% / 17% / 2% at month 6; bound wolves 92% / 72% / 16% / 72% / 6%. With a mixed army the Mother still routs when her last standing non-bound squad breaks, unlike Iron Will |
| R3b | Whether Fear may make morale-50 units checkable | asks for a decision | not raised | **Yes.** `docs/04`'s threshold reads modified morale, and Dread and unpaid upkeep already push morale-50 units under it today. Fear follows the same rule. A test pins it | One rule, no special case. The effect is tiny: a morale-48 hornet still rolls 48 against 10 |

### Must-fix items, merged

| # | Item | Ruling and where it lands |
|---|---|---|
| R1 | N5's second clause ("standing squads are counted among non-summoned only") changes today's behavior: Swarm's hornets hold a caster whose real squad broke (J1, J2) | **Dropped.** N5 keeps only "a bound squad that breaks never drags its leader". The claim "no existing content changes behavior" is replaced by the exact corner that changes: a battle-summoned squad below morale 50 (Swarm hornets under the enemy's Dread or Fear) that breaks no longer drags its caster. A regression test pins today's holding behavior, and another pins the corner (A.5 N5). No golden fixture contains that corner; if one does, the commit regenerates it with `npm run golden:battle` and names it |
| R4 | Two shield elements: which element is logged, how amounts stack (J1, J2) | `CombatStats.fireShield` becomes `shields: readonly { element, amount }[]`, merged by element (amounts add). `burnStrikers` logs one `damage` per striker group and element, in `ELEMENTS` order, with `by` set to the largest contributing shield group of that element, which matches the battle design's A3 rule. The detail `burn` event gains `element` (A.5 N4, C.2) |
| R6 | The god's name has nowhere to live after setup; the hash test contradicts it (J1) | `NationState.pretenderName: string \| null`, set by `createGame` from `NationSetup.pretenderName`, read by `settlePretender` on every arrival, return and reform. It is in the save and in the migration. The hash test covers identity fields other than the name; a second test proves the name changes nothing but its own appearances (B.2) |
| R7 | Blessing math: R1 gives 0 points, Fervor costs 1; unlimited stacking (Wild Vigor + Evergreen + Vigor = 35% regeneration) (J1, J2) | Three changes. (1) No effect requires 1 pip; the minimum requirement is 2, so "a god exactly at requirement r can afford one effect of requirement r" now holds for every effect (checked by script). (2) At most one effect per group, and groups are per color and stat (`G.regen`, `R.att`, ...), so Green buys one regeneration effect at most (20%). (3) Bless points are kept per color: each color's pips buy only that color's effects. Pooled points let a five-color god at 6 pips buy +11 attack for its sacreds; per color the maximum is +6 (`bless-bounds*.out.md`). A deviation from Dominions, recorded in A.6 |
| R8c | Cost parity for the other new bodies (J2: World Tree's two springs plus body cost 45 over G3, while a spring is priced 40) | **World Tree: cost 150, base G2 (was G3), one spring (was two).** Parity body value −40, the same as the Cinder Idol (Monolith −30). The parity table (A.10) is a content snapshot test, so every price change shows in review. Phase 12 pins duel bands. Three more prices moved by the same table: Ash Phoenix 120 (was 100), Horned Hunter 140 (was 130), Elder Wyrm 190 (was 170); the Mother of Beasts is 130 (draft 110 plus a 20-point boon in its preset) |
| R9 | Claims about other games and the repository (J1, J2) | Fixed in A.1, A.6, B.1 and the decision table: the Dominions manual confirms bless points `Σ(level − 1)`, cost equal to the requirements, incarnate effects only while the god is awake and alive, and the god blessed in its own dominion. The "5 or more in a path" incarnate rule is labeled as illwiki's, not the manual's (the manual marks incarnate effects in bold, which the transcription lost). The Gideon's Gaming quote is replaced by what the review says, that the creator is "at the forefront". "Bodies come in Dominions' tiers" is corrected: Dominions gives titans dominion 3 and monsters 2; FM's tiers are its own. P12's reason is corrected: `isStealthy` hides a stealthy commander only while every squad it leads is stealthy |
| R10 | Stale sources; brief form 0.5 s, not 0.4; Swarm's 200 dots are 240 (J1, J2) | Re-based on both final specs. No M1 ability repeats, so the brief form never applies to one. Swarm shows 240 dots (12 per sprite × 20 sprites), and C.2 asks the battle track to correct its "200". C.2 lists every amendment the battle track must accept |
| R11 | Share code widths: 7-bit byte lengths cap a 32-character name at 127 bytes; a 280-character myth can exceed 1,023 bytes; pose has 2 bits for M2's 5 (J1) | Name, epithet and title use a 56-symbol Latin alphabet (letters, space, apostrophe, hyphen, period) at 6 bits per symbol, with length fields sized to the caps (5, 6 and 6 bits). The myth is capped at 280 UTF-8 bytes, not characters, with a 9-bit length. Pose has 3 bits, and every enum field is sized for its M2 maximum. Measured: 2,000 random gods round-trip, 10% of them with every text field at its maximum; the longest code is 527 characters; all 362 one-character changes of the example are refused (B.9) |
| R13 | Small exactness (J1): `state.day % 30`; the Living Flame's winged form; `rollGod`'s "always leaves under 20 points" | N7 uses `TIME.daysPerMonth`. The winged form is deferred with the Living Flame; the M2 sketch keeps a fixed flight cue on every form. `rollGod` stops when "no affordable unlocked step remains" (B.9) |
| R14 | The red-flash rule was computed on gamma-encoded sRGB (J2) | WCAG 2.2 defines R, G and B for the saturated-red test as the values of its "relative luminance" definition, which are linearized. On linear values Ember's primary `#FD6533` scores 0.857 and its secondary `#7A1E12` 0.911: both are saturated red. The rule now covers every `flash` cue color and every timed tint (a color change that reverts within 1 s, or a pulse): each must score below 0.78 on linear values, which leaves a 0.02 margin. Ember flashes use `#FFB347` (0.661). The battle track is told that `#E0503A` scores 0.859 and fails, and that `#C8504A` scores 0.795: it passes with no margin, so `#D0605A` (0.742) is offered for the hit tint (C.1, C.2). The test asserts that its helper flags `#FD6533`, so it cannot pass vacuously |
| R15 | Scope fidelity: `docs/00` puts more chassis in M2; `docs/10` has no Phase 6b (J2) | Docs text for `docs/00` and `docs/10` is appended. Ten new chassis move from M2 into M1, and E.5 question 1 asks the owner to sign off |
| R16 | N1 exactness (J2) | A narrowed `EffectSource { id; effects }` type replaces `BattleSpellDef` in `effectGroups`, `hasTargets`, `plan`, `applyEffect` and `fieldEffect`, which read nothing else. Abilities may sit only on commander units. Ability ids are unique and distinct from every spell id. An ability fires only when every effect has a target, as `hasTargets` rules for spells (A.5 N1) |
| R17 | N7: leadership is not a cap (troops can be handed off); Fire Sprites eat no supply and draw no upkeep (J2) | A nation-wide cap per summoned unit (the nation's living troops of that unit, from every source) and leadership both bound each month's summons. Text fixed: wolves eat 1 supply a day and draw no upkeep; Fire Sprites, constructs, eat no supply and draw no upkeep (A.5 N7) |
| R18 | Claims and consistency (J2): existing presets "unchanged" yet Wildfire and Deep Root gained blessings; ten Oakhearts cost 360 gold, not 320; the incarnate 5+ claim | Existing presets are now exactly unchanged: none carries a `blessings` field, so each keeps today's bless. The designer shows their unspent bless points. Chosen Host is deferred, so the gold figure only matters for M2 (Flamebrand 320, Oakheart 360). The incarnate claim is softened (R9); the explicit flag never depended on it |
| R19 | Testability (J2): `rollGod`; D5 edits mapgen's `MapProvince.springs`; names in any script | `rollGod` as R13. D5 writes a new state field, `ProvinceState.extraSprings`, and the mana selector reads both lists. Names use the Latin alphabet of R11 and are rendered as DOM text; localization is out of M1's scope (`docs/10`) |
| R20 | AI: `armyPower` cannot see summons, Fear or trample (J2) | `ChassisDef.aiPower`: each body's Light Infantry equivalent, calibrated by `sim:duel --calibrate` (values in A.11), added for pretenders, with battle-start summons counted as troops. Phase 7 is not touched; the term joins `armyPower` when the UI spec moves it into the sim (Phase 8) and is recalibrated in Phase 12 |
| R12b | Art count too low; the 256 px preview shows parts drawn for 64 px; no visual review beyond a bounding box (J1, J2) | Recounted from the final scope, with the derivation per group: 171 files (B.10). The deferrals of R5 and R12 remove every new rig. Each chassis gets one portrait detail layer drawn for 256 px and hidden below 128 px. A contact-sheet lab page and a Playwright run produce per-chassis screenshots for the owner to review (B.12) |

### Should-drop items

| Item | J1 | J2 | Ruling |
|---|---|---|---|
| D6, the breath color as a design field | drop to the look in M1 | — | **Accepted.** `PretenderLook.breath`, display only, as `docs/05` already says. M2 makes it a design field when element resistances give it a rules effect |
| Living Flame, Briar King, N6 | defer | defer | **Accepted** (R5) |
| Chosen Host and Deep Lore boons | defer | defer | **Accepted.** M1 boons are Sacred Spring and Avatar |
| Undying boon | — | defer | **Accepted** (R21a) |
| Adjust appearance in game, `#god=` links, random presets for AI opponents | defer | defer | **Accepted.** AI nations take their preset's look (B.2) |
| Designer sound through the battle bus | defer | defer | **Accepted.** It also matches the UI spec's ruling 19 (no UI cues in M1) |
| Auras and flourishes | 2 each in M1 | — | **Accepted**: aura halo and motes; flourish sigil wheel and halo burst |
| Bespoke god deaths for the new chassis | generic per rig | the battle design's god death | **Accepted.** The battle design's god death plays for every chassis, with the chassis's death style from its look row (A.4) |
| Whole-body slots | 2 variants | overlays | **Overlays** (R12) |
| New avian and behemoth rigs | — | defer; Phoenix on the wyrm rig, Primordial on the quadruped rig | **Accepted.** The Elder Wyrm uses the serpent rig. No new rig in M1 |
| "About 12 million looks per chassis" | drop | — | **Dropped.** B.11 compares with AoW4 axis by axis |
| The map effect budget "1 ms CPU / 1.5 ms GPU" | drop unless measured | — | **Dropped.** Replaced by countable caps that `planMapFx` and the map effect pool test (C.4) |
| W, U and B pips in M1 | say plainly they buy only blessings, or drop the "rainbow mage" family | — | **Both.** In M1, W, U and B pips buy only that color's blessings, because no W, U or B spell exists in M1 (`docs/02` decisions). The Oracle's M1 family is "mage god", whose splash is the other shipped color |
