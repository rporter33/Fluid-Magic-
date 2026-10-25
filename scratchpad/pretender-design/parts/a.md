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
