// How much of the map each nation has explored on day 0 (nation.explored after createGame): Medium two-nation games,
// seeds 1 to 20, through the tests' own fixture. Read-only use of the repo. Run from the repo root with npx tsx.
import { twoNationGame } from '/home/user/Fluid-Magic-/tests/sim/fixtures.ts';
const shares: number[] = [];
for (let seed = 1; seed <= 20; seed++) {
  const s = twoNationGame(seed);
  const n = Object.keys(s.provinces).length;
  for (const nation of Object.values(s.nations)) shares.push(nation.explored.length / n);
}
shares.sort((a, b) => a - b);
console.log(`Medium, 2 nations, seeds 1-20: explored on day 0 per nation: min ${(100 * shares[0]!).toFixed(0)}%, median ${(100 * shares[shares.length >> 1]!).toFixed(0)}%, max ${(100 * shares[shares.length - 1]!).toFixed(0)}%`);
