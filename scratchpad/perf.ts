import { resolveBattle } from '/home/user/Fluid-Magic-/src/sim/battle/resolve';
import { createRng } from '/home/user/Fluid-Magic-/src/sim/rng';
import { setup, side, squad } from '/home/user/Fluid-Magic-/tests/sim/battle/fixtures';
const big = () => setup(
  side([squad('a0', 'cinderWarrior', 200), squad('a1', 'flameArcher', 100)]),
  side([squad('d0', 'warden', 200), squad('d1', 'longbowHunter', 100)]),
);
resolveBattle(big(), createRng(1));
const t = performance.now();
let rounds = 0;
for (let i = 0; i < 20; i++) rounds += resolveBattle(big(), createRng(i)).rounds;
console.log('ms per battle', (performance.now() - t) / 20, 'avg rounds', rounds / 20);
