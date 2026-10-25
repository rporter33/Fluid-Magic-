# Research: leader portraits

Owner direction (2026-10-21, binding): "leaders certainly need portraits" (`owner-direction.md`
item 5: every commander needs a portrait). This file covers how strategy and tactics games build,
vary and annotate leader portraits; seeded procedural SVG portraits for Fluid Magic (FM); a premium
layer of owner-made raster portraits (ChatGPT images uploaded to `art-inbox/`); and what the repo
already specifies.

## Method and confidence

- **Access.** WebFetch resolved no host (ENOTFOUND), and the proxy refused curl to game, press,
  legal and OpenAI hosts (403), as in the sibling files (`research-tabletop.md`, "Method"). GitHub,
  raw.githubusercontent.com and registry.npmjs.org opened. Code-level claims are verified from
  source; game-design and legal claims come from search extracts.
- **Tags.** **[V]**: I opened the source (repos cloned without blobs into `web/portraits/gitc/` and
  files checked out one by one, npm tarballs, the repo, sibling design files). **[X]**: a search
  extract, a lead and not a quote; where an extract did not say which of its links a claim came
  from, I cite the likeliest. **[calc]**: `tools/portrait-collide.py`, output in
  `tools/portrait-collide.out`. **"→ FM:"** marks my recommendations, which are not sourced.
- **Repo state:** Phase 6 (`git log`: 3addf97). Docs 07 and 09 are read from the staged copies in
  `/home/user/fm-docs/docs/`.

## 1. The most useful findings

1. **Rank and government go on the frame, not the face.** CK2's portrait border has one tile per
   title rank (none to emperor) and one border sprite per government. Theocracies and merchant
   republics swap the clothes and headgear layers (3.1) [V].
2. **State is a property slot.** CK2 has 38 property slots. Besides hair, head, clothes, beard and
   headgear they include imprisoned, scars (three heights), blinded, eyepatch, blood, boils, pale,
   possessed, crown and scepter (3.1) [V]. → FM: state picks overlays, never a new face.
3. **Hair color is a gradient map.** CK2 shades a grey hair sprite through a dark, base and
   highlight ramp (5.3) [V]; Battle Brothers ships each hair shape pre-colored in 5 colors (3.3) [V].
4. **Role pools and wound layers.** Battle Brothers draws beards from pools named Tidy, Raider, Monk
   and Zombie, and adds `_injured` (bloodied) variants and scar and burn overlays per skin tone
   (3.3) [V]. → FM: parts per nation and commander type; wounds as overlays.
5. **Hash the seed, then key each draw.** DiceBear hashes with FNV-1a into Mulberry32, and its
   current `Prng` seeds each draw from `seed + ':' + key`, so no value depends on call order
   (5.1) [V]. → FM: `${state.seed}:${commander.id}:${slot}`, render-only, no `Math.random`.
6. **`hash % n` reshuffles everyone when a part is added.** Going from 12 to 13 parts changed 92.5%
   of 5,000 picks; rendezvous hashing changed 7.9% [calc]. Wartales players complained that faces
   changed after patches (3.10) [X]. → FM: rendezvous picks over append-only part tables.
7. **Count only what shows at 64 px.** Multiavatar advertises 12,230,590,464 avatars but says
   "some parts (eyes, mouth) are still similar" (5.6) [V]. To keep a repeat of the salient look
   under 10% in a group of 12, about 631 distinct silhouette combinations are needed [calc].
8. **A stored ordinal beats a hash for big groups.** A medium map has 58 independent captains (2)
   [V]. Hashed into 576 salient looks, they repeat in 95% of games. A seeded permutation indexed by
   a per-type counter cannot repeat until the deck runs out (5.7) [calc].
9. **Aging can be a blend.** Old World replaced four fixed age-bracket portraits with
   interpolation (3.5) [X]. An Attila mod makes portraits "older or more weathered" at 3 and 6
   stars (3.7) [X]. → FM: commanders have no age; weathering by battles survived is the analog.
10. **Mechanics add visuals; cosmetics never add mechanics.** AoW4's transformations and
    attunements draw themselves, and players may hide them unless they change movement (3.9) [X].
    → FM: pips, holiness, prophet, pretender and wounds always show.
11. **Unique art is expensive, and too few variants repeat.** A Three Kingdoms portrait takes about
    eight days to paint; Warhammer's generic lords have 2-5 variants per type (3.7) [X]. → FM: raster
    sets only when complete per type (6.1).
12. **AI raster portraits cohere only with an anchor and fixed framing.** OpenAI's guide uses a
    reusable "character anchor" and repeats a preserve list on every edit (6.3) [V]. Prompts alone
    are not authorship under US copyright (6.7) [X]. Steam asks for disclosure of pre-generated AI
    content (6.7) [X].

