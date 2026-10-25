import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { advance } from '/home/user/Fluid-Magic-/src/sim/tick';
import { nationEconomy } from '/home/user/Fluid-Magic-/src/sim/selectors';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
import type { NationId } from '/home/user/Fluid-Magic-/src/sim/ids';
const pre = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const };
function g() { return createGame({ seed: 1, mapSize: 'medium', nations: [
  { nation: 'cinderHorde', pretender: pre, ai: null }, { nation: 'thornwood', pretender: pre, ai: null }] }); }
for (const mode of ['normal', 'high', 'alternate', 'highNoPriest']) {
  const s = g(); const n = s.nations[Object.keys(s.nations)[0] as NationId]!; const cap = s.provinces[n.capital]!;
  if (mode === 'highNoPriest') for (const c of Object.values(s.commanders)) if (c.owner === n.id && c.holy > 0) c.location = s.map.provinces[n.capital]!.neighbors[0]!;
  let gold = 0;
  for (let d = 0; d < 720; d++) {
    cap.taxRate = mode === 'normal' ? 'normal' : mode === 'alternate' ? (Math.floor(d / 30) % 2 ? 'normal' : 'high') : 'high';
    gold += nationEconomy(s, n.id).gold / 30; advance(s);
  }
  console.log(mode.padEnd(13), 'gold income over 24 months', gold.toFixed(0), 'capital unrest', cap.unrest.toFixed(1));
}
