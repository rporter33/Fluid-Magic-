# Stage B calibration (key "cal")

2026-10-23. These are the calibrations stage B opens with. They follow the owner's pilot verdict (Go, every piece
kept, with four notes), the art director's review (`pilot-review.md`, changes 5, 8 and 9) and the task's five
parts. Paths are relative to `scratchpad/visual-v4/units/`. Nothing in the repository was touched.

**Budget:** 24 of 30 generations, all logged in `gen-log.tsv` under the purpose `B cal: …`:

| Part | Generations | Cap |
|---|---|---|
| Commanders | 12 | 12 |
| Thornwood | 2 | — |
| Output size | 4 (one failed) | 4 |
| Mounts | 6 | 8 |

No creature, god or mount figure was made, except the War Wolf as part of the Wolf Rider test. It is a probe, not a
figure for approval.

**Where things are:**
- Work: `stage-b/cal/` (raw sheets, keyed and sliced work, review images, the variation page).
- Tools: `stage-b/cal/sbx/tools/`. It is a sandbox copy of `tools/`; the shared tools are unchanged.

---

## Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Commander route | **Two steps.** First, a Pro body sheet per kind and view, made from the commander maquette with its kit zones painted. Then a Nano Banana 2.1 re-dress per face, with that face's portrait as Image 2. Front view: 3 kinds × 2 faces, and all 6 faces pass the camera gate. The back view still needs work (see 1.4). |
| 2 | Thornwood green | **The hue lock is the route; the wording alone does not hold.** The range is set from the approved Warden sheet: hue 90° to 230° at chroma ≥ 0.02, plus a band ±25° around 166° at chroma ≥ 0.015 for cloth that comes out grey. The mask proof catches only cloth. |
| 3 | Output size | **Keep 1K for troop and commander sheets.** 2K works, but the camera drifts on every roll. Use 2K only for big-body cutouts whose tier H is taller than a 1K source, and check each cutout's camera. 4K is untested. |
| 4a | Mount size | **The packer fix is all it needs, and it is made.** The packer drew the Wolf Rider's rider 1.56× a man. It now draws a man-sized rider: 32.7 wu tall instead of 50.7. |
| 4b | Mount and rider apart | **Later (stage C), by the edit route.** It costs about +7 generations per mounted unit (2 views). Pro from split maquettes fails. Nano Banana 2.1 edits of the camera-correct joint sheet match by construction in camera, light and scale. |
| 5 | Troop variation | **Adopt it for production.** It is a material-aware tint shader with one-sided limits per side, plus shared cloth stencils and per-figure transforms and timing. It needs no new painted sheets, costs one draw call per block, and breaks no rule. |

---

## 1. The commander route (review change 5)

### 1.1 Kit zones on the commander maquettes

`sbx/tools/cmd_guides.py` renders three body kinds in the commander layout, both views
(`review/guides-cmd-front.png`). It uses the pilot's rig and paints the kit zones as the troop maquettes paint their
cloth.

| Kind | Nation and key | Kit zones painted |
|---|---|---|
| `cmdChief`: armoured chieftain | Cinder, green | bronze crown ring, near-black fur mantle (a collar over the shoulders and a cape down the back), blue-grey pauldrons |
| `cmdCaster`: robed caster with a staff | Cinder, green | bronze circlet, grey mantle, charcoal robe, orange staff cage |
| `cmdDruid`: hooded druid | Thornwood, magenta | olive hood, brown feather collar and mantle, bark robe, green sprig |

### 1.2 Body sheets (Nano Banana Pro, front view)

The gate is 14 of 16 cells or more: the review's 13 of 15 share for a 16-cell sheet.

