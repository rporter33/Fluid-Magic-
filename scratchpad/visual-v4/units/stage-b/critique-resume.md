# Stage B resume: the art director's critique and QA

2026-10-23, evening. This reviews the resumed stage B: the battle mockup after the resume integration
(`visual-v4/battle-mockup.html`, Painted, `allPainted` true) and the portrait board of creatures, mounts and gods (the
owner's first review of them). I edited nothing outside my own folder, made no generations and touched nothing in the
repo. Paths are relative to `scratchpad/visual-v4/units/` unless they start with `src/` (meaning `visual-v4/src/`).

**What I did** (everything is in `stage-b/critique-resume/`: `shots/`, `boards/`, `tools/`, `*.out`):
- Played all three battles on the automatic camera at 1x and 4x, 1920 × 1080: 112 shots, evenly across each battle plus its
  volley, clash, monster, breath, rout and death moments (`tools/play.js`, `shots/play-*`).
- Shot every commander at a man of 96 px through its battle (deploy, clash, rally or cast, strike, rout, fall, dead,
  cheer): 108 shots, set beside its card portrait in `boards/cmd-a.png`, `cmd-b.png`, `cmd-c.png`.
- Shot every troop block at 72 px at deploy and at the clash (53 shots, `shots/blk-*`), the hover cards of a block and a commander
  of each side (`shots/hov-*`), and motion strips of a march, a blow, a death and a rout at 1x and 4x (192 frames, `shots/s2-*`).
- Measured popping, sliding and fast moves over 10 s of each battle at 30 frames a second at 1x and 4x
  (`more2.out`, `jump.out`, `dash.out`), and the wound tint on painted figures (`wound.out`).
- Looked at all 60 portrait candidates at 512 px beside the approved leader, Salamander and Treant portraits
  (`boards/pt-q1.png` to `pt-q3.png`, `ref-leaders.png`), and the stage A rig maquettes (`boards/maq.png`).
- 0 page errors in every run.

---

## Verdict

**The battles now read as painted on both sides, and every commander is its own face. The portrait board is in the
leaders' family, but three god bodies contradict the rigs their figures will stand on, and the owner's review page still
says nothing was painted.**

| Owner's word | State now |
|---|---|
| Painted art makes it stand out | **Yes, both sides.** Thornwood blocks read as painted, hooded green troops at play zoom, as Cinder did this morning (`boards/b-0201-crop.png`, `c-0134-crop.png`). The loudest things left on the field are the stand-ins: the Thornwood Great Wyrm, the Treant, the Ash Riders, battle b's Wolf Riders, the sprites and hornets (stage C by the owner's order; fix 11 quiets them). |
| A figure matches its portrait (binding) | **Yes, 20 of 20 commanders by eye** (`boards/cmd-*.png`): helms, beards, hoods, crowns and mantles carry over in both views. Warden Captain 04's amber leaf mantle is faithful to his portrait, though it reads warm at play zoom. |
| Commanders unique | **Mostly.** The five Ash Chieftains differ in helm, horns, crown and fur (`boards/ac-compare.png`). **Warden Captains 05 and 07 are near twins from behind** (one back body, one leaf cloak; only 05's small flowers differ, `boards/b-wc-backs.png`), and that is the view battle b shows all battle (re-roll B5). |
| Card busts in one family | **Yes.** The ten troop busts share the leaders' candle, ground and hand (`boards/busts-family.png`). Two faults: the Thorn Militia and Longbow Hunter busts are the same green-hooded man (both cards sit side by side in battle b), and the Wolf Rider card is still the flat toy in battles b and c (fix 8). |
| Variation within troops | **Holds.** Neighbours differ; blocks are calm. **But the old red wound tint now tints painted figures:** 12 to 27% of living painted figures from mid-battle on, up to (255, 173, 173). It turns grey wolves pink and pulls Thornwood green toward brown (`boards/c-wolves-zoom.png`, `wound.png`; fix 3). |
| Sides readable at play zoom | **Yes** (integration: near/far 47/33, 53/55, 50/32%). Battle a's far Briar Guards are still near-black at 72 px; acceptable. |
| Motion: own timing, individuals stand out | **The troop motion holds:** 0 pops, 0 vanishings of living figures at 1x and 4x. **Commanders skate:** four commanders glide 164 to 331 wu in 0.4 s (409 to 827 wu/s, about 15 to 30 men a second) to meet their killers, in frame, because the camera now keeps commanders in view (fix 4). The white hit flash shows as a white cut-out at close zoom (fix 9). |
| Portraits, first owner review | **In family, and most subjects are good or strong.** Blocking: Primordial (all four read as a gentle sheep), Cinder Idol (a squatting stone man, while its body is the Monolith's slab), Elder Wyrm (sits up like a dog, while it uses the Salamander's low serpent rig). Weak: Fire Sprite B, Oakheart A, Ascended Hero B, Thornwood Monolith A, Hornet A (too saturated). Section 3 has each subject. |
| Owner page | **Stale and wrong.** `stage-b/review.html` (13:41) says the portraits "could not be painted", the six Thornwood leaders are "flat stand-ins", 66 of 128 faces. It must not go to the owner as is (fix 1). |

---

## 1. Fixes, most important first (12)

### 1. Rebuild the owner's review page from today's art before it is sent (`stage-b/review-build/build_review.py`, `content.py`)

**Problem.** The review page the owner will use to pick portraits was built at 13:41, during the outage:
- header and summary (`header()` l.34, `short()` l.51, `blocked()` l.71) tell the credit story;
- every portrait slot is text (`slot()` l.90: "Not painted yet"); the section probe says "Not painted: no credit"
  (`portraits()` l.120);
- section 3 still shows the six Thornwood leaders as "In the battles, not painted yet" (`commanders()` l.340-352);
- the stand-in list in `mockup()` (l.417) and the verdict text predate the resume.

**Change.**
1. `assets.py`: add `def candidate(nation, unit, face, cand, px=256)` that picks, for `<face><cand>`, the newest
   version not marked `replaced` in `work/portraits/ad-review.json` (`-r3` over `-r2` over the first) from
   `stage-b/portraits/<nation>/<unit>/<name>-512.webp`, and returns `(durl, verdict, card64_durl)` (the `-64.webp`
   is the god's card crop).
2. `build_review.py` `slot()`: render `img(candidate(...)[0], f"Candidate {letter}", 256, 256)` with the 64 px card
   beside it; for a subject with `both: True` render the Cinder candidate and its Thornwood edit side by side under one
   letter ("one pick covers both palettes").
3. `subject()`: drop `disabled=('A','B') if same`; keep `A`, `B`, `Redo`. A candidate that is in section 2's re-roll
   list shows "being repainted" and its button disabled until the re-roll lands and is judged.
4. `portraits()`: probe `Painted: pick one per subject`; replace the lead (l.121-130) with: two paintings per subject in
   the leaders' template; gods painted whole in their default parts with the card crop beside them; pick A or B, or Redo
   with a note; nothing becomes a figure before you approve its portrait.
5. `header()`, `short()`: state today's facts (20 of 20 battle commanders painted, ten troop busts painted, 60 portrait
   candidates for 24 subjects, the re-rolls pending); delete `blocked()` and its call in `main()`.
6. `commanders()`: delete the `k-missing` article (l.340-353); the Thornwood leaders render as the other kinds do;
   recount the painted faces from `work/cmdB/summary.json` and `work/cmdA/summary.json`.
7. `mockup()` l.417: the stand-ins are the Ash Riders, battle b's Wolf Riders (until fix 5), the Fire Sprites, the
   hornets, the Treant and the Great Wyrm; add one line that the Great Wyrm in battle a will be painted from the portrait
   the owner picks here.
8. Never embed anything from `work/portraits/dryrun/` or `work/portraits/refs/` (the stand-ins and clay maquettes).

**Check.** `grep -c "no credit\|Not painted\|could not be painted\|not painted yet" stage-b/review.html` is 0; all 60
candidates embedded (24 subjects; the six generic gods in both palettes); page shots at 1440 and 390 px wide read with no
sideways scroll; the page stays under its 12 MB limit (use the 256 px game files, not the 512 masters, if needed).

### 2. Three god bodies contradict the rigs their figures will use: correct the prompts, then re-roll P1 to P8 (`stage-b/work/portraits/tools/pt_prompts.py`)

**Problem.** Stage C paints each god standing on its battle rig (pretender design l.1436: "Primordial 5 (body, head,
jaw, two leg shapes)", "Elder Wyrm … the same on the serpent rig", "Cinder Idol 2 (slab, core)"; the maquettes in
`boards/maq.png`). The approved portrait must be paintable on that rig, or stage C repeats the Salamander mismatch the
owner complained about.
- **Cinder Idol** (both candidates): a squatting stone man with stub arms on a plinth (`boards/pt-q1.png`). The prompt
  itself asks for "a seated, featureless giant with a broad chest" (l.476), and the correct slab maquette was dropped
  (`NO_MAQUETTE`, l.601). A and B are near copies.
