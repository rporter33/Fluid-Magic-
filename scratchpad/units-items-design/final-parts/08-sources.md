## Sources

**Dominions 6 manual** (community transcription of the official manual):
- [Ch. 4, Units](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html): attributes,
  abilities explained on mouse-over, inventories, slots by body, standard items that return
- [Ch. 5, Movement](https://dmacguigan.github.io/dom6-manual/chapters/05-movement.html): turn
  order (items into the national inventory)
- [Ch. 6, Combat](https://dmacguigan.github.io/dom6-manual/chapters/06-combat.html) and its
  [source](https://raw.githubusercontent.com/dmacguigan/dom6-manual/main/chapters/06-combat.qmd)
  (read in `judge-1/dl/ch06-main.qmd`): size and squares, missiles weighted by size, gear
  composing defense, **repel only with a longer weapon**, resistance and weakness
- [Ch. 7, Magic](https://dmacguigan.github.io/dom6-manual/chapters/07-magic.html): Forge Item in
  a laboratory, MR and penetration
- [Ch. 10, Magic Items](https://dmacguigan.github.io/dom6-manual/chapters/10-magic-items.html):
  item analogs, unique artifacts
- [Ch. 11, Path Boosters](https://dmacguigan.github.io/dom6-manual/chapters/11-path-boosters.html)

**Dominions game data:**
- [dom6inspector gamedata](https://github.com/larzm42/dom6inspector/tree/master/gamedata) (units,
  weapons, armors, items, unit descriptions). Weapon lengths checked in `web/d6_weapons.csv`:
  Spear 3, Lance 3, Halberd 3, Long Spear 4, Pike 5.

**Dominions community** (search extracts unless marked; claims worded no stronger):
- [illwiki, Dom6 mounted](https://illwiki.com/dom5/dom6/mounted): riders and mounts as separate
  entities, the mount hit instead of the rider (search extract; verified by J2; the page
  refused this session's connection)
- [illwiki, items](https://illwiki.com/dom5/_export/xhtml/items): pickup chance of 30% to 75% by
  Construction level (verified by J2)
- [illwiki, Laboratory](https://illwiki.com/dom5/laboratory): labs and the treasury
- [illwiki, Dom6 magic](https://illwiki.com/dom5/dom6/magic): simultaneous artifact forging
- [Steam, Dom6 afflictions](https://steamcommunity.com/app/2511500/discussions/0/4203616776861027901)
- [Quarter to Three, Dominions 5 thread](https://forum.quartertothree.com/t/dominions-5-warriors-of-the-faith/131532?page=16)
  (handing items to many units)

**Other games:**
- Age of Wonders 4 data via [aow4db](https://github.com/minionsart/aow4db):
  [Abilities.json](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Abilities.json)
  (downloaded to `web-final/aow4_Abilities.json` and checked: "Polearm Unit" with "First Strike,
  Charge Resistance"; "Charge Resistance: Unaffected by the bonus effects of Charge attacks";
  a Shock Unit's charge "can be countered by Polearm Units"; Large Target), and
  [Units.json](https://raw.githubusercontent.com/MinionsArt/aow4db/main/Data/EN/Units.json)
- Heroes of Might and Magic III: [Combat](https://heroes.thelazy.net/index.php/Combat) (search
  extract: the victor takes the artifacts)
- Battle Brothers: [Dev Blog #34](https://battlebrothersgame.com/dev-blog-34-new-armor-helmet-rework-banners/)
  (search extract: looks must match stats); [paper doll module, Legends
  copy](https://raw.githubusercontent.com/Battle-Brothers-Legends/Legends-public/master/ui/screens/character/modules/character_screen_left_panel/character_screen_paperdoll_module.js)
- Civilization VI: [unitpanel.lua, CQUI copy](https://raw.githubusercontent.com/CQUI-Org/cqui/master/Assets/UI/Panels/unitpanel.lua)
  (the four-stat card budget; verified by J2)
- XCOM 2: [UISoldierHeader.uc](https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UISoldierHeader.uc),
  [UIArmory_Loadout.uc](https://raw.githubusercontent.com/X2CommunityCore/X2WOTCCommunityHighlander/master/X2WOTCCommunityHighlander/Src/XComGame/Classes/UIArmory_Loadout.uc)
  (deltas on stat rows; disabled items with reasons)
- Battle for Wesnoth: [reports.cpp](https://raw.githubusercontent.com/wesnoth/wesnoth/master/src/reports.cpp)
  (downloaded to `web-final/wesnoth_reports.cpp`: the " (inactive)" tooltip suffix at lines
  444, 1050 and 1090)
- Dropped since the draft: the Total War "lost, except legendary" claim (unverified, M20).

**Repository** (read only, commit `3addf97`): the docs and code listed at the top.

**Sibling designs:**
- `../pretender-design/final.md` (A.2 to A.6, A.10, A.11, E.2 to E.5, Docs text) and
  `../pretender-design/owner-answers.md`
- `../battle-design/final.md` (S1.3, S2.2, S2.5, S2.8, S4.4, S4.6, the `docs/04` and `docs/10`
  texts)
- `../ui-design/spec-final.md` (1.1 to 1.5, 2.8.2, 3.5, 5.1, 5.2, 6.4, 7, the `docs/07`,
  `docs/09` and `docs/10` texts)

**Judges:** `judge-1/` (`monolith.ts` and `.out.md`, `elder.ts` and `.out.md`,
`measure-rerun.md`) and `judge-2/p/` (`stack.ts` and `.out.md`, `goddeath.ts` and `.out.md`,
`m-rerun.out.md`).

**Research notes** beside this file: `research-dom-units.md`, `research-dom-items.md`,
`research-presentation.md`.

**Measurements:**
- `proto/` (the draft's copy with switches for U1, U3, U4, shields against arrows, and N2-style
  strikes): `measure.ts`, `measure-items.ts`, `measure-items2.ts` and their `*.out.md`;
- `final-measure/` (this final's copy, adding battle-start stat changes for item triggers):
  `final.ts`, `final2.ts`, `tree.ts`, `chk.ts`, and `final.out.md`, `final2.out.md`,
  `tree.out.md`;
- `calc/wound.py` (exact wound chances over the DRN distribution).