| Sheet | References | Cells at the battle camera | Median IoU |
|---|---|---|---|
| `cmdChief` | zoned maquette, Cinder troop front sheet (`raw/ad/cw.front.g3pro`, 15/15), anchor | 13/16 (strike and follow cells turned) | 0.68 |
| `cmdChief`, zones only | zoned maquette, anchor | **14/16** (picked) | 0.70 |
| `cmdCaster` | zoned maquette, Cinder troop front sheet, anchor | **16/16** | 0.77 |
| `cmdDruid` | zoned maquette, Warden front sheet (`raw/ad/wd.front.g3pro`), anchor | **16/16** | 0.79 |
| `cmdChief` back view, zones only | zoned maquette, anchor | **3/16, fail**: a low three-quarter camera, figures turned sideways (`review/cmd-body-back.png`) | 0.46 |

**The art director's hypothesis holds for the front view.** The same chieftain kind went from 1/16 (bare grey maquette,
no portrait, AD) to 14/16 with the kit zones painted. A camera-correct troop sheet as Image 2 held the casters and the
druid at 16/16. The back view from zones alone failed; see 1.4.

### 1.3 Re-dresses (Nano Banana 2.1), two faces per kind

Image 1 is the body sheet; Image 2 is the face's approved portrait. The prompt names every identity mark
(`prompts/cmd.<face>.front.redress.txt`).

| Face | Cells (own height) | Cells (body-height scale, see note) | IoU with its body sheet, median |
|---|---|---|---|
| Ash Chieftain 06 | 14/16 | **14/16** | 0.93 |
| Ash Chieftain 03 (large ram horns) | 14/16 | **14/16** | 0.95 |
| Cinder Magus 03 (tall peaked cowl) | 9/16 | **15/16** | 0.87 |
| Ember Adept 07 | 16/16 | **16/16** | 0.78 |
| Elder Druid 08 | 16/16 | **16/16** | 0.96 |
| Elder Druid 05 (a woman, tall branching antlers) | 13/16 | **16/16** | 0.87 |
| Ash Chieftain 06, **back view**, onto the troop back sheet (`raw/r3/cw.back.g3pro`) | 13/15 | n/a | facing kept |

**Note on the gate:** a re-dress keeps each figure's size in its cell. Scaling it by its own height lets a tall cowl or
antlers shrink the body and fail cells whose camera is right; it is scaled by its body sheet's cell height instead
(`cal_cmd_measure.py`).

**Ticked marks** (on `review/identity-4x-all.png`, each face's portrait beside the stand frame's upper half at 4×;
per-face boards are in `review/identity-<face>.png`). ✓ = reads, ~ = partly, ✗ = absent.

| Face | Marks |
|---|---|
| AC06 | crown spikes ✓, grey beard to the chest ✓, pauldrons ✓ (flame sigils ~), feather mantle ✓, cheek scar ✗, axe ✓ |
| AC03 | ram horns ✓, clean-shaven dark face ✓ (soot stripes ~), mail aventail ~, ringed pauldrons ~, wolf-fur collar ✓, axe ✓ |
| CM03 | tall peaked cowl with iron bands ✓, old stubbled face ✓ (soot band ~), smoke-grey mantle ✓, sun-disc pendant ✓, robe ✓, caged-ember staff ✓ |
| EA07 | unruly black hair ✓ (circlet ✗), short dense beard ✓, quilted collar and ember trim ✓, book-strap and book ✓, key on a cord ~, staff ✓ |
| ED08 | olive hood ✓, antler nubs ✓, long thin moustache ✓, owl-feather collar ✓, crescent-moon clasp ~, robe ✓ (green sprig on the staff ✗) |
| ED05 | grey-green hood ✓, branching antlers ✓, white braids ✓, a woman's face ✓, acorn necklace and bone clasp ~, robe and staff ✓ |

Of 36 marks:

- **25 read clearly.**
- **9 read partly.**
- **2 are absent:** AC06's cheek scar, which is 2 to 3 px at tier H, and EA07's half-hidden circlet.

The headgear, the mantle and the weapon carry every face, as plan 5.5 expects. Marks the size of a face feature do not
read at figure scale, and the identity check should not require them.

