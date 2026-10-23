> Status: stage A of the painted unit art (`battle-overhead.owner-answers.md`), pending the owner's verdict on the pilot. Paths starting `scratchpad/` are the art workspace, outside the repo.

# Stage A pilot: the art director's review

2026-10-23. This reviews `pilot.md` and every image under `pilot/`, against:

- the owner's words (`docs/design/battle-overhead.owner-answers.md`, both entries);
- the approved leader portraits and their style anchor;
- the owner's battle references (`visual-refs/ref-1`, `5`, `6`, `7`, `8`; direction only).

Paths are relative to `scratchpad/visual-v4/units/`. Nothing in the repository was touched.

**Budget.** This review spent 11 generations, all logged in `gen-log.tsv` with the purpose `pilot ad: …`. Stage A
stands at 48 of 60. Its cheap fixes are shown in a new test page, `pilot/ad/formation-test-ad.html`, which uses the
same mockup, battle c's ground and camera presets as the pilot's page.

---

## Verdict: go with changes

The painted direction is right, and the pilot proved the hard part: painted figures can be made at the battle camera,
in the portraits' hand, and the Salamander now matches its portrait. Three things in the pilot would have embarrassed
us in front of the owner, and all three are fixed in the new page:

1. **The Salamander stood on its tail tip.**
   - The slicer anchored the back-view cutout at its lowest pixel, so the body was drawn about 44 wu (1.6 men) up and
     to the right of where the battle stands it. Its footprint radius is only 16 wu.
   - On the field it reads as rearing up or climbing a wall, and it would depth-sort by its tail.
2. **A yellow-olive rim ran along every orange crest and cape edge.**
   - It sits on 15 to 25% of each figure's boundary ring (35 to 79% of the coloured part of the ring).
   - The pilot's `edgeDevPct` read 2 to 4% on these same frames, so its check passed them.
3. **The far side did not read as its side.** The front view scored 17% side colour against a 30% target.

**The verdict covers troops and human commanders: show the owner the pilot with the changes below in, then start
stage B.** Mounts stay where the owner put them: portrait first (stage B), then the figure standing in the game (stage
C). The Wolf Rider work here is a pipeline probe only.

**Two production routes are not proven yet** and get a calibration step at the start of stage B (changes 5 and 9):

- commander figures made from their faces (Nano Banana Pro failed twice; one alternative route worked);
- the Thornwood side colour (the generator paints its green on the wrong hue).

---

## The five questions

### 1. Do the painted figures make the battles stand out?

**At closest zoom (72 px), yes, clearly.**

- Crest, cape, scale shirt, axe and shield all read, and the brushwork shows.
- The procedural figures beside them look like toys. This is the fidelity the owner asked for.

**At play zoom (28 px), yes once the changes are in. The pilot's picks fell short:**

- They read as real troops, slimmer and heavier than the procedural ones.
- But the pilot's front block was mostly grey helmets and mail (17% side colour), and all 30 figures were the same
  frame (`pilot/formation/formation-overview.png`).
- With the surcoat, the rim fix, the side keyline and varied figures, both sides read at least as clearly as the
  procedural blocks while staying painted (`pilot/ad/shots/ad-overview.png`, blocks 2 and 3).

**The Salamander is the most convincing figure on the field, but at play zoom it is a dark shape on a mid ground.** It
gains presence from two things:

- the silhouette shadow (change 13);
- in stage D, its ember cracks and throat, lit by the game (change 22).

It must not be lightened: the portrait is dark.

### 2. Does the painted art read as one style with the portraits?

**Nano Banana 2.1's work, yes.** It has the same oil hand, rust and muted palette as the portraits. This covers:

- the front sheet;
- the Salamander;
- the Warden bust;
- the Ash Chieftain re-dress.

The deliberate change from candlelight to daylight (plan 1.3) does not break the family. The card bar's dark,
candle-lit faces sit well beside the lit field.