- **Elder Wyrm** (both): an upright dragon sitting on its haunches, chest high, head high (`boards/pt-q2.png`). The
  pose line asks for "its neck raised and its head held high" (l.537-538). The serpent rig is long and low, like the
  Salamander's.
- **Primordial** (all four): the ram horns plus "head lifted high" give a docile sheep's face; the club tail does not
  read. The quadruped maquette carries its head low and forward.

**Change** (then `python3 pt_prompts.py` to rewrite `prompts/*.txt` and `jobs.json`):
1. `cinderIdol` (l.472-482):
   - silhouette words `'brazier face with its column of smoke, the squat body and the stepped plinth'` →
     `'tall upright slab with the brazier face carved into its upper front, and the stepped plinth'`;
   - Body sentence → `'Body: a tall, upright, roughly squared slab of grey granite (#7D7A75), about three times as tall
     as it is wide, with no arms, no legs and no carved body: a standing stone like the maquette, blackened with soot
     and crossed by cracks crusted with soot.'`;
   - Face sentence → `'Face: a brazier face: the upper third of the slab\'s front is carved into one broad, stern, flat
     face whose eye-holes and open mouth are dark hollows with dull coals glowing low inside the stone, and the top of
     the slab is hollowed into a brazier bowl holding a bed of dull red coals that send up a thin, short wisp of grey
     smoke that fades out well below the top edge of the image; no tall flames.'`;
   - l.601: `NO_MAQUETTE = ('ashPhoenix', 'worldTree')` (the slab maquette is Image 1 again).