## 2. What Fluid Magic already specifies (repo) [V]

- **Commanders** (`docs/03-nations.md`). Cinder Horde ("ember orange, charcoal, hot white"):
  Scout, Ash Chieftain, Pyre Priest, Ember Adept, Cinder Magus, Salamander (summoned, size 3).
  Thornwood ("moss green, bark brown, pale blossom"): Scout, Warden Captain, Grove Priest, Sapling
  Druid, Elder Druid, Treant (summoned, size 4). Independents: one Independent Captain per
  non-capital province (`placeIndependents`, `src/sim/independents.ts`; every non-capital has
  strength 8 or more, `src/mapgen/placement.ts`), so 58 on the medium map (`medium: 60`).
- **Pretenders**: `docs/05-pretender.md` lists six chassis (Oracle of the Flux, Titan, Great Wyrm,
  Living Monolith, Wild Spirit, Ash Colossus). The pretender final widens this to 16. Its B.8
  replaces "a 128x128 SVG portrait" with the rig's own parts in a `portrait` pose at 256, 128 and
  64 px. Layers: backdrop, aura, body, glow, blessing rings, awakening overlay (dormant: closed
  eyes; imprisoned: runic chains), a 256 px detail layer, sigil, frame
  (`pretender-design/final.md`).
- **Sprites** (`docs/09-art-direction.md`): units are 64x64 SVG parts with a `currentColor` tint
  zone, and "Portraits for commanders are the same SVG cropped at 2x with a colored backdrop". The
  battle final agrees: "the rig in its idle pose at 2×, on the banner color".
- **Delivery rule** (`docs/09`): "All art lives in `src/assets/sprites/<category>/<name>.svg`...
  Missing art falls back to the archetype silhouette with a nation tint". Phase 11 includes
  "chassis portraits. Manifest with fallbacks" (`docs/10-milestone-1.md`).
- **Where portraits show** (`ui-design/spec-final.md`): the Commander panel (64 px, "mana symbols
  around the frame, plus a holy mark for priests", 2.8.2, with Pretender, Prophet, Scout and
  Stealthy badges), the bottom strip, outliner rows, the pretender mini-portrait, battle docks and
  name cards. `Portrait` takes `unit`, `nation`, `pips` and `size`: no commander id, so every Ash
  Chieftain would look the same.
- **Reserved icons** (staged `docs/09`): crown (pretender), halo (prophet), eye (scout), hood
  (stealthy); "wounded (cracked heart)", starving, unpaid; "dotted borders (fog)".
- **Readable state** (`src/sim/types.ts`): `CommanderState.id` (monotonic `c<n>`,
  `src/sim/ids.ts`), `unit`, `owner`, `name`, `hp`, `pips`, `holy`, `starvedDays`, `transit`;
  `nation.pretenderId`, `nation.prophetId`; `GameState.seed`. No age, experience or afflictions, and
  `name` is the unit's name (`src/sim/commanders.ts`: `name: def.name`). The units track proposes
  `battles`/`kills` counters (M1 hook), afflictions and renown (M2)
  (`units-items-design/research-dom-units.md` 8, 9).
- → FM: `Portrait` needs `commander?: CommanderId`. Seeded personal names (like
  `src/content/names.ts`) would help as well, but are out of scope here.

## 3. Reference games

