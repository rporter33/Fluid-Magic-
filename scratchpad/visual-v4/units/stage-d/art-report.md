# Stage D, the rest: art report (action cutouts, effect sheets, atlases)

2026-10-25. Everything here is in the scratchpad (`S/visual-v4/units/`, paths below are relative to it unless they
start with `S/`). Nothing was committed. The battle mockup and the map files were not touched (the Radiance glyph
shape was only read from the map icons). The Ash Rider fix is packed but not re-bundled into the mockup.

**Read first:** the generation credits ran out. The API returned HTTP 402 ("prepaid credits depleted") on call 135.
Every planned image was made before that happened. Re-rolls after that point could not run, so the remaining flaws are
listed in section 7 with a fallback in code. `stage-d/prod/STOP` holds the 402 message, and `dd_gen.py` refuses to run
while that file exists.

## 1. What was made

**Action cutouts:** 26 painted figures, both views. Of the 270 planned frames, 260 painted frames ship and 10 were held
back (section 3). On top of those, 6 Thornwood god palettes were made as colour edits of the Cinder frames (zero
generations, 60 frames). That makes 32 figures in the atlas.

Each image was generated with three things: the exact-camera clay maquette of the action as Image 1, the approved
stage C idle cutout on its key colour as Image 2, and the cell scales. "2K" means `imageSize` 2K, which `gen.py --size`
now passes (see section 8).

| Subject | Views | Painted actions per view | Layout | Notes |
|---|---|---|---|---|
| Salamander 01, 03, 04 | back, front | breath, tailLash, hit, dead | 2×2, 2K | |
| Salamander 02 (last priority) | back, front | the same | 2×2, 2K | the front tail lash was cleaned (zero generations) |
| Treant 01–03 | back, front | windup, slam, hit, dead | 2×2, 2K | |
| Treant 04 (last priority) | back, front | the same | 2×2, 2K | the back slam's top fades out (it was cut off) |
| Giant 01, 02 | back, front | stepA, stepB, windup, strike / hit, dead, follow, fall | two 2×2, 2K | 3 frames held back |
| Titan (Cinder; Thornwood = tint) | back, front | stepA, stepB, windup, strike / hit, dead, follow, fall | two 2×2, 2K | 4 sword tips fade out |
| Pyre Lord | back, front | stepA…strike / hit, dead, call, fall | two 2×2, 2K | back B is re-roll r3 |
| Horned Hunter | back, front | stepA…strike / hit, dead, call, fall | two 2×2, 2K | front windup held back |
| Mother of Beasts | back, front | stepA…strike / hit, dead, follow, fall | two 2×2, 2K | front windup held back |
| Ascended Hero (Cinder; Thornwood = tint) | back, front | stepA…strike / hit, dead, follow, fall | two 2×2, 1K | front windup held back |
| Oracle (Cinder; Thornwood = tint) | back, front | stepA…strike / hit, dead, castA, castB | two 2×2, 1K | front castA held back |
| Ember Hierophant | back, front | stepA…strike / hit, dead, castA, castB | two 2×2, 1K | front windup and castA held back |
| Wild Spirit | back, front | leap, rake, hit, dissolving | 2×2, 1K | |
| Ash Phoenix | back, front | glide, wingsUp, wingsDown, rake / hit, dive, burnOutA, burnOutB | two 2×2, 1K | |
| Ash Colossus | back, front | stepA, stepB, windup, strike, dead | singles, 1K | hit is code |
| Great Wyrm (Cinder; Thornwood = tint) | back, front | breath, flight, dead | singles, 2K | hit is code |
| Primordial (Cinder; Thornwood = tint) | back, front | bite, trample, dead | singles, 2K | bite r2 and both tramples r2 |
| Elder Wyrm | back, front | bite, trample (back also dead) | singles, 2K | front dead held back; see section 7 |
| World Tree | back, front | windup, slam, dead | singles, 2K | back windup is r2 |
| Living Monolith (last priority; Thornwood = tint) | back, front | shattered | single, 2K | hit and pulse are code |
| Cinder Idol (last priority) | back, front | shattered | single, 2K | hit and pulse are code |

**Effect sheets (art plan 7.2)**: two candidates each, then a pick. The new atlas `atlas/fx2` sits beside the pilot's
`atlas/fx`, which is unchanged and shares no frame names.

