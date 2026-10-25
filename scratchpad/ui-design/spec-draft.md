# Fluid Magic UI Specification (draft for docs/07-ui.md)

Status: draft, written 2026-10-21 from the four research notes in this folder and the repository
docs. It is meant to replace `docs/07-ui.md` once the project owner accepts it. Phase 8 (map and
core UI), Phase 9 (remaining UI) and Phase 10 (replay viewer) build from it.

Direction it serves (binding, from the project owner): "Make sure the UI matches those of
similar games; where complexity is tastefully layered under smart menu design." Earlier
direction, also binding: battles must be visceral, with detail and sound. The battle
presentation is designed separately. This spec gives the replay a frame that matches the rest
of the game (section 4).

How to read it:
- Section 1 holds the rules. Every later section applies them.
- Section 2 is the main game screen and section 3 covers the other screens. Each screen has
  a "where each detail lives" table that names the layer for each piece of information.
- Section 4 covers battle reports and the replay frame. Section 5 covers the shared systems:
  tooltips, the Codex, notifications, keys, onboarding, accessibility, undo.
- Sections 6 and 7 are the build contract: the React components, and what the sim must
  expose for them.
- Section 8 maps each pattern to the game it comes from, with the research note's citation.
- Section 9 lists deviations from the current `docs/07-ui.md`, open items, and a phase plan.

Priority tags: **[M1]** is required for Milestone 1. **[M1-should]** is built in M1 if time
allows, and the layout leaves room for it. **[Later]** is designed now but not built in M1.

Evidence: every claim about another game's UI comes from `research-paradox.md`,
`research-dominions.md`, `research-fourx.md` or `research-ux.md`, which cite their URLs. Section
8 repeats the URL for each pattern. Those notes were built from web-search extracts, because
direct page fetches were blocked. This session's search budget was already used up, so no new
claims were added here. Patterns the notes mark unverified (Total War: Warhammer III's campaign
panels, in `research-fourx.md` section 12) are not relied on.

---

## 1. Principles

### 1.1 The eight rules

1. **Five layers, one gesture apart.** Every piece of information lives at one layer, and each
   layer answers one kind of question:

   | Layer | Gesture | Question it answers | Fluid Magic surface |
   |---|---|---|---|
   | **L0 Glance** | none | How much? Where? Is anything wrong? | Top bar readouts with monthly delta, clock, alerts ribbon, outliner rows, map labels, army badges, bottom strip |
   | **L1 Hover** | point (400 ms on panels, 500 ms on the map) | Why is it this number? What does this icon mean? | Tooltip: value, one-line meaning, a breakdown table from a sim selector, a projection line. Holding **Shift** expands it to every row and the per-day figures (L1+) |
   | **L2 Concept** | point at a dotted-underlined term inside a tooltip, then lock | What does this word mean? | Nested concept tooltip, at most 3 deep, with an "Open in Codex" footer |
   | **L3 Panel** | click a value, glyph, alert or map object | What can I do about it? | Left dock (province, commander, army) with tabs. Ritual targeting and the battle plan live here |
   | **L4 Screen** | hotkey or top-bar button | Show me everything; compare; look it up | Research (R), Ledger (L), Codex (F), Settings, battle replay, Pretender Design |

   Every tooltip ends with a dim footer that names the deeper gestures (`Shift more · T lock ·
   Click open · Ctrl+click Codex`), so players do not have to learn from each other that a
   deeper layer exists. Old World players had to teach each other the freeze key
   (research-ux §1).

2. **Decisions on the surface, explanations underneath.** Anything needed to choose is printed:
   a cost on its button, an ETA on the cursor, supply after the move, the projected unrest, the
   strength estimate before an attack. Tooltips explain *why* a number has its value. They never
   hold the only copy of a number the player decides on (research-paradox §13, rule 1).

3. **One number, one source.** Every displayed number and every breakdown row comes from a sim
   selector (`src/sim/selectors.ts` and the `explain*` functions of section 7). The UI never
   recomputes a formula, so the tooltip, the panel, the AI and the tick cannot disagree.

4. **Shallow menus, one home per kind of thing.**
   - Nation screens are top-bar buttons (Research, Ledger, Codex, Menu).
   - Information about the selection goes in the left dock.
   - Commands to the selection go in the bottom strip.
   - Lists (outliner, message feed) go in the right dock.
   - Depth budget: any action is at most 3 clicks from the map, and any explanation at most 3
     hovers deep.
   - Only one modal is open at a time, and a panel has at most 4 tabs.
   - No screen is reachable only from a notification or only by hotkey. Every hotkey has a
     visible button.

   Endless Legend 2 dropped its "Divided UI" because players did not know where to look
   (research-fourx §11). Vic3 was criticized for menu hopping (research-paradox §13).

5. **Conditions, not chores.** Alerts are conditions computed from state: they are actionable,
   counted, and disappear when resolved. Events go to the message feed. Interrupts follow
   per-type player settings. The game pauses for a threat *before* it arrives, because battles
   resolve the instant armies meet (research-ux §7).

6. **Never hue alone.** Every color identity is shown three ways: hue, glyph and letter (MTG's
   model). Every state shown by color also has a shape or a pattern. In panels an icon always
   comes with a word or a number. Bare icons appear only on the map and in the top bar, and
   always have a tooltip (research-ux §5, research-dominions §2).

7. **Disabled things explain themselves; nothing the player looks for is hidden.**
   - A blocked action stays visible. Its tooltip shows a condition block with ✓ and ✗ for
     every check, taken from the same validation the command uses.
   - Sections that do not apply yet, such as Rituals before the player has a caster, are
     collapsed with a one-line unlock hint. They are never removed.

8. **The map is the hero, and in a replay the stage is.** Chrome is quiet, dark and
   collapsible. Mana colors appear only on things that carry that identity. The same
   components, icons, keys and settings are used everywhere, the battle replay included, so
   the visceral battle stage sits inside the same game.

### 1.2 What is visible without a click (the L0 set)

`docs/07` requires population, supply, gold, materials, mana and unrest to be visible without a
click. This table makes that testable and adds the other things a player checks every minute.

| Information | Where it is at L0 |
|---|---|
| Gold | Top bar: stock and net per month (`1,240 ▲38`) |
| Population | Top bar: national total and growth. Map: a log-scale bar under each province name, and the number at Near zoom or while Shift is held |
| Materials | Top bar: capital fort pool and cap, with the monthly rate (`212/360 ▲60`) and a "full" glyph at the cap |
| Mana | Top bar: five fixed slots W U B R G, each with symbol, stock and `▲n/mo` |
| Supply | Map: a wheat glyph on every army badge (full = fed, half = tight, crossed = starving). Alerts ribbon: "Army starving". Supply map mode |
| Unrest | Map: a fist glyph on the province label from 25 up (outlined fist from 25, solid fist above 50, when recruiting stops). Unrest map mode. Alert above 50 |
| Date, speed, paused state and its reason | Clock cluster, top right |
| Research | Top bar: active color symbol, level, days to the next level |
| Dominion | Top bar: dominion score. Map: candles on each province |
| Victory race | Top bar: Wellspring track `◆◇ 1/2`. Situation alert when anyone is one short |
| Threats | Map: visible hostile armies in transit show an arrow and an ETA. Alert "Hostile army approaching" |
| Own armies | Map badges, and the outliner's Armies section with order, troops, ETA and status glyphs |
| Problems | Alerts ribbon (section 2.5) |

### 1.3 Layer map: where every detail lives

Read across a row: L0 is what you see, L1 what hover adds, L2 the concept behind it, L3 where you
act, L4 where you compare or look it up.

| Detail | L0 glance | L1 hover (breakdown source) | L2 concept | L3 act | L4 compare / reference |
|---|---|---|---|---|---|
| National gold | top bar | provinces top 5 + others, plunder, upkeep by commander, net (`explainNationGold`) | Gold, Upkeep, Tax rate | province Overview (tax); Pillage order | Ledger: Provinces sorted by gold |
| Province gold | — | pop ÷ 100, tax, Order scale, unrest factor, running values (`explainProvince().gold`) | Tax rate, Unrest, Scales | Province: tax selector | Ledger: Provinces |
| Population | top bar, map bar | growth terms, recruits pending, pillage, battle losses (`explainProvince().growth`) | Population, Growth/Rot | Province header | Ledger: Provinces; Population mode |
| Materials | top bar | own production, neighbor shares, cap, overflow (`explainFortMaterials`) | Materials, Fort | Province: Recruit tab | Ledger: Forts |
| Supply | badge glyph | supply base, pop ÷ 50, scales, ritual factor, siege factor, used by each commander (`explainProvince().supply`) | Supply, Starvation | Move elsewhere; ritual Bounty | Supply mode; Ledger: Provinces |
| Unrest | label fist | each source per month, projection (`explainProvince().unrest`) | Unrest | Tax, priest, PD | Unrest mode |
| Mana per color | top bar slot | springs by province, Wellsprings, dominion tint, Rot bonus (`explainNationMana`) | Mana, Spring, Dominion tint | Commander: Give mana, Rituals | Ledger: Magic; Mana springs mode |
| Research | top bar | each researching mage, pips, Lore factor; unlocks at next level (`explainResearch`) | Research, Pip | Commander order Research | Research screen |
| Dominion score and spread | top bar, candles | score terms; checks per month by source (`explainDominion`) | Dominion, Candle, Godless | Priest: Preach; build Temple | Dominion mode; Codex |
| Scales | nation tooltip | effective scale per province, poles, per-step effects | each axis | none in play | Ledger: Nation; Codex |
| Army strength | badge count | squads, HP %, morale, supply status | Squad, Morale | select: bottom strip | Ledger: Commanders |
| Commander details | portrait, pips on frame | HP, morale terms, leadership, fatigue rules | Pip, Holy, Leadership | Commander panel | Codex unit page |
| Script and formation | five-glyph script summary in the strip | each slot with castability and fatigue | Script, Formation, Fatigue | Battle Plan tab | Codex: spells |
| Move | path preview, ETA label | per-leg days, terrain, speed factor, supply after arrival | Map speed | right-click | — |
| Attack outlook | cursor label strength bar | both sides, modifiers, fog band | Morale, Terrain | right-click; Battle Plan | Battle report afterwards |
| Spells | script slot glyphs, research cards | full effect, cost for this caster, requirement | Fatigue, Carried mana | Battle Plan, Rituals tab | Codex: Spells |
| Units | unit cards | stat block, weapons, tags, upkeep, reason if not recruitable | Sacred, Berserk, ... | Recruit tab | Codex: Units |
| Ritual effects in force | map effect glyph | spell, owner, days left, numbers changed | Ritual | — | Ledger: Magic (Active effects) |
| Sieges | siege ring on the map | walls, rates, days to breach | Siege, Storm, Walls | Province: siege block, Storm | Outliner: Activities |
| Recruit queues | outliner Activities | head item, days, waiting reason | Recruitment | Recruit tab | Ledger: Forts |
| Battle outcome | feed row, map marker | result line | — | Battle report card | Replay; Ledger: Battles |
| Wellsprings | top-bar track | every Wellspring and claim, every nation's count | Wellspring, Claim | Priest: Claim | Ledger: Nations |

### 1.4 How menus stay shallow

- **Tabs, not sub-windows.** Province: Overview, Recruit, Forces, History. Commander: Overview,
  Battle Plan, Rituals. Nothing opens a window from inside a window.
- **One modal at a time.** A modal that links to another (Research to the Codex) replaces it and
  leaves a back link. Modals: Research, Ledger, Codex, Settings, Game Menu, battle replay.
  Pretender Design, New Game, Main Menu and Victory are full screens outside the game screen.
- **Ritual targeting is docked, not modal**, because it needs the map (research-ux §10).
- **The Ledger replaces a family of screens.** Provinces, Commanders, Forts, Magic (including
  active effects), Battles and Nations are tabs of one sortable screen. Dominions spreads these
  across F1 to F9 (research-dominions §1.1, §1.11).
- **Popups only for what the player set to pop up** (section 5.3). There are no
  confirmation dialogs except for irreversible actions (section 5.7), and those confirm inline.
- **The left dock has a back stack** with a breadcrumb (`Ashfen ▸ Varo`), so stepping from a
  province to a commander and back costs one click.

---

## 2. The game screen

### 2.1 Layout

Two breakpoints. Sizes are at 100% UI scale and grow with it, because every DOM size is in
`rem` (section 5.6).

```
Wide (viewport >= 1600 px wide), shown at 1920x1080
+-----------------------------------------------------------------------------------------------+
| TopBar 44px: [Nation] Pop Gold Materials | W U B R G | Research Dominion Wells | [R][L][F][=] Clock Speed |
+------------------+------------------------------------------------------------+---------------+
| Alerts ribbon (floats over the map's top-left, 36px)       (pause-reason chip floats top-right)|
| Left dock 360px  |                                                            | Right dock    |
| (opens on        |                 MAP (Pixi canvas, DOM overlays)            | 300px         |
|  selection;      |                                                            | Outliner      |
|  Province /      |                                                            | ------------- |
|  Commander /     |                                                            | Message feed  |
|  Army panel)     |                     map mode strip + legend (bottom right) |               |
+------------------+------------------------------------------------------------+---------------+
| Bottom strip 128px (only while something is selected): portrait | squad cards | script | orders | ETA |
+-----------------------------------------------------------------------------------------------+

Narrow (1280 to 1599 px), shown at 1280x720
+-------------------------------------------------------------------------------+
| TopBar 44px (mana slots show stock only; deltas move to the tooltip)          |
+-----------------+-----------------------------------------------------------+-+
| Left dock 320px |  MAP  (912 px wide with the left dock open)               |R|  48px rail:
|                 |                                                           |a|  Outliner, Feed;
|                 |                                                           |i|  each opens a 300px
|                 |                                                           |l|  flyout over the map
+-----------------+-----------------------------------------------------------+-+
| Bottom strip 120px (only while something is selected)                         |
+-------------------------------------------------------------------------------+
```

- At 1280x720 with the left dock open, the map is 912 by 556 px (71% of the width). With nothing
  selected it is 1232 by 676 px. Old World reviewers report losing 40 to 50% of the screen to
  menus, and Humankind's unit panel took almost half the screen (research-fourx §6, §11).
- The left dock opens on selection and closes on Esc or ×. The right dock and the left dock
  collapse with `]` and `[`. `H` hides all chrome except the clock (Dominions `h`,
  research-dominions §1.1).
- Panels do not animate in. They appear on the frame after the click (research-dominions §2:
  "keep the speed").

### 2.2 Visual language (summary; art values are in docs/09)

