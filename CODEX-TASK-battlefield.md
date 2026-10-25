# Task: the battlefield art pass, plan and prototype

Start from branch `claude/art-workspace`. Work on your own branch, for example `codex/battlefield`, and open a pull
request into `claude/art-workspace`. Read `AGENTS.md` first. Do not ask questions mid-task. Where the docs are silent,
take the simplest deterministic option and write it down in the plan.

## Why

The owner has approved painted troops, commanders, creatures and gods for the battle replays. The art plan has the
details, and the gallery shows them all: https://claude.ai/artifact/2naivdtCGfwiZnnAa1Gqtd (private; your sandbox
may not open it, and it needs nothing from it). The battlefields under them are still procedural.
`scratchpad/visual-v4/src/50-ground.js` paints one muted colour per terrain with small details. The owner wants the
battlefields to get "the same art pass and accuracy" as the units.

"Accuracy" here means five things:

1. **True to the battle:** its terrain, its month's season, its time of day, and the fort in a storm, all from
   `battle-data/battles.json` (`terrain`, `month`, `storm`, `province`, `id`).
2. **True to the simulation:** nothing on the field suggests cover, a chokepoint or a favoured side that the
   simulation does not model.
3. **True to the camera and scale:** the same camera, light and scale as the painted figures. A man is 28 wu; ground
   ellipses are squashed to 0.643; one light falls from the upper left.
4. **Readable:** the armies stay the strongest thing on screen.
5. **True to the map:** a terrain looks like the same land the campaign map shows for that province.

## Read first

- `reference/docs/design/battle-overhead.md`:
  - §3.7 "Terrain scenes": the grounds table and the six placement rules (no object taller than 6 wu inside the field;
    rivers, roads, trees, cliffs and buildings only outside the field plus an 80 wu margin; forest is a clearing;
    swamp puddles balanced; the fort only in a storm);
  - §3.8 "The value and chroma rules": ground L\* 58 to 78 and OKLCH C at most 0.06; every block's mean L\* at least 15
    below its ground;
  - and how the field rect and the camera are laid out.
- `reference/docs/design/battle-overhead.owner-answers.md`: the owner's rulings.
- `scratchpad/visual-v4/units/art-plan.md`: §1 (style lock: the painted hand, light, value against the ground), §2
  (camera references), §8 (the generation, keying and packing pipeline you would plan for).
- `scratchpad/visual-v4/src/50-ground.js` (today's ground), `00-util.js` (`streamFor`), `20-layout.js` (the field
  rect), `60-render.js` and `70-camera.js` (projection and zoom).
- `reference/docs/12-battle-presentation.md` S2.4, and `reference/docs/09-art-direction.md` (palettes and
  readability).
- For true to the map: `reference/docs/design/map-relief.md`, `scratchpad/visual-v4/natural/design-final.md` (the
  natural look's terrain materials and colours) and `scratchpad/visual-v4/natural/pass4/design-final.md` §5 (rivers,
  roads, fords and bridges per province).

## Do

### 1. The plan

Write `scratchpad/visual-v4/battlefield/battlefield-plan.md`. It covers:

- **Every terrain and season:** plains, farmland, forest, hills, mountains, swamp and wasteland, in summer, autumn and
  winter, plus the storm fort. For each, describe:
  - the painted ground material: tileable textures, large-scale variation that stays within §3.7's L\* spread,
    detail decals inside the field;
  - the scenery outside the field as painted cutouts at the battle camera: trees, rocks, hedges, fences, ruins,
    rivers, roads, bridges, cliffs, reeds;
  - the fort's walls and rubble.
- **How a battle's ground is chosen:** from its terrain, its month and its province's features on the map (rivers,
  roads, bridges, settlements, Wellsprings, wild edges). Every placement follows §3.7.
- **Determinism:** everything comes from `streamFor(battle, 'scene')`. The same battle gives the same pixels.
- **Readability:** the §3.8 limits, plus how you will measure every block of both nations and the independents on
  every ground.
- **Cost:**
  - one baked ground texture per battle;
  - texture memory per tier (S and H, as the art plan's §8.4 does for figures);
  - draw calls;
  - the frame-time budget (unchanged from today).
- **The asset list:** count, size, tier, key colour or background, and blend for each asset.
- **The generation list:** prompts written to the art plan's style sentence (§1.6), the references for each prompt,
  the model, and a budget with re-rolls. You generate nothing in this task.
- **Review stages for the owner,** each ending with a decision.

### 2. The prototype

In `scratchpad/visual-v4/battlefield/proto/`, build a standalone page (PixiJS 8.22, as the mockup uses) with these
parts:

- **Each battle's field at play zoom (a man about 28 to 34 px) and close (about 4×),** using the new ground pipeline
  with placeholder materials. Make them procedurally or from existing painted assets in the workspace; no new image
  generation.
- **A terrain-by-season switch,** so every combination in the plan can be seen, not only the three battles'.
- **The existing painted figures standing in formation on top.** Take the stage B and C atlases under
  `scratchpad/visual-v4/units/stage-*/atlas/` (restore them as PNG with `restore.sh`, or read the `.png.webp` pages
  directly). This is for measuring the §3.8 value rule on rendered pixels for each terrain, season and nation.
- **Checks on `window.__proto`:**
  - determinism: the same seed gives identical pixels;
  - the value rule per combination;
  - nothing taller than 6 wu inside the field;
  - no scenery inside the field plus its margin;
  - frame time and texture memory.
- **Screenshots** in `battlefield/shots/` of every terrain and season and of the three battles, at both zooms. Look at
  every one yourself and fix what reads wrong.

### 3. For the owner

Write `battlefield/report.md`, covering:
- what you built;
- the measurements;
- what you did not verify;
- the questions the owner must answer before any image is generated, each with a recommended default (for example
  how much scenery, how strong the seasons are, the material looks).

## Constraints

- **Files:** touch nothing outside `scratchpad/visual-v4/battlefield/`. The battle mockup's `src/`, the map's
  `parts/` and the approved art are being worked on, or are final. Hooking the new ground into the mockup comes after
  the owner's review.
- **No image generation.** No API key is available to you. Never put one in a file.
- **Determinism:** no `Math.random` or `Date`.
- **File size:** keep files under 400 lines.
- **Prompts:** follow `AGENTS.md`'s art rules (no franchise, game, studio or artist names; never the owner's
  references).

## Done when

The plan, the prototype with its checks passing, the screenshots and the report are in one pull request into
`claude/art-workspace`. Its description lists the files, the measurements and the open questions.
