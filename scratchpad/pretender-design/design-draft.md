# Pretender variety, customization, and flashy magic: design draft

Status: draft for review, 2026-10-21. It builds on three research notes beside this file
(`research-dominions.md`, `research-aow4.md`, `research-vfx.md`), on the repository at
`/home/user/Fluid-Magic-` (Phases 0 to 6), on the battle presentation design
(`../battle-design/final-parts/p1.md` to `p6.md`; `final.md` is not written yet, so the parts
are the reference) and on the UI spec draft (`../ui-design/part1.md` to `part3.md`;
`spec-final.md` is not written yet).

**Owner direction (binding).** "I think flashy magic effects is always interesting and good
options for pretenders like Dominions has is always a highlight. If it's possible. A
customization level matching Age of Wonders 4 would be very ideal." Earlier directions still
hold: battles are visceral, with detail and sound; the UI matches similar games, with
complexity layered under smart menus.

**Constraints kept.** The sim stays pure and deterministic. Content is data, and every spell
and ability is composed from the `docs/02` section 5 primitives. New rules are specified
exactly and tested. Cosmetic choices never reach the sim (the one string exception, the
god's name, is argued in B.6). Art is SVG authored in the repo or generated in code, and
effects are procedural. Color identity never relies on hue alone. Everything is placed in an
M1 phase or explicitly deferred to M2.

**Numbers in this draft were computed, not guessed.** Design costs come from a mirror of
`designCost` with the proposed pricing rules (`calc/costs.mjs`, `calc/check2.mjs`). Body
strength comes from staged fights in the repository's own resolver (`calc/duel*.ts`, run with
the repo's `tsx`). The share code was prototyped (`calc/sharecode.mjs`). All scripts are in
`pretender-design/calc/`.

---

## 0. The design in eighteen lines

1. **Eighteen chassis in M1, twelve per nation** (6 generic, 6 Red, 6 Green; 12 are new). A
   nation chooses from the generic realm and its own colors' realms. Two of the new ones
   (Living Flame, Briar King) are the cut line, which still leaves 11 per nation.
2. **Bodies come in Dominions' tiers**, and the tier moves three prices together: base
   dominion, the price of a first pip in a new color (40 to 80, now per chassis), and the body.
3. **Eight small new rules carry the signatures**, each one testable alone: ability triggers
   (battle start, each round) that fire existing primitives; multi-strike weapons (trample);
   spell power; a retaliation element (thorns); summoned squads that never drag their
   commander into a rout; a monthly summon; reform after death (Undying); and a home-terrain
   bonus for a body.
4. **Eight data-only design rules**: realms, per-chassis new-color price, scale attunement,
   minimum awakening, starting springs, a chosen breath color, the god's name, and a role tag
   for the AI.
5. **Blessings become a Dominions 6-style menu.** Bless points are `Σ max(0, pips − 1)`. An
   effect costs `max(1, requirement − 1)`, so a god exactly at a requirement can always afford
   one effect of that level. Today's fixed bless is the default pick, so every existing
   preset keeps its exact bless. Some new effects are incarnate (only while the god is on the
   map), which ties power to awakening.
6. **Six boons** are bought with design points: Sacred Spring 40, Avatar 40, Undying 70,
   Chosen Host 60, Deep Lore 50, Iron Will 20.
7. **Twelve presets** (the six existing designs unchanged, six new), each with a look. All fit
   their budgets (computed). Two existing presets gain a minor blessing with bless points they
   could not spend before. The first preset of each nation stays the AI default.
8. **Customization follows AoW4's split**: any look on any build. The look lives outside
   `GameState` in a save-file block and in saved gods, and the sim cannot import it.
9. **Per chassis: 4 slots × 3 variants**, drawn from shared part families, plus 3 chosen color
   channels, 3 poses, 5 sliders, 8 markings, 4 aura shapes, 4 cast flourishes: about 12
   million looks per chassis before identity.
10. **Identity**: name, epithet, title, pronoun, a templated myth line with a free-text
    override, a sigil (6 frames × 16 charges) and a banner division (6). Banner colors stay
    fixed by the palette tests; the sigil carries identity by shape.
11. **Random god and random look** are seeded and reproducible, respect locks, and keep a
    10-roll history. **A share code** (`FM1-…`, bit-packed, CRC-16, base64url) encodes the
    whole god in 35 characters without names and about 80 with them.
12. **Art budget**: about 180 small SVG files in Phase 11 (about 67 cosmetic parts, 22 sigil shapes,
    2 overlays, about 90 chassis body parts);
    markings, glyphs, auras, flourishes, banner divisions, poses and sliders are procedural.
13. **Flashy magic is a grammar**: look = template(primitive) × verb(color) × material(element)
    × tier(level and breadth) + the god's flourish. Every spell, ability and ritual gets a
    correct look on day one; the 11 M1 battle spells keep the battle design's storyboards and
    durations.
14. **Every M1 spell has an effect spec** (beats in ms, particles, light, distortion, screen,
    decals, sound recipe ids, reduced-motion variant), and so do the 10 rituals on the map,
    the new pretender abilities, the blessing marks, the prophet, awakening, reform and the
    god's death.
15. **The map gets a cue model of its own** (`planMapFx`), fed by messages, with one optional
    sim addition: a spell id on ritual messages and a message to the victim of a hostile
    ritual.
16. **The designer has six steps in two groups**: BUILD (Body, Magic, Realm, Blessings) and
    LOOK (Appearance, Identity), with a live preview canvas and the `PretenderCard` always
    visible on the right.
17. **Plan**: Phase 6b (now, three commits: design rules, battle rules, map rules and content),
    Phase 8 (map effect basics), Phase 9 (designer, looks, share code), Phase 10 (battle
    cues), Phase 11 (parts and moments), Phase 12 (preset matrix and tuning).
18. **M2**: White, Blue and Black chassis (18 sketched here) and blessing menus, the rules
    only they need (awe, ethereal, life drain bodies, shapechange, teleport, element
    resistances), map and menu sound, the free color picker, and more variants.

---

## 1. Decisions and reconciliations

| # | Topic | Options | Decision | Why |
|---|---|---|---|---|
| P1 | Who may take which chassis | today every nation offers all six | **Realms**: generic chassis for everyone, color chassis for nations with that color in their identity | Dominions gives each nation a cultural pool ([dom6inspector data](https://github.com/larzm42/dom6inspector/tree/master/gamedata)); a realm keeps 12 cards per nation instead of 18 and keeps balance testable. M3 two-color nations get both realms. A change to the `docs/05` line "The nation offers all chassis" |
| P2 | Trample on the existing size-5 and size-6 bodies | add it to the Great Wyrm and Ash Colossus (research suggestion) | **No.** Trample goes on new bodies only | Measured: trample 3 × 2 raised the Great Wyrm from 76% to 100% against 20 Heavy Infantry and from 5% to 71% against a mountain fortress (A.10). The existing presets and the Phase 7 AI tuning stay untouched |
| P3 | Fear | Dominions forces a check every round | **A battle-start morale debuff** (−2 for the battle on every enemy group) | A forced check every round with pressure 0 breaks a morale-10 squad 46% of the time per round, far too strong for FM's morale scale. The debuff uses an existing primitive and logs once per group |
| P4 | Incarnate blessings | Dominions: any effect needing 5+ in a path | **An explicit flag per effect**; the standard and greater blessings (today's rule) are never incarnate | Every preset keeps today's bless, including Ember Oracle's doubled bless while dormant |
| P5 | Where the look lives | inside `PretenderDesign` or outside `GameState` | **Outside**, in the save file's presentation block and in saved gods | Structural purity: the sim cannot read what it does not hold (research-aow4 3.1, Option A) |
| P6 | The god's name | UI substitution or a sim string | **A sim string**, `NationSetup.pretenderName` | Messages are prebuilt strings in the sim and the battle record carries commander names; a label never changes an outcome (B.6) |
| P7 | Particle counts and reduced-motion factor | research-vfx: tiers 40/150/400/1000, RM ×0.5 | **The battle design wins**: 40 to 160 per small cast, up to 300 per burst, RM ×0.3 | The battle design is the final spec for battle (S2.10, S2.14) |
| P8 | Full-scene flash | research-vfx: by tier | **The battle design wins**: a level 3+ spell flashes at release (0.15 at Full) | S2.10 |
| P9 | Chromatic aberration on the god's death | research-vfx: yes, Flashes Full only | **Deferred** (open question E.5) | The battle design's god death does not use it, and players report eye strain from it ([example](https://thegameswiki.com/crimson-desert/wiki/chromatic-aberration)) |
| P10 | Map and editor sound | research-vfx: map sounds in M1 | **Battle bus only in M1.** The editor's Cast preview reuses baked battle recipes (M1-should). Map ritual sounds are M2, with recipe ids reserved | The battle design's sound section: "Music and map or menu sound stay out of M1" (p6, docs/09 Sound) |
| P11 | Designer tabs | the task lists six tabs; the UI spec allows at most 4 tabs per panel | **Six steps in two labeled groups** (4 + 2) on a rail | Both satisfied; AoW4 also puts mechanics first and appearance after ([GamePressure](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c)) |
| P12 | A stealthy army leader | Horned Hunter stealthy | **Not stealthy** | `visibility.ts` hides a stealthy commander with all its squads; a stealthy leader of 60 would hide whole armies |
| P13 | Summoned wolves routing their god | today a commander routs with its last squad | **Summoned squads never drag their commander** (rule N5) | Measured: a Horned Hunter with 8 battle-summoned wolves fled with them and won 16% against a weak province; with N5 it wins 79% |

---

## A. Pretender variety (Dominions-like)

### A.1 Principles

- **Tiers move prices together** (research-dominions 4.2, 5.2; [Dom6 manual, ch. 3](https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html)).
  Dominions sells a body, free paths, a new-path price and a base dominion for one cost. Mages
  are cheap and branch cheaply; monsters are strong and branch dearly; idols buy dominion and
  scales but cannot walk. FM adopts the same four levers per chassis.

  | FM tier | Base dominion | First pip of a new color | Body | M1 chassis |
  |---|---|---|---|---|
  | Seer | 1 | 40 (Oracle 30 after its discount) | fragile caster | Oracle of the Flux, Ember Hierophant |
  | Hero and titan | 1 to 2 | 50 to 60 | fighter or leader | Ascended Hero, Titan, Ash Colossus, Pyre Lord, Horned Hunter, Mother of Beasts, Briar King |
  | Beast and monster | 2 to 3 | 80 | strong body, locked magic | Great Wyrm, Primordial, Ash Phoenix, Living Flame, Wild Spirit, Elder Wyrm |
  | Idol | 4 | 50 | immobile engine | Living Monolith, Cinder Idol, World Tree |

- **Each chassis answers one strategy question** (the Dominions build families of
  research-dominions 5.1: Bless rush, Super combatant, Mage god, Dominion push, Scales sleeper)
  and FM adds three that its new rules open: Summoner, Undying raider, Army leader.
- **The color pie is a hard limit** (`docs/02` section 1). Green never flies or evades, Red
  never defends, White never summons monsters, Blue never heals, Black never heals the living.
  Every new M1 body below was checked against it.
- **Signatures are data.** About half of Dominions' signature behaviors are an existing
  effect fired on an event (research-dominions 7.3, N1). FM's abilities are therefore
  existing `docs/02` primitives with a trigger.
- **A body must look like what it does.** Fixed parts carry mechanics (wings for flying, roots
  for immobile, flicker for stealth, embers for a fire shield) and are never cosmetic slots
  (B.3).

### A.2 The M1 roster at a glance

Twelve per nation. Generic chassis are open to every nation; color chassis to nations whose
identity includes the color. **New** marks the 12 additions; *should* marks the cut line.

| Realm | Chassis | Tier, role | Cost | Base pips | Base dom. | Signature | Strategy family |
|---|---|---|---|---|---|---|---|
| generic | Oracle of the Flux | seer, mage | 20 | — | 1 | pips −10 each, researches | Mage god, rainbow |
| generic | Titan | titan, leader | 120 | nation 1 | 2 | leadership 100 | Bless rush with a general |
| generic | Great Wyrm | monster | 220 | nation 2 | 2 | flying, breath (color chosen) | Super combatant |
| generic | Living Monolith | idol | 60 | — | 4 | dominion checks ×2 | Dominion push |
| generic | **Ascended Hero** | hero, leader | 70 | nation 1 | 2 | Avatar (blessed in own dominion), leadership 120 | Cheap bless rush, army leader |
| generic | **Primordial** | monster | 160 | nation 2 | 3 | must sleep; Fear 2; trample | Scales sleeper with a monster payoff |
| R | Ash Colossus | titan, fighter | 100 | R1 | 1 | fire shield 5 | Brawler |
| R | **Ash Phoenix** | beast, raider | 100 | R1 | 2 | flying, Undying, Growth attunement | Undying raider |
| R | **Pyre Lord** | titan, summoner | 140 | R2 | 2 | 6 Fire Sprites at battle start | Battle summoner |
| R | **Cinder Idol** | idol | 110 | R2 | 4 | 2 Fire Sprites a month, Dread attunement | Dread dominion |
| R | **Ember Hierophant** | seer, mage | 60 | R2 | 1 | spell power 3 | Battle mage |
| R | **Living Flame** *(should)* | beast, fighter | 150 | R2 | 2 | flying, heat aura, fire shield 6 | Anti-horde |
| G | Wild Spirit | beast, raider | 80 | G1 | 2 | stealthy, regeneration | Hidden raider |
| G | **World Tree** | idol | 130 | G3 | 4 | 2 G springs at the capital, Sanctity attunement | Mana and temple economy |
| G | **Horned Hunter** | titan, summoner | 130 | G2 | 2 | 8 Wolves at battle start, Fury attunement | Hunter warlord |
| G | **Elder Wyrm** | monster | 170 | G1 | 2 | wingless, regeneration, trample | Green super combatant |
| G | **Mother of Beasts** | titan, summoner | 110 | G1 | 2 | 2 Wolves a month | Growing pack |
| G | **Briar King** *(should)* | titan, fighter | 120 | G2 | 2 | thorn shield, Entangle at battle start, forest home | Holding the line |

The `NationDef.chassis` pair keeps its meaning as the two "Recommended" badges: Titan and Ash
Colossus for the Cinder Horde, Wild Spirit and Living Monolith for Thornwood.

### A.3 Pricing and design rules (data only)

Each rule is a field read by `designCost` or `validatePretender` (`src/sim/pretender.ts`),
the only place these rules live.

| # | Rule | Field | Exact behavior | Test |
|---|---|---|---|---|
| D1 | Realm | `ChassisDef.realm: 'generic' \| Color` | `availableChassis(def)` = generic plus realms in `def.colors`. `validatePretender` refuses others: "Pyre Lord is not offered to Thornwood". | Both M1 nations have ≥ 10 available; a foreign-realm design is refused |
| D2 | New-color price | `ChassisDef.newColorFirstPip` | `pipStepCost` uses it instead of `PRETENDER_COSTS.newColorFirstPip`, minus `pipDiscount` | Oracle's first U pip costs 30; Great Wyrm's 80 |
| D3 | Scale attunement | `ChassisDef.attunement?: { axis, toward }[]` | A step toward an attuned pole costs `scaleStep.own` (20) whatever the pole's color. No refund, limits stay ±3 | Ash Phoenix's Growth step costs 20 for the Cinder Horde |
| D4 | Minimum awakening | `ChassisDef.minAwakening?: 'dormant' \| 'imprisoned'` | Refused below it: "Primordial must start at least dormant" | Awake Primordial refused |
| D5 | Starting springs | `ChassisDef.startSprings?: { color: Color \| 'nation'; count }` | `createGame` appends the springs to the capital's `MapProvince.springs` after map generation; mana flows through the existing economy | World Tree capital earns 2 more G a month |
| D6 | Breath color | `ChassisDef.breath: true` and `PretenderDesign.breathColor?: Color` | Allowed only on breath chassis, only a color with ≥ 1 pip; default the nation's primary. Battle setup sets the breath weapon's `element` to that color's element (W holy, U cold, B decay, R fire, G nature). Elements have no rules effect in M1, so this is inert but logged; M2's resistances will make it real without a migration | Refused without pips; the setup weapon carries the element |
| D7 | The god's name | `NationSetup.pretenderName?: string` | 1 to 24 characters (letters of any script, space, apostrophe, hyphen, period). `settlePretender` names the pretender commander with it, else the chassis name | Refused when too long; the commander carries it |
| D8 | Role | `ChassisDef.role` | `'mage' \| 'leader' \| 'fighter' \| 'monster' \| 'raider' \| 'summoner' \| 'idol'`. Read by the AI (A.11), the designer's filter, and the summary card's reading | Every chassis has one |

`ChassisDef` after Phase 6b:

```ts
// src/content/pretenders/chassis.ts
export type ChassisRole = 'mage' | 'leader' | 'fighter' | 'monster' | 'raider' | 'summoner' | 'idol';
export interface ChassisDef {
  id: string;
  name: string;
  cost: number;
  basePips: { color: Color | 'nation'; count: number } | null;
  baseDominion: number;
  body: UnitTypeId;
  pipDiscount: number;
  dominionFactor: number;
  notes: string;
  realm: 'generic' | Color;
  role: ChassisRole;
  /** Design points for the first pip of a color outside the nation's identity, before the discount. */
  newColorFirstPip: number;
  attunement?: readonly { axis: ScaleAxis; toward: 'positive' | 'negative' }[];
  minAwakening?: 'dormant' | 'imprisoned';
  startSprings?: { color: Color | 'nation'; count: number };
  /** N7: troops that join the pretender on the first day of each month. */
  monthlySummon?: { unit: UnitTypeId; count: number; minDominion: number };
  /** N8: dies where its nation has dominion, returns to the capital this many days later. */
  reform?: { days: number };
  /** The Avatar boon is built in (A.7). */
  avatar?: boolean;
  /** The design may choose a breath color (D6). */
  breath?: boolean;
}
```

### A.4 The M1 chassis catalog

Stats the table leaves out take the baseline (mr 10, prec 10), as `docs/03` decides. Size is
the sim's size; immobiles are drawn larger (`visualSize` in presentation content). "NC" is
the first pip of a new color. Leadership is the troop count led.

| Chassis | Cost | Base pips | Dom | NC | hp | str | att | def | prot | mor | size | mapSpeed | lead | Weapons | Abilities and tags |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Oracle of the Flux | 20 | — | 1 | 40 | 12 | 10 | 10 | 10 | 2 | 14 | 2 | 2 | 20 | Staff 2 | pips −10 each; researches |
| Titan | 120 | nation 1 | 2 | 60 | 60 | 20 | 14 | 12 | 10 | 18 | 4 | 2 | 100 | Great Sword 8 | — |
| Great Wyrm | 220 | nation 2 | 2 | 80 | 120 | 24 | 15 | 10 | 16 | 20 | 6 | 2 | 20 | Breath 12 (range 3, ammo 5, element by D6), Bite 10 | flying |
| Living Monolith | 60 | — | 4 | 50 | 200 | 10 | 10 | 10 | 25 | 50 | 1 (drawn 6) | 0 | 20 | none (unarmed) | immobile; dominion checks ×2 |
| **Ascended Hero** | 70 | nation 1 | 2 | 50 | 32 | 15 | 15 | 15 | 8 | 20 | 2 | 3 | 120 | Hero's Blade 7 | Avatar (built in) |
| **Primordial** | 160 | nation 2 | 3 | 80 | 160 | 22 | 12 | 6 | 15 | 30 | 6 | 1 | 20 | Crushing Blow 12; Trample 2 (strikes 2, targets size ≤ 2) | Fear 2 (battle start); minimum dormant |
| Ash Colossus | 100 | R1 | 1 | 60 | 80 | 22 | 10 | 10 | 14 | 10 | 5 | 2 | 20 | Burning Fists 6 fire | fire shield 5 |
| **Ash Phoenix** | 100 | R1 | 2 | 80 | 50 | 14 | 15 | 16 | 8 | 18 | 3 | 3 | 40 | Burning Talons 8 fire, armor piercing | flying; fire shield 5; Undying (reform 90 days); attuned to Growth |
| **Pyre Lord** | 140 | R2 | 2 | 60 | 55 | 18 | 13 | 12 | 8 | 18 | 4 | 2 | 80 | Flaming Glaive 7 fire | Kindle the Host: 6 Fire Sprites at battle start |
| **Cinder Idol** | 110 | R2 | 4 | 50 | 180 | 14 | 10 | 6 | 22 | 50 | 6 | 0 | 40 | none (unarmed, str 14) | immobile; 2 Fire Sprites a month; attuned to Dread |
| **Ember Hierophant** | 60 | R2 | 1 | 40 | 14 | 10 | 10 | 11 | 2 | 14 | 2 | 2 | 30 | Staff 2 | spell power 3; does not research |
| **Living Flame** *(should)* | 150 | R2 | 2 | 80 | 70 | 14 | 13 | 14 | 4 | 30 | 3 | 3 | 20 | Flame Lash 6 fire, armor piercing | flying; fire shield 6; Heat Aura; home wasteland (+2 att, +2 def); default script Attack first |
| Wild Spirit | 80 | G1 | 2 | 80 | 30 | 10 | 10 | 16 | 4 | 10 | 2 | 2 | 20 | Claws 5 | stealthy; regeneration 10% |
| **World Tree** | 130 | G3 | 4 | 50 | 250 | 20 | 10 | 4 | 20 | 50 | 6 | 0 | 40 | Lashing Boughs 8 | immobile; regeneration 10%; 2 G springs at the capital; attuned to Sanctity |
| **Horned Hunter** | 130 | G2 | 2 | 60 | 60 | 18 | 14 | 13 | 6 | 18 | 4 | 3 | 60 | Hunting Spear 7 | Call the Hunt: 8 Wolves at battle start; attuned to Fury |
| **Elder Wyrm** | 170 | G1 | 2 | 80 | 130 | 21 | 12 | 8 | 12 | 22 | 6 | 1 | 20 | Bite 10; Trample 2 (strikes 2, targets size ≤ 2) | regeneration 10% |
| **Mother of Beasts** | 110 | G1 | 2 | 60 | 70 | 18 | 12 | 11 | 8 | 20 | 4 | 2 | 60 | Maul 9 | 2 Wolves a month in own dominion |
| **Briar King** *(should)* | 120 | G2 | 2 | 60 | 80 | 17 | 12 | 10 | 15 | 22 | 4 | 1 | 40 | Thorned Maul 8 | thorn shield 3 (nature); Rising Briars: Entangle at battle start; home forest (+2 def, +2 prot) |

The six existing bodies are unchanged; only their new pricing fields are added (D1, D2, D8).
Their new-color prices change from the flat 60: Oracle 30 net (was 50), Living Monolith 50,
Great Wyrm and Wild Spirit 80. No existing preset buys a new color, so no preset cost moves.

**Ability data, as content** (N1 triggers wrap existing `docs/02` primitives):

```ts
// src/content/units/pretenders.ts (excerpt)
primordial: { /* stats as above */
  abilities: [{ id: 'primordialFear', name: 'Fear', trigger: 'battleStart',
    effects: [{ kind: 'debuff', stat: 'mor', delta: -2, duration: { kind: 'battle' }, targets: { kind: 'allEnemy' } }] }] },
pyreLord: { abilities: [{ id: 'kindleTheHost', name: 'Kindle the Host', trigger: 'battleStart',
    effects: [{ kind: 'summon', unit: 'fireSprite', count: 6, side: 'friendly' }] }] },
hornedHunter: { abilities: [{ id: 'callTheHunt', name: 'Call the Hunt', trigger: 'battleStart',
    effects: [{ kind: 'summon', unit: 'wolf', count: 8, side: 'friendly' }] }] },
livingFlame: { abilities: [{ id: 'heatAura', name: 'Heat Aura', trigger: 'eachRound', frontOnly: true,
    effects: [{ kind: 'damage', amount: 6, element: 'fire', targets: { kind: 'area', count: 6 } }] }] },
briarKing: { abilities: [{ id: 'risingBriars', name: 'Rising Briars', trigger: 'battleStart', effects: [
    { kind: 'debuff', stat: 'def', delta: -3, duration: { kind: 'rounds', rounds: 5 }, targets: { kind: 'enemySquad' } },
    { kind: 'debuff', stat: 'att', delta: -1, duration: { kind: 'rounds', rounds: 5 }, targets: { kind: 'enemySquad' } }] }] },
```

An ability's effects share their targets as a spell's do (Rising Briars is Entangle's two
effects on one squad). Wolves are not a commander, so `summon` validates as it does for Swarm.

**Build strategies.** Each line gives the strategy, an example build that fits (computed),
and its weak side. Costs are design points against the budget for that awakening.

| Chassis | Strategy | Example build (cost / budget) | Weak side |
|---|---|---|---|
| Oracle of the Flux | Mage god: research and cheap branching into other colors; the only body that researches | R4 G2 U2, dominion 4, Lore 1, dormant: 305 / 550 | 12 HP; must hide |
| Titan | General with a strong body and a bless | Warlord preset: 385 / 400 | loses alone to a moderate province (40% against 16 troops) |
| Great Wyrm | Super combatant that clears provinces alone from day one | R4, dominion 3, Fury 1, awake: 325 / 400 | little left for dominion and scales |
| Living Monolith | Dominion engine at the capital, rituals | G2, dominion 10, Growth 2: 340 / 400 | dies if the capital's battle is lost |
| Ascended Hero | The cheapest real general; wears the sacreds' blessing, so a bless rush lifts the god too | R4, dominion 5, Fury 3, Turmoil 1, Chosen Host: 375 / 400 | 32 HP: a target for archers |
| Primordial | Sleep, buy scales and dominion with the refund, then a monster arrives | R4, dominion 8, Fury 3, Turmoil 3, Growth 1, dormant: 525 / 550 | no god for 11 months; slow (speed 1) |
| Ash Colossus | Cheap brawler that burns whoever hits it | R4, dominion 4, Fury 2, Undying: 375 / 400 | dominion 1 base; mor 10 |
| Ash Phoenix | Early raider that cannot die for good at home; Growth is cheap, so Red can grow | Undying Flame preset: 395 / 400 | weak against armies (57% alone against 16 troops) |
| Pyre Lord | Leads 80 and opens every battle with 6 flying sprites that screen and harass | Pyre Host preset: 395 / 400 | the sprites are fragile (6 HP) |
| Cinder Idol | High dominion with cheap Dread: enemies lose morale and gain unrest wherever Red dominion reaches; a sprite garrison grows at home | Dread Idol preset: 395 / 400 | cannot move; capital-bound |
| Ember Hierophant | Battle mage: Fireball 13, Pyre Storm 17, Ember Dart 15 | R6, dominion 3, Fury 3, Deep Lore, awake: 360 / 400 | fragile; does not research |
| Living Flame | Burns the enemy's front line every round (6 × 6 fire) | R4, dominion 4, Fury 3, Turmoil 1, Iron Will: 365 / 400 | prot 4: archers |
| Wild Spirit | Hidden raider and scout god; with Avatar it carries the bless | G4, dominion 5, Growth 3, Wild 1, Avatar: 365 / 400 | 30 HP |
| World Tree | Mana and temples: two extra G springs, cheap Sanctity | Heartwood preset: 390 / 400 | cannot move |
| Horned Hunter | Fast warlord (speed 3) that opens with 8 wolves; Fury is cheap for Green | Hunt Lord preset: 385 / 400 | prot 6 |
| Elder Wyrm | Green super combatant: regenerates, tramples, slow | G4, dominion 3, Growth 2, Wild 1, awake: 335 / 400 | speed 1, no flying |
| Mother of Beasts | A free wolf pack that grows by 2 a month up to 60 | Mother of the Pack preset: 395 / 400 | weak alone in the first months |
| Briar King | Anchors the slow Thornwood line; strongest in forests | G4, dominion 5, Growth 3, Wild 2: 365 / 400 | speed 1 |

### A.5 New rules, specified exactly (N1 to N8)

Every rule is deterministic: no new randomness source, a fixed order, and any new rng draws
inside the resolver's existing sequence. Each lands with its own tests in `tests/` mirroring
`src/`. Rules N1 to N6 are battle rules; N7 and N8 are map rules.

**N1. Ability triggers** (battle; `content/types.ts`, `sim/battle/abilities.ts`).

```ts
export interface UnitAbility {
  /** Also the source id of the stat changes it makes, so it never stacks with itself. */
  id: string;
  name: string;
  trigger: 'battleStart' | 'eachRound';
  /** eachRound only: fires while the unit stands in its side's front row, from its closing round on. */
  frontOnly?: boolean;
  effects: readonly BattleEffect[];   // docs/02 battle primitives, validated like a spell's effects
}
// UnitDef.abilities?: readonly UnitAbility[]; folded into CombatStats.abilities at setup.
// New replay event: { kind: 'ability'; unit: BattleUnitRef; ability: string; targets: BattleUnitRef[] }
```

- **When.** `battleStart` abilities fire once, in round 1, after `roundStart` and before the
  scripts. `eachRound` abilities fire every round right after the scripts (round step 1b),
  before the commander-death check that closes step 1. Both therefore live in the spells
  phase of the battle presentation's phase markers (battle design A1).
- **Order.** Caster order, as scripts use it (attacker 0, defender 0, attacker 1, ...); within
  a unit, list order.
- **Who.** An active (present, not routing) owner. Fatigue does not stop an ability. A
  `frontOnly` ability also needs `owner.row === frontRow(field, owner.side)` and
  `round >= closingRound(owner.base)`.
- **How.** Targets are planned exactly as for a spell (`effectGroups`, `plan`), with the
  ability as a pseudo-spell `{ id, effects }`, so its effects share targets as a spell's do.
  No fatigue, carried mana, pips or research. An ability with no target for some effect does nothing and logs nothing. Spell power (N3)
  does not apply. Summon effects need stats at setup: `sideSetup` scans abilities as it scans
  known spells (`side.summons[e.unit] ??= statsFor(...)`).
- **Log.** `ability`, then the effect's ordinary events (`summon`, `buff`, `damage`, ...).
  The battle presentation treats `ability` like `cast` (template from its first effect,
  C.2). `foldReplay` ignores it.
- **Tests.** Battle-start summons are on the field before round 1's ranged phase; Fear logs one
  `buff` per enemy group and never a second; a heat aura does nothing from the rear row and
  before the closing round; the determinism golden test holds with abilities; content
  validation runs every ability effect through `battleEffectProblems`.

**N2. Multi-strike weapons** (battle; trample).

```ts
// WeaponDef additions (melee weapons only)
strikes?: number;        // attacks per troop per melee phase, 1 to 4; default 1
maxTargetSize?: number;  // only targets of this size or smaller; others cannot be struck by it
// CombatStats gains size (from UnitDef.size).
```

- In `meleePhase`, each living troop swings each melee weapon `strikes` times. Each swing draws
  its own target from the engaged targets, filtered once per weapon and phase to
  `target.group.base.size <= maxTargetSize` when set; an empty list skips the swing without a
  draw. Hit and damage rolls are unchanged.
- **Tests.** `strikes: 2` doubles the logged `attacks` of that pair (battle design A2); a size-4
  target is never struck by Trample; a squad of size-6 enemies draws nothing for Trample.

**N3. Spell power** (battle).

- `UnitDef.spellPower?: number` → `CombatStats.spellPower` (default 0). Every `damage` effect a
  unit **casts** rolls `amount + spellPower`; every `heal` it casts heals `amount + spellPower`.
- **Test.** An Ember Dart from a spell-power-3 caster rolls with base 15; abilities ignore it.

**N4. Retaliation element** (battle; thorns).

- `UnitDef.shieldElement?: Element` (default `fire`) → `CombatStats.shieldElement`. The existing
  fire-shield step (`burnStrikers`) logs this element. The field keeps the name `fireShield`
  for the amount, so nothing that exists changes.
- **Test.** A Briar King's retaliation logs `element: 'nature'`; the Ash Colossus still logs
  `fire`.

**N5. Summoned squads never drag their commander** (battle; morale).

- In `moralePhase`, a summoned squad (`g.summoned`) that breaks does not mark its leader, and a
  commander's standing squads are counted among its non-summoned squads only. A commander that
  leads only summons fights on, like one that led none.
- No existing content changes behavior: Swarm's hornets and Fire Sprites have morale 50.
- **Test.** Measured above (P13); a unit test stages 8 battle-summoned wolves that rout while
  their commander stays.

**N6. Home terrain for a body** (battle; *should*, with Living Flame and Briar King).

- `UnitDef.homeTerrain?: { terrain: TerrainId; att?: number; def?: number; prot?: number }`.
  `statsFor` adds the bonuses when the battle's province has that terrain, on either side,
  next to the nation-wide `NationDef.homeTerrain`.
- **Test.** A Briar King in a forest province has def +2 and prot +2.

**N7. Monthly summon** (map).

- On the first day of each month (`state.day % 30 === 0 && state.day > 0`), in tick step 3
  after the pretenders settle, for each nation in id order whose pretender's chassis has
  `monthlySummon`: if the pretender stands (not in transit) in a province whose dominion
  belongs to its nation at strength ≥ `minDominion`, `n = min(count, leadership −
  troopCount)` troops of `unit` join it (`addSquad`), and if `n > 0` its owner gets an `info`
  message ("2 Wolves join Mother of Beasts."). No rng.
- **Tests.** Two a month at strength 1; none in foreign dominion; capped by leadership; not
  while in transit; the determinism hash holds.

**N8. Reform after death** (map; Undying).

- New state field `NationState.pretenderReturnDay: number | null`.
- When the pretender dies (`commanderDies`), if its chassis has `reform` or its design has the
  Undying boon, and the province where it died has `dominion.nation === nation` with strength ≥
  1, set `pretenderReturnDay = day + days` (90) instead of `pretenderDead = true`, and post
  "X will rise again in 90 days." Otherwise it is dead for good, as today.
- `settlePretender` waits while `day < pretenderReturnDay`, then places a fresh pretender
  (full HP, design pips) at the capital by the existing arrival rules (capital held, not
  Godless), clears the field, and posts "X rises again in Kharnath."
- While away, the pretender makes no dominion checks and incarnate blessings lapse (A.6).
- This changes the `docs/05` decision "A pretender that dies is gone for good in M1" for these
  two cases only.
- **Tests.** Returns on the day; dies for good in foreign dominion; waits while Godless; a
  second death reforms again; save migration adds the field as null.

### A.6 Blessings (the Dominions 6 menu, sized for FM)

Dominions 6 turns blessings into a menu bought with bless points, `Σ(level − 1)` over paths,
and an effect costs the sum of its requirements; effects needing 5 or more in a path are
incarnate and work only while the god is awake and alive
([manual ch. 3](https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html);
[illwiki, excerpt](https://illwiki.com/dom5/dom6/bless)). A god exactly at a requirement cannot
afford its effect, which players call feel-bad
([Steam thread](https://steamcommunity.com/app/2511500/discussions/0/4132682727127343168)).

**FM's rules.**

- **Bless points** `BP = Σ over colors of max(0, pips − 1)`. R4 gives 3, R6 gives 5, R4 G2
  gives 4.
- **Cost** of an effect = `max(1, requirement − 1)`: 1 for requirements 1 and 2, 2 for 3, 3 for
  4, 4 for 5, 5 for 6. A god exactly at a requirement can afford exactly one effect of it.
- **Requirement**: pips in the effect's color ≥ `requires`; some effects also need a scale
  step (`requiresScale`), as Dominions does.
- **Groups**: the standard blessing of a color and its greater form exclude each other.
- **Incarnate** effects (flagged) apply only while `nation.pretenderId !== null`: not before the
  god arrives, not while it is recalled, reforming, or dead. The standard and greater forms are
  never incarnate.
- **Who is blessed**: sacred units and the prophet, as today, plus the pretender with Avatar.
- **Interaction with today's bless.** Today each color at 4 pips gives its fixed bless, doubled
  at 6 (`docs/02` section 8). That fixed bless is the menu's **standard** blessing of each color
  (cost 3) and the doubled one its **greater** form (cost 5). A design without a `blessings`
  field gets exactly that (the default rule), so every existing design and test keeps its
  bless. The designer's "Recommended" button also spends leftover points on the color's
  minors, highest requirement first.
- **Fold.** Every effect is a stat fold in `battle/setup.ts statsFor`; the resolver changes
  nowhere. New fields beside today's `Bless` numbers: `fireShield`, `shieldElement`,
  `meleeDmg`, `meleeElement`, `meleeArmorPiercing`, `firstRoundBonus`, `berserk`. Melee weapons
  (no `range`) are copied with `dmg + meleeDmg`, the element, armor piercing, and
  `firstRoundBonus` added; `berserk` adds the tag.

```ts
// src/content/pretenders/blessings.ts
export interface BlessingDef {
  id: string; name: string; color: Color;
  requires: number;                 // pips in `color`
  cost: number;                     // max(1, requires - 1)
  incarnate: boolean;
  group?: string;                   // at most one chosen per group
  requiresScale?: { axis: ScaleAxis; toward: 'positive' | 'negative'; steps: number };
  effect: BlessingEffect;           // att, str, def, prot, mor, prec, regeneration, lifeDrain, fireShield,
                                    // shieldElement, meleeDmg, meleeElement, meleeArmorPiercing, firstRoundBonus, berserk
}
// PretenderDesign.blessings?: readonly string[]  (absent = the standard or greater blessing of each color at 4+ pips)
// blessOf(design, onMap): Bless   (replaces blessOf(pips); bless.ts)
// blessPoints(pips): number; defaultBlessings(pips): string[]
```

**Red (Ember), M1** — standard and greater forms marked ★.

| Id | Name | Req | Cost | Incarnate | Effect on blessed units |
|---|---|---|---|---|---|
| fervor | Fervor | R1 | 1 | | mor +1 |
| keenEdge | Keen Edge | R2 | 1 | | att +1 |
| emberMight | Ember Might | R3 | 2 | | str +2 |
| emberWrath ★ | Ember Wrath | R4 | 3 | | att +2, str +2 (today's R bless) |
| cinderSkin | Cinder Skin | R4 | 3 | | fire shield 3 |
| blazingCharge | Blazing Charge | R4 | 3 | | first melee round +5 damage on every melee weapon; mor +1 |
| furyUnbound | Fury Unbound | R5 | 4 | yes | berserk; att +1. Requires Fury 1 |
| flamingWeapons | Flaming Weapons | R5 | 4 | yes | melee weapons +3 damage, fire, armor piercing |
| greaterEmberWrath ★ | Greater Ember Wrath | R6 | 5 | | att +4, str +4 (today's doubled bless) |
| livingPyre | Living Pyre | R6 | 5 | yes | fire shield 5; melee weapons +2 damage, fire; att +2 |

**Green (Loam), M1.**

| Id | Name | Req | Cost | Incarnate | Effect |
|---|---|---|---|---|---|
| thickSkin | Thick Skin | G1 | 1 | | prot +1 |
| vigor | Vigor | G2 | 1 | | regeneration 5% |
| strengthOfEarth | Strength of the Earth | G3 | 2 | | str +2 |
| evergreen ★ | Evergreen | G4 | 3 | | regeneration 10%, prot +1 (today's G bless) |
| oakhide | Oakhide | G4 | 3 | | prot +3 |
| deepRoots | Deep Roots | G4 | 3 | | mor +3, prot +1 |
| wildVigor | Wild Vigor | G5 | 4 | yes | regeneration 20%, str +1. Requires Growth 1 |
| thornhide | Thornhide | G5 | 4 | yes | thorn shield 4 (nature); prot +1 |
| greaterEvergreen ★ | Greater Evergreen | G6 | 5 | | regeneration 20%, prot +2 (today's doubled bless) |
| ironbark | Ironbark | G6 | 5 | yes | prot +5, str +2 |

**White, Blue, Black in M1**: only today's blesses plus two minors each, so splashes still pay
off. Their full menus are M2.

| Color | Minors (cost 1) | ★ Standard (W4/U4/B4, cost 3) | ★ Greater (6, cost 5) |
|---|---|---|---|
| W | Resolve W1 mor +1; Warding W2 prot +1 | Steadfast: mor +2, prot +1 | Greater Steadfast: mor +4, prot +2 |
| U | Keen Eye U1 prec +1; Wariness U2 def +1 | Clear Sight: def +2, prec +2 | Greater Clear Sight: def +4, prec +4 |
| B | Cruelty B1 att +1; Grim Resolve B2 mor +1 | Blood Thirst: life drain 2, att +1 | Greater Blood Thirst: life drain 4, att +2 |

**Validation** (`validatePretender`, returning the first problem; the designer shows every
check through the UI spec's `checkPretender`): unknown id; duplicate; requirement unmet
("Flaming Weapons needs R5"); scale unmet ("Fury Unbound needs Fury 1"); two of one group;
total over BP ("4 bless points chosen of 3").

**Tests.** Every existing preset's `blessOf` is unchanged with no `blessings` field; R6 default
equals today's doubled bless; an incarnate effect is absent before arrival and present after;
fold tests per new field (fire shield on sacreds, melee damage and armor piercing on weapons,
berserk tag); content validation of every blessing (requirement 1 to 6, cost formula, effect
non-empty).

### A.7 Boons

A short list of Dominions-flavored options bought with design points. Each one is optional,
at most once, and shown in the budget bar as its own segment.

| Boon | Cost | Effect (exact) | Where it acts | Notes |
|---|---|---|---|---|
| Sacred Spring | 40 | One spring of a chosen color with ≥ 1 pip is added to the capital (D5 code path) | `createGame` | `{ id: 'sacredSpring', color }` |
| Avatar | 40 | In battle, the pretender receives its nation's blessings (incarnate included) when the battle's province has its nation's dominion at strength ≥ 1 | `statsFor` | Built into the Ascended Hero; refused there as a duplicate |
| Undying | 70 | N8 with 90 days | `commanderDies`, `settlePretender` | Built into the Ash Phoenix; refused on immobile chassis (they die only with their capital) |
| Chosen Host | 60 | The first starting commander also leads 10 of the nation's sacred unit (`NationDef.chosenHost`: Flamebrand, Oakheart) | `createGame` | Fits both starting leaders' leadership 80 (30 + 10) |
| Deep Lore | 50 | Starting research is one level higher in the nation's color (the level-2 threshold, 150 points) | `createGame` | Fireball or Bark Skin from day 0 |
| Iron Will | 20 | The pretender's morale is 50 in battle: it never checks and never routs with its squads | `statsFor` | Makes god-led armies hold their god |

```ts
export type BoonChoice =
  | { id: 'sacredSpring'; color: Color } | { id: 'avatar' } | { id: 'undying' }
  | { id: 'chosenHost' } | { id: 'deepLore' } | { id: 'ironWill' };
// PretenderDesign.boons?: readonly BoonChoice[]; BOONS: Record<BoonId, { name; cost; description }> in content.
```

**Tests.** Each boon's cost appears in `designCost`; each effect has a unit test; refusals for
duplicates, built-ins, and Sacred Spring without pips.

### A.8 Presets

Twelve presets, six per nation. The first three of each nation are today's designs, unchanged
(their costs reproduce: Warlord 385, Elder Oak 385, Deep Root 395); Wildfire and Deep Root
spend their 2 bless points, which bought nothing before, on a minor blessing. The first preset stays the AI and
runner default. Every preset carries a look (B.9) and its blessings explicitly.

| Nation | Preset | Design | Blessings | Cost / budget |
|---|---|---|---|---|
| Cinder Horde | Warlord (default) | Titan R4, dominion 5, Fury 3, Turmoil 2, awake | Ember Wrath | 385 / 400 |
| Cinder Horde | Ember Oracle | Oracle R6, dominion 4, Fury 2, dormant | Greater Ember Wrath | 280 / 550 |
| Cinder Horde | Wildfire | Ash Colossus R3, dominion 6, Turmoil 3, Fury 3, imprisoned | Ember Might (new: its 2 points were unspendable) | 415 / 750 |
| Cinder Horde | **Undying Flame** | Ash Phoenix R4, dominion 6, Growth 2, Fury 2, Turmoil 1, awake | Ember Wrath | 395 / 400 |
| Cinder Horde | **Pyre Host** | Pyre Lord R4, dominion 4, Fury 3, Turmoil 3, Iron Will, awake | Ember Wrath | 395 / 400 |
| Cinder Horde | **Dread Idol** | Cinder Idol R4, dominion 9, Dread 3, Turmoil 1, awake | Cinder Skin | 395 / 400 |
| Thornwood | Elder Oak (default) | Titan G4, dominion 5, Growth 3, Wild 2, awake | Evergreen | 385 / 400 |
| Thornwood | Deep Root | Living Monolith G3, dominion 7, Growth 3, Wild 3, Sanctity 1, awake | Strength of the Earth (new) | 395 / 400 |
| Thornwood | Wyrm of the Loam | Great Wyrm G4, dominion 4, Growth 2, dormant | Evergreen | 375 / 550 |
| Thornwood | **Heartwood** | World Tree G4, dominion 7, Growth 2, Wild 2, Sanctity 1, Sacred Spring (G), awake | Deep Roots | 390 / 400 |
| Thornwood | **Hunt Lord** | Horned Hunter G4, dominion 4, Fury 2, Wild 2, Growth 2, Iron Will, awake | Oakhide | 385 / 400 |
| Thornwood | **Mother of the Pack** | Mother of Beasts G4, dominion 5, Growth 3, Wild 2, Iron Will, awake | Evergreen | 395 / 400 |

Ember Oracle leaves 270 points unspent today; Phase 12 should revisit it (for example
dominion 7 and Turmoil 3), but this draft does not change existing presets.

### A.9 The M2 set: White, Blue, Black

Sketches for M2, six national chassis per color, with the rules each needs. Every new rule
below is M2 and is specified when its color ships. Numbers are indicative.

| Color | Chassis | Tier, role | Base | Dom | Signature | Needs |
|---|---|---|---|---|---|---|
| W | Statue of Law | idol | W2 | 4 | attuned to Lore; temple checks +1 at the capital | D3 |
| W | Virtue | beast, fighter | W1 | 2 | flying; Awe 2: an enemy must pass a morale check at 10 + 2 before it may strike the unit | new: awe |
| W | Merciful One | spirit, support | W2 | 2 | each round heals 3 on all friendly squads; −5 unrest a month where it stands | N1, N7 variant (`provinceUnrest`) |
| W | Solar Titan | titan, leader | W2 | 2 | Sun Strike: holy weapon, double damage against undead | new: bane vs tag |
| W | Lawgiver | seer, mage | W1 | 1 | prophet gets +1 holy; dominion checks +1 | D-field |
| W | Dawn Colossus | idol | W3 | 4 | Banishing Light: battle start 10 holy damage area(10) against undead | N1 + bane |
| U | Archsage | seer, mage | U2 | 1 | research ×1.5; new color 30 | `researchFactor` |
| U | Storm Wyrm | monster | U2 | 2 | storm field at battle start; shapechange from a sage to a wyrm when wounded | N1, new: shapechange |
| U | Mirror Spirit | spirit, raider | U2 | 2 | ethereal (75% of physical blows miss); stealthy | new: ethereal |
| U | Frost Father | titan | U2 | 2 | chill aura: each round fatigueDrain 10 on the enemy's casters, damage 3 cold area(4) | N1 |
| U | Unblinking Eye | idol | U3 | 4 | scries one province within 3 each month | N7 variant (`scry`) |
| U | Tide Caller | beast, raider | U1 | 2 | Rift Step once a season (teleport to an owned province) | new: teleport |
| B | Lich | seer, mage | B3 | 2 | immortal (reforms anywhere, 120 days); undead | N8 variant (`where: 'anywhere'`) |
| B | Bone Throne | idol | B2 | 4 | immortal; attuned to Turmoil; Skeletons a month | N7, N8 |
| B | Ghost King | spirit, summoner | B1 | 2 | ethereal; Shades a month in own dominion; Fear 2 | ethereal, N1, N7 |
| B | Fountain of Blood | idol | B3 | 4 | Fear 3; 2 B springs; −1% population a month where it stands | D5, N1, N7 variant |
| B | Vampire Lord | titan, raider | B2 | 1 | life drain 4 on its own blows; flying; stealthy | `UnitDef.lifeDrain` |
| B | Plague Mother | monster | B2 | 2 | decay aura: each round 4 decay area(6), armor negating | N1 |

M2 also brings each color's full blessing menu (8 more effects each, for example W Awe, U Blur,
B Withering Weapons) and element resistances, which make the breath color (D6) mechanical.

### A.10 Balance notes

**Measured bodies.** Staged fights in the repository's resolver, 300 seeds each, the god alone
(Attack script) against an Independent Captain and its troops. Approximations: trample as
extra weapon copies; battle-start summons present from round 1 (summons not dragging, N5); Fear
as enemy morale −2; the heat aura as a cast every round; the Briar King without Rising Briars
or its forest bonus; the Mother of Beasts with the 12 wolves of month 6. Cells: god's win rate (its HP left).

| Body | Weak plains (11 LI, 5 archers) | Plains (16 LI, 8 archers) | Hills (20 Heavy Inf.) | Forest (12 wolves, 6 archers) | Mountain (giant, 25 HI) |
|---|---|---|---|---|---|
| Titan (today) | 40% (28%) | 3% | 0% | 12% | 0% |
| Great Wyrm (today) | 100% (82%) | 99% (65%) | 76% (36%) | 100% (71%) | 5% |
| Ash Colossus (today) | 91% (46%) | 60% (30%) | 3% | 67% (34%) | 0% |
| Wild Spirit (today) | 1% | 0% | 0% | 0% | 0% |
| Primordial | 100% (84%) | 100% (75%) | 90% (47%) | 100% (77%) | 28% |
| Elder Wyrm | 100% (97%) | 100% (88%) | 55% (42%) | 100% (92%) | 12% |
| Briar King | 95% (55%) | 60% (32%) | 6% | 75% (39%) | 0% |
| Ash Phoenix | 57% (36%) | 11% | 3% | 27% | 0% |
| Living Flame | 76% (40%) | 31% | 6% | 51% | 1% |
| Horned Hunter + 8 wolves | 79% (70%) | 49% (60%) | 17% | 56% (62%) | 7% |
| Pyre Lord + 6 sprites | 65% (62%) | 21% | 22% | 44% | 5% |
| Mother of Beasts + 12 wolves (month 6) | 91% (78%) | 70% (67%) | 16% | 71% (71%) | 6% |

Readings:
- **The Great Wyrm is the anchor.** Monsters land near it: the Primordial is stronger but must
  sleep 11 months; the Elder Wyrm is weaker against heavy infantry, cheaper by 50, slow, and
  regenerates.
- **Trample was tuned down.** The first draft (trample 4 × 3) won 100% against a mountain
  fortress with the Primordial; at 2 × 2 it wins 28%. Against size-1 troops the damage number
  barely matters (strength already kills a 10-HP troop); the strike count is the lever.
- **Leaders, raiders, and mages are not solo bodies**, by design: the Titan wins 40% against a
  weak province; Phoenix, Hierophant and Hero need an army. The Phoenix's Undying is its
  defense.
- **Summons decide summoners.** Without N5 the Horned Hunter routed with its wolves (16%);
  with it, 79%.

**Cost observations and risks** (for Phase 12).
- *Primordial dormant* nets 10 points after the refund and an imprisoned one −190. The minimum
  awakening and an 11-month absence are its price; watch the "scales sleeper" win rate.
- *Cinder Idol* with Dread 3 at strength 9 gives enemies −3 morale in Red-dominated provinces
  and +6 unrest a month where Red dominion touches. Strong on defense; check it does not
  freeze the AI's expansion into Red dominion.
- *Monthly summons* are capped by leadership (Cinder Idol 40 sprites, Mother of Beasts 60
  wolves) and cost no upkeep, but they eat supply. Thornwood's Growth makes the pack cheap to
  feed; measure starvation in Hills.
- *Chosen Host* (60) gives 10 sacreds worth 320 gold on day 0; *Deep Lore* (50) gives Fireball
  on day 0. Both are early spikes: test against "4 provinces by month 6" from the playtest
  checklist.
- *Attunement* only matters off-color: Growth for the Phoenix, Dread for the Cinder Idol,
  Sanctity for the World Tree, Fury for the Horned Hunter. Each halves one axis's price.
- *Blessings*: the incarnate R5 and G5 effects are the strongest per point; their price is the
  god's presence.

**How the Phase 12 headless runner tests it.**
1. **`sim:aivai --presets cinderHorde:<id>,thornwood:<id>`** plays chosen presets (today the
   runner always uses the defaults). **`--matrix`** plays each new preset against the
   opposing default (12 pairings × 20 games, seeds 1 to 20) and prints a win table.
   Acceptance: every preset wins 35% to 65% against the opposing default; no chassis's best
   preset exceeds 65% against the field; the default pairing still splits about evenly
   (the existing checklist line).
2. **`sim:duel`** (new, `scripts/duel.ts`): the table above as a script over every chassis
   body and five independent fixtures, 400 seeds. A Vitest file pins bands for regressions
   (for example "Great Wyrm against 20 Heavy Infantry wins 60% to 90%"; "Primordial against
   the mountain fortress wins at most 40%").
3. **Expansion pace**: the runner reports months to the 4th and 8th province per preset; a
   preset that reaches 8 more than 3 months faster than the opposing default is flagged.
4. **Determinism**: the matrix runs twice per seed in CI's nightly job and compares state
   hashes.

### A.11 AI

- The AI keeps playing the nation's default preset (`docs/08` decisions), so Phase 7's tuning
  is unaffected by everything above.
- `docs/08` step 10 reads `ChassisDef.role` instead of chassis ids: fighter, monster, leader
  and summoner join the main army after month 3; raider joins the army or takes weak provinces
  alone (Phoenix); mage researches if it can (Oracle) or joins the army (Hierophant); idol casts
  rituals in the capital.
- *M1-should*: an opponent row on New Game offers "Random preset"; the UI picks one from the
  nation's presets with a stream seeded by the game seed and the slot (never `state.rng`).

---

## B. Customization (Age of Wonders 4-like)

### B.1 What to take from AoW4

AoW4's decisive move is that the people's form is cosmetic and the traits are mechanical: "the
physical form is effectively only cosmetic" ([AoW4 wiki: Form](https://aow4.paradoxwikis.com/Form)).
Reviewers call the faction creator the game's centerpiece, with "an unparalleled degree of
customization for the genre" ([Gideon's Gaming](https://gideonsgaming.com/age-of-wonders-4-review/)).
The lessons below come from `research-aow4.md` (Part 2), which cites each source.

| Lesson | Evidence | Fluid Magic |
|---|---|---|
| Any look on any build | Form is cosmetic ([wiki](https://aow4.paradoxwikis.com/Form)) | `PretenderLook` never touches `PretenderDesign` |
| Mechanics add visuals; cosmetics never add mechanics | Dragon attunement sets breath and glow ([Dragon Dawn](https://www.paradoxinteractive.com/games/age-of-wonders-4/add-ons/age-of-wonders-4-dragon-dawn)) | Pips, blessings, dominion, awakening and body tags each show automatically (B.4, C.5) |
| A visual that carries movement cannot be hidden | Transformations hideable except flying or floating ([forum](https://steamcommunity.com/app/1669000/discussions/0/6761669877514621714/)) | Wings, roots, stealth flicker and embers are fixed parts, never slots |
| Cosmetics locked by mechanics anger players | The C4U mod exists only to unlock cultures' cosmetics ([Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=2971527182)) | No slot is locked by nation, realm or pips |
| Fixed secondary colors anger players | Dragons have "only one colour option" ([forum](https://steamcommunity.com/app/1669000/discussions/0/4036979414422568941/)) | Three chosen channels on every chassis |
| New ruler types shipped thin | "Not enough cosmetic options for Giant Kings" ([forum](https://steamcommunity.com/app/1669000/discussions/0/596271495257278373/)) | A content test requires 4 slots × 3 variants on every chassis |
| Random came late, then gained settings and history | Random Ruler in the Wyvern Update ([patch notes](https://store.steampowered.com/news/app/1669000/view/7208622092879106175)) | Random god and random look from day one, with locks and a 10-roll history |
| No in-game sharing | "No easy in-game way to share factions" ([forum](https://steamcommunity.com/app/1669000/discussions/0/839501827476184072/)) | A share code |
| Generated history makes a faction feel authored | "The creator will also create a historic background" ([GamePressure](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c)) | A templated myth line with an override |
| Appearance editable mid-campaign | Dragon Lord "Adjust Appearance" ([MMORPG](https://www.mmorpg.com/reviews/age-of-wonders-4-dragon-dawn-review-strategy-session-2000128239)) | "Adjust appearance" on the pretender's commander panel (M1-should) |
| One base mesh, shared animations | Dev Diary #11 ([GameBanshee](https://www.gamebanshee.com/news/127487-age-of-wonders-4-developer-diary-11-art-design.html)) | One anchor skeleton per rig; parts authored in anchor space; docs/09 tweens move anchors |

### B.2 Where the look lives

- **Outside `GameState`.** `PretenderDesign` stays the sim's type. The look, the identity
  (except the name) and the nation look live in three places: the designer's saved gods
  (`GodRecord`), the share code, and the save file's presentation block. The sim cannot read
  what it does not hold, so "cosmetic never affects the sim" is structural.
- **The name** is the one exception: `NationSetup.pretenderName` (D7) names the pretender
  commander, so messages ("Vulkra stands in Kharnath.") and battle records carry it. It is an
  opaque label; no rule branches on it.
- **AI nations** get a look and identity at New Game: the preset's own look, or a roll from a
  stream seeded by the game seed and the nation's slot. A reload shows the same look because
  the save stores it.
- **Guards.** `tests/sim/purity.test.ts` forbids `src/sim/**`, `src/mapgen/**` and `src/ai/**`
  from importing `src/content/looks/**`, as the battle design forbids `src/present`. A
  determinism test plays the same headless game with two different looks and identities and
  asserts equal state hashes; a second test changes only the name and asserts equal outcomes
  (winner, day, provinces) with the name fields blanked from the hash.

```ts
// src/content/looks/types.ts (presentation data; never imported by sim, mapgen, ai)
export type SlotId = string;        // per chassis, from ChassisLookDef
export type VariantId = string;
export interface PretenderLook {
  v: 1;
  chassis: string;                                    // the slots are validated against it
  parts: Partial<Record<SlotId, VariantId>>;          // absent = the slot's variant 0
  markings: MarkingId;                                // procedural pattern (B.5)
  swatches: { material: SwatchId; metal: SwatchId; accent: SwatchId };
  sliders: Partial<Record<SliderId, -2 | -1 | 0 | 1 | 2>>;
  pose: 'regal' | 'wrathful' | 'serene';
  aura: 'halo' | 'motes' | 'groundSigil' | 'sparkCrown';            // shape only; colors from pips
  flourish: 'sigilWheel' | 'mantle' | 'haloBurst' | 'ascension';    // charge window only (C.5)
}
export interface PretenderIdentity {
  name: string;                 // 1 to 24 characters; copied into NationSetup.pretenderName
  epithet: string;              // 0 to 32, "the Unburnt"
  title: string;                // 0 to 32, "Lord of Cinders"
  pronoun: 'he' | 'she' | 'they' | 'it';
  myth: string | null;          // null = the templated myth (B.6); up to 280 characters
}
export interface NationLook {
  sigil: { frame: SigilFrameId; charge: SigilChargeId };
  division: BannerDivisionId;
}
/** A god in the designer, in My Gods, and in a share code. */
export interface GodRecord {
  v: 1;
  nation: NationDefId;
  design: PretenderDesign;      // the sim's type, checked by validatePretender
  look: PretenderLook;          // checked by validateLook
  identity: PretenderIdentity;
  nationLook: NationLook;
}
/** The save file (Phase 9, src/ui/persistence): the sim's state plus the presentation block. */
export interface SaveFile {
  format: 'fluid-magic-save';
  version: number;
  game: string;                                        // serialize(state), gzipped as the battle design asks
  presentation: { gods: Record<NationId, { look: PretenderLook; identity: PretenderIdentity; nationLook: NationLook }> };
}
// src/content/looks/chassis.ts
export interface ChassisLookDef {
  chassis: string;
  rig: Rig;                                            // the battle design's rigs, plus 'avian' and 'behemoth'
  slots: readonly { id: SlotId; family: PartFamily; variants: readonly VariantId[] }[];
  markings: readonly MarkingId[];
  materialFamily: 'skin' | 'stone' | 'bark' | 'scale' | 'hide' | 'ember';
  sliders: readonly SliderId[];
  /** Parts that carry mechanics and are never slots. */
  fixed: readonly PartId[];
}
export function validateLook(look: PretenderLook, chassis: string): string | null;
```

### B.3 Slots and variants per chassis

Every chassis has **four slots with three variants each** (variant 0 is the base art Phase 11
needs anyway), plus a **markings** pattern from eight procedural ones. Slots favor silhouette,
because faces vanish at 64 px (research-aow4 L8). Variants come from **shared part families**,
authored once in anchor space and scaled per chassis, so 18 chassis cost far fewer files than
18 × 8.

| Chassis | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Fixed (mechanics) |
|---|---|---|---|---|---|
| Oracle of the Flux | headgear: cowl, circlet, mask | mantle: none, long cape, tattered | staff head: orb, crescent, mote cage | robe glyphs: runic, spiral, dot-line (procedural) | floating hem |
| Titan | headgear: great helm, horned crown, crown of points | mantle: none, long cape, banner cape | blade: straight, flamberge, broad | armor marks: plain, runic, veins (procedural) | giant scale |
| Great Wyrm | horns: swept, crown of spines, frill | wing membrane: smooth, tattered, ribbed sail | tail: spade, club, blade fin | scale pattern: banded, mottled, plated (procedural) | wings, breath glow |
| Living Monolith | shape: obelisk, menhir, broken arch | capstone: none, floating stone, carved face | overgrowth: none, moss and vines, soot and cracks | glyphs: runic, spiral, dot-line (procedural) | rooted base |
| Ascended Hero | headgear: circlet, great helm, horned crown | mantle: long cape, banner cape, tattered | blade: straight, broad, flamberge | heraldry: plain, quartered, chevrons (procedural) | — |
| Primordial | horns: ram, crown of spines, antlers | back: moss, spines, crystals | tail: club, spade, blade fin | hide: mottled, banded, stone (procedural) | — |
| Ash Colossus | head: brazier, horned skull, faceless crown | shoulders: bare, chains, spikes | fists: bare, banded, molten | cracks: veins, plates, runes (procedural) | embers |
| Ash Phoenix | crest: plume, flame crown, horned | plumage: fan, flame fringe, streamers | tail: long, fan, forked | feathers: barred, ember-tipped, plain (procedural) | flame wings |
| Pyre Lord | headgear: flame crown, horned crown, great helm | mantle: ember mantle, banner cape, none | glaive: glaive, crescent, hooked | ash marks: stripes, veins, runic (procedural) | — |
| Cinder Idol | face: brazier face, horned head, stacked cairn | base: plinth, chained, skull pile | overgrowth: soot and cracks, ember veins, none | glyphs (procedural) | immobile base, smoke |
| Ember Hierophant | headgear: mask, cowl, flame crown | mantle: ember mantle, long cape, tattered | staff head: orb, crescent, mote cage | robe glyphs (procedural) | — |
| Living Flame | form: pillar, serpent coil, winged | crown: none, flame crown, horns | heart: ember core, white heart, eye (procedural) | tongues: lapping, spiral, sheet (procedural) | flight, heat haze |
| Wild Spirit | beast form: stag, wolf, great cat | head: antlers, spirit mask, horned skull | trail: wisps, leaves, mist (procedural) | markings: stripes, rings, spots (procedural) | translucent flicker |
| World Tree | canopy: round, weeping, crown of thorns | trunk face: none, carved face, knotted eyes | blossom: none, pale blossom, fruit (procedural) | bark: ridged, spiral, knotted (procedural) | roots |
| Horned Hunter | antlers: antlers, ram, swept | mantle: leaf mantle, wolf pelt, tattered | spear: leaf blade, hooked, crescent | warpaint (procedural) | — |
| Elder Wyrm | horns: crown of spines, swept, frill | back: moss, spines, crystals | tail: club, spade, blade fin | scale pattern (procedural) | — (no wings: it does not fly) |
| Mother of Beasts | pelt: bear, wolf, stag | headgear: antler crown, circlet, none | maul: plain, studded, stone-headed | warpaint (procedural) | — |
| Briar King | headgear: horned crown, antler crown, crown of points | mantle: leaf mantle, tattered, none | maul: thorned, studded, stone-headed | bark (procedural) | thorns |

Combinations: 3⁴ = 81 silhouettes per chassis, 1,458 in all, before color, markings, pose,
aura, flourish and sliders (B.7 counts).

### B.4 Color channels and the color-blind rules

| Channel | Chosen or derived | Choices in M1 | Carries information? |
|---|---|---|---|
| `banner` (the docs/09 tint zone in battle and on the map) | derived: the nation's banner (`NATION_BANNERS`) | none | yes: which side; tested by the palette test |
| `pipTint` (the tint zone on the summary card and the designer portrait, per docs/09) | derived: the dominant pip color | none | yes: always beside the mana-symbol row |
| `glow` (aura motes, eyes, glyphs, breath, staff head) | derived: every color with pips, in proportion; the Wyrm's breath from D6 | none | yes: paired with symbols (C.5) |
| `material` (skin, stone, bark, scale, hide, ember) | chosen | 8 per family (ember 6) | no |
| `metal` (crowns, armor, chains) | chosen | 6: gold, silver, bronze, iron, bone, obsidian | no |
| `accent` (cloth trim, markings) | chosen | 8 muted tones | no |

Rules, each a test in `tests/content/looks.test.ts` using the palette test's helpers
(`tests/content/colorMath.ts`):
1. Chosen channels carry no information; side identity is banner, glyph and position (battle
   design S4.8) and color identity is glow plus symbol.
2. Every material and metal swatch reaches WCAG 3:1 against the keyline chosen for it by the
   docs/09 `keylineFor` rule, so the silhouette reads on every swatch.
3. Every accent differs from every `NATION_BANNERS` entry by CIEDE2000 ≥ 15 (≥ 10 under the
   simulated deficiencies), so a god's trim never reads as another side's banner.
4. No swatch, glow or flash color is a saturated red (R/(R+G+B) < 0.8, the WCAG 2.2 test
   research-vfx 2.6 computed for the palettes).
5. The designer has a color-blind preview (protanopia, deuteranopia, tritanopia) using the
   palette test's simulation matrices in a `ColorMatrixFilter`.

M2: a free color picker for material, metal and accent only, behind "More colors", checked by
rules 2 and 3 live. The derived channels never get one (AoW4 players asked for more colors,
[Age of Colors mod](https://steamcommunity.com/sharedfiles/filedetails/?id=2970499689); FM's
map colors are gameplay information, so identity goes into shapes instead).

### B.5 Sliders, poses, auras, flourishes, markings

- **Sliders** (−2 to +2, integer, clamped): stature ±3% a step; head ±6%; horn or crown length
  ±10%; wingspan ±8% (flyers only); ember or glyph intensity ±25% particle rate (bodies with
  embers or glyphs; capped by the tier budgets of C.1). The sim's `size` drives battle
  drawing, so stature never changes the size class. Each slider is a transform on an anchor; a
  test composes every chassis at ±2 and checks the bounding box stays inside the 128 px
  portrait frame (AoW4's cropping problem, research-aow4 1.5).
- **Poses** (3: regal, wrathful, serene) are anchor rotations for the portrait and the idle
  stance. Battle poses stay rig-driven (battle design S4.4).
- **Aura shapes** (4, procedural, cosmetic): halo ring, orbiting motes, ground sigil circle,
  crown of sparks. Their colors always come from the pips; their motes move in each color's
  verb (C.1).
- **Cast flourishes** (4, procedural, cosmetic): sigil wheel, mantle, halo burst, ascension.
  They play inside the charge beat of the god's own casts and never lengthen it (C.5).
- **Markings** (8 procedural pattern fills: stripes, rings, spots, banded, mottled, runic,
  veins, plain), drawn in the accent channel through the part's tint mask. Each chassis lists
  three as its slot 4 or as extra markings.

### B.6 Identity: name, epithet, title, pronoun, myth

- **Name** (1 to 24), **epithet** (0 to 32), **title** (0 to 32), **pronoun** (he, she, they,
  it; AoW4 launched its Eldritch Sovereign without "it",
  [forum](https://steamcommunity.com/app/1669000/discussions/0/4548155824440762289/)). Display:
  "Vulkra the Unburnt" with "Lord of Cinders" beneath.
- **Generators** run on the designer's seeded stream (B.9). Names come from syllable tables
  per dominant color, like `src/content/names.ts` does for provinces (Ember: Vul, Khar, Pyr,
  Ash, Cind + ra, ax, oth, eth; Loam: Thal, Ver, Ald, Sylv + wyn, mere, oak, ra; M2 colors
  added with their nations). Epithets and titles come from tables keyed by role and dominant
  color ("the Unburnt", "Pyreborn", "the Evergreen", "Root of Ages"; "Lord of Cinders", "Mother
  of the Hunt", "Keeper of the Spring").
- **Myth** (2 or 3 sentences, templated, overridable): built from the chassis phrase, the
  dominant color, the strongest scale pole, the dominion strength word, the awakening, and the
  signature blessing. Example (Ash Phoenix, R4, Growth 2, dormant): "Ash-feathered and
  undying, Vulkra the Unburnt sleeps a year beneath Kharnath. When it wakes, the land will grow
  and burn by turns." Templates read the pronoun. The docs/05 "reading" stays a separate,
  strategic one-liner on the card ("An undying firebird. Expect raids that never end.").
- **The sim's copy** is the name only (D7). Messages never use pronouns, so the pronoun can
  stay in the presentation block.

### B.7 Nation banner and sigil

- **Banner color** stays as `NATION_BANNERS` assigns it, because ownership bands and candles
  are gameplay information and pass the palette tests (docs/09).
- **Division** (6, procedural): plain, per pale, per fess, per bend, chevron, bordure, in the
  banner color and the neutral that `keylineFor(banner)` picks (`#F4EEDF` or `#1C1A17`).
- **Sigil**: a frame (6: roundel, shield, lozenge, sunburst, ring of thorns, broken circle)
  around a charge (16: crown, eye, hand, tree, flame, tower, serpent, star, skull, wave, antler,
  key, sword, wheel, moon, anvil), drawn in the neutral. 96 sigils × 6 divisions = 576 banners,
  all told apart by shape. Charges are original geometric shapes.
- **Where it shows**: the army badge corner (10 px charge), the squad pennants in battle beside
  the side glyph, the `PretenderCard`, the top bar's nation button, name cards, the rim of
  ritual sigils (C.4), and the victory screen.

**Counting looks.** Per chassis: 81 silhouettes × 8 markings × (8 × 6 × 8) swatches × 3 poses ×
4 auras × 4 flourishes ≈ 12 million, before 5 sliders at 5 steps. AoW4's published comparison
points are in research-aow4 3.7: 13 base banner colors, a 6-type ruler roster, and per-slot
counts not found.

| Axis | AoW4 | FM M1 | FM M2 |
|---|---|---|---|
| Ruler type / chassis | 6 | 18 (12 per nation) | 36 |
| Part slots per body | about 10 humanoid slots | 4 × 3, plus markings | 6 × 5 |
| Sliders | body shape, head, hands, height, arm length | 5 (by chassis) | 7 |
| Chosen color channels | skin, hair, armor, banner ×2, later a picker | 3 (8 / 6 / 8) | 3 plus a picker |
| Banner identity | 13 colors, icon set | fixed colors; 96 sigils × 6 divisions | about 200 sigils |
| Pose | diplomacy pose | 3 | 5 |
| Magic look | via attunement | 4 auras, 4 flourishes, pip-driven glow | 8 and 8 |
| Presets | 18 to 20 | 12 with looks | 30 |
| Random | ruler, reroll, settings, history | god and look, locks, seed, 10-roll history | plus constraints |
| Sharing | none in game | share code | plus files and a gallery |

### B.8 Portrait

- The portrait is **composed from the same parts** as the battle sprite, in a portrait pose, at
  128 px (card), 256 px (designer preview) and 64 px (battle docks). This replaces docs/09's
  "a 128x128 SVG portrait" per chassis, so every cosmetic choice shows on the card.
- Layers, back to front: backdrop (parchment, the nation's home terrain gradient, or night),
  ground aura, body parts, glow parts, bless rings and orbiting symbols (C.5), the awakening
  overlay (dormant: a sleep veil and closed eyes; imprisoned: runic chains), the sigil corner,
  the frame.
- AoW4's lighting toggle becomes the backdrop toggle (research-aow4 L10).

### B.9 Presets, randomize, My Gods, the share code

- **Presets** (A.8) carry a curated look and identity. Applying a preset asks nothing; a "keep
  my look" checkbox keeps the current look and identity when only the build should change.
- **Random god** (`rollGod(nation, seed, opts)`): picks an available chassis, an awakening at or
  above its minimum, a strategy family (bless rush, mage, dominion, sleeper, summoner), then
  spends by that family's template (pips first, then dominion, then the nation's own poles),
  fills leftovers until under 20 points remain, takes the Recommended blessings, and adds one
  affordable boon 30% of the time. The result always validates (tested over 1,000 seeds).
- **Random look** (`rollLook(chassis, seed, locks)`): every unlocked slot, swatch, marking,
  pose, aura and flourish uniform; sliders 0 (60%), ±1 (30%), ±2 (10%). Identity rolls from the
  generators.
- **Determinism and history.** The stream is `createRng(hash32('god', seed))` from the sim's
  algorithm (via the battle design's pure `src/present/rand.ts`), never `state.rng`. The seed
  is shown in the dice tooltip; Back and Forward walk the last 10 rolls. Locks exist per build
  step and per look slot. Players asked for a random button on every step
  ([forum](https://steamcommunity.com/app/1669000/discussions/0/3828666283443789087/)), so each
  step and slot has its own die.
- **My Gods**: an IndexedDB store of `GodRecord`s (`idb-keyval`, which docs/06 already names).
  Save edits in place, Save as copy, Rename, Delete, Copy code. AoW4 players reported edits that
  did not stick ([forum](https://steamcommunity.com/app/1669000/discussions/0/5294588689507328353/)).
- **Adjust appearance** in game (M1-should): the pretender's commander panel opens Look and
  Identity (not the name, which the sim holds). Nothing in the sim changes.

**The share code.** `FM1-` + base64url(payload ‖ CRC-16/CCITT-FALSE). Indices come from
append-only code tables in content (`src/content/looks/codes.ts`); a snapshot test pins every
existing index so old codes keep decoding.

| Field | Bits |
|---|---|
| payload version | 4 |
| nation (code table) | 6 |
| chassis (code table) | 7 |
| pips W U B R G | 5 × 3 |
| dominion | 4 |
| scales (value + 3) | 5 × 3 |
| awakening | 2 |
| breath color (0 = default) | 3 |
| blessings: count, then each id | 4 + n × 7 |
| boons mask, then Sacred Spring's color if set | 8 (+ 3) |
| look: slot count, then each variant | 3 + n × 4 |
| swatches material, metal, accent | 4 + 3 + 4 |
| sliders: count, then id and value + 2 | 3 + n × 6 |
| pose, aura, flourish, markings | 2 + 3 + 3 + 4 |
| sigil frame, charge, division | 3 + 5 + 3 |
| pronoun | 2 |
| name, epithet, title (UTF-8, byte length first) | each 7 + 8 × bytes |
| myth override flag, then its UTF-8 | 1 (+ 10 + 8 × bytes) |
| CRC-16 | 16 |

Measured with the prototype (`calc/sharecode.mjs`): a Pyre Lord named "Vulkra the Unburnt,
Lord of Cinders" encodes to 78 characters,
`FM1-EAQAIEAbYBBkEIQJWyDRWkR2DKzq2NbkwlujQykCq3MTq5NzoemN7kyEDezECG0tzIyuTmA5EQ`; without
identity text 35 characters; with long names and a 120-character custom myth 268. A one-letter
typo fails the checksum. On import, the code is decoded, then checked by `validatePretender`
and `validateLook`; a refusal names its reason ("This code was made with a newer version",
"Pyre Lord is not offered to Thornwood", "The design costs 405 of 400 points"). A
`#god=FM1-…` link that opens New Game with the god is M1-should.

### B.10 Art budget

How parts compose (docs/09 part system, battle design S4.4 `PartSet` seam):
- Each **rig** has an anchor skeleton (named points: `head`, `crown`, `back`, `handMain`,
  `tail`, `base`). Parts are authored in their anchor's local frame, so docs/09's procedural
  tweens animate every variant for free.
- The battle design's `PartId` list gains `horns`, `back`, `face` and `base`. Cosmetic variants
  are alternative textures for a `PartId`: `PartSet.build(unit, look, palette, god?)` takes the
  pretender's look and picks each slot's variant; a missing variant falls back to variant 0,
  then to the procedural part (the battle design's fallback chain).
- Tint zones keep `currentColor`: the banner in battle, the dominant pip color on the card. The
  accent channel fills a second mask (`data-zone="accent"`), the material a third.

**What M1 must ship as SVG** (Phase 11):

| Group | Files | Notes |
|---|---|---|
| Chassis bodies: 18 chassis on 9 rigs (biped god, wyrm, behemoth, avian, spirit, slab, tree, plus the bear pelt and flame forms) | about 90 parts | shared biped skeleton parts are reused; each chassis adds 3 to 6 parts of its own |
| Headgear family | 8 | cowl, circlet, mask, great helm, horned crown, crown of points, flame crown, antler crown |
| Mantle family | 6 | long cape, tattered, banner cape, ember mantle, leaf mantle, wolf pelt |
| Weapon finishes | 10 | 2 extra each for blade, polearm, maul, staff, fists |
| Horns | 5 | swept, crown of spines, frill, ram, antlers |
| Wings and tails | 8 | membranes 2, plumage 2, wyrm tails 2, phoenix tails 2 |
| Backs | 3 | moss, spines, crystals (Primordial and Elder Wyrm) |
| Chassis-specific variants | 27 | idol shapes, capstones, faces, bases, canopies, Colossus heads and shoulders, Phoenix crests, spirit and flame forms, pelts |
| Sigils | 22 | 6 frames, 16 charges, monoline in the docs/09 icon style |
| Awakening overlays | 2 | sleep veil, runic chains |
| **Total** | **about 180 small SVG files** | of which about 90 are cosmetic |

**Procedural (code, no SVG files):** markings (8), glyph scripts (3), aura shapes (4),
flourishes (4), banner divisions (6), sliders (5), poses (3), the blossom, heart and tongue
variants, the pip-driven glow, and every effect texture (C.1). Until Phase 11 the designer and
the replay draw the battle design's procedural placeholder parts, so Phase 9 does not wait for
art.

**Cut line** if Phase 11 runs long: drop to 2 variants on weapon finishes and horns (−8), drop
the two *should* chassis (about −10 parts and −4 variants), then drop slot 3 on chassis whose
slot 4 is procedural. Never cut a chassis below 4 slots × 3 variants (AoW4's thin-ruler lesson),
and never cut procedural items, which cost code, not art.

### B.11 Tests

- `tests/content/looks.test.ts`: every chassis has a `ChassisLookDef` with at least 4 slots ×
  3 variants; every variant resolves to a manifest entry or a listed procedural fallback;
  every preset has a valid look; swatch rules 2 to 4 (B.4); sliders at ±2 stay inside the
  portrait frame; code tables are append-only (snapshot).
- `tests/present/looks/validate.test.ts`: `validateLook` refuses unknown slots, another
  chassis's variants, out-of-range sliders and an overlong myth.
- `tests/present/looks/share.test.ts`: 1,000 random gods round-trip exactly; a flipped
  character fails the checksum; a newer version is refused with its message; an over-budget or
  foreign-realm design is refused with the validator's message.
- `tests/present/looks/random.test.ts`: `rollGod` over 1,000 seeds always validates and leaves
  under 20 points; the same seed gives the same god; locks hold.
- `tests/sim/purity.test.ts`: the sim, mapgen and AI never import `src/content/looks`.
- `tests/sim/determinism.test.ts`: two looks, equal hashes; two names, equal outcomes.
- UI smoke (cheap): compose every chassis with every variant into an SVG string without
  throwing.

---

## C. Flashy magic

### C.1 The grammar

**Look = template(primitive) × verb and shapes(color) × material(element) × tier(level,
breadth) + flourish(the god, cosmetic).** The template fixes the beats and the primary shape;
the color fixes motion, shapes, light model, palette and symbol; the element fixes the impact
material and the decal; the tier fixes duration, particle and screen budgets; the flourish
decorates the god's charge and never changes timing or tier. A spell or ability without a
storyboard still gets a correct look on day one, which covers every M2 spell before it is
storyboarded (research-vfx 3.1).

Why: Total War names its spell types by shape (missile, wind, breath, vortex, augment, hex)
([alcasthq](https://alcasthq.com/warhammer-lore-of-fire-magic-type)), and a spell that looks
like a vortex but is direct damage misleads players
([guide](https://steamcommunity.com/app/364360/discussions/0/351660338685393106)); Riot's rule is
"visual impact should represent gameplay impact"
([VFX style guide](https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/));
AoW4 players noticed animations that were the same "with a different color palette"
([forum](https://steamcommunity.com/app/1669000/discussions/0/3828666283438110304/)). So each
color gets its own motion, not only its own tint, and each primitive its own shape.

**Colors** (palettes from docs/09; verbs from docs/09's animation section; M2 colors defined
now so their spells look right when they arrive).

| | W Radiance | U Tide | B Umbra | R Ember | G Loam |
|---|---|---|---|---|---|
| Primary verb | radiate (straight lines from a center) | ripple (rings) | sink (down, drips, falling smoke) | rise and flicker | spread along the ground |
| Secondary verbs | descend, ring | refract, freeze, arc | drain toward the caster, wither | burst, jitter, shimmer | grow with overshoot, branch, erupt from below |
| Shapes | rays, perfect circles, rosettes, four-point sparkles | concentric rings, sine waves, hex shards, mist sheets | drips, tendrils, inward spirals, cracks | jagged flames, sparks, embers, smoke columns | curves, roots, vines, leaves, petals, spores, bark |
| Light model | emissive, additive; warm white body, gold rim | emissive, additive; displacement at tier 2+ | absorptive: multiply blots, desaturation, violet rim (`#C9A6EA` derived for dark ground) | strongly emissive, additive; orange-gold core, char smoke | matter, normal blend; only heals glow |
| Body / dark / light steps | `#F3E6B8` / `#D9B85C` / `#FFFFFF` (tier 3 only) | `#3A7BD5` / `#1E3F7A` / `#9ED8FF` | `#3D2B4F` / `#1A1024` / `#9B4DCA` | `#FD6533` / `#7A1E12` / `#FFB347` | `#00674B` / `#244F22` / `#A6D96A` |
| Decal | gilded ring fading over 2 s | rime, wet sheen | rot stain | scorch, cinders, craters | grass tufts, flowers, root scars, leaf litter |
| Signature moment | the sun column | the ripple lens | the drain | the burst | the eruption from a ground crack |
| Cue without hue | ray geometry and the sun-disc glyph | rings and the wave glyph | downward motion, grey-out, the skull-drop glyph | upward sparks and the flame glyph | ground-hugging motion and the leaf glyph |
| Sound family (battle design) | `spell.W.*`: shimmer, bell, choir | `spell.U.*`: swirl, splash, ice | `spell.B.*`: sub drone, whisper, hiss | `spell.R.*`: crackle, roar, fwoomp | `spell.G.*`: rustle, creak, crack, bloom |

Every primary shape carries a 1 to 2 px keyline by docs/09's `keylineFor(ground)`: with it,
contrast is at least 4.53:1 on every terrain fill, the parchment and the dark UI, while
several palette steps alone fall below 3:1 (computed in research-vfx 2.5). Holy (the priests'
Bless, the prophet) uses the Radiance palette with light from above and the bell.

**Elements** (impact material; the sim's elements have no rules effect in M1).

| Element | Owner | Impact | Kill | Decal | Map form |
|---|---|---|---|---|---|
| fire | R | ember sparks, orange flash, smoke wisp | blackens and burns out | scorch ring; crater for meteors | ash and embers fall over the polygon, then a scorch texture |
| nature | G | splinters, leaves, thorn spikes | impaled on thorns | thorns 2 s, leaf litter | brambles sweep across the polygon |
| cold | U (M2) | ice shards | freezes, then shatters | rime | sleet, then a frost rim on the borders |
| holy | W (M2) | white flare, straight rays | burns white from within | ash outline | rays sweep across from above |
| decay | B (M2) | green-black ooze | withers and sinks | dark stain | a stain creeps out from the center |
| physical | — | sparks or blood by material and blood type (battle design S2.9) | by death style | as the battle design | dust |

**Templates by primitive** (battle; the first effect of a spell or ability picks the template,
later effects add their marks).

| Primitive | Template | Primary shape | The truth it shows |
|---|---|---|---|
| `damage` single | bolt | a straight or lobbed projectile with a trail | one troop; armor piercing: a spark exits behind the target; zero damage: grey "0" and a fizzle |
| `damage` squad | engulf | a ring under the block, the material wrapping every sprite | every troop of the group |
| `damage` area(n) | burst (n < 10) or rain (n ≥ 10) | a footprint ellipse around the struck sprites | exactly the n troops the sim chose |
| `buff` | aura | material flows from the caster to the targets; a per-stat mark (battle design S2.10) | exactly the buffed groups; the duration as a chip |
| `debuff` | curse | material clings to the targets | dissolves at `expire` |
| `heal` | restore | rising motes and "+n" on wounded sprites; cleansed curses turn into the healer's material | only the healed groups |
| `summon` | arrival | a portal by color, then the block forms | the summon's count and row |
| `fatigueDrain` | siphon | threads from the drained caster to the spell's caster | the enemy caster(s) drained |
| `moraleShock` | terror | a shock ring; targets cower | the check that follows |
| `fieldEffect` | field | storm, fog, or a wall in the caster's color | one of each kind at a time |
| breath weapon | breath | a cone (Total War's breath shape) | the volley's targets |

**Tiers.** Tier by level: levels 1 to 2 are tier 1, 3 to 4 tier 2, 5 to 6 tier 3; plus one for
an area of 5 or more, all friendly or all enemy groups, or a field effect; at most 3.
Abilities count as level 1, so Fear (all enemy) is tier 2; a storyboard may raise an ability to
tier 2 (the battle-start summons, Rising Briars), never to 3. Divine is reserved for the god's
own moments. The M1 spells: Ember Dart 1, Thorn Spray 1, Bark
Skin 1, Bless 1; Fireball 2, Warcry 2, Blood Fury 2, Entangle 2, Swarm 2; Pyre Storm 3,
Regrowth 3. **Budgets follow the battle design where it speaks** (decision P7, P8):

| | Tier 1 | Tier 2 | Tier 3 | Divine |
|---|---|---|---|---|
| Full form duration (short form) | ≤ 1.3 s (0.8) | ≤ 2.0 s (1.4) | ≤ 3.2 s (2.2) | ≤ 4.0 s, no short form |
| Particles at High (Medium ×0.5, Low ×0.2, reduced motion ×0.3) | ≤ 80 | ≤ 160 | ≤ 300 per burst, ≤ 500 at once | ≤ 600 |
| Full-scene flash | only if level ≥ 3 (0.15 at release, Full) | same | same | ≤ 0.35, through the limiter |
| Shake (trauma) | ≤ 0.05 | ≤ 0.30 | ≤ 0.70 in total | ≤ 0.60 |
| Filters (full-view passes: ≤ 2 High, ≤ 1 Medium, 0 Low) | none | shockwave on explosions, High only | shockwave, heat shimmer, world grade | grade, desaturation |
| Camera | none | none | push ≤ 1.12 | push 1.25, slow motion 0.2x |

Flashes and tints are never a saturated red (R/(R+G+B) < 0.8; every docs/09 palette step passes,
computed in research-vfx 2.6; WCAG's red-flash rule:
[W3C](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)).

### C.2 Fitting the battle cue and timeline model

The battle design builds one timeline of cues in story milliseconds (S2.11). This draft adds
no cue kinds; it adds content and one stored event.

- **`SpellLookDef`** in `src/content/presentation/looks/spells.ts`, keyed by spell id **and by
  ability id**: template, tier, particle presets per beat, decal kinds, sound recipe ids, and an
  optional storyboard override. `spellLookFor(id)` derives a default from the effects when no
  entry exists (battle design S2.2 fallbacks).
- **Cues used**: `spellBeat` (charge, release, travel, impact, linger; form full, short or
  brief), `burst` (preset, count, seed), `flash`, `camera` (trauma, zoom, dim, desaturate),
  `floater`, `chip`, `aura` and `auraEnd`, `material`, `spawn`, decals, and `slows` and `holds`.
- **Abilities** arrive as the new stored event `ability` (N1). The script builder treats it as a
  `cast` with no fatigue and no mana bead; the detail sink (battle design S1.4) emits
  `spellHit` for ability damage as it does for casts. Repeated `eachRound` abilities use the
  `brief` form (0.4 s) after their first full play, and count as casts in the pacing chain
  (battle design S2.7: a phase's casts beyond 5 s drop to 0.3 s).
- **Persistent marks** (blessing rings, the god's aura, Avatar, Iron Will) are `aura` cues at
  the intro, folded into keyframes, so seeking stays exact.
- **New particle presets** (`content/presentation/particles.ts`): `ember.gather`,
  `ember.vortex`, `ember.lick`, `loam.motes`, `loam.leaves`, `loam.petals`, `loam.dirt`,
  `hornet.boil`, `radiance.motes`, `umbra.ripple` (multiply), `pip.motes.<color>` (five).

### C.3 The eleven M1 battle spells

Durations and trauma equal the battle design's S2.10; this section adds the layer, sound and
reduced-motion detail. Times are story ms at 1x, full form; the short form scales the charge
by half and trims the linger. "RM" is reduced motion (battle design S2.14: no shake, camera,
hit-stop, slow motion or full-scene flash; particles ×0.3; projectiles still fly).

**Ember Dart** (R, level 1, tier 1, bolt; 900 ms, short 600)
- Beats: charge 0–350 (24 embers gather at the staff tip, flame glyph above the caster);
  release 350–400 (40 wu ring, 4 wu recoil); travel 400–600 (a flame bead, flat streak, 60 wu
  trail); impact 600–680 (two-frame white core, 16 sparks; armor piercing: a spark exits behind
  the target); linger 680–900 (6 smoke wisps).
- Particles ≤ 50. Light: additive bead and core. Screen: trauma 0.03; no flash. Decal: scorch
  dot 12 wu; a kill burns out.
- Sound: `spell.R.charge` from its offset, `spell.R.release` −3 dB, `dart.flame.fly`,
  `hit.burn`; a kill adds `elem.fire.ignite` and a burning cry.
- RM: the bead flies without trail flicker; sparks ×0.3.

**Fireball** (R, level 2, area 5, tier 2, burst; 1900 ms, short 1300)
- Beats: charge 0–700 (an orb grows from 4 to 14 wu at the staff; 60 embers spiral in;
  footprint ellipses under the 5 struck troops for the last 250 ms); release 700–760 (60 wu ring,
  6 wu recoil); travel 760–1310 (a lob with a 120 wu apex, 90 wu rope trail, 20 trailing sparks);
  impact 1310–1450 (white core 2 frames; 140 wu ground ring; 40 embers, 30 sparks, 20 smoke);
  linger 1450–1900 (embers rise 1.5 s; smoke 2 s under the next cues).
- Particles ≤ 150. Distortion: shockwave radius 140 wu (High only; otherwise an expanding ground
  ellipse sprite). Heat shimmer over the scorch for 1.5 s (High only). Screen: trauma 0.30; no
  full-scene flash (level 2). Decal: scorch 120 wu. Kills are thrown and burn out.
- Sound: `spell.R.charge` (0.7 s), `spell.R.release`, `spell.R.travel` for the lob,
  `spell.R.burst` at the center with its duck, `hit.burn` per sprite, cries, `spell.R.linger` for
  2 s.
- RM: no shockwave (ellipse), no shimmer, no shake; the orb still lobs.

**Warcry** (R, level 2, all friendly, tier 2, aura; 1300 ms)
- Beats: charge 0–300 (the caster swells ×1.04; a carried-mana bead with the flame glyph leaves
  its mana chip); release 300–360 (red-orange ripple ring); travel 360–960 (a ground band crosses
  its own side; each squad's weapons rise and banners flare as it passes); impact: "+2 MOR"
  chips staggered with the band; linger 960–1300 (40 ember flecks rise from banners).
- Particles ≤ 60. Mark: banner glow (morale buff) for the battle. No trauma, no flash.
- Sound: the caster's `vox.shout`, `chant.<nation>` (level by troops), `drum.<nation>`,
  `spell.R.buff` −8 dB.
- RM: the band fades in over 200 ms without sweeping; chips unchanged.

**Blood Fury** (R, level 3, one squad, tier 2, aura; 1400 ms)
- Beats: charge 0–400 (three tendrils, rope, flow from the caster to the squad); release 400–460
  (full-scene flash 0.15 in `#FFB347`); impact 460–900 (veins rise over the sprites); linger
  900–1400 (veins pulse at 1.2 Hz for the battle; chip "+2 ATT +3 STR −2 DEF", the last in the
  bad tone).
- Particles ≤ 40 (warm motes in `#FD6533` and `#7A1E12`, never saturated red).
- Sound: `heartbeat` twice as pre-roll 0.6 s before the release, `fury.swell` on the squad,
  `spell.R.buff` −6 dB.
- RM: no flash; veins static.

**Pyre Storm** (R, level 5, area 12, tier 3, rain; 3200 ms, short 2200)
- Beats: charge 0–1300 (world dims 30% by the world `ColorMatrixFilter`; a 200-particle vortex
  gathers above the target row; camera push to 1.12×; footprint ellipses under the 12 struck
  troops for the last 250 ms; carried-mana bead); release 1300–1360 (full-scene flash 0.15 in
  `#FFB347`); impacts 1600 + 90 k ms for k = 0 to 11 (each a meteor streak of 120 wu with an
  8-particle trail, then a 24-particle burst and a 30 wu crater); slow motion 0.6x over the
  first three impacts; linger 2590–3200 (burning patches, 60 rising embers; burning ground 4 s
  under the next cues).
- Particles: ≤ 500 at once. Distortion: shockwave on the first and last meteor (High); heat
  shimmer over the burning ground (High). Screen: trauma 0.12 per meteor, 0.70 in total.
- Sound: `spell.R.charge` (1.3 s) with `charge.rumble` −6 dB under it, `spell.R.release`,
  `meteor.whistle` 0.25 s before each impact, `explosion.small` at each impact (at most 6 at
  once), `spell.R.linger` at two points.
- RM: a static vignette replaces the dim ramp; no camera, slow motion, flash or shake; meteors
  still fall, without trails.

**Thorn Spray** (G, level 1, area 3, tier 1, burst; 1200 ms, short 800)
- Beats: charge 0–350 (green motes spread from the caster's feet along the ground; leaf glyph);
  release 350–400 (ground ring); travel 400–700 (a crack runs along the ground to the target
  row: a rope with a crack texture on the ground plane); impact 700–850 (thorn spikes erupt
  under the 3 struck troops, growing with overshoot; 12 splinters and leaves each); linger
  850–1200.
- Particles ≤ 60. Normal blend (matter). Screen: trauma 0.03. Decals: thorns stay 2 s, leaf
  litter. Kills are impaled.
- Sound: `spell.G.charge` (0.35 s), `spell.G.travel` for the crack, `thorns.erupt` under each
  struck sprite, flesh layers.
- RM: the crack fades in without running; spikes appear without overshoot.

**Bark Skin** (G, level 2, one squad, tier 1, aura; 1200 ms)
- Beats: charge 0–300 (a 16-leaf spiral at the caster); release 300–340; travel 340–500 (leaves
  drift along the ground to the squad); impact 500–1100 (bark creeps up the sprites by a mask
  wipe from the feet); linger 1100–1200 (chip "+3 PROT").
- Particles ≤ 40. Mark: plating overlay in bark; the squad's material becomes bark, so
  deflections now throw wood chips (battle design S2.2).
- Sound: `spell.G.charge` short, `bark.grow`; deflections on the squad play `arm.bark`.
- RM: bark fades in over 200 ms.

**Entangle** (G, level 3, one enemy squad, tier 2, curse; 1400 ms)
- Beats: charge 0–450 (earth cracks spread from the caster); release 450–510 (full-scene flash
  0.15 in `#A6D96A`); travel 510–800 (a crack runs to the target block); impact 800–1100 (roots
  burst and coil up the sprites, rope vines; chip "−3 DEF −1 ATT" with a 5-round countdown);
  linger 1100–1400 (stance `entangled`: lunges halved).
- At `expire`: the vines brown and fall in 600 ms (`auraEnd`).
- Particles ≤ 40 (dirt, leaves). Decal: root scars.
- Sound: `spell.G.charge`, `roots.burst`, two or three `vox.effort` from the struggling block;
  at `expire`, `expire.soft` and a short `spell.G.curse` tail −10 dB.
- RM: no flash; vines static; the wither is a fade.

**Swarm** (G, level 4, summon, tier 2, arrival; 1800 ms)
- Beats: charge 0–600 (buzzing swells; ground hum; carried-mana bead); release 600–700 (ground
  split, a 60 wu crack decal, earth ring; full-scene flash 0.15 in `#A6D96A`); impact 700–1500
  (200 hornet dots boil out of the crack on closed-form swirls and coalesce into the block, 12
  dots per sprite); linger 1500–1800 (badge "20").
- Effect particles ≤ 40 (dirt). The 200 boiling dots are the swarm rig's own dots (battle design
  S4.4: 12 per sprite), not effect particles. Trauma 0.10.
- Sound: `spell.G.charge`, `swarm.erupt`, then the `buzz.swarm` loop bound to the squad.
- RM: no flash; the dots fade in at their places over 300 ms.

**Regrowth** (G, level 5, all friendly squads, tier 3, restore; 2000 ms)
- Beats: charge 0–800 (soil light wells up under the caster; 60 green-gold motes rise slowly; the
  world brightens 8% by the world grade; carried-mana bead); release 800–860 (full-scene flash
  0.15 in `#A6D96A`); travel 860–1660 (a green band crosses its side; flowers sprout as it
  passes); impact as the band reaches each squad ("+n" floaters; curses dissolve into petals, 20
  per cleansed squad); linger 1660–2000 (petals drift).
- Particles ≤ 300 (motes, petals). Decal: flowers. Heal light: the only glowing Loam effect.
- Sound: `spell.G.charge` (0.8 s), `spell.G.heal` as the band passes, `regen.tick` per healed
  squad (at most 4).
- RM: no brightening ramp (a static tint), no flash; the band fades in; flowers appear.

**Bless** (holy, priests, tier 1, aura; 1000 ms, short 600)
- Beats: charge 0–300 (a sun disc over the priest); release 300–340 (bell); travel 340–540 (a
  column of gold light descends on the squad: additive trapezoid quads with a vertical gradient);
  impact 540–700 (a gold halo ring on the ground); linger 700–1000 (chip "+1 MOR"; banner glow
  mark).
- Particles ≤ 30. Decal: a gilded ring fading over 2 s.
- Sound: `bless.chime` (full form the first time a priest blesses in a battle, then the bell
  alone).
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

- **One optional sim addition** (research-vfx 3.8, adopted, Phase 8): `Message.fx?: { kind:
  'ritual' | 'awaken' | 'reform' | 'anoint' | 'summon'; spell?: string }`, set by rituals, the
  pretender's arrival and return, `makeProphet` and the monthly summon; and when a ritual
  completes on a province owned by another nation and it has `remoteDamage`, `provincePop` < 0,
  `provinceUnrest` > 0 or `provinceSupply` < 0, a `ritual` message to that owner ("Ash Rain
  struck Ember Ford."). Deterministic; no outcome changes; the state hash changes, so the
  determinism fixtures are regenerated in that commit, and the rule is recorded in docs/02.
- **Time**: map effects play in real time, independent of game speed. At speeds 3 and 4 they
  use a brief form (40% of the duration, no card). More than 4 at once: the rest show only their
  persistent mark. While paused, they play.
- **Vision**: the caster's nation sees its own; a rival sees an effect only in provinces it can
  see (`visionOf`), and never a target or a name before the ritual lands. Victims see hostile
  rituals through the new message.
- **Channeling**: a rotating ground sigil under the caster's marker (the mana symbol at the
  center, the god's sigil three times on the rim) and a progress ring `1 − daysLeft/castDays`.
  For a targeted ritual, a stream (rope with a scrolling dash texture) runs along the path to
  the target for the caster's nation only. Rivals who see the caster see the sigil only.
- **Fizzle**: the sigil cracks and fades in a grey puff (0.8 s).

| Ritual | Template, tier | Full form | What plays | What stays while it lasts | RM |
|---|---|---|---|---|---|
| Call Fire Sprites (R1) | portal, 1 | 1.6 s | a ring of fire on the ground (60 embers); five sprites flare out and settle into the army badge, whose count ticks +5 | — | the ring fades in; the badge ticks |
| Forge of Cinders (R2) | wash, 1 | 1.8 s | ember light blooms at the fort icon; 30 anvil sparks; a warm wash at 0.15 alpha over the polygon | ember glyph on the fort with a months ring (6) | static bloom |
| Burn the Fields (R3) | blight, 2 | 2.4 s | a jagged flame front, masked to the polygon, sweeps in from the caster's side; three smoke columns; floaters "−6% pop", "−50% supply", "+15 unrest" | a charred-field hatch overlay for 3 months, and a badge | the overlay appears in 0.3 s; floaters |
| Bind Salamander (R4) | portal, 2 | 2.4 s | a fire fissure opens; the salamander's marker crawls out; a name card | — (its marker) | fade-in and card |
| Ash Rain (R6) | rainOver, 3 | 3.0 s | the polygon dims 30%; 300 ash flakes and embers fall inside it; each army marker there flashes one white frame and floats "−N troops"; "+25 unrest" | an ash-grey tint fading over 30 days (presentation only), and a badge | no fall; the tint and floaters appear |
| Call of the Wild (G1) | portal, 1 | 1.6 s | the ground splits in a leaf burst (40); wolf silhouettes bound into the badge, +6 | — | fade-in |
| Fertile Season (G2) | wash, 1 | 1.8 s | sprouts spread from the center to the borders; the fill brightens 8% | a faint green sheen and a leaf badge with a months ring (6) | sheen appears in 0.3 s |
| Awaken Treant (G3) | portal, 2 | 2.4 s | roots heave; a sapling shoots up and becomes the Treant's marker; a name card | — | fade-in and card |
| Bounty of the Loam (G4) | wash, 1 | 1.8 s | a golden wheat shimmer ripples across the polygon; the materials glyph pulses | a wheat badge with a months ring (6) | static shimmer |
| Rootwall (G5) | stitch, 2 | 2.0 s | thorn vines grow clockwise along the inner border | the thorn border at 0.35 alpha and a shield badge (12 months) | the border appears |

The ritual panel's target hover (UI spec 3.5) previews the template at 30% intensity on the
hovered province (research-vfx 3.11).

**Budgets on the map**: at most 1 ms CPU and 1.5 ms GPU per frame for effects; particles per
cue ≤ 80, 150 or 300 by tier; one stencil mask per wash; persistent marks are static textures;
the map ticker stops while the replay modal is open (battle design S6.1).

### C.5 The pretender and the prophet

**Mechanics that show** (automatic; no look can remove them).

| Mechanic | Mark | Where |
|---|---|---|
| Pips | aura motes split by pip count, each moving in its color's verb (a R4 G2 god shows rising embers and ground-hugging motes 2 : 1); the mana-symbol row | card, preview, battle, map marker |
| A blessing color (any chosen effect of it) | a thin ground ring with that color's symbol at its front, on every blessed unit (sacreds, the prophet, the god with Avatar) | battle (from the intro), card |
| An incarnate blessing | a small crown notch on its ring; while the god is away the ring is drawn dashed (inactive) | battle, card |
| 6 pips in a color | its symbols orbit the god | card, preview, battle |
| Dominion | candle count; aura radius | card, map |
| Awakening | dormant: closed eyes, slow breath, dim aura; imprisoned: runic chains | card, preview |
| Body tags | wings, roots, flicker, embers, regeneration motes, thorns | everywhere |
| Iron Will | the god's banner never droops; "FEARLESS" in its dock | battle |

**Abilities in battle** (N1 events; cue lists in the battle design's vocabulary).

| Ability | Tier, form | What plays | Sound | RM |
|---|---|---|---|---|
| Fear (Primordial, battle start) | 2, 1.2 s | the god rears; a dark multiply ripple rolls across the enemy side (ground band 0.6 s); enemy banners droop (morale debuff mark); "−2 MOR" chips; 40 dust motes; trauma 0.15 | `roar.primordial` (new), `shock.morale`, `crowd.murmur` on the enemy side | a 200 ms darkening; chips |
| Heat Aura (Living Flame, each round) | 1; 0.9 s first, then brief 0.4 s | a heat haze band over the enemy front (High: local displacement; else an additive orange haze); 6 ember licks on the struck troops; burn floaters; kills burn out | `aura.heat.tick` (new), `elem.fire.sizzle` per struck (at most 3) | static haze, licks |
| Rising Briars (Briar King, battle start) | 2, 1.0 s | Entangle's storyboard in its brief form | `roots.burst` | as Entangle |
| Kindle the Host (Pyre Lord, battle start) | 2, 1.2 s | the glaive sweeps an arc of fire (rope arc); six sprites ignite along it (`spawn` style `ember`) and form their block | `summon.sprites.ignite` (new), then the sprites' flicker loop | sprites fade in along the arc |
| Call the Hunt (Horned Hunter, battle start) | 2, 1.4 s | the god raises a horn; eight wolves bound in from its flank edge with dust (`spawn` style `step`) | `horn.hunt` (new), two `wolf.howl` | wolves fade in at the block |
| Fire shield, thorn shield | — (per phase) | sparks or splinters jump to each striker that dealt damage; "−n" | `fire.shield`; thorns: `thorns.erupt` −10 dB | unchanged |
| Regeneration | — (end of round) | green motes and "+n" | `regen.tick` −20 dB | motes ×0.3 |

**Cosmetic, the god's own** (look only; inert).
- **Idle aura**: the chosen shape, colored by pips, alpha ≤ 0.35 above units (research-vfx
  2.4), counted in the battle design's aura pool (64).
- **First-cast flourish**: on the god's first cast of each battle, inside the charge beat only:
  sigil wheel (its sigil turns on the ground), mantle (a cloak of the dominant color's material:
  embers, leaves, light, mist or smoke), halo burst (a ring of symbols snaps outward at release),
  or ascension (the god lifts 6 wu and settles). At most 60 extra particles, within the tier.
  The god's Ember Dart is still tier 1 (Riot's hierarchy rule).

**Divine moments.**
- **Awakening** (a dormant god on day 330, an imprisoned one on day 1050; docs/05): at the
  capital, 2.5 s for its owner (divine), 1.2 s tier 2 for rivals who see the capital. Ember: the
  ground cracks in a ring and a fire geyser rises, embers rain. Loam: the ground splits, roots
  heave, a crown of leaves bursts. M2: Radiance a sun column, Tide a waterspout, Umbra shadows
  pooling and something rising. An imprisoned god's runic chains shatter first (0.5 s). Then the
  marker appears with a name card (sigil, name, epithet, title). An edge pointer pulses if the
  capital is off-screen; the map camera never moves by itself. RM: a fade and the card.
- **Undying** (N8): where it dies, its ashes stream along the path to the capital (1.5 s,
  tier 2); on its return day a pyre (or the color's verb) ignites at the capital and the god
  rises (2.0 s, tier 2) with "Vulkra rises again". In the battle replay, the god's death plays
  the battle design's god death, the body bursting into flame, and the card adds "…and will
  rise again" when the state shows a return day.
- **The god falls** (battle design S2.8): slow motion 0.2x for 2.0 s, the field desaturated,
  "THE GOD FALLS", trauma 0.6; the body dissolves into its dominant color. Per chassis, beyond
  the six the battle design lists: the Ascended Hero falls with its blade upright; the
  Primordial topples and the ground shakes three times; the Phoenix bursts into flame; the
  Pyre Lord's glaive gutters out; the Cinder Idol's braziers die and it crumbles; the
  Hierophant's mask cracks; the Living Flame gutters to smoke; the World Tree splits and
  topples; the Horned Hunter's antlers fall; the Elder Wyrm sinks; the Mother of Beasts' wolves
  howl; the Briar King's thorns wither.
- **The bless unlock** (designer): when a color reaches 4 pips the ring forms with its symbol
  (0.9 s, `bless.chime`); at 6 its symbols start to orbit; an incarnate pick adds the crown
  notch; a boon pick plays a small sign (Avatar: the god's ring lights; Undying: an ember
  stream; Iron Will: its banner snaps taut).

**The prophet.**
- **Anointing** (map, tier 2, 1.8 s, `Message.fx` 'anoint'): a beam in the god's dominant color
  runs from the capital to the prophet's province, and a halo settles on its marker; the badge
  keeps a small halo glyph.
- **In battle**: a holy halo of soft rays (Radiance palette, alpha 0.3) over the prophet, the
  nation's blessing rings (it is blessed), and its Bless casts use the Bless storyboard. Its
  death is a commander death with "The prophet has fallen" and the halo shattering.
- **Dominion**: on the monthly spread, provinces whose strength rose kindle a candle (0.4 s),
  at most 8 visible per month, the rest instant; a province whose dominating nation changed
  gets the flip pulse (a ring from the center).
- **Monthly summons** (N7): a small portal at the pretender's province, tier 1, 0.8 s.

### C.6 Sound hooks

- **Battle** (M1, the battle design's S3b families): every cue above names a recipe from the
  sound proposal's tables, plus four new recipes, in its notation:

  | Id | Bus | kHz | Length | Variants | Recipe |
  |---|---|---|---|---|---|
  | `aura.heat.tick` | spell | 32 | 0.5 s | 3 | low roar P > LP 400>900, AM 6 Hz + crackle G(150/s) @-6; plays −10 dB under impacts |
  | `summon.sprites.ignite` | spell | 32 | 1.2 s | 2 | six ignitions (P burst > BP 800>3000, 30 ms each, 120 ms apart) + `spell.R.release` @-6 |
  | `horn.hunt` | stinger | 32 | 1.8 s | 2 | brass model D3 gliding to A3, breathy, no drive |
  | `roar.primordial` | voice | 24 | 1.6 s | 2 | V(f0 [55,70], u>o>a, tract 1.6, drive 4, subharmonic 0.5) + B rumble @-6 |

- **Designer** (M1-should): Cast, Showcase and the bless unlock play the baked battle recipes on
  the battle SFX bus; no new recipes.
- **Map** (M2, decision P10): ids reserved, `map.ritual.<color>.<template>`,
  `map.awaken.<color>`, `map.anoint`, `map.reform`; ducked under music, silent at speeds 3 and 4.
- **Captions**: every divine moment and ability with a sound has a caption (battle design
  accessibility).

### C.7 Tests

Pure (Vitest):
1. `spellLookFor` returns a look for every spell and every ability in content; the computed tier
   matches C.1's table.
2. Each M1 spell's built timeline: beats sorted and within the C.3 durations (full and short);
   particle counts within the tier; a full-scene flash only when the level is 3 or more; trauma
   within the tier cap; filter cues only on tier-2 explosions and tier 3.
3. Abilities: Fear yields one chip per enemy group and no second; the heat aura's later rounds
   use the brief form; battle-start summons spawn exactly the event's count.
4. Reduced motion: no camera, shake, slow-motion or full-scene flash cues; impacts keep their
   times (the battle design's invariant).
5. `planMapFx`: deterministic; nothing for a rival's ritual outside vision; a cue for a hostile
   ritual on the viewer's province; at most 4 at once; the brief form at speeds 3 and 4.
6. Red-flash rule over every flash and tint color in presentation content.
7. Cosmetic inertness: two looks give identical cue times and strike sets; only flourish and
   aura art differ.
8. Truth: impacts on the sim's targets; a mana bead cue for spells with carried mana; a fizzle
   for zero damage.

Playwright (battle lab, battle design S5): a fixture per new ability (`primordialFear`,
`livingFlameHeat`, `pyreLordKindle`, `hunterCall`, `briarKing`) renders non-blank at its impact;
the Pyre Storm fixture stays within the particle cap and filter-pass budget at High.

---

## D. The designer UI

The UI spec (part 3, section 3.3) gives the Pretender Design screen three columns (chassis,
pips with dominion and scales, live summary card), steppers that print their prices, inline
validation through one `checkPretender`, one-click presets, visible Save and Load buttons, and
an inline confirm for unspent points. This section keeps all of that and makes room for 12
chassis per nation, blessings, boons, appearance and identity without clutter.

### D.1 Layout

```
1920 x 1080
+--------------------------------------------------------------------------------------------------------------+
| Cinder Horde · Design your god     [Presets v] [Random god] [<] [>]  [My Gods v] [Share code]   Guide: [on]   |
| Budget 400 + 0 = 400  [chassis 140|pips 55|dominion 60|scales 120|boons 20|      ]  395 spent · 5 left        |
|                       Bless points 3 of 3                                                                     |
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
| [die] [lock]   |                                                                |  Ember Wrath · Iron Will    |
|  per step      |                                                                |  Arrives day 1, Kharnath    |
|                |                                                                |  "A war-god who opens every |
|                |                                                                |   battle in fire."          |
+----------------+----------------------------------------------------------------+-----------------------------+
| [Back]                     [Save] [Save as copy]                       5 points unspent   [Start game]       |
+--------------------------------------------------------------------------------------------------------------+
```

- **The rail** (220 px) lists six steps in two labeled groups, BUILD (4) and LOOK (2), which
  keeps the UI spec's "at most 4 tabs" per group. Steps are not a wizard: any step opens with
  one click or its number key. Each shows a state badge: a check mark when valid, "!" with a
  tooltip when something needs attention (unspent bless points, a removed blessing).
- **The right column** (400 px) is always visible: the live preview over the summary card, so
  every change in any step shows at once.
- **1280 × 720**: the rail collapses to 56 px (numbers and glyphs, names on hover); the right
  column is 300 px with a 240 px preview over a compact card that scrolls; the step area is
  about 920 px wide.
- **New Game** (UI spec 3.2) leads here with Next; Back returns to it with the design kept.

### D.2 The six steps

1. **Body.** A grid of chassis cards (200 × 140): the composed portrait, name, cost, base pips
   as mana symbols, base dominion candles, tier and role badges, "Recommended" on the nation's
   two, "must sleep" on the Primordial, and the new-color price. Every card also prints **"Your
   build on this body: 365 / 400"**, the current pips, dominion, scales and boons priced on that
   chassis (Dominions players needed an outside calculator to find this:
   [pretenders calculator](https://github.com/zollqir/pretenders-dom6)). Filters: role chips and
   realm chips; sort by cost or by recommended. Hover (L1): body stats, weapons, and abilities
   in words. Choosing a chassis keeps the build where it can: pips and dominion rise to its
   base, an invalid breath color or boon is dropped, unaffordable blessings are removed, and a
   toast names each change ("Flaming Weapons removed: needs R5"), with Undo.
2. **Magic.** Five pip rows with the UI spec's steppers (`[−] ●●●●○○ [+35]`, lock glyph on base
   pips, "+80 new color" priced by the chassis). Each row prints, at L0, what it buys: "Casts
   Ember Dart, Fireball (research 2), Blood Fury (research 3)", "+3 bless points". The Great
   Wyrm adds a breath color choice as mana-symbol radio buttons (only colors with pips). The
   Oracle prints its research rate.
3. **Realm.** The dominion stepper (+30) with "spreads to about N provinces by Year 2"; the five
   scale sliders with tick prices, where an attuned pole shows the chassis glyph and its price
   of 20 ("attuned"); the three awakening cards with arrival dates and refunds; cards below a
   chassis's minimum are disabled with the reason.
4. **Blessings and boons.** A bless point meter ("3 of 3") and a **Recommended** button. One row
   per color with pips; effect cards grouped by requirement (1–2, 3, 4, 5, 6), each with its
   name, cost as dots, one effect line, an incarnate crown glyph (tooltip: "Works only while
   your god is on the map: from day 330 for a dormant god") and a scale chip when it needs one.
   Unaffordable or locked cards stay visible with their condition block (UI spec rule 7).
   Below, six boon cards with cost and effect; built-in boons show "included".
5. **Appearance.** Thumbnail strips per slot with arrows (not dropdowns); hover previews live;
   each slot has a die and a lock. Then markings, the three swatch rows, sliders, pose (3), aura
   (4) and flourish (4) with a Play button.
6. **Identity.** Name, epithet and title fields, each with a die; pronoun; the myth line,
   generated, with Edit to override and Reset; the sigil (frame strip and a 16-charge grid) and
   the banner division strip, previewed on an army badge and a battle pennant.

### D.3 The preview and the card

- **Preview**: a small Pixi canvas that runs the battle renderer's own effect code (battle
  design S4), so the designer and the replay never disagree. Idle by default; **Cast** plays the
  god's flourish and a tier-1 bolt in its dominant color; **Showcase** loops idle, flourish,
  signature ability and cast; context Portrait (256), Battle (64 on a strip of terrain) or Map
  marker (badge with sigil). Backdrop: card, home terrain, night. **CVD** cycles the simulated
  protanopia, deuteranopia and tritanopia. The bless unlock (C.5) plays the moment a color
  reaches 4. Reduced motion follows the settings; Showcase is then off by default.
- **Card**: the UI spec's `PretenderCard`, extended with the name and title, the sigil, the
  chosen blessings (incarnate ones marked) and boons. It is the same component in the top bar's
  nation tooltip, the Ledger's Nation tab and the victory screen. The text of the card is the
  preview's screen-reader equivalent.

### D.4 Presets, random, My Gods, share code

- **Presets**: a gallery popover of the nation's six, each with a mini portrait, cost and
  reading; one click applies build, look and identity; a "keep my look" checkbox sits at its
  top. Undo (Ctrl+Z, UI spec 5.7) restores the previous god.
- **Random god** and **Back / Forward** (10 rolls); the seed is in the tooltip. Each step and
  slot has its own die and lock; a die on a BUILD step rerolls only that step within budget.
- **My Gods**: Load, Save (in place), Save as copy, Rename, Delete (inline confirm).
- **Share code**: a popover with the code in a read-only field and Copy, and a "Paste a code"
  field with Import; a refused code shows its reason inline. Import opens the god as unsaved.

### D.5 Where each detail lives

| Detail | Layer |
|---|---|
| Budget, points left, bless points | L0 header bars |
| Spend by category | L1 on the budget bar segments |
| Chassis cost, base pips and dominion, role, "your build on this body" | L0 on the card |
| Body stats, weapons, abilities in words | L1 card hover; L4 Codex chassis page |
| Next-step price of every stepper and slider tick | L0 |
| What a pip level unlocks (spells, research, bless points) | L0 line on the row; L1 full list |
| Scale step effects | L0 summary line; L1 tick hover |
| Blessing effect, cost, incarnate meaning | L0 card line; L1 full text and the incarnate rule; L2 terms Sacred, Incarnate, Bless point |
| Why a control or card is disabled | L1 condition block |
| How the god looks in battle and on the map | L0 preview contexts |
| Share code | L3 popover |

### D.6 Keyboard and accessibility

- `1` to `6` open the steps; `R` rolls a random god and `Shift+R` a random look (outside text
  fields); `[` and `]` walk the roll history; `C` plays Cast; `Ctrl+S` saves (an accelerator for
  the visible button); `Esc` returns to New Game. Browser-reserved keys are not used (UI spec
  5.4). Every key has a visible button.
- Every color shows its mana symbol and letter; incarnate, attuned and recommended marks are
  glyphs with words; the preview has a text equivalent; reduced motion and the flash limiter
  apply to the preview.

### D.7 Deviations from the UI spec draft

| UI spec 3.3 | This draft | Why |
|---|---|---|
| Three columns on one screen | A step rail, one step area, and the persistent preview and card | 12 chassis per nation, a blessing menu, boons, appearance and identity do not fit one screen at 1280 × 720 |
| Chassis list in the left column | Step 1, a filterable grid with "your build on this body" | the reverse search the Dominions community built outside the game |
| Save design and Load design buttons | My Gods with Save, Save as copy, Load (visible buttons kept) | AoW4's edits-that-did-not-stick and copy lessons |
| No blessings or boons | Step 4 | A.6, A.7 |
| No appearance or identity | Steps 5 and 6, share code, random | B |
| `PretenderCard` | gains name, title, sigil, blessings, boons | B.6, B.7 |

Everything else in 3.3 is kept: prices on every control, inline validation, the Start Game
unspent-points confirm, the dominion estimate, arrival dates on the awakening cards, and the
"fits" badges (now "Recommended").

---

## E. Plan

### E.1 What lands in which phase

| Phase | Deliverable | Main files | Tests |
|---|---|---|---|
| **6b.1** (now; touches neither Phase 7's AI nor the battle track's files beyond `statsFor`) | D1 realms, D2 new-color price, D3 attunement, D4 minimum awakening, D5 springs, D7 name, D8 role; the blessing menu with today's bless as its default and the stat folds; boons with their costs and effects (Sacred Spring, Avatar, Chosen Host, Deep Lore, Iron Will) | `content/pretenders/{chassis,costs,types,blessings,boons}.ts`, `content/rules.ts` (BLESS becomes the default rule), `sim/pretender.ts`, `sim/bless.ts`, `sim/battle/setup.ts`, `sim/createGame.ts` | `validate.chassis`, `validate.pretender`, `bless`, `pretender`, `createGame`; every existing preset's bless unchanged |
| **6b.2** (after the battle track's S1, which also edits `src/sim/battle`) | N1 abilities and the `ability` event, N2 multi-strike, N3 spell power, N4 retaliation element, N5 summons never drag, N6 home terrain; `CombatStats` gains `size`, `spellPower`, `abilities`, `shieldElement` | `sim/battle/{abilities,attacks,effects,morale,resolve,setup,types,events,replay}.ts`, `content/types.ts`, `content/spells/validate.ts` | per rule (A.5); S1's golden and equivalence tests updated in the same commit |
| **6b.3** | N7 monthly summon, N8 reform (`pretenderReturnDay`) and the Undying boon, D6 breath color; the 12 new chassis, their bodies and abilities; 6 new presets; `NationDef.chosenHost`; `sim:aivai --presets` and `--matrix`; `sim:duel` with pinned bands | `content/units/pretenders.ts`, `content/pretenders/presets.ts`, `sim/{tick,commanders,pretender}.ts`, `scripts/{aivai,duel}.ts` | content fixtures for every chassis (CLAUDE.md), presets within budget, reform and summon tests, duel bands, determinism |
| **7** (in progress elsewhere) | `docs/08` step 10 reads `role`; AI nations keep the default presets | `src/ai/*` | the AI behavior tests as they are |
| **8** | Map effect basics: dominion overlay and flip pulse, channeling sigil and stream, a generic completion pulse per color with its symbol, the map effect pool and budget; `Message.fx` and the victim message | `src/present/map/fx.ts`, `src/render/map/fx/*`, `sim/rituals.ts`, `sim/messages.ts` | `planMapFx` tests; regenerated determinism fixtures |
| **9** | The designer (six steps, preview on procedural parts, `PretenderCard` v2); the look, identity and nation-look model with `validateLook`; code tables and the share code; random god and look with history and locks; My Gods; the save file's presentation block; AI looks at New Game; *should*: random presets for opponents, Adjust appearance, `#god=` links | `src/ui/pretender/*`, `src/content/looks/*`, `src/present/looks/*`, `src/ui/persistence/*` | B.11; UI smoke |
| **10** (battle track S2 to S6) | `SpellLookDef` for every spell and ability; the 11 storyboards with C.3's detail; ability cues; blessing rings; the god's aura and first-cast flourish; procedural rigs for the 12 new chassis (new `avian` and `behemoth` rigs); god deaths per chassis; sound mappings and the 4 new recipes (S3b); lab fixtures | `src/content/presentation/*`, `src/present/battle/*`, `src/render/battle/*` | C.7 |
| **11** | SVG parts (B.10), sigils, overlays; final procedural markings, glyphs, auras, flourishes, divisions; map ritual templates; divine moments (awakening per color, reform, anointing); the designer's Showcase; screenshot baselines refreshed in one commit | `src/assets/sprites/**`, `src/render/**` | manifest coverage, B.11 smoke, Playwright baselines |
| **12** | The preset matrix, duel bands, blessing and boon prices, the Ember Oracle revisit; three new playtest checklist lines (below) | `docs/09-balance.md` | headless runs as A.10 |

Playtest checklist additions (`docs/09-balance.md`):
- Each new preset wins 35% to 65% against the opposing default over 20 headless games.
- Did any spell or ability look bigger or smaller than what it did?
- A new player can design, save, share and re-import a god in under three minutes.

### E.2 M1 and M2

| Item | M1 or M2 | Reason |
|---|---|---|
| 18 chassis (generic, Red, Green), realms, tier pricing, attunement, minimum awakening, springs, breath color, name, role | M1 | the owner's "good options for pretenders" for the two shipped nations; data and small rules |
| N1 to N8 | M1 (N6 *should*) | each carries M1 chassis; each is small and tested alone |
| Blessing menu: full Red and Green, minimal White, Blue, Black | M1 | today's W, U and B blesses exist in M1, so splashes must keep working |
| Six boons | M1 (Chosen Host, Deep Lore are cut line 2) | design-point options in the Dominions spirit |
| Customization model, designer, random, share code, My Gods, 4 × 3 slots, sigils | M1 | the owner's "AoW4 level", and Phase 9 builds the screen anyway |
| Flashy magic grammar, 11 storyboards, ability cues, map ritual templates, divine moments | M1 | the owner's "flashy magic"; the battle track already budgets the battle half |
| Editor sound through the battle bus | M1-should | zero new recipes; the battle design keeps menu sound out of M1 |
| White, Blue, Black chassis and full blessing menus | M2 | their nations and spells are M2, and they need M2 rules |
| Awe, ethereal, life drain bodies, shapechange, teleport, element resistances | M2 | rules only W, U and B chassis use |
| Map and menu sound | M2 | battle design scope |
| Free color picker, 6 × 5 slots, gallery, AI temperament, more presets | M2 | volume after the systems prove themselves |
| Chromatic aberration at the god's death | M2 or never | open question |

### E.3 Cut lines, in order

1. Living Flame, Briar King, and N6 (11 chassis per nation remain).
2. The Chosen Host and Deep Lore boons.
3. Weapon finishes and horns down to 2 variants.
4. Flourishes down to 2.
5. Adjust appearance, `#god=` links, random presets for opponents.

Never cut: realms and tier pricing, the blessing menu, presets with looks, the six designer
steps, random god, the share code, N1 (it carries four chassis), and the 11 storyboards.

### E.4 Doc changes (in the commits that implement them)

- `docs/05-pretender.md`: the roster and catalog (A.2, A.4), D1 to D8, N7, N8, blessings, boons,
  the 12 presets, and Implementation decisions (realms replace "The nation offers all chassis";
  reform replaces "gone for good" for the Phoenix and the Undying boon).
- `docs/02-magic.md` section 8: the blessing menu; Implementation decisions: `Message.fx` and the
  victim message.
- `docs/04-battle.md`: N1 to N6 and the `ability` event.
- `docs/03-nations.md`: `NationDef.chosenHost`.
- `docs/07-ui.md` (or the UI spec): section D.
- `docs/09-art-direction.md`: portraits composed from parts; slot families; sigils and banner
  divisions; the magic grammar (C.1) and the map templates (C.4).
- `docs/09-balance.md`: every number in A and C.
- `docs/10-milestone-1.md`: Phase 6b; acceptance criterion 9 becomes "Pretender: 18 chassis in
  three realms (at least 11 per nation), pips with per-chassis prices, dominion, five scales
  with attunement, awakening, prophet, the blessing menu, six boons, twelve presets"; a new
  criterion: "The pretender designer has six steps, a live preview, a random god with history,
  saved gods, and a share code that round-trips."
- `docs/08-ai.md`: step 10 by role.

### E.5 Open questions for the owner

1. **Realms**: restrict color chassis to nations of that color (recommended), or keep every
   chassis open to every nation?
2. **Is the god blessed in its own dominion by default** (Dominions), or only through the
   Avatar boon (recommended for M1)?
3. **Undying in M1**: it changes "a dead god is gone for good" for the Phoenix and the boon
   (recommended yes).
4. **Chromatic aberration** at the god's death (recommended no in M1).
5. **Designer sound** through the battle bus in M1 (recommended as a *should*), map sound in M2.
6. **Roster size**: 12 per nation as the target and 11 as the floor (recommended).
7. **The god's name in the sim** (recommended yes, D7).

---

## Sources

Claims about other games come from the three research notes beside this file, which were built
from search-engine extracts (web fetches were blocked in those sessions; the notes mark each
source's kind) and, for Dominions, from the manual and game data read in full. URLs:

- Dominions 6 manual (community web edition of the official manual): [ch. 3 The Pretender](https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html),
  [ch. 4 Units](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html),
  [ch. 8 Dominion](https://dmacguigan.github.io/dom6-manual/chapters/08-dominion.html).
- Dominions 6 data and tools: [dom6inspector game data](https://github.com/larzm42/dom6inspector/tree/master/gamedata),
  [Pretenders Calculator](https://github.com/zollqir/pretenders-dom6),
  [illwiki Bless (excerpt)](https://illwiki.com/dom5/dom6/bless),
  [illwiki patch notes (scorch and craters, 6.24)](https://illwiki.com/dom5/dom6/patchnotes),
  [Steam: bless points thread](https://steamcommunity.com/app/2511500/discussions/0/4132682727127343168).
- Age of Wonders 4: [wiki Form](https://aow4.paradoxwikis.com/Form),
  [wiki Ruler](https://aow4.paradoxwikis.com/Ruler),
  [Dragon Dawn](https://www.paradoxinteractive.com/games/age-of-wonders-4/add-ons/age-of-wonders-4-dragon-dawn),
  [Wyvern Update notes (Random Ruler)](https://store.steampowered.com/news/app/1669000/view/7208622092879106175),
  [Dev Diary #11 via GameBanshee](https://www.gamebanshee.com/news/127487-age-of-wonders-4-developer-diary-11-art-design.html),
  [GamePressure faction creation](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c),
  [Gideon's Gaming review](https://gideonsgaming.com/age-of-wonders-4-review/),
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
  [Riot, Clarity in League](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/),
  [Total War spell types (alcasthq)](https://alcasthq.com/warhammer-lore-of-fire-magic-type),
  [Total War misleading vortex](https://steamcommunity.com/app/364360/discussions/0/351660338685393106),
  [Heroes V review on spell length](https://www.rpg.net/reviews/archive/12/12228.phtml),
  [Hearthstone VFX](https://playhearthstone.com/en-us/blog/22552047),
  [WCAG 2.2 three flashes](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html),
  [chromatic aberration complaints](https://thegameswiki.com/crimson-desert/wiki/chromatic-aberration),
  [PixiJS ParticleContainer v8](https://pixijs.com/blog/particlecontainer-v8),
  [pixi-filters](https://raw.githubusercontent.com/pixijs/filters/main/README.md).
- MTG color pie: [MTG Wiki, Color](https://mtg.fandom.com/wiki/Color).

Repository files read: `docs/00`, `02`, `03`, `04`, `05`, `07`, `08`, `09-art-direction`,
`09-balance`, `10`, `PROGRESS.md`; `src/content/pretenders/*`, `src/content/units/*`,
`src/content/spells/*`, `src/content/types.ts`, `src/content/rules.ts`, `src/content/colors.ts`,
`src/content/independents.ts`; `src/sim/pretender.ts`, `bless.ts`, `pips.ts`, `scales.ts`,
`dominion.ts`, `tick.ts`, `createGame.ts`, `commanders.ts`, `visibility.ts`, `types.ts`,
`src/sim/battle/*`; `tests/sim/battle/fixtures.ts`.

Computed for this draft (`pretender-design/calc/`): `costs.mjs` and `check2.mjs` (design costs
under the proposed rules; they reproduce today's preset costs), `duel.ts`, `duel2.ts`,
`duel3.ts` (staged fights in the repository's resolver), `sharecode.mjs` (the share code
prototype).