| Sheet | Pick | Why | Frames |
|---|---|---|---|
| E1 flame tongues | a (nb21) | three clean painted loops; b left the grey guide placeholders under its flames | tongueS1–8, tongueM1–8, tongueL1–8 (add) |
| E7 fire breath core | b (g3pro) | a white-gold jet that sits inside the billows; a was a whole stream of its own, too wide for a core | breathCore1–4 (add) |
| E7 fire breath billows | r2 (g3pro re-roll from b) | rounded puffs that stay inside their cells; a copied the guide's hard wedge, b painted its flat far end and touched the sheet edge | breathBillow1–4 (normal) |
| L5 bark plating | a (nb21) | even ridged bark that tiles (seam step 4.66 against 4.10 inside); b has one pale ridge that repeats visibly | fx2-bark-512/256 tile (repeat) |
| L6 loam breath gale | b (g3pro) | large readable burrs, seed pods and torn leaves; a's debris is too small at play zoom | gale1–4, seed1–4, tornLeaf1–3, sporeClump1–3 (normal) |
| L6 loam breath spores | a (nb21) | the haze grows from the jaws and lines up with the gale | sporeHaze1–4, sporePuff1–5 (luma) |
| H1 holy light | a (nb21) | all four elements fill their boxes; b's halo ring is a third too small | lightColumn, sunDisc, softRays, haloRing (add) |
| Sun mana ring and glyph (G1s) | a (nb21) | a filled sun disc with eight rays (the game's Radiance symbol) that reads at 20 px; b's outline thins away | glyphRingW, glyphW (add), beside the pilot's G1f/G1l |
| U1 umbra | a (nb21) | painterly ink and smoke in the decals' hand; b is smoother and tinted violet | rippleRing, tendrilsIn, drip1–4, rippleBand, drainThread, drainThread2 (multiply) |
| V1 veins | a (nb21) | soft glowing veins; b is crisp white branching that reads as trees | veins1–8, veinStrip1–2 (add) |

Code fixes on the fx (zero generations):
- L6g: mauve debris was moved to the pilot's dry ochre.
- E7b: violet smoke was desaturated.
- Stream ends fade over the last 8%.
- H1: the lightColumn foot met the sheet edge, so its lowest 8% fades out.
- L5: the tile was made seamless.

**Ash Rider front scale (stage C carry-over item 1):** zero generations. The scale is now pinned to the body measure,
hood to hooves (126 px), instead of the pennon top (147 px). The ashRider family was re-packed with the lance-fix
frames. Front scale changes: tier S 0.5374 → 0.627, tier H 1.0816 → 1.2619. Back is unchanged. The stand frames are
now back 51×93 and front 58×109 at tier S. Files are in `stage-c/atlas/creatures/` (ashRider-S/H, figures/ashRider.json,
index.json, pack-summary.json), with backups in `stage-d/prod/ashrider/pre/` and the record in
`stage-d/prod/ashrider/record.json`. Not re-bundled.

## 2. Generations

This part made 135 calls through `tools/gen.py --stage D`, all with a `--purpose` starting "D rest:":
- 125 succeeded: 104 action images and 21 effect sheets.
- 10 failed: 9 upstream HTTP 502 timeouts (about 30 s each; 7 of them were retried successfully) and the final HTTP 402.
- Models: 11 gemini-3-pro-image (fresh fx sheets) and 124 gemini-nano-banana-2.1 (action edits and fx candidates).
- About 762k tokens.
- The stage D total is now about 164 of 210 (pilot 29 + 135). This part's cap was 165, so 30 calls went unused because
  the credits ran out. **The 16 calls reserved for later fix re-rolls cannot run until the credits are topped up.**

The plan was 88 main action images, 8 last-priority images (Salamander 02, Treant 04, Living Monolith, Cinder Idol) and
20 fx candidates, which is 116. The reserve was used for 9 re-rolls.

| Item | Calls | OK | Failed | Re-rolls (OK) and why |
|---|---|---|---|---|
| fx: E1, E7c, L5, L6g, L6s, H1, G1s, U1, V1 | 2 each (18) | 18 | 0 | — |
| fx: E7b | 3 | 3 | 0 | r2: b painted the guide's flat far end and two frames met the sheet edge |
| Salamander 01, 03, 04 | 2 each | 6 | 0 | — |
| Salamander 02 | 3 | 2 | 1 (502) | — |
| Treant 01–04 | 2 each | 8 | 0 | — |
| Giant 01 | 5 | 5 | 0 | front A: the first try (kept as `…front.A.nb21.2k.calib.png`) copied the idle's pose; the prompt gained stronger strides and strikes plus a sentence forbidding copying Image 2's pose, then front A was re-generated |
| Giant 02 | 5 | 4 | 1 (502) | — |
| Titan, Ascended Hero, Oracle, Mother of Beasts, Horned Hunter | 4 each | 20 | 0 | — |
| Pyre Lord | 6 | 6 | 0 | back B r2: the ember mantle was painted as a flat board in the struck and sweep cells; r3: r2 fixed the cape but turned him to face the camera in hit and fall (a back view must face away); r3 accepted |
| Ember Hierophant | 5 | 4 | 1 (502) | — |
| Wild Spirit | 2 | 2 | 0 | — |
| Ash Phoenix | 4 | 4 | 0 | — |
| Ash Colossus | 11 | 10 | 1 (502) | — |
| Great Wyrm | 6 | 6 | 0 | — |
| Primordial | 9 | 9 | 0 | back trample r2 (it stood with one foreleg raised); back bite r2 (the head stayed up as in the idle); front trample r2 (the rear was weak); all three accepted |
| Elder Wyrm | 12 | 7 | 5 | back bite r2 (it reared like the trample; r2 kept the idle stance, so the first is kept); front dead r2 (502); front trample r2 (502, then 402) |
| World Tree | 8 | 7 | 1 (502) | back windup r2 (it kept the standing pose); accepted |
| Living Monolith, Cinder Idol | 2 each | 4 | 0 | — |

All prompts name no franchise, game, studio or artist, and none uses the owner's screenshots. The prompts are in
`stage-d/prod/prompts/`, and every raw has a `.json` sidecar (model, size, sha256, refs, purpose).

## 3. Code-only and held back

Code-only, by design (art plan 5.3 and 6, where a transform truly reads the same):
- **hit** on the size 5–6 bodies (Great Wyrm, Primordial, Elder Wyrm, World Tree, Ash Colossus): the idle tilted 6
  degrees away from the blow, the one-frame white flash (`<fig>.<view>.idle.white`), and a mesh flinch.
- **Living Monolith and Cinder Idol hit and pulse:** the idle plus cracks or the glyph emissive mask driven by the
  ability. No painted frame.
- All of this is listed per figure under `codeOnly` in the figure JSON.

Held back by the art director. These frames are not in the atlas; each is listed under `heldBack` in its figure JSON
with the reason and the code fallback:

| Frame | Why | Fallback |
|---|---|---|
| Elder Wyrm front dead | reads as a living, twisting wyrm; its re-roll failed (502, then 402) | the idle collapses (tilt and settle) into the god's colour dissolve |
| Giant 01 back fall, Giant 02 back fall | the painting copied the idle stance or a stride, with no buckling | the hit frame tilts into the dead frame (crossfade) |
| Giant 02 front follow | painted from behind in the front view | the strike frame eases back to the idle |
| Ascended Hero, Ember Hierophant, Mother of Beasts and Horned Hunter front windup | painted from behind in the front view (the model turned the figure round four times) | the idle with the weapon-arm region raised by the mesh, then the strike frame |
| Oracle and Ember Hierophant front castA | painted from behind | the front cast is castB alone, plus the idle with its arms lifted by the mesh |

## 4. Pipeline and outputs

Each new image went through the same steps:
- **Keying:** the stage C `key.py`, with `--shafts` for the bodies with thin weapon shafts (the humanoid gods and the
  giants: swords, spears, staffs, glaives, hammers, clubs).
- **Rim fix:** run per figure box.
- **Slicing:** by guide cell.
- **Registration:** the cell's maquette is registered to the painted cutout (a box-anchored, bounded affine fit).
- **Part labels:** warped from the guide's part-ID render and filled to every painted pixel.
- **Mesh weights:** Gaussian-smoothed one-hot weights sampled on 24×16 vertices.
- **Checks:** run per frame.
- **Records:** `stage-d/prod/cut/<tag>/post.json`.

The art director's look then sets the shipped frame (`prod/tools/dd_final.py`):
- **Scale:** `dd_scale.py`. The painted area against the approved idle's (as the maquette's area changes) is used where
  the maquette registered well (fit IoU ≥ 0.75). Otherwise the median of the area, body-thickness and fit estimates is
  used. Then the art director's factors are applied.
