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

---

## 0. The design in sixteen lines

1. **Sixteen chassis in M1, eleven per nation**: the six of today plus ten new ones. Six are
   generic, five Red, five Green. A nation chooses from the generic realm and from the realms
   of its own colors.
2. **Prices follow a parity table.** Each chassis's cost is its base pips, its base dominion
   above 1, its built-in options and its body; the table is a snapshot test, and staged duels
   in the real resolver set the bodies (A.10).
3. **Seven small new rules carry the signatures**, each testable alone: battle-start
   abilities that fire existing primitives (N1); multi-strike weapons for trample (N2); spell
   power (N3); retaliation shields by element (N4); bound squads that never drag their
   commander into a rout (N5); a monthly summon (N7); reform after death for the Ash Phoenix
   (N8).
4. **Seven data-only design rules**: realms, a per-chassis price for a new color, scale
   attunement, a minimum awakening, starting springs, the god's name, and a role tag.
5. **Blessings become a Dominions 6-style menu.** Bless points per color are
   `max(0, pips − 1)`; an effect costs `max(1, requirement − 1)`; requirements run 2 to 6;
   one effect per group. Today's fixed bless is the default, so every existing design keeps
   its exact bless. Some effects are incarnate: they work only while the god is on the map.
6. **Two boons**: Sacred Spring 40 and Avatar 40. Iron Will, Undying, Chosen Host and Deep
   Lore are M2.
7. **Twelve presets**: today's six exactly unchanged and six new, each with a curated look.
   All fit their budgets (computed). The first preset of each nation stays the AI default.
8. **Customization follows AoW4's split**: any look on any build. The look lives outside
   `GameState`, in saved gods, the share code and the save file's UI block, and the sim cannot
   import it.
9. **Per chassis: 4 overlay slots × 3 variants**, from shared part families, plus markings,
   3 chosen color channels, up to 5 sliders, 3 poses, 2 aura shapes and 2 cast flourishes.
10. **Identity**: name, epithet, title, pronoun (it included), and a templated myth with an
    override; a sigil (6 frames × 16 charges) and a banner division (6). Banner colors stay
    fixed by the palette tests; the sigil carries identity by shape.
11. **Random god and random look** are seeded and reproducible, respect locks, and keep a
    10-roll history. **A share code** (`FM1-`, bit-packed, CRC-16, base64url) carries the
    whole god: 35 characters with a one-letter name, 67 for "Vulkra the Unburnt, Lord of
    Cinders", 527 at every maximum.
12. **Art**: 171 small SVG files in Phase 11 (49 body parts for the new chassis, 83 cosmetic
    parts, 16 portrait detail layers, 22 sigil shapes, 1 overlay), on existing rigs only.
    Markings, glyphs, auras, flourishes, divisions, poses and sliders are procedural.
13. **Flashy magic is a grammar**: look = template(primitive) × verb(color) ×
    material(element) × tier(level and breadth), plus the god's flourish. Every spell,
    ability and ritual gets a correct look on day one; the eleven M1 battle spells keep the
    battle design's storyboards and durations and gain layer, sound and reduced-motion detail.
14. **The map gets its own cue model** (`planMapFx`), fed by messages, with one optional sim
    addition: an effect tag on messages and a message to the victim of a hostile ritual.
15. **The designer has six steps in two groups**, BUILD (Body, Magic, Realm, Blessings) and
    LOOK (Appearance, Identity), beside a live preview and the `PretenderCard`. Every control
    validates the design its click would produce, as the UI spec rules.
16. **Plan**: Phase 6b in three commits (design rules; battle rules after the battle track's
    S1; map rules and content), then additions to Phases 8 to 12. **M2**: White, Blue and
    Black chassis and menus, the deferred bodies and boons, element resistances, map and menu
    sound, the free color picker, 6 × 5 slots.

---

## 1. Decisions

The draft's decision table, corrected. P2, P3, P5, P7, P8, P9, P10 and P11 stand as the draft
argued them; the others changed.

