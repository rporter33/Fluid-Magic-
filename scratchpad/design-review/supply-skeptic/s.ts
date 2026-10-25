import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate';
import { TERRAIN } from '/home/user/Fluid-Magic-/src/content/terrain';
const caps = [
  { color: 'R' as const, terrain: 'plains' as const, name: 'Kharnath' },
  { color: 'G' as const, terrain: 'forest' as const, name: 'Deepmoss' },
];
for (const div of [50, 100, 150, 250]) {
  let n = 0, s61 = 0, s81 = 0, s161 = 0, indStarve = 0, indN = 0;
  const byT: Record<string, { n: number; starve: number; min: number; max: number }> = {};
  const indStarveByT: Record<string, number> = {};
  for (let seed = 1; seed <= 10; seed++) {
    const m = generateMap({ seed, size: 'medium', capitals: caps });
    for (const p of Object.values(m.provinces)) {
      const sup = TERRAIN[p.terrain].supplyBase + p.startPop / div;
      n++;
      if (62 > sup) s61++;
      if (82 > sup) s81++;
      if (162 > sup) s161++;
      if (p.capitalDistance > 0) {
        indN++;
        const eat = p.independentStrength + 1;
        if (eat > sup) { indStarve++; indStarveByT[p.terrain] = (indStarveByT[p.terrain] ?? 0) + 1; }
      }
      const b = (byT[p.terrain] ??= { n: 0, starve: 0, min: 1e9, max: 0 });
      b.n++; b.min = Math.min(b.min, sup); b.max = Math.max(b.max, sup);
    }
  }
  console.log(`div ${div}: 61+1 starve ${(100*s61/n).toFixed(0)}%, 81+1 ${(100*s81/n).toFixed(0)}%, 161+1 ${(100*s161/n).toFixed(0)}%; independents starving at start ${indStarve}/${indN}`, JSON.stringify(indStarveByT));
  for (const [t, b] of Object.entries(byT)) console.log('  ', t, b.n, b.min.toFixed(0), '-', b.max.toFixed(0));
}