- **Ground anchor:** for two-footed standing frames, the anchor is set by the painted soles, keeping the idle's height
  above the sole. This applies when the registration left the figure floating or sinking by 2 wu or more, or put the
  anchor outside the frame (then x follows the feet too). Pedestal rubble is matched to the idle's base. Six frames got
  hand-set anchors.
- **Stomp points:** these points sit at the painted soles.
- **Pixel fixes:** the top or edge fades, the clay erase and the clay warm.
- **Rim fix again at the tier's own resolution:** at 2K the key-blended fringe on a crest is 10–30 px wide, wider than
  the fix's ring. At the tier it is 2–3 px.

### Action atlases: `stage-d/atlas/actions/` (107 MB on disk, 166 files)

- `index.json`: families, then tiers (pages, frame counts, page sizes, texture px), then figures (their family, and the
  actions per view).
- `<family>-<S|H>.<i>.png/.json`: Pixi spritesheets in the stage C format. Tier S is 0.5 wu/px, tier H is 0.25 wu/px.
  The keyline is #1C1A17 at 60%, 1 px at S and 2 px at H.
- `figures/<figure>.json`: the art plan 8.5 metadata.
- `figures/<figure>.weights.json`: the mesh weights.

There are 25 families and 32 figures. A god's two palettes have their own pages, so a battle loads only its side's
palette. Creature faces (Salamander, Treant, Giant) share one family, as in stage C.