| # | Topic | Decision | Why |
|---|---|---|---|
| P1 | Who may take which chassis | **Realms**: generic chassis for everyone, color chassis for nations with that color in their identity | Dominions gives each nation its own pool of pretenders ([dom6inspector data](https://github.com/larzm42/dom6inspector/tree/master/gamedata)); a realm keeps 11 cards per nation instead of 16 and keeps balance testable. M3 two-color nations get both realms. It replaces the `docs/05` line "The nation offers all chassis" |
| P2 | Trample on the existing size-5 and size-6 bodies | **No**; new bodies only | Measured in the draft: trample 3 × 2 lifted the Great Wyrm from 76% to 100% against 20 Heavy Infantry. Today's presets and Phase 7's tuning stay untouched |
| P3 | Fear | **A battle-start morale debuff**, −2 for the battle on every enemy group | A forced check every round would break a morale-10 squad 46% of the time per round (draft) |
| P4 | Incarnate blessings | **An explicit flag per effect**; the standard and greater forms (today's bless) are never incarnate | The flag does not depend on any threshold rule. The manual confirms incarnate effects work only while the god is awake and alive; the "5 or more in a path" rule is illwiki's, and the manual's own marking (bold) did not survive transcription ([manual ch. 3](https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html); [illwiki](https://illwiki.com/dom5/dom6/bless)) |
| P5 | Where the look lives | **Outside `GameState`** | The sim cannot read what it does not hold |
| P6 | The god's name | **A sim string**, `NationState.pretenderName` | Messages are prebuilt strings in the sim and battle rosters carry commander names; a label never changes an outcome, and B.2 tests that |
| P7, P8 | Particle counts, full-scene flash | **The battle design wins** (S2.10, S2.14) | It is the final battle spec |
| P9 | Chromatic aberration at the god's death | **No in M1**; open question | Players report eye strain from it ([example](https://thegameswiki.com/crimson-desert/wiki/chromatic-aberration)) |
| P10 | Map and designer sound | **None in M1** | The battle design keeps music and map or menu sound out of M1; the UI spec's ruling 19 has no UI cues |
| P11 | Six designer steps | **Two labeled groups on a rail** | The designer is a full screen, which the UI spec exempts from its 4-tab limit for dock panels (UI spec 1.1); grouping still keeps BUILD before LOOK, as AoW4 does ([GamePressure](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c)) |
| P12 | A stealthy army leader (Horned Hunter) | **Not stealthy** | `isStealthy` (`src/sim/commanders.ts`) hides a stealthy commander only while every squad it leads is stealthy, so a stealthy Hunter would hide only when it walks alone. That adds a lone-scout role the Wild Spirit already owns |
| P13 | Summoned and monthly troops routing their god | **Bound squads never drag their commander** (N5) | Measured: the Horned Hunter with 8 battle-summoned wolves wins 79% against the weak plains fixture under N5; the Mother of Beasts with 12 bound wolves wins 92% (with ordinary wolves, 32%) |
| P14 | Iron Will | **Not in M1** | Rulings R3 |
| P15 | Bless points | **Per color** | Rulings R7 |

---

## A. Pretender variety (Dominions-like)

### A.1 Principles

- **One price moves four levers.** Dominions sells a body, free paths, the price of a new path
  and a base dominion together, and its pretender classes differ in all four: mages pay
  little to branch, monsters pay a lot, idols buy dominion and scales but cannot walk
  ([manual ch. 3](https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html);
  research-dominions 4.2). FM adopts the four levers per chassis. Its tiers are its own:
  Dominions gives titans base dominion 3 and monsters 2 (research-dominions 4.2), while FM
  gives monsters 2 to 3 and titans 2, because FM's titans carry its bless rush and its
  monsters its dominion sleepers.

  | FM tier | Base dominion | First pip of a new color | Body | M1 chassis |
  |---|---|---|---|---|
  | Seer | 1 | 40 (Oracle 30 after its discount) | fragile caster | Oracle of the Flux, Ember Hierophant |
  | Hero and titan | 1 to 2 | 50 to 60 | fighter, leader or summoner | Ascended Hero, Titan, Ash Colossus, Pyre Lord, Horned Hunter, Mother of Beasts |
  | Beast and monster | 2 to 3 | 80 | strong body, locked magic | Great Wyrm, Primordial, Ash Phoenix, Wild Spirit, Elder Wyrm |
  | Idol | 4 | 50 | immobile engine | Living Monolith, Cinder Idol, World Tree |

- **Each chassis answers one strategy question**, after the Dominions build families of
  research-dominions 5.1 (bless rush, super combatant, mage god, dominion push, scales
  sleeper). FM adds three that its new rules open: summoner, undying raider, cheap general.
- **The color pie is a hard limit** (`docs/02` section 1): Green never flies or evades, Red
  never defends, White never summons monsters, Blue never heals, Black never heals the
  living. Every new body was checked against it.
- **Signatures are data.** Each ability is an existing `docs/02` primitive fired on an event
  (N1).
- **A body looks like what it does.** Parts that carry mechanics (wings for flying, roots for
  immobile, the stealth flicker, embers for a fire shield) are fixed, never cosmetic slots
  (B.3).

### A.2 The M1 roster

Eleven per nation. **New** marks the ten additions.

| Realm | Chassis | Role | Cost | Base pips | Base dom. | Signature | Strategy family |
|---|---|---|---|---|---|---|---|
| generic | Oracle of the Flux | mage | 20 | — | 1 | pips −10 each; researches | Mage god (splash into the other shipped color) |
| generic | Titan | leader | 120 | nation 1 | 2 | leadership 100 | Bless rush with a general |
| generic | Great Wyrm | monster | 220 | nation 2 | 2 | flying, breath | Super combatant |
| generic | Living Monolith | idol | 60 | — | 4 | dominion checks ×2 | Dominion push |
| generic | **Ascended Hero** | leader | 100 | nation 1 | 1 | Avatar built in, speed 3 | Cheap, fast general that wears the bless |
| generic | **Primordial** | monster | 220 | nation 2 | 3 | must sleep; Fear; trample | Scales sleeper with a monster payoff |
| R | Ash Colossus | fighter | 100 | R1 | 1 | fire shield 5 | Brawler |
| R | **Ash Phoenix** | raider | 120 | R1 | 2 | flying; reforms at the capital; Growth attunement | Undying raider |
| R | **Pyre Lord** | summoner | 140 | R2 | 2 | 6 Fire Sprites at battle start | Battle summoner |
| R | **Cinder Idol** | idol | 110 | R2 | 4 | 2 Fire Sprites a month; Dread attunement | Dread dominion |
| R | **Ember Hierophant** | mage | 60 | R2 | 1 | spell power 3 | Battle mage |
| G | Wild Spirit | raider | 80 | G1 | 2 | stealthy, regeneration | Hidden raider |
| G | **World Tree** | idol | 150 | G2 | 4 | one more G spring at the capital; Sanctity attunement | Mana and temple economy |
| G | **Horned Hunter** | summoner | 140 | G2 | 2 | 8 Wolves at battle start; Fury attunement | Hunter warlord |
| G | **Elder Wyrm** | monster | 190 | G1 | 2 | wingless, regeneration, trample | Green super combatant |
| G | **Mother of Beasts** | summoner | 130 | G1 | 2 | 2 Wolves a month, bound to her | Growing pack |

`NationDef.chassis` keeps its meaning as the two "fits" badges (UI spec 3.3): Titan and Ash
Colossus for the Cinder Horde, Wild Spirit and Living Monolith for Thornwood.

### A.3 Design rules (data only)

Each rule is a field read by `designCost`, `validatePretender` or `createGame`. The pricing
rules live only in `src/sim/pretender.ts`, as today.

| # | Rule | Field | Exact behavior | Test |
|---|---|---|---|---|
| D1 | Realm | `ChassisDef.realm: 'generic' \| Color` | `availableChassis(def)` returns the generic chassis plus those whose realm is in `def.colors`, in content order. `validatePretender` refuses others: "Pyre Lord is not offered to Thornwood" | both M1 nations have exactly 11; a foreign-realm design is refused with that message |
| D2 | New-color price | `ChassisDef.newColorFirstPip` | `pipStepCost` uses it in place of `PRETENDER_COSTS.newColorFirstPip` (which is removed), then subtracts `pipDiscount` | Oracle's first U pip costs 30; Great Wyrm's 80; Titan's 60 (today's price) |
| D3 | Scale attunement | `ChassisDef.attunement?: readonly { axis: ScaleAxis; toward: 'positive' \| 'negative' }[]` | A step toward an attuned pole costs `scaleStep.own` (20), whatever the pole's color. No refund; limits stay ±3 | Ash Phoenix's Growth step costs 20 for the Cinder Horde; a Phoenix's Rot step still costs 40 |
| D4 | Minimum awakening | `ChassisDef.minAwakening?: 'dormant' \| 'imprisoned'` | Refused below it: "Primordial must start at least dormant". Not counted as a price | an awake Primordial is refused; a dormant one validates |
| D5 | Starting springs | `ChassisDef.startSprings?: { color: Color \| 'nation'; count: number }`; new state field `ProvinceState.extraSprings: Color[]` | `createGame` appends the chassis's springs, then the Sacred Spring boon's (A.7), to the capital's `extraSprings`. `provinceEconomy` counts `mapProvince.springs` and `extraSprings` alike (`MANA.perSpring` each). Mapgen data is never edited. The springs stay with the province if it changes hands | the World Tree's capital earns `MANA.perSpring` more G a month; mapgen validation is unchanged; a captured capital pays its new owner |
| D7 | The god's name | `NationSetup.pretenderName?: string`; new state field `NationState.pretenderName: string \| null` | Valid when 1 to 24 symbols from the identity alphabet (letters A to Z and a to z, space, apostrophe, hyphen, period), starting with a letter, with no leading or trailing space and no two spaces in a row (`validatePretenderName`). `createGame` refuses an invalid name and stores a valid one; absent means null. `settlePretender` names every pretender commander it creates `nation.pretenderName ?? unitDef(body).name`, on arrival, after Godless, and on reform | refused when too long, empty, or holding another symbol; the commander, its arrival message and its battle roster carry the name; a reformed Phoenix keeps it |
| D8 | Role | `ChassisDef.role: ChassisRole` | `'mage' \| 'leader' \| 'fighter' \| 'monster' \| 'raider' \| 'summoner' \| 'idol'`. Read by the AI (A.11), the designer's filter chips and `pretenderReading` | every chassis has one |

D6 of the draft (a breath color in the design) is now `PretenderLook.breath` (B.2): display
only, as `docs/05` already rules for the Great Wyrm's breath.

```ts
// src/content/pretenders/chassis.ts
export type ChassisRole = 'mage' | 'leader' | 'fighter' | 'monster' | 'raider' | 'summoner' | 'idol';
export interface ChassisDef {
  id: string;
  name: string;
  /** Design points. */
  cost: number;
  basePips: { color: Color | 'nation'; count: number } | null;
  baseDominion: number;
  body: UnitTypeId;
  pipDiscount: number;
  dominionFactor: number;
  notes: string;
  /** D1: offered to every nation ('generic') or to nations with this color. */
  realm: 'generic' | Color;
  /** D8. */
  role: ChassisRole;
  /** D2: design points for the first pip of a color outside the nation's identity, before the discount. */
  newColorFirstPip: number;
  /** D3. */
  attunement?: readonly { axis: ScaleAxis; toward: 'positive' | 'negative' }[];
  /** D4. */
  minAwakening?: 'dormant' | 'imprisoned';
  /** D5. */
  startSprings?: { color: Color | 'nation'; count: number };
  /** N7: troops that join the pretender on the first day of each month; cap counts the nation's whole stock of the unit. */
  monthlySummon?: { unit: UnitTypeId; count: number; cap: number };
  /** N8: reforms at the capital this many days after dying in its nation's dominion. */
  reform?: { days: number };
  /** A.7: the Avatar boon is built in. */
  avatar?: true;
  /** A.11: Light Infantry equivalent of the body and its battle-start summons, for armyPower. */
  aiPower: number;
}
```

### A.4 The M1 chassis catalog

Stats the table leaves out take the baseline (mr 10, prec 10), as `docs/03` decides. "NC" is
the first pip of a new color before the discount. Leadership is the troop count led.
Immobile bodies keep sim size as listed; the battle draws them larger (`visualSize`, A.4
looks).

| Chassis | Cost | Base pips | Dom | NC | hp | str | att | def | prot | mor | size | mapSpeed | lead | Weapons | Abilities and tags |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Oracle of the Flux | 20 | — | 1 | 40 | 12 | 10 | 10 | 10 | 2 | 14 | 2 | 2 | 20 | Staff 2 | pips −10 each; researches |
| Titan | 120 | nation 1 | 2 | 60 | 60 | 20 | 14 | 12 | 10 | 18 | 4 | 2 | 100 | Great Sword 8 | — |
| Great Wyrm | 220 | nation 2 | 2 | 80 | 120 | 24 | 15 | 10 | 16 | 20 | 6 | 2 | 20 | Breath 12 (range 3, ammo 5), Bite 10 | flying |
| Living Monolith | 60 | — | 4 | 50 | 200 | 10 | 10 | 10 | 25 | 50 | 1 | 0 | 20 | none (unarmed) | immobile; dominion checks ×2 |
| **Ascended Hero** | 100 | nation 1 | 1 | 50 | 32 | 15 | 15 | 15 | 8 | 20 | 2 | 3 | 100 | Hero's Blade 7 | Avatar (built in) |
| **Primordial** | 220 | nation 2 | 3 | 80 | 150 | 22 | 12 | 6 | 14 | 30 | 6 | 1 | 20 | Crushing Blow 11; Trample 2 (strikes 2, targets of size ≤ 2) | Fear (battle start); minimum dormant |
| Ash Colossus | 100 | R1 | 1 | 60 | 80 | 22 | 10 | 10 | 14 | 10 | 5 | 2 | 20 | Burning Fists 6 fire | fire shield 5 |
| **Ash Phoenix** | 120 | R1 | 2 | 80 | 50 | 14 | 15 | 16 | 8 | 18 | 3 | 3 | 40 | Burning Talons 8 fire, armor piercing | flying; fire shield 5; reform 90 days; attuned to Growth |
| **Pyre Lord** | 140 | R2 | 2 | 60 | 55 | 18 | 13 | 12 | 8 | 18 | 4 | 2 | 80 | Flaming Glaive 7 fire | Kindle the Host (6 Fire Sprites at battle start) |
| **Cinder Idol** | 110 | R2 | 4 | 50 | 180 | 14 | 10 | 6 | 22 | 50 | 6 | 0 | 40 | none (unarmed, str 14) | immobile; 2 Fire Sprites a month (cap 20); attuned to Dread |
| **Ember Hierophant** | 60 | R2 | 1 | 40 | 14 | 10 | 10 | 11 | 2 | 14 | 2 | 2 | 30 | Staff 2 | spell power 3; does not research |
| Wild Spirit | 80 | G1 | 2 | 80 | 30 | 10 | 10 | 16 | 4 | 10 | 2 | 2 | 20 | Claws 5 | stealthy; regeneration 10% |
| **World Tree** | 150 | G2 | 4 | 50 | 250 | 20 | 10 | 4 | 20 | 50 | 6 | 0 | 40 | Lashing Boughs 8 | immobile; regeneration 10%; 1 G spring at the capital; attuned to Sanctity |
| **Horned Hunter** | 140 | G2 | 2 | 60 | 60 | 18 | 14 | 13 | 6 | 18 | 4 | 3 | 60 | Hunting Spear 7 | Call the Hunt (8 Wolves at battle start); attuned to Fury |
| **Elder Wyrm** | 190 | G1 | 2 | 80 | 130 | 21 | 12 | 8 | 12 | 22 | 6 | 1 | 20 | Bite 10; Trample 2 (strikes 2, targets of size ≤ 2) | regeneration 10% |
| **Mother of Beasts** | 130 | G1 | 2 | 60 | 70 | 18 | 12 | 11 | 8 | 20 | 4 | 2 | 60 | Maul 9 | 2 Wolves a month in own dominion (cap 24), bound to her (N5) |

The six existing bodies keep every stat. Only their new fields are added (D1, D2, D8,
`aiPower`). Their new-color prices change from the flat 60: Oracle 30 net (was 50), Living
Monolith 50, Great Wyrm and Wild Spirit 80. No preset buys a new color, so no preset's cost
moves (A.8).

**Content, exactly.** Trample is an ordinary weapon record with the N2 fields:

```ts
// src/content/units/pretenders.ts (new bodies, excerpt)
const TRAMPLE: WeaponDef = { name: 'Trample', dmg: 2, strikes: 2, maxTargetSize: 2 };
primordial:      { ...body, id: 'primordial', name: 'Primordial', hp: 150, str: 22, att: 12, def: 6, prot: 14, mor: 30, size: 6, mapSpeed: 1,
                   weapons: [{ name: 'Crushing Blow', dmg: 11 }, TRAMPLE], tags: [], abilities: ['primordialFear'],
                   commander: { leadership: 20, pips: {}, holy: 0, research: false } },
elderWyrm:       { ...body, id: 'elderWyrm', name: 'Elder Wyrm', hp: 130, str: 21, att: 12, def: 8, prot: 12, mor: 22, size: 6, mapSpeed: 1,
                   weapons: [{ name: 'Bite', dmg: 10 }, TRAMPLE], tags: [], regeneration: 0.1,
                   commander: { leadership: 20, pips: {}, holy: 0, research: false } },
ashPhoenix:      { ...body, id: 'ashPhoenix', name: 'Ash Phoenix', hp: 50, str: 14, att: 15, def: 16, prot: 8, mor: 18, size: 3, mapSpeed: 3,
                   weapons: [{ name: 'Burning Talons', dmg: 8, element: 'fire', armorPiercing: true }], tags: ['flying'], fireShield: 5,
                   commander: { leadership: 40, pips: {}, holy: 0, research: false } },
pyreLord:        { ...body, id: 'pyreLord', name: 'Pyre Lord', hp: 55, str: 18, att: 13, def: 12, prot: 8, mor: 18, size: 4,
                   weapons: [{ name: 'Flaming Glaive', dmg: 7, element: 'fire' }], tags: [], abilities: ['kindleTheHost'],
                   commander: { leadership: 80, pips: {}, holy: 0, research: false } },
hornedHunter:    { ...body, id: 'hornedHunter', name: 'Horned Hunter', hp: 60, str: 18, att: 14, def: 13, prot: 6, mor: 18, size: 4, mapSpeed: 3,
                   weapons: [{ name: 'Hunting Spear', dmg: 7 }], tags: [], abilities: ['callTheHunt'],
                   commander: { leadership: 60, pips: {}, holy: 0, research: false } },
emberHierophant: { ...body, id: 'emberHierophant', name: 'Ember Hierophant', hp: 14, def: 11, prot: 2, mor: 14, size: 2, spellPower: 3,
                   weapons: [COMMANDER_WEAPONS.staff], tags: [], commander: { leadership: 30, pips: {}, holy: 0, research: false } },
// Ascended Hero, Cinder Idol, World Tree and Mother of Beasts follow the table the same way; the two idols carry
// tags ['immobile'] and mapSpeed 0, the World Tree regeneration 0.1, the Cinder Idol weapons [].
```

The existing `UnitDef.fireShield` field stays (the Ash Colossus has it, and the Ash Phoenix
uses it too); N4 folds it into the new shield list of `CombatStats`.

```ts
// src/content/abilities.ts (N1)
export const ABILITIES = {
  primordialFear: { id: 'primordialFear', name: 'Fear', trigger: 'battleStart', color: null,
    effects: [{ kind: 'debuff', stat: 'mor', delta: -2, duration: { kind: 'battle' }, targets: { kind: 'allEnemy' } }] },
  kindleTheHost: { id: 'kindleTheHost', name: 'Kindle the Host', trigger: 'battleStart', color: 'R',
    effects: [{ kind: 'summon', unit: 'fireSprite', count: 6, side: 'friendly' }] },
  callTheHunt: { id: 'callTheHunt', name: 'Call the Hunt', trigger: 'battleStart', color: 'G',
    effects: [{ kind: 'summon', unit: 'wolf', count: 8, side: 'friendly' }] },
} as const satisfies Record<string, UnitAbility>;
export type AbilityId = keyof typeof ABILITIES;
```

```ts
// src/content/pretenders/chassis.ts (new records, the fields A.3 adds)
ascendedHero:    { cost: 100, basePips: { color: 'nation', count: 1 }, baseDominion: 1, realm: 'generic', role: 'leader',   newColorFirstPip: 50, avatar: true },
primordial:      { cost: 220, basePips: { color: 'nation', count: 2 }, baseDominion: 3, realm: 'generic', role: 'monster',  newColorFirstPip: 80, minAwakening: 'dormant' },
ashPhoenix:      { cost: 120, basePips: { color: 'R', count: 1 },      baseDominion: 2, realm: 'R',       role: 'raider',   newColorFirstPip: 80,
                   attunement: [{ axis: 'growth', toward: 'positive' }], reform: { days: 90 } },
pyreLord:        { cost: 140, basePips: { color: 'R', count: 2 },      baseDominion: 2, realm: 'R',       role: 'summoner', newColorFirstPip: 60 },
cinderIdol:      { cost: 110, basePips: { color: 'R', count: 2 },      baseDominion: 4, realm: 'R',       role: 'idol',     newColorFirstPip: 50,
                   attunement: [{ axis: 'sanctity', toward: 'negative' }], monthlySummon: { unit: 'fireSprite', count: 2, cap: 20 } },
emberHierophant: { cost: 60,  basePips: { color: 'R', count: 2 },      baseDominion: 1, realm: 'R',       role: 'mage',     newColorFirstPip: 40 },
worldTree:       { cost: 150, basePips: { color: 'G', count: 2 },      baseDominion: 4, realm: 'G',       role: 'idol',     newColorFirstPip: 50,
                   attunement: [{ axis: 'sanctity', toward: 'positive' }], startSprings: { color: 'G', count: 1 } },
hornedHunter:    { cost: 140, basePips: { color: 'G', count: 2 },      baseDominion: 2, realm: 'G',       role: 'summoner', newColorFirstPip: 60,
                   attunement: [{ axis: 'lore', toward: 'negative' }] },
elderWyrm:       { cost: 190, basePips: { color: 'G', count: 1 },      baseDominion: 2, realm: 'G',       role: 'monster',  newColorFirstPip: 80 },
motherOfBeasts:  { cost: 130, basePips: { color: 'G', count: 1 },      baseDominion: 2, realm: 'G',       role: 'summoner', newColorFirstPip: 60,
                   monthlySummon: { unit: 'wolf', count: 2, cap: 24 } },
// every new chassis: pipDiscount 0, dominionFactor 1, and aiPower from A.11
```

**Looks for the battle presentation** (rows for the battle design's S2.2 unit-look table; every
value is from its existing unions except the archetype names, which follow its pattern of one
archetype per pretender body, C.2):

| Chassis | Archetype / rig | Visual size | Material | Blood | Voice | Weapon motions | Death style | Extras |
|---|---|---|---|---|---|---|---|---|
| Ascended Hero | ascendedHero / biped | — | mail | red | human deep | Hero's Blade: slash, medium | fallBack | aura |
| Primordial | primordial / quadruped | 6 | hide | red | wyrm | Crushing Blow: smash, huge; Trample: slam, huge | topple | — |
| Ash Phoenix | ashPhoenix / wyrm (no breath) | 3 | ember | ember | salamander, breathy | Burning Talons: rake, medium | burnOut | fireShield |
| Pyre Lord | pyreLord / biped | — | scale | red | human deep | Flaming Glaive: chopThrust, heavy | fallBack | — |
| Cinder Idol | cinderIdol / slab | 6 | stone | none | stone | unarmed: shove (brazier shockwave) | shatter | immobile |
| Ember Hierophant | emberHierophant / biped | — | soft | red | human | Staff: bonk | crumple | aura |
| World Tree | worldTree / treant | 6 | wood | sap | treant | Lashing Boughs: slam, huge | topple | immobile, regen |
| Horned Hunter | hornedHunter / biped | — | hide | red | human deep | Hunting Spear: thrust, medium | fallBack | — |
| Elder Wyrm | elderWyrm / serpent | 6 | scale | red | wyrm | Bite: neckLunge, huge; Trample: slam, huge | topple | regen |
| Mother of Beasts | motherOfBeasts / biped | — | hide | red | giant (rate 0.9) | Maul: smash, heavy | fallBack | — |

**Build strategies** (each example fits its budget, computed in `costs-final.mjs`; costs are
design points against the budget for that awakening):

| Chassis | Strategy | Example build (cost / budget) | Weak side |
|---|---|---|---|
| Oracle of the Flux | Mage god: researches, and branches cheaply into the other shipped color | R6 G3, dominion 8, Lore 2, dormant: 495 / 550 | 12 HP; must hide |
| Titan | General with a strong body and the bless | the Warlord preset: 385 / 400 | alone, wins 40% against a weak province |
| Great Wyrm | Super combatant that clears provinces from day one | R4, dominion 5, Fury 1, awake: 385 / 400 | little left for scales |
| Living Monolith | Dominion engine at the capital, rituals | G2, dominion 10, Growth 2: 340 / 400 | dies if the capital's battle is lost |
| Ascended Hero | Cheap fast general; Avatar lets the bless lift the god too | R4, dominion 5, Fury 3, Turmoil 2: 395 / 400; or Thornwood G6, dominion 3, Growth 2, Wild 1: 370 / 400 | 32 HP; a weaker general than the Titan |
| Primordial | Sleep, buy scales and dominion with the refund, then a monster arrives | R4, dominion 6, Fury 3, Turmoil 3, Growth 1, dormant: 525 / 550 | no god for 11 months; speed 1 |
| Ash Colossus | Cheap brawler that burns whoever hits it; with Avatar it carries the bless | R4, dominion 4, Fury 3, Turmoil 1, Avatar: 385 / 400 | dominion 1 base; morale 10 |
| Ash Phoenix | Early raider that cannot die for good at home; Growth is cheap, so Red can grow | the Undying Flame preset: 385 / 400 | weak against armies (56% alone against the weak fixture) |
| Pyre Lord | Leads 80 and opens every battle with 6 flying sprites | the Pyre Host preset: 385 / 400 | sprites have 6 HP |
| Cinder Idol | High dominion with cheap Dread; a sprite garrison grows at home | the Dread Idol preset: 395 / 400 | cannot move |
| Ember Hierophant | Battle mage: Ember Dart 15, Fireball 13, Pyre Storm 17 | R6, dominion 4, Fury 3, Turmoil 1: 360 / 400 | 14 HP; does not research |
| Wild Spirit | Hidden raider and scout god; with Avatar it carries the bless | G4, dominion 5, Growth 3, Wild 2, Avatar: 385 / 400 | 30 HP |
| World Tree | Mana and temples: one more G spring, cheap Sanctity | the Heartwood preset: 395 / 400 | cannot move |
| Horned Hunter | Fast warlord that opens with 8 wolves; Fury is cheap for Green | the Hunt Lord preset: 395 / 400 | prot 6 |
| Elder Wyrm | Green super combatant: regenerates, tramples, slow | G4, dominion 4, Growth 2, Wild 1, awake: 385 / 400 | speed 1, no flight |
| Mother of Beasts | A pack that grows by 2 a month to 24 and never drags her into a rout | the Mother of the Pack preset: 395 / 400 | weak in the first months (60% against the weak fixture with 6 wolves) |

### A.5 New rules, specified exactly

Every rule is deterministic: no new randomness source, a fixed order, and any new rng draw
inside the resolver's existing sequence. N1 to N5 are battle rules and land after the battle
track's S1 (which also edits `src/sim/battle`); N7 and N8 are map rules. N6 (home terrain for
a body) is M2 with the bodies that needed it. Each rule lands with its tests in `tests/`
mirroring `src/`.

#### N1. Battle-start abilities

```ts
// src/content/types.ts
export interface UnitAbility {
  /** Unique among abilities and distinct from every spell id: it is also the source id of the stat changes it makes. */
  id: string;
  name: string;
  /** M1 has battle start only; M2 adds 'eachRound' (A.9). */
  trigger: 'battleStart';
  /** Presentation only: the color whose look its cue takes (C.5); null takes its first effect's template look. The sim never reads it. */
  color: Color | null;
  /** docs/02 battle primitives, validated like a spell's effects. */
  effects: readonly BattleEffect[];
}
// UnitDef.abilities?: readonly AbilityId[]   (commander units only; content validation)

// src/content/spells/types.ts
/** What target planning and effect application read from a spell; BattleSpellDef has both fields. */
export interface EffectSource { id: string; effects: readonly BattleEffect[] }

// src/sim/battle/types.ts   BattleCommanderSetup gains:  abilities: readonly UnitAbility[];
// src/sim/battle/field.ts   Group (commander parts) gains: abilities: readonly UnitAbility[];
// src/sim/battle/events.ts  BattleEvent gains:
//   | { kind: 'ability'; unit: BattleUnitRef; ability: string; targets: BattleUnitRef[] }
```

- **Refactor, types only.** `effectGroups`, `hasTargets`, `plan` (`spells.ts`), `applyEffect`
  and `fieldEffect` (`effects.ts`) take `source: EffectSource` where they took
  `spell: BattleSpellDef`. They read only `source.id` and `source.effects`, so nothing else
  changes and every spell call still type-checks.
- **When.** In round 1 only, inside the `scripts` span (battle design S1.4) and before
  `scriptsPhase`: `if (round === 1) abilityPhase(field, round, rng, replay)`.
- **Who and in what order.** Commanders in caster order (`interleaved`: attacker 0, defender
  0, attacker 1, ...), skipping any that is not `active`; within a commander, its abilities in
  list order. Whether the pretender attacks or defends does not matter.
- **How.** An ability fires only when `hasTargets(field, c, ability)` holds, the rule spells
  use: every effect has something to land on (summons always do). Then
  `plan(field, c, ability, rng)` chooses targets exactly as for a spell, so an ability's
  effects share targets as a spell's do. It logs `ability` with the union of planned groups,
  then lands each plan with `applyEffect(..., power = 0)` (N3). No fatigue, no carried mana,
  no pips, no research, and no `removeSource`, since it fires once.
- **Setup.** `commanderSetup` resolves the body's ability ids through `abilityDef(id)`.
  `sideSetup` adds the stats of every unit an ability summons to `side.summons`, as it does
  for known spells (`side.summons[e.unit] ??= statsFor(ctx, e.unit, 0, false)`).
- **Record.** The battle design's `CommanderSetupRecord` stores `abilities: string[]`, as it
  stores spells; `fromSetupRecord` resolves them through `abilityDef` and throws on an unknown
  id.
- **Replay fold.** `foldReplay` ignores `ability` (`case 'ability': break;` with its
  exhaustive `never` check).
- **Content validation** (`tests/content/abilities.test.ts`, and per CLAUDE.md the new
  chassis join the content fixtures): every ability's effects pass `battleEffectProblems`;
  ids are unique and none equals a spell id; only units with `commander` traits list
  abilities; every listed id exists; summoned units exist and are not commanders.
- **Tests** (`tests/sim/battle/abilities.test.ts`):
  1. Kindle the Host: an `ability` event, then a `summon` of 6 Fire Sprites led by the Pyre
     Lord's ref, both before round 1's `ranged` phase marker.
  2. Call the Hunt: the same with 8 Wolves.
  3. Fear: exactly one `buff` (`debuff: true`, `stat: 'mor'`, `delta: −2`,
     `untilRound: null`) per present enemy group, enemy commanders included, none on its own
     side, and no `buff` with source `primordialFear` in any later round. It fires as
     attacker and as defender.
  4. Order: with abilities on both sides, the attacker's fires first; two abilities on one
     unit fire in list order.
  5. All or nothing: a test ability with a `friendlySquad` buff on a side with no squad logs
     nothing.
  6. Spell power never applies: a test damage ability on a spell-power-3 commander rolls its
     listed amount (the detail `spellHit`'s `damage.base`).
  7. Determinism: one setup and rng state give one log; the battle golden fixtures, none of
     which has an ability, still match.
  8. Rerun: a recorded battle with an ability re-runs and matches; an unknown ability id
     throws in `fromSetupRecord`.

#### N2. Multi-strike weapons (trample)

```ts
// WeaponDef additions (src/content/types.ts), melee weapons only
/** Attacks per troop per melee phase with this weapon, 1 to 4; default 1. */
strikes?: number;
/** Only targets of this size or smaller can be struck with it. */
maxTargetSize?: number;
// CombatStats gains: size: number   (from UnitDef.size, in statsFor and the test fixtures)
```

- In `meleePhase`, each living member swings each melee weapon `strikes ?? 1` times. For a
  weapon with `maxTargetSize`, the candidate list is the phase's `targets` filtered once per
  group and weapon to `t.group.base.size <= maxTargetSize`; with none, it is `targets`. An
  empty candidate list skips the swing with no draw (`randBelow` refuses a bound of 0). Each
  swing then draws exactly as today: target, attack DRN, defense DRN, and on a hit the two
  damage DRNs. No existing weapon has either field, so today's draws are unchanged.
- Battle design A2: each swing is one attack (`attacks += 1`); detail `strike` events of one
  weapon's swings are consecutive, in swing order.
- **Content validation**: `strikes` is an integer 1 to 4 and `maxTargetSize` 1 to 6, both
  only on weapons without `range`.
- **Tests** (`tests/sim/battle/attacks.test.ts`): a `strikes: 2` weapon logs twice the
  `attacks` of the same pair without it; a size-4 target is never struck by Trample while
  size-1 troops stand beside it; against only size-6 enemies Trample draws nothing, so the
  rng state after the phase equals that of the same fight without the Trample weapon.

#### N3. Spell power

- `UnitDef.spellPower?: number` becomes `CombatStats.spellPower` (default 0). `cast` passes
  `caster.base.spellPower` to `applyEffect` as `power`; abilities pass 0. A `damage` effect
  rolls with `amount + power`, and a `heal` heals `amount + power`. Targets and draws do not
  change.
- **Tests**: an Ember Dart from a spell-power-3 caster rolls with base 15 (detail
  `spellHit`); a spell-power-0 caster's log is unchanged.

#### N4. Retaliation shields by element

```ts
// src/content/types.ts
export interface Shield { element: Element; amount: number }
// CombatStats: fireShield: number  is replaced by  shields: readonly Shield[]
//   (one entry per element, amounts added, sorted in ELEMENTS order; empty for none)
```

- `statsFor` builds `shields` from `UnitDef.fireShield` (as fire) and from blessings (A.6:
  Cinder Skin and Living Pyre fire, Thornhide nature), merging by element.
- `burnStrikers` owes per striker troop and element: for each damaging melee hit, every
  shield of the struck group adds its amount to the striker's debt in that element. Debts
  are paid after all of the phase's hits have landed, per striker troop in first-hit order,
  element by element in `ELEMENTS` order, while the troop lives. It logs one `damage` per
  striker group and element, in first-hit order and then `ELEMENTS` order, with that element
  and with `by` set to the shield group that contributed the most of that element to that
  striker group (ties: the earlier in setup order). That is the battle design's A3 rule, per
  element. The detail `burn` event gains `element: Element`.
- With fire only, as in all existing content, the log is exactly today's plus A3's `by`.
- **Existing tests that change in the same commit**: the fire-shield overrides in
  `tests/sim/battle/attacks.test.ts` and the Ash Colossus case in `setup.test.ts` move from
  `fireShield: n` to `shields: [{ element: 'fire', amount: n }]`; `fixtures.ts statsOf` builds
  `shields` from the unit.
- **Tests**: a nature shield logs `element: 'nature'`; a striker hit by a fire shield and a
  nature shield in one phase takes two `damage` events, fire first; fire 5 and fire 3 on one
  unit burn 8 in one event; a striker killed by the fire debt takes no nature damage; the
  Ash Colossus still logs fire.

#### N5. Bound squads never drag their commander

- A group is **bound** when it was summoned in the battle (`summon()` sets `g.bound = true`
  beside `g.summoned`), or when its setup says so: `BattleSquadSetup.bound?: true`, which
  `sideSetup` sets for a squad led by its nation's pretender whose unit is the pretender
  chassis's `monthlySummon.unit` (the Mother of Beasts' wolves, the Cinder Idol's sprites,
  whatever their source). Squads carry no new state between battles.
- In `moralePhase`, a bound squad that breaks does not add its leader to `brokeNow`. Nothing
  else changes: a commander's standing squads, bound ones included, still keep it on the
  field, exactly as today's `squads.some((g) => g.routingSince === null)`.
- **What changes for existing content**: only one corner. A battle-summoned squad below
  morale 50 that breaks no longer drags its caster: Swarm's hornets (morale 50) can fall
  below 50 under the enemy's Dread or Fear. No golden fixture contains that corner; if one
  does when this lands, the commit regenerates it with `npm run golden:battle` and names it.
- **Tests** (`tests/sim/battle/morale.test.ts`):
  1. Regression, today's behavior kept: a caster whose real squad broke stays while its 20
     standing hornets stand.
  2. The corner: hornets at morale 47 that break leave their caster on the field.
  3. Eight battle-summoned wolves rout; their commander stays.
  4. Bound monthly wolves under the Mother rout; she stays. The same wolves under another
     commander (`bound` unset) drag it, as today.
  5. A Mother leading bound wolves and Wardens routs when the Wardens, her last standing
     non-routing squad, break after the wolves.
  6. Fear may make a morale-50 unit checkable (Rulings R3b): an enemy morale-50 squad at 48
     rolls when shaken.

#### N7. Monthly summon

- `ChassisDef.monthlySummon?: { unit: UnitTypeId; count: number; cap: number }`.
- **When.** Tick step 3, right after the pretenders settle, on days with
  `state.day > 0 && state.day % TIME.daysPerMonth === 0`: `monthlySummons(state)` in
  `src/sim/pretender.ts`.
- **Rule.** For each nation in id order: skip it if it is eliminated or its `pretenderId` is
  null (not yet arrived, recalled while Godless, reforming, or dead). Let `p` be the
  pretender commander. Skip if `p.transit !== null`, or if its province's dominion is not its
  nation's at strength 1 or more. Let `stock` be the nation's living troops of the unit over
  every commander it owns (garrison holders included), from every source (ritual summons
  count). Then `n = min(count, cap − stock, leadership(p) − troopCount(p))`; if `n > 0`,
  `addSquad(p, createSquad(state, unit, n))` and its owner gets an `info` message
  ("2 Wolves join Ysolde."). No rng: `createSquad` draws only an id.
- **Upkeep and supply**: the summons have no cost record, so they draw no upkeep. Wolves eat
  1 supply a day each (`troopSupply`); Fire Sprites are constructs and eat none.
- **Tests** (`tests/sim/pretender.summon.test.ts`): 2 wolves join on day 30 at strength 1;
  none in foreign dominion, none on day 0, none while in transit, none while Godless; the
  cap counts wolves the Mother handed to another commander and wolves from Call of the Wild;
  leadership caps the count; the Cinder Idol's sprites eat no supply; the determinism hash
  holds over 365 days.

#### N8. Reform after death (the Ash Phoenix)

- `ChassisDef.reform?: { days: number }` (the Phoenix: 90). New state field
  `NationState.pretenderReturnDay: number | null`.
- **`commanderDies`.** When the pretender dies and its chassis has `reform`, and the province
  it stands in (`c.location`) has `dominion.nation === owner` at strength 1 or more:
  `pretenderId = null`, `pretenderReturnDay = state.day + reform.days`, `pretenderDead` stays
  false, and its owner gets "Ysolde will rise again in 90 days." Otherwise it dies for good,
  as today.
- **`settlePretender`.** It returns early while `pretenderReturnDay !== null && state.day <
  pretenderReturnDay`. On or after that day it places a fresh pretender by the existing
  arrival rules (the capital held, the nation not Godless): full HP, the design's pips, the
  default script, the name of D7. It then sets `pretenderReturnDay = null` and posts "Ysolde
  rises again in Kharnath." instead of the arrival message.
- While it is away the god makes no dominion checks (no commander exists) and incarnate
  blessings lapse (`pretenderId` is null, A.6).
- This changes the `docs/05` decision "A pretender that dies is gone for good in M1" for the
  Ash Phoenix only.
- **Tests** (`tests/sim/pretender.reform.test.ts`): returns on day + 90; dies for good in
  foreign or neutral dominion; waits while Godless and while the capital is lost, then
  returns; a second death reforms again; incarnate blessings are absent while away; the
  save migration adds the field as null.

#### State and save

One `STATE_VERSION` step adds `NationState.pretenderName: null`,
`NationState.pretenderReturnDay: null` and `ProvinceState.extraSprings: []`. It lands with D5
and D7 in Phase 6b.1, so N8 later needs no second step. The battle track's S1 also takes a
step (to 2); whichever of the two lands second takes the next number and chains its migration
after the other's in `serialize.ts`. No save exists before Phase 9, so the migrations run only
on test fixtures, as the battle design notes for its own step.

### A.6 Blessings (the Dominions 6 menu, sized for FM)

**What Dominions does**, from the manual's text: "every skill level above one in a path
equals one bless point"; "bless effects cost bless points equal to the magic skill
requirements for that effect"; some effects are "incarnate only" and "apply only if the
pretender is awake as well as alive"; and pretenders "are automatically blessed when they are
in their dominion" ([manual ch. 3](https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html),
transcribed in `web/m_main.qmd`). Which effects are incarnate is marked in the manual by bold
type, lost in the transcription; illwiki's summary is that effects needing 5 or more in a
path are incarnate ([illwiki](https://illwiki.com/dom5/dom6/bless)). Since an effect costs
its full requirement while a path at that level gives one point less, a god exactly at a
requirement cannot afford the effect, which players call a feel-bad
([Steam thread](https://steamcommunity.com/app/2511500/discussions/0/4132682727127343168)).

**FM's rules.**

- **Bless points are per color**: `BP[c] = max(0, pips[c] − 1)`, and a color's points buy only
  that color's effects. R4 gives Red 3; R4 G2 gives Red 3 and Green 1. This deviates from
  Dominions' pooled points on purpose: pooled, W, U and B pips (which buy nothing else in M1)
  would be cheap points for Red and Green effects, and a five-color god at 6 pips could buy
  +11 attack for its sacreds. Per color the strongest selection gives +6
  (`bless-bounds.out.md` against `bless-bounds-percolor.out.md`).
- **Cost** of an effect is `max(1, requires − 1)`, and **requirements run 2 to 6**: cost 1 at
  2, 2 at 3, 3 at 4, 4 at 5, 5 at 6. So a god with exactly `r` pips in a color can afford any
  one effect of requirement `r` in it (the script checks every effect). No effect requires 1
  pip: a lone splash pip gives no bless points, as in Dominions.
- **Requirement**: pips in the effect's color ≥ `requires`; some effects also need a scale
  step (`requiresScale`), as Dominions does.
- **Groups**: every effect has one group, named by its color and main stat (`R.att`,
  `G.regen`, `R.wrath` for the standard and greater forms). At most one effect per group is
  chosen. So Green buys at most one regeneration effect, and the judges' case (Wild Vigor,
  Evergreen and Vigor stacking to 35%) cannot be built: Green's regeneration tops out at 20%.
- **Incarnate** effects (flagged) apply only while `nation.pretenderId !== null`: not before
  the god arrives, not while it is recalled or reforming, never after its death. The standard
  and greater forms are never incarnate.
- **Who is blessed**: sacred units and the prophet, as today, plus the pretender itself when
  it has Avatar (A.7) and fights in a province its nation dominates.
- **Today's bless is the default.** Today each color at 4 pips gives its fixed bless, doubled
  at 6 (`docs/02` section 8). That bless is the menu's **standard** effect of each color
  (requirement 4, cost 3) and the doubled one its **greater** effect (requirement 6, cost 5).
  A design without a `blessings` field gets the standard effect of every color at 4 or 5 pips
  and the greater one at 6, which always fits that color's points (checked over all 16,807 pip
  vectors). Every existing design, preset and test keeps its exact bless. The designer's
  "Recommended" button starts from the default and spends each color's leftover points on its
  minors, highest requirement first.
- **Fold.** Every effect folds into the unit's stats in `battle/setup.ts statsFor`; the
  resolver gains nothing for blessings beyond N4's shields. Melee weapons (no `range`) are
  copied with `dmg + melee.dmg`, `element` set to the blessing's element when given,
  `armorPiercing` set when given, and `firstRoundBonus` raised. `berserk` adds the tag.

```ts
// src/content/pretenders/blessings.ts
export interface BlessingEffect {
  att?: number; str?: number; def?: number; prot?: number; mor?: number; prec?: number;
  /** Share of max HP regained per round. */
  regeneration?: number;
  lifeDrain?: number;
  shield?: Shield;                                   // N4
  melee?: { dmg: number; element?: Element; armorPiercing?: true };
  firstRoundBonus?: number;
  berserk?: true;
}
export interface BlessingDef {
  id: string; name: string; color: Color;
  /** Pips in `color`, 2 to 6. */
  requires: number;
  /** max(1, requires - 1); content validation checks it. */
  cost: number;
  /** `${color}.${stat}`; at most one chosen per group. */
  group: string;
  incarnate: boolean;
  requiresScale?: { axis: ScaleAxis; toward: 'positive' | 'negative'; steps: number };
  /** The default picks: today's bless at 4 ('standard') and its doubled form at 6 ('greater'). */
  tier?: 'standard' | 'greater';
  effect: BlessingEffect;
}
// PretenderDesign.blessings?: readonly string[]   (absent: the default picks)
// src/sim/bless.ts
//   blessPoints(pips): Partial<Record<Color, number>>
//   defaultBlessings(pips): string[]
//   blessOf(design: PretenderDesign, godPresent: boolean): Bless    (replaces blessOf(pips))
//   Bless gains: shields: readonly Shield[]; meleeDmg: number; meleeElement: Element | null;
//                meleeArmorPiercing: boolean; firstRoundBonus: number; berserk: boolean
```

**Red (Ember).** ★ marks the default picks.

| Id | Name | Req | Cost | Group | Incarnate | Effect on blessed units |
|---|---|---|---|---|---|---|
| fervor | Fervor | R2 | 1 | R.mor | | mor +1 |
| keenEdge | Keen Edge | R2 | 1 | R.att | | att +1 |
| emberMight | Ember Might | R3 | 2 | R.str | | str +2 |
| emberWrath ★ | Ember Wrath | R4 | 3 | R.wrath | | att +2, str +2 (today's R bless) |
| cinderSkin | Cinder Skin | R4 | 3 | R.shield | | fire shield 3 |
| blazingCharge | Blazing Charge | R4 | 3 | R.charge | | +5 damage on every melee weapon in the first melee round; mor +1 |
| furyUnbound | Fury Unbound | R5 | 4 | R.berserk | yes | berserk; att +1. Requires Fury 1 |
| flamingWeapons | Flaming Weapons | R5 | 4 | R.weapon | yes | melee weapons +3 damage, fire, armor piercing |
| greaterEmberWrath ★ | Greater Ember Wrath | R6 | 5 | R.wrath | | att +4, str +4 (today's doubled bless) |
| livingPyre | Living Pyre | R6 | 5 | R.shield | yes | fire shield 5; att +2 |

**Green (Loam).**

| Id | Name | Req | Cost | Group | Incarnate | Effect |
|---|---|---|---|---|---|---|
| thickSkin | Thick Skin | G2 | 1 | G.prot | | prot +1 |
| vigor | Vigor | G2 | 1 | G.regen | | regeneration 5% |
| strengthOfEarth | Strength of the Earth | G3 | 2 | G.str | | str +2 |
| evergreen ★ | Evergreen | G4 | 3 | G.regen | | regeneration 10%, prot +1 (today's G bless) |
| oakhide | Oakhide | G4 | 3 | G.prot | | prot +3 |
| deepRoots | Deep Roots | G4 | 3 | G.mor | | mor +3, prot +1 |
| wildVigor | Wild Vigor | G5 | 4 | G.regen | yes | regeneration 20%, str +1. Requires Growth 1 |
| thornhide | Thornhide | G5 | 4 | G.shield | yes | thorn shield 4 (nature, N4); prot +1 |
| greaterEvergreen ★ | Greater Evergreen | G6 | 5 | G.regen | | regeneration 20%, prot +2 (today's doubled bless) |
| ironbark | Ironbark | G6 | 5 | G.prot | yes | prot +5, str +2 |

**White, Blue and Black in M1.** In M1, W, U and B pips buy only these blessings: no W, U or
B spell exists in M1 (`docs/02` decisions), so research and casting in those colors give
nothing. Their standard and greater forms are today's blesses; each has two minors so a
splash pays off. The full menus are M2.

| Color | Minors (requirement 2, cost 1) | ★ Standard (requirement 4, cost 3) | ★ Greater (requirement 6, cost 5) |
|---|---|---|---|
| W | Resolve (W.mor) mor +1; Warding (W.prot) prot +1 | Steadfast (W.std): mor +2, prot +1 | Greater Steadfast (W.std): mor +4, prot +2 |
| U | Keen Eye (U.prec) prec +1; Wariness (U.def) def +1 | Clear Sight (U.std): def +2, prec +2 | Greater Clear Sight (U.std): def +4, prec +4 |
| B | Cruelty (B.att) att +1; Grim Resolve (B.mor) mor +1 | Blood Thirst (B.std): life drain 2, att +1 | Greater Blood Thirst (B.std): life drain 4, att +2 |

**Bounds** (computed by `bless-bounds-percolor.mjs`; the strongest value any valid selection
reaches for each stat on its own, incarnate effects included). Phase 12 pins this table as a
snapshot, so new effects that raise a bound show in review.

| Pips | att | str | prot | mor | regeneration | fire shield | nature shield | melee dmg | first round |
|---|---|---|---|---|---|---|---|---|---|
| R4 | 2 | 2 | 0 | 1 | 0 | 3 | 0 | 0 | 5 |
| R6 | 4 | 4 | 0 | 2 | 0 | 5 | 0 | 3 | 5 |
| G4 | 0 | 2 | 3 | 3 | 10% | 0 | 0 | 0 | 0 |
| G6 | 0 | 2 | 5 | 3 | 20% | 0 | 4 | 0 | 0 |
| R6 G6 | 4 | 6 | 5 | 5 | 20% | 5 | 4 | 3 | 5 |
| all five colors at 6 | 6 | 6 | 7 | 10 | 20% | 5 | 4 | 3 | 5 |

Today's rule gives an all-6 god att 6, str 4, prot 4, mor 4, regeneration 20%.

**Validation** (`validatePretender`, first problem only; the designer asks it on every click,
UI spec 3.3): unknown id ("Unknown blessing x"); chosen twice; requirement unmet ("Flaming
Weapons needs R5"); scale unmet ("Fury Unbound needs Fury 1"); two of one group ("Cinder
Skin and Living Pyre exclude each other"); over a color's points ("Red blessings cost 4 of 3
bless points").

**Tests** (`tests/sim/bless.test.ts`, `tests/content/blessings.test.ts`):
- for every pip vector 0 to 6 in five colors, `blessOf` with no `blessings` field equals
  today's formula (16,807 cases), and the default picks fit their points;
- an incarnate effect is absent before arrival, present after, absent while Godless and
  while a Phoenix reforms;
- one fold test per new field: fire shield 3 on sacreds; melee +3 fire armor piercing on a
  Flamebrand's Burning Blade (its element stays fire) and on an Oakheart's Oak Maul (it
  becomes fire); first-round +5; the berserk tag;
- Avatar: the pretender is blessed in a province its nation dominates and not elsewhere;
- content: every blessing's requirement is 2 to 6, its cost follows the formula, its group
  starts with its color, its effect is not empty; each color has exactly one standard and one
  greater, in one group, equal to `BLESS` in `src/content/rules.ts`;
- the bounds snapshot.

### A.7 Boons

Options bought with design points. Each at most once, each shown in the budget bar as its own
segment.

| Boon | Cost | Effect (exact) | Where it acts | Validation |
|---|---|---|---|---|
| Sacred Spring | 40 | One spring of a chosen color is added to the capital's `ProvinceState.extraSprings` (D5) | `createGame` | the color needs ≥ 1 pip: "A Sacred Spring needs a pip in its color" |
| Avatar | 40 | In battle the pretender receives its nation's blessings (incarnate ones included) when the battle's province has its nation's dominion at strength ≥ 1 | `statsFor` | built into the Ascended Hero, and refused there: "Ascended Hero already has Avatar" |

```ts
// src/content/pretenders/boons.ts
export type BoonChoice = { id: 'sacredSpring'; color: Color } | { id: 'avatar' };
export const BOONS = {
  sacredSpring: { name: 'Sacred Spring', cost: 40, description: 'One more spring of a color you hold, at your capital.' },
  avatar: { name: 'Avatar', cost: 40, description: 'Your god fights blessed in your own dominion.' },
} as const;
// PretenderDesign.boons?: readonly BoonChoice[]   (absent: none); designCost adds each boon's cost
```

**Deferred to M2** (A.9): Iron Will (R3), Undying as a boon (R21a), Chosen Host and Deep Lore
(both judges).

**Tests**: each boon's cost appears in `designCost`; Sacred Spring adds one spring of its
color and is refused without a pip; Avatar's fold as in A.6; a duplicate boon is refused.

### A.8 Presets

Twelve presets, six per nation. The first three of each nation are today's designs, exactly
unchanged: no `blessings` and no `boons` field, so each keeps today's bless and cost. The first
preset stays the AI and runner default. Each preset has a curated look and identity in
presentation content (`src/content/looks/presets.ts`, keyed by preset id), so `PresetDef`
stays sim content. Costs are computed by `costs-final.mjs`.

| Nation | Preset | Design | Blessings | Cost / budget |
|---|---|---|---|---|
| Cinder Horde | Warlord (default) | Titan R4, dominion 5, Fury 3, Turmoil 2, awake | default (Ember Wrath) | 385 / 400 |
| Cinder Horde | Ember Oracle | Oracle R6, dominion 4, Fury 2, dormant | default (Greater Ember Wrath) | 280 / 550 |
| Cinder Horde | Wildfire | Ash Colossus R3, dominion 6, Turmoil 3, Fury 3, imprisoned | default (none; 2 Red points unspent) | 415 / 750 |
| Cinder Horde | **Undying Flame** | Ash Phoenix R4, dominion 5, Growth 2, Fury 2, Turmoil 1, awake | Ember Wrath | 385 / 400 |
| Cinder Horde | **Pyre Host** | Pyre Lord R4, dominion 5, Fury 3, Turmoil 2, awake | Ember Wrath | 385 / 400 |
| Cinder Horde | **Dread Idol** | Cinder Idol R4, dominion 9, Dread 3, Turmoil 1, awake | Cinder Skin | 395 / 400 |
| Thornwood | Elder Oak (default) | Titan G4, dominion 5, Growth 3, Wild 2, awake | default (Evergreen) | 385 / 400 |
| Thornwood | Deep Root | Living Monolith G3, dominion 7, Growth 3, Wild 3, Sanctity 1, awake | default (none; 2 Green points unspent) | 395 / 400 |
| Thornwood | Wyrm of the Loam | Great Wyrm G4, dominion 4, Growth 2, dormant | default (Evergreen) | 375 / 550 |
| Thornwood | **Heartwood** | World Tree G4, dominion 7, Growth 3, Wild 1, Sanctity 1, awake | Deep Roots | 395 / 400 |
| Thornwood | **Hunt Lord** | Horned Hunter G4, dominion 4, Fury 2, Wild 2, Growth 3, awake | Oakhide | 395 / 400 |
| Thornwood | **Mother of the Pack** | Mother of Beasts G4, dominion 5, Growth 3, Wild 2, awake | Evergreen | 395 / 400 |

The Ember Oracle leaves 270 points unspent today; Phase 12 revisits it (for example dominion
7 and Turmoil 3). Wildfire's and Deep Root's unspent bless points stay unspent until the
owner or Phase 12 decides otherwise: the promise is that today's six designs do not change,
and no measurement asks for it.

**Tests**: every preset validates and costs as the table says (`tests/content/presets.test.ts`
gains the six); the first preset of each nation is unchanged byte for byte (a snapshot of
today's three per nation).

### A.9 M2: White, Blue, Black, and what this revision deferred

**Deferred from the M1 design, with the fixes the judges asked for, so nothing is lost:**

| Item | M2 specification notes |
|---|---|
| Living Flame (R, 150) | Flying, fire shield 6, Heat Aura: `trigger: 'eachRound'` with `frontOnly: true` (fires while the unit stands in its side's front row, from its closing round on). Needs `CommanderTraits.defaultScript?: 'castFirst' \| 'attackFirst'`, read by `defaultScript()`; the Living Flame takes `'attackFirst'` (Attack in slot 1, then Cast), since commanders start in the rear row and a caster script would keep it there. Test: with the default script the aura fires in round 2. Its form slot keeps a fixed flight cue on every form, as B.1's rule requires |
| Briar King (G, 120) and N6 | thorn shield 3 (nature, through N4), Rising Briars (Entangle's two effects at battle start), home forest +2 def +2 prot via `UnitDef.homeTerrain` (N6) |
| `eachRound` trigger | fires right after the scripts each round, before the commander-death check; repeated plays use the battle design's brief form |
| Iron Will | a `fearless` unit tag that the battle design's `fearless(mor, tags)` reads, so no morale fold can undo it; tested against Fear plus Dread 3 plus unpaid upkeep. Its price, or a redesign as a morale roll when the last squad breaks, comes from the preset matrix: it added 35 to 55 points of win rate to a Titan's army (R3) |
| Undying as a boon | N8 for any mobile chassis, 70 points, refused on immobile ones |
| Chosen Host | the first starting commander also leads 10 sacreds (Flamebrand 320 gold of value, Oakheart 360); measure against "4 provinces by month 6" |
| Deep Lore | starting research one level higher in the nation's color |
| Breath color as a design field | moves from `PretenderLook.breath` into `PretenderDesign` when element resistances give it an effect, with a migration |

**The M2 colors** (sketches, six national chassis each; numbers are indicative, and every
new rule is specified when its color ships):

| Color | Chassis | Role | Base | Dom | Signature | Needs |
|---|---|---|---|---|---|---|
| W | Statue of Law | idol | W2 | 4 | attuned to Lore; temple checks +1 at the capital | D3 |
| W | Virtue | fighter | W1 | 2 | flying; Awe 2 (an enemy must pass a morale check at 10 + 2 before it may strike it) | new: awe |
| W | Merciful One | support (a new M2 role) | W2 | 2 | each round heals 3 on every friendly squad; −5 unrest a month where it stands | `eachRound`, an N7 variant |
| W | Solar Titan | leader | W2 | 2 | Sun Strike: holy weapon, double damage against undead | new: bane against a tag |
| W | Lawgiver | mage | W1 | 1 | the prophet gets +1 holy; dominion checks +1 | a design field |
| W | Dawn Colossus | idol | W3 | 4 | Banishing Light: 10 holy damage area(10) at battle start against undead | N1 plus bane |
| U | Archsage | mage | U2 | 1 | research ×1.5; new color 30 | `researchFactor` |
| U | Storm Wyrm | monster | U2 | 2 | a storm field at battle start; shapechange from sage to wyrm when wounded | N1, new: shapechange |
| U | Mirror Spirit | raider | U2 | 2 | ethereal (75% of physical blows miss); stealthy | new: ethereal |
| U | Frost Father | leader | U2 | 2 | chill aura each round: fatigue drain 10 on enemy casters, 3 cold area(4) | `eachRound` |
| U | Unblinking Eye | idol | U3 | 4 | scries one province within 3 each month | an N7 variant |
| U | Tide Caller | raider | U1 | 2 | Rift Step once a season (teleport to an owned province) | new: teleport |
| B | Lich | mage | B3 | 2 | reforms anywhere after 120 days; undead | an N8 variant |
| B | Bone Throne | idol | B2 | 4 | reforms; attuned to Turmoil; Skeletons a month | N7, N8 |
| B | Ghost King | summoner | B1 | 2 | ethereal; Shades a month in own dominion; Fear | ethereal, N1, N7 |
| B | Fountain of Blood | idol | B3 | 4 | Fear 3; 2 B springs; −1% population a month where it stands | D5, N1, an N7 variant |
| B | Vampire Lord | raider | B2 | 1 | life drain 4 on its own blows; flying; stealthy | `UnitDef.lifeDrain` |
| B | Plague Mother | monster | B2 | 2 | decay aura each round: 4 decay area(6), armor negating | `eachRound` |

M2 also brings each color's full blessing menu (about 8 more effects each, for example W Awe,
U Blur, B Withering Weapons) and element resistances.

### A.10 Balance

**Measured bodies.** Staged fights in the repository's resolver, 400 seeds each
(`duel-final.ts`, `duel-mother.ts`). The god attacks with Attack in every slot against an
Independent Captain and its troops. A cell is the god's side's win rate, with the god's HP
left when it lives in parentheses. Approximations: Trample as two extra weapon copies, so the
size filter is ignored and the mountain fixture's giant can be struck (mountain cells
overstate trample slightly); battle-start summons as squads present from round 1, staged
without a leader, which is exactly N5's effect for a god leading only summons; bound wolves
the same; Fear as enemy morale −2.

| Body (cost) | Weak plains (11 LI, 5 archers) | Plains (16 LI, 8 archers) | Hills (20 Heavy Infantry) | Forest (12 wolves, 6 archers) | Mountain (giant, 25 HI) |
|---|---|---|---|---|---|
| Great Wyrm (220, today) | 100% (82%) | 100% (66%) | 75% (36%) | 100% (71%) | 5% |
| Titan (120, today) | 40% (29%) | 2% | 0% | 11% | 0% |
| Ash Colossus (100, today) | 92% (46%) | 60% (29%) | 2% | 68% (32%) | 0% |
| **Primordial (220, final)** | 100% (78%) | 100% (67%) | 73% (39%) | 100% (69%) | 17% |
| Primordial, draft stats (for reference) | 100% (84%) | 100% (75%) | 91% (47%) | 100% (76%) | 28% |
| **Elder Wyrm (190)** | 100% (97%) | 100% (88%) | 57% (43%) | 100% (91%) | 14% |
| **Ash Phoenix (120)** | 56% (35%) | 12% | 3% | 27% | 0% |
| **Ascended Hero (100)**, alone; with Avatar and R4 | 15%; 16% | 0% | 0% | 3% | 0% |
| **Pyre Lord (140)** + 6 sprites | 64% (62%) | 21% | 20% | 43% | 5% |
| **Horned Hunter (140)** + 8 wolves | 79% (69%) | 47% (60%) | 17% | 56% (63%) | 6% |
| **Mother of Beasts (130)** + 6 bound wolves (month 3) | 60% (62%) | 29% | 2% | 34% | 2% |
| Mother + 12 bound wolves (month 6) | 92% (78%) | 72% (65%) | 16% | 72% (72%) | 6% |
| Mother + 24 bound wolves (the cap) | 98% (89%) | 89% (77%) | 66% (90%) | 90% (81%) | 38% |
| Mother + 12 ordinary wolves she leads (without N5's binding) | 32% | 14% | 7% | 17% | 2% |

**Gods leading armies** (same fixtures):

| Army | Weak plains | Plains | Hills | Forest | Mountain |
|---|---|---|---|---|---|
| Titan + 20 Cinder Warriors | 65% | 43% | 53% | 57% | 21% |
| the same with Iron Will (not in M1, R3) | 100% | 98% | 92% | 98% | 76% |
| Ascended Hero (Avatar, R4) + 20 Cinder Warriors | 42% | 19% | 23% | 57% | 9% |
| Titan + 20 Wardens | 96% | 82% | 75% | 87% | 38% |
| Mother + 12 bound wolves + 20 Wardens | 100% | 94% | 79% | 98% | 42% |

Readings:
- **The Great Wyrm is the anchor.** The Primordial now sits at its level (within 2 points in
  four fixtures; better against the mountain, where trample is overstated); its extra
  dominion pays for the Wyrm's flight, breath and speed. The Elder Wyrm is weaker against
  heavy infantry, cheaper by 30, slow, wingless, and regenerates.
- **Leaders, raiders and mages are not solo bodies**, by design. The Hero is a cheaper,
  weaker general than the Titan; the Phoenix's Undying is its defense.
- **Summons decide summoners.** The Mother is weak early and strong at her cap; her wolves
  die for good in battle and come back at 2 a month, so the cap is reached only by a god who
  avoids losses.
- **Iron Will was the strongest thing in the draft**, which is why it left M1.

**Cost parity** (`costs-final.mjs`; a content snapshot test pins it). Body value = cost −
base pips at own-color prices − 30 per base dominion above 1 − built-in options at their
boon prices (Avatar 40, a spring 40). What the body value buys is in the last column.

| Chassis | Cost | Base pips (value) | Base dominion above 1 (value) | Built in (value) | Body value | Buys |
|---|---|---|---|---|---|---|
| Oracle of the Flux | 20 | — | 0 | — | 20 | 12 HP; pips −10 each; research |
| Titan | 120 | 1 (40) | 1 (30) | — | 50 | 60 HP general, leadership 100 |
| Great Wyrm | 220 | 2 (60) | 1 (30) | — | 130 | flying monster with breath |
| Living Monolith | 60 | — | 3 (90) | — | −30 | immobile; dominion checks ×2 |
| Ascended Hero | 100 | 1 (40) | 0 | Avatar (40) | 20 | 32 HP general, leadership 100, speed 3 |
| Primordial | 220 | 2 (60) | 2 (60) | — | 100 | Wyrm-level monster, Fear, trample, speed 1, must sleep |
| Ash Colossus | 100 | 1 (40) | 0 | — | 60 | 80 HP brawler, fire shield 5 |
| Ash Phoenix | 120 | 1 (40) | 1 (30) | — | 50 | flying raider, fire shield, reform |
| Pyre Lord | 140 | 2 (60) | 1 (30) | — | 50 | 55 HP general (80), 6 sprites per battle |
| Cinder Idol | 110 | 2 (60) | 3 (90) | — | −40 | immobile; 2 sprites a month |
| Ember Hierophant | 60 | 2 (60) | 0 | — | 0 | 14 HP; spell power 3 |
| Wild Spirit | 80 | 1 (40) | 1 (30) | — | 10 | 30 HP stealthy raider, regeneration |
| World Tree | 150 | 2 (60) | 3 (90) | 1 spring (40) | −40 | immobile, 250 HP, regeneration |
| Horned Hunter | 140 | 2 (60) | 1 (30) | — | 50 | 60 HP general (60), speed 3, 8 wolves per battle |
| Elder Wyrm | 190 | 1 (40) | 1 (30) | — | 120 | wingless regenerating monster, trample |
| Mother of Beasts | 130 | 1 (40) | 1 (30) | — | 60 | 70 HP general (60), 2 bound wolves a month |

Idols cluster at −30 to −40 and monsters at 100 to 130, generals at 20 to 60. The draft's
Primordial (160: 40), Ascended Hero (70 with dominion 2: −50) and World Tree (130 with G3 and
two springs: −125) were the outliers the judges found.

**Cost observations and risks** for Phase 12:
- *Primordial dormant* nets 70 points after the refund; its 11 months away are its price in
  play, not in points.
- *Cinder Idol* with Dread 3 at strength 9: enemies fight at −3 morale in Red-dominated
  provinces, and enemy provinces its dominion touches gain 6 unrest a month. Check that it
  does not freeze the AI's expansion into Red dominion.
- *Monthly summons* are capped (20 sprites, 24 wolves) and draw no upkeep; wolves eat supply.
  Measure Thornwood's starvation in Hills with a full pack.
- *Attunement* matters only off-color: Growth for the Phoenix, Dread for the Cinder Idol,
  Sanctity for the World Tree, Fury for the Horned Hunter. Each halves one axis's price.
- *Blessings*: the incarnate R5 and G5 effects are the strongest per point; their price is the
  god's presence.

**How the Phase 12 headless runner tests it.**
1. `sim:aivai --presets cinderHorde:<id>,thornwood:<id>` plays chosen presets (today the
   runner always uses the defaults); `--matrix` plays each new preset against the opposing
   default (6 pairings × 2 sides × 20 games, seeds 1 to 20) and prints a win table.
   Acceptance: every preset wins 35% to 65% against the opposing default; the default
   pairing still splits about evenly (the existing checklist line).
2. `sim:duel` (new, `scripts/duel.ts`) runs the table above for every chassis body over 400
   seeds, with the N2 size filter and real N1 abilities once they exist. A Vitest file pins
   bands of ±15 points around the measured values, among them: Great Wyrm against the hills
   60% to 90%; Primordial against the hills 58% to 88% and against the mountain at most 32%;
   in no fixture is the Primordial more than 15 points ahead of the Great Wyrm; Elder Wyrm
   against the hills 42% to 72%; Mother with 12 bound wolves against the plains 57% to 87%;
   Horned Hunter with 8 wolves against the plains 32% to 62%; Ash Phoenix alone against the
   weak plains 41% to 71%.
3. `sim:duel --calibrate` writes `aiPower` (A.11) and a test checks content matches it.
4. Expansion pace: the runner reports months to the 4th and 8th province per preset; a
   preset that reaches 8 more than 3 months faster than the opposing default is flagged.
5. Determinism: the matrix runs twice per seed in a nightly job and compares state hashes.

### A.11 AI

- AI nations keep playing their nation's default preset (`docs/08` decisions), so Phase 7's
  tuning is unaffected. Random presets for AI opponents are M2.
- `docs/08` step 10 reads `ChassisDef.role` instead of chassis ids: leaders, fighters,
  monsters and summoners join the main army after month 3; raiders join the army or take weak
  provinces alone; mages research if they can (the Oracle) or join the army (the Hierophant);
  idols cast rituals in the capital. It lands in Phase 6b.3, after Phase 7 merges; until
  then Phase 7 reads chassis ids, and the defaults (Titan) behave the same either way.
- **`aiPower`.** `docs/08`'s `armyPower` sums `(hp + att + def + prot) / 4` over troops, so it
  cannot see a god, its battle-start summons, Fear or trample. Each chassis gets
  `aiPower`: the largest number `n` of Independent Light Infantry, led by an Independent
  Captain, that the body with its battle-start summons and Fear beats in at least 50% of 200
  seeds, times the Light Infantry troop term (7.25). Immobile bodies are measured defending.
  `armyPower` adds the pretender's `aiPower` to its army. Values from `aipower.ts`, which
  becomes `sim:duel --calibrate`:

  | Chassis | n | aiPower | Chassis | n | aiPower |
  |---|---|---|---|---|---|
  | Oracle of the Flux | 0 | 0 | Ash Phoenix | 19 | 138 |
  | Titan | 13 | 94 | Pyre Lord | 26 | 189 |
  | Great Wyrm | 34 | 247 | Cinder Idol | 42 | 305 |
  | Living Monolith | 82 | 595 | Ember Hierophant | 0 | 0 |
  | Ascended Hero | 11 | 80 | Wild Spirit | 9 | 65 |
  | Primordial | 30 | 218 | World Tree | 89 | 645 |
  | Ash Colossus | 22 | 160 | Horned Hunter | 29 | 210 |
  | Elder Wyrm | 29 | 210 | Mother of Beasts | 9 | 65 |

  Casters' spells are not counted, as `armyPower` never counts them; high-protection idols
  score high against light troops, which is the right warning for an AI that would attack
  them with light troops. The term joins `armyPower` when the UI spec moves that function into
  the sim (its Phase 8 list); Phase 12 recalibrates after tuning.

---

## B. Customization (Age of Wonders 4-like)

### B.1 What to take from AoW4

AoW4's decisive move is that the people's form is cosmetic and the traits are mechanical: "the
physical form is effectively only cosmetic" ([AoW4 wiki: Form](https://aow4.paradoxwikis.com/Form)).
Reviewers treat the faction creator as the game's center; Gideon's Gaming puts it "at the
forefront" of what the game aims to be ([review](https://gideonsgaming.com/age-of-wonders-4-review/)).
The lessons below come from `research-aow4.md` (Part 2), which cites each source.

| Lesson | Evidence | Fluid Magic |
|---|---|---|
| Any look on any build | Form is cosmetic ([wiki](https://aow4.paradoxwikis.com/Form)) | `PretenderLook` never touches `PretenderDesign` |
| Mechanics add visuals; cosmetics never add mechanics | Dragon attunement sets breath and glow ([Dragon Dawn](https://www.paradoxinteractive.com/games/age-of-wonders-4/add-ons/age-of-wonders-4-dragon-dawn)) | Pips, blessings, dominion, awakening and body tags each show by themselves (B.4, C.5) |
| A visual that carries movement cannot be hidden | Transformations can be hidden, except flying or floating ([forum](https://steamcommunity.com/app/1669000/discussions/0/6761669877514621714/)) | Wings, roots, the stealth flicker and embers are fixed parts; a slot that varies wings (the Phoenix's plumage) varies only their shape, and every variant is a wing |
| Cosmetics locked by mechanics anger players | The C4U mod exists only to unlock cultures' cosmetics ([Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=2971527182)) | No slot is locked by nation, realm or pips |
| Fixed secondary colors anger players | Dragons have "only one colour option" ([forum](https://steamcommunity.com/app/1669000/discussions/0/4036979414422568941/)) | Three chosen channels on every chassis |
| New ruler types shipped thin | "Not enough cosmetic options for Giant Kings" ([forum](https://steamcommunity.com/app/1669000/discussions/0/596271495257278373/)) | A content test requires 4 slots and 12 variants on every chassis |
| Random came late, then gained settings and history | Random Ruler in the Wyvern Update ([patch notes](https://store.steampowered.com/news/app/1669000/view/7208622092879106175)) | Random god and random look from day one, with locks and a 10-roll history |
| No in-game sharing | "No easy in-game way to share factions" ([forum](https://steamcommunity.com/app/1669000/discussions/0/839501827476184072/)) | A share code |
| Generated history makes a faction feel authored | "The creator will also create a historic background" ([GamePressure](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c)) | A templated myth line with an override |
| One base mesh, shared animations | Dev Diary #11 ([GameBanshee](https://www.gamebanshee.com/news/127487-age-of-wonders-4-developer-diary-11-art-design.html)) | One anchor skeleton per rig; overlays authored in anchor space; the battle design's closed-form poses move every variant |

Appearance editable mid-campaign (the Dragon Lord's "Adjust Appearance",
[MMORPG](https://www.mmorpg.com/reviews/age-of-wonders-4-dragon-dawn-review-strategy-session-2000128239))
is M2 (both judges).

### B.2 Where the look lives

- **Outside `GameState`.** `PretenderDesign` stays the sim's type. The look, the identity
  (except the name) and the nation look live in three places: the designer's saved gods
  (`GodRecord` in IndexedDB), the share code, and the save file's UI block (`uiSave`, UI spec
  6.7). The sim cannot read what it does not hold, so "cosmetic never affects the sim" is
  structural.
- **The name** is the one exception: `NationSetup.pretenderName` becomes
  `NationState.pretenderName` (D7), which names the pretender commander on every arrival, so
  messages ("Vulkra stands in Kharnath.") and battle rosters carry it. It is an opaque label;
  no rule branches on it.
- **AI nations** take their preset's curated look and identity. A second nation of the same
  kind takes a roll from a stream seeded by the game seed and its slot (never `state.rng`).
  The save stores it, so a reload shows the same look.
- **Guards.** `tests/sim/purity.test.ts` forbids `src/sim/**`, `src/mapgen/**` and `src/ai/**`
  from importing `src/content/looks/**`, as it forbids `src/present`. Two determinism tests:
  1. two games from one setup that differ in every look and identity field except the name
     reach equal state hashes after 365 days;
  2. two games that differ only in the name (two names that appear nowhere else, `Qzxv` and
     `Wryq`) satisfy `JSON.stringify(a).replaceAll('Qzxv', 'Wryq') === JSON.stringify(b)`
     after 365 days: the name changes nothing but its own appearances.

```ts
// src/content/looks/types.ts (presentation data; never imported by src/sim, src/mapgen, src/ai)
export type SlotId = string;          // per chassis, from ChassisLookDef.slots
export type VariantId = string;       // from the slot's part family
export type SliderId = 'stature' | 'head' | 'horns' | 'wingspan' | 'glow';
export type Pose = 'regal' | 'wrathful' | 'serene';
export type AuraShape = 'halo' | 'motes';             // M2 adds more
export type Flourish = 'sigilWheel' | 'haloBurst';     // M2 adds more
export interface PretenderLook {
  v: 1;
  chassis: string;
  parts: Partial<Record<SlotId, VariantId>>;           // absent: the slot's variant 0
  markings: MarkingId;
  swatches: { material: SwatchId; metal: SwatchId; accent: SwatchId };
  sliders: Partial<Record<SliderId, -2 | -1 | 0 | 1 | 2>>;   // absent: 0
  pose: Pose;
  aura: AuraShape;                                      // shape only; colors come from the pips
  flourish: Flourish;                                   // plays in the charge beat only (C.5)
  /** Breath chassis only: a color the design has a pip in; null takes the nation's primary. Display only (docs/05). */
  breath: Color | null;
}
export interface PretenderIdentity {
  /** 1 to 24 symbols of the identity alphabet (D7); copied into NationSetup.pretenderName. */
  name: string;
  /** 0 to 32 symbols, "the Unburnt". */
  epithet: string;
  /** 0 to 32 symbols, "Lord of Cinders". */
  title: string;
  pronoun: 'he' | 'she' | 'they' | 'it';
  /** null: the templated myth (B.6); else at most 280 UTF-8 bytes in any script, shown only as DOM text. */
  myth: string | null;
}
export interface NationLook {
  sigil: { frame: SigilFrameId; charge: SigilChargeId };
  division: BannerDivisionId;
}
/** A god in the designer, in My Gods, and in a share code. */
export interface GodRecord {
  v: 1;
  nation: NationDefId;
  design: PretenderDesign;   // the sim's type, checked by validatePretender
  look: PretenderLook;       // checked by validateLook
  identity: PretenderIdentity;
  nationLook: NationLook;
}
// The save file's UI block (UI spec 6.7, uiSave) gains:
//   gods: Partial<Record<NationId, { look: PretenderLook; identity: PretenderIdentity; nationLook: NationLook }>>

// src/content/looks/chassis.ts
export interface ChassisLookDef {
  chassis: string;
  rig: Rig;                  // the battle design's rigs (S4.4); no new rig in M1
  archetype: Archetype;      // one per pretender body (C.2)
  slots: readonly { id: SlotId; family: PartFamily; anchor: PartId; variants: readonly VariantId[] }[];
  /** Three of the eight procedural markings. */
  markings: readonly MarkingId[];
  materialFamily: 'skin' | 'stone' | 'bark' | 'wood' | 'scale' | 'hide' | 'ember';
  sliders: readonly SliderId[];
  /** Parts that carry mechanics; never slots. */
  fixed: readonly string[];
  breath?: true;
  visualSize?: number;
}
// src/present/looks/validate.ts
export function validateLook(look: PretenderLook, design: PretenderDesign): string | null;
```

### B.3 Slots and variants per chassis

Every chassis has **four overlay slots with three variants each**. Variant 0 is the base art
Phase 11 needs anyway. Every slot is an overlay on one anchor of an existing rig (a head
piece, a mantle, a weapon head, a tail, a canopy), never a whole body. Slots favor silhouette,
because faces vanish at 64 px (research-aow4 L8). Variants come from **shared part
families**, authored once in anchor space and scaled per chassis. "(procedural)" slots are
drawn in code.

| Chassis | Rig | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Fixed (mechanics) |
|---|---|---|---|---|---|---|
| Oracle of the Flux | biped | headgear: cowl, circlet, mask | mantle: none, long cape, tattered | staff head: orb, crescent, mote cage | robe glyphs: runic, spiral, dot-line (procedural) | floating hem |
| Titan | biped | headgear: great helm, horned crown, crown of points | mantle: none, long cape, banner cape | blade: straight, flamberge, broad | armor marks: plain, runic, veins (procedural) | — |
| Great Wyrm | wyrm | horns: swept, crown of spines, frill | wing membrane: smooth, tattered, ribbed sail | tail: spade, club, blade fin | scale pattern: banded, mottled, plated (procedural) | wings; breath glow |
| Living Monolith | slab | capstone: none, floating stone, carved capstone | overgrowth: none, moss and vines, soot and cracks | face: none, stern, weeping | glyphs: runic, spiral, dot-line (procedural) | rooted base |
| Ascended Hero | biped | headgear: circlet, great helm, horned crown | mantle: long cape, banner cape, tattered | blade: straight, broad, flamberge | heraldry: plain, quartered, chevrons (procedural) | — |
| Primordial | quadruped | horns: ram, crown of spines, antlers | back: moss, spines, crystals | tail: club, spade, blade fin | hide: mottled, banded, stone (procedural) | — |
| Ash Colossus | biped | head: brazier, horned skull, faceless crown | shoulders: bare, chains, spikes | fists: bare, banded, molten | cracks: veins, plates, runes (procedural) | embers |
| Ash Phoenix | wyrm (no breath) | crest: plume, flame crest, horned crest | plumage: fan, flame fringe, streamers | tail: long, fan, forked | feathers: barred, ember-tipped, plain (procedural) | wings (every plumage variant is a wing); flame trail |
| Pyre Lord | biped | headgear: flame crown, horned crown, great helm | mantle: ember mantle, banner cape, none | glaive: glaive, crescent, hooked | ash marks: stripes, veins, runic (procedural) | — |
| Cinder Idol | slab | face: brazier face, horned head, stacked cairn | base: plinth, chained, skull pile | veins: soot and cracks, ember veins, none (procedural) | glyphs (procedural) | immobile base line; smoke |
| Ember Hierophant | biped | headgear: mask, cowl, flame crown | mantle: ember mantle, long cape, tattered | staff head: orb, crescent, mote cage | robe glyphs (procedural) | — |
| Wild Spirit | spirit | head: antlers, spirit mask, horned skull | ruff: leaf ruff, mist mane, bone collar | trail: wisps, leaves, mist (procedural) | markings: stripes, rings, spots (procedural) | translucent flicker |
| World Tree | treant | canopy: round, weeping, crown of thorns | trunk face: none, carved face, knotted eyes | blossom: none, pale blossom, fruit (procedural) | bark: ridged, spiral, knotted (procedural) | roots |
| Horned Hunter | biped | antlers: antlers, ram, swept | mantle: leaf mantle, wolf pelt, tattered | spear: leaf blade, hooked, crescent | warpaint: stripes, spots, handprints (procedural) | — |
| Elder Wyrm | serpent | horns: crown of spines, swept, frill | back: moss, spines, crystals | tail: club, spade, blade fin | scale pattern (procedural) | no wings: it does not fly |
| Mother of Beasts | biped | pelt cloak: bear pelt, wolf pelt, stag hide | headgear: antler crown, circlet, none | maul: plain, studded, stone-headed | warpaint (procedural) | — |

Combinations: 3⁴ = 81 silhouettes per chassis before color, markings, pose, aura, flourish and
sliders. The battle design's `PartId` list gains `horns`, `back`, `face` and `base`; mantles,
ruffs and pelt cloaks use its `cloak`, crests and canopies its `crown`, weapon heads its
`weapon` (C.2).

### B.4 Color channels and the color-blind rules

| Channel | Chosen or derived | Choices in M1 | Carries information? |
|---|---|---|---|
| `banner` (the tint zone in battle and on the map) | derived: the nation's banner (`NATION_BANNERS`) | none | yes: which side; the palette test checks it |
| `pipTint` (the tint zone on the summary card and the designer portrait, `docs/09`) | derived: the dominant pip color | none | yes: always beside the mana-symbol row |
| `glow` (aura motes, eyes, glyphs, breath, staff head) | derived: every color with pips, in proportion; a breath chassis's breath from the look | none | yes: paired with symbols (C.5) |
| `material` (skin, stone, bark, wood, scale, hide, ember) | chosen | 8 per family (ember 6) | no |
| `metal` (crowns, armor, chains) | chosen | 6 | no |
| `accent` (cloth trim, markings) | chosen | 8 muted tones | no |

**Swatch tables** (checked by `calc-final/swatches.ts`; every rule below passes):

| Table | Swatches |
|---|---|
| skin | ash `#8F8C88`, tan `#A0785A`, umber `#6B4A35`, pale `#D9C3A5`, ochre `#B8874A`, slate `#6F7A80`, ivory `#EDE3CF`, soot `#3E3A36` |
| stone | granite `#7D7A75`, basalt `#3F3D3B`, sandstone `#C2A37A`, marble `#E6E1D6`, slate `#56616A`, ochre `#A88450`, moss `#6E7A5A`, obsidian `#26232A` |
| bark | oak `#6B4A2B`, birch `#D8D2C2`, ash `#8C8274`, ebony `#3A2E26`, cedar `#8A5A3C`, mossy `#5F6B45`, silver `#A8A49A`, lichen `#8E9A78` |
| wood | oak `#7A5A3A`, pale `#C8AE86`, dark `#4A3424`, red `#8A4E36`, grey `#8E8676`, green `#5E6B47`, gold `#B08A4E`, black `#2F2822` |
| scale | bronze `#8A6A3E`, jade `#3F6E58`, slate `#4E5A66`, bone `#CFC4AA`, rust `#8E4F33`, violet `#5A4A6E`, gold `#B8933E`, black `#2A2628` |
| hide | brown `#7A5638`, grey `#8A8781`, black `#2E2A27`, tawny `#B08A55`, white `#E4DED2`, russet `#A8623E`, dun `#A39274`, dark `#4A3A2E` |
| ember | coal `#3A2A24`, cinder `#5A4A44`, ash `#9A928A`, bronze `#8A5E34`, gilt `#B8904A`, bone `#D2C6B0` |
| metal | gold `#C9A23E`, silver `#B9BEC4`, bronze `#9A6B3A`, iron `#6C6E70`, bone `#D8CDB4`, obsidian `#2B2830` |
| accent | lichen `#909080`, heather `#807080`, sea grey `#708080`, sage `#709070`, sand `#B0A090`, dusk plum `#906080`, oxblood `#402020`, pale ash `#D0D0D0` |

Variant 0 of each table is the first entry; a chassis's base art uses it.

Rules, each a test in `tests/content/looks.test.ts` using the palette test's helpers
(`tests/content/colorMath.ts`, `src/content/colors.ts`):
1. Chosen channels carry no information. Side identity is banner, glyph and position (battle
   design S4.8); color identity is glow plus symbol.
2. Every material and metal swatch reaches WCAG 3:1 against the keyline `keylineFor` picks
   for it, so the silhouette reads on every swatch.
3. Every accent differs from every `NATION_BANNERS` entry by CIEDE2000 ≥ 15, and ≥ 10 under
   each simulated deficiency, so a god's trim never reads as another side's banner. (The
   draft's earthy accents failed this; the table above was searched for it,
   `accent-search.ts`.)
4. Swatches within one table differ by CIEDE2000 ≥ 8, so every choice is visibly a choice.
5. Every `flash` cue color and every timed tint (a color change that reverts within 1 s, or a
   pulse) in presentation content scores below 0.78 on WCAG's saturated-red ratio computed on
   linearized sRGB (C.1). Swatches are neither, so this rule does not bind them.
6. The designer has a color-blind preview (protanopia, deuteranopia, tritanopia) using the
   palette test's simulation matrices in a `ColorMatrixFilter`.

M2: a free color picker for material, metal and accent only, behind "More colors", checked
live by rules 2 to 4. The derived channels never get one. AoW4 players asked for more colors
([Age of Colors mod](https://steamcommunity.com/sharedfiles/filedetails/?id=2970499689)); FM's
map colors are gameplay information, so identity goes into shapes.

### B.5 Sliders, poses, auras, flourishes, markings

- **Sliders** (−2 to +2, integers, clamped), each a transform on an anchor: stature ±3% a
  step; head ±6%; horns or crown length ±10% (chassis with a horn, crown or antler slot);
  wingspan ±8% (flyers only); glow intensity ±25% particle rate, capped by the tier budgets
  of C.1 (bodies with embers or glyphs). The sim's `size` drives battle drawing, so stature
  never changes the size class. A test composes every chassis at ±2 on every slider and
  checks the bounding box stays inside the portrait frame (AoW4's cropping problem,
  research-aow4 1.5).
- **Poses** (3: regal, wrathful, serene) are anchor offsets on a new closed-form `portrait`
  pose per rig, for the portrait and the designer's idle. Battle poses stay rig-driven
  (battle design S4.4).
- **Aura shapes** (2 in M1, procedural, cosmetic): halo ring and orbiting motes. Their colors
  always come from the pips; their motes move in each color's verb (C.1).
- **Cast flourishes** (2 in M1, procedural, cosmetic): sigil wheel (the god's sigil turns on
  the ground) and halo burst (a ring of the god's mana symbols snaps outward at release).
  They play inside the charge beat of the god's own first cast and never lengthen it (C.5).
- **Markings** (8 procedural pattern fills: stripes, rings, spots, banded, mottled, runic,
  veins, plain), drawn in the accent channel through the part's tint mask. Each chassis lists
  the three it offers.

### B.6 Identity: name, epithet, title, pronoun, myth

- **Name** (1 to 24 symbols), **epithet** (0 to 32), **title** (0 to 32): letters A to Z and a
  to z, space, apostrophe, hyphen, period. That alphabet is enough for every generator table
  below, every glyph the HUD's DOM text needs, and the share code's 6-bit packing.
  Localization is out of M1's scope (`docs/10`); M2 can widen the alphabet with a payload
  version. Display: "Vulkra the Unburnt" with "Lord of Cinders" beneath, as DOM text.
- **Pronoun**: he, she, they, it. AoW4 launched its Eldritch Sovereign without "it"
  ([forum](https://steamcommunity.com/app/1669000/discussions/0/4548155824440762289/)).
  Messages never use pronouns, so the pronoun stays in the UI block.
- **Generators** run on the designer's seeded stream (B.9). Names come from syllable tables
  per dominant color, as `src/content/names.ts` does for provinces (Ember: Vul, Khar, Pyr,
  Ash, Cind + ra, ax, oth, eth; Loam: Thal, Ver, Ald, Sylv + wyn, mere, oak, ra; the M2 colors
  are added with their nations). Epithets and titles come from tables keyed by role and
  dominant color ("the Unburnt", "Pyreborn", "the Evergreen", "Root of Ages"; "Lord of
  Cinders", "Mother of the Hunt", "Keeper of the Spring").
- **Myth** (2 or 3 sentences, templated, overridable): built from the chassis phrase, the
  dominant color, the strongest scale pole, the dominion strength word, the awakening and the
  signature blessing. Example (Ash Phoenix, R4, Growth 2, dormant): "Ash-feathered and
  undying, Vulkra the Unburnt sleeps a year beneath Kharnath. When it wakes, the land will grow
  and burn by turns." Templates read the pronoun. An override is free text in any script,
  capped at 280 UTF-8 bytes (the field counts bytes and says so), shown only as DOM text. The
  `docs/05` "reading" stays a separate strategic one-liner on the card ("An undying firebird.
  Expect raids that never end.").

### B.7 Nation banner and sigil

- **Banner color** stays as `NATION_BANNERS` assigns it, because ownership bands and candles
  are gameplay information and pass the palette tests (`docs/09`).
- **Division** (6, procedural): plain, per pale, per fess, per bend, chevron, bordure, in the
  banner color and the neutral that `keylineFor(banner)` picks (`#F4EEDF` or `#1C1A17`).
- **Sigil**: a frame (6: roundel, shield, lozenge, sunburst, ring of thorns, broken circle)
  around a charge (16: crown, eye, hand, tree, flame, tower, serpent, star, skull, wave,
  antler, key, sword, wheel, moon, anvil), drawn in the neutral. 96 sigils × 6 divisions = 576
  banners, all told apart by shape. Charges are original geometric shapes in the `docs/09`
  monoline icon style.
- **Where it shows**: the army badge corner (a 10 px charge), the squad pennants in battle
  beside the side glyph, the `PretenderCard`, the top bar's nation button, name cards, the
  rim of ritual sigils (C.4) and the victory screen.

### B.8 Portrait

- The portrait is **composed from the same parts** as the battle sprite, in the rig's
  `portrait` pose, at 128 px (card), 256 px (designer preview) and 64 px (battle docks). This
  replaces `docs/09`'s "a 128x128 SVG portrait" per chassis, so every cosmetic choice shows on
  the card.
- **The 256 px problem.** Parts drawn for a 64 px sprite look bare at 256. Each chassis gets
  one **portrait detail layer** (face lines, eyes, ornament engraving, drawn for 256 px) that
  the part set draws only when the target is 128 px or larger. Overlays are authored on the
  same 256-unit grid and simplified below 128 by dropping strokes marked
  `data-lod="portrait"`.
- Layers, back to front: backdrop (parchment, the nation's home terrain gradient, or night),
  ground aura, body parts, glow parts, blessing rings and orbiting symbols (C.5), the
  awakening overlay (dormant: closed eyes and a dimmed aura, drawn in code; imprisoned: runic
  chains), the detail layer, the sigil corner, the frame.

### B.9 Presets, randomize, My Gods, the share code

- **Presets** (A.8) carry a curated look and identity. Applying one asks nothing; a "keep my
  look" checkbox keeps the current look and identity when only the build should change.
- **Random god** (`rollGod(nation, seed, opts)`): picks an available chassis, an awakening at
  or above its minimum, and a strategy family (bless rush, mage, dominion, sleeper,
  summoner); spends by that family's template (pips first, then dominion, then the nation's
  own poles); then keeps buying the cheapest affordable unlocked step until **no affordable
  unlocked step remains**; takes the Recommended blessings; and adds one affordable boon 30%
  of the time. Locked steps are never changed. The result always validates.
- **Random look** (`rollLook(chassis, seed, locks)`): every unlocked slot, swatch, marking,
  pose, aura and flourish uniform; sliders 0 (60%), ±1 (30%), ±2 (10%). Identity rolls from
  the generators.
- **Determinism and history.** The stream is `createRng(hash32('god', seed))` from the sim's
  algorithm, through the battle design's pure stream helper, never `state.rng`. The seed shows
  in the dice tooltip; Back and Forward walk the last 10 rolls. Each build step and each look
  slot has its own die and lock; players asked for a random button on every step
  ([forum](https://steamcommunity.com/app/1669000/discussions/0/3828666283443789087/)).
- **My Gods**: an IndexedDB store of `GodRecord`s (`idb-keyval`, which `docs/06` names): Save
  in place, Save as copy, Rename, Delete, Copy code. AoW4 players reported edits that did not
  stick ([forum](https://steamcommunity.com/app/1669000/discussions/0/5294588689507328353/)).

**The share code.** `FM1-` + base64url(payload ‖ CRC-16/CCITT-FALSE). Indices come from
append-only code tables in presentation content (`src/content/looks/codes.ts`: nations,
chassis, blessings, slots and variants per chassis, swatches, markings, sigil parts); a
snapshot test pins every existing index so old codes keep decoding. Every field is sized for
its M2 maximum; a change of layout bumps the payload version.

| Field | Bits | Range |
|---|---|---|
| payload version | 4 | 1 |
| nation | 6 | code table |
| chassis | 7 | code table (M2: about 36) |
| pips W U B R G | 5 × 3 | 0 to 6 |
| dominion | 4 | 1 to 10 |
| scales (value + 3), five axes | 5 × 3 | 0 to 6 |
| awakening | 2 | 3 values |
| blessings present (0: the default rule, the field absent) | 1 | |
| then: count, then each blessing index | 6 + n × 8 | up to 63 of 256 |
| boons mask (bit 0 Sacred Spring, bit 1 Avatar, the rest reserved) | 8 | |
| Sacred Spring's color, if bit 0 | 3 | |
| look: slot count, then each variant index in slot order | 3 + n × 4 | up to 7 slots of 16 variants |
| markings, material, metal, accent | 4 + 4 + 4 + 4 | 16 each |
| sliders: count, then slider index and value + 2 | 3 + n × (3 + 3) | |
| pose | 3 | M1 3, M2 5 |
| aura, flourish | 4 + 4 | M1 2 each, M2 8 |
| breath (0: none or the default) | 3 | |
| sigil frame, charge, division | 4 + 8 + 4 | M2: about 200 charges |
| pronoun | 2 | |
| name: length, then 6 bits a symbol | 5 + 6n | 1 to 24 |
| epithet, title: length, then 6 bits a symbol | (6 + 6n) × 2 | 0 to 32 each |
| myth present | 1 | |
| then: UTF-8 byte length, then the bytes | 9 + 8n | 0 to 280 bytes |
| CRC-16 | 16 | |

Measured with `sharecode-final.mjs` (a full encoder and decoder):

- 2,000 random gods round-trip exactly, 200 of them with every text field at its maximum (a
  24-symbol name, 32-symbol epithet and title, a 280-byte myth of mixed scripts and emoji,
  22 blessings).
- Lengths: 35 characters with a one-letter name and no epithet or title; 67 for a Pyre Lord
  named "Vulkra the Unburnt, Lord of Cinders"
  (`FM1-EAQAIEAbYAIQgSKbINEiAIHMMtfNLY2XdE-ArQ5fZRceZTY8BTAAHHQ8_ZaAxDE`); 527 at every maximum.
- All 362 one-character changes of that example are refused (CRC-16 catches every error of up
  to 16 bits, and one base64 character carries 6).
- The decoder refuses trailing data and out-of-range lengths.

On import, the code is decoded, then checked by `validatePretender` (design and name) and
`validateLook`; a refusal names its reason ("This code was made with a newer version", "Pyre
Lord is not offered to Thornwood", "The design costs 405 of 400 points"). `#god=` links are
M2.

### B.10 Art budget

How parts compose (`docs/09` part system, battle design S4.4 `PartSet` seam):
- Each rig has an anchor skeleton (named points: `head`, `crown`, `back`, `handMain`, `tail`,
  `base`). Overlays are authored in their anchor's local frame, so the battle design's
  closed-form poses move every variant.
- Cosmetic variants are alternative textures for a `PartId`. `PartSet.build` gains an
  optional fourth argument, the pretender's resolved variants (C.2); a missing variant falls
  back to variant 0, then to the procedural part (the battle design's fallback chain).
- Tint zones keep `currentColor`: the banner in battle, the dominant pip color on the card. The
  accent channel fills a second mask (`data-zone="accent"`), the material a third.

**What M1 must ship as SVG** (Phase 11). The six existing chassis bodies are already in the
Phase 11 list (`docs/09` archetypes); their six 128 × 128 portraits are no longer drawn.

| Group | Files | Derivation |
|---|---|---|
| Bodies of the 10 new chassis, on existing rigs | 49 | biped bodies 6 parts each (torso, head, two arms, two legs) for the Ascended Hero, Pyre Lord, Horned Hunter and Mother: 24; Ember Hierophant 5 (robe torso, head, two arms, hem); Primordial 5 (body, head, jaw, two leg shapes); Elder Wyrm 6 (the same on the serpent rig, plus one tail segment drawn three times; the tail-tip variants are a slot); World Tree 4 (trunk, two limbs, roots); Ash Phoenix 3 (body, one neck segment reused, beaked head); Cinder Idol 2 (slab, core). Weapons, wings, tails, canopies and faces are slots, counted below |
| Headgear family | 8 | cowl, circlet, mask, great helm, horned crown, crown of points, flame crown, antler crown |
| Mantles and pelts | 8 | long cape, tattered cape, banner cape, ember mantle, leaf mantle, wolf pelt, bear pelt, stag hide |
| Horns | 5 | swept, crown of spines, frill, ram, antlers |
| Backs | 3 | moss, spines, crystals |
| Wyrm tails | 3 | spade, club, blade fin (Great Wyrm, Elder Wyrm, Primordial) |
| Wing membranes | 3 | smooth, tattered, ribbed sail |
| Phoenix plumage, tails, crests | 9 | 3 each |
| Weapon heads | 18 | 3 each for blades, glaives, mauls, spears, staff heads, fists |
| Wild Spirit heads and ruffs | 5 | spirit mask, horned skull (shared with the Ash Colossus); leaf ruff, mist mane, bone collar |
| Ash Colossus heads and shoulders | 4 | brazier, faceless crown; chains, spikes |
| Living Monolith overlays | 6 | floating stone, carved capstone; moss and vines, soot and cracks; stern face, weeping face |
| Cinder Idol overlays | 6 | brazier face, horned head, stacked cairn; plinth, chained, skull pile |
| World Tree overlays | 5 | round, weeping, crown of thorns canopies; carved face, knotted eyes |
| Portrait detail layers | 16 | one per chassis (B.8) |
| Sigils | 22 | 6 frames, 16 charges |
| Awakening overlay | 1 | runic chains (the dormant look is drawn in code) |
| **Total** | **171** | 49 body parts, 83 cosmetic parts, 16 detail layers, 22 sigil parts, 1 overlay |

**Procedural (code, no SVG files):** markings (8), glyph scripts (3), aura shapes (2),
flourishes (2), banner divisions (6), sliders (5), poses (3), the blossom, vein, trail and
warpaint variants, the pip-driven glow, and every effect texture (C.1). Until Phase 11 the
designer and the replay draw the battle design's procedural placeholder parts, and every slot
family has a parametric placeholder drawn in code (one function per family with the variant
as a parameter, Phase 10), so Phase 9 shows every choice before any SVG exists.

**Cut line** if Phase 11 runs long: weapon heads to 2 variants (−6 files), then Phoenix crests
and Wild Spirit ruffs to 2 (−2). The content test's floor is 4 slots and 11 variants per
chassis (12 before the cut). Procedural items are never cut; they cost code, not art.

### B.11 How M1 compares with AoW4, axis by axis

The draft multiplied swatch counts into "about 12 million looks per chassis". That number hid
that each slot has only 3 variants. The honest comparison is by axis:

| Axis | AoW4 | FM M1 | Verdict |
|---|---|---|---|
| Ruler types and chassis | 6 ruler types (2 base, 4 from DLC) | 16 chassis, 11 per nation | FM has more; AoW4's types also carry skill trees |
| Mechanical build layers | form traits, culture, society traits, tome, class | chassis, pips, dominion, five scales, awakening, blessing menu, boons | comparable depth |
| Appearance slots per ruler | about 10 (physique, head, hair, skin, outfit, helmet, cape, weapon, mount, pose); per-slot counts not published (research-aow4 3.7) | 4 overlay slots × 3 variants, plus markings | **FM is well below** |
| Sliders | body shape, head, hands, height, arm length | up to 5 per chassis | similar count, narrower range |
| Chosen colors | skin, hair, armor, two banner colors; a picker added later | 3 channels from fixed swatches | FM is below until M2's picker |
| Banner | 13 base colors and an icon set | colors fixed as gameplay information; 96 sigils × 6 divisions | a different trade: identity by shape |
| Identity | name, title, pronouns, faction and city names, generated history | name, epithet, title, pronoun (it included), templated myth with override | comparable |
| Presets | 18 to 20 | 12, each with a look | below |
| Random | random ruler, then settings and history (added later) | random god and look, locks, seed, 10-roll history | at par from day one |
| Sharing | none in game | share code | ahead |
| Magic look | through attunement and transformations | pip-driven aura and glow, blessing rings, 2 auras, 2 flourishes | narrower |

**Bottom line for the owner:** M1 matches AoW4's structure (any look on any build, mechanics
that show, random with history, identity, sharing) but not its per-slot depth. M2's 6 slots ×
5 variants and the color picker are where "a customization level matching Age of Wonders 4"
is reached (E.2).

### B.12 Tests

- `tests/content/looks.test.ts`: every chassis has a `ChassisLookDef` on an existing rig with
  at least 4 slots and 12 variants (11 once B.10's cut line is taken); every variant resolves to a manifest entry or a listed
  procedural fallback; every preset has a valid look; swatch rules 2 to 5 (B.4); sliders at
  ±2 stay inside the portrait frame; code tables are append-only (snapshot).
- `tests/present/looks/validate.test.ts`: `validateLook` refuses unknown slots, another
  chassis's variants, out-of-range sliders, a breath color without a pip, a breath on a
  non-breath chassis, and a myth over 280 bytes.
- `tests/present/looks/share.test.ts`: 1,000 random gods round-trip exactly, a tenth at every
  maximum; a changed character fails the checksum; a newer version is refused with its
  message; an over-budget or foreign-realm design is refused with the validator's message;
  trailing data is refused.
- `tests/present/looks/random.test.ts`: `rollGod` over 1,000 seeds always validates and stops
  only when no affordable unlocked step remains; the same seed gives the same god; locks hold.
- `tests/sim/purity.test.ts`: sim, mapgen and AI never import `src/content/looks`.
- `tests/sim/determinism.test.ts`: the two tests of B.2.
- UI smoke: compose every chassis with every variant into a texture without throwing.
- **Contact sheet for the owner** (judges' visual review): a dev-only lab page
  (`lab/looks.html`) lays out every chassis × every slot variant in the portrait pose at
  64, 128 and 256 px, and in idle, attack and death poses at battle size, on light and dark
  backdrops and under the three simulated deficiencies. `looks-contact.spec.ts` (Playwright)
  saves one screenshot per chassis as a CI artifact for the owner to review; it asserts only
  that each sheet is non-blank. Phase 11's commit attaches the sheets.

---

## C. Flashy magic

### C.1 The grammar

**Look = template(primitive) × verb and shapes(color) × material(element) × tier(level,
breadth) + flourish(the god, cosmetic).** The template fixes the beats and the primary shape;
the color fixes motion, shapes, light model, palette and symbol; the element fixes the impact
material and the decal; the tier fixes duration, particle and screen budgets; the flourish
decorates the god's charge and never changes timing or tier. A spell or ability without a
storyboard still gets a correct look on day one, which covers every M2 spell before it is
storyboarded (research-vfx 3.1). This is the battle design's five beats (S2.10) and its
generic templates by primitive, made into one rule.

Why: Total War names its spell types by shape (missile, wind, breath, vortex, augment, hex)
([alcasthq](https://alcasthq.com/warhammer-lore-of-fire-magic-type)), and a spell that looks
like a vortex but is direct damage misleads players
([guide](https://steamcommunity.com/app/364360/discussions/0/351660338685393106)). Riot's rule
is "visual impact should represent gameplay impact"
([VFX style guide](https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/)).
AoW4 players noticed animations that were the same "with a different color palette"
([forum](https://steamcommunity.com/app/1669000/discussions/0/3828666283438110304/)). So each
color gets its own motion, not only its own tint, and each primitive its own shape.

**Colors** (palettes from `docs/09`; verbs from its animation section and the battle design's
color grammar; the M2 colors are defined now so their spells look right when they arrive).
The last row is WCAG's saturated-red ratio on linearized sRGB (`redflash-final.mjs`).

| | W Radiance | U Tide | B Umbra | R Ember | G Loam |
|---|---|---|---|---|---|
| Primary verb | radiate (straight lines from a center) | ripple (rings) | sink (down, drips, falling smoke) | rise and flicker | spread along the ground |
| Secondary verbs | descend, ring | refract, freeze, arc | drain toward the caster, wither | burst, jitter, shimmer | grow with overshoot, branch, erupt from below |
| Shapes | rays, perfect circles, rosettes, four-point sparkles | concentric rings, sine waves, hex shards, mist sheets | drips, tendrils, inward spirals, cracks | jagged flames, sparks, embers, smoke columns | curves, roots, vines, leaves, petals, spores, bark |
| Light model | emissive, additive; warm white body, gold rim | emissive, additive; displacement at tier 2+ | absorptive: multiply blots, desaturation, violet rim (`#C9A6EA` for dark ground) | strongly emissive, additive; orange-gold core, char smoke | matter, normal blend; only heals glow |
| Body / dark / light steps | `#F3E6B8` / `#D9B85C` / `#FFFFFF` | `#3A7BD5` / `#1E3F7A` / `#9ED8FF` | `#3D2B4F` / `#1A1024` / `#9B4DCA` | `#FD6533` / `#7A1E12` / `#FFB347` | `#00674B` / `#244F22` / `#A6D96A` |
| Flash color (C.1 rule) | `#FFFFFF` | `#9ED8FF` | `#C9A6EA` | `#FFB347` | `#A6D96A` |
| Decal | gilded ring fading over 2 s | rime, wet sheen | rot stain | scorch, cinders, craters | grass tufts, flowers, root scars, leaf litter |
| Signature moment | the sun column | the ripple lens | the drain | the burst | the eruption from a ground crack |
| Cue without hue | ray geometry and the sun-disc glyph | rings and the wave glyph | downward motion, grey-out, the skull-drop glyph | upward sparks and the flame glyph | ground-hugging motion and the leaf glyph |
| Sound family (battle design S3) | `spell.W.*`: shimmer, bell, choir | `spell.U.*`: swirl, splash, ice | `spell.B.*`: sub drone, whisper, hiss | `spell.R.*`: crackle, roar, fwoomp | `spell.G.*`: rustle, creak, crack, bloom |
| Saturated-red ratio, body / dark / light | 0.41 / 0.54 / 0.33 | 0.05 / 0.05 / 0.17 | 0.31 / 0.31 / 0.33 | **0.86 / 0.91** / 0.66 | 0.00 / 0.16 / 0.31 |

Every primary shape carries a 1 to 2 px keyline by `docs/09`'s `keylineFor(ground)`; with it,
contrast is at least 4.53:1 on every terrain fill, the parchment and the dark UI, while
several palette steps alone fall below 3:1 (research-vfx 2.5). Holy (the priests' Bless, the
prophet) uses the Radiance palette with light from above and the bell.

**The red-flash rule** ([WCAG 2.2, 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)).
WCAG counts a state as saturated red when R/(R + G + B) ≥ 0.8, with R, G and B taken from its
"relative luminance" definition, that is, linearized. The draft computed it on
gamma-encoded values, which understates reds: on linear values Ember's body `#FD6533` scores
0.857 and its dark step `#7A1E12` 0.911, so both are saturated red (Rulings R14). The rule:
- every `flash` cue color, and every timed tint (a color change that reverts within 1 s, or a
  pulse), scores below **0.78** on linear values, a margin of 0.02 under WCAG's line;
- Ember's flash and tint color is its light step `#FFB347` (0.661); Ember's body and dark
  steps may color particles, embers and decals, which do not flash, but never a flash or a
  tint;
- pulses run at 3 Hz or less, the WCAG flash rate, whatever their color;
- the test (C.7 item 6) first asserts its helper flags `#FD6533`, so it cannot pass vacuously.

**Elements** (impact material; the sim's elements have no rules effect in M1).

| Element | Owner | Impact | Kill | Decal | Map form |
|---|---|---|---|---|---|
| fire | R | ember sparks, orange flash (`#FFB347`), smoke wisp | blackens and burns out | scorch ring; crater for meteors | ash and embers fall over the polygon, then a scorch texture |
| nature | G | splinters, leaves, thorn spikes | impaled on thorns | thorns 2 s, leaf litter | brambles sweep across the polygon |
| cold | U (M2) | ice shards | freezes, then shatters | rime | sleet, then a frost rim on the borders |
| holy | W (M2) | white flare, straight rays | burns white from within | ash outline | rays sweep across from above |
| decay | B (M2) | green-black ooze | withers and sinks | dark stain | a stain creeps out from the center |
| physical | — | sparks or blood by material and blood type (battle design S2.9) | by death style | as the battle design | dust |

**Templates by primitive** (battle; the first effect of a spell or ability picks the
template; later effects add their marks). These are the battle design's generic templates
(S2.10) with the truth each must show.

| Primitive | Template | Primary shape | The truth it shows |
|---|---|---|---|
| `damage` single | bolt | a straight or lobbed projectile with a trail | one troop; armor piercing: a spark exits behind the target; zero damage: a grey "0" and a fizzle |
| `damage` squad | engulf | a ring under the block, the material wrapping every sprite | every troop of the group |
| `damage` area(n) | burst (n < 10) or rain (n ≥ 10) | a footprint ellipse around the struck sprites | exactly the n troops the sim chose |
| `buff` | aura | material flows from the caster to the targets; a per-stat mark (battle design S2.10) | exactly the buffed groups; the duration as a chip |
| `debuff` | curse | material clings to the targets | dissolves at `expire` |
| `heal` | restore | rising motes and "+n" on wounded sprites; cleansed curses turn into the healer's material | only the healed groups |
| `summon` | arrival | a portal by color, then the block forms | the summon's count and row |
| `fatigueDrain` | siphon | threads from the drained caster to the spell's caster | the enemy casters drained |
| `moraleShock` | terror | a shock ring; targets cower | the check that follows |
| `fieldEffect` | field | storm, fog, or a wall in the caster's color | one of each kind at a time |
| breath weapon | breath | a cone (Total War's breath shape) | the volley's targets |

**Tiers.** Levels 1 to 2 are tier 1, 3 to 4 tier 2, 5 to 6 tier 3; one more for an area of 5
or more, all friendly or all enemy groups, or a field effect; at most 3. Abilities count as
level 1, so Fear (all enemy) is tier 2; a storyboard may raise an ability to tier 2 (the
battle-start summons), never to 3. Divine is reserved for the god's own moments. The M1
spells: Ember Dart 1, Thorn Spray 1, Bark Skin 1, Bless 1; Fireball 2, Warcry 2, Blood Fury 2,
Entangle 2, Swarm 2; Pyre Storm 3, Regrowth 3. **Budgets follow the battle design** (S2.7,
S2.10, S2.14):

| | Tier 1 | Tier 2 | Tier 3 | Divine |
|---|---|---|---|---|
| Full form (short form) | ≤ 1.3 s (0.8) | ≤ 2.0 s (1.4) | ≤ 3.2 s (2.2) | ≤ 4.0 s, no short form |
| Brief form (battle design S2.7: from a caster's third cast of the same spell, below level 3, killing fewer than 3) | 0.5 s | 0.5 s | — | — |
| Particles at High (Medium ×0.5, Low ×0.2, reduced motion ×0.3) | ≤ 80 | ≤ 160 | ≤ 300 per burst, ≤ 500 at once | ≤ 600 |
| Full-scene flash | only at level ≥ 3: 0.15 at release (Full), 0.07 (Soft), none under reduced motion | same | same | ≤ 0.35, through the limiter |
| Shake (trauma) | ≤ 0.05 | ≤ 0.30 | ≤ 0.70 in total | ≤ 0.60 |
| Filters (full-view passes: ≤ 2 High, ≤ 1 Medium, 0 Low) | none | shockwave on explosions, High only | shockwave, heat shimmer, world grade | grade, desaturation |
| Camera | none | none | push ≤ 1.12 | push 1.25, slow motion 0.2× |

### C.2 Fitting the battle design

The battle design builds one timeline of cues in story milliseconds (S2.11). This spec adds
no cue kind. It adds content, one stored event, and the amendments below.

- **`SpellLookDef`** in `src/content/presentation/looks/spells.ts`, keyed by spell id **and by
  ability id**: template, tier, particle presets per beat, decal kinds, sound recipe ids, and
  an optional storyboard override. `spellLookFor(id)` derives a default from the effects when
  no entry exists (the battle design's fallbacks, S2.2).
- **Cues used**, all from S2.11: `spellBeat` (charge, release, travel, impact, linger; forms
  full, short, brief), `burst`, `flash`, `camera`, `floater`, `chip`, `aura` and `auraEnd`,
  `material`, `spawn`, decals, `slows` and `holds`.
- **Abilities** arrive as the stored event `ability` (N1). The script builder treats it as a
  cast with no fatigue and no mana bead. No M1 ability fires twice in a battle, so abilities
  always play their full form.
- **Persistent marks** (blessing rings, the god's aura, Avatar) are `aura` cues at the intro,
  folded into keyframes, so seeking stays exact.
- **New particle presets** (`content/presentation/particles.ts`): `ember.gather`,
  `ember.vortex`, `loam.motes`, `loam.leaves`, `loam.petals`, `loam.dirt`, `radiance.motes`,
  `umbra.ripple` (multiply), `pip.motes.<color>` (five).

**Amendments the battle track must accept** (each lands in the commit named):

| # | Battle design section | Amendment | Lands in |
|---|---|---|---|
| 1 | S1.2 event union | add `{ kind: 'ability'; unit: BattleUnitRef; ability: string; targets: BattleUnitRef[] }`; every exhaustive switch handles it: `foldReplay` (`case 'ability': break;`), `buildScript` (it opens a `SpellBeat` with `ability: true`, `fatigue: 0`), the sound cue map (as a cast of the ability's `color`, or of its template's look when null), the ticker and report ("Primordial: Fear") | 6b.2 |
| 2 | S1.2 A2 | `attacks` counts every swing of a multi-strike weapon; a weapon's swings are consecutive in the detail stream | 6b.2 |
| 3 | S1.2 A3, S1.3 | a burn logs one `damage` per striker group and element, `by` the largest contributing shield group of that element; the detail `burn` event gains `element` | 6b.2 |
| 4 | S1 types and S1.5 record | `CombatStats.fireShield` becomes `shields`; `CombatStats` gains `size` and `spellPower`; `BattleSquadSetup` gains `bound?`; `BattleCommanderSetup` gains `abilities`; `CommanderSetupRecord` is `Omit<BattleCommanderSetup, 'spells' \| 'abilities'> & { spells: string[]; abilities: string[] }`, and `fromSetupRecord` resolves ability ids and throws on an unknown one | 6b.2 |
| 5 | S1.4 morale helpers | unchanged (`mustCheck`, `breakThreshold`, `fearless`); `moralePhase` skips bound squads when it collects `brokeNow` (N5) | 6b.2 |
| 6 | S1.9 goldens and fixtures | no golden changes (no fixture has an ability, a strike count, spell power, a second shield element or a bound squad below morale 50); new named fixtures `primordialFear`, `pyreLordKindle`, `hunterCall`, `trample`, `twoShields`, `spellPower`, `boundWolves` | 6b.2 |
| 7 | S2.2 looks | `Archetype` gains the ten new chassis ids (its pattern: one archetype per pretender body); the unit-look rows of A.4; no new rig, motion, material, voice or death style | Phase 10 |
| 8 | S2.7 beats | an ability that summons is a summon beat (weight 7); Fear weighs 6, as a level-3 spell | Phase 10 |
| 9 | S2.8 god death | plays for every chassis; the body falls by the chassis's death style (A.4) and dissolves into its dominant color; no per-chassis choreography beyond the six S2.8 already lists | Phase 10 |
| 10 | S2.10 Swarm | "200 hornets" becomes "240 hornet dots (12 per sprite × 20)" | Phase 10 |
| 11 | S2.14 reduced motion | its list says "no full-scene flashes" while its flash paragraph says "reduced motion caps it at 0.12"; this spec follows the list, and the battle track deletes the cap sentence | Phase 10 |
| 12 | S2.8, S2.9, docs/09 "Wound" | the red hit tint gets a named color that passes the linear rule: `#D0605A` (0.742) is offered; `#C8504A` scores 0.795 (no margin) and `#E0503A` 0.859 (fails) | Phase 10 |
| 13 | S4.4 `PartSet` | `PartId` gains `horns`, `back`, `face`, `base`; `build(unit, look, palette, variants?: PartVariants)` takes an optional fourth argument (existing callers unchanged); `rig.ts` adds a closed-form `portrait` pose per rig with three anchor-offset variants (B.5) | Phase 10 |
| 14 | S4.4, S6.2 portraits | chassis portraits are the rig in its `portrait` pose with the pretender's variants and the detail layer (B.8), not 128 × 128 SVGs | Phase 10 (procedural), Phase 11 (SVG) |
| 15 | S4 aura pool | the god's aura and blessing rings count against the aura pool | Phase 10 |
| 16 | S3.3 bank | three new recipes (C.6) join the S3b families; captions for them | Phase 10 (S3b) |

```ts
// The PartSet amendment (#13)
export interface PartVariants {
  /** Resolved overlay textures per anchor part, from the god's look; absent: variant 0. */
  parts: Partial<Record<PartId, string>>;
  markings: MarkingId; accent: number; material: number; metal: number;
  sliders: Partial<Record<SliderId, number>>;
  /** Draw the portrait detail layer (targets of 128 px or more). */
  detail: boolean;
}
build(unit: UnitTypeId, look: UnitLook, palette: SidePalette, variants?: PartVariants): RigTextures;
```

### C.3 The eleven M1 battle spells

Durations and trauma equal the battle design's S2.10; this section adds the layers, sound and
reduced-motion detail. Times are story ms at 1x, full form; the short form halves the charge
and trims the linger. "RM" is reduced motion (battle design S2.14: no shake, camera moves,
hit-stop, slow motion or full-scene flash; particles ×0.3; projectiles still fly).

**Ember Dart** (R, level 1, tier 1, bolt; 900 ms, short 600)
- Beats: charge 0–350 (24 embers gather at the staff tip, flame glyph above the caster);
  release 350–400 (a 40 wu ring, 4 wu recoil); travel 400–600 (a flame bead, flat streak, 60
  wu trail); impact 600–680 (a two-frame white core, 16 sparks; armor piercing: a spark exits
  behind the target); linger 680–900 (6 smoke wisps).
- Particles ≤ 50. Light: additive bead and core. Screen: trauma 0.03; no flash. Decal: a 12
  wu scorch dot; a kill burns out.
- Sound: `spell.R.charge` from its offset, `spell.R.release` −3 dB, `dart.flame.fly`,
  `hit.burn`; a kill adds `elem.fire.ignite` and a burning cry.
- RM: the bead flies without trail flicker; sparks ×0.3.

**Fireball** (R, level 2, area 5, tier 2, burst; 1900 ms, short 1300)
- Beats: charge 0–700 (an orb grows from 4 to 14 wu at the staff; 60 embers spiral in;
  footprint ellipses under the 5 struck troops for the last 250 ms); release 700–760 (a 60 wu
  ring, 6 wu recoil); travel 760–1310 (a lob with a 120 wu apex, a 90 wu rope trail, 20
  trailing sparks); impact 1310–1450 (a white core for 2 frames; a 140 wu ground ring; 40
  embers, 30 sparks, 20 smoke); linger 1450–1900 (embers rise 1.5 s; smoke 2 s under the next
  cues).
- Particles ≤ 150. Distortion: a shockwave of radius 140 wu (High only; else an expanding
  ground ellipse sprite); heat shimmer over the scorch for 1.5 s (High only). Screen: trauma
  0.30; no full-scene flash (level 2). Decal: a 120 wu scorch. Kills are thrown and burn out.
- Sound: `spell.R.charge` (0.7 s), `spell.R.release`, `spell.R.travel` for the lob,
  `spell.R.burst` at the center with its duck, `hit.burn` per sprite, cries,
  `spell.R.linger` for 2 s.
- RM: no shockwave (the ellipse), no shimmer, no shake; the orb still lobs.

**Warcry** (R, level 2, all friendly, tier 2, aura; 1300 ms)
- Beats: charge 0–300 (the caster swells ×1.04; a carried-mana bead with the flame glyph leaves
  its mana chip); release 300–360 (an orange ripple ring); travel 360–960 (a ground band
  crosses its own side; each squad's weapons rise and banners flare as it passes); impact:
  "+2 MOR" chips staggered with the band; linger 960–1300 (40 ember flecks rise from banners).
- Particles ≤ 60. Mark: banner glow (morale buff) for the battle. No trauma, no flash.
- Sound: the caster's `vox.shout`, `chant.<nation>` (level by troops), `drum.<nation>`,
  `spell.R.buff` −8 dB.
- RM: the band fades in over 200 ms without sweeping; chips unchanged.

**Blood Fury** (R, level 3, one squad, tier 2, aura; 1400 ms)
- Beats: charge 0–400 (three tendrils, rope, flow from the caster to the squad); release
  400–460 (full-scene flash 0.15 in `#FFB347`); impact 460–900 (veins rise over the sprites);
  linger 900–1400 (the veins pulse at 1.2 Hz in `#B8605A`, linear ratio 0.686, for the battle;
  chip "+2 ATT +3 STR −2 DEF", the last in the bad tone).
- Particles ≤ 40: warm motes in `#FD6533` and `#7A1E12`. They are particles, not a flash or a
  tint, so the red rule does not bind them; the flash and the vein pulse use passing colors.
- Sound: `heartbeat` twice as a pre-roll 0.6 s before the release, `fury.swell` on the squad,
  `spell.R.buff` −6 dB.
- RM: no flash; the veins hold still.

**Pyre Storm** (R, level 5, area 12, tier 3, rain; 3200 ms, short 2200)
- Beats: charge 0–1300 (the world dims 30% through the world `ColorMatrixFilter`; a
  200-particle vortex gathers above the target row; camera push to 1.12×; footprint ellipses
  under the 12 struck troops for the last 250 ms; carried-mana bead); release 1300–1360
  (full-scene flash 0.15 in `#FFB347`); impacts at 1600 + 90k ms for k = 0 to 11 (each a 120
  wu meteor streak with an 8-particle trail, then a 24-particle burst and a 30 wu crater);
  slow motion 0.6× over the first three impacts; linger 2590–3200 (burning patches, 60 rising
  embers; burning ground 4 s under the next cues).
- Particles ≤ 500 at once. Distortion: a shockwave on the first and last meteor (High); heat
  shimmer over the burning ground (High). Screen: trauma 0.12 per meteor, 0.70 in total.
- Sound: `spell.R.charge` (1.3 s) with `charge.rumble` −6 dB under it, `spell.R.release`,
  `meteor.whistle` 0.25 s before each impact, `explosion.small` at each impact (at most 6 at
  once), `spell.R.linger` at two points.
- RM: a static vignette replaces the dim ramp; no camera, slow motion, flash or shake; meteors
  still fall, without trails.

**Thorn Spray** (G, level 1, area 3, tier 1, burst; 1200 ms, short 800)
- Beats: charge 0–350 (green motes spread from the caster's feet along the ground; leaf
  glyph); release 350–400 (a ground ring); travel 400–700 (a crack runs along the ground to the
  target row: a rope with a crack texture on the ground plane); impact 700–850 (thorn spikes
  erupt under the 3 struck troops, growing with overshoot; 12 splinters and 12 leaves); linger
  850–1200.
- Particles ≤ 60. Normal blend (matter). Screen: trauma 0.03. Decals: thorns stay 2 s, leaf
  litter. Kills are impaled.
- Sound: `spell.G.charge` (0.35 s), `spell.G.travel` for the crack, `thorns.erupt` under each
  struck sprite, flesh layers.
- RM: the crack fades in without running; the spikes appear without overshoot.

**Bark Skin** (G, level 2, one squad, tier 1, aura; 1200 ms)
- Beats: charge 0–300 (a 16-leaf spiral at the caster); release 300–340; travel 340–500
  (leaves drift along the ground to the squad); impact 500–1100 (bark creeps up the sprites by
  a mask wipe from the feet); linger 1100–1200 (chip "+3 PROT").
- Particles ≤ 40. Mark: a plating overlay in bark; the squad's material becomes bark, so
  deflections now throw wood chips (battle design S2.2).
- Sound: `spell.G.charge` short, `bark.grow`; deflections on the squad play `arm.bark`.
- RM: the bark fades in over 200 ms.

**Entangle** (G, level 3, one enemy squad, tier 2, curse; 1400 ms)
- Beats: charge 0–450 (earth cracks spread from the caster); release 450–510 (full-scene flash
  0.15 in `#A6D96A`); travel 510–800 (a crack runs to the target block); impact 800–1100 (roots
  burst and coil up the sprites as rope vines; chip "−3 DEF −1 ATT" with a 5-round countdown);
  linger 1100–1400 (stance `entangled`: lunges halved).
- At `expire`: the vines brown and fall in 600 ms (`auraEnd`).
- Particles ≤ 40 (dirt, leaves). Decal: root scars.
- Sound: `spell.G.charge`, `roots.burst`, two or three `vox.effort` from the struggling block;
  at `expire`, `expire.soft` and a short `spell.G.curse` tail −10 dB.
- RM: no flash; the vines hold still; the wither is a fade.

**Swarm** (G, level 4, summon, tier 2, arrival; 1800 ms)
- Beats: charge 0–600 (buzzing swells; a ground hum; carried-mana bead); release 600–700 (the
  ground splits: a 60 wu crack decal, an earth ring; full-scene flash 0.15 in `#A6D96A`);
  impact 700–1500 (240 hornet dots, 12 per sprite × 20 sprites, boil out of the crack on
  closed-form swirls and settle into the block); linger 1500–1800 (badge "20").
- Effect particles ≤ 40 (dirt). The 240 dots are the swarm rig's own (battle design S4.4: 12
  per sprite), not effect particles. Trauma 0.10.
- Sound: `spell.G.charge`, `swarm.erupt`, then the `buzz.swarm` loop bound to the squad.
- RM: no flash; the dots fade in at their places over 300 ms.

**Regrowth** (G, level 5, all friendly squads, tier 3, restore; 2000 ms)
- Beats: charge 0–800 (soil light wells up under the caster; 60 green-gold motes rise slowly;
  the world brightens 8% through the world grade; carried-mana bead); release 800–860
  (full-scene flash 0.15 in `#A6D96A`); travel 860–1660 (a green band crosses its side;
  flowers sprout as it passes); impact as the band reaches each squad ("+n" floaters; curses
  dissolve into petals, 20 per cleansed squad); linger 1660–2000 (petals drift).
- Particles ≤ 300 (motes, petals). Decal: flowers. Heal light: the only glowing Loam effect.
- Sound: `spell.G.charge` (0.8 s), `spell.G.heal` as the band passes, `regen.tick` per healed
  squad (at most 4).
- RM: no brightening ramp (a static tint), no flash; the band fades in; flowers appear.

**Bless** (holy, priests, tier 1, aura; 1000 ms, short 600)
- Beats: charge 0–300 (a sun disc over the priest); release 300–340 (the bell); travel
  340–540 (a column of gold light descends on the squad: additive trapezoid quads with a
  vertical gradient); impact 540–700 (a gold halo ring on the ground); linger 700–1000 (chip
  "+1 MOR"; banner glow mark).
- Particles ≤ 30. Decal: a gilded ring fading over 2 s.
- Sound: `bless.chime` (full the first time a priest blesses in a battle, then the bell alone).
- RM: the column without flicker.

### C.4 Rituals on the map

The battle design covers battles only, so the map gets its own small pipeline, pure like the
battle one:

```ts
// src/present/map/fx.ts (pure; guarded with src/present)
export type MapTemplate =
  | 'channel' | 'stream' | 'portal' | 'wash' | 'stitch' | 'blight' | 'rainOver'
  | 'eye' | 'kindle' | 'flow' | 'fizzle' | 'awaken' | 'reform' | 'anoint' | 'flip';
export interface MapCue {
  key: string;                       // message id plus role: stable, seeds every random choice
  template: MapTemplate;
  province: ProvinceId; to: ProvinceId | null;
  color: Color | 'holy'; spell: string | null;
  tier: 1 | 2 | 3 | 'divine';
  /** Real milliseconds, full form. */
  dur: number;
  card: { title: string; subtitle: string; sigil: boolean } | null;
}
export interface MapMark {           // persistent, while a province effect lasts
  province: ProvinceId; kind: 'badge' | 'overlay' | 'border'; spell: string; color: Color; untilDay: number;
}
export function planMapFx(newMessages: readonly Message[], state: GameState, viewer: NationId,
  view: { speed: 0 | 1 | 2 | 3 | 4; reducedMotion: boolean }): MapCue[];
export function mapMarks(state: GameState, viewer: NationId): MapMark[];   // from provinceEffects within vision
```

- **One optional sim addition** (Phase 8): `Message.fx?: { kind: 'ritual' | 'awaken' |
  'reform' | 'anoint' | 'summon'; spell?: string }`, set by rituals, the pretender's arrival
  and reform, `makeProphet` and the monthly summon. And when a ritual completes on a province
  another nation owns and has `remoteDamage`, a negative `provincePop`, a positive
  `provinceUnrest` or a negative `provinceSupply`, that owner gets a `ritual` message ("Ash
  Rain struck Ember Ford."). Deterministic; no outcome changes. The state hash changes, so the
  determinism fixtures are regenerated in that commit, and the rule is recorded in `docs/02`.
- **Time**: map effects play in real time, independent of game speed. At speeds 3 and 4 they
  use a brief form (40% of the duration, no card). While paused, they play.
- **Vision**: the caster's nation sees its own; a rival sees an effect only in provinces it
  can see (`visionOf`), and never a target or a name before the ritual lands. Victims see
  hostile rituals through the new message.
- **Channeling**: a rotating ground sigil under the caster's marker (the mana symbol at the
  center, the god's sigil three times on the rim) and a progress ring `1 − daysLeft/castDays`.
  For a targeted ritual, a stream (a rope with a scrolling dash texture) runs along the path to
  the target, for the caster's nation only. Rivals who see the caster see the sigil only.
- **Fizzle**: the sigil cracks and fades in a grey puff (0.8 s).

| Ritual | Template, tier | Full form | What plays | What stays while it lasts | RM |
|---|---|---|---|---|---|
| Call Fire Sprites (R1) | portal, 1 | 1.6 s | a ring of fire on the ground (60 embers); five sprites flare out and settle into the army badge, whose count ticks +5 | — | the ring fades in; the badge ticks |
| Forge of Cinders (R2) | wash, 1 | 1.8 s | ember light blooms at the fort icon; 30 anvil sparks; a warm wash at 0.15 alpha over the polygon | an ember glyph on the fort with a months ring (6) | a static bloom |
| Burn the Fields (R3) | blight, 2 | 2.4 s | a jagged flame front, masked to the polygon, sweeps in from the caster's side; three smoke columns; floaters "−6% pop", "−50% supply", "+15 unrest" | a charred-field hatch overlay for 3 months, and a badge | the overlay appears in 0.3 s; floaters |
| Bind Salamander (R4) | portal, 2 | 2.4 s | a fire fissure opens; the salamander's marker crawls out; a name card | — (its marker) | a fade-in and the card |
| Ash Rain (R6) | rainOver, 3 | 3.0 s | the polygon dims 30%; 300 ash flakes and embers fall inside it; each army marker there blinks once (white, then back) and floats "−N troops"; "+25 unrest" | an ash-grey tint fading over 30 days (presentation only), and a badge | no fall; the tint and floaters appear |
| Call of the Wild (G1) | portal, 1 | 1.6 s | the ground splits in a leaf burst (40); wolf silhouettes bound into the badge, +6 | — | a fade-in |
| Fertile Season (G2) | wash, 1 | 1.8 s | sprouts spread from the center to the borders; the fill brightens 8% | a faint green sheen and a leaf badge with a months ring (6) | the sheen appears in 0.3 s |
| Awaken Treant (G3) | portal, 2 | 2.4 s | roots heave; a sapling shoots up and becomes the Treant's marker; a name card | — | a fade-in and the card |
| Bounty of the Loam (G4) | wash, 1 | 1.8 s | a golden wheat shimmer ripples across the polygon; the materials glyph pulses (≤ 3 Hz) | a wheat badge with a months ring (6) | a static shimmer |
| Rootwall (G5) | stitch, 2 | 2.0 s | thorn vines grow clockwise along the inner border | the thorn border at 0.35 alpha and a shield badge (12 months) | the border appears |

The ritual panel's target hover (UI spec 3.5) previews the template at 30% intensity on the
hovered province (research-vfx 3.11).

**Limits on the map** (each counted, so each is tested; the draft's "1 ms CPU and 1.5 ms GPU"
line could not be tested and is dropped): at most 4 cues play at once, the rest show only
their persistent mark; particles per cue ≤ 80, 150 or 300 by tier; at most 600 map effect
particles alive at once (the pool refuses more); one stencil mask per wash; persistent marks
are static textures; the map ticker stops while the replay modal is open (battle design
S6.1).

### C.5 The pretender and the prophet

**Mechanics that show** (automatic; no look can remove them).

| Mechanic | Mark | Where |
|---|---|---|
| Pips | aura motes split by pip count, each moving in its color's verb (an R4 G2 god shows rising embers and ground-hugging motes, 2 : 1); the mana-symbol row | card, preview, battle, map marker |
| A blessing color (any chosen effect of it) | a thin ground ring with that color's symbol at its front, on every blessed unit (sacreds, the prophet, the god with Avatar) | battle (from the intro), card |
| An incarnate blessing | a small crown notch on its ring; while the god is away the ring is drawn dashed (inactive) | battle, card |
| 6 pips in a color | its symbols orbit the god | card, preview, battle |
| Dominion | candle count; aura radius | card, map |
| Awakening | dormant: closed eyes, slow breath, dim aura; imprisoned: runic chains | card, preview |
| Body tags | wings, roots, flicker, embers, regeneration motes | everywhere |
| Bound squads | a thin tether line from the god's banner to each bound block in the intro | battle |

**Abilities in battle** (N1 events; cue lists in the battle design's vocabulary; full form
always, since each fires once).

| Ability | Tier, length | What plays | Sound | RM |
|---|---|---|---|---|
| Fear (Primordial) | 2, 1.2 s | the god rears; a dark multiply ripple rolls across the enemy side (a 0.6 s ground band); enemy banners droop (the morale debuff mark); "−2 MOR" chips; 40 dust motes; trauma 0.15 | `roar.primordial` (new), `shock.morale`, `crowd.murmur` on the enemy side | a 200 ms darkening; chips |
| Kindle the Host (Pyre Lord) | 2, 1.2 s | the glaive sweeps an arc of fire (a rope arc); six sprites ignite along it (`spawn` style `ember`) and form their block | `summon.sprites.ignite` (new), then the sprites' flicker loop | sprites fade in along the arc |
| Call the Hunt (Horned Hunter) | 2, 1.4 s | the god raises a horn; eight wolves bound in from its flank edge with dust (`spawn` style `step`) | `horn.hunt` (new), two `wolf.howl` | wolves fade in at the block |
| Fire and thorn shields | — (per melee phase) | sparks (fire) or splinters (nature) jump to each striker that dealt damage; "−n" | `fire.shield`; thorns: `thorns.erupt` −10 dB | unchanged |
| Regeneration | — (end of round) | green motes and "+n" | `regen.tick` −20 dB | motes ×0.3 |

**Cosmetic, the god's own** (look only; inert).
- **Idle aura**: the chosen shape (halo or motes), colored by pips, alpha ≤ 0.35 above units
  (research-vfx 2.4), counted in the battle design's aura pool.
- **First-cast flourish**: on the god's first cast in a battle, inside the charge beat only:
  sigil wheel (its sigil turns on the ground) or halo burst (a ring of its mana symbols snaps
  outward at release). At most 60 extra particles, within the tier. The god's Ember Dart is
  still tier 1 (Riot's hierarchy rule).

**Divine moments.**
- **Awakening** (a dormant god on day 330, an imprisoned one on day 1050; `docs/05`): at the
  capital, 2.5 s for its owner (divine), 1.2 s at tier 2 for rivals who see the capital. Ember:
  the ground cracks in a ring and a fire geyser rises, embers rain. Loam: the ground splits,
  roots heave, a crown of leaves bursts. M2: Radiance a sun column, Tide a waterspout, Umbra
  shadows pooling and something rising. An imprisoned god's runic chains shatter first
  (0.5 s). Then the marker appears with a name card (sigil, name, epithet, title). An edge
  pointer pulses if the capital is off-screen; the map camera never moves by itself. RM: a
  fade and the card.
- **Reform** (N8, the Ash Phoenix): where it dies, its ashes stream along the path to the
  capital (1.5 s, tier 2); on its return day a pyre ignites at the capital and the god rises
  (2.0 s, tier 2) with "Vulkra rises again". In the battle replay the god's death plays the
  battle design's god death, the body burning out; the name card adds "…and will rise again"
  when the record's state shows a return day.
- **The god falls** (battle design S2.8): slow motion 0.2× for 2.0 s, the field desaturated,
  "THE GOD FALLS", trauma 0.6; the body falls by its chassis's death style (A.4) and dissolves
  into its dominant color. The six bodies S2.8 lists keep their own falls; the ten new ones
  use their death style and no bespoke choreography in M1.
- **The bless unlock** (designer): when a color reaches 4 pips the ring forms with its symbol
  (0.9 s, silent in M1); at 6 its symbols start to orbit; an incarnate pick adds the crown
  notch; a boon pick plays a small sign (Avatar: the god's own ring lights; Sacred Spring: a
  spring glyph rises at the capital marker).

**The prophet.**
- **Anointing** (map, tier 2, 1.8 s, `Message.fx` `anoint`): a beam in the god's dominant
  color runs from the capital to the prophet's province and a halo settles on its marker; the
  badge keeps a small halo glyph.
- **In battle**: a holy halo of soft rays (Radiance palette, alpha 0.3) over the prophet, the
  nation's blessing rings (it is blessed), and its Bless casts use the Bless storyboard. Its
  death is a commander death with "The prophet has fallen" and the halo shattering.
- **Dominion**: on the monthly spread, provinces whose strength rose kindle a candle (0.4 s),
  at most 8 animated per month and the rest instant; a province whose dominating nation
  changed gets the flip pulse (a ring from the center).
- **Monthly summons** (N7): a small portal at the pretender's province, tier 1, 0.8 s.

### C.6 Sound hooks

- **Battle** (M1, the battle design's S3b families): every cue above names a recipe from its
  tables, plus three new recipes, in its S3.3 notation:

  | Id | Class | Rate (kHz) | Length (s) | Variants | Recipe |
  |---|---|---|---|---|---|
  | `summon.sprites.ignite` | spell | 32 | 1.2 | 2 | six ignitions, 120 ms apart: W > BP 800>3000 Q1.2, a/d 0.005/0.03 each; + `spell.R.release` @-6 |
  | `horn.hunt` | stinger | 32 | 1.8 | 2 | brass model, D3 gliding to A3 over 1.2 s, breathy, no drive; a 15 cent wobble |
  | `roar.primordial` | voice | 24 | 1.6 | 2 | V(f0 [55,70], u>o>a, tract 1.6, drive 4, subharmonic 0.5) + B > LP 120 rumble @-6 |

- **Designer and map**: silent in M1 (both judges, and the UI spec's ruling 19). Recipe ids
  are reserved for M2: `ui.blessUnlock`, `map.ritual.<color>.<template>`,
  `map.awaken.<color>`, `map.anoint`, `map.reform`.
- **Captions**: every ability with a sound has a caption ("[a primordial roar]", "[a hunting
  horn]", "[fire sprites ignite]"), at most one a second (battle design S3.10).

### C.7 Tests

Pure (Vitest):
1. `spellLookFor` returns a look for every spell and every ability in content; the computed
   tier matches C.1's table.
2. Each M1 spell's built timeline: beats sorted and within C.3's durations (full and short);
   particle counts within the tier; a full-scene flash only at level 3 or more; trauma within
   the tier cap; filter cues only on tier-2 explosions and tier 3.
3. Abilities: Fear yields one chip per enemy group and no second; the battle-start summons
   spawn exactly the event's count; an ability plays its full form.
4. Reduced motion: no camera, shake, slow-motion or full-scene flash cues; impacts keep their
   times (the battle design's invariant).
5. `planMapFx`: deterministic; nothing for a rival's ritual outside vision; a cue for a hostile
   ritual on the viewer's province; at most 4 at once; the brief form at speeds 3 and 4; the
   particle pool refuses a 601st particle.
6. Red flash: the helper flags `#FD6533` (0.857) first; then every `flash` cue color and every
   timed tint color in presentation content scores below 0.78 on linear values, and every
   pulse runs at 3 Hz or less.
7. Cosmetic inertness: two looks give identical cue times and strike sets; only flourish and
   aura art differ.
8. Truth: impacts on the sim's targets; a mana bead for spells with carried mana; a fizzle for
   zero damage.

Playwright (the battle design's lab, S5): a fixture per ability (`primordialFear`,
`pyreLordKindle`, `hunterCall`) and per new rule (`trample`, `twoShields`, `boundWolves`)
renders non-blank at its impact; the Pyre Storm fixture stays within the particle cap and the
filter-pass budget at High.

---

## D. The designer UI

The UI spec (3.3) gives the Pretender Design screen three columns (chassis; pips, dominion
and scales; the live summary card), steppers that print their prices from the sim, inline
validation in which every control runs `validatePretender` on the design its click would
produce (its ruling 12), one-click presets, visible Save and Load buttons, Ctrl+S and Ctrl+O
as accelerators, Enter to start and Esc to go back, an inline confirm for unspent points, and
"fits" badges on the nation's two chassis. This section keeps all of that and makes room for
eleven chassis per nation, blessings, boons, appearance and identity.

### D.1 Layout

```
1920 x 1080
+--------------------------------------------------------------------------------------------------------------+
| Cinder Horde · Design your god   [Presets v] [Random god] [<] [>]  [My Gods v] [Share code]   Guide: [on]     |
| Budget 400 + 0 = 400  [chassis 140|pips 55|dominion 90|scales 100|boons 0|   ]  385 spent · 15 left          |
|                       Bless points: R 3 of 3                                                                  |
+----------------+----------------------------------------------------------------+-----------------------------+
| BUILD          |                                                                | LIVE PREVIEW (320 x 320)    |
|  1 Body      v |   the active step                                              | [Portrait|Battle|Map]       |
|  2 Magic     v |   (Body: chassis grid; Magic: pips; Realm: dominion, scales,   | [Cast] [Showcase] [CVD]     |
|  3 Realm     v |    awakening; Blessings: menu and boons; Appearance: slots,    | backdrop [card|terrain|night]|
|  4 Blessings ! |    colors, sliders; Identity: names, myth, sigil, banner)      +-----------------------------+
|                |                                                                | PretenderCard               |
| LOOK           |                                                                |  Vulkra the Unburnt         |
|  5 Appearance  |                                                                |  Lord of Cinders · Pyre Lord|
|  6 Identity    |                                                                |  (R)(R)(R)(R)  5 candles    |
|                |                                                                |  five two-color scale bars  |
| [die] [lock]   |                                                                |  Ember Wrath                |
|  per step      |                                                                |  Arrives day 1, Kharnath    |
|                |                                                                |  "A war-god who opens every |
|                |                                                                |   battle in fire."          |
+----------------+----------------------------------------------------------------+-----------------------------+
| [Back]                 [Save design] [Save as copy] [Load design]               15 points unspent  [Start game]|
+--------------------------------------------------------------------------------------------------------------+
```

- **The rail** (220 px) lists six steps in two labeled groups, BUILD (4) and LOOK (2). Steps
  are not a wizard: any step opens with one click or its number key. Each shows a state badge:
  a check mark when valid, "!" with a tooltip when something needs attention (unspent bless
  points, a blessing removed by a later change).
- **The right column** (400 px) is always visible: the live preview over the summary card, so
  every change in any step shows at once. This is the UI spec's third column, kept.
- **1280 × 720**: the rail collapses to 56 px (numbers and glyphs, names on hover); the right
  column is 300 px with a 240 px preview over a compact card that scrolls; the step area is
  about 920 px wide.
- **New Game** (UI spec 3.2) leads here with Next; Back returns to it with the design kept.

### D.2 The six steps

1. **Body.** A grid of chassis cards (200 × 140): the composed portrait, name, cost, base pips
   as mana symbols, base dominion candles, the role badge, "fits Cinder Horde" on the
   nation's two, "must sleep" on the Primordial, and the new-color price. Every card also
   prints **"Your build on this body: 365 / 400"**: the current pips, dominion, scales,
   blessings and boons priced on that chassis by `designCost`, or the first reason
   `validatePretender` gives. Dominions players needed an outside calculator for this
   ([pretenders calculator](https://github.com/zollqir/pretenders-dom6)). Filters: role chips;
   sort by cost or by fit. Hover (L1): body stats, weapons and abilities in words. Choosing a
   chassis keeps the build where it can: pips and dominion rise to its base, an invalid boon
   or breath is dropped, unaffordable blessings are removed, and a toast names each change
   ("Flaming Weapons removed: needs R5"), with Undo.
2. **Magic.** Five pip rows with the UI spec's steppers (`[−] ●●●●○○ [+35]`, a lock glyph on
   base pips, "+80 new color" priced by the chassis). Each row prints at L0 what it buys:
   "Casts Ember Dart, Fireball (research 2), Blood Fury (research 3)" and "+3 Red bless
   points". W, U and B rows say "Blessings only in this version" (A.6). The Oracle prints its
   research rate.
3. **Realm.** The dominion stepper (+30) with "spreads to about N provinces by Year 2"; the
   five scale sliders with tick prices, where an attuned pole shows the chassis glyph and its
   price of 20 ("attuned"); the three awakening cards with arrival dates and refunds; cards
   below a chassis's minimum are disabled with the reason.
4. **Blessings and boons.** One bless-point meter per color with pips ("Red 3 of 3") and a
   **Recommended** button. One row per color; effect cards grouped by requirement (2, 3, 4, 5,
   6), each with its name, cost as dots, one effect line, its group as a small label ("one
   regeneration blessing"), an incarnate crown glyph (tooltip: "Works only while your god is
   on the map: from day 330 for a dormant god") and a scale chip when it needs one.
   Unaffordable or locked cards stay visible with their reason (UI spec rule 7). Below, the
   two boon cards with cost and effect; a built-in boon shows "included".
5. **Appearance.** Thumbnail strips per slot with arrows (not dropdowns); hover previews live;
   each slot has a die and a lock. Then markings, the three swatch rows, sliders, pose (3),
   aura (2) and flourish (2) with a Play button, and the breath color on breath chassis
   (mana-symbol radio buttons, only colors with pips).
6. **Identity.** Name, epithet and title fields, each with a die and a symbol counter; a field
   refuses symbols outside the identity alphabet as they are typed, with the reason under it;
   pronoun; the myth, generated, with Edit to override (a byte counter, "280 bytes") and Reset;
   the sigil (a frame strip and a 16-charge grid) and the banner division strip, previewed on
   an army badge and a battle pennant.

### D.3 The preview and the card

- **Preview**: a small Pixi canvas that runs the battle renderer's own drawing code (battle
  design S4), so the designer and the replay never disagree. Idle by default; **Cast** plays
  the god's flourish and a tier-1 bolt in its dominant color; **Showcase** loops idle,
  flourish, signature ability and cast; contexts Portrait (256), Battle (64 on a strip of
  terrain) and Map marker (a badge with the sigil). Backdrop: card, home terrain, night.
  **CVD** cycles the simulated protanopia, deuteranopia and tritanopia. The bless unlock
  (C.5) plays when a color reaches 4. Reduced motion follows the settings; Showcase is then
  off by default. The preview is silent in M1.
- **Card**: the UI spec's `PretenderCard`, extended with the name and title, the sigil, the
  chosen blessings (incarnate ones marked) and the boons. It is the same component in the top
  bar's nation tooltip, the Ledger's Nations tab and the victory screen. Its text is the
  preview's screen-reader equivalent.

### D.4 Presets, random, My Gods, share code

- **Presets**: a gallery popover of the nation's six, each with a mini portrait, cost and
  reading; one click applies build, look and identity; a "keep my look" checkbox sits at its
  top. Undo (Ctrl+Z) restores the previous god from the designer's own edit history (D.7).
- **Random god** and **Back / Forward** (10 rolls); the seed is in the tooltip. Each step and
  slot has its own die and lock; a die on a BUILD step rerolls only that step within budget.
- **My Gods**: Load, Save (in place), Save as copy, Rename, Delete (inline confirm). The UI
  spec's visible "Save design" and "Load design" buttons stay; they act on My Gods.
- **Share code**: a popover with the code in a read-only field and Copy, and a "Paste a code"
  field with Import; a refused code shows its reason inline. Import opens the god as unsaved.

### D.5 Where each detail lives

| Detail | Layer |
|---|---|
| Budget, points left, bless points per color | L0 header bars |
| Spend by category | L1 on the budget bar segments |
| Chassis cost, base pips and dominion, role, "your build on this body" | L0 on the card |
| Body stats, weapons, abilities in words | L1 card hover; L4 Codex chassis page |
| Next-step price of every stepper and slider tick | L0 |
| What a pip level unlocks (spells, research, bless points) | L0 line on the row; L1 full list |
| Scale step effects | L0 summary line; L1 tick hover |
| Blessing effect, cost, group, incarnate meaning | L0 card line; L1 full text and the incarnate rule; L2 terms Sacred, Incarnate, Bless point |
| Why a control or card is disabled | L1, the reason from `validatePretender` |
| How the god looks in battle and on the map | L0 preview contexts |
| Share code | L3 popover |

### D.6 Keyboard and accessibility

- From the UI spec: Ctrl+S saves and Ctrl+O loads (accelerators for the visible buttons);
  Enter starts the game (with the unspent-points confirm); Esc goes back.
- Added: `1` to `6` open the steps; `R` rolls a random god and `Shift+R` a random look
  (outside text fields); `[` and `]` walk the roll history; `C` plays Cast. Browser-reserved
  keys are not used (UI spec 5.4). Every key has a visible button.
- Every color shows its mana symbol and letter; incarnate, attuned and fits marks are glyphs
  with words; the preview has a text equivalent; reduced motion and the flash limiter apply
  to the preview.

### D.7 Deviations from the UI spec (3.3)

| UI spec 3.3 | This spec | Why |
|---|---|---|
| Three columns on one screen | A step rail, one step area, and the persistent preview and card (the third column, kept) | eleven chassis, a blessing menu, boons, appearance and identity do not fit one screen at 1280 × 720. A full screen may exceed the 4-tab limit, which binds dock panels (UI spec 1.1) |
| Chassis list in the left column | Step 1, a filterable grid with "your build on this body" | the reverse search the Dominions community built outside the game |
| Save design and Load design | the same visible buttons, acting on My Gods, plus Save as copy | AoW4's edits-that-did-not-stick lesson |
| The bless line at 4 and 6 pips | Step 4, the blessing menu with today's bless as its default | A.6 |
| No appearance or identity | Steps 5 and 6, the share code, random | B |
| `PretenderCard` | gains name, title, sigil, blessings, boons | B.6, B.7 |
| UI spec 5.7: no undo in M1 | the designer keeps a local edit history (the last 20 gods) for Undo after a chassis change or a preset | the UI spec rules out undo because it would rewrite the sim's command log; a design is edited before any game exists, so its history is plain UI state |

Everything else in 3.3 is kept: prices from the sim on every control, per-click
`validatePretender`, the unspent-points confirm, the dominion estimate, arrival dates on the
awakening cards, the "fits" badges, and the summary card reused across screens.

---

## E. Plan

### E.1 What lands in which phase

Each step ends with `npm run typecheck && npm run lint && npm test` green, a `docs/PROGRESS.md`
entry, and a commit whose message starts with its phase name. Each commit lands the "Docs
text" below that it implements.

| Phase | Deliverable | Main files | Tests |
|---|---|---|---|
| **6b.1** (now; touches neither Phase 7's `src/ai` nor the battle track's `src/sim/battle` files except `setup.ts`, which S1 does not edit) | D1 realms, D2 new-color price, D3 attunement, D4 minimum awakening, D5 springs (`ProvinceState.extraSprings`), D7 name (`NationState.pretenderName`), D8 role, `aiPower` on the six existing chassis; the blessing menu (per-color points, groups, today's bless as its default) and its folds, except Thornhide, which waits for N4; the Sacred Spring and Avatar boons; the `STATE_VERSION` step with its migration | `content/pretenders/{chassis,costs,types,blessings,boons}.ts`, `content/rules.ts`, `sim/{pretender,bless,createGame,selectors,types}.ts`, `sim/battle/setup.ts` | `validate.chassis`, `validate.pretender`, `bless` (the 16,807-vector default check), `pretender`, `createGame`, `selectors`, the migration; every existing preset unchanged |
| **6b.2** (after the battle track's S1, which also edits `src/sim/battle`) | N1 abilities, the `ability` event and the `EffectSource` refactor; N2 multi-strike and `CombatStats.size`; N3 spell power; N4 shields and Thornhide; N5 bound squads; the battle-design amendments 1 to 6 (C.2) | `content/{types,abilities}.ts`, `content/spells/{types,validate}.ts`, `sim/battle/{abilities,attacks,effects,morale,resolve,setup,spells,types,events,field,replay,rerun,record}.ts` | each rule's tests (A.5); S1's golden and equivalence tests unchanged; the existing tests named in N4 updated |
| **6b.3** | N7 monthly summon; N8 reform for the Ash Phoenix; the ten new chassis with bodies and abilities; six new presets; content fixtures for every new chassis and ability (CLAUDE.md); `sim:aivai --presets` and `--matrix`; `sim:duel` with its bands and `--calibrate`; `docs/08` step 10 by role (after Phase 7 merges) | `content/units/pretenders.ts`, `content/pretenders/{chassis,presets}.ts`, `sim/{tick,commanders,pretender}.ts`, `ai/*` (step 10 only), `scripts/{aivai,duel}.ts` | presets within budget; summon and reform tests; duel bands; the `aiPower` calibration check; determinism over 365 days with each new preset |
| **7** (in progress elsewhere) | unchanged: AI nations keep the default presets | `src/ai/*` | its behavior tests |
| **8** | Map effect basics: the dominion candle and flip pulse, the channeling sigil and stream, a generic completion pulse per color with its symbol, the map effect pool and its limits; `Message.fx` and the victim message; `aiPower` joins `armyPower` when the UI spec moves it into the sim | `src/present/map/fx.ts`, `src/render/map/fx/*`, `sim/{rituals,messages}.ts`, the sim's `armyPower` | `planMapFx` tests; regenerated determinism fixtures |
| **9** | The designer (six steps, preview on procedural parts, `PretenderCard` extended); the look, identity and nation-look model with `validateLook`; code tables and the share code; random god and look with history and locks; My Gods; `uiSave.gods`; AI looks at New Game | `src/ui/pretender/*`, `src/content/looks/*`, `src/present/looks/*`, `src/ui/persistence/*` | B.12; UI smoke |
| **10** (battle track S2 to S6) | `SpellLookDef` for every spell and ability; the eleven storyboards with C.3's detail; ability cues; blessing rings; the god's aura and first-cast flourish; the battle-design amendments 7 to 16 (C.2); procedural placeholder parts for the ten new chassis on existing rigs and one parametric function per slot family; the three new recipes; lab fixtures | `src/content/presentation/*`, `src/present/battle/*`, `src/render/battle/*`, `src/render/parts/*` | C.7 |
| **11** | The 171 SVG files (B.10); final procedural markings, glyphs, auras, flourishes and divisions; the map ritual templates (C.4); divine moments (awakening per color, reform, anointing); the designer's Showcase; the contact sheet (B.12); screenshot baselines refreshed in this commit only | `src/assets/sprites/**`, `src/render/**`, `lab/looks.html` | manifest coverage, B.12 smoke, the contact-sheet run, Playwright baselines |
| **12** | The preset matrix; duel bands re-measured with the real N1 and N2; the parity and blessing-bounds snapshots reviewed; `aiPower` recalibrated; blessing and boon prices; the Ember Oracle revisit | `docs/09-balance.md` | the runs of A.10 |

Playtest checklist additions (`docs/09-balance.md`):
- Each new preset wins 35% to 65% against the opposing default over 20 headless games.
- Did any spell or ability look bigger or smaller than what it did?
- A new player can design, save, share and re-import a god in under three minutes.

### E.2 M1 and M2

| Item | M1 or M2 | Reason |
|---|---|---|
| 16 chassis (6 generic, 5 Red, 5 Green), realms, per-chassis prices, attunement, minimum awakening, springs, name, role | M1 | the owner's "good options for pretenders" for the two shipped nations; data and small rules |
| N1 (battle start), N2, N3, N4, N5, N7, N8 (Phoenix only) | M1 | each carries an M1 chassis or blessing, and each is small and tested alone |
| Blessing menu: full Red and Green, minimal White, Blue and Black | M1 | today's W, U and B blesses exist in M1, so splashes keep working |
| Boons: Sacred Spring, Avatar | M1 | design-point options in the Dominions spirit |
| Customization model, designer, random, share code, My Gods, 4 × 3 overlay slots, sigils | M1 | the owner's AoW4 direction, and Phase 9 builds the screen anyway |
| Flashy magic grammar, eleven storyboards, ability cues, map ritual templates, divine moments | M1 | the owner's "flashy magic"; the battle track already budgets the battle half |
| Living Flame, Briar King, N6, the `eachRound` trigger | M2 | both judges; they needed rules only they use |
| Iron Will, Undying as a boon, Chosen Host, Deep Lore | M2 | R3, R21a, both judges |
| Adjust appearance in game, `#god=` links, random presets for AI opponents | M2 | both judges |
| Designer, map and menu sound | M2 | the battle design's scope and the UI spec's ruling 19 |
| White, Blue and Black chassis and full blessing menus | M2 | their nations and spells are M2, and they need M2 rules |
| Awe, ethereal, life-drain bodies, shapechange, teleport, element resistances; the breath color as a design field | M2 | rules only W, U and B chassis use |
| Free color picker, 6 slots × 5 variants, a gallery, more presets, more auras and flourishes, bespoke god deaths | M2 | volume once the systems prove themselves; this is where the AoW4 level of per-slot depth is reached (B.11) |
| Chromatic aberration at the god's death | M2 or never | open question 4 |

### E.3 Cut lines, in order

1. Weapon heads to 2 variants, then Phoenix crests and Wild Spirit ruffs to 2 (B.10).
2. One aura shape and one flourish.
3. The map ritual templates beyond Phase 8's generic completion pulse (C.4 keeps its table as
   M2 content).
4. The Mother of Beasts, the Cinder Idol and N7 together (both N7 bodies; 10 chassis per
   nation remain).
5. The Ash Phoenix and N8 (the Cinder Horde keeps 9, Thornwood 10).

Never cut: realms and per-chassis prices, the blessing menu, the presets with looks, the six
designer steps, random god, the share code, N1 (it carries three chassis), N5 (it fixes a
summoner rout), and the eleven storyboards.

### E.4 Doc changes (in the commits that implement them; exact text below)

- `docs/00-vision.md`: the scope ladder's M1 and M2 rows.
- `docs/05-pretender.md`: replaced whole.
- `docs/03-nations.md`: the intro line, a pretender line per M1 nation, and the decision on
  chassis that fit.
- `docs/02-magic.md`: section 8 replaced; Implementation decisions gain abilities, spell power,
  blessing folds and `Message.fx`.
- `docs/04-battle.md`: the replay log line and a new block of Implementation decisions for N1
  to N5; the morale decision gains bound squads.
- `docs/09-art-direction.md`: "Pretender chassis art" replaced; "Pretender looks", "Sigils and
  banners", "Magic effects grammar" and "Flashes and red" added.
- `docs/10-milestone-1.md`: criteria 9 and 14; a new criterion 16; Phase 6b; notes on
  Phases 8 to 12; out of scope; liberties taken.
- `docs/08-ai.md`: step 10 and `armyPower` (short text below).
- `docs/07-ui.md` (or the UI spec's replacement of it): section D, through the UI track.
- `docs/09-balance.md`: every number of A and C, by the rows its log format asks for.

### E.5 Open questions for the owner

1. **Sign-off on the scope change.** `docs/00` puts "more pretender chassis" in M2. This spec
   moves ten new chassis, the blessing menu and the customization system into M1, because
   your direction asked for it "if it's possible". The measurements and cut lines say it is
   possible; it adds Phase 6b and work to Phases 8 to 12. Approve, or name what to cut first
   (E.3).
2. **Realms**: color chassis only for nations of that color (recommended), or every chassis
   open to every nation?
3. **Is the god blessed in its own dominion by default**, as in Dominions, or only through
   Avatar (recommended for M1)?
4. **Chromatic aberration** at the god's death (recommended no).
5. **Iron Will** (a god that never routs with its troops) measured too strong to sell for
   points (R3). In M2: a much higher price, a redesign as a morale roll, or never?
6. **Names in M1** use Latin letters only (the share code and the HUD); the myth takes any
   script. Acceptable until localization?
7. **The god's name in the sim** (recommended yes, D7).

---

## Docs text

Exact new or replacement text for the docs. Each block lands in the commit that implements
it (E.1). Every changed doc says that the owner's direction drove the change.

### `docs/00-vision.md`: replace the M1 and M2 rows of the scope ladder, and add a note under it (lands in 6b.1)

```markdown
| M1 (this scope) | Solo skirmish, one generated map, two mono-color nations (Red and Green), 12 units each, 10 spells per shipped color, pretender design with 16 chassis (11 per nation), a blessing menu and appearance customization, dominion, Wellsprings victory, simple AI, placeholder art with animations, save/load. |
| M2 | Remaining three mono nations (White, Blue, Black) with their 30 spells, their pretender chassis and blessing menus, forts, events, deeper pretender customization (more slots and variants, a color picker), balance pass. |
```

```markdown
The pretender's M1 scope grew on 2026-10-21 at the owner's direction: "I think flashy magic
effects is always interesting and good options for pretenders like Dominions has is always a
highlight. If it's possible. A customization level matching Age of Wonders 4 would be very
ideal." Ten new chassis, the blessing menu and the customization system moved from M2 into
M1 (Phase 6b and additions to Phases 8 to 12 in `docs/10-milestone-1.md`); the per-slot depth
that matches Age of Wonders 4 arrives in M2.
```

### `docs/05-pretender.md`: replace the whole file (lands in 6b.1, the rows of later rules with their commits)

````markdown
# Pretender Design

The pretender is the player's avatar and the single most expressive decision before a
match. The screen should feel like building an MTG commander: choose a body, pour color
into it, set the five Scales that describe the world you want to rule, pick its blessings,
and give it a face and a name.

This document was rewritten on 2026-10-21 at the owner's direction: "good options for
pretenders like Dominions has is always a highlight ... A customization level matching Age of
Wonders 4 would be very ideal." The chassis roster grew from 6 to 16, blessings became a
menu, and every god got a look and an identity that never touch the rules.

## Point budget

Every nation starts with **400 design points**. Spend them on chassis, pips, dominion,
scales and boons. Awakening refunds points. Unspent points are lost. Bless points are
separate: they come from pips (Step 6). The screen shows a live budget bar and a live
summary card.

## Step 1: Chassis

A nation chooses from the **generic** chassis and from the chassis of its own colors
(its **realm**): eleven for each M1 nation. M3's two-color nations get both realms.

| Chassis | Realm | Role | Cost | Base pips | Base dominion | New color | Body | Signature |
|---------|-------|------|------|-----------|---------------|-----------|------|-----------|
| Oracle of the Flux | generic | mage | 20 | none | 1 | 40 | hp 12, prot 2, mor 14, size 2, leadership 20, Staff 2 | Pips cost 10 less each. Researches (RP as a mage). |
| Titan | generic | leader | 120 | 1 in nation color | 2 | 60 | hp 60, str 20, att 14, def 12, prot 10, mor 18, size 4, leadership 100, Great Sword 8 | Strong general. |
| Great Wyrm | generic | monster | 220 | 2 in nation color | 2 | 80 | hp 120, str 24, att 15, def 10, prot 16, mor 20, size 6, flying, Breath 12 (range 3, ammo 5), Bite 10 | The monster. Dormant start recommended by the UI. |
| Living Monolith | generic | idol | 60 | none | 4 | 50 | hp 200, prot 25, mor 50, immobile, unarmed | Dominion checks x2. Casts rituals in the capital. |
| Ascended Hero | generic | leader | 100 | 1 in nation color | 1 | 50 | hp 32, str 15, att 15, def 15, prot 8, mor 20, size 2, speed 3, leadership 100, Hero's Blade 7 | Avatar built in: fights blessed in its own dominion. |
| Primordial | generic | monster | 220 | 2 in nation color | 3 | 80 | hp 150, str 22, att 12, def 6, prot 14, mor 30, size 6, speed 1, Crushing Blow 11, Trample 2 (2 strikes, size 2 or less) | Must start dormant or imprisoned. Fear: −2 morale on every enemy group at battle start. |
| Ash Colossus | R | fighter | 100 | 1 R | 1 | 60 | hp 80, str 22, prot 14, size 5, Burning Fists 6 fire, fire shield 5 | Burns whoever strikes it. |
| Ash Phoenix | R | raider | 120 | 1 R | 2 | 80 | hp 50, str 14, att 15, def 16, prot 8, mor 18, size 3, speed 3, flying, leadership 40, Burning Talons 8 fire armor piercing, fire shield 5 | Reforms at the capital 90 days after dying in its own dominion. Growth steps cost 20. |
| Pyre Lord | R | summoner | 140 | 2 R | 2 | 60 | hp 55, str 18, att 13, def 12, prot 8, mor 18, size 4, leadership 80, Flaming Glaive 7 fire | Kindle the Host: 6 Fire Sprites join it at battle start. |
| Cinder Idol | R | idol | 110 | 2 R | 4 | 50 | hp 180, str 14, def 6, prot 22, mor 50, size 6, immobile, unarmed, leadership 40 | 2 Fire Sprites join it each month (up to 20 in the nation). Dread steps cost 20. |
| Ember Hierophant | R | mage | 60 | 2 R | 1 | 40 | hp 14, def 11, prot 2, mor 14, size 2, leadership 30, Staff 2 | Spell power 3: its damage spells hit 3 harder. Does not research. |
| Wild Spirit | G | raider | 80 | 1 G | 2 | 80 | hp 30, def 16, prot 4, size 2, stealthy, regeneration 10%, Claws 5 | Hard to catch. |
| World Tree | G | idol | 150 | 2 G | 4 | 50 | hp 250, str 20, def 4, prot 20, mor 50, size 6, immobile, regeneration 10%, leadership 40, Lashing Boughs 8 | One more Green spring at the capital. Sanctity steps cost 20. |
| Horned Hunter | G | summoner | 140 | 2 G | 2 | 60 | hp 60, str 18, att 14, def 13, prot 6, mor 18, size 4, speed 3, leadership 60, Hunting Spear 7 | Call the Hunt: 8 Wolves join it at battle start. Fury steps cost 20. |
| Elder Wyrm | G | monster | 190 | 1 G | 2 | 80 | hp 130, str 21, att 12, def 8, prot 12, mor 22, size 6, speed 1, regeneration 10%, Bite 10, Trample 2 (2 strikes, size 2 or less) | Wingless: Green never flies. |
| Mother of Beasts | G | summoner | 130 | 1 G | 2 | 60 | hp 70, str 18, att 12, def 11, prot 8, mor 20, size 4, leadership 60, Maul 9 | 2 Wolves join her each month in her own dominion (up to 24 in the nation); her wolves never drag her into a rout. |

Stats the table leaves out take the baseline (`docs/03`). The UI highlights the two chassis
that fit the nation ("fits Thornwood").

## Step 2: Color pips

Pips cost increasingly per color:

| Pip level in a color | 1 | 2 | 3 | 4 | 5 | 6 |
|----------------------|---|---|---|---|---|---|
| Cost | 40 | 20 | 25 | 30 | 35 | 40 |

Opening a **new color** (the first pip in a color outside the nation's identity) costs the
chassis's new-color price instead of 40 (Step 1: 40 for seers, 50 for idols and the Ascended
Hero, 60 for titans, 80 for monsters and beasts), less the Oracle's discount. A pretender with
pips in any color can cast that color's spells and leads research in it. Pips also give bless
points (Step 6). In M1, White, Blue and Black pips buy only blessings: those colors' spells
are M2.

Design intent: a mono-color pretender reaches 4 pips for 115 points. A second color at 2 pips
costs 60 + 20 on a titan. The player sees the blessings open up live.

## Step 3: Dominion strength

Base dominion from chassis. Each additional point costs 30. Range 1 to 10. Dominion score
drives spread checks and caps dominion strength in provinces, and the Wellspring bonus adds to
it during play.

The UI shows: "Your dominion will spread to about N provinces by Year 2" using a quick
estimate (`score * 1.5` provinces).

## Step 4: Scales

Five axes, each from −3 to +3. Each axis is a pair of enemy colors. The positive pole is
listed first.

| Axis | +3 pole | −3 pole | +1 step effects | −1 step effects |
|------|---------|---------|-----------------|-----------------|
| Order (W) / Turmoil (R) | Order | Turmoil | gold +7%, unrest −2/month, recruit time +5% | unrest +2/month, recruit time −10%, random event chance +5% |
| Lore (U) / Fury (R) | Lore | Fury | research +10%, prec +1 in battles | att +1 and mor +1 in battles, research −10% |
| Growth (G) / Rot (B) | Growth | Rot | pop growth +0.3%/month, supply +10% | pop growth −0.3%/month, supply −10%, B mana from dominion tint +1 per step |
| Wild (G) / Artifice (U) | Wild | Artifice | supply +15%, beasts cost −10%, build time +15% | materials +10%, build time −15%, supply −10% |
| Sanctity (W) / Dread (B) | Sanctity | Dread | temple checks +1, sacred mor +1, temple cost −25% | enemy provinces touched by your dominion gain +2 unrest/month, undead upkeep −25%, your dominion causes −1 mor to enemies in battle per 3 strength |

Cost per step: 40 points toward a pole whose color is **not** in the nation's identity, 20
toward a pole whose color **is**, and 20 toward a pole the chassis is **attuned** to (Step 1).
Steps are bought from 0 outward, and scales never refund points. For Red, the cheap poles are
Turmoil and Fury; for Green, Growth and Wild. The UI warns when a step goes against the
nation's grain, but allows it.

Random events are **M2**. The Turmoil event chance is stored but unused in M1.

## Step 5: Awakening

| State | Refund | Arrives |
|-------|--------|---------|
| Awake | 0 | Day 1 in the capital |
| Dormant | +150 | Month 12 |
| Imprisoned | +350 | Month 36 |

The budget line reads e.g. `400 + 150 = 550`. The summary card says when the god arrives.
The Primordial must start at least dormant.

## Step 6: Blessings

Sacred units, the prophet, and a god with Avatar fight **blessed**. A blessing is chosen from
a menu, after Dominions 6.

- **Bless points** per color: pips in that color minus one (R4 gives Red 3). A color's points
  buy only its own blessings.
- **Cost** of a blessing: its requirement minus one (at least 1). Requirements run from 2 to 6
  pips, so a god exactly at a requirement can always afford one blessing of it.
- **Groups**: at most one blessing per group (for example one regeneration blessing).
- **Incarnate** blessings work only while the god is on the map: not before it awakens, not
  while it is recalled or reforming, never after it dies.
- **The default**: a design that picks nothing gets each color's standard blessing at 4 or 5
  pips and its greater one at 6, which is the fixed bless of earlier versions.

| Color | Blessings (requirement, cost; * incarnate) |
|-------|----------------------------------|
| R | Fervor (2, 1) mor +1; Keen Edge (2, 1) att +1; Ember Might (3, 2) str +2; **Ember Wrath** (4, 3) att +2 str +2; Cinder Skin (4, 3) fire shield 3; Blazing Charge (4, 3) +5 damage in the first melee round, mor +1; Fury Unbound* (5, 4, needs Fury 1) berserk, att +1; Flaming Weapons* (5, 4) melee +3 fire armor piercing; **Greater Ember Wrath** (6, 5) att +4 str +4; Living Pyre* (6, 5) fire shield 5, att +2 |
| G | Thick Skin (2, 1) prot +1; Vigor (2, 1) regeneration 5%; Strength of the Earth (3, 2) str +2; **Evergreen** (4, 3) regeneration 10%, prot +1; Oakhide (4, 3) prot +3; Deep Roots (4, 3) mor +3, prot +1; Wild Vigor* (5, 4, needs Growth 1) regeneration 20%, str +1; Thornhide* (5, 4) thorn shield 4, prot +1; **Greater Evergreen** (6, 5) regeneration 20%, prot +2; Ironbark* (6, 5) prot +5, str +2 |
| W | Resolve (2, 1) mor +1; Warding (2, 1) prot +1; **Steadfast** (4, 3) mor +2, prot +1; **Greater Steadfast** (6, 5) mor +4, prot +2 |
| U | Keen Eye (2, 1) prec +1; Wariness (2, 1) def +1; **Clear Sight** (4, 3) def +2, prec +2; **Greater Clear Sight** (6, 5) def +4, prec +4 |
| B | Cruelty (2, 1) att +1; Grim Resolve (2, 1) mor +1; **Blood Thirst** (4, 3) life drain 2, att +1; **Greater Blood Thirst** (6, 5) life drain 4, att +2 |

Bold marks the standard and greater blessings (the defaults). Full menus for White, Blue and
Black come with their nations in M2.

## Step 7: Boons

| Boon | Cost | Effect |
|------|------|--------|
| Sacred Spring | 40 | One more spring of a color the god has a pip in, at the capital. |
| Avatar | 40 | The god fights blessed in provinces its nation dominates. Built into the Ascended Hero. |

## Appearance and identity

Any look fits any build: the god's appearance (four part slots with three variants each,
markings, three colors, sliders, pose, aura and cast flourish), its name, epithet, title,
pronoun and myth, and the nation's sigil and banner division are chosen on the same screen,
saved with the god and shared by a code. None of it changes the rules, except that the name
is the pretender's name in messages and battles. The parts, colors and effects are in
`docs/09-art-direction.md`; the screen is in `docs/07-ui.md`.

## Prophet

Any commander may be made Prophet (one per nation, once every 24 months if the prophet dies).
The prophet gains holy 3, +1 mor, spreads dominion as a temple, and fights blessed.

## Summary card

The right third of the screen is a live card: the god's portrait composed from its parts and
tinted by color pips, its name and title, its sigil, the pip row as MTG-style mana symbols,
dominion candles, the scales as five small two-color bars, the chosen blessings (incarnate
ones marked) and boons, the awakening date, and the AI's one-line "reading" of the build (e.g.
"A fast, fiery god. Expect early wars."). The reading is a rule-based string.

## Presets

Each nation ships six presets so a new player can start in one click; each comes with a look
and an identity:
- Cinder Horde: *Warlord* (Titan R4, Fury 3, Turmoil 2, dominion 5, awake), *Ember Oracle*
  (Oracle R6, Fury 2, dominion 4, dormant), *Wildfire* (Ash Colossus R3, Turmoil 3, Fury 3,
  dominion 6, imprisoned), *Undying Flame* (Ash Phoenix R4, Growth 2, Fury 2, Turmoil 1,
  dominion 5, awake; Ember Wrath), *Pyre Host* (Pyre Lord R4, Fury 3, Turmoil 2, dominion 5,
  awake; Ember Wrath), *Dread Idol* (Cinder Idol R4, Dread 3, Turmoil 1, dominion 9, awake;
  Cinder Skin).
- Thornwood: *Elder Oak* (Titan G4, Growth 3, Wild 2, dominion 5, awake), *Deep Root* (Living
  Monolith G3, Growth 3, Wild 3, Sanctity 1, dominion 7, awake), *Wyrm of the Loam* (Great
  Wyrm G4, Growth 2, dominion 4, dormant), *Heartwood* (World Tree G4, Growth 3, Wild 1,
  Sanctity 1, dominion 7, awake; Deep Roots), *Hunt Lord* (Horned Hunter G4, Fury 2, Wild 2,
  Growth 3, dominion 4, awake; Oakhide), *Mother of the Pack* (Mother of Beasts G4, Growth 3,
  Wild 2, dominion 5, awake; Evergreen).

The implementer validates that each preset costs ≤ budget; if not, adjust the preset.

## Implementation decisions

- **Scale effects** are data per pole and per step (`src/content/pretenders/scales.ts`).
  Where the core rules give a formula, its effect applies in both directions as well as the
  table's: Turmoil lowers gold, Wild lowers materials, Artifice lowers supply.
- **Prophet and pretender identity** is stored once, as ids on the nation (`prophetId`,
  `pretenderId`), not as flags on commanders.
- **Wellspring scale steps** add to the owner's national scales while it holds the province.
- **Dread in battle** ("−1 mor to enemies per 3 strength"): units fighting against the
  dominating nation in a province lose 1 morale per step of the province's effective Dread
  scale. The effective scale already grows with dominion strength (`scale * strength / 10`,
  rounded), so Dread 3 at full strength costs enemies 3 morale and at strength 3 costs 1.
  Independents count as enemies.
- **Pretender pips** (Phase 5): `PretenderDesign.pips` is the pretender's whole pip set, the
  chassis's base pips included ("Titan R4" means R = 4). Blessings read it, and the pretender
  commander has the same pips, so blessings, casting, and research agree.
- **Chassis and bodies** (Phases 6 and 6b): each chassis is a record in
  `src/content/pretenders/chassis.ts` naming its body, a commander unit in
  `src/content/units/pretenders.ts`, and its realm, role, new-color price, attunement,
  minimum awakening, starting springs, monthly summon, reform, built-in Avatar and AI power,
  where it has them. Stats the table leaves out take the baseline (docs/03). Every body but
  the Living Monolith and the Cinder Idol carries a melee weapon (docs/09); those two strike
  unarmed with their strength. Bodies cannot be recruited,
  cost no upkeep, and eat as commanders do.
- **Realms** (Phase 6b, the owner's direction): `availableChassis(nation)` is the generic
  chassis plus those of the nation's colors; `validatePretender` refuses others. This replaces
  "the nation offers all chassis".
- **Costs**: a color is new when it is not in the nation's color identity; its first pip costs
  the chassis's new-color price less the Oracle's discount (the Oracle pays 30). Base pips are
  free and a design may not go below them; dominion below the chassis's base is refused. Scale
  steps are paid one by one from 0; a step toward an attuned pole costs 20. Boons add their
  cost. `validatePretender` (`src/sim/pretender.ts`) is the only place these rules live:
  `createGame` refuses an invalid design, and the presets are tested against it.
- **Awakening**: an awake pretender stands in its capital on day 0. Month 12 begins on day
  330 and Month 36 on day 1050; a dormant or imprisoned pretender arrives in its capital in
  that day's tick (step 3), or in the first later tick in which the nation holds its capital
  and is not Godless. A chassis with a minimum awakening refuses earlier ones.
- **Death and reform**: a pretender that dies is gone for good in M1; the nation plays on.
  The exception is the Ash Phoenix: when it dies in a province its nation dominates
  (strength 1 or more), `NationState.pretenderReturnDay` is set 90 days ahead, and on that day
  (or the first later day with the capital held and the nation not Godless) it rises again at
  the capital with full HP. While away it makes no dominion checks and incarnate blessings
  lapse.
- **The pretender as a commander**: its pips are the design's, its holy pips 0, and its
  default script casts when it has pips. It is not sacred, so it fights blessed only with
  Avatar, in provinces its nation dominates. Only the Oracle researches. Immobile bodies cannot
  move, and on the losing side of a battle they die (docs/01); the Monolith's x2 doubles its
  own pretender checks only.
- **The god's name**: `NationSetup.pretenderName` (1 to 24 letters, spaces, apostrophes,
  hyphens and periods, starting with a letter) is stored as `NationState.pretenderName` and
  names the pretender commander on every arrival and return; without one it takes its body's
  name. No rule reads it.
- **Starting springs**: the World Tree's spring and the Sacred Spring boon's are added to the
  capital's `ProvinceState.extraSprings` at game creation; they pay mana like map springs and
  stay with the province.
- **Monthly summons**: on the first day of each month, a pretender with one that stands
  (not in transit) in a province its nation dominates gains `count` troops of its unit, but
  never more than its free leadership or its nation's cap less the nation's living troops of
  that unit (from any source). The Cinder Idol's sprites eat no supply; the Mother's wolves eat
  1 a day. Neither draws upkeep.
- **Blessings**: content in `src/content/pretenders/blessings.ts`; `blessOf(design,
  godPresent)` folds the chosen ones (or the defaults) into sacred units, the prophet and an
  Avatar in `battle/setup.ts`. Bless points are per color, which differs from Dominions'
  pooled points: pooled, White, Blue and Black pips would be cheap points for Red and Green
  blessings. Without a `blessings` field the bless equals the fixed bless of Phase 5 exactly.
- **Fire shield** and other shields: each melee hit that deals damage to a shielded unit deals
  the shield's amount to the striker in the shield's element, ignoring protection, after the
  phase (like life drain); shields of one element add, and each element logs its own damage.
- **Wild Spirit regeneration** is 10% of its HP per round (docs/09).
- **Great Wyrm breath**: 12 damage, range 3, ammo 5. Its element is display only: elements
  have no effect in M1. Its color is a look choice among the god's colors, default the
  nation's (docs/09).
- **Prophet**: the `makeProphet` command names any of the nation's commanders except the
  garrison holder and the pretender, while the nation has no prophet, from
  `prophetAvailableDay` on. Its holy pips become at least 3; in battle it gets +1 morale and
  the nation's blessings; it makes one dominion check a month from where it stands (docs/01's
  "Prophet: 1 check"; "spreads dominion as a temple" is read as "like a temple", without the
  Sanctity steps docs/01 gives temple buildings). A prophet cannot be dismissed. When it dies,
  the next may be named 720 days later. Its script stays as the player set it.
- **Presets**: Deep Root uses dominion 7, because dominion 8 costs 425 of 400 (docs/09). A
  nation's first preset is its default, used by AI nations and the headless runner. The first
  three presets of each nation carry no blessings field, so they keep the fixed bless.
- **Looks live outside the game state**: the look, identity (but the name) and nation look are
  stored with saved gods, in share codes, and in the save file's UI block; the sim never
  imports them, and a determinism test proves a look changes no outcome.
- **AI power**: each chassis has `aiPower`, the number of Light Infantry its body beats half
  the time times their `armyPower` term (docs/08), calibrated by `npm run sim:duel --
  --calibrate`.
````

### `docs/03-nations.md` (lands in 6b.1; the summon notes in 6b.3)

**In the second paragraph, replace "starting pretender chassis options" with:**

```markdown
the two pretender chassis that fit it (the realm rule of `docs/05-pretender.md` decides which
chassis it may take)
```

**Cinder Horde: add after "Identity levers: ...":**

```markdown
Pretender chassis (`docs/05-pretender.md`): the six generic chassis (Oracle of the Flux,
Titan, Great Wyrm, Living Monolith, Ascended Hero, Primordial) and the Red realm: Ash
Colossus, Ash Phoenix, Pyre Lord, Cinder Idol, Ember Hierophant. Fits: Titan and Ash
Colossus. Fire Sprites also join the Pyre Lord at battle start and the Cinder Idol each month.
```

**Thornwood: add after "Identity levers: ...":**

```markdown
Pretender chassis (`docs/05-pretender.md`): the six generic chassis and the Green realm: Wild
Spirit, World Tree, Horned Hunter, Elder Wyrm, Mother of Beasts. Fits: Wild Spirit and Living
Monolith. Wolves also join the Horned Hunter at battle start and the Mother of Beasts each
month.
```

**Sketches for M2: add at the end of the list:**

```markdown
Each M2 nation brings its color's pretender realm (six chassis, sketched in the 2026-10-21
pretender design) and its full blessing menu.
```

**Implementation decisions: replace the "Chassis that fit" item with:**

```markdown
- **Chassis** (Phase 6, revised in Phase 6b at the owner's direction for "good options for
  pretenders like Dominions has"): a nation may take the generic chassis and those of its own
  colors' realms, eleven for each M1 nation (`availableChassis`, `docs/05`). `NationDef.chassis`
  names the two the pretender screen marks as fitting: Cinder Horde, Titan and Ash Colossus;
  Thornwood, Wild Spirit and Living Monolith.
```

### `docs/02-magic.md` (section 8 in 6b.1; the decisions with the commits named)

**Replace section 8 with:**

```markdown
## 8. Blessings

Sacred units, the prophet, and a pretender with Avatar fight **blessed**. What they get is
chosen at pretender design from a blessing menu (`docs/05-pretender.md`, Step 6), after
Dominions 6. The menu was introduced on 2026-10-21 at the owner's direction ("good options for
pretenders like Dominions has").

- Bless points per color = pips in that color − 1; a color's points buy only its blessings.
- A blessing costs its requirement − 1 (at least 1); requirements run from 2 to 6.
- At most one blessing per group. Incarnate blessings work only while the god is on the map.
- Without a choice, each color at 4 or 5 pips gives its standard blessing and at 6 its greater
  one:

| Color | Standard (4 pips) | Greater (6 pips) |
|-------|-------------------|------------------|
| W | +2 morale, +1 protection | +4 morale, +2 protection |
| U | +2 defense, +2 precision | +4 defense, +4 precision |
| B | Life drain 2 per hit, +1 attack | Life drain 4 per hit, +2 attack |
| R | +2 attack, +2 strength | +4 attack, +4 strength |
| G | Regeneration 10% max HP per round, +1 protection | Regeneration 20%, +2 protection |

Blessings apply only in battle.
```

**Implementation decisions, add under "Battle spells":**

```markdown
- **Pretender abilities** (Phase 6b) are effect lists of the section 5 battle primitives on a
  pretender body, fired at battle start (`docs/04-battle.md`). They plan targets as a spell
  does, cost no fatigue or mana, and ignore spell power. Their ids never equal a spell id.
- **Spell power** (Phase 6b): a caster's `spellPower` adds to the amount of every damage and
  heal effect it casts (the Ember Hierophant: 3).
- **Blessing folds** (Phase 6b): every blessing is a stat change folded in at battle setup;
  weapon blessings copy each melee weapon with more damage, an element and armor piercing; a
  berserk blessing adds the tag; shield blessings add a retaliation shield of their element.
```

**Implementation decisions, add under "Rituals" (lands in Phase 8):**

```markdown
- **Effect tags on messages** (Phase 8, for the map's spell effects): a message about a
  ritual, a pretender's arrival or reform, an anointing or a monthly summon carries
  `fx: { kind, spell? }`. When a ritual completes on a province another nation owns and has
  `remoteDamage`, a negative `provincePop`, a positive `provinceUnrest` or a negative
  `provinceSupply`, that owner gets a `ritual` message ("Ash Rain struck Ember Ford."). No
  outcome changes; the determinism fixtures were regenerated in that commit.
```

### `docs/04-battle.md` (lands in 6b.2)

**Replay log: add to the list of event kinds:**

```markdown
`ability(unitId, abilityId, targets)`,
```

**Implementation decisions: in "A commander's rout", replace its first sentence with:**

```markdown
- **A commander's rout** (deviation from "checks morale too"): when a commander's last
  standing squad routs, the commander routs with it without a roll, unless it has morale 50 or
  is berserk, or the squad that broke is bound (below).
```

**Implementation decisions: add a new block at the end:**

```markdown
**Pretender abilities and new battle rules (Phase 6b)**

Added on 2026-10-21 at the owner's direction ("good options for pretenders like Dominions
has"). Each rule is tested alone; none adds a randomness source.

- **Battle-start abilities**: a commander's body may list abilities, each an effect list of
  `docs/02` section 5 primitives. In round 1, inside step 1 and before the scripts, commanders
  in caster order fire theirs, in list order, if they are active. An ability fires only when
  every effect has a target, as a spell needs; it plans targets as a spell does and lands its
  effects at once, with no fatigue, mana, research or spell power. It logs `ability` with its
  targets, then its effects' events. Only commanders carry abilities.
- **Multi-strike weapons**: a melee weapon with `strikes` n swings n times per troop per melee
  phase, each swing a full attack with its own target draw. A weapon with `maxTargetSize`
  strikes only targets of that size or smaller; with none present it swings at nothing and
  draws nothing.
- **Spell power**: see `docs/02-magic.md` decisions.
- **Retaliation shields**: a unit's shields are a list of element and amount (the Ash
  Colossus: fire 5). After the melee hits of a phase land, each damaging hit on a shielded
  unit costs its striker the shield's amount, per element, ignoring protection. Shields of one
  element add; each element logs its own `damage`, fire before nature.
- **Bound squads**: a squad summoned in the battle, or a squad of the unit its leading
  pretender's chassis summons each month, is bound. A bound squad that breaks never drags its
  commander into a rout; standing bound squads still keep it on the field. The one change for
  earlier content: summoned hornets pushed below morale 50 by Dread or Fear no longer drag
  their caster when they break.
- **Fear and morale 50**: Fear is a battle-long morale debuff; like Dread and unpaid upkeep, it
  can bring a morale-50 unit below the line, and such a unit then rolls like any other.
```

### `docs/08-ai.md` (lands in 6b.3 and Phase 8)

**Replace step 10 with:**

```markdown
10. **Pretender** (by `ChassisDef.role`): leaders, fighters, monsters and summoners join the
    main army after month 3; raiders join the army or take weak provinces alone; mages
    research if they can (the Oracle) or join the army; idols cast rituals in the capital.
```

**After the `armyPower` line of step 4, add:**

```markdown
    A pretender adds its chassis's `aiPower` (its Light Infantry equivalent, `docs/05`), and
    battle-start summons count as troops.
```

### `docs/09-art-direction.md` (lands in Phase 9 and Phase 10; the SVG lines in Phase 11)

**Sprite system, in the archetype list, replace "pretender bodies (oracle, titan, wyrm,
monolith, spirit, colossus)" with:**

```markdown
pretender bodies, one archetype each on the shared rigs (oracle, titan, wyrm, monolith, spirit,
colossus, ascended hero, primordial, ash phoenix, pyre lord, cinder idol, ember hierophant,
world tree, horned hunter, elder wyrm, mother of beasts)
```

**Replace the section "Pretender chassis art" with:**

```markdown
## Pretender chassis art

Added on 2026-10-21 at the owner's direction ("a customization level matching Age of Wonders 4
would be very ideal").

Each chassis is drawn on one of the shared battle rigs (biped, quadruped, serpent, treant,
wyrm, slab, spirit); no chassis needs a rig of its own. Its portrait is not a separate file:
it is the chassis's own parts in the rig's portrait pose, at 128 px on the summary card, 256
px in the designer and 64 px in the battle docks, so every appearance choice shows on the
card. Each chassis has one portrait detail layer (face lines, eyes, engraving) drawn for 256
px and hidden below 128 px. The summary card tints the tint zone by the dominant pip color and
shows a mana-symbol row beneath.

Parts that carry mechanics are fixed and never offered as choices: wings on flyers, roots on
the World Tree, the Wild Spirit's flicker, the Ash Colossus's embers, the Monolith's rooted
base. A choice may change a wing's shape, never remove it.
```

**Add a section "Pretender looks" after it:**

```markdown
## Pretender looks

- **Slots**: four overlay slots per chassis, three variants each (variant 0 is the base art),
  each an overlay on one anchor of the rig: headgear, mantle or pelt, weapon head, horns,
  back, tail, crest, plumage, canopy, face, base. Variants come from shared families authored
  once in anchor space, so the rig's procedural poses move every variant.
- **Markings**: eight procedural patterns (stripes, rings, spots, banded, mottled, runic,
  veins, plain) in the accent color, three offered per chassis.
- **Colors**: three chosen channels, material (eight swatches per material family: skin,
  stone, bark, wood, scale, hide; six for ember), metal (six) and accent (eight muted tones);
  the banner, the pip tint and the glow are derived and never chosen. Every material and metal
  swatch reaches 3:1 against its keyline; every accent differs from every nation banner by
  CIEDE2000 15 (10 under simulated color blindness); swatches in a table differ by 8.
  `tests/content/looks.test.ts` enforces this.
- **Sliders**: stature, head, horns, wingspan, glow; −2 to +2; never change the size class.
- **Poses**: regal, wrathful, serene, for the portrait.
- **Aura and flourish**: a halo or orbiting motes, colored by the god's pips; a sigil wheel
  or a halo burst inside the charge of the god's first cast. Neither changes timing.
- **Mechanics show by themselves**: pips as aura motes moving in each color's verb, blessing
  rings with the color's symbol on blessed units, a crown notch for incarnate blessings,
  orbiting symbols at 6 pips, candles for dominion, closed eyes or runic chains for a sleeping
  or imprisoned god.
- **The contact sheet**: `lab/looks.html` lays out every chassis with every variant at 64,
  128 and 256 px, in light and dark backdrops and under simulated color blindness, for review.
```

**Add a section "Sigils and banners":**

```markdown
## Sigils and banners

A nation's banner color stays fixed (ownership is gameplay information). Its identity is a
sigil: a frame (roundel, shield, lozenge, sunburst, ring of thorns, broken circle) around a
charge (crown, eye, hand, tree, flame, tower, serpent, star, skull, wave, antler, key, sword,
wheel, moon, anvil), drawn monoline in the neutral that `keylineFor(banner)` picks, on a
banner division (plain, per pale, per fess, per bend, chevron, bordure). Frames and charges are
original geometric SVGs in the icon style; divisions are drawn in code. The sigil shows on
army badges, battle pennants, the summary card, name cards and ritual sigils.
```

**After the "Spell visual effects" paragraph (as the battle design rewrites it), add:**

```markdown
## Magic effects grammar

Added on 2026-10-21 at the owner's direction ("flashy magic effects is always interesting").
Every spell, ability and ritual looks like what it does: its template comes from its first
primitive (bolt, engulf, burst, rain, aura, curse, restore, arrival, siphon, terror, field,
breath), its motion and shapes from its color (Radiance radiates rays, Tide ripples rings,
Umbra sinks and drips, Ember rises and flickers, Loam spreads along the ground and erupts),
its impact material and decal from its element, and its size from its tier (level and
breadth: durations, particle counts, shake and flash budgets). The god's flourish decorates
its own casts and never changes their timing. On the map, rituals play as their own templates
(portal, wash, blight, rain over a province, stitch along a border), with a channeling sigil
while they are cast.

## Flashes and red

No flash or timed tint may be a saturated red. WCAG 2.2 counts a color as saturated red when
R/(R+G+B) ≥ 0.8 on linearized sRGB (its "relative luminance" values); Fluid Magic keeps every
flash color and every tint that reverts within a second, or pulses, below 0.78. Ember's primary
#FD6533 (0.86) and secondary #7A1E12 (0.91) are saturated red, so they color particles and
decals only; Ember flashes use its accent #FFB347 (0.66). The red hit tint uses a passing
color such as #D0605A (0.74). Pulses
run at 3 Hz or less. `tests/content/presentation.test.ts` enforces this.
```

### `docs/10-milestone-1.md` (lands in 6b.1, except where noted)

**Acceptance criteria, replace 9:**

```markdown
9. Pretender: 16 chassis in three realms (11 per nation), pips with per-chassis new-color
   prices, dominion, five scales with effects and attunement, awakening, prophet, the blessing
   menu (per-color bless points, groups, incarnate blessings; the fixed bless as its default),
   two boons, the new battle and map rules of `docs/04` and `docs/05` (battle-start abilities,
   trample, spell power, shields by element, bound squads, monthly summons, the Phoenix's
   reform), and twelve presets with looks.
```

**Acceptance criteria, add to the end of 14:**

```markdown
    Pretender portraits are composed from the same parts as their battle sprites, with every
    appearance choice visible; every spell, ability and ritual has its effect per the magic
    effects grammar.
```

**Acceptance criteria, add:**

```markdown
16. The pretender designer has six steps (Body, Magic, Realm, Blessings, Appearance,
    Identity), a live preview, presets with looks, a random god and look with locks and a
    10-roll history, saved gods, and a share code that round-trips; no look or identity field
    other than the name changes the game state (determinism test).
```

**Build order: add after "Phase 6: Pretender, dominion, Wellsprings, victory":**

```markdown
### Phase 6b: Pretender variety
- At the owner's direction ("good options for pretenders like Dominions has is always a
  highlight ... A customization level matching Age of Wonders 4 would be very ideal"), the
  pretender grows before the UI phases. The design is the 2026-10-21 pretender build spec;
  its rules are in `docs/04` and `docs/05`. Three commits, each green:
- 6b.1: realms, per-chassis new-color prices, attunement, minimum awakening, starting springs,
  the god's name, roles, AI power for the existing six; the blessing menu with the fixed bless
  as its default; the Sacred Spring and Avatar boons; one save-version step.
- 6b.2 (after the battle track's S1): battle-start abilities, multi-strike weapons, spell
  power, shields by element, bound squads; the battle presentation's record and event
  amendments.
- 6b.3: monthly summons, the Phoenix's reform, the ten new chassis and six new presets with
  their content fixtures, `sim:aivai --presets` and `--matrix`, `sim:duel` with pinned bands
  and `--calibrate`, the AI's pretender step by role.
- Tests: every rule's own tests; every existing preset's bless and cost unchanged; the battle
  goldens unchanged; determinism with each new preset.
```

**Phases 8 to 12: add a bullet to each:**

```markdown
- (Phase 8) Map spell effects: the channeling sigil and stream, a completion pulse per color,
  dominion candles and the flip pulse, the map effect pool and its limits; effect tags on
  messages and the victim's ritual message; `aiPower` in `armyPower`.
- (Phase 9) The pretender designer (`docs/07`): six steps, live preview and card, looks,
  identity, sigils, random with history and locks, My Gods, share codes; looks in the save's
  UI block.
- (Phase 10) Spell and ability looks for every spell and ability; the eleven storyboards with
  their layers, sound and reduced-motion detail; blessing rings, the god's aura and first-cast
  flourish; placeholder parts for every chassis and slot family.
- (Phase 11) The pretender SVGs (bodies of the new chassis, slot variants, portrait detail
  layers, sigils), the map ritual templates, the god's divine moments, and the looks contact
  sheet.
- (Phase 12) The preset matrix and duel bands; the cost-parity and blessing-bounds snapshots
  reviewed; AI power recalibrated.
```

**Out of scope for M1, add:**

```markdown
pretender appearance editing during a game, links that carry a god, random presets for AI
opponents, a free color picker, designer and map sound
```

**Liberties taken, add:**

```markdown
- Bless points are per color, not pooled as in Dominions, so that White, Blue and Black pips
  (which buy nothing else in M1) cannot buy Red and Green blessings.
- Iron Will (a god that never routs with its troops) was designed and measured, then left out
  of M1: it added 35 to 55 points of win rate to every god-led army.
```

---

## Sources

Claims about other games come from the three research notes beside this file, which were
built from search-engine extracts and, for Dominions, from the manual and the game data read
in full. For this revision, web fetches were refused by the network policy (`www.w3.org`,
`w3c.github.io`, `lists.w3.org`), so the WCAG reading of R14 rests on judge 2's reading of the
Understanding page and its "relative luminance" reference; it is the stricter of the two
readings, so the rule is safe under either. A search confirmed the Gideon's Gaming wording.

- Dominions 6 manual (community web edition of the official manual):
  [ch. 3 The Pretender](https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html)
  (bless points, costs, incarnate, the god blessed in its dominion; transcribed in
  `web/m_main.qmd`), [ch. 4 Units](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html),
  [ch. 8 Dominion](https://dmacguigan.github.io/dom6-manual/chapters/08-dominion.html).
- Dominions 6 data and tools: [dom6inspector game data](https://github.com/larzm42/dom6inspector/tree/master/gamedata),
  [Pretenders Calculator](https://github.com/zollqir/pretenders-dom6),
  [illwiki Bless](https://illwiki.com/dom5/dom6/bless) (the "5 or more" incarnate rule),
  [Steam: bless points thread](https://steamcommunity.com/app/2511500/discussions/0/4132682727127343168).
- Age of Wonders 4: [wiki Form](https://aow4.paradoxwikis.com/Form),
  [wiki Ruler](https://aow4.paradoxwikis.com/Ruler),
  [Dragon Dawn](https://www.paradoxinteractive.com/games/age-of-wonders-4/add-ons/age-of-wonders-4-dragon-dawn),
  [Wyvern Update notes (Random Ruler)](https://store.steampowered.com/news/app/1669000/view/7208622092879106175),
  [Dev Diary #11 via GameBanshee](https://www.gamebanshee.com/news/127487-age-of-wonders-4-developer-diary-11-art-design.html),
  [GamePressure faction creation](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c),
  [Gideon's Gaming review](https://gideonsgaming.com/age-of-wonders-4-review/) ("at the forefront"),
  [MMORPG Dragon Dawn review](https://www.mmorpg.com/reviews/age-of-wonders-4-dragon-dawn-review-strategy-session-2000128239),
  forum threads on [sharing](https://steamcommunity.com/app/1669000/discussions/0/839501827476184072/),
  [dragon colors](https://steamcommunity.com/app/1669000/discussions/0/4036979414422568941/),
  [Giant King cosmetics](https://steamcommunity.com/app/1669000/discussions/0/596271495257278373/),
  [hiding transformations](https://steamcommunity.com/app/1669000/discussions/0/6761669877514621714/),
  [random button request](https://steamcommunity.com/app/1669000/discussions/0/3828666283443789087/),
  [edits not saving](https://steamcommunity.com/app/1669000/discussions/0/5294588689507328353/),
  [pronouns](https://steamcommunity.com/app/1669000/discussions/0/4548155824440762289/),
  [palette-swapped animations](https://steamcommunity.com/app/1669000/discussions/0/3828666283438110304/),
  and the mods [C4U](https://steamcommunity.com/sharedfiles/filedetails/?id=2971527182) and
  [Age of Colors](https://steamcommunity.com/sharedfiles/filedetails/?id=2970499689).
- Effects craft and accessibility: [Riot VFX style guide](https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/),
  [Total War spell types (alcasthq)](https://alcasthq.com/warhammer-lore-of-fire-magic-type),
  [Total War misleading vortex](https://steamcommunity.com/app/364360/discussions/0/351660338685393106),
  [WCAG 2.2, Understanding 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html),
  [WCAG 2.2 relative luminance](https://www.w3.org/WAI/WCAG22/Understanding/relative-luminance.html),
  [chromatic aberration complaints](https://thegameswiki.com/crimson-desert/wiki/chromatic-aberration),
  [PixiJS ParticleContainer v8](https://pixijs.com/blog/particlecontainer-v8).
- MTG color pie: [MTG Wiki, Color](https://mtg.fandom.com/wiki/Color).

Companion specs: `../battle-design/final.md` (S1.2 to S1.9, S2.2, S2.3, S2.7, S2.8, S2.10,
S2.11, S2.14, S3.2, S3.3, S4.4, S4.5, S6.1, S6.2 and its Spec text were read for this
revision) and `../ui-design/spec-final.md` (rulings 12 and 19, 1.1, 3.3, 5.4, 6.7, 7, 9.3 and its
Docs text).

Repository files read: `docs/00`, `02`, `03`, `04`, `05`, `08`, `09-art-direction`,
`09-balance`, `10`; `src/content/pretenders/*`, `src/content/units/{pretenders,common}.ts`,
`src/content/spells/{types,green}.ts`, `src/content/types.ts`, `src/content/rules.ts`,
`src/content/colors.ts`; `src/sim/{pretender,bless,commanders,tick,types,selectors}.ts`;
`src/sim/battle/{setup,morale,effects,spells,resolve,attacks,events,field,targets,types,apply}.ts`;
`tests/sim/battle/fixtures.ts`, `tests/content/colorMath.ts`.

Computed for this revision (`pretender-design/calc-final/`): `costs-final.mjs`,
`duel-final.ts`, `duel-mother.ts`, `aipower.ts`, `bless-bounds.mjs`,
`bless-bounds-percolor.mjs`, `sharecode-final.mjs`, `redflash-final.mjs`, `swatches.ts`,
`accent-search.ts`, each with its output. The judges' own reruns
(`judge1/mother.ts`, `judge2/duel2-rerun.md`, `judge2/redlin.mjs`) reproduce with these.