2. `elderWyrm` (l.535-545): pose →
   `'crawling low like a giant lizard: its belly a hand\'s breadth above the ground, its short, powerful legs splayed out
   to the sides, its thick neck carried low and forward and its head held level a little above the ground, jaws closed;
   seen three-quarter front from a little above, the head and forelegs near the lower right of the square and the long
   body and longer tail running back in a shallow S toward the upper left, so the long, low figure fills the square'`;
   and in the Body sentence `'a long, heavy, low four-legged dragon'` → `'a long, heavy, low-slung four-legged dragon
   built like a giant salamander, about three times as long as it is tall'`.
3. `primordial` (l.414-425):
   - pose → `'standing four-square and heavy, its great head carried low and forward on a thick neck as a bison or an
     aurochs carries it, turned a little toward the right, the club tail raised a little behind the haunches'`;
   - Head → `'Head: the massive, low-slung skull of a primeval bull or bison, never a sheep or a goat: a heavy bony brow
     ridge, small deep-set furious dark eyes, a broad flat muzzle with wide nostrils, a deep jaw with a shaggy dark beard
     beneath it.'`;
   - Horns → `'Horns: a pair of huge, thick, ridged ram\'s horns that sweep back from the brow and curl forward around
     the sides of the skull, framing the heavy bull face.'`;
   - Tail → `'Tail: a short thick tail ending in a heavy bony club as large as its head, studded with blunt knobs and
     clearly visible behind the haunches.'`
4. Mirror the new descriptions in `review-build/content.py` (`cinderIdol`, `elderWyrm`, `primordial` entries).

**Check.** By eye beside its maquette: the Idol is a slab with a face, never a figure with limbs; the Elder Wyrm's
height is at most half its length; the Primordial's head is below its shoulder line and reads as a bull. The automatic
gates as before; for the Elder Wyrm a `framing: lowest` override in `ad-overrides.json` is acceptable if the tail tip
sits above 82%.

### 3. The red wound tint now tints painted figures: pink wolves, browned green cloaks (`src/60-render.js:636-638`)

**Problem.** `evalFigure` (l.1062-1065) encodes a wound as a red multiply `(1, 1 − 0.35w, 1 − 0.35w)`, a procedural-mode
cue. `paintSprite` multiplies it into the painted figure (l.638). Measured over each battle (`wound.out`):

| Battle | Share of living painted figures tinted, from mid-battle | Mean / max wound |
|---|---|---|
| a | 18 to 25% | w 0.5 (255, 210, 210) / 0.92 (255, 173, 173) |
| b | 14 to 27% | same |
| c | 12 to 27% | same |

Grey wolves turn rose (`boards/c-wolves-zoom.png`), Wardens' green goes brown, Cinder orange goes red
(`boards/wound.png`, before and after). It undoes the side-colour work on exactly the figures in the fight.

**Change.** Replace l.638 (keep l.636-637):

```js
else {
  // painted figures: a wound darkens the paint a little instead of the procedural red cast (critique-resume fix 3)
  const R = (st.tint >> 16) & 255, Gc = (st.tint >> 8) & 255;
  const w = R > 0 ? clamp((1 - Gc / R) / 0.35, 0, 1) : 0;
  const c = Math.round(255 * v.bright * (1 - 0.12 * w));
  sp.tint = (c << 16) | (c << 8) | c;
}
```

Procedural mode keeps its red wound tint.

