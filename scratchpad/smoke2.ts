import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { advance } from '/home/user/Fluid-Magic-/src/sim/tick';
import { nationEconomy, provinceEconomy } from '/home/user/Fluid-Magic-/src/sim/selectors';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
const pretender = (dominion: number) => ({ chassis: 'titan', pips: { R: 4 }, dominion, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const });
const t0 = performance.now();
const s = createGame({ seed: 1, mapSize: 'medium', nations: [
  { nation: 'cinderHorde', pretender: pretender(5), ai: null },
  { nation: 'thornwood', pretender: pretender(5), ai: { difficulty: 'normal' } } ] });
console.log('createGame ms', (performance.now() - t0).toFixed(1), 'commanders', Object.keys(s.commanders).length, 'nextId', s.nextId);
for (const n of Object.values(s.nations)) {
  const e = nationEconomy(s, n.id); const cap = provinceEconomy(s, n.capital);
  console.log(n.name, 'gold/mo', e.gold.toFixed(1), 'upkeep', e.upkeep.toFixed(1), 'mana', JSON.stringify(e.mana), 'capital supply', cap.supply.toFixed(0), 'used', cap.supplyUsed, 'materials/mo', cap.materials.toFixed(1));
}
const t1 = performance.now();
for (let d = 0; d < 365; d++) advance(s);
const ms = performance.now() - t1;
console.log('365 days ms', ms.toFixed(1), 'per day', (ms / 365).toFixed(3));
for (const n of Object.values(s.nations)) {
  const cap = s.provinces[n.capital]!;
  console.log(n.name, 'gold', n.gold.toFixed(1), 'mana', JSON.stringify(Object.fromEntries(Object.entries(n.mana).map(([k, v]) => [k, +v.toFixed(1)]))), 'capital pop', cap.pop.toFixed(0), 'materials', cap.materials.toFixed(1), 'unpaid', n.unpaidDays);
}
console.log('messages', s.messages.length, 'json KB', (JSON.stringify(s).length / 1024).toFixed(0));
