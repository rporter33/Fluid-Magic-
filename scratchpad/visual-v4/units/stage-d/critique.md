# Stage D magic pilot: art direction and QA critique

2026-10-24. Fireball (battle a: the Cinder Magus casts it 6 times) and Entangle (battle c: the Thornwood druids cast it
once), as built in `visual-v4/src/45-fx-looks.js` to `49-fx-decals.js` and shown on `units/stage-d/pilot/pilot.html`.
Code paths below are relative to `visual-v4/src/` unless they start with `units/`. Evidence is in
`units/stage-d/critique-shots/` (22 JPEGs, 5 MB), cited as (NN). I changed nothing else. The two prototypes below ran
as patches inside my own browser session only.

**How I looked.** I used my own Playwright sessions (Chromium on SwiftShader). On the live mockup at 1440 x 900 I
covered all six Fireballs and the Entangle in three views: the automatic camera (a man is 31 to 36 px), a forced 28 px,
and close (67 to 84 px). I stepped story time frame by frame through every beat, at 1x and 4x, with and without the
OS reduced-motion setting. On the pilot page at 1440 and 390 wide I tested the clips, 0.25x, frame stepping, the 2x
switch, the stills, the sheets, every gallery toggle, the questions and the verdict. I also ran two A/B tests and two
prototypes in the page: the light tint on and off, an additive light copy, and bigger roots. I timed frames on fresh
pages.

## Verdict

**Not ready to show the owner yet, but close.** Both spells follow their storyboards beat for beat. Every duration,
count, size and ring in art plan 7.3 is in the data table and on screen. The effects are deterministic, stay under
budget, pass through the flash limiter and follow the OS reduced-motion setting. The painted sheets are in the
figures' hand. Close up, Fireball is a convincing low dome of painted fire among the troops (03, 10), with embers,
smoke and a scorch ring that stays and builds up over the battle. Entangle's cracked earth, thorn eruption with
overshoot, coil, wither and root scar are good painting (14).

The gap to the owner's bar ("the same attention to detail as the animation and monsters", flashy) is in how the
effects are put into the battle, not in the painting:

- **Fireball** reads at play zoom as orb, comet, blast, ring and smoke (02). Five things let it down:
  - the light on the troops, a pillar of the storyboard, is invisible (05);
  - the wounded troops flash as solid white cut-outs on top of the fire (04);
  - the burst steps through its six frames like a slideshow at 0.25x (08);
  - burning kills show no flames (11);
  - cast 5 bursts inside its own side's block (07).
- **Entangle** at play zoom is a green flash, a thin dark line across the field and a dark speck under Ishka's red
  commander ring (12, 13). "Held" reads only through the dashed ring and the ticker. It works close up; it has to
  work at 28 px.
- **The review page** is a good tool, but it still asks the owner the timing question he settled today. It also has
  no clip of the brief form, which three of the six casts play.

Fixes 1 to 6 should land before the owner sees the pilot; 7 to 12 can follow in the same pass. Together they are about
a day of code, plus 10 generations (13 with contingency) of the 21 left. Once fixed, I recommend Fireball: Keep, and
Entangle: keep the beats but redo the look of the hold.

## Beat by beat

### Fireball

| Beat | Storyboard (7.3) | What it draws | Judgement |
|---|---|---|---|
| Charge 0 to 700 ms | orb 4 to 14 wu at the staff, 60 embers spiral in, caster tints warm, footprints for the last 250 ms | orb grows with ease-in, embers at 26 to 54 wu; gold footprints from 450 ms, 0.86 s before impact; the caster's tint does not show | The shape is right, but the first 450 ms is thin: a tiny orb and scattered specks (01). There is no mana symbol (docs/12 S2.10 charge). |
| Release 700 to 760 | 60 wu ring, 6 wu recoil | keylined gold ring from the feet; the recoil is in the cast pose | Fine |
| Travel 760 to 1310 | lob with a 120 wu apex, 90 wu trail, 20 sparks, a shadow crossing the ground, a moving light pool that lights the figures | the comet reads well even at 28 px; the shadow is a 14 wu disc at alpha 0.32 or less that vanishes at the apex; the pool is a beige puddle far below the orb (09) | The orb and trail are strong; the shadow and the light do not read |
| Impact 1310 to 1450 | low dome among the troops, 140 wu ring, embers, sparks, figures lit and shadowed, kills thrown and burning | the dome is sorted with the figures and strong at every zoom; the ring is a thin vector ellipse; the lit tint and pushed shadows are invisible (05); wounded troops flash white at play zoom (04); each burst frame holds 77 ms, then jumps (08) | The centrepiece works; the light, the wounds and the smoothness do not |
| Linger 1450 to 1900+ | embers 1.5 s, smoke 2 s, heat shimmer (High), 120 wu scorch ring | embers rise and flicker, smoke rises, the scorch ring stays; the shimmer is replaced by a faint cream glow; burst frame 4's smoke reads pink (09) | Good, except the cream glow and the pink wisps |

