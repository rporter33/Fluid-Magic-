# Battle mockup v4: art direction and QA critique

Date: 2026-10-22. Subject: `visual-v4/battle-mockup.html`, which I did not edit. Its sources are in `visual-v4/src/`.
How I tested:
- Playwright on Chromium 1194 with SwiftShader, with Pixi 8.22.0 routed to the repo copy.
- Battles a, b and c, each played at 1x and 4x. Desktop 1920×1080; phones at 390×844 (touch, dpr 2) and 844×390.
- I took my own screenshots and ran my own measurements. Probes and data are in `visual-v4/qa/` (`s1`–`s16`, `drv.cjs`,
  `negt.cjs`), screenshots in `visual-v4/qa/shots/`, and a labelled evidence sheet in
  `visual-v4/battle-critique-evidence.png`.
- ref-1, ref-5, ref-6, ref-7 and ref-8 were used for direction only. Nothing was taken from them.

## Verdict

The direction is right. The mockup already reads as an overhead three-quarter battle:
- massed blocks in two strong side colors;
- arrows in flight as dark dashes, with glowing fire arrows;
- bodies and pools left where troops fell;
- a wyrm about 8 soldiers tall;
- a wall the defenders actually stand on;
- a unit card bar and a hover card with Troops or Hitpoints, Morale and status, much as the owner described.

The plumbing holds up beyond the builder's own checks:
- **Cards and figures stay in sync continuously.** I compared the standing figures, the card model and the DOM count
  every 0.05 s at both 1x and 4x, over 6,604 sampled frames: 0 mismatches. The builder only checked at phase ends.
- **Correctness.** Every winner is correct, there are no page errors in any session, and no figure overlaps an enemy
  figure (closer than 7 wu: 0).
- **Framing.** The auto camera puts 92 of 94 story subjects (routs, deaths, charges, spells) at least half on screen.
- **Performance.** JS update p95 is at most 2.0 ms over full playbacks.

What keeps it from looking like the direction:
- The monsters hover over their own troops or sit buried in them.
- Cavalry charges through its own infantry.
- Blocks are wide, gappy grids rather than dense masses.
- The field is an empty, flat plane with its features out of frame.
- Blood and breath barely register.

There are also four real bugs:
- the story clock starts at about −4 s;
- the monster's bounding box steals hover and click;
- textures leak about 31 MB per battle load;
- the two sides fail the project's own colorblind rule.

## Fixes, most important first

### 1. Monsters do not read as huge: they float over or sink into their own army
**Evidence**
- **Battle a, the wyrm.** It flies at h = 100 for all of its melee (`31-build.js` 618–619). Its sprite therefore
  covers its own Warden and Longbow blocks.
- **Ghost figures.** `seeThroughPass` draws up to **61 ghost figures** on the wyrm's body and wing, in 173 of 237
  frames sampled every 0.25 s. You can see this in `qa/shots/a-1x-clash.png` and `a-1x-rout.png`. At the rout beat the
  routing Briar Guards are hidden behind the wyrm.
- **Battle c, the salamander.** It walks into its own Cinder Warriors: up to **10 of its own soldiers are drawn in front
  of it, plus 8 ghosts** (t = 15.0; `qa/shots/z-c-clash.png`). The cause is that lines 616–617 place a non-flying body at
  `seam + s·(7 + footR)`, inside its own front ranks.
- **Salamander size.** Its rig is drawn only **42 wu tall** (measured bounds, 150 × 42), against the size-3 height of
  64 wu. It reads as a floor lizard about 1.5 soldiers tall.
- **At deploy.** All bodies stand beyond every band's end (`20-layout.js` 131–137), so the treant and the wyrm look
  detached from their armies (`b-1x-deploy.png`, `a-1x-deploy.png`).

