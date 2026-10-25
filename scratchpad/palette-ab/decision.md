# Painted land colors: the A/B decision

2026-10-22. Inputs: the strict proposal (`palette-ab/strict/`) and the texture proposal (`palette-ab/texture/`), the owner's
direction, `handdrawn-design/final.md` (rulings, §1, §10.2 question 6) and `critique.md`. Every number below was measured
again here with the repo's own `tests/content/colorMath.ts` and `src/content/colors.ts`, copied unchanged into
`palette-ab/decide/` (diff-checked against the repo at 1cd587b) and run with `npx tsx` from the repo. Nothing in the repo
or in the mockup parts was edited.

## Decision

**Neither proposal as it stands. View B is a synthesis: the texture proposal's look, found again inside the strict
proposal's rules.**

- **Strict proposal.** It keeps the docs/09 rule, but it mutes the wrong things.
  - The teal swamp, the blue mountains and a rose wasteland all stay. Chroma outside the warm-earth hues barely moves
    (0.022 to 0.020 mean OKLCH C).
  - At the start zoom it reads as the approved board, slightly less saturated (`candidates.png`).
- **Texture proposal.** It is the closest to the reference image, but it relaxes the colorblind rule.
  - The rule drops to 14 / 9 (measured 14.6 / 9.3 across the approved states, 16.2 / 11.4 on raw fills).
  - That fails `palette.test.ts` and H13: 8.5 under a deficiency at v3's own mottle.
  - Its case that texture carries the difference rests on generic texture statistics. Those identify a province's terrain
    only 48% of the time when left out of the training set.
  - It also needs a second "Clear colors" palette, which doubles the palette tests.
- **The synthesis.** A constrained search looked for the palette nearest the texture fills (CIEDE2000) that still meets
  every check the strict proposal met.
  - The answer is 4.1 ΔE RMS per fill from the texture fills; the strict palette is 6.7 away.
  - It keeps the texture look: a slate swamp, tan farmland, mauve-grey wasteland and pale plains.
  - It passes docs/09 exactly, with no relaxation.
  - **The texture look never needed the relaxation.** The search found lightness and blue-yellow room that the texture
    proposal did not use.

The mockup shows B as a toggle beside the approved fills. A, the approved fills, stays the default.

## The fills

| Terrain | A: approved | B: painted | L\* | OKLCH C | OKLCH hue | ΔE from A | Reads as |
|---|---|---|---|---|---|---|---|
| Plains | #C1D29F | **#D4DCC0** | 86.5 | 0.039 | 120 | 7.4 | pale sage straw |
| Farmland | #EEBA3A | **#CEA265** | 69.4 | 0.094 | 75 | 11.7 | tan ochre |
| Forest | #374C2B | **#243F1B** | 23.7 | 0.068 | 138 | 5.0 | deep green |
| Hills | #856824 | **#7D6542** | 44.3 | 0.059 | 76 | 7.6 | umber |
| Mountains | #8DA4AD | **#9FB8D0** | 73.7 | 0.044 | 247 | 8.7 | light slate blue |
| Swamp | #1A727A | **#58696E** | 43.2 | 0.022 | 217 | 12.7 | slate |
| Wasteland | #AE897F | **#9E8A91** | 59.4 | 0.026 | 355 | 9.1 | mauve grey |

These are also in `palette-ab/painted-fills.json`, with the ground-mark steps below.