**Check.** At every sample time, painted sprites with `R − G > 2` in their tint: 0. `checks()` (variation, side share,
dead hand-off) still pass at 1x and 4x.

### 4. Commanders skate to their killers: 409 to 827 wu/s in 0.4 s (`src/31-build.js:789-793`)

**Problem.** A commander or monster that joins a duel walks to its foe at 160 wu/s, but never more slowly than the time
left before the blow, with a 0.4 s floor (`arrive = Math.max(0.4, Math.min(it.t - 0.3 - t0, dist / 160))`). When the
blow comes early in the phase, the 0.4 s floor wins (`dash.out`, `jump.out`):

| Battle | Commander | Distance | Speed |
|---|---|---|---|
| a | Elder Druid 08 | 171 wu | 427 wu/s |
| a | Warden Captain 04 | 164 wu | 409 wu/s |
| b | Ember Adept 02 (from the wall walk) | 331 wu | 827 wu/s |
| b | Pyre Priest 06 | 305 wu | 762 wu/s |

The march cadence tops out at 5 steps a second, so they glide up to 160 wu a step in their march and stand frames,
in view (fix 7 of the morning keeps commanders framed), seconds before they die.

**Change.** Let a mover set off earlier instead of faster. Replace l.789-793:

```js
const cur0 = pathAt(G.path, t0, { x: 0, y: 0, h: 0 });
const dist = Math.hypot(cur0.x - x, cur0.y - y);
// at most 200 wu/s, a hard run (critique-resume fix 4): when the blow comes too soon, set off earlier, but never
// before the mover's previous move ends, its last shot or blow ends, or 3 s before the phase
const figs = G.figs.map((fi) => T.F[fi]);
const busy = Math.max(-1e9, ...figs.flatMap((f) => [...f.shots.map((s) => s.tRel + 0.4), ...f.strikes.map((s) => s.t + s.strike + s.rec)]).filter((v) => v <= t0));
const start = Math.min(t0, Math.max(G.path[G.path.length - 1].t1, busy, t0 - 3, it.t - 0.3 - dist / 200));
const arrive = Math.max(0.4, Math.min(it.t - 0.3 - start, dist / 160));
pathMove(G.path, start, Math.max(0.3, arrive), x, y, h, 'smooth');
```

The block reform dashes (366, 318, 306 wu/s, `dash.out`) stay the owner's question from this morning.

**Check.** `tools/dash.js`: no commander segment above 220 wu/s; `checks()`: figures and cards match the record at
every phase end at 1x and 4x, determinism and rerun hold; `critique/tools/cmdvis.js`: each commander under the card bar
at most 5% of its alive time, as now.

### 5. Wolf Riders: paint the planned back view by a new route, so battle b's riders stop being toys (`stage-b/work/troops2/`, `stage-b/integrate/bundle.py:244-261`)

**Problem.** Battle b's near-side Wolf Riders are the procedural toys (bright hoods on black discs) through the charge
the ticker names ("Wolf Riders charge the Cinder Warriors", `boards/blk-b1.png`). Both Pro rolls of the back view
(R29, R30) came back as eye-level side views, 0 of 16 cells; a third Pro roll of the same prompt will likely fail the
same way.

