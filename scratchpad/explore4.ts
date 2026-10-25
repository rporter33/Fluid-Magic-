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
const t0 = performance.now();
for (let g = 0; g < 30; g++) {
  const t = performance.now();
  const m = runMatch(setupFor(1, g), dummyPlayer, 1500);
  if (m.result) console.log(g, m.days, JSON.stringify(m.result), m.refused.length, (performance.now()-t).toFixed(0));
}
console.log('total', (performance.now()-t0).toFixed(0));
const m = runMatch(setupFor(1, 0), dummyPlayer, 240);
console.log('days at 120', m.log.filter(l => l.day === 120).length, m.log.filter(l => l.day > 120).length, m.log[0]);
