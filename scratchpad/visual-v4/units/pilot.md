# Stage A pilot: painted figures on the battle field

2026-10-23. The pilot of `art-plan.md` section 9, cut to the brief's four pieces:

- the Cinder Warrior, back and front views;
- the Wolf Rider, front view (a mount);
- the Salamander, face 01, which is the face battle c ("The Fight in Wickemoss") shows, with its approved portrait as
  the identity reference;
- one troop card bust (the Warden).

Nothing here is production art and nothing went into the repo. Paths are relative to `scratchpad/visual-v4/units/`.

The Wolf Rider is a **pipeline probe for mounted figures, not a figure for approval**. The owner's order for mounts
holds: the War Wolf's painted portrait comes first (stage B), then its figure in the game (stage C), then animation
(stage D).

---

## 1. The answer, first

- **Camera: solved for people, half-solved for mounts.** With the clay maquette as Image 1, Nano Banana Pro
  (`gemini-3-pro-image`) put 13 to 15 of 15 cells at the battle camera on 6 of 8 Cinder Warrior sheets. For the
  Wolf Rider it managed 2 of 5. Nano Banana 2.1 (`gemini-nano-banana-2.1`) did it on 2 of 6 Cinder sheets and 0 of 2
  Wolf Rider sheets. It got the Salamander right 3 times out of 3.
- **The 2026-10-22 failure is fixed** on the three counts it failed:
  - The camera: the picked back sheet reaches IoU 0.80 against the guide; the old sheet's was 0.54, facing the wrong
    way.
  - Pose variety: the march frames now share 0.61 to 0.64 of their silhouette; the old sheet's shared 0.88.
  - Side colour on the back view: 33% against 5%.
- **The Salamander now matches its portrait.**
  - It is painted from portrait 01: dark obsidian scales, a fine net of dull ember cracks, the broad flat head, the
    horn nubs along the jaw, the brow knobs.
  - It stands at the battle camera, matching the maquette at IoU 0.92 (back view) and 0.89 (front view).
  - The median colour of its upper third is ΔE2000 3.0 and 2.9 from the portrait's subject. The check's limit is 18.
  - The mockup's orange lizard with flame spikes is gone.
  - The remaining identity gap: the pale scrape across the snout does not show (section 5.3).
- **Still failing:**
  - **Front-view side colour.** The best front sheet scores 17%; the target is 30%. The pipeline's new cloth
    normalisation brings it to 29%.
  - **The Wolf Rider's green.** Painted, it scores 1%; the procedural figure scores 13.5%. The magenta key also
    leaves a pink cast on the grey fur.
- **The models for production:**
  - **Nano Banana Pro (`gemini-3-pro-image`)** for figure sheets: troops, commanders, mounted troops.
  - **Nano Banana 2.1 (`gemini-nano-banana-2.1`)**, the portraits' own model, for:
    - creature and god cutouts made from an approved portrait;
    - card busts and portraits;
    - an optional repaint pass over a Pro sheet. In this pilot the repaint kept its input's camera every time.
  - The automatic all-cells camera check gates every sheet; a sheet that fails is re-rolled once.
  - `nano-banana-pro-preview` is not a third model: the API lists it as "Nano Banana Pro", like
    `gemini-3-pro-image`, and its two runs behaved like it.
- **Budget:** 37 of the 60 stage A generations were spent; 23 are left.
- **Pipeline fixes during the pilot:**
  - The keyer left a yellow-olive rim on orange edges. Measured as edge-colour deviation, it was 18 to 41% of edge
    pixels; it is now 1.6 to 3.5%.
  - The packer measured a figure's height including a raised weapon; it now measures the body.
  - The plan sized size-3 bodies at 129 px; at the maquettes' true scale the Salamander is 157 to 195 px tall.

---

## 2. What was run

