# Research: Dominions 5 and 6 unit statistics, and what Fluid Magic should take from them

Scope: the Dominions 5 and 6 unit stat line (hit points, protection, magic resistance, morale,
strength, attack, defense, precision, encumbrance, combat speed, map move, size, upkeep, costs);
size and what it does; mounts; armor pieces and hit locations; weapons; resistances; special
abilities; afflictions; experience and heroic abilities. For each item: how much flavor it
gives for how much complexity, what players find tedious, and how it maps onto Fluid Magic
(FM): `docs/03-nations.md`, `docs/04-battle.md`, `src/content/types.ts`,
`src/sim/battle/{field,attacks,morale,setup}.ts`.

Owner direction this serves (binding): "the detail stats from giants to horses like Dominions
and with the items are very immersive, added immersion without completely making it over
complicated makes this game very engaging and replayable." Constraints kept: deterministic pure
sim, content as data with validation, no numbers in sim code, every command validated, the AI
uses the same commands, tests for every rule, color-blind-safe symbols, M1 phases or explicit
M2, and every added stat earns its place, shows in layers (card, hover, Codex), and fits in one
sentence.

Shared with other tracks, not duplicated here:
- **Pretender design** (`../pretender-design/design-draft.md`): ability triggers N1
  (`battleStart`, `eachRound`), multi-strike and trample N2 (`strikes`, `maxTargetSize`), spell
  power N3, retaliation element N4 (`shieldElement`), body home terrain N6, and `CombatStats.size`.
  Section 7 below proposes **one abilities catalog** that holds those and the troop abilities.
- **UI spec** (`../ui-design/spec-draft.md` section 1.1 layers L0 to L4;
  `../ui-design/research-fourx.md` section 6, one `UnitCard` at three depths).
- **Battle presentation** (`../battle-design/final.md` S2.2 unit looks: archetype, rig,
  material, shield, mount, visual size; per-blow `strike` detail events).

## Method and evidence

- **Primary, rules:** the Dominions 6 manual as transcribed chapter by chapter in the community
  repository dmacguigan/dom6-manual: chapters 2 (basics), 3 (pretender), 4 (units),
  5 (movement), 6 (combat), 7 (magic), 10 (magic items) [M2] to [M10]. Read in full from the
  raw Quarto sources.
- **Primary, data:** the Dominions Data Inspector game dumps, Dom6 [D6] and Dom5 [D5]:
  `BaseU.csv` (units), `weapons.csv`, `effects_weapons.csv` (damage and flag bits, decoded with
  the inspector's own `MWpn.js`), `armors.csv`, `protections_by_armor.csv` (protection per body
  zone), `BaseI.csv` (items), and `unitdescr/*.txt` (the in-game unit descriptions). Figures
  marked *(computed)* are my counts over the Dom6 dump: 4,089 records after dropping "Test"
  entries. The dump includes commanders, summons, and alternate shapes, so shares are shares of
  records, not of recruitable units.
- **Secondary, sentiment:** WebFetch could not resolve hosts in this session and the proxy
  refused illwiki and Steam, so community claims come from search-result excerpts, marked
  *(excerpt)*. Treat them as sentiment, not rules. Where an excerpt named several pages of one
  thread, I cite the thread and say so.
- **FM:** repository at commit `3addf97` (Phase 6), read only.

---

## 0. Summary

### Findings

1. **FM already uses Dominions' combat arithmetic.** It has the same damage roll (str + weapon
   damage + DRN against protection + DRN, [M6]), the same open-ended 2d6 DRN, and the same upkeep
   (gold cost / 15 a month, sacred units half [M2]; `docs/01` section 4). It also has the same cost
   split: Dominions charges gold for training and resources for equipment [M4], and FM charges gold
   and materials. The gap is not in the numbers. It is in what the numbers *do* (size, mounts,
   elements, and armor pieces have no rules in FM) and in what the player can *see*.
2. **Size carries "giants to horses".** In Dom6 data a human is size 3, a horse 5, a Jotun giant
   6, a Cyclops 7, a war elephant 9 [D6]. The median HP is 11 at size 3, 38 at size 6, and 90 at
   size 9 *(computed)*. Size drives eight rules: square capacity, displacement, trample, which hit
   locations a blow can reach, whether a mount or rider is struck, how missiles pick targets,
   weapon length for giants, and supply [M2][M4][M6]. **In FM, size only sets supply (1 or 3).**
   The battle never reads it, although `docs/03` says size 3+ "occupies more formation space".
3. **Dom6 split mounts from riders.** A Knight (hp 11) rides a Destrier (hp 22, prot 4, plate
   barding, its own hoof attack) [D6]. A blow picks the rider or the mount by size and reach. A
   dead mount leaves the rider fighting on foot, and a riderless horse routs [M6]. Dom5 modeled
   the Knight as one size-3, hp-11 unit [D5]. The Steam store page names "riders and mounts now
   have separate stats and can be targeted individually" as a Dom6 feature [S1].
4. **Armor is built from pieces, and the math stays behind a click.** Body armor, helmet,
   shield, and barding each have protection per body zone, a defense penalty, and encumbrance
   [D6]. A hit lands on the torso 50% of the time, the arms or legs 20% each, and the head 10%. A
   head hit uses the helmet [M6]. Players see a gear list. The per-zone values appear "when you
   click on Protection" [M4].
5. **Weapons give each unit a fighting style.** In Dom6, 13% of the weapons units carry are armor
   piercing and 11% armor negating. 36% are natural "bonus" weapons (bite, hoof, claw) that add an
   attack without a penalty, and 12 have a charge *(computed)*. Length drives repel: a pike stops
   a low-morale charger [M6].
6. **Resistances are a common, readable vocabulary.** 16% of Dom6 records resist fire, 23% cold,
   25% poison, and 7% shock *(computed)*. Negative values encode weakness: the Troll has fire
   −10, the Jotun Huskarl shock −5 [D6]. The unit description explains the weakness: "Thunder
   and lightning still recognize their old quarry and the Jotuns greatly fear the wielders of
   lightning" [D6-desc].
7. **Dominions has "about 500 special abilities"** [M4], but its flavor comes from a small
   common set plus rare signatures. Common: forest survival (21% of records), stealth (17%),
   flying (12%), undead (10%), fear (8%). Rare: trample 2.7%, regeneration 2.8%, awe 2.8%,
   fire shield 1.0% *(computed)*.
8. **Players love the breadth and dislike the logistics around the depth.** Praise covers
   "thousands of different units" and mythological troops [S3][S13], and the fact that "every
   unit is simulated, and wounds carry over" [S6]. The complaints: afflictions that rarely heal
   [S7]; a hotkey that exists to find limping troops "so that holes do not open up in your squads"
   [M4]; handing "1-6 magical items ... to >60 units" [S4]; "menus of menus" [S6]; cryptic UI and
   micromanagement [S5]; jargon [S12]; and external lookup tools [S14].
9. **Stats and lore justify each other.** Dominions unit descriptions explain odd numbers.
   Huskarls "can rarely afford heavy armor". Elephants, "once hurt, ... become enraged and
   terrified, ... trampling friends and enemies alike", which fits their morale of 9. Destriers
   "are not as fast as regular war horses" [D6-desc]. This is the cheapest way to make a stat
   read as immersion instead of noise.

### Gaps in FM found while mapping

| # | Gap | Where |
|---|---|---|
| G1 | `size` sets only supply (`commanders.ts` `supplyOf`). `CombatStats` has no size; `docs/03` promises "occupies more formation space" and no rule does it | `docs/03` stat model; `src/sim/battle/types.ts` |
| G2 | `mr` is stored and range-checked by content validation but read by nothing in the sim; no `docs/02` primitive has a resist check | `src/content/index.ts:38`; `src/sim/**` |
| G3 | The `mounted` and `mindless` tags carry no rule; `beast` only a Wild cost discount; `construct` only zero supply | `src/sim/{recruitment,commanders}.ts` |
| G4 | Mounted troops are size 1 by decision (`docs/03` Implementation decisions) but cost 20 population, as for two bodies, and eat 1 supply | `src/content/units/*.ts` |
| G5 | Damage events carry an element, but elements change nothing. `docs/02` already writes element-against-tag effects for M2 ("Sunlance ... double vs undead", "Banish ... undead only"), and the pretender draft's breath color (D6) is "inert ... until M2's resistances" | `src/sim/battle/attacks.ts`; `docs/02` section 6 |
| G6 | Shields are folded into def ("Shield (+2 def, counted)"). The look shows a shield (`shield?: 'round' \| 'kite'`), but arrows ignore it | `docs/03` Warden; battle-design S2.2 |

### Recommendations, in priority order