### 1.4 Production route and cost

1. **Body sheets.** One Pro sheet per kind and view, from the zoned commander maquette, gated at 14/16 or more.
   - Front view: give the nation's camera-correct troop front sheet as Image 2. This held 16/16 twice; zones alone held
     14/16.
   - Back view: zones alone failed (3/16). Give the camera-correct troop back sheet as Image 2, which is untested, or
     re-dress straight onto the troop back sheet, which held 13/15. Budget two rolls per back body.
   - About 10 kinds cover the 128 faces:
     - Cinder: armoured, scout, robed caster;
     - Thornwood: armoured, scout, robed or hooded caster;
     - the 4 independent captains.
   - That is about 20 sheets × 1.5 ≈ **30 generations**.
2. **Re-dress per face and view.** Nano Banana 2.1, portrait as Image 2, every mark named, "no shield" stated whenever
   the body carries one.
   - The front view passed 6 of 6; the back view passed 1 of 1.
   - 128 × 2 × 1.15 ≈ **295 generations**.
3. **Total ≈ 325**, against the plan's ≈ 290. Each commander face gets its own figure, as owner note 2 asks.
4. Commanders get no variation tints (part 5): their figure must match their portrait. They keep their own timing.

Consistency flag: the caster body's deadB cell is a lighter robe (ΔE 17.9 against the pilot's limit of 12); the Magus
re-dress inherits it (14.7). The consistency check catches this, and a re-roll fixes it.

---

## 2. Thornwood green (review change 9)

### 2.1 The hue range, set from the approved Warden sheet

`sbx/tools/cal_huelock.py` reads the sheet's chroma-weighted hue histogram:

- the warm browns (bark, leather, skin) peak at 60°;
- the cloth peaks at 135°;
- the valley between them is at **90°**;
- the cloth's hue runs from 92° to 160° (1st to 99th percentile).

**The range is 90° to 230°**. The top of the range covers the 186° to 220° teal that the hex-naming edit overshot to.

The painted Thornwood cloth is dark and muted: on the Longbow Hunter its median chroma is 0.029. The AD's floor of
0.03 therefore missed most of it. **The floor is set to 0.02**, plus a band ±25° around 166° at chroma ≥ 0.015 for cloth
painted at the right hue but grey.

Side share at 28 px of the stand frame, hue-locked, with the side keyline (`checks.side_report`):

| Sheet | As painted, with the keyline | AD lock (85° to 225°, chroma ≥ 0.03) | Range 90° to 230° | Range, floor 0.02, grey band |
|---|---|---|---|---|
| Warden (approved, Pro) | 19.8% | 35.3% | 34.8% | **38.0%** |
| Warden, hex edit (teal) | 17.6% | 24.3% | 24.4% | **30.7%** |
| Longbow Hunter r1 ("fir needles in shade") | 14.8% | 14.8% | 14.8% | **29.8%** |
| Longbow Hunter r2 ("bottle green, jade") | 17.1% | 30.5% | 29.0% | **39.3%** |

**Mask proof:**

- **Files:** `review/huelock-warden.png`, `review/huelock-warden-frames.png` (six poses),
  `review/huelock-hunter-r1.png`, `review/huelock-hunter-r2.png`, `review/huelock-warden-hex.png`. Each shows the frame,
  the mask in magenta, and the locked result.
- **Caught:** the crest, the mantle leaves, the surcoat and the shield face.
- **Never caught:** bark plates, leather, skin or wood.
- **Missed:** the yellow-green leaf highlights below 90° and the darkest surcoat folds.
- **Value:** the margin is unchanged; the worst ground is 25.8 L\* below.

### 2.2 The wording, tried on one more troop (Longbow Hunter, front, Pro from the maquette)

Neither wording held:

