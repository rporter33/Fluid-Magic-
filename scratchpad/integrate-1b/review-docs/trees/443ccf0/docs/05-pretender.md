# Pretender Design

The pretender is the player's avatar and the single most expressive decision before a
match. The screen should feel like building an MTG commander: choose a body, pour color
into it, set the five Scales that describe the world you want to rule, pick its blessings,
and give it a face and a name.

This document was rewritten on 2026-10-21 at the owner's direction: "good options for
pretenders like Dominions has is always a highlight ... A customization level matching Age of
Wonders 4 would be very ideal." The chassis roster grows from 6 to 16, blessings became a
menu, and every god gets a look and an identity that never touch the rules. The design is the
2026-10-21 pretender build spec; it lands in three steps (`docs/10-milestone-1.md`, Phase 6b):

- **Phase 6b.1 (this text)**: realms, per-chassis new-color prices, scale attunement, the
  minimum awakening, starting springs, the god's name, roles and AI power on the six chassis
  of Phase 6; the blessing menu with the fixed bless as its default; the Sacred Spring and
  Avatar boons.
- **Phase 6b.2 (this text)**: the battle rules the new bodies need (battle-start abilities,
  multi-strike weapons for trample, spell power, retaliation shields by element, bound squads;
  `docs/04-battle.md`) and the Thornhide blessing, whose nature shield needs shields by
  element.
- **Phase 6b.3 (this text)**: the ten new chassis and their bodies (Ascended Hero,
  Primordial, Ash Phoenix, Pyre Lord, Cinder Idol, Ember Hierophant, World Tree, Horned Hunter,
  Elder Wyrm, Mother of Beasts), monthly summons, the Ash Phoenix's reform after death, and six
  new presets.

The look (parts, colors, pose, aura), the rest of the identity and the nation's sigil arrive
with the designer in Phase 9.

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
that fit the nation ("fits Thornwood"). The role says what a body is for; the AI and the
screen's filters read it, never a rule.

## Step 2: Color pips

Pips cost increasingly per color:

| Pip level in a color | 1 | 2 | 3 | 4 | 5 | 6 |
|----------------------|---|---|---|---|---|---|
| Cost | 40 | 20 | 25 | 30 | 35 | 40 |

Opening a **new color** (the first pip in a color outside the nation's identity) costs the
chassis's new-color price instead of 40 (Step 1: 40 for the seers, the Oracle and the Ember
Hierophant; 50 for the idols and the Ascended Hero; 60 for the Titan, the Ash Colossus and the
three summoners; 80 for the monsters and beasts, the Great Wyrm, Primordial, Elder Wyrm, Ash
Phoenix and Wild Spirit), less the Oracle's discount. A pretender with pips in any color can
cast that color's spells and leads research in it. Pips also give bless points (Step 6). In M1,
White, Blue and Black pips buy only blessings: those colors' spells are M2.

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
toward a pole whose color **is**, and 20 toward a pole the chassis is **attuned** to (Step 1):
the Ash Phoenix to Growth, the Cinder Idol to Dread, the World Tree to Sanctity and the Horned
Hunter to Fury. Steps are bought from 0 outward, and scales never refund points. For Red, the
cheap poles are Turmoil and Fury; for Green, Growth and Wild. The UI warns when a step goes
against the nation's grain, but allows it.

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
- **Scales**: Fury Unbound needs Fury 1 and Wild Vigor Growth 1 in the design.
- **Incarnate** blessings work only while the god is on the map: not before it awakens, not
  while it is recalled or reforming, never after it dies.
- **The default**: a design that picks nothing gets each color's standard blessing at 4 or 5
  pips and its greater one at 6, which is the fixed bless of earlier versions. A design that
  picks an empty list gets none.

