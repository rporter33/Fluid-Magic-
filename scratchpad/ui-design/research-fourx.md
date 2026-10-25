# UI research: modern 4X and fantasy strategy games, applied to Fluid Magic

Cluster: Old World, Civilization VI and VII, Age of Wonders 4, Endless Legend and Humankind
(and Endless Legend 2), Total War: Warhammer III campaign layer, Stellaris.

Owner direction this serves: "Make sure the UI matches those of similar games; where
complexity is tastefully layered under smart menu design." Also: the battle replay needs a
frame consistent with the rest of the UI.

## How this was researched, and limits

- WebFetch and direct HTTPS (curl) were blocked for every host tried in this session
  (Wikipedia, Steam, Paradox, Fandom, Mohawk, PC Gamer, archive.org). Every citation below
  is a URL that WebSearch returned, and the claim attached to it comes from the search
  engine's extract of that page. I could not open the pages to check the wording.
- Where a search extract put several URLs behind one claim without saying which said what,
  I cite them as a group.
- The session's web search budget (shared with other agents) ran out before I reached Total
  War: Warhammer III and Stellaris. Section 12 describes their patterns from general
  knowledge, marked **[unverified]**. Do not cite those in the spec without checking them.
- Dates: Civ VII patch notes up to 1.5.0 (September 2026) and Old World Update #143
  (February 2026) were the newest items found.

---

## 0. Summary: the layering model these games share

Each of these games shows only a little at first and reveals more as the player asks for
it. The layers are about the same from game to game:

| Layer | What it is | Old World | Age of Wonders 4 | Civ VI / VII | Fluid Magic today (docs/07) |
|---|---|---|---|---|---|
| L0 Glance | Always on screen: top bar numbers with rates, map badges, alert icons | Resource counters with a second number for the rate | Affinity readout at top right | Top bar yields; notification stack | Top bar, map labels, messages |
| L1 Hover | Tooltip with a value and its breakdown | Tooltip on every number and noun | Tooltips on everything, including event options | Tooltips (VII criticized as thin) | "Tooltips everywhere", one line per stat |
| L2 Pinned / nested | Tooltip frozen so its links can be hovered; tooltip inside a tooltip | Hold Shift to freeze, then hover or click links | Tooltips inside tooltips | Not a core pattern | **Missing** |
| L3 Panel | Context panel for the selected thing | Left-side action bar for the selected unit or character | Army panel, unit panel | City panel, unit panel | Left dock (province or commander) |
| L4 Screen | Full screen or modal for a system | Tech cards, laws, family screens | Tome research, spell book | Tech and civics trees, city details | Research modal, ritual modal |
| L5 Encyclopedia | Reference entry, reachable from any tooltip | F1 on a tooltip opens its linked encyclopedia page | F1 encyclopedia | Civilopedia (VII lost right-click to Civilopedia, per players) | **Missing** |

Fluid Magic's spec already covers L0, L1, L3 and L4. It lacks L2 (pinned, nested tooltips)
and L5 (an encyclopedia reachable from any tooltip). Those two layers let Old World and
AoW4 keep their main screens light while every rule stays one or two gestures away. Adding
them is the cheapest way to meet the owner's "complexity layered under smart menus." The
sim already has selectors for every rate, so L1 breakdowns cost very little.

---

## 1. Tooltips as the main teaching layer

### Old World

