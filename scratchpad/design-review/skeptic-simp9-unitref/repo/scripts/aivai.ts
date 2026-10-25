// Headless AI vs AI runner: `npm run sim:aivai -- --games 20 --seed 1`.
// The match loop arrives in Phase 6 (dummy AI) and Phase 7 (real AI). Until then this only
// parses its arguments so the npm script and its interface exist from the start.
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    games: { type: 'string', default: '20' },
    seed: { type: 'string', default: '1' },
  },
});

const games = Number(values.games);
const seed = Number(values.seed);
if (!Number.isInteger(games) || games < 1 || !Number.isInteger(seed)) {
  console.error('usage: npm run sim:aivai -- --games <n >= 1> --seed <integer>');
  process.exit(1);
}

console.log(`sim:aivai: ${games} games from seed ${seed} requested.`);
console.log('The headless runner is not implemented yet (Phase 6).');
