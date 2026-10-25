import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { createCommander, createSquad } from '/home/user/Fluid-Magic-/src/sim/commanders';
import { advance } from '/home/user/Fluid-Magic-/src/sim/tick';
import { allProvinceEconomies } from '/home/user/Fluid-Magic-/src/sim/selectors';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
const pre = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const };
for (let seed = 1; seed <= 40; seed++) {
  const s = createGame({ seed, mapSize: 'medium', nations: [
    { nation: 'cinderHorde', pretender: pre, ai: null },
    { nation: 'thornwood', pretender: pre, ai: null },
  ] } as never);
  const econ = allProvinceEconomies(s);
  for (const wid of s.map.wellsprings) {
    const supply = econ.get(wid)!.supply;
    if (supply >= 31) continue;
    const c = createCommander(s, 'independentCaptain' as never, null, wid);
    c.squads.push(createSquad(s, 'lightInfantry' as never, 30));
    for (let d = 0; d < 60; d++) advance(s);
    console.log(`seed ${seed} ${wid} ${s.map.provinces[wid]!.terrain} pop ${s.map.provinces[wid]!.startPop} supply ${supply.toFixed(1)} -> troops after 60 days: ${c.squads.reduce((a, q) => a + q.count, 0)}`);
  }
}