| Family (figures) | Tier S pages | Tier H pages (2048² unless smaller) | S Mpx | H Mpx |
|---|---|---|---|---|
| salamander (4) | 1 (2048×1024) | 2 | 2.1 | 8.4 |
| treant (4) | 1 (2048×2048) | 3 | 4.2 | 12.6 |
| giant (2) | 1 (2048×2048) | 3 | 4.2 | 9.4 |
| titan-cinderHorde / titan-thornwood | 1 (2048×1024) each | 2 each | 2.1 each | 6.3 each |
| ascendedHero-cinderHorde / -thornwood | 1 (2048×256) each | 1 each | 0.5 each | 2.1 each |
| oracle-cinderHorde / -thornwood | 1 (2048×256) each | 1 each | 0.5 each | 2.1 each |
| pyreLord (1) | 1 (2048×1024) | 2 | 2.1 | 8.4 |
| emberHierophant (1) | 1 (2048×256) | 1 | 0.5 | 2.1 |
| hornedHunter (1) | 1 (2048×1024) | 2 | 2.1 | 4.7 |
| motherOfBeasts (1) | 1 (2048×1024) | 2 | 2.1 | 4.7 |
| wildSpirit (1) | 1 (2048×256) | 1 | 0.5 | 1.0 |
| ashPhoenix (1) | 1 (2048×512) | 1 | 1.0 | 4.2 |
| ashColossus (1) | 1 (2048×512) | 1 | 1.0 | 4.2 |
| greatWyrm-cinderHorde / -thornwood | 1 (2048×2048) each | 5 each | 4.2 each | 21.0 each |
| primordial-cinderHorde / -thornwood | 1 (2048×2048) each | 5 each | 4.2 each | 21.0 each |
| elderWyrm (1) | 1 (2048×2048) | 4 | 4.2 | 16.8 |
| worldTree (1) | 1 (2048×1024) | 3 | 2.1 | 9.4 |
| livingMonolith-cinderHorde / -thornwood | 1 (2048×512) each | 1 each | 1.0 each | 4.2 each |
| cinderIdol (1) | 1 (2048×1024) | 2 | 2.1 | 8.4 |
| **Total** | 25 pages | 54 pages | 53.5 | 207.6 |

The PNG pages total 103 MB, and the figure metadata 7.2 MB (64 files).

**Budget warning.** A size-6 god at tier H takes 4–5 pages of actions per palette. Their 2K action frames are
1000–1400 px tall at 0.25 wu/px, as art plan 8.4's 672 px stand height implies for a rearing pose. The shadows are
already stored at half resolution, which took the pages from 16.8 to 9.4 Mpx on the Giant family. If that is too much,
the code part can load a big body's action pages lazily, or draw tier S at scale 2 for size 5–6 actions at H.

### Effect atlas: `stage-d/atlas/fx2/` (the pilot's `atlas/fx/` is unchanged)

| File | Size |
|---|---|
| `fx2-atlas.png` | 2048×2048, 2.9 MB, fill 0.56, 80 frames |
| `fx2-atlas.webp` | 0.9 MB |
| `fx2-atlas.json` | 30 kB. Pixi format: per frame `blend`, `sheet`, `src`, `worldSize`, and `ringK` for rings. `meta` holds the picks with sha256 and why, the code fixes and the anchor conventions |
| `fx2-data.json` | 1.2 MB. The pilot's `fx-data.json` format (version 2, the image embedded as a webp data URI, frames `[x, y, w, h, ax, ay(, ringK)]`), so the pilot's loader reads it by frame name |
| `fx2-bark-512.png/.webp`, `fx2-bark-256.png/.webp` | the seamless L5 bark tile (wrap: repeat) |
| `fx2-checks.json` | the checks |

