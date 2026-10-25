# Ready-made tasks for coding agents

Each task stands alone. Start one with:

> Read AGENTS.md, then do Task N in docs/codex/TASKS.md.

Tasks 1 to 4 run on the game branch: start from `claude/gifted-meitner-v8l3qv` and open a pull request back into it.
Task 5 runs on the art workspace: start from `claude/art-workspace`; its full text is in that branch's
`CODEX-TASK-battlefield.md`. Every task follows `CLAUDE.md` and `AGENTS.md`. Do not ask questions mid-task. Where the
docs are silent, take the simplest deterministic option and record it as `CLAUDE.md` says.

---

## Task 1: independent code review (report only)

**Goal:** a second opinion on the newest game code, from a reviewer who did not write it. Find real defects; change
no code.

**Scope:**
- **Save loading** (commits c584eab and d649f12): `src/sim/serialize.ts`, `migrate.ts`, `validateSave.ts`,
  `saveCheck.ts`, `saveKeys.ts`, `loadError.ts` and their tests in `tests/sim/`. Spec: `docs/06-architecture.md`,
  "Save and load".
- **Map-generation hardening** (commit abc005e): `src/mapgen/generate.ts`, `terrain.ts`, `voronoi.ts`, `names.ts`,
  `wilds.ts`, `src/content/mapgen.ts` and their tests. Spec: `docs/01-core-rules.md` decisions and `docs/10` Phase 1.
- **Spell effects as data** (commit 52ca041): `src/content/fx.ts`, `src/content/spells/*`, `src/sim/battle/rerun.ts`
  and their tests. Spec: `docs/02-magic.md` and `docs/09-art-direction.md`, "Spell effects", and `docs/12` S2.10.

**Look for:**
- wrong results and crashes on reachable inputs;
- determinism leaks (any `Math.random`, `Date` or iteration-order dependence in `src/sim` or `src/mapgen`);
- places where the code disagrees with its spec;
- missing tests for real paths;
- `any` or non-null assertions outside tests;
- files over 400 lines.

**Rules:**
- Verify every finding before reporting it, with a failing test you ran or a concrete input and its wrong output.
- Rank the findings by severity.
- Leave style preferences out unless `CLAUDE.md` names them.

**Deliverable:** one pull request that adds only `docs/reviews/codex-review-2026-10.md`. For each finding give:
- file and line;
- what is wrong;
- the failing input or test;
- severity;
- a suggested fix.

End with what you checked and found sound. The gate must pass.

---

## Task 2: preset matrix scored against a same-seat baseline (tooling only)

**Why:** `docs/09-balance.md` (rows "Preset matrix (6b.3)" and "Preset matrix with wilds (Phase 1b)") shows that the
default-against-default baseline itself leans by nation and seat. Presets of both nations therefore cannot meet the
35% to 65% band. The log's advice is to score each preset against the same-order default baseline.

**Do:**
1. Before changing anything, run and save `npm run sim:aivai -- --games 20 --seed 1` and
   `npm run sim:aivai -- --matrix`.
2. In `src/ai/matrix.ts` and `scripts/aivai.ts`, add an opt-in scoring mode (for example `--baseline seat`). For each
   preset and each nation order, it shows the preset's win rate beside the default-against-default win rate in the
   same order, and the difference in points. Without the flag, the output stays exactly as it is.
3. Add unit tests for the new scoring next to the matrix's existing tests in `tests/ai/`.
4. Run the matrix with the new mode at the default seeds. Record it as a measurement row in `docs/09-balance.md` (no
   number changed). Add a short note to `docs/PROGRESS.md`.

**Must not change:** game rules, content numbers, AI behaviour, seeds or the existing output. After your change, both
runs from step 1 must reproduce game for game. Same arguments give the same output.

**Deliverable:** a pull request whose commits start with `Phase 12 prep:`. Its description gives the before and after
runs and the new table. The gate must pass.

---

## Task 3: make the timing-sensitive tests reliable under load

**Why:** on a busy machine (load average 10 to 17), about 17 tests failed locally from timeouts and timing
thresholds, while CI passes on a quiet runner. The gate should mean the same on every machine.

**Do:**
1. Reproduce the failures:
   - load every core (for example one `node -e "for(;;){}"` per core);
   - run `npm test`;
   - list each failing test and why it failed.
   Likely places: `tests/mapgen/generate.perf.test.ts`, the heavy sweeps `tests/mapgen/generate.termination.*.test.ts`,
   and tests with explicit timeouts.
2. Make each one reliable without weakening what it checks:
   - Where a test's real claim is about work done (draws, iterations, cells visited), assert the work and not the
     wall time.
   - Where a real time budget comes from the docs (for example `docs/10` acceptance criteria), measure the median of
     several runs and compare it with the budget plus headroom, with the headroom documented.
   - Size explicit timeouts from measurements, with the reason in a comment.
3. Record any changed budget in `docs/09-balance.md`, with the measurement behind it.

**Never:**
- skip, disable or quarantine a test;
- loosen a correctness assertion;
- weaken a performance budget the docs set.

**Deliverable:** a pull request whose commits start with the phase of the tests touched (for example `Phase 1: ...`).
The description lists each test, the cause and the fix, with the before and after runs under load. The gate must pass
both under load and on CI.

---

## Task 4: docs-versus-code audit (report only)

**Why:** the docs are the specification. A QA sweep on 2026-10-22 checked them against the code (`docs/PROGRESS.md`,
"QA sweep (2026-10-22)"), and much has landed since.

**Do:**
- Check every concrete claim against `src/` and `src/content`: numbers, rules, orderings, names, file layout and
  test claims.
- Cover:
  - `docs/01` to `docs/08`;
  - the built phases of `docs/10`;
  - `docs/12` S1 and S2;
  - the newest rows of `docs/09-balance.md`.
- List every mismatch with:
  - the doc file and line;
  - the code file and line;
  - which side looks right and why;
  - a suggested fix to the doc or the code.
- Also list "planned" or "later" notes for things that are now built, and built things the docs don't mention.

**Deliverable:** one pull request that adds only `docs/reviews/codex-docs-audit-2026-10.md`. Edit no doc and no code.
The gate must pass.

---

## Task 5: battlefield art pass, plan and prototype (art workspace)

The owner wants the battlefields painted to the same quality and accuracy as the units. Start from
`claude/art-workspace` and do the task in that branch's `CODEX-TASK-battlefield.md`. Open the pull request into
`claude/art-workspace`. This task generates no images; it plans them, and prototypes the ground with placeholder
materials.
