**cmdA (Cinder commanders and Independent Captain levy/hunter): 64 faces × 2 views = 128 figure-views made, checked and packed. 104 pass; 24 fail, and their re-rolls never ran because the API ran out of credits.**

**Generations:** 150 of 150 calls used, all logged as "B cmdA:".
- 138 calls produced images.
- The last 12 calls failed with HTTP 402: "prepayment credits are depleted". That is a billing stop, not a rate limit, so I stopped and am reporting it.
- Those 12 were the 8 scout back fixes and 4 re-rolls (hu05 front; ea01, cm03 and ac05 backs).

**Reused, no cost:**
- The pilot's Ash Chieftain 06 front. It is in the troop layout, so it has no rally cells; the metadata maps actA to cheer and actB to strike.
- The calibration's AC03, CM03 and EA07 fronts, and its chieftain and caster front body sheets.

**Body sheets** (12 calls):

| Body | Front | Back |
|---|---|---|
| Chieftain | calibration, 14/16 | 15/16 |
| Caster (also used for priests) | calibration, 16/16 | 9/16 failed; Nano Banana 2.1 edit of the chieftain back, 14/16 |
| Levy (also used for hunters) | 16/16 | 14/16 |
| Scout | 1/16, 0/16, chieftain edit 13/16, then edit of the levy front 15/16 | 14/16 by the gate, rejected by eye (see failures) |

**Routing decisions:**
- **Pyre Priest:** its own bodies failed (front 10/16, back 6/16), so priests are re-dressed onto the caster body. Their act cells are therefore cast poses, not bless.
- **Hunter:** its own bodies failed (front 9/16, back 13/16), so hunters ride the levy body with a hunter kit in the prompt.

**Results per group:**

| Group, view | Pass | Cells | Identity ΔE | Lone side share | Value below ground |
|---|---|---|---|---|---|
| Scout front | 7/8 | 15/16 | 3.7–8.1 | 0.16–0.20 | ≥30 |
| Scout back | 0/8 | 14–15 | 3.1–5.7 | 0.18–0.21 | ≥25.5 |
| Chieftain front | 8/8 | 13/15 (pilot) to 16 | 3.7–10.0 | 0.12–0.18 | ≥27.9 |
| Chieftain back | 5/8 | 13–15 | 4.5–10.2 | 0.14–0.19 | ≥27.3 |
| Priest front | 8/8 | 15–16 | 3.0–5.2 | 0.12–0.16 | ≥27 |
| Priest back | 8/8 | 14–15 | 4.2–7.8 | 0.15–0.17 | ≥27.9 |
| Adept front | 8/8 | 15–16 | 2.1–7.3 | 0.14–0.17 | ≥26.6 |
| Adept back | 7/8 | 13–15 | 2.9–10.6 | 0.13–0.17 | ≥25 |
| Magus front | 8/8 | 15–16 | 1.3–4.8 | 0.14–0.19 | ≥25.5 |
| Magus back | 0/8 | 12–15 | 3.4–8.7 | 0.14–0.19 | ≥26.1 |
| Levy front | 12/12 | 15–16 | 3.2–10.7 | n/a | ≥16.4 |
| Levy back | 11/12 | 13–15 | 4.3–11.6 | n/a | ≥21.1 |
| Hunter front | 11/12 | 13–16 | 1.9–10.6 | n/a | ≥22.5 |
| Hunter back | 11/12 | 13–16 | 1.2–16.0 | n/a | ≥21.1 |

- **Every sheet:** pose variety passes, and the rim after the rim fix is 1.9% or less.
- **Side share** is for a lone commander at 32 px with the side keyline. My gate is 10% (the kept pilot Ash Chieftain 06 reads 17.7%). Independents wear undyed grey, so only the value margin applies to them.
- **Identity marks**, ticked by eye on 4× crops: of 384, 303 read clearly, 55 partly and 26 not at all. As in calibration, the misses are face-sized marks (scars, soot marks, earrings, small clasps).

**The 24 failures:**
- **Scout backs, all 8:** wrong facing, which I caught only by eye. The stand, idle2, actA and fall cells face the camera; they inherit this from the scout back body. They are also packed about 1.35× too tall. They are in the atlas but marked rejected. The planned fix (re-dress onto the levy back body) was among the calls that hit the 402.
- **Camera cells 12–13/16, 9 sheets:** ac05, ea01, cm01, cm03, cm06, cm08, lv08 and hu02 backs, and the hu05 front. Most of the failing cells are falling or lying poses; hu05 fails idle2 and cheer.
- **Key colour inside the figure above 0.5%, 7 more sheets:** the magus backs (0.55–0.95) and ac03 and ac07 backs. The cause is key green showing through the iron staff cage and the curled horn loops, so a re-roll of the same sheet would fail the same way. Some of the magus backs above also fail on cells. The cs05 front fails at 0.70 from cool blue in the dark shadows.

**Pipeline findings, all fixed in this sandbox only; shared tools untouched:**
- **The camera gate cannot tell a figure facing the camera from one facing away.** The scout back passed at 14/16 with four cells turned round. Back sheets need a facing check by eye, or a better automatic one.
- **Independents and scouts use a blue key, not magenta.** I chose it because of the review's finding that magenta tints light fur pink. Blue then left a mauve outline on the edges; `cmda_bluerim.py` removes it and has been applied to all 61 blue-keyed sets.
- **The edge-colour check misfires on thin sword blades.** Its interior reference doesn't exist on features under about 3 px wide, so blade highlights count as fringe (chroma shift 0.002, i.e. no key tint at all). The gate now ignores thin features (`edgeDevThickPct`); the original number is still reported.
- **Re-dresses are scaled by their body sheet's height,** so tall cowls and horns stand above the man instead of shrinking him.

No portraits were made: every face here already has an approved portrait. The repo is untouched.

Files are in /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/:
- raw/cmdA/ — 138 sheets, each with its JSON sidecar
- work/cmdA/ — per-sheet checks in faces/ and bodies/, plus the tables:
  - summary.json
  - eye.json (identity ticks and the facing review)
  - picks.json
  - bodies.json
  - scales.json
- work/cmdA/sbx/tools/ — the sandbox tools; the main ones are cmda.py, cmda_faces.py and cmda_pipe.py
- work/cmdA/review/ — contact sheets for each group and view (contact-*.png), identity boards (identity-*.png) and a lineup of every stand frame at tier S (lineup-tierS.png)
- atlas/cmdA/ — tier S and H atlases with Pixi JSON per group; figures/ holds one metadata file per face (64)