### Records

| Path | What |
|---|---|
| `stage-d/prod/selection.json` | the art director's picks, overrides and flaw notes |
| `stage-d/prod/checks-summary.json` | the gates in section 5 |
| `stage-d/prod/cut/<tag>/post.json` | per image: key report, per frame registration, scale estimates, anchors, weights, checks |
| `stage-d/prod/guides/` | the 118 action maquettes, with their part maps |
| `stage-d/prod/jobs/` | `actions.json` (96 jobs), `rerolls.json` |
| `stage-d/prod/fx/jobs.json` | the fx jobs |
| `stage-d/prod/tools/` | every script (`dd_*.py`) |
| `stage-d/raw/` | the 125 new raws, each with a `.json` sidecar |

## 5. Checks (art plan 8.6, on the shipped frames)

These are computed on the 260 shipped painted frames and the 96 generated images (`prod/tools/dd_summary.py`, output in
`prod/checks-summary.json`). The 60 tinted frames share the Cinder geometry; their tint masks are proofed per frame.

| Gate | Rule | Pass | Fail | Notes |
|---|---|---|---|---|
| Fringe (per image) | fringePct ≤ 0.2, keyInUnitPct ≤ 0.5, edgeDevPct ≤ 8 | 82 | 14 | fringePct is 0 on all 96 images. 9 fail on edge deviation (8.4–14.6%): fur, feathers, leaf cloaks and cracked stone, which are ragged by design (Wild Spirit, Ash Phoenix, Horned Hunter, Ash Colossus, Hierophant back A). 5 fail on keyInUnit: the Great Wyrm back dead at 5.6% is its own teal scale bands (zero green pixels in the frame); Treant 02 is at 0.56/0.62; the Salamander 02 front's original raw is at 1.2 (its tail lash ships from the cleaned copy); Ash Phoenix front B is at 0.52 |
| Rim at post (2K frame) | key-hue shift ≤ 2% | 203 | 57 | at 2K the key-blended crest fringe is wider than the rim fix's ring |
| **Rim as shipped** (after the tier fix, tier H) | ≤ 2% | **257** | **3** | Primordial back bite 3.0 and back trample 2.2; Wild Spirit front rake 2.6 (moss edges, not key) |
| Value | the body at tier S at least 15 L* below all four grounds | 260 | 0 | |
| Identity | ΔE2000 of the median colour against the idle < 10 (lying frames exempt) | 258 | 2 | Ascended Hero back stepA and strike: whole 11.5 and 12.6 (the cape fills the frame); upper third 4.0–4.2 |
| Camera | box-normalised IoU against the maquette ≥ 0.45 and facing margin ≥ 0.03 (standing frames) | 171 | 89 | the paintings depart from the maquette's extreme poses. Every flagged frame was looked at on its board. The seven that really face the wrong way are held back; the rest face correctly (the margin is unreliable for arms-up and turned poses) |
| Cut-off | touching the image edge | 255 | 5 | Titan ×4 (sword tips) and Treant 04 back slam (crown), faded (section 7) |
| Scale (steps) | step frames within 15% of the idle | 40 | 0 | after the two step overrides |
| Variety, steps | stepA against stepB IoU ≤ 0.86 (robed 0.95) | 20 | 0 | |
| Variety, idle | no standing action above IoU 0.92 against the idle | 191 | 2 | Elder Wyrm back bite (0.92) and back trample (0.93): close to the idle; the mesh carries them |

Art director's interventions, all recorded per frame in the figure JSON:

| Intervention | Frames |
|---|---|
| Ground anchor from painted soles | 106 (25 of them moved 10 wu or more) |
| Anchor aligned to the idle | 4 |
| Anchor matched to the pedestal base | 2 |
| Anchor set by hand | 6 |
| Scale factors | 8 |
| Top or edge fades | 5 |
| Clay erase and warm | 1 |
| Cleaned raw | 1 |
| Held back | 10 |

The mesh weights sum to 1 per vertex (checked 0.998–1.002; mesh views in `stage-d/prod/look/mesh-*.png`).

## 6. Critique

I looked at every figure and view the same way: each action beside its approved idle at play size (1 wu per px) and
at 4× (tier H scale), on the plains ground, with every frame on one ground line by its anchor and the anchors marked.
The boards are in `stage-d/prod/look/final/board-<figure>.png` (per view: the 1 wu/px strip, then the 4× row). The raw sheets, the fx
candidates and the fix proofs are beside them.

