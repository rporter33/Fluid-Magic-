import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { advance } from '/home/user/Fluid-Magic-/src/sim/tick';
import { nationEconomy } from '/home/user/Fluid-Magic-/src/sim/selectors';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
const p = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const };
const s = createGame({ seed: 1, mapSize: 'medium', nations: [
  { nation: 'cinderHorde', pretender: p, ai: null },
  { nation: 'thornwood', pretender: p, ai: { difficulty: 'normal' } },
]});
const n0 = Object.values(s.nations)[0]!;
const e = nationEconomy(s, n0.id);
console.log('income/day', (e.gold/30).toFixed(3), 'upkeep/day', (e.upkeep/30).toFixed(3));
n0.gold = -50;
advance(s);
console.log('gold after one day starting at -50:', n0.gold.toFixed(3), 'unpaidDays', n0.unpaidDays.toFixed(3));