The six casts are full, short, brief, brief, brief and short (the last with 4 kills). The brief form (0.5 s) is snappy
and still readable, because the burst, the smoke and the scorch play in full (22). The cast 2 fragment, which goes
to one troop 445 wu away, is a 10 px dot with no trail, so the kill at the far end looks unconnected. The only troop
cast 5 strikes is the Great Wyrm, but the burst lands at its feet, inside the Cinder block it is fighting (07).

### Entangle

| Beat | Storyboard (7.3) | What it draws | Judgement |
|---|---|---|---|
| Charge 0 to 450 ms | earth cracks spread from the caster | split ground and 5 thin cracks under Hawthen | Reads close up; a small dark spiky spot at play zoom |
| Release 450 to 510 | full-scene flash 0.15 in `#A6D96A` | a 60 ms green flash, admitted by the limiter, none under reduced motion | Correct. Loud for one man, but on spec |
| Travel 510 to 800 | a crack runs to the target | a 16 wu rope crack runs about 650 px across the melee in 0.29 s | Reads as a running line, but as a thin black line, not heaved earth |
| Impact 800 to 1100 | roots burst up under every figure and coil to the knees in 3 stages; dirt | a thorn ring with overshoot, the coil stages, dirt and leaves; good at 84 px | At 31 px it is a dark speck at his feet, with the red commander ring drawn over its base (13) |
| Hold | lunges halved, a dashed curse ring | the dashed ring sits just outside the red commander ring | Two concentric rings look busy; the hold reads only by the ring |
| Wither | the vines brown and fall in 600 ms, root scars stay | browns and falls as he leaves the field; the scar stays | Good |

The target in battle c is a lone commander, so the case of a held block is seen only in the gallery, on vector stand-in
figures (16).

### Painting, colour grammar, readability

- **Same hand: yes.** The Loam sheets L1 to L4 are oil-paint bark, moss and earth in the figures' palette. The fire
  sheets match the Fire Sprite portrait they were referenced on. The weakest pieces are E5's curly cotton-ball smoke
  and E2/E4's airbrushed glow disc and lens-flare streaks. In game they are small and tinted, so they pass.
- **Colour grammar.** Ember rises and flickers, and its particles and glows are added. The painted fire also draws a
  normal-blend body under its glow; that is a sound deviation, because added fire alone washes to cream on the plains.
  Loam spreads along the ground in normal blend, with no light. Two palette deviations are unrecorded: in
  `45-fx-looks.js` lines 32 and 36, the Ember primary is `#D9442B` (docs/09: `#FD6533`) and the Loam primary is
  `#3F8F3A` (docs/09: `#00674B`).
- **Flashy enough?** At the impact, yes. The flash is missing in the first half of the charge, in the light during the
  travel, and in the firelight on the troops.
- **Who is hit.** The footprints show 0.86 s before impact in the full form and 0.5 s in the brief form, which is
  good. But in cast 1 the struck troops spread over a 70 wu radius while the dome's radius is 60 wu, and cast 5 shows
  the wrong troops.
- **What looks cheap:**
  - the white cut-outs;
  - thin vector rings (the 140 wu shockwave reads as a selection circle);
  - beige additive puddles on light ground;
  - the flip-book pops;
  - the gallery's vector stand-in figures.