**What works**
- **Identity.** The action frames look like the idle painting: same hand, same palette, same marks. The colour gate
  passes on 258 of 260 frames. The two misses are Ascended Hero back frames where the cape fills the view; their upper
  third is within ΔE 4.2. The faces, crests, braziers, pelts and moss read as the same creature.
- **Humanoid gods and giants.** The steps, strikes, hits and deaths read at a glance, even at 28 px a man. The 2K sheets
  hold their detail at tier H.
- **Deaths.** These are the strongest set: every humanoid falls with the weapon dropped beside it. The Salamanders roll
  belly-up, the Great Wyrm sprawls with its wings out, and the Primordial lies on its side with its legs up.
- **Ash Phoenix.** Its eight flight frames vary the wings properly (up, down, glide, dive). The two burn-outs read as the
  bird coming apart in embers.
- **Treants and World Tree.** The windup and slam are real poses: the trunk leans and the arm boughs swing. The World
  Tree back windup needed one re-roll (r2) to lean back.

**What does not**
- **Facing in the front view.** Seven front-view frames came out painted from behind. These were windups and casts that
  raise a weapon over the head, plus one follow-through. The nb21 edit turned the figure round rather than raise the
  arm in front of the face. All seven are held back with a mesh fallback.
- **Big bodies resist big poses.**
  - The Elder Wyrm's bite and back trample are its idle with the jaws open and the forelegs lifted a little.
  - Its front trample is a low hunch.
  - Its front death looks alive.
  - The Primordial needed three re-rolls to rear and lower its head, and the results are good.
  - For the Elder Wyrm, the mesh must carry the motion (art plan 6 already plans a neck lunge and a foreleg lift).
- **Maquette leaks.**
  - The Elder Wyrm back trample kept the clay's grey rod and ball under its tail and its blue-grey underside (fixed at
    pack time).
  - The Salamander 02 front tail lash had a grey-green motion smear (fixed).
- **Cut-offs.** The Titan's sword ran off the image in four frames, and Treant 04's crown in one. These are faded, not
  repaired.
- **Registration.** On strongly changed poses the maquette registration can mislead (the fit IoU falls below 0.6). Six
  anchors were set by hand, and two-footed bodies get their anchor from their painted soles. The scale stays consistent
  because the area rule ties every frame to the idle's painted area, not the maquette's.

**Effect sheets**
- The picks match the pilot's sheets in hand, scale and background: fire is additive on black, light is luma, umbra is
  a multiply decal, and debris and bark are keyed matter.
- The weakest are the L6 seeds and leaves. They are small particles that read only in numbers, which is intended.
- The new sun ring and glyph read beside G1f/G1l.

## 7. Known flaws

All of these are recorded in `stage-d/prod/selection.json` (`_flaws`, and the overrides that fix them).

**Elder Wyrm (the weakest figure)**
- **Front dead:** held back (see section 3).
- **Front trample:**
  - The pose is weak.
  - Its registration broke: the mapped anchor fell 158 wu below the frame. I set the anchor by hand and scaled the
    frame ×1.3 by the head and claw sizes.
  - Fallback: the mesh lift of the forelegs.
- **Back bite and back trample:**
  - Both are close to the idle (the variety gate flags them).
  - The bite lunge is the mesh: neck and head forward 40 wu.
  - The back trample's clay rod and ball are erased and its clay-blue underside is warmed at pack time.
- Re-roll these first when credits return. The prompts and guides are ready: `prod/tools/dd_reroll.py`, then
  `dd_gen.py` and `dd_postrr.py`.

**Held-back frames (code fallbacks in section 3)**
- The seven front-view frames painted from behind.
- Two Giant back falls painted as stands.
- Re-roll candidates once credits return.

**Fades instead of repairs**
- **Titan:** the sword tips of the back stepA, stepB and strike and the front strike were cut by the image edge. The cut
  end fades over 3% of the frame.
- **Treant 04 back slam:** the crown tips were cut. The top 4% fades out. This pose also turns the treant sideways.

**Rubble frames are approximations**
- Living Monolith and Cinder Idol `shattered`: the area rule shrank them, so I scaled them by eye (monolith back 1.20,
  front 1.24; idol 1.2) against the pedestal and brazier.
- The anchors come from the pedestal: the monolith base is matched to the idle's. The idol uses hand-set plinth corners,
  because its coals and face block spill below the plinth.
- The idol's painted plinth is not exactly the idle's shape.

