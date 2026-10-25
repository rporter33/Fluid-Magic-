# Task 3: measured QA results

Measured 2026-10-25, America/Denver (the logs use October 26 UTC). Baseline:
`e2a9bcc3b504d2664e119fa9e9e19e0d7b550c9c`, branch `claude/gifted-meitner-v8l3qv`.
Implementation: `codex/task-3-load-reliable-tests`. No files under `src/`, gameplay numbers,
AI policies, golden fixtures, dependency versions, seed coverage, or simulation horizons changed.

## Environment and method

Linux 6.18.55, AMD EPYC 9V74, affinity CPUs 0–8 (9 logical CPUs), cgroup `cpu.max = 800000 100000`
(8 CPU quota), Node 24.22.1, Vitest 5.0.5. `npm ci` succeeded. Each stress process ran
`node -e 'for (;;) {}'`, pinned with `taskset` to one of the allowed CPUs. The first loaded run
used one burner per CPU (9); the stronger before/after runs used four per CPU (36).
All burners were stopped in `finally`; none remained after validation.

Load average is not CPU entitlement. The one-burner run reached a one-minute average of 13.03
without a failure; four burners per core reached 41.67 and reproduced three failures. This
reproduces the reported failure **classes**, not the exact approximately 17 failures on the
handoff's different machine. No failure is claimed for a test that passed here.

