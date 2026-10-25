
---

## 5. Leader portraits

"Leaders certainly need portraits." Every commander gets one. A portrait is a **person**: the seed picks the face, and state picks only overlays and the frame. "Varo, now wounded" is still Varo. The calibration sketch's procedural busts read at 72 px and at 32 px (bottom row of `sketch/sketch-mid.png`): helmets, hoods, beards and halos tell them apart before any face detail does.

### 5.1 Who gets which portrait

| Commanders | Portrait | What the seed varies | Count on Medium |
|---|---|---|---|
| National commanders: Cinder Scout, Ash Chieftain, Pyre Priest, Ember Adept, Cinder Magus; Thorn Scout, Warden Captain, Grove Priest, Sapling Druid, Elder Druid | a **bust** from parts (5.2) | face, hair, beard, marks, headgear variant, skin and hair ramps | 5 to 30 per nation over a game |
| Independent Captains | a bust from the shared human set, its **outfit by the province's terrain** (7 pools: reeds in swamps, furs in mountains, and so on) | as above | 58 at game start |
| Pretenders (16 chassis, `pretender-design/final.md`) | the rig in its **portrait pose** with the god's chosen look (B.8): 256, 128 and 64 px with the 256 px detail layer | nothing: the look is chosen in the designer | 1 per nation |
| Summoned commanders: Salamander, Treant (and M2 summons) | their rig's portrait pose | markings and scars only (B.8) | a few |
| The garrison holder | none: it is never selectable and shows as the fort | — | 1 per fort |

**Harmony with the battle track.** The battle design draws dock and name-card portraits as "the rig in its idle pose at 2×, on the banner color" (S4.4). For national and independent commanders, the replay uses the **bust** instead, so the Varo the player knows from the strip is the Varo who falls in the replay. Pretenders and summons keep their rig portraits. Section 8.7 holds the one-line change to the battle design.

### 5.2 The layered SVG system

- **The grid.** 256 × 256 units, with fixed anchors: crown at y 40, eye line at y 122, chin at y 190, collar at y 196. These are the pretender design's 256-unit portrait grid. Strokes marked `data-lod="portrait"` drop below 96 px.
- **Layers, back to front:**
  1. backdrop: dark oak #2B2018 under the banner color at 28%, and the nation's motif pattern at 8%;
  2. hair, cloak and headgear behind the head;
  3. shoulders and clothes, by type and nation, with a `currentColor` tint zone that takes the banner color;
  4. neck;
  5. head shape, in the skin ramp's three tones;
  6. ears;
  7. eyes and brows;
  8. nose and mouth;
  9. marks (soot stripes, warpaint, moss, tattoos);
  10. scars (state; afflictions in M2);
  11. beard;
  12. front hair;
  13. headgear;
  14. state overlays (5.4);
  15. the frame (5.5).
- **The part library** (M1). About 125 small SVGs, authored in Phase 11. Phases 8 to 10 use the same slots drawn as code paths (`proceduralPortraitParts`), as the battle rigs are placeholders until Phase 11 (S4.4):

  | Set | Parts |
  |---|---|
  | Shared (46) | 6 head shapes, 6 eye-and-brow sets, 6 nose-and-mouth sets, 11 hair shapes (bald included), 8 beards (none included), 3 scars, 6 ears and necks |
  | Per nation (34 each) | 4 marks; headgear, 3 to 4 per type × 5 types (Cinder: scout hood, chieftain's horned helm, priest's soot hood with an ember clasp, adept circlet, magus's tall peaked hood; Thornwood: scout hood of leaves, captain's bark helm, priest's grove hood with antler pins, druid circlet of twigs, elder's crown of living wood); collars, 2 per type |
  | Independents (11) | 4 helms; 7 terrain outfits |
  | Overlays (9) | bandage, blood, glowing eyes, brow sigil, halo, crown, runic chains, closed eyes, fog dots |
  | Frames (6) | oak, bronze, brass, gilded, pewter, elemental |

