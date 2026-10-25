# Stage C critique: creatures, mounts and gods standing in the game

Art director and QA, 2026-10-24, for owner review 2 (standing figures only; animation and magic are stage D).
Paths are relative to `scratchpad/visual-v4/units/` unless they start with `visual-v4/` or `ad-c/` (my sessions:
`scratchpad/ad-c/`). My evidence is in `stage-c/critique-shots/` (numbered 01 to 25, cited as [01] etc.).

## Verdict

**Close, but don't show it to the owner yet.** Most of the 37 figures read as their approved portraits at play zoom and
close up. The best ones are worthy of the pilot:

- the Salamander faces 02 to 04
- the four Treants (alder, willow, oak and birch, clearly four individuals)
- both Giants and the Great Wyrm in battle a
- Titan, Oracle, Pyre Lord, Cinder Idol, Ember Hierophant, Mother of Beasts, World Tree, Elder Wyrm and Horned Hunter

The painting is one family with the troops and commanders: the same oil-panel hand, the same upper-left sun and the same
keyline. The big bodies are a little cleaner and crisper than the troop sheets because each was generated at 1K to 2K,
but that reads as more detail, not as another style. Keying is clean in everything that ships:

- the key-hue cast on the edge ring of the tier H frames is at most 0.14%
- no creature frame has more than 1.2% pink or violet
- the Thornwood tint edits leave at most 0.4% ember hue

Neither the mockup sessions nor the lineup logged a page error or a failed request.

Some things would undercut "figures matching their portraits" and "individuals standing out" in front of the owner:

- the Hornets read teal at play zoom
- the default Wolf Rider front changes coat between standing and moving
- the Oakheart lost its helm
- two Treant faces have their crowns cut flat
- the Wild Spirit's back view rears up
- the Ascended Hero's front is 17% short
- the lineup shows stale gate flags

All of these are fixable before the review:

- **Code fixes:** 7, at no generation cost.
- **Re-rolls:** 11 generations, with at most 7 spares (18 at most, of the 31 left).

## What I looked at

