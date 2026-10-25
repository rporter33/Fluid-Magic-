
---

## 6. Asset production

### 6.1 Inventory

Asset sources:
- **Code:** procedural, drawn by code paths in the renderer.
- **SVG:** small SVG files authored in Phase 11, replacing code paths one by one through the same interface, as the battle rigs do.
- **Owner:** owner-generated raster through `art-inbox/`.
- **Later:** not in M1.

| Asset | Count | Source in M1 | Upgrade | When | Fallback |
|---|---|---|---|---|---|
| Impassable art: massif peaks, mere water, ridge chains | 3 drawings, seeded | Code | SVG peak parts in Phase 11 | **M1, Phase 8** | — (it is gameplay) |
| Oak table top | 1 seamless tile | Code: grain lines, fleck, worn edge (`sketch/table-sketch.html` has a working version) | **Owner**, 2048² (6.3 A) | Code M1 Phase 8; owner M1-should | code |
| Table edge and brass corner guards | 4 corners, 1 edge | Code | — | M1 Phase 8 | — |
| Tavern floor, top-down | 1 per season | Code: planks, light patches, 4 silhouettes | **Owner**, summer and winter (6.3 C); spring and autumn later | Code M1 Phase 12; owner M1-should | code |
| Linen cloth, hem, tacks | 1 | Code | — | M1 Phase 8 | — |
| Compass rose, title cartouche, scale bar | 3 | SVG | — | M1-should Phase 11 | none drawn |
| Props: month candle, hourglass, coin purse, tankard, inkpot and quill, dice, sealed letter | 7 | Code (vector) | SVG | candle M1 Phase 12; the rest M1-should | none drawn |
| Terrain stamps | 7 terrains × 3 to 6 variants (about 34) | Code, Phase 11 | SVG atlas, Phase 11 | **M1, Phase 11** | flat fills |
| Settlement kits | 3 kits × (4 houses + 3 landmarks + 3 wall stages + scaffolding) (about 34) | Code | SVG | M1 Phase 11 | one generic house |
| Nation land-look motifs | 2 × (5 motifs + 1 landmark) | SVG | — | M1 Phase 11 | wash only |
| Scale-pole motifs | 10 poles × 3 | SVG | — | M1-should Phase 11 | none |
| Scars: battle churn, broken spears, cairn; siege tents, stakes, ram, wall cracks; smoke; burnt roofs | about 12 | Code (siege camp in Phase 8, because it is information); the rest SVG | — | siege M1 Phase 8; the rest M1 Phase 11 | the siege glyph |
| Miniature plaques (3 allegiance shapes) | 3 | Code | — | **M1, Phase 8** | — |
| Miniature figures | one per rig archetype | from the battle rigs (`PartSet`), cut down to map scale | Phase 11 SVG parts | Phase 10 (with the rigs); plaque-only before | plaque only |
| Portrait parts | about 125 + 9 overlays + 6 frames | Code paths in Phases 8 and 9 (head, hair, beard, headgear, frame, halo, crown, bandage) | **SVG**, Phase 11 | **M1** | archetype silhouette |
| Raster portraits | 8 per national type (80) + 12 per independent terrain (84) | — | **Owner** (6.4) | the 4 most-seen types M1-should (Ash Chieftain, Warden Captain, Pyre Priest, Grove Priest); the rest later | procedural bust |
| Chrome materials | CSS tokens, 14 px brass bracket SVG, oak bevel strips | Code/CSS | — | tokens M1 Phase 8; brackets and bevels Phase 12 | flat tokens |
| Ambience: candle glow, hearth glow, motes | 3 sprites | Code | — | M1-should Phase 12 | static |
| Ambient sound | — | — | — | Later (M2) | — |

The art inventory adds about 230 small SVGs in Phase 11 to the battle and pretender tracks' 171. Each is a short path file in the docs/09 two-tone style. Every SVG stamp passes the same content test: it has an ink outline and a light face, uses only palette colors, and stays inside its declared box.

### 6.2 Rules for owner-made images