Every generation went through `tools/gen.py` (logged in `gen-log.tsv`, stage A budget enforced) via
`tools/run_jobs.py`. Prompts are in `prompts/pilot/<round>.<job>.txt`, jobs in `pilot/jobs-<round>.json`, raw sheets
with their sidecars (sha256, model, prompt, references, usage) in `pilot/raw/<round>/`.

| Round | What changed (`tools/pilot_rounds.py`, `tools/pilot_round3.py`) | Generations |
|---|---|---|
| r1 | the plan's prompts as written; each piece with Nano Banana 2.1 and Nano Banana Pro | 12 |
| r2 | side colour moved onto what each view sees from above; armour sleeves; one facing said twice; a detail paragraph; a two-step job (nb21 repaints the r1 Pro sheet); `nano-banana-pro-preview` on the two pieces where nb21 failed the camera; Salamander cracks shown and kept dark; bust without weapons in frame | 15 |
| r3 | back view's hit and fall cells re-worded; no horns on troops; long cape (back), wide mantle and tall crest (front); cloth named by light, middle and shade colours; shield back described for the back view; wolf riders larger, green named | 5 |
| r3b | nb21 repaints of the three r3 Pro sheets | 3 |
| r3x | the plan's one re-roll of a sheet that failed a check (the r3 Pro Cinder front and Wolf Rider) | 2 |
| **Total** | 19 nb21, 16 `gemini-3-pro-image`, 2 `nano-banana-pro-preview`; no failed calls | **37 of 60** |

Time and tokens per generation, from `gen-log.tsv` (machine shared, timings noisy):

| Model | Generations | Seconds, mean (min to max) | Tokens, mean |
|---|---|---|---|
| gemini-nano-banana-2.1 | 19 | 14.4 (10.5 to 21.6) | 6,661 |
| gemini-3-pro-image | 16 | 16.1 (14.5 to 18.4) | 3,806 |
| nano-banana-pro-preview | 2 | 16.1 (15.0 to 17.3) | 4,146 |

Both r3x re-rolls failed:

- The Cinder front had the right camera but a broken background: grey-green patches that cannot be keyed.
- The Wolf Rider came out as a side view.

Under the plan's rule a second failure is reported, not re-rolled. Each piece had three prompt rounds; none had a
fourth.

---

## 3. The measures

`tools/pilot_pipe.py` runs every raw sheet through key → slice → checks; `tools/pilot_table.py` writes
`pilot/measures.json` and `pilot/measures.txt` (the 31 measured sheets: every figure sheet of r1 to r3b; the busts are judged by eye and the two r3x re-rolls could not be measured). Added for the pilot (`tools/pilot_metrics.py`):

- **Camera, every cell.** Each cell's silhouette is compared with the guide's same cell, both normalised to their own
  height and ground point.
  - It reports the median IoU and the facing margin (IoU minus the IoU with the mirrored guide cell).
  - A cell "follows" the guide when its IoU is at least 0.55 and its margin at least 0.
  - The plan's stand-only camera check (`checks.py`) passes a sheet whose stand cell is right and whose other 15 cells
    are side views. This check does not.