- **Chrome:** dark neutral panels (#1C1A17 base, two lighter steps), parchment text (#F4EEDF),
  1 px keylines. One display face for headers and one tabular-figure face for numbers. No mana
  colors in decoration (research-fourx §13, Endless Legend 2's "too loud" warning).
- **Two button styles** (Vic3, research-paradox §13 rule 6):
  - **Action** buttons issue a command through `validate` then `apply`. They are filled, with a
    1 px parchment keyline, and print their cost.
  - **Navigation** buttons open a panel or screen. They are ghost buttons with no keyline.
- **Numbers:** integers at L0. Signed deltas use ▲ or ▼ *and* a warm or cool tone. Units are
  always written (`/mo`, `/day`).
- **Concept terms** (L2 triggers): chrome text color with a 1 px dotted underline, never a mana
  hue. Blue would read as Tide (U) (research-fourx §1 point 2).
- **Entity links** (provinces, commanders, nations, spells) carry a small leading glyph
  (province pin, portrait dot, banner, mana symbol) and underline on hover. A click navigates.
  So a concept *explains* and an entity *goes there*, and the two look different.
- **Icon grammar:** one 24x24 monoline silhouette per noun (docs/09). States are corner badges
  on that silhouette: ▲ ▼ ✕ (blocked) ‖ (paused) ! (problem). A state never gets a new
  silhouette (research-ux §5).
- **Cards share one frame** (rounded rectangle, header band in the nation's secondary color,
  symbol row at the bottom): unit, spell, chassis, battle report. The replay therefore uses the
  same visual language (research-fourx §13).

### 2.3 Top bar

Left to right. Each readout is a `Readout` component: icon, value, delta, L1 tooltip, click
target.

| # | Readout (L0) | L1 tooltip (selector) | Click | Warning states (hue + shape) |
|---|---|---|---|---|
| 1 | **Nation button**: banner with mana symbol, pretender mini-portrait | Nation name; pretender state (awake in Kharnath / dormant, arrives Y2 M1 D1 / dead); Godless state; the five effective scales as mini two-pole bars | Ledger, Nation tab (summary card from Pretender Design, scales, bless) | Godless: ! badge and red ring |
| 2 | **Population** `84.2k ▲0.3k` | National total; growth per month; top 5 provinces; recruits waiting for population; pillage losses (`explainNationPopulation`) | Population map mode | ▼ when shrinking |
| 3 | **Gold** `1,240 ▲38` (net/mo) | Income by province (top 5, then "N others ▸"), plunder converted to per month, upkeep by commander (top 5, then others), net. Shift adds per day. Projection: "1,278 next month" or "Empty in 23 days: troops go unpaid" (`explainNationGold`) | Ledger, Provinces tab, sorted by gold | Net below 0: ▼ warm. Treasury empty within 30 days: critical alert |
| 4 | **Materials** `212/360 ▲60` (capital fort pool / cap) | Per fort (M1: the capital): own production, each neighbor's 50% share as a row, cap = 6 months, months to cap, "Besieged: nothing collected" when it applies (`explainFortMaterials`) | Ledger, Forts tab | At the cap: "full" glyph, amber, and an "Overflow lost −x/mo" row (Stellaris's full-means-wasted yellow, research-paradox §1) |
| 5 | **Mana** W U B R G: symbol, stock, `▲n/mo` | Per color: springs by province, Wellsprings, dominion tint per province, Rot bonus (B), rituals in progress already paid (`explainNationMana`) | With a caster selected: that commander's Rituals tab. Otherwise Ledger, Magic tab | None (mana has no cap). Colors with no stock and no income are drawn at 40% with no delta. All five stay in place, so the layout never shifts and the five colors are taught |
| 6 | **Research** active color symbol, `L3 ▸ 47d`, and a hairline progress bar | Each researching mage (name link, pips, lab, Lore/Fury factor, RP/mo), total RP/mo, points to the next level, the spells it unlocks (`explainResearch`) | Research screen (R) | No researcher: ! badge and an attention alert. Track maxed at L6: "max" glyph |
| 7 | **Dominion** candle glyph and score | Score = pretender + claimed Wellsprings (capped at 10); provinces under your dominion; checks per month by source: capital, temples, pretender, prophet, preachers; expected pushes per month (`explainDominion`) | Dominion map mode | Godless risk (capital not under own dominion): ! badge |
| 8 | **Wellsprings** `◆◇ 1/2` (own claimed / needed) | Every Wellspring: province link, owner, claimed by, claim progress; every nation's count | Centers the map on the next Wellspring (repeated clicks cycle). Footer link "Ledger: Nations ▸" | Someone at needed − 1: purple Situation alert, and the track gets a hexagon badge |
| 9 | **Screen buttons** (navigation style; icon plus key letter): Research `R`, Ledger `L`, Codex `F`, Menu `Esc` | Name and key | Opens the screen | — |
| 10 | **Clock** `Y1 M3 D14` with a hairline that fills over the 30-day month | "Next month in 16 days: +38 gold, +3 R, +2 G. Dominion spreads on the last day." | Opens the speed settings popover (speed presets) | — |
| 11 | **Speed**: pause button and four speed pips | "Space pause · 1 to 4 speed · +/− step" | Click a pip to set the speed | Paused state, below |

Where the narrow layout saves width: below 1600 px the mana slots drop their deltas (moved to the
tooltip), Research shows `L3 47d`, and the screen buttons show icons only. Budget at 1280: about
1,120 px.

A readout's tooltip follows the anatomy in section 5.1. Every breakdown row that names a
province or commander is a link. That answers Civ VII's "totals without sources" critique and
Vic3's "explains but can't act" (research-fourx §3, research-paradox §13).

### 2.4 Clock, speed and auto-pause

- **Speeds** (docs/01): Paused, 1 (1 day/s), 2 (2), 3 (4), 4 (8). Keys: Space toggles pause, 1 to
  4 set the speed, `+`/`−` and `Z`/`X` step it (EU4, CK3; research-paradox §2). Every order
  works while paused.
- **Paused looks paused, on three channels** (CK3; research-paradox §2): the cluster tints
  red, the word **PAUSED** appears, and the speed pips turn hatched.
- **Pause-reason chip** under the clock, after an auto-pause: `Paused: Battle at Ashfen ▸`.
  Clicking it goes to the cause. Pauses on the same day **coalesce** into one:
  `Paused: 3 events ▸` opens a list with jump links (research-ux §7). This answers the
  Stellaris complaint "why did it pause?".
- **No auto-resume by default.** Closing a popup leaves the game paused. One setting, "Resume
  after closing an auto-pause popup", is off by default (Stellaris; research-paradox §2).
- **Modals pause and restore.** Opening Research, the Ledger, the Codex, Settings or the replay
  pauses the game. Closing the modal restores the speed that was active when it opened. That
  speed may itself be "paused" after an auto-pause, so an auto-pause is never undone by
  accident. This is a setting, on by default. The replay always pauses.
- **Undo chip** [M1-should]: while paused, next to PAUSED:
  `Undo: Recruit 10 Cinder Warriors (Ctrl+Z)` (section 5.7).
- Pause state, speed and undo are UI state. They never enter `GameState`, so determinism is
  unaffected.

### 2.5 Alerts ribbon

Alerts are **conditions**: true now and computed from state by pure functions
(`src/ui/derive/alerts.ts`, section 7.3). Each one disappears the moment its condition clears.
They are not queued events. The ribbon floats over the top-left of the map under the top bar,
where EU4 and CK3 put theirs (research-paradox §3). One icon per alert type, with a count badge.

**Tiers** (EU4's three plus EU5's three; each has its own shape, so hue is never the only
signal):

| Tier | Color and shape | Sound when it appears [M1-should] |
|---|---|---|
| Critical | red octagon | short low cue |
| Severe | orange triangle | short cue |
| Attention | yellow diamond | none |
| Opportunity | green circle | none |
| Hint | blue "i" | none |
| Situation | purple hexagon | soft cue |

**M1 alert types** (all derivable from existing selectors):

| Alert | Tier | Condition | Click goes to |
|---|---|---|---|
| Army starving | Critical | an own province with own troops has `supplyUsed > supply` | the province, Supply mode |
| Troops unpaid | Critical | `nation.unpaidDays > 0`, or the treasury will run out within 30 days at the current net | Ledger, Provinces by gold |
| Fort besieged | Critical | an own fort with `siege !== null` | the province, siege block |
| Hostile army approaching | Critical | a visible enemy commander's current leg ends in an own province, or one an own army stands in (ETA shown) | the enemy army |
| Godless | Critical | `isGodless(state, nation)` | the capital, Dominion mode |
| Recruiting blocked by unrest | Severe | an own fort with unrest above 50 | the province |
| Enemy dominion in your land | Severe | an own province dominated by another nation | the province, Dominion mode |
| Capital dominion falling | Severe | the capital's own dominion is at 2 or less, or held by another nation | the capital |
| Idle commanders | Attention | own, not the garrison holder, order idle, not in transit | cycles through them (like N) |
| Materials at cap | Attention | `pool >= cap` at a fort | Recruit tab |
| No research | Attention | `nationResearchRate === 0`, or the active color is at L6 while others are not | Research screen |
| Script cannot cast | Attention | a commander's scripted spell fails `scriptCheck` | Battle Plan tab |
| Idle mage in a lab | Attention | a mage standing in an own lab, order idle | the mage |
| Wellspring claimable | Opportunity | an owned, unclaimed Wellspring province | the province; a priest there if any |
| Prophet available | Opportunity | no prophet and `day >= prophetAvailableDay` | selects the first eligible commander (not the pretender or a garrison holder) and highlights Make Prophet in the bottom strip |
| Wellspring race | Situation | any nation at `wellspringsToWin − 1` claimed, or a visible claim in progress | the Wellspring |
| First-time hints | Hint | section 5.5 | the hint |

**Interaction** (EU4, EU5, Stellaris, HoI4; research-paradox §3):
- **Hover** lists every case as a link, with a one-line reason: "Ashfen: 212 eat, 140 supply."
- **Left-click** goes to the first case. Repeated clicks cycle through the rest.
- **Right-click** dismisses the alert until its condition goes false and comes back true (the
  EU5 rule).
- **Shift+right-click** mutes the type for this game. Muted types are listed in the outliner's
  "Muted alerts" section and in Settings, where they can be restored (EU4).
- `J` jumps to the newest alert or message, and each further press steps back through the last
  8 (StarCraft II's alert jump, moved off Space because Space pauses; research-ux §6).
- A critical alert's first appearance pulses its icon twice. That is the visual twin of its
  sound cue (research-ux §11).

### 2.6 Outliner (right dock, top)

The Paradox outliner: everything the player owns or is doing, in collapsible sections with counts.
Empty sections hide themselves (EU4), and noisy ones start collapsed (Vic3 1.6;
research-paradox §5). `O` toggles it.

| # | Section | Rows | Default |
|---|---|---|---|
| 1 | **Learn** (first games, section 5.5) | 6 to 8 steps with How and Why | open while guidance is on |
| 2 | **Pinned** | anything pinned with `P`, the header pin icon, or the star on a row: commanders, provinces, forts, Wellsprings | open |
| 3 | **Armies** | commanders that lead troops, grouped under named groups (collapsible headers) or by province. Idle armies sort to the top | open |
| 4 | **Mages** | mages without troops, sub-grouped by order: Researching, Casting, Idle | open |
| 5 | **Priests** | priests without troops: Preaching, Claiming, Idle | collapsed |
| 6 | **Scouts** | scouts and stealthy commanders | collapsed |
| 7 | **Provinces** | own provinces that hold a province-level alert: starving, unrest above 50, besieged, enemy dominion, materials at cap | open |
| 8 | **Activities** | sieges (ours and theirs, walls bar), rituals in progress (caster, spell, days), recruitment (per fort: head item, days, queue length), construction, Wellspring claims | collapsed after the first game |
| 9 | **Wellsprings** | each known Wellspring: owner banner, claimed by, claim progress | open |
| 10 | **Muted alerts** | muted alert types, each with Restore | only when any are muted |

Every commander appears in exactly one of sections 3 to 6, by role: Armies when it leads troops,
otherwise by its pips (mage), holy pips (priest) or the scout tag. The pretender and the prophet
carry a crown or halo badge wherever they appear. The garrison holder is never listed. Its
troops appear under the fort in Provinces when they matter.

**Row anatomy** (24 px tall):
`[portrait] Name · [order icon] · 48 troops · [status glyphs] · 4d`.
Status glyphs, at most three plus a `+n` chip: starving, unpaid, wounded below 50%, routed,
besieging, casting, script problem. They work like Stellaris's planet status icons
(research-paradox §5).

**Row interactions:**
- Hover shows a compact army card: squads with counts, HP and morale, and supply status.
- Click selects, which opens the left dock. Double-click selects and centers the camera
  (Stellaris).
- Right-click opens a context menu: the orders available now, Pin or Unpin, Add to group, and
  Rename group. Outliner rows are DOM, so right-click there is safe. On the map, right-click
  always means move.
- Outliner rows are also **drop targets**. Drag a squad from the Battle Plan or the Forces tab
  onto a commander in the same province to call `transferSquad`. Invalid targets show the
  refusal reason ("Leadership 60: would lead 72").
- Keyboard: `Tab` and `Shift+Tab` cycle own commanders (docs/07). `N` goes to the next idle
  commander, and a second press centers on it (CK3's N, StarCraft II's idle key).

**Named groups** [M1-should] are a UI label over several commanders (docs/01: "Grouping is a UI
concept"). Players asked Dominions for exactly this (research-dominions §1.4). Clicking a group
header selects all its commanders, so the next right-click moves them together. Groups are saved
in the save file's UI block, not in `GameState`.

### 2.7 Message feed (right dock, bottom)

Messages are **events**: things that happened. The feed sits under the outliner with a draggable
splitter, as Vic3's feed does (research-paradox §4). In the narrow layout it is its own rail icon
with an unread count.

- **Row:** type icon, date (`M3 D14`), text with entity links, then buttons that appear on hover:
  Jump, **Watch** for battles, and a gear icon. The gear opens that type's two settings,
  Display and Pause (Vic3, EU4). Ctrl+click on a row opens the same popover (Stellaris).
- **Filter chips:** All · Battles · Military · Economy · Magic · Dominion. The same categories
  appear in Message Settings (research-dominions §1.9).
- **Grouping:** repeats of one type within 5 in-game days merge into one row:
  "Recruited ×3 (Kharnath)". At speed 4 a month passes in under 4 seconds (research-ux §7).
- **Right-click** hides a row (Civ VI; research-fourx §5). The message stays in the province
  History tab and in the Ledger.
- **Retention:** the sim keeps 300 messages per nation (`MESSAGES.keep`), and the feed shows all
  of them.

Categories by message kind (`MessageKind` in `src/sim/types.ts`; new kinds in section 7.2):

| Category | Kinds |
|---|---|
| Battles | `battle` |
| Military | `captured`, `lost`, `sighted`, `approaching` (UI-derived), `starvation`, `siege` (new) |
| Economy | `recruited`, `built` |
| Magic | `ritual`, `research` |
| Dominion | `dominion`, `godless` (new), `wellspring`, `pretender` (new), `eliminated` (new) |

### 2.8 Left dock: the context panel

One thing at a time, with a back stack. The header is the same for all three panels:

```
[<] Kharnath > Varo the Ember                  [go-to] [pin] [Codex i] [x]
```

- `<` steps back through the stack. Mouse button 4 also goes back, best effort. Alt+Left is
  never used, because it is the browser's Back.
- **go-to** centers the camera, **pin** adds to the outliner's Pinned section, **Codex** opens
  this entity's Codex page. This is Vic3's go-to, pin and zoom-to trio (research-paradox §5).
- The dock remembers the last tab per panel type (research-fourx §10).

#### 2.8.1 Province panel

**Header:** name; terrain icon and word; owner banner and name (or "Independents"); dominion
candles in the dominating nation's banner, grouped by 3 (docs/07); building slots for Fort,
Temple and Lab, drawn filled when built and as a faint outline when missing, so a gap shows at a
glance (Civ VI districts; research-fourx §10); a Wellspring badge; spring symbols.

**Hero row:** `Population 12,400 ▲37/mo` in large type. The player should always feel this
number (docs/01 §3).

**Stat rows** (`StatRow`: icon, label, value, delta, and a target marker where the value drifts):

| Row | L0 | L1 breakdown |
|---|---|---|
| Gold | `+21.8/mo` | pop ÷ 100 = base · tax ×1.0 · Order +7% · unrest −15%, with running values (multiplicative table, research-ux §4) |
| Materials | `18/mo → Kharnath fort` | terrain base, pop ÷ 500, Artifice or Wild, ritual bonus; "50% goes to the fort at Kharnath" for a fortless neighbor |
| Supply | `140 / 212 per day · fed` | supply base, pop ÷ 50, Growth, Wild, Rot, Artifice, ritual factor, siege halving; then consumption by each commander here |
| Unrest | `34 ▲4/mo → 46 in 3 mo` | High tax +4, priest −5, enemy dominion +n, Order −2 per step, decay −2; the projection is clamped to 0 to 100 (RimWorld's mood target, research-ux §2) |
| Mana | springs as symbols, `+3 R/mo` | each spring, dominion tint `floor(strength / 3)`, Wellspring 2 of each |

**Tabs:**

- **Overview** [M1]
  - Tax selector Low / Normal / High (segmented). Hovering a segment shows its signed effect
    *before* the click: "High: +10.9 gold/mo, +4 unrest/mo" (`previewCommand`; AoW4, Civ VII;
    research-fourx §10).
  - PD row: `Provincial defense 6 · [+1 · 105 gold]`, and Shift+click buys 5 levels with the
    total printed. Hover shows the force each level adds (2 militia, 1 archer per 5 levels)
    (`pdCost`, `pdForce`). Buying is refused during a siege, with the reason shown.
  - Buildings: one row each for Temple, Lab and Fort. A row shows "Built", or "Building: 12
    days left", or a **Build** action button with its cost. A disabled button carries the
    condition block (needs a commander here, gold, owned province, one construction at a time).
    Fort rows read "New forts: M2" in M1.
  - **Wellspring banner** when applicable: scale bonus, owner, claimed by, and claim progress
    with the claiming priest.
  - **Active effects:** each ritual effect on the province, with spell, caster's nation, what it
    changes, and days left.
  - **Siege block** when besieged: walls `180 / 300`, bar, daily rates "−24 attack, +9 repair",
    days to breach (`siegeRates`). The **Storm** action button appears for the besieger. While
    the walls stand it confirms inline, with the defenders' +6 protection stated (docs/01: "strongly
    discouraged").
- **Recruit** [M1] (forts only)
  - Two bands: commanders above, troops below, each cheap to expensive from left to right
    (Dominions; research-dominions §1.3).
  - Unit cards show gold, materials, days and population. A batch-size stepper (1 to 50,
    default 10) sits above the troops band.
  - Click queues one batch of the chosen size. Shift+click queues the largest affordable batch,
    up to 50.
  - A card that cannot be recruited is dimmed and its tooltip says why ("Needs 80 materials,
    fort has 52"; "Unrest above 50"). No "recommended" badges (Civ VII 1.2.5;
    research-fourx §10).
  - Queue below: each row has a progress bar, days left and a cancel ×. A row that is waiting
    stays dimmed with its reason ("Waiting: needs 200 population, has 150"; "Paused:
    besieged").
  - Pool line: `Materials 52 / 360 · ▲60/mo · full in 5 mo`.
- **Forces** [M1]
  - Own commanders here, as cards. Click selects.
  - Garrison squads (under the garrison holder), draggable onto a commander.
  - The PD force composition.
  - Visible other forces: exact where seen, or the fogged word (weak, moderate, strong,
    fortress) with "Scout it to see exact numbers" (docs/01 §14).
- **History** [M1-should]
  - The message log filtered to this province. Messages already carry `province`. This is the
    analog of Dominions' Province Chronicles (research-dominions §1.2).

A foreign or independent province shows Overview and Forces read-only, plus History. Values the
nation has not explored show as "unknown" with a scout hint, never as zero.

#### 2.8.2 Commander panel

**Header:**
- A 64 px portrait with a pip ring: mana symbols around the frame, plus a holy mark for priests.
- Name, unit type, and badges (Pretender, Prophet, Scout, Stealthy).
- HP bar, morale value, and location or transit (`→ Ashfen, 4 days`).

**Tabs:**

- **Overview** [M1]
  - Stats, each with an L1 breakdown:
    - HP
    - morale, with the starvation and unpaid penalties as rows
    - a **leadership meter** `45 / 60 troops` (research-dominions §1.4)
    - map speed (the slowest squad wins)
    - supply eaten per day
    - upkeep per month
    - pips and holy pips
    - carried mana as symbols
    - research rate while researching
    - dominion checks while preaching or as prophet
  - The current order with its progress: ritual days, claim days, build days, or the move path.
  - **Give mana**, an action button with a color and amount picker. It appears only when the
    commander stands in an own lab. Elsewhere a disabled stub says "Needs a lab province".
  - A compact squad list (unit cards with count, HP %, row glyph).
- **Battle Plan** [M1] (Dominions 6's lesson: deploy and script on one screen;
  research-dominions §1.4, §1.5)
  - **Formation field.** Three columns, left to right `rear | middle | front`, with the
    enemy's side ghosted on the right. The back is on the left, as in Dominions' battle
    position box.
    - **Commanders are circles and squads are boxes** (Dominions).
    - A commander's ring shows its first scripted stance by glyph and color: Cast (the spell's
      mana color and symbol), Attack (crossed blades), Hold (shield), Retreat (arrow).
    - Drag a box between columns to call `setFormation`. Drag a box onto another commander's
      circle in the same province to call `transferSquad`. A count prompt appears when the
      squad has more than one troop; Shift-drag moves half.
    - A drop that breaks leadership is refused, and the refusal shows the reason.
    - Toggle **Whole army here** shows every own commander in the province in one field. It is
      on by default when more than one is present.
    - Toggle **At destination** [M1-should] shows, for a moving commander, the own commanders
      that will be in its target province when it arrives, from their ETAs (Dominions' "Army
      setup at destination (y)").
  - **Script timeline:**
    `[R1][R2][R3][R4][R5] [Round 6+: repeats slot 5]`. The greyed sixth cell states docs/04's
    rule on screen.
    - Each slot is a picker: Cast (spell or "Best available"), Attack, Hold, Retreat.
    - The spell list shows only spells this commander can cast, each with its fatigue cost
      *for this caster* (extra pips reduce it; docs/02 §3), its requirement as symbols, and a
      carried-mana badge.
    - "Show locked" lists the rest, dimmed, each with its reason ("needs RR, has R",
      "research Ember 3").
  - **Warnings in place.** A slot that cannot cast turns amber with the reason, and offers a
    one-click fix where one exists ("Give 1 R" when standing in a lab).
    - A **projected fatigue strip** shows rounds 1 to 5 against the 100 line: "faints in round
      4" (`scriptCheck`).
    - Dominions falls back silently to another spell, and players have to decode that from
      the logs (research-dominions §1.5).
  - **Presets** (chips that issue a normal `setScript`): Auto (five empty Casts, the mage
    default), Artillery (best damage spell ×5), Support (buffs, then Auto), Stand fast
    (Hold ×5), Charge (Attack).
  - **Copy script** and **Paste to all casters here**. `Ctrl+C` and `Ctrl+V` work while hovering
    a timeline. This makes Dominions' `Ctrl+digit` copy visible (research-dominions §1.5).
- **Rituals** [M1] (mages only; key `C`). See section 3.5.

#### 2.8.3 Army panel (several commanders selected, or a group)

**Header:** `3 commanders · 112 troops · speed 2 (Thornwood Archers)`, total supply eaten and
total upkeep.

**Body:** one card per commander, with the same row anatomy as the outliner. Click a card to
narrow the selection to it.

**Tabs:** Overview and Battle Plan. The Battle Plan formation field shows every selected
commander.

### 2.9 Bottom strip: the command surface

The strip appears only while something is selected (128 px wide layout, 120 px narrow). It holds
the **commands** for the selection. The left dock holds the information and the planning editors.
This follows HoI4's bottom-center army panel and its unit cards (research-paradox §9).

```
+----------+--------------------------------------+-----------------+-----------------------------+----------+
| portrait | squad cards (72x96, scroll if > 8)   | script summary  | order bar                   | ETA box  |
| name     | [sprite x18][sprite x10][...]        | Fb Fb Fb Hd Hd  | Idle Patrol Pillage Research| Ashfen   |
| HP  mor  | count, HP bar, morale bar, row glyph | -> repeats 5    | Preach Build> Claim Cast>   | 4 days   |
| pips     | status icons (max 3 + n)             | (click: Battle  | Prophet  Reverse  Storm     | Y1 M4 D2 |
|          |                                      |  Plan tab)      |                             |          |
+----------+--------------------------------------+-----------------+-----------------------------+----------+
```

- **Squad cards** use `UnitCard` (section 6), variant `squad`. Each card has two bars: HP %, and
  morale in a separate hue *and* pattern.
- **Script summary**: five glyphs (spell symbol in its color, blades, shield, arrow) plus the
  repeat marker. A slot with a problem gets a ! corner badge. Clicking opens the Battle Plan
  tab. So the summary is L0 and the editor is L3 (research-dominions §1.5).
- **Order bar**: one icon button per order. Each button's hover gives its effect per day
  *here*, for example "Pillage: +12 gold/day, −2% population/day, +5 unrest/day"
  (`provinceEconomy` pillage, `previewCommand`). Orders that cannot be given are disabled and
  show their condition block.
  - Orders: Idle, Patrol, Pillage, Research, Preach, Build ▸ (a popover of buildings with costs),
    Claim Wellspring, Cast ▸ (opens the Rituals tab), Make Prophet, Reverse, and Storm (only for
    a besieger).
  - Contextual orders that do not apply are hidden rather than greyed. Claim appears only in a
    Wellspring province, Storm only during a siege, Research only with pips. These are the only
    hidden actions, and each is reachable wherever it applies.
- **ETA box**: destination, days, arrival date. In transit: "Reverse (V)".
- **Several commanders selected**: one compact card per commander, the shared orders (an order
  is enabled when it is valid for at least one, and the tooltip lists who it applies to), and
  the slowest ETA. A group move takes the slowest speed (docs/01).
- **A province selected, no commander**: the commanders present, as cards (click selects).
  Province actions stay in the province panel.

### 2.10 The map

#### 2.10.1 Draw order

From bottom to top:
1. Parchment background
2. Province fills (terrain, or the active mode's fill)
3. Noise texture at 10%
4. 2 px borders
5. Ownership bands with keylines (docs/09)
6. Dominion candles
7. Labels
8. Effect glyphs
9. Siege rings
10. Path previews
11. Army badges
12. Transit arrows and ETA labels
13. Selection rings
14. Battle markers

The province tooltip and the cursor label are DOM overlays, positioned from Pixi coordinates by
one `Tip` system (section 5.1).

#### 2.10.2 Map modes (F1 to F6 in docs/07)

A mode **tints fills only**: about 70% opacity over a desaturated terrain fill. Borders, bands,
badges, labels and Wellspring icons stay at full contrast. Civ VII players complained that the
settler lens "masks the game map way too much" (research-fourx §4).

| Mode | Keys | Fill | Second channel (never hue alone) | Legend |
|---|---|---|---|---|
| Ownership (default) | Shift+1 / F1 | terrain; banners carry ownership | ownership bands, nation emblem on the band corner | banners with names |
| Dominion | Shift+2 / F2 | dominating nation's banner, 4 intensity steps by strength | candle count stays drawn; the number shows at Near zoom | candles 0 to 10 |
| Supply | Shift+3 / F3 | three steps: fed, tight (used above 80%), starving (used above available) | wheat glyph: full, half, crossed; hatching on starving | three glyphs with labels |
| Unrest | Shift+4 / F4 | four steps: 0 to 24, 25 to 49, 50 to 74, 75+ | hatch density grows per step; fist glyph from 25 | four swatches with hatch |
| Population | Shift+5 / F5 | five log-scale steps | label bar length (already log scale) | five swatches with ranges |
| Mana springs | Shift+6 / F6 | provinces with springs lit, others dimmed | spring symbols by color; `+n` dominion tint chip | the five symbols |

- **Mode strip** at the bottom right of the map: six icon buttons labeled with their keys, the
  active one highlighted, and a **legend chip** above it (CK3's map-mode menu; research-paradox
  §7). `M` cycles forward, `Shift+M` back. The province tooltip **leads with the active mode's
  value**, so the mode and the tooltip agree (research-fourx §4).
- **Keys:** Shift+1 to Shift+6 are primary. Browsers reserve some F-keys (F1 help, F5 reload,
  F6 address bar), and `preventDefault` on them is unreliable (research-ux §6). F1 to F6 are
  kept as a best-effort extra while the canvas has focus.
- **Contextual modes** are transient and revert when the action ends (Civ VI's placement lens,
  Vic3's lenses; research-fourx §4, research-paradox §7). Each is driven by its action, not by
  a button:
  - **Move targeting**, while a selection exists and a province is hovered: reachable
    provinces stay lit; unreachable ones (the path would cross a hostile province) get a 45°
    hatch.
  - **Ritual targeting** (section 3.5): valid provinces lit with the predicted effect as a
    label, invalid ones hatched, and a range ring. No "best target" highlight (Civ VII removed
    exactly that; research-fourx §4).
  - "Switch to Dominion mode when a priest or prophet is selected" is a setting, off by
    default. Civ VI players asked how to stop automatic lenses (research-fourx §4).
- **No information is zoom-gated** (CK3 DD #25; research-paradox §7). Every mode works at every
  zoom. Labels thin out, but nothing exists *only* at one zoom.

#### 2.10.3 Labels by zoom

The whole map (40 to 80 provinces) fits on screen at Far zoom, so zoom only changes density.

| Zoom band | Province label | Dominion | Army badges |
|---|---|---|---|
| **Far** (whole map) | name in small caps. On overlap, priority goes to capitals, Wellsprings, own provinces, then the rest | a number chip in the banner color | one badge per nation per province: total troops and a `×n` commanders count |
| **Mid** (default) | name, population bar, building icons (fort, temple, lab), Wellspring icon, spring symbols, unrest fist | candle stack | per nation, a stack that fans out on hover (docs/07) |
| **Near** | adds numeric chips: population `12.4k`, supply `140/212`, unrest `34` | candles and the number | always fanned |
| **Hold Shift** (alone, at least 250 ms), any zoom | numeric chips on every province, like Factorio's Alt mode (research-ux §2, §3.5) | number | unchanged |

#### 2.10.4 Army badges and stacks

- **Shape by allegiance**, so it does not rely on banner hue: rounded shield for own, notched
  shield for other nations, plain shield for Independents (docs/09, research-ux §5).
- The badge holds the troop count and a **status corner glyph**, one at a time, by priority:
  starving, unpaid, routed, besieging, casting a ritual, pillaging, moving. CK3 shows attrition
  as a skull on the army banner (research-paradox §9).
- **Stacks:** one badge per nation in a province, with a small `×3` count of commanders.
  - Hover fans the stack out into per-commander badges.
  - A click on the stack selects every own commander in it as one army.
  - A click on a fanned badge selects that commander. Shift+click adds it to the selection.
  - **Shift+LMB drag** box-selects own badges. A plain drag pans the map. Dominions 6 added drag
    selection and players praised it (research-dominions §1.4).
- **Selected** badges get a bright ring, and their path shows as a solid line.
- **Moving armies** slide along the edge with an arrow and a `4d` ETA label (docs/07). This is
  shown for own armies and for **visible enemy armies** (their current leg only), which
  telegraphs the threat the way Into the Breach does (research-ux §2). Enemy paths beyond the
  current leg are never shown, so fog never leaks.
- **Battle markers:** a crossed-blades glyph sits on a province for 30 days after a battle the
  player took part in. Clicking it opens that battle's report card (section 4.2).

#### 2.10.5 Moving: previews, ETA, right-click orders, multi-province paths

- With commanders selected, **hovering a province** previews the move.
  - A dashed path runs along the province centers, with a dot per province labeled with
    cumulative days.
  - The path comes from `findPathFor`, so the preview always matches what move validation
    accepts (PROGRESS: "The UI and AI should use findPathFor").
- The **cursor label** (DOM, next to the cursor, never over the target; Civ VII's tooltip
  covered the tile, research-fourx §1) prints the decision data (principle 2):

  ```
  Ashfen · 6 days · arrives Y1 M4 D2
  Supply there: 212 eat / 140 → starving
  Hostile: independents, "moderate"   Strength 1.8 : 1 (estimate)
  ```

  - Where no path exists the label says why: "No path: the route crosses hostile Ember Ford."
- **Right-click** issues the move, through `validate` then `apply`.
  - On a hostile province the cursor shows crossed blades: the move ends there and fights on
    arrival (docs/01).
  - Right-click on the selection's own standing province cancels its move (order Idle).
  - A new path given in transit starts from the end of the current leg (docs/01).
- **Shift+right-click appends a waypoint** (StarCraft II and Total War queue with Shift;
  research-ux §6).
  - Each waypoint adds a `findPathFor` leg from the previous one, joined into one `move` path.
  - Only the last province may be hostile, so a hostile waypoint is refused in the cursor
    label, with its reason, before the click.
  - Releasing Shift and right-clicking again starts a fresh path.
- **Reverse** (`V`, or the strip button) reverses the current leg (docs/01). The preview shows
  the days back.
- **Several commanders moving together** take the slowest speed. The label names the slowest
  unit: "speed 2 (Thornwood Archers)".

#### 2.10.6 Province hover tooltip and the engagement preview

**With nothing selected**, hovering a province shows the province card (docs/07's fields). It
leads with the active mode's value, then:
- name, owner, terrain
- population, supply used / available, materials, unrest
- springs and the dominion holder
- active effects
- defenders: the fogged word, or exact numbers where scouted

Shift expands every number into its breakdown. The name label appears instantly; the full card
waits for the delay (research-ux §3.1).

**With commanders selected and a hostile province hovered**, the cursor label grows into a
compact **engagement preview** card. AoW4 shows "exactly who will be involved and what outcome
is expected" on hover (research-fourx §7).
- **Both sides**, as mini unit cards: own forces exactly; enemy forces as visible, or the fog
  band ("about 16 to 23 troops, unscouted").
- **Modifier chips**: terrain defense, fort and walls (+6 protection while standing, +3 when
  down), province scales (Fury and Lore steps, Dread), the starvation and unpaid morale
  penalties, Rootwall.
- **Strength bar** labeled "Estimate", computed from `armyPower` (docs/08's formula, moved into
  the sim, section 7.2), the same number the AI uses.
  - Under fog the bar shows a range across the strength band.
  - **The resolver is not run for this in M1.** Forecasts that miss destroy trust (Total War,
    Songs of Conquest; research-dominions §4). Running the resolver on true enemy strength would
    also leak fog.
  - [Later] A trial forecast that runs `resolveBattle` about 20 times in a Web Worker, on a setup
    built only from what the player can see and with seeds the UI owns (never `state.rng`). It
    would show "Likely victory (17 of 20) · your losses 3 to 7". Show ranges only.
- **Script check**: each own caster's first two slots with a ✓ or an amber ✗ and the reason.
- Footer: `Right-click attack · Edit battle plan ▸`.

#### 2.10.7 Fog

- **Unexplored provinces:** terrain silhouettes under a parchment haze, with a dotted border.
  The map reads before it is scouted (AoW4's mist; research-fourx §4).
- **Explored but not in sight:** a desaturated fill and dotted border. Army badges show only
  where the nation sees.
- **Fogged values** read as "unknown" (population, springs) or as the strength word
  (independents; docs/01 §14). A fogged value is never shown as zero.

---

## 3. The other screens

Each screen below has a layout and a table of where each detail lives. The layers are the same
as in section 1. Full screens (Main Menu, New Game, Pretender Design, Victory) replace the game
screen. Modals (Research, Ledger, Codex, Settings, Game Menu, replay) sit over it, one at a time,
and pause the game (section 2.4).

### 3.1 Main Menu [M1]

```
+------------------------------------------------------------------+
|                       FLUID MAGIC (logo)                         |
|   [Continue]   Cinder Horde · Y3 M7 D2 · Medium · autosave       |
|   [New Game]                                                     |
|   [Load]                                                         |
|   [Settings]                                                     |
|   [Codex]                                                        |
|   [About]                                                        |
|                 background: a slow pan over a generated map      |
+------------------------------------------------------------------+
```

| Detail | Layer |
|---|---|
| Continue target (nation, date, size) | L0 on the button; hover shows the map thumbnail and real-time age |
| Codex | L4. Reachable before a match, so a player can read about colors and units first |
| Volume, speed presets (docs/07) | Settings (section 3.9) |

Enter activates Continue. Without an autosave the button is disabled and says why.

### 3.2 New Game [M1]

```
+------------------------------------------------------------------------------------+
| New Game                                                                           |
+-------------------------------------------+----------------------------------------+
| WORLD                                     | YOUR NATION                            |
| Map size  [Small 40] [Medium 60] [Large 80]| [Cinder Horde card] [Thornwood card]   |
|   (count for 2 nations; +25 each extra)   |  banner + mana symbol, summary,        |
| Seed      [  48213  ] [dice] [copy]       |  playstyle tags, capital and terrain   |
| Opponents                                 |                                        |
|   1 [Thornwood v]  [Normal v]  [x]        | GUIDANCE                               |
|   [+ Add opponent] (up to 3)              | (o) Guide me  ( ) Hints only  ( ) Off  |
+-------------------------------------------+----------------------------------------+
| [Back]                                             [Next: Design your god  (Enter)] |
+------------------------------------------------------------------------------------+
```

| Detail | Layer |
|---|---|
| Nation summary, playstyle, capital | L0 on the card |
| Starting army, the two fitting chassis, unit roster | L1 hover on the card |
| Full unit and spell lists | L4 Codex link on the card |
| Province count for the chosen size and nation count | L0 under the size buttons |
| Difficulty effect ("Easy: AI income ×0.8, plans every 10 days, no wars before month 12") | L1 on the difficulty picker (from `DIFFICULTIES`) |
| Guidance effect | L1 on each option (section 5.5) |

M1 allows duplicate nations among opponents (docs/07). A duplicate shows its numbered name and
second banner (docs/09).

### 3.3 Pretender Design [M1]

The signature pre-game decision. It should feel like building an MTG commander (docs/05). Keep
Dominions' economy and modernize its controls. Dominions uses left-click to buy and right-click
to sell, and only reports an invalid bless at game start (research-dominions §1.6).

```
+---------------------------------------------------------------------------------------------+
| Thornwood · Design your god   Presets: [Elder Oak] [Deep Root] [Wyrm of the Loam]           |
| Budget  400 + 150 = 550   [chassis|pips|dominion|scales.......|    ] 512 spent · 38 left     |
+----------------------+-----------------------------------------+----------------------------+
| CHASSIS              | COLOR PIPS                              | SUMMARY CARD (live)         |
| [Oracle      20]     |  W [-] ○○○○○○ [+60 new color]           |  [portrait tinted by pips]  |
| [Titan      120] fit |  U [-] ○○○○○○ [+60 new color]           |  Elder Oak · Titan          |
| [Great Wyrm 220]     |  B [-] ○○○○○○ [+60 new color]           |  pips: G G G G              |
|   dormant advised    |  R [-] ○○○○○○ [+60 new color]           |  dominion: 5 candles        |
| [Monolith    60] fit |  G [-] ●●●●○○ [+35]   base: 1 (lock)    |  scales: five 2-color bars  |
| [Wild Spirit 80]     |     Bless at 4: regeneration 10%, +1 prot|  bless: regeneration...    |
| [Ash Colossus100]    | DOMINION [-] 5 candles [+30]            |  arrives: day 1, Deepmoss   |
|                      |   spreads to about 7 provinces by Y2    |  "A patient, rooted god.    |
|                      | SCALES  Order  W o--+--o R Turmoil  ...  |   Expect slow growth..."   |
|                      | AWAKENING (o) Awake ( ) Dormant +150 ( ) Imprisoned +350             |
+----------------------+-----------------------------------------+----------------------------+
| [Back]   [Save design] [Load design]                                     [Start game]       |
+---------------------------------------------------------------------------------------------+
```

- **Steppers print their prices.** A pip row reads `[−] ●●●●○○ [+35]`.
  - The plus button shows the next step's price, or "+60 new color" for a first pip outside the
    nation's identity (50 for the Oracle).
  - Base pips from the chassis carry a lock glyph. The minus button disables at the base, and
    its tooltip says why.
  - The dominion stepper prints +30 per candle and disables at the chassis base.
- **Scales** are five two-pole sliders from −3 to +3.
  - The pole names and mana symbols sit at the ends, and the ticks print step prices: 20 toward
    the nation's colors, 40 against.
  - A step against the grain carries a warning glyph (docs/05: warn but allow).
  - Hovering a tick lists that step's effects, from the content scale table.
  - Under each slider, a one-line summary of the current setting: "Turmoil 2: recruit time
    −20%, unrest +4/month".
- **Live consequences, never at game start:**
  - The bless line appears the moment a color reaches 4, and doubles at 6 (docs/02 §8).
  - The dominion estimate "about N provinces by Year 2" (`score × 1.5`, docs/05) updates with
    the candles.
  - The awakening cards show the arrival date: Awake, day 1; Dormant, Y1 M12 D1 (day 330);
    Imprisoned, Y3 M12 D1 (day 1050).
- **Validation is inline.** One `checkPretender` (section 7.2) returns every check. Invalid
  states cannot be reached, because each control that would reach one is disabled with its
  reason.
  - Start Game with unspent points confirms inline: "38 points unspent are lost. Start
    anyway?" This is one of the few confirmations (section 5.7).
- **Presets** fill the whole design in one click. Each preset's tooltip shows its summary card
  reading and its cost (385, 280, 415, ...). Presets are the easy start (docs/05).
- **Save design and Load design are visible buttons.** Ctrl+S on this screen is only an
  accelerator. In Dominions 6 they became hotkey-only, and a new player could not find them
  (research-dominions §1.6).
- **Chassis cards:** the hover card shows the full body stats (L1). Click selects. The two
  chassis that fit the nation get a "fits Thornwood" badge (docs/05). The Great Wyrm card carries
  "dormant start advised".

| Detail | Layer |
|---|---|
| Budget arithmetic and points left | L0 budget bar |
| Spend by category | L1 on the budget bar segments (each segment has a label as well as a tone) |
| Chassis cost, base pips, base dominion | L0 on the card |
| Body stats, notes, abilities (flying, fire shield, regeneration) | L1 chassis hover card; L2 concept terms; L4 Codex chassis page |
| Next-step price | L0 on every stepper and slider tick |
| What a pip level gives (casting, research, bless) | L1 on the pip row; L2 terms Pip, Bless, Sacred |
| Scale step effects | L0 summary line; L1 tick hover with the full per-step list |
| Arrival date | L0 on the awakening card and the summary card |
| The reading | L0 on the summary card |
| Why a control is disabled | L1 condition block |

The summary card is one component, `PretenderCard`. It appears again in the top bar's nation
tooltip, in the Ledger's Nation tab, and on the victory screen.

### 3.4 Research [M1] (modal, key R)

Five tracks, one per color, levels 1 to 6. That is simpler than any tech tree, because there are
no connector lines to draw (research-fourx §8).

```
+-----------------------------------------------------------------------------------------+
| Research   38 RP/month · 4 mages in 2 labs                                     [x Esc] |
+-----------------+-----------------+-----------------+-----------------+-----------------+
| W Radiance      | U Tide          | B Umbra         | R Ember  ACTIVE | G Loam          |
| L0  0/60        | L0  0/60        | L0  0/60        | L3 210/300 47d  | L1  80/150      |
| [Research this] | [Research this] | [Research this] | (outlined)      | [Research this] |
+-----------------+-----------------+-----------------+-----------------+-----------------+
| L1 (M2 spells)  | L1 (M2 spells)  | L1 (M2 spells)  | L1 Ember Dart   | L1 Thorn Spray  |
|                 |                 |                 |    Call Fire Sp.| ...             |
| ...             |                 |                 | L4 Bind Salam.  |                 |
|                 |                 |                 |   "Castable by  |                 |
|                 |                 |                 |    1 of yours"  |                 |
+-----------------+-----------------+-----------------+-----------------+-----------------+
| Thresholds 60 · 150 · 300 · 500 · 750 · 1050. Points past level 6 are lost.            |
+-----------------------------------------------------------------------------------------+
```

- **Column header:** symbol and element name; current level; a progress bar to the next level
  with points; days at the current rate when active. The active column is outlined in its mana
  primary *and* labeled "ACTIVE" (hue plus word). Clicking the header or **Research this**
  issues `setResearchColor` (docs/07).
- **Level rows** hold **spell cards** (section 6). Each card shows its kind (Battle or Ritual),
  its requirement as symbols, a one-line effect, and its cost (fatigue, or mana and days).
  - Each card also says **"Castable by N of your mages"**, or "No mage has RR". Research and
    mage recruitment are then planned together (research-fourx §8).
  - Researched levels are drawn in full, the next level is highlighted, later ones are dim.
- **W, U and B in M1:** their levels are shown without spell names, reading "Spells arrive in
  M2" (docs/02 decision).
- The **header's RP figure** has a breakdown on hover: each researching mage as a link, its
  pips and lab, the Lore or Fury factor, and its RP per month (`explainResearch`). Dominions
  hides this behind the F5 screen's bars (research-dominions §1.7).
- **No researchers:** the header shows an attention badge and a link, "Order a mage to
  research ▸", which opens the outliner's Mages section.
- [Later] A queue of colors (research R to 4, then G to 2). Dominions 6 players praise its queue
  (research-dominions §1.7). It needs a sim change, so it is recorded in section 9.

| Detail | Layer |
|---|---|
| Active color, level, days to next | L0 top bar; L0 column header |
| RP sources | L1 header breakdown |
| What a level unlocks | L0 spell cards in the row |
| Full spell effect, cost for a given caster | L1 card hover (capped height); pinned L2 shows the primitives |
| Who can cast it | L0 line on the card; L1 lists the mages as links |
| Spell reference | L4 Codex (Ctrl+click or right-click the card) |

### 3.5 Rituals [M1] (docked: the commander panel's Rituals tab, key C)

docs/07 calls this a modal with a map target picker. A modal over the map contradicts picking on
the map, so the ritual list is docked and targeting happens on the map (research-ux §10).

```
Left dock, Rituals tab                         Map, in targeting mode
+------------------------------------+         +--------------------------------------------+
| Varo the Ember  R2 · in lab: yes   |         |  valid provinces lit, with labels:         |
| [R][G]  [Summon][Province][Remote] |         |   "Supply 140 -> 280 for 6 mo"             |
| > Call Fire Sprites  R   {R}{R} 5d |         |  invalid provinces hatched                 |
|   Forge of Cinders   RR  {R}x3+1   |         |  range ring from the caster's province     |
|   Burn the Fields    RR  {R}x4+2   |         |  hover: full prediction tooltip            |
|   ...  [Show locked (2)]           |         |  click: pick target   Esc: cancel          |
| Target: Ember Ford   [change]      |         +--------------------------------------------+
| Pay: R R R R + (R)(G)   [edit]     |
| Pool after: R 6 · G 2              |
| [Cast Burn the Fields · 10 days]   |
+------------------------------------+
```

- **Caster line:** pips, whether it stands in an own lab, its current order. Outside a lab a
  banner reads "Rituals are cast in a lab province you own. Nearest: Kharnath, 6 days ▸",
  and the link previews that move.
- **Filter chips:** color symbols and effect groups (Summon / Province / Remote / Utility). The
  AoW4 spell book was criticized as one long unsortable list (research-fourx §9).
- **Rows:** name, requirement, cost as MTG-style symbols (colored pips first, then a grey
  generic circle with the number), days, reach ("own province", "within 3", "owned within 2"),
  and a one-line effect. Locked rituals sit under "Show locked", each with its reason
  (`castBlocker`).
- **Targeting:** selecting a ritual that takes a target enters map targeting mode
  (section 2.10.2).
  - Valid targets come from `ritualTargets`, so the map offers exactly what the command
    accepts.
  - Each valid province is labeled with its **predicted effect** from `predictRitual`, for
    example "−6% pop (−430)" or "Supply 140 → 280 for 6 months".
  - A province that already holds this spell's effect is hatched, and its tooltip says why:
    "Cannot stack: Fertile Season until M9".
  - Rituals cast on the caster's own province skip targeting.
- **Payment:** the colored part is fixed. The generic part shows the default split (the spell's
  color first, then the largest other pools; docs/02). **Edit** opens a stepper per color,
  constrained to the pool. "Pool after" updates live.
- **Cast** is an action button with cost and days. While the clock runs it confirms inline:
  "Mana is spent now. Another order, a retreat or death loses it." While paused, undo covers it
  (section 5.7).
- **In progress:** a progress bar with days left. **Stop** sets the order to Idle and confirms
  inline that the mana is lost.

| Detail | Layer |
|---|---|
| Castable rituals for this caster, cost, days, reach | L0 rows |
| Full effect, primitives in words | L1 row hover; L4 Codex |
| Why one is locked | L1 condition block (`castBlocker`) |
| Valid targets and predicted effect | L0 map labels in targeting mode; L1 province tooltip with full numbers |
| Payment split, pool after | L0 payment row; edit at L3 |

### 3.6 Ledger [M1] (modal, key L) — new

One sortable, filterable screen answers "show me all X" (EU4's Ledger; Dominions' F1 Nation
Overview with the search and filters its reviewers asked for; research-paradox §8,
research-dominions §1.11). It is also a control surface: inline PD purchase and tax, as
Dominions' F1 lets you buy PD.

| Tab | Columns | Filters | Inline actions |
|---|---|---|---|
| **Provinces** | name, terrain, pop, growth, gold, materials, supply used / available, unrest with delta, dominion (banner, strength), PD, buildings, springs | own / visible / all; starving; unrest > 30; no temple; besieged; enemy dominion | tax selector, PD +1 |
| **Commanders** | name, type, role, location, order, troops / leadership, HP, morale, supply state, script state, upkeep | idle; starving; script problem; mages; priests; scouts | Jump, Select |
| **Forts** | fort, materials pool / cap, rate, months to cap, queue head and length, garrison troops, PD, siege | — | Jump to Recruit tab |
| **Magic** | mana per color (stock, income, sources per spring); rituals in progress; **active effects** (own and visible enemy): spell, province, owner, days left | own / enemy; by color | Jump |
| **Battles** | date, province, result band, sides, losses each side | won / lost | **Watch**, Report |
| **Nations** | own nation: `PretenderCard`, effective scales, bless, Godless state; every known nation: provinces held, Wellsprings claimed, eliminated (public facts only, no fog leak) | — | Jump to capital |

- Clicking a column header sorts by it. Rows jump to the map. A search box filters by name.
- Clicking a top-bar readout opens the Ledger on the matching tab, already sorted (section 2.3).
- The Magic tab's active-effects list is Dominions' F6 Global Enchantments analog
  (research-dominions §1.8). It replaces a separate Active Effects screen, so there is one
  screen fewer.

### 3.7 Messages and their settings [M1]

The feed is in section 2.7 and the per-type matrix in section 5.3. Settings → Messages holds the
matrix, and every feed row's gear opens its type's row inline.

### 3.8 Victory and Defeat [M1]

```
+-------------------------------------------------------------------------------+
|  VICTORY · Y3 M2 D18 · Thornwood claims 2 of 3 Wellsprings                    |
|  [PretenderCard]       Nation      Prov  Pop    Won/Lost Taken Wells  Mana spent W U B R G |
|                        Thornwood   24    212k   11/3     17    2      .  .  .  4  96 |
|                        Cinder H.   9     71k    4/9      6     0      .  .  .  58 .  |
|  Your battles: [Ashfen M4 Won  Watch] [Ember Ford M9 Lost  Watch] ...         |
|  [View map]                          [New game]          [Return to menu]    |
+-------------------------------------------------------------------------------+
         (the final map stays drawn behind, dimmed; View map hides this panel)
```

- **Result and reason:** Wellsprings, last capital, or player defeated (`GameResult`). The stats
  come from `nationSummary`: provinces held, population, battles won and lost, provinces
  taken, Wellsprings, mana spent per color drawn as symbol bars (docs/07).
- **View map** hides the panel. The map stays inspectable read-only: tooltips and map modes
  work, orders do not. "Back to results" returns.
- The battle list opens each replay (records are kept only for the player's battles; PROGRESS
  Phase 4).

| Detail | Layer |
|---|---|
| Result, reason, date, headline stats | L0 |
| Per-color mana spent numbers | L1 on the bars |
| Battles | L0 list; replay at L4 |

### 3.9 Settings [M1] (modal; from the Main Menu and the Game Menu)

Six tabs. Every setting has a one-line explanation on hover. UI settings live in local storage
and in the save file's UI block, never in `GameState`.

| Tab | Settings |
|---|---|
| **Game** | Speed presets: days per second per speed, defaults 1/2/4/8 (docs/01). Pause when a modal opens (on). Resume after closing an auto-pause popup (off). Autosave every 30 game days (on, docs/06). Confirmations: reset "Don't ask again" |
| **Messages** | The per-type matrix (section 5.3). Muted alert types with Restore |
| **Interface** | UI scale 80 to 200%. Text size 90 to 150%. Tooltips: mode (Hover / Key only / Off), delay (0 to 1500 ms), lock (Timer / Action), lock timer (0.8 s), nested tooltips (On / Off). Detail key: Hold Shift / Toggle. Always show detailed tooltips (off). Guidance: Guide me / Hints only / Off; Reset hints. Auto map modes for priests (off) |
| **Accessibility** | Reduced motion (follows the OS). Screen shake 0 to 100% (50%). Gore (Off / Reduced / Full). Captions (Off / Events / Events + sounds). Visual sound cues (on). Pattern overlays in map modes (off). High-contrast borders (off). Letters on mana symbols (off). Banner colors (picker, validated against the palette rules). Flash limit (always on, shown as information) |
| **Audio** | Master, music, battle SFX, UI cues, alert cues. M1 lists sound as out of scope, but the owner's later direction asks for battle SFX, so the tab exists and its levels drive the battle presentation |
| **Controls** | Every action with its key or keys. Rebind per context (map, panel, replay). Conflicts are refused, and so are browser-reserved keys (section 5.4). Reset to defaults |

### 3.10 Game Menu, Save and Load [M1]

`Esc`, when nothing else is open, or the top bar's menu button opens the Game Menu: Resume, Save,
Load, Settings, Codex, Quit to Menu.

- **Save** shows three slot cards (nation, game date, real date, a thumbnail) plus the read-only
  autosave card. Overwriting confirms inline. Ctrl+S saves to the last used slot and shows a
  toast "Saved to slot 2" (docs/06: 3 slots plus autosave).
- **Load** uses the same cards. Loading over a game with unsaved play confirms inline.
- **Quit to Menu** with unsaved play confirms inline. A `beforeunload` prompt guards the tab
  while there is play since the last save (research-ux §6).

---

## 4. Battle reports and the replay frame

The battle presentation (per-blow detail, gore, sound) is designed separately. This section gives
it a frame. The frame does three things: the replay follows the same rules, components and keys
as the rest of the UI; the stage gets most of the screen with minimal chrome; and every panel
can collapse.

### 4.1 How a battle reaches the player [M1]

Battles resolve inside the tick (docs/01 §10). The player meets one in two steps: a **report
card** first, then the optional **replay**. Dominions does the same: the summary with casualty
lists first, then "View battle" (research-dominions §1.10, §4.4). Most battles should be
readable in five seconds without watching anything.

| Entry point | Opens |
|---|---|
| Auto-pause popup (default for battles the player fought, section 5.3) | report card, centered over the map |
| Feed row | report card. The row's **Watch** button goes straight to the replay |
| Battle marker on the map (30 days) | report card |
| Ledger, Battles tab; province History tab; victory screen | report card or Watch |
| Report card's **Watch replay** (Enter) | replay modal |

Records exist only for the player's battles (PROGRESS, Phase 4). Battles between AI nations show
in the feed (when visible) with no Watch button.

### 4.2 The battle report card [M1] (`BattleReport`)

The same component is the replay's end card. Closing the replay returns to it.

```
+-------------------------------------------------------------------------+
| CLEAR VICTORY · Battle of Ashfen · Forest · Y2 M4 D11                   |
| You attacked · 23 rounds · ended: their army routed                     |
+------------------------------------+------------------------------------+
| YOU · Thornwood · attacker         | INDEPENDENTS · defender            |
| [Warden 20 -> 17] [Archer 15 -> 15] | [Militia 24 -> 0  15 killed, 9 routed] |
| Ilwen of the Grove: HP 80%         | Independent Captain: slain, round 12 |
| Spells: Thorn Spray x4, Bark Skin x1|                                    |
+------------------------------------+------------------------------------+
| Why: their front routed in round 9 after Thorn Spray x3.                |
|      Their captain fell in round 12; the rest broke at once.            |
| Conditions: [Forest +1 def, defender] [Thornwood: +1 def in forest]     |
| After: Ashfen taken · population -0.4% · unrest +10 (lost battle)       |
| [Watch replay  Enter]      [Go to Ashfen]               [Close  Esc]    |
+-------------------------------------------------------------------------+
```

- **Outcome band:** Decisive, Clear, Narrow or Pyrrhic victory; Narrow, Clear or Crushing
  defeat. It is computed from survivor ratios by `summarizeBattle`. Thresholds are content
  (`BATTLE_REPORT` in `src/content/rules.ts`). Total War names its outcomes the same way, for
  example "Pyrrhic victory" or "Close defeat" (research-dominions §4.1).
- **Unit cards, report variant:** start → end, and losses split into **killed** and **routed**
  (CK3 splits fatal from routed casualties; research-paradox §10).
- **Commanders' fates**, spells cast with counts, and how the battle ended (rout, wipe-out,
  round-50 retreat).
- **"Why" bullets**, at most three, from `summarizeBattle`'s key moments: first rout, commander
  deaths, the most damaging spell, the round-50 retreat, starvation or unpaid morale. Dominions
  logs leave out modifiers, and players have to reconstruct them (research-dominions §1.10).
- **Conditions:** the same chips as the replay header (section 4.3).
- **After:** the consequences the sim applied: capture, retreat destination, population and
  unrest changes (docs/01 Phase 4 rules).

| Detail | Layer |
|---|---|
| Result, sides, counts, fates | L0 on the card |
| Unit stats, a modifier's numbers | L1 hover on cards and chips |
| What happened, round by round | L4 replay |
| Every roll and modifier | replay log, detail level 4 |

### 4.3 The replay modal

The replay is a full-viewport modal. Its skeleton reuses the game screen's: a header where the top
bar was, rosters where the docks were, transport where the bottom strip was. It is the same game
in a different mode (research-dominions §5, research-paradox §10).

```
+--------------------------------------------------------------------------------------------+
| Battle of Ashfen · Forest · Y2 M4 D11 · Round 7/23 · MELEE                                 |
| [Forest: defenders +1 def] [Thornwood: +1 def in forest] [Loam bless: sacred]   [<] [>] [cc] [gear] [x] |  40px
+-----------+------------------------------------------------------------------+-------------+
| YOU       |                                                                  | LOG         |
| Thornwood |                                                                  | [1][2][3][4]|
| attacker  |                                                                  | R7 Thorn    |
|           |                          STAGE                                   |  Spray ->   |
| Ilwen     |            (BattleRenderer, owned by the presentation)           |  Militia    |
|  HP ====  |                                                                  |  6 killed   |
|  fat ==|  |     rear | middle | front   ||   front | middle | rear          | R7 melee    |
|  R3 Thorn |        (you, left)                (enemy, right)                 |  Wardens -> |
|  [squads] |                                                                  |  Militia 3  |
|-----------|                                                                  |             |
| ENEMY     |  ............ captions: "Thorn Spray: 6 militia fall" ..........  |             |
+-----------+------------------------------------------------------------------+-------------+
| |<   <R   [ || ]   R>   >|    0.5x  1x  [2x]  4x    [==|==*===x=====F==|===]   Round 7 / 23 |  56px
+--------------------------------------------------------------------------------------------+
```

**Sizes.**
- Wide layout: rosters 240 px each, log 280 px, open.
- Narrow layout (below 1600 px): rosters start as 64 px **live rails** and the log is closed.
  The stage is then 1152 px wide at 1280 (90%), or 872 px (68%) with the log open.
- **Cinematic mode** (`H`, or idle with the setting "Cinematic when idle") gives the stage the
  whole viewport (below).

**Header** (40 px; the same chrome tokens as the top bar):
- Battle name, terrain, date, and which side attacked (written as text as well as by position).
- **Condition chips** for every modifier the setup folded in (docs/04 "Read-only setup" and
  "Modifiers"):
  - terrain defense, Thornwood's forest defense, the swamp attack penalty
  - fort storm (+2 morale, +6 protection while the walls stand, +3 after)
  - province scales by name and step: Fury, Lore, Dread
  - starvation and unpaid-upkeep morale
  - Rootwall and other defense effects
  - the bless on sacred units

  Each chip's tooltip gives its numbers. This is Dominions' F2 "weather and dominion scales"
  panel, always visible (research-dominions §1.10). **Field effects** (storm, fog, wall) appear
  as chips when cast and leave at `fieldEnd`.
- **Round and phase label** (Spells, Ranged, Melee, Morale), from the event stream. CK3 names
  its battle phases the same way (research-paradox §10).
- Buttons: roster toggle `[`, log toggle `]`, captions, settings (gear), close (×, Esc).

**Rosters** (left: always the player, labeled Attacker or Defender; right: the enemy). Dominions
fixes the attacker on the left. In a single-player game "you are on the left" is the more useful
constant, and it matches the left dock (research-dominions §5).
- **Commanders:** portrait, HP bar, fatigue bar for casters with the 100 line marked, and the
  **current script step** with its five slot pips (the current one lit): `R3: Thorn Spray`.
  HoI4 shows each general's chosen tactic beside the general (research-paradox §10). States
  read as a word plus a glyph: routing, exhausted, slain.
- **Squads:** `UnitCard`, replay variant:
  - live count over the starting count
  - killed and routed tallies
  - row glyph
  - a morale state glyph (steady, shaken, routing)
  - buff and curse icons, each with a tooltip naming its source and last round

  **Click a squad to focus it**: the stage highlights it, and the log filters to it
  (Dominions' `v`, research-dominions §1.10).
- **Tab** highlights every commander on the stage (Dominions 6; research-dominions §1.10).
- **Live rail** (collapsed state): banner, a side total bar (living over starting troops),
  commanders' HP pips and a routing count. Hovering expands it as an overlay without resizing
  the stage.

**Stage.** The presentation owns it (section 4.4). The frame guarantees its rectangle and a
one-line **captions strip** along its bottom edge. Screen shake moves the stage canvas only. The
chrome never shakes, so the numbers stay readable.

**Log** (right, collapsible):
- **Detail levels**, set with the `1` to `4` chips in the log header or cycled with `D`:
  1. kills, routs, commander deaths
  2. adds spells, buffs and curses, field effects
  3. adds volley and melee summaries
  4. adds every `damage`, `heal`, `fatigue`, `expire`, `advance` and `leave` event

  Dominions has four log levels (research-dominions §1.10). Level 4 answers the complaint that
  its logs hide modifiers. FM's replay events (docs/04) already carry what each level needs.
- **Lines** read: round, icon, actor → target, result. Spell lines carry the mana symbol.
  Hovering a line highlights both units on the stage. Clicking it seeks there.

**Transport** (56 px):
- Buttons: start (`Home`), back one round (`←`), play or pause (`Space`), forward one round
  (`→`), skip to end (`End`). `Shift+←` and `Shift+→` step one event.
- Speeds 0.5×, 1×, 2×, 4× (docs/07), on keys `1` to `4`: digits set the speed of time on the
  map and in the replay alike. 1× is one round per 1.5 s (docs/04).
- **Scrubber** with round ticks and **markers**: a spell cast (its mana symbol), a commander
  death (✕), a rout (flag), the round-50 retreat, the end. Hovering a marker shows its event;
  dragging seeks.
  - Seeking uses `foldReplay` to rebuild the state at that point, which is cheap and exact
    (docs/04). The stage shows that state without animating the skipped events.
- The replay never blocks input: panning and scrubbing stay responsive at every speed. In
  Dominions 5, scrolling lagged at fast replay speed (research-dominions §1.10).

**Cinematic mode** (`H`):
- Hides the header chips, the rosters and the log.
- The transport shrinks to a 6 px progress line. It grows back when the mouse moves, and fades
  after 2 s without movement.
- Captions stay if they are on. `H` or `Esc` restores the chrome.

This is where the visceral presentation gets the whole screen.

**End and close:**
- At `battleEnd`, playback stops. After 1 s the **report card** slides in over the stage
  center, with Replay again, Go to province, and Close. Skip to end shows it at once.
- Close (`Esc` or ×) returns to where the player came from (the report popup or the feed). It
  restores the speed active before the replay opened, which is "paused" after a battle
  auto-pause.

**Settings popover** (gear): Gore (Off / Reduced / Full), Screen shake (0 to 100%), Captions
(Off / Events / Events + sounds), Battle SFX volume. Reduced motion shows read-only, because it
follows the global setting. These are **the same settings** as Settings → Accessibility and
Audio, stored under the same keys, so changing them here changes them everywhere.

**Accessibility inside the replay** (binding on the presentation design):
- **Flash limit:** at most 3 flashes per second across the viewport; no bright flash covers more
  than a quarter of the viewport; no saturated red full-screen flashes (WCAG 2.3.1;
  research-ux §11). This limit cannot be turned off.
- **Reduced motion:** lunges become short highlights, the rout slide becomes a fade, damage
  numbers fade in place, shake is 0.
- **Color without hue:** spell particles include their color's glyph (tiny flames for Ember,
  leaves for Loam), so a color-blind viewer can still tell the spell's color (research-ux §12).
- **Captions** stand in for sounds. Every sound that carries information (volley, clash, spell,
  rout, commander death) has a caption chip when captions are set to "Events + sounds"
  (XAG 103; research-ux §11).

**Replay keys** (the replay context; section 5.4):

| Key | Action |
|---|---|
| Space | play / pause |
| 1 to 4 | 0.5× / 1× / 2× / 4× |
| ← / → | back / forward one round |
| Shift+← / Shift+→ | back / forward one event |
| Home / End | start / end (end shows the report card) |
| `[` / `]` | rosters / log |
| D | cycle log detail |
| Tab | highlight all commanders |
| H | cinematic mode |
| ? | replay key overlay |
| Esc | close the top layer: tooltip, cinematic mode, then the replay |

### 4.4 Contract between the frame and the stage

The frame owns time, layout and settings. The stage owns drawing and sound. The stage reads only
the `BattleRecord`, never live state (docs/04: "The viewer needs nothing from live state").

```ts
interface BattleStageProps {
  record: BattleRecord;                       // roster plus events (docs/04)
  cursor: { round: number; event: number };   // set by the transport and scrubber
  playing: boolean;
  speed: 0.5 | 1 | 2 | 4;
  focus: BattleUnitRef | null;                // a squad clicked in a roster
  highlight: readonly BattleUnitRef[];        // log hover, Tab
  rect: { width: number; height: number };    // changes when panels collapse
  settings: {
    gore: 'off' | 'reduced' | 'full';
    shake: number;                            // 0..1
    reducedMotion: boolean;
    captions: 'off' | 'events' | 'all';
    sfxVolume: number;                        // 0..1
  };
  onEventShown(index: number): void;          // keeps the log and the scrubber in step
  onCaption(text: string, kind: 'event' | 'sound'): void;
}
```

---

## 5. Systems

### 5.1 The tooltip system [M1 core, M1-should for pinning]

One `Tip` system serves every DOM panel and the Pixi map. On the map, tooltips are DOM overlays
placed from Pixi coordinates.

**Kinds.**
- **Value:** a readout or stat. Breakdown table.
- **Concept** (L2): a term's meaning, with links.
- **Entity:** the card for a unit, spell, commander or province.
- **Action:** what a click does (`LMB select · RMB move here, 6 days`), plus the condition block
  when the action is blocked. EU5 shows mouse-button hints and a "why not" block
  (research-paradox §6).

**Anatomy** (from research-ux §3.7):

```
+-------------------------------------------------+
| [icon] Gold income                ▲ 38 / month  |  title, icon, L0 value
| Tax from population, minus troop upkeep.        |  one-line meaning (concept text)
| ----------------------------------------------- |
| Provinces (12)                          +61.4   |  breakdown: rows sorted by size,
|   Kharnath                              +31.2   |  top 5 then "7 others >" (link to Ledger)
|   ...                                           |
| Upkeep (4 commanders)                   −23.0   |
| Net                                     +38.4   |  bold total; rows add up visibly
| At this rate: 1,278 next month                  |  projection line
| ----------------------------------------------- |
| Shift more · T lock · Click Ledger > · Ctrl+click Codex |  gesture footer, dim
+-------------------------------------------------+
```

- Multiplicative values show a base row, then each factor as a percentage with the running
  value (research-ux §4). Caps, floors and overflow get rows of their own ("Overflow lost:
  −14.2"), because a hidden clamp is the usual cause of "why isn't this number moving?".
- Rows are sorted by absolute size, biggest first. Old World sorts alphabetically, which buries
  what matters (research-fourx §1).
- Hierarchy: the value is large, the meaning regular, the table small and tabular. Ancient World
  Magazine criticized Old World tooltips where everything has the same visual weight
  (research-fourx §1).
- One decimal in the tooltip, integers at L0. The tooltip shows the exact total, never a
  "rounding" row.
- Width at most 360 px; body text at least 14 px; height capped at 60% of the viewport, with
  scrolling inside (Old World Updates #121 and #129; research-fourx §1).

**Timing and behavior.**

| Behavior | Value | Source |
|---|---|---|
| Open delay | 400 ms on panels, 500 ms on the map; the map's name label is instant | research-ux §3.1 |
| Warm state | after a tooltip has shown, another trigger within 300 ms opens with no delay | research-ux §3.1 |
| Close grace | 150 ms, so the pointer can travel into the tooltip (hoverable) | WCAG 1.4.13 |
| Lock: timer | 0.8 s resting on the trigger or tooltip; the border fills like a ring while it counts | CK3 timer lock (research-paradox §6) |
| Lock: action | middle-click with less than 4 px of movement (a middle-drag pans), or `T` for trackpads | CK3 action lock |
| After a lock | new root tooltips are suppressed for 1 s | Vic3 player request (research-paradox §6) |
| Nested placement | away from neighboring triggers, so moving into it opens nothing on the way | Vic3 1.2 (research-paradox §6) |
| Depth cap | 3 levels | Ardeljan's critique (research-paradox §6) |
| Esc | closes the whole chain; moving out closes one level at a time | WCAG 1.4.13 |
| Keyboard focus | opens the tooltip too | WCAG 1.4.13 |
| Live data | updates in place while open; never closes and reopens | research-ux §3.2 |

- **Shift means "more" everywhere** (L1+). Holding Shift over a tooltip expands it at once: every
  row, per-day figures, the formula terms. Holding Shift alone for 250 ms shows the map's
  numeric labels. Shift+right-click and Shift+click also mean "more" (queue, add), so the key
  teaches itself. The genre uses Alt for this (Path of Exile, Baldur's Gate 3, Factorio), but
  Alt is unsafe in a browser (research-ux §3.5). Setting: Hold or Toggle.
- **Never cover the target.** Map tooltips open on the side away from the cursor's target and
  the nearest screen edge. While commanders are selected, the compact cursor label replaces the
  full province card, so a right-click never lands on a tooltip (Civ VII; research-fourx §1).
- **Filter by context.** A commander's tooltip in the script editor shows pips, fatigue and
  carried mana. On the map it shows HP, morale, order and ETA (Old World Update #132;
  research-fourx §1).
- **Links act.** Entity names in a tooltip are links (Old World Update #16: clicking a character
  name selects the character). Concept terms open L2. Ctrl+click on either opens the Codex.
- **Pinning** [M1-should]: in a locked tooltip, the pin icon or `P` turns it into a **floating
  card**. The card can be dragged, keeps updating live, and closes with its own ×. At most 3
  are open; a fourth closes the oldest. Uses: compare two provinces' supply, keep a spell's cost
  in view, watch a siege. No source shows this in a shipped strategy game (research-ux §3.4),
  so playtest it.
- **Settings:** mode (Hover / Key only, where `T` shows the tooltip under the cursor / Off),
  delay, lock (Timer / Action), nested tooltips (On / Off; with Off, concept terms open the
  Codex on Ctrl+click instead of chaining), always detailed. `Shift+T` switches tooltips off and
  on for the session. Old World added a suppress hotkey after reviewers asked for one
  (research-fourx §1). Its Ctrl+X binding is the browser's Cut, so it is not used.

**Concepts are content.** `src/content/concepts.ts` holds each concept's `id`, `name`, `summary`
(the L2 text, one or two lines), `body` (the Codex paragraph), `related` ids, `seeIn` UI anchors
and `icon`. CK3, Vic3 and Stellaris define concepts as data that hooks into tooltips and the
encyclopedia (research-paradox §6, §11). The M1 set, about 55 concepts:

> Population, Growth, Gold, Upkeep, Tax rate, Materials, Supply, Starvation, Mana, Spring,
> Dominion tint, Unrest, Provincial defense, Fort, Temple, Lab, Garrison, Commander, Squad,
> Leadership, Map speed, Formation, Row, Script, Fatigue, Carried mana, Pip, Holy, Research,
> Ritual, Battle spell, Morale, Rout, DRN, Closing, Siege, Walls, Storm, Dominion, Dominion
> score, Candle, Godless, Scales and each of the five axes, Bless, Sacred, Pretender, Chassis,
> Awakening, Prophet, Wellspring, Claim, Fog, Scout, Stealth, Independents, Pillage, Patrol,
> Preach.

Add them to the content validation fixtures (CLAUDE.md), with a test that every concept id
referenced from UI strings and content exists.

### 5.2 The Codex (encyclopedia) [M1]

A modal opened with `F` (find) or the top-bar button. The search box is focused on open, so the
key and typing are one gesture. A popular Civ VI mod did exactly this to the Civilopedia
(research-fourx §2).

```
+-------------------------------------------------------------------------------+
| Codex   [ search: "ash"                                  ]   [<] [>]   [x]    |
+----------------+--------------------------------------------------------------+
| Concepts       |  ASH RAIN  ·  Ritual · Ember level 6 · RRRR                 |
| Colors         |  Cost {R}x12 + (6) · 25 days · any province within 4         |
| Spells         |  Every troop in the target takes 2d6 fire, no armor;        |
|  Ember         |  unrest +25. Commanders and PD are untouched.               |
|  Loam          |  Castable by your: (none: needs RRRR)  Unlocks at Ember 6   |
| Units          |  Related: Remote damage, Unrest, Rituals                    |
| Chassis        |  [Show where this appears]                                  |
| Buildings      |                                                              |
| Terrain        |  Search results: Ashfen (province) -> Go to                 |
| Scales         |                  Ash Colossus (chassis)                     |
| Rules          |                  Ash Militia (unit)                         |
| How to play    |                                                              |
| Keys           |                                                              |
+----------------+--------------------------------------------------------------+
```

- **Topics** run down the left (the Civ VI Civilopedia's layout). The entry is on the right.
- **Search covers the Codex and the game.** Results are grouped: entries, then provinces and
  commanders as "Go to" results. So `F` is also the go-to-province key. Dominions jumps to a
  province by number (research-dominions §1.1); Fluid Magic provinces only have names.
- **Pages are generated from the content registry**, so they cannot drift from balance changes.
  CK3 generates its encyclopedia from script, and AoW4's unit tags show in the unit panel and
  the encyclopedia from one source (research-paradox §11, research-fourx §2).

  | Page | Content |
  |---|---|
  | Unit | stat block, weapons, tags as concept links, costs, recruit requirements, upkeep, supply, sprite |
  | Spell | requirement, kind, level, cost, effect in words from its primitives, **"Castable by your: …"** (live links), the research level that unlocks it |
  | Chassis | body, base pips, dominion, cost, notes |
  | Building | cost, days, requirements, effects |
  | Terrain | the docs/01 table, from `TERRAIN` |
  | Scale | each axis, each pole's effects per step |
  | Concept | from `concepts.ts`: summary, paragraph, related, and **Show where this appears**, which highlights the `seeIn` anchors |
  | Rule | formula pages (gold, supply, unrest, research, dominion), rendered from the same term keys the `explain*` breakdowns use, with a worked example |
  | How to play | the Learn steps and hints, linked from them (Old World put a tutorial section in its encyclopedia; research-fourx §2) |
  | Keys | generated from the binding table |

- **Every page adds something a tooltip lacks:** an example, a comparison table (unit tables can
  be sorted), live "your" links (Castable by your, Recruitable at), and back-links. Old World's
  help was criticized for repeating tooltips (research-ux §1).
- **Ways in:**
  - `F` and the top-bar button
  - Ctrl+click on any concept or entity
  - "Open in Codex" in a tooltip footer, or F1 on a hovered tooltip as a best-effort extra
    (Old World Update #73)
  - the ⓘ in panel headers
  - `I` on a hovered item
  - right-click on a card in a DOM panel, never on the map (Civ VII players missed
    right-click-to-Civilopedia; research-fourx §2)
- **History:** back and forward buttons, and Backspace when the search box does not have focus.
  Recent searches are kept (CK3).
- [Later] "Try in a test battle" on unit and spell pages. It runs `resolveBattle` with sample
  squads and a UI-seeded RNG, then opens the replay (research-ux §8).

### 5.3 Notifications and message settings [M1]

Three channels, kept apart as Paradox keeps them (research-paradox §3, §4):
1. **Alerts:** conditions true now. The ribbon (section 2.5).
2. **Messages:** events that happened. The feed (section 2.7).
3. **Displays per message type:** Off, Log (feed only), Toast, or Popup, plus a Pause checkbox.

- **Toasts** drop from under the top bar at the center. At most 3 are stacked. Each stays 6
  real seconds, or until hovered. Toasts of one type merge within 5 game days. Clicking one
  jumps to it; × closes it.
- **Popups** are reserved for what the player set to pop up. The battle popup is the report
  card.

**Defaults** (they follow docs/07's auto-pause list and add warnings before threats arrive; the
Pillars rule, research-ux §7):

| Message type | Kind | Display | Pause | Note |
|---|---|---|---|---|
| Battle you fought | `battle` | Popup (report card) | yes | docs/07 |
| Province lost | `lost` | Popup | yes | docs/07 |
| Hostile army approaching | `approaching` (new) | Toast | yes | once per enemy commander per leg, only when visible |
| Wellspring claimed (any nation) | `wellspring` | Popup | yes | the victory race |
| Godless | `godless` (new) | Popup | yes | |
| Pretender arrives or is recalled | `pretender` (new) | Toast | yes | |
| Research level reached | `research` | Toast | yes | docs/07 lists this auto-pause as toggleable. research-ux §7 argues for no pause, to keep pauses for threats; the spec keeps docs/07 and flags it for playtest |
| Siege laid against you, walls breached | `siege` (new) | Toast | walls breached: yes | |
| Province captured | `captured` | Toast | no | |
| Enemy army sighted | `sighted` | Toast | no | |
| Ritual complete or failed | `ritual` | Toast | no | |
| Dominion flipped | `dominion` | Toast | no | |
| Nation eliminated | `eliminated` (new) | Toast | no | |
| Starvation | `starvation` | Log | no | the critical alert already shows it |
| Recruits complete | `recruited` | Log | no | |
| Building complete | `built` | Log | no | |
| Victory or defeat | `result` | the victory screen | always | |

- **Edit in place:** every toast, popup and feed row has a gear that opens its type's two
  controls. Ctrl+click works too (Vic3, EU4, Stellaris; research-paradox §4). Players miss this
  matrix whenever a game cuts it: HoI4 and CK3 players asked for it back
  (research-paradox §4).
- **Coalescing:** pauses on the same day become one, with the reason chip
  `Paused: 3 events ▸` (section 2.4).
- **Sound:** each category has its own short cue. Critical, severe and situation alerts cue when
  they appear; a battle the player fought has a drum; toasts are silent. Every cue has a visual
  twin: a pulse or a caption (research-ux §7, §11). The cue sounds come from the battle
  presentation's SFX palette.
- **Nothing only through notifications.** Every report and screen has a menu path (Ledger,
  History). Humankind's Wonders screen could only be reached from its notification
  (research-fourx §5).

### 5.4 Keyboard map

Keys are accelerators. Every action also has a visible button whose tooltip shows its key, and
`?` shows the keys of the current screen (Dominions' per-screen `?`; research-dominions §1.1).
"Map focus" means the canvas or page body has focus, not a text field or a focused panel control.

**Game screen**

| Key | Action | Precedent |
|---|---|---|
| Space | pause / resume | Paradox, docs/07 |
| 1 to 4; + / − and Z / X | set speed; step speed | CK3, EU4 |
| Shift+1 to Shift+6 (F1 to F6 best effort); M / Shift+M | map modes; cycle | HoI4 F-keys, Civ VI More Lenses Shift+number, browser limits |
| WASD, arrows; wheel; LMB drag or MMB drag | pan; zoom to cursor; pan | docs/07 |
| LMB / Shift+LMB / Shift+LMB drag | select / add to selection / box-select own armies | genre standard, Total War, Dominions 6 |
| RMB / Shift+RMB | move (attack if hostile) / append waypoint | StarCraft II, Total War |
| V | reverse the current leg | design choice |
| Tab / Shift+Tab (map focus only) | next / previous own commander | docs/07 |
| N | next idle commander; a second press centers | CK3, StarCraft II |
| J (repeat to step back, 8 deep) | jump to the latest alert or message | StarCraft II |
| Home or Backspace / Shift+Home | center on the capital / on the pretender | Dominions, EU4 |
| R / L / F / O | Research / Ledger / Codex and search / toggle outliner | docs/07, EU4, Stellaris |
| C | Rituals tab of the selected mage | docs/07 |
| P | pin the selection, or the locked tooltip | CK3 pin, Vic3 star |
| I | info card (Codex page) for the hovered item | Dominions info-on-demand |
| T / Shift+T | lock tooltip / tooltips off or on | CK3 action lock, Old World suppress |
| Hold Shift | detail: expanded tooltip, numeric map labels | PoE, BG3, Factorio (Alt there) |
| `[` / `]` / H | collapse left dock / right dock / hide all chrome | Dominions `h` |
| Ctrl+Z / Ctrl+Shift+Z | undo / redo while paused [M1-should] | Old World |
| Ctrl+S | save (also a visible button and autosave) | docs/07 |
| ? | key overlay for this screen | Dominions |
| Esc | close one layer (the ladder below) | genre standard, WCAG 1.4.13 |

**Esc ladder** (each press closes one layer, in this order; research-ux §6):
1. tooltip chain
2. targeting mode (move preview, ritual target)
3. floating cards
4. modal
5. left dock
6. selection
7. when nothing else is open, the Game Menu

In browser fullscreen, Esc leaves fullscreen first, so every layer also has a visible close
control.

**Other contexts:** the replay keys are in section 4.3. Pretender Design: Ctrl+S and Ctrl+O save
and load a design, Enter starts the game (with the unspent-points confirm), and Esc goes Back.
Codex: Backspace goes back when the search box does not have focus; Enter opens the first
result.

**Never bound:** Ctrl+digit, Alt+digit, Alt+Left and Alt+Right, Ctrl+W, Ctrl+T, Ctrl+N, Ctrl+R,
F5, F6, F11, F12. These are browser tab, navigation and reload keys (research-ux §6). Control
groups on Ctrl+digit are therefore left out. With a few dozen commanders, Tab, N, pins, groups
and box-select cover the need.

**Rebinding** (Settings → Controls): every action can be rebound per context (map, panel,
replay). Conflicts within a context are refused, and so are the reserved keys. A unit test
checks the default table for duplicates and reserved keys. Destructive actions (Storm, Make
Prophet, Cast, Stop ritual, Quit) have **no bare-key binding** (Dominions' `e` next to `r`;
research-dominions §1.9).

### 5.5 Onboarding [M1 core, M1-should for Learn]

Dominions has no tutorial, and that is its most-cited barrier (research-dominions §2). Fluid
Magic teaches inside the first match, at the player's chosen depth.

- **New Game asks "How much guidance?"** (Civ VI asks the player's experience at the start;
  research-ux §8). The answer can be changed in Settings at any time.
  - **Guide me:** the Learn objective, reactive hints, and a pause before each first major
    concept.
  - **Hints only** (default): reactive hints, never pausing.
  - **Off.**
- **Learn objective** [M1-should], a pinned section at the top of the outliner. Vic3 makes its
  tutorial a journal objective with "Tell me How" and "Tell me Why" (research-paradox §12).
  - Each step has **How**, which highlights the UI element and the map target, and **Why**,
    which opens the concept.
  - Each step is checked from state by a pure selector:

  | # | Step | Done when |
  |---|---|---|
  | 1 | Recruit a batch at your capital | an own fort queue holds an item, or a `recruited` message exists |
  | 2 | Take an independent province | the nation owns a province other than its capital |
  | 3 | Set research going | the research color is set and `nationResearchRate > 0` |
  | 4 | Spread your dominion | a priest has order Preach, or a temple is under construction |
  | 5 | Plan a battle | a commander has a script with a named spell, or a squad's row was changed |
  | 6 | Cast a ritual | any `castRitual` order has been given |
  | 7 | Claim a Wellspring | a claim order has been given |

- **Reactive hints** use the blue Hint tier of the alerts ribbon and fire on first occurrence,
  as CK3's reactive advice does (research-paradox §12). Each hint is two sentences and ends with
  **Show me**. Hints never pause, except under Guide me. "Reset hints" in Settings brings
  dismissed hints back.

  | Trigger (first time) | Hint |
  |---|---|
  | an army starves | "Armies eat the province's supply. Spread out, or move to farmland." |
  | unrest passes 50 | "Above 50 unrest a fort stops recruiting. Lower taxes or station a priest." |
  | enemy dominion in an own province | "Their god's scales now apply here. Preach or build a temple to push back." |
  | fort materials at cap | "Materials beyond 6 months of production are lost. Recruit something." |
  | a scripted spell cannot be cast | "Varo's script names Fireball but he has R1. Open the Battle Plan." |
  | first battle lost | "Open the report to see why, then watch the replay." |
  | first siege against you | "Walls hold while defenders repair. A relief army must break the siege." |

- **Quiet, never hidden.** In the first game, sections that do not apply yet (Rituals before
  any caster, Prophet before it is available) are collapsed with a dim one-line unlock hint
  (CK3's progressive disclosure; research-paradox §12).
- **Every tooltip's footer** names the next gesture (principle 1). The key overlay `?` is
  announced once, in the first hint.
- **Pretender presets** are the easy start (docs/05). Each preset tooltip shows the summary
  card's reading.

### 5.6 Accessibility [M1]

| Setting or rule | Default | Note |
|---|---|---|
| UI scale | 100% (80 to 200%) | root `font-size`; every DOM size is in `rem`; Pixi labels and badges read the same factor. Civ VII's UI was built for 1080p and looks blurry above it (research-fourx §11) |
| Text size | 100% (90 to 150%); body at least 14 px | separate from UI scale |
| Color identity | always | hue + glyph + letter for the five colors; a letter in `aria-label` and text runs (`Ember (R)`); costs in MTG notation, colored pips then generic (research-ux §5) |
| No hue-only signals | always | deficits ▲▼; alert tiers by shape; allegiance by badge shape; invalid targets hatched; fog dotted; supply wheat states; nation emblem on bands (research-ux §5 table) |
| Pattern overlays in map modes | off | hatching per step |
| High-contrast borders | off | |
| Letters on mana symbols | off | draws W U B R G inside the glyph |
| Banner colors | palette defaults | picker validated at runtime against the docs/09 CIEDE2000 rule (XAG 103: let players choose colors) |
| Reduced motion | follows `prefers-reduced-motion` | map: no idle bob, no panel slides, no pulsing; replay: section 4.3 |
| Screen shake | 50% (0 to 100%) | shared with the replay. Path of Exile players objected to shake on at full by default (research-ux §3.5) |
| Gore | Full (Off / Reduced / Full) | shared with the replay; the visceral default follows the owner's direction |
| Flash limit | always on | WCAG 2.3.1 limits for the replay and the map's spell effects |
| Captions | Events | Off / Events / Events + sounds |
| Visual sound cues | on | every informative sound has a pulse or caption |
| Keyboard focus | always | every DOM control can be reached and shows a `:focus-visible` ring. Map orders stay mouse-first in M1. [Later] a keyboard province cursor (arrows move, Enter selects, M moves) |
| Pause as a tool | — | every order can be given while paused (docs/00 pillar 3); modals pause |

QA: a developer toggle applies color-deficiency and greyscale SVG filters to the whole app (Game
UI Database's visualizers do the same; research-ux §5). A greyscale screenshot smoke test covers
the top bar and the alerts ribbon.

### 5.7 Undo and confirmation

- **Undo while paused** [M1-should]. Old World's rule: undo until new information arrives
  (research-ux §9). In Fluid Magic new information arrives only when a day advances.
  - When the first command is issued during a pause, the store keeps a clone of the state as
    the **base**. Each command applied after it is appended to a **log**.
  - Ctrl+Z moves the last command to a redo list, restores a clone of the base, and re-applies
    the remaining log. Ctrl+Shift+Z redoes.
  - The first `advance` clears all of it.
  - Commands are deterministic and the RNG state is part of the base, so undo cannot reroll
    anything. Test: apply, undo, redo gives the same `stateHash`.
  - The base, log and redo list are UI state, capped at 50 commands.
- **While running, undo means the sim's own reversals.** A command's toast offers its inverse
  inline: `Recruiting 10 Cinder Warriors · Cancel` (`cancelRecruit`: gold back in full,
  materials up to the cap), `Moving to Ashfen · Reverse`.
- **Confirm only what undo cannot cover**: irreversible actions taken while the clock runs, or
  actions that start or end the match. Confirmations are **inline**: the button turns into
  `Confirm Storm? Walls stand: defenders +6 protection` for 3 seconds. A per-type "Don't ask
  again" can be reset in Settings. Generic dialogs train players to click through
  (research-ux §9).
  - Storm while the walls stand (docs/01: "strongly discouraged"). The confirmation shows the
    strength estimate.
  - Make Prophet (24-month wait if the prophet dies).
  - Cast a ritual, or stop one (the mana is lost).
  - Start the match with unspent design points.
  - Load, quit, or start a new game with unsaved play.
- **While paused, none of these confirm except the match-level ones**, because undo covers them.

---

## 6. Component inventory (React)

Paths follow docs/06 (`src/ui/screens`, `src/ui/panels`, `src/ui/components`). Props are listed by
their key fields only. Ids are the branded sim ids. Every component reads game data through
selectors on the store, so a prop is usually an id rather than an object.

### 6.1 Primitives (`src/ui/components/`)

| Component | Key props | Used in |
|---|---|---|
| `ManaSymbol` | `color: Color; size: 'xs'\|'sm'\|'md'\|'lg'; letter?: boolean; dim?: boolean` | everywhere a color appears |
| `ManaCost` | `cost: Partial<Record<Color, number>> & { generic?: number }` (colored pips, then the generic circle) | ritual rows, spell cards, Codex, payment row |
| `Requirement` | `req: string` (`RR`, `R/G`; parsed by the content requirement parser; hybrids as split circles) | spell cards, script picker, Codex |
| `PipRow` | `pips: Pips; holy?: number; base?: Pips` (base pips show a lock) | commander header, portraits, pip steppers, `PretenderCard` |
| `Icon` | `name: IconName; badge?: 'up'\|'down'\|'blocked'\|'paused'\|'problem'` | everywhere |
| `Num`, `Delta` | `value: number; unit?: 'perMonth'\|'perDay'\|'flat'; decimals?: 0\|1; signed?: boolean` (sign as ▲ ▼ and tone) | readouts, stat rows, tables |
| `Bar` | `value; max; target?: number; marks?: number[]; kind: 'hp'\|'morale'\|'progress'\|'fatigue'\|'walls'` (morale also patterned) | cards, stat rows, siege, research, rosters |
| `Candles` | `strength: number; nation: NationId \| null; compact?: boolean` | province header, tooltips, `PretenderCard` |
| `BannerChip` | `nation: NationId \| null; withName?: boolean` (banner plus emblem; numbered for duplicates) | headers, rosters, Ledger, feed |
| `Portrait` | `unit: UnitTypeId; nation: NationId \| null; pips?: Pips; size: number` | strip, rosters, outliner, cards |
| `StatusGlyphs` | `statuses: StatusId[]; max?: number` (3, then `+n`) | badges (map draws its own), rows, cards |
| `ConceptTerm` | `id: ConceptId; children?` (dotted underline, opens L2) | tooltips, panels, Codex |
| `EntityLink` | `ref: EntityRef` (province, commander, nation, spell, unit, battle) | tooltips, feed, Codex, Ledger |
| `Hotkey` | `action: ActionId` (shows the current binding) | buttons, tooltip footers, `?` overlay |

### 6.2 Tooltip system (`src/ui/tips/`)

| Component | Key props | Used in |
|---|---|---|
| `TipProvider` | settings from the store | `App` |
| `TipLayer` | none (portal; chain of up to 3; lock ring; close grace; placement) | `App` |
| `Tip` | `content: TipContent; kind: 'value'\|'concept'\|'entity'\|'action'; children` | wraps any trigger |
| `ValueTip` | `title; icon; value; meaning: ConceptId; breakdown: () => Breakdown; more?: Route` | readouts, stat rows |
| `ConceptTip` | `id: ConceptId` | `ConceptTerm` |
| `EntityTip` | `ref: EntityRef; context?: 'map'\|'script'\|'recruit'\|'replay'` (Old World-style context filtering) | cards, links |
| `ActionTip` | `lmb?: string; rmb?: string; checks?: readonly Check[]` | buttons, map objects |
| `BreakdownTable` | `breakdown: Breakdown; detail: boolean; maxRows?: number; more?: Route` | value tips, Codex rule pages |
| `ConditionBlock` | `checks: readonly Check[]` (✓ / ✗ per check) | disabled actions, pretender steppers, ritual rows |
| `FloatingCard` [M1-should] | `id; title; children; onClose` (draggable, live, at most 3) | pinned tooltips |
| `MapTip` | `province: ProvinceId \| null; anchor: ScreenPoint` | `MapView` |

### 6.3 Buttons, shells and feedback

| Component | Key props | Used in |
|---|---|---|
| `ActionButton` | `command: Command \| null; label; cost?: CostLabel; hotkey?: ActionId; confirm?: ConfirmSpec; preview?: () => DeltaPreview`. It calls `checkCommand` for its disabled state and condition block, and dispatches `store.issue(cmd)` (validate, then apply) | every command in the UI |
| `NavButton` | `to: Route; label; icon; hotkey?` (ghost style) | top bar, links, tabs |
| `Panel` | `title; subtitle?; actions?: { goTo?; pin?; codex? }; tabs?: TabDef[]; onBack?; onClose` | left-dock panels, report card |
| `Tabs` | `tabs; active; onChange` | panels, Ledger, Settings |
| `Modal` | `id: ModalId; title; onClose; pauses?: boolean` (default true) | Research, Ledger, Codex, Settings, Game Menu, replay |
| `ToastStack`, `Toast` | `message: MessageId \| UiEventId` | game screen |
| `Popup` | `kind; children` | report card, lost province, Wellspring, Godless |
| `SplitPane`, `Rail` | `panes` / `items` | right dock; narrow layout |
| `KeyOverlay` | `context: KeyContext` | `?` on every screen |

### 6.4 Cards

| Component | Key props | Used in |
|---|---|---|
| `UnitCard` | `unit: UnitTypeId; nation; count?; start?; hpPct?; morale?: MoraleState; row?: Formation; statuses?; cost?: RecruitCost; killed?; routed?; variant: 'recruit'\|'squad'\|'mini'\|'report'\|'replay'; blocked?: Check[]; draggable?` | Recruit tab, bottom strip, Battle Plan, engagement preview, report, replay rosters, Codex |
| `SpellCard` | `spell: SpellId; caster?: CommanderId; variant: 'research'\|'ritual'\|'script'\|'codex'` (shows the cost for that caster, "Castable by N") | Research, Rituals, script picker, Codex |
| `CommanderCard` | `commander: CommanderId; variant: 'row'\|'compact'\|'roster'` | outliner, Forces tab, Army panel, strip, rosters |
| `PretenderCard` | `nation: NationDef; design: PretenderDesign; live?: boolean` | Pretender Design, nation tooltip, Ledger Nations, Victory |
| `ChassisCard` | `chassis: ChassisId; fits: boolean; selected: boolean` | Pretender Design |
| `BattleReport` | `battle: BattleId; mode: 'popup'\|'end'\|'embedded'` | auto-pause popup, replay end card, Ledger Battles |

### 6.5 Game screen (`src/ui/screens/GameScreen.tsx`, `src/ui/panels/`)

| Component | Key props | Notes |
|---|---|---|
| `GameScreen` | none | layout and breakpoints; mounts docks, map, strip, overlays |
| `TopBar` | none | `NationButton`, `Readout` × 7, `ScreenButtons`, `Clock`, `SpeedControls`, `PauseReasonChip`, `UndoChip` |
| `Readout` | `id: 'population'\|'gold'\|'materials'\|'mana'\|'research'\|'dominion'\|'wellsprings'; color?: Color` | value, delta, `ValueTip`, click route |
| `AlertsRibbon`, `AlertIcon` | `alert: AlertGroup` | hover list, click cycles, dismiss, mute |
| `Outliner`, `OutlinerSection`, `OutlinerRow` | `section: SectionId` / `ref: EntityRef` | drop targets for squads |
| `MessageFeed`, `FeedFilters`, `MessageRow`, `MessageSettingsPopover` | `message: MessageId` / `kind: MessageKind` | |
| `LeftDock` | none (renders the top of the dock stack, with a breadcrumb) | |
| `ProvincePanel` | `province: ProvinceId` | tabs: `ProvinceOverview`, `RecruitTab`, `ForcesTab`, `HistoryTab` |
| `StatRow` | `icon; label; value; delta?; target?; tip: ValueTip` | province and commander stats |
| `TaxSelector`, `PdRow`, `BuildingRow`, `SiegeBlock`, `WellspringBanner`, `EffectsList` | `province` | Overview tab |
| `CommanderPanel` | `commander: CommanderId` | tabs: `CommanderOverview`, `BattlePlanTab`, `RitualsTab` |
| `FormationField` | `commanders: CommanderId[]; editable: boolean; mode: 'here'\|'destination'` | Battle Plan; drag issues `setFormation` and `transferSquad` |
| `ScriptTimeline`, `ScriptSlotPicker`, `FatigueStrip`, `ScriptPresets` | `commander: CommanderId` | Battle Plan |
| `RitualList`, `PaymentRow`, `TargetingBanner` | `caster: CommanderId` | Rituals tab; map targeting mode |
| `ArmyPanel` | `commanders: CommanderId[]` | several commanders selected, or a group |
| `BottomStrip`, `CommanderStrip`, `ScriptSummary`, `OrderBar`, `EtaBox` | `selection` | the command surface |
| `MapView` | none | hosts `MapRenderer` (Pixi); maps pointer events to store actions |
| `CursorLabel` | `preview: MovePreview \| EngagementPreview \| TargetPreview` | next to the cursor |
| `EngagementPreview` | `attackers: CommanderId[]; province: ProvinceId` | inside `CursorLabel` |
| `MapModeStrip`, `Legend` | `mode: MapMode` | map, bottom right |

### 6.6 Modals and screens

| Component | Key props | Notes |
|---|---|---|
| `ResearchModal`, `ResearchColumn` | `color: Color` | |
| `LedgerModal`, `LedgerTable<T>` | `tab: LedgerTab; columns; rows; filters; sort` | one generic table for six tabs |
| `CodexModal`, `CodexSearch`, `CodexEntry` | `ref: CodexRef` | generated pages |
| `SettingsModal`, `MessageMatrix`, `BindingTable` | `tab: SettingsTab` | |
| `GameMenu`, `SaveLoadDialog`, `SlotCard` | `mode: 'save'\|'load'` | |
| `BattleReplay` | `battle: BattleId` | `ReplayHeader`, `ConditionChips`, `RosterPanel` (`side`, `collapsed`), `LiveRail`, `BattleStage` (`BattleStageProps`, section 4.4), `CaptionsStrip`, `BattleLog` (`detail`, `focus`), `Transport`, `Scrubber` (`markers`), `ReplaySettingsPopover` |
| `MainMenu` | none | |
| `NewGame` | none | `MapSizePicker`, `SeedField`, `OpponentRow`, `NationCard`, `GuidancePicker` |
| `PretenderDesign` | `nation: NationId` | `PresetBar`, `BudgetBar`, `ChassisList`, `PipStepper`, `DominionStepper`, `ScaleSlider`, `AwakeningPicker`, `PretenderCard` |
| `VictoryScreen` | none | `StatsTable`, battle list, View map |

### 6.7 Store (Zustand, `src/ui/store.ts`)

Everything here is UI state and never enters `GameState`. The slices marked *saved* are written to
the save file's UI block and to local storage. Keeping them out of `GameState` keeps the sim's
hash unchanged.

| Slice | Holds |
|---|---|
| `game` | the `GameState` ref and a version counter bumped once per tick batch |
| `time` | speed, paused, pause reasons (coalesced), the speed to restore after a modal |
| `selection` | selected commanders, selected province, hovered entity |
| `dock` | left-dock stack and per-panel last tab |
| `modal` | the open modal and its back link |
| `tips` | tooltip chain, lock state, floating cards |
| `map` | mode, zoom band, targeting mode (move or ritual), camera |
| `alerts` | dismissed (until the condition re-arises), muted types |
| `feed` | filters, hidden rows, unread count, UI-only toasts |
| `undo` | base clone, command log, redo list [M1-should] |
| `prefs` (*saved*, local storage) | settings, message matrix, bindings, guidance level |
| `uiSave` (*saved*, in the save file) | named groups, pins, Learn progress, hints seen |

---

## 7. What the sim must expose

The rule from principle 3: the UI shows only numbers that a sim function computed. Most functions
already exist. The new ones are pure, deterministic, read-only, and unit-tested under `tests/sim/`
(CLAUDE.md). None of them touches `state.rng`.

### 7.1 Already in the sim (reuse as is)

| Need | Function (module) |
|---|---|
| Province rates: gold, materials, supply, supply used, mana, growth, unrest, pillage | `provinceEconomy`, `allProvinceEconomies` (selectors) |
| Nation totals: gold after difficulty, upkeep, mana, plunder per day | `nationEconomy`, `allNationEconomies` (selectors) |
| Fort materials per month and cap | `fortMaterials` (selectors) |
| Dominion score; checks per source | `dominionScore` (selectors); `dominionChecks`, `isGodless` (dominion) |
| Morale penalties | `unpaidMoralePenalty`, `starvationMoralePenalty` (selectors) |
| Pretender and prophet identity | `isPretender`, `isProphet` (selectors) |
| Victory stats | `nationSummary` (selectors) |
| Paths and ETAs | `findPathFor`, `pathEta`, `etaDays`, `legDays`, `pathDays`, `commanderMapSpeed`, `canMove`, `isHostile`, `hostileProvinces` (movement) |
| Sieges | `siegeRates`, `stormState`, `wallsDown` (siege) |
| Research | `researchLevels`, `nationResearchRate`, `researchRate`, `daysToNextLevel`, `canResearch`, `isResearching`, `inOwnLab` (research) |
| Rituals | `ritualTargets`, `castBlocker`, `ritualPayment`, `withinHops` (rituals) |
| Wellsprings | `claimBlocker`, `claimedBy` (wellsprings); `wellspringsToWin` (mapgen/placement) |
| Fog | `visionOf`, `visibleCommanders`, `isExplored`, `independentStrengthView` (visibility) |
| Recruitment | `recruitGold`, `recruitMaterials`, `recruitPop`, `recruitDays`, `recruitBlock`, `recruitRequirementError`, `garrisonOf` (recruitment) |
| PD and buildings | `pdCost`, `pdForce` (pd); `constructionCost`, `constructionDays` (buildings) |
| Commanders | `troopCount`, `commanderMaxHp`, `commanderSupply`, `commanderUpkeep`, `isGarrisonHolder`, `isStealthy` (commanders) |
| Spells and pips | `meetsRequirement`, `extraPips`, `colorPips` (pips); `knownSpells` (battle/setup); `blessOf` (bless) |
| Pretender design | `designCost`, `pipStepCost`, `scaleStepCost`, `designBudget`, `basePips`, `validatePretender` (pretender) |
| Province effects | `activeEffects` (state) |
| Replay | `startReplay`, `stepReplay`, `foldReplay` (battle/replay); `BattleRecord` roster and events |

### 7.2 New sim functions

| # | Function | Module | Returns | Used by | Phase |
|---|---|---|---|---|---|
| 1 | `explainProvince(state, id)` with `gold`, `materials`, `supply`, `supplyUsed`, `mana[color]`, `growth`, `unrest` | `src/sim/explain/province.ts` | `Breakdown` per value | L1 tooltips, province panel, Ledger, Codex rule pages | 8 |
| 2 | `explainNationGold`, `explainNationMana(color)`, `explainNationPopulation`, `explainFortMaterials(fort)` | `src/sim/explain/nation.ts` | `Breakdown` | top bar | 8 |
| 3 | `explainResearch(state, nation)` | `src/sim/explain/research.ts` | `Breakdown` (one term per researching mage) plus the unlocks at the next level | top bar, Research | 9 |
| 4 | `explainDominion(state, nation)` | `src/sim/explain/dominion.ts` | score terms and checks per source, expected pushes per month | top bar, Codex | 9 |
| 5 | `explainMorale(state, commander)` | `src/sim/explain/commander.ts` | base, starvation, unpaid, prophet bonus | commander panel | 9 |
| 6 | `checkCommand(state, cmd)` | `src/sim/commands/check.ts` | `Check[]`; `validateCommand` becomes "first failing check, or null" | every `ActionButton`, condition blocks, cursor-label refusals | 8 |
| 7 | `checkPretender(def, design)` | `src/sim/pretender.ts` | `Check[]`; `validatePretender` becomes its first failure | Pretender Design steppers and Start | 9 |
| 8 | `armyPower(forces)` (docs/08's formula: troops × (hp + att + def + prot) / 4 × (1 + 0.1 × ranged)) | `src/sim/selectors.ts`, moved from the AI | number | engagement preview, Storm confirmation, AI | 8 |
| 9 | `supplyAfterArrival(state, commanders, province)` | `src/sim/selectors.ts` | `{ available, used, state: 'fed'\|'tight'\|'starving' }` | cursor label, Supply mode during moves | 8 |
| 10 | `scriptCheck(state, commander)` | `src/sim/battle/scriptCheck.ts` | per slot: castable or the reason, fatigue cost for this caster, carried mana needed; projected fatigue for rounds 1 to 5 | Battle Plan, script summary, alert, engagement preview | 9 |
| 11 | `predictRitual(state, caster, spell, target)` | `src/sim/rituals.ts` | before and after `ProvinceEconomy` values and the effect durations, from applying the ritual's effects to a clone | ritual targeting labels | 9 |
| 12 | `summarizeBattle(record)` | `src/sim/battle/summary.ts` | outcome band, per-squad start, end, killed and routed, commander fates, spells cast, end reason, up to 3 key moments | report card, Ledger Battles, replay end | 10 |
| 13 | New `MessageKind`s: `approaching`, `siege`, `godless`, `pretender`, `eliminated` (splitting today's `info`), and `refs` on `Message` (commander, nation, spell ids) for links | `src/sim/types.ts`, `messages.ts`, `visibility.ts` (`approaching`: a visible enemy leg ending in a province the nation owns or occupies, once per commander per leg), `siege.ts` | messages | feed, message settings, auto-pause | 8 |
| 14 | `pretenderReading(nation, design)` | `src/sim/pretender.ts`, phrases in `src/content/pretenders/reading.ts` | the summary card's one-line reading (docs/05) | `PretenderCard` | 9 |
| 15 | Content: `concepts.ts`; `BATTLE_REPORT` outcome-band thresholds in `rules.ts` | `src/content/` | data | tooltips, Codex, report | 8 to 10 |

**The `Breakdown` shape** (research-ux §4):

```ts
interface Term {
  key: string;                  // label key, e.g. 'term.tax.high'
  ref?: EntityRef | ConceptRef; // makes the row a link
  op: 'base' | 'add' | 'mul' | 'clamp' | 'floor' | 'cap';
  value: number;                // +3.0 for add, 1.07 for mul
  running: number;              // value after this term
}
interface Breakdown {
  total: number;
  unit: 'perMonth' | 'perDay' | 'flat';
  terms: Term[];
  projection?: { months: number; value: number } | { daysUntil: number; event: string };
}
```

**Keep the fast path fast.** `allProvinceEconomies` runs inside the tick's 2 ms budget (docs/06).
So the `explain*` functions are separate code, called only when a tooltip or panel opens. They
are guarded by a **property test** in `tests/sim/explain.test.ts`: for random states (from
`createGame` plus random valid commands and days), each `explainX(...).total` equals its
selector within 1e-9. Without that test the breakdown would drift from the number. The
alternative, making the selectors fold the terms themselves, removes the duplication but would
allocate term arrays on every tick. Record the choice in `docs/06-architecture.md`.

**`checkCommand`** returns every check with its pass state:

```ts
interface Check { id: string; ok: boolean; key: string; params?: Record<string, number | string> }
```

A test asserts that `validateCommand` equals the first failing check's message for the existing
refusal fixtures, so the AI and the sim behave exactly as before.

### 7.3 Pure UI derivations (`src/ui/derive/`, tests in `tests/ui/derive/`)

These read sim state and selectors, and never write. They live under `src/ui` because only the UI
needs them, and the sim imports nothing from the UI.

| Module | Computes |
|---|---|
| `alerts.ts` | `AlertGroup[]` for a nation from the conditions in section 2.5, minus dismissed and muted ones |
| `outliner.ts` | sections and rows, with roles and status glyphs |
| `movePreview.ts` | path (`findPathFor` plus waypoints), per-leg days, arrival date, `supplyAfterArrival`, refusal reason, engagement data |
| `engagement.ts` | visible forces on both sides, the fog band from the strength word, modifier chips, `armyPower` ratio |
| `previewCommand.ts` | the effect of a command before it is issued: clone the state, apply the command, diff the selectors (tax, PD, orders) |
| `mapLabels.ts` | label content per province per zoom band and mode |
| `feed.ts` | grouping, categories, merged toasts |
| `pauses.ts` | which new messages pause under the player's matrix, coalesced per day |
| `learn.ts`, `hints.ts` | Learn steps' done state and first-occurrence hint triggers |
| `bindings.ts` | the default key table. Test: no duplicates per context, no reserved keys |

**Fog guard test:** for every derive function that shows another nation's data, changing a hidden
enemy commander (outside `visionOf`) leaves the function's output unchanged. Otherwise the UI
could leak what the fog hides.

**Cost:** alerts and the outliner recompute once per store bump, at most once per sim day.
Breakdowns compute on open. One `allProvinceEconomies` result is memoized per day and shared by
the top bar, the alerts and the map labels.

---

## 8. Pattern sources

Each pattern this spec adopts or avoids, the game it comes from, and the citation. "Note §" is the
section of the research note that discusses it: P = `research-paradox.md`, D =
`research-dominions.md`, X = `research-fourx.md`, U = `research-ux.md`. The URLs are those the notes
cite. The notes warn that most were read from search extracts, not opened pages.

### 8.1 Layering, tooltips, encyclopedia

| # | Pattern | In Fluid Magic | From | Note §, source |
|---|---|---|---|---|
| 1 | Five layers: always-on, hover, nested hover, click panel, full screen | §1.1 ladder | EU4, CK3, Stellaris | P §0; https://eu4.paradoxwikis.com/Ingame_screen ; https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/ |
| 2 | Progressive disclosure; the boundary between layers made visible | tooltip footer naming the next gesture | NN/g; CK3 tutorial refresh | U §1; https://www.nngroup.com/articles/progressive-disclosure/ ; https://www.gamedeveloper.com/design/deep-dive-refreshing-the-crusader-kings-iii-tutorial-mode-through-optimized-ux |
| 3 | Tooltips in tooltips with a timer lock and a middle-click lock | §5.1 L2, timer 0.8 s, MMB or T | CK3 | P §6; https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/ |
| 4 | Nested tooltip placement that opens nothing on the way | §5.1 placement | Victoria 3 (1.2) | P §6; https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-74-ux-improvements |
| 5 | A locked tooltip briefly blocks new ones | §5.1, 1 s suppression | Vic3 player request | P §6; https://forum.paradoxplaza.com/forum/threads/locking-a-tooltip-should-prevent-other-tooltips-from-opening-for-a-brief-moment.1554097/ |
| 6 | Tables for many-source values, mouse-button hints, a "why not" condition block | `BreakdownTable`, `ActionTip`, `ConditionBlock` | EU5 | P §6, U §3.6; https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053 |
| 7 | Cap nesting depth at about 3 | depth cap 3 | design critique of CK3 | P §6; https://philip.design/blog/tooltips-in-tooltips/ |
| 8 | Shift freezes a tooltip; names in tooltips are live links | lock key; `EntityLink` | Old World | X §1; https://cdn.steamstatic.com/steam/apps/597180/manuals/Old_World-Official_User_Manual.pdf ; https://mohawkgames.com/2020/09/02/old-world-update-16/ |
| 9 | F1 on a tooltip opens its encyclopedia page | "Open in Codex" footer, Ctrl+click | Old World, AoW4 | X §1, §2; https://mohawkgames.com/2021/10/06/old-world-update-73/ ; https://steamcommunity.com/app/1669000/discussions/0/3828666171743764627/ |
| 10 | Tooltips filtered by context | `EntityTip` context | Old World (Update #132) | X §1; https://forums.civfanatics.com/threads/old-world-update-132.695851/ |
| 11 | Scrollable, capped tooltips; a suppress-tooltips hotkey | 60% height cap; Shift+T | Old World (#121, #129, #143) | X §1; https://mohawkgames.com/2024/04/04/old-world-update-121/ ; https://mohawkgames.com/2026/02/18/old-world-update-143/ |
| 12 | Avoid: tooltips that all carry the same visual weight | value large, table small | Old World critique | X §1; https://www.ancientworldmagazine.com/reviews/old-world-2021/ |
| 13 | Avoid: a tooltip covering the click target | cursor label beside the cursor | Civ VII complaint | X §1; https://steamcommunity.com/app/1295660/discussions/2/570371033831324629 |
| 14 | Hover delay setting; Off mode; key-only mode | Settings → Interface | Civ VI, Baldur's Gate EE | U §3.1; https://support.civilization.com/hc/en-us/articles/37661409606547-Civilization-VI-Console-FAQ ; https://steamcommunity.com/app/228280/discussions/0/3432326055095021944 |
| 15 | Hoverable, dismissible, persistent hover content | close grace, Esc, focus | WCAG 1.4.13 | U §3.2; https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus |
| 16 | A held key shows more detail | Shift (Alt is unsafe in a browser) | Path of Exile, Baldur's Gate 3, Factorio | U §3.5; https://alcasthq.com/the-most-important-feature-in-baldurs-gate-3-show-world-tooltip/ ; https://lua-api.factorio.com/1.1.34/Concepts.html |
| 17 | Encyclopedia generated from game data; concepts as data | Codex from the content registry; `concepts.ts` | CK3, Vic3, Stellaris, AoW4 | P §11, X §2; https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/ ; https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-wyvern-update-patch-notes |
| 18 | Topics on the left, search focused on open | Codex layout | Civ VI Civilopedia and a popular mod | X §2; https://cdn.2kgames.com/manuals/civilization-vi/switch/na/CIV_VI_NSW_ONLINE_MANUAL_US.pdf ; https://steamcommunity.com/sharedfiles/filedetails/changelog/1341630847?p=1 |
| 19 | Nested tooltips cut "tedious clicking" | hover depth over click depth | Endless Legend 2 | U §1; https://powerupgaming.co.uk/2026/09/16/endless-legend-2-full-release-brings-overhaul-to-cut-tedious-clicking/ |

### 8.2 Main screen: readouts, alerts, outliner, messages, time

| # | Pattern | In Fluid Magic | From | Note §, source |
|---|---|---|---|---|
| 20 | Stock plus monthly delta; hover explains | top bar readouts | EU4, Stellaris, Old World | P §1, X §3; https://eu4.paradoxwikis.com/Ingame_screen ; https://stellaris.fandom.com/wiki/Main_interface ; https://bigbossbattle.com/old-world-review/ |
| 21 | Clicking a resource opens where you act on it | readout click routes | Stellaris | P §1; https://stellaris.fandom.com/wiki/Main_interface |
| 22 | Yellow when a stock is full and gain is wasted | materials at cap, "full" glyph | Stellaris | P §1; https://stellaris.fandom.com/wiki/Beginner's_guide |
| 23 | Avoid: totals without sources; show losses everywhere | top-5 rows with links; upkeep rows | Civ VII critique and patch 1.2.5 | X §3; https://al97.com/news/civ-739s-ui-bad.html ; https://civilization.2k.com/civ-vii/from-the-devs/developing-settlements/ |
| 24 | Space pauses, digits set speed, +/− and Z/X step | §2.4 | EU4, CK3, Vic3 | P §2; https://eu4.paradoxwikis.com/Controls ; https://www.magicgameworld.com/crusader-kings-3-pc-keyboard-controls-guide/ |
| 25 | Paused state tints the speed control red | three-channel paused state | CK3 | P §2; https://steamcommunity.com/app/1158310/discussions/0/3761101693153821101 |
| 26 | Avoid: surprise auto-unpause | no auto-resume by default; reason chip | Stellaris complaint | P §2; https://steamcommunity.com/app/281990/discussions/0/357286532028618957/ |
| 27 | Alert colors by urgency; left-click goes, right-click dismisses, Shift+right-click disables | §2.5 | EU4 | P §3; https://eu4.paradoxwikis.com/Ingame_screen |
| 28 | Six alert tiers; a dismissed alert returns only if its condition re-arises | §2.5 tiers and dismissal | EU5 | P §3; https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053 |
| 29 | Alerts only for actionable states | alerts as conditions | CK3 | P §3; https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/ |
| 30 | Sound on top-bar alerts | cues for critical, severe, situation | CK3 patch 1.2 | P §3; https://ck3.paradoxwikis.com/Patch_1.2 |
| 31 | Per-type message matrix: popup, log, pause; edit from the message | §5.3, the gear on every message | EU4, Vic3, Stellaris | P §4; https://steamcommunity.com/app/236850/discussions/0/496879865901102141/ ; https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-74-ux-improvements ; https://vic3.paradoxwikis.com/User_interface |
| 32 | Pause on anticipation (enemy spotted), not on contact | `approaching` message, pause by default | Pillars of Eternity | U §7; https://steamcommunity.com/app/291650/discussions/0/1736595227843429278 ; https://forum.quartertothree.com/t/the-spoiler-free-pillars-of-eternity-thread-about-managing-combat/76675 |
| 33 | Avoid: inconsistent pausing | predictable defaults, one matrix | RimWorld complaint | U §7; https://steamcommunity.com/app/294100/discussions/0/591760218823644744 |
| 34 | Jump to the last alert, repeat to go back | J, 8 deep | StarCraft II | U §6; https://news.blizzard.com/en-us/article/4552955/game-guide-special-control |
| 35 | Right-click dismisses a notification | feed row right-click | Civ VI | X §5; https://forums.civfanatics.com/threads/right-clicking.659074/ |
| 36 | Avoid: a screen reachable only from a notification | every report has a menu path | Humankind complaint | X §5; https://community.amplitude-studios.com/amplitude-studios/humankind/forums/169-game-design-and-ideas/threads/54966-ideas-list-clearer-user-interface?page=1 |
| 37 | Outliner sections appear only when relevant | §2.6, empty sections hide | EU4 | P §5; https://eu4.paradoxwikis.com/Ingame_screen |
| 38 | Pins; a pin key | Pinned section, P | CK3, Vic3 | P §5; https://ck3.paradoxwikis.com/index.php?mobileaction=toggle_view_mobile&title=Keyboard_shortcuts ; https://vic3.paradoxwikis.com/User_interface |
| 39 | Noisy groups collapsed; go-to, pin and zoom-to in panel headers | outliner defaults; left-dock header | Victoria 3 (1.6) | P §5; https://forum.paradoxplaza.com/forum/developer-diary/victoria-3-dev-diary-117-the-ux-of-sphere-of-influence.1677959/ |
| 40 | Double-click an outliner row to center; O toggles it | §2.6 | Stellaris | P §5; https://steamcommunity.com/sharedfiles/filedetails/?id=954597865 ; https://stellaris.fandom.com/wiki/Main_interface |
| 41 | Next army key | N | CK3 | P §5; https://ck3.paradoxwikis.com/index.php?mobileaction=toggle_view_mobile&title=Keyboard_shortcuts |
| 42 | One place for each kind of thing ("Divided UI" removed) | principle 4 | Endless Legend 2 | X §11; https://community.amplitude-studios.com/amplitude-studios/endless-legend-2/blogs/996-ui-ux-next-steps |
| 43 | Avoid: panels eating half the screen | map at least 71% of width at 1280 | Old World and Humankind critiques | X §6, §11; https://bigbossbattle.com/old-world-review/ ; https://steamcommunity.com/app/1271140/discussions/0/4362280244719335674/ |
| 44 | Action buttons styled apart from navigation buttons | §2.2 two button styles | Victoria 3 | P §13; https://forum.paradoxplaza.com/forum/threads/victoria-3-dev-diary-30-user-interface-overview.1507166/ |
| 45 | Avoid: fragmentation and menu hopping | Ledger, tabs, depth budget | Victoria 3 critiques | P §13; https://streamsofconsciousness.blog/2025/02/24/victoria-3-has-the-worst-ui-ive-ever-seen/ ; https://letstalkaboutwargames.wordpress.com/2022/10/24/victoria-3-review/ |
| 46 | A sortable Ledger | §3.6 | EU4 | P §8; https://eu4.paradoxwikis.com/Ledger |
| 47 | An overview that is also a control surface (buy PD, jump) | Ledger inline PD and tax | Dominions F1 Nation Overview | D §1.11; https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html ; https://explorminate.org/dominions-6-masterfully-crafted-magic-and-combat-systems/ |
| 48 | List of everything active in the world | Ledger, Magic tab, active effects | Dominions F6 Global Enchantments | D §1.8; https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html |
| 49 | Undo until new information arrives | undo while paused | Old World | U §9; https://www.pcgamer.com/put-an-undo-button-in-every-strategy-game ; https://forum.quartertothree.com/t/old-worlds-undo-feature-has-ruined-other-tbs-games-for-me/156031/7 |
| 50 | Avoid: confirmation dialogs that train click-through; avoid dangerous key adjacency | inline confirmation only for irreversible actions; no destructive bare keys | UX writing; Dominions `e`/`r` | U §9, D §1.9; https://notes.andymatuschak.org/zXH4ASvHNz488hCNgrBjQJK ; https://steamcommunity.com/app/2511500/discussions/0/7204143093501059856/ |

### 8.3 Map, provinces, armies

| # | Pattern | In Fluid Magic | From | Note §, source |
|---|---|---|---|---|
| 51 | Map modes on keys, with a visible mode menu | Shift+1 to 6, mode strip, legend | EU4, CK3, HoI4 | P §7; https://eu4.paradoxwikis.com/Map ; https://www.gamepressure.com/crusader-kings-3/map-modes/z3f0f7 ; https://defkey.com/hearts-of-iron-4-shortcuts |
| 52 | Shift+number lenses | Shift+1 to 6 | Civ VI More Lenses mod | X §4; https://github.com/astog/MoreLenses |
| 53 | No information gated by zoom level | §2.10.3 | CK3 developer's warning | P §7; https://forum.paradoxplaza.com/forum/threads/ckiii-dev-diary-25-map-features-and-map-modes.1388210/ |
| 54 | A supply mode that shows fed and starving | Supply mode, three steps | HoI4 | P §7; https://forum.paradoxplaza.com/forum/developer-diary/hoi4-dev-diary-supply-and-mulberry-harbors.1481424/ |
| 55 | Lenses that open with an action and revert after | move and ritual targeting modes | Civ VI, Victoria 3 lenses | X §4, P §7; https://civilization.fandom.com/wiki/Lens_(Civ6) ; https://vic3.paradoxwikis.com/Keyboard_shortcuts |
| 56 | Avoid: a lens that masks the map; avoid surprise lens switches | fills only, frame at full contrast; auto priest lens off by default | Civ VII | X §4; https://steamcommunity.com/app/1295660/discussions/2/570371162116298772 ; https://support.civilization.com/hc/en-us/articles/55328611080339-Civilization-VII-Patch-Notes-September-15-2026 |
| 57 | Fog that keeps terrain silhouettes | §2.10.7 | Age of Wonders 4 | X §4; https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-7 |
| 58 | Telegraph the threat on the board | enemy transit arrows with ETA | Into the Breach | U §2; https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i- |
| 59 | A value with its target marker | unrest `34 → 46`, bars with targets | RimWorld mood | U §2; https://rimworldwiki.com/wiki/Needs |
| 60 | A held key shows exact numbers on the map | hold Shift: numeric labels | Factorio Alt mode | U §2; https://lua-api.factorio.com/1.1.34/Concepts.html |
| 61 | Province window opens on left-click | left dock | EU4 | P §8; https://eu4.paradoxwikis.com/Province_interface |
| 62 | Preview an action's effect on its button | tax and PD previews, order effects per day | Victoria 3, AoW4 event choices | P §8, X §10; https://www.pcgamesn.com/victoria-3/construction-buildings ; https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-6 |
| 63 | Missing pieces visible at a glance (district colors) | building slots drawn as outlines | Civ VI | X §10; https://trekkingwithdennis.com/2025/03/02/civ-7-further-thoughts/ |
| 64 | Avoid: "recommended" badges that push the biggest number | no recommended units or targets | Civ VII 1.2.5 | X §10; https://civilization.2k.com/civ-vii/game-update-notes/2025-sep-30-patch-1-2-5/ ; https://www.pcgamesn.com/civilization-vii/update-1-2-5-settlement-menus |
| 65 | Clickable numbers with their own breakdowns; upkeep and growth breakdowns | every stat row | Dominions 5 and 6 | D §1.2, §3; https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html ; https://steamcommunity.com/id/LucidTactics/recommended |
| 66 | Per-province history | History tab | Dominions Province Chronicles | D §1.2; https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html |
| 67 | Recruitment with commanders above, cheap to expensive; dimmed items that cannot start | Recruit tab | Dominions | D §1.3; https://dmacguigan.github.io/dom6-manual/chapters/04-units.html ; https://forum.quartertothree.com/t/dominions-5-warriors-of-the-faith/131532 |
| 68 | Army command panel at the bottom center with unit cards | bottom strip | HoI4 | P §9; https://stratemgames.space/en/hearts-of-iron-iv/game-interface |
| 69 | Status shown on the map army badge | badge corner glyph | CK3 (skull for attrition) | P §9; https://ck3.paradoxwikis.com/Attrition |
| 70 | Unit card, hover, full panel; status icons explain themselves | `UnitCard` depths | Age of Wonders 4 | X §6; https://aow4.paradoxwikis.com/Unit ; https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-wyvern-update-patch-notes |
| 71 | Box selection; Shift adds to the selection; Shift queues waypoints | §2.10.4, §2.10.5 | Dominions 6, Total War, StarCraft II | D §1.4, U §6; https://steamcommunity.com/app/2511500/discussions/0/3807281445020039925/ ; https://primagames.com/featured/total-war-warhammer-formation-control-guide-tips ; https://news.blizzard.com/en-us/article/4552955/game-guide-special-control |
| 72 | Engagement preview on hover with a selection | §2.10.6 | Age of Wonders 4 | X §7; https://www.pcgamer.com/age-of-wonders-4-review/ |
| 73 | Forecasts must show uncertainty; point predictions that miss destroy trust | "Estimate" bar, fog band; trial forecast later, ranges only | Total War: Warhammer III, Songs of Conquest | D §4; https://www.gamewatcher.com/news/total-war-warhammer-3-autoresolve-ambush-battles-withdraw ; https://steamcommunity.com/app/1142710/discussions/0/3934517363281030364 ; https://steamcommunity.com/app/867210/discussions/0/4411920838131986595/ |
| 74 | Hide the UI with a key; jump home and to the god | H; Home, Shift+Home | Dominions | D §1.1; https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html |
| 75 | Named, collapsible commander groups (asked for, missing) | named groups | Dominions 6 players | D §1.4; https://steamcommunity.com/app/2511500/discussions/0/3807281445009631725/ |
| 76 | Avoid: tiny unlabeled icons | icon + label + value in panels | Dominions 6 complaint | D §1.2; https://steamcommunity.com/app/2511500/discussions/0/3807281445009631725/ |
| 77 | Avoid: non-standard mouse conventions | left select, right move | Dominions 5 review | D §1.12; https://explorminate.org/dominions-5-review/ |

### 8.4 Battle planning, reports and replay

| # | Pattern | In Fluid Magic | From | Note §, source |
|---|---|---|---|---|
| 78 | Deployment box: circles for commanders, boxes for squads, color for orders; back on the left | `FormationField` with glyphs as well as color | Dominions Army Setup | D §1.4; https://dmacguigan.github.io/dom6-manual/chapters/04-units.html |
| 79 | Five scripted orders, then a default; limited scripting is part of the strategy | script timeline with "Round 6+ repeats slot 5" | Dominions | D §1.5; https://dmacguigan.github.io/dom6-manual/chapters/04-units.html ; https://steamcommunity.com/app/259060/discussions/0/490123938437588666 |
| 80 | Copy scripts between commanders | Copy and Paste to all casters | Dominions (Ctrl+digit) | D §1.5; https://steamcommunity.com/sharedfiles/filedetails/?id=1428778518 |
| 81 | Deploy and script on one screen | Battle Plan tab | Dominions 6 | D §3; https://rpghq.org/forums/viewtopic.php?t=776 ; https://steamcommunity.com/app/2511500/discussions/0/3807281445020039925/ |
| 82 | Army setup at destination | "At destination" toggle | Dominions (y) | D §1.4; https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html |
| 83 | Avoid: silent spell fallback and logs without modifiers | inline script warnings, log level 4 | Dominions | D §1.5, §1.10; https://steamcommunity.com/app/2511500/discussions/0/4849904427680840957/ |
| 84 | Summary first, then "View battle" | report card, then Watch | Dominions | D §1.10; https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html |
| 85 | Replay instrumentation: speed keys, four log levels, unit list, conditions panel, help overlay | §4.3 log, rosters, condition chips, `?` | Dominions Battles View | D §1.10; https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html |
| 86 | Tab highlights every commander in a replay | Tab in the replay | Dominions 6 | D §1.10; https://forum.quartertothree.com/t/dominions-6-the-history-mythology-pulp-fiction-dark-fantasy-turn-based-strategy-game/159424 |
| 87 | Watch an auto-resolved battle afterwards | Watch from the report | Age of Wonders 4 | D §4.2; https://www.taptap.io/vn/post/5335749 |
| 88 | Named outcome bands | Decisive, Clear, Narrow, Pyrrhic | Total War: Warhammer III | D §4.1; https://totalwarwarhammer.fandom.com/wiki/Autoresolve |
| 89 | The chosen tactic shown beside each general | current script step beside each commander | HoI4 battle screen | P §10; https://hoi4.paradoxwikis.com/index.php?mobileaction=toggle_view_mobile&title=Combat_tactics |
| 90 | Casualties split into routed and killed; named battle phases | report and rosters; phase label | CK3 | P §10; https://www.thegamer.com/crusader-kings-3-how-does-the-combat-battle-system-work/ |
| 91 | Avoid: sluggish replay controls at high speed | responsive transport at every speed | Dominions 5 complaint | D §1.10; https://steamcommunity.com/app/722060/discussions/0/1621726179578427886/ |
| 92 | Flash limits | replay flash cap | WCAG 2.3.1 | U §11; https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold |

### 8.5 Pretender design, research, magic, onboarding, accessibility

| # | Pattern | In Fluid Magic | From | Note §, source |
|---|---|---|---|---|
| 93 | One point budget; awakening trades arrival time for points | budget bar `400 + 150 = 550` | Dominions | D §1.6; https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html |
| 94 | Avoid: left-click to buy and right-click to sell; avoid a bless validated only at game start; avoid hotkey-only save and load | priced steppers, inline `checkPretender`, visible Save and Load | Dominions 5 and 6 | D §1.6; https://illwiki.com/dom5/bcnoexceptions-new-player-guide ; https://steamcommunity.com/app/2511500/discussions/0/4522261062769808325/ ; https://steamcommunity.com/app/2511500/discussions/0/4132682727132483639/ |
| 95 | A research queue players like | [Later] color queue | Dominions 6 | D §1.7; https://vaporlens.app/app/2511500/dominions_6_rise_of_the_pantokrator |
| 96 | Avoid: a long, unsortable spell book | spells in three filtered places, with filter chips | Age of Wonders 4 complaint | X §9; https://steamcommunity.com/app/1669000/discussions/0/3826416272370395409/ |
| 97 | Avoid: tooltips that block clicks while researching spells | capped spell tooltips; details on lock | Age of Wonders 4 review | X §9; https://www.mmorpg.com/reviews/age-of-wonders-4-review-2000127821 |
| 98 | Reactive advice after the tutorial; hints can be reset | blue Hint tier | CK3 | P §12; https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/ |
| 99 | The tutorial as an objective with "Tell me How" and "Tell me Why" | Learn section | Victoria 3 | P §12; https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-51-tutorials |
| 100 | Ask the player's experience at the start | "How much guidance?" | Civ VI | U §8; https://twinfinite.net/guides/civilization-vi-tips-and-tricks-for-beginners/ |
| 101 | Avoid: a help system that repeats tooltips | every Codex page adds something | Old World critique | U §1; https://forum.quartertothree.com/t/old-world-pka-ten-crowns-from-soren-johnson/134746/1543 |
| 102 | A per-screen key overlay | `?` | Dominions | D §1.1; https://illwiki.com/dom5/hotkeys |
| 103 | A symbol, a letter and a hue per color | triple coding of W U B R G | Magic: The Gathering | U §5; https://mtg-archive.fandom.com/wiki/Mana |
| 104 | No information by color alone; let players choose colors | §5.6 | Game Accessibility Guidelines, Xbox AG 103 | U §5; https://www.webbie.org.uk/blog/?p=115 ; https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/103 |
| 105 | A symbol-based color-blind mode | glyphs in particles, patterns in modes | ReCore | U §5; https://mcvuk.com/?p=62330 |
| 106 | Shake off or low by default; detail on by request | shake 50% default | Path of Exile complaint | U §3.5, §11; https://devtrackers.gg/pathofexile/p/9c4ded3b-why-does-horrible-options-like-screenshake-are-default-but-awesome-ones-like-advance-description-or-the-freaking-clock-arent |
| 107 | UI that stays sharp above 1080p | rem sizing, UI scale | Civ VII complaint | X §11; https://steamcommunity.com/app/1295660/discussions/0/591762405949782656/ |
| 108 | Browser keys a page cannot reliably capture | F-keys best effort; never-bound list | Mozilla, WebKit, Chrome Keyboard Lock | U §6; https://bugzilla.mozilla.org/show_bug.cgi?id=1203059 ; https://bugs.webkit.org/show_bug.cgi?id=35849 ; https://developer.chrome.com/docs/capabilities/web-apis/keyboard-lock |

---

## 9. Deviations, open items and the build plan

### 9.1 Deviations from the current `docs/07-ui.md`

Record these in docs/07 when this spec replaces it.

1. **Top bar order.** The clock and speed controls move to the top right (EU4, Stellaris, HoI4).
   Population, dominion score and the Wellspring track are added to the bar.
2. **Map mode keys.** Shift+1 to Shift+6 are primary and F1 to F6 are best effort, because
   browsers reserve F1, F5 and F6.
3. **Right dock.** "Army list of selected province, messages" becomes the outliner plus the
   message feed. The army list of a province moves to the province panel's Forces tab and the
   bottom strip.
4. **Ritual panel.** Docked as the commander's Rituals tab with map targeting, not a modal.
5. **Orders.** Moved from the commander panel to the bottom strip. The commander panel keeps
   information and the Battle Plan editor (formation and script on one tab, replacing the
   separate Squads and Script sections).
6. **Province panel.** Tabs: Overview, Recruit, Forces, History.
7. **New screens:** Ledger (L) and Codex (F). Settings gains Messages, Interface,
   Accessibility, Audio and Controls tabs.
8. **Messages.** Per-type display (Off, Log, Toast, Popup) and Pause. New kinds: `approaching`,
   `siege`, `godless`, `pretender`, `eliminated`. Auto-pause defaults extend docs/07's list
   (section 5.3).
9. **Battle replay.** The player's side is always on the left. A report card comes before the
   replay and serves as its end card. Four log levels, a scrubber with markers, round stepping,
   cinematic mode. Speed keys 1 to 4 set 0.5× to 4×.
10. **Keyboard.** Added: `+`/`−`, Z/X, M, N, J, V, L, F, O, P, I, T, H, `[`, `]`, `?`, Home,
    Backspace, Ctrl+Z. C opens the selected mage's Rituals tab.

### 9.2 Open items that need sim support (not UI-only)

| Item | Why | Priority |
|---|---|---|
| `explain*` breakdowns with a property test | principle 3; every L1 breakdown | M1 |
| `checkCommand` returning every check | condition blocks | M1 |
| New message kinds and `refs` | message settings, links | M1 |
| `armyPower` moved into the sim | the engagement preview and the AI share one number | M1 |
| `scriptCheck`, `predictRitual`, `summarizeBattle`, `checkPretender`, `pretenderReading`, `supplyAfterArrival` | sections 2.8, 3.3, 3.5, 4.2 | M1 |
| Research queue of colors | Dominions 6's best-liked change | Later |
| Repeat recruitment per fort | Dominions 5 and 6 have it; a UI loop would break "the AI uses the same commands" | Later |
| Recast a ritual monthly | Dominions' Shift+m | Later |
| A trial forecast in a Web Worker with UI-owned seeds and a visible-knowledge setup | ranges, never a point | Later |
| Commander groups in `GameState` | only if multiplayer (M4) needs them; M1 keeps them in UI save data | Later |

### 9.3 Build plan by phase

| Phase | UI work from this spec |
|---|---|
| 8 Map and core UI | Tokens and primitives (§6.1); `Tip` with value, entity and action tooltips, timing, Esc, Shift detail (§5.1 without pinning); `TopBar` with breakdowns (needs `explain*`); clock, speed, auto-pause and reason chip; alerts ribbon with the M1 types; outliner sections 2 to 9; message feed; left dock with Province (Overview, Recruit, Forces) and Commander (Overview) panels; bottom strip; map with six modes, labels by zoom, badges and stacks, move preview, cursor label, right-click, Shift waypoints, engagement preview with `armyPower`; concepts content skeleton; `checkCommand`; message kinds |
| 9 Remaining UI | Nested concept tooltips and the Codex; Battle Plan tab (formation field, script timeline, `scriptCheck`); Rituals tab and targeting (`predictRitual`); Research modal; Ledger; Settings (all tabs, message matrix, bindings); Main Menu, New Game, Pretender Design (`checkPretender`, `PretenderCard`), Game Menu and save/load, Victory; onboarding (guidance, hints, Learn); History tab; undo while paused; pinning; named groups |
| 10 Replay viewer | `BattleReport` and `summarizeBattle`; the replay frame (§4.3) around the presentation's `BattleStage`; scrubber with `foldReplay` seeking; captions; shared gore, shake and SFX settings |
| 12 Balance and polish | playtest the pause defaults (research level), tooltip delays, alert noise, the map width at 1280; [Later] items as time allows |

### 9.4 Not verified

- The four research notes were built from search extracts. Their pages could not be opened,
  and this session's search budget was spent before any extra checks. Treat the quoted
  wording as approximate.
- Total War: Warhammer III's campaign army panel, pre-battle balance-of-power screen and
  results screen are described in `research-fourx.md` §12 from memory, marked unverified,
  and are not relied on here. Only the Total War facts with citations in
  `research-dominions.md` §4.1 are used (forecast, outcome labels, trust problems).
- Whether Chrome and Firefox let a page capture F1 and F6 today must be tested before any
  F-key binding is kept.
- Floating cards (pinned tooltips) have no precedent in a shipped strategy game and need a
  playtest.
