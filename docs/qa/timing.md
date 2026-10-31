# Timing-sensitive QA (Task 3, 2026-10-25)

## What the gate measures

`npm test` runs every correctness test and every performance workload. Nothing is skipped,
quarantined, retried, or conditioned on machine load. Performance tests measure **user + system
CPU time for their isolated Vitest fork**, using
[`process.cpuUsage`](https://nodejs.org/api/process.html#processcpuusagepreviousvalue), and independently record
`performance.now()` elapsed time. CPU accounting excludes time the OS does not schedule the
process. It includes V8 compilation/GC CPU, even work on V8 helper threads, so it can exceed wall
time. The forks pool is explicit; the helper rejects worker threads, where another test file's
CPU could contaminate the measurement. These are synchronous CPU-bound functions, not I/O or
async latency tests.

`npm run test:perf` runs all tests in the four performance-bearing files, one fork at a time,
with **both CPU and elapsed-time assertions**. CI runs this after the full suite on its quiet
runner. This separate mandatory CI step preserves the actual elapsed-time requirements;
passing the loaded CPU gate alone is not a claim that a busy machine meets UI latency targets.
Do not run the wall-clock acceptance command alongside stress workers and interpret a wall-only
failure as an algorithmic regression. Do not substitute a load-based budget multiplier.

Each benchmark emits a `[performance]` JSON record with every paired CPU/wall sample, both
medians, the target, and explicit headroom. CPU-only headroom, when present, never increases the
elapsed-time limit. No sample is dropped; no best-of selection or retry
can hide a sustained regression. Wall and CPU medians are computed independently from the same
samples, not by subtracting an estimated scheduling penalty.

| Workload | Sampling | Target | Additional headroom in the assertion |
|---|---|---|---|
| Medium map, 2 nations, wilds on | warm seed 99, then seeds 1–10, median | <150 ms | 0 |
| Medium map, 4 nations, wilds on | warm seed 99, then seeds 1–10, median | <1,000 ms | 0 |
| Heavy marching day | one full 60-day warm-up, then five copies of the same state; 60 days each; median of per-day batch means | <2 ms/day wall | CPU only: +2 ms (limit <4 ms); wall: 0; replaces the old 10 ms fastest-run guard |
| 300 vs 300, with/without mages | existing warm-up; three batches of seeds 0–4; median of batch means | <50 ms/battle | 0 |
| Immortal battle with detail | existing warm-up; median of five runs | 45 ms | existing 45 ms CI slack, exactly as docs/12 S1.6 (limit <90 ms) |

The map thresholds and seeds come from `docs/design/war-table.md` §1.9/R30; the marching and
resolver targets from `docs/06-architecture.md`; replay's existing slack from
`docs/12-battle-presentation.md` S1.6. The elapsed targets are unchanged or stricter.

The marching fixture's process CPU consumed about
1.6× its wall time in two normal full runs (2.10/1.30 and 2.01/1.25 ms/day), because summed V8
thread CPU is not single-thread elapsed time. A **CPU-only** factor of 2 (about 25% above the
observed ratio) gives a 4 ms limit, tighter than the original 10 ms guard. The elapsed target
remains 2 ms and is enforced in CI; a helper regression test ensures the CPU allowance cannot
leak into the wall assertion. The first two stricter-CPU trial failures are recorded in the
results, not discarded as successful retries. CPU medians still depend on CPU speed, V8 version, memory bandwidth, cache contention, and thermal limits;
this is scheduling-resistant measurement, not hardware normalization. Browser/laptop performance
and renderer frame budgets still need their own target-device measurements.

## Correctness versus watchdogs

- The termination sweeps still generate all 600 maps (100 seeds × three sizes × wilds off/on),
  require exact province counts and run every `validateMap` check. Their existing 60-second
  watchdog remains. That duration is not a generation-speed requirement.
- Point rejection already checks the exact RNG state after `2 * pointTries` words. The shortfall
  test now also requires exactly `MAPGEN.maxAttempts` generation attempts, retaining its error
  and normal-output assertions.
- The RNG-efficiency test now bounds its replay by `2 * 40 * pointTries` words and asserts the
  final state. Its existing fewer-than-1.1 draws/point assertion is unchanged. A broken replay
  fails by work count rather than spinning forever in the test itself.
- The busy-game determinism test still runs both complete 90-day games and compares their
  serialized states byte for byte. Its watchdog increases from 5 to 15 seconds: the unchanged
  baseline took 6.24 seconds under the controlled 36-burner load, so 15 seconds gives more than
  twice that observed duration. This is scheduling headroom, not permission to relax state equality.
- Other explicit timeouts are retained unless the measurements identify a failure. No global
  timeout increase, fewer seeds, reduced simulation horizons, or weaker content checks.

Vitest's elapsed timeout can report a slow synchronous callback after it returns; its timer
cannot preempt a JavaScript loop that never yields. Deterministic work-cap checks and the outer
CI job deadline remain important. No finite watchdog can guarantee completion under unlimited
CPU starvation, OOM, or a stopped process.

## Validation evidence

See `task3-results.md` and `task3-results.json` in this directory for the actual environment,
commands, failed test names and values, before/after suite results, and individual measurements.

## Reproducing CPU contention (Linux)

Install dependencies with `npm ci`. Use the same Node version for before/after comparisons.
The following pins four busy Node processes to each CPU available to the shell, then runs the
entire typecheck/lint/test gate. Use `factor = 1` for the first, milder reproduction; set it to
zero for a normal run. On the validation host the affinity contained 9 CPUs and the cgroup
quota was 8 CPUs; the heavy run therefore launched 36 burners. This is deliberately stronger
than matching the handoff's absolute load-average number on a different machine.

```sh
python3 - <<'PY'
import os, signal, subprocess
cpus = sorted(os.sched_getaffinity(0))
factor = 4
burners = []
run = None
try:
    for cpu in cpus:
        for _ in range(factor):
            burners.append(subprocess.Popen(
                ['taskset', '-c', str(cpu), 'node', '-e', 'for (;;) {}']))
    run = subprocess.Popen(
        ['bash', '-c', 'npm run typecheck && npm run lint && npm test '
         '-- --reporter=default --reporter=json --outputFile=/tmp/fluid-tests.json'],
        start_new_session=True)
    code = run.wait(timeout=1500)
finally:
    if run is not None and run.poll() is None:
        os.killpg(run.pid, signal.SIGTERM)
        run.wait()
    for p in burners:
        if p.poll() is None:
            p.terminate()
    for p in burners:
        p.wait()
raise SystemExit(code)
PY
```

Capture stdout/stderr and sample `os.getloadavg()` once per second to reproduce the evidence
record. The before runs used the identical pinned load around `npm test` at baseline `e2a9bcc`;
the after runs additionally included typecheck and lint under the same load. All burners were
terminated in `finally`. The 25-minute outer deadline bounds a non-yielding synchronous hang.

Once the burners have stopped, run `npm run test:perf`. This additional quiet acceptance command
asserts the original elapsed budgets as well as CPU budgets. Do not use it to certify a loaded
machine's elapsed response time. Its records explicitly show that difference.