**Change**
- **`31-build.js` 616–619 (free movers), size 3 and up.**
  - Lateral position: take the union of the engaged frontages of the body's own side at `ws`. Set `x` outside that union,
    at the end nearer the foe: `x = fp.x < mid ? x0 - 1.3*fr : x1 + 1.3*fr`.
  - Depth: `y = seam + G.s*(LAYOUT.contactGap/2 + fr)`.
  - Height: `h = 0`, so flyers land to fight. They fly only while approaching and during ranged phases.
  - Bind the struck foe to the frontage end at `x`: pass `x` as `cx` to `bindTo` in the duel-binding loop at 584–594 (the call is on 591). The victim then stands at
    the monster rather than mid-line.
- **Deploy and advance.** In `20-layout.js` 137 place the body at the end of its row band's own blocks (`bands[row].left`),
  not past all rows. In `30-timeline.js` 114 and `31-build.js` 224, lower the flying height from 120 and 110 to 40, so the
  sprite does not sit on the rear bands.
- **`60-render.js` 342–367 (`seeThroughPass`).** Skip the pass while the body's `h > 30`. Otherwise ghost only figures
  that are engaged and within `1.5*footR` ground distance of the body, cap them at 12, and drop the alpha from 0.35 to
  0.22.
- **`41-bodies.js` 74–100 (`makeSalamander`).** Add `body.scale.set(1.5)` (42 to 63 wu tall) and an idle neck lift of
  −0.25 rad, so it stands as a beast of size 3.

### 2. Cavalry charges straight through its own infantry
**Evidence**
- In battle a the Ash Riders are dressed onto the seam at x ≈ 0, where the Cinder Warriors already stand. The Riders'
  wedge is 129 wu deep, so it covers the Cinder Warriors' block. The Cinder Warriors are not engaged in round 2: the sim's
  contact list is Ash Riders, Wardens, Briar Guard and the wyrm.
- **Overlap measured.** Figures of the same side but different squads within 9 wu of each other: **35 of 237 samples
  (0.25 s apart), up to 20 pairs at once, starting at 11.75 s** (Cinder Warrior with Ash Rider). Battle b has the same
  fault: 34 of 204 samples, Wolf Riders inside the Wardens.
- **What it looks like.** `qa/shots/z-a-clash.png`, `z-b-clash.png`. Hovering the Cinder Warriors there says **"Waiting"**
  while their block is visibly in the melee crowd.

**Change**
- **`31-build.js` 496–520 (dress the line).** Before laying out `sorted`, collect the lateral intervals of the side's
  own blocks that are not in contact and whose front lies within 60 wu of the seam. Place each contact block at the
  nearest x, from its sorted slot outward, where `[x+u0-4, x+u1+4]` is free of those intervals.
- **Wedge on impact.** When a `wedge` block reaches contact, flatten it to 2 ranks with `addSeat` (d = 0.4). The point
  then hits the line instead of a 129 wu column standing in it.
- **Test.** Add the same-side overlap probe (`qa/s6-overlap.js`) to `checks()` and require 0.

### 3. The blocks are grids of toy soldiers, not massed formations
**Evidence**
- `20-layout.js` 23–28 sets file spacing of 18 to 26 wu for 12 wu-wide figures, and 1 to 6 ranks. The result:
  - 60 Cinder Warriors make a slab 199 wu wide and 69 deep;
  - 40 Flame Archers make a strip 326 × 46.
- The direction shows deep, packed masses (`qa/shots/a-1x-deploy.png`).
- I ran the change below as a runtime patch of `FORM`, without editing the file. The blocks became 106 × 73 and 155 × 47,
  and read as masses (evidence sheet, panel 3; `qa/shots/x-dense-a-*.png`). `checkBattle('a')` still reported 0 figure
  and 0 card mismatches, bodies ok and winner ok.

**Change (`20-layout.js` 23–28)**

| Form | Ranks | Files × ranks spacing, wu | Jitter, wu |
|---|---|---|---|
| line | `round(√(n/1.5))`, 3 to 10 | 13 × 12 | as now |
| heavy | `round(√(n/1.2))`, 4 to 10 | 13 × 12 | as now |
| shock | `round(√(n/1.5))`, 3 to 8 | 15 × 14 | 3 |
| archers | `round(√(n/3))`, 2 to 5 | 16 × 15 | as now |
| wedge | as now | 20 × 22 | as now |

