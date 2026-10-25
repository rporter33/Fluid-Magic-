import { defaultPreset } from '/home/user/fm-p6/src/content/pretenders/presets';
import { dummyPlayer } from '/home/user/fm-p6/src/ai/dummy';
import { runMatch } from '/home/user/fm-p6/src/ai/match';
const setup = (seed: number) => ({
  seed, mapSize: 'medium' as const,
  nations: (['cinderHorde', 'thornwood'] as const).map((n) => ({ nation: n, pretender: defaultPreset(n).design, ai: { difficulty: 'normal' as const } })),
});
for (let seed = 1; seed <= 3; seed++) {
  const t = performance.now();
  const m = runMatch(setup(seed), dummyPlayer, 1200);
  console.log(seed, m.reason, m.result?.winner, 'days', m.days, 'refused', m.refused.length, m.refused.slice(0,3).map(r => r.error), 'applied', m.log.length, ((performance.now()-t)/m.days).toFixed(2), 'ms/day');
  console.log(JSON.stringify(m.summaries));
}