**Change.**
1. New job `t2r31.wolfRider.back` in `work/troops2/jobs/r31.json`: model `gemini-nano-banana-2.1`, route paint-over
   (the route that gave cmdB its passing back bodies): Image 1 `work/troops2/guides/wolfRider.back.blue.png` (the clay
   guide on the blue key, painted over in place), Image 2 `pilot/raw/ad/wr.front.blue.g3pro.png` (the kept front sheet:
   identity, kit, colours and size only). Prompt: the r30 text with its first paragraph replaced by "Image 1 is the grid
   of grey clay figures to paint over: keep every figure exactly where it is, at exactly its size, pose, facing and
   camera, and paint each one as the rider and wolf of Image 2 seen from behind; no clay may remain", and "pine green"
   replaced by the bottle-green wording of calibration decision 2 (#1F6A50). Run with `t2run.py`, gate as R29.
2. `bundle.py` l.244-261: pack the back view the same way as the front (hue lock into
   `fix/work/wolfRider.back.locked`, `calpack.frames_of(..., 'back', t)`), add `'back': dict(status=..., frames=[...])`
   to `looks['wolfRider']['views']` and drop "no back view" from its note, so `lookOf` paints battle b's group.

**Check.** ≥ 14/16 cells, the facing check by eye at 4×, hue-locked share as the front; battle b `checks().paint`
shows the Wolf Riders painted; battle c's routers now flee in the back view.

### 6. Weak portrait candidates: correct their wording and re-roll P9 to P13 (`pt_prompts.py`, `pt_run.py`)

**Problem** (`boards/pt-q1.png`, `pt-q2.png`, `pt-q3.png`):
- **Fire Sprite 01b**: a grinning cartoon sun; the design text asks for "a thin, wide, dark grin … a sly look" (l.119-127).
- **Oakheart 01a**: the grain forms a nose, moustache and beard: a man in a wooden mask, close to the approved Treant
  face, not "a warrior made of oak".
- **Ascended Hero 01b**: the sword is held out at an angle; the pose and the mark ask for it upright (l.403).
- **Living Monolith Thornwood 01a**: olive-grey glyphs, window 0.007 (gate 0.01); its 01b sister edit is green.

**Change.**
1. Fire Sprite 01b `var`: replace `'narrow slanted dark eye-slits and a thin, wide, dark grin, set in the brighter core'`
   with `'two narrow dark eye-slits and a mouth that is only a ragged dark gap in the flame, open as if roaring; no
   grin, no smile, no teeth, no nose, set in the brighter core'`, `'A sly, flickering, mindless look.'` with `'A wild,
   roaring, mindless look.'`, the mark `'thin dark grin'` with `'ragged roaring mouth'`; mirror in `content.py`.
2. Oakheart 01a `var`: after `'a jaw of rough brown bark;'` insert `'no nose, no beard, no moustache and no lips: below
   the knotholes the wood is one smooth, heavy, split block like a war mask of grown bark;'`.
3. Ascended Hero 01b (r3): its r2 prompt plus `Corrections from the previous attempt, which must be fixed: the straight
   sword must be held upright before the chest in the right hand, point up, the blade vertical, not held out to the
   side.`; then the Thornwood edit of the new body (`EDIT`, as wave 3).
4. Living Monolith Thornwood 01a (r3): the `EDIT` prompt on `livingMonolith-cinderHorde.01a` r2 with `{zone2}` =
   `'the pigment in the carved glyphs, every glyph filled edge to edge'`.
5. The run needs its own key and cap: `pt_run.py` l.13-14 →
   `CAP = int(os.environ.get('PT_CAP', 80))` and `KEY = os.environ.get('PT_KEY', 'B portraits:')`, and in `used()`
   (l.22) `n, live = 0, KEY != 'B portraits:'` so a new key counts from its first call. Write the r3 prompts to
   `prompts/<job>.r3.txt` and the jobs to `jobs-r3.json` (out `….r3.nb21.png`); run `PT_KEY='B <key>:' PT_CAP=<cap>
   python3 pt_run.py JOB … --jobs jobs-r3.json --tag r3`, then `pt_post.py JOB --raw RAW --tag r3`, add the verdicts to
   `ad-review.json`, and rebuild the boards with `pt_board.py`.

**Check.** Eye and gates as wave 2; each subject then has two candidates the owner can choose between.

### 7. Hornet Swarm 01a r2: grade its face plate instead of re-rolling (`pt_post.py`, no generation)

**Problem.** The best hornet of the four fails only `muted` (0.038 > 0.02): its ochre face plate is more saturated
than the family. It is a second attempt; a third roll could lose the hard-shelled insect.

**Change.** In `post()` after `im = Image.open(raw).convert('RGB')` (l.76), apply a per-job grade from a new
`work/portraits/ad-grade.json` (`{"hornetSwarm.01a.r2": {"hueDeg": [30, 70], "satScale": 0.65}}`): convert to HSV,
multiply S by `satScale` where H lies in the window, convert back; record the grade in the sidecar under `grade`. Re-run
`pt_post.py hornetSwarm.01a --raw raw/portraits/hornetSwarm.01a.r2.nb21.png --tag r2`.

**Check.** `muted` ≤ 0.02, `read48` still ≥ 12; by eye the plate is dull ochre, not yellow.

### 8. Card busts: paint the Wolf Rider's, and part the Thorn Militia from the Longbow Hunter (`bundle.py:337-353`, troops2 bust jobs)

**Problem.** The Wolf Rider card is the flat procedural crop in battles b and c (`boards/cardbars.png`): the only
painted unit on the field without a painted card. The Thorn Militia and Longbow Hunter busts are the same green-hooded
man (`boards/busts-family.png`), side by side in battle b's bar.

**Change.**
1. B3: a Wolf Rider bust in the `b1` family (`work/troops2/jobs/busts.json` pattern): anchor + Thornwood portrait + a
   kit card made from the kept front sheet's stand frame; the rider in his bottle-green hood with the grey wolf's head
   and ruff at his shoulder, so the card reads as a mounted unit. This is a card for the kept test figure, not a new
   figure. Output `stage-b/portraits/thornwood/wolfRider/bust.*` through the troops2 post step.
2. B4: Thorn Militia bust re-roll with its own kit: a bark cap or bare head with the hood down on the shoulders, a
   spear shaft at the shoulder, the bottle-green tabard; "not hooded, not an archer".
3. `bundle.py` l.337: `for unit in sorted(set(figs) | {'wolfRider'}):` and in the `else:` branch
   `if unit not in figs: continue` (no figure crop for the mounted look; it keeps the procedural card until its bust
   passes).

**Check.** Battle b and c card bars show painted busts for every painted unit; the Thorn Militia and Longbow Hunter
cards tell apart at 64 px.

### 9. The white hit flash is a white cut-out at close zoom (`src/60-render.js:619`)

**Problem.** A wound shows the `recoil.white` frame for 0.05 s: a solid white silhouette. At play zoom it is a useful
spark; at tier H (the player's zoom) it reads as a hole cut in a painted figure (`boards/s2-a.png`, strike row frame 8
and death row frame 7; `blk-a1.png`).

**Change.** After l.619 (`const pp = paintPose(...)`) add:

```js
if (P.tier === 'H' && pp.pose === PP['recoil.white']) pp.pose = PP.recoil; // close zoom: the painted flinch, no cut-out
```

**Check.** At 72 px no white silhouette in a strike strip; at play zoom the flash is unchanged.

### 10. Warden Captains 05 and 07 are twins from behind: re-dress 07's back (B5, cmdB tools)

**Problem.** Both near-side Warden Captains of battle b use one back body with one leaf cloak (`boards/frames-tw.png`
rows 3 and 4; `b-wc-backs.png`); only 05's small flowers part them, and battle b shows their backs all battle. Both
backs are also the reported stand-ins (13/16, 12/16: fall and dead cells).

**Change.** B5: `python3 work/cmdB/sbx/tools/cmdb.py redress back wc07` with the kit line changed to his portrait's
marks seen from behind: "no cloak: the bark-scale cuirass and its overlapping back plates show, a short collar of dark
fern fronds over the shoulders, the antlered bark helm"; then `cmdb_pack.py` and `integrate/bundle.py`.

**Check.** ≥ 14/16 cells; at 96 px from behind 05 and 07 tell apart without the flowers; face-match check 20/20.

### 11. Quiet the stand-ins in Painted mode (`src/60-render.js:178`, `:540`)

**Problem.** Beside painted troops the procedural Great Wyrm (saturated cartoon green), the Treant (a trunk with a
cartoon face) and the Ash Rider and battle b Wolf Rider toys are the loudest things on the field (`boards/m-a1-1.png`,
`blk-b1.png`), and they contradict their own portraits (the approved Treant; the Great Wyrm candidates' bronze body).
They wait for stage C by the owner's order; until then they should not lead the eye.

**Change** (Painted mode only; Procedural unchanged):
1. After l.178 (`const body = painted ? … : makeBigBody(...)`):

   ```js
   if (this.paintMode && !painted) { const cm = new PIXI.ColorMatrixFilter(); cm.saturate(-0.4, false); cm.brightness(0.88, true); body.root.filters = [cm]; }
   ```
2. l.540: `sp.tint = this.paintMode ? mix(st.tint, 0x9a9184, 0.18) : st.tint; sp.alpha = st.alpha;`

**Check.** Shots of battles a and b at the clash: the stand-ins sit in the painted world's value range; frame times
unchanged within noise (two filters per battle at most).

### 12. Two spell strokes read as planks at painted zoom (`src/60-render.js:856-857`, `:868`)

**Problem.** The `crack` spell draws a straight 3 wu dark-brown bar from caster to target, which at 96 px is a 10 px
plank across the Sapling Druid and Grove Priest (`boards/b-cast-bar.png`); `column` is a flat 16 wu yellow rectangle
(`boards/s2-a.png`, march 4x). Magic is stage D's, but these two read as broken now.

**Change.**
- l.856-857:

  ```js
  } else if (kind === 'crack') {
    const X1 = lerp(CX, h.X, k), Y1 = lerp(CY + 18, h.Y, k);
    g.moveTo(CX, CY + 18);
    for (let j = 1; j <= 7; j++) { const q = j / 7, w = j < 7 ? (u01('crack/' + fx.caster + '/' + j) - 0.5) * 10 : 0; g.lineTo(lerp(CX, X1, q) + w, lerp(CY + 18, Y1, q) + w * 0.5); }
    g.stroke({ width: 1.4, color: 0x2a1e12, alpha: 0.6 });
  ```
- l.868 `column`: draw it in the additive layer as three stacked soft rects of widths 16, 9, 4 at alphas 0.12, 0.18,
  0.3 × (1 − k), instead of one 0.35 rect.

**Check.** At 96 px the crack reads as a thin split in the ground, the column as a soft shaft of light.

---

## 2. Re-rolls needed: 22 generations (cap 30)

Rules: each job is logged through `tools/gen.py` with stage B and the run's own key; at most 2 in flight; HTTP 402
stops the run at once. Each job gets one re-roll at most; a second failure is reported, not rolled again. P-jobs use
the portrait tools after fixes 2 and 6; the r3 tag marks a corrected design, not a third roll of the same prompt.

| # | Job | Model | Image 1 / Image 2 | Why | Gate | Gens |
|---|---|---|---|---|---|---|
| P1 | `primordial-cinderHorde.01a` r3 | nb21 | `refs/gods-framed/primordial.png` / anchor | sheep head, head high (fix 2) | god gates; bull head below the shoulder line by eye | 1 |
| P2 | `primordial-cinderHorde.01b` r3 | nb21 | same | same | same | 1 |
| P3 | `primordial-thornwood.01a` r3 | nb21 | P1 (EDIT) | Thornwood palette of P1 | lock ≥ 0.10, window ≥ 0.01 | 1 |
| P4 | `primordial-thornwood.01b` r3 | nb21 | P2 (EDIT) | Thornwood palette of P2 | same | 1 |
| P5 | `cinderIdol-cinderHorde.01a` r3 | nb21 | `refs/gods-framed/cinderIdol.png` (restored) / anchor | a squatting figure; the body is a slab (fix 2) | god gates; slab with a face, no limbs, by eye | 1 |
| P6 | `cinderIdol-cinderHorde.01b` r3 | nb21 | same | same; A and B were near copies | same | 1 |
| P7 | `elderWyrm-thornwood.01a` r3 | nb21 | anchor | sits up like a dog; the rig is the low serpent (fix 2) | god gates (framing override allowed); height ≤ half the length | 1 |
| P8 | `elderWyrm-thornwood.01b` r3 | nb21 | anchor | same | same | 1 |
| P9 | `fireSprite.01b` r3 | nb21 | anchor | cartoon grin from its own wording (fix 6) | bust gates; no grin by eye | 1 |
| P10 | `oakheart.01a` r3 | nb21 | anchor | man in a wooden mask with a beard (fix 6) | bust gates; lock ≥ 0.10; no nose or beard | 1 |
| P11 | `livingMonolith-thornwood.01a` r3 | nb21 | `livingMonolith-cinderHorde.01a` r2 (EDIT) | olive glyphs, window 0.007 (fix 6) | window ≥ 0.01 | 1 |
| P12 | `ascendedHero-cinderHorde.01b` r3 | nb21 | `refs/gods-framed/ascendedHero.png` / anchor | sword at an angle (fix 6) | god gates; sword upright | 1 |
| P13 | `ascendedHero-thornwood.01b` r3 | nb21 | P12 (EDIT) | Thornwood palette of P12 | lock as before | 1 |
| P14-P16 | reserve: one re-roll each for any of P1, P2, P5 to P8 that fails | nb21 | as the failed job | these three subjects block stage C | as the job | 3 |
| B1 | `t2r31.wolfRider.back` (fix 5) | nb21 | blue clay guide (paint over) / kept front sheet | battle b's Wolf Riders are toys; Pro failed twice | ≥ 14/16 cells, facing, hue lock | 1 |
| B2 | reserve: B1's one re-roll | nb21 | as B1 | — | same | 1 |
| B3 | Wolf Rider card bust (fix 8) | nb21 | anchor / Thornwood portrait / kit card | toy card in b and c | bust gates (background, top 9%, read48, side cloth) | 1 |
| B4 | Thorn Militia card bust (fix 8) | nb21 | anchor / Thornwood portrait / kit card | same man as the Longbow Hunter | bust gates; not hooded | 1 |
| B5 | Warden Captain 07 back re-dress (fix 10) | nb21 | twChief back body / portrait 07 | twin of 05 from behind | ≥ 14/16; marks at 4×; hue-locked share | 1 |
| B6 | reserve: one re-roll for B3 to B5 | nb21 | as failed | — | as the job | 1 |
| | **Total** | | | | | **22** |

Not re-rolled, by choice:
- **Titan** (both palettes, both candidates) and **Ascended Hero A**: well painted, but both read as mortal knights in
  armour, not gods; variant 0 fixes their parts. Ask the owner whether a god may carry a mark of godhood (scale, a
  nimbus, ageless marble skin) before spending on them.
- **Giant face 02** A and B, **Ash Horse** A and B, the god pairs: near copies by design ("two paintings of one
  description"); the page says so.
- The other stand-in battle views (Warden Captain 04 and 05 backs, Sapling Druid 03 both views, Ash Chieftain 05 back,
  Berserker back, Ember Skirmisher back, Longbow Hunter both views, Thorn Militia front): their failing cells are falls,
  dead poses and follow-throughs that read correctly by eye at 72 and 96 px (`boards/frames-tw.png`, `blk-*`). Keep.

---

## 3. The portrait board, subject by subject

Family: every candidate is in the leaders' template: dark warm ground, candle key from the upper left, warm rim, loose
oil hand (`boards/ref-leaders.png` beside `work/portraits/review/contact-*.png`). Gods are whole figures with their card
crops; the crops are well placed. No candidate names or copies anything outside the game.

| Subject | A | B | Judgement |
|---|---|---|---|
| Fire Sprite | **strong**: flame face, hollow eyes, gasp, smoke | **weak**: a grinning cartoon sun, from its own wording | re-roll B (P9) |
| Hornet Swarm | **good** (r2): hard-shelled hornet; ochre too saturated (muted 0.038) | **strong** | grade A (fix 7) |
| Wolf | **strong** | **strong**, scarred | pass |
| Giant face 01 | **good** | **good**, the scowling alternative | pass |
| Giant face 02 | **good** | near copy of A | pass (one look); both read as a huge man more than a giant |
| Oakheart | **weak**: nose and beard in the grain, Treant-like | **good**, a little skull-like (undead risk) | re-roll A (P10) |
| Ash Horse | **strong** | **strong**, near copy of A | pass; the coat is dark dappled charcoal rather than "ash-grey" |
| War Wolf | **strong**, matches the kept Wolf Rider | **strong**, darker | pass |
| Oracle (C/T) | **good** | **good** | pass; at 64 px close to the Ember Hierophant (both hooded with orb staffs); the gold mask parts them |
| Titan (C/T) | **good** painting, a mortal knight | same | owner question (section 2) |
| Great Wyrm (C/T) | **strong** | **strong** | pass; battle a's procedural Wyrm will be repainted from the pick (stage C) |
| Living Monolith | C **good**; T **fail** (olive glyphs) | C **good**; T **good** | re-edit T 01a (P11); the glyphs look like a real runic alphabet, acceptable |
| Ascended Hero (C/T) | **good**, mortal-looking | **weak**: sword at an angle | re-roll B (P12, P13) |
| Primordial (C/T) | **weak**: a gentle ram | **weak**: same | re-roll all four (P1 to P4) |
| Ash Colossus | **good**, bowl head a little comic | **strong** | pass |
| Ash Phoenix | **strong** | **strong** | pass |
| Pyre Lord | **strong** (no ash stripes) | **good** | pass |
| Cinder Idol | **fails the rig**: a squatting stone man | same, near copy | re-roll both (P5, P6) |
| Ember Hierophant | **strong** | **strong** | pass |
| Wild Spirit | **strong** | **strong** | pass |
| World Tree | **weak-good**: a plain round oak, clean-digital | **good**, gnarled | pass; prefer B |
| Horned Hunter | **strong** | **good** | pass |
| Elder Wyrm | **fails the rig**: sits upright | same | re-roll both (P7, P8) |
| Mother of Beasts | **good**, human-sized | **good** | pass |

Summary: of 24 subjects (the six generic gods counted once for both palettes), 16 are ready for the owner as they
stand, 3 fail their rigs (Primordial, Cinder Idol, Elder Wyrm) and 5 have one weak or failing candidate (Fire Sprite B,
Hornet A, Oakheart A, Ascended Hero B, Thornwood Living Monolith A).

---

## 4. Smaller notes (no slot)

- **Battles a and c keep the reform dashes** (blocks at 366 wu/s in a, 318 and 306 wu/s in c, for 0.6 to 0.7 s). Raise them with the
  owner with this morning's question.
- **Popping:** 0 living figures appear or vanish between frames in 300 frames from just before each clash, at 1x (10 s) and 4x (40 s of story) (`more2.out`).
  Dead hand-offs: 0 mismatches (integration).
- **Commander names repeat across battles with different faces** (Ardun is Ash Chieftain 02 in a and 06 in c; Ishka is
  three different faces), and some read female against male portraits (Fenna, Linnet). Content, not art: the names come
  from the battle data; tell the owner if he asks.
- **The general's banner pole crosses the back-view generals** (it stands "behind his back shoulder", toward the
  camera). It reads as a standard bearer's pole; keep.
- **Warden Captain 04's amber mantle** is faithful to his portrait but reads warm at play zoom; the teal ring and green
  banner carry his side. Keep.
- **Blood bursts are still flat red discs** at close zoom; stage D's effect sheets.
- **Frame times and size:** I did not re-measure (the machine is shared); the integration's numbers stand. The fixes
  above add two filters per battle (fix 11) and no textures.
