import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate';
import { TERRAIN } from '/home/user/Fluid-Magic-/src/content/terrain';
import { SUPPLY } from '/home/user/Fluid-Magic-/src/content/rules';
let total = 0, starving = 0, wellStarve = 0, wellTotal = 0;
const lossHist: Record<number, number> = {};
const wellLoss: string[] = [];
let maxFrac = 0;
for (let seed = 1; seed <= 50; seed++) {
  const map = generateMap({ seed, size: 'medium', capitals: [
    { color: 'R', terrain: 'plains', name: 'Kharnath' },
    { color: 'G', terrain: 'forest', name: 'Deepmoss' },
  ] });
  for (const p of Object.values(map.provinces)) {
    if (p.capitalSlot !== undefined) continue;
    total++;
    const supply = TERRAIN[p.terrain].supplyBase + p.startPop / SUPPLY.popDivisor;
    const giant = p.terrain === 'mountains' && p.capitalDistance >= 3 ? 2 : 0;
    const eat = p.independentStrength + 1 + giant;
    if (p.wellspring) wellTotal++;
    if (eat > supply) {
      starving++;
      const loss = Math.ceil(eat - supply);
      lossHist[loss] = (lossHist[loss] ?? 0) + 1;
      maxFrac = Math.max(maxFrac, loss / p.independentStrength);
      if (p.wellspring) { wellStarve++; wellLoss.push(`seed ${seed} ${p.terrain} pop ${p.startPop} str ${p.independentStrength} supply ${supply} loss ${loss}`); }
    }
  }
}
console.log({ total, starving, wellTotal, wellStarve, maxFrac });
console.log(lossHist);
console.log(wellLoss.join('\n'));
