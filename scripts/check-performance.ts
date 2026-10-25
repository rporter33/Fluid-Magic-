// Quiet-run wall-clock acceptance, in addition to npm test's scheduling-independent CPU gate.
import { spawnSync } from 'node:child_process';

const result = spawnSync(
  process.execPath,
  [
    'node_modules/vitest/vitest.mjs',
    'run',
    'tests/mapgen/generate.perf.test.ts',
    'tests/sim/tick.test.ts',
    'tests/sim/battle/resolve.test.ts',
    'tests/sim/battle/rerun.test.ts',
    '--maxWorkers=1',
    '--reporter=default',
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit', env: { ...process.env, FLUID_PERF_WALL: '1' } },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