| # | Recommendation | One sentence for the player | Milestone |
|---|---|---|---|
| R1 | Give size three battle and map effects: supply by size, targeting weighted by size, trample (pretender N2) | "Bigger bodies eat more, draw more blows, and trample the small." | M1 (Phases 8 to 12; balance in 12) |
| R2 | Gear lists as content: each unit names its armor, helmet, shield, and weapons from a gear registry. Validation checks that prot, def, and materials match the gear. Art layers read the same ids | "A Briar Guard wears thornplate and an iron cap: prot 9." | M1 (content and Codex; art in Phase 11) |
| R3 | One elemental resistance number per element; negative means vulnerable | "Fire resistance −5: fire hits this unit 5 harder." | M1-should (owner call; the pretender draft has M2) |
| R4 | Reach weapons cancel a charge; shields count against arrows | "Halberds blunt a charge." / "A shield turns arrows too." | M1-should |
| R5 | One abilities catalog shared with the pretender design. Every tag, stat fold, weapon property, and trigger has a name, a glyph, and one sentence, and validation enforces it | (whatever the entry says) | M1 |
| R6 | MR: hide it on cards until a rule reads it; in M2 add resisted effects (penetration against MR) | "Magic resistance: chance to shrug off curses." | M1 hide, M2 rule |
| R7 | A description is required on every unit, and it explains each unusual stat | (lore line) | M1 content |
| R8 | Mounted units: size 2 and a `mount` block (name, look, natural attack) in M1; a separate mount HP pool in M2 | "Unhorsed riders fight on foot." | M1 data, M2 rule |
| R9 | Commander renown: ranks from battles and kills, +1 att/def/mor per rank, a heroic ability at the top rank | "Varo the Ember, veteran of 6 battles." | M2 (M1 hook: count and show) |
| R10 | Afflictions for commanders only, 4 kinds, with a clear way to heal; never on troops | "Lost an eye: −2 precision until healed at a temple." | M2 |

Skip (section 11): per-blow hit locations as a rule, slash/pierce/blunt rules, encumbrance and
fatigue for troops, harassment, armor-defeating hits, shield breakage, troop afflictions, age,
disease, horror marks, clouds, swallow, petrification. Spirit sight and darkvision wait until
something makes units invisible or the battle dark.

---

## 1. The stat line, field by field

| Field | What it does in Dominions | Dom6 examples [D6] | FM today | Verdict |
|---|---|---|---|---|
| Hit points | Damage capacity. An affliction's chance is the share of max HP lost in one blow [M4][M6] | Militia 10, Knight 11 (+ Destrier 22), Troll 35, Jotun Huskarl 35, Cyclops 91, War Elephant 64 | `hp`; squads keep one HP pool (`Squad.hp`), split evenly per troop in battle | Keep |
| Size | Square capacity (10 points), displacement, trample, hit-location reach, mount targeting, missile weighting, giants' weapon length, supply [M4][M6] | human 3, horse 5, giant 6, elephant 9 | `size` 1 to 6; supply only (G1) | **Expand (R1)** |
| Strength | Added to melee damage; most missiles add half; breaks entanglement; siege reduction = str² [M4][M6] | Militia 10, Troll 22, Cyclops 28 | `str`: melee damage (ranged adds none: `docs/09` decision); siege `sum(str)/10` a day (`docs/01` section 11) | Keep; option: siege by str² (section 7) |
| Attack / Defense | `att + DRN > def + DRN` hits; fatigue lowers both [M6] | 8/8 militia, 11/11 knight | Same rule (`attacks.ts`) | Keep |
| Protection | Per body zone; `prot + DRN` subtracted; head hits use the helmet; shield hits add the shield [M4][M6] | HI torso 12, head 16 | One number `prot`; AP halves it, AN ignores it | Keep one number; compose it from gear (R2) |
| Morale | Squad average; rout when `mor + DRN + survivor bonus < 14 + DRN` [M6] | Militia 8, Knight 13, Longdead 50 | Same idea, `docs/04` rule; 50 never checks | Keep |
| Magic resistance | Resists some spells: `MR + DRN` against `11 + DRN + path` [M7] | 10 human, 18 Cyclops, 5 Destrier | `mr`, **unused** (G2) | Hide until used; rule in M2 (R6) |
| Precision | Missile scatter and spell accuracy; above 10 counts double [M6] | 10 human, 5 animals | `prec`: ranged hit `prec + DRN ≥ 10 + DRN` | Keep |
| Encumbrance | Fatigue gained per attack; fatigue cuts def (1 per 10) and att (1 per 20); 100 = unconscious [M4][M6] | Knight 3, Militia 4 | Casters only (spell fatigue) | Skip for troops (section 11) |
| Combat speed | Squares per action; faster units act sooner [M4][M6] | human 11 to 12, horses 23 to 25, elephant 18 [D6 `ap`] | Folded into `mapSpeed` → closing round 2/3/4 | Keep the fold |
| Map move | Movement points; terrain costs; survival −2 [M5] | infantry 8 to 14, light cavalry 20 [M5 table] | `mapSpeed` 1/2/3; leg days by speed and terrain | Keep |
| Leadership | Troops led; three kinds (normal, undead, magic); morale by squads led [M4][M6] | 10 / 50 / 100 / 150 | `leadership` (count only) | Keep; undead leadership with the M2 Black nation |
| Upkeep | gold / 15 a month; sacred and slaves half [M2] | — | Identical (`docs/01` section 4) | Keep |
| Cost | Gold (training), resources (equipment), recruitment points; sacred units spend holy points [M4] | — | gold, materials, pop; temple for sacred | Keep; tie materials to gear (R2) |
| Age | Old age brings afflictions; paths change max age [M4] | — | none | Skip |

**Reading.** FM's stat model is a faithful subset. The three fields with no FM equivalent
(encumbrance, age, combat speed as its own number) are the ones Dominions players either never
look at or meet only as hidden penalties. Section 11 keeps them out.

---

## 2. Size: from horses to giants

### 2.1 The Dominions 6 ladder

| Unit [D6] | Size | HP | Prot (natural) | Str | Notes |
|---|---|---|---|---|---|
| Militia | 3 | 10 | 0 (leather cuirass, reinforced leather cap, shield) | 10 | mor 8 |
| Knight | 3 | 11 | 0 (full chain, full helmet, kite shield) | 11 | rides a Destrier |
| Destrier (mount) | 5 | 22 | 4 (+ plate barding) | 15 | Hoof (bonus weapon), combat speed 23 |
| Troll | 5 | 35 | 11 | 22 | regeneration 10, fire −10, darkvision 50 |
| Great Bear | 6 | 40 | 8 | 19 | Bite + Claw, forest and mountain survival |
| Jotun Huskarl | 6 | 35 | 5 (+ ring mail, iron cap, shield) | 20 | cold 15, shock −5 |
| Cyclops | 7 | 91 | 20 | 28 | fear 5, fire 15, MR 18, one eye (`eyes 1`) |
| War Elephant (mount) | 9 | 64 | 11 | 20 | trample, mor 9, Tusk |

The Dom5 dump has the same units smaller: Militia 2, Jotun 4, War Elephant 6, Cyclops 5, Troll 3
[D5]. Dom6 rescaled sizes by about 1.5 so that horses (5) sit between men (3) and giants (6). The
manual now says a square holds "ten size points of units (so three human-sized units of size
3)" [M6].

**Median HP by size, Dom6** *(computed over 4,089 records)*:

| Size | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Records | 39 | 178 | 2,121 | 578 | 293 | 342 | 82 | 124 | 206 | 126 |
| Median HP | 3 | 8 | 11 | 20 | 25 | 38 | 53 | 66 | 90 | 144 |

HP roughly doubles every two sizes. Half of all records are human-sized: the giants and
monsters stand out because the baseline is so common.

### 2.2 What size does in Dominions

1. **Space.** A square holds 10 size points [M6].
2. **Displacement and trample.** A unit at least 3 size points larger may push into a square at
   one extra point of combat speed; tramplers run over smaller units. The victim rolls
   `defense − fatigue/10` against 3d6; on a failure it takes 7 + size armor-piercing damage, and
   on a pass 1 point [M4][M6].
3. **Reach to hit locations.** A head hit needs attacker size + weapon length to equal the
   target's size; the torso needs one less, the arms two less. "A human (size 3) wielding a mace
   (length 1) could hit a size-7 creature only in the legs." A unit 2+ sizes larger than its
   target hits the head 20% of the time instead of 10% [M6].
4. **Mount targeting.** A mount 3, 4, or 5+ sizes larger than its rider is struck 25%, 50%, or
   75% of the time [M6] (section 3).
5. **Missiles.** A missile lands in a square and then picks a unit there "weighted by relative
   size (a giant of size 6 sharing a square with a human of size 3 is struck two times out of
   three)". The attacker also gets half the square's size points to hit [M6].
6. **Repel.** Size 6+ units wield weapons one point longer [M6].
7. **Supply.** Units eat size − 2 a month; sizes 1 and 2 eat ½; animals half; a rider and a
   mount both eat [M4].
8. **Targeting orders.** "Large monsters" means size 7+, falling back to size 6 [M4].