- **Consistency between poses.** Each frame is compared with the stand frame:
  - a CIELAB colour-histogram intersection (8 × 8 × 8 bins);
  - the CIEDE2000 distance of the median colours;
  - the frame's own cloth share.
  - Pilot thresholds: intersection ≥ 0.55, ΔE ≤ 12.
  - These caught a Pro sheet whose hit cell turned to face the camera (ΔE 14.8, cloth share at 0.29 of the stand
    frame's).
- **Fringe.**
  - `edgeDevPct`: the share of edge pixels (alpha 0.3 to 0.97) whose OKLab colour is more than 0.10 from the opaque
    pixels within 2 px. Added to `key.py`; `checks.py` now fails a sheet above 8%.
  - The plan's `fringePct` counts only pixels still leaning toward the key, so it read 0 while a visible yellow rim
    sat on every orange edge.
- **Identity (big bodies).** The cutout's silhouette against its maquette, and the plan's colour check (median of the
  upper third against the portrait's lit subject, ΔE2000 < 18).
- **Side colour with cloth normalisation.** `pack.py` gained `cloth_boost`, see section 6.
- **The look at 40 px.** `pilot/review/look40-*.png`: the stand frame scaled to 40 px tall over three grounds, at 1×
  and at 4×.

### 3.1 Camera fidelity, all sheets

Cells following the guide (out of 15, or 16 for the Wolf Rider) and the stand cell's IoU and facing margin:

| Sheet | r1 | r2 | r3 / r3b / r3x |
|---|---|---|---|
| Cinder back, Pro | **15/15**, stand 0.83, +0.22 | **15/15**, 0.91, +0.27; `nano-banana-pro-preview` **14/15**, 0.75, +0.10 | r3 **14/15**, 0.80, +0.16 |
| Cinder back, nb21 | 10/15, 0.62, +0.05 | 9/15, 0.62, +0.04; repaint of r1 Pro **15/15** | r3 8/15; r3b repaint **14/15** |
| Cinder front, Pro | **14/15**, 0.72, +0.08 | **15/15**, 0.79, +0.12 | r3 2/15 (eye-level camera); r3x background broken |
| Cinder front, nb21 | 8/15, 0.64, +0.03 | **13/15**, 0.75, +0.10; repaint **14/15** | r3 **14/15**, 0.70, +0.07; r3b repaint 2/15 (its input failed) |
| Wolf Rider, Pro | **14/16**, 0.45 | **13/16**, 0.83, +0.40; `nano-banana-pro-preview` 0/16 (side view, ruled grid lines) | r3 0/16 (side view); r3x side view |
| Wolf Rider, nb21 | 0/16 (side view) | 0/16; repaint of r1 Pro **14/16** | r3b repaint 0/16 (its input failed) |
| Salamander back | nb21 0.80, +0.53; Pro 0.41 (fail) | nb21 **0.92**, +0.64; Pro 0.39 (fail) | not re-run |
| Salamander front | nb21 **0.89**, +0.58; Pro 0.60 | not re-run | not re-run |

Pass rates:

| | People (Cinder sheets) | Wolf Rider | Salamander |
|---|---|---|---|
| Pro (both names) | 6 of 8 | 2 of 5 | 1 of 3 |
| Nano Banana 2.1 | 2 of 6 | 0 of 2 | 3 of 3 |

An nb21 repaint kept its input's camera in 6 of 6 cases.

Camera adherence is a property of each roll, not of the model: the same Pro prompt that passed twice put the r3
Cinder front at eye level. The all-cells check catches it in about 1 s.

### 3.2 The picks (`pilot/picks.json`)

| Piece | Sheet | Camera: cells, stand IoU | Pose variety | Consistency | Side share at 28 px | Fringe (edge, key in unit) |
|---|---|---|---|---|---|---|
| Cinder Warrior, back | r3 Pro | 14/15, 0.80 (+0.16), head offset −0.07 against −0.01 | march 0.64 (legs 0.50), most alike 0.67 | hist ≥ 0.71, ΔE ≤ 12.5 (deadA, face-up) | **33.3%** (with normalisation 44.8%) | 2.0%, 0.03% |
| Cinder Warrior, front | r2 nb21 | 13/15, 0.75 (+0.10) | march 0.61 (legs 0.48), most alike 0.81 | hist ≥ 0.74, ΔE ≤ 6.2 | **17.3%** (29.2%) | 2.7%, 0.14% |
| Wolf Rider, front | r2 nb21 repaint of r1 Pro | 14/16; stand 0.46 (its spear) | most alike 0.58 | hist ≥ 0.69, ΔE ≤ 6.3 | **1.2%** (2.8%); procedural 13.5% | 1.6%, **0.56%** (flag: pink cast) |
| Salamander 01, back | r2 nb21 | 0.92 (+0.64) | one cutout | identity ΔE 3.0 (whole 7.3) | not applicable | 0.6%, 0.00% |
| Salamander 01, front | r1 nb21 | 0.89 (+0.58) | one cutout | identity ΔE 2.9 (whole 4.5) | not applicable | 0.04%, 0% |
| Warden card bust | r2 nb21 | not applicable | not applicable | framing and light of the leader portraits | green on mantle, tabard and crest | not applicable |

Reference values:

| Figure | Back view | Front view |
|---|---|---|
| The mockup's procedural Cinder Warrior | 33.1% | 38.2% |
| The procedural Wolf Rider | not measured | 13.5% |
| The 2026-10-22 painted sheet | 5% | not measured |

Value: every painted block is at least 15 L\* below each of the four grounds:

| Figure | Margin on the worst ground |
|---|---|
| Back | 26.5 |
| Front | 28.0 |
| Wolf Rider | 16.9 (the tight one) |

Scale: the stand, idle and march heights are within ±15% on every pick.

The feet overlay (`pilot/review/poses-*.png`, right panel) shows the upright frames standing on one ground point; no
foot slides.

---

## 4. In the game: the formation test

`pilot/formation-test.html` is a copy of `visual-v4/battle-mockup.html` with the pilot injected
(`tools/pilot_page.py`, `tools/pilot_scene.js`). It opens battle c on its own swamp ground and hides the battle's
figures. It then stands painted blocks beside the mockup's own procedural figures, drawn by its `bakeFigures` and
`makeBigBody`:

- 30 Cinder Warriors in the back view and 30 in the front view, each as painted, painted with cloth normalisation,
  and procedural;
- 12 Wolf Riders, painted and procedural;
- the Salamander, back and front, beside "a man" and the procedural body, with its card portrait as a card.

Everything stands, unanimated. Painted frames come from the packed atlases (`pilot/atlas/`):

- tier S at f ≤ 48 px, tier H above;
- mipmapped, with the design's keyline;
- one soft contact shadow per block, the same for painted and procedural.

`tools/shoot_pilot.cjs` shoots the presets (Pixi routed to the repo's copy; no page errors). The shots are in
`pilot/formation/`:

| Shot | What it shows |
|---|---|
| `formation-overview.png` | play zoom (a man 28 px tall), everything |
| `formation-close-near.png`, `-close-far.png`, `-close-wolves.png`, `-close-sal.png` | the closest zoom (72 px, tier H) |
| `formation-play-sal.png` | play zoom, the Salamander beside its card portrait and a near block |
| `formation-look40-near.png`, `-look40-far.png` | a man 40 px tall |

What the shots show:

- **Play zoom.**
  - The painted Cinder blocks read as blocks of their side: orange capes in the back view, orange shields and
    mantles in the front view.
  - They are darker and more metallic than the procedural blocks, which are flat bright orange. The front view reads
    least: iron helms, faces and shoulders show most from above.
  - The normalised cloth reads as clearly as the procedural blocks while keeping the painted shading.
  - The painted Wolf Riders read as a dark grey mass with dim green; the procedural ones read green.
- **Closest zoom.**
  - The painted soldiers hold up: crest, cape, scale, axe and shield are legible, and the brushwork shows.
  - The procedural figures look like toys beside them.
  - The painted wolves read as wolves with hooded riders; the pink cast on the fur shows here.
- **40 px** (`pilot/review/look40-*.png`):
  - The back view reads as crest, cape and axe.
  - The front view reads as round orange shield, mantle and helm.
  - The Wolf Rider is muddled: a grey-pink body, the rider small. Only the head and spear read.
- **The Salamander at true size.**
  - The plan's size table gave a size-3 body 129 px at tier S.
  - The maquettes are rendered at known rig scales (`guides.json` `k`), and a man's guide body is 28 wu. Measured
    that way, the Salamander's box is **97.6 wu tall in the back view (195 px at tier S) and 78.5 wu in the front view
    (157 px)**.
  - The same method gives the Wolf Rider 36.5 wu, which matches the plan's 37, so the method holds.
  - The test page uses the true sizes. The size table in `art-plan.md` 8.4 should take its big-body cells from the
    maquettes. A size-3 back view needs about 200 × 140 px at tier S, not 129.

---

## 5. Piece by piece (the art director's notes)

### 5.1 Cinder Warrior

**r1.**

- Nano Banana 2.1 painted the closest thing to the portraits: oil, rust, frayed cloth. But it used an eye-level
  three-quarter camera with long legs, and its march frames were nearly alike (0.84).
- Pro followed the maquette exactly but painted flatter. It gave bare clay-grey arms, because the kit says "ash-grey
  skin", and turned the hit cell to face the camera.
- Front shields came out as brown wood in both, so the front side share was 7 to 8%.

**r2.**

- Kits gained armoured sleeves, a shoulder mantle and solid orange shield faces. Front shields went orange.
- Nano Banana 2.1 reached the camera on the front view (13/15).
- Pro painted orange shield faces on the soldiers' backs.
- The chieftain portrait (Image 2) put small horns on the troops' helms.

**r3.**

- Re-wording the back view's hit cell ("lurches backward toward us with his back still turned to us, head bowed")
  fixed the facing.
- A long cape for the back view lifted the side share from 16 to 20% to **33%**.
- Horns are gone; the shield shows its back in the back view.
- The front view's wide mantle and tall crest did not raise its share: 14.8% against 17.3% in r2. At 28 px a front
  block shows helms, faces and the tops of shoulders, and only the mantle edge of those is cloth.

**Picks.**

- Back: r3 Pro.
- Front: r2 nb21. It has the highest raw front share, the best paint, and 13/15 cells.

**Still to fix in production.**

- The front view's side colour (section 6).
- The r3 Pro back sheet is flatter than the nb21 front. The two views of one unit come from two models and differ
  in hand: the nb21 front has finer scale and edge detail. The repaint pass is the fix when the art director sees the
  difference at close zoom.

### 5.2 Wolf Rider (mount probe)

- Nano Banana 2.1 paints a fine timber wolf but only in profile: 0/16 cells twice.
- Pro reaches the front three-quarter camera on 2 of 5 rolls. Its r3 prompt ("as large as the maquettes") produced
  side views. The nb21 repaint of a good Pro sheet is the best result (14/16 cells, painted fur).
- **Green.** The deep pine green (#1F6A50, OKLCH chroma 0.084) is painted darker and greyer still. Under 2% of a
  block reads as the side at 28 px. The procedural figure manages 13.5%: its flat hood is the only clear colour.
- **Pink cast.** 14 to 19% of the light fur pixels lean pink, already in the raw paint (14% raw, 14% keyed), and the
  keyer flags 0.56% key colour inside the unit.
- **For stage C:**
  - Try a blue key for grey-furred mounts. A blue cast on grey fur reads as the sky fill the style already asks for.
  - Give the wolf a large, light-catching cloth (a pale-edged green saddle cloth over the shoulders and a green
    pennon on the spear).
  - Budget mounted sheets at about 2.5 generations each.

### 5.3 Salamander, face 01

- Nano Banana 2.1, given the portrait as the identity reference and the low-slung maquette, paints the portrait's
  creature from above:
  - the same dark obsidian scales;
  - the broad flat river-salamander head;
  - the row of stubby horn nubs along the jaw and the knobs on the brow;
  - after the r2 prompt, the fine net of dull ember cracks over the back.
- Pro lit it orange (r1) and turned it toward the side (both backs failed the camera).
- **Not yet right:** the portrait's pale healed scrape across the snout does not show in either view; it goes into
  the stage C prompt as a named mark.
- The battle c figure is the back view. The front view is the one that proves the match;
  `pilot/review/salamander-vs-portrait.png` and `salamander-head-identity.png` show both against the portrait.

### 5.4 Warden card bust

- Nano Banana 2.1 in r2 is the pick (`pilot/review/bust-vs-leaders.png`, beside Warden Captain 07 and Elder Druid 08
  at 400, 128 and 64 px). It has the leader portraits' framing, candle light, dark background and brushwork, so troop
  and leader cards read as one family.
- The side's green shows on the leaf mantle, the tabard and the helm's leaf crest, more strongly than on the leaders,
  as intended.
- Pro kept the shield and sword in frame and painted a classical crested metal helmet.
- The bust was made before any Warden sheet exists, with a Thornwood portrait for materials. In production the bust
  follows its approved sheet (plan 5.4).

---

## 6. Pipeline changes made in the pilot

| Tool | Change | Measured |
|---|---|---|
| `key.py` | Pixels leaning toward the key (strength above 5% of the background's) take the colour of their clean opaque neighbours; despill stays as a safety. Un-mixing the key by alpha was tried and rejected, because alpha here is a key-strength ramp, not coverage. The old keyer is saved as `work/key.before-pilot.py`. | edge deviation, old keyer → new: Cinder back (r2 Pro preview) 32.7 → 3.5%, Cinder front (r2 nb21) 40.7 → 2.7%, Wolf Rider (r2 repaint) 17.9 → 1.6% |
| `key.py`, `checks.py` | new `edgeDevPct` check (≤ 8%) | as above |
| `pack.py` | the scale is set by the stand frame's body height (an opening removes raised hafts), not its box | Wolf Rider: body 121 px against a 179 px box (its spear) |
| `pack.py` | `cloth_boost` (spec `DIR:FIG:VIEW:boost`): the side-hue cloth, opened by 3 px so rust edges, skin and wood specks are left alone, is moved toward the cloth's chroma in OKLab, keeping its painted lightness and strokes | side share back 33 → 45%, front 17 → 29%; value margin unchanged (+0.5 L\*) |
| `pilot_metrics.py` | all-cells camera, consistency, creature camera and identity, side share with and without normalisation, the 40 px look | sections 3 and 4 |
| `slice.py` | unchanged; on generated sheets no cell went missing or overlapped a neighbour | |

---

## 7. Model chosen, and the prompt changes for production

**Models.**

- **Figure sheets of troops, commanders and mounted troops: Nano Banana Pro (`gemini-3-pro-image`).** Every sheet is
  gated by the all-cells camera check (≥ 13 of 15 cells, ≥ 14 of 16 for mounts), consistency, side share and
  `edgeDevPct`, and re-rolled once on failure.
  - Expected cost: about 1.3 generations per foot sheet and 2.5 per mounted sheet.
  - An optional Nano Banana 2.1 repaint pass (one more generation) when the art director finds the Pro hand too flat
    at close zoom. It kept the camera 6 of 6 times.
- **Creature and god cutouts made from an approved portrait, card busts and portraits: Nano Banana 2.1
  (`gemini-nano-banana-2.1`).** It held the Salamander's identity and camera 3 of 3 times, and it is the model of the
  136 approved portraits.
- `nano-banana-pro-preview` is the same model family as `gemini-3-pro-image` (the API lists both as "Nano Banana
  Pro") and is not needed.

**Prompt changes for production** (`tools/make_prompts.py` should take them over from `pilot_rounds.py` and
`pilot_round3.py`):

1. **One facing, said twice.** Add a "Facing, again" paragraph naming every cell, including the hit, falling and
   fleeing figures.
2. **Back-view hit and fall cells re-worded:** the back stays turned to us, the head bowed, and "we never see his
   face". Every model turned the old "head snapped back" cell toward the camera.
3. **Side colour where the view sees it.**
   - Back view: a long cape from the shoulders to the backs of the knees.
   - Front view: a solid-painted shield face (the largest patch of colour), a wide mantle thrown forward over both
     shoulders, and a tall crest.
   - The cloth is named by its light, middle and shade colours ("#D9744A where the sun strikes it, #C4532C, #7E3118
     in the shade; never brown, grey or dusty").
   - Thornwood greens get the same, with a light-catching cloth.
4. **Armour over the limbs** (scale sleeves, bracers), so little skin shows. Bare ash-grey arms paint as clay.
5. **No leader marks on troops** ("no horns: a chieftain's mark, never a soldier's"). A leader portrait used as the
   style reference leaks its ornaments otherwise.
6. **The back view's shield shows its back** (dark wood, rim, straps); never a shield face on a soldier's back.
7. **A detail paragraph:** individual scales with rusted edges, rivets, straps, frayed hems, wood grain, varied
   strokes, and "values simple enough to read at 40 pixels: a light top against darker legs".
8. **Mounted sheets:**
   - cell words rewritten for a rider and mount;
   - "a real, huge timber wolf … not a horse and not a dog";
   - the spear kept in the stand cell;
   - a blue key to test for grey-furred mounts.
9. **Creatures from a portrait:**
   - "the creature stays as dark as in its portrait, never washed orange";
   - the identity marks named so they show from behind at the edges;
   - the cracks "show clearly … thin dull lines, never glowing";
   - the pale snout scrape named again.
10. **Card busts:** "nothing behind the head or the shoulders: no shield, no sword hilt, no spear, no hands"; the
    helm's shape stated ("a rounded helm of overlapping bark plates, not a classical crested metal helmet").
11. **Keep the clay maquette as Image 1 for every sheet.** It is what carries the camera for Pro. For nb21 it carries
    the camera only on big single bodies.

**Rules the pilot proposes for the plan** (to record when the owner has seen the pilot):

- big-body tier sizes from the maquette scale (section 4);
- `edgeDevPct` in the fringe check;
- body-height scaling in `pack.py`;
- cloth normalisation in `pack.py`, off by default. The owner should see it (the middle blocks of the formation
  test) before it becomes a rule;
- the all-cells camera check as the gate, with the stand-only check kept as a quick first test.

---

## 8. Files

| Path | What |
|---|---|
| `gen-log.tsv` | the 37 generations (file, model, seconds, tokens, stage, purpose, date, result) |
| `prompts/pilot/` | every prompt sent, by round and job |
| `pilot/raw/<round>/` | the raw sheets per model with their JSON sidecars |
| `pilot/review/contact-<piece>.png` | every raw sheet of a piece, by round and model, with its measures |
| `pilot/work/<round>/<sheet>/` | keyed sheet, key report, sliced frames, `checks.json`, formation proof |
| `pilot/measures.json`, `pilot/measures.txt` | all measures of the 31 measured sheets |
| `pilot/picks.json` | the picked sheets |
| `pilot/frames/` | the picks' sliced frames and their JSON (anchors, boxes, heights) |
| `pilot/review/poses-*.png` | the picks' frames on ground, with the feet overlay |
| `pilot/review/look40-*.png` | the stand frames at 40 px (4× and 1×) |
| `pilot/atlas/` | tier S and H atlases with Pixi JSON (as painted, and with cloth normalisation) |
| `pilot/formation-test.html` | the in-game formation test (battle c's ground); `window.__pilot.view(name)` for the presets |
| `pilot/formation/` | the formation shots, play zoom, 40 px and closest zoom |
| `pilot/review/salamander-vs-portrait.png`, `salamander-head-identity.png` | the Salamander beside its card portrait and the procedural body |
| `pilot/review/bust-vs-leaders.png` | the Warden card bust beside two leader portraits at 400, 128 and 64 px |
| `tools/pilot_jobs.py`, `pilot_rounds.py`, `pilot_round3.py`, `run_jobs.py` | jobs and prompt rounds |
| `tools/pilot_pipe.py`, `pilot_metrics.py`, `pilot_table.py`, `pilot_figs.py` | measures and review images |
| `tools/pilot_page.py`, `pilot_scene.js`, `shoot_pilot.cjs` | the formation test page and its shots |
