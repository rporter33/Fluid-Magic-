import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { advance } from '/home/user/Fluid-Magic-/src/sim/tick';
import { createCommander, createSquad } from '/home/user/Fluid-Magic-/src/sim/commanders';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
const pre = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' } as const;
const s = createGame({ seed: 4, mapSize: 'medium', nations: [
  { nation: 'cinderHorde', pretender: { ...pre, scales: { ...NEUTRAL_SCALES } }, ai: null },
  { nation: 'thornwood', pretender: { ...pre, scales: { ...NEUTRAL_SCALES } }, ai: { difficulty: 'easy' } },
  { nation: 'cinderHorde', pretender: { ...pre, scales: { ...NEUTRAL_SCALES } }, ai: { difficulty: 'normal' } },
  { nation: 'thornwood', pretender: { ...pre, scales: { ...NEUTRAL_SCALES } }, ai: { difficulty: 'normal' } },
] } as never);
const nations = Object.keys(s.nations);
const provs = Object.keys(s.provinces);
for (let k = 0; k < 200; k++) {
  const c = createCommander(s, 'ashChieftain', nations[k % 4] as never, provs[k % provs.length] as never);
  c.squads.push(createSquad(s, 'cinderWarrior', 20));
  if (k % 10 === 0) c.order = { kind: 'pillage' };
}
for (const p of Object.values(s.provinces)) if (p.dominion.nation === null) p.dominion = { nation: nations[0] as never, strength: 3 };
for (let d = 0; d < 100; d++) advance(s);
const t0 = performance.now();
for (let d = 0; d < 1000; d++) advance(s);
console.log(((performance.now() - t0) / 1000).toFixed(3), 'ms/day', Object.keys(s.commanders).length, 'commanders', provs.length, 'provinces');