**Nano Banana Pro's sheets are flatter and lighter.** They look like painted miniatures rather than oil:

- The difference is invisible at play zoom.
- It is visible at closest zoom when one unit's back view (Pro) stands near its front view (Nano Banana 2.1), as in the
  pilot's pair.

That is a production rule (change 6), not a reason to stop.

### 3. Does the Salamander match its portrait?

**Yes, as a creature:**

- dark obsidian scales with a fine net of dull ember cracks;
- the broad flat river-salamander head and the folded neck;
- the horn nubs along the jaw and the three brow knobs.

The identity colour check reads ΔE2000 3.0 (back view) and 4.5 (front view, after the edit); the limit is 18.

**The pale scrape across the snout was faint in the pilot's front cutout.** One Nano Banana 2.1 edit made it read and
changed nothing else: the camera IoU stayed 0.89 (`pilot/ad/review/salamander-scar.png`).

**As placed in the game, the pilot's Salamander did not match, because of the anchor (change 12).**
`pilot/ad/shots/ad-close-sal.png` shows both versions on rings that mark where the battle stands each body:

- **Pilot (left):** the tail tip sits on the ring and the body floats up and away from it.
- **Fixed (right):** the hips sit on the ring and a silhouette shadow grounds the body.

### 4. Is the camera right?

**For foot troops, yes.** Pro put 13 to 15 of 15 cells at the battle camera on 6 of 8 sheets in the pilot. In this
review:

| Sheet | Cells at the battle camera |
|---|---|
| A new Pro Cinder front | 15/15 |
| A Thornwood Warden front | 15/15 |
| Nano Banana 2.1 edits of a camera-correct sheet | 13/15, 13/15 and 15/15 |

The near side faces up and to the right (we see its back and right side), and the far side faces down and to the left.
Both match the design's 48° battle axis.

**For the Salamander, yes** (IoU 0.89 to 0.92 against its maquettes; the anchor was the problem, not the camera).

**For mounts, half.** Pro on a blue key reached 14/16 cells. The pilot's runs reached 2 of 5.

**For commanders, not by the planned route.** Ash Chieftain 06 from its commander maquette failed twice:

- **With its portrait as a reference:** 2/16 cells. The figures came out eye-level, nearly filling their cells, with
  the strike cells turned sideways.
- **Without its portrait:** 1/16 cells. The figures came out stubby and dwarf-like, facing the other way.

Nano Banana 2.1 re-dressing the camera-correct Cinder front sheet as the chieftain kept 13/15 cells and his identity:

- spiked crown-helm;
- full dark beard;
- soot-black feather mantle;
- engraved pauldrons.

See `pilot/ad/review/commander-06.png`.

**Bigger cells lose the camera.** A Pro test with 2 × 2 large cells came out at eye level, with the strike cell turned
toward us (`raw/ad/cw.back.quad.g3pro.png`). The detail was much richer, but the 16-cell grid is part of what holds the
camera.

### 5. Do the sides read?

**The near side's back view, yes.** The long cape scores 33% in the pilot, and 38% after the rim fix (the rim was eating
orange).

**The far side's front view, no in the pilot (17%); yes with the surcoat.** A Nano Banana 2.1 edit of the pilot's front
pick gave the soldier a sleeveless surcoat from the collar to below the knee. It changed nothing else:

| Front view | Side colour at 28 px | Cells at the battle camera |
|---|---|---|
| Pilot front pick | 17.3% | 13/15 |
| Surcoat edit, as keyed | 32.2% | 13/15 |
| Surcoat edit, rim fixed | 37.2% | 13/15 |

**At play zoom the side keyline makes both sides unmistakable** (change 14): 63% back, 61% front.

**Thornwood, which battle c's far side actually is, does not read yet:**

- **The Warden's green is painted at the wrong hue.** Pro painted it leaf-green, at OKLCH hue 90 to 165. The nation's
  cloth sits at 166, and the side check counts ±20° around it, so the Warden scores 2.6%.
