# Research: the map as a war table in a tavern

Owner direction (2026-10-21, binding): "the overall map should be on an rustic wartable in a cozy
but natural tavern, nice oak wood" (`owner-direction.md` item 6). This file collects how games and
physical war tables present a strategy map as an object on a table in a room. It extracts patterns
for the design stage and checks the candidate palette against Fluid Magic's own color rules.

## Method and confidence

- **Access.** WebFetch could not resolve game or press hosts (ENOTFOUND). The proxy refused curl to
  them (403), as it did for the sibling research (`pretender-design/research-vfx.md`, "Method").
  Only GitHub and raw.githubusercontent.com opened. So every game claim comes from a search-engine
  extract: a lead, not a quote.
- **Tags:**
  - **[V]**: I opened the source: GitHub-hosted W3C, MDN and color data, the installed Pixi 8.22.0
    docs, and the repo's color math.
  - **[X]**: from a search extract.
  - **[calc]**: computed by the scripts in `tools/`, with outputs saved as `*.out`.
    `palette-check.ts` and `mana-collide.ts` import the repo's `tests/content/colorMath.ts`, the
    same CIEDE2000 and CVD code that `palette.test.ts` uses.
- **"→ FM:"** lines are my recommendations, not sourced claims. Where an extract did not say which
  page it came from, I list the candidates.

---

## 1. The twelve most useful findings (sources in the sections named)

1. **Paradox ships this frame.** Vic3 and CK3 put the far-zoom paper map on a table with objects. Some CK3 players turn the table off (2.9).
2. **The map stays flat.** CK3 will not curve its map, and Kriegsspiel left sand tables for flat maps (2.9, 3). → FM: depth lives in the room.
3. **Props can carry state.** Inscryption's scale and candles are life totals (2.2). → FM: props only mirror chrome state, because nothing may be zoom-gated (spec 2.10.2).
4. **A candle grade on the map breaks `palette.test.ts`.** 15% at 1900 K gives normal 19.9 and protan 11.3. A 30% vignette gives tritan 9.8 [calc] (4.3).
5. **Brass and candle colors nearly match mana colors.** ΔE 1.5 to Ember's accent and 3.8 to Radiance's secondary [calc] (5).
6. **Texture behind text costs legibility.** See Talisman, Inscryption, and Three Kingdoms dropping wooden panels (2.2, 2.7, 2.8).
7. **Fog can be "not yet drawn".** Shogun 2 drew unexplored land as charcoal on linen (2.8).
8. **The token is the data.** Columbia blocks show the enemy a blank back, and the RAF colored each plot by its age (3).
9. **Miniatures read through contrast,** with edge highlights and bases, not detail (3). → FM: keyline and banner rim; flat numbers.
10. **Cozy is safety, abundance and softness.** Inscryption turns the same props to dread with darkness (4.8).
11. **Ambient motion needs an off switch.** See Hearthstone complaints, the Game Accessibility Guidelines, and WCAG 2.3.3 on parallax (2.1, 4.7).
12. **Candle light is about 1850 K.** That gives #FF8100. A 2700 K room ambient gives #FFA757 [calc] (4.3).

---

## 2. Games, one by one

### 2.1 Hearthstone: the tavern board, and chrome that stays readable

- **Setting.** The tavern is "a warm and welcoming place full of laughter, camaraderie, and
  good-natured competition" ([X] https://investor.activision.com/node/22536).
- **UI as the game.** Ben Thompson called the interface "very realistic and very physical", unlike
  UIs that are a window onto the world. That is why art direction joins UI work early
  ([X] https://blizzardwatch.com/2015/08/04/blizzard-designed-hearthstones-tavern-brawl/, quoting
  IGN). The same page notes Tavern Brawl signals changed rules with a chalkboard and cork backing.
