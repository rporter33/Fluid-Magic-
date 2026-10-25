# Cross-cutting UX for deep strategy games, applied to Fluid Magic

Cluster: the rules that hold across the whole genre, not one studio's screens. Progressive
disclosure, information hierarchy, tooltips, number breakdowns, icons and color-blind safety,
keyboard and mouse conventions, notifications and auto-pause, onboarding, undo and
confirmation, modal versus docked panels, and accessibility. The document ends with a
checklist.

Direction this serves (binding): "Make sure the UI matches those of similar games; where
complexity is tastefully layered under smart menu design." Also binding: battles must be
visceral, with detail and sound. A separate battle presentation design covers that. This
document only makes sure the replay's frame follows the same rules as the rest of the UI
(section 12).

Companion documents in this folder:
- `research-paradox.md` covers Paradox screens in depth: top bar, alerts ribbon, message
  settings, outliner, nested tooltips, map modes, encyclopedia and tutorial.
- `research-dominions.md` covers Dominions and the auto-battle games (Total War, Age of
  Wonders 4, Songs of Conquest).

This document doesn't repeat those. It cites them where they already established a
pattern. It takes a position where cross-genre evidence points somewhere else, and it adds
the evidence from other games: Old World, Civilization VI, RimWorld, Pillars of Eternity,
StarCraft II, Total War, Path of Exile, Baldur's Gate 3, Slay the Spire, Factorio, Into the
Breach and Endless Legend 2. It also adds the standards: WCAG, the Game Accessibility
Guidelines, the Xbox Accessibility Guidelines and NN/g. Finally it covers browser-specific
constraints that desktop games never face.

---

## How this was researched, and how far to trust it

- **No direct page reads.** WebFetch failed on DNS and the egress proxy refused curl, so no
  page was opened directly. Every claim about another game comes from web-search extracts
  of the cited page. The search budget for this run ran out after about 40 queries, so a
  few planned checks were not run. They are listed in section 13, "Not verified".
- **Source tags:**
  - **[DD]** developer diary, patch notes or official support page
  - **[wiki]** community wiki
  - **[press]** review or editorial
  - **[comm]** forum, Steam thread or guide. Evidence of player experience, not a
    specification.
  - **[mod]** mod page. Evidence that players wanted something the base game lacked.
  - **[std]** standard or guideline
  - **[sib]** a claim from a companion document, with that document's URL
- **Standards cited from prior knowledge.** A few web standards are cited from prior
  knowledge, not from a fetch in this session: WCAG 2.3.1, `prefers-reduced-motion`,
  `beforeunload`, and the browser's own tab and back shortcuts. They are marked
  **[std, known]**. They are stable and easy to check.
- **Project facts come from reading the repository:** `docs/00-vision.md`, `07-ui.md`,
  `09-art-direction.md`, `01-core-rules.md`, `02-magic.md`, `04-battle.md`,
  `05-pretender.md`, `06-architecture.md` and `src/sim/selectors.ts`.

---

## 0. Summary: fourteen rules

1. **Four gestures, four depths.** Glance, then hover, then click, then the full screen.
   Each depth answers one kind of question: *how much*, *why*, *what can I do*, and *show me
   everything*. A footer hint in each tooltip names the next gesture, so the boundary
   between layers is visible (section 1).
2. **Anything needed for a decision is printed, not hidden.** Tooltips explain *why*. The
   number itself, the cost, the ETA and the forecast sit on the surface (section 2).
3. **Show what is coming, not only what is.** Show where enemy armies are heading and when
   they arrive, and where each value is drifting (a target marker). This follows Into the
   Breach's telegraphing and RimWorld's mood target (section 2).
4. **Tooltips must work in the DOM.** They are hoverable, dismissable with Esc and
   persistent (WCAG 1.4.13). They have a configurable delay, an Off mode, and a key-only
   mode (section 3).
5. **One modifier means "more", everywhere.** Holding Shift expands the hovered tooltip and
   shows exact numbers on the map. The genre uses Alt for this (PoE, BG3, Factorio), but
   Alt is unsafe in browsers (section 3.5).
6. **Every rate gets an itemized breakdown, computed in the sim.** Today's selectors return
   totals only. Add `explain*` selectors whose totals are tested equal to the selectors
   (section 4).
7. **Disabled actions explain themselves.** Each condition shows ✓ or ✗. To support this,
   validation must return *all* failing checks, not only the first error string
   (section 3.6).
8. **Encode every identity three ways: hue, glyph and letter.** Never use hue alone,
   including for alerts, deficits, valid targets and nation banners. MTG's mana symbols
   are the model (section 5).
9. **Use genre-standard input, adjusted for the browser.** Left-click selects, right-click
   moves, Shift+right-click queues a waypoint, Space pauses and the digits set the speed.
   Avoid keys the browser reserves (F5, Ctrl+W, Ctrl+digit, Alt+Left). Never let one
   accidental keystroke lose the game (section 6).
10. **Pause before a threat arrives, not after it.** Battles resolve instantly, so a pause
    on "battle happened" comes too late to act. Pausing when a hostile army is sighted
    heading for your land gives the player time to respond. Coalesce interrupts and always
    show why the game paused (section 7).
11. **Teach in the game, at the player's chosen depth.** Ask about the player's experience
    at New Game. Use a "Learn" objective, reactive hints, and a Codex generated from
    content. A help page that only repeats tooltip text adds nothing (section 8).
