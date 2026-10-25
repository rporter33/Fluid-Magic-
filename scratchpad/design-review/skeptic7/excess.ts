import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate';
import { TERRAIN } from '/home/user/Fluid-Magic-/src/content/terrain';
import { SUPPLY } from '/home/user/Fluid-Magic-/src/content/rules';
const ex: number[] = []; const wex: number[] = [];
for (let seed = 1; seed <= 50; seed++) {
  const map = generateMap({ seed, size: 'medium', capitals: [
    { color: 'R', terrain: 'plains', name: 'Kharnath' },
    { color: 'G', terrain: 'forest', name: 'Deepmoss' },
  ] });
  for (const p of Object.values(map.provinces)) {
    if (p.capitalSlot !== undefined) continue;
    const supply = TERRAIN[p.terrain].supplyBase + p.startPop / SUPPLY.popDivisor;
    const eat = p.independentStrength + 1;
    if (eat > supply) { const lost = Math.ceil(eat - supply); ex.push(lost); if (p.wellspring) wex.push(lost); }
  }
}
ex.sort((a,b)=>a-b);
console.log({ n: ex.length, median: ex[Math.floor(ex.length/2)], max: ex[ex.length-1], wellLosses: wex });
