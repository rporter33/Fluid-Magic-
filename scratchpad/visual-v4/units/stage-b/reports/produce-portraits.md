I made none of the portraits. The image API turns down every call with HTTP 402 "Your prepayment credits are depleted", so I stopped and am reporting, as the task says to do when the API keeps failing. 0 of the 60 candidates exist, and none of them has been checked.

**Generations used: 9 of 80.** All 9 failed and returned no image. All are logged in `gen-log.tsv` with the purpose `B portraits: …`:
- 8 calls in wave 1: fireSprite.01a, warWolf.01a, titan-cinderHorde.01a and greatWyrm-cinderHorde.01a, two tries each with a 30 s back-off.
- 1 more try of fireSprite.01a after a 5-minute back-off, still 402.

Calls from the other stage B agents (troops, cmdA, cmdB) in the log fail the same way, each in under a second. The project's API billing has to be topped up before anything can be generated.

**What is ready to run once credits are back:**
- **Prompts and jobs:** 60 jobs (two candidates each for 30 subjects), the leader portrait template with the anchor as Image 1, all on gemini-nano-banana-2.1. No prompt names another game, franchise, artist or studio; the builder checks this.
  - Creatures (12): Fire Sprite (a flame face), Hornet Swarm (one large hornet), Wolf, Giant faces 01 and 02 (two candidates each), Oakheart (with the pine-green mantle). Every identity mark is named in the prompt.
  - Mounts (4): Ash Horse (iron face plate, soot-black mane, the ember caparison's edge) and War Wolf (bark breast harness, the green saddle blanket's edge). War Wolf candidate a is grey like the kept Wolf Rider test; candidate b has the darker coat from review change 11.
  - Gods (44): the whole body, three-quarter front, regal pose, variant 0 of every slot, swatch 0, the tint zone in the nation's cloth, top at about 6% and feet at about 94%. The 12 Thornwood candidates of the six generic gods are edits of the matching Cinder candidates that change only the tint zone, so both palettes show the same body (review change 7).
- **Order to run** (`waves.json`): 4 test jobs first (one creature, one mount, a biped god, a beast god) to look at and tune the prompts, then 44 new jobs, then the 12 Thornwood edits, then one re-roll per failing candidate. 60 calls leave 20 for re-rolls under the cap of 80; after these 9 failed calls, 11 remain.
- **Automatic checks:** gates set from the 136 approved leader portraits, so the approved set passes them.

  | Check | Gate | Approved set |
  |---|---|---|
  | Background, distance from `#1C1A17` | ≤ 10 | at most 4.6 |
  | Background plain (spread) | ≤ 8 | at most 5.0 |
  | Top of the subject, busts | 0 to 0.18 | up to 0.19 (tall headgear reaches the edge) |
  | Top and lowest row, gods | 0.01 to 0.14 and 0.80 to 0.995 | template 6% and 94% |
  | Subject centred | 0.33 to 0.64 | 0.41 to 0.51 |
  | Rim light | ≥ 0.30 | at least 0.32 |
  | Readable at 48 px (brightness above the background) | ≥ 12 | at least 14.4 |
  | Saturated share outside the allowed colour | ≤ 0.02 | at most 0.0185 |
  | Side colour (tint-zone subjects) | Cinder ≥ 0.03; Thornwood ≥ 0.05 in the green range and ≥ 0.01 at the cloth's hue | kept Warden bust: 0.42 and 0.047 |

  Facing and the identity marks are ticked by eye; each candidate's sidecar lists its marks for that.
- **Output:** each candidate goes to `stage-b/portraits/<nation>/<unit>/<face><cand>` at 512, 256 (24 KB or less) and 64 px (4 KB or less), with a sidecar in the leader portraits' format plus the checks, marks, swatches and card crop. A god's 64 px file is its card crop, proposed automatically and overridable.
- **Contact boards and index:** one board per group (creatures, mounts, generic gods, Cinder gods, Thornwood gods), currently all showing "not generated" with the reason. The index lists all 60 jobs as not generated. The 64 px atlas is packed once portraits exist.
- **Dry run:** the measuring, file writing, card crop and boards were tested on stand-ins (approved Salamander 01, Treant 02, and a pilot frame on the portrait background). That output is in `work/portraits/dryrun/` and is not a deliverable.

**Decisions I made where the docs are silent** (to record when the owner approves):
- **Material family per chassis, swatch 0:**
  - skin (ash): Oracle, Titan, Ascended Hero, Pyre Lord, Ember Hierophant;
  - scale (bronze): Great Wyrm, Elder Wyrm;
  - stone (granite): Living Monolith, Cinder Idol;
  - hide (brown): Primordial, Wild Spirit, Horned Hunter, Mother of Beasts;
  - ember (coal): Ash Colossus, Ash Phoenix;
  - bark (oak): World Tree.
- **Tint zone on bodies with no cloth:**
  - wings: the Great Wyrm's membranes, the Ash Phoenix's flight feathers;
  - moss on the back: Primordial and Elder Wyrm (ember-orange lichen in the Cinder palette);
  - glyph pigment: Living Monolith, Cinder Idol;
  - leaves: the World Tree's canopy, the Wild Spirit's ruff;
  - a cloth kilt: Ash Colossus.

Nothing in the repo was changed, and the shared tools are untouched; my tools are in `stage-b/work/portraits/tools/`.

Files are in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/`:
- `work/portraits/jobs.json`
- `work/portraits/waves.json`
- `work/portraits/prompts/`
- `work/portraits/tools/pt_prompts.py`
- `work/portraits/tools/pt_run.py`
- `work/portraits/tools/pt_checks.py`
- `work/portraits/tools/pt_post.py`
- `work/portraits/tools/pt_board.py`
- `work/portraits/tools/pt_reroll.py`
- `work/portraits/calib/calib.json`
- `work/portraits/calib/measures.json`
- `work/portraits/api-failures.json`
- `work/portraits/review/contact-creatures.png`
- `work/portraits/review/contact-mounts.png`
- `work/portraits/review/contact-gods-generic.png`
- `work/portraits/review/contact-gods-cinder.png`
- `work/portraits/review/contact-gods-thornwood.png`
- `atlas/portraits/index.json`
- `raw/portraits/` (empty)