import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { createCommander, createSquad } from '/home/user/Fluid-Magic-/src/sim/commanders';
import { advance } from '/home/user/Fluid-Magic-/src/sim/tick';
import { nationEconomy, unpaidMoralePenalty } from '/home/user/Fluid-Magic-/src/sim/selectors';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
import type { NationId } from '/home/user/Fluid-Magic-/src/sim/ids';

const pre = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const };
function game() {
  const s = createGame({ seed: 1, mapSize: 'medium', nations: [
    { nation: 'cinderHorde', pretender: pre, ai: null },
    { nation: 'thornwood', pretender: pre, ai: null },
  ] });
  const n0 = Object.keys(s.nations)[0] as NationId;
  const nat = s.nations[n0]!;
  const c = createCommander(s, 'ashChieftain', n0, nat.capital);
  c.squads.push(createSquad(s, "cinderWarrior", 340)); // +200/month upkeep
  return { s, nat };
}
{
  const { s, nat } = game();
  const e = nationEconomy(s, nat.id);
  console.log('income', e.gold.toFixed(1), 'upkeep', e.upkeep.toFixed(1));
  for (let d = 0; d < 300; d++) advance(s);
  console.log('after 300 days unpaidDays', nat.unpaidDays.toFixed(1), 'penalty', unpaidMoralePenalty(nat.unpaidDays), 'gold', nat.gold.toFixed(2));
  s.provinces[nat.capital]!.taxRate = 'high';
  advance(s);
  s.provinces[nat.capital]!.taxRate = 'normal';
  console.log('after one High-tax day unpaidDays', nat.unpaidDays.toFixed(1), 'penalty', unpaidMoralePenalty(nat.unpaidDays), 'unrest', s.provinces[nat.capital]!.unrest.toFixed(2));
}
// decision 17 all-or-nothing model
{
  const I = 250 / 30, U = 280 / 30; let g = 0, unpaid = 0, maxUnpaid = 0, paidTotal = 0;
  for (let d = 0; d < 365; d++) { g += I; if (g >= U) { g -= U; unpaid = 0; paidTotal += U; } else unpaid++; maxUnpaid = Math.max(maxUnpaid, unpaid); }
  console.log('decision-17 model, income 250 upkeep 280: max unpaidDays', maxUnpaid, 'fraction paid', (paidTotal / (U * 365)).toFixed(2));
  g = 0; unpaid = 0; maxUnpaid = 0; paidTotal = 0; const U2 = 750 / 30;
  for (let d = 0; d < 365; d++) { g += I; if (g >= U2) { g -= U2; unpaid = 0; paidTotal += U2; } else unpaid++; maxUnpaid = Math.max(maxUnpaid, unpaid); }
  console.log('decision-17 model, income 250 upkeep 750: max unpaidDays', maxUnpaid, 'fraction paid', (paidTotal / (U2 * 365)).toFixed(2));
}