| Roll | Wording | Hue | Chroma | Camera |
|---|---|---|---|---|
| r1 | the review's words: "blue-green like fir needles in shade, never leaf-green" | right: median 173°, against the cloth's 166° | far too grey: median 0.024, against the cloth's 0.084; 0% side share as painted | 11/15, fail |
| r2, the plan's one re-roll | "deep bottle green … jade … never grey or slate" | back to 130° to 150° | up | 3/15, fail: second failure, reported |

**Decision:**

- The lock sets the hue. The prompt asks for a clearly coloured cloth, using r2's colour words, because r2 locks best
  (39.3%).
- The gate is the side share after the lock, with the side keyline, at 30% or more.
- Every Thornwood sheet's mask proof goes to the art director.

**Open risk:** the Longbow Hunter front failed the camera on both rolls, whereas the Warden held 15/15. The very tall bow
in the draw and loose cells is the likely cause. Stage B's first Longbow Hunter sheet needs its own camera fix.

---

## 3. Output size (review change 8)

The task's tool `sbx/tools/gemini_gen_size.py` is a copy of `gemini_gen.py` that adds `imageConfig.imageSize`. The API
accepts "2K" for `gemini-3-pro-image` and returns 2048 × 2048. Tokens are unchanged (4,227 to 4,480); time rises from
16 to 17 s to 21 to 25 s. The 4K call failed with HTTP 502 (upstream) and was not retried, because the size cap of 4
was used.

| Job (same prompt and references) | Cells at 1K | Cells at 2K | Median IoU 1K → 2K | Stand body at its source |
|---|---|---|---|---|
| Cinder front (AD job) | 15/15 | 13/15 | 0.855 → 0.749 | 141 → 328 px |
| Cinder back (r3 job), first roll | 14/15 | 12/15 | 0.770 → 0.705 | 139 → 301 px |
| Cinder back (r3 job), second roll | 14/15 | 13/15 | 0.770 → 0.691 | 139 → 285 px |

**2K drifts the camera.** Its figures are painted larger in their cells, longer-legged and closer to eye level: the same
drift as the AD's 2 × 2 large-cell test.

**Detail gain:**

- At tier H (112 px), a 1K source is already 1.26× oversampled, so there is nothing to gain.
- At a 2× close zoom (224 px), one of three 2K rolls is clearly crisper (`review/size-1k-vs-2k-224px.png`).

**Decision:**

- **1K for every troop and commander sheet.**
- **2K for big-body single cutouts where tier H exceeds the 1K source**:
  - size 4 to 6, at 380 to 672 px;
  - the Salamander, at 258 px against 157 to 195 px.
- Each 2K cutout is gated by its own camera check.
- 4K is untested.

---

## 4. Mounts

### 4.1 Size (owner note 3)

`sbx/tools/cal_mount_size.py` and `review/mount-scale-tierS.png` (two foot men, the Wolf Rider today, the Wolf Rider
fixed; tier S, 4×).

**What was wrong:**

- The packer scales a figure by its stand frame's body height, after a 5% opening that drops a raised haft.
- On the Wolf Rider that opening also drops the wolf's 6 to 7 px legs (`review/wr-opening.png`). The body measured
  hood-to-chest: 105 px of a 144 px hood-to-paws figure.
- It was then scaled to `heightPx` 74. In the game the figure stood **50.7 wu tall, and its rider's head was 1.56× a foot
  soldier's** (16.2 px against 10.4 px at tier S).

**The painted proportions are right:**

- At a man's scale the painted Wolf Rider is 32.5 wu tall, and its maquette is 32.7 wu.
- The wolf's back sits at about 0.68 of a man's height. The kit asks for "a man's chest" (0.72).

**Fix (in the sandbox `pack.py`):** mounted bodies are measured from the top of the opened body (hood or helm; the spear
and pennon above it stay cut) down to the lowest painted pixel (the paws or hooves). That height is set to the maquette's
at a man's scale:

| Mounted body | Height | Tier S | Tier H |
|---|---|---|---|
| Wolf Rider | 32.7 wu | 65 px | 131 px |
| Ash Rider | 39.7 wu | 79 px | 159 px |