- **Flash limiter: correct.** Entangle has one green flash at 0.15 (Soft 0.07; none when Off or under reduced motion),
  and Fireball has none.
- **Reduced motion: correct, with one exception.** There is no shake and no trail, the crack fades in, the spikes rise
  without overshoot and the wither is a fade (18). But the white cut-out still fires, where docs/12 S2.14 asks for a
  red tint.
- **Timing at 1x** is right for both; the owner's flashier timing holds up. At 4x the short form plays and the linger
  stops at the impact, as docs/09 says; the burst becomes a blink, which is fine.

## Fixes, in priority order

**1. Make the firelight visible on the troops.**
- **Wrong.** The lit tint multiplies each figure toward `#FFB347` (`46-fx.js` `applyLights`, line 247). A multiply can
  only darken, so on the dark green Thornwood it changes nothing. Neither "figures within 140 wu tint warm" nor "the
  light pool brightens the figures it passes" shows. The pushed shadows, 7 to 16 wu long, hide under the ranks.
- **Evidence.** 05 (impact peak with tint and shadows on vs off: identical), 06 (prototype).
- **Change.**
  - In `46-fx.js`, add a pooled additive layer `this.lit`: a Container with `blendMode: 'add'` inserted directly above
    `stage.units`, prewarmed to 96 Sprites.
  - In `applyLights`, for each figure with k above 0.02, copy its texture, anchor, position, scale, rotation and skew
    into a pooled sprite; tint it the light's colour; set alpha to min(1, 0.5 k).
  - Drop the multiply tint for figures. Keep it for big bodies until they get a mesh copy.
  - In `pushShadow` (lines 259 to 270), use a length of 14 + 22 k wu and alpha 0.55 k, so the shadows reach past the
    ranks during their 0.3 s.

  I prototyped the copy in the page at 0.5 k. The block turns a lit gold-olive that falls off with distance, and the
  charge light now warms the Magus and his neighbours from the start. This is the spell's light on nearby figures,
  only while the spell plays, so it stays within the owner's "Glow only during own fire".

**2. Fire wounds: an orange flash with sparks, not white cut-outs.**
- **Wrong.**
  - A wounded troop shows the painted `recoil.white` frame for 50 ms (`44-painted.js` line 466). At play zoom (tier S)
    that frame is a solid white cut-out, and five of them pop on top of the burst.
  - It also fires under reduced motion.
  - docs/12 S2.9 and C.1 give fire wounds "ember sparks, orange flash (`#FFB347`), smoke wisp". The white flash is
    meant to last one frame at 90%, and docs/12 S2.14 asks for a red tint under reduced motion.
  - Close zoom already skips the cut-out (`60-render.js` line 691).
- **Evidence.** 04 (play zoom, +1.367 to +1.433 s), 18.
- **Change.**
  - `31-build.js` line 392: push `element: fxl ? fxl.element : null` with the wound reaction.
  - `44-painted.js` line 466: for `element === 'fire'`, never use the white pose. Instead, flag the figure for one frame
    (1/60 s) and draw the flash through fix 1's additive copy, at alpha 0.9, tinted `#FFB347`.
  - In `fxBlast`, at each wounded troop's hit time, add 4 E4 sparks (0.2 s) and one E5 wisp (0.8 s, char tint).
  - Under reduced motion, draw no flash frame; tint the figure `#D0605A` (C.2 amendment 12) for 0.15 s.
  - Outside the pilot, physical wounds at tier S should also be one frame at 90% (docs/12 S2.9).

**3. Make Entangle read at play zoom.**
- **Wrong.** At 31 px the roots are a dark speck about 15 px wide at Ishka's feet. His red commander ring is drawn over
  their base, and the dashed curse ring sits just outside it, so the hold reads only through the ring and the ticker.
  The crack is a thin black line. Close up, all of it works.
- **Evidence.** 12, 13, 14, 15. The prototype in 15 shows that bigger roots and a dimmed commander ring help, but are
  not enough alone.
