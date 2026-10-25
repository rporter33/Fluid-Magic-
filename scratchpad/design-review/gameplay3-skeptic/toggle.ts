import { addArmy, nationIds, runDays, twoNationGame, capitalOf } from '/home/user/Fluid-Magic-/tests/sim/fixtures';
import { nationEconomy } from '/home/user/Fluid-Magic-/src/sim/selectors';

for (const extra of [20, 60, 120, 300]) {
  const state = twoNationGame();
  const [red] = nationIds(state);
  const n = state.nations[red!]!;
  let left = extra;
  while (left > 0) { const k = Math.min(80, left); addArmy(state, red!, n.capital, 'cinderWarrior', k); left -= k; }
  n.gold = 0;
  const e0 = nationEconomy(state, red!);
  runDays(state, 120);
  const before = n.unpaidDays;
  const cap = capitalOf(state, red!);
  cap.taxRate = 'high';
  const eH = nationEconomy(state, red!);
  runDays(state, 1);
  const afterHigh = n.unpaidDays;
  cap.taxRate = 'normal';
  console.log(`extra ${extra}: income ${e0.gold.toFixed(1)} upkeep ${e0.upkeep.toFixed(1)} ratio ${(e0.gold/e0.upkeep).toFixed(2)} | unpaid@120 ${before.toFixed(1)} | highIncome ${eH.gold.toFixed(1)} -> unpaid after 1 High day ${afterHigh.toFixed(2)} unrest ${cap.unrest.toFixed(3)}`);
}