**Scale overrides** (`selection.json` `scale`):
- Treant 01 back slam ×0.8.
- Horned Hunter back stepB ×0.85 and Giant 02 back stepB ×0.86: their wide strides fooled the median.
- Elder Wyrm front trample ×1.3.
- The rubble frames.

**Anchors**
- **Two-footed frames:** anchored by their painted soles. The stomp points (`footL`/`footR`) sit at the soles.
- **Four-footed creatures:** these keep the registered anchor unless listed under hand-set or aligned below
  (Salamanders, Wild Spirit, Primordial bites and deads, Great Wyrm back, the deads). Their hind feet hide behind the
  body and tail in rears and lashes, so a sole walk is not reliable.
- On the Salamander front hit frames (rearing), the registered anchor may sit up to about 10 wu off the painted feet.
  Check in play, and nudge with the `foot*` points if a frame visibly floats.
- **Hand-set anchors:** Primordial back and front trample (hind feet), Elder Wyrm front trample, Pyre Lord back fall
  (knee and boot line), Cinder Idol both views.
- **Aligned anchors:** `prod/tools/dd_align.py` slides each four-footed frame over its idle. It found registrations
  broken on poses close to the idle:
  - Elder Wyrm back trample floating 81 wu.
  - Elder Wyrm back bite 14 wu aside.
  - Elder Wyrm front bite 9 wu off.
  - Great Wyrm front breath floating 45 wu.

  These four now take the aligned anchor (`alignAnchor`); the overlay proofs are `look/final/ov-*.png`. Rearing frames
  cannot be aligned this way, so they keep hand-set or registered anchors, uncertain by about 10–20 wu: the Primordial
  tramples and bites, and the Great Wyrm back breath.

**Maquette and key leaks fixed in post**
- Salamander 02 front tail lash: the grey-green smear was removed from a cleaned copy of the raw
  (`prod/fixes/…clean.png`; the raw is kept).
- Elder Wyrm back trample: clay rod, ball and blue underside, as above.

**Thornwood palettes of the generic gods** (Titan, Oracle, Ascended Hero, Great Wyrm, Primordial, Living Monolith)
- These are colour edits of the Cinder frames: the stage C method and zone, with the hue turn measured on the god's
  Cinder idle.
- The rubble's tint zone is almost gone: the monolith's shattered frame has a mask share of 3% (back) and 2% (front).
  So the Thornwood rubble is nearly the Cinder rubble, which is correct for stone.
- Mask proofs are beside each tinted frame: `prod/cut/<tag>.thornwood/*.mask-proof.png`.

## 8. For the code part

### Frame names

All names are in `stage-d/atlas/actions/<family>-<S|H>.<i>.json`:

| Name | What |
|---|---|
| `<figure>.<view>.<action>` | `<view>` is `back` or `front`; other facings mirror these, as in stage C |
| `<figure>.<view>.<action>.shadow` | black 42%, blurred 5 wu. **Stored at half resolution: draw it at sprite scale 2** (`shadowScale: 2` in the figure JSON), with the same normalised anchor on the same ground point |
| `<figure>.<view>.hit.white` | the one-frame hit flash where a painted hit exists |
| `<figure>.<view>.idle.white` | the flash for the idle. The size 5–6 bodies use it with the idle tilted 6 degrees for their code-only hit |

- The idle textures are **not** repacked. They stay in stage C's atlases (`stage-c/atlas/creatures`, `stage-c/atlas/gods`)
  at the same wu/px. `views.<view>.idle.texture` names the file.
- Every frame of a figure shares the tier's scale (S 0.5 wu/px, H 0.25 wu/px), so all frames draw at the idle's sprite
  scale. The per-frame size changes are in the pixels.
- The spritesheet `anchor` is the **ground anchor**, normalised. It can lie outside 0..1, for example under a rearing
  body or below spilled rubble, which Pixi accepts.

### Figure JSON (`figures/<figure>.json`)

```
views.<view>.<action>: heightWu, wuPerPx, kind (standing | lying | airborne), anchorPx (source px), points (wu offsets
  from the ground anchor, x right, y down), atlas.{S,H}: {frame, shadow, shadowScale, white, scale, w, h}, scaleRule,
  groundFix, pixelFixes, file, raw, rawSha256, model, imageSize, guide, tag, checks, flags, registration
codeOnly: {action: what the code does}    heldBack: {view: {action: why + fallback}}    approved: null (owner)
```

### Points (rig anchors)

