import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate';
import { TERRAIN } from '/home/user/Fluid-Magic-/src/content/terrain';
let total = 0, starveAll = 0, wsTotal = 0, wsStarve = 0;
const deficits: string[] = [];
const byTerrain: Record<string, [number, number]> = {};
for (let seed = 1; seed <= 50; seed++) {
  const map = generateMap({ seed, size: 'medium', capitals: [
    { color: 'R', terrain: 'plains', name: 'Kharnath' },
    { color: 'G', terrain: 'forest', name: 'Deepmoss' },
  ] } as never);
  for (const p of Object.values(map.provinces)) {
    if (p.capitalSlot !== undefined) continue;
    total++;
    const supply = TERRAIN[p.terrain].supplyBase + p.startPop / 50;
    // giants in mountains d>=3 add 2 more (size 4 eats 3) -> approximate +2
    const giant = p.terrain === 'mountains' && p.capitalDistance >= 3 ? 2 : 0;
    const cons = p.independentStrength + 1 + giant;
    const bt = byTerrain[p.terrain] ?? [0, 0];
    bt[0]++;
    if (cons > supply) { starveAll++; bt[1]++; deficits.push(`${seed} ${p.terrain} ws=${!!p.wellspring} d=${p.capitalDistance} pop=${p.startPop} sup=${supply} cons=${cons}`); }
    byTerrain[p.terrain] = bt;
    if (p.wellspring) { wsTotal++; if (cons > supply) wsStarve++; }
  }
}
console.log({ total, starveAll, wsTotal, wsStarve, byTerrain });
console.log(deficits.join('\n'));
