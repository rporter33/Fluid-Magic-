# Paradox grand strategy UI patterns, applied to Fluid Magic

Cluster: Crusader Kings III (CK3), Europa Universalis IV (EU4), Victoria 3 (Vic3), Stellaris,
Hearts of Iron IV (HoI4). EU5 (2025) is used in a few places because its dev diaries say
outright what Paradox kept and changed from CK3 and EU4.

Direction this serves: "Make sure the UI matches those of similar games; where complexity is
tastefully layered under smart menu design." Also: the battle replay needs a frame that
matches the rest of the UI.

## How this was researched, and how far to trust it

- Direct page fetches failed in this environment: WebFetch could not resolve DNS, and the
  proxy refused curl to paradoxwikis.com. Every claim below comes from web-search
  extracts of the cited pages, and each claim cites its URL. Where an extract was ambiguous,
  the claim is worded cautiously or flagged.
- Source tags: **[DD]** official Paradox dev diary or patch notes, **[wiki]** Paradox
  community wiki, **[press]** review or editorial, **[comm]** forum, Steam thread,
  third-party guide or mod page. Treat [comm] items as evidence of player experience, not
  as specifications. Wiki pages can lag the current patch.
- Several key bindings differ across third-party lists (noted where it matters).

---

## 0. The layering model Paradox uses (the frame for everything else)

Across all five games, information comes in the same five layers. Each layer is one gesture
deeper than the one before.