**Community.** Players counter elephants with low-morale tricks, because "routing units then
trample their own side", and with "other size 6 units". They note that larger units "fit fewer
per square", so enemies gang up on them [S10] *(excerpt; one thread gives the trample formula
differently from the manual)*.

### 2.3 Fluid Magic today

- `UnitDef.size` 1 to 6; baseline 1. Present sizes: Oakheart 2, Salamander 3, Treant and Giant
  4, Titan 4, Ash Colossus 5, Great Wyrm 6 (pretender bodies). Mounted troops take the baseline,
  size 1 (`docs/03` decisions).
- Supply: 1 a day, 3 for size 3+, 0 for undead and constructs (`SUPPLY` in `rules.ts`,
  `supplyOf`).
- Battle: nothing. Targets are drawn uniformly over every living troop in the rows up to the
  enemy front (`targetsUpTo`, `randBelow(rng, targets.length)`).
- Presentation reads size: fewer sprites per squad for big units (20/12/6/4/2/1 by size), size 3
  bumps a weapon's weight class, size 4+ is "huge" (battle-design S2.2).
- Pretender draft N2 adds `CombatStats.size` and trample as a melee weapon with `strikes` and
  `maxTargetSize`.

### 2.4 Proposal for FM (R1)

**The FM ladder.** FM's size 1 is a human. The table fixes what each step means so content stays
consistent (a content validation fixture lists every unit's size):

| FM size | Dom6 size | Body | FM units | HP band (FM) |
|---|---|---|---|---|
| 1 | 3 | human | infantry, archers, mages | 10 to 14 |
| 2 | 4 to 5 | large humanoid, **mounted** | Oakheart, Oracle, Wild Spirit, Ash Rider and Wolf Rider (proposed) | 12 to 32 |
| 3 | 5 to 6 | great beast | Salamander, Ash Phoenix | 35 to 70 |
| 4 | 6 to 7 | giant | Giant, Treant, Titan, Horned Hunter | 40 to 80 |
| 5 | 8 | colossus | Ash Colossus | 80 |
| 6 | 9 to 10 | wyrm, elephant | Great Wyrm, Primordial, World Tree | 120 to 250 |

FM's existing HP already tracks Dom6's medians: the giant at 40 HP sits at Dom size 6
(median 38), and the wyrm at 120 between sizes 9 and 10 (90, 144).

**Three rules, one sentence each:**

| Rule | Sentence | Exact behavior | Cost |
|---|---|---|---|
| Supply by size | "A unit eats supply equal to its size." | `supplyOf = size` for living troops (undead and constructs 0, unchanged); commanders by size too | A balance change: giants 4 instead of 3, mounted 2 instead of 1. Retune with the existing supply conflict already logged in `docs/09` (Phase 12) |
| Size draws blows | "Bigger targets draw more blows." | In `meleePhase` and `rangedPhase`, the target is drawn with weight `size` instead of uniformly: one `randBelow(rng, totalSize)` and a cumulative walk. Still one draw per attack, so the rng budget is unchanged | One helper; the golden battle record changes once. With 1 giant among 20 militia, its share of 30 arrows goes from 1.4 to 5.0 |
| Trample | "Trample: crushes small foes around it." | Pretender N2 (`strikes`, `maxTargetSize`) on a natural weapon; Dom's "3 sizes larger" becomes "targets of size ≤ N" in data | Shared with the pretender track; no new rule here |

**Formation space** (G1): either drop the claim from `docs/03` or define it as a frontage cap
(each side's front row engages at most N size points). The cap needs a rule about who waits,
which is a real change to `docs/04`, so this research recommends dropping the claim in M1.

**Tests:** the size-weighted draw takes a giant 4/24 of the time against 1 giant + 20 humans
(statistical test over seeds); determinism golden updated; supply per size; content fixture of
sizes.

---

## 3. Mounts and mounted units

### 3.1 Dom5 compared with Dom6

| | Dom5 Knight [D5] | Dom6 Knight + Destrier [D6] |
|---|---|---|
| Size | 3 (one body) | rider 3, mount 5 |
| HP | 11 | rider 11, mount 22 |
| Armor | full chain, full helmet, kite shield | rider the same; mount plate barding (head 21, torso 21, legs 15, def −2, enc 3) |
| Attacks | lance, broad sword | rider lance and broad sword; mount Hoof (a bonus weapon) |
| Speed | combat speed 20 | rider 12, mount 23 |

**Yes, Dom6 mounts have their own HP.** A Dom6 knight has three times the body (11 + 22). It
dies differently too. By the rules below, a human swordsman (reach 3 + 1) strikes the Destrier
40% of the time, a spearman (reach 3 + 3) 20%, and arrows 50%. The horse often falls first and
the rider fights on.

### 3.2 Dom6 rules [M6]

- **Targeting.** A mount much larger than its rider is struck 25% (3 sizes), 50% (4), 75% (5+) of
  the time. Otherwise missiles hit the mount 50% of the time; a mount 2+ sizes above the
  attacker's reach (size + weapon length) is always struck; otherwise the chance is
  `30% + 10% × mount size − 10% × reach`, at least 10%. Area attacks and lightning hit both;
  **trample always hits the mount.** illwiki notes the targeting was changed around 26 August
  2024 [S2] *(excerpt)*.
- **Death of one half.** "A horse without a rider routs, but some monsters (e.g. the gryphon)
  stay and fight." If only the mount breaks, the rider is thrown and fights on foot; falling
  deals size-difference armor-negating damage.
- **Morale.** Unnatural fear targets both; normal rout checks affect the rider only.
- **After battle.** An unhorsed rider takes a free surviving mount of his kind, or walks home and
  can be re-recruited mounted at half cost, keeping his experience and afflictions. "Smart
  Mounts" come home too.
- **Equipment.** Two-handed weapons cost −3 attack mounted. "Skilled Rider" raises the mount's
  morale and defense. A mounted commander's boots slot is disabled while mounted; the mount has a
  barding slot [M4].
- **Supply.** Both rider and mount eat [M4].

Dom6 has 262 records with a mount *(computed)*. The mount pool covers riding horses, war horses,
destriers, steppe horses, skeletal and flayed horses, war elephants, mammoths, and more [D6].

### 3.3 Fluid Magic today

- Ash Rider: hp 12, prot 4, mapSpeed 3, Lance 6 (first round +3) and Sword 4, cost 28 g / 18 m /
  **20 pop**, tags `mounted`. Wolf Rider: Spear 4 and **Wolf Bite 3**, so the mount's attack is
  already a second weapon, like Dom's bonus weapon. Both are size 1 by decision.
- `mounted` has no rule (G3). The lance's charge is `firstRoundBonus`.
- Presentation already treats them as two bodies: rider rig on a horse or wolf, a charge cue,
  `riderSplit` deaths, and "the mount collapses (60%) or bolts riderless (40%)" (battle-design
  S2.2 and S2.8).

### 3.4 Options

| Option | Rules | State | Verdict |
|---|---|---|---|
| A. Mount as data | `UnitDef.mount?: { name, look, weapon }`; size 2; supply 2. The rider and mount share one HP pool, as now | none | **M1.** Gives the Codex and the card a named mount ("Ash Horse") and makes the existing visuals honest |
| B. Mount as an HP layer | Each mounted troop gets `mount.hp` on top of its own. A blow strikes the mount on a coin flip (one extra draw), or always for trample. At 0 mount HP the troop is unhorsed for the rest of the battle: speed 2, no charge, its mount weapon gone. After battle, unhorsed survivors remount at a materials cost or join a foot squad | in battle only; one materials charge after it | **M2.** One sentence: "A blow strikes the rider or the mount; unhorsed riders fight on foot." |
| C. Dom6 full | Separate persistent entities; riders walk home; re-recruit at half cost | per-troop identity | **Reject.** FM squads are HP pools without identities (`Squad`), by design |

---

## 4. Armor pieces and hit locations

### 4.1 Dominions 6 armor data [D6]

Zones: head, torso, arms, legs. Shield protection is added on a shield hit.

| Piece | Kind | Head | Torso | Arms | Legs | Def | Enc | Resource cost |
|---|---|---|---|---|---|---|---|---|
| Leather Cap | helmet | 7 | | | | 0 | 0 | 0 |
| Reinforced Leather Cap | helmet | 9 | | | | 0 | 0 | 1 |
| Iron Cap | helmet | 16 | | | | 0 | 0 | 2 |
| Half Helmet | helmet | 18 | | | | 0 | 0 | 3 |
| Full Helmet | helmet | 21 | | | | −1 | 0 | 5 |
| Leather Cuirass | body | | 7 | 3 | 3 | 0 | 0 | 1 |
| Ring Mail Hauberk | body | | 12 | 9 | 9 | −1 | 1 | 5 |
| Full Scale Mail | body | | 15 | 15 | 15 | −2 | 3 | 12 |
| Full Chain Mail | body | | 18 | 18 | 18 | −3 | 3 | 17 |
| Furs | body | | 8 | 6 | 6 | −1 | 1 | 1 |
| Leather Barding | mount | | 7 | 3 | 3 | 0 | 0 | 3 |
| Plate Barding | mount | 21 | 21 | 15 | 15 | −2 | 3 | 15 |

Dom6 has 296 armor records: 169 body armors (barding included), 64 helmets, 59 shields, and 4
other *(computed)*.

### 4.2 Rules [M6]

- **Hit location:** torso 50%, arms 20%, legs 20%, head 10%. A head hit uses the helmet's
  protection. A limb hit's damage is capped at half max HP. Reach by size (section 2.2).
- **Shields:** a hit beats defense but not defense + parry is a shield hit, and the shield's
  protection is added. The manual's example: a Heavy Infantry with defense 10 counts +1 from its
  sword, −2 from its armor, and −1 from its shield, so 8; with parry 4, 12. Against a Vanjarl's
  roll of 20: 7 or less is a clean hit, 8 to 11 a shield hit, 12+ a miss.
- **Shields against missiles:** the missile defense roll is `DRN + parry × 2 − fatigue / 20`.
- **Armor-defeating hits:** a protection roll of 2 (3 at 50 fatigue, 4 at 100) bypasses 25% of
  protection.
- **Shield damage:** breaks with damage above 3× or 5× the shield's resistance.
- **Cost:** "heavily equipped units [cost] a lot of resources" [M4].

**Loadouts (Dom6):** Militia wears a leather cuirass, a reinforced leather cap, and a shield.
Heavy Infantry wears a ring mail hauberk, an iron cap, and a shield. The Knight wears full chain
mail, a full helmet, and a kite shield, and rides a destrier in plate barding. The Jotun Huskarl
has ring mail, an iron cap, a shield, and natural prot 5 [D6]. The description says why: their
Herse "can rarely afford to give them heavy armor" [D6-desc].

**Sentiment.** "A flat deduction from every damaging hit you take is incredibly powerful" is
the case one player made for heavy armor despite its fatigue cost [S15] *(excerpt)*. Nobody
asked for the zone math. It sits one click deep for a reason.

### 4.3 Fluid Magic today

One `prot` number. Shields are folded into `def` (`docs/04`: "Keep: shield is folded into def
in M1"). `docs/09` already composes sprites from parts: "body silhouette, armor layer, weapon
layer", with per-nation armor and weapon sets ("Cinder Horde: jagged axes, scale armor ...;
Thornwood: bark armor, bows, leaf cloaks"). The battle looks have `material` and `shield`.

### 4.4 Proposal for FM (R2, R4b)

**Gear as content.** Add a gear registry next to the units: `src/content/gear.ts` with `GearDef
{ id, name, slot: 'body' | 'head' | 'shield' | 'barding', prot, def, materials, sprite }`.
Weapons get `id` and `materials` too. Each unit lists `gear: GearId[]` and an optional `natural:
{ prot }`. Content validation checks:
- `unit.prot === natural.prot + Σ gear.prot`.
- `unit.def` includes `Σ gear.def` (shield parry positive, heavy armor negative).
- `unit.cost.materials === Σ gear.materials + Σ weapon.materials`, plus a mount's when it has one.

The sim keeps reading `prot` and `def`: **no new rule.** The card shows the pieces as small
icons; the hover shows "prot 9 = thornplate 7 + iron cap 2"; the materials hover shows what the
equipment costs. The sprite builder picks the armor, helmet, and shield layers from the same
ids, so what you read is what you see.

Illustrative M1 gear. The numbers sum to today's `docs/03` tables, so balance does not move:

| Unit | Gear | prot | Shield def |
|---|---|---|---|
| Ash Militia | leather cap 1 | 1 | — |
| Cinder Warrior | scale shirt 2, leather cap 1 | 3 | — |
| Ash Rider | scale shirt 2, iron cap 2 | 4 | — |
| Flamebrand | scale hauberk 4, iron cap 2 | 6 | — |
| Warden | bark mail 4, iron cap 2, round shield | 6 | +2 (already in def 11) |
| Briar Guard | thornplate 7, iron cap 2 | 9 | — |
| Oakheart | natural 6 (living oak), bark mail 4 | 10 | — |

**Shields against arrows (R4b, M1-should).** Split the shield's part out of `def` as
`shieldDef` (Warden 2). Missile hit becomes `prec + DRN ≥ toHit + shieldDef + DRN`. One sentence:
"A shield turns arrows too." This gives Thornwood's Wardens a visible job against Flame Archers.
It costs one addition in `rangedPhase` and a fixture test.

**Hit locations: not as a rule.** The presentation already sends "a head with its helmet" flying
on brutal kills (battle-design S2.9). That keeps the location flavor where it reads, at no rule
cost.

---

## 5. Weapons

### 5.1 Fields and examples [D6]

Every Dom weapon has damage, attack and defense modifiers, length, number of attacks, ammunition,
and flags (strength added, two-handed, slash/pierce/blunt, AP, AN, charge, bonus, unrepellable,
element, magic).

| Weapon | Dmg | Att | Def | Len | Flags |
|---|---|---|---|---|---|
| Spear | 3 | 0 | 0 | 3 | pierce |
| Pike | 5 | 0 | −1 | 5 | two-handed, pierce |
| Lance | 6 | +1 | 0 | 3 | charge, unrepellable, one use (ammo 1) |
| Light Lance | 3 | 0 | 0 | 3 | charge |
| Broad Sword | 6 | +1 | +1 | 1 | slash |
| Axe | 8 | 0 | −1 | 1 | slash |
| Maul | 9 | 0 | −1 | 2 | two-handed, blunt |
| Great Club (Troll) | 7 | 0 | +1 | 2 | two-handed, blunt |
| Bite | 2 | 0 | −1 | −1 | bonus |
| Hoof / Claw / Tusk | 0 | 0 | 0 | −1 / −1 / 0 | bonus |
| Composite Bow | 8 | +1 | 0 | 0 | two-handed, ammo 12 |

**Frequencies, Dom6** *(computed over the 554 weapons units carry)*: armor piercing 72 (13%),
armor negating 62 (11%), bonus (natural) 200 (36%), two-handed 101 (18%), charge 12 (2%), more
than one attack 21 (4%), ranged with ammunition 93 (17%). Length: −1: 81, 0: 202, 1: 124, 2: 48,
3: 73, 4: 20, 5: 6. Most carried: fist, quarterstaff, dagger, broad sword, javelin, bite, spear.

### 5.2 Rules [M6]

- **Length and repel:** a defender with a longer weapon strikes first; on a hit, the attacker
  rolls `morale + DRN − length difference` against `10 + DRN + margin / 2` or aborts. "Using long
  weapons against low-morale troops is very effective." Size 6+ add 1 length.
- **Multiple weapons** cost attack equal to the sum of their lengths, plus 1 encumbrance each;
  bonus weapons (bite, hoof) cost nothing.
- **Damage types:** blunt +25% on head hits; slash +25% after protection and severs limbs on
  big hits; pierce −15% protection, which stacks with AP for −65%. Two-handed weapons add 125% of
  strength.
- **Charge:** the lance strikes once; magic weapons hit ethereal units normally (section 7).

### 5.3 Fluid Magic today

`WeaponDef { name, dmg, range?, ammo?, element?, armorPiercing?, armorNegating?,
firstRoundBonus? }`. Every weapon strikes once per melee round at a random engaged target. The
Wolf Rider's bite is a second weapon, the same as Dom's bonus weapon. The pretender draft adds
`strikes` and `maxTargetSize` (N2).

### 5.4 Proposal for FM (R4a)

**Reach cancels charge (M1-should).** `WeaponDef.reach?: true` on spears, halberds, and pikes.
Rule: "A charge bonus does not apply against a target that holds a reach weapon." It costs one
check in `meleePhase` (`bonus = target has reach ? 0 : firstRoundBonus`) and no new draws. The
numbers show it matters (my simulation of FM's DRN; kill chance of one Ash Rider lance hit,
str 11 + 6 + 3):

| Target | With charge | Charge cancelled |
|---|---|---|
| Thorn Militia (prot 2, hp 10, Spear) | 0.91 | 0.83 |
| Warden (prot 6, hp 11, Sword) | 0.74 | — (no reach) |
| Briar Guard (prot 9, hp 12, Halberd) | 0.46 | **0.26** |

This tells a story ("the halberds held"), stays in one sentence, and makes Thornwood's slow
heavy line a hard counter to Cinder Horde cavalry. It is Dom's repel reduced to its outcome.

**Keep out of the rules:** slash/pierce/blunt modifiers, two-handed strength scaling, and
multiple-weapon penalties. The presentation already gives every weapon its motion, weight, and
sound family (battle-design S2.2), which is where players notice weapon type. FM expresses "piercing"
with the existing `armorPiercing` flag where it matters (crossbows, picks).

**Magic weapons (M2).** `magic?: true`, implied by any element other than physical, is needed
only once ethereal exists (section 7).

---

## 6. Resistances and elemental damage

### 6.1 Dominions [M6][D6]

- **Rule:** resistance subtracts like protection, then cuts the remainder by twice the
  resistance as a percent; 50 is immunity. The manual's Pillar of Fire example: 46 fire damage,
  protection 5 (AP) + fire resistance 15 + DRN 6 = 26, a difference of 20, reduced 30%: 14.
- **Side effects:** fire may set a unit burning; cold may freeze it (fatigue); poison is spread
  over rounds and saps attack and defense; shock may stun.
- **Weakness:** negative values, from data: Troll fire −10, Jotun Huskarl shock −5.
- **Where resistances come from:** body (Cyclops fire 15, Ghost cold 25 and poison 25, Longdead
  cold 15 and poison 25), blessings ("Fire 2: Fire Resistance", "Water 2: Cold Resistance",
  "Nature 2: Poison Resistance" [M3]), and items (Ring of Fire FR +15, Golden Hoplon FR +15
  [M10]).
- **Frequency** *(computed)*: fire 16%, cold 23%, poison 25%, shock 7% of records.

### 6.2 Fluid Magic today

Six elements (`physical, fire, nature, cold, holy, decay`). Weapons and spells carry one, and
`damage` events log it, but nothing reads it (G5). `docs/02` already writes element-against-type
interactions for M2: Sunlance does "double vs undead", Banish hits "undead only". The pretender
draft lists "element resistances" as M2 and makes its breath color "mechanical" then.

### 6.3 Proposal for FM (R3)

- `UnitDef.resist?: Partial<Record<Exclude<Element, 'physical'>, number>>` → `CombatStats.resist`.
- **Rule:** for a hit of element e, damage base −= `resist[e]`; negative values add. Applied in
  `rollDamage` for weapons, spells, fire shields, and abilities alike. **No percentage step**: the
  Dom two-step formula does not fit in one sentence.
- **Sentence:** "Fire resistance 5: fire hits deal 5 less. Fire −5: 5 more."
- **Glyphs:** the element's shape plus a ▲ (resists) or ▼ (weak) mark, never color alone.

**Why it earns its place in M1:** the two M1 nations are fire and forest. My simulation of FM's
DRN (mean damage per hit) shows the hook:

| Hit | Without | With resistance |
|---|---|---|
| Fireball 10 against Treant prot 12 | 1.56 (31% wound) | fire −5: 4.26 (68%) |
| Fireball 10 against Oakheart prot 10 | 2.42 (46%) | fire −3: 4.27 (68%) |
| Fireball 10 against Salamander prot 8 | — | fire +10: 0.39 (8%) |
| Fireball 10 against Flamebrand prot 6 | — | fire +5: 1.96 (39%) |

Wood burns and fire-born shrug it off. The matchup gets a story that the presentation already
draws: wood and sap materials, ember blood. Suggested starting data, tuned in Phase 12: Treant
fire −5, Oakheart fire −3, Salamander fire +10, Fire Sprite fire +10, Ash Colossus fire +10,
Flamebrand fire +3. **This needs an owner decision** because the pretender draft defers
resistances to M2. Adopting them in M1 also makes D6 breath colors real at once.

**AI.** Army-strength and spell-target estimates (docs/08) must fold resistances in. Otherwise
the AI fireballs treants and salamanders alike. It is one term in the expected-damage helper.

---

## 7. Special abilities: one catalog

### 7.1 The abilities, mapped

Mechanism kinds, which match the pretender draft:
- **tag:** a boolean with a rule in the sim.
- **stat:** a number folded at setup (`statsFor`).
- **weapon:** a weapon property.
- **trigger:** a pretender-draft N1 `UnitAbility` that fires `docs/02` primitives at
  `battleStart` or `eachRound`.

| Ability | Dominions rule | Dom6 share *(computed)* | FM today | FM sentence | Kind | Verdict |
|---|---|---|---|---|---|---|
| **Trample** | Larger unit runs over smaller; defense vs 3d6; 7 + size AP; always hits mounts [M4][M6] | 2.7% | Pretender N2 (Primordial, Elder Wyrm) | "Tramples up to N small foes each round." | weapon (`strikes`, `maxTargetSize`) | **M1**, shared. Add to the Giant and to an M2 elephant |
| **Fear** | Lowers morale in an area; squads check vs 10 (+1 per 5 fear) [M4] | 7.8% | Pretender draft: Primordial Fear 2 (battleStart debuff) | "Fear 2: enemies fight at −2 morale." | trigger (`debuff` mor, optional `moraleShock` for the check) | **M1**, shared |
| **Awe** | An attacker must pass morale vs 10 + awe to strike it this round [M4] | 2.8% | none | "Awe 2: foes must pass a morale roll against 12 to strike it." | tag+number, one roll per attack on that target | **M2** (White nation, pretenders) |
| **Ethereal** | 75% of non-magic strikes miss; passes walls [M4] | 5.7% | none | "Ethereal: three of four mundane blows pass through it." | tag + weapon `magic` | **M2** (Black ghosts) |
| **Regeneration** | Heals HP each round; lowers affliction chance; not inanimate [M4] | 2.8% | `regeneration` (fraction a round) | "Regenerates 10% of its HP each round." | stat | Have |
| **Berserk** | Goes berserk when wounded if it passes morale vs 12; never routs; bonus to stats [M4] | 3.1% | `berserk` below half HP: +2 att/str, never routs | "Below half HP it rages: +2 attack and strength, and it never flees." | tag | Have (FM drops the morale gate; simpler) |
| **Flying** | Map move cost 3 in any terrain; crosses rivers; reaches anywhere [M5] | 11.8% | closes in round 2 | "Flies: reaches the enemy in round 2." | tag | Have; map: M2 (ignore terrain day cost) |
| **Stealth** | Moves unseen; a commander sneaks only with all-stealthy troops [M5] | 17.4% | `stealthy` (hidden commanders) | "Unseen by enemies while it leads only stealthy troops." | tag | Have |
| **Siege** | Reduction = str² (fliers double); siege bonus items and units [M6] | 2.1% have a bonus | `sum(str)/10` a day | "Strong units batter walls faster." | — | Option: str²/100 makes a giant (str 18) worth 3.2 men instead of 1.8 (M2) |
| **Forest / mountain / swamp / waste survival** | −2 to that terrain's move cost [M5] | 20.6 / 10.1 / 5.2 / 9.1% | `swampwalker` (no swamp attack penalty) | "Forestborn: marches through forest as fast as plains." | tag list `walker: TerrainId[]` | **M2**: generalize `swampwalker`; affects leg days (`docs/09` table) and battle terrain penalties |
| **Undead** | Needs undead leadership; banishable; no disease [M4] | 9.5% | tag: eats no supply | "Undead: eats nothing; holy fire burns it." | tag | Have; rules with the M2 Black nation |
| **Mindless** | Morale 50 with a commander; dissolves (33% a turn) without one [M6] | — | tag with no rule (G3) | "Mindless: never flees, but crumbles if its commander falls." | tag | **M1-should**: a 1-sentence rule for Fire Sprites and Hornet Swarms, or drop the tag |
| **Inanimate / lifeless** | Immune to disease, drain, healing, many spells [M4] | 8.6% | `construct` (no supply) | "Construct: eats nothing; cannot be healed." | tag | Have; heal immunity with M2 |
| **Magic being** | Needs a mage leader; routs without [M4] | 10.8% | none | — | — | Skip (FM leadership is one kind) |
| **Sacred** | Blessed; holy cost [M3][M4] | 27.8% have a holy flag | `sacred`: bless, half upkeep, Sanctity morale | "Sacred: receives your god's blessing." | tag | Have |
| **Recuperation** | Heals afflictions over time [M4] | — | none | — | — | Only with afflictions (section 8) |
| **Fire shield** | Burns melee attackers | 1.0% | `fireShield` per hit, N4 adds `shieldElement` | "Fire shield 5: strikers take 5 fire per blow." | stat | Have |
| **Poison barbs** (`poisonarmor`) | Poisons melee attackers | 0.7% | via N4 (`shieldElement: 'nature'`) | "Thorns 3: strikers take 3 nature per blow." | stat | Have via N4: Briar Guard's thornplate is the natural fit (M1 content option) |
| **Heat / cold aura** | Fatigue clouds around the unit [M4] | 2.3 / 2.6% | Pretender draft Living Flame (eachRound damage) | "Heat aura: scorches the enemy front each round." | trigger | Shared, pretender *should* |
| **Spirit sight** | Sees invisible units [M4] | — | none; nothing invisible | — | — | Skip until invisibility exists (M2 Blue illusions) |
| **Darkvision** | Reduces darkness penalties (night −3, Utterdark −6) [M5] | 15.4% | none; no darkness | — | — | Skip |
| **Standard / Inspirational** | Squad morale bonus; commander morale per level [M4][M6] | 0.5% / 2.5% | none | "Inspiring: its squads gain +1 morale." | stat on commanders | **M2**, cheap; a fit for heroic abilities (section 9) |
| **Animal** | Half supply; worse at sieges [M4] | 9.7% | `beast` (Wild discount) | "Beast: eats half." | tag | Option with supply by size (R1) |
| **Immortal / dominion immortal** | Reforms on death [M3] | 1.7% / 0.2% | Pretender N8 Undying | "Undying: rises again at the capital in 90 days." | chassis | Shared, pretender |
| **Swallow, petrification, horror marks, clouds, disease, glamour** | various [M4][M6] | rare | none | — | — | Skip: each needs a new state and a paragraph |

### 7.2 One catalog for troops, items, and pretenders (R5)

The pretender draft already models abilities as data (N1 to N6). This research adds troop tags,
resistances, and weapon properties. The sentence, glyph, and Codex text for each should live in
**one place**, so the card, the tooltip, and the Codex cannot drift apart:

```ts
// src/content/abilities.ts (sketch)
export type AbilityKind = 'tag' | 'stat' | 'weapon' | 'trigger';
export interface AbilityDef {
  id: string;            // 'trample', 'fear', 'flying', 'resist.fire', 'reach', 'charge', ...
  name: string;          // 'Trample'
  kind: AbilityKind;
  glyph: string;         // a shape id from the color-blind-safe glyph set, never a color alone
  oneLine: string;       // <= 120 chars, the sentence shown at L1; may template a number: 'Fear {n}: ...'
  codex: string;         // the full rule text for L4, with the numbers from content
  milestone: 'M1' | 'M2';
}
export const ABILITIES: Record<string, AbilityDef> = { /* ... */ };
```

**Content validation**, extending `tests/content`:
- Every unit tag, every non-zero ability stat (`regeneration`, `fireShield`, `resist.*`), every
  weapon property (`armorPiercing`, `armorNegating`, `firstRoundBonus` as `charge`, `reach`,
  `strikes`), and every `UnitAbility.id` resolves to an `ABILITIES` entry.
- `oneLine` is at most 120 characters.
- No entry is unused.

Items (commander equipment) reuse the same entries when they grant an ability.

---

## 8. Afflictions and battle wounds

### 8.1 Dominions [M4][M6]

- **Chance:** the share of max HP lost in one blow ("an infantry unit with ... 10 hp will have a
  20% chance of suffering an affliction upon taking 2 hp damage"). A major affliction's chance is
  that share / 1.5, at most 33%. The location matters:

  | Location | Minor | Major |
  |---|---|---|
  | Any | Battle Fright | Profuse Bleeding (the only temporary one) |
  | Head | Eye Loss, Dementia, Mute | Feeblemindedness, Blindness |
  | Chest | Chest Wound | Diseased, Never-Healing Wound |
  | Arm | Weakened | Lost an arm |
  | Leg | Limp | Crippled |

- **Marching:** a limping troop has a 25% chance to become crippled when its army marches more
  than one province in a month. A crippled troop dies 35% of the time when its army marches, 70%
  if it marches more than one province.
- **Healing:** Recuperation, immortals reforming, Healer units, Gift of Health, the Chalice, a few
  sites. Undead and inanimate units usually cannot heal.
- **Tooling:** the army screen has a hotkey to "select all units with afflictions ... so that
  holes do not open up in your squads" [M4].
- **Effects** (Dom5 wiki): Chest Wound adds encumbrance and lowers strength; Never-Healing Wound
  cuts max HP by 20%; Diseased stops healing and adds afflictions [S8] *(excerpt)*.

**Sentiment.** In Dom6, "healing afflictions is very very rare". Regeneration "divides the
chance" but does not heal [S7] *(excerpt)*. A high-HP god in hostile dominion "can pick up
several afflictions quickly" [S9] *(excerpt)*. Players mitigate rather than heal: "Mirror Image,
Luck, Awe and Fear, and decent armour including headwear" [S9] *(excerpt; Quarter to Three, via
search)*. The flavor is real: a one-eyed general is a story. The cost falls on troops: a whole
screen of sorting and permanent losses from marching.

### 8.2 Fluid Magic today

Survivors keep their wounds in the squad's HP pool (`docs/04` "After the battle"), and fed troops
heal 2% of max HP a day (`docs/09`). There are no per-troop identities, so per-troop afflictions
cannot exist without new state.

### 8.3 Proposal (R10, M2)

- **Commanders only.** They are named, persistent, and few.
- **Trigger:** a single blow that removes at least 40% of the commander's max HP gives one
  affliction, at most one per battle. One rng draw picks it from the four below, for which every
  hit location qualifies. This keeps Dom's "big blow, lasting scar" logic without zones.
- **Four afflictions, one sentence each:**

  | Affliction | Effect |
  |---|---|
  | Lost an Eye | −2 precision, −1 attack |
  | Limp | map speed −1 |
  | Weakened Arm | −2 strength |
  | Battle Scars | max HP −10% |

- **Healing:** each affliction heals after 60 days in a province with an own temple, or at once
  with any regeneration of 10% or more (Green's Evergreen bless, the Wild Spirit). The path is
  visible on the tooltip: "Heals in 41 days (temple)".
- **Never on troops**, and no death on the march.
- **Tests:** threshold, one per battle, healing timers, determinism.
- **UI:** a red cross-shaped glyph with a number on the portrait (L0); hover lists them (L1).

---

## 9. Experience and heroic abilities

### 9.1 Dominions [M4][M6]

- **XP:** 1 XP a month, 4 for a won battle, 1 for a retreat (at most once a month), and 1 per
  melee strike.
- **Stars:**

  | XP | Att | Def | Prec | Str | HP | Enc | MR | Mor | Leadership |
  |---|---|---|---|---|---|---|---|---|---|
  | 15 | +1 | +1 | +1 | | | | | +1 | +25 |
  | 50 | +1 | +1 | +1 | | | | | +1 | +50 |
  | 100 | +1 | +1 | +1 | +1 | +1 | | | +1 | +50 |
  | 200 | +1 | +1 | +1 | | +1 | −1 | | +1 | +50 |
  | 400 | +1 | +1 | +1 | +1 | +1 | | +1 | +1 | +50 |

  The army screen selects "all units with 2+ experience stars" to build "elite squads of
  experienced troops that will have higher morale" [M4].
- **Hall of Fame:** non-pretender commanders with the most kills and experience enter it and gain
  a permanent heroic ability. In one Dom3 Let's Play, a scout-prophet earned Heroic Strength and
  a priest-mage Iron Will [S9] *(excerpt)*.

### 9.2 Fluid Magic today

None. Commanders are persistent entities with names (`CommanderState.name`); squads are HP pools.

### 9.3 Proposal (R9)

- **M1 hook (no rule):** add `battles` and `kills` counters to `CommanderState`, written by
  `applyBattle`, and show "veteran of 4 battles, 23 kills" on the commander panel. This needs a
  save migration and a determinism hash test. It gives named heroes a history at almost no cost.
- **M2 renown:** ranks at 3, 8, and 15 battles, each +1 att, def, and mor, shown as stars on the
  portrait. At rank 3, one heroic ability is drawn with `state.rng` from a short catalog list
  (Inspiring +1, Heroic Strength +3, Iron Will mor 50, Swift map speed +1), logged as a message.
- **Squad veterancy (M2, optional):** a squad rank 0 to 2 after 2 and 5 battles survived, +1 mor
  per rank. When squads merge, the lower rank wins; a split keeps the rank. The rule is simple,
  but it touches merge and split commands and validation.

---

## 10. Items as they touch the unit

### 10.1 Dominions

- **Slots follow the body.** The humanoid layout is 2 hands, head, body, feet, and 2 misc (72.5%
  of records). 12.7% of records (beasts, mounts, many monsters) have only the 2 misc slots: a
  Great Bear cannot hold a sword *(computed from [D6])*. A mounted commander's feet slot is
  disabled while mounted, and its mount has a barding slot [M4].
- **Standard gear stays.** "The unit's standard items cannot be removed, and when the new item is
  withdrawn, the standard item re-appears" [M4].
- **Item stats use the same vocabulary as units:**
  - Magic weapons: Fire Sword dmg 10; Sword of Sharpness 10 AP; Snake Bladder Stick 64 AN with
    strength not added.
  - Armor: Blacksteel Plate prot 17, def −1, enc 2, HP +4.
  - Helmets: Dragon Helmet prot 22, morale +4, FR +5, darkvision.
  - Boots: Boots of the Behemoth give Trample; Winged Shoes give Flying.
  - Misc: Ring of Fire FR +15; Pendant of Courage morale +5.
  - Barding: Knight's Barding prot 20, HP +8.

  Forging costs 5 to 70 gems by path level [M10]. Items **grant abilities from the same list**
  (Trample, Flying, Fear, Awe, resistances). That is why one catalog (R5) serves both.
- **Sentiment.** Building a "thug" (a commander kitted to fight alone) is a loved subgame with
  community guides; players tailor items "against the things that your opponent is bringing"
  [S11] *(excerpt)*. Distributing items across many commanders is the tedious part [S4]
  *(excerpt)*.

### 10.2 Implications for FM's item design (pointer, not the design)

- Items only for commanders, with slots from the body: humanoid weapon, armor, head, and 1 misc;
  beasts misc only. Few slots keeps juggling small.
- Items are `GearDef` entries (section 4.4) with a forging cost, and they grant `AbilityDef` ids.
  The sprite shows the item on the body's layer, so a magic sword is visible in battle.
- An item replaces the standard piece in its slot and the standard returns when it is removed
  (Dom's rule), so a body's base stats never need bookkeeping.

---

## 11. Flavor per unit of complexity

### 11.1 Scores

- **Flavor (F):**
  - 3: changes what you recruit or how a battle reads in the replay, and is visible on the sprite
    or card.
  - 2: noticeable in some matchups.
  - 1: rarely noticed.
- **Cost (C):**
  - 3: new persistent state, per-troop identity, or a new screen.
  - 2: a new rule or roll in the resolver plus a new concept for players.
  - 1: a stat fold or content only.

These are my judgments, informed by the evidence cited in each section.

| Rank | Element | F | C | Evidence | FM verdict |
|---|---|---|---|---|---|
| 1 | Unit descriptions that explain the stats | 3 | 1 | Dom descriptions justify odd stats [D6-desc] | **M1** content (R7) |
| 2 | Size ladder: sprite scale, supply, blow weighting | 3 | 1 | 8 size rules in Dom; HP curve [M6][computed] | **M1** (R1) |
| 3 | Gear lists composing prot, def, materials; visible layers | 3 | 1 | Dom loadouts, cost from equipment [D6][M4]; `docs/09` layers | **M1** (R2) |
| 4 | Elemental resistance and vulnerability | 3 | 1 | 16 to 25% of Dom records; weakness in lore [D6] | **M1-should** (R3) |
| 5 | Fear (morale debuff) | 3 | 1 | 7.8%; pretender draft | **M1**, shared |
| 6 | Charge and reach | 2 | 1 | Repel rule [M6]; kill chance 0.46 → 0.26 | **M1-should** (R4a) |
| 7 | Shields against arrows | 2 | 1 | Missile defense uses parry ×2 [M6] | **M1-should** (R4b) |
| 8 | Trample | 3 | 2 | Elephant tactics [S10]; pretender N2 | **M1**, shared |
| 9 | Regeneration, fire shield, berserk, flying, stealth, sacred | 3 | 1 | Common Dom vocabulary | Have |
| 10 | Commander battles and kills shown | 2 | 1 | Hall of Fame stories [S9] | **M1 hook** (R9) |
| 11 | Separate mount HP | 3 | 2 | Dom6 headline feature [S1][M6] | **M2** (R8 option B) |
| 12 | Awe, ethereal | 3 | 2 | 2.8% and 5.7%; need W and B nations | **M2** |
| 13 | Commander renown and heroic ability | 3 | 2 | Hall of Fame [M4][S9] | **M2** (R9) |
| 14 | Terrain walkers (survival) | 2 | 2 | 21% have forest survival [D6] | **M2** |
| 15 | Commander afflictions (4 kinds, healable) | 2 | 3 | Flavor real; healing rare is the complaint [S7] | **M2** (R10) |
| 16 | MR against resisted spells | 2 | 2 | [M7] | **M2** (R6), hide in M1 |
| 17 | Squad veterancy | 2 | 3 | elite squads [M4] | **M2**, optional |
| — | Hit locations per blow | 1 | 3 | Zone math is a click deep even in Dom [M4] | Skip; presentation only |
| — | Slash/pierce/blunt rules | 1 | 2 | invisible on the card | Skip; motions and sounds only |
| — | Encumbrance and troop fatigue | 1 | 3 | fatigue rules are hidden penalties [M6] | Skip; heavy armor already costs map speed |
| — | Harassment, armor-defeating hits, shield breakage | 1 | 2 | hidden rules [M6] | Skip |
| — | Troop afflictions, marching deaths, disease, age | 2 | 3 | the main tedium [M4][S7] | Skip |
| — | Darkvision, spirit sight | 1 | 2 | need darkness and invisibility first | Skip for now |

### 11.2 What players find tedious, and FM's guard against each

| Tedium | Evidence | FM guard |
|---|---|---|
| Afflictions that rarely heal; sorting limping troops out of squads | "very very rare" healing [S7]; the hotkey exists to find them [M4] | No troop afflictions; commander afflictions heal on a visible timer (R10) |
| Handing items to dozens of commanders | "1-6 magical items ... to >60 units" [S4] *(excerpt)* | Items only for commanders, few slots; the commander panel shows empty slots and the best item in the stash |
| Hours of late-game orders | a Dom3 Let's Play spent "half an hour to an hour" on orders [S9] *(excerpt)* | FM's continuous time with pause (`docs/00`) and default scripts; no per-squad orders beyond the row |
| Cryptic UI, menus of menus, jargon | [S5][S6][S12] *(excerpts)* | Every term is an L2 concept tooltip; every ability has one sentence (R5) |
| Needing an external inspector to see real numbers | the Data Inspector is the community's lookup [S14] *(excerpt)* | The Codex shows content numbers and breakdowns from sim selectors |
| Damage bars that do not scale with max HP | a 2017 thread: a dragon and a small hero look alike [S12] *(excerpt)* | HP bars are relative per unit, and the hover shows absolute HP |
| Hidden penalties (harassment, fatigue thresholds, armor-defeating hits) | rules exist only in the manual [M6] | No hidden rule: if it changes a roll, it appears in the per-blow detail (battle-design S1.3) and in the Codex |

---

## 12. Readability: layers and the "earn its place" test

**The test** every proposed stat or ability passes before it lands:
1. It changes a decision: what to recruit, whom to bring, where to fight, what to cast.
2. It fits one sentence of at most 120 characters (`AbilityDef.oneLine`).
3. It is visible: on the sprite, on the card, or in the replay's per-blow detail.
4. It adds at most one rng draw per blow, and none when the unit lacks it.
5. The AI can evaluate it with the same numbers (docs/08).
6. A stat with no rule is not shown (G2: MR).

**Layers** (UI spec L0 to L4; `UnitCard` at three depths):

| Element | Card (L0) | Hover (L1) | Concept (L2) | Codex (L4) |
|---|---|---|---|---|
| Size | sprite scale; count badge | "Size 4: eats 4, draws 4× the blows" | Size | the ladder table |
| Gear | armor, helmet, and shield silhouettes on the sprite | "prot 9 = thornplate 7 + iron cap 2"; materials by piece | Protection, Shield | full gear list with sprites |
| Weapons | weapon on the sprite | dmg, plus property chips: AP, AN, Charge +3, Reach, Trample 2 | each chip | weapon table |
| Resistance | up to 2 element glyphs with ▲ or ▼ | "Fire −5: fire hits deal 5 more" | Element | per-element table |
| Abilities | up to 3 glyphs, then "+N" | each glyph's `oneLine` | the ability | `codex` text with numbers |
| Mount | rider rig | "Mounted on an Ash Horse (hoof 2)" | Mounted | mount stats |
| Renown (M2) | stars on the portrait | battles, kills, rank bonuses | Renown | history |
| Afflictions (M2) | cross glyph with a count | each with its effect and time to heal | Affliction | list and healing paths |
| Description | — | first sentence | — | full text |

**Glyph rules:** each element has a shape (flame, snowflake, leaf, skull, sun). Resist and
weakness use ▲ and ▼ plus a warm or cool tone, never hue alone (the UI spec's rule for signed
deltas).

---

## 13. Where it lands in FM

| Change | Files | Tests | Phase |
|---|---|---|---|
| `AbilityDef` catalog; validation that every tag, stat, property, and trigger resolves | `src/content/abilities.ts`, `src/content/validate*.ts` | content validation: coverage, oneLine length, no orphans | with pretender 6b.2, or Phase 8 |
| `description` required on units | `src/content/units/*.ts`, `src/content/types.ts` | content validation | Phase 8 |
| Gear registry; `gear` and `natural` on units; prot, def, and materials checks | `src/content/gear.ts`, units, validation | content validation; fixtures per unit (CLAUDE.md) | Phase 8 (Codex), art in Phase 11 |
| `CombatStats.size`; size-weighted target draw | `battle/types.ts`, `battle/setup.ts`, `battle/attacks.ts` | weighting statistics; golden record update; determinism | pretender 6b.2 (adds size) or a battle phase |
| Supply by size | `rules.ts` `SUPPLY`, `commanders.ts` `supplyOf` | supply per size; starvation fixture | Phase 12 with the supply retune |
| Mounted size 2 and `mount` block | units, `types.ts` | fixtures | Phase 8 |
| `resist` per element | `types.ts`, `setup.ts`, `attacks.ts` (`rollDamage`), `effects.ts`, fire-shield burns | resist and vulnerable math; spell and weapon paths; AI estimate | M1-should (owner) |
| `reach` cancels charge | `types.ts`, `attacks.ts` | charge against reach and non-reach targets | M1-should |
| `shieldDef` against missiles | `types.ts`, `attacks.ts` `rangedPhase`, units | missile hit chance with and without shield | M1-should |
| `mindless` rule or drop the tag | `morale.ts` or units | dissolution without a commander, deterministic | M1-should |
| Hide `mr` on cards | UI only | UI smoke | Phase 8 |
| Commander `battles`, `kills` | `sim/types.ts`, `battle/apply.ts`, save migration | counters, hash | Phase 9 |
| M2: mount HP layer, awe, ethereal, magic weapons, walkers, renown, afflictions, MR checks | per section | per rule | M2 |

**Determinism.** Every new roll draws from `state.rng` inside the resolver's existing order
(attacker side first, setup order, member order, weapon order). A unit without the feature draws
nothing extra. The size-weighted target draw replaces `randBelow(n)` with `randBelow(totalSize)`:
still one draw.

**No numbers in sim code.** Size weights, the resistance sign convention, the reach and charge
interaction, and the supply-by-size table go into `content/rules.ts` constants (`BATTLE`,
`SUPPLY`). Per-unit numbers stay in unit and gear content.

---

## 14. Open questions for the owner

1. **Resistances in M1 or M2?** M1 gives the fire-against-forest matchup a visible story (wood
   burns, embers resist) and makes pretender breath colors real; the pretender draft has them in
   M2.
2. **Supply by size** makes giants and mounted units hungrier (4 and 2). That is good for
   "giants to horses", but it touches the supply balance already flagged in `docs/09`. Adopt it
   in Phase 12?
3. **Mounts:** is a named mount with shared HP enough for M1 (option A), with separate mount HP
   in M2 (option B)?
4. **Commander history** (battles and kills) in M1 as a pure display, with renown in M2?
5. **`docs/03` "formation space"** for size 3+: drop the claim (recommended) or design a frontage
   rule?

---

## Sources

**Dominions 6 manual** (community transcription of the official manual, dmacguigan/dom6-manual;
read from the raw Quarto sources):
- [M2] Ch. 2, The Basics (upkeep, supply). https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html (source https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/02-the-basics.qmd)
- [M3] Ch. 3, The Pretender (blessings giving resistances, immortality). https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html
- [M4] Ch. 4, Units (attributes, special abilities, unit classes, XP, heroic abilities, afflictions, recruitment costs, inventories). https://dmacguigan.github.io/dom6-manual/chapters/04-units.html
- [M5] Ch. 5, Movement (map move, survival, flying, stealth, darkvision). https://dmacguigan.github.io/dom6-manual/chapters/05-movement.html
- [M6] Ch. 6, Combat (squares and size, melee, shields, hit locations, weapon types, repel, mounted units, missiles, special damage, morale, afflictions, sieges). https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html
- [M7] Ch. 7, Magic (penetration against magic resistance). https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html
- [M10] Ch. 10, Magic Items (forging costs, item stat tables by slot). https://dmacguigan.github.io/dom6-manual/chapters/10-magic-items.html (source https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/10-magic-items.qmd)

**Game data** (Dominions Data Inspector dumps, larzm42):
- [D6] Dom6: `gamedata/BaseU.csv`, `weapons.csv`, `effects_weapons.csv`, `armors.csv`, `protections_by_armor.csv`, `BaseI.csv`; flag bits decoded with `scripts/DMI/MWpn.js`. https://github.com/larzm42/dom6inspector/tree/master/gamedata
- [D6-desc] Dom6 unit descriptions, `gamedata/unitdescr/0022.txt` (Knight), `0840.txt` (Jotun Huskarl), `3540.txt` (War Elephant), `3517.txt` (Destrier), `0156.txt` (Cyclops), `0191.txt` (Longdead), `0566.txt` (Ghost), `0018.txt` (Militia). https://github.com/larzm42/dom6inspector/tree/master/gamedata/unitdescr
- [D5] Dom5: `gamedata/BaseU.csv`. https://github.com/larzm42/dom5inspector/tree/master/gamedata

**Search excerpts** (pages not fetched; WebFetch had no DNS and the proxy refused these hosts):
- [S1] Steam store, Dominions 6 ("riders and mounts now have separate stats and can be targeted individually"). https://store.steampowered.com/app/2511500/ *(excerpt)*
- [S2] illwiki, Mounted (Dom6), targeting odds and the change around 26 August 2024. https://illwiki.com/dom5/dom6/mounted *(excerpt)*
- [S3] Wargamer, Dominions 6 review ("over 80 nations", "hundreds of magic items and spells", "thousands of different units"). https://www.wargamer.com/dominions-6/review *(excerpt)*
- [S4] Quarter to Three, "Dominions 5: Warriors of the Faith" thread (items "to >60 units"); the search named pages 3, 16, and 46. https://forum.quartertothree.com/t/dominions-5-warriors-of-the-faith/131532?page=16 *(excerpt)*
- [S5] Vaporlens, Dominions 5 review summary ("no tutorial and cryptic UI", "excessive micromanagement", huge variety). https://vaporlens.app/app/722060/dominions_5_warriors_of_the_faith *(excerpt)*
- [S6] Quarter to Three, same thread ("menus of menus", "wide" rather than deep, "every unit is simulated, and wounds carry over"); the search named pages 4, 6, and 12. https://forum.quartertothree.com/t/dominions-5-warriors-of-the-faith/131532?page=4 *(excerpt)*
- [S7] Steam, Dominions 6 discussion on healing afflictions ("very very rare"). https://steamcommunity.com/app/2511500/discussions/0/4203616776861027901 *(excerpt)*
- [S8] illwiki, Disease and afflictions (Dom5). https://illwiki.com/dom5/disease *(excerpt)*
- [S9] Let's Play Archive, Dominions 3 by Lilli et al.: Update 09 (afflictions scale with max HP), Update 57 (Hall of Fame heroic abilities); Dominions 3 Update 82 (time spent on orders). https://lparchive.org/Dominions-3-(by-Lilli-et-al)/Update%2009, https://lparchive.org/Dominions-3-(by-Lilli-et-al)/Update%2057, https://lparchive.org/Dominions-3/Update%2082 *(excerpts)*
- [S10] Steam, Dominions 5 discussions on trample and elephants. https://steamcommunity.com/app/722060/discussions/0/1738886981657075955 and https://steamcommunity.com/app/722060/discussions/0/1621724915773937048 *(excerpts)*
- [S11] illwiki, Baalz, "Zen and the Art of Thugging"; Steam Dom5 thug thread. https://illwiki.com/dom5/baalz-zen, https://steamcommunity.com/app/722060/discussions/0/3220528325734118996 *(excerpts)*
- [S12] illwiki beginner's guide (jargon); Steam Dom5 thread on the unit screen's bars. https://illwiki.com/dom5/_export/xhtml/beginner-s-guide, https://steamcommunity.com/app/722060/discussions/0/1736589520010564593 *(excerpts)*
- [S13] Steam store, Dominions 3 ("1500 different units, 600 spells and 300 magic items"); MacTech, Dominions 4 launch (historical and mythological troops). https://store.steampowered.com/app/248510, https://www.mactech.com/2013/12/16/dominions-4-fantasy-strategy-game-launches-on-steam *(excerpts)*
- [S14] Steam, the Dom6 Data Inspector thread. https://steamcommunity.com/app/2511500/discussions/0/4132682727131370992 *(excerpt)*
- [S15] Steam, Dominions 5 discussion on heavy armor ("a flat deduction from every damaging hit ... is incredibly powerful"). https://steamcommunity.com/app/722060/discussions/0/1742228532898198919 *(excerpt; the search named this and thread 1750106661717436283)*

**Fluid Magic** (read only, commit `3addf97`): `docs/01-core-rules.md`, `docs/02-magic.md`,
`docs/03-nations.md`, `docs/04-battle.md`, `docs/09-art-direction.md`, `docs/09-balance.md`,
`src/content/types.ts`, `src/content/units/*.ts`, `src/content/rules.ts`,
`src/sim/battle/{attacks,field,morale,setup,types}.ts`, `src/sim/commanders.ts`,
`src/sim/types.ts`. Companion designs: `../pretender-design/design-draft.md`,
`../battle-design/final.md`, `../ui-design/spec-draft.md`, `../ui-design/research-fourx.md`.

**Local working files** (this directory): `web/` (downloaded data and manual chapters),
`tools/units.py`, `tools/gear.py`, `tools/stats.py`, `tools/wstats.py` (the computed figures),
`tools/drn.py` (FM DRN simulations for the damage and kill-chance tables).
