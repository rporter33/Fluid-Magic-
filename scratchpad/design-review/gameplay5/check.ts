import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate';
import { TERRAIN } from '/home/user/Fluid-Magic-/src/content/terrain';
const T: any = TERRAIN as any;
for (let seed = 1; seed <= 10; seed++) {
  const m = generateMap({ seed, size: 'medium', capitals: [
    { color: 'R', terrain: 'plains', name: 'Kharnath' },
    { color: 'G', terrain: 'forest', name: 'Deepmoss' } ] } as any);
  const out: string[] = [];
  m.capitals.forEach((cid, i) => {
    const c = m.provinces[cid]!;
    const mat = (p: any) => T[p.terrain].materialsBase + p.startPop / 500;
    const own = mat(c);
    let nb = 0;
    for (const n of c.neighbors) nb += 0.5 * mat(m.provinces[n]!);
    // gold of 15 nearest by capitalDistance from this capital (BFS)
    const dist = new Map<string, number>([[cid, 0]]); const q = [cid];
    while (q.length) { const x = q.shift()!; for (const n of m.provinces[x]!.neighbors) if (!dist.has(n)) { dist.set(n, dist.get(x)! + 1); q.push(n); } }
    const near = [...dist.entries()].sort((a,b)=>a[1]-b[1]).slice(0,15);
    const gold = near.reduce((s,[id]) => s + m.provinces[id as any]!.startPop/100, 0);
    const capGold = c.startPop/100;
    out.push(`${i===0?'Horde':'Thorn'} nb=${c.neighbors.length} mat=${(own+nb).toFixed(0)} capOnlyMat=${own.toFixed(0)} gold15=${gold.toFixed(0)} capGold=${capGold}`);
  });
  console.log(seed, out.join(' | '));
}