**Measured after the fix:** the rider's head is 10.4 px, exactly a foot soldier's, and the Wolf Rider is 32.7 wu tall.

**The Ash Horse:**

- No figure is painted yet (stage C).
- Its maquette rider is a man.
- The Ash Rider's maquette (39.7 to 40.6 wu) already matches the design's size-2 height of 42 wu.

**Record in the repo when approved (battle-overhead.md 3.2):** "a mounted figure draws a man-sized rider; its height
comes from its maquette: Wolf Rider 33 wu, Ash Rider 40 wu; the ladder's 42 wu is a cap for riders, not a target."

If the owner wants a bigger wolf, that belongs in the stage C maquette and prompt (rig scale 0.72 → about 0.8). It is not
a packer change.

### 4.2 Mount and rider on separate sheets (owner note 3, "as in Dominions")

Split maquettes (`sbx/tools/cal_mount_guides.py`, `review/mount-split-guides.png`): the joint Wolf Rider guide is
re-rendered as wolf-alone and rider-alone sheets. Both use one placement and one scale, so they composite exactly.

| Route | Wolf alone | Rider alone |
|---|---|---|
| Pro from its split maquette | **1/16** (profile, eye level, too large); re-roll with the failure named and the joint sheet as Image 2: **0/16** | **6/16**; re-roll **0/16** (eye level, ruled grid lines) |
| **Nano Banana 2.1 edit of the camera-correct joint sheet** (`raw/ad/wr.front.blue.g3pro`, 14/16) | **15/16**, saddle empty, back and saddle cloth repainted | rider alone, seated in the air, legs and boots painted where the wolf hid them; the two riderless cells hold him dismounted on foot; one cell came out empty |

**The edit route against the joint sheet it came from** (`cal_mount_split.py`, `review/mount-split-edit.png`; the same
canvas, so registered by construction):

- **Containment:** 0.99 (wolf alone) and 0.99 (rider alone): each half lies inside the joint figure.
- **Recomposed:** wolf alone plus rider alone against the joint figure, IoU 0.95 (median over the cells).
- **Light:**
  - The sun's side, measured as the lightness of the figure's upper-left half minus its lower-right half (ΔL in OKLab),
    is +0.047 for the joint figure and +0.064 for each half.
  - The lightness of shared pixels differs by +0.013 (wolf) and −0.007 (rider). **Camera, light and scale match.**
- **Weak points:** the edits dropped the spear in a few rider cells and left one rider cell empty. These are re-roll
  material, and the checks catch them.

**Cost per mounted unit** (two views; Pro joint sheets measured at about 2.5 generations a view in the pilot, edits at
1.15):

| Route | Generations |
|---|---|
| Joint sheet only, as today | about 5 |
| Joint + wolf alone + rider alone (edits) | about 9.6 |
| Plus a full dismounted foot sheet (16 poses: a re-dress of a foot body sheet) | about 12 |
| A second unit on the same mount, reusing the mount-alone frames: only the rider layers | about 4.6 |

**Recommendation: later, at stage C**, with the War Wolf's and Ash Horse's figures:

- **Order:** the owner's order puts mount figures after their portraits.
- **Rules:** M1 has no unhorsing (one body, option A); M2 adds it.
- **Cost:** +7 generations per mounted unit, +14 for both.
- **Method:** the route is proven: the mounted figure is the joint sheet; the riderless and dismounted layers come from
  edits of it. That avoids any draw-order problem where the wolf's head passes in front of the rider's legs.

---

## 5. Troop variation without new sheets (owner note 1)

The page is `stage-b/cal/page/variation.html` (`var_scene.js`, built by `var_page.py`, shot by `var_shoot.cjs`; Pixi
8.22.0, no page errors). It shows:

- **three blocks of 8 × 4** of the kept frames:
  - the Cinder back view;
  - the Cinder front view with the surcoat;
  - the Thornwood Warden, hue-locked;