- **Change.**
  - (a) `45-fx-looks.js` lines 71 and 72:
    - `impact.thorns` 34 to 48;
    - `hold.thorns` 26 to 38;
    - `hold.coil` 14 to 20 (to the hips; the block fit in `48-entangle.js` line 122 still shrinks them between men);
    - `hold.ringR` 26 to the commander ring's radius.
  - (b) `48-entangle.js` line 144: drop the `> 6` guard. Grow 4 anchor tendrils per held figure: vineStrip ropes 12 to
    20 wu long, radiating from his feet at seeded angles, swaying while he is held and browning with the wither. Lines
    read at small sizes and say "rooted".
  - (c) `60-render.js` lines 911 to 923: while `G.fxHold` covers t, draw his commander ring at alpha 0.3, so the curse
    ring replaces it instead of doubling it.
  - (d) `48-entangle.js` lines 95 to 99: the crack's running head throws a spray of clods (8 dirt particles and 2 E5
    puffs of 10 to 16 wu) and leaves a few clods along the crack.
  - (e) Line 124: use all three L1 variants, chosen by figure id (B for a lone figure), so a held block is not twelve
    copies of one painting.

  Then the L2 and L3 re-rolls below.

**4. Aim the burst at big bodies.**
- **Wrong.** The only troop cast 5 strikes is the Great Wyrm. `fxClusters` centres the burst on its ground point, which
  is at its feet, inside the Cinder block fighting it. The Fireball reads as friendly fire and the Wyrm looks
  untouched. Its 7 wu footprint ring is hidden under the body.
- **Evidence.** 07.
- **Change.**
  - In `33-fx-timeline.js` `fxClusters` (lines 53 to 81), for a struck figure of size 3 or more, use the body's centre
    and set r to `LAYOUT.footR[size]`.
  - In `47-spells-pilot.js`, for a big body:
    - the lob's end height `E.h` (line 191) is 0.45 times the body's height;
    - the burst width is max(`P.burst`, 2.2 x footR), sorted just in front of the body (zIndex = the body's depthKey
      + 0.05);
    - the footprint ring is at footR;
    - the light reaches the body.

**5. Smooth the burst flip-book.**
- **Wrong.** The six E3 frames hold 77 ms each with hard cuts (`fxBlast` line 267). At 1x the dome pops between sizes.
  At 0.25x, the page's slow view, it is a slideshow while everything else moves at 60 fps.
- **Evidence.** 08, sampled every 25 ms: from 1458 to 1483 ms the dome jumps to full size; from 1533 to 1558 ms it jumps
  from a bright dome to a dark ring.
- **Change.** In `47-spells-pilot.js` lines 266 to 272, draw frame k and frame k + 1 together over the last 40% of each
  hold, at alphas 1 - f and f, both sorted and both glowing. Scale each frame from 0.95 to 1.05 across its hold, so the
  fire never stands still. Give the fragment's 5-frame burst the same treatment.

**6. Fix the review page before the owner sees it.**
- **Wrong.**
  - It reopens settled questions. Both spells' deviation lists still say the 0.9 s cap is "kept for now while the owner
    decides", the particle-count deviation does the same, and Q1 says "the new art direction asks for 0.9 s". On
    2026-10-24 the owner chose "Keep the flashier timing" (`docs/design/battle-overhead.owner-answers.md`), and docs/09
    now says so.
  - No question marks a recommended answer.
  - Three of the six Fireballs play the brief form, but no clip shows it.
  - The gallery calls itself docs/09's readability tests, but it cannot run them. Fireball and Entangle differ in both
    colour and family, so neither pair test (same family, different colours; same colour, different families) can
    run. Its figures are flat vector stand-ins, not painted figures. The "300 vs 300" blocks sit mostly outside the
    frame. And "Entangle 0.98 s" is not a docs/12 short form; it is derived by C.3's rule.
  - After a frame step the readout shows the previous frame: it read 48 while the video moved to frames 54 and 55.
  - At 390 px, the clips and the gallery are about 340 px wide (a man is 12 to 15 px), and the gallery's two labels
    overlap ("scale 2Entangle").