**One trade is built into this palette:** either Mountains or Farmland has to carry the color. The rule needs one of
them to have chroma. B puts it in Mountains, a light slate blue (OKLCH C 0.044, a little more than A's 0.029).

- I measured the other way round: Mountains #A8B7CC (C 0.034), which needs Farmland #E1A962. That Farmland is an orange
  gold sitting next to Ember's orange bands.
- B keeps the quieter tan Farmland, which is also nearer the texture proposal.

## Every other change: the A/B in the mockup, and nothing else

I built no part. These are instructions for whoever builds the A/B into
`wartable-design/mock-work/parts/`.

1. **Control.** In `p00c-body.html`, add `Land` with `Approved` (on) and `Painted` next to the Farmland control.
   - In `p80d-rest.js`, the handler sets every `TERRAIN[t].fill` from `painted-fills.json`, then clears `FILLMEMO`,
     `FACEMEMO` and `GREYMEMO`, calls `resetGeometryCaches(false)` and invalidates the bakes.
   - Under Painted, the Farmland control is disabled; the #EDB141 question does not apply.
   - Back on Approved, Farmland takes the Farmland control's value.
2. **Ground marks follow the fill, under Painted only.** `groundP` in `p55-paint.js` hard-codes mark colors tuned to the
   approved fills, such as the teal swamp streaks rgba(44,140,148,.6). Muted land would keep those bright hues.
   - Under Painted, each mark becomes the same lightness step from its own fill, at today's alpha:
     - Plains hedges: −37.
     - Farmland hedges, and the infield outlines on Plains, Hills and Wasteland: −42.
     - Forest scallops: ∓8.
     - Mountain scree: −14.
     - Swamp streaks and pools: +10.
     - Swamp ripples: +36.
     - Wasteland cracks: −11.
   - Plains stipple (±8) and the Farmland field tones and furrows already follow the fill.
   - Under Approved, v3's literal colors stay, so view A is unchanged.
   - Check: with the approved fills, the same derivation leaves only 0.17% of the start view's pixels more than 6 away
     from v3 (summed over the RGB channels).
3. **The paint recipe is unchanged in both views.** This covers the PAINT amplitudes, the lifts, paper tooth,
   granulation, edge pool, blooms, flecks and relief wash.
   - With B's fills the page's `?paintcheck` passes at the current lifts: worst province 1.86 (Hills, budget 2.0).
   - The Far full-decoration pairs have none under 20 / 12.
   - The two proposals' paint changes are a separate question; see "What the owner is asked to decide".
4. **Data modes are unchanged in both views.** `MODE_BASE` stays at the approved bases and the ramp stays as it is.
   - The current Farmland control re-derives `MODE_BASE.farmland` from the fill. The Land control must not do that.
5. Also unchanged:
   - `MAP_KEYLINES` and `keylineFor`: every terrain keeps its keyline (dark on Plains, Farmland, Mountains and Wasteland;
     light on Forest, Hills and Swamp).
   - `DARK_T`, the label halos, region ink at 90%, the track inks, stamp and settlement faces (derived from the fill as
     today), flecks, wild grounds, rims and the cloth.
   - The mockup draws band keylines per nation, not with `keylineFor`. On both palettes, wherever an M1 band needs its
     keyline, the mockup's keyline passes the band rule too, so the A/B needs no change there. On A, Ember on Hills gets
     the dark keyline where `keylineFor` picks the light one; both pass. The game uses `keylineFor`, as docs/09 says.
6. **Repo docs and content: no change unless the owner picks B.** If they do:
   - Change the fill line in `docs/09-art-direction.md`, `src/content/terrain.ts` and the mockup's `TERRAIN`.
   - Update final.md §1.1, H1, the §1.4 table and §10.2 question 6. They say muting breaks the rule; B is a
     non-uniform muting that keeps it.
   - Add a numbers row to `docs/09-balance.md`.
   - `palette.test.ts` needs no change; a replica of it passes on B, as measured below.

## The rule it meets

**docs/09, exactly, with nothing relaxed.**

- Every pair of terrain fills differs by at least CIEDE2000 20 for normal vision and 12 under simulated protanopia,
  deuteranopia and tritanopia.
- Every nation banner's ownership band reads on every fill: the banner differs from the fill, or the keyline differs from
  both, at those minimums. This holds for all 11 banners, not only the 8 the test checks.
- Every keyline has a WCAG contrast of 3:1 or more against its fill.

**The approved companions, all held:**

- 20 / 12 for every terrain pair in every Ownership state: raw, haze 4%, out of sight 10%, ash 10% and moss 6% (R17, R18).
- The band rule on every painted variant in every state, and at the deepest point of the edge pool.
- H13's floor of 19.5 / 11.0 at v3's mottle.
- Granite and mere at 20 / 12 from every fill in every state (R15).
- R16's mode colors at 20 / 12 direct against both grounds.
- Region ink at 3:1 or more; settlement kit, stone and camp tones at 3:1 or more; the wild edge at 3:1 or more.

**My own search constraints.** These are design choices, and they bind:

- Each terrain keeps its keyline and its label-ink set.
- Every fill stays at least 7.2 / 2.2 from the frozen mode bases.
- Track line average is 1.8:1 or more on the fill; the dot peak is 2.5:1 or more on painted ground.
- Every keyline is 4:1 or more against its fill.
- Every ΔE threshold has a margin of 0.15.

**How it was found.** A seeded (1+1) annealer over CIELAB, moving one fill per step with incremental re-evaluation,
20,000 steps per run (`decide/search.ts`).

- Objective: the sum of squared CIEDE2000 distances to the texture proposal's fills, with all of the above as penalties.
- 18 runs. B is round 1, seed 2. A run with lightness weighted at half (round 2) and a run with Mountains and Forest
  weighted double (round 4) both returned it unchanged.
- This is the best of 18 seeded runs, not a proof of optimality.

**One criterion is lower than today: how close the fills come to data-mode colors.**

- Approved: 7.2 normal, 2.2 under a deficiency.
- B: 5.3 normal (Farmland against the ramp's 4th stop #E6AC6E) and 0.7 under a deficiency (Wasteland against the ramp
  near #B77D94).
- Both proposals are under today's floor too: strict 2.9 / 1.3, texture 7.3 / 1.4. The texture proposal's claim of 3.0
  holds only at the five stops, not between them.
- Why the risk is low:
  - A data mode never draws a terrain fill, so the two are never on screen together.
  - The decoration fades in data modes (R23).
  - The mode is named in the UI.
- A measured fix exists (owner question 2): stops 3 and 4 at #9196A3 and #E0AD85.
  - It gives 7.2 / 2.2 with the approved fills and 7.4 / 2.6 with B.
  - R16's checks still pass: adjacent stops 13.2, 17.9, 26.3 and 18.0 apart; every mode color 20 / 12 direct against
    both grounds (168 of 168).

## Measurements

A = approved fills, S = strict proposal, T = texture proposal (fills only, on v3's paint unless marked), B = this
decision. The paint figures use v3's PAINT recipe.

The three tables share one rule. A dagger (†) marks a figure that is under its threshold, or lower than A's where the
row has no threshold. Bold marks B.

| Muting | A | S | T | B |
|---|---|---|---|---|
| Mean OKLCH chroma | 0.075 | 0.058 (77%) | 0.043 (57%) | **0.050 (66%)** |
| Loudest fill (OKLCH C) | 0.149 Farmland | 0.108 Farmland | 0.085 Farmland | **0.094 Farmland** |
| Mean CIELAB C\* | 30.1 | 22.0 | 16.7 | **19.3** |
| Mean chroma outside OKLCH hue 60 to 140 (teal, blue, rose) | 0.022 | 0.020 | 0.009 | **0.013** |
| RMS ΔE from T's fills | 9.3 | 6.7 | 0 | **4.1** |
| RMS ΔE from A's fills | 0 | 6.7 | 9.3 | **9.2** |

Reading the muting table:

- B moves as far from A as T does (9.2 against 9.3).
- Most of the move is in the hues that make the board: Swamp 12.7, Farmland 11.7, Wasteland 9.1.

| Color-blind safety (normal / protan / deutan / tritan, or normal / worst deficiency) | A | S | T | B |
|---|---|---|---|---|
| Raw fills, the repo test (need 20 / 12) | 22.3 / 14.9 / 14.8 / 14.8 | 23.0 / 14.7 / 15.2 / 14.4 | 16.2† / 11.5† / 12.8 / 11.4† | **22.2 / 14.8 / 15.8 / 14.2** |
| Every pair across the 5 Ownership states | 20.5 / 12.2 | 20.1 / 12.1 | 14.6† / 9.3† (178 pairs under) | **20.2 / 12.2** |
| H13 floor, mottle at the 0.55 peak (need 19.5 / 11.0) | 19.6 / 11.4 | 19.5 / 11.1 | 14.0† / 8.5†; own mottle 12.4† / 3.9† | **19.7 / 11.3** |
| Band rule, the test's 8 M1 banners (direct / keyline / fail) | 43 / 13 / 0 | 45 / 11 / 0 | 44 / 12 / 0 | **43 / 13 / 0** |
| Band rule, all 11 banners on flat fills | 61 / 16 / 0 | 63 / 14 / 0 | 63 / 14 / 0 | **62 / 15 / 0** |
| Band rule, 11 banners × painted variants × 5 states (2,530 pairs) | 2073 / 457 / 0 | 2067 / 463 / 0 | 2122 / 408 / 0 | **2029 / 501 / 0** |
| Band rule at the deepest pool point × 5 states (385 pairs) | 0 fail | 0 fail | 0 fail; own recipe 1 fail† (Umbra #3D2B4F, M2) | **0 fail** |
| Granite #2A292C, every fill and state | 20.5 / 13.1 | 21.0 / 13.6 | 20.5 / 13.0 | **20.6 / 13.0** |
| Mere #24222A, every fill and state | 24.2 / 14.6 | 24.5 / 14.4 | 24.3 / 14.4 | **24.1 / 13.9** |
| Page `?paintcheck`, Far full-decoration pairs | 22.2 / 13.9, 0 under | 21.6 / 13.2, 0 under | 16.1† / 10.6†, 8 under | **21.8 / 13.3, 0 under** |
| Fills against data-mode colors (frozen bases, approved ramp) | 7.2 / 2.2 | 2.9† / 1.3† | 7.3 / 1.4† | **5.3† / 0.7†** |

| Readability (WCAG) | A | S | T | B |
|---|---|---|---|---|
| Lowest keyline contrast (need 3) | 4.53 | 4.78 | 4.66 | **4.76** |
| Lowest place name with its halo, on painted ground | 10.72 | 10.65 | 10.47 | **10.66** |
| Region ink at 90%, worst on paint × states (need 3) | 3.12 | 3.02 | 2.67†; own recipe 2.35† | **3.05** |
| Tracks on Mountains, dot peak / line average (R34 footpath 3.00 / 1.80) | 4.66 / 1.97 | 4.34 / 1.92 | 5.72 / 2.10 | **5.93 / 2.13** |
| Tracks on Wasteland, worst interior paint, peak | 2.63 | 2.54† | 2.21†; own recipe 1.92† | **2.56†** |
| Wild edge, best of granite and rim, lowest | 4.14 | 4.36 | 3.91† | **4.34** |
| Settlement kit, best tone, lowest (need 3) | 3.09 | 3.02 | 3.00 | **3.03** |
| Banner and pewter tokens under 20 / 12 on the flat token zone | 19 | 17 | 17 | **18** |
| `__mock.checks()`: wrong hits, names placed, names over tokens, stable redraw | 0 / 200, 90%, 0, yes | same | same | **same** |

Also measured for B:

- Every M1 band pair that needs its keyline gets it: Ember on Farmland is dark; Thornwood on Forest and Hills is light.
- The 10% out-of-sight grey moves Plains by 0.65 (A: 1.26) and Swamp by 0.55 (A: 0.69). Fog reads a little more subtly on
  Plains.
- Plains is 8.8 from the cloth (A: 13.5). The neatline separates them.
- At the deepest point of the edge pool, the closest fill comes within 13.5 / 10.1 of granite (A: 17.4 / 9.6). This is
  for information only: the wild keeps its 3 px contour and light rim.
- Flecks sit 23.5 to 39.8 from their fills; stamp faces sit 6.8 to 19.7 from theirs.

**What I re-measured of the proposals.**

- The strict proposal's figures all reproduce.
- The texture proposal's figures reproduce, except:
  - its data-mode floor under a deficiency: 1.4, not 3.0;
  - its Wasteland region ink: 2.67:1 at 90% on v3's paint by the extremes model, and 2.35:1 with its own recipe. It
    reports 3.04 on measured pixels before its halo change.
- Neither proposal's figures could be checked against the game or the repo's own tests, because both are read-only for
  this work.

## What the owner is asked to decide

1. **Land colors: A, the approved bright fills (default), or B, the painted fills.**
   - Both keep the colorblind rule.
   - B is the muted, earthy start view: slate marsh, tan fields, mauve-grey barrens, pale grass, light slate peaks.
   - Look at it at the start zoom, at Near, at Far, and with the Vision preview (`ab-start.png`, `ab-cvd.png`).
   - §10.2 question 6 already asks about Farmland's color. If B wins, this question replaces it.
2. **Only if B wins: the data-mode ramp.**
   - Keep it: B's Farmland and Wasteland sit closer to some data colors, but they are never on screen together.
   - Or move stops 3 and 4 to #9196A3 and #E0AD85: data modes then stay as far from the fills as today, and R16 still
     holds.
3. **Not asked now, by design.** The toggle changes color only. Two kinds of change are left out:
   - **Paint strength:** the strict proposal's stronger tooth and granulation, and the texture proposal's wash inside the
     label and seat zones with a deeper edge pool. Paint strength is a separate A/B, after the critique's drawing fixes.
   - **A further step down in chroma** (the texture palette itself, about 57% of today's): it needs the relaxed 14 / 9
     rule and a "Clear colors" setting. Offer it only if the owner still wants more muting after seeing B.

Both proposals note the same limit, and it holds for B too. The start view gets quieter, but the hand-drawn feel at the
start zoom comes mostly from drawing (stamps, canopy, ranges, lettering), not from the land colors.

## Risks and what was not verified

- **Taste.**
  - Mountains in B are a light slate blue, more chromatic than today. That is the price of a quiet Farmland.
  - Forest is darker (L\* 23.7 against 29.8).
  - Swamp is near-neutral, so it relies on its reeds and streaks for character.
- **Thin margins, as with the approved palette.**
  - Every Ownership state: 20.2 / 12.2.
  - H13: 19.7 / 11.3.
  - Region ink: 3.05.
  - Thornwood kit on Swamp: 3.03.
  - Any later change to paint, state caps, banners or kit tones has to re-run these checks (`decide/report.ts`).
- **Tracks.** Wasteland's worst interior dot peak is 2.56 against today's 2.63. Wasteland was already the lowest terrain,
  and it is not the passability channel.
- **The renders are not the built A/B.**
  - They use the texture proposal's hook (`decide/mock-pal.html`, built from the untouched parts by `gen-hook.py`).
  - That hook draws three ground marks 0.05 more opaque than v3.
  - The A/B itself is not built, and Near views of B were not shot.
- **Not run:** the game, the repo's test suite (the repo is read-only here; a replica of `palette.test.ts` passes on B),
  and the owner's eye.
- **Performance was not measured.** The machine is shared with a test job and my own searches loaded it. B changes no
  paint stage, so no cost change is expected.

## Files

All under `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/palette-ab/`:

- **Deliverables:**
  - `decision.md`: this file.
  - `painted-fills.json`: A and B fills, plus the ground-mark steps.
  - `ab-start.png`: A, B and the reference at the start view.
  - `ab-cvd.png`: A and B under protan, deutan and tritan.
  - `candidates.png`: A, S, T and B.
- **`decide/`:**
  - Measurement:
    - `ev.ts`: the checks. It uses the repo's colorMath and colors, copied unchanged.
    - `report.ts`, which writes `report-AST.out`, `report-syn.out`, `report-r4.out` and `report-chosen.out`.
    - `extra.ts`: flecks, faces, fog visibility and keylines.
    - `heat.ts` and `ramp.ts`: the data-mode ramp.
  - The search: `search.ts`, with every run in `runs/`.
  - Renders: `gen-hook.py` (copied from the texture proposal), `mock-pal.html`, `render.cjs` and `compose.py`.
  - Shots and page checks: `shots/`, `shots2/`, `shots3/` and `shots4/`, each with its `render.json`.
  - `palettes.json`: every palette measured.
