// Headless AI vs AI runner (docs/10-milestone-1.md acceptance 15):
// `npm run sim:aivai -- --games 20 --seed 1 [--months 100]`. Each game is Cinder Horde against
// Thornwood on a Medium map with both nations' default presets, the nation order alternating
// by game. It prints one line per game (winner, reason, months, end-of-game stats) and a summary.
import { parseArgs } from 'node:util';
import { nationDef } from '../src/content';
import { defaultPreset } from '../src/content/pretenders/presets';
import { TIME } from '../src/content/rules';
import { dummyPlayer } from '../src/ai/dummy';
import { runMatch, runnerSetup } from '../src/ai/match';

const { values } = parseArgs({
  options: {
    games: { type: 'string', default: '20' },
    seed: { type: 'string', default: '1' },
    months: { type: 'string', default: '100' },
  },
});

const games = Number(values.games);
const seed = Number(values.seed);
const months = Number(values.months);
if (
  !Number.isInteger(games) ||
  games < 1 ||
  !Number.isInteger(seed) ||
  !Number.isInteger(months) ||
  months < 1
) {
  console.error(
    'usage: npm run sim:aivai -- --games <n >= 1> --seed <integer> [--months <n >= 1>]',
  );
  process.exit(1);
}

const wins = new Map<string, number>();
let totalMonths = 0;
let totalRefused = 0;
const started = performance.now();

for (let game = 0; game < games; game++) {
  const setup = runnerSetup(seed, game);
  const match = runMatch(setup, dummyPlayer, months * TIME.daysPerMonth);
  const winner = match.result?.winner;
  const winnerName = winner ? (match.state.nations[winner]?.name ?? winner) : 'none';
  wins.set(winnerName, (wins.get(winnerName) ?? 0) + 1);
  const played = match.days / TIME.daysPerMonth;
  totalMonths += played;
  totalRefused += match.refused.length;
  const presets = setup.nations
    .map((n) => `${nationDef(n.nation).name} (${defaultPreset(n.nation).name})`)
    .join(' vs ');
  const stats = match.summaries
    .map(
      (s) =>
        `${s.name}: ${String(s.provinces)} prov, ${String(Math.floor(s.population))} pop, ` +
        `${String(s.battlesWon)}W/${String(s.battlesLost)}L, ${String(s.wellsprings)} springs` +
        (s.eliminated ? ', eliminated' : ''),
    )
    .join('; ');
  console.log(
    `game ${String(game + 1)} seed ${String(setup.seed)}: ${presets} -> ${winnerName} ` +
      `(${match.reason}) after ${played.toFixed(1)} months; ${stats}; ` +
      `${String(match.refused.length)} refused`,
  );
}

const seconds = (performance.now() - started) / 1000;
const tally = [...wins.entries()].map(([name, n]) => `${name} ${String(n)}`).join(', ');
console.log(
  `${String(games)} games: ${tally}; mean ${(totalMonths / games).toFixed(1)} months; ` +
    `${String(totalRefused)} refused commands; ${seconds.toFixed(1)} s`,
);