| Color | Blessings (requirement, cost; * incarnate) |
|-------|----------------------------------|
| R | Fervor (2, 1) mor +1; Keen Edge (2, 1) att +1; Ember Might (3, 2) str +2; **Ember Wrath** (4, 3) att +2 str +2; Cinder Skin (4, 3) fire shield 3; Blazing Charge (4, 3) +5 damage in the first melee round, mor +1; Fury Unbound* (5, 4, needs Fury 1) berserk, att +1; Flaming Weapons* (5, 4) melee +3 fire armor piercing; **Greater Ember Wrath** (6, 5) att +4 str +4; Living Pyre* (6, 5) fire shield 5, att +2 |
| G | Thick Skin (2, 1) prot +1; Vigor (2, 1) regeneration 5%; Strength of the Earth (3, 2) str +2; **Evergreen** (4, 3) regeneration 10%, prot +1; Oakhide (4, 3) prot +3; Deep Roots (4, 3) mor +3, prot +1; Wild Vigor* (5, 4, needs Growth 1) regeneration 20%, str +1; Thornhide* (5, 4) thorn shield 4 (nature), prot +1; **Greater Evergreen** (6, 5) regeneration 20%, prot +2; Ironbark* (6, 5) prot +5, str +2 |
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

Each boon is bought at most once. Iron Will, Undying, Chosen Host and Deep Lore are M2.

## Appearance and identity

Any look fits any build: the god's appearance (four part slots with three variants each,
markings, three colors, sliders, pose, aura and cast flourish), its name, epithet, title,
pronoun and myth, and the nation's sigil and banner division are chosen on the same screen,
saved with the god and shared by a code (Phase 9). None of it changes the rules, except that
the name is the pretender's name in messages and battles. Since Phase 6b.1 the name exists in
the game (`NationSetup.pretenderName`); the rest arrives with the designer. The parts, colors
and effects will be in `docs/09-art-direction.md`; the screen is in `docs/07-ui.md`.

## Prophet

Any commander may be made Prophet (one per nation, once every 24 months if the prophet dies).
The prophet gains holy 3, +1 mor, spreads dominion as a temple, and fights blessed.

## Summary card

The right third of the screen is a live card: the god's portrait tinted by color pips, its
name, the pip row as MTG-style mana symbols, dominion candles, the scales as five small
two-color bars, the chosen blessings (incarnate ones marked), each color's unspent bless
points, and the boons, the awakening date, and the AI's one-line "reading" of the build (e.g.
"A fast, fiery god. Expect early wars."). The reading is a rule-based string. From Phase 9 the
portrait is composed from the god's parts and the card shows its title and sigil.

## Presets

Each nation ships six presets so a new player can start in one click; from Phase 9 each comes
with a look and an identity:
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

The first three of each nation pick no blessings or boons, so each keeps the fixed bless and
its cost (Wildfire and Deep Root leave 2 bless points unspent); the other three each spend
their 3 Red or Green points on the blessing named. The implementer validates that each preset
costs ≤ budget; if not, adjust the preset.

## Owner decisions (2026-10-21)

The owner answered the open questions of the 2026-10-21 pretender build spec with "go with
your defaults, continue". The defaults are therefore the owner's decisions:

1. **Scope**: approved. The ten new chassis, the blessing menu and the customization system
   move into M1 (Phase 6b and the Phase 8 to 12 additions). If time is short, cut in the
   spec's order: art variants first, then the Mother of Beasts, the Cinder Idol and monthly
   summons together.
2. **Realms**: color chassis only for nations of that color; generic chassis open to all.
3. **The god is blessed in its own dominion only through the Avatar boon**, not by default
   as in Dominions.
4. **No chromatic aberration** at the god's death.
5. **Iron Will** stays out until it can be priced or redesigned fairly (M2 at the earliest).
6. **Names in M1** use Latin letters only for the name, epithet and title; the myth takes any
   script.