### 3.1 Crusader Kings II: layered 2D portraits
Source [V]: PortraitBuilder (https://github.com/scorpdx/portraitbuilder, `src/PortraitBuilder.Shared/`).
- **DNA genes**: neck, chin, mouth, nose, cheeks, eyes, ears, hair color, eye color
  (`Model/Portrait/DefaultCharacteristics.cs`).
- **38 properties**: background, hair, head, clothes, beard, headgear, imprisoned, scars, red dots,
  boils, blinded, player, mask, eyepatch, makeup, jewelry, immortality, crown behind, crown,
  freckles, physique, pale, black eye, harelip, scars mid, scars high, blood, tattoo, warpaint,
  possessed, overlayer, helmet, scepter, relationship (same file).
- **Gene letters**: a letter picks frame `(indexOf(letter) + 1) % frameCount`
  (`Model/Portrait/Character.cs`), so adding frames to a sprite changes existing characters.
- **Layers**: one characteristic can draw on several ("clothes_behind, clothes, clothes_infront")
  (`Layer.cs`). Types are named by culture, sex and age (`PORTRAIT_italiangfx_male2`); children
  use one `_child_` sprite per type (`PortraitType.cs`).
- **Rank and government**: the border `GFX_charframe_150` has a tile per `TitleRank` (None, Baron,
  Count, Duke, King, Emperor), each government has its own border, and theocracies and merchant
  republics get `GFX_religious_*`/`GFX_merchant_*` clothes and headgear (`Engine/PortraitBuilder.cs`).
- **Background** [X]: the first layer is "a background image suitable for the character and
  his/her current situation", and "all kids look alike in CK2"
  (https://forum.paradoxplaza.com/forum/threads/a-complete-guide-to-custom-portraits.590291/post-13498654).
- **Dev diary** [X]: 11 genes, 6 properties and 18 layers at the time, and a king's properties
  decide "whether he wears a crown and how fancy his clothes are"
  (https://admin-forum.paradoxplaza.com/forum/developer-diary/crusader-kings-ii-dev-diary-7-character-portraits-and-modding.530197).

### 3.2 Crusader Kings III
- [X] Portraits "change based upon the character's lineage, age, lifestyle, and illnesses"
  (https://www.thesixthaxis.com/2020/07/31/crusader-kings-3-developer-diary-contracts-portraits/).
  A fan portrait project (not CK3's art) says Maimed "may not need to appear in avatars"
  (https://www.tapatalk.com/groups/citadel/portrait-replacement-project-t2397-s60.html).

### 3.3 Battle Brothers: procedural layered busts
Sources [V]: Legends mod source (https://github.com/Battle-Brothers-Legends/Legends-public, branch
`development`) and suor's brush guide
(https://raw.githubusercontent.com/suor/battle-brothers-mods/master/.claude/skills/brushes/SKILL.md).
- **Layers**: `mod_legends/hooks/entity/tactical/human.nut` inserts chain, plate, tabard and cloak
  armor layers, accessories, helmet helm, top and vanity layers, and
  `permanent_injury_scarred`/`_burned`. They go around the vanilla `surcoat`, `helmet`,
  `helmet_damage` and `permanent_injury_2` slots.
- **Variants**: bust sprites come in "id triples": base, `_dead`, and `_injured` ("bloodied
  variant", `setBrush(getBrush().Name + "_injured")`) (guide).
- **Heads and hair**: `Const.Faces.AllHuman` lists `bust_head_01` to `_20` and `_34`, then female
  heads (`mod_legends/!!config/character_heads.nut`). Legends adds hair shapes `hair_<color>_21` and
  up, each in black, blonde, brown, grey and red.
- **Pools**: `Const.Beards` has `Tidy`, `Untidy`, `Raider`, `Monk`, `Southern`, `Zombie` and
  `Barber`. `Const.Faces` has `Berserker`, `NecromancerMale` and `OldFemale`. `Const.Hair` has
  `Berserker` and `WildMale` (`!!config/character_heads.nut`, `hooks/config/character_heads.nut`).
- **Injuries**: `permanent_injury_01` to `_03`, plus `injury_scarred` and `injury_burned` with
  `_african` and `_southern` skin variants and `_dead` twins (repo tree). A missing eye costs 50%
  ranged skill and 2 vision (`mod_legends/hooks/skills/injury_permanent/missing_eye_injury.nut`).

### 3.4 Darkest Dungeon
- **One look per class** [X]: per-hero visual upgrades would need art "prohibitively huge"
  (https://steamcommunity.com/app/262060/discussions/0/490121928351931621). Skins vary the look; mods
  on the same skin slot overwrite each other (https://steamcommunity.com/sharedfiles/filedetails/comments/2757947103).
- **Art direction** [X]: Bourassa wanted "flaws and imperfections" to be "both obvious, and
  appealing", used no "'dead gray' or black anywhere but in the inks", and kept the palette warm
  (https://www.gamespot.com/articles/the-gothic-sensibilities-of-darkest-dungeon/1100-6424880/).
- **Afflictions** [X]: at stress 100 a hero usually gains an affliction, rarely a virtue
  (https://blogs.tuni.fi/playlab/game-reviews/darkest-dungeon-stress-disease-and-desperation/). I
  found nothing on how the roster portrait shows one.

### 3.5 Old World: portraits that age
- **Interpolation** [X]: a March 2024 update added portrait interpolation, so characters age
  gradually instead of switching between "four fixed portraits" by age bracket. It also drives
  expressions from each character's opinion of the leader
  (https://www.gamedeveloper.com/press-release/old-world-s-latest-update-increases-character-immersion;
  https://gamespress.com/Old-World-portrait-interpolation-update).
- **Technique** [X]: the developer's write-up lists the old baby, youth, teen, adult and senior art.
  The new method morphs proportions and composites two portraits with transparency, with special
  cases for beards, hair, headwear and skin tones (https://asherburdick.carrd.co/).

### 3.6 Stellaris
- **Leaders** [X]: "the different types of leaders all use different sets of clothes"
  (https://admin-forum.paradoxplaza.com/forum/developer-diary/stellaris-dev-diary-6-rulers-and-leaders.888500/post-20136396).
- **Species** [X]: about 100 animated species portraits, and "the room behind them changes with the
  empire's guiding Ethos"
  (https://admin-forum.paradoxplaza.com/forum/developer-diary/stellaris-dev-diary-5-empires-and-species.887487/post-20107081).
- **Clothes rules** [X]: clothes follow "ethics, civics, government"
  (https://steamcommunity.com/sharedfiles/filedetails/changelog/2807625132?p=1); Paragons leaders
  got unique portraits (https://devtrackers.gg/stellaris/p/29434dfa-dev-diary-298-renowned-and-legendary-paragons).

### 3.7 Total War lord portraits
- **Cost** [X]: each Three Kingdoms portrait "is painstakingly drawn in Photoshop and takes an
  average of around eight days" (https://totalwar.com/?p=7501).
- **Variants** [X]: in Warhammer, non-legendary lord and hero types have "2-5 variants", and
  legendary lords have none (https://steamcommunity.com/sharedfiles/filedetails/comments/2985769307).
- **Aging** [X]: a Three Kingdoms modding guide sets art-set age thresholds at 0, 6 and 18
  (https://steamcommunity.com/app/779340/discussions/0/4521136333465571009). An Attila mod makes
  portraits "older or more weathered looking" at 3 and 6 stars
  (https://steamcommunity.com/sharedfiles/filedetails/changelog/3175487561?p=2).

### 3.8 Dominions: the sprite is the portrait
- **Sprites** [V]: the Dominions 6 Inspector has two images per unit (`images/sprites/0001_1.png`,
  `0001_2.png`; 4,388 of each) (https://github.com/larzm42/dom6inspector).
  - In a sample of 250 `_1` images, the median is 33×42 px and the 90th percentile 59×77. The widest
    is 123 px and the tallest 120.
  - I did not read the official manual's sprite commands (https://illwinter.com/dom5/modmanual.html)
    [X].
- **Prophets** [X]: "A prophet is always blessed, even on the strategic map", shown by a burning
  candelabra. "A few commanders have Prophet Shapes" (https://illwiki.com/dom5/prophet;
  https://illwiki.com/dom5/sacred).
- → FM: commanders read by body and gear first. The rig crop keeps that, and a bust adds a face.

### 3.9 Age of Wonders 4: ruler customization
All [X], via `pretender-design/research-aow4.md` 1.2 to 1.6:
- **Outfits**: each ruler type has its own slot set, and Wizard Kings have their own outfits.
  Champion clothes are culture-locked, which players criticize (https://aow4.paradoxwikis.com/Ruler;
  https://aow4.paradoxwikis.com/index.php?mobileaction=toggle_view_desktop&title=Faction).
- **Sliders and light**: body shape, head and hand size, a lighting toggle to preview
  (https://steamcommunity.com/app/1669000/discussions/2/501694090336840515).
- **Transformations** draw themselves and can be hidden unless they change movement
  (https://aow4.paradoxwikis.com/Race_transformation). Tall or winged rulers can lose their face in
  diplomacy crops (https://steamcommunity.com/app/1669000/discussions/0/5294588689502788157/).

### 3.10 Wartales
- [X] Only the starting party chooses face, hair, facial hair and skin; a barber kit later changes
  hair only (https://steamcommunity.com/app/1527950/discussions/0/3884976984036307631). Players
  report "after the latest patches my characters faces have changed randomly"
  (https://steamcommunity.com/app/1527950/discussions/0/5769715023489146931): the risk in 5.5.

## 4. How a portrait can show state (→ FM)

| State (FM source) | Seen in | → FM layer | Sizes |
|---|---|---|---|
| Nation (`owner`) | CK2 culture sets [V]; Stellaris room [X] | nation part set (docs/09: Cinder ash-grey skin, scale armor; Thornwood bark armor, leaf cloaks); banner color on the frame band and tint zone | all |
| Type (`unit`) | BB pools [V]; Stellaris clothes [X] | headgear and collar per type: scout hood, chieftain or captain helm, priest hood with symbol, adept circlet, magus tall hood | all |
| Rank (leadership, mage tier) | CK2 `TitleRank` frame [V] | frame ornament: plain (scout), bronze (adept, priest), brass (chieftain, captain, magus), gilded (pretender) | frame |
| Magic paths (`pips`) | AoW4 attunement glow [X] | pip ring (UI 2.8.2); at 2+ pips, eyes or a sigil in the dominant color, never the backdrop (docs/09: mana colors only on what carries them) | ≥64 |
| Holiness (`holy`) | Dominions candelabra [X] | holy mark on the frame (UI spec); priest symbol on the collar | frame |
| Prophet (`prophetId`) | Dominions "always blessed" [X] | halo behind the head (docs/09 role icon) with a candle-flame rim | all |
| Pretender (`pretenderId`) | CK2 crown, scepter [V] | the rig portrait (B.8), crown badge, awakening overlays | all |
| Wounded (`hp`/max) | BB `_injured` [V]; CK2 blood [V] | bandage below 50% HP; blood and a darker vignette below 25%; both go as HP returns | ≥64 |
| Afflictions (M2) | CK2 eyepatch, scars [V]; BB overlays [V]; fan view [X] | eyepatch for Lost an Eye; scars in 3 placements for Battle Scars; Limp and Weakened Arm as frame glyphs only | ≥64; glyph at 32 |
| Experience (`battles` hook; M2 renown) | Attila mod [X]; Old World [X] | weathering: at 3 battles a scar line and grey temples, at 8 greyer hair; renown stars on the frame | ≥128 |
| Starving, unpaid | — | status glyphs on the frame (docs/09), not the face | frame |
| Out of sight (docs/01 §14) | — | the last-seen portrait, desaturated, with a dotted border (docs/09 fog pattern); stealthy scouts never show | panels |
| Dead | — | greyscale with a corner ribbon, in reports and history | reports |

→ FM: the seed picks who a commander is (face, hair, beard, marks). State picks overlays, frame and
badges, and never the face, so it reads as "my Ash Chieftain, now wounded". That is also why one
raster image per face covers every state (6.6).

## 5. Seeded procedural SVG portraits

### 5.1 The seed
- **Hash** [V]: DiceBear's `Fnv1a.hash` uses basis `0x811c9dc5` and prime `0x01000193` over UTF-16
  code units.
- **PRNG** [V]: `Mulberry32` follows Tommy Ettinger's C reference
  (https://github.com/dicebear/dicebear/blob/11.x/src/js/core/src/Prng/Fnv1a.ts, `Mulberry32.ts`).
- **Keyed draws** [V]: `Prng.getValue(key)` is `new Mulberry32(Fnv1a.hash(this.#seed + ':' +
  key)).nextFloat()`. Per the code comment, "the same seed + key always yields the same result,
  regardless of call order". `pick` sorts items by code point first (`src/js/core/src/Prng.ts`).
- **Docs** [V]: "Every decision the renderer makes, which hair, which eyes, which color, draws from
  this generator", and the PRNG "is **not** cryptographically secure"
  (https://github.com/dicebear/dicebear/blob/11.x/apps/docs/pages/understand/how-avatars-are-made/index.md).
- → FM: `portraitSeed = ${state.seed}:${commander.id}`, with each slot drawn under its own key, so a
  new slot moves nothing else. It is render-only: `src/sim` and `state.rng` are untouched, so
  replays, saves and the determinism test are unaffected. Ids come from a monotonic counter
  (`src/sim/ids.ts`), so a reload shows the same face.

### 5.2 Part library and layer order (→ FM)
- **Back to front**, merging CK2's behind, mid and front split [V] with pretender B.8: backdrop;
  back hair, cloak and headgear behind; shoulders and clothes (type × nation, `currentColor` =
  banner); head shape (skin ramp); eyes and brows; nose and mouth; marks (tattoo, warpaint); state
  scars and wounds; beard; front hair; headgear; state overlays (eyepatch, bandage, blood, magic
  eyes, halo); frame (rank ornament, pip ring, badges).
- **Grid**: parts are drawn on B.8's 256-unit grid, with fixed anchors at the eye line, crown, chin
  and collar. Strokes marked `data-lod="portrait"` drop below 128 px [V].
- **Rigs**: the Salamander, the Treant and pretenders use their rig's `portrait` pose (B.8). The
  seed varies only their markings and scars.

### 5.3 Palette swaps
- **CK2** [V]: `HairPixelShader` blends dark to base by `green * 2`, then to highlight by
  `(green − 128) * 2`, and keeps alpha
  (https://github.com/scorpdx/portraitbuilder/blob/master/src/PortraitBuilder.Shared/Engine/PortraitRenderer.cs).
- **Battle Brothers** [V]: pre-colored files (`hair_black_21`, `hair_red_21`, ...) multiply hair
  files by 5.
- **Multiavatar** [V]: parts "are in grayscale, since the color is applied later by the script"
  (https://raw.githubusercontent.com/multiavatar/Multiavatar/main/README.md).
- → FM: draw hair, beard and skin in three flat tones mapped to `--ramp-dark`, `--ramp-base` and
  `--ramp-light`. The seed picks a ramp from the nation's list:
  - Cinder skins run ash-grey to soot, with ember-crack accents.
  - Thornwood skins run bark brown to a pale-blossom undertone.
  - About 5 hair ramps per nation.

### 5.4 Pools by nation and type
- **Precedent** [V]: Battle Brothers' role pools keep a raider's beard off a monk (3.3). CK2 swaps
  whole outfits by government (3.1).
- → FM: `PORTRAIT_POOLS[nation][unit]` is content data: part ids per slot, with optional weights.
  - Pyre Priest example: `head: ash 1-6`, `beard: braided 1-5 | none`, `headgear: ember hood 1-3`,
    `mark: soot stripes 1-4 | none (40%)`.
  - The Independent Captain uses a shared human set. Its outfit follows the province's terrain
    (`INDEPENDENT_POOLS` is keyed by terrain), so a swamp captain wears reeds.

### 5.5 Stability across content updates
- **`hash % n`** [calc]: growing a slot from 8 to 9, 12 to 13 or 20 to 21 parts changes 89.4%,
  92.5% and 95.0% of 5,000 picks. CK2's `letter % frameCount` behaves the same (3.1) [V].
- **Rendezvous hashing** [calc]: score each part as `value(seed, slot + partId)` and keep the best.
  It changes 11.3%, 7.9% and 5.4% of picks (theory: 1/(n+1)).
- **Players notice** [X]: Wartales (3.10).
- → FM: string part ids, append-only tables (pretender B.12 already tests "code tables are
  append-only") and rendezvous picks keep about 90% of faces across an art update; 100% needs 5.7.

### 5.6 Part counts that avoid visible repeats
- **Raw counts overstate variety** [V]: DiceBear Adventurer 9.2.2 has 26 eyes, 15 eyebrows, 30
  mouths, 45 hair, 5 glasses, 6 earrings, 4 features and one base head, so 500,000+ faces on one
  head shape (https://registry.npmjs.org/@dicebear/adventurer/-/adventurer-9.2.2.tgz,
  `lib/components/*.js`). Multiavatar counts 48^6 but calls eyes and mouths "still similar" (5.3).
- → FM: count the silhouette. Commanders of one nation and type are compared side by side at 32 to
  64 px (outliner, strip, docks), where only headgear or hair silhouette, beard, face shape and a
  strong mark read. Eyes and mouths give life at 128 to 256 px, not identity.
- **Birthday math** [calc]: minimum distinct salient looks k for group size g.

| g (same nation and type) | P(repeat) ≤ 50% | ≤ 25% | ≤ 10% |
|---|---|---|---|
| 4 | 10 | 23 | 59 |
| 8 | 43 | 100 | 269 |
| 12 | 100 | 234 | 631 |
| 20 | 281 | 667 | 1,810 |
| 58 (independent captains) | 2,405 | 5,766 | 15,709 |

- **Full looks** [calc]: with 100,000 equally likely full looks, P(any identical pair) is 0.4% for
  30 commanders, 1.8% for 60, 5.8% for 110.
- **Proposed library** [calc], P(any salient repeat) at g = 8 / 12 / 20:
  - Helmeted chieftain or captain: helm 3 × beard 8 × face 6 × mark 5 = 720 → 3.8% / 8.8% / 23%.
  - Bare-headed priest or mage: hair 11 × beard 8 × face 6 × mark 5 = 2,640 → 1.1% / 2.5% / 7.0%.
  - Hooded scout: hood 3 × beard 8 × face 6 = 144 → 18% / 38% / 75% (scouts are mostly alone).
- → FM M1 budget, about 120 small SVGs plus 8 state overlays and 5 frame ornaments: shared (about
  46) 6 heads, 6 eye and brow sets, 6 nose and mouth sets, 11 hair with bald, 8 beards with none, 3
  scars; per nation (about 34) 4 marks, 3 to 4 headgear per type × 5 types, 2 collars per type;
  independents (about 7) 4 helms and 3 terrain outfits.

### 5.7 The deck alternative (stored ordinal)
- **Problem**: hashing cannot stop repeats in big groups. 58 captains over 576 looks repeat in 95%
  of games [calc].
- → FM fix: the sim stores `lookIndex` at creation, from a per-(owner, unit) counter in
  `createCommander`. It is deterministic and needs no rng. The renderer reads entry `lookIndex` of
  a permutation seeded by `${state.seed}:${owner}:${unit}`. The first k commanders of a type are
  then all distinct, and a low-discrepancy walk spreads later cycles.
- **Cost**: a sim field, a save migration and a determinism-hash update (the units track's R9
  pattern). A render-only ordinal fails: ranks among the living shift when one dies. → FM: M1
  hashes; add `lookIndex` in Phase 11 if playtests show repeats among independents.

### 5.8 Sizes and level of detail (→ FM)
- **Sizes**: 256 px for the Commander panel header and designer; 128 for cards and reports; 64 for
  the strip, docks and pip ring; 32 for the outliner's "portrait dot" and entity links.
- **At 32 px** draw only the backdrop, head shape, hair or headgear silhouette, beard, and halo or
  crown. The frame glyph carries the rest, per docs/09: "States are corner badges drawn on top ...,
  never new silhouettes".
- **Rendering**: compose once per (commander, state hash, size) into a cached SVG string or a Pixi
  texture (the battle final already has `RigTextures.portrait: Texture`).

## 6. Owner raster portraits as a premium layer

### 6.1 Resolution order (→ FM)
1. A raster set for the (nation, unit) with at least `minPool` images (default 8), picked with
   the 5.1 seed; 2. the procedural portrait (section 5); 3. docs/09's silhouette with a nation tint.
- **Never mix within a type in one game**: two Ash Chieftains must not look as if from different
  games. Total War's 2-5 variants per type (3.7) [X] show that too few is worse than none.
- **Pretenders** keep the composed rig portrait (B.8) so cosmetic choices show; a raster "god card"
  can be an optional designer splash.

### 6.2 Style brief for the owner (one page, reused verbatim)
- **Shot**: head-and-shoulders bust, three-quarter view, facing screen-right. Eyes 38% to 40% from
  the top, crown at 8% to 10%, cut mid-chest. One figure; no hands, text, border or signature.
- **Light**: one warm candle key from the upper left, about 1850 to 1900 K (#FF8100 to #FF8400,
  `research-tabletop.md` 4.3 [calc]). A dim warm fill, and a near-black warm background near
  #1C1A17 (`--chrome-0`) to match the tavern war table.
- **Medium**: painterly oil or gouache on wood, moderate detail. Readable at 64 px: a strong
  headgear shape and value contrast between face and ground.
- **Nations** (docs/03, docs/09): Cinder Horde, ash-grey skin, soot and ember marks, scale armor,
  charcoal and hot white with ember accents; Thornwood, bark armor, leaf cloaks, moss, bark, blossom.
- **Mana colors** appear only on a mage's eyes or sigil, matching the pips. A candle tone,
  Carolling Candlelight #FFB850, is ΔE 1.5 from R Ember's accent #FFB347 (`research-tabletop.md`
  section 5, mana clashes [calc]). A
  red mage's glow must use the brighter #FD6533 on a cooler shadow, or it reads as candlelight.

### 6.3 Keeping a set coherent
OpenAI's image prompting guide [V]
(https://github.com/openai/openai-cookbook/blob/main/examples/multimodal/image-gen-models-prompting-guide.ipynb,
commit 293fc83, 2026-10-20). It targets the API models; its advice carries over to ChatGPT.
- **Order**: "background/scene → subject → key details → constraints", plus the intended use.
- **Edits**: "use 'change only X' + 'keep everything else the same,' and repeat the preserve list
  on each iteration to reduce drift". Inputs are named "by index and description".
- **Anchor**: a reusable "character anchor" "ensures visual continuity across scenes"; close-up
  portraits deserve `medium` or `high` quality.
- → FM workflow: (1) one approved **style anchor** portrait; (2) every prompt attaches it as "Image
  1: style reference", pastes the 6.2 brief, then a 3-line subject block (nation, type, seeded
  traits such as "braided beard, soot stripes, ember hood"); (3) the owner reviews a contact sheet
  at 64 and 128 px; (4) a script flags outliers in mean luminance, warmth (R − B) and face-box
  position (luminance centroid) against the set median.

### 6.4 Sizes, formats, names
- **Generation sizes** [V] (guide above): `gpt-image-1`, `-1.5` and `-1-mini` take `1024x1024`,
  `1024x1536`, `1536x1024` or `auto`. `gpt-image-2` takes any size with edges in multiples of 16,
  a long edge under 3840 and a ratio up to 3:1. Its transparent backgrounds are "in preview".
- **Format** [V]: MDN calls WebP an "excellent choice". AVIF compresses slightly better but needs
  `<picture>` fallbacks
  (https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/media/guides/formats/image_types/index.md).
- → FM generation: generate at 1024×1536 or 1024×1024 on the dark ground. No transparency is
  needed, because the frame masks the bust. Keep the original PNG, crop a 1024² master to the 6.2
  framing, and derive 256, 128 and 64 px WebP.
- → FM files: `src/assets/portraits/<nationDef>/<unitId>/<nn>.webp` (e.g.
  `cinderHorde/ashChieftain/03.webp`), extending docs/09's SVG-only delivery rule. A sidecar
  `<nn>.json` holds source name, sha256 of the original, tool and model as ChatGPT shows them, date,
  prompt, edits, C2PA present or not, and approver. `manifest.ts` lists sets per (nation, unit) with
  `minPool`; content validation fails on a missing size or sidecar.

### 6.5 Intake pipeline (feeds task 29)
1. The owner drops PNGs into `art-inbox/portraits/<nation>-<unit>-<anything>.png`.
2. A Node script outside `src/sim` writes sidecars, crops, makes the WebP sizes and runs the 6.3
   checks.
3. It writes a contact-sheet HTML. On approval, the files move to `src/assets/portraits/`.
4. Originals stay out of the bundle, for provenance.

### 6.6 State on raster portraits (→ FM)
- **Problem**: raster faces do not share the SVG anchors, so face overlays (eyepatch, scars, blood)
  would float.
- **Frame-only state**: on raster portraits, state shows on the frame: halo or crown above the
  edge, a wound vignette and cracked-heart glyph, affliction glyphs, the pip ring, the rank ornament.
- **Exception**: an image whose sidecar has hand-set `"anchors": {eyeL, eyeR, crown}` may take face
  overlays.

### 6.7 Provenance and licensing (not legal advice)
- **Ownership** [X]: OpenAI's terms say users own Output "to the extent permitted by applicable
  law", with OpenAI assigning "all its right, title, and interest, if any". They add that output
  "may not be unique" (https://openai.com/policies/row-terms-of-use/revisions/2024-12-11/).
- **Copyright** [X]: the US Copyright Office's Part 2 report (January 29, 2025) says prompts alone
  are not protected, while perceptible human authorship or creative arrangement can be
  (https://copyrightalliance.org/ai-report-part-2-copyrightability/). The D.C. Circuit upheld the
  human-authorship rule on March 18, 2025, in *Thaler v. Perlmutter*
  (https://www.crowell.com/en/insights/client-alerts/dc-circuit-rejects-copyrightability-of-artwork-created-autonomously-by-ai).
  → FM: raster faces may be copyable; the procedural system, frames and overlays stay the game's
  human-authored identity.
- **Steam** [X]: since January 10, 2024, the Content Survey asks about "pre-generated" AI content
  and shows the disclosure on the store page
  (https://www.gamingonlinux.com/2024/01/valve-announces-new-rules-for-games-with-ai-content-on-steam/;
  https://partner.steamgames.com/doc/gettingstarted/contentsurvey). The sidecars make it easy to
  fill in.
- **Provenance marks** [X]: ChatGPT images carry C2PA metadata and SynthID watermarks, and the
  metadata "can be removed accidentally or on purpose"
  (https://help.openai.com/en/articles/8912793-c2pa-in-chatgpt-images). WebP conversion likely
  drops it. → FM: keep originals and their sha256.
- **Prompts** [X]: OpenAI's March 2025 system card refuses prompts "in the style of a living
  artist" (https://www.infoq.com/news/2025/04/gpt-4o-images;
  https://openai.com/index/gpt-4o-image-generation-system-card-addendum/). → FM: the brief names no
  artists, studios, real people, other games or insignia.

## 7. Recommendations for the design stage (→ FM)

1. Seeded part portraits for every commander (5.1, 5.5), render-only in M1; `lookIndex` later (5.7).
2. Content: `PORTRAIT_POOLS[nation][unit]`, ramps, overlay ids per state, frame ornament per rank
   tier; every commander type in the content validation fixtures (5.4).
3. State drives overlays and the frame, the seed drives the face (4). M1: rank frame, pip ring, holy
   mark, halo, crown, HP bandage and blood, fog. M2: afflictions, weathering, renown.
4. About 120 parts plus 13 overlays and frames (5.6); LOD at 256, 128, 64 and 32 px (5.8).
5. Raster sets only when complete per (nation, unit), following 6.2 to 6.6.
6. `Portrait` gains `commander?: CommanderId`, passed at every call site.
7. Tests: same seed and id give the same SVG; adding a part changes at most about 1/(n+1) of 1,000
   ids; every pool id exists; overlays stay inside the frame at every LOD; raster entries have
   every size and a sidecar.

## 8. Open questions for the owner

- Do portraits face screen-right everywhere, or mirror by side in battle docks?
- Should faces weather with battles (this needs the `battles` counter), or stay fixed?
- Which raster sets come first? Chieftains, captains and priests are seen most; scouts rarely.
- Should commanders get seeded personal names, with "Ash Chieftain" as the title? Names do half
  the work of telling leaders apart.