Every owner prompt follows the same rules. They are the docs/09 palette rules applied to raster art:
- **Palette.** Oak #B08A5E / #8C6A47 / #5E4630 / #3E2E20, pewter #91A092, linen #E8DCC2, brass #DBBD76 only on small hardware, firelight kept small. **No large areas of saturated red, orange, green or blue**, because mana colors and banners carry identity on the map. No disc-shaped or drop-shaped brass near the center.
- **Nothing that competes with the map.** No text, letters, numbers, signatures, logos, frames or borders. No people in the room art.
- **Names.** No artists, studios, games, real people or insignia (OpenAI refuses prompts "in the style of a living artist").
- **Workflow.** Generate, then upload to `art-inbox/<kind>/`. The intake script checks size, tileability (for tiles), luminance and chroma ranges, and writes the provenance sidecar. The owner approves on a contact sheet.
- **One anchor per family.** The first approved image of a family (table, room, portraits) is attached as "Image 1: style reference" to every later prompt in that family, with the preserve list repeated (`research-portraits.md` 6.3).

### 6.3 Prompt templates: table and room (exact text)

**A. Oak table top, a seamless tile** (`art-inbox/table/oak-top-<anything>.png`)

```text
A seamless, tileable texture of an oiled quarter-sawn white oak tabletop, seen from directly
above, square, 2048 by 2048 pixels. Straight grain running left to right, visible silvery ray
fleck, gentle natural color variation, tawny grey-gold tones: highlights around #B08A5E, body
around #8C6A47, grain lines around #5E4630. Soft, even, neutral daylight from above, matte oil
finish, a few faint scratches and slightly worn areas, no stains, no knots larger than a
thumbnail, no cracks. Photographic realism with a slightly painterly softness.
The texture must tile seamlessly: the left edge must continue into the right edge and the top
edge into the bottom edge, with no visible seam, no vignette, no lighting gradient across the
image, no shadows of objects.
Do not include any objects, text, letters, logos, borders, frames or people.
```

Accept if it tiles without a seam (the intake script compares wrapped edges) and its mean CIELAB lightness is between 45 and 58.

**B. Table edge (optional, later)**

```text
The rounded edge of the same oiled quarter-sawn white oak table, seen from directly above, a
long horizontal strip 2048 by 256 pixels. The top 70% is the flat tabletop continuing the grain
left to right; the bottom 30% is the rounded, slightly darker edge, worn lighter where elbows
rest, falling into soft shadow (#3E2E20) at the bottom. Neutral even light, matte oil finish.
The strip must tile seamlessly left to right. No objects, no text, no metal, no people.
```

**C. Tavern floor around the table, top-down** (`art-inbox/room/floor-<season>-<anything>.png`; summer first, then winter)

```text
A top-down view, straight down from the ceiling, of the floor of a cozy, natural village tavern
around a large rectangular oak table. The table itself is NOT in the image: the center of the
image is an empty rectangle of plain dark floor 60% of the image wide and 60% high, where the
table will be placed later. Wide format, 2400 by 1600 pixels.
Around that empty center: wide oak floorboards with dark seams; a woven wool rug; a wooden
bench with a folded wool cloak; a barrel; a three-legged stool; a large hound asleep on the rug,
seen from above with its head tucked away; a little straw near a door at the bottom edge.
Light: the warm glow of a stone hearth just beyond the left edge spills across the floorboards
from the left, small and soft; cool natural daylight from a leaded window beyond the right edge
lies as a pale rectangle on the floor on the right. The corners of the image fall gently into
warm darkness.
Season: [SUMMER: the daylight patch is bright and warm, the window is open.]
        [WINTER: the daylight patch is pale and cool, a little frost at its edge, the hearth glow
        is stronger.]
Painterly realism, gouache and oil feel, matte, muted natural colors: oak browns (#5E4630,
#8C6A47), warm stone, pewter greys (#91A092), wool in undyed creams and browns. Keep firelight
small. No saturated reds, oranges, greens or blues anywhere except the small glow at the left
edge. No people, no faces, no text, no signs, no banners, no weapons, no candles in the empty
center.
```

Accept if the center rectangle stays empty and dark (the intake script checks mean lightness under 25 there) and chroma stays under 40 outside the hearth glow.

### 6.4 Prompt templates: portraits (exact text)

**The brief.** It is pasted verbatim into every portrait prompt, after "Image 1: style reference" once an anchor exists:

