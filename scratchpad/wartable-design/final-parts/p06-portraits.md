## 5. Leader portraits

"Leaders certainly need portraits." Every commander gets one. A portrait is a person: the seed
picks the face, and state picks only overlays and the frame. "Varo, now wounded" is still Varo.

### 5.1 Who gets which portrait

| Commanders | Portrait | What the seed varies | Count on Medium |
|---|---|---|---|
| National commanders: Cinder Scout, Ash Chieftain, Pyre Priest, Ember Adept, Cinder Magus; Thorn Scout, Warden Captain, Grove Priest, Sapling Druid, Elder Druid | a **bust** from parts (5.3) | head, eyes, nose and mouth, hair, beard, marks, headgear variant, skin and hair ramps | 5 to 30 per nation over a game |
| Independent Captains | a **bust** from a no-repeat deck keyed by province (5.4), outfit by the terrain it guards | as above | 58 at game start |
| Pretenders (every chassis) | the rig in its **portrait pose** with the god's look (pretender B.8) | nothing: the look is chosen in the designer and kept in the UI block (B.2) | 1 per nation |
| Summoned commanders (Salamander, Treant; M2 summons) | their rig's portrait pose | markings and scars only | a few |
| The garrison holder | the fort emblem, never a face | — | 1 per fort |
| Until Phase 11's parts exist | the code-path bust (5.3), else docs/09's archetype silhouette on the banner backdrop | — | — |

### 5.2 One anchor grid (R25)

Every portrait, procedural or raster, shares one 256-unit grid:

| Anchor | y (of 256) | Share of the height |
|---|---|---|
| Crown (top of the head or headgear) | 23 | 9% |
| Eye line | 100 | 39% |
| Chin | 169 | 66% |
| Collar (cut at mid-chest below it) | 200 | 78% |
| Face axis | x 120 | three-quarter view, facing screen right |

- The SVG busts' parts are drawn on it.
- The pretender's B.8 portrait pose places its **focus line** (the eyes, or the glyph center of
  the Living Monolith) at y 100, with the silhouette's top at y 12 or lower.
- The raster style lock (Art prompt pack, P0) asks for the same proportions, and the intake
  script's crop maps the detected eye line to y 100.
- Strokes marked `data-lod="portrait"` drop below 96 px.

### 5.3 The layered SVG system

