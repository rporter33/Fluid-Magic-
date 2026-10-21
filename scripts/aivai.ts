// Headless AI vs AI runner (docs/10-milestone-1.md acceptance 15):
// `npm run sim:aivai -- --games 20 --seed 1 [--months 100]`. Each game is Cinder Horde against
// Thornwood on a Medium map with both nations' default presets, the nation order alternating
// by game. It prints one line per game (winner, reason, months, end-of-game stats) and a summary.
import { parseArgs } from 'node:util';
import { nationDef } from '../src/content';
import { defaultPreset } from '../src/content/pretenders/presets';
import { TIME } from '../src/content/rules';
import { dummyPlayer } from '../src/ai/dummy';
import {
  runMatch,
  RUNNER_DEFAULTS,
  runnerSetups,
  tallyWins,
  type MatchResult,
} from '../src/ai/match';

const { values } = parseArgs({
  options: {
    games: { type: 'string', default: String(RUNNER_DEFAULTS.games) },
    seed: { type: 'string', default: String(RUNNER_DEFAULTS.seed) },
    months: { type: 'string', default: String(RUNNER_DEFAULTS.months) },
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

const results: MatchResult[] = [];
let totalMonths = 0;
let totalRefused = 0;
const started = performance.now();

for (const [game, setup] of runnerSetups(seed, games).entries()) {
  const match = runMatch(setup, dummyPlayer, months * TIME.daysPerMonth);
  const winner = match.result?.winner;
  const winnerName = winner ? (match.state.nations[winner]?.name ?? winner) : 'no winner';
  results.push(match);
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
const { wins, noWinner } = tallyWins(results);
const tally = Object.entries(wins)
  .map(([name, n]) => `${name} ${String(n)}`)
  .join(', ');
console.log(
  `${String(games)} games: ${tally}, no winner ${String(noWinner)}; mean ${(totalMonths / games).toFixed(1)} months; ` +
    `${String(totalRefused)} refused commands; ${seconds.toFixed(1)} s`,
);