- **Shift freezes a tooltip so its links can be used.** The official manual says tooltips
  contain links to the parts of the help that explain a concept, and that to hover or click
  those links you "freeze" the tooltip by holding Shift
  ([manual v1.23](https://cdn.steamstatic.com/steam/apps/597180/manuals/Old_World-Official_User_Manual.pdf),
  [manual v1.69](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/597180/manuals/c437bb97d8031b57dfe385c9c9462c1e7815e5d5/Old_World-Official_User_Manual.pdf?t=1765491938)).
  A player adds that Shift-clicking a tooltip locks it in place
  ([Steam discussion](https://steamcommunity.com/app/597180/discussions/0/601892242036097444/)).
- **F1 on a tooltip opens its encyclopedia page.** Update #73 "Added F1 hotkey info to
  tooltips that will open a linked encyclopedia page when active"
  ([Update #73](https://mohawkgames.com/2021/10/06/old-world-update-73/)). Mohawk kept
  extending this: law tooltips gained F1 links in April 2025
  ([Update #134](https://mohawkgames.com/2025/04/30/old-world-update-134/)).
- **Names in tooltips are live links to game objects.** "Clicking on Character names
  featured in tooltips will now select that character"
  ([Update #16](https://mohawkgames.com/2020/09/02/old-world-update-16/)). The same update
  added a tooltip on a general's star icon.
- **Tooltips are filtered by context.** Character tooltips "now show trait effects that are
  relevant to the current position (leader, general, governor)"
  ([Update #132](https://forums.civfanatics.com/threads/old-world-update-132.695851/)).
- **Long tooltips scroll and are sorted.** Unit tooltips became "scrollable, with unit
  effects ordered alphabetically," and any non-leader character became pinnable
  ([Update #129](https://mohawkgames.com/2024/10/24/old-world-update-129/)). Scrollbars were
  added to popups and tooltips where needed
  ([Update #121](https://mohawkgames.com/2024/04/04/old-world-update-121/)).
- **Tooltips can be switched off.** A hotkey to suppress tooltips (Ctrl+X) came in 2026
  ([Update #143](https://mohawkgames.com/2026/02/18/old-world-update-143/)). It answers a
  long-standing complaint: LadiesGamers found the tooltips helpful early but annoying later,
  with no setting to turn them off
  ([LadiesGamers review](https://ladiesgamers.com/old-world-review/)).

**Reception, which explains why the pattern needs hierarchy.**
- For: Turn Based Lovers calls the nested tooltips "generally very helpful"
  ([review](https://turnbasedlovers.com/review/old-world-review/)). A Steam user says Old
  World uses screen space much better than Civ VI and that layered tooltips make it hard to
  lose information you need
  ([Steam thread](https://steamcommunity.com/app/289070/discussions/0/3046105389666045947/)).
  A forum user says the "fantastic tooltips" made the game "a breeze to learn," and calls
  the separate help system a "rehash of the tooltip info"
  ([Quarter to Three](https://forum.quartertothree.com/t/old-world-pka-ten-crowns-from-soren-johnson/134746/1543)).
- Against: Ancient World Magazine says much of the detail sits in tooltips at about the
  same visual size, so nothing signals what matters more
  ([review](https://www.ancientworldmagazine.com/reviews/old-world-2021/)). CogConnected
  calls the UI dense, cluttered and full of jargon
  ([review](https://cogconnected.com/review/old-world-review/)), and an OpenCritic summary
  quotes a reviewer calling it "fussy"
  ([OpenCritic](https://opencritic.com/game/11628/-)).

### Age of Wonders 4

- PC Gamer credits "helpful nested tooltips, a codex and a hint system"
  ([PC Gamer](https://www.pcgamer.com/age-of-wonders-4-review/)). TechRaptor says tooltips
  carry hyperlinks to concepts and related topics
  ([TechRaptor](https://techraptor.net/gaming/reviews/age-of-wonders-4-review)). A Steam
  player confirms "tooltips inside tooltips" and F1 for the encyclopedia
  ([Steam thread](https://steamcommunity.com/app/1669000/discussions/0/3828666283435815182/)).
- **An event choice shows its effects before you pick it.** Dev Diary #6 says event
  options give "a full tooltip breakdown of gameplay effects," and that tooltips also cover
  entities, concepts and lore
  ([Dev Diary #6](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-6)).
- **Failure modes.** MMORPG found that a tooltip with a lot of text gets in the way of
  clicking, "especially when researching spells"
  ([MMORPG review](https://www.mmorpg.com/reviews/age-of-wonders-4-review-2000127821)).
  Windows Central found it unclear what was selected when several objects and tooltips
  shared a hex
  ([Windows Central](https://www.windowscentral.com/gaming/age-of-wonders-4-review)).

### Reference outside the cluster: CK3 and EU5

Paradox's EU5 diary says its tooltip design is "based heavily around the nested tooltip
systems that we first used in Crusader Kings III": game concepts are highlighted (blue)
and can themselves be hovered. The search extract describes CK3 tooltips locking either on
a timer or by middle-click
([Tinto Talks #77](https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053)).

### Civilization VII as the counterexample

Players at launch said tooltips were missing or thin ("No tooltips, information is
lacking everywhere"), and that the plot tooltip covered the cursor so you could not click
the tile to move or attack
([Steam discussion 1](https://steamcommunity.com/app/1295660/discussions/2/570371033831324629),
[Steam discussion 2](https://steamcommunity.com/app/1295660/discussions/2/570371162116298772)).
Wikipedia's summary of reviews says the UI was "highly criticized," with "very little
information... readily explained to the player"
([Wikipedia](https://en.wikipedia.org/wiki/Civilization_VII)). Firaxis replied: "Our top
priority is improving the UI"
([CGMagazine](https://www.cgmagonline.com/news/civilization-vii-quality-of-life-updates)).

### Applying this to Fluid Magic

1. **Add pinned, nested tooltips (L2).** Tooltips lock when Shift is held (Old World) or
   after the pointer rests on the tooltip for about 0.8 s (CK3's timer lock). A locked
   tooltip shows a thin border and a close cross. Underlined terms inside it open child
   tooltips, three levels at most. Esc closes the whole chain.
2. **Links must not look like mana.** CK3 and EU5 mark concepts in blue, but blue is Tide
   (U) in Fluid Magic. Mark link terms with a dotted underline in the normal chrome text
   color and never tint them a mana color. Mana words ("Ember", "R") always come with their
   symbol.
3. **One tooltip template, built from selectors.**
   Title row, then the current value, then the one-line explanation docs/07 already
   requires, then a breakdown of signed lines (`+42 taxes`, `-18 upkeep`), then a footer
   hint ("Shift pin · Ctrl+click Codex"). Each breakdown line comes from the existing
   selector (`provinceEconomy`, `nationEconomy`, `fortMaterials`, ...), so the tooltip and
   the sim cannot disagree.
4. **Hierarchy inside the tooltip** answers the Ancient World Magazine critique. The value
   is large, the explanation regular, the breakdown small and tabular, with the sign shown
   as well as the color (green/red alone fails for color-blind players, consistent with
   docs/09-art-direction). Sort lines by absolute size so the biggest contributor comes
   first (Old World sorts alphabetically, which buries what matters).
5. **Never cover the target.** Place map tooltips on the side of the cursor away from the
   hovered province, or dock them to a fixed corner, so a right-click move never lands on
   a tooltip (the Civ VII complaint). With a commander selected, a hovered destination
   province shows a compact tooltip (Section 7) instead of the full province tooltip.
6. **Filter by context.** A commander tooltip in the script editor shows pips, fatigue and
   carried mana. On the map it shows HP, morale, order and ETA (Old World Update #132).
7. **Settings and a hotkey.** Tooltip delay (0 / 0.3 / 0.8 s), a "compact tooltips" mode
   that hides breakdowns until Shift, and a suppress hotkey (Old World's Ctrl+X). Humankind
   players asked for both the delay and the hiding of tooltip types
   ([Humankind ideas thread](https://community.amplitude-studios.com/amplitude-studios/humankind/forums/169-game-design-and-ideas/threads/54966-ideas-list-clearer-user-interface?page=1)).
8. **Long tooltips scroll** inside a capped height of about 60% of the viewport, as in Old
   World #121 and #129, instead of running off the screen.

---

## 2. The encyclopedia (L5)

### Patterns

- **Old World:** one F1 press goes from any tooltip to the matching encyclopedia page
  ([Update #73](https://mohawkgames.com/2021/10/06/old-world-update-73/)). The encyclopedia
  gained a Tutorial section
  ([Update #60](https://mohawkgames.com/?p=3001)). Encyclopedia pages link to each other
  and to characters (fixes in
  [Update #108](https://mohawkgames.com/2023/05/10/old-world-update-108/),
  [Update #117](https://mohawkgames.com/2023/12/13/old-world-update-117/),
  [Update #120](https://mohawkgames.com/2024/03/06/old-world-update-120/)).
- **Civilization VI Civilopedia:** opened from a "?" icon. Its main topics run down the
  left side of the screen; you pick a topic, then an entry
  ([Civ VI manual, Switch](https://cdn.2kgames.com/manuals/civilization-vi/switch/na/CIV_VI_NSW_ONLINE_MANUAL_US.pdf)).
  Rules concepts such as lenses get their own entries
  ([Civilopedia: Lenses](https://www.civilopedia.net/en-US/standard-rules/concepts/world_7/)).
  A popular community mod puts the cursor in the search box when the Civilopedia opens, so
  you press the hotkey and type
  ([mod changelog](https://steamcommunity.com/sharedfiles/filedetails/changelog/1341630847?p=1)).
- **Civilization VII:** players complained that right-clicking a unit, building or
  technology no longer opens its Civilopedia entry. I only have this from a search
  extract, not from a specific thread I could check. Treat it as anecdotal.
- **Age of Wonders 4:** F1 opens the encyclopedia, and a button at the top right of the
  main screen also reaches it
  ([Steam thread](https://steamcommunity.com/app/1669000/discussions/0/3828666171743764627/)).
  Tags added to units appear "in the unit panel and encyclopedia" at once
  ([Wyvern patch notes](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-wyvern-update-patch-notes)),
  so the panel and the reference share one data source.

### Applying this to Fluid Magic: the Codex

- **The Codex is a modal** with a topic list on the left (Concepts, Colors, Spells, Units,
  Commanders, Chassis, Buildings, Terrain, Scales, Rituals), a search box focused when it
  opens, and the entry on the right. Every entry is **generated from the content
  registry**, so it never drifts from the data (the CLAUDE.md rule that content is data).
  Hand-written text is limited to concept entries such as Dominion, Supply, Fatigue,
  Morale, DRN and Wellsprings.
- **Ways in:** Ctrl+click any linked term or card, the "Open in Codex" link in a pinned
  tooltip's footer, the Codex hotkey, and right-click on a unit card or spell card. Keep
  right-click-to-reference; Civ VII players missed it when it was dropped. On the map,
  right-click stays "move here" (docs/07), so right-click opens the Codex only on cards in
  DOM panels.
- **Hotkey conflict to settle in the spec:** Old World and AoW4 put the encyclopedia on F1,
  but docs/07 uses F1 to F6 for map overlays. Browsers also bind several F-keys by default
  (F1 help, F3 find, F5 reload, F6 address bar), so test whether the page can capture them
  in each target browser. Proposal in Section 14, item 14.
- **Entries cross-link** in both directions: the Fireball entry lists the units and
  commanders that can cast it (pips ≥ RR) and the research level that unlocks it. The Cinder
  Mage entry lists its castable spells. This follows Old World's linked pages.
- **Tutorial pages live inside the Codex** (Old World Update #60), and first-time hints
  link into them.

---

## 3. Resource and mana readouts (top bar)

### Patterns

- **Old World:** the resource counters run across the middle of the top bar, and many show
  a second number for income per turn
  ([BigBossBattle review](https://bigbossbattle.com/old-world-review/),
  [LadiesGamers tips](https://ladiesgamers.com/old-world-tips-guide-1/)). Hovering the
  Orders counter opens a drop-down that lets you pay Training for an extra order, so the
  counter itself is the place to act on it
  ([TheGamer](https://www.thegamer.com/old-world-how-to-buy-get-more-orders-legitimacy/)).
- **Civilization VII:** a critique of the resource summary calls it "functional, but lacks
  depth": it shows totals but not the district or hex that produced them
  ([AL97](https://al97.com/news/civ-739s-ui-bad.html)). A Global Yields Breakdown screen
  was added after launch (reported in the search extract with
  [civ7_hud_overhaul](https://github.com/don-pablo-bablo/civ7_hud_overhaul) and the
  [1.1.0 notes](https://civilization.fandom.com/wiki/1.1.0_Update_(Civ7))). Patch 1.2.5
  states that yield losses from maintenance and overbuilding are now shown "in every
  context," after being shown inconsistently
  ([2K: Developing your Settlements](https://civilization.2k.com/civ-vii/from-the-devs/developing-settlements/)).
- **Age of Wonders 4:** the affinity points that gate higher-tier tomes sit at the top
  right ([Noobfeed](https://www.noobfeed.com/articles/age-of-wonders-4-tomes-imperium-expansion-tips)),
  and Dev Diary #7 mentions a UI that summarizes your Magic Materials
  ([Dev Diary #7](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-7)).

### Applying this to Fluid Magic

- **Every counter shows the stock with its monthly rate:** `Gold 412 (+38)`,
  `Materials 120 (+60)`, and each mana pool as its symbol plus the stock and rate
  (`R 14 +3`), the WUBRG five in fixed order. Colors with no income and no stock fold into
  one dim "+3 more" chip so M1 (Red and Green) is not cluttered with three zeros. The
  symbol always comes with the number (docs/07 accessibility).
- **Hover a counter (L1):** the breakdown, positive lines then negative, from
  `nationEconomy`: per-source totals (taxes, springs, dominion bonus, ritual upkeep, army
  upkeep) and "Top 3 provinces" lines that link to the provinces (Civ VII's "lacks depth"
  lesson).
- **Click a counter (L4):** opens a **Ledger** modal with that resource's tab:
  per-province rows sortable by column, and for mana, per-spring rows and per-color
  dominion contributions. Each row has a jump button. The Ledger is where the
  empire-wide breakdown Civ VII added after launch lives from day one.
- **Act from the counter:** following Old World's Orders drop-down, the gold tooltip has a
  "Tax policy" link and the mana tooltip a "Convert mana" link (the `manaConvert` ritual)
  that opens the ritual panel already filtered.
- **Show losses everywhere** (Civ VII 1.2.5): upkeep, starvation losses and unpaid troops
  appear as negative lines in every tooltip that sums them, never only in the Ledger.

---

## 4. Map lenses and overlays

### Patterns

- **Civilization VI ships about ten lenses on number keys:** 1 Religion, 2 Continent,
  3 Appeal, 4 Settler, 5 Government, 6 Political, 7 Tourism, 8 Loyalty (Rise and Fall),
  9 Empire, 0 Power
  ([Civ6 wiki key bindings](https://civ6.fandom.com/wiki/Key_bindings),
  [Control bindings](https://civilization.fandom.com/wiki/Control_bindings_(Civ6))).
  The Settler lens shows recommended city sites and fresh water. Loyalty shows each city's
  loyalty and the sources pushing on it. Empire shows districts, wonders and borders with
  adjacency
  ([Lens wiki](https://civilization.fandom.com/wiki/Lens_(Civ6)),
  [Palain](https://www.palain.com/gaming/civilization-vi/playing-civilization-vi-part-10/)).
  Palain and the wiki both rate Government and Political as of little use. Of ten lenses,
  a few carry the decisions.
- **Lenses open automatically in context.** The wiki says the district and wonder placement
  lens opens on its own. Players report the Settler lens opening when a settler is selected
  and the Religion lens when a missionary is selected, and some asked how to stop it
  ([CivFanatics thread](https://forums.civfanatics.com/threads/how-to-disable-the-religion-lens.611380/),
  [Palain](https://www.palain.com/gaming/civilization-vi/playing-civilization-vi-part-10/),
  [Lens wiki](https://civilization.fandom.com/wiki/Lens_(Civ6))).
  Clicking Purchase Tile in the city panel turns on a Purchase Tile lens
  ([Civ6 wiki: City](https://civ6.fandom.com/wiki/City)).
- **Players wanted more.** The More Lenses mod adds an adjacency lens drawn as a gradient,
  a builder lens that turns on when a builder is selected, and Shift+1 to Shift+9 for its
  extra lenses
  ([GitHub: MoreLenses](https://github.com/astog/MoreLenses),
  [Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=871712879)).
- **Civilization VII warns against heavy tints.** A player wrote that "The settler lens
  masks the game map way too much"
  ([Steam discussion](https://steamcommunity.com/app/1295660/discussions/2/570371162116298772)).
  By 1.5.0 (September 2026), the lens "no longer change[s] automatically when a Capital City
  is founded," and the plot tooltip now shows Appeal and whether a plot is on an island
  ([Patch notes, September 15, 2026](https://support.civilization.com/hc/en-us/articles/55328611080339-Civilization-VII-Patch-Notes-September-15-2026)).
  Automatic lens switches need to be predictable, and the tooltip is a second channel
  for what the lens shows.
- **Age of Wonders 4:** unexplored land is covered in animated mist with terrain
  silhouettes rendered into it, so you get a rough sense of the land before scouting
  ([Dev Diary #7](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-7)).

### Applying this to Fluid Magic

- **Keep six lenses** (Ownership, Dominion, Supply, Unrest, Population, Mana springs). Civ
  VI shows that a few lenses carry the decisions. Add **Threat** (known enemy armies, their
  ETA and reach) only if playtesting asks for it.
- **A lens tints the fill but leaves the frame alone.** A lens changes province fills only.
  Borders, ownership bands, army badges, labels and Wellspring icons stay at full contrast
  (the Civ VII "masks the map" lesson). Draw lenses at about 70% fill opacity over a
  desaturated terrain fill.
- **Every lens has a legend** in the bottom-left corner of the map: a scale with symbols, for
  example dominion candles 0 to 10 in nation banners, or supply as surplus / tight /
  starving with icons and not only color. Each province tooltip leads with the active
  lens's value.
- **Automatic lenses by context**, each one reverting when the context ends, and each with
  a setting to turn it off (Civ VI players asked how):
  - Ritual target picking: a **Valid targets** lens (Civ VI's placement lens). Invalid
    provinces dim, and valid ones are labeled with the predicted effect, e.g. "-6% pop
    (-430)". Show the data without ranking or highlighting a "best" target; Civ VII
    removed exactly that (Section 10).
  - Priest or prophet selected: the Dominion lens.
  - Moving army being ordered: the Supply lens along the path, with starving provinces
    marked.
- **The Mana springs lens** colors springs by their color symbol and shows dominion's
  extra yield.
- **Fog:** unseen provinces keep their terrain silhouettes under a dim parchment haze
  (AoW4's mist), so the map still reads before scouting.

---

## 5. Notifications and alerts

### Patterns (all turn-based in this cluster; Section 5b adapts them to real time)

- **Civilization VI:** a stack of notification icons on the right edge. Some clear
  themselves at the next turn; persistent ones (for example a wonder completed or a tile
  pillaged) need manual dismissal, and right-click dismisses them
  ([CivFanatics: right-clicking](https://forums.civfanatics.com/threads/right-clicking.659074/)).
  Pending decisions block the end of the turn: the End Turn button becomes the prompt, and
  Shift+Enter forces the turn past blockers
  ([Steam: Cannot End Turn](https://steamcommunity.com/app/289070/discussions/0/312265473878047104/)).
- **Civilization VII complaints:** notifications are "annoying to click through and
  simultaneously disappear without any reason"; there was no alert when units took damage
  off-turn, so scouts were lost unseen; players asked for the camera to jump to attacked
  units
  ([Steam discussion 1](https://steamcommunity.com/app/1295660/discussions/2/570371033831324629),
  [Steam discussion 2](https://steamcommunity.com/app/1295660/discussions/2/570371162116298772)).
  Firaxis's audio team reworked the sounds for "prominent gameplay UI features, such as
  Notifications, Abilities and Unit Selects"
  ([A Sound Effect interview](https://www.asoundeffect.com/civilization-vii-game-audio/)).
- **Humankind:** the End Turn button doubles as an alert, telling you when units still need
  orders (launch reviews,
  [PC Gamer](https://www.pcgamer.com/humankind-review/) /
  [TheSixthAxis](https://www.thesixthaxis.com/2021/08/16/humankind-review-a-different-breed/);
  the extract does not say which review this came from). A beta tester found the glowing
  star unclear, put the army-cycling button in the same space as End Turn, and complained
  that notifications sat "all over the place... not near the end of the turn button"
  ([Steam beta feedback](https://steamcommunity.com/app/1271140/discussions/0/4362280244719335674/)).
  Patches added "control over notifications, so that only relevant ones are displayed" and
  a show/hide button on notifications. They also fixed an Idle Army notification that
  blocked ending the turn (1.0.2)
  ([Humankind wiki: Updates](https://humankind.fandom.com/wiki/Updates)). Players reported
  that the Wonders screen could only be reached from its notification, so a missed
  notification meant reloading
  ([Humankind forum](https://community.amplitude-studios.com/amplitude-studios/humankind/forums/169-game-design-and-ideas/threads/54966-ideas-list-clearer-user-interface?page=1)).
- **Old World:** a turn summary with icons for events, diplomacy changes and deaths
  ([BigBossBattle](https://bigbossbattle.com/old-world-review/)). The turn summary popup
  was later redesigned with categories and icons (the extract dates this to 2023;
  [Update #108](https://mohawkgames.com/2023/05/10/old-world-update-108/) is the 2023
  update that surfaced). Free improvements now go into an event queue and are placed by
  clicking a valid tile
  ([Update #136](https://mohawkgames.com/2025/06/25/old-world-update-136/)). Guides
  recommend the setting that pauses time during event decisions
  ([LadiesGamers tips](https://ladiesgamers.com/old-world-tips-guide-1/)).

### 5b. Applying this to Fluid Magic (real time, no turns)

None of these games needs to stop a running clock, but they agree on four things: one
predictable place, persistent conditions that stay until resolved, jump-to-target, and
player control over what interrupts. In real time:

1. **Two kinds, in two places:**
   - **Conditions** (persistent states): idle commander, army starving, troops unpaid,
     research color has no researchers, lab mage idle, a Wellspring under contest, a fort
     under siege. They sit as **alert icons in a row under the top bar** with a count badge
     (for example "2 idle commanders"). A condition stays until it is resolved and never
     times out (the Civ VII complaint). Clicking an icon cycles through the cases and
     jumps the camera. Hovering it lists them all, each a link.
   - **Events** (things that happened): battle fought, recruit batch done, ritual done,
     research level, province captured or lost, dominion flipped, enemy sighted. They go to
     the **Messages log** in the right dock (docs/07), newest at the top. Each has a
     jump-to button, right-click to dismiss (Civ VI), and grouping of repeats ("3 batches
     recruited").
2. **Per-type control (Humankind's patch, Paradox style):** in Settings, each event type is
   set to **Pause + popup / Popup / Log only / Off**. Defaults follow docs/07's auto-pause
   list (battle involving the player, province lost, research level, victory). A small
   gear on each message opens that type's setting directly.
3. **Threats are alerted before they arrive:** "Enemy army sighted, 3 squads, heading to
   Ashfall, ETA 4 days." This is the real-time form of Civ VII's missing off-turn damage
   alert. It is a Condition while the army is in range and an Event when first seen.
4. **Every screen has a menu entry.** Nothing is reachable only from a notification
   (Humankind's Wonders screen). Battle reports are also listed in a Battles tab of the
   Ledger.
5. **A distinct sound per category:** a soft chime for an Event, a lower tone for a new
   Condition, a drum for a battle involving the player. Keep these short, separate from the
   battle replay's sound set, and easy to tell apart (Civ VII treats notification sounds as
   their own design area).
6. **Battle messages are battle report cards** (Section 7) with a "Watch replay" button.

---

## 6. Unit cards: what is on the card, on hover, and in the detail page

### Patterns

- **Age of Wonders 4:** an army holds up to six units, and army-wide abilities sit on the
  right of the army panel
  ([AoW4 wiki: Unit](https://aow4.paradoxwikis.com/Unit)). You select units by
  left-clicking their portraits along the bottom of the screen, then move them to split
  the army
  ([Steam: armies](https://steamcommunity.com/app/1669000/discussions/0/3828666171744043059/)).
  The unit panel color-codes properties (debuffs in red). Status effects in the Unit
  Abilities panel have their own tooltips "so you don't have to enter the Unit Panel"
  ([Wyvern patch notes](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-wyvern-update-patch-notes)).
  So AoW4 has three depths: portrait card, then hover, then the full unit panel, and the
  hover layer was widened so the deep layer is needed less.
- **Humankind (what to avoid):** the unit info panel "takes almost half of the screen";
  players wanted to select several units at once, and after a split the original army
  stayed selected instead of the new one
  ([Steam beta feedback](https://steamcommunity.com/app/1271140/discussions/0/4362280244719335674/),
  [Humankind forum](https://community.amplitude-studios.com/amplitude-studios/humankind/forums/212-closed-beta/threads/40605-feedback-user-interface-and-user-experience?page=8)).
- **Total War: Warhammer III:** see Section 12 [unverified]. It has the canonical horizontal
  strip of unit cards with health and rank on each card.

### Applying this to Fluid Magic: one card component, three depths

The same `UnitCard` component appears in the recruit grid, the commander squads list, the
right-dock army list, the pre-battle and result screens, and the battle replay's side
panels. That is how the replay's frame stays consistent with the rest of the UI.

| Depth | Shows | Trigger |
|---|---|---|
| **Card** (about 72x96 px) | Sprite portrait tinted in the nation banner; count badge (`x18`); HP bar (squad HP%); row glyph (front/mid/rear); for mages, a pip row as mana symbols; up to 3 status icons (routed, starving, unpaid, blessed, buffed); for recruits, the cost as gold + materials icons and days | Always |
| **Hover** (L1, pinnable L2) | Stat block (HP, prot, mor, att, def, str, prec, mapSpeed); weapons; tags as links (armor piercing, flying, berserk); upkeep and supply use; for recruits, the reason if you cannot recruit ("needs 80 materials, fort has 52"); each status icon explains itself | Hover; Shift pins |
| **Detail** (Codex entry or side sheet) | Full stats with sources (base, scales, blessings, terrain); description; nation; which commanders can lead it; for mages, the spells castable now and after research | Right-click or Ctrl+click the card; "More" in the pinned tooltip |

- **Multi-select and drag:** Ctrl-click or drag a box across squad cards, then drag them
  onto another commander's card in the right dock (docs/07 already has the drag). After a
  split, select the **new** group (Humankind lesson).
- **Card size:** about 72x96 px, so a commander strip of 8 squads fits in the bottom bar
  at 1280 px and never takes "half the screen".
- **Status icons:** at most three, the rest behind a "+2" chip. Each has a tooltip (AoW4
  Wyvern).

---

## 7. Armies, pre-battle and the battle result

### Patterns

- **AoW4 previews the engagement on hover.** With an army selected, "hovering over an
  enemy will show you exactly who will be involved (up to three armies with six units each
  can work together in battle) and what outcome is expected"
  ([PC Gamer](https://www.pcgamer.com/age-of-wonders-4-review/)).
- **AoW4 auto-resolve offers a forecast and retries.** Players report that pressing
  autoresolve shows the outcome, which you can accept or refuse and fight manually instead.
  They also report retrying an auto-resolve "as many times as you like" with the default
  settings, and a button (two red crossed swords beside the playback speeds) that hands a
  manual battle to the AI mid-fight
  ([Steam: Autocombat too good?](https://steamcommunity.com/app/1669000/discussions/0/3826415752024876605/),
  [Steam: Safe Battle](https://steamcommunity.com/app/1669000/discussions/0/5294588689495699150/),
  [Steam: Nice autoresolve](https://steamcommunity.com/app/1669000/discussions/0/3828666283436674994/)).
  Players disagree about how detailed the forecast is (overall result or per unit).
- **Total War: Warhammer III's** pre-battle screen and post-battle results screen are the
  genre's standard frame; see Section 12 [unverified].

### Applying this to Fluid Magic

Fluid Magic's battles resolve automatically from scripts, so the preview is the main
decision aid. It must not leak the future.

- **Engagement preview on hover (L1).** With commanders selected, hovering a province
  that has hostiles shows a compact card. Each side gets its commanders and squads as
  mini unit cards (enemies fogged as "about 30 troops" when not scouted, per docs/01
  section 14), then terrain and fort modifiers (fort storm +3 prot, walls +6, the
  province's Fury and Lore scales), then a **strength bar** comparing the two sides.
- **Do not run the resolver for the forecast.** AoW4 reportedly shows the actual outcome
  and lets you retry. In Fluid Magic the resolver is deterministic and seeded from
  `state.rng`, so a forecast made by running it would reveal the real result and let
  players fish for good rolls by changing orders. Compute the bar from a cheap,
  RNG-free strength estimate (sum of troop power times modifiers) and label it "Estimate".
  Give the estimate its own selector in `src/sim/selectors.ts` so the AI can use the same
  number. Record this in docs/04 Implementation decisions.
- **Script check on the preview:** list the caster's first two script slots with a green
  or amber dot (castable now / would fail: "Fireball needs RR, has R"), so a broken script
  shows before the fight and not in the replay.
- **Battle report card (results):** when a battle ends, a report card goes into Messages
  and, if the game auto-pauses, appears as a popup. It shows a headline with the outcome
  band (Decisive / Clear / Narrow / Pyrrhic, from survivor ratios), date and province;
  both sides' **unit cards with before → after counts** and kill tallies; commanders
  killed; spells cast with counts; then the buttons **Watch replay** (primary), Jump to
  province, Close.
- **The replay frame** (consistent with the battle presentation work): the replay modal
  reuses the report card's header and side panels. The live unit cards count down during
  playback, the transport bar (pause, 0.5x to 4x, skip to end) sits bottom center like
  AoW4's playback controls, and closing the replay returns to the report card. The
  replay is a richer view of the report the player already has.

---

## 8. Research: trees, tracks and cards

### Patterns

- **Old World's tech deck (cards).** "Each tech would be represented by a card, and the
  player would choose a tech by taking four cards from the current draw pile, choosing one,
  and discarding the rest." Discarded techs come back only when the deck reshuffles, and
  "the player can follow the path of each card through the different piles to know
  exactly when it might next be available and what the odds are of drawing it"
  ([Designer Notes #4](https://www.designer-notes.com/?p=1703); also
  [Mohawk interview](https://civfanatics.com/?p=6644)). The randomness is visible to the
  player.
- **Age of Wonders 4's tomes.** The tech tree is split into 54 Tomes of Magic across six
  affinities
  ([Dev Diary #1](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-1)).
  A pre-release preview described picking from three options drawn from a pool of standard,
  culture and tome techs
  ([SI preview](https://videogames.si.com/features/age-of-wonders-4-preview)); the shipped
  UI may differ. Players report that the bottom of the research screen counts how many
  researches remain until the next tome
  ([Steam: How do I research Tomes?](https://steamcommunity.com/app/1669000/discussions/0/662718188277002777/)).
  A newly picked tome's skills cost more research the more tomes you already hold
  ([Dev Diary #21](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-21)).
- **Civilization VII's tech and civics trees** needed a fix so connector lines met their
  nodes ([1.1.0 notes](https://civilization.fandom.com/wiki/1.1.0_Update_(Civ7))). Graph
  trees are costly to lay out and keep readable.
- **Stellaris's three lanes of drawn tech cards** are the closest match to Fluid Magic's
  per-color tracks; see Section 12 [unverified].

### Applying this to Fluid Magic

Fluid Magic has **five tracks** (one per color, levels 1 to 6). That is simpler than any
tree, which is an advantage: no connector lines to draw.

- **Research modal (key R), five columns** as in docs/07. Each column has a header with
  the color's symbol, element name, current level and RP progress, and a "Research this"
  toggle; the active column is outlined in its mana primary. Each level is a row of
  **spell cards** (5 battle and 5 ritual spells spread across the levels), so the screen
  reads as "what each color gives me next".
- **A spell card** shows the color requirement as symbols (`RR`), the kind (Battle /
  Ritual), the main effect in one line, and the cost (fatigue or mana + days). Hover gives
  the full effect from its primitives. Right-click opens the Codex.
- **Link research to pips:** each spell card shows "Castable by 2 of your mages" (or
  "No mage has RR"), so research and mage recruitment are planned together. The data
  comes from commanders' pips.
- **The ETA counts in days and months,** not turns: "Level 3 in 47 days at 32 RP/month."
  A hover breakdown lists RP by mage and lab (`3 + 2 x pips`, Lore scale), each mage a
  link.
- **A Condition alert** when the active color has no researchers, or when it is maxed while
  others are not (Section 5b).

---

## 9. Spell books

### Patterns

- **Age of Wonders 4:** each spell has two costs, mana and casting points, with separate
  world-map and combat values
  ([AoW4 wiki: Strategic spells](https://aow4.paradoxwikis.com/Strategic_spells),
  [Tactical spells](https://aow4.paradoxwikis.com/Tactical_spells)). Players call the spell
  book one long, hard-to-sort list and want to mark favorites or hide unused spells. In
  combat, a large blue spells button opens the tactical list, and a star beside each entry
  pins it to a quick-access bar
  ([Steam: The spell book UI is awful](https://steamcommunity.com/app/1669000/discussions/0/3826416272370395409/)).
  MMORPG names spell research as the place where large tooltips got in the way
  ([MMORPG review](https://www.mmorpg.com/reviews/age-of-wonders-4-review-2000127821)).
- **Total War: Warhammer III's** lores of magic and in-battle spell bar: Section 12
  [unverified].

### Applying this to Fluid Magic

There is no separate "spell book" screen. Spells appear in three places, each filtered to
its purpose:

1. **Script slot picker** (commander panel). The 5 slots are the quick-access bar, so no
   favorites are needed. Opening a slot shows **only spells this commander can cast**
   (pips and researched level), each with its fatigue cost **for this caster** (reduced by
   extra pips, docs/02 section 3), carried-mana need, and target type. A toggle "Show
   locked" lists the rest dimmed, each with the reason ("needs RR", "research Ember 3").
2. **Ritual panel** (key C), filtered to the selected caster. Filter chips by color symbol
   and by effect group (Summon / Province / Remote / Utility). The cost is drawn as mana
   symbols plus generic (MTG style), and the payment row shows the pool after paying.
3. **Codex: Spells**, the full reference with filters (color, kind, level, "researched",
   "castable by someone"). This answers the AoW4 complaint about sorting.

Spell tooltips are capped at the L1 template height. The full primitive breakdown moves to
the pinned (L2) view so it never blocks a click (MMORPG's complaint).

---

## 10. Province (city) screens

### Patterns

- **Civilization VI city panel:** it shows the city's culture, food, production, science,
  faith and gold, plus housing, amenities and the current build with turns left
  ([Civ6 wiki: City](https://civ6.fandom.com/wiki/City),
  [City (Civ6)](https://civilization.fandom.com/wiki/City_(Civ6))). Gold and Faith purchases
  have their own tabs next to production, and Purchase Tile is a lens toggled from the
  panel. CQUI, the most widely used UI mod, merges producing and buying into one panel
  ([CQUI](https://github.com/civfanatics/CQUI_Community-Edition)).
- **Civilization VII's production menu (1.2.5).** The developers wrote that the old
  predictive yield display confused players and pushed them toward whatever showed the
  biggest number. The menu now shows base yields, warehouse effects and adjacency up front.
  Tooltips were reformatted, with tags that summarize each building's role. Placement got
  yield indicators and featured tiles, with the best tiles in green numbers, and the old
  display remains as an option
  ([1.2.5 notes](https://civilization.2k.com/civ-vii/game-update-notes/2025-sep-30-patch-1-2-5/),
  [2K: Developing your Settlements](https://civilization.2k.com/civ-vii/from-the-devs/developing-settlements/),
  [PCGamesN](https://www.pcgamesn.com/civilization-vii/update-1-2-5-settlement-menus)).
  PCGamesN's headline quotes the developer admitting the menus caused "analysis paralysis
  or, even worse, indifference." Earlier, City Details gained a line showing where a Town
  sends its food
  ([February 5, 2025 notes](https://support.civilization.com/hc/en-us/articles/38337649895187-Civilization-VII-Patch-Notes-February-5-2025)).
- **Readability at a glance.** One Civ VII critic says its buildings look alike and can go
  anywhere, while Civ VI's color-coded districts showed at a glance what each city had
  built. The same critic says unlock requirements were "not communicated at all in the
  preceding era"
  ([Trekking with Dennis](https://trekkingwithdennis.com/2025/03/02/civ-7-further-thoughts/)).
- **Endless Legend 2's city flow.** After mixed feedback on the city screen, Amplitude planned
  to change it so you "pick a district first and then place it"
  ([State of the Game, October 2025](https://community.amplitude-studios.com/amplitude-studios/endless-legend-2/blogs/1007-state-of-the-game-october-2025)).
  A later post notes that there was no place to see all the available districts
  ([State of the Game, November 2025](https://community.amplitude-studios.com/amplitude-studios/endless-legend-2/blogs/1015-%E2%80%8Bstate-of-the-game-%E2%80%93-november-2025)).

### Applying this to Fluid Magic: the province panel (left dock)

- **Header:** name, terrain icon, owner banner and symbol, dominion candles. Building
  icons in fixed slots (fort, temple, lab) with distinct silhouettes, as with Civ VI's
  color-coded districts: an empty slot shows a faint outline, so what is missing is
  visible at a glance.
- **Big numbers row (L0 in the panel):** Population (large) with growth/month; Gold,
  Materials, Supply (used/available), Unrest, each with its rate and the L1 breakdown
  tooltip from `provinceEconomy`.
- **Tabs:** `Overview` | `Recruit` (fort only) | `Build` | `Magic` (springs, Wellspring
  status, rituals affecting the province). Remember the last tab per province type.
- **Recruit tab (follows CQUI's single panel):** a grid of unit cards, each with gold and
  materials cost and days; the batch size beside the card; the queue below with cancel.
  If you cannot recruit, the card dims and its tooltip says why. No "recommended" badge
  (Civ VII's lesson).
- **Show deltas before confirming (AoW4 Dev Diary #6, Civ VII 1.2.5):** the tax selector
  and PD buy show the change in gold/month and unrest/month as signed numbers next to the
  control before you confirm.
- **List all options, with locked ones dimmed** (EL2's "no place to see all districts"):
  the Build tab lists every building type, with the reason it cannot be built yet.

---

## 11. Layout, screen space and one place for actions

### Patterns

- **Endless Legend 2 removed its "Divided UI."** Amplitude's UI/UX post plans to
  "consolidate information, improve flow and remove the 'Divided UI' concept," because
  players "didn't know what part of the screen to look at for information or actions."
  Empire actions had been split between the top left and the area around the turn button
  ([UI/UX Next Steps](https://community.amplitude-studios.com/amplitude-studios/endless-legend-2/blogs/996-ui-ux-next-steps)).
  The October 2025 update moved all empire-level buttons to the top left
  ([State of the Game, October 2025](https://community.amplitude-studios.com/amplitude-studios/endless-legend-2/blogs/1007-state-of-the-game-october-2025)),
  and the main screen redesign shipped in November
  ([State of the Game, November 2025](https://community.amplitude-studios.com/amplitude-studios/endless-legend-2/blogs/1015-%E2%80%8Bstate-of-the-game-%E2%80%93-november-2025)).
- **Old World:** the bottom left holds the character, end-of-year commands and action
  filters. Selecting a unit or character fills the left side with options, and a reviewer
  says you can lose "40-50% of the screen" to menus and pop-ups
  ([BigBossBattle](https://bigbossbattle.com/old-world-review/)).
- **Civilization VII:** the interface "very obviously was made with 1080p resolution in
  mind," and text looks blurry at higher resolutions
  ([Steam discussion](https://steamcommunity.com/app/1295660/discussions/0/591762405949782656/)).
  A Steam critique attributes "menus... buried in menus" to the cross-platform design
  (search extract).

### Applying this to Fluid Magic

- **One home per kind of thing (EL2's lesson), pinned in docs/07:**
  - *Nation-level screens* (Research, Rituals, Ledger, Codex, Nations, Settings): buttons
    in the **top bar's right end**, each labeled with its hotkey.
  - *Information about the selection:* **left dock**.
  - *Actions on the selection* (orders, script, formation): **bottom strip** only, never
    split between the dock and the strip.
  - *Lists* (armies in the selected province, messages): **right dock**.
- **The map keeps at least 55% of the width at 1280x720.** Both docks collapse to an icon
  rail (keys `[` and `]`), and the bottom strip collapses to one line when nothing is
  selected (Old World's 40 to 50% warning).
- **Scale with the DOM, not with bitmaps:** use CSS `rem` sizing with a UI scale setting
  (90 to 150%), and SVG icons (docs/09). The UI then stays sharp at 1440p and 4K, unlike
  Civ VII's 1080p-bound interface.
- **Every system screen has a top-bar entry and a hotkey** (Section 5b, rule 4).

---

## 12. Total War: Warhammer III and Stellaris [unverified]

The search budget ran out before these could be checked. What follows is from general
knowledge of the shipped games and has **no citation**. Verify it, for example in a
follow-up session with more searches, before the spec relies on it.

- **TW:WH3 campaign army panel [unverified]:** selecting an army shows a bottom panel
  with the lord's portrait and details on the left and a horizontal row of unit cards (up
  to 20 including the lord). Each card shows the unit's art, a health bar for unit
  strength, rank chevrons for experience, and a type icon. Hovering a card opens a
  detailed stats panel. **For Fluid Magic:** this is the pattern behind the bottom-bar
  commander strip and the `UnitCard` in Section 6.
- **TW:WH3 recruitment [unverified]:** a Recruit button opens a strip of recruitable unit
  cards with cost and turns to recruit. Units can be recruited locally or globally, and
  global recruitment takes longer; slots per turn are limited. **For Fluid Magic:** the
  recruit grid in Section 10, and a reason when a slot or the materials are short.
- **TW:WH3 army stances [unverified]:** a row of stance buttons (march, ambush, raid,
  encamp...) next to the army panel. **For Fluid Magic:** commander orders (Idle,
  Pillage, Patrol, Research, Preach...) as a single row of icon buttons in the bottom
  strip, each with an L1 tooltip giving its per-day effect.
- **TW:WH3 pre-battle and results [unverified]:** before a battle, a screen shows both
  armies' unit cards and a balance-of-power bar, with Attack, Auto-resolve and Retreat or
  Withdraw buttons. After it, a results screen shows the victory grade and casualties per
  unit card, sometimes followed by choices for captives. **For Fluid Magic:** the strength
  bar and the battle report card in Section 7.
- **TW:WH3 magic in battle [unverified]:** a Winds of Magic reserve bar, spells as
  buttons on the caster's ability bar, and an "overcast" variant. **For Fluid Magic:** the
  replay's side panels show each caster's fatigue as a bar that fills with each cast,
  echoing the reserve bar.
- **Stellaris research [unverified]:** three lanes (Physics, Society, Engineering), each
  drawing a small hand of tech cards (typically three) with icon, cost and progress. Rare
  techs have a distinct frame, and hovering shows what a tech unlocks. **For Fluid
  Magic:** spell cards per level in each color column (Section 8). Fluid Magic has no
  draw, since levels are fixed.
- **Stellaris top bar and outliner [unverified]:** the top bar shows each resource with
  its monthly delta and a hover breakdown by source. A right-side collapsible "outliner"
  lists planets, fleets and ships, with alert icons under the top bar. The game is real
  time with pause, like Fluid Magic. **For Fluid Magic:** the right dock's army list could
  grow into an outliner (my commanders grouped by province, with order and ETA), and the
  Condition icons in Section 5b sit under the top bar in the same way.

---

## 13. Chrome and art direction

### Patterns

- **Endless Legend:** reviewers call the UI "clean, minimalistic, and beautiful,"
  "strangely evocative of art deco," and the game a "watercolor fantasy"
  ([PCGamesN](https://www.pcgamesn.com/endless-legend/endless-legend-review),
  [GameRevolution](https://www.gamerevolution.com/review/65471-endless-legend-review),
  [RPGWatch](https://rpgwatch.com/articles/endless-legend-review-260.html); the extract
  does not say which review used which phrase). A Steam user calls it "one of the best
  ones I have seen in any game"
  ([Steam thread](https://steamcommunity.com/app/289130/discussions/0/1318836262665428322/)).
  The same reviews say tooltips were "frustratingly vague" without tutorials.
- **Endless Legend 2 (early access):** a player found the UI "too loud," a beautiful layer
  that distracts from the game itself (same search result set).
- **Humankind:** an early internal UI guideline posted on the forums, whose origin is
  unverified, asked for translucent panels, white and blue only, and minimal information
  on the map
  ([Humankind forum: To Amplitude UI Team](https://community.amplitude-studios.com/amplitude-studios/humankind/forums/169-game-design-and-ideas/threads/51279-to-amplitude-ui-team)).

### Applying this to Fluid Magic

- **Quiet chrome, color only where it means something.** Panels are dark neutral (docs/07),
  thin keylines, one display face for headers and one tabular face for numbers. Mana
  colors and nation banners appear **only** on things that carry that identity (symbols,
  pips, ownership bands, the active research column). Decorative gradients do not use
  mana colors. The map's parchment is the beauty; the chrome frames it (the "too loud"
  warning).
- **Card language shared everywhere:** unit cards, spell cards, the chassis card and the
  battle report card share a frame (rounded rectangle, header band in nation secondary
  per docs/09, symbol row at the bottom), so the battle replay looks like the rest of the
  game.

---

## 14. Concrete changes proposed for docs/07-ui.md

A checklist the spec author can use directly. Each item points back to its section.

1. **Information layers L0 to L5** as a named rule: every number has L0 (visible),
   L1 (breakdown tooltip from a selector) and a path to L5 (Codex). (§0, §1)
2. **Pinned, nested tooltips:** Shift or a 0.8 s rest pins; dotted-underline links, never
   blue; at most 3 levels; Esc closes the chain; scroll above 60% of viewport height;
   placed away from the cursor target. Settings: delay, compact mode, suppress hotkey.
   (§1)
3. **Codex** modal generated from the content registry: topics on the left, search
   focused on open, cross-links, tutorial pages. Opened by Ctrl+click on any term,
   right-click on a card, or a hotkey. (§2)
4. **Top bar:** stock with monthly rate for gold, materials and each mana color; colors
   with nothing fold into a chip; hover breakdown; click opens the **Ledger** (per-province
   and per-spring tables, Battles tab). (§3)
5. **Lenses** keep borders, bands, badges and labels at full contrast; legend in the
   bottom-left; automatic lenses for ritual targeting, priests and army moves, each
   reverting and each with an off setting; the ritual target lens labels effects without
   ranking them. (§4)
6. **Alerts:** Conditions as icons under the top bar (persistent, cycle-to-jump), Events in
   Messages (jump-to, right-click dismiss, grouping). Per-type Pause/Popup/Log/Off. Threat
   alerts with ETA. A distinct sound per category. No screen reachable only from a
   notification. (§5b)
7. **UnitCard component**, three depths, reused in recruit, army, pre-battle, report and
   replay. Multi-select and drag; the new group stays selected after a split. (§6)
8. **Engagement preview** on hovering hostiles with a selection: both sides, modifiers,
   an RNG-free strength bar labeled "Estimate," a script castability check. The resolver
   is **never** run for a preview. (§7)
9. **Battle report card** with before → after unit cards, outcome band and "Watch replay."
   The replay modal reuses its frame. (§7)
10. **Research modal:** five color columns of spell cards per level, ETA in days,
    "castable by N of your mages," an alert when no one is researching. (§8)
11. **Spells in three filtered places:** the script slot picker (castable only, fatigue
    for this caster), the ritual panel (filter chips, payment preview) and Codex: Spells.
    (§9)
12. **Province panel:** building slots with outlines, big numbers with rates, tabs
    Overview/Recruit/Build/Magic, signed deltas shown before confirming, locked options
    with reasons. (§10)
13. **One home per kind of thing:** nation screens in the top bar's right end, info in the
    left dock, actions in the bottom strip only, lists in the right dock; collapsible
    docks; map at least 55% of the width at 1280; rem-based UI scale setting. (§11)
14. **Keyboard map (proposal, to settle the F1 conflict):** keep Space and 1 to 4 for
    speed (Paradox); R Research; C Cast; L Ledger; **F1 or `?` Codex** (matching Old
    World and AoW4); **Q and E** to step backward and forward through lenses, plus
    **Shift+1 to Shift+6** for direct lens choice (the Shift+number scheme from the Civ VI
    More Lenses mod); Tab cycles own commanders; `.` jumps to the next Condition
    (idle-unit cycling, as Humankind's army-cycle button does); `[` and `]` collapse the
    docks; Ctrl+S save. WASD panning stays. Check F1 capture in Chrome and Firefox; if it
    cannot be captured, `?` is the only Codex key.

---

## Source index (grouped by game)

All URLs were returned by WebSearch in this session. None could be opened directly (see
the limits note at the top).

**Old World:**
[Update #16](https://mohawkgames.com/2020/09/02/old-world-update-16/) ·
[Update #60](https://mohawkgames.com/?p=3001) ·
[Update #73](https://mohawkgames.com/2021/10/06/old-world-update-73/) ·
[Update #108](https://mohawkgames.com/2023/05/10/old-world-update-108/) ·
[Update #117](https://mohawkgames.com/2023/12/13/old-world-update-117/) ·
[Update #120](https://mohawkgames.com/2024/03/06/old-world-update-120/) ·
[Update #121](https://mohawkgames.com/2024/04/04/old-world-update-121/) ·
[Update #129](https://mohawkgames.com/2024/10/24/old-world-update-129/) ·
[Update #132](https://forums.civfanatics.com/threads/old-world-update-132.695851/) ·
[Update #134](https://mohawkgames.com/2025/04/30/old-world-update-134/) ·
[Update #136](https://mohawkgames.com/2025/06/25/old-world-update-136/) ·
[Update #143](https://mohawkgames.com/2026/02/18/old-world-update-143/) ·
[Manual v1.23](https://cdn.steamstatic.com/steam/apps/597180/manuals/Old_World-Official_User_Manual.pdf) ·
[Manual v1.69](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/597180/manuals/c437bb97d8031b57dfe385c9c9462c1e7815e5d5/Old_World-Official_User_Manual.pdf?t=1765491938) ·
[Designer Notes #4](https://www.designer-notes.com/?p=1703) ·
[Mohawk interview](https://civfanatics.com/?p=6644) ·
[BigBossBattle](https://bigbossbattle.com/old-world-review/) ·
[LadiesGamers tips](https://ladiesgamers.com/old-world-tips-guide-1/) ·
[LadiesGamers review](https://ladiesgamers.com/old-world-review/) ·
[TheGamer](https://www.thegamer.com/old-world-how-to-buy-get-more-orders-legitimacy/) ·
[Ancient World Magazine](https://www.ancientworldmagazine.com/reviews/old-world-2021/) ·
[CogConnected](https://cogconnected.com/review/old-world-review/) ·
[Turn Based Lovers](https://turnbasedlovers.com/review/old-world-review/) ·
[OpenCritic](https://opencritic.com/game/11628/-) ·
[Quarter to Three forum](https://forum.quartertothree.com/t/old-world-pka-ten-crowns-from-soren-johnson/134746/1543) ·
[Steam (Shift lock)](https://steamcommunity.com/app/597180/discussions/0/601892242036097444/) ·
[Steam (vs Civ VI)](https://steamcommunity.com/app/289070/discussions/0/3046105389666045947/)

**CK3/EU5 reference:**
[Tinto Talks #77](https://admin-forum.paradoxplaza.com/forum/developer-diary/tinto-talks-77-20th-of-august-2025.1856053)

**Civilization VI:**
[Key bindings](https://civ6.fandom.com/wiki/Key_bindings) ·
[Control bindings](https://civilization.fandom.com/wiki/Control_bindings_(Civ6)) ·
[Lens wiki](https://civilization.fandom.com/wiki/Lens_(Civ6)) ·
[Civilopedia: Lenses](https://www.civilopedia.net/en-US/standard-rules/concepts/world_7/) ·
[Palain](https://www.palain.com/gaming/civilization-vi/playing-civilization-vi-part-10/) ·
[CivFanatics religion lens](https://forums.civfanatics.com/threads/how-to-disable-the-religion-lens.611380/) ·
[MoreLenses](https://github.com/astog/MoreLenses) ·
[More Lenses Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=871712879) ·
[Manual (Switch)](https://cdn.2kgames.com/manuals/civilization-vi/switch/na/CIV_VI_NSW_ONLINE_MANUAL_US.pdf) ·
[Civilopedia search mod](https://steamcommunity.com/sharedfiles/filedetails/changelog/1341630847?p=1) ·
[City wiki](https://civ6.fandom.com/wiki/City) ·
[City (Civ6)](https://civilization.fandom.com/wiki/City_(Civ6)) ·
[CQUI](https://github.com/civfanatics/CQUI_Community-Edition) ·
[CivFanatics right-clicking](https://forums.civfanatics.com/threads/right-clicking.659074/) ·
[Steam: Cannot End Turn](https://steamcommunity.com/app/289070/discussions/0/312265473878047104/)

**Civilization VII:**
[Wikipedia](https://en.wikipedia.org/wiki/Civilization_VII) ·
[CGMagazine](https://www.cgmagonline.com/news/civilization-vii-quality-of-life-updates) ·
[Steam 1](https://steamcommunity.com/app/1295660/discussions/2/570371033831324629) ·
[Steam 2](https://steamcommunity.com/app/1295660/discussions/2/570371162116298772) ·
[Steam 1080p](https://steamcommunity.com/app/1295660/discussions/0/591762405949782656/) ·
[1.1.0 notes](https://civilization.fandom.com/wiki/1.1.0_Update_(Civ7)) ·
[Feb 5 2025 notes](https://support.civilization.com/hc/en-us/articles/38337649895187-Civilization-VII-Patch-Notes-February-5-2025) ·
[Sep 15 2026 notes](https://support.civilization.com/hc/en-us/articles/55328611080339-Civilization-VII-Patch-Notes-September-15-2026) ·
[1.2.5 notes](https://civilization.2k.com/civ-vii/game-update-notes/2025-sep-30-patch-1-2-5/) ·
[Developing your Settlements](https://civilization.2k.com/civ-vii/from-the-devs/developing-settlements/) ·
[PCGamesN 1.2.5](https://www.pcgamesn.com/civilization-vii/update-1-2-5-settlement-menus) ·
[AL97](https://al97.com/news/civ-739s-ui-bad.html) ·
[civ7_hud_overhaul](https://github.com/don-pablo-bablo/civ7_hud_overhaul) ·
[Trekking with Dennis](https://trekkingwithdennis.com/2025/03/02/civ-7-further-thoughts/) ·
[A Sound Effect](https://www.asoundeffect.com/civilization-vii-game-audio/)

**Age of Wonders 4:**
[Dev Diary #1](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-1) ·
[Dev Diary #6](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-6) ·
[Dev Diary #7](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-7) ·
[Dev Diary #21](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-21) ·
[Wyvern patch notes](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-wyvern-update-patch-notes) ·
[SI preview](https://videogames.si.com/features/age-of-wonders-4-preview) ·
[PC Gamer](https://www.pcgamer.com/age-of-wonders-4-review/) ·
[TechRaptor](https://techraptor.net/gaming/reviews/age-of-wonders-4-review) ·
[MMORPG review](https://www.mmorpg.com/reviews/age-of-wonders-4-review-2000127821) ·
[Windows Central](https://www.windowscentral.com/gaming/age-of-wonders-4-review) ·
[AoW4 wiki: Unit](https://aow4.paradoxwikis.com/Unit) ·
[Strategic spells](https://aow4.paradoxwikis.com/Strategic_spells) ·
[Tactical spells](https://aow4.paradoxwikis.com/Tactical_spells) ·
[Noobfeed](https://www.noobfeed.com/articles/age-of-wonders-4-tomes-imperium-expansion-tips) ·
[Steam: encyclopedia](https://steamcommunity.com/app/1669000/discussions/0/3828666171743764627/) ·
[Steam: manual/F1](https://steamcommunity.com/app/1669000/discussions/0/3828666283435815182/) ·
[Steam: armies](https://steamcommunity.com/app/1669000/discussions/0/3828666171744043059/) ·
[Steam: spell book](https://steamcommunity.com/app/1669000/discussions/0/3826416272370395409/) ·
[Steam: tomes](https://steamcommunity.com/app/1669000/discussions/0/662718188277002777/) ·
[Steam: autocombat](https://steamcommunity.com/app/1669000/discussions/0/3826415752024876605/) ·
[Steam: Safe Battle](https://steamcommunity.com/app/1669000/discussions/0/5294588689495699150/) ·
[Steam: Nice autoresolve](https://steamcommunity.com/app/1669000/discussions/0/3828666283436674994/)

**Endless Legend, Endless Legend 2, Humankind:**
[EL2 UI/UX Next Steps](https://community.amplitude-studios.com/amplitude-studios/endless-legend-2/blogs/996-ui-ux-next-steps) ·
[EL2 October 2025](https://community.amplitude-studios.com/amplitude-studios/endless-legend-2/blogs/1007-state-of-the-game-october-2025) ·
[EL2 November 2025](https://community.amplitude-studios.com/amplitude-studios/endless-legend-2/blogs/1015-%E2%80%8Bstate-of-the-game-%E2%80%93-november-2025) ·
[EL PCGamesN](https://www.pcgamesn.com/endless-legend/endless-legend-review) ·
[EL GameRevolution](https://www.gamerevolution.com/review/65471-endless-legend-review) ·
[EL RPGWatch](https://rpgwatch.com/articles/endless-legend-review-260.html) ·
[EL Steam](https://steamcommunity.com/app/289130/discussions/0/1318836262665428322/) ·
[Humankind PC Gamer](https://www.pcgamer.com/humankind-review/) ·
[Humankind TheSixthAxis](https://www.thesixthaxis.com/2021/08/16/humankind-review-a-different-breed/) ·
[Humankind wiki: Updates](https://humankind.fandom.com/wiki/Updates) ·
[Humankind Steam beta feedback](https://steamcommunity.com/app/1271140/discussions/0/4362280244719335674/) ·
[Humankind ideas list](https://community.amplitude-studios.com/amplitude-studios/humankind/forums/169-game-design-and-ideas/threads/54966-ideas-list-clearer-user-interface?page=1) ·
[Humankind closed beta UI/UX](https://community.amplitude-studios.com/amplitude-studios/humankind/forums/212-closed-beta/threads/40605-feedback-user-interface-and-user-experience?page=8) ·
[Humankind To Amplitude UI Team](https://community.amplitude-studios.com/amplitude-studios/humankind/forums/169-game-design-and-ideas/threads/51279-to-amplitude-ui-team)

**Total War: Warhammer III, Stellaris:** none (search budget exhausted; Section 12 is
unverified).