**Layers, back to front:**
1. backdrop: the banner darkened 35% with a radial vignette (docs/09's "colored backdrop");
2. hair, cloak and headgear parts that sit behind the head;
3. shoulders and clothes by type and nation, with a `currentColor` tint zone in the banner color;
4. neck;
5. head shape, in the skin ramp's three tones;
6. ears;
7. eyes and brows (a mage's eye glint here);
8. nose and mouth;
9. marks (soot stripes, ember cracks, bark whorls, moss);
10. scars;
11. beard;
12. front hair;
13. headgear;
14. a head item's `crown` part, over the headgear (units design D.9), never replacing it;
15. state overlays (5.6);
16. the frame, its band, badges and the gear chip (5.5, 5.6);
17. the pip ring on its separation ring (5.5).

**Parts** (M1, about 116 small SVGs in Phase 11; Phases 8 to 10 draw the same slots as code paths
in `proceduralPortraitParts`, as the battle rigs are placeholders until Phase 11):

| Slot | Shared | Cinder Horde | Thornwood | Independents |
|---|---|---|---|---|
| Head shape | 6 | — | — | — |
| Eyes and brows | 6 | ember glint for mages with 2 or more R pips | green glint for 2 or more G pips | — |
| Nose and mouth | 6 | — | — | — |
| Hair (bald included) | 11 | topknot, shaved sides (2) | braids with leaves (2) | — |
| Beard (none included) | 8 | braided with rings (2) | moss-tangled (2) | — |
| Scars | 3 | — | — | — |
| Marks | — | soot stripes, ember cracks (4) | bark whorls, moss (4) | — |
| Headgear, 3 per type | — | scout ash hood, chieftain horned helm, priest ember hood with a flame clasp, adept ember circlet, magus tall cowl | scout leaf hood, captain bark helm with antler stubs, priest wreath crown, druid twig circlet, elder antler hood | 4 helms |
| Collar, 2 per type | — | scale plates, robe, cowl | bark mail, leaf cloak, robe | 4 outfits by terrain: levy (plains, farmland, wasteland), hunter (forest), mountaineer (hills, mountains), reedman (swamp) |
| Skin ramps (three tones each) | — | 4 around the battle sprite's ash grey #8F8C88 | 4 around bark tan #A0785A | 5 human ramps |
| Hair ramps | 5 per nation | | | |

Totals: shared 40, Cinder 34, Thornwood 34, independents 8; plus 12 overlays, frame ornaments and
3 frame shapes. **Phase 8's v0** is about 40 code-path parts: head shapes, hair or headgear per
type, beards, the frame.

**Pools are content.** `PORTRAIT_POOLS[nationDef][unitId]` and `PORTRAIT_POOLS.independent`
(`src/content/presentation/portraits.ts`) list part ids per slot with optional weights, and the
ramps. Every commander unit has a pool or appears in `PORTRAIT_RIG_UNITS`. The content
validation fixtures enforce it (CLAUDE.md: when adding a unit, add it to the fixtures).

### 5.4 Seeding

- **One hash** (R13): every draw is `hash32('portrait', seed, commanderId, slot, ...)` from
  `src/present/rand.ts`. Each slot draws under its own key, so adding a slot moves nothing else.
- **Weighted rendezvous:** in each slot, every part `p` scores `−ln(u) / weight`, with
  `u = (hash32('portrait', seed, commanderId, slot, p.id) + 0.5) / 2³²`, and the lowest score
  wins. Part tables are **append-only** with string ids; a content test pins them against a
  committed snapshot. Adding a part changes about 1/(n + 1) of picks, against 92.5% for
  `hash % n` (`research-portraits.md` 5.5), so an art update keeps about 90% of faces.
- **Repeats among a nation's commanders** (salient look: headgear or hair, beard, head shape,
  one strong mark): helmeted types have 720 salient looks, so P(any repeat among 8) is 3.8%;
  bare-headed types have 2,640, so 1.1% (`research-portraits.md` 5.6).
- **Independent Captains: a deck, no state.** Their ordinal is the rank of their province in a
  permutation of province ids seeded by `hash32(seed, 'indep')`. The ordinal decodes in mixed
  radix into (helm 4, beard 8, head 6, scar 4) = 768 looks, with a seeded offset per game. The
  largest map has 126 captains, so no game repeats one. Independents never move, so the province
  is their identity.
- **Stable everywhere.** Commander ids are monotonic and saved; portraits never read
  `state.rng`. A reload, a lost WebGL context or a load from the save shows the same face.
  Replays, saves and the determinism test are untouched.
- **Pure composition.** `portraitSpec(input, size)` in `src/present/portrait/spec.ts` returns
  part ids, ramps, overlays, badges and frame; `portraitSvg(spec, parts)` builds an SVG string.
  `Portrait.tsx` (`src/ui/components/`) renders it inline and memoizes on `spec.key`;
  `src/render/portraits.ts` turns the same SVG into a cached Pixi texture for the replay docks,
  name cards and map tooltips.

```ts
// src/present/portrait/spec.ts (pure; guarded with src/present)
export interface PortraitInput {
  gameSeed: number;
  commanderId: CommanderId;
  unit: UnitTypeId;
  nationDef: NationDefId | null;            // null: Independents
  banner: string;
  allegiance: 'own' | 'other' | 'independent';
  hpFrac: number;
  pips: Pips; holy: number;
  roles: { pretender: boolean; prophet: boolean; scout: boolean; stealthy: boolean };
  starving: boolean; unpaid: boolean;
  gear: { count: number; bestTier: 0 | 1 | 2 | 3 };   // units design D.2; 0 = none
  headItem: ItemId | null;                  // its crown part, over the headgear
  guardTerrain: TerrainId | null;           // independents: the province they hold
  deckOrdinal: number | null;               // independents
  seen: 'live' | 'lastSeen' | 'dead';
}
export type PortraitSize = 16 | 24 | 28 | 40 | 48 | 64 | 96 | 128 | 256;
export function portraitSpec(input: PortraitInput, size: PortraitSize): PortraitSpec;
export function portraitSvg(spec: PortraitSpec, parts: PartLibrary): string;
```

### 5.5 Frames: allegiance by shape, rank by material

- **Shape follows the army token** (staged spec 2.10.4), so allegiance never relies on hue: own,
  round; other nations, round with 8 notches; independents, a plain rounded square.
- **Band:** a 3 px band in the owner's banner (independents #8C8A80) with a `keylineFor(banner)`
  keyline, so ownership shows at every size.
- **Rank by material and ornament** (`PORTRAIT_RANK[unit]`, content; R21):

  | Rank | Units | Frame |
  |---|---|---|
  | 0 | scouts | plain oak #8C6A47 |
  | 1 | priests, adepts, the Sapling Druid | bronze #8C6A43 with 4 square rivets |
  | 2 | Ash Chieftain, Warden Captain, Cinder Magus, Elder Druid | aged brass #B8914A with corner brackets |
  | God | the pretender | aged brass with a 1 px gilt highlight (#D4B26A), a crown notch at the top and the god's sigil in a corner (pretender B.7) |
  | Independent | Independent Captains | pewter #91A092 |
  | Bound | summoned commanders | elemental: ember-iron #4A4440 with a static ember seam (Salamander), living root #6B4A2B with leaves (Treant) |

- **The pip ring** (staged spec 2.8.2: one mana symbol per pip, "R6" past 6) sits on a 2 px
  `--chrome-0` ring outside any metal frame, so a mana symbol never touches brass or gilt (R20).
- **Badges:** at most 3 at once, by priority: role (pretender or prophet), wound, supply or pay,
  holy, gear.

### 5.6 State overlays (from existing state)

State never changes the face; a test checks that the face layers are identical with and without
each state.

| State | Source | 96 px and up | 48 to 72 px | 40 px and below |
|---|---|---|---|---|
| Wounded (HP at most 50%) | `hp`, the unit's max | a bandage across the brow | bandage | the cracked-heart corner glyph (docs/09) |
| Badly wounded (at most 25%) | same | blood, and the backdrop 20% darker | blood | the filled cracked heart |
| Starving | `starvedDays` | crossed-wheat corner glyph | glyph | glyph |
| Unpaid | the nation's unpaid counter | crossed-coin corner glyph | glyph | — |
| Prophet | `nation.prophetId` | a halo behind the head with a candle-flame rim | halo | a halo ring above the frame |
| Pretender | `nation.pretenderId` | the rig portrait, the crown badge, the god's frame; awakening overlays per B.8 (dormant: closed eyes; imprisoned: runic chains) | same | crown badge |
| Mage pips | `pips` | the pip ring; at 2 or more pips, an eye glint in the dominant color's accent (Ember #FFB347, Loam #A6D96A) | ring and glint | one dot of the dominant color |
| Holy | `holy` | the holy mark on the frame's foot | mark | dot |
| Scout, stealthy | unit tags | eye or hood badge (docs/09) | badge | badge |
| Gear | equipped items (units design D.2) | the **gear chip**: the count and the best tier's shape (○ ◆ ★) on the frame's lower right | chip | — |
| Head item | the equipped head item | its `crown` part over the headgear (D.9) | same | — |
| Out of sight (an enemy) | not in `visionOf` | the last-seen portrait, desaturated 70%, in a dotted frame (docs/09's fog pattern); a stealthy commander never shows | same | dotted ring |
| Dead (reports, history, victory screen) | the battle record or summary | greyscale with a black corner ribbon | same | — |
| Afflictions, renown (M2, units design) | new state | eyepatch, scars from anchors; renown stars | glyph | — |

Mana colors appear only on what carries them: the pips and a mage's eyes (docs/09).

### 5.7 Where portraits appear, and how large

| Surface | Size | Notes |
|---|---|---|
| Commander panel header | **96** with the pip ring | the staged spec says 64; leaders deserve faces |
| Bottom strip | 64 (76 with the ring) | a click opens the Commander panel (unchanged) |
| Outliner rows | 24 | the "portrait dot": head and headgear silhouette |
| Entity links in text and the feed | 16 | the head only |
| Commander and army hover tooltips | 48 | in the header |
| Province panel, Forces tab | 40 | own commanders and seen enemies |
| Battle report card, commanders' fates | 40 | the dead in greyscale with the ribbon |
| Replay docks, name cards, result card | 64, 128, 64 | the bust for national and independent commanders; pretenders and summons keep their rig portraits (5.9) |
| Codex unit pages | 128 | the seed `codex:<unitId>`, a type preview |
| Victory screen | 128 | the pretender and the three commanders with the most battles |
| Top bar nation button | 28 | the pretender (the mini portrait the staged spec names) |
| Pretender designer, `PretenderCard` | 256, 128 | B.8 |
| Fanned stack tokens (M1-should) | 20 | a dot above each fanned token |

**Level of detail:** 96 px and up, everything; 48 to 72 px, eyes become dots and fine strokes
drop; 40 px and below, the silhouette (backdrop, head, hair or headgear, beard), the frame and at
most one badge; 24 px and below, the head and headgear only.

### 5.8 Personal names (M1-should; R4)

- **Display:** the personal name, then the unit as a title: "Varo, Ash Chieftain". Pretenders
  keep `NationState.pretenderName` (pretender D7). Summoned commanders keep their unit's name
  ("the Salamander").
- **National commanders:** `assignNames(prev, state, seed)` (`src/present/names.ts`, pure). For
  each commander id in `state` without a name, in id order, it takes the next unused name from
  its nation's deck: `COMMANDER_NAMES[primaryColor]` shuffled by `hash32(seed, nationId,
  'names')`. When a deck runs out, names repeat with a numeral ("Varo II"). The game loop calls
  it after every simulated day; the UI block stores the result, so a name never changes, even
  after its bearer dies.
- **Independent Captains:** a name from `COMMANDER_NAMES.independent`, by the same province
  permutation as their portrait deck, with the province as a title: "Brannoc, Captain of Ashfen".
  Pure, nothing stored.
- **Content** (`src/content/presentation/names.ts`): at least 120 names per color, built in the
  pretender track's syllable style (B.6) but kept apart from god names. Ember: harsh and short
  (Varo, Kesh, Ondra, Dravik, Ulrek); Loam: soft (Ilsa, Bren, Maelor, Tamsin, Wyn); independents:
  plain (Brannoc, Hedda, Osric, Marta).
- **Messages:** sim message text keeps unit names ("Ash Chieftain recruited in Kharnath."). The
  feed renders a message's commander `refs` (staged spec) as a portrait dot and the name.
- **Tests:** the same commanders on the same days get the same names; no two living commanders of
  a nation share a name before the deck runs out; a save round trip keeps every name.

### 5.9 Harmony with the sibling tracks

- **Battle** (now `docs/12-battle-presentation.md` in the repository): two lines change (exact
  text in "Docs text"). S4.4's "Portraits for name cards and docks are the rig in its idle pose
  at 2×, on the banner color" and S6.2's "Portraits for name cards and docks come from the same
  SVG at 2×" both become the commander's portrait from docs/09 "Leader portraits", with
  pretenders and summoned commanders keeping their rig in its portrait pose. The roster
  component's image source changes in S6.1. The replay modal takes the oak and brass frame
  (2.8).
- **Pretender** (`pretender-design/final.md`): B.8 portraits are framed with the god's frame;
  their focus line follows the anchor grid (one line in B.8); C.4 marks change as R26 asks; the
  B.7 sigil sits on the god's frame corner, the band corner and the capital's pennant.
- **Units and items** (`units-items-design/final.md`): the gear chip on the frame (D.2); a head
  item's part drawn over the headgear (D.9); the artifact star on army tokens stays M2 (S3), with
  its corner reserved (R10).

### 5.10 The owner's raster layer (ChatGPT images)

- **Order of use** per (nation, unit):
  1. a complete raster set: at least 8 approved images (12 for each independent outfit), picked
     by rendezvous over the set's file ids with the same `seed:commanderId` key;
  2. the procedural bust;
  3. the archetype silhouette.

  Types never mix within one game: two Ash Chieftains must not look as if they came from
  different games. Pretenders keep their composed rig portrait.
- **State on raster faces is frame-only:** the halo or crown above the frame, the wound vignette
  and glyph, the pip ring, the rank frame, badges and the gear chip. A sidecar with hand-set
  `anchors: { eyeL, eyeR, crown }` may opt in to face overlays.
- **No banner wash in raster art.** A raster portrait serves every nation of its type, and a
  second Cinder Horde has another banner; the frame's band carries the banner.
- **Sizes:** generate 1024 × 1024. The intake keeps a 512 px master WebP outside the bundle
  (`art-source/portraits/`) and ships a 256 px WebP (≤ 24 KB) and a 64 px WebP (≤ 4 KB) in
  `src/assets/raster/portraits/<nationDef>/<unitId>/<nn>.webp`. Other sizes are downscaled from
  the 256 at load.
- **Inbox name:** `art-inbox/portraits/<nationDef>__<unitId>__<anything>.png`.
- **Intake** (`scripts/art-intake.ts`, Node, outside the pure folders; Phase 9):
  1. hash the original (SHA-256);
  2. find the face box from the luminance centroid and the eye line, and crop so the eye line
     lands at 39% and the crown near 9% (the owner confirms on the contact sheet);
  3. write the sizes;
  4. flag outliers against the set's median in mean luminance, warmth (R − B) and face-box
     position;
  5. flag an image whose 99th-percentile chroma is above C\* 45 outside the eyes (a mana-like
     glow);
  6. write `art-inbox/contact.html`: the set at 256, 64 and 24 px on oak and on `--chrome-0`;
  7. on the owner's approval, move the files and write the sidecar.
- **Sidecar** `<nn>.json`: source file name and the original's SHA-256; tool and model as
  ChatGPT shows them; date; the full prompt and edits; whether C2PA metadata was present
  (ChatGPT images carry it, WebP conversion drops it); the approver.
- **Manifest:** `src/assets/raster/manifest.ts` lists each set with its count; content validation
  fails on a missing size or sidecar. An incomplete or invalid set is ignored whole.
- **Provenance:** prompts alone may not be protected by copyright in the US
  (`research-portraits.md` 6.7). The procedural system, frames and overlays stay the game's own
  identity, and the sidecars answer a store's AI-content questions.

### 5.11 Tests

- `tests/present/portrait/spec.test.ts`:
  - the same input gives the same spec and SVG; different commander ids differ in at least one
    salient slot for at least 90% of 100 pairs;
  - adding one part to a slot changes at most 1/(n + 1) + 3% of 1,000 seeded picks;
  - Independent Captains on Medium seeds 1 to 5 never share a salient look;
  - state (HP, roles, starving, gear, head item) never changes the face parts, only overlays,
    badges, the crown part and the frame;
  - at 40 px the spec holds no `data-lod="portrait"` part and at most one badge;
  - the pip ring always has its separation ring.
- `tests/content/portraits.test.ts`: every commander unit of every nation has a pool or a rig
  portrait; every pool id exists; part tables are append-only; every raster set has both sizes
  and a sidecar, or is ignored.
- `tests/ui/derive/fog.test.ts`: an out-of-sight commander's portrait uses its last-seen state
  and never reveals its HP.
- UI smoke test (cheap): `Portrait` renders at each size.

---
