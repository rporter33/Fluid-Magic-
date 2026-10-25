import { generateMap } from '../../../../../home/user/Fluid-Magic-/src/mapgen/generate';
import type { CapitalSpec } from '../../../../../home/user/Fluid-Magic-/src/mapgen/types';
import { bfsDistances } from '../../../../../home/user/Fluid-Magic-/src/mapgen/graph';
const R: CapitalSpec = { color: 'R', terrain: 'plains', name: 'Kharnath' };
const G: CapitalSpec = { color: 'G', terrain: 'forest', name: 'Deepmoss' };
const configs = [
  { size: 'small', caps: [R, G] }, { size: 'medium', caps: [R, G] }, { size: 'large', caps: [R, G] },
  { size: 'medium', caps: [R, G, R] }, { size: 'medium', caps: [R, G, R, G] }, { size: 'small', caps: [G, G, R, R] },
] as const;
for (const c of configs) {
  let fails = 0, totalMs = 0, maxMs = 0; const capD: number[] = []; const deg: number[] = []; const wellImb: number[] = [];
  const N = Number(process.argv[2] ?? 100);
  for (let seed = 1; seed <= N; seed++) {
    const t0 = performance.now();
    try {
      const m = generateMap({ seed, size: c.size, capitals: c.caps });
      const ms = performance.now() - t0; totalMs += ms; maxMs = Math.max(maxMs, ms);
      const ps = Object.values(m.provinces); const idx = new Map(ps.map((p, i) => [p.id, i]));
      const adj = ps.map(p => p.neighbors.map(n => idx.get(n)!));
      const ci = m.capitals.map(id => idx.get(id)!);
      for (let a = 0; a < ci.length; a++) { const d = bfsDistances(adj, [ci[a]!]); for (let b = a + 1; b < ci.length; b++) capD.push(d[ci[b]!]!); }
      ps.forEach(p => deg.push(p.neighbors.length));
      for (const w of m.wellsprings) { const i = idx.get(w)!; const ds = ci.map(c2 => bfsDistances(adj, [c2])[i]!); wellImb.push(Math.max(...ds) - Math.min(...ds)); }
    } catch (e) { fails++; if (fails < 3) console.log('  fail', seed, String(e).slice(0, 200)); }
  }
  const hist = (xs: number[]) => { const h: Record<number, number> = {}; xs.forEach(x => h[x] = (h[x] ?? 0) + 1); return JSON.stringify(h); };
  console.log(`${c.size} x${c.caps.length}: fails=${fails} avgMs=${(totalMs / (N - fails)).toFixed(1)} maxMs=${maxMs.toFixed(0)}`);
  console.log(`  capital dist hist ${hist(capD)}`);
  console.log(`  degree hist ${hist(deg)}`);
  console.log(`  wellspring imbalance hist ${hist(wellImb)}`);
}
