// Do Phase 1 maps (no wilds) already have cut vertices? Uses the real generator.
import { generateMap } from '/home/user/Fluid-Magic-/src/mapgen/generate.ts';
const N = Number(process.argv[2] ?? 100);
function cuts(adj: number[][]): number {
  const n = adj.length; let count = 0;
  for (let v = 0; v < n; v++) {
    const start = v === 0 ? 1 : 0; const seen = new Array(n).fill(false); seen[v] = true; seen[start] = true; const q = [start];
    while (q.length) { const x = q.shift()!; for (const y of adj[x]!) if (!seen[y]) { seen[y] = true; q.push(y); } }
    if (seen.some((s) => !s)) count++;
  }
  return count;
}
for (const [size, nations] of [['small', 2], ['medium', 2], ['large', 2], ['medium', 3]] as const) {
  let withCut = 0, total = 0, minNb = 99;
  for (let seed = 1; seed <= N; seed++) {
    const caps = Array.from({ length: nations }, (_, k) => ({ color: (k % 2 ? 'G' : 'R') as 'G' | 'R', terrain: (k % 2 ? 'forest' : 'plains') as 'forest' | 'plains', name: k % 2 ? 'Deepmoss' + k : 'Kharnath' + k }));
    const map = generateMap({ seed, size, capitals: caps });
    const ps = Object.values(map.provinces); const idx = new Map(ps.map((p, i) => [p.id, i]));
    const adj = ps.map((p) => p.neighbors.map((n) => idx.get(n)!));
    const c = cuts(adj); if (c > 0) withCut++; total++;
    minNb = Math.min(minNb, ...adj.map((a) => a.length));
  }
  console.log(`${size}-${nations}: maps with a cut vertex ${withCut}/${total}; min neighbors seen ${minNb}`);
}
