# Fluid Magic: guide for coding agents

This file is for any coding agent working in this repository (Codex reads it automatically). It does not replace
`CLAUDE.md`: those rules bind every agent here, whatever its vendor. When this file and `CLAUDE.md` or `docs/**`
disagree, `CLAUDE.md` and the docs win.

## The project in one paragraph

Fluid Magic is a browser grand-strategy game in TypeScript. Two to four nations, each led by a pretender god, fight
over a generated map of provinces with armies, commanders, magic in five colours, dominion and Wellsprings. It has
three parts:

- **A deterministic simulation:** `src/sim`, `src/mapgen` and `src/ai`, fed by data in `src/content`.
- **A PixiJS 8 renderer.**
- **A React UI.**

Battles are resolved by the simulation and replayed as a painted, animated scene. The owner (the person who runs
this project) directs the design and art. Their decisions are recorded in `docs/design/*.owner-answers.md`. Never
invent an owner decision. When the docs are silent, take the simplest deterministic option and record it, as
`CLAUDE.md` says.

## Read first, in this order

1. `CLAUDE.md`: the non-negotiables and the workflow.
2. `docs/HANDOFF.md`: where every track stands right now, what is in flight, and the owner's open decisions.
3. `docs/00-vision.md`, `docs/10-milestone-1.md` (the phases and acceptance criteria) and `docs/PROGRESS.md` (what is
   built, deviations, known issues).
4. The doc for your area:

| Area | Doc |
|---|---|
| Map, provinces, terrain, movement, economy | `docs/01-core-rules.md` |
| Magic, spells, rituals, spell effects as data | `docs/02-magic.md` |
| Nations and units | `docs/03-nations.md` |
| Battle resolution | `docs/04-battle.md` |
| Pretender gods, dominion, Wellsprings | `docs/05-pretender.md` |
| Architecture, save and load, rendering, camera | `docs/06-architecture.md` |
| UI and the map's presentation | `docs/07-ui.md` |
| AI | `docs/08-ai.md` |
| Art direction, palettes, spell effects | `docs/09-art-direction.md` |
| Every number and why it changed | `docs/09-balance.md` |
| Battle replay presentation (timeline, effects, sound) | `docs/12-battle-presentation.md` |
| Design records behind the docs | `docs/design/` (read the matching `*.owner-answers.md`) |

## Repository map

| Path | What |
|---|---|
| `src/sim` | the pure, deterministic simulation (commands validate then apply; `state.rng` is the only randomness) |
| `src/mapgen` | map generation (pure, seeded) |
| `src/content` | every game number and definition as data (units, spells, nations, rules, effects) |
| `src/ai` | the AI, which issues the same commands as a player |
| `src/ui`, `src/main.tsx` | the browser front end (Phase 8 builds most of it) |
| `src/assets/raster` | committed raster art (portraits), under a size budget (`docs/09-balance.md`, "Raster art") |
| `scripts/` | `aivai.ts` (headless AI against AI, presets, matrix), `duel.ts`, `golden-battle.ts` |
| `tests/` | Vitest, mirroring `src/` |
| `tools/art/` | the image-generation wrapper (needs an API key in the environment) |
| `art-source/` | the owner's references. Never copy, trace or reuse them |
| `docs/` | the specification |

## The gate

```
npm ci
npm run typecheck && npm run lint && npm test
```

- CI runs the same gate on every push and pull request (Node 22; `package.json` asks for Node 22.12 or newer),
  then `npm run test:perf` for serial, quiet-run wall-clock acceptance.
- `npm run lint` runs ESLint and `prettier --check` on code. Markdown, `docs/design/` and `art-source/` are excluded
  from prettier.
- Timing checks in `npm test` use isolated-process CPU medians; `npm run test:perf` additionally enforces elapsed
  budgets on a quiet runner. Heavy correctness sweeps retain their assertions and finite watchdogs. See
  `docs/qa/timing.md` for measurement contracts and `docs/qa/task3-results.md` for load reproduction. A failing run
  is still a failed gate: record it and investigate; a passing retry does not erase the failure.
- Never skip, disable or loosen a test to get green.

Useful commands: `npm run sim:aivai -- --games 20 --seed 1` (the runner), `npm run sim:aivai -- --matrix` (the preset
matrix), `npm run sim:duel`, `npm run dev`.

## Branches and pull requests

| Branch | Rule |
|---|---|
| `claude/gifted-meitner-v8l3qv` | the working game branch. Do not push to it. Open a pull request into it from your own branch |
| `claude/art-workspace` | a storage snapshot of the art and mockup workspace. It is never merged into the game branch. Mockup work goes on a branch made from it, with a pull request back into it. It has its own `AGENTS.md` |
| `main` | not touched by agents |

- One task per branch and per pull request, kept small.
- Commit messages start with the phase or area name (`Phase 9: ...`, `Phase 12 prep: ...`, `Docs: ...`).
- Update `docs/PROGRESS.md` when a phase step is finished.
- The pull request says what changed, how it was verified (commands and numbers), and what was not verified.

## Work in flight that you must not touch

From 2026-10-29 Claude resumes two tracks in the art workspace branch:

- the battle mockup's animation, in `scratchpad/visual-v4/src`;
- map pass 4, in `scratchpad/visual-v4/map/parts`.

Do not edit those files. Do not regenerate, re-key or re-pack owner-approved art unless a task says so.

## Art, security and honesty rules

- Image prompts never name a franchise, a game, a studio or an artist.
- Never copy, trace or use the owner's reference screenshots as inputs.
- No secrets in files, commits, logs or messages. API keys live only in the environment's secret settings.
- Visual work needs looking: render it, screenshot it and look at the images. Automated checks are necessary but not
  enough.
- Report what you verified and what you did not. A finding names the file and line, a concrete input that fails,
  and why it matters; leave out speculation.

## Ready-made tasks

`docs/codex/TASKS.md` holds self-contained task prompts, and `docs/codex/SETUP.md` explains how to run them in Codex
cloud. Start a task with: "Read AGENTS.md, then do Task N in
docs/codex/TASKS.md."