- In `70-camera.js` 27, raise the follow zoom cap from `1.6*zAll` to `2.2*zAll`, so the tighter blocks still fill the
  frame.
- Re-run `battle-tools/layout_model.py` to confirm the touching share (94.8%) holds.
- Update the table in `battle-design.md` 3.5 to match.

### 4. The story clock starts at about −4 s, and every battle load leaks about 31 MB of textures
**Evidence: the clock**
- `90-main.js` 66 clamps `dt` only from above.
- The first rAF callback carried a timestamp from before init ended. Instrumented:
  - at 640×360, `ts` 400.4 ms against `lastNow` 4238.4 ms, giving **t = −3.84 s**;
  - at 1920×1080, **t = −4.36 s**.
- The opening therefore sits frozen for about 4 s of story time, with the scrubber at 0:00. After 2.5 s of real time it
  was still at −3.5 s. My first probe (`s9`) saw t = −4.39 at start.

**Evidence: the leak**
- `load()` (line 37) destroys the container but not its textures:
  - the ground canvas texture from `PIXI.Texture.from` (`60-render.js` 28) is 3436×2362, about 32 MB;
  - the seven `makeTex` textures (54–60) are not freed either.
- Managed textures rose from 81 to 207 after 3 loads, and to 551 after 15 loads. That is about **69 → 212 → 590 MB**.

**Change**
- **Clock.**
  - Line 66: `const dt = this.lastNow === null ? 0 : clamp((now - this.lastNow) / 1000, 0, 0.1);`
  - Line 30: `this.lastNow = null`.
  - Line 69: `this.t = Math.max(0, this.t + dt * this.rate(this.t));`
- **Leak.**
  - Add `BattleStage.dispose()`. It calls `this.ground.texture.destroy(true)` and `destroy(true)` on `texDot`,
    `texSoft`, `texDash`, `texStub`, `texPool`, `texShadow` and `texChurn`. It keeps `ATLAS_CACHE`.
  - Call `dispose()` before line 37's `destroy({ children: true })`.
  - Add both checks to `checks()`: t ≥ 0 on the first frames, and the managed texture count stable across 3 reloads.

### 5. A monster's bounding box steals hover and click from everything under it
**Evidence**
- `90-main.js` 108–112 tests big bodies first, against their full `getBounds()` rectangle. The wyrm's bounds are
  477 × 217 wu, including empty sky between the wings.
- In battle a, pointing at the Warden Captain at (1311, 446) opens **Ysmerach's** hover card.
- In battle c, pointing at the Fire Sprites' hull centre at (792, 493) opens the **Salamander**.
- Those squads cannot be hovered or selected from the field.

**Change (`pick`, 104–129)**
- Test commanders and block hulls first.
- Then test bigs against a hit area:
  - the body's ground footprint ellipse (`footR*1.3`, projected);
  - or its bounds inset by 25% in x and 20% in y.
- Return a big only when no commander or hull was hit.

### 6. The two armies fail the colorblind rule
**Evidence**
- I took the median rendered figure color of each side in battle a at deploy: near #623726 (Cinder), far #375B44
  (Thornwood).
- CIEDE2000 between them, using the repo's `tests/content/colorMath.ts`:

  | Vision | ΔE |
  |---|---|
  | normal | 34.8 |
  | protan | **8.9** |
  | deutan | **8.8** |
  | tritan | 40.8 |

- The project's minimum under deficiency is 12 (`docs/09`, `palette-ab/decision.md`). Red against green separates only
  by hue, which is exactly what protan and deutan viewers lose.

**Change**
- **`60-render.js` 7–10 (`paletteFor`).** When the two sides' cloths differ by less than 12 under protan or deutan, give
  the far side its dark cloth: `{...pal, cloth: pal.clothDark, clothLight: pal.cloth, clothDark: shade(pal.clothDark, -0.3)}`.
