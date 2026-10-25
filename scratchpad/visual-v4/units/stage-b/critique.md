# Stage B battle mockup: the art director's critique and QA

2026-10-23. This reviews the integrated mockup (`visual-v4/battle-mockup.html`, Painted by default) and the portrait
board, against the owner's pilot verdict, the art plan, the pilot review and the stage B calibration. I edited nothing
in the mockup or the repo and made no generations. Paths are relative to `scratchpad/visual-v4/units/` unless they start
with `src/` (meaning `visual-v4/src/`).

**What I did:**
- Played all three battles live at 1x and 4x at 1920 × 1080 (49 shots).
- Shot every painted block at 28 and 72 px and every commander at 150 px (rest, act, release) beside its portrait.
- Shot the card bars, motion strips (march, fast moves, rout, deaths, seat slides), the tier switch, the Salamander's
  breath and death, and the Wolf Riders standing and routing.
- Measured motion, tier use, commander framing and side looks in the page.
- Ran a side-look lab with candidate shader values.
- Everything is in `stage-b/critique/`: `shots/`, `tools/`, `motion.json`, `strips.json` and `sidelab*.json`.
- No page errors in any run.

---

## Verdict

**Close to the owner's bar on the Cinder side. Not ready on the Thornwood side.**

| Owner's word | State in the mockup |
|---|---|
| Painted art makes it stand out | **Yes, for Cinder.** At play zoom, the Cinder blocks read as painted troops of one hand, orange, varied and alive (`shots/zoom-c-cw-72.png`). |
| Variation through shaders and reused assets | **Done well.** Neighbours always differ and blocks are not noisy. Stencils show only at close zoom. |
| Commanders unique | **Half done.** All 10 Cinder faces (11 commanders across the battles) match their portraits: headgear, beard and mantle read (`shots/mont-cmd-faces.png`). But all five Ash Chieftain faces share one body, one axe and one pose. |
| Card and figure match (binding) | **Broken for every Thornwood commander but Elder Druid 08.** Six faces show their portrait on the card and a procedural toy on the field. The two Warden Captains in battle b are the same toy (`shots/mont-cmd-b.png`). |
| Mounts: size, separate later | **Wolf Rider size is right:** 32.7 wu, the rider's head a man's. The separate-mount route is proven and correctly parked for stage C. |
| Motion: own timing, individuals stand out | **The timing is right.** But feet slide, bodies pop and routers run on the spot (fix 4), and generals lost their banners (fix 6). |
| Sides readable at play zoom | **Cinder 41 to 54%. Far Thornwood only 23.5 to 24%**, near-black in battle a. A shader change measured here brings it to 32 to 37% with the colour-blind contrast kept (fix 2). |
| Portrait board | **Empty.** All 58 creature, mount and god candidates were refused (HTTP 402). Only the kept Warden bust is on it (section 3). |

---

## 1. Fixes, most important first (12)

### 1. Paint the Thornwood commanders (generations R1 to R13), and re-key Elder Druid 08

**Problem.** These faces stay procedural:
- Warden Captain 04, 05 and 07;
- Sapling Druid 03 and 08;
- Grove Priest 01.

Elder Druid 08 lacks its back view. Every Thornwood leader's card shows its approved portrait while the field shows a
toy. That breaks the owner's binding rule (owner answers 1.3) in all three battles. Battle b's whole near-side command
is procedural.

**Change.**
1. Run R1 to R13 (section 2) with the cmdB tools (`work/cmdB/sbx/tools/cmdb_bodies.py`, `cmdb_faces.py`,
   `cmdb_run.py`, `cmdb_pipe.py`, `cmdb_pack.py`) into `stage-b/atlas/cmdB/`.
2. Re-run `integrate/bundle.py` so `looks` gains the faces and `missing` empties.
3. Run `build.py`.
4. Re-key the Elder Druid 08 front sheet with fix 9's keyer before packing. Its staff is pink from the magenta key.

**Check.**
- `checks().battles[*].paint` shows commanders painted 7/7, 7/7 and 6/6.
- The face-match check passes 20 of 20.
- `shots/commanders-vs-cards.png` is re-shot with no "not painted" panel.