- **The battle mockup** (`visual-v4/battle-mockup.html`), in my own Playwright sessions (`ad-c/tools/battle.cjs`, Pixi
  routed to the repo's copy). All three battles:
  - at deploy
  - playing at 1x and at 4x (march and clash)
  - zoomed close on every painted creature, mount and god:
    - at DPR 1, at the top zoom (tier H) and at play zoom (a man 28 px, tier S)
    - at DPR 2, at the top zoom
  - every card hovered:
    - near side: the card bar
    - far side: the enemy strip
  - the "Wolf Rider front: Kept test | War Wolf harness" buttons clicked for real in battle c

  Shots are in `ad-c/shots/dpr1`, `ad-c/shots/dpr2` and [13] to [19]. Zero errors.
- **The lineup** (`stage-c/lineup.html`; `ad-c/tools/lineup.cjs`):
  - 1440 × 900 at DPR 1 and 390 × 844 at DPR 3
  - front and back, every size band and All, with the play-zoom button
  - every legend entry focused in both views, plus keyboard Enter on the legend
  - the phone legend opened

  Shots are in `ad-c/shots/lineup` and [20] to [23]. Zero errors, and no horizontal overflow at 390.
- **Metadata and art:**
  - `stage-c/atlas/creatures/figures/*.json`, `index.json` and `pack-summary.json`
  - `stage-c/atlas/gods/gods.json`
  - the contact sheets in `stage-c/work/creatures/review/` and `stage-c/atlas/gods/contact/`
  - the approved portraits in `stage-b/portraits/`
  - my own measurements on the atlas frames: hue shares, coat colour per cell, sizes at tier S, edge casts and cut edges

## Figure by figure

"Play" means a man of 28 px (tier S); "close" means the top zoom (tier H).

| Figure | Reads as its portrait? | Size on the ladder | Action |
|---|---|---|---|
| Salamander 02, 03, 04 | Yes, at play and close: broad, narrow and viper heads, horns, cracks | 78/98 wu (front/back), as face 01 | Keep |
| Treant 01 (battle b), 02, 03, 04 | Yes; four distinct trees | 95/101 wu, ladder 95 | 02 back and 04 (both views) have crowns cut flat (fix 5) |
| Giant 01, 02 | Yes (bald and bearded; mane and slate guard) | 89/95, ladder 95 | Keep |
| Wolf | Yes; front camera reported but reads | 29.5 wu | Keep. Faint mauve rim on its back (fix 12) |
| Fire Sprite | Yes in front (the flame face reads close up); at play, orange winged imps | 24 to 26 wu | Keep (question Q8); no glow until stage D, as planned |
| Hornet Swarm (provisional B) | No: teal specks at play [01]; close up a fuzzy brown bee, not the portrait's black-and-ochre wasp [03] | 10 px per hornet | Fix 1 |
| Ash Rider | Mostly: dark horses, ember capes, lances. The coat is lighter than the portrait's charcoal | 39.5 wu body, ladder 42 | Front view has 0.5% side colour (fix 9) |
| Wolf Rider | Back yes (passes). Front: the harness default flips coat colour; the cloth is paler than the troops' [04] | 33.5 front / 39.5 back, ladder 42 | Fixes 2 and 7 |
| Oakheart | Partly: the portrait's tall bark helm, thorn crown and face crack became a low flat cap; squat, big-headed [03][06] | 43/47.5, ladder 42 | Fix 4 |
| Great Wyrm (both palettes; battle a) | Yes, at play and close [14] | 213/248, 1.27/1.47× ladder (camera-true length) | Keep |
| Titan, Oracle, Pyre Lord, Cinder Idol, Ember Hierophant, Mother of Beasts, World Tree, Horned Hunter | Yes | At the ladder (Pyre Lord's box includes the glaive) | Keep. Horned Hunter back shows teal pauldrons the portrait lacks (fix 12) |
| Elder Wyrm | Yes (the tail ends in a spiked knob on the back view) | 270/298, 1.60/1.77×, the tallest figure on screen | Keep (Q5) |
| Living Monolith | Yes, but the back stands on a big earth mound and the front on bare roots [11] | 185 | Fix 12 |
| Primordial | Yes (orange moss on the Cinder palette is in the portrait) | 216/229 | Keep the front (Q7) |
| Ash Phoenix | Yes: the front's natural feathered wings match the portrait better than the maquette's fans | 59/76 | Keep the front (Q6) |
| Ascended Hero | Yes, but the front is drawn 17% shorter than the back [09] | 35 vs 42.2 wu | Fix 6 |
| Wild Spirit | Front yes. Back rears up on its hind legs [08] | 36 front / 53 back | Fix 5 (re-roll) |
| Ash Colossus | No: a grey, stocky stone golem; the portrait is lean, dark charcoal, with ember veins [10] | 127/128, ladder 129 | Fix 8 |

Against a man and in battle:

- **Big bodies in the battles look right.** The Treant stands 3.4 men in battle b [15]. The Salamander and the Great Wyrm
  dominate their fields without swallowing the blocks.
- **Long bodies stand taller than their ladder**, because their length runs into the depth at 40°, as the approved
  Salamander does. None of them looks wrong. The Elder Wyrm is the extreme: 10.6 men on screen, 20% taller than the
  Great Wyrm (Q5).
- **The size-2 gods hardly outgrow a commander.** They stand 37 to 42 wu, while a commander stands 32 wu, so they are only
  1.15 to 1.3× a commander, against the owner's wish that individuals stand out (Q4).
- **Side colour at play zoom:**
  - Ash Riders and Thornwood troops read well.
  - The harness Wolf Riders read grey-teal next to the Wardens [13].
  - The Hornets read teal (fix 1).
  - The Living Monolith carries 2% side hue in both palettes: a stone shows no side.

## Fixes, in priority order (12)

### 1. Hornet Swarm reads teal at play zoom, and its painting is a bee

- **Evidence:**
  - At tier S, 35% of the pixels of a hornet frame are in the teal hue band (OKLCH hue 150 to 210). At tier H the share is
    0%, and the hornet itself is amber-brown [01][02].
  - The cause is the Thornwood side keyline (1 px of `#113F2F` at 75%) around a 10 px figure: there, the keyline is the
    figure.
  - Close up, the painted hornet is fuzzy and amber with pale wings: a honeybee or hoverfly. Identity check: "torn wing
    edge" false, mandibles partly [03].
- **Change:**
  - In `stage-c/work/creatures/sbx/tools/cpack.py` line 36, remove `'hornetSwarm'` from `SIDE_KEYLINE`, so it gets the
    neutral `#1C1A17` keyline at 60%.
  - Re-run `cpack.py`, then `stage-b/integrate/bundle.py` and `stage-c/tools/lineup_build.py`. The swarm's side is already
    carried by its banner and its place.
  - After the owner picks its portrait (Q1), re-roll R4.

### 2. Wolf Rider "War Wolf harness" front: two coats, and pale cloth

- **Evidence:** median coat colour per cell (the lower half, cloth excluded) [04]:
  - The harness stand cell is the greyest: OKLab b ×100 = +0.9, with a pale grey head.
  - recoil is +1.1 and fall +1.2.
  - The lope cells are +1.3 to +1.5, and leapB, bite and boltB +1.9 to +2.0.
  - Within one sheet that spread is 1.1, against 0.7 to 0.8 on the kept test and on the back.
  - So a standing block shows grey wolves that turn brown when they move off. In the battle the block is a grey and brown
    mix by pose [18].
  - The front's green cloth has median OKLab L 0.45 on the harness and 0.47 on the kept test. The Warden is 0.375, the
    Briar Guard and the Longbow Hunter 0.37, and the Wolf Rider's own back 0.32.
  - That paler, greyer green is why the far-side Wolf Riders read teal-grey beside the Thornwood foot [13].
- **Change:** a deterministic post step on `frames/wolfRider.front/` before `cpack.py`, as a new `coat_match()` in
  `stage-c/work/creatures/sbx/tools/cpost.py`.
  - The coat: in the stand, recoil and fall cells, take the wolf's coat (non-cloth pixels with alpha above 0.5 below the
    rider's waist, the bark harness excluded by hue 40 to 75 with C above 0.05). Move its OKLab a/b to the lope cells'
    median, keeping L.
  - The cloth: in `tr_huelock.lock()`, add a lightness target for the Wolf Rider's front-view cloth zone: move L toward
    0.38 by 0.07, with a soft mask. Apply it to both fronts.
  - If the coat match leaves a visible seam, spend the reserve generation: re-edit only the stand cell.

### 3. The lineup shows stale gate flags

- **Evidence:**
  - The lineup lists "Treant face 02, back: reported (camera, fringe)" and "Treant face 04, back: reported (value)".
  - The figure JSONs ship the re-rolls:
    - `treant02.back.redress.v2.r2`: fringe only
    - `treant04.back.redress.v2`: pass, value 22.1 below
  - `stage-c/atlas/creatures/index.json` was written at 04:23, before the re-rolls (04:31). It still names the old jobs.
- **Change:**
  - Regenerate `index.json` from `figures/*.json` (status, failedGates and job per view), or make
    `stage-b/integrate/bundle_stagec.py` `view_status()` (line 56) read `figures/<fig>.json`.
  - Rebuild the lineup.

### 4. Oakheart has lost its portrait's helm, and its proportions are squat

- **Evidence:**
  - The portrait has a tall helm of upright bark planks, a crown of curved thorns, an oak-leaf fringe, a skull-like oak
    face with a crack, and a bottle-green mantle.
  - The figure wears a low flat cap that reads as a brimmed hat; the thorn crown is a fringe and the crack is gone.
    Identity marks: crack false, crown partly [03][06].
  - The head with its helm is about a quarter of the height; the style lock asks one sixth.
  - Front side share: 19% with the keyline and 6% without (gate 30%).
- **Change:** re-roll R1, both views.

### 5. Cut-off and wrong-pose big bodies

- **Evidence:**
  - Treant 04's forked birch stems run off the top of both raw sheets: the cutout has 0 px of top padding and a 117 px flat
    opaque run on its top row.
  - Treant 02's back is cut the same way (a 39 px run) [07].
  - The Wild Spirit's back view rears up on its hind legs, body near vertical, while its front stands. On screen it stands
    53.4 wu against the front's 36.4, and its camera gate reports head offset 0.48 against the maquette's 0.24 [08].
- **Change:** re-rolls R2 (Treants) and R3 (Wild Spirit).
  - For R2, keep the current cut's px-to-wu scale (`k = heightWu / height`) and let `heightWu` grow with the crown.
  - Do not re-fit the new, taller box to the old maquette height, which would shrink the body.

### 6. Ascended Hero's front is 17% short

- **Evidence:**
  - At tier S the front draws 41 × 72 px (36 wu) and the back 44 × 87 px (43.5 wu).
  - The painting is slimmer and more square to the camera than the front maquette, whose box set its scale
    (`heightWu` 35.0).
  - In the lineup he shrinks visibly when he turns, and his front is smaller than the Oracle's [09].
- **Change:** in `stage-c/work/gods/tools/gd_pack.py`, pass `heightWu` 42.2 for `ascendedHero` front (both palettes) to
  `tiers()` (line 52; `k` at line 57), as an override table. Then re-run `gd_pack.py` and rebuild the lineup.

### 7. The War Wolf is smaller than the summoned Wolf

- **Evidence:**
  - At tier S the riderless War Wolf (boltA) is 41 × 53 px; the summoned Wolf's stand frame is 50 × 61 px.
  - The Wolf Rider's front is 33.5 wu tall. The ladder says 42 for a size-2 rider, and art plan 8.4 says 74 px (37 wu).
  - The rider's hood (9 to 10 px) equals a foot man's (8 to 11 px), so the rider is right and the wolf is small. That is
    the owner's pilot note, "mounts need to match the size a bit better", still open [05][06][22].
- **Change:**
  - In `cpack.py` line 35, set `STAND_PX['wolfrider']` from `(65, 131)` to the plan's `(74, 148)`. The War Wolf then
    equals the Wolf, and the rider is 1.14× a foot man, within the commander factor.
  - Re-pack and re-bundle. The "huge" War Wolf painted apart from its rider stays Later, per the stage B verdict (Q3).

### 8. Ash Colossus doesn't match its portrait

- **Evidence:**
  - The portrait (pick A) is lean and long-legged, with dark charcoal ash skin and a net of dull ember cracks.
  - The figure is mid-grey, bulky and short-legged; the agent noted "stockier legs than the portrait (the maquette
    proportions came through)". The cracks are faint in front ("partly") [10].
  - The colour gate passes on the brazier head (ΔE 2.6) and so misses the body.
- **Change:**
  - First lengthen the legs and slim the limbs of its maquette in `stage-c/work/gods/tools/gd_rigs.py`, then re-render the
    guide with `gd_guides.py`.
  - Then re-roll R5, both views.

### 9. Ash Rider front: no side colour, and the coat is lighter than the portrait

- **Evidence:**
  - Front side share: 0.5% without the keyline and 19.7% with it.
  - Identity: the iron bridle rings are missing and the face plate is partial.
  - The coat is a lighter dappled grey than the portrait's dark charcoal with pale dapples [03].
  - The back passes everything except the despill-volume fringe gate; its shipped edges are clean (0.04% cast).
- **Change:** re-roll R6, front only. Far-side Ash Riders don't appear in battles a to c, but they will in the game.

### 10. Lineup as a review tool

- **Evidence:**
  - The lineup bakes tier S only, so legend focus (up to 6×) magnifies 0.5 wu/px art. Close-ups go soft, exactly where the
    owner judges painted fidelity [21].
  - There is no portrait beside a figure, though the art plan asks "beside its approved portrait".
  - The only scale reference is a Cinder Warrior; there is no 32 wu commander to judge gods against.
  - Rider heights include the lance (Ash Rider front "53 wu"), which reads as oversize.
- **Change:** in `stage-c/tools/lineup_build.py` and `lineup-page.html`:
  - add the tier H textures and swap at more than 2 px per wu, as the battle does at `PAINT_TIER_UP`
  - add each figure's 64 px card portrait to its legend row and to the focused view
  - add a painted commander (Ash Chieftain 06, 32 wu) beside each "a man"
  - label riders by body height (`standPx` × 0.5)

### 11. The Wolf Rider front control shows where it does nothing

- **Evidence:** in battle b the Wolf Riders are on the near side (back view), yet the control is visible (`hidden: false`).
  Switching it changes nothing at deploy.
- **Change:** in `visual-v4/src/90-main.js` `syncWr()` (line 289), require a wolfRider group whose figures show their
  front (`T.G[gi].s > 0`), or a routing one. Rebuild the mockup.

### 12. Minor consistency

- **Living Monolith:** the front lacks the back's earth mound [11]. Re-roll R7, with the back cutout as Image 3.
- **Horned Hunter:** teal pauldrons show under the back view's mantle (not in the portrait). Fix with a local tint edit in
  the style of `gd_tint.py`: hue 170 to 200 with C above 0.04 in the shoulder box, moved to the bronze of the front's
  plates.
- **Summoned Wolf:** a faint mauve rim along its back (0.7% of its front stand pixels, RGB about 162/139/145). Fold it into
  the rim fix pass in `ad_rimfix.py`, warming hue 330 to 10 to warm grey.
- **Salamander and Treant cards:** they are the 64 px pilot portraits, soft at DPR 2; use the 128 px crop like the stage B
  cards.

## Re-rolls, in priority order

Each re-roll is one generation through `gen.py` under the stage C budget. Image 1 is the route's base or maquette, and
Image 2 the approved portrait.

| # | Figure, views | Base | Contingency | What to ask for |
|---|---|---|---|---|
| R1 | Oakheart, front and back (`fill` route, current base and `oakheart/01b`) | 2 | +1 | "A tall helm of upright bark planks rising a full head above the brow, ringed by a crown of long curved thorns, with a fringe of oak leaves at its rim, exactly as Image 2. Never a flat cap or a brimmed hat. The face a gaunt skull-like mask of grey oak with a crack across it and moss in the furrows. Tall, realistic proportions: the head with its helm one sixth of the standing height, long arms. The bottle-green mantle large over both shoulders and hanging down the chest, so that from the front it covers a third of the figure." Keep the 16 melee cells and the hue lock. |
| R2 | Treant 04 front and back, Treant 02 back (edit route) | 3 | +1 | Image 1 is the current raw sheet with 18% more magenta added above. "Complete the two forked birch stems (02: the willow crown) that run off the top edge into their natural tops with small twigs and leaves, all inside the frame, with 30 px of clean magenta above. Change nothing else: every outline, colour and the background stay exactly as they are." Re-key and re-slice; keep `k` (fix 5). |
| R3 | Wild Spirit back (maquette and `wildSpirit` B) | 1 | +1 | "Standing on all four hooves, the body level and the hind legs under the hips, seen from behind and above, turned to the upper right as the mirror of the front view. The antlers and the leaf ruff in the nation's green. Not rearing, not leaping, never upright." |
| R4 | Hornet back, after the owner's pick (Q1; Image 2 is that pick) | 1 | +1 | "A wasp, not a bee: a glossy hairless black head and thorax, a narrow waist, a long tapered abdomen with narrow dull ochre bands, open jagged mandibles, swept-back antennae, two pairs of smoky dark opaque wings with one torn edge. No fuzz, no amber body hair, no pale wings." Then apply fix 1's neutral keyline. |
| R5 | Ash Colossus front and back (the corrected maquette, `ashColossus` A, blue key) | 2 | +1 | "Built as Image 2: lean and long-legged, the legs half the standing height, the arms long. Skin of dark charcoal ash, as dark as Image 2, with a fine net of dull ember-orange cracks over the chest, arms and thighs. The brazier head with dull coals; the kilt in the nation's cloth. Never a stocky grey stone golem." |
| R6 | Ash Rider front (`fill` route, current base and `ashHorse/01b`) | 1 | +1 | "The ember-orange caparison covers the horse's chest, shoulders and both flanks and is seen from the front. The rider's ember cape lies over both shoulders and his helm crest is ember. The horse's coat is dark charcoal with sparse pale dapples, as dark as Image 2, never light grey. The riveted iron face plate and the iron bridle rings painted clearly." |
| R7 | Living Monolith front (corrected maquette, `livingMonolith` B, back cutout as Image 3) | 1 | 0 | "The base: the same low mound of dark earth, stones and roots as Image 3, seen from the other side." |
| Reserve | Wolf Rider harness front, stand cell only, if fix 2's coat match shows a seam | 0 | +1 | "Change only the wolf's coat in this cell to the warm grey-brown of the other cells; keep every outline." |

**Total: 11 base and at most 7 contingency, so 18 at most.** That is under the 28 cap, and leaves at least 13 of the 31
left for the owner's own redo picks.

Order of work:

1. The code fixes: 1, 2, 3, 6, 7, 10 and 11.
2. Re-rolls R1 to R3.
3. R4, once Q1 is answered.
4. R5 to R7.
5. Re-run `checks.cjs`, `close.cjs` and the lineup shots, then build the review page.

## Questions for the owner on the stage C review page

1. **Hornet Swarm portrait:** B (the stand-in) or A?
   *Default: B. The figure is re-rolled as a black-and-ochre wasp either way (R4).*
2. **Wolf Rider front:** the War Wolf harness edit (the approved War Wolf A coat, bark harness and bone cord) or the kept
   test (grey wolves, cloth chest)?
   *Default: the harness, after the coat fix (fix 2), because it matches the approved portrait.*
3. **Wolf Rider size:** scale it up now to the plan's 74 px, so the War Wolf is as big as a summoned Wolf and the rider
   1.14× a foot man? The truly huge War Wolf, painted apart from its rider, stays Later as you decided.
   *Default: yes.*
4. **Gods against commanders:** a size-2 god stands only 1.15 to 1.3× a commander. Should pretender gods take the
   commander factor of 1.15× (design 3.2), so every god outgrows its own commanders? Summoned monsters would stay at the
   ladder.
   *Default: yes. It is one factor in `gd_pack.py` and needs no generation.*
5. **Long bodies:** wyrms and serpents stand taller on screen than their ladder height because their length runs into
   the depth at 40°. The Elder Wyrm stands 10.6 men tall on screen. Keep camera-true heights, or cap them?
   *Default: keep, as with the approved Salamander.*
6. **Ash Phoenix front:** keep the first roll (natural feathered wings, crouched, true to the portrait), although it
   departs from the maquette?
   *Default: keep.*
7. **Primordial front:** keep it (true to the portrait, head lower and body wider than the maquette)?
   *Default: keep.*
8. **Fire Sprite:** the field figure adds two flame wings and a tail that the bust doesn't show, and it doesn't glow until
   stage D. Keep?
   *Default: keep.*
9. **Thornwood palettes of the six generic gods** as tint edits of the Cinder paintings (no new paintings; measured clean):
   accept?
   *Default: accept.*

## Not issues (checked)

- **Keying:**
  - Shipped edges are clean: the key-hue cast on the tier H edge ring is at most 0.14% for every creature and god checked.
  - The gate failures marked "fringe" (Ash Rider, Fire Sprite, Hornet, Treant 02) measure despill volume, not visible spill.
  - No halos: the dark keyline sits under every figure. No blue on the Fire Sprite, no magenta on the Treants or the
    Hornet, no green on the Cinder gods.
- **Thornwood tint edits** leave at most 0.4% ember hue (Primordial back) and take the zone fully to green.
- **Card art** is each subject's approved portrait (gods with their card crop). Hover cards open for every subject, on the
  card bar and the enemy strip [24][25].
- **Playback** at 1x and 4x in all three battles showed nothing broken. The big bodies keep their place and turn to their
  foes, unanimated as the owner asked [15][16].
- **The lineup at 390** fits with no overflow; its legend collapses and opens. The integrator's `ERR_FAILED` was the
  blocked Google Fonts; with fonts allowed, there are no errors.
