# Fluid Magic: guidance for the implementing model

Read `docs/00-vision.md` and `docs/10-milestone-1.md` first, then the doc for the phase
you are working on. The docs are the specification. When a doc is silent, choose the
simplest option that keeps the simulation deterministic and record the decision in
`docs/09-balance.md` (numbers) or at the bottom of the relevant doc (rules).

## Non-negotiables

- `src/sim/**` and `src/mapgen/**` import nothing from `render`, `ui`, Pixi, React, or
  the DOM. They never call `Math.random` or `Date`. All randomness goes through
  `state.rng`. A determinism test guards this.
- Content is data under `src/content/**`. No game numbers hard-coded in sim code; the sim
  reads them from the content registry. Spells are composed from the primitives listed in
  `docs/02-magic.md` section 5.
- Every command passes through `validate` before `apply`; the AI uses the same commands as
  the player.
- TypeScript strict, no `any`, no non-null assertions outside tests.
- Tests live in `tests/` mirroring `src/`. The sim gets unit tests; the UI gets smoke tests
  only where cheap.

## Workflow

- Follow the phase order in `docs/10-milestone-1.md`. Finish a phase, make its tests pass,
  run `npm run typecheck && npm run lint && npm test`, commit with a message starting with
  the phase name (e.g. `Phase 4: battle resolver with replay log`).
- Keep a short `docs/PROGRESS.md` updated at the end of each phase: what is done, what
  deviates from the docs, known issues.
- Prefer small modules over large ones. A file over 400 lines is a signal to split.
- When adding a unit, spell, or chassis, add it to the content validation test fixtures.
- Playtest in the browser from Phase 8 on. Fix what feels wrong before adding features.

## Commands

```
npm run dev        # Vite dev server
npm run build      # production bundle
npm test           # vitest
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run sim:aivai -- --games 20 --seed 1   # headless AI vs AI
```