### 2. Far Thornwood: lift its chroma instead of only darkening it (`src/44-painted.js`, no generation)

**Problem.** To keep the colour-blind contrast, the lab pushed far Thornwood to `darkest` (battle a) and `darker`
(battle c).
- Darkening clips the dark green's chroma, so side colour at play zoom is 23.5% and 24.0% against the 30% target.
- Battle a's far blocks read near-black (`shots/live-a-1x-09.png`). Their bodies turn into black blots.

**Change.**

At lines 241 to 244, add two looks to each nation:

```js
const PAINT_SIDE_SHIFT = {
  cinderHorde: { base: [0, 1], light: [0.05, 1.04], lighter: [0.1, 1.06], lightest: [0.15, 1.08], vivid: [0.15, 1.25] },
  thornwood: { base: [0, 1], dark: [-0.05, 1], darker: [-0.09, 1], darkest: [-0.13, 1], darkC: [-0.05, 1.3], darkestC: [-0.12, 1.3] },
};
```

At lines 33 to 37, set the table:

```js
const PAINT_SIDE_LOOK_TABLE = {
  'cinderHorde>thornwood@a8a784': { near: 'vivid', far: 'darkestC' },
  'thornwood>cinderHorde@b9bdcb': { near: 'darkC', far: 'lighter' },
  'cinderHorde>thornwood@8e8e78': { near: 'vivid', far: 'darkC' },
};
```

Cinder still only lightens and Thornwood still only darkens. The new looks lift chroma, which raises the hue share
without lowering protan contrast.

