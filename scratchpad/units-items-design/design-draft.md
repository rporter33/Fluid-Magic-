# Unit depth and magic items: design draft

Status: draft, 2026-10-21. Task #30. It is written for review by judges and then for a final
build spec, as the pretender, UI, and battle tracks were. It covers five parts: unit detail (A),
the shared abilities catalog (B), items (C), presentation layers (D), and the plan (E).

**Owner direction (binding).** "The detail stats from giants to horses like Dominions and with
the items are very immersive, added immersion without completely making it over complicated
makes this game very engaging and replayable." Earlier directions still hold:
- battles are visceral and have sound;
- the UI matches similar games, with complexity layered under smart menus;
- magic is flashy;
- the pretender has Dominions-like options and AoW4-level customization.

**Constraints kept.**
- The sim stays pure and deterministic. This design adds no randomness source. A unit or item
  without a new feature draws nothing new, and the one changed draw (U1) uses the same number
  of draws as today.
- Content is data and passes content validation. No number is written in sim code. Every rule
  below names the content constant or field it reads.
- Every command passes `validate` before `apply`, and the AI uses the same commands.
- Every rule has its tests (listed with the rule).
- Symbols are safe for color-blind players: shape, word, and number, never hue alone.
- Everything is placed in an M1 phase or deferred to M2 by name (E.2).
- **Readability first.** Every added stat or rule must earn its place, show in layers (card,
  hover, Codex), and fit one sentence. Section A.1 gives the test each one passed, and A.3
  lists what failed it.

**What this draft is built on.** I read these for this draft:
- the repository at `/home/user/Fluid-Magic-` (commit `3addf97`, Phases 0 to 6):
  - `docs/02`, `docs/03`, `docs/04`, `docs/08`, `docs/09-art-direction`, `docs/09-balance`, and
    `docs/10` in full; `docs/01`, `docs/06`, and `docs/PROGRESS.md` in the sections cited;
  - `src/content/types.ts` and `src/content/units/*.ts`;
  - `src/content/rules.ts` and `src/content/spells/types.ts`;
  - `src/sim/battle/{attacks,field,morale,setup,resolve,targets,effects,types}.ts`;
  - `src/sim/{commanders,conflict,ritualEffects,recruitment,supply,pretender}.ts`;
  - `src/sim/{tick,visibility,rng}.ts` and `src/sim/commands/magic.ts`, in the parts cited;
  - `tests/sim/battle/fixtures.ts`, `tests/sim/battle/resolve.test.ts`, and
    `tests/content/spells.test.ts`;
- the three research notes beside this file:
  - `research-dom-units.md` ("units research", R1 to R10);
  - `research-dom-items.md` ("items research", F1 and R2 to R9);
  - `research-presentation.md` ("presentation research", P1 to P14);
- the sibling designs:
  - the pretender expansion's final, `../pretender-design/final.md`, cited as "pretender A.5"
    and so on. It was assembled at 21:27 from `final-parts/`, which I read. Its N1 to N4 text,
    which the catalog and U1 build on, was re-checked against the assembled file;
  - the UI build spec, `../ui-design/spec-final.md`, cited as "UI spec 5.1";
  - the battle presentation's final spec, `../battle-design/final.md`, cited as "battle
    design S2.2".

**Numbers were measured, not guessed.** I copied the repository into
`proto/` beside this file and added the proposed battle rules there behind switches
(`proto/src/sim/battle/proto.ts`). With every switch off, the copy passes all 136 battle tests
of the repository. Every fight below runs through that copy of the real resolver and the real
test fixtures, 400 seeds per cell unless marked. The repository itself is untouched.

| Script | What it measures | Output | Used in |
|---|---|---|---|
| `proto/measure.ts` | The `docs/04` required tests and 19 matchups under each proposed rule, alone and combined | `proto/measure-2.out.md` | A.11, E.3 |
| `proto/measure-items.ts` | Army items, Titan and Great Wyrm kits, Bark Skin and shield candidates | `proto/measure-items.out.md` | C.5 |
| `proto/measure-items2.ts` | The final-list kits on the Titan and the Great Wyrm | `proto/measure-items2.out.md` | C.5, C.6 |

Rerun them with `cd proto && npx tsx measure.ts 400` (and the same for the other two). Each
takes about 15 seconds.

---

## 0. The design in eighteen lines

1. **Every unit gains a richer card without a richer rulebook.** The new fields are size class,
   role, gear pieces, natural protection, a mount, weapon properties, elemental resistance,
   catalog abilities, and a lore line. Most are content that explains numbers the game already
   has. Four of them are battle rules (lines 2, 3, 5 and 6).