Full suite command: `npm test -- --reporter=default --reporter=json --outputFile=…`.
After runs included `npm run typecheck && npm run lint` **under the same load**, before the
complete test suite. [The reproduction recipe](timing.md#reproducing-cpu-contention-linux) gives
the pinned-load command and cleanup. The baseline was run from an unchanged detached worktree.
Separate quiet diagnostics added only console output to that worktree to expose successful
baseline performance values; they did not change an assertion or workload.

## Complete suites

| Version / condition | Burners | Passed / failed | Files | Vitest elapsed | Whole invocation |
|---|---:|---:|---:|---:|---:|
| Before, normal | 0 | 2,338 / 0 | 139 | 47.46 s | 48.04 s |
| Before, one burner per core | 9 | 2,338 / 0 | 139 | 75.08 s | 77.08 s |
| Before, heavy | 36 | 2,335 / 3 | 139 | 194.53 s | 198.31 s |
| After, normal gate | 0 | 2,347 / 0 | 140 | 34.63 s | 62.03 s |
| After, heavy gate | 36 | 2,347 / 0 | 140 | 178.25 s | 368.62 s |
| After, Node 22.23.4 normal compatibility gate | 0 | 2,347 / 0 | 140 | 36.95 s | 67.03 s |

All three final gates passed typecheck and lint. No pending, skipped, or todo tests. The nine added
tests validate the measurement helper; all 2,338 original tests remain. Whole invocation time
includes launcher overhead and, for the after gates, typecheck/lint; do not compare that column
as a performance benchmark. Different file orders, caches, and startup costs also affect suite
time. This change does not speed up the game.

## Every reproduced failure

| Test | Before under heavy load | Cause | Fix / after under the same load |
|---|---|---|---|
| `generate.perf.test.ts`: Medium with 4 nations, median of 10 seeds | **2,264.25 ms wall**, limit 1,000 ms | Scheduling time is included in the wall median even when generation code is unchanged | Same ten seeds and 1,000 ms limit: **335.38 ms CPU**, 1,813.06 ms wall reported separately. CI additionally enforces wall time serially |
| `tick.test.ts`: `runs a busy game the same way twice` | **6,238.15 ms**, 5,000 ms timeout | A correctness check's aggregate watchdog, not a speed requirement | Both 90-day games and byte equality retained; watchdog 15,000 ms (>2× measured baseline); after **4,935.35 ms** |
| `battle/rerun.test.ts`: worst immortal battle with detail | **109.55 ms wall**, even its best of five exceeds the existing 90 ms CI limit | Sustained contention defeats fastest-run selection | Median of all five: **17.59 ms CPU**, 92.99 ms wall. Existing 45+45 ms allowance retained; quiet wall acceptance remains mandatory |

The two-nation map, both resolver budgets, and heavy-day timing also used wall clocks. They
passed this baseline stress run but now use the same paired measurement contract to avoid the
same scheduling sensitivity. No unrelated numerical, game-time, or correctness assertion was
converted to a timing check.

## Performance measurements

Milliseconds, except the marching row which is milliseconds per simulated day. Before quiet
values use the original statistic (map median; fastest of three batches for tick/resolver;
fastest of five for replay). After uses medians as [documented](timing.md). The before and after
quiet commands each ran all **77 tests in the four files** with `--maxWorkers=1`; after's
`npm run test:perf` asserted **both elapsed and CPU limits**. All 77 passed.

| Workload | Before quiet wall | After quiet CPU / wall | After heavy CPU / wall | Target and allowance |
|---|---:|---:|---:|---|
| Medium, 2 nations | 9.05 | 19.08 / 10.20 | 20.11 / 79.71 | 150 ms, no added slack |
| Medium, 4 nations | 295.89 | 321.60 / 308.19 | 335.38 / 1,813.06 | 1,000 ms, no added slack |
| Heavy marching day | 1.00 | 1.82 / 0.87 | 2.25 / 6.56 | 2 ms wall; 4 ms summed CPU; old guard was 10 ms |
| Resolver, no mages | 1.14 | 2.53 / 1.37 | 3.13 / 11.33 | 50 ms, no added slack |
| Resolver, 8 mages | 1.38 | 2.72 / 1.44 | 3.51 / 7.48 | 50 ms, no added slack |
| Immortal replay with detail | 15.46 | 18.22 / 16.66 | 17.59 / 92.99 | Existing 45 ms + 45 ms CI allowance |

The quiet elapsed check is a separate mandatory CI step, not an optional replacement for a
failed full suite. Heavy-load elapsed misses remain visible in the records and are not claimed
to meet the user-facing latency target. CPU time includes all threads in the test fork; it can
exceed quiet elapsed time because V8 threads run in parallel.

## Work caps and timeout measurements

- All six termination sweeps retained their 100 seeds, exact province-count checks,
  `validateMap` checks, and 60 s watchdog. Slowest before: **18.95 s**; slowest after: **16.13 s**.
  Per-sweep values are included in the JSON evidence. There was no justification to increase them.
- The generator shortfall now asserts exactly `MAPGEN.maxAttempts` calls to the placement
  sampler, alongside its original thrown reason and unchanged normal map.
- The existing rejection sampler checks the RNG state after exactly `2 * pointTries` words.
  The RNG-efficiency test's own replay is now bounded at `2 * 40 * pointTries` words, with final
  state equality and its original <1.1 draws/point bound intact.
- No default timeout was globally raised. Only the reproduced busy-game watchdog changed.
  An event-loop timeout cannot preempt a synchronous infinite loop; the outer job deadline
  remains necessary.

## Measurement calibration and remaining limits

Two intermediate full-suite trials correctly failed a proposed 2 ms **summed CPU** assertion
for the marching fixture: 2.100 ms CPU / 1.303 ms wall and 2.007 / 1.253 ms. A fixed full-workload
warm-up passed a targeted loaded run but did not eliminate the process/thread distinction in
the next full suite. These failed trials are preserved in the JSON record as `after-normal`
and `after-normal-final`; they are **not** the final successful gates.

Summed process CPU was about 1.6× elapsed. The final CPU-only factor of 2 leaves about 25%
above that observed ratio, remains below the old 10 ms guard, and does not increase the
2 ms wall limit. The helper's regression test explicitly rejects a wall overrun despite this
CPU-only headroom. Map/resolver limits get no new slack; replay keeps only its documented slack.

An initial `test:perf` launcher attempt failed before any test started because the `tsx` CLI
could not create its IPC socket in this sandbox. The final command uses
`node --import tsx scripts/check-performance.ts`, which does not need that CLI socket.

CPU speed, cache/memory contention, GC/JIT behavior, thermal throttling, and runtime version
still affect CPU measurements. Infinite starvation, OOM, suspended processes, and arbitrary
hardware slowdowns cannot be solved by a finite watchdog. The full original set of approximately
17 failures was not available/reproduced; browser/laptop responsiveness and GPU rendering were
not tested. This PR changes no runtime behavior.

The Node 22.23.4 compatibility run also passed all 77 quiet performance-file tests (9.01 s),
including the same CPU and wall assertions. Its four-nation map wall median was 349.02 ms and
marching-day wall median 0.97 ms. An earlier compatibility launch stopped at formatting of the
new QA JSON, before tests; that file was formatted and the complete gate rerun successfully.
Actual GitHub Actions results are attached to the PR; local compatibility is not represented
as a remote CI result.

Machine-readable observations, exact commands, all paired samples, and selected per-test
measurements: [task3-results.json](task3-results.json). Measurement rules and load recipe:
[timing.md](timing.md).
