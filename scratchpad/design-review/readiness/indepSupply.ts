import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate';
import { TERRAIN } from '/home/user/Fluid-Magic-/src/content/terrain';
import { SUPPLY } from '/home/user/Fluid-Magic-/src/content/rules';
let total = 0, starving = 0, wellStarve = 0, wellTotal = 0;
const examples: string[] = [];
for (let seed = 1; seed <= 50; seed++) {
  const map = generateMap({ seed, size: 'medium', capitals: [
    { color: 'R', terrain: 'plains', name: 'Kharnath' },
    { color: 'G', terrain: 'forest', name: 'Deepmoss' },
  ] });
  for (const p of Object.values(map.provinces)) {
    if (p.capitalSlot !== undefined) continue;
    total++;
    const supply = TERRAIN[p.terrain].supplyBase + p.startPop / SUPPLY.popDivisor;
    // troops + 1 captain; a giant (size 4) eats 3 on mountains d>=3, ignore: lower bound
    const eat = p.independentStrength + 1;
    if (p.wellspring) wellTotal++;
    if (eat > supply) {
      starving++;
      if (p.wellspring) wellStarve++;
      if (examples.length < 8) examples.push(`seed ${seed} ${p.id} ${p.terrain} pop ${p.startPop} d${p.capitalDistance} str ${p.independentStrength} supply ${supply.toFixed(0)} eat ${eat}${p.wellspring ? ' WELLSPRING' : ''}`);
    }
  }
}
console.log({ total, starving, wellTotal, wellStarve });
console.log(examples.join('\n'));