- **Evidence.** 16, 17, 19, 20.
- **Change.**
  - `units/stage-d/work/tools/pilot_data.py`:
    - delete the 0.9 s deviations, the particle-count deviation and Q1's 0.9 s clause;
    - add one line: "Durations and particle counts: docs/12 S2.10, the owner's choice of 2026-10-24";
    - mark a recommended option on each question (see below);
    - add a clip `fb4` of cast 4 (brief, 5 struck) to `CLIPS`, recorded with `clips.cjs`.
  - `gallery.js`:
    - caption the toggles "each spell alone: sprites hidden, colour removed" and note that the pair tests come with
      Thorn Spray and Ember Dart;
    - set the camera to z 1.1, centred so both 300-man blocks show;
    - swap the vector figures for 4 painted tier S frames (a Cinder warrior, a Warden, the Magus, the druid).
  - `pilot_template.html`:
    - update the readout on `seeked`, and with `requestVideoFrameCallback` while playing;
    - below 600 px, default the clips to 2x, stack the gallery's two scenes, and let `.glabels` wrap;
    - give each clip's man size as shown on screen (about 30 px at 1440).

**7. Remove the hitches.**
- **Wrong.**
  - (a) The first frame that draws the effects layer pays for the 2048 x 1024 atlas upload with mipmaps, plus the
    particle and rope shaders. On a fresh page in SwiftShader that frame takes 1.7 to 2.9 s; the frames after it take
    5 to 10 ms. On a real GPU this is a stutter at the first charge. It also explains the builder's 85 to 140 ms frames
    (8 of 12 pilot runs, against 2 of 12 before the pilot).
  - (b) On the first impact frame the shadow pool grows by 60 Sprites: 77 figures are lit, but `groundN` is warmed to
    only 16 (`46-fx.js` line 149).
  - (c) `applyLights` allocates two or three objects per figure per frame (`toGround` in `00-util.js` line 53, and
    `tintOf`). That is about 600 figures for 2.5 s of every cast, which is the GC behind the builder's single frames of
    5 to 15 ms. My sequential runs measured a median of 0.1 ms and a p95 of 0.3 to 0.6 ms.
- **Change.**
  - Add `FxLayer.warm(renderer)` in `46-fx.js`: make one tiny element visible in every pool and blend (an atlas sprite,
    a Particle, a rope, a sorted sprite), render once, then hide them. Call it from `90-main.js` after `this.load()`
    (line 39), while the loading screen is up.
  - Prewarm Ember's `groundN` to 96.
  - Give `toGround` an `out` argument, reuse one scratch object in `applyLights`, and skip figures outside the lights'
    bounding box.

**8. Burning kills need flames.**
- **Wrong.** A fire kill darkens over its 0.7 s fall and sheds 12 embers and a smoke wisp, but never burns. docs/12
  S2.9 says it "blackens over 0.3 s and collapses; flames 1.5 s". The atlas already holds four painted flame licks
  (E4 `lick1` to `lick4`) that no code uses.
- **Evidence.** 11.
- **Change.** In `47-spells-pilot.js` lines 226 to 244, draw 2 or 3 licks on each fire kill for 1.5 s, riding the
  falling body: cycle `lick1` to `lick4` every 4 frames, 8 to 12 wu tall, with a normal body and an added glow as
  `fxFire` does. Char the tint over 0.3 s instead of over the fall.

**9. Light that reads on light ground, and a shadow that reads.**
- **Wrong.**
  - Additive warm light turns cream on the light plains. The travel pool is a beige puddle far below the orb, and the
    scorch glow is a cream patch.
  - The orb's shadow (line 210: 14 wu, alpha at most 0.32 x (1 - h/300)) vanishes at the apex. Yet art plan 7.5 names
    "a lob in the air with a ground shadow" as Fireball's travel.
  - Burst frame 4's dark red smoke, keyed by luminance, reads pink.
- **Evidence.** 09, 02.
- **Change.**
  - Line 211: a normal-blend warm pool (the glow tinted `#C4532C`, alpha 0.18 x (1 - h/260)) under a half-size
    additive core.
  - Line 210: a shadow 20 wu wide, alpha 0.38 x (1 - 0.5 h/apex).
  - Lines 283 to 286: replace the cream glow with 10 smouldering E4 ember chunks on the scorch ring, flickering for
    1.5 s.
  - The E3 re-roll below removes the pink smoke.