- **Color ramps** (three tones each: `--ramp-dark`, `--ramp-base`, `--ramp-light`; CK2's gradient map, `research-portraits.md` 5.3):
  - Cinder skin: ash grey to soot (#9C9893, #8F8C88, #7E7A75, #6E6A64), with ember-crack hairlines (#FFB347) at 96 px and up.
  - Thornwood skin: bark to blossom undertone (#B48A68, #A0785A, #8C6648, #6B4A2B).
  - Independent skin: #D2B293, #C9A585, #B08A6A, #8C6A4A.
  - Five hair ramps per nation.
- **Pools are content.** `PORTRAIT_POOLS[nationDef][unit]` lists part ids per slot, with optional weights (`src/content/presentation/portraits/pools.ts`). `INDEPENDENT_POOLS[terrain]` does the same for independents. Every recruitable commander type must have a pool, and the content validation fixtures list them (CLAUDE.md).

### 5.3 Seeding

- **Keyed draws.** `portraitSeed = \`${state.seed}:${commander.id}\``. Each slot draws from its own key, `hash32(\`${portraitSeed}:${slot}\`)`, using the battle track's `src/present/rand.ts`. No draw depends on call order, so adding a slot moves nothing else (DiceBear's keyed draws, `research-portraits.md` 5.1).
- **Rendezvous picks.** A slot keeps the part with the best score `−ln(u(seed, slot, partId)) / weight`. Part tables are **append-only**, and a content test pins this. Adding a part then changes about 1/(n+1) of picks, 7.9% when a slot grows from 12 parts to 13, against 92.5% with `hash % n` (`research-portraits.md` 5.5). An art update keeps about 90% of faces.
- **Stable everywhere.** Commander ids are monotonic (`c<n>`), so a reload, a lost WebGL context or a load from the save shows the same face. Portraits never read `state.rng`, so replays, saves and the determinism test are untouched.
- **Repeats.** A nation's commanders of one type are compared side by side at 32 to 72 px. Only the silhouette counts there: headgear or hair, beard, face shape and one strong mark.
  - Bare-headed priests and mages have 11 × 8 × 6 × 5 = 2,640 salient looks: P(any repeat among 8) is 1.1%.
  - Helmeted chieftains and captains have 3 × 8 × 6 × 5 = 720: 3.8% among 8.
  - Independent captains split into 7 terrain pools of about 8 each: about 4%.

  A stored `lookIndex` (a deck that cannot repeat, `research-portraits.md` 5.7) waits until playtests show repeats.
- **Pure composition.**
  - `composePortrait(view: PortraitView, size): PortraitPlan` in `src/present/portrait/compose.ts` returns layer ids, transforms and ramp colors. It is pure and tested in Node.
  - `Portrait.tsx` (`src/ui/portrait/`) renders the plan as inline SVG for the DOM.
  - `src/render/portraits.ts` rasterizes it to a Pixi texture for the battle stage and the map tooltip, cached by (commander, state hash, size).

### 5.4 State overlays

State never changes the face. It picks overlays, the frame and badges (CK2's property slots, `research-portraits.md` 3.1 and 4).

| State | Source | At 96 px and up | At 48 to 72 px | At 32 px and below |
|---|---|---|---|---|
| Wounded | `hp` at most 50% of max | a bandage across the brow | bandage | the cracked-heart glyph on the frame corner (docs/09) |
| Badly wounded | `hp` at most 25% | blood and a darker vignette | blood | glyph |
| Starving, unpaid | `starvedDays`; the nation's unpaid counter | frame corner glyphs (crossed wheat, crossed coin) | glyph | glyph |
| Prophet | `nation.prophetId` | a halo behind the head and a candle flame at the frame's top | halo | halo |
| Pretender | `nation.pretenderId` | the rig portrait (B.8), the crown badge, awakening overlays (dormant: closed eyes; imprisoned: runic chains) | same | crown |
| Mage paths | `pips` | **the pip ring**: one mana symbol per pip on the frame's top arc (UI spec 2.8.2), with "R6" past 6; eyes glow in the color's accent (Ember #FFB347, Loam #A6D96A) at 2 or more pips; a faint brow sigil | ring and eyes | one dot in the dominant color |
| Holy | `holy` | the holy mark on the frame's foot and a symbol on the collar | mark | mark |
| Scout, stealthy | unit tags | the eye or hood role badge (docs/09) | badge | badge |
| Out of sight (an enemy) | `visionOf` | the last-seen portrait, desaturated, in a dotted frame (docs/09's fog pattern). A stealthy commander never shows | same | same |
| Dead (reports, history, victory screen) | the battle record or summary | greyscale with a black corner ribbon | same | same |
| Head-slot item (if the units-and-items design lands) | the commander's equipped head item | the item's part replaces the headgear layer | same | same |
| Afflictions, experience (M2, units design R9 and R10) | new state | eyepatch; scars in three placements; weathering at 3 and 8 battles; renown stars on the frame | — | frame glyphs |

Mana colors appear only on what carries them: the pips and a mage's eyes (docs/09).

### 5.5 Frames by rank

| Rank | Commanders | Frame | Ornament |
|---|---|---|---|
| 0 | Scouts | plain oak #8C6A47 | none |
| 1 | Priests, adepts, druids | bronze #B58735 | corner studs |
| 2 | Chieftains, captains, the magus, the elder | brass #DBBD76 | corner brackets |
| God | the pretender | gilded #F2D27A | a crown notch and the god's sigil in a corner (pretender B.7) |
| Independent | Independent Captains | pewter #91A092 | none |
| Bound | summoned commanders | elemental: ember-iron #4A4440 with an ember seam (Salamander), living root #6B4A2B with leaves (Treant) | — |

Every frame has a 2 px inner band in the **banner color** with a `keylineFor` keyline, so ownership shows on every portrait at every size.

### 5.6 Where portraits appear, and how large

| Surface | Size | Notes |
|---|---|---|
| Commander panel header | **96 px** (the staged spec says 64; leaders deserve faces) | with the pip ring |
| Bottom strip | 72 px | click opens the Commander panel (unchanged) |
| Replay name cards (deaths, arrivals) | 128 px | |
| Codex unit pages | 128 px | a canonical seed per type |
| Replay rosters and docks | 64 px | the battle design's size |
| Battle report card (commanders' fates) | 48 px | dead ones in greyscale with the ribbon |
| Commander and army hover tooltips | 48 px | in the header |
| Outliner rows | 28 px | the "portrait dot" |
| Entity links in text | 20 px | the head only |
| Pretender designer, card | 256 and 128 px | B.8 |

The map miniature shows the commander's **figure**, not the bust. The bust appears in the hover tooltip.

**Level of detail:**
- **96 px and up:** everything.
- **48 to 72 px:** eyes become dots, fine strokes drop, marks stay.
- **32 px and below:** silhouette only (backdrop, head, hair or headgear, beard), plus the halo and crown. Wounds move to the frame glyph and the pip ring to one dot.

### 5.7 The owner's raster layer (ChatGPT images)

- **Order of use:**
  1. a raster set for the (nation, unit), once **complete** (at least 8 images; 12 for each independent terrain pool), picked by the 5.3 seed;
  2. the procedural bust;
  3. docs/09's archetype silhouette with a nation tint.

  Types never mix within one game: two Ash Chieftains must not look as if they came from different games.
- **Style lock.** The brief in section 6.4 is pasted verbatim into every prompt, after an approved **style anchor** image attached as "Image 1: style reference". OpenAI's guide recommends exactly this anchor-and-preserve-list workflow (`research-portraits.md` 6.3).
- **Sizes.** Generate at 1024 × 1536 or 1024 × 1024. The intake crops a 1024² master to the brief's framing and derives **256, 128 and 64 px WebP**. Other sizes are resampled from the next larger one.
- **Files:**
  - the owner drops `art-inbox/portraits/<nation>-<unit>-<anything>.png` (example: `cinderHorde-ashChieftain-braided.png`);
  - accepted files land in `src/assets/portraits/<nationDef>/<unitId>/<nn>.webp`, with a sidecar `<nn>.json` holding source name, sha256 of the original, tool and model as ChatGPT shows them, date, prompt, edits, whether C2PA was present, and the approver;
  - originals stay out of the bundle, in `art-inbox/accepted/` (gitignored), for provenance.
- **Intake** (`scripts/art-intake.ts`, Node, outside the pure folders):
  1. writes the sidecars, crops, derives the sizes;
  2. flags outliers against the set's median in mean luminance, warmth (R − B) and face-box position;
  3. writes a contact sheet (`art-inbox/contact.html`, the set at 64 and 128 px on oak and on dark) for the owner to approve.
- **The manifest.** `src/assets/portraits/manifest.ts` lists each set with `minPool`. Content validation fails on a missing size or sidecar.
- **State on raster portraits** is frame-only: halo or crown above the edge, a wound vignette, glyphs, the pip ring, the rank frame. Face overlays would float on faces that do not share the SVG anchors. A sidecar with hand-set `"anchors": {eyeL, eyeR, crown}` may opt in.
- **Provenance and disclosure.** Prompts alone may not be protected by copyright in the US (`research-portraits.md` 6.7). The procedural system, the frames and the overlays stay the game's own identity, and the sidecars make a store's AI disclosure easy to fill in.

### 5.8 Personal names (M1-should, strongly recommended)

Names do half the work of telling leaders apart. The mockup already shows Varo, Seren, Ondra, Kesh and Ilsa Oakhand.

- **Rule.** `CommanderState.name` becomes a personal name from `personalName(state.seed, commanderId, nationDef)`. It is a pure function: a hash over content name pools per nation, with **no rng draw**, so the sim's random stream is unchanged.
- **Where it is set.** Commanders are created through `src/sim/commanders.ts`, which sets `name: def.name` today.
- **Display.** The unit's name becomes the title: "Varo, Ash Chieftain".
- **Messages** already store their text, so names appear in them from the commander's creation on.
- **Pretenders** keep `NationState.pretenderName` (pretender D7).
- **Cost.** State hashes change, but the determinism test compares two runs, so it holds. One content file of name pools: Cinder harsh and short (Varo, Kesh, Ondra), Thornwood soft (Ilsa, Bren, Maelor), Independents plain.

### 5.9 Tests

- `composePortrait`: the same seed and id give the same plan; a different id gives a different plan; adding a part to a 12-part slot changes at most 12% of 1,000 ids (rendezvous). Every pool's part ids exist, and part tables are append-only (pinned list).
- Overlays: each state picks its overlay and never changes a face layer (the face layers' ids are equal with and without the state). LOD at 96, 64, 32 and 20 px drops what 5.6 says.
- Frames by rank for every commander unit; every recruitable commander unit has a pool (content fixtures); every summon and chassis has a rig portrait pose (with the pretender and battle tracks' fixtures).
- Raster manifest: every set has its three sizes and a sidecar; no set below `minPool` is used.
- UI smoke tests: a `Portrait` renders at each size (CLAUDE.md: "the UI gets smoke tests only where cheap").