- **Measured with this change.**

  | Pair | Protan | Deutan |
  |---|---|---|
  | Cinder #C4532C against Thornwood dark #113F2F | 20.9 | 33.2 |
  | Thornwood #2F8A68 against Cinder dark #6A2810 | 27.9 | 23.0 |

  Both still clear the value rule against the 67.7 L\* ground (49.6 and 51.6).
- **Atlas key.** Add the variant to the key at line 63 (`unit/side/variant`), because `ATLAS_CACHE` survives battle
  switches.
- **Test.** Add the pair check to the design 3.8 presentation test.

### 7. At 4x the camera whip-pans
**Evidence**
- Keys ease over 0.8 story seconds (`70-camera.js` 48) and may come every 1.4 story seconds (33). At 4x that is
  0.2 s and 0.35 s of real time.
- Simulated at 60 fps:

  | Battle | Max pan at 4x, px/s | Frames over 1500 px/s | Max pan at 1x, px/s |
  |---|---|---|---|
  | a | 3,643 | 66 of 887 | 913 |
  | b | 3,309 | 77 of 763 | 829 |
  | c | 4,027 | 39 of 826 | 1,004 |

- The zoom changes at up to e^3.56 per second.

**Change**
- **Scale the camera's timing by speed.** Let `k = max(1, speed/1.5)`. Make the key-spacing test at line 33
  `k.t - last.t < 1.4*k`, and make the ease at line 48 `/ (0.8*k)`.
- **Build keys per speed.** Cache them by speed and cross-fade over 0.5 s of real time when the speed changes. The camera
  stays a pure function of (t, speed).
- **Tested as a runtime re-implementation.**

  | Battle | Max pan at 4x, px/s | Frames over 1500 px/s |
  |---|---|---|
  | a | 1,728 | 11 |
  | b | 1,386 | 0 |
  | c | 1,222 | 0 |

  1x is unchanged.

### 8. Blood and breath barely register
**Evidence**
- **Blood spatter is sub-pixel.** Blood bursts are `texDot` (r 4) × 0.32, which is 1.3 wu. At the camera's 0.84 to
  1.35 px/wu that is about 1 to 2 px. They are invisible at play zoom.
- **The seam stain is almost transparent.** The seam churn draws at alpha 0.07, and its red stain at most 0.12
  (`60-render.js` 199–201).
- **What does read.** Pools under bodies do, but no red marks "where the lines meet" (`qa/shots/z-a-30s.png`). Snow is
  better (`b-1x-result.png`).
- **The wyrm's breath** is drawn entirely additive in 0x9FD860 on a light ground (551–558). It reads as a beam of pale
  bubbles, not a blast (`qa/shots/z-a-volley.png`).

**Change**
- **Spatter.** Line 320: blood scale 0.32 → 0.75. In `31-build.js` `landing` and the melee kill branch, use `n` 10 for
  kills.
- **Seam stain.** Line 199: `s1.alpha` 0.07 → 0.14. Line 201: `s2.alpha = Math.min(0.35, 0.04 + 0.012*d.kills)`.
- **Breath.**
  - Draw the cone and the outer particles (`q >= 0.25`) into `this.spellG` (normal blend) in `shade(col, -0.35)` at
    alpha 0.45. Keep only the core (`q < 0.25`) additive.
  - At `fx.t1`, push a `scorch` decal under each of `fx.hitFigs`, so the sweep leaves a burnt track.

### 9. The ground is an empty plane: tall scenery on the near side, features out of frame, polka-dot puddles
**Evidence**
- **A peak in front of the battle.** In battle b, a snow peak about 230 wu tall sits at the bottom centre, in front of
  the battle and behind the card bar (`qa/shots/b-1x-deploy.png`, `b-1x-volley.png`, `b-1x-result.png`). The cause:
  - `ring()` in `50-ground.js` 186–191 places scenery on all four sides, including the near side (side 3);
  - line 201 makes peaks up to 3.6 × 34 wu;
  - peaks are painted into the flat ground texture, so troops routing toward the near edge would be drawn over it.