| Layer | Gesture | What lives there | Examples |
|---|---|---|---|
| L0 always on | none | top bar numbers with monthly delta, date and speed, alert icons, outliner, map | EU4 treasury with +/- ([wiki](https://eu4.paradoxwikis.com/Ingame_screen)); Stellaris stock + monthly gain ([wiki](https://stellaris.fandom.com/wiki/Main_interface)) |
| L1 hover | point | a tooltip with the breakdown of the number or the meaning of the icon | EU4 treasury tooltip explains why you are in the black or red ([wiki](https://eu4.paradoxwikis.com/Ingame_screen)) |
| L2 nested hover | point at a highlighted term in a tooltip, lock it | concept explanations, chained | CK3 "tooltips in tooltips" ([DD](https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/)) |
| L3 click | click a number, alert, map object | a contextual docked panel (province, character, army) | EU4 province interface on left-click ([wiki](https://eu4.paradoxwikis.com/Province_interface)) |
| L4 full screen | hotkey or button | ledger, encyclopedia, tech tree, settings | EU4 Ledger (L) ([wiki](https://eu4.paradoxwikis.com/Ledger)); CK3 Encyclopedia ([DD](https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/)) |

**Applies to Fluid Magic:** use this table as the spec's organizing rule. Every number in
`docs/07-ui.md` gets a layer. L0 shows the number and its monthly delta. L1 shows a
breakdown generated from `src/sim/selectors.ts` (`provinceEconomy`, `nationEconomy`,
`nationSummary`, `dominionScore`). L2 explains the concepts in that breakdown. L3 is the left
dock. L4 holds the modals (Research R, Rituals C, a new Ledger and Codex). Nothing that
changes a decision should sit only at L2; section 13 explains why.

---

## 1. Top bar: resources with +income and hover breakdowns

### Patterns
- **Stock plus signed monthly delta, hover for the why.** EU4 shows the treasury with a gold
  icon and a + or − for the balance. Hovering shows monthly income and why the balance is in
  the black or red. The manpower tooltip shows how many men your armies need for
  reinforcement, the maximum reserve, and the change projected for next month
  ([EU4 wiki, Ingame screen](https://eu4.paradoxwikis.com/Ingame_screen)). [wiki]
- **Click a resource to open the screen where you act on it.** In Stellaris, each basic
  resource (energy, minerals, food, consumer goods, alloys) shows its stock and monthly gain,
  and clicking it opens the market. Influence and unity open the Claims and Traditions
  screens. The research hover splits physics, society and engineering
  ([Stellaris wiki, Main interface](https://stellaris.fandom.com/wiki/Main_interface)). [wiki]
- **Warning colors with specific meanings.** In Stellaris, a full stockpile is shown in
  yellow, because further gain is wasted. A monthly deficit is shown in red
  ([Stellaris wiki, Beginner's guide](https://stellaris.fandom.com/wiki/Beginner's_guide)).
  [wiki]
- **Fixed grouping.** CK3's top bar holds, from the left, gold, prestige, piety and renown,
  then troops and the domain limit. Hovering any indicator shows detail below it, for
  example renown per month and its sources
  ([gamepressure CK3 interface](https://www.gamepressure.com/crusader-kings-3/interface-description/z2f0f6)).
  [comm] HoI4 puts its national stats in a row across the top left to center, and puts the
  clock, time scale, world tension, menu and a dismissed-alerts button on the right
  ([HoI4 wiki, User interface](https://hoi4.paradoxwikis.com/index.php?title=User_interface&veaction=edit&section=14);
  [Steam player's guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1226393187)).
  [wiki][comm] Vic3's top bar has two rows: capacity balances, then key demographics
  ([Vic3 wiki, User interface](https://vic3.paradoxwikis.com/User_interface)). [wiki]

### Applies to Fluid Magic
- Top bar order, left to right: **nation banner and pretender portrait** (click opens
  nation summary), **gold** `1,240 (+38)`, **materials** (capital fort pool), the **mana**
  stockpile in five slots `W U B R G`, each with its mana symbol, stock and `+n/mo` (M1
  shows only the colors the player has or produces; the other slots stay as dim placeholders
  so the layout does not shift), **research** `RP/mo · active color · days to next level`,
  **dominion score**, then the alerts ribbon below and date/speed at the right. This is the
  EU4/Stellaris arrangement, which fits the spec's `TopBar` order.
- Every value carries a signed monthly delta computed by the same selector the sim uses.
  The hover breakdown is a table (see section 6, EU5 tables): rows per source (each
  province's tax, upkeep per commander group, sacred discount), and a total. Gold: income
  rows from `provinceEconomy` summed, then upkeep rows. Mana: springs per province, the
  dominion tint row (`floor(strength/3)`), and ritual spending queued.
- Click behavior, after Stellaris: gold opens the Ledger at its economy tab, mana opens the
  Ritual panel (or the Ledger's mana tab if no caster is selected), research opens Research
  (R), dominion opens the dominion map mode.
- **Materials are local to forts** (`01-core-rules.md` 4). Show the capital's pool in the
  bar and list every fort's pool, cap and months-to-cap in the tooltip. Use Stellaris's
  "full means wasted" yellow when any fort is at its 6-month cap, because the rules say
  overflow is lost. This is a direct mapping. Mana has no cap, so it never turns yellow.
- **Supply is local too.** Do not put a supply number in the bar. Show it as an alert
  (section 3) when any army starves.
- Red deficit and yellow waste must also carry a shape: a ▼ glyph for a deficit and a "full"
  glyph for waste. `09-art-direction.md` requires that color never be the only signal.

---

## 2. Date and speed controls

### Patterns
- **Five speeds, Space to pause, +/- to step.** In EU4, Space plays or pauses, and + and −
  speed up or slow down. Speed 1 passes a day every 2 s, speed 2 every 1 s, speed 3 every
  0.5 s, speed 4 every 0.2 s, and speed 5 runs as fast as the machine allows
  ([EU4 wiki, Controls](https://eu4.paradoxwikis.com/Controls)). [wiki]
- **Number keys set speed directly.** CK3: 1 to 5 set speed, Z/X or numpad −/+ step it, and
  Space pauses ([Magic Game World CK3 controls](https://www.magicgameworld.com/crusader-kings-3-pc-keyboard-controls-guide/);
  [DefKey CK3](https://defkey.com/crusader-kings-3-shortcuts)). [comm] Vic3 also uses Space
  and 1 to 5 ([DefKey Vic3](https://defkey.com/victoria-3-shortcuts)). [comm]
- **Placement.** CK3 puts the date, the speed bar and pause at the bottom right, next to the
  encyclopedia and game menu buttons
  ([gamepressure CK3 interface](https://www.gamepressure.com/crusader-kings-3/interface-description/z2f0f6)).
  [comm] Stellaris shows the date with pause and speed buttons next to it, and Space and +/−
  as hotkeys. Speed hotkeys are disabled in multiplayer
  ([Stellaris wiki, Main interface](https://stellaris.fandom.com/wiki/Main_interface)). [wiki]
  HoI4 puts the clock and time scale at the right of the top bar (sources in section 1).
- **Paused must look paused.** In CK3, players report that the green speed bar turns red when
  the game is paused, and that every order and menu works while paused
  ([Steam thread](https://steamcommunity.com/app/1158310/discussions/0/3761101693153821101);
  [Steam thread](https://steamcommunity.com/app/1158310/discussions/0/4633734182370033182)).
  [comm]
- **Auto-unpause is a separate setting that confuses players.** Stellaris has separate
  toggles for Event Popups, Event Auto-Pause and Event Auto-Unpause. Players report surprise
  pauses and unpauses
  ([Steam: popups and pause](https://steamcommunity.com/app/281990/discussions/0/357286532028618957/);
  [Steam: auto-pause unpausing](https://steamcommunity.com/app/281990/discussions/0/357286033299834552/)).
  [comm]

### Applies to Fluid Magic
- Keep the spec's Space, 1 to 4, and +/−. Add Z/X as alternate step keys (CK3), because
  numpad keys are missing on many laptops.
- Place the cluster at the top right (EU4, Stellaris and HoI4 do this, and the spec's top
  bar already holds the date): `[Y1 M3 D14] [⏸ ▮▮▮▯]`. Speed shows as filled pips. A thin
  bar under the date fills over the 30-day month so the player can see when the next
  monthly payout comes. Hovering the date shows "Next month in 12 days: +38 gold, +3 R".
- Paused state uses three channels: the cluster tints red (CK3), the word **PAUSED** appears,
  and the pips are hatched, so it is clear without hue.
- When the game auto-pauses, show the reason as a chip under the clock, for example
  `Paused: battle at Ashfen ▸`. Clicking the chip goes to the cause. This answers the
  Stellaris complaint "why did it pause?".
- Add one setting from Stellaris: "Resume speed after closing an auto-pause popup" (off by
  default). Pause state is runner/UI state and never enters `GameState`, so determinism is
  unaffected.

---

## 3. Alerts ribbon: priority, color, interaction

### Patterns
- **Three colors by urgency, and they are actionable.** EU4 alerts sit in the upper left
  under the country shield. Red is urgent and should be dealt with immediately, yellow is
  less important, and green is essentially not urgent. Brown flags with a red edge are
  diplomatic requests ([EU4 wiki, Ingame screen](https://eu4.paradoxwikis.com/Ingame_screen)).
  [wiki] Clicking an alert opens the menu where you deal with it
  ([Superjump EU4 first turn](https://www.superjumpmagazine.com/intro-to-europa-universalis-iv-the-first-turn/)).
  [press]
- **Three dismissal strengths.** EU4: left-click goes to the interface, right-click
  dismisses, and Shift+right-click disables the alert for the rest of the game. Disabled
  alerts are re-enabled from the outliner's "Disabled alerts" entry
  ([EU4 wiki, Ingame screen](https://eu4.paradoxwikis.com/Ingame_screen);
  [Paradox forum](https://forum.paradoxplaza.com/forum/threads/discarding-alerts-lost-functionality-from-the-previous-game.1867658/);
  [Steam](https://steamcommunity.com/app/236850/discussions/0/1327844097108574906/)). [wiki][comm]
- **EU5 widened the palette and made dismissal conditional.** EU4 had three alert colors and
  EU5 added three: orange (between yellow and red), blue (pure UI hints such as tutorial
  notices), and purple (situations and disasters). A discarded alert comes back only if its
  conditions change ([Tinto Talks #77](https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053)).
  A later patch added permanent mute
  ([Tinto Talks #94](https://forum.paradoxplaza.com/forum/developer-diary/tinto-talks-94-14th-of-january-2026.1895172/)).
  [DD]
- **Alerts are for things you can act on, not constant status.** CK3's top-bar alerts include
  a prompt to marry and a warning that your dynasty has no heir. Clicking one takes you to the
  relevant action. The diary says alerts are *not* reminders of constant states such as being
  at war or a truce expiring ([CK3 DD #16](https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/)).
  [DD] Alerts, reactive advice and "current issues" share one "important actions" system. The
  declared type controls how each looks and where it appears, and each can open the window that
  fixes it ([CK3 DD #37, Making Mods](https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-37-making-mods.1410656/)).
  [DD] Patch 1.2 added more prominent sound effects to top-bar alerts, advice and diplomatic
  notifications ([CK3 wiki, Patch 1.2](https://ck3.paradoxwikis.com/Patch_1.2)). [wiki]
- **Persistent and transient shapes.** In Stellaris, square alerts stay until the situation
  changes or you right-click to dismiss them. Round alerts fade after a short time. Color
  shows urgency, and each type can be disabled and re-enabled through the outliner
  ([Stellaris wiki, Main interface](https://stellaris.fandom.com/wiki/Main_interface)). [wiki]
- **Hover explains, click navigates.** HoI4: hover an alert icon for a text box that explains
  it, and click to go where the issue is or where you can handle it
  ([Steam RTS gamer's guide to HoI4](https://steamcommunity.com/sharedfiles/filedetails/?id=700703772)).
  [comm] Dismissed alerts are collected under a button on the top bar
  ([Steam player's guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1226393187)).
  [comm]
- **A single "situations" button with a count, glow and restore.** In Vic3, the situations
  button shows how many categories are present and glows gold when there is new information.
  You remove an item by right-click or a hover "x", and a refresh icon with a count restores
  removed items. Some alerts float as icons beside the button
  ([Vic3 wiki, User interface](https://vic3.paradoxwikis.com/User_interface)). [wiki]

### Applies to Fluid Magic
- Put an **alerts ribbon** directly under the top bar on the left, as in EU4/CK3. Each alert
  is a *condition* computed from state every UI frame or tick by pure selectors. It is not a
  queued event, so it disappears when the condition clears. This keeps `src/sim` free of UI
  concerns and fits CK3's "actionable, not constant status" rule.
- Six tiers, following EU5, each with a **distinct shape** so color is never the only signal:

| Tier | Color + shape | Fluid Magic examples (all derivable from selectors) |
|---|---|---|
| Critical | red octagon | army starving (supply < consumption), gold below 0 (troops losing morale), capital besieged, pretender wounded or in enemy province |
| Severe | orange triangle | province unrest > 50 (recruitment blocked), enemy army adjacent to a fort, enemy dominion flipping one of your provinces |
| Attention | yellow diamond | idle commander, fort materials at cap (wasted), recruit queue empty at a fort with materials, research color unset |
| Opportunity | green circle | Wellspring claimable, prophet available, ritual affordable with a caster present, unclaimed spring in an owned province |
| Hint | blue "i" | reactive advice, first-time explanations (section 12) |
| Situation | purple hexagon | Wellspring race: any nation at n−1 Wellsprings, an enemy pretender awakened |

- Each icon shows a **count badge** (for example, 3 idle commanders) so similar conditions
  share one icon. Hover lists every item with a jump link. Left-click goes to the first item,
  and clicking again cycles through the rest. Right-click dismisses the alert until its
  condition goes false and comes back true (EU5 rule). Shift+right-click mutes the type for
  the session, and muted types are restored from a "Muted alerts" entry at the bottom of the
  outliner (EU4).
- Sound: give critical and severe alerts a short cue when they *appear* (CK3 1.2), and none
  for the others. The battle presentation track owns the SFX palette, so take the cue sounds
  from it.

---

## 4. Message settings: popup, log or pause per event type

### Patterns
- **Per-type matrix in EU4.** Esc menu → Message Settings lists a large number of message
  types. Per type you choose whether it pops up and whether it pauses, or you send it only to
  the log. The icon at the lower right of a popup opens that type's setting directly
  ([Steam: Message Settings](https://steamcommunity.com/app/236850/discussions/0/496879865901102141/);
  [Paradox forum: Message settings](https://forum.paradoxplaza.com/forum/threads/message-settings.908604/);
  [Steam: pause settings](https://steamcommunity.com/app/236850/discussions/0/617328415057171883/)).
  [comm]
- **Players miss the matrix when it is cut.** HoI3's message settings set per type whether a
  message pauses and pops up, goes to the log, or shows on the map
  ([HoI3 tips blog](http://heartsofiron3tips.blogspot.com/2011/10/introduction-to-hoi3-message-settings.html)).
  HoI4 shipped with a simpler global "Pause on notification" and popup checkboxes, and players
  asked for the per-type options back
  ([Steam](https://steamcommunity.com/app/394360/discussions/0/1679190184059689233);
  [Steam](https://steamcommunity.com/app/394360/discussions/0/1850323802583652972/);
  [Paradox forum](https://forum.paradoxplaza.com/forum/threads/people-have-played-the-game-now-does-hoi-4-need-message-settings.943664/)).
  [comm] CK3 players made the same complaint relative to CK2 and filled the gap with mods
  ([Steam](https://steamcommunity.com/app/1158310/discussions/0/3108017414043607578);
  [Auto-Pause mod](https://steamcommunity.com/workshop/filedetails/?id=3330057298)). [comm]
- **Vic3 restored it in 1.2.** The Message Settings panel sets how each notification type is
  displayed and whether it auto-pauses in single player
  ([Vic3 DD #74](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-74-ux-improvements);
  [Vic3 DD #78 changelog](https://steamcommunity.com/games/529340/announcements/detail/3673286392196873445)).
  [DD] The display modes are toasts (banners at the top), a feed (bottom right) and popups.
  Hovering a notification reveals a settings icon to change that type
  ([Vic3 wiki, User interface](https://vic3.paradoxwikis.com/User_interface);
  [Steam thread](https://steamcommunity.com/app/529340/discussions/0/604168604057131949/)).
  [wiki][comm]
- **Edit in place.** Stellaris: Ctrl+click a notification to disable it or change its
  behavior in the message settings
  ([Steam thread quoting patch notes](https://steamcommunity.com/app/281990/discussions/0/357286532028618957/)).
  [comm]

### Applies to Fluid Magic
- Give every message type in `07-ui.md` "Messages" a row in a **Message Settings** table
  (Settings → Messages). Columns: `Off | Log | Toast | Popup` (radio) and `Pause` (checkbox).
  Defaults follow the spec's auto-pause list: battle involving the player = Popup + Pause,
  province lost = Popup + Pause, research level complete = Toast + Pause (toggleable),
  victory = Popup + Pause. Recruit complete = Log. Ritual complete = Toast. Dominion flipped
  = Toast. Starvation = Log, because the red alert already covers it. Enemy sighted = Toast.
  Wellspring claimed (any nation) = Popup + Pause.
- Every toast, popup and log line carries a small gear icon (Vic3/EU4) that opens a
  two-control popover for its type. Ctrl+click also works (Stellaris).
- Separate *messages* (events that happened) from *alerts* (conditions now true). The spec
  puts messages in the right dock. Keep them in a collapsible **feed** at the bottom of the
  right dock, under the outliner, as in Vic3. Each line gets a jump button, a "replay" button
  for battles, and a per-type icon.
- Store settings in UI preferences (localStorage plus the save file's UI block), never in
  `GameState`.

---

## 5. Outliner: the right-side list of everything you own

### Patterns
- **Configurable, and sections appear only when relevant.** EU4's outliner is toggled from the
  top right. A "+" opens a submenu where you choose the entries: armies (hover shows the
  regiment makeup), navies, your sieges with progress, hostile sieges on your land, colonists
  and their chances, rebel progress. Navies is hidden if you have no ships, and Land Combat
  disappears when you are not fighting
  ([EU4 wiki, Ingame screen](https://eu4.paradoxwikis.com/Ingame_screen);
  [Orcz EU4 Outliner](http://orcz.com/Europa_Universalis_4:_Outliner)). [wiki][comm]
- **Pins, with keyboard access.** CK3's outliner tracks raised armies, domain holdings and
  pinned characters. You pin a character from the right-click menu
  ([GameSkinny CK3 tips](https://www.gameskinny.com/tips/crusader-kings-3-tips-guide-for-getting-started/)).
  [comm] Q toggles the outliner and Alt+Q pins or unpins the current window. Patch 1.19 lets
  you pin any title or holding. Armies can be selected with Alt+number, and N selects the next
  army ([CK3 wiki, Keyboard shortcuts](https://ck3.paradoxwikis.com/index.php?mobileaction=toggle_view_mobile&title=Keyboard_shortcuts);
  [CK3 wiki, Patch 1.19](https://ck3.paradoxwikis.com/Patch_1.19)). [wiki]
- **Auto-pins plus a star icon.** Vic3 automatically pins laws being passed, diplomatic actions
  and pending events. Players pin formations, interest groups or market prices with the star
  icon found on many tabs. Shift+F1 opens the outliner
  ([Vic3 wiki, User interface](https://vic3.paradoxwikis.com/User_interface);
  [Vic3 wiki, Keyboard shortcuts](https://vic3.paradoxwikis.com/Keyboard_shortcuts)). [wiki]
- **Grouped dropdowns, collapsed by default when noisy, and header actions.** The Vic3 1.6
  outliner rework gave ongoing diplomatic actions and the multiplayer player list their own
  dropdowns. Some dropdowns, such as Interest Groups, now start closed. Go-to, pin and zoom-to
  became small icon buttons in panel headers, following the standard used in other panels
  ([Vic3 DD #117, UX of Sphere of Influence](https://forum.paradoxplaza.com/forum/developer-diary/victoria-3-dev-diary-117-the-ux-of-sphere-of-influence.1677959/)).
  [DD]
- **Double-click to jump, collapsible panel.** Stellaris's outliner on the right edge lists
  planets, fleets, and construction and science ships. Double-clicking an entry moves the
  camera to it, and the panel can be minimized to a small button
  ([Steam beginner's guide](https://steamcommunity.com/sharedfiles/filedetails/?id=954597865);
  [Steam thread](https://steamcommunity.com/app/281990/discussions/0/1846946102846529261/)).
  [comm] O toggles it ([Stellaris Fandom, Main interface](https://stellaris.fandom.com/wiki/Main_interface)).
  [wiki] Planets get small status icons in the outliner, such as open building slots,
  unemployment and low housing ([Paradox forum](https://forum.paradoxplaza.com/forum/threads/does-2-3-3-stellaris-tell-you-if-you-have-unemployed-pops-or-districts-buildings-without-workers.1223428/)).
  [comm]
- **Priority-ordered categories and pins (Stellaris 4.4).** The Situation Log groups entries
  into collapsible categories ordered by urgency. Players can pin entries into a Priority
  category at the top, and a separate Findings tab takes exploration clutter out of the main
  feed ([Stellaris DD #417](https://forum.paradoxplaza.com/forum/developer-diary/stellaris-dev-diary-417-situation-log-updated.1918530/);
  [xpgained summary](https://xpgained.co.uk/patch-notes/stellaris-dev-diary-417-situation-log-updated-notes-23rd-april-2026)).
  [DD][comm]

### Applies to Fluid Magic
- The spec's right dock should become a **Paradox outliner** above the message feed. It has
  collapsible sections with counts, and empty sections hide themselves (EU4):
  1. **Pinned** (star icon in the province and commander panel headers, Vic3. Alt+Q pins the
     current selection, CK3).
  2. **Commanders**, grouped by province. Each row shows a portrait, an order icon, troop
     count, and status glyphs (starving, unpaid, idle, wounded) like Stellaris's planet icons.
     Idle commanders sort to the top.
  3. **On the move**: commanders in transit, with destination and ETA.
  4. **Sieges**: yours and against you, with progress bars (EU4's two entries).
  5. **Rituals in progress**: caster, ritual, days left, mana symbols.
  6. **Recruitment**: per fort, queue head and days left, and materials vs cap.
  7. **Research**: active color and progress to the next level.
  8. **Wellsprings**: each known Wellspring's owner or claim progress, which is the victory
     track.
  9. **Muted alerts** (only when any exist).
- Row interactions: click selects (left dock opens), double-click selects and centers the
  camera (Stellaris), hover shows a compact tooltip (EU4 army composition: squads and counts).
  A row's right-click menu holds the common orders. Tab cycles own commanders (spec) and N
  cycles idle ones (CK3's "next army").
- Panel headers in the left dock carry the Vic3 trio of **go-to · pin · zoom-to** icons.
- Default the noisy sections (Recruitment, Research) to collapsed after the first game, as
  Vic3 did after its rework.
- Toggle the outliner with **O** (Stellaris). Q is free in the spec, but Q to P are the
  map-mode keys in EU4, so O avoids confusing EU4 players (see section 7 for keys).

---

## 6. Nested tooltips and the tooltip chain

### Patterns
- **Highlighted terms open further tooltips, with two lock modes.** CK3 introduced "tooltips
  in tooltips": blue highlighted text opens a tooltip, and terms inside it open more. There
  are two lock modes. Timer lock is the default, and its delay is set in the settings menu.
  Action lock pins the tooltip with a middle-mouse click. The diary says action lock lets
  experienced players make nested tooltips opt-in
  ([CK3 DD #16](https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/)).
  [DD] A secondary write-up describes the timer pinning after a second or two so you can move
  into the tooltip ([Driftwork Studio](https://www.driftworkstudio.com/blog/how-to-narrate-tooltips-in-games)).
  [comm] CK3 has a separate "Auto tooltip delay" setting, and patch 1.8.1 fixed tooltips
  ignoring the unlock setting and staying open too long
  ([Gamewatcher, 1.8.1 notes](https://www.gamewatcher.com/crusader-kings-3-update-1-8-1-patch-notes)).
  [press]
- **Praised by reviewers.** Reviewers describe almost every element having a tooltip that
  freezes in place after a brief hover, so you can follow it deeper. PCGamesN called CK3 the
  most accessible Paradox grand strategy game so far
  ([PCGamesN CK3 review](https://www.pcgamesn.com/crusader-kings-3/review-ck3);
  [Attack of the Fanboy review](https://attackofthefanboy.com/reviews/crusader-kings-iii-review/);
  [TheSixthAxis review](https://www.thesixthaxis.com/2020/08/31/crusader-kings-iii-review/)).
  [press]
- **Adopted across the studio.** Vic3 reused the CK3 system, including for big concepts such as
  pops, dividends taxes and market price
  ([PCGamesN](https://www.pcgamesn.com/victoria-3/nested-tooltip-system)). [press] Stellaris
  added "Concepts", nested tooltips in teal, in 3.8. They started on the galaxy settings screen
  only and spread over later patches
  ([Stellaris DD #292](https://forum.paradoxplaza.com/forum/threads/stellaris-dev-diary-292-3-7-4-released-and-concepts.1576269/);
  [devtrackers](https://devtrackers.gg/stellaris/p/52fbc4fe-concepts-nested-tooltips-barely-used-at-all)).
  [DD] EU5 says its tooltip design is based heavily on the CK3 nested system, with game
  concepts in blue ([Tinto Talks #77](https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053)).
  [DD]
- **Geometry matters.** Vic3 1.2 changed nested tooltip positioning so that moving the cursor
  into a nested tooltip no longer opens other tooltips on the way
  ([Vic3 DD #74](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-74-ux-improvements)).
  [DD] Players still report that after a middle-click lock, hovering a neighboring icon opens
  its own tooltip and closes the locked one. They ask that a locked tooltip block others for
  about a second ([Paradox forum](https://forum.paradoxplaza.com/forum/threads/locking-a-tooltip-should-prevent-other-tooltips-from-opening-for-a-brief-moment.1554097/)).
  [comm] Some players want tooltips on a key press instead of hover
  ([Steam: intrusive tooltips](https://steamcommunity.com/app/529340/discussions/0/5501743491363621432/)).
  [comm]
- **Tables, action hints, and "why not".** EU5 uses tables in tooltips for values with many
  sources. Action tooltips show what a left and right click will do, with mouse-button icons.
  When an action is unavailable, a condition block in the tooltip says why
  ([Tinto Talks #77](https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053)).
  [DD]
- **Critique: cap the depth.** A designer's analysis of CK3's nested tooltips for the web flags
  accessibility, cursor-precision frustration, and chain depth. It suggests two or three levels
  as a sensible cap ([Philip Ardeljan, "Tooltips in tooltips"](https://philip.design/blog/tooltips-in-tooltips/)).
  [comm]

### Applies to Fluid Magic
- Build one `<Tip>` system for all DOM panels and the Pixi map (the map tooltip is a DOM
  overlay positioned from Pixi coordinates).
  - **Concept terms** (Dominion, Supply, Unrest, Pip, Fatigue, Wellspring, Scales, Holy,
    Prophet, Materials, Morale, Formation, Script) show in one concept style: a color distinct
    from all five mana colors and the banners, *plus* a dotted underline so the cue survives
    color blindness.
  - **Timer lock** is the default (about 0.8 s, adjustable). A thin ring or border fills while
    the timer runs, so the player can see the lock coming. **Action lock**: middle-click, or
    `T` for trackpads, which have no middle button. Settings choice: Timer / Action.
  - While a tooltip is locked, suppress new root tooltips for 1 s (the Vic3 request), and
    place nested tooltips on the side away from neighboring triggers (Vic3 1.2).
  - **Depth cap of 3**. Esc closes the whole chain, and moving the cursor out collapses one
    level at a time.
  - Numeric tooltips are **tables** (EU5): `Source | Value` rows and a bold total, generated
    from the selector that computes the number, so the tooltip cannot disagree with the sim.
  - **Action tooltips** on map objects and buttons: `LMB select · RMB move here (6 days via
    Ashfen)`. Disabled buttons (Build, Recruit, Claim Wellspring, Make Prophet) show a
    condition block with ✓/✗ glyphs, for example `✗ Needs 120 gold (have 80)` and
    `✓ Commander present`. Both can come from `validate`, which already exists for every
    command. Show the validation failure reasons; do not hide the button.
- Concepts are **content** (`src/content/concepts.ts`): id, name, one-line summary for the
  tooltip, longer text for the Codex, related concept ids, icon. This matches CK3 and
  Stellaris, which define concepts in data that hooks into tooltips and the encyclopedia
  automatically (section 11). Add concepts to the content validation fixtures, as the project
  rules require for new content.
- Every concept tooltip ends with a footer, `Ctrl+click: open in Codex`.

---

## 7. Map modes and their hotkeys

### Patterns
- **A key row of user-bindable map modes.** EU4 groups map modes into political, diplomatic,
  economic and geographical, and up to ten can be bound to Q through P. You bind a slot by
  right-clicking it and choosing a mode. Buttons along the top of the minimap switch modes
  ([EU4 wiki, Ingame screen](https://eu4.paradoxwikis.com/Ingame_screen);
  [EU4 wiki, Map](https://eu4.paradoxwikis.com/Map);
  [EU4 wiki, Controls](https://eu4.paradoxwikis.com/Controls)). [wiki] Players set up personal
  layouts ([Steam](https://steamcommunity.com/app/236850/discussions/0/3211505894109783598/)).
  [comm]
- **A small primary set plus an overflow.** CK3's map-mode menu at the lower right has seven
  primary buttons, and a plus button opens four more title views
  ([gamepressure CK3 map modes](https://www.gamepressure.com/crusader-kings-3/map-modes/z3f0f7);
  [Gamewatcher CK3 map](https://www.gamewatcher.com/crusader-kings-3-map)). [comm] E opens the
  Realms mode ([Magic Game World](https://www.magicgameworld.com/crusader-kings-3-pc-keyboard-controls-guide/)).
  [comm]
- **Zoom-dependent detail.** In CK3's Realm mode, zooming in shows terrain and holdings, the
  middle zoom shows realms with vassal coats of arms, and the furthest zoom is a "paper map"
  of independent realms only. The developer says that making certain map modes available only
  at certain zoom levels is "an incredibly bad idea". In the Q&A they also say there is no
  option to turn off the paper map ([CK3 DD #25](https://forum.paradoxplaza.com/forum/threads/ckiii-dev-diary-25-map-features-and-map-modes.1388210/)).
  [DD]
- **F-key modes and an "all modes" picker.** HoI4: F1 default, F2 strategic navy, F3 air, F4
  supply, F5 terrain, and F6 to F9 for resistance, compliance, resource and infrastructure.
  Ctrl+F1 opens a window of all map modes
  ([DefKey HoI4](https://defkey.com/hearts-of-iron-4-shortcuts);
  [Magic Game World HoI4](https://www.magicgameworld.com/hearts-of-iron-iv-pc-keyboard-controls-and-shortcuts-guide/);
  [HoI4 wiki, Hotkeys](https://hoi4.paradoxwikis.com/index.php?section=5&title=Hotkeys)).
  [comm][wiki] Stellaris uses Ctrl+Z/X/C/V/B
  ([Stellaris wiki, Hotkeys](https://stellaris.paradoxwikis.com/Hotkeys)). [wiki]
- **A supply mode that shows flow.** HoI4's reworked supply map mode projects supply outward
  from each hub connected to the capital. Brighter color means more supply, supply drops off
  with distance, and unconnected hubs get a red cross
  ([HoI4 DD: Supply and Mulberry Harbors](https://forum.paradoxplaza.com/forum/developer-diary/hoi4-dev-diary-supply-and-mulberry-harbors.1481424/)).
  [DD]
- **Lenses: a map mode bundled with its actions.** Vic3's bottom bar holds lenses
  (production, political, diplomatic, military, trade). Each one switches the map and exposes
  that area's actions: building, decrees, diplomacy, military moves, trade routes. Alt+1 to
  Alt+4 select them, and DefKey lists Alt+5 for trade
  ([Vic3 wiki, Keyboard shortcuts](https://vic3.paradoxwikis.com/Keyboard_shortcuts);
  [DefKey Vic3](https://defkey.com/victoria-3-shortcuts);
  [Steam UI guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2879790246)).
  [wiki][comm] PC Gamer singled out the bottom bar's shortcuts as part of "one of Paradox's
  better user interfaces" ([PC Gamer Vic3 review](https://www.pcgamer.com/victoria-3-review/)).
  [press] Softpedia credits the "ton of map modes" with keeping information readable
  ([Softpedia](https://www.softpedia.com/reviews/games/pc/victoria-3-review-536304.shtml)).
  [press]

### Applies to Fluid Magic
- Keep the spec's six overlays (Ownership, Dominion, Supply, Unrest, Population, Mana
  springs). Show them as a **visible map-mode strip** at the bottom right, CK3-style: six
  icon buttons, each labeled with its key, the active one highlighted, and a small **legend
  chip** above the strip for the active mode (scale, colors, glyphs).
- **Contextual auto-modes** (Vic3 lenses). Selecting a ritual target switches to a "valid
  targets" view (valid provinces lit, invalid dimmed, range ring). Dragging a move order
  shows reachable provinces with ETA labels. Closing the action restores the previous mode.
  These are transient modes, not new buttons.
- **Supply mode** after HoI4: fill each province by `used / available` with a three-step
  scale (fed, tight, starving) and a glyph per step. Show the numbers when zoomed in. Highlight
  starving armies' markers.
- **No zoom-gated information** (CK3's own warning). Labels may thin out as you zoom out, but
  every mode must work at every zoom. With 40 to 80 provinces, the whole map fits at one zoom
  level anyway.
- **Key choice, a browser-specific risk.** The spec's F1 to F6 clash with browser bindings
  (F1 help, F5 reload, F6 address bar). Prefer **Shift+1 to Shift+6** as the primary binding
  (it parallels Vic3's Alt+number lenses without Alt+digit, which switches tabs in some
  browsers) and **M** to cycle modes. Keep F1 to F6 only as an extra that calls
  `preventDefault` when the game canvas has focus. This is a design inference, not a
  Paradox pattern; verify it in the browsers you target.

---

## 8. Province or state window

### Patterns
- **Left-click opens it, right-click goes to the owner.** EU4's province interface opens on
  left-click. Right-click opens the owner's diplomacy tab. The top panel has the development
  buttons (base tax, production, manpower) with total development and the cost of the next
  point. The left panel lists devastation, loot, tax and production income, and local
  unrest. A tab opens buildings and estates, and a progress bar shows coring, conversion or
  construction under way. The terrain picture appears only at larger resolutions
  ([EU4 wiki, Province interface](https://eu4.paradoxwikis.com/Province_interface)). [wiki]
- **Preview the cost of an action on its button.** In Vic3, clicking a state opens a panel
  whose buildings tab is split into urban, rural and development. A round plus on each building
  queues another level, and hovering the plus shows the projected budget impact
  ([PCGamesN Vic3 construction](https://www.pcgamesn.com/victoria-3/construction-buildings)).
  [press] Pop portraits appear on the state panel
  ([Vic3 wiki, Patch 1.8](https://vic3.paradoxwikis.com/Patch_1.8)). [wiki]
- **Critique: missing list views.** One Vic3 review calls the menus "absolutely labyrinthine".
  It notes that you cannot view all pops of one type and that there is no sorting
  ([Let's Talk About War Games](https://letstalkaboutwargames.wordpress.com/2022/10/24/victoria-3-review/)).
  [press]

### Applies to Fluid Magic
- Province panel (left dock). The header holds name, terrain icon, the owner's banner and
  mana symbol, dominion candles, and the go-to/pin/zoom-to icons. Below it, one **hero
  number**, population, with growth per month. Then an **income strip** of chips (gold,
  materials, supply used/available, unrest, springs), each with its L1 breakdown table.
- Tabs keep it short: **Overview** (numbers, tax selector, PD with buy button, buildings),
  **Recruit** (fort only: unit cards, queue), **Forces** (garrison and commanders present).
  Wellspring status appears as a banner on Overview when relevant, not as its own tab.
- Every Build or Buy button hover shows the projected effect (Vic3's budget impact): for
  example "Temple: −150 gold now, priests here gain preaching, +x dominion per month". Use the
  same selectors with a hypothetical state, or a dedicated `preview*` selector, so the
  preview is exact.
- Right-click a foreign or independent province with nothing selected to open the owner's
  nation card (EU4's right-click-to-owner). With a commander selected, right-click keeps its
  spec meaning, "move here".
- Answer the Vic3 list complaint with a **Ledger (L, EU4)**: sortable tables of provinces
  (pop, income, unrest, supply, dominion, owner) and commanders (location, order, troops,
  starving). The ledger costs little to build and is where power players will live. EU4's
  Ledger opens with L and compares country data in sortable charts
  ([EU4 wiki, Ledger](https://eu4.paradoxwikis.com/Ledger)). [wiki]

---

## 9. Army windows and unit lists

### Patterns
- **The army panel sits at the bottom center, with portrait slots.** In HoI4 the bottom-center
  panel is where you command troops: select divisions, press the green plus to form an army,
  and click the empty portrait to pick a commander
  ([StratemGames HoI4 interface](https://stratemgames.space/en/hearts-of-iron-iv/game-interface)).
  [comm] Each division card shows organization (green bar) and equipment (orange bar), plus an
  experience icon and a blue planning-bonus bar
  ([Steam beginner's guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3373438078);
  [Steam RTS guide](https://steamcommunity.com/sharedfiles/filedetails?id=700703772)). [comm]
- **Hotkeys for reorganizing.** EU4: S splits an army in half, G merges, K consolidates
  regiments. A regiment is 1,000 soldiers at full strength, and drill is started from a button
  at the bottom of the army interface
  ([EU4 wiki, Controls](https://eu4.paradoxwikis.com/Controls);
  [EU4 wiki, Army](https://eu4.paradoxwikis.com/Army)). [wiki]
- **Status shown on the map badge.** CK3 armies taking attrition show a skull on their banner.
  Armies are built from knights, men-at-arms regiments and levies, and can be split with
  "Split Off New Army" ([CK3 wiki, Army/Attrition](https://ck3.paradoxwikis.com/Attrition);
  [Steam combat guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2222736076);
  [Gamewatcher CK3 troops](https://www.gamewatcher.com/crusader-kings-3-troops-armies)).
  [wiki][comm]

### Applies to Fluid Magic
- The spec's bottom bar becomes the HoI4-style **army strip**. For one commander: portrait
  (pip symbols overlaid on the frame), name, HP and morale, then a row of **squad cards**,
  each with a sprite thumbnail, a count, two bars (HP%, and morale on a separate hue *and*
  pattern), and a formation icon. Then the **script** as five compact slots, and the order
  and ETA at the right edge.
- For a multi-selection: one card per commander, with summed troops and the slowest ETA,
  which matches the rule that a group move takes the slowest speed.
- Map badges (shield plus troop count, spec) gain CK3-style **status glyphs**: starving
  (crossed wheat), unpaid (crossed coin), besieging (ram), casting (spell ring in the color).
  The art doc's icon list already has most of these.
- Hotkeys, borrowing from EU4 where they do not collide: none in M1 for split or merge,
  because squads move by drag between commanders (spec). Revisit if players ask. The
  bottom-strip pattern is the important part.

---

## 10. Battle windows: a frame for the replay

Paradox battles resolve on the map. The battle window is a live readout, not a replay. Its
layout is still the closest precedent for framing Fluid Magic's replay with the same chrome.

### Patterns
- **Two sides facing each other, phases, dice, morale.** EU4 combat alternates 3-day Fire and
  Shock phases. Each side rolls a die per phase, modified by leader, terrain and unit pips.
  Front and back rows are limited by combat width, extra regiments wait in reserve, and an
  army tries to retreat when its morale hits zero
  ([EU4 wiki, Land warfare](https://eu4.paradoxwikis.com/Battle);
  [Gamewatcher EU4 combat](https://www.gamewatcher.com/eu4-army-compositions-how-does-combat-really-work-in-europa-universalis-iv)).
  [wiki][comm]
- **Named phases and an "advantage" breakdown.** CK3 battles run Maneuver, Early Battle, Late
  Battle and Retreat. Maneuver inflicts no casualties. Advantage comes from traits, terrain,
  buildings and the commander's martial skill, and the commander rolls every 3 days to raise
  it ([TheGamer CK3 battles](https://www.thegamer.com/crusader-kings-3-how-does-the-combat-battle-system-work/);
  [CK3 wiki, Warfare](https://ck3.paradoxwikis.com/index.php?mobileaction=toggle_view_desktop&title=Warfare)).
  [press][wiki] Extracted battle-window text shows tooltip fields per side for Advantage,
  Martial skill and Battle Roll, with a line like "Your damage is increased by X%"
  ([Nexus mod docs](https://www.nexusmods.com/crusaderkings3/mods/229?tab=docs)). [comm]
  Casualties are split into routed and fatal (TheGamer, above).
- **The chosen tactic next to each general.** On HoI4's battle screen, the tactic selected by
  each side sits next to its commanding general, separated by a chess-piece icon that lists
  all tactics when clicked. Initiative shows as golden chevrons under the general
  ([HoI4 wiki, Combat tactics](https://hoi4.paradoxwikis.com/index.php?mobileaction=toggle_view_mobile&title=Combat_tactics)).
  [wiki] Divisions beyond the combat width wait in reserve and join the frontline when width
  allows ([HoI4 wiki, Land battle](https://hoi4.paradoxwikis.com/Reinforce_rate)). [wiki]

### Applies to Fluid Magic (frame only; visceral presentation is a separate design)
- Use the **same panel chrome** as the docks (header color from nation secondary, borders from
  primary, per the art doc) so the replay modal reads as part of the game, not a different
  app.
- **Header bar:** battle name ("Battle of Ashfen"), province terrain and fort modifier chips
  (each with a CK3-style advantage tooltip from the resolver's modifiers), the round counter
  and phase label from the replay log, and transport controls identical to the main speed
  cluster (pause, 0.5x to 4x, skip to end). Space pauses the replay while the modal is open.
- **Side columns:** each commander's portrait with the **current script step shown beside it**,
  like HoI4's tactic: `Round 3: Cast Ember Bolt`. Hovering shows all five script slots with
  the current one lit. Live squad counts, morale bars, and casualties split into **killed**
  and **routed** (CK3), plus a fatigue bar for mages.
- **After-action card** at the end of the replay: result, casualties per side, commanders
  killed or captured, provinces affected. Give it "Replay again" and "Go to province" buttons.
  The battle message in the feed reopens this card first, and one more click replays.

---

## 11. Encyclopedia and concept layer

### Patterns
- **CK3 Encyclopedia.** A central, searchable place with search history. It covers game
  concepts, tutorial recaps, and terrain and trait effects. Pages are generated from the game's
  script files, and new concepts added by mods hook into tooltips and the encyclopedia
  automatically ([CK3 DD #16](https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/)).
  [DD] A fan database counts 1,142 entries in patch 1.20.1.1, each explaining a term the game
  links in tooltips ([ck3db](https://ck3db.com/concepts)). [comm] The encyclopedia button sits
  in the bottom-right bar beside the speed controls
  ([gamepressure](https://www.gamepressure.com/crusader-kings-3/interface-description/z2f0f6)).
  [comm]
- **Vic3 and Stellaris define concepts as data.** Vic3 concepts live in `common/game_concepts`
  and must each be localized ([Vic3 wiki, Localization](https://vic3.paradoxwikis.com/index.php?mobileaction=toggle_view_desktop&title=Localization&veaction=edit)).
  [wiki] A community guide calls the in-game "Vickypedia" an encyclopedia of terms and concepts
  ([Steam ULTIMATE guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2879696547)).
  [comm] Stellaris concepts are defined the same way, in `common/game_concepts`
  ([Stellaris DD #292](https://forum.paradoxplaza.com/forum/threads/stellaris-dev-diary-292-3-7-4-released-and-concepts.1576269/)).
  [DD]

### Applies to Fluid Magic
- A **Codex** modal, opened with `?` or `F` (find) and from the concept tooltip footer. It has a
  search box with recent searches (CK3), and its pages are **generated from the content
  registry**: every unit (stats, costs, sprite), every spell (cost in mana symbols, research
  color and level, primitives in plain words), every chassis, terrain table, buildings,
  scales, plus the hand-written concepts from `src/content/concepts.ts`. Because the pages
  are generated, the Codex cannot drift from balance changes, which is CK3's reason for
  generating from script.
- Link from the Codex back into play. Spell pages show "Castable by: …" with the player's
  matching commanders, and unit pages show "Recruitable at: …" with forts (see the
  "tooltips that can't act" critique in section 13).

---

## 12. Tutorial and the "game concepts" layer

### Patterns
- **Guided start, then reactive advice.** After CK3's guided tutorial, Reactive Advice begins:
  a purple info icon during normal play offers mini-tutorials based on your current state. It
  highlights the relevant interface elements, suggests possible actions, and can be reset in
  settings ([CK3 DD #16](https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/)).
  [DD] Later, some advice was delayed, and one prompt moved into Current Situation so it can
  come back ([CK3 DD #164](https://forum.paradoxplaza.com/forum/threads/dev-diary-164-realm-maintenance.1730576/)).
  [DD] The tutorial menu is available at any time
  ([PC Gamer CK3 review](https://pcgamer.com/crusader-kings-3-review)). [press]
- **Measured with telemetry, and progressive disclosure.** Paradox UX designers Valeska Martins
  and Ellinor Zetterman describe refreshing the CK3 tutorial. Telemetry showed the tutorial
  affects retention. They used progressive disclosure, including showing only parts of the
  interface when a player first starts, and playtesting to make it more concise
  ([Game Developer deep dive](https://www.gamedeveloper.com/design/deep-dive-refreshing-the-crusader-kings-iii-tutorial-mode-through-optimized-ux)).
  [press]
- **Tutorial as an objective, not a mode.** In Vic3 the tutorial is a player objective, "Learn
  the Game", and the game otherwise plays as normal. An optional intro popup covers basic UI
  controls and how to unpause. Reactive Journal Entries tailored to your country then set
  tasks, starting with "expand a farm" and moving to longer goals like raising GDP. Each entry
  can have up to two player-triggered popups, **"Tell me How"** and **"Tell me Why"**, which
  step through text and highlight UI elements. The lessons are available in every objective
  and in sandbox ([Vic3 DD #51](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-51-tutorials)).
  [DD]
- **Critique: density.** Xbox players reported being overwhelmed by the CK3 tutorial
  ([Pure Xbox](https://purexbox.com/news/2022/04/xbox-players-are-getting-stuck-at-the-tutorial-in-crusader-kings-3)).
  [press] A beginner reviewer says the scale is clear "from the first box you get in the
  tutorial", though they still praise it
  ([GamingOnLinux](https://www.gamingonlinux.com/2020/10/crusader-kings-iii-is-quite-a-joy-to-learn-even-if-youre-not-particularly-smart/)).
  [press] TheGamer warns that the Vic3 tutorial covers only central concepts, so you spend a lot
  of time reading tooltips ([TheGamer Vic3 review](https://www.thegamer.com/victoria-3-review/)).
  [press]

### Applies to Fluid Magic
- **No separate tutorial mode.** The first game offers a "Learn" objective that appears as a
  pinned section at the top of the outliner (Vic3 journal). It has 6 to 8 steps, each
  checked from state by a selector: recruit a squad at the capital, move a commander, set a
  research color, preach with a priest, cast a ritual, besiege an independent fort, claim a
  Wellspring. Each step has **How** (highlights the UI element and the map target) and
  **Why** (opens the concept and the rule in one or two sentences).
- **Reactive advice** uses the blue "i" alert tier and fires on first occurrences: first
  starvation, first unrest above 50, first enemy dominion in your land, first battle loss,
  first fort at its materials cap. Every hint can be dismissed. Hints are reset in settings
  (CK3), and they never pause the game.
- **Progressive disclosure, without hiding rules.** In the first game, keep panels and
  buttons that do not apply yet visually quiet. Collapse the Ritual and Prophet sections until
  the player has a caster or an awake pretender. Never hide a button the player might look
  for: show it disabled with its condition block (section 6).
- Keep the pre-game Pretender Design screen's help in the same system: every scale and
  dominion value uses concept tooltips, and presets act as the "easy start".

---

## 13. Information overload: how they handle it, and how critics rated it

### What got praised
- CK3's tooltips: they freeze in place and chain, and reviewers called CK3 the most accessible
  Paradox grand strategy game (section 6, [PCGamesN](https://www.pcgamesn.com/crusader-kings-3/review-ck3)).
  [press] Players on Steam call the tooltip system one of its strongest features, while noting
  that dense historical concepts remain
  ([Steam](https://steamcommunity.com/app/1158310/discussions/0/4361246746314300652)). [comm]
- Vic3 at launch: PC Gamer said the intricate mechanics are made manageable by "one of
  Paradox's better user interfaces" and praised the bottom-bar shortcuts
  ([PC Gamer](https://www.pcgamer.com/victoria-3-review/)). Destructoid describes nested
  tooltips that expand any keyword or calculation into a short breakdown on hover
  ([Destructoid](https://www.destructoid.com/reviews/review-victoria-3-pc-paradox-interactive-strategy/)).
  [press]

### What got criticized (mostly Vic3)
- **Fragmentation.** The information you need is spread across many screens and tabs and
  sometimes buried deep in nested tooltips. Tooltips explain what something is without letting
  you act on it. A player could not find which buildings consumed lead during a shortage
  ([Streams of Consciousness](https://streamsofconsciousness.blog/2025/02/24/victoria-3-has-the-worst-ui-ive-ever-seen/)).
  [comm]
- **Menu hopping.** The game sometimes feels like a "spreadsheet simulator" with constant
  menu checking, and players get lost across multiple menus
  ([But Why Tho](https://butwhytho.net/2022/11/victoria-3-review-paradox-interactive/)).
  [press] The menus are "absolutely labyrinthine", with no sorting
  ([Let's Talk About War Games](https://letstalkaboutwargames.wordpress.com/2022/10/24/victoria-3-review/)).
  [press] Players complain of "way too many unnecessary clickthroughs and windows" and jump
  lists and popups that cause accidental clicks
  ([Steam: why is the UI so overwhelming](https://steamcommunity.com/app/529340/discussions/0/3734079155595045083/)).
  [comm] A user review asks for a clear graph or table instead of several layers of nested
  tooltips ([GameFAQs](https://gamefaqs.gamespot.com/pc/453419-victoria-3-sphere-of-influence/reviews/175104)).
  [comm]

### How Paradox responded (patterns worth copying)
- Sortable, groupable, filterable lists (Vic3 1.2 trade routes), richer pop lists, and the
  message settings matrix ([Vic3 DD #74](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-74-ux-improvements)).
  [DD]
- Outliner groups with noisy groups collapsed by default, and a common header-action standard
  ([Vic3 DD #117](https://forum.paradoxplaza.com/forum/developer-diary/victoria-3-dev-diary-117-the-ux-of-sphere-of-influence.1677959/)).
  [DD]
- Feed entries grouped by urgency, pinning into a Priority group, and clutter moved to its own
  tab ([Stellaris DD #417](https://forum.paradoxplaza.com/forum/developer-diary/stellaris-dev-diary-417-situation-log-updated.1918530/)).
  [DD]
- Contextual hiding: EU4 outliner sections appear only when relevant (section 5). CK3 alerts
  cover only actionable states (section 3). Stellaris rolled out Concepts on one screen first
  (section 6).
- Calm visuals so the map does not compete with panels. Vic3's art direction aimed for UI that
  is "elegant and ornate but not too heavy", with a calm map
  ([Vic3 DD #49](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-49-graphic-overview)).
  [DD] Vic3 separates action buttons from navigation buttons with two emerald shades, and
  action buttons get a thin gold border
  ([Vic3 DD #30](https://forum.paradoxplaza.com/forum/threads/victoria-3-dev-diary-30-user-interface-overview.1507166/)).
  [DD]

### Rules for Fluid Magic that follow from this
1. **Decision data lives on the panel, not only in tooltips.** Tooltips explain *why* a number
   is what it is. The number itself, and anything needed to choose (cost, ETA, supply after the
   move), is printed on the panel or the action button.
2. **Every tooltip that names a thing links to it.** Province names, commander names and forts
   inside tooltips act as links (click to go there, shown in the action-hint footer). This
   fixes the Vic3 "explains but can't act" complaint.
3. **At most three clicks from the map to any action.** Map → province panel → Recruit tab →
   unit card is the deepest path. Rituals: commander → Cast (C) → target on the map.
4. **One sortable Ledger** answers "show me all X" (provinces, commanders, forts, springs).
5. **Alerts only for actionable conditions**, grouped by count, with conditional dismissal.
6. **Two button styles**, following Vic3: *action* buttons (they issue a command through
   `validate` → `apply`) carry a gold keyline, and *navigation* buttons (they open a panel) do
   not. Players then know which clicks change the game.
7. **Small map, small UI.** With 40 to 80 provinces and a 45-to-75-minute session, Fluid Magic
   needs a fraction of Vic3's surface. Each layer should stay lean, not grow screens.

---

## 14. Consolidated keyboard map (Paradox precedent noted)

| Key | Action | Precedent |
|---|---|---|
| Space | pause / resume (also inside battle replay) | EU4, CK3, Stellaris, Vic3 |
| 1 to 4 | set speed | CK3, Vic3 (1 to 5) |
| + / − and Z / X | step speed | EU4 (+/−), CK3 (Z/X) |
| Shift+1 to Shift+6 (F1 to F6 optional) | map modes | EU4 Q to P row, HoI4 F-keys, Vic3 Alt+number lenses |
| M | cycle map modes | design choice for the browser |
| O | toggle outliner | Stellaris O, CK3 Q |
| Alt+Q or P | pin current selection to outliner | CK3 Alt+Q |
| Tab / N | next own commander / next idle commander | spec Tab, CK3 N |
| Double-click outliner row | select and center | Stellaris |
| R | Research | spec (EU4 tab number keys) |
| C | Cast ritual | spec |
| L | Ledger | EU4 L |
| ? or F | Codex (search) | CK3 Encyclopedia, EU4 F find province |
| T or middle-click | lock tooltip | CK3 action lock |
| Esc | close the top tooltip chain, then the modal, then the selection | EU4 and CK3 menu |
| Backspace | center on capital | EU4 Backspace |
| Ctrl+S | save | spec |

WASD pans (spec, also Vic3). The spec gives W, A, S, D to panning, which rules out EU4's Q to P
map-mode row.

---

## 15. Spec deltas to propose for `docs/07-ui.md` (summary)

1. Add the layering table (section 0) as the organizing rule.
2. TopBar: stock + monthly delta for every value, a selector-driven breakdown table on hover,
   click to open the relevant panel, yellow "full / wasted" for fort materials at cap.
3. Speed cluster at the top right with a month-progress bar, a three-channel paused state,
   and an auto-pause reason chip.
4. Alerts ribbon with six tiers (color plus shape), count badges, conditional dismiss and mute.
5. Message Settings matrix `Off/Log/Toast/Popup + Pause` per type, with a gear on every message.
6. Right dock = outliner (pinned, commanders, on the move, sieges, rituals, recruitment,
   research, Wellsprings) above a message feed.
7. Nested concept tooltips (timer and action lock, depth 3, table breakdowns, action hints,
   condition blocks from `validate`), with concepts as content.
8. A visible map-mode strip with legend and key labels, contextual target and move modes, and
   browser-safe keys.
9. Province panel tabs (Overview / Recruit / Forces) with effect previews on buttons, plus a
   sortable Ledger.
10. Bottom army strip with squad cards (two bars), script slots, and status glyphs on map
    badges.
11. Battle replay frame in the same chrome: header (phase, modifiers, transport), side columns
    (current script step beside the portrait, killed/routed), after-action card.
12. Codex generated from the content registry, opened from concept tooltips.
13. "Learn" objective in the outliner with How/Why, plus reactive hints in the blue alert tier.