- **An edit that named the hex overshot to teal** (hue 186 to 220, 1.2%). The generators do not hit a hex.
- **A cloth hue lock in the packer brings it to 17.5%, and 35% with the side keyline**
  (`pilot/ad/review/warden-green.png`, change 9).

---

## What this review tested (11 generations)

Prompts are in `prompts/ad/`, jobs in `pilot/ad/jobs-ad*.json`, raw sheets and sidecars in `pilot/raw/ad/`, and keyed,
sliced and checked work in `pilot/work/ad/`.

| Job | Model and references | Result |
|---|---|---|
| `cw.front.rs.nb21` | Nano Banana 2.1 edit of the pilot's front pick; anchor | **pick.** Surcoat added; 13/15 cells; side 32.2% (37.2% rim-fixed); consistency ΔE ≤ 11.7 |
| `cw.front.g3pro` | Pro from the maquette; front pick as hand reference; anchor | 15/15 cells; side 25%; flatter hand |
| `cw.back.rs.nb21` | Nano Banana 2.1 repaint of the back pick with the front sheet as hand reference | **fail**: it copied the front view (3/15). Never give Nano Banana 2.1 a sheet in another facing |
| `cw.back.quad.g3pro` | Pro, 2 × 2 large cells | **fail**: eye-level camera, strike turned. Richer detail |
| `sal.front.mark.nb21` | Nano Banana 2.1 edit of the front cutout; portrait 01 | **pick.** Snout scar reads; IoU 0.89; identity ΔE 4.5 |
| `wr.front.blue.g3pro` | Pro, blue key, lighter green, pennon (mount probe) | 14/16 cells (stand cell 0.48 because of the raised pennon); pink cast on light fur 30.2% → 0.9%; side 12.5% (32.2% with side keyline); value only 12.5 L\* below swamp |
| `ac06.front.g3pro` | Pro from the commander maquette; portrait 06 | **fail**: 2/16, eye level. Good identity |
| `ac06.front.cam.g3pro` | Pro from the commander maquette, no portrait | **fail**: 1/16, stubby, mirrored |
| `ac06.front.redress.nb21` | Nano Banana 2.1 re-dress of the camera-correct troop sheet; portrait 06 | **pick.** 13/15 (melee layout); identity marks present; consistency ΔE ≤ 1.4 |
| `wd.front.g3pro` | Pro from the Warden maquette with the surcoat kit | 15/15 cells; green painted at the wrong hue: side 2.6% (17.5% hue-locked, 35.3% with side keyline) |
| `wd.front.rs.nb21` | Nano Banana 2.1 edit naming the green hexes | Overshot to teal: 15/15, side 1.2% |

---

## Changes for production

The numbers below are the review's decisions. Where a change needs the owner's eye, it says so.

### Before the owner sees the pilot

1. **Show the fixed page.** The owner's review page shows `pilot/ad/formation-test-ad.html` (presets in
   `window.__ad.view`), not only the pilot's `formation-test.html`. Its rows compare the pilot's pick with each change,
   left to right, and the procedural figure last. Its shots are in `pilot/ad/shots/`.
2. **Replace the mislabelled bust sheet.** `pilot/review/contact-warden.bust.png` labels every bust "second failure …
   reported, not used", because `pilot_figs.py` captions any sheet without measures as a failure. Use
   `pilot/ad/review/contact-warden.bust.png`.
3. **Ask the owner three things on that page:**
   - the surcoat look for line troops (front view);
   - the side keyline at play zoom (change 14);
   - the Salamander figure, as the second of its three reviews (standing in the game), shown fixed with the scar.

### Sheets and prompts

4. **Every troop kit carries a sleeveless surcoat of the side's cloth.** It covers the whole chest and belly, from the
   collar to just below the knee, is split at the front below the belt, and is belted.
   - It is in addition to the mantle, crest and shield face, and goes into the `units_src.py` kits.
   - Measured on the Cinder front: 17.3% → 32.2% (37.2% after the rim fix).
   - Robed casters keep their robes; the robe is the cloth.