2. **A size ladder from men to wyrms**: Man-sized 1, Large 2, Great 3, Huge 4, Colossal 5,
   Gargantuan 6. Size now does three things. Bigger bodies **draw more blows** (U1), **eat more
   supply** (U2), and **cannot be trampled** by smaller tramplers (the pretender's N2).
3. **"Bigger targets draw more blows."** Each attack still makes one target draw, now weighted
   by the target's size. Fights where every unit is size 1 come out bit-identical, so every
   `docs/04` required test is unchanged (measured).
4. **Horses and wolves are real**: Ash Riders and Wolf Riders become Large (size 2) with a named
   mount (Ash Horse, War Wolf) that owns its natural weapon and its share of materials. The mount
   keeps one HP pool with its rider in M1; separate mount HP is M2.
5. **Armor is built from pieces.** A registry of 13 gear pieces (caps, jerkins, scale, bark
   mail, thornplate, a round shield, and others). Each unit's protection equals its natural
   armor plus its pieces, and its materials cost equals its pieces plus its weapons and mount.
   Validation checks both. Today's numbers do not move: every M1 unit fits exactly (A.5).
6. **"Halberds blunt a charge."** A charge bonus is lost against a troop holding a reach weapon
   (U3). Measured: 10 Ash Riders against 10 Briar Guard go from 55% to 50%.
7. **"Wood burns."** Elemental resistance is one signed number per element, subtracted from the
   damage base (U4). Treants are fire −5, Oakhearts fire −3, Salamanders and Fire Sprites fire
   +10. Measured: it brings the elite Red against Green fight from 72% Thornwood to about 55%.
   This moves resistances from M2 into M1, against the pretender final's E.2; the owner decides
   (E.7 question 1).
8. **Left out, with reasons** (A.9): encumbrance and troop fatigue, hit locations, damage types,
   shields against arrows (measured to push the matchup further toward Thornwood), Giant
   trample (measured too strong for a mountain champion), magic resistance checks, and
   afflictions.
9. **One abilities catalog** (B) serves troops, pretenders, blessings, and items. It has 43
   entries (38 with M1 users, 5 reserved for M2), each with its exact rule, a glyph, a one-line
   text of at most 120 characters, its users, and its tests. The pretender's N1 `UnitAbility`
   becomes the catalog's `trigger` kind with no change to its battle code.
10. **Items are forged, not found.** The `forgeItem` command sends a mage in an own lab to work
    for 10, 15, or 30 days. It needs the item's pips and its research level, and the mana is
    paid when the work begins. Other orders, death, or a retreat end the work and the mana is
    lost, exactly as for rituals.
11. **24 M1 items**: 10 Red, 10 Green, and 4 generic, in three tiers: Lesser at research level 1
    to 2, Greater at 3 to 4, and Artifact at 5. They are built only from stat changes, weapons,
    resistances, catalog abilities, and pip boosters. Each one was checked against measured
    fights.
12. **Five slots, set by the body**: weapon, head, body, and two charms. A wyrm has a head and
    charms, a beast only charms, an idol one charm. Only commanders wear items.
13. **Items add; a weapon item replaces.** Standard gear stays, and the standard weapon returns
    when the item comes off.
14. **The vault and the lab.** Forged and won items wait in the nation's vault. A commander
    standing in an own lab equips or stores them (`equipItem`, `unequipItem`).
15. **Spoils go to the side that holds the field.** A commander who dies in or because of a
    battle leaves every item to the winning side's vault. If Independents win, the items go
    to the province's hoard until a nation takes the province. An eliminated nation's items are
    destroyed. Artifacts are unique and return to the forge when destroyed.
16. **Layers** (D): the card carries at most 3 numbers, 3 glyphs, and 1 element mark. The
    hover holds the whole truth with one-line rules, and Shift shows every source. The Codex
    compares and filters. The commander's Gear tab is a paper doll with deltas on the stat
    rows. Replays draw every piece of gear and mark resisted and braced blows.
17. **Plan** (E): Phase 7b, in three commits after Phase 7 and the pretender's 6b, covers unit
    depth, items, and the AI's forge and equip steps. The UI comes in Phases 8 to 10, the SVG
    gear and item parts in Phase 11, and tuning in Phase 12.
18. **M2**: separate mount HP and unhorsing, shields against arrows, magic resistance checks,
    commander afflictions and renown, the White, Blue, and Black items, field item swaps, item
    history, feet and shield slots, sets.

---

## 1. Decisions

Where the three research notes or the sibling designs disagree, or a measurement changed a
recommendation, this table decides. Section numbers point to the full rule.

| # | Topic | Options seen | Decision | Why |
|---|---|---|---|---|
| D1 | Where size weights the target draw | melee and ranged (units research R1); ranged only (AoW4's "Large Target", [AoW4 data via aow4db](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Units.json)) | **Both (U1)** | One sentence covers both. Measured effects are small and favor the side that brings the big body, which then tanks for its troops. A Titan with 20 Cinder Warriors goes from 52.5% to 57.8% against 20 Heavy Infantry. Ranged-only reads as an exception |
| D2 | Supply by size | today 1, or 3 at size 3+ (`SUPPLY.bigUnitSize`); units research: supply = size | **Supply = size (U2)**, commanders included | "A body eats supply equal to its size" is one sentence and replaces a threshold. Undead and constructs still eat nothing |
| D3 | Mounts | one body, Dom5; mount as data (units research option A); separate HP layer (option B); Dom6's separate entities | **A in M1, B in M2** | A makes the card, the Codex, the cost, and the sprite honest at no rule cost. B needs a second roll per blow and an after-battle remount rule |
| D4 | Gear pieces and materials | prot only; prot and def; prot, def, and materials (units research R2) | **Prot and materials are validated sums; def is shown as skill plus gear** | Every M1 troop fits exactly with consistent piece prices (A.5). An unvalidated skill field would be a number with no rule, so skill is derived (total minus gear) |
| D5 | Reach | Dom's repel roll; "reach cancels charge" (units research R4a) | **Reach cancels charge (U3)** | Repel is a morale roll per blow. Its outcome reduced to one sentence is the charge loss. Measured: Ash Riders against Briar Guard go from 55% to 50% |
| D6 | Elemental resistance | M2 (pretender final E.2); M1-should (units research R3) | **M1 (U4), with five unit values** | The two M1 nations are fire and forest. Measured: the elite fight goes from Thornwood 72% to about 55% (A.11). Items need it: Moss Mantle is Green's answer to fire. **Owner sign-off** (E.7 question 1) |
| D7 | Shields against arrows | M1-should (units research R4b) | **M2** | Measured: Flame Archer kills on Wardens drop 38%, and the starting matchup moves from Thornwood 60.5% to 64.8%, against the nation already behind. The replay already shows arrows sticking in shields on misses (battle design S2.8) |
| D8 | Trample on the independent Giant | add it (units research section 7) | **No in M1** | Measured: Cinder's starting army falls from 67.5% to 45.5% against a mountain Giant and 25 Heavy Infantry. Trample stays on the pretender's Primordial and Elder Wyrm (pretender P2) |
| D9 | Magic resistance | hide, M2 rule (units research R6) | **Hidden in M1** | No M1 rule reads `mr` |
| D10 | One catalog for abilities | inline per chassis (pretender draft); one file (all three research notes) | **One `ABILITIES` catalog, `AbilityDef` with a rule union (B.1)** | The card, the hover, and the Codex cannot drift. The pretender's N1 battle code reads the trigger kind unchanged |
| D11 | How forging is ordered | one generated ritual per item (items research F1); a command of its own | **`forgeItem` command and a `forge` order** that share the ritual helpers (C.2) | Generated rituals would enter the spell registry, the Research panel's spell lists, the AI's ritual step, and the content tests that match the spell registry to the `docs/02` lists (`tests/content/spells.test.ts`). A sibling order keeps spells as spells, and the shared payment, lab, and interruption helpers keep one rule |
| D12 | Slots | 7 (items research); 6 (presentation research) | **5: weapon, head, body, charm, charm** | Every slot holds at least 4 of the 24 items. Feet and shields would hold 1 and 2 items in M1, and a shield slot needs a two-handed rule. Both come in M2 |
| D13 | Item against standard gear | replace (Dominions [manual ch. 4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)); add | **Add; a weapon item replaces the melee weapons** | Measured: replacing armor would hand the full value to bodies with natural protection and no pieces. That is +6 protection on a Titan, and +2 already lifts it 27 points. Item looks are drawn as overlays (crown over helm, mantle over mail), so what you see matches the numbers |
| D14 | Spoils | Dominions' chance by tier ([illwiki](https://illwiki.com/dom5/items), search extract); TW's "lost, except legendary" ([TW wiki](https://totalwarwarhammer.fandom.com/wiki/Rarity), search extract); HoMM3's winner takes ([Heroes 3 wiki](https://heroes.thelazy.net/index.php/Combat), search extract) | **The winning side takes all (C.8)** | It is deterministic, it fits one sentence, and it makes a duel for a famous sword a story |
| D15 | Moving items | free; through the treasury in a lab (Dominions, [illwiki Laboratory](https://illwiki.com/dom5/laboratory), search extract) | **Only through the vault, in an own lab** | Mana moves the same way today (`giveMana`). Field swaps are M2 |
| D16 | Tiers | levels 1, 3, 5 (items research) | **Lesser at 1 to 2, Greater at 3 to 4, Artifact at 5** | Spreading items over levels gives each level something to unlock. At the measured research pace, artifacts stay late prizes |
| D17 | Regeneration on several items | allow stacking | **One regeneration item in M1** (Ring of Regrowth) | Measured: two 5% items and a protection charm take a Great Wyrm from 13% to 95% against Cinder's starting army |
| D18 | Battle-start summons on army items | Horn of the Wild Hunt (items research) | **None in M1** | A likely trap. Staged as a 4-wolf squad (the copy has no N1 yet), the wolves drop a general's win from 39.5% to 26.3%. Fast troops in the front pull the whole front into contact a round early, so the enemy's line strikes the general's infantry before it can strike back. Summons stay on chassis that fight alone or lead their own summons (Pyre Lord, Horned Hunter). 7b.3 re-measures with the real N1 before ruling it out for M2 |
| D19 | Morale items | on the wearer | **Inspire the led squads (I7)** | Measured (items research 7.2): a commander's own morale changes nothing, because it routs with its last squad without a roll |

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

Kept as it is: `hp`, `str`, `att`, `def`, `prot`, `mor`, `prec`, `mapSpeed`, the costs, and
the commander traits. Skills stay numbers, because one point matters: att 11 against def 10
hits 53.9%, and 10 against 10 hits 46.1% (presentation research 2.4).

| Field | New? | What it is | Rule it carries | Player sentence | Cost |
|---|---|---|---|---|---|
| `size` 1 to 6 | existing, now with names and rules | body class from man to wyrm | U1 blows, U2 supply, N2 trample filter | "Bigger bodies draw more blows, eat more, and cannot be trampled by smaller ones." | 1 changed draw (same count), 1 supply formula |
| `role` | new, content | one word: Heavy infantry, Cavalry, ... | none | (the word) | content |
| `description` | new, content | a lore line that explains odd stats | none | "Halberdiers in grown thornplate; the wall the forest raises." | content |
| `gear` | new, content | the unit's armor pieces from a registry | none: they sum into `prot` and `def`, and with weapons and mount into materials | "Prot 9 = thornplate 7 + iron cap 2." | a registry and a validation |
| `naturalProt` | new, content | hide, bark, scale: armor that is the body | none | "Natural armor 3: bark skin." | content |
| `mount` | new, content | a named mount with its look, natural weapons, and materials | none in M1 (size 2 from content) | "Rides a War Wolf, which bites as the rider strikes." | content |
| `WeaponDef.reach` | new | a braced polearm | U3 | "Reach: a charging foe gains no charge bonus against it." | 1 check per blow, no draw |
| `WeaponDef.firstRoundBonus` | existing, now named **Charge** | the lance's first-round damage | today's rule, cancelled by U3 | "Charge +3: +3 damage in its first melee round." | — |
| `WeaponDef.strikes`, `maxTargetSize` | from the pretender's N2 | attacks per weapon; trample | N2 | "Strikes 2." / "Trample: 2 blows at foes of size 2 or less." | (pretender track) |
| `WeaponDef.materials` | new, content | what the weapon costs to make | validation only | (cost breakdown) | content |
| `resist` | new | one signed number per element | U4 | "Fire −5: fire hits deal 5 more." | 1 subtraction per damage roll |
| `abilities` | from the pretender's N1, widened | catalog ids | B | (the catalog's line) | (shared) |

`mr` stays in content and the sim, and is shown nowhere until M2 gives it a rule (A.9).

### A.3 Size: the ladder from men to wyrms

FM's size 1 is a human. In Dominions 6 a human is size 3, a horse 5, a giant 6, and a war
elephant 9. A square holds "ten size points of units (so three human-sized units of size 3)"
([Dom6 manual ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html)). The
median HP of Dom6 records roughly doubles every two sizes (units research 2.1, computed over the
[dom6inspector data](https://github.com/larzm42/dom6inspector/tree/master/gamedata)). FM's
existing HP already follows that curve.

| Size | Name | Silhouette glyph | Draws blows (U1) | Supply a day (U2) | Sprites per squad (battle design S2.5) | Can be trampled by | M1 bodies |
|---|---|---|---|---|---|---|---|
| 1 | **Man-sized** | standing man | ×1 | 1 | 20 | Trample with `maxTargetSize` ≥ 1 | every human troop and commander, Wolf, Fire Sprite, Hornet Swarm; Living Monolith (sim size 1, drawn at 6) |
| 2 | **Large** | horse | ×2 | 2 | 12 | `maxTargetSize` ≥ 2 | **Ash Rider, Wolf Rider** (new), Oakheart; Oracle, Wild Spirit, Ascended Hero, Ember Hierophant |
| 3 | **Great** | bear | ×3 | 3 | 6 | ≥ 3 | Salamander; Ash Phoenix |
| 4 | **Huge** | giant | ×4 | 4 | 4 | ≥ 4 | Giant, Treant; Titan, Pyre Lord, Horned Hunter, Mother of Beasts |
| 5 | **Colossal** | colossus | ×5 | 5 | 2 | ≥ 5 | Ash Colossus |
| 6 | **Gargantuan** | wyrm | ×6 | 6 | 1 | ≥ 6 | Great Wyrm; Primordial, Elder Wyrm, World Tree, Cinder Idol |

The names live in content (`SIZE_CLASSES` in `src/content/sizes.ts`), and the owner may rename
them (E.7 question 4). The UI always shows the number next to the word: "Huge (size 4)".

**What size does not do**, and why:
- **No frontage cap.** `docs/03` says size 3+ "occupies more formation space", but no rule ever
  did it. A cap needs a rule about who waits, so the claim is dropped from `docs/03` (E.5).
- **No item limits.** Items fit any size (C.3). Dominions lets a size-9 Moloch use every slot
  (items research 1.3).
- **Leadership still counts troops, whatever their size** (`docs/01` decision, unchanged).

#### U1. Bigger targets draw more blows

**Sentence:** "Bigger targets draw more blows: a Huge giant in the line takes four times a man's
share."

**Rule.** In `rangedPhase` and `meleePhase`, each attack draws its target from the candidates
(`targetsUpTo`, after N2's size filter for trample) with weight equal to the target's combat
size. Spells are unchanged: area damage still picks troops uniformly, and single-target spells
still pick the largest group.

```ts
// src/sim/battle/attacks.ts
/** One attack's target, weighted by size: one draw, as before (docs/04 decision "Size draws blows"). */
function drawTarget(rng: RngState, candidates: readonly Fighter[], totalSize: number): Fighter | undefined {
  let r = randBelow(rng, totalSize);
  for (const t of candidates) {
    r -= t.group.base.size;
    if (r < 0) return t;
  }
  return undefined; // unreachable: totalSize is the sum over candidates
}
```

- `totalSize` is summed once per side per phase, and once per weapon list that N2 filters.
- **Equivalence.** When every candidate has size 1, `r` is the index, so the draw equals today's
  `targets[randBelow(rng, n)]` exactly. No battle in which every unit is size 1 changes in any
  bit. That covers all four `docs/04` required balance tests.
- **Draws.** Still exactly one `randBelow` per attack.
- **`CombatStats.size`** comes from the pretender's N2 (`statsFor` copies `UnitDef.size`). If
  Phase 7b lands first, 7b adds it.

**Why both melee and ranged.** One sentence covers both. Dominions weights missiles by size (a
giant sharing a square with a man "is struck two times out of three", [Dom6 manual
ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html)), and its melee
attackers gang up on big units (units research 2.2). AoW4's "Large Target" is "20% easier to
hit with Missile and Magic attacks" (presentation research 1.2, [aow4db
data](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Abilities.json)). The
measured effect is a tanking role, not a weakness: big bodies with high protection soak blows
their troops would have taken (A.11).

**Tests** (`tests/sim/battle/attacks.test.ts`):
1. Equivalence: 200 random all-size-1 setups give the same log through `drawTarget` as through
   today's uniform draw, kept as a reference in the test. The battle design's `golden.json`
   (S1.9) fixtures without size-2+ units, charges against reach, or resistances stay
   byte-equal.
2. Share: one Giant among 20 Ash Militia, 4,000 single-swing draws through `drawTarget`. The
   Giant is drawn 4/24 of the time, within 1.5 points.
3. One draw: each attack makes exactly one `randBelow` call for its target, as today (counted
   with a spy). `randBelow` rejects rare high values, so its bound may change how many raw
   numbers that call consumes. Determinism is unaffected, and size-1 fights are untouched.
4. With trample (N2): the filter runs first, then the weighted draw. A size-4 body is never
   drawn by a `maxTargetSize: 2` weapon.
5. Determinism with mixed sizes: one setup and one rng state give one log.

#### U2. A body eats supply equal to its size

**Sentence:** "A body eats supply equal to its size; undead and constructs eat nothing."

**Rule.** `troopSupply(def) = def.size × SUPPLY.perSize`, or 0 for undead and constructs. A
commander eats its own `troopSupply` (the garrison holder 0), plus its troops'. This replaces
`SUPPLY.troopSupply`, `bigUnitSize`, `bigUnitSupply`, and `commanderSupply` with
`SUPPLY.perSize: 1`.

**Changes from today:**
- Ash Rider and Wolf Rider 1 → 2;
- Oakheart 1 → 2;
- Giant 3 → 4;
- Salamander as a commander 1 → 3, Treant 1 → 4;
- pretenders by size: Titan 4, Great Wyrm 6, Ash Colossus 5, Oracle and Wild Spirit 2,
  Living Monolith 1.

At today's supply (`pop / 50`, a Hills province gives 100 to 160 a day) none of these starves an
army. They start to matter when Phase 12 retunes supply, as `docs/09` already plans.

**Tests** (`tests/sim/commanders.test.ts`): supply 1 to 6 by size; 0 for constructs and
undead; a commander by its size; the garrison holder 0. The existing starvation fixtures
(size-1 armies) are unchanged.

### A.4 Mounts: horses and wolves with names

Dominions 6 split riders from mounts: a Knight (hp 11) rides a Destrier (hp 22, plate barding,
its own hoof attack), and the Steam page sells it as "riders and mounts now have separate stats
and can be targeted individually" ([Steam store](https://store.steampowered.com/app/2511500/),
search extract in the units research). Dominions 5 had one body (units research 3.1).

**M1 (option A):** a mount is data.

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
// UnitDef.mount?: MountDef   — content validation: present exactly when the unit is tagged mounted, and then size >= 2
```

- `statsFor` builds `CombatStats.weapons` as the rider's weapons followed by the mount's. The
  Wolf Rider's Wolf Bite moves from `weapons` into `mount.weapons`. The order stays Spear, then
  Wolf Bite, so the draws are unchanged.
- **Size 2** for both riders: rider and mount are one Large body. They already cost 20
  population, two bodies' worth (`docs/03`).
- **Ash Horse has no weapon.** "Ash horses are bred to carry, not to fight." Giving it a hoof
  attack would add a free attack to a unit that already wins 81% against Wardens.
- **M2 (option B):** each mounted troop gets `mount.hp` on top of its own. A blow strikes the
  mount on a coin flip (one more draw, only for mounted targets), and trample always strikes
  the mount. An unhorsed troop fights on foot at speed 2, without its charge or the mount's
  weapon. After the battle, unhorsed survivors remount for the mount's materials. The sentence
  is "A blow strikes the rider or the mount; unhorsed riders fight on foot." This waits for M2
  because it needs a second roll and an after-battle rule.

**Tests:** content validation (mounted ⇔ `mount`, size ≥ 2); the Wolf Rider's battle weapons
are [Spear, Wolf Bite] in that order; a golden fight with Wolf Riders differs from today only
by U1's size weighting.

### A.5 Gear: armor built from pieces

Dominions builds armor from pieces: body armor, helmet, shield, and barding, each with
protection per zone. Its manual explains defense as a sum of gear: "base defense 10, +1 from
the sword, −2 from the armor, −1 from the shield" ([Dom6 manual
ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html)). Players see a gear
list, and the zone values sit "when you click on Protection" ([ch.
4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)). Battle Brothers draws each
piece on a layered sprite, and its developers split helmets that "looked different but gave
the same protection" into items with their own values ([Dev Blog
#34](https://battlebrothersgame.com/dev-blog-34-new-armor-helmet-rework-banners/), search
extract in the items research).

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
// UnitDef gains:  gear: readonly GearId[];  naturalProt: number;
// WeaponDef gains: materials?: number      (required on the weapons of recruitable units)
```

**Validation** (`tests/content/gear.test.ts`):
- `unit.prot === unit.naturalProt + Σ gear.prot`, for every unit;
- at most one piece per slot;
- for every recruitable unit, `cost.materials === Σ gear.materials + Σ weapon.materials +
  (mount?.materials ?? 0)`;
- every piece is worn by some unit;
- every piece has a look.

The defense skill is derived, never stored: `skill = def − Σ gear.def`. The hover shows "Def 11 =
skill 9 + round shield 2". A stored skill field would be a number with no rule.

**The 13 M1 pieces.** Nation variants of one piece share numbers on purpose; the nation's armor
layer (`docs/09`) draws them differently.

| Piece | Slot | Prot | Def | Materials | Worn by | Material (look and sound) |
|---|---|---|---|---|---|---|
| Leather Cap | head | 1 | 0 | 1 | Ash Militia, Cinder Warrior, Ember Skirmisher, Flame Archer, Thorn Militia, Longbow Hunter, Light Infantry, Scouts | soft |
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
equipment the same way: ring mail costs 5 resources, full chain 17 (units research 4.1, from
[dom6inspector armors](https://github.com/larzm42/dom6inspector/tree/master/gamedata)).

**Weapon materials** (recruitable units only): Dagger 1, Knife 1, Staff 1, Spear 2, Javelins 2,
Sword 3, Lance 3, Axe 4, Oak Maul 4 (wood), Fire Arrows 4, Longbow 6, Halberd 6, Burning
Blade 6, Great Axe 8. **Mounts:** Ash Horse 7, War Wolf 7.

**What the player reads:** "Briar Guard: 26 materials = thornplate 18 + halberd 6 + iron cap
2." That explains the most expensive Thornwood troop in one line.

### A.6 Weapons: reach, charge, strikes, and what stays out

Dominions weapons have damage, attack and defense modifiers, length, attacks, ammunition, and
flags: two-handed, slash, pierce, blunt, AP, AN, charge, bonus, element. Over the 554 weapons
Dom6 units carry, 13% are armor piercing, 11% armor negating, 36% are natural "bonus" weapons,
and 2% charge (units research 5.1, computed from the
[dom6inspector weapons](https://github.com/larzm42/dom6inspector/tree/master/gamedata)). Length
drives repel: "Using long weapons against low-morale troops is very effective" ([Dom6 manual
ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html)).

FM's weapon line after this design. Every property is a catalog entry (B) and a chip on the
weapon's line:

| Property | Field | Rule | Sentence | M1 users |
|---|---|---|---|---|
| Damage | `dmg` | str + dmg in melee; dmg alone for shots (`docs/04` decision) | "Damage = strength + weapon in melee; weapon alone for shots." | all |
| Range, ammunition | `range`, `ammo` | range 5+ reaches the rear (`BATTLE.rearReach`) | "Shoots from the middle row; reaches all three." | archers, skirmishers, Salamander, Great Wyrm |
| Element | `element` | U4 resistances read it | "Fire: fire resistance and weakness apply." | Fire Arrows, Burning Blade, Flame Touch, Fire Breath, Burning Fists |
| Armor piercing | `armorPiercing` | `floor(prot × 0.5)` | "Armor piercing: halves the target's protection." | Flame Touch, Burning Talons; items |
| Armor negating | `armorNegating` | prot ignored | "Armor negating: ignores protection entirely." | Sting |
| **Charge** | `firstRoundBonus` | + bonus in the first melee round, unless braced (U3) | "Charge +3: +3 damage in its first melee round, unless the foe holds a reach weapon." | Lance; Blazing Charge blessing |
| **Reach** | `reach` (new) | U3 | "Reach: a charging foe gains no charge bonus against it." | every Spear, Halberd, Hunting Spear; Hunter's Spear item |
| Strikes | `strikes` (N2) | that many swings | "Strikes 2: swings twice a round with this weapon." | Brand of Ash, The Unquenched |
| Trample | `strikes` + `maxTargetSize` (N2) | swings only at small enough foes | "Trample: 2 extra blows a round at foes of size 2 or smaller." | Primordial, Elder Wyrm |

#### U3. Reach blunts a charge

**Sentence:** "Halberds blunt a charge: a charge bonus never lands on a troop holding a reach
weapon."

**Rule.** In `meleePhase`, a blow's `firstRoundBonus` is 0 when the target troop's group holds
any melee weapon with `reach: true` (`CombatStats.braces`, folded at setup). It applies to every
first-round bonus, the Blazing Charge blessing's included. It adds no draw. The detail `strike`
event gains `braced: boolean` (true when a bonus was cancelled).

```ts
const bonus = g.firstMelee === round && !target.group.base.braces ? (w.firstRoundBonus ?? 0) : 0;
```

**Why the spear gets reach.** A spear is length 3 in Dominions, the same as a lance, and repels
it ([Dom6 manual ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html)). Red's
own Ash Militia carry spears too, so the rule holds in Red mirror matches as well. Thornwood has
no charge in M1 (Wolf Riders do not charge), so in Red against Green the rule is Thornwood's
answer to Ash Riders and to the Blazing Charge blessing.

**Measured** (A.11): 10 Ash Riders against 10 Briar Guard go from 55% to 47.8% alone, and to
50.3% with the full rule set. Against 15 Thorn Militia, 80% becomes 78.5%. Against Wardens
(swords) nothing changes.

**Tests:** a lance against a spearman rolls `damage.base` without the bonus and logs
`braced: true`; against a swordsman it keeps the bonus; rounds after the first never add it;
a Blazing Charge squad is braced against too; the rng state is unchanged by the check.

### A.7 Resistance: wood burns, embers do not

Dominions resistance "subtracts like protection, then cuts the remainder by twice the
resistance as a percent", and negative values encode weakness: the Troll is fire −10
([Dom6 manual ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html); units
research 6.1). In Dom6 data, 16% of records resist fire, 23% cold, and 25% poison (units
research 6.1, computed). AoW4 shows coarse tiers only where they apply: 40% of its units have
one, and the common weaknesses are Spirit and Fire (presentation research 1.2).

#### U4. Elemental resistance

**Sentence:** "Fire resistance 5: fire hits deal 5 less. Fire −5: they deal 5 more."

**Rule.**

```ts
// src/content/types.ts
export type DamageElement = Exclude<Element, 'physical'>;          // fire, nature, cold, holy, decay
// UnitDef.resist?: Partial<Record<DamageElement, number>>         — integers, −10 to 20 (validation)
// CombatStats.resist: Readonly<Partial<Record<DamageElement, number>>>   — unit + items (C.9)

// src/sim/battle/attacks.ts  (battle design S1's rollDamageParts, one subtraction added)
// rolled = max(0, base − resist + attackDrn − armor − armorDrn)
```

- **Weapons**, melee and ranged: `resist` is the target's value for the weapon's element; a
  physical weapon reads 0.
- **Spells:** the target's value for the effect's element.
- **Retaliation shields** (N4): each wounding blow owes the striker `max(0, amount −
  striker.resist[element])`.
- **Remote damage** (Ash Rain): each troop takes `max(0, Σ dice − resist[element])`. The draws
  are unchanged.
- **No percentage step.** The Dom two-step formula does not fit in one sentence.
- **Not immunity.** A fire +10 Fire Sprite (prot 0) struck by a 6-damage fire arrow is still
  wounded 21% of the time, because both DRNs are open-ended; a Salamander, with prot 8, 3%. The
  Codex says so in the entry.
- **Weakness is felt.** A fire arrow wounds a Treant 38% of the time instead of 13%, and an
  Oakheart 38% instead of 21% (`calc/wound.py`, exact over the DRN distribution).
- The detail `DamageRoll` gains `resist: number` (battle design S1.3), so the replay can show
  "+3 (fire weakness)".

**M1 values** (content):

| Unit | Resist | Why |
|---|---|---|
| Treant | fire −5 | dry wood, and its regeneration already makes it hard to kill |
| Oakheart | fire −3 | a walking oak (wood material, sap blood in the battle design); −3, not −5, because it is a troop |
| Salamander | fire +10 | it bathes in the flame it breathes |
| Fire Sprite | fire +10 | living flame |
| Flamebrand | fire +3 | temple champions of the fire god; matters in mirror matches and against M2 fire |
| Pretender bodies (proposed to the pretender track) | Ash Colossus, Ash Phoenix, Cinder Idol fire +10; World Tree fire −5 | as above; the Great Wyrm's breath color stays display only (pretender D6) |

No Thornwood human and no Cinder human gets a value. Armor is not the body.

**Why M1 and not M2.** The pretender final defers resistances because "rules only W, U and B
chassis use" (pretender E.2). In R against G they matter at once. Red deals fire with 5 weapons
and 3 spells, and Thornwood's sacred troop and its summoned commander are trees. Measured (A.11):
today the elite armies split 72% to Thornwood, and with the final rules about 55% (Oakheart
−3) or 58% (Oakheart −2). That brings the fight closer to even, not further. Items need it as
well: Moss Mantle (fire resistance 5) is Green's answer to fire.

**AI.** `armyPower` (`docs/08`) does not read resistances. The AI never chooses spell targets
(the resolver does), so the only gap is that strength estimates miss the matchup. That is
recorded as a known limitation, not a rule.

**Tests** (`tests/sim/battle/attacks.test.ts`, `effects.test.ts`, `ritualEffects.test.ts`):
- the detail `damage.base` and `resist` for a fire arrow on a Treant (base 6 + 5);
- a negative value adds and a positive one subtracts;
- a physical weapon ignores it;
- spell damage reads the effect's element;
- a fire shield burns a fire +10 striker for `max(0, 5 − 10) = 0`;
- Ash Rain's per-troop damage is reduced and draws the same dice;
- validation refuses `physical` and values out of range.

### A.8 Role and lore line

- **`role`**, one word per unit, from content: Light infantry, Heavy infantry, Shock infantry,
  Skirmisher, Archer, Cavalry, Sacred warrior, Scout, General, Priest, Mage, Beast, Summon,
  Monster, God. It titles the hover and filters the Codex. AoW4 bundles rules into role tags
  such as "Polearm Unit" and "Shield Unit" (presentation research 1.2, [aow4db
  data](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Abilities.json)). FM's
  role is a word only. Its rules stay on the abilities.
- **`description`**, a lore line whose first sentence (at most 120 characters) explains the
  unit's oddest number. Dominions' descriptions do exactly this: Huskarls "can rarely afford
  heavy armor", and elephants "once hurt ... become enraged and terrified, ... trampling friends
  and enemies alike" (units research 0, from [dom6inspector
  unitdescr](https://github.com/larzm42/dom6inspector/tree/master/gamedata/unitdescr)). A content
  test requires it on every unit.

### A.9 What is left out, and why

| Candidate | Where it is from | Why not in M1 | Where it goes |
|---|---|---|---|
| Encumbrance and troop fatigue | Dom: fatigue per attack lowers att and def; 100 is unconscious ([ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html)) | A hidden penalty that grows each round, with no decision attached. Heavy armor already costs map speed and materials | never for troops; caster fatigue stays |
| Hit locations, limb damage caps | Dom: torso 50%, arms 20%, legs 20%, head 10% | Zone math is a click deep even in Dominions. Presentation already sends "a head with its helmet" flying on brutal kills (battle design S4.4) | presentation only |
| Slash, pierce, blunt | Dom damage types | Invisible on the card. The replay gives each weapon its motion and sound family (battle design S2.2) | presentation only |
| Shields against arrows | Dom missile defense uses parry ×2 | Measured: −38% Flame Archer kills on Wardens, and the starting matchup moves 4 to 6 points toward Thornwood, which already wins 60.5% (A.11) | **M2**, with White's shield troops; Phase 12 may revisit |
| Giant trample | units research section 7 | Measured: a mountain Giant with trample drops Cinder's starting army from 67.5% to 45.5% | Phase 12 option, or M2 elephants |
| Separate mount HP, unhorsing | Dom6 | A second roll per blow and an after-battle rule | **M2** (A.4) |
| Magic resistance checks | Dom penetration against MR ([ch. 7](https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html)) | No M1 spell has a resist check (`docs/02` section 5) | **M2**; MR hidden until then |
| Mindless dissolving without a leader | Dom6 ([ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html)) | A new rout rule for two summons that already have morale 50 | **M2** with the Black nation |
| Afflictions | Dom: per blow, by location; players say healing is "very very rare" ([Steam](https://steamcommunity.com/app/2511500/discussions/0/4203616776861027901), search extract) | Per-troop identity does not exist; the tedium is documented | **M2**, commanders only (units research R10) |
| Experience and renown | Dom stars and Hall of Fame ([ch. 4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)) | New state, rank rules, merge rules | **M2**; Phase 9 may show a battle count from stored summaries (E.1) |
| Terrain walkers beyond swamp | Dom forest and mountain survival | Changes leg days and battle terrain rules | **M2** |
| Awe, ethereal | Dom | Need W and B nations | **M2** |

### A.10 The M1 units, updated

Every unit keeps every number it has today, except the riders' size (1 → 2). The tables add
the new fields. "Def" shows skill + gear. "Mat." checks the materials sum against the cost.

#### Cinder Horde troops

| Unit | Size | Role | Gear → prot | Def | Weapons (properties) | Mount | Resist | Abilities | Mat. |
|---|---|---|---|---|---|---|---|---|---|
| Ash Militia | 1 Man-sized | Light infantry | Leather Cap 1 → **1** | 8 | Spear 3 (reach) | — | — | — | 2 + 1 = **3** ✓ |
| Cinder Warrior | 1 | Heavy infantry | Scale Shirt 2, Leather Cap 1 → **3** | 9 | Axe 5 | — | — | — | 4 + 3 + 1 = **8** ✓ |
| Ember Skirmisher | 1 | Skirmisher | Leather Cap 1 → **1** | 11 | Javelins 4 (range 3, ammo 4), Knife 2 | — | — | — | 2 + 1 + 1 = **4** ✓ |
| Flame Archer | 1 | Archer | Leather Jerkin 1, Leather Cap 1 → **2** | 9 | Fire Arrows 6 (range 6, ammo 10, fire) | — | — | — | 4 + 1 + 1 = **6** ✓ |
| Berserker | 1 | Shock infantry | Wolf Pelt 2 → **2** | 7 | Great Axe 8 | — | — | berserk | 8 + 2 = **10** ✓ |
| Ash Rider | **2 Large** | Cavalry | Scale Shirt 2, Iron Cap 2 → **4** | 11 | Lance 6 (charge +3), Sword 4 | Ash Horse (no weapon) | — | mounted | 3 + 3 + 3 + 2 + 7 = **18** ✓ |
| Flamebrand | 1 | Sacred warrior | Scale Hauberk 4, Iron Cap 2 → **6** | 11 | Burning Blade 6 (fire) | — | fire +3 | sacred | 6 + 6 + 2 = **14** ✓ |
| Fire Sprite (summon) | 1 | Summon | natural 0 | 14 | Flame Touch 5 (fire, armor piercing) | — | fire +10 | flying, construct, mindless | — |

#### Cinder Horde commanders

| Unit | Size | Role | Gear → prot | Def | Weapons | Resist | Abilities | Body plan (C.3) | Mat. |
|---|---|---|---|---|---|---|---|---|---|
| Scout | 1 | Scout | Leather Cap 1 → **1** | 10 | Dagger 2 | — | stealthy, scout 2 | humanoid | 1 + 1 = **2** ✓ |
| Ash Chieftain | 1 | General | Scale Hauberk 4 → **4** | 10 | Axe 5 | — | — | humanoid | 4 + 6 = **10** ✓ |
| Pyre Priest | 1 | Priest | Ritual Vestments 2 → **2** | 10 | Staff 2 | — | — | humanoid | 1 + 3 = **4** ✓ |
| Ember Adept | 1 | Mage | Quilted Robe 1 → **1** | 10 | Staff 2 | — | — | humanoid | 1 + 1 = **2** ✓ |
| Cinder Magus | 1 | Mage | Ritual Vestments 2 → **2** | 10 | Staff 2 | — | — | humanoid | 1 + 3 = **4** ✓ |
| Salamander (summon) | 3 Great | Beast | natural **8** | 10 | Fire Breath 10 (range 2, ammo 6, fire) | fire +10 | beast | beast | — |

#### Thornwood troops

| Unit | Size | Role | Gear → prot | Def | Weapons (properties) | Mount | Resist | Abilities | Mat. |
|---|---|---|---|---|---|---|---|---|---|
| Thorn Militia | 1 | Light infantry | Leather Jerkin 1, Leather Cap 1 → **2** | 9 | Spear 3 (reach) | — | — | forest home | 2 + 1 + 1 = **4** ✓ |
| Warden | 1 | Heavy infantry | Bark Mail 4, Iron Cap 2, Round Shield → **6** | 9 + 2 = **11** | Sword 4 | — | — | forest home | 3 + 6 + 2 + 3 = **14** ✓ |
| Longbow Hunter | 1 | Archer | Leather Jerkin 1, Leather Cap 1 → **2** | 10 | Longbow 6 (range 7, ammo 12) | — | — | forest home | 6 + 1 + 1 = **8** ✓ |
| Briar Guard | 1 | Heavy infantry | Thornplate 7, Iron Cap 2 → **9** | 11 − 1 = **10** | Halberd 7 (reach) | — | — | forest home | 6 + 18 + 2 = **26** ✓ |
| Wolf Rider | **2 Large** | Cavalry | Leather Jerkin 1, Iron Cap 2 → **3** | 12 | Spear 4 (reach) | War Wolf: Wolf Bite 3 | — | mounted, beast, forest home | 2 + 1 + 2 + 7 = **12** ✓ |
| Oakheart | 2 Large | Sacred warrior | natural 3, Thornplate 7 → **10** | 10 − 1 = **9** | Oak Maul 9 | — | **fire −3** | sacred, forest home | 4 + 18 = **22** ✓ |
| Wolf (summon, independent) | 1 | Beast | natural **1** | 11 | Bite 4 | — | — | beast | — |
| Hornet Swarm (summon) | 1 | Summon | natural 0 | 13 | Sting 2 (armor negating) | — | — | flying, beast, mindless | — |

#### Thornwood commanders

| Unit | Size | Role | Gear → prot | Def | Weapons | Resist | Abilities | Body plan | Mat. |
|---|---|---|---|---|---|---|---|---|---|
| Scout | 1 | Scout | Leather Cap 1 → **1** | 10 | Dagger 2 | — | stealthy, scout 2, forest home | humanoid | **2** ✓ |
| Warden Captain | 1 | General | Bark Mail 4, Antlered Helm 3, Round Shield → **7** | 8 + 2 = **10** | Sword 4 | — | forest home | humanoid | 3 + 6 + 4 + 3 = **16** ✓ |
| Grove Priest | 1 | Priest | Ritual Vestments 2 → **2** | 10 | Staff 2 | — | forest home | humanoid | **4** ✓ |
| Sapling Druid | 1 | Mage | Quilted Robe 1 → **1** | 10 | Staff 2 | — | forest home | humanoid | **2** ✓ |
| Elder Druid | 1 | Mage | Ritual Vestments 2 → **2** | 10 | Staff 2 | — | forest home | humanoid | **4** ✓ |
| Treant (summon) | 4 Huge | Beast | natural **12** | 10 | Crushing Limbs 12 | **fire −5** | regeneration 5%, forest home | beast | — |

Forest home is Thornwood's nation property (`homeTerrain`). It is shown on every unit fighting for
Thornwood, summons included (the shared Wolf and the Hornet Swarm get it when summoned). The
Treant's `beast` tag is not added: it would make Treants cheaper in Wild provinces, and they are
summoned, not recruited.

#### Independents and shared units

| Unit | Size | Role | Gear → prot | Def | Weapons | Resist | Abilities | Body plan |
|---|---|---|---|---|---|---|---|---|
| Light Infantry | 1 | Light infantry | Leather Jerkin 1, Leather Cap 1 → **2** | 8 | Spear 3 (reach) | — | — | — |
| Heavy Infantry | 1 | Heavy infantry | Mail Hauberk 5, Iron Cap 2 → **7** | 10 | Sword 4 | — | — | — |
| Archer | 1 | Archer | none → 0 | 10 | Shortbow 5 (range 5, ammo 10) | — | — | — |
| Swamp Fighter | 1 | Light infantry | none → 0 | 12 | Spear 3 (reach) | — | swampwalker | — |
| Giant | 4 Huge | Monster | natural **4** | 10 | Club 12 | — | — (no trample, A.9) | — |
| Independent Captain | 1 | General | Round Shield → 0 | 8 + 2 = **10** | Sword 4 | — | — | humanoid (never equips: C.7) |
| Garrison | 1 | — | — | — | — | — | immobile (hidden) | none |

Independents have no cost, so their materials are not checked. Their pieces still sum into
`prot`.

#### Why each value: the lore lines

The first sentence of each `description`, which the hover shows (A.8). Each one explains the
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
| Scout | "Hooded runners of the ash plains who see without being seen." | sight 2, stealthy |
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
| Warden Captain | "A veteran Warden under an antlered helm, who leads eighty." | prot 7, leadership 80 |
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

#### Pretender bodies (proposed values for the pretender track)

The pretender final owns these bodies (pretender A.4). This design proposes only the fields it
adds. Every body's armor is natural (`naturalProt` = `prot`, no gear, no materials).

| Body | Size class | Body plan (C.3) | Resist (proposed) |
|---|---|---|---|
| Oracle of the Flux | 2 Large | humanoid | — |
| Titan | 4 Huge | humanoid | — |
| Great Wyrm | 6 Gargantuan | wyrm | — (breath color display only) |
| Living Monolith | 1 (drawn at 6) | idol | — |
| Wild Spirit | 2 Large | beast | — |
| Ash Colossus | 5 Colossal | humanoid | fire +10 |
| Ascended Hero | 2 Large | humanoid | — |
| Primordial | 6 Gargantuan | wyrm | — |
| Ash Phoenix | 3 Great | wyrm | fire +10 |
| Pyre Lord | 4 Huge | humanoid | — |
| Cinder Idol | 6 Gargantuan | idol | fire +10 |
| Ember Hierophant | 2 Large | humanoid | — |
| World Tree | 6 Gargantuan | idol | fire −5 |
| Horned Hunter | 4 Huge | humanoid | — |
| Elder Wyrm | 6 Gargantuan | wyrm | — |
| Mother of Beasts | 4 Huge | humanoid | — |

### A.11 Balance: what moves and what does not

All cells are attacker win rates in percent: 400 seeds, or 200 and 500 for the required tests as
`docs/04` sets them. The U1 column already has the riders at size 2. The Wardens' shield is
tested as `shieldDef 2`. "Final" is U1 + U3 + U4 with the riders at size 2 (U2 is supply and
does not touch battles). Output: `proto/measure-2.out.md`.

| Fight | Today | U1 size (melee + ranged) | U3 reach | U4 resist | Shields vs arrows (rejected) | Giant trample (rejected) | **Final** | Final, Oakheart −2 |
|---|---|---|---|---|---|---|---|---|
| **R1** 20 Cinder Warriors vs 10 Ash Militia (need ≥ 95) | 98.5 | 98.5 | 98.5 | 98.5 | 98.5 | 98.5 | **98.5** | 98.5 |
| **R2** equal armies (need 35 to 65) | 49.2 | 49.2 | 49.2 | 49.2 | 49.2 | 49.2 | **49.2** | 49.2 |
| **R3** archer kills, rounds 1 to 3 (need ≥ 2) | 4.1 | 4.1 | 4.1 | 4.1 | 4.1 | 4.1 | **4.1** | 4.1 |
| Cinder start attacks Thornwood start | 39.5 | 39.5 | 39.5 | 39.5 | 33.0 | 39.5 | **39.5** | 39.5 |
| Thornwood start attacks Cinder start | 60.5 | 60.5 | 60.5 | 60.5 | 64.8 | 60.5 | **60.5** | 60.5 |
| Cinder mid army attacks Thornwood mid army¹ | 45.3 | 41.0 | 43.5 | 45.3 | 43.5 | 45.3 | **40.0** | 40.0 |
| Thornwood mid attacks Cinder mid | 54.5 | 51.5 | 59.0 | 54.5 | 58.0 | 54.5 | **53.3** | 53.3 |
| Cinder elite attacks Thornwood elite² | 25.8 | 30.0 | 25.8 | 35.8 | 26.3 | 25.8 | **43.8** | 39.8 |
| Thornwood elite attacks Cinder elite | 70.8 | 68.5 | 70.8 | 66.8 | 75.0 | 70.8 | **54.3** | 56.8 |
| 10 Ash Riders vs 10 Briar Guard | 55.0 | 56.0 | 47.8 | 55.0 | 55.0 | 55.0 | **50.3** | 50.3 |
| 10 Ash Riders vs 15 Thorn Militia | 80.0 | 80.0 | 78.5 | 80.0 | 80.0 | 80.0 | **78.8** | 78.8 |
| 10 Flamebrands vs 10 Oakhearts | 21.3 | 24.3 | 21.3 | 36.0 | 21.3 | 21.3 | **33.8** | 32.3 |
| Cinder start vs mountain Giant + 25 Heavy Infantry | 67.5 | 68.8 | 67.5 | 67.5 | 67.5 | 45.5 | **68.8** | 68.8 |
| Titan (Attack) + 20 Cinder Warriors vs Thornwood start | 14.5 | 17.8 | 14.5 | 14.5 | 14.5 | 14.5 | **17.8** | 17.8 |
| Titan (Attack) + 20 Cinder Warriors vs 20 Heavy Infantry | 52.5 | 57.8 | 52.5 | 52.5 | 52.5 | 52.5 | **57.8** | 57.8 |
| Cinder start vs Treant (Attack) + 20 Wardens | 71.5 | 66.0 | 71.5 | 71.8 | 68.0 | 71.5 | **66.3** | 66.3 |

¹ Mid armies: Ash Chieftain with 20 Cinder Warriors, 10 Flame Archers, 10 Berserkers, and 10 Ash
Riders, against Warden Captain with 20 Wardens, 10 Longbow Hunters, 10 Briar Guard, and 10
Wolf Riders.
² Elite armies: Ash Chieftain with 20 Cinder Warriors, 10 Flame Archers, and 10 Flamebrands,
against Warden Captain with 20 Wardens, 10 Longbow Hunters, and 10 Oakhearts.

**Reading.**
- **The `docs/04` required tests do not move**, under any rule. They use only size-1 units with
  no reach, no shields, and no resistances, and U1 is bit-identical for size 1. The Pyre Storm
  test (militia, no resistance) is untouched for the same reason.
- **The starting matchup does not move** (Thornwood 60.5% either way). It already leans to
  Thornwood today. That is Phase 12's to tune with the Phase 7 AI, and this design does not add
  to it.
- **The mid-game mix moves about 2 points toward Thornwood** (Thornwood's average win share
  goes from 54.6% to 56.7%). That is inside the noise (one cell's standard error is about 2.5
  points).
- **The elite matchup moves strongly toward even**: Thornwood's average share goes from 72.5% to
  55.3%. That comes from U4, because wood burns.
- **Big bodies gain 3 to 5 points as army fighters**, because they soak blows (Titan rows).
  Lone duels are unchanged: a lone body is the only target. The pretender track's duel bands
  with armies need a re-measure after 7b (E.6).
- **Rejected rules are rejected for the numbers above**: shields against arrows push a
  Thornwood-leaning start further, and Giant trample makes a mountain champion a wall.

### A.12 Data shapes, together

```ts
// src/content/types.ts (additions)
export type DamageElement = Exclude<Element, 'physical'>;
export type UnitRole = 'lightInfantry' | 'heavyInfantry' | 'shockInfantry' | 'skirmisher' | 'archer'
  | 'cavalry' | 'sacredWarrior' | 'scout' | 'general' | 'priest' | 'mage' | 'beast' | 'summon' | 'monster' | 'god';
export interface WeaponDef {
  /* ...today's fields... */
  reach?: true;            // U3
  materials?: number;      // A.5
  strikes?: number;        // N2 (pretender track)
  maxTargetSize?: number;  // N2 (pretender track)
}
export interface UnitDef {
  /* ...today's fields... */
  role: UnitRole;
  description: string;
  gear: readonly GearId[];
  naturalProt: number;
  mount?: MountDef;
  resist?: Partial<Record<DamageElement, number>>;
  abilities?: readonly AbilityId[];  // trigger abilities (N1); everything else is derived (B.1)
}
export interface CommanderTraits { /* ...today's fields... */ body: BodyPlanId }   // C.3

// src/sim/battle/types.ts  CombatStats gains (with the pretender's size, shields, spellPower):
//   resist: Readonly<Partial<Record<DamageElement, number>>>;   braces: boolean;
// src/sim/battle/detail.ts  DamageRoll gains resist: number;  the strike event gains braced: boolean
// src/content/rules.ts      SUPPLY.perSize = 1 replaces troopSupply, bigUnitSize, bigUnitSupply, commanderSupply
```

---

## B. The abilities catalog (one, shared with the pretender expansion)

Dominions has "about 500 special abilities", explained "on a mouse-over or right-click"
([manual ch. 4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)). Most of its
flavor comes from a small common set plus rare signatures (units research 7.1). Wesnoth and
AoW4 define every special as data with a name and one sentence. Wesnoth marks a special
"(inactive)" when it does not apply (presentation research 1.8, [Wesnoth
weapon_specials.cfg](https://raw.githubusercontent.com/wesnoth/wesnoth/master/data/core/macros/weapon_specials.cfg)).
FM keeps one catalog, so the card, the hover, the Codex, the replay's teaching line, and the
item tooltip all read the same words.

### B.1 The shape

```ts
// src/content/abilities.ts
export type AbilityPlacement =
  | 'signature'   // may take one of the card's 3 glyph slots
  | 'class'       // a word in the hover title only (AoW4's secondary passives)
  | 'weapon'      // a chip on its weapon's line
  | 'body';       // pretender and nation properties: chassis card, hover, Codex
export type AbilityRule =
  | { kind: 'tag'; tag: UnitTag }
  | { kind: 'stat'; stat: 'regeneration' | 'lifeDrain' | 'spellPower' | 'inspire' | 'sight' }
  | { kind: 'shield'; element: Element }                 // pretender N4
  | { kind: 'resist'; element: DamageElement }           // U4
  | { kind: 'weapon'; property: 'armorPiercing' | 'armorNegating' | 'charge' | 'reach' | 'strikes' | 'trample' }
  | { kind: 'booster' }                                  // I6
  | { kind: 'trigger'; trigger: 'battleStart'; color: Color | null; effects: readonly BattleEffect[] } // pretender N1
  | { kind: 'body'; property: 'researches' | 'dominionEngine' | 'monthlySummon' | 'reform' | 'avatar' | 'bound' | 'homeTerrain' };
export type AbilityDef = AbilityRule & {
  id: string;
  name: string;
  /** A 24 px monoline glyph id (docs/09 Icons); signature glyphs are unique. */
  glyph: GlyphId;
  /** At most UI.unitCard.oneLineMax (120) characters. {n}, {m}, {unit}, {color} are filled from the bearer. */
  oneLine: string;
  /** The line for a negative value, where the sign changes the words (resistances). */
  oneLineNegative?: string;
  /** The Codex paragraph: exact numbers and interactions. */
  codex: string;
  placement: AbilityPlacement;
  /** Lower shows first among signature glyphs. */
  cardPriority: number;
  /** When it applies; the hover shows "(inactive: below half HP)" when it does not. */
  condition?: string;
  milestone: 'M1' | 'M2';
};
export const ABILITIES = { /* the 43 entries of B.5 */ } as const satisfies Record<string, AbilityDef>;
export type AbilityId = keyof typeof ABILITIES;

/** What the pretender's N1 battle code reads; nothing else changes there. */
export type UnitAbility = Extract<AbilityDef, { kind: 'trigger' }>;
export function triggerDef(id: AbilityId): UnitAbility;   // throws on a non-trigger id
```

**What this changes in the pretender spec.** Pretender N1 defines `ABILITIES` with records `{ id,
name, trigger, color, effects }` and `UnitAbility` as that record. Under this design each such
record also carries `kind: 'trigger'` and the display fields. `UnitAbility` becomes the
`Extract` above, so N1's `abilityPhase`, `hasTargets`, `plan`, `applyEffect`, the record's
`abilities: string[]`, and `fromSetupRecord` read the same fields as before. `abilityDef(id)`
in N1 becomes `triggerDef(id)`. Ability ids stay unique and distinct from every spell id, and
the id stays the source of the stat changes, so an ability never stacks with itself (pretender
N1). The amendment is listed for the pretender track in E.6.

### B.2 How a unit's abilities are found

A unit lists only its trigger abilities (`UnitDef.abilities`). Everything else is **derived**, so
the content cannot hold an ability and a field that disagree:

```ts
// src/content/abilities.ts
/** Every catalog entry that applies to a unit, with its number, in catalog order. */
export function abilitiesOf(def: UnitDef, nation?: NationDef, items?: readonly ItemDef[]): readonly AbilityUse[];
export interface AbilityUse { id: AbilityId; n?: number; m?: number; unit?: UnitTypeId; color?: Color }
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
| a weapon with `maxTargetSize` | `trample` with n = strikes, m = maxTargetSize |
| `def.abilities` | each trigger entry |
| the chassis (pretender `ChassisDef`) | `researches`, `dominionEngine`, `monthlySummon`, `reform`, `avatar` |
| the nation's `homeTerrain` | `forestHome` (the entry names its terrain) |
| a battle-summoned or monthly-summoned squad | `bound` (a state chip, not a unit property) |
| worn items | each item's stat and ability entries, marked "from {item}" |

Blessings fold into stats at setup (pretender A.6). Their effects show through the same
entries ("Fire shield 3, from Cinder Skin").

### B.3 Validation (`tests/content/abilities.test.ts`)

1. Every entry has a name, a glyph that exists in the icon set, a `oneLine` of at most 120
   characters with all its placeholders fillable, and a `codex` paragraph.
2. No two `signature` entries share a glyph.
3. Every derived use (B.2) of every unit, item, blessing, and chassis resolves to an entry.
4. **No orphans:** every M1 entry has at least one M1 user. M2 entries may have none.
5. Trigger entries: their effects pass `battleEffectProblems` (`content/spells/validate.ts`).
   Their ids are unique and distinct from every spell id. They sit only on commander units and
   items. Their summoned units exist and are not commanders (pretender N1).
6. Per CLAUDE.md, every new unit, item, chassis, and ability joins the content fixtures.

### B.4 Placement and order on the card

- **The card's glyph row** holds signature entries first, by `cardPriority`. Free slots then
  take the weapon chips of the unit's best melee weapon, up to 3 glyphs in all, then "+N"
  (presentation research P1). Conditions beat traits: a squad's state chips (routing,
  starving, blessed) take the slots first (UI spec rule 5).
- **Class entries** (beast, mounted, construct, mindless, undead, swampwalker, immobile) never
  take a card slot. They are words in the hover's title line: "Large · Cavalry · Mounted · Beast".
- **Weapon entries** sit on their weapon's line, and nowhere else (presentation research 3.1,
  rule 6: one home per fact).
- **Body entries** show on the pretender card, the hover, and the Codex.
- **Inactive.** Where an entry has a `condition` and the context shows it unmet, the hover
  greys the line and appends "(inactive: {condition})". Examples: Berserk on a healthy troop,
  Forest home outside a forest, a booster on a commander without the color.

### B.5 The catalog

Glyphs are concepts for the Phase 11 icon set (24 px monoline, `docs/09` Icons). In panels
every glyph comes with its name or number (UI spec rule 6). "Tests" names the test file and
case. "existing" means a test already in the repository that keeps covering the rule.

#### Tags (rules that already exist, now named)

| Id | Name, placement | Exact rule | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `sacred` | Sacred, signature 22 | Receives the nation's bless (`docs/02` section 8, pretender A.6); half upkeep (`ECONOMY.sacredUpkeepFactor`); Sanctity sacred morale (`scaleEffect 'sacredMorale'`) | small figure under a haloed star | "Sacred: carries its god's blessing in battle and costs half upkeep." | Flamebrand, Oakheart; the prophet fights as if sacred | existing: `bless`, `commanders` upkeep, `setup` |
| `berserk` | Berserk, signature 21; condition "below half HP" | Below `BATTLE.berserk.belowHpShare` of max HP: att +2, str +2 in melee; never routs: not by morale, not with its commander, not on Retreat | two crossed jagged strokes | "Berserk: below half HP it gains +2 attack and strength, and it never flees." | Berserker; Fury Unbound blessing | existing: `field` (statOf), `morale`, `resolve.scripts` |
| `flying` | Flying, signature 20 | Closes in round `BATTLE.closingRound[BATTLE.flyingSpeed]` (2) | a single wing | "Flies: reaches the enemy in round 2, whatever its speed." | Fire Sprite, Hornet Swarm; Great Wyrm, Ash Phoenix | existing: `resolve` closing |
| `stealthy` | Stealthy, signature 25 | Hidden from other nations while it leads only stealthy troops (`isStealthy`); hidden commanders take no part in hostility | eye with a diagonal slash | "Stealthy: enemies cannot see it while it leads only stealthy troops." | both Scouts; Wild Spirit | existing: `commanders`, `visibility` |
| `immobile` | Immobile, class | Map speed 0; cannot move or flee: dies when its side retreats | a stone block with roots | "Immobile: it cannot move, and it dies rather than retreat." | Living Monolith, Cinder Idol, World Tree; the garrison holder (hidden) | existing: `movement`, `conflict` |
| `swampwalker` | Swampwalker, class | Attacking in swamp, no `TERRAIN.swamp.battle.attackerAtt` (−1) | three reeds over a wave | "Swampwalker: attacks into swamp without the −1 attack others suffer." | Swamp Fighter | existing: `setup` |
| `undead` | Undead, class, **M2** | Eats no supply (`troopSupply`) | ribcage | "Undead: it eats nothing." | none in M1 (Hollow Court, M2) | existing: `commanders` supply |
| `construct` | Construct, class | Eats no supply | a rune stone (diamond with a stroke) | "Construct: a made thing; it eats nothing." | Fire Sprite | existing: `commanders` supply |
| `beast` | Beast, class | Recruit gold × `max(0, 1 + scaleEffect 'beastCostPct')` (Wild) | paw print | "Beast: cheaper to recruit where the Wild scale is high." | Wolf Rider, Wolf, Hornet Swarm, Salamander | existing: `recruitment` |
| `mounted` | Mounted, class | Content only in M1: a `mount` block and size ≥ 2 (A.4) | horse head | "Mounted: rider and mount fight as one Large body and eat 2 supply." | Ash Rider, Wolf Rider | new: content validation (mounted ⇔ mount, size ≥ 2) |
| `mindless` | Mindless, class | Content only in M1: validation requires morale 50, which never checks (`BATTLE.morale.fearless`) | an eyeless mask | "Mindless: it has no will to break, so it never checks morale." | Fire Sprite, Hornet Swarm | new: content validation (mindless ⇒ mor 50) |

#### Numbers (stat folds and small rules)

| Id | Name, placement | Exact rule | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `regeneration` | Regeneration, signature 23 | End of round: each living troop heals `min(maxHp − hp, maxHp × n)` | leaf inside a circular arrow | "Regenerates {n}% of its HP at the end of every round." | Treant 5%, Wild Spirit 10%, World Tree 10%, Elder Wyrm 10%; Ring of Regrowth 5%; Vigor, Evergreen, Wild Vigor, Greater Evergreen | existing: `resolve` regeneration |
| `lifeDrain` | Life drain, signature 33 | Each damaging hit heals its striker n, paid after the phase, to strikers still alive | a drop with an arrow into a heart | "Life drain {n}: heals {n} HP for every wound it deals." | Blood Thirst blessings (Black) | existing: `attacks` drain |
| `spellPower` | Spell power, signature 26 | Pretender N3: a damage effect rolls `amount + n`, a heal heals `amount + n`; abilities pass 0 | a staff with three rays | "Spell power {n}: its spells deal and heal {n} more." | Ember Hierophant 3; Pyre Staff 2 | N3 tests; new: item fold adds to the body's value |
| `inspire` | Inspiring, signature 27 | I7 (C.1): each squad the bearer leads at battle setup gets +n morale | a pennant with an up chevron | "Inspiring {n}: every squad it leads fights with +{n} morale." | Pendant of Fury 1, Antler Crown 1 | new: `setup` (led squads only; not PD, garrison, summons) |
| `scout` | Scout, signature 29 | Sees n provinces away (`commanderSight`); counts as a scout for `VISION.scoutExactRange` (`isScout`). An item's sight raises the bearer's to the larger of the two | an open eye | "Scout: sees {n} provinces away, and nearby independents' exact strength." | both Scouts 2; Seer's Lens 2 | existing: `visibility`; new: item sight |

#### Retaliation shields (pretender N4)

| Id | Name, placement | Exact rule | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `shield.fire` | Fire shield, signature 24 | N4: each melee hit that deals damage to it owes the striker n fire, minus the striker's fire resistance, at least 0 (U4), paid after the phase | a shield rim with flame tongues | "Fire shield {n}: each blow that wounds it burns the striker for {n}." | Ash Colossus 5, Ash Phoenix 5; Cinder Mantle 3; Cinder Skin 3, Living Pyre 5 | existing: `attacks` fire shield; N4; new: resistance reduces the burn |
| `shield.nature` | Thorns, signature 24 | As `shield.fire`, nature | a shield rim with thorns | "Thorns {n}: each blow that wounds it pricks the striker for {n}." | Heartwood Aegis 3; Thornhide 4 | N4 tests |

#### Resistances (U4)

| Id | Name, placement | Exact rule | Glyph | One line (positive / negative) | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `resist.fire` | Fire resistance / weakness; the card's element mark | U4: damage base −= n for fire, in weapons, spells, shields, and remote damage | outline flame with ▲ (resists) or ▼ (weak) | "Fire resistance {n}: fire hits deal {n} less." / "Fire weakness {n}: fire hits deal {n} more." | Salamander +10, Fire Sprite +10, Flamebrand +3, Oakheart −3, Treant −5; Moss Mantle +5; proposed bodies (A.10) | new: `attacks`, `effects`, `ritualEffects` (A.7) |
| `resist.nature` | Nature resistance / weakness, **M2** | as fire | outline leaf with ▲ or ▼ | "Nature resistance {n}: nature hits deal {n} less." / "... {n} more." | none in M1 | the shared U4 tests cover every element |
| `resist.cold` | Cold, **M2** | as fire | snowflake with ▲ or ▼ | "Cold resistance {n}: cold hits deal {n} less." / "... {n} more." | none in M1 | as above |
| `resist.holy` | Holy, **M2** | as fire | outline sun disc with ▲ or ▼ | "Holy resistance {n}: holy hits deal {n} less." / "... {n} more." | none in M1 | as above |
| `resist.decay` | Decay, **M2** | as fire | skull in an outline drop with ▲ or ▼ | "Decay resistance {n}: decay hits deal {n} less." / "... {n} more." | none in M1 | as above |

The element outlines differ from the filled mana symbols, so "deals fire" never reads as "costs
R" (presentation research 3.10; UI spec rule 8).

#### Weapon properties (chips on the weapon's line)

| Id | Name | Exact rule | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `armorPiercing` | Armor piercing | Protection counts `floor(prot × BATTLE.armorPiercingFactor)` | a split shield | "Armor piercing: halves the target's protection." | Flame Touch, Burning Talons; Hunter's Spear, The Unquenched; Flaming Weapons; Ember Dart | existing: `resolve` damage |
| `armorNegating` | Armor negating | Protection counts 0 | a crossed-out shield | "Armor negating: ignores protection entirely." | Sting | existing |
| `charge` | Charge (condition "first melee round") | `firstRoundBonus` added in the group's first melee round, unless the target braces (U3) | two forward chevrons | "Charge +{n}: +{n} damage in its first melee round, unless the foe holds a reach weapon." | Lance +3; Blazing Charge +5 | existing: `resolve` lances; new: U3 |
| `reach` | Reach | U3: a troop whose group holds a reach melee weapon takes no `firstRoundBonus` | a polearm with a brace bar | "Reach: a charging foe gains no charge bonus against it." | every Spear, Halberd, Hunting Spear; Hunter's Spear | new: U3 (A.6) |
| `strikes` | Strikes | N2: `strikes` swings per troop per melee phase, each drawn and rolled as one attack | two parallel slashes with ×n | "Strikes {n}: swings {n} times each round with this weapon." | Brand of Ash 2, The Unquenched 2 | N2 tests; new: item weapons |
| `trample` | Trample (also signature 10) | N2: strikes at candidates of size ≤ m only; no swing (and no draw) when none stand | a hoof print over a small figure | "Trample: {n} extra blows each round at foes of size {m} or smaller." | Primordial, Elder Wyrm | N2 tests |

#### Boosters (I6)

| Id | Name, placement | Exact rule | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `booster` | Booster, signature 28; condition "has {color}" | I6 (C.1): +n pips in a color the bearer already has, capped at `MAX_PIPS`, for casting and forging only | the color's mana symbol with a small "+" | "+{n} {color} pip for casting and forging, if it already has {color}." | Crown of Embers R+1, Heart of Kharnath R+2, Thistle Rod G+1, Crown of the Ivy King G+1 | new: `pips` (castingPips), `research` (ignores boosters), forge validation |

#### Battle-start triggers (pretender N1)

| Id | Name | Exact rule (effects) | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `primordialFear` | Fear, signature 11 | debuff mor −2, battle, allEnemy | a staring eye with tremble lines | "Fear: at battle start, every enemy fights at −2 morale for the whole battle." | Primordial | N1 test 3 |
| `kindleTheHost` | Kindle the Host, signature 12 | summon fireSprite × 6, friendly | a flame with rising sparks | "Kindle the Host: at battle start, 6 Fire Sprites rise beside it." | Pyre Lord | N1 test 1 |
| `callTheHunt` | Call the Hunt, signature 13 | summon wolf × 8, friendly | a horn with a paw | "Call the Hunt: at battle start, 8 Wolves run to its side." | Horned Hunter | N1 test 2 |
| `burningHost` | The Burning Host, signature 14 | buff mor +2, battle, allFriendly (Warcry's effect) | a horn with flame tongues | "The Burning Host: at battle start, its whole side takes +2 morale for the battle." | Horn of the Burning Host | new: `abilities` (one `buff` per friendly group, round 1, none later); stacks with Warcry (different source) |
| `barkskinSeed` | Barkskin, signature 15 | buff prot +3, battle, friendlySquad (Bark Skin's effect and target rule) | a seed with bark rings | "Barkskin: at battle start, its largest squad grows bark: +3 protection for the battle." | Seed of Barkskin | new: lands on the largest squad, front row first; nothing when it has no squad (N1 all or nothing) |
| `ivyGrasp` | Ivy Grasp, signature 16 | debuff def −3 and att −1, rounds 5, enemySquad (Entangle's effects) | a coiled vine | "Ivy Grasp: at battle start, vines bind the largest enemy squad: −3 defense, −1 attack, 5 rounds." | Crown of the Ivy King | new: `buff` with `untilRound` 5 on the largest enemy front squad; Regrowth can lift it (`removeDebuffs`) |

#### Bodies, chassis, and nations

| Id | Name, placement | Exact rule | Glyph | One line | Users (M1) | Tests |
|---|---|---|---|---|---|---|
| `researches` | Researches, body | Only bodies without `research: false` research (`canResearch`) | an open book | "Researches: this god studies in a lab like a mage." | Oracle of the Flux | existing: `research` |
| `dominionEngine` | Dominion engine, body | Its dominion checks count twice (`ChassisDef.dominionFactor` 2) | a candle with ×2 | "Dominion engine: its monthly dominion checks count twice." | Living Monolith | existing: `dominion` |
| `monthlySummon` | Brood, signature 31 | Pretender N7 | a crescent moon over a paw | "Brood: {n} {unit} join it each month in its own dominion, up to {m} in all." | Mother of Beasts, Cinder Idol | N7 tests |
| `reform` | Undying, signature 30 | Pretender N8 | a flame inside a circular arrow | "Undying: killed in its own dominion, it rises at the capital {n} days later." | Ash Phoenix | N8 tests |
| `avatar` | Avatar, signature 32 | Pretender A.7: the god is blessed in a province its nation dominates | a crown with a halo | "Avatar: the god itself is blessed when it fights in its own dominion." | Ascended Hero; the Avatar boon | pretender tests |
| `bound` | Bound, state chip | Pretender N5: a bound squad that breaks never drags its leader | a chain link | "Bound: when it breaks, it never drags its leader from the field." | battle summons; monthly summons | N5 tests |
| `forestHome` | Forest home, body; condition "in a forest" | `homeTerrain`: +1 def in forests, on either side | a tree | "Forest home: +1 defense in forest provinces, attacking or defending." | every Thornwood unit | existing: `setup` |

**Counts:** 43 entries. 38 have M1 users. The 5 M2 entries (undead, and nature, cold, holy, and
decay resistance) exist so the type and the Codex's elements page are complete. They are
marked M2 and exempt from the orphan rule.

### B.6 What a new ability must bring (M2 and beyond)

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
items ... to >60 units" tedious ([Quarter to Three](https://forum.quartertothree.com/t/dominions-5-warriors-of-the-faith/131532?page=16),
search extract). FM keeps the first and avoids the second: few slots, labs as the only door,
and an AI that equips its own commanders.

### C.1 The rules, one sentence each

These are the sim rules. Each is tested alone (C.12).

| # | Rule | Sentence |
|---|---|---|
| **I1** | Forge | "A mage in an own lab forges an item: it needs the item's pips and research level, pays its mana when the work begins, works for its forge days, and the item then goes to the vault." |
| **I2** | Vault | "Forged, won, and stored items wait in the nation's vault, which any own lab reaches." |
| **I3** | Equip | "A commander standing in an own lab can take an item from the vault into a slot, or put one back." |
| **I4** | Slots | "A commander wears items only in the slots its body has, one per slot, and never two of the same item." |
| **I5** | Effects | "An item adds its numbers and abilities to its wearer; a weapon item replaces its melee weapons." |
| **I6** | Boosters | "A booster adds pips only in a color its wearer already has, for casting and forging, never for research." |
| **I7** | Inspire | "Inspiration adds to the morale of every squad its wearer leads." |
| **I8** | Command and sight | "A leadership item raises the troops its wearer can lead; a sight item lets it see as a scout." |
| **I9** | Spoils | "A commander who dies in or because of a battle leaves its items to the side that holds the field." |
| **I10** | Artifacts | "An artifact is unique: nobody may begin forging it while it is being forged or exists." |

Only commanders wear items. Troops are counts with one HP pool (`Squad`), so items could not
attach to them anyway (items research 1.3). This is one sentence in the Codex.

### C.2 Forging

**Why a command and not generated rituals** (D11): a ritual per item would put 24 records in
the spell registry. They would show in the Research panel's spell lists and the Codex's spells,
the AI's ritual step would see them, and they would break the content tests that match the spell
registry to the `docs/02` lists (`tests/content/spells.test.ts`). A sibling order shares the ritual helpers instead: `ritualPayment` for the split,
`inOwnLab`, `meetsRequirement` with casting pips, and the same interruption rule. One rule, two
users.

```ts
// src/sim/commands/types.ts
| { kind: 'forgeItem'; nation: NationId; commander: CommanderId; item: ItemId; generic?: ManaAmounts }
// src/sim/types.ts  CommanderOrder gains:
| { kind: 'forge'; item: ItemId; daysLeft: number }
```

**Validation** (`validateForgeItem`, first problem only; the UI shows the string):

| # | Check | Refusal |
|---|---|---|
| 1 | own commander | "That commander is not yours" |
| 2 | known item | "Unknown item" |
| 3 | not the garrison holder | "The garrison takes no orders" |
| 4 | not in transit | "{name} is on the move" |
| 5 | standing in a lab in a province its nation owns (`inOwnLab`) | "Items are forged in a lab in a province you own" |
| 6 | nation not Godless (as for rituals, `docs/02` decisions) | "A godless nation cannot forge" |
| 7 | casting pips meet the requirement (I6 boosters count) | "{item} needs RR" |
| 8 | research: the item's color at its level; a generic item at its level in any color | "{item} needs Ember level 3" / "{item} needs research level 2 in any color" |
| 9 | artifacts (I10) | "{item} already exists" / "{item} is being forged" |
| 10 | mana, split as `generic` says or by the default split (`ritualPayment`) | the payment's own message, as for rituals |

**Apply.** It pays the whole cost from the nation's pool, colored first and then the generic
split, and sets the order `{ kind: 'forge', item, daysLeft: forgeDays }`.

**Progress.** `progressForging(state)` runs in tick step 3, right after `progressRituals`, with
its day semantics: `daysLeft − 1` a day. At 0 it re-checks rows 2 to 8 (not mana). On success
the vault gains the item, the order becomes Idle, and the owner gets "Varo forged Brand of Ash
at Kharnath." On failure the order becomes Idle, nothing is refunded, and the message names why
("Varo could not finish Brand of Ash: the lab at Kharnath is lost").

**Interruption.** It works exactly as for rituals: any other order, a move, a retreat, or death
ends the work and the mana is lost. An artifact's reservation ends with the order.

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
future centaur or rider needs only a new plan (M2: `rider`, with no feet and a barding slot).

The paper doll shows a missing slot greyed with the plan's one line: "A wyrm has no hands: head
and charms only." "A beast carries only charms." "An idol holds a single charm."

### C.4 Tiers and prices

| Tier | Shape glyph | Research level | Requirement | Colored mana | Generic mana | Forge days |
|---|---|---|---|---|---|---|
| **Lesser** | ○ circle | 1 to 2 | 1 pip | 4 | 0 | 10 |
| **Greater** | ◆ diamond | 3 to 4 | 2 pips | 8 | 2 | 15 |
| **Artifact** | ★ star | 5 | 3 pips | 12 | 8 | 30 |

- **Formula:** 4 colored mana per requirement pip, +2 per pip beyond the third, plus the
  tier's generic. A generic item pays the colored part as generic too. The formula lives in
  `ITEMS.price` (`src/content/rules.ts`), and a content test checks every item against it.
- **Against income** (items research 7.4, the Phase 6 dummy AI over 10 games): own-color mana
  runs about 7 a month early, 10 to 12 by months 12 to 18, and 15 by month 24. A Lesser item is
  about half a month of early income. An artifact (20) is about two months of mid-game income.
  Rituals cost 2 to 18 (`docs/02` section 6).
- **Against research:** nations start at level 1, so Lesser items exist from day 1. Level 3
  needs a nation that researches; with the starting adept and priest that takes about 24
  months, and with four apprentices about 12. Level 5 is a late prize (`docs/02` thresholds
  `[0, 60, 150, 300, 500, 750, 1050]`). Phase 12 re-measures this with the Phase 7 AI.
- **Measured guide to effect sizes** (items research 7.2; this design's runs). Protection is
  the steepest lever on big bodies: +1 takes a Great Wyrm from 13% to 31% against Cinder's
  starting army. So protection items stay at +1 (Lesser), +2 (Greater), and +3 (Artifact).
  Damage barely helps a body that already kills a man per blow. Extra strikes do.

### C.5 The M1 items

Each item passes the `docs/02` color pie. Red never defends: its items have no protection or
defense. Green never flies, evades, or aims: its items have no defense bonus and no precision.
Generic items stay out of both identities: command, sight, a plain blade, and a ward.
"Measured" is attacker win %, 400 seeds, with the final unit rules (`proto/measure-items*.out.md`).
Dominions analogs are from the [Dom6 manual, ch.
10](https://dmacguigan.github.io/dom6-manual/chapters/10-magic-items.html) and [ch.
11](https://dmacguigan.github.io/dom6-manual/chapters/11-path-boosters.html).

#### Red (Ember): 10 items

| Item | Tier, slot | Req, level | Cost, days | Exact effects | Card line | Measured | Dominions analog |
|---|---|---|---|---|---|---|---|
| **Flame Blade** | ○ weapon | R, 1 | 4 R, 10 | weapon Flame Blade dmg 7, fire | "A blade that never stops burning: dmg 7, fire." | Titan unchanged (40%: it already kills a man per blow). For human generals: Axe 5 or Sword 4 becomes 7 fire | Fire Sword (F1) |
| **Pendant of Fury** | ○ charm | R, 1 | 4 R, 10 | inspire 1 | "The squads it leads fight with +1 morale." | Ash Chieftain's army: 39.5 → 45.0 against Thornwood's start, 77.3 → 82.3 against 20 Heavy Infantry | Pendant of Courage (F1), Horn of Valor |
| **Burning Pearl** | ○ charm | R, 2 | 4 R, 10 | att +2 | "A coal that never cools in its hand: +2 attack." | — (one hit-chance step of about 8 points per blow) | Burning Pearl (F1, att +4) |
| **Brand of Ash** | ◆ weapon | RR, 3 | 8 R + 2, 15 | weapon Brand of Ash dmg 6, fire, strikes 2 | "Strikes twice a round: dmg 6, fire." | Titan alone: 40.3 → 76.0 against 16 independents | Fire Brand, Holy Scourge (2 attacks) |
| **Cinder Mantle** | ◆ body | RR, 3 | 8 R + 2, 15 | hp +6; fire shield 3 | "Burns whoever strikes it: hp +6, fire shield 3." | Titan alone: 40.3 → 49.5; with Brand of Ash 81.5 | Red Dragon Scale Mail (F2) |
| **Pyre Staff** | ◆ weapon | RR, 3 | 8 R + 2, 15 | weapon Pyre Staff dmg 3, fire; spell power 2 | "Its spells burn hotter: spell power +2." | Ember Dart 12 → 14, Fireball 10 → 12, Pyre Storm 14 → 16 (N3) | Wand of Wild Fire |
| **Crown of Embers** | ◆ head | RR, 4 | 8 R + 2, 15 | booster R +1 | "+1 Red pip for casting and forging, if it has Red." | An Ember Adept (R1) casts Fireball and forges Greater items | Flame Helmet (+1 Fire) |
| **Horn of the Burning Host** | ◆ charm | RR, 4 | 8 R + 2, 15 | ability `burningHost` | "At battle start, its whole side takes +2 morale." | As inspire 2 on its own squads: 39.5 → 49.8 against Thornwood's start | Horn of Valor; Warcry |
| **The Unquenched** | ★ weapon | RRR, 5 | 12 R + 8, 30 | weapon The Unquenched dmg 9, fire, armor piercing, strikes 2 | "The sword that never cools: dmg 9, fire, armor piercing, strikes twice." | Titan alone: 77.0 against 16 independents; with Cinder Mantle and Burning Pearl 87.0 | Unquenched Sword (F5) |
| **Heart of Kharnath** | ★ charm | RRR, 5 | 12 R + 8, 30 | booster R +2 | "+2 Red pips for casting and forging, if it has Red." | A Cinder Magus (R2) casts Pyre Storm (RRR) with spare pips for fatigue | Orb of Elemental Fire, The Forbidden Light (+2) |

#### Green (Loam): 10 items

| Item | Tier, slot | Req, level | Cost, days | Exact effects | Card line | Measured | Dominions analog |
|---|---|---|---|---|---|---|---|
| **Hunter's Spear** | ○ weapon | G, 1 | 4 G, 10 | weapon Hunter's Spear dmg 6, armor piercing, reach | "A boar spear: dmg 6, armor piercing, and it blunts charges." | — (for generals; braces against Ash Riders) | Hunter's Knife (N1) |
| **Barkskin Amulet** | ○ charm | G, 1 | 4 G, 10 | prot +1 | "Bark creeps over its skin: +1 protection." | Titan alone: 40.3 → 60.5; Great Wyrm against Cinder's start: 12.8 → 31.3 | Barkskin Amulet (N1) |
| **Moss Mantle** | ○ body | G, 2 | 4 G, 10 | fire resistance 5 | "Damp moss smothers flame: fire resistance 5." | — (against Red's fire weapons and spells) | — (FM's answer to fire) |
| **Ring of Regrowth** | ◆ charm | GG, 3 | 8 G + 2, 15 | regeneration 5% | "Its wounds close: regenerates 5% of its HP each round." | Great Wyrm against Cinder's start: 12.8 → 41.0 | Ring of Regeneration (N2) |
| **Barkhide** | ◆ body | GG, 3 | 8 G + 2, 15 | prot +2, hp +6, def −1 | "Living bark grows over its armor: +2 protection, +6 HP, −1 defense." | Titan alone: 40.3 → 67.0 (a wyrm has no body slot) | Green Dragon Scale Mail (N2) |
| **Thistle Rod** | ◆ weapon | GG, 3 | 8 G + 2, 15 | weapon Thistle Rod dmg 3; booster G +1 | "+1 Green pip for casting and forging, if it has Green." | A Sapling Druid (G1) casts Entangle and Swarm | Thistle Mace (+1 Nature) |
| **Antler Crown** | ◆ head | GG, 4 | 8 G + 2, 15 | inspire 1, prot +1 | "Its squads fight with +1 morale; +1 protection." | Warden Captain's army: 60.5 → 68.3 against Cinder's start (the inspire part alone) | Horn of Valor |
| **Seed of Barkskin** | ◆ charm | GG, 4 | 8 G + 2, 15 | ability `barkskinSeed` | "At battle start its largest squad grows bark: +3 protection." | Warden Captain's army: 60.5 → 74.5 against Cinder's start | Handful of Acorns (a battle effect) |
| **Crown of the Ivy King** | ★ head | GGG, 5 | 12 G + 8, 30 | booster G +1; hp +10; ability `ivyGrasp` | "+1 Green pip; +10 HP; vines bind the largest enemy squad at battle start." | — (the hp +10 row of items research 7.2: Great Wyrm 14% → 20%) | Crown of the Ivy King (N2) |
| **Heartwood Aegis** | ★ body | GGG, 5 | 12 G + 8, 30 | prot +3, hp +10; thorns 3 (nature shield) | "Heartwood grows over it: +3 protection, +10 HP, thorns 3." | Titan alone: 94.0 against 16 independents; with Ring of Regrowth and The Unquenched 60.5 against 20 Heavy Infantry | Boots of Antaeus, Blacksteel Plate |

#### Generic: 4 items

Generic items have no color. Their requirement is one pip of any color (`W/U/B/R/G`, the first
M1 use of the hybrid notation `docs/02` already parses). They need their level in any research
track and are paid in generic mana.

| Item | Tier, slot | Req, level | Cost, days | Exact effects | Card line | Measured |
|---|---|---|---|---|---|---|
| **Fine Blade** | ○ weapon | any, 1 | 4, 10 | weapon Fine Blade dmg 6; att +1 | "A well-balanced blade: dmg 6, +1 attack." | — (for priests, mages, and scouts who end up in melee) |
| **Banner of Command** | ○ charm | any, 1 | 4, 10 | leadership +40 | "Leads 40 more troops." | A pretender with leadership 20 can lead 60 (I8) |
| **Seer's Lens** | ○ head | any, 1 | 4, 10 | sight 2 | "Sees 2 provinces away, as a scout does." | (I8; the vision rules) |
| **Charm of Warding** | ○ charm | any, 2 | 4, 10 | def +1 | "A ward against blows: +1 defense." | Titan alone: 40.3 → 50.0 |

**Slots in use:** weapon 7 items, head 4, body 4, charm 9. Every slot holds at least 4.

**The strongest M1 kit to watch.** A Great Wyrm wearing Ring of Regrowth and Barkskin Amulet
(two charms, 14 mana of which 12 Green, research level 3) wins 69.3% alone against Cinder's starting army,
up from 12.8% (`proto/measure-items.out.md`). That is Dominions' super combatant, built on a
220-point body. M1 already has its answers: Green's Swarm and Red's Ember Dart drop a kitted
Wyrm to 0% and 59% (items research 7.2). Phase 12 pins it as a band (E.3). The first knob is
Ring of Regrowth at 4%, the second its level 4.

**Withdrawn after measuring** (D17, D18):
- a second regeneration item: two 5% items and Barkskin made a Great Wyrm win 95.3% against
  Cinder's starting army;
- Horn of the Wild Hunt (4 wolves at battle start): staged as a squad, it cut a general's win
  from 39.5% to 26.3%, because fast wolves drag the front into contact early (D18);
- Giant's Girdle (str +3): no change on a Titan (41%);
- Warded Shield (def +2): it would need a shield slot and the two-handed rule, and def +2
  lifted a Titan 25 points, too much for a Lesser item.

### C.6 Artifacts

- **Unique** (I10). `artifactStatus(state, id): 'free' | 'forging' | 'exists'` scans vaults,
  worn items, hoards, and forge orders. No new state. Dominions has the same rule: "You will not
  be able to forge a unique artifact ... that is already in existence" ([manual ch.
  10](https://dmacguigan.github.io/dom6-manual/chapters/10-magic-items.html)).
- **Reserved when forging begins.** FM runs in continuous time, so Dominions' "multiple players
  ... the same turn ... one ... randomly chosen" ([illwiki, Dom6
  magic](https://illwiki.com/dom5/dom6/magic), search extract) cannot happen. A second
  `forgeItem` is refused with "{item} is being forged". There is no dice and no lost mana.
- **Destroyed artifacts return to the forge.** Elimination destroys them (C.8), and they can
  then be forged again.
- **Four in M1**: The Unquenched, Heart of Kharnath, Crown of the Ivy King, Heartwood Aegis.
  There is no yearning and no per-turn cap: matches are short and artifacts few (items research
  1.7).
- **Visible to all.** The Ledger's Items tab lists every artifact that exists in the world. It
  names the holder only when that holder has been seen in battle or is in sight. A star on an
  army badge marks a commander wearing one (D.1).

### C.7 Equipping and transfers

```ts
| { kind: 'equipItem'; nation: NationId; commander: CommanderId; item: ItemId; slot?: ItemSlot }
| { kind: 'unequipItem'; nation: NationId; commander: CommanderId; slot: ItemSlot }
```

**Where:** only while the commander stands, not in transit, in a lab province its nation owns.
That is the same door `giveMana` uses today. Dominions: "Commanders in a lab can exchange items
and gems with the nation's treasury" ([illwiki
Laboratory](https://illwiki.com/dom5/laboratory), search extract). **Field swaps between
commanders are M2.**

**Validation of `equipItem`** (first problem):
1. "That commander is not yours";
2. "The garrison takes no orders";
3. "Unknown item";
4. "{name} is on the move";
5. "Items change hands in a lab in a province you own";
6. "No {item} in the vault";
7. the slot exists on the body and fits the item's kind: "A wyrm has no hands: head and
   charms only" (the plan's line);
8. "Already wears {item}";
9. a full slot: equipping **swaps**, and the old item goes to the vault (one command, so the
   UI's drag and drop is one action). A charm with no slot named takes the first free charm
   slot, else swaps charm1;
10. a swap that removes leadership is refused when the troops led would exceed the new
    leadership: "Without the Banner of Command, Varo can lead only 20 troops".

`slot` may be left out: the item's kind picks the slot, the first free charm for charms.

**Validation of `unequipItem`:** checks 1, 2, 4, and 5; "That slot is empty"; and the
leadership check of 10.

**Orders are untouched.** Equipping does not interrupt research, rituals, or forging. A forge
or ritual re-checks pips at completion, so removing a booster mid-work can fail it, with a
message naming why.

**Who never equips:** Independents (they issue no commands) and the garrison holder.

### C.8 Death, spoils, and hoards (exact)

| Event | Where the items go | Where in code |
|---|---|---|
| A commander dies in battle (the result marks it dead) | **The winning side**: its nation's vault, or, if Independents won, the battle province's hoard. This includes the winner's own dead | `battle/apply.ts`, before `commanderDies` |
| A commander dies because of a battle (a loser with nowhere to retreat, or an immobile one that cannot flee) | The winning side, as above | `conflict.ts retreat`, before `commanderDies` |
| The province with a hoard is captured | The whole hoard goes to the captor's vault, with a message: "Found at Ashfen: Flame Blade" | `capture.ts captureProvince` |
| The nation is eliminated | Its vault and every item its commanders wear are **destroyed**; artifacts become forgeable | `victory.ts` |
| The pretender is recalled (Godless) | Its own vault | `pretender.ts recall`, before `removeCommander` |
| The Ash Phoenix reforms (N8) | Nothing returns with it: its items went to the battle's winner | — |
| Any other death outside battle (none exist in M1: commanders never starve below 1 HP) | The province owner's vault, or the hoard of an Independent province | `dropItems` default |

```ts
// src/sim/items.ts
export type ItemDestination = { kind: 'vault'; nation: NationId } | { kind: 'hoard'; province: ProvinceId } | { kind: 'destroyed' };
/** Moves every item the commander wears, in slot order, to the destination, and posts the messages. */
export function dropItems(state: GameState, commander: CommanderState, to: ItemDestination): void;
```

- **Order:** dead commanders in battle setup order (attacker side first), then retreat deaths
  in the order `retreat` visits them; items in slot order. No rng.
- **Messages:** the winner gets "Spoils at Ashfen: The Unquenched, from Varo the Ember", and the
  loser gets "Lost at Ashfen: The Unquenched (Varo the Ember fell)".
- **Hoards are seen like armies.** A province's hoard shows in its tooltip to any nation that
  has the province in sight (`visionOf`).
- **Why the winner takes all** (D14). It is deterministic and fits one sentence. Dominions'
  pickup chance by tier (30% to 75% for enemy items, [illwiki](https://illwiki.com/dom5/items),
  search extract) is dice the player cannot plan around. Total War's "lost, except legendary"
  ([TW wiki](https://totalwarwarhammer.fandom.com/wiki/Rarity), search extract) destroys
  stories. A fallen champion's blade passing to its slayer's nation is the story.

### C.9 How items fold in

**Battle** (`battle/setup.ts statsFor`, one more argument: the commander's worn items, in slot
order). Additions commute, so only the weapon step is ordered:

1. Stats: hp, str, att, def, prot, prec add.
2. **Weapon:** the item's weapon replaces every melee weapon (no `range`). Ranged weapons stay,
   so a Great Wyrm keeps its breath (it has no weapon slot in any case). The unit's own weapon
   returns when the item comes off. Dominions: "when the new item is withdrawn, the standard
   item re-appears" ([manual ch. 4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)).
3. Then the blessing's melee fold (pretender A.6) applies to whatever melee weapon the body now
   holds, so an Avatar god's Flame Blade also gains Flaming Weapons.
4. Regeneration adds. Shields merge by element (N4). Resistances add. Spell power adds.
5. **Inspire** (I7): in `sideSetup`, every squad led by the commander gets `mor += inspireOf(c)`.
   Provincial defense and garrison squads have no leader. Troops summoned during the battle use
   side-level stats and are not inspired.
6. **Triggers:** `BattleCommanderSetup.abilities` holds the body's triggers, then the items'
   triggers in slot order.
7. **Pips:** `BattleCommanderSetup.pips = castingPips(c)` (I6), so `knownSpells` and the fatigue
   reduction for extra pips both see boosters.
8. **Roster:** `BattleRoster` commanders gain `items: ItemId[]`, so a replay draws gear and the
   report can name spoils (D.9).

**Map:**
- `castingPips(c)` adds boosters, in colors with pips ≥ 1, capped at `MAX_PIPS`. The ritual
  `castBlocker`, forge validation, `knownSpells`, and the UI read it. `researchRate` and
  `canResearch` keep reading base pips (I6). The bless reads the design's pips and is untouched.
- `leadershipOf(c)` = unit leadership + item leadership. The transfer check
  (`commands/army.ts`), ritual summons (`rituals.ts`), and monthly summons (N7) read it.
- `commanderSight(c)` = the larger of the unit's sight and the items' sight. `isScout(c)` is
  true when either is set.

### C.10 The AI: forge and equip

Simple, data-driven, and using the same commands. Every number lives in content.

```ts
// ItemDef.ai: { roles: readonly AiItemRole[]; rank: number }       AiItemRole = 'champion' | 'general' | 'mage' | 'scout'
// NationDef.ai.forge: readonly ItemId[]                              the nation's forging priority
```

**Roles of a commander:**
- **champion:** its pretender, when the chassis role is leader, fighter, monster, raider, or
  summoner (pretender D8);
- **mage:** any commander with color pips;
- **general:** leadership 40 or more and no color pips;
- **scout:** sight set.

A commander may have several roles. It takes the best item over all of them.

**Item roles** (content, `ItemDef.ai.roles`):
- champion: Flame Blade, Burning Pearl, Brand of Ash, Cinder Mantle, The Unquenched, Hunter's
  Spear, Barkskin Amulet, Ring of Regrowth, Barkhide, Crown of the Ivy King, Heartwood Aegis,
  Banner of Command, Charm of Warding;
- general: Flame Blade, Pendant of Fury, Horn of the Burning Host, Hunter's Spear, Barkskin
  Amulet, Moss Mantle, Antler Crown, Seed of Barkskin, Fine Blade, Banner of Command, Charm of
  Warding;
- mage: Pyre Staff, Crown of Embers, Heart of Kharnath, Thistle Rod, Crown of the Ivy King,
  Moss Mantle;
- scout: Seer's Lens.

**Forge** (a new step right after `docs/08` step 8, Rituals, on the same cadence):
1. Take each own mage that is idle or researching, stands in an own lab, and is not casting or
   forging.
2. Pick the first item of `NationDef.ai.forge` that passes all of these:
   - `validateCommand(forgeItem)` accepts it with the default split;
   - the nation's mana is at least twice the item's cost (the `docs/08` ritual rule);
   - no unworn copy is in the vault;
   - some own commander with one of the item's roles has a fitting slot that is empty or holds
     a lower-ranked item.
3. Issue `forgeItem`. Rituals keep priority: the forge step skips mages the ritual step just
   used.
4. The research step (`docs/08` step 3) must not replace a `forge` order, which would throw away
   the mana already paid. `docs/PROGRESS.md` records the same rule for rituals.

**Equip** (every planning call): for each own commander standing in an own lab, not in transit,
and in slot order:
- take the highest-ranked vault item for one of its roles that fits;
- equip it into an empty slot, or swap it for a lower-ranked item.

Ties go by content order. The AI never moves a commander just to equip; generals and the
pretender pass the capital's lab often.

**Forge priorities** (content):
- Cinder Horde: Pendant of Fury, Flame Blade, Crown of Embers, Horn of the Burning Host, Brand
  of Ash, Pyre Staff, Cinder Mantle, The Unquenched, Heart of Kharnath.
- Thornwood: Barkskin Amulet, Ring of Regrowth, Thistle Rod, Antler Crown, Seed of Barkskin,
  Barkhide, Hunter's Spear, Crown of the Ivy King, Heartwood Aegis.
- Generic items are forged only when the nation's list is exhausted. Banner of Command comes
  first if a pretender leads troops beyond its leadership.

**Ranks** (content): The Unquenched, Heart of Kharnath, and Heartwood Aegis 10; Crown of the Ivy
King 9; Brand of Ash, Horn of the Burning Host, Ring of Regrowth, and Seed of Barkskin 8;
Crown of Embers, Barkhide, and Thistle Rod 7; Cinder Mantle, Pyre Staff, and Antler Crown 6;
Pendant of Fury, Barkskin Amulet, and Seer's Lens 5; Banner of Command 4; Burning Pearl, Moss
Mantle, and Charm of Warding 3; Flame Blade and Hunter's Spear 2; Fine Blade 1.

**AI behavior tests** (`tests/ai/items.test.ts`):
- in at least 80% of 20 headless games each AI nation forges an item by month 12;
- every forged item is worn within 60 days unless no own commander can wear it;
- the AI never issues a refused item command;
- the 365-day determinism hash holds with forging.

### C.10a Data shapes

```ts
// src/content/items/types.ts
export type ItemTier = 'lesser' | 'greater' | 'artifact';
export interface ItemEffects {
  stats?: Partial<Record<'hp' | 'str' | 'att' | 'def' | 'prot' | 'prec', number>>;
  weapon?: WeaponDef;                                   // I5: replaces melee weapons
  regeneration?: number;                                // share of max HP a round
  shields?: readonly Shield[];                          // N4
  resist?: Partial<Record<DamageElement, number>>;      // U4
  spellPower?: number;                                  // N3
  inspire?: number;                                     // I7
  boost?: Partial<Record<Color, number>>;               // I6
  leadership?: number;                                  // I8
  sight?: number;                                       // I8
  abilities?: readonly AbilityId[];                     // trigger entries (B.5)
}
export interface ItemDef {
  id: string;
  name: string;
  /** Null for generic items. */
  color: Color | null;
  tier: ItemTier;
  kind: ItemKind;
  /** docs/02 notation: 'R', 'GG', 'RRR'; 'W/U/B/R/G' for generic items. */
  requirement: string;
  /** Research level in `color`, or in any color for generic items. */
  level: number;
  cost: { mana: ManaAmounts; generic: number };
  forgeDays: number;
  /** The lore line; its first sentence is the card line. */
  description: string;
  effects: ItemEffects;
  ai: { roles: readonly AiItemRole[]; rank: number };
}
// src/content/presentation/items.ts (the sim never reads it): ItemLook { part, variant, glow?: Element, sound? }
```

**Content validation** (`tests/content/items.test.ts`):
- ids are unique, and none clashes with a spell or ability id;
- the requirement parses and holds `color`; a generic item uses `W/U/B/R/G`;
- the level is 1 to 6, and the tier matches its band (C.4);
- the cost matches `ITEMS.price` for the tier and requirement, and forge days match the tier;
- the kind exists on at least one body plan;
- a weapon item is melee (no `range`), and only weapon items carry a weapon;
- abilities are trigger entries;
- Red items carry no prot or def above 0, and Green items no def or prec above 0 (the color pie
  as a test);
- the description's first sentence is at most 120 characters;
- every item has a look;
- two items with the same look and kind have equal effects (Battle Brothers' lesson, [Dev Blog
  #34](https://battlebrothersgame.com/dev-blog-34-new-armor-helmet-rework-banners/), search
  extract).

### C.11 State and save changes

```ts
// src/sim/types.ts
CommanderState.items: Partial<Record<ItemSlot, ItemId>>;          // {} for every new commander and arrival
CommanderOrder:  | { kind: 'forge'; item: ItemId; daysLeft: number };
NationState.vault: Partial<Record<ItemId, number>>;               // a multiset: plain items have no identity
ProvinceState.hoard: Partial<Record<ItemId, number>>;
// src/sim/battle/events.ts  BattleRoster commanders gain items: ItemId[]
```

- **One `STATE_VERSION` step**, after the pretender's. Its migration adds `items: {}`, `vault:
  {}`, `hoard: {}`, and `items: []` on stored roster commanders. No save exists before Phase 9,
  so the migration runs only on fixtures, as the battle design notes for its own step.
- **Hash.** The determinism hash covers the new fields. Its expected value changes once, in the
  commit that adds them.
- **No item instances.** Items have no durability, rolls, or history in M1, so counts suffice.
  Item history ("slew the Ash Chieftain at Kharsk Ford") is M2. It would need instances, or be
  derived from battle summaries (presentation research P14).
- **Selectors** (`src/sim/items.ts`): `castingPips`, `leadershipOf`, `itemsOf(c)`,
  `artifactStatus`, `itemLocations(state, nation)` for the Ledger, and `forgeBlocker(state, c,
  item)` (the validator's reason, for the UI).

### C.12 Tests (`tests/` mirroring `src/`)

- **I1 Forge** (`tests/sim/items.forge.test.ts`):
  - forging pays, counts down, and puts the item in the vault on its last day;
  - every refusal row of C.2;
  - another order, a move, a retreat, or death ends it with the mana lost;
  - the completion re-check fails with a message when the lab is lost or a booster is removed;
  - a booster lets an R1 adept forge an RR item.
- **I2 and I3** (`tests/sim/commands/items.test.ts`):
  - equip and unequip only in an own lab, standing still;
  - a swap sends the old item to the vault;
  - the leadership refusal;
  - the garrison holder is refused;
  - foreign commanders are refused.
- **I4:** a body plan without the slot refuses with the plan's line; duplicates are refused;
  charms fill charm1 then charm2.
- **I5** (`tests/sim/battle/setup.test.ts`):
  - `statsFor` adds item stats;
  - a weapon item replaces melee weapons and keeps ranged ones;
  - the unit weapon returns after unequipping;
  - regeneration, shields (merged by element), resistances, and spell power add;
  - an Avatar god's item weapon takes the blessing's melee fold.
- **I6:** `castingPips` adds only in colors with a pip and caps at `MAX_PIPS`; `knownSpells`
  sees boosted pips; `researchRate` does not.
- **I7:** inspire raises the morale of led squads only (not PD, the garrison, other commanders'
  squads, or battle summons).
- **I8:** `leadershipOf` with a banner allows a larger transfer; `commanderSight` and `isScout`
  with a lens change vision.
- **I9** (`tests/sim/items.spoils.test.ts`):
  - the winner's vault takes a dead enemy's items and its own dead's items;
  - Independents' wins go to the hoard, and capture moves the hoard to the captor's vault with a
    message;
  - a retreat death goes to the winner;
  - elimination destroys;
  - recall goes to the own vault;
  - the order of messages is fixed.
- **I10:** a second forge of an artifact is refused while one is forging or exists; it is
  allowed after the holder's nation is eliminated.
- **Triggers from items:** Horn of the Burning Host, Seed of Barkskin, and Ivy Grasp fire in
  round 1, in slot order after the body's, through the N1 code.
- **Determinism:** the hash test over 365 days with AI forging and equipping, twice, equal.
- **Fixtures** (CLAUDE.md): all 24 items and all body plans in the content fixtures.

### C.13 What items never do in M1

They do not:
- raise their own wearer's morale (inert: a commander routs with its last squad, items research
  7.2);
- grant spells to non-mages;
- add research points;
- change the bless;
- give carried mana, gold, materials, or monthly mana;
- reach troops, except through inspiration and battle-start triggers;
- curse, weigh, wear out, roll random stats, or form sets;
- summon troops for an army (D18);
- stack regeneration (D17).

Each is a rule that does not earn its place in M1. Several return in M2 (E.2).

---

## D. Presentation layers

The UI spec defines the layers: L0 glance, L1 hover (Shift for L1+), L2 concept, L3 panel, and L4
screen (UI spec 1.1). It also defines one `UnitCard` with six variants (UI spec 6.4). The
presentation research found that every game in its set layers unit detail the same way:
- a glance card with identity, state, and a few numbers;
- a hover with the full block;
- a detail view with sources and gear;
- an encyclopedia that compares.

It also found that hidden roll-changers are the most common complaint (presentation research
0.1, findings 1 to 3). This part fills in what units and items show at each layer.

### D.1 Rules

1. **Budgets are content and are tested.** `UI.unitCard` in `src/content/ui.ts` holds
   `maxNumbers: 3`, `maxGlyphs: 3`, `maxElementMarks: 1`, `oneLineMax: 120`, and
   `sizeScale: [0.62, 0.74, 0.86, 1, 1, 1]`. A UI derive test fails when any unit's card
   exceeds them. Civilization VI raises a data error when a unit has more than four stats to
   show (presentation research 1.4, [CQUI's copy of unitpanel.lua](https://raw.githubusercontent.com/CQUI-Org/cqui/master/Assets/UI/Panels/unitpanel.lua)).
2. **Silence for zero and none.** Zero resistances, an empty ability list, MR, and leadership
   on troops never render. Empty table columns are dropped.
3. **Per troop, then the squad.** Stats are per troop. A squad adds its count, HP%, and state.
4. **Nothing that changes a roll is hidden.** Every modifier the resolver applies shows in three
   places: the stat's Shift breakdown, the per-blow detail (battle design S1.3), and the Codex.
   That now includes gear, items, size, reach, and resistance.
5. **One number, one source.** Every number comes from a sim selector, run with a trace for
   breakdowns or with a what-if override for previews (UI spec rule 3). Equip deltas use the
   same fold as battle setup.
6. **One home per fact.** A weapon's properties live on its line. Gear composition lives on the
   Protection row, and materials composition on the cost row.
7. **Glyph, word, and number, never hue alone.** Deltas carry a sign and ▲ or ▼. Elements carry
   outline glyphs. Tiers carry shapes (○ ◆ ★) beside the mana symbol.

### D.2 The unit card (L0)

**The sprite is the first stat.** It is the battle sprite: the nation's armor and weapon
layers, picked from the gear ids, plus the shield, the mount, and a commander's item parts. It
is drawn to scale on a shared baseline (`UI.unitCard.sizeScale`). Size 4 and up fills the frame
and breaks its top edge by up to 8 px. A Giant looks big before anything is read.

```
 Recruit variant (72 x 96)       Squad variant                 Box variant (Battle Plan)
 +--------------------+          +--------------------+        +-------------+
 |   [sprite, to      |          | [sprite]      x37  |        | [sprite] r4 |
 |    scale, gear]    |          | ===========-- 82%  |        | Halberd 19  |
 | Briar Guard        |          | (F) [reach] [leaf] |        | (F)(M)(R) ->|
 | HP 12 Prot 9 Dmg 19|          +--------------------+        +-------------+
 | [reach] [tree]     |
 | 24g 26m  14d/10    |
 +--------------------+
```

**Headline numbers by role**, at most 3. They come from `cardNumbers(unit)`, a pure UI derive
over content (presentation research 3.2):

| Role | Numbers |
|---|---|
| infantry, cavalry, monsters, champions | ♥ HP · ⛨ Prot · ⚔ Dmg (str + best melee weapon, including a charge's first round as "17+3") |
| archers and skirmishers | ♥ HP · ⛨ Prot · ➶ Shot (dmg) with a range mark |
| mages and priests | ♥ HP · pips on the frame · holy for priests |
| scouts | ♥ HP · eye with the sight distance |

**Glyph row**, at most 3: signature abilities by `cardPriority`, then the best melee weapon's
chips (Charge, Reach, AP, AN), then "+N" (B.4). A squad's state chips come first.

**Element mark**, at most 1: the largest resistance or weakness. Examples: "▼ (flame)" on a
Treant, "▲ (flame)" on a Salamander. Nothing shows when the unit has none.

**Commander extras** (portrait frame): a gear count and the best tier's shape (○ ◆ ★). An army
badge on the map shows a small ★ when its commander wears an artifact.

| Variant | Adds for this design |
|---|---|
| `recruit` | the materials cost, with its breakdown on hover (A.5) |
| `squad` | size class silhouette at 12 px when not man-sized |
| `box` | reach dots; the closing round; Charge and Reach chips |
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
| vs Ash Rider: about 1 in 3 swings fells one; their charge is      |  matchup (M1-should, D.11)
| blunted.                                                          |
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
| Size class | always | "Size sets how many blows a body draws and how much it eats; larger bodies cannot be trampled by smaller tramplers." |
| Speed in words | always | "Fast closes in round 2, normal in 3, slow in 4; archers shoot until then." |
| Body block | always; Prec only with a ranged weapon or spells; MR never in M1 | one line each (`concepts.ts`) |
| Weapon lines | each weapon, the mount's included | "Damage = strength + weapon in melee; weapon alone for shots." |
| Chips | when the weapon has them | the catalog's line (B.5) |
| Rides | mounted units | "Rider and mount fight as one Large body." |
| Gear | units with pieces or natural armor | "Each piece adds protection; materials pay for it." |
| Abilities | each signature and body entry | the catalog line; "(inactive: ...)" when its condition is unmet here |
| Resistances | non-zero only | the catalog's positive or negative line |
| Items | commanders wearing items | each item's card line, marked with its tier shape |
| Matchup | with the odds selector (D.11) | "About 1 in N swings fells one." |
| Economy | always | upkeep, supply by size, cost, days |

**Shift (L1+)** expands without a click (UI spec 5.1):
- **Every stat into its sources.** Base, gear, items, home terrain, Fury and Lore scales,
  bless, buffs, starvation and unpaid morale, storm, and walls, from the stat selector's trace.
  Example: "Prot 9: thornplate 7, iron cap 2" and "Def 10: skill 11, thornplate −1, forest home
  +1 (inactive)".
- **The weapon line into its damage parts.** "Halberd: str 12 + 7 = 19 against prot (AP: 9 →
  4)". With U4: "Fire Arrows 6 against a Treant: 6 + 5 (fire weakness) = 11 against prot 12".
- **The cost row into its materials.** "26 = thornplate 18 + halberd 6 + iron cap 2".
- **The matchup into a "damage versus" list** against every enemy unit type the player has
  seen, best targets first (Wesnoth's "Damage versus", presentation research 1.8).

### D.4 Concepts (L2)

New entries for `src/content/concepts.ts` (beyond the UI spec's 55): Size, Size class, Gear,
Natural armor, Protection, Defense skill, Weapon, Reach, Charge, Strikes, Trample, Armor
piercing, Armor negating, Element, Resistance, Mount, Role, Item, Slot, Body plan, Vault,
Hoard, Spoils, Forging, Tier, Artifact, Booster, Inspiration, and Matchup. Each has a
`summary` (one or two lines; the sentences of A, B, and C) and a `body` (the Codex paragraph,
with the rule in words and its numbers).

### D.5 The detail page (L3) and the Codex (L4)

**Squad sheet** (`I`, right-click, or Ctrl+click on a squad card) is the Codex unit page with a
live block on top: count and HP, wounds carried, active effects, its commander, and its
battles. It is the same component, so the two cannot drift (presentation research 3.5).

**Codex unit page**, in order:
1. Header: name, nation, role, size class with silhouette, and the sprite at 2× with gear.
2. Lore: the full description.
3. Body block: the L1 numbers.
4. **Weapons table:** name, damage, reach dots, chips, element, materials.
5. **Kit strip:** each gear piece as a tile with its sprite part, name, protection, defense,
   and materials. It is the paper doll's frame in read-only form (presentation research 3.7).
6. **Mount**, for riders.
7. **Abilities:** glyph, name, one line, then the codex paragraph (MTG's reminder text,
   presentation research 2.5).
8. **Resistances** (non-zero), linked to the Elements page.
9. **Recruitment:** where, cost with its materials breakdown, days, requirements, upkeep, and
   supply by size.
10. **Matchups** against every unit in the game. The Codex is public knowledge, like Dominions'
    manual and inspector.
11. **Related:** the same role in the other nation, units of the same size class, and the
    concepts.

**New Codex topics** (UI spec 5.2 lists the existing ones):

| Topic | What it adds that a tooltip lacks |
|---|---|
| **Units table** | sortable columns (HP, Prot, Mor, Str, Att, Def, Prec, Size, Speed, best hit, best shot, materials, upkeep, supply), each cell with a small common-scale bar (presentation research 2.4); filter chips: nation, role, size class, tag, ability, element dealt, resistance, mounted, summon only, commander. Advanced players type `prot >= 7`, and the chips build the same query (the Dom6 Data Inspector's property search, [dom6inspector README](https://raw.githubusercontent.com/larzm42/dom6inspector/master/README.md)) |
| **Sizes: from horses to giants** | every unit and body at true visual size on one baseline beside a man, grouped by size class, with each class's three rules (M1-should, sprites in Phase 11) |
| **Gear** | the 13 pieces with their numbers, materials, and wearers (back-links) |
| **Abilities** | every catalog entry with every unit, item, blessing, and chassis that has it |
| **Elements** | each element's glyph, the weapons and spells that deal it, and the units and items that resist it or are weak to it |
| **Items** | a table by slot and tier, with filters (color, tier, slot, "usable by", "forgeable now"), each row linked to its page: effects, requirement, level, cost, days, analogs, and where it is (own vault, worn by, being forged, known abroad) |
| **Body plans** | the five plans, their slots, and the bodies on each |

### D.6 The commander's Gear tab: the paper doll

The Commander panel has Overview, Battle Plan, and Rituals today (UI spec 2.8.2). **Gear** is its
fourth tab, which is the UI spec's maximum for a dock panel. It opens on `G` while a commander
is selected.

```
+------------------------------------------------------------------------------------+
| Gear · Varo the Ember (Cinder Magus R2)                  Kharnath · lab: yes       |
+---------------------+----------------------------+---------------------------------+
| [Head]              |                            |  HP       11                    |
|  Crown of Embers ◆  |    full-body sprite 2x     |  Prot      2                    |
|                     |    wears what is shown     |  Pips     R3 (R2 + Crown)       |
| [Body]              |                            |  Hovering Pyre Staff:           |
|                     |                            |  Spell power 0 → 2 ▲2           |
|  Ritual Vestments   |                            |  Abilities granted:             |
|  (standard)         |                            |   (pip+) Booster: +1 Red pip    |
| [Weapon]            |                            |                                 |
|  Staff 2 (standard) |      Man-sized (1)         |  Shift: full comparison         |
| [Charm] [Charm]     |                            |                                 |
|  empty   empty      |                            |                                 |
+---------------------+----------------------------+---------------------------------+
| Vault (Cinder Horde, at your labs)  [All][Weapon][Head][Body][Charm][Usable by Varo]|
| [Pyre Staff ◆] [Pendant of Fury ○] [Flame Blade ○]                                 |
| [Thistle Rod ◆: "its Green pip needs a Green mage; its staff works"]               |
| [Crown of Embers ◆, greyed: "Already wears it"] ...                                |
+------------------------------------------------------------------------------------+
```

**Rules on screen.** Each is a validated sim rule and a sentence:
- **Slots follow the body.** A slot the plan lacks is drawn greyed with its line: "A wyrm has
  no hands: head and charms only" (Dominions: "A non-human commander may not have a head slot",
  [manual ch. 4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)).
- **Standard kit shows as "(standard)".** An item drawn over it says "over Bark Mail". A weapon
  item says "replaces Staff 2", and the staff returns when the item comes off.
- **Hovering a vault item writes deltas on the stat rows** (XCOM 2's armory,
  [UISoldierHeader.uc](https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UISoldierHeader.uc)):
  `Prot 2 → 3 ▲1`. Every changed stat appears, with sign and arrow. The deltas come from
  `commanderStats(state, id, { itemsOverride })`, the same fold as battle setup (D.11).
- **Dragging lights the valid slots** (Battle Brothers' `is-equipable`, [paperdoll
  module](https://raw.githubusercontent.com/Battle-Brothers-Legends/Legends-public/master/ui/screens/character/modules/character_screen_left_panel/character_screen_paperdoll_module.js)).
  A click on a vault item equips it into its slot, the first free charm for charms. A click on
  a slot filters the vault to that kind. Dropping on a full slot swaps (C.7).
- **Unusable items stay listed, greyed, with the validator's reason** (XCOM 2's locker,
  [UIArmory_Loadout.uc](https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UIArmory_Loadout.uc)).
  Examples: "Items change hands in a lab in a province you own", "Already wears Barkskin
  Amulet", "Without the Banner of Command, Varo can lead only 20 troops". A booster in a color
  the wearer lacks is allowed: its row reads "Its Red pip needs a Red mage; its other effects
  work".
- **Away from a lab** the vault list is replaced by one line with a link: "Items change hands in
  a lab you own. Nearest: Kharnath, 6 days ▸". The link previews the move. The doll stays
  readable, and the slots show what is worn.
- **Keyboard:** Tab moves between the doll and the vault, the arrow keys move within them, Enter
  equips, and Delete unequips into the vault.

**Depth audit** (UI spec 1.5): select a commander → `G` (or `Enter` → Gear) → click a vault
item. That is 3 clicks, inside the budget. Shift adds no click.

**Comparison in the item's own tooltip** stays short. It shows at most 3 deltas, and Shift
shows them all (Diablo IV's quiet default and its advanced compare, presentation research
1.11).

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
- An item's location reads: "in the vault (2)", "worn by Varo", "being forged by Kesh, 6
  days", or "in the hoard at Ashfen".
- Artifacts add "Unique · exists · held by Thornwood" when known.

### D.8 Forge rows in the Rituals tab

Forging is a mage's lab work, like a ritual, so it lives in the Rituals tab (UI spec 3.5) as a
**Forge** group with its own filter chip, under the rituals.

```
| Varo the Ember  R2 (R3 with items) · in lab: yes                     |
| [R][G]  [Summon][Province][Remote][Forge]                            |
| Forge                                                                |
| ○ Flame Blade       R    {R}x4         10d  A blade that never stops…|
| ○ Pendant of Fury   R    {R}x4         10d  The squads it leads…     |
| ◆ Brand of Ash      RR   {R}x8 + (2)   15d  Strikes twice a round…   |
|   ...  [Show locked (4)]                                             |
|   ★ The Unquenched  RRR  needs Ember level 5                         |
| Pay: R R R R R R R R + (R)(R)  [Edit]   Pool after: R 3              |
| [Forge] (commits)                                                    |
```

- The rows are the forgeable items for this mage, sorted by tier then level. Locked items sit
  under "Show locked", each with `forgeBlocker`'s reason.
- Payment and its Edit stepper are the ritual's. One click commits. **Stop** confirms inline
  that the mana is lost (UI spec 5.7).
- **Depth:** select a mage → `C` → item row → Forge. That is 4 clicks, the same as a
  self-targeted ritual (UI spec 1.5).

### D.9 Battle replays and reports: gear and resistances

The battle design final covers the stage. These are the additions, each tied to a stored or
detail event. Nothing is inferred (battle design D4, presentation research 3.9):

| What | Battle design today | Added by this design |
|---|---|---|
| Unit looks | `lookFor(unit)` derives a fallback from tags, size, prot, weapon names, nation (S2.2) | `material` from the body gear piece's look, `shield` from the shield piece, `mount` from the mount block. The prot thresholds stay only as the fallback for units without gear |
| Sprites per squad | 20/12/6/4/2/1 by size (S2.5) | riders are size 2, so 12 per squad instead of 20: riders take more room |
| Commander gear | archetype rigs (S4.4) | the roster's `items` draw as parts: a weapon item swaps the `weapon` part and its `WeaponLook`; a head item adds the `crown` part over the helm; a body item adds a torso or `cloak` overlay; a charm adds a chest glint. A fire weapon flickers in Ember's palette and a nature item sheds leaves. Each `ItemLook` is content |
| Damage numbers | rolling numbers; spell numbers carry the element glyph (S2.9) | the element's outline glyph on every non-physical number, weapons included |
| Resistance | — | a **▲ RESIST** or **▼ WEAK** suffix chip on a number whose `DamageRoll.resist` is non-zero. The per-blow detail line reads "+3 (fire weakness 3)" or "−10 (fire resistance 10)" |
| Reach | cavalry charge choreography (S2.8) | a **BRACED** chip when `strike.braced` is true. In a braced pair the charge's throw-back is skipped, the riders stop at the spear line, and the lance impact plays a braced thud. Ticker: "The Briar Guard's halberds blunt the charge!" |
| AP and AN | ARMOR chip when armor holds (S2.8) | **AP** (split shield) and **AN** (crossed shield) marks on featured blows where they applied (presentation research 3.9) |
| Item triggers | — | the `ability` event's cue (pretender C.5), with the item's look: a horn blast and rising embers for the Burning Host, bark creeping up the largest squad for Barkskin, coiling vines for Ivy Grasp |
| Thorns | fire-shield licks (S2.10) | N4's `burn` event carries the element; nature shows thorn particles and a bark impact sound |
| Inspect a unit | dock hover tooltip (S4.6) | click a block or dock row (it pauses): the `replay` unit card with gear, items, and resistances, plus its last 5 blows given and taken, from the detail stream |
| Teaching lines | captions (S2.15) | the first time in a battle that a charge is braced, a resistance or weakness changes a blow, or an item ability fires, the ticker adds that entry's line. At most one per entry per battle; off in settings |
| Report | the battle report card (UI spec 4.2) | **Spoils:** each item a fallen commander wore and the side that took it. Battle deaths come from the roster's `items`, the log's `death` events, and the winner; retreat deaths from the spoils message. No new record field |

**Sound** (battle design S3): an item weapon takes its `WeaponLook`'s swing family. A body
piece's `material` picks the impact family (`arm.plate`, `shield.wood`, bark, ember). Braced
charges use the spear-clatter variant of `charge.crash`. In fallback mode (no re-run), the AP,
AN, RESIST, WEAK, and BRACED marks are hidden, as the break-chance meter is (battle design D4).

### D.10 Symbols

| Meaning | Symbol | Never alone |
|---|---|---|
| Size class | a 16 px silhouette per class: man, horse, bear, giant, colossus, wyrm | the word and the number: "Huge (4)" |
| Element dealt | outline flame, leaf, snowflake, sun disc, skull in a drop; physical has none | the element's name in L1 |
| Resist / weak | ▲ / ▼ with the signed number | a warm or cool tone is extra |
| Tier | ○ Lesser, ◆ Greater, ★ Artifact | always beside the mana symbols and the word in L1 |
| Slot | sword, helm, cuirass, ring | the slot's name in the doll |
| Deltas | `→` with ▲ or ▼ and the sign | — |
| Rows | F, M, R letters in filled or empty circles | letters read in greyscale |
| Braced, AP, AN | brace bar, split shield, crossed shield | the chip text |

### D.11 What the sim exposes for this part

| Need | Function (module) | Pure, no rng | Phase |
|---|---|---|---|
| Every stat of a commander or unit with its sources, and a what-if for items | `commanderStats(state, id, opts?: { trace?, itemsOverride? })` and `unitStats(def, ctx?)` in `src/sim/selectors.ts`, built on the **same** modifier fold as `battle/setup.ts statsFor` (one fold, a trace sink, UI spec 7.2) | yes | 8 |
| A unit's abilities, numbers filled | `abilitiesOf(def, nation?, items?)` (content) | yes | 7b |
| Casting pips, leadership, sight | `castingPips`, `leadershipOf`, `commanderSight` (sim) | yes | 7b |
| Why an item cannot be forged or worn | `forgeBlocker`, and `validateCommand` for equip and unequip | yes | 7b |
| Where items are | `itemLocations(state, nation)`, `artifactStatus(state, id)` | yes | 7b |
| Exact odds for the matchup line | `battleOdds(attacker, weaponIndex, target, mods)` in `src/sim/battle/odds.ts`, sharing `rollDamageParts` and the hit tests; folds braced and resistance | yes | **M1-should**, Phase 9 (presentation research P3) |
| Card budgets | `cardNumbers`, `cardGlyphs` in `src/ui/derive/unitCard.ts` | yes (UI) | 8 |

### D.12 Tests

- **UI derive** (`tests/ui/derive/unitCard.test.ts`):
  - no M1 unit's card exceeds `UI.unitCard`;
  - zero resistances and MR never render;
  - signature glyphs come before weapon chips, and state chips before both;
  - a snapshot of every M1 unit's derived card (data, not pixels).
- **Equip preview never lies:** for random items and commanders, `commanderStats` with
  `itemsOverride` equals the stats after `applyCommand(equipItem)`.
- **Breakdowns add up:** each stat's trace total equals the battle setup's stat, for every M1
  unit in the five terrains and with every blessing default.
- **Replay marks:** every RESIST, WEAK, BRACED, AP, and AN mark matches a detail event; none show
  in fallback mode.
- **Smoke (cheap):** the Codex units table sorts and filters; the paper doll renders for each
  body plan; the Forge group lists the forgeable items with reasons for the locked ones.

---

## E. Plan

### E.1 What lands in which phase

Order of work, with the reasons:
1. The battle track's S1 lands first: detail events, golden fixtures, and the re-run.
2. The pretender's 6b follows: 6b.1 design rules, 6b.2 battle rules N1 to N5 with
   `CombatStats.size`, and 6b.3 map rules and content.
3. Then Phase 7 (AI), in progress elsewhere.
4. **Phase 7b** comes after Phase 7, so the AI update builds on the merged AI. It must also
   follow 6b.2, because it extends `CombatStats.size`, N1's triggers, N3's spell power, and N4's
   shields instead of adding second copies.
5. The UI comes after 7b, so Phases 8 and 9 build the final shapes once.

If 6b.2 slips, 7b.1 adds `CombatStats.size` itself (one field, the same as N2's) and leaves the
rest to 6b.2.

Each step ends with `npm run typecheck && npm run lint && npm test` green, a `docs/PROGRESS.md`
entry, and a commit whose message starts with its phase name ("Phase 7b: ...").

| Phase | Deliverable | Main files | Tests |
|---|---|---|---|
| **7b.1** Unit depth | Content: size classes; the gear registry and each unit's `gear`, `naturalProt`, `role`, `description`, `mount`, and `resist`; weapon `reach` and `materials`; Ash and Wolf Riders at size 2; body plans on commander units; the abilities catalog (display fields and rule union, with N1's records amended), and `abilitiesOf`. Sim: U1 weighted draws, U2 supply by size, U3 reach, U4 resistances (weapons, spells, shields, remote damage); `CombatStats.resist` and `braces`; the detail fields `DamageRoll.resist` and `strike.braced` | `content/{types,sizes,gear,abilities,rules}.ts`, `content/units/*.ts`, `sim/battle/{attacks,effects,setup,types,detail}.ts`, `sim/{commanders,ritualEffects}.ts` | A's rule tests; content validation (gear sums, materials, mounts, catalog); `docs/04` required tests unchanged; golden fixtures regenerated once with `npm run golden:battle`, the commit naming each changed fixture and asserting byte-equality for every fixture with no unit above size 1, no charge against reach, and no resistance in play |
| **7b.2** Magic items | The 24 items and their content validation; `ITEMS` rules; state (`CommanderState.items`, `NationState.vault`, `ProvinceState.hoard`, the `forge` order); `forgeItem`, `equipItem`, and `unequipItem` with validation; `progressForging`; folds (C.9); item triggers through N1; spoils, hoards, capture, elimination, recall; artifacts; messages; the `STATE_VERSION` step and migration; roster `items` | `content/items/*.ts`, `sim/{items,types,tick,capture,victory,pretender,conflict,selectors,pips,research,visibility}.ts`, `sim/commands/items.ts`, `sim/battle/{apply,setup,events}.ts` | C.12; the determinism hash once; fixtures for all 24 items and 5 plans |
| **7b.3** AI and balance | The AI's forge and equip steps (C.10); `NationDef.ai.forge` and `ItemDef.ai` content; the runner prints items forged, worn, and taken; the matchup bands (E.3); item kits in `sim:duel` | `src/ai/*`, `content/nations/*.ts`, `content/items/*.ts`, `scripts/{aivai,duel}.ts` | C.10's behavior tests; E.3 bands; 20-game `sim:aivai` before and after, recorded in `docs/09-balance.md` |
| **8** Map and core UI | `UnitCard` with the D.2 budgets and fields; the unit hover (D.3) with Shift sources through `commanderStats` and `unitStats`; D.4 concepts; a read-only items list on the Commander Overview | `src/ui/derive/unitCard.ts`, `src/ui/tips/*`, `src/content/{ui,concepts}.ts`, `src/sim/selectors.ts` | D.12 derive tests; breakdowns add up |
| **9** Remaining UI | the Gear tab paper doll (D.6); the Forge group (D.8); item tooltips (D.7); Codex topics and the unit page (D.5); the Ledger Items tab; spoils on the battle report; **M1-should**: the matchup line (`battleOdds`) and the sizes line-up | `src/ui/panels/commander/*`, `src/ui/codex/*`, `src/ui/ledger/*`, `src/sim/battle/odds.ts` | D.12; equip preview equals apply; smoke tests |
| **10** Replay | D.9's additions | `src/present/battle/*`, `src/render/battle/*`, `src/content/presentation/{items,gear}.ts` | replay mark tests |
| **11** Art | SVG parts for the 13 gear pieces in three nation styles (about 26 files, nation variants reusing shapes), item parts (about 20: weapons, crowns, mantles; charms are procedural glints), 6 size silhouettes, 38 ability glyphs, 5 element outlines, 3 tier shapes, 4 slot icons: **about 100 small files** | `src/assets/sprites/{gear,items,icons}/**`, the manifest | manifest coverage for every gear piece, item, and ability |
| **12** Balance | E.3's knobs; the playtest additions | `docs/09-balance.md` | the re-pinned bands |

### E.2 M1 and M2

| Item | M1 or M2 | Reason |
|---|---|---|
| Size ladder with names, U1 (draws), U2 (supply) | **M1** | the owner's "giants to horses"; one changed draw, bit-identical for size 1 |
| Riders at size 2 with named mounts | **M1** | honest cards and sprites at no rule cost |
| Gear pieces with validated sums | **M1** | explains numbers that exist; drives art and sound |
| Reach blunts charge (U3) | **M1** | one check, a clear counter, measured |
| Elemental resistance (U4) and its five unit values | **M1** (owner sign-off) | the R against G matchup's story, measured toward parity; items need it |
| Role word and lore line | **M1** | content |
| Abilities catalog | **M1** | shared with the pretender track; prevents drift |
| Items: forging, vault, 5 slots, 24 items, boosters, inspire, command and sight, spoils, hoards, artifacts | **M1** | the owner's "with the items"; ten small rules on existing code |
| AI forge and equip | **M1** | the AI uses the same commands; never stalls |
| Paper doll, Forge group, item tooltips, Codex topics | **M1** (Phases 8 and 9) | items need a home |
| Matchup line, sizes line-up | **M1-should** | cut lines 2 and 1 |
| Separate mount HP and unhorsing | **M2** | a second roll and an after-battle rule |
| Shields against arrows | **M2** (or Phase 12) | measured shift toward the stronger side |
| Giant trample; elephants | **M2** (or Phase 12) | measured too strong as specified |
| Magic resistance checks | **M2** | no M1 rule reads MR |
| Commander afflictions and renown; item history | **M2** | new state; the tedium Dominions players report |
| Mindless dissolving, undead rules, awe, ethereal, terrain walkers | **M2** | with the W, U, and B nations |
| Feet, shield, and barding slots; two-handed weapons; a rider body plan | **M2** | each would hold only 1 or 2 of the M1 items |
| White, Blue, and Black items; item sets; field swaps; a sending ritual; monthly-mana items; items that grant spells | **M2** | each a rule with no M1 payoff (items research 8.10) |
| Starting hoards at mapgen | **M2** (or Phase 12) | the hoard exists in M1; seeding it needs a mapgen rule and fog rules for it |

### E.3 The balance plan

1. **Invariants (always green).**
   - The four `docs/04` required balance tests, unchanged by construction (A.11).
   - A U1 equivalence test: a fight with no unit above size 1, no charge against reach, and no
     resistance in play gives a byte-equal log before and after.
2. **Matchup bands** (`tests/sim/battle/matchups.test.ts`, 200 seeds each, a ±6-point band
   around A.11's Final column). They catch drift, not balance:
   - starting armies both ways;
   - mid armies both ways;
   - elite armies both ways;
   - Ash Riders against Briar Guard;
   - Titan with Cinder Warriors against 20 Heavy Infantry.

   Phase 12 re-pins them.
3. **Item bands** through the pretender track's `sim:duel` (pretender A.10):
   - a Titan alone with Brand of Ash, Heartwood Aegis, and the Red kit;
   - a Great Wyrm alone with Ring of Regrowth and Barkskin Amulet;
   - an Ash Chieftain's army with Pendant of Fury and with Horn of the Burning Host;
   - a Warden Captain's army with Seed of Barkskin;
   - **counters:** a kitted Wyrm against an Elder Druid casting Swarm with carried mana, and
     against a Cinder Magus casting Ember Dart (items research 7.2 measured 0% and 59%).
4. **Headless games:** `npm run sim:aivai -- --games 20 --seed 1` with the Phase 7 AI, three
   times: before 7b, after 7b.1, and after 7b.3. Recorded per game: winner, months, items forged
   and worn per nation, artifacts, spoils taken. Acceptance is the existing checklist line
   (Thornwood wins roughly half, read as 35% to 65%) plus C.10's AI tests.
5. **Knobs, in the order to turn them:**
   1. Oakheart fire −3 → −2.
   2. Ring of Regrowth 5% → 4%, or level 3 → 4.
   3. Seed of Barkskin +3 → +2 protection.
   4. Brand of Ash damage 6 → 5.
   5. Artifacts at level 5 → 4, if no artifact appears in 20 games.
   6. The item price formula.
   7. If Cinder Horde ends too strong after U4: shields against arrows (A.9), which is measured
      and ready.
6. **Playtest additions** (`docs/09-balance.md`):
   - a new player forges a Lesser item by month 3 without reading the docs;
   - one Shift over any unit answers "why is this number this?";
   - in three full matches at least one spoils message appears;
   - nothing in a replay changed a blow without a mark or a detail line.

### E.4 Cut lines, in order

1. The sizes line-up page (keep sprites to scale and the size words).
2. The matchup line in the hover (keep it in the Codex).
3. The replay's teaching lines.
4. The 4 generic items, and I8 with them.
5. Two of the four artifacts (keep one per color: The Unquenched and Crown of the Ivy King).
6. Hoards: Independents' wins destroy the items instead. That costs the "lost sword"
   story.

**Never cut:**
- the gear sums and their validation;
- U1, U2, U3, and U4;
- the catalog;
- I1 to I7, I9, and I10;
- the paper doll;
- the card budgets;
- Shift sources (D.1 rule 4 depends on them).

### E.5 Doc changes (in the commits that implement them)

| Doc | Change |
|---|---|
| `docs/03-nations.md` | The stat model table gains size class, role, gear, natural protection, mount, resistance, abilities, and lore line. The size line drops "occupies more formation space" for "draws blows and eats supply by size". Every nation table becomes A.10's, Independents too. Implementation decisions add: riders at size 2 with named mounts; gear and materials sums; the five resistance values; derived defense skill |
| `docs/04-battle.md` | Implementation decisions add "Size draws blows" (U1, with the equivalence), "Reach blunts a charge" (U3), and "Elemental resistance" (U4: weapons, spells, shields, remote damage). The replay notes add `DamageRoll.resist`, `strike.braced`, and roster `items` |
| `docs/01-core-rules.md` | Supply: "a body eats supply equal to its size". New section "Magic items": vault, labs, spoils, hoards, elimination |
| `docs/02-magic.md` | New section 9 "Magic items": forging, tiers, prices, boosters, inspiration, artifacts. Decisions: the forge order shares the ritual helpers; boosters count for casting and forging only |
| `docs/05-pretender.md` | Body plans per chassis; a pretender arrives without items; recall sends them to the vault; a reformed Phoenix returns without them |
| `docs/06-architecture.md` | `content/{sizes,gear,abilities,items}`, `sim/items.ts`, `sim/commands/items.ts`; the state additions and the `STATE_VERSION` step |
| `docs/07-ui.md` (the UI spec's replacement) | the Gear tab, the Forge group, the item tooltip, the Codex topics, the Ledger Items tab |
| `docs/08-ai.md` | the forge step after step 8; the equip step; roles |
| `docs/09-art-direction.md` | "Gear and item parts", size silhouettes, ability glyphs, element outlines, tier shapes |
| `docs/09-balance.md` | every number in A.5, A.7, C.4, and C.5, with the measured rows |
| `docs/10-milestone-1.md` | Phase 7b. Criterion 7 gains "sizes, mounts, reach, resistances". New criterion 17: "Magic items: 24 forgeable items, a paper doll, spoils" |

### E.6 Amendments the sibling tracks must accept

**Pretender expansion:**
1. N1's ability records gain `kind: 'trigger'` and the display fields (B.1). `UnitAbility`
   becomes `Extract<AbilityDef, { kind: 'trigger' }>`, and `abilityDef` becomes `triggerDef`.
   The battle code is unchanged.
2. E.2's row "element resistances: M2" becomes M1 for units and items (owner sign-off). The
   breath color stays display only. Proposed body values are in A.10.
3. Every chassis body gets a body plan (C.3) and its size class.
4. U1 changes duels of a god leading troops by +3 to +5 points (A.11). The `sim:duel` bands
   with armies are re-measured after 7b.1. Lone duels are unchanged.
5. U2: bodies eat their size in supply.
6. Recall sends the god's items to the vault. A reformed Phoenix returns without them.
7. N2's trample filter runs before U1's weighted draw.

**Battle presentation:**
1. `DamageRoll.resist` and `strike.braced` in the detail stream.
2. `lookFor` reads gear (material, shield) and mounts.
3. The roster gains `items`; item parts draw over standard parts.
4. Element glyphs on every non-physical number, weapons included.
5. The RESIST, WEAK, BRACED, AP, and AN marks.
6. Riders draw 12 sprites per squad.
7. The golden fixtures are regenerated once in 7b.1.

**UI spec:**
1. The Commander panel's fourth tab, Gear.
2. The Rituals tab's Forge group and chip.
3. The Codex topics of D.5.
4. A Ledger Items tab.
5. The concepts of D.4.
6. `UnitCard`'s fields of D.2.
7. `commanderStats` and `unitStats` added to UI spec 7.2.
8. The `G` key for Gear, if the binding table has it free; otherwise the binding table picks one.

### E.7 Open questions for the owner

1. **Resistances in M1?** Recommended yes. Wood burns and embers resist, which gives the fire
   against forest matchup its story. Measured, it pulls the elite fight from Thornwood 72%
   toward 55%. The pretender track had it in M2.
2. **Spoils.** Recommended: the side that holds the field takes the fallen's items. The
   alternatives are Dominions' chance by tier, or Total War's "lost, except artifacts".
3. **Five slots** (weapon, head, body, two charms), or seven with feet and a shield in M1?
4. **Size names**: Man-sized, Large, Great, Huge, Colossal, Gargantuan, or names more in FM's
   tone?
5. **Shields against arrows**: deferred because they favor the side already ahead (measured).
   Revisit in Phase 12?
6. **Trample on the independent Giant**: left out because it made mountain champions walls. A
   weaker trample, or never?
7. **Artifacts** at research level 5 as late prizes, or at level 4 so they show up in more
   games?
8. **Enemy gear in fog**: should enemy items show only after a battle against them (they are in
   the battle record), or also when scouted?

---

## Sources

**Dominions 6 manual** (community transcription of the official manual, read in the research
notes):
- [Ch. 2, The Basics](https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html)
- [Ch. 4, Units](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html): attributes,
  abilities explained on mouse-over, inventories, slots by body, standard items that return
- [Ch. 5, Movement](https://dmacguigan.github.io/dom6-manual/chapters/05-movement.html): turn
  order (items into the national inventory)
- [Ch. 6, Combat](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html): size and
  squares, missiles weighted by size, gear composing defense, repel and weapon length,
  resistance and weakness, mounts
- [Ch. 7, Magic](https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html): Forge Item in
  a laboratory, MR and penetration
- [Ch. 10, Magic Items](https://dmacguigan.github.io/dom6-manual/chapters/10-magic-items.html):
  item analogs, unique artifacts
- [Ch. 11, Path Boosters](https://dmacguigan.github.io/dom6-manual/chapters/11-path-boosters.html)

**Dominions game data:**
- [dom6inspector gamedata](https://github.com/larzm42/dom6inspector/tree/master/gamedata) (units,
  weapons, armors, items, unit descriptions): the counts quoted from the research notes
- [dom6inspector README](https://raw.githubusercontent.com/larzm42/dom6inspector/master/README.md)
  (property search)

**Dominions community** (search extracts, pages not opened; claims worded no stronger):
- [illwiki, items](https://illwiki.com/dom5/items) (pickup chance by tier)
- [illwiki, Laboratory](https://illwiki.com/dom5/laboratory) (labs and the treasury)
- [illwiki, Dom6 magic](https://illwiki.com/dom5/dom6/magic) (simultaneous artifact forging)
- [Steam store, Dominions 6](https://store.steampowered.com/app/2511500/) (separate mount
  stats)
- [Steam, Dom6 afflictions](https://steamcommunity.com/app/2511500/discussions/0/4203616776861027901)
- [Quarter to Three, Dominions 5 thread](https://forum.quartertothree.com/t/dominions-5-warriors-of-the-faith/131532?page=16)
  (handing items to many units)

**Other games:**
- Age of Wonders 4 data via [aow4db](https://github.com/minionsart/aow4db):
  [Units.json](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Units.json),
  [Abilities.json](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Abilities.json)
  (Large Target, role tags)
- Total War: Warhammer: [Rarity](https://totalwarwarhammer.fandom.com/wiki/Rarity) (search
  extract: items lost except legendary)
- Heroes of Might and Magic III: [Combat](https://heroes.thelazy.net/index.php/Combat) (search
  extract: the victor takes the artifacts)
- Battle Brothers: [Dev Blog #34](https://battlebrothersgame.com/dev-blog-34-new-armor-helmet-rework-banners/)
  (search extract: looks must match stats); [paper doll module, Legends
  copy](https://raw.githubusercontent.com/Battle-Brothers-Legends/Legends-public/master/ui/screens/character/modules/character_screen_left_panel/character_screen_paperdoll_module.js)
- Civilization VI: [unitpanel.lua, CQUI copy](https://raw.githubusercontent.com/CQUI-Org/cqui/master/Assets/UI/Panels/unitpanel.lua)
  (the four-stat card budget)
- XCOM 2: [UISoldierHeader.uc](https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UISoldierHeader.uc),
  [UIArmory_Loadout.uc](https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UIArmory_Loadout.uc)
  (deltas on stat rows; disabled items with reasons)
- Battle for Wesnoth: [weapon_specials.cfg](https://raw.githubusercontent.com/wesnoth/wesnoth/master/data/core/macros/weapon_specials.cfg)
  (specials as data with one sentence; "(inactive)")

**Repository** (read only, commit `3addf97`): the docs and code listed at the top.

**Sibling designs:**
- `../pretender-design/final.md` (read as `final-parts/{00-head,01-summary,02-a1-a4,03-a5,04-a6-a8,09-e}.md`)
- `../battle-design/final.md` (S1, S2.2, S2.5, S2.8, S4.4, S4.6, S6.2)
- `../ui-design/spec-final.md` (1.1 to 1.5, 2.8.2, 3.5, 5.1, 5.2, 6.4, 7)

**Research notes** beside this file, whose evidence this draft cites by section:
`research-dom-units.md`, `research-dom-items.md`, `research-presentation.md`.

**Measurements** (this draft):
- `proto/` is a copy of `src/` and `tests/` with switches for U1, U3, U4, shields against arrows,
  and N2-style strikes;
- `proto/measure.ts`, `proto/measure-items.ts`, `proto/measure-items2.ts` and their
  `*.out.md`;
- `calc/wound.py` (exact wound chances over the DRN distribution).
