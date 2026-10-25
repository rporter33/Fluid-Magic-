import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate';
import { TERRAIN } from '/home/user/Fluid-Magic-/src/content/terrain';
import { nationDef } from '/home/user/Fluid-Magic-/src/content';
const defs = ['cinderHorde', 'thornwood'].map((n) => nationDef(n as never));
for (const div of [50, 100, 150, 250]) {
  let indep = 0, over = 0, lost = 0, total = 0, wells = 0, wOver = 0; const wLeft: number[] = [];
  const byT: Record<string, number> = {};
  for (let seed = 1; seed <= 40; seed++) {
    const map = generateMap({ seed, size: 'medium', capitals: defs.map((d) => ({ color: d.color, terrain: d.capitalTerrain, name: d.capitalName })) });
    for (const p of Object.values(map.provinces)) {
      if (p.capitalSlot !== undefined) continue;
      const supply = TERRAIN[p.terrain].supplyBase + p.startPop / div;
      const giant = p.terrain === 'mountains' && p.capitalDistance >= 3 ? 2 : 0;
      const need = p.independentStrength + 1 + giant;
      indep++; total += p.independentStrength;
      if (p.wellspring) wells++;
      if (need > supply) {
        over++; const l = Math.ceil(need - supply); lost += Math.min(l, p.independentStrength);
        byT[p.terrain] = (byT[p.terrain] ?? 0) + 1;
        if (p.wellspring) { wOver++; wLeft.push(Math.max(0, p.independentStrength - l)); }
      }
    }
  }
  console.log(`pop/${div}: over ${over}/${indep} (${(100*over/indep).toFixed(1)}%), troops lost ${lost}/${total} (${(100*lost/total).toFixed(1)}%), wellsprings over ${wOver}/${wells}, left: ${wLeft.join(',')}`, byT);
}