| Point | Meaning |
|---|---|
| `weaponTip` | the blade, spear or club tip. On the Primordial and Wild Spirit it is the horn or antler tip |
| `butt` | the weapon's butt |
| `handL`, `handR`, `fistL`, `fistR` | hands |
| `head` | the head centre |
| `mouth` | the snout tip: the **breath origin** for Salamander, Great Wyrm, Elder Wyrm and Primordial. It is snapped along the head's direction |
| `footL`, `footR` | the **stomp points** of two-footed bodies, at the painted soles |
| `footFR`, `footFL`, `footBR`, `footBL` | quadruped feet, snapped to paint |
| `talonL`, `talonR` | Ash Phoenix rake |
| `tailTip` | Salamander tail lash |
| `brazier` | Ash Colossus head-brazier |
| `bough0`, `bough1` | World Tree slam: the bough tips, where the impact lands |

Mirror x for the mirrored facings.

### Mesh weights (`figures/<figure>.weights.json`)

- Layout: `views.<view>.<action> = {grid: [24, 16], parts: [...], w: {part: 16 rows × 24}}`.
- Vertex (col, row) sits at (col/23 · width, row/15 · height) of the frame's **trimmed texture before the keyline
  pad**. In the atlas frame that is the rectangle inset by 1 px at S and 2 px at H on every side.
- The weights sum to 1 per vertex. A part missing from a frame's `parts` list has weight 0 there.
- Parts per body:
  - Humanoid gods: legR, legL, body, head, armR, armL, cape, weapon.
  - Giants: legR, legL, body, head, armR, armL, weapon.
  - Treants and Ash Colossus: legR, legL, body, head, armR, armL.
  - Salamander, Elder Wyrm, Primordial and Wild Spirit: body, neck, head, tail, legFR, legFL, legBR, legBL.
  - Great Wyrm: the same plus wingL, wingR.
  - Ash Phoenix: body, head, legs, tail, wingL, wingR.
  - World Tree: trunk, roots, canopy, boughs.
  - Idol rubble: base, slab, chunk0–2.
- The idle's own weights are in the same file under `idle`.

### Motion the paint does not carry (art plan 6)

- **Elder Wyrm:** the bite lunge (neck and head forward 40 wu on the idle or bite frame), the trample lift (the
  forelegs), and the front death (the idle collapsing into the colour dissolve).
- **Weapon-arm raise:** this replaces the four held-back front windups and the two front castA frames.
- **Falls:** the Giant back falls (hit tilting into dead) and the Giant 02 front follow (the strike easing back to the
  idle).
- **Airborne frames** (Ash Phoenix; Great Wyrm `flight`): the anchor is the ground point under the body, so the
  painting already carries the altitude. Draw the shadow on the ground at the anchor.

### Effects (fx2)

- **Blends:** fire tongues and the breath core are additive with the alpha boost ×1.7, as the pilot's fire. Holy light,
  the sun ring and glyph, and the veins are additive with no boost. Billows and gale debris are normal (keyed matter).
  Spores are luma. Umbra is multiply.
- **Streams** (breathCore, breathBillow, gale, sporeHaze): the anchor is the mouth end. Attach it to the figure's
  `mouth` point and scale by `worldSize.len` (wu).
- **Rings** (glyphRingW, haloRing): `ringK` = frame width / ring-line diameter, as in the pilot's glyph rings.
- **lightColumn:** the anchor is its ground ellipse.
- **Bark plating:** a repeat-wrap tile for Bark Skin's mask wipe.

### Generation tooling

- `tools/gen.py` now routes calls that pass `--size` (2K) to the stage B calibration copy
  (`stage-b/cal/sbx/tools/gemini_gen_size.py`). The backup is `stage-d/prod/tools/gen.py.before-stageD-rest`.
- **To re-roll** after topping up the credits:
  1. Delete `stage-d/prod/STOP`.
  2. `python3 -I prod/tools/dd_reroll.py JOB SUFFIX "correction" [--prev]`
  3. `python3 -I prod/tools/dd_gen.py prod/jobs/rerolls.json`
  4. `python3 -I prod/tools/dd_postrr.py`
  5. Set the pick in `selection.json`.
  6. `python3 -I prod/tools/dd_tint.py GOD` (generic gods only).
  7. `python3 -I prod/tools/dd_pack.py FAMILY`
  8. `python3 -I prod/tools/dd_summary.py`
- Run CPU-heavy steps under `nice -n 10`.
- Suggested first re-rolls (about 12 of the 16 reserve):
  - the Elder Wyrm front dead, front trample and back bite;
  - the seven front frames painted from behind;
  - the two Giant back falls;
  - the Titan back A sheet (sword tips).
