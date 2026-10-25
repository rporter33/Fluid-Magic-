
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