```text
Head-and-shoulders portrait bust of one fantasy war leader, three-quarter view facing toward
the right side of the image, square 1024 by 1024 pixels (if square is unavailable, 1024 by 1536
with the bust in the upper square). Framing: the top of the head or headgear at 8 to 10% from
the top, the eyes at 38 to 40% from the top, the image cut at mid-chest. One figure only. No
hands, no weapons held up to the face, no text, no border, no frame, no signature, no logo.
Lighting: a single warm candle key light from the upper left (about 1900 kelvin), a dim warm
fill, deep warm shadows. Background: near-black warm brown (#2B2018) with a faint wash of the
banner color given below, plain and unpatterned.
Medium: painterly oil or gouache on wood panel, moderate detail, strong readable silhouette:
the headgear or hair shape and the contrast between face and background must read when the
image is shrunk to 64 pixels.
Mana colors appear only in a mage's eyes, as noted below; nothing else in the image glows.
```

**Subject blocks.** Three lines, appended after the brief. The words in brackets come from the seeded traits the intake script suggests, so a raster set matches its procedural pool's variety:

| Type | Subject block |
|---|---|
| Ash Chieftain (Cinder Horde) | `Nation: the Cinder Horde, ash-born clans of a fire god. Ash-grey skin with faint soot marks, [braided / cropped / shaved] hair, [a braided / short / no] beard, a horned helm of blackened iron, scale armor of dark plates with rusted edges. Banner color wash: ember orange #FD6533, faint. Expression: [grim / fierce / weary].` |
| Pyre Priest | `Nation: the Cinder Horde. Ash-grey skin, soot stripes across the cheeks, a hood of charcoal cloth with an ember-shaped clasp, a collar of dark iron rings with a small flame symbol. Banner color wash: ember orange, faint.` |
| Ember Adept | `Nation: the Cinder Horde. Ash-grey skin, a thin iron circlet, a young [keen / wary / proud] face, a charcoal robe with an ember-red trim. Banner color wash: ember orange, faint.` |
| Cinder Magus | `Nation: the Cinder Horde. Ash-grey skin, a tall peaked charcoal hood, an old [gaunt / heavy / scarred] face. Eyes glowing ember amber (#FFB347). Banner color wash: ember orange, faint.` |
| Cinder Scout | `Nation: the Cinder Horde. Ash-grey skin, a low charcoal hood and a scarf over the lower face, alert eyes. Banner color wash: ember orange, very faint.` |
| Warden Captain (Thornwood) | `Nation: Thornwood, forest clans who remember. Warm bark-brown skin, [braided / long / tied] hair, [a full / short / no] beard, a helm of layered bark plates, a cloak of real leaves over bark armor. Banner color wash: deep moss green #00674B, faint. Expression: [steady / watchful / stern].` |
| Grove Priest | `Nation: Thornwood. Bark-brown skin, a hood of green wool pinned with small antlers, a collar with a carved leaf symbol, moss in the hair. Banner color wash: deep moss green, faint.` |
| Sapling Druid | `Nation: Thornwood. Bark-brown skin, a circlet of twigs, a young [calm / curious / solemn] face, a cloak of moss-green wool. Banner color wash: deep moss green, faint.` |
| Elder Druid | `Nation: Thornwood. Bark-brown skin, a crown of living wood with small leaves, an old [lined / serene / stern] face, a long beard with moss in it. Eyes glowing pale green (#A6D96A). Banner color wash: deep moss green, faint.` |
| Thorn Scout | `Nation: Thornwood. Bark-brown skin, a hood made of overlapping leaves, face paint of green stripes. Banner color wash: deep moss green, very faint.` |
| Independent Captain, by terrain | `Independent captain of a [plains / farmland / forest / hills / mountain / swamp / wasteland] province. Weathered human face, [plains: a plain iron cap and a padded jerkin; forest: a fur-trimmed hood; hills: a dented kettle helm; mountains: a heavy fur mantle and a scarred iron helm; swamp: a reed-woven cloak and a leather cap; farmland: a straw hat over a mail coif; wasteland: a sun-bleached scarf wrapped over a cap]. Banner color wash: neutral grey #8C8A80, faint.` |

Only the two types whose base pips are 2 (the Cinder Magus and the Elder Druid) have glowing eyes in their raster art, matching 5.4. A raster image is the same for every commander of its type, so its eyes cannot follow an individual's pips; the pip ring on the frame does that.

Edits use "change only X; keep everything else the same" and repeat the brief's framing lines, as the guide advises.

