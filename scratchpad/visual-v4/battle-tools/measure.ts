import { runAi } from './src/ai/ai';
import { runMatch, runnerSetups, RUNNER_DEFAULTS } from './src/ai/match';
import { TIME } from './src/content/rules';
import { UNITS } from './src/content/units/index';
import type { BattleSetup } from './src/sim/battle/types';
import { writeFileSync } from 'node:fs';
const g = globalThis as unknown as { __battles: { day: number; terrain: string; storm: unknown; setup: BattleSetup; rounds: number; winner: string }[] };
g.__battles = [];
const games = Number(process.argv[2] ?? 4);
const seed0 = Number(process.argv[3] ?? 1);
const out: unknown[] = [];
for (let i = 0; i < games; i++) {
  const setup = runnerSetups(seed0, games)[i];
  if (!setup) throw new Error('no setup');
  g.__battles = [];
  const t0 = Date.now();
  runMatch(setup, (st, n) => runAi(st, n), RUNNER_DEFAULTS.months * TIME.daysPerMonth);
  for (const b of g.__battles) {
    const side = (s: BattleSetup['attacker']) => ({
      troops: s.squads.reduce((a, q) => a + q.count, 0),
      squads: s.squads.length,
      cmd: s.commanders.length,
      maxSquad: Math.max(0, ...s.squads.map((q) => q.count)),
      big: [...s.squads.filter((q) => q.stats.size >= 3).map((q) => `${q.unit}x${q.count}`), ...s.commanders.filter((c) => c.stats.size >= 2).map((c) => c.unit)],
      rows: { front: s.squads.filter((q) => q.row === 'front').length, middle: s.squads.filter((q) => q.row === 'middle').length, rear: s.squads.filter((q) => q.row === 'rear').length },
      units: s.squads.map((q) => `${q.unit}:${q.count}:${q.row}`),
    });
    out.push({ game: i, day: b.day, terrain: b.terrain, storm: b.storm, rounds: b.rounds, a: side(b.setup.attacker), d: side(b.setup.defender), an: b.setup.attacker.nation, dn: b.setup.defender.nation });
  }
  console.error(`game ${i} ${g.__battles.length} battles ${(Date.now() - t0) / 1000}s`);
}
writeFileSync(process.argv[4] ?? 'battles.json', JSON.stringify(out));
void UNITS; void runAi;
