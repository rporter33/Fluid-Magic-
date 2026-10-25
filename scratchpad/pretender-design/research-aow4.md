# Research: Age of Wonders 4 customization, and what Fluid Magic should take from it

Scope: Age of Wonders 4 (AoW4) ruler creation, faction creation, the editor UX, the line
between cosmetic and mechanical choices, and what players praise and criticize. The second
half distills a customization model for Fluid Magic's 2D SVG pretender (docs/05, docs/09).

**Method and confidence.** WebFetch could not reach any host from this session (DNS and
proxy refusals), so every finding below comes from search-engine extracts of the cited
pages, not from reading them in full. Each claim names its source and how far to trust it:
**wiki** (AoW4 Paradox wiki), **official** (Paradox news, patch notes, store pages),
**review** (press), **forum** (Steam or Paradox forum posts: anecdotal, often dated
2023). Counts that no source gives are marked "not found" instead of guessed. Coverage runs
through Thrones of Blood (Nov 2025) plus announced Expansion Pass 4 content.

---

## Part 1. Findings

### 1.1 The layers at a glance

AoW4 builds a faction from about eight small menus, and the variety comes from multiplying
them. The table lists each layer, its size, and whether it is mechanical.

| Layer | Options (count) | Mechanical? | Source |
|-------|-----------------|-------------|--------|
| Ruler type (origin) | Champion, Wizard King (base); Dragon Lord, Eldritch Sovereign, Giant King, Vampire (DLC): 6; a Fey lord is announced for Q1 2027 | Yes: skill tree, start ability, item rules | wiki [Ruler](https://aow4.paradoxwikis.com/Ruler); official [Thrones of Blood](https://www.paradoxinteractive.com/media/press-releases/press-release/dominate-the-realms-in-thrones-of-blood-for-age-of-wonders-4-today); store [Expansion Pass 4](https://store.epicgames.com/p/age-of-wonders-4--expansion-pass-4) |
| Ruler class | 9: Warrior, Defender, Ranger, Elementalist, Ritualist, Warlock, Death Knight, Spellblade, Battlesaint, with limits per type | Yes | wiki [Ruler](https://aow4.paradoxwikis.com/Ruler) |
| Sub-type of a monster ruler | Dragon: 6 affinity attunements; Giant: 4 clans (Fire, Frost, Storm, Rock) | Yes: damage type, terrain | official [Dragon Dawn](https://www.paradoxinteractive.com/games/age-of-wonders-4/add-ons/age-of-wonders-4-dragon-dawn); wiki [Giant King](https://aow4.paradoxwikis.com/Giant_King) |
| Ruler appearance | per-type slot sets (1.3) | No, except mount and weapon | wiki [Faction](https://aow4.paradoxwikis.com/index.php?mobileaction=toggle_view_desktop&title=Faction) |
| Form (the people's body) | 10 base; 9 more from DLC; 2 more in Archon Prophecy: 21 | **No: purely cosmetic** | review [Game Rant](https://gamerant.com/age-of-wonders-4-faction-creation-guide/); [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/AgeOfWonders4); official [Archon Prophecy](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/archon-prophecy-and-griffon-update-out-now) |
| Form traits | 36 at launch; point-buy, 5 points; Flaws (2025) give points back | Yes | review [Game Rant](https://gamerant.com/age-of-wonders-4-faction-creation-guide/); [RPGGamers](https://rpggamers.com/news/griffon-update-adds-flaws-to-age-of-wonders-4); forum [5-point cap](https://steamcommunity.com/app/1669000/discussions/0/839501827476043663/) |
| Culture | 6 base (Barbarian, Dark, Feudal, High, Industrious, Mystic), more from DLC (e.g. Architects) | Yes, and it sets unit and Champion looks | review [Magic Game World](https://www.magicgameworld.com/age-of-wonders-4-faction-creation-and-customization-guide/); wiki [Culture](https://aow4.paradoxwikis.com/Culture) |
| Society traits | pick 2 of 18, 3 per affinity; some exclude others | Yes | review [Game Rant](https://gamerant.com/age-of-wonders-4-faction-creation-guide/); [GamePressure](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c) |
| Starting tome | one tier-1 tome; each adds affinity | Yes | review [GameWatcher](https://www.gamewatcher.com/age-of-wonders-4/guides/best-tomes-and-tiers) |
| Banner | an icon plus primary and secondary colors; armor colored separately | No | forum [banner question](https://steamcommunity.com/app/1669000/discussions/0/5796736618333403553/) |
| Identity | ruler name, title, pronouns, faction name, throne city name, generated description and history | No | wiki [Ruler](https://aow4.paradoxwikis.com/Ruler); review [GamePressure](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c) |
| AI behavior | ambition; AI personality (2 likes, 2 dislikes, 4 strategies, 6 archetypes), under Advanced Settings since 2025 | Yes, only when the AI plays the faction | wiki [AI personality](https://aow4.paradoxwikis.com/AI_personality); official [Griffon Update](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/archon-prophecy-and-griffon-update-out-now) |

**For Fluid Magic.** The layer count is already comparable. Chassis is like ruler type,
pips are like tomes and affinity, the five Scales are like society traits, and dominion
and awakening have no AoW4 equivalent. What Fluid Magic lacks is everything in the "No"
rows: appearance, banner identity, names, and generated lore. The shortfall against "AoW4
level" is on the cosmetic side, not the mechanical one.

### 1.2 Ruler types: one mechanical identity, and its own cosmetic kit

- **Champion and Wizard King** (base). Champions start with the Command skill. Their
  starting weapon depends on the culture, and so does their clothing. Wizard Kings start
  with Channeling Ritual and have "their own unique selection of starting weapons and
  outfits" (wiki [Ruler](https://aow4.paradoxwikis.com/Ruler),
  [Faction](https://aow4.paradoxwikis.com/index.php?mobileaction=toggle_view_desktop&title=Faction)).
  A Wizard King can have a different form from its people (forum
  [thread](https://steamcommunity.com/app/1669000/discussions/0/3828666283440902301)).
- **Dragon Lord** (Dragon Dawn, 2023). The player picks a draconic type and a claw type at
  creation (wiki [Ruler](https://aow4.paradoxwikis.com/Ruler)). There are 6 affinity
  attunements, and each sets the damage of the breath and claws (official
  [Dragon Dawn](https://www.paradoxinteractive.com/games/age-of-wonders-4/add-ons/age-of-wonders-4-dragon-dawn);
  review [Gideon's Gaming](https://gideonsgaming.com/age-of-wonders-4-dragon-dawn-review/)).
  Its signature skills include minor and major transformations, which forum players place
  at levels 4 and 12 (anecdotal; forum via
  [MMORPG review](https://www.mmorpg.com/reviews/age-of-wonders-4-dragon-dawn-review-strategy-session-2000128239)).
  Appearance can be edited "from snout to tail", and the reviewer calls the poses "great,
  if also somewhat limited" (review
  [MMORPG](https://www.mmorpg.com/reviews/age-of-wonders-4-dragon-dawn-review-strategy-session-2000128239)).
- **Eldritch Sovereign** (Eldritch Realms, 2024). It has no outfits but has its own sliders
  (wiki [Faction](https://aow4.paradoxwikis.com/index.php?mobileaction=toggle_view_desktop&title=Faction)).
  Head styles include Cthulhu-like face tentacles, human, undead, and insectoid (review
  [Gideon's Gaming](https://gideonsgaming.com/age-of-wonders-4-eldritch-realms-review/)).
  Wings range from bird and bat wings to "grotesque fleshy limbs covered in eyeballs", and
  halos come in metal or bone. Many of its parts are animated, "constantly squinting and
  glancing in random directions" (fan wiki
  [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Characters/AgeOfWonders4)). One player
  calls it "possibly the most customizable ruler type" (forum
  [thread](https://steamcommunity.com/app/1669000/discussions/0/4333105050949780634/?ctp=2)).
  Its pronoun choice launched without "it" (forum
  [thread](https://steamcommunity.com/app/1669000/discussions/0/4548155824440762289/)).
- **Giant King** (Giant Kings, Apr 2025). There are 4 clans, and the type cannot change
  mid-game. Giants use only giant weapons and cannot equip mounts (wiki
  [Giant King](https://aow4.paradoxwikis.com/Giant_King)). They can terraform and use the
  Item Forge from the start (store
  [Epic](https://store.epicgames.com/p/age-of-wonders-4--giant-kings)). Players say there
  "simply aren't enough cosmetic options for Giant Kings" (forum
  [thread](https://steamcommunity.com/app/1669000/discussions/0/596271495257278373/)).
- **Vampire** (Thrones of Blood, Nov 2025). It has its own skill tree, and its castle
  replaces the Wizard Tower (official
  [press release](https://www.paradoxinteractive.com/media/press-releases/press-release/dominate-the-realms-in-thrones-of-blood-for-age-of-wonders-4-today)).
  I found no source on its cosmetics.
- **Class limits per type.** Dragon Lords and Giant Kings cannot be Rangers. Eldritch
  Sovereigns may only be Elementalist, Ritualist, Warlock, or Battlesaint (wiki
  [Ruler](https://aow4.paradoxwikis.com/Ruler)).
- **Signature skills** unlock at levels 4, 8, 12, and 16 (wiki
  [Ruler](https://aow4.paradoxwikis.com/Ruler)).

**For Fluid Magic.**
1. Each ruler type has its own slot set: a dragon has scales and wings, not outfits. Fluid
   Magic's six chassis are as different from each other as AoW4's ruler types, so slots
   should be defined per chassis, not as one humanoid schema.
2. The dragon's attunement sets its element, and the element shows up visually (breath and
   mouth glow; forum [glow bug](https://steamcommunity.com/app/1669000/discussions/1/597392414383036154/)).
   In Fluid Magic, the Great Wyrm's breath element is display only (docs/05 decisions). Let
   the player pick the breath color from the design's own pip colors. This costs the sim
   nothing.
3. A new ruler type shipped with thin cosmetics drew complaints (the Giant King). Every
   chassis should meet the same minimum slot and variant count, and a content test should
   enforce it.
4. Animated cosmetic parts drew praise (the Eldritch Sovereign's glancing eyes). Procedural
   micro-animations on parts (a blink, a flicker, a glyph pulse) are cheap tweens in the
   docs/09 animation model.

### 1.3 The appearance editor

What the sources confirm for a humanoid ruler:

| Slot | Detail | Source |
|------|--------|--------|
| Physique | body shape selector; head size and hand size sliders (added in a patch) | forum [patch post](https://steamcommunity.com/app/1669000/discussions/2/501694090336840515) |
| Height and proportions | sliders "from height and head style to arm length" | review [Shacknews](https://www.shacknews.com/article/135263/age-of-wonders-4-review-score) |
| Head, face, horns | form-specific heads; Wizard King headgear is mostly masks, with horns built from floating segments | fan wiki [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Characters/AgeOfWonders4) |
| Hair style and color | style plus color; a later patch added a color picker for skin, hair root, and banner colors | wiki [Faction](https://aow4.paradoxwikis.com/index.php?mobileaction=toggle_view_desktop&title=Faction); forum via [search extract](https://steamcommunity.com/app/1669000/discussions/0/5264193038182663144) |
| Skin color | per form | wiki [Faction](https://aow4.paradoxwikis.com/index.php?mobileaction=toggle_view_desktop&title=Faction) |
| Outfit, helmet, cape | culture-locked for Champions; a separate set for Wizard Kings | wiki [Faction](https://aow4.paradoxwikis.com/index.php?mobileaction=toggle_view_desktop&title=Faction) |
| Armor color | primary armor colors (more added in a patch) | forum [patch post](https://steamcommunity.com/app/1669000/discussions/2/501694090336840515) |
| Weapon loadout | set by class and culture (mechanical) | wiki [Ruler](https://aow4.paradoxwikis.com/Ruler) |
| Mount | from the racial mount trait (mechanical); a culture or Wizard King horse armor (cosmetic) | wiki [Faction](https://aow4.paradoxwikis.com/index.php?mobileaction=toggle_view_desktop&title=Faction); forum [thread](https://steamcommunity.com/app/1669000/discussions/0/806832194049044009/) |
| Diplomacy pose | set in faction creation; the AI used to override it, and a patch fixed that | official [GOG release notes](https://www.gogdb.org/product/1915432764/releasenotes) |
| Pantheon extras | unlocked cosmetics placed "at the far end of the clothing sliders" | wiki [Faction](https://aow4.paradoxwikis.com/index.php?mobileaction=toggle_view_desktop&title=Faction) |

Exact variant counts per slot (hair styles, faces, outfits) were **not found** in any
source. The only published color count I found is indirect. The Age of Colors mod "adds an
additional 51 banner colors, totaling 64", which puts the base game at **13 banner
colors** (mod [Workshop page](https://steamcommunity.com/sharedfiles/filedetails/?id=2970499689)).

**How AoW4 makes this affordable** (Dev Diary #11, the art team). Every form starts from
one base mesh with identical topology. A joint-scaling system lets forms have different
proportions while sharing animations, and outfits morph between forms. About nine artists
worked on it for 3.5 years (official, via
[GameBanshee](https://www.gamebanshee.com/news/127487-age-of-wonders-4-developer-diary-11-art-design.html)).

**For Fluid Magic.** The SVG analog of "one base mesh plus joint scaling" is **one anchor
skeleton per chassis**: named points such as `head`, `crown`, `back`, `handMain`, and `base`.
Each part is authored in its anchor's local frame. The docs/09 tweens move the anchors, so
every part animates for free, the way AoW4 shares animations. Parts with the same anchor
type, such as a crown, can be reused across chassis with a per-anchor scale. The sliders
(height, head size, hand size) have a direct SVG equivalent: clamped scale transforms on
anchors. They add variety for no art cost.

### 1.4 Faction creation: the form is cosmetic, the traits are mechanical

The decisive AoW4 design move: "Each physical form comes with certain default form traits,
but these can be changed to any form traits, so the physical form is effectively only
cosmetic" (wiki [Form](https://aow4.paradoxwikis.com/Form)). GameGrin says the same: the
ten forms do not "affect anything gameplay-wise"
([GameGrin](https://www.gamegrin.com/articles/age-of-wonders-4-faction-customisation-overview/)).
Game Rant notes that it lets players build "hearty Elfkin adapted to live underground or
arcane-focused Dwarfkin who ride unicorns"
([Game Rant](https://gamerant.com/age-of-wonders-4-faction-creation-guide/)).

- **Form traits.** At launch you picked one Body trait and one Mind trait
  ([GameGrin](https://www.gamegrin.com/articles/age-of-wonders-4-faction-customisation-overview/);
  official [Dev Diary #5](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-5),
  e.g. swapping Tough for Resilient). Traits later became a point-buy with 5 points (forum
  [thread](https://steamcommunity.com/app/1669000/discussions/0/839501827476043663/)). In
  2025 the Griffon Update added Flaws, traits that give points back, such as Vulnerable to
  Physical or Coward, some of them incompatible with specific traits (news
  [RPGGamers](https://rpggamers.com/news/griffon-update-adds-flaws-to-age-of-wonders-4)).
- **Society traits.** You pick 2 of 18, and "choosing some of them blocks you from
  activating other ones". Each gives an affinity point
  ([GamePressure](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c)).
  A build guide says it is 2 points each (via
  [search extract](https://game.lb-product.com/en/games/age-of-wonders-4/guides/age-of-wonders-4_builds-guide)).
- **Culture** sets the affinities, buildings, and starting units
  ([Magic Game World](https://www.magicgameworld.com/age-of-wonders-4-faction-creation-and-customization-guide/)).
  It also sets the look of the units and the Champion's clothing.
- **Banner**: an icon plus primary and secondary colors. Unit armor and the leader's armor
  are colored separately (forum
  [thread](https://steamcommunity.com/app/1669000/discussions/0/5796736618333403553/)).
  Patches added icons, for example one per giant clan, and more colors (forum
  [patch post](https://steamcommunity.com/app/1669000/discussions/2/501694090336840515)).
- **Name and lore.** The last step names the faction and the leader and picks a title. "The
  creator will also create a historic background of the faction" from your choices
  ([GamePressure](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c)).
- **Step order** differs between sources. GamePressure gives Race, Culture, Society
  Traits, Tomes, Ruler's Origin, Appearance, Summary
  ([GamePressure](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c)).
  The wiki splits the ruler into three steps: origin; class, equipment, and appearance;
  then ambition, AI personality, and names (wiki
  [Ruler](https://aow4.paradoxwikis.com/Ruler)). Both put the mechanical choices first,
  then the appearance, then a summary.

**For Fluid Magic.** The same split works here: any look on any build. The look must never
gate or alter mechanics. Mechanics may still *drive* look elements automatically (1.6), but
not the reverse.

### 1.5 Editor UX: random, presets, saving, sharing, editing later

- **Random Ruler.** It was added in the Wyvern Update (2023, patch 1.003), after launch, in
  the Custom Rulers tab, in single and multiplayer. The developers' advice: "Just Reroll,
  or edit the ruler to smooth out those rough edges" (official
  [Wyvern patch notes](https://store.steampowered.com/news/app/1669000/view/7208622092879106175)).
  Later patches added "control settings for the Random Faction generation" and Next and
  Previous buttons to cycle through earlier rolls (official
  [GOG release notes](https://www.gogdb.org/product/1915432764/releasenotes)). Players had
  asked for a random button on every step (forum
  [request](https://steamcommunity.com/app/1669000/discussions/0/3828666283443789087/)).
- **Live preview and a lighting toggle.** A "Lighting button that alternates the lighting
  while customizing your appearance" lets you check the ruler in different environments
  (forum [patch post](https://steamcommunity.com/app/1669000/discussions/2/501694090336840515)).
- **Presets.** Sources count 18 to 20 premade factions, all freely editable (review
  [TouchTapPlay](https://www.touchtapplay.com/which-faction-should-you-join-in-age-of-wonders-4/);
  [God is a Geek](https://godisageek.com/2023/04/age-of-wonders-4-faction-guide/)).
- **Editing mid-campaign.** A Dragon Lord's appearance can be changed "at any time during a
  playthrough by inspecting the character and clicking on the Adjust Appearance button"
  (review [MMORPG](https://www.mmorpg.com/reviews/age-of-wonders-4-dragon-dawn-review-strategy-session-2000128239)).
  This is not available in multiplayer (forum
  [thread](https://steamcommunity.com/app/1669000/discussions/0/3828666283448097576/)).
- **Saving and editing.** Players reported that edits to a saved faction did not stick
  (forum [thread](https://steamcommunity.com/app/1669000/discussions/0/5294588689507328353/),
  dated). Saving an edit makes a duplicate and keeps the original (search extract of forum
  posts; anecdotal).
- **Sharing.** There is "no easy in-game way to share factions"
  (forum [thread](https://steamcommunity.com/app/1669000/discussions/0/839501827476184072/)).
  A third-party web tool, the aow4db Faction Creator, fills the gap
  ([aow4db](https://minionsart.github.io/aow4db/HTML/FactionCreation.html)).
- **Pantheon progression.** Points earned by finishing games unlock cosmetics such as hats,
  cloaks, helms, banner icons, weapon loadouts, and mounts. They are applied by editing a
  ruler or faction (review
  [GamePressure](https://www.gamepressure.com/age-of-wonders-4/pantheon/zf10bd8),
  [TheGamer](https://www.thegamer.com/age-of-wonders-4-complete-guide-to-my-pantheon/)). One
  bug report says ascended rulers rehired as heroes lost their Pantheon gear (forum
  [bug](https://forum.paradoxplaza.com/forum/threads/pantheon-heroes-dont-display-pantheon-cosmetics.1582962/)).
- **Hiding visuals.** Players can hide the look of race transformations but keep their
  effects, except for transformations that grant flying, floating, or aquatic movement (forum
  [thread](https://steamcommunity.com/app/1669000/discussions/0/6761669877514621714/); wiki
  [Race transformation](https://aow4.paradoxwikis.com/Race_transformation)). **A visual
  that carries movement information cannot be turned off.**
- **Framing problems.** Very tall or winged rulers can be cropped so their faces do not show
  on the diplomacy screen (forum
  [thread](https://steamcommunity.com/app/1669000/discussions/0/5294588689502788157/)).

### 1.6 Cosmetic versus mechanical: the full split

| Choice | AoW4 | Note |
|--------|------|------|
| Form | cosmetic | default traits are only suggestions |
| Form traits, society traits, culture, tome, ruler type, class, sub-type | mechanical | |
| Culture | **mechanical and visual** | it sets unit looks and Champion clothing, and this coupling is criticized (1.7) |
| Weapon loadout | mechanical | set by class, and by culture for Champions |
| Mount | mechanical (mount trait), cosmetic horse armor | |
| Dragon attunement | mechanical, with automatic visuals (breath, glow) | |
| Race transformations | mechanical, with automatic visuals, hideable unless they change movement | |
| Hair, skin, physique, sliders, headgear, cape, outfit, pose, banner, names | cosmetic | |
| AI personality | mechanical, but only when the AI plays the faction | |

**The pattern.** Mechanics produce visuals automatically: element glow, transformations,
mounts, weapons. Cosmetics never produce mechanics. Players dislike the places where
cosmetics are *locked* by mechanics (Champion outfits by culture). They accept visuals that
mechanics *add*.

### 1.7 What players praise and criticize

Praise:
- Gideon's Gaming calls the faction creator the game's centerpiece, with "an unparalleled
  degree of customization for the genre" (review
  [Gideon's Gaming](https://gideonsgaming.com/age-of-wonders-4-review/)). GameTyrant: "hugely
  customizable... almost limitless possibilities for replays" (review
  [GameTyrant](https://gametyrant.com/news/age-of-wonders-4-review-limitless-possibilities)).
  Impartial Judgement scores replay and customization 9.5/10 (review
  [Impartial Judgement](https://impartialjudgement.com/2025/05/16/age-of-wonders-4-a-wonder-ful-worldbuilder/)).
- The name and pronouns reach portraits, combat, and how other rulers address you (review
  [Shacknews](https://www.shacknews.com/article/135263/age-of-wonders-4-review-score)).
- The Dragon Lord's skin decorations and scale types "look great" (review
  [MMORPG](https://www.mmorpg.com/reviews/age-of-wonders-4-dragon-dawn-review-strategy-session-2000128239)).

Criticism:
- **Shallow underneath.** "You are effectively customizing six cultures", and the system
  "results in less actual content than the games that came before" (review
  [Explorminate](https://explorminate.org/age-of-wonders-4-review/)). The ruler choice "does
  not even impact the Faction Leader itself" (forum
  [thread](https://steamcommunity.com/app/1669000/discussions/0/3828666283445693589/?ctp=3)).
- **Too few colors.** The banner palette is small, and secondary colors are restricted
  (forum, via [GamePressure extract](https://steamcommunity.com/app/1669000/discussions/0/5264193038182663144)).
  Dragons get "only one colour option and then lots of weird patterns". Their secondary and
  tertiary colors "seem to be set in stone" (forum
  [Dragon color choices](https://steamcommunity.com/app/1669000/discussions/0/4036979414422568941/)).
  Mods answer the demand: 64 banner colors
  ([Age of Colors](https://steamcommunity.com/sharedfiles/filedetails/?id=2970499689)), extra
  banner icons
  ([Banner Bonanza](https://www.gamewatcher.com/mods/age-of-wonders-4-mod/banner-bonanza)),
  extra hair and skin colors
  ([Cali's Cosmetics](https://steamcommunity.com/sharedfiles/filedetails/?id=3387440419)).
- **Cosmetics locked by mechanics.** The C4U mod exists only to let Champions and Wizard
  Kings use every culture's cosmetics
  ([C4U Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=2971527182);
  [Paradox Mods](https://mods.paradoxplaza.com/mods/74618/Any)). Players ask for the same in
  the game itself (forum
  [thread](https://steamcommunity.com/app/1669000/discussions/0/720115994490614157/)).
- **Missing choices on some slots.** Players want to choose the wing style or no wings, and
  a secondary color for skin decorations (forum
  [thread](https://steamcommunity.com/app/1669000/discussions/0/806832194049044009/)).
  "Most of the faces available feel a bit samey" (preview
  [TechRaptor](https://techraptor.net/gaming/previews/age-of-wonders-4-preview-one-more-turn-fantasy-style)).
- **New ruler types ship thin** (Giant King, 1.2).
- **Workflow.** Edits did not stick, there is no sharing (1.5), and the pronoun set was
  limited (1.2).

---

## Part 2. Lessons, and how each applies to Fluid Magic

| # | AoW4 lesson | Fluid Magic application |
|---|-------------|-------------------------|
| L1 | The form is cosmetic, the traits are mechanical | `PretenderLook` is separate from `PretenderDesign`. No look field is read by `src/sim` or `src/ai` (2.1) |
| L2 | Mechanics add visuals automatically; players accept that | Pips, bless, dominion, awakening, and body tags each get an automatic visual mark the look cannot remove (2.6) |
| L3 | Visuals that carry movement information cannot be hidden | Wyrm wings (flying), Monolith roots (immobile), and Spirit flicker (stealthy) are fixed parts, not slots. The fire shield's embers always show |
| L4 | Cosmetics locked by mechanics anger players (C4U) | No look slot is locked by nation or pips. Nation flavor is the default, not a limit |
| L5 | One fixed color with fixed secondaries angers players (dragons) | At least two chosen color channels on every chassis, with light and dark steps derived, not fixed (2.4) |
| L6 | A small banner palette angers players, but Fluid Magic's map colors are gameplay-critical | Map banner colors stay as `NATION_BANNERS` assigns them (color-blind tests). Player identity on the banner goes through a **sigil** (shape), which also obeys "never hue alone" (2.3) |
| L7 | A thin new ruler type is criticized | A content test requires each chassis to have the same minimum slot and variant counts |
| L8 | Same-looking faces | At 64 px, faces are invisible. Spend variants on **silhouette** (headgear, horns, wings, capes, stone shape) and keep face detail for the 128 px portrait |
| L9 | Random Ruler arrived late and was then extended with settings and history | Ship from day one: Random look (respects locks), per-slot dice, Random god (build and look, valid within budget), and a short undo history of rolls |
| L10 | The lighting toggle is useful | A backdrop toggle (parchment card, battle terrain, night), plus a color-blind preview toggle unique to Fluid Magic |
| L11 | Generated lore and a title make the faction feel authored | Name, epithet, pronoun (he, she, they, it), and a templated "myth" built from the design, extending the docs/05 "reading" |
| L12 | No sharing, and edits that do not stick | Save, Save as copy, and a share code (versioned string). Edits save in place |
| L13 | Appearance can be changed mid-campaign | "Adjust appearance" from the commander panel: look and identity only, never the build |
| L14 | Animated parts delight | Each part may declare a micro-animation (blink, flicker, pulse, sway) driven by the docs/09 tween clock |
| L15 | The pose is a creation choice | 3 portrait poses per chassis as anchor rotations, no new art |
| L16 | Pantheon unlocks gate cosmetics behind play | **Defer** (M2 or later). M1 has no meta-progression, and gated cosmetics add test surface. Everything is unlocked |
| L17 | Advanced Settings hide the AI personality | M2: a saved god may carry an AI temperament for when the AI plays it, under a collapsed "Advanced" section (matches "complexity under smart menus") |
| L18 | Culture locks the weapon; the weapon is mechanical | Weapon slots offer **finishes** of the same weapon (a Titan's great sword: straight, flamberge, broad), never a different weapon class. The replay's weapon name and motion stay true |

---

## Part 3. A customization model for Fluid Magic (2D SVG)

### 3.1 Where the look lives (determinism)

```ts
// src/content/looks/types.ts: presentation data; src/sim and src/ai never import it
export interface PretenderLook {
  version: 1;
  chassis: ChassisId;                       // slots are validated against this chassis
  parts: Partial<Record<SlotId, VariantId>>; // missing slot = the chassis default
  swatches: { material: SwatchId; metal: SwatchId; accent: SwatchId };
  sliders: Partial<Record<SliderId, -2 | -1 | 0 | 1 | 2>>;
  pose: 'regal' | 'wrathful' | 'serene';
  aura: AuraStyleId;                        // shape only; the colors come from pips
  sigil: { frame: SigilFrameId; charge: SigilChargeId };
  breathColor?: Color;                      // Wyrm only; must be one of the design's pip colors
  myth?: string;                            // free-text override, up to 280 chars
}
```

- **Option A (recommended).** The look lives outside `GameState`. The UI save wrapper
  stores `{ game: serialize(state), looks: Record<NationId, PretenderLook> }`. The sim
  cannot read what it does not hold, so "cosmetic never affects the sim" is structural, not
  a convention. AI nations get a look at New Game: the preset's look, or a roll from a UI RNG
  seeded by `setup.seed` (not `state.rng`), so a reload shows the same look.
- **The name is the exception.** The sim already names every commander (`name: def.name`
  in `src/sim/commanders.ts`), and messages are prebuilt strings (`postMessage(..., text)`).
  So the god's `name` and `epithet` should be optional strings on `PretenderDesign` (or
  `NationSetup`). They would become the pretender commander's name, and `validatePretender`
  would check length and characters. They change the state hash but never an outcome. This
  also gives the battle design's "THE GOD FALLS" card its name. The pronoun can live in the
  look if messages avoid pronouns. Otherwise it goes beside the name.
- **Guards.** (a) Extend `tests/sim/purity.test.ts`: `src/sim/**` and `src/ai/**` may not
  import `src/content/looks/**`. (b) A determinism test runs the headless game twice with the
  same design and two different looks and asserts identical hashes. With Option A this
  holds trivially, but it protects against later drift.

### 3.2 Slot model per chassis

Every chassis has **4 part slots** and **3 variants per slot in M1**. Variant 0 is the base
art that Phase 11 needs anyway. Slots favor silhouette (L8). Fixed parts carry the mechanics
(L3) and are never slots.

| Chassis | Fixed (mechanical) parts | Slot 1 | Slot 2 | Slot 3 | Slot 4 |
|---------|--------------------------|--------|--------|--------|--------|
| Oracle of the Flux | floating hem, staff | headdress: cowl, tall mitre, veil and circlet | mask: bare face, porcelain mask, eye-of-flux mask | robe cut: flowing, layered mantle, ribbons | staff head (finish): orb, crescent, cage of motes |
| Titan | great sword, giant scale | helm: open crown, great helm, horned helm | armor set: plate, scale, ritual bone | cape: none, long cape, banner cape | blade finish: straight, flamberge, broad |
| Great Wyrm | wings (flying), breath | horns: swept-back, crown of spines, frilled crest | wing membrane: smooth, tattered, ribbed sail (always wings) | tail tip: spade, club, blade fin | scale pattern: banded, mottled, plated (a pattern fill) |
| Living Monolith | rooted base (immobile), glyphs | silhouette: obelisk, menhir, broken arch | capstone: none, floating stone, carved face | glyph script: runic strokes, spirals, dot and line (procedural, seeded) | overgrowth: none, moss and vines, soot and cracks |
| Wild Spirit | translucent flicker (stealthy) | beast form: stag, wolf, great cat (no wings: it does not fly) | head ornament: antler crown, spirit mask, horned skull | trail: wisps, leaves, mist | markings: stripes, rings, spots |
| Ash Colossus | embers (fire shield), burning fists | head: brazier, horned skull, faceless crown | crack pattern: veins, plates, runes | shoulders: bare, chains, spikes | fist finish: bare, banded, molten gauntlets |

Shared across all chassis (code, no new SVG): **pose** (3, anchor rotations), **aura
shape** (4, procedural: halo ring, orbiting motes, ground sigil circle, crown of sparks),
**sliders** (2.5), and **sigil** (2.3).

Art cost in M1: 6 chassis x 4 slots x 2 extra variants = **48 part SVGs** beyond the Phase 11
base. Add 6 sigil frames and 12 sigil charges (18 small monoline SVGs, matching the docs/09
icon style), 2 awakening overlays (sleep veil, runic chains), and the 3 procedural glyph
grammars (code). That makes about **70 small files**. Each part is authored once at portrait
scale (128 px), and the 64 px battle sprite reuses the same parts scaled down. That works
only if variants differ in outline, which is why the slots favor silhouette.

Combinations: 3^4 = **81 silhouettes per chassis, 486 in all**, before colors, pose, aura,
and sliders. With 8 x 6 x 8 swatches, 3 poses, and 4 auras, there are about 373,000
distinct looks per chassis (81 x 384 x 3 x 4), before sliders.

### 3.3 Identity: name, sigil, myth

- **Name** (1 to 24 chars) and **epithet** (0 to 32, e.g. "the Unburnt"), with a
  generator: syllable tables per dominant color, like `src/content/names.ts` for provinces.
  It runs on a UI-side seeded RNG.
- **Pronoun**: he, she, they, or it (the gap noted in 1.2). Templates must agree with it.
- **Sigil**: a frame (6: roundel, shield, lozenge, sunburst, ring of thorns, broken circle)
  around a charge (12: crown, eye, hand, tree, flame, tower, serpent, star, skull, wave,
  antler, key). That is 72 sigils, each a shape. It goes on battle banners, the army-badge
  corner, and the summary card. The banner *color* stays as `NATION_BANNERS` assigns it
  (L6). Original geometric charges avoid any resemblance to AoW4's icons.
- **Myth**: two or three templated sentences from chassis, dominant color, strongest scale
  pole, dominion, and awakening, e.g. "Bound beneath the ash for three years, the Unburnt
  will rise to a world of Fury and Turmoil." The player can override it with free text. This
  extends the docs/05 rule-based reading rather than replacing it.

### 3.4 Color channels

| Channel | Chosen or derived | M1 choices | Notes |
|---------|-------------------|-----------|-------|
| `tint` (the docs/09 tint zone, `currentColor`) | **derived**: the dominant pip color | none | Carries meaning, so it gets a 1 px keyline (the `keylineFor` idea from docs/09) and never depends on hue alone: the mana-symbol row sits beside it |
| `glow` (aura, eyes, glyphs, breath) | **derived**: every color with pips, in proportion; the Wyrm's breath is chosen from those | none (Wyrm: one per pip color) | Hooks into "flashy magic" (2.6) |
| `material` (skin, stone, bark, ash, scale) | chosen | 8 per chassis family | Light and dark steps are derived (L5) |
| `metal` (crown, armor, chains) | chosen | 6: gold, silver, bronze, iron, bone, obsidian | |
| `accent` (cloth, cape, markings) | chosen | 8 | No CIEDE2000 rule (it carries no information), but it must not equal the tint primary |

M2: a free color picker for `material`, `metal`, and `accent` only, behind "More colors".
The two derived channels never get one.

### 3.5 Sliders

All sliders are integer steps from -2 to 2 and clamped. Each one maps to a scale on an anchor:

- **Stature** (±3% per step, ±6% at most). The sim's `size` drives battle drawing, so the
  look must not change the size class (battle-design 4.12).
- **Head size**, **horn or crown length**, **wing span** (Wyrm), **ember intensity**
  (Colossus: particle rate), **glyph density** (Monolith).

They cost almost nothing to build: a transform per anchor and a test that the result stays
inside the 128 px frame. That test also answers AoW4's cropping problem (1.5).

### 3.6 Mechanics that show (automatic, cannot be removed)

| Mechanical choice | Visual mark | Where |
|-------------------|-------------|-------|
| Pips | tint zone = dominant color; mana-symbol row; aura motes split by pip count | card, sprite, map marker |
| Bless (pips ≥ 4) | a second aura ring carrying that color's **symbol** (shape, not hue) | card and battle |
| Pips at 6 | the color's symbols orbit the god | card and battle |
| Dominion 1-10 | candle count (docs/05) and aura radius | card, map |
| Awakening | dormant: eyes closed, slow breath, dim aura; imprisoned: runic chains overlay | editor preview and card |
| Body tags | flying wings, rooted base, flicker, embers, regeneration motes | always |
| Scales (optional M1, else M2) | preview backdrop ornaments by pole: Growth lush, Rot withered, Order paved, Turmoil cracked | editor backdrop only |

This is where the owner's "flashy magic" meets customization. The god visibly glows with the
colors poured into it, its aura changes the moment a bless unlocks, and the editor's
**Cast** button plays the docs/09 cast animation and the color's particle burst (Ember
rises, Loam spreads) using the chosen aura shape. This needs no new sim primitive: it is the
battle viewer's own effect code running in the editor.

### 3.7 Variant counts: AoW4, Fluid Magic M1, Fluid Magic M2

| Slot or axis | AoW4 | FM M1 | FM M2 |
|--------------|------|-------|-------|
| Ruler type / chassis | 6 (2 base) | 6 | 6 plus new chassis (docs/00 M2) |
| Mechanical sub-type | Dragon 6, Giant 4 | Wyrm breath color (display) | per-chassis aspects, if the balance doc wants them |
| People's form | 21 | fixed per nation | fixed (new nations add looks) |
| Body or part slots per ruler | about 10 humanoid (physique, head, hair, skin, outfit, helmet, cape, weapon, mount, pose); counts per slot **not found** | 4 slots x 3 variants per chassis | 6 slots x 5 variants, with crowns and capes shared across chassis |
| Sliders | body shape, head, hands, height, arm length | 2 to 3 per chassis | 4 to 5 |
| Chosen color channels | skin, hair, armor, banner x2; a picker added later | 3 (8/6/8 swatches) | 3, plus a free picker |
| Banner colors | 13 base | fixed by the palette tests | fixed; the sigil carries identity |
| Banner icons | fixed set, count **not found** | 72 sigils (6 x 12) | about 150 (more charges, plus a tincture split) |
| Pose | diplomacy pose (count not found) | 3 | 5, plus an idle flourish |
| Aura / magic look | via attunement and transformations | 4 procedural shapes | 6 to 8, plus a cast flourish glyph |
| Presets | 18 to 20 | 6 (3 per nation), each with a look | 10 or more |
| Random | random ruler, reroll, settings, history | random look, random god, per-slot dice, locks, 10-step history | plus constraint settings |
| Sharing | none in the game | share code | plus a .json file, plus a gallery of saved gods |
| Unlocks | Pantheon | none (all unlocked) | perhaps a hall of victorious gods (no gating) |

### 3.8 The editor (layout belongs to the UI spec; these are AoW4-derived requirements)

- Three tabs over one persistent preview: **Build** (docs/05 steps 1 to 5), **Look**
  (slots, swatches, sliders, pose, aura), and **Identity** (name, epithet, pronoun, sigil,
  myth). The summary card in the right third stays live on every tab. AoW4 puts appearance
  after the mechanical steps, and Fluid Magic should default to the Build tab for the same
  reason.
- Slots appear as thumbnail strips with arrows, not dropdowns. Hover previews the variant
  live. Nothing hides at "the far end of a slider" (1.3).
- **Preview controls**: context (Portrait 128, Battle 64 with idle and Cast, Map marker),
  backdrop (card, the nation's home terrain, night), and a **color-blind preview** toggle.
- **Random**: dice on each slot, Random look (locks respected), Random god (any valid design
  within budget, from the UI RNG), and Back and Forward through the last 10 rolls.
- **Presets** apply build and look together, with a "keep my look" checkbox.
- **Saving**: My Gods in IndexedDB, through `idb-keyval`, which docs/06 already names for
  saves. Save, Save as copy, and Delete. Edits save in place (L12).
- **Share code**: `FM1.` plus base64url(JSON `{design, look, name}`), under about 400
  chars. On import, `validatePretender` and `validateLook` run, and an invalid or over-budget
  code is refused with the reason.
- **Mid-game**: the commander panel's "Adjust appearance" opens Look and Identity only.

### 3.9 Tests

- `tests/content/looks.test.ts`:
  - every chassis has at least 4 slots with 3 variants each (L7);
  - every variant id resolves to a manifest entry;
  - every preset has a valid look;
  - the default look validates;
  - swatch ids exist;
  - the accent swatch never equals the tint primary;
  - sliders at ±2 keep the part bounding boxes inside 128x128 (from anchor data).
- `validateLook`: refuses unknown slots, variants of another chassis, out-of-range sliders,
  and a `breathColor` outside the design's pips; clamps or refuses an overlong myth.
- Share code: round-trips, a version mismatch is refused, and garbage is refused.
- `purity.test.ts`: the sim and AI do not import looks. The determinism test: two looks give
  the same state hash.
- UI smoke (cheap): compose every chassis with every variant into an SVG string without
  throwing.

### 3.10 Phase placement

- **Phase 9** (pretender design screen): the Build, Look, and Identity tabs; random;
  presets with looks; My Gods; the share code; name and epithet on the design. Until
  Phase 11 it uses placeholder parts (the variant-0 silhouette with a label).
- **Phase 10** (replay viewer): the god's sigil on banners, the chosen aura, and the breath
  color.
- **Phase 11** (art): the anchor skeletons, the 48 variant parts, the sigils, the
  procedural glyphs and auras, micro-animations, and the awakening overlays.
- **M2 (deferred)**: more slots and variants, the free color picker, more poses, the scales
  backdrop (if not in M1), an AI temperament under Advanced, a gallery, unlock tracks, and
  cosmetics shared across chassis.

### 3.11 Risks and open points

1. **The god's name in sim state** (3.1) is the one place a cosmetic-adjacent string enters
   the sim. The alternative is name substitution in the UI, which means structured messages:
   a bigger change. Recommend the string field.
2. **Art budget.** 48 parts plus 18 sigils on top of Phase 11's base list is real work. If
   Phase 11 runs long, cut to 3 slots per chassis (36 parts) before cutting procedural items,
   which cost code, not art.
3. **Battle readability.** Auras and sigils must not hide the docs/04 information (routing,
   HP). The battle spec's aura budget (proposal-architecture: auras 48 pooled) should count
   the god's aura.
4. **Source quality.** Several AoW4 facts rest on forum posts from 2023, and the editor may
   have changed since. The design conclusions do not depend on any single count.

---

## Sources

Official and wiki: [AoW4 wiki: Ruler](https://aow4.paradoxwikis.com/Ruler),
[Faction](https://aow4.paradoxwikis.com/index.php?mobileaction=toggle_view_desktop&title=Faction),
[Form](https://aow4.paradoxwikis.com/Form), [Culture](https://aow4.paradoxwikis.com/Culture),
[Giant King](https://aow4.paradoxwikis.com/Giant_King),
[Eldritch Sovereign](https://aow4.paradoxwikis.com/Eldritch_Sovereign),
[AI personality](https://aow4.paradoxwikis.com/AI_personality),
[Race transformation](https://aow4.paradoxwikis.com/Race_transformation);
[Dev Diary #5](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/age-of-wonders-4-dev-diary-5);
[Dev Diary #11 via GameBanshee](https://www.gamebanshee.com/news/127487-age-of-wonders-4-developer-diary-11-art-design.html);
[Dragon Dawn page](https://www.paradoxinteractive.com/games/age-of-wonders-4/add-ons/age-of-wonders-4-dragon-dawn);
[Wyvern Update notes](https://store.steampowered.com/news/app/1669000/view/7208622092879106175);
[GOG release notes](https://www.gogdb.org/product/1915432764/releasenotes);
[Archon Prophecy and Griffon Update](https://www.paradoxinteractive.com/games/age-of-wonders-4/news/archon-prophecy-and-griffon-update-out-now);
[Thrones of Blood press release](https://www.paradoxinteractive.com/media/press-releases/press-release/dominate-the-realms-in-thrones-of-blood-for-age-of-wonders-4-today);
[Giant Kings press](https://gamespress.com/Giant-Kings-Arrive-Today-in-Age-of-Wonders-4);
[Giant Kings store](https://store.epicgames.com/p/age-of-wonders-4--giant-kings);
[Expansion Pass 4 store](https://store.epicgames.com/p/age-of-wonders-4--expansion-pass-4).

Reviews and guides: [Game Rant faction guide](https://gamerant.com/age-of-wonders-4-faction-creation-guide/),
[GamePressure creating factions](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c),
[GamePressure Pantheon](https://www.gamepressure.com/age-of-wonders-4/pantheon/zf10bd8),
[TheGamer Pantheon](https://www.thegamer.com/age-of-wonders-4-complete-guide-to-my-pantheon/),
[GameGrin](https://www.gamegrin.com/articles/age-of-wonders-4-faction-customisation-overview/),
[Magic Game World](https://www.magicgameworld.com/age-of-wonders-4-faction-creation-and-customization-guide/),
[GameWatcher tomes](https://www.gamewatcher.com/age-of-wonders-4/guides/best-tomes-and-tiers),
[MMORPG Dragon Dawn](https://www.mmorpg.com/reviews/age-of-wonders-4-dragon-dawn-review-strategy-session-2000128239),
[Gideon's Gaming review](https://gideonsgaming.com/age-of-wonders-4-review/),
[Gideon's Gaming Dragon Dawn](https://gideonsgaming.com/age-of-wonders-4-dragon-dawn-review/),
[Gideon's Gaming Eldritch Realms](https://gideonsgaming.com/age-of-wonders-4-eldritch-realms-review/),
[GameTyrant](https://gametyrant.com/news/age-of-wonders-4-review-limitless-possibilities),
[Explorminate](https://explorminate.org/age-of-wonders-4-review/),
[Impartial Judgement](https://impartialjudgement.com/2025/05/16/age-of-wonders-4-a-wonder-ful-worldbuilder/),
[Shacknews](https://www.shacknews.com/article/135263/age-of-wonders-4-review-score),
[TechRaptor preview](https://techraptor.net/gaming/previews/age-of-wonders-4-preview-one-more-turn-fantasy-style),
[RPGGamers Flaws](https://rpggamers.com/news/griffon-update-adds-flaws-to-age-of-wonders-4),
[TouchTapPlay](https://www.touchtapplay.com/which-faction-should-you-join-in-age-of-wonders-4/),
[God is a Geek](https://godisageek.com/2023/04/age-of-wonders-4-faction-guide/),
[TV Tropes characters](https://tvtropes.org/pmwiki/pmwiki.php/Characters/AgeOfWonders4),
[TV Tropes game](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/AgeOfWonders4).

Forums and mods (anecdotal): [patch post on body sliders and lighting](https://steamcommunity.com/app/1669000/discussions/2/501694090336840515),
[banner question](https://steamcommunity.com/app/1669000/discussions/0/5796736618333403553/),
[colour complaints](https://steamcommunity.com/app/1669000/discussions/0/5264193038182663144),
[dragon colors](https://steamcommunity.com/app/1669000/discussions/0/4036979414422568941/),
[dragon glow bug](https://steamcommunity.com/app/1669000/discussions/1/597392414383036154/),
[more customization request](https://steamcommunity.com/app/1669000/discussions/0/806832194049044009/),
[Giant King and Eldritch cosmetics](https://steamcommunity.com/app/1669000/discussions/0/596271495257278373/),
[Eldritch most customizable](https://steamcommunity.com/app/1669000/discussions/0/4333105050949780634/?ctp=2),
[Eldritch pronouns](https://steamcommunity.com/app/1669000/discussions/0/4548155824440762289/),
[Wizard King form](https://steamcommunity.com/app/1669000/discussions/0/3828666283440902301),
[random button request](https://steamcommunity.com/app/1669000/discussions/0/3828666283443789087/),
[5-point form cap](https://steamcommunity.com/app/1669000/discussions/0/839501827476043663/),
[sharing factions](https://steamcommunity.com/app/1669000/discussions/0/839501827476184072/),
[edits not saving](https://steamcommunity.com/app/1669000/discussions/0/5294588689507328353/),
[change appearance in game](https://steamcommunity.com/app/1669000/discussions/0/3828666283448097576/),
[portrait framing](https://steamcommunity.com/app/1669000/discussions/0/5294588689502788157/),
[hide transformation visuals](https://steamcommunity.com/app/1669000/discussions/0/6761669877514621714/),
[faction creation beef](https://steamcommunity.com/app/1669000/discussions/0/3828666283445693589/?ctp=3),
[cross-origin cosmetics request](https://steamcommunity.com/app/1669000/discussions/0/720115994490614157/),
[Pantheon cosmetics bug](https://forum.paradoxplaza.com/forum/threads/pantheon-heroes-dont-display-pantheon-cosmetics.1582962/),
[C4U mod](https://steamcommunity.com/sharedfiles/filedetails/?id=2971527182),
[C4U on Paradox Mods](https://mods.paradoxplaza.com/mods/74618/Any),
[Age of Colors](https://steamcommunity.com/sharedfiles/filedetails/?id=2970499689),
[Banner Bonanza](https://www.gamewatcher.com/mods/age-of-wonders-4-mod/banner-bonanza),
[Cali's Cosmetics](https://steamcommunity.com/sharedfiles/filedetails/?id=3387440419),
[aow4db Faction Creator](https://minionsart.github.io/aow4db/HTML/FactionCreation.html).