- **four columns:** copies of one frame; the AD's change 16; plus tints; plus stencils.

It renders at play zoom, close zoom, in motion and in a lineup. Each block is **one `Mesh` with a custom shader, one
draw call**. The 384 figures update in 1.1 to 1.4 ms per frame on software GL.

### 5.1 Per figure, seeded

**Material tints, classified per pixel in OKLab** from the painted colour itself, with no extra atlas. The side keyline,
at 75% alpha, is left alone.

| Material | Variation |
|---|---|
| Cloth | the side's hue window, varied one way only (5.3) |
| Skin | L −0.07 to +0.05, hue ±6° |
| Metal | L −0.06 to +0.05, warmer (rust) or cooler (steel) |
| Leather and wood | L ±0.05 |
| Whole figure | brightness −8% (the AD's) |

**Shared stencils** change only the cloth's lightness, never its hue. Every troop type reuses them:

- 8 shield-face designs on a shield ellipse found per frame (`review/var-stencil-proof.png`): plain, rim, ring, pale,
  fess, quartered, chevron, per bend;
- crest tips or stripes;
- a belt, a sash or a hem.

**Transforms:** scale ±4%, lean ±1.5°, place jitter ±1.2 wu, a rest frame (stand, or idle2 30% of the time), a motion
phase, and a tempo of ±8%. The tempo gives the individual timing the owner liked (note 4).

### 5.2 Measures

`cal_var_measure.py`; data in `work/variation.json`; images `review/var-close-blocks.png` and `page/shots/`.

**Neighbour difference:** the mean |ΔL\*| over two neighbours' silhouettes, aligned on their feet, in a lineup at 48 px.
Copies read 0 to 6.5, which is only sub-pixel placement.

| View | AD variation | + tints | + stencils |
|---|---|---|---|
| Cinder back | 6.0 | 12.0 | 10.3 |
| Cinder front | 12.0 | 18.4 | 17.2 |
| Warden | 6.9 | 11.2 | 10.5 |

Tints roughly double the AD's variety; the stencils show at close zoom (72 px) and barely at play zoom.

**Rules:**

- **Side share of whole blocks at 28 px, with the side keyline:**
  - Cinder: 51.5% → 50.9% (back) and 51.0% → 51.1% (front), from the AD's variation to full.
  - The Warden: 24.6% → 24.9%.
  - Tints and stencils cost at most 0.6 points. The drop from copies to the AD's variation is the rest frames.
  - This screenshot measure reads about 10 points below `checks.side_report`.
- **Each figure's own side share:** its minimum is unchanged (Cinder back 0.508 → 0.506).
- **Value margin:** the worst is 24.6 L\* below swamp; the rule is 15.
- **Identical neighbours:** 0 in every varied block.
- **Colour vision:** the two cloths simulated for protanopia and deuteranopia (Machado 2009, full severity), CIEDE2000
  between the closest Cinder and Thornwood variants:

  | Protan / deutan | Value |
  |---|---|
  | Untinted cloths | 11.9 / 23.6 |
  | Side keylines | 10.4 / 18.6 |
  | **Symmetric** tint limits | **4.7 / 14.7: fail** |
  | **One-sided** limits | **11.9 / 23.6: unchanged** |

### 5.3 The limits for production (one-sided: each side's cloth moves away from the other side's)

| Side | Cloth L | Cloth hue | Cloth chroma | Stencil shade |
|---|---|---|---|---|
| Cinder | 0 to +0.03 | 0° to +6° (toward yellow) | ×1.00 to 1.08 | light only, +0.07 |
| Thornwood | −0.035 to 0 | 0° to +6° (toward blue) | ×0.92 to 1.00 | dark only, −0.11 |

**Recommendation:**

- **Adopt the shader route in the battle renderer:**
  - one mesh per block (or per side) with the material shader and the per-figure attributes;
  - tints and per-figure transforms on by default;
  - stencils at tier H only.
- **Record in `docs/09-balance.md` (numbers) when approved:**
  - the limits above;
  - the rule "cloth varies one-sidedly per side; the colour-vision contrast of the two cloths must not drop".
- Commanders, creatures and gods are excluded: they must match their portraits.

---

## Pipeline findings on the way

1. **The keyer blackened thin features.**
   - **What happened:** key.py's pilot fix gives a pixel that leans toward the key the colour of its clean neighbours,
     within a 6-step reach. A thin feature that leans toward the key all through (an antler, a staff, a spear or pennon
     pole, a bow) has no clean pixel in reach, so it was left pure black.
   - **Size:** 300 to 3,500 px per sheet, including every pilot pick. The pilot's "black spears" were partly this.
   - **Fix (sandbox `key.py`):** such pixels keep their own paint, with the part of their chroma that points at the key's
     hue removed (`hue_despill`).
   - **Measured:** black pixels fell to 0 to 127 per sheet (`work/keyfix/keyfix.json`, `review/keyfix-thin.png`).
     `edgeDevPct` stays under the 8% gate, with a worst of 6.25.
   - **Left over:** a slight mauve on the magenta-keyed staffs.
   - **Rejected:** a 2-step reach, which pushed `edgeDevPct` past 8%.
   - **Action:** apply to `tools/key.py`.
2. **The re-dress camera gate** scales by the body sheet's cell height (1.3).
3. **An empty cell** (a speck of under 300 px) counts as missing, not as a frame (`cal_pipe.py`).

---

## Generations (24 of 30)

| # | Sheet (`stage-b/cal/raw/`) | Model | Result |
|---|---|---|---|
| 1 to 4 | `cmdChief.front.body`, `cmdCaster.front.body`, `cmdDruid.front.body`, `cmdChief.front.zonesonly` | Pro | 13/16, 16/16, 16/16, 14/16 |
| 5 to 10 | `ac06`, `ac03`, `cm03`, `ea07`, `ed08`, `ed05` `.front.redress` | NB 2.1 | all pass (1.3) |
| 11 | `ac06.back.redress` onto the troop back sheet | NB 2.1 | 13/15; it kept the troop's shield, because the prompt omitted "no shield" |
| 12 | `cmdChief.back.zonesonly` | Pro | 3/16, fail |
| 13, 14 | `longbowHunter.front.green`, `.r2` | Pro | 11/15 and 3/15; colour as in 2.2 |
| 15 to 18 | `cw.front.2k`, `cw.back.2k`, `cw.back.2k.b`, `cw.front.4k` | Pro | 13/15, 12/15, 13/15; 4K HTTP 502 |
| 19 to 22 | `wolfOnly.front`, `wolfRiderSeat.front`, `.r2` of each | Pro | 1/16, 6/16, 0/16, 0/16 |
| 23, 24 | `wolfOnly.front.edit`, `wolfRiderSeat.front.edit` | NB 2.1 | 15/16; registered (4.2) |

Prompts are in `stage-b/cal/prompts/` and jobs in `stage-b/cal/jobs/`. Every sheet has its sidecar (sha256, model,
prompt, references, usage) and its keyed and sliced work with `checks.json` under `stage-b/cal/work/`. No prompt names
another game, franchise, artist or studio.

## Open items for the next steps

- The commander **back-view body sheet**: test the troop back sheet as Image 2 (two rolls per kind budgeted).
- The **Longbow Hunter front camera**: two rolls failed.
- **Apply the sandbox fixes to the shared tools:**
  - `key.py`: thin features;
  - `pack.py`: mounted height (`MOUNTED_PX`, `mounted_height`);
  - the re-dress gate;
  - the Thornwood lock's floor and grey band (`ad_huelock.py`).
- **Record the rules when approved:**
  - mounted heights in `battle-overhead.md` 3.2;
  - variation limits in `docs/09-balance.md`.
