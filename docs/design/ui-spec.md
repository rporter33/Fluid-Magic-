# Fluid Magic UI Specification (final, for docs/07-ui.md)

Status: final, written 2026-10-21; amended 2026-10-23 with the Court modal, the officer alerts
and their sim support (sections 2.5, 3.6b, 6.6, 7.2, 9.2, 9.3), all tagged **[Phase 9b]**, which
means proposed, built only after Phase 9 and gated on the playtest of `three-kingdoms.md`. It
revises `spec-draft.md` by applying the two judges' mustFix and shouldDrop lists. Where the judges disagreed, or where a fix needed a choice, the
decision and its reason are in **Rulings** below. It is the build spec for Phase 8 (map and core
UI) and Phase 9 (remaining UI). Section 4 also gives Phase 10 (replay viewer) its frame. The
exact replacement text for `docs/07-ui.md`, plus the lines needed in `docs/09-art-direction.md`,
`docs/10-milestone-1.md` and short additions to four other docs, is at the end under **Docs
text**.

Direction it serves (binding, from the project owner): "Make sure the UI matches those of
similar games; where complexity is tastefully layered under smart menu design." Earlier
direction, also binding: battles must be visceral, with detail and sound effects. The battle
presentation is designed separately. This spec gives the replay a frame that matches the rest of
the game (section 4).

How to read it:
- **Rulings** records the decisions taken in this revision.
- Section 1 holds the rules, including the depth audit. Every later section applies them.
- Section 2 is the main game screen. Section 3 covers the other screens. Each has a "where each
  detail lives" table.
- Section 4 covers battle reports and the replay frame. Section 5 covers tooltips, the Codex,
  notifications, keys and mouse, onboarding, accessibility, and confirmations.
- Sections 6 and 7 are the build contract: the React components, and what the sim must expose.
- Section 8 maps each pattern to the game it comes from, with its URL and how far it was checked.
- Section 9 lists deviations from the current `docs/07-ui.md`, open items, tests, and the phase
  plan.

Priority tags: **[M1]** is required for Milestone 1. **[M1-should]** is built in M1 if time
allows, and the layout leaves room for it. **[Later]** is designed now but not built in M1.

Evidence: every claim about another game's UI comes from `research-paradox.md` (P),
`research-dominions.md` (D), `research-fourx.md` (X) or `research-ux.md` (U) in this folder, which
cite their URLs. Section 8 repeats the URL for each pattern and marks what was checked:
- **[V]**: confirmed against the primary source. Judge 1 and Judge 2 checked the Dominions 6
  manual claims against the official manual's source (github.com/dmacguigan/dom6-manual,
  chapters 02, 03, 04, 06, 07). This session confirmed one claim against a primary source, the
  Civ VI More Lenses README, and that claim is no longer relied on.
- **[X]**: taken from search extracts by the research notes and not re-opened.
- **[U]**: unverified or contested. The judges could not re-check these Paradox claims because
  paradoxwikis.com was blocked and their search budget was spent. This session tried again:
  ck3.paradoxwikis.com, forum.paradoxplaza.com and stellaris.fandom.com failed DNS lookup, and
  the web-search budget was already used up. Fluid Magic adopts a [U] pattern only where it
  stands on its own merits, and the text says so.

---

## Rulings

Each ruling names the judges' positions and the decision. "J1" is Judge 1 and "J2" is Judge 2.
Every other mustFix and shouldDrop item was applied as written. The table after the rulings
shows where each item landed.

