import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { advance } from '/home/user/Fluid-Magic-/src/sim/tick';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
import type { NationId } from '/home/user/Fluid-Magic-/src/sim/ids';

const pre = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const };
const s = createGame({ seed: 1, mapSize: 'medium', nations: [
  { nation: 'cinderHorde', pretender: pre, ai: null },
  { nation: 'thornwood', pretender: pre, ai: null },
] });
const [n0, n1] = Object.keys(s.nations) as NationId[];
const cap = s.provinces[s.nations[n1]!.capital]!;
for (let d = 0; d < 180; d++) advance(s);
console.log('Deepmoss pool after 180 days', cap.materials.toFixed(1));
cap.siege = { attacker: n0, wallHp: 300 };
advance(s);
console.log('after 1 day of siege', cap.materials.toFixed(1));
cap.siege = null;
advance(s);
console.log('siege lifted next day', cap.materials.toFixed(1));
// lose a neighbor: own neighbors first
const nb = s.map.provinces[cap.id]!.neighbors;
for (const id of nb) s.provinces[id]!.owner = n1;
for (let d = 0; d < 180; d++) advance(s);
console.log('with all neighbors owned, pool after 180 more days', cap.materials.toFixed(1));
for (const id of nb) s.provinces[id]!.owner = n0;
advance(s);
console.log('after neighbors captured, next day', cap.materials.toFixed(1));
// upkeep toggle: nation with deficit
const nat = s.nations[n1]!;