5. **Commander figures are made in two steps, not from the commander maquette.**
   1. A camera-correct body sheet in the commander layout: Pro from a maquette, gated by the all-cells camera check.
   2. A Nano Banana 2.1 re-dress per face, with that face's approved portrait as Image 2.

   Measured:

   | Route | Cells at the battle camera |
   |---|---|
   | Pro from the commander maquette, with the portrait | 2/16 |
   | Pro from the commander maquette, without it | 1/16 |
   | Re-dress of a camera-correct sheet | 13/15 |

   **Stage B opens with a commander calibration of at most 12 generations:**

   - three kinds: an armoured chieftain, a robed caster with a staff, a hooded druid;
   - two faces each;
   - each face's marks ticked on a 4× crop beside its portrait (plan 5.5).

   Paint the kit zones (crown, mantle, staff head) onto the commander maquettes, as the troop maquettes have. The troop
   maquettes held the camera 6 of 8 times; the bare grey commander maquettes did not. That cause is my hypothesis, to
   be tested in the calibration.
6. **Both views of one unit come from the same route and the same model.** The pilot pairs a Pro back view with a Nano
   Banana 2.1 front view, and the hands differ at close zoom.
   - Use Pro for both views, then optionally a Nano Banana 2.1 repaint of both, with the same references.
   - **Never pass a sheet in another facing as a reference to Nano Banana 2.1:** it copies that facing (3/15).
7. **Change clothing and marks by a Nano Banana 2.1 edit of a camera-correct sheet, not by a new roll from the
   maquette.**
   - Measured: the surcoat edit, the snout scar, the chieftain re-dress and the Warden edit (13/15, IoU 0.89, 13/15
     and 15/15) all kept their input's camera. A new Pro roll keeps it about 3 times in 4 for troops, and failed both
     commander rolls.
   - The re-roll rule stays: one re-roll, then report.
8. **Keep 16 cells per 1:1 troop sheet.** Large 2 × 2 cells lost the camera.
   - For resolution, test whether the API's larger output size can be used for Pro sheets in stage B's calibration
     (`gemini_gen.py` sends no size option today). Today a figure is about 140 to 165 px tall at its source, for a
     112 px tier H.
   - **Plan 5.3's 2 × 2 action sheets for big bodies must pass the camera check per cell; otherwise use one cutout per
     action.**
9. **Thornwood's cloth needs a hue lock and wording that names the hue.** The generators paint "green" as leaf-green and
   overshoot a named teal.
   - Prompts call the cloth "blue-green like fir needles in shade, never leaf-green or yellow-green". The mantle is
     "cloth dyed blue-green, cut like leaves".
   - The packer's cloth hue lock (`tools/ad_huelock.py`) then moves the cloth to the nation's hue and holds chroma
     within 0.6 to 1.0 × the cloth's. It keeps the painted lightness and strokes, and does not push chroma up.
   - Warden: 2.6% → 17.5%; with the side keyline 35.3%.
   - The hue range is set per nation from its first approved sheet, with a mask proof the art director checks. Cinder
     needs no lock: its cloth already sits on its hue.
   - The surcoat must cover the Warden's chest, not sit under a bark cuirass (a Nano Banana 2.1 edit, change 7).
10. **Name every identity mark of a creature, god or commander, and tick each one on a 4× crop beside the portrait.**
    The Salamander's snout scrape was named in the pilot's prompt and still came out faint.
11. **Mounts (stage C, after their portraits), in order:**
    1. A blue key for grey-furred mounts. Pink on light fur, by this review's measure: 30.2% → 0.9%.
    2. A lighter green with a pennon. The pennon is not in the stand cell: its raised spear fails the stand cell's
       camera check.
    3. A darker coat ("dark grey-brown timber wolf"). The blue-key wolves stand only 12.5 L\* below the swamp ground,
       under the 15 the design requires.

