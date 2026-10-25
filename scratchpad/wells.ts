import { generateMap } from '../../../../../home/user/Fluid-Magic-/src/mapgen/generate';
import { bfsDistances } from '../../../../../home/user/Fluid-Magic-/src/mapgen/graph';
const R = { color: 'R', terrain: 'plains', name: 'Kharnath' } as const, G = { color: 'G', terrain: 'forest', name: 'Deepmoss' } as const;
for (const [size, caps] of [['small', [R, G]], ['medium', [R, G]], ['large', [R, G]], ['medium', [R, G, R]], ['medium', [R, G, R, G]], ['small', [R, G, R, G]]] as const) {
  const h: Record<number, number> = {};
  for (let seed = 1; seed <= 100; seed++) {
    const m = generateMap({ seed, size, capitals: caps as any });
    const ps = Object.values(m.provinces); const idx = new Map(ps.map((p, i) => [p.id, i]));
    const adj = ps.map(p => p.neighbors.map(n => idx.get(n)!));
    const w = m.wellsprings.map(id => idx.get(id)!);
    let min = 99; for (const a of w) { const d = bfsDistances(adj, [a]); for (const b of w) if (a !== b) min = Math.min(min, d[b]!); }
    h[min] = (h[min] ?? 0) + 1;
  }
  console.log(size, caps.length, 'min wellspring separation hist', JSON.stringify(h));
}