- **No feature in frame.**
  - Battle c's only feature, the channel and its stone bridge (208, `yR = F.y1 + 150`), shows as a corner sliver.
  - Battle a has no feature at all.
  - The owner asked for terrain features in the scene.
- **Polka-dot puddles.** The swamp puddles (91–108) are evenly spaced blue-grey ellipses with a sky sheen. They read as
  holes in the ground (`qa/shots/c-1x-deploy.png`).

**Change**
- **No tall scenery on the near side.**
  - In `ring()`, use `const side = Math.floor(rng() * 3)` and map it to left, right and far.
  - The near side gets only stones and grass (6 wu or less).
  - Cap peak `s` at 1.6.
- **Bring the set pieces into frame, within design 3.7 rule 2.**
  - Move the channel to `F.y1 + 90`.
  - Give plains its listed road with a stone bridge, on the same rule.
  - Add each set piece's screen box to `T.allBox` (`32-finish.js` 31–45), so the opening frame shows it.
- **Puddles.**
  - Build each from 2 or 3 overlapping ellipses of 4 to 14 wu.
  - Drop the sheen fill.
  - Keep the rim within 8 L\* of the mud.

### 10. Phone width and the card bar
**Evidence**
- **Phone landscape, 844×390.** The 700 px media query does not apply.
  - The picker overlaps the enemy strip (203×35 px) and the transport (160×35 px).
  - The battle gets about 170 px of height between the HUD rows, and figures are 12.4 px tall in battle a
    (`qa/shots/p-landscape-a-clash.png`).
- **Phone portrait, 390×844, touch.**
  - **Tap.** Tapping a squad selects it, but its card renders at **(0,0)–(214,148)**, over the enemy strip
    (`qa/shots/p-portrait-tap.png`). The cause is that `pointerup` (`90-main.js` 238–241) never sets `view.hoverAt`.
  - **Hidden cards.** The card bar hides 220 to 340 px of cards and gives no cue that it scrolls.
- **Desktop.** Commander cards print HP ("14") in the same type as troop headcounts ("60"). Painted portraits sit beside
  procedural figures on saturated banner red, so the bar has two art styles and the troop cards look alike
  (`qa/v/crop-a-bar.png`).

**Change**
- **Landscape layout.** In `page.html` 160, use `@media (max-width: 700px), (max-height: 500px)`, and fold the mockup
  picker into the menu at that size.
- **Tap position.** In `90-main.js` 240–241, set `this.view.hoverAt = { x: e.clientX, y: e.clientY }` before
  `this.select(gi)`. In `80-hud.js` 323, fall back to `screenOf` of the group when `hoverAt` is null.
- **Scroll cue.** Add a right-edge fade to `.cards` when `scrollWidth > clientWidth`.
- **Commander HP.** In `80-hud.js` 256, use ``cnt.innerHTML = g.isCmd ? `<small>HP</small>${hp}` : `${n}` ``, with
  `.card .count small { font-size: 10px; color: var(--dim); margin-right: 2px }`.
- **Card art.** In `80-hud.js` 50, change the card background to the neutral `grad(0x2e2a25, 0x14120f)` with a 4 px
  banner strip, and in line 65 crop the figure to a bust (scale 3.2, y 190).
- **Later.** Generate troop busts in the approved portrait style with `tools/art/gemini_gen.py`; the owner has
  authorized it for game art.

## Not in the top ten (noted)
- **Frame spikes.** A JS update took up to 25 ms in 6 of 4,262 frames (battle a at 1x). Probably GC: `hull()` and
  `figPos` allocate every frame.
- **Storm outro.** "Thornwood take Haldospire", yet no attacker ever climbs the wall. Design 3.6 calls for an advance
  onto the walk.
- **Wyrm corpse.** It tips over by 0.18 rad but stays standing. It should lie down: squash y to 0.55 and fold the wings.
- **Battle b's wall.** It has no gate or gatehouse at either end (ref-7's focal point), and a hairline from the rampart's
  back face runs the full width of the screen.
- **Hornet swarms** read as brown dirt piles at play zoom.
