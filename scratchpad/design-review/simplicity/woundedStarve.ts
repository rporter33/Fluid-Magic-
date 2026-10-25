import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { advance } from '/home/user/Fluid-Magic-/src/sim/tick';
import { createCommander, createSquad } from '/home/user/Fluid-Magic-/src/sim/commanders';
import { provinceEconomy } from '/home/user/Fluid-Magic-/src/sim/selectors';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
const p = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const };
const s = createGame({ seed: 1, mapSize: 'medium', nations: [
  { nation: 'cinderHorde', pretender: p, ai: null },
  { nation: 'thornwood', pretender: p, ai: { difficulty: 'normal' } },
]});
const n0 = Object.values(s.nations)[0]!;
// a wasteland province, stuff it with a big army so it starves
const prov = Object.values(s.provinces).find(q => q.owner === null && s.map.provinces[q.id]!.terrain === 'wasteland')!;
const big = createCommander(s, 'ashChieftain', n0.id, prov.id);
big.squads.push(createSquad(s, 'cinderWarrior', 80));
const wounded = createSquad(s, 'cinderWarrior', 10);
wounded.hp = 60; // 10 survivors of a battle with 6 hp each on average (max 110)
big.squads.push(wounded);
const e = provinceEconomy(s, prov.id);
console.log('supply', e.supply.toFixed(1), 'used', e.supplyUsed);
advance(s);
console.log('after 1 starving day: wounded squad count', wounded.count, 'hp', wounded.hp.toFixed(1));
