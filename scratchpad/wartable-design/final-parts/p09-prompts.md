## Art prompt pack (owner-generated assets)

**How the owner uses this pack.**
- Generate in ChatGPT, one image per request, and download the PNG.
- Rename it as the entry says and drop it into `art-inbox/` in the repository (gitignored).
- Run `npm run art:intake`; it checks the image, writes the sizes and a provenance sidecar, and
  opens `art-inbox/contact.html` for approval. An image that fails a check is refused with the
  reason; the intake never edits pixels beyond crop and resize.
- Paste each prompt exactly as written. Replace only `{…}` fields.
- For a family's later prompts, attach that family's approved anchor image as "Image 1".
- For edits, write "Change only {X}. Keep everything else exactly the same." and repeat the
  framing sentences of the original prompt.
- Every asset has a procedural fallback that ships first. Nothing in the game waits for an image.

**Send now** (task #29): A1, A2 and P0. After P0 is approved: P1 to P4. After A2 is approved: A3.

ChatGPT's image sizes are 1024 × 1024 (square), 1536 × 1024 (landscape) and 1024 × 1536
(portrait); every entry asks for one of them.

### A1. Oak table top (seamless tile)

- **When:** now (M1-should). **Size:** square, 1024 × 1024.
- **File:** `art-inbox/table/oak-top__{anything}.png`.
- **Prompt:**

```text
A seamless, tileable texture of an oiled, quarter-sawn white oak tabletop, seen from directly
above, filling the whole square image. Straight, tight grain runs left to right with a subtle
silvery ray fleck. Two thin dark plank seams run straight across the image from left to right,
one a third of the way down and one two thirds of the way down. Tawny grey-gold color:
highlights near #B08A5E, the body near #8F7459, grain lines near #715636. Matte oil finish, worn
smooth, with a few very faint fine scratches. Soft, even, neutral daylight from directly above,
low contrast, no shadows of objects, no vignette, no lighting gradient across the image. No
orange or reddish stain, no varnish shine, no knots larger than a thumbnail, no cracks.
Photographic realism with a slightly painterly softness. The left edge must continue seamlessly
into the right edge, and the top edge into the bottom edge. No objects, no text, no letters, no
logos, no border, no frame, no people. Square image.
```

- **Intake checks:** the wrapped edges match (mean CIEDE2000 across each wrapped seam ≤ 3); mean
  L\* between 45 and 58; 99th-percentile chroma C\* ≤ 30; less than 0.5% of pixels saturated red
  or orange (hue 0° to 50° with C\* above 40).
- **Lands:** `src/assets/raster/table/oak-top.webp` (1024², quality 85, ≤ 250 KB) with
  `oak-top.json`. Knife marks, the tankard ring, nails and iron straps stay procedural on top of
  it, so they never repeat with the tile.
- **Fallback:** the procedural oak tile (`src/render/map/table/table.ts`).

### A2. Tavern floor around the table, top-down, summer

- **When:** now (M1-should). **Size:** landscape, 1536 × 1024.
- **File:** `art-inbox/room/floor-summer__{anything}.png`.
- **Prompt:**

```text
A top-down view, looking straight down from the ceiling, of the floor of a cozy, natural village
tavern around a large rectangular oak table. The table itself is NOT in the image: the center of
the image is an empty rectangle of plain dark floor, 60% of the image wide and 60% of it high,
where the table will be placed later. Landscape image.
Around that empty center: wide oak floorboards with dark seams; a woven wool rug in undyed
creams and browns below the center; a wooden bench with a folded wool cloak on it; a barrel
with iron hoops; a three-legged stool; a large hound asleep on the rug, seen from above with its
head tucked away; a little straw near a plank door at the bottom edge.
Light: the warm glow of a stone hearth just beyond the left edge spills across the floorboards
from the left, small and soft; cool natural daylight from a leaded window beyond the right edge
lies as a pale rectangle on the floor on the right, with the shadows of the window's lead lines.
The corners of the image fall gently into warm darkness.
Summer: the window patch is bright and slightly warm.
Painterly realism with a gouache and oil feel, matte, muted natural colors: oak browns (near
#5E4630 and #8C6A47), warm grey stone, pewter greys, undyed wool. Keep the firelight small. No
saturated red, orange, green, blue or violet anywhere except the small glow at the left edge. No
people, no faces, no text, no signs, no banners, no weapons, nothing in the empty center.
```

- **Intake checks:** the central 60% × 60% rectangle has mean L\* under 25 and low variance (the
  table covers it); chroma C\* under 40 outside the left 20% (the hearth); the owner confirms on
  the contact sheet that no face or text appears.
- **Lands:** `src/assets/raster/room/floor-summer.webp` (1536 × 1024, ≤ 400 KB) with its sidecar.
- **Fallback:** the procedural floor (`src/render/map/table/room.ts`).

### A3. Tavern floor, winter (after A2 is approved)

- **When:** M1-should, with A2 attached as Image 1. **Size:** landscape, 1536 × 1024.
- **File:** `art-inbox/room/floor-winter__{anything}.png`.
- **Prompt:**

```text
Image 1 is the approved tavern floor. Keep everything exactly the same: the view straight down,
the empty dark rectangle in the center, every piece of furniture, the hound, the rug, the
floorboards, the painting style and the colors. Change only the season and the light: it is
winter. The window patch on the right is pale and cool, with a little frost at its edges; the
hearth's glow from the left is somewhat stronger and warmer; a little melted snow lies by the
door at the bottom edge. No people, no faces, no text, nothing in the empty center. Landscape
image.
```

- **Checks, lands, fallback:** as A2, at `src/assets/raster/room/floor-winter.webp`; the
  procedural winter tint is the fallback. Spring and autumn floors are Later.

### P0. Portrait style anchor

- **When:** now. The owner regenerates until satisfied; the approved image becomes Image 1 for
  every portrait. **Size:** square, 1024 × 1024.
- **File:** `art-inbox/portraits/anchor__style.png` (kept as the anchor; it may also enter the Ash
  Chieftain set as `cinderHorde__ashChieftain__00.png`).
- **Prompt:** the style lock followed by the Ash Chieftain subject and the first trait line:

```text
Head-and-shoulders portrait bust of one fantasy war leader, three-quarter view, the face turned
toward the right side of the image. Square image. Framing: the top of the head or headgear about
9% from the top edge, the eyes about 39% from the top, the chin about 66% from the top, the
image cut at mid-chest. One figure only. No hands, no weapons raised toward the face, no text,
no border, no frame, no signature, no logo.
Lighting: a single warm candle key light from the upper left, a dim warm fill, deep warm
shadows. Background: plain, unpatterned, very dark warm brown close to #1C1A17, with no objects.
Medium: painterly oil on a wood panel, moderate detail, a strong readable silhouette: the shape
of the headgear or hair and the contrast between the face and the background must still read
when the image is shrunk to 64 pixels.
Colors: muted and earthy. Nothing in the image glows, except where the subject below says a
mage's eyes glow. No saturated red, orange, green or blue area larger than a small clasp or trim.

Subject: A warrior of the Cinder Horde, ash-born clans who worship fire: ash-grey skin with faint
soot markings, charcoal and smoke-grey clothing, armor of dark iron plates with rusted edges.
An Ash Chieftain: a horned helm of blackened iron, a braided beard, scale-plate pauldrons.
Traits: a braided beard, a grim expression, a scar through the left eyebrow.
```

- **Intake checks (every portrait):** the eye line is found between 33% and 45% of the height
  before the crop (the crop then places it at 39%); the corners' mean L\* is at most 20; no
  99th-percentile chroma above C\* 45 outside the eye region; luminance, warmth and face-box
  position within the set's spread (outliers flagged); the contact sheet shows the set at 256, 64
  and 24 px on oak and on `--chrome-0`.
- **Lands:** `src/assets/raster/portraits/{nationDef}/{unitId}/{nn}.webp` (256 px, ≤ 24 KB) and
  `{nn}-64.webp` (≤ 4 KB), with `{nn}.json`; the 512 px master in `art-source/portraits/...`.
- **Fallback:** the procedural bust, always. A set is used only when it has 8 approved images.

### P1 to P4. The first portrait sets (M1-should)

Each request is: the line "Image 1 is the style reference: match its painting style, lighting,
framing, background and proportions exactly. Change only the subject described below. Keep
everything else the same.", then the style lock from P0 unchanged, then `Subject:` with the
nation line, the type line and one trait line. Eight requests per set, one per trait line.

**File names:** `art-inbox/portraits/{nationDef}__{unitId}__{01..08}.png`, for example
`cinderHorde__ashChieftain__03.png`.

**Nation lines:**
- Cinder Horde: `A warrior of the Cinder Horde, ash-born clans who worship fire: ash-grey skin with faint soot markings, charcoal and smoke-grey clothing, armor of dark iron plates with rusted edges.`
- Thornwood: `A warden of the Thornwood, forest clans who live among ancient trees: weathered bark-brown skin, bark-and-leaf clothing and armor in moss green and bark brown, a few pale blossoms.`
- Independents: `A captain of a free village militia: a weathered human face, plain leather and iron, no insignia.`

**P1. Ash Chieftain** (`cinderHorde__ashChieftain`). Type line: `An Ash Chieftain: a horned helm of blackened iron, scale-plate pauldrons.` Traits:
1. `a braided beard, a grim expression, a scar through the left eyebrow.`
2. `a cropped beard, weary eyes, grey at the temples.`
3. `no beard, a broad jaw, soot stripes across the brow.`
4. `a long braided beard with iron rings, a fierce stare.`
5. `a short beard, a broken nose, a calm and cold look.`
6. `a heavy beard, deep-set eyes, a thin crack-like scar on the cheek.`
7. `no beard, gaunt cheeks, one horn of the helm chipped.`
8. `a braided moustache, old and scarred, watchful.`

**P2. Warden Captain** (`thornwood__wardenCaptain`). Type line: `A Warden Captain: a helm of layered bark plates with short antler stubs, a cloak of real leaves over bark armor.` Traits:
1. `braided hair, a full beard, a steady look.`
2. `long hair tied back, no beard, watchful eyes.`
3. `a short beard with moss in it, a stern mouth.`
4. `grey braids, a weathered face, a calm look.`
5. `a young face, a thin beard, a scar on the chin.`
6. `a heavy brow, a full red-brown beard, a patient look.`
7. `close-cropped hair under the helm, no beard, a leaf tattoo on the cheek.`
8. `an old face, a white beard, kind but hard eyes.`

**P3. Pyre Priest** (`cinderHorde__pyrePriest`). Type line: `A Pyre Priest: a hood of charcoal cloth with an ember-shaped iron clasp, a collar of dark iron rings, soot stripes across the cheeks.` Traits:
1. `an old lined face, a shaved chin.`
2. `a thin face, a short grey beard.`
3. `a young face, intense eyes.`
4. `a heavy face, a burn scar on the jaw.`
5. `a narrow face, a long braided beard.`
6. `a gaunt face, sunken eyes, a calm smile.`
7. `a round face, a stubbled chin.`
8. `an old face, a forked beard.`

**P4. Grove Priest** (`thornwood__grovePriest`). Type line: `A Grove Priest: a wreath crown of oak leaves, moss in the hair, a plain green-grey robe with a carved leaf clasp.` Traits:
1. `an old serene face, a long white beard.`
2. `a young calm face, braided hair.`
3. `a lined face, a short beard, gentle eyes.`
4. `a narrow face, long loose hair.`
5. `a broad face, a moss-tangled beard.`
6. `a weathered face, a scar across the nose.`
7. `an old face, no beard, a thoughtful look.`
8. `a stern face, grey braids.`

**Later sets** use the same template:
- Ember Adept: `An Ember Adept: a young face, a thin blackened-iron circlet, a charcoal robe with a dull ember-red trim.`
- Cinder Magus: `A Cinder Magus: an old gaunt face, a tall peaked charcoal cowl; the eyes glow amber like embers (#FFB347), and nothing else glows.`
- Cinder Scout: `A Cinder Scout: a low charcoal hood and a scarf over the lower face, alert eyes.`
- Sapling Druid: `A Sapling Druid: a young calm face, a circlet of twigs, a cloak of moss-green wool.`
- Elder Druid: `An Elder Druid: an old lined face, a hood with small antlers, a long beard with moss in it; the eyes glow pale green (#A6D96A), and nothing else glows.`
- Thorn Scout: `A Thorn Scout: a hood of overlapping leaves, thin green face paint in stripes.`
- Independent Captain, by outfit (12 per outfit): levy `a plain iron cap and a padded jerkin`; hunter `a fur-trimmed hood`; mountaineer `a heavy fur mantle and a dented iron helm`; reedman `a reed-woven cloak and a leather cap`. File names `independent__independentCaptain-{outfit}__{nn}.png`.

Only the two types whose base pips are 2 (the Cinder Magus and the Elder Druid) have glowing eyes
in raster art. A raster image serves every commander of its type, so it cannot follow an
individual's pips; the pip ring on the frame does that. No raster portrait carries a banner color:
the frame's band does.

### Provenance (every image)

The intake writes `{name}.json` beside each accepted file: the source file name and the
original's SHA-256; the tool and model as ChatGPT shows them; the date; the full prompt text and
any edit prompts; whether C2PA metadata was present (ChatGPT images carry it, and WebP
conversion drops it, so the sidecar records it); and the approver. The originals stay in
`art-inbox/accepted/` (gitignored). Content validation fails on a missing size or sidecar.

---
