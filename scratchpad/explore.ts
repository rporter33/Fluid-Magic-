import { defaultPreset } from '/home/user/fm-p6/src/content/pretenders/presets';
import type { NationDefId } from '/home/user/fm-p6/src/content';
import { dummyPlayer } from '/home/user/fm-p6/src/ai/dummy';
import { runMatch } from '/home/user/fm-p6/src/ai/match';
import type { GameSetup } from '/home/user/fm-p6/src/sim/types';
const NATIONS: readonly NationDefId[] = ['cinderHorde', 'thornwood'];
function setupFor(seed: number, game: number): GameSetup {
  const order = game % 2 === 0 ? NATIONS : [...NATIONS].reverse();
  return { seed: seed + game, mapSize: 'medium', nations: order.map((nation) => ({ nation, pretender: defaultPreset(nation).design, ai: { difficulty: 'normal' } })) };
}
for (const [g, days] of [[0, 300], [1, 300], [0, 3000], [1, 3000], [2, 3000], [3,3000]] as const) {
  const t = performance.now();
  const m = runMatch(setupFor(1, g), dummyPlayer, days);
  const types = new Map<string, number>();
  for (const l of m.log) types.set(l.command.type, (types.get(l.command.type) ?? 0) + 1);
  console.log(g, days, m.days, m.reason, m.result, m.refused.length, m.log.length, m.finalHash, JSON.stringify([...types]), JSON.stringify(m.summaries.map(s=>[s.provinces,s.battlesWon,s.wellsprings,s.eliminated])), (performance.now()-t).toFixed(0)+'ms');
}
