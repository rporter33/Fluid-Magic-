
---

## Sources

Claims about other games come from the three research notes beside this file, which were
built from search-engine extracts and, for Dominions, from the manual and the game data read
in full. For this revision, web fetches were refused by the network policy (`www.w3.org`,
`w3c.github.io`, `lists.w3.org`), so the WCAG reading of R14 rests on judge 2's reading of the
Understanding page and its "relative luminance" reference; it is the stricter of the two
readings, so the rule is safe under either. A search confirmed the Gideon's Gaming wording.

- Dominions 6 manual (community web edition of the official manual):
  [ch. 3 The Pretender](https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html)
  (bless points, costs, incarnate, the god blessed in its dominion; transcribed in
  `web/m_main.qmd`), [ch. 4 Units](https://dmacguigan.github.io/dom6-manual/chapters/04-units.html),
  [ch. 8 Dominion](https://dmacguigan.github.io/dom6-manual/chapters/08-dominion.html).
- Dominions 6 data and tools: [dom6inspector game data](https://github.com/larzm42/dom6inspector/tree/master/gamedata),
  [Pretenders Calculator](https://github.com/zollqir/pretenders-dom6),
  [illwiki Bless](https://illwiki.com/dom5/dom6/bless) (the "5 or more" incarnate rule),
  [Steam: bless points thread](https://steamcommunity.com/app/2511500/discussions/0/4132682727127343168).
- Age of Wonders 4: [wiki Form](https://aow4.paradoxwikis.com/Form),
  [wiki Ruler](https://aow4.paradoxwikis.com/Ruler),
  [Dragon Dawn](https://www.paradoxinteractive.com/games/age-of-wonders-4/add-ons/age-of-wonders-4-dragon-dawn),
  [Wyvern Update notes (Random Ruler)](https://store.steampowered.com/news/app/1669000/view/7208622092879106175),
  [Dev Diary #11 via GameBanshee](https://www.gamebanshee.com/news/127487-age-of-wonders-4-developer-diary-11-art-design.html),
  [GamePressure faction creation](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c),
  [Gideon's Gaming review](https://gideonsgaming.com/age-of-wonders-4-review/) ("at the forefront"),
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
  [Total War spell types (alcasthq)](https://alcasthq.com/warhammer-lore-of-fire-magic-type),
  [Total War misleading vortex](https://steamcommunity.com/app/364360/discussions/0/351660338685393106),
  [WCAG 2.2, Understanding 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html),
  [WCAG 2.2 relative luminance](https://www.w3.org/WAI/WCAG22/Understanding/relative-luminance.html),
  [chromatic aberration complaints](https://thegameswiki.com/crimson-desert/wiki/chromatic-aberration),
  [PixiJS ParticleContainer v8](https://pixijs.com/blog/particlecontainer-v8).
- MTG color pie: [MTG Wiki, Color](https://mtg.fandom.com/wiki/Color).

Companion specs: `../battle-design/final.md` (S1.2 to S1.9, S2.2, S2.3, S2.7, S2.8, S2.10,
S2.11, S2.14, S3.2, S3.3, S4.4, S4.5, S6.1, S6.2 and its Spec text were read for this
revision) and `../ui-design/spec-final.md` (rulings 12 and 19, 1.1, 3.3, 5.4, 6.7, 7, 9.3 and its
Docs text).

Repository files read: `docs/00`, `02`, `03`, `04`, `05`, `08`, `09-art-direction`,
`09-balance`, `10`; `src/content/pretenders/*`, `src/content/units/{pretenders,common}.ts`,
`src/content/spells/{types,green}.ts`, `src/content/types.ts`, `src/content/rules.ts`,
`src/content/colors.ts`; `src/sim/{pretender,bless,commanders,tick,types,selectors}.ts`;
`src/sim/battle/{setup,morale,effects,spells,resolve,attacks,events,field,targets,types,apply}.ts`;
`tests/sim/battle/fixtures.ts`, `tests/content/colorMath.ts`.

Computed for this revision (`pretender-design/calc-final/`): `costs-final.mjs`,
`duel-final.ts`, `duel-mother.ts`, `aipower.ts`, `bless-bounds.mjs`,
`bless-bounds-percolor.mjs`, `sharecode-final.mjs`, `redflash-final.mjs`, `swatches.ts`,
`accent-search.ts`, each with its output. The judges' own reruns
(`judge1/mother.ts`, `judge2/duel2-rerun.md`, `judge2/redlin.mjs`) reproduce with these.