**10. A painted shockwave, not a selection circle.**
- **Wrong.** The 140 wu impact ring is a thin keylined ellipse (`fxRing`, line 277). It is larger than the dome and
  crisp, so it reads as UI.
- **Evidence.** 01, 02, 03.
- **Change.** In lines 275 to 279, replace the normal-blend ring with about 20 E5 puffs on the expanding 0.643 ellipse:
  normal blend, tinted the ground's dust (`#B8AC98` on the plains), growing from 8 to 20 wu, alpha 0.4 x (1 - k). Keep
  the additive ring at 0.25 as its leading edge. The release rings stay keylined, because they carry information.

**11. Fit the dome to the struck troops, and make fragments visible.**
- **Wrong.** Cast 1's five struck troops spread over a 70 wu radius, but the dome is only 120 wu wide, so the outer
  ones stand outside the fire. Fragments are a 9 wu orb with no trail, and cast 2 sends one 445 wu.
- **Evidence.** 02, 03.
- **Change.**
  - Line 268: make the main burst's width clamp(2.2 x cluster.r, 120, 180) wu.
  - `fxFragment` (lines 312 to 323): add a 40 wu trail rope (add one to the `airA` prewarm, line 152), a 24 wu orb, a
    40 wu glow, and a landing burst of at least 70 wu.

**12. Add the mana symbol to the charge, and settle the palette.**
- **Wrong.** In docs/12 S2.10 the charge shows "the color's mana symbol", and C.1 makes the flame and leaf glyphs the
  cue that works without colour. Neither spell shows one. Ember's and Loam's primaries differ from docs/09 with no
  recorded reason (see above).
- **Change.**
  - Draw the glyph over the caster for the charge (0.7 s for Fireball, 0.45 s for Entangle) and at the front of the
    release ring. Use the G1 sheets below, or a procedural glyph sprite in the meantime.
  - Either record both palette changes with their reason in `45-fx-looks.js` and on the page, or return to docs/09's
    values. When this is ported, the decision goes into the docs as CLAUDE.md requires.

## Re-rolls, in priority order (10 generations; 13 with contingency; 21 left)

| # | Sheet | Generations | Ask for |
|---|---|---|---|
| 1 | **L2 roots and vines** | 2 (nb21, g3pro) | See the full ask below the table. |
| 2 | **L3 ground crack**, wide strip only, on magenta, normal blend | 2 | A heaved furrow: a dark jagged split along the middle, with broken clods and torn turf pushed up along both lips. The clods' upper-left faces are lit by the sun, with soft shadow to the lower right, so the strip reads light, dark, light when it is 16 px wide. Clean tapered ends for a rope. Also a crack head: clods and dust thrown up and forward. Keep the picked split ground and root scars. Multiply cannot show sunlit clods, hence the keyed sheet. |
| 3 | **E3 fire burst**, frames 4 to 6 | 2 (an nb21 edit of E3.r2; a fresh g3pro with r2 as reference) | Frames 4 to 6 repainted with fire and embers only, no smoke anywhere, because the game adds its own. Frame 4: the dome tearing open into curling orange and deep red tongues, no more than 10% wider than frame 3. Frame 5: a ring of low flames around a dark burnt middle. Frame 6: glowing embers in a broken ring. Frames 1 to 3 unchanged. |
| 4 | **G1 mana rings**, flame and leaf only | 4 (two sheets x 2) | G1-flame on black (additive): a ring of small painted flame tongues on the 0.643 ground ellipse with the flame glyph standing at its front, plus the glyph alone, readable at 20 px. G1-leaf on magenta (normal blend, because Loam is matter): a ring of leaves and young vines with the leaf glyph at its front, plus the glyph alone. |
| Contingency | L2 again (2), E3 again (1) | 3 | L2 only if neither candidate is see-through with separate front and back halves; E3 only if the edit drifts from frames 1 to 3. |