- **The board.** Thompson painted it and decided whether a board was needed at all. The game "feels
  like a board game ... played on a game board with a lot of gadgets"
  ([X] https://www.invenglobal.com/articles/1554/how-hearthstones-art-director-ben-thompson-breathed-life-into-hearthstone).
- **The box.** Sakamoto's GDC 2015 talk placed every UI element inside the game's "box"
  ([X] https://gdcvault.com/play/1022036/Hearthstone-How-to-Create-an;
  [X] https://mein-mmo.de/en/hearthstone-weg-zum-megahit063,32034/).
- **Corners.** The clickables provide "entertainment and distraction for the player during the
  opponent's turn". They are "purely cosmetic and do not affect gameplay", and the opponent never
  sees them ([X] https://hearthstone.wiki.gg/wiki/Battlefield). Examples include catapults, dragon
  eggs, gardens, and a hammer to sink in lava
  ([X] https://blizzardwatch.com/2015/04/17/hearthstones-blackrock-mountain-board-secrets-revealed).
  Repeated clicks unlock secrets
  ([X] https://esports.gg/news/hearthstone/festival-of-legends-hearthstone-board-secret-interactions).
- **Readability.** The gadgets sit in the corners, so the center stays clear for cards (my inference
  from the wiki). On phones the expanded hand covers most of the board
  ([X] https://toucharcade.com/2015/06/30/the-fretz-zone-my-big-beef-with-hearthstones-tiny-interface/).
  Players asked to speed up or disable animations
  ([X] https://us.forums.blizzard.com/en/hearthstone/t/abuse-of-animations/108732).
- → FM: props stay in the table margin, never on the sheet. A pinned "notice" (the chalkboard idea)
  can echo an alert but never replaces one.

### 2.2 Inscryption: the cabin table

- **Seat.** You play first person, facing Leshy across the table
  ([X] https://en.wikipedia.org/wiki/Inscryption). Most time is spent at the table over Leshy's map
  of the forest. You can rise and search the cabin
  ([X] https://www.gamepressure.com/games/inscryption/z960c0).
- **Props as state.** Damage is teeth on a scale, and five teeth past the opponent snuffs one of
  your two candles
  ([X] https://checkpointgaming.net/reviews/2021/10/inscryption-review-creepy-scary-brilliant/).
  A bell ends the turn ([X] https://katrinakostocenko.dlo3.bcfe.ie/gameplay-2/, a weak source). The
  physical edition reproduces the scale, teeth, brass bell and LED candles
  ([X] https://www.wargamer.com/inscryption-board-game/announced).
- **Player piece.** You are a figurine on Leshy's map
  ([X] https://inscryption.fandom.com/wiki/Act_I).
- **Mood.** The cabin is candle-lit, and the opponent shows only eyes and gnarled hands in the dark
  ([X] https://techraptor.net/gaming/previews/inscryption-makes-game-of-cards-creepy).
- **Cost.** The low resolution made card details hard to see, so the team dropped card text for
  icons ([X] https://www.gamedeveloper.com/design/how-game-jam-sacrifices-became-inscryption). The
  pixelation is a removable render effect
  ([X] https://thunderstore.io/c/inscryption/p/overfall/InscryptionHighRes/v/1.2.0/).
- → FM: props as mirrors of state: a dominion candle burning at the player's strength, a coin pile
  growing with gold. Skip the darkness and the low-resolution look.

### 2.3 Hand of Fate 1 and 2: the dealer's table

- **Movement.** The dealer lays cards face down, and your token moves one card at a time, turning
  each over ([X] https://en.wikipedia.org/wiki/Hand_of_Fate_(video_game)).
- **The table.** A review describes a big round wooden table
  ([X] https://www.player2.net.au/2015/03/hand-of-fate/ or
  https://thesixthaxis.com/2015/03/11/hand-of-fate-review; unclear which). The dealer's animations
  are "subtle" ([X] https://www.theaureview.com/games/games-review-hand-of-fate-xbox-one-2015/).
  The cards use a medieval engraving style
  ([X] https://www.moregamesplease.com/art-in-boardgames/2018/5/6/jesse-gillespie-art-in-board-games-36).
- **The seam.** In Hand of Fate 2, "dice, dungeons, and trinkets on the dealer's table set the stage
  well", but generic battlefield art breaks immersion
  ([X] https://gameinformer.com/games/hand_of_fate_2/b/pc/archive/2017/11/13/cutting-the-weak-cards-out-of-the-deck).
- → FM: fog lifting is "turning the card over". The seam is the risk for the battle replay
  (section 6, item 8).

### 2.4 Card Hunter: standees on a wooden table

- **The table.** Game tiles lie on a wood table, with cardstock figures in plastic stands
  ([X] https://www.pcgamer.com/card-hunter-review/).
- **Around the map.** Flat 2D maps, dice and "the odd cheese puff"
  ([X] https://www.avclub.com/card-hunter-review-browser;
  [X] https://www.destructoid.com/reviews/review-card-hunter/).
- **The frame.** You face Gary, a basement game master
  ([X] https://www.rpgfan.com/review/card-hunter/).
- → FM: a standee is the cheapest miniature that reads as an object, and it suits SVG sprites.

### 2.5 Armello, and 2.6 For The King

- **Armello.** The board is procedural 3D hex tiles with animated heroes
  ([X] https://store.steampowered.com/app/290340/armello). A day-night cycle "transforms the
  battlefield from deep greens to dark purples"
  ([X] https://www.engadget.com/2014-03-20-seen-gdc-a-board-game-on-an-ipad-complete-with-dice.html).
  Dangers rise and fall with it
  ([X] https://www.gameinformer.com/games/armello/b/ios/archive/2014/04/08/darkness-gathers-in-new-trailer.aspx).
  → FM: section 4.3 measures why a whole-board shift is harmful. If light marks a state, tint the
  room, not the sheet.
- **For The King.** The hexes feel like "one large board game"
  ([X] https://www.thumbculture.co.uk/?p=6156). The art is clean, simplified 3D
  ([X] https://gamecritics.com/aj-small/for-the-king-review/), chosen as a tribute to early 3D RPGs
  that a small team could build ([X] https://rpgamer.com/2018/03/for-the-king-interview/).

### 2.7 Digital board-game adaptations: Root, Wingspan, Talisman

- **Root** keeps Kyle Ferrin's art and animates events: dust-cloud fights, burning buildings
  ([X] https://spritesanddice.com/reviews/root-digital-review or
  https://www.geeksundergrace.com/gaming/review-root-2/; unclear which). A reviewer praised its
  "wondrously woodsy aesthetic"
  ([X] https://amostagreeablepastime.com/2021/11/26/root-review-the-board-game-retains-its-brilliance-in-the-switch-to-digital/).
- **Wingspan** was praised for "a layout that serves the experience of playing on a PC over
  mimicking the tabletop game" ([X] https://www.pcgamer.com/wingspan-review/). Its animations and
  music "make a laid-back game even better"
  ([X] https://toucharcade.com/2021/08/16/wingspan-review-iphone-ipad-ios-board-game-adaptation-monster-couch/).
- **Talisman Digital 5th** improved clarity "by denoising and dehazing the board artwork"
  ([X] https://steamdeckhq.com/news/talisman-digital-5th-edition-larger-text/).
- → FM: animate events, not idle loops, for example dust over a battle or smoke over a sacked
  province. Lay the screen out for a PC, with the table as the frame. docs/09's 10% noise over the
  fills is the haze budget.

### 2.8 Total War: campaign map framing

- **Tokens on paper.** Shogun and Medieval used an abstract map where "you move army tokens ...
  like you had a paper map in front of you"
  ([X] https://samplereality.com/gmu/hnrs353-001/?p=867, a forum-style page). Shogun (2000) used
  unit markers and an unrolled scroll. Shogun 2 replaced fog of war with a sketch map
  ([X] https://www.pcinvasion.com/new-shogun-2-total-war-screens-reveal-campaign-map/).
- **Unexplored land.** It was "broad charcoal strokes on linen describing mountains and woods",
  while explored land was 3D ([X] https://www.pcgamer.com/uk/shogun-2-total-war-campaign-impressions).
- **Chrome.** Three Kingdoms chose "a minimalist, modern approach instead of the detailed wooden
  panels of the Shogun games"
  ([X] https://gamesbeat.com/how-creative-assembly-conceived-the-art-for-total-war-three-kingdoms/).
- **Far zoom.** Warhammer III switches to a parchment map at high altitude, and mods move the
  threshold ([X] https://www.moddb.com/mods/improved-campaign-camera).
- → FM: Total War kept the paper map with tokens and dropped literal wood in its chrome: material in
  the world, restraint in the chrome.

### 2.9 Paradox: Crusader Kings III, Victoria 3, Imperator, EU5

- **CK3, Dev Diary #2.** The farthest zoom turns into "an actual paper map, allowing for an easy
  overview and stylish screenshots". The map "will stay flat", terrain reads without a tooltip,
  and rivers are easy to spot
  ([X] https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-2-the-medieval-map.1274052/).
- **CK3's table texture.** A graphics option turns off "the table texture on the zoomed-out map".
  Players asked for the old style "preferably without the table texture at all"
  ([X] https://steamcommunity.com/app/1158310/discussions/0/4300446114902084237).
- **CK3 mods.** They move the threshold (`FLAT_MAP_ZOOM_STEP`)
  ([X] https://steamcommunity.com/sharedfiles/filedetails/comments/2971618522). With
  "always paper map", one player lost sight of siege and army-gathering progress
  ([X] https://steamcommunity.com/sharedfiles/filedetails/comments/2235938497; likely attribution).
  Dev Diary #177, by art director Petter Lundh, refreshed the map
  ([X] https://admin-forum.paradoxplaza.com/forum/developer-diary/dev-diary-177-a-fresh-coat-of-paint.1854817/latest).
- **Victoria 3, Dev Diary #49.** The zoomed-out paper map, with many small illustrations, sits in "a
  scene of a table with objects around it that frames the view as a bird's-eye look at the world"
  ([X] https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-49-graphic-overview).
- **Victoria 3 extras.** The Dawn of Wonder pack adds desk decorations at far zoom
  ([X] https://www.instant-gaming.com/en/14904-buy-victoria-3-dawn-of-wonder-pc-mac-game-steam/).
  A mod strips the paper folds and noise
  ([X] https://steamcommunity.com/sharedfiles/filedetails/changelog/2897798256?l=russian).
- **Victoria 3's living map.** Hubs expand as cities grow, and vehicles travel the map
  ([X] DD #50, https://admin-forum.paradoxplaza.com/forum/developer-diary/victoria-3-dev-diary-50-living-map.1531318).
  Roads were prototyped to upgrade from dirt to paved
  ([X] DD #70, https://www.paradoxinteractive.com/games/victoria-3/news/victoria-3-dev-diary-70-feature-game-jam-pt2).
- **Imperator and EU5.** No source on a table frame was found (gap).
- → FM: this is the closest precedent: decorations as a cosmetic layer that some players turn off.
  CK3's mod complaint shows the cost of information gated by zoom. Vic3's growing hubs and roads
  also inform the owner's "growth over time" item.

### 2.10 War rooms and boards in other games

- **Dragon Age: Inquisition.** Operations are "markers on a worn map". A marker flashes when its
  report is ready, and advisors stand around the table
  ([X] https://www.pcgamer.com/dragon-age-inquisition-hands-on-fine-fantasy/2;
  [X] https://gamebanshee.com/kur69). Small operations exist only as markers, which made the world
  feel alive
  ([X] https://kotaku.com/dragon-age-inquisition-s-war-table-brought-the-wider-w-1823169693).
- **Gwent: Homecoming** tilted its board toward MTG Arena's angle and made the leaders 3D models
  ([X] https://techraptor.net/gaming/news/cd-projekt-red-shows-first-look-at-gwent-homecoming).
- **Wartales, "The Tavern Opens".** You furnish the tavern with the camp tools, and decor earns
  prestige ([X] https://www.pcgamesn.com/wartales/the-tavern-opens). A review describes a warm,
  rowdy room with a lute ([X] https://www.gaming.net/fr/reviews/wartales-the-tavern-opens-review-pc/).
- **No table frame found** for BFME2's War of the Ring
  ([X] https://en.wikipedia.org/wiki/The_Lord_of_the_Rings:_The_Battle_for_Middle-earth_II),
  digital Gloomhaven ([X] https://www.cephalofair.com/2018/08/the-big-announcements.html),
  Stronghold ([X] https://en.wikipedia.org/wiki/Stronghold_(2001_video_game)) or Expeditions: Rome
  ([X] https://community.expeditionsseries.com/index/dev-diaries/devdiary-5-metagame-legion-battles-r11).
  These are gaps, not evidence of absence.
- → FM: Dragon Age's marker that flashes when something is waiting matches our alerts row. A
  wax-sealed letter on a token pulses twice, as docs/09 allows for Urgent alerts. Decorating the
  tavern over the game (as in Wartales) is a later idea, outside M1.

---

## 3. Physical references

- **Kriegsspiel.**
  - The elder Reisswitz sculpted damp sand on a table with wooden blocks for formations. His 1812
    version was a wooden table-cabinet with a folding board.
  - The 1824 game dropped 3D terrain for flat, up-to-date maps
    ([X] https://en.wikipedia.org/wiki/Kriegsspiel).
  - Sources disagree on the pieces (blocks, or tin or porcelain figures) but agree on red and blue
    sides ([X] https://militaryhistorynow.com/2019/04/19/kriegsspiel-how-a-19th-century-war-game-changed-history/).
- **Columbia Games blocks.**
  - Units are wooden blocks marked on one side, standing toward their owner, so "the opposing
    player only sees a blank back" ([X] https://en.wikipedia.org/wiki/Hammer_of_the_Scots_(board_game)).
  - A hit rotates a block to the next lower strength, allowing up to four steps
    ([X] https://en.wikipedia.org/wiki/Block_wargame;
    [X] https://columbiagames.com/columbiablocksystem/hammer-of-the-scots-strategy-board-game/).
  - → FM: an unscouted enemy shows its "back": the allegiance shape, the banner and docs/01 §14's
    strength word. Scouting "turns it round" to the exact number, matching spec 2.10.6's fog band.
- **RAF plotting table (1940).**
  - Flagged blocks were pushed into place to show squadrons
    ([X] https://www.subbrit.org.uk/sites/uxbridge-battle-of-britain-ops-room/).
  - Wooden markers and croupier sticks gave way to metal markers and magnetic sticks in December
    1940 ([X] https://en.wikipedia.org/wiki/Battle_of_Britain_Bunker).
  - The sector clock ran in five-minute color bands. Each plot took the current color, so its age
    showed at a glance ([X] https://en.wikipedia.org/wiki/Plotter_(RAF)). Accounts differ on the
    exact colors.
  - → FM: a "last seen" marker that fades by age is possible. It is new, so the design stage
    rules on it.
- **Churchill War Rooms, Map Room.** Colored pins and wool thread tracked convoys, and the
  pinholes survive ([X] https://www.iwm.org.uk/events/cabinet-war-rooms-map-room). → FM: brass pins
  and thread for path previews and waypoints (spec 2.10.5).
- **Campaign furniture.**
  - Recessed brass swivel handles, brass angle pieces guarding the corners, and feet that come off
    for travel ([X] https://www.britannica.com/print/article/91110).
  - Flush handles so nothing snags
    ([X] https://westontable.com/products/vintage-19th-century-english-campaign-chest-of-drawers).
  - → FM: brass is hardware at corners, never behind text.
- **Painted miniatures.**
  - "Tabletop standard" is judged from about three feet, so colors are pushed brighter or darker
    ([X] https://miniwargaming.com/content/table-top-standard-a-look-into-the-spectrum-of-miniature-painting).
  - A thin, brighter edge line makes the shape clearer from a distance
    ([X] https://thearmypainter.com/blogs/explore/what-is-edge-highlighting).
  - The baseline is three colors and a base
    ([X] https://www.dakkadakka.com/dakkaforum/posts/list/545859.page).
- **Oak.**
  - Quarter-sawn white oak shows bolder ray fleck than red oak (about 1 inch against 1/4 to 1/2
    inch). The two cannot be told apart by color alone; red oak has a reddish tinge.
  - White oak fumes well (high tannin) and ages to "a tawny patina". Linseed oil brings out figure
    more than varnish
    ([X] https://www.finewoodworking.com/2007/11/01/whats-the-difference-white-oak-vs-red-oak;
    [X] https://woodweb.com/knowledge_base/Choosing_Between_Red_Oak_and_White_Oak.html;
    [X] https://www.woodworkingnetwork.com/knowledge-center/wood-dr/what-difference-between-red-oak-and-white-oak;
    the extract mixed these).
  - → FM: "nice oak" means oiled, quarter-sawn white oak: tawny grey-gold, straight grain, silvery
    fleck, darker end grain, worn edges. Avoid orange "golden oak" stain (ΔE 19.5 from Ember's
    primary [calc]).

---

## 4. Patterns, by question

### 4.1 The table edge: visible far out, gone up close

- **Precedent.** Vic3 and CK3 show the table only at the farthest zoom. Total War and CK3 switch to a
  flat map past a camera height that mods can move (2.8, 2.9).
- **What differs here.** Our map already is the flat sheet at every zoom, so the table can sit
  under it in world space. The camera does the work: at fit zoom the margins show oak, and zooming
  in pushes the edges off screen. There is no cross-fade, no second map and no threshold.
- → FM:
  - Allow zooming slightly below fit ("lean back") to show a band of table with props. Clamp panning
    so no more than that band shows.
  - Spec 2.10.3's fit (about 110 px per province, Medium map, 1280x720) fits the **sheet**. The
    table never shrinks the map.
  - docs/09 fades parchment #E8DCC2 toward #1C1A17 "under the UI". Replace that with a real sheet
    edge: deckled parchment with a soft contact shadow on oak. The dark falloff moves to the room.

### 4.2 Camera tilt and depth of field

- **Tilt.** CK3 stays flat (2.9), Gwent tilted (2.10), and Hand of Fate and Inscryption seat you at
  the table (2.2, 2.3). Tilting a 2D Pixi map distorts the Voronoi shapes, label boxes and hit
  areas, and breaks the `layoutMapLabels` overlap test (spec 2.10.3). → FM: the sheet stays
  orthographic. Draw the backdrop art in perspective (far table edge, a bench, the hearth).
- **Depth of field.** Tilt-shift keeps a band sharp and blurs the rest as a post-process with no
  depth buffer ([X] https://luma.gl/docs/api-reference/shadertools/shader-passes/tilt-shift). An
  RTS prototype listed a lower frame rate and a "distracted player" as its costs
  ([X] https://brycekerrabraham.myportfolio.com/final-project). Guides advise a low blur
  ([X] https://learn.zoner.com/the-tilt-shift-effect-make-it-mini/).
- **Pixi cost** ([V] `/home/user/Fluid-Magic-/node_modules/pixi.js/skills/pixijs-performance/SKILL.md`,
  "Filters and masks cost"). `BlurFilter` padding pushes full-screen filter textures up to the next
  power of two, and `repeatEdgePixels: true` avoids that. `filterArea` saves a per-frame bounds walk.
  The blur options are `strength`, `quality` and `kernelSize`
  ([V] `node_modules/pixi.js/lib/filters/defaults/blur/BlurFilter.d.ts`).
- → FM: the depth of field lives in the art. The room is a pre-blurred raster and the table rim a
  fixed gradient. No runtime blur touches the map, labels or badges, which is free per frame and
  cannot flicker.

### 4.3 Warm candlelight, vignette, hearth glow

- **Candle temperature.** Sources give 1850 K
  ([X] https://renderman.pixar.com/resources/RenderMan_20/PxrBlackbody.html), 1900 K
  ([X] https://glossar.item24.com/en/glossary-index/article/item//colour-temperature.html), or a
  range of 1800 to 2900 K ([X] https://cameo.mfa.org/wiki/Color_temperature). Below about 1900 K
  the blackbody's blue channel is negative in linear sRGB
  ([V] https://github.com/zubetto/BlackBodyRadiation).
- **Helland approximation** [calc], constants checked against
  [V] https://raw.githubusercontent.com/brundagejoe/ColorTemperatureConverter/main/ColorTempConverter.py:
  1500 K #FF6C00 (coals), 1850 K #FF8100 (flame core), 1900 K #FF8400 (candle light), 2000 K #FF890E
  (hearth), 2400 K #FF9B3D (lamp-lit wood), 2700 K #FFA757 (room ambient), 3000 K #FFB16E (lamp-lit
  parchment).
- **Vignette.** Engine docs describe it as edge shading that pulls focus to the center and sets
  mood ([X] https://doc.qu1x.dev/bevy_trackball/bevy/post_process/effect_stack/struct.Vignette.html;
  [X] https://docs.phaser.io/api-documentation/class/fx-vignette). None addressed legibility, so I
  measured it.

**What a grade does to the terrain palette** [calc] (`tools/palette-check.out`). The figures are the
smallest pairwise CIEDE2000 among the seven terrain fills. `palette.test.ts` needs 20 for normal
vision and 12 under each deficiency.

| Treatment of the fills | normal | protan | deutan | tritan | Passes |
|---|---|---|---|---|---|
| none (current) | 22.3 | 14.9 | 14.8 | 14.8 | yes |
| multiply 1900 K at 8% | 21.1 | 13.0 | 13.2 | 14.6 | yes |
| multiply 1900 K at 15% | 19.9 | 11.3 | 12.0 | 14.2 | **no** |
| multiply 2700 K at 15% | 20.8 | 12.9 | 13.0 | 14.3 | yes |
| multiply 2700 K at 25% | 19.7 | 11.3 | 11.9 | 14.0 | **no** |
| darken 15% (vignette corner) | 20.8 | 12.8 | 14.1 | 12.7 | yes |
| darken 30% | 18.0 | 11.4 | 13.3 | 9.8 | **no** |

→ FM:
- Warm light falls on the room and table. The sheet reads as lit by neutral daylight ("natural": a
  window as well as a hearth).
- Any cast on the sheet stays at or under 8% of 1900 K (or 15% of 2700 K), with at most 15% corner
  darkening. `palette.test.ts` should test the graded fills, since that is what is drawn.
- Hearth glow is a slow, small brightness change on the backdrop only.

### 4.4 Props: decorative, interactive, informational

| Kind | Precedent | Risk | → FM |
|---|---|---|---|
| Decorative | Vic3's desk objects, CK3's table (2.9) | clutter; some want it off | tankard, candle stub, dice, quill and inkpot, folded letter; placed in the margin by a render-side hash of the game seed |
| Interactive, cosmetic | Hearthstone's corners (2.1) | a time sink | at most 2 or 3 (roll the dice, pinch the candle, clink the tankard); never on the sheet |
| Informational | Inscryption's scale and candles (2.2); DA:I's flashing markers (2.10) | zoom-gated information | a mirror only: dominion candle height, coin pile by gold, an hourglass for clock speed |

### 4.5 Armies as miniatures or tokens that stay legible

- **Precedents:** standees on bases (Card Hunter, 2.4), one figurine per party (Inscryption, Hand of
  Fate), tokens on a paper map (early Total War, 2.8), a blank back for hidden units and color as age
  (Columbia and the RAF, 3), and pushed contrast with bases (miniatures, 3).
- → FM:
  - **Shapes.** Keep spec 2.10.4's allegiance shapes (rounded own, notched nations, plain
    independents) and add materials: painted wood for nations, pewter for independents. Pewter
    #91A092 sits ΔE 10 from the Independents grey #8C8A80 [calc], so material and faction agree.
  - **Numbers and shadow.** Numbers sit on unlit plates. Contact shadows are fixed soft ellipses.
  - **Standees.** At Near zoom an optional standee shows the lead commander's docs/09 SVG on an oval
    base with a banner rim. At Far zoom only the token remains.

### 4.6 Chrome harmony: wood, leather, parchment and brass, with readable text

- **Binding.** docs/09 "UI chrome" sets dark neutral panels, #F4EEDF text and no mana colors in
  chrome. WCAG asks 4.5:1 for text and 3:1 for meaningful graphics and control edges
  ([V] https://raw.githubusercontent.com/w3c/wcag/main/understanding/20/contrast-minimum.html;
  [V] https://raw.githubusercontent.com/w3c/wcag/main/understanding/21/non-text-contrast.html).
- **Measured** [calc] (text #F4EEDF, ink #1C1A17):
  - text fails on light and mid oak (Light Oak 1.75, Rich Oak 2.95, Golden Oak 3.80);
  - text passes on dark oak (Oak Plank 6.86, Heritage Oak 7.64, Dark Walnut 7.92);
  - ink passes on light oak and parchment (Light Oak 8.56, Rich Oak 5.08, #E8DCC2 12.77);
  - a brass keyline on #1C1A17 needs bright brass (Brass Buttons 8.39, Bronzed Brass 4.54; Antique
    Brass 2.09 fails);
  - Leather #906A54 fails with both text colors (3.62 and 4.15).
- **Precedents.** Total War went from wood panels to minimal ink (2.8), and Talisman de-noised its
  board (2.7). Skeuomorphic ornament draws the known criticism that it "oversteps its intended
  purpose ... and in some cases actually causes confusion"
  ([X] https://www.fastcompany.com/1670760/will-apples-tacky-software-design-philosophy-cause-a-revolt).
- → FM:
  - Panels keep the `--chrome-*` tokens. #1C1A17 is already a warm near-black (R > G > B).
  - Material appears in four places only:
    1. an optional 1 px bright-brass keyline;
    2. brass corner brackets on docks and modals;
    3. a dark-oak top-bar frame, with text at over 6.8:1;
    4. parchment cards and tooltips with ink text.
  - Leather is for spines and borders only.

### 4.7 Ambient motion and reduced motion

- **WCAG 2.3.3.** Non-essential motion triggered by interaction can cause vestibular reactions.
  Parallax is the standard example, and honoring the OS reduce-motion setting is one valid fix
  ([V] https://raw.githubusercontent.com/w3c/wcag/main/understanding/21/animation-from-interactions.html).
- **WCAG 2.2.2.** Let users control moving content that starts on its own alongside other content
  ([V] https://raw.githubusercontent.com/w3c/wcag/main/understanding/20/pause-stop-hide.html).
- **WCAG 2.3.1.** No more than three flashes per second, with a stricter test for saturated red
  ([V] https://raw.githubusercontent.com/w3c/wcag/main/understanding/20/three-flashes-or-below-threshold.html).
- **MDN.** `prefers-reduced-motion: reduce` asks to remove, reduce or replace motion. "Scaling or
  panning large objects" is a known trigger
  ([V] https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/css/reference/at-rules/@media/prefers-reduced-motion/index.md).
- **Game Accessibility Guidelines.** Offer an option to turn off or hide background movement
  ([X] https://gameaccessibilityguidelines.com/intermediate/).
- → FM:
  - **Ambience.** Candle flames change brightness by a few percent and never flash. The hearth glow
    runs over several seconds. A rare dust mote drifts in a sunbeam. The room has no parallax.
  - **Reduced motion** (the OS setting or a toggle) freezes flame and glow at their mean and removes
    the motes. docs/09's list (pulse, idle bob, UI tweens) gains "table ambience".
  - **Settings** gain "Table: Full / Simple / Off". Simple is static oak without props. Off is a
    plain dark backdrop, as CK3 allows.

### 4.8 Cozy but natural

- **Coziness** is the fantasy of safety, abundance and softness
  ([X] https://80.lv/articles/using-coziness-in-game-design;
  [X] https://pixelpoppers.com/link/d64e95/group-report-coziness-in-games-an-exploration-of-safety-softness-and-satisfied-needs/).
- **Precedents.** Hearthstone's tavern is warm and welcoming (2.1), Root is woodsy and Wingspan
  laid-back (2.7). Inscryption turns similar props to dread with darkness (2.2).
- → FM:
  - **Natural:** real materials (oiled oak, wax, pewter, linen, iron, stone), daylight from a window
    as well as firelight, and wood grain instead of stain.
  - **Cozy:** the room is fully lit, the hearth is glimpsed rather than glaring, and nothing looms in
    the dark around the table.

---

## 5. Palette ranges: oak, brass, pewter, candle

Names and hex values come from the open color-name list
([V] https://raw.githubusercontent.com/meodai/color-names/main/src/colornames.csv). Contrast is
[calc], with "text" #F4EEDF and "ink" #1C1A17.

| Role | Range, light to dark | Text on it | Ink on it | Use |
|---|---|---|---|---|
| Light oak (lit top, sheet rim) | Oak Shaving #EED8C2 · Light Oak #D2B183 · Oak Buff #CF9C63 · White Oak #CE9F6F · French Oak #BB9E7C | 1.19 to 2.19 ✗ | 6.86 to 12.60 | where light falls |
| Mid oak (table body) | River Oak #AE9474 · Limed Oak #AC8A56 · Rich Oak #A7855A · Renwick Golden Oak #96724C · Library Oak #8F7459 · Quartersawn Oak #85695B | 2.49 to 4.35 ✗ | 3.45 to 6.03 | grain, fleck, props; **no text** |
| Dark oak (edges, end grain, top-bar frame) | Oak Barrel #715636 · Cummings Oak #695A45 · Oak Plank #5D4F39 · Heritage Oak #5C453D · Dark Walnut #56443E | 5.76 to 7.92 | 1.90 to 2.60 | light text passes 4.5:1 |
| Room shadow | Black Chestnut Oak #252321 · chrome-0 #1C1A17 | 13.5 to 15.0 | — | joins the chrome |
| Bright brass (keylines, pins, brackets) | Brass Nail #DBBD76 · Brass Buttons #DFAC4C · Brass #B5A642 | — | 7.03 to 9.55 | at least 3:1 on chrome-0 |
| Aged brass (hardware shadow side) | Brass Yellow #B58735 · Bronzed Brass #9B7E4E · Tarnished Brass #7F6C24 · Antique Brass #6C461F | — | 2.09 to 5.36 | only beside bright brass |
| Pewter (independent tokens, tankards) | Pewter Vase #CECECB · Pewter Tankard #A39B90 · Pewter #91A092 · Aged Pewter #889999 · Burnished Pewter #716A62 · Dark Pewter #606865 | 1.36 to 4.95 | 3.03 to 11.01 | near the Independents grey, on purpose |
| Candle and fire (light, not paint) | 1850 K #FF8100 · 1900 K #FF8400 · 2000 K #FF890E · 2700 K #FFA757 · Candle Glow #FFE8C3 · Beeswax #E9D7AB | — | — | additive glow or low-alpha multiply, on room and table only |
| Leather (spines, borders) | Leather #906A54 · Saddle Brown #8B4513 | 4.15 / 6.13 | 3.62 / 2.45 | no text on #906A54 |

**Clashes with mana colors** [calc] (`tools/mana-collide.out`, CIEDE2000, normal vision):

| Warm tone | Nearest mana color | ΔE |
|---|---|---|
| Carolling Candlelight #FFB850 | R Ember accent #FFB347 | 1.5 |
| Brass Nail #DBBD76 | W Radiance secondary #D9B85C | 3.8 |
| Candle Glow #FFE8C3 | W Radiance primary #F3E6B8 | 5.2 |
| Brass Buttons #DFAC4C | W Radiance secondary #D9B85C | 5.6 |
| 2700 K #FFA757 | R Ember accent #FFB347 | 7.0 |
| Brass #B5A642 | W Radiance secondary #D9B85C | 8.1 |
| Light Oak #D2B183 | W Radiance secondary #D9B85C | 9.4 |

→ FM:
- The mana glyph carries identity (docs/09). Brass pins and candle highlights never sit next to a
  mana symbol, and never take a disc or drop shape.
- Radiance and Ember spell effects need a neutral sheet behind them, one more reason to keep the
  grade off the map.

---

## 6. What this means for Fluid Magic (input to the design stage)

1. **Draw order.** Spec 2.10.1 gains four layers under "Parchment background":
   - 0a, the room backdrop: a pre-blurred perspective raster with hearth glow, and a good target for
     owner-made art (art-inbox/);
   - 0b, the oak top: a seamless quarter-sawn texture;
   - 0c, margin props;
   - 0d, the sheet's edge and contact shadow.
   Layers 1 to 13 are unchanged. Labels, badges and selection never take room lighting.
2. **Zoom.** The table appears because the camera can lean back slightly past fit. It is not a
   separate mode. Clamps cap how much table is visible, and nothing lives on the table alone.
3. **Fog fiction.** Unexplored land is "not yet drawn": charcoal hatching on bare sheet, over spec
   2.10.7's haze and dotted border.
4. **Tokens.** Allegiance shapes in wood (nations) or pewter (independents). Numbers on flat plates.
   Optional standees at Near zoom. Paths drawn as brass pins and thread.
5. **Light.** Warm on the room and table, neutral on the sheet. Any grade on the sheet stays within
   the measured caps, and the palette test checks what is drawn.
6. **Chrome.** Tokens unchanged. Material appears as bright-brass keylines, corner brackets and a
   dark-oak top-bar frame. No text on mid oak or mid leather.
7. **Motion.** Slow ambience led by events. Reduced motion freezes it. Settings gain "Table: Full /
   Simple / Off".
8. **Battle replay.** `battle-design/final.md` keeps its terrain backdrops. To avoid Hand of Fate 2's
   seam, the replay modal shares the oak and brass hardware.
9. **Stability.** Prop placement, grain offset and flicker phase come from a render-side hash of the
   game seed and a fixed clock. They never touch `state.rng` and never change between reloads
   (CLAUDE.md, docs/06).
10. **Cost.** No runtime blur. Static layers use `cacheAsTexture`
    ([V] `node_modules/pixi.js/skills/pixijs-performance/SKILL.md`). Multiply is a built-in blend
    mode. Overlay and soft light need `pixi.js/advanced-blend-modes`, which are filter-based and
    cost more ([V] `node_modules/pixi.js/skills/pixijs-blend-modes/SKILL.md`).

## 7. Gaps and things not verified

- **Not found:** Hearthstone sources on a plain play area or board lighting; Inscryption's camera and
  depth of field; Hand of Fate's lighting; Armello's board edge; any table in Stronghold, Expeditions:
  Rome, Imperator, EU5, Gloomhaven or Root; Wartales' tavern art beyond review captions.
- **Unopened:** every game URL is a search extract. The pages most worth opening by hand are Vic3 DD #49
  and #50 and CK3 DD #2.
- **Approximate colors:** the color names are community vocabulary. The candle hex values come from
  Helland's photo-editing approximation, which is not scientific by its author's account
  ([X] https://tannerhelland.com/2012/09/18/convert-temperature-rgb-algorithm-code.html).