1. **Opening the Commander panel.** J1 proposed `C`, and J2 proposed `Enter`. `C` keeps its
   docs/07 meaning (Cast, the selected mage's Rituals tab). The panel opens with `Enter`, a
   click on the strip's portrait or script summary, or a double-click on the army badge.
2. **Tooltip settings.** J1 kept the delay, Nested On/Off and `Shift+T`. J2 kept the delay, the
   lock timer and Hold/Toggle detail. Decision: two settings.
   - **Delay**, 0 to 1500 ms, with an **Off** position. Off replaces `Shift+T` as the way to
     silence tooltips, so Shift loses one more chord.
   - **Detail key: Hold / Toggle**. Toggle is a motor-accessibility option for players who
     cannot hold a key.
   The lock timer is fixed at 0.8 s (in `src/content/ui.ts`). Nesting is always on, because it
   only happens when the player points at a dotted term.
3. **Battle records after the cap.** J1 wanted "Report no longer kept". J2 wanted a kept summary
   or a higher cap. Decision: when each `BattleRecord` first appears, the UI stores a small
   `BattleSummary` (from the sim's `summarizeBattle`) in the save file's UI block. Once the
   record is evicted (`BATTLE.keep` = 20), the report card still renders from the summary and
   Watch is disabled with "Replay not kept (only the last 20 battles are)". "Report no longer
   kept" appears only when there is no summary either, which means a save from before this
   change. `GameState` and `BATTLE.keep` stay as they are (`summarizeBattle` is a pure function),
   and the fallback text is the one docs/06 already specifies.
4. **Battle Plan width.** J1 proposed 600 to 640 px and J2 about 720. Decision: 640 px in the
   narrow layout and 720 px in the wide one, drawn over the map (section 2.8.3).
5. **Replay clock.** Both judges make the stage the clock, and the contract merges their
   proposals. From J1: the frame sends `playing`, `speed` and seek requests, the stage reports
   `onProgress`, and scrubber ticks are indexed by event. From J2: seek requests carry an id that
   the stage acknowledges, plus `leftSide` and a master volume (section 4.4). docs/04's "1 round
   per 1.5 seconds" becomes a default pace the presentation owns.
6. **Highlighting commanders in the replay.** J1 proposed a held key, and J2 proposed Tab while
   the stage has focus. Decision: hold `C`, or use a header toggle. Tab stays focus traversal in
   the replay modal, which removes any risk of a focus trap. Dominions' Tab becomes this.
7. **"Hostile army approaching."** J1's rule is adopted: once per enemy incursion, with a pause
   only when the target holds own troops, a fort or the capital, coalesced by group. It is built
   as two sim message kinds, `approaching` (toast) and `threatened` (toast and pause), so the
   message matrix controls each one separately. The ribbon alert reads the same sim selector
   (`incomingThreats`), so one rule feeds the alert, the feed, the pause and History.
8. **Battle interrupts.** J2's split is adopted. Major battles get a popup and a pause: lost
   battles, battles against another nation, and battles involving the pretender, the prophet,
   the capital or a Wellspring. Battles won against independents get a toast with Watch. J1's
   queue is adopted for several popups on one day. The split is flagged for playtest.
9. **Shift.** Combines J1's "Shift alone" definition, J2's suppression of the numbers layer while
   a selection exists, and J2's "own toggle key" (Backquote) for the numbers layer. These Shift
   chords are removed: `Shift+T`, `Shift+Home`, `Shift+←/→` in the replay, and Shift-drag for
   half a squad. Four Shift families remain (section 5.4).
10. **Key codes.** J1 asked for `KeyboardEvent.code`. Decision: the digit row, the numpad, WASD,
    `+` and `−`, the brackets and Backquote bind by `code` (physical key), so AZERTY speeds and
    map modes do not collide. Z/X speed stepping is not bound: it duplicates `+`/`−`, and its CK3
    precedent is unverified. Letter mnemonics (R, L, F, C, N, J, ...) bind by `key`, so `M`
    is the M on the player's keyboard. `?` matches `key === '?'` on any layout.
11. **Alert tiers.** J1 asked for EU4's three tiers plus the blue Hint, and J2 did not object. The
    Wellspring race lives on the top-bar track and needs no tier of its own.
12. **Condition blocks.** J2 dropped `checkCommand`, and J1 did not object. A blocked action
    shows the reason `validateCommand` returns, so the sim stays unchanged and there is one
    source. For consistency the Pretender Design screen drops `checkPretender`: each stepper
    runs `validatePretender` on the design its click would produce.
13. **One formula, one copy.** J2's trace sink is adopted, and J1's what-if override is added to
    the same optional options argument of `provinceEconomy`. The `explain*` functions become thin
    wrappers that run the real selector with a trace. A preview reads the real selector with an
    override and never clones the state (section 7.2).
14. **Right-click.** J2's rule is adopted. On notifications (alerts, feed rows, toasts) it
    dismisses. On entities (cards, rows, links) it opens one context menu. On the map it means
    move. Ctrl+click opens the Codex everywhere.
15. **Build has one home**, the building row in the province Overview, and the row names its
    builder. Both judges agreed.
16. **Ritual commit.** J1: a click on a valid target commits with the default payment, and
    targeting pauses the game. J2 proposed Shift+click to edit the payment, which is rejected to
    keep Shift's meanings few. The payment is edited in the dock before targeting, as J1
    proposed. J2's cursor-label content is adopted: cost, days, pool after payment and the commit
    text.
17. **Depth rule.** J2's wording ("a decision surface is at most 2 clicks from the map;
    committing takes one more") is combined with J1's audited list of the deepest paths
    (section 1.5). No path exceeds 4 clicks.
18. **Pretender key.** `Ctrl+Home`, Dominions' own key. J2 noted that `Shift+Home` is not
    Dominions'. `Ctrl+Home` is a page-scroll key, so the page can claim it with
    `preventDefault`.
19. **Audio.** There is no music in M1, so the Audio tab holds Master volume and Battle SFX only.
    There are no UI cues and no alert cues (J1 and J2).
20. **Codex.** It keeps generated entity pages, concept pages, How to play, Keys, name search over
    entries, provinces and own commanders, and back and forward. It drops `seeIn` highlighting,
    rule pages with worked examples, and recent searches (J1 and J2).
21. **W, U and B research in M1.** The "Research this" button is disabled with the reason "No
    Radiance spells exist in M1. Points would buy nothing (spells arrive in M2)" (J1's first
    option).
22. **Learn objective.** It keeps the steps and their Why links and drops the "How"
    UI-highlighting (J1). The hints' **Show me** stays, because it only selects the entity and
    centers the camera, which is the same action as an alert click.

**Where each judge item landed**

| Item | Judge | Section |
|---|---|---|
| Docks and strip drawn over a fixed full-window canvas; unobscured-area budget; camera fixed; ribbon at a fixed x | J1 | 2.1 |
| One selection, one surface; Commander panel on demand; squads only in the strip | J1, J2 | 2.8, 2.9 |
| Principle 4 restated: strip = standing orders; dock = editors and province actions; one home per command | J1, J2 | 1.1, 1.5 |
| Battle Plan as a wide sheet; no ghosted enemy columns; layout test | J1, J2 | 2.8.3, 9.4 |
| Replay: stage is the clock; seek ids; `leftSide`; master volume | J1, J2 | 4.4 |
| Clock tooltip and hairline announce the dominion spread, not a monthly payout | J1, J2 | 2.3, 2.4 |
| Incursion messages: once per incursion; pause only for troops, a fort or the capital; sim kinds | J1 | 2.5, 5.3, 7.2 |
| No state clone for previews; what-if overrides; 2 ms perf test | J1 | 7.2, 7.3, 9.4 |
| Shift alone; key codes; no Tab in the replay; first hint for Old World players | J1, J2 | 5.4, 4.3, 5.5 |
| Ritual casting in 4 clicks; targeting pauses; deepest paths listed | J1, J2 | 1.5, 3.5 |
| Label density budget at the default zoom; overlap test | J1 | 2.10.3, 9.4 |
| Popup queue; record retention | J1, J2 | 2.4, 4.1 |
| W, U and B research disabled | J1 | 3.4 |
| Preset costs removed; thresholds in `src/content/ui.ts`; Dominions' log placement corrected | J1 | 3.3, 7.2, 4.3 |
| Citations: More Lenses dropped; [U] marks | J1, J2 | 8 |
| Right-click means one thing per element kind | J2 | 5.4 |
| Ritual reach drawn as a hop outline, not a ring | J2 | 2.10.2, 3.5 |
| Idle alert: Guard order; only recent arrivals and idle mages or priests | J2 | 2.5, 2.9 |
| Effective scales in the province panel | J2 | 2.8.1 |
| Wheat glyphs only when tight or starving | J2 | 1.2, 2.10.4 |
| Battle interrupts split | J2 | 5.3 |
| Trace sink instead of parallel `explain*` code | J2 | 7.2 |
| Icon inventory for docs/09 | J2 | Docs text |
| Ctrl+Home; `check.ts` name clash avoided; [U] marks | J2 | 5.4, 7.2, 8 |
| Dropped: floating cards, undo/redo, named groups, six tiers, UI sounds, Ledger Forts tab, rebinding UI, banner picker, most tooltip settings, At destination, `seeIn`, How highlighting, greyscale test, cosmetic extras, Ctrl+C/V on hover, Shift+←/→, `checkCommand`, music slider, Codex rule pages and recent searches | J1, J2 | 9.1 |

---

## 1. Principles

### 1.1 The eight rules

1. **Five layers, one gesture apart.** Every piece of information lives at one layer, and each
   layer answers one kind of question.

   | Layer | Gesture | Question it answers | Fluid Magic surface |
   |---|---|---|---|
   | **L0 Glance** | none | How much? Where? Is anything wrong? | Top-bar readouts with their rate, the clock, the alerts ribbon, outliner rows, map labels, army badges, the bottom strip |
   | **L1 Hover** | point (400 ms on panels, 500 ms on the map) | Why is it this number? What does this icon mean? | Tooltip: value, a one-line meaning, a breakdown table from a sim selector, a projection line. Holding **Shift** alone expands it to every row and the per-day figures (L1+) |
   | **L2 Concept** | point at a dotted-underlined term inside a tooltip | What does this word mean? | Nested concept tooltip, at most 3 deep, with an "Open in Codex" footer |
   | **L3 Panel** | click a value, glyph, alert, badge or province | What can I do about it? | Bottom strip (a commander's orders) or left dock (province actions, commander editors) |
   | **L4 Screen** | hotkey or top-bar button | Show me everything; compare; look it up | Research (R), Ledger (L), Codex (F), Settings, battle replay, Pretender Design |

   Every tooltip ends with a dim footer that names the deeper gestures (`Shift more · T lock ·
   Click open · Ctrl+click Codex`), so players do not have to learn from each other that a
   deeper layer exists. Old World players had to teach each other its freeze key (U §1).

2. **Decisions on the surface, explanations underneath.** Anything needed to choose is printed:
   a cost on its button, an ETA on the cursor, supply after the move, projected unrest, the
   strength estimate before an attack. Tooltips explain *why* a number has its value. They never
   hold the only copy of a number the player decides on (P §13 rule 1).

3. **One number, one source.** Every displayed number and every breakdown row comes from a sim
   selector. A breakdown is the selector itself, run with a trace sink (section 7.2). A preview
   is the selector run with a what-if override. The UI never recomputes a formula, so the
   tooltip, the panel, the AI and the tick cannot disagree.

4. **Shallow menus, one home per command.**
   - Nation screens are top-bar buttons: Research, Ledger, Codex, Menu.
   - **The bottom strip holds a selected commander's standing orders:** Idle, Guard, Pillage,
     Research, Preach, Claim, Make Prophet, Reverse, Storm, and the Cast ▸ navigation button.
   - **The left dock holds province actions and planning editors.** Province actions are tax,
     PD, Build and Recruit. The editors are the Battle Plan, the ritual list and payment, and
     Give mana.
   - Lists (outliner, message feed) go in the right dock.
   - Every command has exactly one home. Other places may link to that home with a navigation
     button, never with a second action button. For example, the siege block's "Storm ▸"
     selects the besiegers and lights Storm in the strip.
   - **Depth budget:** every decision surface is at most 2 clicks from the map, and committing
     takes one more. The audited paths are in section 1.5, and none exceeds 4 clicks. Any
     explanation is at most 3 hovers deep.
   - One modal is open at a time. A dock panel has at most 4 tabs. Full-screen modals (Ledger,
     Settings, Codex) may have more.
   - No screen is reachable only from a notification or only by hotkey. Every hotkey has a
     visible button.

   Endless Legend 2 dropped its "Divided UI" because players did not know where to look
   (X §11). Victoria 3 was criticized for menu hopping (P §13).

5. **Conditions, not chores.** Alerts are conditions computed from state. They are actionable
   and counted, and they disappear when resolved. Events go to the message feed. Interrupts
   follow per-type player settings. The game pauses for a threat *before* it arrives, because
   battles resolve the instant armies meet (U §7). It pauses only for threats to what the player
   cannot afford to lose, so pauses stay rare and predictable (U §7, RimWorld complaint).

6. **Never hue alone.** Every color identity is shown three ways: hue, glyph and letter (MTG's
   model). Every state shown by color also has a shape or a pattern. In panels an icon always
   comes with a word or a number. Bare icons appear only on the map and in the top bar, and
   always have a tooltip (U §5, D §2).

7. **Disabled things explain themselves; nothing the player looks for is hidden.**
   - A blocked action stays visible. Its tooltip shows the reason, and the reason is the string
     `validateCommand` returns for that exact command. The sim's validators are the only source.
   - Sections that do not apply yet, such as Rituals before the player has a caster, are
     collapsed with a one-line unlock hint. They are never removed.

8. **The map is the hero, and in a replay the stage is.** Chrome is quiet, dark and collapsible,
   and it is drawn *over* a canvas that never resizes. Mana colors appear only on things that
   carry that identity. The battle replay uses the same components, icons, keys and settings as
   everything else, so the visceral battle stage sits inside the same game.

### 1.2 What is visible without a click (the L0 set)

`docs/07` requires population, supply, gold, materials, mana and unrest to be visible without a
click. This table makes that testable and adds the other things a player checks every minute.

| Information | Where it is at L0 |
|---|---|
| Gold | Top bar: stock and net rate (`1,240 ▲38/mo`) |
| Population | Top bar: national total and growth. Map: the number in the Population mode's numbers layer, and a log bar at Near zoom |
| Materials | Top bar: capital fort pool and cap, with the rate (`212/360 ▲60/mo`) and a "full" glyph at the cap |
| Mana | Top bar: five fixed slots W U B R G, each with symbol, stock and `▲n/mo` |
| Supply | Map: an army badge gets a corner glyph **only when supply is tight (half wheat) or starving (crossed wheat)**. Alerts ribbon: "Army starving". Supply mode |
| Unrest | Map: a fist glyph in the province label from `UI.unrestShowAt` (25), outlined; solid above `UNREST.recruitBlockAbove` (50), where recruiting stops. Unrest mode. Alert above 50 |
| Date, speed, paused state and its reason | Clock cluster, top right |
| Research | Top bar: active color symbol, level, days to the next level |
| Dominion | Top bar: dominion score. Map: a dominion chip on each province label (candle glyph and strength, in the banner color) |
| Victory race | Top bar: the Wellspring track `◆◇ 1/2`, with a "1 short" badge when any nation is one claim from winning |
| Threats | Map: visible hostile armies in transit show an arrow and an ETA. Alert "Hostile armies inbound" when one heads for own troops, a fort or the capital |
| Own armies | Map badges, and the outliner's Armies section with order, troops, ETA and status glyphs |
| Problems | Alerts ribbon (section 2.5) |

### 1.3 Layer map: where every detail lives

Read across a row: L0 is what you see, L1 what hover adds, L2 the concept behind it, L3 where you
act, L4 where you compare or look it up. "Breakdown source" names the selector that runs with a
trace sink (section 7.2).

| Detail | L0 glance | L1 hover (breakdown source) | L2 concept | L3 act | L4 compare / reference |
|---|---|---|---|---|---|
| National gold | top bar | provinces top 5 + others, plunder, upkeep by commander, net (`nationEconomy`) | Gold, Upkeep, Tax rate | province Overview (tax); Pillage order | Ledger: Provinces sorted by gold |
| Province gold | Overview stat row | pop ÷ 100, tax, Order scale, unrest factor, running values (`provinceEconomy`) | Tax rate, Unrest, Scales | Overview: tax selector | Ledger: Provinces |
| Population | top bar | growth terms, recruits pending, pillage, battle losses | Population, Growth | province header | Ledger: Provinces; Population mode |
| Materials | top bar | own production, neighbor shares, cap, overflow (`fortMaterials`) | Materials, Fort | Recruit tab | Ledger: Provinces (fort columns) |
| Supply | badge glyph when tight or starving | base, pop ÷ 50, scales, ritual factor, siege factor, eaten by each commander here (`provinceEconomy`) | Supply, Starvation | move elsewhere; Bounty ritual | Supply mode; Ledger: Provinces |
| Unrest | label fist | each source per month, projection (`provinceEconomy`) | Unrest | tax, priest, PD | Unrest mode |
| Province scales | five two-pole bars in the province Overview | dominating nation, strength, `round(scale × strength / 10)`, Wellspring step (`provinceScales`) | each axis | dominion (Preach, Temple) | Dominion mode; Codex |
| Mana per color | top bar slot | springs by province, Wellsprings, dominion tint, Rot bonus (`provinceEconomy` per province) | Mana, Spring, Dominion tint | Give mana; Rituals | Ledger: Magic; Mana springs mode |
| Research | top bar | each researching mage, pips, Lore factor; unlocks at the next level (`researchRate`) | Research, Pip | Research order (strip) | Research screen |
| Dominion score and spread | top bar, label chip | score terms; checks per month by source (`dominionChecks`) | Dominion, Candle, Godless | Preach (strip); build Temple (Overview) | Dominion mode; Codex |
| Army strength | badge count | squads, HP %, morale, supply status | Squad, Morale | select: bottom strip | Ledger: Commanders |
| Commander details | strip portrait, pips on its frame | HP, morale terms, leadership, fatigue rules | Pip, Holy, Leadership | Commander panel (on demand) | Codex unit page |
| Script and formation | five-glyph script summary in the strip | each slot with castability and fatigue (`scriptCheck`) | Script, Formation, Fatigue | Battle Plan sheet | Codex: spells |
| Move | path preview, ETA label | per-leg days, terrain, speed factor, supply after arrival | Map speed | right-click | — |
| Attack outlook | engagement preview card | both sides, modifiers, fog band | Morale, Terrain | right-click; Battle Plan | battle report afterwards |
| Spells | script slot glyphs, spell cards | full effect, cost for this caster, requirement | Fatigue, Carried mana | Battle Plan, Rituals tab | Codex: Spells |
| Units | unit cards | stat block, weapons, tags, upkeep, reason if not recruitable | Sacred, Berserk, ... | Recruit tab | Codex: Units |
| Ritual effects in force | province Overview (and a glyph at Near zoom) | spell, owner, days left, numbers changed | Ritual | — | Ledger: Magic (Active effects) |
| Sieges | siege glyph in the label | walls, rates, days to breach (`siegeRates`) | Siege, Storm, Walls | Storm (strip); siege block links to it | Outliner: Activities |
| Recruit queues | outliner Activities | head item, days, waiting reason | Recruitment | Recruit tab | Ledger: Provinces |
| Battle outcome | feed row, map marker | result line | — | battle report card | replay; Ledger: Battles |
| Wellsprings | top-bar track | every Wellspring and claim, every nation's count | Wellspring, Claim | Claim (strip) | Ledger: Nations |

### 1.4 How menus stay shallow

- **Tabs, not sub-windows.** Province: Overview, Recruit, Forces, History. Commander: Overview,
  Battle Plan, Rituals. Nothing opens a window from inside a window.
- **One modal at a time.** A modal that links to another (Research to the Codex) replaces it and
  leaves a back link. Modals: Research, Ledger, Codex, Settings, Game Menu, battle replay.
  Pretender Design, New Game, Main Menu and Victory are full screens outside the game screen.
- **Ritual targeting is docked, not modal**, because it needs the map (U §10).
- **The Ledger replaces a family of screens.** Provinces, Commanders, Magic (including active
  effects), Battles and Nations are tabs of one sortable screen. Dominions spreads these across
  F1 to F9 (D §1.1, §1.11).
- **Popups only for what the player set to pop up** (section 5.3). Confirmations appear only for
  irreversible actions (section 5.7), and they confirm inline.
- **The left dock has a back stack** with a breadcrumb (`Ashfen ▸ Varo`), so stepping from a
  province to a commander and back costs one click.

### 1.5 Depth audit: the deepest real paths

Counted from the map with nothing selected. A "click" is a click or a key. Hovering is free.

| Task | Path | Clicks |
|---|---|---|
| Move an army | select badge → right-click target | 2 |
| Set tax | select province → tax segment | 2 |
| Buy PD | select province → `+1` (Shift+click for 5) | 2 |
| Build a temple | select province → Build on the Temple row (names its builder) | 2 |
| Recruit a batch | select fort province → Recruit tab → unit card | 3 |
| Claim a Wellspring | select priest → Claim | 2 |
| Give an order (Pillage, Guard, Research, Preach) | select commander → order button | 2 |
| Make Prophet | select commander → Make Prophet → inline confirm | 3 |
| Storm | select besieger → Storm → inline confirm (only while walls stand) | 3 |
| Set research color | R → Research this | 2 |
| **Script a spell** | select commander → script summary (opens the Battle Plan) → slot → spell | 4 |
| **Cast a ritual** | select mage → Cast ▸ (or `C`) → ritual row → valid target on the map (commits) | 4 |
| Cast a self-targeted ritual | select mage → Cast ▸ → ritual row → Cast button | 4 |
| Change a squad's row | select commander → script summary (opens the Battle Plan) → drag | 3 |
| Transfer a squad | as above, drag onto another commander's circle → count prompt | 4 |
| **Give mana** | select mage → `Enter` (Commander panel, Overview tab) → Give mana → Give | 4 |
| Read a battle report | click the feed row or the map marker | 1 |
| Watch a replay | hover the feed row → Watch | 1 |
| Compare provinces | L → Provinces → column header | 3 |

A decision surface is at most 2 clicks deep: the Recruit tab, Battle Plan, Rituals tab,
Commander panel, Research and Ledger. A test walks this table against the binding table and the
panel routes (section 9.4).

---

## 2. The game screen

### 2.1 Layout

**The canvas never resizes for panels.** The Pixi canvas fills the browser window and changes size
only when the window does. The top bar, docks, strip, ribbon and toasts are DOM drawn *over* it.
Opening or closing a panel never moves the camera, so the province under the cursor stays under
the cursor and a quick second click lands where the player aims. If a selection ends up under a
panel, the panel header's go-to button centers it in the **unobscured area**, which is the part of
the map no panel covers.

Two breakpoints. Sizes are at 100% UI scale and grow with it, because every DOM size is in `rem`
(section 5.6).

```
Wide (window >= 1600 px wide), shown at 1920x1080. Everything below the top bar floats over the map.
+-----------------------------------------------------------------------------------------------+
| TopBar 44px: [Nation] Pop Gold Materials | W U B R G | Research Dominion Wells | [R][L][F][=] Clock Speed |
+-----------------------------------------------------------------------------------------------+
| Left dock 360  | [alerts ribbon at x = 372, fixed]                  [toasts] | Right dock 300 |
| (province, or  |                                                  [pause chip] | Outliner       |
|  commander     |                     MAP (full-window Pixi canvas)           | -------------- |
|  panel on      |                                                             | Message feed   |
|  demand)       |                                                       [mode | (splitter)     |
|                |                                                       column]|                |
+-----------------------------------------------------------------------------+                |
| Bottom strip 128 (a commander is selected): portrait | squads | script | orders | ETA |       |
+-----------------------------------------------------------------------------------------------+

Narrow (1280 to 1599 px), shown at 1280x720
+-------------------------------------------------------------------------------+
| TopBar 44px (mana slots show stock only; rates move to the tooltip)           |
+-----------------+-----------------------------------------------------+---+---+
| Left dock 320   | [ribbon x = 332]                          [toasts]  |mod| R |  48px rail:
| (on selection   |                                                     |e  | a |  Outliner, Feed;
|  of a province, |              MAP                                    |col| i |  each opens a 300px
|  or on demand)  |                                                     |   | l |  flyout over the map
+-----------------+-----------------------------------------------------+---+---+
| Bottom strip 120 (a commander is selected)                          |   |   |
+-------------------------------------------------------------------------------+
```

**Fixed anchors** (none of them moves when another panel opens):
- **Alerts ribbon:** under the top bar at `x = left-dock width + 12 px` (332 narrow, 372 wide),
  whether or not the dock is open. It never sits under the dock and never jumps.
- **Toasts:** right-aligned to the inner edge of the right dock or rail, under the pause-reason
  chip.
- **Pause-reason chip:** under the clock, at the top right of the map.
- **Map-mode column:** six 32 px buttons stacked vertically at the bottom of the map's right edge,
  against the right dock or rail. The legend chip sits above it. The bottom strip stops at the
  column's left edge, so neither moves.
- **Bottom strip:** from the window's left edge to the mode column. When the strip shows, the
  left dock's bottom edge rises to the strip's top. That is a DOM change only.
- **Report popups** appear centered in the window.

**Unobscured map area budget at 1280x720** (map area = window minus the 44 px top bar = 1280 ×
676). A layout test checks these numbers (section 9.4).

| State | Covered by | Unobscured area | Share of the map area |
|---|---|---|---|
| Nothing selected | rail 48, mode column 40 | 1192 × 676 | 93% |
| Province selected | + left dock 320 | 872 × 676 | 68% |
| Commander selected | + strip 120 | 1192 × 556 | 77% |
| Commander and Commander panel | dock + strip | 872 × 556 | 56% |
| Battle Plan sheet | sheet 640 + strip | 552 × 556 | 35% (a planning sheet, closed with Esc) |
| Right flyout open | + 300 | −300 px width | — |

At 1920x1080, a selected province leaves 1220 × 1036 (63% of the map area), and a selected
commander leaves 1580 × 908. Old World reviewers report losing 40 to 50% of the screen to menus,
and Humankind's unit panel took almost half the screen (X §6, §11). Fluid Magic keeps at least
half the map area visible in every state except the Battle Plan sheet, which the player opens
deliberately and closes with Esc.

- **Collapse and hide:** `[` and `]` collapse the left and right docks. `H` hides all chrome except
  the clock (Dominions `h`, D §1.1 [V]).
- **No slide-in animation.** Panels appear on the frame after the click (D §2: "keep the speed").

### 2.2 Visual language (summary; values in docs/09 "UI chrome")

- **Chrome:** dark neutral panels (#1C1A17 base, two lighter steps), parchment text (#F4EEDF),
  1 px keylines. One display face for headers and one tabular-figure face for numbers. No mana
  colors in decoration (X §13, Endless Legend 2's "too loud" warning).
- **Two button styles** (Vic3, P §13 rule 6):
  - **Action** buttons issue a command through `validate` then `apply`. They are filled, with a
    1 px parchment keyline, and print their cost.
  - **Navigation** buttons open a panel, a screen or a mode. They are ghost buttons with no
    keyline. `Cast ▸`, `Storm ▸` (in the siege block) and `Edit battle plan ▸` are navigation
    buttons.
- **Numbers:** integers at L0. Signed deltas use ▲ or ▼ *and* a warm or cool tone. Units are
  always written (`/mo`, `/day`).
- **Concept terms** (L2 triggers): chrome text color with a 1 px dotted underline, never a mana
  hue. Blue would read as Tide (U) (X §1 point 2).
- **Entity links** (provinces, commanders, nations, spells) carry a small leading glyph
  (province pin, portrait dot, banner, mana symbol) and underline on hover. A click navigates.
  A concept *explains* and an entity *goes there*, and the two look different.
- **Icon grammar:** one 24×24 monoline silhouette per noun (docs/09 icon inventory). States are
  corner badges on that silhouette: ▲ ▼ ✕ (blocked) ‖ (paused) ! (problem). A state never gets a
  new silhouette (U §5).
- **Cards share one frame** (rounded rectangle, header band in the nation's secondary color,
  symbol row at the bottom): unit, spell, chassis, battle report. The replay therefore uses the
  same visual language (X §13).

### 2.3 Top bar

Left to right. Each readout is a `Readout` component: icon, value, rate, L1 tooltip, click target.

| # | Readout (L0) | L1 tooltip (selector run with a trace) | Click | Warning states (hue + shape) |
|---|---|---|---|---|
| 1 | **Nation button**: banner with mana symbol, pretender mini-portrait | Nation name; pretender state (awake in Kharnath / dormant, arrives Y2 M1 D1 / dead); Godless state; the five national scales as mini two-pole bars | Ledger, Nations tab (summary card, scales, bless) | Godless: ! badge and red ring |
| 2 | **Population** `84.2k ▲0.3k/mo` | National total; growth per month; top 5 provinces; recruits waiting for population; pillage losses | Population map mode | ▼ when shrinking |
| 3 | **Gold** `1,240 ▲38/mo` | Income by province (top 5, then "N others ▸"), plunder as a monthly rate, upkeep by commander (top 5, then others), net. Shift adds per day. Projection: "At this rate: 1,278 in 30 days", or "Empty in 23 days: troops go unpaid" | Ledger, Provinces tab, sorted by gold | Net below 0: ▼ warm. Empty within `UI.treasuryWarnDays` (30): Urgent alert |
| 4 | **Materials** `212/360 ▲60/mo` (capital fort pool / cap) | Per fort (M1: the capital): own production, each neighbor's 50% share as a row, cap = 6 months, months to cap, "Besieged: nothing collected" when it applies | Capital province, Recruit tab | At the cap: "full" glyph, amber, and an "Overflow lost −x/mo" row (Stellaris's full-means-wasted yellow, P §1) |
| 5 | **Mana** W U B R G: symbol, stock, `▲n/mo` | Per color: springs by province, Wellsprings, dominion tint per province, Rot bonus (B), rituals in progress already paid | With a caster selected: that commander's Rituals tab. Otherwise Ledger, Magic tab | None (mana has no cap). A color with no stock and no income is drawn at 40% with no rate. All five stay in place, so the layout never shifts and the five colors are taught |
| 6 | **Research**: active color symbol, `L3 ▸ 47d`, a hairline progress bar | Each researching mage (name link, pips, lab, Lore factor, RP/mo), total RP/mo, points to the next level, the spells it unlocks | Research screen (R) | No researcher, or a color with no M1 spells: ! badge and an Important alert. Track maxed at L6: "max" glyph |
| 7 | **Dominion**: candle glyph and score | Score = pretender + claimed Wellsprings (capped at 10); provinces under your dominion; checks per month by source (capital, temples, pretender, prophet, preachers); expected pushes per month | Dominion map mode | Godless risk (capital not under own dominion): ! badge |
| 8 | **Wellsprings** `◆◇ 1/2` (own claimed / needed) | Every Wellspring: province link, owner, claimed by, claim progress; every nation's count | Centers the map on the next Wellspring (repeated clicks cycle). Footer link "Ledger: Nations ▸" | Any nation at needed − 1: a "1 short" badge with a hexagon outline (shape + word) |
| 9 | **Screen buttons** (navigation style; icon plus key letter): Research `R`, Ledger `L`, Codex `F`, Menu `Esc` | Name and key | Opens the screen | — |
| 10 | **Clock** `Y1 M3 D14`, with a hairline that fills toward the last day of the month | "Dominion spreads and Godless is checked in 16 days (last day of the month). Every other rate is paid daily: today +1.3 gold, +0.1 R, +0.07 G." | Opens the speed popover (speed presets) | — |
| 11 | **Speed**: pause button and four speed pips | "Space pause · 1 to 4 speed · + / − step" | Click a pip to set the speed | Paused state (section 2.4) |

The hairline is the **monthly-events timer**, not a payout timer. docs/01 applies every monthly
rate each day as rate ÷ 30. Only the dominion spread and the Godless check happen on the last day
of the month (`src/sim/tick.ts` step 5). The `/mo` rates are continuous rates.

Where the narrow layout saves width: below 1600 px the mana slots drop their rates (moved to the
tooltip), Research shows `L3 47d`, and the screen buttons show icons only. Budget at 1280: about
1,120 px.

A readout's tooltip follows the anatomy in section 5.1. Every breakdown row that names a province
or commander is a link. That answers Civ VII's "totals without sources" critique and Vic3's
"explains but can't act" (X §3, P §13).

### 2.4 Clock, speed and auto-pause

- **Speeds** (docs/01): Paused, 1 (1 day/s), 2 (2), 3 (4), 4 (8). Space toggles pause. The digit
  keys 1 to 4 (physical keys, section 5.4) set the speed. `+` and `−` step it (EU4, P §2 [X]).
  Every order works while paused.
- **Paused looks paused, on three channels:** the cluster tints red, the word **PAUSED**
  appears, and the speed pips turn hatched. CK3 players report a red bar when paused (P §2 [U]).
  Fluid Magic adopts the three channels on their own merit (principle 6).
- **Pause-reason chip** under the clock after an auto-pause: `Paused: Battle at Ashfen ▸`.
  Clicking it goes to the cause. Pauses on the same day **coalesce**: `Paused: 3 events ▸` opens
  a list with jump links (U §7). This answers the Stellaris complaint "why did it pause?"
  (P §2 [X]).
- **Popup queue.** When several popups arrive on one day, one card shows at a time with
  `Next (2 more)`. Closing the last card leaves the game paused. Each queued card is also a feed
  row, so nothing is lost if the player closes the queue.
- **No auto-resume by default.** Closing a popup leaves the game paused. One setting, "Resume
  after closing an auto-pause popup", is off by default (Stellaris complaint, P §2 [X]).
- **Modals and ritual targeting pause and restore.** Opening Research, the Ledger, the Codex,
  Settings or the replay pauses the game, and so does entering ritual targeting mode (section
  3.5). Closing the modal, or committing or cancelling the target, restores the speed that was
  active when it opened. That speed may itself be "paused" after an auto-pause, so an auto-pause
  is never undone by accident. For modals this is a setting, on by default. The replay and ritual
  targeting always pause.
- Pause state and speed are UI state. They never enter `GameState`, so determinism is
  unaffected.

### 2.5 Alerts ribbon

Alerts are **conditions**: true now and computed from state by pure functions
(`src/ui/derive/alerts.ts`, section 7.3). Each one disappears the moment its condition clears.
They are not queued events. The ribbon sits under the top bar at a fixed x (section 2.1). EU4 and
CK3 put theirs at the upper left (P §3). One icon per alert type, with a count badge.

**Tiers.** EU4's three urgency colors (P §3 [X]) plus the blue hint tier. Each tier has its own
shape, so hue is never the only signal:

| Tier | Color and shape | Meaning |
|---|---|---|
| Urgent | red octagon | act now or lose something |
| Important | yellow triangle | costs you every day it stays |
| Opportunity | green circle | something you can gain |
| Hint | blue rounded square with "i" | first-time teaching (section 5.5) |

**M1 alert types.** All are derived from sim selectors. Thresholds come from `src/content/ui.ts`
(`UI`) or the sim's content rules, never from literals in UI code.

| Alert | Tier | Condition | Click goes to |
|---|---|---|---|
| Army starving | Urgent | an own commander with troops stands where `supplyUsed > supply` | the province, Supply mode |
| Troops unpaid | Urgent | `nation.unpaidDays > 0`, or the treasury empties within `UI.treasuryWarnDays` at the current net | Ledger, Provinces by gold |
| Fort besieged | Urgent | an own fort with `siege !== null` | the province (siege block) |
| Hostile armies inbound | Urgent | `incomingThreats` (sim, section 7.2) holds a visible enemy leg that ends in a province with own troops, an own fort, or the capital (ETA shown) | the enemy army |
| Godless | Urgent | `isGodless(state, nation)` | the capital, Dominion mode |
| Recruiting blocked by unrest | Important | an own fort with unrest above `UNREST.recruitBlockAbove` | the province |
| Enemy dominion in your land | Important | an own province dominated by another nation | the province, Dominion mode |
| Capital dominion falling | Important | the capital's own dominion is at most `UI.capitalDominionWarn` (2), or held by another nation | the capital |
| Idle commanders | Important | an own commander that is not the garrison holder, not in transit, with order Idle (not Guard), and either (a) its last order or move ended within `UI.idleAlertDays` (5), or (b) it has color or holy pips. A mage idle in a lab reads "could research" | cycles through them (like `N`) |
| Materials at cap | Important | `pool >= cap` at a fort | the fort's Recruit tab |
| No research | Important | `nationResearchRate === 0`, or the active color is at L6 while others are not, or the active color has no M1 spells | Research screen |
| Script cannot cast | Important | a commander's scripted spell fails `scriptCheck` | the commander, Battle Plan |
| Wellspring claimable | Opportunity | an owned, unclaimed Wellspring province | the province; a priest there if any |
| Prophet available | Opportunity | no prophet and `day >= prophetAvailableDay` | selects the first eligible commander (not the pretender or a garrison holder) and lights Make Prophet in the strip |
| First-time hints | Hint | section 5.5 | the hint |

The Idle alert's case (a) needs a short memory: the store records the day each own commander
became Idle by comparing orders across store bumps (`alerts.idleSince`, not saved). After a load,
only case (b) applies until the next change. Humankind had to patch an Idle Army notification that
fired too much (X §5), and the **Guard** order (section 2.9) lets the player say "this army holds
here on purpose".

**Interaction** (EU4 and HoI4, P §3):
- **Hover** lists every case as a link, with a one-line reason: "Ashfen: 212 eat, 140 supply."
- **Left-click** goes to the first case. Repeated clicks cycle through the rest.
- **Right-click** dismisses the alert until its condition goes false and comes back true.
  Fluid Magic adopts this rule because alerts are conditions. EU5 is reported to do the same
  (P §3 [U], Tinto Talks #77).
- **Shift+right-click** mutes the type for this game. Muted types are listed in the outliner's
  "Muted alerts" section and in Settings, where they can be restored (EU4, P §3 [X]).
- `J` jumps to the newest alert or message, and each further press steps back through the last 8
  (StarCraft II's alert jump, moved off Space because Space pauses; U §6 [X]).
- An Urgent alert's first appearance pulses its icon twice, except under reduced motion.

**[Phase 9b]** Two alert types join the table, the only ones that carry buttons: **Prisoner
taken** (Important; Recruit with the contest odds, Ransom with the price, Release) and **Officer
proposal** (Opportunity; the officer's line, the command's preview, Accept and Dismiss; at most 3
open, 1 per officer per month). Neither pauses the game unless the new "Officer events" auto-pause
toggle is on. The exact text is in `docs/07-ui.md`, "Alerts ribbon", and the rule that a button
issues its command through `validateCommand` and shows the disabled reason is principle 3 applied.

### 2.6 Outliner (right dock, top)

The Paradox outliner: everything the player owns or is doing, in collapsible sections with counts.
Empty sections hide themselves (EU4), and noisy ones start collapsed (Vic3 1.6; P §5 [X]). `O`
toggles it (Stellaris is reported to use O, P §5 [U]; the key is a mnemonic either way).

| # | Section | Rows | Default |
|---|---|---|---|
| 1 | **Learn** (first games, section 5.5) | 7 steps with Why links | open while guidance is on |
| 2 | **Pinned** | anything pinned with `P` or the panel header's pin: commanders, provinces, Wellsprings | open |
| 3 | **Armies** | commanders that lead troops, grouped under province headers. Idle (not Guard) armies sort to the top | open |
| 4 | **Mages** | mages without troops, sub-grouped by order: Researching, Casting, Idle | open |
| 5 | **Priests** | priests without troops: Preaching, Claiming, Idle | collapsed |
| 6 | **Scouts** | scouts and stealthy commanders | collapsed |
| 7 | **Provinces** | own provinces that hold a province-level alert: starving, unrest above 50, besieged, enemy dominion, materials at cap | open |
| 8 | **Activities** | sieges (ours and theirs, walls bar), rituals in progress (caster, spell, days), recruitment (per fort: head item, days, queue length), construction, Wellspring claims | collapsed after the first game |
| 9 | **Wellsprings** | each known Wellspring: owner banner, claimed by, claim progress | open |
| 10 | **Muted alerts** | muted alert types, each with Restore | only when any are muted |

Every commander appears in exactly one of sections 3 to 6, by role: Armies when it leads troops,
otherwise by its pips (mage), holy pips (priest) or the scout tag. The pretender and the prophet
carry a crown or halo badge wherever they appear. The garrison holder is never listed. Its troops
appear under the fort in Provinces when they matter.

**Row anatomy** (24 px tall):
`[portrait] Name · [order icon] · 48 troops · [status glyphs] · 4d`.
Status glyphs: at most three plus a `+n` chip. They cover tight supply, starving, unpaid,
wounded below 50%, besieging, casting, and script problem. They work like Stellaris's planet
status icons (P §5 [X]).

**Row interactions:**
- Hover shows a compact army card: squads with counts, HP and morale, and supply status.
- Click selects the commander, which shows the bottom strip. Double-click selects and centers
  the camera (Stellaris, P §5 [X]).
- Right-click opens the entity context menu: the orders available now, Pin or Unpin, and Open
  in Codex (section 5.4).
- Rows are **drop targets**: drag a squad from the Battle Plan onto a commander in the same
  province to call `transferSquad`. An invalid target shows the refusal reason ("Leadership 60:
  would lead 72").
- Keyboard: `N` goes to the next idle commander, skipping those on Guard, and a second press
  centers on it (CK3 is reported to use N, P §5 [U]; StarCraft II's idle key, U §6 [X]).

Stack clicks and Shift-drag box selection move armies together. Named groups are not built in M1.

### 2.7 Message feed (right dock, bottom)

Messages are **events**: things that happened. The feed sits under the outliner with a draggable
splitter, as Vic3's does (P §4 [X]). In the narrow layout it is its own rail icon with an unread
count.

- **Row:** type icon, date (`M3 D14`), text with entity links, then buttons that appear on hover:
  Jump, **Watch** for battles with a kept record, and a gear. The gear opens that type's two
  settings, Display and Pause, in place (Vic3, EU4; P §4 [X]).
- **Filter chips:** All · Battles · Military · Economy · Magic · Dominion. The same categories
  appear in Settings → Messages (D §1.9).
- **Grouping:** repeats of one type within `UI.mergeDays` (5) in-game days merge into one row:
  "Recruited ×3 (Kharnath)". At speed 4 a month passes in under 4 seconds (U §7).
- **Right-click** hides a row (a notification; Civ VI, X §5 [X]). The message stays in the
  province History tab and in the Ledger.
- **Retention:** the sim keeps `MESSAGES.keep` (300) messages per nation, and the feed shows all
  of them. A battle row whose record has been evicted opens the report card from the kept summary,
  with Watch disabled (section 4.1).

Categories by message kind (`MessageKind` in `src/sim/types.ts`; new kinds in section 7.2):

| Category | Kinds |
|---|---|
| Battles | `battle` |
| Military | `captured`, `lost`, `sighted`, `approaching` (new), `threatened` (new), `starvation`, `siege` (new), `breached` (new) |
| Economy | `recruited`, `built` |
| Magic | `ritual`, `research` |
| Dominion | `dominion`, `godless` (new), `wellspring`, `pretender` (new), `eliminated` (new) |

### 2.8 Selection, and the left dock

**One selection, one surface.**

| Selection | Surface that opens | Opens on demand |
|---|---|---|
| A province (click its area, not a badge) | left dock: Province panel | — |
| One own commander (click a badge, a fanned badge, or an outliner row) | bottom strip | Commander panel in the left dock: `Enter`, a click on the strip portrait or script summary, a double-click on the badge |
| Several own commanders (stack click, Shift+click, Shift-drag box) | bottom strip (compact cards, shared orders) | Battle Plan sheet for all of them: `Enter`, or a click on the script summary |
| Another nation's or an independent army (click its badge) | left dock: its province's Forces tab, with that army's card highlighted | — |

A commander's squads appear in one place, the strip's squad cards. The Commander panel holds
what the strip cannot: stat breakdowns, the order's progress, the Battle Plan and the Rituals tab.
HoI4 commands armies from one bottom-centre panel (P §9 [X]). Endless Legend 2's lesson is to never
split one thing across two places (X §11).

**Dock header** (the same for every panel):

```
[<] Kharnath > Varo the Ember                  [go-to] [pin] [Codex i] [x]
```

- `<` steps back through the stack. Mouse button 4 also goes back, best effort. Alt+Left is never
  used, because it is the browser's Back.
- **go-to** centers the selection in the unobscured area. **pin** adds it to the outliner's
  Pinned section. **Codex** opens this entity's Codex page. This is Vic3's go-to, pin and
  zoom-to trio (P §5 [X]).
- **Each opener names its tab.** The strip portrait and `Enter` open the Commander panel on
  Overview, the script summary on Battle Plan, and `Cast ▸` or `C` on Rituals. The Province panel
  remembers its last tab (X §10), so a player who works in Recruit stays there.

#### 2.8.1 Province panel

**Header:** name; terrain icon and word; owner banner and name (or "Independents"); dominion
candles in the dominating nation's banner, grouped by 3 (docs/07); building slots for Fort,
Temple and Lab, drawn filled when built and as a faint outline when missing, so a gap shows at a
glance (Civ VI districts, X §10 [X]); a Wellspring badge; spring symbols.

**Hero row:** `Population 12,400 ▲37/mo` in large type. The player should always feel this
number (docs/01 §3).

**Stat rows** (`StatRow`: icon, label, value, rate, and a target marker where the value drifts):

| Row | L0 | L1 breakdown (`provinceEconomy` with a trace) |
|---|---|---|
| Gold | `+21.8/mo` | pop ÷ 100 = base · tax ×1.0 · Order +7% · unrest −15%, with running values (multiplicative table, U §4) |
| Materials | `18/mo → Kharnath fort` | terrain base, pop ÷ 500, Artifice or Wild, ritual bonus; "50% goes to the fort at Kharnath" for a fortless neighbor |
| Supply | `140 / 212 per day · fed` | supply base, pop ÷ 50, Growth, Wild, Rot, Artifice, ritual factor, siege halving; then consumption by each commander here |
| Unrest | `34 ▲4/mo → 46 in 3 mo` | High tax +4, priest −5, enemy dominion +n, Order −2 per step, decay −2. The projection is clamped to 0 to 100 (RimWorld's mood target, U §2) |
| Mana | springs as symbols, `+3 R/mo` | each spring, dominion tint `floor(strength / 3)`, Wellspring 2 of each |
| **Scales** | five compact two-pole bars (pole symbols at the ends, a marker at the effective step) | dominating nation, its strength, `round(scale × strength / 10)` per axis, the Wellspring's +1 step, and that step's effects here (`provinceScales`). Dominions shows a province's scales wherever you hold dominion (D §1.2 [V]) |

**Tabs:**

- **Overview** [M1]
  - Tax selector Low / Normal / High (segmented). Hovering a segment shows its signed effect
    *before* the click: "High: +10.9 gold/mo, +4 unrest/mo". It comes from `provinceEconomy`
    with a `{ taxRate }` override (section 7.2; AoW4 and Civ VII previews, X §10 [X]).
  - PD row: `Provincial defense 6 · [+1 · 105 gold]`. Shift+click buys 5 levels, with the total
    printed in the tooltip. Hover shows the force each level adds (`pdForce`). Buying is refused
    during a siege, and the reason is shown.
  - **Buildings:** one row each for Temple, Lab and Fort. A row shows "Built", or "Building: 12
    days left", or a **Build** action button with its cost and its builder: `Build · 150 gold ·
    by Varo ▾`. The builder is the first own commander here that can take orders. `▾` picks
    another. A disabled button shows the validator's reason. Fort rows read "New forts: M2" in
    M1. This row is Build's only home.
  - **Wellspring banner** when applicable: scale bonus, owner, claimed by, and claim progress with
    the claiming priest.
  - **Active effects:** each ritual effect on the province, with spell, caster's nation, what it
    changes, and days left.
  - **Siege block** when besieged: walls `180 / 300`, a bar, daily rates "−24 attack, +9 repair",
    days to breach (`siegeRates`). For the besieger it shows a navigation button **Storm ▸**,
    which selects the besieging commanders and lights Storm in the strip.
- **Recruit** [M1] (forts only)
  - Two bands: commanders above, troops below, each cheap to expensive from left to right
    (Dominions, D §1.3 [V]).
  - Unit cards show gold, materials, days and population. A batch-size stepper (1 to 50, default
    10) sits above the troops band.
  - Click queues one batch of the chosen size. Shift+click queues the largest affordable batch,
    up to 50.
  - A card that cannot be recruited is dimmed, and its tooltip gives the validator's reason
    ("Needs 80 materials, fort has 52"; "Unrest above 50"). No "recommended" badges (Civ VII
    1.2.5, X §10 [X]).
  - Queue below: each row has a progress bar, days left and a cancel ×. A waiting row stays dimmed
    with its reason ("Waiting: needs 200 population, has 150"; "Paused: besieged").
  - Pool line: `Materials 52 / 360 · ▲60/mo · full in 5 mo`.
- **Forces** [M1]
  - Own commanders here, as cards. Click selects (and shows the strip).
  - Garrison squads (under the garrison holder), draggable onto a commander's card.
  - The PD force composition.
  - Visible other forces: exact where seen, or the fogged word (weak, moderate, strong,
    fortress) with "Scout it to see exact numbers" (docs/01 §14).
- **History** [M1-should]
  - The message log filtered to this province (messages already carry `province`). It is the
    analog of Dominions' Province Chronicles (D §1.2 [V]).

A foreign or independent province shows Overview and Forces read-only, plus History. Values the
nation has not explored show as "unknown" with a scout hint, never as zero.

#### 2.8.2 Commander panel (on demand)

**Header:**
- A 64 px portrait with a pip ring: mana symbols around the frame, plus a holy mark for priests.
- Name, unit type, and badges (Pretender, Prophet, Scout, Stealthy).
- HP bar, morale value, and location or transit (`→ Ashfen, 4 days`).

**Tabs:**

- **Overview** [M1]
  - Stats, each with an L1 breakdown: HP; morale, with the starvation and unpaid penalties as
    rows; a **leadership meter** `45 / 60 troops` (D §1.4); map speed (the slowest squad wins);
    supply eaten per day; upkeep per month; pips and holy pips; carried mana as symbols; research
    rate while researching; dominion checks while preaching or as prophet.
  - The current order and its progress: ritual days, claim days, build days, or the move path.
  - **Give mana**, an action button that opens a popover with a color picker, an amount stepper
    and Give. It is enabled only while the commander stands in an own lab. Elsewhere it is
    disabled with the reason "Needs a lab province you own".
- **Battle Plan** [M1]: opens the wide sheet (section 2.8.3).
- **Rituals** [M1] (mages only; key `C`): section 3.5.

With several commanders selected, the panel shows a header with totals (`3 commanders · 112
troops · speed 2 (Thornwood Archers)`, supply eaten, upkeep) and the Battle Plan only.

#### 2.8.3 Battle Plan sheet

Dominions' lesson: deploy and script on one screen. Its Army Setup is a full screen, and players
praised Dominions 6 for letting them deploy and script without switching screens (D §1.4, §3 [V
for the manual's Army Setup]). Fluid Magic gives the plan a **wide sheet**: while the Battle Plan
tab is active, the left dock grows to **640 px** (narrow layout) or **720 px** (wide) over the map.
The camera does not move. Esc or another tab returns the dock to its normal width.

```
Battle Plan sheet, 640 x 556 at 1280x720 (top bar above, strip below)
+--------------------------------------------------------------------------+
| [<] Ashfen > Varo the Ember                       [go-to][pin][i][x]     |  40
| Overview | Battle Plan | Rituals            [x] Whole army here (3)      |  32
+------+-------------------+-------------------+---------------------------+
|      | REAR              | MIDDLE            | FRONT                     |  20
+------+-------------------+-------------------+---------------------------+
| (V)  | [Mage 1]          | [Arch 15][Arch 15]| [War 20][War 20]          |  84
| Varo |                   |                   |                           |
+------+-------------------+-------------------+---------------------------+
| (I)  |                   | [Arch 12]         | [Ward 20][Ward 18][Ward 9]|  84
| Ilwen|                   |                   | [Ward 10]                 |
+------+-------------------+-------------------+---------------------------+
| (P)  | [Mil 24]          |                   |                           |  84
| Pyre |                   |                   |                           |
+------+-------------------+-------------------+---------------------------+
| Script: Varo  [R1 Fb][R2 Fb][R3 Fb][R4 Hd][R5 Hd] [Round 6+: repeats 5]  |  60
| Fatigue  |==20==|==40==|==60==|==80==|=100 faints in round 5             |  20
| [Auto][Artillery][Support][Stand fast][Charge]   [Copy] [Paste to all]   |  32
+--------------------------------------------------------------------------+
```

**Size budget at 1280x720:**
- The sheet is 640 × 556: the top bar takes 44 px and the strip 120.
- Header and tabs take 72 px.
- The formation field shows three lanes of 84 px plus a 20 px column header, 272 px in all.
  From the fourth lane on, the field scrolls inside itself.
- The script area for the focused commander takes 112 px.
- Padding takes 24 px. The total is 480 px, which leaves 76 px for the warning line.
- Lane geometry:
  - A lane has a 56 px gutter for the commander circle, then three columns of about 189 px.
  - A squad box is 56 × 36: sprite, count and HP bar.
  - A column fits 3 boxes per line. Two lines (78 px) hold all five of a commander's squads,
    even when every squad stands in one row.
- A pure layout function (`formationLayout`) places the boxes, and a test checks this budget
  (section 9.4).

**Formation field.**
- **Lanes are commanders and columns are rows**, `rear | middle | front` from left to right. The
  back is on the left, as in Dominions' battle position box.
- **Commanders are circles and squads are boxes** (Dominions [V]).
- A commander's circle shows its first scripted stance by glyph *and* color: Cast (the spell's
  mana color and symbol), Attack (crossed blades), Hold (shield), Retreat (arrow).
- Dragging a box between columns calls `setFormation`. Dragging a box onto another commander's
  circle calls `transferSquad`. A count prompt (with a **Half** button) appears when the squad
  has more than one troop. A drop that breaks leadership is refused, and the refusal shows its
  reason.
- **Whole army here** shows every own commander in the province. It is on by default when more
  than one is present, and it is always on for a multi-commander selection.
- Clicking a circle focuses that commander's script below.
- No ghosted enemy side in M1. The engagement preview (section 2.10.6) shows the enemy.

**Script timeline** (for the focused commander):
`[R1][R2][R3][R4][R5] [Round 6+: repeats slot 5]`. The greyed sixth cell states docs/04's rule
on screen: when slot 5 is Retreat it reads `Round 6+: default` instead, since Retreat is not
repeated.
- Each slot is a picker: Cast (a spell, or "Best available"), Attack, Hold, Retreat.
- The spell list shows only spells this commander can cast. Each shows its fatigue cost *for
  this caster* (extra pips reduce it; docs/02 §3), its requirement as symbols, and a carried-mana
  badge.
- "Show locked" lists the rest, dimmed, each with its reason ("needs RR, has R", "research
  Ember 3").

**Warnings in place.**
- A slot that cannot cast turns amber with the reason. Where a fix exists, the slot offers it in
  one click, for example "Give 1 R" when standing in a lab.
- A **projected fatigue strip** shows rounds 1 to 5 against the 100 line: "faints in round 5"
  (`scriptCheck`).
- Dominions falls back silently to another spell, and players have to decode that from the logs
  (D §1.5).

**Presets** are chips that issue a normal `setScript`:
- Auto: five empty Casts, the mage default.
- Artillery: the best damage spell ×5.
- Support: buffs, then Auto.
- Stand fast: Hold ×5.
- Charge: Attack.

**Copy** and **Paste to all casters here** are visible buttons. They make Dominions' `Ctrl+digit`
copy visible (D §1.5 [V]); Ctrl+digit itself is a browser key and is never bound.

### 2.9 Bottom strip: the commander's orders

The strip appears only while own commanders are selected (128 px wide layout, 120 px narrow). It
holds their **standing orders**. This is HoI4's bottom-center army panel with its unit cards
(P §9 [X]).

```
+----------+--------------------------------------+-----------------+-------------------------------+----------+
| portrait | squad cards (72x96, scroll if > 8)   | script summary  | order bar                     | ETA box  |
| name     | [sprite x18][sprite x10][...]        | Fb Fb Fb Hd Hd  | Idle Guard Pillage Research   | Ashfen   |
| HP  mor  | count, HP bar, morale bar, row glyph | -> repeats 5    | Preach Claim Cast> Prophet    | 4 days   |
| pips     | status icons (max 3 + n)             | (click: Battle  | Reverse Storm                 | Y1 M4 D2 |
|          |                                      |  Plan)          |                               |          |
+----------+--------------------------------------+-----------------+-------------------------------+----------+
```

- **Portrait:** click (or `Enter`) opens the Commander panel.
- **Squad cards** use `UnitCard`, variant `squad`. Each card has two bars: HP %, and morale in a
  separate hue *and* pattern.
- **Script summary:** five glyphs (spell symbol in its color, blades, shield, arrow) plus the
  repeat marker. A slot with a problem gets a ! corner badge. A click opens the Battle Plan sheet.
  So the summary is L0 and the editor is L3 (D §1.5).
- **Order bar:** one icon button per order. Hovering a button gives its effect per day *here*,
  for example "Pillage: +12 gold/day, −2% population/day, +5 unrest/day" (`provinceEconomy`'s
  `pillage` result). An order that cannot be given is disabled with the validator's reason.
  - **Idle**, **Guard** (the sim's `patrol` order: "holds here on purpose; leaves the idle alert
    and the N cycle; no economic effect in M1", docs/01), **Pillage**, **Research**, **Preach**,
    **Claim Wellspring**, **Cast ▸** (navigation: opens the Rituals tab), **Make Prophet**,
    **Reverse**, **Storm** (only for a besieger).
  - Contextual orders that do not apply are hidden rather than greyed. Claim appears only in a
    Wellspring province, Storm only during a siege, Research only with pips. These are the only
    hidden actions, and each one appears wherever it applies.
- **ETA box:** destination, days, arrival date. In transit: "Reverse (V)".
- **Several commanders selected:** one compact card per commander, the shared orders, and the
  slowest ETA. An order is enabled when it is valid for at least one commander, and its tooltip
  lists who it applies to. A group move takes the slowest speed (docs/01).

### 2.10 The map

#### 2.10.1 Draw order

From bottom to top:
1. Parchment background
2. Province fills (terrain, or the active mode's fill)
3. Noise texture at 10%
4. 2 px borders
5. Ownership bands with keylines (docs/09)
6. Mode overlays (hatching, hop outline in ritual targeting)
7. Labels (name line, then the dominion and problem line)
8. Numbers-layer chips
9. Path previews
10. Army badges
11. Transit arrows and ETA labels
12. Selection rings
13. Battle markers

The province tooltip and the cursor label are DOM overlays, positioned from Pixi coordinates by
one `Tip` system (section 5.1).

#### 2.10.2 Map modes (F1 to F6 in docs/07)

A mode **tints fills only**: about 70% opacity over a desaturated terrain fill. Borders, bands,
badges, labels and Wellspring glyphs stay at full contrast. Civ VII players complained that its
settler lens "masks the game map way too much" (X §4 [X]).

| Mode | Keys | Fill | Second channel (never hue alone) | Legend |
|---|---|---|---|---|
| Ownership (default) | Shift+1 / F1 | terrain; banners carry ownership | ownership bands, nation emblem on the band corner | banners with names |
| Dominion | Shift+2 / F2 | dominating nation's banner, 4 intensity steps by strength | the dominion chip's number | strength 0 to 10 |
| Supply | Shift+3 / F3 | three steps: fed, tight (used above 80%), starving (used above available) | wheat glyph: full, half, crossed; hatching on starving | three glyphs with labels |
| Unrest | Shift+4 / F4 | four steps: 0 to 24, 25 to 49, 50 to 74, 75+ | hatch density grows per step; fist glyph from 25 | four swatches with hatch |
| Population | Shift+5 / F5 | five log-scale steps | the numbers layer shows population | five swatches with ranges |
| Mana springs | Shift+6 / F6 | provinces with springs lit, others dimmed | spring symbols by color; `+n` dominion tint chip | the five symbols |

- **Mode column** at the bottom right of the map (section 2.1): six icon buttons labeled with
  their keys, the active one highlighted, a **legend chip** above it, and a seventh button **#**
  for the numbers layer (key `` ` ``). CK3 puts its map-mode menu in a corner (P §7 [X]). `M`
  cycles forward and `Shift+M` back. The province tooltip **leads with the active mode's
  value**, so the mode and the tooltip agree (X §4).
- **Keys:** Shift+1 to Shift+6 (physical digit keys) are primary because browsers reserve some
  F-keys: F1 is help, F5 reloads, F6 focuses the address bar, and `preventDefault` on them is
  unreliable (U §6). F1 to F6 are kept as a best-effort extra while the canvas has focus.
- **The numbers layer** (`` ` ``, or the # button) puts one chip per province with the active
  mode's value: population in Ownership and Population modes, `140/212` in Supply, the unrest
  value in Unrest, the strength in Dominion, the mana per month in Mana springs. It is a toggle,
  like Dominions' capsule overlay (`Ctrl+4`), which puts income, resources and dominion on every
  province (D §1.1 [V]). Holding Shift alone shows it while held, but only when nothing is
  selected (section 5.4).
- **Contextual modes** are transient and revert when the action ends (Civ VI's placement lens,
  Vic3's lenses; X §4, P §7). Each is driven by its action, not by a button:
  - **Move targeting**, while a selection exists and a province is hovered: reachable provinces
    stay lit; unreachable ones (the path would cross a hostile province) get a 45° hatch.
  - **Ritual targeting** (section 3.5): the provinces within the ritual's reach are outlined with
    one thick contour around the whole set, and everything else dims. Reach is counted in hops
    over adjacency (`withinHops`), as docs/02 and the sim count it, so no Euclidean ring is drawn.
    A chip at the caster reads "Reach: 3 provinces". Inside the reach, valid targets are lit with
    their predicted effect as a label, and invalid ones are hatched. There is no "best target"
    highlight (Civ VII removed exactly that; X §4 [X]).
  - Switching to Dominion mode when a priest is selected is not automatic. Civ VI players asked
    how to stop automatic lenses (X §4 [X]).
- **No information is zoom-gated** (CK3 DD #25, P §7 [X]). Every mode works at every zoom. Labels
  thin out, but anything hidden at one zoom is still one hover or one key away.

#### 2.10.3 Labels by zoom, and the density budget

Zoom bands are defined by the median province's on-screen diameter, so they mean the same thing on
every map size. At game start the camera fits the whole map. On a Medium map at 1280x720 that is
about 110 px per province, which is the Mid band.

| Band | Median province diameter | Province label | Dominion | Army badges |
|---|---|---|---|---|
| **Far** | under 70 px | name only, small caps. On overlap, priority goes to capitals, Wellsprings, own provinces, then the rest | none on the label; Dominion mode shows it | one badge per nation per province: total troops and a `×n` commanders count |
| **Mid** (default) | 70 to 180 px | **line 1:** Wellspring glyph (if any) and the name; **line 2 (only if any):** dominion chip, then at most 2 problem glyphs (unrest fist, siege ram) | compact chip: candle glyph and strength in the banner color | one stack per nation, fanning out on hover (docs/07) |
| **Near** | over 180 px | adds the population bar, building icons (fort, temple, lab), spring symbols, ritual-effect glyphs | full candle stack and number | always fanned |
| **Numbers layer** (`` ` `` toggle, or Shift held alone with nothing selected) | any | adds one chip with the active mode's value | — | unchanged |

**Density budget at Mid:**
- A label is at most 2 lines and at most 96 × 30 px. Names longer than 96 px elide with "…" and
  show in full on hover.
- An army stack badge sits at the province's badge anchor, offset from the label, and never
  overlaps it.
- Population, buildings and springs are not on Mid labels. They are in the hover tooltip, at Near
  zoom, and in the matching map mode, so nothing is zoom-only. CK3 keeps every map mode's
  information at every zoom (DD #25, P §7 [X]).
- A pure function, `layoutMapLabels`, places the labels. A test runs it on Medium seeds 1 to 5 at
  the fit zoom on a 1280x720 view and checks two things. First, no two visible label boxes
  overlap, and no label overlaps a badge. Second, at least 90% of provinces keep a visible name,
  with culling taking the lowest priority first (section 9.4).

#### 2.10.4 Army badges and stacks

- **Shape by allegiance**, so it does not rely on banner hue: rounded shield for own, notched
  shield for other nations, plain shield for Independents (docs/09 icon inventory, U §5).
- The badge holds the troop count and **at most one status corner glyph, and only by exception**,
  chosen by priority: starving (crossed wheat), tight supply (half wheat), unpaid (crossed coin),
  besieging (ram), casting a ritual (ring in the spell's color and its symbol), pillaging
  (torch). A fed, paid, moving or guarding army shows no glyph. CK3 shows attrition as a skull on
  the army banner (P §9 [X]).
- **Stacks:** one badge per nation in a province, with a small `×3` count of commanders.
  - Hover fans the stack out into per-commander badges.
  - A click on the stack selects every own commander in it as one army.
  - A click on a fanned badge selects that commander. Shift+click adds it to the selection.
  - A double-click on a badge selects and opens the Commander panel.
  - **Shift+LMB drag** box-selects own badges. A plain drag pans the map. Dominions 6 added drag
    selection and players praised it (D §1.4).
- **Selected** badges get a bright ring, and their path shows as a solid line.
- **Moving armies** slide along the edge with an arrow and a `4d` ETA label (docs/07). This shows
  for own armies and for **visible enemy armies** (their current leg only), which telegraphs the
  threat the way Into the Breach does (U §2 [X]). Enemy paths beyond the current leg are never
  shown, so fog never leaks.
- **Battle markers:** a crossed-blades glyph sits on a province for `UI.battleMarkerDays` (30)
  days after a battle the player took part in. Clicking it opens that battle's report card
  (section 4.2).

#### 2.10.5 Moving: previews, ETA, right-click orders, multi-province paths

- With commanders selected, **hovering a province** previews the move.
  - A dashed path runs along the province centers, with a dot per province labeled with
    cumulative days.
  - The path comes from `findPathFor`, so the preview always matches what move validation
    accepts (PROGRESS: "The UI and AI should use findPathFor").
- The **cursor label** (DOM, next to the cursor, never over the target; Civ VII's tooltip
  covered the tile, X §1 [X]) prints the decision data (principle 2):

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
- **Shift+right-click appends a waypoint** (StarCraft II and Total War queue with Shift; U §6
  [X]).
  - Each waypoint adds a `findPathFor` leg from the previous one, joined into one `move` path.
  - Only the last province may be hostile, so the cursor label refuses a hostile waypoint, with
    its reason, before the click.
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
- springs and the dominion holder, with the effective scales as five mini bars
- buildings and active effects
- defenders: the fogged word, or exact numbers where scouted

Shift expands every number into its breakdown. The name label appears instantly. The full card
waits for the delay (U §3.1).

**With commanders selected and a hostile province hovered**, the cursor label grows into a compact
**engagement preview** card. AoW4 shows "exactly who will be involved and what outcome is
expected" on hover (X §7 [X]).
- **Both sides**, as mini unit cards: own forces exactly; enemy forces as visible, or as the fog
  band ("about 16 to 23 troops, unscouted").
- **Modifier chips:** terrain defense; fort and walls (+6 protection while standing, +3 when
  down); province scales (Fury and Lore steps, Dread); the starvation and unpaid morale
  penalties; Rootwall.
- **Strength bar** labeled "Estimate", computed by `armyPower` (docs/08's formula, moved into the
  sim, section 7.2). It is the same number the AI uses.
  - Under fog the bar shows a range across the strength band.
  - **The resolver is not run for this in M1.** Forecasts that miss destroy trust (Total War,
    Songs of Conquest; D §4 [X]). Running the resolver on true enemy strength would also leak fog.
  - [Later] A trial forecast that runs `resolveBattle` about 20 times in a Web Worker, on a setup
    built only from what the player can see and with seeds the UI owns (never `state.rng`). It
    would show "Likely victory (17 of 20) · your losses 3 to 7", with ranges only.
- **Script check:** each own caster's first two slots, with a ✓ or an amber ✗ and the reason.
- Footer: `Right-click attack · Edit battle plan ▸`.

#### 2.10.7 Fog

- **Unexplored provinces:** terrain silhouettes under a parchment haze, with a dotted border. The
  map reads before it is scouted (AoW4's mist, X §4 [X]).
- **Explored but not in sight:** a desaturated fill and a dotted border. Army badges show only
  where the nation sees.
- **Fogged values** read as "unknown" (population, springs) or as the strength word (independents;
  docs/01 §14). A fogged value is never shown as zero.

---

## 3. The other screens

Each screen below has a layout and a table of where each detail lives. The layers are those of
section 1. Full screens (Main Menu, New Game, Pretender Design, Victory) replace the game screen.
Modals (Research, Ledger, Codex, Settings, Game Menu, replay) sit over it, one at a time, and pause
the game (section 2.4).

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
|                  background: static parchment, dimmed            |
+------------------------------------------------------------------+
```

| Detail | Layer |
|---|---|
| Continue target (nation, date, size, slot) | L0 on the button |
| Codex | L4. It is reachable before a match, so a player can read about colors and units first |
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

The signature pre-game decision. It should feel like building an MTG commander (docs/05). Fluid
Magic keeps Dominions' point economy and modernizes its controls. Dominions uses left-click to buy
and right-click to sell, and reports an invalid bless only at game start (D §1.6 [V for the manual
controls]).

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

Every number in this mockup is illustrative. The screen prints only what `designCost`,
`pipStepCost`, `scaleStepCost`, `designBudget` and `basePips` return, and no price is written
into the UI code.

- **Steppers print their prices.** A pip row reads `[−] ●●●●○○ [+35]`.
  - The plus button shows the next step's price (`pipStepCost`). A first pip outside the nation's
    identity reads "+n new color".
  - Base pips from the chassis carry a lock glyph. The minus button disables at the base, and its
    tooltip says why.
  - The dominion stepper prints its per-candle price and disables at the chassis base.
- **Scales** are five two-pole sliders from −3 to +3.
  - The pole names and mana symbols sit at the ends. The ticks print step prices from
    `scaleStepCost`.
  - A step against the nation's colors carries a warning glyph (docs/05: warn but allow).
  - Hovering a tick lists that step's effects, from the content scale table.
  - Under each slider, a one-line summary of the current setting: "Turmoil 2: recruit time −20%,
    unrest +4/month".
- **Live consequences, never at game start:**
  - The bless line appears the moment a color reaches 4, and doubles at 6 (docs/02 §8).
  - The dominion estimate "about N provinces by Year 2" (`score × 1.5`, docs/05) updates with the
    candles.
  - The awakening options show their arrival dates, computed from content: Awake on day 1,
    Dormant on day 330 (Y1 M12 D1), Imprisoned on day 1050 (Y3 M12 D1).
- **Validation is inline and uses one source.** Each control validates the design its click would
  produce with `validatePretender`. If that returns a reason, the control is disabled and its
  tooltip shows the reason. Invalid states therefore cannot be reached.
  - Start Game with unspent points confirms inline: "38 points unspent are lost. Start anyway?"
    This is one of the few confirmations (section 5.7).
- **Presets** fill the whole design in one click. Each preset's tooltip shows its summary card
  reading and its cost from `designCost`. Presets are the easy start (docs/05).
- **Save design and Load design are visible buttons.** Ctrl+S on this screen is only an
  accelerator. In Dominions 6 they became hotkey-only, and a new player could not find them
  (D §1.6 [X]).
- **Chassis cards:** the hover card shows the full body stats (L1). A click selects. The two
  chassis that fit the nation get a "fits Thornwood" badge (docs/05). The Great Wyrm card reads
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
| Arrival date | L0 on the awakening option and the summary card |
| The reading | L0 on the summary card |
| Why a control is disabled | L1 reason from `validatePretender` |

The summary card is one component, `PretenderCard`. It appears again in the top bar's nation
tooltip, in the Ledger's Nations tab, and on the victory screen.

### 3.4 Research [M1] (modal, key R)

Five tracks, one per color, levels 1 to 6. That is simpler than any tech tree, because there are no
connector lines to draw (X §8).

```
+-----------------------------------------------------------------------------------------+
| Research   38 RP/month · 4 mages in 2 labs                                     [x Esc] |
+-----------------+-----------------+-----------------+-----------------+-----------------+
| W Radiance      | U Tide          | B Umbra         | R Ember  ACTIVE | G Loam          |
| L0  0/60        | L0  0/60        | L0  0/60        | L3 210/300 47d  | L1  80/150      |
| [Research this] | [Research this] | [Research this] | (outlined)      | [Research this] |
|  (disabled: no  |  (disabled)     |  (disabled)     |                 |                 |
|   M1 spells)    |                 |                 |                 |                 |
+-----------------+-----------------+-----------------+-----------------+-----------------+
| L1 Spells arrive| L1 Spells arrive| L1 Spells arrive| L1 Ember Dart   | L1 Thorn Spray  |
|    in M2        |    in M2        |    in M2        |    Call Fire Sp.| ...             |
| ...             |                 |                 | L4 Bind Salam.  |                 |
|                 |                 |                 |   "Castable by  |                 |
|                 |                 |                 |    1 of yours"  |                 |
+-----------------+-----------------+-----------------+-----------------+-----------------+
| Thresholds 60 · 150 · 300 · 500 · 750 · 1050. Points past level 6 are lost.            |
+-----------------------------------------------------------------------------------------+
```

- **Column header:** symbol and element name; current level; a progress bar to the next level with
  points; days at the current rate when active. The active column is outlined in its mana primary
  *and* labeled "ACTIVE" (hue plus word). Clicking the header or **Research this** issues
  `setResearchColor` (docs/07).
- **Level rows** hold **spell cards** (section 6). Each card shows its kind (Battle or Ritual),
  its requirement as symbols, a one-line effect, and its cost (fatigue, or mana and days).
  - Each card also says **"Castable by N of your mages"**, or "No mage has RR". Research and mage
    recruitment are then planned together (X §8).
  - Researched levels are drawn in full, the next level is highlighted, and later ones are dim.
- **W, U and B in M1:** their levels read "Spells arrive in M2" (docs/02 decision). Their
  **Research this** button is disabled with the reason: "No Radiance spells exist in M1. Points
  would buy nothing." If the active color is already one of them (from an old save), the column
  carries a ! badge and the "No research" alert fires (section 2.5).
- The **header's RP figure** has a breakdown on hover: each researching mage as a link, its pips
  and lab, the Lore factor, and its RP per month (`researchRate` with a trace). Dominions hides
  this behind the F5 screen's bars (D §1.7).
- **No researchers:** the header shows an Important badge and the link "Order a mage to research
  ▸", which opens the outliner's Mages section.
- [Later] A queue of colors (research R to 4, then G to 2). Dominions 6 players praise its queue
  (D §1.7 [X]). It needs a sim change, so it is recorded in section 9.

| Detail | Layer |
|---|---|
| Active color, level, days to next | L0 top bar; L0 column header |
| RP sources | L1 header breakdown |
| What a level unlocks | L0 spell cards in the row |
| Full spell effect, cost for a given caster | L1 card hover (capped height) |
| Who can cast it | L0 line on the card; L1 lists the mages as links |
| Spell reference | L4 Codex (Ctrl+click, `I`, or the card's context menu) |

### 3.5 Rituals [M1] (the Commander panel's Rituals tab, key C)

docs/07 calls this a modal with a map target picker. A modal over the map contradicts picking on
the map, so the ritual list is docked and targeting happens on the map (U §10).

```
Left dock, Rituals tab                         Map, in targeting mode (game paused)
+------------------------------------+         +--------------------------------------------+
| Varo the Ember  R2 · in lab: yes   |         |  reach outlined (3 hops), the rest dimmed  |
| [R][G]  [Summon][Province][Remote] |         |  valid provinces lit, each labeled:        |
| > Call Fire Sprites  R   {R}{R} 5d |         |   "Supply 140 -> 280 for 6 mo"             |
|   Forge of Cinders   RR  {R}x3+1   |         |  invalid provinces hatched                 |
|   Burn the Fields    RR  {R}x4+2   |         |  cursor label on a valid province:         |
|   ...  [Show locked (2)]           |         |   Burn the Fields -> Ember Ford            |
| Pay: R R R R + (R)(G)   [Edit]     |         |   R4 + 2 (R,G) · 10 days                   |
| Pool after: R 6 · G 2              |         |   Pool after: R 6 · G 2                    |
| Pick a target on the map (Esc)     |         |   Click to cast. Mana is spent now; another|
+------------------------------------+         |   order, a retreat or death loses it.      |
                                               +--------------------------------------------+
```

- **Caster line:** pips, whether it stands in an own lab, its current order. Outside a lab a
  banner reads "Rituals are cast in a lab province you own. Nearest: Kharnath, 6 days ▸", and
  the link previews that move.
- **Filter chips:** color symbols and effect groups (Summon / Province / Remote / Utility). The
  AoW4 spell book was criticized as one long unsortable list (X §9 [X]).
- **Rows:** name, requirement, cost as MTG-style symbols (colored pips first, then a grey generic
  circle with the number), days, reach ("own province", "within 3", "owned within 2"), and a
  one-line effect. Locked rituals sit under "Show locked", each with its reason (`castBlocker`).
- **Payment (before targeting):** the colored part is fixed. The generic part shows the default
  split (the spell's color first, then the largest other pools; `ritualPayment`). **Edit** opens
  a stepper per color, constrained to the pool. "Pool after" updates live. The edited split is
  used for the next cast.
- **Targeting:** clicking a row that takes a target **enters targeting mode and pauses the game**.
  Committing or cancelling restores the speed (section 2.4).
  - The reach is drawn as a hop outline (section 2.10.2), never a ring.
  - Valid targets come from `ritualTargets`, so the map offers exactly what the command accepts.
  - Each valid province is labeled with its **predicted effect** from `predictRitual`, for
    example "−6% pop (−430)" or "Supply 140 → 280 for 6 months".
  - A province that already holds this spell's effect is hatched, and its tooltip says why:
    "Cannot stack: Fertile Season until M9".
  - **A click on a valid province commits the cast** with the shown payment. The cursor label
    prints the commit text, so no separate confirmation is needed. Esc or a right-click cancels.
- **Self-targeted rituals** (cast on the caster's own province) skip targeting. The row then
  shows a **Cast** action button with cost and days, and the click on it commits.
- **In progress:** a progress bar with days left. **Stop** sets the order to Idle and confirms
  inline that the mana is lost (section 5.7).

| Detail | Layer |
|---|---|
| Castable rituals for this caster, cost, days, reach | L0 rows |
| Full effect, primitives in words | L1 row hover; L4 Codex |
| Why one is locked | L1 reason (`castBlocker`) |
| Valid targets and predicted effect | L0 map labels in targeting mode; L1 province tooltip with full numbers |
| Payment split, pool after | L0 payment row; edited at L3 before targeting |

### 3.6 Ledger [M1] (modal, key L)

One sortable, filterable screen answers "show me all X" (EU4's Ledger, P §8 [X]; Dominions' F1
Nation Overview, with the search and filters its reviewers asked for, D §1.11). It is also a
control surface: inline PD purchase and tax, as Dominions' F1 lets you buy PD (D §1.11 [V]).

| Tab | Columns | Filters | Inline actions |
|---|---|---|---|
| **Provinces** | name, terrain, pop, growth, gold, materials, supply used / available, unrest with rate, dominion (banner, strength), PD, buildings, springs; for fort provinces: materials pool / cap, months to cap, queue head and length, siege | own / visible / all; starving; unrest > 30; no temple; besieged; enemy dominion; forts | tax selector, PD +1, Jump to Recruit tab |
| **Commanders** | name, type, role, location, order, troops / leadership, HP, morale, supply state, script state, upkeep | idle; starving; script problem; mages; priests; scouts | Jump, Select |
| **Magic** | mana per color (stock, income, sources per spring); rituals in progress; **active effects** (own and visible enemy): spell, province, owner, days left | own / enemy; by color | Jump |
| **Battles** | date, province, outcome band, sides, losses on each side | won / lost | **Watch** (only while the record is kept), Report |
| **Nations** | own nation: `PretenderCard`, national scales, bless, Godless state; every known nation: provinces held, Wellsprings claimed, eliminated (public facts only, no fog leak) | — | Jump to capital |

- Clicking a column header sorts by it. Rows jump to the map. A search box filters by name.
- Clicking a top-bar readout opens the Ledger on the matching tab, already sorted (section 2.3).
- M1 builds no new forts, so each nation's only fort is its capital (docs/10). Fort data is
  therefore a set of columns in Provinces, not a tab of its own.
- The Magic tab's active-effects list is the analog of Dominions' F6 Global Enchantments
  (D §1.8 [V]).
- The Battles tab reads the kept `BattleSummary` list (section 4.1), so it lists every battle the
  player fought, not only the last 20.

### 3.6b Court [Phase 9b] (modal, key K)

The officer screen of `three-kingdoms.md` (sections 3.1, 3.2, 3.4, 3.7). It answers "show me every
named person" the way the Ledger answers "show me all X", and it is a control surface for the
three officer commands that are not orders: `assignPost`, the prisoner actions and, through the
rows' context menu, `govern`. It is deliberately three tabs, because RTK XIII's officer list drew
the "phonebook" complaint (`three-kingdoms.md` section 1) and principle 1 forbids a list the
player scrolls to find a person: the Officers tab sorts by any stat and the search box filters by
name and trait.

| Tab | Columns | Filters | Inline actions |
|---|---|---|---|
| **Officers** | portrait (40 px), name, type, rank, the five stats as 3 px bars with the nation's median marked, trait chips, bond chips, post, order, location; a header strip with the god's Ascendancy, its next threshold and the field cap as `armies in the field 4 / 5` | field; governing; in a post; wounded; by trait; by stat line above median | Select on the map, Jump, Govern here (fort provinces), Assign to post |
| **Posts** | three cards, Marshal, Chancellor, Hierophant: threshold, holder at 96 px, stipend, the effect at the holder's stat (`+14% gold at Stewardship 14`), the best three candidates at 48 px by the stat the post scales with | — | Assign, Clear; a locked card names the Ascendancy it needs |
| **Prisoners** | held by us: the Prisoner taken rows (portrait, name, rank, stats, days held, offers refused); held by others: own officers with the holder and the ransom asked | by holder; by rank | Recruit (odds shown), Ransom (price shown), Release; Pay ransom |

Where each detail lives:

| Detail | Layer |
|---|---|
| Stat values and the median mark | L0 on the row (bars); the number on hover |
| What a stat drives (Command: troops led and morale; Presence: checks, unrest, recruiting) | L1 tooltip with the breakdown, from `officerStats` |
| A trait's rule | L1 chip tooltip; L4 Codex page |
| A bond's origin ("comrades since the battle of Kharsk Ford") | L1 chip tooltip |
| Capture odds and the ransom formula | L1 on the button, from `captureOdds` and `ransomPrice` |
| Why a post is locked, why the cap binds | L1 on the header strip, from `fieldCap` and `postEffect` |
| Ascendancy's formula | L2 concept |
| Loyalty | nowhere in Phase 9b: loyalty states are Tier 2 and the column is added only after the playtest |

- Rows at 40 px keep a nation of 30 officers on one screen at 1280x720 (`docs/09-art-direction.md`,
  "The Court modal and officer marks"). The pretender has a row but no stats and is never a post
  candidate; the prophet is a candidate for Hierophant only (owner decision 2).
- The modal opens from key K, from the top bar's new officers readout (count of named officers,
  with the Ascendancy as its breakdown), from a Prisoner taken alert's "all prisoners" link, and
  from a Commander panel's post or prisoner row.
- Depth audit: the deepest real path is map → K → Prisoners → Recruit → confirmation (4), inside
  principle 1's limit.
- Esc closes it as one layer. It is a Ledger sibling: `LedgerTable<T>` renders the Officers and
  Prisoners tabs; only the Posts tab is a new layout.

### 3.7 Messages and their settings [M1]

The feed is in section 2.7 and the per-type matrix in section 5.3. Settings → Messages holds the
matrix, and every feed row's gear opens its type's row in place.

### 3.8 Victory and Defeat [M1]

```
+-------------------------------------------------------------------------------+
|  VICTORY · Y3 M2 D18 · Thornwood claims 2 of 3 Wellsprings                    |
|  [PretenderCard]       Nation      Prov  Pop    Won/Lost Taken Wells  Mana spent W U B R G |
|                        Thornwood   24    212k   11/3     17    2      .  .  .  4  96 |
|                        Cinder H.   9     71k    4/9      6     0      .  .  .  58 .  |
|  Your battles: [Ashfen M4 Won  Report] [Ember Ford M9 Lost  Watch] ...        |
|  [View map]                          [New game]          [Return to menu]    |
+-------------------------------------------------------------------------------+
         (the final map stays drawn behind, dimmed; View map hides this panel)
```

- **Result and reason:** Wellsprings, last capital, or player defeated (`GameResult`). The stats
  come from `nationSummary`: provinces held, population, battles won and lost, provinces taken,
  Wellsprings, mana spent per color drawn as symbol bars (docs/07).
- **View map** hides the panel. The map stays inspectable read-only: tooltips and map modes work,
  orders do not. "Back to results" returns.
- **Your battles** lists every kept `BattleSummary`. Each entry opens its report card. Watch is
  offered only while the record is kept.

| Detail | Layer |
|---|---|
| Result, reason, date, headline stats | L0 |
| Per-color mana spent numbers | L1 on the bars |
| Battles | L0 list; report card; replay at L4 while kept |

### 3.9 Settings [M1] (modal; from the Main Menu and the Game Menu)

Six tabs. Every setting has a one-line explanation on hover. UI settings live in local storage and
in the save file's UI block, never in `GameState`.

| Tab | Settings |
|---|---|
| **Game** | Speed presets: days per second per speed, defaults 1/2/4/8 (docs/01). Pause when a modal opens (on). Resume after closing an auto-pause popup (off). Autosave every 30 game days (on, docs/06). Confirmations: reset "Don't ask again" |
| **Messages** | The per-type matrix (section 5.3). Muted alert types with Restore |
| **Interface** | UI scale 80 to 200%. Text size 90 to 150%. Tooltip delay 0 to 1500 ms, or Off. Detail key: Hold Shift / Toggle with Shift. Guidance: Guide me / Hints only / Off; Reset hints |
| **Accessibility** | Reduced motion (follows the OS). Screen shake 0 to 100% (50%). Gore (Off / Reduced / Full). Captions (Off / Events / Events + sounds). Pattern overlays in map modes (off). High-contrast borders (off). Letters on mana symbols (off). Flash limit (always on, shown as information) |
| **Audio** | Master volume. Battle SFX volume. Fluid Magic has no music or UI sounds in M1. The owner's direction adds battle SFX, which the battle presentation plays |
| **Controls** | A read-only table of every action and its key, by context (map, panel, replay), generated from the binding table. It is the same data as the `?` overlay and the Codex Keys page |

### 3.10 Game Menu, Save and Load [M1]

`Esc`, when nothing else is open, or the top bar's menu button opens the Game Menu: Resume, Save,
Load, Settings, Codex, Quit to Menu.

- **Save** shows three slot cards (nation, game date, real date) plus the read-only autosave card.
  Overwriting confirms inline. Ctrl+S saves to the last used slot and shows a toast "Saved to
  slot 2" (docs/06: 3 slots plus autosave).
- **Load** uses the same cards. Loading over a game with unsaved play confirms inline.
- **Quit to Menu** with unsaved play confirms inline. A `beforeunload` prompt guards the tab while
  there is play since the last save (U §6).

---

## 4. Battle reports and the replay frame

The battle presentation (per-blow detail, gore, sound) is designed separately. This section gives
it a frame. The frame does four things:
- The replay follows the same rules, components and keys as the rest of the UI.
- The stage gets most of the screen with minimal chrome.
- Every panel can collapse.
- The stage owns time, so the presentation can pace each blow to its sound.

### 4.1 How a battle reaches the player [M1]

Battles resolve inside the tick (docs/01 §10). The player meets one in two steps: a **report card**
first, then the optional **replay**. Dominions does the same: the summary with casualty lists
first, then "View battle" (D §1.10 [V]). Most battles should be readable in five seconds without
watching anything.

| Entry point | Opens |
|---|---|
| Auto-pause popup (major battles, section 5.3); several on one day are queued | report card, centered |
| Toast for a minor battle | its **Watch** button goes to the replay; a click on the toast opens the report card |
| Feed row | report card. The row's **Watch** button goes straight to the replay |
| Battle marker on the map (`UI.battleMarkerDays`) | report card |
| Ledger, Battles tab; province History tab; Victory screen | report card, or Watch while kept |
| Report card's **Watch replay** (Enter) | replay modal |

**Retention.**
- Records exist only for battles a player fought (docs/06), and the sim keeps the newest
  `BATTLE.keep` (20).
- When a record first appears, the UI stores its `BattleSummary` (from `summarizeBattle`, section
  7.2) in the save file's UI block. The summary is a few hundred bytes. The summaries are capped
  at `MESSAGES.keep`, so they outlive any feed row.
- Once the record is evicted, the report card renders from the summary, and **Watch** is disabled
  with "Replay not kept (only the last 20 battles are)". The number is read from `BATTLE.keep`.
- With neither a record nor a summary (a save from before this change), the row shows "Report no
  longer kept", the docs/06 fallback.
- Battles between AI nations show in the feed when visible, with no report and no Watch.

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
| (queued popups: [Next (2 more)])                                        |
+-------------------------------------------------------------------------+
```

- **Outcome band:** Decisive, Clear, Narrow or Pyrrhic victory; Narrow, Clear or Crushing defeat.
  `summarizeBattle` computes it from survivor ratios. The thresholds are content (`BATTLE_REPORT`
  in `src/content/rules.ts`). Total War names its outcomes the same way, for example "Pyrrhic
  victory" or "Close defeat" (D §4.1 [X]).
- **Unit cards, report variant:** start → end, and losses split into **killed** and **routed**.
  CK3 splits fatal from routed casualties (P §10 [X]).
- **Commanders' fates**, spells cast with counts, and how the battle ended (rout, wipe-out,
  round-50 retreat).
- **"Why" bullets**, at most three, from `summarizeBattle`'s key moments: first rout, commander
  deaths, the most damaging spell, the round-50 retreat, starvation or unpaid morale. Dominions
  logs leave out modifiers, and players have to reconstruct them (D §1.10 [X]).
- **Conditions:** the same chips as the replay header (section 4.3).
- **After:** the consequences the sim applied: capture, retreat destination, population and unrest
  changes (docs/01 Phase 4 rules).
- The card renders entirely from a `BattleSummary`. The record is needed only for Watch.

| Detail | Layer |
|---|---|
| Result, sides, counts, fates | L0 on the card |
| Unit stats, a modifier's numbers | L1 hover on cards and chips |
| What happened, round by round | L4 replay |
| Every roll and modifier | replay log, detail level 4 |

### 4.3 The replay modal

The replay is a full-window modal. Its skeleton reuses the game screen's: a header where the top
bar was, rosters where the docks were, and transport where the bottom strip was. It is the same
game in a different mode (D §5, P §10).

```
+--------------------------------------------------------------------------------------------+
| Battle of Ashfen · Forest · Y2 M4 D11 · Round 7/23 · MELEE                                 |
| [Forest: defenders +1 def] [Thornwood: +1 def in forest] [Loam bless: sacred]  [Cmdrs] [<] [>] [cc] [gear] [x] |  40px
+-----------+------------------------------------------------------------------+-------------+
| YOU       |                                                                  | LOG         |
| Thornwood |                                                                  | [1][2][3][4]|
| attacker  |                                                                  | R7 Thorn    |
|           |                          STAGE                                   |  Spray ->   |
| Ilwen     |            (BattleStage, owned by the presentation)              |  Militia    |
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
- Wide layout: rosters 240 px each and the log 280 px, all open.
- Narrow layout (below 1600 px): rosters start as 64 px **live rails** and the log is closed. The
  stage is then 1152 px wide at 1280 (90%), or 872 px (68%) with the log open.
- **Cinematic mode** (`H`) gives the stage the whole window (below).

**Header** (40 px; the same chrome tokens as the top bar):
- Battle name, terrain, date, and which side attacked, written as text as well as shown by
  position.
- **Condition chips** for every modifier the setup folded in (docs/04 "Read-only setup" and
  "Modifiers"):
  - terrain defense, Thornwood's forest defense, the swamp attack penalty
  - fort storm (+2 morale, +6 protection while the walls stand, +3 after)
  - province scales by name and step: Fury, Lore, Dread
  - starvation and unpaid-upkeep morale
  - Rootwall and other defense effects
  - the bless on sacred units

  Each chip's tooltip gives its numbers. This is Dominions' F2 "weather and dominion scales"
  panel (D §1.10 [V]), always visible. **Field effects** (storm, fog, wall) appear as chips when
  cast and leave at `fieldEnd`.
- **Round and phase label** (Spells, Ranged, Melee, Morale), from the event stream. CK3 names its
  battle phases the same way (P §10 [X]).
- Buttons: **Commanders** (highlight every commander; hold `C` does the same), roster toggle `[`,
  log toggle `]`, captions, settings (gear), close (×, Esc).

**Rosters.** The player's side is always on the left and is labeled Attacker or Defender. The
enemy is on the right. Dominions fixes the attacker on the left (D §1.10 [V]). In a single-player
game "you are on the left" is the more useful constant, and it matches the left dock. The frame
passes `leftSide` to the stage (section 4.4), so the stage mirrors the record when the player
defended.
- **Commanders:** portrait, HP bar, a fatigue bar for casters with the 100 line marked, and the
  **current script step** with its five slot pips, the current one lit: `R3: Thorn Spray`. HoI4
  shows each general's chosen tactic beside the general (P §10 [X]). States read as a word plus a
  glyph: routing, exhausted, slain.
- **Squads:** `UnitCard`, replay variant:
  - live count over the starting count
  - killed and routed tallies
  - row glyph
  - a morale state glyph (steady, shaken, routing)
  - buff and curse icons, each with a tooltip naming its source and last round

  **Click a squad to focus it**: the stage highlights it, and the log filters to it (Dominions'
  `v`, D §1.10 [V]).
- **Live rail** (collapsed state): banner, a side total bar (living over starting troops),
  commanders' HP pips and a routing count. Hovering expands it as an overlay without resizing the
  stage.

**Stage.** The presentation owns it (section 4.4). The frame guarantees its rectangle and a
one-line **captions strip** along its bottom edge. Screen shake moves the stage canvas only. The
chrome never shakes, so the numbers stay readable.

**Log** (right, collapsible). The right-hand placement is Fluid Magic's choice. Dominions shows
battle messages in the upper-left action box of its battle view (manual, chapter 06; noted by
Judge 1).
- **Detail levels**, set with the `1` to `4` chips in the log header or cycled with `D`:
  1. kills, routs, commander deaths
  2. adds spells, buffs and curses, field effects
  3. adds volley and melee summaries
  4. adds every `damage`, `heal`, `fatigue`, `expire`, `advance` and `leave` event

  Dominions has four log levels (D §1.10 [V]). Level 4 answers the complaint that its logs hide
  modifiers. Fluid Magic's replay events (docs/04) already carry what each level needs.
- **Lines** read: round, icon, actor → target, result. Spell lines carry the mana symbol. Hovering
  a line highlights both units on the stage. Clicking it seeks there.

**Transport** (56 px):
- Buttons: start (`Home`), back one round (`←`), play or pause (`Space`), forward one round
  (`→`), skip to end (`End`).
- Speeds 0.5×, 1×, 2×, 4× (docs/07) on the digit keys 1 to 4 (physical keys). Digits set the
  speed of time on the map and in the replay alike. Each is a multiplier on the stage's own pacing
  (section 4.4).
- **Scrubber**, indexed by event:
  - A position is an event index, and round ticks sit at each `roundStart` event.
  - **Markers** show a spell cast (its mana symbol), a commander death (✕), a rout (flag), the
    round-50 retreat, and the end.
  - Hovering a marker shows its event. Dragging seeks.
  - Seeking sends a seek request to the stage (section 4.4). The stage rebuilds the state at that
    point with `foldReplay`, which is cheap and exact (docs/04), and shows it without animating
    the skipped events.
- The replay never blocks input. Panning and scrubbing stay responsive at every speed. In
  Dominions 5, scrolling lagged at fast replay speed (D §1.10 [X]).

**Cinematic mode** (`H`):
- Hides the header chips, the rosters and the log.
- The transport shrinks to a 6 px progress line. It grows back when the mouse moves, and fades
  after 2 s without movement.
- Captions stay if they are on. `H` or `Esc` restores the chrome.

Cinematic mode is where the visceral presentation gets the whole screen.

**End and close:**
- When the stage reports `onEnd`, playback stops. After 1 s the **report card** slides in over
  the stage center, with Replay again, Go to province and Close. Skip to end shows it at once.
- Close (`Esc` or ×) returns to where the player came from: the report popup, the feed or the
  Ledger. It restores the speed that was active before the replay opened, which is "paused" after
  a battle auto-pause.

**Settings popover** (gear): Gore (Off / Reduced / Full), Screen shake (0 to 100%), Captions (Off /
Events / Events + sounds), Master volume, Battle SFX volume. Reduced motion shows read-only,
because it follows the global setting. These are **the same settings** as Settings →
Accessibility and Audio, stored under the same keys, so changing them here changes them
everywhere.

**Accessibility inside the replay** (binding on the presentation design):
- **Flash limit:** at most 3 flashes per second across the window; no bright flash covers more than
  a quarter of the window; no saturated red full-screen flashes (WCAG 2.3.1; U §11). This limit
  cannot be turned off.
- **Reduced motion:** lunges become short highlights, the rout slide becomes a fade, damage
  numbers fade in place, and shake is 0.
- **Color without hue:** spell particles include their color's glyph (tiny flames for Ember,
  leaves for Loam), so a color-blind viewer can still tell the spell's color (U §12).
- **Captions** stand in for sounds. Every sound that carries information (volley, clash, spell,
  rout, commander death) has a caption chip when captions are set to "Events + sounds" (XAG 103;
  U §11).
- **Keyboard:** Tab and Shift+Tab move focus through the replay's controls and never stop on a
  stage command, so the modal has no focus trap. Every stage action also has a button.

**Replay keys** (the replay context; section 5.4):

| Key | Action |
|---|---|
| Space | play / pause |
| 1 to 4 (digit row) | 0.5× / 1× / 2× / 4× |
| ← / → | back / forward one round |
| Home / End | start / end (end shows the report card) |
| `[` / `]` | rosters / log |
| D | cycle log detail |
| hold C | highlight every commander (Dominions uses Tab, D §1.10 [X]) |
| H | cinematic mode |
| ? | replay key overlay |
| Esc | close the top layer: tooltip, cinematic mode, then the replay |

### 4.4 Contract between the frame and the stage

**The stage is the clock.** It paces each event to its animation and sound, so a heavy blow can
take longer than a miss. The frame owns layout, settings and the player's requests. The stage
reads only the `BattleRecord`, never live state (docs/04: "The viewer needs nothing from live
state"). docs/04's "1 round per 1.5 seconds (adjustable)" becomes the stage's default pace at 1×,
averaged over a round. The presentation owns the exact timing. Owner direction 2026-10-29: the
player sees continuous time only, with pause, play, speed and a time scrubber; the frame's
transport steps by beat, never by round, and the header shows elapsed time, not a round
(`battle-presentation.owner-direction.md`; `docs/07` wins where this record differs).

```ts
interface BattleStageProps {
  record: BattleRecord;                         // roster plus events (docs/04)
  leftSide: 'attacker' | 'defender';            // the player's side; drawn on the left
  playing: boolean;                             // a request; the stage keeps time
  speed: 0.5 | 1 | 2 | 4;                       // multiplier on the stage's own pacing
  seek: { id: number; event: number } | null;   // jump to just after this event index, no animation
  focus: BattleUnitRef | null;                  // a squad clicked in a roster
  highlight: readonly BattleUnitRef[];          // log hover, the Commanders toggle, hold C
  rect: { width: number; height: number };      // changes when panels collapse
  settings: {
    gore: 'off' | 'reduced' | 'full';
    shake: number;                              // 0..1
    reducedMotion: boolean;
    captions: 'off' | 'events' | 'all';
    masterVolume: number;                       // 0..1
    sfxVolume: number;                          // 0..1
  };
  onProgress(event: number): void;              // the last event index shown; drives log, scrubber, rosters
  onSeekDone(id: number): void;                 // acknowledges a seek; the frame clears `seek`
  onEnd(): void;                                // battleEnd has been shown
  onCaption(text: string, kind: 'event' | 'sound'): void;
}
```

- The frame never advances a cursor itself. Its displayed position is the last `onProgress`
  value. A seek is a request with a fresh id. Until `onSeekDone(id)` arrives, the scrubber shows
  the requested position, and progress reports from before the seek are ignored.
- Round stepping (`←`, `→`) is a seek to the previous or next `roundStart` event.
- The rosters' live counts come from `foldReplay(record, event)` at the reported event, so the
  frame and the stage agree without sharing state.

---

## 5. Systems

### 5.1 The tooltip system [M1]

One `Tip` system serves every DOM panel and the Pixi map. On the map, tooltips are DOM overlays
placed from Pixi coordinates.

**Kinds.**
- **Value:** a readout or stat, with a breakdown table.
- **Concept** (L2): a term's meaning, with links.
- **Entity:** the card for a unit, spell, commander or province.
- **Action:** what a click does (`LMB select · RMB move here, 6 days`), plus the validator's reason
  when the action is blocked. EU5 shows mouse-button hints and a "why not" block (P §6 [U]).
  Fluid Magic adopts both on their own merit.

**Anatomy** (from U §3.7):

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
| At this rate: 1,278 in 30 days                  |  projection line
| ----------------------------------------------- |
| Shift more · T lock · Click Ledger > · Ctrl+click Codex |  gesture footer, dim
+-------------------------------------------------+
```

- Multiplicative values show a base row, then each factor as a percentage with the running value
  (U §4). Caps, floors and overflow get rows of their own ("Overflow lost: −14.2"), because a
  hidden clamp is the usual cause of "why isn't this number moving?".
- Rows are sorted by absolute size, biggest first. Old World sorts alphabetically, which buries
  what matters (X §1 [X]).
- Hierarchy: the value is large, the meaning regular, the table small and tabular. Ancient World
  Magazine criticized Old World tooltips where everything has the same visual weight (X §1 [X]).
- One decimal in the tooltip, integers at L0. The tooltip shows the exact total, never a
  "rounding" row.
- Width at most 360 px; body text at least 14 px; height capped at 60% of the window, with
  scrolling inside (Old World Updates #121 and #129; X §1 [X]).

**Timing and behavior.** The numbers live in `src/content/ui.ts` (`UI.tips`).

| Behavior | Value | Source |
|---|---|---|
| Open delay | 400 ms on panels, 500 ms on the map; the map's name label is instant. Setting: 0 to 1500 ms, or Off | U §3.1 |
| Warm state | after a tooltip has shown, another trigger within 300 ms opens with no delay | U §3.1 |
| Close grace | 150 ms, so the pointer can travel into the tooltip (hoverable) | WCAG 1.4.13 |
| Lock | resting 0.8 s on the trigger or tooltip (the border fills like a ring while it counts), or `T`, or a middle-click with less than 4 px of movement (a middle-drag pans) | CK3 timer and action locks (P §6 [X]) |
| After a lock | new root tooltips are suppressed for 1 s | Vic3 player request (P §6 [X]) |
| Nested placement | away from neighboring triggers, so moving into it opens nothing on the way | Vic3 1.2 (P §6 [X]) |
| Depth cap | 3 levels | Ardeljan's critique (P §6 [X]) |
| Esc | closes the whole chain; moving out closes one level at a time | WCAG 1.4.13 |
| Keyboard focus | opens the tooltip too | WCAG 1.4.13 |
| Live data | updates in place while open; never closes and reopens | U §3.2 |

- **Shift means "more".** Holding Shift *alone* over a tooltip expands it: every row, per-day
  figures, the formula terms. "Alone" is defined in section 5.4. The genre uses Alt for this
  (Path of Exile, Baldur's Gate 3, Factorio; U §3.5 [X]), but Alt is unsafe in a browser. With
  the Toggle setting, a lone Shift tap toggles "more" on and off.
- **Never cover the target.** Map tooltips open on the side away from the cursor's target and the
  nearest screen edge. While commanders are selected, the compact cursor label replaces the full
  province card, so a right-click never lands on a tooltip (Civ VII complaint; X §1 [X]).
- **Filter by context.** A commander's tooltip in the script editor shows pips, fatigue and
  carried mana. On the map it shows HP, morale, order and ETA (Old World Update #132; X §1 [X]).
- **Links act.** Entity names in a tooltip are links (Old World Update #16: clicking a character
  name selects the character; X §1 [X]). Concept terms open L2. Ctrl+click on either opens the
  Codex.

**Concepts are content.** `src/content/concepts.ts` holds each concept's `id`, `name`, `summary`
(the L2 text, one or two lines), `body` (the Codex paragraph, with the formula in words where
there is one), `related` ids and `icon`. CK3, Vic3 and Stellaris define concepts as data that
hooks into tooltips and the encyclopedia (P §6, §11 [X]). The M1 set has about 55 concepts:

> Population, Growth, Gold, Upkeep, Tax rate, Materials, Supply, Starvation, Mana, Spring,
> Dominion tint, Unrest, Provincial defense, Fort, Temple, Lab, Garrison, Commander, Squad,
> Leadership, Map speed, Formation, Row, Script, Fatigue, Carried mana, Pip, Holy, Research,
> Ritual, Battle spell, Morale, Rout, DRN, Closing, Siege, Walls, Storm, Dominion, Dominion
> score, Candle, Godless, Scales and each of the five axes, Bless, Sacred, Pretender, Chassis,
> Awakening, Prophet, Wellspring, Claim, Fog, Scout, Stealth, Independents, Pillage, Guard,
> Preach.

Add them to the content validation fixtures (CLAUDE.md), with a test that every concept id
referenced from UI strings and content exists.

### 5.2 The Codex (encyclopedia) [M1]

A modal opened with `F` (find) or the top-bar button. The search box is focused on open, so the key
and typing are one gesture. A popular Civ VI mod did exactly this to the Civilopedia (X §2 [X]).

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
| Chassis        |                                                              |
| Buildings      |  Search results: Ashfen (province) -> Go to                 |
| Terrain        |                  Ash Colossus (chassis)                     |
| Scales         |                  Ash Militia (unit)                         |
| How to play    |                                                              |
| Keys           |                                                              |
+----------------+--------------------------------------------------------------+
```

- **Topics** run down the left (the Civ VI Civilopedia's layout, X §2 [X]). The entry is on the
  right.
- **Search covers the Codex and the game.** Results are grouped: entries first, then provinces and
  own commanders as "Go to" results. So `F` is also the go-to-province key. Dominions jumps to a
  province by number (D §1.1 [V]). Fluid Magic provinces have only names.
- **Pages are generated from the content registry**, so they cannot drift from balance changes.
  CK3 generates its encyclopedia from script, and AoW4's unit tags show in the unit panel and the
  encyclopedia from one source (P §11, X §2 [X]).

  | Page | Content |
  |---|---|
  | Unit | stat block, weapons, tags as concept links, costs, recruit requirements, upkeep, supply, sprite |
  | Spell | requirement, kind, level, cost, effect in words from its primitives, **"Castable by your: …"** (live links), the research level that unlocks it |
  | Chassis | body, base pips, dominion, cost, notes |
  | Building | cost, days, requirements, effects |
  | Terrain | the docs/01 table, from `TERRAIN` |
  | Scale | each axis, each pole's effects per step |
  | Concept | from `concepts.ts`: summary, paragraph (with the formula in words), related |
  | How to play | the Learn steps and hints (Old World put a tutorial section in its encyclopedia; X §2 [X]) |
  | Keys | generated from the binding table |

- **Every page adds something a tooltip lacks:** a sortable comparison table (units, spells), live
  "your" links (Castable by your, Recruitable at), and back-links. Old World's help was criticized
  for repeating its tooltips (U §1 [X]).
- **Ways in:** `F` and the top-bar button; Ctrl+click on any concept or entity; "Open in Codex" in
  a tooltip footer; the ⓘ in panel headers; `I` on a hovered item; "Open in Codex" in an entity's
  context menu. Civ VII players missed right-click-to-Civilopedia (X §2 [X]). Fluid Magic's
  right-click context menu carries the same entry.
- **History:** back and forward buttons, and Backspace when the search box does not have focus.
- [Later] "Try in a test battle" on unit and spell pages. It runs `resolveBattle` with sample
  squads and a UI-seeded RNG, then opens the replay (U §8).

### 5.3 Notifications and message settings [M1]

There are three channels, kept apart as Paradox keeps them (P §3, §4 [X]):
1. **Alerts:** conditions true now. The ribbon (section 2.5).
2. **Messages:** events that happened. The feed (section 2.7).
3. **Display per message type:** Off, Log (feed only), Toast, or Popup, plus a Pause checkbox.

- **Toasts** stack under the pause-reason chip at the right (section 2.1). At most 3 show at once.
  Each stays 6 real seconds, or until hovered. Toasts of one type merge within `UI.mergeDays`
  game days. A click jumps to the subject. × or a right-click closes it.
- **Popups** are reserved for what the player set to pop up. The battle popup is the report card.
  Several popups on one day queue (section 2.4).
- **Message types** are UI-level rows of the matrix. Each type is a sim `MessageKind`, sometimes
  narrowed by a predicate on the message and its battle, so the matrix can treat a major battle
  differently from a minor one without new sim kinds.

**Defaults.** They follow docs/07's auto-pause list and warn before threats arrive (the Pillars
rule, U §7 [X]):

| Message type | Kind (and predicate) | Display | Pause | Note |
|---|---|---|---|---|
| Battle, major | `battle`: you lost, or the enemy was a nation, or your pretender, prophet, capital or a Wellspring was involved | Popup (report card) | yes | docs/07; split flagged for playtest |
| Battle, minor | `battle`: you won against independents | Toast with Watch | no | expansion into independents no longer stops the game at speeds 3 and 4 |
| Province lost | `lost` | Popup | yes | docs/07 |
| Threat | `threatened` (new): a visible enemy leg ends in a province holding your troops, a fort or your capital | Toast | yes | once per incursion per target |
| Incursion | `approaching` (new): visible enemy armies head into your land | Toast | no | once per incursion |
| Wellspring claimed (any nation) | `wellspring` | Popup | yes | the victory race |
| Godless | `godless` (new) | Popup | yes | |
| Pretender arrives or is recalled | `pretender` (new) | Toast | yes | |
| Research level reached | `research` | Toast | yes | docs/07 lists this auto-pause as toggleable. U §7 argues for no pause, keeping pauses for threats. Kept as docs/07 says and flagged for playtest |
| Walls breached | `breached` (new) | Toast | yes | |
| Siege laid or lifted | `siege` (new) | Toast | no | the Fort besieged alert holds the state |
| Province captured | `captured` | Toast | no | |
| Enemy army sighted | `sighted` | Toast | no | |
| Ritual complete or failed | `ritual` | Toast | no | |
| Nation eliminated | `eliminated` (new) | Toast | no | |
| Dominion flipped | `dominion` | Log | no | frequent; the Enemy dominion alert covers the case that matters |
| Starvation | `starvation` | Log | no | the Urgent alert already shows it |
| Recruits complete | `recruited` | Log | no | |
| Building complete | `built` | Log | no | |
| Victory or defeat | `result` | the victory screen | always | |

**Incursions** (the sim rule behind `approaching` and `threatened`, section 7.2 #8):
- An **incursion** of enemy nation E into nation N opens when a visible E commander's current leg
  ends in an N-owned province, or in one where N's army stands. It stays open while any visible E
  commander stands in or is moving into N's land. It closes after `APPROACH.quietDays` (10) days
  with none.
- `approaching` posts once, when the incursion opens.
- `threatened` posts once per target province per incursion, the first time a visible E leg ends
  there while it holds N's troops, a fort, or N's capital.
- Commanders of one nation whose legs reach the same target on the same day share one message:
  "Cinder Horde: 3 armies approach Kharnath, 4 days."
- Example: a 3-commander group marching 4 provinces deep through empty land gives one toast, plus
  one pause if it reaches a province the player defends. The draft's rule gave up to 12 messages.

**Other rules:**
- **Edit in place.** Every toast, popup and feed row has a gear that opens its type's two
  controls (Vic3, EU4, Stellaris; P §4 [X]). Players miss this matrix whenever a game cuts it:
  HoI4 and CK3 players asked for it back (P §4 [X]).
- **Coalescing:** pauses on the same day become one, with the reason chip `Paused: 3 events ▸`
  (section 2.4).
- **No UI sounds in M1.** Battle SFX belong to the battle presentation. Urgent alerts pulse their
  icon instead (section 2.5).
- **Nothing only through notifications.** Every report and screen has a menu path (Ledger,
  History). Humankind's Wonders screen could only be reached from its notification (X §5 [X]).

### 5.4 Keyboard and mouse

Keys are accelerators. Every action also has a visible button whose tooltip shows its key, and `?`
shows the keys of the current screen (Dominions' per-screen `?`, D §1.1 [V]). "Map focus" means
the canvas or the page body has focus, not a text field or a focused panel control.

**How keys are bound.** The binding table (`src/ui/derive/bindings.ts`) stores each binding as one
of two kinds:
- **Physical keys** (`KeyboardEvent.code`): the digit row (`Digit1` to `Digit6`) and the numpad,
  WASD, `+` and `−` (`Equal`, `Minus`, `NumpadAdd`, `NumpadSubtract`), the brackets and Backquote.
  On AZERTY the digit row needs Shift to type a digit. With `code`, speed (`Digit1`) and map mode
  (`Shift+Digit1`) still differ, and WASD stays in the WASD position (ZQSD on AZERTY).
- **Letter mnemonics** (`KeyboardEvent.key`, case-insensitive): R, L, F, O, C, N, J, V, P, I, T,
  H, M, D. The player presses the letter printed on their own keyboard.
- `?` matches `key === '?'` on every layout.
- Key labels in buttons and in the `?` overlay come from `navigator.keyboard.getLayoutMap()` where
  the browser offers it, and from the US label otherwise.

**Shift has four meanings, and only four:**
1. **Hold alone: "more".** Shift counts as *alone* when no other key and no mouse button has been
   pressed since it went down, and no box-select drag, waypoint chain or targeting mode is
   active. After 250 ms alone, the hovered tooltip expands. If nothing is selected, the map's
   numbers layer also shows while Shift is held. With a selection, the layer does not show,
   because Shift+RMB waypoints follow. Releasing Shift, or pressing anything else, ends the
   effect at once. With the Toggle setting, a lone tap toggles "more".
2. **Shift+click or drag: "add or extend".** Shift+LMB adds to the selection. Shift+LMB drag
   box-selects. Shift+RMB appends a waypoint. Shift+click on a recruit card queues the largest
   affordable batch. Shift+click on PD +1 buys 5. Shift+right-click on an alert mutes its type.
3. **Shift+digit: map modes.**
4. **Shift+Tab and Shift+M: reverse cycling.**

The draft's other Shift chords are removed: Shift+T, Shift+Home, Shift+←/→ in the replay, and
Shift-drag for half a squad (the count prompt has a Half button).

**Right-click means one thing per kind of element:**
- **On the map:** move, with commanders selected. With nothing selected it does nothing.
- **On notifications** (alerts, feed rows, toasts): dismiss. EU4 and Civ VI do the same
  (P §3 [X], X §5 [X]).
- **On entities** (cards, outliner rows, research and spell cards, entity links): one context
  menu with Open in Codex, Pin or Unpin, and, for own commanders, the orders available now.
- **Ctrl+click opens the Codex everywhere.**

**Game screen**

| Key or gesture | Action | Precedent |
|---|---|---|
| Space | pause / resume | Paradox (P §2 [X]); docs/07 |
| 1 to 4 (digit row, numpad) | set speed | EU4 and CK3 digits (P §2 [X] for EU4, [U] for CK3); docs/07 |
| + / − | step speed | EU4 (P §2 [X]) |
| Shift+1 to Shift+6 (F1 to F6 best effort); M / Shift+M | map modes; cycle modes | browser F-key limits (U §6); docs/07's F-keys kept as an extra |
| `` ` `` (Backquote) | numbers layer on or off | Dominions' capsule overlay, Ctrl+4 (D §1.1 [V]); Ctrl+digit is a browser key |
| WASD, arrows; wheel; LMB drag or MMB drag | pan; zoom to cursor; pan | docs/07 |
| LMB / Shift+LMB / Shift+LMB drag | select / add to selection / box-select own armies | genre standard; Dominions 6 drag select (D §1.4 [X]) |
| Double-click a badge; Enter | open the Commander panel (or the Battle Plan for several) | design choice |
| RMB / Shift+RMB | move (attack if hostile) / append waypoint | StarCraft II, Total War (U §6 [X]) |
| V | reverse the current leg | design choice |
| Tab / Shift+Tab (map focus only) | next / previous own commander; past the last one, focus leaves the canvas for the right dock, so the canvas never traps focus | docs/07; WCAG 2.1.2 |
| N | next idle commander (Guard excluded); a second press centers | CK3 (P §5 [U]); StarCraft II idle key (U §6 [X]) |
| J (repeat to step back, 8 deep) | jump to the latest alert or message | StarCraft II (U §6 [X]) |
| Home / Ctrl+Home | center on the capital / on the pretender | Dominions (D §1.1 [V]) |
| R / L / F / O | Research / Ledger / Codex and search / toggle outliner | docs/07; EU4 Ledger (P §8 [X]); Stellaris O (P §5 [U]) |
| C | Rituals tab of the selected mage (Cast) | docs/07 |
| P | pin the selection | CK3 and Vic3 pins (P §5 [U] for the CK3 key) |
| I | Codex page of the hovered item | Dominions' info on demand (D §1.1) |
| T, or middle-click | lock the tooltip | CK3 action lock (P §6 [X]) |
| hold Shift alone | "more" (above) | PoE, BG3, Factorio with Alt (U §3.5 [X]) |
| `[` / `]` / H | collapse the left dock / the right dock / hide all chrome | Dominions `h` (D §1.1 [V]) |
| Ctrl+S | save (also a visible button, and autosave) | docs/07 |
| ? | key overlay for this screen | Dominions (D §1.1 [V]) |
| Esc | close one layer (the ladder below) | genre standard, WCAG 1.4.13 |

**Esc ladder** (each press closes one layer, in this order; U §6):
1. tooltip chain
2. context menu or popover
3. targeting mode (move preview with waypoints, ritual target), which restores the speed
4. modal
5. Battle Plan sheet (the dock returns to its normal width)
6. left dock
7. selection (the strip closes)
8. when nothing else is open, the Game Menu

In browser fullscreen, Esc leaves fullscreen first, so every layer also has a visible close
control.

**Other contexts:** the replay keys are in section 4.3. Pretender Design: Ctrl+S and Ctrl+O save
and load a design, Enter starts the game (with the unspent-points confirmation), and Esc goes Back.
Codex: Backspace goes back when the search box does not have focus, and Enter opens the first
result.

**Never bound:** Ctrl+digit, Alt+digit, Alt+Left and Alt+Right, Ctrl+W, Ctrl+T, Ctrl+N, Ctrl+R,
Ctrl+C and Ctrl+V outside text fields, F5, F6, F11, F12. These are the browser's tab, navigation,
clipboard and reload keys (U §6). Control groups on Ctrl+digit are therefore left out. With a few
dozen commanders, Tab, N, pins, stack clicks and box-select cover the need.

**The binding table is data and read-only in M1.** A unit test checks it: no duplicates per
context, no reserved keys, physical codes for the digit row, and every action has a visible
button. Destructive actions (Storm, Make Prophet, Stop ritual, Quit) have **no bare-key binding**.
Dominions puts `e` (end turn) next to `r` (recruit) (D §1.9 [X]). [Later] rebinding per context.

### 5.5 Onboarding [M1 core, M1-should for Learn]

Dominions has no tutorial, and that is its most-cited barrier (D §2). Fluid Magic teaches inside
the first match, at the player's chosen depth.

- **New Game asks "How much guidance?"** Civ VI asks the player's experience at the start
  (U §8 [X]). The answer can be changed in Settings at any time.
  - **Guide me:** the Learn objective, reactive hints, and a pause before each first major
    concept.
  - **Hints only** (default): reactive hints, never pausing.
  - **Off.**
- **The first hint teaches the gestures.** It reads: "Hover any number to see where it comes from.
  Hold Shift for more, press T to lock a tooltip, press ? for keys." and adds: "Old World players:
  Shift does not freeze tooltips here; T or a short rest does." Old World freezes tooltips with
  Shift (X §1, official manual [X]).
- **Learn objective** [M1-should] is a pinned section at the top of the outliner. Vic3 makes its
  tutorial a journal objective with "Tell me How" and "Tell me Why" (P §12 [X]).
  - Each step has a **Why** link that opens its concept. Steps carry no UI-highlighting "How";
    the step text names the button and the key.
  - A pure selector checks each step from state:

  | # | Step | Done when |
  |---|---|---|
  | 1 | Recruit a batch at your capital | an own fort queue holds an item, or a `recruited` message exists |
  | 2 | Take an independent province | the nation owns a province other than its capital |
  | 3 | Set research going | the research color is set to a color with M1 spells and `nationResearchRate > 0` |
  | 4 | Spread your dominion | a priest has order Preach, or a temple is under construction |
  | 5 | Plan a battle | a commander has a script with a named spell, or a squad's row was changed |
  | 6 | Cast a ritual | any `castRitual` order has been given |
  | 7 | Claim a Wellspring | a claim order has been given |

- **Reactive hints** use the blue Hint tier of the alerts ribbon and fire on the first occurrence,
  as CK3's reactive advice does (P §12 [X]). Each hint is two sentences and ends with **Show me**,
  which selects the subject and centers it (the same action as an alert click). Hints never
  pause, except under Guide me. "Reset hints" in Settings brings dismissed hints back.

  | Trigger (first time) | Hint |
  |---|---|
  | an army starves | "Armies eat the province's supply. Spread out, or move to farmland." |
  | unrest passes 50 | "Above 50 unrest a fort stops recruiting. Lower taxes or station a priest." |
  | enemy dominion in an own province | "Their god's scales now apply here. Preach or build a temple to push back." |
  | fort materials at cap | "Materials beyond 6 months of production are lost. Recruit something." |
  | a scripted spell cannot be cast | "Varo's script names Fireball but he has R1. Open the Battle Plan." |
  | first battle lost | "Open the report to see why, then watch the replay." |
  | first siege against you | "Walls hold while defenders repair. A relief army must break the siege." |
  | first Idle alert | "Idle armies are listed until you give an order. Guard tells the game an army holds on purpose." |

- **Quiet, never hidden.** In the first game, sections that do not apply yet (Rituals before any
  caster, Prophet before it is available) are collapsed with a dim one-line unlock hint (CK3's
  progressive disclosure, P §12 [X]).
- **Pretender presets** are the easy start (docs/05). Each preset tooltip shows the summary card's
  reading.

### 5.6 Accessibility [M1]

| Setting or rule | Default | Note |
|---|---|---|
| UI scale | 100% (80 to 200%) | root `font-size`; every DOM size is in `rem`; Pixi labels and badges read the same factor. Civ VII's UI was built for 1080p and looks blurry above it (X §11 [X]) |
| Text size | 100% (90 to 150%); body at least 14 px | separate from UI scale |
| Color identity | always | hue + glyph + letter for the five colors; a letter in `aria-label` and text runs (`Ember (R)`); costs in MTG notation, colored pips then generic (U §5) |
| No hue-only signals | always | deficits ▲▼; alert tiers by shape; allegiance by badge shape; invalid targets hatched; fog dotted; supply wheat states; nation emblem on bands (U §5 table) |
| Pattern overlays in map modes | off | hatching per step |
| High-contrast borders | off | |
| Letters on mana symbols | off | draws W U B R G inside the glyph |
| Banner colors | the docs/09 palette | validated for three color deficiencies by `tests/content/palette.test.ts`; no runtime picker in M1 |
| Reduced motion | follows `prefers-reduced-motion` | map: no idle bob, no pulsing; replay: section 4.3 |
| Screen shake | 50% (0 to 100%) | shared with the replay. Path of Exile players objected to full shake by default (U §3.5 [X]) |
| Gore | Full (Off / Reduced / Full) | shared with the replay; the visceral default follows the owner's direction |
| Flash limit | always on | WCAG 2.3.1 limits for the replay and the map's spell effects |
| Captions | Events | Off / Events / Events + sounds; every informative battle sound has a caption |
| Detail key | Hold | Hold / Toggle (section 5.4), for players who cannot hold a key |
| Keyboard focus | always | every DOM control can be reached and shows a `:focus-visible` ring; no focus traps (map Tab leaves the canvas after the last commander; replay Tab never stops on stage commands). Map orders stay mouse-first in M1. [Later] a keyboard province cursor |
| Pause as a tool | — | every order can be given while paused (docs/00 pillar 3); modals and ritual targeting pause |

QA: a developer toggle applies color-deficiency SVG filters to the whole app, as Game UI Database's
visualizers do (U §5 [X]).

### 5.7 Confirmation and reversal

There is no undo in M1. The sim's own reversals and a few inline confirmations cover mistakes, and
they apply the same way whether or not the game is paused.

- **Reversals live where the thing is shown.** A recruit queue row has a cancel × (`cancelRecruit`:
  gold back in full, materials up to the cap). A move has Reverse (`V`, the strip, the ETA box).
  A tax change or an order change is undone by setting it back.
- **Confirm only the irreversible.** Confirmations are **inline**: the button turns into `Confirm
  Storm? Walls stand: defenders +6 protection` for 3 seconds. A per-type "Don't ask again" can be
  reset in Settings → Game. Generic dialogs train players to click through (U §9 [X]).
  - Storm while the walls stand (docs/01: "strongly discouraged"). The confirmation shows the
    strength estimate.
  - Make Prophet (720 days before another can be named if the prophet dies).
  - Stop a ritual in progress (the mana is lost).
  - Start the match with unspent design points.
  - Load, quit, or start a new game with unsaved play.
- **Casting a ritual needs no confirmation.** Targeting pauses the game, and the cursor label
  prints the commit text before the click (section 3.5).
- [Later] Undo while paused, Old World's "undo until new information arrives" (U §9 [X]). It
  would also have to rewrite the command log that saves and the determinism hash rely on, so it
  waits for playtest evidence.

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
| `ScaleBars` | `scales: Scales; compact?: boolean` (five two-pole bars with pole symbols) | province Overview, province tooltip, nation tooltip, `PretenderCard` |
| `Candles` | `strength: number; nation: NationId \| null; compact?: boolean` | province header, tooltips, `PretenderCard` |
| `BannerChip` | `nation: NationId \| null; withName?: boolean` (banner plus emblem; numbered for duplicates) | headers, rosters, Ledger, feed |
| `Portrait` | `unit: UnitTypeId; nation: NationId \| null; pips?: Pips; size: number` | strip, rosters, outliner, cards |
| `StatusGlyphs` | `statuses: StatusId[]; max?: number` (3, then `+n`) | rows, cards (the map draws its own) |
| `ConceptTerm` | `id: ConceptId; children?` (dotted underline, opens L2) | tooltips, panels, Codex |
| `EntityLink` | `ref: EntityRef` (province, commander, nation, spell, unit, battle) | tooltips, feed, Codex, Ledger |
| `Hotkey` | `action: ActionId` (shows the current binding's label) | buttons, tooltip footers, `?` overlay |

### 6.2 Tooltip system (`src/ui/tips/`)

| Component | Key props | Used in |
|---|---|---|
| `TipProvider` | settings from the store | `App` |
| `TipLayer` | none (portal; chain of up to 3; lock ring; close grace; placement) | `App` |
| `Tip` | `content: TipContent; kind: 'value'\|'concept'\|'entity'\|'action'; children` | wraps any trigger |
| `ValueTip` | `title; icon; value; meaning: ConceptId; breakdown: () => Breakdown; more?: Route` | readouts, stat rows |
| `ConceptTip` | `id: ConceptId` | `ConceptTerm` |
| `EntityTip` | `ref: EntityRef; context?: 'map'\|'script'\|'recruit'\|'replay'` (Old World-style context filtering) | cards, links |
| `ActionTip` | `lmb?: string; rmb?: string; blocked?: string` (the validator's reason) | buttons, map objects |
| `BreakdownTable` | `breakdown: Breakdown; detail: boolean; maxRows?: number; more?: Route` | value tips |
| `MapTip` | `province: ProvinceId \| null; anchor: ScreenPoint` | `MapView` |

### 6.3 Buttons, shells and feedback

| Component | Key props | Used in |
|---|---|---|
| `ActionButton` | `command: Command \| null; label; cost?: CostLabel; hotkey?: ActionId; confirm?: ConfirmSpec; preview?: () => DeltaPreview`. Its disabled state and reason come from `validateCommand(state, command)`. A click dispatches `store.issue(command)` (validate, then apply) | every command in the UI |
| `NavButton` | `to: Route; label; icon; hotkey?` (ghost style) | top bar, links, tabs, `Cast ▸`, `Storm ▸` |
| `Panel` | `title; subtitle?; actions?: { goTo?; pin?; codex? }; tabs?: TabDef[]; wide?: boolean; onBack?; onClose` | left-dock panels, Battle Plan sheet, report card |
| `Tabs` | `tabs; active; onChange` | panels, Ledger, Settings |
| `Modal` | `id: ModalId; title; onClose; pauses?: boolean` (default true) | Research, Ledger, Codex, Settings, Game Menu, replay |
| `ContextMenu` | `ref: EntityRef` (Open in Codex, Pin or Unpin, orders for own commanders) | right-click on entities |
| `ToastStack`, `Toast` | `message: MessageId \| UiEventId` | game screen |
| `PopupQueue`, `Popup` | `items: PopupItem[]` (one at a time; "Next (n more)") | report cards, lost province, Wellspring, Godless |
| `SplitPane`, `Rail` | `panes` / `items` | right dock; narrow layout |
| `KeyOverlay` | `context: KeyContext` | `?` on every screen |

### 6.4 Cards

| Component | Key props | Used in |
|---|---|---|
| `UnitCard` | `unit: UnitTypeId; nation; count?; start?; hpPct?; morale?: MoraleState; row?: Formation; statuses?; cost?: RecruitCost; killed?; routed?; variant: 'recruit'\|'squad'\|'box'\|'mini'\|'report'\|'replay'; blocked?: string; draggable?` | Recruit tab, bottom strip, Battle Plan boxes, engagement preview, report, replay rosters, Codex |
| `SpellCard` | `spell: SpellId; caster?: CommanderId; variant: 'research'\|'ritual'\|'script'\|'codex'` (shows the cost for that caster and "Castable by N") | Research, Rituals, script picker, Codex |
| `CommanderCard` | `commander: CommanderId; variant: 'row'\|'compact'\|'roster'` | outliner, Forces tab, strip (several selected), rosters |
| `PretenderCard` | `nation: NationDef; design: PretenderDesign; live?: boolean` | Pretender Design, nation tooltip, Ledger Nations, Victory |
| `ChassisCard` | `chassis: ChassisId; fits: boolean; selected: boolean` | Pretender Design |
| `BattleReport` | `summary: BattleSummary; record?: BattleId; mode: 'popup'\|'end'\|'embedded'` (Watch is enabled only with `record`) | popup queue, replay end card, Ledger Battles, Victory |

### 6.5 Game screen (`src/ui/screens/GameScreen.tsx`, `src/ui/panels/`)

| Component | Key props | Notes |
|---|---|---|
| `GameScreen` | none | mounts the full-window `MapView` once, then the overlays; breakpoints; fixed anchors (section 2.1) |
| `TopBar` | none | `NationButton`, `Readout` × 7, `ScreenButtons`, `Clock`, `SpeedControls`, `PauseReasonChip` |
| `Readout` | `id: 'population'\|'gold'\|'materials'\|'mana'\|'research'\|'dominion'\|'wellsprings'; color?: Color` | value, rate, `ValueTip`, click route |
| `AlertsRibbon`, `AlertIcon` | `alert: AlertGroup` | hover list, click cycles, right-click dismisses, Shift+right-click mutes |
| `Outliner`, `OutlinerSection`, `OutlinerRow` | `section: SectionId` / `ref: EntityRef` | drop targets for squads |
| `MessageFeed`, `FeedFilters`, `MessageRow`, `MessageSettingsPopover` | `message: MessageId` / `type: MessageTypeId` | |
| `LeftDock` | none (renders the top of the dock stack, with a breadcrumb; `wide` while the Battle Plan is active) | |
| `ProvincePanel` | `province: ProvinceId` | tabs: `ProvinceOverview`, `RecruitTab`, `ForcesTab`, `HistoryTab` |
| `StatRow` | `icon; label; value; rate?; target?; tip: ValueTip` | province and commander stats |
| `TaxSelector`, `PdRow`, `BuildingRow`, `SiegeBlock`, `WellspringBanner`, `EffectsList` | `province` | Overview tab |
| `CommanderPanel` | `commanders: CommanderId[]` (one: Overview, Battle Plan, Rituals; several: Battle Plan only) | opened on demand |
| `BattlePlanSheet`, `FormationField` | `commanders: CommanderId[]; focus: CommanderId` | drag issues `setFormation` and `transferSquad`; positions from `formationLayout` |
| `ScriptTimeline`, `ScriptSlotPicker`, `FatigueStrip`, `ScriptPresets` | `commander: CommanderId` | Battle Plan |
| `RitualList`, `PaymentRow`, `TargetingBanner` | `caster: CommanderId` | Rituals tab; targeting mode |
| `GiveManaPopover` | `commander: CommanderId` | Commander Overview |
| `BottomStrip`, `CommanderStrip`, `ScriptSummary`, `OrderBar`, `EtaBox` | `selection` | standing orders |
| `MapView` | none | hosts `MapRenderer` (Pixi); its canvas never resizes for panels; maps pointer events to store actions |
| `CursorLabel` | `preview: MovePreview \| EngagementPreview \| TargetPreview` | next to the cursor |
| `EngagementPreview` | `attackers: CommanderId[]; province: ProvinceId` | inside `CursorLabel` |
| `ModeColumn`, `Legend` | `mode: MapMode; numbers: boolean` | map, bottom right |

### 6.6 Modals and screens

| Component | Key props | Notes |
|---|---|---|
| `ResearchModal`, `ResearchColumn` | `color: Color` | W, U and B columns read-only in M1 |
| `LedgerModal`, `LedgerTable<T>` | `tab: LedgerTab; columns; rows; filters; sort` | one generic table for five tabs |
| `CodexModal`, `CodexSearch`, `CodexEntry` | `ref: CodexRef` | generated pages |
| `SettingsModal`, `MessageMatrix`, `BindingTable` | `tab: SettingsTab` | `BindingTable` is read-only |
| `GameMenu`, `SaveLoadDialog`, `SlotCard` | `mode: 'save'\|'load'` | |
| `BattleReplay` | `battle: BattleId` | `ReplayHeader`, `ConditionChips`, `RosterPanel` (`side`, `collapsed`), `LiveRail`, `BattleStage` (`BattleStageProps`, section 4.4), `CaptionsStrip`, `BattleLog` (`detail`, `focus`), `Transport`, `Scrubber` (`markers`), `ReplaySettingsPopover` |
| `CourtModal` **[Phase 9b]** | `tab: 'officers'\|'posts'\|'prisoners'` | `OfficerRow`, `StatBars` (five 3 px bars with the median mark), `TraitChip`, `BondChip`, `PostCard` (`post`, `holder`, `candidates`), `PrisonerRow` (`held: 'byUs'\|'byOthers'`), `AscendancyStrip`; Officers and Prisoners reuse `LedgerTable<T>` |
| `ProposalAlert`, `PrisonerAlert` **[Phase 9b]** | `proposal: ProposalId` / `commander: CommanderId` | the two button-bearing alert bodies in the ribbon's hover list; buttons go through `validateCommand` and show the disabled reason |
| `MainMenu` | none | |
| `NewGame` | none | `MapSizePicker`, `SeedField`, `OpponentRow`, `NationCard`, `GuidancePicker` |
| `PretenderDesign` | `nation: NationId` | `PresetBar`, `BudgetBar`, `ChassisList`, `PipStepper`, `DominionStepper`, `ScaleSlider`, `AwakeningPicker`, `PretenderCard` |
| `VictoryScreen` | none | `StatsTable`, battle list from summaries, View map |

### 6.7 Store (Zustand, `src/ui/store.ts`)

Everything here is UI state and never enters `GameState`. The slices marked *saved* go to local
storage or to the save file's UI block. Keeping them out of `GameState` keeps the sim's hash
unchanged.

| Slice | Holds |
|---|---|
| `game` | the `GameState` ref and a version counter bumped once per tick batch |
| `time` | speed, paused, pause reasons (coalesced), the speed to restore after a modal or targeting |
| `selection` | selected commanders, selected province, hovered entity |
| `dock` | left-dock stack, per-panel last tab, wide (Battle Plan) flag |
| `modal` | the open modal and its back link |
| `popups` | the popup queue |
| `tips` | tooltip chain, lock state, Shift state machine (section 5.4) |
| `map` | mode, numbers layer, zoom band, targeting mode (move or ritual), camera |
| `alerts` | dismissed (until the condition re-arises), muted types, `idleSince` (not saved) |
| `feed` | filters, hidden rows, unread count |
| `prefs` (*saved*, local storage) | settings, message matrix, guidance level |
| `uiSave` (*saved*, in the save file) | pins, Learn progress, hints seen, `battleSummaries` (capped at `MESSAGES.keep`) |

---

## 7. What the sim must expose

The rule from principle 3: the UI shows only numbers that a sim function computed. Most functions
already exist. The new ones are pure, deterministic and read-only, and they are unit-tested under
`tests/sim/` (CLAUDE.md). None of them touches `state.rng`. The one sim *rule* change is the
incursion messages (#8).

### 7.1 Already in the sim (reuse as is)

| Need | Function (module) |
|---|---|
| Province rates: gold, materials, supply, supply used, mana, growth, unrest, pillage | `provinceEconomy`, `allProvinceEconomies` (selectors) |
| Nation totals: gold after difficulty, upkeep, mana, plunder per day | `nationEconomy`, `allNationEconomies` (selectors) |
| Fort materials per month and cap | `fortMaterials` (selectors) |
| Province and national scales | `provinceScales`, `nationScales`, `scaleEffect` (scales) |
| Dominion score; checks per source | `dominionScore` (selectors); `dominionChecks`, `isGodless` (dominion) |
| Morale penalties | `unpaidMoralePenalty`, `starvationMoralePenalty` (selectors) |
| Pretender and prophet identity | `isPretender`, `isProphet` (selectors); `pretenderId`, `prophetId`, `prophetAvailableDay` (nation state) |
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
| Command validity | `validateCommand` (commands/index), used for every disabled state and reason |
| Province effects | `activeEffects` (state) |
| Replay | `startReplay`, `stepReplay`, `foldReplay` (battle/replay); `BattleRecord` roster and events |

### 7.2 New sim functions

| # | Function | Module | Returns | Used by | Phase |
|---|---|---|---|---|---|
| 1 | **Trace sinks:** an optional last argument `opts?: { override?: ProvinceOverride; trace?: Trace }` on `provinceEconomy`, and `trace?: Trace` on `nationEconomy`, `fortMaterials`, `researchRate`, `dominionChecks`, and the morale penalty functions | where each lives today | the same values; with a trace, each term is reported as it is applied | every breakdown | 8 |
| 2 | `explainProvince(state, id)`, `explainNationGold`, `explainNationMana(color)`, `explainNationPopulation`, `explainFortMaterials(fort)`, `explainResearch`, `explainDominion`, `explainMorale` | `src/sim/explain/*.ts` | `Breakdown`. Each one is a thin wrapper: it runs the real selector with a trace and folds the terms. No formula is written twice | L1 tooltips, panels, Ledger | 8 to 9 |
| 3 | **What-if overrides:** `ProvinceOverride = { taxRate?: TaxRate; pop?: number; unrest?: number; effects?: readonly ProvinceEffectBody[] }`, applied inside `provinceEconomy` in place of the province's own fields, without touching state | `src/sim/selectors.ts` | `ProvinceEconomy` | tax previews, `predictRitual`, order hover effects | 8 |
| 4 | `armyPower(forces)` (docs/08's formula: troops × (hp + att + def + prot) / 4 × (1 + 0.1 × ranged)) | `src/sim/selectors.ts`, moved from the AI | number | engagement preview, Storm confirmation, AI | 8 |
| 5 | `supplyAfterArrival(state, commanders, province)` | `src/sim/selectors.ts` | `{ available, used, state: 'fed'\|'tight'\|'starving' }` | cursor label, Supply mode during moves | 8 |
| 6 | `scriptCheck(state, commander)` | `src/sim/battle/scriptCheck.ts` | per slot: castable or the reason, fatigue cost for this caster, carried mana needed; projected fatigue for rounds 1 to 5 | Battle Plan, script summary, alert, engagement preview | 9 |
| 7 | `predictRitual(state, caster, spell, target)` | `src/sim/rituals.ts` | before and after `ProvinceEconomy` values plus the effect durations. It builds a `ProvinceOverride` from the ritual's primitives (pop and unrest changes, timed effect bodies) and calls `provinceEconomy` twice. **No state clone** | ritual targeting labels | 9 |
| 8 | **Incursions:** `incomingThreats(state, nation)` (visible enemy commanders whose current leg ends in the nation's land or where its army stands, each classed `plain`, `troops`, `fort` or `capital`), and `updateIncursions(state)`, run in tick step 6 after `updateSightings`. It posts `approaching` and `threatened` per section 5.3. New state: `NationState.incursions: Partial<Record<NationId, { lastDay: number; warned: ProvinceId[] }>>`. New content: `APPROACH.quietDays` (10) in `rules.ts` | `src/sim/visibility.ts`, `types.ts`, `content/rules.ts` | messages; the selector also feeds the ribbon alert | 8 |
| 9 | New `MessageKind`s: `approaching`, `threatened`, `siege`, `breached`, `godless`, `pretender`, `eliminated` (splitting today's `info`), and `refs` on `Message` (commander, nation and spell ids) for links | `src/sim/types.ts`, `messages.ts`, `siege.ts`, `dominion.ts`, `pretender.ts`, `victory.ts` | messages | feed, message settings, auto-pause | 8 |
| 10 | `summarizeBattle(record)` | `src/sim/battle/summary.ts` | `BattleSummary`: id, day, province, sides, winner, outcome band, per-squad start, end, killed and routed, commander fates, spells cast, end reason, up to 3 key moments. It is small and serializable | report card, Ledger Battles, replay end, Victory | 9 |
| 11 | `pretenderReading(nation, design)` | `src/sim/pretender.ts`, phrases in `src/content/pretenders/reading.ts` | the summary card's one-line reading (docs/05) | `PretenderCard` | 9 |
| 12 | Content: `concepts.ts`; `BATTLE_REPORT` outcome-band thresholds in `rules.ts`; **`src/content/ui.ts`** with every UI threshold (`UI.unrestShowAt` 25, `UI.capitalDominionWarn` 2, `UI.treasuryWarnDays` 30, `UI.idleAlertDays` 5, `UI.battleMarkerDays` 30, `UI.mergeDays` 5, `UI.tips` timings, the zoom-band diameters 70 and 180, the label box 96 × 30) | `src/content/` | data, listed in docs/09-balance | tooltips, alerts, Codex, report | 8 to 10 |

| 13 | **[Phase 9b]** `officerStats(state, commander)` (the five stats with breakdowns of what each drives), `captureOdds(state, battle, commander)`, `ransomPrice(state, commander)`, `fieldCap(state, nation)` (cap, the stacks in the field, the stack that could not leave), `postEffect(state, nation, post, holder?)`, `postCandidates(state, nation, post)` (best three by the post's stat), `openProposals(state, nation)` | `src/sim/officers.ts`, `src/sim/proposals.ts` | numbers and rows; no state clone | Court, the two alerts, Commander panel rows, Ledger columns, the top-bar readout | 9b |
| 14 | **[Phase 9b]** New `MessageKind`s `captured`, `prisoner`, `duel`, `post`, `bond`, `proposal`, each with `refs` to the commanders involved | `src/sim/types.ts`, `messages.ts`, `battle/apply.ts`, `officers.ts` | messages | feed, message settings, the "Officer events" auto-pause toggle | 9b |

Items 8 and 9 change `GameState` (one new nation field and new message kinds), so the save format
version goes up by one with a migration that adds empty `incursions`. The determinism test's
expected hash changes once, in the commit that adds them.

**The `Breakdown` and `Trace` shapes** (U §4):

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
  projection?: { days: number; value: number } | { daysUntil: number; event: string };
}
interface Trace {               // implemented by explain/*.ts; the sim only calls it
  term(key: string, op: Term['op'], value: number, running: number, ref?: EntityRef | ConceptRef): void;
}
```

**Keep the fast path fast.** `allProvinceEconomies` runs inside the tick's 2 ms budget (docs/06).
The selectors call the trace as `opts?.trace?.term(...)`. When the trace is undefined, optional
chaining skips the call *and the evaluation of its arguments*, so the tick allocates nothing.
Breakdowns compute only when a tooltip or panel opens. A **property test** in
`tests/sim/explain.test.ts` checks random states (from `createGame` plus random valid commands and
days): each `explainX(...).total` must equal its selector within 1e-9, and the last term's
`running` must equal the total. Record the trace-sink choice in `docs/06-architecture.md`.

**Previews never clone.** docs/06 says "Mutation is in place for performance... Do not deep-clone
state per tick". A `GameState` also carries 300 messages per nation and up to 20 battle records.
Previews therefore use overrides (#3) or the existing pure functions (`pdForce`, `pillageOf`
through `provinceEconomy`, `researchRate`). A perf test runs every preview the UI offers on the
4-nation Medium fixture and requires each to take under 2 ms (median of 50 runs).

### 7.3 Pure UI derivations (`src/ui/derive/`, tests in `tests/ui/derive/`)

These read sim state and selectors and never write. They live under `src/ui` because only the UI
needs them, and the sim imports nothing from the UI.

| Module | Computes |
|---|---|
| `alerts.ts` | `AlertGroup[]` for a nation from the conditions in section 2.5, minus dismissed and muted ones |
| `outliner.ts` | sections and rows, with roles and status glyphs |
| `movePreview.ts` | path (`findPathFor` plus waypoints), per-leg days, arrival date, `supplyAfterArrival`, refusal reason, engagement data |
| `engagement.ts` | visible forces on both sides, the fog band from the strength word, modifier chips, `armyPower` ratio |
| `previews.ts` | the effect of a command before it is issued, from overrides and pure functions only: tax segments (`{ taxRate }` override), PD (`pdForce`), order hovers (`provinceEconomy` with a shallow copy of the province's present-commander list in which this commander's order is changed, passed as `present`) |
| `mapLabels.ts` | `layoutMapLabels`: label content per province per zoom band and mode, placement, priority culling |
| `formationLayout.ts` | lane and box rectangles for the Battle Plan sheet |
| `feed.ts` | grouping, categories, merged toasts |
| `messageTypes.ts`, `pauses.ts` | message types (kind plus predicate), which new messages pause or pop up under the player's matrix, coalesced per day, and the popup queue |
| `battleSummaries.ts` | captures a `BattleSummary` into `uiSave` the first time each record appears |
| `shift.ts` | the Shift state machine: alone, chord, released (section 5.4) |
| `learn.ts`, `hints.ts` | Learn steps' done state and first-occurrence hint triggers |
| `bindings.ts` | the default key table, physical or mnemonic per binding |

**Fog guard test:** for every derive function that shows another nation's data, changing a hidden
enemy commander (outside `visionOf`) leaves the function's output unchanged. Otherwise the UI could
leak what the fog hides. `incomingThreats` gets the same test in `tests/sim/`.

**Cost:** alerts and the outliner recompute once per store bump, at most once per sim day.
Breakdowns compute on open. One `allProvinceEconomies` result is memoized per day and shared by the
top bar, the alerts and the map labels.

---

## 8. Pattern sources

Each pattern this spec adopts or avoids, the game it comes from, and the citation. "Note §" is the
research note's section: P = `research-paradox.md`, D = `research-dominions.md`, X =
`research-fourx.md`, U = `research-ux.md`. The URLs are those the notes cite. **Check** is the
verification mark defined at the top: [V] confirmed against the primary source, [X] taken from a
search extract, [U] unverified or contested. Fluid Magic adopts a [U] pattern only where the
pattern stands on its own merits, and never cites a [U] item as a fact in docs/07.

### 8.1 Layering, tooltips, encyclopedia

| # | Pattern | In Fluid Magic | From | Check | Note §, source |
|---|---|---|---|---|---|
| 1 | Five layers: always-on, hover, nested hover, click panel, full screen | §1.1 ladder | EU4, CK3, Stellaris | X | P §0; https://eu4.paradoxwikis.com/Ingame_screen ; https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/ |
| 2 | Progressive disclosure; the boundary between layers made visible | tooltip footer naming the next gesture | NN/g; CK3 tutorial refresh | X | U §1; https://www.nngroup.com/articles/progressive-disclosure/ ; https://www.gamedeveloper.com/design/deep-dive-refreshing-the-crusader-kings-iii-tutorial-mode-through-optimized-ux |
| 3 | Tooltips in tooltips with a timer lock and a middle-click lock | §5.1, timer 0.8 s, MMB or T | CK3 | X | P §6; https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/ |
| 4 | Nested tooltip placement that opens nothing on the way | §5.1 placement | Victoria 3 (1.2) | X | P §6; https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-74-ux-improvements |
| 5 | A locked tooltip briefly blocks new ones | §5.1, 1 s suppression | Vic3 player request | X | P §6; https://forum.paradoxplaza.com/forum/threads/locking-a-tooltip-should-prevent-other-tooltips-from-opening-for-a-brief-moment.1554097/ |
| 6 | Tables for many-source values, mouse-button hints, a "why not" block | `BreakdownTable`, `ActionTip` | EU5 | U | P §6, U §3.6; https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053 |
| 7 | Cap nesting depth at about 3 | depth cap 3 | design critique of CK3 | X | P §6; https://philip.design/blog/tooltips-in-tooltips/ |
| 8 | Shift freezes a tooltip (so FM's first hint warns Old World players); names in tooltips are live links | `EntityLink`; first hint | Old World | X | X §1; https://cdn.steamstatic.com/steam/apps/597180/manuals/Old_World-Official_User_Manual.pdf ; https://mohawkgames.com/2020/09/02/old-world-update-16/ |
| 9 | F1 on a tooltip opens its encyclopedia page | "Open in Codex" footer, Ctrl+click (F1 is a browser key) | Old World, AoW4 | X | X §1, §2; https://mohawkgames.com/2021/10/06/old-world-update-73/ ; https://steamcommunity.com/app/1669000/discussions/0/3828666171743764627/ |
| 10 | Tooltips filtered by context | `EntityTip` context | Old World (Update #132) | X | X §1; https://forums.civfanatics.com/threads/old-world-update-132.695851/ |
| 11 | Scrollable, capped tooltips; a way to silence tooltips | 60% height cap; delay Off | Old World (#121, #129, #143) | X | X §1; https://mohawkgames.com/2024/04/04/old-world-update-121/ ; https://mohawkgames.com/2026/02/18/old-world-update-143/ |
| 12 | Avoid: tooltips that all carry the same visual weight | value large, table small | Old World critique | X | X §1; https://www.ancientworldmagazine.com/reviews/old-world-2021/ |
| 13 | Avoid: a tooltip covering the click target | cursor label beside the cursor | Civ VII complaint | X | X §1; https://steamcommunity.com/app/1295660/discussions/2/570371033831324629 |
| 14 | Hover delay setting with an Off position | Settings → Interface | Civ VI, Baldur's Gate EE | X | U §3.1; https://support.civilization.com/hc/en-us/articles/37661409606547-Civilization-VI-Console-FAQ ; https://steamcommunity.com/app/228280/discussions/0/3432326055095021944 |
| 15 | Hoverable, dismissible, persistent hover content | close grace, Esc, focus | WCAG 1.4.13 | V (standard) | U §3.2; https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus |
| 16 | A held key shows more detail; a hold-to-toggle option | Shift alone; Detail key Hold/Toggle | Path of Exile, Baldur's Gate 3 (and a BG3 toggle mod), Factorio | X | U §3.5; https://alcasthq.com/the-most-important-feature-in-baldurs-gate-3-show-world-tooltip/ ; https://www.nexusmods.com/baldursgate3/mods/723 ; https://lua-api.factorio.com/1.1.34/Concepts.html |
| 17 | Encyclopedia generated from game data; concepts as data | Codex from the content registry; `concepts.ts` | CK3, Vic3, Stellaris, AoW4 | X | P §11, X §2; https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/ ; https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-wyvern-update-patch-notes |
| 18 | Topics on the left, search focused on open | Codex layout | Civ VI Civilopedia and a popular mod | X | X §2; https://cdn.2kgames.com/manuals/civilization-vi/switch/na/CIV_VI_NSW_ONLINE_MANUAL_US.pdf ; https://steamcommunity.com/sharedfiles/filedetails/changelog/1341630847?p=1 |
| 19 | Nested tooltips cut "tedious clicking" | hover depth over click depth | Endless Legend 2 | X | U §1; https://powerupgaming.co.uk/2026/09/16/endless-legend-2-full-release-brings-overhaul-to-cut-tedious-clicking/ |

### 8.2 Main screen: readouts, alerts, outliner, messages, time

| # | Pattern | In Fluid Magic | From | Check | Note §, source |
|---|---|---|---|---|---|
| 20 | Stock plus rate; hover explains | top-bar readouts | EU4, Stellaris, Old World | X | P §1, X §3; https://eu4.paradoxwikis.com/Ingame_screen ; https://stellaris.fandom.com/wiki/Main_interface ; https://bigbossbattle.com/old-world-review/ |
| 21 | Clicking a resource opens where you act on it | readout click routes | Stellaris | X | P §1; https://stellaris.fandom.com/wiki/Main_interface |
| 22 | Yellow when a stock is full and gain is wasted | materials at cap, "full" glyph | Stellaris | X | P §1; https://stellaris.fandom.com/wiki/Beginner's_guide |
| 23 | Avoid: totals without sources; show losses everywhere | top-5 rows with links; upkeep rows | Civ VII critique and patch 1.2.5 | X | X §3; https://al97.com/news/civ-739s-ui-bad.html ; https://civilization.2k.com/civ-vii/from-the-devs/developing-settlements/ |
| 24 | Space pauses; +/− step the speed | §2.4 | EU4 | X | P §2; https://eu4.paradoxwikis.com/Controls |
| 25 | Digits set the speed; Z/X step it | digits kept (docs/07); Z/X not adopted | CK3, Vic3 | U | P §2; https://www.magicgameworld.com/crusader-kings-3-pc-keyboard-controls-guide/ ; https://defkey.com/crusader-kings-3-shortcuts ; https://defkey.com/victoria-3-shortcuts |
| 26 | Paused state tints the speed control red | three-channel paused state, adopted on its own merit | CK3 (player reports) | U | P §2; https://steamcommunity.com/app/1158310/discussions/0/3761101693153821101 |
| 27 | Avoid: surprise auto-unpause | no auto-resume by default; reason chip | Stellaris complaint | X | P §2; https://steamcommunity.com/app/281990/discussions/0/357286532028618957/ |
| 28 | Alert colors by urgency (red, yellow, green); left-click goes, right-click dismisses, Shift+right-click disables; disabled alerts listed in the outliner | §2.5 tiers and interaction | EU4 | X | P §3; https://eu4.paradoxwikis.com/Ingame_screen |
| 29 | A dismissed alert returns only if its condition re-arises; a blue hint tier | §2.5 dismissal; Hint tier | EU5 (Tinto Talks #77) | U | P §3; https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053 |
| 30 | Alerts only for actionable states | alerts as conditions | CK3 | X | P §3; https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/ |
| 31 | Hover an alert to explain, click to go | §2.5 | HoI4 | X | P §3; https://steamcommunity.com/sharedfiles/filedetails/?id=700703772 |
| 32 | Per-type message matrix: popup, log, pause; edit from the message | §5.3, the gear on every message | EU4, Vic3, Stellaris | X | P §4; https://steamcommunity.com/app/236850/discussions/0/496879865901102141/ ; https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-74-ux-improvements ; https://vic3.paradoxwikis.com/User_interface |
| 33 | Pause on anticipation (enemy spotted), not on contact | `threatened` pauses | Pillars of Eternity | X | U §7; https://steamcommunity.com/app/291650/discussions/0/1736595227843429278 ; https://forum.quartertothree.com/t/the-spoiler-free-pillars-of-eternity-thread-about-managing-combat/76675 |
| 34 | Avoid: inconsistent pausing | pauses only for threats to troops, forts and the capital; one matrix | RimWorld complaint | X | U §7; https://steamcommunity.com/app/294100/discussions/0/591760218823644744 |
| 35 | Jump to the last alert, repeat to go back | J, 8 deep | StarCraft II | X | U §6; https://news.blizzard.com/en-us/article/4552955/game-guide-special-control |
| 36 | Right-click dismisses a notification | right-click on alerts, rows and toasts | Civ VI | X | X §5; https://forums.civfanatics.com/threads/right-clicking.659074/ |
| 37 | Avoid: an idle-army notification that nags | Guard order; Idle alert only for recent arrivals and idle casters | Humankind (patched) | X | X §5; https://humankind.fandom.com/wiki/Updates |
| 38 | Avoid: a screen reachable only from a notification | every report has a menu path | Humankind complaint | X | X §5; https://community.amplitude-studios.com/amplitude-studios/humankind/forums/169-game-design-and-ideas/threads/54966-ideas-list-clearer-user-interface?page=1 |
| 39 | Outliner sections appear only when relevant | §2.6, empty sections hide | EU4 | X | P §5; https://eu4.paradoxwikis.com/Ingame_screen |
| 40 | Pins; a pin key | Pinned section, P | CK3, Vic3 | U (CK3 key), X (Vic3) | P §5; https://ck3.paradoxwikis.com/index.php?mobileaction=toggle_view_mobile&title=Keyboard_shortcuts ; https://vic3.paradoxwikis.com/User_interface |
| 41 | Noisy groups collapsed; go-to, pin and zoom-to in panel headers | outliner defaults; dock header | Victoria 3 (1.6) | X | P §5; https://forum.paradoxplaza.com/forum/developer-diary/victoria-3-dev-diary-117-the-ux-of-sphere-of-influence.1677959/ |
| 42 | Double-click an outliner row to center | §2.6 | Stellaris | X | P §5; https://steamcommunity.com/sharedfiles/filedetails/?id=954597865 |
| 43 | O toggles the outliner | O | Stellaris | U | P §5; https://stellaris.fandom.com/wiki/Main_interface |
| 44 | Next army key | N | CK3 | U | P §5; https://ck3.paradoxwikis.com/index.php?mobileaction=toggle_view_mobile&title=Keyboard_shortcuts |
| 45 | One place for each kind of thing ("Divided UI" removed) | principle 4; one selection, one surface | Endless Legend 2 | X | X §11; https://community.amplitude-studios.com/amplitude-studios/endless-legend-2/blogs/996-ui-ux-next-steps |
| 46 | Avoid: panels eating half the screen | unobscured-area budget | Old World and Humankind critiques | X | X §6, §11; https://bigbossbattle.com/old-world-review/ ; https://steamcommunity.com/app/1271140/discussions/0/4362280244719335674/ |
| 47 | Action buttons styled apart from navigation buttons | §2.2 two button styles | Victoria 3 | X | P §13; https://forum.paradoxplaza.com/forum/threads/victoria-3-dev-diary-30-user-interface-overview.1507166/ |
| 48 | Avoid: fragmentation and menu hopping | Ledger, tabs, depth audit | Victoria 3 critiques | X | P §13; https://streamsofconsciousness.blog/2025/02/24/victoria-3-has-the-worst-ui-ive-ever-seen/ ; https://letstalkaboutwargames.wordpress.com/2022/10/24/victoria-3-review/ |
| 49 | A sortable Ledger | §3.6 | EU4 | X | P §8; https://eu4.paradoxwikis.com/Ledger |
| 50 | An overview that is also a control surface (buy PD, jump) | Ledger inline PD and tax | Dominions F1 Nation Overview | V (manual), X (review) | D §1.11; https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html ; https://explorminate.org/dominions-6-masterfully-crafted-magic-and-combat-systems/ |
| 51 | List of everything active in the world | Ledger, Magic tab, active effects | Dominions F6 Global Enchantments | V | D §1.8; https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html |
| 52 | Avoid: confirmation dialogs that train click-through; avoid dangerous key adjacency | inline confirmation only for irreversible actions; no destructive bare keys | UX writing; Dominions `e`/`r` | X | U §9, D §1.9; https://notes.andymatuschak.org/zXH4ASvHNz488hCNgrBjQJK ; https://steamcommunity.com/app/2511500/discussions/0/7204143093501059856/ |
| 53 | Undo until new information arrives | [Later] | Old World | X | U §9; https://www.pcgamer.com/put-an-undo-button-in-every-strategy-game |

### 8.3 Map, provinces, armies

| # | Pattern | In Fluid Magic | From | Check | Note §, source |
|---|---|---|---|---|---|
| 54 | Map modes on keys, with a visible mode menu | Shift+1 to 6 (because browsers reserve F-keys), mode column, legend | EU4, CK3, HoI4 | X | P §7; https://eu4.paradoxwikis.com/Map ; https://www.gamepressure.com/crusader-kings-3/map-modes/z3f0f7 ; https://defkey.com/hearts-of-iron-4-shortcuts |
| 55 | F-keys a page cannot reliably capture | Shift+digit primary; F-keys best effort | Mozilla, WebKit, Chrome Keyboard Lock | X | U §6; https://bugzilla.mozilla.org/show_bug.cgi?id=1203059 ; https://bugs.webkit.org/show_bug.cgi?id=35849 ; https://developer.chrome.com/docs/capabilities/web-apis/keyboard-lock |
| 56 | A toggle that puts income, resources and dominion on every province | numbers layer (`` ` ``) | Dominions capsule overlay (Ctrl+4) | V | D §1.1; https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html |
| 57 | No information gated by zoom level | §2.10.3 | CK3 developer's warning | X | P §7; https://forum.paradoxplaza.com/forum/threads/ckiii-dev-diary-25-map-features-and-map-modes.1388210/ |
| 58 | A supply mode that shows fed and starving | Supply mode, three steps | HoI4 | X | P §7; https://forum.paradoxplaza.com/forum/developer-diary/hoi4-dev-diary-supply-and-mulberry-harbors.1481424/ |
| 59 | Lenses that open with an action and revert after | move and ritual targeting modes | Civ VI, Victoria 3 lenses | X | X §4, P §7; https://civilization.fandom.com/wiki/Lens_(Civ6) ; https://vic3.paradoxwikis.com/Keyboard_shortcuts |
| 60 | Avoid: a lens that masks the map; avoid surprise lens switches | fills only, frame at full contrast; no automatic priest lens | Civ VII | X | X §4; https://steamcommunity.com/app/1295660/discussions/2/570371162116298772 ; https://support.civilization.com/hc/en-us/articles/55328611080339-Civilization-VII-Patch-Notes-September-15-2026 |
| 61 | Fog that keeps terrain silhouettes | §2.10.7 | Age of Wonders 4 | X | X §4; https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-7 |
| 62 | Telegraph the threat on the board | enemy transit arrows with ETA | Into the Breach | X | U §2; https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i- |
| 63 | A value with its target marker | unrest `34 → 46`, bars with targets | RimWorld mood | X | U §2; https://rimworldwiki.com/wiki/Needs |
| 64 | Province window opens on left-click | left dock | EU4 | X | P §8; https://eu4.paradoxwikis.com/Province_interface |
| 65 | Preview an action's effect on its button | tax and order previews from overrides | Victoria 3, AoW4 event choices | X | P §8, X §10; https://www.pcgamesn.com/victoria-3/construction-buildings ; https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-6 |
| 66 | Missing pieces visible at a glance (district colors) | building slots drawn as outlines | Civ VI | X | X §10; https://trekkingwithdennis.com/2025/03/02/civ-7-further-thoughts/ |
| 67 | Avoid: "recommended" badges that push the biggest number | no recommended units or targets | Civ VII 1.2.5 | X | X §10; https://civilization.2k.com/civ-vii/game-update-notes/2025-sep-30-patch-1-2-5/ ; https://www.pcgamesn.com/civilization-vii/update-1-2-5-settlement-menus |
| 68 | Clickable numbers with their own breakdowns; upkeep and growth breakdowns | every stat row | Dominions 5 and 6 | V (manual), X (review) | D §1.2, §3; https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html ; https://steamcommunity.com/id/LucidTactics/recommended |
| 69 | Province scales shown where you hold dominion | Scales row in the province Overview | Dominions | V | D §1.2; https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html |
| 70 | Per-province history | History tab | Dominions Province Chronicles | V | D §1.2; https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html |
| 71 | Recruitment with commanders above, cheap to expensive; dimmed items that cannot start | Recruit tab | Dominions | V (manual), X (forum) | D §1.3; https://dmacguigan.github.io/dom6-manual/chapters/04-units.html ; https://forum.quartertothree.com/t/dominions-5-warriors-of-the-faith/131532 |
| 72 | Army command panel at the bottom center with unit cards | bottom strip; one surface per selection | HoI4 | X | P §9; https://stratemgames.space/en/hearts-of-iron-iv/game-interface |
| 73 | Status shown on the map army badge | badge corner glyph, by exception | CK3 (skull for attrition) | X | P §9; https://ck3.paradoxwikis.com/Attrition |
| 74 | Unit card, hover, full panel; status icons explain themselves | `UnitCard` depths | Age of Wonders 4 | X | X §6; https://aow4.paradoxwikis.com/Unit ; https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-wyvern-update-patch-notes |
| 75 | Box selection; Shift adds to the selection; Shift queues waypoints | §2.10.4, §2.10.5 | Dominions 6, Total War, StarCraft II | X | D §1.4, U §6; https://steamcommunity.com/app/2511500/discussions/0/3807281445020039925/ ; https://primagames.com/featured/total-war-warhammer-formation-control-guide-tips ; https://news.blizzard.com/en-us/article/4552955/game-guide-special-control |
| 76 | Engagement preview on hover with a selection | §2.10.6 | Age of Wonders 4 | X | X §7; https://www.pcgamer.com/age-of-wonders-4-review/ |
| 77 | Forecasts must show uncertainty; point predictions that miss destroy trust | "Estimate" bar, fog band; trial forecast later, ranges only | Total War: Warhammer III, Songs of Conquest | X | D §4; https://www.gamewatcher.com/news/total-war-warhammer-3-autoresolve-ambush-battles-withdraw ; https://steamcommunity.com/app/1142710/discussions/0/3934517363281030364 ; https://steamcommunity.com/app/867210/discussions/0/4411920838131986595/ |
| 78 | Hide the UI with a key; Home to the capital, Ctrl+Home to the pretender | H; Home, Ctrl+Home | Dominions | V | D §1.1; https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html |
| 79 | Avoid: tiny unlabeled icons | icon + label + value in panels | Dominions 6 complaint | X | D §1.2; https://steamcommunity.com/app/2511500/discussions/0/3807281445009631725/ |
| 80 | Avoid: non-standard mouse conventions | left selects, right moves | Dominions 5 review | X | D §1.12; https://explorminate.org/dominions-5-review/ |

### 8.4 Battle planning, reports and replay

| # | Pattern | In Fluid Magic | From | Check | Note §, source |
|---|---|---|---|---|---|
| 81 | Deployment box: circles for commanders, boxes for squads, color for orders; back on the left | `FormationField`, with glyphs as well as color | Dominions Army Setup | V | D §1.4; https://dmacguigan.github.io/dom6-manual/chapters/04-units.html |
| 82 | Army Setup is a full screen; deploy and script without switching | Battle Plan as a wide sheet | Dominions 6 | V (manual), X (players) | D §1.4, §3; https://dmacguigan.github.io/dom6-manual/chapters/04-units.html ; https://rpghq.org/forums/viewtopic.php?t=776 ; https://steamcommunity.com/app/2511500/discussions/0/3807281445020039925/ |
| 83 | Five scripted orders, then a default; limited scripting is part of the strategy | script timeline with "Round 6+ repeats slot 5" | Dominions | V (manual), X (forum) | D §1.5; https://dmacguigan.github.io/dom6-manual/chapters/04-units.html ; https://steamcommunity.com/app/259060/discussions/0/490123938437588666 |
| 84 | Copy scripts between commanders with Ctrl+digit | visible Copy and Paste to all casters | Dominions | V | D §1.5; https://dmacguigan.github.io/dom6-manual/chapters/04-units.html |
| 85 | Avoid: silent spell fallback and logs without modifiers | inline script warnings, log level 4 | Dominions | X | D §1.5, §1.10; https://steamcommunity.com/app/2511500/discussions/0/4849904427680840957/ |
| 86 | Summary first, then "View battle"; attacker on the left; four log levels; F1 unit list, F2 weather and scales; `v` per-unit log | report card, then Watch; rosters, log levels, condition chips, squad focus | Dominions Battles View | V | D §1.10; https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html |
| 87 | Battle messages in the upper-left action box | FM puts the log on the right (its own choice) | Dominions | V (per Judge 1) | https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html |
| 88 | Tab highlights every commander in a replay | hold C, or the Commanders toggle | Dominions 6 | X | D §1.10; https://forum.quartertothree.com/t/dominions-6-the-history-mythology-pulp-fiction-dark-fantasy-turn-based-strategy-game/159424 |
| 89 | Watch an auto-resolved battle afterwards | Watch from the report | Age of Wonders 4 | X | D §4.2; https://www.taptap.io/vn/post/5335749 |
| 90 | Named outcome bands | Decisive, Clear, Narrow, Pyrrhic | Total War: Warhammer III | X | D §4.1; https://totalwarwarhammer.fandom.com/wiki/Autoresolve |
| 91 | The chosen tactic shown beside each general | current script step beside each commander | HoI4 battle screen | X | P §10; https://hoi4.paradoxwikis.com/index.php?mobileaction=toggle_view_mobile&title=Combat_tactics |
| 92 | Casualties split into routed and killed; named battle phases | report and rosters; phase label | CK3 | X | P §10; https://www.thegamer.com/crusader-kings-3-how-does-the-combat-battle-system-work/ |
| 93 | Avoid: sluggish replay controls at high speed | responsive transport at every speed | Dominions 5 complaint | X | D §1.10; https://steamcommunity.com/app/722060/discussions/0/1621726179578427886/ |
| 94 | Flash limits | replay flash cap | WCAG 2.3.1 | V (standard) | U §11; https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold |

### 8.5 Pretender design, research, magic, onboarding, accessibility

| # | Pattern | In Fluid Magic | From | Check | Note §, source |
|---|---|---|---|---|---|
| 95 | One point budget (450 in Dominions); awakening trades arrival time for points (Dormant +150, Imprisoned +350) | budget bar | Dominions | V | D §1.6; https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html |
| 96 | Avoid: left-click to buy and right-click to sell; avoid a bless validated only at game start; avoid hotkey-only save and load | priced steppers, inline `validatePretender`, visible Save and Load | Dominions 5 and 6 | V (controls), X (complaints) | D §1.6; https://illwiki.com/dom5/bcnoexceptions-new-player-guide ; https://steamcommunity.com/app/2511500/discussions/0/4522261062769808325/ ; https://steamcommunity.com/app/2511500/discussions/0/4132682727132483639/ |
| 97 | A research queue players like | [Later] color queue | Dominions 6 | X | D §1.7; https://vaporlens.app/app/2511500/dominions_6_rise_of_the_pantokrator |
| 98 | Recast a ritual (Shift+m) | [Later] | Dominions | V | D §1.8; https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html |
| 99 | Avoid: a long, unsortable spell book | filter chips in the ritual list | Age of Wonders 4 complaint | X | X §9; https://steamcommunity.com/app/1669000/discussions/0/3826416272370395409/ |
| 100 | Avoid: tooltips that block clicks while researching spells | capped spell tooltips | Age of Wonders 4 review | X | X §9; https://www.mmorpg.com/reviews/age-of-wonders-4-review-2000127821 |
| 101 | Reactive advice after the tutorial; hints can be reset | blue Hint tier | CK3 | X | P §12; https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/ |
| 102 | The tutorial as an objective with "Tell me How" and "Tell me Why" | Learn section (Why only) | Victoria 3 | X | P §12; https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-51-tutorials |
| 103 | Ask the player's experience at the start | "How much guidance?" | Civ VI | X | U §8; https://twinfinite.net/guides/civilization-vi-tips-and-tricks-for-beginners/ |
| 104 | Avoid: a help system that repeats tooltips | every Codex page adds something | Old World critique | X | U §1; https://forum.quartertothree.com/t/old-world-pka-ten-crowns-from-soren-johnson/134746/1543 |
| 105 | A per-screen key overlay | `?` | Dominions | V (manual), X (wiki) | D §1.1; https://illwiki.com/dom5/hotkeys |
| 106 | A symbol, a letter and a hue per color | triple coding of W U B R G | Magic: The Gathering | X | U §5; https://mtg-archive.fandom.com/wiki/Mana |
| 107 | No information by color alone | §5.6 | Game Accessibility Guidelines, Xbox AG 103 | X | U §5; https://www.webbie.org.uk/blog/?p=115 ; https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/103 |
| 108 | A symbol-based color-blind mode | glyphs in particles, patterns in modes | ReCore | X | U §5; https://mcvuk.com/?p=62330 |
| 109 | Shake low by default; detail on by request | shake 50% default | Path of Exile complaint | X | U §3.5, §11; https://devtrackers.gg/pathofexile/p/9c4ded3b-why-does-horrible-options-like-screenshake-are-default-but-awesome-ones-like-advance-description-or-the-freaking-clock-arent |
| 110 | UI that stays sharp above 1080p | rem sizing, UI scale | Civ VII complaint | X | X §11; https://steamcommunity.com/app/1295660/discussions/0/591762405949782656/ |

**Removed from the draft's sources:** the Civ VI More Lenses mod (draft row 52). This session read
its README (https://raw.githubusercontent.com/astog/MoreLenses/master/README.md), and it describes
no Shift+number hotkeys. Shift+1 to Shift+6 now rests on the browser F-key constraint alone (row
55). Rows for dropped features (named groups, At destination, sound on alerts, six alert tiers)
are gone with the features.

---

## 9. Deviations, open items, tests and the build plan

### 9.1 Deviations from the current `docs/07-ui.md`

Record these in docs/07, which the Docs text below does.

1. **Layout.** The canvas fills the window. The docks, strip, ribbon and toasts are drawn over it
   at fixed anchors, and the camera never moves when a panel opens. The clock and speed controls
   move to the top right (EU4, Stellaris, HoI4). Population, dominion score and the Wellspring
   track join the top bar.
2. **One selection, one surface.** A province opens the left dock. A commander opens the bottom
   strip, and its panel opens on demand. docs/07 put the commander panel and the strip up
   together.
3. **Orders** move from the commander panel to the bottom strip. Build moves to the province
   Overview's building rows. Patrol is labeled **Guard**.
4. **Battle Plan:** formation and script on one wide sheet, replacing the separate Squads and
   Script sections.
5. **Map mode keys.** Shift+1 to Shift+6 are primary and F1 to F6 best effort, because browsers
   reserve F1, F5 and F6. A numbers-layer toggle is added.
6. **Right dock.** "Army list of selected province, messages" becomes the outliner plus the message
   feed. A province's army list moves to the province panel's Forces tab.
7. **Ritual panel.** It is docked as the commander's Rituals tab, with targeting on the map and a
   hop outline. It is not a modal. Clicking a valid target commits.
8. **Province panel.** Tabs: Overview (with effective scales), Recruit, Forces, History.
9. **New screens:** the Ledger (L) and the Codex (F). Settings gains Messages, Interface,
   Accessibility, Audio and Controls tabs.
10. **Messages.** Per-type display (Off, Log, Toast, Popup) and Pause. New kinds: `approaching`,
    `threatened`, `siege`, `breached`, `godless`, `pretender`, `eliminated`. The battle auto-pause
    is split into major and minor battles. The "research level complete" auto-pause stays
    toggleable.
11. **Battle replay.** The player's side is always on the left. A report card comes before the
    replay and serves as its end card. Four log levels, a scrubber with markers, round stepping,
    and cinematic mode. The digit keys 1 to 4 set 0.5× to 4×. The stage owns pacing.
12. **Keyboard.** Added: `+`/`−`, M, `` ` ``, N, J, V, L, F, O, P, I, T, H, Enter, `[`, `]`, `?`,
    Home, Ctrl+Home. C opens the selected mage's Rituals tab. Bindings are by physical key for the
    digit row.

**Dropped from the draft** (both judges, or one judge without objection):

| Dropped | Why |
|---|---|
| Floating pinned tooltip cards | no shipped strategy game has them (U §3.4); locks, pins and the Ledger cover comparing |
| Undo/redo while paused | it would rewrite the command log that saves and the hash rely on; reversals and inline confirmations cover M1 |
| Named commander groups | stack clicks, box-select, N and pins are enough for a few dozen commanders |
| Six alert tiers and the purple Situation tier | EU4's three plus Hint; the Wellspring race lives on the top-bar track |
| UI and alert sounds; music slider | docs/10 puts sound out of scope; the owner's direction covers battle SFX only |
| Ledger Forts tab | M1 has only capital forts; fort data became Provinces columns |
| Rebinding UI; runtime banner-color picker | a read-only binding table, the `?` overlay and the palette test remain |
| Tooltip settings (key-only mode, lock choice, lock-timer slider, nested on/off, always detailed, `Shift+T`, auto priest lens) | Rulings 2 |
| Battle Plan "At destination"; Codex "Show where this appears"; Learn "How" highlighting | each needed a UI-anchor highlighting system |
| Codex rule pages with worked examples; recent searches | concept pages carry the formulas in words |
| Greyscale screenshot test | needs a browser runner; the developer filter toggle remains |
| Animated menu background, thumbnails, "Cinematic when idle", Ctrl+C/V on a hovered script, Shift+←/→ event stepping | cosmetic, or a clash with browser keys or with Shift's meanings |
| `checkCommand` and `checkPretender` | `validateCommand` and `validatePretender` supply the one reason shown |

### 9.2 Open items that need sim support (not UI-only)

| Item | Why | Priority |
|---|---|---|
| Trace sinks and `explain*` wrappers, with the property test | principle 3; every L1 breakdown | M1 (Phase 8) |
| `ProvinceOverride` what-ifs | previews without clones | M1 (Phase 8) |
| Incursions (`incomingThreats`, `updateIncursions`, `APPROACH.quietDays`) and the new message kinds with `refs` | the pause rule, the feed, the alert, links | M1 (Phase 8) |
| `armyPower` moved into the sim | the engagement preview and the AI share one number | M1 (Phase 8) |
| `supplyAfterArrival`, `scriptCheck`, `predictRitual`, `summarizeBattle`, `pretenderReading` | sections 2.8, 3.3, 3.5, 4.2 | M1 (Phases 8 and 9) |
| Research queue of colors | Dominions 6's best-liked change | Later |
| Repeat recruitment per fort | Dominions 5 and 6 have it; a UI loop would break "the AI uses the same commands" | Later |
| Recast a ritual monthly | Dominions' Shift+m | Later |
| A trial forecast in a Web Worker with UI-owned seeds and a visible-knowledge setup | ranges, never a point | Later |
| **[Phase 9b]** `officerStats`, `captureOdds`, `ransomPrice`, `fieldCap`, `postEffect`, `postCandidates`, `openProposals`, the six officer message kinds, and the `proposals` list on `GameState` | the Court, the two button alerts and the Commander panel rows (section 3.6b); `three-kingdoms.md` section 3.9 lists the state and commands | Phase 9b, after the playtest gate |

### 9.3 Build plan by phase

| Phase | UI work from this spec |
|---|---|
| 8 Map and core UI | `src/content/ui.ts`; tokens and primitives (§6.1); `Tip` with value, entity and action tooltips, timing, Esc, the Shift state machine; trace sinks, `explain*` and overrides; `TopBar` with breakdowns; clock, speed, auto-pause, reason chip and popup queue; alerts ribbon with the M1 types; outliner sections 2 to 10; message feed; incursions and message kinds; the overlay layout and fixed anchors; left dock with the Province panel (Overview with scales, Recruit, Forces); bottom strip with the order bar and Guard; Commander panel Overview (on demand) with Give mana; map with six modes, the numbers layer, labels with the density budget, badges by exception, stacks, move preview, cursor label, waypoints, engagement preview with `armyPower`; concepts content skeleton; the read-only binding table; a minimal battle popup (message text and Jump) until Phase 9's report card |
| 9 Remaining UI | Nested concept tooltips and the Codex; the Battle Plan sheet (`formationLayout`, script timeline, `scriptCheck`, presets, copy and paste); the Rituals tab and targeting (`predictRitual`, hop outline, targeting pause, commit on click); the Research modal; the Ledger (five tabs); Settings (six tabs, the message matrix); Main Menu, New Game, Pretender Design (`PretenderCard`, `pretenderReading`, per-step `validatePretender`), Game Menu and save/load, Victory; `summarizeBattle`, `BattleReport` and summary capture; onboarding (guidance, hints, Learn with Why); History tab |
| 9b Officers prototype **[Phase 9b]** | The Court modal (three tabs on `LedgerTable<T>` plus `PostCard`), the Prisoner taken and Officer proposal alerts with their buttons, the Commander panel's stats, traits, rank, bonds and post rows, the Ledger's officer columns, the top-bar officers readout, the "Officer events" auto-pause toggle, key K, the officer Codex pages (stats, traits, posts, Ascendancy), and the duel and capture captions in the replay frame; built as one commit with the sim side of `docs/10` Phase 9b |
| 10 Replay viewer | The replay frame (§4.3) around the presentation's `BattleStage` with the §4.4 contract; scrubber and seek requests; captions; shared gore, shake and volume settings |
| 12 Balance and polish | playtest the pause defaults (research level, the battle split), tooltip delays, alert noise, the Idle alert window, and the map width at 1280; [Later] items as time allows |

### 9.4 Tests this spec adds

All are cheap unit tests under `tests/` (CLAUDE.md: the UI gets smoke tests only where cheap). Each
layout test runs a pure layout function, so none needs a browser.

| Test | File | Checks |
|---|---|---|
| Breakdowns match selectors | `tests/sim/explain.test.ts` | random states: every `explain*` total equals its selector within 1e-9; the last term's `running` equals the total |
| Overrides | `tests/sim/selectors.test.ts` | `provinceEconomy` with an empty override equals the plain call; with `{ taxRate }` it equals the value after `setTax` is applied to a copy |
| Preview cost | `tests/ui/derive/previews.perf.test.ts` | each preview under 2 ms (median of 50) on the 4-nation Medium fixture |
| Incursions | `tests/sim/visibility.test.ts` | a 3-commander group 4 provinces deep posts 1 `approaching` and at most 1 `threatened` per defended target; a new incursion after `APPROACH.quietDays`; hidden enemies post nothing |
| Fog guard | `tests/ui/derive/fog.test.ts`, `tests/sim/visibility.test.ts` | hidden enemy changes leave derive outputs and `incomingThreats` unchanged |
| Summaries outlive records | `tests/ui/derive/battleSummaries.test.ts` | after 21 player battles, the first has a summary and no record; its report renders and Watch is disabled |
| Label density | `tests/ui/derive/mapLabels.test.ts` | Medium seeds 1 to 5, fit zoom, 1280x720: no label overlaps another label or a badge; at least 90% of names visible |
| Battle Plan budget | `tests/ui/derive/formationLayout.test.ts` | 640 px wide, 3 commanders × 5 squads in every row distribution: no overlaps, boxes inside their columns, lanes at most 84 px, total height at most 556 px |
| Unobscured area | `tests/ui/layout.test.ts` | the section 2.1 budget table, computed from the layout constants |
| Depth audit | `tests/ui/depth.test.ts` | every path in section 1.5 exists in the panel routes and takes at most 4 steps |
| Bindings | `tests/ui/derive/bindings.test.ts` | no duplicates per context; no reserved keys; digit row by `code`; every action has a visible button |
| Shift state machine | `tests/ui/derive/shift.test.ts` | Shift then click is not "alone"; 250 ms alone gives "more"; with a selection no numbers layer; Toggle mode toggles only on a lone tap |
| Pauses and popups | `tests/ui/derive/pauses.test.ts` | major and minor battle split; coalescing per day; queue order |
| Concepts | `tests/content/concepts.test.ts` | every referenced concept id exists; added to the content validation fixtures |

### 9.5 Not verified

- The four research notes were built from search extracts, except the Dominions 6 manual, which
  the Dominions note read from its source files. Treat quoted wording elsewhere as approximate.
- The Paradox claims marked [U] in section 8 could not be re-checked. In this session
  ck3.paradoxwikis.com, forum.paradoxplaza.com and stellaris.fandom.com failed DNS lookup, and
  the web-search budget was used up. The [U] claims are: CK3's N, pin key, Z/X and red pause
  bar; Stellaris's O; EU5's tiers, conditional dismissal and "why not" blocks. docs/07 states
  none of them as fact.
- Total War: Warhammer III's campaign army panel, pre-battle balance-of-power screen and results
  screen are described in `research-fourx.md` §12 from memory, marked unverified, and are not
  relied on here. Only the cited Total War facts in `research-dominions.md` §4.1 are used.
- Whether Chrome and Firefox let a page capture F1 and F6 today must be tested before any F-key
  binding is kept.
- `navigator.keyboard.getLayoutMap()` is available only in Chromium browsers. Elsewhere the key
  labels fall back to US names, which can be wrong on AZERTY for physical keys.

---

## Docs text

The blocks below are the exact text to write into the repository. The first replaces
`docs/07-ui.md` in full. The others replace or add the named sections of other docs. Nothing here
has been written to the repository.

### `docs/07-ui.md` (replace the whole file)

````markdown
# UI and Screens

Desktop first, 1280x720 minimum, 1920x1080 target. Dark UI chrome with the map as the hero.
Panels are DOM drawn over a full-window Pixi canvas. Every number that matters is visible
without a click: population, supply, gold, materials, mana, unrest.

This document was rewritten on 2026-10-21 to follow the project owner's direction: "Make sure
the UI matches those of similar games; where complexity is tastefully layered under smart menu
design." It also gives the battle replay a frame for the owner's earlier direction that battles
be visceral, with detail and sound effects. The battle presentation itself is designed
separately. The rewrite keeps every earlier decision that still holds:
- the five screens and the New Game choices
- the three-column Pretender Design
- province and commander panels in the left dock
- the bottom commander strip
- the map's fills, bands, candles, labels, badges and six overlays
- Research as a five-column modal on R, and C for casting
- the speeds and Space to pause
- the auto-pause events, with "research level complete" still toggleable
- the replay's three rows per side
- Tab to cycle commanders, Ctrl+S to save, Esc to close
- symbols beside every color
The changes, and why each was made, are listed at the end. Precedents are cited from other
games' official pages, wikis, manuals and reviews. A claim marked (unverified) could not be
checked against its source and is never relied on alone.

## Principles

1. **Five layers, one gesture apart.** L0 glance (top bar, ribbon, outliner, map labels, badges,
   strip). L1 hover (tooltip with a breakdown). L2 concept (a nested tooltip on a dotted term, at
   most 3 deep). L3 panel (the bottom strip or the left dock). L4 screen (Research, Ledger,
   Codex, Settings, replay, Pretender Design). Every tooltip ends with a dim footer naming the
   next gesture: `Shift more · T lock · Click open · Ctrl+click Codex`.
2. **Decisions on the surface, explanations underneath.** Costs, ETAs, supply after a move,
   projected unrest and strength estimates are printed where the player chooses. Tooltips explain
   why a number has its value. They never hold the only copy of a number the player decides on.
3. **One number, one source.** Every number comes from a sim selector. A breakdown is that
   selector run with a trace sink. A preview is that selector run with a what-if override. The UI
   never recomputes a formula.
4. **Shallow menus, one home per command.** The bottom strip holds a selected commander's
   standing orders. The left dock holds province actions (tax, PD, build, recruit) and planning
   editors (Battle Plan, rituals, Give mana). The right dock holds lists. Nation screens are
   top-bar buttons. Other places may link to a command's home, never duplicate it. Every decision
   surface is at most 2 clicks from the map, and committing takes one more, so no path is longer
   than 4 clicks. A dock panel has at most 4 tabs. One modal is open at a time. Every hotkey has a
   visible button, and nothing is reachable only from a notification.
5. **Conditions, not chores.** Alerts are conditions computed from state, and they disappear when
   resolved. Events go to the message feed. The game pauses for a threat before it arrives,
   because battles resolve the instant armies meet. It pauses only for threats to own troops, a
   fort or the capital, so pauses stay rare and predictable.
6. **Never hue alone.** Each color is shown by hue, glyph and letter. Every state shown by color
   also has a shape or a pattern. In panels an icon always comes with a word or a number.
7. **Disabled things explain themselves.** A blocked action stays visible, and its tooltip shows
   the reason `validateCommand` returns. Sections that do not apply yet are collapsed with a
   one-line unlock hint, never removed.
8. **The map is the hero, and in a replay the stage is.** Chrome is quiet and collapsible, and it
   is drawn over a canvas that never resizes for panels. Mana colors appear only on things that
   carry that identity. The replay uses the same components, keys and settings as the rest.

### Depth audit (the deepest paths, counted from the map)

| Task | Path | Clicks |
|---|---|---|
| Move | select → right-click | 2 |
| Tax, PD, build a temple | select province → control | 2 |
| Recruit | select fort → Recruit tab → unit card | 3 |
| Order (Guard, Pillage, Research, Preach, Claim) | select commander → order | 2 |
| Make Prophet, Storm with walls standing | select → button → inline confirm | 3 |
| Script a spell | select → script summary → slot → spell | 4 |
| Cast a ritual | select mage → Cast (C) → ritual row → target on the map | 4 |
| Give mana | select mage → Enter → Give mana → Give | 4 |
| Set research | R → Research this | 2 |

## Game screen layout

```
+------------------------------------------------------------------------------------------+
| TopBar 44: [Nation] Pop Gold Materials | W U B R G | Research Dominion Wells | [R][L][F][=] Clock Speed |
+------------------------------------------------------------------------------------------+
| Left dock      | [alerts ribbon, fixed x]                       [toasts] | Right dock     |
| (province, or  |                                              [pause chip] | Outliner       |
|  commander     |              MAP (full-window Pixi canvas)              | -------------- |
|  panel on      |                                                         | Message feed   |
|  demand)       |                                                  [mode  |                |
|                |                                                  column]|                |
+-------------------------------------------------------------------------+                |
| Bottom strip (a commander is selected): portrait | squads | script | orders | ETA |        |
+------------------------------------------------------------------------------------------+
```

- **The canvas fills the window and resizes only with it.** Docks, strip, ribbon and toasts are
  DOM over it. Opening a panel never moves the camera, so a second click lands where the player
  aims. The go-to button centers a selection in the unobscured area.
- **Sizes.** Wide (1600 px and up): left dock 360, right dock 300, strip 128. Narrow (1280 to
  1599): left dock 320, a 48 px right rail whose Outliner and Feed icons open 300 px flyouts,
  strip 120. All sizes are in `rem` and grow with UI scale.
- **Fixed anchors:**
  - The alerts ribbon sits under the top bar at x = left-dock width + 12, whether or not the
    dock is open.
  - Toasts are right-aligned against the right dock or rail, under the pause-reason chip.
  - The map-mode column sits at the bottom of the map's right edge.
  - The strip runs from the left edge to the mode column. When it shows, the dock's bottom rises
    to meet it.
- **Unobscured map at 1280x720** (map area 1280 × 676 under the top bar):

  | State | Unobscured area |
  |---|---|
  | nothing selected | 1192 × 676 |
  | a province selected | 872 × 676 |
  | a commander selected | 1192 × 556 |
  | a commander and its panel | 872 × 556 |
  | the Battle Plan sheet | 552 × 556 (opened on purpose, closed with Esc) |

- `[` and `]` collapse the docks, and `H` hides all chrome except the clock (as Dominions' `h`
  does). Panels appear on the next frame, with no slide-in animation.

### One selection, one surface

| Selection | Opens | On demand |
|---|---|---|
| Province (click its area) | left dock: Province panel | — |
| One own commander (badge, fanned badge, outliner row) | bottom strip | Commander panel: Enter, the strip portrait or script summary, a double-click on the badge |
| Several own commanders (stack click, Shift+click, Shift-drag box) | strip with compact cards and shared orders | Battle Plan for all of them: Enter, or the script summary |
| Another nation's or an independent army | its province's Forces tab | — |

A commander's squads appear only in the strip. The dock header is `[<] Kharnath > Varo the Ember
[go-to] [pin] [Codex i] [x]`. The back stack steps through earlier panels. Each opener names its
tab: the portrait and Enter open Overview, the script summary opens Battle Plan, and C opens
Rituals. The Province panel remembers its last tab.

### Top bar

| Readout | L0 | Tooltip | Click |
|---|---|---|---|
| Nation button | banner, pretender mini-portrait | pretender state, Godless state, the five national scales | Ledger, Nations |
| Population | `84.2k ▲0.3k/mo` | growth, top provinces, recruits waiting, pillage losses | Population mode |
| Gold | `1,240 ▲38/mo` | income by province (top 5 then others), plunder, upkeep by commander, net, "At this rate: 1,278 in 30 days" or "Empty in 23 days" | Ledger, Provinces by gold |
| Materials | `212/360 ▲60/mo` (capital pool / cap) | own production, neighbor shares, cap, overflow, besieged | capital Recruit tab |
| Mana W U B R G | symbol, stock, `▲n/mo` per color, always in place | springs, Wellsprings, dominion tint, Rot bonus | the caster's Rituals tab, or Ledger, Magic |
| Research | color symbol, `L3 ▸ 47d`, hairline bar | each researching mage, RP/mo, next unlocks | Research (R) |
| Dominion | candle and score | score terms, checks per source, expected pushes | Dominion mode |
| Wellsprings | `◆◇ 1/2` and a "1 short" badge when anyone is one claim from winning | every Wellspring, claims, every nation's count | centers the next Wellspring |
| Screen buttons | Research R, Ledger L, Codex F, Menu Esc | name and key | opens the screen |
| Clock | `Y1 M3 D14`, hairline to month end | "Dominion spreads and Godless is checked in 16 days. Every other rate is paid daily: today +1.3 gold, ..." | speed presets |
| Speed | pause and four pips | keys | sets the speed |

Every monthly rate is paid daily as rate ÷ 30 (docs/01). Only the dominion spread and the Godless
check happen on the month's last day, so the hairline is a monthly-events timer. Breakdown rows
that name a province or commander are links. Below 1600 px the mana slots drop their rates and the
screen buttons show icons only.

### Clock, speed and pausing

- Speeds: Paused, 1, 2, 3, 4 at 1, 2, 4 and 8 days per second (docs/01). Space pauses. The digit
  keys 1 to 4 set the speed, and + and − step it. Every order works while paused.
- Paused looks paused on three channels: a red tint, the word PAUSED, and hatched pips.
- After an auto-pause a chip under the clock names the cause (`Paused: Battle at Ashfen ▸`).
  Pauses on one day coalesce (`Paused: 3 events ▸`). Several popups on one day queue, one card at
  a time with `Next (2 more)`.
- Nothing auto-resumes by default. A setting, off by default, resumes after closing an auto-pause
  popup.
- Opening Research, the Ledger, the Codex, Settings or the replay pauses the game, and so does
  entering ritual targeting. Closing, committing or cancelling restores the speed that was active
  before. Pause state is UI state and never enters `GameState`.

### Alerts ribbon

Alerts are conditions computed by pure functions, one icon per type with a count. There are three
urgency tiers plus hints, each with its own shape: **Urgent** (red octagon), **Important** (yellow
triangle), **Opportunity** (green circle), **Hint** (blue square with "i"). EU4 uses red, yellow
and green alerts at the top left
([EU4 wiki](https://eu4.paradoxwikis.com/Ingame_screen)).

| Alert | Tier | Condition |
|---|---|---|
| Army starving | Urgent | own troops stand where supply used exceeds supply |
| Troops unpaid | Urgent | unpaid upkeep, or the treasury empties within 30 days |
| Fort besieged | Urgent | an own fort is besieged |
| Hostile armies inbound | Urgent | a visible enemy leg ends at own troops, an own fort or the capital |
| Godless | Urgent | `isGodless` |
| Recruiting blocked by unrest | Important | an own fort above 50 unrest |
| Enemy dominion in your land | Important | an own province dominated by another nation |
| Capital dominion falling | Important | capital own dominion at most 2, or held by another nation |
| Idle commanders | Important | order Idle (not Guard), not in transit, and either just arrived or finished (within 5 days) or a mage or priest |
| Materials at cap | Important | a fort's pool at its cap |
| No research | Important | no research points, a maxed color, or a color with no M1 spells |
| Script cannot cast | Important | `scriptCheck` fails |
| Wellspring claimable | Opportunity | an owned, unclaimed Wellspring |
| Prophet available | Opportunity | no prophet and the wait is over |

The ribbon behaves this way:
- Hovering an alert lists every case as a link with its reason.
- A left-click goes to the first case, and repeated clicks cycle.
- A right-click dismisses the alert until its condition clears and returns.
- Shift+right-click mutes the type for the game. Restore it from the outliner or from Settings.
- `J` jumps to the newest alert or message, and repeated presses step back 8 deep.

Thresholds live in `src/content/ui.ts`.

### Outliner (right dock, top)

Collapsible sections with counts. Empty sections hide, and `O` toggles the outliner.
- **Learn:** first games only.
- **Pinned:** `P` or the header pin.
- **Armies:** grouped by province. Idle armies sort first.
- **Mages:** Researching, Casting, Idle.
- **Priests:** Preaching, Claiming, Idle.
- **Scouts.**
- **Provinces with problems.**
- **Activities:** sieges, rituals, recruitment, construction, claims.
- **Wellsprings.**
- **Muted alerts.**

Each commander appears in exactly one section. The pretender and the prophet carry crown and halo
badges. A row reads `[portrait] Name · [order] · 48 troops · [status glyphs] · 4d`. The rows
behave this way:
- A click selects and shows the strip. A double-click also centers the camera.
- A right-click opens the context menu: orders, Pin, Open in Codex.
- A row is a drop target for squad transfers.
- `N` goes to the next idle commander, skipping those on Guard.

### Messages (right dock, bottom)

- **The feed:** each row has an icon, a date, text with entity links, and buttons that appear on
  hover (Jump, Watch while the battle's record is kept, and a gear that opens the type's
  settings).
- **Filters:** All, Battles, Military, Economy, Magic, Dominion.
- **Grouping and dismissal:** repeats within 5 game days merge into one row. A right-click hides
  a row.
- **Retention:** the feed holds every kept message (300 per nation).
- **Per type:** a display (Off, Log, Toast, Popup) and a Pause checkbox, set in Settings →
  Messages or from the gear.

Defaults:

| Type | Display | Pause |
|---|---|---|
| Battle, major: lost, against a nation, or involving the pretender, prophet, capital or a Wellspring | Popup (report card) | yes |
| Battle, minor: won against independents | Toast with Watch | no |
| Province lost | Popup | yes |
| Threat (`threatened`): a visible enemy heads for own troops, a fort or the capital | Toast | yes |
| Incursion (`approaching`): visible enemies head into own land | Toast | no |
| Wellspring claimed (any nation), Godless | Popup | yes |
| Pretender arrives or is recalled; research level reached (toggleable, as before); walls breached | Toast | yes |
| Siege laid or lifted, province captured, enemy sighted, ritual done, nation eliminated | Toast | no |
| Dominion flipped, starvation, recruits complete, building complete | Log | no |
| Victory or defeat | victory screen | always |

**Incursions.** An enemy nation's incursion opens when one of its visible commanders' current leg
ends in the player's land, and it closes after 10 quiet days (`APPROACH.quietDays`). `approaching`
posts once per incursion. `threatened` posts once per defended target per incursion. Commanders of
one nation reaching the same target on the same day share one message. These sim messages
(docs/01 §14) also feed the ribbon alert and province History.

## Province panel (left dock)

**Header:**
- name, terrain, owner banner, dominion candles grouped by 3
- building slots for Fort, Temple and Lab: filled when built, outlined when missing
- a Wellspring badge and the spring symbols

**Hero row:** population, large, with its growth.

**Stat rows**, each with a breakdown:
- Gold
- Materials, and the fort that receives them
- Supply, used over available, with each commander's consumption
- Unrest, with a projection (`34 ▲4/mo → 46 in 3 mo`)
- Mana
- **Scales:** five two-pole bars at the effective step `round(scale × strength / 10)`. Hovering
  names the dominating nation, its strength, and the Wellspring's step. Dominions shows a
  province's scales wherever you hold dominion
  ([manual, ch. 2](https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html)).

**Tabs:**
- **Overview:**
  - Tax selector Low / Normal / High. Hovering a segment previews its effect: "High: +10.9
    gold/mo, +4 unrest/mo".
  - PD +1, with its price; Shift+click buys 5.
  - Building rows. This is Build's only home. A row reads "Built", or "Building: 12 days", or
    `Build · 150 gold · by Varo ▾`.
  - The Wellspring banner, and active ritual effects.
  - The siege block: walls, daily rates, days to breach, and `Storm ▸`, which selects the
    besiegers and lights Storm in the strip.
- **Recruit** (forts only):
  - Commanders above and troops below, each cheap to expensive, as in Dominions
    ([manual, ch. 4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)).
  - Unit cards with gold, materials, days and population, and a batch stepper (1 to 50, default
    10).
  - A click queues a batch, and Shift+click queues the largest affordable one.
  - A blocked card is dimmed with its reason.
  - The queue lists each item's progress, days, a cancel ×, and the reason it waits.
  - A pool line: `Materials 52 / 360 · ▲60/mo · full in 5 mo`.
- **Forces:**
  - Own commanders as cards.
  - Garrison squads, draggable onto a commander.
  - The PD force.
  - Visible other forces: exact numbers, or the fogged strength word.
- **History:** this province's messages.

A foreign or independent province shows read-only tabs. Unexplored values read "unknown", never 0.

## Commander panel and Battle Plan (left dock, on demand)

**Header:** portrait with a pip ring, name, type, badges, HP, morale, location or transit.

**Tabs:**
- **Overview:** stats with breakdowns (HP, morale with its penalty rows, leadership `45 / 60
  troops`, map speed, supply eaten, upkeep, pips, holy pips, carried mana, research rate,
  dominion checks), the current order's progress, and **Give mana**. Give mana is enabled only in
  an own lab, and opens a color and amount popover.
- **Battle Plan:** while this tab is active the dock widens to 640 px (narrow) or 720 px (wide)
  over the map.
  - **Formation field:** lanes are commanders, and the columns are `rear | middle | front`, left
    to right. Commanders are circles and squads are boxes, as in Dominions' Army Setup
    ([manual, ch. 4](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html)). A
    circle shows its first stance by glyph and color.
  - **Drags:** dragging a box between columns sets its formation. Dropping it on another circle
    transfers it, with a count prompt that has a Half button. A drop that breaks leadership is
    refused with the reason.
  - **Whole army here:** shows every own commander in the province. It is on when more than one
    is present.
  - **Script timeline** for the focused commander: `[R1]…[R5] [Round 6+: repeats slot 5]` (when
    slot 5 is Retreat the cell reads `Round 6+: default`, per docs/04). Each
    slot is Cast (a spell, or Best available), Attack, Hold or Retreat. Spells show their fatigue
    for this caster. Locked spells are listed with their reasons.
  - **Warnings:** a slot that cannot cast turns amber with the reason, and a one-click fix where
    one exists. A fatigue strip shows rounds 1 to 5 against the 100 line.
  - **Presets:** Auto, Artillery, Support, Stand fast, Charge. The visible **Copy** and **Paste
    to all casters here** buttons replace Dominions' Ctrl+digit, which is a browser key.
  - **Budget at 1280x720:** the sheet is 640 × 556. It shows three 84 px lanes before the field
    scrolls, plus the script area. No ghosted enemy side in M1.
- **Rituals** (mages, key C): see Rituals below.

With several commanders selected, the panel shows the totals (`3 commanders · 112 troops · speed
2 (Thornwood Archers)`) and the Battle Plan only.

## Bottom strip (selected commanders)

`portrait | squad cards | script summary | order bar | ETA`
- **Portrait:** opens the Commander panel.
- **Squad cards:** count, an HP bar, a morale bar (separate hue and pattern), the row glyph and up
  to 3 status icons.
- **Script summary:** five glyphs and a repeat marker, with a ! badge on a slot that cannot cast.
  A click opens the Battle Plan.
- **Orders:** Idle, Guard (the sim's patrol order: "holds here on purpose; no economic effect in
  M1"), Pillage, Research, Preach, Claim Wellspring, Cast ▸ (opens the Rituals tab), Make Prophet,
  Reverse, Storm.
  - Each order's hover shows its effect per day here.
  - Claim, Storm and Research appear only where they apply. Every other blocked order stays
    visible with its reason.
- **ETA box:** destination, days, arrival date, Reverse (V).
- **Several selected:** compact cards, the shared orders, the slowest ETA.

## Map

### Drawing
- Provinces are filled polygons: terrain color with a subtle noise texture and a 2 px border.
- The owner's banner forms an inner band with a keyline (docs/09). Independents have none.
- Draw order from the bottom: fills, noise, borders, bands, mode overlays, labels, numbers chips,
  paths, badges, transit arrows, selection rings, battle markers.
- The province tooltip and cursor label are DOM placed from Pixi coordinates.

### Modes
- **The six modes:** Ownership, Dominion, Supply, Unrest, Population, Mana springs. Keys:
  Shift+1 to Shift+6 (digit-row physical keys). F1 to F6 are a best-effort extra, because
  browsers reserve F1, F5 and F6. `M` and `Shift+M` cycle.
- **How a mode draws:** it tints fills only, so borders, bands, badges and labels stay at full
  contrast. Each mode has a second channel besides hue: wheat glyphs, hatch density, candle
  numbers, spring symbols.
- **Mode column and legend:** a vertical column of mode buttons sits at the map's bottom right,
  with a legend chip above it. The province tooltip leads with the active mode's value.
- **Numbers layer:** `` ` `` or the # button puts one chip per province with the active mode's
  value. It is a toggle, like Dominions' capsule overlay (Ctrl+4 there)
  ([manual, ch. 2](https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html)).
- **Contextual modes:** move targeting hatches unreachable provinces. Ritual targeting outlines
  the provinces within the ritual's hop reach (by adjacency, never a circle), dims the rest,
  labels valid targets with their predicted effect, and hatches invalid ones.
- **Nothing is zoom-gated.** Every mode works at every zoom.

### Labels and the density budget

Zoom bands come from the median province's on-screen diameter: Far under 70 px, Mid 70 to 180,
Near above 180. The game starts at the zoom that fits the whole map, which is Mid on Medium at
1280x720.
- **Far:** names only, culled by priority (capitals, Wellsprings, own provinces, then the rest),
  and one badge per nation per province.
- **Mid (default):**
  - Line 1 is the Wellspring glyph and the name.
  - Line 2 appears only when needed: a compact dominion chip (candle glyph and strength in the
    banner color) and at most 2 problem glyphs (unrest fist from 25, solid above 50; siege ram).
  - At most 96 × 30 px per label, and badges never overlap labels.
- **Near:** adds the population bar, building icons, spring symbols, ritual-effect glyphs and the
  full candle stack.
- Holding Shift alone with nothing selected shows the numbers layer while held.

### Army badges
- **Shape by allegiance:** rounded shield for own armies, notched shield for other nations, plain
  shield for independents.
- **Count and status:** the badge shows the troop count and at most one corner glyph, only by
  exception: starving, tight supply, unpaid, besieging, casting, pillaging. A fed army that is
  moving or guarding shows none.
- **Stacks:** one badge per nation, with a `×n` count. It fans out on hover. A click selects the
  whole stack, and a click on a fanned badge selects one commander. Shift+click adds, and
  Shift-drag box-selects.
- **Moving armies** slide along the edge with an arrow and an ETA. Visible enemies show their
  current leg only.
- **Battle markers:** crossed blades stay for 30 days and open the report card.

### Moving
- **Path preview:** with commanders selected, hovering a province draws the path from
  `findPathFor` with cumulative days.
- **Cursor label:** it sits beside the cursor, never over the target, and prints the ETA, the
  arrival date, supply there, and the hostile strength with an "Estimate" ratio. Where there is
  no path it says why.
- **Right-click** moves, and attacks on a hostile province. Right-click on the army's own
  province cancels the move.
- **Waypoints:** Shift+right-click appends one. Only the last province may be hostile.
- **Reverse:** `V`.
- **Groups** take the slowest speed, and the label names the slowest unit.

### Province tooltip and engagement preview
- **The province tooltip:**
  - the active mode's value first
  - name, owner, terrain
  - population, supply used over available, materials, unrest
  - springs, the dominion holder and the effective scales
  - buildings and effects
  - defenders, as the fogged word or exact numbers
- **The engagement preview:** with commanders selected over a hostile province, the cursor label
  grows into one. It shows both sides as mini cards (the enemy as seen, or a fog band), modifier
  chips, and a strength bar labeled "Estimate" from `armyPower`. Each caster's first two slots
  get a check. The resolver is not run for a forecast in M1.

### Fog
- **Unexplored provinces:** terrain silhouettes under a parchment haze, with a dotted border.
- **Out of sight:** a desaturated fill and a dotted border.
- **Fogged values** read "unknown" or a strength word, never 0.

## Research (modal, key R)

- **Layout:** five columns, one per color. Each shows levels 1 to 6, a progress bar, the days to
  the next level, and spell cards with "Castable by N of your mages". Points past level 6 are
  lost.
- **Choosing a color:** clicking a header or "Research this" sets the active color. The active
  column is outlined and labeled ACTIVE.
- **RP breakdown:** the header's RP/month lists each researching mage on hover.
- **W, U and B in M1:** these columns read "Spells arrive in M2", and their button is disabled
  with that reason.

## Rituals (the Commander panel's Rituals tab, key C)

- **Docked, not a modal**, because targeting happens on the map.
- **Rows:** each lists the requirement, the cost in MTG notation (colored pips, then generic),
  the days, the reach and a one-line effect. Filter chips sit above them, and locked rituals
  sit under "Show locked", each with its reason.
- **Payment:** the generic split defaults per docs/02. **Edit** changes it before targeting.
  "Pool after" updates live.
- **Targeting:** clicking a row that takes a target enters targeting mode and pauses the game.
  - The map shows the hop reach and each target's predicted effect.
  - The cursor label prints the cost, the days, the pool after payment and "Mana is spent now;
    another order, a retreat or death loses it".
  - A click on a valid province commits. Esc cancels.
- **Self-targeted rituals** have a Cast button instead.
- **In progress:** a bar shows the days left. Stop confirms inline that the mana is lost.

## Ledger (modal, key L)

One sortable, filterable screen with five tabs, as EU4's Ledger
([EU4 wiki](https://eu4.paradoxwikis.com/Ledger)) and Dominions' F1 overview are:
- **Provinces:** every economic column. Fort provinces add their pool, cap, queue and siege.
  Inline: tax and PD +1.
- **Commanders:** role, order, troops, HP, morale, supply and script state, upkeep.
- **Magic:** mana sources, rituals in progress, and every active effect seen.
- **Battles:** every battle fought, from the kept summaries. Watch is offered while the record
  is kept.
- **Nations:** the pretender card, scales and bless. Other nations show public facts only.

Top-bar readouts open the matching tab, already sorted.

## Pretender Design

The layout and rules are in `docs/05-pretender.md`, with these UI rules:
- **Layout:** three columns (chassis list; pips, dominion and scales; live summary card), preset
  buttons at the top, and Start Game.
- **Steppers print their prices** from the sim (`pipStepCost`, `scaleStepCost`). The plus button
  shows the next step's price. Base pips carry a lock.
- **Scales** are two-pole sliders that print each step's price and effects. A step against the
  nation's colors shows a warning glyph.
- **Validation:** each control runs `validatePretender` on the design its click would produce,
  and is disabled with the reason when that fails. Unlike in Dominions, an invalid bless or
  design is never reported only at game start.
- **Live consequences:** the bless line, the dominion estimate and the arrival date update on
  every change.
- **Presets** show their reading and their cost from `designCost` on hover. Save and Load are
  visible buttons.
- **Unspent points:** Start Game with unspent points confirms inline.

## Other screens

- **Main Menu:** Continue (with nation, date, size and slot on the button), New Game, Load,
  Settings, Codex, About.
- **New Game:**
  - map size (Small 40 / Medium 60 / Large 80), seed (typed or random)
  - nation cards with color symbol and summary
  - opponents (1 to 3 AI, each with a nation or Random; M1 allows duplicates)
  - AI difficulty (Easy, Normal)
  - guidance (Guide me / Hints only / Off)
  - then Pretender Design
- **Victory/Defeat:**
  - the result and its reason
  - stats: provinces held, battles won and lost, population under rule, provinces taken,
    Wellsprings, mana spent per color
  - every battle fought, with its report
  - View map (read-only), New game, Return to Menu
- **Settings** (six tabs):
  - **Game:** speed presets, pause on modals, resume after popups, autosave, reset confirmations.
  - **Messages:** the per-type matrix and muted alerts.
  - **Interface:** UI scale, text size, tooltip delay or Off, detail key Hold or Toggle,
    guidance, reset hints.
  - **Accessibility:** reduced motion, screen shake, gore, captions, pattern overlays,
    high-contrast borders, letters on mana symbols.
  - **Audio:** master and battle SFX. M1 has no music and no UI sounds.
  - **Controls:** a read-only key table.
- **Game Menu** (Esc): Resume, Save, Load, Settings, Codex, Quit. Saving uses 3 slot cards plus
  autosave. Overwrite, load and quit with unsaved play confirm inline, and a `beforeunload`
  prompt guards the tab.

## Battle reports and the replay

- **Two steps.** A battle reaches the player as a **report card** first, then an optional replay,
  as in Dominions: a summary, then "View battle"
  ([manual, ch. 6](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html)).
- **The report card:**
  - an outcome band (Decisive, Clear, Narrow, Pyrrhic victory; Narrow, Clear, Crushing defeat;
    thresholds in `BATTLE_REPORT`)
  - each side's squads, start → end, with losses split into killed and routed
  - commanders' fates and spells cast
  - up to three "Why" bullets
  - condition chips, and the consequences
  - Watch replay (Enter), Go to province, Close
- **Retention:** the sim keeps the last 20 records (`BATTLE.keep`), and the UI keeps a small
  `BattleSummary` for every battle in the save's UI block. Once a record is gone, the card still
  opens and Watch reads "Replay not kept (only the last 20 battles are)".
- **The replay modal:** a full-window modal reusing the game screen's skeleton.
  - **Header:** battle, terrain, date, round and phase, and condition chips for every modifier
    (Dominions' F2 scales panel, always visible).
  - **Rosters:** the player always on the left, labeled Attacker or Defender. Each shows
    commanders with HP, fatigue and the current script step, and squads with live counts,
    killed, routed and morale state. A click focuses a squad.
  - **Log:** on the right, with detail levels 1 to 4 (chips or `D`).
  - **Stage:** the battle presentation draws two sides facing each other, three rows per side,
    with a captions strip.
  - **Transport:** start, back a round, play, forward a round, end; speeds 0.5×, 1×, 2×, 4× on the
    digit keys 1 to 4; a scrubber indexed by event, with markers for casts, commander deaths,
    routs, the round-50 retreat and the end.
  - **Narrow layout:** the rosters collapse to live rails and the log closes.
  - **Cinematic mode** (`H`) gives the stage the whole window.
- **Replay keys:** Space; 1 to 4; ← and →; Home and End; `[` and `]`; D; hold C or the
  Commanders button to highlight every commander; H; ?; Esc. Tab only moves focus.
- **Settings in the replay** are the same keys as Settings: gore, shake, captions, master volume,
  SFX volume.
- **Accessibility:** a flash limit (WCAG 2.3.1) that cannot be turned off; reduced motion; glyphs
  in spell particles; captions for every informative sound.
- **The stage is the clock.** It paces each event to its animation and sound. The frame sends
  `playing`, `speed` and seek requests with an id. The stage reports `onProgress(event)`,
  `onSeekDone(id)` and `onEnd()`. It also receives `leftSide`, so it mirrors the record when the
  player defended. It reads only the `BattleRecord`. docs/04's 1.5 s per round is its default
  pace at 1×.

## Tooltips and the Codex

- **Tooltip anatomy:** title and value, a one-line meaning, a breakdown (biggest rows first,
  base then factors with running values, caps and overflow as rows), a projection, and the
  gesture footer. Width 360 px at most; height 60% of the window at most, scrolling inside.
- **Timing:** 400 ms on panels and 500 ms on the map. Once one tooltip has shown, the next opens
  at once. A 150 ms close grace lets the pointer travel into the tooltip.
- **Locking:** a 0.8 s rest, `T`, or a middle-click locks a tooltip. New root tooltips stay
  suppressed for 1 s after a lock.
- **Nesting and closing:** nesting is at most 3 deep, and Esc closes the chain.
- **Behavior:** a tooltip updates live and never covers the click target. Entity names in it are
  links, and Ctrl+click opens the Codex.
- **Shift held alone** expands the tooltip.
- **Concepts** are content in `src/content/concepts.ts`, about 55 of them.
- **The Codex** (F, a modal):
  - Topics on the left, the entry on the right, and the search box focused on open.
  - Search also finds provinces and own commanders, as "Go to" results.
  - Pages are generated from the content registry: units, spells (with "Castable by your …"),
    chassis, buildings, terrain, scales, concepts, How to play, Keys.
  - Back and forward buttons.

## Keyboard and mouse

- **Binding:** the digit row, numpad, WASD, `+`/`−`, the brackets and `` ` `` bind by physical
  key (`KeyboardEvent.code`), so AZERTY works. Letters bind by the letter on the player's
  keyboard. `?` works on every layout.
- **Shift has four meanings:**
  - held alone means "more"
  - Shift+click or drag means add or extend
  - Shift+digit picks a map mode
  - Shift+Tab and Shift+M cycle backwards
  "Alone" means no other key or mouse button since Shift went down, and no drag, waypoint chain or
  targeting in progress.
- **Right-click:** moves on the map. It dismisses on alerts, feed rows and toasts. It opens a
  context menu (Codex, Pin, orders) on entities. Ctrl+click opens the Codex everywhere.

| Key | Action |
|---|---|
| Space | pause |
| 1 to 4; + / − | set speed; step speed |
| Shift+1 to Shift+6 (F1 to F6 best effort); M / Shift+M; `` ` `` | map modes; cycle; numbers layer |
| WASD, arrows, drag; wheel | pan; zoom to cursor |
| LMB; Shift+LMB; Shift+drag | select; add; box-select |
| RMB; Shift+RMB | move or attack; add a waypoint |
| Enter; double-click a badge | open the Commander panel |
| V | reverse |
| Tab / Shift+Tab (map focus) | next / previous own commander; after the last, focus moves on to the right dock |
| N | next idle commander |
| J | latest alert or message |
| Home / Ctrl+Home | capital / pretender (as in Dominions) |
| R / L / F / O | Research / Ledger / Codex / outliner |
| C | the selected mage's Rituals tab |
| P; I; T | pin; Codex page of the hovered item; lock tooltip |
| `[` / `]` / H | collapse docks; hide chrome |
| Ctrl+S; ?; Esc | save; key overlay; close one layer |

- **Esc** closes one layer at a time, in this order: tooltip, context menu, targeting, modal,
  Battle Plan sheet, dock, selection, then the Game Menu.
- **Never bound:** Ctrl+digit, Alt+digit, Alt+arrows, Ctrl+W/T/N/R, Ctrl+C/V outside text, F5,
  F6, F11, F12. Destructive actions have no bare key.
- **Key table and tests:** the key table is data and read-only in M1. A test rejects duplicates
  and reserved keys.

## Onboarding

- **Guidance:** New Game asks "How much guidance?". Guide me gives the Learn objective, hints,
  and a pause before each first major concept. Hints only is the default. Off gives neither.
- **The first hint** teaches the gestures, and warns Old World players that Shift does not freeze
  tooltips here.
- **Learn** (the top of the outliner) has seven steps, each with a Why link:
  1. recruit
  2. take a province
  3. research
  4. spread dominion
  5. plan a battle
  6. cast a ritual
  7. claim a Wellspring
- **Reactive hints** use the blue Hint tier, fire on the first occurrence, end with "Show me",
  and can be reset.
- **Sections that do not apply yet** are collapsed with an unlock hint, never hidden.

## Accessibility and feel

- **Color identity:** every color has a symbol (MTG-like mana symbols) and a letter, so color
  identity never relies on hue alone. Every hue-coded state also has a shape or a pattern.
- **Sizing:** UI scale 80 to 200% (everything in `rem`). Text size 90 to 150%, with body text at
  least 14 px.
- **Display options:** pattern overlays, high-contrast borders, and letters on mana symbols are
  options.
- **Motion and flashes:** reduced motion follows the OS. Screen shake defaults to 50%. The flash
  limit is always on.
- **Captions:** Events by default.
- **Keyboard:** every DOM control is reachable and shows a focus ring. There are no focus traps.
- **Pause as a tool:** every order can be given while paused, and modals and ritual targeting
  pause.
- **Tooltips everywhere:** every stat has a one-line explanation.

## Confirmation and reversal

- **No undo in M1.** Reversals live where things are shown: the recruit queue's cancel × and
  Reverse.
- **Inline confirmations** cover only the irreversible: Storm while the walls stand, Make
  Prophet, Stop a ritual, Start with unspent design points, and loading, quitting or a new game
  with unsaved play.
- **Rituals** need no confirmation, because targeting pauses and the cursor label states the
  cost.

## What the sim exposes for the UI

- **Breakdowns:** optional trace sinks on `provinceEconomy`, `nationEconomy`, `fortMaterials`,
  `researchRate`, `dominionChecks` and the morale penalties, wrapped by `src/sim/explain/*`. A
  property test keeps each breakdown's total equal to its selector.
- **Previews:** a `ProvinceOverride` (`taxRate`, `pop`, `unrest`, `effects`) on
  `provinceEconomy`. No preview clones `GameState`, and each must run in under 2 ms.
- **New selectors:** `armyPower` (moved from the AI), `supplyAfterArrival`, `scriptCheck`,
  `predictRitual` (built on overrides), `summarizeBattle`, `pretenderReading`, `incomingThreats`.
- **Incursions and messages:** `updateIncursions` (tick step 6), with
  `NationState.incursions` and `APPROACH.quietDays`. New message kinds `approaching`,
  `threatened`, `siege`, `breached`, `godless`, `pretender`, `eliminated`, and `refs` on messages.
- **Validators:** `validateCommand` and `validatePretender` supply every disabled reason.
- **UI thresholds** live in `src/content/ui.ts`, and their values are logged in
  `docs/09-balance.md`.

## Precedents

| Pattern | Game | Source |
|---|---|---|
| Alerts in urgency colors at the top left; left-click goes, right-click dismisses, Shift+right-click disables | EU4 | https://eu4.paradoxwikis.com/Ingame_screen |
| Province window on left-click; a sortable Ledger | EU4 | https://eu4.paradoxwikis.com/Province_interface ; https://eu4.paradoxwikis.com/Ledger |
| Space, + and − for time | EU4 | https://eu4.paradoxwikis.com/Controls |
| Army panel at the bottom center with unit cards | HoI4 | https://stratemgames.space/en/hearts-of-iron-iv/game-interface |
| Nested tooltips with timer and action locks | CK3 | https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/ |
| No information gated by zoom | CK3 | https://forum.paradoxplaza.com/forum/threads/ckiii-dev-diary-25-map-features-and-map-modes.1388210/ |
| Nested tooltip placement; per-type message settings edited in place | Victoria 3 | https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-74-ux-improvements |
| Action and navigation buttons styled apart | Victoria 3 | https://forum.paradoxplaza.com/forum/threads/victoria-3-dev-diary-30-user-interface-overview.1507166/ |
| Tutorial as an objective with How and Why | Victoria 3 | https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-51-tutorials |
| "Divided UI" removed: one place per kind of thing | Endless Legend 2 | https://community.amplitude-studios.com/amplitude-studios/endless-legend-2/blogs/996-ui-ux-next-steps |
| Army Setup with circles and boxes; five-order scripts; Ctrl+digit copy | Dominions 6 | https://dmacguigan.github.io/dom6-manual/chapters/04-units.html |
| Report then "View battle"; attacker on the left; four log levels; F2 scales panel | Dominions 6 | https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html |
| `h` hides the UI; Home and Ctrl+Home; capsule overlay; scales where you hold dominion; numbers that open their breakdowns | Dominions 6 | https://dmacguigan.github.io/dom6-manual/chapters/02-the-basics.html |
| Point budget; Dormant +150, Imprisoned +350 | Dominions 6 | https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html |
| Engagement preview on hover | Age of Wonders 4 | https://www.pcgamer.com/age-of-wonders-4-review/ |
| Forecasts that miss destroy trust | Total War: Warhammer III | https://www.gamewatcher.com/news/total-war-warhammer-3-autoresolve-ambush-battles-withdraw |
| Pause on enemy sighted, not on contact | Pillars of Eternity | https://forum.quartertothree.com/t/the-spoiler-free-pillars-of-eternity-thread-about-managing-combat/76675 |
| Inconsistent pausing frustrates | RimWorld | https://steamcommunity.com/app/294100/discussions/0/591760218823644744 |
| Shift freezes tooltips | Old World | https://cdn.steamstatic.com/steam/apps/597180/manuals/Old_World-Official_User_Manual.pdf |
| A lens that masks the map is disliked | Civ VII | https://steamcommunity.com/app/1295660/discussions/2/570371162116298772 |
| Hover content must be hoverable, dismissible, persistent | WCAG 1.4.13 | https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus |
| Flash limits | WCAG 2.3.1 | https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold |
| F-keys a page cannot reliably capture | browsers | https://bugzilla.mozilla.org/show_bug.cgi?id=1203059 |

These were not re-checked and are not relied on alone: CK3's N key, Z/X speed step, pin key and
red pause bar (unverified); Stellaris's O for the outliner (unverified); EU5's six alert colors
and conditional dismissal (unverified).

## Changes from the previous version of this document

1. **The canvas fills the window.** Docks, strip, ribbon and toasts float over it, so panels
   never resize the map or move the camera. Before, the map column shrank with each panel, and
   the province under the cursor shifted.
2. **Layout of the bars and docks:**
   - The clock and speed move to the top right.
   - Population, dominion and the Wellspring track join the top bar.
   - The right dock becomes the outliner plus the message feed.
   - A province's army list moves to its Forces tab.
3. **One selection, one surface.**
   - A commander's orders move to the bottom strip, and its panel opens on demand.
   - Build lives in the province's building rows.
   - Patrol is labeled Guard and exempts an army from the idle alert.
4. **Battle Plan.** Squads and script merge into one wide sheet.
5. **Rituals.** The ritual panel is docked, not modal. Targeting is on the map with a hop
   outline, and a click on a valid target commits.
6. **Map modes and labels:**
   - Map modes move to Shift+1 to Shift+6, because browsers reserve F1, F5 and F6. The F-keys
     stay as a best-effort extra.
   - A numbers-layer toggle is added.
   - Labels follow a density budget: buildings, springs and the population bar move to Near
     zoom.
7. **New screens:** the Ledger (L) and the Codex (F). Settings gains its tabs.
8. **Messages and auto-pause.**
   - Messages get a per-type display and pause.
   - "Battle involving the player" splits into major (popup, pause) and minor (toast) battles.
   - New threat and incursion messages pause before armies arrive.
9. **The battle replay.** The player is always on the left. A report card comes first and serves
   as the end card. The replay gains log levels, a scrubber with markers, cinematic mode, and a
   stage-owned clock. Battle summaries outlive the 20 kept replays.
10. **Keyboard.** New keys are added, and physical key codes are used for the digit row.
    Ctrl+Home goes to the pretender.
````

### `docs/09-art-direction.md`: replace the "Icons" section and add "UI chrome"

Replace the whole `## Icons` section with:

````markdown
## Icons

24x24 monoline SVG icons on a 2 px stroke, one silhouette per noun. States are corner badges
drawn on top (▲ up, ▼ down, ✕ blocked, ‖ paused, ! problem), never new silhouettes. Every icon
listed here needs a distinct SVG (M1 acceptance criterion 14).

| Group | Icons |
|---|---|
| Resources | gold coin, materials (anvil), supply (wheat), population (figures), unrest (fist), each mana symbol, candle (dominion), research book |
| Buildings and places | fort, temple, lab, Wellspring (a fountain with five drops), spring (a drop with the color's glyph); each building also drawn as a faint outline for an empty slot |
| Orders | idle (open hand), guard (shield on a post), pillage (torch), research (book), preach (raised staff with symbol), claim (hand over a fountain), cast (ring with a spark), make prophet (halo), reverse (U-turn arrow), storm (ladder on a wall), move (arrow), build (hammer) |
| Status glyphs (corner badges on army badges and rows) | starving (crossed wheat), tight supply (half wheat), unpaid (crossed coin), wounded (cracked heart), besieging (ram), casting (ring in the spell's color), pillaging (torch), script problem (scroll with !) |
| Map | army badge shapes: rounded shield (own), notched shield (other nations), plain shield (independents); battle marker (crossed blades); siege ram; scout eye; transit arrow; selection ring |
| Roles | crown (pretender), halo (prophet), eye (scout), hood (stealthy) |
| Alert tiers | Urgent (octagon), Important (triangle), Opportunity (circle), Hint (rounded square with "i"); the shape carries the tier without hue |
| Map modes | ownership (banner), dominion (candle), supply (wheat), unrest (fist), population (figures), mana springs (drop), numbers layer (#) |
| Script stances | cast (the spell's mana symbol), attack (crossed blades), hold (shield), retreat (arrow) |
| Wellspring track | filled diamond (claimed), hollow diamond (needed), hexagon outline for the "1 short" badge |
| Screens and chrome | research, ledger (open book with columns), codex (book with magnifier), menu, settings (gear), pin, go-to (crosshair), info (i), close, back, Watch (eye on a play triangle), mute |
````

Add after it:

````markdown
## UI chrome

The chrome stays dark and neutral so the map and the mana colors carry identity. Mana colors
never decorate chrome. They appear only on things that carry that color.

| Token | Value | Use |
|---|---|---|
| `--chrome-0` | #1C1A17 | panel base, top bar |
| `--chrome-1` | #26231F | raised rows, cards |
| `--chrome-2` | #322E28 | hover, selected tab |
| `--text` | #F4EEDF | parchment text and keylines |
| `--text-dim` | #F4EEDF at 60% | footers, hints, disabled labels |
| `--keyline` | 1 px `--text` at 25% | panel edges, action buttons |
| `--warm` / `--cool` | #E8A15A / #8DB6C8 | ▲ and ▼ deltas, always beside the arrow; `tests/content/palette.test.ts` checks both at 4.5:1 or more against `--chrome-0` |
| `--focus` | 2 px #F4EEDF outline, 2 px offset | `:focus-visible` on every control |

- **Type:** one display face for headers and one face with tabular figures for numbers. Body text
  is at least 14 px at 100% UI scale. All sizes are in `rem`.
- **Buttons:** action buttons (they issue a command) are filled `--chrome-2` with a keyline and
  print their cost. Navigation buttons (they open something) are ghost buttons with no keyline.
- **Terms and links:** concept terms are `--text` with a 1 px dotted underline, never a mana
  hue. Entity links carry a leading glyph (pin, portrait dot, banner, mana symbol) and underline
  on hover.
- **Cards** (unit, spell, chassis, battle report) share one frame: a rounded rectangle, a header
  band in the nation's secondary color, and a symbol row at the bottom.
- **Patterns** for states shown by color: 45° hatch (invalid or unreachable), dense cross-hatch
  (starving), hatch density per unrest step, dotted borders (fog). The same patterns appear
  in map modes and panels.
- **Motion:** panels appear without sliding. An Urgent alert pulses twice when it appears.
  Reduced motion removes the pulse, the idle bob and every UI tween.
````

### `docs/10-milestone-1.md`: replace Phases 8, 9 and 10 and adjust two lines

Replace the `### Phase 8`, `### Phase 9` and `### Phase 10` sections with:

````markdown
### Phase 8: Map rendering and core UI
- Follow `docs/07-ui.md`, rewritten on 2026-10-21 for the owner's direction: "Make sure the UI
  matches those of similar games; where complexity is tastefully layered under smart menu
  design."
- Sim support first:
  - trace sinks on the selectors, with `src/sim/explain/*` and the property test
  - `ProvinceOverride` what-ifs
  - `armyPower` in the sim, and `supplyAfterArrival`
  - incursions (`incomingThreats`, `updateIncursions`, `APPROACH.quietDays`) and the new message
    kinds with `refs`, with a save version bump
  - `src/content/ui.ts` with the UI thresholds, logged in `docs/09-balance.md`
- Pixi map:
  - a full-window canvas that never resizes for panels
  - province polygons, bands, labels within the Mid density budget, six modes and the numbers
    layer
  - army badges with exception-only status glyphs, and stacks
  - camera, move preview, cursor label, right-click move, Shift waypoints, engagement preview
- React shell and store:
  - top bar with breakdowns, clock, speed, auto-pause with the reason chip and the popup queue
  - alerts ribbon, outliner, message feed
  - Province panel (Overview with scales, Recruit, Forces)
  - bottom strip with the order bar (Guard included)
  - Commander panel Overview on demand, with Give mana
  - tooltips with locks and the Shift state machine
  - the read-only key table
- Tests: explain, overrides, the preview perf test (2 ms), incursions, fog guard, label density,
  unobscured area, bindings, Shift state machine, pauses.
- This is the first point where the game is playable by a human. Play it.

### Phase 9: Remaining UI
- The Battle Plan sheet: `formationLayout`, script timeline, `scriptCheck`, presets, copy and
  paste, garrison and squad drag and drop.
- The Rituals tab and map targeting: `predictRitual`, hop outline, the targeting pause, commit on
  click.
- The Research modal, with W, U and B disabled in M1.
- The Ledger: Provinces, Commanders, Magic, Battles, Nations.
- Nested concept tooltips, `src/content/concepts.ts`, and the Codex.
- `summarizeBattle`, the `BattleReport` card, and battle summaries kept in the save's UI block.
- Main menu, New Game with guidance, Pretender Design (per-step `validatePretender`,
  `PretenderCard`, `pretenderReading`), save/load, victory screen.
- Settings (Game, Messages, Interface, Accessibility, Audio, Controls).
- Onboarding: the first hint, reactive hints, Learn with Why links. The province History tab.
- Tests: formation layout budget, battle summaries outliving records, depth audit, concepts.

### Phase 10: Battle replay viewer
- The replay frame per `docs/07-ui.md`: header with condition chips, rosters (player on the
  left), log with four levels, transport and an event-indexed scrubber, cinematic mode, captions.
- The battle presentation's `BattleStage` behind the frame's contract: the stage is the clock and
  answers seek requests. Use the animation table from the art doc and the separate battle
  presentation design.
````

Replace acceptance criterion 14 with:

````markdown
14. Art: every unit, commander, chassis, building, terrain, and every icon in the
    `docs/09-art-direction.md` icon inventory has a distinct SVG placeholder; animations per
    `docs/09-art-direction.md`.
````

In "Out of scope for M1", replace `sound,` with:

````markdown
sound other than battle SFX (no music, no UI or alert sounds),
````

### Other docs: one-line changes

- **`docs/04-battle.md`**, the "Replay log" paragraph. Replace "The replay viewer plays these back
  at 1 round per 1.5 seconds (adjustable)," with: "The replay viewer plays these back at a pace
  the battle presentation owns, about 1 round per 1.5 seconds at 1× and scaled by the speed
  setting (docs/07: the stage is the clock),".
- **`docs/06-architecture.md`**, in "## Implementation decisions", after the "**Battle records**" bullet, add:
  - "**Breakdowns** (Phase 8): selectors take an optional trace sink and an optional
    `ProvinceOverride`. Calls use `opts?.trace?.term(...)`, so the tick path allocates nothing.
    `src/sim/explain/*` folds traces into `Breakdown`s, and a property test keeps each total
    equal to its selector. Previews never clone `GameState`."
  - "**Battle summaries** (Phase 9): the UI stores `summarizeBattle(record)` in the save file's
    UI block when a record first appears. The report card renders from the summary after the
    record is evicted."
- **`docs/01-core-rules.md`** §14 Fog of war, add a bullet: "**Incursions.** An incursion of nation E
  into nation N opens when a commander of E visible to N has a current leg that ends in N's land
  or where N's army stands. It closes after `APPROACH.quietDays` (10) days with none. N gets one
  `approaching` message when it opens. N also gets one `threatened` message per target province,
  the first time such a leg ends where N has troops, a fort, or its capital. Commanders of E
  reaching one target on one day share a message. `NationState.incursions` holds the open
  incursions."
- **`docs/09-balance.md`**, add rows dated 2026-10-21: `APPROACH.quietDays` 10 (an incursion ends
  after 10 quiet days; one warning per incursion instead of one per leg); `UI.unrestShowAt` 25,
  `UI.capitalDominionWarn` 2, `UI.treasuryWarnDays` 30, `UI.idleAlertDays` 5,
  `UI.battleMarkerDays` 30, `UI.mergeDays` 5, zoom bands 70 and 180 px, Mid label box 96 × 30
  px, tooltip lock 0.8 s (all new, reason: docs/07 rewrite).