### Pipeline and engine

12. **Big-body anchors come from the maquette.**
    - `slice.py --single` takes the anchor from the guide's ground anchor, mapped onto the cutout's alpha box
      (`tools/ad_page.py` `maquette_anchor`), and stores it as `anchorOverride`.
    - The pilot's lowest-pixel anchor put the back-view Salamander about 44 wu from its ground point, and the front
      view about 14 wu.
    - The review image shows the ring under each body.
13. **Low big bodies get a silhouette shadow.** The shadow is the cutout itself:
    - black, alpha 0.42, blurred 5;
    - offset 5 wu right and 4 wu down (away from the upper-left sun);
    - pressed to 0.9 of its height toward the anchor.

    The round blob stays for upright bodies. In stage D the shadow follows the mesh.
14. **The side keyline at play zoom.**
    - **Tier S** (a man 48 px or less): the atlas keyline is drawn in the side's dark cloth shade at 75%. That is Cinder
      `#7E3118`, Thornwood `#113F2F`, or the battle's cloth variant (design revision 6).
    - **Tier H** keeps the neutral `#1C1A17` at 60%. At closest zoom the coloured edge softens figure separation, and
      the painted cloth reads on its own there.

    | Figure at 28 px | Side colour, neutral keyline | With the side keyline |
    |---|---|---|
    | Cinder back view | 37.7% | 63.0% |
    | Cinder front view | 37.2% | 60.7% |
    | Wolf Rider | 12.5% | 32.2% |
    | Warden, hue-locked | 17.5% | 35.3% |

    - The value margin drops about 3 L\*, and stays at least 23 for foot troops.
    - It also gives a lone commander his side: the chieftain's kit has no cloth at all.
    - Colour vision: the two keyline shades are ΔE2000 18.6 apart for deuteranopes and 10.4 for protanopes. That is
      about what the two cloths themselves give (23.6 and 11.9), so the keyline adds no confusion.
    - Owner question (change 3).
15. **The rim fix goes into `key.py`.**
    - A post-pass on the boundary ring (`tools/ad_rimfix.py`). A ring pixel whose hue has moved more than 15° toward
      the key from the paint 3 to 8 px inside takes that paint's hue and chroma, and keeps its own lightness.
    - The ring's hue-shift share becomes a `checks.py` gate at 2% or less (`tools/ad_measures.py rim`).

    | Frame | Boundary ring shifted toward the key, before → after |
    |---|---|
    | Cinder back | 17.3% → 0 |
    | Cinder front (pilot pick) | 15.5% → 0 |
    | Cinder front (surcoat) | 24.6% → 0 |
    | Salamander back | 6.0% → 0 |
    | Salamander front | 24.4% → 0 |
    | Wolf Rider, blue key | 0.4% → 0 |

    `edgeDevPct` stays as a second check.
16. **No two figures in a block are the same frame.** The pilot's blocks were 30 copies of one frame. Seeded per figure:
    - a rest frame of `stand` or `idle2` (30% `idle2`);
    - a scale within ±4%;
    - a brightness within −8%;
    - a frame phase offset in motion.

    Shown in `pilot/ad/formation-test-ad.html`.
17. **Cloth normalisation (`pack.py cloth_boost`) stays off for Cinder.** With the surcoat and the side keyline it is
    not needed, and at closest zoom its 0.9 × chroma floor turns the capes plastic (`pilot/ad/shots/ad-close-near-kl.png`,
    right). Change 9's hue lock replaces it where a nation needs it.
18. **The plan's size table takes big-body sizes from the maquettes,** as the pilot proposed: a size-3 back view is
    about 200 × 140 px at tier S. **Also adopt the pilot's all-cells camera gate,** at 13 of 15 cells or more for foot
    sheets and 14 of 16 for mounted sheets.

### Animation and magic

