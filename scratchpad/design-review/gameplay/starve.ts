import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { createCommander, createSquad } from '/home/user/Fluid-Magic-/src/sim/commanders';
import { advance } from '/home/user/Fluid-Magic-/src/sim/tick';
import { allProvinceEconomies } from '/home/user/Fluid-Magic-/src/sim/selectors';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
import type { NationId } from '/home/user/Fluid-Magic-/src/sim/ids';

const pre = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const };
function run(split: boolean, starveDays: number, troops: number) {
  const s = createGame({ seed: 1, mapSize: 'medium', nations: [
    { nation: 'cinderHorde', pretender: pre, ai: null },
    { nation: 'thornwood', pretender: pre, ai: null },
  ] });
  const n0 = Object.keys(s.nations)[0] as NationId;
  const p = Object.values(s.provinces).find((x) => s.map.provinces[x.id]!.terrain === 'wasteland' && x.owner === null)!;
  const supply = allProvinceEconomies(s).get(p.id)!.supply;
  const c = createCommander(s, 'ashChieftain', n0, p.id);
  // overload: troops so consumption > supply
  const total = Math.max(troops, Math.ceil(supply) + 5);
  if (split) for (let i = 0; i < total; i++) c.squads.push(createSquad(s, 'cinderWarrior', 1));
  else c.squads.push(createSquad(s, 'cinderWarrior', total));
  for (let d = 0; d < starveDays; d++) advance(s);
  const after = c.squads.reduce((a, q) => a + q.count, 0);
  const hp = c.squads.reduce((a, q) => a + q.hp, 0);
  return { supply: supply.toFixed(1), start: total, aliveAfterStarve: after, hp: hp.toFixed(0) };
}
for (const days of [10, 20, 30, 45]) {
  console.log(days, 'days  one squad:', JSON.stringify(run(false, days, 0)), ' split 1-troop squads:', JSON.stringify(run(true, days, 0)));
}
