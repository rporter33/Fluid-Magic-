# Fluid Magic art workspace: guide for coding agents

This branch (`claude/art-workspace`) is a storage snapshot of the art and mockup workspace of Fluid Magic, a browser
grand-strategy game. The game itself lives on branch `claude/gifted-meitner-v8l3qv`. Copies of the game docs a
mockup task needs are in `reference/` (taken at game commit 4f7b99d). The game branch is authoritative when they
differ. Start with `reference/CLAUDE.md` (the project rules, which bind every agent), `reference/AGENTS.md` and
`reference/docs/HANDOFF.md` (where every track stands, and the owner's open decisions). Then read `README.md` here.

## What is here

| Path | What |
|---|---|
| `scratchpad/visual-v4/src/*.js`, `page.html`, `build.py` | the battle mockup. `python3 scratchpad/visual-v4/build.py` writes `battle-mockup.html`: a PixiJS 8 replay of three battles (a, b, c), every visual a pure function of story time |
| `scratchpad/visual-v4/battle-data/battles.json` | the three battles the simulation fought (terrain, month, province, sides, the replay log) |
| `scratchpad/visual-v4/map/parts/`, `map/build.sh` | the game-screen map mockup. `sh build.sh` writes `game-screen-v4.html` |
| `scratchpad/visual-v4/units/` | the painted-units art: `art-plan.md` (style lock, camera, pipeline), `tools/` (generation, keying, packing, checks), `stage-a` to `stage-d`, atlases, `gen-log.tsv` |
| `scratchpad/visual-v4/natural/` | the map's natural-landscape design and passes (pass 4 in `natural/pass4/`) |
| `scratchpad/gallery/` | the builder of the shareable art gallery |
| `vendor/pixi.min.js` | PixiJS 8.22.0, for testing pages offline (the mockups load it from jsDelivr) |

`build.py` and `build.sh` use relative paths and run in place. Many art tools name the original absolute path
`/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad`. `restore.sh` restores the
workspace there, or links that path to where you restored it. Atlas pages are stored as `*.png.webp`, and
`restore.sh` turns them back into PNG.

## Testing pages

- **Playwright with Chromium.** Use a system Chromium if one exists. Otherwise install Playwright's Chromium in the
  environment's setup step. In Codex cloud the setup script installs Playwright 1.56.1 and its Chromium under
  `/opt/pw`. Run Node scripts with `NODE_PATH=/opt/pw/node_modules` (set in the environment's variables) so
  `require('playwright')` resolves.
- **PixiJS offline.** If the sandbox has no network, route `https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.js`
  to `vendor/pixi.min.js` with `page.route`.
- **Look at the screenshots yourself.** Checks alone do not prove a visual.

## Rules

- **Do not edit the files in flight.** From 2026-10-29 Claude resumes the battle mockup's animation in
  `scratchpad/visual-v4/src` and map pass 4 in `scratchpad/visual-v4/map/parts`.
- **Owner-approved art is final.** Do not regenerate, re-key or re-pack it unless the task says so.
- **New images go through the pipeline and need approval.** Generate only through
  `scratchpad/visual-v4/units/tools/gen.py`, which enforces each stage's budget and logs every call, and only when a
  task allows it. The API key lives only in the environment's secrets: never in a file, a commit, a log or a message.
- **Prompts and references.** Image prompts never name a franchise, a game, a studio or an artist. Never copy, trace
  or use the owner's reference screenshots.
- **Determinism.** Any randomness in a mockup comes from the seeded streams (`streamFor(battle, purpose)` in
  `src/00-util.js`). Never use `Math.random` or `Date`; `build.py` refuses both.
- **File size.** Keep files under 400 lines.
- **Branches.** Work on your own branch made from `claude/art-workspace` and open a pull request back into it. This
  branch is never merged into the game branch.
- **Report honestly.** Say what you verified and what you did not.

## Ready-made task

`CODEX-TASK-battlefield.md`: the battlefield art pass, plan and prototype.