19. **The motion layer works on painted key poses, and the owner should see it moving before stage D is planned in
    detail.**
    - The `motion` preset of the new page drives the painted frames by time. The near side marches in place (marchA,
      pass, marchB, pass, with a bob). The far side's front rank strikes (windup, strike, follow, with a lunge). The
      phases differ per figure.
    - At closest zoom it reads as motion. A still strip is in `pilot/ad/review/motion-strip.png`.
    - Two painted march frames are the minimum. If plan 6's lean and sway transforms still look stiff at stage D's
      first review, budget a second motion sheet per troop view: four walk frames, two run frames, a second strike and
      a second death.
20. **Big-body action sheets (stage D) start from the approved standing cutout** as Image 1, edited by Nano Banana 2.1,
    so identity and camera carry over, as the scar edit did.
21. **Magic needs the same attention as the animation and the monsters.** The magic pilot (Fireball against Entangle,
    plan 7.5) is reviewed by the same standard as this pilot:
    - painted, at both zooms;
    - with its light on figures and ground;
    - beside the storyboard.
22. **The Salamander's ember cracks need their own painted mask.**
    - Extracting the cracks from the cutout by colour also caught the sunlit scale edges (tried in this review).
    - The mask should be a Nano Banana 2.1 edit of the approved cutout: "the same image, black everywhere except the
      ember cracks and the throat".
    - The game lights it for the breath's inhale (docs/12: the throat glows), and dimly at rest so the creature has
      presence at play zoom.

### Out of scope, for the owner to decide later

23. **The battle ground and its props are still the mockup's flat vector style:** grass, trees, reeds, river, bridge.
    Next to painted figures they now read as a different style. The owner approved this ground ("the formations and
    effects so far are great"), so this is a question for the owner, not a change. A painted ground pass would belong
    with the later build that brings cities into battles.

---

## Files

**The new test page and its images:**

| Path | What |
|---|---|
| `pilot/ad/formation-test-ad.html` | the art director's in-game test (battle c's ground). Presets: `overview`, `close-near`, `close-near-kl`, `close-far`, `close-far-kl`, `close-cmd`, `close-thorn`, `close-thorn-kl`, `close-wolves`, `close-sal`, `close-sal-front`, `play-sal`, `motion`; `window.__ad.setTime(t)` |
| `pilot/ad/shots/` | its shots at 1600 × 900, eight motion frames, no page errors |
| `pilot/ad/review/` | review images: `ad-sheets.png`, `front-before-after.png`, `rimfix.png`, `salamander-scar.png`, `commander-06.png`, `warden-green.png`, `wolf-key.png`, `motion-strip.png`, `contact-warden.bust.png` (corrected) |
| `pilot/ad/frames/` | rim-fixed frames of every pick (Cinder back and front, Wolf Rider blue, Salamander both views, Ash Chieftain 06, Warden as painted and hue-locked) |
| `pilot/ad/atlas*/` | tier S and H atlases: as painted, side keyline, normalisation with side keyline |
| `pilot/ad/salamander-anchors.json` | slicer anchors against maquette anchors, in frame px |
| `pilot/ad/guides/` | the blue-key Wolf Rider guide and the 2 × 2 guide crop |

**Generation records:**

| Path | What |
|---|---|
| `pilot/raw/ad/`, `pilot/work/ad/` | raw sheets with sidecars, and keyed, sliced and checked work (`summary.json`) |
| `prompts/ad/`, `pilot/ad/jobs-ad1.json` to `jobs-ad8.json` | every prompt and job sent |

**New tools** (the pilot's own tools are unchanged):

| Path | What |
|---|---|
| `tools/ad_measures.py` | side colour variants and the ring hue-shift measure |
| `tools/ad_rimfix.py` | the rim fix |
| `tools/ad_huelock.py` | the cloth hue lock |
| `tools/ad_pack.py` | the atlases |
| `tools/ad_page.py`, `tools/ad_scene.js`, `tools/ad_shoot.cjs` | the test page, its scene and its shots |
| `tools/ad_figs.py` | the review images |
