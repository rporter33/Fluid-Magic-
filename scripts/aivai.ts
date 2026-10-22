// Headless AI vs AI runner (docs/10-milestone-1.md acceptance 15):
// `npm run sim:aivai -- --games 20 --seed 1 [--months 100] [--presets <list>] [--wilds on|off]`.
// Each game is Cinder Horde against Thornwood on a Medium map with both nations' default presets,
// or those `--presets cinderHorde:<id>,thornwood:<id>` names, the nation order alternating by
// game, with impassable wild ranges when --wilds is on (default: RUNNER_DEFAULTS.wilds). It
// prints one line per game (winner, reason, months, end-of-game stats) and a summary.
// `npm run sim:aivai -- --matrix [--games 20] [--seed 1] [--wilds on|off]` plays the preset
// matrix instead (the 2026-10-21 pretender build spec, A.10): every preset against the opposing
// default, seeds `seed` to `seed + games - 1` in both nation orders, and prints its win table.
import { parseArgs } from 'node:util';
import { nationDef } from '../src/content';
import { TIME } from '../src/content/rules';
import { runAi } from '../src/ai/ai';
import type { Player } from '../src/ai/driver';
import {
  runMatch,
  RUNNER_DEFAULTS,
  runnerSetups,
  tallyWins,
  type MatchResult,
} from '../src/ai/match';
import {
  matrixPairings,
  matrixSetups,
  matrixTable,
  pairingLabel,
  pairingResult,
  parsePresets,
  type PairingResult,
} from '../src/ai/matrix';
import { defaultPreset, type PresetDef } from '../src/content/pretenders/presets';
import type { GameSetup } from '../src/sim/types';

const { values } = parseArgs({
  options: {
    games: { type: 'string', default: String(RUNNER_DEFAULTS.games) },
    seed: { type: 'string', default: String(RUNNER_DEFAULTS.seed) },
    months: { type: 'string', default: String(RUNNER_DEFAULTS.months) },
    presets: { type: 'string' },
    matrix: { type: 'boolean', default: false },
    wilds: { type: 'string', default: RUNNER_DEFAULTS.wilds ? 'on' : 'off' },
  },
});

const usage =
  'usage: npm run sim:aivai -- --games <n >= 1> --seed <integer> [--months <n >= 1>] ' +
  '[--presets cinderHorde:<preset>,thornwood:<preset> | --matrix] [--wilds on|off]';
const games = Number(values.games);
const seed = Number(values.seed);
const months = Number(values.months);
if (
  !Number.isInteger(games) ||
  games < 1 ||
  !Number.isInteger(seed) ||
  !Number.isInteger(months) ||
  months < 1 ||
  (values.matrix && values.presets !== undefined) ||
  (values.wilds !== 'on' && values.wilds !== 'off')
) {
  console.error(usage);
  process.exit(1);
}
const wilds = values.wilds === 'on';

let presets: PresetDef[] = [];
try {
  presets = values.presets === undefined ? [] : parsePresets(values.presets);
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  console.error(usage);
  process.exit(1);
}

let totalRefused = 0;
const started = performance.now();

/** Milliseconds of every runAi call. */
const callMs: number[] = [];
const timedAi: Player = (state, nation) => {
  const start = performance.now();
  const commands = runAi(state, nation);
  callMs.push(performance.now() - start);
  return commands;
};

/** Plays one game and prints its line. */
function play(label: string, setup: GameSetup, chosen: readonly PresetDef[]): MatchResult {
  const match = runMatch(setup, timedAi, months * TIME.daysPerMonth);
  const winner = match.result?.winner;
  const winnerName = winner ? (match.state.nations[winner]?.name ?? winner) : 'no winner';
  totalRefused += match.refused.length;
  const names = setup.nations
    .map((n) => {
      const preset = chosen.find((p) => p.nation === n.nation) ?? defaultPreset(n.nation);
      return `${nationDef(n.nation).name} (${preset.name})`;
    })
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
    `${label} seed ${String(setup.seed)}: ${names} -> ${winnerName} ` +
      `(${match.reason}) after ${(match.days / TIME.daysPerMonth).toFixed(1)} months; ${stats}; ` +
      `${String(match.refused.length)} refused`,
  );
  return match;
}

/** The session's refusals, wall time and AI call times. */
function timing(): string {
  const seconds = (performance.now() - started) / 1000;
  const meanMs = callMs.reduce((sum, ms) => sum + ms, 0) / Math.max(callMs.length, 1);
  const maxMs = callMs.reduce((max, ms) => Math.max(max, ms), 0);
  return (
    `${String(totalRefused)} refused commands; ${seconds.toFixed(1)} s; AI ` +
    `${meanMs.toFixed(2)} ms mean, ${maxMs.toFixed(2)} ms max per call ` +
    `(${String(callMs.length)} calls)`
  );
}

function runner(): void {
  const results: MatchResult[] = [];
  for (const [game, setup] of runnerSetups(seed, games, presets, wilds).entries()) {
    results.push(play(`game ${String(game + 1)}`, setup, presets));
  }
  const { wins, noWinner } = tallyWins(results);
  const tally = Object.entries(wins)
    .map(([name, n]) => `${name} ${String(n)}`)
    .join(', ');
  const totalMonths = results.reduce((sum, m) => sum + m.days, 0) / TIME.daysPerMonth;
  console.log(
    `${String(games)} games${wilds ? ' with wilds' : ''}: ${tally}, no winner ${String(noWinner)}; ` +
      `mean ${(totalMonths / games).toFixed(1)} months; ${timing()}`,
  );
}

function matrix(): void {
  const rows: PairingResult[] = [];
  for (const pairing of matrixPairings()) {
    const label = pairingLabel(pairing);
    const results = matrixSetups(pairing, seed, games, wilds).map((setup, i) =>
      play(`${label}, game ${String(i + 1)}`, setup, pairing.presets),
    );
    rows.push(pairingResult(pairing, results));
  }
  console.log('');
  console.log(
    `Preset matrix: seeds ${String(seed)} to ${String(seed + games - 1)}, each in both nation ` +
      `orders, up to ${String(months)} months a game${wilds ? ', with wilds' : ''}.`,
  );
  for (const line of matrixTable(rows)) console.log(line);
  const out = rows.filter((r) => r.inBand === false).map((r) => pairingLabel(r.pairing));
  console.log(
    out.length === 0
      ? 'Every preset is within 35% to 65% against the opposing default.'
      : `Outside 35% to 65%: ${out.join('; ')}.`,
  );
  console.log(timing());
}

if (values.matrix) matrix();
else runner();
