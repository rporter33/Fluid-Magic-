import { generateMap } from '../../../../../home/user/Fluid-Magic-/src/mapgen/generate';
import { bfsDistances } from '../../../../../home/user/Fluid-Magic-/src/mapgen/graph';
const R = { color: 'R', terrain: 'plains', name: 'Kharnath' } as const, G = { color: 'G', terrain: 'forest', name: 'Deepmoss' } as const;
for (const [size, caps] of [['small', [R, G]], ['medium', [R, G]], ['medium', [R, G, R]], ['medium', [R, G, R, G]]] as const) {
  const sep: Record<number, number> = {}; const fair: number[] = []; let fails = 0;
  for (let seed = 1; seed <= 100; seed++) {
    let m; try { m = generateMap({ seed, size, capitals: caps as any }); } catch { fails++; continue; }
    const ps = Object.values(m.provinces); const idx = new Map(ps.map((p, i) => [p.id, i]));
    const adj = ps.map(p => p.neighbors.map(n => idx.get(n)!));
    const w = m.wellsprings.map(id => idx.get(id)!);
    let min = 99; for (const a of w) { const d = bfsDistances(adj, [a]); for (const b of w) if (a !== b) min = Math.min(min, d[b]!); }
    sep[min] = (sep[min] ?? 0) + 1;
    // fairness: per capital, sum of distances to the k nearest wellsprings needed to win (2 of 3, 3 of 5)
    const need = w.length === 3 ? 2 : 3;
    const sums = m.capitals.map(c => { const d = bfsDistances(adj, [idx.get(c)!]); return w.map(x => d[x]!).sort((a, b) => a - b).slice(0, need).reduce((s, x) => s + x, 0); });
    fair.push(Math.max(...sums) - Math.min(...sums));
  }
  const h: Record<number, number> = {}; fair.forEach(x => h[x] = (h[x] ?? 0) + 1);
  console.log(`W=${process.env.WSPREAD} ${size} x${caps.length} fails=${fails} sep=${JSON.stringify(sep)} unfairness(sum dist to needed wells)=${JSON.stringify(h)}`);
}
