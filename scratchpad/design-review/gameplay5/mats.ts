import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate';
import { TERRAIN } from '/home/user/Fluid-Magic-/src/content/terrain';
const caps = [
  { color: 'R' as const, terrain: 'plains' as const, name: 'Kharnath' },
  { color: 'G' as const, terrain: 'forest' as const, name: 'Deepmoss' },
];
for (let seed = 1; seed <= 10; seed++) {
  const map = generateMap({ seed, size: 'medium', capitals: caps });
  const out: string[] = [];
  map.capitals.forEach((cid, slot) => {
    const c = map.provinces[cid];
    const own = TERRAIN[c.terrain].materialsBase + c.startPop / 500;
    let nb = 0;
    for (const n of c.neighbors) { const p = map.provinces[n]; nb += 0.5 * (TERRAIN[p.terrain].materialsBase + p.startPop / 500); }
    // gold from nearest 15 by BFS
    const dist = new Map<string, number>([[cid, 0]]); const q = [cid];
    while (q.length) { const x = q.shift()!; for (const n of map.provinces[x].neighbors) if (!dist.has(n)) { dist.set(n, dist.get(x)! + 1); q.push(n); } }
    const nearest = [...dist.entries()].sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 15);
    const gold = nearest.reduce((s, [id]) => s + map.provinces[id as keyof typeof map.provinces].startPop / 100, 0);
    out.push(`${slot===0?'CH':'TW'} pop=${c.startPop} nbrs=${c.neighbors.length} own=${own.toFixed(0)} withNbrs=${(own+nb).toFixed(0)} gold15=${gold.toFixed(0)}`);
  });
  console.log(seed, out.join(' | '));
}
