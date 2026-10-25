# Dominions and auto-battle games: UI research for Fluid Magic

Cluster: Dominions 5 and 6 (Illwinter), plus games with pre-battle orders, auto-resolve, and
replays (Total War, Age of Wonders 4, Songs of Conquest). Written 2026-10-21 for the
"UI matches similar games; complexity tastefully layered under smart menu design" direction.

## How the sources were gathered (read this first)

- The network policy in this session blocked direct page fetches from illwinter.com, Steam,
  illwiki, Wikipedia, review sites, and Reddit. Two kinds of evidence were still available:
  1. **The Dominions 6 manual, read in full.** An unofficial web edition transcribes
     Illwinter's official manual PDF (https://www.illwinter.com/dom6/dom6manual.pdf). Its
     source files were downloaded from GitHub
     (https://github.com/dmacguigan/dom6-manual, `chapters/*.qmd`) and read directly. Claims
     tagged **[M…]** are paraphrased from that text, with key phrases quoted.
  2. **Web search excerpts** for everything else (guides, wikis, reviews, forum threads).
     These tags are **[W…]** (wikis and guides), **[R…]** (reviews), **[D…]** (Dominions
     community threads), and **[T…] / [A…] / [S…]** (Total War, Age of Wonders 4, Songs of
     Conquest). I could not open these pages, so wording is paraphrased from the excerpts.
     Community claims are one player's report unless several sources agree. Where a search
     surfaced a claim without making clear which thread it came from, the reference says so.
- Battle Brothers was optional. Searches returned nothing usable about its formation screen,
  so it is left out rather than described from memory.
- The full reference list with URLs is at the end.

---

## 0. Summary: ten findings

1. **Dominions gives every function a button and a one-letter key**, grouped by scope
   (province, nation, magic, game) in a bar at the top right of the map [M1]. A `?` overlay
   on every screen lists that screen's keys [M5][R2][W1]. Veterans defend the UI mainly
   because of the hotkeys [D2]. Fluid Magic should keep both the scope grouping and the
   per-screen `?` overlay.
2. **The pain is discoverability and density, not depth.** Critics and players name the
   same faults again and again. The mouse conventions are non-standard [R3][W5]. Some
   information hides behind right-click or hover [M1][M2]. Save and load moved behind
   hotkeys [D9]. Dominions 6 replaced labels with tiny icons [D1]. Commanders cannot be
   grouped [D1]. Battle logs omit modifiers [D7]. None of this is needed for depth.
3. **Army Setup is the model for Fluid Magic's battle plan.** It has a deployment preview
   in which **shape means commander or squad and color means order** [M3]. Each commander
   gets five scripted orders, then a general order [M3], and scripts can be copied between
   commanders with `Ctrl+digit` [M3].
4. **Battle reports come in two steps:** a summary with casualty lists, then "View battle"
   [M5]. The replay has speed keys, a log with four detail levels, a per-unit log, a unit
   list (F1), and a weather and scales panel (F2) [M5]. Keep the two steps and the panels,
   and add a timeline scrubber.
5. **In Dominions, numbers open their own breakdowns.** Clicking the Population line shows
   growth. The Treasury and Income buttons list spending, income, and upkeep [M1].
   Dominions 6 added more breakdowns, which a veteran reviewer singled out [D6]. Fluid Magic
   has a selector for every rate, so every number should have a hover breakdown.
6. **Dominions 6 changed the UI only in small steps:** drag-select in Army Setup, labels on
   squads, easier battle-order changes, a research queue, upkeep and population-growth
   breakdowns, item search, filters on the F1 overview, and more hotkeys [D4][D6][D13][R1].
   Players still call the UI clunky [R7][D1][D2].
7. **Modern auto-resolve shows a forecast before you commit.** Total War: Warhammer III
   predicts the result, the units likely to die, and the rough casualties [T1][T2]. Age of
   Wonders 4 forecasts unit loss and damage [A1]. These games also let you watch the
   simulated fight afterwards [A2]. Players lose trust when a forecast misses [T3][S2][S3],
   so a forecast must show ranges.
8. **For pretender design, keep Dominions' economy and change its controls.** Keep the
   point budget and the awakening trade (450 points, +150 dormant, +350 imprisoned [M2]).
   Replace "left-click buys, right-click sells" [M2][W5] with labeled steppers that show
   each price. Validate inline: Dominions 6 lets you pick an invalid bless and only
   errors at game start [D8]. Show Save and Load as buttons [M1][D9].
9. **Replace the start-of-turn message list [M1] with a filtered event feed** that is tied
   to auto-pause, and add a per-province history tab, the analog of Dominions' Province
   Chronicles (key `i`) [M1].
10. **Add the overview Dominions has, and the grouping it lacks.** F1 Nation Overview shows
    provinces and commanders, buys province defense, and jumps to provinces [M1]; Fluid
    Magic should have it as a sortable, filterable Ledger. Dominions has no named,
    collapsible commander groups, which players ask for [D1].

---

## 1. Dominions screen by screen

Each pattern gives what the screen does, then **→ Fluid Magic** (FM), meaning how it maps
onto `docs/07-ui.md` and the sim.

### 1.1 Main map screen and the command bar

**Layout [M1]:**

```
+--------------------------------------------------------------------------+
| season icon (hover: season + turn no.)   national summary (god, treasury, |
|   income (upkeep), gem icons with +income)          [button bar, 5 groups]|
|                                                     [plane buttons]       |
|                                                                           |
|                    MAP (provinces, armies, dominion candles)    province  |
|                                                                 attribute |
|                                                                 box       |
+--------------------------------------------------------------------------+
```

- **The bar is grouped by scope [M1]:**

  | Group | Buttons (key) |
  |-------|---------------|
  | Province | End turn (e), Army setup (t), Army setup at destination (y), Patrolling army setup (u), Recruit (r), Mercenaries (b), Province Chronicles (i) |
  | Nation | Read messages (m), Send messages (s), Nation Overview (F1), Score graphs (F2), Hall of Fame (F3), Pretenders (F4) |
  | Magic | Research (F5), Global Enchantments (F6), Item treasury (F7), Item overview (F8), Thrones (F9) |
  | Game | Options (Esc), End turn (e) |

  The manual adds: "The Province buttons refer only to the province you have selected; they
  may do nothing if the province you have selected is owned by the enemy."
- **Hide the UI:** `h` hides all buttons and commanders, leaving only the map [M1].
- **Map filters [M1]:** `Ctrl+f` opens a filter menu. `Ctrl+1` to `Ctrl+0` toggle flags and
  forts, armies, dominion, the income box, thrones and events, troop visibility, neighbor
  lines, province names, and remote rituals. Navigation keys: `Home` goes to the home
  province, `Ctrl+Home` to the pretender, `g`/`#` to a province by number, and `Delete`
  zooms to fit the whole map.
- **The "capsule screen" overlay (`Ctrl+4`)** puts income, resources, and dominion on every
  province. Hammers and standards grey out as resources and recruitment points are spent
  [M1]. The manual calls it "a good way of scanning to see if there are any provinces with
  underallocated resources or production."
- **The turn number is hidden:** "If you mouse over this [season symbol] it will tell you
  the exact season and the current turn number" [M1]. Returning players had to ask where it
  was [R7].

**→ FM**
- Keep scope grouping for the TopBar menu and the docks. Every province action lives in the
  province panel, every nation action in the TopBar or the Ledger, and every magic action
  behind the Research, Rituals, and Active Effects buttons. Each button shows its key in its
  tooltip, and `?` shows the screen's keys.
- Keep a hide-UI key (`H`). Map screenshots and reading dominion fronts both benefit.
- FM's F1 to F6 overlays already match Dominions' map filters. Add one "capsule" overlay:
  a small per-province chip with net gold and supply margin, the analog of `Ctrl+4`. Its
  job is the same, finding provinces that are under-used or starving at a glance.
- Never hide the date. The FM TopBar shows it permanently (`docs/07-ui.md` does).
- Add `Home` (capital) and `Ctrl+Home` (pretender), as Dominions has. Replace "go to province
  by number" with type-to-search (`G`, then type a name), since FM provinces have names
  only.

### 1.2 Province window

- **Selecting and seeing [M1]:** right-clicking a province views it (switchable to
  left-click in preferences). Its attributes appear "in a box on the right side of the
  screen". Unscouted provinces show only name and number. With dominion over a province you
  see its income and scales even without owning it.
- **The numbers are interactive [M1]:**
  - Clicking the Population line shows the growth or death rate.
  - Clicking "Defense", or pressing `d`, raises province defense, at "an amount of gold
    equivalent to the new level purchased".
  - The Treasury button lists "all gold you have spent so far this turn".
  - The Income button lists "all income and upkeep costs".
- **Formulas are documented, not shown.** The manual prints the formulas for income,
  supply, and recruitment points [M1], but the screen shows only results ("The number shown
  is after all modifications").
- **Visual density:** Dominions 6 "mov[ed] all clearly readable labels into extremely
  small, hard to read icons", which players call a clear downgrade. They asked for a toggle
  back to the Dominions 5 style [D1].
- **Province history:** Province Chronicles (`i`) shows "information about the province and
  its inhabitants as well as all past important events that have occurred there" [M1].

**→ FM**
- The FM province panel already lists the right numbers. Each row should be **icon + label +
  value + monthly delta**: never an icon alone (the Dominions 6 lesson) and never a number
  without its delta.
- **Hover a row to see its breakdown, from the selector.** `provinceEconomy` returns
  gold, materials, supply, `supplyUsed`, mana, growth, unrest, and pillage. The tooltip
  shows the terms that make each one: base, scales by name and step, buildings, ritual
  effects, and unrest factor. Click the row to pin the breakdown inline (Dominions' "click
  Population to see growth", made consistent).
- **Make purchases buttons that show their cost.** The PD row gets a `+` button labeled
  with the next level's cost (`(level + 1) * 15`, docs/01), plus a `D` key. Dominions'
  click-on-the-word "Defense" is the undiscoverable version of the same idea.
- **Add a History tab** that filters the message log by `province`. Messages already carry
  `province: ProvinceId | null` (`src/sim/types.ts`), so this needs no sim change.

### 1.3 Recruitment

- **Layout:** commanders sit in the top section and regular troops in the bottom one [G5].
  In Dominions 5 cheaper units sat to the left and better ones to the right, with
  commanders running from scouts to the strongest mages (community report, Quarter To Three
  Dominions 5 thread [D15]).
- **Clicks:** left-click adds a unit to the build queue and right-click shows its info
  [G1]. `Shift` while selecting picks ten of a unit, and up to 250 units can be queued per
  province [M3].
- **Units that cannot be built this turn are dimmed:** "Units that cannot be built in the
  current turn, but are in the queue, are dimmed in the recruitment area" [M3]. Gold limits
  queueing outright. Resources and recruitment points allow queueing for later turns [M3].
- **Repeat recruitment:** a "Repeat Recruitment" box keeps an order running every turn
  [G6]. It already existed in Dominions 5, alongside "Reset recruitment", which clears both
  queues [G1].
- **New units arrive in the garrison row,** "the unassigned unit pool at the top of the Army
  Setup screen" [M3].

**→ FM** (`docs/07-ui.md` "Recruit tab")
- Order the grid in two bands, commanders above and troops below, cheap to expensive left
  to right. Players coming from Dominions will look for it there.
- **Click adds one batch** at the panel's batch size. `Shift`+click adds ten. Right-click or
  `I` opens the unit card (hover already shows a short card).
- **Queue rows show a time bar and stay dimmed with a reason** while they cannot start:
  "Waiting: 40 materials" or "Blocked: unrest above 50". This is Dominions' dimming plus
  the reason it never gives. FM pays gold and materials when an item is queued (docs/01
  section 8), so most dimming comes from fort materials and unrest.
- "Repeat batch" is a good later addition but **needs a sim command**, because a UI loop
  issuing recruits would break "the AI uses the same commands". Record it as an open item.
- Arrivals land in the garrison commander's squads, so the drop targets in the right dock
  are FM's version of Dominions' garrison row.

### 1.4 Army Setup: squads, leadership, and the battle position preview

- **Structure [M3]:**
  - A garrison row of unassigned units sits at the top.
  - Each commander leads up to five squads within its Leadership.
  - To make a squad, click units, then click a squad box (to add) or the commander's icon
    (to start a new squad).
- **Selection helpers [M3]:**
  - Double-click selects every unit of a type; Shift-click adds to the selection.
  - Hovering a squad: `w` selects units with afflictions, `e` units with two or more
    experience stars.
  - `?` lists every shortcut.
  - Dominions 6 added box (drag) selection [D4][D6][D13]. It lets players "deploy + script
    them without having to go back and forth between screens" [D13].
- **The battle position box [M3]** is a small field beside each commander. Commanders are
  **circles**, squads are **boxes**, the left side is the back, and the right side is the
  front. Right-click moves the selection. **Color encodes the order:**

  | Color | Meaning |
  |-------|---------|
  | White circle / box | selected commander / squad |
  | Grey circle | commander |
  | Purple circle | commander with Cast order |
  | Yellow circle / box | Retreat order |
  | Grey box | squad with default orders |
  | Turquoise box | Attack Rear |
  | Dark blue box | Guard Commander |
  | Light blue box | Hold and Attack |
  | Red box | squad with undisciplined units |

- **Leadership feeds morale.** The manual gives a table of morale effects by squad count
  for each leadership tier (for example, leadership 100 gives +1 morale for three or fewer
  squads) [M5]. The line formations (Line, Double line, Sparse line) need good leaders
  [M5]; players put the threshold at leadership 80 [D12].
- **Variant screens:** "Army setup at destination (y)" shows "commanders that will be
  present next turn instead of those currently present" [M1]. "Patrolling army setup (u)"
  shows patrollers only [M1].
- **Pain point, grouping:** "No ways to group or reorder… a tedium of micro where you are
  looking at dozens of icons in every province". The poster asks: "Why not add a way to
  group commanders and collapse the group?" [D1]. Workarounds include renaming a commander
  as an army label [D5]. Moving troops between armies is the first example new players give
  of unintuitive design [D2].

**→ FM** (commander panel "Squads" and "Script", plus the right-dock drop targets)
- **Use a Battle Plan tab, not two separate lists.** FM squads have no orders, only a row
  (`formation: front | middle | rear`), and only commanders have scripts. Show a
  three-row mini-field for the player's side, with the enemy side ghosted. Keep Dominions'
  convention: **commanders are circles, squads are boxes**, and the back is on the left.
  Drag a squad between rows to set its formation. A commander's circle gets a ring that
  shows the first scripted stance:

  | Stance | Ring | Symbol |
  |--------|------|--------|
  | Cast | the spell's mana color | the mana symbol |
  | Attack | | crossed swords |
  | Hold | | shield |
  | Retreat | | arrow |

  Color is never the only signal, as FM's accessibility rule requires.
- **Show leadership as a meter,** "45/60 troops", on the commander card and in the plan.
  Dragging a squad onto a commander who lacks the leadership shows the drop as refused,
  with the reason.
- **Add a "Plan at destination" toggle.** When the selected commander is moving, the plan
  shows the other own commanders who will be in the target province on arrival, using
  movement ETAs. This is Dominions' `y` translated to real time.
- **Add named groups:** a UI-level label over several commanders, shown in the right-dock
  army list as a collapsible header, with "select group" and "move group". docs/01 already
  says "Grouping is a UI concept". Groups need to be saved with the game, but not in
  `GameState`: the UI store's save slot can hold them, which keeps the sim hash untouched.
- **Drag-select on the map** (box select of army badges) and Shift-click to add to the
  selection. Dominions 6 added these to Army Setup and players praised them [D4][D6].

### 1.5 Battle orders and commander scripts

- **Squad orders [M3]:**
  - General: None (the AI decides), Attack, Fire, Guard commander, Hold and attack (holds
    two rounds, then advances), Hold and fire, Fire and keep distance, Retreat.
  - Target: None, Archers, Cavalry, Fliers, Large monsters, Closest, Rearmost.
  - FAQ in the manual: "Can't my soldiers be ordered to just sit back and defend
    indefinitely? No."
- **Commander scripts [M3]:**
  - "In the commander battle orders menu, the top four orders are specific, while the
    bottom four are general orders. Specific orders last for one turn… Up to five specific
    orders can be scripted for a single commander. If a commander receives no orders, the
    AI will assign them."
  - Specific orders: Hold one turn, Hold or Fire, Hold or Cast (AI-chosen spell), Cast a
    specific spell, Attack one turn, Fly Attack one turn.
  - General orders: Stay behind troops, Attack, Cast spells, Advance and cast, Retreat.
  - Players summarize it as "5 turns of commands to mages… then the AI decides" [G2].
- **Fallbacks are silent.** "Cast a specific spell if the commander has sufficient gems
  and there is a valid target in range. If not, the AI will choose a spell" [M3]. A
  "conservative gem use" checkbox limits gems to scripted spells [M3][M6].
- **Speed tools:**
  - `x` repeats the last order [M3].
  - Scripts copy across commanders: hover a script, press `Ctrl+digit` to store it, then
    hover a target's `<set battle orders>` and press the digit [M3][G1].
  - Army Setup keys assign orders, for example `a` attack, `h` hold and attack, `g` guard
    commander, and `C` / `r` closest / rear targets [W1].
- **The five-slot limit is a deliberate design choice.** Dominions 4 players defend
  "limited spell scripting" as "an integral part of both game balance and strategy" [D16].

**→ FM** (docs/04 "Scripts": 5 slots of `Cast(spell?) | Attack | Hold | Retreat`, repeat slot
5 unless it is Retreat, an empty Cast means the best castable spell)
- **Draw the script as a timeline:** five slots labeled Round 1 to Round 5, then a sixth,
  greyed cell that reads "Round 6+: repeats slot 5". This states FM's rule on the screen,
  where Dominions leaves it to the manual.
- **Each slot is a dropdown, but spells show their requirements inline:** mana symbols
  for pips, fatigue cost, and a carried-mana badge.
- **Warn in place, not silently:**
  - A slot with a spell the commander cannot cast is flagged amber with the reason ("needs
    RR, has R", "needs 1 carried R; carries 0") and a one-click fix where one exists ("Give
    1 R"). Dominions' silent AI fallback is what players end up decoding from logs [D7].
  - Show the projected fatigue over rounds 1 to 5 as a small bar (spell fatigue minus 5 per
    round, from the docs/02 rules). The player then sees "this mage faints in round 4"
    before the battle.
- **Script presets as one-click chips:** Auto (all five slots empty Cast, which is FM's
  default for mages), Artillery (best damage spell ×5), Support (buff, buff, then Auto),
  Stand fast (Hold ×5), Charge (Attack). Presets are UI templates that issue the normal
  set-script command, so there is no new sim rule.
- **Copy and paste:** "Copy script" and "Paste to all mages here" buttons, with `Ctrl+C` and
  `Ctrl+V` while hovering a script. These are Dominions' `Ctrl+digit` made visible.
- **Hide the full editor behind the commander panel's Battle Plan tab.** The bottom
  commander strip shows only a compact five-glyph summary (`⚔ ✦R ✦R ⛨ ⛨`) that opens the
  tab on click. This is the layering the project owner asked for: the summary at Layer 0,
  the editor at Layer 2.

### 1.6 Pretender design

- **Budget and costs [M2]:**
  - "Each nation starts out with 450 points" in Dominions 6. Dominions 5 had 425 [M8].
  - Points go to physical form, magic, and dominion. "The Awakening" trades a later
    arrival for points: Dormant +150 (arrives in about 10 to 13 turns), Imprisoned +350
    (about 28 to 42 turns).
  - Path costs are cumulative (8, 16, 24…), and the first level of a new path costs the
    chassis's "New Path Cost". The wiki gives that as 10 to 80 points [W2].
  - Dominion candles cost 7, 14, 21… above the chassis base.
  - Chassis are "organised according to their base dominion strength" [W2].
- **Controls:**
  - Scales: "Each left-click of a scale costs 40 points. Each right-click of a scale gains
    you 40 points" [M2].
  - A new-player guide describes the whole god-creation screen the same way: left-click
    adds, right-click removes [W5].
  - Chassis stats are seen "by right-clicking on the pretender in the selection screen"
    [M2].
- **Bless points come from paths:** "every skill level above one in a path equals one
  bless point", and a bless costs its path requirements [M2]. Dominions 6 lets a player
  pick a bless whose requirements are not met, and only refuses at game start with "Magic
  path requirements for the bless effects are not fulfilled" [D8].
- **Save and load:** designs save with `Ctrl+S` and load with `Ctrl+L` [M1]. In Dominions 6
  the on-screen buttons were removed, so these became hotkey-only [D9]. A new player found
  them hidden [R7].
- **Effects are listed in prose tables.** Scale effects appear as text per click ("Increases
  income by 3%…"), and the manual warns that province scales lag behind the chosen ones
  [M2].

**→ FM** (`docs/05-pretender.md`: 400 points, awakening +150 / +350, three-column screen,
live summary card, presets)
- **Keep:**
  - The single point budget with the awakening refund shown as arithmetic ("400 + 150 =
    550"; docs/05 already specifies this).
  - The idea that pips, dominion, and scales trade off against each other.
  - Chassis that grant base pips, so the "already has R1" discount reads as Dominions does.
- **Modernize the controls:**
  - Every pip row is `[−] ◉◉◉○○○ [+25]`. The plus button prints the next step's price, and
    the minus button the refund. A new color shows "+60: new color".
  - Scales are five two-pole sliders with the pole mana symbols at the ends and step
    prices on the ticks. Steps against the grain carry a warning glyph and cost 40, matching
    docs/05.
  - No right-click-only controls.
- **Show consequences live, never at game start:**
  - The bless text appears the moment a color reaches 4 (docs/05 already says the player
    sees the bless appear).
  - Invalid states can't be reached: the minus button disables at base pips and at the
    chassis's base dominion, with the reason in a tooltip, using the same rules as
    `validatePretender`.
  - The dominion estimate ("about N provinces by Year 2") updates as candles change.
- **Make the chassis card a hover card,** with a pinned full card on click, never
  right-click only. Badge the two chassis that fit the nation (docs/05 says the UI
  highlights them).
- **Show Save design / Load design / Presets as buttons,** with keys as accelerators only.

### 1.7 Research

- **Screen:** "The research bars in the Arcane Laboratory (F5) show research progress per
  school" [M6]. The F5 button sits in the Magic group [M1].
- **Queueing:**
  - Dominions 5: left-clicking a school's name queued one level, and leftover points
    flowed to an unfinished school from the top of the screen [W3].
  - Dominions 6 has a research queue, which players call more convenient than the old
    allocation fiddling [R7].
  - Patch 6.37 added up and down keys to swap research targets and a `?` help on the
    research screen [D10].
- **Previews:** right-clicking spell categories in the research tab shows what the next
  tier unlocks, and right-clicking a spell shows its effects (Dominions 5 guide [G5]).

**→ FM** (`docs/07-ui.md` Research panel: five color columns, levels 1 to 6, click a
header to set the active color, RP per month, months to next level)
- **Hovering a level** shows the spells it unlocks, with the requirement and a one-line
  effect. Clicking a spell pins the full card. This is Dominions' right-click preview on
  hover.
- **The header shows who is researching:** "4 mages in 2 labs: 38 RP/month". Hovering it
  lists each mage, its pips, and the Lore scale factor. The formula in docs/02 makes this a
  pure selector.
- A **queue of colors** (research R to 4, then G to 2) is the Dominions 6 improvement
  players like. It **needs a sim change**, because FM keeps one active color. Record it as
  an open item. Until then the panel shows a "When R reaches 4, switch to…" reminder that
  only fires an alert.

### 1.8 Rituals and global enchantments

- **Rituals:**
  - Rituals take a month, need a lab, and draw gems from the lab [M6].
  - Local enchantments persist on a province, some with duration extended by extra gems
    [M6].
  - A ritual can be set to recast monthly with `Shift+m` [M6].
- **The F6 Global Enchantments screen** lists "the global enchantment spells currently
  affecting the world" [M1][M6]. Slots are limited (3, 5, 7, or 9) [M6]. A global is tied
  to its caster, and if the caster dies it is dispelled [M6][W4].

**→ FM** (Ritual panel, key C; timed province effects in `state.provinceEffects` with `untilDay`, read through `activeEffects`)
- Add an **Active Effects** screen, a list in the style of F6, to the Magic group: every
  timed ritual effect, both own effects and visible enemy ones. Columns: name, mana
  symbol, province (with jump), owner banner, days left as a bar. Sort by days left. On
  the map, a small glyph per province shows that an effect is active, with the tooltip
  naming it. Fertile Season, Forge of Cinders, Bounty of the Loam, Rootwall, and Burn the
  Fields all fit.
- **Ritual target picking:** valid provinces highlight on the map (docs/07 already says
  so). Hovering a target shows the predicted effect from the selectors, for example "Supply
  140 → 280 for 6 months".
- A "recast monthly" toggle, like Dominions' `Shift+m`, would need a sim order variant.
  Record it as a later item.

### 1.9 Messages and alerts

- **Dominions is turn-based,** so alerts are "beginning-of-turn messages", read with `m`
  [M1]. Events arrive as "An unexpected event has occurred in…" [W7]. A battle message
  ("There was a battle in <province>") opens a summary, which leads to the replay [M5].
- **Dominions 6 has a "confirm turn end" option.** Players asked for it after hitting `e`
  (end turn) instead of `r` (recruit), which sits next to it [D3][G4]. Songs of Conquest players
  asked for the same protection [S5].

**→ FM** (real time with pause)
- **The right-dock feed** has category filter chips (Battles, Military, Economy, Magic,
  Dominion) and severity by **icon and color**:
  - red with an alert glyph for a lost province, an enemy army sighted, or starvation;
  - gold for a Wellspring or a won battle;
  - neutral for recruits and research.
  Each row has a jump button and, for battles, a Watch button. An unread count sits on the
  dock tab.
- **Auto-pause per category** goes in Settings. docs/07 already lists the pause triggers;
  show them as a checklist with the same categories as the chips. When the game
  auto-pauses, the triggering row pulses and the map pans to its province.
- **Confirm only what cannot be undone:** Storm while the walls stand (docs/01 says the UI
  "strongly discourages" it), Make Prophet, casting a ritual that spends mana, and
  cancelling a queued ritual. Keep these off bare single-letter keys (the Dominions `e`/`r`
  lesson).

### 1.10 Battle report and replay viewer

- **Two-step access [M5]:** click "There was a battle in <province>" for the summary with
  casualty lists, then "View battle" for the replay.
- **Replay keys [M5]:**

  | Key | Action |
  |-----|--------|
  | Space | pause |
  | f / t / s | fast, fastest, normal speed |
  | z | slow motion |
  | q | quit |
  | 1 to 4 | log detail, least to most |
  | + / − | scroll the log |
  | v | "while viewing a unit, show its combat log" |
  | F1 | list of all units |
  | F2 | "view current weather and dominion scales" |
  | c | team-colored squares |
  | g / w | grid / wireframe |
  | PageUp / PageDown | camera height |
  | ? | help |

  Dominions 5 also had `N` to skip slow stretches and `X` for super slow motion [W6][G3].
  In Dominions 6, `Tab` highlights all commanders, which helps spot hidden enemy ones
  [D12].
- **Conventions:** "The attacker is on the left, the defender on the right" [M5].
- **Pain points:**
  - Logs omit some effects, such as fatigue penalties and critical hits, so numbers are
    hard to interpret without outside research [D7].
  - In Dominions 5, scrolling stayed sluggish at fast replay speed even when paused [D11].
  - Dominions 6 added fast and slow battlefield panning [D6].
  - Wargamer calls the battle simulator "the beating heart" of Dominions 6, with each
    unit's wounds, experience, and kills tracked [R1].

**→ FM:** see section 4, which gives the full frame.

### 1.11 The overview screens

- **F1 Nation Overview:** "a global picture of your units and provinces. Buy province
  defense, go straight to a province, and track magic site searches" [M1]. Dominions 6
  added new filters to it [D4].
- **F2 Score graphs** compare nations. F8 lists every magic item and where it is [M1].
- **The Explorminate review of Dominions 6** calls the UI simple and hotkey-built, and says
  "most menus would benefit from a search bar and more advanced filters" [R2].

**→ FM:** a **Ledger** screen (key `L`; Nation group in the TopBar menu) with three tabs:
- **Provinces:** a sortable table of population, growth, gold, supply used and available,
  unrest, dominion, PD (with an inline `+`), and buildings, with a row filter ("starving",
  "unrest > 30", "no temple").
- **Commanders:** location, order, troops versus leadership, script status (a warning icon
  when a slot is invalid), and an idle flag.
- **Queues:** every fort's recruitment queue and every ritual in progress.

Every row jumps to the map. This is F1 with search and filters, the gap the reviews name.
Add a "next idle commander" key (`.`) next to `Tab`, which cycles own commanders.

### 1.12 Keyboard and mouse model

- **Mouse:**
  - Dominions views a province with right-click. Left-click selects a commander, then
    left-click on a province moves it [M1].
  - Right-clicking a unit, item, or spell gives information "in almost any screen" [M1].
  - Order variants hide behind modifiers: `Ctrl`-click forces a stealthy commander to move
    in the open, and `Shift+Ctrl` gives Move and Patrol [M4].
  - The Explorminate review of Dominions 5 says the controls "stubbornly refuse to follow
    modern, left click to select, right click to move conventions" [R3].
- **Keyboard:**
  - Each screen has its own single-letter keys with a `?` overlay [M3][M5][R2][W1].
  - Players say the UI "is basically a 90s game" that veterans tame with hotkeys after
    many hours [D2].
  - Critics found the look intimidating, especially for people used to Civilization or
    Total War [R4][R5].

**→ FM:** keep `docs/07`'s modern mouse: left-click selects and right-click moves. Put
information on **hover** (short card) and on `I` or a visible ⓘ button (full card), and
never on right-click alone, since right-click on the map means move. Keep Dominions'
key-per-action density, with visible buttons as the primary path and keys as accelerators
listed in tooltips and in the `?` overlay.

---

## 2. Consensus on Dominions UI pain points

| Pain point | Evidence | FM response |
|------------|----------|-------------|
| Steep, untaught learning curve | Reviewers call it intimidating, with a heavy manual and a steep curve [R5][R4][R9]. A Steam reviewer notes there are no tutorials [R8]. Players say that without someone explaining, it is hard to figure out alone [D1][D2]. | Contextual first-run hints in the docks, one-line explanations on every tooltip (already in docs/07), and presets in pretender design. |
| Non-standard mouse conventions | The Dominions 5 review quoted in 1.12 [R3]. Right-click-to-view province [M1]. Left-click buy / right-click sell in design [M2][W5]. | Left select, right move; no right-click-only functions. |
| Hotkey-first, hidden functions | Save and load pretender became hotkey-only [D9]. Order variants hide behind modifiers [M4]. The turn number hides in a hover [M1]. | A visible button for every action, with keys shown in tooltips. |
| Dangerous key adjacency, no confirmation | `e` (end turn) next to `r` (recruit), with no second step [D3]. | Confirm irreversible actions; no destructive single keys. |
| Density: tiny unlabeled icons | The Dominions 6 icons complaint [D1]. | Icon + label + value in panels; icons alone only on the map, with tooltips. |
| Late-game micromanagement | No grouping or reordering, "dozens of icons in every province" [D1]. Players say "UI improvements are sparse" against heavier micro [D14]. Reviews name micromanagement as a fault [R5]. | Named collapsible groups, the Ledger, script presets, and paste-to-all. |
| Menus of menus, no search or filters | "Most menus would benefit from a search bar and more advanced filters" [R2]. | Ledger filters; type-to-search for provinces and spells. |
| Opaque outcomes | Logs omit fatigue penalties and crits [D7]. Scripted spells silently fall back to AI choice [M3]. | Logs that include every modifier event (FM's replay already logs `fatigue`, `buff`, and `field`), plus inline script warnings. |
| Defenders' view | "The UI is unusual and very different from… other modern games, but… very much usable"; hotkeys make it "very responsive" [D2]. | Keep the speed: keys for everything, no animations on panels. |

## 3. What Dominions 6 improved

- **The Army Setup screen** got click-and-drag selection, labels on squads and units, and
  easier battle-order changes from the position screen [D4]. It has more room and box
  selection [D4], and players can "deploy + script… without having to go back and forth
  between screens" [D13]. A new player called the army formation screen the one clear
  upgrade [R7].
- **Breakdowns and searches:** a veteran's review lists drag-select commanders in tactical
  setup, an upkeep breakdown, item searching, automatic site searching, a population
  growth breakdown, blood income graphs, fly attack for commanders, diplomatic messages to
  the AI, more hotkeys, and fast or slow battlefield panning [D6].
- **Research:** a research queue [R7], and in patch 6.37 up and down keys to swap targets
  and `?` help on the research screen [D10].
- **Recruitment:** repeat recruitment each turn and several weaker commanders per turn
  [G6][D17].
- **Overviews:** filters on the F1 screen, and score graphs that include all gem income
  sources [D4].
- **Scale:** the manual's list of major Dominions 6 changes says populations and armies are
  "about 50% larger" [M7], which raises the micromanagement load the UI has to carry.
- **Reception:** Wargamer reports "major UI and quality of life updates that provide more
  detailed information to players, or streamline existing features" [R1]. PC Gamer notes the
  promise of "a somewhat-deeper user interface" [R6]. Reviews summarized on Steam still
  list a clunky interface among the common complaints [R7].

The pattern: Illwinter improved **access to information** (breakdowns, search, filters) and
**fewer screen switches** (scripting from the setup screen). Players rewarded both. They
did not fix discoverability or grouping.

---

## 4. Games with pre-battle orders, auto-resolve, and replays

### 4.1 Total War: Warhammer III

- **Forecast before commitment:** before launch, Creative Assembly said players would see
  "the predicted result before committing to autoresolve, as well as which units will die
  in battle and the general number of casualties", backed by more test data [T1].
- **Outcome labels:** the pre-battle screen names the autoresolve outcome, for example
  "Pyrrhic victory" or "Close defeat" [T2].
- **Trust problems:** players report the prediction changing when they press the button
  [T2], and a predicted Pyrrhic victory with about four or five losses ending in a wiped
  army [T3]. They blame randomness, morale cascades, or bugs [T3].
- **Replays are a separate feature from the campaign flow.** In Rome: Total War, replays
  were saved only for some battle types (custom, quick, multiplayer, and unscripted
  historical), and loaded from the main menu under "Load Battle Replay". A free movie camera
  needed a launch option [T4].

### 4.2 Age of Wonders 4

- **Auto-combat is simulated, not calculated.** The AI plays your army with the same logic
  it uses for its own, so a superior army usually wins, "though often taking losses that a
  human player would avoid" [A5]. Players contrast this with Total War's calculated outcome
  [A1].
- **The forecast** tells you whether you would lose a unit and roughly how much damage you
  would take. It is usually accurate, but some battles show no estimate [A1].
- **Watch and retry:** after auto-resolving you can still watch the battle play out, at full
  speed without pauses [A2]. You can also retry it as a manual fight if you dislike the
  result [A3][A4]. Retry options are set at game setup and are on by default [A4].

### 4.3 Songs of Conquest

- **Quick battle:** the simulated result can be accepted, which grants experience and loot,
  or the player can fight manually to lose fewer units [S1].
- **Predictions disappoint players:** they report quick battle losing fights that the AI
  wins when the same battle is played in manual mode on auto-play [S2], and suspect the
  prediction uses simple unit values [S3]. An early-access preview called quick battle "a
  bit too harsh", which pushes players into repetitive manual fights [S4].
- **A workaround is to watch the AI play:** start a manual battle and use the auto-battle
  control at the top left [S2].

### 4.4 What carries over to Fluid Magic

FM has **no manual battles**. Battles resolve instantly in the tick (docs/01 section 10),
so "retry manually" does not apply. The player's levers all come before the fight:
composition, formation, scripts, carried mana, and timing. The comparison games suggest
three patterns:

1. **A forecast at the moment of commitment,** with honest uncertainty.
   - When the player has a commander selected and hovers a hostile province (the
     right-click target), the tooltip adds a Forecast line, for example "Likely victory (17
     of 20) · your losses 3 to 7 · their losses 12 to 18".
   - Implementation that keeps the sim pure: the UI builds the `BattleSetup` from **what the
     player can see** and runs `resolveBattle(setup, rng)` about 20 times in a Web Worker, each
     with an `RngState` the UI seeds itself. It never touches `state.rng`, so the determinism test is
     unaffected.
   - **Fog must win over the forecast.** docs/01 section 14 shows unscouted independents
     only as a word (weak, moderate, strong, fortress). In that case the forecast runs over
     the strength band and says so ("Against 'strong' defenders, unscouted: 40% to 80%").
     Otherwise the forecast would leak hidden information.
   - Show a **range, never a single number.** The evidence above shows that point
     predictions which miss destroy trust.
   - Link the forecast to the fix: "Edit battle plan" opens the commander's Battle Plan
     tab. In FM this replaces Age of Wonders 4's manual retry.
2. **Summary first, replay optional,** as Dominions does [M5] and as Total War and Age of
   Wonders 4 do with their results screens. Most battles should be readable in five seconds
   without watching anything.
3. **Watching is a reward, not a chore.** Age of Wonders 4 lets you watch auto-resolved
   fights [A2]. FM's replay, which a separate battle presentation design will make
   visceral, should open instantly from the feed and allow skipping and scrubbing at any
   time.

---

## 5. The battle replay frame for Fluid Magic

The battle presentation (per-blow detail, sound effects) is being designed separately.
This section gives the **frame** around it, so the replay reads as part of the same game.
The principle: **the replay reuses the game screen's skeleton.**

```
+----------------------------------------------------------------------------------+
| Header (TopBar slot): ⚔ Battle of Ashford · Forest · Day 214 · [chips: Fort walls up,|
|   Thornwood forest +1 def, Fury +2 (Cinder dominion), Dread −1]        [?] [✕ Esc] |
+-------------------+---------------------------------------------+----------------+
| YOUR SIDE         |                                             | LOG (right     |
| (left dock slot)  |   BATTLEFIELD (Pixi)                        | dock slot)     |
| banner + symbol   |   your rows on the left, enemy on the right |  detail: 1 2 3 4|
| commanders: HP,   |   rear | middle | front || front | middle | rear| R7 Fireball  |
| fatigue, script   |                                             |   → Warriors   |
| squads: live count|                                             |   −6 (12 fire) |
|  ▸ click = focus  |                                             | ▸ filter: this |
|    + unit log     |                                             |   squad only   |
| ENEMY SIDE        |                                             |                |
+-------------------+---------------------------------------------+----------------+
| Transport (bottom strip slot): ⏸ ▶  0.5× 1× 2× 4×   ⏮ ◀R ▶R ⏭   Round 7 / 23      |
| [====|=====●====x=====✦=====|] markers: ✦ spell  x commander death  ⚑ rout  ⚐ end |
+----------------------------------------------------------------------------------+
```

- **Placement.** The player's side goes on the **left**, matching the left dock where the
  player's selection lives. Dominions fixes attacker-left [M5]; in a single-player game,
  "you are left" is the more useful constant. Label each side with its banner and mana
  symbol, and add "Attacker" or "Defender" as text.
- **Header chips list every condition** that changed the numbers: terrain, fort state,
  province scales by name and step, Dread, starvation or unpaid morale, and Rootwall. This
  is Dominions' F2 "weather and dominion scales" panel [M5], always visible.
- **Rosters.** Live counts, commander HP and fatigue bars, and each commander's script with
  the current slot highlighted. Clicking a squad focuses it on the field and filters the log
  to it (Dominions' `v` [M5]). `Tab` highlights all commanders (Dominions 6 [D12]).
- **Log with four detail levels**, toggled with `D` or the 1 to 4 chips in the log header:
  1. kills and routs only;
  2. adds spells and buffs;
  3. adds volleys and melee summaries;
  4. adds every roll and modifier, including fatigue and expiry.

  FM's replay events (`cast`, `volley`, `melee`, `damage`, `buff`, `fatigue`, `field`,
  `rout`, `death`, `advance`, `leave`) already support this. Level 4 answers the Dominions
  complaint that logs hide modifiers [D7].
- **Transport.** Pause (Space), speeds 0.5× to 4×, step one round back or forward (`,` and
  `.`), skip to end, and a scrubber with event markers: spells, commander deaths, routs, the
  round-50 retreat. Because `foldReplay` rebuilds state from the event log, seeking to any
  round is cheap and exact.
- **Keys match the game screen.** In the replay, `1` to `4` set **replay speed**, as they
  set game speed outside it. Dominions uses them for log detail [M5]; consistency inside
  FM matters more. Esc closes. `?` shows the replay keys.
- **The end card is the same component as the summary.** When the replay finishes, or on
  "skip to end", it shows the battle summary card: result, rounds, how it ended (rout, wipe,
  round-50 retreat), per-squad start → end counts, commanders' fates, and "Why" bullets
  ("Their front routed in round 9 after losing 40% to Fireball"). That card opens from the
  feed's Watch row without playing anything (Dominions' summary before "View battle" [M5]).
- **Panning stays responsive at every speed** (the Dominions 5 bug [D11]), and the replay
  never blocks the sim: the game stays paused underneath, as docs/07 says ("modal over the
  game, pausable").

---

## 6. Keep from Dominions, and do the modern way

### Keep (Dominions got these right)

1. **Five scripted actions, then a default.** The limit is part of the strategy [D16] and
   matches FM's docs/04. Make the "then repeat slot 5" rule visible.
2. **A deployment preview where shape means commander or squad and color means order**
   [M3], adapted to FM's three rows and given symbols for accessibility.
3. **Summary before replay** [M5], with casualty lists.
4. **Replay instrumentation:** log detail levels, per-unit log, unit list, a conditions
   panel, and a commander highlight [M5][D12].
5. **Scope-grouped commands** (province, nation, magic, game) with a key for each, and a
   `?` overlay per screen [M1][M5].
6. **Map filters plus an income or production overlay** [M1]. FM already has F1 to F6;
   add the capsule chip overlay.
7. **Clickable numbers that open their own breakdowns** [M1], and Dominions 6's extra
   breakdowns [D6].
8. **An overview that is also a control surface,** like buying PD from F1 [M1].
9. **The pretender economy:** one budget, awakening refunds, base pips as a discount, and
   scales as both cost and consequence [M2].
10. **Script copying** [M3][G1], **Shift for ×10 recruiting** [M3], **dimmed queue entries
    that cannot start yet** [M3], and **a per-province chronicle** [M1].
11. **A list of everything active in the world**, the F6 globals list [M1][M6], becomes
    FM's Active Effects.
12. **Speed for experts:** no panel animations, and every action reachable from the keyboard
    [D2].

### Do the modern way

1. **Standard mouse conventions** (left select, right move) and **no right-click-only
   functions** [R3][M2][W5].
2. **Visible buttons first, keys second.** Save and load, the turn number, and order
   variants must never be hotkey-only or hover-only [D9][M1][M4].
3. **Readable density:** icon + label + value in panels, icons alone only on the map, with
   tooltips [D1].
4. **Inline validation and live consequences:** invalid designs and scripts are flagged
   where they are made, not at game start or in a battle log [D8][M3][D7].
5. **Grouping, sorting, filtering, and search:** named collapsible commander groups, the
   Ledger, and type-to-search [D1][R2][D4].
6. **Forecasts with ranges at the moment of commitment,** with fog respected [T1][A1][S2].
7. **An event feed with filters, severity, jump buttons, and auto-pause per category,**
   instead of a turn-start dump [M1].
8. **A replay scrubber with markers, round stepping, and an end card,** on top of
   Dominions' instrumentation.
9. **Confirmation for irreversible actions only** [D3][S5].
10. **Fewer screen switches:** scripts, formation, and squads in one Battle Plan tab, the
    Dominions 6 lesson [D13][D4].

### The layering model this research supports

The owner's direction, "complexity tastefully layered under smart menu design", maps onto
five layers. The Dominions evidence says which layer each thing belongs in.

| Layer | How it is reached | FM content |
|-------|-------------------|------------|
| 0 Glance | always on screen | TopBar numbers with rates, the date, map overlays, army badges, the event feed, the commander strip with its five-glyph script summary |
| 1 Hover | tooltip, about 300 ms | one-line explanation plus breakdown from the selectors, unit and spell cards, the forecast line on move targets |
| 2 Click | dock panel or tab | province tabs (Overview, Recruit, History); commander tabs (Overview, Battle Plan) |
| 3 Screen | modal, by key | Ledger (L), Research (R), Rituals (C), Active Effects (E), Pretender card, battle summary and replay |
| 4 Expert | keys and options | `?` overlay, script copy and paste, log detail 4, filter rules in the Ledger, auto-pause categories |

Dominions puts too much in layers 3 and 4: the F-key screens and hotkey-only functions.
Its layer 0 is too thin: the hidden turn number and the tiny icons. FM should push answers
**up**, toward layers 0 and 1, and keep power **down**, in layers 3 and 4, without hiding
anything that is needed every minute.

---

## 7. Proposed deltas to `docs/07-ui.md` (for the spec owner)

1. **Province panel:**
   - Rows are icon + label + value + delta, with hover breakdowns from `provinceEconomy`.
   - The PD `+` button shows its cost.
   - Add a History tab that filters messages by province.
   - The Recruit grid has two bands (commanders above, troops below) with Shift ×10.
   - Queue rows are dimmed with a reason.
2. **Commander panel:**
   - Replace the separate "Squads" and "Script" sections with a **Battle Plan** tab:
     the three-row mini-field (circles for commanders, boxes for squads, drag to set the
     row), the script timeline with "Round 6+: repeats slot 5", inline cast warnings, a
     projected fatigue bar, presets, and copy and paste.
   - Show a leadership meter.
   - Add a "Plan at destination" toggle for moving commanders.
3. **Right dock:**
   - The army list supports named collapsible groups.
   - Messages get category chips, severity icons, Watch and Jump buttons, and an unread
     count.
   - Auto-pause categories move to Settings and match the chips.
4. **New screens:** Ledger (`L`; Provinces, Commanders, and Queues tabs with filters) and
   Active Effects (`E`).
5. **Map:**
   - Add the capsule overlay (net gold and supply margin chip).
   - `H` hides the UI, `Home` goes to the capital, `Ctrl+Home` to the pretender, `G`
     searches provinces, `.` jumps to the next idle commander.
   - Box-select army badges.
   - Add the forecast line to the hover tooltip of a hostile target while commanders are
     selected.
6. **Battle replay:** the frame in section 5 (skeleton reuse, player on the left, condition
   chips, rosters with focus, four-level log, scrubber with markers, end card shared with
   the summary).
7. **Pretender design:**
   - Steppers that print prices, sliders with step prices, no right-click controls.
   - Inline validation that matches `validatePretender`.
   - Visible Save, Load, and Presets buttons.
   - Hover chassis cards.
8. **Keyboard:** add `?` (per-screen overlay), `L`, `E`, `H`, `G`, `.`, `Home`, `Ctrl+Home`,
   `I` (info card for the hovered item), and in the replay `,` `.` `D`. Bind no
   irreversible command to a bare key.

### Open items that need sim support (not UI-only)

- A research **queue** of colors. FM has a single active color today.
- **Repeat recruitment** per fort.
- **Recast a ritual monthly.**
- **Commander groups** if they ever need to exist in `GameState`. The proposal keeps them
  in UI save data.
- The **forecast** is UI-only, but it needs a helper that builds a `BattleSetup` from the
  player's **visible** knowledge, and that helper must live where the sim can't depend on
  it (for example `src/ui/forecast/`, importing sim types and the pure resolver).

---

## References

The Dominions 6 manual: unofficial web edition of the official manual (original PDF:
https://www.illwinter.com/dom6/dom6manual.pdf). Read from source,
https://github.com/dmacguigan/dom6-manual.
- [M1] The Basics: interface, map, province attributes, national summary.
  https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html
- [M2] The Pretender. https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html
- [M3] Units: recruiting, Army Setup, battle orders.
  https://dmacguigan.github.io/dom6-manual/chapters/04-units.html
- [M4] Movement: orders. https://dmacguigan.github.io/dom6-manual/chapters/05-movement.html
- [M5] Combat: Battles View, Army Setup, formations.
  https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html
- [M6] Magic: rituals, global enchantments, research.
  https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html
- [M7] Introduction: major changes in Dominions 6.
  https://dmacguigan.github.io/dom6-manual/chapters/01-introduction.html
- [M8] Dominions 5 manual (via search excerpt: 425 points, Army Setup).
  https://www.illwinter.com/dom5/dom5manual.pdf

Wikis and guides:
- [W1] illwiki, Hotkeys (Dominions 5). https://illwiki.com/dom5/hotkeys
- [W2] illwiki, Pretenders and Pretender Design (Dominions 6). https://illwiki.com/dom5/dom6/pretenders
- [W3] illwiki, Research. https://illwiki.com/dom5/research
- [W4] illwiki, Global Enchantments. https://illwiki.com/dom5/globals
- [W5] illwiki, bcnoexceptions' New Player Guide. https://illwiki.com/dom5/bcnoexceptions-new-player-guide
- [W6] illwiki, Dominions 5 patch notes (replay N and X keys). https://illwiki.com/dom5/patchnotes
- [W7] illwiki, Random Events (event message wording). https://illwiki.com/dom5/random-events
- [G1] Steam guide, "Basic guide for the uninitiated" (copy orders with Ctrl-1, recruit
  left and right click, repeat and reset recruitment). https://steamcommunity.com/sharedfiles/filedetails/?id=1428778518
- [G2] gameplay.tips, Dominions 5 terminology ("5 turns of commands"). https://gameplay.tips/guides/7085-dominions-5.html
- [G3] Magic Game World, Dominions 5 Battles View. https://www.magicgameworld.com/dominions-5-battles-view/
- [G4] Magic Game World, Controls for Dominions 6. https://www.magicgameworld.com/controls-for-dominions-6-rise-of-the-pantokrator/
- [G5] Wargamer, Dominions 5 guide. https://www.wargamer.com/dominions-5/guide
- [G6] GameFAQs, Dominions 6 guide, "The First Turn" (Repeat Recruitment). https://gamefaqs.gamespot.com/pc/416672-dominions-6-rise-of-the-pantokrator/faqs/81851/the-first-turn

Reviews:
- [R1] Wargamer, Dominions 6 review. https://www.wargamer.com/dominions-6/review
- [R2] Explorminate, Dominions 6 review. https://explorminate.org/dominions-6-masterfully-crafted-magic-and-combat-systems/
- [R3] Explorminate, Dominions 5 review. https://explorminate.org/dominions-5-review/
- [R4] The Archon's Review of Dominions 5. https://thearchonreviews.wordpress.com/2018/01/08/the-archons-review-of-dominions-5-warriors-of-the-faith/
- [R5] Wikipedia, Dominions 5 (reception). https://en.wikipedia.org/wiki/Dominions_5:_Warriors_of_the_Faith
- [R6] PC Gamer, Dominions 6. https://www.pcgamer.com/dominions-6-is-the-only-strategy-game-where-i-can-send-an-army-of-dog-men-to-victory-led-by-a-squeaky-toy-god/
- [R7] Vaporlens, Dominions 6 Steam review summary (and the Steam threads it surfaced:
  research queue, save and load moved to hotkeys, formation screen the clear upgrade,
  clunky UI). https://vaporlens.app/app/2511500/dominions_6_rise_of_the_pantokrator
- [R8] Steam, Dominions 5 top-rated user reviews ("no tutorials"). https://steamcommunity.com/app/722060/reviews/?p=1&browsefilter=toprated
- [R9] Medium, "Review: Dominions 5. Not your average god game". https://medium.com/@bassilmatt/reviewing-obscure-games-dominions-5-623fac7fef76

Dominions community threads (Steam unless noted):
- [D1] "UI/UX" (Dominions 6). https://steamcommunity.com/app/2511500/discussions/0/3807281445009631725/
- [D2] "Why is the UI so awful?" (Dominions 6). https://steamcommunity.com/app/2511500/discussions/0/4290313152636822313/
- [D3] "The hotkey system is a dark pattern and I hate it" (Dominions 6). https://steamcommunity.com/app/2511500/discussions/0/7204143093501059856/
- [D4] "Dominions 6 new Features and Changes". https://steamcommunity.com/app/2511500/discussions/0/3807281445020039925/
- [D5] "Organising Forces, How do you do it?" (Dominions 6; box-select and renaming
  workarounds, surfaced by search). https://steamcommunity.com/app/2511500/discussions/0/4139438760454739612/
- [D6] LucidTactics, Steam review of Dominions 6 (list of QoL additions). https://steamcommunity.com/id/LucidTactics/recommended
- [D7] "Distinguishing and interpreting combat logs" (Dominions 6). https://steamcommunity.com/app/2511500/discussions/0/4849904427680840957/
- [D8] "Pretender Creation Cheat?" (Dominions 6; the bless requirement error at start).
  https://steamcommunity.com/app/2511500/discussions/0/4522261062769808325/
- [D9] "How to use created pretender?" (Dominions 6; on-screen button removed, Ctrl+L).
  https://steamcommunity.com/app/2511500/discussions/0/4132682727132483639/
- [D10] Dominions 6 Steam announcements (patch 6.37: research up and down keys, `?` help).
  https://steamcommunity.com/games/2511500/announcements
- [D11] "Battle replay speed" (Dominions 5). https://steamcommunity.com/app/722060/discussions/0/1621726179578427886/
- [D12] Quarter To Three, Dominions 6 thread (Tab highlights commanders; formation control
  needs leadership 80). https://forum.quartertothree.com/t/dominions-6-the-history-mythology-pulp-fiction-dark-fantasy-turn-based-strategy-game/159424
- [D13] RPGHQ, Dominions 6 thread (drag-select, deploy and script without switching
  screens). https://rpghq.org/forums/viewtopic.php?t=776
- [D14] "Dominions 5 vs 6 - question" (UI improvements sparse against micromanagement;
  surfaced by search, thread not pinned exactly). https://steamcommunity.com/app/2511500/discussions/0/4132682727125876224/
- [D15] Quarter To Three, Dominions 5 thread (recruit window order). https://forum.quartertothree.com/t/dominions-5-warriors-of-the-faith/131532
- [D16] Steam, Dominions 4 discussion (limited scripting as balance). https://steamcommunity.com/app/259060/discussions/0/490123938437588666
- [D17] "Army recruitment/preparation/movement in DOM 6, has it improved?". https://steamcommunity.com/app/2511500/discussions/0/4132682727125642903/

Total War:
- [T1] GameWatcher, "Total War: Warhammer 3 Aims for Clearer Autoresolve". https://www.gamewatcher.com/news/total-war-warhammer-3-autoresolve-ambush-battles-withdraw
- [T2] Total War: Warhammer Wiki (Fandom), Autoresolve. https://totalwarwarhammer.fandom.com/wiki/Autoresolve
- [T3] Steam, Total War: Warhammer III discussions on prediction mismatches (surfaced by
  search; example thread). https://steamcommunity.com/app/1142710/discussions/0/3934517363281030364
- [T4] PCGamingWiki, Rome: Total War, and HeavenGames Movie Editor tutorial (replay types,
  Load Battle Replay, movie camera). https://www.pcgamingwiki.com/wiki/Rome:_Total_War
  and https://rtw.heavengames.com/cgi-bin/forums/display.cgi?action=ct&f=9,3274,,all

Age of Wonders 4:
- [A1] Steam, "Nice autoresolve..." (forecast of unit loss and damage). https://steamcommunity.com/app/1669000/discussions/0/3828666283436674994/
- [A2] TapTap, full review of Age of Wonders 4 (watch auto-resolved battles at full
  speed). https://www.taptap.io/vn/post/5335749
- [A3] GOG, Age of Wonders 4 user reviews (manual replay if unhappy). https://www.gog.com/en/game/age_of_wonders_4?page=6
- [A4] Steam, Age of Wonders 4 discussion (retry after auto-resolve; retry options set at
  setup and on by default). https://steamcommunity.com/app/1669000/discussions/0/3826415752027417942/?ctp=6
- [A5] Steam, "Autocombat TOO good?" (the AI plays your army with its own logic). https://steamcommunity.com/app/1669000/discussions/0/3826415752024876605/

Songs of Conquest:
- [S1] Gamepressure, "Is it worth using Quick Battle?". https://www.gamepressure.com/songs-of-conquest/it-is-worth-using-quick-battle/zf1143f
- [S2] Steam, "Quick Battle OP?". https://steamcommunity.com/app/867210/discussions/0/4411920838131986595/
- [S3] Steam, "Combat Mechanics". https://steamcommunity.com/app/867210/discussions/0/4338733821682806168/
- [S4] GameBanshee, Songs of Conquest early access previews. https://www.gamebanshee.com/xr6r8
- [S5] Songs of Conquest feature request, end turn confirmation. https://songsofconquest.featureupvote.com/suggestions/300246/end-turn-confirmation-if-movement-still-available
