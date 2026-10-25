The stage B battle mockup is close to the owner's bar on the Cinder side but not ready on the Thornwood side. Six Thornwood commander faces show their portrait on the card and a procedural toy on the field, and the far Thornwood blocks read nearly black.

I left the mockup and the repo untouched and made no image generations. Every run had zero page errors. The critique (12 fixes, 30 re-rolls) is at `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique.md`. My shots, scripts and measurements are in the `critique/` folder next to it.

**What works:**
- **Cinder troops** read as painted troops in one hand at play zoom. Variation within blocks is varied but calm, which is what the owner asked for.
- **Cinder commanders:** all 10 faces match their portraits.
- **Wolf Rider:** the rider is now man-sized.
- **Motion:** each figure keeps its own timing, as the owner liked.

**The 12 fixes, most important first (exact code changes are in the file):**
1. **Thornwood commanders:** paint the six missing faces and Elder Druid 08's back view (re-rolls R1–R13). Re-key Elder Druid 08 to remove the pink on his staff.
2. **Far Thornwood colour:** lift the cloth's colour strength instead of only darkening it. I tested this in the page. Far side colour goes from 23.5% to 32.7% in battle a and from 24.0% to 31.8% in battle c (target 30%), with the colour-blind contrast still passing. The Wolf Rider also needs the Thornwood colour lock.
3. **Detail switch during normal play:** without any user zoom, the camera's close-ups switch to the high-resolution art for 10–40% of each battle. The first switch lands on the big moments (the Wyrm, the Salamander's death) and can freeze the screen for 0.48 s. Raising the thresholds to 56/53 px keeps the automatic camera on the play-zoom art.
4. **Bodies change pose on landing:** 205 of 388 painted deaths swap to the other dead pose when the body hits the ground, because the two use different seeds. There is also a rotation jump of up to about 23° mid-fall.
5. **Sliding feet:**
   - The march cadence is fixed at 2 steps a second whatever the speed, so fast moves skate up to 180 world units per step (a man is 28).
   - Figures closing ranks slide in a standing pose, up to 65 units.
   - Routing figures jog on the spot for up to 6.3 s.
   - Strikes spin figures 180° per blow, 6–9 times each in the worst cases.
6. **Banners:** the painted generals lost the banner the procedural ones carried. The three stage B painted banners are unused; use them on generals and blocks.
7. **Commanders out of frame:** generals spend up to 49% of their time under the card bar, and up to 74% hidden counting off-screen time.
8. **Troop cards:** the nine stand-in figure crops break the portrait family. Paint the busts (R20–R28); reframe the crops meanwhile.
9. **Keying:** the calibration's keyer fix was never copied into the shared keyer. Copying it and re-keying fixes the pink staff and the green-tinted javelins with no generations.
10. **Salamander death:** after "Salamander has fallen" it still stands upright and looks alive. It needs the plan's collapse.
11. **Commander variety:** all five Ash Chieftain faces share one body, one axe and one pose. Give each face its own weapon and mantle in the production prompts.
12. **Portrait prompts:** all 26 Thornwood portrait prompts still use the green wording the calibration showed paints grey. The full-length god prompts reference only a head-and-shoulders image. Fix both before the portrait run resumes.

**Re-rolls, 30 generations in total:**

| Group | What | Gens |
|---|---|---|
| R1–R13 | Thornwood commanders: three body sheets, eight face views and two spare re-rolls | 13 |
| R14–R19 | Weak troop sheets: Longbow Hunter front (with one spare), Briar Guard front, Thorn Militia front, both Berserker views | 6 |
| R20–R28 | The nine troop card busts | 9 |
| R29–R30 | Wolf Rider back view (with its one re-roll) | 2 |

None of these can run until the API credits are restored, because every call has been refused with HTTP 402 since 09:13Z. If the Wolf Rider back view counts as a new mount figure, move its two generations to bust re-rolls.

**Portrait board:** there are no candidates to judge. All 58 creature, mount and god candidates were refused by the API, and only the owner-kept Warden bust is on the board. The test-run sheets in `work/portraits/dryrun/review/` show stand-in images with PASS/FAIL captions (a Salamander portrait sits in the Wolf slot as PASS), so they must never reach the owner. The portrait run needs its own budget of about 70 generations.