7. **The god's name lives in the sim** (`NationState.pretenderName`).

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
  `src/content/units/pretenders.ts`, and its realm, role, new-color price and AI power, and
  where it has them its attunement, minimum awakening, starting springs, monthly summon,
  reform and built-in Avatar. The records come in Step 1's order: generic, Red, Green. Stats
  the table leaves out take the baseline (docs/03). Leadership is as Step 1 lists it (20 where
  it lists none). Every body but the Living Monolith and the Cinder Idol carries a melee weapon
  (docs/09); those two strike unarmed with their strength. The trample of the Primordial and
  the Elder Wyrm is one weapon record, Trample 2 with 2 strikes at bodies of size 2 or less
  (`docs/04`, multi-strike weapons); the Primordial's Fear, the Pyre Lord's Kindle the Host
  and the Horned Hunter's Call the Hunt are battle-start abilities on their bodies
  (`src/content/abilities.ts`). Bodies cannot be recruited, cost no upkeep, and eat as
  commanders do. Content validation also holds: a chassis is an idol exactly when its body is
  immobile (the AI reads the role, `docs/08`); a monthly summon's count is at most its body's
  leadership; a reform takes a whole number of days, at least 1.
- **Realms** (Phase 6b.1, the owner's decision): `availableChassis(nation)` is the generic
  chassis plus those of the nation's colors, in content order; `validatePretender` refuses
  others ("Wild Spirit is not offered to Cinder Horde"). This replaces "the nation offers all
  chassis". The realm is checked right after the chassis exists, before anything else.
- **Costs**: a color is new when it is not in the nation's color identity; its first pip costs
  the chassis's new-color price less the Oracle's discount (the Oracle pays 30, where Phase 6
  charged it 50; no preset buys a new color, so no preset's cost moved). Content validation
  keeps every new-color price above the chassis's discount. Base pips are free and a design
  may not go below them; dominion below the chassis's base is refused. Scale steps are paid
  one by one from 0; a step toward an attuned pole costs 20, with no refund and the same ±3
  limits. Boons add their cost. `validatePretender` (`src/sim/pretender.ts`) is the only place
  these rules live: `createGame` refuses an invalid design, and the presets are tested against
  it. Its checks run in this order, first problem only: chassis, realm, awakening, minimum
  awakening, pips, base pips, dominion, scales, blessings, boons, budget.
- **Awakening**: an awake pretender stands in its capital on day 0. Month 12 begins on day
  330 and Month 36 on day 1050; a dormant or imprisoned pretender arrives in its capital in
  that day's tick (step 3), or in the first later tick in which the nation holds its capital
  and is not Godless. A chassis with a minimum awakening refuses earlier ones ("Primordial must
  start at least dormant"); it is not a price, and the refund stays the awakening's.
- **Death and reform** (N8, Phase 6b.3): a pretender that dies is gone for good in M1; the
  nation plays on. The exception is the Ash Phoenix (`ChassisDef.reform`, 90 days): when it
  dies in a province whose dominion is its nation's at strength 1 or more, wherever it died
  from (battle, a retreat with nowhere to go), `pretenderId` becomes null,
  `NationState.pretenderReturnDay` is set to the day plus 90, `pretenderDead` stays false, and
  its owner reads "Ysolde will rise again in 90 days." On that day's tick (step 3), or the
  first later one with the capital held and the nation not Godless, `settlePretender` places a
  fresh commander at the capital by the arrival rules: full HP, the design's pips, the default
  script, the god's name, no troops. It clears the return day and posts "Ysolde rises again in
  Kharnath." in place of the arrival message. A second death in its dominion reforms again.
  While it is away it makes no dominion checks and incarnate blessings lapse (no commander
  exists). A nation that is eliminated loses its god for good, a reforming one included: the
  return day is cleared, and a return already promised is cancelled with "Ysolde will not rise
  again." just before "Cinder Horde has fallen." That includes a promise made in the same
  tick, as when the Phoenix falls in the storm of its last fort (the storm is tick step 2, the
  elimination step 7). A god still standing when its nation falls dies with it, with neither
  message. The field came with Phase 6b.1's save step, so N8 needs no `STATE_VERSION` step.
- **The pretender as a commander**: its pips are the design's, its holy pips 0, and its
  default script casts when it has pips. It is not sacred, so it fights blessed only with
  Avatar, in provinces its nation dominates (the owner's decision); the Ascended Hero has
  Avatar built in. Only the Oracle researches. The idols (the Living Monolith, Cinder Idol and
  World Tree) cannot move, and on the losing side of a battle they die (docs/01); the
  Monolith's x2 doubles its own pretender checks only.
- **The god's name**: `NationSetup.pretenderName` (1 to 24 symbols: Latin letters, spaces,
  apostrophes, hyphens and periods, starting with a letter, not ending with a space, with no two
  spaces in a row; `validatePretenderName`, which checks the alphabet before the length, so a
  name in another script is refused for its script) is stored as `NationState.pretenderName`,
  null without one, and names the pretender commander on every arrival, return after Godless and
  reform; without one it takes its body's name. No rule reads it, and a test proves that two
  games differing only in the name differ only where the name appears. `createGame` checks the
  design before the name and refuses either with its reason.
- **Monthly summons** (N7, Phase 6b.3): in tick step 3, right after the pretenders settle, on
  days with `day > 0` and `day % TIME.daysPerMonth === 0` (day 30, 60, ...), each nation in id
  order whose pretender stands on the map gains its chassis's monthly troops
  (`monthlySummons`, `src/sim/pretender.ts`): the Mother of Beasts 2 Wolves (cap 24), the
  Cinder Idol 2 Fire Sprites (cap 20). It is skipped while the nation is eliminated, the god
  is not on the map (asleep, recalled while Godless, reforming, dead), the god is in transit,
  or the province it stands in is not its nation's dominion at strength 1 or more. The count
  is `min(count, cap − stock, leadership − troops led)`, where `stock` is the nation's living
  troops of that unit under every commander it owns (garrison holders included), from any
  source (handed-off monthly troops and ritual summons count). Nothing comes when that is 0 or
  less. The troops join the god's squad of that unit (or a new one) at full HP, and its owner
  reads "2 Wolves join Ysolde." ("1 Wolf joins ..." for one; `UnitDef.plural` names "Wolves").
  No rng is drawn. The summons have no cost record, so they draw no upkeep; Wolves eat 1
  supply a day each, Fire Sprites (constructs) none. A squad of that unit led by the god is
  bound in battle (`docs/04`, bound squads), whatever its source, so the pack never drags its
  Mother into a rout.
- **Starting springs**: a chassis's starting springs and then each Sacred Spring are added to
  the capital's `ProvinceState.extraSprings` at game creation ('nation' is the nation's
  primary color). They pay `MANA.perSpring` like map springs (`provinceSprings` lists the map's
  first, then these), stay with the province when it changes hands, and never edit mapgen
  data.
- **Blessings**: content in `src/content/pretenders/blessings.ts`; `blessOf(design,
  godPresent)` (`src/sim/bless.ts`) folds the chosen ones (or the defaults) into sacred units,
  the prophet and an Avatar in `battle/setup.ts`; `godPresent` is `pretenderId !== null` when
  the battle is set up. Bless points are per color, which differs from Dominions' pooled
  points: pooled, White, Blue and Black pips would be cheap points for Red and Green
  blessings. Without a `blessings` field the bless equals the fixed bless of Phase 5 exactly
  (tested over all 16,807 pip sets); `BLESS` in `src/content/rules.ts` stays the source of the
  default picks, and content validation holds each color's standard and greater blessing to
  it. A blessing's scale requirement reads the design's own scales, not the national scales
  with Wellspring steps, so a design's validity never changes in play. The design's list order
  never matters: blessings fold in content order. Refusals, first problem only: "Unknown
  blessing x", "Ember Wrath is chosen twice", "Flaming Weapons needs R5", "Fury Unbound needs
  Fury 1", "Cinder Skin and Living Pyre exclude each other", "Red blessings cost 4 of 3 bless
  points".
- **Boons**: content in `src/content/pretenders/boons.ts`; `PretenderDesign.boons` lists the
  bought ones (absent: none). Refusals: "Unknown boon x", "Avatar is chosen twice", "A Sacred
  Spring needs a pip in its color" (any color the design has a pip in), "Ascended Hero already
  has Avatar" (a chassis with Avatar built in). Avatar blesses the god when the battle's
  province has its nation's dominion at strength 1 or more, the same test as the scales'
  battle effects.
- **Fire shield** and blessing shields: each melee hit that deals damage to a shielded unit
  deals the shield's amount to the striker, ignoring protection, after the phase (like life
  drain). Since Phase 6b.2 shields go by element: a blessing's shield merges with the body's
  fire shield in its own element (Cinder Skin on an Ash Colossus with Avatar burns fire 8;
  Thornhide adds nature 4 beside it), and each element is logged on its own
  (`docs/04-battle.md`, "Retaliation shields").
- **Wild Spirit regeneration** is 10% of its HP per round (docs/09).
- **Great Wyrm breath**: 12 damage, range 3, ammo 5. Its element is display only: elements
  have no effect in M1. The replay viewer shows it in the nation's color (docs/12); from
  Phase 9 its color is a look choice among the god's colors (`PretenderLook.breath`), default
  the nation's.
- **Prophet**: the `makeProphet` command names any of the nation's commanders except the
  garrison holder and the pretender, while the nation has no prophet, from
  `prophetAvailableDay` on. Its holy pips become at least 3; in battle it gets +1 morale and
  the nation's blessings; it makes one dominion check a month from where it stands (docs/01's
  "Prophet: 1 check"; "spreads dominion as a temple" is read as "like a temple", without the
  Sanctity steps docs/01 gives temple buildings). A prophet cannot be dismissed. When it dies,
  the next may be named 720 days later. Its script stays as the player set it.