The full ask for L2: three growth stages of roots and vines spiralling up from a ring of cracked earth around an
**empty** centre where a man's legs stand. They must be open and see-through between the tendrils, never a solid mound
or cocoon; the picked coils cover the legs like a basket (14). Each stage is painted as two separate elements, the
back half and the front half, so the game can draw the legs between them. Stage 3 reaches the hips of the guide's
man. A few tendrils lie on the ground, radiating from the ring. Then the same three stages withered: brittle brown,
sagging, falling apart. Bark browns and moss, with living green on the newest growth, in the hand of the picked L1.

The other sheets stand. E2, E4, E5, E6, L1 and L4 need no generation: fix 8 uses the E4 flame licks, and fix 10 uses
the E5 puffs.

## Questions for the owner (recommended answer first)

1. **Fireball:** Keep / Redo. *Recommended: Keep*, with fixes 1, 2, 5 and 8 to 11 in.
2. **Entangle:** Keep / Redo the hold's look. *Recommended: Redo the hold*: same beats, with bigger roots, open coils
   and anchor tendrils, and no doubled ring.
3. **The firelight on the troops** (show a before/after still): Right / Subtler / Stronger. *Recommended: Right* (0.5
   at the peak).
4. **The brief form** (0.5 s, from the Magus's third cast): Keep / Longer (0.8 s). *Recommended: Keep.*
5. **Footprint rings drawn over the figures:** Keep / Under the figures only / Drop. *Recommended: Keep.*
6. **The shockwave:** a dust ring / a thin gold ring. *Recommended: the dust ring.*
7. **Entangle's green release flash** (full scene, 0.15): Keep / Soft (0.07) / Drop. *Recommended: Keep.* It is
   docs/12 for level 3; it is limited and off under reduced motion.
8. **The mana glyph over the caster during the charge** (docs/12 S2.10): Yes / No. *Recommended: Yes.*

Drop the Fireball timing question, which was settled on 2026-10-24. Drop the gallery question until the pair tests
exist. Entangle's crack and growth timing can stay as a question, with Right as the default.

## Outside the pilot, but in its frames

The owner will see these in the same clips and judge the pilot by them:

- **The old placeholder fire burst** (`60-render.js` line 667, used for retaliation burns and breath) draws ten
  additive dots. In their first frames they overlap into a flat peach disc, and one appears beside cast 6's blast (21).
  It is three lines to swap them for `fxEmber` and E4 sparks.
- **The old procedural Bless column**, a hard-edged pale bar, stands over a Cinder block during Fireballs 1 and 2: the
  Pyre Priest casts Bless at 4.6 s and 8.8 s, landing 80 ms after each Fireball. At 6.1 s the Great Wyrm's breath
  follows, drawn as flat green discs (01, 02).

The page should say that the other nine spells and the breath weapons are still placeholders.

## Keep

- The beats, timings and counts exactly as storyboarded, all in one data table.
- Closed-form, deterministic particles; the chain rule; the cap of three effects at once.
- The burst sorted among the figures, and the paint-plus-glow treatment of fire on light ground.
- Early, clear footprints.
- Scorch rings that build up into a battle's history (10).
- Entangle's close-up painting, its normal blend and its absence of light.
- The flash limiter, and the reduced-motion forms.
- The page's player: the clip beside its storyboard with the current beat lit, 0.25x, frame steps, a 2x switch that
  keeps the time, stills and keyboard control.

## Evidence (`units/stage-d/critique-shots/`)

01 Fireball cast 1 at the automatic camera (36 px), every beat. 02 the same at 28 px. 03 close (67 px). 04 white
cut-outs on the fire wounds at play zoom. 05 light tint and pushed shadows on vs off. 06 prototype: additive light copy.
07 cast 5's burst inside its own block. 08 the burst flip-book from the 120 fps clip, every 25 ms. 09 the beige light
pool and pink smoke at 28 px. 10 cast 6 close. 11 a burning kill with no flames. 12 Entangle full frames at play zoom.
13 Entangle's target at play zoom (x2.4). 14 Entangle close (84 px), hold and wither. 15 prototype: bigger roots and a
dimmed commander ring. 16 and 17 the gallery: base, sprites hidden, colour removed, short. 18 reduced motion. 19 the page
at 390. 20 the player at the impact (play zoom and 2x). 21 the old placeholder fire disc. 22 cast 3, the brief form.
