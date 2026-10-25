import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { advance } from '/home/user/Fluid-Magic-/src/sim/tick';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
const p = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const };
const s = createGame({ seed: 1, mapSize: 'medium', nations: [
  { nation: 'cinderHorde', pretender: p, ai: null },
  { nation: 'thornwood', pretender: p, ai: { difficulty: 'normal' } },
]});
const n0 = Object.values(s.nations)[0]!;
const cap = s.provinces[n0.capital]!;
for (let i = 0; i < 120; i++) advance(s);
console.log('day', s.day, 'pool before siege', cap.materials.toFixed(1));
cap.siege = { attacker: Object.values(s.nations)[1]!.id, wallHp: 300 };
advance(s);
console.log('day', s.day, 'pool after one besieged day', cap.materials.toFixed(1));
cap.siege = null;
// pop drop: lose 50% pop
for (let i = 0; i < 120; i++) advance(s);
const before = cap.materials;
cap.pop = cap.pop * 0.5;
advance(s);
console.log('pool before/after halving pop', before.toFixed(1), cap.materials.toFixed(1));
// Fractional values in state
console.log('gold', n0.gold, 'pop', cap.pop, 'unpaidDays', n0.unpaidDays);
