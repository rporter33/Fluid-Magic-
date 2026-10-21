# Pretender Design

The pretender is the player's avatar and the single most expressive decision before a
match. The screen should feel like building an MTG commander: choose a body, pour color
into it, and set the five Scales that describe the world you want to rule.

## Point budget

Every nation starts with **400 design points**. Spend them on chassis, pips, dominion,
and scales. Awakening state refunds points. Unspent points are lost. The screen shows a
live budget bar and a live summary card.

## Step 1: Chassis

| Chassis | Cost | Base pips | Base dominion | Body | Notes |
|---------|------|-----------|---------------|------|-------|
| Oracle of the Flux | 20 | none | 1 | hp 12, prot 2, mor 14, size 2 | Cheapest body. Pips cost 10 less each. Can research (RP as a mage). |
| Titan | 120 | 1 pip in nation color | 2 | hp 60, str 20, att 14, def 12, prot 10, mor 18, size 4, leadership 100 | Strong fighter. |
| Great Wyrm | 220 | 2 pips in nation color | 2 | hp 120, str 24, att 15, def 10, prot 16, mor 20, size 6, flying, breath (12 dmg of nation element, range 3, ammo 5) | The monster. Dormant start recommended by the UI. |
| Living Monolith | 60 | none | 4 | hp 200, prot 25, immobile, mor 50 | Cannot move. Dominion checks x2. Casts rituals in capital. Ideal for a rushing scale build. |
| Wild Spirit | 80 | 1 G pip | 2 | hp 30, def 16, prot 4, size 2, stealthy, regeneration | Hard to catch. |
| Ash Colossus | 100 | 1 R pip | 1 | hp 80, str 22, prot 14, size 5, fire shield (5 fire dmg to melee attackers) | Red flavor body. |

The nation offers all chassis; the UI highlights the two that fit the nation.

## Step 2: Color pips

Pips cost increasingly per color:

| Pip level in a color | 1 | 2 | 3 | 4 | 5 | 6 |
|----------------------|---|---|---|---|---|---|
| Cost | 40 | 20 | 25 | 30 | 35 | 40 |

Opening a **new color** (first pip in a color other than the nation's) costs 60 instead
of 40. A pretender with pips in any color can cast that color's spells and leads research
in it. Pips ≥ 4 in a color grant the bless (see Magic).

Design intent: a mono-color pretender reaches 4 pips for 115 points. A second color at
2 pips costs 80. The player sees the bless effect appear live when 4 is reached.

## Step 3: Dominion strength

Base dominion from chassis. Each additional point costs 30. Range 1 to 10. Dominion
score drives spread checks and caps dominion strength in provinces, and the Wellspring
bonus adds to it during play.

The UI shows: "Your dominion will spread to about N provinces by Year 2" using a quick
simulation estimate (static formula is fine: `score * 1.5` provinces).

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

Cost per step: 40 points toward a pole whose color is **not** in the nation's identity,
20 points toward a pole whose color **is**. Steps are bought from 0 outward, and scales
never refund points; design points come only from the budget and from awakening. For
Red, the cheap poles are Turmoil and Fury; for Green, Growth and Wild. The UI warns when
a step goes against the nation's grain (toward an enemy color), but allows it.

Random events are **M2**. The Turmoil event chance is stored but unused in M1.

## Step 5: Awakening

| State | Refund | Arrives |
|-------|--------|---------|
| Awake | 0 | Day 1 in the capital |
| Dormant | +150 | Month 12 |
| Imprisoned | +350 | Month 36 |

The budget line reads e.g. `400 + 150 = 550`. The summary card says when the god arrives.

## Prophet

Any commander may be made Prophet (one per nation, once every 24 months if the prophet
dies). The prophet gains holy 3, +1 mor, spreads dominion as a temple, and the nation's
bless applies to it.

## Summary card

The right third of the screen is a live card: chassis portrait tinted by color pips,
pip row shown as MTG-style mana symbols, dominion candle count, scale summary as five
small two-color bars, bless text, awakening date, and the AI's one-line "reading" of the
build (e.g. "A fast, fiery god. Expect early wars."). The reading is a rule-based string.

## Presets

Each nation ships three presets so a new player can start in one click:
- Cinder Horde: *Warlord* (Titan R4, Fury 3, Turmoil 2, dominion 5, awake),
  *Ember Oracle* (Oracle R6, Fury 2, dominion 4, dormant), *Wildfire* (Ash Colossus R3,
  Turmoil 3, Fury 3, dominion 6, imprisoned).
- Thornwood: *Elder Oak* (Titan G4, Growth 3, Wild 2, dominion 5, awake), *Deep Root*
  (Living Monolith G3, Growth 3, Wild 3, Sanctity 1, dominion 8, awake), *Wyrm of the
  Loam* (Great Wyrm G4, Growth 2, dominion 4, dormant).

The implementer validates that each preset costs ≤ budget; if not, adjust the preset.

## Implementation decisions

- **Scale effects** are data per pole and per step (`src/content/pretenders/scales.ts`).
  Where the core rules give a formula, its effect applies in both directions as well as the
  table's: Turmoil lowers gold, Wild lowers materials, Artifice lowers supply.
- **Prophet and pretender identity** is stored once, as ids on the nation
  (`prophetId`, `pretenderId`), not as flags on commanders.
- **Wellspring scale steps** add to the owner's national scales while it holds the province.
