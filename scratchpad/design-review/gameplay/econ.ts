import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { allProvinceEconomies, fortMaterials, nationEconomy } from '/home/user/Fluid-Magic-/src/sim/selectors';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
import { TERRAIN, TERRAIN_IDS } from '/home/user/Fluid-Magic-/src/content/terrain';
import type { NationId, ProvinceId } from '/home/user/Fluid-Magic-/src/sim/ids';

const pre = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const };
// supply by terrain at min/max pop, divisors 50/250/500
for (const t of TERRAIN_IDS) {
  const d = TERRAIN[t];
  const row = [50, 250, 500].map((div) => `${div}:${(d.supplyBase + d.startPop.min / div).toFixed(0)}-${(d.supplyBase + d.startPop.max / div).toFixed(0)}`);
  console.log(t.padEnd(10), row.join('  '));
}
for (const seed of [1, 2, 3, 4, 5]) {
  const s = createGame({ seed, mapSize: 'medium', nations: [
    { nation: 'cinderHorde', pretender: pre, ai: null },
    { nation: 'thornwood', pretender: pre, ai: null },
  ] });
  const econ = allProvinceEconomies(s);
  for (const n of Object.values(s.nations)) {
    const e = nationEconomy(s, n.id, econ);
    const fm = fortMaterials(s, n.capital, econ);
    const cap = s.provinces[n.capital]!;
    const ce = econ.get(n.capital)!;
    // own all neighbors
    const nb = s.map.provinces[n.capital]!.neighbors;
    for (const id of nb) s.provinces[id]!.owner = n.id;
    const fm2 = fortMaterials(s, n.capital, allProvinceEconomies(s));
    // gold if owning the 15 nearest provinces (BFS)
    const dist = new Map<ProvinceId, number>([[n.capital, 0]]);
    const q: ProvinceId[] = [n.capital];
    while (q.length) { const c = q.shift()!; for (const x of s.map.provinces[c]!.neighbors) if (!dist.has(x)) { dist.set(x, dist.get(c)! + 1); q.push(x); } }
    const near = [...dist.entries()].sort((a, b) => a[1] - b[1]).slice(0, 15).map(([id]) => id);
    let gold15 = 0; for (const id of near) gold15 += s.provinces[id]!.pop / 100;
    for (const id of nb) s.provinces[id]!.owner = null;
    console.log(`seed ${seed} ${n.name}: income ${e.gold.toFixed(1)} upkeep ${e.upkeep.toFixed(1)} mana ${JSON.stringify(e.mana)} capSupply ${ce.supply.toFixed(0)} used ${ce.supplyUsed} mats ${fm.perMonth.toFixed(1)} cap ${fm.cap.toFixed(0)} | all ${nb.length} nbrs owned: mats ${fm2.perMonth.toFixed(1)} | gold w/15 nearest ${gold15.toFixed(0)}`);
  }
}
