import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { allProvinceEconomies } from '/home/user/Fluid-Magic-/src/sim/selectors';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
import { TERRAIN } from '/home/user/Fluid-Magic-/src/content/terrain';

const pre = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const };
let indep = 0, over = 0, wells = 0, wellsOver = 0, lossSum = 0, wellLoss: number[] = [];
const byTerrain: Record<string, [number, number]> = {};
const N = 40;
for (let seed = 1; seed <= N; seed++) {
  const s = createGame({ seed, mapSize: 'medium', nations: [
    { nation: 'cinderHorde', pretender: pre, ai: null },
    { nation: 'thornwood', pretender: pre, ai: null },
  ] } as never);
  const econ = allProvinceEconomies(s);
  for (const p of Object.values(s.map.provinces)) {
    if (p.capitalSlot !== undefined) continue;
    const e = econ.get(p.id)!;
    // base consumption: troops + captain; ignore giants (+2 each) as lower bound
    const need = p.independentStrength + 1;
    indep++;
    const bt = (byTerrain[p.terrain] ??= [0, 0]);
    bt[0]++;
    const isOver = need > e.supply;
    if (isOver) { over++; bt[1]++; lossSum += need - Math.floor(e.supply); }
    if (p.wellspring) {
      wells++;
      if (isOver) { wellsOver++; wellLoss.push(need - Math.floor(e.supply)); }
    }
  }
}
console.log({ N, indep, over, pctOver: (100*over/indep).toFixed(1), avgLossWhenOver: (lossSum/Math.max(1,over)).toFixed(1), wells, wellsOver, wellLoss });
console.log(byTerrain);