- **Presets**: Deep Root uses dominion 7, because dominion 8 costs 425 of 400 (docs/09). A
  nation's first preset is its default, used by AI nations and the headless runner. The six
  presets of Phase 6 come first and carry no blessings or boons field, so they keep the fixed
  bless and their cost; a test pins them byte for byte, and their battle setups and 360 days of
  play against the Phase 6 code. The six of Phase 6b.3 follow them (three per nation, after the
  old three) and each names one blessing, no boon: Undying Flame 385, Pyre Host 385, Dread Idol
  395, Heartwood 395, Hunt Lord 395, Mother of the Pack 395, all of a 400 budget (the build
  spec's A.8 costs, recomputed by `designCost`). Content validation requires six presets per
  nation. Their looks and identities arrive with the designer (Phase 9).
- **AI power**: each chassis has `aiPower`, the number of Independent Light Infantry its body
  beats half the time times their `armyPower` term (docs/08), from the build spec's
  calibration (A.11). `npm run sim:duel -- --calibrate` (Phase 6b.3) measures it on the real
  bodies and rules (abilities, trample, shields, bound squads): the largest n of Light
  Infantry, led by an Independent Captain, that the body with its battle-start summons and
  Fear beats in at least 100 of 200 seeds (immobile bodies defending), times 7.25, and
  rewrites the chassis file; a test holds every chassis to it. It found the spec's values for
  all sixteen. Nothing reads it yet: it joins `armyPower` when that function moves into the
  sim (Phase 8).
- **Staged duels** (`npm run sim:duel`, Phase 6b.3): every chassis body, then the build spec's
  A.10 rows (the Hero with Avatar and R4, the Mother with 6, 12 and 24 bound wolves and with 12
  led ones, and four gods leading armies), against its five Independent fixtures over seeds 0
  to 399, a cell being the god's side's win rate and the god's HP left when it lives. The god
  attacks with Attack in every slot; an immobile body defends with Hold. Unlike the spec's
  staging, abilities are the real N1 ones (summons led by the god and bound), trample keeps its
  size limit, and the Mother's wolves are bound squads she leads. `tests/sim/battle/duel.test.ts`
  pins every cell to 15 points either side of its measured value and checks the spec's named
  targets (`docs/09-balance.md` has the table).
- **Save version**: Phase 6b.1 is `STATE_VERSION` 3. Its migration (after the battle track's
  step to 2) gives older nations a null name and return day and older provinces no added
  springs. It appends the keys, and `createGame` puts them last as well, so a lifted save is
  key for key the game created on version 3 and hashes the same (`stateHash` hashes the JSON
  text; a test pins it).