**Measured in the page** (`critique/sidelab4.json`, `sidelab3.json`; the page's own `checkColors` and `checkSideShare`):

| Battle | Look | Protan / deutan ΔE | L\* below ground | Near side | Far side |
|---|---|---|---|---|---|
| a, now | lighter / darkest | 13.0 / 17.0 | 32.2 / 49.8 | 43.0% | **23.5%** |
| a, new | vivid / darkestC | 13.4 / 17.9 | 30.9 / 49.2 | 45.6% | **32.7%** |
| b, now | dark / lighter | 14.5 / 20.9 | 56.7 / 38.4 | 50.0% | 54.2% |
| b, new | darkC / lighter | 13.9 / 20.7 | 56.7 / 38.4 | 57.0% | 54.2% |
| c, now | lighter / darker | 13.2 / 17.2 | 21.2 / 37.5 | 47.8% | **24.0%** |
| c, new | vivid / darkC | 13.2 / 18.0 | 19.1 / 35.4 | 50.1% | **31.8%** |

Rejected:
- `lightest2` and `lightest3` (+0.20 and +0.25 L). They pass, but turn the Cinder capes pastel (`shots/cmp-side-a.png`).
- `vivid` keeps them ember-orange (`shots/cmp-side-a2.png`, `cmp-side-c2.png`).

Also:
- In `integrate/bundle.py` (the Wolf Rider block, around line 236), apply the Thornwood cloth hue lock
  (`cal/sbx/tools/cal_huelock.py`: range 90° to 230°, floor 0.02, grey band ±25° around 166°) to every Wolf Rider frame
  before packing.
  - It is the only Thornwood look packed without the lock, and it holds battle c's far share down at 19.2%.
- Add `vivid`, `darkC` and `darkestC` to `integrate/tools/lab2.js`. Make it pick the least change that passes both the
  colour-blind rule and the 30% side share.

### 3. Keep the automatic camera on tier S, and bake tier H at load (`src/44-painted.js:15`, `src/60-render.js:250`)

**Problem.**
- The automatic camera's holds reach a man of 52.8 px (fMax × 1.1). That is above `PAINT_TIER_UP = 50`.
- So unattended play switches to tier H for 36 to 40% of battle a, 15 to 16% of b and 10 to 12% of c.
- The first switch falls on the biggest beats:
  - 34.8 s in battle a (the Wyrm);
  - 26.9 s in battle c (the Salamander's death);
  - 42.6 s in battle b.
- At that switch:
  - it costs the one-time bake: 0.48 s frozen in battle a;
  - the keyline changes from the side colour to neutral #1C1A17, which removes review change 14's side keyline at play
    zoom;
  - the shield stencils pop in (`shots/mont-strips2.png`, top row).
- Measured in `critique/tools/tiertime.js`.

**Change.**
1. In `src/44-painted.js:15`, use `const PAINT_TIER_UP = 56, PAINT_TIER_DOWN = 53;`.
   - The automatic camera then stays on S (plan 8.4: tier S serves the automatic camera). Measured: 0% H in all six runs.
   - The player's zoom and DPR ≥ 1.5 still reach H.
2. In `src/60-render.js` after line 250 (`this.bakePaintTier('S');`), add
   `setTimeout(() => { if (this.paint && !this.paint.tex.H.size) this.bakePaintTier('H'); }, 0);`.
   - The H bake then happens after the first frame, not in the middle of a beat.

### 4. The dead-pose pop: the corpse is the other dead pose half the time (`src/60-render.js:284`, `:613`, `src/44-painted.js:363`)

**Problem.** When the body decal replaces the falling sprite, the decal and the sprite pick their dead pose from two
different seeds:
- the sprite picks deadA or deadB from `f.death.flip` (`src/44-painted.js:362`);
- the decal picks it from an unrelated `u01(…'/deadpose/'…)`.

So 205 of 388 painted deaths swap to the other dead pose at landing:

| Battle | Deaths that swap pose |
|---|---|
| a | 87 of 163 |
| b | 53 of 100 |
| c | 65 of 125 |

Mirror, position and final rotation match (`critique/motion.json`). The rotation also jumps at half the fall: from
−0.22·fwd to `death.rot × 0.5`, up to about 23°.

**Change.**
- `src/60-render.js:284`: change it to `deadPose: f.death && f.death.flip ? PP.deadB : PP.deadA`.
- `src/44-painted.js:363`: change it to
  `o.rot = k < 0.5 ? -fwd * 0.22 * smooth(k * 2) : lerp(-fwd * 0.22, f.death.rot * 0.5, smooth((k - 0.5) * 2));`
- `src/60-render.js:613`: change it to `sp.rotation = dead ? pp.rot : pp.rot + v.lean;`

**Check.** Add a check that the sprite's texture at `death.t + fall − 0.004` equals the decal's at `+0.004` for every
painted death. The logic is in `critique/tools/motion.js`; the target is 0 mismatches.

### 5. Feet slide and routers run on the spot (`src/44-painted.js` `paintPose`, `src/60-render.js:984`)

These are measured in `critique/motion.json` and `strips.json`. Each part gets its own change below.

#### a. March cadence

**Problem.**
- The march is fixed at 2 steps a second whatever the speed.
- 29 to 31% of the time blocks spend moving is above 45 wu/s, a step of 23 wu or more for a 28 wu man.
- Reform dashes reach 236 to 366 wu/s (battle a), 187 (b) and 318 (c). That is 90 to 180 wu a step: blocks skate
  (`shots/mont-skate.png`).

**Change.** In the march branch (lines 438 to 446), replace the cadence with a speed-based one:

```js
const spd = Math.hypot(seg.x1 - seg.x0, seg.y1 - seg.y0) / Math.max(1e-3, seg.t1 - seg.t0);
const steps = clamp(spd / 11, 1.7, 5) * tempo;           // an 11 wu step, at most 5 steps a second
const u = (t - seg.t0) * steps * 2 + v.phase * 4;
const k = Math.floor(u) & 3;
pose = [PP.marchA, PP.stand, PP.marchB, PP.stand][k];
o.lift = (k & 1) ? (1.5 + clamp((spd - 30) / 60, 0, 1)) * Math.sin(Math.PI * (u % 1)) : 0;
o.rot = fwd * (0.06 + 0.06 * clamp((spd - 30) / 90, 0, 1) + 0.017 * Math.sin(u * Math.PI / 2));
```

The 0.6 s dashes above 150 wu/s will still glide at 5 steps a second. They are the timeline's reform moves. Raise them
with the owner rather than lengthening segments.

#### b. Seat slides

**Problem.**
- At rest, 165, 134 and 82 seat cues per battle slide figures in the stand frame.
- The median slide is 12.5 wu at 31 wu/s. The longest is 65 wu in 0.5 s.

**Change.**
1. Add this helper:

   ```js
   function activeSeatCue(f, t) {
     const c = f.seatCues;
     if (!c) return null;
     for (let i = c.length - 1; i >= 0; i--) {
       const q = c[i];
       if (q.t <= t) return t < q.t + q.d && Math.hypot(q.u - q.u0, q.v - q.v0) > 4 ? q : null;
     }
     return null;
   }
   ```

2. At the top of the rest branch (line 449), shuffle-step while a cue runs:

   ```js
   const cue = activeSeatCue(f, t);
   if (cue) { const u = (t - cue.t) * 8 + v.phase * 4; pose = [PP.marchA, PP.stand, PP.marchB, PP.stand][Math.floor(u) & 3]; }
   ```

#### c. Rout

**Problem.**
- Flee frames cycle at a fixed 4.2 Hz while the run eases out.
- Routers then jog on the spot at the field edge:

  | Battle | Median | p95 | Max |
  |---|---|---|---|
  | a | 1.5 s | 4.1 s | 4.3 s |
  | b | 1.1 s | 2.3 s | 3.5 s |
  | c | 0.6 s | 4.4 s | 6.3 s |

- The longest is Ash Chieftain 03 (`shots/mont-strips1.png`, row 4).

**Change.** Replace lines 367 to 373:

```js
if (f.rout && t >= f.rout.t) {
  const r = f.rout, q = clamp((t - r.t) / r.dur, 0, 1);
  let d = r.D * easeOut(q);
  if (r.tLeave !== null && t > r.tLeave) d += 40 * clamp((t - r.tLeave) / 0.5, 0, 1);
  if (q >= 0.97 && !(r.tLeave !== null && t > r.tLeave)) { o.pose = PP.stand; o.sy = 1 + 0.012 * Math.sin(t * 5 * tempo + v.phase * TAU); return o; }
  const u = d / 17 + v.phase * 2;                         // one flee frame per 17 wu run
  o.pose = (Math.floor(u) & 1) ? PP.fleeB : PP.fleeA;
  o.lift = (u % 1) < 0.5 ? 1.2 : 0;
  o.rot = fwd * 0.08;
  return o;
}
```

#### d. Strike view flips

**Problem.**
- Painted figures flip between the back and front sheets 6 to 9 times each at p95 (up to 12).
- Most flips are a strike turning a near-side man to face the camera because his target is a little lower on screen.
- At close zoom that is a 180° spin per blow.

**Change.** In `src/60-render.js:984`, turn only when the target is behind:

```js
const sv = sy(dx, dy, 0) / (Math.hypot(sx(dx, dy), sy(dx, dy, 0)) || 1);
st.view = near ? (sv > 0.34 ? 'se' : 'ne') : (sv < -0.34 ? 'ne' : 'se');
st.flip = !right;
```

#### Check

- Re-run `critique/tools/motion.js`. The targets:
  - march step ≤ 16 wu up to 80 wu/s;
  - no seat slide in a stand frame;
  - rout stand-still in flee frames ≤ 0.1 s;
  - view flips at p95 ≤ 4.
- `checks()` must still match figures at phase ends at 1x and 4x. These changes touch only the pose and view.

### 6. Give generals the painted banner, and the blocks too (`integrate/bundle.py`, `src/60-render.js:881-899`)

**Problem.**
- The procedural generals carried a banner (`src/40-figures.js:42-44`, `banner: true`). The painted ones lost it.
- At play zoom they are dark-grey, cloth-less figures that do not stand out from their troops. Only the base ring marks
  them.
- Meanwhile stage B's three painted banners exist (`stage-b/atlas/troops/banners/`, with an 8 × 2 mesh in each JSON)
  and are unused.
- The block pennants are flat vector triangles beside painted figures.

**Change.**
1. In `bundle.py`, inline `banner-<nation>.128.png`, `banner-<nation>.256.png` and the mesh JSON as `PAINT.banners`.
2. In `drawGlyphs` (`src/60-render.js:881`), when `this.paint` is set, replace the triangle at line 896:
   - draw a `PIXI.MeshPlane` per block (9 × 3 vertices, column 0 pinned at the pole);
   - size it 20 × 8 wu at the pole top;
   - give it a travelling sine: `y += sin(t*3 + G.idx - col*0.7) * 1.2 * col/8`.
3. Give every painted general (`look.act === 'rally'`) the same banner:
   - 26 × 11 wu;
   - on a pole 74 wu tall, 12 wu behind its back shoulder, as `drawBanner` placed it (`src/42-figure-draw.js:246`);
   - flare it to 1.15× during `actA` and `actB` (plan 6, "Banner wave").
4. Use the 256 px banner at tier H.

**Check.** Every living painted general shows its nation's banner in the battle shots. Banner pages add under 150 KB.

### 7. Keep the commanders in frame (`src/70-camera.js:30-33`)

**Problem.** The automatic camera frames the action box, so the generals behind the near line spend much of the battle
under the card bar or off screen (`critique/tools/cmdvis.js`, 1920 × 1080). Share of their alive time:

| Battle | Commander | Under the card bar | Off screen |
|---|---|---|---|
| a | Ash Chieftain 05 | 32% | 42% |
| a | Pyre Priest 01 | 18% | 24% |
| a | Ash Chieftain 01 | 17% | 23% |
| b | Warden Captain 05 | 49% | — |
| c | Ash Chieftain 03 | 32% | — |

The owner asked that individuals stand out, and these figures are the faces he approved.

**Change.** In `buildCameraKeys`, before line 30, grow a copy of `k.box` by every living, non-routed commander near it,
and use `box` in place of `k.box` on lines 30 and 33. The camera stays a pure function of story time.

```js
const box = { ...k.box }, reach = 0.6 * (k.box.y1 - k.box.y0), q = { x: 0, y: 0, h: 0 };
for (const G of T.G) {
  if (!G.g.isCmd || G.g.size >= 3 || k.t < G.appear || (G.leaveT !== null && k.t >= G.leaveT)) continue;
  const f = T.F[G.figs[0]];
  if ((f.death && k.t >= f.death.t) || (f.rout && k.t >= f.rout.t)) continue;
  figPos(T, f, k.t, q);
  const X = sx(q.x, q.y), Y = sy(q.x, q.y, q.h);
  if (X < box.x0 - reach || X > box.x1 + reach || Y < box.y0 - reach || Y > box.y1 + reach) continue;
  box.x0 = Math.min(box.x0, X - 16); box.x1 = Math.max(box.x1, X + 16); box.y0 = Math.min(box.y0, Y - 40); box.y1 = Math.max(box.y1, Y + 14);
}
```

**Check.**
- `cmdvis.js`: each commander under the card bar ≤ 5% of its alive time.
- The median key zoom drops by no more than 10%. If it drops more, restrict the loop to the near side.

### 8. Card art: paint the nine troop busts (R20 to R28); until then, reframe the crops (`integrate/bundle.py:290-312`)

**Problem.**
- Nine of the ten troop cards are figure crops seen from above.
- The head sits 40 to 60% down the card and the cut falls at the hips, with dark space above (`shots/mont-cards.png`,
  `mont-cardbars.png`).
- Beside the leader portraits and the kept Warden bust they read as miniatures, not the portrait family. The plan's
  default (Q2) is a painted bust for every troop type.

**Change.**
- Run R20 to R28. Their prompts and jobs exist: `work/troops/prompts/b1.<unit>.bust.txt`, `work/troops/jobs/b1.json`.
- Interim, if the API is still down, in `card_from_frame`:
  1. Take `top` from rows whose alpha width is at least 18% of the widest row. That drops spear and bow tips.
  2. Set `ch = body * 0.36`.
  3. Set `y0 = top - 0.09 * ch`, so the head top sits 9% down as in the portraits.
  4. Keep `cw = ch * W / H`.

### 9. Port the calibration's thin-feature keyer to `tools/key.py` and re-key (no generation)

**Problem.**
- Elder Druid 08's staff is pink from the magenta key.
- The Ember Skirmisher back sheet's javelin bundles stay key-green at close zoom (`keyInUnitPct` 0.96%,
  `shots/zoom-a-es-72.png`).
- Thin bows and staffs on magenta keys carry a mauve cast.

The calibration fixed all of this in its sandbox. Its pipeline finding 1 says "apply to `tools/key.py`", and that has
not been done: `hue_despill` exists only in `stage-b/cal/sbx/tools/key.py:41`.

**Change.**
1. Copy `hue_despill` and its call into `tools/key.py`. Keep the 6-step reach and do not use the rejected 2-step one.
2. Re-key, slice and pack:
   - `stage-b/cal/raw/ed08.front.redress.*`;
   - `stage-b/raw/troops/r1.emberSkirmisher.back.g3pro.png`;
   - every magenta-keyed sheet with a staff, bow or spear.
3. Re-bundle.

**Check.** `edgeDevPct` ≤ 8% and `keyInUnitPct` ≤ 0.5 on every re-keyed sheet.

### 10. The dead Salamander still stands (`src/60-render.js:693-698`, `:709`)

**Problem.**
- On death the cutout tilts 7° and darkens, but it stays upright on its legs.
- In battle c the ticker says "Salamander has fallen" over a black creature that still looks alive
  (`shots/mont-strips2.png`, row 3; `live-c-4x-30.png`).
- Plan 6 asks for a collapse: "tilt 8 to 12°, settle".

**Change.**
1. Replace the body of the `dead && body.painted` branch:

   ```js
   const q = clamp((t - f.death.t) / f.death.fall, 0, 1), e = easeOut(q);
   body.root.rotation = face * 0.2 * e;          // 11.5°, within plan 6's 8 to 12°
   body.root.scale.y = 1 - 0.16 * e;             // settles onto its belly, about the ground anchor
   body.root.position.y += 3 * e;
   body.root.alpha = 1; body.root.tint = mix(0xffffff, 0x3a3430, q);
   ```

2. On line 709, scale the silhouette shadow with it: `ss.scale.set(body.root.scale.x * k, 0.9 * k * body.root.scale.y);`.

No mesh deformation, so stage D's review order holds.

### 11. Commander variety within the game's constraints: one kit per face, not one axe for all (`work/cmdB/sbx/tools/cmda_faces.py:9`, `cmdb_faces.py`)

**Problem.**
- Every Ash Chieftain face is re-dressed onto one body with the same "jagged single-bit dark iron axe" (`AXE`, used
  for every face) and the same rally.
- On the field, Ash Chieftains 01, 02, 05, 06 and 03 differ only in helm, beard and mantle (`shots/mont-cmd-a.png`).
- The owner asked for "a few more variations with the commanders… each unique".

**Change.** For production, no generation now. Replace the shared `AXE` with a per-face weapon from an axe-family list
that keeps the content's axe and timing:
- bearded axe;
- double-bit axe;
- long-hafted great axe;
- axe with a back spike;
- crescent axe;
- hooked axe;
- broad cleaver-axe;
- axe and round buckler (bodies without a shield excluded).

Assign them by face number, and add a mantle cut from {fur collar, knee cloak, feather mantle, no cloak} where the
portrait does not fix it. Do the same for the casters' staff heads and the druids' staffs, and record the choice in each
figure's sidecar. Re-dressing the five Ash Chieftain faces in these battles would cost 10 generations, so they stay
for the production pass.

### 12. Fix the portrait prompts before the portrait run resumes (`work/portraits/tools/pt_prompts.py:32, 36, 547, 576`)

**Problem.**
- All 26 Thornwood portrait prompts (War Wolf, Oakheart, the Thornwood gods and the palette edits) still say "a clear
  blue-green like fir needles in shade".
- The calibration showed this wording paints the cloth grey: chroma 0.024 against 0.084, 0% side as painted.
- Calibration decision 2 replaced it with r2's words.
- The 22 god bodies are full-length, but their only reference is the leader anchor, a head-and-shoulders bust. That
  invites a bust crop.

**Change.**
1. Use "deep bottle green, the green of jade in shade, clearly coloured, never grey, slate, olive or yellow-green"
   (#1F6A50) in those four strings.
2. Keep the hue lock gate `sideThornLock`.
3. For `kind == 'body'` jobs, pass the god's variant-0 designer render (or its maquette) as Image 1 for pose, parts and
   framing, and the anchor as Image 2 for the hand.

---

## 2. Re-rolls needed: 30 generations

Rules for every job:
- Logged through `tools/gen.py` with the purpose "B …".
- The API refused every call from 09:13Z (HTTP 402, prepayment credits depleted); none of this can run until billing is
  restored.
- Each job gets one re-roll at most, then it is reported.

| # | Job | Model | Image 1 / Image 2 | Why | Gate | Gens |
|---|---|---|---|---|---|---|
| R1 | `twChief.front.body.edit` (prompt and job in `work/cmdB/`) | nb21 | `work/cmdB/refs/cmdChief.front.onmagenta.png` | Thornwood armoured body for Warden Captains | ≥ 14/16 cells | 1 |
| R2 | `twChief.back.body.edit` | nb21 | `work/cmdB/refs/cmdChief.back.onmagenta.png` | its back view | ≥ 14/16 | 1 |
| R3 | `twDruid.back.body.edit` | nb21 | `work/cmdB/refs/cmdCaster.back.onmagenta.png` | druid and priest back view | ≥ 14/16 | 1 |
| R4 | reserve: one re-roll of a failing body (R1 to R3) | nb21 | as the failed job | calibration budgets 2 rolls per back body | ≥ 14/16 | 1 |
| R5 | Warden Captain 04, front re-dress | nb21 | twChief front / portrait `thornwood/wardenCaptain/04` | battle a far side | ≥ 14/16; marks ticked at 4×; hue-locked share | 1 |
| R6 | Warden Captain 05, back re-dress | nb21 | twChief back / portrait 05 | battle b near side | same | 1 |
| R7 | Warden Captain 07, back re-dress | nb21 | twChief back / portrait 07 | battle b near side | same | 1 |
| R8 | Warden Captain 07, front re-dress | nb21 | twChief front / portrait 07 | battle c far side | same | 1 |
| R9 | Grove Priest 01, back re-dress | nb21 | twDruid back / portrait `grovePriest/01` | battle b near side | same | 1 |
| R10 | Sapling Druid 03, back re-dress | nb21 | twDruid back / portrait `saplingDruid/03` | battle b near side | same | 1 |
| R11 | Sapling Druid 08, front re-dress (`work/cmdB/prompts/sd08.front.redress.txt`) | nb21 | twDruid front (cal, 16/16) / portrait 08 | battle c far side | same | 1 |
| R12 | Elder Druid 08, back re-dress | nb21 | twDruid back / portrait `elderDruid/08` | its turn and rout moments use the front view mirrored | same | 1 |
| R13 | reserve: one re-roll of a failing face (R5 to R12) | nb21 | as failed | — | same | 1 |
| R14 | Longbow Hunter front: re-dress of the Flame Archer front (`raw/troops/r1.flameArcher.front.g3pro.png`, 15/15, archer layout) into the Longbow Hunter kit (hood, surcoat, longbow) | nb21 | the keyed Flame Archer front frames laid on #FF00FF, as cmdB laid its bodies | six rolls never passed the camera (best 11/15); far share 16.7 to 19.5% | ≥ 13/15; ≥ 30% hue-locked with the keyline | 1 |
| R15 | reserve: R14's one re-roll | nb21 | as R14 | — | same | 1 |
| R16 | Briar Guard front: surcoat edit of `raw/troops/r1.briarGuard.front.g3pro.png` (pine-green surcoat collar to knee, over the bark cuirass, every cell; review changes 4 and 9) | nb21 | that sheet | far share 22.9% | ≥ 13/15; ≥ 30% | 1 |
| R17 | Thorn Militia front: its refused re-roll `r3.thornMilitia.front.edit` (job in `work/troops/jobs/r3.json`) | nb21 | `r1.thornMilitia.front.g3pro.png` | failed consistency; the re-roll was refused (402) | consistency ΔE ≤ 12 | 1 |
| R18 | Berserker back: re-dress of the Ash Militia back (`raw/troops/r1.ashMilitia.back.g3pro.png`, 15/15) as the berserker (bare-chested grey brute, great axe, a broad ember-orange kilt to the knee and an orange sash across the back) | nb21 | that sheet | the kept back is 8/15 and reads grey (18 to 19% share) | ≥ 13/15; ≥ 30% | 1 |
| R19 | Berserker front: edit of `raw/troops/r1.berserker.front.g3pro.png` adding the same kilt and a sash across the chest | nb21 | that sheet | side 4% as painted | ≥ 13/15; ≥ 30% with the keyline | 1 |
| R20 to R28 | Card busts: Ash Militia, Berserker, Briar Guard, Cinder Warrior, Ember Skirmisher, Flame Archer, Flamebrand, Longbow Hunter, Thorn Militia (`work/troops/prompts/b1.<unit>.bust.txt`, `jobs/b1.json`) | nb21 | anchor / the unit's kept front sheet as kit reference (plan 5.4) | interim crops break the card family (fix 8) | the pilot bust gates: background, top 9%, read at 48 px, side cloth on shoulders | 9 |
| R29 | Wolf Rider back view: the pilot test's missing view | Pro | `refs/guides/wolfRider.back.png` on the blue key (review change 11) | battle b's Wolf Riders stay procedural; battle c's run backwards while routing (front view) | ≥ 14/16 cells; hue-locked share | 1 |
| R30 | R29's one re-roll | Pro | as R29 | Pro reached the mounted camera on 2 of 5 rolls | same | 1 |
| | **Total** | | | | | **30** |

Not in this budget:
- The other views of the six Thornwood faces: Warden Captain 04 back, 05 front, Grove Priest 01 front, Sapling Druid 03
  front, 08 back. Their turn moments fall back to the mirrored other view, as Elder Druid 08 does now. 5 generations.
- Distinct weapons for the five Ash Chieftain faces (fix 11). 10 generations.
- R29 and R30 extend the owner-kept Wolf Rider test. If stage B reads them as a new mount figure, move those two
  generations to bust re-rolls instead.

---

## 3. Portrait board (`stage-b/portraits/`)

**No candidate can be judged, because none exists.**
- The board holds only the owner-kept Warden bust. It passes: the leader framing, candle light, dark background, the
  Thornwood green on the mantle, tabard and crest.
- All 58 jobs are marked "not generated":
  - 12 creatures: two candidates each for the Fire Sprite, the Hornet Swarm, the Wolf and the Oakheart, and for the
    Giant's two faces;
  - 4 mounts;
  - 42 gods.
- Every call was refused with HTTP 402 from 09:13Z (`work/portraits/api-failures.json`).
- The images in `work/portraits/dryrun/review/` are stand-ins used to test the board:
  - a Salamander portrait sits in the Wolf slot, captioned PASS;
  - the Treant sits in the Oakheart slot;
  - a commander body sits in the Titan slot.
- They must never reach the owner's page. `work/portraits/review/` correctly shows "not generated".

**Before the run resumes, two risks are fixable in the prompts (fix 12):**
- the Thornwood colour words that the calibration showed paint grey;
- the gods' full-length bodies referenced only by a head-and-shoulders anchor.

**The run itself:**
- It is not a re-roll: 58 candidates plus the plan's 15% for re-rolls, about 70 generations.
- It needs its own budget once billing is restored.
- Wave 1 should still be one creature, one mount, one biped god and one beast god, judged before wave 2.

---

## 4. Smaller notes (no slot)

- **Battle a's Ash Rider block and battle c's sprites and hornets are flat procedural toys.** They sit beside painted
  troops (stage C, by the owner's order). The page should keep saying so in its notes.
- **Blood bursts are flat red discs.** At 72 px they read as paint blobs over painted figures (`shots/mont-strips1.png`,
  rows 1 to 3). They belong to stage D's painted effect sheets (E-series); record it there.
- **Ash Chieftain 03's back view shows a bright white fur cape.** The portrait's collar is grey-brown. It is a strong
  identity mark at play zoom, so keep it, but tone it 10% down in the R-pass for production.
- **The tier S and H looks of one figure differ in keyline and stencils.** With fix 3 the automatic camera never shows
  the switch. The player's zoom still does; that is accepted.
- **The variation:** neighbours differ and blocks look varied but calm at 28 and 72 px. No change.