12. **Undo anything while paused, and confirm only what is irreversible.** The clock is
    the boundary: new information arrives only when time moves (Old World's rule). The RNG
    state is part of each snapshot, so undo cannot be used to reroll (section 9).
13. **Dock what you use while watching the map; use a modal only for planning.** Ritual
    targeting must be docked, not modal, because it needs the map (section 10).
14. **Accessibility settings are part of M1.** M1 ships UI scale, text size, tooltip
    timing, hold or toggle, reduced motion, a flash cap for battle spells, visual
    equivalents for sound cues, and rebinding (section 11).

---

## 1. Progressive disclosure: one ladder for the whole game

### Patterns
- **The definition.** Progressive disclosure shows the most important options first and
  offers specialized ones on request. Most people then finish their tasks without the extra
  complexity. NN/g credits it with improving learnability, efficiency of use and error
  rate. A practitioner lesson adds that the border between primary and secondary features
  should be easy to spot, using links or buttons with informative labels.
  ([NN/g, Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/);
  [Uxcel lesson](https://uxcel.com/lessons/progressive-disclosure-597)) [std]
- **Paradox applied it to onboarding and measured the result.** The CK3 tutorial refresh
  used telemetry, which showed that the tutorial affects retention. It applied progressive
  disclosure, including showing only parts of the interface when a player first starts.
  ([Game Developer, CK3 tutorial deep dive](https://www.gamedeveloper.com/design/deep-dive-refreshing-the-crusader-kings-iii-tutorial-mode-through-optimized-ux),
  via research-paradox.md §12) [sib][press]
- **Hover depth replaces click depth.**
  - Amplitude's game director said Endless Legend 2 added nested tooltips to cut down on
    the "tedious clicking" associated with 4X games
    ([Power Up Gaming](https://powerupgaming.co.uk/2026/09/16/endless-legend-2-full-release-brings-overhaul-to-cut-tedious-clicking/)).
    [press]
  - A review of EU5 credits "nested tooltips, in-game search, and encyclopaedia" with going
    a long way toward offsetting its density
    ([TheSixthAxis EU5 review](https://thesixthaxis.com/2025/10/31/europa-universalis-v-review)).
    [press]
- **Tooltips are the real manual.**
  - Old World players describe tooltips as the primary way people learn the game.
  - Another player reports that the in-game help mostly repeated tooltip text, and called
    it "woefully inadequate".
  - Players also keep reminding each other that a tooltip can be frozen with the middle
    mouse button, which shows that the deeper layer was not discoverable on its own.
  - Source: the Old World thread on Quarter to Three, pages
    [1543](https://forum.quartertothree.com/t/old-world-pka-ten-crowns-from-soren-johnson/134746/1543)
    and [77](https://forum.quartertothree.com/t/old-world-pka-ten-crowns-from-soren-johnson/134746?page=77).
    [comm]
- **The ladder goes all the way to an encyclopedia.** PC Gamer describes the CK3
  encyclopedia as the place to revisit tutorials or review systems you are unsure about,
  alongside a suggestion feature that lists possible actions
  ([PC Gamer](https://www.pcgamer.com/au/crusader-kings-3-sticks-to-what-it-does-best)).
  [press] research-paradox.md §0 sets out the full five-layer Paradox model. [sib]
- **The cost of getting it wrong.** Vic3 drew criticism for fragmentation and menu hopping:
  information was spread across screens and buried in nested tooltips, and those tooltips
  explain a thing without letting you act on it (research-paradox.md §13, with sources).
  [sib]

### Applies to Fluid Magic: the ladder

| Depth | Gesture | Question it answers | Fluid Magic surface |
|---|---|---|---|
| D0 glance | none | How much? Where? Is anything wrong? | Top bar values with a monthly delta, map glyphs, alerts ribbon, outliner rows, bottom strip |
| D1 hover | point, after a delay | Why is it this number? What does this icon mean? | Tooltip: one-line meaning plus a breakdown table (section 4) |
| D1+ detail | hold Shift while hovering | What exactly? | The same tooltip expanded: formulas, per-day values, every source row, hidden-by-default terms |
| D2 concept | point at a dotted-underlined term, then lock | What does this word mean? | Nested concept tooltip, at most 3 deep (research-paradox.md §6) |
| D3 click | click a value, glyph, alert or map object | What can I do about it? | A docked panel: province, commander, ritual targeting, or the Ledger tab for that value |
| D4 full screen | hotkey or button | Show me everything. Compare. | Research (R), Ledger (L), Codex (? or F), battle replay, Settings |

Rules that make the ladder work:
- **Every D1 tooltip ends with a footer that names the deeper gestures.** For example:
  `Shift more · MMB lock · Click open province · Ctrl+click Codex`. This makes the boundary
  "easy to spot" (Uxcel). It also fixes Old World's problem, where the freeze feature had
  to be taught by other players.
- **Each depth answers its own question.** A tooltip does not repeat the panel, and the
  panel does not repeat the tooltip. The Codex adds what tooltips cannot: worked examples,
  related concepts, and "where you see this" links into the UI. Old World's help was
  criticized for not doing this.
- **Every D1 or D2 item that names a thing links to it,** whether a province, commander,
  fort or spell. A click takes you there. This answers the Vic3 complaint that tooltips
  "explain but can't act".
- **Depth budget.** Any action is at most three clicks from the map (research-paradox.md
  §13 rule 3). Any explanation is at most three hovers deep.

---

## 2. Information hierarchy: what must be visible without a click

### Patterns
- **Telegraph the threat on the board.** In Into the Breach, enemies telegraph their moves.
  Justin Ma says this turns each match into a puzzle to study and solve
  ([Game Developer interview](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-)).
  [press] The GDC 2019 design postmortem covers how the UI was built
  ([GDC Vault](https://gdcvault.com/play/1025772/-Into-the-Breach-Design);
  [Game Developer video summary](https://gamedeveloper.com/design/video-how-subset-games-designed-i-into-the-breach-i-)).
  [DD]
- **Intent icons carry a number, and generic icons get criticized.**
  - Slay the Spire's enemy intents show an attack icon with its damage and number of hits.
    Block has its own shield icon. Buffs and debuffs share generic icons.
  - Slay the Spire 2 puts multi-action intents side by side instead of stacking them
    ([untapped.gg guide](https://sts2.untapped.gg/guides/how-to-read-enemy-intent)). [comm]
  - Players argue that the generic buff and debuff icons hide useful information. They want
    the specific effect and amount shown
    ([Steam](https://steamcommunity.com/app/646570/discussions/0/1699416432419204667)).
    [comm]
- **Current value plus a target.**
  - RimWorld's Needs tab shows the mood bar with a **Mood Target**, a white triangle below
    the bar that reflects all positive and negative thoughts.
  - The bar then moves toward the target at a capped rate per hour: at most 12 rising and
    8 falling.
  - Mood is computed as a base value plus the net of the thoughts
    ([RimWorld Wiki, Needs](https://rimworldwiki.com/wiki/Needs);
    [RimWorld Wiki, Mood](https://rimworldwiki.com/wiki/Mood)). [wiki]
- **A toggled layer of exact detail on the map.**
  - Factorio's "Alt mode", exposed to mods as `show_entity_info`, overlays per-entity
    details on the world
    ([Factorio Lua API, Concepts](https://lua-api.factorio.com/1.1.34/Concepts.html)).
    [DD]
  - Mods narrow it to the entity under the cursor
    ([Hover ALT Mode](https://mods.factorio.com/mod/hover-alt-mode)). [mod]
  - Baldur's Gate 3 binds "Show World Tooltips" to Left Alt on PC by default
    ([AlcastHQ](https://alcasthq.com/the-most-important-feature-in-baldurs-gate-3-show-world-tooltip/)).
    [comm]
- **Stock plus delta, always visible.** Paradox top bars show each stock with its signed
  monthly change. Hovering explains the change (research-paradox.md §1). [sib]
- **Less is more.** The GDC 2017 Mini Metro talk was about the value of "less is more" in
  UX and UI decisions
  ([Game Developer preview](https://www.gamedeveloper.com/design/attend-gdc-2017-and-learn-the-value-of-less-is-more-from-a-i-mini-metro-i-dev)).
  [press]

### Applies to Fluid Magic: the glance set
`docs/07-ui.md` already says "every number that matters is visible without a click". This
section makes that testable by listing exactly what the D0 set contains.

**Top bar (D0):**
- gold `1,240 ▲38`
- capital materials `212/360`
- five mana slots, each with a glyph, its stock and `▲n/mo`
- RP per month with the active color glyph
- dominion score
- **a Wellspring track `◆◆◇◇ 2/4`**
- date and speed

The Wellspring track is the victory condition, and it is missing from the spec's top bar.
The player should never have to open anything to know how close anyone is to winning.
Hovering the track lists every nation's count. This is Fluid Magic's analog of the
"situation" tier in research-paradox.md §3.

**Map (D0), per province and army:**
- ownership band
- dominion candles
- the army badge, showing the troop count and **one status glyph**: starving, unpaid,
  besieging, routed or casting
- a siege ring with progress
- a ritual-target glyph on any province an *enemy* ritual is known to target
- **a moving hostile army shows an arrow to its next province and an ETA label**,
  whenever it is visible

The ETA label is the Into the Breach telegraph. It is cheap here, because transits already
store the path and the days walked (docs/01, movement).

**Value drift (D0):**
- Unrest, supply use and dominion strength show the RimWorld pattern: a bar with a
  **target marker**, the value it is heading toward at current rates.
- The province panel shows `Unrest 34 → 52`, with ▲ in a warm tone and also as a glyph.
- The rates already exist (`ProvinceEconomy.unrest`), so the target is the current value
  plus the rate times the months shown, clamped to 0 to 100.

**Commitment points (D0 at the moment of choice):** the moment of choice is a right-click
move or a ritual target. At that point, the cursor label shows:
- the ETA,
- the supply after arrival (`fed / tight / starving`), and
- the battle forecast range from research-dominions.md §4.4.

None of these is only in a tooltip. This applies research-paradox.md §13 rule 1.

**Detail layer (D1+ on the map):**
- Holding Shift with nothing hovered shows exact numbers on every province: population,
  supply used over supply available, and unrest. This is Factorio's Alt mode.
- Settings can turn it into a toggle (section 11).
- Labels thin out with zoom, but no information is *only* available at one zoom level
  (CK3's warning, research-paradox.md §7). [sib]

**Density budget at 1280x720.**
- docs/07 sets no dock widths. With typical widths (a 340 px left dock and a 280 px
  right dock), the map would be about 660 px wide at 1280 px. That is too narrow.
- Below 1600 px of viewport width, the right dock collapses to a 48 px icon rail
  (outliner, feed, alerts). Each opens as an overlay over the map edge. The left dock opens
  only on selection, and Esc closes it.
- At 1920x1080 both docks stay open.

---

## 3. Tooltip design

### 3.1 Delay and modes

**Patterns**
- **Civilization VI offers three modes** ([Civ VI Console FAQ](https://support.civilization.com/hc/en-us/articles/37661409606547-Civilization-VI-Console-FAQ),
  console wording). [DD]
  - "Delay Show" is the default: the tooltip appears after the cursor rests for a moment.
  - A toggle shows and hides tooltips with a button.
  - "Always Show" keeps them visible.
- **Baldur's Gate: Enhanced Edition** puts a tooltip delay slider under Options/Gameplay.
  Moving the slider fully right turns tooltips off
  ([Steam](https://steamcommunity.com/app/228280/discussions/0/3432326055095021944)). [comm]
- **CK3** has a configurable timer before a tooltip locks, and a separate auto-tooltip
  delay (research-paradox.md §6). [sib]
- **Some Vic3 players want tooltips only on a key press**, because they find hover
  tooltips intrusive (research-paradox.md §6). [sib]

**Applies to Fluid Magic**
- **Settings → Interface → Tooltips:**
  - Mode: `Hover (delay) / Key only / Off`
  - Delay slider: 0 to 1500 ms. Default 400 ms on panels and 500 ms on the map. The map is
    hovered constantly, so a shorter delay there would spam cards.
  - Lock timer: 0.8 s, after research-paradox.md §6.
- **Warm state.** Once a tooltip has shown, moving to another trigger within 300 ms opens
  the new tooltip with no delay. This makes scanning a row of top-bar values fast.
- **Instant name label.** The map shows only the province name at the cursor instantly.
  The full card waits for the delay.

### 3.2 DOM tooltips must meet WCAG 1.4.13

**Pattern (standard).** WCAG 1.4.13 "Content on Hover or Focus" (level AA) requires three
things of content that appears on hover
([W3C Understanding 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus)).
[std]
- **Dismissible.** It can be closed without moving the pointer, for example with Esc.
- **Hoverable.** The pointer can move onto it without it vanishing.
- **Persistent.** It stays until the trigger is removed, the user dismisses it, or its
  information is no longer valid.

**Applies to Fluid Magic**
- Fluid Magic's panels are DOM, so this is the natural bar to meet.
- Add a 150 ms close grace period, so the cursor can travel from the trigger into the
  tooltip. That makes it hoverable even before the lock timer completes.
- Esc closes the tooltip chain first (section 6, Esc ladder).
- Tooltips also open on **keyboard focus**, not only on hover, so keyboard users get them.
- A tooltip whose data changes while it is open, such as a ticking unrest value, updates
  in place. It does not close and reopen.

### 3.3 Nesting and locking

**Patterns**
- **CK3 introduced "tooltips in tooltips".** Highlighted terms inside a tooltip open
  further tooltips. A forum quote of the dev diary describes two lock modes: a timer lock
  (the default) and an action lock with the middle mouse button
  ([TheSixthAxis hands-on](https://www.thesixthaxis.com/2020/05/14/hands-on-crusader-kings-iii-a-new-era-of-intrigue-religious-wars-and-grand-strategy/);
  [GamingOnLinux on DD #16](https://www.gamingonlinux.com/articles/16333/);
  research-paradox.md §6 for the diary itself). [press][sib]
- **The system spread across Paradox.** Victoria 3 adopted it
  ([PCGamesN](https://www.pcgamesn.com/victoria-3/nested-tooltip-system)). [press] EU5 says
  its tooltip design is "based heavily" on it
  ([Tinto Talks #77](https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053)).
  [DD]
- **Other games freeze tooltips too.** Old World freezes a tooltip with the middle mouse
  button ([Quarter to Three](https://forum.quartertothree.com/t/old-world-pka-ten-crowns-from-soren-johnson/134746/1543)).
  [comm] In Path of Exile 2, players note the description disappears when the mouse leaves
  the gem, and suggest clicking the box to keep it open
  ([Steam](https://steamcommunity.com/app/2694490/discussions/0/596260925367969924)).
  [comm]
- **Not everyone wants nesting.** In EU5's launch week, a player wanted nested tooltips off
  ([Steam](https://steamcommunity.com/app/3450310/discussions/0/604155654554287067)).
  [comm]

**Applies to Fluid Magic.** Adopt research-paradox.md §6 as written, with two additions:
- **A "Nested tooltips: On / Off" setting.** With Off, concept terms still show a dotted
  underline, but they open the Codex on Ctrl+click instead of chaining.
- **Middle-click versus middle-drag.** A middle-click without movement locks the tooltip.
  A middle-drag pans the map. The two gestures are distinguished by a 4 px movement
  threshold. `T` is the trackpad equivalent for locking.

### 3.4 Pinning: promote a tooltip into a card

**Patterns**
- Vic3's star icon and CK3's Alt+Q pin things to the outliner (research-paradox.md §5).
  [sib]
- PoE2 players click to keep a description open (§3.3). [comm]

**Applies to Fluid Magic**
- In a *locked* tooltip, a pin icon (or `P`) turns it into a **floating card**. A card can
  be dragged, stays open, keeps updating live, and is closed with its own ×.
- At most three cards are open at once. Opening a fourth closes the oldest.
- Use cases:
  - Compare two provinces' supply before splitting an army.
  - Keep a spell's cost visible while choosing a caster.
  - Watch a siege's progress.
- Cards are UI state. They never enter `GameState`.
- This is a design inference that extends locking. No source shows it in a shipped
  strategy game, so playtest it.

### 3.5 "More detail" on a modifier key

**Patterns**
- **Path of Exile.** Its "Advanced Mod Descriptions" option shows extra item detail while
  Alt is held: prefix and suffix, value ranges and tiers. Players complained that this
  option was off by default while screen shake was on by default
  ([devtrackers, PoE](https://devtrackers.gg/pathofexile/p/9c4ded3b-why-does-horrible-options-like-screenshake-are-default-but-awesome-ones-like-advance-description-or-the-freaking-clock-arent)).
  [comm] In PoE2, holding Alt over underlined terms shows their descriptions
  ([Steam](https://steamcommunity.com/app/2694490/discussions/0/596260925367969924)).
  [comm]
- **Baldur's Gate 3.** "Expand Tooltip" defaults to Left Alt
  ([AlcastHQ](https://alcasthq.com/the-most-important-feature-in-baldurs-gate-3-show-world-tooltip/)).
  [comm] A mod turns the hold into a toggle
  ([Nexus Mods #723](https://www.nexusmods.com/baldursgate3/mods/723)). [mod]
- **Factorio.** Alt mode works the same way (§2). [DD]

**Applies to Fluid Magic**
- **Shift is the single "more" key.**
  - Holding Shift over a tooltip expands it to D1+: all rows, formulas, and per-day values.
  - Holding Shift with nothing hovered shows the map's numeric labels.
  - Shift+right-click (queue) and Shift+click (add to selection) also mean "more", so the
    key teaches itself.
- **Why not Alt.** The genre uses Alt, but Alt is unsafe in a browser:
  - On Windows, pressing and releasing Alt can focus the browser menu.
  - Alt+Left navigates back.
  - Alt+digit switches tabs in some browsers (research-paradox.md §7).
  - Accept Alt as a secondary trigger only when `preventDefault` succeeds. This is a
    browser inference, not a game pattern, so verify it per browser.
- **Avoid flashes during chords.** The detail view triggers only after Shift has been held
  alone for 250 ms. Shift+digit (map modes) therefore does not flash the labels.
- **Settings:** "Detail key: Hold / Toggle" (the BG3 mod's request) and "Always show
  detailed tooltips" (PoE's complaint).

### 3.6 Action tooltips and the "why not" block

**Patterns**
- EU5's action tooltips state what a click does. When the action is not possible, a small
  condition block shows why. EU5 also uses **tables** for values with many sources
  ([Tinto Talks #77](https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053)).
  [DD]
- research-paradox.md §6 proposes deriving these blocks from `validate`. [sib]

**Applies to Fluid Magic: a needed sim change**
- **The limitation today.** `validateCommand(state, cmd)` returns a single error string or
  null (docs/06, Commands). A condition block needs **every** check with its pass or fail
  state.
  - Example: `✓ Commander present · ✗ Needs 120 gold (have 80) · ✓ Province not besieged`.
- **The change.** Add `checkCommand(state, cmd): Check[]` in `src/sim/commands/`, where
  `Check = { id, ok, labelKey, params }`.
  - `validateCommand` becomes "the first failing check, or null".
  - The UI renders the whole list.
  - The AI keeps calling `validateCommand`.
  - Behavior stays identical, and a test asserts that the first failing check matches the
    old string.
- **Never hide an action** the player could look for. Show it disabled, with its condition
  block. The only exception is the progressive disclosure in section 8: a quiet *style*
  for things that do not apply yet, never removal.

### 3.7 Tooltip anatomy (one template for every tooltip)

```
┌───────────────────────────────────────────────┐
│ [icon] Gold income              ▲ 38 / month  │  title row: icon, name, D0 value
│ Tax from population, minus troop upkeep.      │  one-line meaning (concept text)
│ ───────────────────────────────────────────── │
│ Provinces (12)                        +61.4   │  breakdown table (section 4)
│   Ashfen                              +12.8   │    top 5 rows, then "N others ▸"
│   ...                                         │
│ Upkeep (4 commanders)                 −23.0   │
│ Net                                   +38.4   │  bold total
│ ───────────────────────────────────────────── │
│ Shift more · MMB lock · Click Ledger ▸        │  gesture footer (dim)
└───────────────────────────────────────────────┘
```

- Width is at most 360 px at 100% UI scale.
- Body text is at least 14 px, and the footer at least 12 px.
- Tooltips never cover the cursor's target. They open on the side away from the nearest
  screen edge and away from neighboring triggers (Vic3 1.2, research-paradox.md §6).

---

## 4. Breakdowns of every number ("why is my income +12?")

### Patterns
- **Players build what the game leaves out.**
  - Civ VI players asking why a tile has its yields were pointed to a mod that adds a
    hover breakdown. One cause turned out to be a hidden disaster bonus
    ([Steam](https://steamcommunity.com/app/289070/discussions/0/4762081419112004479);
    [Steam](https://steamcommunity.com/app/289070/discussions/0/4030222834123572035)).
    [comm][mod]
  - Dominions 6 added upkeep and population-growth breakdowns, and a veteran reviewer
    singled them out (research-dominions.md §3). [sib]
- **Tables for many sources.** EU5 switched to tables in tooltips because long modifier
  lists were hard to read (Tinto Talks #77, §3.6). [DD]
- **Base plus terms, with a visible target.** RimWorld's mood is a base value plus the
  sum of the colonist's thoughts. The bar shows the target and moves toward it at a known
  rate (§2). [wiki]
- **Explain the sign.** EU4's treasury tooltip explains why the balance is in the black or
  the red (research-paradox.md §1). [sib]

### Applies to Fluid Magic

**The gap in the current code.**
- `src/sim/selectors.ts` computes every rate. `ProvinceEconomy` returns totals only:
  `gold`, `materials`, `supply`, `supplyUsed`, `mana`, `growth`, `unrest` and `pillage`.
- The formulas are inline. For example, gold is
  `pop / popPerGold × taxRate × (1 + goldPct) × (1 − unrest / unrestGoldDivisor)`.
- If the UI rebuilt the terms itself, it would duplicate the formulas, and the two would
  drift. That would break the selectors' own promise, "what the UI shows is what happens"
  (the header comment).

**The change (sim, pure, deterministic).**
- Add `src/sim/explain/` with `explainProvinceGold`, `explainProvinceUnrest`,
  `explainSupply`, `explainMana`, `explainNationGold`, `explainResearch` and
  `explainDominion`. Each returns:

  ```ts
  interface Term {
    key: string;                 // i18n key, e.g. 'term.taxRate.high'
    ref?: ContentRef;            // concept, province, commander, scale, ritual effect
    op: 'base' | 'add' | 'mul' | 'clamp' | 'floor';
    value: number;               // +3.0 for add, 1.07 for mul
    running: number;             // value after applying this term (for mul chains)
  }
  interface Breakdown { total: number; unit: 'perMonth' | 'perDay' | 'flat'; terms: Term[] }
  ```

- Refactor so that each selector's arithmetic **is** the explain function's terms, folded.
  The other approach, keeping parallel code, needs a property test: for 200 random states
  from `createGame` plus random commands and days, `explainX(s).total` equals `selectorX(s)`
  within 1e-9.
- Put the test in `tests/sim/explain.test.ts`. CLAUDE.md requires that the sim gets unit
  tests, and this test is the guard against drift.

**How each kind of number renders.**
- **Additive rates** (unrest per month, mana per month): one row per signed source, and a
  bold total.
  - Unrest example from docs/01 §5 and the selectors:
    `High tax +4 · Priest (Varo) −x · Enemy dominion (strength 6) +y · Order scale −2 ·
    Natural decay −d = net`.
- **Multiplicative rates** (gold): a base row, then each multiplier shown as a percent
  with the running value, then the total. Using docs/01's formula:

  | Term | Effect | Running |
  |---|---|---|
  | Population 2,400 ÷ 100 | base | 24.0 |
  | Tax: Normal | ×1.00 | 24.0 |
  | Order scale +1 | +7% | 25.7 |
  | Unrest 30 | −15% | 21.8 |
  | **Gold / month** | | **21.8** |

- **Caps and floors** get a row of their own:
  - Fort materials at its 6-month cap: `Overflow lost: −14.2`.
  - Supply clamped at 0: `Floor: 0`.

  A clamp is the most common hidden cause of "why is this number not changing?".
- **Nation totals** (the top-bar gold):
  - The five largest provinces, then `N others ▸`. The link opens the Ledger sorted by
    contribution.
  - Upkeep grouped by commander, then plunder.
  - Never show the AI difficulty factor for the player's own nation. It only applies to AI
    nations (selectors.ts).
- **Units.** Every value is labeled `/mo` or `/day`. Pillage is computed per day. In the
  top bar, show it converted to per month, with the per-day figure in D1+.
- **Rounding.**
  - D0 shows integers. The tooltip shows one decimal for every row *and* for the total, so
    the rows add up visibly.
  - When D0 rounds the total, the tooltip still shows the exact total. It never shows a
    "rounding" row.
- **Forecast rows.** Each breakdown ends with `At this rate: 52 in 3 months`, or
  `Starving in 4 days`. This is the RimWorld target, as text.

---

## 5. Icons and color-blind-safe symbols

### Patterns
- **MTG's model: a symbol, a letter and a hue for each color.** White is a sun, blue a
  water drop, black a skull, red a flame and green a tree. The mana cost's symbols sit in
  the upper right of a card, and a card's color is defined by the colored symbols in its
  cost
  ([MTG wiki mirror, Mana](https://mtg-archive.fandom.com/wiki/Mana);
  [Mana Cost](https://mtg-archive.fandom.com/wiki/Mana_Cost)). [wiki]
  - Even so, MTG Arena players report missing color-blind support, such as being unable to
    tell lands apart by their art
    ([MTG Rocks](https://mtgrocks.com/mtg-arena-is-still-missing-critically-needed-features/)).
    [press]
  - The lesson: the symbol carries the identity. The *art* around it must not be the only
    cue.
- **The standards say the same.**
  - Game Accessibility Guidelines: "Ensure no essential information is conveyed by a colour
    alone, reinforce with a symbol or offer a choice of alternative colours." The
    guidelines also ask for an easily readable default font size and high contrast between
    text and background
    ([reproduction of the GAG list](https://www.webbie.org.uk/blog/?p=115); official site
    gameaccessibilityguidelines.com). [std]
  - Xbox Accessibility Guidelines 103: aim for no cue that depends on color alone, let
    players choose colors where hue cannot be avoided, and pair symbols and shapes with
    text labels
    ([XAG 103](https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/103)).
    [std]
  - Unity's accessibility course: important information must not be communicated through
    color alone
    ([Unity Learn](https://learn.unity.com/course/design-and-development/tutorial/important-information-and-communication)).
    [std]
- **A symbol-based color-blind mode.** ReCore's developers built a system, switched on by
  its color-blind mode, that relies on symbols rather than colors
  ([MCV/Develop](https://mcvuk.com/?p=62330)). [press]
- **Severity by color alone.** RimWorld letters are envelope icons on the right edge.
  Their color encodes severity: blue for good, grey for neutral, yellow for bad and red for
  a direct threat
  ([RimWorld Wiki, Events](https://rimworldwiki.com/wiki/Events)). [wiki] The extracts did
  not say whether the shapes also differ, so this is an example of color carrying severity,
  not proof that it fails.
- **A reference library with test filters.** Game UI Database 2.0 holds more than 55,000
  screens and videos from about 1,341 games. It can be filtered by screen type, HUD
  element and color. Its "visualizers" preview any screen in greyscale, inverted, or under
  protanopia, deuteranopia and tritanopia filters
  ([80.lv](https://80.lv/articles/game-ui-database-2-0-has-been-released);
  [AlternativeTo](https://alternativeto.net/news/2024/8/game-ui-database-2-0-launches-with-over-55-500-screens-and-enhanced-tools-for-ui-designers/);
  [Creative Bloq](https://creativebloq.com/3d/video-game-design/game-ui-database-20-is-the-ultimate-free-reference-tool-for-game-designers)).
  [press]

### Applies to Fluid Magic

**Triple coding for the five colors.** docs/09 already pairs each hue with a glyph (sun
disc, wave crest, skull in a drop, flame, leaf). The palette test enforces CIEDE2000
distances.
- Add the **letter** as the third channel. It appears in text runs, in `aria-label`, in
  tooltips (`Ember (R)`), and in the Codex.
- Write costs in content as `{R}{R}{2}`, the MTG notation, and render them as glyph
  circles followed by a grey generic circle holding the number.
  - The current content shape is `{ R: 3, generic: 2 }`. Render it in that order: colored
    pips first, then generic.
- Hybrid costs (M3, `R/G`): a circle split diagonally, showing both glyphs. Render the
  requirement string (`RR/G`) the same way, so that requirements and costs read alike.

**No hue-only signals anywhere.** Every state below gets a shape or pattern as well.

| Signal | Hue | Second channel |
|---|---|---|
| Deficit / surplus | warm / cool | ▼ / ▲ glyph and the sign |
| Alert tier | red to blue | octagon, triangle, diamond, circle, "i", hexagon (research-paradox.md §3) |
| Own / allied / enemy army | banner | badge shape: rounded shield for own, notched shield for enemy, plain shield for independents (docs/09) |
| Valid / invalid target | lit / dimmed | invalid provinces get a 45° hatch overlay |
| Fogged / seen | desaturated | dotted province border and a "last seen Nd ago" label |
| Starving / tight / fed | red / amber / none | three wheat glyph states: crossed, half, full |
| Nation identity | banner hue | the nation's emblem on badges and band corners; duplicate nations also get a number (docs/09) |

**Icon grammar.**
- One silhouette per noun (docs/09's 24x24 monoline set). States are **corner badges** on
  that silhouette: ▲, ▼, ✕ blocked, ⏸ paused, ! problem. They are never new silhouettes.
- In panels, an icon is always paired with a number or a word. Icons appear alone only on
  the map and in the top bar, and always with a tooltip. Dominions 6 was criticized for
  tiny unlabeled icons (research-dominions.md §2). [sib]
- The same icon means the same thing on the map, in panels, in tooltips, in the Codex and
  in the replay.

**Settings.**
- The palette is already validated for the three deficiencies, so recoloring is not the
  first tool. Offer pattern-based helpers instead:
  - "Pattern overlays in map modes" (hatching for each step of a scale)
  - "High-contrast borders"
  - "Show color letters on mana symbols" (draws W, U, B, R or G small inside the glyph)
- For banners only, also offer a "Choose banner colors" picker, following XAG 103's
  "choose the colors". The picker validates against the same CIEDE2000 test at runtime.

**QA.**
- Add a developer-only toggle that applies SVG color-deficiency and greyscale filters to
  the whole app, the same idea as Game UI Database's visualizers.
- Add a screenshot smoke test in greyscale for the top bar and the alert ribbon.
- Collect a small reference board from Game UI Database: tooltips, HUDs and maps from the
  genre (CK3, EU5, Vic3, Old World, Civ VI, RimWorld, Into the Breach) as a style
  reference for the art pass.

---

## 6. Keyboard and mouse conventions

### Patterns

**Select, move and queue.**
- In StarCraft II, holding Shift while issuing commands queues them
  ([Blizzard game guide, special control](https://news.blizzard.com/en-us/article/4552955/game-guide-special-control)).
  [DD]
- In Total War: Warhammer, holding Shift and right-dragging draws a movement path, and
  Shift- or Ctrl-click adds units to the selection
  ([Prima Games](https://primagames.com/featured/total-war-warhammer-formation-control-guide-tips)).
  [comm]
- The Warhammer III hotkey list includes Ctrl+1 to 9 control groups
  ([Xbox Wire](https://news.xbox.com/en-us/?p=164012)). [DD]
- A Dominions 5 review faulted the game for refusing "modern, left click to select, right
  click to move conventions" (research-dominions.md §1.12). [sib]

**Getting to the problem.**
- In StarCraft II, Space centers the camera on the last warning notification, and repeated
  presses step back through up to 8 earlier ones.
- Backspace cycles through your bases.
- F1 selects an idle worker, and a second press centers the camera on it. Ctrl+F1 selects
  all idle workers.
- Source: [Blizzard game guide, special control](https://news.blizzard.com/en-us/article/4552955/game-guide-special-control).
  [DD]

**Time.** Paradox games use Space to pause, digits to set the speed and +/− to step it
(research-paradox.md §2). [sib]

**Per-screen key help.** Dominions shows a `?` overlay with each screen's keys
(research-dominions.md §0). [sib] Total War keeps its formation controls under a
Keybindings menu
([Steam](https://steamcommunity.com/app/1142710/discussions/0/4358997660742583413)).
[comm]

**Browser constraints that desktop games never face:**
- Mozilla's tracker says core browser commands (opening and closing windows and tabs,
  quitting, focusing the address bar, reloading) should not reach page content. It also
  says `preventDefault` for those keys is "a bit of a mess" across browsers
  ([Mozilla bug 1203059](https://bugzilla.mozilla.org/show_bug.cgi?id=1203059)). [std]
- An old WebKit report found that `preventDefault` had no effect on F5 or Ctrl+F on
  Windows ([WebKit bug 35849](https://bugs.webkit.org/show_bug.cgi?id=35849)). [std]
- Esc cannot be disabled in fullscreen, by design
  ([W3C fullscreen discussion](https://lists.w3.org/Archives/Public/public-webapps-github/2020Sep/0071.html)).
  [std]
- The Keyboard Lock API lets a page capture keys such as Esc and Ctrl+N, but only in
  fullscreen started from JavaScript, and only in Chromium browsers
  ([Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/keyboard-lock)).
  [std]
- GitLab's Web IDE concluded "we probably shouldn't hijack browser shortcuts"
  ([GitLab issue 386209](https://gitlab.com/gitlab-org/gitlab/-/issues/386209)). [std]
- Known browser behavior: Ctrl+1 to 9 switch tabs, Alt+Left goes back, and Ctrl+W closes
  the tab. [std, known]

### Applies to Fluid Magic: the reconciled input map
This table reconciles docs/07, research-paradox.md §14 and research-dominions.md §1.12, and
adds the cross-genre and browser evidence above. "Map focus" means the canvas or the body
has focus, not a text field or a focused panel control.

| Input | Action | Precedent / reason |
|---|---|---|
| LMB | select province, army or panel item | genre standard |
| Shift+LMB | add a commander to the selection | Total War |
| LMB drag on the map | pan | docs/07 |
| Shift+LMB drag on the map | box-select own armies (additive) | Dominions 6 Army Setup drag-select, Total War. It needs a modifier, because a plain drag pans |
| RMB on a province | move the selection there (path preview while held) | genre standard, docs/07 |
| Shift+RMB | append a waypoint (extends the `move` path) | StarCraft II, Total War |
| RMB on an outliner row | context menu: orders, transfer squads | right-click menus in the Paradox outliner. Not on the map, where RMB always means move |
| Wheel / WASD / arrows | zoom to cursor / pan / pan | docs/07 |
| MMB click (no movement) / `T` | lock tooltip | CK3, Old World |
| MMB drag | pan | design choice, 4 px threshold |
| Double-click an outliner row | select and center | Stellaris (research-paradox.md §5) |
| Space | pause / resume (the replay too) | Paradox, docs/07 |
| 1–4, + / −, Z / X | set speed, step speed | Paradox, CK3 |
| Shift+1–6 (F1–F6 best effort), M cycles | map modes | research-paradox.md §7. F5 is unreliable to intercept and F1 opens help |
| Tab / Shift+Tab (map focus only) | next / previous own commander | docs/07. Inside panels Tab moves keyboard focus (accessibility) |
| N | next idle commander; a second press centers | CK3 N, StarCraft II F1 |
| J (repeat to step back, 8 deep) | jump to the latest alert or event | StarCraft II's Space, moved because Space pauses |
| Backspace (repeat to cycle forts) | center on the capital | EU4 Backspace, StarCraft II base cycling |
| R / C / L / O / I / `?` or F | Research / Cast / Ledger / Outliner / Info card / Codex | docs/07, research-paradox.md, research-dominions.md |
| Hold Shift (alone, ≥250 ms) | detail: expand the tooltip, numeric map labels | PoE, BG3, Factorio (with Alt there); section 3.5 |
| Ctrl+Z / Ctrl+Shift+Z | undo / redo while paused | Old World (section 9) |
| Ctrl+S | save (`preventDefault`; also a visible button and autosave) | docs/07 |
| Esc | close the top layer (ladder below) | WCAG 1.4.13, genre standard |
| `?` | key overlay for the current screen | Dominions |

**Esc ladder.** Each press closes one layer, in this order:
1. Tooltip chain
2. Targeting mode (move preview, ritual target)
3. Floating cards
4. Modal
5. Left dock
6. Selection
7. Only when nothing else is open, the game menu

In browser fullscreen, Esc exits fullscreen first, so every layer also has a visible close
control. Chromium's Keyboard Lock is an optional extra.

**Never bind** Ctrl+digit, Alt+digit, Alt+Left/Right, Ctrl+W/T/N/R, F5, F6, F11 or F12.

**Guard against losing the game by accident.**
- Register a `beforeunload` prompt while there is play since the last save. [std, known]
- Autosave on every in-game month boundary, to a ring of 3 slots.
- Ctrl+W or an accidental Back then costs at most one month.

**Rebinding.** Settings → Controls lists every action with its key, and lets the player
rebind it.
- Check for conflicts within each context: map, panel, replay.
- Refuse the browser-reserved combinations listed above.
- Every tooltip on a button shows its key, and the `?` overlay lists them per screen.
- Unit-test the binding table: no duplicate keys within a context, and no reserved
  combinations.

**Control groups (Ctrl+digit) are deliberately left out.** Ctrl+digit switches browser
tabs, and the digits already set the speed. With at most a few dozen commanders on 40 to 80
provinces, Tab, N, the outliner's pinned section and box-select cover the need.

---

## 7. Notifications and auto-pause

### Patterns
- **Three channels.**
  - Paradox games separate *alerts* (conditions that are true now), *messages* (events
    that happened) and per-type popup or pause settings (research-paradox.md §3 and §4).
    [sib]
  - CK3 alerts are for actionable states, not standing ones like being at war
    (research-paradox.md §3). [sib]
- **Severity by color.** RimWorld uses colored letter envelopes on the right edge (§5).
  [wiki]
- **Tiered pausing, and the frustration of inconsistency.**
  - A RimWorld player points to options to pause on minor or major threats
    ([Steam](https://steamcommunity.com/app/294100/discussions/0/3471730015111612394)).
    [comm]
  - Another asks why the game sometimes pauses for a raid and sometimes does not
    ([Steam](https://steamcommunity.com/app/294100/discussions/0/591760218823644744)).
    [comm]
  - A mod, "More Pause Events", makes every event's pause configurable
    ([Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/comments/1874708724)).
    [mod]
- **Pause on anticipation, not on contact.**
  - Pillars of Eternity's auto-pause options, as players list them, include enemy spotted,
    trap or hidden object detected, combat start, enemy killed and ability used
    ([Steam](https://steamcommunity.com/app/291650/discussions/0/1736595227843429278)).
    [comm]
  - A combat guide recommends pausing on *enemy sighted* rather than combat start, so you
    can position before the enemy notices you
    ([Quarter to Three](https://forum.quartertothree.com/t/the-spoiler-free-pillars-of-eternity-thread-about-managing-combat/76675)).
    [comm]
  - A review describes the game pausing when an enemy spots you so you can give orders
    ([Push Square](https://www.pushsquare.com/reviews/ps4/pillars_of_eternity_complete_edition)).
    [press]
- **The notification area exists only when needed.** A Civ VI player describes the
  notification bar on the right appearing only when there are notifications that need the
  player, and vanishing otherwise. Another Civ VI player hit a "unit needs orders" blocker
  and had to click through units to find which one it meant
  ([Steam](https://steamcommunity.com/app/289070/discussions/0/282992646971461075);
  [Steam](https://steamcommunity.com/app/289070/discussions/0/312265327165650851)). [comm]
  The extracts did not tie each claim to one of these two threads, so treat this as player
  testimony.
- **Navigate to the cause, and keep a history.** StarCraft II's alert jump keeps a history
  of 8 (§6). [DD]
- **Surprise pauses and unpauses confuse players** (Stellaris, research-paradox.md §2).
  [sib]

### Applies to Fluid Magic
Keep the three channels from research-paradox.md: the alerts ribbon (conditions), the
message feed (events), and per-type message settings. Add these cross-genre rules.

1. **Pause on an approaching threat (the Pillars rule).**
   - Battles auto-resolve the moment armies meet (docs/01 §10). "Battle involving the
     player" therefore pauses *after* nothing can be done any more. Keep that pause,
     because it leads to the summary and the replay, but it is not a warning.
   - The warning is a new message type: **"Hostile army sighted, heading to <province>
     (ETA n days)"**. It fires once per hostile army per sighting, when the army's visible
     next step is a province the player owns or occupies.
   - Default: Toast + Pause. It needs only data the movement code already keeps, filtered
     by visibility, so fog is never leaked.
2. **Coalesce.** If several pause-worthy events happen on the same day, pause once and
   show `Paused: 3 events ▸` in the reason chip under the clock. A click lists the events,
   each with a jump link.
   - At speed 4, many days pass every second. Toasts of the same type within 5 in-game
     days merge into one with a count, for example `Recruited ×3`.
3. **Predictable defaults** (the answer to "why did it pause here and not there?"):
   - **Pause:**
     - hostile army approaching (new)
     - battle involving the player
     - province lost
     - an enemy at one Wellspring short of victory
     - pretender arrived, wounded or killed
     - victory or defeat
   - **Toast only:** research level complete, ritual complete, dominion flipped, enemy
     sighted that is not heading for you.
   - **Log only:** recruit complete, building complete.
   - *Difference from research-paradox.md §4:* that document defaults research complete to
     Toast + Pause. This document recommends Toast without pause, to keep pauses for
     threats (RimWorld's lesson about inconsistent pausing). The spec owner decides.
4. **Auto-pause never auto-resumes by default.** Closing the popup leaves the game paused.
   One opt-in setting resumes the previous speed (research-paradox.md §2).
5. **A history you can walk.** `J` jumps to the latest alert or message, and repeated
   presses go back through the last 8 (StarCraft II). Each feed row has a jump button, and
   a Watch button for battles.
6. **Sound is a channel, never the only one.** Critical and severe alerts get a short cue
   when they appear (research-paradox.md §3). Each cue also has a visual pulse on the
   ribbon icon (XAG 103's additional channels, §11).

---

## 8. Onboarding

### Patterns
- **Guided, then reactive.**
  - CK3 runs a guided tutorial, then shows "special mini-tutorials to follow along so you
    don't get overwhelmed"
    ([GamingOnLinux](https://www.gamingonlinux.com/articles/16333/)). [press]
  - One player reports that these appear at the top of the screen
    ([Steam](https://steamcommunity.com/app/1158310/discussions/0/2943620809068177052/?l=italian)).
    [comm]
  - Reactive advice is described in research-paradox.md §12, along with the telemetry-led
    refresh and Vic3's "Tell me How / Tell me Why". [sib]
- **Ask about experience.**
  - When a new Civ VI game starts, the player picks "New to Civilization" or "New to
    Civilization VI". The advisor level can also be set in options.
  - One player describes the first choice as narrating each new mechanic as it appears,
    with a button for more information. The second speaks only about Civ VI-specific
    mechanics.
  - The separate main-menu Tutorial covers only early basics.
  - Sources: [Twinfinite](https://twinfinite.net/guides/civilization-vi-tips-and-tricks-for-beginners/);
    [Steam](https://steamcommunity.com/app/289070/discussions/0/1693788384136729642). [comm]
- **Teach with live examples.**
  - Factorio added a "tips and tricks" system in 1.0
    ([Factorio forums, FFF #361](https://forums.factorio.com/viewtopic.php?p=517297)). [DD]
  - In the discussion of its new-player-experience diary, players propose starting new
    players on a nearly finished base with deliberate gaps to fill, and keeping the whole
    tutorial to 45 to 60 minutes
    ([FFF #241 thread](https://forums.factorio.com/viewtopic.php?p=360698)). [comm]
- **Help that repeats tooltips adds nothing** (Old World, §1). [comm]
- **Dominions has no tutorial,** and that is its most-cited barrier
  (research-dominions.md §2). [sib]

### Applies to Fluid Magic
- **The New Game screen asks one question**, "How much guidance?", with three answers:
  - **Guide me** (new to the genre): the Learn objective, plus reactive hints, plus a
    pause before each *first* major concept.
  - **Hints only** (knows Dominions or Paradox): reactive hints, no pauses. *Default.*
  - **Off.**

  The answer can be changed at any time in Settings. "Reset hints" brings back the hints
  the player has dismissed.
- **The Learn objective is a pinned outliner section**, after research-paradox.md §12.
  - It has 6 to 8 steps, each checked from state by a pure selector.
  - Each step has *How*, which highlights the UI element and the map target, and *Why*,
    which opens the concept.
  - A full first match takes 45 to 75 minutes (docs/00), which is about the length
    Factorio's community proposes for a tutorial. Fluid Magic therefore needs no separate
    tutorial mode: the first match is the tutorial.
- **Reactive hints** use the blue "i" alert tier and fire on first occurrences: first
  starvation, unrest above 50, enemy dominion in your land, fort materials at cap, a
  scripted spell that cannot be cast, and the first battle lost.
  - Each hint is two sentences long and ends with a *Show me* link.
  - Hints never pause, except under "Guide me".
- **Concepts are content** (`src/content/concepts.ts`, research-paradox.md §6). Each
  concept has:
  - an id
  - a name
  - a one-line summary (the D1 text)
  - a paragraph (the Codex text)
  - a `seeIn` list of UI anchors (Codex → "Show where this appears" highlights them)
  - related ids

  Add the concepts to the content validation fixtures, as CLAUDE.md requires. Add a test
  that every concept id referenced from a UI string exists.
- **The Codex is generated, not hand-written.** It covers unit, spell, chassis, terrain,
  building and scale pages from the content registry, plus the concepts. Every entry
  adds something the tooltip does not have: an example, a comparison table, or "Castable
  by your …".
- **Battle sandbox (M2 candidate).** A unit or spell page in the Codex gets "Try in a test
  battle". It runs `resolveBattle` with two sample squads and an RNG the UI seeds itself,
  then opens the replay. This is Factorio's live-example idea, and it costs little because
  the resolver is pure.
- **Quiet, never hidden.** In the first game, panels and sections that do not apply yet
  (rituals before a caster exists, prophet before a priest) are collapsed, with a dim
  header that explains how to unlock them. This applies CK3's "show only parts of the
  interface" without hiding any rule.
- **Pretender presets are part of onboarding** (docs/05). Each preset button's tooltip
  shows the summary card's one-line "reading".

---

## 9. Undo and confirmation

### Patterns
- **Old World's undo.**
  - Ctrl+Z undoes any action. PC Gamer argued that every strategy game should have an undo
    button
    ([PC Gamer](https://www.pcgamer.com/put-an-undo-button-in-every-strategy-game)).
    [press]
  - Players note that undo is designed not to break anything, and is mostly unavailable
    once new information has been revealed
    ([Quarter to Three](https://forum.quartertothree.com/t/old-worlds-undo-feature-has-ruined-other-tbs-games-for-me/156031/7)).
    [comm]
- **Confirmation dialogs habituate users.**
  - A KDE user reports noticing a mistake only after clicking OK, from habit
    ([KDE mailing list](https://mail.kde.org/pipermail/active/2011-November/001793.html)).
    [comm]
  - Generic prompts train users to dismiss them without reading
    ([DEV Community](https://dev.to/137foundry/how-to-choose-between-confirmation-dialogs-undo-windows-and-soft-delete-patterns-1opj)).
    [comm]
  - Andy Matuschak's notes argue that well-designed interfaces make every action undoable
    ([Prefer undo to confirmation steps](https://notes.andymatuschak.org/zXH4ASvHNz488hCNgrBjQJK)).
    [comm] Simon Willison made the same argument in 2005
    ([post](https://feeds.simonwillison.net/2005/Mar/7/confirmation)). [comm]
  - Confirmation still fits genuinely irreversible, rare actions (DEV Community, above).
- **Dangerous key adjacency.** In Dominions, `e` (end turn) sits next to `r` (recruit).
  Dominions 6 added a confirm option (research-dominions.md §1.9). [sib]

### Applies to Fluid Magic
- **Undo while paused (the Old World rule, with time as the boundary).**
  - In Fluid Magic, new information arrives only when a day advances: movement, battles,
    sightings, AI moves every 5 days.
  - While the game is paused, the UI keeps a stack of `GameState` snapshots, one taken
    before each applied command. Ctrl+Z restores the last one, and Ctrl+Shift+Z redoes.
  - The stack is **cleared on the first `advance`**.
  - The RNG state is part of the snapshot. Undoing and redoing a command that rolls dice,
    such as the adept's 25% chance of a third pip, gives the same result, so undo cannot
    be used to reroll.
  - Snapshots are UI state. `src/sim` stays untouched, apart from structured-clone safety,
    which the save/load path already needs.
  - Cap the stack at 50.
  - Show the next undo in a chip next to the PAUSED label:
    `Undo: Recruit 10 Ember Warriors (Ctrl+Z)`.
  - *M4 note:* with an authoritative server, the same idea becomes a local buffer of
    unsent commands.
- **While running, undo means the sim's own reversals:** `cancelRecruit` (a full refund
  of gold, materials up to the cap), `reverse` for a move, and switching the order back.
  The toast for each command offers its reversal inline:
  `Recruiting 10 Ember Warriors · Cancel`.
- **Confirm only what paused undo cannot cover:** actions that are irreversible and taken
  while the clock runs, or that start or end the match.
  - Storm while the walls stand. docs/01 says to strongly discourage this, so show the
    forecast inside the confirmation.
  - Make Prophet, which has a 24-month cooldown if the prophet dies.
  - Starting the match from Pretender Design with unspent points.
  - Quitting to the menu with unsaved play.

  While paused, no confirmation is needed, because undo covers it.
- **The form of a confirmation is inline, not a modal.** The button changes to `Confirm
  Storm?` for 3 seconds, with its consequence written inside it. There is a per-type
  "Don't ask again", which can be reset in Settings → Interface.
- **No destructive bare keys.** No destructive action has a single-letter binding.
  Destructive actions need a button or a Shift chord.

---

## 10. Modal versus docked panels

### Patterns
- **The Vic3 critique.** Too many windows and clickthroughs, information spread across
  screens, and the remedies Paradox shipped (research-paradox.md §13). [sib]
- **The Dominions 6 lesson.** Scripting moved into the Army Setup screen, so players no
  longer go back and forth between screens. Players rewarded fewer screen switches
  (research-dominions.md §3). [sib]
- **The standards.** WCAG 1.4.13 expects layered content to be dismissible with the
  keyboard (§3.2). [std]

### Applies to Fluid Magic
- **Docked (non-modal)** for everything you do while watching the map: the province and
  commander panels, the outliner, the feed, the alerts, floating cards, and **ritual
  targeting**.
  - docs/07 calls the Ritual panel a modal "from commander (C)" whose target picker
    highlights provinces on the map. A modal over the map contradicts that.
  - Make it a docked list in the left dock, with a targeting mode on the map: valid
    provinces lit, invalid ones hatched, a range ring, and Esc to cancel.
- **Modal (large overlay)** only for planning surfaces that need the space and are used
  with the clock stopped:
  - Research (R)
  - the Ledger (L)
  - the Codex
  - Settings
  - the battle replay
  - Pretender Design (a full screen before the match)
- **Stopping the clock for modals.** Opening any modal pauses the game, and closing it
  restores the previous speed. This is a setting, on by default. The battle replay always
  pauses the game.
- **One dock, one stack.** The left dock shows one thing at a time, with a breadcrumb back
  stack, for example `Ashfen ▸ Varo ▸ Squads`.
  - The header has a ← button. Mouse button 4 also goes back, best effort with
    `preventDefault`.
  - Do not use Alt+Left, which is browser Back.
  - Panel headers carry the go-to, pin and zoom-to icons (research-paradox.md §5).
- **Never more than one modal.** A modal opening another (Codex from Research) *replaces*
  it, and keeps a back link.
- **Two button styles.**
  - *Action* buttons issue commands through `validate` and then `apply`. They have a gold
    keyline.
  - *Navigation* buttons open a panel. They have no keyline.
  - This follows Vic3, via research-paradox.md §13. Players can then see which clicks
    change the game.

---

## 11. Accessibility

### Patterns
- **GAG and XAG.** Both ask that no information rely on color alone, for readable default
  text and high contrast, and for symbol plus text pairing (§5). [std]
- **Motion.** XAG 117 was retitled in version 3.0, and now covers camera angles, field of
  view and other visuals that can cause motion sickness
  ([XAG version history](https://learn.microsoft.com/ar-sa/xbox/accessibility/xag-version-history);
  [Xbox Accessibility Guidelines](https://learn.microsoft.com/gaming/accessibility/guidelines)).
  [std]
- **Defaults matter.** Path of Exile players objected to screen shake being on by default
  while helpful detail was off (§3.5). [comm]
- **Players turn holds into toggles** (the BG3 mod, §3.5). [mod]
- **Flashing.** WCAG 2.3.1 forbids content that flashes more than three times in any
  one-second period, unless the flash is below the general and red flash thresholds
  ([W3C Understanding 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold)).
  [std, known]
- **Reduced motion.** The `prefers-reduced-motion: reduce` media query exposes the user's
  OS setting to the page
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)).
  [std, known]
- **Text size guidance is for the TV.** A third-party summary attributes a 28 px minimum
  text size at 1080p to XAG 101. That figure is for 10-foot console viewing and is not
  verified, so don't adopt it for a desktop game. Use the GAG "easily readable default"
  plus a scale slider.

### Applies to Fluid Magic (all in M1 Settings → Accessibility)

| Setting | Default | Implementation note |
|---|---|---|
| UI scale | 100% (80% to 200%) | Set the root `font-size`. All DOM sizes are in `rem`. The Pixi map's labels and badges read the same scale factor. |
| Text size | 100% (90% to 150%), body ≥ 14 px at 100% | Separate from UI scale, so text can grow without the layout growing. |
| Tooltip mode / delay / lock / nesting | §3 | |
| Detail key | Hold Shift (or Toggle) | §3.5 |
| Reduced motion | follows `prefers-reduced-motion` | Turns off: camera shake, panel slide animations, idle bobbing on the map, the float on damage numbers (they fade in place). Particle counts drop to the minimum (12, per docs/09). |
| Flash limit (battle) | on, cannot be turned off | Spell "flash" effects (docs/04 replay, docs/09 cast ring) are capped at 3 per second across the whole viewport. No bright flash covers more than a quarter of the viewport, and saturated red flashes are avoided. This is WCAG 2.3.1, and it binds the battle presentation design. |
| Screen shake | 50% (0% to 100%) | Default below full (the PoE lesson). Reduced motion sets it to 0. |
| Visual sound cues | on | Every SFX that carries information (alert appear, battle start, rout, spell cast in replay) has a visual pulse or caption chip (XAG 103). Battle replay SFX get a small caption track: `Ember volley`, `Rout: Thornwood Wardens`. |
| Pattern overlays / high-contrast borders / color letters | off | §5 |
| Pause on modal | on | §10. Pausing is the genre's built-in accessibility tool: every order can be given while paused (docs/00 pillar 3). |
| Keyboard focus | always | Every DOM control can be reached and has a visible `:focus-visible` ring. Panels can be used without a mouse. Map orders keep their mouse-first gestures in M1, with keyboard alternatives listed for M2 (arrow keys move a province cursor, Enter selects, M moves). |

---

## 12. The battle replay frame follows the same rules

research-dominions.md §5 and research-paradox.md §10 specify the frame. The cross-cutting
rules apply inside it unchanged, so the replay feels like the same game.

- **Same tooltip system.**
  - Hovering a squad block shows the unit's tooltip with *live* counts at the current
    round, its formation, and the buffs active on it.
  - Hovering a commander shows the current script step.
  - Shift gives detail, such as hit chances and damage rolls from the log.
- **Same time keys.**
  - Space pauses.
  - 1 to 4 select 0.5×, 1×, 2× and 4×, the spec's range.
  - ← and → step one round. Home and End jump to the start and end ("skip to end").
  - Esc closes the replay.
  - The keys mean the same thing on the map and in the replay: digits set the speed of
    time.
- **Same icons and color coding.** Spell flashes use the color's palette *and* its glyph
  in the particle burst. Ember particles include tiny flame glyphs, for example, so a
  color-blind viewer can still tell the spell's color.
- **Same accessibility settings.**
  - The flash cap and reduced motion apply to the replay.
  - With reduced motion, the lunge is replaced by a short highlight and the rout slide by a
    fade.
  - Caption chips stand in for SFX.
- **Summary first.** The battle message opens a five-second summary: result, losses on
  each side, and the decisive moment. *Watch* opens the replay
  (research-dominions.md §4.4). This is the progressive-disclosure ladder applied to a
  battle: summary, replay, then the per-unit log.

---

## 13. Not verified (the search budget ran out)

- The exact current wording of the NN/g articles on progressive disclosure and on
  confirmation dialogs. The definitions above come from search extracts and secondary
  reproductions.
- XAG 101's text-size figure (28 px at 1080p comes from a third-party summary), and the
  full text of XAG 103 and XAG 117.
- Whether Chrome lets a page `preventDefault` F1 (help) and F6 (address bar) today. Test
  it in the target browsers before keeping any F-key binding.
- How CK3's timer lock duration is set. research-paradox.md cites the diary.
- Whether RimWorld's letter shapes differ by severity as well as color.
- Which of the two Civ VI Steam threads in §7 contains each quoted player claim.

## 14. References

**Paradox**
- CK3: [PC Gamer](https://www.pcgamer.com/au/crusader-kings-3-sticks-to-what-it-does-best) ·
  [TheSixthAxis hands-on](https://www.thesixthaxis.com/2020/05/14/hands-on-crusader-kings-iii-a-new-era-of-intrigue-religious-wars-and-grand-strategy/) ·
  [GamingOnLinux on DD #16](https://www.gamingonlinux.com/articles/16333/) ·
  [Steam: mini-tutorials](https://steamcommunity.com/app/1158310/discussions/0/2943620809068177052/?l=italian) ·
  [Game Developer: CK3 tutorial refresh](https://www.gamedeveloper.com/design/deep-dive-refreshing-the-crusader-kings-iii-tutorial-mode-through-optimized-ux)
- EU5: [Tinto Talks #77](https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053) ·
  [TheSixthAxis EU5 review](https://thesixthaxis.com/2025/10/31/europa-universalis-v-review) ·
  [Steam: turn off nested tooltips](https://steamcommunity.com/app/3450310/discussions/0/604155654554287067)
- Vic3: [PCGamesN](https://www.pcgamesn.com/victoria-3/nested-tooltip-system)

**Other strategy and RPG games**
- Endless Legend 2: [Power Up Gaming](https://powerupgaming.co.uk/2026/09/16/endless-legend-2-full-release-brings-overhaul-to-cut-tedious-clicking/)
- Old World: [QT3 p.1543](https://forum.quartertothree.com/t/old-world-pka-ten-crowns-from-soren-johnson/134746/1543) ·
  [QT3 p.77](https://forum.quartertothree.com/t/old-world-pka-ten-crowns-from-soren-johnson/134746?page=77) ·
  [PC Gamer on undo](https://www.pcgamer.com/put-an-undo-button-in-every-strategy-game) ·
  [QT3 on undo](https://forum.quartertothree.com/t/old-worlds-undo-feature-has-ruined-other-tbs-games-for-me/156031/7)
- Civilization VI: [Console FAQ (tooltip modes)](https://support.civilization.com/hc/en-us/articles/37661409606547-Civilization-VI-Console-FAQ) ·
  [Twinfinite](https://twinfinite.net/guides/civilization-vi-tips-and-tricks-for-beginners/) ·
  [Steam: advisor](https://steamcommunity.com/app/289070/discussions/0/1693788384136729642) ·
  [Steam: yield breakdown](https://steamcommunity.com/app/289070/discussions/0/4762081419112004479) ·
  [Steam: yields](https://steamcommunity.com/app/289070/discussions/0/4030222834123572035) ·
  [Steam: notifications](https://steamcommunity.com/app/289070/discussions/0/282992646971461075) ·
  [Steam: unit needs orders](https://steamcommunity.com/app/289070/discussions/0/312265327165650851)
- Baldur's Gate EE: [Steam: tooltip delay](https://steamcommunity.com/app/228280/discussions/0/3432326055095021944)
- Baldur's Gate 3: [AlcastHQ](https://alcasthq.com/the-most-important-feature-in-baldurs-gate-3-show-world-tooltip/) ·
  [Nexus Mods #723](https://www.nexusmods.com/baldursgate3/mods/723)
- Path of Exile: [devtrackers](https://devtrackers.gg/pathofexile/p/9c4ded3b-why-does-horrible-options-like-screenshake-are-default-but-awesome-ones-like-advance-description-or-the-freaking-clock-arent) ·
  [Steam PoE2](https://steamcommunity.com/app/2694490/discussions/0/596260925367969924)
- RimWorld: [Events](https://rimworldwiki.com/wiki/Events) ·
  [Needs](https://rimworldwiki.com/wiki/Needs) ·
  [Mood](https://rimworldwiki.com/wiki/Mood) ·
  [Steam: pause options](https://steamcommunity.com/app/294100/discussions/0/3471730015111612394) ·
  [Steam: inconsistent pause](https://steamcommunity.com/app/294100/discussions/0/591760218823644744) ·
  [More Pause Events](https://steamcommunity.com/sharedfiles/filedetails/comments/1874708724)
- Pillars of Eternity: [Steam](https://steamcommunity.com/app/291650/discussions/0/1736595227843429278) ·
  [QT3](https://forum.quartertothree.com/t/the-spoiler-free-pillars-of-eternity-thread-about-managing-combat/76675) ·
  [Push Square](https://www.pushsquare.com/reviews/ps4/pillars_of_eternity_complete_edition)
- StarCraft II: [Blizzard game guide](https://news.blizzard.com/en-us/article/4552955/game-guide-special-control)
- Total War: [Xbox Wire hotkeys](https://news.xbox.com/en-us/?p=164012) ·
  [Prima Games](https://primagames.com/featured/total-war-warhammer-formation-control-guide-tips) ·
  [Steam: keybindings](https://steamcommunity.com/app/1142710/discussions/0/4358997660742583413)
- Slay the Spire: [untapped.gg](https://sts2.untapped.gg/guides/how-to-read-enemy-intent) ·
  [Steam](https://steamcommunity.com/app/646570/discussions/0/1699416432419204667)
- Factorio: [Lua API Concepts](https://lua-api.factorio.com/1.1.34/Concepts.html) ·
  [Hover ALT Mode](https://mods.factorio.com/mod/hover-alt-mode) ·
  [FFF #361 thread](https://forums.factorio.com/viewtopic.php?p=517297) ·
  [FFF #241 thread](https://forums.factorio.com/viewtopic.php?p=360698)
- Into the Breach: [Game Developer interview](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-) ·
  [GDC Vault](https://gdcvault.com/play/1025772/-Into-the-Breach-Design) ·
  [Game Developer video](https://gamedeveloper.com/design/video-how-subset-games-designed-i-into-the-breach-i-)
- Mini Metro: [Game Developer, GDC 2017](https://www.gamedeveloper.com/design/attend-gdc-2017-and-learn-the-value-of-less-is-more-from-a-i-mini-metro-i-dev)

**MTG and ReCore**
- MTG: [Mana](https://mtg-archive.fandom.com/wiki/Mana) ·
  [Mana Cost](https://mtg-archive.fandom.com/wiki/Mana_Cost) ·
  [MTG Rocks on Arena](https://mtgrocks.com/mtg-arena-is-still-missing-critically-needed-features/)
- ReCore: [MCV/Develop](https://mcvuk.com/?p=62330)

**Reference library**
- Game UI Database: [site](https://www.gameuidatabase.com/) ·
  [80.lv](https://80.lv/articles/game-ui-database-2-0-has-been-released) ·
  [AlternativeTo](https://alternativeto.net/news/2024/8/game-ui-database-2-0-launches-with-over-55-500-screens-and-enhanced-tools-for-ui-designers/) ·
  [Creative Bloq](https://creativebloq.com/3d/video-game-design/game-ui-database-20-is-the-ultimate-free-reference-tool-for-game-designers)

**Standards and UX writing**
- [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) ·
  [Uxcel](https://uxcel.com/lessons/progressive-disclosure-597)
- [W3C WCAG 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus) ·
  [W3C WCAG 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold) ·
  [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [GAG reproduction](https://www.webbie.org.uk/blog/?p=115) ·
  [XAG 103](https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/103) ·
  [XAG version history](https://learn.microsoft.com/ar-sa/xbox/accessibility/xag-version-history) ·
  [Xbox guidelines](https://learn.microsoft.com/gaming/accessibility/guidelines) ·
  [Unity Learn](https://learn.unity.com/course/design-and-development/tutorial/important-information-and-communication)
- Undo and confirmation: [Matuschak](https://notes.andymatuschak.org/zXH4ASvHNz488hCNgrBjQJK) ·
  [Willison](https://feeds.simonwillison.net/2005/Mar/7/confirmation) ·
  [KDE](https://mail.kde.org/pipermail/active/2011-November/001793.html) ·
  [DEV Community](https://dev.to/137foundry/how-to-choose-between-confirmation-dialogs-undo-windows-and-soft-delete-patterns-1opj)

**Browser**
- [Mozilla bug 1203059](https://bugzilla.mozilla.org/show_bug.cgi?id=1203059) ·
  [WebKit bug 35849](https://bugs.webkit.org/show_bug.cgi?id=35849) ·
  [W3C fullscreen discussion](https://lists.w3.org/Archives/Public/public-webapps-github/2020Sep/0071.html) ·
  [Chrome Keyboard Lock](https://developer.chrome.com/docs/capabilities/web-apis/keyboard-lock) ·
  [GitLab 386209](https://gitlab.com/gitlab-org/gitlab/-/issues/386209)

**Companion research:** `research-paradox.md` and `research-dominions.md` in this folder,
whose own citations are referenced above as [sib].

---

## 15. Checklist Fluid Magic should satisfy

Each item can be answered yes or no. **(sim)** marks items that need a change under
`src/sim/` and a unit test. **(test)** marks items that can be checked automatically.

**Disclosure and hierarchy**
- [ ] Every UI value is assigned to one depth (D0 to D4), and nothing needed for a decision
      lives only in D1 or deeper.
- [ ] The top bar shows each stock with a signed monthly delta, and the Wellspring victory
      track.
- [ ] Visible hostile armies in transit show an arrow and an ETA on the map.
- [ ] Unrest, supply and dominion show a target marker or `now → projected`.
- [ ] Right-click hover shows the ETA, supply after arrival and the battle forecast range
      on the cursor label.
- [ ] Holding Shift with nothing hovered shows numeric map labels. No information is
      available only at certain zoom levels.
- [ ] At 1280x720 the map is at least 880 px wide with the left dock open (and about
      1230 px with it closed), because the right dock collapses to a rail.
- [ ] Any action is at most 3 clicks from the map, and any explanation at most 3 hovers
      deep.

**Tooltips**
- [ ] One tooltip component serves DOM panels and the Pixi map (positioned over the map).
- [ ] Tooltips are hoverable, dismissable with Esc, persistent, and open on keyboard focus
      (WCAG 1.4.13). **(test)**
- [ ] Mode (Hover, Key only, Off), delay, lock timer and nesting can each be set.
- [ ] There is a warm state that skips the delay when moving between triggers.
- [ ] Concept terms are dotted-underlined and in the concept color. Lock is by timer,
      middle-click or `T`. Depth is capped at 3. Pin turns a tooltip into a floating card
      (at most 3).
- [ ] Holding Shift expands to the detail view (≥250 ms when held alone). A toggle is
      available.
- [ ] Every tooltip follows the anatomy: title and value, a one-line meaning, a breakdown
      table, and a gesture footer.
- [ ] Disabled actions show a condition block with ✓ and ✗ for *every* check.
      **(sim: `checkCommand` returning `Check[]`; `validateCommand` = first failure; test)**

**Breakdowns**
- [ ] `explain*` selectors exist for gold, unrest, supply, mana, growth, research and
      dominion, returning `{ total, unit, terms }`. **(sim)**
- [ ] A property test asserts that each explain total equals its selector's total over
      random states. **(test)**
- [ ] Multiplicative breakdowns show running values. Caps, floors and overflow show as
      rows of their own.
- [ ] Every value carries a unit (`/mo`, `/day`). Tooltip rows sum visibly to the total.
- [ ] Every breakdown ends with a projection line ("52 in 3 months", "Starving in 4
      days").

**Icons and color**
- [ ] Each of the five colors appears with its hue, glyph and letter. Costs render
      MTG-style: colored pips first, then the generic number.
- [ ] No signal uses hue alone. The table in §5 is implemented: deficits, alert tiers, army
      allegiance, valid targets, fog and supply states.
- [ ] Icons in panels always come with a number or a word. A state is a corner badge on a
      noun's silhouette, never a new silhouette.
- [ ] The developer color-deficiency and greyscale filter exists, and the greyscale smoke
      test of the top bar and alert ribbon passes. **(test)**
- [ ] Pattern overlays, high-contrast borders and color letters are available.

**Input**
- [ ] Left-click selects, right-click moves, Shift+right-click appends a waypoint, and
      Shift+left-click adds to the selection. The browser context menu is suppressed only
      on the map.
- [ ] Space, 1 to 4, +/− and Z/X control time. Tab cycles commanders only when the map has
      focus. N goes to the next idle commander. J walks back through the last 8 alerts and
      events. Backspace goes to the capital and forts.
- [ ] Map modes are on Shift+1 to 6 and M. F-keys are best effort only.
- [ ] The Esc ladder is implemented, and every layer also has a visible close control.
- [ ] The binding table refuses browser-reserved combinations and has no duplicates within
      a context. **(test)**
- [ ] Every action can be rebound. Each button's tooltip shows its key, and the `?` overlay
      lists the keys per screen.
- [ ] A `beforeunload` prompt guards unsaved play. Autosave writes to 3 rotating slots at
      each month boundary. Ctrl+S saves.

**Notifications and pause**
- [ ] Alerts (conditions), messages (events) and the per-type settings matrix are
      separate.
- [ ] The "Hostile army approaching (ETA n)" message exists, defaults to pausing, and
      respects fog.
- [ ] Interrupts on the same day coalesce into one pause, and the reason chip lists all of
      them. Toasts of one type merge within 5 in-game days.
- [ ] The game never auto-resumes after an auto-pause, unless the player opts in.
- [ ] Every information-carrying sound has a visual equivalent.

**Onboarding**
- [ ] New Game asks "How much guidance?" with the answers Guide me, Hints only (default)
      and Off. The choice can be changed at any time, and dismissed hints can be reset.
- [ ] The Learn objective is in the outliner, with 6 to 8 selector-checked steps, each
      with How and Why.
- [ ] Reactive first-occurrence hints are in the blue alert tier, with a "Show me" link.
- [ ] Concepts are content: summary, paragraph, `seeIn` anchors and related ids. They are
      in the validation fixtures, and every referenced concept id exists. **(test)**
- [ ] The Codex is generated from the registry, and every page adds something the tooltip
      lacks.
- [ ] Sections that do not apply yet are collapsed with an unlock hint, never removed.

**Undo and confirmation**
- [ ] Undo and redo work while paused, using snapshots that include the RNG. The stack
      clears on `advance`, holds at most 50, and shows a visible undo chip. **(test:
      undo, then redo, of a dice-rolling command gives an identical state)**
- [ ] While the game runs, a toast offers the inline reversal (cancel recruit, reverse a
      move).
- [ ] Inline confirmation is used only for irreversible actions taken while the clock
      runs: Storm (with the forecast), Make Prophet, starting with unspent points, quitting
      with unsaved play. "Don't ask again" can be reset.
- [ ] No destructive action is bound to a bare key.

**Panels**
- [ ] Ritual targeting is docked, with a map targeting mode, not a modal.
- [ ] Modals are limited to Research, the Ledger, the Codex, Settings, the replay and
      Pretender Design. Only one modal is open at a time. A modal pauses the game (a
      setting, on by default).
- [ ] The left dock has a back stack with a breadcrumb, and header icons for go-to, pin
      and zoom-to.
- [ ] Action buttons (keyline) look different from navigation buttons.

**Accessibility**
- [ ] UI scale and text size are separate settings, with all DOM sizes in `rem`. Pixi
      labels follow the UI scale.
- [ ] Reduced motion follows `prefers-reduced-motion` and covers both the map and the
      replay.
- [ ] Battle flashes are capped at 3 per second across the viewport (WCAG 2.3.1). This is
      stated as a constraint on the battle presentation design.
- [ ] Screen shake defaults to 50% and can be set to 0.
- [ ] Every DOM control is reachable by keyboard and has a visible focus ring.

**Battle replay frame**
- [ ] The replay uses the same tooltips with live counts, the same time keys (Space, 1 to
      4, ← and →, Home and End, Esc), the same icons with glyphs in the particles, and the
      same accessibility settings.
- [ ] The summary comes first and the replay is optional.
