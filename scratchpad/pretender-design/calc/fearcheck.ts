import { drn } from '/home/user/Fluid-Magic-/src/sim/drn';
import { createRng } from '/home/user/Fluid-Magic-/src/sim/rng';
const rng = createRng(7); const N = 400000;
for (const mor of [10, 12, 14]) { let br = 0; for (let i = 0; i < N; i++) if (mor + drn(rng) < 10 + drn(rng)) br++; console.log(`mor ${mor}: breaks ${(100 * br / N).toFixed(1)}% per forced check`); }
